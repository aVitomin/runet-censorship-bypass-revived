# Shared architecture and Chromium

Maintained `main` has separate Chromium and Firefox Manifest V3 runtimes and
browser-neutral modules under `extension/src/shared`. Both targets use the
`extension` npm root. MV2 is available only through Git history or the frozen
development branch. See [Firefox architecture](FIREFOX_ARCHITECTURE.md) for its
event page, proxy floor and recovery model.

<a id="общие-контракты-и-упаковка"></a>

## Shared contracts and packaging

Both targets implement Draft / Saved / Effective: Save and configuration import
write Saved only; Apply promotes an exact revision; provider refresh does not
promote pending Saved settings. Routing and credentials belong to one Effective
generation, and authentication is also bound to a request. Portable settings do
not synchronize profiles or make browser APIs, storage and lifecycle identical.

Gulp defines consumers; the input directory alone does not establish ownership.

| Input | Chromium | Firefox |
| --- | --- | --- |
| `src/shared` background modules | Configuration transfer, declarative datasets, streaming domain import, Antifilter and candidate storage | Same groups plus routing contract and provider dataset state; explicit allowlist |
| `src/shared` UI | Themes, site resources and data freshness | Same modules and styles |
| `src/chromium-compat/pages/lib` | Entire directory copied recursively | Excluded |
| `src/assets/icons` | Shared product icons | Explicitly selected shared icons |

Shared background files become `background/common`; UI files become
`pages/shared`. `extension/gulpfile.js` is the packaging authority. Chromium
excludes tests/scoped instructions; Firefox has an explicit runtime allowlist.
Both include selected `tldts` files and its license. Firefox and Chromium
comparison tests use the shared routing contract, but production routing is
implemented separately. Inspect both package trees for shared-input changes;
do not silently broaden globs or allowlists.

`chromium-compat` retains five Chromium-only compatibility files, including
font/checkbox assets; they are not shared modules. Browser-specific assets stay
in their target directories. `src/tooling` is repository-only.
`src/tooling/package-source.js` preserves older Node-only CommonJS import
spellings in Firefox output for byte-equivalent packaging; source/tests use
`shared` and the browser uses existing UMD globals. This is not a second source
tree or runtime resolver. Persistent identifiers, RPC names, `mv3State` and
`mv3PacArtifacts` remain compatibility boundaries.

## Chromium data flow and lifecycle

1. Popup and Options request redacted projections through internal RPC.
2. `background/service-worker.js` coordinates state, PAC, browser proxy settings,
   health, authentication and action status.
3. `chrome.storage.local` holds normalized `mv3State` and Effective records.
4. IndexedDB `mv3PacArtifacts` holds raw/cooked PAC bodies; ordinary state holds
   references, hashes and metadata.
5. Chromium executes the installed PAC. Extension code never executes downloaded
   text as JavaScript.

The worker imports modules and registers listeners synchronously before async
recovery. On wake it reconstructs behavior from storage, IndexedDB, alarms and
live `chrome.proxy.settings`. Queues, debounce maps and action caches are
ephemeral. Request-generation bindings and bounded auth attempts live in
`chrome.storage.session`: they survive worker termination, not browser restart.

`background/state.js` owns defaults, normalization and the state queue. Each
queued mutation rereads storage, computes its change and writes one normalized
result. The queue prevents lost writes within a worker; durable workflow
generations/fingerprints provide freshness across async boundaries and restarts.

## PAC lifecycle

### Download

Validate the source before fetch and the final URL after redirects. Only HTTPS
and loopback HTTP are allowed; URLs containing credentials are rejected. The
deadline includes body consumption, size is limited to 16 MiB, and UTF-8 decoding
is strict. Source URLs are tried sequentially in configured order.

### Store

Hash validated text and store a content-addressed IndexedDB artifact. Main state
gets metadata and `artifactRef` only. Remove legacy inline data only after its
non-destructive artifact migration succeeds.

