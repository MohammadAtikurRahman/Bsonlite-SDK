# Console and CLI with the npm package

Use `require('bsonlite-sdk')` or an ESM default import. Keep your existing `await BsonLite.connect()` call. The package entry point includes the automatic Console adapter.

Open BsonLite Console 0.3.0, select the running application and click Connect. The URL is filled automatically. Multiple applications appear separately; no folder selection or helper installation is needed.

[Desktop software and CLI](https://bsonlite.com/console.html).

The viewer is read-only by default. Enable writes explicitly in the GUI or with CLI `--write`. Without a URL argument, the terminal CLI discovers a running BsonLite automatically. Use `--help` for the supported query syntax.

Generated connection URLs contain private tokens. Do not publish them. `console: false` or `BSONLITE_CONSOLE=0` disables automatic discovery. Closing the viewer leaves the app running; stopping the BsonLite removes its session.

The modern BsonLite and the existing Console use different BSON majors; the authenticated bridge converts their typed values. Application code should use the BsonLite's own `BSON` and `ObjectId` exports.
