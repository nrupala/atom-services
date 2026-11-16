# Portfolio risk analytics report — `portfolio-risk-analytics-report`

**Portfolio risk analytics report** · slug `portfolio-risk-analytics-report` · deliverable type: REPORT · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Field table source: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

Bound capability (from SERVICE.md): Institutional-grade personal financial analytics — what to track, how to benchmark, how to separate signal from noise. Risk metrics, factor decomposition, stress tests, decision journaling. Tool calculates, user decides.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run — the exact request and response are reproduced verbatim under **Worked examples → 1. Full-pass** below, so every number quoted here can be checked against that record.

**Step 1 — Get a key.** Follow the key flow in the How-to below (sign up, mint a session, issue a key for this atom). You send that key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** Build one JSON object for the subject `portfolio` = `Test Portfolio`. Fill in every group in the Input reference: absent fields are not neutral — they become missing evidence (or, for the report atom, labeled gaps). Present-but-wrong values are what produce a failing verdict, so declare what is actually true, including the red-line fields that must be `false`.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/portfolio-risk-analytics-report` with the manifest as the body and the Authorization header (full curl in the How-to below).

**Step 4 — Read the report.** The recorded call returned HTTP 200 with `status: "complete"`, and the summary: "Risk analytics over 3 periods: total return 0.019494, volatility per period 0.025166, max drawdown -0.020000; 0 gaps." Computed quantities are strings with exactly six decimal places (see Reference → Output format); sections that were not submitted are `null` or `[]`, layers are reported `present` / `absent`, `gaps` lists anything that could not be computed, and every report carries the non-advisory `disclaimer`.

**Step 5 — Confirm determinism.** The verification battery called the same manifest twice over REST and once over MCP: the REST repeat was byte-identical and the MCP structured content was equal to the REST result (see TEST-REPORT.md). Same manifest in → same result out is the product property, not a hope.

**Step 6 — Iterate.** If the result is not the passing one, do not resubmit blindly: use the How-to 'Read a failing verdict and fix the manifest' below. Each failing or missing check names the exact field to correct or supply.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "portfolio-risk-analytics-report"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom (USER-GUIDE.md). The contract adds: scope is this atom only — a key for one atom never verifies for another.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -s -X POST https://atoms.pipavia.com/v1/portfolio-risk-analytics-report \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

### Call via MCP

- MCP endpoint: `POST https://atoms.pipavia.com/mcp/portfolio-risk-analytics-report`
- Tool name: `portfolio_risk_analytics_report` (recorded in evidence.json as `mcp_tool_name`; `tools/list` returned HTTP 200).
- Call the tool with `tools/call`; the tool arguments are exactly the input object documented in the Input reference — the same manifest as the REST body, with no wrapper fields of the atom's own.
- MCP and REST are two faces of the same deterministic core: the verification battery's parity case checks that MCP structured content equals the REST result for the full-pass manifest.

### Read a failing verdict and fix the manifest

Use the recorded violations run (Worked examples → 2. Violations) as the pattern. For this report atom a 'violations' input does not produce a failing verdict — it produces `status: "partial"` with an ordered `gaps` list. The recorded run's gaps were:

- periods_per_year not submitted — annualized volatility, annualized return and annualized Sharpe/Sortino are gaps
- risk_free_per_period not submitted — Sharpe, Sortino, downside deviation and alpha are gaps
- var_confidence not submitted — historical VaR and CVaR are gaps
- benchmark_returns does not align with returns (1 valid of 1 submitted vs 2 periods) — benchmark metrics are gaps
- holdings: 1 entries without a numeric weight excluded

Fix procedure:

1. **Read `gaps` first, not the numbers.** Each gap names the missing parameter, the misaligned series, or the excluded invalid entries, and which metrics it suppresses.
2. **Supply the named parameter or fix the named series** — for example submit `periods_per_year` to unlock annualized metrics, `risk_free_per_period` for Sharpe / Sortino / downside deviation / alpha, `var_confidence` for VaR / CVaR, and make `benchmark_returns` align period-for-period with `returns`.
3. **Check `counts`.** `counts.invalid_*` tallies tell you how many submitted entries were excluded (for example a holding without a numeric weight). Fix those entries at the source rather than accepting a silently smaller report.
4. **Resubmit the whole manifest.** The atom is stateless per call; there is no partial update.

