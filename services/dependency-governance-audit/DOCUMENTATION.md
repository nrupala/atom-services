# Dependency governance audit — `dependency-governance-audit`

**Display name:** Dependency governance audit · **Slug:** `dependency-governance-audit` · **Deliverable type:** CHECK · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial follows the recorded full-pass trial run — the exact recorded request and response are reproduced verbatim under [Worked examples](#worked-examples), Example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email), open the emailed sign-in link, then issue a key for this atom: `POST /v1/keys` with `{"atom": "dependency-governance-audit"}`. Keep the key; you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides, below.)

**Step 2 — Assemble the dependency-governance evidence manifest.** The manifest is one JSON object declaring the evidence the atom audits — every field is listed in the Input reference below. The recorded run's manifest declares `project`: `test-project`. Nothing is fetched or probed by the atom: what you declare is what is judged.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/dependency-governance-audit` with the manifest as the JSON body and the `Authorization` header set.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `GOVERNED` and the summary “21 pass, 0 fail, 0 missing of 21 checks across six sections.” — every one of the 21 checks passed. The response carries the per-section results under `sections`, the full `checks` array (each check with its `status` and the `evidence` string it was judged on), and a human-readable `stamp` restating the verdict.

**Step 5 — Use it as a gate.** `GOVERNED` is the passing outcome. Any other verdict tells you what to do next: a failing check names the evidence against it, and a `missing` check names the field to supply (see “Read a failing verdict and fix the manifest” below). Because the core is deterministic — same manifest in, same verdict out — a corrected re-submission is a clean re-test.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "dependency-governance-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. This atom's key scope (namespace) is `dependency_governance_audit` — a key without this scope gets a 403 (see Errors).
3. Call `POST https://atoms.pipavia.com/v1/dependency-governance-audit` with the manifest object as the JSON body and the header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, the per-section map, the `checks` array with per-check `status` and `evidence`, the `summary`, and the text `stamp`.

### Call via MCP

1. Get a key exactly as above (the MCP surface is key-gated on this gateway too).
2. Send JSON-RPC to `POST https://atoms.pipavia.com/mcp/dependency-governance-audit` with the same `Authorization: Bearer <key>` header.
3. Call `tools/call` for the tool `dependency_governance_audit`; the call arguments are the manifest object itself (the same object you would POST to REST).
4. The tool's `structuredContent` is the same verdict object the REST face returns — recorded MCP/REST parity for the full-pass case is part of the verification evidence in TEST-REPORT.md.

### Read a failing verdict and fix the manifest

A non-passing verdict is a work list, not a dead end. Read it in this order: (1) the `verdict` — fail-type means at least one check failed, evidence-type means nothing failed but evidence is missing; (2) the section map — which sections are `fail` vs `insufficient_evidence`; (3) the `checks` array — each check's `status` (`pass` / `fail` / `missing`) and its `evidence` string, which states what was declared. Fix `fail` checks by correcting the declared value; fix `missing` checks by supplying the absent field. Then re-submit.

In the recorded violations run (Worked example 2) the verdict is `NOT_GOVERNED` with exactly two failing checks:

- `binary_checksums_verified` (section `verified_sources`) — `sources.binary_checksums_verified` was `false` while binaries were declared present. Fix: verify the checksums of declared binaries and set the field to `true`.
- `no_automerge_without_green_suite` (section `audit_and_updates`) — `audit.automerge_without_green_suite` was `true`. Fix: set it to `false` — dependency bumps are never auto-merged without a green suite.

Re-submit the corrected manifest; the same input always returns the same verdict. If a check comes back `missing` instead, its field was absent — supply it rather than changing a value.

### Handle a 422 invalid_input

A type-violating manifest is rejected before evaluation — you get HTTP 422, never a verdict computed over garbage. The recorded malformed run (Worked example 3) sent a manifest whose first type violation the gateway names in the response:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "justification",
  "detail": "justification must be an object"
}
```

Read `field` as the dotted path of the offending field and `detail` as the expected type. Fix that field's type in your manifest and re-submit; validation reports the first violation it finds, so a manifest with several type errors may need more than one pass. A 422 is not metered as a delivered verdict.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/dependency-governance-audit` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/dependency-governance-audit` — JSON-RPC; tool name `dependency_governance_audit`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` then `POST /v1/keys` at https://atoms.pipavia.com (see How-to guides). Key scope namespace: `dependency_governance_audit`.

