# Verified place shortlist — documentation

**Verified place shortlist** · slug `verified-place-shortlist` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment ee6a845a54d94e829dd0aad9f8cd9d41; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared place-shortlist record for completeness and internal consistency only, and recomputes the quantities the record itself declares. It surfaces two faces: REST `POST /v1/verified-place-shortlist` and MCP `POST /mcp/verified-place-shortlist`. The "verified" in this atom's name refers to the caller's declared verification discipline — the record's declared evidence that verification was performed — and never to any verification by this atom: it searches for no place, verifies no address, hour or rating against the world, recommends no place and ranks nothing — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/verified-place-shortlist/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment ee6a845a54d94e829dd0aad9f8cd9d41). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the shortlist "Family Outing"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "verified-place-shortlist"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the verified place shortlist manifest.** You declare a place-shortlist record for one shortlist, made from the shortlist as actually prepared — constraints declared, candidates searched within them, each place's verification evidence declared row by row, rating signals read critically, a winner and a backup recorded, and stale or unverified listings flagged honestly; the atom audits the declared record, it does not search for or verify any place for you (see Explanation). The recorded full-pass manifest declares the shortlist `Family Outing`: all nine constraint flags `true` (constraints declared; the area, visit-timing, budget, noise, parking and accessibility constraints declared; candidates searched within the declared constraints; only real named results kept); one criterion — `c1` (name `Quiet`); two places — `p1` (`Cafe A`, `123 Maple St`, rating 4.5, review_count 10) and `p2` (`Cafe B`, `456 Oak St`, rating 4.0, review_count 5) — both declaring `address_verified_from_listing` `true`, `existence_confirmed` `true`, `hours_status` `same_day_verified`, `verification_method` `Phone`, `verification_date` `2023-10-01`, `recent_complaints_noted` `true`, `photo_checked` `true`, `criterion_ids_met` `["c1"]` and `special_hours_noted_where_shown` `true`; both evaluation flags `true` (rating signals read critically, fit checked beyond rating); a ranking recorded and based on the declared criteria, with winner `p1`, winner rationale / drawback / map-ready address / hours / booking-or-queue warning recorded, `timing_matters` `true` and backup `p2`; four handling flags `true` with `original_area_has_no_verified_options` declared `false`, so the nearest-area check passes as not applicable and the manifest declares no `nearest_verified_area_offered` field at all; and all five red-line flags `false` (no invented address, hours, rating or photo; no stale hours presented as current fact; no place breaking a stated constraint recommended; no ranking by rating alone; no unverified listing passed as confirmed open).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/verified-place-shortlist` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `VERIFIED_PLACE_SHORTLIST_SOUND`: "51 pass, 0 fail, 0 missing of 51 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `verified_places_count` is 2, `verified_place_criteria_count` is 1, all thirteen duplicate / row-name lists are empty (`[]`), `verified_places_total_review_count` is `"15.000000"`, and `place_address_verification_ratio`, `place_hours_same_day_verified_ratio`, `place_criterion_coverage_ratio` and `place_rating_evidence_ratio` are each `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `VERIFIED_PLACE_SHORTLIST_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "verified-place-shortlist"}`.
3. Call: `POST https://atoms.pipavia.com/v1/verified-place-shortlist` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/verified-place-shortlist` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `verified_place_shortlist`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `VERIFIED_PLACE_SHORTLIST_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_verified_place_name_declared`, `every_verified_place_address_verified_from_listing`, `every_verified_place_review_count_positive`, and `verified_place_shortlist_free_of_invented_address_hours_rating_or_photo`, and the summary reads "47 pass, 4 fail, 0 missing of 51 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, place `p1` declares an empty `place_name`, named in `verified_places_without_name` as `["p1"]`, and declares `address_verified_from_listing` `false`; place `p2` declares `review_count` `0`, named in `verified_places_with_invalid_review_count` as `["p2"]`, which drops `verified_places_total_review_count` to `"10.000000"` and `place_address_verification_ratio` to `"0.500000"` while `place_hours_same_day_verified_ratio`, `place_criterion_coverage_ratio` and `place_rating_evidence_ratio` stay `"1.000000"`; and `red_lines.invented_address_hours_rating_or_photo_present` is declared `true`, failing the red-line check; sections `place_rows_and_verification_evidence`, `rating_signals_and_fit` and `red_lines` report `fail`, the other three sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). Declare only what is true of the actual shortlist: restore the real place name, record the true address-verification state, correct the review count to the count the listing actually declares, and record the true red-line state. For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a list is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "criteria",
  "detail": "criteria must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/verified-place-shortlist` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/verified-place-shortlist` — tool name `verified_place_shortlist`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `verified_place_shortlist` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `shortlist_title`, `criteria[].criterion_id`, `criteria[].criterion_name`, `places[].place_id`, `places[].place_name`, `places[].address`, `places[].hours_status`, `places[].verification_method`, `places[].verification_date`, `ranking.winner_place_id` and `ranking.backup_place_id` are noted as strings (the name / address / method / date fields as non-empty strings), `places[].rating` and `places[].review_count` as numbers, `criteria` and `places` as lists, and `places[].criterion_ids_met` as a list of strings there. Where SERVICE.md states no type — the section container objects (`constraints`, `evaluation`, `ranking`, `handling`, `red_lines`) and the row objects (`criteria[]`, `places[]`) — the type below is grounded in the recorded evidence inputs and the recorded MCP `inputSchema` (evidence.json `mcp_tools`), which types the containers `object` and the `criteria` and `places` lists `array`, and is said so in the row note. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `VERIFIED_PLACE_SHORTLIST_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, as SERVICE.md groups them — with the multi-section rows named where they occur: the `criteria` list is also read by `rating_signals_and_fit` (the criterion-mapping and coverage checks read the declared criteria), and the `places` rows are also read by `rating_signals_and_fit`, `ranking_winner_and_backup` and `freshness_uncertainty_and_alternatives`, as the row groups below name. The tables below carry 58 typed fields in total.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `shortlist_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: constraints_and_criteria

| Field | Type | Notes |
|---|---|---|
| `constraints` | object | The constraints section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `constraints.constraints_declared` | boolean | — |
| `constraints.area_declared` | boolean | — |
| `constraints.visit_timing_declared` | boolean | — |
| `constraints.budget_constraint_declared` | boolean | — |
| `constraints.noise_constraint_declared` | boolean | — |
| `constraints.parking_constraint_declared` | boolean | — |
| `constraints.accessibility_needs_declared` | boolean | — |
| `constraints.candidates_searched_within_declared_constraints` | boolean | — |
| `constraints.only_real_named_results_kept` | boolean | — |
| `criteria` | list | List of criterion-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list). Also read by `rating_signals_and_fit` |
| `criteria[]` | object | One declared criterion row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `criteria[].criterion_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `criteria[].criterion_name` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |

#### Read by: place_rows_and_verification_evidence

