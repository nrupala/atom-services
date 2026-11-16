# Electrical test record preparation — `electrical-test-record-preparation`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Keep test sheets, trends, and plots that survive audits — standard templates, clean data, honest charts.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Electrical & energy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **EE test record preparation**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the test-record evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`RECORD_NOT_READY`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `asset` (string; carried into the verdict output, not itself checked) | — |
| `record.asset_id_present` | template_completeness |
| `record.datetime_present` | template_completeness |
| `record.ambient_present` | template_completeness |
| `record.load_condition_present` | template_completeness |
| `record.instrument_named` (with `record.calibration_status_recorded`; both must be present and true) | template_completeness |
| `record.calibration_status_recorded` (see above) | template_completeness |
| `record.test_method_reference_present` | template_completeness |
| `record.acceptance_criteria_present` | template_completeness |
| `record.verdict_value` (string: `"pass"` or `"fail"`; also compared against the readings by the computed consistency check) | template_completeness, machine_readable_format |
| `record.tester_named` | template_completeness |
| `record.reviewer_named` | template_completeness |
| `record.has_na_fields` (gates the reasons check below) | template_completeness |
| `record.na_reasons_recorded` (required when an `N/A` field exists; otherwise the check passes as not applicable) | template_completeness |
| `record.is_critical_test` (gates the sign-off check below) | template_completeness |
| `record.reviewer_signoff_present` (required when the test is critical; otherwise the check passes as not applicable) | template_completeness |
| `hygiene.asset_ids_consistent` | data_hygiene |
| `hygiene.si_units_used` | data_hygiene |
| `hygiene.conversions_noted` | data_hygiene |
| `hygiene.iso_timestamps` | data_hygiene |
| `hygiene.single_source_of_truth` | data_hygiene |
| `hygiene.raw_data_overwritten` (must be `false` to pass) | data_hygiene |
| `hygiene.photos_attached_and_named` | data_hygiene |
| `format.single_header_row` | machine_readable_format |
| `format.tidy_long_format` | machine_readable_format |
| `format.required_columns_present` | machine_readable_format |
| `readings` (list of readings; absent / not a list / empty = both computed checks missing) | machine_readable_format |
| `readings[].point` (non-empty string) | machine_readable_format |
| `readings[].value` (number) | machine_readable_format |
| `readings[].unit` (non-empty string) | machine_readable_format |
| `readings[].acceptance_min` (number; must be ≤ `acceptance_max`) | machine_readable_format |
| `readings[].acceptance_max` (number) | machine_readable_format |
| `trending.same_point_method_instrument_class` | trending |
| `trending.plotted_vs_time` | trending |
| `trending.load_varies` (gates the vs-load check below) | trending |
| `trending.plotted_vs_load` (required when load varies; otherwise the check passes as not applicable) | trending |
| `trending.repair_events_annotated` | trending |
| `trending.control_bands_from_limits_or_baseline` | trending |
| `trending.trends_updated_on_cadence` | trending |
| `trending.anomalies_present` (gates the flagged check below) | trending |
| `trending.anomalies_flagged_with_action` (required when anomalies are present; otherwise the check passes as not applicable) | trending |
| `plotting.axes_labeled_with_units` | plotting_discipline |
| `plotting.version_and_date_on_charts` | plotting_discipline |
| `plotting.dual_axis_used` (must be `false` to pass) | plotting_discipline |
| `plotting.out_of_band_points_present` (gates the highlighted check below) | plotting_discipline |
| `plotting.out_of_band_highlighted` (required when out-of-band points exist; otherwise the check passes as not applicable) | plotting_discipline |
| `plotting.summary_sheet_per_asset` | plotting_discipline |
| `retention.archived_and_findable` | retention_and_audit |
| `retention.retention_per_policy` | retention_and_audit |
| `retention.superseded_revisions_exist` (gates the retained check below) | retention_and_audit |
| `retention.superseded_retained_marked` (required when superseded revisions exist; otherwise the check passes as not applicable) | retention_and_audit |
| `retention.corrections_made` (gates the revision-notes check below) | retention_and_audit |
| `retention.correction_revision_notes_present` (required when corrections were made; otherwise the check passes as not applicable) | retention_and_audit |
| `retention.raw_data_destroyed` (must be `false` to pass) | retention_and_audit |

Two checks are computed, not declared: every reading is checked for
completeness against its declared acceptance limits, and the sheet's
declared verdict (`record.verdict_value`) is compared with the verdict
the readings imply against those limits (any reading outside its
limits means the test verdict is `fail`). The verdict dict also
reports `readings_evaluated` and `readings_out_of_criteria` counts.
No acceptance threshold is invented by the atom — the limits are the
caller's declared criteria, exactly as the skill's template requires
them on the sheet.

The verdict is one of `RECORD_READY` (all 41 checks pass),
`RECORD_NOT_READY` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
template_completeness, data_hygiene, machine_readable_format,
trending, plotting_discipline, retention_and_audit.

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Audit-grade records; safety-adjacent