After update/apply operations or explicit cache clearing, collect only bodies
unreferenced by Saved and retained Effective generations. The collector holds
queues in Effective → Saved order, skips unfinished transactions/active
publishers, and deletes keys from both stores in one IndexedDB transaction.
It does not materialize large bodies to enumerate them. Failure does not undo a
successful Apply; a later operation can retry. Age does not determine deletion.

### Cook

Normalize rules/candidates, generate the wrapper and store the cooked artifact.
Own-proxy credentials are excluded. An explicit Proxy branch requires a usable
candidate and contains no provider fallback or intentional `DIRECT`.

### Apply and workflow freshness

Before `chrome.proxy.settings.set`, validate provider, raw/cooked hashes,
modifier revision, workflow generation, live ownership and final fingerprint.
`mandatory: false` remains in use: a strict generated branch is not a browser
fail-closed guarantee.

`pacWorkflowGeneration` invalidates obsolete download/cook chains when settings,
provider, Apply or Clear change. An in-memory Apply token prevents an obsolete
callback reporting success over a newer action. Durable freshness and live
control are rechecked before final writes.

## Saved and Effective generations

`mv3State.savedRevision` identifies Saved provider/source, modifiers and auth
configuration, including password-only changes. `pacModsRevision` retains the
redacted unchanged-password contract. `pacWorkflowGeneration` invalidates work;
it is not an Effective identity.

### Options and popup

Options keeps Draft local. Save writes Saved only; Apply is disabled while edits
are unsaved and sends the displayed `expectedRevision` and `expectedEffectiveId`
to `applySavedConfiguration`. Discard reloads Saved without changing Effective.
Chromium forms save by section; an external Saved revision marks an unsaved form
as conflicting rather than overwriting its fields.

Popup displays Effective site mode. Mode/scope choices stay local until Apply;
closing drops Draft. `applySiteConfiguration` checks Saved/Effective, saves only
the site patch, and applies the resulting exact revision in one backend operation.
Existing unrelated pending Saved changes require explicit Apply-all confirmation;
Review in Options does not apply. Stale confirmation is rejected. If Save succeeds
but Apply fails, the new Saved state remains; there is no automatic rollback.

UI mutations share the RPC configuration queue with promotion. Durable revision
and ownership checks remain authoritative. `getConfigurationStatus` and the
`configuration` projection expose control flags, opaque identities and allowlisted
pending categories (`siteRules`, `proxyConnections`, `routingSettings`), never
endpoints, credential hashes or PAC bodies. Draft dirty/stale is UI-local. Claim
the previous protection survived only after re-confirming Effective. Provider
refresh preserves pending settings/Draft. Apply needs no page reload, but existing
TCP/QUIC connections and browser auth caches can outlive it.

### Promotion transaction

`background/effective-config.js` stores private immutable
`mv3EffectiveConfigurations` records: UUID, Saved revision, settings/credentials,
provider metadata and raw/cooked references. Save never modifies them. Bodies
remain in IndexedDB; credential records never enter RPC, diagnostics or logs.
A PAC hash is not a generation ID: identical bytes can use different passwords.

Apply captures exact Saved at workflow start. It validates the candidate before
the native write. A durable `prepared` journal retains previous/candidate records;
`switching` follows a fresh Saved/ownership check immediately before `settings.set`.
After the callback, verify actual PAC bytes/hash and ownership before changing the
durable Effective pointer. No Clear/Direct/OFF interval is introduced. Preparation
failure preserves old Effective; an ambiguous native/durable write is not success.
A new explicit Apply can resolve ambiguity with another validated transaction.

### Request authentication

`webRequest.onBeforeRequest` queues request ID → generation binding with promotion.
Redirects keep the first binding; `onAuthRequired` reads it rather than latest
Saved. Challenger host/port and retry budget must match that generation. Requests
starting during `switching` receive a denying binding. Unknown requests/endpoints
never receive stored credentials. Terminal events remove bindings/attempts; a
missing terminal event cannot rebind a request to newer credentials.

