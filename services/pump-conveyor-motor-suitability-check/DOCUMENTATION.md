# Pump conveyor motor suitability check — full documentation

**Pump conveyor motor suitability check** · slug `pump-conveyor-motor-suitability-check` · deliverable type: CHECK · atom version 0.1.0 · status: **live — release candidate (one-week RC soak to 2026-11-22)**

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (worked example 1 below reproduces its request and response verbatim).

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the full flow is in the how-to below). Every call sends the key as `Authorization: Bearer <key>`.

**Step 2 — build the manifest.** The caller assembles one JSON manifest naming the subject in `asset` (`"PUMP-001"`) and declaring the evidence the atom checks, group by group (the input reference below lists every field and its type). In the recorded run, every checked field is supplied.

**Step 3 — call the REST endpoint.** `POST https://atoms.pipavia.com/v1/pump-conveyor-motor-suitability-check` with the manifest as the body and the `Authorization` header set.

**Step 4 — read the verdict.** The recorded response came back HTTP 200 with verdict `SUITABLE`. Its summary: "26 pass, 0 fail, 0 missing of 26 checks across six sections." Every section reports `pass` (load_and_operating_point, motor_sizing, pump_checks, conveyor_checks, baselines, interface_and_protection) and every check in the `checks` array reports `pass` — that array, with its per-check evidence strings, is the deliverable's reasoning, not decoration.

**Step 5 — trust but verify.** The same manifest submitted twice returned byte-identical REST responses, and the MCP face returned a structurally identical result — both properties are recorded in the evidence (`determinism_byte_identical`, `parity_structured_equal`). Same input in, same deliverable out.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "pump-conveyor-motor-suitability-check"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. `POST https://atoms.pipavia.com/v1/pump-conveyor-motor-suitability-check` — body = the manifest object; same `Authorization` header. HTTP 200 returns the deliverable as JSON.

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/pump-conveyor-motor-suitability-check`
- Tool name: `pump_conveyor_motor_suitability_check` — `tools/call` arguments = the manifest object (the same object you would POST to REST).
- Send the same `Authorization: Bearer <key>` header. The MCP result's structured content is the same deliverable the REST face returns (parity is recorded in the evidence).

### Read a failing verdict and fix the manifest

The recorded violations run (worked example 2) returned HTTP 200 with verdict `NOT_SUITABLE`: "23 pass, 3 fail, 0 missing of 26 checks across six sections." Read a failing response in this order:

1. **`verdict` + `summary`** — the counts tell you how many checks fail vs are missing. Fail and missing are different problems: a fail means your manifest *declares evidence against you*; missing means you *did not declare the evidence at all*.
2. **`checks` with `status: "fail"`** — in the recorded run:
   - `motor_power_covers_required_power` (section `motor_sizing`) — evidence: "motor rated power covers the declared required power for every drive — the load defines the duty"
   - `npsh_available_covers_required` (section `pump_checks`) — evidence: "NPSH margin noted — NPSH available covers NPSH required for every pump drive (cavitation destroys more than pumps)"
   - `operating_flow_covers_minimum_flow` (section `pump_checks`) — evidence: "minimum-flow protection respected — operating flow is at or above the declared minimum flow for every pump drive"
   Fix = change the underlying practice or record so the declaration becomes true, then resubmit. Editing the manifest to claim what is not true defeats the deliverable — the atom checks declared evidence, and its value is that the declaration is yours.
3. **`sections`** — a section reports `fail` when any of its checks fails, `insufficient_evidence` when nothing fails but evidence is missing, `pass` only when all its checks pass.

### Handle a 422 invalid_input

A type-violating manifest is rejected before any verdict is computed. The recorded malformed run (worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "equipment_kind",
  "detail": "equipment_kind must be a string"
}
```

Read `field` for the offending field and `detail` for the expected shape — here, `equipment_kind`: "equipment_kind must be a string". Fix the type at that field (per the input reference below) and resubmit. A 422 is never a verdict and is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/pump-conveyor-motor-suitability-check` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/pump-conveyor-motor-suitability-check` — tool name `pump_conveyor_motor_suitability_check`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Support: info@pipavia.com

### Input reference

Every field, grouped as SERVICE.md groups them, with its type. All fields are booleans unless a type is noted.

**Group: —**

| Field | Type | Notes |
|---|---|---|
| `asset` | string | carried into the verdict output, not itself checked |

