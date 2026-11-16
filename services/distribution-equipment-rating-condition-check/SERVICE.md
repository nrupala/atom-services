# Distribution equipment rating condition check — `distribution-equipment-rating-condition-check`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): MCC, switchgear, transformers — ratings, protection basics, testing, condition checks, safe work discipline.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Electrical & energy who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **EE consulting equipment reviews**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the distribution-equipment evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`RATING_CONDITION_UNSOUND`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `lineup` (string; carried into the verdict output, not itself checked) | — |
| `ratings.fault_study_current` | ratings_vs_fault_study |
| `ratings.gaps_documented` | ratings_vs_fault_study |
| `equipment[]` (list of equipment entries, see below) | ratings_vs_fault_study |
| `mcc.section_bus_rating_verified` | mcc_specifics |
| `mcc.starter_types_recorded` | mcc_specifics |
| `mcc.segregation_and_barriers_verified` | mcc_specifics |
| `mcc.heat_load_assessed` | mcc_specifics |
| `mcc.planned_spare_capacity_recorded` | mcc_specifics |
| `mcc.labeling_matches_lineup_drawing` | mcc_specifics |
| `switchgear.breaker_relay_schemes_verified` | switchgear_specifics |
| `switchgear.ct_ratios_and_wiring_checked` | switchgear_specifics |
| `switchgear.trip_tests_per_plan` | switchgear_specifics |
| `switchgear.interlock_function_tests_done` | switchgear_specifics |
| `switchgear.torque_checks_per_oem` | switchgear_specifics |
| `transformers[]` (list of transformer entries, see below) | transformers |
| `transformer.tap_positions_recorded` | transformers |
| `transformer.harmonic_rich_load` (gates the K-factor check below) | transformers |
| `transformer.k_factor_assessed` (required when a harmonic-rich load is declared; otherwise the check passes as not applicable) | transformers |
| `condition.oil_dga_screening_on_schedule` | condition_awareness |
| `condition.ir_scans_done` | condition_awareness |
| `condition.audible_corona_logged_vs_baseline` | condition_awareness |
| `coordination.settings_labels_study_aligned` | coordination_and_safety |
| `coordination.equipment_changed` (gates the study-refresh check below) | coordination_and_safety |
| `coordination.study_refresh_flagged` (required when equipment changed; otherwise the check passes as not applicable) | coordination_and_safety |
| `coordination.test_records_complete_with_instruments_and_calibration` | coordination_and_safety |
| `coordination.energized_work_outside_permit_system` (must be `false` to pass) | coordination_and_safety |

Each `equipment[]` entry is `{id, interrupting_rating_ka,
available_fault_current_ka, continuous_current_rating_a,
load_current_a}` (numbers). Two checks are computed from the declared
values, using only the comparisons the skill itself states:
interrupting rating must cover the available fault current, and the
continuous current rating must cover the declared load current.

Each `transformers[]` entry is `{id, nameplate_kva, load_kva,
top_oil_temp_c, top_oil_limit_c, winding_temp_c, winding_limit_c,
paralleled, vector_group_match, ratio_match, impedance_match}`
(numbers; the temperature limits are the caller's declared limits —
no outside standard is imported). Three checks are computed: load
must not exceed nameplate, top-oil and winding temperatures must not
exceed their declared limits, and a transformer declared
`paralleled` requires matching vector group, ratio and impedance.
The output also reports the computed `rating_status`
(`within_declared_ratings` / `exceeded` / null when a computed
comparison cannot be completed).

The verdict is one of `RATING_CONDITION_SOUND` (all 27 checks pass),
`RATING_CONDITION_UNSOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: ratings_vs_fault_study, mcc_specifics,
switchgear_specifics, transformers, condition_awareness,
coordination_and_safety.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.
