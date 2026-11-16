#!/usr/bin/env python3
"""Strategy backtest validation — deterministic core.

Built from the bound skill `backtesting-validation` (v1): "A
backtest is a claim, not evidence — until it survives
out-of-sample, costs, and paper trading. Capital comes last,
after the harness earns trust."

This atom does NOT run a backtest and makes no judgment about
whether a strategy is good. The caller submits a backtest-evidence
manifest: the declared harness standards, the declared protocol
and its reported result sets, the declared cost modelling, the
declared overfit / fragility evidence (including the declared
parameter and observation counts), the paper-gate record, and the
live-monitoring / house-gate record. The atom validates that
declared evidence deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY relationships the skill itself states,
over values the caller declares — no outside threshold is
imported:

- the params-vs-data ratio is recomputed from the declared
  parameter count and observation count (skill method 4 names
  the "params-vs-data ratio" as an overfit check); the atom
  reports the ratio but applies NO acceptance bar to it — the
  skill states no numeric bar, so none is invented;
- taxes are required only when taxes are declared material
  (skill method 3: "taxes where material");
- the paper gate passes when it is completed OR consciously
  waived, and a waiver binds only with a written reason and an
  approval on record (skill quality gate: "Paper gate completed
  (or consciously waived with written reason + approval)"); a
  completed-or-waived gate also discharges the paper-phase
  live-vs-model comparison;
- a declared planned trade over $500 binds the clear-yes
  evidence (skill house gate 8: ">$500 trades need a clear
  yes") — $500 is the one numeric threshold in the output, and
  it is the skill's own.

The computed params-to-data ratio is reported as a string with
exactly four decimal places, produced in both implementations
by the same fixed rule: round half up to 4dp —
floor(v * 10000 + 0.5) / 10000 — then format with exactly four
decimals. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

Verdict:
- any fail             -> NOT_VALIDATED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> VALIDATED

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "harness_standards",
    "protocol_and_reporting",
    "costs_and_frictions",
    "overfit_and_fragility",
    "paper_gate",
    "live_monitoring_and_house_gates",
)

LARGE_TRADE_THRESHOLD_USD = 500

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "strategy": "string",
    "harness": {
        "deterministic_runs": "boolean",
        "data_snapshots_versioned": "boolean",
        "point_in_time_universe": "boolean",
        "look_ahead_used": "boolean",
        "realistic_fills_modeled": "boolean",
    },
    "protocol": {
        "hypothesis_stated": "boolean",
        "in_sample_reported": "boolean",
        "out_of_sample_reported": "boolean",
        "holdout_untouched_until_end": "boolean",
        "walk_forward_reported": "boolean",
        "reported_side_by_side": "boolean",
    },
    "costs": {
        "commissions_modeled": "boolean",
        "spreads_modeled": "boolean",
        "slippage_modeled": "boolean",
        "borrow_modeled": "boolean",
        "financing_modeled": "boolean",
        "taxes_material": "boolean",
        "taxes_modeled": "boolean",
        "costs_skipped": "boolean",
    },
    "overfit": {
        "parameter_sensitivity_shown": "boolean",
        "sensitivity_shows_smooth_plateau": "boolean",
        "parameter_count": "number",
        "observation_count": "number",
        "best_of_n_disclosed": "boolean",
        "curve_fit_parameters_used": "boolean",
    },
    "fragility": {
        "single_name_dominance_checked": "boolean",
        "regime_dependence_checked": "boolean",
        "capacity_liquidity_checked": "boolean",
    },
    "paper": {
        "period_or_fill_count_defined": "boolean",
        "completed": "boolean",
        "waived": "boolean",
        "waiver_written_reason": "boolean",
        "waiver_approval_recorded": "boolean",
        "live_vs_model_compared": "boolean",
    },
    "monitoring": {
        "divergence_tracked": "boolean",
        "kill_criteria_defined_before_scaling": "boolean",
        "kill_criteria_cover_all_three": "boolean",
    },
    "house_gates": {
        "explicit_confirmation_for_live_trades": "boolean",
        "max_planned_trade_usd": "number",
        "clear_yes_for_trades_over_500": "boolean",
        "backtest_used_as_sole_live_confirmation": "boolean",
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _ratio_check(results, manifest):
    """Computed params-vs-data ratio; returns the raw ratio or None."""
    params, has_params = _get(manifest, "overfit", "parameter_count")
    observations, has_obs = _get(manifest, "overfit", "observation_count")
    if not (has_params and has_obs):
        _check(results, "overfit_and_fragility",
               "params_vs_data_ratio_computable",
               params, False, False,
               "overfit detection: params-vs-data ratio — no "
               "parameter count or observation count declared")
        return None
    if not (_is_number(params) and _is_number(observations)) \
            or observations == 0:
        _check(results, "overfit_and_fragility",
               "params_vs_data_ratio_computable",
               params, True, False,
               "overfit detection: params-vs-data ratio — the "
               "parameter count and observation count must be "
               "numbers and the observation count must be non-zero")
        return None
    _check(results, "overfit_and_fragility",
           "params_vs_data_ratio_computable",
           params, True, True,
           "overfit detection: params-vs-data ratio recomputed "
           "from the declared parameter and observation counts "
           "(reported, with no acceptance bar — the skill states "
           "none)")
    return params / observations


def _taxes_check(results, manifest):
    material, has_material = _get(manifest, "costs", "taxes_material")
    modeled, has_modeled = _get(manifest, "costs", "taxes_modeled")
    if has_material and material:
        _check(results, "costs_and_frictions",
               "taxes_modeled_when_material",
               modeled, has_modeled, modeled is True,
               "costs & frictions: taxes modeled where material")
    else:
        _check(results, "costs_and_frictions",
               "taxes_modeled_when_material",
               material, has_material, True,
               "taxes not declared material — modeling taxes is "
               "not required")


def _paper_checks(results, manifest):
    completed, has_completed = _get(manifest, "paper", "completed")
    waived, has_waived = _get(manifest, "paper", "waived")
    if not (has_completed or has_waived):
        _check(results, "paper_gate", "paper_gate_completed_or_waived",
               completed, False, False,
               "no paper-gate completion or waiver declared")
    else:
        _check(results, "paper_gate", "paper_gate_completed_or_waived",
               completed, True,
               completed is True or waived is True,
               "quality gate: paper gate completed (or consciously "
               "waived with written reason + approval)")
    if has_waived and waived:
        reason, has_reason = _get(manifest, "paper",
                                  "waiver_written_reason")
        approval, has_approval = _get(manifest, "paper",
                                      "waiver_approval_recorded")
        if not (has_reason and has_approval):
            _check(results, "paper_gate",
                   "waiver_reason_and_approval_documented",
                   reason, False, False,
                   "a paper-gate waiver requires a written reason "
                   "and an approval on record")
        else:
            _check(results, "paper_gate",
                   "waiver_reason_and_approval_documented",
                   reason, True,
                   reason is True and approval is True,
                   "quality gate: a conscious waiver carries a "
                   "written reason and an approval")
    else:
        _check(results, "paper_gate",
               "waiver_reason_and_approval_documented",
               waived, has_waived, True,
               "paper gate not waived — no waiver reason or "
               "approval is required")
    if has_waived and waived:
        _check(results, "paper_gate", "live_vs_model_behavior_compared",
               waived, True, True,
               "paper gate waived — the paper-phase live-vs-model "
               "comparison is discharged by the waiver")
    else:
        _bool_check(results, "paper_gate",
                    "live_vs_model_behavior_compared", manifest,
                    ("paper", "live_vs_model_compared"),
                    "paper gate: compare live vs model behavior "
                    "(slippage, signal timing) before scaling")


def _large_trade_check(results, manifest):
    """Computed house-gate check; returns True/False/None for >$500."""
    amount, has_amount = _get(manifest, "house_gates",
                              "max_planned_trade_usd")
    clear, has_clear = _get(manifest, "house_gates",
                            "clear_yes_for_trades_over_500")
    if not has_amount:
        _check(results, "live_monitoring_and_house_gates",
               "trades_over_500_have_clear_yes",
               amount, False, False,
               "no maximum planned trade size declared, so the "
               "$500 clear-yes gate cannot be checked")
        return None
    if not _is_number(amount):
        _check(results, "live_monitoring_and_house_gates",
               "trades_over_500_have_clear_yes",
               amount, True, False,
               "the maximum planned trade size must be a number")
        return None
    if amount <= LARGE_TRADE_THRESHOLD_USD:
        _check(results, "live_monitoring_and_house_gates",
               "trades_over_500_have_clear_yes",
               amount, True, True,
               "no trade over $500 declared — the clear-yes gate "
               "does not bind")
        return False
    if not has_clear:
        _check(results, "live_monitoring_and_house_gates",
               "trades_over_500_have_clear_yes",
               clear, False, False,
               "a trade over $500 is declared but no clear-yes "
               "evidence is declared")
        return True
    _check(results, "live_monitoring_and_house_gates",
           "trades_over_500_have_clear_yes",
           clear, True, clear is True,
           "house gate: >$500 trades need a clear yes")
    return True


def evaluate(manifest):
    """Return the verdict dict for a backtest-evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: harness_standards (skill method 1) ----
    _bool_check(results, "harness_standards", "deterministic_runs",
                manifest, ("harness", "deterministic_runs"),
                "harness standards: deterministic runs")
    _bool_check(results, "harness_standards",
                "data_snapshots_versioned", manifest,
                ("harness", "data_snapshots_versioned"),
                "harness standards: versioned data snapshots")
    _bool_check(results, "harness_standards",
                "point_in_time_universe_correct", manifest,
                ("harness", "point_in_time_universe"),
                "harness standards: correct point-in-time universes")
    _false_check(results, "harness_standards", "no_look_ahead",
                 manifest, ("harness", "look_ahead_used"),
                 "harness standards: no look-ahead — signals use "
                 "only what was known then")
    _bool_check(results, "harness_standards",
                "realistic_fills_modeled", manifest,
                ("harness", "realistic_fills_modeled"),
                "harness standards: realistic fills (next-open or "
                "worse for illiquid names)")

    # ---- Section 2: protocol_and_reporting (skill method 2 +
    #      quality gate: OOS + walk-forward with in-sample) ----
    _bool_check(results, "protocol_and_reporting",
                "hypothesis_stated_before_testing", manifest,
                ("protocol", "hypothesis_stated"),
                "protocol: hypothesis stated before in-sample "
                "development")
    _bool_check(results, "protocol_and_reporting",
                "in_sample_results_reported", manifest,
                ("protocol", "in_sample_reported"),
                "protocol: in-sample development results reported")
    _bool_check(results, "protocol_and_reporting",
                "out_of_sample_holdout_reported", manifest,
                ("protocol", "out_of_sample_reported"),
                "protocol: out-of-sample holdout results reported")
    _bool_check(results, "protocol_and_reporting",
                "holdout_untouched_until_end", manifest,
                ("protocol", "holdout_untouched_until_end"),
                "protocol: the out-of-sample holdout was untouched "
                "until the end")
    _bool_check(results, "protocol_and_reporting",
                "walk_forward_results_reported", manifest,
                ("protocol", "walk_forward_reported"),
                "protocol: walk-forward window results reported")
    _bool_check(results, "protocol_and_reporting",
                "all_three_reported_side_by_side", manifest,
                ("protocol", "reported_side_by_side"),
                "quality gate: OOS + walk-forward results reported "
                "with in-sample, side by side — all three, not "
                "just the shiny one")

    # ---- Section 3: costs_and_frictions (skill method 3 + red
    #      line: no skipped costs) ----
    _bool_check(results, "costs_and_frictions", "commissions_modeled",
                manifest, ("costs", "commissions_modeled"),
                "costs & frictions: commissions modeled from day "
                "one, not as an afterthought")
    _bool_check(results, "costs_and_frictions", "spreads_modeled",
                manifest, ("costs", "spreads_modeled"),
                "costs & frictions: spreads modeled")
    _bool_check(results, "costs_and_frictions", "slippage_modeled",
                manifest, ("costs", "slippage_modeled"),
                "costs & frictions: slippage modeled")
    _bool_check(results, "costs_and_frictions", "borrow_modeled",
                manifest, ("costs", "borrow_modeled"),
                "costs & frictions: borrow modeled")
    _bool_check(results, "costs_and_frictions", "financing_modeled",
                manifest, ("costs", "financing_modeled"),
                "costs & frictions: financing modeled")
    _taxes_check(results, manifest)
    _false_check(results, "costs_and_frictions", "no_skipped_costs",
                 manifest, ("costs", "costs_skipped"),
                 "skill red line: no skipped costs")

    # ---- Section 4: overfit_and_fragility (skill methods 4-5 +
    #      red line: no curve-fit parameters) ----
    _bool_check(results, "overfit_and_fragility",
                "parameter_sensitivity_shown", manifest,
                ("overfit", "parameter_sensitivity_shown"),
                "overfit detection: parameter sensitivity shown")
    _bool_check(results, "overfit_and_fragility",
                "sensitivity_shows_smooth_plateau_not_sharp_peak",
                manifest,
                ("overfit", "sensitivity_shows_smooth_plateau"),
                "overfit detection: sensitivity shows smooth "
                "plateaus, not sharp peaks — if it only works at "
                "exactly 14/3/7, it doesn't work")
    ratio = _ratio_check(results, manifest)
    _bool_check(results, "overfit_and_fragility",
                "best_of_n_trials_disclosed", manifest,
                ("overfit", "best_of_n_disclosed"),
                "overfit detection: \"best of N\" awareness — the "
                "number of trials the reported result was selected "
                "from is disclosed")
    _false_check(results, "overfit_and_fragility",
                 "no_curve_fit_parameters", manifest,
                 ("overfit", "curve_fit_parameters_used"),
                 "skill red line: no curve-fit parameters")
    _bool_check(results, "overfit_and_fragility",
                "single_name_dominance_checked", manifest,
                ("fragility", "single_name_dominance_checked"),
                "fragility checks: single-name dominance checked")
    _bool_check(results, "overfit_and_fragility",
                "regime_dependence_checked", manifest,
                ("fragility", "regime_dependence_checked"),
                "fragility checks: regime dependence checked "
                "(works only in bull markets?)")
    _bool_check(results, "overfit_and_fragility",
                "capacity_liquidity_checked", manifest,
                ("fragility", "capacity_liquidity_checked"),
                "fragility checks: capacity/liquidity checked "
                "(can the size actually trade?)")

    # ---- Section 5: paper_gate (skill method 6 + quality gate)
    _bool_check(results, "paper_gate",
                "paper_period_or_fill_count_defined", manifest,
                ("paper", "period_or_fill_count_defined"),
                "paper gate: paper-trade (or tiny size with "
                "explicit sign-off) for a defined period/fill "
                "count")
    _paper_checks(results, manifest)

    # ---- Section 6: live_monitoring_and_house_gates (skill
    #      methods 7-8 + quality gate: kill criteria; red line:
    #      no "the backtest says so") ----
    _bool_check(results, "live_monitoring_and_house_gates",
                "live_vs_backtest_divergence_tracked", manifest,
                ("monitoring", "divergence_tracked"),
                "live monitoring: live-vs-backtest divergence "
                "tracked")
    _bool_check(results, "live_monitoring_and_house_gates",
                "kill_criteria_defined_before_scaling", manifest,
                ("monitoring", "kill_criteria_defined_before_scaling"),
                "quality gate: kill criteria defined before "
                "scaling")
    _bool_check(results, "live_monitoring_and_house_gates",
                "kill_criteria_cover_drawdown_divergence_invalidation",
                manifest,
                ("monitoring", "kill_criteria_cover_all_three"),
                "live monitoring: kill criteria cover drawdown, "
                "divergence and invalidation, defined in advance")
    _bool_check(results, "live_monitoring_and_house_gates",
                "explicit_confirmation_for_live_trades", manifest,
                ("house_gates", "explicit_confirmation_for_live_trades"),
                "house gate: no live trade without explicit "
                "confirmation")
    over_500 = _large_trade_check(results, manifest)
    _false_check(results, "live_monitoring_and_house_gates",
                 "no_backtest_alone_as_live_confirmation", manifest,
                 ("house_gates", "backtest_used_as_sole_live_confirmation"),
                 "skill red line: no \"the backtest says so\" as a "
                 "substitute for live confirmation discipline")

    reported = sum(
        1 for key in ("in_sample_reported", "out_of_sample_reported",
                      "walk_forward_reported")
        if _get(manifest, "protocol", key)[0] is True
    )
    completed, _ = _get(manifest, "paper", "completed")
    waived, _ = _get(manifest, "paper", "waived")
    _, has_completed = _get(manifest, "paper", "completed")
    _, has_waived = _get(manifest, "paper", "waived")
    if completed is True:
        paper_gate_status = "completed"
    elif waived is True:
        paper_gate_status = "waived"
    elif has_completed or has_waived:
        paper_gate_status = "not_completed"
    else:
        paper_gate_status = None

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
        verdict = "NOT_VALIDATED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "VALIDATED"

    return {
        "service": "strategy-backtest-validation",
        "atom_version": "0.1.0",
        "strategy": manifest.get("strategy"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "results_sets_reported": reported,
        "params_to_data_ratio": _fmt4(ratio),
        "paper_gate_status": paper_gate_status,
        "over_500_trade_declared": over_500,
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
        "STRATEGY BACKTEST VALIDATION",
        f"strategy: {verdict.get('strategy')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: strategy_backtest_validation.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "VALIDATED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
