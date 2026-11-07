# Repository instructions

## Scope and task mode

Follow the current task, the hard invariants below, the applicable scoped
`AGENTS.md`, then the matching repository skill. A task defines scope; it does
not silently waive a safety invariant. Preserve unrelated work.

Classify the task before acting:

- Audit/review: findings and evidence; do not start fixes or install packages.
- Planning: ordered tasks, acceptance criteria and dependencies; no implementation.
- Implementation: the smallest complete authorized change and its affected gate.
- Release: use the release skill and exact artifacts; preparation is not publication.

Read this file once per task, then only the scoped instructions, source consumers
and evidence needed for the changed paths. Inspect current Git status and the
actual base before editing. State material assumptions; resolve routine choices
from project evidence. Ask only for a consequential missing decision or authority.
Existing approval applies to its task continuation, not unrelated future actions.
Report consequential blockers or scope expansion before dependent work.

## Select a workflow

Use one primary workflow; add a repository safety skill only for its boundary.
Do not chain every installed skill, duplicate reviews, or inherit generic
requirements for model calls, whole-suite reruns, commits or publishing.

| Boundary | Repository skill |
| --- | --- |
| Package/lock, dependency manager, Action or vendored code | `dependency-review` |
| Extension security, storage, lifecycle, permissions or external requests | `extension-security-review` |
| Chromium PAC or Firefox declarative routing semantics | `pac-regression` |
| Release candidate, provenance, packaging, signing or release QA | `release-candidate` |

The skills in `.agents/skills` define additional checks; the table below defines
the final gate. A read-only audit does not become a release/rebuild workflow.
Use available tools; do not install a framework or add infrastructure merely
because a generic skill mentions it. Keep task history out of durable rules.

## Repository map and working boundary

- The only npm root is `extension`
  (`$Project`). Run commands from the repository root in PowerShell and never
  run root npm install/scripts. If dependencies are missing, use
  `npm ci --prefix $Project`.
- Chromium (`extension/src/chromium`) and Firefox (`extension/src/firefox`)
  are equal supported Manifest V3 targets. Browser-neutral modules live in
  `extension/src/shared`; shared product assets are in `extension/src/assets`;
  repository-only build helpers/tests are in `extension/src/tooling`. Inspect
  consumers rather than inferring ownership from a browser source location.
  MV2 is historical; use Git history or the frozen development branch rather
  than rebuilding it on `main`.
- Chromium background starts at `background/service-worker.js`; Chromium UI is
  under `pages/`; Firefox starts at `background/event-page.js`.
- Version/build authority is `src/templates-data.js`, `gulpfile.js`, and the
  maintained manifests/templates. Chromium recursively packages every file
  under `src/chromium-compat/pages/lib`; additions change packaged bytes.
  Shared modules have target-specific copy rules; Firefox uses explicit Gulp
  allowlists. Do not broaden package globs or assume identical package contents.
  `src/chromium-compat` is Chromium-only compatibility input, not shared code.
- For user-facing UI strings, update both `en` and `ru` locale catalogs for
  every affected browser target.
- Build output, `dist`, `node_modules`, coverage, archives, profiles, logs,
  `.tmp`, and `.local` are generated/local-only. Do not broadly inspect
  minified vendor files or recreate the removed nested Options package.
- Preserve unrelated work and `docs/legacy/**`. Prefer the smallest complete
  change; avoid broad formatting and lockfile churn. Never commit, push,
  publish, upload, tag, or release without separate authorization.

## Hard supply-chain invariants

Use `$dependency-review` for package/lock, vendored code, dependency-manager,
or GitHub Action changes. Prefer existing/platform APIs. Use only dependencies
whose exact selected release has a satisfactory source and security review.
Popularity and age are supporting signals, never approval by themselves.
For a well-established package with verified source, maintainers, signatures,
provenance and reviewed changes, a documented exact-version review may permit
an update before 168 hours. Record applicable CI approvals in
`scripts/reviewed-dependencies.json`, bound to the locked version and integrity.
Unfamiliar or insufficiently reviewed releases retain the 168-hour baseline;
waiting alone does not make them acceptable. Stop on unresolved risk.
Verify registry/source identity, license, ownership, lifecycle scripts,
integrity, and the complete lock delta before installation. Reject unexplained non-registry sources or integrity/ownership
changes. Pin Actions to verified full SHAs with least privilege and checkout
credentials disabled unless write access is required. Never run
`npm audit fix --force`; vendoring does not bypass review.

## Hard runtime and data invariants

- Draft is UI-local; Saved may differ from immutable Effective. Save != Apply:
  Save and configuration import write Saved only, never silently activating
  protection.
  Apply promotes one exact Saved revision without an implementation-driven
  Clear/OFF/Direct interval; recovery uses proven Effective, not latest Saved.
- Routing and credentials belong to the same Effective generation; proxy auth
  and retry state remain request/generation bound. Save must not change active
  credentials. Established connections/browser auth caches may outlive Apply.
