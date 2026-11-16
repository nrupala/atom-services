#!/usr/bin/env python3
"""Designed test case pack — deterministic core.

Built from the bound skill `test-design`: "Good testing is
designed, not improvised. Choose techniques by risk, write cases
before execution, and trace them to requirements."

This atom is an AUDIT of a declared test-case pack record: it
validates the record a caller declares against the skill's
method — equivalence partitioning, boundary value analysis,
decision tables, state transition testing, pairwise /
combinatorial coverage, negative testing and error guessing,
risk-based selection, and the case format (id, level,
preconditions, steps, expected result — written BEFORE running;
traceable to requirements) — plus its quality gates and red
lines. It does not write test cases, execute any case, or verify
that a declared case would actually catch a bug — it checks
that the record the skill requires is present and internally
complete and consistent on the declared evidence.

The caller submits a test-case-pack manifest (a dict, or JSON
on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- requirements and cases: the declared `requirements` and
  `cases` lists must be non-empty, every declared requirement
  must be traced to at least one declared case (the skill's
  quality gate: "Every requirement traced to at least one
  case"), every declared case must trace to at least one
  declared requirement, every declared case must carry a
  non-empty expected result (the skill's red line: "No case
  without an expected result"), and every declared case id must
  be non-empty and unique;
- per-case format: every declared case row must declare its
  level, preconditions, steps, and that its expected result was
  written before execution;
- presence: at least one declared case must be declared a
  boundary case and at least one a negative case (the skill's
  quality gate: "Boundaries and negatives present (not just
  happy paths)");
- three check groups are conditional, following the skill's own
  scoping: the decision-table check binds only when condition
  combinations are declared applicable, the state-transition
  check binds only when stateful behaviour is declared present,
  and the pairwise check binds only when many configuration
  axes are declared present.

Computed ratios are serialized as strings with exactly four
decimal places, produced in both implementations by the same
fixed rule — round half up to 4dp, floor(v * 10000 + 0.5) /
10000, then format with exactly four decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact). Declared requirements no case
traces to are reported by id as `untraced_requirements`;
declared cases with no non-empty expected result are reported
by id as `cases_without_expected_result`; declared cases whose
declared requirement references name no declared requirement
are reported as `cases_without_traceability`; case ids declared
more than once are reported as `duplicate_case_ids`. The
computed outcome over the six primary computed checks is
reported as `computed_status`.

The skill states no numeric threshold — no case count, no
coverage percentage below its own every-requirement gate, no
boundary count, no risk-score cut-off — so no numeric threshold
check is invented; quantities are computed and reported, and
completeness (every declared requirement, every declared case)
is the only bar, exactly as the skill's gates state.

Verdict:
- any fail             -> TEST_CASE_PACK_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> TEST_CASE_PACK_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "traceability_and_case_format",
    "technique_coverage",
    "negative_and_risk_selection",
    "coverage_gaps_and_suite_hygiene",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "pack": "string",
    "requirements": [{
        "id": "string",
    }],
    "cases": [{
        "id": "string",
        "requirement_ids": ["string"],
        "level": "string",
        "preconditions_declared": "boolean",
        "steps_declared": "boolean",
        "expected_result": "string",
        "expected_result_written_before_execution": "boolean",
        "covers_boundary": "boolean",
        "covers_negative": "boolean",
    }],
    "technique_application": {
        "equivalence_partitioning_applied": "boolean",
        "equivalence_representative_and_edges_per_class": "boolean",
        "boundary_value_analysis_applied": "boolean",
        "boundary_just_below_at_and_above_covered": "boolean",
        "decision_tables_applicable": "boolean",
        "decision_table_rules_covered_including_awkward": "boolean",
        "stateful_behaviour_present": "boolean",
        "state_transitions_allowed_forbidden_and_interrupts_tested": "boolean",
        "many_config_axes_present": "boolean",
        "pairwise_pair_coverage_used": "boolean",
    },
    "negative_and_error_guessing": {
        "negative_cases_designed": "boolean",
        "invalid_inputs_covered": "boolean",
        "wrong_order_retries_and_partial_failure_covered": "boolean",
    },
    "risk_selection": {
        "risk_based_selection_applied": "boolean",
        "cases_ranked_by_damage_and_likelihood": "boolean",
        "highest_risk_cases_selected_first": "boolean",
        "not_tested_stated_explicitly": "boolean",
    },
    "coverage": {
        "coverage_gaps_stated_explicitly": "boolean",
        "duplicate_path_suites_present": "boolean",
        "happy_path_only_suite_present": "boolean",
        "cases_written_before_execution": "boolean",
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


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _row_id(entry):
    if isinstance(entry, dict) and isinstance(entry.get("id"), str):
        return entry["id"]
    return "unnamed"


def _has_expected(entry):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get("expected_result"), str)
        and len(entry["expected_result"]) > 0
    )


def evaluate(manifest):
    """Return the verdict dict for a test-case-pack manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    requirements, has_requirements = _get(manifest, "requirements")
    requirements_is_list = has_requirements and isinstance(requirements, list)
    cases, has_cases = _get(manifest, "cases")
    cases_is_list = has_cases and isinstance(cases, list)

    requirements_count = len(requirements) if requirements_is_list else None
    cases_count = len(cases) if cases_is_list else None

    req_ids = (
        {r["id"] for r in requirements
         if isinstance(r, dict) and isinstance(r.get("id"), str)
         and len(r["id"]) > 0}
        if requirements_is_list else set()
    )
    traced_ids = set()
    if cases_is_list:
        for case in cases:
            if isinstance(case, dict) and isinstance(
                    case.get("requirement_ids"), list):
                for ref in case["requirement_ids"]:
                    if isinstance(ref, str):
                        traced_ids.add(ref)

    untraced_requirements = (
        [_row_id(r) for r in requirements
         if not (isinstance(r, dict)
                 and isinstance(r.get("id"), str)
                 and len(r["id"]) > 0 and r["id"] in traced_ids)]
        if requirements_is_list and cases_is_list else None
    )
    requirement_trace_coverage = (
        (requirements_count - len(untraced_requirements))
        / requirements_count
        if untraced_requirements is not None and requirements_count
        else None
    )

    cases_without_expected = (
        [_row_id(c) for c in cases if not _has_expected(c)]
        if cases_is_list else None
    )
    expected_result_coverage = (
        (cases_count - len(cases_without_expected)) / cases_count
        if cases_is_list and cases_count else None
    )

    def _traces(case):
        if not isinstance(case, dict):
            return False
        refs = case.get("requirement_ids")
        if not isinstance(refs, list) or len(refs) == 0:
            return False
        return any(isinstance(ref, str) and ref in req_ids
                   for ref in refs)

    cases_without_traceability = (
        [_row_id(c) for c in cases
         if isinstance(c, dict) and "requirement_ids" in c
         and not _traces(c)]
        if cases_is_list and requirements_is_list else None
    )

    duplicate_case_ids = None
    if cases_is_list:
        seen = set()
        duplicate_case_ids = []
        for case in cases:
            cid = case.get("id") if isinstance(case, dict) else None
            if isinstance(cid, str) and len(cid) > 0:
                if cid in seen and cid not in duplicate_case_ids:
                    duplicate_case_ids.append(cid)
                seen.add(cid)

    # ---- Section 1: traceability_and_case_format (skill: case
    #      format — id, level, preconditions, steps, expected
    #      result, written BEFORE running, traceable to
    #      requirements; quality gate — every requirement traced
    #      to at least one case; red line — no case without an
    #      expected result) ----
    _check(results, "traceability_and_case_format",
           "requirements_declared", requirements,
           requirements_is_list,
           requirements_is_list and requirements_count > 0,
           "case format: the declared pack record names its "
           "requirements — the requirements list is present and "
           "non-empty")
    _check(results, "traceability_and_case_format", "cases_declared",
           cases, cases_is_list,
           cases_is_list and cases_count > 0,
           "case format: the declared pack record names its test "
           "cases — the cases list is present and non-empty")
    traced_present = (
        requirements_is_list and cases_is_list
        and all(isinstance(r, dict) and "id" in r for r in requirements)
        and all(isinstance(c, dict) and "requirement_ids" in c
                for c in cases)
    )
    _check(results, "traceability_and_case_format",
           "every_requirement_traced_to_at_least_one_case",
           requirements, traced_present,
           requirements_is_list and cases_is_list
           and requirements_count > 0
           and untraced_requirements is not None
           and len(untraced_requirements) == 0,
           "quality gate: every requirement is traced to at "
           "least one case")
    case_trace_present = (
        cases_is_list and requirements_is_list
        and all(isinstance(c, dict) and "requirement_ids" in c
                for c in cases)
    )
    _check(results, "traceability_and_case_format",
           "every_case_traces_to_at_least_one_requirement", cases,
           case_trace_present,
           cases_is_list and requirements_is_list and cases_count > 0
           and cases_without_traceability is not None
           and len(cases_without_traceability) == 0
           and all(_traces(c) for c in cases),
           "case format: every declared case is traceable to at "
           "least one declared requirement")
    id_present = (
        cases_is_list
        and all(isinstance(c, dict) and "id" in c for c in cases)
    )
    _check(results, "traceability_and_case_format",
           "every_case_has_unique_nonempty_id", cases, id_present,
           cases_is_list and cases_count > 0
           and duplicate_case_ids is not None
           and len(duplicate_case_ids) == 0
           and all(isinstance(c, dict)
                   and isinstance(c.get("id"), str)
                   and len(c["id"]) > 0 for c in cases),
           "case format: every declared case carries an id, and "
           "no id is declared twice")
    level_present = (
        cases_is_list
        and all(isinstance(c, dict) and "level" in c for c in cases)
    )
    _check(results, "traceability_and_case_format",
           "every_case_declares_level", cases, level_present,
           cases_is_list and cases_count > 0
           and all(isinstance(c, dict)
                   and isinstance(c.get("level"), str)
                   and len(c["level"]) > 0 for c in cases),
           "case format: every declared case declares its level")
    preconditions_present = (
        cases_is_list
        and all(isinstance(c, dict) and "preconditions_declared" in c
                for c in cases)
    )
    _check(results, "traceability_and_case_format",
           "every_case_declares_preconditions", cases,
           preconditions_present,
           cases_is_list and cases_count > 0
           and all(isinstance(c, dict)
                   and c.get("preconditions_declared") is True
                   for c in cases),
           "case format: every declared case declares its "
           "preconditions")
    steps_present = (
        cases_is_list
        and all(isinstance(c, dict) and "steps_declared" in c
                for c in cases)
    )
    _check(results, "traceability_and_case_format",
           "every_case_declares_steps", cases, steps_present,
           cases_is_list and cases_count > 0
           and all(isinstance(c, dict)
                   and c.get("steps_declared") is True
                   for c in cases),
           "case format: every declared case declares its steps")
    expected_present = (
        cases_is_list
        and all(isinstance(c, dict) and "expected_result" in c
                for c in cases)
    )
    _check(results, "traceability_and_case_format",
           "every_case_has_expected_result", cases, expected_present,
           cases_is_list and cases_count > 0
           and cases_without_expected is not None
           and len(cases_without_expected) == 0,
           "red line: no case without an expected result — every "
           "declared case names a non-empty expected result")
    before_present = (
        cases_is_list
        and all(isinstance(c, dict)
                and "expected_result_written_before_execution" in c
                for c in cases)
    )
    _check(results, "traceability_and_case_format",
           "every_case_expected_result_written_before_execution",
           cases, before_present,
           cases_is_list and cases_count > 0
           and all(isinstance(c, dict)
                   and c.get(
                       "expected_result_written_before_execution")
                   is True for c in cases),
           "quality gate: expected results are written before "
           "execution — every declared case declares its expected "
           "result was written before running")

    # ---- Section 2: technique_coverage (skill: equivalence
    #      partitioning — one representative plus the edges per
    #      class; boundary value analysis — just-below / at /
    #      just-above each boundary; decision tables — enumerate
    #      condition combinations, cover the interesting rules
    #      including the awkward ones; state transition testing —
    #      allowed transitions, forbidden transitions, and
    #      interrupts; pairwise — cover all pairs instead of the
    #      full cross-product) ----
    _bool_check(results, "technique_coverage",
                "equivalence_partitioning_applied", manifest,
                ("technique_application",
                 "equivalence_partitioning_applied"),
                "equivalence partitioning: inputs are grouped into "
                "classes")
    _bool_check(results, "technique_coverage",
                "equivalence_representative_and_edges_per_class",
                manifest,
                ("technique_application",
                 "equivalence_representative_and_edges_per_class"),
                "equivalence partitioning: one representative plus "
                "the edges per class — not every value")
    _bool_check(results, "technique_coverage",
                "boundary_value_analysis_applied", manifest,
                ("technique_application",
                 "boundary_value_analysis_applied"),
                "boundary value analysis: boundaries are tested")
    _bool_check(results, "technique_coverage",
                "boundary_just_below_at_and_above_covered", manifest,
                ("technique_application",
                 "boundary_just_below_at_and_above_covered"),
                "boundary value analysis: just-below / at / "
                "just-above each boundary is covered")
    boundary_present = (
        cases_is_list
        and all(isinstance(c, dict) and "covers_boundary" in c
                for c in cases)
    )
    _check(results, "technique_coverage",
           "at_least_one_boundary_case_declared", cases,
           boundary_present,
           cases_is_list and cases_count > 0
           and any(isinstance(c, dict)
                   and c.get("covers_boundary") is True
                   for c in cases),
           "quality gate: boundaries are present — at least one "
           "declared case is declared a boundary case")
    _gated_bool_check(
        results, "technique_coverage",
        "decision_table_rules_covered_when_applicable", manifest,
        ("technique_application", "decision_tables_applicable"),
        ("technique_application",
         "decision_table_rules_covered_including_awkward"),
        "decision tables: condition combinations are enumerated "
        "and the interesting rules are covered, including the "
        "awkward ones",
        "decision tables not declared applicable")
    _gated_bool_check(
        results, "technique_coverage",
        "state_transitions_tested_when_stateful", manifest,
        ("technique_application", "stateful_behaviour_present"),
        ("technique_application",
         "state_transitions_allowed_forbidden_and_interrupts_tested"),
        "state transition testing: allowed transitions, "
        "forbidden transitions, and interrupts are tested",
        "no stateful behaviour declared present")
    _gated_bool_check(
        results, "technique_coverage",
        "pairwise_coverage_used_when_many_config_axes", manifest,
        ("technique_application", "many_config_axes_present"),
        ("technique_application", "pairwise_pair_coverage_used"),
        "pairwise / combinatorial: all pairs are covered "
        "instead of the full cross-product",
        "not many configuration axes declared present")

    # ---- Section 3: negative_and_risk_selection (skill:
    #      negative + error guessing — invalid inputs, wrong
    #      order, retries, partial failure; risk-based selection
    #      — rank by damage times likelihood, highest first,
    #      state explicitly what is NOT tested; quality gate —
    #      negatives present, not just happy paths) ----
    _bool_check(results, "negative_and_risk_selection",
                "negative_cases_designed", manifest,
                ("negative_and_error_guessing",
                 "negative_cases_designed"),
                "negative + error guessing: negative cases are "
                "designed — accidents and attackers live here")
    _bool_check(results, "negative_and_risk_selection",
                "invalid_inputs_covered", manifest,
                ("negative_and_error_guessing",
                 "invalid_inputs_covered"),
                "negative + error guessing: invalid inputs are "
                "covered")
    _bool_check(results, "negative_and_risk_selection",
                "wrong_order_retries_and_partial_failure_covered",
                manifest,
                ("negative_and_error_guessing",
                 "wrong_order_retries_and_partial_failure_covered"),
                "negative + error guessing: wrong order, retries, "
                "and partial failure are covered")
    negative_present = (
        cases_is_list
        and all(isinstance(c, dict) and "covers_negative" in c
                for c in cases)
    )
    _check(results, "negative_and_risk_selection",
           "at_least_one_negative_case_declared", cases,
           negative_present,
           cases_is_list and cases_count > 0
           and any(isinstance(c, dict)
                   and c.get("covers_negative") is True
                   for c in cases),
           "quality gate: negatives are present — at least one "
           "declared case is declared a negative case")
    _bool_check(results, "negative_and_risk_selection",
                "risk_based_selection_applied", manifest,
                ("risk_selection", "risk_based_selection_applied"),
                "risk-based selection: techniques and cases are "
                "chosen by risk")
    _bool_check(results, "negative_and_risk_selection",
                "cases_ranked_by_damage_and_likelihood", manifest,
                ("risk_selection",
                 "cases_ranked_by_damage_and_likelihood"),
                "risk-based selection: cases are ranked by damage "
                "times likelihood")
    _bool_check(results, "negative_and_risk_selection",
                "highest_risk_cases_selected_first", manifest,
                ("risk_selection",
                 "highest_risk_cases_selected_first"),
                "risk-based selection: the highest-risk cases are "
                "selected first")
    _bool_check(results, "negative_and_risk_selection",
                "not_tested_stated_explicitly", manifest,
                ("risk_selection", "not_tested_stated_explicitly"),
                "risk-based selection: what is NOT tested is "
                "stated explicitly")

    # ---- Section 4: coverage_gaps_and_suite_hygiene (skill:
    #      quality gate — coverage gaps stated explicitly;
    #      method — cases written BEFORE running; red line — no
    #      copy-paste suites that re-test the same path) ----
    _bool_check(results, "coverage_gaps_and_suite_hygiene",
                "coverage_gaps_stated_explicitly", manifest,
                ("coverage", "coverage_gaps_stated_explicitly"),
                "quality gate: coverage gaps are stated explicitly")
    _false_check(results, "coverage_gaps_and_suite_hygiene",
                 "no_duplicate_path_suites", manifest,
                 ("coverage", "duplicate_path_suites_present"),
                 "red line: no copy-paste suites that re-test the "
                 "same path")
    _false_check(results, "coverage_gaps_and_suite_hygiene",
                 "not_happy_path_only", manifest,
                 ("coverage", "happy_path_only_suite_present"),
                 "quality gate: the suite is not happy paths only "
                 "— boundaries and negatives are present")
    _bool_check(results, "coverage_gaps_and_suite_hygiene",
                "cases_written_before_execution", manifest,
                ("coverage", "cases_written_before_execution"),
                "case format: cases are written BEFORE running")

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
        verdict = "TEST_CASE_PACK_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "TEST_CASE_PACK_SOUND"

    computed_names = (
        "requirements_declared",
        "cases_declared",
        "every_requirement_traced_to_at_least_one_case",
        "every_case_traces_to_at_least_one_requirement",
        "every_case_has_expected_result",
        "every_case_has_unique_nonempty_id",
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
        "service": "designed-test-case-pack",
        "atom_version": "0.1.0",
        "pack": manifest.get("pack"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "requirements_count": requirements_count,
        "cases_count": cases_count,
        "untraced_requirements": untraced_requirements,
        "requirement_trace_coverage": _fmt4(requirement_trace_coverage),
        "cases_without_expected_result": cases_without_expected,
        "expected_result_coverage": _fmt4(expected_result_coverage),
        "cases_without_traceability": cases_without_traceability,
        "duplicate_case_ids": duplicate_case_ids,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across four sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "DESIGNED TEST CASE PACK",
        f"pack: {verdict.get('pack')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: designed_test_case_pack.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "TEST_CASE_PACK_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
