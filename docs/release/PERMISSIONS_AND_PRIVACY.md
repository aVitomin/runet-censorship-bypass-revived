# Manifest permissions and privacy

This inventory covers desktop Chromium and Firefox 1.1.0. Chromium declares
`minimum_chrome_version: "108"`. Firefox declares `strict_min_version: "140.0"`.
Compare the tables with both packaged manifests when preparing a candidate.
[Chromium manifest template](../../extension/src/chromium/manifest.tmpl.json) ·
[Firefox manifest](../../extension/src/firefox/manifest.json) ·
[Privacy notice](PRIVACY.md) · [Archived 1.0.2 inventory](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/v1.0.2/docs/release/PERMISSIONS_AND_PRIVACY_1_0.md)

## API permissions — complete manifest inventory

| Permission | Target | Why required / user-visible purpose | Data accessed or stored | What this implementation does not collect/do with it |
| --- | --- | --- | --- | --- |
| `proxy` | Both | Apply or release the extension's browser routing configuration; Firefox also chooses per-request routes and guards inactive/unready routing. | Browser proxy ownership/settings; configured endpoints; Firefox destination/request information. | Does not supply a VPN service, read page bodies or upload browsing history to the developer. |
| `storage` | Both | Keep settings, credentials, routing artifacts/references and restart/recovery state. | Local rules, proxy/source settings, credential records and operational metadata; Chromium also uses session request/auth bookkeeping. | No product cloud sync, website-cookie database access or developer backup upload. Not a claim of encrypted secret storage. |
| `alarms` | Both | Restore scheduling after background restarts. Chromium refreshes PAC data and supervises relevant connection checks. Firefox checks the selected Anticensority or Antifilter dataset every 12 hours and can install validated changes when OFF or READY. | Schedule times, last-check/status records and an established Chromium health target. | No general activity timer or telemetry schedule. Data refresh does not enable routing or apply pending user settings. |
| `notifications` | Both | Show localized attention/status notices and let the user open Options. | Fixed status/error categories and notification bookkeeping. | No advertising notifications, page-content collection or credential-bearing notification text. |
| `webRequest` | Both | Bind request lifetimes to applied routing/auth settings, handle proxy challenges and clear retries/errors. After explicit Start, observe one normal tab in the optional Website resources page. | Browser request IDs, URLs/metadata, proxy challenger host/port and completion/error events. Firefox also requests response headers to recognize status 401 plus the `WWW-Authenticate` header name for bounded website-auth retries. | No request-body or request-header capture, page-content scraping or history database. The Firefox guard does not read or retain response-header values. Metadata access is still data handling. |
| `dns` | Firefox only | Resolve a hostname when Antizapret needs an IP lookup for routing. | The configured DNS resolver can receive the hostname. | A required lookup that fails blocks the protected request. |
| `webRequestBlocking` | Firefox only | Synchronously authorize/cancel requests and answer bounded matching proxy-auth challenges. | Request authorization, selected proxy and matching configured credentials. | Does not send stored proxy passwords to website-auth challenges or arbitrary unrelated challengers. |
| `webRequestAuthProvider` | Chromium only | Answer supported HTTP/HTTPS proxy authentication challenges using the request's applied configuration. | Proxy challenge endpoint, configured username/password, bounded retry state. | Does not create website accounts, collect website passwords or promote newly saved credentials without Apply. |
| `activeTab` | Chromium only | Identify the site when the user opens the action popup and selects Auto/Proxy/Direct. | Current tab URL, reduced to a normalized host for site controls. | No bookmark/history collection or injected page scripts. This is not the only host grant: broad host permissions below also exist. |

Firefox has no `activeTab` or `tabs` permission; it uses existing host access for
the current-site interface. Neither manifest declares `history`, `bookmarks`,
`cookies`, `scripting`, `downloads`, `management` or `nativeMessaging`.
There are no declared content scripts or optional API/host permissions.
Do not invent permission justifications for absent features.

## Host permissions — every literal entry

Chromium declares seven explicit source host patterns as well as `<all_urls>`.
Firefox uses `<all_urls>` for routing and its source downloads. The rows below
list the literal grants once per pattern, including overlaps.

| Host permission | Target | Why present / user-visible purpose | Data accessed / sent | Not collected by this source fetch |
| --- | --- | --- | --- | --- |
| `<all_urls>` | Both | Route/authenticate user-selected normal web destinations. Firefox's request guard and proxy decisions require coverage; Chromium also supports user-chosen PAC hosts and connection checks. | Request metadata/destinations, current-site host, matching proxy challenges; permitted source/check requests. | No injected analytics or bulk page-content/history upload. Does not override browser restrictions on privileged pages. |
| `https://p.thenewone.lol:8443/*` | Chromium | Primary built-in Antizapret PAC endpoint. | PAC download and ordinary connection metadata. | No upload of local rule lists or proxy passwords. |
| `https://e.cen.rodeo:8443/*` | Chromium | First fallback for the built-in Antizapret PAC. | PAC body, cache validators and ordinary fetch/connection metadata visible to that server. | No upload of local rule lists or proxy-password records. |
| `https://antizapret.prostovpn.org/*` | Chromium | Built-in Antizapret fallback PAC host. | Same source-fetch data as above. | No upload of local rule lists or proxy-password records. |
| `https://antizapret.prostovpn.org:8443/*` | Chromium | Alternate configured Antizapret endpoint. | Same source-fetch data as above. | No upload of local rule lists or proxy-password records. |
| `https://antizapret.prostovpn.org:18443/*` | Chromium | Alternate configured Antizapret endpoint. | Same source-fetch data as above. | No upload of local rule lists or proxy-password records. |
| `https://anticensority.github.io/*` | Chromium | Built-in Anticensority PAC endpoint. | Same source-fetch data as above. | No upload of local rule lists or proxy-password records. |
| `https://raw.githubusercontent.com/*` | Chromium | Built-in Anticensority PAC fallback on GitHub's raw-content host. | Same source-fetch data as above. | No repository-account access or upload of local rule/password records. |

