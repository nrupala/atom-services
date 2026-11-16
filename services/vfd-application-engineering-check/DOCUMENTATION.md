# Vfd application engineering check — full documentation

**Vfd application engineering check** · slug `vfd-application-engineering-check` · deliverable type: CHECK · atom version 0.1.0 · status: **live — release candidate (one-week RC soak to 2026-11-22)**

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (worked example 1 below reproduces its request and response verbatim).

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the full flow is in the how-to below). Every call sends the key as `Authorization: Bearer <key>`.

**Step 2 — build the manifest.** The caller assembles one JSON manifest naming the subject in `asset` (`"VFD-001"`) and declaring the evidence the atom checks, group by group (the input reference below lists every field and its type). In the recorded run, every checked field is supplied.

**Step 3 — call the REST endpoint.** `POST https://atoms.pipavia.com/v1/vfd-application-engineering-check` with the manifest as the body and the `Authorization` header set.

**Step 4 — read the verdict.** The recorded response came back HTTP 200 with verdict `SOUND`. Its summary: "37 pass, 0 fail, 0 missing of 37 checks across seven sections." Every section reports `pass` (application_profile, power_quality, motor_cable_drive, protection_and_control, commissioning, troubleshooting, records_and_red_lines) and every check in the `checks` array reports `pass` — that array, with its per-check evidence strings, is the deliverable's reasoning, not decoration.

**Step 5 — trust but verify.** The same manifest submitted twice returned byte-identical REST responses, and the MCP face returned a structurally identical result — both properties are recorded in the evidence (`determinism_byte_identical`, `parity_structured_equal`). Same input in, same deliverable out.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "vfd-application-engineering-check"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. `POST https://atoms.pipavia.com/v1/vfd-application-engineering-check` — body = the manifest object; same `Authorization` header. HTTP 200 returns the deliverable as JSON.

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/vfd-application-engineering-check`
- Tool name: `vfd_application_engineering_check` — `tools/call` arguments = the manifest object (the same object you would POST to REST).
- Send the same `Authorization: Bearer <key>` header. The MCP result's structured content is the same deliverable the REST face returns (parity is recorded in the evidence).

### Read a failing verdict and fix the manifest

The recorded violations run (worked example 2) returned HTTP 200 with verdict `NOT_SOUND`: "32 pass, 5 fail, 0 missing of 37 checks across seven sections." Read a failing response in this order:

1. **`verdict` + `summary`** — the counts tell you how many checks fail vs are missing. Fail and missing are different problems: a fail means your manifest *declares evidence against you*; missing means you *did not declare the evidence at all*.
2. **`checks` with `status: "fail"`** — in the recorded run:
   - `harmonics_within_declared_site_limit` (section `power_quality`) — evidence: "IEEE 519-style limits per site standard: the declared harmonic distortion must not exceed the declared site limit (the limit is the caller's site standard — this atom supplies no number)"
   - `cable_length_within_oem_limit` (section `motor_cable_drive`) — evidence: "quality gate: lead length within drive limits (documented) — the declared cable length must not exceed the declared OEM maximum lead length (respect OEM limits)"
   - `derated_current_covers_required_load_current` (section `motor_cable_drive`) — evidence: "select to duty: the declared derated drive current must cover the declared required load current (both currents are caller-declared — this atom supplies no derating factor)"
   - `no_hipot_on_drive_output` (section `records_and_red_lines`) — evidence: "skill red line: never hi-pot drive output terminals (drive killer); isolate electronics before insulation tests"
   - `no_protection_bypass_without_documented_approval` (section `records_and_red_lines`) — evidence: "skill red line: never bypass drive protections to "keep running" without documented engineering approval"
   Fix = change the underlying practice or record so the declaration becomes true, then resubmit. Editing the manifest to claim what is not true defeats the deliverable — the atom checks declared evidence, and its value is that the declaration is yours.
3. **`sections`** — a section reports `fail` when any of its checks fails, `insufficient_evidence` when nothing fails but evidence is missing, `pass` only when all its checks pass.

### Handle a 422 invalid_input

A type-violating manifest is rejected before any verdict is computed. The recorded malformed run (worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "application.starts_per_hour",
  "detail": "application.starts_per_hour must be a number"
}
```

Read `field` for the offending field and `detail` for the expected shape — here, `application.starts_per_hour`: "application.starts_per_hour must be a number". Fix the type at that field (per the input reference below) and resubmit. A 422 is never a verdict and is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/vfd-application-engineering-check` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/vfd-application-engineering-check` — tool name `vfd_application_engineering_check`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Support: info@pipavia.com

### Input reference

Every field, grouped as SERVICE.md groups them, with its type. All fields are booleans unless a type is noted.

**Group: —**

| Field | Type | Notes |
|---|---|---|
| `asset` | string | carried into the verdict output, not itself checked |

**Group: `application_profile`**

| Field | Type | Notes |
|---|---|---|
| `application.load_torque_type` | `"variable"` / `"constant"` — the skill's own vocabulary | `"variable"` / `"constant"` — the skill's own vocabulary |
| `application.overload_duty_declared` | boolean |  |
| `application.speed_range_declared` | boolean |  |
| `application.starts_per_hour` | number | number |
| `application.environment_declared` | boolean |  |
| `application.selected_to_duty` | boolean |  |

