#!/usr/bin/env python3
"""Lean4 formal proof — deterministic core.

Built from the bound skill `lean4-proving` (v1): for the invariants
that must never break, prove it or don't claim it. This atom does
not prove theorems — proving is generative work. It audits a
*declared* Lean 4 proof artifact: the caller submits a proof
evidence manifest declaring the project setup, the theorem
statements and their independent review, the definitions, the
proof-integrity posture, the per-theorem declarations (sorry
counts, axiom lists, native_decide use, kernel-check status), the
build attestation, and the model-to-code alignment. Every check
reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Verdict (the skill's quality gates — one failure breaks the claim):
- any fail             -> NOT_VERIFIED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> VERIFIED

No model call, no network, no clock dependence, no Lean toolchain:
the same manifest always produces the same verdict. That
determinism is the product.
"""
import json
import sys

SECTIONS = (
    "project_setup",
    "statement_integrity",
    "definitions_and_model",
    "proof_integrity",
    "theorem_declarations",
    "build_attestation",
    "model_alignment",
)

# The axioms every Lean 4 kernel-checked proof may rely on. Any
# axiom outside this set is an extra assumption the proof smuggled
# in — the skill tracks new axioms as cheating, never smuggled.
STANDARD_AXIOMS = frozenset({"propext", "Classical.choice", "Quot.sound"})

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "project": "string",
    "setup": {
        "toolchain_pinned": "boolean",
        "versions_pinned": "boolean",
        "ci_runs_lake_build": "boolean",
        "lake_build_green": "boolean",
    },
    "statements": {
        "stated_before_proving": "boolean",
        "meaning_checked_before_proving": "boolean",
        "reviewed_independently_of_tactics": "boolean",
        "weakened_silently": "boolean",
        "unproven_claims_presented_as_verified": "boolean",
    },
    "definitions": {
        "total": "boolean",
        "executable": "boolean",
        "specs_separate_from_implementation": "boolean",
    },
    "proof": {
        "structured_and_readable": "boolean",
        "cheating_items_tracked_as_tickets": "boolean",
        "cheating_smuggled_into_deliverable": "boolean",
    },
    "theorems": [{
        "name": "string",
        "sorry_count": "number",
        "axioms": ["string"],
        "native_decide_used": "boolean",
        "kernel_checked": "boolean",
    }],
    "attestation": {
        "build_log_retained": "boolean",
        "axiom_audit_performed": "boolean",
        "reproduction_recipe_present": "boolean",
    },
    "alignment": {
        "mapping_documented": "boolean",
        "changes_ported_through_model": "boolean",
        "model_and_implementation_in_sync": "boolean",
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


def _is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)


def _wellformed(entry):
    if not isinstance(entry, dict):
        return False
    name = entry.get("name")
    if not isinstance(name, str) or len(name) == 0:
        return False
    if not _is_int(entry.get("sorry_count")) or entry["sorry_count"] < 0:
        return False
    axioms = entry.get("axioms")
    if not isinstance(axioms, list):
        return False
    if any(not isinstance(a, str) for a in axioms):
        return False
    if not isinstance(entry.get("native_decide_used"), bool):
        return False
    if not isinstance(entry.get("kernel_checked"), bool):
        return False
    return True


