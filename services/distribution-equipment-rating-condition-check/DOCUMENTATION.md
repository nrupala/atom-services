# Distribution equipment rating condition check — full documentation

**Distribution equipment rating condition check** · slug `distribution-equipment-rating-condition-check` · deliverable type: CHECK · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (Diátaxis architecture — tutorial / how-to / reference / explanation — in CommonMark, with role views per audience). All worked examples are real recorded trial runs, reproduced verbatim (see the provenance line under Worked examples).

## Tutorial — your first call, step by step

This tutorial walks through the recorded full-pass trial run for this atom — the same run reproduced verbatim under Worked examples. You submit one JSON manifest and receive one check back.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "distribution-equipment-rating-condition-check"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** The manifest names the lineup under review (`lineup: "Main-Distribution-A"`) and declares the evidence the atom checks, field by field (the full typed field list is under Reference — Input reference). Two of the 27 checks are computed from declared numbers, not declared booleans. Equipment entry `CB-01` declares an interrupting rating of 50 kA against 40 kA available fault current (a 10 kA margin) and a continuous rating of 1200 A against 1000 A load; transformer `TX-01` declares 800 kVA load on a 1000 kVA nameplate (80%), top-oil 60 °C against a declared 80 °C limit and winding 70 °C against a declared 90 °C limit, not paralleled. The remaining sections declare the MCC, switchgear, condition-awareness and coordination evidence. Because every computed comparison is within its declared rating and every declared check is satisfied, the response also reports `rating_status: within_declared_ratings`.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/distribution-equipment-rating-condition-check` with the manifest as the JSON body and your `Authorization` header. The recorded call returned HTTP 200.

**Step 4 — Read the verdict.** The response `verdict` is `RATING_CONDITION_SOUND` and every section — `ratings_vs_fault_study`, `mcc_specifics`, `switchgear_specifics`, `transformers`, `condition_awareness`, `coordination_and_safety` — reports `pass`. The `summary` line reconciles the run: "27 pass, 0 fail, 0 missing of 27 checks across six sections." Each entry in `checks` names its section, the check, its status and the evidence standard it was judged against, and the response closes with a text `stamp` of the verdict you can file as-is.

**Step 5 — File or act on the result.** Keep the full JSON response (and its `stamp`) with the work it judges: it is the deliverable — one unit of sale = one delivered result. To see how the same atom responds when the evidence is not in order, compare the violations and malformed worked examples below before your first production call.

## How-to guides

### How to get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email — a sign-in link is emailed to you.
2. Open the link (it mints your session), then `POST /v1/keys` with `{"atom": "distribution-equipment-rating-condition-check"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/distribution-equipment-rating-condition-check` with the manifest as the JSON body and header `Authorization: Bearer <key>`.
4. HTTP 200 returns the deliverable JSON (see Reference — Output format). Errors are HTTP 401 / 403 / 422 / 429 (see Reference — Errors). Rate limit: 60 requests/minute and 10,000 requests/day per key.

### How to call via MCP

Call `POST https://atoms.pipavia.com/mcp/distribution-equipment-rating-condition-check` and invoke the tool `distribution_equipment_rating_condition_check` (`tools/call`), passing the manifest object as the tool arguments, with the same `Authorization: Bearer <key>` header. The MCP face returns the same deliverable core as REST — the recorded verification battery confirmed face parity: the MCP `structuredContent` is deep-equal to the REST artifact for the full-pass case (see TEST-REPORT.md).

### How to read a failing verdict and fix the manifest

A failing verdict is `RATING_CONDITION_UNSOUND`. Do not read the verdict alone — read the `checks` array:

1. Find every check with status `fail`. Its `section` tells you which part of the manifest to fix and its `evidence` states the standard it failed.
2. In the recorded violations run (Worked examples, example 2) the verdict was `RATING_CONDITION_UNSOUND` and the failing checks were: `interrupting_rating_covers_fault_current` (section `ratings_vs_fault_study`); `continuous_current_rating_covers_load` (section `ratings_vs_fault_study`).
3. Distinguish `fail` from `missing`: `fail` means you declared evidence and it does not satisfy the check — change the underlying facts or correct the declaration. `missing` means the field is absent — supply it. A response with only `missing` checks and no `fail` returns `INSUFFICIENT_EVIDENCE`, not the failing verdict.
   The recorded violations run also carried `missing` checks — `transformer_loading_within_nameplate` (section `transformers`); `transformer_temperatures_within_declared_limits` (section `transformers`); `paralleling_requirements_match` (section `transformers`) — because the corresponding evidence lists were empty; they did not drive the verdict (the fails did), but they must be supplied before the atom can return `RATING_CONDITION_SOUND`.

The failing checks are computed, so the fix is physical, not editorial: the equipment's interrupting rating must cover the available fault current and its continuous rating must cover the load — uprate or replace the equipment, or reduce the fault level / load, until the declared values satisfy both comparisons, then resubmit with the corrected values. Note the same recorded response also shows three `missing` transformer checks because the case submitted an empty `transformers[]` list: supply the transformer entries to clear those. A `fail` is fixed by changing the equipment or the values; a `missing` is fixed by supplying the evidence.

### How to handle a 422 `invalid_input`

A type-violating manifest is rejected before any evaluation — HTTP 422, never a verdict. The recorded malformed run for this atom returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "ratings",
  "detail": "ratings must be an object"
}
```

Read `field` first: it names the first offending field (`ratings`), and `detail` states the expected type ("ratings must be an object"). Fix that field's type in your manifest and resubmit; if the manifest has more than one type violation, the gateway reports them one at a time, so repeat until the call returns HTTP 200. The full recorded malformed request and response are Worked examples, example 3.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/distribution-equipment-rating-condition-check` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/distribution-equipment-rating-condition-check` — tool name `distribution_equipment_rating_condition_check`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Gateway:** https://atoms.pipavia.com, gateway version 1.1.0 at the recorded verification run.

### Input reference

The caller submits one JSON manifest. Every field below is read by the named section's checks. All fields are booleans unless a type is noted. A field **absent** = evidence missing; a field present but false / invalid = the check fails. Types are from SERVICE.md's field table; the contract and the evidence `inputSchema` corroborate them.

| Field | Type | Read by | Notes |
|---|---|---|---|
| `lineup` | string | — | string; carried into the verdict output, not itself checked |
| `ratings.fault_study_current` | boolean | ratings_vs_fault_study |  |
| `ratings.gaps_documented` | boolean | ratings_vs_fault_study |  |
| `equipment[]` | array | ratings_vs_fault_study | list of equipment entries, see below |
| `mcc.section_bus_rating_verified` | boolean | mcc_specifics |  |
| `mcc.starter_types_recorded` | boolean | mcc_specifics |  |
| `mcc.segregation_and_barriers_verified` | boolean | mcc_specifics |  |
| `mcc.heat_load_assessed` | boolean | mcc_specifics |  |
| `mcc.planned_spare_capacity_recorded` | boolean | mcc_specifics |  |
| `mcc.labeling_matches_lineup_drawing` | boolean | mcc_specifics |  |
| `switchgear.breaker_relay_schemes_verified` | boolean | switchgear_specifics |  |
| `switchgear.ct_ratios_and_wiring_checked` | boolean | switchgear_specifics |  |
| `switchgear.trip_tests_per_plan` | boolean | switchgear_specifics |  |
| `switchgear.interlock_function_tests_done` | boolean | switchgear_specifics |  |
| `switchgear.torque_checks_per_oem` | boolean | switchgear_specifics |  |
| `transformers[]` | array | transformers | list of transformer entries, see below |
| `transformer.tap_positions_recorded` | boolean | transformers |  |
| `transformer.harmonic_rich_load` | boolean | transformers | gates the K-factor check below |
| `transformer.k_factor_assessed` | boolean | transformers | required when a harmonic-rich load is declared; otherwise the check passes as not applicable |
| `condition.oil_dga_screening_on_schedule` | boolean | condition_awareness |  |
| `condition.ir_scans_done` | boolean | condition_awareness |  |
| `condition.audible_corona_logged_vs_baseline` | boolean | condition_awareness |  |
| `coordination.settings_labels_study_aligned` | boolean | coordination_and_safety |  |
| `coordination.equipment_changed` | boolean | coordination_and_safety | gates the study-refresh check below |
| `coordination.study_refresh_flagged` | boolean | coordination_and_safety | required when equipment changed; otherwise the check passes as not applicable |
| `coordination.test_records_complete_with_instruments_and_calibration` | boolean | coordination_and_safety |  |
| `coordination.energized_work_outside_permit_system` | boolean | coordination_and_safety | must be `false` to pass |
| `equipment[].id` | string | ratings_vs_fault_study | entry identifier |
| `equipment[].interrupting_rating_ka` | number | ratings_vs_fault_study | must cover `available_fault_current_ka` |
| `equipment[].available_fault_current_ka` | number | ratings_vs_fault_study | from the current fault study |
| `equipment[].continuous_current_rating_a` | number | ratings_vs_fault_study | must cover `load_current_a` |
| `equipment[].load_current_a` | number | ratings_vs_fault_study | declared load current |
| `transformers[].id` | string | transformers | entry identifier |
| `transformers[].nameplate_kva` | number | transformers | load must not exceed it |
| `transformers[].load_kva` | number | transformers | declared load |
| `transformers[].top_oil_temp_c` | number | transformers | must not exceed `top_oil_limit_c` |
| `transformers[].top_oil_limit_c` | number | transformers | caller's declared limit — no outside standard is imported |
| `transformers[].winding_temp_c` | number | transformers | must not exceed `winding_limit_c` |
| `transformers[].winding_limit_c` | number | transformers | caller's declared limit |
| `transformers[].paralleled` | boolean | transformers | gates the matching check |
| `transformers[].vector_group_match` | boolean | transformers | required matching when paralleled |
| `transformers[].ratio_match` | boolean | transformers | required matching when paralleled |
| `transformers[].impedance_match` | boolean | transformers | required matching when paralleled |

### Checks

The recorded full-pass REST response carries 27 checks. Every check is named below with its section and what it requires to pass (the `evidence` standard recorded in the response). Cross-checked against SERVICE.md: every recorded check corresponds to a SERVICE.md field or a computed comparison named there; gated fields in SERVICE.md fold into a single conditional check (see the semantics note).

#### Section `ratings_vs_fault_study`

| Check | Requires to pass |
|---|---|
| `ratings_verified_vs_current_fault_study` | quality gate: ratings verified vs current fault study — voltage class, continuous current, interrupting rating, bus bracing — from a current short-circuit study, not memory |
| `rating_gaps_documented` | rating gaps against the fault study are documented |
| `interrupting_rating_covers_fault_current` | interrupting rating vs available fault current, from the current short-circuit study |
| `continuous_current_rating_covers_load` | continuous current rating covers the declared load current |
#### Section `mcc_specifics`

| Check | Requires to pass |
|---|---|
| `section_bus_rating_verified` | MCC section/bus rating verified |
| `starter_types_recorded` | starter types recorded (DOL/soft/VFD buckets) |
| `segregation_and_barriers_verified` | segregation and barriers verified |
| `heat_load_assessed` | heat load assessed |
| `planned_spare_capacity_recorded` | planned spare capacity recorded |
| `labeling_matches_lineup_drawing` | labeling matches the line-up drawing |
#### Section `switchgear_specifics`

| Check | Requires to pass |
|---|---|
| `breaker_relay_schemes_verified` | breaker/relay schemes verified |
| `ct_ratios_and_wiring_checked` | CT ratios + wiring checks done |
| `trip_tests_per_plan` | trip tests (primary/secondary injection per plan) done |
| `interlock_function_tests_done` | interlock function tests done |
| `torque_checks_per_oem` | torque checks per OEM — skill red line: no torque specs from memory; OEM procedures only |
#### Section `transformers`

| Check | Requires to pass |
|---|---|
| `transformer_loading_within_nameplate` | loading per nameplate — load does not exceed the nameplate rating |
| `transformer_temperatures_within_declared_limits` | top-oil and winding temperatures within the declared limits, with temperature context |
| `paralleling_requirements_match` | paralleling requires matching vector group/ratio/impedance — verify, never assume |
| `tap_positions_recorded` | quality gate: tap position recorded |
| `k_factor_assessed_for_harmonic_loads` | no harmonic-rich load declared |
#### Section `condition_awareness`

| Check | Requires to pass |
|---|---|
| `oil_dga_screening_on_schedule` | transformer oil/DGA screening on schedule |
| `ir_scans_of_terminations_and_bus_done` | IR scans of terminations/bus done |
| `audible_corona_observations_logged_vs_baseline` | audible/corona observations logged vs baseline |
#### Section `coordination_and_safety`

| Check | Requires to pass |
|---|---|
| `settings_labels_and_study_aligned` | quality gate: labels, settings, and drawings consistent — keep settings, labels, and the study aligned |
| `study_refresh_flagged_when_equipment_changes` | no equipment change declared |
| `test_records_complete_with_calibration` | quality gate: test/inspection records complete with instruments + calibration; records archived |
| `no_energized_work_outside_permit_system` | skill red line: no energized work outside the site permit/PPE system |

**Per-check status semantics** (recorded across the battery): `pass` — the declared evidence satisfies the check; `fail` — evidence was declared and does not satisfy the check (present-but-false, a violated must-be-`false` constraint, an out-of-enum value, or a failed computed comparison); `missing` — the field is absent, so there is no evidence to judge. There is **no separate not-applicable status in the recorded responses**: a gated (conditional) check whose gate does not apply is recorded as `pass`, with its `evidence` text stating why it does not apply (the exact wording is in each response's checks). Section statuses aggregate the same way: `pass`, `fail`, or `insufficient_evidence`.

### Output format

HTTP 200 JSON with keys: `service`, `atom_version`, `lineup`, `verdict`, `sections`, `checks`, `rating_status`, `summary`, `stamp`. `service` and `atom_version` identify the atom; the manifest's subject is carried through; `sections` maps each section to its status; `checks` is the per-check array (`section`, `check`, `status`, `evidence`); `summary` reconciles the counts in one line; `stamp` is a text rendering of the verdict. The recorded full-pass response is reproduced in full under Worked examples.

The response additionally carries `rating_status` — the computed rating outcome, independent of the section verdicts (see Verdict vocabulary).

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `RATING_CONDITION_SOUND` (verdict) | all 27 checks pass |
| `RATING_CONDITION_UNSOUND` (verdict) | any check fails |
| `INSUFFICIENT_EVIDENCE` (verdict) | nothing fails but evidence is missing |
| `within_declared_ratings` (`rating_status`) | every computed comparison is within its declared rating |
| `exceeded` (`rating_status`) | at least one computed comparison exceeds its declared rating |
| `null` (`rating_status`) | a computed comparison cannot be completed (evidence absent) |
| `pass` / `fail` / `insufficient_evidence` (section status) | the section's checks all pass / at least one fails / none fail but at least one is missing |
| `pass` / `fail` / `missing` (per-check status) | evidence satisfies the check / declared evidence does not satisfy it / field absent — no evidence to judge (gated checks that do not apply record as `pass`) |

### Errors

Only the shapes evidenced in the repo / gateway docs are documented here — no payload is invented. The 422 shape is recorded verbatim in the verification battery; the 401 / 403 / 429 codes and meanings are from USER-GUIDE.md (no response payload for them is recorded in the evidence battery).

| HTTP | Error | Shape / meaning |
|---|---|---|
| 401 | unauthenticated | missing or invalid key — send `Authorization: Bearer <key>` with a valid gateway key |
| 403 | scope | the key lacks this atom's scope — issue the key for this atom (`POST /v1/keys` with this atom's slug) |
| 422 | `invalid_input` | recorded shape: `{"ok": false, "error": "invalid_input", "field": "ratings", "detail": "ratings must be an object"}` — `field` names the first offending field, `detail` states the expected type; returned before any evaluation, never as a verdict |
| 429 | rate limit | per-key rate limit exceeded (60/minute, 10,000/day) — back off and retry within the limit |

### Rate limits + pricing status

- **Rate limits (contract.yaml):** 60 requests/minute per key; 10,000 requests/day per key.
- **Pricing:** pricing unit is the deliverable; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**
- **Support:** info@pipavia.com

## Explanation — what this atom does, and how the verdict is decided

Five checks are computed from declared values using only the comparisons the bound skill itself states: interrupting rating must cover available fault current; continuous rating must cover load current; transformer load must not exceed nameplate; top-oil and winding temperatures must not exceed their declared limits; and a transformer declared paralleled requires matching vector group, ratio and impedance. The temperature limits are the caller's declared limits — no outside standard is imported. Two checks are gated: the K-factor check is required only when a harmonic-rich load is declared, and the study-refresh check only when equipment changed; when a gate does not apply the check passes as not applicable (recorded as `pass`). The computed comparisons also produce `rating_status` independently of the section verdicts.

**How the verdict is decided (deterministic core).** The atom is a deterministic evaluator over the manifest: same manifest in → same verdict out (the recorded battery confirmed byte-identical repeat responses and REST/MCP parity). Each field feeds its section's checks. The semantics are three-valued and the distinction matters: a field **absent** marks its check `missing` — missing evidence; a field **present but false / invalid** marks its check `fail` — the evidence was offered and does not satisfy the check. The verdict aggregates strictly: any `fail` → `RATING_CONDITION_UNSOUND`; otherwise any `missing` → `INSUFFICIENT_EVIDENCE`; otherwise (every check `pass`) → `RATING_CONDITION_SOUND`. Must-be-`false` fields invert the boolean reading: declaring them `true` is a `fail`. Conditional (gated) checks are required only when their gate field declares the situation exists; otherwise they record as `pass` (there is no separate not-applicable status in the recorded responses).

**What it does NOT do.**

- It does not perform a fault study, inspect equipment, or carry out field tests — it checks the evidence manifest and the declared values you submit.
- It imports no outside rating standard: transformer temperature limits and all other thresholds are the caller's declared limits, exactly as submitted.
- Declared booleans are taken as declared; the atom cannot verify that a trip test or torque check physically happened.
- It sells the check — the bounded judgment artifact — never the underlying distribution-engineering knowledge itself.

**Buyer / use context.** First buyer hypothesis: teams and agents working in Electrical & energy who need this rating-and-condition check on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use (internal caller, zero price, metered to the internal cost ledger): **EE consulting equipment reviews**. One unit of sale = one delivered result.

## Role views

### For integrators (Users)

Integrate with two calls: `POST https://atoms.pipavia.com/v1/distribution-equipment-rating-condition-check` (REST) or the MCP tool `distribution_equipment_rating_condition_check` at `POST https://atoms.pipavia.com/mcp/distribution-equipment-rating-condition-check`. Authenticate with `Authorization: Bearer <key>` (key flow: How-to guides). Treat HTTP 200 as the deliverable, HTTP 422 as a client bug to fix by field name, HTTP 401/403 as key/scope problems, and HTTP 429 as back-off. Persist the full response — including `summary` and `stamp` — as the record of the judgment; re-calling with the same manifest returns the identical result, so retries are safe. Stay within 60 requests/minute and 10,000/day per key.

