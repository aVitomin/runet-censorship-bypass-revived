# Firefox 153 ESR on Linux: optional QA procedure

This procedure can supplement the calculated Firefox 140+ minimum with an actual
Debian/Linux ESR 153 run. It is not a result, scheduled task or release blocker by
itself. Testing every intermediate browser version is unnecessary. Use a disposable
profile and synthetic settings, never personal credentials or browsing history.

## Environment and test package

Use Node.js 22.17+, the distribution's Firefox runtime dependencies, and official
Firefox **153.5.1 ESR** for the required architecture. Download the archive and
`SHA256SUMS` from [Mozilla](https://archive.mozilla.org/pub/firefox/releases/153.5.1esr/),
verify SHA-256 and extract separately from installed Firefox. The recorded hash for
`linux-x86_64/en-US/firefox-153.5.1esr.tar.xz` is:

```text
e289bdc532decf2b54dea9b5ac64cf6f84a62eeec4d4a9ec2f69590f61b0ff1c
```

Run Bash from repository root and supply the extracted executable path. The manifest
minimum of 140 already permits ESR 153; do not change it for this test.

```bash
set -euo pipefail
export FIREFOX_BIN='/absolute/path/to/firefox/firefox'
unset FIREFOX_RELEASE_XPI
"$FIREFOX_BIN" --version
npm ci --prefix extension
npm --prefix extension run verify:firefox

qaRoot="$(mktemp -d "${TMPDIR:-/tmp}/rucb-esr-qa.XXXXXX")"
export FIREFOX_PACKAGE_ROOT="$qaRoot/extension"
cp -R extension/build/firefox "$FIREFOX_PACKAGE_ROOT"
diff -qr extension/build/firefox "$FIREFOX_PACKAGE_ROOT"
```

This copied test package is not a release and must not be submitted to stores.

## Automated browser scenarios

```bash
node extension/src/firefox/test/firefox-lifecycle-smoke.js | tee "$qaRoot/lifecycle.log"
node extension/src/firefox/test/firefox-proxy-control-smoke.js | tee "$qaRoot/control.log"
node extension/src/firefox/test/firefox-auth-control-smoke.js | tee "$qaRoot/auth-auto.log"
node extension/src/firefox/test/firefox-auth-control-smoke.js --manual | tee "$qaRoot/auth-manual.log"
```

Every command must exit 0. Full auth/lifecycle scenarios wait for real background
destruction; `--quick` cannot establish that coverage. They check OFF, preservation
of prior proxy settings, private-access denial/revocation, ownership, Save B with
Effective A, recovery of A and Apply B, 407 retry bounds and withholding proxy
credentials from origin 401. See [Testing](../TESTING.md) for exact limits.

## Manual checks and evidence

In a new temporary profile, load the test manifest through
`about:debugging#/runtime/this-firefox`, grant private-window access and check:

1. Popup/all Options sections in EN/RU, light/dark/system themes, keyboard and
   narrow-window behavior. Search/navigation preserve Draft.
2. Save does not enable control; Apply uses the saved revision. An invalid hidden
   field opens its section before focus.
3. Manual/alarm data refresh while OFF stays OFF; active refresh preserves pending
   Saved settings. `UNCHANGED` alone is not an error.
4. Auto/Proxy/Direct with exact/subdomain rules through an owned test proxy;
   disabling restores the previous browser setting.

Record OS/browser, commit, source-package hash, exit codes, manual outcomes and
untested cases. Temporary installation does not replace later full restart QA
with a signed permanent package. Close the owned test browser afterward and remove
only directories created for this QA. Do not publish profiles, private URLs,
credentials or unredacted logs.
