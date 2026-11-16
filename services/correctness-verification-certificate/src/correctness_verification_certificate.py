#!/usr/bin/env python3
"""Correctness verification certificate — deterministic core.

Built from the bound skill `correctness-verification` (v1):
correctness is a claim about a *property*, *scope*, and *evidence
level* — never a vibe. "Certified" must mean something: a claims
register, the cheapest sufficient rung of the evidence ladder,
specs before tools, machine-checkable evidence artifacts, honest
scope, CI integration, adversarial review, and a signed,
reproducible certificate.

The caller submits a correctness-verification evidence manifest
(a dict, or JSON on the CLI). Every check in every section reads
declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Verdict (the skill's quality gates — one failure breaks the claim):
- any fail             -> NOT_CERTIFIED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CERTIFIED

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "claims_register",
    "evidence_ladder",
    "specs_before_tools",
    "evidence_artifacts",
    "scope_honesty",
    "ci_integration",
    "adversarial_and_certification",
)


# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "component": "string",
    "register": {
        "exists": "boolean",
        "property_named": "boolean",
        "scope_named": "boolean",
        "evidence_level_assigned": "boolean",
        "expiry_set": "boolean",
    },
    "ladder": {
        "cheapest_sufficient_level_selected": "boolean",
        "claim_exceeds_evidence_level": "boolean",
        "tests_presented_as_proof": "boolean",
    },
    "specs": {
        "invariants_written": "boolean",
        "pre_post_conditions_written": "boolean",
        "liveness_properties_written": "boolean",
        "written_before_tools_run": "boolean",
    },
    "artifacts": {
        "machine_checkable_per_claim": "boolean",
        "proof_scripts_or_solver_logs_retained": "boolean",
        "counterexample_suppressed": "boolean",
        "reproduction_recipe_present": "boolean",
    },
    "scope": {
        "exclusions_written": "boolean",
        "claims_versioned": "boolean",
        "reverification_triggers_defined": "boolean",
        "verified_at_current_version": "boolean",
    },
    "ci": {
        "verification_in_pipeline": "boolean",
        "broken_proof_fails_build": "boolean",
    },
    "review": {
        "independent_review_done": "boolean",
        "counterexample_found": "boolean",
        "counterexample_disclosed": "boolean",
    },
    "certificate": {
        "signed_attestation_binds_claim_artifact_commit": "boolean",
        "independently_reproducible": "boolean",
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


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def evaluate(manifest):
    """Return the verdict dict for a correctness-verification manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: claims_register (method step 1) ----
    _bool_check(results, "claims_register", "register_exists", manifest,
                ("register", "exists"),
                "claims register first: one row per claim — no "
                "register, no claim")
    _bool_check(results, "claims_register",
                "property_named_for_each_claim", manifest,
                ("register", "property_named"),
                "each claim names the property — what exactly is "
                "claimed correct")
    _bool_check(results, "claims_register",
                "scope_named_for_each_claim", manifest,
                ("register", "scope_named"),
                "each claim names its scope — which version / "
                "configuration the claim covers")
    _bool_check(results, "claims_register",
                "evidence_level_assigned_for_each_claim", manifest,
                ("register", "evidence_level_assigned"),
                "each claim carries its evidence level from the ladder")
    _bool_check(results, "claims_register",
                "expiry_set_for_each_claim", manifest,
                ("register", "expiry_set"),
                "each claim carries an expiry — stale certificates "
                "are void")

    # ---- Section 2: evidence_ladder (method step 2 + quality gate) ----
    _bool_check(results, "evidence_ladder",
                "cheapest_sufficient_level_selected", manifest,
                ("ladder", "cheapest_sufficient_level_selected"),
                "the evidence ladder — L1 static analysis, L2 "
                "property-based testing and fuzzing, L3 model "
                "checking, L4 deductive verification, L5 proof "
                "assistants — cheapest that suffices is selected")
    _false_check(results, "evidence_ladder",
                 "no_claim_exceeds_its_evidence_level", manifest,
                 ("ladder", "claim_exceeds_evidence_level"),
                 "no claim exceeds its evidence level (tests are "
                 "not proof)")
    _false_check(results, "evidence_ladder",
                 "tests_not_presented_as_proof", manifest,
                 ("ladder", "tests_presented_as_proof"),
                 "tests are not presented as proof — never say "
                 "proven, bug-free, or certified without property, "
                 "scope, and evidence")

    # ---- Section 3: specs_before_tools (method step 3) ----
    _bool_check(results, "specs_before_tools", "invariants_written",
                manifest, ("specs", "invariants_written"),
                "invariants are written in the checker's language")
    _bool_check(results, "specs_before_tools",
                "pre_post_conditions_written", manifest,
                ("specs", "pre_post_conditions_written"),
                "pre- and post-conditions are written in the "
                "checker's language")
    _bool_check(results, "specs_before_tools",
                "liveness_properties_written", manifest,
                ("specs", "liveness_properties_written"),
                "liveness properties are written in the checker's "
                "language")
    _bool_check(results, "specs_before_tools",
                "specs_written_before_tools_run", manifest,
                ("specs", "written_before_tools_run"),
                "specs come before tools: written before running "
                "anything")

    # ---- Section 4: evidence_artifacts (method step 4 + red lines) ----
    _bool_check(results, "evidence_artifacts",
                "machine_checkable_artifact_for_each_claim", manifest,
                ("artifacts", "machine_checkable_per_claim"),
                "each claim has a machine-checkable artifact behind "
                "it")
    _bool_check(results, "evidence_artifacts",
                "proof_scripts_or_solver_logs_retained", manifest,
                ("artifacts", "proof_scripts_or_solver_logs_retained"),
                "evidence artifacts are retained: counterexamples, "
                "proof scripts, solver logs, CI records")
    _false_check(results, "evidence_artifacts",
                 "counterexample_not_suppressed", manifest,
                 ("artifacts", "counterexample_suppressed"),
                 "never suppress a counterexample")
    _bool_check(results, "evidence_artifacts",
                "reproduction_recipe_present", manifest,
                ("artifacts", "reproduction_recipe_present"),
                "no certificate without a reproduction recipe")

    # ---- Section 5: scope_honesty (method step 5 + red lines) ----
    _bool_check(results, "scope_honesty", "exclusions_written", manifest,
                ("scope", "exclusions_written"),
                "what is outside scope is listed — dependencies, "
                "hardware, misconfiguration, side channels")
    _bool_check(results, "scope_honesty", "claims_versioned", manifest,
                ("scope", "claims_versioned"),
                "every claim is versioned")
    _bool_check(results, "scope_honesty",
                "reverification_triggers_defined", manifest,
                ("scope", "reverification_triggers_defined"),
                "re-verification triggers are defined — re-verify "
                "on change")
    _bool_check(results, "scope_honesty",
                "verified_at_current_version", manifest,
                ("scope", "verified_at_current_version"),
                "never certify an artifact that has not been "
                "verified at its current version")

    # ---- Section 6: ci_integration (method step 6) ----
    _bool_check(results, "ci_integration",
                "verification_runs_in_pipeline", manifest,
                ("ci", "verification_in_pipeline"),
                "verification runs in the pipeline")
    _bool_check(results, "ci_integration",
                "broken_proof_fails_build", manifest,
                ("ci", "broken_proof_fails_build"),
                "a broken proof fails the build like a broken test")

    # ---- Section 7: adversarial_and_certification (method steps
    #      4 + 7, quality gates) ----
    _bool_check(results, "adversarial_and_certification",
                "independent_adversarial_review_done", manifest,
                ("review", "independent_review_done"),
                "an independent adversarial pass tries to falsify "
                "the claim — only unfalsified claims are certified")
    found, has_found = _get(manifest, "review", "counterexample_found")
    disclosed, has_disclosed = _get(manifest, "review",
                                    "counterexample_disclosed")
    if has_found and found:
        _check(results, "adversarial_and_certification",
               "counterexample_disclosed_when_found",
               disclosed, has_disclosed, disclosed is True,
               "a counterexample found in adversarial review is "
               "disclosed, never suppressed")
    else:
        _check(results, "adversarial_and_certification",
               "counterexample_disclosed_when_found",
               found, has_found, True,
               "no counterexample found in adversarial review")
    _bool_check(results, "adversarial_and_certification",
                "signed_attestation_binds_claim_artifact_and_commit",
                manifest,
                ("certificate",
                 "signed_attestation_binds_claim_artifact_commit"),
                "a signed attestation binds claim to artifact to "
                "source commit (hash and signature)")
    _bool_check(results, "adversarial_and_certification",
                "certificate_independently_reproducible", manifest,
                ("certificate", "independently_reproducible"),
                "certificates are signed, versioned, and "
                "independently reproducible")

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
        verdict = "NOT_CERTIFIED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CERTIFIED"

    return {
        "service": "correctness-verification-certificate",
        "atom_version": "0.1.0",
        "component": manifest.get("component"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "CORRECTNESS VERIFICATION CERTIFICATE",
        f"component: {verdict.get('component')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: correctness_verification_certificate.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CERTIFIED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
