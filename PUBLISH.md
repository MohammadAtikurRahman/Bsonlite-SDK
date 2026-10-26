# Publish BsonLite from your local checkout

## Prepared release: 0.7.0-alpha.2 (public package metadata)

This prepared release adds the BsonLite description, search keywords, official homepage and issue link to the npm package. It retains the complete canonical README unchanged. SDK, engine, matching source,
licenses and Windows runtime reports remain byte-identical to the published
0.7.0-alpha.0 package. The embedded SDK still reports 0.7.0-alpha.0; only the npm
package version and public discovery/integrity metadata change. The metadata preparation tests do not constitute a new native runtime test. No new native
runtime validation is claimed.

The original `release/snapshot.json` and `release/packed/` remain intact as the
checksum-pinned baseline. `release/documentation.json` pins the new package version,
the baseline archive digest, the reviewed README digest and the digest of `release/package-metadata.json`. Only description, homepage, bugs and keywords may be overlaid; runtime settings, dependencies and exports are excluded. The local release
helper verifies the baseline, prepares the documentation release and verifies the
actual packed files before staging. It rejects unreviewed README changes and
modified cached archives. No full engine rebuild or manual artifact download is
needed for this metadata-only release. This file describes a prepared release; publication is complete only after npm approves it and the registry shows the new version.

## 1. Update and verify

Run inside your existing local Bsonlite-SDK repository:

```powershell
git pull --ff-only origin main
npm run release:verify
```

The final verification line must identify **bsonlite-sdk@0.7.0-alpha.2**.
The root npm script heading can still display 0.6.0-rc.3 because the repository
retains its separate legacy payload. Do not publish the root directory or bump
its package.json version.

The preparation uses Node.js, npm and the Windows `tar` command. Node.js 24 is
the tested maintainer runtime. Staging requires an npm CLI with `npm stage`
support (11.15+). The existing npm 11.16 CLI supports it.

Optionally inspect the README in the actual publish archive:

```powershell
tar -xOf .release/bsonlite-sdk-0.7.0-alpha.2.tgz package/README.md
npm run release:stage -- --dry-run
```

The dry run prepares/verifies the real tarball and prints the intended staging
command. It never authenticates or contacts npm publication endpoints.

## 2. Stage

```powershell
npm login
npm run release:stage
npm stage list bsonlite-sdk
```

The helper stages **0.7.0-alpha.2** with `--access public --tag next`. Complete
browser/2FA authentication when requested.

## 3. Review and approve

Use the actual new stage ID printed by npm:

```powershell
npm stage view YOUR_STAGE_ID
npm stage approve YOUR_STAGE_ID
```

If npm reports `validating`, wait for automated review before approval. If the
intended version is already staged, review/approve its existing ID rather than
staging it twice.

## 4. Verify publication and update the main page

```powershell
npm view bsonlite-sdk@next version
```

Expected: `0.7.0-alpha.2`.

To make this documentation update replace the current default on npm's main
package page and for ordinary installs:

```powershell
npm dist-tag add bsonlite-sdk@0.7.0-alpha.2 latest
npm view bsonlite-sdk dist-tags --json
```

This promotes an alpha release to the default, just as promoting alpha.0 did.
The `next` tag also remains on alpha.1. Refresh the npm page after propagation.
Consumers can install the explicit version or use the maintained tag:

```sh
npm install bsonlite-sdk@0.7.0-alpha.2
npm install bsonlite-sdk@next
```

## README policy: one maintained guide

`README.md` is the canonical user-facing guide. `scripts/prepare-modern.cjs`
copies its exact bytes into each newly prepared modern package before computing
checksums. Do not replace it with generated release notes or a shortened template.
Keep it unchanged when a release introduces no relevant information. Edit it for
new features, changed requirements/behavior or necessary documentation corrections.
Keep release-specific notes in the changelog and validation files.

The preparation tests check the README in both the prepared directory and actual
npm tarball, reject alterations, and verify preservation across package versions:

```powershell
npm run test:modern-preparation
npm run test:release
```

Already-published npm versions cannot be reused, even after unpublishing. Updating
GitHub does not replace an existing version's npm README. See npm's policy:
https://docs.npmjs.com/about-package-readme-files/

## Future releases

For a future documentation or public-metadata correction, review only the affected content, choose a new
unused prerelease version and explicitly refresh `release/documentation.json`.
The helper intentionally rejects an unreviewed change to the README or package metadata digest. `scripts/prepare-modern.cjs` also includes these same public fields in newly built modern packages. Keep `release/package-metadata.json` stable unless the product information changes.

For a runtime/engine change, use the full core Windows gates and the advanced
preparation workflow in [MODERN_ENGINE.md](MODERN_ENGINE.md). Refresh the native
release snapshot and remove or replace the documentation overlay; it must never
be silently applied to a different baseline. Retain matching source and runtime
reports. A documentation patch is not a substitute for validating changed code.
