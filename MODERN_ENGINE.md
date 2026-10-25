# Prepare and publish the modern BsonLite

## Publish directly from an existing local checkout

The current validated 0.7.0-alpha.0 tarball is tracked as binary parts in this repository. From your local bsonlite-sdk folder, run `git pull --ff-only origin main`, `npm run release:verify`, `npm login` and `npm run release:stage`. Inspect the new ID with `npm stage list bsonlite-sdk`, wait for review, then approve using `npm stage approve YOUR_STAGE_ID`. See [the complete local publishing guide](PUBLISH.md). No manual artifact download is needed for this snapshot.

The remaining sections describe advanced manual preparation and testing of other successful core artifacts.

The modern core defaults to BsonLite 0.7.0-alpha.0, engine 9.0.4 and driver 7.7.0. Its Windows x64 profile requires build 20348+ and Node.js 20.19+. The source and prepared packages remain experimental.

The [core Windows workflow](https://github.com/MohammadAtikurRahman/BsonLite/actions/workflows/modern-engine.yml) builds the custom engine, verifies native storage, migration/CLI and final embedded consumers, then prepares and verifies the npm tarball. Use artifacts from a successful run. The repository root's preserved 0.6 payload is a separate distribution.

## Test a prepared tarball

Download `BsonLite-modern-npm-<commit>` from a successful core run and extract its ZIP. Match the tarball against its accompanying `SHA256SUMS.txt`.

In a new application folder:

```sh
npm init -y
npm install /path/to/bsonlite-sdk-0.7.0-alpha.0.tgz
```

Use `require('bsonlite-sdk')`. A running application is automatically discoverable by Console 0.3.0 and the CLI. Use the [database upgrade guide](https://github.com/MohammadAtikurRahman/BsonLite/blob/main/native/modern/UPGRADE.md) for old 4.0.28 stores.

## Publish the prepared package

In a separate directory containing the tarball:

```sh
tar -xzf bsonlite-sdk-0.7.0-alpha.0.tgz
cd package
npm test
npm run verify
npm stage publish --access public --tag next
```

Authenticate through your browser/2FA when npm requests it. After automated review finishes, use the new stage ID:

```sh
npm stage list bsonlite-sdk
npm stage approve YOUR_NEW_STAGE_ID
```

The prerelease uses `next`. Registry publication is a separate owner action; pushing GitHub source does not publish a package. After approval/publication, consumers can install `bsonlite-sdk@next`.

A previously published version cannot be reused. Reprepare with `--version 0.7.0-alpha.1` when a new version is needed; editing the prepared package.json alone breaks its checksums.

## Prepare from a full native artifact

Extract `BsonLite-modern-experimental-<commit>` and use that run's exact commit and run ID:

```sh
node scripts/prepare-modern.cjs --artifact /path/to/expanded-artifact --out ./prepared-modern --commit CORE_COMMIT_SHA --run-id CORE_RUN_ID
cd prepared-modern
npm test
npm pack
```

The output directory must be new and outside the artifact. The preparer verifies the actual BsonLite, engine/source hashes, CI identity and three raw JUnit reports. It preserves matching source, component notices, validation records and report hashes. There is no engine-download postinstall script.

The default core build writes `dist/BsonLite.cjs`; the workflow also preserves a `dist-modern` compatibility copy for the existing artifact preparer. A source-preview CJS cannot be published as an executable database BsonLite.

Standalone server-side JavaScript, replica-set transactions and change streams are outside this profile. Clean desktop/installer checks and independent security review remain separate work.
