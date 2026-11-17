#!/usr/bin/env python3
"""Quant math derivation sanity check — deterministic core.

Built from the bound skill `quant-and-applied-math`: "Be the
rigorous math layer under ML and quant — derive, sanity-check,
and pick methods, not just call libraries." Its Practice line is
the atom's method: "Derive before you trust; check dimensions
and units; verify with a small numerical example; know each
method's assumptions and failure modes; prefer the simplest
method that fits." Its anti-patterns are the atom's red lines:
"Black-box trust with no derivation; ignoring assumptions
(normality, independence, stationarity); overfitting;
p-hacking; confusing correlation with causation."

This atom is a CHECK of a declared derivation record: it audits
the record a caller declares — the stated goal quantity and
givens, the declared derivation steps with their declared
operand values, declared results and declared units, the
declared final result, the declared assumption checks, the
declared method choice and numerical verification, and the red
lines refused. It does not derive anything itself, does not
solve the caller's problem, does not judge whether the chosen
method is the right mathematics for the problem, and gives no
financial advice, no valuation, no recommendation and no
forecast — it checks that the derivation record the skill
requires is present and internally consistent on the declared
evidence, and it re-verifies the declared arithmetic and the
declared unit algebra exactly.

Distinct ground: the nearest sibling is
`forecast-with-ranges-and-scorecard` (a declared forecast
artifact — baselines, a low/base/high range, scenarios and a
forecast-vs-actual scorecard whose MAE/MAPE/bias are recomputed
from declared history). This atom shares zero checks with it:
every check here is a derivation question — a goal quantity
stated with givens defined before use, a step-by-step record
whose every declared step recomputes exactly from its declared
operands, whose result units follow the declared unit algebra,
whose final result equals its last step, whose normality /
independence / stationarity assumptions are checked where
assumed with failure modes and domain restrictions stated, and
whose method is the simplest that fits, verified with a small
numerical example. The boundary is: the internal consistency
of a declared mathematical derivation here; a forecast
artifact's ranges, scenarios and accuracy scorecard there.

The caller submits a derivation manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- step arithmetic: every declared step declares an operation
  (`add`, `subtract`, `multiply` or `divide`), two operand
  values and a declared result; the atom recomputes
  operand_a <op> operand_b and compares it with the declared
  result under the fixed 6-decimal serialization below (the
  skill: "Derive before you trust" — a declared step that does
  not recompute is not a derivation). A divide step with a zero
  second operand can never recompute and is named separately;
- step identity: no declared step_id may be owned by more than
  one row (one record per step — internal consistency of the
  declared rows);
- unit algebra: every declared step declares its operand and
  result units, and the declared result unit must be the unit
  the record's own declared unit algebra produces — for `add` /
  `subtract` the operands must share one unit and the result
  keeps it; for `multiply` the result unit is
  "<a_unit>*<b_unit>"; for `divide` it is "<a_unit>/<b_unit>";
  the dimensionless unit "1" drops out of a product, a quotient
  by "1" keeps the numerator unit, and a quotient of a unit by
  itself is "1" (the skill: "check dimensions and units");
- final result: the declared final result value and unit must
  equal the last declared step's declared result value and
  unit — the derivation must land where its own steps land.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; arithmetic and
final-result comparisons are made on those 6dp serializations
of the recomputed and declared values. That fixed serialization
is what makes the Python and TypeScript outputs byte-identical.
Counts are reported as integers (exact).

The skill states no numeric tolerance and no numeric threshold
at all — no acceptable arithmetic error beyond the fixed 6dp
serialization, no p-value, no significance level, no confidence
level, no correlation or variance bar, no step count, no
convergence epsilon — so no such check is invented; those
quantities are caller attestations at most, and quantities here
are computed and reported, with exact recomputation and
completeness over the caller's own declared steps as the only
bars, exactly as stated above.

Verdict:
- any fail             -> DERIVATION_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DERIVATION_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "derivation_structure",
    "step_arithmetic",
    "dimensions_and_units",
    "assumptions_and_failure_modes",
    "method_choice_and_verification",
    "red_lines",
)

OPERATIONS = ("add", "subtract", "multiply", "divide")

MANIFEST_SPEC = {
    "derivation_title": "string",
    "derivation": {
        "goal_quantity_stated": "boolean",
        "givens_defined_before_use": "boolean",
        "shown_step_by_step": "boolean",
        "final_result_value": "number",
        "final_result_unit": "string",
    },
    "steps": [{
        "step_id": "string",
        "operation": "string",
        "operand_a": "number",
        "operand_b": "number",
        "declared_result": "number",
        "operand_a_unit": "string",
        "operand_b_unit": "string",
        "declared_result_unit": "string",
    }],
    "dimensions": {
        "dimensions_checked": "boolean",
        "units_checked": "boolean",
        "unit_conversions_shown_where_needed": "boolean",
    },
    "assumptions": {
        "assumptions_listed": "boolean",
        "normality_checked_where_assumed": "boolean",
        "independence_checked_where_assumed": "boolean",
        "stationarity_checked_where_assumed": "boolean",
        "failure_modes_named": "boolean",
        "domain_restrictions_stated": "boolean",
    },
    "method": {
        "method_named": "boolean",
        "simplest_method_that_fits_chosen": "boolean",
        "method_choice_justified_from_problem_structure": "boolean",
        "small_numerical_example_verified": "boolean",
    },
    "red_lines": {
        "black_box_trust_without_derivation_present": "boolean",
        "assumptions_ignored_present": "boolean",
        "correlation_presented_as_causation_present": "boolean",
        "p_hacking_present": "boolean",
        "overfitting_present": "boolean",
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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _values_match(a, b):
    """Two declared/recomputed numbers match on their 6dp
    serializations; non-finite values match only if identical."""
    if not (isinstance(a, (int, float)) and not isinstance(a, bool)):
        return False
    if not (isinstance(b, (int, float)) and not isinstance(b, bool)):
        return False
    if math.isfinite(a) and math.isfinite(b):
        return _fmt6(a) == _fmt6(b)
    return a == b


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("step_id"), str):
        return entry["step_id"]
    return "unnamed"


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _recompute(entry):
    """Recomputed value of a declared step, or None when the step
    cannot be recomputed (unknown operation or division by zero)."""
    op = entry.get("operation")
    a = entry.get("operand_a")
    b = entry.get("operand_b")
    if op == "add":
        return a + b
    if op == "subtract":
        return a - b
    if op == "multiply":
        return a * b
    if op == "divide":
        if b == 0:
            return None
        return a / b
    return None


def _expected_result_unit(entry):
    """The result unit the record's declared unit algebra produces
    for a step, or None when the algebra gives no unit (an add /
    subtract step whose operand units differ)."""
    op = entry.get("operation")
    a_unit = entry.get("operand_a_unit")
    b_unit = entry.get("operand_b_unit")
    if op in ("add", "subtract"):
        return a_unit if a_unit == b_unit else None
    if op == "multiply":
        if a_unit == "1":
            return b_unit
        if b_unit == "1":
            return a_unit
        return f"{a_unit}*{b_unit}"
    if op == "divide":
        if b_unit == "1":
            return a_unit
        if a_unit == b_unit:
            return "1"
        if a_unit == "1":
            return f"1/{b_unit}"
        return f"{a_unit}/{b_unit}"
    return None


def _step_complete_for_arithmetic(entry):
    return (
        _has(entry, "operation") and _has(entry, "operand_a")
        and _has(entry, "operand_b") and _has(entry, "declared_result")
        and _is_number(entry.get("operand_a"))
        and _is_number(entry.get("operand_b"))
        and _is_number(entry.get("declared_result"))
    )


def _step_complete_for_units(entry):
    return (
        _has(entry, "operation")
        and _nonempty_str(entry.get("operand_a_unit"))
        and _nonempty_str(entry.get("operand_b_unit"))
        and _nonempty_str(entry.get("declared_result_unit"))
    )


def _step_arithmetic_matches(entry):
    if not _step_complete_for_arithmetic(entry):
        return False
    recomputed = _recompute(entry)
    if recomputed is None:
        return False
    return _values_match(recomputed, entry.get("declared_result"))


def _step_unit_matches(entry):
    if not _step_complete_for_units(entry):
        return False
    expected = _expected_result_unit(entry)
    if expected is None:
        return False
    return entry.get("declared_result_unit") == expected


def evaluate(manifest):
    """Return the verdict dict for a quant math derivation manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    steps, has_steps = _get(manifest, "steps")
    steps_is_list = has_steps and isinstance(steps, list)
    steps_count = len(steps) if steps_is_list else None
    rows = steps if steps_is_list else []

    duplicate_step_ids = None
    if steps_is_list:
        seen = []
        duplicate_step_ids = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("step_id"), str):
                nm = c["step_id"]
                if nm in seen and nm not in duplicate_step_ids:
                    duplicate_step_ids.append(nm)
                seen.append(nm)
    steps_with_arithmetic_mismatch = (
        [_row_name(c) for c in rows
         if _step_complete_for_arithmetic(c)
         and not _step_arithmetic_matches(c)]
        if steps_is_list else None
    )
    steps_with_unit_mismatch = (
        [_row_name(c) for c in rows
         if _step_complete_for_units(c) and not _step_unit_matches(c)]
        if steps_is_list else None
    )
    steps_missing_units = (
        [_row_name(c) for c in rows if not _step_complete_for_units(c)]
        if steps_is_list else None
    )
    arithmetic_match_ratio = (
        sum(1 for c in rows if _step_arithmetic_matches(c)) / steps_count
        if steps_is_list and steps_count > 0 else None
    )
    unit_match_ratio = (
        sum(1 for c in rows if _step_unit_matches(c)) / steps_count
        if steps_is_list and steps_count > 0 else None
    )

    # ---- Section 1: derivation_structure (skill Practice —
    #      "Derive before you trust": a goal quantity, givens
    #      defined before use, the derivation shown step by
    #      step, and a final result that is where the record's
    #      own last step lands) ----
    _bool_check(results, "derivation_structure",
                "derivation_goal_quantity_stated", manifest,
                ("derivation", "goal_quantity_stated"),
                "derivation: the goal quantity the derivation "
                "derives is stated")
    _bool_check(results, "derivation_structure",
                "derivation_givens_defined_before_use", manifest,
                ("derivation", "givens_defined_before_use"),
                "derivation: every given quantity is defined "
                "before it is used")
    _bool_check(results, "derivation_structure",
                "derivation_shown_step_by_step", manifest,
                ("derivation", "shown_step_by_step"),
                "derivation: the derivation is shown step by "
                "step, not asserted as a black-box result")
    final_value, has_final_value = _get(
        manifest, "derivation", "final_result_value")
    last_step = rows[-1] if steps_is_list and rows else None
    final_value_present = (
        steps_is_list and len(rows) > 0 and has_final_value
        and _has(last_step, "declared_result")
    )
    _check(results, "derivation_structure",
           "derivation_final_result_value_matches_last_step", final_value,
           final_value_present,
           final_value_present
           and _values_match(final_value,
                             last_step.get("declared_result")),
           "derivation: the declared final result value equals "
           "the last declared step's declared result value")
    final_unit, has_final_unit = _get(
        manifest, "derivation", "final_result_unit")
    final_unit_present = (
        steps_is_list and len(rows) > 0
        and _nonempty_str(final_unit)
        and _nonempty_str(
            last_step.get("declared_result_unit")
            if isinstance(last_step, dict) else None)
    )
    _check(results, "derivation_structure",
           "derivation_final_result_unit_matches_last_step", final_unit,
           final_unit_present,
           final_unit_present
           and final_unit == last_step.get("declared_result_unit"),
           "derivation: the declared final result unit equals "
           "the last declared step's declared result unit")

    # ---- Section 2: step_arithmetic (skill Practice — "Derive
    #      before you trust": every declared step recomputes
    #      exactly from its own declared operands) ----
    _check(results, "step_arithmetic",
           "derivation_steps_list_declared", steps, steps_is_list,
           steps_is_list and steps_count > 0,
           "the declared record names its derivation steps — the "
           "steps list is present and names at least one step; "
           "an absent list is missing evidence and an empty list "
           "declares no derivation at all")
    id_present = (
        steps_is_list
        and all(_has(c, "step_id") for c in rows)
    )
    _check(results, "step_arithmetic",
           "every_derivation_step_id_unique", steps, id_present,
           steps_is_list and duplicate_step_ids is not None
           and len(duplicate_step_ids) == 0,
           "derivation steps: no declared step_id is owned by "
           "more than one row")
    operation_present = (
        steps_is_list
        and all(_has(c, "operation") for c in rows)
    )
    _check(results, "step_arithmetic",
           "every_derivation_step_operation_recognised", steps,
           operation_present,
           steps_is_list
           and all(isinstance(c, dict)
                   and c.get("operation") in OPERATIONS for c in rows),
           "derivation steps: every declared step's operation is "
           "one of add, subtract, multiply, divide")
    arithmetic_present = (
        steps_is_list
        and all(_step_complete_for_arithmetic(c) for c in rows)
    )
    _check(results, "step_arithmetic",
           "every_derivation_step_arithmetic_recomputes", steps,
           arithmetic_present,
           steps_is_list
           and all(_step_arithmetic_matches(c) for c in rows),
           "derivation steps: every declared step's declared "
           "result recomputes exactly from its declared operands "
           "under its declared operation (6dp serialization)")
    divide_present = (
        steps_is_list
        and all(_has(c, "operation") and _has(c, "operand_b")
                and _is_number(c.get("operand_b")) for c in rows)
    )
    _check(results, "step_arithmetic",
           "no_derivation_step_divides_by_zero", steps, divide_present,
           steps_is_list
           and all(not (isinstance(c, dict)
                        and c.get("operation") == "divide"
                        and _is_number(c.get("operand_b"))
                        and c.get("operand_b") == 0)
                   for c in rows),
           "derivation steps: no declared divide step has a zero "
           "second operand")

    # ---- Section 3: dimensions_and_units (skill Practice —
    #      "check dimensions and units": the record declares the
    #      checks were made, every step declares its units, and
    #      every result unit follows the declared unit algebra)
    _bool_check(results, "dimensions_and_units",
                "derivation_dimensions_checked", manifest,
                ("dimensions", "dimensions_checked"),
                "dimensions: the derivation's dimensions are "
                "checked")
    _bool_check(results, "dimensions_and_units",
                "derivation_units_checked", manifest,
                ("dimensions", "units_checked"),
                "units: the derivation's units are checked")
    _bool_check(results, "dimensions_and_units",
                "derivation_unit_conversions_shown_where_needed",
                manifest,
                ("dimensions", "unit_conversions_shown_where_needed"),
                "units: every unit conversion the derivation "
                "needs is shown where it is used")
    units_declared = (
        steps_is_list
        and all(_has(c, "operand_a_unit") and _has(c, "operand_b_unit")
                and _has(c, "declared_result_unit") for c in rows)
    )
    _check(results, "dimensions_and_units",
           "every_derivation_step_declares_all_units", steps,
           units_declared,
           steps_is_list
           and all(_step_complete_for_units(c) for c in rows),
           "derivation steps: every declared step declares its "
           "operand_a_unit, operand_b_unit and "
           "declared_result_unit, none empty")
    units_complete = (
        steps_is_list
        and all(_step_complete_for_units(c) for c in rows)
    )
    _check(results, "dimensions_and_units",
           "every_derivation_step_result_unit_follows_unit_algebra",
           steps, units_complete,
           steps_is_list
           and all(_step_unit_matches(c) for c in rows),
           "derivation steps: every declared step's result unit "
           "is the unit the declared unit algebra produces — "
           "add/subtract keep the shared operand unit, multiply "
           "gives <a>*<b>, divide gives <a>/<b>, and the "
           "dimensionless unit 1 drops out")

    # ---- Section 4: assumptions_and_failure_modes (skill —
    #      "know each method's assumptions and failure modes";
    #      anti-pattern: "ignoring assumptions (normality,
    #      independence, stationarity)") ----
    _bool_check(results, "assumptions_and_failure_modes",
                "derivation_assumptions_listed", manifest,
                ("assumptions", "assumptions_listed"),
                "assumptions: the derivation's assumptions are "
                "listed")
    _bool_check(results, "assumptions_and_failure_modes",
                "derivation_normality_checked_where_assumed", manifest,
                ("assumptions", "normality_checked_where_assumed"),
                "assumptions: normality is checked wherever the "
                "derivation assumes it")
    _bool_check(results, "assumptions_and_failure_modes",
                "derivation_independence_checked_where_assumed",
                manifest,
                ("assumptions", "independence_checked_where_assumed"),
                "assumptions: independence is checked wherever "
                "the derivation assumes it")
    _bool_check(results, "assumptions_and_failure_modes",
                "derivation_stationarity_checked_where_assumed",
                manifest,
                ("assumptions", "stationarity_checked_where_assumed"),
                "assumptions: stationarity is checked wherever "
                "the derivation assumes it")
    _bool_check(results, "assumptions_and_failure_modes",
                "derivation_failure_modes_named", manifest,
                ("assumptions", "failure_modes_named"),
                "assumptions: the method's failure modes are named")
    _bool_check(results, "assumptions_and_failure_modes",
                "derivation_domain_restrictions_stated", manifest,
                ("assumptions", "domain_restrictions_stated"),
                "assumptions: the derivation's domain restrictions "
                "are stated (where its steps are defined)")

    # ---- Section 5: method_choice_and_verification (skill —
    #      "pick methods, not just call libraries"; "prefer the
    #      simplest method that fits"; "verify with a small
    #      numerical example") ----
    _bool_check(results, "method_choice_and_verification",
                "derivation_method_named", manifest,
                ("method", "method_named"),
                "method: the method the derivation uses is named")
    _bool_check(results, "method_choice_and_verification",
                "derivation_simplest_fitting_method_chosen", manifest,
                ("method", "simplest_method_that_fits_chosen"),
                "method: the simplest method that fits is the "
                "method chosen")
    _bool_check(results, "method_choice_and_verification",
                "derivation_method_choice_justified_from_problem_structure",
                manifest,
                ("method",
                 "method_choice_justified_from_problem_structure"),
                "method: the method choice is justified from the "
                "problem's structure, not from library habit")
    _bool_check(results, "method_choice_and_verification",
                "derivation_verified_with_small_numerical_example",
                manifest,
                ("method", "small_numerical_example_verified"),
                "verification: the derivation is verified with a "
                "small numerical example")

    # ---- Section 6: red_lines (skill "Anti-patterns to refuse"
    #      — black-box trust with no derivation, ignoring
    #      assumptions, overfitting, p-hacking, confusing
    #      correlation with causation) ----
    _false_check(results, "red_lines",
                 "derivation_free_of_black_box_trust", manifest,
                 ("red_lines",
                  "black_box_trust_without_derivation_present"),
                 "red line: no black-box result trusted without a "
                 "derivation is present in the record")
    _false_check(results, "red_lines",
                 "derivation_free_of_ignored_assumptions", manifest,
                 ("red_lines", "assumptions_ignored_present"),
                 "red line: no ignored assumptions are present in "
                 "the record")
    _false_check(results, "red_lines",
                 "derivation_free_of_correlation_as_causation",
                 manifest,
                 ("red_lines",
                  "correlation_presented_as_causation_present"),
                 "red line: no correlation presented as causation "
                 "is present in the record")
    _false_check(results, "red_lines",
                 "derivation_free_of_p_hacking", manifest,
                 ("red_lines", "p_hacking_present"),
                 "red line: no p-hacking is present in the record")
    _false_check(results, "red_lines",
                 "derivation_free_of_overfitting", manifest,
                 ("red_lines", "overfitting_present"),
                 "red line: no overfitting is present in the record")

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
        verdict = "DERIVATION_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DERIVATION_SOUND"

    computed_names = (
        "derivation_final_result_value_matches_last_step",
        "derivation_final_result_unit_matches_last_step",
        "derivation_steps_list_declared",
        "every_derivation_step_id_unique",
        "every_derivation_step_operation_recognised",
        "every_derivation_step_arithmetic_recomputes",
        "no_derivation_step_divides_by_zero",
        "every_derivation_step_declares_all_units",
        "every_derivation_step_result_unit_follows_unit_algebra",
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
        "service": "quant-math-derivation-sanity-check",
        "atom_version": "0.1.0",
        "derivation_title": manifest.get("derivation_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "derivation_steps_count": steps_count,
        "duplicate_derivation_step_ids": duplicate_step_ids,
        "derivation_steps_with_arithmetic_mismatch":
            steps_with_arithmetic_mismatch,
        "derivation_steps_with_unit_mismatch": steps_with_unit_mismatch,
        "derivation_steps_missing_units": steps_missing_units,
        "arithmetic_match_ratio": _fmt6(arithmetic_match_ratio),
        "unit_match_ratio": _fmt6(unit_match_ratio),
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
        "QUANT MATH DERIVATION SANITY CHECK",
        f"derivation_title: {verdict.get('derivation_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: quant_math_derivation_sanity_check.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DERIVATION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