### Input reference

Every field the atom reads, grouped as SERVICE.md groups them, with its type. Types are from SERVICE.md's field table where it states them, corroborated by the gateway `inputSchema` in the recorded evidence and by the recorded full-pass manifest's actual values. A field **absent** = evidence missing (the check that reads it reports `missing`); a field present but false / invalid = the check **fails**. That distinction is deliberate and runs through every verdict this atom returns.

#### Group: —

| Field | Type | Notes |
|---|---|---|
| `project` | string | Read by: —. string; carried into the verdict output, not itself checked |

#### Group: justification

| Field | Type | Notes |
|---|---|---|
| `justification.recorded` | boolean | Read by: justification. |
| `justification.alternatives_considered` | boolean | Read by: justification. |

#### Group: verified_sources

| Field | Type | Notes |
|---|---|---|
| `sources.all_official` | boolean | Read by: verified_sources. |
| `sources.publisher_signing_checked` | boolean | Read by: verified_sources. |
| `sources.binaries_present` | boolean | Read by: verified_sources. |
| `sources.binary_checksums_verified` | boolean | Read by: verified_sources. checked only when `sources.binaries_present` is true; no binaries declared = pass |

#### Group: pinning

| Field | Type | Notes |
|---|---|---|
| `pinning.exact_versions` | boolean | Read by: pinning. |
| `pinning.lockfile_committed` | boolean | Read by: pinning. |
| `pinning.lockfile_updated_in_same_change` | boolean | Read by: pinning. |
| `pinning.ci_installs_from_lockfile` | boolean | Read by: pinning. |
| `pinning.ci_actions_images_pinned_to_hashes` | boolean | Read by: pinning. |

#### Group: audit_and_updates

| Field | Type | Notes |
|---|---|---|
| `audit.automated_in_workflow` | boolean | Read by: audit_and_updates. |
| `audit.bot_bumps_reviewed` | boolean | Read by: audit_and_updates. |
| `audit.automerge_without_green_suite` | boolean | Read by: audit_and_updates. must be `false` to pass |
| `updates.batched` | boolean | Read by: audit_and_updates. |
| `updates.stale_dependencies_flagged` | boolean | Read by: audit_and_updates. |
| `updates.unused_retired` | boolean | Read by: audit_and_updates. |

#### Group: licences

| Field | Type | Notes |
|---|---|---|
| `licences.checked` | boolean | Read by: licences. |
| `licences.non_permissive_present` | boolean | Read by: licences. |
| `licences.human_decision_recorded` | boolean | Read by: licences. required when `licences.non_permissive_present` is true; otherwise the check passes as not applicable |
| `licences.notice_required` | boolean | Read by: licences. |
| `licences.notice_updated` | boolean | Read by: licences. required when `licences.notice_required` is true; otherwise the check passes as not applicable |

#### Group: sbom

| Field | Type | Notes |
|---|---|---|
| `sbom.generated_per_release` | boolean | Read by: sbom. |
| `sbom.kept_with_artifacts` | boolean | Read by: sbom. |

### Checks

Every check the atom runs — 21 checks, matching the 21 entries in the recorded full-pass response's `checks` array exactly (names and sections grouping are the recorded ones; cross-checked against SERVICE.md). “Recorded pass evidence” is the `evidence` string from the recorded full-pass REST response: it states what the check read and why it passed.

Per-check status semantics, uniform across all checks unless a note says otherwise: `pass` — the declared evidence satisfies the check; `fail` — the field is present but false / invalid; `missing` — the field is absent (evidence not provided). A check whose precondition does not apply passes as not applicable — the recorded responses carry no separate not-applicable status; the `evidence` string says why it does not apply (see the noted conditional checks).

