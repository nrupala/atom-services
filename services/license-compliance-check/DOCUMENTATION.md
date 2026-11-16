# License compliance check — `license-compliance-check`

**Display name:** License compliance check · **Slug:** `license-compliance-check` · **Deliverable type:** CHECK · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial follows the recorded full-pass trial run — the exact recorded request and response are reproduced verbatim under [Worked examples](#worked-examples), Example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email), open the emailed sign-in link, then issue a key for this atom: `POST /v1/keys` with `{"atom": "license-compliance-check"}`. Keep the key; you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides, below.)

**Step 2 — Assemble the licence-posture manifest.** The manifest is one JSON object declaring the evidence the atom audits — every field is listed in the Input reference below. The recorded run's manifest declares `product`: `TestApp`, `distribution_model`: `proprietary_binary`. Nothing is fetched or probed by the atom: what you declare is what is judged.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/license-compliance-check` with the manifest as the JSON body and the `Authorization` header set.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `COMPLIANT` and the summary “19 pass, 0 fail, 0 missing of 19 checks across four sections.” — every one of the 19 checks passed. The response carries the per-section results under `sections`, the full `checks` array (each check with its `status` and the `evidence` string it was judged on), and a human-readable `stamp` restating the verdict.

**Step 5 — Use it as a gate.** `COMPLIANT` is the passing outcome. Any other verdict tells you what to do next: a failing check names the evidence against it, and a `missing` check names the field to supply (see “Read a failing verdict and fix the manifest” below). Because the core is deterministic — same manifest in, same verdict out — a corrected re-submission is a clean re-test.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "license-compliance-check"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. This atom's key scope (namespace) is `license_compliance_check` — a key without this scope gets a 403 (see Errors).
3. Call `POST https://atoms.pipavia.com/v1/license-compliance-check` with the manifest object as the JSON body and the header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, the per-section map, the `checks` array with per-check `status` and `evidence`, the `summary`, and the text `stamp`.

### Call via MCP

1. Get a key exactly as above (the MCP surface is key-gated on this gateway too).
2. Send JSON-RPC to `POST https://atoms.pipavia.com/mcp/license-compliance-check` with the same `Authorization: Bearer <key>` header.
3. Call `tools/call` for the tool `license_compliance_check`; the call arguments are the manifest object itself (the same object you would POST to REST).
4. The tool's `structuredContent` is the same verdict object the REST face returns — recorded MCP/REST parity for the full-pass case is part of the verification evidence in TEST-REPORT.md.

### Read a failing verdict and fix the manifest

A non-passing verdict is a work list, not a dead end. Read it in this order: (1) the `verdict` — fail-type means at least one check failed, evidence-type means nothing failed but evidence is missing; (2) the section map — which sections are `fail` vs `insufficient_evidence`; (3) the `checks` array — each check's `status` (`pass` / `fail` / `missing`) and its `evidence` string, which states what was declared. Fix `fail` checks by correcting the declared value; fix `missing` checks by supplying the absent field. Then re-submit.

In the recorded violations run (Worked example 2) the verdict is `NON_COMPLIANT` with six failing checks. The declared posture was a `proprietary_binary` distribution of a `GPL-3.0` project shipping a GPL component:

- `no_copyleft_in_proprietary_binary` and `copyleft_choice_logged_as_decision` (sections `dependency_compatibility` / `claims_and_contracts`) — a copyleft component in a proprietary binary, and `license_decision.logged` was `false`. Fix: resolve the combination before release, and log a copyleft project-licence choice as a decision (`license_decision.logged: true`).
- `scan_clean_or_accepted_with_record` and `no_incompatible_dependency_shipped` (`dependency_compatibility`) — the scan was not clean-or-accepted and an incompatible dependency was declared shipped. Fix: clear the scan, or accept findings with a record; never ship an incompatible dependency.
- `attribution_shipped_where_required` and `bundled_licenses_shipped_where_required` (`dependency_compatibility`) — a component required attribution and a bundled licence, and neither was declared shipped. Fix: ship both and set `attribution.shipped` / `bundled_licenses.shipped` to `true`.

Re-submit the corrected manifest; the same input always returns the same verdict.

### Handle a 422 invalid_input

A type-violating manifest is rejected before evaluation — you get HTTP 422, never a verdict computed over garbage. The recorded malformed run (Worked example 3) sent a manifest whose first type violation the gateway names in the response:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "distribution_model",
  "detail": "distribution_model must be a string"
}
```

Read `field` as the dotted path of the offending field and `detail` as the expected type. Fix that field's type in your manifest and re-submit; validation reports the first violation it finds, so a manifest with several type errors may need more than one pass. A 422 is not metered as a delivered verdict.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/license-compliance-check` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/license-compliance-check` — JSON-RPC; tool name `license_compliance_check`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` then `POST /v1/keys` at https://atoms.pipavia.com (see How-to guides). Key scope namespace: `license_compliance_check`.