### Handle a 422 invalid_input

A 422 is not a verdict — the manifest was rejected before evaluation because a field had the wrong JSON type. The recorded malformed run (Worked examples → 3. Malformed) returned exactly:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "portfolio",
  "detail": "portfolio must be a string"
}
```

Fix the field named in `field` (`portfolio`): `detail` says what was expected ("portfolio must be a string"). Correct the type in your manifest — do not delete the field to dodge the error, because an absent field becomes missing evidence / a gap and changes the result — then resubmit. Note the contrast the verification battery was built to enforce: a type-violating field is a 422, while an absent field is evaluated as missing evidence.

## Reference

### Endpoints

| Face | Endpoint | Notes |
|---|---|---|
| REST | `POST https://atoms.pipavia.com/v1/portfolio-risk-analytics-report` | Body = the input object; `Authorization: Bearer <key>` |
| MCP | `POST https://atoms.pipavia.com/mcp/portfolio-risk-analytics-report` | Tool name `portfolio_risk_analytics_report`; `tools/call` arguments = the input object |
| Gateway | `https://atoms.pipavia.com` | Recorded gateway version 1.1.0; health HTTP 200 at evidence time |

### Input reference

Types are taken from SERVICE.md's field table parentheticals, preserved below. Notes / conditions are preserved from SERVICE.md.

#### `portfolio`

| Field | Type | Read by / notes |
|---|---|---|
| `portfolio` | string | Read by: manifest; carried into the output, not itself analysed |

#### `returns`

| Field | Type | Read by / notes |
|---|---|---|
| `returns` | list of numbers | Read by: manifest; portfolio periodic simple returns, e.g. `0.01` = +1% — the core series; non-numeric entries are counted in `counts.invalid_return_entries` and excluded |

#### `benchmark_returns`

| Field | Type | Read by / notes |
|---|---|---|
| `benchmark_returns` | list of numbers | Read by: manifest; benchmark periodic returns, aligned period-for-period with `returns` |

#### `periods_per_year`

| Field | Type | Read by / notes |
|---|---|---|
| `periods_per_year` | number > 0 | Read by: manifest; annualization parameter — absent = annualized metrics are gaps, no default is applied |

#### `risk_free_per_period`

| Field | Type | Read by / notes |
|---|---|---|
| `risk_free_per_period` | number | Read by: manifest; per-period risk-free return — the Sharpe/Sortino excess target and Jensen-alpha baseline; absent = those metrics are gaps |

#### `var_confidence`

| Field | Type | Read by / notes |
|---|---|---|
| `var_confidence` | number strictly between 0 and 1 | Read by: manifest; confidence for historical VaR/CVaR; absent = VaR/CVaR are gaps |

#### `holdings`

| Field | Type | Read by / notes |
|---|---|---|
| `holdings` | list of entries, below | Read by: manifest |
| `holdings[].id` | string | Read by: entry; carried into concentration / carry / stress rows |
| `holdings[].weight` | number | Read by: entry; holding weight in any consistent unit — shares are weight ÷ weight sum; an entry without a numeric weight is counted in `counts.invalid_holdings` and excluded |
| `holdings[].currency` | string | Read by: entry; groups the currency-share breakdown; absence groups under null |
| `holdings[].leveraged` | boolean | Read by: entry; `true` marks a leveraged holding for carry analysis |
| `holdings[].income_per_period` | number | Read by: entry; carry input for leveraged holdings — net carry = income − financing (SERVICE.md lists this field and `holdings[].financing_per_period` in one combined table row; they are documented separately here) |
| `holdings[].financing_per_period` | number | Read by: entry; carry input for leveraged holdings — net carry = income − financing (see the note on the row above) |

#### `factors`

| Field | Type | Read by / notes |
|---|---|---|
| `factors` | list of `{name, returns}` | Read by: manifest; factor return series aligned with `returns` — OLS decomposition in submission order |

#### `holding_returns`

| Field | Type | Read by / notes |
|---|---|---|
| `holding_returns` | list of `{id, returns}` | Read by: manifest; per-holding return series aligned with `returns` — pairwise correlations |

#### `correlation_window`

| Field | Type | Read by / notes |
|---|---|---|
| `correlation_window` | integer, 2..periods | Read by: manifest; also compute correlations over the last this-many periods |

