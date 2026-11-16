# Vfd application engineering check — `vfd-application-engineering-check`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): VFD/ASD application engineering — harmonics, motor-cable interactions, protection, commissioning, troubleshooting.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Electrical & energy who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **EE drive application reviews**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the VFD application manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_SOUND`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `asset` (string; carried into the verdict output, not itself checked) | — |
| `application.load_torque_type` (`"variable"` / `"constant"` — the skill's own vocabulary) | application_profile |
| `application.overload_duty_declared` | application_profile |
| `application.speed_range_declared` | application_profile |
| `application.starts_per_hour` (number) | application_profile |
| `application.environment_declared` | application_profile |
| `application.selected_to_duty` | application_profile |
| `power_quality.harmonic_impact_estimated` | power_quality |
| `power_quality.harmonic_distortion_percent` (number; computed against the site limit below) | power_quality |
| `power_quality.site_limit_percent` (number; the caller's declared site standard) | power_quality |
| `power_quality.mitigation_declared` | power_quality |
| `power_quality.capacitor_bank_interaction_reviewed` | power_quality |
| `power_quality.harmonics_per_site_standard` | power_quality |
| `cable.cable_length_m` (number; computed against the OEM limit below) | motor_cable_drive |
| `cable.oem_max_lead_length_m` (number; the declared OEM maximum lead length) | motor_cable_drive |
| `cable.motor_insulation_within_drive_limits` | motor_cable_drive |
| `cable.dvdt_reflected_wave_reviewed` | motor_cable_drive |
| `cable.inverter_duty_motor_assessed` | motor_cable_drive |
| `cable.shaft_bearing_protection_reviewed` | motor_cable_drive |
| `drive.derated_current_a` (number; computed against the required current below) | motor_cable_drive |
| `drive.required_load_current_a` (number) | motor_cable_drive |
| `protection.overload_model_configured` | protection_and_control |
| `protection.ground_fault_configured` | protection_and_control |
| `protection.over_under_voltage_configured` | protection_and_control |
| `protection.stall_configured` | protection_and_control |
| `protection.bypass_philosophy_documented` | protection_and_control |
| `protection.estop_interlocks_verified` | protection_and_control |
| `commissioning.parameter_sheet_completed_archived` | commissioning |
| `commissioning.motor_id_run_done` | commissioning |
| `commissioning.protections_tested_logically` | commissioning |
| `commissioning.ramps_limits_setpoints_documented` | commissioning |
| `commissioning.baseline_trends_recorded` | commissioning |
| `troubleshooting.open` (gates the four checks below; absent = those checks are missing, `false` = they pass as not applicable) | troubleshooting |
| `troubleshooting.fault_log_reviewed_first` (binds only while troubleshooting is open) | troubleshooting |
| `troubleshooting.typical_fault_causes_cross_checked` (binds only while open) | troubleshooting |
| `troubleshooting.mechanical_causes_cross_checked` (binds only while open) | troubleshooting |
| `troubleshooting.findings_documented` (binds only while open) | troubleshooting |
| `records.parameter_backup_archived` | records_and_red_lines |
| `records.commissioning_sheet_archived` | records_and_red_lines |
| `records.firmware_version` (non-empty string) | records_and_red_lines |
| `records.hipot_performed_on_drive_output` (must be `false` to pass — skill red line) | records_and_red_lines |
| `records.protections_bypassed_without_documented_approval` (must be `false` to pass — skill red line) | records_and_red_lines |

Three checks are computed from the declared values, using only the
comparisons the skill itself states: the declared harmonic distortion
must not exceed the declared site limit (method 2: IEEE 519-style
limits *per site standard* — the limit is the caller's, this atom
supplies no number); the declared cable length must not exceed the
declared OEM maximum lead length (method 3: respect OEM limits); and
the declared derated drive current must cover the declared required
load current (method 1: select to duty). Equality passes on all
three. No outside standard, margin or threshold is imported.

The output also reports the computed `engineering_status`
(`sound_on_declared_values` / `not_sound_on_declared_values` / null
when an applicable computed comparison cannot be completed) and the
three margins: `harmonic_margin_percent`, `cable_margin_m` and
`current_margin_a` (null when not completable). **Fixed serialization
rule:** computed margins are reported as strings with exactly four
decimal places, produced in both implementations by the same rule —
round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, then format
with exactly four decimals; comparisons use the unrounded values.
That fixed serialization is what makes the Python and TypeScript
outputs byte-identical.

The verdict is one of `SOUND` (all 37 checks pass), `NOT_SOUND`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across seven sections: application_profile,
power_quality, motor_cable_drive, protection_and_control,
commissioning, troubleshooting, records_and_red_lines.

## Honest scoping

This atom checks **declared** values against **declared** limits and
records — it does not measure anything, estimate harmonics from a
real supply, or verify that a declared value is true. Soundness is
soundness *on the caller's declared values*: a drive whose declared
derated current covers the declared load passes even if either
declared figure is wrong. Named exclusions: no harmonic limit value
(the skill applies IEEE 519-style limits *per site standard*, so the
limit must be declared by the caller); no dv/dt or reflected-wave
threshold (the skill states none — the review is checked as declared
evidence, and cable length is compared only against the declared OEM
limit); no derating factor (the skill states none — both currents are
caller-declared); no torque/speed computation (the skill names load
torque type, speed range and starts/hour as profile inputs but states
no torque-speed relationship to compute with, so they are checked as
declared profile evidence); no protection setting values, drive
tuning, or troubleshooting diagnosis (fault-cause cross-checks are
checked as declared evidence while troubleshooting is open, never
performed by the atom).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
