# Changelog

## npm 0.7.0-alpha.1 — documentation only

- Include the complete canonical README used on GitHub in the npm package.
- Preserve the exact SDK, native engine, source, licenses and runtime evidence from npm 0.7.0-alpha.0. The embedded SDK version remains 0.7.0-alpha.0.
- Regenerate only package-version and README integrity metadata; no new native runtime validation is claimed.
- Make local release verification and staging select this reviewed documentation overlay, while retaining the checksum-pinned original snapshot.

## npm 0.6.0-rc.3

- Automatically connect running SDK apps to BsonLite Console 0.2.0 and its terminal CLI through private local discovery.
- Keep the existing connect API, encrypted native core, engine source and storage format unchanged.
- Document desktop software downloads, terminal installation, writes, a running demo app and the publishing commands.
- Include an npm-ready Console demo in examples/.
- Preserve validated bytes across Windows Git checkouts; repair only line endings that match the exact recorded checksum.
- Verify the Console package entry, exports, metadata and notices before testing, packing or publishing.
- Add a Windows workflow that installs the actual packed SDK and checks the native engine through the Console adapter and terminal CLI.

## npm 0.6.0-rc.2

- Publish installation, connection and query documentation under a new npm version after reuse of 0.6.0-rc.1 was rejected.
- Point repository metadata at Bsonlite-SDK and declare embedded SDK version separately.
- Preserve the tested native SDK, engine source, validation record and checksums.

## Embedded SDK 0.6.0-rc.1

The existing Windows x64 native engine baseline. See TEST_RESULTS.md and validation.json for its original evidence and remaining validation scope.
