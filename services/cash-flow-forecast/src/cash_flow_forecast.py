#!/usr/bin/env python3
"""Cash-flow forecast — deterministic core.

Built from the bound skill `cash-flow-management` (v1): "Manage
cash deliberately — 13-week forecasts, inflow/outflow timing,
reserves, runway, working capital."

This atom does NOT produce a cash-flow forecast and exercises no
business judgment. The caller submits a cash-flow-forecast
manifest: one DECLARED cash-flow forecast artifact — its flow map
and lag assumptions, its declared 13-week buckets (opening
balance, weekly inflows / outflows and declared closing
balances), its reserve target, its working-capital and lever
record, its runway declaration, its stress record, and its
reporting record. The atom validates that artifact
deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- weekly closing balances (method step 2, the 13-week rolling
  forecast): each declared weekly closing balance must equal the
  opening balance plus the cumulative declared inflows minus
  outflows up to that week, and the forecast must declare exactly
  13 weekly buckets — the horizon the skill itself names;
- reserve target (method step 4: "minimum cash = X months of
  fixed costs"): the declared target amount must equal the
  declared months multiplied by the declared monthly fixed
  costs. The skill sizes X "to volatility" and states no number,
  so no minimum months is imposed — only the arithmetic is
  re-derived;
- runway (method step 6: "burn = net monthly outflow; runway =
  cash / burn"): the declared runway in months must equal the
  declared cash divided by the declared burn. The skill's 6/3
  month figures are alert thresholds (checked as a declaration
  that they are set), never a pass mark on the runway itself;
- stress coverage (method step 7): the declared stress cases
  must cover the three cases the skill names — revenue -20%,
  collections +30 days late, surprise capex. Whether the plan
  holds under stress is the caller's recorded answer, not this
  core's judgment; only that answers and responses are recorded
  is checked.

Computed amounts and ratios are serialized as strings with
exactly six decimal places, produced in both implementations by
the same fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The stress cases the skill
names but the artifact does not declare run are reported as
`stress_cases_not_run` (null when no list is declared). The
computed outcome over the five computed checks is reported as
`computed_status`.

Verdict:
- any fail             -> CASH_FLOW_FORECAST_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CASH_FLOW_FORECAST_READY

This is a completeness and consistency audit over declared
evidence, not financial advice and not a forecast review: an
artifact that declares every step passes even if its underlying
cash position is weak, and nothing here verifies that a declared
value is true, that the reserve is adequate, or that the plan
will hold.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "flows_and_lags",
    "thirteen_week_forecast",
    "reserves_and_runway",
    "working_capital_and_levers",
    "stress_tests",
    "reporting_and_commitments",
)

STATED_STRESS_CASES = [
    "revenue_minus_20_percent",
    "collections_plus_30_days_late",
    "surprise_capex",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the stress-case list entries) are validated
# as strings only, never enum-checked: coverage is a verdict
# check, not a type error.
MANIFEST_SPEC = {
    "entity": "string",
    "flows": {
        "recurring_inflows_mapped": "boolean",
        "recurring_outflows_mapped": "boolean",
        "seasonal_patterns_mapped": "boolean",
        "one_offs_mapped": "boolean",
        "lag_assumptions_documented": "boolean",
    },
    "forecast": {
        "opening_balance": "number",
        "weeks": [{
            "label": "string",
            "inflows": "number",
            "outflows": "number",
            "closing_balance": "number",
        }],
        "rolling_maintained_weekly": "boolean",
        "monthly_annual_planning_present": "boolean",
    },
    "reserves": {
        "target_set": "boolean",
        "monthly_fixed_costs": "number",
        "target_months": "number",
        "declared_target_amount": "number",
        "held_separately": "boolean",
        "breach_requires_explicit_decision": "boolean",
        "put_at_risk": "boolean",
    },
    "working_capital": {
        "ar_aging_reviewed_on_cadence": "boolean",
        "chase_ladder_applied": "boolean",
        "ap_calendar_maintained": "boolean",
        "inventory_only_where_it_pays": "boolean",
    },
    "levers": {
        "inflow_acceleration_applied": "boolean",
        "outflows_phased": "boolean",
        "vendors_used_as_silent_financing": "boolean",
    },
    "runway": {
        "cash_on_hand": "number",
        "burn": "number",
        "declared_runway_months": "number",
        "alert_thresholds_at_6_and_3_months_set": "boolean",
    },
    "stress": {
        "cases_run": ["string"],
        "answers_recorded": "boolean",
        "responses_predecided": "boolean",
    },
    "reporting": {
        "weekly_position_and_forecast_reported": "boolean",
        "monthly_summary_drivers_annotated": "boolean",
    },
    "commitments": {
        "committed_against_unlanded_receivables": "boolean",
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


def _forecast_checks(results, manifest):
    """Computed 13-week checks. Returns (weeks_evaluated,
    computed_final_balance, final_balance_difference)."""
    weeks, has_weeks = _get(manifest, "forecast", "weeks")
    opening, has_opening = _get(manifest, "forecast", "opening_balance")
    if not has_weeks or not isinstance(weeks, list) or not weeks:
        for name, evidence in (
            ("forecast_week_entries_complete",
             "no weekly forecast buckets declared"),
            ("forecast_covers_thirteen_weeks",
             "no weekly forecast buckets declared"),
            ("weekly_closing_balances_match_rederived",
             "no weekly forecast buckets declared"),
        ):
            _check(results, "thirteen_week_forecast", name,
                   weeks, False, False, evidence)
        return 0, None, None
    incomplete = False
    evaluated = 0
    balances_ok = True
    running = opening if _is_number(opening) else None
    last_closing = None
    for entry in weeks:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        label, has_label = _get(entry, "label")
        inflows, has_inflows = _get(entry, "inflows")
        outflows, has_outflows = _get(entry, "outflows")
        closing, has_closing = _get(entry, "closing_balance")
        if not (has_label and has_inflows and has_outflows
                and has_closing and _is_nonempty_str(label)
                and _is_number(inflows) and _is_number(outflows)
                and _is_number(closing)):
            incomplete = True
            continue
        evaluated += 1
        last_closing = closing
        if running is not None:
            running = running + inflows - outflows
            if _fmt6(closing - running) != "0.000000":
                balances_ok = False
    if incomplete:
        _check(results, "thirteen_week_forecast",
               "forecast_week_entries_complete",
               weeks, False, False,
               "a weekly bucket is missing its label, inflows, "
               "outflows, or closing balance")
    else:
        _check(results, "thirteen_week_forecast",
               "forecast_week_entries_complete",
               weeks, True, True,
               "every weekly bucket carries a label, inflows, "
               "outflows, and a closing balance")
    _check(results, "thirteen_week_forecast",
           "forecast_covers_thirteen_weeks",
           weeks, True, len(weeks) == 13,
           "method step 2: the rolling forecast declares exactly "
           "13 weekly buckets — the horizon the skill names")
    final_balance = None
    difference = None
    if incomplete or not _is_number(opening):
        _check(results, "thirteen_week_forecast",
               "weekly_closing_balances_match_rederived",
               weeks, False, False,
               "the opening balance or a weekly bucket is "
               "incomplete, so the closing balances cannot be "
               "re-derived")
    else:
        final_balance = running
        difference = last_closing - running
        _check(results, "thirteen_week_forecast",
               "weekly_closing_balances_match_rederived",
               weeks, True, balances_ok,
               "method step 2: each declared weekly closing "
               "balance equals the opening balance plus cumulative "
               "declared inflows minus outflows")
    return evaluated, final_balance, difference


def evaluate(manifest):
    """Return the verdict dict for a cash-flow-forecast manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: flows_and_lags (skill method step 1: "Map
    #      the flows: recurring in/out, seasonal patterns,
    #      one-offs — and the lag structure (payment terms,
    #      receivable days, settlement delays)"; quality gate:
    #      "lag assumptions documented") ----
    _bool_check(results, "flows_and_lags", "recurring_inflows_mapped",
                manifest, ("flows", "recurring_inflows_mapped"),
                "method step 1: recurring inflows are mapped")
    _bool_check(results, "flows_and_lags", "recurring_outflows_mapped",
                manifest, ("flows", "recurring_outflows_mapped"),
                "method step 1: recurring outflows are mapped")
    _bool_check(results, "flows_and_lags", "seasonal_patterns_mapped",
                manifest, ("flows", "seasonal_patterns_mapped"),
                "method step 1: seasonal patterns are mapped")
    _bool_check(results, "flows_and_lags", "one_offs_mapped",
                manifest, ("flows", "one_offs_mapped"),
                "method step 1: one-off flows are mapped")
    _bool_check(results, "flows_and_lags", "lag_assumptions_documented",
                manifest, ("flows", "lag_assumptions_documented"),
                "quality gate: lag assumptions are documented — "
                "payment terms, receivable days, settlement delays")

    # ---- Section 2: thirteen_week_forecast (skill method step 2:
    #      "13-week rolling forecast: weekly buckets for near-term
    #      cash; monthly/annual for planning; update weekly";
    #      quality gate: "Rolling forecast maintained weekly") ----
    weeks_evaluated, final_balance, final_difference = \
        _forecast_checks(results, manifest)
    _bool_check(results, "thirteen_week_forecast",
                "rolling_forecast_maintained_weekly",
                manifest, ("forecast", "rolling_maintained_weekly"),
                "quality gate: the rolling forecast is maintained "
                "weekly — stale forecasts cause surprises only")
    _bool_check(results, "thirteen_week_forecast",
                "monthly_annual_planning_present",
                manifest,
                ("forecast", "monthly_annual_planning_present"),
                "method step 2: monthly/annual buckets are kept "
                "for planning alongside the weekly near-term "
                "forecast")

    # ---- Section 3: reserves_and_runway (skill method step 4:
    #      "Reserve targets: minimum cash = X months of fixed
    #      costs; held separately; only breached by explicit
    #      decision"; quality gate: "Reserve target set and
    #      separated; breaches require explicit decisions"; red
    #      line: "reserves never put at risk"; method step 6:
    #      "burn = net monthly outflow; runway = cash / burn;
    #      alert thresholds at 6/3 months") ----
    _bool_check(results, "reserves_and_runway", "reserve_target_set",
                manifest, ("reserves", "target_set"),
                "quality gate: a reserve target is set")
    monthly, has_monthly = _get(manifest, "reserves",
                                "monthly_fixed_costs")
    months, has_months = _get(manifest, "reserves", "target_months")
    declared_amt, has_amt = _get(manifest, "reserves",
                                 "declared_target_amount")
    reserve_all_numbers = (
        has_monthly and has_months and has_amt
        and _is_number(monthly) and _is_number(months)
        and _is_number(declared_amt)
    )
    computed_reserve = (
        months * monthly
        if has_monthly and has_months and _is_number(monthly)
        and _is_number(months)
        else None
    )
    reserve_difference = (
        declared_amt - computed_reserve
        if computed_reserve is not None and has_amt
        and _is_number(declared_amt)
        else None
    )
    reserve_consistent = (
        reserve_all_numbers
        and _fmt6(declared_amt - months * monthly) == "0.000000"
    )
    _check(results, "reserves_and_runway",
           "reserve_target_amount_matches_months_times_fixed_costs",
           declared_amt, reserve_all_numbers, reserve_consistent,
           "method step 4: the declared reserve target amount "
           "equals the declared months of fixed costs multiplied "
           "by the declared monthly fixed costs (minimum cash = "
           "X months of fixed costs; X itself is sized to "
           "volatility and is not judged here)")
    _bool_check(results, "reserves_and_runway",
                "reserve_held_separately",
                manifest, ("reserves", "held_separately"),
                "quality gate: the reserve is held separately from "
                "operating cash")
    _bool_check(results, "reserves_and_runway",
                "reserve_breach_requires_explicit_decision",
                manifest,
                ("reserves", "breach_requires_explicit_decision"),
                "quality gate: the reserve is only breached by "
                "explicit decision")
    _false_check(results, "reserves_and_runway",
                 "reserves_not_put_at_risk",
                 manifest, ("reserves", "put_at_risk"),
                 "red line: reserves are never put at risk")
    cash, has_cash = _get(manifest, "runway", "cash_on_hand")
    burn, has_burn = _get(manifest, "runway", "burn")
    declared_runway, has_runway = _get(
        manifest, "runway", "declared_runway_months")
    runway_all_numbers = (
        has_cash and has_burn and has_runway
        and _is_number(cash) and _is_number(burn)
        and _is_number(declared_runway)
    )
    computed_runway = (
        cash / burn
        if has_cash and has_burn and _is_number(cash)
        and _is_number(burn) and burn > 0
        else None
    )
    runway_difference = (
        declared_runway - computed_runway
        if computed_runway is not None and has_runway
        and _is_number(declared_runway)
        else None
    )
    runway_consistent = (
        runway_all_numbers and burn > 0
        and _fmt6(declared_runway - cash / burn) == "0.000000"
    )
    _check(results, "reserves_and_runway",
           "runway_matches_cash_divided_by_burn",
           declared_runway, runway_all_numbers, runway_consistent,
           "method step 6: the declared runway equals the "
           "declared cash divided by the declared burn (burn = "
           "net monthly outflow; runway = cash / burn)")
    _bool_check(results, "reserves_and_runway",
                "runway_alert_thresholds_at_6_and_3_months_set",
                manifest,
                ("runway", "alert_thresholds_at_6_and_3_months_set"),
                "method step 6: alert thresholds are set at 6 and "
                "3 months of runway")

    # ---- Section 4: working_capital_and_levers (skill method
    #      step 5: "Working capital: AR aging review on schedule,
    #      AP calendar, inventory only where it pays"; quality
    #      gate: "AR aging reviewed on cadence; chase ladder
    #      applied"; method step 3: "Levers, used honestly:
    #      accelerate inflows, phase outflows — never by stiffing
    #      obligations quietly"; red line: "never use vendors as
    #      silent financing") ----
    _bool_check(results, "working_capital_and_levers",
                "ar_aging_reviewed_on_cadence",
                manifest,
                ("working_capital", "ar_aging_reviewed_on_cadence"),
                "quality gate: AR aging is reviewed on cadence — "
                "who owes what")
    _bool_check(results, "working_capital_and_levers",
                "chase_ladder_applied",
                manifest, ("working_capital", "chase_ladder_applied"),
                "quality gate: the chase ladder is applied to "
                "receivables")
    _bool_check(results, "working_capital_and_levers",
                "ap_calendar_maintained",
                manifest,
                ("working_capital", "ap_calendar_maintained"),
                "method step 5: an AP calendar is maintained — "
                "discounts vs float")
    _bool_check(results, "working_capital_and_levers",
                "inventory_only_where_it_pays",
                manifest,
                ("working_capital", "inventory_only_where_it_pays"),
                "method step 5: inventory is held only where it "
                "pays")
    _bool_check(results, "working_capital_and_levers",
                "inflow_levers_applied_honestly",
                manifest, ("levers", "inflow_acceleration_applied"),
                "method step 3: inflows are accelerated honestly "
                "— invoicing discipline, deposits, follow-up "
                "cadence")
    _bool_check(results, "working_capital_and_levers",
                "outflow_levers_phased",
                manifest, ("levers", "outflows_phased"),
                "method step 3: outflows are phased — terms, batch "
                "purchases, timing")
    _false_check(results, "working_capital_and_levers",
                 "vendors_not_used_as_silent_financing",
                 manifest,
                 ("levers", "vendors_used_as_silent_financing"),
                 "red line: vendors are never used as silent "
                 "financing — obligations are never stiffed quietly")

    # ---- Section 5: stress_tests (skill method step 7: "Stress
    #      it: revenue -20%, collections +30 days late, surprise
    #      capex — does the plan hold? Record answers +
    #      responses"; quality gate: "Stress cases run and
    #      responses pre-decided") ----
    cases, has_cases = _get(manifest, "stress", "cases_run")
    cases_is_list = has_cases and isinstance(cases, list)
    not_run = (
        [c for c in STATED_STRESS_CASES if c not in cases]
        if cases_is_list else None
    )
    _check(results, "stress_tests", "stress_cases_cover_stated_cases",
           cases, cases_is_list,
           cases_is_list and len(not_run) == 0,
           "method step 7: the stress cases run cover every case "
           "the skill names — revenue -20%, collections +30 days "
           "late, surprise capex")
    _bool_check(results, "stress_tests", "stress_answers_recorded",
                manifest, ("stress", "answers_recorded"),
                "method step 7: the stress answers are recorded — "
                "does the plan hold, case by case")
    _bool_check(results, "stress_tests", "stress_responses_predecided",
                manifest, ("stress", "responses_predecided"),
                "quality gate: stress responses are pre-decided")

    # ---- Section 6: reporting_and_commitments (skill method
    #      step 8: "Report: weekly cash position + short forecast;
    #      monthly summary with drivers annotated"; red line: "No
    #      commitments against expected receivables that haven't
    #      landed") ----
    _bool_check(results, "reporting_and_commitments",
                "weekly_position_and_forecast_reported",
                manifest,
                ("reporting", "weekly_position_and_forecast_reported"),
                "method step 8: the weekly cash position and short "
                "forecast are reported")
    _bool_check(results, "reporting_and_commitments",
                "monthly_summary_drivers_annotated",
                manifest,
                ("reporting", "monthly_summary_drivers_annotated"),
                "method step 8: the monthly summary is reported "
                "with drivers annotated")
    _false_check(results, "reporting_and_commitments",
                 "no_commitments_against_unlanded_receivables",
                 manifest,
                 ("commitments",
                  "committed_against_unlanded_receivables"),
                 "red line: no commitments against expected "
                 "receivables that haven't landed")

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
        verdict = "CASH_FLOW_FORECAST_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CASH_FLOW_FORECAST_READY"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "forecast_covers_thirteen_weeks",
            "weekly_closing_balances_match_rederived",
            "reserve_target_amount_matches_months_times_fixed_costs",
            "runway_matches_cash_divided_by_burn",
            "stress_cases_cover_stated_cases")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "cash-flow-forecast",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "weeks_evaluated": weeks_evaluated,
        "computed_final_balance": _fmt6(final_balance),
        "final_balance_difference": _fmt6(final_difference),
        "computed_reserve_target": _fmt6(computed_reserve),
        "reserve_target_difference": _fmt6(reserve_difference),
        "computed_runway_months": _fmt6(computed_runway),
        "runway_difference": _fmt6(runway_difference),
        "stress_cases_not_run": not_run,
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
        "CASH-FLOW FORECAST",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: cash_flow_forecast.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CASH_FLOW_FORECAST_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
