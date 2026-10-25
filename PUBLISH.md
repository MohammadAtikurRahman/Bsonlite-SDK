# Publishing

For the current modern engine, use [MODERN_ENGINE.md](MODERN_ENGINE.md) and the validated package prepared by the core Windows workflow. Do not publish the old root distribution under a new version to claim an engine upgrade.

The repository root preserves the published 0.6.0-rc.3 payload and its checksums. Source changes, npm publication and distribution tags are separate actions. Never reuse an already published version or put registry tokens in source files.

Before publication, run the prepared package's tests and checksum verifier, then stage it under the intended prerelease tag and complete npm's owner authentication/review process.
