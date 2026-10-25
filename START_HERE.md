# Getting started with the npm package

The repository root preserves the published `bsonlite-sdk@0.6.0-rc.3` distribution. The current core defaults to the newer 9.0.4 engine; its separately prepared 0.7 prerelease is described in [MODERN_ENGINE.md](MODERN_ENGINE.md). Changing the version in the old distribution does not upgrade its embedded engine.

Install a published package, or install a validated local prerelease tarball in a new application:

```sh
npm init -y
npm install ./bsonlite-sdk-0.7.0-alpha.0.tgz
```

Then use the package entry point:

```js
const BsonLite = require('bsonlite-sdk');
async function main() {
  await BsonLite.connect();
  await BsonLite.collection('users').insertOne({ name: 'Atik' });
}
main().catch(console.error);
```

Call `await BsonLite.disconnect()` when the application exits. Import is inert. Data defaults to `./Database`. BsonLite includes its engine and JavaScript dependencies; GUI software is installed separately.

Use the [Console guide](CONSOLE.md), [publishing guide](PUBLISH.md), and [database upgrade guide](https://github.com/MohammadAtikurRahman/BsonLite/blob/main/native/modern/UPGRADE.md). The modern profile requires Node.js 20.19+ and Windows x64 build 20348+.