| Field | Type | Notes |
|---|---|---|
| `places` | list | List of place-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list). Also read by `rating_signals_and_fit`, `ranking_winner_and_backup` and `freshness_uncertainty_and_alternatives` |
| `places[]` | object | One declared place row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `places[].place_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `places[].place_name` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |
| `places[].address` | string | Computed — must be non-empty on every row and unique per row (type stated in SERVICE.md as a non-empty string) |
| `places[].address_verified_from_listing` | boolean | Computed — must be `true` on every row |
| `places[].existence_confirmed` | boolean | Computed — must be `true` on every row |
| `places[].hours_status` | string | Computed — one of `same_day_verified`, `flagged_unverified` (type stated in SERVICE.md) |
| `places[].verification_method` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |
| `places[].verification_date` | string | Computed — must be non-empty on every row; the declared freshness of the evidence, never checked against the world (type stated in SERVICE.md as a non-empty string) |

#### Read by: rating_signals_and_fit

| Field | Type | Notes |
|---|---|---|
| `places[].rating` | number | Computed — must be non-negative on every row; evidence only, never judged good or bad (type stated in SERVICE.md). Sits on the place rows but is read by this section, as SERVICE.md groups it |
| `places[].review_count` | number | Computed — must be positive on every row (type stated in SERVICE.md). Sits on the place rows but is read by this section, as SERVICE.md groups it |
| `places[].recent_complaints_noted` | boolean | Computed — must be `true` on every row. Sits on the place rows but is read by this section, as SERVICE.md groups it |
| `places[].photo_checked` | boolean | Computed — must be `true` on every row. Sits on the place rows but is read by this section, as SERVICE.md groups it |
| `places[].criterion_ids_met` | list of strings | Computed — must name exactly the declared criteria, see the Checks section (type stated in SERVICE.md). Sits on the place rows but is read by this section, as SERVICE.md groups it |
| `evaluation` | object | The evaluation section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `evaluation.rating_signals_read_critically` | boolean | — |
| `evaluation.fit_checked_beyond_rating` | boolean | — |

#### Read by: ranking_winner_and_backup

| Field | Type | Notes |
|---|---|---|
| `ranking` | object | The ranking section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `ranking.ranking_recorded` | boolean | — |
| `ranking.ranking_based_on_declared_criteria` | boolean | — |
| `ranking.winner_place_id` | string | Computed — must name a declared place; only that the reference resolves is checked, never that the winner is the best or highest-rated place (type stated in SERVICE.md) |
| `ranking.winner_rationale_recorded` | boolean | — |
| `ranking.winner_drawback_recorded` | boolean | — |
| `ranking.winner_map_ready_address_declared` | boolean | — |
| `ranking.winner_hours_recorded` | boolean | — |
| `ranking.winner_booking_or_queue_warning_recorded` | boolean | — |
| `ranking.timing_matters` | boolean | Gates the backup check below |
| `ranking.backup_place_id` | string | Computed where timing matters — must name a declared place other than the winner (type stated in SERVICE.md) |

#### Read by: freshness_uncertainty_and_alternatives

| Field | Type | Notes |
|---|---|---|
| `places[].special_hours_noted_where_shown` | boolean | Computed — must be `true` on every row. Sits on the place rows but is read by this section, as SERVICE.md groups it |
| `handling` | object | The handling section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `handling.hours_flagged_unverified_when_not_same_day_confirmed` | boolean | — |
| `handling.listings_checked_for_staleness_duplication_and_closure` | boolean | — |
| `handling.stale_duplicate_or_closed_listings_flagged` | boolean | — |
| `handling.no_unconfirmed_place_used_to_fill_gap` | boolean | — |
| `handling.original_area_has_no_verified_options` | boolean | Gates the nearest-area check below |
| `handling.nearest_verified_area_offered` | boolean | Required when `handling.original_area_has_no_verified_options` is declared `true`; otherwise the check that reads it passes as not applicable — the recorded full-pass manifest omits this field entirely (its gate is declared `false`) and the check passes |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.invented_address_hours_rating_or_photo_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.stale_hours_presented_as_current_fact_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.place_breaking_stated_constraint_recommended_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.ranking_by_rating_alone_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unverified_listing_passed_as_confirmed_open_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 51 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Note on the gated checks: the two gated checks behave differently in their recorded evidence text — the backup check's text varies with its state, while the nearest-area check carries the same recorded evidence text, "the original area is not declared to have no verified options", in both its full-pass `pass` state and its sparse-run `missing` state — see Discrepancies.

#### Section: constraints_and_criteria

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `verified_place_shortlist_constraints_declared` | constraints: the shortlist record declares the constraints it worked to, written down first | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_area_constraint_declared` | constraints: the area constraint is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_visit_timing_constraint_declared` | constraints: the visit timing — the day and time the places must be open for — is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_budget_constraint_declared` | constraints: the budget constraint is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_noise_constraint_declared` | constraints: the noise constraint is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_parking_constraint_declared` | constraints: the parking constraint is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_accessibility_needs_declared` | constraints: the accessibility needs are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_candidates_searched_within_constraints` | search discipline: candidate places were searched for inside the declared constraints | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_only_real_named_results_kept` | search discipline: only real, named results were kept as candidates | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_criteria_list_declared` | criteria: the declared record names its shortlist criteria — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all | Computed over the declared record. Pass: the `criteria` list is present and names at least one criterion. Fail: the list is present but empty. Missing: the list is absent. |
| `every_verified_place_criterion_id_unique` | criteria: no declared criterion_id is owned by more than one row | Computed over the declared record. Pass: no declared `criterion_id` appears on more than one row. Fail: a `criterion_id` is declared on more than one row (duplicates are named in `duplicate_verified_place_criterion_ids`). Missing: the list is absent, or a row has `criterion_id` absent. |
| `every_verified_place_criterion_name_declared` | criteria: every declared criterion declares a non-empty criterion name | Computed over the declared record. Pass: every declared criterion row declares a non-empty `criterion_name`. Fail: a row declares an empty name (offending rows are named in `verified_place_criteria_without_name`). Missing: the list is absent, or a row has `criterion_name` absent. |

