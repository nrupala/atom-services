#!/usr/bin/env python3
"""Budget design review — deterministic core.

Built from the bound skill `budgeting` (v1): "Run budgets that
hold — cycles, owners, zero-based vs incremental, variance
reviews, rolling forecasts." This atom reviews one declared
budget design — its scope, lines, drivers, totals, revenue link,
contingency, approval baseline, monitoring and close — against
the skill's nine method steps, its four quality gates, and its
red lines. It does not author a budget, choose amounts, or judge
whether the amounts are wise — it checks that the declared
design contains what the skill's method requires, and that its
declared arithmetic agrees with itself.

The caller submits a budget-design manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- budget kind (method step 1): the declared budget type must be
  one of the three kinds the skill names — operating, capital,
  personal;
- line approaches (method step 3): every line's declared
  approach must be one of the two the skill names — zero-based
  or incremental;
- driver products (method step 4: "headcount x rate, units x
  cost, usage x price"): every line's declared amount must equal
  its declared driver quantity times its declared driver unit
  cost;
- total re-derivation: the declared total must equal the sum of
  the declared line amounts;
- balance (method step 5: "budgets balance against expected
  income, not hope"): the declared total must not exceed the
  declared expected income;
- rolling horizon (method step 8): the declared rolling
  forecast horizon must be the twelve months the skill states.

The skill states NO numeric variance threshold and NO
contingency percentage, so none is checked: the atom checks only
that variance thresholds are declared to trigger written
explanations and actions, and that contingency is an explicit
line sized to identified risks — never the size itself.

Money totals are serialized as strings with exactly two decimal
places, produced in both implementations by the same fixed rule
— round half up to 2dp, floor(v * 100 + 0.5) / 100, then format
with exactly two decimals. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical. The
output also reports `lines_evaluated`, `ownerless_line_indexes`,
`computed_total`, `total_difference`, and the computed outcome
over the five computed checks as `computed_status`.

Verdict:
- any fail             -> BUDGET_DESIGN_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> BUDGET_DESIGN_SOUND

This is a completeness and consistency review over declared
evidence, not financial advice and not a judgment review: a
design that declares every step passes even if its amounts turn
out wrong, and nothing here verifies that a declared value is
true, that an owner agreed to own a line, or that the expected
income will arrive.

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "scope",
    "structure_and_owners",
    "drivers_and_totals",
    "revenue_and_contingency",
    "approval_and_baseline",
    "monitoring_and_close",
)

STATED_BUDGET_TYPES = ["operating", "capital", "personal"]

STATED_APPROACHES = ["zero_based", "incremental"]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (budget type, line approaches) are validated
# as strings only, never enum-checked: membership is a verdict
# check, not a type error.
MANIFEST_SPEC = {
    "budget": "string",
    "scope": {
        "budget_type": "string",
        "entity_named": "boolean",
        "currency_stated": "boolean",
        "governs_stated": "boolean",
        "exclusions_stated": "boolean",
    },
    "lines": [{
        "name": "string",
        "owner": "string",
        "approach": "string",
        "driver_documented": "boolean",
        "driver_quantity": "number",
        "driver_unit_cost": "number",
        "amount": "number",
    }],
    "totals": {
        "declared_total": "number",
        "expected_income": "number",
    },
    "revenue": {
        "linked_to_forecast": "boolean",
    },
    "contingency": {
        "explicit_line_present": "boolean",
        "sized_to_identified_risks": "boolean",
        "hidden_padding_present": "boolean",
    },
    "approval": {
        "baseline_approved_and_locked": "boolean",
        "approval_thresholds_documented": "boolean",
        "revisions_reapproved": "boolean",
    },
    "monitoring": {
        "monthly_variance_process_running": "boolean",
        "variance_thresholds_trigger_explanations": "boolean",
        "variance_actions_tracked": "boolean",
        "rolling_forecast_cadence_set": "boolean",
        "rolling_horizon_months": "number",
    },
    "close": {
        "annual_true_up_done": "boolean",
        "carry_over_rules_decided": "boolean",
        "lessons_carried_to_next_cycle": "boolean",
        "silent_reallocations_made": "boolean",
        "actuals_edited_without_annotation": "boolean",
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


def _fmt2(value):
    """Fixed 2dp money serialization: round half up, 2 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 100 + 0.5) / 100
    return f"{rounded:.2f}"


