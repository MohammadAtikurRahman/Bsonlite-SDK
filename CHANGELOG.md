# 0.6.0-rc.3

- Automatically announce running databases to BsonLite Console 0.2.0.
- Existing app connection code and the validated native core remain unchanged.
- Add private local session cleanup and an explicit Console opt-out.
- Windows runtime validation for the new Console adapter remains pending.

# Changelog

## npm 0.6.0-rc.2

- Publish the updated installation, connection and query documentation under a new npm version after the registry rejected reuse of 0.6.0-rc.1.
- Point package repository metadata at the public Bsonlite-SDK distribution repository.
- Declare embedded SDK version separately as `bsonlite.sdkVersion`.
- Preserve the exact tested SDK 0.6.0-rc.1 binary, engine source, validation record and checksums. No database runtime changes.

## Embedded SDK 0.6.0-rc.1

The existing validated Windows x64 release candidate. See TEST_RESULTS.md and validation.json for evidence and remaining validation work.

