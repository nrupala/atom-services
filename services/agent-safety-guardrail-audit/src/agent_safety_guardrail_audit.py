#!/usr/bin/env python3
"""Agent safety guardrail audit — deterministic core.

Built from the bound skill `agent-safety-guardrails` (v1): "Guard the
agents — injection defense, tool least-privilege, approvals, sandboxes,
kill switches."

The caller submits an agent-safety evidence manifest (a dict, or JSON
on the CLI). Every check in every section reads declared manifest
fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Verdict:
- any fail             -> NOT_GUARDED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> GUARDED

No model call, no network, no clock dependence: the same manifest
always produces the same audit. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "injection_defense",
    "tool_least_privilege",
    "approval_gates",
    "sandboxing",
    "budgets_and_circuit_breakers",
    "output_validation",
    "secrets_hygiene",
    "red_teaming",
)

REQUIRED_APPROVAL_ACTIONS = [
    "deploys",
    "payments",
    "deletions",
    "external_sends",
    "credential_changes",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "system": "string",
    "version": "string",
    "guardrails_disabled": "boolean",
    "injection_defense": {
        "external_content_treated_as_data": "boolean",
        "suspicious_imperatives_flagged": "boolean",
        "test_suite": {"present": "boolean", "passing": "boolean"},
    },
    "tool_access": {
        "scoped_to_job": "boolean",
        "read_write_separated": "boolean",
        "destructive_tools_gated": "boolean",
        "shell_access": "boolean",
        "shell_sandboxed": "boolean",
    },
    "approvals": {
        "destructive_actions_require_approval": "boolean",
        "verified": "boolean",
        "covered_actions": ["string"],
        "bypassable_by_agent": "boolean",
    },
    "sandbox": {
        "enabled": "boolean",
        "filesystem_scope_minimal": "boolean",
        "egress_restricted": "boolean",
        "resource_caps_enforced": "boolean",
        "abuse_test_passed": "boolean",
    },
    "budgets": {"caps_set": "boolean", "alert_before_cap": "boolean"},
    "circuit_breakers": {"loop_detection_enabled": "boolean"},
    "kill_switch": {"present": "boolean", "tested": "boolean"},
    "output_validation": {
        "schema_checked": "boolean",
        "model_output_evaled": "boolean",
        "downstream_parameterized": "boolean",
    },
    "secrets": {
        "values_in_context": "boolean",
        "pii_in_context": "boolean",
        "credential_handles_only": "boolean",
        "exfiltration_paths_tested": "boolean",
    },
    "red_team": {
        "injection_suite_run": "boolean",
        "jailbreak_tested": "boolean",
        "canary_tokens_used": "boolean",
        "findings_become_regression_tests": "boolean",
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


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def evaluate(manifest):
    """Return the audit dict for an agent-safety evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: injection_defense (skill method 1 + quality gate) ----
    treated, has_treated = _get(
        manifest, "injection_defense", "external_content_treated_as_data")
    _check(results, "injection_defense", "external_content_treated_as_data",
           treated, has_treated, treated is True,
           "skill method 1: all external content is hostile data, never instructions")

    flagged, has_flagged = _get(
        manifest, "injection_defense", "suspicious_imperatives_flagged")
    _check(results, "injection_defense", "suspicious_imperatives_flagged",
           flagged, has_flagged, flagged is True,
           "content stripped/annotated before model use; suspicious imperatives flagged")

    suite_present, has_sp = _get(
        manifest, "injection_defense", "test_suite", "present")
    _check(results, "injection_defense", "injection_test_suite_present",
           suite_present, has_sp, suite_present is True,
           "quality gate: injection test suite exists on the agent's inputs")

    suite_passing, has_spass = _get(
        manifest, "injection_defense", "test_suite", "passing")
    _check(results, "injection_defense", "injection_test_suite_passing",
           suite_passing, has_spass, suite_passing is True,
           "quality gate: injection test suite passes on the agent's inputs")

    # ---- Section 2: tool_least_privilege (skill method 2) ----
    scoped, has_scoped = _get(manifest, "tool_access", "scoped_to_job")
    _check(results, "tool_least_privilege", "tools_scoped_to_job",
           scoped, has_scoped, scoped is True,
           "each agent gets only the tools its job needs")

    separated, has_sep = _get(manifest, "tool_access", "read_write_separated")
    _check(results, "tool_least_privilege", "read_write_tools_separated",
           separated, has_sep, separated is True,
           "read tools granted before write tools")

    gated, has_gated = _get(manifest, "tool_access", "destructive_tools_gated")
    _check(results, "tool_least_privilege", "destructive_tools_gated",
           gated, has_gated, gated is True,
           "destructive tools gated (approval or explicit scope)")

    shell_access, has_shell = _get(manifest, "tool_access", "shell_access")
    shell_sandboxed, has_sandboxed = _get(
        manifest, "tool_access", "shell_sandboxed")
    if has_shell and shell_access:
        _check(results, "tool_least_privilege", "shell_access_sandboxed",
               shell_sandboxed, has_sandboxed, shell_sandboxed is True,
               "no shell passthrough without sandbox")
    else:
        _check(results, "tool_least_privilege", "shell_access_sandboxed",
               shell_access, has_shell, True,
               "no shell access declared")

    # ---- Section 3: approval_gates (skill method 3 + red lines) ----
    req_appr, has_ra = _get(
        manifest, "approvals", "destructive_actions_require_approval")
    _check(results, "approval_gates", "destructive_actions_require_approval",
           req_appr, has_ra, req_appr is True,
           "deploys, payments, deletions, external sends, credential changes — human confirms")

    verified, has_ver = _get(manifest, "approvals", "verified")
    _check(results, "approval_gates", "approval_requirement_verified",
           verified, has_ver, verified is True,
           "quality gate: destructive actions require approval (verified, not assumed)")

    covered, has_covered = _get(manifest, "approvals", "covered_actions")
    _check(results, "approval_gates", "approvals_cover_all_sensitive_actions",
           covered, has_covered,
           isinstance(covered, list)
           and all(a in covered for a in REQUIRED_APPROVAL_ACTIONS),
           f"covered_actions={covered!r}")

    bypassable, has_byp = _get(manifest, "approvals", "bypassable_by_agent")
    _check(results, "approval_gates", "approval_not_bypassable_by_agent",
           bypassable, has_byp, bypassable is False,
           "the guardrail is not configurable away by the agent")

    disabled, has_disabled = _get(manifest, "guardrails_disabled")
    _check(results, "approval_gates", "guardrails_not_disabled",
           disabled, has_disabled, disabled is False,
           "skill red line: never disable guardrails 'to make it work'")

    # ---- Section 4: sandboxing (skill method 4 + quality gate) ----
    sb_enabled, has_sbe = _get(manifest, "sandbox", "enabled")
    _check(results, "sandboxing", "untrusted_code_sandboxed",
           sb_enabled, has_sbe, sb_enabled is True,
           "untrusted code/tooling runs in isolation")

    fs_min, has_fsm = _get(manifest, "sandbox", "filesystem_scope_minimal")
    _check(results, "sandboxing", "filesystem_scope_minimal",
           fs_min, has_fsm, fs_min is True,
           "filesystem scope minimal")

    egress, has_egress = _get(manifest, "sandbox", "egress_restricted")
    _check(results, "sandboxing", "egress_restricted",
           egress, has_egress, egress is True,
           "egress restricted")

    caps, has_caps = _get(manifest, "sandbox", "resource_caps_enforced")
    _check(results, "sandboxing", "resource_caps_enforced",
           caps, has_caps, caps is True,
           "resource caps enforced")

    abuse, has_abuse = _get(manifest, "sandbox", "abuse_test_passed")
    _check(results, "sandboxing", "sandbox_abuse_test_passed",
           abuse, has_abuse, abuse is True,
           "quality gate: sandbox + egress + resource caps verified with an abuse test")

    # ---- Section 5: budgets_and_circuit_breakers (skill method 5 + quality gate) ----
    bcaps, has_bcaps = _get(manifest, "budgets", "caps_set")
    _check(results, "budgets_and_circuit_breakers", "budget_caps_set",
           bcaps, has_bcaps, bcaps is True,
           "token/cost/time caps set")

    alert, has_alert = _get(manifest, "budgets", "alert_before_cap")
    _check(results, "budgets_and_circuit_breakers", "budgets_alert_before_cap",
           alert, has_alert, alert is True,
           "quality gate: budgets alert before cap")

    loop, has_loop = _get(
        manifest, "circuit_breakers", "loop_detection_enabled")
    _check(results, "budgets_and_circuit_breakers", "loop_detection_enabled",
           loop, has_loop, loop is True,
           "loop detection: same action N times -> stop + escalate")

    ks_present, has_ksp = _get(manifest, "kill_switch", "present")
    _check(results, "budgets_and_circuit_breakers", "kill_switch_present",
           ks_present, has_ksp, ks_present is True,
           "kill switch per agent")

    ks_tested, has_kst = _get(manifest, "kill_switch", "tested")
    _check(results, "budgets_and_circuit_breakers", "kill_switch_tested",
           ks_tested, has_kst, ks_tested is True,
           "quality gate: kill switch tested")

    # ---- Section 6: output_validation (skill method 6) ----
    schema, has_schema = _get(manifest, "output_validation", "schema_checked")
    _check(results, "output_validation", "output_schema_checked",
           schema, has_schema, schema is True,
           "schema-check what agents produce before acting on it")

    evaled, has_evaled = _get(manifest, "output_validation", "model_output_evaled")
    _check(results, "output_validation", "model_output_not_evaled",
           evaled, has_evaled, evaled is False,
           "never eval model output")

    param, has_param = _get(
        manifest, "output_validation", "downstream_parameterized")
    _check(results, "output_validation", "downstream_calls_parameterized",
           param, has_param, param is True,
           "parameterize everything downstream")

    # ---- Section 7: secrets_hygiene (skill method 7 + red line) ----
    values, has_values = _get(manifest, "secrets", "values_in_context")
    _check(results, "secrets_hygiene", "secret_values_not_in_context",
           values, has_values, values is False,
           "skill red line: no secrets in agent context by default")

    pii, has_pii = _get(manifest, "secrets", "pii_in_context")
    _check(results, "secrets_hygiene", "pii_not_in_context",
           pii, has_pii, pii is False,
           "skill red line: no PII in agent context by default")

    handles, has_handles = _get(manifest, "secrets", "credential_handles_only")
    _check(results, "secrets_hygiene", "credential_handles_only",
           handles, has_handles, handles is True,
           "agents reference credential handles, not values")

    exfil, has_exfil = _get(manifest, "secrets", "exfiltration_paths_tested")
    _check(results, "secrets_hygiene", "exfiltration_paths_tested",
           exfil, has_exfil, exfil is True,
           "exfiltration paths (rendering, URLs, logs) considered in tests")

    # ---- Section 8: red_teaming (skill method 8) ----
    rt_inj, has_rti = _get(manifest, "red_team", "injection_suite_run")
    _check(results, "red_teaming", "injection_suite_run_against_interface",
           rt_inj, has_rti, rt_inj is True,
           "injection suites: instructions hidden in content")

    jailbreak, has_jb = _get(manifest, "red_team", "jailbreak_tested")
    _check(results, "red_teaming", "jailbreak_attempts_tested",
           jailbreak, has_jb, jailbreak is True,
           "jailbreak attempts run against the interface")

    canary, has_canary = _get(manifest, "red_team", "canary_tokens_used")
    _check(results, "red_teaming", "canary_tokens_used",
           canary, has_canary, canary is True,
           "canary tokens for leak detection")

    regression, has_reg = _get(
        manifest, "red_team", "findings_become_regression_tests")
    _check(results, "red_teaming", "findings_become_regression_tests",
           regression, has_reg, regression is True,
           "findings become regression tests")

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
        verdict = "NOT_GUARDED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "GUARDED"

    return {
        "service": "agent-safety-guardrail-audit",
        "atom_version": "0.1.0",
        "system": manifest.get("system"),
        "version": manifest.get("version"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across eight sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of an audit dict."""
    lines = [
        "AGENT-SAFETY GUARDRAIL AUDIT",
        f"system: {verdict.get('system')}  version: {verdict.get('version')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<30} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: agent_safety_guardrail_audit.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "GUARDED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
