# Testing

Run commands from repository root. The only npm root is `extension`:

```powershell
$Project = '.\extension'
npm ci --prefix $Project
```

## Select one final gate

[AGENTS.md](../../AGENTS.md) defines the affected-scope gate and authority;
this guide explains coverage. Focused suites are development feedback, not a
replacement for the final gate. `test:pac` is included in `test:chromium`, which is
included in `verify:chromium`. Aggregate `verify` runs all maintained suites once.
Do not repeat unchanged included suites after a passing gate.

Record source SHA, relevant inputs, command, exit status and evidence. Reuse checks
only while inputs/environment still apply and name the original run. Diagnose a
timeout and host load before retrying; retain failed and successful evidence.
Documentation-only changes do not invalidate runtime checks. Local results do not
establish CI, browser QA, release provenance or signing.

`scripts/required-checks.mjs` is advisory. It considers staged/unstaged changes
against HEAD, deletions, both rename paths and non-ignored untracked files; it
omits suites included in a selected final gate. Shared icons affect both targets.
Unknown paths conservatively select aggregate checks pending ownership review.
`scripts/repository-paths.mjs` lists tooling paths, not Gulp inputs or automatic
approval for file moves. Mapper tests:

```powershell
node --test .\scripts\required-checks.test.mjs
```

## Documentation and supply chain

The docs/agent/skill-only gate is docs integrity, relevant metadata validation and
whitespace checking. It requires no npm install:

```powershell
node .\scripts\verify-docs.mjs
git diff --check
```

The verifier scans tracked Markdown, relative links, images and anchors, rejecting
machine paths and stale current-release/default-branch/install metadata. It does
not require external sites to respond. Use `--audit-external` only for an intended
bounded live-link audit. New untracked Markdown must be included without staging
the real index. Docs integrity and whitespace checks are required before every PR.

Dependency/Action/vendor changes additionally require the repository
`dependency-review` workflow. Relevant supply-chain commands are:

```powershell
node .\scripts\verify-supply-chain.mjs
node --test .\scripts\verify-supply-chain.test.mjs
npm audit signatures --prefix $Project
npm --prefix $Project run audit:prod
```

Static policy allows one npm root, exact direct pins, official registry URLs,
integrity and only the reviewed install-script baseline (`fsevents@2.3.3`, optional).
MV2/nested Options compiler are excluded; a new nested package is an unreviewed
dependency boundary. Registry age is checked for newly selected direct PR versions.
The default is 168 hours. Earlier updates require a maintainer-authored exact
name/version/integrity review in `scripts/reviewed-dependencies.json`, schemaVersion
1 with `reviews`, source commit/date/rationale and checks for source, maintainers,
license, contents, code-diff, registry-signature, provenance, advisories and lock-delta.
CI checks completeness/byte binding, not the truth of conclusions. Different bytes
need a new review; registry/metadata failures remain blocking. Popularity and age
alone never establish safety.

A package-root move requires reviewed tooling/CI/build updates. Base comparison
recognizes only paired Git manifest/lock renames from one root with unchanged
package identity; partial/ambiguous moves block age review. Root discovery is not
approval. Existing rename matching uses 40% similarity for script-heavy manifests.

The recorded review of `actions/dependency-review-action` v5.0.0 pins signed commit
`a1d282b36b6f3519aa1f3fc636f609c47dddb294`: GitHub `actions` ownership, MIT license,
release 2026-05-08T20:23:50Z, reviewed 2026-08-26 (>2619 hours old). Its committed
Node 24 bundle runs without installing source dependencies. The reviewed lock had
753 entries, no non-registry sources or missing integrity; source build metadata
for esbuild/optional fsevents is not run. Workflow permission is `contents: read`,
custom license/severity policy is disabled, and Scorecard is advisory. This is
historical exact-release evidence, not approval of future Action versions.

CI runs `audit:prod` (`npm audit --omit=dev`) after installation and blocks any
production advisory. Selected `tldts` dependency files ship in both packages;
Gulp/test tools do not. Builds need ordinary `npm ci`, not `--omit=dev`. Full
`npm audit --prefix $Project` remains diagnostic: dev advisories need separate
reachability/current-advisory review. Repository build globs never process user
rules or downloaded PAC. Updating a test client needs API/smoke review even if
runtime bytes stay unchanged. Never use unreviewed major overrides or
`npm audit fix --force` to make reports green.

## Deterministic suites and builds

