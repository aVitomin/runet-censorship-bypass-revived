# Website resource discovery

Prepared for **1.0.2**; not part of the published 1.0.1 release.

The popup opens a separate extension page for the current tab. Nothing is
observed until the user starts capture. The page uses non-blocking `webRequest`
listeners filtered to the selected tab, without additional permissions,
content scripts, external services or a background recorder.

## Capture boundary

- Normal HTTP/HTTPS tabs only; private and browser-internal targets are rejected.
- Capture ends after two minutes, 100 distinct hosts, 1000 observed requests or
  256 pending request correlations. These bounds may produce an incomplete list.
- Only hostnames, coarse resource types and request/failure counts are retained.
  Full URLs, queries, credentials, request/response bodies, headers and raw errors
  are not retained or rendered. Bounded request IDs are transient correlations.
- Results live only in the open tool page's memory. Clear, page close, source-tab
  close, navigation to another host, or ten minutes from capture start erase them.
  They are excluded from settings exports and support reports.
- Failed requests are observations, not a censorship diagnosis. Cached requests,
  browser-protected requests and requests without the selected tab ID may be absent.

## Reviewed rules

No row is selected automatically. The user selects observed hosts after capture
stops. Existing Direct rules, including matching domain wildcards, are preserved;
hosts already covered by a Proxy rule cannot be selected again. A configured
Proxy candidate is required, but its reachability is not inferred from configuration.

Saving uses the existing revision-checked Saved APIs in each browser. It adds
exact-host Proxy rules only; credentials and unrelated settings are preserved.
A conflicting revision fails without an automatic merge or retry. The helper
never applies, enables, probes or clears proxy settings. The user reviews all
pending changes in Options before applying them.

The rules are **browser-wide**, equally in Chromium and Firefox. For example,
adding `cdn.example` for `a.example` also affects `b.example` if it uses that
host. This feature does not claim per-tab routing or identify which third-party
services a website actually needs. Advertising and analytics may appear too.

## Implementation and checks

The collector and Saved adapters are in
[`site-resources.js`](../../extension/src/shared/site-resources.js); the shared
page is in [`site-resources-ui.js`](../../extension/src/shared/site-resources-ui.js).
Each target has a local entrypoint and uses its existing RPC client.
Deterministic checks cover URL minimization, tab/time bounds, navigation,
correlation limits, rule scope, credential placeholders and revision failures in
[`site-resources.js` tests](../../extension/src/tooling/test/site-resources.js).
Real-browser QA must additionally exercise page-owned listeners, normal/private
tabs, Saved-only writes, cleanup, keyboard access and narrow layouts.

Official API references:
[Chrome webRequest](https://developer.chrome.com/docs/extensions/reference/api/webRequest)
and [Firefox RequestFilter](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/RequestFilter).
