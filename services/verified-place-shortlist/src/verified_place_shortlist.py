#!/usr/bin/env python3
"""Verified place shortlist — deterministic core.

Built from the bound skill `place-discovery`: "Find and compare
real places — with verified address, hours, and rating signals
matched to your constraints." Its method in brief is this
atom's record structure: write the constraints down first
(area, timing, budget, noise, parking, accessibility); search
for candidates inside those constraints and keep only real,
named results; verify each shortlisted place's address from
the listing itself; check hours for the exact day of the
visit, noting holiday or special hours where shown; read the
rating signals critically — review count and what recent
reviews actually complain about, never a star number alone;
look at photos where available to judge space, seating and
condition; rank a short shortlist against the constraints and
name why the winner wins; give the winner in map-ready form
with hours and any booking or queue warning; and keep one
backup where timing matters. Its quality gates require every
recommended place to be real, named and located, hours
same-day verified or explicitly flagged unverified, and the
shortlist to respect every stated constraint; its red lines
refuse invented addresses, hours, ratings or photo
descriptions, stale hours presented as current fact, a place
that breaks a stated constraint, ranking by rating alone, and
passing an unverified listing off as a confirmed open
business.

This atom is a DELIVERABLE audit of a declared place-shortlist
record: it audits the record a caller declares — the declared
constraints and shortlist criteria, the declared place rows
with their declared verification evidence (address, hours
status, verification method and verification date, rating and
review count, recent-complaint and photo declarations, and
each row's declared criterion mapping), the ranking, winner
and backup declarations, the freshness / uncertainty handling
declarations, and the red lines refused. The "verified" in
this atom's name refers to the caller's DECLARED verification
discipline — the record's declared evidence that verification
was performed — and never to any verification by this atom:
it fetches NOTHING live, calls no places API, opens no
listing, and verifies no real-world fact. Every skill step
that searches live, verifies against the world, recommends a
place to visit, ranks places as the atom's own output, or
books anything is EXCLUDED from this atom by name — live
place search, live address / hours / rating verification,
recommending or choosing a place, producing a ranking,
booking or reserving, and navigating the caller anywhere are
each excluded; the atom checks only that the shortlist record
the skill requires is present and internally consistent on
the declared evidence, and it recomputes the record's own
declared rows exactly. Checking a DECLARED ranking's winner
and backup references (they resolve to declared places, and
the backup differs from the winner where timing matters) is
audit, not advice: the atom never produces a ranking and
never checks that the declared winner is the best, highest
rated or top-ranked place.

Distinct ground: the nearest siblings are
`sourced-visual-reference-search` (a declared visual-reference
search record — image results with source pages, depiction
and licensing), `single-living-trip-itinerary` (one trip's
living itinerary record — flights, stays, ground transport
and activities in idea / held / booked states with totals and
conflicts), and `home-shortlist-carrying-cost-comparison` (a
home-purchase shortlist's carrying-cost comparison). This
atom shares zero checks with any of them: every check here is
a place-shortlist question — declared visit constraints and
shortlist criteria, per-place declared address / hours /
rating verification evidence with its method and date, every
shortlisted place meeting every declared criterion, a
declared winner that resolves with its drawback, map-ready
address and booking / queue warning, a backup that resolves
and differs where timing matters, and same-day-or-flagged
hours discipline. The boundary is: one visit place shortlist
here; an image reference set, a whole trip itinerary, and a
home-buying cost comparison there.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- criteria: at least one declared row, unique criterion ids,
  and a non-empty criterion name on every row;
- places: at least two declared rows (a shortlist ranked
  against constraints with a backup is comparative by the
  record's own framing; one row ranks nothing and backs
  nothing up), unique place ids, unique declared addresses
  (a duplicated address is the duplicate-listing signal the
  skill says to flag), a non-empty place name, address,
  verification method and verification date on every row,
  every row declaring its address verified from the listing
  itself and its existence confirmed, and every row's hours
  status one of `same_day_verified` / `flagged_unverified`
  (the two states the skill's hours gate works with);
- rating evidence: every row declares a non-negative rating
  and a positive review count (a count of zero declares no
  review volume at all — internal consistency of the declared
  evidence, not an imported volume bar; the skill states no
  minimum review count, so none beyond existence is checked),
  notes recent complaints, and declares its photo evidence
  checked;
- criterion coverage: every row's declared criterion mapping
  names only declared criteria, and every row meets every
  declared criterion (the skill: the shortlist respects every
  constraint you stated; never recommend a place that breaks
  one) — a row meeting only some criteria is a place that
  breaks a stated criterion, named in
  `verified_places_not_meeting_all_declared_criteria`;
- ranking: the declared winner id names one of the declared
  places, and — gated on the record's own declared
  `ranking.timing_matters` — the declared backup id names a
  declared place other than the winner;
- gated declaration: the nearest verified area is offered
  only where the record declares the original area has no
  verified options.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no minimum
rating, no minimum review count beyond existence, no price or
budget ceiling, no distance or travel-time bar — so no such
check is invented; those quantities are caller declarations
at most, and quantities here are computed and reported, with
exact recomputation and completeness over the caller's own
declared rows as the only bars.

Verdict:
- any fail             -> VERIFIED_PLACE_SHORTLIST_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> VERIFIED_PLACE_SHORTLIST_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "constraints_and_criteria",
    "place_rows_and_verification_evidence",
    "rating_signals_and_fit",
    "ranking_winner_and_backup",
    "freshness_uncertainty_and_alternatives",
    "red_lines",
)

HOURS_STATUSES = ("same_day_verified", "flagged_unverified")

MANIFEST_SPEC = {
    "shortlist_title": "string",
    "constraints": {
        "constraints_declared": "boolean",
        "area_declared": "boolean",
        "visit_timing_declared": "boolean",
        "budget_constraint_declared": "boolean",
        "noise_constraint_declared": "boolean",
        "parking_constraint_declared": "boolean",
        "accessibility_needs_declared": "boolean",
        "candidates_searched_within_declared_constraints": "boolean",
        "only_real_named_results_kept": "boolean",
    },
    "criteria": [{
        "criterion_id": "string",
        "criterion_name": "string",
    }],
    "places": [{
        "place_id": "string",
        "place_name": "string",
        "address": "string",
        "address_verified_from_listing": "boolean",
        "existence_confirmed": "boolean",
        "hours_status": "string",
        "verification_method": "string",
        "verification_date": "string",
        "rating": "number",
        "review_count": "number",
        "recent_complaints_noted": "boolean",
        "photo_checked": "boolean",
        "special_hours_noted_where_shown": "boolean",
        "criterion_ids_met": ["string"],
    }],
    "evaluation": {
        "rating_signals_read_critically": "boolean",
        "fit_checked_beyond_rating": "boolean",
    },
    "ranking": {
        "ranking_recorded": "boolean",
        "ranking_based_on_declared_criteria": "boolean",
        "winner_place_id": "string",
        "winner_rationale_recorded": "boolean",
        "winner_drawback_recorded": "boolean",
        "winner_map_ready_address_declared": "boolean",
        "winner_hours_recorded": "boolean",
        "winner_booking_or_queue_warning_recorded": "boolean",
        "timing_matters": "boolean",
        "backup_place_id": "string",
    },
    "handling": {
        "hours_flagged_unverified_when_not_same_day_confirmed": "boolean",
        "listings_checked_for_staleness_duplication_and_closure": "boolean",
        "stale_duplicate_or_closed_listings_flagged": "boolean",
        "no_unconfirmed_place_used_to_fill_gap": "boolean",
        "original_area_has_no_verified_options": "boolean",
        "nearest_verified_area_offered": "boolean",
    },
    "red_lines": {
        "invented_address_hours_rating_or_photo_present": "boolean",
        "stale_hours_presented_as_current_fact_present": "boolean",
        "place_breaking_stated_constraint_recommended_present": "boolean",
        "ranking_by_rating_alone_present": "boolean",
        "unverified_listing_passed_as_confirmed_open_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _is_number(value):
    return (isinstance(value, (int, float))
            and not isinstance(value, bool))


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _duplicates(rows, field):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            nm = c[field]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _ids(rows, field):
    return [c[field] for c in rows
            if isinstance(c, dict) and isinstance(c.get(field), str)]


def evaluate(manifest):
    """Return the verdict dict for a verified place shortlist."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    places, has_places = _get(manifest, "places")
    places_is_list = has_places and isinstance(places, list)
    places_count = len(places) if places_is_list else None
    place_rows = places if places_is_list else []
    place_ids = _ids(place_rows, "place_id")

    criteria, has_criteria = _get(manifest, "criteria")
    crit_is_list = has_criteria and isinstance(criteria, list)
    crit_count = len(criteria) if crit_is_list else None
    crit_rows = criteria if crit_is_list else []
    criterion_ids = _ids(crit_rows, "criterion_id")

    winner, has_winner = _get(manifest, "ranking", "winner_place_id")
    backup, has_backup = _get(manifest, "ranking", "backup_place_id")
    timing_matters, has_timing = _get(manifest, "ranking", "timing_matters")

    duplicate_place_ids = (
        _duplicates(place_rows, "place_id") if places_is_list else None)
    duplicate_criterion_ids = (
        _duplicates(crit_rows, "criterion_id") if crit_is_list else None)
    duplicate_addresses = (
        _duplicates(place_rows, "address") if places_is_list else None)

    places_without_name = (
        [_row_name(c, "place_id") for c in place_rows
         if _has(c, "place_name") and not _nonempty_str(c.get("place_name"))]
        if places_is_list else None)
    places_without_address = (
        [_row_name(c, "place_id") for c in place_rows
         if _has(c, "address") and not _nonempty_str(c.get("address"))]
        if places_is_list else None)
    places_with_unrecognised_hours_status = (
        [_row_name(c, "place_id") for c in place_rows
         if _has(c, "hours_status")
         and c.get("hours_status") not in HOURS_STATUSES]
        if places_is_list else None)
    places_without_verification_method = (
        [_row_name(c, "place_id") for c in place_rows
         if _has(c, "verification_method")
         and not _nonempty_str(c.get("verification_method"))]
        if places_is_list else None)
    places_without_verification_date = (
        [_row_name(c, "place_id") for c in place_rows
         if _has(c, "verification_date")
         and not _nonempty_str(c.get("verification_date"))]
        if places_is_list else None)
    places_with_invalid_rating = (
        [_row_name(c, "place_id") for c in place_rows
         if _has(c, "rating")
         and not (_is_number(c.get("rating")) and c.get("rating") >= 0)]
        if places_is_list else None)
    places_with_invalid_review_count = (
        [_row_name(c, "place_id") for c in place_rows
         if _has(c, "review_count")
         and not (_is_number(c.get("review_count"))
                  and c.get("review_count") > 0)]
        if places_is_list else None)
    criteria_without_name = (
        [_row_name(c, "criterion_id") for c in crit_rows
         if _has(c, "criterion_name")
         and not _nonempty_str(c.get("criterion_name"))]
        if crit_is_list else None)

    def _met_ids(c):
        met = c.get("criterion_ids_met") if isinstance(c, dict) else None
        if not isinstance(met, list):
            return None
        return [m for m in met if isinstance(m, str)]

    def _meets_all(c):
        met = _met_ids(c)
        if met is None:
            return False
        return (len(met) == len(set(met))
                and all(cid in met for cid in criterion_ids))

    def _has_extra(c):
        met = _met_ids(c)
        if met is None:
            return False
        return any(m not in criterion_ids for m in met)

    places_not_meeting_all = (
        [_row_name(c, "place_id") for c in place_rows
         if _has(c, "criterion_ids_met") and not _meets_all(c)]
        if places_is_list and crit_is_list else None)
    places_with_extra_criteria = (
        [_row_name(c, "place_id") for c in place_rows
         if _has(c, "criterion_ids_met") and _has_extra(c)]
        if places_is_list and crit_is_list else None)

    total_review_count = None
    if places_is_list:
        total_review_count = 0.0
        for c in place_rows:
            if isinstance(c, dict) and _is_number(c.get("review_count")):
                total_review_count += c["review_count"]

    address_verification_ratio = (
        sum(1 for c in place_rows
            if isinstance(c, dict)
            and c.get("address_verified_from_listing") is True)
        / places_count
        if places_is_list and places_count > 0 else None)
    hours_same_day_ratio = (
        sum(1 for c in place_rows
            if isinstance(c, dict)
            and c.get("hours_status") == "same_day_verified")
        / places_count
        if places_is_list and places_count > 0 else None)
    criterion_coverage_ratio = (
        sum(1 for c in place_rows if _meets_all(c)) / places_count
        if places_is_list and crit_is_list and places_count > 0 else None)
    rating_evidence_ratio = (
        sum(1 for c in place_rows
            if isinstance(c, dict) and _has(c, "rating")
            and _has(c, "review_count")) / places_count
        if places_is_list and places_count > 0 else None)

    def _row_bool_present(field):
        return places_is_list and all(_has(c, field) for c in place_rows)

    def _row_bool_all_true(field):
        return places_is_list and all(
            isinstance(c, dict) and c.get(field) is True
            for c in place_rows)

    def _row_field_present(field):
        return _row_bool_present(field)

    # ---- Section 1: constraints_and_criteria ----
    _bool_check(results, "constraints_and_criteria",
                "verified_place_shortlist_constraints_declared", manifest,
                ("constraints", "constraints_declared"),
                "constraints: the shortlist record declares the constraints it worked to, written down first")
    _bool_check(results, "constraints_and_criteria",
                "verified_place_shortlist_area_constraint_declared", manifest,
                ("constraints", "area_declared"),
                "constraints: the area constraint is declared")
    _bool_check(results, "constraints_and_criteria",
                "verified_place_shortlist_visit_timing_constraint_declared",
                manifest,
                ("constraints", "visit_timing_declared"),
                "constraints: the visit timing — the day and time the places must be open for — is declared")
    _bool_check(results, "constraints_and_criteria",
                "verified_place_shortlist_budget_constraint_declared", manifest,
                ("constraints", "budget_constraint_declared"),
                "constraints: the budget constraint is declared")
    _bool_check(results, "constraints_and_criteria",
                "verified_place_shortlist_noise_constraint_declared", manifest,
                ("constraints", "noise_constraint_declared"),
                "constraints: the noise constraint is declared")
    _bool_check(results, "constraints_and_criteria",
                "verified_place_shortlist_parking_constraint_declared", manifest,
                ("constraints", "parking_constraint_declared"),
                "constraints: the parking constraint is declared")
    _bool_check(results, "constraints_and_criteria",
                "verified_place_shortlist_accessibility_needs_declared",
                manifest,
                ("constraints", "accessibility_needs_declared"),
                "constraints: the accessibility needs are declared")
    _bool_check(results, "constraints_and_criteria",
                "verified_place_shortlist_candidates_searched_within_constraints",
                manifest,
                ("constraints", "candidates_searched_within_declared_constraints"),
                "search discipline: candidate places were searched for inside the declared constraints")
    _bool_check(results, "constraints_and_criteria",
                "verified_place_shortlist_only_real_named_results_kept", manifest,
                ("constraints", "only_real_named_results_kept"),
                "search discipline: only real, named results were kept as candidates")
    _check(results, "constraints_and_criteria",
           "verified_place_shortlist_criteria_list_declared", criteria,
           crit_is_list, crit_is_list and crit_count > 0,
           "criteria: the declared record names its shortlist criteria — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all")
    crit_id_present = crit_is_list and all(
        _has(c, "criterion_id") for c in crit_rows)
    _check(results, "constraints_and_criteria",
           "every_verified_place_criterion_id_unique", criteria,
           crit_id_present,
           crit_is_list and duplicate_criterion_ids is not None
           and len(duplicate_criterion_ids) == 0,
           "criteria: no declared criterion_id is owned by more than one row")
    crit_name_present = crit_is_list and all(
        _has(c, "criterion_name") for c in crit_rows)
    _check(results, "constraints_and_criteria",
           "every_verified_place_criterion_name_declared", criteria,
           crit_name_present,
           crit_is_list
           and all(_nonempty_str(c.get("criterion_name")) for c in crit_rows),
           "criteria: every declared criterion declares a non-empty criterion name")

    # ---- Section 2: place_rows_and_verification_evidence ----
    _check(results, "place_rows_and_verification_evidence",
           "verified_place_shortlist_places_list_declared", places,
           places_is_list, places_is_list and places_count >= 2,
           "places: the declared record names its shortlisted places — the list is present and names at least two places; an absent list is missing evidence and a list of fewer than two declares no shortlist to rank and no backup to keep")
    place_id_present = _row_field_present("place_id")
    _check(results, "place_rows_and_verification_evidence",
           "every_verified_place_id_unique", places,
           place_id_present,
           places_is_list and duplicate_place_ids is not None
           and len(duplicate_place_ids) == 0,
           "places: no declared place_id is owned by more than one row")
    _check(results, "place_rows_and_verification_evidence",
           "every_verified_place_name_declared", places,
           _row_field_present("place_name"),
           places_is_list
           and all(_nonempty_str(c.get("place_name")) for c in place_rows),
           "places: every declared place declares a non-empty place name — every recommended place is a real, named result")
    _check(results, "place_rows_and_verification_evidence",
           "every_verified_place_address_declared", places,
           _row_field_present("address"),
           places_is_list
           and all(_nonempty_str(c.get("address")) for c in place_rows),
           "places: every declared place declares a non-empty address")
    _check(results, "place_rows_and_verification_evidence",
           "every_verified_place_address_unique", places,
           _row_field_present("address"),
           places_is_list and duplicate_addresses is not None
           and len(duplicate_addresses) == 0,
           "places: no declared address is shared by more than one row — a duplicated address is the duplicate-listing signal the record must flag, not repeat")
    _check(results, "place_rows_and_verification_evidence",
           "every_verified_place_address_verified_from_listing", places,
           _row_bool_present("address_verified_from_listing"),
           _row_bool_all_true("address_verified_from_listing"),
           "verification evidence: every declared place declares its address verified from the listing itself")
    _check(results, "place_rows_and_verification_evidence",
           "every_verified_place_existence_confirmed", places,
           _row_bool_present("existence_confirmed"),
           _row_bool_all_true("existence_confirmed"),
           "verification evidence: every declared place declares its existence confirmed — no gap is filled with a place whose existence was not confirmed")
    _check(results, "place_rows_and_verification_evidence",
           "every_verified_place_hours_status_recognised", places,
           _row_field_present("hours_status"),
           places_is_list
           and all(c.get("hours_status") in HOURS_STATUSES
                   for c in place_rows),
           "verification evidence: every declared place's hours status is one of same_day_verified, flagged_unverified — hours are same-day verified or explicitly flagged unverified, with no third state")
    _check(results, "place_rows_and_verification_evidence",
           "every_verified_place_verification_method_declared", places,
           _row_field_present("verification_method"),
           places_is_list
           and all(_nonempty_str(c.get("verification_method"))
                   for c in place_rows),
           "verification evidence: every declared place declares a non-empty verification method — how its evidence was verified is part of the record")
    _check(results, "place_rows_and_verification_evidence",
           "every_verified_place_verification_date_declared", places,
           _row_field_present("verification_date"),
           places_is_list
           and all(_nonempty_str(c.get("verification_date"))
                   for c in place_rows),
           "verification evidence: every declared place declares a non-empty verification date — the freshness of its evidence is part of the record")

    # ---- Section 3: rating_signals_and_fit ----
    _bool_check(results, "rating_signals_and_fit",
                "verified_place_shortlist_rating_signals_read_critically",
                manifest,
                ("evaluation", "rating_signals_read_critically"),
                "rating signals: the rating signals were read critically, not taken as a star number alone")
    _bool_check(results, "rating_signals_and_fit",
                "verified_place_shortlist_fit_checked_beyond_rating", manifest,
                ("evaluation", "fit_checked_beyond_rating"),
                "rating signals: fit against the declared constraints was checked beyond the rating")
    _check(results, "rating_signals_and_fit",
           "every_verified_place_rating_declared", places,
           _row_field_present("rating"),
           places_is_list
           and all(_is_number(c.get("rating")) and c.get("rating") >= 0
                   for c in place_rows),
           "rating signals: every declared place declares a non-negative rating value")
    _check(results, "rating_signals_and_fit",
           "every_verified_place_review_count_positive", places,
           _row_field_present("review_count"),
           places_is_list
           and all(_is_number(c.get("review_count"))
                   and c.get("review_count") > 0 for c in place_rows),
           "rating signals: every declared place declares a positive review count — rating signals carry review volume, and a count of zero declares no volume at all")
    _check(results, "rating_signals_and_fit",
           "every_verified_place_recent_complaints_noted", places,
           _row_bool_present("recent_complaints_noted"),
           _row_bool_all_true("recent_complaints_noted"),
           "rating signals: every declared place declares what its recent reviews actually complain about noted")
    _check(results, "rating_signals_and_fit",
           "every_verified_place_photo_checked", places,
           _row_bool_present("photo_checked"),
           _row_bool_all_true("photo_checked"),
           "photo evidence: every declared place declares its photo evidence checked, to judge space, seating and condition")
    mapping_present = places_is_list and all(
        _has(c, "criterion_ids_met") for c in place_rows)
    _check(results, "rating_signals_and_fit",
           "every_verified_place_criterion_mapping_declared", places,
           mapping_present,
           places_is_list
           and all(isinstance(c.get("criterion_ids_met"), list)
                   for c in place_rows),
           "criterion mapping: every declared place declares its criterion mapping — the declared criteria it meets")
    mapping_and_criteria_present = (
        mapping_present and crit_is_list
        and all(_has(c, "criterion_id") for c in crit_rows))
    _check(results, "rating_signals_and_fit",
           "every_verified_place_criterion_mapping_names_only_declared_criteria",
           places, mapping_and_criteria_present,
           places_is_list and crit_is_list
           and all(not _has_extra(c) for c in place_rows),
           "criterion mapping: every declared place's criterion mapping names only declared criteria — no other criterion, and none twice in the coverage check below")
    _check(results, "rating_signals_and_fit",
           "every_verified_place_meets_all_declared_criteria", places,
           mapping_and_criteria_present,
           places_is_list and crit_is_list
           and all(_meets_all(c) for c in place_rows),
           "criterion coverage: every declared place meets every declared criterion — the shortlist respects every constraint stated, and no shortlisted place breaks one")

    # ---- Section 4: ranking_winner_and_backup ----
    _bool_check(results, "ranking_winner_and_backup",
                "verified_place_shortlist_ranking_recorded", manifest,
                ("ranking", "ranking_recorded"),
                "ranking: the shortlist record records a ranking of its declared places")
    _bool_check(results, "ranking_winner_and_backup",
                "verified_place_shortlist_ranking_based_on_declared_criteria",
                manifest,
                ("ranking", "ranking_based_on_declared_criteria"),
                "ranking: the recorded ranking is based on the declared criteria and constraints, not on rating alone")
    _bool_check(results, "ranking_winner_and_backup",
                "verified_place_shortlist_winner_rationale_recorded", manifest,
                ("ranking", "winner_rationale_recorded"),
                "winner: the record records why the declared winner wins")
    _bool_check(results, "ranking_winner_and_backup",
                "verified_place_shortlist_winner_drawback_recorded", manifest,
                ("ranking", "winner_drawback_recorded"),
                "winner: one honest drawback for the top pick is recorded")
    _bool_check(results, "ranking_winner_and_backup",
                "verified_place_shortlist_winner_map_ready_address_declared",
                manifest,
                ("ranking", "winner_map_ready_address_declared"),
                "winner: the winner's address is declared in map-ready form")
    _bool_check(results, "ranking_winner_and_backup",
                "verified_place_shortlist_winner_hours_recorded", manifest,
                ("ranking", "winner_hours_recorded"),
                "winner: the winner's hours for the day in question are recorded, or flagged unverified in its row")
    _bool_check(results, "ranking_winner_and_backup",
                "verified_place_shortlist_winner_booking_or_queue_warning_recorded",
                manifest,
                ("ranking", "winner_booking_or_queue_warning_recorded"),
                "winner: any booking or queue warning for the winner is recorded")
    winner_present = has_winner and places_is_list
    _check(results, "ranking_winner_and_backup",
           "verified_place_shortlist_winner_resolves_to_declared_place",
           winner, winner_present,
           winner_present and isinstance(winner, str)
           and winner in place_ids,
           "winner: the declared winner place id names one of the declared places — the atom checks only that the reference resolves; it never checks that the winner is the best or highest-rated place")
    # Gated backup check: required only where timing matters.
    if has_timing and timing_matters:
        backup_present = has_backup and places_is_list
        _check(results, "ranking_winner_and_backup",
               "verified_place_shortlist_backup_resolves_and_differs_where_timing_matters",
               backup, backup_present,
               backup_present and isinstance(backup, str)
               and backup in place_ids and backup != winner,
               "backup: where timing matters, the declared backup place id names a declared place other than the winner — one backup option is kept in case the winner is closed or full")
    else:
        _check(results, "ranking_winner_and_backup",
               "verified_place_shortlist_backup_resolves_and_differs_where_timing_matters",
               timing_matters, has_timing, True,
               "timing does not matter for this visit")

    # ---- Section 5: freshness_uncertainty_and_alternatives ----
    _bool_check(results, "freshness_uncertainty_and_alternatives",
                "verified_place_shortlist_hours_flagged_unverified_when_not_same_day_confirmed",
                manifest,
                ("handling", "hours_flagged_unverified_when_not_same_day_confirmed"),
                "freshness: hours that could not be confirmed for the same day are flagged unverified")
    _bool_check(results, "freshness_uncertainty_and_alternatives",
                "verified_place_shortlist_listings_checked_for_staleness_duplication_and_closure",
                manifest,
                ("handling", "listings_checked_for_staleness_duplication_and_closure"),
                "freshness: the listings were checked for staleness, duplication and possible closure")
    _bool_check(results, "freshness_uncertainty_and_alternatives",
                "verified_place_shortlist_stale_duplicate_or_closed_listings_flagged",
                manifest,
                ("handling", "stale_duplicate_or_closed_listings_flagged"),
                "freshness: any listing that looks stale, duplicated or possibly closed is flagged as such in the record")
    _bool_check(results, "freshness_uncertainty_and_alternatives",
                "verified_place_shortlist_no_unconfirmed_place_used_to_fill_gap",
                manifest,
                ("handling", "no_unconfirmed_place_used_to_fill_gap"),
                "uncertainty: no gap in the shortlist was filled with a place whose existence was not confirmed")
    _gated_bool_check(
        results, "freshness_uncertainty_and_alternatives",
        "verified_place_shortlist_nearest_verified_area_offered_where_no_verified_options",
        manifest,
        ("handling", "original_area_has_no_verified_options"),
        ("handling", "nearest_verified_area_offered"),
        "alternatives: where the original area has no verified options, the nearest area that does have verified options is offered instead of widening silently",
        "the original area is not declared to have no verified options")
    _check(results, "freshness_uncertainty_and_alternatives",
           "every_verified_place_special_hours_noted_where_shown", places,
           _row_bool_present("special_hours_noted_where_shown"),
           _row_bool_all_true("special_hours_noted_where_shown"),
           "freshness: every declared place declares holiday or special hours noted where shown for the day in question")

    # ---- Section 6: red_lines ----
    _false_check(results, "red_lines",
                 "verified_place_shortlist_free_of_invented_address_hours_rating_or_photo",
                 manifest,
                 ("red_lines", "invented_address_hours_rating_or_photo_present"),
                 "red line: no invented address, opening hour, rating or photo description is present in the record")
    _false_check(results, "red_lines",
                 "verified_place_shortlist_free_of_stale_hours_presented_as_current_fact",
                 manifest,
                 ("red_lines", "stale_hours_presented_as_current_fact_present"),
                 "red line: no stale hours are presented as current fact in the record")
    _false_check(results, "red_lines",
                 "verified_place_shortlist_free_of_place_breaking_stated_constraint_recommended",
                 manifest,
                 ("red_lines", "place_breaking_stated_constraint_recommended_present"),
                 "red line: no place that breaks a stated constraint is recommended in the record")
    _false_check(results, "red_lines",
                 "verified_place_shortlist_free_of_ranking_by_rating_alone",
                 manifest,
                 ("red_lines", "ranking_by_rating_alone_present"),
                 "red line: no ranking by rating alone, without checking fit and review volume, is present in the record")
    _false_check(results, "red_lines",
                 "verified_place_shortlist_free_of_unverified_listing_passed_as_confirmed_open",
                 manifest,
                 ("red_lines", "unverified_listing_passed_as_confirmed_open_present"),
                 "red line: no unverified listing is passed off as a confirmed open business in the record")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "VERIFIED_PLACE_SHORTLIST_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "VERIFIED_PLACE_SHORTLIST_SOUND"

    computed_names = (
        "verified_place_shortlist_criteria_list_declared",
        "every_verified_place_criterion_id_unique",
        "every_verified_place_criterion_name_declared",
        "verified_place_shortlist_places_list_declared",
        "every_verified_place_id_unique",
        "every_verified_place_name_declared",
        "every_verified_place_address_declared",
        "every_verified_place_address_unique",
        "every_verified_place_address_verified_from_listing",
        "every_verified_place_existence_confirmed",
        "every_verified_place_hours_status_recognised",
        "every_verified_place_verification_method_declared",
        "every_verified_place_verification_date_declared",
        "every_verified_place_rating_declared",
        "every_verified_place_review_count_positive",
        "every_verified_place_recent_complaints_noted",
        "every_verified_place_photo_checked",
        "every_verified_place_criterion_mapping_declared",
        "every_verified_place_criterion_mapping_names_only_declared_criteria",
        "every_verified_place_meets_all_declared_criteria",
        "verified_place_shortlist_winner_resolves_to_declared_place",
        "every_verified_place_special_hours_noted_where_shown",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "verified-place-shortlist",
        "atom_version": "0.1.0",
        "shortlist_title": manifest.get("shortlist_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "verified_places_count": places_count,
        "verified_place_criteria_count": crit_count,
        "duplicate_verified_place_ids": duplicate_place_ids,
        "duplicate_verified_place_criterion_ids": duplicate_criterion_ids,
        "duplicate_verified_place_addresses": duplicate_addresses,
        "verified_places_without_name": places_without_name,
        "verified_places_without_address": places_without_address,
        "verified_places_with_unrecognised_hours_status": places_with_unrecognised_hours_status,
        "verified_places_without_verification_method": places_without_verification_method,
        "verified_places_without_verification_date": places_without_verification_date,
        "verified_places_with_invalid_rating": places_with_invalid_rating,
        "verified_places_with_invalid_review_count": places_with_invalid_review_count,
        "verified_place_criteria_without_name": criteria_without_name,
        "verified_places_not_meeting_all_declared_criteria": places_not_meeting_all,
        "verified_places_with_extra_criterion_ids": places_with_extra_criteria,
        "verified_places_total_review_count": _fmt6(total_review_count),
        "place_address_verification_ratio": _fmt6(address_verification_ratio),
        "place_hours_same_day_verified_ratio": _fmt6(hours_same_day_ratio),
        "place_criterion_coverage_ratio": _fmt6(criterion_coverage_ratio),
        "place_rating_evidence_ratio": _fmt6(rating_evidence_ratio),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "VERIFIED PLACE SHORTLIST",
        f"shortlist_title: {verdict.get('shortlist_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: verified_place_shortlist.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "VERIFIED_PLACE_SHORTLIST_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