#### Section: justification

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `new_dependencies_justified_in_pr` | quality gate: new dependency justified in the PR (what/why/alternatives) |  |
| `alternatives_considered` | prefer the standard library; prefer boring, maintained, small |  |
#### Section: verified_sources

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `all_dependencies_from_official_sources` | skill red line: no dependencies from unknown sources; official registries/repos only |  |
| `publisher_and_signing_checked` | check publisher, release signing where available |  |
| `binary_checksums_verified` | checksums for binaries | Gated by `sources.binaries_present` (SERVICE.md: checked only when binaries are declared present; no binaries declared = pass). `sources.binaries_present` itself carries no separate check. |
#### Section: pinning

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `exact_versions_pinned` | skill red line: no unpinned "latest"; exact versions |  |
| `lockfile_committed` | lockfiles committed |  |
| `lockfile_updated_in_same_change` | quality gate: lockfile updated in the same change |  |
| `ci_installs_from_lockfile` | CI installs from the lock |  |
| `ci_actions_and_images_pinned_to_hashes` | quality gate: no unpinned CI actions or images; pin to commit hashes |  |
#### Section: audit_and_updates

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `automated_audit_in_workflow` | automated audit in the normal workflow |  |
| `bot_bumps_reviewed_not_blind_merged` | review bot bumps — do not blind-merge them |  |
| `no_automerge_without_green_suite` | skill red line: no auto-merge of dependency bumps without a green suite |  |
| `updates_batched` | update policy: batch updates, run the suite |  |
| `stale_dependencies_flagged` | flag anything with no release in ~2 years |  |
| `unused_dependencies_retired` | retire unused deps |  |
#### Section: licences

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `licences_checked` | quality gate: license checked |  |
| `non_permissive_licences_have_human_decision` | copyleft or commercial goes to an explicit human decision | Conditional: reads `licences.non_permissive_present` + `licences.human_decision_recorded`; passes as not applicable when no non-permissive licence is declared (recorded violations evidence: “no copyleft or commercial licences declared”). |
| `notice_updated_when_required` | quality gate: NOTICE updated when required | Conditional: reads `licences.notice_required` + `licences.notice_updated`; passes as not applicable when no NOTICE update is required (recorded violations evidence: “NOTICE update not required”). |
#### Section: sbom

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `sbom_generated_per_release` | SBOM: generate per release where feasible |  |
| `sbom_kept_with_release_artifacts` | keep SBOM with release artifacts |  |

### Output format

The REST response (and the MCP tool's `structuredContent`) is one JSON object:

```json
{
  "service": "dependency-governance-audit",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "GOVERNED",
  "sections": {
    "justification": "...",
    "verified_sources": "...",
    "pinning": "...",
    "audit_and_updates": "...",
    "licences": "...",
    "sbom": "..."
  },
  "checks": [
    {
      "section": "...",
      "check": "...",
      "status": "pass|fail|missing",
      "evidence": "..."
    }
  ],
  "summary": "21 pass, 0 fail, 0 missing of 21 checks across six sections.",
  "stamp": "<human-readable text stamp of the verdict>"
}
```

Fields, in recorded order: `service`, `atom_version`, `project`, `verdict`, `sections`, `checks`, `summary`, `stamp`. `service` and `atom_version` identify the atom and its version; the subject field(s) echo your manifest; `verdict` is the headline result; `sections` maps each section to its status; `checks` is the full per-check record; `summary` counts pass / fail / missing; `stamp` is the same verdict rendered as plain text for logs and messages.

### Verdict vocabulary

**Verdicts** — every value this atom can return:

| Verdict | Meaning |
|---|---|
| `GOVERNED` | all 21 checks pass across the six sections. |
| `NOT_GOVERNED` | at least one check fails on the declared evidence. |
| `INSUFFICIENT_EVIDENCE` | nothing fails, but at least one check is `missing` — the verdict names exactly which evidence to supply. |

**Section statuses** (values of the `sections` map): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks above. There is no separate not-applicable status: a check whose precondition does not apply reports `pass` with evidence stating why.

### Errors

Error shapes below are the gateway's recorded/documented shapes only (gateway call path, `rails/gateway/src/callpath.ts`, and the recorded evidence); no other payload is invented here.

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or a key that does not verify. On the MCP face the same condition returns `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the dependency_governance_audit scope; issue it for this atom first"}` | The key is valid but was never issued this atom's scope. On the MCP face: `{"error": "this key does not hold the dependency_governance_audit scope"}`. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "justification", "detail": "justification must be an object"}` (this atom's recorded malformed case, verbatim) | The manifest violates a declared field type; validation names the first offending `field` and the expected type in `detail`. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for dependency-governance-audit exceeded"}` (day form: `per-key limit 10000/day …`) | Per-key rate limit exceeded (see Rate limits). Rate-limited calls are not metered. |

