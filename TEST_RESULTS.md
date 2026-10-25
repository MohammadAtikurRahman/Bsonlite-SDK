# BsonLite validation

## Current local release snapshot: 0.7.0-alpha.0

The local publishing tools passed on Windows Server 2022 and Ubuntu 24.04,
Node.js 24, in SDK commit `5d418954f677e3f9b624575be37006a4d0fc88fb`:
[run 40213330000](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/actions/runs/40213330000).
Each platform passed the two retained distribution tests, five modern
preparation cases and eight local-release cases, then reconstructed and
verified the actual modern tarball and exercised the staging dry run.

The exact release tarball is the one prepared, packed, installed and verified
by [core Windows run 40207704023](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40207704023),
core commit `69920051901246994896c1bc53cc5f32bacaabd3`. That core run passed
all required native/source (7), runtime/migration/CLI (3) and final embedded
consumer (9) cases, with overlapping coverage. The current tarball SHA-256 is
`ae05f04312efc318948b6cf8a517063225ce751349b43a4a5bf1e7e6ec7233cf`.

The archive is stored as 38 binary Git parts. Verification checks every part,
the complete archive, npm identity/version/tag, native build metadata,
actual SDK and matching-source digests, and the original runtime report
digests. A source preview, a corrupt/missing part, an escaping part path or
a modified prepared archive is rejected. Staging arguments target this exact
0.7 tarball, independently of the retained 0.6 repository-root fixture.

No package was staged or published by CI or these implementation checks.
The dry run deliberately stops before npm authentication or registry writes;
the owner runs `npm run release:stage` and approves the resulting stage ID.
See [local publishing commands](PUBLISH.md). No runtime SDK bytes, engine,
Console adapter or previous 0.6 distribution were modified.

## Earlier experimental npm SDK 0.7.0-alpha.0 evidence

The following records describe an earlier preparation of the still-unpublished
prerelease. The local release commands use the current snapshot identified above.

