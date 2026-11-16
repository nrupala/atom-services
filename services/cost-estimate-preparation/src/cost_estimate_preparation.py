#!/usr/bin/env python3
"""Cost estimate preparation — deterministic core.

Built from the bound skill `cost-estimation` (v1): "Estimate
costs honestly — classes, methods, ranges, escalation, and
learning from estimate vs actual."

This atom does NOT produce a cost estimate and exercises no
estimating judgment. The caller submits a cost-estimate
manifest: one DECLARED estimate artifact — its basis document
(class, method, assumptions, exclusions, estimator), its
element line items (quantity x rate and declared amounts), its
three-point uncertainty items, its declared totals chain
(subtotal, contingency, escalation, grand total), its
should-cost / vendor-quote record, and its estimate-vs-actual
feedback record. The atom validates that artifact
deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- estimate class and method (method steps 1-2): the declared
  class must be one of the classes the skill names
  (concept/ROM, budget, definitive) and the declared method one
  of the methods it names (bottom-up, parametric, analogous).
  The class percentage bands the skill gives are ranges, not
  fixed values, so no band is imposed as a pass mark;
- line items (method step 3, "elements, not lump sums"): each
  declared line amount must equal its declared quantity
  multiplied by its declared unit rate, and the declared
  subtotal must equal the sum of the declared line amounts;
- three-point uncertainty (method step 4): each item's
  declared spread must equal its declared pessimistic minus
  optimistic value, and the three points must be in
  optimistic <= likely <= pessimistic order. The skill states
  no formula for the expected value (no PERT weighting, no
  simple mean), so the declared expected value is checked for
  presence only, never re-derived;
- totals chain: the declared contingency amount must equal
  the declared subtotal multiplied by the declared contingency
  percent, the declared escalation amount must equal the
  declared subtotal multiplied by the declared escalation
  percent, and the declared grand total must equal the
  declared subtotal plus the declared contingency and
  escalation amounts. Neither percent is fixed by the skill,
  so each percent is a declaration whose amount arithmetic
  alone is re-derived — never a pass mark on the percent;
- should-cost variance (method step 6): the declared variance
  percent between the vendor quote and the should-cost
  benchmark must equal (quote - benchmark) / benchmark x 100
  re-derived from the declared amounts. Whether the variance
  is acceptable is not judged — only its arithmetic.

Computed amounts and ratios are serialized as strings with
exactly six decimal places, produced in both implementations by
the same fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The computed outcome over
the nine computed checks is reported as `computed_status`.

Verdict:
- any fail             -> COST_ESTIMATE_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> COST_ESTIMATE_READY

This is a completeness and consistency audit over declared
evidence, not estimating advice and not an estimate review: an
artifact that declares every step passes even if its underlying
numbers are optimistic, and nothing here verifies that a
declared value is true, that a rate is fair, or that the
estimate will hold.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "basis_and_class",
    "elements_and_line_items",
    "uncertainty_and_ranges",
    "totals_escalation_and_currency",
    "should_cost_and_quotes",
    "feedback_loop",
)

STATED_ESTIMATE_CLASSES = [
    "concept_rom",
    "budget",
    "definitive",
]

STATED_METHODS = [
    "bottom_up",
    "parametric",
    "analogous",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (estimate_class, method, line-item category)
# are validated as strings only, never enum-checked: class and
# method membership are verdict checks, not type errors.
MANIFEST_SPEC = {
    "entity": "string",
    "basis": {
        "document_present": "boolean",
        "estimate_class": "string",
        "method": "string",
        "assumptions_documented": "boolean",
        "exclusions_documented": "boolean",
        "estimator_identified": "boolean",
    },
    "elements": {
        "breakdown_not_lump_sum": "boolean",
        "labor_burden_included": "boolean",
        "hidden_padding_in_rates": "boolean",
    },
    "line_items": [{
        "label": "string",
        "category": "string",
        "quantity": "number",
        "unit_rate": "number",
        "declared_amount": "number",
    }],
    "uncertainty": {
        "ranges_stated_for_material_uncertainty": "boolean",
        "items": [{
            "label": "string",
            "optimistic": "number",
            "likely": "number",
            "pessimistic": "number",
            "declared_expected_value": "number",
            "declared_spread": "number",
        }],
        "expected_values_stated": "boolean",
        "single_number_precision_on_uncertain_scope": "boolean",
    },
    "totals": {
        "declared_subtotal": "number",
        "contingency_percent": "number",
        "declared_contingency_amount": "number",
        "escalation_percent": "number",
        "declared_escalation_amount": "number",
        "declared_grand_total": "number",
        "escalation_impacts_stated": "boolean",
        "currency_impacts_stated": "boolean",
        "quote_validity_dates_captured": "boolean",
    },
    "should_cost": {
        "benchmark_built_for_big_items": "boolean",
        "vendor_quote_amount": "number",
        "should_cost_amount": "number",
        "declared_variance_percent": "number",
        "quote_compared_to_benchmark": "boolean",
        "divergences_explained": "boolean",
        "quote_exclusions_reviewed": "boolean",
        "quote_assumptions_reviewed": "boolean",
        "validity_period_respected": "boolean",
        "quote_accepted_without_scope_review": "boolean",
    },
    "feedback": {
        "estimate_vs_actual_tracked_per_item": "boolean",
        "rates_updated_from_actuals": "boolean",
        "variance_lessons_published": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
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


def _line_item_checks(results, manifest):
    """Computed line-item checks. Returns (items_evaluated,
    computed_subtotal, subtotal_difference)."""
    items, has_items = _get(manifest, "line_items")
    if not has_items or not isinstance(items, list) or not items:
        for name, evidence in (
            ("line_item_entries_complete",
             "no line items declared"),
            ("line_item_amounts_match_quantity_times_rate",
             "no line items declared"),
            ("subtotal_matches_sum_of_line_items",
             "no line items declared"),
        ):
            _check(results, "elements_and_line_items", name,
                   items, False, False, evidence)
        return 0, None, None
    incomplete = False
    evaluated = 0
    amounts_ok = True
    declared_sum = 0
    for entry in items:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        label, has_label = _get(entry, "label")
        category, has_category = _get(entry, "category")
        quantity, has_quantity = _get(entry, "quantity")
        rate, has_rate = _get(entry, "unit_rate")
        amount, has_amount = _get(entry, "declared_amount")
        if not (has_label and has_category and has_quantity
                and has_rate and has_amount
                and _is_nonempty_str(label)
                and _is_nonempty_str(category)
                and _is_number(quantity) and _is_number(rate)
                and _is_number(amount)):
            incomplete = True
            continue
        evaluated += 1
        declared_sum += amount
        if _fmt6(amount - quantity * rate) != "0.000000":
            amounts_ok = False
    if incomplete:
        _check(results, "elements_and_line_items",
               "line_item_entries_complete",
               items, False, False,
               "a line item is missing its label, category, "
               "quantity, unit rate, or declared amount")
    else:
        _check(results, "elements_and_line_items",
               "line_item_entries_complete",
               items, True, True,
               "every line item carries a label, a category, a "
               "quantity, a unit rate, and a declared amount")
    if incomplete:
        _check(results, "elements_and_line_items",
               "line_item_amounts_match_quantity_times_rate",
               items, False, False,
               "a line item is incomplete, so its amount cannot "
               "be re-derived")
    else:
        _check(results, "elements_and_line_items",
               "line_item_amounts_match_quantity_times_rate",
               items, True, amounts_ok,
               "method step 3: each declared line amount equals "
               "its declared quantity multiplied by its declared "
               "unit rate")
    declared_subtotal, has_subtotal = _get(
        manifest, "totals", "declared_subtotal")
    computed_subtotal = None
    difference = None
    if incomplete or not _is_number(declared_subtotal):
        _check(results, "elements_and_line_items",
               "subtotal_matches_sum_of_line_items",
               items, False, False,
               "a line item is incomplete or no subtotal is "
               "declared, so the subtotal cannot be re-derived")
    else:
        computed_subtotal = declared_sum
        difference = declared_subtotal - declared_sum
        _check(results, "elements_and_line_items",
               "subtotal_matches_sum_of_line_items",
               items, True,
               _fmt6(declared_subtotal - declared_sum) == "0.000000",
               "method step 3: the declared subtotal equals the "
               "sum of the declared line amounts")
    return evaluated, computed_subtotal, difference


def _uncertainty_checks(results, manifest):
    """Computed three-point checks. Returns (items_evaluated,
    computed_total_spread, total_spread_difference)."""
    items, has_items = _get(manifest, "uncertainty", "items")
    if not has_items or not isinstance(items, list) or not items:
        for name, evidence in (
            ("uncertainty_entries_complete",
             "no three-point uncertainty items declared"),
            ("three_point_ordering_valid",
             "no three-point uncertainty items declared"),
            ("three_point_spreads_match_pessimistic_minus_optimistic",
             "no three-point uncertainty items declared"),
        ):
            _check(results, "uncertainty_and_ranges", name,
                   items, False, False, evidence)
        return 0, None, None
    incomplete = False
    evaluated = 0
    ordering_ok = True
    spreads_ok = True
    computed_total = 0
    declared_total = 0
    for entry in items:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        label, has_label = _get(entry, "label")
        optimistic, has_o = _get(entry, "optimistic")
        likely, has_l = _get(entry, "likely")
        pessimistic, has_p = _get(entry, "pessimistic")
        expected, has_e = _get(entry, "declared_expected_value")
        spread, has_s = _get(entry, "declared_spread")
        if not (has_label and has_o and has_l and has_p and has_e
                and has_s and _is_nonempty_str(label)
                and _is_number(optimistic) and _is_number(likely)
                and _is_number(pessimistic) and _is_number(expected)
                and _is_number(spread)):
            incomplete = True
            continue
        evaluated += 1
        if not (optimistic <= likely <= pessimistic):
            ordering_ok = False
        computed_total += pessimistic - optimistic
        declared_total += spread
        if _fmt6(spread - (pessimistic - optimistic)) != "0.000000":
            spreads_ok = False
    if incomplete:
        _check(results, "uncertainty_and_ranges",
               "uncertainty_entries_complete",
               items, False, False,
               "an uncertainty item is missing its label, "
               "optimistic, likely, or pessimistic point, "
               "declared expected value, or declared spread")
    else:
        _check(results, "uncertainty_and_ranges",
               "uncertainty_entries_complete",
               items, True, True,
               "every uncertainty item carries a label, three "
               "points, a declared expected value, and a declared "
               "spread")
    if incomplete:
        _check(results, "uncertainty_and_ranges",
               "three_point_ordering_valid",
               items, False, False,
               "an uncertainty item is incomplete, so its three "
               "points cannot be ordered")
        _check(results, "uncertainty_and_ranges",
               "three_point_spreads_match_pessimistic_minus_optimistic",
               items, False, False,
               "an uncertainty item is incomplete, so its spread "
               "cannot be re-derived")
        return evaluated, None, None
    _check(results, "uncertainty_and_ranges",
           "three_point_ordering_valid",
           items, True, ordering_ok,
           "method step 4: each item's three points are in "
           "optimistic <= likely <= pessimistic order")
    _check(results, "uncertainty_and_ranges",
           "three_point_spreads_match_pessimistic_minus_optimistic",
           items, True, spreads_ok,
           "method step 4: each declared spread equals its "
           "declared pessimistic minus optimistic value (the "
           "declared expected value states no formula in the "
           "skill and is checked for presence only)")
    return evaluated, computed_total, declared_total - computed_total


def evaluate(manifest):
    """Return the verdict dict for a cost-estimate manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: basis_and_class (skill method step 1:
    #      "Class the estimate: concept/ROM, budget, definitive —
    #      label it"; method step 2: "Method per situation:
    #      bottom-up, parametric, analogous"; quality gate:
    #      "Basis document: class, method, assumptions,
    #      exclusions, estimator") ----
    _bool_check(results, "basis_and_class", "basis_document_present",
                manifest, ("basis", "document_present"),
                "quality gate: a basis document is present for "
                "the estimate")
    estimate_class, has_class = _get(manifest, "basis",
                                     "estimate_class")
    _check(results, "basis_and_class",
           "estimate_class_in_stated_classes",
           estimate_class, has_class,
           has_class and estimate_class in STATED_ESTIMATE_CLASSES,
           "method step 1: the declared estimate class is one "
           "of the classes the skill names — concept/ROM, "
           "budget, definitive (declared as concept_rom, budget, "
           "or definitive)")
    method, has_method = _get(manifest, "basis", "method")
    _check(results, "basis_and_class", "method_in_stated_methods",
           method, has_method,
           has_method and method in STATED_METHODS,
           "method step 2: the declared method is one of the "
           "methods the skill names — bottom-up, parametric, "
           "analogous (declared as bottom_up, parametric, or "
           "analogous)")
    _bool_check(results, "basis_and_class", "assumptions_documented",
                manifest, ("basis", "assumptions_documented"),
                "quality gate: the basis document states the "
                "estimate's assumptions")
    _bool_check(results, "basis_and_class", "exclusions_documented",
                manifest, ("basis", "exclusions_documented"),
                "quality gate: the basis document states the "
                "estimate's exclusions")
    _bool_check(results, "basis_and_class", "estimator_identified",
                manifest, ("basis", "estimator_identified"),
                "quality gate: the basis document identifies the "
                "estimator")

    # ---- Section 2: elements_and_line_items (skill method
    #      step 3: "Elements, not lump sums: material, labor
    #      (hours x rates incl. burden), equipment, subcontract,
    #      freight, indirects — each line traceable"; red line:
    #      "no padding hidden inside rates") ----
    _bool_check(results, "elements_and_line_items",
                "elements_broken_down_not_lump_sum",
                manifest, ("elements", "breakdown_not_lump_sum"),
                "method step 3: the estimate is broken into "
                "elements, not lump sums — material, labor, "
                "equipment, subcontract, freight, indirects")
    _bool_check(results, "elements_and_line_items",
                "labor_rates_include_burden",
                manifest, ("elements", "labor_burden_included"),
                "method step 3: labor is costed as hours x rates "
                "including burden")
    items_evaluated, computed_subtotal, subtotal_difference = \
        _line_item_checks(results, manifest)
    _false_check(results, "elements_and_line_items",
                 "no_hidden_padding_in_rates",
                 manifest, ("elements", "hidden_padding_in_rates"),
                 "red line: no padding is hidden inside rates")

    # ---- Section 3: uncertainty_and_ranges (skill method step 4:
    #      "Uncertainty with three points:
    #      optimistic/likely/pessimistic for shaky items ->
    #      expected value + spread; ranges always, precision
    #      theater never"; quality gate: "Ranges (not points)
    #      for material uncertainty"; red line: "No
    #      single-number precision on uncertain scope") ----
    _bool_check(results, "uncertainty_and_ranges",
                "ranges_stated_for_material_uncertainty",
                manifest,
                ("uncertainty",
                 "ranges_stated_for_material_uncertainty"),
                "quality gate: ranges, not points, are stated "
                "for material uncertainty")
    unc_evaluated, computed_spread, spread_difference = \
        _uncertainty_checks(results, manifest)
    _bool_check(results, "uncertainty_and_ranges",
                "expected_values_stated",
                manifest, ("uncertainty", "expected_values_stated"),
                "method step 4: an expected value is stated for "
                "each shaky item alongside its spread")
    _false_check(results, "uncertainty_and_ranges",
                 "no_single_number_precision_on_uncertain_scope",
                 manifest,
                 ("uncertainty",
                  "single_number_precision_on_uncertain_scope"),
                 "red line: no single-number precision is "
                 "presented on uncertain scope")

    # ---- Section 4: totals_escalation_and_currency (skill
    #      method step 5: "Escalation & currency: inflation/fx/
    #      lead-time impacts stated; quote validity dates
    #      captured"; quality gate: "escalation handled") ----
    subtotal, has_sub = _get(manifest, "totals", "declared_subtotal")
    cont_pct, has_cont_pct = _get(manifest, "totals",
                                  "contingency_percent")
    cont_amt, has_cont_amt = _get(manifest, "totals",
                                  "declared_contingency_amount")
    contingency_all = (
        has_sub and has_cont_pct and has_cont_amt
        and _is_number(subtotal) and _is_number(cont_pct)
        and _is_number(cont_amt)
    )
    computed_contingency = (
        subtotal * cont_pct / 100
        if has_sub and has_cont_pct and _is_number(subtotal)
        and _is_number(cont_pct)
        else None
    )
    contingency_difference = (
        cont_amt - computed_contingency
        if computed_contingency is not None and has_cont_amt
        and _is_number(cont_amt)
        else None
    )
    _check(results, "totals_escalation_and_currency",
           "contingency_amount_matches_subtotal_times_percent",
           cont_amt, contingency_all,
           contingency_all
           and _fmt6(cont_amt - subtotal * cont_pct / 100)
           == "0.000000",
           "the declared contingency amount equals the declared "
           "subtotal multiplied by the declared contingency "
           "percent (the percent itself is fixed by no statement "
           "in the skill and is not judged here)")
    esc_pct, has_esc_pct = _get(manifest, "totals",
                                "escalation_percent")
    esc_amt, has_esc_amt = _get(manifest, "totals",
                                "declared_escalation_amount")
    escalation_all = (
        has_sub and has_esc_pct and has_esc_amt
        and _is_number(subtotal) and _is_number(esc_pct)
        and _is_number(esc_amt)
    )
    computed_escalation = (
        subtotal * esc_pct / 100
        if has_sub and has_esc_pct and _is_number(subtotal)
        and _is_number(esc_pct)
        else None
    )
    escalation_difference = (
        esc_amt - computed_escalation
        if computed_escalation is not None and has_esc_amt
        and _is_number(esc_amt)
        else None
    )
    _check(results, "totals_escalation_and_currency",
           "escalation_amount_matches_subtotal_times_percent",
           esc_amt, escalation_all,
           escalation_all
           and _fmt6(esc_amt - subtotal * esc_pct / 100)
           == "0.000000",
           "method step 5: the declared escalation amount "
           "equals the declared subtotal multiplied by the "
           "declared escalation percent (the percent itself is "
           "fixed by no statement in the skill and is not "
           "judged here)")
    grand, has_grand = _get(manifest, "totals",
                            "declared_grand_total")
    grand_all = (
        has_sub and has_cont_amt and has_esc_amt and has_grand
        and _is_number(subtotal) and _is_number(cont_amt)
        and _is_number(esc_amt) and _is_number(grand)
    )
    computed_grand = (
        subtotal + cont_amt + esc_amt
        if has_sub and has_cont_amt and has_esc_amt
        and _is_number(subtotal) and _is_number(cont_amt)
        and _is_number(esc_amt)
        else None
    )
    grand_difference = (
        grand - computed_grand
        if computed_grand is not None and has_grand
        and _is_number(grand)
        else None
    )
    _check(results, "totals_escalation_and_currency",
           "grand_total_matches_subtotal_plus_contingency_plus_escalation",
           grand, grand_all,
           grand_all
           and _fmt6(grand - (subtotal + cont_amt + esc_amt))
           == "0.000000",
           "the declared grand total equals the declared "
           "subtotal plus the declared contingency amount plus "
           "the declared escalation amount")
    _bool_check(results, "totals_escalation_and_currency",
                "escalation_impacts_stated",
                manifest, ("totals", "escalation_impacts_stated"),
                "method step 5: escalation impacts — inflation "
                "and lead-time — are stated")
    _bool_check(results, "totals_escalation_and_currency",
                "currency_impacts_stated",
                manifest, ("totals", "currency_impacts_stated"),
                "method step 5: currency (fx) impacts are stated")
    _bool_check(results, "totals_escalation_and_currency",
                "quote_validity_dates_captured",
                manifest, ("totals", "quote_validity_dates_captured"),
                "method step 5: quote validity dates are captured")

    # ---- Section 5: should_cost_and_quotes (skill method step 6:
    #      "Should-cost: for big items, build an independent
    #      benchmark and compare against vendor quotes; reconcile
    #      gaps"; method step 7: "Quote discipline: review
    #      exclusions and assumptions line by line; validity
    #      period respected"; quality gate: "Quotes' exclusions
    #      reviewed; divergences explained"; red line: "no vendor
    #      quote accepted without scope review") ----
    _bool_check(results, "should_cost_and_quotes",
                "should_cost_benchmark_built",
                manifest,
                ("should_cost", "benchmark_built_for_big_items"),
                "method step 6: an independent should-cost "
                "benchmark is built for big items")
    _bool_check(results, "should_cost_and_quotes",
                "quote_compared_to_benchmark",
                manifest,
                ("should_cost", "quote_compared_to_benchmark"),
                "method step 6: vendor quotes are compared "
                "against the should-cost benchmark")
    quote_amt, has_quote = _get(manifest, "should_cost",
                                "vendor_quote_amount")
    bench_amt, has_bench = _get(manifest, "should_cost",
                                "should_cost_amount")
    var_pct, has_var = _get(manifest, "should_cost",
                            "declared_variance_percent")
    variance_all = (
        has_quote and has_bench and has_var
        and _is_number(quote_amt) and _is_number(bench_amt)
        and _is_number(var_pct)
    )
    computed_variance = (
        (quote_amt - bench_amt) / bench_amt * 100
        if has_quote and has_bench and _is_number(quote_amt)
        and _is_number(bench_amt) and bench_amt != 0
        else None
    )
    variance_difference = (
        var_pct - computed_variance
        if computed_variance is not None and has_var
        and _is_number(var_pct)
        else None
    )
    _check(results, "should_cost_and_quotes",
           "quote_variance_percent_matches_rederived",
           var_pct, variance_all,
           variance_all and bench_amt != 0
           and _fmt6(var_pct
                     - (quote_amt - bench_amt) / bench_amt * 100)
           == "0.000000",
           "method step 6: the declared variance percent "
           "equals the declared vendor quote minus the declared "
           "should-cost benchmark, divided by the benchmark, "
           "times 100 (whether the variance is acceptable is "
           "not judged here)")
    _bool_check(results, "should_cost_and_quotes",
                "divergences_explained",
                manifest, ("should_cost", "divergences_explained"),
                "quality gate: divergences between quotes and "
                "the benchmark are explained — scope, rates, or "
                "margin")
    _bool_check(results, "should_cost_and_quotes",
                "quote_exclusions_reviewed",
                manifest, ("should_cost", "quote_exclusions_reviewed"),
                "quality gate: the quotes' exclusions are "
                "reviewed line by line")
    _bool_check(results, "should_cost_and_quotes",
                "quote_assumptions_reviewed",
                manifest, ("should_cost", "quote_assumptions_reviewed"),
                "method step 7: the quotes' assumptions are "
                "reviewed line by line")
    _bool_check(results, "should_cost_and_quotes",
                "validity_period_respected",
                manifest, ("should_cost", "validity_period_respected"),
                "method step 7: the quote validity period is "
                "respected")
    _false_check(results, "should_cost_and_quotes",
                 "no_quote_accepted_without_scope_review",
                 manifest,
                 ("should_cost", "quote_accepted_without_scope_review"),
                 "red line: no vendor quote is accepted without "
                 "scope review")

    # ---- Section 6: feedback_loop (skill method step 8:
    #      "Feedback loop: track estimate vs actual per item;
    #      update rates; publish variance lessons"; quality gate:
    #      "Estimate-vs-actual tracked and fed back into
    #      rates") ----
    _bool_check(results, "feedback_loop",
                "estimate_vs_actual_tracked_per_item",
                manifest,
                ("feedback", "estimate_vs_actual_tracked_per_item"),
                "quality gate: estimate vs actual is tracked per "
                "item")
    _bool_check(results, "feedback_loop",
                "rates_updated_from_actuals",
                manifest, ("feedback", "rates_updated_from_actuals"),
                "quality gate: tracked actuals are fed back into "
                "rates")
    _bool_check(results, "feedback_loop",
                "variance_lessons_published",
                manifest, ("feedback", "variance_lessons_published"),
                "method step 8: variance lessons are published")

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
        verdict = "COST_ESTIMATE_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "COST_ESTIMATE_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "estimate_class_in_stated_classes",
            "method_in_stated_methods",
            "line_item_amounts_match_quantity_times_rate",
            "subtotal_matches_sum_of_line_items",
            "three_point_spreads_match_pessimistic_minus_optimistic",
            "contingency_amount_matches_subtotal_times_percent",
            "escalation_amount_matches_subtotal_times_percent",
            "grand_total_matches_subtotal_plus_contingency_plus_escalation",
            "quote_variance_percent_matches_rederived")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "cost-estimate-preparation",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "line_items_evaluated": items_evaluated,
        "computed_subtotal": _fmt6(computed_subtotal),
        "subtotal_difference": _fmt6(subtotal_difference),
        "uncertainty_items_evaluated": unc_evaluated,
        "computed_total_spread": _fmt6(computed_spread),
        "total_spread_difference": _fmt6(spread_difference),
        "computed_contingency_amount": _fmt6(computed_contingency),
        "contingency_difference": _fmt6(contingency_difference),
        "computed_escalation_amount": _fmt6(computed_escalation),
        "escalation_difference": _fmt6(escalation_difference),
        "computed_grand_total": _fmt6(computed_grand),
        "grand_total_difference": _fmt6(grand_difference),
        "computed_quote_variance_percent": _fmt6(computed_variance),
        "quote_variance_difference": _fmt6(variance_difference),
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
        "COST ESTIMATE PREPARATION",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: cost_estimate_preparation.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "COST_ESTIMATE_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
