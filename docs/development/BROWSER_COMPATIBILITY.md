# Browser compatibility

## Expected minimums

The 1.0.1–1.0.3 manifests target desktop **Chromium 108+** and **Firefox 140+**,
including ESR on a compatible base, provided the required extension APIs exist.
These are source/API-based minimums, not tests of every version, OS or fork.

| Family | Manifest minimum | Limiting requirement |
| --- | --- | --- |
| Chromium | `minimum_chrome_version: "108"` | MV3 proxy authentication with `webRequestAuthProvider` |
| Firefox | `strict_min_version: "140.0"` | Built-in `data_collection_permissions` consent |

Brave, Edge, Opera and other derivatives must meet the **Chromium engine version**,
not their own product number, and provide MV3, proxy/auth APIs, `storage.session`
and other required capabilities. Firefox derivatives also need compatible
WebExtensions APIs and built-in data consent. Forks can disable APIs or extension
installation; do not claim unconditional support for every browser on an engine.
Mobile browsers, WebView and wrappers without full extension APIs are outside
this assessment. Prefer a maintained current browser.

## Basis of the recorded minimums

The reviewed manifests, API calls, JavaScript, CSS and shared helpers did not
require Firefox 154 or Chromium 156 specifically:

- Chromium async `onAuthRequired` with `webRequestAuthProvider` starts at 108
  ([Chrome API](https://developer.chrome.com/docs/extensions/mv2/reference/webRequest)).
  The runtime uses `chrome.*`; newer `browser.*` support does not raise its minimum.
- `storage.session` starts at 102 ([storage](https://developer.chrome.com/docs/extensions/reference/api/storage));
  CSS `:has()` starts at 105 ([Chrome 105](https://developer.chrome.com/blog/new-in-chrome-105)).
- The code does not await an `alarms.create` Promise (added in 111) or require exact
  30-second firing. Older browsers may delay a diagnostic check; it does not switch
  routes ([alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms)).
  Later worker lifecycle improvements are useful but do not alone establish an API
  requirement or prove old-browser behavior.
- Firefox enables MV3 by default from 109 ([release notes](https://www.firefox.com/en-US/firefox/109.0/releasenotes/)).
  The separate signed channel's Web Crypto Ed25519 starts at 129
  ([Firefox 129](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/129)).
  That channel is unconfigured; the working HTTPS channel is not signed.
- The Firefox manifest declares `authenticationInfo` and `browsingActivity`.
  Built-in desktop consent starts at 140; no older-browser consent UI is provided.
  Lowering the minimum to 109/129 requires additional implementation
  ([Mozilla consent documentation](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/)).

## Recorded browser QA

| Source/package | Environment | Observed coverage |
| --- | --- | --- |
| 1.0.1 source | Windows Chrome 156.0.8078.48, Firefox 159.0 | UI checks |
| 1.0.1 source | Windows Firefox 153.5.1 ESR | Temporary install: proxy auth, Save/Apply, background recreation, private access and ownership |
| Signed Firefox 1.0.1 | Clean Windows Firefox 159.0 profile | Signature, permanent install, restart without reinstall, active extension and Options |
| 1.0.2 source | Chrome 156.0.8078.79, Firefox 159.0 | Local update scenarios |
| 1.0.2 source | Windows Firefox 153.5.1 ESR | Bounded active/pending settings scenario |
| Signed Firefox 1.0.1 → 1.0.2 | Windows Firefox 159.0 | Permanent signature-enforced update/restart preserving OFF, Effective and pending Saved |
| 1.0.3 Chromium ZIP | Windows Chrome 156.0.8078.80 | Routing/auth/restart/ownership smoke; unpacked 1.0.2 → 1.0.3 update with OFF, Effective and pending Saved preserved |
| Signed Firefox 1.0.2 → temporary unsigned 1.0.3 | Windows Firefox 159.0 | OFF, Effective and pending Saved preserved; candidate reinstalled after restart, not a permanent signed update |

These records do not prove store automatic delivery or comprehensive routing/UI
coverage. Chromium 108 and Firefox 140 were not individually launched; Linux
remains untested. The [ESR/Linux procedure](qa/FIREFOX_ESR_153.md) is a reproducible
scenario, not evidence that it ran. Versioned details remain in
[1.0.0](releases/1.0.0.md), [1.0.1](releases/1.0.1.md), [1.0.2](releases/1.0.2.md)
and [1.0.3](releases/1.0.3.md).

## Published packages

Use [Installation](../user/INSTALLATION.md), [release metadata](../release-current.json)
and the [store checklist](../release/STORE_PUBLICATION_CHECKLIST.md) for dated
availability and signed download links. Publication is not proof of automatic
update delivery. Previously published packages and their evidence are immutable.
