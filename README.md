# BsonLite

**A portable database SDK for Node.js and Windows applications.**

Add BsonLite to your project, connect once and work with documents through collections. BsonLite manages the local database engine, connection settings and encrypted storage.

[Documentation](https://bsonlite.com/docs/index.html) · [Download desktop software](https://github.com/MohammadAtikurRahman/BsonLite-Console/releases/tag/v0.2.0) · [Console & CLI guide](https://bsonlite.com/console.html) · [Discord](https://discord.gg/vSRMRPYqs) · [GitHub](https://github.com/MohammadAtikurRahman/Bsonlite-SDK)

## Requirements

- Windows x64: Windows 10 version 1903+, Windows 11 or a compatible Windows Server release.
- Node.js 20 or later.
- A private, writable data location, normally on NTFS.

This release is **npm SDK 0.6.0-rc.3**, with automatic connections for **BsonLite Console 0.2.0** and its terminal CLI. It preserves the tested **SDK 0.6.0-rc.1** native core and database format. Automatic discovery requires this npm release or the integrated standalone SDK download. See [validation results](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/TEST_RESULTS.md) for test coverage.

The experimental modern-engine work uses MongoDB Community 9.0.4, driver 7.7.0
and a separately prepared `0.7.0` prerelease under the `next` tag. Its npm
preparation requires the core workflow's actual Windows storage, migration/CLI
and final bundled-SDK evidence. See [modern preparation instructions](MODERN_ENGINE_BN.md)
and the [core upgrade branch](https://github.com/MohammadAtikurRahman/BsonLite/tree/upgrade/mongodb-9.0).
Preparing or pushing source does not publish a version to npm.

## Installation

```sh
npm install bsonlite-sdk
```

The SDK includes its engine and JavaScript dependencies. Users do not need to install a separate database, Python or a compiler. Installing or importing the package does not start a database or insert records.

To update an existing project after this release is published:

```sh
npm install bsonlite-sdk@latest
```

Restart your app after updating. Before `0.6.0-rc.3` is published, the registry can still return `0.6.0-rc.2`; check with `npm view bsonlite-sdk version`, or install the offline SDK tarball from the full download. An SDK package does not install the desktop software or a global CLI command.

## Automatic BsonLite Console connection

Keep your current `BsonLite.connect(...)` code. After updating the SDK once, run your app and open BsonLite Console 0.2.0. The running database appears automatically, the URL is filled in, and **Connect** opens it. With several apps, choose the database from the dropdown. No extra bridge package, copied token, or project-folder selection is required.

For npm, keep `require('bsonlite-sdk')` or `import BsonLite from 'bsonlite-sdk'`; these load the Console adapter automatically. The internal `BsonLite.cjs` inside `node_modules` is the preserved native core. Single-file users should download the integrated CJS from the release instead of copying that internal file.

Importing the SDK does not start a database; its local Console connection starts only after connecting. `BsonLite.stop()` and `database.close()` remove their local sessions. Closing the viewer leaves the app running.

Records live in a private current-account application-data directory and contain a fresh per-connection loopback token, not native engine credentials/private keys. The viewer starts read-only. To disable automatic viewer access, set `BSONLITE_CONSOLE=0` or add `console: false` to your existing connection options. See [বাংলা Console guide](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/CONSOLE_BN.md), `console-build.json` and the Windows compatibility workflow for implementation and validation details.

## Download the desktop software

[Download BsonLite Console for Windows x64](https://github.com/MohammadAtikurRahman/BsonLite-Console/releases/download/v0.2.0/BsonLite-Console-0.2.0-Windows-x64.zip).

1. Extract the ZIP and run `BsonLite-Console-0.2.0-Windows-x64.exe`. This portable viewer includes its runtime; it does not need a separate Node.js installation.
2. Start your app with the updated npm SDK and leave it running under the same Windows account.
3. Choose the app in **Running BsonLite databases**, then click **Connect**. The connection URL is filled automatically.

The desktop app includes a collection explorer, document table/JSON views, filter/sort, pagination, indexes, collection creation, result export and a query console. To insert/update/delete, turn off **Read-only** in Options and apply/reconnect. You can also enter an authorized direct server URL and configure its TLS certificates in Options.

| Download | Use it for |
| --- | --- |
| [Console only](https://github.com/MohammadAtikurRahman/BsonLite-Console/releases/download/v0.2.0/BsonLite-Console-0.2.0-Windows-x64.zip) | Desktop software and CLI tarball for an existing SDK app or server URL. |
| [SDK + Console](https://github.com/MohammadAtikurRahman/BsonLite-Console/releases/download/v0.2.0/BsonLite-Easy-Connect-0.2.0.zip) | SDK, software, CLI, offline npm SDK tarball, starter and source. |
| [Single-file SDK](https://github.com/MohammadAtikurRahman/BsonLite-Console/releases/download/v0.2.0/BsonLite.cjs) | Integrated CJS alternative to the npm SDK. |

Console 0.2.0 is an unsigned preview. [Full Electron source and build instructions](https://github.com/MohammadAtikurRahman/BsonLite-Console) are public.

### A running app to try

After installing the SDK in your project, this supplied example starts a separate demo database and a local health server:

```powershell
node node_modules/bsonlite-sdk/examples/console-app.cjs
```

It uses `./BsonLiteConsoleDemo`, inserts no records automatically and serves `http://127.0.0.1:3000/health`. Leave that terminal open, then connect from Console or the CLI. Press Ctrl+C to stop the demo. Existing server/desktop apps can keep their own connection code.

## Terminal CLI

The Console ZIP includes `packages/bsonlite-cli-0.2.0.tgz`. Open a terminal in the extracted Console folder:

```powershell
npm install -g ./packages/bsonlite-cli-0.2.0.tgz
bsonlite
```

The CLI requires Node.js **20.19+**. With one running updated SDK app, it finds the database automatically. With several, choose from its list. An explicit `--uri` or `BSONLITE_URI` is also accepted. The supplied tarball installs the `bsonlite` command; it does not imply that `bsonlite-cli` is published on npm.

```powershell
bsonlite --eval "db.users.countDocuments({})"
bsonlite --write
```

Run each query separately in the CLI or desktop query console:

```javascript
db.users.insertOne({ name: 'Atik', active: true, createdAt: ISODate() })
db.users.find({ active: true }).limit(25)
db.users.updateOne({ name: 'Atik' }, { $set: { active: false } })
```

Inserting the first document creates the collection. The CLI starts read-only; use `--write` for changes. This query console accepts one database expression at a time, rather than arbitrary JavaScript programs. See the [Console README](https://github.com/MohammadAtikurRahman/BsonLite-Console#query-console) for supported operations.

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
| Desktop software & CLI | [Console and connection guide](https://bsonlite.com/console.html) |
| বাংলা Console guide | [npm SDK-এর সঙ্গে Console ব্যবহার](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/CONSOLE_BN.md) |

## Licenses and matching source

The BsonLite JavaScript wrapper is MIT licensed. Bundled components retain their own licenses; the MIT license does not relicense the engine. Read [component notices](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/licenses/SOURCE_AND_NOTICES.md).

This distribution includes the exact matching modified engine source at `source/BsonLite-native-engine-source.tar.gz`, along with the tested SDK, build record and checksums. The engine source hash is recorded in `validation.json`.

## Maintaining this npm distribution

This repository contains the npm distribution, tests and package metadata. See [the publishing guide](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/PUBLISH_BN.md), including how to approve a staged release and make this README appear on npm.

From this repository folder, the prepared version is already `0.6.0-rc.3`:

```powershell
git pull --ff-only origin main
npm pkg get name version
npm test
npm run verify
npm stage publish --access public --tag latest
```

After npm's review finishes, inspect and approve the **new** stage ID:

```powershell
npm stage list bsonlite-sdk
npm stage view STAGE_ID
npm stage approve STAGE_ID
npm view bsonlite-sdk version
```

Replace `STAGE_ID` with the ID returned by this upload and complete npm's browser/2FA authentication. Staged publishing requires npm CLI 11.15+ and Node.js 22.14+; Node.js 24 is a suitable publishing environment. Approval publishes the package and its README to npm. Use `npm login` first if `npm whoami` shows you are not signed in.

Tests and packing preserve the validated SDK bytes. Existing Windows Git checkouts with CRLF conversion are repaired only when LF normalization exactly matches the recorded checksum. Other source changes are refused and left intact. The Windows workflow installs the actual packed SDK in an isolated project and checks its native engine with the pinned Console/CLI source. See `TEST_RESULTS.md`.

## Contribute

- [BsonLite](https://github.com/MohammadAtikurRahman/BsonLite): core SDK and engine integration.
- [Bsonlite-SDK](https://github.com/MohammadAtikurRahman/Bsonlite-SDK): npm packaging, exports and documentation.
- [BsonLite-Console](https://github.com/MohammadAtikurRahman/BsonLite-Console): Electron GUI, terminal CLI and build tools.

## Contact

Website: https://bsonlite.com/  
Email: info@bsonlite.com
Discord: https://discord.gg/vSRMRPYqs