#### Section: place_rows_and_verification_evidence

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `verified_place_shortlist_places_list_declared` | places: the declared record names its shortlisted places — the list is present and names at least two places; an absent list is missing evidence and a list of fewer than two declares no shortlist to rank and no backup to keep | Computed over the declared record. Pass: the `places` list is present and names at least two places. Fail: the list is present with fewer than two places. Missing: the list is absent. |
| `every_verified_place_id_unique` | places: no declared place_id is owned by more than one row | Computed over the declared record. Pass: no declared `place_id` appears on more than one row. Fail: a `place_id` is declared on more than one row (duplicates are named in `duplicate_verified_place_ids`). Missing: the list is absent, or a row has `place_id` absent. |
| `every_verified_place_name_declared` | places: every declared place declares a non-empty place name — every recommended place is a real, named result | Computed over the declared record. Pass: every declared place row declares a non-empty `place_name`. Fail: a row declares an empty name (offending rows are named in `verified_places_without_name`). Missing: the list is absent, or a row has `place_name` absent. |
| `every_verified_place_address_declared` | places: every declared place declares a non-empty address | Computed over the declared record. Pass: every declared place row declares a non-empty `address`. Fail: a row declares an empty address (offending rows are named in `verified_places_without_address`). Missing: the list is absent, or a row has `address` absent. |
| `every_verified_place_address_unique` | places: no declared address is shared by more than one row — a duplicated address is the duplicate-listing signal the record must flag, not repeat | Computed over the declared record. Pass: no declared `address` appears on more than one row. Fail: an `address` is declared on more than one row (duplicates are named in `duplicate_verified_place_addresses`). Missing: the list is absent, or a row has `address` absent. |
| `every_verified_place_address_verified_from_listing` | verification evidence: every declared place declares its address verified from the listing itself | Computed over the declared record. Pass: every declared place row declares `address_verified_from_listing` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `every_verified_place_existence_confirmed` | verification evidence: every declared place declares its existence confirmed — no gap is filled with a place whose existence was not confirmed | Computed over the declared record. Pass: every declared place row declares `existence_confirmed` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `every_verified_place_hours_status_recognised` | verification evidence: every declared place's hours status is one of same_day_verified, flagged_unverified — hours are same-day verified or explicitly flagged unverified, with no third state | Computed over the declared record. Pass: every declared place's `hours_status` is one of `same_day_verified`, `flagged_unverified`. Fail: a row declares any other value (offending rows are named in `verified_places_with_unrecognised_hours_status`). Missing: the list is absent, or a row has `hours_status` absent. |
| `every_verified_place_verification_method_declared` | verification evidence: every declared place declares a non-empty verification method — how its evidence was verified is part of the record | Computed over the declared record. Pass: every declared place row declares a non-empty `verification_method`. Fail: a row declares an empty method (offending rows are named in `verified_places_without_verification_method`). Missing: the list is absent, or a row has `verification_method` absent. |
| `every_verified_place_verification_date_declared` | verification evidence: every declared place declares a non-empty verification date — the freshness of its evidence is part of the record | Computed over the declared record. Pass: every declared place row declares a non-empty `verification_date`. Fail: a row declares an empty date (offending rows are named in `verified_places_without_verification_date`). Missing: the list is absent, or a row has `verification_date` absent. |

#### Section: rating_signals_and_fit

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `verified_place_shortlist_rating_signals_read_critically` | rating signals: the rating signals were read critically, not taken as a star number alone | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_fit_checked_beyond_rating` | rating signals: fit against the declared constraints was checked beyond the rating | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_verified_place_rating_declared` | rating signals: every declared place declares a non-negative rating value | Computed over the declared record. Pass: every declared place declares a non-negative `rating`. Fail: a row declares a negative rating (offending rows are named in `verified_places_with_invalid_rating`). Missing: the list is absent, or a row has `rating` absent. |
| `every_verified_place_review_count_positive` | rating signals: every declared place declares a positive review count — rating signals carry review volume, and a count of zero declares no volume at all | Computed over the declared record. Pass: every declared place declares a positive `review_count`. Fail: a row declares zero or a negative count (offending rows are named in `verified_places_with_invalid_review_count`). Missing: the list is absent, or a row has `review_count` absent. |
| `every_verified_place_recent_complaints_noted` | rating signals: every declared place declares what its recent reviews actually complain about noted | Computed over the declared record. Pass: every declared place row declares `recent_complaints_noted` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `every_verified_place_photo_checked` | photo evidence: every declared place declares its photo evidence checked, to judge space, seating and condition | Computed over the declared record. Pass: every declared place row declares `photo_checked` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `every_verified_place_criterion_mapping_declared` | criterion mapping: every declared place declares its criterion mapping — the declared criteria it meets | Computed over the declared record. Pass: every declared place row declares its `criterion_ids_met` list. Fail: — (an undeclared mapping is missing evidence, not a failure). Missing: the list is absent, or a row has `criterion_ids_met` absent. |
| `every_verified_place_criterion_mapping_names_only_declared_criteria` | criterion mapping: every declared place's criterion mapping names only declared criteria — no other criterion, and none twice in the coverage check below | Computed over the declared record. Pass: every declared place's `criterion_ids_met` names no criterion other than a declared one. Fail: a mapping names an undeclared criterion (offending rows are named in `verified_places_with_extra_criterion_ids`). Missing: a row's mapping is absent, or the `criteria` list is absent. |
| `every_verified_place_meets_all_declared_criteria` | criterion coverage: every declared place meets every declared criterion — the shortlist respects every constraint stated, and no shortlisted place breaks one | Computed over the declared record. Pass: every declared place's `criterion_ids_met` covers every declared criterion. Fail: a place does not meet every declared criterion (offending rows are named in `verified_places_not_meeting_all_declared_criteria`). Missing: a row's mapping is absent, or the `criteria` list is absent. |

#### Section: ranking_winner_and_backup

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `verified_place_shortlist_ranking_recorded` | ranking: the shortlist record records a ranking of its declared places | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_ranking_based_on_declared_criteria` | ranking: the recorded ranking is based on the declared criteria and constraints, not on rating alone | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_winner_rationale_recorded` | winner: the record records why the declared winner wins | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_winner_drawback_recorded` | winner: one honest drawback for the top pick is recorded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_winner_map_ready_address_declared` | winner: the winner's address is declared in map-ready form | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_winner_hours_recorded` | winner: the winner's hours for the day in question are recorded, or flagged unverified in its row | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_winner_booking_or_queue_warning_recorded` | winner: any booking or queue warning for the winner is recorded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_winner_resolves_to_declared_place` | winner: the declared winner place id names one of the declared places — the atom checks only that the reference resolves; it never checks that the winner is the best or highest-rated place | Computed over the declared record. Pass: `ranking.winner_place_id` names one of the declared places — only that the reference resolves; it is never compared against ratings or ranking. Fail: the id names no declared place. Missing: the winner id is absent, or the `places` list is absent. |
| `verified_place_shortlist_backup_resolves_and_differs_where_timing_matters` | backup: where timing matters, the declared backup place id names a declared place other than the winner — one backup option is kept in case the winner is closed or full | Computed-gated over the declared record. Pass: `ranking.timing_matters` is declared `false` (the check passes as not applicable), or the gate is declared `true` and `ranking.backup_place_id` names a declared place other than the winner. Fail: the gate is declared `true` and the backup id names no declared place, or names the winner itself. Missing: the gate field is absent, or the gate is declared `true` and the backup id is absent. |