#### `stress_scenarios`

| Field | Type | Read by / notes |
|---|---|---|
| `stress_scenarios` | list of entries, below | Read by: manifest |
| `stress_scenarios[].name` | string | Read by: entry; carried into the stress row |
| `stress_scenarios[].portfolio_return` | number | Read by: entry; a portfolio-level scenario return, used directly when numeric |
| `stress_scenarios[].shocks` | list of `{holding_id, return}` | Read by: entry; per-holding scenario returns, weighted by current shares — every holding needs a shock |

#### `decision_journal`

| Field | Type | Read by / notes |
|---|---|---|
| `decision_journal` | list of `{confidence, correct}` | Read by: manifest; confidence a number in [0, 1], correct a boolean — invalid entries are counted and excluded |

Input fields documented: 21 (every field in SERVICE.md's field table, typed; SERVICE.md's table has 20 rows, one of which lists two fields — `holdings[].income_per_period` and `holdings[].financing_per_period` — which are documented as two fields here).

### Checks

**This atom has no `checks` array.** It is a computed REPORT atom, not a verdict-over-checks atom: the recorded responses contain no `checks` field in any case (full-pass, violations, sparse or malformed). What it returns instead is the set of computed outputs below. Do not look for pass / fail check semantics here — the analogous signals are `status`, the `layers` map (`present` / `absent`), the ordered `gaps` list, and the `counts` tallies.

This is a computed REPORT atom: its responses carry no `checks` array. Everything in the output is computed from the submitted series — see 'Computed outputs' in the Reference section instead of a check list. Monte Carlo is excluded by design (see Explanation).

### Computed outputs

Top-level output fields, in the recorded full-pass response order: `service`, `atom_version`, `portfolio`, `status`, `layers`, `counts`, `gaps`, `risk_metrics`, `benchmark`, `concentration`, `carry`, `factor_decomposition`, `holding_correlations`, `stress_tests`, `decision_journal`, `disclaimer`, `summary`, `stamp`. A section is `null` (or, for `stress_tests`, `[]`) when its inputs were not submitted.

#### `risk_metrics` — computed when a valid returns series exists (all keys recorded in the full-pass run)

`periods` (integer), `mean_return_per_period`, `total_return`, `best_period_return`, `worst_period_return`, `positive_period_fraction`, `volatility_per_period` (sample volatility, n−1), `annualized_volatility` (vol × √periods_per_year; gap when `periods_per_year` absent), `annualized_return` (geometric), `downside_deviation_per_period` (against the submitted risk-free target), `sharpe_per_period`, `sharpe_annualized`, `sortino_per_period`, `sortino_annualized` (Sharpe / Sortino are gaps when `risk_free_per_period` absent), `max_drawdown`, `max_drawdown_peak_period` (integer), `max_drawdown_trough_period` (integer), `current_drawdown`, `longest_underwater_periods` (integer), `var_confidence`, `historical_var`, `historical_cvar` (historical VaR / CVaR at the submitted confidence, nearest-rank; gaps when `var_confidence` absent). All floating quantities are six-decimal strings (see Output format).

#### `benchmark` — computed when `benchmark_returns` aligns period-for-period with `returns`

Recorded keys: `aligned` (boolean), `periods` (integer), `mean_return_per_period`, `volatility_per_period`, `total_return`, `beta` (covariance ÷ benchmark variance), `correlation` (Pearson), `tracking_error_per_period` (sample stdev of the return differences), `alpha_per_period` (Jensen alpha; requires a submitted risk-free rate). A misaligned benchmark is a gap, as in the recorded violations run, not a computed section.

#### `concentration` — computed from valid `holdings[]` weights

Recorded keys: `holdings_count` (integer), `weight_sum`, `hhi` (Herfindahl index over shares), `effective_holdings` (1/HHI), `largest_holding_id`, `largest_holding_share`, `currency_shares` (list of `{currency, share}`; null currency first, then alphabetical).

#### `carry` — computed for leveraged holdings (`null` in the full-pass run: no leveraged holding was submitted)

Per SERVICE.md: per leveraged holding, net carry = income − financing, with a plain `negative_carry` flag when it is negative, plus the share-weighted net carry when every leveraged holding submits both `income_per_period` and `financing_per_period`.

