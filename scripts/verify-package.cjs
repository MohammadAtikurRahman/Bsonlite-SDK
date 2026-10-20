'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name));
const json = name => JSON.parse(read(name).toString('utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const pkg = json('package.json');
const build = json('build-info.json');
const validation = json('validation.json');
const consoleBuild = json('console-build.json');
const checksums = read('SHA256SUMS.txt').toString('utf8').trim().split(/\r?\n/).map(line => {
  const [, expected, name] = line.match(/^([a-f0-9]{64})\s+(.+)$/) || [];
  assert.ok(name && !name.includes('..') && !path.isAbsolute(name), 'Invalid checksum path');
  return { expected, name };
});
// Existing Windows checkouts may already contain Git's CRLF conversion. Restore
// only line-ending changes whose resulting bytes match the recorded checksum.
// A source edit or any other mismatch is refused, never overwritten.
if (process.argv.includes('--normalize')) {
  const textFiles = new Set(['BsonLite.cjs', 'index.cjs', 'auto-console.cjs', 'build-info.json', 'console-build.json']);
  for (const { expected, name } of checksums) {
    const bytes = read(name);
    if (hash(bytes) === expected || !textFiles.has(name)) continue;
    const normalized = Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
    assert.equal(hash(normalized), expected, name + ': changes exceed Windows line endings; preserve and inspect the local changes.');
    fs.writeFileSync(path.join(root, name), normalized);
    process.stderr.write('Restored validated LF bytes: ' + name + '\n');
  }
}
assert.equal(pkg.name, 'bsonlite-sdk');
assert.equal(pkg.main, './index.cjs', 'npm imports must load the automatic Console adapter');
assert.equal(pkg.exports['.'], pkg.main, 'CommonJS and ESM must use the same entry point');
assert.ok(pkg.bsonlite && typeof pkg.bsonlite.sdkVersion === 'string', 'Embedded SDK version must be declared');
assert.equal(pkg.bsonlite.sdkVersion, build.bsonliteVersion, 'Embedded SDK version must match the validated build');
assert.equal(build.nativeReady, true);
assert.equal(build.distributionMode, 'native-encrypted');
assert.equal(build.platform, 'win32');
assert.equal(build.arch, 'x64');
assert.equal(validation.sourceAndBundledNativeTests, 'passed');
assert.equal(validation.earlierFormatTests, 'passed');
assert.equal(read('BsonLite.cjs').length, build.distributionBytes);
for (const required of ['BsonLite.cjs', 'index.cjs', 'auto-console.cjs', 'build-info.json', 'console-build.json']) {
  assert(checksums.some(entry => entry.name === required), 'Missing checksum for ' + required);
}
for (const { expected, name } of checksums) {
  assert.equal(hash(read(name)), expected, name + ' checksum mismatch');
}
assert.equal(consoleBuild.npmVersion, pkg.version);
assert.equal(consoleBuild.consoleVersion, pkg.bsonlite.consoleVersion);
assert.equal(consoleBuild.baselineSDKVersion, pkg.bsonlite.sdkVersion);
assert.equal(consoleBuild.baselineSHA256, hash(read('BsonLite.cjs')));
assert.equal(consoleBuild.nativeEngineChanged, false);
assert.equal(hash(read('source/BsonLite-native-engine-source.tar.gz')), validation.modifiedEngineSourceSha256);
for (const name of ['SOURCE_AND_NOTICES.md', 'BsonLite-MIT.txt', 'MongoDB-SSPL-1.0.txt', 'MongoDB-MPL-2.txt', 'MongoDB-THIRD-PARTY-NOTICES.txt', 'libsodium-LICENSE.txt', 'Dependency-acorn-8.19.0-LICENSE.txt']) {
  assert.ok(read('licenses/' + name).length > 0, name);
}
const sdk = require(path.join(root, pkg.main));
for (const name of ['connect', 'collection', 'stop', 'backup', 'restore']) assert.equal(typeof sdk[name], 'function', name);
assert.ok(sdk.BSON && sdk.ObjectId);
assert.equal(sdk.consoleVersion, pkg.bsonlite.consoleVersion);
assert.equal(sdk.connectionURL, null, 'Import must not start an endpoint');
assert.ok(!pkg.scripts.install && !pkg.scripts.postinstall && !pkg.scripts.preinstall, 'No install scripts expected');
process.stderr.write('Package verified: npm ' + pkg.version + ', SDK ' + pkg.bsonlite.sdkVersion + ', native checksums, matching engine source, licenses and exports.\n');
