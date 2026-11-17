# Finance tool design advisory — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing a finance tool that should make people smarter about money without crossing into advice, and you have a record of how that tool was designed. This atom reads one declared manifest and returns one deterministic verdict across five sections: **FINANCE_TOOL_DESIGN_SOUND**, **FINANCE_TOOL_DESIGN_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it designs no tool, runs no calculation, reads no market data, probes no live product, and does not verify that a declared control actually works. A design is sound *on your declared evidence*: it never judges whether the quant formulas are correct, whether a risk measure is the right one for a feature, whether language in a real interface actually implies advice, whether a backtest is really overfit, or whether the business model is viable. Computed checks: the declared `features` list must be present and non-empty; every feature row must show scenarios and trade-offs, must not imply advice, and must have traceable figures; and every row declared as a backtest must declare overfit and survivorship bias addressed. The margin-disclosure check is conditional: it is required only when `margin.margin_features_present` is declared `true`; otherwise it passes as not applicable. No numeric threshold is imposed — no VaR or CVaR confidence level or horizon, no volatility, drawdown, Sharpe or Sortino cutoff, no position-size percentage or rebalancing band, no correlation threshold, no fee/tax/slippage allowance, no backtest length or significance bar, and no coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "finance-tool-design-advisory"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/finance-tool-design-advisory` — tool name `finance_tool_design_advisory`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/finance-tool-design-advisory` — body = the manifest object; same `Authorization` header.

## Input — the finance-tool-design manifest

