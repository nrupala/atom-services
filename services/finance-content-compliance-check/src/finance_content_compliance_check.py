#!/usr/bin/env python3
"""Finance content compliance check — deterministic core.

Built from the bound skill `financial-education-content` (v1):
"Publish finance education safely — education versus advice
boundaries, dated figures, disclosures."

The caller submits a finance-content evidence manifest (a dict, or
JSON on the CLI): the piece's declared advice-boundary posture, its
figures (each with its as-of date, source, primary-source flag and
re-derivation flag), its risk framing, any calculator/tool evidence,
its commercial-honesty record, and its compliance/corrections record.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Two checks are computed, not declared: every declared figure is
checked for completeness (label, as-of date, source), and every
complete figure is checked for a primary source and a re-derived
number, exactly as the skill's accuracy discipline requires ("re-derive
every number; date all rates/limits; link primary sources"). No
figure, rate or threshold is invented here — the atom checks the
caller's declared evidence only. This is a compliance CHECK over
declared evidence, not a judgement on the prose itself and not
financial or legal advice.

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
    "advice_boundary",
    "accuracy_and_sourcing",
    "risk_framing",
    "calculators_and_tools",
    "commercial_honesty",
    "compliance_and_corrections",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "content": "string",
    "jurisdiction": "string",
    "advice_boundary": {
        "teaches_frameworks_not_recommendations": "boolean",
        "personalized_recommendations_present": "boolean",
        "education_not_advice_disclaimer_present": "boolean",
        "checklist_passed": "boolean",
        "advice_like_content_present": "boolean",
        "advice_like_flagged_for_review": "boolean",
    },
    "figures": [{
        "label": "string",
        "as_of": "string",
        "source": "string",
        "source_is_primary": "boolean",
        "rederived": "boolean",
    }],
    "accuracy": {
        "primary_sources_linked": "boolean",
        "rates_and_limits_dated": "boolean",
        "recheck_cadence_set": "boolean",
    },
    "risk": {
        "risk_before_upside": "boolean",
        "uses_past_performance": "boolean",
        "past_performance_caveat_present": "boolean",
        "fees_visible": "boolean",
        "taxes_visible": "boolean",
        "return_promises_present": "boolean",
        "forecasts_presented_as_fact": "boolean",
        "survivorship_examples_used": "boolean",
    },
    "calculators": {
        "includes_calculator": "boolean",
        "spec_with_formulas_present": "boolean",
        "boundary_cases_tested": "boolean",
        "assumptions_visible_in_ui": "boolean",
        "dark_patterns_present": "boolean",
    },
    "commercial": {
        "has_sponsored_or_affiliate_content": "boolean",
        "sponsored_affiliate_hard_labeled": "boolean",
        "conflicts_disclosed": "boolean",
        "editorial_separated_from_sales": "boolean",
        "recommendations_for_undisclosed_compensation": "boolean",
        "fear_based_selling_present": "boolean",
    },
    "compliance": {
        "jurisdiction_notes_file_kept": "boolean",
        "tools_collect_user_data": "boolean",
        "privacy_rules_applied": "boolean",
        "user_data_leaves_device_without_consent": "boolean",
    },
    "corrections": {
        "correction_log_maintained": "boolean",
        "corrections_made": "boolean",
        "correction_note_visible_and_dated": "boolean",
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


def _is_nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _gated_bool_check(results, section, name, manifest, gate_path,
                      path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    value, present = _get(manifest, *path)
    if has_gate and gate:
        _check(results, section, name, value, present, value is True,
               evidence)
    else:
        _check(results, section, name, gate, has_gate, True, na_evidence)


def _gated_false_check(results, section, name, manifest, gate_path,
                       path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    value, present = _get(manifest, *path)
    if has_gate and gate:
        _check(results, section, name, value, present, value is False,
               evidence)
    else:
        _check(results, section, name, gate, has_gate, True, na_evidence)


def _figures_checks(results, manifest):
    """Computed checks over the declared figures.

    Returns (figures_evaluated, figures_incomplete): counts of figures
    complete enough to classify, and of figures missing a required
    field (label, as-of date, source, primary-source flag, or
    re-derivation flag).
    """
    figures, has_figures = _get(manifest, "figures")
    if not has_figures or not isinstance(figures, list) or not figures:
        _check(results, "accuracy_and_sourcing",
               "figures_complete_and_dated",
               figures, False, False, "no figures declared")
        _check(results, "accuracy_and_sourcing",
               "figures_primary_sourced_and_rederived",
               figures, False, False, "no figures declared")
        return 0, 0
    incomplete = 0
    evaluated = 0
    not_primary_or_rederived = False
    for figure in figures:
        if not isinstance(figure, dict):
            incomplete += 1
            continue
        label, has_label = _get(figure, "label")
        as_of, has_as_of = _get(figure, "as_of")
        source, has_source = _get(figure, "source")
        primary, has_primary = _get(figure, "source_is_primary")
        rederived, has_rederived = _get(figure, "rederived")
        if not (has_label and has_as_of and has_source and has_primary
                and has_rederived and _is_nonempty_str(label)
                and _is_nonempty_str(as_of)
                and _is_nonempty_str(source)):
            incomplete += 1
            continue
        evaluated += 1
        if primary is not True or rederived is not True:
            not_primary_or_rederived = True
    if incomplete:
        _check(results, "accuracy_and_sourcing",
               "figures_complete_and_dated",
               figures, False, False,
               "a figure is missing its label, as-of date, source, "
               "primary-source flag, or re-derivation flag")
        _check(results, "accuracy_and_sourcing",
               "figures_primary_sourced_and_rederived",
               figures, False, False,
               "a figure is incomplete, so its sourcing and "
               "re-derivation cannot be verified")
    else:
        _check(results, "accuracy_and_sourcing",
               "figures_complete_and_dated",
               figures, True, True,
               "every figure carries a label, an as-of date, and a "
               "source (skill: date all rates/limits, 'as of <date>, "
               "source: ...')")
        _check(results, "accuracy_and_sourcing",
               "figures_primary_sourced_and_rederived",
               figures, True, not not_primary_or_rederived,
               "every figure is linked to a primary source and its "
               "number re-derived (skill: re-derive every number; "
               "link primary sources — CRA/IRS/central banks)")
    return evaluated, incomplete


def evaluate(manifest):
    """Return the verdict dict for a finance-content manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: advice_boundary (skill method 1 + quality gate:
    #      advice-boundary checklist passed for every piece) ----
    _bool_check(results, "advice_boundary",
                "teaches_frameworks_and_criteria", manifest,
                ("advice_boundary", "teaches_frameworks_not_recommendations"),
                "education, not advice: teach frameworks, math, and "
                "how-to-choose criteria")
    _false_check(results, "advice_boundary",
                 "no_personalized_recommendations", manifest,
                 ("advice_boundary", "personalized_recommendations_present"),
                 "red line: no personalized recommendations, ever — "
                 "personalized advice is licensed activity")
    _bool_check(results, "advice_boundary",
                "education_not_advice_disclaimer_present", manifest,
                ("advice_boundary",
                 "education_not_advice_disclaimer_present"),
                "'this is education; for your situation see a licensed "
                "advisor' included where relevant")
    jurisdiction, has_jurisdiction = _get(manifest, "jurisdiction")
    _check(results, "advice_boundary", "jurisdiction_context_stated",
           jurisdiction, has_jurisdiction,
           _is_nonempty_str(jurisdiction),
           "jurisdiction context stated (CA/US contexts differ — "
           "state the context)")
    _bool_check(results, "advice_boundary",
                "advice_boundary_checklist_passed", manifest,
                ("advice_boundary", "checklist_passed"),
                "quality gate: advice-boundary checklist passed for "
                "every piece")
    _gated_bool_check(
        results, "advice_boundary", "advice_like_content_flagged",
        manifest,
        ("advice_boundary", "advice_like_content_present"),
        ("advice_boundary", "advice_like_flagged_for_review"),
        "compliance touchpoint: content that edges toward "
        "advice-like (individualized) is flagged",
        "no advice-like (individualized) content declared")

    # ---- Section 2: accuracy_and_sourcing (skill method 2 +
    #      quality gate: figures dated + sourced; re-check cadence
    #      set; computed figure checks) ----
    figures_evaluated, figures_incomplete = _figures_checks(
        results, manifest)
    _bool_check(results, "accuracy_and_sourcing",
                "primary_sources_linked", manifest,
                ("accuracy", "primary_sources_linked"),
                "primary sources linked (CRA/IRS/central banks)")
    _bool_check(results, "accuracy_and_sourcing",
                "rates_and_limits_dated", manifest,
                ("accuracy", "rates_and_limits_dated"),
                "all rates/limits dated ('as of <date>, source: ...')")
    _bool_check(results, "accuracy_and_sourcing",
                "recheck_cadence_set", manifest,
                ("accuracy", "recheck_cadence_set"),
                "quality gate: figures re-checked on a schedule, "
                "since figures rot faster than pages")

    # ---- Section 3: risk_framing (skill method 3 + red line: never
    #      promise returns) ----
    _bool_check(results, "risk_framing", "risk_stated_before_upside",
                manifest, ("risk", "risk_before_upside"),
                "risk-first framing: uncertainty and risk stated "
                "before upside")
    _gated_bool_check(
        results, "risk_framing", "past_performance_caveat_present",
        manifest,
        ("risk", "uses_past_performance"),
        ("risk", "past_performance_caveat_present"),
        "past-performance caveats present where past performance "
        "is used",
        "no past performance used — caveat not required")
    _bool_check(results, "risk_framing", "fees_made_visible", manifest,
                ("risk", "fees_visible"),
                "fees made visible")
    _bool_check(results, "risk_framing", "taxes_made_visible", manifest,
                ("risk", "taxes_visible"),
                "taxes made visible")
    _false_check(results, "risk_framing", "no_return_promises", manifest,
                 ("risk", "return_promises_present"),
                 "red line: never promise returns or imply guaranteed "
                 "outcomes")
    _false_check(results, "risk_framing", "no_forecasts_as_fact",
                 manifest, ("risk", "forecasts_presented_as_fact"),
                 "no forecasts presented as fact")
    _false_check(results, "risk_framing", "no_survivorship_examples",
                 manifest, ("risk", "survivorship_examples_used"),
                 "no survivorship examples (only-the-winners case "
                 "studies)")

    # ---- Section 4: calculators_and_tools (skill method 4 +
    #      quality gate: calculators specced and boundary-tested;
    #      every check gated on a calculator/tool being included) ----
    _gated_bool_check(
        results, "calculators_and_tools", "calculator_spec_with_formulas",
        manifest,
        ("calculators", "includes_calculator"),
        ("calculators", "spec_with_formulas_present"),
        "calculators & tools: written spec with formulas",
        "no calculator or tool included")
    _gated_bool_check(
        results, "calculators_and_tools",
        "calculator_boundary_cases_tested", manifest,
        ("calculators", "includes_calculator"),
        ("calculators", "boundary_cases_tested"),
        "quality gate: boundary cases tested (zero, negative, "
        "max caps)",
        "no calculator or tool included")
    _gated_bool_check(
        results, "calculators_and_tools",
        "calculator_assumptions_visible", manifest,
        ("calculators", "includes_calculator"),
        ("calculators", "assumptions_visible_in_ui"),
        "assumptions visible in the UI",
        "no calculator or tool included")
    _gated_false_check(
        results, "calculators_and_tools", "no_dark_patterns_in_tools",
        manifest,
        ("calculators", "includes_calculator"),
        ("calculators", "dark_patterns_present"),
        "red line: no dark patterns in money tools",
        "no calculator or tool included")

    # ---- Section 5: commercial_honesty (skill method 5 + red lines:
    #      no hidden compensation, no fear-based selling) ----
    _gated_bool_check(
        results, "commercial_honesty",
        "sponsored_affiliate_content_hard_labeled", manifest,
        ("commercial", "has_sponsored_or_affiliate_content"),
        ("commercial", "sponsored_affiliate_hard_labeled"),
        "sponsored/affiliate content hard-labeled",
        "no sponsored or affiliate content declared")
    _bool_check(results, "commercial_honesty", "conflicts_disclosed",
                manifest, ("commercial", "conflicts_disclosed"),
                "conflicts disclosed")
    _bool_check(results, "commercial_honesty",
                "editorial_separated_from_sales", manifest,
                ("commercial", "editorial_separated_from_sales"),
                "editorial separated from sales")
    _false_check(results, "commercial_honesty",
                 "no_recommendations_for_undisclosed_compensation",
                 manifest,
                 ("commercial",
                  "recommendations_for_undisclosed_compensation"),
                 "red line: nothing 'recommended' for undisclosed "
                 "compensation — no hidden compensation")
    _false_check(results, "commercial_honesty", "no_fear_based_selling",
                 manifest, ("commercial", "fear_based_selling_present"),
                 "red line: no fear-based selling")

    # ---- Section 6: compliance_and_corrections (skill methods 6-7 +
    #      quality gate: correction log maintained; red line: user
    #      financial data never leaves the device without explicit,
    #      informed consent) ----
    _bool_check(results, "compliance_and_corrections",
                "jurisdiction_notes_file_kept", manifest,
                ("compliance", "jurisdiction_notes_file_kept"),
                "compliance touchpoint: jurisdiction notes file kept")
    _gated_bool_check(
        results, "compliance_and_corrections",
        "privacy_rules_applied_to_user_data", manifest,
        ("compliance", "tools_collect_user_data"),
        ("compliance", "privacy_rules_applied"),
        "compliance touchpoint: privacy rules applied to any user "
        "data in tools",
        "tools collect no user data — privacy rules not applicable")
    _false_check(results, "compliance_and_corrections",
                 "no_user_data_leaves_without_consent", manifest,
                 ("compliance",
                  "user_data_leaves_device_without_consent"),
                 "red line: user financial data never leaves the "
                 "device without explicit, informed consent")
    _bool_check(results, "compliance_and_corrections",
                "correction_log_maintained", manifest,
                ("corrections", "correction_log_maintained"),
                "quality gate: correction log maintained")
    _gated_bool_check(
        results, "compliance_and_corrections",
        "corrections_visible_and_dated", manifest,
        ("corrections", "corrections_made"),
        ("corrections", "correction_note_visible_and_dated"),
        "corrections: fix fast, date the fix, log it — wrong "
        "figures get a visible correction note, not a silent edit",
        "no corrections declared")

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
        "service": "finance-content-compliance-check",
        "atom_version": "0.1.0",
        "content": manifest.get("content"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "figures_evaluated": figures_evaluated,
        "figures_incomplete": figures_incomplete,
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
        "FINANCE CONTENT COMPLIANCE CHECK",
        f"content: {verdict.get('content')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<26} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: finance_content_compliance_check.py "
              "<manifest.json>", file=sys.stderr)
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
