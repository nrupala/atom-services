# Electrical machinery engineering check — full documentation

**Electrical machinery engineering check** · slug `electrical-machinery-engineering-check` · deliverable type: CHECK · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (Diátaxis architecture — tutorial / how-to / reference / explanation — in CommonMark, with role views per audience). All worked examples are real recorded trial runs, reproduced verbatim (see the provenance line under Worked examples).

## Tutorial — your first call, step by step

This tutorial walks through the recorded full-pass trial run for this atom — the same run reproduced verbatim under Worked examples. You submit one JSON manifest and receive one check back.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "electrical-machinery-engineering-check"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** The manifest names the machine under review (`machine: "Motor-001"`) and declares the evidence the atom checks, field by field (the full typed field list is under Reference — Input reference). Three sizing checks are computed from declared numbers: worst-case torque 50 Nm against a 100 Nm rating, worst-case power 10 kW against 20 kW, and starting current 50 A against a 100 A supply capability — each a ratio of 0.5, so each computed check passes. Duty is declared (`constant` torque profile, 2 starts/hour, 40 °C ambient, 1000 m altitude, worst case identified), the specification names an induction machine, insulation class `F`, `TEFC` enclosure, and the acceptance-test, trending and records evidence is complete. No failure investigation is open, so the three failure-analysis checks pass as not applicable (recorded as `pass`).

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/electrical-machinery-engineering-check` with the manifest as the JSON body and your `Authorization` header. The recorded call returned HTTP 200.

**Step 4 — Read the verdict.** The response `verdict` is `SOUND` and every section — `duty`, `sizing`, `specification`, `acceptance_tests`, `failure_analysis`, `trending`, `records_and_safety` — reports `pass`. The `summary` line reconciles the run: "38 pass, 0 fail, 0 missing of 38 checks across seven sections." Each entry in `checks` names its section, the check, its status and the evidence standard it was judged against, and the response closes with a text `stamp` of the verdict you can file as-is.

**Step 5 — File or act on the result.** Keep the full JSON response (and its `stamp`) with the work it judges: it is the deliverable — one unit of sale = one delivered result. To see how the same atom responds when the evidence is not in order, compare the violations and malformed worked examples below before your first production call.

## How-to guides

### How to get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email — a sign-in link is emailed to you.
2. Open the link (it mints your session), then `POST /v1/keys` with `{"atom": "electrical-machinery-engineering-check"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/electrical-machinery-engineering-check` with the manifest as the JSON body and header `Authorization: Bearer <key>`.
4. HTTP 200 returns the deliverable JSON (see Reference — Output format). Errors are HTTP 401 / 403 / 422 / 429 (see Reference — Errors). Rate limit: 60 requests/minute and 10,000 requests/day per key.

### How to call via MCP

Call `POST https://atoms.pipavia.com/mcp/electrical-machinery-engineering-check` and invoke the tool `electrical_machinery_engineering_check` (`tools/call`), passing the manifest object as the tool arguments, with the same `Authorization: Bearer <key>` header. The MCP face returns the same deliverable core as REST — the recorded verification battery confirmed face parity: the MCP `structuredContent` is deep-equal to the REST artifact for the full-pass case (see TEST-REPORT.md).

### How to read a failing verdict and fix the manifest

A failing verdict is `NOT_SOUND`. Do not read the verdict alone — read the `checks` array:

1. Find every check with status `fail`. Its `section` tells you which part of the manifest to fix and its `evidence` states the standard it failed.
2. In the recorded violations run (Worked examples, example 2) the verdict was `NOT_SOUND` and the failing checks were: `worst_case_torque_within_rating` (section `sizing`); `no_reenergize_after_anomaly_without_review` (section `records_and_safety`).
3. Distinguish `fail` from `missing`: `fail` means you declared evidence and it does not satisfy the check — change the underlying facts or correct the declaration. `missing` means the field is absent — supply it. A response with only `missing` checks and no `fail` returns `INSUFFICIENT_EVIDENCE`, not the failing verdict.

For the computed torque failure, change the engineering, not the paperwork: select a machine whose declared rated torque covers the declared worst case (or reduce the worst-case load) and resubmit with the corrected `sizing.*` values. For the safety failure, complete the engineering review of the insulation/winding anomaly first — only then can `records.re_energized_after_insulation_or_winding_anomaly_without_review` truthfully be declared `false`. The atom's red line is the underlying act: never re-energize after an insulation or winding anomaly without review.

### How to handle a 422 `invalid_input`

A type-violating manifest is rejected before any evaluation — HTTP 422, never a verdict. The recorded malformed run for this atom returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "duty",
  "detail": "duty must be an object"
}
```

Read `field` first: it names the first offending field (`duty`), and `detail` states the expected type ("duty must be an object"). Fix that field's type in your manifest and resubmit; if the manifest has more than one type violation, the gateway reports them one at a time, so repeat until the call returns HTTP 200. The full recorded malformed request and response are Worked examples, example 3.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/electrical-machinery-engineering-check` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/electrical-machinery-engineering-check` — tool name `electrical_machinery_engineering_check`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Gateway:** https://atoms.pipavia.com, gateway version 1.1.0 at the recorded verification run.

### Input reference

The caller submits one JSON manifest. Every field below is read by the named section's checks. All fields are booleans unless a type is noted. A field **absent** = evidence missing; a field present but false / invalid = the check fails. Types are from SERVICE.md's field table; the contract and the evidence `inputSchema` corroborate them.

| Field | Type | Read by | Notes |
|---|---|---|---|
| `machine` | string | — | string; carried into the verdict output, not itself checked |
| `duty.load_torque_profile` | boolean | duty | one of `constant` / `variable` / `impact` |
| `duty.starts_per_hour` | number | duty | number |
| `duty.ambient_c` | number | duty | number |
| `duty.altitude_m` | number | duty | number |
| `duty.worst_case_identified` | boolean | duty |  |
| `sizing.worst_case_torque_nm` | number | sizing | number; computed with `sizing.rated_torque_nm` — must not exceed it |
| `sizing.rated_torque_nm` | number | sizing | number; limit for the computed torque check |
| `sizing.worst_case_power_kw` | number | sizing | number; computed with `sizing.rated_power_kw` — must not exceed it |
| `sizing.rated_power_kw` | number | sizing | number; limit for the computed power check |
| `sizing.service_factor` | number | sizing | number |
| `sizing.starting_current_a` | number | sizing | number; computed with `sizing.supply_capability_a` — must not exceed it |
| `sizing.supply_capability_a` | number | sizing | number; limit for the computed starting-current check |
| `sizing.efficiency_at_actual_load_percent` | number | sizing | number; efficiency at actual load, not nameplate |
| `specification.machine_type` | boolean | specification | one of `induction` / `synchronous` |
| `specification.insulation_class` | string | specification | non-empty string |
| `specification.enclosure` | boolean | specification | one of `TEFC` / `ODP` / `WPI` |
| `specification.bearings_specified` | boolean | specification |  |
| `specification.space_heaters_specified` | boolean | specification |  |
| `specification.rtds_specified` | boolean | specification |  |
| `specification.vibration_limits_specified` | boolean | specification |  |
| `specification.standards_cited` | boolean | specification |  |
| `tests.criteria_defined_before_tests` | boolean | acceptance_tests |  |
| `tests.criteria_from_standards_and_oem` | boolean | acceptance_tests |  |
| `tests.insulation_resistance_tested` | boolean | acceptance_tests |  |
| `tests.pi_dar_trends_recorded` | boolean | acceptance_tests |  |
| `tests.winding_resistance_balance_checked` | boolean | acceptance_tests |  |
| `tests.surge_comparison_done` | boolean | acceptance_tests |  |
| `tests.no_load_and_load_runs_done` | boolean | acceptance_tests |  |
| `tests.results_recorded_with_units` | boolean | acceptance_tests |  |
| `tests.instruments_and_calibration_recorded` | boolean | acceptance_tests |  |
| `failure.investigation_open` | boolean | failure_analysis | gates the three failure-analysis checks below |
| `failure.evidence_organized_into_timeline` | boolean | failure_analysis | required when an investigation is open; otherwise the check passes as not applicable |
| `failure.operating_history_included` | boolean | failure_analysis | required when an investigation is open; otherwise the check passes as not applicable |
| `failure.typical_failure_modes_considered` | boolean | failure_analysis | required when an investigation is open; otherwise the check passes as not applicable |
| `trending.per_asset_baseline_exists` | boolean | trending |  |
| `trending.like_for_like_comparison` | boolean | trending |  |
| `trending.deltas_compared` | boolean | trending |  |
| `records.nameplate_and_serial_verified` | boolean | records_and_safety |  |
| `records.re_energized_after_insulation_or_winding_anomaly_without_review` | boolean | records_and_safety | must be `false` to pass |
| `records.anomalies_flagged` | boolean | records_and_safety |  |
| `records.asset_records_updated` | boolean | records_and_safety |  |
| `records.deviations_logged_with_actions` | boolean | records_and_safety |  |

### Checks

The recorded full-pass REST response carries 38 checks. Every check is named below with its section and what it requires to pass (the `evidence` standard recorded in the response). Cross-checked against SERVICE.md: every recorded check corresponds to a SERVICE.md field or a computed comparison named there; gated fields in SERVICE.md fold into a single conditional check (see the semantics note).

#### Section `duty`

| Check | Requires to pass |
|---|---|
| `load_torque_profile_named` | duty first: the load torque profile is one of constant / variable / impact |
| `starts_per_hour_declared` | starts per hour declared — duty drives selection, not habit |
| `ambient_declared` | ambient temperature declared as a duty input |
| `altitude_declared` | altitude declared as a duty input |
| `worst_case_identified` | the worst case the sizing must survive is identified |
#### Section `sizing`

| Check | Requires to pass |
|---|---|
| `worst_case_torque_within_rating` | quality gate: worst-case torque documented against the selected rating — the declared worst case must not exceed the declared rating |
| `worst_case_power_within_rating` | torque and power at worst case: the declared worst-case power must not exceed the declared rated power |
| `service_factor_declared` | frame / service-factor margin: the service factor is declared |
| `starting_current_within_supply_capability` | starting current vs supply capability: the declared starting current must not exceed the declared supply capability |
| `efficiency_at_actual_load_recorded` | efficiency at actual load (not nameplate) is recorded |
#### Section `specification`

| Check | Requires to pass |
|---|---|
| `machine_type_named` | machine type is one of induction / synchronous |
| `insulation_class_named` | insulation class is named — a vague spec is rejected |
| `enclosure_named` | enclosure is one of TEFC / ODP / WPI |
| `bearings_specified` | bearings are specified |
| `space_heaters_specified` | space heaters are specified |
| `rtds_specified` | RTDs are specified |
| `vibration_limits_specified` | vibration limits are specified |
| `standards_cited` | quality gate: the spec cites standards |
#### Section `acceptance_tests`

| Check | Requires to pass |
|---|---|
| `criteria_defined_before_tests` | quality gate: test acceptance criteria defined before tests |
| `criteria_from_standards_and_oem` | acceptance criteria come FROM standards and OEM — the atom applies no threshold of its own |
| `insulation_resistance_tested` | insulation resistance tested |
| `pi_dar_trends_recorded` | insulation resistance recorded with PI / DAR trends |
| `winding_resistance_balance_checked` | winding resistance balance checked (the skill states no numeric balance tolerance, so the check is declared, not re-graded) |
| `surge_comparison_done` | surge comparison done |
| `no_load_and_load_runs_done` | no-load and load runs done |
| `results_recorded_with_units` | quality gate: results recorded with units |
| `instruments_and_calibration_recorded` | results recorded with instruments + calibration status |
#### Section `failure_analysis`

| Check | Requires to pass |
|---|---|
| `evidence_organized_into_timeline` | no failure investigation declared open |
| `operating_history_included` | no failure investigation declared open |
| `typical_failure_modes_considered` | no failure investigation declared open |
#### Section `trending`

| Check | Requires to pass |
|---|---|
| `per_asset_baseline_exists` | per-asset baselines kept |
| `like_for_like_comparison` | compare like-for-like: same test, same conditions |
| `deltas_compared` | deltas mean more than absolute values — deltas are compared |
#### Section `records_and_safety`

| Check | Requires to pass |
|---|---|
| `nameplate_and_serial_verified` | red line: nameplate / serial verified against documents — never assumed |
| `no_reenergize_after_anomaly_without_review` | red line: never re-energize after insulation or winding anomalies without engineering review |
| `anomalies_flagged` | quality gate: anomalies flagged |
| `asset_records_updated` | quality gate: asset records updated |
| `deviations_logged_with_actions` | quality gate: deviations logged with actions |

**Per-check status semantics** (recorded across the battery): `pass` — the declared evidence satisfies the check; `fail` — evidence was declared and does not satisfy the check (present-but-false, a violated must-be-`false` constraint, an out-of-enum value, or a failed computed comparison); `missing` — the field is absent, so there is no evidence to judge. There is **no separate not-applicable status in the recorded responses**: a gated (conditional) check whose gate does not apply is recorded as `pass`, with its `evidence` text stating why it does not apply (the exact wording is in each response's checks). Section statuses aggregate the same way: `pass`, `fail`, or `insufficient_evidence`.

### Output format

HTTP 200 JSON with keys: `service`, `atom_version`, `machine`, `verdict`, `sections`, `checks`, `summary`, `stamp`. `service` and `atom_version` identify the atom; the manifest's subject is carried through; `sections` maps each section to its status; `checks` is the per-check array (`section`, `check`, `status`, `evidence`); `summary` reconciles the counts in one line; `stamp` is a text rendering of the verdict. The recorded full-pass response is reproduced in full under Worked examples.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `SOUND` (verdict) | all 38 checks pass |
| `NOT_SOUND` (verdict) | any check fails |
| `INSUFFICIENT_EVIDENCE` (verdict) | nothing fails but evidence is missing |
| `pass` / `fail` / `insufficient_evidence` (section status) | the section's checks all pass / at least one fails / none fail but at least one is missing |
| `pass` / `fail` / `missing` (per-check status) | evidence satisfies the check / declared evidence does not satisfy it / field absent — no evidence to judge (gated checks that do not apply record as `pass`) |

### Errors

Only the shapes evidenced in the repo / gateway docs are documented here — no payload is invented. The 422 shape is recorded verbatim in the verification battery; the 401 / 403 / 429 codes and meanings are from USER-GUIDE.md (no response payload for them is recorded in the evidence battery).

| HTTP | Error | Shape / meaning |
|---|---|---|
| 401 | unauthenticated | missing or invalid key — send `Authorization: Bearer <key>` with a valid gateway key |
| 403 | scope | the key lacks this atom's scope — issue the key for this atom (`POST /v1/keys` with this atom's slug) |
| 422 | `invalid_input` | recorded shape: `{"ok": false, "error": "invalid_input", "field": "duty", "detail": "duty must be an object"}` — `field` names the first offending field, `detail` states the expected type; returned before any evaluation, never as a verdict |
| 429 | rate limit | per-key rate limit exceeded (60/minute, 10,000/day) — back off and retry within the limit |

### Rate limits + pricing status

- **Rate limits (contract.yaml):** 60 requests/minute per key; 10,000 requests/day per key.
- **Pricing:** pricing unit is the deliverable; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**
- **Support:** info@pipavia.com

## Explanation — what this atom does, and how the verdict is decided

Sizing is checked by three computed comparisons — worst-case torque vs rated torque, worst-case power vs rated power, starting current vs supply capability — each worst-case value must not exceed its rating. Everything else is declared-and-recorded discipline: duty declared before selection, a complete specification (type, insulation class, enclosure, bearings, space heaters, RTDs, vibration limits, standards cited), acceptance criteria defined before tests and taken from standards and OEM, and records kept with nameplate/serial verified. The failure-analysis trio is gated on `failure.investigation_open`: required when an investigation is open, otherwise passing as not applicable (recorded as `pass`).

**How the verdict is decided (deterministic core).** The atom is a deterministic evaluator over the manifest: same manifest in → same verdict out (the recorded battery confirmed byte-identical repeat responses and REST/MCP parity). Each field feeds its section's checks. The semantics are three-valued and the distinction matters: a field **absent** marks its check `missing` — missing evidence; a field **present but false / invalid** marks its check `fail` — the evidence was offered and does not satisfy the check. The verdict aggregates strictly: any `fail` → `NOT_SOUND`; otherwise any `missing` → `INSUFFICIENT_EVIDENCE`; otherwise (every check `pass`) → `SOUND`. Must-be-`false` fields invert the boolean reading: declaring them `true` is a `fail`. Conditional (gated) checks are required only when their gate field declares the situation exists; otherwise they record as `pass` (there is no separate not-applicable status in the recorded responses).

**What it does NOT do.**

- The bound skill states no numeric acceptance thresholds — no winding-balance tolerance, no insulation-resistance floor, no efficiency floor — so the atom applies none: test items are checked as declared-and-recorded against criteria from standards and OEM, never re-graded against outside standards.
- It does not test, inspect or model the machine itself; it checks the engineering manifest you declare, plus the three computed sizing comparisons over the declared numbers.
- A `SOUND` verdict means the declared engineering record is complete and internally within its declared ratings — it is not a guarantee of machine performance or remaining life.
- It sells the check — the bounded judgment artifact — never the underlying machinery-engineering knowledge itself.

**Buyer / use context.** First buyer hypothesis: teams and agents working in Electrical & energy who need this machinery engineering check on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use (internal caller, zero price, metered to the internal cost ledger): **EE motor sizing reviews**. One unit of sale = one delivered result.

## Role views

### For integrators (Users)

Integrate with two calls: `POST https://atoms.pipavia.com/v1/electrical-machinery-engineering-check` (REST) or the MCP tool `electrical_machinery_engineering_check` at `POST https://atoms.pipavia.com/mcp/electrical-machinery-engineering-check`. Authenticate with `Authorization: Bearer <key>` (key flow: How-to guides). Treat HTTP 200 as the deliverable, HTTP 422 as a client bug to fix by field name, HTTP 401/403 as key/scope problems, and HTTP 429 as back-off. Persist the full response — including `summary` and `stamp` — as the record of the judgment; re-calling with the same manifest returns the identical result, so retries are safe. Stay within 60 requests/minute and 10,000/day per key.

