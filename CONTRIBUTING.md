# Contributing

Find an existing issue or describe the intended behavior before changing it.
Use [Support](SUPPORT.md) for bug reports and feature requests, and the
[development guide](docs/development/DEVELOPMENT.md) for setup and commands.

## Start with the affected scope

For documentation or GitHub-template changes, no dependency install or runtime
suite is needed:

```powershell
node .\scripts\verify-docs.mjs
git diff --check
```

For code, use Node.js 22 and follow [AGENTS.md](AGENTS.md). Its scope table selects
the required local gate; [Testing](docs/development/TESTING.md) explains commands
and browser coverage. Install dependencies only under `extension`. Applicable
local gates, regression coverage and required CI are mandatory.

## Change boundaries

- Use a focused branch from current `main`; avoid unrelated runtime, permission,
  dependency and documentation changes.
- Write developer instructions, comments and documentation in English. Keep
  user-facing text in its intended language; update both `en` and `ru` UI catalogs.
- Treat downloaded PAC as untrusted data, never executable extension code.
- Keep real proxy credentials out of PAC, UI, logs, diagnostics and test fixtures.
- Do not commit builds, browser profiles, logs, `.tmp`, `.local`, secrets or private
  reports. Preserve licenses and historical records.
- Update current docs alongside changes to installation, behavior, browser support,
  privacy/security, commands, architecture or release procedure.

MV2 is historical, not a supported `main` target. Chromium MV3 and Firefox MV3 have
different shared-file allowlists; changes to common inputs/assets require both
package checks as defined in the repository rules.

## Pull requests

Describe the purpose, user-visible result, security/routing impact, checks actually
run and remaining browser QA. Record failed exit status and link a complete
sanitized log. Screenshots must contain no personal data or secrets.

Never publish passwords, private proxy/PAC URLs, tokens, cookies, URLs containing
credentials or browsing history. Report potential vulnerabilities through
[SECURITY.md](SECURITY.md), not a public issue or PR.
