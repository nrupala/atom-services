#!/usr/bin/env python3
"""Buyer-test card — deterministic core.

Built from the bound skill `poc-validation` (v1): "Validate ideas
with proof-of-concept work — hypothesis, success/kill criteria,
timebox, evidence, decision." This atom audits one declared
buyer-test / POC record — a single idea worked through the
skill's method — against the skill's seven method steps, its
four quality gates, and its red lines. It does not run the POC,
source evidence, or judge whether the idea itself is good — it
checks that the declared record contains what the skill's method
requires, on the caller's declared evidence.

The caller submits a buyer-test-card manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic / set logic of the declared values — no outside
threshold is imported:

- timebox enforcement (method step 3: "Timebox: hard limit
  (days, not weeks)"; red line: "no unbounded POCs"): when the
  record declares a timebox limit in days and an elapsed time in
  days, the timebox passes only when the limit is positive, the
  elapsed time is not negative, and the elapsed time does not
  exceed the declared limit. The skill states no numeric cap on
  how many days a timebox may be, so none is imposed — the check
  compares the two declared numbers only. The declared-minus-
  elapsed overrun is reported at a fixed six decimals (see
  below);
- decision vocabulary (method step 6: "Decision: adopt / adapt
  / abandon with written rationale referencing the criteria"):
  a declared decision passes only when it is one of the three
  options the skill names — `adopt`, `adapt`, `abandon`;
- disposition vocabulary (method step 4: "Disposable by
  default: POC code is throwaway unless explicitly slated for
  hardening — say which it is"): a declared disposition passes
  only when it is one of the two states the skill names —
  `disposable`, `slated_for_hardening`.

Computed day counts are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. The computed outcome over the three computed
checks is reported as `computed_status`.

Verdict:
- any fail             -> CARD_NOT_COMPLETE
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CARD_COMPLETE

This is a completeness and consistency audit over declared
evidence, not a POC execution or an idea review: a record that
declares every step passes even if the idea is weak, and nothing
here verifies that a declared value is true.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "hypothesis",
    "criteria_upfront",
    "timebox_and_scope",
    "disposition_and_production_boundary",
    "evidence",
    "decision_and_findings",
)

STATED_DECISIONS = [
    "adopt",
    "adapt",
    "abandon",
]

STATED_DISPOSITIONS = [
    "disposable",
    "slated_for_hardening",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the decision / disposition values) are
# validated as strings only, never enum-checked: membership in
# the skill's stated set is a verdict check, not a type error.
MANIFEST_SPEC = {
    "idea": "string",
    "decision": "string",
    "disposition": "string",
    "hypothesis": {
        "written": "boolean",
        "single": "boolean",
        "states_capability_under_constraints": "boolean",
    },
    "criteria": {
        "success_written_before_start": "boolean",
        "kill_written_before_start": "boolean",
        "agreed_by_decision_owner_before_build": "boolean",
    },
    "timebox": {
        "hard_limit_set": "boolean",
        "limit_days": "number",
        "elapsed_days": "number",
        "scope_limited_to_critical_path": "boolean",
        "scope_creep_refused_politely": "boolean",
    },
    "evidence": {
        "from_measurements_tests_or_demo": "boolean",
        "numbers_over_impressions": "boolean",
        "stubs_and_mocks_recorded": "boolean",
    },
    "production_boundary": {
        "slid_into_production": "boolean",
        "claimed_as_production_evidence": "boolean",
    },
    "findings": {
        "memo_written": "boolean",
        "rationale_references_criteria": "boolean",
        "decision_logged": "boolean",
        "not_tested_list_clear": "boolean",
        "adopting_routed_through_full_team_process": "boolean",
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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def evaluate(manifest):
    """Return the verdict dict for a buyer-test-card manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: hypothesis (skill method step 1: "The
    #      question: one hypothesis, written down ("X can do Y
    #      under constraints Z")"; quality gate: "Hypothesis +
    #      success/kill criteria written before start") ----
    _bool_check(results, "hypothesis", "hypothesis_written",
                manifest, ("hypothesis", "written"),
                "method step 1: one hypothesis is written down")
    _bool_check(results, "hypothesis", "single_hypothesis",
                manifest, ("hypothesis", "single"),
                "method step 1: the record carries one hypothesis, "
                "not several")
    _bool_check(results, "hypothesis",
                "hypothesis_states_capability_under_constraints",
                manifest,
                ("hypothesis", "states_capability_under_constraints"),
                "method step 1: the hypothesis is in the stated "
                "form — X can do Y under constraints Z")

    # ---- Section 2: criteria_upfront (skill method step 2:
    #      "Criteria upfront: success AND kill criteria — agreed
    #      by the decision owner before the build"; quality gate:
    #      "Hypothesis + success/kill criteria written before
    #      start") ----
    _bool_check(results, "criteria_upfront",
                "success_criteria_written_before_start",
                manifest, ("criteria", "success_written_before_start"),
                "method step 2 / quality gate: success criteria are "
                "written before the start")
    _bool_check(results, "criteria_upfront",
                "kill_criteria_written_before_start",
                manifest, ("criteria", "kill_written_before_start"),
                "method step 2 / quality gate: kill criteria are "
                "written before the start")
    _bool_check(results, "criteria_upfront",
                "criteria_agreed_by_decision_owner_before_build",
                manifest,
                ("criteria", "agreed_by_decision_owner_before_build"),
                "method step 2: the success and kill criteria are "
                "agreed by the decision owner before the build")

    # ---- Section 3: timebox_and_scope (skill method step 3:
    #      "Timebox: hard limit (days, not weeks); scope is the
    #      critical path, nothing more"; quality gate: "Timebox
    #      enforced; scope creep refused politely"; red line:
    #      "no unbounded POCs") ----
    _bool_check(results, "timebox_and_scope", "timebox_hard_limit_set",
                manifest, ("timebox", "hard_limit_set"),
                "method step 3 / red line: a hard timebox limit is "
                "set — no unbounded POCs")
    limit, has_limit = _get(manifest, "timebox", "limit_days")
    elapsed, has_elapsed = _get(manifest, "timebox", "elapsed_days")
    both_numbers = (
        has_limit and has_elapsed
        and _is_number(limit) and _is_number(elapsed)
    )
    overrun = (
        elapsed - limit
        if both_numbers else None
    )
    within = (
        both_numbers
        and limit > 0
        and elapsed >= 0
        and elapsed <= limit
    )
    _check(results, "timebox_and_scope",
           "timebox_within_declared_limit", elapsed,
           both_numbers, within,
           "method step 3 / quality gate: the elapsed days do not "
           "exceed the declared timebox limit in days, the limit "
           "is positive, and the elapsed time is not negative — "
           "the skill states no numeric cap, so only the declared "
           "numbers are compared")
    _bool_check(results, "timebox_and_scope",
                "scope_limited_to_critical_path",
                manifest, ("timebox", "scope_limited_to_critical_path"),
                "method step 3: scope is the critical path, nothing "
                "more")
    _bool_check(results, "timebox_and_scope",
                "scope_creep_refused_politely",
                manifest, ("timebox", "scope_creep_refused_politely"),
                "quality gate: scope creep is refused politely")

    # ---- Section 4: disposition_and_production_boundary (skill
    #      method step 4: "Disposable by default: POC code is
    #      throwaway unless explicitly slated for hardening — say
    #      which it is"; red lines: "No silent POC-to-production
    #      gradient"; ""It worked in the POC" is never production
    #      evidence") ----
    disposition, has_disposition = _get(manifest, "disposition")
    disposition_is_string = has_disposition and isinstance(disposition, str)
    _check(results, "disposition_and_production_boundary",
           "disposition_is_a_stated_option", disposition,
           disposition_is_string,
           disposition_is_string and disposition in STATED_DISPOSITIONS,
           "method step 4: the disposition says which it is — "
           "disposable (throwaway by default) or explicitly "
           "slated_for_hardening")
    _false_check(results, "disposition_and_production_boundary",
                 "no_silent_poc_to_production",
                 manifest, ("production_boundary", "slid_into_production"),
                 "red line: no silent POC-to-production gradient — "
                 "the POC does not slide into production")
    _false_check(results, "disposition_and_production_boundary",
                 "poc_result_not_claimed_as_production_evidence",
                 manifest,
                 ("production_boundary", "claimed_as_production_evidence"),
                 "red line: 'it worked in the POC' is never claimed "
                 "as production evidence")

    # ---- Section 5: evidence (skill method step 5: "Evidence:
    #      measurements, tests, a demo — numbers over impressions;
    #      record what was stubbed or mocked") ----
    _bool_check(results, "evidence",
                "evidence_from_measurements_tests_or_demo",
                manifest, ("evidence", "from_measurements_tests_or_demo"),
                "method step 5: evidence is measurements, tests, or "
                "a demo")
    _bool_check(results, "evidence", "evidence_numbers_over_impressions",
                manifest, ("evidence", "numbers_over_impressions"),
                "method step 5: the evidence is numbers over "
                "impressions")
    _bool_check(results, "evidence", "stubs_and_mocks_recorded",
                manifest, ("evidence", "stubs_and_mocks_recorded"),
                "method step 5: what was stubbed or mocked is "
                "recorded")

    # ---- Section 6: decision_and_findings (skill method steps
    #      6-7: "Decision: adopt / adapt / abandon with written
    #      rationale referencing the criteria; log it"; "If
    #      adopting: it goes through the full team process (spec
    #      -> build -> test -> review). POCs never slide into
    #      prod"; quality gates: "Findings memo with decision +
    #      evidence"; "Clear "not tested / not included" list") ----
    _bool_check(results, "decision_and_findings", "findings_memo_written",
                manifest, ("findings", "memo_written"),
                "quality gate: a findings memo is written, with "
                "decision and evidence")
    decision, has_decision = _get(manifest, "decision")
    decision_is_string = has_decision and isinstance(decision, str)
    _check(results, "decision_and_findings",
           "decision_is_a_stated_option", decision,
           decision_is_string,
           decision_is_string and decision in STATED_DECISIONS,
           "method step 6: the decision is one of the options the "
           "skill names — adopt, adapt, or abandon")
    _bool_check(results, "decision_and_findings",
                "decision_rationale_references_criteria",
                manifest, ("findings", "rationale_references_criteria"),
                "method step 6: the written rationale references "
                "the criteria")
    _bool_check(results, "decision_and_findings", "decision_logged",
                manifest, ("findings", "decision_logged"),
                "method step 6: the decision is logged")
    _bool_check(results, "decision_and_findings",
                "not_tested_list_clear",
                manifest, ("findings", "not_tested_list_clear"),
                "quality gate: a clear 'not tested / not included' "
                "list is present")
    _bool_check(results, "decision_and_findings",
                "adopting_routed_through_full_team_process",
                manifest,
                ("findings", "adopting_routed_through_full_team_process"),
                "method step 7: if adopting, the work is routed "
                "through the full team process (spec, build, test, "
                "review) — POCs never slide into production")

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
        verdict = "CARD_NOT_COMPLETE"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CARD_COMPLETE"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("timebox_within_declared_limit",
                          "disposition_is_a_stated_option",
                          "decision_is_a_stated_option")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "buyer-test-card",
        "atom_version": "0.1.0",
        "idea": manifest.get("idea"),
        "decision": manifest.get("decision"),
        "disposition": manifest.get("disposition"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "timebox_limit_days": limit if has_limit else None,
        "timebox_elapsed_days": elapsed if has_elapsed else None,
        "timebox_overrun_days": _fmt6(overrun),
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
        "BUYER-TEST CARD",
        f"idea: {verdict.get('idea')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: buyer_test_card.py <manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CARD_COMPLETE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
