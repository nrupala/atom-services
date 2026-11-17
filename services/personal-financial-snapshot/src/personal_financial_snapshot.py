#!/usr/bin/env python3
"""Personal financial snapshot — deterministic core.

Built from the bound skill `financial-analytics` (v1):
"Institutional-grade personal financial analytics (PAE)" —
"A clear snapshot of your financial life — net worth, where
money flows, liquidity, and risk — analyzed the way
institutions analyze, sized for a person." The skill's own
rules govern this atom: "Educational only — not financial
advice, no buy/sell recommendations"; "Show the math; every
claim traces to a number"; "Costs compound against you —
always surface fees and drag."

This atom audits a DECLARED personal financial snapshot
record: the snapshot declarations (as-of date, currency, net
worth, allocation and cash flow stated, cash-flow period
stated), the declared asset and liability rows and figures,
the declared cash-flow figures for the stated period, the
four lenses the skill names (risk, liquidity, tax-efficiency,
time horizon), the declared fee rows and fees total, the
traceability record (math shown, every claim traces to a
number, the educational-only boundary stated), and the
advice-boundary red lines. It does NOT produce a snapshot
itself, produce financial advice, recommendations or
projections, rank actions, run scenarios, or verify that a
declared figure is true — it checks that the snapshot record
the skill requires is present and internally complete and
consistent on the declared evidence. The skill's "Scenarios"
and "Actions — ranked by impact" steps are advice- and
projection-shaped material: this atom covers only the
record-completeness / consistency ground, and the presence
of a scenario, a projection or a ranked action
recommendation in the declared record is a red-line failure,
not a deliverable.

Distinct ground: the nearest deployed siblings are
`cash-flow-forecast` (bound skill `cash-flow-management`),
which validates a declared BUSINESS cash-flow forecast
artifact — 13-week weekly buckets, reserve target, runway,
working capital, stress cases — and `budget-design-review`
(bound skill `budgeting`), which reviews a declared budget
DESIGN — its lines, owners, driver products, balance against
expected income, contingency, approval and monitoring. This
atom shares ZERO checks with either: every check here is a
personal snapshot question — net worth stated and re-derived
as declared assets minus declared liabilities, asset rows
summing to the declared asset total, liability rows summing
to the declared liability total, the declared net cash flow
re-derived as period income minus period expenses, the four
personal lenses stated, fee rows summing to the declared
fees-and-drag total, every claim tracing to a number, and no
advice, recommendation, projection or ranked action in the
record. The boundary is: a personal snapshot as it is, here;
a business forecast of future weeks there (cash-flow-
forecast); a budget design for future spending there
(budget-design-review). The portfolio atoms
(`portfolio-risk-analytics-report`,
`reconciled-portfolio-performance-report`) compute risk and
performance analytics over a portfolio's returns and holdings
— this atom computes no return, risk metric or performance
figure at all.

The caller submits a snapshot manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the arithmetic / internal consistency of the declared
figures themselves — no outside threshold is imported:

- asset rows: the declared asset rows must be present and
  non-empty, every row complete (name, allocation category
  and amount), no asset name duplicated, and the row amounts
  must sum to the declared total assets (the skill: the
  snapshot states net worth and allocation "as they are");
- liability rows: the declared liability list must be
  present (an empty list is a declared zero — a snapshot
  with no liabilities — not missing evidence), every row
  complete, no liability name duplicated, and the row
  amounts must sum to the declared total liabilities;
- net worth: the declared net worth must equal the declared
  total assets minus the declared total liabilities (the
  skill's snapshot quantity, re-derived from the declared
  figures themselves);
- cash flow: the declared net cash flow must equal the
  declared period income minus the declared period expenses
  for the stated period (the skill: "where money flows");
- fees and drag: the declared fee list must be present (an
  empty list is a declared none), every row complete, no fee
  name duplicated, and the row amounts must sum to the
  declared annual fees-and-drag total (the skill: "always
  surface fees and drag").

Computed amounts are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; computed
comparisons compare the fixed-6dp difference to zero. That
fixed serialization is what makes the Python and TypeScript
outputs byte-identical. Counts are reported as integers
(exact).

The skill states no numeric threshold — no savings-rate bar,
no net-worth target, no liquidity months-of-expenses bar, no
debt ratio cutoff, no allocation percentage, no fee cap — so
no numeric threshold check is invented; those quantities are
computed and reported, with completeness and arithmetic
consistency over the caller's own declared figures as the
only bars, exactly as stated above.

Verdict:
- any fail             -> SNAPSHOT_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SNAPSHOT_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism
is the product.
"""
import json
import math
import sys