### Rate limits and pricing

- **Rate limits (contract.yaml):** 60 calls per minute and 10,000 calls per day, per key, for this atom (SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing status (contract.yaml):** pricing unit is per delivered result; `pricing.rate` is `null` (rate_status: pending) — **Free during trial — rate pending.** No rate is published until the pricing protocol in `rails/billing.md` produces one.

## Explanation

Bound capability (from the bound skill): govern third-party dependencies — minimalism, pinning, audits, license checks, SBOM, and verified sources. The audit runs 21 deterministic checks across six sections: justification, verified_sources, pinning, audit_and_updates, licences, sbom. All manifest fields are booleans unless noted in the input reference.

**How the verdict is decided.** The core is deterministic: no model call, no network, same manifest → same verdict, byte-identically (recorded determinism and MCP/REST parity checks are in TEST-REPORT.md). Each check reads declared manifest fields only, and the three-way distinction is the heart of the design: a field **absent** is *missing evidence* (`missing` check → evidence-type verdict if nothing fails); a field **present but false / invalid** is a *failure* (`fail` check → fail-type verdict); a field present and valid passes. “You didn't show me” and “you showed me and it's wrong” are different verdicts, on purpose. Section statuses roll up from their checks, and the verdict rolls up from the sections: any fail anywhere → the fail-type verdict; no fails but any missing → the evidence-type verdict; all pass → the passing verdict.

**What it does NOT do.**

- It audits the declared governance record in the manifest. It does not scan your repository, read your lockfile, query a registry, or run a vulnerability database lookup itself.
- Field-to-check mapping is not one-to-one in two sections: `sources.binaries_present` gates the checksum check rather than carrying its own check, and the five `licences.*` fields drive three checks (see the Checks notes).
- It sells the check — a bounded judgment artifact — never the underlying dependency-governance knowledge.

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this check on demand and would rather buy it per use than build or staff the capability themselves. Self-use workflow (R3, passed): release supply-chain checks.

The atom sells its deliverable — the verdict/check artifact — never the underlying knowledge it is built from.

## Role views

### For integrators (Users)

Integrate one call: `POST https://atoms.pipavia.com/v1/dependency-governance-audit` (REST) or the MCP tool `dependency_governance_audit` at `POST https://atoms.pipavia.com/mcp/dependency-governance-audit`, with `Authorization: Bearer <key>` and the manifest object as the body/arguments. The call contract is the Input reference above — one JSON object, no fetching, no callbacks. What you get back is the Output format above: a verdict you can gate on, a per-section map, and a `checks` array whose `evidence` strings make the result auditable without a second call. Treat the fail-type verdict as “do not proceed”, the evidence-type verdict as “not yet decidable — supply the named fields”, and the passing verdict as the gate clearing. Calls are read-only and idempotent: re-submitting the same manifest returns the same verdict.

### For developers

Manifest authoring: declare facts, don't argue — each field is a factual claim about your system (see the Input reference for types, gates, and conditionals), and the atom judges exactly what you declare. Determinism is contractual: the implementation is a pure evaluation of the manifest (`src/dependency_governance_audit.py` in this atom's directory — `evaluate(manifest)` returning the verdict dict, with a CLI that prints JSON + the text stamp), with 16 local tests in `tests/test_dependency_governance_audit.py` (all passing 2026-11-15, per contract.yaml). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract rule R1), so check names and semantics here track SERVICE.md and the recorded responses, not folklore.

### For ops

Endpoints: REST `POST /v1/dependency-governance-audit` and MCP `POST /mcp/dependency-governance-audit` on https://atoms.pipavia.com (gateway v1.1.0). Auth: per-atom key scope `dependency_governance_audit`; watch for 401 (missing/invalid key), 403 (scope not issued), 422 (client manifest type errors — a client bug signal, not an outage), and 429 (per-key limit: 60/min, 10,000/day). Pricing: no published rate — rate pending, free during trial. Status: live — release candidate (one-week RC soak to 2026-11-22); the verification record is TEST-REPORT.md and `verification/results/dependency-governance-audit.json`. Support: info@pipavia.com.

### For regulators

