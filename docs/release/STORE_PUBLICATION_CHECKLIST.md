# Store publication checklist — 1.0.x

**Publication checklist.** Firefox Add-ons and locally installed desktop packages
can ship independently of Chrome Web Store. Store submissions may proceed in parallel; review in one store does not block
the other channels. This document grants no permission to bump
versions, sign, tag, create releases, upload or submit store packages. Obtain
separate maintainer authorization for those actions.

The maintained source and manifests identify `1.0.3`. Its Chromium ZIP is
published alongside the signed Firefox XPI; Firefox Add-ons offers 1.0.3.
Chrome Web Store still offers 1.0.2 after owner-reported submission.
The [release record](../development/releases/1.0.3.md) binds source, trusted-main
CI and canonical artifacts. Publication status remains independent per channel.

## Current channel status

Last confirmed on 2026-11-07 at 18:58 UTC; this is not a live store-status feed.

- [Chrome Web Store](https://chromewebstore.google.com/detail/poohkdbmgajmcifcaijdjgiihghlgbph): public **1.0.2**, Revived name, updated November 5, 2026; Chromium **108+**. Publication is not a general PAC-policy exception for future changes.
- [Firefox Add-ons](https://addons.mozilla.org/ru/firefox/addon/runet-censorship-bypass-mv3/): public **1.0.3**, desktop Firefox **140+**, Revived name in English and Russian. Mozilla file **5221829** is public.
- [GitHub Release v1.0.3](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/tag/v1.0.3): Chromium ZIP and signed Firefox XPI are public and were downloaded again with identical bytes. SHA-256 values are in the release notes; separate checksum downloads were removed on November 8.
- [GitHub Release v1.0.2](https://github.com/aVitomin/runet-censorship-bypass-revived/releases/tag/v1.0.2): Chromium ZIP and Mozilla-signed Firefox XPI, each with a checksum. The release tag and package bytes remain unchanged.
- The signed Firefox **1.0.3** runtime matches the canonical candidate; only manifest formatting and Mozilla signature files differ. Signature-enforced permanent update from 1.0.2 and restart without reinstall passed on Windows Firefox 159.0.1 with OFF, applied and pending settings preserved. This does not assert automatic store delivery or Linux QA.
- See the [1.0.3 record](../development/releases/1.0.3.md) and [1.0.2 record](../development/releases/1.0.2.md) for hashes and full validation boundaries; the [link audit](LINK_AUDIT_1_0.md) lists the remaining listing-copy corrections.

The remaining checklists are procedures for a submission or future update;
unchecked boxes are not a claim that the confirmed submissions did not occur.

## Before any upload

- [ ] Agree on the supported browsers/platforms, release version, channels and
  publisher identities. Review any localized listing copy against English.
- [ ] Approve and make any required version/localized manifest-description
  changes in a separate release task. Verify version authority, both built
  manifests, immutable Firefox Gecko ID, minimum versions and all locale text.
- [ ] Use a clean exact validated main commit and the current
  [release process](../development/RELEASE_PROCESS.md). For that separate release
  task, install pinned dependencies from the extension npm root, run required
  supply-chain/aggregate gates, and build both packages. Local preflight commands
  include `npm --prefix $Project run verify`, `release:chromium` and
  `release:firefox`, with `$Project = '.\extension'` set at repository root.
  These commands are instructions only here, not executed validation evidence.
- [ ] Require all trusted-main CI jobs, including Verify MV3 and canonical
  artifact uploads, to succeed for that exact SHA. Use canonical artifacts from
  that run; do not substitute an independently rebuilt package or PR artifact.
- [ ] Check deterministic rebuild evidence, archive root manifests, version,
  package allowlists, licenses, checksums and Firefox reviewer-source archive.
  Run the pinned Mozilla validator on the exact XPI as required by the release
  process. No docs, screenshots, profiles, logs, tests or secrets in packages.
- [ ] Verify icons at packaged sizes and store-specific upload sizes. Confirm
  branding/publisher identity without implying affiliation with old upstream
  listings or claiming a verified homepage domain the publisher does not own.
- [ ] Verify [screenshots and provenance](../assets/store/README.md) against the
  final package: truthful state, readable text, correct dimensions, no private
  data. The [current gallery](../assets/releases/1.0.2/README.md) contains five
  Options views per browser and locale. If a popup screenshot is used, distinguish
  a native browser popup from a standalone page; check browser-supplied labels.
- [ ] Repeat reviewer/browser QA on the exact candidate: clean off, private
  access, modes/scope, Save/Apply, pending categories, imports, auth, recovery,
  updates and ownership loss. Old screenshot QA is not complete release QA.
- [ ] Compare every built permission and data declaration to the
  [audit](PERMISSIONS_AND_PRIVACY_1_0.md). Do not copy explanations for absent
  permissions or silently broaden grants.
- [ ] Approve the [privacy notice](PRIVACY_1_0.md) against actual network/storage
  behavior. Distinguish local settings from proxy/source/check transmissions;
  preserve sensitive-export warnings and no-password/support-export claims.
- [ ] Verify the version's privacy notice on main is reachable without sign-in
  and matches the submitted package before entering this canonical store URL:
  `https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/release/PRIVACY_1_0.md`.
  Recheck the URL at submission time; repository link validation alone does not
  establish public availability.
- [ ] Recheck repository, documentation, support, privacy and security links
  using the [public-link audit](LINK_AUDIT_1_0.md). Verify support/private-report
  forms in the maintainer account; no report needs to be submitted as a test.
- [ ] Recheck current store requirements. Review
  [Mozilla submission guidance](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
  and [Chrome listing guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-listing/).

## Firefox Add-ons — primary

- [ ] Sign in to the authorized publisher account. Confirm whether to create
  this fork's listed entry or update its existing legitimate entry; preserve
  its Gecko ID. Do not reuse an upstream add-on/store identity.
- [ ] Upload the exact validated unsigned XPI and requested reviewer-source
  archive. Check validation findings and provide reproducible build instructions.
  Keep credentials outside the repository/CI; signing is performed through
  Mozilla, not by this documentation workflow.
- [ ] Enter the [Firefox listing](FIREFOX_AMO_LISTING_1_0.md): title, summary,
  description, category, natural tags, homepage and support. Review locales and
  supported desktop platforms; do not infer Android support from MV3 support.
- [ ] Supply the approved privacy policy and confirm `authenticationInfo` and
  `browsingActivity` disclosures. “No telemetry” is not “no data transmitted.”
- [ ] Upload reviewed Firefox screenshots and icon with accurate captions.
  Do not describe a standalone popup page as a native popup.
- [ ] Attach the [AMO reviewer notes](../development/FIREFOX_AMO_REVIEW.md),
  candidate identifiers/checksums, source/build information and safe synthetic
  testing instructions. No personal credentials or browser profile attachments.
- [ ] Review visibility/release timing, submit only with authorization, monitor
  validation/review, and respond accurately to requests. Do not announce a
  listed or approved release merely because an upload/signing step succeeded.
- [ ] Retrieve the signed result, verify identity/version and runtime contents
  against the reviewed candidate accounting for signing metadata, and smoke-test
  normal installation. Record the actual public AMO URL only once available.

## Chrome Web Store — parallel channel

- [ ] First resolve the [PAC/remote-code policy review](CHROME_REVIEWER_NOTES_1_0.md#pac-disclosure-and-publication-hold)
  and data-transport review for the new candidate. If unresolved, keep that update unpublished;
  do not make an unsupported remote-code/secure-transmission certification.
- [ ] Use the authorized publisher account and correct extension identity.
  Upload the canonical Chromium ZIP with its manifest at archive root; record
  the exact artifact and checksum. Do not upload the source tree.
- [ ] Enter the [Chrome listing copy](CHROME_WEB_STORE_LISTING_1_0.md), confirm
  package-derived title/short description/locales, choose the current relevant
  category and distribution preferences, and verify homepage/support links.
- [ ] Complete the privacy dashboard: single purpose, every permission/host
  justification, user-data categories, remote PAC disclosure and Limited Use
  certifications. Publish the approved privacy policy URL first.
- [ ] Upload the reviewed store icon, five 1280x800 screenshots and 440x280
  promotional tile; verify current
  [image requirements](https://developer.chrome.com/docs/webstore/images).
- [ ] Provide [reviewer notes](CHROME_REVIEWER_NOTES_1_0.md), then submit only
  with authorization. Review results and smoke-test the accepted store package.
  Record the actual listing URL; do not invent one or link to a legacy package.

## After approval and authorized publication

- [ ] Confirm the approved store item/version is actually available in the
  intended channel; signing, acceptance and public listing are distinct states.
- [ ] Create the approved version tag at the exact validated main SHA, following
  the release process. Do not move an existing published tag.
- [ ] Create the GitHub release using that tag and canonical approved assets
  (including the verified Mozilla-signed XPI where appropriate). Record hashes,
  browser QA, actual store availability and any unpublished optional target.
  Upload installable packages only; keep SHA-256 values and exact filenames in a
  collapsed notes block, with checksum files retained in local/CI evidence.
  Download published assets again and verify contents/checksums before announcing.
- [ ] Update `docs/release-current.json`, current-release README/user docs,
  installation links and the final privacy policy coherently. This checklist
  does not change them in advance. Re-run docs/link checks and require green CI.
- [ ] Announce only confirmed capabilities and available channels, linking this
  fork's actual release/store pages. Include known limitations and support links;
  do not promise connectivity, anonymity, encryption or security protection.
- [ ] Monitor support/review feedback without requesting secrets, raw browser
  profiles or configuration exports in public issues.

## Release follow-through

- [ ] Record public versions separately for Firefox, Chrome and manual downloads,
  with the verification date. A publisher-reported pending review is not public availability.
- [ ] Check both listing languages, screenshot captions, current guide, support and
  privacy links. Keep previous guide URLs useful with a link to the current edition.
- [ ] For a signed Firefox update, compare the payload with the trusted artifact and
  verify permanent update/restart with OFF, applied and pending settings preserved.
  Test profiles must not overwrite browser proxy preferences during restart.
- [ ] Update README, documentation index, installation, compatibility, release metadata
  and existing release notes together. Refresh the dated status in this checklist,
  the link audit and both listing templates too. Preserve published tags and earlier assets.
- [ ] When release communications are authorized, add one concise news comment with
  verified channel status and reply to related implemented feature requests with
  the version, instructions and remaining channel limitations. Check for duplicates.
- [ ] Keep unresolved channels or defects in the handoff with an explicit next step;
  do not describe partial delivery as complete.