#### Section: freshness_uncertainty_and_alternatives

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `verified_place_shortlist_hours_flagged_unverified_when_not_same_day_confirmed` | freshness: hours that could not be confirmed for the same day are flagged unverified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_listings_checked_for_staleness_duplication_and_closure` | freshness: the listings were checked for staleness, duplication and possible closure | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_stale_duplicate_or_closed_listings_flagged` | freshness: any listing that looks stale, duplicated or possibly closed is flagged as such in the record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_no_unconfirmed_place_used_to_fill_gap` | uncertainty: no gap in the shortlist was filled with a place whose existence was not confirmed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `verified_place_shortlist_nearest_verified_area_offered_where_no_verified_options` | the original area is not declared to have no verified options | Computed-gated over the declared record. Pass: `handling.original_area_has_no_verified_options` is declared `false` (the check passes as not applicable — the recorded full-pass manifest omits `handling.nearest_verified_area_offered` and still passes), or the gate is declared `true` and `handling.nearest_verified_area_offered` is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate field is absent, or the gate is declared `true` and the field is absent. |
| `every_verified_place_special_hours_noted_where_shown` | freshness: every declared place declares holiday or special hours noted where shown for the day in question | Computed over the declared record. Pass: every declared place row declares `special_hours_noted_where_shown` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `verified_place_shortlist_free_of_invented_address_hours_rating_or_photo` | red line: no invented address, opening hour, rating or photo description is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `verified_place_shortlist_free_of_stale_hours_presented_as_current_fact` | red line: no stale hours are presented as current fact in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `verified_place_shortlist_free_of_place_breaking_stated_constraint_recommended` | red line: no place that breaks a stated constraint is recommended in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `verified_place_shortlist_free_of_ranking_by_rating_alone` | red line: no ranking by rating alone, without checking fit and review volume, is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `verified_place_shortlist_free_of_unverified_listing_passed_as_confirmed_open` | red line: no unverified listing is passed off as a confirmed open business in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object, with these top-level fields in the recorded order:

- `service` (`"verified-place-shortlist"`), `atom_version` (`"0.1.0"`), and `shortlist_title` (the manifest's declared shortlist title, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `verified_places_count` and `verified_place_criteria_count` (the declared list lengths as integers, exactly, or null when the list is not declared); `duplicate_verified_place_ids`, `duplicate_verified_place_criterion_ids` and `duplicate_verified_place_addresses` (values carried by more than one row; each null when its underlying list is not declared, as recorded in the sparse case); `verified_places_without_name`, `verified_places_without_address`, `verified_places_with_unrecognised_hours_status`, `verified_places_without_verification_method`, `verified_places_without_verification_date`, `verified_places_with_invalid_rating`, `verified_places_with_invalid_review_count`, `verified_place_criteria_without_name`, `verified_places_not_meeting_all_declared_criteria` and `verified_places_with_extra_criterion_ids` (the offending rows for each computed rule; each null when its underlying list is not declared, as recorded in the sparse case); `verified_places_total_review_count` (the sum of the declared review counts — a string with exactly six decimal places; null when the places list is not declared, as recorded in the sparse case); and the ratios `place_address_verification_ratio` (places declaring their address verified from the listing ÷ declared places), `place_hours_same_day_verified_ratio` (places whose hours status is `same_day_verified` ÷ declared places), `place_criterion_coverage_ratio` (places meeting every declared criterion ÷ declared places) and `place_rating_evidence_ratio` (places declaring both a rating and a review count ÷ declared places) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty, and the criterion-coverage ratio is also null when the criteria list is not declared. Computed quantities use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "51 pass, 0 fail, 0 missing of 51 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared shortlist title, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `VERIFIED_PLACE_SHORTLIST_SOUND` — all 51 checks pass: the declared place-shortlist record is complete and internally consistent with the skill's method and red lines.
- `VERIFIED_PLACE_SHORTLIST_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only — the twenty-two primary computed checks named in SERVICE.md): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the twenty-two primary computed checks cannot be completed because the rows or fields it reads are absent (as recorded in the sparse case).

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for the gated checks, including passes as not applicable when their gate is off); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `verified_places_count`, `verified_place_criteria_count`, the three duplicate lists, the ten row-name lists, `verified_places_total_review_count`, `place_address_verification_ratio`, `place_hours_same_day_verified_ratio`, `place_criterion_coverage_ratio` and `place_rating_evidence_ratio` — each defined in Output format above, with the values and null rules recorded there (21 computed fields in total, including `computed_status`).

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"criteria","detail":"criteria must be a list"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = query (one query = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Find and compare real places — with verified address, hours, and rating signals matched to your constraints (the bound capability, from the skill). You submit one declared record — the verified place shortlist manifest, made from the shortlist as actually prepared — and the atom audits that record for completeness and internal consistency against the bound skill's method and red lines, and recomputes the quantities the record itself declares, returning one deterministic verdict across 6 sections (`constraints_and_criteria`, `place_rows_and_verification_evidence`, `rating_signals_and_fit`, `ranking_winner_and_backup`, `freshness_uncertainty_and_alternatives`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. The "verified" in the atom's name refers to the caller's declared verification discipline, never to any verification by this atom. This atom shares zero checks with its nearest siblings `sourced-visual-reference-search` (a declared visual-reference search record), `single-living-trip-itinerary` (one trip's living itinerary record) and `home-shortlist-carrying-cost-comparison` (a home-purchase shortlist's carrying-cost comparison) (SERVICE.md, Distinct ground): every check here is a place-shortlist question — declared visit constraints (area, timing, budget, noise, parking, accessibility) and shortlist criteria, per-place declared verification evidence (address verified from the listing itself, hours status same-day-verified or flagged-unverified, verification method and verification date, rating with review volume and recent complaints, photo checked), every shortlisted place meeting every declared criterion, a declared winner that resolves with its honest drawback, map-ready address and booking / queue warning, a backup that resolves and differs where timing matters, and stale / duplicate / closed listing flagging.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Four kinds of checks combine. *Attestation checks* (22) read a single declared boolean: declared `true` passes; present-but-`false` fails; absent is `missing`. *Computed checks* (twenty-two primary, per SERVICE.md) are calculated from the declared rows and values themselves — the criteria list must name at least one criterion with unique ids and non-empty names; the places list must name at least two places with unique ids and unique addresses, non-empty names, addresses, verification methods and verification dates, every row declaring its address verified from the listing and its existence confirmed, and every hours status one of the two recognised states; every place must declare a non-negative rating, a positive review count, recent complaints noted and photo checked, and its criterion mapping must name only declared criteria and cover every declared criterion; the winner id must name a declared place; and every place must declare special hours noted where shown — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *Gated checks* (2) follow the skill's own conditional scope: the backup is required only where `ranking.timing_matters` is declared `true`, and the nearest verified area only where `handling.original_area_has_no_verified_options` is declared `true`; with a gate declared `false` the check passes as not applicable, and with the gate absent the check is missing evidence. *Red-line checks* (5) read a single declared anti-pattern boolean inverted: declared `false` passes; declared `true` fails; absent is `missing`. Aggregation is strict: any `fail` anywhere produces `VERIFIED_PLACE_SHORTLIST_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `VERIFIED_PLACE_SHORTLIST_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are constraint fit, declared verification discipline and honest flagging, not bars the atom can set. Declined, named, exactly as SERVICE.md names them: a minimum rating or star bar (a declared rating is evidence, never judged good or bad); a minimum review count beyond existence (any positive count passes — no volume bar such as 50 or 100 reviews is set); a maximum age for a verification date, or any check that a declared verification date is recent, today, or the visit day (dates are caller-declared strings, reported as declared — the atom has no clock and verifies no date against the world); a budget or price ceiling (no price is even a field of this record); a distance, travel-time or area-radius bar; a place-count maximum, or a criterion-count bar beyond at least one criterion and at least two places; a conformity bar against any places provider, listing source or map service (the record declares its own verification method — no provider is prescribed); and any judgment that the declared winner is the right, best or highest-rated place (only that its reference resolves and its declared winner record is complete). Quantities are computed and reported; the only bars on the computed rows are completeness, exact set coverage and reference resolution over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** place-shortlist record: a verdict of `VERIFIED_PLACE_SHORTLIST_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its addresses verified, its hours same-day checked and its criteria met passes those checks even if the real shortlist did none of it. It is a completeness and consistency audit of the shortlist record the skill requires, **not a place search, a live verification, a recommendation, or a guarantee that any place exists, is open, or is as described**: it never judges whether a declared address is real, whether declared hours are correct, whether a declared rating is fair, or whether the declared winner should be visited — only that the record contains what the skill's method and red lines demand, and that its declared rows are internally consistent. Named exclusions: searching live for places (any places API, search engine or map lookup); verifying any address, opening hour, rating, review, photo or business existence against the world; claiming — in the verdict, the stamp, or anywhere else — that this atom verified a place; recommending or choosing a place for the caller; ranking places as the atom's own output (checking a **declared** winner and backup's references is audit, not advice); booking, reserving or queuing for any place; judging that the declared winner is the best, highest-rated or top-ranked place; and providing navigation or directions. Boundary case, named in SERVICE.md: a shortlist with genuinely only one verified place in its area cannot pass this record format's places-declared check (the format requires at least two compared places with a backup kept — such a shortlist is outside this atom's computed reach, not failed on its merits; its record's honest move under the skill is the nearest-verified-area declaration, which this atom does check where declared).

**Buyer and use context.** Teams and agents working in Everyday life who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Family outing travel place shortlists (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was screened under U-13 as **(a) — screen-No outright**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: the keyword screen names places, addresses, opening hours and ratings — no regulated subject (securities / financial advice, health, legal, engineering practice, psychology) is the atom's output, and no place category handled by this record is itself a regulated activity: the record is about cafes, shops, services and attractions as visit options. The substance screen: this atom's output could not itself read as regulated professional advice in any case — it audits a caller-**declared** shortlist record for completeness and internal consistency only (constraints and criteria declarations, per-row declared verification evidence recomputed over the declared rows, criterion coverage, winner / backup reference resolution, freshness and uncertainty declarations, and the skill's red lines refused); every output is a pass / fail / missing verdict on the record or a quantity recomputed from the caller's own declared rows. It performs no live search or verification, makes no recommendation, and states no fact about any real place, so there is no advice-shaped output for a flag-with-controls class to attach to; the one real hazard — a caller reading "verified" as this atom's own live verification — is closed by the honesty line in SERVICE.md's What it delivers, which is a red line of the atom, not a control on a regulated output. This is therefore class (a), not the census flag-with-controls class and not the genuinely-open personal-financial-snapshot class (no personal position of any kind is handled).

### For integrators (Users)

You need: a gateway key with the `verified_place_shortlist` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed quantities and ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/verified_place_shortlist.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_verified_place_shortlist.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/verified-place-shortlist` (REST) and `POST /mcp/verified-place-shortlist` (MCP, tool `verified_place_shortlist`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment ee6a845a54d94e829dd0aad9f8cd9d41; RC soak to 2026-11-22). Key scope: `verified_place_shortlist`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment ee6a845a54d94e829dd0aad9f8cd9d41) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names differ from the leaf name of the input field they read — the attestation names carry the `verified_place_shortlist_` prefix, in three cases with a leaf that differs from the field's own leaf (for example `verified_place_shortlist_area_constraint_declared` reads `constraints.area_declared`; `verified_place_shortlist_visit_timing_constraint_declared` reads `constraints.visit_timing_declared`; `verified_place_shortlist_candidates_searched_within_constraints` reads `constraints.candidates_searched_within_declared_constraints`), the row-computed names carry an `every_verified_place_` form (for example `every_verified_place_address_verified_from_listing` reads the place rows' `address_verified_from_listing` values), and the five red-line checks are phrased as freedoms (for example `verified_place_shortlist_free_of_invented_address_hours_rating_or_photo` reads `red_lines.invented_address_hours_rating_or_photo_present`). The twenty-two computed checks and the two gated checks have no single same-named field at all. Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`constraints`, `evaluation`, `ranking`, `handling`, `red_lines`) or for a row object (`criteria[]`, `places[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and the recorded MCP `inputSchema`, and are said so there. The recorded MCP `inputSchema` lists only the eight top-level properties (`shortlist_title`, `constraints`, `criteria`, `places`, `evaluation`, `ranking`, `handling`, `red_lines`) and types `criteria` and `places` as `array`, agreeing with SERVICE.md's table and every recorded input — the nested row and leaf types rest on the recorded evidence inputs and SERVICE.md's table, not on the schema.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 51 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md for the list and total outputs:** SERVICE.md's output paragraph states the null rules for `computed_status`, `verified_places_count`, `verified_place_criteria_count` and the four ratios, but it does not state a null rule for the three duplicate lists, the ten row-name lists, or `verified_places_total_review_count`. The recorded sparse response returns all of those as `null` when the underlying lists are not declared (as the Output format section records); this document follows the recording.
6. **Section groupings splitting and merging the input objects:** the recorded sections do not map one-to-one onto input objects. The single `places` list is read by four recorded sections — `place_rows_and_verification_evidence` (the row identity and verification-evidence fields), `rating_signals_and_fit` (the rows' `rating`, `review_count`, `recent_complaints_noted`, `photo_checked` and `criterion_ids_met` fields, which SERVICE.md groups under that section although they sit on the place rows), `ranking_winner_and_backup` (the winner-resolution check reads the declared place ids) and `freshness_uncertainty_and_alternatives` (the rows' `special_hours_noted_where_shown` field) — and the `criteria` list is read by two (`constraints_and_criteria` and, for the mapping and coverage checks, `rating_signals_and_fit`), while `freshness_uncertainty_and_alternatives` merges the `handling` object with a place-row field and the `evaluation` object has no section of its own (its two checks sit in `rating_signals_and_fit`). This document groups the Input reference and the Checks by the recorded section names, with those splittings named in place.
7. **The two gated checks' evidence texts behave differently:** the evidence text quoted in the Checks section is the full-pass run's text. For the backup check, `verified_place_shortlist_backup_resolves_and_differs_where_timing_matters`, the recorded sparse run carries a different evidence string — "timing does not matter for this visit" — with status `missing` (its gate field is absent, not declared `false`, although the string reads as a gate-off statement), against the full-pass run's requirement text with status `pass`. For the nearest-area check, `verified_place_shortlist_nearest_verified_area_offered_where_no_verified_options`, the recorded sparse run carries the identical evidence string — "the original area is not declared to have no verified options" — with status `missing` (its gate field is absent) as the full-pass run carries with status `pass` (its gate is declared `false` and the target field is absent from the manifest entirely). No single evidence-text rule covers both gated checks; the Checks section says so at its head.
8. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (5 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named a prose phrase (`Address verified per place`) and an input field path (`red_lines.invented_address_hours_rating_or_photo_present`) instead of exact check names (R1 ×2); the full-pass and violations `expect` blocks carried no structured `computed_spot_checks` (R2 ×2); and the designed violations input was missing the key paths present in the full-pass manifest (R3 ×1). These are unscored design prose: the corrections were applied before execution (judgment.json records 0 tester errors at the judgment stage), and where the corrected-away design prose differed, the recorded responses govern.
9. **DeepSeek's "integers, exactly" observation (an observation, not a disagreement):** SERVICE.md's output paragraph says the declared counts are "reported as integers, exactly" in the same passage that reports `verified_places_total_review_count` (the sum of the declared review counts), and that field is in fact serialized as a string with exactly six decimal places (`"15.000000"` / `"10.000000"`) under the fixed `_fmt6` serialization both implementations use. The DeepSeek second read (TEST-REPORT.md; `verification/work/verified-place-shortlist/deepseek-raw.txt`) raised exactly this as a minor spec-wording observation and scored the value a match in both cases (15 and 10 recompute correctly); the integer phrase attaches to `verified_places_count` and `verified_place_criteria_count`, which are indeed reported as integers. No recount was required and no numeric inconsistency is claimed by any tester; the wording sits as recorded in SERVICE.md and is named here so a reader is not misled by it.

## Worked examples

Provenance: recorded 2026-11-16T15:24:37.068556+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/verified-place-shortlist/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T15:24:37.068556+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/verified-place-shortlist/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_constraints_declared",
      "status": "pass",
      "evidence": "constraints: the shortlist record declares the constraints it worked to, written down first"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_area_constraint_declared",
      "status": "pass",
      "evidence": "constraints: the area constraint is declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_visit_timing_constraint_declared",
      "status": "pass",
      "evidence": "constraints: the visit timing \u2014 the day and time the places must be open for \u2014 is declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_budget_constraint_declared",
      "status": "pass",
      "evidence": "constraints: the budget constraint is declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_noise_constraint_declared",
      "status": "pass",
      "evidence": "constraints: the noise constraint is declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_parking_constraint_declared",
      "status": "pass",
      "evidence": "constraints: the parking constraint is declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_accessibility_needs_declared",
      "status": "pass",
      "evidence": "constraints: the accessibility needs are declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_candidates_searched_within_constraints",
      "status": "pass",
      "evidence": "search discipline: candidate places were searched for inside the declared constraints"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_only_real_named_results_kept",
      "status": "pass",
      "evidence": "search discipline: only real, named results were kept as candidates"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_criteria_list_declared",
      "status": "pass",
      "evidence": "criteria: the declared record names its shortlist criteria \u2014 the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all"
    },
    {
      "section": "constraints_and_criteria",
      "check": "every_verified_place_criterion_id_unique",
      "status": "pass",
      "evidence": "criteria: no declared criterion_id is owned by more than one row"
    },
    {
      "section": "constraints_and_criteria",
      "check": "every_verified_place_criterion_name_declared",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-empty criterion name"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "verified_place_shortlist_places_list_declared",
      "status": "pass",
      "evidence": "places: the declared record names its shortlisted places \u2014 the list is present and names at least two places; an absent list is missing evidence and a list of fewer than two declares no shortlist to rank and no backup to keep"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_id_unique",
      "status": "pass",
      "evidence": "places: no declared place_id is owned by more than one row"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_name_declared",
      "status": "pass",
      "evidence": "places: every declared place declares a non-empty place name \u2014 every recommended place is a real, named result"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_address_declared",
      "status": "pass",
      "evidence": "places: every declared place declares a non-empty address"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_address_unique",
      "status": "pass",
      "evidence": "places: no declared address is shared by more than one row \u2014 a duplicated address is the duplicate-listing signal the record must flag, not repeat"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_address_verified_from_listing",
      "status": "pass",
      "evidence": "verification evidence: every declared place declares its address verified from the listing itself"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_existence_confirmed",
      "status": "pass",
      "evidence": "verification evidence: every declared place declares its existence confirmed \u2014 no gap is filled with a place whose existence was not confirmed"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_hours_status_recognised",
      "status": "pass",
      "evidence": "verification evidence: every declared place's hours status is one of same_day_verified, flagged_unverified \u2014 hours are same-day verified or explicitly flagged unverified, with no third state"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_verification_method_declared",
      "status": "pass",
      "evidence": "verification evidence: every declared place declares a non-empty verification method \u2014 how its evidence was verified is part of the record"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_verification_date_declared",
      "status": "pass",
      "evidence": "verification evidence: every declared place declares a non-empty verification date \u2014 the freshness of its evidence is part of the record"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "verified_place_shortlist_rating_signals_read_critically",
      "status": "pass",
      "evidence": "rating signals: the rating signals were read critically, not taken as a star number alone"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "verified_place_shortlist_fit_checked_beyond_rating",
      "status": "pass",
      "evidence": "rating signals: fit against the declared constraints was checked beyond the rating"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_rating_declared",
      "status": "pass",
      "evidence": "rating signals: every declared place declares a non-negative rating value"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_review_count_positive",
      "status": "pass",
      "evidence": "rating signals: every declared place declares a positive review count \u2014 rating signals carry review volume, and a count of zero declares no volume at all"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_recent_complaints_noted",
      "status": "pass",
      "evidence": "rating signals: every declared place declares what its recent reviews actually complain about noted"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_photo_checked",
      "status": "pass",
      "evidence": "photo evidence: every declared place declares its photo evidence checked, to judge space, seating and condition"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_criterion_mapping_declared",
      "status": "pass",
      "evidence": "criterion mapping: every declared place declares its criterion mapping \u2014 the declared criteria it meets"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_criterion_mapping_names_only_declared_criteria",
      "status": "pass",
      "evidence": "criterion mapping: every declared place's criterion mapping names only declared criteria \u2014 no other criterion, and none twice in the coverage check below"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_meets_all_declared_criteria",
      "status": "pass",
      "evidence": "criterion coverage: every declared place meets every declared criterion \u2014 the shortlist respects every constraint stated, and no shortlisted place breaks one"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_ranking_recorded",
      "status": "pass",
      "evidence": "ranking: the shortlist record records a ranking of its declared places"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_ranking_based_on_declared_criteria",
      "status": "pass",
      "evidence": "ranking: the recorded ranking is based on the declared criteria and constraints, not on rating alone"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_rationale_recorded",
      "status": "pass",
      "evidence": "winner: the record records why the declared winner wins"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_drawback_recorded",
      "status": "pass",
      "evidence": "winner: one honest drawback for the top pick is recorded"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_map_ready_address_declared",
      "status": "pass",
      "evidence": "winner: the winner's address is declared in map-ready form"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_hours_recorded",
      "status": "pass",
      "evidence": "winner: the winner's hours for the day in question are recorded, or flagged unverified in its row"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_booking_or_queue_warning_recorded",
      "status": "pass",
      "evidence": "winner: any booking or queue warning for the winner is recorded"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_resolves_to_declared_place",
      "status": "pass",
      "evidence": "winner: the declared winner place id names one of the declared places \u2014 the atom checks only that the reference resolves; it never checks that the winner is the best or highest-rated place"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_backup_resolves_and_differs_where_timing_matters",
      "status": "pass",
      "evidence": "backup: where timing matters, the declared backup place id names a declared place other than the winner \u2014 one backup option is kept in case the winner is closed or full"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "verified_place_shortlist_hours_flagged_unverified_when_not_same_day_confirmed",
      "status": "pass",
      "evidence": "freshness: hours that could not be confirmed for the same day are flagged unverified"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "verified_place_shortlist_listings_checked_for_staleness_duplication_and_closure",
      "status": "pass",
      "evidence": "freshness: the listings were checked for staleness, duplication and possible closure"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "verified_place_shortlist_stale_duplicate_or_closed_listings_flagged",
      "status": "pass",
      "evidence": "freshness: any listing that looks stale, duplicated or possibly closed is flagged as such in the record"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "verified_place_shortlist_no_unconfirmed_place_used_to_fill_gap",
      "status": "pass",
      "evidence": "uncertainty: no gap in the shortlist was filled with a place whose existence was not confirmed"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "verified_place_shortlist_nearest_verified_area_offered_where_no_verified_options",
      "status": "pass",
      "evidence": "the original area is not declared to have no verified options"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "every_verified_place_special_hours_noted_where_shown",
      "status": "pass",
      "evidence": "freshness: every declared place declares holiday or special hours noted where shown for the day in question"
    },
    {
      "section": "red_lines",
      "check": "verified_place_shortlist_free_of_invented_address_hours_rating_or_photo",
      "status": "pass",
      "evidence": "red line: no invented address, opening hour, rating or photo description is present in the record"
    },
    {
      "section": "red_lines",
      "check": "verified_place_shortlist_free_of_stale_hours_presented_as_current_fact",
      "status": "pass",
      "evidence": "red line: no stale hours are presented as current fact in the record"
    },
    {
      "section": "red_lines",
      "check": "verified_place_shortlist_free_of_place_breaking_stated_constraint_recommended",
      "status": "pass",
      "evidence": "red line: no place that breaks a stated constraint is recommended in the record"
    },
    {
      "section": "red_lines",
      "check": "verified_place_shortlist_free_of_ranking_by_rating_alone",
      "status": "pass",
      "evidence": "red line: no ranking by rating alone, without checking fit and review volume, is present in the record"
    },
    {
      "section": "red_lines",
      "check": "verified_place_shortlist_free_of_unverified_listing_passed_as_confirmed_open",
      "status": "pass",
      "evidence": "red line: no unverified listing is passed off as a confirmed open business in the record"
    }
  ],
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
  "summary": "51 pass, 0 fail, 0 missing of 51 checks across six sections.",
  "stamp": "VERIFIED PLACE SHORTLIST\nshortlist_title: Family Outing\nVERDICT: VERIFIED_PLACE_SHORTLIST_SOUND\n  constraints_and_criteria                     pass\n  place_rows_and_verification_evidence         pass\n  rating_signals_and_fit                       pass\n  ranking_winner_and_backup                    pass\n  freshness_uncertainty_and_alternatives       pass\n  red_lines                                    pass\n51 pass, 0 fail, 0 missing of 51 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T15:24:37.068556+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/verified-place-shortlist/evidence.json`.

Input:

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
      "place_name": "",
      "address": "123 Maple St",
      "address_verified_from_listing": false,
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
      "review_count": 0,
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
    "invented_address_hours_rating_or_photo_present": true,
    "stale_hours_presented_as_current_fact_present": false,
    "place_breaking_stated_constraint_recommended_present": false,
    "ranking_by_rating_alone_present": false,
    "unverified_listing_passed_as_confirmed_open_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "verified-place-shortlist",
  "atom_version": "0.1.0",
  "shortlist_title": "Family Outing",
  "verdict": "VERIFIED_PLACE_SHORTLIST_NOT_SOUND",
  "sections": {
    "constraints_and_criteria": "pass",
    "place_rows_and_verification_evidence": "fail",
    "rating_signals_and_fit": "fail",
    "ranking_winner_and_backup": "pass",
    "freshness_uncertainty_and_alternatives": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_constraints_declared",
      "status": "pass",
      "evidence": "constraints: the shortlist record declares the constraints it worked to, written down first"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_area_constraint_declared",
      "status": "pass",
      "evidence": "constraints: the area constraint is declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_visit_timing_constraint_declared",
      "status": "pass",
      "evidence": "constraints: the visit timing \u2014 the day and time the places must be open for \u2014 is declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_budget_constraint_declared",
      "status": "pass",
      "evidence": "constraints: the budget constraint is declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_noise_constraint_declared",
      "status": "pass",
      "evidence": "constraints: the noise constraint is declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_parking_constraint_declared",
      "status": "pass",
      "evidence": "constraints: the parking constraint is declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_accessibility_needs_declared",
      "status": "pass",
      "evidence": "constraints: the accessibility needs are declared"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_candidates_searched_within_constraints",
      "status": "pass",
      "evidence": "search discipline: candidate places were searched for inside the declared constraints"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_only_real_named_results_kept",
      "status": "pass",
      "evidence": "search discipline: only real, named results were kept as candidates"
    },
    {
      "section": "constraints_and_criteria",
      "check": "verified_place_shortlist_criteria_list_declared",
      "status": "pass",
      "evidence": "criteria: the declared record names its shortlist criteria \u2014 the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all"
    },
    {
      "section": "constraints_and_criteria",
      "check": "every_verified_place_criterion_id_unique",
      "status": "pass",
      "evidence": "criteria: no declared criterion_id is owned by more than one row"
    },
    {
      "section": "constraints_and_criteria",
      "check": "every_verified_place_criterion_name_declared",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-empty criterion name"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "verified_place_shortlist_places_list_declared",
      "status": "pass",
      "evidence": "places: the declared record names its shortlisted places \u2014 the list is present and names at least two places; an absent list is missing evidence and a list of fewer than two declares no shortlist to rank and no backup to keep"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_id_unique",
      "status": "pass",
      "evidence": "places: no declared place_id is owned by more than one row"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_name_declared",
      "status": "fail",
      "evidence": "places: every declared place declares a non-empty place name \u2014 every recommended place is a real, named result"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_address_declared",
      "status": "pass",
      "evidence": "places: every declared place declares a non-empty address"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_address_unique",
      "status": "pass",
      "evidence": "places: no declared address is shared by more than one row \u2014 a duplicated address is the duplicate-listing signal the record must flag, not repeat"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_address_verified_from_listing",
      "status": "fail",
      "evidence": "verification evidence: every declared place declares its address verified from the listing itself"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_existence_confirmed",
      "status": "pass",
      "evidence": "verification evidence: every declared place declares its existence confirmed \u2014 no gap is filled with a place whose existence was not confirmed"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_hours_status_recognised",
      "status": "pass",
      "evidence": "verification evidence: every declared place's hours status is one of same_day_verified, flagged_unverified \u2014 hours are same-day verified or explicitly flagged unverified, with no third state"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_verification_method_declared",
      "status": "pass",
      "evidence": "verification evidence: every declared place declares a non-empty verification method \u2014 how its evidence was verified is part of the record"
    },
    {
      "section": "place_rows_and_verification_evidence",
      "check": "every_verified_place_verification_date_declared",
      "status": "pass",
      "evidence": "verification evidence: every declared place declares a non-empty verification date \u2014 the freshness of its evidence is part of the record"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "verified_place_shortlist_rating_signals_read_critically",
      "status": "pass",
      "evidence": "rating signals: the rating signals were read critically, not taken as a star number alone"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "verified_place_shortlist_fit_checked_beyond_rating",
      "status": "pass",
      "evidence": "rating signals: fit against the declared constraints was checked beyond the rating"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_rating_declared",
      "status": "pass",
      "evidence": "rating signals: every declared place declares a non-negative rating value"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_review_count_positive",
      "status": "fail",
      "evidence": "rating signals: every declared place declares a positive review count \u2014 rating signals carry review volume, and a count of zero declares no volume at all"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_recent_complaints_noted",
      "status": "pass",
      "evidence": "rating signals: every declared place declares what its recent reviews actually complain about noted"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_photo_checked",
      "status": "pass",
      "evidence": "photo evidence: every declared place declares its photo evidence checked, to judge space, seating and condition"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_criterion_mapping_declared",
      "status": "pass",
      "evidence": "criterion mapping: every declared place declares its criterion mapping \u2014 the declared criteria it meets"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_criterion_mapping_names_only_declared_criteria",
      "status": "pass",
      "evidence": "criterion mapping: every declared place's criterion mapping names only declared criteria \u2014 no other criterion, and none twice in the coverage check below"
    },
    {
      "section": "rating_signals_and_fit",
      "check": "every_verified_place_meets_all_declared_criteria",
      "status": "pass",
      "evidence": "criterion coverage: every declared place meets every declared criterion \u2014 the shortlist respects every constraint stated, and no shortlisted place breaks one"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_ranking_recorded",
      "status": "pass",
      "evidence": "ranking: the shortlist record records a ranking of its declared places"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_ranking_based_on_declared_criteria",
      "status": "pass",
      "evidence": "ranking: the recorded ranking is based on the declared criteria and constraints, not on rating alone"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_rationale_recorded",
      "status": "pass",
      "evidence": "winner: the record records why the declared winner wins"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_drawback_recorded",
      "status": "pass",
      "evidence": "winner: one honest drawback for the top pick is recorded"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_map_ready_address_declared",
      "status": "pass",
      "evidence": "winner: the winner's address is declared in map-ready form"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_hours_recorded",
      "status": "pass",
      "evidence": "winner: the winner's hours for the day in question are recorded, or flagged unverified in its row"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_booking_or_queue_warning_recorded",
      "status": "pass",
      "evidence": "winner: any booking or queue warning for the winner is recorded"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_winner_resolves_to_declared_place",
      "status": "pass",
      "evidence": "winner: the declared winner place id names one of the declared places \u2014 the atom checks only that the reference resolves; it never checks that the winner is the best or highest-rated place"
    },
    {
      "section": "ranking_winner_and_backup",
      "check": "verified_place_shortlist_backup_resolves_and_differs_where_timing_matters",
      "status": "pass",
      "evidence": "backup: where timing matters, the declared backup place id names a declared place other than the winner \u2014 one backup option is kept in case the winner is closed or full"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "verified_place_shortlist_hours_flagged_unverified_when_not_same_day_confirmed",
      "status": "pass",
      "evidence": "freshness: hours that could not be confirmed for the same day are flagged unverified"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "verified_place_shortlist_listings_checked_for_staleness_duplication_and_closure",
      "status": "pass",
      "evidence": "freshness: the listings were checked for staleness, duplication and possible closure"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "verified_place_shortlist_stale_duplicate_or_closed_listings_flagged",
      "status": "pass",
      "evidence": "freshness: any listing that looks stale, duplicated or possibly closed is flagged as such in the record"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "verified_place_shortlist_no_unconfirmed_place_used_to_fill_gap",
      "status": "pass",
      "evidence": "uncertainty: no gap in the shortlist was filled with a place whose existence was not confirmed"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "verified_place_shortlist_nearest_verified_area_offered_where_no_verified_options",
      "status": "pass",
      "evidence": "the original area is not declared to have no verified options"
    },
    {
      "section": "freshness_uncertainty_and_alternatives",
      "check": "every_verified_place_special_hours_noted_where_shown",
      "status": "pass",
      "evidence": "freshness: every declared place declares holiday or special hours noted where shown for the day in question"
    },
    {
      "section": "red_lines",
      "check": "verified_place_shortlist_free_of_invented_address_hours_rating_or_photo",
      "status": "fail",
      "evidence": "red line: no invented address, opening hour, rating or photo description is present in the record"
    },
    {
      "section": "red_lines",
      "check": "verified_place_shortlist_free_of_stale_hours_presented_as_current_fact",
      "status": "pass",
      "evidence": "red line: no stale hours are presented as current fact in the record"
    },
    {
      "section": "red_lines",
      "check": "verified_place_shortlist_free_of_place_breaking_stated_constraint_recommended",
      "status": "pass",
      "evidence": "red line: no place that breaks a stated constraint is recommended in the record"
    },
    {
      "section": "red_lines",
      "check": "verified_place_shortlist_free_of_ranking_by_rating_alone",
      "status": "pass",
      "evidence": "red line: no ranking by rating alone, without checking fit and review volume, is present in the record"
    },
    {
      "section": "red_lines",
      "check": "verified_place_shortlist_free_of_unverified_listing_passed_as_confirmed_open",
      "status": "pass",
      "evidence": "red line: no unverified listing is passed off as a confirmed open business in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "verified_places_count": 2,
  "verified_place_criteria_count": 1,
  "duplicate_verified_place_ids": [],
  "duplicate_verified_place_criterion_ids": [],
  "duplicate_verified_place_addresses": [],
  "verified_places_without_name": [
    "p1"
  ],
  "verified_places_without_address": [],
  "verified_places_with_unrecognised_hours_status": [],
  "verified_places_without_verification_method": [],
  "verified_places_without_verification_date": [],
  "verified_places_with_invalid_rating": [],
  "verified_places_with_invalid_review_count": [
    "p2"
  ],
  "verified_place_criteria_without_name": [],
  "verified_places_not_meeting_all_declared_criteria": [],
  "verified_places_with_extra_criterion_ids": [],
  "verified_places_total_review_count": "10.000000",
  "place_address_verification_ratio": "0.500000",
  "place_hours_same_day_verified_ratio": "1.000000",
  "place_criterion_coverage_ratio": "1.000000",
  "place_rating_evidence_ratio": "1.000000",
  "summary": "47 pass, 4 fail, 0 missing of 51 checks across six sections.",
  "stamp": "VERIFIED PLACE SHORTLIST\nshortlist_title: Family Outing\nVERDICT: VERIFIED_PLACE_SHORTLIST_NOT_SOUND\n  constraints_and_criteria                     pass\n  place_rows_and_verification_evidence         fail\n  rating_signals_and_fit                       fail\n  ranking_winner_and_backup                    pass\n  freshness_uncertainty_and_alternatives       pass\n  red_lines                                    fail\n47 pass, 4 fail, 0 missing of 51 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T15:24:37.068556+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/verified-place-shortlist/evidence.json`.

Input:

```json
{
  "criteria": "not-a-list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "criteria",
  "detail": "criteria must be a list"
}
```