**Group: `pump_checks, conveyor_checks`**

| Field | Type | Notes |
|---|---|---|
| `equipment_kind` | `"pump"` / `"conveyor"` / `"mixed"` | gates the pump and conveyor sections — the other kind's checks pass as not applicable; absent or outside this vocabulary = those checks are missing |

**Group: `load_and_operating_point`**

| Field | Type | Notes |
|---|---|---|
| `duty.curve_or_profile_read` | boolean |  |
| `duty.operating_point_documented` | boolean |  |
| `duty.operating_point_within_limits` | boolean |  |
| `duty.operating_modes_defined` | boolean |  |

**Group: `motor_sizing, pump_checks, conveyor_checks`**

| Field | Type | Notes |
|---|---|---|
| `drives[]` | list of drive entries | see below |

**Group: `motor_sizing`**

| Field | Type | Notes |
|---|---|---|
| `sizing.verified_against_curve_or_profile` | boolean |  |
| `sizing.suitable_because_it_runs_only` | must be `false` to pass — skill red line | must be `false` to pass — skill red line |

**Group: `pump_checks`**

| Field | Type | Notes |
|---|---|---|
| `pump.minimum_flow_protection_set` | binds for pump / mixed only |  |
| `pump.impeller_wear_trend_checked` | binds for pump / mixed only |  |
| `pump.vfd_soft_start_reviewed` | binds for pump / mixed only |  |

**Group: `conveyor_checks`**

| Field | Type | Notes |
|---|---|---|
| `conveyor.starting_study_considered` | binds for conveyor / mixed only |  |
| `conveyor.loaded_starts_holdback_considered` | binds for conveyor / mixed only |  |
| `conveyor.backstops_brake_interlocks_verified` | binds for conveyor / mixed only |  |
| `conveyor.sequence_interlock_review_done` | binds for conveyor / mixed only |  |
| `conveyor.belt_slip_jam_reviewed` | binds for conveyor / mixed only |  |

**Group: `baselines`**

| Field | Type | Notes |
|---|---|---|
| `baselines.recorded_per_operating_mode` | boolean |  |
| `baselines.flow_head_current_pressure_recorded` | boolean |  |
| `baselines.compared_at_same_conditions` | boolean |  |

**Group: `interface_and_protection`**

| Field | Type | Notes |
|---|---|---|
| `interface.mechanical_data_in_asset_record` | boolean |  |
| `interface.data_shared_single_source` | boolean |  |
| `interface.changes_made` | gates the revalidation check below |  |
| `interface.changes_revalidated` | required when a change is declared; otherwise the check passes as not applicable |  |
| `protection.protection_changed_without_engineering_review` | must be `false` to pass — skill red line | must be `false` to pass — skill red line |

**Group: drives[] entry (all drives)**

| Field | Type | Notes |
|---|---|---|
| `drives[].id` | string | Drive identifier. |
| `drives[].kind` | string — `"pump"` or `"conveyor"` | Selects which kind-specific computed comparisons bind for this drive. |
| `drives[].required_power_kw` | number | Declared required power; compared against the motor rating. |
| `drives[].motor_rated_power_kw` | number | Declared motor rated power. |
| `drives[].required_running_torque_nm` | number | Declared required running torque. |
| `drives[].motor_rated_torque_nm` | number | Declared motor rated torque. |

**Group: drives[] entry (pump drives)**

| Field | Type | Notes |
|---|---|---|
| `drives[].npsh_available_m` | number | Declared NPSH available. |
| `drives[].npsh_required_m` | number | Declared NPSH required. |
| `drives[].operating_flow_m3h` | number | Declared operating flow. |
| `drives[].minimum_flow_m3h` | number | Declared minimum flow. |

**Group: drives[] entry (conveyor drives)**

| Field | Type | Notes |
|---|---|---|
| `drives[].required_starting_torque_nm` | number | Declared required starting torque. |
| `drives[].motor_starting_torque_nm` | number | Declared motor starting torque. |

### Checks

Every check the atom runs — 26 in total, exactly as named in the recorded full-pass response, grouped by section. For each check: what it requires to pass (the recorded evidence text states the requirement), and the status semantics that follow the table.

**Section: `load_and_operating_point`**