### For developers

Manifest authoring: build the manifest field-by-field from Reference — Input reference; respect the must-be-`false` constraints and the gated conditionals, because both invert naive boolean intuition. Determinism: the evaluator is a pure function of the manifest — no clocks, no randomness, no external lookups — so golden-file testing against the worked examples below is exact. Implementation pointers (contract.yaml): src/distribution_equipment_rating_condition_check.py — `evaluate(manifest)` -> verdict dict; CLI prints JSON + stamp; tests: tests/test_distribution_equipment_rating_condition_check.py — 18 tests, all passing 2026-11-15. The atom is bound to the `power-distribution-equipment` skill (R1: fixes land in the skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps).

### For ops

Endpoints: REST `POST /v1/distribution-equipment-rating-condition-check` and MCP `POST /mcp/distribution-equipment-rating-condition-check` on https://atoms.pipavia.com (gateway v1.1.0 at last verification). Key scope: per user, per atom — a key for one atom never verifies for another; scope failures surface as HTTP 403, missing/invalid keys as 401. Rate limits: 60/min and 10,000/day per key (HTTP 429 on breach). Error monitoring: alert on 422 spikes (client manifest drift), 403 (scope mis-issuance) and any 5xx (no 5xx shape is documented — none is evidenced). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing rate pending, free during trial, so metering is cost-ledger only.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:53:55.491375+00:00 against gateway v1.1.0, external verification lane, source `verification/work/distribution-equipment-rating-condition-check/evidence.json`. Inputs are the recorded case inputs; responses are the recorded REST executions' responses, reproduced verbatim (pretty-printed, indent 2). The sparse case from the same battery (result `INSUFFICIENT_EVIDENCE` on minimal input) is recorded in TEST-REPORT.md and the same evidence file.

