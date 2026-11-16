#!/usr/bin/env python3
"""Audience contract design — deterministic core.

Built from the bound skill `audience-contracts` (v1): "Design for
four user classes — humans, agents, hybrid systems, software —
with progressive contracts. Author once; contract four times —
never four products, never one lowest-common-denominator
interface."

This atom is an AUDIT of a declared audience-contract design: it
validates the design record a caller declares against the skill's
method steps, its four quality gates, and its red lines. It does
not design the interface, render any view, or verify that a
declared path actually works — it checks that the record the
skill requires is present and internally complete on the declared
evidence.

The caller submits an audience-contract manifest (a dict, or JSON
on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

One set of checks is computed, not merely declared, using only
the skill's own structure: the skill names exactly four user
classes (humans, agents, systems, software) and its first quality
gate requires all four to have "a named, working path to the
artifact". The declared path fields are therefore counted —
`classes_with_path_count` reports how many of the four declare a
path (null when none of the four is declared) — and the four
lattice checks are conditional: the skill's authority lattice
("dangerous actions need capability (agent) + approval (human) +
determinism (software) + audit (system). Miss one -> no action")
binds only when dangerous actions are declared present; when
none are declared, each lattice check passes as not applicable.

The computed outcome is also reported as `computed_status`:
"outside_stated_limits_on_declared_evidence" when any of the four
class-path checks fails, "within_stated_limits_on_declared_
evidence" when all four pass, otherwise null.

Verdict:
- any fail             -> AUDIENCE_CONTRACT_INCOMPLETE
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> AUDIENCE_CONTRACT_COMPLETE

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "classes_and_paths",
    "single_truth",
    "progressive_formality_and_failure",
    "authority_lattice",
    "verification_by_class",
    "identity_by_class",
)

CLASS_PATH_FIELDS = (
    ("classes", "human_path_defined"),
    ("classes", "agent_path_defined"),
    ("classes", "system_path_defined"),
    ("classes", "software_path_defined"),
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "artifact": "string",
    "classes": {
        "human_path_defined": "boolean",
        "agent_path_defined": "boolean",
        "system_path_defined": "boolean",
        "software_path_defined": "boolean",
        "single_class_only_shipment": "boolean",
    },
    "single_truth": {
        "canonical_source_declared": "boolean",
        "renderings_generated_not_maintained": "boolean",
        "truth_forked_per_class": "boolean",
    },
    "progressive_formality": {
        "formality_progressive_declared": "boolean",
    },
    "failure": {
        "human_failure_defined": "boolean",
        "agent_failure_defined": "boolean",
        "system_failure_defined": "boolean",
        "software_failure_defined": "boolean",
    },
    "authority": {
        "dangerous_actions_present": "boolean",
        "capability_required": "boolean",
        "human_approval_required": "boolean",
        "software_determinism_required": "boolean",
        "system_audit_required": "boolean",
        "dangerous_path_skips_lattice": "boolean",
    },
    "verification": {
        "agents_verified_by_software": "boolean",
        "humans_verified_by_evidence": "boolean",
        "software_verified_by_spec_tests": "boolean",
        "systems_verified_by_audit_trails": "boolean",
    },
    "identity": {
        "human_passkey_or_mfa": "boolean",
        "agent_scoped_short_lived_tokens": "boolean",
        "system_policy_engine": "boolean",
        "software_service_creds_or_mtls": "boolean",
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


def _lattice_check(results, name, manifest, element_path,
                   evidence, na_evidence):
    dangerous, has_dangerous = _get(
        manifest, "authority", "dangerous_actions_present")
    element, has_element = _get(manifest, *element_path)
    if has_dangerous and dangerous:
        _check(results, "authority_lattice", name, element,
               has_element, element is True, evidence)
    else:
        _check(results, "authority_lattice", name, dangerous,
               has_dangerous, True, na_evidence)


def evaluate(manifest):
    """Return the verdict dict for an audience-contract manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: classes_and_paths (skill method step 1 +
    #      quality gate 1: "All four classes have a named, working
    #      path to the artifact"; red line: "Never ship for one
    #      class and assume others 'will cope'") ----
    _bool_check(results, "classes_and_paths", "human_path_defined",
                manifest, ("classes", "human_path_defined"),
                "method 1 / quality gate: the human class has a "
                "named, working path — visual, narrative, "
                "progressive disclosure, forgiving input; approves")
    _bool_check(results, "classes_and_paths", "agent_path_defined",
                manifest, ("classes", "agent_path_defined"),
                "method 1 / quality gate: the agent class has a "
                "named, working path — procedure: when to use, "
                "method, gates, red lines; executes within caps")
    _bool_check(results, "classes_and_paths", "system_path_defined",
                manifest, ("classes", "system_path_defined"),
                "method 1 / quality gate: the system class "
                "(human+agent+software together) has a named, "
                "working path — handoff contracts, approvals, "
                "shared state, audit; binds the others")
    _bool_check(results, "classes_and_paths", "software_path_defined",
                manifest, ("classes", "software_path_defined"),
                "method 1 / quality gate: the software class has a "
                "named, working path — schemas, stable IDs, "
                "versioned API/CLI/JSON, exit codes; deterministic")
    _false_check(results, "classes_and_paths",
                 "not_single_class_only_shipment", manifest,
                 ("classes", "single_class_only_shipment"),
                 "red line: never ship for one class and assume "
                 "others will cope")

    # ---- Section 2: single_truth (skill method step 2: "Single
    #      truth, multiple renderings"; quality gate 2: "One
    #      canonical source; renderings are generated, not
    #      maintained separately"; red line: "never fork truth
    #      per audience") ----
    _bool_check(results, "single_truth", "canonical_source_declared",
                manifest, ("single_truth", "canonical_source_declared"),
                "method 2: one canonical artifact is the single "
                "source of truth, rendered per audience")
    _bool_check(results, "single_truth",
                "renderings_generated_not_maintained", manifest,
                ("single_truth", "renderings_generated_not_maintained"),
                "quality gate: renderings are generated from the "
                "canonical source, not maintained separately")
    _false_check(results, "single_truth", "truth_not_forked_per_class",
                 manifest, ("single_truth", "truth_forked_per_class"),
                 "red line: never fork truth per audience — forking "
                 "truth per class is drift")

    # ---- Section 3: progressive_formality_and_failure (skill
    #      method steps 3-4: progressive formality, human most
    #      forgiving to software least; fail per class; quality
    #      gate 3: "Failure behavior defined per class") ----
    _bool_check(results, "progressive_formality_and_failure",
                "formality_progressive_declared", manifest,
                ("progressive_formality",
                 "formality_progressive_declared"),
                "method 3: progressive formality — human view most "
                "forgiving to software least, same content: card, "
                "procedure, gates, schema, signature")
    _bool_check(results, "progressive_formality_and_failure",
                "human_failure_defined", manifest,
                ("failure", "human_failure_defined"),
                "method 4: humans get readable errors plus retry")
    _bool_check(results, "progressive_formality_and_failure",
                "agent_failure_defined", manifest,
                ("failure", "agent_failure_defined"),
                "method 4: agents get instructive errors plus a "
                "safe fallback")
    _bool_check(results, "progressive_formality_and_failure",
                "system_failure_defined", manifest,
                ("failure", "system_failure_defined"),
                "method 4: systems get escalation")
    _bool_check(results, "progressive_formality_and_failure",
                "software_failure_defined", manifest,
                ("failure", "software_failure_defined"),
                "method 4: software gets structured errors plus "
                "exit codes")

    # ---- Section 4: authority_lattice (skill method step 5:
    #      "Authority lattice: dangerous actions need capability
    #      (agent) + approval (human) + determinism (software) +
    #      audit (system). Miss one -> no action"; quality gate 4:
    #      "Danger paths pass the authority lattice; audit
    #      exists") ----
    _lattice_check(
        results, "lattice_capability_required", manifest,
        ("authority", "capability_required"),
        "authority lattice: dangerous actions need capability "
        "(agent)",
        "no dangerous actions declared")
    _lattice_check(
        results, "lattice_human_approval_required", manifest,
        ("authority", "human_approval_required"),
        "authority lattice: dangerous actions need approval "
        "(human)",
        "no dangerous actions declared")
    _lattice_check(
        results, "lattice_software_determinism_required", manifest,
        ("authority", "software_determinism_required"),
        "authority lattice: dangerous actions need determinism "
        "(software)",
        "no dangerous actions declared")
    _lattice_check(
        results, "lattice_system_audit_required", manifest,
        ("authority", "system_audit_required"),
        "authority lattice: dangerous actions need audit "
        "(system) — audit exists",
        "no dangerous actions declared")
    _false_check(results, "authority_lattice",
                 "dangerous_path_does_not_skip_lattice", manifest,
                 ("authority", "dangerous_path_skips_lattice"),
                 "red line: no dangerous path that skips the "
                 "lattice")

    # ---- Section 5: verification_by_class (skill method step 6:
    #      "Verify by class, never by self-report") ----
    _bool_check(results, "verification_by_class",
                "agents_verified_by_software", manifest,
                ("verification", "agents_verified_by_software"),
                "method 6: agents are verified with software — "
                "tests and signatures")
    _bool_check(results, "verification_by_class",
                "humans_verified_by_evidence", manifest,
                ("verification", "humans_verified_by_evidence"),
                "method 6: humans are verified by evidence")
    _bool_check(results, "verification_by_class",
                "software_verified_by_spec_tests", manifest,
                ("verification", "software_verified_by_spec_tests"),
                "method 6: software is verified by spec tests")
    _bool_check(results, "verification_by_class",
                "systems_verified_by_audit_trails", manifest,
                ("verification", "systems_verified_by_audit_trails"),
                "method 6: systems are verified by cross-"
                "verification via audit trails")

    # ---- Section 6: identity_by_class (skill method step 7:
    #      "Identity per class") ----
    _bool_check(results, "identity_by_class", "human_identity_declared",
                manifest, ("identity", "human_passkey_or_mfa"),
                "method 7: humans authenticate with passkey or MFA")
    _bool_check(results, "identity_by_class", "agent_identity_declared",
                manifest,
                ("identity", "agent_scoped_short_lived_tokens"),
                "method 7: agents authenticate with scoped "
                "short-lived tokens")
    _bool_check(results, "identity_by_class", "system_identity_declared",
                manifest, ("identity", "system_policy_engine"),
                "method 7: systems authenticate through a policy "
                "engine")
    _bool_check(results, "identity_by_class",
                "software_identity_declared", manifest,
                ("identity", "software_service_creds_or_mtls"),
                "method 7: software authenticates with service "
                "credentials or mTLS")

    path_values = [_get(manifest, *p) for p in CLASS_PATH_FIELDS]
    if any(present for _, present in path_values):
        classes_with_path_count = sum(
            1 for value, _ in path_values if value is True)
    else:
        classes_with_path_count = None

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
        verdict = "AUDIENCE_CONTRACT_INCOMPLETE"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "AUDIENCE_CONTRACT_COMPLETE"

    path_statuses = [
        r["status"] for r in results
        if r["check"] in ("human_path_defined", "agent_path_defined",
                          "system_path_defined", "software_path_defined")
    ]
    if any(s == "fail" for s in path_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in path_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "audience-contract-design",
        "atom_version": "0.1.0",
        "artifact": manifest.get("artifact"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "classes_with_path_count": classes_with_path_count,
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
        "AUDIENCE CONTRACT DESIGN",
        f"artifact: {verdict.get('artifact')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: audience_contract_design.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "AUDIENCE_CONTRACT_COMPLETE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