| Check | Requires to pass | Notes |
|---|---|---|
| `curve_or_profile_read_before_sizing` | the load defines the duty: pump curve or conveyor profile read before sizing the motor or setting the drive |  |
| `operating_point_documented` | quality gate: operating point documented — pump curve vs system curve, or the conveyor profile |  |
| `operating_point_within_equipment_limits` | quality gate: operating point within equipment limits |  |
| `operating_modes_defined` | operating modes defined — baselines are recorded per operating mode |  |
**Section: `motor_sizing`**

| Check | Requires to pass | Notes |
|---|---|---|
| `motor_power_covers_required_power` | motor rated power covers the declared required power for every drive — the load defines the duty |  |
| `motor_torque_covers_running_torque` | motor rated torque covers the declared required running torque for every drive |  |
| `sizing_verified_against_curve_or_profile` | skill red line: verify against the curve/profile — sizing is verified, not assumed |  |
| `no_it_runs_so_sizing_is_fine` | skill red line: no "it runs, so sizing is fine" |  |
**Section: `pump_checks`**

| Check | Requires to pass | Notes |
|---|---|---|
| `npsh_available_covers_required` | NPSH margin noted — NPSH available covers NPSH required for every pump drive (cavitation destroys more than pumps) | Kind-gated: binds only for pump drives. |
| `operating_flow_covers_minimum_flow` | minimum-flow protection respected — operating flow is at or above the declared minimum flow for every pump drive | Kind-gated: binds only for pump drives. |
| `minimum_flow_protection_set` | quality gate: min-flow protection set (pumps) | Binds for pump / mixed only. |
| `impeller_wear_or_fouling_trend_checked` | impeller wear/fouling shows as head/flow loss at the same speed — trend it | Binds for pump / mixed only. |
| `vfd_and_soft_start_transients_reviewed` | VFD control (pressure/flow) reviewed for resonance and minimum speed; soft starts avoid water-hammer transients | Binds for pump / mixed only. |
**Section: `conveyor_checks`**

| Check | Requires to pass | Notes |
|---|---|---|
| `motor_starting_torque_covers_required` | no conveyor drives declared | Kind-gated: binds only for conveyor drives; with no conveyor drives declared it passes as not applicable. |
| `starting_study_considered` | no conveyor drives declared | Kind-gated (conveyor / mixed only); passes as not applicable when no conveyor drive is declared. |
| `loaded_starts_and_holdback_considered` | no conveyor drives declared | Kind-gated (conveyor / mixed only); passes as not applicable when no conveyor drive is declared. |
| `backstops_and_brake_interlocks_verified` | no conveyor drives declared | Kind-gated (conveyor / mixed only); passes as not applicable when no conveyor drive is declared. |
| `sequence_and_interlock_review_done` | no conveyor drives declared | Kind-gated (conveyor / mixed only); passes as not applicable when no conveyor drive is declared. |
| `belt_slip_vs_overload_and_jam_reviewed` | no conveyor drives declared | Kind-gated (conveyor / mixed only); passes as not applicable when no conveyor drive is declared. |
**Section: `baselines`**

| Check | Requires to pass | Notes |
|---|---|---|
| `baselines_recorded_per_mode` | quality gate: commissioning baselines recorded per mode |  |
| `flow_head_current_pressure_recorded` | record flow/head/current/pressure per operating mode at commissioning |  |
| `readings_compared_at_same_conditions` | compare later readings at the SAME conditions — deltas are the signal |  |
**Section: `interface_and_protection`**

| Check | Requires to pass | Notes |
|---|---|---|
| `mechanical_data_in_asset_record` | quality gate: mechanical data (ratios/diameters) in the asset record |  |
| `mechanical_electrical_data_single_source` | interface discipline: mechanical↔electrical data shared (coupling, ratios, sheave diameters) — one source of truth |  |
| `changes_revalidated_on_both_sides` | no interface change declared | Conditional: required only when `interface.changes_made` is true; with no interface change declared it passes as not applicable. |
| `no_protection_change_without_engineering_review` | skill red line: no protection changes (min flow, overload class) without engineering review |  |

**Per-check status semantics:** `pass` — the requirement is met on the declared evidence (a conditional check whose gate does not bind also reports `pass`, with its evidence text saying why it does not bind, e.g. "no conveyor drives declared"); `fail` — the field is present but false/invalid, a red line is crossed, or a computed comparison fails; `missing` — the field (or a value a computed check needs) is absent. There is no separate not-applicable status value in the recorded responses: not-applicable is expressed as `pass` with explanatory evidence.

