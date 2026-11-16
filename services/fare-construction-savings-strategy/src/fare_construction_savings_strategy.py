#!/usr/bin/env python3
"""Fare construction savings strategy — deterministic core.

Built from the bound skill `travel-fares` (v1): "Lowest-cost
travel booking guidance (FareSutra)" — get the trip, explain the
fare logic, give the search strategy; never invent prices, a
quoted fare is a starting point not a promise, and surface the
total (fees, bags, seats — the headline fare is never the cost).

This atom does NOT search fares, quote prices, or book anything,
and exercises no travel judgment. The caller submits a
fare-construction manifest: one DECLARED fare-construction
record — its trip definition, its fare-driver explanations, its
search-strategy record, its surfaced total-cost figures, its
constructed itinerary legs and savings declaration, and its
price-integrity record. The atom validates that record
deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- total cost (rule: "Surface the total: fees, bags, seats. The
  headline fare is never the cost"): the declared total cost
  must equal the declared headline fare plus the declared fees,
  baggage fees and seat fees;
- constructed total (skill step 2 names split tickets as a fare
  driver; the atom's name is fare CONSTRUCTION): the declared
  constructed total must equal the sum of the declared prices
  of the construction legs;
- declared savings: the declared savings must equal the
  declared baseline direct fare minus the declared constructed
  total. The skill states no minimum saving, in money or in
  percent, so none is imposed — only the arithmetic is
  re-derived, and a matching negative or zero "saving" passes
  the arithmetic check (it is the caller's declaration, not
  this core's judgment).

Computed amounts are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The computed outcome over
the four computed checks is reported as `computed_status`.

Verdict:
- any fail             -> FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY

This is a completeness and consistency audit over declared
evidence, not a fare search and not travel advice: a record
that declares every step passes even if its fares are stale or
its construction is unwise, and nothing here verifies that a
declared price exists, is current, or is the lowest available.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "trip_definition",
    "fare_drivers_explained",
    "search_strategy",
    "total_cost_surface",
    "fare_construction",
    "price_integrity",
)


class ManifestTypeError(TypeError, ValueError):
    """A documented field is present with the wrong JSON type.

    Subclasses both TypeError (the task-level F1 contract) and
    ValueError (the sibling oracles' F1 error) so either caller
    mapping catches it; the message always names the field path.
    """


# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ManifestTypeError,
# raised before any evaluation), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "trip_label": "string",
    "trip": {
        "origin": "string",
        "destination": "string",
        "travel_dates": "string",
        "flexibility": "string",
    },
    "drivers": {
        "advance_purchase_explained": "boolean",
        "day_of_week_explained": "boolean",
        "nearby_airports_considered": "boolean",
        "split_tickets_considered": "boolean",
    },
    "strategy": {
        "search_strategy_given": "boolean",
        "price_only_without_strategy": "boolean",
    },
    "total_cost": {
        "headline_fare": "number",
        "fees": "number",
        "baggage_fees": "number",
        "seat_fees": "number",
        "declared_total_cost": "number",
        "total_cost_surfaced": "boolean",
        "headline_presented_as_total_cost": "boolean",
    },
    "construction": {
        "legs": [{
            "label": "string",
            "price": "number",
        }],
        "declared_constructed_total": "number",
        "baseline_direct_fare": "number",
        "declared_savings": "number",
        "constructed_option_compared_to_direct": "boolean",
    },
    "integrity": {
        "prices_invented": "boolean",
        "quoted_fare_presented_as_starting_point": "boolean",
        "recheck_before_booking_advised": "boolean",
        "uncheckable_items_disclosed": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ManifestTypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ManifestTypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ManifestTypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ManifestTypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ManifestTypeError(f"{path} must be an object")
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
           _is_nonempty_str(value), evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _construction_checks(results, manifest):
    """Computed construction-leg checks. Returns (legs_evaluated,
    computed_constructed_total, constructed_total_difference)."""
    legs, has_legs = _get(manifest, "construction", "legs")
    declared_total, has_total = _get(
        manifest, "construction", "declared_constructed_total")
    if not has_legs or not isinstance(legs, list) or not legs:
        for name, evidence in (
            ("construction_legs_complete",
             "no construction legs declared"),
            ("constructed_total_matches_sum_of_leg_prices",
             "no construction legs declared"),
        ):
            _check(results, "fare_construction", name,
                   legs, False, False, evidence)
        return 0, None, None
    incomplete = False
    evaluated = 0
    leg_sum = 0
    for entry in legs:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        label, has_label = _get(entry, "label")
        price, has_price = _get(entry, "price")
        if not (has_label and has_price and _is_nonempty_str(label)
                and _is_number(price)):
            incomplete = True
            continue
        evaluated += 1
        leg_sum += price
    if incomplete:
        _check(results, "fare_construction",
               "construction_legs_complete",
               legs, False, False,
               "a construction leg is missing its label or price")
        _check(results, "fare_construction",
               "constructed_total_matches_sum_of_leg_prices",
               legs, False, False,
               "a construction leg is incomplete, so the "
               "constructed total cannot be re-derived")
        return evaluated, None, None
    _check(results, "fare_construction",
           "construction_legs_complete",
           legs, True, True,
           "every construction leg carries a label and a price")
    computed_total = leg_sum
    difference = (
        declared_total - computed_total
        if has_total and _is_number(declared_total) else None
    )
    consistent = (
        has_total and _is_number(declared_total)
        and _fmt6(declared_total - computed_total) == "0.000000"
    )
    _check(results, "fare_construction",
           "constructed_total_matches_sum_of_leg_prices",
           declared_total, has_total and _is_number(declared_total),
           consistent,
           "the declared constructed total equals the sum of "
           "the declared construction leg prices")
    return evaluated, computed_total, difference


def evaluate(manifest):
    """Return the verdict dict for a fare-construction manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: trip_definition (skill step 1: "Get the
    #      trip: origin, destination, dates, flexibility") ----
    _string_check(results, "trip_definition", "origin_declared",
                  manifest, ("trip", "origin"),
                  "step 1: the trip origin is declared")
    _string_check(results, "trip_definition", "destination_declared",
                  manifest, ("trip", "destination"),
                  "step 1: the trip destination is declared")
    _string_check(results, "trip_definition", "travel_dates_declared",
                  manifest, ("trip", "travel_dates"),
                  "step 1: the travel dates are declared")
    _string_check(results, "trip_definition", "flexibility_declared",
                  manifest, ("trip", "flexibility"),
                  "step 1: the traveller's date flexibility is "
                  "declared")

    # ---- Section 2: fare_drivers_explained (skill step 2:
    #      "Explain the fare logic — what drives the price on
    #      this route (advance purchase, day-of-week, nearby
    #      airports, split tickets)") ----
    _bool_check(results, "fare_drivers_explained",
                "advance_purchase_driver_explained",
                manifest, ("drivers", "advance_purchase_explained"),
                "step 2: the advance-purchase driver is explained "
                "for this route")
    _bool_check(results, "fare_drivers_explained",
                "day_of_week_driver_explained",
                manifest, ("drivers", "day_of_week_explained"),
                "step 2: the day-of-week driver is explained for "
                "this route")
    _bool_check(results, "fare_drivers_explained",
                "nearby_airports_considered",
                manifest, ("drivers", "nearby_airports_considered"),
                "step 2: nearby airports are considered for this "
                "route")
    _bool_check(results, "fare_drivers_explained",
                "split_tickets_considered",
                manifest, ("drivers", "split_tickets_considered"),
                "step 2: split tickets are considered for this "
                "route")

    # ---- Section 3: search_strategy (skill step 3: "Give the
    #      search strategy, not just a price — prices move;
    #      strategy lasts") ----
    _bool_check(results, "search_strategy", "search_strategy_given",
                manifest, ("strategy", "search_strategy_given"),
                "step 3: a search strategy is given, not just a "
                "price")
    _false_check(results, "search_strategy",
                 "not_price_only_without_strategy",
                 manifest, ("strategy", "price_only_without_strategy"),
                 "step 3: the record is not a price alone without "
                 "a strategy")

    # ---- Section 4: total_cost_surface (skill rule: "Surface
    #      the total: fees, bags, seats. The headline fare is
    #      never the cost") ----
    _bool_check(results, "total_cost_surface", "total_cost_surfaced",
                manifest, ("total_cost", "total_cost_surfaced"),
                "rule: the total cost is surfaced to the caller, "
                "not only the headline fare")
    _false_check(results, "total_cost_surface",
                 "headline_not_presented_as_total_cost",
                 manifest,
                 ("total_cost", "headline_presented_as_total_cost"),
                 "rule: the headline fare is never presented as "
                 "the cost")
    headline, has_headline = _get(manifest, "total_cost",
                                  "headline_fare")
    fees, has_fees = _get(manifest, "total_cost", "fees")
    bags, has_bags = _get(manifest, "total_cost", "baggage_fees")
    seats, has_seats = _get(manifest, "total_cost", "seat_fees")
    declared_cost, has_cost = _get(manifest, "total_cost",
                                   "declared_total_cost")
    components_all_numbers = (
        has_headline and has_fees and has_bags and has_seats
        and _is_number(headline) and _is_number(fees)
        and _is_number(bags) and _is_number(seats)
    )
    computed_cost = (
        headline + fees + bags + seats
        if components_all_numbers else None
    )
    cost_all_numbers = (
        components_all_numbers and has_cost and _is_number(declared_cost)
    )
    cost_difference = (
        declared_cost - computed_cost
        if computed_cost is not None and has_cost
        and _is_number(declared_cost)
        else None
    )
    cost_consistent = (
        cost_all_numbers
        and _fmt6(declared_cost - computed_cost) == "0.000000"
    )
    _check(results, "total_cost_surface",
           "total_cost_matches_headline_plus_fees_bags_seats",
           declared_cost, cost_all_numbers, cost_consistent,
           "rule: the declared total cost equals the declared "
           "headline fare plus the declared fees, baggage fees "
           "and seat fees (fees, bags, seats are surfaced, never "
           "folded silently into the headline)")

    # ---- Section 5: fare_construction (skill step 2 names split
    #      tickets among the fare drivers; the construction is
    #      the record's declared legs, its declared constructed
    #      total against a declared baseline direct fare, and
    #      its declared savings) ----
    legs_evaluated, computed_constructed, constructed_difference = \
        _construction_checks(results, manifest)
    baseline, has_baseline = _get(manifest, "construction",
                                  "baseline_direct_fare")
    declared_total, has_total = _get(
        manifest, "construction", "declared_constructed_total")
    declared_savings, has_savings = _get(manifest, "construction",
                                         "declared_savings")
    savings_all_numbers = (
        has_baseline and has_total and has_savings
        and _is_number(baseline) and _is_number(declared_total)
        and _is_number(declared_savings)
    )
    computed_savings = (
        baseline - declared_total
        if has_baseline and has_total and _is_number(baseline)
        and _is_number(declared_total)
        else None
    )
    savings_difference = (
        declared_savings - computed_savings
        if computed_savings is not None and has_savings
        and _is_number(declared_savings)
        else None
    )
    savings_consistent = (
        savings_all_numbers
        and _fmt6(declared_savings - computed_savings) == "0.000000"
    )
    _check(results, "fare_construction",
           "declared_savings_matches_baseline_minus_constructed_total",
           declared_savings, savings_all_numbers, savings_consistent,
           "the declared savings equal the declared baseline "
           "direct fare minus the declared constructed total "
           "(no minimum saving is imposed — the skill states "
           "none; only the arithmetic is re-derived)")
    _bool_check(results, "fare_construction",
                "constructed_option_compared_to_direct",
                manifest,
                ("construction", "constructed_option_compared_to_direct"),
                "the constructed option is compared against the "
                "direct option on the record")

    # ---- Section 6: price_integrity (skill rules: "Never invent
    #      prices. Explain how to find them, or say what you
    #      can't check"; "A quoted fare is a starting point, not
    #      a promise — recheck before booking") ----
    _false_check(results, "price_integrity", "prices_not_invented",
                 manifest, ("integrity", "prices_invented"),
                 "rule: prices are never invented")
    _bool_check(results, "price_integrity",
                "quoted_fare_presented_as_starting_point_not_promise",
                manifest,
                ("integrity", "quoted_fare_presented_as_starting_point"),
                "rule: a quoted fare is presented as a starting "
                "point, not a promise")
    _bool_check(results, "price_integrity",
                "recheck_before_booking_advised",
                manifest, ("integrity", "recheck_before_booking_advised"),
                "rule: rechecking the fare before booking is "
                "advised")
    _bool_check(results, "price_integrity",
                "uncheckable_items_disclosed",
                manifest, ("integrity", "uncheckable_items_disclosed"),
                "rule: what cannot be checked is said, not "
                "silently omitted")

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
        verdict = "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "total_cost_matches_headline_plus_fees_bags_seats",
            "construction_legs_complete",
            "constructed_total_matches_sum_of_leg_prices",
            "declared_savings_matches_baseline_minus_constructed_total")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "fare-construction-savings-strategy",
        "atom_version": "0.1.0",
        "trip_label": manifest.get("trip_label"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "legs_evaluated": legs_evaluated,
        "computed_constructed_total": _fmt6(computed_constructed),
        "constructed_total_difference": _fmt6(constructed_difference),
        "computed_total_cost": _fmt6(computed_cost),
        "total_cost_difference": _fmt6(cost_difference),
        "computed_savings": _fmt6(computed_savings),
        "savings_difference": _fmt6(savings_difference),
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
        "FARE CONSTRUCTION SAVINGS STRATEGY",
        f"trip_label: {verdict.get('trip_label')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: fare_construction_savings_strategy.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == \
        "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
