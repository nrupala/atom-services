# Reconciled portfolio performance report — user guide

## What it does

You hold a portfolio's declared figures — beginning value, period-end
values, external cash flows, a benchmark, your own declared returns, a
holdings ledger and a transactions ledger. This atom computes the
performance properly and reconciles it: flow-adjusted period returns,
the **time-weighted return** (chain product) and the **money-weighted
return per period** (IRR) reported separately and never mixed,
benchmark comparison, and three reconciliation legs (declared flows
vs the transactions ledger; holdings total vs the final declared
value; your declared returns vs the computed returns). A discrepancy
is printed as a number, never silently fixed. The status is
**complete**, **partial** (some figure is a labeled gap — the report
names every gap), or **insufficient_evidence**. Every output carries
the disclaimer: educational reporting only — not financial advice;
the tool calculates, you decide. Same manifest in → same report out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "reconciled-portfolio-performance-report"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/reconciled-portfolio-performance-report`
  — tool name `reconciled_portfolio_performance_report`; `tools/call`
  arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/reconciled-portfolio-performance-report`
  — body = the manifest object; same `Authorization` header.

## Input — the performance manifest

| Field | Meaning |
|---|---|
| `portfolio` | portfolio name (string; carried into the output, not itself analysed) |
| `beginning_value` | number; value at the start of the first period (required) |
| `period_end_values` | list of numbers; declared value at the end of each period, in order (at least 2 valid entries required) |
| `external_flows` | list of numbers aligned period-for-period; net external flow at the **beginning** of each period (contributions positive, withdrawals negative). Absent or misaligned = returns are gaps, never defaulted to zero |
| `benchmark_name`, `benchmark_returns` | the benchmark chosen in advance, and its periodic returns aligned period-for-period |
| `declared_returns` | your own declared period returns, aligned — reconciled against the computed ones |
| `holdings[]` | positions ledger entries `{id, quantity, price}`; holding value = quantity × price |
| `transactions[]` | flow ledger entries `{kind: "contribution" \| "withdrawal", amount}` (amount ≥ 0) |

All computed figures are strings with exactly six decimals. Counts
stay integers.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/reconciled-portfolio-performance-report`:

```json
{
  "portfolio": "Test Portfolio",
  "beginning_value": 1000.0,
  "period_end_values": [1100.0, 1210.0],
  "external_flows": [0.0, 0.0],
  "benchmark_name": "S&P500",
  "benchmark_returns": [0.05, 0.05],
  "declared_returns": [0.1, 0.1],
  "holdings": [{"id": "A", "quantity": 10, "price": 121.0}],
  "transactions": [{"kind": "contribution", "amount": 0.0}]
}
```

Response — HTTP 200 (trimmed; the full response also carries the
benchmark section, all three reconciliation legs, the holdings rows
and a text stamp):

```json
{
  "service": "reconciled-portfolio-performance-report",
  "atom_version": "0.1.0",
  "portfolio": "Test Portfolio",
  "status": "complete",
  "performance": {
    "periods": 2,
    "beginning_value": "1000.000000",
    "final_value": "1210.000000",
    "value_change": "210.000000",
    "net_external_flows": "0.000000",
    "total_gain_after_flows": "210.000000",
    "period_returns": ["0.100000", "0.100000"],
    "time_weighted_return": "0.210000",
    "money_weighted_return_per_period": "0.100000",
    "mean_period_return": "0.100000",
    "twr_irr_difference": "0.110000"
  },
  "summary": "Reconciled performance over 2 periods: time-weighted return 0.210000, money-weighted return per period 0.100000, final value 1210.000000; 0 gaps."
}
```

## Statuses

- **complete** — beginning value, at least 2 period-end values, flows
  aligned, and no gaps of any kind. A nonzero reconciliation
  discrepancy does **not** block `complete` — it is printed as a
  finding.
- **partial** — performance was computed, but some figure or section
  is a labeled gap (missing/misaligned flows, invalid entries, an
  unbracketed money-weighted return); the `gaps` list names each one.
- **insufficient_evidence** — no numeric beginning value, or fewer
  than 2 valid numeric period-end values; performance cannot be
  computed.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