### Output format

A successful call returns one JSON object. The recorded full-pass response carries these top-level keys, in order: `service`, `atom_version`, `asset`, `verdict`, `sections`, `checks`, `suitability_status`, `min_power_margin_kw`, `min_running_torque_margin_nm`, `min_npsh_margin_m`, `min_starting_torque_margin_nm`, `summary`, `stamp`. It always includes `service` and `atom_version`, the subject echo where the manifest names one, the verdict/status, a human-readable `summary`, and a text `stamp` restating the result.

Computed margins are reported as strings with exactly four decimal places (fixed rule: round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, then format with exactly four decimals; comparisons use unrounded values): `min_power_margin_kw`, `min_running_torque_margin_nm`, `min_npsh_margin_m` and `min_starting_torque_margin_nm` (each null when not applicable or not completable), plus `suitability_status`, `summary` and a text `stamp`.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `SUITABLE` | All 26 checks pass, including the five computed declared-vs-declared comparisons. |
| `NOT_SUITABLE` | At least one check fails — a declared boolean is false, a red line is crossed, or a computed comparison fails (rated value does not cover required value). |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but evidence is missing (absent fields, or kind-gated checks whose gating kind/values were not declared). |
| `suitability_status = suitable_on_declared_values` | Every applicable computed comparison could be completed and passed. |
| `suitability_status = not_suitable_on_declared_values` | At least one applicable computed comparison failed. |
| `suitability_status = null` | An applicable computed comparison could not be completed from the declared drives. |
| section status `pass` | Every check in the section passes (including not-applicable passes). |
| section status `fail` | At least one check in the section fails. |
| section status `insufficient_evidence` | No check in the section fails, but at least one is missing. |
| check status `pass` / `fail` / `missing` | See the status semantics under Checks. |

### Errors