SECTIONS = (
    "snapshot_completeness",
    "balance_sheet_arithmetic",
    "cash_flow_and_fees_arithmetic",
    "lenses_and_costs",
    "traceability_and_advice_boundary",
)

MANIFEST_SPEC = {
    "subject": "string",
    "snapshot": {
        "as_of_date_stated": "boolean",
        "currency_stated": "boolean",
        "net_worth_stated": "boolean",
        "allocation_stated": "boolean",
        "cash_flow_stated": "boolean",
        "cash_flow_period_stated": "boolean",
    },
    "figures": {
        "total_assets": "number",
        "total_liabilities": "number",
        "net_worth": "number",
        "period_income": "number",
        "period_expenses": "number",
        "net_cash_flow": "number",
        "annual_fees_and_drag_total": "number",
    },
    "assets": [{
        "name": "string",
        "category": "string",
        "amount": "number",
    }],
    "liabilities": [{
        "name": "string",
        "amount": "number",
    }],
    "fees": [{
        "name": "string",
        "amount": "number",
    }],
    "lenses": {
        "risk_lens_stated": "boolean",
        "liquidity_lens_stated": "boolean",
        "tax_efficiency_lens_stated": "boolean",
        "time_horizon_lens_stated": "boolean",
    },
    "costs": {
        "fees_and_drag_surfaced": "boolean",
        "fees_and_drag_total_stated": "boolean",
    },
    "traceability": {
        "math_shown": "boolean",
        "every_claim_traces_to_a_number": "boolean",
        "educational_only_boundary_stated": "boolean",
    },
    "red_lines": {
        "buy_or_sell_recommendation_present": "boolean",
        "personalised_financial_advice_present": "boolean",
        "projection_or_scenario_present": "boolean",
        "ranked_action_recommendations_present": "boolean",
        "claim_without_traced_number_present": "boolean",
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


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


def _rows(manifest, field):
    rows, has = _get(manifest, field)
    is_list = has and isinstance(rows, list)
    return (rows if is_list else []), is_list


def _duplicates(rows):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get("name"), str):
            nm = c["name"]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _row_sum(rows):
    if all(isinstance(c, dict) and _is_number(c.get("amount"))
           for c in rows):
        return sum(c["amount"] for c in rows)
    return None


def evaluate(manifest):
    """Return the verdict dict for a personal financial snapshot manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows and figures, read once ----
    assets, assets_is_list = _rows(manifest, "assets")
    liabilities, liabilities_is_list = _rows(manifest, "liabilities")
    fees, fees_is_list = _rows(manifest, "fees")
    assets_count = len(assets) if assets_is_list else None
    liabilities_count = len(liabilities) if liabilities_is_list else None
    fees_count = len(fees) if fees_is_list else None

    duplicate_asset_names = _duplicates(assets) if assets_is_list else None
    duplicate_liability_names = (
        _duplicates(liabilities) if liabilities_is_list else None)
    duplicate_fee_names = _duplicates(fees) if fees_is_list else None

    computed_asset_total = _row_sum(assets) if assets_is_list else None
    computed_liability_total = (
        _row_sum(liabilities) if liabilities_is_list else None)
    computed_fees_total = _row_sum(fees) if fees_is_list else None

    total_assets, has_total_assets = _get(manifest, "figures", "total_assets")
    total_liabilities, has_total_liabilities = _get(
        manifest, "figures", "total_liabilities")
    net_worth, has_net_worth = _get(manifest, "figures", "net_worth")
    period_income, has_period_income = _get(
        manifest, "figures", "period_income")
    period_expenses, has_period_expenses = _get(
        manifest, "figures", "period_expenses")
    net_cash_flow, has_net_cash_flow = _get(
        manifest, "figures", "net_cash_flow")
    fees_total, has_fees_total = _get(
        manifest, "figures", "annual_fees_and_drag_total")

    asset_total_difference = (
        total_assets - computed_asset_total
        if has_total_assets and _is_number(total_assets)
        and computed_asset_total is not None else None)
    liability_total_difference = (
        total_liabilities - computed_liability_total
        if has_total_liabilities and _is_number(total_liabilities)
        and computed_liability_total is not None else None)
    net_worth_difference = (
        net_worth - (total_assets - total_liabilities)
        if has_net_worth and has_total_assets and has_total_liabilities
        and _is_number(net_worth) and _is_number(total_assets)
        and _is_number(total_liabilities) else None)
    computed_net_cash_flow = (
        period_income - period_expenses
        if has_period_income and has_period_expenses
        and _is_number(period_income) and _is_number(period_expenses)
        else None)
    net_cash_flow_difference = (
        net_cash_flow - computed_net_cash_flow
        if has_net_cash_flow and _is_number(net_cash_flow)
        and computed_net_cash_flow is not None else None)
    fees_total_difference = (
        fees_total - computed_fees_total
        if has_fees_total and _is_number(fees_total)
        and computed_fees_total is not None else None)

    # ---- Section 1: snapshot_completeness (skill step 1
    #      "Snapshot — net worth, allocation, cash flow as they
    #      are": the snapshot record states its as-of date, its
    #      currency, its net worth, its allocation, its cash
    #      flow, and the period that cash flow covers) ----
    _bool_check(results, "snapshot_completeness",
                "as_of_date_stated", manifest,
                ("snapshot", "as_of_date_stated"),
                "snapshot: the as-of date of the snapshot is stated — "
                "the snapshot is as it is at a stated point in time")
    _bool_check(results, "snapshot_completeness",
                "currency_stated", manifest,
                ("snapshot", "currency_stated"),
                "snapshot: the currency of the declared figures is "
                "stated")
    _bool_check(results, "snapshot_completeness",
                "net_worth_stated", manifest,
                ("snapshot", "net_worth_stated"),
                "snapshot: net worth is stated")
    _bool_check(results, "snapshot_completeness",
                "allocation_stated", manifest,
                ("snapshot", "allocation_stated"),
                "snapshot: allocation — where the assets sit — is "
                "stated")
    _bool_check(results, "snapshot_completeness",
                "cash_flow_stated", manifest,
                ("snapshot", "cash_flow_stated"),
                "snapshot: cash flow — where money flows — is stated")
    _bool_check(results, "snapshot_completeness",
                "cash_flow_period_stated", manifest,
                ("snapshot", "cash_flow_period_stated"),
                "snapshot: the period the declared cash flow covers "
                "is stated")

    # ---- Section 2: balance_sheet_arithmetic (the declared
    #      asset and liability rows, and the net-worth figure
    #      re-derived from the declared figures themselves) ----
    _check(results, "balance_sheet_arithmetic",
           "assets_declared", assets, assets_is_list,
           assets_is_list and assets_count > 0,
           "the declared record names its assets — the assets list "
           "is present and non-empty")
    asset_fields_present = (
        assets_is_list
        and all(isinstance(c, dict) and "name" in c and "category" in c
                and "amount" in c for c in assets))
    _check(results, "balance_sheet_arithmetic",
           "every_asset_row_complete", assets, asset_fields_present,
           assets_is_list and assets_count > 0
           and all(isinstance(c, dict)
                   and isinstance(c.get("name"), str)
                   and c.get("name") != ""
                   and isinstance(c.get("category"), str)
                   and c.get("category") != ""
                   and _is_number(c.get("amount"))
                   for c in assets),
           "allocation: every declared asset row carries a name, "
           "an allocation category and an amount")
    asset_names_present = (
        assets_is_list
        and all(isinstance(c, dict) and "name" in c for c in assets))
    _check(results, "balance_sheet_arithmetic",
           "no_asset_name_duplicated", assets, asset_names_present,
           assets_is_list and duplicate_asset_names is not None
           and len(duplicate_asset_names) == 0,
           "asset rows: no declared asset name is owned by more "
           "than one asset row")
    asset_sum_present = (
        assets_is_list and computed_asset_total is not None
        and has_total_assets and _is_number(total_assets))
    _check(results, "balance_sheet_arithmetic",
           "asset_rows_sum_matches_declared_total_assets", assets,
           asset_sum_present,
           asset_sum_present
           and _fmt6(total_assets - computed_asset_total) == "0.000000",
           "snapshot arithmetic: the declared asset row amounts sum "
           "to the declared total assets")
    _check(results, "balance_sheet_arithmetic",
           "liabilities_declared", liabilities, liabilities_is_list,
           liabilities_is_list,
           "the declared record names its liabilities — the "
           "liabilities list is present; an empty list is a declared "
           "zero, not missing evidence")
    liability_fields_present = (
        liabilities_is_list
        and all(isinstance(c, dict) and "name" in c and "amount" in c
                for c in liabilities))
    _check(results, "balance_sheet_arithmetic",
           "every_liability_row_complete", liabilities,
           liability_fields_present,
           liabilities_is_list
           and all(isinstance(c, dict)
                   and isinstance(c.get("name"), str)
                   and c.get("name") != ""
                   and _is_number(c.get("amount"))
                   for c in liabilities),
           "every declared liability row carries a name and an "
           "amount")
    liability_names_present = (
        liabilities_is_list
        and all(isinstance(c, dict) and "name" in c for c in liabilities))
    _check(results, "balance_sheet_arithmetic",
           "no_liability_name_duplicated", liabilities,
           liability_names_present,
           liabilities_is_list and duplicate_liability_names is not None
           and len(duplicate_liability_names) == 0,
           "liability rows: no declared liability name is owned by "
           "more than one liability row")
    liability_sum_present = (
        liabilities_is_list and computed_liability_total is not None
        and has_total_liabilities and _is_number(total_liabilities))
    _check(results, "balance_sheet_arithmetic",
           "liability_rows_sum_matches_declared_total_liabilities",
           liabilities, liability_sum_present,
           liability_sum_present
           and _fmt6(total_liabilities - computed_liability_total)
           == "0.000000",
           "snapshot arithmetic: the declared liability row amounts "
           "sum to the declared total liabilities")
    net_worth_present = (
        has_total_assets and has_total_liabilities and has_net_worth
        and _is_number(total_assets) and _is_number(total_liabilities)
        and _is_number(net_worth))
    _check(results, "balance_sheet_arithmetic",
           "declared_net_worth_matches_assets_minus_liabilities",
           net_worth, net_worth_present,
           net_worth_present
           and _fmt6(net_worth - (total_assets - total_liabilities))
           == "0.000000",
           "snapshot arithmetic: the declared net worth equals the "
           "declared total assets minus the declared total "
           "liabilities")

    # ---- Section 3: cash_flow_and_fees_arithmetic (the
    #      declared net cash flow re-derived from the declared
    #      period figures; the declared fee rows re-derived
    #      against the declared fees-and-drag total) ----
    cash_flow_present = (
        has_period_income and has_period_expenses and has_net_cash_flow
        and _is_number(period_income) and _is_number(period_expenses)
        and _is_number(net_cash_flow))
    _check(results, "cash_flow_and_fees_arithmetic",
           "declared_net_cash_flow_matches_income_minus_expenses",
           net_cash_flow, cash_flow_present,
           cash_flow_present
           and _fmt6(net_cash_flow - (period_income - period_expenses))
           == "0.000000",
           "cash-flow arithmetic: the declared net cash flow equals "
           "the declared period income minus the declared period "
           "expenses")
    _check(results, "cash_flow_and_fees_arithmetic",
           "fees_declared", fees, fees_is_list,
           fees_is_list,
           "the declared record names its fees — the fees list is "
           "present; an empty list is a declared none, not missing "
           "evidence")
    fee_fields_present = (
        fees_is_list
        and all(isinstance(c, dict) and "name" in c and "amount" in c
                for c in fees))
    _check(results, "cash_flow_and_fees_arithmetic",
           "every_fee_row_complete", fees, fee_fields_present,
           fees_is_list
           and all(isinstance(c, dict)
                   and isinstance(c.get("name"), str)
                   and c.get("name") != ""
                   and _is_number(c.get("amount"))
                   for c in fees),
           "every declared fee row carries a name and an amount")
    fee_names_present = (
        fees_is_list
        and all(isinstance(c, dict) and "name" in c for c in fees))
    _check(results, "cash_flow_and_fees_arithmetic",
           "no_fee_name_duplicated", fees, fee_names_present,
           fees_is_list and duplicate_fee_names is not None
           and len(duplicate_fee_names) == 0,
           "fee rows: no declared fee name is owned by more than "
           "one fee row")
    fee_sum_present = (
        fees_is_list and computed_fees_total is not None
        and has_fees_total and _is_number(fees_total))
    _check(results, "cash_flow_and_fees_arithmetic",
           "fee_rows_sum_matches_declared_fees_total", fees,
           fee_sum_present,
           fee_sum_present
           and _fmt6(fees_total - computed_fees_total) == "0.000000",
           "costs arithmetic: the declared fee row amounts sum to "
           "the declared annual fees-and-drag total")

    # ---- Section 4: lenses_and_costs (skill step 2 "Lenses —
    #      risk, liquidity, tax-efficiency, time horizon", each
    #      stated for this snapshot; skill rule "Costs compound
    #      against you — always surface fees and drag") ----
    _bool_check(results, "lenses_and_costs",
                "risk_lens_stated", manifest,
                ("lenses", "risk_lens_stated"),
                "lenses: the risk lens is stated for this snapshot")
    _bool_check(results, "lenses_and_costs",
                "liquidity_lens_stated", manifest,
                ("lenses", "liquidity_lens_stated"),
                "lenses: the liquidity lens is stated for this "
                "snapshot")
    _bool_check(results, "lenses_and_costs",
                "tax_efficiency_lens_stated", manifest,
                ("lenses", "tax_efficiency_lens_stated"),
                "lenses: the tax-efficiency lens is stated for this "
                "snapshot")
    _bool_check(results, "lenses_and_costs",
                "time_horizon_lens_stated", manifest,
                ("lenses", "time_horizon_lens_stated"),
                "lenses: the time-horizon lens is stated for this "
                "snapshot")
    _bool_check(results, "lenses_and_costs",
                "fees_and_drag_surfaced", manifest,
                ("costs", "fees_and_drag_surfaced"),
                "costs: fees and drag are surfaced — costs compound "
                "against you, so they are always surfaced")
    _bool_check(results, "lenses_and_costs",
                "fees_and_drag_total_stated", manifest,
                ("costs", "fees_and_drag_total_stated"),
                "costs: a total for fees and drag is stated")

    # ---- Section 5: traceability_and_advice_boundary (skill
    #      rules: "Show the math; every claim traces to a
    #      number"; "Educational only — not financial advice,
    #      no buy/sell recommendations"; the skill's scenario
    #      and ranked-action material is advice/projection-
    #      shaped and is refused in a snapshot record) ----
    _bool_check(results, "traceability_and_advice_boundary",
                "math_shown", manifest,
                ("traceability", "math_shown"),
                "traceability: the math is shown — every figure in "
                "the snapshot can be followed to its derivation")
    _bool_check(results, "traceability_and_advice_boundary",
                "every_claim_traces_to_a_number", manifest,
                ("traceability", "every_claim_traces_to_a_number"),
                "traceability: every claim in the snapshot traces "
                "to a number")
    _bool_check(results, "traceability_and_advice_boundary",
                "educational_only_boundary_stated", manifest,
                ("traceability", "educational_only_boundary_stated"),
                "boundary: the record states it is educational "
                "only — not financial advice")
    _false_check(results, "traceability_and_advice_boundary",
                 "no_buy_or_sell_recommendation", manifest,
                 ("red_lines", "buy_or_sell_recommendation_present"),
                 "red line: no buy/sell recommendation is present "
                 "in the snapshot record")
    _false_check(results, "traceability_and_advice_boundary",
                 "no_personalised_financial_advice", manifest,
                 ("red_lines", "personalised_financial_advice_present"),
                 "red line: no personalised financial advice is "
                 "present in the snapshot record — educational only")
    _false_check(results, "traceability_and_advice_boundary",
                 "no_projection_or_scenario", manifest,
                 ("red_lines", "projection_or_scenario_present"),
                 "red line: no projection or scenario is present "
                 "in the snapshot record — the snapshot is as it "
                 "is, not a forecast")
    _false_check(results, "traceability_and_advice_boundary",
                 "no_ranked_action_recommendations", manifest,
                 ("red_lines",
                  "ranked_action_recommendations_present"),
                 "red line: no ranked action recommendations are "
                 "present in the snapshot record")
    _false_check(results, "traceability_and_advice_boundary",
                 "no_claim_without_traced_number", manifest,
                 ("red_lines", "claim_without_traced_number_present"),
                 "red line: no claim without a traced number is "
                 "present in the snapshot record")

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
        verdict = "SNAPSHOT_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SNAPSHOT_SOUND"

    computed_names = (
        "assets_declared",
        "asset_rows_sum_matches_declared_total_assets",
        "liability_rows_sum_matches_declared_total_liabilities",
        "declared_net_worth_matches_assets_minus_liabilities",
        "declared_net_cash_flow_matches_income_minus_expenses",
        "fee_rows_sum_matches_declared_fees_total",
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
        "service": "personal-financial-snapshot",
        "atom_version": "0.1.0",
        "subject": manifest.get("subject"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "assets_count": assets_count,
        "computed_asset_total": _fmt6(computed_asset_total),
        "asset_total_difference": _fmt6(asset_total_difference),
        "duplicate_asset_names": duplicate_asset_names,
        "liabilities_count": liabilities_count,
        "computed_liability_total": _fmt6(computed_liability_total),
        "liability_total_difference": _fmt6(liability_total_difference),
        "duplicate_liability_names": duplicate_liability_names,
        "net_worth_difference": _fmt6(net_worth_difference),
        "computed_net_cash_flow": _fmt6(computed_net_cash_flow),
        "net_cash_flow_difference": _fmt6(net_cash_flow_difference),
        "fees_count": fees_count,
        "computed_fees_total": _fmt6(computed_fees_total),
        "fees_total_difference": _fmt6(fees_total_difference),
        "duplicate_fee_names": duplicate_fee_names,
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
        "PERSONAL FINANCIAL SNAPSHOT",
        f"subject: {verdict.get('subject')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: personal_financial_snapshot.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SNAPSHOT_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
