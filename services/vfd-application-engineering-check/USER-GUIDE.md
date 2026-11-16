# VFD application engineering check — user guide

## What it does

You are applying (or reviewing) a variable-frequency drive / adjustable
speed drive to a motor load. This atom reads a short manifest of the
declared application — load profile, power quality, motor cable and
drive current, protection and control, commissioning, troubleshooting
and records — and returns one deterministic verdict across 37 checks
in seven sections: **SOUND**, **NOT_SOUND**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Three checks are computed from your
declared numbers against your declared limits: harmonic distortion
must not exceed your declared site limit, cable length must not
exceed your declared OEM maximum lead length, and derated drive
current must cover your declared required load current (equality
passes on all three); the report carries the three margins. It checks
declared values against declared limits and records — it does not
measure anything or verify that a declared value is true. Same
manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "vfd-application-engineering-check"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/vfd-application-engineering-check`
  — tool name `vfd_application_engineering_check`; `tools/call`
  arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/vfd-application-engineering-check`
  — body = the manifest object; same `Authorization` header.

## Input — the VFD application manifest

All fields are booleans unless noted.

| Field | Meaning |
|---|---|
| `asset` | asset name (string; carried into the output, not itself checked) |
| `application.load_torque_type` | `"variable"` / `"constant"` — the load torque type |
| `application.overload_duty_declared`, `application.speed_range_declared`, `application.environment_declared`, `application.selected_to_duty` | application profile declarations |
| `application.starts_per_hour` | starts per hour (number) |
| `power_quality.harmonic_impact_estimated`, `power_quality.mitigation_declared`, `power_quality.capacitor_bank_interaction_reviewed`, `power_quality.harmonics_per_site_standard` | power-quality declarations |
| `power_quality.harmonic_distortion_percent` | declared harmonic distortion (number; computed against the site limit) |
| `power_quality.site_limit_percent` | your declared site limit (number) |
| `cable.cable_length_m` | declared cable length (number; computed against the OEM limit) |
| `cable.oem_max_lead_length_m` | your declared OEM maximum lead length (number) |
| `cable.motor_insulation_within_drive_limits`, `cable.dvdt_reflected_wave_reviewed`, `cable.inverter_duty_motor_assessed`, `cable.shaft_bearing_protection_reviewed` | motor-cable-drive declarations |
| `drive.derated_current_a` | declared derated drive current (number; computed against the required current) |
| `drive.required_load_current_a` | declared required load current (number) |
| `protection.overload_model_configured`, `protection.ground_fault_configured`, `protection.over_under_voltage_configured`, `protection.stall_configured`, `protection.bypass_philosophy_documented`, `protection.estop_interlocks_verified` | protection & control configuration |
| `commissioning.parameter_sheet_completed_archived`, `commissioning.motor_id_run_done`, `commissioning.protections_tested_logically`, `commissioning.ramps_limits_setpoints_documented`, `commissioning.baseline_trends_recorded` | commissioning record |
| `troubleshooting.open` | gates the four troubleshooting checks below (`false` = they pass as not applicable) |
| `troubleshooting.fault_log_reviewed_first`, `troubleshooting.typical_fault_causes_cross_checked`, `troubleshooting.mechanical_causes_cross_checked`, `troubleshooting.findings_documented` | troubleshooting discipline (bind only while troubleshooting is open) |
| `records.parameter_backup_archived`, `records.commissioning_sheet_archived` | records archived |
| `records.firmware_version` | firmware version (non-empty string) |
| `records.hipot_performed_on_drive_output` | must be `false` — hipot on a drive output is a red line |
| `records.protections_bypassed_without_documented_approval` | must be `false` — bypassed protections without documented approval are a red line |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false, or a computed
comparison that fails (a negative margin), = the check fails (counts
toward NOT_SOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/vfd-application-engineering-check`:

```json
{
  "asset": "VFD-001",
  "application": {"load_torque_type": "variable", "overload_duty_declared": true, "speed_range_declared": true, "starts_per_hour": 2, "environment_declared": true, "selected_to_duty": true},
  "power_quality": {"harmonic_impact_estimated": true, "harmonic_distortion_percent": 3.5, "site_limit_percent": 5.0, "mitigation_declared": true, "capacitor_bank_interaction_reviewed": true, "harmonics_per_site_standard": true},
  "cable": {"cable_length_m": 50.0, "oem_max_lead_length_m": 100.0, "motor_insulation_within_drive_limits": true, "dvdt_reflected_wave_reviewed": true, "inverter_duty_motor_assessed": true, "shaft_bearing_protection_reviewed": true},
  "drive": {"derated_current_a": 100.0, "required_load_current_a": 90.0},
  "protection": {"overload_model_configured": true, "ground_fault_configured": true, "over_under_voltage_configured": true, "stall_configured": true, "bypass_philosophy_documented": true, "estop_interlocks_verified": true},
  "commissioning": {"parameter_sheet_completed_archived": true, "motor_id_run_done": true, "protections_tested_logically": true, "ramps_limits_setpoints_documented": true, "baseline_trends_recorded": true},
  "troubleshooting": {"open": false},
  "records": {"parameter_backup_archived": true, "commissioning_sheet_archived": true, "firmware_version": "v1.2.3", "hipot_performed_on_drive_output": false, "protections_bypassed_without_documented_approval": false}
}
```

Response — HTTP 200 (trimmed; the full response carries all 37 checks
and a text stamp of the verdict):

```json
{
  "service": "vfd-application-engineering-check",
  "atom_version": "0.1.0",
  "asset": "VFD-001",
  "verdict": "SOUND",
  "sections": {"application_profile": "pass", "power_quality": "pass", "motor_cable_drive": "pass", "protection_and_control": "pass", "commissioning": "pass", "troubleshooting": "pass", "records_and_red_lines": "pass"},
  "engineering_status": "sound_on_declared_values",
  "harmonic_margin_percent": "1.5000",
  "cable_margin_m": "50.0000",
  "current_margin_a": "10.0000",
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across seven sections."
}
```

Margins are strings with exactly four decimals (`null` when the
comparison cannot be completed from the declared values);
`engineering_status` is `sound_on_declared_values` /
`not_sound_on_declared_values` / `null` on the same rule.

## Verdicts

- **SOUND** — every check passes on the declared values, including
  the three computed comparisons against your declared limits.
- **NOT_SOUND** — at least one check fails; the failing checks name
  the breached section (a negative margin means the declared value
  breaches the declared limit).
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing;
  the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