| Field | Meaning |
|---|---|
| `tool` | tool name (string; carried into the output, not checked) |
| `compliance.tool_calculates_user_decides` | compliance evidence: the tool calculates, the user decides |
| `compliance.recommendation_language_present` | must be `false` to pass (compliance line: no recommendation language) |
| `compliance.disclaimers_carried` | compliance evidence: clear disclaimers are carried |
| `compliance.finra_2214_and_csa_framing_addressed` | compliance evidence: FINRA Rule 2214 and CSA framing are addressed |
| `compliance.advice_like_language_redesigned_to_scenarios` | compliance evidence: advice-like language is redesigned into scenarios |
| `margin.margin_features_present` | gate: declares whether margin features are present |
| `margin.margin_disclosure_carried` | required `true` only when `margin.margin_features_present` is `true`; otherwise passes as not applicable |
| `quant.risk_and_return_presented_together` | quant evidence: risk and return are presented together |
| `quant.diversification_and_correlation_addressed` | quant evidence: diversification and correlation are addressed |
| `quant.mpt_limits_disclosed` | quant evidence: MPT limits are disclosed |
| `quant.factor_thinking_addressed` | quant evidence: factor thinking is addressed |
| `quant.regime_awareness_addressed` | quant evidence: regime awareness is addressed |
| `quant.tax_and_fee_aware_returns` | quant evidence: returns are tax- and fee-aware |
| `features` (list of feature-row objects) | computed: must be present and non-empty; reported as `features_count` |
| `features[].name` (string) | names the row in the computed outputs |
| `features[].shows_scenarios_and_tradeoffs` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `features_without_scenarios_and_tradeoffs` |
| `features[].implies_advice_present` | computed: must be `false` per row to pass; rows declaring `true` are reported in `features_implying_advice` |
| `features[].figures_traceable` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `features_without_traceable_figures` |
| `features[].is_backtest` | computed gate: declares the row is a backtest |
| `features[].overfit_and_survivorship_addressed` | computed: required `true` when the row is a backtest; otherwise passes as not applicable to that row; backtest rows with the field present but not `true` are reported in `backtest_features_without_overfit_survivorship_address` |
| `open_building_blocks.open_data_sources_used` | open-finance evidence: open data sources are used |
| `open_building_blocks.open_source_analytics_used` | open-finance evidence: open-source analytics are used |
| `open_building_blocks.every_number_reproducible_and_auditable` | open-finance evidence: every number shown is reproducible and auditable |
| `privacy.zero_knowledge_design` | privacy evidence: the design is zero-knowledge |
| `privacy.user_held_keys` | privacy evidence: keys are user-held |
| `privacy.data_selling_present` | must be `false` to pass (privacy line: no data selling) |
| `business_model.monetization_via_certification_membership_or_developer_licenses` | business-model evidence: monetization is via certification, membership or developer licenses |
| `business_model.core_features_gated_present` | must be `false` to pass (FOSS model: core features are not gated) |
| `behavioral.biases_accounted_for` | behavioural evidence: biases are accounted for |
| `behavioral.decision_history_used_as_insight` | behavioural evidence: decision history is used as insight |
| `anti_patterns.guaranteed_or_return_promising_language_present` | must be `false` to pass (anti-pattern: no guaranteed/return-promising language) |
| `anti_patterns.black_box_risk_numbers_present` | must be `false` to pass (anti-pattern: no black-box risk numbers) |
| `anti_patterns.fees_taxes_slippage_ignored_present` | must be `false` to pass (anti-pattern: fees, taxes and slippage are not ignored) |
| `anti_patterns.overfit_backtests_present` | must be `false` to pass (anti-pattern: no overfit backtests) |
| `anti_patterns.survivorship_bias_present` | must be `false` to pass (anti-pattern: no survivorship bias) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward FINANCE_TOOL_DESIGN_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/finance-tool-design-advisory`:

```json
{
  "tool": "AlphaOptimizer",
  "compliance": {
    "tool_calculates_user_decides": true,
    "recommendation_language_present": false,
    "disclaimers_carried": true,
    "finra_2214_and_csa_framing_addressed": true,
    "advice_like_language_redesigned_to_scenarios": true
  },
  "margin": {
    "margin_features_present": true,
    "margin_disclosure_carried": true
  },
  "quant": {
    "risk_and_return_presented_together": true,
    "diversification_and_correlation_addressed": true,
    "mpt_limits_disclosed": true,
    "factor_thinking_addressed": true,
    "regime_awareness_addressed": true,
    "tax_and_fee_aware_returns": true
  },
  "features": [
    {
      "name": "BacktestEngine",
      "shows_scenarios_and_tradeoffs": true,
      "implies_advice_present": false,
      "figures_traceable": true,
      "is_backtest": true,
      "overfit_and_survivorship_addressed": true
    }
  ],
  "open_building_blocks": {
    "open_data_sources_used": true,
    "open_source_analytics_used": true,
    "every_number_reproducible_and_auditable": true
  },
  "privacy": {
    "zero_knowledge_design": true,
    "user_held_keys": true,
    "data_selling_present": false
  },
  "business_model": {
    "monetization_via_certification_membership_or_developer_licenses": true,
    "core_features_gated_present": false
  },
  "behavioral": {
    "biases_accounted_for": true,
    "decision_history_used_as_insight": true
  },
  "anti_patterns": {
    "guaranteed_or_return_promising_language_present": false,
    "black_box_risk_numbers_present": false,
    "fees_taxes_slippage_ignored_present": false,
    "overfit_backtests_present": false,
    "survivorship_bias_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 32 checks and a text stamp of the verdict):

```json
{
  "service": "finance-tool-design-advisory",
  "atom_version": "0.1.0",
  "tool": "AlphaOptimizer",
  "verdict": "FINANCE_TOOL_DESIGN_SOUND",
  "sections": {
    "compliance_and_advice_boundary": "pass",
    "quant_fundamentals": "pass",
    "reproducibility_privacy_and_open_finance": "pass",
    "business_model_and_behavioral_design": "pass",
    "anti_patterns": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "features_count": 1,
  "features_without_scenarios_and_tradeoffs": [],
  "scenario_coverage": "1.000000",
  "features_implying_advice": [],
  "features_without_traceable_figures": [],
  "traceability_coverage": "1.000000",
  "backtest_features_without_overfit_survivorship_address": [],
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across five sections."
}
```

## Verdicts

- **FINANCE_TOOL_DESIGN_SOUND** — every check passes; the declared finance-tool design record is complete and consistent with the skill's checklist and lines.
- **FINANCE_TOOL_DESIGN_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `features_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `features_without_scenarios_and_tradeoffs`, `features_implying_advice`, `features_without_traceable_figures` and `backtest_features_without_overfit_survivorship_address` (null when the `features` list is not declared; a feature with the relevant field absent is missing evidence and does not appear in the first, third and fourth lists), the coverage values `scenario_coverage` and `traceability_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