def _theorem_checks(results, manifest):
    """Computed checks over the declared theorems[] list.

    Returns (theorems_evaluated, theorems_with_sorry)."""
    theorems, present = _get(manifest, "theorems")
    if not present or not isinstance(theorems, list) or len(theorems) == 0:
        for name, evidence in (
            ("theorems_present_and_wellformed",
             "each delivered theorem is declared with its name, "
             "sorry count, axiom list, native_decide use and "
             "kernel-check status"),
            ("no_sorry_in_declared_theorems",
             "zero sorry/admit in delivered theorems — a landmark "
             "proof ships with zero sorry"),
            ("no_extra_axioms_in_declared_theorems",
             "no axioms beyond the standard kernel axioms "
             "(propext, Classical.choice, Quot.sound) — new axioms "
             "are tracked as cheating, never smuggled"),
            ("no_native_decide_in_declared_theorems",
             "no native_decide shortcuts in delivered theorems"),
            ("all_declared_theorems_kernel_checked",
             "every delivered theorem is kernel-checked — the "
             "statement you can trust is the one the kernel accepted"),
        ):
            _check(results, "theorem_declarations", name, theorems,
                   False, False, evidence)
        return 0, 0

    wellformed = all(_wellformed(e) for e in theorems)
    _check(results, "theorem_declarations",
           "theorems_present_and_wellformed", theorems, True, wellformed,
           "each delivered theorem is declared with its name, "
           "sorry count, axiom list, native_decide use and "
           "kernel-check status")

    def _sorry_ok(entry):
        return (isinstance(entry, dict)
                and _is_int(entry.get("sorry_count"))
                and entry["sorry_count"] == 0)

    _check(results, "theorem_declarations",
           "no_sorry_in_declared_theorems", theorems, True,
           all(_sorry_ok(e) for e in theorems),
           "zero sorry/admit in delivered theorems — a landmark "
           "proof ships with zero sorry")

    def _axioms_ok(entry):
        if not isinstance(entry, dict):
            return False
        axioms = entry.get("axioms")
        return (isinstance(axioms, list)
                and all(isinstance(a, str) for a in axioms)
                and all(a in STANDARD_AXIOMS for a in axioms))

    _check(results, "theorem_declarations",
           "no_extra_axioms_in_declared_theorems", theorems, True,
           all(_axioms_ok(e) for e in theorems),
           "no axioms beyond the standard kernel axioms "
           "(propext, Classical.choice, Quot.sound) — new axioms "
           "are tracked as cheating, never smuggled")

    def _native_ok(entry):
        return (isinstance(entry, dict)
                and entry.get("native_decide_used") is False)

    _check(results, "theorem_declarations",
           "no_native_decide_in_declared_theorems", theorems, True,
           all(_native_ok(e) for e in theorems),
           "no native_decide shortcuts in delivered theorems")

    def _kernel_ok(entry):
        return (isinstance(entry, dict)
                and entry.get("kernel_checked") is True)

    _check(results, "theorem_declarations",
           "all_declared_theorems_kernel_checked", theorems, True,
           all(_kernel_ok(e) for e in theorems),
           "every delivered theorem is kernel-checked — the "
           "statement you can trust is the one the kernel accepted")

    with_sorry = sum(
        1 for e in theorems
        if isinstance(e, dict) and _is_int(e.get("sorry_count"))
        and e["sorry_count"] > 0
    )
    return len(theorems), with_sorry


