# Chromium and Firefox release process

Release only from the exact validated commit on current clean `main`, successful
trusted-main CI and the identical artifact to be published. Chromium uses a built
MV3 ZIP. Firefox candidates include deterministic unsigned XPI, checksum and
reviewer source; normal installation needs a separate Mozilla signature.

> Missing required CI blocks release. Local tests cannot replace **Verify MV3**,
> documentation/supply-chain or target package-integrity gates.

This procedure grants no commit, tag, upload, store or announcement authority.
Follow [AGENTS.md](../../AGENTS.md) and the current maintainer-approved scope.

## 1. Prepare clean main

1. Fast-forward `main`; confirm a clean tree and record the full candidate SHA.
2. Confirm version agreement in `src/templates-data.js`, manifest templates and
   built manifests.
3. Install reviewed pinned dependencies using Node 22 in `extension` only.
4. Exclude reports, profiles, build/dist, archives, `.local`, `.tmp` and secrets
   from tracking/staging.

Shared templates/Gulp changes require byte comparison of both target trees with
trusted baselines. MV2 is not a maintained release target. Each build cleans only
its own output; build order is independent.

## 2. Local gates

From repository root:

```powershell
$Project = '.\extension'
node .\scripts\verify-docs.mjs
node .\scripts\verify-supply-chain.mjs
node --test .\scripts\verify-supply-chain.test.mjs
npm ci --prefix $Project
npm audit signatures --prefix $Project
npm --prefix $Project run audit:prod
npm --prefix $Project run verify
npm --prefix $Project run release:chromium
npm --prefix $Project run release:firefox
git diff --check
```

Aggregate verify runs lint, deterministic suites and both checked builds once.
Release commands separately prove reproducible rebuilds and create archives.
The tracked tree must remain clean. Record SHA, commands, exit status and logs.
Reuse passing evidence only with unchanged inputs/environment and cite its original
run; prose-only edits do not invalidate runtime checks. Dependency changes also
require `dependency-review` and final merged-state checks. Final artifacts, sources
and trusted-main CI must match the release commit.

## 3. Trusted-main CI

Require **Verify extension** for the exact `main` SHA as a trusted push. If that
push run is missing, do not rewrite/amend main to trigger it. An explicit dispatch
of the same workflow is acceptable only with `event = workflow_dispatch`,
`ref = refs/heads/main`, `head_sha = origin/main`, successful ordinary jobs and
that run's canonical artifact. Another branch is not trusted.

Check actual required jobs/steps, not only a green overall badge:

- Documentation, static supply-chain, verifier tests and registry signatures.
- Tooling/PAC/Chromium/Firefox deterministic coverage without duplicate runs.
- Target lint/build/package integrity, runtime icons and tracked-tree checks.
- Required Chromium browser smoke and stable final **Verify MV3**.
- Trusted-main Chromium ZIP/checksum and Firefox XPI/source/checksum uploads.

A missing required step blocks release until fixed and rerun on trusted main.
PRs intentionally upload no canonical release artifacts. Preserve **Verify MV3**
and existing release artifact names; check-name changes need a separate reviewed
branch-protection change.

## 4. Inspect the trusted artifact

Download the successful run's required target artifact for the exact SHA, rather
than independently rebuilding release bytes. Verify run/name/SHA, MV3/version,
manifest at package root, exact runtime list/hashes, icons and package integrity.
Exclude docs/screenshots/tests/maps/nested archives/profiles/logs, `.env`, `.local`,
`.tmp`, credentials and private URLs.

For Firefox, verify unsigned XPI checksum, Gecko ID, data-collection declaration,
reviewer source and exact extracted-byte match with the locally reproduced tree.
See [Firefox release build](FIREFOX_RELEASE_BUILD.md) and
[AMO reviewer notes](FIREFOX_AMO_REVIEW.md). Mozilla signs the submitted XPI;
signing credentials do not belong in Git or CI.

Required browser QA loads the unpacked trusted artifact in a clean profile.
Chromium checks Chrome/Brave with exact version recorded; one derivative is not
proof of all others. Use [Browser QA](TESTING.md#browser-qa) and only authorized
test proxy credentials, never logging passwords.

Firefox temporary XPI QA checks popup/options, Apply/recovery/Clear, EN/RU, auth,
private-access revocation and external control on an exact recorded browser.
Temporary unsigned installation is not the normal user path. The
[compatibility matrix](BROWSER_COMPATIBILITY.md) separates expected minimums from
actual QA; no need to test every derivative, but untested support is not confirmed.

## 5. ZIP and checksums

Use the canonical ZIP when present. If packaging the verified trusted directory,
archive its contents, not the directory itself; root manifest and extracted
runtime must match exactly. `release:chromium` is the local reproducibility command
and creates candidates under `dist/chromium-release` after two byte-equal builds;
it does not replace the trusted-main release artifact. Manual packaging example:

```powershell
$Package = '.\trusted-artifact'
$Archive = '.\dist\runet-censorship-bypass-mv3-<version>-<short-sha>.zip'
New-Item -ItemType Directory -Force .\dist | Out-Null
Compress-Archive -Path "$Package\*" -DestinationPath $Archive
Get-FileHash $Archive -Algorithm SHA256
```

Create a checksum asset naming the exact ZIP. Never overwrite a published asset
with different bytes under the same name.

## 6. Tag and release scope

- `v<version-name>` must point to the exact validated main SHA, not just a branch.
- Limited beta, incomplete agreed QA or significant known limits require prerelease.
  Not testing every version/derivative alone does not block stable.
- Stable requires agreed support scope, resolved blockers and sufficient native
  browser QA; unit tests alone are insufficient.

Before publication verify tag, prerelease flag, release path, asset names/sizes
and SHA-256. Commit, tag, upload and release are separate authorized actions.

## 7. Publish and read back

Release notes state status/audience, confirmed changes, browser QA/CI, manual
installation and its lack of store auto-update, asset names/hashes, security/routing
impact, limits and safe feedback channel. After authorized upload and before news:

1. Download public ZIP/checksum again; verify size, hash, checksum filename and root.
2. Compare extracted runtime with the trusted artifact.
3. Verify tag target/prerelease metadata and exclusion of secrets/repository files.

Any mismatch blocks release; never silently substitute different published bytes.

## 8. Documentation and store follow-through

README describes latest published, installable versions per target, not arbitrary
main. Chromium and signed Firefox can ship independently. After authorized release:

1. Update `docs/release-current.json` with exact public metadata.
2. Update README/status/QA/install text and check release, ZIP, checksum URLs/hashes.
3. Keep targets separate: pending AMO review/signature does not replace latest
   installable signed Firefox; unsigned XPI is not a normal-user link.
4. Run docs integrity and require successful CI for the changed documentation.
5. Follow the [store checklist](../release/STORE_PUBLICATION_CHECKLIST.md) for
   channel checks, signed artifacts, listing links and authorized announcements.

Unreleased tooling changes do not change README's public version. Main metadata
fields describe Chromium; if Firefox is a different release, set
`firefoxVersionName`, `firefoxTag`, `firefoxReleaseUrl` together and bind its
asset/hash/size to that signed file. Without them the verifier uses one release
for both. Old Firefox assets keep their original URL. Set `publishedAt` and public
asset facts only after confirmed publication; pending status stays explicit.