### For developers

Manifest authoring: build the manifest field-by-field from Reference — Input reference; respect the must-be-`false` constraints and the gated conditionals, because both invert naive boolean intuition. Determinism: the evaluator is a pure function of the manifest — no clocks, no randomness, no external lookups — so golden-file testing against the worked examples below is exact. Implementation pointers (contract.yaml): src/electrical_machinery_engineering_check.py — `evaluate(manifest)` -> verdict dict; CLI prints JSON + stamp; tests: tests/test_electrical_machinery_engineering_check.py — 18 tests, all passing 2026-11-15. The atom is bound to the `electrical-machinery-engineering` skill (R1: fixes land in the skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps).

### For ops

Endpoints: REST `POST /v1/electrical-machinery-engineering-check` and MCP `POST /mcp/electrical-machinery-engineering-check` on https://atoms.pipavia.com (gateway v1.1.0 at last verification). Key scope: per user, per atom — a key for one atom never verifies for another; scope failures surface as HTTP 403, missing/invalid keys as 401. Rate limits: 60/min and 10,000/day per key (HTTP 429 on breach). Error monitoring: alert on 422 spikes (client manifest drift), 403 (scope mis-issuance) and any 5xx (no 5xx shape is documented — none is evidenced). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing rate pending, free during trial, so metering is cost-ledger only.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:55:26.502067+00:00 against gateway v1.1.0, external verification lane, source `verification/work/electrical-machinery-engineering-check/evidence.json`. Inputs are the recorded case inputs; responses are the recorded REST executions' responses, reproduced verbatim (pretty-printed, indent 2). The sparse case from the same battery (result `INSUFFICIENT_EVIDENCE` on minimal input) is recorded in TEST-REPORT.md and the same evidence file.

