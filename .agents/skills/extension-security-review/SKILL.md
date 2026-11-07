---
name: extension-security-review
description: Review extension boundaries affected by permissions, lifecycle, routing, provider downloads, credentials, persistent state, external requests, ownership or browser errors; exclude prose and visual-only edits.
---

# Extension security review

Scope the changed boundary or named audit question. Read the root/scoped rules,
relevant diff and callers. Trace actual per-browser consumers and package inputs.
Review is read-only unless fixing is in the current task. Never expose passwords,
browsing data, full custom URLs or profile contents.

## Review affected boundaries

1. Permission/host/CSP expansion and executable-code provenance.
2. Untrusted PAC/dataset parsing, schema/size bounds, hashes/signatures and trust
   assignment. Distinguish fixed HTTPS validation from author authentication.
3. Input/final redirect URLs, URL credentials, streaming bounds, deadlines,
   referrer policy, fallback and opt-in network paths.
4. Credential routing/redaction across PAC, DOM, storage, RPC, errors, events,
   notifications and diagnostics. Use Effective/request-bound credentials,
   never a newer Saved revision; preserve bounded retries and safe ambiguity.
5. Storage/IndexedDB transactions, journals, pointers, concurrent mutations,
   restart reconstruction, alarms and cleanup. Save/import changes Saved only;
   exact Apply and active provider refresh preserve pending-settings isolation.
6. Direct/fail-open paths, callback authorization, proxy ownership/control loss,
   private access and listener errors. Chromium live-PAC reconciliation and
   Firefox's owned floor/private-access prerequisite are different contracts.
7. Package allowlists, source/runtime correspondence and unintended executable
   input. Do not assume both browser packages copy the same files.

For a dependency/Action/vendor delta use `dependency-review` for that part.
For routing semantics add `pac-regression`; integrate their evidence in this
review rather than repeating it as a second full review.

## Verification and handoff

For implementation, use the root's affected final gate once. Add targeted real
browser QA when the claim depends on permissions, proxy/auth, ownership,
lifecycle/recovery, storage/alarms or browser fallback. A read-only audit chooses
bounded probes from its questions; it does not trigger a rebuild/release gate.
Prose/visual-only work does not activate this skill without a boundary change.

Findings need a concrete trigger, path/line, affected invariant, actual versus
expected behavior and a bounded remedy/check. Separate confirmed defects,
intentional safety behavior, hypotheses and coverage gaps. Lead with findings,
then verified boundaries, commands/outcomes and package/browser limitations.
Never call Chromium PAC browser-level fail-closed while `mandatory:false` is used.