**Group: `power_quality`**

| Field | Type | Notes |
|---|---|---|
| `power_quality.harmonic_impact_estimated` | boolean |  |
| `power_quality.harmonic_distortion_percent` | number | computed against the site limit below |
| `power_quality.site_limit_percent` | number | the caller's declared site standard |
| `power_quality.mitigation_declared` | boolean |  |
| `power_quality.capacitor_bank_interaction_reviewed` | boolean |  |
| `power_quality.harmonics_per_site_standard` | boolean |  |

**Group: `motor_cable_drive`**

| Field | Type | Notes |
|---|---|---|
| `cable.cable_length_m` | number | computed against the OEM limit below |
| `cable.oem_max_lead_length_m` | number | the declared OEM maximum lead length |
| `cable.motor_insulation_within_drive_limits` | boolean |  |
| `cable.dvdt_reflected_wave_reviewed` | boolean |  |
| `cable.inverter_duty_motor_assessed` | boolean |  |
| `cable.shaft_bearing_protection_reviewed` | boolean |  |
| `drive.derated_current_a` | number | computed against the required current below |
| `drive.required_load_current_a` | number | number |

**Group: `protection_and_control`**

| Field | Type | Notes |
|---|---|---|
| `protection.overload_model_configured` | boolean |  |
| `protection.ground_fault_configured` | boolean |  |
| `protection.over_under_voltage_configured` | boolean |  |
| `protection.stall_configured` | boolean |  |
| `protection.bypass_philosophy_documented` | boolean |  |
| `protection.estop_interlocks_verified` | boolean |  |

**Group: `commissioning`**

| Field | Type | Notes |
|---|---|---|
| `commissioning.parameter_sheet_completed_archived` | boolean |  |
| `commissioning.motor_id_run_done` | boolean |  |
| `commissioning.protections_tested_logically` | boolean |  |
| `commissioning.ramps_limits_setpoints_documented` | boolean |  |
| `commissioning.baseline_trends_recorded` | boolean |  |

**Group: `troubleshooting`**

| Field | Type | Notes |
|---|---|---|
| `troubleshooting.open` | gates the four checks below; absent = those checks are missing, `false` = they pass as not applicable |  |
| `troubleshooting.fault_log_reviewed_first` | binds only while troubleshooting is open |  |
| `troubleshooting.typical_fault_causes_cross_checked` | binds only while open |  |
| `troubleshooting.mechanical_causes_cross_checked` | binds only while open |  |
| `troubleshooting.findings_documented` | binds only while open |  |

**Group: `records_and_red_lines`**

| Field | Type | Notes |
|---|---|---|
| `records.parameter_backup_archived` | boolean |  |
| `records.commissioning_sheet_archived` | boolean |  |
| `records.firmware_version` | non-empty string |  |
| `records.hipot_performed_on_drive_output` | must be `false` to pass — skill red line | must be `false` to pass — skill red line |
| `records.protections_bypassed_without_documented_approval` | must be `false` to pass — skill red line | must be `false` to pass — skill red line |

### Checks

Every check the atom runs — 37 in total, exactly as named in the recorded full-pass response, grouped by section. For each check: what it requires to pass (the recorded evidence text states the requirement), and the status semantics that follow the table.

**Section: `application_profile`**

| Check | Requires to pass | Notes |
|---|---|---|
| `load_torque_type_named` | application profile: load torque type is one of variable / constant torque |  |
| `overload_duty_declared` | overload duty declared — select to duty, not to marketing tables |  |
| `speed_range_declared` | speed range declared as an application-profile input |  |
| `starts_per_hour_declared` | starts/hour declared as an application-profile input |  |
| `environment_declared` | environment declared as an application-profile input |  |
| `selected_to_duty_not_marketing` | drive selected to duty, not to marketing tables |  |
**Section: `power_quality`**

