'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const NAME = 'bsonlite-sdk';
const REPOSITORY = 'MohammadAtikurRahman/BsonLite';
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const validHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const REPORTS = {
  sourceNative: ['source-native.xml', 7],
  runtimeAndMigration: ['runtime.xml', 3],
  finalNative: ['final-native.xml', 9]
};
function loadSnapshot(root) {
  const file = path.join(root, 'release/snapshot.json');
  assert(fs.statSync(file).size < 1024 * 1024, 'Release snapshot is too large');
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(value.format, 1);
  assert.equal(value.packageName, NAME);
  assert.match(value.version, /^0\.7\.0-(alpha|beta|rc)\.\d+$/);
  assert.equal(value.engineVersion, '9.0.4');
  assert.equal(value.driverVersion, '7.7.0');
  assert.equal(value.tag, 'next');
  assert.match(value.coreCommit, /^[a-f0-9]{40}$/);
  assert.match(String(value.coreRunId), /^\d+$/);
  assert(validHash(value.sha256), 'Invalid release tarball hash');
  assert(Number.isSafeInteger(value.bytes) && value.bytes > 0 && value.bytes < 256 * 1024 * 1024, 'Invalid release tarball size');
  assert(Array.isArray(value.parts) && value.parts.length > 0 && value.parts.length <= 128, 'Invalid release parts');
  return value;
}
function assemble(root, snapshot) {
  const destination = path.join(root, '.release', NAME + '-' + snapshot.version + '.tgz');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(destination)) return destination;
  const temporary = destination + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, 'wx', 0o600);
    const hash = crypto.createHash('sha256'), seen = new Set();
    let total = 0;
    for (const part of snapshot.parts) {
      assert(typeof part.path === 'string' && /^release\/packed\/npm-[0-9]{4}\.part$/.test(part.path) && !seen.has(part.path), 'Invalid release part path');
      seen.add(part.path);
      assert(Number.isSafeInteger(part.bytes) && part.bytes > 0 && part.bytes <= 8 * 1024 * 1024 && validHash(part.sha256), 'Invalid release part metadata');
      const file = path.join(root, part.path);
      assert(fs.existsSync(file), 'Missing release part: ' + part.path + '. Run git pull before preparing the release.');
      const stat = fs.lstatSync(file);
      assert(stat.isFile() && !stat.isSymbolicLink(), 'Unsafe release part: ' + part.path);
      const bytes = fs.readFileSync(file);
      assert.equal(bytes.length, part.bytes, 'Release part size mismatch: ' + part.path);
      assert.equal(sha256(bytes), part.sha256, 'Release part checksum mismatch: ' + part.path);
      total += bytes.length;
      assert(total <= snapshot.bytes, 'Release parts exceed expected size');
      hash.update(bytes);
      let written = 0;
      while (written < bytes.length) written += fs.writeSync(descriptor, bytes, written, bytes.length - written);
    }
    assert.equal(total, snapshot.bytes, 'Release tarball size mismatch');
    assert.equal(hash.digest('hex'), snapshot.sha256, 'Release tarball checksum mismatch');
    fs.closeSync(descriptor); descriptor = undefined;
    if (fs.existsSync(destination)) {
      assert.equal(sha256(fs.readFileSync(destination)), snapshot.sha256, 'A different release archive already exists');
    } else fs.renameSync(temporary, destination);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    fs.rmSync(temporary, { force: true });
  }
  return destination;
}
function readTarFiles(buffer) {
  const files = new Map();
  const needed = new Set(['package/package.json', 'package/build-info.json', 'package/validation.json',
    'package/BsonLite.cjs', 'package/source/BsonLite-modern-engine-source.tar.gz',
    ...Object.values(REPORTS).map(([name]) => 'package/validation/' + name)]);
  let position = 0;
  while (position + 512 <= buffer.length) {
    const header = buffer.subarray(position, position + 512);
    if (header.every(byte => byte === 0)) break;
    const read = (start, length) => header.subarray(start, start + length).toString('utf8').replace(/\0.*$/s, '');
    const sizeText = read(124, 12).trim(), checksumText = read(148, 8).trim();
    assert(/^[0-7]+$/.test(sizeText) && /^[0-7]+$/.test(checksumText), 'Invalid npm tar header');
    const size = parseInt(sizeText, 8);
    let checksum = 0;
    for (let i = 0; i < 512; i++) checksum += i >= 148 && i < 156 ? 32 : header[i];
    assert.equal(checksum, parseInt(checksumText, 8), 'Invalid npm tar checksum');
    assert(Number.isSafeInteger(size) && position + 512 + size <= buffer.length, 'Truncated npm tarball');
    const prefix = read(345, 155);
    const name = (prefix ? prefix + '/' : '') + read(0, 100);
    const type = read(156, 1);
    if (needed.has(name)) {
      assert(type === '0' || type === '', 'Release input is not a regular file: ' + name);
      assert(!files.has(name), 'Duplicate release input: ' + name);
      files.set(name, buffer.subarray(position + 512, position + 512 + size));
    }
    position += 512 + Math.ceil(size / 512) * 512;
  }
  for (const name of needed) assert(files.has(name), 'Missing release input: ' + name);
  return files;
}
function verifyTarball(file, snapshot) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.length, snapshot.bytes, 'Local release tarball size mismatch');
  assert.equal(sha256(bytes), snapshot.sha256, 'Local release tarball checksum mismatch');
  const files = readTarFiles(zlib.gunzipSync(bytes, { maxOutputLength: 512 * 1024 * 1024 }));
  const json = name => {
    const value = files.get('package/' + name);
    assert(value.length <= 1024 * 1024, 'Release JSON is too large');
    return JSON.parse(value.toString('utf8'));
  };
  const pkg = json('package.json'), build = json('build-info.json'), validation = json('validation.json');
  assert.equal(pkg.name, NAME); assert.equal(pkg.version, snapshot.version);
  assert(!pkg.private, 'Release package is private');
  assert.equal(pkg.publishConfig?.tag, 'next'); assert.equal(pkg.publishConfig?.access, 'public');
  assert.equal(build.nativeReady, true); assert.equal(build.distributionMode, 'native-encrypted');
  assert.equal(build.engineVersion, snapshot.engineVersion); assert.equal(build.driverVersion, snapshot.driverVersion);
  assert.equal(validation.status, 'experimental-validated');
  assert.equal(validation.repository, REPOSITORY); assert.equal(validation.commit, snapshot.coreCommit);
  assert.equal(validation.run, 'https://github.com/' + REPOSITORY + '/actions/runs/' + snapshot.coreRunId);
  assert.equal(validation.engineVersion, snapshot.engineVersion); assert.equal(validation.driverVersion, snapshot.driverVersion);
  assert.equal(sha256(files.get('package/BsonLite.cjs')), validation.sdkSha256);
  assert.equal(sha256(files.get('package/source/BsonLite-modern-engine-source.tar.gz')), validation.modifiedEngineSourceSha256);
  for (const [name, [filename, count]] of Object.entries(REPORTS)) {
    assert.equal(validation.reports?.[name]?.requiredPassed, count, 'Missing release runtime evidence: ' + name);
    assert.equal(sha256(files.get('package/validation/' + filename)), validation.reports[name].reportSha256);
  }
  return { name: pkg.name, version: pkg.version, engine: build.engineVersion, driver: build.driverVersion, file };
}
function prepareRelease(root) {
  root = path.resolve(root);
  const snapshot = loadSnapshot(root);
  const file = assemble(root, snapshot);
  const release = verifyTarball(file, snapshot);
  return { ...release, tag: snapshot.tag };
}
function stageArguments(file) {
  return ['stage', 'publish', path.resolve(file), '--access', 'public', '--tag', 'next'];
}
function main(args = process.argv.slice(2), root = path.resolve(__dirname, '..')) {
  const command = args[0] || 'verify', dryRun = args.includes('--dry-run');
  assert(['verify', 'stage'].includes(command) && args.slice(1).every(arg => arg === '--dry-run'), 'Use npm run release:verify or npm run release:stage');
  const release = prepareRelease(root);
  console.log('Verified ' + release.name + '@' + release.version + ' | engine ' + release.engine + ' | driver ' + release.driver + ' | tag ' + release.tag);
  if (command === 'verify') return 0;
  const stage = stageArguments(release.file);
  if (dryRun) {
    console.log('Dry run: npm stage publish ' + JSON.stringify(release.file) + ' --access public --tag next');
    return 0;
  }
  assert(process.env.npm_execpath && fs.existsSync(process.env.npm_execpath), 'Run staging through npm run release:stage');
  console.log('Staging the verified modern tarball. Complete npm account authentication when requested.');
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...stage], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status === null ? 1 : result.status;
}
module.exports = { loadSnapshot, assemble, readTarFiles, verifyTarball, prepareRelease, stageArguments, main };
if (require.main === module) {
  try { process.exitCode = main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
