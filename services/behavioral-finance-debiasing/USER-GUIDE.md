# Behavioral finance debiasing — user guide

## What it does

You are about to act on a money decision. This atom reads a
declared debiasing pack for one decision — screening against
the eleven key money biases, prospect-theory reframing,
pre-commitment rules with rebalancing bands, journal /
checklists / cooling-off, whole-portfolio reframing, and the
guardrails (patterns surfaced to you, tool calculates / you
decide, never advice, never a trade nudge) — and returns one
deterministic verdict across six sections: **DEBIASED**,
**NOT_DEBIASED**, or **INSUFFICIENT_EVIDENCE** (nothing failed,
but evidence is missing — the verdict names exactly which).
One check is computed against your own declared limit: your
current allocation's distance from your target allocation must
sit at or below your declared rebalancing band. Your position's
share of the whole portfolio is also computed and reported
(no threshold is attached — the reframe is the point). Same
manifest in → same verdict out. The atom audits the record you
declare; it is not financial advice and never nudges a trade.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "behavioral-finance-debiasing"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/behavioral-finance-debiasing`
  — tool name `behavioral_finance_debiasing`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/behavioral-finance-debiasing`
  — body = the manifest object; same `Authorization` header.

## Input — the debiasing manifest

| Field | Meaning |
|---|---|
| `decision` | decision label (string; carried into the output, not checked) |
| `context.is_big_trade` | gates the cooling-off check |
| `bias_screening.loss_aversion_screened` / `disposition_effect_screened` / `mental_accounting_screened` / `anchoring_to_purchase_price_screened` / `recency_availability_screened` / `herding_fomo_screened` / `overconfidence_illusion_of_control_screened` / `confirmation_screened` / `sunk_cost_screened` / `home_bias_screened` / `narrative_bias_screened` | the eleven key money biases, each screened |
| `bias_patterns.found` | list of `{bias, technique_named, surfaced_to_user}`; computed: every found pattern must name its technique and be surfaced to you (an empty list passes; the `bias` label is yours — no vocabulary is imposed) |
| `prospect_theory.reference_point_identified` / `framed_vs_reference_not_absolute_wealth` / `loss_asymmetry_acknowledged` / `risk_attitude_by_domain_checked` / `probability_weighting_checked` | prospect-theory reframing evidence |
| `precommitment.investment_policy_statement_present` / `written_sell_criteria_present` / `rules_decided_before_emotion_arrives` | pre-commitment evidence |
| `precommitment.rebalancing_target_allocation_percent`, `precommitment.rebalancing_current_allocation_percent`, `precommitment.rebalancing_band_percent` | computed band gate: \|current − target\| must be at or below your declared band |
| `journal_and_checklists.decision_journal_reasoning_recorded` / `decisions_reviewed_separately_from_outcomes` / `base_rates_used` / `checklists_used` | journal and checklist evidence |
| `journal_and_checklists.cooling_off_period_taken` | required when the trade is big; otherwise not applicable |
| `whole_portfolio.reframed_in_whole_portfolio_absolute_terms` | whole-portfolio reframe |
| `whole_portfolio.single_position_pnl_framing_used` | must be `false` to pass |
| `whole_portfolio.position_value`, `whole_portfolio.whole_portfolio_value` | computed report only: position share = 100 × position / whole portfolio |
| `guardrails.bias_patterns_surfaced_to_user` / `tool_calculates_user_decides` / `not_advice_line_respected` | guardrail evidence |
| `guardrails.biases_used_to_manipulate` / `trade_nudge_present` / `markets_assumed_perfectly_efficient_or_irrational` / `single_bias_treated_as_whole_story` | all must be `false` to pass (anti-patterns) |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check
fails (counts toward NOT_DEBIASED).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/behavioral-finance-debiasing`:

```json
{
  "decision": "Sell 50 shares of AAPL",
  "context": {
    "is_big_trade": true
  },
  "bias_screening": {
    "loss_aversion_screened": true,
    "disposition_effect_screened": true,
    "mental_accounting_screened": true,
    "anchoring_to_purchase_price_screened": true,
    "recency_availability_screened": true,
    "herding_fomo_screened": true,
    "overconfidence_illusion_of_control_screened": true,
    "confirmation_screened": true,
    "sunk_cost_screened": true,
    "home_bias_screened": true,
    "narrative_bias_screened": true
  },
  "bias_patterns": {
    "found": [
      {
        "bias": "loss_aversion",
        "technique_named": true,
        "surfaced_to_user": true
      }
    ]
  },
  "prospect_theory": {
    "reference_point_identified": true,
    "framed_vs_reference_not_absolute_wealth": true,
    "loss_asymmetry_acknowledged": true,
    "risk_attitude_by_domain_checked": true,
    "probability_weighting_checked": true
  },
  "precommitment": {
    "investment_policy_statement_present": true,
    "written_sell_criteria_present": true,
    "rules_decided_before_emotion_arrives": true,
    "rebalancing_target_allocation_percent": 50.0,
    "rebalancing_current_allocation_percent": 51.0,
    "rebalancing_band_percent": 2.0
  },
  "journal_and_checklists": {
    "decision_journal_reasoning_recorded": true,
    "decisions_reviewed_separately_from_outcomes": true,
    "base_rates_used": true,
    "checklists_used": true,
    "cooling_off_period_taken": true
  },
  "whole_portfolio": {
    "reframed_in_whole_portfolio_absolute_terms": true,
    "single_position_pnl_framing_used": false,
    "position_value": 1000.0,
    "whole_portfolio_value": 10000.0
  },
  "guardrails": {
    "bias_patterns_surfaced_to_user": true,
    "tool_calculates_user_decides": true,
    "not_advice_line_respected": true,
    "biases_used_to_manipulate": false,
    "trade_nudge_present": false,
    "markets_assumed_perfectly_efficient_or_irrational": false,
    "single_bias_treated_as_whole_story": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 36 checks
and a text stamp of the verdict):

```json
{
  "service": "behavioral-finance-debiasing",
  "atom_version": "0.1.0",
  "decision": "Sell 50 shares of AAPL",
  "verdict": "DEBIASED",
  "sections": {
    "bias_screening": "pass",
    "prospect_theory_reframing": "pass",
    "precommitment_rules": "pass",
    "journal_checklists_and_cooling_off": "pass",
    "whole_portfolio_reframing": "pass",
    "guardrails_and_anti_patterns": "pass"
  },
  "computed_status": "within_declared_band_on_declared_evidence",
  "bias_patterns_found_count": 1,
  "allocation_drift_over_band_percent": "-1.0000",
  "position_share_percent_of_portfolio": "10.0000",
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections."
}
```

## Verdicts

- **DEBIASED** — every check passes; the decision is debiased on the declared evidence.
- **NOT_DEBIASED** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_status` (`within_declared_band_on_declared_evidence` / `outside_declared_band_on_declared_evidence` / null when the rebalancing check cannot be completed), `bias_patterns_found_count` (the declared list length, or null), `allocation_drift_over_band_percent` (|current − target| − band, string with exactly four decimals, or null) and `position_share_percent_of_portfolio` (100 × position value / whole portfolio value, or null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
