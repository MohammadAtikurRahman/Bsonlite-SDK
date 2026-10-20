# BsonLite

A portable database SDK for offline Node.js and Windows applications. Connect once, work with collections and let BsonLite manage local setup and encryption.

**Windows x64 · Node.js 20+ · Release candidate 0.6.0-rc.1**

## Install

```sh
npm install bsonlite-sdk
```

The engine and JavaScript dependencies are bundled. No separate database installation, engine download, install script or compiler is required. Installing the package does not start a database or create application records.

## Connect and query

```js
const BsonLite = require('bsonlite-sdk');

async function main() {
  try {
    await BsonLite.connect();

    const notes = BsonLite.collection('notes');
    const result = await notes.insertOne({
      title: 'My first note',
      createdAt: new Date()
    });

    console.log(await notes.findOne({ _id: result.insertedId }));
  } finally {
    await BsonLite.stop();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

ES modules can use the same SDK:

```js
import BsonLite from 'bsonlite-sdk';

await BsonLite.connect();
// Start the application after connecting.
// On application shutdown:
await BsonLite.stop();
```

Connect once at application startup. Other modules can `require('bsonlite-sdk')` and use `BsonLite.collection('notes')` after initialization. For a server or desktop app, keep the connection open until the application exits. Importing the package alone does not start the engine.

## Collections and BSON

```js
// Run these operations after connecting.
const users = BsonLite.collection('users');

await users.createIndex({ email: 1 }, { unique: true });
await users.insertOne({ name: 'Atik', email: 'atik@example.com' });
const activeUsers = await users.find({ active: true }).limit(20).toArray();
await users.updateOne({ email: 'atik@example.com' }, { $set: { active: true } });
await users.deleteOne({ email: 'atik@example.com' });

const id = new BsonLite.ObjectId();
const amount = BsonLite.BSON.Decimal128.fromString('12.50');
```

## Storage and security

By default, project data is stored in `./Database`, relative to the application's working directory, not in node_modules. The SDK extracts its engine into private Windows application data and manages the protected key vault, credentials, loopback port and TLS connection. Windows DPAPI protects keys for the current account.

Keep encrypted backups. Copying the Database folder alone to another computer/account does not transfer the protected key. Use the documented backup and restore workflow.

Read [the documentation](https://bsonlite.com/docs/index.html), SECURITY.md and TEST_RESULTS.md for behavior and validation boundaries. Clean Windows Home/Pro, packaged Electron apps and independent security review remain additional validation work. This package does not claim production certification or an independent security audit.

## Engine and compatibility

BsonLite is independently developed and is not an official MongoDB product. It bundles a custom MongoDB 4.0.28 engine. Queries, indexes, BSON values and aggregation follow that engine version and the supported standalone configuration; newer-version features are not implied. Server-side JavaScript is disabled. Replica-set transactions and change streams are outside this deployment profile. MongoDB 4.0.28 is end-of-life.

## Licenses and matching source

The BsonLite JavaScript wrapper is MIT licensed. Bundled components retain their own licenses; the MIT license does not relicense the engine. See `licenses/SOURCE_AND_NOTICES.md` and the full accompanying license texts.

This npm package includes the matching modified engine source archive at `source/BsonLite-native-engine-source.tar.gz`. Its SHA-256 is recorded in `validation.json`. The original tested SDK, build record and checksums are included unchanged.

Website: https://bsonlite.com/  
Contact: info@bsonlite.com