### Input reference

Every field the atom reads, grouped as SERVICE.md groups them, with its type. Types are from SERVICE.md's field table where it states them, corroborated by the gateway `inputSchema` in the recorded evidence and by the recorded full-pass manifest's actual values. A field **absent** = evidence missing (the check that reads it reports `missing`); a field present but false / invalid = the check **fails**. That distinction is deliberate and runs through every verdict this atom returns.

#### Group: top level

| Field | Type | Notes |
|---|---|---|
| `product` | string | output/stamp only — echoed in the result; no check gates on it |
| `distribution_model` | string | `no_copyleft_in_proprietary_binary` fails when it is exactly `proprietary_binary` and any component licence is copyleft; the bundled-licence check is triggered when it is one of `proprietary_binary`, `binary_distribution`, `open_binary` |
| `project_license` | string | copyleft = licence string starting `AGPL` or `GPL`, case-insensitive |
| `components` | array of component objects (see schema below) | array of component objects (see the `components[]` group below); `components_inventory_declared` requires a non-empty list |

#### Group: license_decision

| Field | Type | Notes |
|---|---|---|
| `license_decision.logged` | boolean | required `true` only when `project_license` is copyleft |

#### Group: license_file

| Field | Type | Notes |
|---|---|---|
| `license_file.present` | boolean | `root_license_present` |
| `license_file.texts_unmodified` | boolean | `license_texts_unmodified` |

#### Group: notice_file

| Field | Type | Notes |
|---|---|---|
| `notice_file.present` | boolean | `notice_file_present` |

#### Group: source_headers

| Field | Type | Notes |
|---|---|---|
| `source_headers.present` | boolean | `source_headers_present` |

#### Group: dependency_scan

| Field | Type | Notes |
|---|---|---|
| `dependency_scan.completed` | boolean | `dependency_scan_completed` |
| `dependency_scan.clean` | boolean | passes when `true`, or when `accepted_with_record` is `true` |
| `dependency_scan.accepted_with_record` | boolean | boolean; alternative pass path for `scan_clean_or_accepted_with_record`; its own absence does not make the check missing (absent from the recorded full-pass manifest for that reason) |
| `dependency_scan.incompatible_shipped` | boolean | must be exactly `false` |

#### Group: attribution

| Field | Type | Notes |
|---|---|---|
| `attribution.shipped` | boolean | checked only when at least one component sets `requires_attribution: true`; otherwise the check passes on the components evidence |

#### Group: bundled_licenses

| Field | Type | Notes |
|---|---|---|
| `bundled_licenses.shipped` | boolean | checked only when the distribution model is a binary model and at least one component sets `requires_bundled_license: true` |

#### Group: contributor_terms

| Field | Type | Notes |
|---|---|---|
| `contributor_terms.policy` | string | must be `DCO` or `CLA` |
| `contributor_terms.documented_in_contributing` | boolean | `contributor_policy_documented` |
| `contributor_terms.enforced` | boolean | `contributor_policy_enforced` |

#### Group: trademark

| Field | Type | Notes |
|---|---|---|
| `trademark.usage_rules_documented` | boolean | `trademark_usage_rules_documented` |
| `trademark.implied_endorsement` | boolean | must be exactly `false` |