### Example 1 — full-pass (HTTP 200)

Input:

```json
{
  "machine": "Motor-001",
  "duty": {
    "load_torque_profile": "constant",
    "starts_per_hour": 2,
    "ambient_c": 40,
    "altitude_m": 1000,
    "worst_case_identified": true
  },
  "sizing": {
    "worst_case_torque_nm": 50,
    "rated_torque_nm": 100,
    "worst_case_power_kw": 10,
    "rated_power_kw": 20,
    "service_factor": 1.15,
    "starting_current_a": 50,
    "supply_capability_a": 100,
    "efficiency_at_actual_load_percent": 95
  },
  "specification": {
    "machine_type": "induction",
    "insulation_class": "F",
    "enclosure": "TEFC",
    "bearings_specified": true,
    "space_heaters_specified": true,
    "rtds_specified": true,
    "vibration_limits_specified": true,
    "standards_cited": true
  },
  "tests": {
    "criteria_defined_before_tests": true,
    "criteria_from_standards_and_oem": true,
    "insulation_resistance_tested": true,
    "pi_dar_trends_recorded": true,
    "winding_resistance_balance_checked": true,
    "surge_comparison_done": true,
    "no_load_and_load_runs_done": true,
    "results_recorded_with_units": true,
    "instruments_and_calibration_recorded": true
  },
  "failure": {
    "investigation_open": false,
    "evidence_organized_into_timeline": true,
    "operating_history_included": true,
    "typical_failure_modes_considered": true
  },
  "trending": {
    "per_asset_baseline_exists": true,
    "like_for_like_comparison": true,
    "deltas_compared": true
  },
  "records": {
    "nameplate_and_serial_verified": true,
    "re_energized_after_insulation_or_winding_anomaly_without_review": false,
    "anomalies_flagged": true,
    "asset_records_updated": true,
    "deviations_logged_with_actions": true
  }
}
```

