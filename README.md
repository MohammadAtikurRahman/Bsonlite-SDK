# bsonlite-sdk

The npm package for **BsonLite**, a portable database for Node.js and Windows applications.

## Products and downloads

| Name | What it is |
| --- | --- |
| **BsonLite** | The database, available as one `BsonLite.cjs` file. |
| **`bsonlite-sdk`** | The npm installation of BsonLite. |
| **BsonLite Console** | The desktop GUI, integrated query console and optional terminal CLI. |

[Website](https://bsonlite.com) · [Downloads](https://bsonlite.com/download.html) · [Documentation](https://bsonlite.com/docs/) · [Discord](https://discord.gg/vSRMRPYqs)

## Install the modern version

```sh
npm install bsonlite-sdk@next
```

The published modern version is **0.7.0-alpha.0**, using engine 9.0.4 and driver 7.7.0. It requires Windows x64 build 20348+ (Windows 11 / Windows Server 2022+) and Node.js 20.19+. Node.js 24 is recommended. This database profile is experimental; see the exact [compatibility and test evidence](https://bsonlite.com/docs/compatibility.html).

```js
const BsonLite = require('bsonlite-sdk');

async function main() {
  await BsonLite.connect('myapp');
  const users = BsonLite.collection('users');
  await users.insertOne({ name: 'Atik' });
  console.log(await users.find({}).toArray());
  // Keep connected while your application is running.
}
main().catch(console.error);
```

ES modules use `import BsonLite from 'bsonlite-sdk'`. Await the connection before using collections. Call `await BsonLite.disconnect()` when the application exits. Use `BsonLite.BSON` and `BsonLite.ObjectId` for typed query values.

The default `npm install bsonlite-sdk` currently retains **0.6.0-rc.3** for existing applications. Its physical 4.0 data files must not be opened by the modern engine. Follow the [logical upgrade guide](https://bsonlite.com/docs/migration.html) into a new directory, keeping the original records, vault and backup. See [earlier 0.6 reference](LEGACY_0_6.md) when maintaining that version.

## Prefer one file?

[Download BsonLite.cjs](https://bsonlite.com/download.php?file=bsonlite), put it beside your application's entry file and use `require('./BsonLite.cjs')`. It is BsonLite itself, with the tested native engine and required JavaScript dependencies included. The npm package and standalone file are alternative ways to add BsonLite to an app.

## Open your database in BsonLite Console

[Download the Console .exe setup](https://bsonlite.com/download.php?file=console). Run it once, then open **BsonLite Console** from the desktop or Start Menu. Leave your BsonLite app running under the same Windows account, select its database and click Connect. The URL is filled automatically, stays visible and has a Copy button.

Connections start read-only. Enable writes in Options when needed. Uninstall Console through Windows Settings or Control Panel. The desktop app includes its own runtime; the optional terminal CLI is documented in the [Console guide](https://bsonlite.com/docs/console.html).

[Download BsonLite + Console together](https://bsonlite.com/download.php?file=bundle) if you want both files and the quick start. Installing the npm package does not install the desktop application.

## Maintainer: local release snapshot

The repository root intentionally retains the checksum-protected 0.6 payload for compatibility tests. The modern release commands reconstruct the **separate, exact Windows-tested 0.7 tarball** from tracked parts:

```sh
git pull --ff-only origin main
npm run release:verify
npm run release:stage
npm stage list bsonlite-sdk
```

The current 0.7.0-alpha.0 snapshot is already published under `next`; npm cannot publish that version again. A future release needs a newly validated snapshot and a unique version before staging. Root npm script headings can still show 0.6; the helper prints and stages the modern package explicitly. See [PUBLISH.md](PUBLISH.md) for authentication, automated review and approval commands, and [MODERN_ENGINE.md](MODERN_ENGINE.md) for preparation.

## Source, contributions and support

- [BsonLite core](https://github.com/MohammadAtikurRahman/BsonLite): lifecycle, storage, encryption and engine integration.
- [This npm package repository](https://github.com/MohammadAtikurRahman/Bsonlite-SDK): exports, package checks and release tooling.
- [BsonLite Console](https://github.com/MohammadAtikurRahman/BsonLite-Console): GUI, CLI, discovery and Windows installer.
- [Support BsonLite on Buy Me a Coffee](https://buymeacoffee.com/bsonlite).

The JavaScript wrapper is MIT licensed. The modified engine and dependencies retain their own licenses, including SSPL for the engine. Matching source and component notices remain available through the [website download page](https://bsonlite.com/download.html#source). See [SECURITY.md](SECURITY.md) and [TEST_RESULTS.md](TEST_RESULTS.md).
