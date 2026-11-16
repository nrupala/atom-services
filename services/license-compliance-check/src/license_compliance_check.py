#!/usr/bin/env python3
"""License compliance check — deterministic core.

Built from the bound skill `legal-licensing` (v1): "Get licensing
right — license choice, NOTICE/attribution, dependency compatibility,
contributor terms."

The caller submits ONE licence-evidence manifest (a dict, or JSON on
the CLI) describing a distribution's declared licence posture: its
components with their licences and use requirements, its distribution
model, and its declared posture evidence. Every check reads declared
manifest fields only:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Licence classes are only the ones the skill names: permissive
(MIT/Apache-2.0) and copyleft (AGPL/GPL). No rule is encoded that the
skill does not state or that does not follow mechanically from those
classes. This is a compliance CHECK over declared evidence, not legal
advice — counsel decides contested calls (skill red line).

Verdict:
- any fail             -> NON_COMPLIANT
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> COMPLIANT

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "license_files",
    "dependency_compatibility",
    "contributor_terms",
    "claims_and_contracts",
)

BINARY_MODELS = ("proprietary_binary", "binary_distribution", "open_binary")

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "product": "string",
    "distribution_model": "string",
    "license_file": {
        "present": "boolean",
        "texts_unmodified": "boolean",
    },
    "notice_file": {"present": "boolean"},
    "source_headers": {"present": "boolean"},
    "components": [{
        "name": "string",
        "license": "string",
        "requires_attribution": "boolean",
        "requires_bundled_license": "boolean",
    }],
    "dependency_scan": {
        "completed": "boolean",
        "clean": "boolean",
        "accepted_with_record": "boolean",
        "incompatible_shipped": "boolean",
    },
    "attribution": {"shipped": "boolean"},
    "bundled_licenses": {"shipped": "boolean"},
    "contributor_terms": {
        "policy": "string",
        "documented_in_contributing": "boolean",
        "enforced": "boolean",
    },
    "project_license": "string",
    "license_decision": {"logged": "boolean"},
    "trademark": {
        "usage_rules_documented": "boolean",
        "implied_endorsement": "boolean",
    },
    "public_claims": {
        "claims_made": ["string"],
        "attestation_present": "boolean",
    },
    "client_work": {
        "is_client_work": "boolean",
        "contract_constraints_reviewed": "boolean",
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


def _is_copyleft(licence):
    """Copyleft class as named by the skill: AGPL/GPL licences."""
    if not isinstance(licence, str):
        return False
    normalized = licence.strip().upper()
    return normalized.startswith("AGPL") or normalized.startswith("GPL")


def _components(manifest):
    components, has = _get(manifest, "components")
    if has and isinstance(components, list):
        return components
    return []


def evaluate(manifest):
    """Return the check dict for a licence-evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []
    components = _components(manifest)

    # ---- Section 1: license_files (LICENSE/NOTICE, verbatim texts) ----
    lic_present, has_lic = _get(manifest, "license_file", "present")
    _check(results, "license_files", "root_license_present", lic_present,
           has_lic, lic_present is True,
           "quality gate: root LICENSE present")

    notice, has_notice = _get(manifest, "notice_file", "present")
    _check(results, "license_files", "notice_file_present", notice,
           has_notice, notice is True,
           "quality gate: root LICENSE + NOTICE present")

    unmodified, has_unmod = _get(manifest, "license_file", "texts_unmodified")
    _check(results, "license_files", "license_texts_unmodified", unmodified,
           has_unmod, unmodified is True,
           "skill red line: license texts kept verbatim, never edited")

    headers, has_headers = _get(manifest, "source_headers", "present")
    _check(results, "license_files", "source_headers_present", headers,
           has_headers, headers is True,
           "source headers per house convention")

    # ---- Section 2: dependency_compatibility (scan + fit) ----
    comps, has_comps = _get(manifest, "components")
    _check(results, "dependency_compatibility",
           "components_inventory_declared", comps, has_comps,
           isinstance(comps, list) and len(comps) > 0,
           f"components={comps!r}")

    scan_done, has_scan = _get(manifest, "dependency_scan", "completed")
    _check(results, "dependency_compatibility", "dependency_scan_completed",
           scan_done, has_scan, scan_done is True,
           "automated license scan of dependencies")

    clean, has_clean = _get(manifest, "dependency_scan", "clean")
    accepted, _has_acc = _get(manifest, "dependency_scan",
                              "accepted_with_record")
    _check(results, "dependency_compatibility",
           "scan_clean_or_accepted_with_record", clean, has_clean,
           clean is True or accepted is True,
           "quality gate: scan clean or consciously accepted with a record")

    model, has_model = _get(manifest, "distribution_model")
    offenders = [
        c.get("name") for c in components
        if isinstance(c, dict) and _is_copyleft(c.get("license"))
    ]
    _check(results, "dependency_compatibility",
           "no_copyleft_in_proprietary_binary", model,
           has_comps and has_model,
           not (model == "proprietary_binary" and len(offenders) > 0),
           f"copyleft_components={offenders!r} distribution_model={model!r} "
           "(skill: incompatible combinations resolved before release)")

    incompat, has_incompat = _get(manifest, "dependency_scan",
                                  "incompatible_shipped")
    _check(results, "dependency_compatibility",
           "no_incompatible_dependency_shipped", incompat, has_incompat,
           incompat is False,
           "skill red line: no incompatible dependency shipped 'for now'")

    requires_attr = any(
        isinstance(c, dict) and c.get("requires_attribution") is True
        for c in components
    )
    shipped, has_shipped = _get(manifest, "attribution", "shipped")
    if requires_attr:
        _check(results, "dependency_compatibility",
               "attribution_shipped_where_required", shipped, has_shipped,
               shipped is True,
               "a component requires attribution; attribution must ship")
    else:
        _check(results, "dependency_compatibility",
               "attribution_shipped_where_required", comps, has_comps, True,
               "no component declares an attribution requirement")

    requires_bundled = any(
        isinstance(c, dict) and c.get("requires_bundled_license") is True
        for c in components
    )
    bundled, has_bundled = _get(manifest, "bundled_licenses", "shipped")
    if model in BINARY_MODELS and requires_bundled:
        _check(results, "dependency_compatibility",
               "bundled_licenses_shipped_where_required", bundled,
               has_bundled, bundled is True,
               "release hygiene: bundled third-party licenses shipped "
               "with binaries where required")
    else:
        _check(results, "dependency_compatibility",
               "bundled_licenses_shipped_where_required", model,
               has_model and has_comps, True,
               "no bundled-licence requirement triggered")

    # ---- Section 3: contributor_terms (DCO or CLA, documented, enforced) ----
    policy, has_policy = _get(manifest, "contributor_terms", "policy")
    _check(results, "contributor_terms", "contributor_policy_chosen",
           policy, has_policy, policy in ("DCO", "CLA"),
           f"policy={policy!r} (skill: pick a policy — DCO sign-off or CLA)")

    documented, has_doc = _get(manifest, "contributor_terms",
                               "documented_in_contributing")
    _check(results, "contributor_terms", "contributor_policy_documented",
           documented, has_doc, documented is True,
           "contributor policy documented in CONTRIBUTING")

    enforced, has_enf = _get(manifest, "contributor_terms", "enforced")
    _check(results, "contributor_terms", "contributor_policy_enforced",
           enforced, has_enf, enforced is True,
           "contributor policy enforced in the contribution flow")

    # ---- Section 4: claims_and_contracts ----
    project_licence, has_pl = _get(manifest, "project_license")
    logged, has_logged = _get(manifest, "license_decision", "logged")
    if _is_copyleft(project_licence):
        _check(results, "claims_and_contracts",
               "copyleft_choice_logged_as_decision", logged, has_logged,
               logged is True,
               "skill: copyleft only as a conscious product decision, "
               "logged like an ADR")
    else:
        _check(results, "claims_and_contracts",
               "copyleft_choice_logged_as_decision", project_licence,
               has_pl, True,
               "project licence is not copyleft; no decision log required "
               "by this check")

    tm_rules, has_tm = _get(manifest, "trademark", "usage_rules_documented")
    _check(results, "claims_and_contracts",
           "trademark_usage_rules_documented", tm_rules, has_tm,
           tm_rules is True, "name/logo usage rules documented")

    endorsement, has_end = _get(manifest, "trademark", "implied_endorsement")
    _check(results, "claims_and_contracts", "no_implied_endorsement",
           endorsement, has_end, endorsement is False,
           "no implied endorsement")

    claims, has_claims = _get(manifest, "public_claims", "claims_made")
    attestation, has_att = _get(manifest, "public_claims",
                                "attestation_present")
    if isinstance(claims, list) and len(claims) > 0:
        _check(results, "claims_and_contracts",
               "public_claims_have_attestation", attestation, has_att,
               attestation is True,
               "public claims only with real attestation behind them")
    else:
        _check(results, "claims_and_contracts",
               "public_claims_have_attestation", claims, has_claims, True,
               "no public claims declared")

    is_client, has_client = _get(manifest, "client_work", "is_client_work")
    reviewed, has_reviewed = _get(manifest, "client_work",
                                  "contract_constraints_reviewed")
    if is_client is True:
        _check(results, "claims_and_contracts",
               "client_contract_constraints_reviewed", reviewed,
               has_reviewed, reviewed is True,
               "client work: SOW/MSA constraints on IP and reuse reviewed; "
               "conflicts flagged for counsel")
    else:
        _check(results, "claims_and_contracts",
               "client_contract_constraints_reviewed", is_client,
               has_client, True, "not declared as client work")

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
        verdict = "NON_COMPLIANT"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "COMPLIANT"

    return {
        "service": "license-compliance-check",
        "atom_version": "0.1.0",
        "product": manifest.get("product"),
        "distribution_model": manifest.get("distribution_model"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
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
        "LICENSE-COMPLIANCE CHECK",
        f"product: {verdict.get('product')}  "
        f"distribution_model: {verdict.get('distribution_model')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<26} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    lines.append(
        "Not legal advice — counsel decides contested calls (skill red line)."
    )
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: license_compliance_check.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "COMPLIANT" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
