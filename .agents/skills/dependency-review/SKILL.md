---
name: dependency-review
description: Review package/lock or dependency-manager changes, vendored third-party code, and GitHub Action additions or updates; exclude ordinary source and prose changes.
---

# Dependency review

Use the root supply-chain invariants. First identify mode: a read-only audit
reports evidence and risks; a dependency change also performs installation and
the final gates once the exact release is satisfactorily reviewed. A skill load
alone does not authorize installation, an upgrade or publication.

## Review before installation

- Explain why an existing/platform API is insufficient. Trace runtime/build
  consumers in both targets; the only npm root is `extension`.
- Verify exact registry/source identity, license, ownership, advisories,
  maintainers, release changes, tarball/vendor contents, size, executable files,
  lifecycle scripts, signatures/provenance and integrity. Popularity or age
  supports evidence; neither establishes safety.
- Inspect the complete lock delta: resolved URLs, integrity, lifecycle flags,
  transitive/optional additions and removals. Reject unexplained git/file/URL
  sources, registry/ownership changes and integrity churn.
- The root's 168-hour baseline and reviewed exact-version exception apply.
  Record an accepted early release in `scripts/reviewed-dependencies.json`,
  bound to version/integrity/source/checks/rationale. Do not request another age
  exception for an already authorized and satisfactorily reviewed update.
- For Actions, verify the full SHA against the official release and inspect the
  executable bundle/dependencies; minimize permissions and disable checkout
  credentials unless write access is required.

Stop installation on unresolved source, ownership, integrity or behavior risk.
Do not hide dev-only findings or use `npm audit fix --force`.

## Evidence for a change

For package/lock changes, after review:

```powershell
$Project = '.\extension'
node .\scripts\verify-supply-chain.mjs
node --test .\scripts\verify-supply-chain.test.mjs
npm ci --prefix $Project
npm --prefix $Project run audit:prod
npm audit --prefix $Project
npm audit signatures --prefix $Project
```

For Action/vendor changes use the supply-chain verifier/tests and affected
source/bundle checks. Then the root's affected final gate: tooling-root dependency
changes default to full `verify` unless evidence confines impact to tooling.
Reuse applicable existing evidence rather than running a duplicate gate.
For read-only audits choose useful non-mutating checks, not automatic `npm ci`.

Return APPROVE, REJECT or UNRESOLVED, with exact version/source, complete delta,
runtime/tooling impact, prod/full audit results, signature/provenance limitations,
commands/outcomes and any consequential missing decision. Zero advisories is not
a safety certificate. Technical uncertainty is not resolved by a blanket waiver.