def evaluate(manifest):
    """Return the verdict dict for a Lean 4 proof evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: project_setup (method step 1) ----
    _bool_check(results, "project_setup", "toolchain_pinned", manifest,
                ("setup", "toolchain_pinned"),
                "elan toolchain pinned — the proof is checked by a "
                "known toolchain, not whatever is installed")
    _bool_check(results, "project_setup", "dependency_versions_pinned",
                manifest, ("setup", "versions_pinned"),
                "lake / Mathlib versions pinned — the proof's "
                "dependencies do not drift")
    _bool_check(results, "project_setup", "ci_runs_lake_build", manifest,
                ("setup", "ci_runs_lake_build"),
                "CI runs lake build so proofs stay green")
    _bool_check(results, "project_setup", "lake_build_green", manifest,
                ("setup", "lake_build_green"),
                "lake build is green — the proofs compile")

    # ---- Section 2: statement_integrity (method steps 2 + 6,
    #      red lines) ----
    _bool_check(results, "statement_integrity",
                "statement_stated_before_proving", manifest,
                ("statements", "stated_before_proving"),
                "the theorem is stated first — theorem name (args) "
                ": Prop — before any proving begins")
    _bool_check(results, "statement_integrity",
                "statement_meaning_checked", manifest,
                ("statements", "meaning_checked_before_proving"),
                "the statement is checked to say what it means "
                "before proving it")
    _bool_check(results, "statement_integrity",
                "statement_reviewed_independently_of_tactics", manifest,
                ("statements", "reviewed_independently_of_tactics"),
                "statements are reviewed independently of tactics "
                "by a second pair of eyes — a proof of the wrong "
                "theorem is worthless")
    _false_check(results, "statement_integrity",
                 "statement_not_weakened_silently", manifest,
                 ("statements", "weakened_silently"),
                 "never weaken a statement silently to make it "
                 "provable")
    _false_check(results, "statement_integrity",
                 "unproven_claims_not_presented_as_verified", manifest,
                 ("statements", "unproven_claims_presented_as_verified"),
                 "no unproven claims dressed as formally verified")

    # ---- Section 3: definitions_and_model (method step 3) ----
    _bool_check(results, "definitions_and_model",
                "definitions_are_total", manifest,
                ("definitions", "total"),
                "definitions of the system model are total — no "
                "partial definitions hiding the hard cases")
    _bool_check(results, "definitions_and_model",
                "definitions_are_executable", manifest,
                ("definitions", "executable"),
                "definitions of the system model are executable")
    _bool_check(results, "definitions_and_model",
                "specs_separate_from_implementation", manifest,
                ("definitions", "specs_separate_from_implementation"),
                "specs are separate from implementation")

    # ---- Section 4: proof_integrity (method steps 4 + 5) ----
    _bool_check(results, "proof_integrity",
                "proofs_structured_and_readable", manifest,
                ("proof", "structured_and_readable"),
                "structured proofs, kept readable — proofs are code "
                "and docs")
    _bool_check(results, "proof_integrity",
                "cheating_items_tracked_as_tickets", manifest,
                ("proof", "cheating_items_tracked_as_tickets"),
                "sorry, new axioms and native_decide shortcuts are "
                "tracked as tickets, never smuggled into deliverables")
    _false_check(results, "proof_integrity",
                 "cheating_not_smuggled_into_deliverable", manifest,
                 ("proof", "cheating_smuggled_into_deliverable"),
                 "no cheating smuggled into the deliverable")

    # ---- Section 5: theorem_declarations (quality gates, computed
    #      over the declared theorems[] list) ----
    theorems_evaluated, theorems_with_sorry = _theorem_checks(
        results, manifest)

    # ---- Section 6: build_attestation (quality gate + method
    #      step 1) ----
    _bool_check(results, "build_attestation", "build_log_retained",
                manifest, ("attestation", "build_log_retained"),
                "the lake build output is retained as the "
                "kernel-check attestation")
    _bool_check(results, "build_attestation", "axiom_audit_performed",
                manifest, ("attestation", "axiom_audit_performed"),
                "an axiom audit (#print axioms) is performed for "
                "each delivered theorem")
    _bool_check(results, "build_attestation",
                "reproduction_recipe_present", manifest,
                ("attestation", "reproduction_recipe_present"),
                "a clean-checkout rebuild recipe is present — the "
                "proof re-checks from scratch")

    # ---- Section 7: model_alignment (method step 7) ----
    _bool_check(results, "model_alignment",
                "model_implementation_mapping_documented", manifest,
                ("alignment", "mapping_documented"),
                "the model-to-implementation mapping is documented")
    _bool_check(results, "model_alignment",
                "implementation_changes_ported_through_model", manifest,
                ("alignment", "changes_ported_through_model"),
                "port changes go back through the model")
    _bool_check(results, "model_alignment",
                "model_and_implementation_in_sync", manifest,
                ("alignment", "model_and_implementation_in_sync"),
                "the verified model and the implementation are in "
                "sync")

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
        verdict = "NOT_VERIFIED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "VERIFIED"

    return {
        "service": "lean4-formal-proof",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
        "theorems_evaluated": theorems_evaluated,
        "theorems_with_sorry": theorems_with_sorry,
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "LEAN4 FORMAL PROOF",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<24} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: lean4_formal_proof.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "VERIFIED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
