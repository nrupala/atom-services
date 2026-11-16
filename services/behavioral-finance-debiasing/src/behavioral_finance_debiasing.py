#!/usr/bin/env python3
"""Behavioral finance debiasing — deterministic core.

Built from the bound skill `behavioral-finance-expert`: "Spots
the predictable biases — fear, greed, anchoring, loss aversion —
that quietly steer money decisions, and helps you debias before
you act." This atom is an AUDIT of a declared debiasing pack: it
validates the debiasing record a caller declares against the
skill's key-bias catalogue, its prospect-theory reframing
points, its debiasing techniques, its "tool calculates, user
decides / not advice" line, and its anti-patterns to refuse. It
does not debias anyone itself, give financial advice, nudge a
trade, or verify that a declared value is true — it checks
that the record the skill requires is present and internally
complete on the declared evidence.

The caller submits a debiasing manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

One check is computed against a caller-declared limit, and one
value is computed and reported — no outside threshold is
imported:

- rebalancing bands are a stated pre-commit rule (skill
  debiasing techniques: "an investment policy statement,
  rebalancing bands, written sell criteria"). The declared
  current allocation's distance from the declared target
  allocation passes at or below the declared band and fails
  above it; equality passes, because the band is a limit. The
  excess drift is reported as
  `allocation_drift_over_band_percent`: |current - target| -
  band, a string with exactly four decimal places produced in
  both implementations by the same fixed rule — round half up
  to 4dp, floor(v * 10000 + 0.5) / 10000, then format with
  exactly four decimals; comparisons use the unrounded values.
- the whole-portfolio reframe ("reframe in whole-portfolio
  absolute terms, not single-position P&L") is reported as
  `position_share_percent_of_portfolio`: 100 * position value /
  whole portfolio value, serialized by the same fixed 4dp rule
  (null when either value is undeclared or the declared whole
  portfolio value is zero). No pass/fail threshold is attached
  to it: the skill states no limit on a position's share, so
  none is invented.

One check is gated, mirroring the skill's own scope: a
cooling-off period is required "before big trades" — when the
gating field declares the trade is not big, the check passes
as not applicable; when the gating field is absent, the check
is missing evidence.

The computed outcome is also reported as `computed_status`:
"outside_declared_band_on_declared_evidence" when the
rebalancing check fails,
"within_declared_band_on_declared_evidence" when it passes,
otherwise null. The number of declared bias patterns found is
reported as `bias_patterns_found_count` (null when no list is
declared).

Verdict:
- any fail             -> NOT_DEBIASED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DEBIASED

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "bias_screening",
    "prospect_theory_reframing",
    "precommitment_rules",
    "journal_checklists_and_cooling_off",
    "whole_portfolio_reframing",
    "guardrails_and_anti_patterns",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "decision": "string",
    "context": {
        "is_big_trade": "boolean",
    },
    "bias_screening": {
        "loss_aversion_screened": "boolean",
        "disposition_effect_screened": "boolean",
        "mental_accounting_screened": "boolean",
        "anchoring_to_purchase_price_screened": "boolean",
        "recency_availability_screened": "boolean",
        "herding_fomo_screened": "boolean",
        "overconfidence_illusion_of_control_screened": "boolean",
        "confirmation_screened": "boolean",
        "sunk_cost_screened": "boolean",
        "home_bias_screened": "boolean",
        "narrative_bias_screened": "boolean",
    },
    "bias_patterns": {
        "found": [{
            "bias": "string",
            "technique_named": "boolean",
            "surfaced_to_user": "boolean",
        }],
    },
    "prospect_theory": {
        "reference_point_identified": "boolean",
        "framed_vs_reference_not_absolute_wealth": "boolean",
        "loss_asymmetry_acknowledged": "boolean",
        "risk_attitude_by_domain_checked": "boolean",
        "probability_weighting_checked": "boolean",
    },
    "precommitment": {
        "investment_policy_statement_present": "boolean",
        "written_sell_criteria_present": "boolean",
        "rules_decided_before_emotion_arrives": "boolean",
        "rebalancing_target_allocation_percent": "number",
        "rebalancing_current_allocation_percent": "number",
        "rebalancing_band_percent": "number",
    },
    "journal_and_checklists": {
        "decision_journal_reasoning_recorded": "boolean",
        "decisions_reviewed_separately_from_outcomes": "boolean",
        "base_rates_used": "boolean",
        "checklists_used": "boolean",
        "cooling_off_period_taken": "boolean",
    },
    "whole_portfolio": {
        "reframed_in_whole_portfolio_absolute_terms": "boolean",
        "single_position_pnl_framing_used": "boolean",
        "position_value": "number",
        "whole_portfolio_value": "number",
    },
    "guardrails": {
        "bias_patterns_surfaced_to_user": "boolean",
        "tool_calculates_user_decides": "boolean",
        "not_advice_line_respected": "boolean",
        "biases_used_to_manipulate": "boolean",
        "trade_nudge_present": "boolean",
        "markets_assumed_perfectly_efficient_or_irrational": "boolean",
        "single_bias_treated_as_whole_story": "boolean",
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


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def evaluate(manifest):
    """Return the verdict dict for a behavioral-finance debiasing manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: bias_screening (skill: "Key money biases" —
    #      the catalogue the debiasing screen runs against) ----
    screening = (
        ("loss_aversion_screened", "loss aversion"),
        ("disposition_effect_screened",
         "disposition effect (sell winners too early, ride losers "
         "too long)"),
        ("mental_accounting_screened", "mental accounting"),
        ("anchoring_to_purchase_price_screened",
         "anchoring to purchase price"),
        ("recency_availability_screened", "recency/availability"),
        ("herding_fomo_screened", "herding & FOMO"),
        ("overconfidence_illusion_of_control_screened",
         "overconfidence and illusion of control"),
        ("confirmation_screened", "confirmation"),
        ("sunk_cost_screened", "sunk cost"),
        ("home_bias_screened", "home bias"),
        ("narrative_bias_screened", "narrative bias"),
    )
    for field, label in screening:
        _bool_check(results, "bias_screening", field, manifest,
                    ("bias_screening", field),
                    f"key money biases: the decision is screened for "
                    f"{label}")
    found, has_found = _get(manifest, "bias_patterns", "found")
    found_is_list = has_found and isinstance(found, list)
    found_count = len(found) if found_is_list else None
    technique_ok = (found_is_list and all(
        isinstance(p, dict) and p.get("technique_named") is True
        for p in found))
    _check(results, "bias_screening",
           "all_found_patterns_have_technique_named", found,
           found_is_list, technique_ok,
           "debiasing techniques: every bias pattern found carries "
           "a named debiasing technique (an empty found list "
           "passes — no found pattern lacks a technique)")
    surfaced_ok = (found_is_list and all(
        isinstance(p, dict) and p.get("surfaced_to_user") is True
        for p in found))
    _check(results, "bias_screening",
           "all_found_patterns_surfaced_to_user", found,
           found_is_list, surfaced_ok,
           "surface the user's own bias patterns back to them so "
           "they can self-correct (an empty found list passes — "
           "no found pattern was withheld)")

    # ---- Section 2: prospect_theory_reframing (skill: prospect
    #      theory (Kahneman & Tversky)) ----
    _bool_check(results, "prospect_theory_reframing",
                "reference_point_identified", manifest,
                ("prospect_theory", "reference_point_identified"),
                "prospect theory: decisions are reference-dependent "
                "— the reference point is identified")
    _bool_check(results, "prospect_theory_reframing",
                "framed_vs_reference_not_absolute_wealth", manifest,
                ("prospect_theory",
                 "framed_vs_reference_not_absolute_wealth"),
                "prospect theory: the decision is framed as gain/"
                "loss vs the reference point, not absolute wealth")
    _bool_check(results, "prospect_theory_reframing",
                "loss_asymmetry_acknowledged", manifest,
                ("prospect_theory", "loss_asymmetry_acknowledged"),
                "prospect theory: losses loom roughly twice as "
                "large as equivalent gains — the asymmetry is "
                "acknowledged in the framing")
    _bool_check(results, "prospect_theory_reframing",
                "risk_attitude_by_domain_checked", manifest,
                ("prospect_theory", "risk_attitude_by_domain_checked"),
                "prospect theory: risk-averse in the domain of "
                "gains, risk-seeking in the domain of losses — the "
                "decision's domain attitude is checked")
    _bool_check(results, "prospect_theory_reframing",
                "probability_weighting_checked", manifest,
                ("prospect_theory", "probability_weighting_checked"),
                "prospect theory: rare probabilities are "
                "overweighted and near-certain ones underweighted "
                "— the weighting is checked")

    # ---- Section 3: precommitment_rules (skill debiasing
    #      techniques: pre-commit rules — decide before emotion
    #      arrives) ----
    _bool_check(results, "precommitment_rules",
                "investment_policy_statement_present", manifest,
                ("precommitment",
                 "investment_policy_statement_present"),
                "pre-commit rules: an investment policy statement "
                "is present")
    _bool_check(results, "precommitment_rules",
                "written_sell_criteria_present", manifest,
                ("precommitment", "written_sell_criteria_present"),
                "pre-commit rules: written sell criteria are present")
    _bool_check(results, "precommitment_rules",
                "rules_decided_before_emotion_arrives", manifest,
                ("precommitment",
                 "rules_decided_before_emotion_arrives"),
                "pre-commit rules: decide before emotion arrives — "
                "the rules were decided before the emotion of this "
                "decision")
    target, has_target = _get(
        manifest, "precommitment", "rebalancing_target_allocation_percent")
    current, has_current = _get(
        manifest, "precommitment",
        "rebalancing_current_allocation_percent")
    band, has_band = _get(
        manifest, "precommitment", "rebalancing_band_percent")
    band_present = (has_target and _is_number(target)
                    and has_current and _is_number(current)
                    and has_band and _is_number(band))
    drift = (abs(current - target) if band_present else None)
    _check(results, "precommitment_rules",
           "allocation_within_rebalancing_band", current, band_present,
           band_present and drift <= band,
           "pre-commit rules: rebalancing bands — the declared "
           "current allocation's distance from the declared target "
           "allocation is at or below the declared band percent")
    drift_over_band = (drift - band if band_present else None)

    # ---- Section 4: journal_checklists_and_cooling_off (skill
    #      debiasing techniques: decision journal / decision
    #      archaeology; base rates and checklists; cooling-off
    #      periods before big trades) ----
    _bool_check(results, "journal_checklists_and_cooling_off",
                "decision_journal_reasoning_recorded", manifest,
                ("journal_and_checklists",
                 "decision_journal_reasoning_recorded"),
                "decision journal / decision archaeology: record "
                "the reasoning")
    _bool_check(results, "journal_checklists_and_cooling_off",
                "decisions_reviewed_separately_from_outcomes", manifest,
                ("journal_and_checklists",
                 "decisions_reviewed_separately_from_outcomes"),
                "decision archaeology: review decisions separately "
                "from outcomes")
    _bool_check(results, "journal_checklists_and_cooling_off",
                "base_rates_used", manifest,
                ("journal_and_checklists", "base_rates_used"),
                "debiasing techniques: base rates are used")
    _bool_check(results, "journal_checklists_and_cooling_off",
                "checklists_used", manifest,
                ("journal_and_checklists", "checklists_used"),
                "debiasing techniques: checklists are used")
    is_big, has_big = _get(manifest, "context", "is_big_trade")
    cooling, has_cooling = _get(
        manifest, "journal_and_checklists", "cooling_off_period_taken")
    if has_big and is_big:
        _check(results, "journal_checklists_and_cooling_off",
               "cooling_off_period_taken_before_big_trade", cooling,
               has_cooling, cooling is True,
               "debiasing techniques: cooling-off periods before "
               "big trades")
    else:
        _check(results, "journal_checklists_and_cooling_off",
               "cooling_off_period_taken_before_big_trade", is_big,
               has_big, True, "not a big trade")

    # ---- Section 5: whole_portfolio_reframing (skill debiasing
    #      techniques: reframe in whole-portfolio absolute terms,
    #      not single-position P&L) ----
    _bool_check(results, "whole_portfolio_reframing",
                "reframed_in_whole_portfolio_absolute_terms", manifest,
                ("whole_portfolio",
                 "reframed_in_whole_portfolio_absolute_terms"),
                "debiasing techniques: reframe in whole-portfolio "
                "absolute terms")
    _false_check(results, "whole_portfolio_reframing",
                 "not_framed_as_single_position_pnl", manifest,
                 ("whole_portfolio", "single_position_pnl_framing_used"),
                 "debiasing techniques: the reframe is not left as "
                 "single-position P&L")
    pos, has_pos = _get(manifest, "whole_portfolio", "position_value")
    whole, has_whole = _get(
        manifest, "whole_portfolio", "whole_portfolio_value")
    share = (100 * pos / whole
             if has_pos and _is_number(pos) and has_whole
             and _is_number(whole) and whole != 0 else None)

    # ---- Section 6: guardrails_and_anti_patterns (skill: for
    #      PAE — surface patterns, never nudge into a trade, tool
    #      calculates / user decides, the "not advice" line;
    #      anti-patterns to refuse) ----
    _bool_check(results, "guardrails_and_anti_patterns",
                "bias_patterns_surfaced_to_user", manifest,
                ("guardrails", "bias_patterns_surfaced_to_user"),
                "surface the user's own bias patterns back to them "
                "so they can self-correct")
    _bool_check(results, "guardrails_and_anti_patterns",
                "tool_calculates_user_decides", manifest,
                ("guardrails", "tool_calculates_user_decides"),
                "tool calculates, user decides")
    _bool_check(results, "guardrails_and_anti_patterns",
                "not_advice_line_respected", manifest,
                ("guardrails", "not_advice_line_respected"),
                "stay on the FINRA/CSA 'not advice' line")
    _false_check(results, "guardrails_and_anti_patterns",
                 "biases_not_used_to_manipulate", manifest,
                 ("guardrails", "biases_used_to_manipulate"),
                 "anti-pattern to refuse: using biases to manipulate")
    _false_check(results, "guardrails_and_anti_patterns",
                 "no_trade_nudge", manifest,
                 ("guardrails", "trade_nudge_present"),
                 "never nudge them into a trade")
    _false_check(results, "guardrails_and_anti_patterns",
                 "markets_not_assumed_perfectly_efficient_or_irrational",
                 manifest,
                 ("guardrails",
                  "markets_assumed_perfectly_efficient_or_irrational"),
                 "anti-pattern to refuse: assuming markets are "
                 "perfectly efficient or perfectly irrational")
    _false_check(results, "guardrails_and_anti_patterns",
                 "single_bias_not_treated_as_whole_story", manifest,
                 ("guardrails", "single_bias_treated_as_whole_story"),
                 "anti-pattern to refuse: treating one bias as the "
                 "whole story")

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
        verdict = "NOT_DEBIASED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DEBIASED"

    band_status = next(
        r["status"] for r in results
        if r["check"] == "allocation_within_rebalancing_band")
    if band_status == "fail":
        computed_status = "outside_declared_band_on_declared_evidence"
    elif band_status == "pass":
        computed_status = "within_declared_band_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "behavioral-finance-debiasing",
        "atom_version": "0.1.0",
        "decision": manifest.get("decision"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "bias_patterns_found_count": found_count,
        "allocation_drift_over_band_percent": _fmt4(drift_over_band),
        "position_share_percent_of_portfolio": _fmt4(share),
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
        "BEHAVIORAL FINANCE DEBIASING",
        f"decision: {verdict.get('decision')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: behavioral_finance_debiasing.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DEBIASED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