- Downloaded PAC is untrusted data: validate, hash, store, and cook it without
  extension-side `eval` or `Function`. New raw/cooked bodies belong in IndexedDB
  artifacts; normal state stores references/metadata. Keep legacy inline data
  until migration succeeds.
- Keep valid proxy credentials out of PAC, UI/DOM attributes, logs, events,
  errors, diagnostics, migration summaries, and reports. Preserve the redacted
  unchanged-password placeholder. Treat custom URLs and query strings as
  sensitive.
- Custom provider input and final redirect URLs allow HTTPS and loopback HTTP
  only; reject URL credentials and revalidate redirects before accepting bytes.
- Routing precedence is explicit Direct, explicit Proxy, whitelist miss,
  `.onion`, then provider. Plain patterns match exact hosts; `*.example` covers
  base and subdomains. Candidate order is own proxies, local Tor, Tor Browser,
  then WARP. Explicit Chromium Proxy requires usable candidates and contains no
  provider fallback or unintended `DIRECT`; `mandatory:false` is not a browser
  fail-closed guarantee.
- Safe defaults keep provider proxies enabled, own proxies limited to own
  sites, Direct replacement off, and `noDirect` off. Refresh may update
  artifacts while control is off but must not enable control; reapply only when
  durable identity and live ownership still match. Active provider refresh uses
  Effective user configuration, never promoting pending Saved settings.
- Reconstruct durable behavior from storage, IndexedDB, browser proxy state,
  and alarms. In-memory locks disappear on background-context recreation.
  Serialize whole-state writes and reread storage inside queued mutations.

## Select checks once

Plan one integrated gate after related edits. Record the source SHA, relevant
input changes, command, exit status and evidence path. Reuse passing evidence
only while its inputs and environment remain applicable; identify the original
run instead of claiming a new one. Documentation or instruction edits alone do
not invalidate unchanged runtime tests. Release artifact/source hashes and the
required trusted-main CI must still match the final release commit.

For timeout-only failures, inspect the failed case and machine load before
retrying. A justified process-local test timeout may accommodate a slow host;
do not change product timeouts, skip assertions, or repeat whole suites without
a diagnosed reason. Preserve the failed and successful results.

Focused commands are optional development feedback; a final local gate is the
completion evidence. Do not repeat a focused command after an unchanged final
gate that already includes it. See `docs/development/TESTING.md` only when the
detailed command or browser-QA matrix is needed.

Run commands from the repository root in PowerShell after setting:

```powershell
$Project = '.\extension'
```

| Final affected scope | Required local gate |
| --- | --- |
| Agent/skill/docs only | `node .\scripts\verify-docs.mjs`, relevant skill/metadata validation, `git diff --check` |
| Chromium runtime/UI only | `npm --prefix $Project run verify:chromium` |
| Firefox runtime/UI only | `npm --prefix $Project run verify:firefox` |
| Shared runtime/templates/Gulp/common packaged input | `npm --prefix $Project run verify`, then compare both package trees with baselines |
| Dependency/Action/vendored code | `$dependency-review` checks plus the affected final gate |
| Release/provenance/package audit | `$release-candidate` and `docs/development/RELEASE_PROCESS.md` |

Before every PR, run `node .\scripts\verify-docs.mjs` and `git diff --check`
in addition to the applicable row. For agent/skill/docs-only work, those checks
and relevant skill/metadata validation are the final gate; do not run product,
browser, or release commands.

For PAC work, `test:pac` is the fast focused check; `verify:chromium` includes
`test:chromium`, and `test:chromium` includes PAC regression. Aggregate `verify` includes
all maintained deterministic suites once. `scripts/required-checks.mjs` is an
advisory path mapper; this table, applicable skills, and CI are authoritative.
CI additionally runs policy/supply-chain helpers, tooling verification,
per-browser gates, and Chromium smoke; trusted-main release jobs create
canonical artifacts. Do not claim unrun CI or browser QA locally.

## Documentation and handoff

Maintenance starts with concrete findings. Measure a suspected performance cost
before refactoring; size, age or a missing text reference alone does not prove
code or an asset is unused. Preserve licenses, provenance and unrelated work.
Keep instruction changes focused on durable rules, not a growing task history.

Update current documentation when installation, behavior, browser support,
privacy/security, developer commands, architecture, or release procedure
changes. Use current fork links; upstream links are attribution/history. README
describes the latest published release. For new untracked Markdown, ensure docs
validation includes it without staging the real index.
Use `docs/release-current.json` and release records for changing publication facts;
engineering guides should link to them instead of repeating a mutable version or
store status. Recheck developer navigation and module/package maps after changes.

Before handoff, review the complete relevant diff, run the applicable final
gate, and confirm no generated/profile/secret material is staged or packaged.
Summarize changed files, security/routing impact, each check and exit status,
failures/blockers, browser gaps, generated artifacts, and final
`git status --short`. Keep successful logs summarized; retain full command
output in the transcript and quote enough failure output to diagnose it. If a
required gate cannot run, report the work incomplete and name the blocker.
