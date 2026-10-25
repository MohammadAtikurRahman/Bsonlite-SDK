'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { prepareRelease, stageArguments, main } = require('../scripts/local-release.cjs');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function tarFile(name, data) {
  const header = Buffer.alloc(512);
  const octal = (number, width) => number.toString(8).padStart(width - 1, '0') + '\0';
  header.write(name, 0, 100); header.write(octal(0o644, 8), 100);
  header.write(octal(0, 8), 108); header.write(octal(0, 8), 116);
  header.write(octal(data.length, 12), 124); header.write(octal(0, 12), 136);
  header.fill(32, 148, 156); header.write('0', 156); header.write('ustar\0', 257);
  header.write(header.reduce((total, byte) => total + byte, 0).toString(8).padStart(6, '0') + '\0 ', 148);
  return Buffer.concat([header, data, Buffer.alloc((512 - data.length % 512) % 512)]);
}
function fixture(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bsonlite-local-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  // Synthetic archives never execute an engine or contact a registry.
  const sdk = Buffer.from('synthetic SDK fixture'), source = Buffer.from('synthetic matching source');
  const reports = { sourceNative: ['source-native.xml', 7], runtimeAndMigration: ['runtime.xml', 3], finalNative: ['final-native.xml', 9] };
  const pkg = { name: 'bsonlite-sdk', version: '0.7.0-alpha.0', publishConfig: { access: 'public', tag: 'next' } };
  const build = { nativeReady: options.preview ? false : true, distributionMode: options.preview ? 'source-preview' : 'native-encrypted', engineVersion: '9.0.4', driverVersion: '7.7.0' };
  const validation = { status: 'experimental-validated', repository: 'MohammadAtikurRahman/BsonLite', commit: 'a'.repeat(40), run: 'https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/42', engineVersion: '9.0.4', driverVersion: '7.7.0', sdkSha256: options.wrongSdk ? '0'.repeat(64) : sha(sdk), modifiedEngineSourceSha256: sha(source), reports: {} };
  const values = { 'package/BsonLite.cjs': sdk, 'package/source/BsonLite-modern-engine-source.tar.gz': source };
  for (const [key, [name, count]] of Object.entries(reports)) {
    const data = Buffer.from('<testsuite name="' + name + '"/>');
    validation.reports[key] = { requiredPassed: count, reportSha256: sha(data) };
    values['package/validation/' + name] = data;
  }
  values['package/package.json'] = Buffer.from(JSON.stringify(pkg));
  values['package/build-info.json'] = Buffer.from(JSON.stringify(build));
  values['package/validation.json'] = Buffer.from(JSON.stringify(validation));
  const archive = zlib.gzipSync(Buffer.concat([...Object.entries(values).map(([name, data]) => tarFile(name, data)), Buffer.alloc(1024)]));
  const parts = [];
  fs.mkdirSync(path.join(root, 'release/packed'), { recursive: true });
  for (let offset = 0; offset < archive.length; offset += 97) {
    const bytes = archive.subarray(offset, offset + 97), relative = 'release/packed/npm-' + String(parts.length + 1).padStart(4, '0') + '.part';
    fs.writeFileSync(path.join(root, relative), bytes);
    parts.push({ path: relative, bytes: bytes.length, sha256: sha(bytes) });
  }
  const snapshot = { format: 1, packageName: 'bsonlite-sdk', version: '0.7.0-alpha.0', engineVersion: '9.0.4', driverVersion: '7.7.0', tag: 'next', coreCommit: 'a'.repeat(40), coreRunId: 42, bytes: archive.length, sha256: sha(archive), parts };
  const save = () => fs.writeFileSync(path.join(root, 'release/snapshot.json'), JSON.stringify(snapshot));
  save();
  return { root, snapshot, archive, save };
}

test('local release reconstructs exact tarball bytes, checks metadata/evidence and reuses valid output', t => {
  const f = fixture(t), result = prepareRelease(f.root);
  assert.equal(result.version, '0.7.0-alpha.0'); assert.equal(result.engine, '9.0.4');
  assert.deepEqual(fs.readFileSync(result.file), f.archive);
  const before = fs.statSync(result.file).mtimeMs;
  assert.equal(prepareRelease(f.root).file, result.file);
  assert.equal(fs.statSync(result.file).mtimeMs, before);
});
test('a corrupt release part creates no ready tarball', t => {
  const f = fixture(t), file = path.join(f.root, f.snapshot.parts[0].path);
  const bytes = fs.readFileSync(file); bytes[0] ^= 1; fs.writeFileSync(file, bytes);
  assert.throws(() => prepareRelease(f.root), /part checksum mismatch/);
  assert.deepEqual(fs.readdirSync(path.join(f.root, '.release')), []);
});
test('a missing release part fails with its path', t => {
  const f = fixture(t);
  fs.rmSync(path.join(f.root, f.snapshot.parts[0].path));
  assert.throws(() => prepareRelease(f.root), /Missing release part/);
});
test('release part paths cannot escape the snapshot directory', t => {
  const f = fixture(t); f.snapshot.parts[0].path = 'release/packed/../../outside.part'; f.save();
  assert.throws(() => prepareRelease(f.root), /Invalid release part path/);
});
test('even an archive matching its outer hash cannot stage a source preview', t => {
  const f = fixture(t, { preview: true });
  assert.throws(() => prepareRelease(f.root));
});
test('release SDK bytes must match the original Windows validation digest', t => {
  const f = fixture(t, { wrongSdk: true });
  assert.throws(() => prepareRelease(f.root));
});
test('staging uses the modern tarball and dry-run never starts npm authentication', t => {
  const f = fixture(t), ready = prepareRelease(f.root);
  assert.deepEqual(stageArguments(ready.file), ['stage', 'publish', ready.file, '--access', 'public', '--tag', 'next']);
  const previous = process.env.npm_execpath;
  delete process.env.npm_execpath;
  t.mock.method(console, 'log', () => {});
  try { assert.equal(main(['stage', '--dry-run'], f.root), 0); }
  finally { if (previous !== undefined) process.env.npm_execpath = previous; }
});
test('a modified prepared tarball is rejected and left intact', t => {
  const f = fixture(t), ready = prepareRelease(f.root);
  fs.appendFileSync(ready.file, 'changed');
  const changed = fs.readFileSync(ready.file);
  assert.throws(() => prepareRelease(f.root), /tarball size mismatch/);
  assert.deepEqual(fs.readFileSync(ready.file), changed);
});
