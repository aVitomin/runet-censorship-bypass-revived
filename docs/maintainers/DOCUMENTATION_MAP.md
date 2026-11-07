# Repository and documentation map

This is a navigation guide, not a snapshot of file counts. Inspect tracked files
and their consumers before changing ownership, packaging or cleanup rules.

## Two browser targets

One product has two supported Manifest V3 targets: **Chromium** and **Firefox**.
Chromium covers Chrome and compatible browsers such as Brave and Edge; Firefox
uses its own browser APIs. See [compatibility](../development/BROWSER_COMPATIBILITY.md)
for expected minimums and actual checks.

| Target | Source and entry point | Build / release output |
| --- | --- | --- |
| Chromium | extension/src/chromium/background/service-worker.js | extension/build/chromium, extension/dist/chromium-release |
| Firefox | extension/src/firefox/background/event-page.js | extension/build/firefox, extension/dist/firefox-release |

Both contexts share the version in extension/src/templates-data.js. Store
publication may happen on different dates. Manifest V3 is a shared technology;
historical filenames, installed IDs, storage/RPC keys and AMO slugs may retain mv3.
New package/CI names use the browser target; public labels clarify old downloads
without changing their URLs. See [release naming](../development/RELEASE_PROCESS.md#5-zip-and-checksums).

## Where to start

| Task | Guide |
| --- | --- |
| Understand the product and download it | [README](../../README.md) |
| Install, update or remove it | [Installation](../user/INSTALLATION.md) |
| Configure routing and connections | [User guide](../user/USER_GUIDE_1_0_2.md) |
| Troubleshoot or report a bug | [Support](../../SUPPORT.md) |
| Review privacy or report a vulnerability | [Privacy](../release/PRIVACY_1_0.md), [Security](../../SECURITY.md) |
| Prepare a development environment | [Development](../development/DEVELOPMENT.md) |
| Understand runtime boundaries | [Chromium/shared architecture](../development/ARCHITECTURE.md), [Firefox architecture](../development/FIREFOX_ARCHITECTURE.md) |
| Select checks or prepare a release | [Testing](../development/TESTING.md), [Release process](../development/RELEASE_PROCESS.md) |

[Documentation index](../README.md) separates user, developer and historical material.

## Shared ownership and packaging

- extension is the only npm root. Gulp, templates and maintained manifests
  determine version/build output; root npm commands are unsupported.
- extension/src/shared contains browser-neutral modules with target-specific
  copy rules. Inspect both consumers; a source path alone does not prove ownership.
- extension/src/assets contains shared product assets. Icons serve both targets;
  branding exports are not automatically packaged.
- extension/src/chromium-compat/pages/lib is recursively copied into Chromium
  only. Firefox uses explicit allowlists; do not broaden either package boundary.
- extension/src/tooling contains repository-only helpers/tests. MV2 is historical
  and is not built by maintained main.
- Root/scoped AGENTS.md and .agents/skills define applicable working rules.
  [Asset attribution](../../extension/assets/README.md) records licenses/provenance.

## Current facts and historical records

- docs/release-current.json records actual installable packages and store versions
  per target. README and installation guidance must agree with it.
- docs/development/releases records source/artifact hashes, checks and limits.
  Engineering guides link to these records instead of duplicating changing status.
- docs/release contains store/reviewer drafts and publication procedures;
  prepared text does not prove that a store field was saved.
- docs/user/USER_GUIDE.md, TROUBLESHOOTING.md and PRIVACY_AND_SECURITY.md describe
  Firefox 0.0.4.0. Their historical behavior must not be presented as current guidance.
- docs/legacy, release drafts and Git history preserve upstream/MV2 materials,
  completed audits, screenshots, original release scope and attribution. The
  [upstream archive](../legacy/UPSTREAM_README.md) is historical documentation.
- Release-page cleanup may improve navigation and labels, but must preserve
  original package URLs/bytes, source tags, QA limitations and release-time facts.
  Runtime provider URLs are active data sources, not obsolete repository links.

## Generated and private files

[Git ignores](../../.gitignore) and [editor settings](../../.vscode/settings.json)
exclude dependencies, build/dist, coverage, caches, profiles, logs and private
configuration. Keep source, tests, fixtures, skills, lockfiles and security evidence
searchable; a separate broad search-ignore file is unnecessary.

Generated files may exist locally. Their existence or lack of text references is
not permission to delete them. Verify actual consumers and preserve source,
licenses, profiles and release evidence before any authorized cleanup.

After navigation changes, run node scripts/verify-docs.mjs and git diff --check.
Packaging changes also require the applicable build checks and exact package-tree
comparison.
