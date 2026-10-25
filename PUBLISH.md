# Publish from your local SDK checkout

The current release snapshot is **bsonlite-sdk@0.7.0-alpha.0**, containing engine 9.0.4 and driver 7.7.0. It is the exact tarball prepared, installed and verified by successful [core Windows run 40207704023](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40207704023).

Run these commands inside your existing local Bsonlite-SDK repository:

```powershell
git pull --ff-only origin main
npm run release:verify
npm login
npm run release:stage
npm stage list bsonlite-sdk
```

No separate artifact download, C++ compiler, npm install or manual version edit is needed. Node.js 24 is the tested maintainer runtime. Staged publishing needs an npm CLI with `npm stage` support (11.15+). Your existing 11.16 CLI supports these commands.

`release:verify` reconstructs the original modern tarball from the tracked `release/packed/` files into the ignored `.release/` directory. It checks every part, the complete tarball, package identity/version, native build metadata, actual SDK and source hashes, and original Windows runtime report hashes. It never executes the database engine during verification. `release:stage` verifies again and passes that exact tarball to npm under the `next` tag.

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

Do not bump the root package.json version to claim a new engine release. For a changed SDK, prepare a new unique prerelease using the full core Windows gates and refresh the tracked release snapshot. The original tarball bytes and corresponding source remain intact.

The [advanced preparation guide](MODERN_ENGINE.md) describes generating another validated package. Normal maintainers publishing the current snapshot only need the local commands above.
