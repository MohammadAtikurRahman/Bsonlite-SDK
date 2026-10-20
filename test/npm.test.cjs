'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('published contents preserve validated SDK and matching source', () => {
  const result = spawnSync(process.execPath, ['scripts/verify-package.cjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('CommonJS and ESM package imports expose the same SDK', async () => {
  const sdk = require('bsonlite-sdk');
  const esm = await import('bsonlite-sdk');
  assert.equal(esm.default, sdk);
  assert.equal(typeof sdk.connect, 'function');
  assert.equal(typeof sdk.collection, 'function');
  const oid = new sdk.ObjectId();
  assert.equal(oid.toHexString().length, 24);
  const bytes = sdk.BSON.serialize({ amount: sdk.BSON.Decimal128.fromString('12.50') });
  assert.equal(sdk.BSON.deserialize(bytes).amount.toString(), '12.50');
});