| Command | Coverage |
| --- | --- |
| `npm --prefix $Project run test:pac` | Executes final FindProxyForURL: exact/wildcard scope, Auto/Proxy/Direct, candidates, fallback, defaults and conflicts; generator-string checks alone are insufficient |
| `npm --prefix $Project run test:chromium` | Background/state queues, PAC/security/freshness/redaction, UI/action and deterministic API counters; includes PAC suite |
| `npm --prefix $Project run test:firefox` | Firefox state/routing/auth/UI and provider suites |
| `npm --prefix $Project run test:tooling` | Safe build cleanup, strict renderer templates, deterministic Firefox data generation, actual shared/browser ESLint rule application |
| `npm --prefix $Project run lint:chromium` | Focused lint feedback; not a final gate |
| `npm --prefix $Project run build:chromium` | Build plus runtime-icon and package-integrity checks |
| `npm --prefix $Project run verify:chromium` | Chromium lint/tests/verified build |
| `npm --prefix $Project run verify:firefox` | Firefox lint/tests/verified build |
| `npm --prefix $Project run verify` | One aggregate lint, one all-suite Mocha run, both builds |

Target/aggregate lint includes `src/shared/**/*.js`. Shared ES2018 modules use
correctness rules without browser-UI style rules; the `no-control-regex` exception
is limited to two input validators intentionally rejecting control characters.
Tooling tests are in aggregate verification, not duplicated in target gates.
Build checks require correctly cased referenced icons and exclude docs, tests,
profiles, logs, archives and secret-related metadata. Do not hard-code file counts.

CI additionally checks the tracked tree with `git diff --exit-code`. Firefox-only
changes need no Chromium gate unless shared inputs changed. CI runs equivalent
policy/tooling/browser jobs independently, with Chromium smoke and stable final
**Verify MV3**. Every required job must pass. MV2 is historical, not a maintained
build/test target. See [Release process](RELEASE_PROCESS.md) for artifact gates.

## Chromium browser smoke

After building Chromium, use installed Chrome Stable or select a supported
executable (including Edge/Brave) through `CHROME_BIN`:

```powershell
$env:CHROME_BIN = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm --prefix $Project run test:browser:chromium
```

The same unpacked MV3 tree runs in a disposable profile with loopback PAC, origin
and proxy receivers. Real HTTP receivers check Auto/Proxy/Direct via production
RPC and `chrome.proxy.settings`. Auth covers 407/onAuthRequired/retry, an unused
second authenticated proxy after full restart, HTTPS destination via HTTP CONNECT,
and TLS to an HTTPS PAC proxy with 407 inside the connection. A separate Direct
trap must remain empty. Edge may use a test-only CDP attach when its initial
process delegates and exits; production code is unchanged.

TLS needs OpenSSL (`OPENSSL_BIN` overrides; standard Windows Git paths are also
checked). Temporary certificate/key and a specific SPKI allowlist are used;
certificate checks are not globally disabled and the machine trust store is not
changed. Negative cases withhold credentials from origin 401, mismatched host/port,
passwordless proxy and excess wrong-password retries. A receiver barrier stops the
exact worker through CDP between 407 responses and proves the two-response budget
survives in `storage.session` for that request ID, without timing sleeps.

Receiver logs use only categories (`none`, `expected`, `known-wrong`, `unexpected`).
Search PAC, RPC, DOM, diagnostics and errors for password/Basic-token leakage.
External-controller takeover, deferred Turn off and restart persistence remain
covered. Retry metadata has no credentials and clears at browser-session/extension
reload boundaries. All services are local and Chrome executes PAC, not Node.
This does not prove full UI, an existing-profile upgrade, arbitrary real-network
leakage absence or machine policy behavior.

<a id="браузерная-qa"></a>

## Browser QA

Fakes do not prove a particular browser's behavior. Use disposable profiles,
synthetic data and an authorized test proxy account; record exact browser versions:

1. Install, cold start and background stop/restart.
2. Source selection and unified Apply.
3. Auto/Proxy/Direct with exact and domain/subdomain scope.
4. Turn off, reapply, external control takeover/release.
5. Changed/unchanged data refresh; OFF must stay OFF.
6. Tor/WARP/own proxy when the test environment provides them.
7. Real authenticated proxy challenge.
8. PAC/proxy errors, health status and recovery.
9. IndexedDB/state after restart and existing-profile upgrade.
10. EN/RU UI, keyboard, narrow and desktop layouts.

