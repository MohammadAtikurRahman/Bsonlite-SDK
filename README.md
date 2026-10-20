# BsonLite

**A portable database SDK for Node.js and Windows applications.**

Add BsonLite to your project, connect once and work with documents through collections. BsonLite manages the local database engine, connection settings and encrypted storage.

[Documentation](https://bsonlite.com/docs/index.html) · [Query examples](https://bsonlite.com/queries.html) · [Website](https://bsonlite.com/) · [GitHub](https://github.com/MohammadAtikurRahman/Bsonlite-SDK)

## Requirements

- Windows x64: Windows 10 version 1903+, Windows 11 or a compatible Windows Server release.
- Node.js 20 or later.
- A private, writable data location, normally on NTFS.

The prepared npm package is **0.6.0-rc.3**. It preserves the tested **SDK 0.6.0-rc.1** native core and adds automatic local connections for **BsonLite Console 0.2.0**. The native database engine and storage format are unchanged. Before this version is published to npm, install the supplied `.tgz` file locally. See [validation results](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/TEST_RESULTS.md) for the scope of testing.

## Installation

```sh
npm install bsonlite-sdk
```

The SDK includes its engine and JavaScript dependencies. Users do not need to install a separate database, Python or a compiler. Installing or importing the package does not start a database or insert records.

## Automatic BsonLite Console connection

Keep your current `BsonLite.connect(...)` code. After updating the SDK once, run your app and open BsonLite Console 0.2.0. The running database appears automatically, the URL is filled in, and **Connect** opens it. With several apps, choose the database from the dropdown. No extra bridge package, copied token, or project-folder selection is required.

Single-file users can use the supplied integrated `BsonLite.cjs`. This npm package instead loads the preserved native core through `index.cjs` and the bundled `auto-console.cjs` adapter. Importing it does not start a database; the local endpoint starts only after connecting. `BsonLite.stop()` and `database.close()` remove their local sessions. Closing the viewer leaves the app running.

Records live in a private current-account application-data directory and contain a rotating loopback token, not native engine credentials/private keys. There is no LAN listener. The viewer starts read-only. To disable automatic viewer access, set `BSONLITE_CONSOLE=0` or add `console: false` to your existing connection options. Windows runtime verification of this new feature is pending; the automatic flow is tested separately from the existing native-engine validation. See `CONSOLE_BN.md` and `console-build.json`.

## Quick start

Create an `index.cjs` file:

```javascript
const BsonLite = require('bsonlite-sdk');

async function main() {
  try {
    await BsonLite.connect();

    const notes = BsonLite.collection('notes');
    const result = await notes.insertOne({
      title: 'My first BsonLite note',
      completed: false,
      createdAt: new Date()
    });

    const note = await notes.findOne({ _id: result.insertedId });
    console.log(note);
  } finally {
    await BsonLite.stop();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

Run it:

```sh
node index.cjs
```

This demonstration inserts one note, reads it and stops the database. For a server or desktop application, connect during startup and keep the connection open until shutdown.

### ES modules

Use an `.mjs` file or a project configured with `"type": "module"`:

```javascript
import BsonLite from 'bsonlite-sdk';

try {
  await BsonLite.connect();
  const notes = await BsonLite.collection('notes').find({}).limit(10).toArray();
  console.log(notes);
} finally {
  await BsonLite.stop();
}
```

## Query examples

Run the following operations after `await BsonLite.connect()`. Close the database when your application finishes.

### Insert

```javascript
const users = BsonLite.collection('users');

await users.insertOne({
  name: 'Atik',
  email: 'atik@example.com',
  active: true
});
```

### Find, filter and sort

```javascript
const activeUsers = await BsonLite.collection('users')
  .find({ active: true })
  .sort({ name: 1 })
  .limit(20)
  .toArray();

const user = await BsonLite.collection('users').findOne({
  email: 'atik@example.com'
});
```

### Update

```javascript
await BsonLite.collection('users').updateOne(
  { email: 'atik@example.com' },
  { $set: { name: 'Atikur Rahman' } }
);
```

### Delete

```javascript
await BsonLite.collection('users').deleteOne({
  email: 'atik@example.com'
});
```

### Indexes

```javascript
await BsonLite.collection('users').createIndex(
  { email: 1 },
  { unique: true }
);
```

### Aggregation

```javascript
const summary = await BsonLite.collection('users').aggregate([
  { $match: { active: true } },
  { $group: { _id: null, total: { $sum: 1 } } }
]).toArray();
```

### BSON types

```javascript
const id = new BsonLite.ObjectId();
const amount = BsonLite.BSON.Decimal128.fromString('12.50');
const largeNumber = BsonLite.BSON.Long.fromString('9007199254740993');
```

BSON utilities are included; no separate BSON package is required for these examples.

## Use across application files

Connect once in your entry point. Other modules can import the same package and use collections after initialization.

**users.cjs**

```javascript
const BsonLite = require('bsonlite-sdk');

exports.findUser = email =>
  BsonLite.collection('users').findOne({ email });
```

**app.cjs**

```javascript
const BsonLite = require('bsonlite-sdk');
const { findUser } = require('./users.cjs');

async function main() {
  try {
    await BsonLite.connect();
    console.log(await findUser('atik@example.com'));
  } finally {
    await BsonLite.stop();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

## Storage and security

By default, data is stored in `./Database`, relative to the application's working directory. It is not stored inside `node_modules`.

BsonLite extracts its engine into private Windows application data. The SDK manages a local loopback connection, authentication credentials, TLS and native storage encryption. Windows DPAPI protects the key vault for the current account.

Use the documented encrypted backup and restore workflow before moving data to another account or computer. Copying the `Database` folder alone does not transfer the protected key.

See [backup and restore](https://bsonlite.com/docs/backup-restore.html) and [security guidance](https://bsonlite.com/security.html).

## Engine and compatibility

BsonLite is independently developed and is **not an official MongoDB product**. It uses a custom MongoDB 4.0.28 engine, so queries, BSON values, indexes and aggregation follow the capabilities of that engine and its supported standalone configuration.

- Features introduced in newer engine versions are not implied.
- Server-side JavaScript is disabled.
- Replica-set transactions and change streams are outside this standalone profile.
- MongoDB 4.0.28 is end-of-life.

Clean Windows Home/Pro PCs, packaged Electron applications and independent security review remain additional validation work. The SDK does not claim an independent security audit or production certification.

## Documentation

| Topic | Guide |
| --- | --- |
| Installation | [Setup and requirements](https://bsonlite.com/docs/installation.html) |
| Connections | [Connect once and share collections](https://bsonlite.com/docs/connection.html) |
| API | [API reference](https://bsonlite.com/docs/api-reference.html) |
| Queries | [Query library](https://bsonlite.com/queries.html) |
| Recovery | [Backup and restore](https://bsonlite.com/docs/backup-restore.html) |
| Compatibility | [Supported features and limits](https://bsonlite.com/docs/compatibility.html) |

## Licenses and matching source

The BsonLite JavaScript wrapper is MIT licensed. Bundled components retain their own licenses; the MIT license does not relicense the engine. Read [component notices](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/licenses/SOURCE_AND_NOTICES.md).

This distribution includes the exact matching modified engine source at `source/BsonLite-native-engine-source.tar.gz`, along with the tested SDK, build record and checksums. The engine source hash is recorded in `validation.json`.

## Maintaining this npm distribution

This repository contains the npm distribution, tests and package metadata. See [the publishing guide](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/PUBLISH_BN.md), including how to approve a staged release and make this README appear on npm.

## Contact

Website: https://bsonlite.com/  
Email: info@bsonlite.com