Limits are 2048 request bindings and 32 retained generations. A full request map
blocks new bindings until browser restart while existing bindings remain usable.
At the generation limit, new Apply is rejected until records are released.
Metadata collection retains Effective, journal references and live
request generations; PAC cache clearing protects their bodies.

Without usable Effective credentials, a request still receives a durable `null`
binding but does not read the full PAC from `proxy.settings`. After Apply its
redirect cannot gain new credentials. Releasing a `null` binding skips generation
collection because it retained none. Live ownership checks remain for credentialed
requests. Redacted popup/Options status explains session-storage failure or map
saturation and the need for full browser restart. Apply or worker recreation does
not clear that safety lock.

Chrome supplies neither a PAC-generation token nor a transaction spanning proxy
settings and auth. Request-start binding plus challenger validation is the
consistency boundary; ambiguous requests are denied credentials.

### Provider refresh

Periodic/manual refresh uses proven Effective user settings, not pending Saved
modifiers, credentials or provider selection. Cache metadata stays separate until
promotion. Saved cache pointers change only if Saved still matches the applied
configuration. Download/cook alone never enables proxy control.

## Ownership and restart recovery

Read live `levelOfControl`; persisted status alone is insufficient. Another
extension or policy produces `EXT`, and Apply/Clear must not take its settings.
Chromium has no atomic compare-and-set between the final ownership read and
`settings.set`; this native timing boundary remains a limitation.

Startup recovery considers only the last successfully applied generation and
compares its record with actual PAC/control. Permitted recovery from system mode
uses retained Effective even if Saved is newer; it neither downloads nor recooks.
Interrupted `prepared` recovers the previous matching Effective. In `switching`,
distinct PAC hashes permit only an unambiguous byte match. Identical PAC with
different credential generations leaves auth blocked until explicit Apply; newer
Saved is not evidence. Legacy 0.0.4.0 migration requires proven PAC provenance and
no credential ambiguity. Old PAC cannot prove which stored passwords were active:
with credentials configured, withhold them until Apply without clearing settings.

Persisted Clear/Turn off forbids recovery. A new manual action/configuration change
invalidates the old startup plan. External control or policy always skips restore
without calling `settings.set`.

## Proxy health

Health binds to the exact candidate, revision, target origin and browser session.
After startup reconstruction, checks are delayed 30 seconds. Success has a one-hour
TTL; proxy-specific failures back off 1/5/15/30/60 minutes, then at most hourly.
Old-session failure becomes neutral/stale pending a new check. Alarms and durable
metadata reconstruct scheduling after worker termination.

The supervisor observes browser proxy errors and performs credential-free fetches;
it never changes PAC, A/P/D, provider or ownership. Ambiguous destination, DNS or
TLS failures are not proof of proxy failure.

## Routing and UI

`background/site-scope.js` uses bundled `tldts` for domain scope. Precedence is
explicit Direct, explicit Proxy, whitelist miss, `.onion`, then provider.
Candidate order is own proxies, local Tor, Tor Browser, WARP. Safe defaults enable
provider proxies, restrict own proxies to own sites, and disable Direct replacement
and `noDirect` without opt-in.

Popup exposes protection/current-site controls and status; Options has seven
sections, Draft/Apply, diagnostics, maintenance and portable configuration.
Action A/P/D/OFF/EXT/busy/warning is derived for the active tab. Pages use
`textContent`/DOM APIs and redacted RPC, not background globals or remote scripts.

Shared `ui-theme.js`/`ui-theme.css` provide light/dark/system themes for both
targets. Default is system. The preference lives only in extension-page
`localStorage` (`rucb.ui.theme.v1`), applies before rendering and synchronizes open
pages through `storage` events. It is outside routing export, Saved/Effective and
background RPC. Unavailable storage leaves a temporary theme and a save warning.

Downloaded PAC stays data until handed to Chromium. Credentials remain local to
auth and outside PAC/UI/logs. Diagnostics redact bodies, private URLs and reusable
secrets. See [historical audits](../legacy/audits/) and the dated
[performance audit](audits/PERFORMANCE_AUDIT.md); neither replaces current QA.