The prepared modern package passed its actual core Windows engine gates on
**2026-10-25**, at core commit `5137fbc92749f20679445657d504718446db4eab`:
[run 40181496708](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40181496708).
The required source/native, runtime/migration/CLI and final embedded suites
passed 7, 3 and 9 cases respectively, without any required skip or failure.
These groups overlap. Migration covers 141 typed BSON records, validators,
indexes, a view and the preserved original store; runtime coverage includes
TLS/authentication, credential rotation and journaled data after forced engine
termination. See the [complete core evidence](https://github.com/MohammadAtikurRahman/BsonLite/blob/main/TEST_RESULTS.md).

The workflow used this repository's pinned preparation script to pack the
actual `bsonlite-sdk-0.7.0-alpha.0.tgz`, install it in an isolated Windows
consumer, and verify checksums, capabilities and inert CJS/ESM exports.
[npm artifact](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40181496708/artifacts/12594269894).
Tarball SHA-256: `67d24c400aa21ffb4419ec97c53d77c03708090fd1e1f71386612737cb2a5cd5`.

After download, the ZIP/tarball, SDK, modified engine source and raw JUnit
report hashes were independently matched to the successful native artifact;
the extracted package's verifier also passed locally. Original reports ship
under `validation/`. The package targets `next`; it has not been published by
the workflow. It remains experimental, with clean desktop/installer tests and
independent security review outstanding. [installation and publishing guide](MODERN_ENGINE.md).

## npm SDK 0.6.0-rc.3 with Console 0.2.0

The current package passed another real Windows packed-package/CLI check on
**2026-10-25**, at commit `24e83f3fb738d0f6235a14eaa6b64be314da1a9e`:
[run 40179501476](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/actions/runs/40179501476).
It verified the original distribution bytes, packed and installed the tarball
in an isolated consumer, then exercised the embedded 4.0.28 engine, discovery,
read/write controls, the terminal CLI, BSON Long, CRUD/indexes, session cleanup
and Console opt-out. The real Console CLI files are pinned to commit
`d03a5898a976280833653117b9a071d6bd4097ef`, with license and SHA-256 checks,
through the core repository's compatibility fixture. This check needs no
private cross-repository credentials. It does not validate the experimental
9.0.4 engine or a graphical desktop window.

The following record preserves the original release baseline.

The packed npm SDK passed a real native Windows integration run on **2026-10-20**:

- Tested SDK repository commit: `3801124ab3c0a9ebb9cbe1a0c69bc383dc7e2262`.
- Successful workflow: https://github.com/MohammadAtikurRahman/Bsonlite-SDK/actions/runs/39447330084.
- Console/CLI source: `f118504cc89f457f4039c6a8757740e86e522331` (Console 0.2.0).
- Runner: Windows Server 2022 x64, Node.js 24.21.0, npm 11.19.0.

The workflow ran the npm distribution/import tests, verified the native core/source/checksums, packed the actual package, installed its tarball in an isolated consumer and exercised the embedded encrypted Windows engine. It checked automatic local discovery, a read-only Console connection, explicit write controls, CLI connection without a pasted URL, BSON Long preservation, CRUD/indexes, viewer disconnect without stopping the app, session cleanup on stop, and Console opt-out on reopen.

These checks use the desktop app's shared Connection layer and terminal CLI against the real native engine. They do not claim that the graphical Electron window was exercised on Windows. The earlier actual Electron UI workflow was checked on Linux. Clean Windows Home/Pro machines, packaged application integration and the other limits below remain separate work.

Windows checkout handling preserves the original SDK bytes. Local regression checks converted all five checksummed text files to CRLF and restored the exact recorded bytes, and confirmed that a meaningful local source edit is refused and retained. A publish dry run passed with the Console entry, bundled adapter, guide, running example and matching engine source included. No install scripts or new runtime npm dependencies were added.

Documentation-only commits may follow the tested commit. The native core and compiled Console adapter checksums are unchanged.

## Native SDK 0.6.0-rc.1 baseline


The complete native Windows workflow passed on **2026-10-19**, including the actual rebuilt engine, source SDK, final single-file SDK and earlier-format compatibility tests.

- Tested code commit: `1cf4c8d81c271ab85cdadd84ebac998101712ab1`.
- Successful run: https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/39260874503.
- Artifact: `BsonLite-native-Windows-x64-1cf4c8d81c271ab85cdadd84ebac998101712ab1`, GitHub artifact ID `12190998067`.
- Artifact ZIP SHA-256: `5a289bd7dd36c55ad0762e846bdbdf42506de2ae21558c2900f353ba8c8e81f8`.

Documentation-only commits can follow this tested commit. The artifact's `validation.json` records the exact tested code/run and modified-engine source hash; `SHA256SUMS.txt` records the CJS and build-info hashes. A source-preview bundle is a different artifact and contains no engine.

## Windows results

Runner: Windows Server 2022 x64, Node.js 24. Engine: pinned MongoDB 4.0.28 / WiredTiger 3.1.1 with built-in BsonLite encryption and libsodium 1.0.22. Native compiler profile: v141 14.16, Windows SDK 10.0.19041.0, static C runtime, Windows SChannel TLS.

| Check | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Unit, security, compiled crypto and Windows helpers | 35 | 0 | 0 |
| Focused parent-exit and HTTP starter preflight | 2 | 0 | 0 |
| Source SDK with the actual native engine | 8 | 0 | 2 |
| Final artifact packaging | 2 | 0 | 1 |
| Final single-file native SDK integration | 10 | 0 | 0 |
| Final single-file earlier-format integration | 18 | 0 | 0 |

The two source-suite skips require the final embedded bundle and passed in the subsequent final native suite. The packaging skip exercises unsupported platforms and does not apply on its supported Windows runner; it passed on Linux. The preflight repeats the two lifecycle cases before the longer suites. Counts across these rows overlap and are not presented as distinct tests.

The final native suite exercised real CRUD/BSON values, indexes and reopening, encrypted WiredTiger data and journals, actual aggregation spill files in Unicode paths, rejection of per-collection plaintext overrides, wrong protected-key refusal without data reset, encrypted native backup/restore, BSON-preserving migration and views, interrupted-migration refusal, full-native capability gating, isolated consumers without npm packages/developer binary paths, and concurrent extraction into a fresh engine cache.

The final earlier-format suite exercised authenticated connections and account rotation, rejection of missing/incorrect TLS certificates and hostnames, independent stores/ports, forced parent termination with engine/helper cleanup and persisted data, import/require in an empty consumer directory, encrypted backups and tamper rejection, path-traversal rejection, original-preserving upgrade, identity/lock protections, Unicode paths and the actual HTTP starter lifecycle. Both parent-exit cases also require the owned Windows processes to exit before fixture removal.

## Native build evidence

The matching native source compiled and linked in run `39243938792`; the actual engine cipher self-test exited 0, runtime-DLL and engine-minidump import guards passed, and the exact modified-source archive was generated. Its compiled outputs were cached before SDK tests. The successful final run above reused that unchanged source-keyed cache, applied the UTF-8 process manifest, reran the actual cipher self-test, rebound the executable/source hashes, and passed all runtime stages before uploading an artifact. No Windows validation flag was fabricated.

The archived patcher plus four implementation files reproduce `native-engine.json`'s `patchSha256`. The accompanying modified-source archive includes the patched engine, build support, pinned libsodium source, UTF-8 manifest and notices. The CJS embeds the actual engine and reports `nativeReady:true` / `distributionMode:native-encrypted`. After download, the artifact ZIP hash, CJS/build-info checksums, modified-source hash and archived patch provenance were independently matched before preparing the starter ZIP.

A separate actual v141/static-CRT Windows probe passed UTF-8 narrow-fstream read/write in a Bengali path and `_mul128` arithmetic in run `39246830155`. The exact pinned upstream patch fixture passed and a second application was refused.

## Additional local evidence

Linux x64 validation covered the source SDK, unsupported-platform packaging behavior, real earlier-format MongoDB integration, and six real encrypted WiredTiger prototype integration cases. The Linux prototype lacks the MongoDB temporary-file hooks and is not a supported full-native customer distribution. After the engine pipe/log transport fix, all 18 earlier-format bundled integration cases passed locally. `npm audit --omit=dev --json` reported no known production npm dependency advisories on 2026-10-19; this does not audit the native engine.

## Remaining validation limits

This is a **release candidate**, not a production security certification. Clean Windows Home/Pro PCs, packaged Electron/installers, cross-PC restore, power-loss/disk-full durability and an independent storage/cryptography review remain pending. CI ran on Windows Server 2022, not every advertised compatible Windows version. Node.js is still required; this CJS is not a standalone EXE.

MongoDB 4.0 is end-of-life. No upstream server maintenance, anti-rollback protection, explicit key-slot erasure after the engine's fast termination, or confidentiality against compromised runtimes, administrators, pagefiles, hibernation and OS crash dumps is claimed. See `SECURITY.md` for the precise model and limitations.
