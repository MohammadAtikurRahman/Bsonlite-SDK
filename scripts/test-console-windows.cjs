'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { createRequire } = require('node:module');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const run = promisify(execFile);

async function main() {
  assert.equal(process.platform, 'win32', 'This integration check uses the real Windows native SDK.');
  assert.equal(process.arch, 'x64', 'The native SDK requires Windows x64.');
  assert(process.env.BSONLITE_CONSOLE_SOURCE, 'Set BSONLITE_CONSOLE_SOURCE to a BsonLite-Console 0.2.0 source checkout with production dependencies installed.');
  assert(process.env.BSONLITE_SDK_CONSUMER, 'Set BSONLITE_SDK_CONSUMER to an isolated project where the packed npm SDK is installed.');
  const consoleRoot = path.resolve(process.env.BSONLITE_CONSOLE_SOURCE);
  const consumerRequire = createRequire(path.join(path.resolve(process.env.BSONLITE_SDK_CONSUMER), 'package.json'));
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'bsonlite-npm-console-'));
  const sessions = path.join(scratch, 'sessions');
  process.env.BSONLITE_CONSOLE_HOME = sessions;
  process.env.BSONLITE_DATA_HOME = path.join(scratch, 'native-runtime');
  delete process.env.BSONLITE_CONSOLE;
  const sdk = consumerRequire('bsonlite-sdk');
  const { discoverConnections } = require(path.join(consoleRoot, 'src/discovery.cjs'));
  const { Connection } = require(path.join(consoleRoot, 'src/connection.cjs'));
  const viewer = new Connection();
  const cli = async (...args) => run(process.execPath, [path.join(consoleRoot, 'bin/bsonlite.cjs'), ...args], {
    cwd: scratch,
    env: { ...process.env, BSONLITE_URI: '' },
    timeout: 45000,
    maxBuffer: 1024 * 1024,
    windowsHide: true
  });
  const options = { name: 'npm_console_smoke', directory: path.join(scratch, 'Database') };
  try {
    assert.equal(sdk.consoleVersion, '0.2.0');
    assert.equal(sdk.connectionURL, null, 'Importing the packed package must not start a database.');
    await sdk.connect(options);
    await sdk.collection('users').insertOne({ name: 'SDK row', active: true });
    const found = await discoverConnections({ directory: sessions });
    assert.equal(found.length, 1, 'Running native SDK must be discoverable by Console.');
    assert.equal(found[0].uri, sdk.connectionURL);

    await viewer.connect({ uri: found[0].uri });
    assert.equal((await viewer.run('db.users.findOne({name:"SDK row"})')).value.active, true);
    await assert.rejects(viewer.run('db.users.insertOne({name:"blocked"})'), /Read-only/);
    await viewer.disconnect();
    assert.equal((await sdk.collection('users').countDocuments({})), 1, 'Closing the viewer must leave the app database running.');

    assert.equal(JSON.parse((await cli('--eval', 'db.users.countDocuments({})')).stdout), 1);
    await assert.rejects(cli('--eval', 'db.users.insertOne({name:"blocked"})'), /Read-only/);
    await cli('--write', '--eval', 'db.users.insertOne({name:"CLI row", n:NumberLong("9223372036854775807")})');
    const cliRow = await sdk.collection('users').findOne({ name: 'CLI row' });
    assert.equal(cliRow.n.toString(), '9223372036854775807', 'CLI writes must preserve BSON Long values.');

    await viewer.connect({ uri: found[0].uri, readOnly: false });
    await viewer.run('db.users.createIndex({name:1})');
    assert.equal((await viewer.run('db.users.updateOne({name:"CLI row"},{$set:{active:true}})')).value.modifiedCount, 1);
    assert.equal((await viewer.run('db.users.deleteOne({name:"CLI row"})')).value.deletedCount, 1);
    await viewer.disconnect();
    await sdk.stop();
    assert.deepEqual(await discoverConnections({ directory: sessions }), []);
    assert.equal(sdk.connectionURL, null);

    const database = await sdk.connect({ ...options, console: false });
    assert.equal(sdk.connectionURL, null);
    assert.equal(database.connectionURL, null);
    assert.equal(await database.collection('users').countDocuments({}), 1);
    await database.close();
    console.log('Packed npm SDK + real native Windows engine passed: automatic discovery, viewer read/write controls, CLI without a URL, BSON Long, CRUD/indexes, shutdown cleanup and Console opt-out.');
  } finally {
    await viewer.disconnect().catch(() => {});
    await sdk.stop().catch(() => {});
    await fs.rm(scratch, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