#### Group: public_claims

| Field | Type | Notes |
|---|---|---|
| `public_claims.claims_made` | array | the attestation field is checked only when this is a non-empty list |
| `public_claims.attestation_present` | boolean | `public_claims_have_attestation` |

#### Group: client_work

| Field | Type | Notes |
|---|---|---|
| `client_work.is_client_work` | boolean | the review field is checked only when this is `true` |
| `client_work.contract_constraints_reviewed` | boolean | boolean; read only when `client_work.is_client_work` is `true` (absent from the recorded full-pass manifest for that reason) |

#### Group: components[]

| Field | Type | Notes |
|---|---|---|
| `components[].name` | string | listed in the evidence string when the component's licence is copyleft |
| `components[].license` | string | copyleft when the string starts with `AGPL` or `GPL` (case-insensitive, surrounding whitespace ignored) |
| `components[].requires_attribution` | boolean | gates `attribution_shipped_where_required` when exactly `true` |
| `components[].requires_bundled_license` | boolean | gates `bundled_licenses_shipped_where_required` when exactly `true` |

### Checks

Every check the atom runs — 19 checks, matching the 19 entries in the recorded full-pass response's `checks` array exactly (names and sections grouping are the recorded ones; cross-checked against SERVICE.md). “Recorded pass evidence” is the `evidence` string from the recorded full-pass REST response: it states what the check read and why it passed.

Per-check status semantics, uniform across all checks unless a note says otherwise: `pass` — the declared evidence satisfies the check; `fail` — the field is present but false / invalid; `missing` — the field is absent (evidence not provided). A check whose precondition does not apply passes as not applicable — the recorded responses carry no separate not-applicable status; the `evidence` string says why it does not apply (see the noted conditional checks).

#### Section: license_files

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `root_license_present` | quality gate: root LICENSE present |  |
| `notice_file_present` | quality gate: root LICENSE + NOTICE present |  |
| `license_texts_unmodified` | skill red line: license texts kept verbatim, never edited |  |
| `source_headers_present` | source headers per house convention |  |
#### Section: dependency_compatibility

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `components_inventory_declared` | components=[{'name': 'lib-a', 'license': 'MIT', 'requires_attribution': False, 'requires_bundled_license': False}] |  |
| `dependency_scan_completed` | automated license scan of dependencies |  |
| `scan_clean_or_accepted_with_record` | quality gate: scan clean or consciously accepted with a record |  |
| `no_copyleft_in_proprietary_binary` | copyleft_components=[] distribution_model='proprietary_binary' (skill: incompatible combinations resolved before release) |  |
| `no_incompatible_dependency_shipped` | skill red line: no incompatible dependency shipped 'for now' |  |
| `attribution_shipped_where_required` | no component declares an attribution requirement | Conditional: checked only when at least one component sets `requires_attribution: true`; otherwise it passes on the components evidence (recorded full-pass evidence: “no component declares an attribution requirement”). |
| `bundled_licenses_shipped_where_required` | no bundled-licence requirement triggered | Conditional: checked only when the distribution model is a binary model and at least one component sets `requires_bundled_license: true` (recorded full-pass evidence: “no bundled-licence requirement triggered”). |
#### Section: contributor_terms

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `contributor_policy_chosen` | policy='DCO' (skill: pick a policy — DCO sign-off or CLA) |  |
| `contributor_policy_documented` | contributor policy documented in CONTRIBUTING |  |
| `contributor_policy_enforced` | contributor policy enforced in the contribution flow |  |
#### Section: claims_and_contracts

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `copyleft_choice_logged_as_decision` | project licence is not copyleft; no decision log required by this check | Conditional: a decision log is required only when `project_license` is copyleft (recorded full-pass evidence: “project licence is not copyleft; no decision log required by this check”). |
| `trademark_usage_rules_documented` | name/logo usage rules documented |  |
| `no_implied_endorsement` | no implied endorsement |  |
| `public_claims_have_attestation` | no public claims declared | Conditional: the attestation field is checked only when `public_claims.claims_made` is a non-empty list (recorded full-pass evidence: “no public claims declared”). |
| `client_contract_constraints_reviewed` | not declared as client work | Conditional: the review field is checked only when `client_work.is_client_work` is `true` (recorded full-pass evidence: “not declared as client work”). |