| Check | Requires to pass | Notes |
|---|---|---|
| `harmonic_impact_estimated` | harmonic impact estimated |  |
| `harmonics_within_declared_site_limit` | IEEE 519-style limits per site standard: the declared harmonic distortion must not exceed the declared site limit (the limit is the caller's site standard — this atom supplies no number) | Computed: declared `power_quality.harmonic_distortion_percent` must not exceed declared `power_quality.site_limit_percent`; equality passes. |
| `mitigation_declared` | mitigation declared — line reactors / DC chokes / filters; multi-pulse or active front end where justified |  |
| `capacitor_bank_interaction_reviewed` | capacitor-bank interactions / detuning checked |  |
| `harmonics_addressed_per_site_standard` | quality gate: harmonics addressed per site standard |  |
**Section: `motor_cable_drive`**

| Check | Requires to pass | Notes |
|---|---|---|
| `cable_length_within_oem_limit` | quality gate: lead length within drive limits (documented) — the declared cable length must not exceed the declared OEM maximum lead length (respect OEM limits) | Computed: declared `cable.cable_length_m` must not exceed declared `cable.oem_max_lead_length_m`; equality passes. |
| `motor_insulation_within_drive_limits` | quality gate: motor insulation system within drive limits (documented) |  |
| `dvdt_reflected_wave_reviewed` | reflected wave / dv-dt vs lead length reviewed (the skill states no dv/dt number, so the review is declared, not re-graded) |  |
| `inverter_duty_motor_assessed` | inverter-duty motors for long leads / high switching assessed |  |
| `shaft_voltage_bearing_protection_reviewed` | shaft voltage & bearing currents reviewed — shaft grounding / bearing protection on larger frames |  |
| `derated_current_covers_required_load_current` | select to duty: the declared derated drive current must cover the declared required load current (both currents are caller-declared — this atom supplies no derating factor) | Computed: declared `drive.derated_current_a` must cover declared `drive.required_load_current_a`; equality passes. |
**Section: `protection_and_control`**

| Check | Requires to pass | Notes |
|---|---|---|
| `overload_model_configured` | internal protection configured: overload model |  |
| `ground_fault_protection_configured` | internal protection configured: ground fault |  |
| `over_under_voltage_protection_configured` | internal protection configured: over/under voltage |  |
| `stall_protection_configured` | internal protection configured: stall |  |
| `bypass_philosophy_documented` | bypass philosophy documented |  |
| `estop_and_interlocks_verified` | quality gate: e-stop & interlock design per site standards — never softened for convenience; e-stops verified |  |
**Section: `commissioning`**

| Check | Requires to pass | Notes |
|---|---|---|
| `parameter_sheet_completed_and_archived` | parameter sheet completed and archived (motor data, limits, ramps, setpoints) |  |
| `motor_id_run_done` | motor ID run done |  |
| `protections_tested_not_just_set` | quality gate: protection settings tested, not just set — each protection tested logically |  |
| `ramps_limits_setpoints_documented` | limits, ramps and setpoints documented on the parameter sheet |  |
| `baseline_trends_recorded` | baseline current / DC-bus / temperature trends recorded |  |
**Section: `troubleshooting`**

| Check | Requires to pass | Notes |
|---|---|---|
| `fault_log_reviewed_first` | no troubleshooting declared open | Conditional: binds only while `troubleshooting.open` is true; when troubleshooting is not declared open it passes as not applicable, and when `troubleshooting.open` is absent it is missing. |
| `typical_fault_causes_cross_checked` | no troubleshooting declared open | Conditional: binds only while troubleshooting is open (same semantics as above). |
| `mechanical_load_causes_cross_checked` | no troubleshooting declared open | Conditional: binds only while troubleshooting is open (same semantics as above). |
| `findings_documented` | no troubleshooting declared open | Conditional: binds only while troubleshooting is open (same semantics as above). |
**Section: `records_and_red_lines`**

| Check | Requires to pass | Notes |
|---|---|---|
| `parameter_backup_archived` | records: parameter backups archived per drive |  |
| `commissioning_sheet_archived` | quality gate: commissioning sheet + parameter backup archived |  |
| `firmware_version_noted` | firmware version noted in the records |  |
| `no_hipot_on_drive_output` | skill red line: never hi-pot drive output terminals (drive killer); isolate electronics before insulation tests |  |
| `no_protection_bypass_without_documented_approval` | skill red line: never bypass drive protections to "keep running" without documented engineering approval |  |

**Per-check status semantics:** `pass` — the requirement is met on the declared evidence (a conditional check whose gate does not bind also reports `pass`, with its evidence text saying why it does not bind, e.g. "no conveyor drives declared"); `fail` — the field is present but false/invalid, a red line is crossed, or a computed comparison fails; `missing` — the field (or a value a computed check needs) is absent. There is no separate not-applicable status value in the recorded responses: not-applicable is expressed as `pass` with explanatory evidence.

### Output format

A successful call returns one JSON object. The recorded full-pass response carries these top-level keys, in order: `service`, `atom_version`, `asset`, `verdict`, `sections`, `checks`, `engineering_status`, `harmonic_margin_percent`, `cable_margin_m`, `current_margin_a`, `summary`, `stamp`. It always includes `service` and `atom_version`, the subject echo where the manifest names one, the verdict/status, a human-readable `summary`, and a text `stamp` restating the result.

Computed margins are reported as strings with exactly four decimal places (fixed round-half-up rule; comparisons use unrounded values): `harmonic_margin_percent`, `cable_margin_m`, `current_margin_a` (each null when not completable), plus `engineering_status`, a `summary` and a text `stamp`.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `SOUND` | All 37 checks pass, including the three computed declared-vs-declared comparisons. |
| `NOT_SOUND` | At least one check fails — a declared boolean is false, a red line is crossed (hi-pot on drive output, protection bypass without documented approval), or a computed comparison fails (distortion over the declared site limit, cable over the declared OEM limit, derated current below required load current). |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but evidence is missing (absent fields, or a computed comparison whose declared values were not both supplied). |
| `engineering_status = sound_on_declared_values / not_sound_on_declared_values / null` | Derived from the three computed comparisons; null when an applicable comparison cannot be completed. |
| section status `pass` | Every check in the section passes (including not-applicable passes). |
| section status `fail` | At least one check in the section fails. |
| section status `insufficient_evidence` | No check in the section fails, but at least one is missing. |
| check status `pass` / `fail` / `missing` | See the status semantics under Checks. |

### Errors

Only the shapes evidenced in the gateway code and the recorded battery are documented here:

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | Missing, malformed, unknown or revoked key (REST face shape, from the gateway call path). |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the <namespace> scope; issue it for this atom first"}` | The key is valid but was never issued for this atom — issue it for `vfd-application-engineering-check` and retry. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "application.starts_per_hour", "detail": "application.starts_per_hour must be a number"}` (recorded verbatim in worked example 3) | The manifest violates a field type; `field` and `detail` name the problem. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for vfd-application-engineering-check exceeded"}` (a per-day variant names the 10000/day limit) | Rate limit exceeded; the call is not metered. |

### Rate limits and pricing status

- Rate limits (contract.yaml, SPEC default): **60 calls/minute and 10000 calls/day per key** for this atom.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is null and `rate_status` is pending — **Free during trial — rate pending.** Prices are set only from measured production cost per unit, per the billing protocol in the contract.

## Explanation

This atom sells its deliverable — a bounded check artifact — never the underlying knowledge itself. teams and agents working in Electrical & energy who need this check on demand and would rather buy it per use than build or staff the capability themselves. House self-use: **EE drive application reviews**.

**How the verdict is decided.** Deterministic core (byte-identical repeats and REST/MCP parity recorded). Most checks read one declared boolean each. Three checks are computed from the declared values, using only the comparisons the bound skill states: declared harmonic distortion must not exceed the declared site limit (IEEE 519-style limits *per site standard* — the limit is the caller's; the atom supplies no number); declared cable length must not exceed the declared OEM maximum lead length; and declared derated drive current must cover the declared required load current. Equality passes on all three. The four troubleshooting checks are conditional: they bind only while `troubleshooting.open` is true — absent leaves them missing, false makes them pass as not applicable. Absent = missing; present-but-false or a failed comparison = fail.

**What it does NOT do.**

- Declared values only: it does not measure anything, estimate harmonics from a real supply, or verify that a declared value is true. Soundness is soundness *on the caller's declared values*.
- No harmonic limit value is supplied (the limit must be declared by the caller, per site standard).
- No dv/dt or reflected-wave threshold (the skill states none — the review is checked as declared evidence).
- No derating factor (both currents are caller-declared).
- No torque/speed computation (profile inputs are checked as declared evidence).
- No protection setting values, drive tuning, or troubleshooting diagnosis.

## Role views

### For integrators (Users)

One manifest in, one deliverable out, over REST or MCP with the same key. Start with the tutorial, keep the input reference beside your manifest builder, and treat the response's verdict/status, summary and per-item detail as the product. Rate: free during trial — rate pending; limits 60/min, 10000/day per key. Support: info@pipavia.com.

### For developers

Manifest authoring: field names, groupings and types are exactly as in the input reference — a type violation is a 422 before any computation, and an absent field is a deliberate signal (missing evidence), not a default. Determinism: the core is deterministic — the recorded battery proves byte-identical repeat REST responses and REST/MCP structured parity for this atom, so golden-file testing against the worked examples below is sound. Implementation: `services/vfd-application-engineering-check/src/vfd_application_engineering_check.py` (Python 3, stdlib only; `evaluate(manifest)`), tests: `services/vfd-application-engineering-check/tests/test_vfd_application_engineering_check.py` (29 tests, per contract.yaml). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract R1 rule).

### For ops

Endpoints: REST `POST /v1/vfd-application-engineering-check` and MCP `POST /mcp/vfd-application-engineering-check` (tool `vfd_application_engineering_check`) on https://atoms.pipavia.com. Key scope: per user, per atom — a key never verifies for another atom; 403 means the scope was never issued. Rate limits: 60/min, 10000/day per key (429, not metered). Error monitoring: watch the 401 (unauthorized) / 403 (scope_required) / 422 (invalid_input, with field+detail) / 429 (rate_limit) shapes in the errors table. Status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:52:43.798032+00:00 against gateway v1.1.0, external verification lane, source `verification/work/vfd-application-engineering-check/evidence.json`. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — verified mechanically against the evidence after writing).

### Example 1 — full-pass (recorded HTTP 200)

Recorded case note: All fields present and valid. Computed margins: harmonic_margin_percent=1.5000, cable_margin_m=50.0000, current_margin_a=10.0000.

Input:

```json
{
  "asset": "VFD-001",
  "application": {
    "load_torque_type": "variable",
    "overload_duty_declared": true,
    "speed_range_declared": true,
    "starts_per_hour": 2,
    "environment_declared": true,
    "selected_to_duty": true
  },
  "power_quality": {
    "harmonic_impact_estimated": true,
    "harmonic_distortion_percent": 3.5,
    "site_limit_percent": 5.0,
    "mitigation_declared": true,
    "capacitor_bank_interaction_reviewed": true,
    "harmonics_per_site_standard": true
  },
  "cable": {
    "cable_length_m": 50.0,
    "oem_max_lead_length_m": 100.0,
    "motor_insulation_within_drive_limits": true,
    "dvdt_reflected_wave_reviewed": true,
    "inverter_duty_motor_assessed": true,
    "shaft_bearing_protection_reviewed": true
  },
  "drive": {
    "derated_current_a": 100.0,
    "required_load_current_a": 90.0
  },
  "protection": {
    "overload_model_configured": true,
    "ground_fault_configured": true,
    "over_under_voltage_configured": true,
    "stall_configured": true,
    "bypass_philosophy_documented": true,
    "estop_interlocks_verified": true
  },
  "commissioning": {
    "parameter_sheet_completed_archived": true,
    "motor_id_run_done": true,
    "protections_tested_logically": true,
    "ramps_limits_setpoints_documented": true,
    "baseline_trends_recorded": true
  },
  "troubleshooting": {
    "open": false
  },
  "records": {
    "parameter_backup_archived": true,
    "commissioning_sheet_archived": true,
    "firmware_version": "v1.2.3",
    "hipot_performed_on_drive_output": false,
    "protections_bypassed_without_documented_approval": false
  }
}
```

Response (REST):

```json
{
  "service": "vfd-application-engineering-check",
  "atom_version": "0.1.0",
  "asset": "VFD-001",
  "verdict": "SOUND",
  "sections": {
    "application_profile": "pass",
    "power_quality": "pass",
    "motor_cable_drive": "pass",
    "protection_and_control": "pass",
    "commissioning": "pass",
    "troubleshooting": "pass",
    "records_and_red_lines": "pass"
  },
  "checks": [
    {
      "section": "application_profile",
      "check": "load_torque_type_named",
      "status": "pass",
      "evidence": "application profile: load torque type is one of variable / constant torque"
    },
    {
      "section": "application_profile",
      "check": "overload_duty_declared",
      "status": "pass",
      "evidence": "overload duty declared — select to duty, not to marketing tables"
    },
    {
      "section": "application_profile",
      "check": "speed_range_declared",
      "status": "pass",
      "evidence": "speed range declared as an application-profile input"
    },
    {
      "section": "application_profile",
      "check": "starts_per_hour_declared",
      "status": "pass",
      "evidence": "starts/hour declared as an application-profile input"
    },
    {
      "section": "application_profile",
      "check": "environment_declared",
      "status": "pass",
      "evidence": "environment declared as an application-profile input"
    },
    {
      "section": "application_profile",
      "check": "selected_to_duty_not_marketing",
      "status": "pass",
      "evidence": "drive selected to duty, not to marketing tables"
    },
    {
      "section": "power_quality",
      "check": "harmonic_impact_estimated",
      "status": "pass",
      "evidence": "harmonic impact estimated"
    },
    {
      "section": "power_quality",
      "check": "harmonics_within_declared_site_limit",
      "status": "pass",
      "evidence": "IEEE 519-style limits per site standard: the declared harmonic distortion must not exceed the declared site limit (the limit is the caller's site standard — this atom supplies no number)"
    },
    {
      "section": "power_quality",
      "check": "mitigation_declared",
      "status": "pass",
      "evidence": "mitigation declared — line reactors / DC chokes / filters; multi-pulse or active front end where justified"
    },
    {
      "section": "power_quality",
      "check": "capacitor_bank_interaction_reviewed",
      "status": "pass",
      "evidence": "capacitor-bank interactions / detuning checked"
    },
    {
      "section": "power_quality",
      "check": "harmonics_addressed_per_site_standard",
      "status": "pass",
      "evidence": "quality gate: harmonics addressed per site standard"
    },
    {
      "section": "motor_cable_drive",
      "check": "cable_length_within_oem_limit",
      "status": "pass",
      "evidence": "quality gate: lead length within drive limits (documented) — the declared cable length must not exceed the declared OEM maximum lead length (respect OEM limits)"
    },
    {
      "section": "motor_cable_drive",
      "check": "motor_insulation_within_drive_limits",
      "status": "pass",
      "evidence": "quality gate: motor insulation system within drive limits (documented)"
    },
    {
      "section": "motor_cable_drive",
      "check": "dvdt_reflected_wave_reviewed",
      "status": "pass",
      "evidence": "reflected wave / dv-dt vs lead length reviewed (the skill states no dv/dt number, so the review is declared, not re-graded)"
    },
    {
      "section": "motor_cable_drive",
      "check": "inverter_duty_motor_assessed",
      "status": "pass",
      "evidence": "inverter-duty motors for long leads / high switching assessed"
    },
    {
      "section": "motor_cable_drive",
      "check": "shaft_voltage_bearing_protection_reviewed",
      "status": "pass",
      "evidence": "shaft voltage & bearing currents reviewed — shaft grounding / bearing protection on larger frames"
    },
    {
      "section": "motor_cable_drive",
      "check": "derated_current_covers_required_load_current",
      "status": "pass",
      "evidence": "select to duty: the declared derated drive current must cover the declared required load current (both currents are caller-declared — this atom supplies no derating factor)"
    },
    {
      "section": "protection_and_control",
      "check": "overload_model_configured",
      "status": "pass",
      "evidence": "internal protection configured: overload model"
    },
    {
      "section": "protection_and_control",
      "check": "ground_fault_protection_configured",
      "status": "pass",
      "evidence": "internal protection configured: ground fault"
    },
    {
      "section": "protection_and_control",
      "check": "over_under_voltage_protection_configured",
      "status": "pass",
      "evidence": "internal protection configured: over/under voltage"
    },
    {
      "section": "protection_and_control",
      "check": "stall_protection_configured",
      "status": "pass",
      "evidence": "internal protection configured: stall"
    },
    {
      "section": "protection_and_control",
      "check": "bypass_philosophy_documented",
      "status": "pass",
      "evidence": "bypass philosophy documented"
    },
    {
      "section": "protection_and_control",
      "check": "estop_and_interlocks_verified",
      "status": "pass",
      "evidence": "quality gate: e-stop & interlock design per site standards — never softened for convenience; e-stops verified"
    },
    {
      "section": "commissioning",
      "check": "parameter_sheet_completed_and_archived",
      "status": "pass",
      "evidence": "parameter sheet completed and archived (motor data, limits, ramps, setpoints)"
    },
    {
      "section": "commissioning",
      "check": "motor_id_run_done",
      "status": "pass",
      "evidence": "motor ID run done"
    },
    {
      "section": "commissioning",
      "check": "protections_tested_not_just_set",
      "status": "pass",
      "evidence": "quality gate: protection settings tested, not just set — each protection tested logically"
    },
    {
      "section": "commissioning",
      "check": "ramps_limits_setpoints_documented",
      "status": "pass",
      "evidence": "limits, ramps and setpoints documented on the parameter sheet"
    },
    {
      "section": "commissioning",
      "check": "baseline_trends_recorded",
      "status": "pass",
      "evidence": "baseline current / DC-bus / temperature trends recorded"
    },
    {
      "section": "troubleshooting",
      "check": "fault_log_reviewed_first",
      "status": "pass",
      "evidence": "no troubleshooting declared open"
    },
    {
      "section": "troubleshooting",
      "check": "typical_fault_causes_cross_checked",
      "status": "pass",
      "evidence": "no troubleshooting declared open"
    },
    {
      "section": "troubleshooting",
      "check": "mechanical_load_causes_cross_checked",
      "status": "pass",
      "evidence": "no troubleshooting declared open"
    },
    {
      "section": "troubleshooting",
      "check": "findings_documented",
      "status": "pass",
      "evidence": "no troubleshooting declared open"
    },
    {
      "section": "records_and_red_lines",
      "check": "parameter_backup_archived",
      "status": "pass",
      "evidence": "records: parameter backups archived per drive"
    },
    {
      "section": "records_and_red_lines",
      "check": "commissioning_sheet_archived",
      "status": "pass",
      "evidence": "quality gate: commissioning sheet + parameter backup archived"
    },
    {
      "section": "records_and_red_lines",
      "check": "firmware_version_noted",
      "status": "pass",
      "evidence": "firmware version noted in the records"
    },
    {
      "section": "records_and_red_lines",
      "check": "no_hipot_on_drive_output",
      "status": "pass",
      "evidence": "skill red line: never hi-pot drive output terminals (drive killer); isolate electronics before insulation tests"
    },
    {
      "section": "records_and_red_lines",
      "check": "no_protection_bypass_without_documented_approval",
      "status": "pass",
      "evidence": "skill red line: never bypass drive protections to \"keep running\" without documented engineering approval"
    }
  ],
  "engineering_status": "sound_on_declared_values",
  "harmonic_margin_percent": "1.5000",
  "cable_margin_m": "50.0000",
  "current_margin_a": "10.0000",
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across seven sections.",
  "stamp": "VFD APPLICATION ENGINEERING CHECK\nasset: VFD-001\nVERDICT: SOUND\n  application_profile       pass\n  power_quality             pass\n  motor_cable_drive         pass\n  protection_and_control    pass\n  commissioning             pass\n  troubleshooting           pass\n  records_and_red_lines     pass\n37 pass, 0 fail, 0 missing of 37 checks across seven sections."
}
```

### Example 2 — violations (recorded HTTP 200)

Recorded case note: Violates harmonic limit, cable length limit, current selection, and red-line records checks.

Input:

```json
{
  "asset": "VFD-002",
  "application": {
    "load_torque_type": "constant",
    "overload_duty_declared": true,
    "speed_range_declared": true,
    "starts_per_hour": 5,
    "environment_declared": true,
    "selected_to_duty": true
  },
  "power_quality": {
    "harmonic_impact_estimated": true,
    "harmonic_distortion_percent": 10.0,
    "site_limit_percent": 5.0,
    "mitigation_declared": true,
    "capacitor_bank_interaction_reviewed": true,
    "harmonics_per_site_standard": true
  },
  "cable": {
    "cable_length_m": 150.0,
    "oem_max_lead_length_m": 100.0,
    "motor_insulation_within_drive_limits": true,
    "dvdt_reflected_wave_reviewed": true,
    "inverter_duty_motor_assessed": true,
    "shaft_bearing_protection_reviewed": true
  },
  "drive": {
    "derated_current_a": 50.0,
    "required_load_current_a": 90.0
  },
  "protection": {
    "overload_model_configured": true,
    "ground_fault_configured": true,
    "over_under_voltage_configured": true,
    "stall_configured": true,
    "bypass_philosophy_documented": true,
    "estop_interlocks_verified": true
  },
  "commissioning": {
    "parameter_sheet_completed_archived": true,
    "motor_id_run_done": true,
    "protections_tested_logically": true,
    "ramps_limits_setpoints_documented": true,
    "baseline_trends_recorded": true
  },
  "troubleshooting": {
    "open": false
  },
  "records": {
    "parameter_backup_archived": true,
    "commissioning_sheet_archived": true,
    "firmware_version": "v1.2.3",
    "hipot_performed_on_drive_output": true,
    "protections_bypassed_without_documented_approval": true
  }
}
```

Response (REST):

```json
{
  "service": "vfd-application-engineering-check",
  "atom_version": "0.1.0",
  "asset": "VFD-002",
  "verdict": "NOT_SOUND",
  "sections": {
    "application_profile": "pass",
    "power_quality": "fail",
    "motor_cable_drive": "fail",
    "protection_and_control": "pass",
    "commissioning": "pass",
    "troubleshooting": "pass",
    "records_and_red_lines": "fail"
  },
  "checks": [
    {
      "section": "application_profile",
      "check": "load_torque_type_named",
      "status": "pass",
      "evidence": "application profile: load torque type is one of variable / constant torque"
    },
    {
      "section": "application_profile",
      "check": "overload_duty_declared",
      "status": "pass",
      "evidence": "overload duty declared — select to duty, not to marketing tables"
    },
    {
      "section": "application_profile",
      "check": "speed_range_declared",
      "status": "pass",
      "evidence": "speed range declared as an application-profile input"
    },
    {
      "section": "application_profile",
      "check": "starts_per_hour_declared",
      "status": "pass",
      "evidence": "starts/hour declared as an application-profile input"
    },
    {
      "section": "application_profile",
      "check": "environment_declared",
      "status": "pass",
      "evidence": "environment declared as an application-profile input"
    },
    {
      "section": "application_profile",
      "check": "selected_to_duty_not_marketing",
      "status": "pass",
      "evidence": "drive selected to duty, not to marketing tables"
    },
    {
      "section": "power_quality",
      "check": "harmonic_impact_estimated",
      "status": "pass",
      "evidence": "harmonic impact estimated"
    },
    {
      "section": "power_quality",
      "check": "harmonics_within_declared_site_limit",
      "status": "fail",
      "evidence": "IEEE 519-style limits per site standard: the declared harmonic distortion must not exceed the declared site limit (the limit is the caller's site standard — this atom supplies no number)"
    },
    {
      "section": "power_quality",
      "check": "mitigation_declared",
      "status": "pass",
      "evidence": "mitigation declared — line reactors / DC chokes / filters; multi-pulse or active front end where justified"
    },
    {
      "section": "power_quality",
      "check": "capacitor_bank_interaction_reviewed",
      "status": "pass",
      "evidence": "capacitor-bank interactions / detuning checked"
    },
    {
      "section": "power_quality",
      "check": "harmonics_addressed_per_site_standard",
      "status": "pass",
      "evidence": "quality gate: harmonics addressed per site standard"
    },
    {
      "section": "motor_cable_drive",
      "check": "cable_length_within_oem_limit",
      "status": "fail",
      "evidence": "quality gate: lead length within drive limits (documented) — the declared cable length must not exceed the declared OEM maximum lead length (respect OEM limits)"
    },
    {
      "section": "motor_cable_drive",
      "check": "motor_insulation_within_drive_limits",
      "status": "pass",
      "evidence": "quality gate: motor insulation system within drive limits (documented)"
    },
    {
      "section": "motor_cable_drive",
      "check": "dvdt_reflected_wave_reviewed",
      "status": "pass",
      "evidence": "reflected wave / dv-dt vs lead length reviewed (the skill states no dv/dt number, so the review is declared, not re-graded)"
    },
    {
      "section": "motor_cable_drive",
      "check": "inverter_duty_motor_assessed",
      "status": "pass",
      "evidence": "inverter-duty motors for long leads / high switching assessed"
    },
    {
      "section": "motor_cable_drive",
      "check": "shaft_voltage_bearing_protection_reviewed",
      "status": "pass",
      "evidence": "shaft voltage & bearing currents reviewed — shaft grounding / bearing protection on larger frames"
    },
    {
      "section": "motor_cable_drive",
      "check": "derated_current_covers_required_load_current",
      "status": "fail",
      "evidence": "select to duty: the declared derated drive current must cover the declared required load current (both currents are caller-declared — this atom supplies no derating factor)"
    },
    {
      "section": "protection_and_control",
      "check": "overload_model_configured",
      "status": "pass",
      "evidence": "internal protection configured: overload model"
    },
    {
      "section": "protection_and_control",
      "check": "ground_fault_protection_configured",
      "status": "pass",
      "evidence": "internal protection configured: ground fault"
    },
    {
      "section": "protection_and_control",
      "check": "over_under_voltage_protection_configured",
      "status": "pass",
      "evidence": "internal protection configured: over/under voltage"
    },
    {
      "section": "protection_and_control",
      "check": "stall_protection_configured",
      "status": "pass",
      "evidence": "internal protection configured: stall"
    },
    {
      "section": "protection_and_control",
      "check": "bypass_philosophy_documented",
      "status": "pass",
      "evidence": "bypass philosophy documented"
    },
    {
      "section": "protection_and_control",
      "check": "estop_and_interlocks_verified",
      "status": "pass",
      "evidence": "quality gate: e-stop & interlock design per site standards — never softened for convenience; e-stops verified"
    },
    {
      "section": "commissioning",
      "check": "parameter_sheet_completed_and_archived",
      "status": "pass",
      "evidence": "parameter sheet completed and archived (motor data, limits, ramps, setpoints)"
    },
    {
      "section": "commissioning",
      "check": "motor_id_run_done",
      "status": "pass",
      "evidence": "motor ID run done"
    },
    {
      "section": "commissioning",
      "check": "protections_tested_not_just_set",
      "status": "pass",
      "evidence": "quality gate: protection settings tested, not just set — each protection tested logically"
    },
    {
      "section": "commissioning",
      "check": "ramps_limits_setpoints_documented",
      "status": "pass",
      "evidence": "limits, ramps and setpoints documented on the parameter sheet"
    },
    {
      "section": "commissioning",
      "check": "baseline_trends_recorded",
      "status": "pass",
      "evidence": "baseline current / DC-bus / temperature trends recorded"
    },
    {
      "section": "troubleshooting",
      "check": "fault_log_reviewed_first",
      "status": "pass",
      "evidence": "no troubleshooting declared open"
    },
    {
      "section": "troubleshooting",
      "check": "typical_fault_causes_cross_checked",
      "status": "pass",
      "evidence": "no troubleshooting declared open"
    },
    {
      "section": "troubleshooting",
      "check": "mechanical_load_causes_cross_checked",
      "status": "pass",
      "evidence": "no troubleshooting declared open"
    },
    {
      "section": "troubleshooting",
      "check": "findings_documented",
      "status": "pass",
      "evidence": "no troubleshooting declared open"
    },
    {
      "section": "records_and_red_lines",
      "check": "parameter_backup_archived",
      "status": "pass",
      "evidence": "records: parameter backups archived per drive"
    },
    {
      "section": "records_and_red_lines",
      "check": "commissioning_sheet_archived",
      "status": "pass",
      "evidence": "quality gate: commissioning sheet + parameter backup archived"
    },
    {
      "section": "records_and_red_lines",
      "check": "firmware_version_noted",
      "status": "pass",
      "evidence": "firmware version noted in the records"
    },
    {
      "section": "records_and_red_lines",
      "check": "no_hipot_on_drive_output",
      "status": "fail",
      "evidence": "skill red line: never hi-pot drive output terminals (drive killer); isolate electronics before insulation tests"
    },
    {
      "section": "records_and_red_lines",
      "check": "no_protection_bypass_without_documented_approval",
      "status": "fail",
      "evidence": "skill red line: never bypass drive protections to \"keep running\" without documented engineering approval"
    }
  ],
  "engineering_status": "not_sound_on_declared_values",
  "harmonic_margin_percent": "-5.0000",
  "cable_margin_m": "-50.0000",
  "current_margin_a": "-40.0000",
  "summary": "32 pass, 5 fail, 0 missing of 37 checks across seven sections.",
  "stamp": "VFD APPLICATION ENGINEERING CHECK\nasset: VFD-002\nVERDICT: NOT_SOUND\n  application_profile       pass\n  power_quality             fail\n  motor_cable_drive         fail\n  protection_and_control    pass\n  commissioning             pass\n  troubleshooting           pass\n  records_and_red_lines     fail\n32 pass, 5 fail, 0 missing of 37 checks across seven sections."
}
```

### Example 3 — malformed (recorded HTTP 422)

Recorded case note: Type mismatch: starts_per_hour expects a number, received string.

Input:

```json
{
  "asset": "VFD-004",
  "application": {
    "starts_per_hour": "not-a-number"
  }
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "application.starts_per_hour",
  "detail": "application.starts_per_hour must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Y — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Integrators Y · Developers Y · Ops Y · Regulators N/A (an electrical drive-application engineering check over declared values; an engineering judgment artifact, not compliance or audit evidence for a regulated domain.) |
| Checks named count vs recorded count | 37 / 37 — every check in the recorded full-pass response is documented |
| Verdict vocabulary complete | Y — 3 verdict values plus section/per-item statuses documented |
| Input reference typed | Y — 42 field rows, each with a type (SERVICE.md field table + recorded input schema) |
| Worked examples verbatim-verified | Y — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/vfd-application-engineering-check/evidence.json` |