Response:

```json
{
  "service": "electrical-machinery-engineering-check",
  "atom_version": "0.1.0",
  "machine": "Motor-001",
  "verdict": "SOUND",
  "sections": {
    "duty": "pass",
    "sizing": "pass",
    "specification": "pass",
    "acceptance_tests": "pass",
    "failure_analysis": "pass",
    "trending": "pass",
    "records_and_safety": "pass"
  },
  "checks": [
    {
      "section": "duty",
      "check": "load_torque_profile_named",
      "status": "pass",
      "evidence": "duty first: the load torque profile is one of constant / variable / impact"
    },
    {
      "section": "duty",
      "check": "starts_per_hour_declared",
      "status": "pass",
      "evidence": "starts per hour declared — duty drives selection, not habit"
    },
    {
      "section": "duty",
      "check": "ambient_declared",
      "status": "pass",
      "evidence": "ambient temperature declared as a duty input"
    },
    {
      "section": "duty",
      "check": "altitude_declared",
      "status": "pass",
      "evidence": "altitude declared as a duty input"
    },
    {
      "section": "duty",
      "check": "worst_case_identified",
      "status": "pass",
      "evidence": "the worst case the sizing must survive is identified"
    },
    {
      "section": "sizing",
      "check": "worst_case_torque_within_rating",
      "status": "pass",
      "evidence": "quality gate: worst-case torque documented against the selected rating — the declared worst case must not exceed the declared rating"
    },
    {
      "section": "sizing",
      "check": "worst_case_power_within_rating",
      "status": "pass",
      "evidence": "torque and power at worst case: the declared worst-case power must not exceed the declared rated power"
    },
    {
      "section": "sizing",
      "check": "service_factor_declared",
      "status": "pass",
      "evidence": "frame / service-factor margin: the service factor is declared"
    },
    {
      "section": "sizing",
      "check": "starting_current_within_supply_capability",
      "status": "pass",
      "evidence": "starting current vs supply capability: the declared starting current must not exceed the declared supply capability"
    },
    {
      "section": "sizing",
      "check": "efficiency_at_actual_load_recorded",
      "status": "pass",
      "evidence": "efficiency at actual load (not nameplate) is recorded"
    },
    {
      "section": "specification",
      "check": "machine_type_named",
      "status": "pass",
      "evidence": "machine type is one of induction / synchronous"
    },
    {
      "section": "specification",
      "check": "insulation_class_named",
      "status": "pass",
      "evidence": "insulation class is named — a vague spec is rejected"
    },
    {
      "section": "specification",
      "check": "enclosure_named",
      "status": "pass",
      "evidence": "enclosure is one of TEFC / ODP / WPI"
    },
    {
      "section": "specification",
      "check": "bearings_specified",
      "status": "pass",
      "evidence": "bearings are specified"
    },
    {
      "section": "specification",
      "check": "space_heaters_specified",
      "status": "pass",
      "evidence": "space heaters are specified"
    },
    {
      "section": "specification",
      "check": "rtds_specified",
      "status": "pass",
      "evidence": "RTDs are specified"
    },
    {
      "section": "specification",
      "check": "vibration_limits_specified",
      "status": "pass",
      "evidence": "vibration limits are specified"
    },
    {
      "section": "specification",
      "check": "standards_cited",
      "status": "pass",
      "evidence": "quality gate: the spec cites standards"
    },
    {
      "section": "acceptance_tests",
      "check": "criteria_defined_before_tests",
      "status": "pass",
      "evidence": "quality gate: test acceptance criteria defined before tests"
    },
    {
      "section": "acceptance_tests",
      "check": "criteria_from_standards_and_oem",
      "status": "pass",
      "evidence": "acceptance criteria come FROM standards and OEM — the atom applies no threshold of its own"
    },
    {
      "section": "acceptance_tests",
      "check": "insulation_resistance_tested",
      "status": "pass",
      "evidence": "insulation resistance tested"
    },
    {
      "section": "acceptance_tests",
      "check": "pi_dar_trends_recorded",
      "status": "pass",
      "evidence": "insulation resistance recorded with PI / DAR trends"
    },
    {
      "section": "acceptance_tests",
      "check": "winding_resistance_balance_checked",
      "status": "pass",
      "evidence": "winding resistance balance checked (the skill states no numeric balance tolerance, so the check is declared, not re-graded)"
    },
    {
      "section": "acceptance_tests",
      "check": "surge_comparison_done",
      "status": "pass",
      "evidence": "surge comparison done"
    },
    {
      "section": "acceptance_tests",
      "check": "no_load_and_load_runs_done",
      "status": "pass",
      "evidence": "no-load and load runs done"
    },
    {
      "section": "acceptance_tests",
      "check": "results_recorded_with_units",
      "status": "pass",
      "evidence": "quality gate: results recorded with units"
    },
    {
      "section": "acceptance_tests",
      "check": "instruments_and_calibration_recorded",
      "status": "pass",
      "evidence": "results recorded with instruments + calibration status"
    },
    {
      "section": "failure_analysis",
      "check": "evidence_organized_into_timeline",
      "status": "pass",
      "evidence": "no failure investigation declared open"
    },
    {
      "section": "failure_analysis",
      "check": "operating_history_included",
      "status": "pass",
      "evidence": "no failure investigation declared open"
    },
    {
      "section": "failure_analysis",
      "check": "typical_failure_modes_considered",
      "status": "pass",
      "evidence": "no failure investigation declared open"
    },
    {
      "section": "trending",
      "check": "per_asset_baseline_exists",
      "status": "pass",
      "evidence": "per-asset baselines kept"
    },
    {
      "section": "trending",
      "check": "like_for_like_comparison",
      "status": "pass",
      "evidence": "compare like-for-like: same test, same conditions"
    },
    {
      "section": "trending",
      "check": "deltas_compared",
      "status": "pass",
      "evidence": "deltas mean more than absolute values — deltas are compared"
    },
    {
      "section": "records_and_safety",
      "check": "nameplate_and_serial_verified",
      "status": "pass",
      "evidence": "red line: nameplate / serial verified against documents — never assumed"
    },
    {
      "section": "records_and_safety",
      "check": "no_reenergize_after_anomaly_without_review",
      "status": "pass",
      "evidence": "red line: never re-energize after insulation or winding anomalies without engineering review"
    },
    {
      "section": "records_and_safety",
      "check": "anomalies_flagged",
      "status": "pass",
      "evidence": "quality gate: anomalies flagged"
    },
    {
      "section": "records_and_safety",
      "check": "asset_records_updated",
      "status": "pass",
      "evidence": "quality gate: asset records updated"
    },
    {
      "section": "records_and_safety",
      "check": "deviations_logged_with_actions",
      "status": "pass",
      "evidence": "quality gate: deviations logged with actions"
    }
  ],
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across seven sections.",
  "stamp": "ELECTRICAL-MACHINERY ENGINEERING CHECK\nmachine: Motor-001\nVERDICT: SOUND\n  duty                 pass\n  sizing               pass\n  specification        pass\n  acceptance_tests     pass\n  failure_analysis     pass\n  trending             pass\n  records_and_safety   pass\n38 pass, 0 fail, 0 missing of 38 checks across seven sections."
}
```

