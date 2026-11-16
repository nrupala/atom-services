# Electrical machinery engineering check — `electrical-machinery-engineering-check`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Motors and generators — application checks, specs, acceptance tests, and failure-analysis support for electrical machines.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Electrical & energy who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **EE motor sizing reviews**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the machinery engineering manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_SOUND`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `machine` (string; carried into the verdict output, not itself checked) | — |
| `duty.load_torque_profile` (one of `constant` / `variable` / `impact`) | duty |
| `duty.starts_per_hour` (number) | duty |
| `duty.ambient_c` (number) | duty |
| `duty.altitude_m` (number) | duty |
| `duty.worst_case_identified` | duty |
| `sizing.worst_case_torque_nm` (number; computed with `sizing.rated_torque_nm` — must not exceed it) | sizing |
| `sizing.rated_torque_nm` (number; limit for the computed torque check) | sizing |
| `sizing.worst_case_power_kw` (number; computed with `sizing.rated_power_kw` — must not exceed it) | sizing |
| `sizing.rated_power_kw` (number; limit for the computed power check) | sizing |
| `sizing.service_factor` (number) | sizing |
| `sizing.starting_current_a` (number; computed with `sizing.supply_capability_a` — must not exceed it) | sizing |
| `sizing.supply_capability_a` (number; limit for the computed starting-current check) | sizing |
| `sizing.efficiency_at_actual_load_percent` (number; efficiency at actual load, not nameplate) | sizing |
| `specification.machine_type` (one of `induction` / `synchronous`) | specification |
| `specification.insulation_class` (non-empty string) | specification |
| `specification.enclosure` (one of `TEFC` / `ODP` / `WPI`) | specification |
| `specification.bearings_specified` | specification |
| `specification.space_heaters_specified` | specification |
| `specification.rtds_specified` | specification |
| `specification.vibration_limits_specified` | specification |
| `specification.standards_cited` | specification |
| `tests.criteria_defined_before_tests` | acceptance_tests |
| `tests.criteria_from_standards_and_oem` | acceptance_tests |
| `tests.insulation_resistance_tested` | acceptance_tests |
| `tests.pi_dar_trends_recorded` | acceptance_tests |
| `tests.winding_resistance_balance_checked` | acceptance_tests |
| `tests.surge_comparison_done` | acceptance_tests |
| `tests.no_load_and_load_runs_done` | acceptance_tests |
| `tests.results_recorded_with_units` | acceptance_tests |
| `tests.instruments_and_calibration_recorded` | acceptance_tests |
| `failure.investigation_open` (gates the three failure-analysis checks below) | failure_analysis |
| `failure.evidence_organized_into_timeline` (required when an investigation is open; otherwise the check passes as not applicable) | failure_analysis |
| `failure.operating_history_included` (required when an investigation is open; otherwise the check passes as not applicable) | failure_analysis |
| `failure.typical_failure_modes_considered` (required when an investigation is open; otherwise the check passes as not applicable) | failure_analysis |
| `trending.per_asset_baseline_exists` | trending |
| `trending.like_for_like_comparison` | trending |
| `trending.deltas_compared` | trending |
| `records.nameplate_and_serial_verified` | records_and_safety |
| `records.re_energized_after_insulation_or_winding_anomaly_without_review` (must be `false` to pass) | records_and_safety |
| `records.anomalies_flagged` | records_and_safety |
| `records.asset_records_updated` | records_and_safety |
| `records.deviations_logged_with_actions` | records_and_safety |

The verdict is one of `SOUND` (all 38 checks pass), `NOT_SOUND`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across seven sections: duty, sizing,
specification, acceptance_tests, failure_analysis, trending,
records_and_safety. The skill states no numeric acceptance
thresholds (no winding-balance tolerance, no insulation-resistance
floor, no efficiency floor), so none are applied: test items are
checked as declared-and-recorded against criteria from standards
and OEM, never re-graded against outside standards.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.
