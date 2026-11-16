# Confidence scoreboard — `forecast-confidence-scoreboard`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Predict with models honestly — baselines, leakage-free validation, calibration, drift awareness.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one query.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Scoring our own product forecasts**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Distinct ground — vs `forecast-with-ranges-and-scorecard` (and the ML-model audit)

**Sibling `forecast-with-ranges-and-scorecard` (Tier A)** validates
ONE forecast artifact for ONE series: its purpose / horizon /
owner, its three baseline values, its low/base/high range, its
base/best/worst scenarios, its MAE / MAPE / bias scorecard
recomputed from a numeric forecast-vs-actual history, its revision
hygiene and its cadence. **This atom shares no check, no field and
no computed quantity with it — zero overlap.** This atom never
reads a baseline value, a range, a scenario, or a numeric
forecast-vs-actual pair, and it produces no forecast of its own.

This atom's ground is a **population of resolved binary
probabilistic forecasts by named human forecasters**: a ledger of
claims, each with the probability its forecaster stated before
resolution and its binary outcome, and the published
per-forecaster scoreboard over that ledger (forecast count, mean
stated probability, hit rate, calibration gap, Brier score, rank).
It recomputes every per-forecaster aggregate and the ranking from
the ledger and checks the published scoreboard is honest about
its own ledger — calibration per forecaster (the skill: "when it
says 70%, it should be right ~70% — not just ranking ability"),
with the worst-calibrated forecaster — the skill's "worst cohort
is the story", the cohort here being the forecaster — surfaced.

It is likewise not the ML-model audit
(`prediction-model-leakage-calibration-audit`, the register's
named doubt: "ML-model audit vs human forecaster scoring"): there
is no model here — no features, no split, no holdout score, no
caller-declared tolerance. The leakage discipline appears only in
its human-ledger form: forecasts recorded before resolution, on
resolution criteria declared before outcomes were known.

## Inputs — the forecast-confidence manifest

The caller submits one JSON manifest: a declared
forecast-confidence record for one scoreboard. Every field below
is read by the named section's checks. A field **absent** =
evidence missing (`INSUFFICIENT_EVIDENCE`); a field present but
false / invalid = the check fails
(`CONFIDENCE_SCOREBOARD_NOT_SOUND`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `subject` (string; carried into the verdict output, not itself checked) | — |
| `record.resolution_criteria_predeclared` | ledger_and_resolution |
| `record.forecasts_recorded_before_resolution` | ledger_and_resolution |
| `record.unresolved_forecasts_excluded` | ledger_and_resolution |
| `forecasts` (list of forecast-row objects, each with the entry fields below; computed, see below) | ledger_and_resolution, per_forecaster_scoring, calibration_reporting, ranking_integrity |
| `forecasts[].forecaster` (string; names the row's forecaster in the computed outputs) | ledger_and_resolution, per_forecaster_scoring, calibration_reporting, ranking_integrity |
| `forecasts[].claim` (string; the claim that was predicted — must be a non-empty string for the row to pass the computed claim check) | ledger_and_resolution |
| `forecasts[].stated_probability` (number; must lie in [0, 1] for the row to pass the computed probability check and to enter any aggregate) | ledger_and_resolution, per_forecaster_scoring, calibration_reporting, ranking_integrity |
| `forecasts[].outcome` (number; must be exactly 0 or 1 for the row to pass the computed outcome check and to enter any aggregate) | ledger_and_resolution, per_forecaster_scoring, calibration_reporting, ranking_integrity |
| `scoreboard` (list of scoreboard-row objects, each with the entry fields below; computed, see below) | per_forecaster_scoring, calibration_reporting, ranking_integrity |
| `scoreboard[].forecaster` (string; names the row's forecaster) | per_forecaster_scoring, calibration_reporting, ranking_integrity |
| `scoreboard[].forecasts_count` (number; recomputed as the count of ledger rows naming this forecaster) | per_forecaster_scoring |
| `scoreboard[].mean_stated_probability` (number; recomputed as the mean of this forecaster's stated probabilities) | per_forecaster_scoring |
| `scoreboard[].hit_rate` (number; recomputed as the mean of this forecaster's outcomes) | per_forecaster_scoring |
| `scoreboard[].calibration_gap` (number; recomputed as \|mean stated probability − hit rate\| for this forecaster) | calibration_reporting |
| `scoreboard[].brier_score` (number; recomputed as the mean of (stated probability − outcome)² for this forecaster) | per_forecaster_scoring, ranking_integrity |
| `scoreboard[].rank` (number; must be integral, the ranks together exactly 1..N, and must follow the recomputed Brier order) | ranking_integrity |
| `confidence_reporting.calibration_reported_per_forecaster` | calibration_reporting |
| `confidence_reporting.outputs_are_probabilities` | calibration_reporting |
| `confidence_reporting.calibration_reported_not_just_ranking` | calibration_reporting |
| `confidence_reporting.worst_forecaster_surfaced` | calibration_reporting |
| `scoreboard_use.decision_stated` | honesty_and_live_use |
| `scoreboard_use.decision_costs_considered` | honesty_and_live_use |
| `honesty.metric_chosen_to_flatter_present` (must be `false` to pass — skill red line) | honesty_and_live_use |
| `honesty.silent_score_rewrites_present` (must be `false` to pass — skill red line) | honesty_and_live_use |
| `honesty.scores_refreshed_as_outcomes_resolve` | honesty_and_live_use |

Fourteen checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Forecasts declared:** the declared `forecasts` list passes
  only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **Forecaster / claim / probability / outcome per forecast:**
  every declared forecast row must name a non-empty `forecaster`,
  state a non-empty `claim`, state a `stated_probability` inside
  [0, 1] (a probability is by definition in that interval), and
  record an `outcome` of exactly 0 or 1. A row with a field absent
  is missing evidence for that check; a row with an invalid value
  fails it, and the row enters no aggregate.
- **Scoreboard declared:** the declared `scoreboard` list passes
  only when it is present and non-empty.
- **Scoreboard covers every forecaster:** the set of scoreboard
  `forecaster` values must equal the set of ledger `forecaster`
  values, with no duplicate scoreboard rows.
- **Per-forecaster aggregates match:** every scoreboard row's
  `forecasts_count`, `mean_stated_probability`, `hit_rate`,
  `calibration_gap` and `brier_score` must agree with the values
  recomputed from that forecaster's ledger rows. Agreement is
  judged at the fixed 6dp serialization below — the bar is that
  the published scoreboard is the scoreboard of its own ledger,
  never that any score is good enough. A row with an aggregate
  field absent is missing evidence for that check; if any ledger
  entry is not complete and valid for scoring (forecaster,
  in-range probability, binary outcome), the aggregate checks
  cannot be verified and are missing.
- **Ranks complete and in Brier order:** the published `rank`
  values must be exactly 1..N over the scoreboard rows, and each
  row's rank must equal its position in the recomputed Brier
  order (lower Brier ranks first; ties break by forecaster name,
  ascending, so the expected order is total).

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the fourteen primary computed checks above cannot be completed),
`forecasts_count` (the declared ledger length, or null when the
list is not declared — counts are reported as integers, exactly),
`forecasters_count` (distinct non-empty forecaster names in the
ledger, or null), the overall aggregates
`overall_mean_stated_probability`, `overall_hit_rate`,
`overall_calibration_gap` and `overall_brier_score` (computed
over the stats-valid ledger entries; null when there are none),
`calibration_direction` (`overconfident` when the overall mean
stated probability exceeds the hit rate, `underconfident` when it
falls below, `exact` when equal, null when there are no
stats-valid entries — reported, never failed),
`worst_calibrated_forecaster` (the forecaster with the highest
per-forecaster calibration gap; ties break to the first name in
ascending order; null when no forecaster has a stats-valid
entry), the name lists `forecasters_without_scoreboard_row` and
`scoreboard_rows_without_forecasts` (null when either list is not
declared), `mismatched_scoreboard_rows` (scoreboard rows whose
present count or aggregate fields disagree with the recomputed
values; null when either list is not declared) and
`forecasters_with_wrong_rank` (null when the ranking cannot be
recomputed).
**Fixed serialization rule:** computed ratios and scores are
reported as strings with exactly six decimal places, produced in
both implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; declared-vs-recomputed agreement is judged on the
serialized values and other comparisons use the unrounded values.
That fixed serialization is what makes the Python and TypeScript
outputs byte-identical.

The skill states no numeric pass/fail threshold for this ground —
its only calibration number is the illustrative "when it says
70%, it should be right ~70%". Quantities are computed and
reported; the only bars on the computed rows are completeness
over the caller's own declared rows and agreement between the
published scoreboard and its own ledger, exactly as stated above.
Declined thresholds, named: a tolerated calibration gap (the
skill states no band around its 70% illustration — the gap is
computed and reported per forecaster, never failed); a Brier-score
pass bar; a hit-rate or accuracy bar; a minimum number of
forecasts per forecaster for inclusion or ranking (the skill
states none — small samples score and rank like any other, with
their counts published); a probability-bucket / binning scheme
for calibration (the skill states no bucket width or count —
calibration here is per forecaster over the stated probabilities
themselves, not over bins the atom would have to invent); an
overconfidence gap bar (the direction is reported, never failed);
a rank-separation or significance margin (tied Brier scores rank
by the stated name tiebreak, not by an invented margin); a
recency window or drift threshold for the ledger (the skill says
monitor live performance but states no window — refresh on
resolution is a caller attestation only); a false-positive /
false-negative cost ratio (the skill says the metric is chosen
from the decision's costs but states no ratio — caller
attestation only).

The verdict is one of `CONFIDENCE_SCOREBOARD_SOUND` (all 26
checks pass), `CONFIDENCE_SCOREBOARD_NOT_SOUND` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across five sections: ledger_and_resolution,
per_forecaster_scoring, calibration_reporting, ranking_integrity,
honesty_and_live_use.

## Honest scoping

This atom scores a **declared** forecast-confidence record — it
resolves no claim itself, reads no outcome source, verifies no
timestamp, and does not verify that a declared control actually
works. A scoreboard is sound *on the caller's declared evidence*:
a manifest that declares predeclared resolution criteria,
forecasts recorded before resolution, and a scoreboard whose
aggregates match its ledger passes those checks even if the real
ledger was written after the fact. It is a completeness and
consistency audit of the record the skill requires, **not a
forecasting service, not a forecaster certification, and not a
judgment that any forecaster is good**: it never judges whether a
stated probability was wise, whether a claim was worth predicting,
whether the resolution criteria were fair, or whether the
best-ranked forecaster will stay best — only that the record
contains what the skill's sections and red lines demand, and that
its published scores are the scores of its declared rows.

Named exclusions: no numeric thresholds beyond the skill's own
stated rules (see the declined list above); no forecast is
produced and no probability is supplied or corrected; no numeric
(non-binary) outcome scoring — that is the sibling
`forecast-with-ranges-and-scorecard`'s MAE / MAPE / bias ground,
deliberately not re-entered here; no model validation — features,
splits, holdouts and model calibration tolerances are the
ML-model audit's ground, deliberately not re-entered here; no
live verification of any declared fact (record-before-resolution
and predeclared criteria are caller declarations, the atom reads
no clock and no resolution source); no bucketed calibration
curve — the skill states no binning scheme, so none is imposed.

## Pricing

Pricing unit: **query**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Needs longitudinal adoption; slow first revenue. Distinct from prediction skill (ML-model audit vs human forecaster scoring)
