# Verified place shortlist — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are preparing a shortlist of real places to visit and you keep a declared place-shortlist record for one shortlist. This atom reads one declared place-shortlist record and returns one deterministic verdict across six sections (constraints_and_criteria, place_rows_and_verification_evidence, rating_signals_and_fit, ranking_winner_and_backup, freshness_uncertainty_and_alternatives, red_lines): **VERIFIED_PLACE_SHORTLIST_SOUND**, **VERIFIED_PLACE_SHORTLIST_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 51 checks. The "verified" in this atom's name refers to your declared verification discipline — the record's declared evidence that verification was performed — and never to any verification by this atom: it searches for no place, fetches no listing, opens no map, verifies no address, hour, rating or photo against the world, and recommends, chooses, ranks and books nothing. A shortlist is sound *on your declared evidence*: a record that declares its addresses verified, its hours same-day checked and its criteria met passes those checks even if the real shortlist did none of it. It is a completeness and consistency audit of the shortlist record the skill requires, not a place search, a live verification, a recommendation, or a guarantee that any place exists, is open, or is as described: it never judges whether a declared address is real, whether declared hours are correct, whether a declared rating is fair, or whether the declared winner should be visited — only that the record contains what the skill's method and red lines demand, and that its declared rows are internally consistent. The computed checks: the declared `criteria` list must be present and name at least one criterion, with unique `criterion_id` values and a non-empty `criterion_name` on every row; the declared `places` list must be present and name at least two places, with unique `place_id` values, unique `address` values, a non-empty `place_name`, `address`, `verification_method` and `verification_date` on every row, every row declaring `address_verified_from_listing` true and `existence_confirmed` true, and every row's `hours_status` one of `same_day_verified` or `flagged_unverified`; every place must declare a non-negative `rating`, a positive `review_count`, `recent_complaints_noted` true and `photo_checked` true; every place's `criterion_ids_met` must name only declared criteria and must cover every declared criterion; the declared `ranking.winner_place_id` must name a declared place (only that the reference resolves — never that the winner is the best, highest-rated or top-ranked place); and every place must declare `special_hours_noted_where_shown` true. Two further checks are gated on the record's own declared gate fields — when the gate is declared `false` the check passes as not applicable, when the gate field is absent the check is missing evidence, and when the gate is `true` the target is required: where `ranking.timing_matters` is true, `ranking.backup_place_id` must name a declared place other than the winner; and where `handling.original_area_has_no_verified_options` is true, `handling.nearest_verified_area_offered` must be true. No numeric threshold is imposed — no minimum rating or star bar (a declared rating is evidence, never judged good or bad); no minimum review count beyond existence (any positive count passes — no volume bar such as 50 or 100 reviews); no maximum age for a verification date, and no check that a declared verification date is recent, today, or the visit day (dates are caller-declared strings); no budget or price ceiling (no price is even a field of this record); no distance, travel-time or area-radius bar; no place-count maximum, and no criterion-count bar beyond at least one criterion and at least two places; no conformity bar against any places provider, listing source or map service; and no judgment that the declared winner is the right, best or highest-rated place. The only bars on the computed rows are completeness, exact set coverage and reference resolution over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "verified-place-shortlist"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/verified-place-shortlist` — tool name `verified_place_shortlist`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/verified-place-shortlist` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `shortlist_title` | Shortlist title (string; carried into the output, not checked) |
| `constraints.constraints_declared` | constraint evidence: the constraints the shortlist worked to are declared, written down first |
| `constraints.area_declared` | constraint evidence: the area constraint is declared |
| `constraints.visit_timing_declared` | constraint evidence: the visit timing (the day and time the places must be open for) is declared |
| `constraints.budget_constraint_declared` | constraint evidence: the budget constraint is declared |
| `constraints.noise_constraint_declared` | constraint evidence: the noise constraint is declared |
| `constraints.parking_constraint_declared` | constraint evidence: the parking constraint is declared |
| `constraints.accessibility_needs_declared` | constraint evidence: the accessibility needs are declared |
| `constraints.candidates_searched_within_declared_constraints` | search discipline: candidates were searched for within the declared constraints |
| `constraints.only_real_named_results_kept` | search discipline: only real, named results were kept as candidates |
| `criteria` (list of criterion objects) | computed: must be present and name at least one criterion; reported as `verified_place_criteria_count` |
| `criteria[].criterion_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `criteria[].criterion_name` (string) | computed: must be present and non-empty on every row |
| `places` (list of place objects) | computed: must be present and name at least two places; reported as `verified_places_count` |
| `places[].place_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `places[].place_name` (string) | computed: must be present and non-empty on every row |
| `places[].address` (string) | computed: must be present and non-empty on every row, and no address may appear on more than one row (a duplicated address is the duplicate-listing signal) |
| `places[].address_verified_from_listing` | computed: must be `true` on every row — the address was verified from the listing itself, on your declared evidence |
| `places[].existence_confirmed` | computed: must be `true` on every row |
| `places[].hours_status` (string) | computed: must be one of `same_day_verified`, `flagged_unverified` on every row |
| `places[].verification_method` (string) | computed: must be present and non-empty on every row |
| `places[].verification_date` (string) | computed: must be present and non-empty on every row — the declared freshness of its evidence; no date is checked against the world |
| `places[].rating` (number) | computed: must be present and non-negative on every row — evidence only; no rating is judged good or bad |
| `places[].review_count` (number) | computed: must be present and positive on every row — a count of zero declares no review volume at all; no volume bar beyond existence |
| `places[].recent_complaints_noted` | computed: must be `true` on every row — what recent reviews actually complain about was noted |
| `places[].photo_checked` | computed: must be `true` on every row |
| `places[].criterion_ids_met` (list of strings) | computed: must be declared on every row, must name only declared criteria, and must cover every declared criterion |
| `places[].special_hours_noted_where_shown` | computed: must be `true` on every row — holiday or special hours were noted where shown |
| `evaluation.rating_signals_read_critically` | rating evidence: the rating signals were read critically, not as a star number alone |
| `evaluation.fit_checked_beyond_rating` | rating evidence: fit against the declared constraints was checked beyond the rating |
| `ranking.ranking_recorded` | ranking evidence: a ranking of the declared places is recorded |
| `ranking.ranking_based_on_declared_criteria` | ranking evidence: the ranking is based on the declared criteria and constraints, not on rating alone |
| `ranking.winner_place_id` (string) | computed: must name a declared place — only that the reference resolves; the winner is never judged best or highest-rated |
| `ranking.winner_rationale_recorded` | winner evidence: why the declared winner wins is recorded |
| `ranking.winner_drawback_recorded` | winner evidence: one honest drawback for the top pick is recorded |
| `ranking.winner_map_ready_address_declared` | winner evidence: the winner's address is declared in map-ready form |
| `ranking.winner_hours_recorded` | winner evidence: the winner's hours for the day in question are recorded |
| `ranking.winner_booking_or_queue_warning_recorded` | winner evidence: any booking or queue warning for the winner is recorded |
| `ranking.timing_matters` | gates the backup check: the backup is required only where timing matters |
| `ranking.backup_place_id` (string) | computed where timing matters: must name a declared place other than the winner |
| `handling.hours_flagged_unverified_when_not_same_day_confirmed` | freshness evidence: hours that could not be confirmed for the same day are flagged unverified |
| `handling.listings_checked_for_staleness_duplication_and_closure` | freshness evidence: listings were checked for staleness, duplication and possible closure |
| `handling.stale_duplicate_or_closed_listings_flagged` | freshness evidence: any stale, duplicated or possibly closed listing is flagged |
| `handling.no_unconfirmed_place_used_to_fill_gap` | uncertainty evidence: no gap was filled with a place whose existence was not confirmed |
| `handling.original_area_has_no_verified_options` | gates the nearest-area check below |
| `handling.nearest_verified_area_offered` | required when `handling.original_area_has_no_verified_options` is `true`; otherwise the check passes as not applicable |
| `red_lines.invented_address_hours_rating_or_photo_present` | must be `false` to pass (red line: no invented address, hours, rating or photo) |
| `red_lines.stale_hours_presented_as_current_fact_present` | must be `false` to pass (red line: no stale hours presented as current fact) |
| `red_lines.place_breaking_stated_constraint_recommended_present` | must be `false` to pass (red line: no place breaking a stated constraint recommended) |
| `red_lines.ranking_by_rating_alone_present` | must be `false` to pass (red line: no ranking by rating alone) |
| `red_lines.unverified_listing_passed_as_confirmed_open_present` | must be `false` to pass (red line: no unverified listing passed as a confirmed open business) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward VERIFIED_PLACE_SHORTLIST_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/verified-place-shortlist`:

```json
{
  "shortlist_title": "Family Outing",
  "constraints": {
    "constraints_declared": true,
    "area_declared": true,
    "visit_timing_declared": true,
    "budget_constraint_declared": true,
    "noise_constraint_declared": true,
    "parking_constraint_declared": true,
    "accessibility_needs_declared": true,
    "candidates_searched_within_declared_constraints": true,
    "only_real_named_results_kept": true
  },
  "criteria": [
    {
      "criterion_id": "c1",
      "criterion_name": "Quiet"
    }
  ],
  "places": [
    {
      "place_id": "p1",
      "place_name": "Cafe A",
      "address": "123 Maple St",
      "address_verified_from_listing": true,
      "existence_confirmed": true,
      "hours_status": "same_day_verified",
      "verification_method": "Phone",
      "verification_date": "2023-10-01",
      "rating": 4.5,
      "review_count": 10,
      "recent_complaints_noted": true,
      "photo_checked": true,
      "criterion_ids_met": [
        "c1"
      ],
      "special_hours_noted_where_shown": true
    },
    {
      "place_id": "p2",
      "place_name": "Cafe B",
      "address": "456 Oak St",
      "address_verified_from_listing": true,
      "existence_confirmed": true,
      "hours_status": "same_day_verified",
      "verification_method": "Phone",
      "verification_date": "2023-10-01",
      "rating": 4.0,
      "review_count": 5,
      "recent_complaints_noted": true,
      "photo_checked": true,
      "criterion_ids_met": [
        "c1"
      ],
      "special_hours_noted_where_shown": true
    }
  ],
  "evaluation": {
    "rating_signals_read_critically": true,
    "fit_checked_beyond_rating": true
  },
  "ranking": {
    "ranking_recorded": true,
    "ranking_based_on_declared_criteria": true,
    "winner_place_id": "p1",
    "winner_rationale_recorded": true,
    "winner_drawback_recorded": true,
    "winner_map_ready_address_declared": true,
    "winner_hours_recorded": true,
    "winner_booking_or_queue_warning_recorded": true,
    "timing_matters": true,
    "backup_place_id": "p2"
  },
  "handling": {
    "hours_flagged_unverified_when_not_same_day_confirmed": true,
    "listings_checked_for_staleness_duplication_and_closure": true,
    "stale_duplicate_or_closed_listings_flagged": true,
    "no_unconfirmed_place_used_to_fill_gap": true,
    "original_area_has_no_verified_options": false
  },
  "red_lines": {
    "invented_address_hours_rating_or_photo_present": false,
    "stale_hours_presented_as_current_fact_present": false,
    "place_breaking_stated_constraint_recommended_present": false,
    "ranking_by_rating_alone_present": false,
    "unverified_listing_passed_as_confirmed_open_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 51 checks and a text stamp of the verdict):

```json
{
  "service": "verified-place-shortlist",
  "atom_version": "0.1.0",
  "shortlist_title": "Family Outing",
  "verdict": "VERIFIED_PLACE_SHORTLIST_SOUND",
  "sections": {
    "constraints_and_criteria": "pass",
    "place_rows_and_verification_evidence": "pass",
    "rating_signals_and_fit": "pass",
    "ranking_winner_and_backup": "pass",
    "freshness_uncertainty_and_alternatives": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "verified_places_count": 2,
  "verified_place_criteria_count": 1,
  "duplicate_verified_place_ids": [],
  "duplicate_verified_place_criterion_ids": [],
  "duplicate_verified_place_addresses": [],
  "verified_places_without_name": [],
  "verified_places_without_address": [],
  "verified_places_with_unrecognised_hours_status": [],
  "verified_places_without_verification_method": [],
  "verified_places_without_verification_date": [],
  "verified_places_with_invalid_rating": [],
  "verified_places_with_invalid_review_count": [],
  "verified_place_criteria_without_name": [],
  "verified_places_not_meeting_all_declared_criteria": [],
  "verified_places_with_extra_criterion_ids": [],
  "verified_places_total_review_count": "15.000000",
  "place_address_verification_ratio": "1.000000",
  "place_hours_same_day_verified_ratio": "1.000000",
  "place_criterion_coverage_ratio": "1.000000",
  "place_rating_evidence_ratio": "1.000000",
  "summary": "51 pass, 0 fail, 0 missing of 51 checks across six sections."
}
```

## Verdicts

- **VERIFIED_PLACE_SHORTLIST_SOUND** — every check passes; the declared place-shortlist record is complete and internally consistent with the skill's method, quality gates and red lines.
- **VERIFIED_PLACE_SHORTLIST_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `verified_places_count` and `verified_place_criteria_count` (integers, exactly; each null when its list is not declared), `duplicate_verified_place_ids`, `duplicate_verified_place_criterion_ids` and `duplicate_verified_place_addresses` (values carried by more than one row; each null when its list is not declared), `verified_places_without_name`, `verified_places_without_address`, `verified_places_with_unrecognised_hours_status`, `verified_places_without_verification_method`, `verified_places_without_verification_date`, `verified_places_with_invalid_rating`, `verified_places_with_invalid_review_count`, `verified_place_criteria_without_name`, `verified_places_not_meeting_all_declared_criteria` and `verified_places_with_extra_criterion_ids` (the offending rows for each computed rule; each null when its underlying list is not declared), `verified_places_total_review_count` (the sum of the declared review counts, as a string with exactly six decimal places; null when the places list is not declared), `place_address_verification_ratio` (places declaring their address verified from the listing ÷ declared places), `place_hours_same_day_verified_ratio` (places whose hours status is `same_day_verified` ÷ declared places), `place_criterion_coverage_ratio` (places meeting every declared criterion ÷ declared places; also null when the criteria list is not declared) and `place_rating_evidence_ratio` (places declaring both a rating and a review count ÷ declared places; each ratio a string with exactly six decimal places, and null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the twenty-two primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
