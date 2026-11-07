---
name: release-candidate
description: Prepare or audit Chromium/Firefox release candidates, exact artifacts, provenance, reproducibility, packaging and signing boundaries; exclude ordinary development builds.
---

# Dual-browser release candidate

Read `docs/development/RELEASE_PROCESS.md`. Distinguish preparation, read-only
candidate audit and authorized publication. Local archives are non-public
preflight evidence. Public artifacts must come from a complete successful
trusted-main run for the exact validated main SHA; dispatch is trusted only on
exact main. Respect existing task authorization; preparation grants no upload,
signing, commit, tag, release, overwrite or cleanup permission.

## Prepare and verify

1. Record source SHA and clean candidate tree. Check version authority, both
   manifests, Gecko ID, release metadata and tag/version agreement. Preserve
   unrelated changes; never obtain cleanliness by resetting another worktree.
2. Select one integrated gate: docs, supply-chain verifier/tests, registry
   signatures, production audit and full `verify`. Dependency/Action/vendor
   changes also need `dependency-review`. Reuse passing evidence only when its
   exact inputs/environment remain valid; final artifact/source hashes and
   trusted-main CI must still match the actual release commit.
3. Run `release:chromium` and `release:firefox` for preparation. Verify identical
   clean rebuilds, root manifests, package allowlists/checksums and Firefox
   reviewer sources. Use the reviewed pinned Mozilla addons-linter on the exact
   XPI. Trace target-specific Gulp copies, including shared product assets.
4. Scan staged paths, package trees and archives without printing secret matches.
   Reject dependency trees, caches, profiles, logs, env files, keys, credentials,
   private URLs, tests, source maps and nested output. Keep required runtime
   vendor files/licenses allowed by the package contract.
5. Verify the exact trusted-main run passed every required job and uploaded both
   canonical artifact sets. PR artifacts stay disabled. Signing/store submission
   remain separate external actions within the current approved scope.

For a read-only audit of existing candidates inspect hashes, contents and prior
evidence first; rerun only checks with missing/invalid evidence. Do not overwrite
published source/assets or rebuild automatically just to answer a status question.

Use exact packaged candidates in disposable profiles for applicable browser QA:
clean OFF, UI, routing, auth, provider data, Apply/Clear, restart, ownership loss
and private windows. Report observed compatibility separately from expectations,
including protected-origin contacts and credential-leak checks.

Return version/SHA, artifact names/sizes/hashes, rebuild/linter/source results,
trusted run, package/security evidence, browser gaps and each channel's status.
Unfinished independent channels stay visible. Local preparation or store review
is not publication, and a status check does not authorize a new announcement.
