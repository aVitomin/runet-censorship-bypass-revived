# Change

Describe the problem, resulting user behavior and related issue.

## Scope and risk

- Affected: Chromium / Firefox / shared behavior / docs / dependencies / release.
- Routing, PAC, state, permission and credential impact: describe it or state none.
- User/developer documentation updated, or explain why no update is needed.

## Validation

- [ ] `node .\scripts\verify-docs.mjs` and `git diff --check` passed.
- [ ] The affected final gate from [AGENTS](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/AGENTS.md) and [Testing](https://github.com/aVitomin/runet-censorship-bypass-revived/blob/main/docs/development/TESTING.md) passed.
- [ ] Changed behavior has regression coverage, or explain why a new test is unnecessary.
- [ ] Required browser QA is complete or explicitly listed as remaining.
- [ ] Required CI passed, or its failure and full status are stated below.

Prose/template-only changes need no dependency install or runtime/browser suites.
Applicable code, dependency and release gates remain mandatory. Record commands,
exit status and limits; link the full sanitized log for failures.

## Safety and attachments

- [ ] No builds, profiles, logs, `.tmp`, `.local`, secrets or release artifacts in the diff.
- [ ] Examples/attachments omit real passwords, tokens, cookies, private proxy/PAC addresses and browsing history.
- [ ] Both `en` and `ru` user-facing catalogs updated where applicable.