Only the shapes evidenced in the gateway code and the recorded battery are documented here:

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | Missing, malformed, unknown or revoked key (REST face shape, from the gateway call path). |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the <namespace> scope; issue it for this atom first"}` | The key is valid but was never issued for this atom — issue it for `pump-conveyor-motor-suitability-check` and retry. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "equipment_kind", "detail": "equipment_kind must be a string"}` (recorded verbatim in worked example 3) | The manifest violates a field type; `field` and `detail` name the problem. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for pump-conveyor-motor-suitability-check exceeded"}` (a per-day variant names the 10000/day limit) | Rate limit exceeded; the call is not metered. |

### Rate limits and pricing status

- Rate limits (contract.yaml, SPEC default): **60 calls/minute and 10000 calls/day per key** for this atom.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is null and `rate_status` is pending — **Free during trial — rate pending.** Prices are set only from measured production cost per unit, per the billing protocol in the contract.

## Explanation

This atom sells its deliverable — a bounded check artifact — never the underlying knowledge itself. teams and agents working in Electrical & energy who need this check on demand and would rather buy it per use than build or staff the capability themselves. House self-use: **EE driven-equipment sizing reviews**.

**How the verdict is decided.** Deterministic core (byte-identical repeat responses and REST/MCP parity are recorded). Declared booleans feed one check each; five checks are computed from the declared `drives[]` values using only the comparisons the bound skill states: motor rated power ≥ required power and motor rated torque ≥ required running torque for every drive; for pump drives NPSH available ≥ NPSH required and operating flow ≥ declared minimum flow; for conveyor drives motor starting torque ≥ required starting torque. Equality passes — no margin or threshold is imported. `equipment_kind` gates the kind-specific sections: the other kind's checks pass as not applicable (their recorded evidence text reads "no conveyor drives declared" or the equivalent); absent or out-of-vocabulary kind leaves those checks missing. Absent field = missing; present-but-false or a failed comparison = fail.

**What it does NOT do.**

- Declared values only: it does not measure anything, read a real pump curve or conveyor profile, or verify that a declared value is true. Suitability is suitability *on the caller's declared values*.
- No affinity-law or pump-curve computation (no shaft-power figure is derived).
- No NPSH, starting-torque or overload margin thresholds — the skill requires the margin/study to be noted, never a number.
- No drive control tuning, protection setting values, or mechanical design checks; coupling/sheave/belt sizing is checked only as recorded, shared interface data.

## Role views

### For integrators (Users)

One manifest in, one deliverable out, over REST or MCP with the same key. Start with the tutorial, keep the input reference beside your manifest builder, and treat the response's verdict/status, summary and per-item detail as the product. Rate: free during trial — rate pending; limits 60/min, 10000/day per key. Support: info@pipavia.com.

### For developers

Manifest authoring: field names, groupings and types are exactly as in the input reference — a type violation is a 422 before any computation, and an absent field is a deliberate signal (missing evidence), not a default. Determinism: the core is deterministic — the recorded battery proves byte-identical repeat REST responses and REST/MCP structured parity for this atom, so golden-file testing against the worked examples below is sound. Implementation: `services/pump-conveyor-motor-suitability-check/src/pump_conveyor_motor_suitability_check.py` (Python 3, stdlib only; `evaluate(manifest)`), tests: `services/pump-conveyor-motor-suitability-check/tests/test_pump_conveyor_motor_suitability_check.py` (26 tests, per contract.yaml). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract R1 rule).

### For ops

Endpoints: REST `POST /v1/pump-conveyor-motor-suitability-check` and MCP `POST /mcp/pump-conveyor-motor-suitability-check` (tool `pump_conveyor_motor_suitability_check`) on https://atoms.pipavia.com. Key scope: per user, per atom — a key never verifies for another atom; 403 means the scope was never issued. Rate limits: 60/min, 10000/day per key (429, not metered). Error monitoring: watch the 401 (unauthorized) / 403 (scope_required) / 422 (invalid_input, with field+detail) / 429 (rate_limit) shapes in the errors table. Status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:54:36.491012+00:00 against gateway v1.1.0, external verification lane, source `verification/work/pump-conveyor-motor-suitability-check/evidence.json`. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — verified mechanically against the evidence after writing).

### Example 1 — full-pass (recorded HTTP 200)

Recorded case note: All checks pass. Computed spot checks: min_power_margin_kw=5.0000, min_npsh_margin_m=2.0000

Input:

```json
{
  "asset": "PUMP-001",
  "equipment_kind": "pump",
  "duty": {
    "curve_or_profile_read": true,
    "operating_point_documented": true,
    "operating_point_within_limits": true,
    "operating_modes_defined": true
  },
  "drives": [
    {
      "id": "D1",
      "kind": "pump",
      "required_power_kw": 10.0,
      "motor_rated_power_kw": 15.0,
      "required_running_torque_nm": 50.0,
      "motor_rated_torque_nm": 60.0,
      "npsh_available_m": 5.0,
      "npsh_required_m": 3.0,
      "operating_flow_m3h": 100.0,
      "minimum_flow_m3h": 80.0
    }
  ],
  "sizing": {
    "verified_against_curve_or_profile": true,
    "suitable_because_it_runs_only": false
  },
  "pump": {
    "minimum_flow_protection_set": true,
    "impeller_wear_trend_checked": true,
    "vfd_soft_start_reviewed": true
  },
  "baselines": {
    "recorded_per_operating_mode": true,
    "flow_head_current_pressure_recorded": true,
    "compared_at_same_conditions": true
  },
  "interface": {
    "mechanical_data_in_asset_record": true,
    "data_shared_single_source": true,
    "changes_made": false
  },
  "protection": {
    "protection_changed_without_engineering_review": false
  }
}
```

Response (REST):

```json
{
  "service": "pump-conveyor-motor-suitability-check",
  "atom_version": "0.1.0",
  "asset": "PUMP-001",
  "verdict": "SUITABLE",
  "sections": {
    "load_and_operating_point": "pass",
    "motor_sizing": "pass",
    "pump_checks": "pass",
    "conveyor_checks": "pass",
    "baselines": "pass",
    "interface_and_protection": "pass"
  },
  "checks": [
    {
      "section": "load_and_operating_point",
      "check": "curve_or_profile_read_before_sizing",
      "status": "pass",
      "evidence": "the load defines the duty: pump curve or conveyor profile read before sizing the motor or setting the drive"
    },
    {
      "section": "load_and_operating_point",
      "check": "operating_point_documented",
      "status": "pass",
      "evidence": "quality gate: operating point documented — pump curve vs system curve, or the conveyor profile"
    },
    {
      "section": "load_and_operating_point",
      "check": "operating_point_within_equipment_limits",
      "status": "pass",
      "evidence": "quality gate: operating point within equipment limits"
    },
    {
      "section": "load_and_operating_point",
      "check": "operating_modes_defined",
      "status": "pass",
      "evidence": "operating modes defined — baselines are recorded per operating mode"
    },
    {
      "section": "motor_sizing",
      "check": "motor_power_covers_required_power",
      "status": "pass",
      "evidence": "motor rated power covers the declared required power for every drive — the load defines the duty"
    },
    {
      "section": "motor_sizing",
      "check": "motor_torque_covers_running_torque",
      "status": "pass",
      "evidence": "motor rated torque covers the declared required running torque for every drive"
    },
    {
      "section": "motor_sizing",
      "check": "sizing_verified_against_curve_or_profile",
      "status": "pass",
      "evidence": "skill red line: verify against the curve/profile — sizing is verified, not assumed"
    },
    {
      "section": "motor_sizing",
      "check": "no_it_runs_so_sizing_is_fine",
      "status": "pass",
      "evidence": "skill red line: no \"it runs, so sizing is fine\""
    },
    {
      "section": "pump_checks",
      "check": "npsh_available_covers_required",
      "status": "pass",
      "evidence": "NPSH margin noted — NPSH available covers NPSH required for every pump drive (cavitation destroys more than pumps)"
    },
    {
      "section": "pump_checks",
      "check": "operating_flow_covers_minimum_flow",
      "status": "pass",
      "evidence": "minimum-flow protection respected — operating flow is at or above the declared minimum flow for every pump drive"
    },
    {
      "section": "pump_checks",
      "check": "minimum_flow_protection_set",
      "status": "pass",
      "evidence": "quality gate: min-flow protection set (pumps)"
    },
    {
      "section": "pump_checks",
      "check": "impeller_wear_or_fouling_trend_checked",
      "status": "pass",
      "evidence": "impeller wear/fouling shows as head/flow loss at the same speed — trend it"
    },
    {
      "section": "pump_checks",
      "check": "vfd_and_soft_start_transients_reviewed",
      "status": "pass",
      "evidence": "VFD control (pressure/flow) reviewed for resonance and minimum speed; soft starts avoid water-hammer transients"
    },
    {
      "section": "conveyor_checks",
      "check": "motor_starting_torque_covers_required",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "conveyor_checks",
      "check": "starting_study_considered",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "conveyor_checks",
      "check": "loaded_starts_and_holdback_considered",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "conveyor_checks",
      "check": "backstops_and_brake_interlocks_verified",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "conveyor_checks",
      "check": "sequence_and_interlock_review_done",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "conveyor_checks",
      "check": "belt_slip_vs_overload_and_jam_reviewed",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "baselines",
      "check": "baselines_recorded_per_mode",
      "status": "pass",
      "evidence": "quality gate: commissioning baselines recorded per mode"
    },
    {
      "section": "baselines",
      "check": "flow_head_current_pressure_recorded",
      "status": "pass",
      "evidence": "record flow/head/current/pressure per operating mode at commissioning"
    },
    {
      "section": "baselines",
      "check": "readings_compared_at_same_conditions",
      "status": "pass",
      "evidence": "compare later readings at the SAME conditions — deltas are the signal"
    },
    {
      "section": "interface_and_protection",
      "check": "mechanical_data_in_asset_record",
      "status": "pass",
      "evidence": "quality gate: mechanical data (ratios/diameters) in the asset record"
    },
    {
      "section": "interface_and_protection",
      "check": "mechanical_electrical_data_single_source",
      "status": "pass",
      "evidence": "interface discipline: mechanical↔electrical data shared (coupling, ratios, sheave diameters) — one source of truth"
    },
    {
      "section": "interface_and_protection",
      "check": "changes_revalidated_on_both_sides",
      "status": "pass",
      "evidence": "no interface change declared"
    },
    {
      "section": "interface_and_protection",
      "check": "no_protection_change_without_engineering_review",
      "status": "pass",
      "evidence": "skill red line: no protection changes (min flow, overload class) without engineering review"
    }
  ],
  "suitability_status": "suitable_on_declared_values",
  "min_power_margin_kw": "5.0000",
  "min_running_torque_margin_nm": "10.0000",
  "min_npsh_margin_m": "2.0000",
  "min_starting_torque_margin_nm": null,
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across six sections.",
  "stamp": "PUMP CONVEYOR MOTOR SUITABILITY CHECK\nasset: PUMP-001\nVERDICT: SUITABLE\n  load_and_operating_point  pass\n  motor_sizing              pass\n  pump_checks               pass\n  conveyor_checks           pass\n  baselines                 pass\n  interface_and_protection  pass\n26 pass, 0 fail, 0 missing of 26 checks across six sections."
}
```

### Example 2 — violations (recorded HTTP 200)

Recorded case note: Power, NPSH, and Flow requirements are violated by the drive inputs.

Input:

```json
{
  "asset": "PUMP-002",
  "equipment_kind": "pump",
  "duty": {
    "curve_or_profile_read": true,
    "operating_point_documented": true,
    "operating_point_within_limits": true,
    "operating_modes_defined": true
  },
  "drives": [
    {
      "id": "D1",
      "kind": "pump",
      "required_power_kw": 20.0,
      "motor_rated_power_kw": 15.0,
      "required_running_torque_nm": 50.0,
      "motor_rated_torque_nm": 60.0,
      "npsh_available_m": 2.0,
      "npsh_required_m": 3.0,
      "operating_flow_m3h": 70.0,
      "minimum_flow_m3h": 80.0
    }
  ],
  "sizing": {
    "verified_against_curve_or_profile": true,
    "suitable_because_it_runs_only": false
  },
  "pump": {
    "minimum_flow_protection_set": true,
    "impeller_wear_trend_checked": true,
    "vfd_soft_start_reviewed": true
  },
  "baselines": {
    "recorded_per_operating_mode": true,
    "flow_head_current_pressure_recorded": true,
    "compared_at_same_conditions": true
  },
  "interface": {
    "mechanical_data_in_asset_record": true,
    "data_shared_single_source": true,
    "changes_made": false
  },
  "protection": {
    "protection_changed_without_engineering_review": false
  }
}
```

Response (REST):

```json
{
  "service": "pump-conveyor-motor-suitability-check",
  "atom_version": "0.1.0",
  "asset": "PUMP-002",
  "verdict": "NOT_SUITABLE",
  "sections": {
    "load_and_operating_point": "pass",
    "motor_sizing": "fail",
    "pump_checks": "fail",
    "conveyor_checks": "pass",
    "baselines": "pass",
    "interface_and_protection": "pass"
  },
  "checks": [
    {
      "section": "load_and_operating_point",
      "check": "curve_or_profile_read_before_sizing",
      "status": "pass",
      "evidence": "the load defines the duty: pump curve or conveyor profile read before sizing the motor or setting the drive"
    },
    {
      "section": "load_and_operating_point",
      "check": "operating_point_documented",
      "status": "pass",
      "evidence": "quality gate: operating point documented — pump curve vs system curve, or the conveyor profile"
    },
    {
      "section": "load_and_operating_point",
      "check": "operating_point_within_equipment_limits",
      "status": "pass",
      "evidence": "quality gate: operating point within equipment limits"
    },
    {
      "section": "load_and_operating_point",
      "check": "operating_modes_defined",
      "status": "pass",
      "evidence": "operating modes defined — baselines are recorded per operating mode"
    },
    {
      "section": "motor_sizing",
      "check": "motor_power_covers_required_power",
      "status": "fail",
      "evidence": "motor rated power covers the declared required power for every drive — the load defines the duty"
    },
    {
      "section": "motor_sizing",
      "check": "motor_torque_covers_running_torque",
      "status": "pass",
      "evidence": "motor rated torque covers the declared required running torque for every drive"
    },
    {
      "section": "motor_sizing",
      "check": "sizing_verified_against_curve_or_profile",
      "status": "pass",
      "evidence": "skill red line: verify against the curve/profile — sizing is verified, not assumed"
    },
    {
      "section": "motor_sizing",
      "check": "no_it_runs_so_sizing_is_fine",
      "status": "pass",
      "evidence": "skill red line: no \"it runs, so sizing is fine\""
    },
    {
      "section": "pump_checks",
      "check": "npsh_available_covers_required",
      "status": "fail",
      "evidence": "NPSH margin noted — NPSH available covers NPSH required for every pump drive (cavitation destroys more than pumps)"
    },
    {
      "section": "pump_checks",
      "check": "operating_flow_covers_minimum_flow",
      "status": "fail",
      "evidence": "minimum-flow protection respected — operating flow is at or above the declared minimum flow for every pump drive"
    },
    {
      "section": "pump_checks",
      "check": "minimum_flow_protection_set",
      "status": "pass",
      "evidence": "quality gate: min-flow protection set (pumps)"
    },
    {
      "section": "pump_checks",
      "check": "impeller_wear_or_fouling_trend_checked",
      "status": "pass",
      "evidence": "impeller wear/fouling shows as head/flow loss at the same speed — trend it"
    },
    {
      "section": "pump_checks",
      "check": "vfd_and_soft_start_transients_reviewed",
      "status": "pass",
      "evidence": "VFD control (pressure/flow) reviewed for resonance and minimum speed; soft starts avoid water-hammer transients"
    },
    {
      "section": "conveyor_checks",
      "check": "motor_starting_torque_covers_required",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "conveyor_checks",
      "check": "starting_study_considered",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "conveyor_checks",
      "check": "loaded_starts_and_holdback_considered",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "conveyor_checks",
      "check": "backstops_and_brake_interlocks_verified",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "conveyor_checks",
      "check": "sequence_and_interlock_review_done",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "conveyor_checks",
      "check": "belt_slip_vs_overload_and_jam_reviewed",
      "status": "pass",
      "evidence": "no conveyor drives declared"
    },
    {
      "section": "baselines",
      "check": "baselines_recorded_per_mode",
      "status": "pass",
      "evidence": "quality gate: commissioning baselines recorded per mode"
    },
    {
      "section": "baselines",
      "check": "flow_head_current_pressure_recorded",
      "status": "pass",
      "evidence": "record flow/head/current/pressure per operating mode at commissioning"
    },
    {
      "section": "baselines",
      "check": "readings_compared_at_same_conditions",
      "status": "pass",
      "evidence": "compare later readings at the SAME conditions — deltas are the signal"
    },
    {
      "section": "interface_and_protection",
      "check": "mechanical_data_in_asset_record",
      "status": "pass",
      "evidence": "quality gate: mechanical data (ratios/diameters) in the asset record"
    },
    {
      "section": "interface_and_protection",
      "check": "mechanical_electrical_data_single_source",
      "status": "pass",
      "evidence": "interface discipline: mechanical↔electrical data shared (coupling, ratios, sheave diameters) — one source of truth"
    },
    {
      "section": "interface_and_protection",
      "check": "changes_revalidated_on_both_sides",
      "status": "pass",
      "evidence": "no interface change declared"
    },
    {
      "section": "interface_and_protection",
      "check": "no_protection_change_without_engineering_review",
      "status": "pass",
      "evidence": "skill red line: no protection changes (min flow, overload class) without engineering review"
    }
  ],
  "suitability_status": "not_suitable_on_declared_values",
  "min_power_margin_kw": "-5.0000",
  "min_running_torque_margin_nm": "10.0000",
  "min_npsh_margin_m": "-1.0000",
  "min_starting_torque_margin_nm": null,
  "summary": "23 pass, 3 fail, 0 missing of 26 checks across six sections.",
  "stamp": "PUMP CONVEYOR MOTOR SUITABILITY CHECK\nasset: PUMP-002\nVERDICT: NOT_SUITABLE\n  load_and_operating_point  pass\n  motor_sizing              fail\n  pump_checks               fail\n  conveyor_checks           pass\n  baselines                 pass\n  interface_and_protection  pass\n23 pass, 3 fail, 0 missing of 26 checks across six sections."
}
```

### Example 3 — malformed (recorded HTTP 422)

Recorded case note: Type mismatch for equipment_kind and duty fields triggers 422.

Input:

```json
{
  "asset": "ERR-001",
  "equipment_kind": 123,
  "duty": "invalid_string_instead_of_object"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "equipment_kind",
  "detail": "equipment_kind must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Y — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Integrators Y · Developers Y · Ops Y · Regulators N/A (electrical driven-equipment sizing check; an engineering judgment artifact, not compliance or audit evidence for a regulated domain.) |
| Checks named count vs recorded count | 26 / 26 — every check in the recorded full-pass response is documented |
| Verdict vocabulary complete | Y — 3 verdict values plus section/per-item statuses documented |
| Input reference typed | Y — 37 field rows, each with a type (SERVICE.md field table + recorded input schema) |
| Worked examples verbatim-verified | Y — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/pump-conveyor-motor-suitability-check/evidence.json` |