What the verdict constitutes as evidence: a deterministic, reproducible judgment over a *declared* evidence manifest, with the per-check `evidence` strings preserved in the response itself — an auditor can re-submit the identical manifest and must receive the identical verdict (byte-identical determinism and MCP/REST parity are recorded in the verification battery). The audit trail lives in TEST-REPORT.md (independent external tester, cases and findings), `verification/work/dependency-governance-audit/evidence.json` (the raw recorded trial runs reproduced under Worked examples), and `verification/results/dependency-governance-audit.json` (the recorded verdict on that battery). Its limits are part of the evidence: the verdict is a judgment on declared evidence, not an independent inspection of the audited system, and it is **not a certification** — it attests that the declared record satisfies (or fails, or does not yet evidence) this atom's named checks, nothing more.

## Worked examples

Provenance: recorded 2026-11-15T23:56:06.311339+00:00 against gateway v1.1.0 (https://atoms.pipavia.com), external verification lane, source `verification/work/dependency-governance-audit/evidence.json`. Inputs are the cases' recorded `input`; responses are the REST executions' recorded `response_text`, pretty-printed (indent 2) only — the JSON values are verbatim, mechanically verified against the evidence after writing (see the checklist below).

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

```json
{
  "project": "test-project",
  "justification": {
    "recorded": true,
    "alternatives_considered": true
  },
  "sources": {
    "all_official": true,
    "publisher_signing_checked": true,
    "binaries_present": true,
    "binary_checksums_verified": true
  },
  "pinning": {
    "exact_versions": true,
    "lockfile_committed": true,
    "lockfile_updated_in_same_change": true,
    "ci_installs_from_lockfile": true,
    "ci_actions_images_pinned_to_hashes": true
  },
  "audit": {
    "automated_in_workflow": true,
    "bot_bumps_reviewed": true,
    "automerge_without_green_suite": false
  },
  "updates": {
    "batched": true,
    "stale_dependencies_flagged": true,
    "unused_retired": true
  },
  "licences": {
    "checked": true,
    "non_permissive_present": true,
    "human_decision_recorded": true,
    "notice_required": true,
    "notice_updated": true
  },
  "sbom": {
    "generated_per_release": true,
    "kept_with_artifacts": true
  }
}
```

Response (REST):

```json
{
  "service": "dependency-governance-audit",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "GOVERNED",
  "sections": {
    "justification": "pass",
    "verified_sources": "pass",
    "pinning": "pass",
    "audit_and_updates": "pass",
    "licences": "pass",
    "sbom": "pass"
  },
  "checks": [
    {
      "section": "justification",
      "check": "new_dependencies_justified_in_pr",
      "status": "pass",
      "evidence": "quality gate: new dependency justified in the PR (what/why/alternatives)"
    },
    {
      "section": "justification",
      "check": "alternatives_considered",
      "status": "pass",
      "evidence": "prefer the standard library; prefer boring, maintained, small"
    },
    {
      "section": "verified_sources",
      "check": "all_dependencies_from_official_sources",
      "status": "pass",
      "evidence": "skill red line: no dependencies from unknown sources; official registries/repos only"
    },
    {
      "section": "verified_sources",
      "check": "publisher_and_signing_checked",
      "status": "pass",
      "evidence": "check publisher, release signing where available"
    },
    {
      "section": "verified_sources",
      "check": "binary_checksums_verified",
      "status": "pass",
      "evidence": "checksums for binaries"
    },
    {
      "section": "pinning",
      "check": "exact_versions_pinned",
      "status": "pass",
      "evidence": "skill red line: no unpinned \"latest\"; exact versions"
    },
    {
      "section": "pinning",
      "check": "lockfile_committed",
      "status": "pass",
      "evidence": "lockfiles committed"
    },
    {
      "section": "pinning",
      "check": "lockfile_updated_in_same_change",
      "status": "pass",
      "evidence": "quality gate: lockfile updated in the same change"
    },
    {
      "section": "pinning",
      "check": "ci_installs_from_lockfile",
      "status": "pass",
      "evidence": "CI installs from the lock"
    },
    {
      "section": "pinning",
      "check": "ci_actions_and_images_pinned_to_hashes",
      "status": "pass",
      "evidence": "quality gate: no unpinned CI actions or images; pin to commit hashes"
    },
    {
      "section": "audit_and_updates",
      "check": "automated_audit_in_workflow",
      "status": "pass",
      "evidence": "automated audit in the normal workflow"
    },
    {
      "section": "audit_and_updates",
      "check": "bot_bumps_reviewed_not_blind_merged",
      "status": "pass",
      "evidence": "review bot bumps — do not blind-merge them"
    },
    {
      "section": "audit_and_updates",
      "check": "no_automerge_without_green_suite",
      "status": "pass",
      "evidence": "skill red line: no auto-merge of dependency bumps without a green suite"
    },
    {
      "section": "audit_and_updates",
      "check": "updates_batched",
      "status": "pass",
      "evidence": "update policy: batch updates, run the suite"
    },
    {
      "section": "audit_and_updates",
      "check": "stale_dependencies_flagged",
      "status": "pass",
      "evidence": "flag anything with no release in ~2 years"
    },
    {
      "section": "audit_and_updates",
      "check": "unused_dependencies_retired",
      "status": "pass",
      "evidence": "retire unused deps"
    },
    {
      "section": "licences",
      "check": "licences_checked",
      "status": "pass",
      "evidence": "quality gate: license checked"
    },
    {
      "section": "licences",
      "check": "non_permissive_licences_have_human_decision",
      "status": "pass",
      "evidence": "copyleft or commercial goes to an explicit human decision"
    },
    {
      "section": "licences",
      "check": "notice_updated_when_required",
      "status": "pass",
      "evidence": "quality gate: NOTICE updated when required"
    },
    {
      "section": "sbom",
      "check": "sbom_generated_per_release",
      "status": "pass",
      "evidence": "SBOM: generate per release where feasible"
    },
    {
      "section": "sbom",
      "check": "sbom_kept_with_release_artifacts",
      "status": "pass",
      "evidence": "keep SBOM with release artifacts"
    }
  ],
  "summary": "21 pass, 0 fail, 0 missing of 21 checks across six sections.",
  "stamp": "DEPENDENCY-GOVERNANCE AUDIT\nproject: test-project\nVERDICT: GOVERNED\n  justification      pass\n  verified_sources   pass\n  pinning            pass\n  audit_and_updates  pass\n  licences           pass\n  sbom               pass\n21 pass, 0 fail, 0 missing of 21 checks across six sections."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "project": "test-project",
  "justification": {
    "recorded": true,
    "alternatives_considered": true
  },
  "sources": {
    "all_official": true,
    "publisher_signing_checked": true,
    "binaries_present": true,
    "binary_checksums_verified": false
  },
  "pinning": {
    "exact_versions": true,
    "lockfile_committed": true,
    "lockfile_updated_in_same_change": true,
    "ci_installs_from_lockfile": true,
    "ci_actions_images_pinned_to_hashes": true
  },
  "audit": {
    "automated_in_workflow": true,
    "bot_bumps_reviewed": true,
    "automerge_without_green_suite": true
  },
  "updates": {
    "batched": true,
    "stale_dependencies_flagged": true,
    "unused_retired": true
  },
  "licences": {
    "checked": true,
    "non_permissive_present": false,
    "human_decision_recorded": true,
    "notice_required": false,
    "notice_updated": true
  },
  "sbom": {
    "generated_per_release": true,
    "kept_with_artifacts": true
  }
}
```

Response (REST):

```json
{
  "service": "dependency-governance-audit",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "NOT_GOVERNED",
  "sections": {
    "justification": "pass",
    "verified_sources": "fail",
    "pinning": "pass",
    "audit_and_updates": "fail",
    "licences": "pass",
    "sbom": "pass"
  },
  "checks": [
    {
      "section": "justification",
      "check": "new_dependencies_justified_in_pr",
      "status": "pass",
      "evidence": "quality gate: new dependency justified in the PR (what/why/alternatives)"
    },
    {
      "section": "justification",
      "check": "alternatives_considered",
      "status": "pass",
      "evidence": "prefer the standard library; prefer boring, maintained, small"
    },
    {
      "section": "verified_sources",
      "check": "all_dependencies_from_official_sources",
      "status": "pass",
      "evidence": "skill red line: no dependencies from unknown sources; official registries/repos only"
    },
    {
      "section": "verified_sources",
      "check": "publisher_and_signing_checked",
      "status": "pass",
      "evidence": "check publisher, release signing where available"
    },
    {
      "section": "verified_sources",
      "check": "binary_checksums_verified",
      "status": "fail",
      "evidence": "checksums for binaries"
    },
    {
      "section": "pinning",
      "check": "exact_versions_pinned",
      "status": "pass",
      "evidence": "skill red line: no unpinned \"latest\"; exact versions"
    },
    {
      "section": "pinning",
      "check": "lockfile_committed",
      "status": "pass",
      "evidence": "lockfiles committed"
    },
    {
      "section": "pinning",
      "check": "lockfile_updated_in_same_change",
      "status": "pass",
      "evidence": "quality gate: lockfile updated in the same change"
    },
    {
      "section": "pinning",
      "check": "ci_installs_from_lockfile",
      "status": "pass",
      "evidence": "CI installs from the lock"
    },
    {
      "section": "pinning",
      "check": "ci_actions_and_images_pinned_to_hashes",
      "status": "pass",
      "evidence": "quality gate: no unpinned CI actions or images; pin to commit hashes"
    },
    {
      "section": "audit_and_updates",
      "check": "automated_audit_in_workflow",
      "status": "pass",
      "evidence": "automated audit in the normal workflow"
    },
    {
      "section": "audit_and_updates",
      "check": "bot_bumps_reviewed_not_blind_merged",
      "status": "pass",
      "evidence": "review bot bumps — do not blind-merge them"
    },
    {
      "section": "audit_and_updates",
      "check": "no_automerge_without_green_suite",
      "status": "fail",
      "evidence": "skill red line: no auto-merge of dependency bumps without a green suite"
    },
    {
      "section": "audit_and_updates",
      "check": "updates_batched",
      "status": "pass",
      "evidence": "update policy: batch updates, run the suite"
    },
    {
      "section": "audit_and_updates",
      "check": "stale_dependencies_flagged",
      "status": "pass",
      "evidence": "flag anything with no release in ~2 years"
    },
    {
      "section": "audit_and_updates",
      "check": "unused_dependencies_retired",
      "status": "pass",
      "evidence": "retire unused deps"
    },
    {
      "section": "licences",
      "check": "licences_checked",
      "status": "pass",
      "evidence": "quality gate: license checked"
    },
    {
      "section": "licences",
      "check": "non_permissive_licences_have_human_decision",
      "status": "pass",
      "evidence": "no copyleft or commercial licences declared"
    },
    {
      "section": "licences",
      "check": "notice_updated_when_required",
      "status": "pass",
      "evidence": "NOTICE update not required"
    },
    {
      "section": "sbom",
      "check": "sbom_generated_per_release",
      "status": "pass",
      "evidence": "SBOM: generate per release where feasible"
    },
    {
      "section": "sbom",
      "check": "sbom_kept_with_release_artifacts",
      "status": "pass",
      "evidence": "keep SBOM with release artifacts"
    }
  ],
  "summary": "19 pass, 2 fail, 0 missing of 21 checks across six sections.",
  "stamp": "DEPENDENCY-GOVERNANCE AUDIT\nproject: test-project\nVERDICT: NOT_GOVERNED\n  justification      pass\n  verified_sources   fail\n  pinning            pass\n  audit_and_updates  fail\n  licences           pass\n  sbom               pass\n19 pass, 2 fail, 0 missing of 21 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "project": "malformed-project",
  "justification": "not-an-object",
  "sources": {
    "all_official": "should-be-boolean"
  }
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "justification",
  "detail": "justification must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Tutorial ✓ · How-to guides ✓ · Reference ✓ · Explanation ✓ |
| Role views present | Integrators (Users) ✓ · Developers ✓ · Ops ✓ · Regulators ✓ (audit/compliance-facing atom) |
| Checks named | 21 documented / 21 recorded in the full-pass response |
| Verdict vocabulary complete | 3 verdicts + section statuses (`pass`/`fail`/`insufficient_evidence`) + per-check statuses (`pass`/`fail`/`missing`) ✓ |
| Input reference typed | 25 fields, each with a type and notes ✓ |
| Worked examples verbatim-verified | full-pass ✓ · violations ✓ · malformed ✓ — fenced JSON blocks parsed and compared as JSON values against `verification/work/dependency-governance-audit/evidence.json` |
