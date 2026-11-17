> **DISABLED by owner ruling, 2026-11-15 (U-13).** This atom is disabled and does not serve calls; it is not available product. It returns only on the owner's explicit per-atom ruling. Record: `TAKEDOWN-2026-11-15.md` in this directory.

# Portfolio risk analytics report — `portfolio-risk-analytics-report`

**Deliverable type:** REPORT. This atom sells the report it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Institutional-grade personal financial analytics — what to track, how to benchmark, how to separate signal from noise. Risk metrics, factor decomposition, stress tests, decision journaling. Tool calculates, user decides.

A caller submits the inputs the bound skill works on and receives one report back, in the contract's output shape (see `contract.yaml`). One unit of sale = one query.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this report on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Personal portfolio risk analytics runs**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **query**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the portfolio manifest

The caller submits one JSON manifest. `portfolio` (string) is carried
into the output, not itself analysed. All analytics are computed over
the submitted series; nothing is defaulted — the skill rules that all
parameters start blank, so a metric whose parameter was not submitted
is a labeled gap (null), never silently filled in, and missing data is
never interpolated.

| Field | Read from |
|---|---|
| `portfolio` (string; carried into the output, not itself analysed) | manifest |
| `returns` (list of numbers; portfolio periodic simple returns, e.g. `0.01` = +1% — the core series; non-numeric entries are counted in `counts.invalid_return_entries` and excluded) | manifest |
| `benchmark_returns` (list of numbers; benchmark periodic returns, aligned period-for-period with `returns`) | manifest |
| `periods_per_year` (number > 0; annualization parameter — absent = annualized metrics are gaps, no default is applied) | manifest |
| `risk_free_per_period` (number; per-period risk-free return — the Sharpe/Sortino excess target and Jensen-alpha baseline; absent = those metrics are gaps) | manifest |
| `var_confidence` (number strictly between 0 and 1; confidence for historical VaR/CVaR; absent = VaR/CVaR are gaps) | manifest |
| `holdings` (list of entries, below) | manifest |
| `holdings[].id` (string; carried into concentration / carry / stress rows) | entry |
| `holdings[].weight` (number; holding weight in any consistent unit — shares are weight ÷ weight sum; an entry without a numeric weight is counted in `counts.invalid_holdings` and excluded) | entry |
| `holdings[].currency` (string; groups the currency-share breakdown; absence groups under null) | entry |
| `holdings[].leveraged` (boolean `true` marks a leveraged holding for carry analysis) | entry |
| `holdings[].income_per_period` / `holdings[].financing_per_period` (numbers; carry inputs for leveraged holdings — net carry = income − financing) | entry |
| `factors` (list of `{name, returns}`; factor return series aligned with `returns` — OLS decomposition in submission order) | manifest |
| `holding_returns` (list of `{id, returns}`; per-holding return series aligned with `returns` — pairwise correlations) | manifest |
| `correlation_window` (integer, 2..periods; also compute correlations over the last this-many periods) | manifest |
| `stress_scenarios` (list of entries, below) | manifest |
| `stress_scenarios[].name` (string; carried into the stress row) | entry |
| `stress_scenarios[].portfolio_return` (number; a portfolio-level scenario return, used directly when numeric) | entry |
| `stress_scenarios[].shocks` (list of `{holding_id, return}`; per-holding scenario returns, weighted by current shares — every holding needs a shock) | entry |
| `decision_journal` (list of `{confidence, correct}`; confidence a number in [0, 1], correct a boolean — invalid entries are counted and excluded) | manifest |

## What is computed

- **Risk metrics** (the skill's descriptive statistics — they describe
  what the portfolio *has done*, never what it *should* do): mean and
  total return, best/worst period, positive-period fraction, sample
  volatility (n−1), downside deviation against the submitted risk-free
  target, Sharpe and Sortino (per-period and annualized), the
  drawdown path — maximum drawdown with its peak/trough periods,
  current drawdown, longest time underwater — and historical VaR /
  CVaR at the submitted confidence (nearest-rank: index
  ⌈(1−confidence)·n⌉−1 in the ascending sorted returns; CVaR is the
  mean of the returns at and beyond that rank). Annualized volatility
  is vol × √periods_per_year; annualized return is geometric,
  (cumulative wealth)^(periods_per_year/n) − 1.