### Example 2 — violations (HTTP 200)

Input:

```json
{
  "machine": "Motor-002",
  "duty": {
    "load_torque_profile": "constant",
    "starts_per_hour": 2,
    "ambient_c": 40,
    "altitude_m": 1000,
    "worst_case_identified": true
  },
  "sizing": {
    "worst_case_torque_nm": 150,
    "rated_torque_nm": 100,
    "worst_case_power_kw": 10,
    "rated_power_kw": 20,
    "service_factor": 1.15,
    "starting_current_a": 50,
    "supply_capability_a": 100,
    "efficiency_at_actual_load_percent": 95
  },
  "specification": {
    "machine_type": "induction",
    "insulation_class": "F",
    "enclosure": "TEFC",
    "bearings_specified": true,
    "space_heaters_specified": true,
    "rtds_specified": true,
    "vibration_limits_specified": true,
    "standards_cited": true
  },
  "tests": {
    "criteria_defined_before_tests": true,
    "criteria_from_standards_and_oem": true,
    "insulation_resistance_tested": true,
    "pi_dar_trends_recorded": true,
    "winding_resistance_balance_checked": true,
    "surge_comparison_done": true,
    "no_load_and_load_runs_done": true,
    "results_recorded_with_units": true,
    "instruments_and_calibration_recorded": true
  },
  "failure": {
    "investigation_open": false,
    "evidence_organized_into_timeline": true,
    "operating_history_included": true,
    "typical_failure_modes_considered": true
  },
  "trending": {
    "per_asset_baseline_exists": true,
    "like_for_like_comparison": true,
    "deltas_compared": true
  },
  "records": {
    "nameplate_and_serial_verified": true,
    "re_energized_after_insulation_or_winding_anomaly_without_review": true,
    "anomalies_flagged": true,
    "asset_records_updated": true,
    "deviations_logged_with_actions": true
  }
}
```

