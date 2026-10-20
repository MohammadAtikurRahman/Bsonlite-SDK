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
assert.equal(pkg.name, 'bsonlite-sdk');
assert.equal(pkg.version, build.bsonliteVersion);
assert.equal(build.nativeReady, true);
assert.equal(build.distributionMode, 'native-encrypted');
assert.equal(build.platform, 'win32');
assert.equal(build.arch, 'x64');
assert.equal(validation.sourceAndBundledNativeTests, 'passed');
assert.equal(validation.earlierFormatTests, 'passed');
assert.equal(read('BsonLite.cjs').length, build.distributionBytes);
for (const line of read('SHA256SUMS.txt').toString('utf8').trim().split(/\r?\n/)) {
  const [, expected, name] = line.match(/^([a-f0-9]{64})\s+(.+)$/) || [];
  assert.ok(name && !name.includes('..') && !path.isAbsolute(name), 'Invalid checksum path');
  assert.equal(hash(read(name)), expected, name + ' checksum mismatch');
}
assert.equal(hash(read('source/BsonLite-native-engine-source.tar.gz')), validation.modifiedEngineSourceSha256);
for (const name of ['SOURCE_AND_NOTICES.md', 'BsonLite-MIT.txt', 'MongoDB-SSPL-1.0.txt', 'MongoDB-MPL-2.txt', 'MongoDB-THIRD-PARTY-NOTICES.txt', 'libsodium-LICENSE.txt']) {
  assert.ok(read('licenses/' + name).length > 0, name);
}
const sdk = require(path.join(root, pkg.main));
for (const name of ['connect', 'collection', 'stop', 'backup', 'restore']) assert.equal(typeof sdk[name], 'function', name);
assert.ok(sdk.BSON && sdk.ObjectId);
assert.ok(!pkg.scripts.install && !pkg.scripts.postinstall && !pkg.scripts.preinstall, 'No install scripts expected');
console.log('Package verified: native SDK checksums, version, matching engine source, licenses and exports.');
