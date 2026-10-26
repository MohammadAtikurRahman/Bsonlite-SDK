## Existing 0.6 distribution

> Archived reference for existing 0.6 applications. New projects should follow the current [SDK README](README.md) and use `npm i bsonlite-sdk`. The explicit version below is only for applications that must retain the old engine.

Add BsonLite to your project, connect once and work with documents through collections. BsonLite manages the local database engine, connection settings and encrypted storage.

[Documentation](https://bsonlite.com/docs/index.html) · [Download desktop software](https://bsonlite.com/console.html) · [Console & CLI guide](https://bsonlite.com/console.html) · [Discord](https://discord.gg/vSRMRPYqs) · [GitHub](https://github.com/MohammadAtikurRahman/Bsonlite-SDK)

## Requirements

- Windows x64: Windows 10 version 1903+, Windows 11 or a compatible Windows Server release.
- Node.js 20 or later.
- A private, writable data location, normally on NTFS.

This release is **npm package 0.6.0-rc.3**, with automatic connections for **BsonLite Console 0.3.0** and its terminal CLI. It preserves the tested **BsonLite 0.6.0-rc.1** native core and database format. Automatic discovery requires this npm release or the integrated standalone BsonLite file download. See [validation results](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/TEST_RESULTS.md) for test coverage.

Experimental **0.7.0-alpha.0** uses the new 9.0.4 engine and driver 7.7.0. Its
actual Windows storage, migration/CLI and final embedded-BsonLite gates passed in
[run 40207704023](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40207704023).
The [prepared npm tarball](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40207704023/artifacts/12604842008)
includes matching modified engine source and the original test reports, and
was packed, installed and checksum/import verified on Windows. See the current [SDK README](README.md) for the maintained npm installation.
It requires Node.js 20.19+ and Windows x64 build 20348+.
See the [download/install/publish guide](MODERN_ENGINE.md) and
[migration instructions](https://github.com/MohammadAtikurRahman/BsonLite/blob/main/native/modern/UPGRADE.md)
before opening an existing database. The package in this repository root is
the 0.6 distribution; use the separately prepared 0.7 tarball for the new engine.

## Installation

```sh
npm i bsonlite-sdk@0.6.0-rc.3
```

BsonLite includes its engine and JavaScript dependencies. Users do not need to install a separate database, Python or a compiler. Installing or importing the package does not start a database or insert records.

The unversioned command installs the current release and does not preserve the earlier engine line. Keep the explicit legacy version above only when maintaining an existing 0.6 application.

Restart your app after updating. Check the registry version with `npm view bsonlite-sdk version`, or install a specific published package version. A BsonLite package does not install the desktop software or a global CLI command.

## Automatic BsonLite Console connection

Keep your current `BsonLite.connect(...)` code. After updating the BsonLite once, run your app and open BsonLite Console 0.3.0. The running database appears automatically, the URL is filled in, and **Connect** opens it. With several apps, choose the database from the dropdown. No extra bridge package, copied token, or project-folder selection is required.

For npm, keep `require('bsonlite-sdk')` or `import BsonLite from 'bsonlite-sdk'`; these load the Console adapter automatically. The internal `BsonLite.cjs` inside `node_modules` is the preserved native core. Single-file users should download the integrated CJS from the release instead of copying that internal file.

Importing the BsonLite does not start a database; its local Console connection starts only after connecting. `BsonLite.stop()` and `database.close()` remove their local sessions. Closing the viewer leaves the app running.

Records live in a private current-account application-data directory and contain a fresh per-connection loopback token, not native engine credentials/private keys. The viewer starts read-only. To disable automatic viewer access, set `BSONLITE_CONSOLE=0` or add `console: false` to your existing connection options. See [Console guide](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/CONSOLE.md), `console-build.json` and the Windows compatibility workflow for implementation and validation details.

## Download the desktop software

[Download BsonLite Console for Windows x64](https://bsonlite.com/console.html).

1. Extract the ZIP and run `BsonLite-Console-0.2.0-Windows-x64.exe`. This portable viewer includes its runtime; it does not need a separate Node.js installation.
2. Start your app with the updated npm package and leave it running under the same Windows account.
3. Choose the app in **Running BsonLite databases**, then click **Connect**. The connection URL is filled automatically.

The desktop app includes a collection explorer, document table/JSON views, filter/sort, pagination, indexes, collection creation, result export and a query console. To insert/update/delete, turn off **Read-only** in Options and apply/reconnect. You can also enter an authorized direct server URL and configure its TLS certificates in Options.

| Download | Use it for |
| --- | --- |
| [Console only](https://bsonlite.com/console.html) | Desktop software and CLI tarball for an existing BsonLite app or server URL. |
| [BsonLite + Console](https://github.com/MohammadAtikurRahman/BsonLite-Console/releases/download/v0.2.0/BsonLite-Easy-Connect-0.2.0.zip) | BsonLite, software, CLI, offline npm package tarball, starter and source. |
| [Single-file BsonLite](https://github.com/MohammadAtikurRahman/BsonLite-Console/releases/download/v0.2.0/BsonLite.cjs) | Integrated CJS alternative to the npm package. |

Console 0.3.0 is an unsigned preview. [Full Electron source and build instructions](https://github.com/MohammadAtikurRahman/BsonLite-Console) are public.

### A running app to try

After installing the BsonLite in your project, this supplied example starts a separate demo database and a local health server:

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

The CLI requires Node.js **20.19+**. With one running updated BsonLite app, it finds the database automatically. With several, choose from its list. An explicit `--uri` or `BSONLITE_URI` is also accepted. The supplied tarball installs the `bsonlite` command; it does not imply that `bsonlite-cli` is published on npm.

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

BsonLite extracts its engine into private Windows application data. BsonLite manages a local loopback connection, authentication credentials, TLS and native storage encryption. Windows DPAPI protects the key vault for the current account.

Use the documented encrypted backup and restore workflow before moving data to another account or computer. Copying the `Database` folder alone does not transfer the protected key.

See [backup and restore](https://bsonlite.com/docs/backup-restore.html) and [security guidance](https://bsonlite.com/security.html).

## Engine and compatibility

BsonLite is independently developed and is **not an official MongoDB product**. It uses a custom MongoDB 4.0.28 engine, so queries, BSON values, indexes and aggregation follow the capabilities of that engine and its supported standalone configuration.

- Features introduced in newer engine versions are not implied.
- Server-side JavaScript is disabled.
- Replica-set transactions and change streams are outside this standalone profile.
- MongoDB 4.0.28 is end-of-life.

Clean Windows Home/Pro PCs, packaged Electron applications and independent security review remain additional validation work. BsonLite does not claim an independent security audit or production certification.

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
| Console guide | [Use Console with the npm package](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/CONSOLE.md) |

## Licenses and matching source

The BsonLite JavaScript wrapper is MIT licensed. Bundled components retain their own licenses; the MIT license does not relicense the engine. Read [component notices](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/licenses/SOURCE_AND_NOTICES.md).

This distribution includes the exact matching modified engine source at `source/BsonLite-native-engine-source.tar.gz`, along with the tested BsonLite, build record and checksums. The engine source hash is recorded in `validation.json`.

## Maintaining this npm distribution

For the current modern release, run `npm run release:verify` and `npm run release:stage` from your local checkout. The exact 0.7 tarball is reconstructed from tracked parts. Follow [local publishing](PUBLISH.md) for approval and [modern npm preparation](MODERN_ENGINE.md) when creating a different validated version.

The root retains the published 0.6 distribution for backwards-compatibility tests. Verify that fixture with `npm test` and `npm run verify`. Do not bump its version to claim a new engine release.

Tests and packing preserve the validated BsonLite bytes. Existing Windows Git checkouts with CRLF conversion are repaired only when LF normalization exactly matches the recorded checksum. Other source changes are refused and left intact. The Windows workflow installs the actual packed BsonLite in an isolated project and checks its native engine with the pinned Console/CLI source. See `TEST_RESULTS.md`.

The CLI test fixture is pinned to core commit `696be4a7d3fc9e5105ab0bee1352b2e72ebb4f06`.
It preserves the Console 0.3.0 CLI and connection/query files with their license
and verified source hashes, so CI does not need access to a separate private
Console repository. The package's engine and BsonLite payload are unchanged by this
workflow configuration.

## Contribute

- [BsonLite](https://github.com/MohammadAtikurRahman/BsonLite): core BsonLite and engine integration.
- [bsonlite-sdk](https://github.com/MohammadAtikurRahman/Bsonlite-SDK): npm packaging, exports and documentation.
- [BsonLite-Console](https://github.com/MohammadAtikurRahman/BsonLite-Console): Electron GUI, terminal CLI and build tools.

## Contact

Website: https://bsonlite.com/  
Email: info@bsonlite.com
Discord: https://discord.gg/vSRMRPYqs
