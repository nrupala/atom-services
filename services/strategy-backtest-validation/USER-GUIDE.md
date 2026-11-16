# Strategy backtest validation — user guide

## What it does

You have run (or are about to run) a trading-strategy backtest. This
atom reads a short evidence manifest describing that backtest — its
harness standards, protocol and reported result sets, cost modelling,
overfit and fragility evidence, paper-gate record, and live-monitoring
/ house-gate record — and returns one deterministic verdict across 36
checks in six sections: **VALIDATED**, **NOT_VALIDATED**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Four checks are computed or
conditional: the params-to-data ratio is recomputed from your declared
parameter and observation counts (reported, never judged — the skill
states no acceptance bar), taxes bind only where you declare them
material, the paper gate passes on completion or on a conscious waiver
carrying a written reason and an approval, and a declared planned
trade over $500 binds the clear-yes evidence. The atom does not run a
backtest or verify that a declared result is true — it validates your
declared evidence. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "strategy-backtest-validation"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/strategy-backtest-validation`
  — tool name `strategy_backtest_validation`; `tools/call`
  arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/strategy-backtest-validation`
  — body = the manifest object; same `Authorization` header.

## Input — the backtest-evidence manifest

All fields are booleans unless noted.

| Field | Meaning |
|---|---|
| `strategy` | strategy name (string; carried into the output, not itself checked) |
| `harness.deterministic_runs`, `harness.data_snapshots_versioned`, `harness.point_in_time_universe`, `harness.look_ahead_used` (must be `false`), `harness.realistic_fills_modeled` | harness standards |
| `protocol.hypothesis_stated`, `protocol.in_sample_reported`, `protocol.out_of_sample_reported`, `protocol.holdout_untouched_until_end`, `protocol.walk_forward_reported`, `protocol.reported_side_by_side` | protocol & reporting |
| `costs.commissions_modeled`, `costs.spreads_modeled`, `costs.slippage_modeled`, `costs.borrow_modeled`, `costs.financing_modeled`, `costs.taxes_material`, `costs.taxes_modeled` (required when taxes are material), `costs.costs_skipped` (must be `false`) | costs & frictions |
| `overfit.parameter_sensitivity_shown`, `overfit.sensitivity_shows_smooth_plateau`, `overfit.parameter_count` (number), `overfit.observation_count` (number, non-zero), `overfit.best_of_n_disclosed`, `overfit.curve_fit_parameters_used` (must be `false`) | overfit evidence (the two counts feed the recomputed ratio) |
| `fragility.single_name_dominance_checked`, `fragility.regime_dependence_checked`, `fragility.capacity_liquidity_checked` | fragility evidence |
| `paper.period_or_fill_count_defined`, `paper.completed`, `paper.waived`, `paper.waiver_written_reason` (required when waived), `paper.waiver_approval_recorded` (required when waived), `paper.live_vs_model_compared` (required unless waived) | paper gate (passes on completion, or on a waiver with reason + approval) |
| `monitoring.divergence_tracked`, `monitoring.kill_criteria_defined_before_scaling`, `monitoring.kill_criteria_cover_all_three` | live monitoring |
| `house_gates.explicit_confirmation_for_live_trades`, `house_gates.max_planned_trade_usd` (number), `house_gates.clear_yes_for_trades_over_500` (required when the maximum planned trade is over $500), `house_gates.backtest_used_as_sole_live_confirmation` (must be `false`) | house gates |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false / invalid = the
check fails (counts toward NOT_VALIDATED).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/strategy-backtest-validation`:

```json
{
  "strategy": "Alpha-Trend-01",
  "harness": {"deterministic_runs": true, "data_snapshots_versioned": true, "point_in_time_universe": true, "look_ahead_used": false, "realistic_fills_modeled": true},
  "protocol": {"hypothesis_stated": true, "in_sample_reported": true, "out_of_sample_reported": true, "holdout_untouched_until_end": true, "walk_forward_reported": true, "reported_side_by_side": true},
  "costs": {"commissions_modeled": true, "spreads_modeled": true, "slippage_modeled": true, "borrow_modeled": true, "financing_modeled": true, "taxes_material": true, "taxes_modeled": true, "costs_skipped": false},
  "overfit": {"parameter_sensitivity_shown": true, "sensitivity_shows_smooth_plateau": true, "parameter_count": 10, "observation_count": 1000, "best_of_n_disclosed": true, "curve_fit_parameters_used": false},
  "fragility": {"single_name_dominance_checked": true, "regime_dependence_checked": true, "capacity_liquidity_checked": true},
  "paper": {"period_or_fill_count_defined": true, "completed": true, "waived": false, "live_vs_model_compared": true},
  "monitoring": {"divergence_tracked": true, "kill_criteria_defined_before_scaling": true, "kill_criteria_cover_all_three": true},
  "house_gates": {"explicit_confirmation_for_live_trades": true, "max_planned_trade_usd": 600, "clear_yes_for_trades_over_500": true, "backtest_used_as_sole_live_confirmation": false}
}
```

Response — HTTP 200 (trimmed; the full response carries all 36 checks
and a text stamp of the verdict):

```json
{
  "service": "strategy-backtest-validation",
  "atom_version": "0.1.0",
  "strategy": "Alpha-Trend-01",
  "verdict": "VALIDATED",
  "sections": {"harness_standards": "pass", "protocol_and_reporting": "pass", "costs_and_frictions": "pass", "overfit_and_fragility": "pass", "paper_gate": "pass", "live_monitoring_and_house_gates": "pass"},
  "results_sets_reported": 3,
  "params_to_data_ratio": "0.0100",
  "paper_gate_status": "completed",
  "over_500_trade_declared": true,
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections."
}
```

The ratio is a string with exactly four decimals (`null` when either
count is missing or the observation count is zero);
`results_sets_reported` counts how many of the in-sample /
out-of-sample / walk-forward result sets you declared reported (0–3);
`paper_gate_status` is `completed` / `waived` / `not_completed` /
`null`; `over_500_trade_declared` is `true` / `false` / `null`.

## Verdicts

- **VALIDATED** — every check passes on your declared evidence,
  including the computed and conditional checks. This is validation of
  declared evidence, not a recommendation to trade the strategy.
- **NOT_VALIDATED** — at least one check fails; the failing checks name
  the breached section (a red line such as look-ahead, skipped costs,
  curve-fit parameters, or a backtest used as sole live confirmation).
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing;
  the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
