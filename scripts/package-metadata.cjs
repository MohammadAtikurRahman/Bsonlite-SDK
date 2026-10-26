'use strict';
// Public discovery fields only: never change runtime, exports or dependencies.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

function readPackageMetadata(root, expectedSha) {
  const bytes = Buffer.from(fs.readFileSync(path.join(root, 'release/package-metadata.json'), 'utf8').replace(/\r\n/g, '\n'));
  if (expectedSha !== undefined) {
    assert.match(expectedSha, /^[a-f0-9]{64}$/);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expectedSha, 'Package metadata changed: explicitly refresh the documentation release manifest');
  }
  const value = JSON.parse(bytes);
  assert.deepEqual(Object.keys(value).sort(), ['bugs', 'description', 'homepage', 'keywords'], 'Only public discovery fields may be overlaid');
  assert(typeof value.description === 'string' && value.description.length >= 20 && value.description.length <= 300);
  assert.equal(value.homepage, 'https://bsonlite.com/');
  assert.deepEqual(value.bugs, { url: 'https://github.com/MohammadAtikurRahman/Bsonlite-SDK/issues' });
  assert(Array.isArray(value.keywords) && value.keywords.length >= 3 && value.keywords.length <= 20);
  assert.equal(new Set(value.keywords).size, value.keywords.length);
  for (const keyword of value.keywords) assert(typeof keyword === 'string' && /^[a-z0-9-]{1,40}$/.test(keyword));
  return value;
}
module.exports = { readPackageMetadata };