Source mapping: [Chromium providers](../../extension/src/chromium/background/pac-providers.js).
Firefox uses its existing `<all_urls>` grant for source downloads. Its two fixed
[Anticensority HTTPS source URLs](../../extension/src/firefox/background/provider-source-updater.js)
are on `anticensority.github.io` and `raw.githubusercontent.com`. The Anticensority downloader omits website
credentials/referrer and permits at most three redirects only between those two
exact URLs; the final URL must also be approved and match the validated request.
It rejects URL userinfo/query/fragment and extracts static data without executing
downloaded PAC JavaScript.
Locally computed hashes and source-date checks do not verify an author signature.
The separate signed-manifest channel remains unconfigured.

For Antizapret, **Download Antizapret rules** fetches
`https://p.thenewone.lol:8443/proxy.pac` on request, omitting credentials and
referrer and rejecting redirects. **Import PAC file** reads a local file.
Both paths extract rules as static data. **Check source** reads the local
rules. Antizapret uses a configured proxy and Firefox DNS.
[Firefox Antizapret reader](../../extension/src/firefox/background/antizapret-local.js)

Chromium custom inputs allow HTTPS or loopback HTTP only, reject URL userinfo and
validate the final response URL. Do not describe this as authenticating every
custom source, preventing every intermediary contact, or trusting arbitrary
PAC content. Source selection remains the user's trust decision.

## Firefox declarations and browser settings

| Declaration | Meaning / publication wording |
| --- | --- |
| `incognito: "spanning"` | Browser setting, not an API permission. Private-window access must be granted by the user before Apply because routing settings also affect private windows. Revoke/ownership loss can block routing; Turn off remains available. |
| Required `authenticationInfo` | Optional user-configured proxy credentials can be transmitted to a matching authorized proxy. Required data-type declaration does not mean every user must configure a password. |
| Required `browsingActivity` | Routing processes destinations and sends destination information to a selected proxy. This is not developer telemetry and cannot be relabeled `none`. |
| `strict_min_version: "140.0"` | Declared desktop Firefox minimum. It does not establish compatibility with every OS or Firefox fork. |

Mozilla counts handling outside the add-on/local browser as transmission in its
[built-in data-consent guidance](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/).
The current declaration matches the supported routing/authentication functions;
the final submission still needs maintainer review against the exact package.

## Privacy alignment conclusions

- Save and import write Saved only. Active request credentials remain associated
  with the applied request configuration and matching proxy; no “any configured
  password for any challenge” behavior is advertised.
- Stored passwords are not returned through routine UI reads, pending summaries,
  diagnostics or configuration/support exports. The user still enters a new
  secret in the password form; do not claim passwords never exist in memory.
- Configuration exports omit usernames/passwords/custom-source URLs and arbitrary
  notes, but contain site rules and proxy endpoints. They are sensitive files.
- Support exports include the export time, environment, status and a summary of saved and verified active settings using fixed source identifiers and routing flags. They omit site rules, endpoints, credentials and raw network logs. Users review the report before sharing it.
- Import itself performs no network activity. It does not imply that an already
  active browser stops its independent routing, source refresh or health checks.
- Source servers and health-check targets receive ordinary network metadata.
  Firefox periodically checks Anticensority or Antifilter and fetches Antizapret on request;
  Chromium refreshes PAC sources and runs relevant automatic health checks.
  Firefox's unconfigured signed channel is separate from its enabled HTTPS
  data channel.
- Website cookies/credentials are omitted from connection-check fetches. Proxy
  authentication can still occur; Chromium redirects can contact other origins.
- Local operational origins/endpoints exist; “no browsing-history service” is
  accurate, while “no network metadata is ever stored locally” is not.
- Neither store should be told “no user data handled” merely because there is no
  analytics service. Chrome requires disclosure even for locally processed data:
  [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq/).

The [feature inventory](FEATURE_INVENTORY_1_0.md#implementation-evidence) lists
the implementation paths supporting these disclosures. Verify the final package
and user-facing consent text together before submission.

## Optional data source and website resources

Both browsers can fetch the
optional Antifilter exact-host list from `https://antifilter.download/list/domains.lst`
using their existing host access. The list is parsed as bounded data; importing
it does not execute downloaded code. Applying its Proxy candidates requires
explicit consent. Refresh keeps OFF off and uses Effective settings while active.

The optional Website resources page uses existing `webRequest` access only after
Start, filtered to one non-private source tab. It retains hostnames, coarse
types and counts in page memory for bounded periods. No response/request bodies,
headers, full URLs, query strings, credentials or raw errors are retained.
Captured results are not persisted or uploaded. Selected exact-host rules may
be Saved after review, with existing Direct rules preserved; Apply is separate.
Those saved rules are browser-wide, including shared-domain requests from other
sites. See the [privacy notice](PRIVACY.md) for retention details.
