# Domain-source validation and Antifilter integration

The offline tools evaluate UTF-8 domain lists such as Antifilter's
[`domains.lst`](https://antifilter.download/list/domains.lst). The packaged
adapter and download API are described below. Antifilter is selectable in
development builds; none of this work changes the published 1.0.1 release.

## Offline preflight

The preflight command reads a local file without downloading or activating data.

From the repository root, after the usual reviewed dependency setup:

```powershell
node .\extension\src\tooling\provider-sources\domain-list-preflight.js C:\path\domains.lst
```

The command prints a JSON report. Exit `0` means the preview can undergo offline
tests; `2` means the data is blocked by rejected rows or Firefox format limits;
`1` means the input could not be analyzed. None of these states permits activation.
The CLI does not write artifacts. Keep downloaded files and reports outside Git.

## Validation and interpretation

- At most 64 MiB, 2.5 million lines and 4096 bytes per line in this offline tool.
  Legacy browser limits are unchanged and reported separately.
- Strict UTF-8, bounded URL-host syntax, IDN conversion, case and trailing-dot
  normalization. URL syntax, credentials, wildcards, IP addresses and public
  suffixes (including private hosting suffixes) are rejected.
- Underscores are preserved. Browser URL parsing is less restrictive than the
  traditional DNS hostname grammar; rejecting underscores loses addressable
  host entries. Canonicalization uses the platform `URL` implementation, following
  the [URL Standard](https://url.spec.whatwg.org/#idna), plus explicit source bounds.
- Duplicate domains are removed. The experimental preview treats each entry as
  a domain **and all its subdomains**. A child is removed only if its ancestor
  is explicitly present. This is a proposed adapter policy, not a claim about
  the source publisher's semantics. The compact experiment below also supports
  an explicit exact-host policy without removing child domains.
- Any rejected row blocks the whole candidate. Counts are reported without
  echoing source rows. Statistics for valid rows describe a partial preview,
  never an approved replacement for the full list.
- Preview size, rule count and bucket count are checked against the actual
  Firefox dataset limits. Chromium checks are size comparisons only: the CLI does not activate the separately implemented runtime adapter.
- SHA-256 identifies the analyzed bytes; it does not authenticate the author
  or prove freshness. A local file does not prove its origin or modification date.

The [Antifilter site](https://antifilter.download/) permits copying and reuse of
its lists. Its domain list is distinct from its IP/subnet lists and BGP service;
this tool does not import those formats. The development integration requires
explicit provider/proxy selection and preserves the current Effective
configuration during data refresh and recovery. The packaged download/staging
layer is described below. Source lists do not supply a working proxy service.

## Compact representation experiment

```powershell
node .\extension\src\tooling\provider-sources\domain-source-experiment.js C:\path\domains.lst
```

The experiment keeps **every normalized valid host**, including child domains.
It does not reuse the suffix-pruned preview. Rejected source rows still block
the candidate even when the valid subset fits. Nothing is installed or written
to disk by this command; it emits a JSON measurement report only.

`REVERSED_DOMAIN_BLOCKS_V1` reverses ASCII host strings, sorts them and stores
common prefixes in blocks of 128 records. A prefix marker outside the DNS
alphabet starts each record, avoiding a separator byte. Long prefixes use an
explicit marker and two hexadecimal digits. A block starts with a complete key;
lookup binary-searches block keys and decodes at most 128 records per exact
lookup. No probabilistic filter or hash-based domain matching is involved.

The portable codec validates field names, format, policy, counts, block bounds,
canonical prefixes, host grammar, global ordering and the total JSON size.
It bounds this format to 2 million rules and 16 MiB. The shared codec is
packaged for both targets; schema 1 retains its existing 750,000-rule limit. Lookup owns an immutable copy of its index. Input must already be
normalized and checked against IP/public/private suffix policy by the importer;
the codec checks encoding and hostname grammar, not provenance or that policy.

The format records either `EXACT_HOST` (default) or `DOMAIN_AND_SUBDOMAINS`.
The benchmark uses exact hosts. These are alternative policies, not a choice
already enabled in the product.

The harness verifies every stored host and compares selected hits, child hosts,
case/trailing-dot variants and misses against an independent set. It also
generates an **in-memory diagnostic PAC** from the local codec factory and
validated JSON. Its fixed `test.invalid` proxy is a test sentinel, not a service
or deployable configuration. No downloaded JavaScript is evaluated.

Portable lookup and diagnostic PAC timings both use Node/V8. They do not prove
Firefox/SpiderMonkey performance or Chrome PAC-engine limits. Memory fields are
GC-affected Node heap snapshots and whole-process maximum RSS, including source
analysis, not browser memory or isolated retained lookup memory. Browser startup,
memory budgets, full-source validation policy and atomic installation still
require separate integration work before a release.

## Streaming import and quarantine policy

```powershell
node .\extension\src\tooling\provider-sources\domain-stream-experiment.js C:\path\domains.lst C:\path\existing-scratch-directory
```

The portable importer incrementally decodes UTF-8, sorts runs of at most 8192
domains, then merges sorted runs into the compact encoder. It does not retain
the full source text or a set of all domains. The source cap remains 64 MiB;
coalesced fetch chunks are decoded through views of at most 1 MiB. A browser may
still deliver a large incoming byte buffer; the source cap bounds that buffer.
The browser scratch adapter stores 128 records per IndexedDB page. The local
command uses temporary files in the supplied directory and removes only its
own newly created sorting directory on success or failure.

The default `STRICT` mode still blocks any rejected row. The separate
`QUARANTINE_INVALID_V1` research mode must be selected explicitly and requires:

- At most 100 rejected rows and at most 0.01% of all rows rejected.
- At least 1,500,000 unique valid domains for this Antifilter-specific policy.
- At least 90% of the previous accepted rule count when supplied.

Only unsupported syntax, invalid bounded hostnames and IP/public/private suffix
entries can be quarantined. UTF-8 errors, size/line overflow, storage failures,
missing sort records or cancellation abort the import. No row is repaired by
removing quotes, guessing a domain or replacing characters. Exclusion counts
and reasons remain in the result, and matching stays `EXACT_HOST`.

Both modes return **inactive** results; this policy is not author authentication,
freshness proof or permission to install a provider. The research command opts
into quarantine and returns exit `0` for `PREPARED_INACTIVE`, `2` for a blocked
candidate and `1` for failure. The packaged loader adds source identity, receipts, timestamp checks and isolated
candidate staging. Effective promotion and UI consent remain separate integration
work. The legacy Firefox schema and selected browser routing remain unchanged.

The research IndexedDB adapter uses a fresh named scratch database, refuses an existing
database and deletes only the database it created. Sort counts are checked during
merge; a missing run/page cannot silently shorten the candidate. Component tests
on a normal browser page exercise platform APIs, not extension worker/event-page
lifecycle or proxy behavior.

## Checks

```powershell
npm --prefix .\extension run verify:tooling
```

Tests cover malformed inputs, IDN/deduplication, suffix boundaries, size/rule
overflow, bounded file reads and a clean synthetic preview through the real
Firefox dataset verifier and lookup. Compact-codec tests add block boundaries,
extended prefixes, corrupted records, immutable lookup and parity with generated
diagnostic PAC for both policies. This is not browser or live-source QA.
Streaming tests cover split UTF-8/CRLF, multi-run merging and duplicates,
underscore preservation, quarantine bounds, large fetch chunks, cancellation,
storage failure, truncated scratch data and cleanup.
Downloader tests cover transport bounds, receipt validation, continuity,
cancellation and deadlines with controlled transport/import doubles. Full-source
import and durable transactions require separate native-browser checks.

## Runtime adapter (development integration)

`src/shared/domain-block-codec.js` is the package-owned implementation used by
both browsers and the offline tools. Dataset envelope **schema 2** is restricted
to provider `antifilter`, format `REVERSED_DOMAIN_BLOCKS_V1` and `EXACT_HOST`.
Schema 1 continues to use `HOST_BUCKETS_V1`; old artifacts are not relabelled or
migrated. Hash, byte count, rule count, trust and strict payload validation still
precede lookup. A valid hash alone never makes remote input eligible for activation.

Firefox builds an immutable block lookup through the existing dataset runtime.
Chromium's `domain-provider-pac.js` generates local PAC code from a verified
schema-2 dataset and an explicit ordered proxy route. The route is mandatory;
credentials, `DIRECT`, unrecognized protocols and malformed endpoints are rejected.
This adapter does not choose proxies or widen the scope of own proxies. The
existing PAC cooker remains responsible for user rules, precedence and the
final 16 MiB limit. JavaScript from the source is never executed in the extension.

Development builds expose an optional Antifilter source. It is not part of the
published 1.0.1 release, and no downloaded baseline is bundled. Permissions and
release versions are unchanged. Do not advertise it as a released feature.

The source supplies exact host membership, not proxies. A separate
`useProxyRulesForAntifilter` consent flag authorizes the enabled Proxy-rule chain:
own proxies, local Tor, Tor Browser, WARP, with at most 32 candidates. Source
proxy routing must remain enabled. Missing consent or candidates blocks use of
this source. Own-site scope is not switched off. Existing explicit Direct,
Proxy, whitelist and onion precedence remains intact; domain misses use the
normal Direct policy. Credentials remain in the Effective auth configuration.

Chromium's immutable raw artifact is a data document containing the envelope,
complete receipt and exact artifact text. Every cook reverifies those bytes,
then generates PAC with the selected revision's credential-free proxy chain.
Changing proxies therefore recooks the same data without another download.
Default-false consent does not invalidate existing providers' modifier hashes.

Firefox first requires the explicit Download Antifilter list action. Its
no-input RPC prepares data and initializes only an empty Antifilter dataset
namespace. Save then binds that provider's exact verified identity; Apply
performs the existing owned-floor activation or replacement. Neither preparation
nor Save acquires proxy control. Settings import does not fetch data: prepare
the source first when importing Antifilter into a new profile.

Periodic and manual refresh select the Effective source while active, or Saved
while OFF. Failed downloads keep proven data. Pending settings are not applied;
Firefox defers data installation when Saved and Effective select different
sources. Recovery uses the committed Effective artifact and credentials. OFF
refresh stays OFF. New consent is preserved by the shared settings transfer.

For shared codec or runtime adapter changes, run the aggregate
`npm --prefix .\extension run verify` gate and compare both package trees.
The tooling-only command above covers changes confined to offline tools. The
shared importer and policy are packaged inputs and require the aggregate gate.
Native Chromium PAC and Firefox lifecycle checks are separate
from deterministic lookup tests; record their actual scope when reporting QA.

## HTTPS download and isolated candidate staging

Both packages include `antifilter-source.js` and `domain-candidate-store.js`.
Construct a candidate store, pass it to `createUpdater`, then call `fetchAndStage`.
This is an internal API, not an RPC for exposing dataset bodies to pages. It has
no background timer, automatic fetch, settings write or proxy application.

The only accepted URL is `https://antifilter.download/list/domains.lst`. Requests
omit credentials and referrers, bypass the HTTP cache and reject every redirect.
Only HTTP 200 with a byte stream and a valid Last-Modified date is accepted.
New downloads must be no older than seven days, at most one day in the future,
and no larger than 64 MiB. The 120-second preparation deadline covers network,
hashing and import; caller cancellation is supported. Existing candidates are
not invalidated merely because their source has aged.

`STRICT` is the default. The caller must explicitly select
`QUARANTINE_INVALID_V1` to allow its bounded exclusions. Both download modes
require at least 1.5 million unique rules and retain at least 90% of the previous
candidate's count. Receipts distinguish source date from check time and bind the
exact source hash, source size, policy, exclusion counts and compact artifact.
Older source/check dates, conflicting hashes at the same date, or relabelling
unchanged source bytes with a new date/artifact are rejected. These checks prove
transport/data consistency, not a signature from Antifilter's author.

Native WebCrypto hashes the source bytes. Because it has no incremental SHA-256
API, the loader uses one capped 64 MiB byte buffer and hashes its populated view
before merging sorted runs, then releases the buffer. The browser may copy up to
another 64 MiB for hashing. This is additional bounded transient memory, not a
claim about total process peak memory. No crypto dependency is introduced.

The dedicated IndexedDB database contains metadata, temporary sorted runs and
one prepared candidate. A transaction claims a 180-second job lease and clears
abandoned scratch data. Every scratch access and final write checks that job's
identity. A stale context cannot write into a newer job; its cleanup cannot erase
the newer job. Final staging rechecks the receipt against the persisted floor
and commits artifact plus metadata atomically. Failure preserves the previous
candidate. Reload verifies stored bytes, receipt and hash again. No operation
writes Saved/Effective settings, the browser's active artifact, or proxy state.

Successful download returns `PREPARED_INACTIVE`, with counts and hashes only.
Browser-specific controllers consume this candidate under the existing ownership
and exact Saved/Effective rules described above. Counts and hashes, not full
dataset bodies, cross ordinary UI/RPC boundaries.

Firefox's runtime dataset store accepts the complete Antifilter receipt and can
retain the first and subsequent exact artifacts without pretending that a
downloaded source is a packaged baseline. See the
[runtime store boundary](FIREFOX_PROVIDER_DATASET.md#separate-compact-domain-schema).
The isolated downloader database remains a preparation area; writing either
database alone does not apply browser routing or change Saved/Effective settings.
