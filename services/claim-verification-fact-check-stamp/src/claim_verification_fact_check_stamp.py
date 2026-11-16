#!/usr/bin/env python3
"""Claim verification fact-check stamp — deterministic core.

Built from the bound skill `verification-and-fact-checking` (v1):
"nothing checkable ships unverified; everything verified ships
labeled. Verification is a pipeline, not a vibe — claim in, evidence
out, with an audit trail."

The caller submits a claim-verification manifest (a dict, or JSON on
the CLI): the declared claims, each with its label, its source record
and its re-check record, plus the publication process record. The
per-claim checks are arithmetic/set rules over the declared rows:

- material claims are triangulated: >= 2 independent sources, or one
  primary source plus confirmation (>= 1 independent source);
- claims carrying numbers have their math re-derived;
- every label is in the skill's vocabulary (verified / likely /
  contested / unverified) and the language is the weakest the
  evidence supports;
- every claim's sources are recorded with metadata and archived.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Verdict:
- any fail             -> NOT_STAMPED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> STAMPED

No model call, no network, no clock dependence: the same manifest
always produces the same stamp. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "extraction",
    "source_ladder",
    "triangulation",
    "compute_rechecks",
    "uncertainty_language",
    "publication_and_corrections",
)

LABELS = ("verified", "likely", "contested", "unverified")


# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "document": "string",
    "process": {
        "claims_extracted": "boolean",
        "units_and_dates_checked": "boolean",
        "counter_case_considered": "boolean",
        "evidence_published_inline": "boolean",
        "methodology_visible_for_big_claims": "boolean",
        "corrections_policy_published": "boolean",
        "versions_retained": "boolean",
        "silent_edits_made": "boolean",
    },
    "claims": [{
        "id": "string",
        "material": "boolean",
        "label": "string",
        "independent_sources": "number",
        "primary_source": "boolean",
        "sources_archived": "boolean",
        "source_metadata_recorded": "boolean",
        "independence_checked": "boolean",
        "has_numbers": "boolean",
        "math_rechecked": "boolean",
        "language_weakest_supported": "boolean",
    }],
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _claim_name(claim, index):
    cid, has_id = _get(claim, "id")
    if has_id and isinstance(cid, str) and cid:
        return cid
    return f"#{index}"


def _aggregate(results, section, name, claims, has_claims, predicate,
               pass_evidence, fail_prefix, missing_evidence):
    """Run one per-claim predicate and fold it into a single check.

    predicate(claim) returns True (ok), False (violates), or None
    (evidence missing for that claim). Offending claims are named.
    """
    if not has_claims or not isinstance(claims, list) or not claims:
        _check(results, section, name, claims, False, False,
               missing_evidence)
        return
    offenders = []
    incomplete = False
    for i, claim in enumerate(claims):
        if not isinstance(claim, dict):
            incomplete = True
            continue
        outcome = predicate(claim)
        if outcome is None:
            incomplete = True
        elif outcome is False:
            offenders.append(_claim_name(claim, i))
    if incomplete:
        _check(results, section, name, claims, False, False,
               missing_evidence)
    elif offenders:
        _check(results, section, name, claims, True, False,
               f"{fail_prefix}: {', '.join(offenders)}")
    else:
        _check(results, section, name, claims, True, True, pass_evidence)


def _triangulated(claim):
    material, has_material = _get(claim, "material")
    if has_material and material is not True:
        return True  # triangulation binds material claims
    sources, has_sources = _get(claim, "independent_sources")
    primary, has_primary = _get(claim, "primary_source")
    if not (has_material and has_sources and has_primary
            and _is_number(sources)):
        return None
    return sources >= 2 or (primary is True and sources >= 1)


def _math_rechecked(claim):
    has_numbers, has_flag = _get(claim, "has_numbers")
    if has_flag and has_numbers is not True:
        return True  # re-derivation binds claims carrying numbers
    rechecked, has_rechecked = _get(claim, "math_rechecked")
    if not (has_flag and has_rechecked):
        return None
    return rechecked is True


def _label_valid(claim):
    label, has_label = _get(claim, "label")
    if not has_label:
        return None
    return label in LABELS


def _field_true(field):
    def predicate(claim):
        value, present = _get(claim, field)
        if not present:
            return None
        return value is True
    return predicate


def evaluate(manifest):
    """Return the stamp dict for a claim-verification manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []
    claims, has_claims = _get(manifest, "claims")

    # ---- Section 1: extraction (skill method 1) ----
    _bool_check(results, "extraction", "claims_extracted_one_row_per_claim",
                manifest, ("process", "claims_extracted"),
                "isolate every checkable unit — one row per claim")
    if has_claims and isinstance(claims, list) and claims:
        _check(results, "extraction", "claims_declared", claims, True, True,
               "claims declared for verification")
    else:
        _check(results, "extraction", "claims_declared", claims, False,
               False, "no claims declared")

    # ---- Section 2: source_ladder (skill method 2) ----
    _aggregate(results, "source_ladder",
               "source_metadata_recorded_for_every_claim",
               claims, has_claims, _field_true("source_metadata_recorded"),
               "for each source: who, when, method, sample, conflicts "
               "of interest recorded",
               "claims missing source metadata",
               "source metadata not recorded for every claim")
    _aggregate(results, "source_ladder", "source_independence_checked",
               claims, has_claims, _field_true("independence_checked"),
               "independence checked — two sources citing each other "
               "are one source",
               "claims whose source independence was not checked",
               "source independence not checked for every claim")
    _aggregate(results, "source_ladder", "material_claim_sources_archived",
               claims, has_claims,
               lambda c: _field_true("sources_archived")(c)
               if _get(c, "material")[1] and _get(c, "material")[0] is True
               else True,
               "quality gate: every material claim has at least one "
               "archived source",
               "material claims without archived sources",
               "archived-source evidence missing for a material claim")

    # ---- Section 3: triangulation (skill method 3) ----
    _aggregate(results, "triangulation", "material_claims_triangulated",
               claims, has_claims, _triangulated,
               "material claims need >= 2 independent sources, or one "
               "primary source plus confirmation",
               "material claims not triangulated",
               "triangulation evidence missing for a material claim")

    # ---- Section 4: compute_rechecks (skill method 4) ----
    _aggregate(results, "compute_rechecks",
               "numbers_rederived_for_numeric_claims",
               claims, has_claims, _math_rechecked,
               "re-derive math for claims carrying numbers",
               "numeric claims whose math was not re-derived",
               "math re-check evidence missing for a numeric claim")
    _bool_check(results, "compute_rechecks", "units_dates_and_names_checked",
                manifest, ("process", "units_and_dates_checked"),
                "sanity-check units and orders of magnitude; verify "
                "dates and name spellings")

    # ---- Section 5: uncertainty_language (skill methods 3 + 5 +
    #      quality gate) ----
    _aggregate(results, "uncertainty_language", "labels_in_vocabulary",
               claims, has_claims, _label_valid,
               "labels: verified / likely / contested / unverified",
               "claims with labels outside the vocabulary",
               "a claim carries no label")
    _aggregate(results, "uncertainty_language",
               "language_is_weakest_the_evidence_supports",
               claims, has_claims,
               _field_true("language_weakest_supported"),
               "never upgrade 'consistent with' to 'proves'",
               "claims whose language overstates the evidence",
               "language-strength evidence missing for a claim")
    _bool_check(results, "uncertainty_language", "counter_case_considered",
                manifest, ("process", "counter_case_considered"),
                "quality gate: counter-case considered; 'what would "
                "change our mind' noted for contested claims")

    # ---- Section 6: publication_and_corrections (skill methods 6-7 +
    #      red lines) ----
    _bool_check(results, "publication_and_corrections",
                "evidence_published_inline", manifest,
                ("process", "evidence_published_inline"),
                "publish with evidence: inline citations, archived links")
    _bool_check(results, "publication_and_corrections",
                "methodology_visible_for_big_claims", manifest,
                ("process", "methodology_visible_for_big_claims"),
                "visible methodology for big claims")
    _bool_check(results, "publication_and_corrections",
                "corrections_policy_published", manifest,
                ("process", "corrections_policy_published"),
                "quality gate: corrections policy published")
    _bool_check(results, "publication_and_corrections", "versions_retained",
                manifest, ("process", "versions_retained"),
                "quality gate: versions retained")
    silent, has_silent = _get(manifest, "process", "silent_edits_made")
    _check(results, "publication_and_corrections", "no_silent_corrections",
           silent, has_silent, silent is False,
           "skill red line: corrections are never silent — fast, "
           "dated, visible change log")

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
        verdict = "NOT_STAMPED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "STAMPED"

    claims_total = len(claims) if isinstance(claims, list) else 0
    material_claims = 0
    verified_claims = 0
    if isinstance(claims, list):
        for claim in claims:
            if isinstance(claim, dict):
                if claim.get("material") is True:
                    material_claims += 1
                if claim.get("label") == "verified":
                    verified_claims += 1

    return {
        "service": "claim-verification-fact-check-stamp",
        "atom_version": "0.1.0",
        "document": manifest.get("document"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "claims_summary": {
            "claims_total": claims_total,
            "material_claims": material_claims,
            "verified_claims": verified_claims,
        },
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
        "CLAIM-VERIFICATION FACT-CHECK STAMP",
        f"document: {verdict.get('document')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<26} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: claim_verification_fact_check_stamp.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "STAMPED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
