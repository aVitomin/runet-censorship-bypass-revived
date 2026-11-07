---
name: pac-regression
description: Review Chromium PAC and Firefox declarative routing changes affecting matching, precedence, fallback, candidate order, Direct/noDirect or own-proxy scope; exclude copy, styling and unrelated state/build changes.
---

# Routing regression

PAC execution is Chromium-specific. Firefox consumes declarative rules; evaluated
PAC output cannot establish Firefox behavior. Read root/scoped rules and inspect
the relevant diff/callers, including relevant untracked files. Keep credentials
and private provider URLs out of output. A review does not automatically fix code.

## Contract and cases

Identify the changed branch and observable routing result. Cover affected and
adjacent combinations: exact host versus `*.domain`, Auto/Proxy/Direct, whitelist,
`.onion`, provider selection/fallback, candidate order, own-proxy scope, `noDirect`
and safe defaults. Preserve usable explicit-Proxy candidates with no Chromium
provider fallback or unintended DIRECT; Auto removes the override, Direct is explicit.

For Chromium assert evaluated `FindProxyForURL` results, not string fragments;
maintained cases live in `extension/src/chromium/test/pac-regression.js`.
For Firefox assert the corresponding declarative decision/adapter behavior.
Shared routing changes need both views, without pretending they have identical
browser fallback semantics. Pure reviews may reuse applicable evidence and add
only bounded probes needed to establish a concrete finding.

## Check selection

During implementation `test:pac` is optional focused feedback. Final gates come
from root AGENTS: `verify:chromium` already contains Chromium/PAC tests;
`verify:firefox` covers Firefox-only changes; shared routing uses `verify`.
Do not run the contained suites again on unchanged inputs.

Use targeted browser QA for claims about PAC parsing, `mandatory:false`, real
failover, DNS/leaks or UI-derived scope. Report a failure as
`scope | mode | candidates | expected | actual`, with source references and
separate deterministic/browser evidence. Do not expand a prose-only change into
routing work or treat an untested hypothesis as a defect.