### Output format

The REST response (and the MCP tool's `structuredContent`) is one JSON object:

```json
{
  "service": "license-compliance-check",
  "atom_version": "0.1.0",
  "product": "TestApp",
  "distribution_model": "proprietary_binary",
  "verdict": "COMPLIANT",
  "sections": {
    "license_files": "...",
    "dependency_compatibility": "...",
    "contributor_terms": "...",
    "claims_and_contracts": "..."
  },
  "checks": [
    {
      "section": "...",
      "check": "...",
      "status": "pass|fail|missing",
      "evidence": "..."
    }
  ],
  "summary": "19 pass, 0 fail, 0 missing of 19 checks across four sections.",
  "stamp": "<human-readable text stamp of the verdict>"
}
```

Fields, in recorded order: `service`, `atom_version`, `product`, `distribution_model`, `verdict`, `sections`, `checks`, `summary`, `stamp`. `service` and `atom_version` identify the atom and its version; the subject field(s) echo your manifest; `verdict` is the headline result; `sections` maps each section to its status; `checks` is the full per-check record; `summary` counts pass / fail / missing; `stamp` is the same verdict rendered as plain text for logs and messages.

### Verdict vocabulary

**Verdicts** — every value this atom can return:

| Verdict | Meaning |
|---|---|
| `COMPLIANT` | all 19 checks pass across the four sections. |
| `NON_COMPLIANT` | at least one check fails on the declared evidence. |
| `INSUFFICIENT_EVIDENCE` | nothing fails, but at least one check is `missing` — the check names exactly which evidence to supply. |

**Section statuses** (values of the `sections` map): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks above. There is no separate not-applicable status: a check whose precondition does not apply reports `pass` with evidence stating why.

### Errors

Error shapes below are the gateway's recorded/documented shapes only (gateway call path, `rails/gateway/src/callpath.ts`, and the recorded evidence); no other payload is invented here.

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or a key that does not verify. On the MCP face the same condition returns `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the license_compliance_check scope; issue it for this atom first"}` | The key is valid but was never issued this atom's scope. On the MCP face: `{"error": "this key does not hold the license_compliance_check scope"}`. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "distribution_model", "detail": "distribution_model must be a string"}` (this atom's recorded malformed case, verbatim) | The manifest violates a declared field type; validation names the first offending `field` and the expected type in `detail`. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for license-compliance-check exceeded"}` (day form: `per-key limit 10000/day …`) | Per-key rate limit exceeded (see Rate limits). Rate-limited calls are not metered. |

### Rate limits and pricing

