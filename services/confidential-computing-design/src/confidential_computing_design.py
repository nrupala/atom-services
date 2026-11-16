#!/usr/bin/env python3
"""Confidential computing design — deterministic core.

Built from the bound skill `confidential-computing` (v1): "Use
enclaves and TEEs properly — threat models, attestation, sealed
data, honest claims, hybrid designs."

This atom does NOT design a confidential-computing system and
exercises no security judgment. The caller submits a
confidential-computing-design manifest: one DECLARED design
record — its threat model, its technology selection, its
attestation record, its enclave patterns and trusted-codebase
accounting, its engineering discipline, its key-management
record, and its claims record. The atom validates that artifact
deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- threat-model coverage (method step 1): the declared
  protects-against list must cover what the skill names the TEE
  protects against (host access, operator poking, co-tenants),
  and the declared does-not-protect list must cover what the
  skill names it does NOT protect against (side channels,
  supply chain, flawed enclave code, unsealed inputs/outputs);
- trusted-codebase accounting (method step 4, "minimal enclave
  surface area (small trusted codebase)"): every declared
  trusted component must carry a name and a trusted-lines
  count, and the declared total trusted-codebase lines must
  equal the sum of the declared component lines. The skill
  states no maximum trusted-codebase size, so no size is
  judged — only the arithmetic is re-derived;
- public-exclusions coverage (method step 7, "list exclusions
  publicly"): the declared public exclusions list must cover
  the same four exclusions the skill names in step 1.

Computed amounts are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The stated entries a declared
list does not cover are reported as
`threat_protects_not_covered`, `threat_exclusions_not_covered`
and `claims_exclusions_not_listed` (each null when no list is
declared). The computed outcome over the five computed checks
is reported as `computed_status`.

Verdict:
- any fail             -> CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CONFIDENTIAL_COMPUTING_DESIGN_READY

This is a completeness and consistency audit over declared
evidence, not a security review and not an encryption-claim
audit (that is the separate `encryption-claim-audit` atom): an
artifact that declares every step passes even if its underlying
design is weak, and nothing here verifies that a declared value
is true, that an enclave actually attests, or that data in use
is actually protected.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "threat_model",
    "technology_selection",
    "attestation",
    "enclave_patterns",
    "engineering_discipline",
    "key_management",
    "claims_discipline",
)

STATED_PROTECTS_AGAINST = [
    "host_access",
    "operator_access",
    "co_tenant_access",
]

STATED_DOES_NOT_PROTECT_AGAINST = [
    "side_channels",
    "supply_chain",
    "flawed_enclave_code",
    "unsealed_inputs_outputs",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the coverage-list entries and the
# technology name) are validated as strings only, never
# enum-checked: coverage is a verdict check, not a type error.
MANIFEST_SPEC = {
    "entity": "string",
    "threat_model": {
        "documented": "boolean",
        "protects_against": ["string"],
        "does_not_protect_against": ["string"],
        "claims_require_threat_model": "boolean",
    },
    "technology": {
        "name": "string",
        "distinctions_considered": "boolean",
        "chosen_by_workload_shape": "boolean",
        "chosen_by_available_hardware": "boolean",
    },
    "attestation": {
        "verification_implemented": "boolean",
        "verification_tested": "boolean",
        "measurement_verified": "boolean",
        "fresh_nonce_verified": "boolean",
        "verified_before_trusting": "boolean",
    },
    "enclave": {
        "sealed_keys_bound_to_identity_or_measurement": "boolean",
        "attested_tls_used": "boolean",
        "surface_area_minimized": "boolean",
        "trusted_components": [{
            "name": "string",
            "trusted_lines": "number",
        }],
        "declared_trusted_codebase_lines": "number",
        "debug_enabled_in_production": "boolean",
    },
    "engineering": {
        "reproducible_builds": "boolean",
        "signed_enclave_images": "boolean",
        "measurements_versioned_and_pinned": "boolean",
        "real_attestation_in_ci_or_staging": "boolean",
        "fallback_documented": "boolean",
        "silent_downgrade_used": "boolean",
    },
    "keys": {
        "sealed_keys_tested_including_recovery": "boolean",
        "root_keys_stored_unsealed_beside_enclave": "boolean",
        "rotation_designed": "boolean",
        "recovery_designed": "boolean",
        "measurement_changes_invalidating_seals_documented": "boolean",
    },
    "claims": {
        "claims_match_evidence": "boolean",
        "marketing_mechanism_audit_done": "boolean",
        "public_exclusions": ["string"],
        "unverifiable_secure_enclave_claims_made": "boolean",
        "regulatory_compliance_paired_where_required": "boolean",
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


def _coverage_check(results, section, name, manifest, path, stated,
                    evidence):
    """List-coverage computed check. Returns the stated entries
    not covered (None when no list is declared)."""
    entries, has_entries = _get(manifest, *path)
    is_list = has_entries and isinstance(entries, list)
    not_covered = (
        [entry for entry in stated if entry not in entries]
        if is_list else None
    )
    _check(results, section, name, entries, is_list,
           is_list and len(not_covered) == 0, evidence)
    return not_covered


def _trusted_codebase_checks(results, manifest):
    """Computed trusted-codebase checks. Returns
    (components_evaluated, computed_total, total_difference)."""
    components, has_components = _get(manifest, "enclave",
                                      "trusted_components")
    declared_total, has_declared = _get(
        manifest, "enclave", "declared_trusted_codebase_lines")
    if (not has_components or not isinstance(components, list)
            or not components):
        for name, evidence in (
            ("trusted_component_entries_complete",
             "no trusted components declared"),
            ("trusted_codebase_total_matches_component_sum",
             "no trusted components declared"),
        ):
            _check(results, "enclave_patterns", name,
                   components, False, False, evidence)
        return 0, None, None
    incomplete = False
    evaluated = 0
    total = 0
    for entry in components:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        name, has_name = _get(entry, "name")
        lines, has_lines = _get(entry, "trusted_lines")
        if not (has_name and has_lines and _is_nonempty_str(name)
                and _is_number(lines)):
            incomplete = True
            continue
        evaluated += 1
        total += lines
    if incomplete:
        _check(results, "enclave_patterns",
               "trusted_component_entries_complete",
               components, False, False,
               "a trusted component is missing its name or "
               "trusted_lines")
    else:
        _check(results, "enclave_patterns",
               "trusted_component_entries_complete",
               components, True, True,
               "every trusted component carries a name and a "
               "trusted_lines count")
    computed_total = None
    difference = None
    if incomplete:
        _check(results, "enclave_patterns",
               "trusted_codebase_total_matches_component_sum",
               components, False, False,
               "a trusted component is incomplete, so the "
               "trusted-codebase total cannot be re-derived")
    else:
        computed_total = total
        if has_declared and _is_number(declared_total):
            difference = declared_total - total
        consistent = (
            has_declared and _is_number(declared_total)
            and _fmt6(declared_total - total) == "0.000000"
        )
        _check(results, "enclave_patterns",
               "trusted_codebase_total_matches_component_sum",
               declared_total,
               has_declared and _is_number(declared_total),
               consistent,
               "method step 4: the declared total trusted-codebase "
               "lines equal the sum of the declared trusted "
               "components' lines (minimal enclave surface area; "
               "no maximum size is stated by the skill, so no "
               "size is judged here)")
    return evaluated, computed_total, difference


def evaluate(manifest):
    """Return the verdict dict for a confidential-computing-design
    manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: threat_model (skill method step 1: "Threat
    #      model first: write what the TEE protects against (host
    #      access, operator poking, co-tenants) and what it does
    #      NOT (side channels, supply chain, flawed enclave code,
    #      unsealed inputs/outputs). No model -> no claim";
    #      quality gate: "Threat model documented (protects /
    #      doesn't protect)") ----
    _bool_check(results, "threat_model", "threat_model_documented",
                manifest, ("threat_model", "documented"),
                "quality gate: the threat model is documented — "
                "protects / doesn't protect")
    protects_not_covered = _coverage_check(
        results, "threat_model",
        "threat_protects_against_covers_stated",
        manifest, ("threat_model", "protects_against"),
        STATED_PROTECTS_AGAINST,
        "method step 1: the declared protects-against list "
        "covers what the skill names — host access, operator "
        "poking, co-tenants")
    exclusions_not_covered = _coverage_check(
        results, "threat_model",
        "threat_does_not_protect_against_covers_stated",
        manifest, ("threat_model", "does_not_protect_against"),
        STATED_DOES_NOT_PROTECT_AGAINST,
        "method step 1: the declared does-not-protect list "
        "covers what the skill names — side channels, supply "
        "chain, flawed enclave code, unsealed inputs/outputs")
    _bool_check(results, "threat_model", "claims_require_threat_model",
                manifest,
                ("threat_model", "claims_require_threat_model"),
                "method step 1: no model, no claim — claims are "
                "gated on the threat model")

    # ---- Section 2: technology_selection (skill method step 2:
    #      "Know the technologies: VM-level (Intel TDX, AMD
    #      SEV-SNP) vs process-level (SGX) vs ARM CCA/TZ
    #      distinctions; choose by workload shape and available
    #      hardware") ----
    tech_name, has_tech_name = _get(manifest, "technology", "name")
    _check(results, "technology_selection", "technology_named",
           tech_name, has_tech_name, _is_nonempty_str(tech_name),
           "method step 2: the chosen TEE technology is named "
           "(validated as a string only, never enum-checked — "
           "the skill names examples, not a closed list)")
    _bool_check(results, "technology_selection",
                "technology_distinctions_considered",
                manifest, ("technology", "distinctions_considered"),
                "method step 2: the VM-level vs process-level vs "
                "ARM CCA/TZ distinctions are considered")
    _bool_check(results, "technology_selection",
                "technology_chosen_by_workload_shape",
                manifest, ("technology", "chosen_by_workload_shape"),
                "method step 2: the technology is chosen by "
                "workload shape")
    _bool_check(results, "technology_selection",
                "technology_chosen_by_available_hardware",
                manifest,
                ("technology", "chosen_by_available_hardware"),
                "method step 2: the technology is chosen by "
                "available hardware")

    # ---- Section 3: attestation (skill method step 3:
    #      "Attestation is the point: verify quotes (measurement
    #      + nonce, fresh!) before trusting an enclave; a TEE
    #      without verified attestation is a vibe, not a
    #      guarantee"; quality gate: "Attestation verification
    #      implemented + tested (fresh nonce)") ----
    _bool_check(results, "attestation",
                "attestation_verification_implemented",
                manifest, ("attestation", "verification_implemented"),
                "quality gate: attestation verification is "
                "implemented")
    _bool_check(results, "attestation",
                "attestation_verification_tested",
                manifest, ("attestation", "verification_tested"),
                "quality gate: attestation verification is tested")
    _bool_check(results, "attestation", "quote_measurement_verified",
                manifest, ("attestation", "measurement_verified"),
                "method step 3: the quote measurement is verified")
    _bool_check(results, "attestation", "fresh_nonce_verified",
                manifest, ("attestation", "fresh_nonce_verified"),
                "method step 3: the nonce is fresh — quotes are "
                "verified with a fresh nonce")
    _bool_check(results, "attestation",
                "attestation_verified_before_trusting",
                manifest, ("attestation", "verified_before_trusting"),
                "method step 3: quotes are verified before "
                "trusting an enclave")

    # ---- Section 4: enclave_patterns (skill method step 4:
    #      "Enclave patterns: sealed storage (keys bound to
    #      enclave identity/measurement), secure channels
    #      (attested TLS), minimal enclave surface area (small
    #      trusted codebase), debug disabled everywhere in
    #      prod"; red line: "No production debug mode") ----
    _bool_check(results, "enclave_patterns",
                "sealed_keys_bound_to_identity_or_measurement",
                manifest,
                ("enclave",
                 "sealed_keys_bound_to_identity_or_measurement"),
                "method step 4: sealed storage — keys are bound "
                "to enclave identity/measurement")
    _bool_check(results, "enclave_patterns",
                "attested_tls_secure_channels",
                manifest, ("enclave", "attested_tls_used"),
                "method step 4: secure channels use attested TLS")
    _bool_check(results, "enclave_patterns",
                "enclave_surface_area_minimized",
                manifest, ("enclave", "surface_area_minimized"),
                "method step 4: the enclave surface area is "
                "minimal — a small trusted codebase")
    components_evaluated, computed_total, total_difference = \
        _trusted_codebase_checks(results, manifest)
    _false_check(results, "enclave_patterns",
                 "production_debug_disabled",
                 manifest, ("enclave", "debug_enabled_in_production"),
                 "red line: no production debug mode — debug is "
                 "disabled everywhere in prod")

    # ---- Section 5: engineering_discipline (skill method step 5:
    #      "Engineering discipline: reproducible builds + signed
    #      enclave images; version and pin measurements;
    #      simulator in dev, real attestation in CI/staging where
    #      possible; documented fallback if hardware is absent
    #      (explicit downgrade, never silent)") ----
    _bool_check(results, "engineering_discipline",
                "reproducible_builds",
                manifest, ("engineering", "reproducible_builds"),
                "method step 5: enclave builds are reproducible")
    _bool_check(results, "engineering_discipline",
                "enclave_images_signed",
                manifest, ("engineering", "signed_enclave_images"),
                "method step 5: enclave images are signed")
    _bool_check(results, "engineering_discipline",
                "measurements_versioned_and_pinned",
                manifest,
                ("engineering", "measurements_versioned_and_pinned"),
                "method step 5: measurements are versioned and "
                "pinned")
    _bool_check(results, "engineering_discipline",
                "real_attestation_in_ci_or_staging",
                manifest,
                ("engineering", "real_attestation_in_ci_or_staging"),
                "method step 5: real attestation is exercised in "
                "CI/staging where possible (a simulator is used "
                "in dev)")
    _bool_check(results, "engineering_discipline",
                "hardware_absent_fallback_documented",
                manifest, ("engineering", "fallback_documented"),
                "method step 5: the fallback if hardware is "
                "absent is documented")
    _false_check(results, "engineering_discipline",
                 "fallback_never_silent_downgrade",
                 manifest, ("engineering", "silent_downgrade_used"),
                 "method step 5: a hardware-absent downgrade is "
                 "explicit, never silent")

    # ---- Section 6: key_management (skill method step 6: "Key
    #      management: root keys never stored unsealed beside the
    #      enclave; rotation and recovery designed (don't brick
    #      user data if enclave dies); document measurement
    #      changes that invalidate seals"; quality gate: "Sealed
    #      keys tested incl. recovery path"; red line: "root
    #      keys never kept unsealed") ----
    _bool_check(results, "key_management",
                "sealed_keys_tested_including_recovery",
                manifest,
                ("keys", "sealed_keys_tested_including_recovery"),
                "quality gate: sealed keys are tested, including "
                "the recovery path")
    _false_check(results, "key_management",
                 "root_keys_never_stored_unsealed",
                 manifest,
                 ("keys", "root_keys_stored_unsealed_beside_enclave"),
                 "red line: root keys are never stored unsealed "
                 "beside the enclave")
    _bool_check(results, "key_management", "key_rotation_designed",
                manifest, ("keys", "rotation_designed"),
                "method step 6: key rotation is designed")
    _bool_check(results, "key_management", "key_recovery_designed",
                manifest, ("keys", "recovery_designed"),
                "method step 6: key recovery is designed — user "
                "data is not bricked if the enclave dies")
    _bool_check(results, "key_management",
                "measurement_changes_invalidating_seals_documented",
                manifest,
                ("keys",
                 "measurement_changes_invalidating_seals_documented"),
                "method step 6: measurement changes that "
                "invalidate seals are documented")

    # ---- Section 7: claims_discipline (skill method step 7:
    #      "Claims discipline: marketing <-> mechanism audit;
    #      list exclusions publicly ('what the enclave doesn't
    #      cover'); pair with regulatory-compliance where
    #      required"; quality gate: "Claims match evidence;
    #      exclusions listed"; red line: "no unverifiable
    #      'secure enclave' claims") ----
    _bool_check(results, "claims_discipline",
                "claims_match_evidence",
                manifest, ("claims", "claims_match_evidence"),
                "quality gate: claims match evidence")
    _bool_check(results, "claims_discipline",
                "marketing_mechanism_audit_done",
                manifest,
                ("claims", "marketing_mechanism_audit_done"),
                "method step 7: a marketing-to-mechanism audit "
                "is done")
    claims_not_listed = _coverage_check(
        results, "claims_discipline",
        "public_exclusions_cover_stated_exclusions",
        manifest, ("claims", "public_exclusions"),
        STATED_DOES_NOT_PROTECT_AGAINST,
        "method step 7: the publicly listed exclusions cover "
        "what the enclave doesn't cover — side channels, supply "
        "chain, flawed enclave code, unsealed inputs/outputs")
    _false_check(results, "claims_discipline",
                 "no_unverifiable_secure_enclave_claims",
                 manifest,
                 ("claims", "unverifiable_secure_enclave_claims_made"),
                 "red line: no unverifiable 'secure enclave' "
                 "claims are made")
    _bool_check(results, "claims_discipline",
                "regulatory_compliance_paired_where_required",
                manifest,
                ("claims",
                 "regulatory_compliance_paired_where_required"),
                "method step 7: regulatory compliance is paired "
                "where required")

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
        verdict = "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CONFIDENTIAL_COMPUTING_DESIGN_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "threat_protects_against_covers_stated",
            "threat_does_not_protect_against_covers_stated",
            "trusted_component_entries_complete",
            "trusted_codebase_total_matches_component_sum",
            "public_exclusions_cover_stated_exclusions")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "confidential-computing-design",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "components_evaluated": components_evaluated,
        "computed_trusted_codebase_lines": _fmt6(computed_total),
        "trusted_codebase_difference": _fmt6(total_difference),
        "threat_protects_not_covered": protects_not_covered,
        "threat_exclusions_not_covered": exclusions_not_covered,
        "claims_exclusions_not_listed": claims_not_listed,
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
        "CONFIDENTIAL COMPUTING DESIGN",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: confidential_computing_design.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == \
        "CONFIDENTIAL_COMPUTING_DESIGN_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
