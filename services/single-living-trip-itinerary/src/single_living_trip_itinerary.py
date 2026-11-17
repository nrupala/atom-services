#!/usr/bin/env python3
"""Single living trip itinerary — deterministic core.

Built from the bound skill `trip-planning` (v1): "Build one
living itinerary per trip — flights, stays, ground transport,
and activities with ideas, held, and booked kept distinct"
("One trip, one document, everything in it — and you can always
see what is booked versus just an idea.")

This atom audits a CALLER-DECLARED itinerary record — the
"single living itinerary" discipline. It never searches live
flights or hotels, never prices anything live, never books or
pays for anything, and never verifies a declared fact against
the world. It checks that the one declared itinerary record
the skill requires is present and internally consistent:

- purpose, travellers and fixed dates stated at the top, with
  the declared trip window in date order and only one
  itinerary maintained for the trip;
- entry, transit, passport, visa, baggage and connection-
  minimum constraints declared checked before routing choices;
- every entry labelled idea, held or booked, with the state
  discipline the skill states: booked entries carry a
  reference, a total and recorded terms; held entries state an
  expiry or timestamp; idea entries carry no booking reference
  (an idea is never presented as a booking); every priced entry
  carries its price timestamp (totals only from live results);
  and the declared booked total equals the sum of the declared
  totals of the booked entries — arithmetic over declared
  numbers only;
- the skeleton laid in date order — outbound, stays, internal
  moves, return — with entries in declared date order, no
  entry ending before it starts, every entry inside the
  declared trip window, and consecutive declared movement legs
  (flights and ground transport) connecting, each leg's origin
  equal to the previous movement leg's destination;
- conflicts scanned early and flagged, not smoothed over;
- a pre-departure full read-through declared; and
- the skill's red lines refused in the record.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported. Dates are declared ISO strings and are
compared lexicographically, identically in both
implementations; no date is parsed and no timezone conversion
is attempted. Declared amounts are serialized as strings with
exactly six decimal places by the fixed rule — round half up
to 6dp, floor(v * 1000000 + 0.5) / 1000000, then format with
exactly six decimals; the total comparison uses the fixed-6dp
difference against zero. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.

The skill states no numeric threshold — no budget cap, no
minimum connection time, no maximum layover, no hotel
check-in hour, no passport-validity period — so no numeric
threshold check is invented; those quantities are declined
and named in SERVICE.md.

Verdict:
- any fail             -> SINGLE_LIVING_TRIP_ITINERARY_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SINGLE_LIVING_TRIP_ITINERARY_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism
is the product.
"""
import json
import math
import sys

SECTIONS = (
    "trip_header",
    "entry_and_transit_constraints",
    "entry_states_and_totals",
    "skeleton_and_ordering",
    "conflicts_flagged",
    "predeparture_readthrough",
    "red_lines",
)

VALID_STATES = ("idea", "held", "booked")
MOVEMENT_KINDS = ("flight", "ground_transport")