- **Rate limits (contract.yaml):** 60 calls per minute and 10,000 calls per day, per key, for this atom (SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing status (contract.yaml):** pricing unit is per delivered result; `pricing.rate` is `null` (rate_status: pending) — **Free during trial — rate pending.** No rate is published until the pricing protocol in `rails/billing.md` produces one.

## Explanation

Bound capability (from the bound skill): get licensing right — license choice, NOTICE/attribution, dependency compatibility, contributor terms. The check runs 19 deterministic checks across four sections: license_files, dependency_compatibility, contributor_terms, claims_and_contracts.

**How the verdict is decided.** The core is deterministic: no model call, no network, same manifest → same verdict, byte-identically (recorded determinism and MCP/REST parity checks are in TEST-REPORT.md). Each check reads declared manifest fields only, and the three-way distinction is the heart of the design: a field **absent** is *missing evidence* (`missing` check → evidence-type verdict if nothing fails); a field **present but false / invalid** is a *failure* (`fail` check → fail-type verdict); a field present and valid passes. “You didn't show me” and “you showed me and it's wrong” are different verdicts, on purpose. Section statuses roll up from their checks, and the verdict rolls up from the sections: any fail anywhere → the fail-type verdict; no fails but any missing → the evidence-type verdict; all pass → the passing verdict.

**What it does NOT do.**

- Not legal advice (the register's named doubt, printed in SERVICE.md, and stated in the atom's own MCP tool description: “A check over declared evidence, not legal advice”). It is a scan-based check over the declared manifest — it does not read your repository, your LICENSE files, or your dependency tree itself.
- Copyleft detection is the declared rule, nothing broader: a licence string starting `AGPL` or `GPL` (case-insensitive). Licence strings outside that rule are read as non-copyleft by these checks.
- It sells the check — a bounded judgment artifact — never the underlying licensing knowledge.

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this check on demand and would rather buy it per use than build or staff the capability themselves. Self-use workflow (R3, passed): product release license compliance check.

The atom sells its deliverable — the verdict/check artifact — never the underlying knowledge it is built from.

## Role views

### For integrators (Users)

Integrate one call: `POST https://atoms.pipavia.com/v1/license-compliance-check` (REST) or the MCP tool `license_compliance_check` at `POST https://atoms.pipavia.com/mcp/license-compliance-check`, with `Authorization: Bearer <key>` and the manifest object as the body/arguments. The call contract is the Input reference above — one JSON object, no fetching, no callbacks. What you get back is the Output format above: a verdict you can gate on, a per-section map, and a `checks` array whose `evidence` strings make the result auditable without a second call. Treat the fail-type verdict as “do not proceed”, the evidence-type verdict as “not yet decidable — supply the named fields”, and the passing verdict as the gate clearing. Calls are read-only and idempotent: re-submitting the same manifest returns the same verdict.

### For developers

Manifest authoring: declare facts, don't argue — each field is a factual claim about your system (see the Input reference for types, gates, and conditionals), and the atom judges exactly what you declare. Determinism is contractual: the implementation is a pure evaluation of the manifest (`src/license_compliance_check.py` in this atom's directory — `evaluate(manifest)` returning the verdict dict, with a CLI that prints JSON + the text stamp), with 16 local tests in `tests/test_license_compliance_check.py` (all passing 2026-11-15, per contract.yaml). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract rule R1), so check names and semantics here track SERVICE.md and the recorded responses, not folklore.

### For ops

Endpoints: REST `POST /v1/license-compliance-check` and MCP `POST /mcp/license-compliance-check` on https://atoms.pipavia.com (gateway v1.1.0). Auth: per-atom key scope `license_compliance_check`; watch for 401 (missing/invalid key), 403 (scope not issued), 422 (client manifest type errors — a client bug signal, not an outage), and 429 (per-key limit: 60/min, 10,000/day). Pricing: no published rate — rate pending, free during trial. Status: live — release candidate (one-week RC soak to 2026-11-22); the verification record is TEST-REPORT.md and `verification/results/license-compliance-check.json`. Support: info@pipavia.com.

### For regulators

What the verdict constitutes as evidence: a deterministic, reproducible judgment over a *declared* evidence manifest, with the per-check `evidence` strings preserved in the response itself — an auditor can re-submit the identical manifest and must receive the identical verdict (byte-identical determinism and MCP/REST parity are recorded in the verification battery). The audit trail lives in TEST-REPORT.md (independent external tester, cases and findings), `verification/work/license-compliance-check/evidence.json` (the raw recorded trial runs reproduced under Worked examples), and `verification/results/license-compliance-check.json` (the recorded verdict on that battery). Its limits are part of the evidence: the verdict is a judgment on declared evidence, not an independent inspection of the audited system, and it is **not a certification** — it attests that the declared record satisfies (or fails, or does not yet evidence) this atom's named checks, nothing more.

## Worked examples

