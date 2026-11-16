# Portfolio risk analytics report — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You hold a portfolio and want its risk numbers computed, not narrated. This atom takes a returns series (plus optional benchmark returns, holdings, factors, holding series, stress scenarios and a decision journal) and computes a risk analytics report: total and annualized return, volatility, max drawdown, historical VaR/CVaR, Sharpe and Sortino, benchmark beta/alpha/correlation/tracking error, concentration, factor decomposition and stress results — each layer reported, and anything that cannot be computed from what you submitted is named as a gap, never invented. The status is **complete** (everything computable, no gaps), **partial** (a report was computed but some layers are gaps), or **insufficient_evidence** (fewer than 2 valid numeric returns — nothing can be computed). Same input in → same report out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "portfolio-risk-analytics-report"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/portfolio-risk-analytics-report`
  — tool name `portfolio_risk_analytics_report`; `tools/call` arguments = the input object below.
- **REST:** `POST https://atoms.pipavia.com/v1/portfolio-risk-analytics-report`
  — body = the input object; same `Authorization` header.

## Input — the portfolio manifest

| Field | Meaning |
|---|---|
| `portfolio` (string) | carried into the output, not itself analysed |
| `returns` (list of numbers) | portfolio periodic simple returns, e.g. `0.01` = +1% — the core series; non-numeric entries are counted in `counts.invalid_return_entries` and excluded |
| `benchmark_returns` (list of numbers) | benchmark periodic returns, aligned period-for-period with `returns` |
| `periods_per_year` (number > 0) | annualization parameter — absent = annualized metrics are gaps, no default is applied |
| `risk_free_per_period` (number) | per-period risk-free return — the Sharpe/Sortino excess target and Jensen-alpha baseline; absent = those metrics are gaps |
| `var_confidence` (number strictly between 0 and 1) | confidence for historical VaR/CVaR; absent = VaR/CVaR are gaps |
| `holdings` (list of entries, below) | declared holdings |
| `holdings[].id` (string) | carried into concentration / carry / stress rows |
| `holdings[].weight` (number) | holding weight in any consistent unit — shares are weight ÷ weight sum; an entry without a numeric weight is counted in `counts.invalid_holdings` and excluded |
| `holdings[].currency` (string) | groups the currency-share breakdown; absence groups under null |
| `holdings[].leveraged` (boolean) | `true` marks a leveraged holding for carry analysis |
| `holdings[].income_per_period` (number) | carry input for leveraged holdings — net carry = income − financing |
| `holdings[].financing_per_period` (number) | carry input for leveraged holdings — net carry = income − financing |
| `factors` (list of `{name, returns}`) | factor return series aligned with `returns` — OLS decomposition in submission order |
| `holding_returns` (list of `{id, returns}`) | per-holding return series aligned with `returns` — pairwise correlations |
| `correlation_window` (integer, 2..periods) | also compute correlations over the last this-many periods |
| `stress_scenarios` (list of entries, below) | caller-submitted stress scenarios |
| `stress_scenarios[].name` (string) | carried into the stress row |
| `stress_scenarios[].portfolio_return` (number) | a portfolio-level scenario return, used directly when numeric |
| `stress_scenarios[].shocks` (list of `{holding_id, return}`) | per-holding scenario returns, weighted by current shares — every holding needs a shock |
| `decision_journal` (list of `{confidence, correct}`) | confidence a number in [0, 1], correct a boolean — invalid entries are counted and excluded |

Only `returns` is strictly required to compute anything (at least 2
valid numeric observations); every other input adds a layer, and any
layer that cannot be computed is named in the report's `gaps` list
rather than invented.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/portfolio-risk-analytics-report`:

```json
{
  "portfolio": "Test Portfolio",
  "returns": [
    0.01,
    -0.02,
    0.03
  ],
  "benchmark_returns": [
    0.005,
    -0.01,
    0.02
  ],
  "periods_per_year": 12,
  "risk_free_per_period": 0.001,
  "var_confidence": 0.95,
  "holdings": [
    {
      "id": "A",
      "weight": 0.5,
      "currency": "USD"
    },
    {
      "id": "B",
      "weight": 0.5,
      "currency": "USD"
    }
  ],
  "correlation_window": 2
}
```

Response — HTTP 200 (trimmed; the full response carries every computed
layer and a text stamp of the report):

```json
{
  "service": "portfolio-risk-analytics-report",
  "atom_version": "0.1.0",
  "portfolio": "Test Portfolio",
  "status": "complete",
  "layers": {
    "holdings": "present",
    "risk_metrics": "present",
    "factor_exposures": "absent",
    "concentration": "present",
    "decisions": "absent"
  },
  "summary": "Risk analytics over 3 periods: total return 0.019494, volatility per period 0.025166, max drawdown -0.020000; 0 gaps.",
  "counts": {
    "periods": 3,
    "invalid_return_entries": 0,
    "holdings": 2,
    "invalid_holdings": 0,
    "journal_entries": 0,
    "invalid_journal_entries": 0,
    "scenarios": 0,
    "invalid_scenarios": 0,
    "factors": 0,
    "holding_series": 0,
    "invalid_holding_series": 0
  }
}
```

## Statuses

- **complete** — a returns series with at least 2 valid observations and every submitted layer computed; no gaps.
- **partial** — a report was computed, but one or more layers are gaps (missing inputs, misaligned benchmark, invalid holdings) — the `gaps` list names each one.
- **insufficient_evidence** — fewer than 2 valid numeric return observations — risk analytics cannot be computed; the report says why.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
