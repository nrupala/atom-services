#!/usr/bin/env python3
"""Tested authorization policy pack — deterministic core.

Built from the bound skill `policy-as-code` (v1): "Authorization
logic belongs in testable policy — not scattered `if` statements.
Write it, test it, shadow it, log every decision."

The caller submits a tested-policy-pack manifest (a dict, or JSON
on the CLI): the declared decision model, the declared policy list
(each policy's declared default), the declared test list (each
test's policy id and kind), the policy-code record, the rollout
record, the decision-log record, and the governance / enforcement
record.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Three checks are computed, not declared, and use ONLY relationships
the skill itself states, over values the caller declares — no
outside standard or threshold is imported:

- every declared policy defaults to deny (method 1: "default
  deny"; red line: "No default-allow")
- every declared policy is covered by at least one declared test
  (red line: "no untested policy to production"); the evidence and
  the verdict name the offending policy ids
- every declared policy has a declared positive, negative and edge
  test (method 3: "unit tests per rule — positive, negative, edge
  cases")

Computed quantities (policy count, tested-policy count, test
count, and the tested-policy coverage ratio) are reported with the
ratio as a string with exactly four decimal places, produced in
both implementations by the same fixed rule: round half up to 4dp
— floor(v * 10000 + 0.5) / 10000 — then format with exactly four
decimals. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The skill states no coverage
threshold, so none is invented: the ratio is reported, and the
pass/fail checks are the completeness relationships above
(every policy tested; every policy with all three test kinds).

The computed outcome is also reported as `coverage_status`:
"incomplete_on_declared_tests" when any applicable computed check
fails, "complete_on_declared_tests" when every applicable computed
check is complete and passes, otherwise null.

Verdict:
- any fail             -> NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> READY

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "decision_model",
    "policy_code",
    "testing",
    "rollout",
    "decision_logs",
    "governance_and_enforcement",
)

TEST_KINDS = ("positive", "negative", "edge")

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "pack": "string",
    "decision_model": {
        "decisions_enumerated": "boolean",
        "input_schema_defined": "boolean",
        "default_deny": "boolean",
    },
    "policies": [{"id": "string", "default": "string"}],
    "policy_code": {
        "rules_small_and_composable": "boolean",
        "data_separated_from_logic": "boolean",
        "policy_data_versioned": "boolean",
        "decision_explanations_available": "boolean",
    },
    "tests": [{"policy_id": "string", "kind": "string"}],
    "testing": {
        "tests_green": "boolean",
        "lint_format_clean": "boolean",
        "key_roles_coverage_declared": "boolean",
    },
    "rollout": {
        "shadow_completed": "boolean",
        "staged_before_production": "boolean",
        "break_glass_documented_gated_audited": "boolean",
        "break_glass_tested": "boolean",
        "silent_policy_edits": "boolean",
    },
    "decision_logs": {
        "record_who_decision_version_reason": "boolean",
        "retained_immutably": "boolean",
        "full_in_sensitive_flows": "boolean",
    },
    "governance": {
        "second_pair_of_eyes_on_prs": "boolean",
        "version_and_changelog": "boolean",
        "human_summary_in_sync_with_code": "boolean",
    },
    "enforcement": {
        "points_inventoried": "boolean",
        "failure_mode_chosen_per_surface": "boolean",
        "sensitive_surfaces_fail_closed": "boolean",
        "bypass_paths_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, present, ok, evidence):
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
    _check(results, section, name, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, present, value is False, evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _policy_ids(manifest):
    """Declared policy ids, in declaration order (valid entries only)."""
    policies, has = _get(manifest, "policies")
    if not has or not isinstance(policies, list):
        return None
    ids = []
    for entry in policies:
        if isinstance(entry, dict) and isinstance(entry.get("id"), str) \
                and entry.get("id"):
            ids.append(entry["id"])
    return ids


def _policies_checks(results, manifest):
    """Computed checks over policies[]; returns policy ids or None."""
    policies, has = _get(manifest, "policies")
    if not has or not isinstance(policies, list) or not policies:
        _check(results, "policy_code", "policies_declared", False, False,
               "no policies declared")
        _check(results, "decision_model",
               "every_policy_defaults_to_deny", False, False,
               "no policies declared")
        return None
    ids = _policy_ids(manifest)
    if not ids:
        _check(results, "policy_code", "policies_declared", True, False,
               "policies declared but none carries a non-empty string id")
        _check(results, "decision_model",
               "every_policy_defaults_to_deny", False, False,
               "no policy entry carries a usable id")
        return None
    _check(results, "policy_code", "policies_declared", True, True,
           "policies declared as code — authorization logic in "
           "testable policy, not scattered if statements")
    incomplete = False
    violating = []
    for entry in policies:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        pid = entry.get("id")
        if not isinstance(pid, str) or not pid:
            incomplete = True
            continue
        default, has_default = _get(entry, "default")
        if not has_default:
            incomplete = True
        elif default != "deny":
            violating.append(pid)
    if incomplete:
        _check(results, "decision_model",
               "every_policy_defaults_to_deny", False, False,
               "a policy entry is missing its declared default")
    elif violating:
        _check(results, "decision_model",
               "every_policy_defaults_to_deny", True, False,
               "skill red line: no default-allow — policies not "
               "defaulting to deny: " + ", ".join(violating))
    else:
        _check(results, "decision_model",
               "every_policy_defaults_to_deny", True, True,
               "default deny — every declared policy defaults to deny")
    return ids


def _testing_checks(results, manifest, policy_ids):
    """Computed test-coverage checks over tests[].

    Returns (computed_failed, untested_ids, incomplete_kind_ids).
    """
    tests, has_tests = _get(manifest, "tests")
    if policy_ids is None:
        _check(results, "testing", "every_policy_tested", False, False,
               "no policies declared")
        _check(results, "testing",
               "positive_negative_edge_tests_per_policy", False, False,
               "no policies declared")
        return None, [], []
    if not has_tests or not isinstance(tests, list):
        _check(results, "testing", "every_policy_tested", False, False,
               "no tests declared")
        _check(results, "testing",
               "positive_negative_edge_tests_per_policy", False, False,
               "no tests declared")
        return None, list(policy_ids), list(policy_ids)
    kinds_by_policy = {}
    for entry in tests:
        if not isinstance(entry, dict):
            continue
        pid = entry.get("policy_id")
        kind = entry.get("kind")
        if isinstance(pid, str) and pid:
            kinds_by_policy.setdefault(pid, set())
            if kind in TEST_KINDS:
                kinds_by_policy[pid].add(kind)
    untested = [pid for pid in policy_ids if pid not in kinds_by_policy]
    if untested:
        _check(results, "testing", "every_policy_tested", True, False,
               "skill red line: no untested policy to production — "
               "untested policies: " + ", ".join(untested))
    else:
        _check(results, "testing", "every_policy_tested", True, True,
               "test like code: every declared policy is covered by "
               "at least one declared test")
    incomplete_kinds = []
    for pid in policy_ids:
        kinds = kinds_by_policy.get(pid, set())
        if any(k not in kinds for k in TEST_KINDS):
            incomplete_kinds.append(pid)
    if not tests:
        _check(results, "testing",
               "positive_negative_edge_tests_per_policy", False, False,
               "no tests declared")
    elif incomplete_kinds:
        _check(results, "testing",
               "positive_negative_edge_tests_per_policy", True, False,
               "unit tests per rule — positive, negative, edge cases; "
               "policies missing a test kind: "
               + ", ".join(incomplete_kinds))
    else:
        _check(results, "testing",
               "positive_negative_edge_tests_per_policy", True, True,
               "unit tests per rule — every declared policy has a "
               "declared positive, negative and edge test")
    failed = bool(untested) or bool(incomplete_kinds)
    return failed, untested, incomplete_kinds


def evaluate(manifest):
    """Return the verdict dict for a tested-policy-pack manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    policy_ids = _policies_checks(results, manifest)
    computed_failed, untested_ids, _ = _testing_checks(
        results, manifest, policy_ids)

    # ---- Section 1: decision_model (skill method 1) ----
    _bool_check(results, "decision_model", "decisions_enumerated",
                manifest, ("decision_model", "decisions_enumerated"),
                "model the decisions: the questions to answer are "
                "enumerated (can subject S do action A on resource R, "
                "under context C?)")
    _bool_check(results, "decision_model", "input_schema_defined",
                manifest, ("decision_model", "input_schema_defined"),
                "the input schema for policy decisions is defined")
    _bool_check(results, "decision_model", "default_deny_declared",
                manifest, ("decision_model", "default_deny"),
                "default deny is the declared decision model")

    # ---- Section 2: policy_code (skill method 2; policies_declared
    #      and every_policy_defaults_to_deny are computed above) ----
    _bool_check(results, "policy_code", "rules_small_and_composable",
                manifest, ("policy_code", "rules_small_and_composable"),
                "write policy as code: small composable rules")
    _bool_check(results, "policy_code", "data_separated_from_logic",
                manifest, ("policy_code", "data_separated_from_logic"),
                "data separated from logic")
    _bool_check(results, "policy_code", "policy_data_versioned",
                manifest, ("policy_code", "policy_data_versioned"),
                "policy data versioned")
    _bool_check(results, "policy_code",
                "decision_explanations_available", manifest,
                ("policy_code", "decision_explanations_available"),
                "decision explanations available for humans")

    # ---- Section 3: testing (skill method 3 + quality gate;
    #      the two coverage checks are computed above) ----
    _bool_check(results, "testing", "tests_green", manifest,
                ("testing", "tests_green"),
                "quality gate: tests green")
    _bool_check(results, "testing", "lint_and_format_clean", manifest,
                ("testing", "lint_format_clean"),
                "lint + format in CI (opa fmt / check) clean")
    _bool_check(results, "testing",
                "decision_space_coverage_for_key_roles", manifest,
                ("testing", "key_roles_coverage_declared"),
                "decision-space coverage for key roles declared")

    # ---- Section 4: rollout (skill method 4 + quality gate) ----
    _bool_check(results, "rollout", "shadow_period_completed", manifest,
                ("rollout", "shadow_completed"),
                "quality gate: shadow period completed before "
                "enforcement — shadow mode logs decisions without "
                "enforcing")
    _bool_check(results, "rollout", "staged_rollout_followed", manifest,
                ("rollout", "staged_before_production"),
                "roll out safely: shadow mode, then staging "
                "enforcement, then production")
    _bool_check(results, "rollout",
                "break_glass_documented_gated_audited", manifest,
                ("rollout", "break_glass_documented_gated_audited"),
                "break-glass path documented, gated, and audited")
    _bool_check(results, "rollout", "break_glass_tested_once", manifest,
                ("rollout", "break_glass_tested"),
                "quality gate: break-glass tested once")
    _false_check(results, "rollout", "no_silent_policy_edits", manifest,
                 ("rollout", "silent_policy_edits"),
                 "no silent policy edits")

    # ---- Section 5: decision_logs (skill method 5 + quality gate) --
    _bool_check(results, "decision_logs",
                "logs_record_who_decision_version_reason", manifest,
                ("decision_logs", "record_who_decision_version_reason"),
                "decision logs: who asked, what was decided, under "
                "which policy version, why")
    _bool_check(results, "decision_logs", "logs_retained_immutably",
                manifest, ("decision_logs", "retained_immutably"),
                "quality gate: decision logs retained immutably")
    _bool_check(results, "decision_logs",
                "full_logging_in_sensitive_flows", manifest,
                ("decision_logs", "full_in_sensitive_flows"),
                "sample in prod, full in sensitive flows — full "
                "logging in sensitive flows declared")

    # ---- Section 6: governance_and_enforcement (skill methods
    #      6-7 + quality gate + red line) ----
    _bool_check(results, "governance_and_enforcement",
                "second_review_on_policy_changes", manifest,
                ("governance", "second_pair_of_eyes_on_prs"),
                "governance: second pair of eyes on policy PRs")
    _bool_check(results, "governance_and_enforcement",
                "version_and_changelog_present", manifest,
                ("governance", "version_and_changelog"),
                "version + changelog kept for the policy pack")
    _bool_check(results, "governance_and_enforcement",
                "human_summary_in_sync_with_code", manifest,
                ("governance", "human_summary_in_sync_with_code"),
                "the human-readable policy summary is in sync with "
                "the code")
    _bool_check(results, "governance_and_enforcement",
                "enforcement_points_inventoried", manifest,
                ("enforcement", "points_inventoried"),
                "quality gate: enforcement points inventoried — app "
                "middleware, gateways, sidecars enumerated")
    _bool_check(results, "governance_and_enforcement",
                "failure_mode_chosen_per_surface", manifest,
                ("enforcement", "failure_mode_chosen_per_surface"),
                "quality gate: failure mode chosen consciously — "
                "fail-open vs fail-closed decided per surface")
    _bool_check(results, "governance_and_enforcement",
                "sensitive_surfaces_fail_closed", manifest,
                ("enforcement", "sensitive_surfaces_fail_closed"),
                "default: fail closed for sensitive surfaces")
    _false_check(results, "governance_and_enforcement",
                 "no_bypass_paths", manifest,
                 ("enforcement", "bypass_paths_present"),
                 "skill red line: no bypass paths around enforcement "
                 "points")

    # Reorder checks into section order (computed checks were emitted
    # first so their cross-references resolve).
    order = {name: i for i, name in enumerate((
        "decisions_enumerated", "input_schema_defined",
        "default_deny_declared", "every_policy_defaults_to_deny",
        "policies_declared", "rules_small_and_composable",
        "data_separated_from_logic", "policy_data_versioned",
        "decision_explanations_available",
        "every_policy_tested",
        "positive_negative_edge_tests_per_policy", "tests_green",
        "lint_and_format_clean",
        "decision_space_coverage_for_key_roles",
        "shadow_period_completed", "staged_rollout_followed",
        "break_glass_documented_gated_audited",
        "break_glass_tested_once", "no_silent_policy_edits",
        "logs_record_who_decision_version_reason",
        "logs_retained_immutably", "full_logging_in_sensitive_flows",
        "second_review_on_policy_changes",
        "version_and_changelog_present",
        "human_summary_in_sync_with_code",
        "enforcement_points_inventoried",
        "failure_mode_chosen_per_surface",
        "sensitive_surfaces_fail_closed", "no_bypass_paths",
    ))}
    results.sort(key=lambda r: order[r["check"]])

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
        verdict = "NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "READY"

    tests, has_tests = _get(manifest, "tests")
    test_count = len(tests) if has_tests and isinstance(tests, list) \
        else None
    policy_count = len(policy_ids) if policy_ids is not None else None
    if policy_ids is None or not has_tests \
            or not isinstance(tests, list):
        tested_count = None
        ratio = None
    else:
        tested_count = policy_count - len(untested_ids)
        ratio = (tested_count / policy_count) if policy_count else None

    if computed_failed is True:
        coverage_status = "incomplete_on_declared_tests"
    elif computed_failed is False:
        coverage_status = "complete_on_declared_tests"
    else:
        coverage_status = None

    return {
        "service": "tested-authorization-policy-pack",
        "atom_version": "0.1.0",
        "pack": manifest.get("pack"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "coverage_status": coverage_status,
        "policy_count": policy_count,
        "tested_policy_count": tested_count,
        "test_count": test_count,
        "test_coverage_ratio": _fmt4(ratio),
        "untested_policy_ids": untested_ids,
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
        "TESTED AUTHORIZATION POLICY PACK",
        f"pack: {verdict.get('pack')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<25} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: tested_authorization_policy_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