### Example 1 — full-pass (HTTP 200)

Input:

```json
{
  "lineup": "Main-Distribution-A",
  "ratings": {
    "fault_study_current": true,
    "gaps_documented": true
  },
  "mcc": {
    "section_bus_rating_verified": true,
    "starter_types_recorded": true,
    "segregation_and_barriers_verified": true,
    "heat_load_assessed": true,
    "planned_spare_capacity_recorded": true,
    "labeling_matches_lineup_drawing": true
  },
  "switchgear": {
    "breaker_relay_schemes_verified": true,
    "ct_ratios_and_wiring_checked": true,
    "trip_tests_per_plan": true,
    "interlock_function_tests_done": true,
    "torque_checks_per_oem": true
  },
  "transformers": [
    {
      "id": "TX-01",
      "nameplate_kva": 1000,
      "load_kva": 800,
      "top_oil_temp_c": 60,
      "top_oil_limit_c": 80,
      "winding_temp_c": 70,
      "winding_limit_c": 90,
      "paralleled": false,
      "vector_group_match": true,
      "ratio_match": true,
      "impedance_match": true
    }
  ],
  "transformer": {
    "tap_positions_recorded": true,
    "harmonic_rich_load": false
  },
  "condition": {
    "oil_dga_screening_on_schedule": true,
    "ir_scans_done": true,
    "audible_corona_logged_vs_baseline": true
  },
  "coordination": {
    "settings_labels_study_aligned": true,
    "equipment_changed": false,
    "test_records_complete_with_instruments_and_calibration": true,
    "energized_work_outside_permit_system": false
  },
  "equipment": [
    {
      "id": "CB-01",
      "interrupting_rating_ka": 50,
      "available_fault_current_ka": 40,
      "continuous_current_rating_a": 1200,
      "load_current_a": 1000
    }
  ]
}
```