def evaluate(manifest):
    """Return the verdict dict for a budget-design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    lines, has_lines_field = _get(manifest, "lines")
    lines_is_list = has_lines_field and isinstance(lines, list)
    line_entries = lines if lines_is_list else []
    has_lines = lines_is_list and len(line_entries) > 0

    # ---- Section 1: scope (skill method step 1: "Scope first:
    #      operating vs capital vs personal; entity and currency;
    #      what the budget governs (and what it doesn't)") ----
    budget_type, has_type = _get(manifest, "scope", "budget_type")
    _check(results, "scope", "budget_type_is_stated_kind", budget_type,
           has_type,
           has_type and budget_type in STATED_BUDGET_TYPES,
           "method step 1: the budget type is one of the kinds "
           "the skill names — operating, capital, or personal")
    _bool_check(results, "scope", "entity_named",
                manifest, ("scope", "entity_named"),
                "method step 1: the entity the budget belongs to "
                "is named")
    _bool_check(results, "scope", "currency_stated",
                manifest, ("scope", "currency_stated"),
                "method step 1: the budget currency is stated")
    _bool_check(results, "scope", "governs_stated",
                manifest, ("scope", "governs_stated"),
                "method step 1: what the budget governs is stated")
    _bool_check(results, "scope", "exclusions_stated",
                manifest, ("scope", "exclusions_stated"),
                "method step 1: what the budget does not govern "
                "is stated")

    # ---- Section 2: structure_and_owners (skill method step 2:
    #      "Structure with owners: cost centers/lines each with a
    #      named owner — lines without owners become orphaned
    #      spending"; step 3: "Approach per line: zero-based for
    #      new/volatile areas; incremental for stable ones —
    #      state which you're using"; quality gate: "Every line
    #      has an owner") ----
    _check(results, "structure_and_owners", "lines_present", lines,
           lines_is_list, has_lines,
           "method step 2: the budget declares at least one line")
    ownerless = (
        [i for i, entry in enumerate(line_entries)
         if not (isinstance(entry, dict)
                 and isinstance(entry.get("owner"), str)
                 and len(entry.get("owner")) > 0)]
        if lines_is_list else None
    )
    all_owners_present = has_lines and all(
        isinstance(entry, dict) and "owner" in entry
        for entry in line_entries)
    _check(results, "structure_and_owners",
           "every_line_has_named_owner", lines, all_owners_present,
           all_owners_present and len(ownerless) == 0,
           "quality gate: every line has an owner — lines "
           "without owners become orphaned spending")
    all_approaches_present = has_lines and all(
        isinstance(entry, dict) and "approach" in entry
        for entry in line_entries)
    _check(results, "structure_and_owners",
           "every_line_approach_is_stated_kind", lines,
           all_approaches_present,
           all_approaches_present and all(
               entry.get("approach") in STATED_APPROACHES
               for entry in line_entries),
           "method step 3: every line states its approach, and "
           "each approach is one the skill names — zero-based "
           "for new/volatile areas, incremental for stable ones")

    # ---- Section 3: drivers_and_totals (skill method step 4:
    #      "Build from drivers: headcount x rate, units x cost,
    #      usage x price — not flat percentages; drivers make
    #      variance diagnosable"; quality gate: "drivers
    #      documented") ----
    all_drivers_present = has_lines and all(
        isinstance(entry, dict) and "driver_documented" in entry
        for entry in line_entries)
    _check(results, "drivers_and_totals",
           "drivers_documented_for_every_line", lines,
           all_drivers_present,
           all_drivers_present and all(
               entry.get("driver_documented") is True
               for entry in line_entries),
           "quality gate: drivers are documented for every "
           "line — built from drivers, not flat percentages")
    all_driver_numbers = has_lines and all(
        isinstance(entry, dict)
        and _is_number(entry.get("amount"))
        and _is_number(entry.get("driver_quantity"))
        and _is_number(entry.get("driver_unit_cost"))
        for entry in line_entries)
    _check(results, "drivers_and_totals",
           "line_amounts_match_driver_products", lines,
           all_driver_numbers,
           all_driver_numbers and all(
               entry["amount"]
               == entry["driver_quantity"] * entry["driver_unit_cost"]
               for entry in line_entries),
           "method step 4: every line amount equals its "
           "declared driver quantity times its declared driver "
           "unit cost (headcount x rate, units x cost, usage "
           "x price)")
    declared_total, has_declared_total = _get(
        manifest, "totals", "declared_total")
    all_amounts = has_lines and all(
        isinstance(entry, dict) and _is_number(entry.get("amount"))
        for entry in line_entries)
    computed_sum = (
        sum(entry["amount"] for entry in line_entries)
        if all_amounts else None
    )
    total_computable = all_amounts and has_declared_total \
        and _is_number(declared_total)
    _check(results, "drivers_and_totals",
           "declared_total_matches_line_sum", declared_total,
           total_computable,
           total_computable and computed_sum == declared_total,
           "the declared total equals the sum of the declared "
           "line amounts — the total is re-derived, not trusted")
    difference = (
        declared_total - computed_sum
        if total_computable else None
    )

    # ---- Section 4: revenue_and_contingency (skill method
    #      step 5: "Revenue side: link to revenue-management and
    #      forecasting — budgets balance against expected
    #      income, not hope"; step 6: "Contingency explicit: a
    #      visible line sized to identified risks; hidden
    #      padding is forbidden"; quality gate: "Contingency
    #      explicit"; red line: "No hidden padding") ----
    _bool_check(results, "revenue_and_contingency",
                "revenue_linked_to_forecast",
                manifest, ("revenue", "linked_to_forecast"),
                "method step 5: the revenue side is linked to "
                "forecasting — expected income, not hope")
    expected_income, has_income = _get(
        manifest, "totals", "expected_income")
    balance_computable = has_declared_total \
        and _is_number(declared_total) \
        and has_income and _is_number(expected_income)
    _check(results, "revenue_and_contingency",
           "budget_balances_against_expected_income",
           expected_income, balance_computable,
           balance_computable and declared_total <= expected_income,
           "method step 5: the declared total does not exceed "
           "the declared expected income — the budget balances "
           "against expected income")
    _bool_check(results, "revenue_and_contingency",
                "contingency_explicit_line_present",
                manifest, ("contingency", "explicit_line_present"),
                "quality gate: contingency is explicit — a "
                "visible line, not buried in other lines")
    _bool_check(results, "revenue_and_contingency",
                "contingency_sized_to_identified_risks",
                manifest,
                ("contingency", "sized_to_identified_risks"),
                "method step 6: the contingency line is sized "
                "to identified risks")
    _false_check(results, "revenue_and_contingency",
                 "no_hidden_padding",
                 manifest, ("contingency", "hidden_padding_present"),
                 "red line: no hidden padding")

    # ---- Section 5: approval_and_baseline (skill method step 7:
    #      "Approve & lock the baseline: revisions re-approved,
    #      not drifted; approval thresholds documented"; quality
    #      gate: "approval thresholds set") ----
    _bool_check(results, "approval_and_baseline",
                "baseline_approved_and_locked",
                manifest, ("approval", "baseline_approved_and_locked"),
                "method step 7: the baseline is approved and "
                "locked")
    _bool_check(results, "approval_and_baseline",
                "approval_thresholds_documented",
                manifest,
                ("approval", "approval_thresholds_documented"),
                "quality gate: approval thresholds are set and "
                "documented — who may approve money decisions, "
                "and up to what was decided (the threshold "
                "values themselves are the caller's, not checked)")
    _bool_check(results, "approval_and_baseline",
                "revisions_reapproved_not_drifted",
                manifest, ("approval", "revisions_reapproved"),
                "method step 7: revisions are re-approved, not "
                "drifted into the baseline")

    # ---- Section 6: monitoring_and_close (skill method step 8:
    #      "Monitor: monthly budget vs actual vs latest forecast;
    #      variance thresholds trigger written explanations +
    #      actions; rolling 12-month forecast where things move
    #      fast"; step 9: "Close: annual true-up; carry-over
    #      rules decided; lessons to next cycle"; quality gates:
    #      "Monthly variance process running with actions";
    #      "Rolling forecast cadence set where volatility
    #      demands"; red lines: "no silent reallocations";
    #      "actuals never edited (corrections annotated with
    #      date + reason)") ----
    _bool_check(results, "monitoring_and_close",
                "monthly_variance_process_running",
                manifest,
                ("monitoring", "monthly_variance_process_running"),
                "quality gate: a monthly variance process is "
                "running — budget vs actual vs latest forecast, "
                "on a calendar, not a crisis")
    _bool_check(results, "monitoring_and_close",
                "variance_thresholds_trigger_written_explanations",
                manifest,
                ("monitoring",
                 "variance_thresholds_trigger_explanations"),
                "method step 8: variance thresholds trigger "
                "written explanations (the threshold values are "
                "the caller's — the skill states none, so none "
                "is checked)")
    _bool_check(results, "monitoring_and_close",
                "variance_actions_tracked",
                manifest, ("monitoring", "variance_actions_tracked"),
                "quality gate: variance reviews produce actions, "
                "and the actions are tracked")
    _bool_check(results, "monitoring_and_close",
                "rolling_forecast_cadence_set",
                manifest,
                ("monitoring", "rolling_forecast_cadence_set"),
                "quality gate: a rolling forecast cadence is "
                "set where volatility demands it")
    horizon, has_horizon = _get(
        manifest, "monitoring", "rolling_horizon_months")
    horizon_is_number = has_horizon and _is_number(horizon)
    _check(results, "monitoring_and_close",
           "rolling_forecast_covers_twelve_months", horizon,
           horizon_is_number,
           horizon_is_number and horizon == 12,
           "method step 8: the rolling forecast covers the "
           "twelve months the skill states")
    _bool_check(results, "monitoring_and_close",
                "annual_true_up_done",
                manifest, ("close", "annual_true_up_done"),
                "method step 9: an annual true-up closes the "
                "cycle")
    _bool_check(results, "monitoring_and_close",
                "carry_over_rules_decided",
                manifest, ("close", "carry_over_rules_decided"),
                "method step 9: carry-over rules are decided, "
                "not improvised at year end")
    _bool_check(results, "monitoring_and_close",
                "lessons_carried_to_next_cycle",
                manifest, ("close", "lessons_carried_to_next_cycle"),
                "method step 9: lessons from this cycle are "
                "carried to the next cycle")
    _false_check(results, "monitoring_and_close",
                 "no_silent_reallocations",
                 manifest, ("close", "silent_reallocations_made"),
                 "red line: no silent reallocations")
    _false_check(results, "monitoring_and_close",
                 "no_unannotated_actual_edits",
                 manifest,
                 ("close", "actuals_edited_without_annotation"),
                 "red line: actuals are never edited — "
                 "corrections are annotated with date and reason")

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
        verdict = "BUDGET_DESIGN_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "BUDGET_DESIGN_SOUND"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("budget_type_is_stated_kind",
                          "line_amounts_match_driver_products",
                          "declared_total_matches_line_sum",
                          "budget_balances_against_expected_income",
                          "rolling_forecast_covers_twelve_months")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "budget-design-review",
        "atom_version": "0.1.0",
        "budget": manifest.get("budget"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "lines_evaluated": len(line_entries) if lines_is_list else None,
        "ownerless_line_indexes": ownerless,
        "computed_total": _fmt2(computed_sum),
        "total_difference": _fmt2(difference),
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
        "BUDGET DESIGN REVIEW",
        f"budget: {verdict.get('budget')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<24} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: budget_design_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "BUDGET_DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
