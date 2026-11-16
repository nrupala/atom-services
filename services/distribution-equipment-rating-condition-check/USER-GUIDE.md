# Distribution equipment rating condition check — user guide
Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are reviewing a distribution lineup — MCC, switchgear,
transformers. This atom reads an evidence manifest covering ratings
against the current fault study (including two computed comparisons:
interrupting rating vs available fault current, continuous rating vs
load current), MCC and switchgear specifics, transformer loading,
temperatures and paralleling (also computed), condition awareness, and
coordination and safety — across six sections (ratings_vs_fault_study,
mcc_specifics, switchgear_specifics, transformers, condition_awareness,
coordination_and_safety). The verdict is **RATING_CONDITION_SOUND**,
**RATING_CONDITION_UNSOUND**, or **INSUFFICIENT_EVIDENCE**, and the
output also reports the computed `rating_status`
(`within_declared_ratings` / `exceeded` / null when a comparison cannot
be completed). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "distribution-equipment-rating-condition-check"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/distribution-equipment-rating-condition-check`
  — tool name `distribution_equipment_rating_condition_check`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/distribution-equipment-rating-condition-check`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `lineup` (string) | the lineup under review (carried into the output) |
| `ratings.fault_study_current`, `ratings.gaps_documented` | ratings verified against the current fault study; gaps documented |
| `equipment[]` | top-level list of equipment entries `{id, interrupting_rating_ka, available_fault_current_ka, continuous_current_rating_a, load_current_a}` (numbers) — the interrupting rating must cover the fault current and the continuous rating must cover the load |
| `mcc.section_bus_rating_verified`, `mcc.starter_types_recorded`, `mcc.segregation_and_barriers_verified`, `mcc.heat_load_assessed`, `mcc.planned_spare_capacity_recorded`, `mcc.labeling_matches_lineup_drawing` | MCC specifics |
| `switchgear.breaker_relay_schemes_verified`, `switchgear.ct_ratios_and_wiring_checked`, `switchgear.trip_tests_per_plan`, `switchgear.interlock_function_tests_done`, `switchgear.torque_checks_per_oem` | switchgear specifics |
| `transformers[]` | list of transformer entries `{id, nameplate_kva, load_kva, top_oil_temp_c, top_oil_limit_c, winding_temp_c, winding_limit_c, paralleled, vector_group_match, ratio_match, impedance_match}` — load must not exceed nameplate, temperatures must not exceed the declared limits, and a paralleled transformer requires matching vector group, ratio and impedance |
| `transformer.tap_positions_recorded`, `transformer.harmonic_rich_load`, `transformer.k_factor_assessed` | tap positions; K-factor assessed when a harmonic-rich load is declared (otherwise not applicable) |
| `condition.oil_dga_screening_on_schedule`, `condition.ir_scans_done`, `condition.audible_corona_logged_vs_baseline` | condition awareness |
| `coordination.settings_labels_study_aligned`, `coordination.equipment_changed`, `coordination.study_refresh_flagged`, `coordination.test_records_complete_with_instruments_and_calibration`, `coordination.energized_work_outside_permit_system` (must be `false`) | coordination and safety; study refresh flagged when equipment changed (otherwise not applicable) |

All fields are booleans unless noted. A field **absent** = evidence
missing (counts toward INSUFFICIENT_EVIDENCE). A field present but
false/invalid = the check fails (counts toward RATING_CONDITION_UNSOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/distribution-equipment-rating-condition-check`:

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

Response — HTTP 200 (trimmed; the full response carries all 27 checks and a text stamp of the verdict):

```json
{
  "service": "distribution-equipment-rating-condition-check",
  "atom_version": "0.1.0",
  "lineup": "Main-Distribution-A",
  "verdict": "RATING_CONDITION_SOUND",
  "rating_status": "within_declared_ratings",
  "sections": {
    "ratings_vs_fault_study": "pass",
    "mcc_specifics": "pass",
    "switchgear_specifics": "pass",
    "transformers": "pass",
    "condition_awareness": "pass",
    "coordination_and_safety": "pass"
  },
  "summary": "27 pass, 0 fail, 0 missing of 27 checks across six sections."
}
```

## Verdicts

- **RATING_CONDITION_SOUND** — every check passes; all 27 checks across the six sections, with `rating_status` `within_declared_ratings`.
- **RATING_CONDITION_UNSOUND** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
