#!/usr/bin/env python3
"""Engineering project budget pack — deterministic core.

Built from the bound skill `project-budgets` (v1): "Engineering
budgets done right — estimate basis, contingency, change
control, tracking actuals through closeout."

This atom does NOT prepare a project budget and exercises no
budgeting judgment. The caller submits a budget-pack manifest:
one DECLARED budget artifact — its basis document, its budget
line items (quantity x rate, each marked quote-based or
allowance), its declared totals chain (subtotal, contingency,
management reserve, total budget, change impact, revised
budget), its approval / baseline record, its change log, its
tracking record (commitments, actuals, forecast-to-complete),
and its closeout record. The atom validates that artifact
deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- line items (method step 2, "Build the number"): each declared
  line amount must equal its declared quantity multiplied by
  its declared unit rate; the declared subtotal must equal the
  sum of the declared line amounts; and every line item must
  carry one of the two pricing-basis marks the skill names —
  quote-based or allowance (declared as quote_based or
  allowance);
- contingency (method step 3): the declared contingency amount
  must equal the declared subtotal multiplied by the declared
  contingency percent. The skill fixes no percent, so the
  percent is a declaration whose amount arithmetic alone is
  re-derived — never a pass mark on the percent;
- total budget: the declared total budget must equal the
  declared subtotal plus the declared contingency amount plus
  the declared management reserve amount (the reserve is held
  separately, method step 3, so it enters the total as its own
  declared line, never buried in the others);
- change control (method step 5): the declared total change
  impact must equal the sum of the declared change-log entries'
  cost impacts, and the declared revised budget must equal the
  declared total budget plus the declared total change impact;
- tracking (method step 6): the declared total forecast must
  equal the declared actuals plus the declared
  forecast-to-complete, and the declared forecast variance must
  equal the declared total forecast minus the declared revised
  budget;
- closeout (method step 7): the declared final variance must
  equal the declared final cost minus the declared revised
  budget, and the declared unspent contingency must equal the
  declared contingency amount minus the declared contingency
  used amount.

Computed amounts are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The computed outcome over
the eleven computed checks is reported as `computed_status`.

Verdict:
- any fail             -> BUDGET_PACK_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> BUDGET_PACK_READY

This is a completeness and consistency audit over declared
evidence, not budget advice and not a budget review: a pack
that declares every step passes even if its underlying numbers
are optimistic, and nothing here verifies that a declared value
is true, that a rate is fair, or that the budget will hold.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "basis_document",
    "budget_build_and_line_items",
    "contingency_reserve_and_totals",
    "approval_and_baseline",
    "change_control_and_tracking",
    "closeout_and_contingency_disposition",
)

STATED_PRICING_BASES = [
    "quote_based",
    "allowance",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (line-item category, pricing_basis) are
# validated as strings only, never enum-checked at the type
# layer: pricing-basis membership is a verdict check, not a type
# error, and category is never enum-checked at all.
MANIFEST_SPEC = {
    "entity": "string",
    "basis": {
        "document_present": "boolean",
        "scope_of_estimate_stated": "boolean",
        "assumptions_stated": "boolean",
        "exclusions_stated": "boolean",
        "quote_validity_stated": "boolean",
        "fx_escalation_stated": "boolean",
        "estimator_named": "boolean",
    },
    "build": {
        "labor_costed_rate_times_hours": "boolean",
        "indirects_included": "boolean",
    },
    "line_items": [{
        "label": "string",
        "category": "string",
        "pricing_basis": "string",
        "quantity": "number",
        "unit_rate": "number",
        "declared_amount": "number",
    }],
    "contingency": {
        "risks_listed_for_contingency": "boolean",
        "management_reserve_held_separately": "boolean",
        "padding_buried_in_estimate": "boolean",
    },
    "totals": {
        "declared_subtotal": "number",
        "contingency_percent": "number",
        "declared_contingency_amount": "number",
        "declared_management_reserve_amount": "number",
        "declared_total_budget": "number",
        "declared_total_change_impact": "number",
        "declared_revised_budget": "number",
    },
    "approval": {
        "approval_recorded": "boolean",
        "baseline_from_approved_amount": "boolean",
        "revisions_reapproved": "boolean",
        "work_without_approved_estimate_or_po": "boolean",
    },
    "changes": {
        "log_maintained": "boolean",
        "verbal_change_orders_used": "boolean",
    },
    "change_entries": [{
        "label": "string",
        "cost_impact": "number",
        "impact_statement_present": "boolean",
        "approved_before_work": "boolean",
    }],
    "tracking": {
        "commitments_vs_actuals_tracked": "boolean",
        "invoice_reconciliation_against_delivery": "boolean",
        "monthly_report_issued": "boolean",
        "variance_reported_with_reasons": "boolean",
        "commitments_amount": "number",
        "actuals_amount": "number",
        "forecast_to_complete_amount": "number",
        "declared_total_forecast_amount": "number",
        "declared_forecast_variance_amount": "number",
    },
    "closeout": {
        "final_cost_reconciled": "boolean",
        "variance_explained": "boolean",
        "lessons_captured": "boolean",
        "contingency_disposition_stated": "boolean",
        "unspent_contingency_released_explicitly": "boolean",
        "declared_final_cost": "number",
        "declared_final_variance_amount": "number",
        "contingency_used_amount": "number",
        "declared_unspent_contingency_amount": "number",
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
            ("line_item_pricing_basis_marked",
             "no line items declared"),
            ("line_item_amounts_match_quantity_times_rate",
             "no line items declared"),
            ("subtotal_matches_sum_of_line_items",
             "no line items declared"),
        ):
            _check(results, "budget_build_and_line_items", name,
                   items, False, False, evidence)
        return 0, None, None
    incomplete = False
    evaluated = 0
    amounts_ok = True
    bases_ok = True
    declared_sum = 0
    for entry in items:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        label, has_label = _get(entry, "label")
        category, has_category = _get(entry, "category")
        basis, has_basis = _get(entry, "pricing_basis")
        quantity, has_quantity = _get(entry, "quantity")
        rate, has_rate = _get(entry, "unit_rate")
        amount, has_amount = _get(entry, "declared_amount")
        if not (has_label and has_category and has_basis
                and has_quantity and has_rate and has_amount
                and _is_nonempty_str(label)
                and _is_nonempty_str(category)
                and isinstance(basis, str)
                and _is_number(quantity) and _is_number(rate)
                and _is_number(amount)):
            incomplete = True
            continue
        evaluated += 1
        declared_sum += amount
        if basis not in STATED_PRICING_BASES:
            bases_ok = False
        if _fmt6(amount - quantity * rate) != "0.000000":
            amounts_ok = False
    if incomplete:
        _check(results, "budget_build_and_line_items",
               "line_item_entries_complete",
               items, False, False,
               "a line item is missing its label, category, "
               "pricing basis, quantity, unit rate, or declared "
               "amount")
        _check(results, "budget_build_and_line_items",
               "line_item_pricing_basis_marked",
               items, False, False,
               "a line item is incomplete, so its pricing basis "
               "cannot be checked")
        _check(results, "budget_build_and_line_items",
               "line_item_amounts_match_quantity_times_rate",
               items, False, False,
               "a line item is incomplete, so its amount cannot "
               "be re-derived")
    else:
        _check(results, "budget_build_and_line_items",
               "line_item_entries_complete",
               items, True, True,
               "every line item carries a label, a category, a "
               "pricing basis, a quantity, a unit rate, and a "
               "declared amount")
        _check(results, "budget_build_and_line_items",
               "line_item_pricing_basis_marked",
               items, True, bases_ok,
               "method step 2: every line item is marked "
               "quote-based or allowance (declared as quote_based "
               "or allowance)")
        _check(results, "budget_build_and_line_items",
               "line_item_amounts_match_quantity_times_rate",
               items, True, amounts_ok,
               "method step 2: each declared line amount equals "
               "its declared quantity multiplied by its declared "
               "unit rate")
    declared_subtotal, has_subtotal = _get(
        manifest, "totals", "declared_subtotal")
    computed_subtotal = None
    difference = None
    if incomplete or not _is_number(declared_subtotal):
        _check(results, "budget_build_and_line_items",
               "subtotal_matches_sum_of_line_items",
               items, False, False,
               "a line item is incomplete or no subtotal is "
               "declared, so the subtotal cannot be re-derived")
    else:
        computed_subtotal = declared_sum
        difference = declared_subtotal - declared_sum
        _check(results, "budget_build_and_line_items",
               "subtotal_matches_sum_of_line_items",
               items, True,
               _fmt6(declared_subtotal - declared_sum) == "0.000000",
               "method step 2: the declared subtotal equals the "
               "sum of the declared line amounts")
    return evaluated, computed_subtotal, difference


def _change_entry_checks(results, manifest):
    """Computed change-log checks. Returns (entries_evaluated,
    computed_change_impact_total, change_impact_difference)."""
    items, has_items = _get(manifest, "change_entries")
    if not has_items or not isinstance(items, list) or not items:
        for name, evidence in (
            ("change_entries_complete",
             "no change entries declared"),
            ("all_changes_have_impact_statements",
             "no change entries declared"),
            ("all_changes_approved_before_work",
             "no change entries declared"),
            ("change_impact_total_matches_sum_of_entries",
             "no change entries declared"),
        ):
            _check(results, "change_control_and_tracking", name,
                   items, False, False, evidence)
        return 0, None, None
    incomplete = False
    evaluated = 0
    impacts_ok = True
    approvals_ok = True
    computed_total = 0
    for entry in items:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        label, has_label = _get(entry, "label")
        impact, has_impact = _get(entry, "cost_impact")
        statement, has_statement = _get(entry, "impact_statement_present")
        approved, has_approved = _get(entry, "approved_before_work")
        if not (has_label and has_impact and has_statement
                and has_approved and _is_nonempty_str(label)
                and _is_number(impact)
                and isinstance(statement, bool)
                and isinstance(approved, bool)):
            incomplete = True
            continue
        evaluated += 1
        computed_total += impact
        if statement is not True:
            impacts_ok = False
        if approved is not True:
            approvals_ok = False
    if incomplete:
        _check(results, "change_control_and_tracking",
               "change_entries_complete",
               items, False, False,
               "a change entry is missing its label, cost impact, "
               "impact-statement mark, or approval-before-work mark")
        _check(results, "change_control_and_tracking",
               "all_changes_have_impact_statements",
               items, False, False,
               "a change entry is incomplete, so its impact "
               "statement cannot be checked")
        _check(results, "change_control_and_tracking",
               "all_changes_approved_before_work",
               items, False, False,
               "a change entry is incomplete, so its "
               "approval-before-work mark cannot be checked")
    else:
        _check(results, "change_control_and_tracking",
               "change_entries_complete",
               items, True, True,
               "every change entry carries a label, a cost "
               "impact, an impact-statement mark, and an "
               "approval-before-work mark")
        _check(results, "change_control_and_tracking",
               "all_changes_have_impact_statements",
               items, True, impacts_ok,
               "method step 5: every scope change carries a cost "
               "and schedule impact statement")
        _check(results, "change_control_and_tracking",
               "all_changes_approved_before_work",
               items, True, approvals_ok,
               "method step 5: every scope change is approved "
               "before the work is done")
    declared_total, has_total = _get(
        manifest, "totals", "declared_total_change_impact")
    computed = None
    difference = None
    if incomplete or not _is_number(declared_total):
        _check(results, "change_control_and_tracking",
               "change_impact_total_matches_sum_of_entries",
               items, False, False,
               "a change entry is incomplete or no total change "
               "impact is declared, so the total cannot be "
               "re-derived")
    else:
        computed = computed_total
        difference = declared_total - computed_total
        _check(results, "change_control_and_tracking",
               "change_impact_total_matches_sum_of_entries",
               items, True,
               _fmt6(declared_total - computed_total) == "0.000000",
               "method step 5: the declared total change impact "
               "equals the sum of the declared change entries' "
               "cost impacts")
    return evaluated, computed, difference


def evaluate(manifest):
    """Return the verdict dict for a budget-pack manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: basis_document (skill method step 1:
    #      "Basis document first: scope of estimate, assumptions,
    #      exclusions, quote validity, FX/escalation, estimator
    #      name — an estimate without a basis is a guess wearing
    #      a suit"; quality gate: "Basis doc for every estimate")
    #      ----
    _bool_check(results, "basis_document", "basis_document_present",
                manifest, ("basis", "document_present"),
                "quality gate: a basis document is present for "
                "every estimate")
    _bool_check(results, "basis_document",
                "basis_scope_of_estimate_stated",
                manifest, ("basis", "scope_of_estimate_stated"),
                "method step 1: the basis document states the "
                "scope of the estimate")
    _bool_check(results, "basis_document", "basis_assumptions_stated",
                manifest, ("basis", "assumptions_stated"),
                "method step 1: the basis document states the "
                "estimate's assumptions")
    _bool_check(results, "basis_document", "basis_exclusions_stated",
                manifest, ("basis", "exclusions_stated"),
                "method step 1: the basis document states the "
                "estimate's exclusions")
    _bool_check(results, "basis_document",
                "basis_quote_validity_stated",
                manifest, ("basis", "quote_validity_stated"),
                "method step 1: the basis document states quote "
                "validity")
    _bool_check(results, "basis_document",
                "basis_fx_escalation_stated",
                manifest, ("basis", "fx_escalation_stated"),
                "method step 1: the basis document states FX and "
                "escalation treatment")
    _bool_check(results, "basis_document", "basis_estimator_named",
                manifest, ("basis", "estimator_named"),
                "method step 1: the basis document names the "
                "estimator")

    # ---- Section 2: budget_build_and_line_items (skill method
    #      step 2: "Build the number: material (quotes/unit
    #      rates), labor (rate x hours), subcontract, rentals,
    #      indirects (freight, permits); mark quote-based vs
    #      allowance items") ----
    _bool_check(results, "budget_build_and_line_items",
                "labor_costed_rate_times_hours",
                manifest, ("build", "labor_costed_rate_times_hours"),
                "method step 2: labor is built as rate x hours")
    _bool_check(results, "budget_build_and_line_items",
                "indirects_included",
                manifest, ("build", "indirects_included"),
                "method step 2: indirects — freight and permits — "
                "are included in the build")
    items_evaluated, computed_subtotal, subtotal_difference = \
        _line_item_checks(results, manifest)

    # ---- Section 3: contingency_reserve_and_totals (skill
    #      method step 3: "Contingency & reserve: contingency
    #      sized to uncertainty (explicit %, tied to listed
    #      risks); management reserve held separately; never bury
    #      padding") ----
    _bool_check(results, "contingency_reserve_and_totals",
                "contingency_tied_to_listed_risks",
                manifest,
                ("contingency", "risks_listed_for_contingency"),
                "method step 3: the contingency is tied to listed "
                "risks")
    _bool_check(results, "contingency_reserve_and_totals",
                "management_reserve_held_separately",
                manifest,
                ("contingency", "management_reserve_held_separately"),
                "method step 3: the management reserve is held "
                "separately from the contingency")
    _false_check(results, "contingency_reserve_and_totals",
                 "no_padding_buried_in_estimate",
                 manifest, ("contingency", "padding_buried_in_estimate"),
                 "method step 3: no padding is buried in the "
                 "estimate")
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
    _check(results, "contingency_reserve_and_totals",
           "contingency_amount_matches_subtotal_times_percent",
           cont_amt, contingency_all,
           contingency_all
           and _fmt6(cont_amt - subtotal * cont_pct / 100)
           == "0.000000",
           "method step 3: the declared contingency amount "
           "equals the declared subtotal multiplied by the "
           "declared contingency percent (the percent itself is "
           "fixed by no statement in the skill and is not judged "
           "here)")
    reserve_amt, has_reserve = _get(
        manifest, "totals", "declared_management_reserve_amount")
    total_budget, has_total_budget = _get(
        manifest, "totals", "declared_total_budget")
    total_all = (
        has_sub and has_cont_amt and has_reserve and has_total_budget
        and _is_number(subtotal) and _is_number(cont_amt)
        and _is_number(reserve_amt) and _is_number(total_budget)
    )
    computed_total_budget = (
        subtotal + cont_amt + reserve_amt
        if has_sub and has_cont_amt and has_reserve
        and _is_number(subtotal) and _is_number(cont_amt)
        and _is_number(reserve_amt)
        else None
    )
    total_budget_difference = (
        total_budget - computed_total_budget
        if computed_total_budget is not None and has_total_budget
        and _is_number(total_budget)
        else None
    )
    _check(results, "contingency_reserve_and_totals",
           "total_budget_matches_subtotal_plus_contingency_plus_reserve",
           total_budget, total_all,
           total_all
           and _fmt6(total_budget
                     - (subtotal + cont_amt + reserve_amt))
           == "0.000000",
           "the declared total budget equals the declared "
           "subtotal plus the declared contingency amount plus "
           "the declared management reserve amount (the reserve "
           "held separately, as its own declared line)")

    # ---- Section 4: approval_and_baseline (skill method step 4:
    #      "Approval & baseline: approval per thresholds; the
    #      approved number is the baseline; revisions are
    #      re-approved — not drifted"; quality gate: "approvals
    #      recorded"; red line: "No work without an approved
    #      estimate/PO") ----
    _bool_check(results, "approval_and_baseline", "approval_recorded",
                manifest, ("approval", "approval_recorded"),
                "quality gate: the budget approval is recorded")
    _bool_check(results, "approval_and_baseline",
                "approved_amount_is_the_baseline",
                manifest,
                ("approval", "baseline_from_approved_amount"),
                "method step 4: the approved number is the "
                "baseline")
    _bool_check(results, "approval_and_baseline",
                "revisions_reapproved_not_drifted",
                manifest, ("approval", "revisions_reapproved"),
                "method step 4: revisions are re-approved, not "
                "drifted")
    _false_check(results, "approval_and_baseline",
                 "no_work_without_approved_estimate_or_po",
                 manifest,
                 ("approval", "work_without_approved_estimate_or_po"),
                 "red line: no work is done without an approved "
                 "estimate or PO")

    # ---- Section 5: change_control_and_tracking (skill method
    #      step 5: "Change control: every scope change -> cost +
    #      schedule impact statement -> approved BEFORE work;
    #      track the change log"; method step 6: "Tracking:
    #      commitments (POs) vs actuals vs forecast-to-complete;
    #      invoice reconciliation against delivery; monthly
    #      one-page report (variance + reasons + actions)";
    #      quality gate: "Changes logged with impact + approval
    #      before execution"; red line: "no verbal change
    #      orders") ----
    _bool_check(results, "change_control_and_tracking",
                "change_log_maintained",
                manifest, ("changes", "log_maintained"),
                "method step 5: the change log is tracked")
    _false_check(results, "change_control_and_tracking",
                 "no_verbal_change_orders",
                 manifest, ("changes", "verbal_change_orders_used"),
                 "red line: no verbal change orders are used")
    changes_evaluated, computed_change_total, change_difference = \
        _change_entry_checks(results, manifest)
    change_total, has_change_total = _get(
        manifest, "totals", "declared_total_change_impact")
    revised, has_revised = _get(manifest, "totals",
                                "declared_revised_budget")
    revised_all = (
        has_total_budget and has_change_total and has_revised
        and _is_number(total_budget) and _is_number(change_total)
        and _is_number(revised)
    )
    computed_revised = (
        total_budget + change_total
        if has_total_budget and has_change_total
        and _is_number(total_budget) and _is_number(change_total)
        else None
    )
    revised_difference = (
        revised - computed_revised
        if computed_revised is not None and has_revised
        and _is_number(revised)
        else None
    )
    _check(results, "change_control_and_tracking",
           "revised_budget_matches_total_budget_plus_change_impact",
           revised, revised_all,
           revised_all
           and _fmt6(revised - (total_budget + change_total))
           == "0.000000",
           "method step 4: the declared revised budget equals "
           "the declared total budget plus the declared total "
           "change impact (the baseline moves only through "
           "approved changes, never by drift)")
    _bool_check(results, "change_control_and_tracking",
                "commitments_vs_actuals_tracked",
                manifest,
                ("tracking", "commitments_vs_actuals_tracked"),
                "method step 6: commitments (POs) are tracked "
                "against actuals")
    _bool_check(results, "change_control_and_tracking",
                "invoice_reconciliation_against_delivery",
                manifest,
                ("tracking",
                 "invoice_reconciliation_against_delivery"),
                "method step 6: invoices are reconciled against "
                "delivery")
    _bool_check(results, "change_control_and_tracking",
                "monthly_report_issued",
                manifest, ("tracking", "monthly_report_issued"),
                "method step 6: the monthly one-page report is "
                "issued (variance, reasons, and actions)")
    _bool_check(results, "change_control_and_tracking",
                "variance_reported_with_reasons",
                manifest,
                ("tracking", "variance_reported_with_reasons"),
                "quality gate: variance is reported with reasons "
                "— no unexplained deltas")
    actuals, has_actuals = _get(manifest, "tracking", "actuals_amount")
    ftc, has_ftc = _get(manifest, "tracking",
                        "forecast_to_complete_amount")
    total_fc, has_total_fc = _get(
        manifest, "tracking", "declared_total_forecast_amount")
    forecast_all = (
        has_actuals and has_ftc and has_total_fc
        and _is_number(actuals) and _is_number(ftc)
        and _is_number(total_fc)
    )
    computed_forecast = (
        actuals + ftc
        if has_actuals and has_ftc and _is_number(actuals)
        and _is_number(ftc)
        else None
    )
    forecast_difference = (
        total_fc - computed_forecast
        if computed_forecast is not None and has_total_fc
        and _is_number(total_fc)
        else None
    )
    _check(results, "change_control_and_tracking",
           "total_forecast_matches_actuals_plus_forecast_to_complete",
           total_fc, forecast_all,
           forecast_all
           and _fmt6(total_fc - (actuals + ftc)) == "0.000000",
           "method step 6: the declared total forecast equals "
           "the declared actuals plus the declared "
           "forecast-to-complete")
    fc_var, has_fc_var = _get(
        manifest, "tracking", "declared_forecast_variance_amount")
    fc_var_all = (
        has_total_fc and has_revised and has_fc_var
        and _is_number(total_fc) and _is_number(revised)
        and _is_number(fc_var)
    )
    computed_fc_var = (
        total_fc - revised
        if has_total_fc and has_revised and _is_number(total_fc)
        and _is_number(revised)
        else None
    )
    fc_var_difference = (
        fc_var - computed_fc_var
        if computed_fc_var is not None and has_fc_var
        and _is_number(fc_var)
        else None
    )
    _check(results, "change_control_and_tracking",
           "forecast_variance_matches_total_forecast_minus_revised_budget",
           fc_var, fc_var_all,
           fc_var_all
           and _fmt6(fc_var - (total_fc - revised)) == "0.000000",
           "method step 6: the declared forecast variance "
           "equals the declared total forecast minus the "
           "declared revised budget (whether the variance is "
           "acceptable is not judged here)")

    # ---- Section 6: closeout_and_contingency_disposition (skill
    #      method step 7: "Closeout: final cost vs budget;
    #      variance explained; lessons captured; unspent
    #      contingency released explicitly"; quality gate:
    #      "Closeout reconciles; contingency disposition
    #      stated") ----
    _bool_check(results, "closeout_and_contingency_disposition",
                "final_cost_vs_budget_reconciled",
                manifest, ("closeout", "final_cost_reconciled"),
                "quality gate: closeout reconciles — final cost "
                "against budget")
    _bool_check(results, "closeout_and_contingency_disposition",
                "closeout_variance_explained",
                manifest, ("closeout", "variance_explained"),
                "method step 7: the closeout variance is explained")
    _bool_check(results, "closeout_and_contingency_disposition",
                "lessons_captured",
                manifest, ("closeout", "lessons_captured"),
                "method step 7: lessons are captured at closeout")
    _bool_check(results, "closeout_and_contingency_disposition",
                "contingency_disposition_stated",
                manifest,
                ("closeout", "contingency_disposition_stated"),
                "quality gate: the contingency disposition is "
                "stated at closeout")
    _bool_check(results, "closeout_and_contingency_disposition",
                "unspent_contingency_released_explicitly",
                manifest,
                ("closeout",
                 "unspent_contingency_released_explicitly"),
                "method step 7: unspent contingency is released "
                "explicitly")
    final_cost, has_final = _get(manifest, "closeout",
                                 "declared_final_cost")
    final_var, has_final_var = _get(
        manifest, "closeout", "declared_final_variance_amount")
    final_var_all = (
        has_final and has_revised and has_final_var
        and _is_number(final_cost) and _is_number(revised)
        and _is_number(final_var)
    )
    computed_final_var = (
        final_cost - revised
        if has_final and has_revised and _is_number(final_cost)
        and _is_number(revised)
        else None
    )
    final_var_difference = (
        final_var - computed_final_var
        if computed_final_var is not None and has_final_var
        and _is_number(final_var)
        else None
    )
    _check(results, "closeout_and_contingency_disposition",
           "final_variance_matches_final_cost_minus_revised_budget",
           final_var, final_var_all,
           final_var_all
           and _fmt6(final_var - (final_cost - revised))
           == "0.000000",
           "method step 7: the declared final variance equals "
           "the declared final cost minus the declared revised "
           "budget")
    used, has_used = _get(manifest, "closeout",
                          "contingency_used_amount")
    unspent, has_unspent = _get(
        manifest, "closeout", "declared_unspent_contingency_amount")
    unspent_all = (
        has_cont_amt and has_used and has_unspent
        and _is_number(cont_amt) and _is_number(used)
        and _is_number(unspent)
    )
    computed_unspent = (
        cont_amt - used
        if has_cont_amt and has_used and _is_number(cont_amt)
        and _is_number(used)
        else None
    )
    unspent_difference = (
        unspent - computed_unspent
        if computed_unspent is not None and has_unspent
        and _is_number(unspent)
        else None
    )
    _check(results, "closeout_and_contingency_disposition",
           "unspent_contingency_matches_contingency_minus_used",
           unspent, unspent_all,
           unspent_all
           and _fmt6(unspent - (cont_amt - used)) == "0.000000",
           "method step 7: the declared unspent contingency "
           "equals the declared contingency amount minus the "
           "declared contingency used amount")

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
        verdict = "BUDGET_PACK_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "BUDGET_PACK_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "line_item_pricing_basis_marked",
            "line_item_amounts_match_quantity_times_rate",
            "subtotal_matches_sum_of_line_items",
            "contingency_amount_matches_subtotal_times_percent",
            "total_budget_matches_subtotal_plus_contingency_plus_reserve",
            "change_impact_total_matches_sum_of_entries",
            "revised_budget_matches_total_budget_plus_change_impact",
            "total_forecast_matches_actuals_plus_forecast_to_complete",
            "forecast_variance_matches_total_forecast_minus_revised_budget",
            "final_variance_matches_final_cost_minus_revised_budget",
            "unspent_contingency_matches_contingency_minus_used")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "engineering-project-budget-pack",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "line_items_evaluated": items_evaluated,
        "computed_subtotal": _fmt6(computed_subtotal),
        "subtotal_difference": _fmt6(subtotal_difference),
        "change_entries_evaluated": changes_evaluated,
        "computed_change_impact_total": _fmt6(computed_change_total),
        "change_impact_difference": _fmt6(change_difference),
        "computed_contingency_amount": _fmt6(computed_contingency),
        "contingency_difference": _fmt6(contingency_difference),
        "computed_total_budget": _fmt6(computed_total_budget),
        "total_budget_difference": _fmt6(total_budget_difference),
        "computed_revised_budget": _fmt6(computed_revised),
        "revised_budget_difference": _fmt6(revised_difference),
        "computed_total_forecast": _fmt6(computed_forecast),
        "total_forecast_difference": _fmt6(forecast_difference),
        "computed_forecast_variance": _fmt6(computed_fc_var),
        "forecast_variance_difference": _fmt6(fc_var_difference),
        "computed_final_variance": _fmt6(computed_final_var),
        "final_variance_difference": _fmt6(final_var_difference),
        "computed_unspent_contingency": _fmt6(computed_unspent),
        "unspent_contingency_difference": _fmt6(unspent_difference),
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
        "ENGINEERING PROJECT BUDGET PACK",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<38} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: engineering_project_budget_pack.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "BUDGET_PACK_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