Response:

```json
{
  "service": "distribution-equipment-rating-condition-check",
  "atom_version": "0.1.0",
  "lineup": "Main-Distribution-A",
  "verdict": "RATING_CONDITION_SOUND",
  "sections": {
    "ratings_vs_fault_study": "pass",
    "mcc_specifics": "pass",
    "switchgear_specifics": "pass",
    "transformers": "pass",
    "condition_awareness": "pass",
    "coordination_and_safety": "pass"
  },
  "checks": [
    {
      "section": "ratings_vs_fault_study",
      "check": "ratings_verified_vs_current_fault_study",
      "status": "pass",
      "evidence": "quality gate: ratings verified vs current fault study — voltage class, continuous current, interrupting rating, bus bracing — from a current short-circuit study, not memory"
    },
    {
      "section": "ratings_vs_fault_study",
      "check": "rating_gaps_documented",
      "status": "pass",
      "evidence": "rating gaps against the fault study are documented"
    },
    {
      "section": "ratings_vs_fault_study",
      "check": "interrupting_rating_covers_fault_current",
      "status": "pass",
      "evidence": "interrupting rating vs available fault current, from the current short-circuit study"
    },
    {
      "section": "ratings_vs_fault_study",
      "check": "continuous_current_rating_covers_load",
      "status": "pass",
      "evidence": "continuous current rating covers the declared load current"
    },
    {
      "section": "mcc_specifics",
      "check": "section_bus_rating_verified",
      "status": "pass",
      "evidence": "MCC section/bus rating verified"
    },
    {
      "section": "mcc_specifics",
      "check": "starter_types_recorded",
      "status": "pass",
      "evidence": "starter types recorded (DOL/soft/VFD buckets)"
    },
    {
      "section": "mcc_specifics",
      "check": "segregation_and_barriers_verified",
      "status": "pass",
      "evidence": "segregation and barriers verified"
    },
    {
      "section": "mcc_specifics",
      "check": "heat_load_assessed",
      "status": "pass",
      "evidence": "heat load assessed"
    },
    {
      "section": "mcc_specifics",
      "check": "planned_spare_capacity_recorded",
      "status": "pass",
      "evidence": "planned spare capacity recorded"
    },
    {
      "section": "mcc_specifics",
      "check": "labeling_matches_lineup_drawing",
      "status": "pass",
      "evidence": "labeling matches the line-up drawing"
    },
    {
      "section": "switchgear_specifics",
      "check": "breaker_relay_schemes_verified",
      "status": "pass",
      "evidence": "breaker/relay schemes verified"
    },
    {
      "section": "switchgear_specifics",
      "check": "ct_ratios_and_wiring_checked",
      "status": "pass",
      "evidence": "CT ratios + wiring checks done"
    },
    {
      "section": "switchgear_specifics",
      "check": "trip_tests_per_plan",
      "status": "pass",
      "evidence": "trip tests (primary/secondary injection per plan) done"
    },
    {
      "section": "switchgear_specifics",
      "check": "interlock_function_tests_done",
      "status": "pass",
      "evidence": "interlock function tests done"
    },
    {
      "section": "switchgear_specifics",
      "check": "torque_checks_per_oem",
      "status": "pass",
      "evidence": "torque checks per OEM — skill red line: no torque specs from memory; OEM procedures only"
    },
    {
      "section": "transformers",
      "check": "transformer_loading_within_nameplate",
      "status": "pass",
      "evidence": "loading per nameplate — load does not exceed the nameplate rating"
    },
    {
      "section": "transformers",
      "check": "transformer_temperatures_within_declared_limits",
      "status": "pass",
      "evidence": "top-oil and winding temperatures within the declared limits, with temperature context"
    },
    {
      "section": "transformers",
      "check": "paralleling_requirements_match",
      "status": "pass",
      "evidence": "paralleling requires matching vector group/ratio/impedance — verify, never assume"
    },
    {
      "section": "transformers",
      "check": "tap_positions_recorded",
      "status": "pass",
      "evidence": "quality gate: tap position recorded"
    },
    {
      "section": "transformers",
      "check": "k_factor_assessed_for_harmonic_loads",
      "status": "pass",
      "evidence": "no harmonic-rich load declared"
    },
    {
      "section": "condition_awareness",
      "check": "oil_dga_screening_on_schedule",
      "status": "pass",
      "evidence": "transformer oil/DGA screening on schedule"
    },
    {
      "section": "condition_awareness",
      "check": "ir_scans_of_terminations_and_bus_done",
      "status": "pass",
      "evidence": "IR scans of terminations/bus done"
    },
    {
      "section": "condition_awareness",
      "check": "audible_corona_observations_logged_vs_baseline",
      "status": "pass",
      "evidence": "audible/corona observations logged vs baseline"
    },
    {
      "section": "coordination_and_safety",
      "check": "settings_labels_and_study_aligned",
      "status": "pass",
      "evidence": "quality gate: labels, settings, and drawings consistent — keep settings, labels, and the study aligned"
    },
    {
      "section": "coordination_and_safety",
      "check": "study_refresh_flagged_when_equipment_changes",
      "status": "pass",
      "evidence": "no equipment change declared"
    },
    {
      "section": "coordination_and_safety",
      "check": "test_records_complete_with_calibration",
      "status": "pass",
      "evidence": "quality gate: test/inspection records complete with instruments + calibration; records archived"
    },
    {
      "section": "coordination_and_safety",
      "check": "no_energized_work_outside_permit_system",
      "status": "pass",
      "evidence": "skill red line: no energized work outside the site permit/PPE system"
    }
  ],
  "rating_status": "within_declared_ratings",
  "summary": "27 pass, 0 fail, 0 missing of 27 checks across six sections.",
  "stamp": "DISTRIBUTION EQUIPMENT RATING CONDITION CHECK\nlineup: Main-Distribution-A\nVERDICT: RATING_CONDITION_SOUND\n  ratings_vs_fault_study   pass\n  mcc_specifics            pass\n  switchgear_specifics     pass\n  transformers             pass\n  condition_awareness      pass\n  coordination_and_safety  pass\n27 pass, 0 fail, 0 missing of 27 checks across six sections."
}
```

