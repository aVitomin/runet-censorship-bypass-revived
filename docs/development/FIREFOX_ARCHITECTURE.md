# Firefox architecture

Firefox is a supported Manifest V3 target under `src/firefox`, with a
non-persistent event page, durable activation, Apply/Clear RPC, routing adapter
and declarative datasets. It shares [contracts and packaging](ARCHITECTURE.md#shared-contracts-and-packaging)
with Chromium, not browser APIs, storage, recovery or profile state. Current
packages are listed in [Installation](../user/INSTALLATION.md).

A clean install remains `OFF`. The manifest requests `proxy`, `webRequest`,
`webRequestBlocking`, `<all_urls>` and `alarms`. Network listeners register
synchronously before asynchronous initialization. The 12-hour source-update alarm
does not enable routing while OFF. See [Provider dataset](FIREFOX_PROVIDER_DATASET.md)
for the packaged baseline, source formats and trust boundaries.

## Routing semantics

Firefox `proxy.onRequest` differs from Chromium PAC:

- A shared `DIRECT` decision becomes top-level `null`: explicit Direct. OFF
  returns `undefined` and sets no route.
- `{type: 'direct'}` is not equivalent when global/browser proxy settings exist;
  Firefox continues using those settings.
- `PROXY + FAIL_CLOSED` becomes `[...proxyInfos, null]`. The final `null` ends
  fallback without another `webRequest.onBeforeRequest` callback.
- For `PROXY + DIRECT`, the runtime strips only terminal Direct, budgets proxy
  candidates only and records `PROXY_DIRECT_FALLBACK_STRIPPED`. If all candidates
  fail, Chromium may use Direct while Firefox fails closed. Successful selection
  and proxy-to-proxy failover remain equivalent; full routing parity is not claimed.
- Provider Direct is supported when the shared core resolves `{kind: 'DIRECT'}`.
  Default provider Auto is not blocked before the first proxy attempt.

These native-result semantics were verified on Firefox 154.0.1; that is evidence,
not an additional minimum-version requirement. Shared precedence is explicit
Direct, explicit Proxy, whitelist miss, `.onion`, then provider. Plain hosts are
exact; `*.example.com` includes base and subdomains. Candidate order is own
proxies, local Tor, Tor Browser, WARP. Safe defaults enable provider proxies and
own-sites-only, with Direct replacement and `noDirect` off.

Tor has independent Proxy/onion/Direct-replacement scopes; WARP has Proxy and
Direct-replacement scopes. Portable settings preserve representable scopes;
Firefox DNS/timeout options remain transfer limitations. See the
[parity matrix](FIREFOX_CHROMIUM_UI_PARITY.md) for UI differences.

## Proxy floor and ownership

The active global fail-closed floor is manual SOCKS5 at
`127.0.0.1:<persisted-high-port>`, with `proxyDNS: true`, empty HTTP/SSL/auto-config/
passthrough fields and `httpProxyAll: false`. Zero and low ports are invalid.
Only proxy-control generates the port with `crypto.getRandomValues`; callers
cannot choose the floor or assert ownership.

`RANDOM_LOOPBACK_UNVERIFIED_V1` explicitly means WebExtensions cannot prove that
the endpoint has no listener. The port is not probed or retried by network behavior.
The threat model covers extension lifecycle/listener failures, control loss and
private-access revocation, not hostile local software. A collision with a
non-SOCKS listener usually fails closed, but this is not guaranteed. A SOCKS
service on the exact endpoint can bypass the floor; another process can bind
after selection. No native helper or port reservation is required by the product.

Ownership requires exact identity plus
`levelOfControl === 'controlled_by_this_extension'`. Firefox 154 may return
`autoLogin: false`; exact live comparison requires false if present, but does not
persist that field. Other extra fields or `autoLogin: true` are mismatches.
Never overwrite or clear settings without exact ownership.

On control loss, withdraw the session immediately, enter `BLOCKED_CONTROL_LOSS`,
clear ephemeral routing/auth state and asynchronously persist OFF with cleanup
identity. Do not call `settings.set` or clear foreign settings. If Firefox later
resurfaces the exact owned floor while OFF, release only that layer and clear its
identity after confirmed release; never restore ON/READY. This still depends on
timely `proxy.settings.onChange` delivery: existing listeners may run before it.

## Durable activation and recovery

Schema v3 canonical OFF is:

```json
{"schemaVersion":3,"intent":"OFF","floorIdentity":null}
```

The optional floor identity is only for exact cleanup after interruption. Old
v1/v2 OFF migrates to v3; malformed/future state normalizes to OFF, retaining only
a separately valid cleanup identity. Strict ON contains floor identity, provider,
exact dataset version/SHA-256 and a routing descriptor (key/version/SHA-256).
Functions, credentials, request IDs and auth/session state are excluded. Malformed
or future ON is never activated.

The event page starts `INITIALIZING`; blocking guard denies requests while intent
is unknown. OFF reconciles cleanup before ordinary browser routing and never
acquires a floor, even if private access is denied. ON recovery requires private
access, the already-existing exact owned floor, dataset and routing descriptor.
It neither chooses a new port nor reinstalls the floor. Restore the verified
dataset/index, routing factory and synchronous credential resolver, clear ephemeral
maps and publish the session last.

A missing/mismatched floor moves intent to OFF without overwriting foreign
settings; the old exact cleanup identity can remain. Missing settings/dataset/
credentials or private access leaves the session unavailable and exact floor
fail-closed until Clear. Recovery uses durable ON's generation, never newer Saved.

Apply from OFF validates exact runtime inputs first, requires READY, acquires and
confirms the floor, persists strict ON, clears request/auth state and finally
publishes an immutable session. Before publication the normal listener does not
route and the acquired floor blocks the path. Failure after acquisition uses
exact-match rollback; unsuccessful release retains cleanup identity and leaves
the session unavailable. Clear writes OFF with cleanup identity first, hides the
session/clears ephemeral state, then releases only the exact floor. A failed
release remains durable OFF for startup cleanup. Crashes before ON leave OFF plus
cleanup identity; crashes after ON can recover only that exact session.

Apply/Clear use event-page and activation-controller queues. Strict
`firefox.activation.apply` accepts only optional numeric `expectedRevision`, not
caller-supplied routing, credentials, dataset or floor. It waits for boot and
accepts clean OFF or active READY. An active replacement prepares while the old
session serves requests, then rechecks Saved, private access and ownership.
Durable ON is the commit point; one synchronous session assignment switches
routes and credentials without Clear/OFF or floor reacquisition. Preparation
failure preserves the old session; ambiguous writes or lost prerequisites block
and fail closed.

## Saved configuration and credentials

Draft is page-local. Save writes Saved settings/credentials and a revision only.
Apply promotes one exact revision; newer pending Saved remains separate from
Effective and from recovery.

Save first writes a write-ahead marker, then one `storage.local.set` commits the
descriptor-bound product configuration, credentials and redacted settings.
Apply refuses to read Saved while that marker exists; recovery uses the separately
committed Effective snapshot. After a crash, reconciliation accepts only an exact
completed commit; partial or mismatched state stays fail-closed. New configuration
must never be paired with old credentials. Settings RPC accepts only Anticensority
or manual source selection, not caller-supplied dataset identity/trust, and cannot
promote staged data through a settings write.

Schema-v1 `firefoxMv3ProductRoutingConfig` holds non-secret source/dataset identity,
routing descriptor and canonical routing inputs. `configurationSha256` hashes
their deterministic UTF-8 representation. Provider, dataset, descriptor and floor
must match exactly; newer staged/active data never silently replaces durable ON.

Schema-v1 `firefoxMv3ProxyCredentials` binds the same descriptor to required
`authRef`/username/password entries. Configuration contains opaque references,
not passwords. Boot validates all and only required references before READY.
Retained generations keep credentials needed by current requests, but they never
enter ON, dataset metadata, RPC status, logs, errors or diagnostics.

Settings reads redact secrets. Complete revision-checked replacements accept
`SET`, `KEEP` or `NONE` for passwords and are allowed only in OFF/READY; blocked or
initializing states are read-only. Stale revisions fail. External Save conflicts
preserve Draft until explicit Discard. Popup site changes use the same exact
revision/promotion path; a saved patch remains Saved if replacement fails.
Unrelated pending changes require explicit `applyAll` confirmation.

Public configuration status exposes active/pending/applying/blocked and categories
`siteRules`, `proxyConnections`, `routingSettings`, not addresses, passwords,
descriptors, bodies or full URLs. Restricted-site permission does not itself
prevent Apply. Claim old protection survived only after confirming that generation.
Existing connections/browser auth caches may outlive Apply.

## Request authentication

Blocking `webRequest.onAuthRequired` is registered synchronously. OFF has no proxy
resolver. Apply/recovery publishes only a synchronous resolver from an exact
validated storage snapshot. Bounded request-scoped `authRef` metadata never enters
Firefox `ProxyInfo`.

Credentials require the active request ID, selected proxy in
`onBeforeRequest.details.proxyInfo`, challenger host/port and validated candidate
reference to match. A bound request keeps its own generation resolver and retry
budget across Apply. Website challenges (`isProxy: false`) remain browser-owned
in all states: no override, proxy credential read or proxy-auth retry consumption.
Routing guard separately limits website-auth retries; OFF does not interfere.

Missing credentials, mismatches, malformed state and active-auth internal failures
cancel the challenge rather than open Firefox's proxy prompt. Firefox 154 invokes
`onBeforeRequest` again after a credential response. Auth therefore allows exactly
one extra routing-guard callback before responding, with at most two credential
responses per request/challenger. Terminal events, Clear and event-page recreation
clear ephemeral route/auth attempts. Exhaustion cancels instead of trying the next
proxy candidate: an availability limitation, not Direct fallback.

## Provider updates and storage

Firefox never executes downloaded PAC/JavaScript. Validated immutable SHA-256
artifacts and small pointers live in Firefox IndexedDB; parsed indexes are
event-page memory. Active → previous-LKG → packaged-baseline fallback validates
exact bytes. Artifact/pointer writes are transactional. Unauthenticated remote
data cannot activate. Fixed HTTPS data is `REMOTE_HTTPS_VALIDATED`, not signed or
author-authenticated. Exact formats/bounds are in [Provider dataset](FIREFOX_PROVIDER_DATASET.md).

The fixed updater allows at most three manual redirects between two pinned HTTPS
URLs, revalidates final URLs and rejects userinfo/query/fragment. It omits credentials
and referrer, bounds source/normalized bytes and validates static JSON, local hashes
and source time (including 24-hour future skew), without PAC execution. A separate
signed-manifest channel requires configured endpoint and pinned Ed25519 key; its
monotonic sequence/keyId, exact-byte signature, identity/size/hash/schema checks
remain separate. A configured signed channel has priority; malformed configuration
does not fall back to HTTPS.

Staging writes immutable data and channel metadata without changing active/LKG,
session or ON. Manual checks and the 12-hour alarm serialize check/promotion with
Save/Apply/Clear; the first alarm may wait five minutes if no suitable schedule
exists. Promotion requires full OFF or READY with live ownership. Manual Saved or
Effective defers installation and retains staged data while checks continue;
explicit source selection and Save/Apply resume normal promotion. Install uses
the exact staged candidate. Update RPC accepts no caller URL, trust or bytes.

Promotion journals bind provider pointers to product config in OFF or exact
Effective in READY. Prepare active updates from Effective settings/credentials,
recheck identity, receipt, private access and ownership, commit ON, then publish
one generation without releasing the floor. Only dataset metadata may update
Saved afterward; newer pending user settings/credentials stay pending. Recovery
uses ON to finish/roll back the exact journal; inconsistent journals block it.
Public status contains sanitized status/times/error category, public versions,
availability/channel/source date, never URLs, keys, hashes, credentials, endpoints,
`authRef`, floor identity or browsing data.

IndexedDB v2 keeps compact artifact-hash history independent of bodies, so deleting
a body cannot allow old HTTPS content to pass as new. Collection follows serialized
provider operations and validates all pointer/root records. It protects active,
previous-LKG, packaged baseline, staged, Saved, retained Effective and durable ON
identities; unresolved journals or unproven roots defer it. Hash insertion and
orphan-body deletion share one transaction, enumerating keys rather than bodies.
No startup/manual Apply/Clear/settings-write GC is required. Cleanup failure does
not fail the committed provider operation. Large bodies are bounded by reachability;
history still grows by one hash per distinct artifact.

## UI, status and diagnostics

Popup/Options have local EN/RU catalogs and strict redacted RPCs. ACTIVE requires
READY and private access; recovery, blocked state and dataset availability remain
distinct. Readers revalidate storage per request: routing/candidate availability
and diagnostics use Effective, or Saved if there is none; editors use Saved.
Snapshots are not retained across requests. Pages reject stale projections and
preserve Draft. Current-site RPC returns a normalized HTTP(S) hostname, not full URL.

Options exposes supported sources, Direct/Proxy/whitelist rules, own proxies, Tor,
WARP and flags. Auto removes only selected overrides; whitelist is not forced Auto.
The UI adapter does not migrate storage, reorder rules or normalize legacy
wildcards. Unsaved Draft disables Apply. Password fields never receive the saved
password; unchanged/new/removed uses KEEP/SET/NONE. Local scripts/styles and
text-safe DOM add no permissions or remote assets.

Maintenance provides data check/install, redacted diagnostics and a user-triggered
health check for the last explicit Proxy origin. Health normalizes to origin,
omits cookies/referrer, follows no redirects, reads no body and changes no routes,
data, credentials or ownership. No separate telemetry endpoint is used. CSP allows
HTTP/HTTPS for this check and fixed HTTPS updates.

Toolbar A/P/D/OFF/EXT/busy/loading/warning is derived from authoritative snapshots
and recomputed after recreation, never persisted as routing state. Route-independent
states skip site/dataset reads. A/P/D needs a fresh snapshot; completed results are
not cached. Superseded work stops after initialization, tab lookup or site read,
before the next expensive step. At most one site read runs. Matching active-tab
URL/completion events may share only a successful in-flight read with unchanged
context. Different tabs/URLs, explicit refresh, Apply/Clear, control change and
loading invalidate reuse; failures release waiters. Only the latest update
publishes. OFF/busy do not wait. The Promise is ephemeral, not recovery state;
final presentation still reads live control and current activation.

Notifications use fixed localized alerts for control loss, blocked recovery and
explicit health-check failure, with cooldown and Maintenance navigation. Startup,
OFF and successful recovery are silent. Notifications/diagnostics omit hostnames,
URLs, endpoints, credentials, authRef, dataset hashes and floor identity.

Build/test commands are in [Testing](TESTING.md). A local build is not signing,
store submission or QA of a selected release artifact. Use
[release metadata](../release-current.json) and dated release records for publication.