#### `factor_decomposition` — computed from `factors[]` (`null` in the full-pass run: no factors submitted)

Per SERVICE.md: OLS of portfolio returns on an intercept plus the submitted factors (normal equations, partial-pivot Gaussian elimination, singular below a 10⁻¹² pivot), with R² and residual volatility. A singular factor set is a gap.

#### `holding_correlations` — computed from `holding_returns[]` (`null` in the full-pass run: no holding series submitted)

Per SERVICE.md: every pairwise Pearson correlation over the submitted series (a constant series makes its pairs undefined — a labeled gap), the maximum pair, and the last-window matrix when `correlation_window` is submitted.

#### `stress_tests` — one row per submitted scenario (`[]` in the full-pass run: no scenarios submitted)

Per SERVICE.md: each scenario is applied to the current allocation — a submitted `portfolio_return` directly, or per-holding `shocks` weighted by current shares (every holding needs a shock). An uncomputable scenario is a gap.

#### `decision_journal` — computed from `decision_journal[]` (`null` in the full-pass run: no journal submitted)

Per SERVICE.md: mean confidence vs hit rate, calibration gap (hit rate − mean confidence) and Brier score, over entries with `confidence` in [0, 1] and boolean `correct`; invalid entries are counted in `counts.invalid_journal_entries` and excluded.

#### `counts`, `layers`, `gaps`

`counts` recorded keys: `periods`, `invalid_return_entries`, `holdings`, `invalid_holdings`, `journal_entries`, `invalid_journal_entries`, `scenarios`, `invalid_scenarios`, `factors`, `holding_series`, `invalid_holding_series` (all integers). `layers` recorded keys: `holdings`, `risk_metrics`, `factor_exposures`, `concentration`, `decisions`, each `present` or `absent`. `gaps` is an ordered list of human-readable gap strings naming every gap (empty in the full-pass run).

### Output format

A JSON report object — see Computed outputs above for the full field list in recorded order.

Serialization rule (SERVICE.md, both implementations byte-identical): every computed floating quantity is rendered as a **string with exactly six decimal places**, rounded half away from zero on the binary double (scaled = ⌊|x|·10⁶ + 0.5⌋; zero renders `0.000000`, never `-0.000000`). Counts, period indices and ranks stay integers. `summary` is a one-line human summary; `stamp` is a plain-text rendering of the report including the disclaimer; `disclaimer` is carried on every output.

Determinism: the same manifest produces a byte-identical REST response on repeat, and MCP structured content equal to REST (both recorded in the verification battery).

### Verdict vocabulary

This atom returns a `status`, not a `verdict`. Every status value it can return (from SERVICE.md and the recorded responses — the recorded cases exercise all three):

| Status | Meaning |
|---|---|
| `complete` | A returns series with at least 2 valid observations and no gaps of any kind. Note the recorded full-pass run below is `complete` with `gaps: []` even though `layers.factor_exposures` and `layers.decisions` are `absent` and `carry`, `factor_decomposition`, `holding_correlations` and `decision_journal` are `null` — those layers were not submitted, and the recorded status treats unsubmitted optional layers as absent, not as gaps. See the gap note in the checklist at the end of this document. |
| `partial` | Analytics were computed, but some metric or layer is a labeled gap — missing parameter, invalid entries, misaligned series, singular factors, or an uncomputable scenario. The ordered `gaps` list names every gap. The recorded violations example is `partial` with 5 gaps. |
| `insufficient_evidence` | No returns series, or fewer than 2 valid numeric observations — nothing can be computed. The recorded sparse example is `insufficient_evidence` with 1 valid observation. |