- **Benchmark-relative:** beta (covariance ÷ benchmark variance, from
  deviation sums), Pearson correlation, tracking error (sample
  stdev of the return differences), benchmark mean/volatility/total
  return, and Jensen alpha when a risk-free rate is submitted.
- **Concentration:** weight sum, Herfindahl index over shares,
  effective holdings (1/HHI), largest holding, currency shares
  (null currency first, then alphabetical).
- **Carry:** per leveraged holding, net carry (income − financing)
  with a plain `negative_carry` flag when it is negative (the skill:
  "if carry is negative, say so plainly"), plus the share-weighted
  net carry when every leveraged holding submits both inputs.
- **Factor decomposition:** OLS of portfolio returns on an intercept
  plus the submitted factors (normal equations, partial-pivot
  Gaussian elimination, singular below a 10⁻¹² pivot), with R² and
  residual volatility.
- **Holding correlations:** every pairwise Pearson correlation over
  the submitted series (a constant series makes its pairs undefined —
  a labeled gap), the maximum pair, and the last-window matrix when
  `correlation_window` is submitted.
- **Stress tests:** each scenario applied to the current allocation —
  a submitted portfolio return directly, or per-holding shocks
  weighted by current shares. Scenario magnitudes are the caller's;
  none are invented here (the skill's named historical episodes are
  submitted as scenarios, not hard-coded).
- **Decision-journal calibration:** mean confidence vs hit rate,
  calibration gap (hit rate − mean confidence) and Brier score.
- **Layers:** the skill's five layers (holdings, risk metrics, factor
  exposures, concentration, decisions) are each reported `present` or
  `absent`. An absent layer is reported, never guessed at — but
  absence alone is not a gap: it adds no entry to the `gaps` list
  and does not by itself change the status (see the status rule
  below).
- **Not computed:** Monte Carlo. The skill asks for 1K–100K simulated
  paths; no seed, path count or simulation parameter is defaulted in
  this core, and a simulated distribution would not be a deterministic
  function of the manifest.

**Serialization rule (both implementations, byte-identical):** every
computed floating quantity is rendered as a string with exactly six
decimal places, rounded half away from zero on the binary double
(scaled = ⌊|x|·10⁶ + 0.5⌋; zero renders `0.000000`, never
`-0.000000`). Counts, period indices and ranks stay integers. All
internal arithmetic is IEEE-754 double arithmetic in a fixed loop
order using only +, −, ×, ÷ and √ (plus one power for geometric
annualization).

The output status is decided by the returns series and the `gaps`
list alone. It is one of `insufficient_evidence` (no returns
series, or fewer than 2 valid numeric observations), `complete`
(at least 2 valid observations and the `gaps` list is empty), or
`partial` (at least 2 valid observations and the `gaps` list is
non-empty — analytics computed but a labeled gap was recorded: a
missing or invalid parameter, invalid entries, a misaligned
series, singular factors, an uncomputable scenario). Only entries
in the `gaps` list count toward `partial`. The three parameters
`periods_per_year`, `risk_free_per_period` and `var_confidence`
each add a gap when absent or invalid, so `complete` requires
them; but an optional section that was not submitted at all
(`benchmark_returns`, `holdings`, `factors`, `holding_returns`,
`stress_scenarios`, `decision_journal`) adds no gap — its section
is null (for `stress_tests`, `[]`), where the section has a layer
that layer is reported `absent`, and the status can still be
`complete`.
`correlation_window` submitted without `holding_returns` likewise
computes nothing and adds no gap. The output carries `counts`,
the ordered `gaps` list naming every gap, the sections above
(null when their inputs are absent), and the skill's
non-advisory disclaimer carried on every output: educational
analytics only — the tool calculates; the user decides. No
recommendation, and nothing labeled optimal or recommended, is ever
produced.

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Product-internal and regulated borderline
