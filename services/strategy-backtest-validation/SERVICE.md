# Strategy backtest validation — `strategy-backtest-validation`

**Deliverable type:** VALIDATION. This atom sells the validation it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Validate strategies before capital — in/out-of-sample, costs, walk-forward, overfit detection, paper gates.

A caller submits the inputs the bound skill works on and receives one validation back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this validation on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Sail strategy validation gates**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the backtest-evidence manifest

This atom does not run a backtest and makes no judgment about
whether a strategy is good. The caller submits one JSON manifest
declaring a backtest's validation evidence — its harness standards,
protocol and reported result sets, cost modelling, overfit /
fragility evidence, paper-gate record, and live-monitoring /
house-gate record — and the atom validates that declared evidence
deterministically. Every field below is read by the named section's
checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`NOT_VALIDATED`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `strategy` (string; carried into the verdict output, not itself checked) | — |
| `harness.deterministic_runs` | harness_standards |
| `harness.data_snapshots_versioned` | harness_standards |
| `harness.point_in_time_universe` | harness_standards |
| `harness.look_ahead_used` (must be `false` to pass) | harness_standards |
| `harness.realistic_fills_modeled` | harness_standards |
| `protocol.hypothesis_stated` | protocol_and_reporting |
| `protocol.in_sample_reported` | protocol_and_reporting |
| `protocol.out_of_sample_reported` | protocol_and_reporting |
| `protocol.holdout_untouched_until_end` | protocol_and_reporting |
| `protocol.walk_forward_reported` | protocol_and_reporting |
| `protocol.reported_side_by_side` | protocol_and_reporting |
| `costs.commissions_modeled` | costs_and_frictions |
| `costs.spreads_modeled` | costs_and_frictions |
| `costs.slippage_modeled` | costs_and_frictions |
| `costs.borrow_modeled` | costs_and_frictions |
| `costs.financing_modeled` | costs_and_frictions |
| `costs.taxes_material` (gates the taxes check below) | costs_and_frictions |
| `costs.taxes_modeled` (required when taxes are declared material; otherwise the check passes as not applicable) | costs_and_frictions |
| `costs.costs_skipped` (must be `false` to pass — skill red line) | costs_and_frictions |
| `overfit.parameter_sensitivity_shown` | overfit_and_fragility |
| `overfit.sensitivity_shows_smooth_plateau` | overfit_and_fragility |
| `overfit.parameter_count` (number; with the observation count below, the params-vs-data ratio is recomputed from the two declared counts) | overfit_and_fragility |
| `overfit.observation_count` (number; must be non-zero for the ratio to be computable) | overfit_and_fragility |
| `overfit.best_of_n_disclosed` | overfit_and_fragility |
| `overfit.curve_fit_parameters_used` (must be `false` to pass — skill red line) | overfit_and_fragility |
| `fragility.single_name_dominance_checked` | overfit_and_fragility |
| `fragility.regime_dependence_checked` | overfit_and_fragility |
| `fragility.capacity_liquidity_checked` | overfit_and_fragility |
| `paper.period_or_fill_count_defined` | paper_gate |
| `paper.completed` (with `paper.waived` below, at least one must be declared; the gate passes when either is `true`) | paper_gate |
| `paper.waived` (gates the waiver and comparison checks below) | paper_gate |
| `paper.waiver_written_reason` (required when the gate is waived; otherwise the check passes as not applicable) | paper_gate |
| `paper.waiver_approval_recorded` (required when the gate is waived; otherwise the check passes as not applicable) | paper_gate |
| `paper.live_vs_model_compared` (required unless the gate is waived, in which case the waiver discharges it) | paper_gate |
| `monitoring.divergence_tracked` | live_monitoring_and_house_gates |
| `monitoring.kill_criteria_defined_before_scaling` | live_monitoring_and_house_gates |
| `monitoring.kill_criteria_cover_all_three` (drawdown, divergence, invalidation) | live_monitoring_and_house_gates |
| `house_gates.explicit_confirmation_for_live_trades` | live_monitoring_and_house_gates |
| `house_gates.max_planned_trade_usd` (number; gates the clear-yes check below) | live_monitoring_and_house_gates |
| `house_gates.clear_yes_for_trades_over_500` (required when the maximum planned trade is over $500; at or under $500 the check passes as not applicable) | live_monitoring_and_house_gates |
| `house_gates.backtest_used_as_sole_live_confirmation` (must be `false` to pass — skill red line) | live_monitoring_and_house_gates |

Four checks are computed or conditional, not plain declarations,
using only relationships the skill itself states: the
params-vs-data ratio is recomputed from the declared parameter and
observation counts; taxes bind only where declared material; the
paper gate passes on completion or on a conscious waiver carrying
a written reason and an approval; and a declared planned trade
over $500 binds the clear-yes evidence — $500 is the skill's own
house-gate threshold (method 8), the only numeric threshold in the
atom. The verdict dict also reports `results_sets_reported` (how
many of the in-sample / out-of-sample / walk-forward result sets
are declared reported, 0–3), `params_to_data_ratio`,
`paper_gate_status` (`completed` / `waived` / `not_completed` /
null) and `over_500_trade_declared` (true / false / null).
**Fixed serialization rule:** the ratio is reported as a string
with exactly four decimal places, produced in both implementations
by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The verdict is one of `VALIDATED` (all 36 checks pass),
`NOT_VALIDATED` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
harness_standards, protocol_and_reporting, costs_and_frictions,
overfit_and_fragility, paper_gate,
live_monitoring_and_house_gates.

## Honest scoping

This atom validates **declared** evidence about a backtest — it
does not run a backtest, re-run one, inspect a harness, read market
data, or verify that a declared result is true. A backtest whose
evidence is complete and consistent is `VALIDATED` *on the caller's
declared evidence*, even if the underlying numbers are wrong.
Named exclusions: no acceptance bar on the params-vs-data ratio,
out-of-sample performance, drawdown, or any other quantity (the
skill names the ratio as an overfit check but states no numeric
bar for it or anything else, so none is invented — the ratio is
reported, never judged); no judgment that a sensitivity plateau is
genuinely smooth, that fills were genuinely realistic, or that a
holdout was genuinely untouched (each is checked as declared
evidence, per the skill's own quality gates); no investment advice
— the named doubt stands: this is validation of declared evidence,
not advice, and a `VALIDATED` verdict is not a recommendation to
trade the strategy.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Finance-adjacent; validation not advice
