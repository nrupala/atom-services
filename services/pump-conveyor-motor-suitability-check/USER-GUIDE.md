# Pump / conveyor motor suitability check — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are sizing (or reviewing) a motor and drive for a pump or a
conveyor. This atom reads a short manifest of the declared duty and
ratings — the load and operating point, the drive entries with their
required vs rated power and torque, NPSH and flow figures for pumps,
starting-torque figures for conveyors, baselines, and the
interface/protection record — and returns one deterministic verdict
across 26 checks in six sections: **SUITABLE**, **NOT_SUITABLE**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Five checks are computed from your
declared numbers (rated power/torque must cover required; NPSH
available must cover NPSH required; operating flow at or above the
declared minimum; starting torque must cover required), and the report
carries the worst (minimum) margins across your drives. It checks
declared values against declared ratings — it does not measure
anything or read a real pump curve. Same manifest in → same verdict
out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "pump-conveyor-motor-suitability-check"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/pump-conveyor-motor-suitability-check`
  — tool name `pump_conveyor_motor_suitability_check`; `tools/call`
  arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/pump-conveyor-motor-suitability-check`
  — body = the manifest object; same `Authorization` header.

## Input — the driven-equipment suitability manifest

All fields are booleans unless noted.

| Field | Meaning |
|---|---|
| `asset` | asset name (string; carried into the output, not itself checked) |
| `equipment_kind` | `"pump"` / `"conveyor"` / `"mixed"` — gates which equipment sections bind |
| `duty.curve_or_profile_read`, `duty.operating_point_documented`, `duty.operating_point_within_limits`, `duty.operating_modes_defined` | load & operating point |
| `drives[]` | drive entries: `{id, kind, required_power_kw, motor_rated_power_kw, required_running_torque_nm, motor_rated_torque_nm}`; pump entries add `npsh_available_m`, `npsh_required_m`, `operating_flow_m3h`, `minimum_flow_m3h`; conveyor entries add `required_starting_torque_nm`, `motor_starting_torque_nm` |
| `sizing.verified_against_curve_or_profile`, `sizing.suitable_because_it_runs_only` | sizing discipline (the second must be `false` — "it runs, so it fits" is a red line) |
| `pump.minimum_flow_protection_set`, `pump.impeller_wear_trend_checked`, `pump.vfd_soft_start_reviewed` | pump checks (bind for pump / mixed) |
| `conveyor.starting_study_considered`, `conveyor.loaded_starts_holdback_considered`, `conveyor.backstops_brake_interlocks_verified`, `conveyor.sequence_interlock_review_done`, `conveyor.belt_slip_jam_reviewed` | conveyor checks (bind for conveyor / mixed) |
| `baselines.recorded_per_operating_mode`, `baselines.flow_head_current_pressure_recorded`, `baselines.compared_at_same_conditions` | baselines |
| `interface.mechanical_data_in_asset_record`, `interface.data_shared_single_source`, `interface.changes_made`, `interface.changes_revalidated` | interface discipline |
| `protection.protection_changed_without_engineering_review` | must be `false` — protection changed without review is a red line |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid, or a
computed comparison that fails, = the check fails (counts toward
NOT_SUITABLE).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/pump-conveyor-motor-suitability-check`:

```json
{
  "asset": "PUMP-001",
  "equipment_kind": "pump",
  "duty": {"curve_or_profile_read": true, "operating_point_documented": true, "operating_point_within_limits": true, "operating_modes_defined": true},
  "drives": [{"id": "D1", "kind": "pump", "required_power_kw": 10.0, "motor_rated_power_kw": 15.0, "required_running_torque_nm": 50.0, "motor_rated_torque_nm": 60.0, "npsh_available_m": 5.0, "npsh_required_m": 3.0, "operating_flow_m3h": 100.0, "minimum_flow_m3h": 80.0}],
  "sizing": {"verified_against_curve_or_profile": true, "suitable_because_it_runs_only": false},
  "pump": {"minimum_flow_protection_set": true, "impeller_wear_trend_checked": true, "vfd_soft_start_reviewed": true},
  "baselines": {"recorded_per_operating_mode": true, "flow_head_current_pressure_recorded": true, "compared_at_same_conditions": true},
  "interface": {"mechanical_data_in_asset_record": true, "data_shared_single_source": true, "changes_made": false},
  "protection": {"protection_changed_without_engineering_review": false}
}
```

Response — HTTP 200 (trimmed; the full response carries all 26 checks
and a text stamp of the verdict):

```json
{
  "service": "pump-conveyor-motor-suitability-check",
  "atom_version": "0.1.0",
  "asset": "PUMP-001",
  "verdict": "SUITABLE",
  "sections": {"load_and_operating_point": "pass", "motor_sizing": "pass", "pump_checks": "pass", "conveyor_checks": "pass", "baselines": "pass", "interface_and_protection": "pass"},
  "suitability_status": "suitable_on_declared_values",
  "min_power_margin_kw": "5.0000",
  "min_running_torque_margin_nm": "10.0000",
  "min_npsh_margin_m": "2.0000",
  "min_starting_torque_margin_nm": null,
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across six sections."
}
```

Margins are strings with exactly four decimals; `null` means that
margin does not apply (here: no conveyor drive, so no starting-torque
margin).

## Verdicts

- **SUITABLE** — every check passes on the declared values.
- **NOT_SUITABLE** — at least one check fails; the failing checks name
  the breached section (a negative margin means the rating does not
  cover the requirement).
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing;
  the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
