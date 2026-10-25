# Publish from your local BsonLite checkout

The current pinned snapshot, 0.7.0-alpha.0, is already published under `next`. npm versions cannot be reused. These commands describe that release flow; prepare a newly validated snapshot with a unique version before another publish.

The current release snapshot is **bsonlite-sdk@0.7.0-alpha.0**, containing engine 9.0.4 and driver 7.7.0. It is the exact tarball prepared, installed and verified by successful [core Windows run 40207704023](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40207704023).

## README policy: one guide for GitHub and npm

`README.md` is the canonical user-facing guide. `scripts/prepare-modern.cjs`
copies its exact bytes into each newly prepared modern package before computing
checksums. Do not replace it with generated release notes or a shortened template.
Keep the guide unchanged when a release introduces no relevant new information.
Update it when features, requirements, behavior or documentation need correction;
record release-specific changes separately in the changelog and validation files.

`npm run test:modern-preparation` checks that the prepared directory and actual
`npm pack` archive preserve the full README, that a later package version keeps
the same guide, and that altering the packed README fails integrity verification.

### Already-published 0.7.0-alpha.0

The frozen `release/snapshot.json` and `release/packed/` still identify the
original, published tarball, including its old short README. Updating GitHub or
running `release:verify` does not rewrite that archive. Do not stage it again to
try to update npm documentation. Its version cannot be republished or reused,
even after unpublishing.

npm requires a new package version to update the displayed README:
https://docs.npmjs.com/about-package-readme-files/

For a documentation correction, prepare a new unique version (for example
`0.7.0-alpha.1`) with the canonical README, retain matching engine/source/runtime
evidence, verify the resulting archive, and refresh the release snapshot before
using the local stage helper. A documentation-only release must not claim new
native runtime validation. Do not change the root package version to bypass this
flow; the root retains the legacy payload.

Before submitting a future snapshot, inspect its actual README:

```powershell
npm run release:verify
tar -xOf .release/bsonlite-sdk-NEW_VERSION.tgz package/README.md
```

Replace `NEW_VERSION` with the verified snapshot version and compare its contents
with `README.md`. If they differ, fix package preparation before publishing.

## Original snapshot workflow (historical reference)

The following commands describe the already-published snapshot. They become a
future release workflow only after preparing and pinning a new unique snapshot.

Run these commands inside your existing local bsonlite-sdk repository:

```powershell
git pull --ff-only origin main
npm run release:verify
npm login
npm run release:stage
npm stage list bsonlite-sdk
```

No separate artifact download, C++ compiler, npm install or manual version edit is needed. Node.js 24 is the tested maintainer runtime. Staged publishing needs an npm CLI with `npm stage` support (11.15+). Your existing 11.16 CLI supports these commands.

`release:verify` reconstructs the original modern tarball from the tracked `release/packed/` files into the ignored `.release/` directory. It checks every part, the complete tarball, package identity/version, native build metadata, actual BsonLite and source hashes, and original Windows runtime report hashes. It never executes the database engine during verification. `release:stage` verifies again and passes that exact tarball to npm under the `next` tag.

Use the new stage ID shown by npm:

```powershell
npm stage view YOUR_STAGE_ID
npm stage approve YOUR_STAGE_ID
```

Replace `YOUR_STAGE_ID` with the actual ID. If npm still reports `validating`, wait for automated review to finish before approving. Complete browser/2FA authentication when requested. If the intended version is already staged, inspect and approve its existing ID instead of staging the same version again.

After publication:

```powershell
npm view bsonlite-sdk@next version
```

Expected: `0.7.0-alpha.0`. Consumers install this experimental release with:

```sh
npm install bsonlite-sdk@next
```

The ordinary `latest` tag is unchanged by these commands.

## Check without submitting anything

```powershell
npm run release:stage -- --dry-run
```

The dry run verifies the real local tarball and prints the planned command. It does not invoke npm publication or account authentication.

## Repository and release versions

The repository root retains the checksum-protected 0.6 payload for backwards-compatibility tests. Its npm script header may therefore display 0.6.0-rc.3. The release commands print the actual modern package version and explicitly stage the verified 0.7 tarball; they do not publish the root folder.

Do not bump the root package.json version to claim a new engine release. For a changed BsonLite, prepare a new unique prerelease using the full core Windows gates and refresh the tracked release snapshot. The original tarball bytes and corresponding source remain intact.

The [advanced preparation guide](MODERN_ENGINE.md) describes generating another validated package. Normal maintainers publishing the current snapshot only need the local commands above.