### Example 2 — violations (HTTP 200)

Input:

```json
{
  "ratings": {
    "fault_study_current": true,
    "gaps_documented": true
  },
  "mcc": {
    "section_bus_rating_verified": true,
    "starter_types_recorded": true,
    "segregation_and_barriers_verified": true,
    "heat_load_assessed": true,
    "planned_spare_capacity_recorded": true,
    "labeling_matches_lineup_drawing": true
  },
  "switchgear": {
    "breaker_relay_schemes_verified": true,
    "ct_ratios_and_wiring_checked": true,
    "trip_tests_per_plan": true,
    "interlock_function_tests_done": true,
    "torque_checks_per_oem": true
  },
  "transformers": [],
  "transformer": {
    "tap_positions_recorded": true,
    "harmonic_rich_load": false
  },
  "condition": {
    "oil_dga_screening_on_schedule": true,
    "ir_scans_done": true,
    "audible_corona_logged_vs_baseline": true
  },
  "coordination": {
    "settings_labels_study_aligned": true,
    "equipment_changed": false,
    "test_records_complete_with_instruments_and_calibration": true,
    "energized_work_outside_permit_system": false
  },
  "equipment": [
    {
      "id": "CB-FAIL",
      "interrupting_rating_ka": 10,
      "available_fault_current_ka": 20,
      "continuous_current_rating_a": 100,
      "load_current_a": 150
    }
  ]
}
```

