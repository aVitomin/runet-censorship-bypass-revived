# Chromium / Firefox UI parity

This matrix describes maintained behavior, not proof of QA for every release.
`PARITY` is a shared workflow; `EQUIVALENT` is comparable behavior through different
implementations; `IMPLEMENTATION_DIFFERENCE` is a current UI choice; `MISSING` is a
feature not exposed by the target. Deliberate routing differences are explicit below.
Shared Save/Apply does not imply identical browser APIs, storage or recovery.
See [Firefox architecture](FIREFOX_ARCHITECTURE.md) and [Installation](../user/INSTALLATION.md).

## Popup and controls

| Feature | Firefox behavior | Status / limit |
| --- | --- | --- |
| Protection state | OFF, active after READY, recovered, initializing, blocked | PARITY; recovery is separately visible |
| Current site | Normalized HTTP(S) hostname, never full URL/path/query | PARITY |
| Auto / Proxy / Direct | Auto removes applicable overrides; source/shared rules determine the result | PARITY |
| Exact/domain scope | Exact plain host or `*.example.com`; bundled `tldts` includes private suffixes | PARITY |
| Pending settings | Separate Draft/Saved/Effective and explicit confirmation for unrelated pending Saved | PARITY; Save is not Apply |
| Apply | Acquire floor initially; active replacement preserves it without OFF | EQUIVALENT |
| Turn off | Release only the exact owned proxy layer | EQUIVALENT |
| Settings navigation | Extension-local Options/Proxy connections links | PARITY |
| Uncontrollable page | No route controls for non-HTTP(S) pages | PARITY |
| No usable Proxy candidate | Block Apply and link to connections; background validates too | PARITY |
| External control | Withdraw session, show control loss, preserve foreign settings | EQUIVALENT |
| Data freshness | Source date, check time, channel and staged status | EQUIVALENT; HTTPS validation is not author signature |
| Refresh data | Update button and distinct data/check dates | PARITY; preserve pending Saved and OFF, refresh from Effective |
| Proxy health | Manual explicit-Proxy-origin check, no automatic health or telemetry endpoint | EQUIVALENT |
| Toolbar | Derived A/P/D/OFF/EXT, busy/loading/warning/title, recomputed after recreation | PARITY |

## Options

| Feature | Firefox behavior | Status / limit |
| --- | --- | --- |
| Overview | Protection/source/private-access state shown separately | PARITY |
| Sources | Anticensority, Antifilter or manual rules/connections | EQUIVALENT; Antifilter needs own connections and consent; manual needs no provider data |
| Extra/custom PAC sources | Not exposed by this declarative-data runtime | MISSING; a product boundary, not inability of Firefox's native PAC API |
| Site rules | Direct/Proxy/whitelist list, preserved order/overlaps, backend validation | PARITY |
| Own proxies/order | HTTP/HTTPS/SOCKS4/SOCKS5, shared candidate order | EQUIVALENT; Firefox DNS/timeout options cause transfer warnings |
| Proxy credentials | KEEP/SET/NONE; passwords never returned to page state | PARITY; request auth stays bound to Effective |
| Tor/WARP | Three independent Tor scopes, two WARP scopes | EQUIVALENT; Chromium retains master enabled; WARP scope is list-wide, so mixed per-entry scopes cannot transfer |
| Safe defaults | Provider and own-sites-only enabled; Direct replacement/noDirect disabled | PARITY; new Tor config is onion-only, localhost:9050 then :9150; existing Saved values preserved |
| Import/export | Portable Saved plus separate support export | EQUIVALENT; Anticensority/Antifilter/manual transfer, unsupported custom/Antizapret and browser options disclosed; never auto-apply |
| Site resources | Bounded manual domain capture while one tool page is open | PARITY; selected exact Proxy rules are browser-wide Saved; Apply separate |
| Maintenance/update | Data date, HTTPS refresh and deferred install | EQUIVALENT; permitted OFF/READY install keeps Effective user settings and pending Saved separate |
| Periodic source refresh | Serialized no-input check/promotion, 12-hour alarm | EQUIVALENT; OFF stays OFF, blocked/manual keeps staged candidate; checks continue in manual mode |
| Diagnostics | Redacted report/export | EQUIVALENT; no private URLs, endpoints, authRef, hashes, floor or credentials |
| Direct policy | Shared `replaceDirectWithProxy` / `noDirect`, also in manual mode | PARITY |
| Notifications | Fixed localized control-loss/recovery/health alerts, cooldown and Maintenance link | EQUIVALENT; routine events silent |
| About/version | Package version, local executable assets only | PARITY |
| EN/RU | Follows browser locale | PARITY |
| Built-in language selector | No independent preference | IMPLEMENTATION_DIFFERENCE; technically possible, not implemented |

## Routing and implementation limits

- Candidate order is own proxies → local Tor → Tor Browser → WARP. Tor Proxy,
  onion and Direct-replacement scopes are independent; WARP has Proxy/Direct scopes.
  Chromium quick Proxy switches preserve other scopes and do not enable hidden presets.
- Firefox deliberately strips terminal `PROXY + DIRECT`. Exhausted provider proxies
  fail closed. This `INTENTIONAL_ROUTING_DIFFERENCE` does not mean native Firefox PAC
  cannot return Direct.
- Exhausted Firefox proxy-auth retries cancel instead of trying the next proxy.
  Ordinary failover does not prove auth/fallback parity. Website 401 remains
  browser-owned in both targets and never receives stored proxy credentials.
- Apply needs no protection-off interval. Firefox requires private access and
  preserves its exact floor during replacement; Chromium uses PAC/ownership APIs.
- Firefox's floor can collide with local services and does not defend against
  hostile local software. Chromium `mandatory: false` also gives no browser-level
  fail-closed guarantee.
- Fixed HTTPS checks establish provenance/format, not author signature. A separate
  unconfigured signed-manifest endpoint/key does not disable the HTTPS channel.

The [0.0.4.0 visual gate](qa/CROSS_BROWSER_0.0.4_UX.md) covers its historical package,
popup states and seven Options sections in EN/RU at 100/125/150%. It does not prove
later source controls, Tor scopes, origin auth or update/recovery behavior.
Release QA always belongs to the exact selected package.
