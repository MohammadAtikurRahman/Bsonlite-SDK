# BsonLite

**A portable, local document database for Node.js and Windows applications.**

Add BsonLite to your application, connect once, and work with BSON documents through familiar MongoDB collection APIs. BsonLite manages its bundled local engine, connections and encrypted storage. Users do not need to install or configure a separate database server.

[Documentation](https://bsonlite.com/docs/) · [Downloads](https://bsonlite.com/download.html) · [BsonLite Console](https://bsonlite.com/docs/console.html) · [Discord](https://discord.gg/vSRMRPYqs) · [Support development](https://buymeacoffee.com/bsonlite)

> The modern 0.7 release line is experimental. This guide covers its SDK API and bundled engine profile. Review the compatibility and migration sections before using existing data.

## What you get

- **Local operation:** store and query data on the user's computer, including when offline after installation.
- **Document APIs:** collections, nested documents, BSON values, filtering, indexes and aggregation through the bundled MongoDB driver.
- **Managed startup:** BsonLite starts and stops its own local database process and selects its port automatically.
- **Native encrypted storage:** the custom engine encrypts live database files; Windows account protection secures the private vault.
- **Bundled dependencies:** the engine and JavaScript dependencies are included. No engine-download postinstall step, Python or C++ compiler is required by consumers.
- **Optional desktop tools:** inspect a running application with BsonLite Console and its query console or CLI.

BsonLite uses a custom MongoDB Community engine. It runs an owned local server process; it is not an in-process SQLite-style library. The standalone `BsonLite.cjs` file is the application distribution, while a running database creates a storage directory with multiple files.

## Requirements

| Component | Modern release requirements |
| --- | --- |
| Operating system | Windows x64, build 20348 or later, such as Windows 11 or Windows Server 2022+ |
| Node.js | 20.19.0 or later; Node.js 24 is the tested maintainer runtime |
| Storage | A private, writable local directory with appropriate account access controls |
| Database engine | Bundled custom MongoDB Community 9.0.4 / WiredTiger 12 |
| Node.js driver | Bundled MongoDB driver 7.7.0 |

The published native package targets Windows x64. Windows 10 support from the earlier 0.6 line should not be assumed for this modern build. Desktop installer checks on Windows Server do not establish testing on every Windows Home/Pro machine.

## Installation

Install the modern prerelease explicitly:

```sh
npm install bsonlite-sdk@next
```

Check the version selected by the release tag and the package installed in your application:

```sh
npm view bsonlite-sdk@next version
npm ls bsonlite-sdk
```

Registry tags can move. Check them before choosing an upgrade:

```sh
npm view bsonlite-sdk dist-tags --json
```

A release that updates only documentation or package metadata retains its underlying runtime build. Use `npm ls bsonlite-sdk` to identify the installed npm package version; an embedded runtime/build version can differ.

Installing this npm package does not install the BsonLite Console desktop application or a global CLI. Importing the SDK does not start a database or insert sample records.

### Standalone alternative

[Download BsonLite.cjs](https://bsonlite.com/download.php?file=bsonlite), place it beside your application entry file, and replace the npm import with:

```js
const BsonLite = require('./BsonLite.cjs');
```

The npm package and standalone file are alternative distributions. Keep the same import path across your application's modules.

## Quick start

Create `app.cjs`:

```js
const BsonLite = require('bsonlite-sdk');

async function main() {
  try {
    await BsonLite.connect({
      name: 'myapp',
      directory: './Database'
    });

    const users = BsonLite.collection('users');
    await users.updateOne(
      { email: 'atik@example.com' },
      { $set: { name: 'Atik', active: true, updatedAt: new Date() } },
      { upsert: true }
    );

    const result = await users.find({ active: true })
      .project({ name: 1, email: 1 })
      .limit(20)
      .toArray();

    console.log(result);
  } finally {
    await BsonLite.disconnect();
  }
}

main().catch(error => {
  console.error(error.code || 'APP_ERROR', error.message);
  process.exitCode = 1;
});
```

Run it with `node app.cjs`. The example closes after its work finishes. A desktop app or HTTP server should keep the connection open for its lifetime, stop accepting work during shutdown, then await `BsonLite.disconnect()`.

For ES modules:

```js
import BsonLite from 'bsonlite-sdk';
```

## Connections and storage

### One shared application connection

```js
await BsonLite.connect('myapp');
await BsonLite.ping();
```

Await startup before accessing collections. Matching shared startup calls reuse the connection; conflicting settings are refused. Calling `collection()` before startup completes throws `BSONLITE_NOT_STARTED`.

By default, storage is `./Database` relative to the process working directory. Choose an explicit writable directory in packaged apps. Keep database files and the matching private vault together; do not treat an arbitrary copy of live database files as a backup.

### Independent stores

```js
const inventory = await BsonLite.open({
  name: 'inventory',
  directory: './InventoryDatabase'
});

try {
  await inventory.collection('products').insertOne({
    sku: 'NOTE-01', price: 120, stock: 10
  });
  console.log(await inventory.listCollections().toArray());
} finally {
  await inventory.close();
}
```

Each independent store needs its own directory. `open()` does not configure the top-level shared instance. Use the returned handle for `createCollection()` and `listCollections()`; those are not top-level BsonLite methods.

### Common connection options

| Option | Default / purpose |
| --- | --- |
| `name` | Existing supported metadata name, otherwise `bsonlite` |
| `directory` | `./Database` from the working directory |
| `silent` | `false`; suppress shared startup status output when enabled |
| `maxPoolSize` | `10`; connection pool size, from 1 to 1000 |
| `cacheSizeGB` | `0.25`; WiredTiger cache setting, from 0.25 to 64 GB; not a total RAM limit |
| `startupTimeoutMS` | `30000`; startup timeout, from 2000 to 180000 ms |
| `shutdownTimeoutMS` | `15000`; shutdown timeout, from 2000 to 60000 ms |
| `console` | Set to `false` to disable automatic Console access |

Unknown options are rejected. See the [connection guide](https://bsonlite.com/docs/connection.html) and [API reference](https://bsonlite.com/docs/api-reference.html) for supported settings.

## Working with documents

The following examples run after connection startup. `collection()` returns the bundled driver's MongoDB Collection; query operations are asynchronous, and `find()` returns a cursor.

### Insert, read, update and delete

```js
const products = BsonLite.collection('products');

const inserted = await products.insertOne({
  name: 'Notebook', category: 'stationery', price: 120,
  stock: 10, tags: ['paper', 'office'], createdAt: new Date()
});

const product = await products.findOne({ _id: inserted.insertedId });

await products.updateOne(
  { _id: inserted.insertedId },
  { $inc: { stock: -1 }, $set: { updatedAt: new Date() } }
);

await products.deleteOne({ _id: inserted.insertedId });
```

For many writes, consider `insertMany()` or `bulkWrite()` rather than sending independent requests one at a time. Review [CRUD examples](https://bsonlite.com/docs/crud.html).

### Filters, sorting and pagination

```js
const page = await products.find({
  category: 'stationery',
  price: { $gte: 50, $lte: 500 },
  tags: { $in: ['office'] },
  stock: { $gt: 0 }
})
  .project({ name: 1, price: 1, stock: 1 })
  .sort({ price: 1, _id: 1 })
  .skip(0)
  .limit(20)
  .toArray();
```

Use dot notation for nested fields, return only needed fields, and bound result sizes. See [query operators](https://bsonlite.com/docs/query-operators.html).

### Indexes

```js
await products.createIndex({ category: 1, price: 1 });
await products.createIndex({ sku: 1 }, { unique: true, sparse: true });
```

Choose indexes for actual access patterns. They improve matching reads at the cost of additional storage and write work. See the [index guide](https://bsonlite.com/docs/indexes.html).

### Aggregation

```js
const totals = await products.aggregate([
  { $match: { stock: { $gt: 0 } } },
  { $group: {
      _id: '$category',
      productCount: { $sum: 1 },
      inventoryValue: { $sum: { $multiply: ['$price', '$stock'] } }
  } },
  { $sort: { inventoryValue: -1 } }
]).toArray();
```

The modern engine supports aggregation, including window aggregation. Consult the [aggregation guide](https://bsonlite.com/docs/aggregation.html) and the compatibility limits below; this is not a claim that every pipeline or engine feature has been independently tested.

### BSON types

```js
const id = new BsonLite.ObjectId();
const amount = BsonLite.BSON.Decimal128.fromString('19.95');

await BsonLite.collection('payments').insertOne({
  _id: id, amount, paidAt: new Date()
});
```

Use `BsonLite.ObjectId` and `BsonLite.BSON` for typed values. Plain JSON cannot represent every BSON type faithfully. See [BSON types](https://bsonlite.com/docs/bson-types.html).

## BsonLite Console and CLI

[Download BsonLite Console](https://bsonlite.com/download.php?file=console) to browse collections, inspect documents and run supported database expressions. Console 0.3 supports modern and earlier running BsonLite apps through its app-link protocol.

1. Start your BsonLite application and keep it running.
2. Open Console under the same Windows account.
3. Select the discovered database and click **Connect**.
4. Connections begin read-only; enable writes in Options when needed.

The Console interpreter is not full `mongosh` and does not execute arbitrary JavaScript programs. Its expression support can be narrower than application code using the driver's APIs. The desktop installer includes its runtime; the optional terminal CLI is explained in the [Console guide](https://bsonlite.com/docs/console.html).

## Security and encrypted storage

- The custom engine encrypts live database files using XChaCha20-Poly1305 with per-store keys; the modern native profile also covers temporary spill files.
- The engine listens on `127.0.0.1`, using mutual TLS and SCRAM-SHA-256 for local connections.
- Windows DPAPI CurrentUser protects the private vault. The application uses database-scoped credentials.
- There is no vendor master recovery key. Preserve matching vaults, backups and backup passwords.

Encryption does not protect records already available in process memory from same-account malware, administrators or a compromised application. File metadata remains visible, and operating-system pagefiles, hibernation and crash dumps require their own protection. An independent security audit is not claimed.

For Electron, keep database access in the main process or a suitable local backend and expose a narrow, validated IPC API to renderers. See the [security guide](https://bsonlite.com/docs/security.html) and [desktop app guide](https://bsonlite.com/docs/desktop-apps.html).

## Backup and restore

Stop all users of the store before creating an encrypted physical backup:

```js
const password = process.env.MY_BACKUP_PASSWORD;
if (!password || password.length < 16) {
  throw new Error('Set a backup password of at least 16 characters.');
}

await BsonLite.disconnect();
await BsonLite.backup({
  directory: './Database',
  file: './backups/myapp.bslbackup',
  password
});
```

Close independent handles and other applications using the same store as well. Keep backups outside the database directory and protect the password separately.

Restore into a directory that does not already exist:

```js
await BsonLite.restore({
  directory: './RestoredDatabase',
  file: './backups/myapp.bslbackup',
  password: process.env.MY_BACKUP_PASSWORD
});
await BsonLite.connect({ directory: './RestoredDatabase' });
```

Physical backups require compatible OS, architecture and engine profiles. Test recovery with disposable destinations. Cross-PC restoration remains additional release validation. See [backup and restore](https://bsonlite.com/docs/backup-restore.html).

## Upgrading from the earlier 0.6 engine

**Do not point the modern engine at old MongoDB 4.0.28 physical data files.** Retain the old SDK, source data, matching vault and backups, and follow a logical upgrade into a new directory.

The modern engine and old physical format are not interchangeable. See the [migration guide](https://bsonlite.com/docs/migration.html) and [core upgrade instructions](https://github.com/MohammadAtikurRahman/BsonLite/blob/main/native/modern/UPGRADE.md). The [earlier 0.6 reference](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/LEGACY_0_6.md) remains available for legacy applications.

## Compatibility and validation

| Area | Modern standalone profile |
| --- | --- |
| CRUD, BSON, indexes and aggregation | Bundled engine/driver APIs; selected cases validated |
| Server-side JavaScript | Disabled, including `$where` and `$function` |
| Replica-set multi-document transactions | Outside this standalone configuration |
| Change streams | Outside this standalone configuration |
| Atlas-only services | Not included |
| Console expressions | Supported interpreter subset, not arbitrary JavaScript |
| Complete MongoDB Community parity | Not yet established by exhaustive comparative testing |

The original modern engine evidence is [Windows run 40207704023](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40207704023), core commit `69920051901246994896c1bc53cc5f32bacaabd3`. The required native/source, runtime/migration and final-bundle groups passed 7, 3 and 9 cases respectively. These groups overlap; they are not independent certification or an exhaustive query matrix.

Prepared npm packages include `MODERN_VALIDATION.md`, `validation.json` and matching raw reports. Clean Windows Home/Pro hardware, packaged app integration, cross-PC restoration, large-data performance, power-loss/disk-full behavior and independent security review remain separate work. Read the [compatibility page](https://bsonlite.com/docs/compatibility.html) before adopting this alpha.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `BSONLITE_NOT_STARTED` | Await `connect()` before calling shared collection APIs |
| Cannot open the data directory | Use a writable private path; check for another live owner |
| Console cannot discover the database | Keep the app running under the same account; check whether Console access was disabled |
| Old data fails with the modern engine | Follow the logical migration guide; preserve the original store |
| Installed version is unexpected | Check registry dist-tags and `npm ls bsonlite-sdk` in the consuming application |

See the [troubleshooting guide](https://bsonlite.com/docs/troubleshooting.html). When reporting a problem, include package/engine versions, Windows build, Node.js version and a minimal reproduction. Do not attach private vaults, credentials, keys or personal records.

## Source, licenses and support

BsonLite is independently developed and is not an official MongoDB product.

- [BsonLite core](https://github.com/MohammadAtikurRahman/BsonLite): engine integration, lifecycle and storage.
- [npm SDK repository](https://github.com/MohammadAtikurRahman/Bsonlite-SDK): package exports and release tooling.
- [BsonLite Console](https://github.com/MohammadAtikurRahman/BsonLite-Console): GUI, CLI and installer.
- [Report an issue](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/issues).
- [Support BsonLite](https://buymeacoffee.com/bsonlite).

The JavaScript wrapper is MIT licensed. The modified engine remains SSPL-1.0, and bundled components retain their own licenses. The wrapper's license does not relicense the engine. Prepared modern npm packages include matching modified engine source under `source/` and component notices under `licenses/`. Additional source downloads are available on the [download page](https://bsonlite.com/download.html#source).

Maintainers: see the [publishing guide](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/blob/main/PUBLISH.md). This README is the canonical user guide copied unchanged into newly prepared modern packages. Keep its contents stable between releases; edit it when features, requirements, behavior or documentation need a meaningful correction.