Layer statuses (values of the `layers` object): `present` (the layer's inputs were submitted) and `absent` (they were not). There are no per-check statuses and no section statuses in this atom's output.

### Errors

Only error shapes evidenced in the repo / gateway documentation are listed. The 422 shape is recorded verbatim in the evidence; the other statuses are named in USER-GUIDE.md with the meanings below — no payload shape for them is recorded in the evidence, so none is invented here.

| HTTP | Meaning | Shape / notes |
|---|---|---|
| 401 | Unauthenticated — missing / invalid key | Named in USER-GUIDE.md; send `Authorization: Bearer <key>` |
| 403 | Key lacks this atom's scope | Named in USER-GUIDE.md; issue a key for this atom (contract: scope is this atom only) |
| 422 | `invalid_input` — a field has the wrong JSON type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance: field `portfolio`, detail "portfolio must be a string" |
| 429 | Rate limit exceeded | Named in USER-GUIDE.md; limits below |

### Rate limits + pricing status

- Rate limit (contract.yaml): **60 per key per minute, 10,000 per key per day**.
- Pricing (contract.yaml): `pricing.rate` is `null` (`rate_status: pending`), so the rate is: **Free during trial — rate pending.** No price is set; SERVICE.md states prices are set only from measured production cost per unit.

## Explanation

What this atom does in depth. Serialization is part of the contract: every computed floating quantity is rendered as a string with exactly six decimal places, rounded half away from zero on the binary double (zero renders `0.000000`, never `-0.000000`); counts, period indices and ranks stay integers. All internal arithmetic is IEEE-754 double arithmetic in a fixed loop order using only +, −, ×, ÷ and √ (plus one power for geometric annualization), so the same manifest produces a byte-identical report.

**How the status is decided — the deterministic core.** The atom computes, in a fixed order, every analytic whose inputs are present, and labels everything else a gap instead of estimating it. `status` is then a pure function of the returns series and the gap list: fewer than 2 valid numeric observations → `insufficient_evidence`; a computable report with any gap → `partial`; a computable report with no gaps → `complete` (subject to the recorded full-pass nuance noted in the Verdict vocabulary: unsubmitted optional layers are `absent` without appearing in `gaps`). There is no model call and no judgment step — the same manifest always produces the same report.

**Monte Carlo — excluded by design.** SERVICE.md is explicit: the bound skill asks for 1K–100K simulated paths, but no seed, path count or simulation parameter is defaulted in this core, and a simulated distribution would not be a deterministic function of the manifest. Monte Carlo is therefore a named non-output of this atom, not an omission.

**What it does NOT do:**

- Monte Carlo is NOT computed — excluded by design. SERVICE.md: the skill asks for 1K–100K simulated paths; no seed, path count or simulation parameter is defaulted in this core, and a simulated distribution would not be a deterministic function of the manifest.
- Nothing is defaulted and missing data is never interpolated: a metric whose parameter was not submitted is a labeled gap (`null`), never silently filled in.
- No recommendation is ever produced, and nothing is labeled optimal or recommended. Every output carries the disclaimer: 'Educational analytics only — not financial advice. The tool calculates; the user decides.' The metrics describe what the portfolio has done, never what it should do.
- Scenario magnitudes are the caller's; none are invented here. The skill's named historical episodes are submitted as scenarios, not hard-coded.
- Entries with the wrong shape inside `returns`, `holdings`, `holding_returns`, `stress_scenarios` and `decision_journal` are counted in `counts` (for example `counts.invalid_return_entries`, `counts.invalid_holdings`) and excluded, rather than failing the whole report — while a top-level field of the wrong JSON type is a 422 (see Errors).

**Buyer / use context.** First buyer hypothesis (SERVICE.md, not yet market-tested): teams and agents working in Money & markets who need this report on demand (first buyer hypothesis in SERVICE.md, not yet market-tested). Internal self-use (R3, passed): Personal portfolio risk analytics runs — Wright is an internal caller at zero price, metered to the internal cost ledger. The atom sells its deliverable — the report it produces — never the underlying knowledge itself.

## Role views

### For integrators (Users)

Start with USER-GUIDE.md for the quick start, then the Tutorial and How-to guides above. Your integration surface is exactly two endpoints (REST and MCP, same manifest, same result), one scoped key, and the error table above. Pin your client to the verdict / status vocabulary and the per-check (or gaps) semantics in the Reference — those are the stable contract at atom version 0.1.0; treat `evidence` / `summary` strings as human-readable, not parse targets, except for `checks[].section`, `checks[].check` and `checks[].status` (or, for the report atom, `status`, `layers`, `counts` and `gaps`) which are machine-stable.

### For developers

Manifest authoring: author against the Input reference — every SERVICE.md field, typed, with its gates. Determinism: the core is a pure function of the manifest (Python 3, stdlib only); the same manifest yields a byte-identical REST repeat and MCP/REST parity, both recorded. Implementation: `src/portfolio_risk_analytics_report.py` — contract entry: src/portfolio_risk_analytics_report.py — evaluate(manifest) -> risk-analytics report dict; CLI prints JSON + stamp. Tests: tests/test_portfolio_risk_analytics_report.py — 32 tests, all passing 2026-11-15. Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract binding rule R1).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/portfolio-risk-analytics-report`, MCP `POST https://atoms.pipavia.com/mcp/portfolio-risk-analytics-report` (tool `portfolio_risk_analytics_report`). Gateway version recorded at evidence time: 1.1.0. Rate limits: 60/min and 10,000/day per key; watch for 429s as the capacity signal. Key scope: per user, per atom — a 403 spike means clients using a key without this atom's scope, not an outage. Error monitoring: separate 422s (client manifest type errors; the `field` value is the diagnostic) from verdict outcomes (200 with a failing verdict / partial status is a successful call, not an error). Status: live — release candidate, one-week RC soak to 2026-11-22; verification retest verdict PASS on 2026-11-15 (gateway 1.1.0, deployment 7f9cae9fdd60417eb72062905a066554).