MANIFEST_SPEC = {
    "trip_title": "string",
    "header": {
        "purpose": "string",
        "travellers": "string",
        "trip_start_date": "string",
        "trip_end_date": "string",
        "single_itinerary_maintained": "boolean",
    },
    "constraints": {
        "entry_checked_before_routing": "boolean",
        "transit_checked_before_routing": "boolean",
        "passport_validity_checked": "boolean",
        "visa_needs_checked": "boolean",
        "baggage_rules_checked": "boolean",
        "connection_minimums_checked": "boolean",
    },
    "entries": [{
        "entry_id": "string",
        "kind": "string",
        "state": "string",
        "start_date": "string",
        "end_date": "string",
        "origin": "string",
        "destination": "string",
        "total_amount": "number",
        "price_timestamp": "string",
        "booking_reference": "string",
        "terms_recorded": "boolean",
        "held_expiry_or_timestamp": "string",
    }],
    "skeleton": {
        "outbound_laid": "boolean",
        "stays_laid": "boolean",
        "internal_moves_laid_or_none_needed": "boolean",
        "return_laid": "boolean",
    },
    "totals": {
        "declared_booked_total": "number",
    },
    "conflicts": {
        "scanned_early": "boolean",
        "tight_connections_flagged": "boolean",
        "arrival_after_checkin_flagged": "boolean",
        "clashing_plans_flagged": "boolean",
        "conflicts_name_pieces_and_cost": "boolean",
    },
    "readiness": {
        "full_readthrough_completed": "boolean",
        "documents_checked": "boolean",
        "times_with_timezones_checked": "boolean",
        "contacts_checked": "boolean",
        "gaps_checked": "boolean",
    },
    "red_lines": {
        "date_change_suggested_present": "boolean",
        "idea_or_quote_presented_as_booking_present": "boolean",
        "invented_facts_present": "boolean",
        "routing_before_constraints_checked_present": "boolean",
        "unauthorized_booking_or_payment_present": "boolean",
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


def _string_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present,
           isinstance(value, str) and len(value) > 0, evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _nonempty(value):
    return isinstance(value, str) and len(value) > 0


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("entry_id"), str):
        return entry["entry_id"]
    return "unnamed"


def _rows_with_state(rows, state):
    return [c for c in rows
            if isinstance(c, dict) and c.get("state") == state]


def evaluate(manifest):
    """Return the verdict dict for a single living trip itinerary manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows and header dates, read once ----
    entries, has_entries = _get(manifest, "entries")
    entries_is_list = has_entries and isinstance(entries, list)
    rows = entries if entries_is_list else []
    entries_count = len(rows) if entries_is_list else None
    booked_rows = _rows_with_state(rows, "booked") if entries_is_list else []
    held_rows = _rows_with_state(rows, "held") if entries_is_list else []
    idea_rows = _rows_with_state(rows, "idea") if entries_is_list else []
    booked_count = len(booked_rows) if entries_is_list else None

    trip_start, has_trip_start = _get(manifest, "header", "trip_start_date")
    trip_end, has_trip_end = _get(manifest, "header", "trip_end_date")
    header_dates_present = (
        has_trip_start and has_trip_end
        and _nonempty(trip_start) and _nonempty(trip_end)
    )

    duplicate_entry_ids = None
    if entries_is_list:
        seen = []
        duplicate_entry_ids = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("entry_id"), str):
                nm = c["entry_id"]
                if nm in seen and nm not in duplicate_entry_ids:
                    duplicate_entry_ids.append(nm)
                seen.append(nm)

    ids_without_valid_state = (
        [_row_name(c) for c in rows
         if isinstance(c, dict) and "state" in c
         and c.get("state") not in VALID_STATES]
        if entries_is_list else None
    )

    booked_total_complete = (
        entries_is_list
        and all(isinstance(c, dict) and _is_number(c.get("total_amount"))
                for c in booked_rows)
    )
    computed_booked_total = (
        sum(c["total_amount"] for c in booked_rows)
        if booked_total_complete else None
    )
    declared_total, has_declared_total = _get(
        manifest, "totals", "declared_booked_total")
    booked_total_difference = (
        declared_total - computed_booked_total
        if computed_booked_total is not None
        and has_declared_total and _is_number(declared_total)
        else None
    )

    movement_rows = (
        [c for c in rows
         if isinstance(c, dict) and c.get("kind") in MOVEMENT_KINDS]
        if entries_is_list else []
    )
    movement_leg_breaks = None
    if entries_is_list:
        movement_leg_breaks = []
        prev = None
        for c in movement_rows:
            if not (isinstance(c, dict)
                    and _nonempty(c.get("origin"))
                    and _nonempty(c.get("destination"))):
                prev = None
                continue
            if prev is not None and c["origin"] != prev:
                movement_leg_breaks.append(_row_name(c))
            prev = c["destination"]

    entries_out_of_date_order = None
    if entries_is_list:
        entries_out_of_date_order = []
        prev_start = None
        for c in rows:
            if isinstance(c, dict) and _nonempty(c.get("start_date")):
                if prev_start is not None and c["start_date"] < prev_start:
                    entries_out_of_date_order.append(_row_name(c))
                prev_start = c["start_date"]

    entries_ending_before_start = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and _nonempty(c.get("start_date"))
         and _nonempty(c.get("end_date"))
         and c["end_date"] < c["start_date"]]
        if entries_is_list else None
    )
    entries_outside_trip_window = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and _nonempty(c.get("start_date"))
         and _nonempty(c.get("end_date"))
         and (c["start_date"] < trip_start or c["end_date"] > trip_end)]
        if entries_is_list and header_dates_present else None
    )

    # ---- Section 1: trip_header (skill quality gate: "Purpose,
    #      travellers, and fixed dates are stated at the top of
    #      the itinerary"; Method 8 / quality gate: one itinerary
    #      only — updated, not duplicated) ----
    _string_check(results, "trip_header",
                  "trip_purpose_stated_in_header", manifest,
                  ("header", "purpose"),
                  "header: the trip purpose is stated at the top "
                  "of the itinerary")
    _string_check(results, "trip_header",
                  "travellers_stated_in_header", manifest,
                  ("header", "travellers"),
                  "header: the travellers are stated at the top "
                  "of the itinerary")
    _string_check(results, "trip_header",
                  "trip_start_date_stated_in_header", manifest,
                  ("header", "trip_start_date"),
                  "header: the fixed start date is stated at the "
                  "top of the itinerary")
    _string_check(results, "trip_header",
                  "trip_end_date_stated_in_header", manifest,
                  ("header", "trip_end_date"),
                  "header: the fixed end date is stated at the top "
                  "of the itinerary")
    _check(results, "trip_header",
           "trip_window_start_not_after_end", trip_start,
           has_trip_start and has_trip_end,
           header_dates_present and trip_start <= trip_end,
           "header: the declared fixed start date is not after "
           "the declared fixed end date")
    _bool_check(results, "trip_header",
                "single_living_itinerary_maintained", manifest,
                ("header", "single_itinerary_maintained"),
                "header: one itinerary only — this record is the "
                "single living itinerary, updated not duplicated")

    # ---- Section 2: entry_and_transit_constraints (skill
    #      Method 2-3 and "Constraints to check early": entry
    #      and transit constraints checked before routing;
    #      passport validity, visa needs for every stop,
    #      baggage rules when carriers change, connection
    #      minimums — all as declarations; the skill states no
    #      numeric rule or minimum, so none is judged) ----
    _bool_check(results, "entry_and_transit_constraints",
                "entry_constraints_checked_before_routing_choices",
                manifest,
                ("constraints", "entry_checked_before_routing"),
                "constraints: entry constraints were checked "
                "before routing choices")
    _bool_check(results, "entry_and_transit_constraints",
                "transit_constraints_checked_before_routing_choices",
                manifest,
                ("constraints", "transit_checked_before_routing"),
                "constraints: transit constraints were checked "
                "before routing choices")
    _bool_check(results, "entry_and_transit_constraints",
                "passport_validity_checked_for_every_traveller",
                manifest,
                ("constraints", "passport_validity_checked"),
                "constraints: passport validity was checked for "
                "every traveller against each country's entry rule")
    _bool_check(results, "entry_and_transit_constraints",
                "visa_needs_checked_for_every_stop_including_airport_changes",
                manifest,
                ("constraints", "visa_needs_checked"),
                "constraints: visa and transit-visa needs were "
                "checked for every stop, including airport changes")
    _bool_check(results, "entry_and_transit_constraints",
                "baggage_rules_checked_when_carriers_change_mid_journey",
                manifest,
                ("constraints", "baggage_rules_checked"),
                "constraints: baggage rules were checked for "
                "carrier changes mid-journey")
    _bool_check(results, "entry_and_transit_constraints",
                "connection_minimums_checked_for_declared_connections",
                manifest,
                ("constraints", "connection_minimums_checked"),
                "constraints: minimum connection times were "
                "checked against the actual layovers on offer")

    # ---- Section 3: entry_states_and_totals (skill "The three
    #      states" and quality gates: every entry labelled idea,
    #      held or booked; booked = paid or confirmed with a
    #      reference, a total and terms recorded; held = reserved
    #      or quoted live with its expiry or timestamp stated;
    #      ideas = possibilities, nothing priced as real and
    #      never presented as a booking; every price a verified
    #      total from a live result with a timestamp) ----
    _check(results, "entry_states_and_totals",
           "itinerary_entries_declared", entries, entries_is_list,
           entries_is_list,
           "the declared record names its itinerary entries — "
           "the entries list is present; an empty list declares "
           "a skeleton with no entries yet")
    state_present = (
        entries_is_list
        and all(isinstance(c, dict) and "state" in c for c in rows)
    )
    _check(results, "entry_states_and_totals",
           "every_itinerary_entry_labelled_with_valid_state", entries,
           state_present,
           entries_is_list
           and all(isinstance(c, dict)
                   and c.get("state") in VALID_STATES for c in rows),
           "states: every declared entry is labelled idea, held "
           "or booked — no ambiguity and no other label")
    id_present = (
        entries_is_list
        and all(isinstance(c, dict) and "entry_id" in c for c in rows)
    )
    _check(results, "entry_states_and_totals",
           "no_itinerary_entry_id_duplicated", entries, id_present,
           entries_is_list and duplicate_entry_ids is not None
           and len(duplicate_entry_ids) == 0,
           "entries: no declared entry_id is carried by more "
           "than one entry — one record per entry")
    booked_ref_present = (
        entries_is_list
        and all("booking_reference" in c for c in booked_rows)
    )
    _check(results, "entry_states_and_totals",
           "every_booked_entry_carries_booking_reference", entries,
           booked_ref_present,
           entries_is_list
           and all(_nonempty(c.get("booking_reference"))
                   for c in booked_rows),
           "states: every booked entry carries its booking "
           "reference — booked means paid or confirmed")
    _check(results, "entry_states_and_totals",
           "every_booked_entry_records_its_total", entries,
           entries_is_list
           and all("total_amount" in c for c in booked_rows),
           booked_total_complete,
           "states: every booked entry records its total")
    booked_terms_present = (
        entries_is_list
        and all("terms_recorded" in c for c in booked_rows)
    )
    _check(results, "entry_states_and_totals",
           "every_booked_entry_records_its_terms", entries,
           booked_terms_present,
           entries_is_list
           and all(c.get("terms_recorded") is True
                   for c in booked_rows),
           "states: every booked entry records its terms")
    held_expiry_present = (
        entries_is_list
        and all("held_expiry_or_timestamp" in c for c in held_rows)
    )
    _check(results, "entry_states_and_totals",
           "every_held_entry_states_expiry_or_timestamp", entries,
           held_expiry_present,
           entries_is_list
           and all(_nonempty(c.get("held_expiry_or_timestamp"))
                   for c in held_rows),
           "states: every held entry states its expiry or "
           "timestamp — held means reserved or quoted live")
    _check(results, "entry_states_and_totals",
           "every_idea_entry_free_of_booking_reference", entries,
           entries_is_list,
           entries_is_list
           and all(not _nonempty(c.get("booking_reference"))
                   for c in idea_rows),
           "states: no idea entry carries a booking reference — "
           "an idea is a possibility, never presented as a booking")
    priced_rows = (
        [c for c in rows
         if isinstance(c, dict) and "total_amount" in c]
        if entries_is_list else []
    )
    priced_ts_present = (
        entries_is_list
        and all("price_timestamp" in c for c in priced_rows)
    )
    _check(results, "entry_states_and_totals",
           "every_priced_itinerary_entry_carries_price_timestamp",
           entries, priced_ts_present,
           entries_is_list
           and all(_nonempty(c.get("price_timestamp"))
                   for c in priced_rows),
           "prices: every priced entry carries the timestamp of "
           "the live result its total came from")
    _check(results, "entry_states_and_totals",
           "declared_booked_total_matches_sum_of_booked_entry_totals",
           declared_total,
           computed_booked_total is not None
           and has_declared_total and _is_number(declared_total),
           computed_booked_total is not None
           and has_declared_total and _is_number(declared_total)
           and _fmt6(declared_total - computed_booked_total)
           == "0.000000",
           "totals: the declared booked total equals the sum of "
           "the declared totals of the booked entries — "
           "arithmetic over declared numbers only")

    # ---- Section 4: skeleton_and_ordering (skill Method 4:
    #      "Lay the skeleton: outbound, stays, internal moves,
    #      return, in date order"; plus the internal consistency
    #      of the declared dates and movement legs) ----
    _bool_check(results, "skeleton_and_ordering",
                "outbound_leg_laid_in_skeleton", manifest,
                ("skeleton", "outbound_laid"),
                "skeleton: the outbound leg is laid")
    _bool_check(results, "skeleton_and_ordering",
                "stays_laid_in_skeleton", manifest,
                ("skeleton", "stays_laid"),
                "skeleton: the stays are laid")
    _bool_check(results, "skeleton_and_ordering",
                "internal_moves_laid_or_declared_none_needed", manifest,
                ("skeleton", "internal_moves_laid_or_none_needed"),
                "skeleton: the internal moves are laid, or the "
                "record declares none are needed")
    _bool_check(results, "skeleton_and_ordering",
                "return_leg_laid_in_skeleton", manifest,
                ("skeleton", "return_laid"),
                "skeleton: the return leg is laid")
    start_present = (
        entries_is_list
        and all(isinstance(c, dict) and "start_date" in c for c in rows)
    )
    _check(results, "skeleton_and_ordering",
           "itinerary_entries_in_declared_date_order", entries,
           start_present,
           entries_is_list and entries_out_of_date_order is not None
           and len(entries_out_of_date_order) == 0
           and all(isinstance(c, dict) and _nonempty(c.get("start_date"))
                   for c in rows),
           "skeleton: the declared entries are in date order by "
           "their declared start dates")
    both_dates_present = (
        entries_is_list
        and all(isinstance(c, dict) and "start_date" in c
                and "end_date" in c for c in rows)
    )
    _check(results, "skeleton_and_ordering",
           "no_itinerary_entry_ends_before_it_starts", entries,
           both_dates_present,
           entries_is_list and entries_ending_before_start is not None
           and len(entries_ending_before_start) == 0
           and all(isinstance(c, dict)
                   and _nonempty(c.get("start_date"))
                   and _nonempty(c.get("end_date")) for c in rows),
           "skeleton: no declared entry ends before it starts")
    _check(results, "skeleton_and_ordering",
           "every_itinerary_entry_within_trip_window", entries,
           both_dates_present and has_trip_start and has_trip_end,
           entries_is_list and header_dates_present
           and both_dates_present
           and entries_outside_trip_window is not None
           and len(entries_outside_trip_window) == 0
           and all(isinstance(c, dict)
                   and _nonempty(c.get("start_date"))
                   and _nonempty(c.get("end_date")) for c in rows),
           "skeleton: every declared entry lies inside the "
           "declared fixed trip window — the plan is built "
           "inside the chosen dates")
    movement_endpoints_present = (
        entries_is_list
        and all("origin" in c and "destination" in c
                for c in movement_rows)
    )
    _check(results, "skeleton_and_ordering",
           "declared_movement_legs_connect_in_sequence", entries,
           movement_endpoints_present,
           entries_is_list and movement_leg_breaks is not None
           and len(movement_leg_breaks) == 0
           and movement_endpoints_present
           and all(_nonempty(c.get("origin"))
                   and _nonempty(c.get("destination"))
                   for c in movement_rows),
           "skeleton: consecutive declared movement legs "
           "connect — each flight or ground-transport leg starts "
           "where the previous movement leg ended")

    # ---- Section 5: conflicts_flagged (skill Method 7 and
    #      "Surfacing conflicts": scan early; name the conflict,
    #      the pieces involved and the cost of ignoring it; flag
    #      tight connections and arrival after check-in closes;
    #      never hide a conflict) ----
    _bool_check(results, "conflicts_flagged",
                "conflicts_scanned_early_in_itinerary", manifest,
                ("conflicts", "scanned_early"),
                "conflicts: the itinerary was scanned for "
                "conflicts early")
    _bool_check(results, "conflicts_flagged",
                "tight_connections_flagged_in_itinerary", manifest,
                ("conflicts", "tight_connections_flagged"),
                "conflicts: tight connections are flagged where "
                "present, even when an airline will sell them")
    _bool_check(results, "conflicts_flagged",
                "arrival_after_checkin_close_flagged_in_itinerary",
                manifest,
                ("conflicts", "arrival_after_checkin_flagged"),
                "conflicts: arrival after check-in closes is "
                "flagged where present, the moment the flight "
                "time is known")
    _bool_check(results, "conflicts_flagged",
                "clashing_plans_flagged_in_itinerary", manifest,
                ("conflicts", "clashing_plans_flagged"),
                "conflicts: clashing plans are flagged where present")
    _bool_check(results, "conflicts_flagged",
                "flagged_conflicts_name_pieces_and_cost_of_ignoring",
                manifest,
                ("conflicts", "conflicts_name_pieces_and_cost"),
                "conflicts: each flagged conflict names the "
                "pieces involved and the cost of ignoring it")

    # ---- Section 6: predeparture_readthrough (skill Method 9:
    #      "Before departure, do a full read-through: documents,
    #      times with timezones, contacts, gaps") ----
    _bool_check(results, "predeparture_readthrough",
                "predeparture_full_readthrough_completed", manifest,
                ("readiness", "full_readthrough_completed"),
                "read-through: a full read-through of the "
                "itinerary was completed before departure")
    _bool_check(results, "predeparture_readthrough",
                "predeparture_documents_checked", manifest,
                ("readiness", "documents_checked"),
                "read-through: documents were checked")
    _bool_check(results, "predeparture_readthrough",
                "predeparture_times_with_timezones_checked", manifest,
                ("readiness", "times_with_timezones_checked"),
                "read-through: times with their timezones were checked")
    _bool_check(results, "predeparture_readthrough",
                "predeparture_contacts_checked", manifest,
                ("readiness", "contacts_checked"),
                "read-through: contacts were checked")
    _bool_check(results, "predeparture_readthrough",
                "predeparture_gaps_checked", manifest,
                ("readiness", "gaps_checked"),
                "read-through: gaps in the itinerary were checked")

    # ---- Section 7: red_lines (skill "Red lines") ----
    _false_check(results, "red_lines",
                 "no_trip_date_change_suggested_in_itinerary", manifest,
                 ("red_lines", "date_change_suggested_present"),
                 "red line: no change to the chosen travel dates "
                 "is suggested in the record — the plan works "
                 "within the dates chosen")
    _false_check(results, "red_lines",
                 "no_idea_or_held_quote_presented_as_booking", manifest,
                 ("red_lines",
                  "idea_or_quote_presented_as_booking_present"),
                 "red line: no idea or quote is presented as a "
                 "booking in the record")
    _false_check(results, "red_lines",
                 "no_invented_prices_schedules_visa_rules_or_availability_in_itinerary",
                 manifest,
                 ("red_lines", "invented_facts_present"),
                 "red line: no invented prices, schedules, visa "
                 "rules or availability are present in the record")
    _false_check(results, "red_lines",
                 "no_routing_adopted_before_entry_transit_constraints_checked",
                 manifest,
                 ("red_lines",
                  "routing_before_constraints_checked_present"),
                 "red line: no routing was adopted before its "
                 "entry and transit constraints were checked")
    _false_check(results, "red_lines",
                 "no_booking_or_payment_without_traveller_authorization",
                 manifest,
                 ("red_lines",
                  "unauthorized_booking_or_payment_present"),
                 "red line: no piece was booked or paid for "
                 "without the traveller's authorization for that "
                 "purchase")

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
        verdict = "SINGLE_LIVING_TRIP_ITINERARY_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SINGLE_LIVING_TRIP_ITINERARY_READY"

    computed_names = (
        "trip_window_start_not_after_end",
        "itinerary_entries_declared",
        "every_itinerary_entry_labelled_with_valid_state",
        "no_itinerary_entry_id_duplicated",
        "every_booked_entry_carries_booking_reference",
        "every_booked_entry_records_its_total",
        "every_booked_entry_records_its_terms",
        "every_held_entry_states_expiry_or_timestamp",
        "every_idea_entry_free_of_booking_reference",
        "every_priced_itinerary_entry_carries_price_timestamp",
        "declared_booked_total_matches_sum_of_booked_entry_totals",
        "itinerary_entries_in_declared_date_order",
        "no_itinerary_entry_ends_before_it_starts",
        "every_itinerary_entry_within_trip_window",
        "declared_movement_legs_connect_in_sequence",
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
        "service": "single-living-trip-itinerary",
        "atom_version": "0.1.0",
        "trip_title": manifest.get("trip_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "entries_count": entries_count,
        "booked_entries_count": booked_count,
        "computed_booked_total": _fmt6(computed_booked_total),
        "booked_total_difference": _fmt6(booked_total_difference),
        "duplicate_itinerary_entry_ids": duplicate_entry_ids,
        "itinerary_entry_ids_without_valid_state": ids_without_valid_state,
        "movement_leg_break_entry_ids": movement_leg_breaks,
        "entries_out_of_date_order": entries_out_of_date_order,
        "entries_ending_before_start": entries_ending_before_start,
        "entries_outside_trip_window": entries_outside_trip_window,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "SINGLE LIVING TRIP ITINERARY",
        f"trip_title: {verdict.get('trip_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: single_living_trip_itinerary.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SINGLE_LIVING_TRIP_ITINERARY_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
