#!/usr/bin/env python3
"""Home shortlist carrying-cost comparison — deterministic core.

Built from the bound skill `home-search`: "Support a home search
with defined criteria, real comparable listings and full
carrying-cost comparison — organized research, not real-estate
advice."

This atom is a COMPUTED comparison over a caller-declared home
shortlist record: it validates the record a caller declares
against the skill's method — criteria first, real listings with
source and fetch date, full carrying cost per candidate, honest
tracking status, refresh before reliance, ranked presentation —
and it re-derives every number deterministically from the
declared figures:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed values use ONLY the declared figures plus the skill's
own stated rules — no outside threshold is imported:

- monthly carrying cost per home: the sum of the four declared
  monthly components — housing payment, property tax, utilities
  estimate, condo/HOA fees (method step 3 names tax, utilities
  and fees; step 4 requires one comparable monthly carrying cost
  per candidate). The housing payment is caller-declared: the
  atom never derives a mortgage payment from an asking price,
  because the skill states no interest rate, term or down-payment
  assumption to derive one from;
- declared-total consistency: a home's declared monthly carrying
  cost total must equal the re-derived sum of its declared
  components (the record's own arithmetic, re-derived);
- budget comparison: a home is over the declared budget ceiling
  exactly when its declared asking price exceeds the declared
  ceiling (method steps 1 and 7 — the ceiling is the caller's,
  and being over it is reported, never failed: step 7 asks that
  the conflict be shown plainly, not that the market obey);
- ranking: homes with complete cost figures ranked by re-derived
  monthly carrying cost, ascending, ties in declared order
  (method step 9 / red line: never rank on headline price while
  hiding fees that change the real cost);
- ruled-out reason: every home declared ruled out must carry a
  reason (method step 6 / quality gate: "Ruled-out homes carry a
  reason, not just a deletion");
- status vocabulary: every home's declared status must be one of
  the four statuses the skill names — live, ruled out, viewed,
  awaiting information (method step 6).

Computed amounts and ratios are serialized as strings with
exactly six decimal places, produced in both implementations by
the same fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. Counts are reported as
integers (exact).

The skill states no numeric pass/fail threshold beyond its own
rules — no affordability ratio, no income multiple, no interest
rate, no staleness age for a fetch date — so no such threshold
check is invented; quantities are computed and reported, and the
only bars are completeness and the record's own arithmetic,
exactly as stated above.

Verdict:
- any fail             -> HOME_SHORTLIST_COMPARISON_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> HOME_SHORTLIST_COMPARISON_READY

The atom fetches no listings and values no homes: it performs no
search, reads no listing source, and verifies no declared figure
against the market. A shortlist is ready *on the caller's declared
evidence*.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "criteria_first",
    "candidate_records",
    "carrying_cost_computation",
    "tracking_and_refresh",
    "ranking_and_presentation",
)

STATED_STATUSES = (
    "live",
    "ruled_out",
    "viewed",
    "awaiting_information",
)

COST_COMPONENTS = (
    "monthly_housing_payment",
    "monthly_property_tax",
    "monthly_utilities_estimate",
    "monthly_condo_or_hoa_fees",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (TypeError naming the
# field path), never evidence: F1 remedy, external verification
# Wave 1. Absent fields are not validated — absence is missing
# evidence, decided by the checks below.
MANIFEST_SPEC = {
    "search_name": "string",
    "currency": "string",
    "criteria": {
        "written_before_search": "boolean",
        "area": "string",
        "property_type": "string",
        "budget_ceiling": "number",
        "must_haves_defined": "boolean",
        "deal_breakers_defined": "boolean",
    },
    "homes": [{
        "name": "string",
        "listing_source": "string",
        "fetch_date": "string",
        "status": "string",
        "ruled_out_reason": "string",
        "asking_price": "number",
        "monthly_housing_payment": "number",
        "monthly_property_tax": "number",
        "monthly_utilities_estimate": "number",
        "monthly_condo_or_hoa_fees": "number",
        "declared_monthly_carrying_cost": "number",
        "open_questions": ["string"],
        "meets_criteria": "boolean",
    }],
    "tracking": {
        "tracked_in_one_list": "boolean",
        "refreshed_before_comparison": "boolean",
        "criteria_market_conflict_addressed": "boolean",
    },
    "presentation": {
        "ranked_on_carrying_cost_not_price_alone": "boolean",
        "sources_and_fetch_dates_attached": "boolean",
        "unknowns_presented_as_questions": "boolean",
        "freshness_limits_stated": "boolean",
        "presented_as_research_not_advice": "boolean",
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _nonempty_str(entry, field):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get(field), str)
        and len(entry[field]) > 0
    )


def _row_cost(entry):
    """Re-derived monthly carrying cost, or None when any of the
    four declared monthly components is absent from the row."""
    if not isinstance(entry, dict):
        return None
    total = 0
    for field in COST_COMPONENTS:
        value = entry.get(field)
        if not _is_number(value):
            return None
        total = total + value
    return total


def evaluate(manifest):
    """Return the verdict dict for a home-shortlist manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows and criteria, read once ----
    homes, has_homes = _get(manifest, "homes")
    homes_is_list = has_homes and isinstance(homes, list)
    homes_count = len(homes) if homes_is_list else None
    rows = homes if homes_is_list else []

    budget_ceiling, has_budget = _get(manifest, "criteria",
                                      "budget_ceiling")

    row_costs = [_row_cost(c) for c in rows]
    complete_idx = [i for i, c in enumerate(row_costs)
                    if c is not None]
    monthly_carrying_costs = (
        [{"name": _row_name(rows[i]),
          "monthly_carrying_cost": _fmt6(row_costs[i])}
         for i in range(len(rows))]
        if homes_is_list else None
    )
    total_carrying = (
        sum(row_costs[i] for i in complete_idx)
        if complete_idx else None
    )
    complete_costs = [row_costs[i] for i in complete_idx]
    lowest_carrying = min(complete_costs) if complete_costs else None
    highest_carrying = max(complete_costs) if complete_costs else None
    spread = (
        highest_carrying - lowest_carrying
        if complete_costs else None
    )
    ranked_idx = sorted(
        complete_idx, key=lambda i: (row_costs[i], i))
    ranked_home_names = (
        [_row_name(rows[i]) for i in ranked_idx]
        if homes_is_list else None
    )
    cheapest_home_name = (
        ranked_home_names[0] if ranked_home_names else None
    )
    cost_figure_coverage = (
        len(complete_idx) / homes_count
        if homes_is_list and homes_count > 0 else None
    )

    homes_without_source = (
        [_row_name(c) for c in rows
         if not _nonempty_str(c, "listing_source")]
        if homes_is_list else None
    )
    homes_without_fetch_date = (
        [_row_name(c) for c in rows
         if not _nonempty_str(c, "fetch_date")]
        if homes_is_list else None
    )
    homes_with_invalid_status = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and isinstance(c.get("status"), str)
         and c.get("status") not in STATED_STATUSES]
        if homes_is_list else None
    )
    ruled_out_rows = [
        c for c in rows
        if isinstance(c, dict) and c.get("status") == "ruled_out"
    ]
    ruled_out_without_reason = (
        [_row_name(c) for c in ruled_out_rows
         if "ruled_out_reason" in c
         and not _nonempty_str(c, "ruled_out_reason")]
        if homes_is_list else None
    )
    homes_not_meeting_criteria = (
        [_row_name(c) for c in rows
         if isinstance(c, dict) and c.get("meets_criteria") is False]
        if homes_is_list else None
    )
    mismatch_rows = [
        rows[i] for i in complete_idx
        if _is_number(rows[i].get("declared_monthly_carrying_cost"))
        and _fmt6(
            rows[i]["declared_monthly_carrying_cost"] - row_costs[i]
        ) != "0.000000"
    ]
    homes_with_carrying_cost_mismatch = (
        [_row_name(c) for c in mismatch_rows]
        if homes_is_list else None
    )

    budget_computable = homes_is_list and _is_number(budget_ceiling)
    homes_over_budget = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and _is_number(c.get("asking_price"))
         and c["asking_price"] > budget_ceiling]
        if budget_computable else None
    )
    within_budget = (
        [c for c in rows
         if isinstance(c, dict)
         and _is_number(c.get("asking_price"))
         and c["asking_price"] <= budget_ceiling]
        if budget_computable else None
    )
    homes_within_budget_count = (
        len(within_budget) if within_budget is not None else None
    )
    any_home_within_budget = (
        homes_within_budget_count > 0
        if homes_within_budget_count is not None else None
    )

    # ---- Section 1: criteria_first (skill method step 1: "Define
    #      the criteria before searching: area, budget ceiling,
    #      property type, must-haves, and deal-breakers — in
    #      writing"; quality gate: "Criteria were written down
    #      before listings were gathered") ----
    _bool_check(results, "criteria_first",
                "criteria_written_before_search", manifest,
                ("criteria", "written_before_search"),
                "method step 1 / quality gate: the criteria were "
                "written down before listings were gathered")
    currency, has_currency = _get(manifest, "currency")
    _check(results, "criteria_first", "currency_declared",
           currency, has_currency,
           isinstance(currency, str) and len(currency) > 0,
           "method step 3: every declared figure is in one "
           "declared currency — a non-empty currency string, so "
           "the comparison sums like with like")
    area, has_area = _get(manifest, "criteria", "area")
    _check(results, "criteria_first", "criteria_area_declared",
           area, has_area,
           isinstance(area, str) and len(area) > 0,
           "method step 1: the criteria name the search area — a "
           "non-empty area string")
    property_type, has_property_type = _get(
        manifest, "criteria", "property_type")
    _check(results, "criteria_first",
           "criteria_property_type_declared",
           property_type, has_property_type,
           isinstance(property_type, str)
           and len(property_type) > 0,
           "method step 1: the criteria name the property type — "
           "a non-empty property_type string")
    _check(results, "criteria_first",
           "criteria_budget_ceiling_declared",
           budget_ceiling, has_budget,
           _is_number(budget_ceiling) and budget_ceiling > 0,
           "method step 1: the criteria declare a budget ceiling "
           "— a positive declared amount, the caller's own "
           "ceiling (no affordability bar is imposed here)")
    _bool_check(results, "criteria_first", "must_haves_defined",
                manifest, ("criteria", "must_haves_defined"),
                "method step 1: the must-haves are defined in "
                "writing")
    _bool_check(results, "criteria_first", "deal_breakers_defined",
                manifest, ("criteria", "deal_breakers_defined"),
                "method step 1: the deal-breakers are defined in "
                "writing")

    # ---- Section 2: candidate_records (skill method steps 2, 5
    #      and 6; quality gates: "Every candidate names its
    #      listing source and fetch date"; "Ruled-out homes carry
    #      a reason, not just a deletion") ----
    _check(results, "candidate_records", "homes_declared",
           homes, homes_is_list,
           homes_is_list and homes_count > 0,
           "method step 2: the declared record names its "
           "candidate homes — the homes list is present and "
           "non-empty")
    source_present = (
        homes_is_list
        and all(isinstance(c, dict) and "listing_source" in c
                for c in rows)
    )
    _check(results, "candidate_records",
           "every_home_names_listing_source", homes,
           source_present,
           homes_is_list and homes_count > 0
           and len(homes_without_source) == 0,
           "quality gate: every candidate names its listing "
           "source — a non-empty listing_source string per home")
    fetch_present = (
        homes_is_list
        and all(isinstance(c, dict) and "fetch_date" in c
                for c in rows)
    )
    _check(results, "candidate_records",
           "every_home_names_fetch_date", homes, fetch_present,
           homes_is_list and homes_count > 0
           and len(homes_without_fetch_date) == 0,
           "quality gate: every candidate names the date its "
           "listing was fetched — a non-empty fetch_date string "
           "per home")
    status_present = (
        homes_is_list
        and all(isinstance(c, dict) and "status" in c for c in rows)
    )
    _check(results, "candidate_records",
           "every_home_declares_stated_status", homes,
           status_present,
           homes_is_list and homes_count > 0
           and len(homes_with_invalid_status) == 0
           and all(isinstance(c, dict)
                   and isinstance(c.get("status"), str)
                   and len(c["status"]) > 0 for c in rows),
           "method step 6: every home declares a tracking status "
           "from the statuses the skill names — live, ruled_out, "
           "viewed, awaiting_information")
    fit_present = (
        homes_is_list
        and all(isinstance(c, dict) and "meets_criteria" in c
                for c in rows)
    )
    _check(results, "candidate_records",
           "every_home_declares_fit_to_criteria", homes,
           fit_present,
           homes_is_list and homes_count > 0,
           "method step 9: every home declares whether it meets "
           "the written criteria, so the shortlist can be ranked "
           "on fit as well as carrying cost")
    ruled_out_present = (
        homes_is_list
        and all("ruled_out_reason" in c for c in ruled_out_rows)
    )
    _check(results, "candidate_records",
           "every_ruled_out_home_has_reason", homes,
           ruled_out_present,
           homes_is_list
           and len(ruled_out_without_reason) == 0
           and all(_nonempty_str(c, "ruled_out_reason")
                   for c in ruled_out_rows),
           "quality gate: ruled-out homes carry a reason, not "
           "just a deletion — every home declared ruled_out names "
           "a non-empty ruled_out_reason")
    questions_present = (
        homes_is_list
        and all(isinstance(c, dict) and "open_questions" in c
                for c in rows)
    )
    _check(results, "candidate_records",
           "every_home_lists_open_questions", homes,
           questions_present,
           homes_is_list and homes_count > 0,
           "method step 5: every home lists what the listing does "
           "not say as open questions — the open_questions list is "
           "declared per home (an empty list declares none)")

    # ---- Section 3: carrying_cost_computation (skill method
    #      steps 3 and 4: "For each candidate, capture the full
    #      picture: asking price, property tax, utilities
    #      estimate, and condo or HOA fees where relevant";
    #      "Compute a comparable monthly carrying cost for every
    #      candidate so price alone never decides the ranking";
    #      quality gate: "Comparison uses full carrying cost, not
    #      asking price alone"; red line: "Never invent listing
    #      details, fees, or costs the source did not state") ----
    price_present = (
        homes_is_list
        and all(isinstance(c, dict) and "asking_price" in c
                for c in rows)
    )
    _check(results, "carrying_cost_computation",
           "every_home_declares_asking_price", homes,
           price_present,
           homes_is_list and homes_count > 0
           and all(_is_number(c.get("asking_price"))
                   and c["asking_price"] > 0 for c in rows),
           "method step 3: every home declares its asking price "
           "— a positive declared amount per home")
    components_present = (
        homes_is_list
        and all(isinstance(c, dict)
                and all(f in c for f in COST_COMPONENTS)
                for c in rows)
    )
    _check(results, "carrying_cost_computation",
           "every_home_declares_all_monthly_cost_components",
           homes, components_present,
           homes_is_list and homes_count > 0
           and all(_is_number(c.get(f)) and c[f] >= 0
                   for c in rows for f in COST_COMPONENTS),
           "method step 3: every home declares all four monthly "
           "carrying-cost components — housing payment, property "
           "tax, utilities estimate, condo or HOA fees — each a "
           "non-negative declared amount (zero declares none, "
           "e.g. no HOA fees; nothing is estimated here)")
    totals_present = (
        components_present
        and all(isinstance(c, dict)
                and "declared_monthly_carrying_cost" in c
                for c in rows)
    )
    _check(results, "carrying_cost_computation",
           "declared_carrying_costs_match_rederived", homes,
           totals_present,
           homes_is_list and homes_count > 0
           and len(homes_with_carrying_cost_mismatch) == 0
           and len(complete_idx) == homes_count,
           "method step 4: each home's declared monthly carrying "
           "cost equals the re-derived sum of its four declared "
           "monthly components")

    # ---- Section 4: tracking_and_refresh (skill method steps 6,
    #      7 and 8: "Track candidates in one list with honest
    #      status notes"; "When criteria and market reality
    #      conflict — nothing matches at budget — say so plainly
    #      and show the nearest trade-offs"; "Refresh stale
    #      candidates before any comparison is relied on") ----
    _bool_check(results, "tracking_and_refresh",
                "candidates_tracked_in_one_list", manifest,
                ("tracking", "tracked_in_one_list"),
                "method step 6: the candidates are tracked in one "
                "list with honest status notes")
    _bool_check(results, "tracking_and_refresh",
                "stale_candidates_refreshed_before_comparison",
                manifest,
                ("tracking", "refreshed_before_comparison"),
                "method step 8: stale candidates were refreshed "
                "before the comparison is relied on — availability "
                "and price change without notice")
    _bool_check(results, "tracking_and_refresh",
                "criteria_market_conflict_addressed", manifest,
                ("tracking", "criteria_market_conflict_addressed"),
                "method step 7: where criteria and market reality "
                "conflict, that is stated plainly with the nearest "
                "trade-offs shown (or none was found)")

    # ---- Section 5: ranking_and_presentation (skill method step
    #      9: "Present the shortlist ranked on fit to criteria and
    #      carrying cost, with sources and fetch dates attached";
    #      quality gate: "Unknowns are listed as questions, never
    #      filled in by guesswork"; red lines: "Never rank on
    #      headline price while hiding fees that change the real
    #      cost"; "Never present a listing price or availability
    #      as current beyond its fetch time"; "education and
    #      organization, not real-estate advice") ----
    _bool_check(results, "ranking_and_presentation",
                "shortlist_ranked_on_carrying_cost_not_price_alone",
                manifest,
                ("presentation",
                 "ranked_on_carrying_cost_not_price_alone"),
                "method step 9 / red line: the shortlist is ranked "
                "on fit to criteria and full carrying cost — never "
                "on headline price while hiding fees")
    _bool_check(results, "ranking_and_presentation",
                "sources_and_fetch_dates_attached_to_shortlist",
                manifest,
                ("presentation", "sources_and_fetch_dates_attached"),
                "method step 9: sources and fetch dates are "
                "attached to the presented shortlist")
    _bool_check(results, "ranking_and_presentation",
                "unknowns_presented_as_questions_not_assumptions",
                manifest,
                ("presentation", "unknowns_presented_as_questions"),
                "quality gate: unknowns are listed as questions, "
                "never filled in by guesswork")
    _bool_check(results, "ranking_and_presentation",
                "freshness_limits_stated", manifest,
                ("presentation", "freshness_limits_stated"),
                "red line: no listing price or availability is "
                "presented as current beyond its fetch time — the "
                "freshness limits are stated")
    _bool_check(results, "ranking_and_presentation",
                "presented_as_research_not_advice", manifest,
                ("presentation", "presented_as_research_not_advice"),
                "red line: the comparison is presented as education "
                "and organization, not real-estate advice — the buy "
                "decision stays with the caller and their own "
                "professionals")

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
        verdict = "HOME_SHORTLIST_COMPARISON_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "HOME_SHORTLIST_COMPARISON_READY"

    computed_names = (
        "homes_declared",
        "every_home_names_listing_source",
        "every_home_names_fetch_date",
        "every_home_declares_stated_status",
        "every_ruled_out_home_has_reason",
        "every_home_declares_all_monthly_cost_components",
        "declared_carrying_costs_match_rederived",
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
        "service": "home-shortlist-carrying-cost-comparison",
        "atom_version": "0.1.0",
        "search_name": manifest.get("search_name"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "homes_count": homes_count,
        "monthly_carrying_costs": monthly_carrying_costs,
        "total_monthly_carrying_cost": _fmt6(total_carrying),
        "lowest_monthly_carrying_cost": _fmt6(lowest_carrying),
        "highest_monthly_carrying_cost": _fmt6(highest_carrying),
        "carrying_cost_spread": _fmt6(spread),
        "ranked_home_names": ranked_home_names,
        "cheapest_home_name": cheapest_home_name,
        "cost_figure_coverage": _fmt6(cost_figure_coverage),
        "homes_without_listing_source": homes_without_source,
        "homes_without_fetch_date": homes_without_fetch_date,
        "homes_with_invalid_status": homes_with_invalid_status,
        "ruled_out_homes_without_reason": ruled_out_without_reason,
        "homes_not_meeting_criteria": homes_not_meeting_criteria,
        "homes_with_carrying_cost_mismatch":
            homes_with_carrying_cost_mismatch,
        "homes_over_budget_ceiling": homes_over_budget,
        "homes_within_budget_count": homes_within_budget_count,
        "any_home_within_budget": any_home_within_budget,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "HOME SHORTLIST CARRYING COST COMPARISON",
        f"search_name: {verdict.get('search_name')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print(
            "usage: home_shortlist_carrying_cost_comparison.py "
            "<manifest.json>",
            file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "HOME_SHORTLIST_COMPARISON_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
