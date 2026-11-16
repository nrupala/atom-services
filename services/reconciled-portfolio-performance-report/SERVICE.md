# Reconciled portfolio performance report — `reconciled-portfolio-performance-report`

**Deliverable type:** REPORT. This atom sells the report it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Track and attribute honestly — positions ledger, TWR/IRR math, benchmarks, tax lots, privacy scrubbed.

A caller submits the inputs the bound skill works on and receives one report back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this report on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Investment ledger review and attribution**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the performance manifest

The caller submits one JSON manifest. `portfolio` (string) is carried
into the output, not itself analysed. Everything below is computed
over the submitted declarations only; nothing is defaulted, fetched
or interpolated — a figure whose inputs were not submitted is a
labeled gap (null), never silently filled in. The manifest carries
no account numbers or identifiers (the skill's privacy rule):
aggregate figures only.

| Field | Read from |
|---|---|
| `portfolio` (string; carried into the output, not itself analysed) | manifest |
| `beginning_value` (number; portfolio value at the start of the first period — required) | manifest |
| `period_end_values` (list of numbers; declared portfolio value at the end of each period, in period order — at least 2 valid entries required; non-numeric entries are counted in `counts.invalid_value_entries` and excluded) | manifest |
| `external_flows` (list of numbers, aligned period-for-period with `period_end_values`; each entry is the net external cash flow at the BEGINNING of its period — contributions positive, withdrawals negative. Absent or misaligned = period returns are gaps, never defaulted to zero) | manifest |
| `benchmark_name` (string; the benchmark chosen in advance, carried into the benchmark section) | manifest |
| `benchmark_returns` (list of numbers; benchmark periodic returns, aligned period-for-period with `period_end_values`) | manifest |
| `declared_returns` (list of numbers; the caller's own declared period returns, aligned period-for-period — reconciled against the computed period returns) | manifest |
| `holdings` (list of entries, below — the declared positions ledger) | manifest |
| `holdings[].id` (string; carried into the holding rows) | entry |
| `holdings[].quantity` / `holdings[].price` (numbers; holding value = quantity × price — an entry without both numeric is counted in `counts.invalid_holdings` and excluded) | entry |
| `transactions` (list of entries, below — the ledger's external-flow record) | manifest |
| `transactions[].kind` (`"contribution"` or `"withdrawal"`; anything else is counted in `counts.invalid_transactions` and excluded) | entry |
| `transactions[].amount` (number ≥ 0; the magnitude of that contribution or withdrawal) | entry |

## What is computed

- **Period returns** (flow-adjusted, from the declared values):
  r_i = V_i ÷ (V_{i−1} + F_i) − 1, with V_{−1} the beginning value
  and F_i the flow at the beginning of period i. A period whose
  base (previous value plus its flow) is not positive has no
  defined return; the whole return path is then a labeled gap —
  adjusted and unadjusted periods are never mixed.
- **Performance math, stated explicitly** (the skill: "pick, state
  which, and never mix. Show both when they tell different
  stories"): **time-weighted return** — the chain product of
  (1 + r_i) − 1, independent of cash-flow timing — and
  **money-weighted return (IRR) per period** — the rate solving
  B(1+r)^n + Σ F_i (1+r)^(n−i) = final value, found by a fixed
  bracket search (lower bracket −0.999999; upper bracket 1, 3, 7, …
  doubling-plus-one up to 1048575) followed by exactly 200
  bisection iterations, integer powers by repeated multiplication.
  When no sign-changing bracket exists in that searched range the
  IRR is a labeled gap, not a guess. Both are always labeled
  separately, the mean period return is shown, and the
  **TWR − IRR difference** is reported as its own figure. Also:
  value change, net external flows and total gain after flows
  (final − beginning − net flows).
- **Reconciliation** (the skill: reconcile to statements,
  discrepancies fixed at the source — this core reports the
  discrepancies as numbers and never edits a declared figure).
  Three legs: (1) **flows vs ledger** — declared net external
  flows minus ledger net (contributions − withdrawals from
  `transactions`); (2) **holdings vs declared value** — the
  holdings ledger total (Σ quantity × price) minus the final
  declared period-end value, and that difference as a fraction of
  the final value; (3) **declared vs computed returns** — the
  per-period differences, the largest absolute difference, and the
  count of periods whose difference is not zero at the report's
  six-decimal precision. A discrepancy is a *finding*, not a gap:
  a fully evidenced report with a nonzero discrepancy is
  `complete`, with the discrepancy printed.
- **Benchmark comparison** (only over a series aligned
  period-for-period): benchmark total return (chain product),
  benchmark mean period return, excess total return (portfolio
  TWR − benchmark total) and the count of periods in which the
  portfolio period return exceeded the benchmark's.
- **Holdings ledger:** per-holding value (quantity × price) and
  share of the holdings total, the holdings total, and the
  largest holding.
- **Layers:** values, performance, reconciliation, benchmark and
  holdings are each reported `present` or `absent` — missing
  layers are gaps, not guesses.
- **Not computed — named exclusions:** **XIRR** (the skill names
  it but states no date or day-count convention; this core
  computes the periodic IRR on the submitted period grid
  instead); **attribution decomposition** (allocation vs
  selection vs timing vs costs vs currency — the skill asks for a
  written one-paragraph truth, a judgment artifact, and supplies
  no input data model or formula for the decomposition);
  **tax lots / adjusted cost base** (the skill asks for awareness
  and clean data for an accountant, and states no jurisdictional
  computation); **benchmark fees/taxes adjustment** ("including
  fees and taxes where material" — no materiality rule or tax
  model is stated). No recommendation, and nothing labeled
  optimal or recommended, is ever produced.

**Serialization rule (both implementations, byte-identical):** every
computed floating quantity is rendered as a string with exactly six
decimal places, rounded half away from zero on the binary double
(scaled = ⌊|x|·10⁶ + 0.5⌋; zero renders `0.000000`, never
`-0.000000`). Counts and period indices stay integers. Declared
quantities echoed into the report (beginning and period-end values,
flows, quantities, prices, amounts) are rendered under the same
rule. All internal arithmetic is IEEE-754 double arithmetic in a
fixed loop order using only +, −, ×, ÷ (and integer powers by
repeated multiplication).

The output status is one of `complete` (a numeric beginning value,
a values series with at least 2 valid observations, flows aligned,
and no gaps of any kind), `partial` (performance computed but some
figure or section is a labeled gap — missing flows, misaligned
series, invalid entries, an unbracketed money-weighted return), or
`insufficient_evidence` (no numeric beginning value, or fewer than
2 valid numeric period-end values), with `counts`, the ordered
`gaps` list naming every gap, the sections above (null when their
inputs are absent), and the non-advisory disclaimer carried on
every output: educational reporting only — the tool calculates;
the user decides.

## Status

Tier A · status: **built-locally** — deterministic core built and
verified locally (Python oracle + byte-identical TypeScript port);
no endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Finance-adjacent; reporting not advice