## Worked examples

Provenance: recorded 2026-11-15T23:53:46.382331+00:00 against gateway v1.1.0, external verification lane, source `verification/work/portfolio-risk-analytics-report/evidence.json`. The three examples below are that record's `full-pass`, `violations` and `malformed` cases: each is the case's `input` followed by the REST execution's `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values identical to the record — mechanically verified, see the checklist below).

### 1. Full-pass — `full-pass` (recorded HTTP 200)

Input:

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

Response (REST `response_text`):

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
  },
  "gaps": [],
  "risk_metrics": {
    "periods": 3,
    "mean_return_per_period": "0.006667",
    "total_return": "0.019494",
    "best_period_return": "0.030000",
    "worst_period_return": "-0.020000",
    "positive_period_fraction": "0.666667",
    "volatility_per_period": "0.025166",
    "annualized_volatility": "0.087178",
    "annualized_return": "0.080286",
    "downside_deviation_per_period": "0.012124",
    "sharpe_per_period": "0.225171",
    "sharpe_annualized": "0.780013",
    "sortino_per_period": "0.467379",
    "sortino_annualized": "1.619048",
    "max_drawdown": "-0.020000",
    "max_drawdown_peak_period": 0,
    "max_drawdown_trough_period": 1,
    "current_drawdown": "0.000000",
    "longest_underwater_periods": 1,
    "var_confidence": "0.950000",
    "historical_var": "0.020000",
    "historical_cvar": "0.020000"
  },
  "benchmark": {
    "aligned": true,
    "periods": 3,
    "mean_return_per_period": "0.005000",
    "volatility_per_period": "0.015000",
    "total_return": "0.014849",
    "beta": "1.666667",
    "correlation": "0.993399",
    "tracking_error_per_period": "0.010408",
    "alpha_per_period": "-0.001000"
  },
  "concentration": {
    "holdings_count": 2,
    "weight_sum": "1.000000",
    "hhi": "0.500000",
    "effective_holdings": "2.000000",
    "largest_holding_id": "A",
    "largest_holding_share": "0.500000",
    "currency_shares": [
      {
        "currency": "USD",
        "share": "1.000000"
      }
    ]
  },
  "carry": null,
  "factor_decomposition": null,
  "holding_correlations": null,
  "stress_tests": [],
  "decision_journal": null,
  "disclaimer": "Educational analytics only — not financial advice. The tool calculates; the user decides.",
  "summary": "Risk analytics over 3 periods: total return 0.019494, volatility per period 0.025166, max drawdown -0.020000; 0 gaps.",
  "stamp": "PORTFOLIO RISK ANALYTICS REPORT\nportfolio: Test Portfolio\nSTATUS: complete\nRisk analytics over 3 periods: total return 0.019494, volatility per period 0.025166, max drawdown -0.020000; 0 gaps.\nEducational analytics only — not financial advice. The tool calculates; the user decides."
}
```

### 2. Violations — `violations` (recorded HTTP 200)

Input:

```json
{
  "portfolio": "Violated Portfolio",
  "returns": [
    0.01,
    0.02
  ],
  "benchmark_returns": [
    0.01
  ],
  "holdings": [
    {
      "id": "A",
      "weight": "invalid_string"
    }
  ]
}
```

Response (REST `response_text`):

```json
{
  "service": "portfolio-risk-analytics-report",
  "atom_version": "0.1.0",
  "portfolio": "Violated Portfolio",
  "status": "partial",
  "layers": {
    "holdings": "present",
    "risk_metrics": "present",
    "factor_exposures": "absent",
    "concentration": "absent",
    "decisions": "absent"
  },
  "counts": {
    "periods": 2,
    "invalid_return_entries": 0,
    "holdings": 0,
    "invalid_holdings": 1,
    "journal_entries": 0,
    "invalid_journal_entries": 0,
    "scenarios": 0,
    "invalid_scenarios": 0,
    "factors": 0,
    "holding_series": 0,
    "invalid_holding_series": 0
  },
  "gaps": [
    "periods_per_year not submitted — annualized volatility, annualized return and annualized Sharpe/Sortino are gaps",
    "risk_free_per_period not submitted — Sharpe, Sortino, downside deviation and alpha are gaps",
    "var_confidence not submitted — historical VaR and CVaR are gaps",
    "benchmark_returns does not align with returns (1 valid of 1 submitted vs 2 periods) — benchmark metrics are gaps",
    "holdings: 1 entries without a numeric weight excluded"
  ],
  "risk_metrics": {
    "periods": 2,
    "mean_return_per_period": "0.015000",
    "total_return": "0.030200",
    "best_period_return": "0.020000",
    "worst_period_return": "0.010000",
    "positive_period_fraction": "1.000000",
    "volatility_per_period": "0.007071",
    "annualized_volatility": null,
    "annualized_return": null,
    "downside_deviation_per_period": null,
    "sharpe_per_period": null,
    "sharpe_annualized": null,
    "sortino_per_period": null,
    "sortino_annualized": null,
    "max_drawdown": "0.000000",
    "max_drawdown_peak_period": -1,
    "max_drawdown_trough_period": -1,
    "current_drawdown": "0.000000",
    "longest_underwater_periods": 0,
    "var_confidence": null,
    "historical_var": null,
    "historical_cvar": null
  },
  "benchmark": {
    "aligned": false,
    "periods": 1,
    "mean_return_per_period": null,
    "volatility_per_period": null,
    "total_return": null,
    "beta": null,
    "correlation": null,
    "tracking_error_per_period": null,
    "alpha_per_period": null
  },
  "concentration": null,
  "carry": null,
  "factor_decomposition": null,
  "holding_correlations": null,
  "stress_tests": [],
  "decision_journal": null,
  "disclaimer": "Educational analytics only — not financial advice. The tool calculates; the user decides.",
  "summary": "Risk analytics over 2 periods: total return 0.030200, volatility per period 0.007071, max drawdown 0.000000; 5 gaps.",
  "stamp": "PORTFOLIO RISK ANALYTICS REPORT\nportfolio: Violated Portfolio\nSTATUS: partial\nRisk analytics over 2 periods: total return 0.030200, volatility per period 0.007071, max drawdown 0.000000; 5 gaps.\nEducational analytics only — not financial advice. The tool calculates; the user decides."
}
```

### 3. Malformed — `malformed` (recorded HTTP 422)

Input:

```json
{
  "portfolio": 12345,
  "returns": "not_a_list",
  "holdings": "should_be_a_list"
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "portfolio",
  "detail": "portfolio must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Yes — integrators, developers, ops |
| Regulators view | N/A — Not compliance-facing: it is a computed analytics report with a non-advisory disclaimer, not a compliance or audit verdict, and SERVICE.md makes no compliance claim. SERVICE.md does record the named doubt 'Product-internal and regulated borderline' — the report is descriptive analytics only and produces no compliance evidence. |
| Checks named count vs recorded count | N/A — recorded responses carry no `checks` array (0 checks recorded); computed outputs are enumerated in the Reference instead |
| Verdict vocabulary complete | Yes — 3 values listed (complete, partial, insufficient_evidence), plus layer statuses |
| Input reference typed | Yes — 21 fields, each with its type from SERVICE.md (20 table rows; one row lists two fields, documented separately) |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/portfolio-risk-analytics-report/evidence.json` after writing |
| Output format | CommonMark markdown |

