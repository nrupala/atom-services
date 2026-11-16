# Bias controlled quant study pack — `bias-controlled-quant-study-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Research markets with statistical honesty — distributions, biases, data hygiene, and falsifiable hypotheses.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Research Analyst signal research**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the bias-controlled-quant-study-pack manifest

The caller submits one JSON manifest: one quant study pack — a
single market study worked through the bound skill's method,
with bias control at its centre. Every field below is read by
the named section's checks. A field **absent** = evidence
missing (`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the check fails (`STUDY_PACK_NOT_COMPLETE`). All
fields are booleans unless noted.

| Field | Read by |
|---|---|
| `study` (string; carried into the verdict output, not itself checked) | — |
| `hypothesis.hypothesis_written` | hypothesis_preregistration |
| `hypothesis.prediction_stated` | hypothesis_preregistration |
| `hypothesis.falsification_test_defined` | hypothesis_preregistration |
| `hypothesis.results_looked_at_before_registration` (must be `false` to pass — method step 1: registration comes BEFORE looking at results) | hypothesis_preregistration |
| `data.provenance_documented` | data_hygiene |
| `data.snapshot_version_documented` | data_hygiene |
| `data.adjusted_prices` | data_hygiene |
| `data.delisted_names_retained` | data_hygiene |
| `data.survivorship_gap_present` (must be `false` to pass — quality gate: no survivorship gap) | data_hygiene |
| `data.point_in_time_fundamentals` | data_hygiene |
| `data.restatement_peeking` (must be `false` to pass — method step 2: no restatement peeking) | data_hygiene |
| `data.timezone_timestamp_discipline` | data_hygiene |
| `distribution.fat_tails_considered` | distribution_reality |
| `distribution.volatility_clustering_considered` | distribution_reality |
| `distribution.gaussian_assumed` (must be `false` to pass — method step 3: don't assume Gaussian) | distribution_reality |
| `distribution.crisis_correlations_considered` | distribution_reality |
| `stationarity.stability_tested` | stationarity_and_stability |
| `stationarity.stability_periods` (list of strings; computed, see below) | stationarity_and_stability |
| `stationarity.regime_context_provided` | stationarity_and_stability |
| `stationarity.mechanism_stated` | stationarity_and_stability |
| `stationarity.claim_made_without_regime_context` (must be `false` to pass — skill red line) | stationarity_and_stability |
| `multiple_testing.controlled` | multiple_testing |
| `multiple_testing.deflated_significance_applied` | multiple_testing |
| `multiple_testing.holdout_used` | multiple_testing |
| `multiple_testing.signals_tested` (number; computed, see below) | multiple_testing |
| `multiple_testing.signals_reported` (number; computed, see below) | multiple_testing |
| `multiple_testing.p_hacked_screen_presented_as_strategy` (must be `false` to pass — skill red line) | multiple_testing |
| `multiple_testing.result_from_single_sample` (must be `false` to pass — skill red line) | multiple_testing |
| `costs.costs_included` | costs |
| `costs.included` (list of strings; computed, see below) | costs |
| `costs.results_net_of_costs` | costs |
| `reproducibility.seeded_runs` | reproducibility |
| `reproducibility.snapshot_pinned` | reproducibility |
| `reproducibility.code_versioned` | reproducibility |
| `reproducibility.rerunnable_by_others` | reproducibility |

Three checks are computed from the declared values, using only
what the skill itself states plus the arithmetic / set logic of
the declared values — no outside threshold is imported:

- **Cost coverage:** the skill's method step 6 is "Costs from
  day one: spreads, fees, slippage, borrow, taxes". The declared
  `costs.included` list therefore passes only when it contains
  all five stated entries (`spreads`, `fees`, `slippage`,
  `borrow`, `taxes`); unknown entries do not count toward
  coverage. A missing list is missing evidence; an empty list is
  present and fails. The output reports the omitted stated
  entries as `costs_not_included` (null when no list is
  declared). Entries are validated as strings only, never
  enum-checked — coverage is a verdict check, not a type error.
- **Stability across periods:** the skill's method step 4 is
  "test stability across periods", and its quality gate repeats
  "stability checked across periods". The declared
  `stationarity.stability_periods` list therefore passes only
  when it names at least two **distinct** periods — stability
  across periods cannot be shown inside a single period, and a
  period repeated is still one period. No period length, no
  count above two, and no period identity is imposed: the skill
  states none. A missing list is missing evidence; an empty or
  single-distinct-period list is present and fails. The output
  reports the distinct count as `stability_period_count` (null
  when no list is declared). Entries are validated as strings
  only, never enum-checked.
- **Reported-within-tested coherence:** the skill's method step
  5 is "screens test thousands of things — the best of 10,000
  random signals looks great; control for it". When the pack
  declares both `multiple_testing.signals_tested` and
  `multiple_testing.signals_reported`, the check passes only
  when both are whole numbers, zero or more, and the reported
  count does not exceed the tested count — a study cannot
  report more results than the signals it tested. If either
  number is absent, the check is missing evidence. The skill
  states no significance level, no deflation formula, and no
  maximum number of tests, so none is imposed: this is pure
  accounting coherence between the two declared counts. The
  output reports `signals_tested`, `signals_reported`, and
  `signals_reported_minus_tested` (each null when it cannot be
  computed from the declared counts).

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the three computed checks cannot be completed).

The verdict is one of `STUDY_PACK_COMPLETE` (all 34 checks
pass), `STUDY_PACK_NOT_COMPLETE` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across seven sections: hypothesis_preregistration,
data_hygiene, distribution_reality, stationarity_and_stability,
multiple_testing, costs, reproducibility.

## Honest scoping

This atom audits a **declared** study pack — it does not fetch
market data, run the study, replicate its results, or verify
that a declared value is true. The register's named work for
this atom — Research Analyst signal research — stays the
caller's: the pack declares its own hypothesis registration,
data hygiene, bias controls, and counts, and this core checks
only their completeness and internal coherence on the declared
evidence. A pack is complete *on the caller's declared
evidence* even if its hypothesis is wrong and its result would
not survive live trading. It is a completeness and coherence
audit, **not a research review**: it never decides whether the
hypothesis is sound, whether the data actually was clean,
whether the mechanism is real, or whether the reported edge
will persist — only that the pack contains what the skill's
method, quality gates, and red lines demand, and that its
declared counts and lists agree with themselves.

Named exclusions: no market-data fetching or verification of
any declared dataset, price adjustment, or fundamental (data
sourcing stays the caller's); no significance testing, p-value
computation, or deflated-Sharpe calculation (the skill requires
deflated significance *awareness* and multiple-testing control
as declared practices but states no formula, level, or pass
mark, so none is computed or imposed); no minimum sample size,
observation count, or period length (the skill states none);
no judgment of whether a declared stability period is a
meaningful regime split (only distinctness and the
across-periods minimum the skill's own wording carries are
checked); no live-trading, capacity, or execution review.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