Response:

```json
{
  "service": "electrical-machinery-engineering-check",
  "atom_version": "0.1.0",
  "machine": "Motor-002",
  "verdict": "NOT_SOUND",
  "sections": {
    "duty": "pass",
    "sizing": "fail",
    "specification": "pass",
    "acceptance_tests": "pass",
    "failure_analysis": "pass",
    "trending": "pass",
    "records_and_safety": "fail"
  },
  "checks": [
    {
      "section": "duty",
      "check": "load_torque_profile_named",
      "status": "pass",
      "evidence": "duty first: the load torque profile is one of constant / variable / impact"
    },
    {
      "section": "duty",
      "check": "starts_per_hour_declared",
      "status": "pass",
      "evidence": "starts per hour declared — duty drives selection, not habit"
    },
    {
      "section": "duty",
      "check": "ambient_declared",
      "status": "pass",
      "evidence": "ambient temperature declared as a duty input"
    },
    {
      "section": "duty",
      "check": "altitude_declared",
      "status": "pass",
      "evidence": "altitude declared as a duty input"
    },
    {
      "section": "duty",
      "check": "worst_case_identified",
      "status": "pass",
      "evidence": "the worst case the sizing must survive is identified"
    },
    {
      "section": "sizing",
      "check": "worst_case_torque_within_rating",
      "status": "fail",
      "evidence": "quality gate: worst-case torque documented against the selected rating — the declared worst case must not exceed the declared rating"
    },
    {
      "section": "sizing",
      "check": "worst_case_power_within_rating",
      "status": "pass",
      "evidence": "torque and power at worst case: the declared worst-case power must not exceed the declared rated power"
    },
    {
      "section": "sizing",
      "check": "service_factor_declared",
      "status": "pass",
      "evidence": "frame / service-factor margin: the service factor is declared"
    },
    {
      "section": "sizing",
      "check": "starting_current_within_supply_capability",
      "status": "pass",
      "evidence": "starting current vs supply capability: the declared starting current must not exceed the declared supply capability"
    },
    {
      "section": "sizing",
      "check": "efficiency_at_actual_load_recorded",
      "status": "pass",
      "evidence": "efficiency at actual load (not nameplate) is recorded"
    },
    {
      "section": "specification",
      "check": "machine_type_named",
      "status": "pass",
      "evidence": "machine type is one of induction / synchronous"
    },
    {
      "section": "specification",
      "check": "insulation_class_named",
      "status": "pass",
      "evidence": "insulation class is named — a vague spec is rejected"
    },
    {
      "section": "specification",
      "check": "enclosure_named",
      "status": "pass",
      "evidence": "enclosure is one of TEFC / ODP / WPI"
    },
    {
      "section": "specification",
      "check": "bearings_specified",
      "status": "pass",
      "evidence": "bearings are specified"
    },
    {
      "section": "specification",
      "check": "space_heaters_specified",
      "status": "pass",
      "evidence": "space heaters are specified"
    },
    {
      "section": "specification",
      "check": "rtds_specified",
      "status": "pass",
      "evidence": "RTDs are specified"
    },
    {
      "section": "specification",
      "check": "vibration_limits_specified",
      "status": "pass",
      "evidence": "vibration limits are specified"
    },
    {
      "section": "specification",
      "check": "standards_cited",
      "status": "pass",
      "evidence": "quality gate: the spec cites standards"
    },
    {
      "section": "acceptance_tests",
      "check": "criteria_defined_before_tests",
      "status": "pass",
      "evidence": "quality gate: test acceptance criteria defined before tests"
    },
    {
      "section": "acceptance_tests",
      "check": "criteria_from_standards_and_oem",
      "status": "pass",
      "evidence": "acceptance criteria come FROM standards and OEM — the atom applies no threshold of its own"
    },
    {
      "section": "acceptance_tests",
      "check": "insulation_resistance_tested",
      "status": "pass",
      "evidence": "insulation resistance tested"
    },
    {
      "section": "acceptance_tests",
      "check": "pi_dar_trends_recorded",
      "status": "pass",
      "evidence": "insulation resistance recorded with PI / DAR trends"
    },
    {
      "section": "acceptance_tests",
      "check": "winding_resistance_balance_checked",
      "status": "pass",
      "evidence": "winding resistance balance checked (the skill states no numeric balance tolerance, so the check is declared, not re-graded)"
    },
    {
      "section": "acceptance_tests",
      "check": "surge_comparison_done",
      "status": "pass",
      "evidence": "surge comparison done"
    },
    {
      "section": "acceptance_tests",
      "check": "no_load_and_load_runs_done",
      "status": "pass",
      "evidence": "no-load and load runs done"
    },
    {
      "section": "acceptance_tests",
      "check": "results_recorded_with_units",
      "status": "pass",
      "evidence": "quality gate: results recorded with units"
    },
    {
      "section": "acceptance_tests",
      "check": "instruments_and_calibration_recorded",
      "status": "pass",
      "evidence": "results recorded with instruments + calibration status"
    },
    {
      "section": "failure_analysis",
      "check": "evidence_organized_into_timeline",
      "status": "pass",
      "evidence": "no failure investigation declared open"
    },
    {
      "section": "failure_analysis",
      "check": "operating_history_included",
      "status": "pass",
      "evidence": "no failure investigation declared open"
    },
    {
      "section": "failure_analysis",
      "check": "typical_failure_modes_considered",
      "status": "pass",
      "evidence": "no failure investigation declared open"
    },
    {
      "section": "trending",
      "check": "per_asset_baseline_exists",
      "status": "pass",
      "evidence": "per-asset baselines kept"
    },
    {
      "section": "trending",
      "check": "like_for_like_comparison",
      "status": "pass",
      "evidence": "compare like-for-like: same test, same conditions"
    },
    {
      "section": "trending",
      "check": "deltas_compared",
      "status": "pass",
      "evidence": "deltas mean more than absolute values — deltas are compared"
    },
    {
      "section": "records_and_safety",
      "check": "nameplate_and_serial_verified",
      "status": "pass",
      "evidence": "red line: nameplate / serial verified against documents — never assumed"
    },
    {
      "section": "records_and_safety",
      "check": "no_reenergize_after_anomaly_without_review",
      "status": "fail",
      "evidence": "red line: never re-energize after insulation or winding anomalies without engineering review"
    },
    {
      "section": "records_and_safety",
      "check": "anomalies_flagged",
      "status": "pass",
      "evidence": "quality gate: anomalies flagged"
    },
    {
      "section": "records_and_safety",
      "check": "asset_records_updated",
      "status": "pass",
      "evidence": "quality gate: asset records updated"
    },
    {
      "section": "records_and_safety",
      "check": "deviations_logged_with_actions",
      "status": "pass",
      "evidence": "quality gate: deviations logged with actions"
    }
  ],
  "summary": "36 pass, 2 fail, 0 missing of 38 checks across seven sections.",
  "stamp": "ELECTRICAL-MACHINERY ENGINEERING CHECK\nmachine: Motor-002\nVERDICT: NOT_SOUND\n  duty                 pass\n  sizing               fail\n  specification        pass\n  acceptance_tests     pass\n  failure_analysis     pass\n  trending             pass\n  records_and_safety   fail\n36 pass, 2 fail, 0 missing of 38 checks across seven sections."
}
```

### Example 3 — malformed (HTTP 422)

Input:

```json
{
  "machine": "Motor-004",
  "duty": "invalid_string_instead_of_object"
}
```

Response:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "duty",
  "detail": "duty must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes · Developers Yes · Ops Yes · Regulators N/A — engineering check against caller-declared ratings and standards/OEM criteria; the verdict is an engineering judgment artifact, not regulatory compliance/audit evidence |
| Checks named vs recorded | 38 / 38 (recorded full-pass REST response) |
| Verdict vocabulary complete | Yes — `SOUND`, `NOT_SOUND`, `INSUFFICIENT_EVIDENCE`; section + per-check statuses — complete |
| Input reference typed | Yes — 43 fields with types (SERVICE.md field table) |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/electrical-machinery-engineering-check/evidence.json` |

