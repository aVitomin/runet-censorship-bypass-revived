# Chromium and Firefox development

Supported sources are `extension/src/chromium` and `extension/src/firefox`.
The only npm root is `extension`; there is no root npm package.

[Contributing](../../CONTRIBUTING.md) · [Testing](TESTING.md) ·
[Architecture](ARCHITECTURE.md) · [Release process](RELEASE_PROCESS.md)

## Setup

Use Git, Node.js 22 with compatible npm, and a browser with the required MV3 APIs.
Examples use PowerShell from the repository root; npm scripts also run on Ubuntu
in CI. Browser requirements and actual QA are separate in
[Compatibility](BROWSER_COMPATIBILITY.md).

```powershell
git clone https://github.com/aVitomin/runet-censorship-bypass-revived.git
Set-Location .\runet-censorship-bypass-revived
$Project = '.\extension'
npm ci --prefix $Project
```

Never install dependencies or run npm scripts at repository root. Follow
[AGENTS.md](../../AGENTS.md) for task boundaries, dependency review and the final
affected-scope gate. Developer instructions/comments are English; user copy keeps
its intended locale. Preserve historical records, licenses and persistent IDs.

## Commands

| Purpose | Command |
| --- | --- |
| Documentation/instructions | `node .\scripts\verify-docs.mjs` and `git diff --check` |
| Focused PAC feedback | `npm --prefix $Project run test:pac` |
| Chromium final gate | `npm --prefix $Project run verify:chromium` |
| Firefox final gate | `npm --prefix $Project run verify:firefox` |
| Shared/templates/Gulp final gate | `npm --prefix $Project run verify` |

Target gates include lint, deterministic tests and verified builds. PAC tests are
already included in Chromium tests. Aggregate `verify` runs all maintained suites
and both builds once. Do not rerun unchanged included suites. The dependency-free
docs verifier needs no npm install. `scripts/required-checks.mjs` is advisory;
AGENTS and CI remain authoritative. See [Testing](TESTING.md) for details.

## Source and package map

| Purpose | Path |
| --- | --- |
| Chromium runtime | `extension/src/chromium` |
| Chromium entrypoint | `extension/src/chromium/background/service-worker.js` |
| Chromium UI | `extension/src/chromium/pages/popup`, `pages/options` |
| Chromium manifest | `extension/src/chromium/manifest.tmpl.json` |
| Firefox runtime | `extension/src/firefox` |
| Shared modules/assets | `extension/src/shared`, `extension/src/assets` |
| Repository-only helpers/tests | `extension/src/tooling` |
| Version/template values | `extension/src/templates-data.js` |
| Packaging authority | `extension/gulpfile.js` |
| Unpacked outputs | `extension/build/chromium`, `extension/build/firefox` |

Both builds clean only their own output and do not depend on build order. Inspect
actual consumers and package trees when shared input changes. Chromium recursively
copies `src/chromium-compat/pages/lib`; adding a file changes packaged bytes.
Firefox uses explicit allowlists. The nested legacy Options package is removed.
MV2 is historical and is not built from maintained `main`.

Use the current fork name in new links/remotes. Old release asset names,
provenance, RPC and storage identifiers do not change with repository naming.
Use `chromium` and `firefox` for both target contexts and new artifact names.
Their template contexts share one immutable release version; Firefox does not
read its version from the Chromium context. Manifest V3 describes both targets.
Release tooling resolves the root through Git, not directory name or depth.
Moving the npm root requires reviewed paired manifest/lock renames and unchanged
package identity; see the supply-chain gate in [Testing](TESTING.md).

## Load an unpacked build

1. Run `npm --prefix $Project run build:chromium`.
2. Open `chrome://extensions` or `brave://extensions` and enable Developer mode.
3. Use Load unpacked and select `extension/build/chromium`.
4. Rebuild and Reload after source changes.

Use a disposable profile without personal history, bookmarks or unrelated proxy
extensions. Do not commit profiles, NetLog, `build`, `dist` or `.tmp`.
See [Firefox release build](FIREFOX_RELEASE_BUILD.md) for Firefox packaging and
the distinction between temporary and signed installation.

Optional local service hints belong in ignored `.local/qa/environment.json`.
They are not automatically consumed by tests. Recheck timestamps, process and
listener before authorized real-service QA; `null` means unknown. Synthetic tests
must not depend on these applications. Tor Browser is not a normal Firefox QA
executable.

## Localization and UI

Update both `en/messages.json` and `ru/messages.json` under each affected target's
`_locales`. Keep keys/placeholders aligned; inspect both locales and run the
affected final gate. Use text-safe DOM APIs for stored values.

Popup refresh uses the selected source updater. With protection active, it updates
Effective source data without applying pending Saved or Draft; while OFF it may
prepare data but must remain OFF. Concurrent popup requests coalesce. The popup's
manual-mode action does not fetch a provider list; background source checks may
still run. Results distinguish unchanged, applied, prepared,
deferred and failed updates.

Source-data date and last successful check are separate. Chromium uses the source
file modification date; Firefox uses the validated dataset date. Neither proves
every entry is current. Unknown dates or age over 30 days produce an informational
warning without changing routes. Shared `routing-data-status` validates public
format/presentation; browser controllers retain trust, download, ownership and
promotion logic.

## Icons

The authoritative artwork is the procedural
[generator](../../extension/src/chromium/test/generate-action-icons.js), despite
its Chromium source location. It defines geometry, palette, 4× supersampling and
PNG encoding; there is no separate SVG/master. From repository root:

```powershell
node .\extension\src\chromium\test\generate-action-icons.js
npm --prefix .\extension run verify
```

`src/assets/icons` contains active/off/loading/busy/warning/external icons at
16/19/20/32/38 px; active additionally has 48/64/128 px. Packages retain `icons/...`.
Firefox general icons declare 32/48/64/128 px; Chromium declares 16/32/48/64/128 px.
Adding general sizes does not change action maps. The same generator creates
[brand/icon-512.png](../../extension/src/assets/brand/icon-512.png), a transparent
active-icon derivative for store artwork. `brand` is not packaged; it is neither
a second master nor a finished promotional tile. Do not hand-edit derived PNGs.
Tests check dimensions, RGBA, transparency, metadata absence and exact generation;
package checks verify runtime/manifest references and shared bytes.

## CI and pull requests

[Verify extension](../../.github/workflows/extension.yml) runs on Node 22 for PRs
and `main` pushes. Separate policy/supply-chain, tooling, Chromium and Firefox
checks preserve the required **Verify MV3** name; do not rename remote-protection
contracts without agreement. Chromium smoke is an additional gate. Reproducible
release archives/uploads run only for trusted `main` push or explicitly dispatched
exact `main`, never PRs.

Keep changes scoped and update the appropriate current docs when behavior,
installation, support, privacy/security, commands, architecture or release process
changes. Record actual checks and remaining browser QA; await required CI/review
before an authorized merge. See [Contributing](../../CONTRIBUTING.md).