Response:

```json
{
  "service": "distribution-equipment-rating-condition-check",
  "atom_version": "0.1.0",
  "lineup": null,
  "verdict": "RATING_CONDITION_UNSOUND",
  "sections": {
    "ratings_vs_fault_study": "fail",
    "mcc_specifics": "pass",
    "switchgear_specifics": "pass",
    "transformers": "insufficient_evidence",
    "condition_awareness": "pass",
    "coordination_and_safety": "pass"
  },
  "checks": [
    {
      "section": "ratings_vs_fault_study",
      "check": "ratings_verified_vs_current_fault_study",
      "status": "pass",
      "evidence": "quality gate: ratings verified vs current fault study — voltage class, continuous current, interrupting rating, bus bracing — from a current short-circuit study, not memory"
    },
    {
      "section": "ratings_vs_fault_study",
      "check": "rating_gaps_documented",
      "status": "pass",
      "evidence": "rating gaps against the fault study are documented"
    },
    {
      "section": "ratings_vs_fault_study",
      "check": "interrupting_rating_covers_fault_current",
      "status": "fail",
      "evidence": "interrupting rating vs available fault current, from the current short-circuit study"
    },
    {
      "section": "ratings_vs_fault_study",
      "check": "continuous_current_rating_covers_load",
      "status": "fail",
      "evidence": "continuous current rating covers the declared load current"
    },
    {
      "section": "mcc_specifics",
      "check": "section_bus_rating_verified",
      "status": "pass",
      "evidence": "MCC section/bus rating verified"
    },
    {
      "section": "mcc_specifics",
      "check": "starter_types_recorded",
      "status": "pass",
      "evidence": "starter types recorded (DOL/soft/VFD buckets)"
    },
    {
      "section": "mcc_specifics",
      "check": "segregation_and_barriers_verified",
      "status": "pass",
      "evidence": "segregation and barriers verified"
    },
    {
      "section": "mcc_specifics",
      "check": "heat_load_assessed",
      "status": "pass",
      "evidence": "heat load assessed"
    },
    {
      "section": "mcc_specifics",
      "check": "planned_spare_capacity_recorded",
      "status": "pass",
      "evidence": "planned spare capacity recorded"
    },
    {
      "section": "mcc_specifics",
      "check": "labeling_matches_lineup_drawing",
      "status": "pass",
      "evidence": "labeling matches the line-up drawing"
    },
    {
      "section": "switchgear_specifics",
      "check": "breaker_relay_schemes_verified",
      "status": "pass",
      "evidence": "breaker/relay schemes verified"
    },
    {
      "section": "switchgear_specifics",
      "check": "ct_ratios_and_wiring_checked",
      "status": "pass",
      "evidence": "CT ratios + wiring checks done"
    },
    {
      "section": "switchgear_specifics",
      "check": "trip_tests_per_plan",
      "status": "pass",
      "evidence": "trip tests (primary/secondary injection per plan) done"
    },
    {
      "section": "switchgear_specifics",
      "check": "interlock_function_tests_done",
      "status": "pass",
      "evidence": "interlock function tests done"
    },
    {
      "section": "switchgear_specifics",
      "check": "torque_checks_per_oem",
      "status": "pass",
      "evidence": "torque checks per OEM — skill red line: no torque specs from memory; OEM procedures only"
    },
    {
      "section": "transformers",
      "check": "transformer_loading_within_nameplate",
      "status": "missing",
      "evidence": "no transformers declared"
    },
    {
      "section": "transformers",
      "check": "transformer_temperatures_within_declared_limits",
      "status": "missing",
      "evidence": "no transformers declared"
    },
    {
      "section": "transformers",
      "check": "paralleling_requirements_match",
      "status": "missing",
      "evidence": "no transformers declared"
    },
    {
      "section": "transformers",
      "check": "tap_positions_recorded",
      "status": "pass",
      "evidence": "quality gate: tap position recorded"
    },
    {
      "section": "transformers",
      "check": "k_factor_assessed_for_harmonic_loads",
      "status": "pass",
      "evidence": "no harmonic-rich load declared"
    },
    {
      "section": "condition_awareness",
      "check": "oil_dga_screening_on_schedule",
      "status": "pass",
      "evidence": "transformer oil/DGA screening on schedule"
    },
    {
      "section": "condition_awareness",
      "check": "ir_scans_of_terminations_and_bus_done",
      "status": "pass",
      "evidence": "IR scans of terminations/bus done"
    },
    {
      "section": "condition_awareness",
      "check": "audible_corona_observations_logged_vs_baseline",
      "status": "pass",
      "evidence": "audible/corona observations logged vs baseline"
    },
    {
      "section": "coordination_and_safety",
      "check": "settings_labels_and_study_aligned",
      "status": "pass",
      "evidence": "quality gate: labels, settings, and drawings consistent — keep settings, labels, and the study aligned"
    },
    {
      "section": "coordination_and_safety",
      "check": "study_refresh_flagged_when_equipment_changes",
      "status": "pass",
      "evidence": "no equipment change declared"
    },
    {
      "section": "coordination_and_safety",
      "check": "test_records_complete_with_calibration",
      "status": "pass",
      "evidence": "quality gate: test/inspection records complete with instruments + calibration; records archived"
    },
    {
      "section": "coordination_and_safety",
      "check": "no_energized_work_outside_permit_system",
      "status": "pass",
      "evidence": "skill red line: no energized work outside the site permit/PPE system"
    }
  ],
  "rating_status": "exceeded",
  "summary": "22 pass, 2 fail, 3 missing of 27 checks across six sections.",
  "stamp": "DISTRIBUTION EQUIPMENT RATING CONDITION CHECK\nlineup: None\nVERDICT: RATING_CONDITION_UNSOUND\n  ratings_vs_fault_study   fail\n  mcc_specifics            pass\n  switchgear_specifics     pass\n  transformers             insufficient_evidence\n  condition_awareness      pass\n  coordination_and_safety  pass\n22 pass, 2 fail, 3 missing of 27 checks across six sections."
}
```

### Example 3 — malformed (HTTP 422)

Input:

```json
{
  "lineup": "Malformed-Input",
  "ratings": "invalid_string_instead_of_object"
}
```

Response:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "ratings",
  "detail": "ratings must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes · Developers Yes · Ops Yes · Regulators N/A — engineering rating check against caller-declared limits; the verdict is an engineering judgment artifact, not regulatory compliance/audit evidence |
| Checks named vs recorded | 27 / 27 (recorded full-pass REST response) |
| Verdict vocabulary complete | Yes — `RATING_CONDITION_SOUND`, `RATING_CONDITION_UNSOUND`, `INSUFFICIENT_EVIDENCE`; `rating_status` `within_declared_ratings` / `exceeded` / `null`; section + per-check statuses — complete |
| Input reference typed | Yes — 43 fields with types (SERVICE.md field table) |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/distribution-equipment-rating-condition-check/evidence.json` |

