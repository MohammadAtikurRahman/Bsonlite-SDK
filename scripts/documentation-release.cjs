'use strict';
// A documentation/public-metadata overlay on a pinned, Windows-validated release.
// Engine, SDK, matching source, licenses and runtime reports stay byte-identical.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { readPackageMetadata } = require('./package-metadata.cjs');
const { spawnSync } = require('node:child_process');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const changed = new Set(['package.json', 'README.md', 'scripts/verify-modern.cjs', 'SHA256SUMS.txt']);
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || result.stdout || command + ' failed');
  return result.stdout;
}
function filesIn(root, relative = '', found = new Map()) {
  for (const name of fs.readdirSync(path.join(root, relative))) {
    const key = relative ? relative + '/' + name : name;
    const file = path.join(root, key), stat = fs.lstatSync(file);
    assert(!stat.isSymbolicLink(), 'Symbolic links are not allowed in a documentation release');
    if (stat.isDirectory()) filesIn(root, key, found);
    else { assert(stat.isFile()); found.set(key, fs.readFileSync(file)); }
  }
  return found;
}
function verifyExpected(root, expected) {
  const actual = filesIn(root);
  assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort(), 'Repacked file list changed');
  for (const [name, bytes] of expected) assert.equal(sha(actual.get(name)), sha(bytes), 'Repacked bytes changed: ' + name);
}
function prepareDocumentationRelease(root, base, snapshot) {
  const manifestFile = path.join(root, 'release/documentation.json');
  if (!fs.existsSync(manifestFile)) return base;
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  assert.equal(manifest.format, 1);
  assert.equal(manifest.baseVersion, base.version, 'Documentation overlay targets a different base version');
  assert.equal(manifest.baseSha256, snapshot.sha256, 'Documentation overlay targets a different base archive');
  assert.match(manifest.version, /^0\.7\.0-(alpha|beta|rc)\.\d+$/);
  assert.notEqual(manifest.version, base.version, 'Published versions cannot be reused');
  // Git may check text out with CRLF on Windows; the reviewed canonical bytes use LF.
  const readme = Buffer.from(fs.readFileSync(path.join(root, 'README.md'), 'utf8').replace(/\r\n/g, '\n'));
  assert.equal(sha(readme), manifest.readmeSha256, 'README changed: explicitly refresh the documentation release manifest');
  const metadata = manifest.metadataSha256 === undefined ? {} : readPackageMetadata(root, manifest.metadataSha256);
  assert(process.env.npm_execpath && fs.existsSync(process.env.npm_execpath), 'Run release preparation through npm run release:verify');
  const temporary = fs.mkdtempSync(path.join(root, '.release', '.documentation-'));
  try {
    // This input has already passed the complete pinned archive checksum and evidence checks.
    run('tar', ['-xzf', base.file, '-C', temporary], root);
    const prepared = path.join(temporary, 'package');
    const originals = filesIn(prepared);
    const pkg = JSON.parse(originals.get('package.json').toString('utf8'));
    assert.equal(pkg.version, manifest.baseVersion);
    pkg.version = manifest.version;
    Object.assign(pkg, metadata);
    fs.writeFileSync(path.join(prepared, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
    fs.writeFileSync(path.join(prepared, 'README.md'), readme);
    const verifierFile = path.join(prepared, 'scripts/verify-modern.cjs');
    let verifier = fs.readFileSync(verifierFile, 'utf8');
    const match = verifier.match(/expected=(\{[^\n]+\});/);
    assert(match, 'Unrecognized original integrity verifier');
    const hashes = JSON.parse(match[1]);
    for (const [name, hash] of Object.entries(hashes)) {
      assert(originals.has(name), 'Missing original integrity input: ' + name);
      assert.equal(sha(originals.get(name)), hash, 'Original integrity input changed: ' + name);
    }
    for (const name of ['README.md', 'package.json']) {
      assert(Object.hasOwn(hashes, name), 'Original verifier must protect ' + name);
      hashes[name] = sha(fs.readFileSync(path.join(prepared, name)));
    }
    verifier = verifier.replace(match[0], 'expected=' + JSON.stringify(hashes) + ';');
    fs.writeFileSync(verifierFile, verifier);
    const sumLines = originals.get('SHA256SUMS.txt').toString('utf8').trimEnd().split('\n');
    const sums = sumLines.map(line => {
      const m = line.match(/^([a-f0-9]{64})  (.+)$/);
      assert(m && originals.has(m[2]), 'Invalid original checksum list');
      assert.equal(sha(originals.get(m[2])), m[1], 'Original checksum mismatch: ' + m[2]);
      return sha(fs.readFileSync(path.join(prepared, m[2]))) + '  ' + m[2];
    }).join('\n') + '\n';
    fs.writeFileSync(path.join(prepared, 'SHA256SUMS.txt'), sums);
    const expected = filesIn(prepared);
    assert.deepEqual([...expected.keys()].sort(), [...originals.keys()].sort());
    for (const [name, bytes] of originals) {
      if (!changed.has(name)) assert.equal(sha(expected.get(name)), sha(bytes), 'Documentation release changed runtime input: ' + name);
    }
    run(process.execPath, [process.env.npm_execpath, 'pack', '--ignore-scripts', '--json', '--pack-destination', temporary], prepared);
    const packed = path.join(temporary, 'bsonlite-sdk-' + manifest.version + '.tgz');
    const unpack = path.join(temporary, 'check'); fs.mkdirSync(unpack);
    run('tar', ['-xzf', packed, '-C', unpack], root);
    verifyExpected(path.join(unpack, 'package'), expected);
    const destination = path.join(root, '.release', path.basename(packed));
    // Always reconstruct and compare. Never trust an edited cached archive.
    if (fs.existsSync(destination)) {
      assert.equal(sha(fs.readFileSync(destination)), sha(fs.readFileSync(packed)), 'Cached documentation archive changed; remove it and run release:verify again');
    } else fs.renameSync(packed, destination);
    return { ...base, version: manifest.version, file: destination, documentationOnly: true, baseVersion: base.version };
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
module.exports = { prepareDocumentationRelease };
