#!/usr/bin/env python3
"""Finance tool design advisory — deterministic core.

Built from the bound skill `financial-innovation-expert`: "Build
finance tools that make people smarter without crossing into
advice. Pair quant rigor with Nrupal's zero-knowledge,
user-sovereign ethos."

This atom is an AUDIT of a declared finance-tool design record:
it validates the record a caller declares against the skill's
sections — the compliance line, quant fundamentals, open finance
building blocks, data integrity & privacy, the FOSS business
model, behavioral finance, and the anti-patterns to refuse. It
does not design a tool, run a calculation, read market data, or
verify that a declared control actually works — it checks that
the record the skill requires is present and internally complete
and consistent on the declared evidence.

The caller submits a finance-tool manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- features: the declared `features` list must be non-empty, and
  every declared feature row must show scenarios and trade-offs
  (the skill: "Surface analytics, scenarios, and trade-offs —
  never a recommendation"), must not imply advice, and must have
  traceable figures ("Reproducibility and auditability of every
  number shown");
- backtests: every feature row declared as a backtest must
  declare overfit and survivorship bias addressed (the skill's
  anti-patterns: "overfit backtests; survivorship bias").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no numeric threshold — no VaR confidence level
or horizon, no Sharpe/Sortino cutoff, no volatility or drawdown
limit, no position-size percentage, no rebalancing band, no
correlation cutoff, no coverage percentage — so no numeric
threshold check is invented; those quantities are caller
attestations at most, and quantities here are computed and
reported, with completeness (every declared feature) as the only
bar, exactly as stated above.

Verdict:
- any fail             -> FINANCE_TOOL_DESIGN_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> FINANCE_TOOL_DESIGN_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "compliance_and_advice_boundary",
    "quant_fundamentals",
    "reproducibility_privacy_and_open_finance",
    "business_model_and_behavioral_design",
    "anti_patterns",
)

MANIFEST_SPEC = {
    "tool": "string",
    "compliance": {
        "tool_calculates_user_decides": "boolean",
        "recommendation_language_present": "boolean",
        "disclaimers_carried": "boolean",
        "finra_2214_and_csa_framing_addressed": "boolean",
        "advice_like_language_redesigned_to_scenarios": "boolean",
    },
    "margin": {
        "margin_features_present": "boolean",
        "margin_disclosure_carried": "boolean",
    },
    "quant": {
        "risk_and_return_presented_together": "boolean",
        "diversification_and_correlation_addressed": "boolean",
        "mpt_limits_disclosed": "boolean",
        "factor_thinking_addressed": "boolean",
        "regime_awareness_addressed": "boolean",
        "tax_and_fee_aware_returns": "boolean",
    },
    "features": [{
        "name": "string",
        "shows_scenarios_and_tradeoffs": "boolean",
        "implies_advice_present": "boolean",
        "figures_traceable": "boolean",
        "is_backtest": "boolean",
        "overfit_and_survivorship_addressed": "boolean",
    }],
    "open_building_blocks": {
        "open_data_sources_used": "boolean",
        "open_source_analytics_used": "boolean",
        "every_number_reproducible_and_auditable": "boolean",
    },
    "privacy": {
        "zero_knowledge_design": "boolean",
        "user_held_keys": "boolean",
        "data_selling_present": "boolean",
    },
    "business_model": {
        "monetization_via_certification_membership_or_developer_licenses": "boolean",
        "core_features_gated_present": "boolean",
    },
    "behavioral": {
        "biases_accounted_for": "boolean",
        "decision_history_used_as_insight": "boolean",
    },
    "anti_patterns": {
        "guaranteed_or_return_promising_language_present": "boolean",
        "black_box_risk_numbers_present": "boolean",
        "fees_taxes_slippage_ignored_present": "boolean",
        "overfit_backtests_present": "boolean",
        "survivorship_bias_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
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


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for a finance-tool manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    features, has_features = _get(manifest, "features")
    features_is_list = has_features and isinstance(features, list)
    features_count = len(features) if features_is_list else None
    rows = features if features_is_list else []

    features_without_scenarios = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "shows_scenarios_and_tradeoffs" in c
         and c.get("shows_scenarios_and_tradeoffs") is not True]
        if features_is_list else None
    )
    features_implying_advice = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and c.get("implies_advice_present") is True]
        if features_is_list else None
    )
    features_without_traceable_figures = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "figures_traceable" in c
         and c.get("figures_traceable") is not True]
        if features_is_list else None
    )
    backtest_rows = [
        c for c in rows
        if isinstance(c, dict) and c.get("is_backtest") is True
    ]
    backtest_features_without_address = (
        [_row_name(c) for c in backtest_rows
         if "overfit_and_survivorship_addressed" in c
         and c.get("overfit_and_survivorship_addressed") is not True]
        if features_is_list else None
    )
    scenario_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("shows_scenarios_and_tradeoffs") is True)
        / features_count
        if features_is_list and features_count > 0 else None
    )
    traceability_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("figures_traceable") is True)
        / features_count
        if features_is_list and features_count > 0 else None
    )

    # ---- Section 1: compliance_and_advice_boundary (skill: the
    #      compliance line — tool calculates, user decides; never
    #      a recommendation to buy/sell/hold; FINRA Rule 2214 and
    #      CSA framing; clear disclaimers; "you should…" redesigned
    #      into "here's what the numbers show") ----
    _bool_check(results, "compliance_and_advice_boundary",
                "tool_calculates_user_decides", manifest,
                ("compliance", "tool_calculates_user_decides"),
                "compliance line: the tool calculates, the user "
                "decides — analytics, scenarios and trade-offs are "
                "surfaced, never a decision for the user")
    _false_check(results, "compliance_and_advice_boundary",
                 "no_recommendation_language", manifest,
                 ("compliance", "recommendation_language_present"),
                 "compliance line: no recommendation to buy, sell "
                 "or hold is present in the declared design")
    _bool_check(results, "compliance_and_advice_boundary",
                "disclaimers_carried", manifest,
                ("compliance", "disclaimers_carried"),
                "compliance line: clear disclaimers are carried")
    _bool_check(results, "compliance_and_advice_boundary",
                "finra_2214_and_csa_framing_addressed", manifest,
                ("compliance", "finra_2214_and_csa_framing_addressed"),
                "compliance line: FINRA Rule 2214 (margin "
                "disclosure) and CSA framing are addressed — the "
                "design stays out of registered-adviser territory")
    _bool_check(results, "compliance_and_advice_boundary",
                "advice_like_language_redesigned_to_scenarios",
                manifest,
                ("compliance",
                 "advice_like_language_redesigned_to_scenarios"),
                "compliance line: anything that starts to sound "
                "like \"you should…\" is redesigned into \"here's "
                "what the numbers show, and what would have to be "
                "true\"")
    _gated_bool_check(
        results, "compliance_and_advice_boundary",
        "margin_disclosure_when_margin_features", manifest,
        ("margin", "margin_features_present"),
        ("margin", "margin_disclosure_carried"),
        "compliance line: margin disclosure is carried when "
        "margin features are declared present",
        "no margin features declared")
    scenarios_present = (
        features_is_list
        and all(isinstance(c, dict)
                and "shows_scenarios_and_tradeoffs" in c for c in rows)
    )
    _check(results, "compliance_and_advice_boundary",
           "every_feature_shows_scenarios_and_tradeoffs", features,
           scenarios_present,
           features_is_list and features_count > 0
           and all(isinstance(c, dict)
                   and c.get("shows_scenarios_and_tradeoffs") is True
                   for c in rows),
           "compliance line: every declared feature row shows "
           "scenarios and trade-offs")
    advice_present = (
        features_is_list
        and all(isinstance(c, dict)
                and "implies_advice_present" in c for c in rows)
    )
    _check(results, "compliance_and_advice_boundary",
           "no_feature_implies_advice", features,
           advice_present,
           features_is_list and len(features_implying_advice) == 0,
           "anti-pattern: no declared feature row implies advice")

    # ---- Section 2: quant_fundamentals (skill: quant
    #      fundamentals — risk vs return, diversification and
    #      correlation/anti-correlation, MPT and its real-world
    #      limits, factor thinking, regime awareness, tax- and
    #      fee-aware returns) ----
    _bool_check(results, "quant_fundamentals",
                "risk_and_return_presented_together", manifest,
                ("quant", "risk_and_return_presented_together"),
                "quant fundamentals: risk and return are presented "
                "together")
    _bool_check(results, "quant_fundamentals",
                "diversification_and_correlation_addressed", manifest,
                ("quant", "diversification_and_correlation_addressed"),
                "quant fundamentals: diversification and "
                "correlation / anti-correlation are addressed")
    _bool_check(results, "quant_fundamentals",
                "mpt_limits_disclosed", manifest,
                ("quant", "mpt_limits_disclosed"),
                "quant fundamentals: MPT and its real-world limits "
                "are disclosed — fat tails, unstable correlations")
    _bool_check(results, "quant_fundamentals",
                "factor_thinking_addressed", manifest,
                ("quant", "factor_thinking_addressed"),
                "quant fundamentals: factor thinking is addressed")
    _bool_check(results, "quant_fundamentals",
                "regime_awareness_addressed", manifest,
                ("quant", "regime_awareness_addressed"),
                "quant fundamentals: regime awareness is addressed")
    _bool_check(results, "quant_fundamentals",
                "tax_and_fee_aware_returns", manifest,
                ("quant", "tax_and_fee_aware_returns"),
                "quant fundamentals: returns are tax- and fee-aware "
                "— gross is not net")

    # ---- Section 3: reproducibility_privacy_and_open_finance
    #      (skill: open finance building blocks — open data,
    #      reproducible open-source analytics, reproducibility and
    #      auditability of every number shown. Data integrity &
    #      privacy — zero-knowledge, user-held keys, no data
    #      selling) ----
    _bool_check(results, "reproducibility_privacy_and_open_finance",
                "open_data_sources_used", manifest,
                ("open_building_blocks", "open_data_sources_used"),
                "open finance building blocks: open data — rates, "
                "FX, fundamentals — is used")
    _bool_check(results, "reproducibility_privacy_and_open_finance",
                "open_source_analytics_used", manifest,
                ("open_building_blocks", "open_source_analytics_used"),
                "open finance building blocks: reproducible "
                "open-source analytics are used")
    _bool_check(results, "reproducibility_privacy_and_open_finance",
                "every_number_reproducible_and_auditable", manifest,
                ("open_building_blocks",
                 "every_number_reproducible_and_auditable"),
                "open finance building blocks: every number shown "
                "is reproducible and auditable — a figure the user "
                "can't trace is a liability")
    _bool_check(results, "reproducibility_privacy_and_open_finance",
                "zero_knowledge_design", manifest,
                ("privacy", "zero_knowledge_design"),
                "data integrity & privacy: the design is "
                "zero-knowledge")
    _bool_check(results, "reproducibility_privacy_and_open_finance",
                "user_held_keys", manifest,
                ("privacy", "user_held_keys"),
                "data integrity & privacy: keys are user-held")
    _false_check(results, "reproducibility_privacy_and_open_finance",
                 "no_data_selling", manifest,
                 ("privacy", "data_selling_present"),
                 "data integrity & privacy: no data selling — trust "
                 "and security are the moat")
    _check(results, "reproducibility_privacy_and_open_finance",
           "features_declared", features, features_is_list,
           features_is_list and features_count > 0,
           "the declared record names its features — the features "
           "list is present and non-empty")
    traceability_present = (
        features_is_list
        and all(isinstance(c, dict) and "figures_traceable" in c
                for c in rows)
    )
    _check(results, "reproducibility_privacy_and_open_finance",
           "every_feature_figures_traceable", features,
           traceability_present,
           features_is_list and features_count > 0
           and all(isinstance(c, dict)
                   and c.get("figures_traceable") is True
                   for c in rows),
           "open finance building blocks: every declared feature "
           "row declares its figures traceable")

    # ---- Section 4: business_model_and_behavioral_design
    #      (skill: FOSS business model — monetize via
    #      certification, membership and developer licenses, not
    #      by gating features; keep the core open. Behavioral
    #      finance — account for biases; decision archaeology and
    #      conviction-weighting turn the user's own history into
    #      insight) ----
    _bool_check(results, "business_model_and_behavioral_design",
                "monetization_via_ecosystem_not_gating", manifest,
                ("business_model",
                 "monetization_via_certification_membership_or_developer_licenses"),
                "FOSS business model: monetization is via "
                "certification, membership and developer licenses "
                "— the ecosystem and credentialing")
    _false_check(results, "business_model_and_behavioral_design",
                 "no_core_features_gated", manifest,
                 ("business_model", "core_features_gated_present"),
                 "FOSS business model: the core is kept open — "
                 "features are not gated")
    _bool_check(results, "business_model_and_behavioral_design",
                "biases_accounted_for", manifest,
                ("behavioral", "biases_accounted_for"),
                "behavioral finance: biases — loss aversion, "
                "recency, overconfidence — are accounted for")
    _bool_check(results, "business_model_and_behavioral_design",
                "decision_history_used_as_insight", manifest,
                ("behavioral", "decision_history_used_as_insight"),
                "behavioral finance: decision archaeology and "
                "conviction-weighting turn the user's own history "
                "into insight")

    # ---- Section 5: anti_patterns (skill: anti-patterns to
    #      refuse — implying advice; overfit backtests;
    #      survivorship bias; ignoring fees/taxes/slippage;
    #      black-box risk numbers; "guaranteed"/return-promising
    #      language) ----
    _false_check(results, "anti_patterns",
                 "no_guaranteed_or_return_promising_language",
                 manifest,
                 ("anti_patterns",
                  "guaranteed_or_return_promising_language_present"),
                 "anti-pattern: no \"guaranteed\" or "
                 "return-promising language is present")
    _false_check(results, "anti_patterns",
                 "no_black_box_risk_numbers", manifest,
                 ("anti_patterns", "black_box_risk_numbers_present"),
                 "anti-pattern: no black-box risk numbers are "
                 "present")
    _false_check(results, "anti_patterns",
                 "no_fees_taxes_slippage_ignored", manifest,
                 ("anti_patterns",
                  "fees_taxes_slippage_ignored_present"),
                 "anti-pattern: fees, taxes and slippage are not "
                 "ignored")
    _false_check(results, "anti_patterns",
                 "no_overfit_backtests", manifest,
                 ("anti_patterns", "overfit_backtests_present"),
                 "anti-pattern: no overfit backtests are present")
    _false_check(results, "anti_patterns",
                 "no_survivorship_bias", manifest,
                 ("anti_patterns", "survivorship_bias_present"),
                 "anti-pattern: no survivorship bias is present")
    backtest_gate_present = (
        features_is_list
        and all(isinstance(c, dict) and "is_backtest" in c
                for c in rows)
    )
    backtest_present = (
        features_is_list and backtest_gate_present
        and all("overfit_and_survivorship_addressed" in c
                for c in backtest_rows)
    )
    _check(results, "anti_patterns",
           "every_backtest_feature_addresses_overfit_and_survivorship",
           features, backtest_present,
           features_is_list
           and all(c.get("overfit_and_survivorship_addressed") is True
                   for c in backtest_rows),
           "anti-pattern: every feature row declared as a "
           "backtest declares overfit and survivorship bias "
           "addressed")

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
        verdict = "FINANCE_TOOL_DESIGN_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "FINANCE_TOOL_DESIGN_SOUND"

    computed_names = (
        "features_declared",
        "every_feature_shows_scenarios_and_tradeoffs",
        "no_feature_implies_advice",
        "every_feature_figures_traceable",
        "every_backtest_feature_addresses_overfit_and_survivorship",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "finance-tool-design-advisory",
        "atom_version": "0.1.0",
        "tool": manifest.get("tool"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "features_count": features_count,
        "features_without_scenarios_and_tradeoffs":
            features_without_scenarios,
        "scenario_coverage": _fmt6(scenario_coverage),
        "features_implying_advice": features_implying_advice,
        "features_without_traceable_figures":
            features_without_traceable_figures,
        "traceability_coverage": _fmt6(traceability_coverage),
        "backtest_features_without_overfit_survivorship_address":
            backtest_features_without_address,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "FINANCE TOOL DESIGN ADVISORY",
        f"tool: {verdict.get('tool')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: finance_tool_design_advisory.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "FINANCE_TOOL_DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