Provenance: recorded 2026-11-15T23:50:32.222342+00:00 against gateway v1.1.0 (https://atoms.pipavia.com), external verification lane, source `verification/work/license-compliance-check/evidence.json`. Inputs are the cases' recorded `input`; responses are the REST executions' recorded `response_text`, pretty-printed (indent 2) only — the JSON values are verbatim, mechanically verified against the evidence after writing (see the checklist below).

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

```json
{
  "product": "TestApp",
  "distribution_model": "proprietary_binary",
  "project_license": "MIT",
  "license_decision": {
    "logged": false
  },
  "license_file": {
    "present": true,
    "texts_unmodified": true
  },
  "notice_file": {
    "present": true
  },
  "source_headers": {
    "present": true
  },
  "components": [
    {
      "name": "lib-a",
      "license": "MIT",
      "requires_attribution": false,
      "requires_bundled_license": false
    }
  ],
  "dependency_scan": {
    "completed": true,
    "clean": true,
    "incompatible_shipped": false
  },
  "attribution": {
    "shipped": true
  },
  "bundled_licenses": {
    "shipped": true
  },
  "contributor_terms": {
    "policy": "DCO",
    "documented_in_contributing": true,
    "enforced": true
  },
  "trademark": {
    "usage_rules_documented": true,
    "implied_endorsement": false
  },
  "public_claims": {
    "claims_made": [],
    "attestation_present": false
  },
  "client_work": {
    "is_client_work": false
  }
}
```

Response (REST):

```json
{
  "service": "license-compliance-check",
  "atom_version": "0.1.0",
  "product": "TestApp",
  "distribution_model": "proprietary_binary",
  "verdict": "COMPLIANT",
  "sections": {
    "license_files": "pass",
    "dependency_compatibility": "pass",
    "contributor_terms": "pass",
    "claims_and_contracts": "pass"
  },
  "checks": [
    {
      "section": "license_files",
      "check": "root_license_present",
      "status": "pass",
      "evidence": "quality gate: root LICENSE present"
    },
    {
      "section": "license_files",
      "check": "notice_file_present",
      "status": "pass",
      "evidence": "quality gate: root LICENSE + NOTICE present"
    },
    {
      "section": "license_files",
      "check": "license_texts_unmodified",
      "status": "pass",
      "evidence": "skill red line: license texts kept verbatim, never edited"
    },
    {
      "section": "license_files",
      "check": "source_headers_present",
      "status": "pass",
      "evidence": "source headers per house convention"
    },
    {
      "section": "dependency_compatibility",
      "check": "components_inventory_declared",
      "status": "pass",
      "evidence": "components=[{'name': 'lib-a', 'license': 'MIT', 'requires_attribution': False, 'requires_bundled_license': False}]"
    },
    {
      "section": "dependency_compatibility",
      "check": "dependency_scan_completed",
      "status": "pass",
      "evidence": "automated license scan of dependencies"
    },
    {
      "section": "dependency_compatibility",
      "check": "scan_clean_or_accepted_with_record",
      "status": "pass",
      "evidence": "quality gate: scan clean or consciously accepted with a record"
    },
    {
      "section": "dependency_compatibility",
      "check": "no_copyleft_in_proprietary_binary",
      "status": "pass",
      "evidence": "copyleft_components=[] distribution_model='proprietary_binary' (skill: incompatible combinations resolved before release)"
    },
    {
      "section": "dependency_compatibility",
      "check": "no_incompatible_dependency_shipped",
      "status": "pass",
      "evidence": "skill red line: no incompatible dependency shipped 'for now'"
    },
    {
      "section": "dependency_compatibility",
      "check": "attribution_shipped_where_required",
      "status": "pass",
      "evidence": "no component declares an attribution requirement"
    },
    {
      "section": "dependency_compatibility",
      "check": "bundled_licenses_shipped_where_required",
      "status": "pass",
      "evidence": "no bundled-licence requirement triggered"
    },
    {
      "section": "contributor_terms",
      "check": "contributor_policy_chosen",
      "status": "pass",
      "evidence": "policy='DCO' (skill: pick a policy — DCO sign-off or CLA)"
    },
    {
      "section": "contributor_terms",
      "check": "contributor_policy_documented",
      "status": "pass",
      "evidence": "contributor policy documented in CONTRIBUTING"
    },
    {
      "section": "contributor_terms",
      "check": "contributor_policy_enforced",
      "status": "pass",
      "evidence": "contributor policy enforced in the contribution flow"
    },
    {
      "section": "claims_and_contracts",
      "check": "copyleft_choice_logged_as_decision",
      "status": "pass",
      "evidence": "project licence is not copyleft; no decision log required by this check"
    },
    {
      "section": "claims_and_contracts",
      "check": "trademark_usage_rules_documented",
      "status": "pass",
      "evidence": "name/logo usage rules documented"
    },
    {
      "section": "claims_and_contracts",
      "check": "no_implied_endorsement",
      "status": "pass",
      "evidence": "no implied endorsement"
    },
    {
      "section": "claims_and_contracts",
      "check": "public_claims_have_attestation",
      "status": "pass",
      "evidence": "no public claims declared"
    },
    {
      "section": "claims_and_contracts",
      "check": "client_contract_constraints_reviewed",
      "status": "pass",
      "evidence": "not declared as client work"
    }
  ],
  "summary": "19 pass, 0 fail, 0 missing of 19 checks across four sections.",
  "stamp": "LICENSE-COMPLIANCE CHECK\nproduct: TestApp  distribution_model: proprietary_binary\nVERDICT: COMPLIANT\n  license_files              pass\n  dependency_compatibility   pass\n  contributor_terms          pass\n  claims_and_contracts       pass\n19 pass, 0 fail, 0 missing of 19 checks across four sections.\nNot legal advice — counsel decides contested calls (skill red line)."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "product": "FailApp",
  "distribution_model": "proprietary_binary",
  "project_license": "GPL-3.0",
  "license_decision": {
    "logged": false
  },
  "license_file": {
    "present": true,
    "texts_unmodified": true
  },
  "notice_file": {
    "present": true
  },
  "source_headers": {
    "present": true
  },
  "components": [
    {
      "name": "gpl-lib",
      "license": "GPL-3.0",
      "requires_attribution": true,
      "requires_bundled_license": true
    }
  ],
  "dependency_scan": {
    "completed": true,
    "clean": false,
    "incompatible_shipped": true
  },
  "attribution": {
    "shipped": false
  },
  "bundled_licenses": {
    "shipped": false
  },
  "contributor_terms": {
    "policy": "DCO",
    "documented_in_contributing": true,
    "enforced": true
  },
  "trademark": {
    "usage_rules_documented": true,
    "implied_endorsement": false
  },
  "public_claims": {
    "claims_made": [],
    "attestation_present": false
  },
  "client_work": {
    "is_client_work": false
  }
}
```

Response (REST):

```json
{
  "service": "license-compliance-check",
  "atom_version": "0.1.0",
  "product": "FailApp",
  "distribution_model": "proprietary_binary",
  "verdict": "NON_COMPLIANT",
  "sections": {
    "license_files": "pass",
    "dependency_compatibility": "fail",
    "contributor_terms": "pass",
    "claims_and_contracts": "fail"
  },
  "checks": [
    {
      "section": "license_files",
      "check": "root_license_present",
      "status": "pass",
      "evidence": "quality gate: root LICENSE present"
    },
    {
      "section": "license_files",
      "check": "notice_file_present",
      "status": "pass",
      "evidence": "quality gate: root LICENSE + NOTICE present"
    },
    {
      "section": "license_files",
      "check": "license_texts_unmodified",
      "status": "pass",
      "evidence": "skill red line: license texts kept verbatim, never edited"
    },
    {
      "section": "license_files",
      "check": "source_headers_present",
      "status": "pass",
      "evidence": "source headers per house convention"
    },
    {
      "section": "dependency_compatibility",
      "check": "components_inventory_declared",
      "status": "pass",
      "evidence": "components=[{'name': 'gpl-lib', 'license': 'GPL-3.0', 'requires_attribution': True, 'requires_bundled_license': True}]"
    },
    {
      "section": "dependency_compatibility",
      "check": "dependency_scan_completed",
      "status": "pass",
      "evidence": "automated license scan of dependencies"
    },
    {
      "section": "dependency_compatibility",
      "check": "scan_clean_or_accepted_with_record",
      "status": "fail",
      "evidence": "quality gate: scan clean or consciously accepted with a record"
    },
    {
      "section": "dependency_compatibility",
      "check": "no_copyleft_in_proprietary_binary",
      "status": "fail",
      "evidence": "copyleft_components=['gpl-lib'] distribution_model='proprietary_binary' (skill: incompatible combinations resolved before release)"
    },
    {
      "section": "dependency_compatibility",
      "check": "no_incompatible_dependency_shipped",
      "status": "fail",
      "evidence": "skill red line: no incompatible dependency shipped 'for now'"
    },
    {
      "section": "dependency_compatibility",
      "check": "attribution_shipped_where_required",
      "status": "fail",
      "evidence": "a component requires attribution; attribution must ship"
    },
    {
      "section": "dependency_compatibility",
      "check": "bundled_licenses_shipped_where_required",
      "status": "fail",
      "evidence": "release hygiene: bundled third-party licenses shipped with binaries where required"
    },
    {
      "section": "contributor_terms",
      "check": "contributor_policy_chosen",
      "status": "pass",
      "evidence": "policy='DCO' (skill: pick a policy — DCO sign-off or CLA)"
    },
    {
      "section": "contributor_terms",
      "check": "contributor_policy_documented",
      "status": "pass",
      "evidence": "contributor policy documented in CONTRIBUTING"
    },
    {
      "section": "contributor_terms",
      "check": "contributor_policy_enforced",
      "status": "pass",
      "evidence": "contributor policy enforced in the contribution flow"
    },
    {
      "section": "claims_and_contracts",
      "check": "copyleft_choice_logged_as_decision",
      "status": "fail",
      "evidence": "skill: copyleft only as a conscious product decision, logged like an ADR"
    },
    {
      "section": "claims_and_contracts",
      "check": "trademark_usage_rules_documented",
      "status": "pass",
      "evidence": "name/logo usage rules documented"
    },
    {
      "section": "claims_and_contracts",
      "check": "no_implied_endorsement",
      "status": "pass",
      "evidence": "no implied endorsement"
    },
    {
      "section": "claims_and_contracts",
      "check": "public_claims_have_attestation",
      "status": "pass",
      "evidence": "no public claims declared"
    },
    {
      "section": "claims_and_contracts",
      "check": "client_contract_constraints_reviewed",
      "status": "pass",
      "evidence": "not declared as client work"
    }
  ],
  "summary": "13 pass, 6 fail, 0 missing of 19 checks across four sections.",
  "stamp": "LICENSE-COMPLIANCE CHECK\nproduct: FailApp  distribution_model: proprietary_binary\nVERDICT: NON_COMPLIANT\n  license_files              pass\n  dependency_compatibility   fail\n  contributor_terms          pass\n  claims_and_contracts       fail\n13 pass, 6 fail, 0 missing of 19 checks across four sections.\nNot legal advice — counsel decides contested calls (skill red line)."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "product": "BadTypeApp",
  "distribution_model": 123,
  "components": "not-an-array"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "distribution_model",
  "detail": "distribution_model must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Tutorial ✓ · How-to guides ✓ · Reference ✓ · Explanation ✓ |
| Role views present | Integrators (Users) ✓ · Developers ✓ · Ops ✓ · Regulators ✓ (audit/compliance-facing atom) |
| Checks named | 19 documented / 19 recorded in the full-pass response |
| Verdict vocabulary complete | 3 verdicts + section statuses (`pass`/`fail`/`insufficient_evidence`) + per-check statuses (`pass`/`fail`/`missing`) ✓ |
| Input reference typed | 28 fields, each with a type and notes ✓ |
| Worked examples verbatim-verified | full-pass ✓ · violations ✓ · malformed ✓ — fenced JSON blocks parsed and compared as JSON values against `verification/work/license-compliance-check/evidence.json` |