Focused checklists: [Action status](qa/ACTION_STATUS_BROWSER_QA.md),
[Apply freshness](qa/PAC_APPLY_FRESHNESS_BROWSER_QA.md),
[Download bounds](qa/PAC_DOWNLOAD_BOUNDS_BROWSER_QA.md),
[PAC failures](qa/PAC_FAILURE_BROWSER_QA.md),
[RPC credential redaction](qa/RPC_CREDENTIAL_BROWSER_QA.md).
Never use a personal profile or random public proxy. Sanitize NetLog, PAC,
history and screenshots before sharing.

## Firefox browser smoke

After `verify:firefox`, select installed Firefox with optional `FIREFOX_BIN`:

```powershell
node .\extension\src\firefox\test\firefox-auth-control-smoke.js
node .\extension\src\firefox\test\firefox-auth-control-smoke.js --manual
```

The disposable profile/local receivers and temporary takeover extension check real
407, password-only changes, Save B while Effective A serves requests, recreation
with pending B, then Apply B. Wrong passwords allow two attempts; new requests get
their own budget. Origin 401 remains website-owned, through Proxy and explicit
Direct, without proxy credentials. Proxy 407 without credentials fails without
Direct fallback.

A second extension takes ownership: product becomes durable OFF/EXT; Clear returns
`OWNERSHIP_MISMATCH` and preserves external proxy. Removing it releases the
resurfaced product floor, leaving OFF and original Direct. Assertions inspect real
receivers/Action API, not visual icon painting. Random passwords never enter stdout,
only stages/categories (`NONE`/`A`/`B`/`OTHER`); raw errors/headers are not logged.

The privileged driver clears auth cache only in its disposable profile with
`nsIHttpAuthManager.clearAll` before network cases to force challenges. Production
Apply does not clear browser cache or existing connections. Negative cases use
same-origin fetch because cancelled navigation may omit Marionette's expected load
event; timeout is failure, not a substitute for actual network rejection.

Full smoke includes 65 seconds idle and a changed boot ID. `--quick` skips only
that step and reports `recreationChecked: false`; it is not full coverage. The
smoke is separate from deterministic verify and cleans its profile/helper/servers.
It does not test HTTPS/CONNECT proxy, native prompt/UI, an in-flight auth-vs-Apply
race, or full restart of a permanently installed signed Firefox package.

`--manual` removes the Anticensority artifact only from its test copy. It checks
unavailable data storage, OFF Save, manual Apply/own-proxy auth/noDirect, idle
recreation with pending source/password changes and manual Effective recovery.
Failed provider Apply must preserve manual Effective; subsequent manual Apply,
Direct, website auth, ownership and OFF are checked. It does not prove no source
requests occur: manual mode still allows source checks; stage/defer is covered by
deterministic tests.

`firefox-lifecycle-smoke.js`, `firefox-proxy-control-smoke.js` and the auth smoke
accept absolute `FIREFOX_PACKAGE_ROOT`, defaulting to `extension/build/firefox`.
It does not modify the manifest. Marionette system access is confined to the
launched process/profile, not installed Firefox. The optional
[ESR/Linux procedure](qa/FIREFOX_ESR_153.md) is a scenario, not completed QA.

## Firefox data refresh

Included deterministic suites (`provider-source-updater`, `provider-update-control`,
`dataset-https`, `dataset-promotion`, `saved-effective`) cover fixed URLs, redirects,
size/deadline, parsing/timestamps, distinct HTTPS/signed trust, rollback/conflicts,
immutable collisions, queued snapshots, OFF/ON promotion, pending Saved, private
access/control loss and cross-store recovery. Manual cases cover absent provider
artifact/store/index, exact built-in identity, Save/Apply isolation, legacy source
default and deferred updates with manual Saved/Effective. Old signed fixtures stay
separate; HTTPS success never proves author-signature verification.

In real-source checks, distinguish source date from check time: valid old content
may be UNCHANGED, neither an error nor proof of freshness. Browser QA separately
checks manual/alarm refresh, OFF, READY with pending Saved and staged preservation
when blocked or control is lost. Deterministic tests do not establish those native
browser results.

## Release package checks

Manifest must be at ZIP/XPI root; extracted bytes must match the verified build.
Require package/icon checks and hashes after final packaging, with no docs images,
profiles, `.local`, `.tmp` or reports. Firefox additionally requires byte-identical
two-build XPI/source, Mozilla addons-linter and exact Gecko/data-collection fields.
See [Firefox release build](FIREFOX_RELEASE_BUILD.md) and
[Release process](RELEASE_PROCESS.md).
