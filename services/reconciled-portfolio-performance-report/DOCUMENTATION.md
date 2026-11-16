# Reconciled portfolio performance report — full documentation

**Reconciled portfolio performance report** · slug `reconciled-portfolio-performance-report` · deliverable type: REPORT · atom version 0.1.0 · status: **live — release candidate (one-week RC soak to 2026-11-22)**

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (worked example 1 below reproduces its request and response verbatim).

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the full flow is in the how-to below). Every call sends the key as `Authorization: Bearer <key>`.

**Step 2 — build the manifest.** The caller assembles one JSON manifest naming the subject in `portfolio` (`"Test Portfolio"`) and declaring the evidence the atom checks, group by group (the input reference below lists every field and its type). In the recorded run, every checked field is supplied.

**Step 3 — call the REST endpoint.** `POST https://atoms.pipavia.com/v1/reconciled-portfolio-performance-report` with the manifest as the body and the `Authorization` header set.

**Step 4 — read the result.** The recorded response came back HTTP 200 with status `complete`. Its summary: "Reconciled performance over 2 periods: time-weighted return 0.210000, money-weighted return per period 0.100000, final value 1210.000000; 0 gaps." Read the computed sections, the counts, and the gaps/missing-evidence detail (empty here) — that is the deliverable.

**Step 5 — trust but verify.** The same manifest submitted twice returned byte-identical REST responses, and the MCP face returned a structurally identical result — both properties are recorded in the evidence (`determinism_byte_identical`, `parity_structured_equal`). Same input in, same deliverable out.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "reconciled-portfolio-performance-report"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. `POST https://atoms.pipavia.com/v1/reconciled-portfolio-performance-report` — body = the manifest object; same `Authorization` header. HTTP 200 returns the deliverable as JSON.

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/reconciled-portfolio-performance-report`
- Tool name: `reconciled_portfolio_performance_report` — `tools/call` arguments = the manifest object (the same object you would POST to REST).
- Send the same `Authorization: Bearer <key>` header. The MCP result's structured content is the same deliverable the REST face returns (parity is recorded in the evidence).

### Read a failing verdict and fix the manifest

The recorded violations run (worked example 2) returned status `partial`. Read it in this order:

1. **`gaps`** — the ordered list naming every gap. In the recorded run: the `external_flows` series did not align with `period_end_values`, so time-weighted and money-weighted returns are gaps (null), and declared returns could not be reconciled. Fix = align the series period-for-period; never expect the atom to default a missing flow to zero — it will not.
2. **`reconciliation`** — a discrepancy is a finding, not a gap. In the recorded run the holdings leg reports a holdings total of `0.000000` (the manifest declared an empty holdings list, which reconciles to 0) against a final declared value of `1210.000000` — a difference of `-1210.000000`. That is the report doing its job: fix the *source data* (declare the holdings, or correct the final value), not the report.
3. **`counts`** — invalid entries are counted and excluded (`invalid_value_entries`, `invalid_holdings`, `invalid_transactions`); a rising count points at malformed entries in the manifest.

### Handle a 422 invalid_input

A type-violating manifest is rejected before any verdict is computed. The recorded malformed run (worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "portfolio",
  "detail": "portfolio must be a string"
}
```

Read `field` for the offending field and `detail` for the expected shape — here, `portfolio`: "portfolio must be a string". Fix the type at that field (per the input reference below) and resubmit. A 422 is never a verdict and is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/reconciled-portfolio-performance-report` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/reconciled-portfolio-performance-report` — tool name `reconciled_portfolio_performance_report`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Support: info@pipavia.com

### Input reference

Every field, grouped as SERVICE.md groups them, with its type. Types are as stated in SERVICE.md.

**Group: manifest**

| Field | Type | Notes |
|---|---|---|
| `portfolio` | string | carried into the output, not itself analysed |
| `beginning_value` | number | portfolio value at the start of the first period — required |
| `period_end_values` | list of numbers | declared portfolio value at the end of each period, in period order — at least 2 valid entries required; non-numeric entries are counted in `counts.invalid_value_entries` and excluded |
| `external_flows` | list of numbers | aligned period-for-period with `period_end_values`; each entry is the net external cash flow at the BEGINNING of its period — contributions positive, withdrawals negative. Absent or misaligned = period returns are gaps, never defaulted to zero |
| `benchmark_name` | string | the benchmark chosen in advance, carried into the benchmark section |
| `benchmark_returns` | list of numbers | benchmark periodic returns, aligned period-for-period with `period_end_values` |
| `declared_returns` | list of numbers | the caller's own declared period returns, aligned period-for-period — reconciled against the computed period returns |
| `holdings` | list of entries | below — the declared positions ledger |

**Group: entry**

| Field | Type | Notes |
|---|---|---|
| `holdings[].id` | string | carried into the holding rows |
| `holdings[].quantity` | numbers | holding value = quantity × price — an entry without both numeric is counted in `counts.invalid_holdings` and excluded |
| `holdings[].price` | numbers | holding value = quantity × price — an entry without both numeric is counted in `counts.invalid_holdings` and excluded |
| `transactions` | list of entries | below — the ledger's external-flow record |
| `transactions[].kind` | `"contribution"` or `"withdrawal"` | anything else is counted in `counts.invalid_transactions` and excluded |
| `transactions[].amount` | number ≥ 0 | the magnitude of that contribution or withdrawal |

### Computed outputs and operations (no checks array)

This atom's responses carry **no `checks` array** — it is a computed atom, and its deliverable is the computed report below, not a check battery. The operations it performs, from SERVICE.md, each visible in the recorded responses:

1. Period returns — flow-adjusted per period, r_i = V_i ÷ (V_{i−1} + F_i) − 1.
2. Time-weighted return — chain product of (1 + r_i) − 1, independent of cash-flow timing.
3. Money-weighted return (IRR) per period — the rate solving B(1+r)^n + Σ F_i (1+r)^(n−i) = final value, by a fixed bracket search (lower −0.999999; upper 1, 3, 7, … doubling-plus-one up to 1048575) then exactly 200 bisection iterations; a labeled gap when no sign-changing bracket exists in that range.
4. Mean period return, and the TWR − IRR difference as its own figure.
5. Value change, net external flows, and total gain after flows (final − beginning − net flows).
6. Reconciliation leg 1 — flows vs ledger: declared net external flows minus ledger net (contributions − withdrawals from `transactions`).
7. Reconciliation leg 2 — holdings vs declared value: holdings ledger total (Σ quantity × price) minus the final declared period-end value, and that difference as a fraction of the final value. A declared empty holdings list reconciles to 0 — a discrepancy is a finding, not a gap.
8. Reconciliation leg 3 — declared vs computed returns: per-period differences, the largest absolute difference, and the count of periods differing at the report's six-decimal precision.
9. Benchmark comparison (aligned series only) — benchmark total return (chain product), benchmark mean period return, excess total return (portfolio TWR − benchmark total), and the count of periods the portfolio return exceeded the benchmark's.
10. Holdings ledger — per-holding value (quantity × price) and share of the holdings total, the holdings total, and the largest holding.

### Output format

A successful call returns one JSON object. The recorded full-pass response carries these top-level keys, in order: `service`, `atom_version`, `portfolio`, `status`, `layers`, `counts`, `gaps`, `performance`, `benchmark`, `reconciliation`, `holdings`, `disclaimer`, `summary`, `stamp`. It always includes `service` and `atom_version`, the subject echo where the manifest names one, the verdict/status, a human-readable `summary`, and a text `stamp` restating the result.

Every computed floating quantity is rendered as a string with exactly six decimal places, rounded half away from zero on the binary double (zero renders `0.000000`, never `-0.000000`); counts and period indices stay integers; declared quantities echoed into the report use the same rule. The response carries `layers`, `counts`, the ordered `gaps` list, the `performance` / `benchmark` / `reconciliation` / `holdings` sections (null when their inputs are absent), the `disclaimer`, a `summary` and a text `stamp`.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `complete` | A numeric beginning value, a values series with at least 2 valid observations, flows aligned, and no gaps of any kind. A nonzero reconciliation discrepancy does **not** block `complete` — a discrepancy is a finding, not a gap, and is printed in the report. |
| `partial` | Performance was computed, but some figure or section is a labeled gap (missing flows, misaligned series, invalid entries, or an unbracketed money-weighted return). Every gap is named in the ordered `gaps` list; gapped figures are null, never filled in. |
| `insufficient_evidence` | No numeric beginning value, or fewer than 2 valid numeric period-end values — reconciled performance cannot be computed. |
| `layers.<name> = present / absent` | Each of values, performance, reconciliation, benchmark, holdings is reported `present` or `absent`; missing layers are gaps, not guesses. |

### Errors

Only the shapes evidenced in the gateway code and the recorded battery are documented here:

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | Missing, malformed, unknown or revoked key (REST face shape, from the gateway call path). |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the <namespace> scope; issue it for this atom first"}` | The key is valid but was never issued for this atom — issue it for `reconciled-portfolio-performance-report` and retry. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "portfolio", "detail": "portfolio must be a string"}` (recorded verbatim in worked example 3) | The manifest violates a field type; `field` and `detail` name the problem. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for reconciled-portfolio-performance-report exceeded"}` (a per-day variant names the 10000/day limit) | Rate limit exceeded; the call is not metered. |

### Rate limits and pricing status

- Rate limits (contract.yaml, SPEC default): **60 calls/minute and 10000 calls/day per key** for this atom.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is null and `rate_status` is pending — **Free during trial — rate pending.** Prices are set only from measured production cost per unit, per the billing protocol in the contract.

## Explanation

This atom sells a report, never the underlying knowledge: given a portfolio performance manifest — beginning value, period-end values, external flows, an optional benchmark, declared returns, holdings and transactions — it computes reconciled performance (time-weighted and money-weighted returns, stated separately and never mixed), runs a three-leg reconciliation against the declared data, and compares against the benchmark. The buyer context (SERVICE.md, first hypothesis, not yet market-tested): teams and agents working in Money & markets who need this report on demand. House self-use: **Investment ledger review and attribution**.

**How the verdict is decided.** This is a computed atom: it carries no checks array. It computes deterministically over the submitted declarations only — nothing is defaulted, fetched or interpolated. Period returns are flow-adjusted: r_i = V_i ÷ (V_{i−1} + F_i) − 1, with F_i the flow at the beginning of period i; a period whose base (previous value plus its flow) is not positive has no defined return and the whole return path becomes a labeled gap (adjusted and unadjusted periods are never mixed). Status follows evidence completeness: `insufficient_evidence` when the minimum inputs are absent, `partial` when performance computes but any figure is a labeled gap, `complete` when there are no gaps. Crucially, a reconciliation discrepancy is a *finding*, not a gap: a declared empty holdings list reconciles to a holdings total of 0, so against a nonzero final declared value the holdings-vs-declared-value leg reports that full difference as a discrepancy — the report can still stand on its other legs with the discrepancy printed, exactly as recorded in the violations example below.

**What it does NOT do.**

- Not computed — XIRR: the skill names it but states no date or day-count convention; this core computes the periodic IRR on the submitted period grid instead.
- Not computed — attribution decomposition (allocation vs selection vs timing vs costs vs currency): the skill asks for a written judgment paragraph and supplies no formula.
- Not computed — tax lots / adjusted cost base: no jurisdictional computation is stated by the skill.
- Not computed — benchmark fees/taxes adjustment: no materiality rule or tax model is stated.
- No recommendation, and nothing labeled optimal or recommended, is ever produced. The non-advisory disclaimer is carried on every output: educational reporting only — the tool calculates; the user decides.
- Privacy: the manifest carries no account numbers or identifiers — aggregate figures only.

## Role views

### For integrators (Users)

One manifest in, one deliverable out, over REST or MCP with the same key. Start with the tutorial, keep the input reference beside your manifest builder, and treat the response's verdict/status, summary and per-item detail as the product. Rate: free during trial — rate pending; limits 60/min, 10000/day per key. Support: info@pipavia.com.

### For developers

Manifest authoring: field names, groupings and types are exactly as in the input reference — a type violation is a 422 before any computation, and an absent field is a deliberate signal (missing evidence), not a default. Determinism: the core is deterministic — the recorded battery proves byte-identical repeat REST responses and REST/MCP structured parity for this atom, so golden-file testing against the worked examples below is sound. Implementation: `services/reconciled-portfolio-performance-report/src/reconciled_portfolio_performance_report.py` (Python 3, stdlib only; `evaluate(manifest)`), tests: `services/reconciled-portfolio-performance-report/tests/test_reconciled_portfolio_performance_report.py` (23 tests, per contract.yaml). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract R1 rule).

### For ops

Endpoints: REST `POST /v1/reconciled-portfolio-performance-report` and MCP `POST /mcp/reconciled-portfolio-performance-report` (tool `reconciled_portfolio_performance_report`) on https://atoms.pipavia.com. Key scope: per user, per atom — a key never verifies for another atom; 403 means the scope was never issued. Rate limits: 60/min, 10000/day per key (429, not metered). Error monitoring: watch the 401 (unauthorized) / 403 (scope_required) / 422 (invalid_input, with field+detail) / 429 (rate_limit) shapes in the errors table. Status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

### For regulators

Included because this atom is compliance-facing: finance domain — the report is portfolio-performance reporting evidence. What it gives a reviewer: the full computed report with its methods labeled (time-weighted vs money-weighted, never mixed), the three reconciliation legs with discrepancies printed as findings, the ordered gaps list naming everything that could not be computed, and the non-advisory disclaimer carried on every output. What it does not give: advice, a recommendation, XIRR, attribution decomposition, or tax-lot computation (named exclusions above). Inputs are aggregate figures only — the manifest carries no account numbers or identifiers.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:56:28.690961+00:00 against gateway v1.1.0, external verification lane, source `verification/work/reconciled-portfolio-performance-report/evidence.json`. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — verified mechanically against the evidence after writing).

### Example 1 — full-pass (recorded HTTP 200)

Recorded case note: All inputs valid, aligned, and sufficient for complete status. computed_spot_checks: period_returns=[0.100000, 0.100000], TWR=0.210000, holdings_total=1210.000000

Input:

```json
{
  "portfolio": "Test Portfolio",
  "beginning_value": 1000.0,
  "period_end_values": [
    1100.0,
    1210.0
  ],
  "external_flows": [
    0.0,
    0.0
  ],
  "benchmark_name": "S&P500",
  "benchmark_returns": [
    0.05,
    0.05
  ],
  "declared_returns": [
    0.1,
    0.1
  ],
  "holdings": [
    {
      "id": "A",
      "quantity": 10,
      "price": 121.0
    }
  ],
  "transactions": [
    {
      "kind": "contribution",
      "amount": 0.0
    }
  ]
}
```

Response (REST):

```json
{
  "service": "reconciled-portfolio-performance-report",
  "atom_version": "0.1.0",
  "portfolio": "Test Portfolio",
  "status": "complete",
  "layers": {
    "values": "present",
    "performance": "present",
    "reconciliation": "present",
    "benchmark": "present",
    "holdings": "present"
  },
  "counts": {
    "periods": 2,
    "invalid_value_entries": 0,
    "invalid_flow_entries": 0,
    "holdings": 1,
    "invalid_holdings": 0,
    "transactions": 1,
    "invalid_transactions": 0
  },
  "gaps": [],
  "performance": {
    "periods": 2,
    "beginning_value": "1000.000000",
    "final_value": "1210.000000",
    "value_change": "210.000000",
    "net_external_flows": "0.000000",
    "total_gain_after_flows": "210.000000",
    "period_returns": [
      "0.100000",
      "0.100000"
    ],
    "time_weighted_return": "0.210000",
    "money_weighted_return_per_period": "0.100000",
    "mean_period_return": "0.100000",
    "twr_irr_difference": "0.110000",
    "methods": [
      "time_weighted_return",
      "money_weighted_return_per_period"
    ]
  },
  "benchmark": {
    "name": "S&P500",
    "aligned": true,
    "periods": 2,
    "total_return": "0.102500",
    "mean_return_per_period": "0.050000",
    "excess_total_return": "0.107500",
    "periods_portfolio_ahead": 2
  },
  "reconciliation": {
    "flows_vs_ledger": {
      "declared_net_external_flows": "0.000000",
      "ledger_contributions": "0.000000",
      "ledger_withdrawals": "0.000000",
      "ledger_net_external_flows": "0.000000",
      "difference": "0.000000"
    },
    "holdings_vs_declared_value": {
      "holdings_total_value": "1210.000000",
      "final_declared_value": "1210.000000",
      "difference": "0.000000",
      "difference_fraction_of_final": "0.000000"
    },
    "declared_vs_computed_returns": {
      "aligned": true,
      "compared_periods": 2,
      "differences": [
        "0.000000",
        "0.000000"
      ],
      "max_abs_difference": "0.000000",
      "mismatched_periods": 0
    }
  },
  "holdings": {
    "holdings_count": 1,
    "total_value": "1210.000000",
    "rows": [
      {
        "id": "A",
        "quantity": "10.000000",
        "price": "121.000000",
        "value": "1210.000000",
        "share_of_holdings": "1.000000"
      }
    ],
    "largest_holding_id": "A",
    "largest_holding_share": "1.000000"
  },
  "disclaimer": "Educational reporting only — not financial advice. The tool calculates; the user decides.",
  "summary": "Reconciled performance over 2 periods: time-weighted return 0.210000, money-weighted return per period 0.100000, final value 1210.000000; 0 gaps.",
  "stamp": "RECONCILED PORTFOLIO PERFORMANCE REPORT\nportfolio: Test Portfolio\nSTATUS: complete\nReconciled performance over 2 periods: time-weighted return 0.210000, money-weighted return per period 0.100000, final value 1210.000000; 0 gaps.\nEducational reporting only — not financial advice. The tool calculates; the user decides."
}
```

### Example 2 — violations (recorded HTTP 200)

Recorded case note: Flows are misaligned (length 1 vs 2) and holdings are empty vs final value, resulting in partial status.

Input:

```json
{
  "portfolio": "Violated Portfolio",
  "beginning_value": 1000.0,
  "period_end_values": [
    1100.0,
    1210.0
  ],
  "external_flows": [
    0.0
  ],
  "benchmark_name": "None",
  "benchmark_returns": [
    0.0,
    0.0
  ],
  "declared_returns": [
    0.0,
    0.0
  ],
  "holdings": [],
  "transactions": []
}
```

Response (REST):

```json
{
  "service": "reconciled-portfolio-performance-report",
  "atom_version": "0.1.0",
  "portfolio": "Violated Portfolio",
  "status": "partial",
  "layers": {
    "values": "present",
    "performance": "present",
    "reconciliation": "present",
    "benchmark": "present",
    "holdings": "present"
  },
  "counts": {
    "periods": 2,
    "invalid_value_entries": 0,
    "invalid_flow_entries": 0,
    "holdings": 0,
    "invalid_holdings": 0,
    "transactions": 0,
    "invalid_transactions": 0
  },
  "gaps": [
    "external_flows does not align with period_end_values (1 valid of 1 submitted vs 2 periods) — time-weighted and money-weighted returns are gaps",
    "declared_returns cannot be reconciled — computed period returns are gaps"
  ],
  "performance": {
    "periods": 2,
    "beginning_value": "1000.000000",
    "final_value": "1210.000000",
    "value_change": "210.000000",
    "net_external_flows": null,
    "total_gain_after_flows": null,
    "period_returns": null,
    "time_weighted_return": null,
    "money_weighted_return_per_period": null,
    "mean_period_return": null,
    "twr_irr_difference": null,
    "methods": [
      "time_weighted_return",
      "money_weighted_return_per_period"
    ]
  },
  "benchmark": {
    "name": "None",
    "aligned": true,
    "periods": 2,
    "total_return": "0.000000",
    "mean_return_per_period": "0.000000",
    "excess_total_return": null,
    "periods_portfolio_ahead": null
  },
  "reconciliation": {
    "flows_vs_ledger": {
      "declared_net_external_flows": null,
      "ledger_contributions": "0.000000",
      "ledger_withdrawals": "0.000000",
      "ledger_net_external_flows": "0.000000",
      "difference": null
    },
    "holdings_vs_declared_value": {
      "holdings_total_value": "0.000000",
      "final_declared_value": "1210.000000",
      "difference": "-1210.000000",
      "difference_fraction_of_final": "-1.000000"
    },
    "declared_vs_computed_returns": {
      "aligned": false,
      "compared_periods": 0,
      "differences": null,
      "max_abs_difference": null,
      "mismatched_periods": null
    }
  },
  "holdings": {
    "holdings_count": 0,
    "total_value": "0.000000",
    "rows": [],
    "largest_holding_id": null,
    "largest_holding_share": null
  },
  "disclaimer": "Educational reporting only — not financial advice. The tool calculates; the user decides.",
  "summary": "Performance over 2 periods: beginning value 1000.000000, final value 1210.000000; time-weighted and money-weighted returns are gaps; 2 gaps.",
  "stamp": "RECONCILED PORTFOLIO PERFORMANCE REPORT\nportfolio: Violated Portfolio\nSTATUS: partial\nPerformance over 2 periods: beginning value 1000.000000, final value 1210.000000; time-weighted and money-weighted returns are gaps; 2 gaps.\nEducational reporting only — not financial advice. The tool calculates; the user decides."
}
```

### Example 3 — malformed (recorded HTTP 422)

Recorded case note: Type violations: portfolio must be string, beginning_value must be number, period_end_values must be list.

Input:

```json
{
  "portfolio": 12345,
  "beginning_value": "one thousand",
  "period_end_values": "not a list"
}
```

Response (REST):

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
| Diátaxis quadrants present | Y — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Integrators Y · Developers Y · Ops Y · Regulators Y (finance domain — the report is portfolio-performance reporting evidence (reconciled TWR/IRR, benchmark comparison, discrepancy findings); it is reporting, not advice, and the disclaimer is carried on every output.) |
| Checks named count vs recorded count | N/A — computed atom: the recorded responses carry no checks array; computed outputs/operations enumerated instead (see Reference) |
| Verdict vocabulary complete | Y — 3 verdict values plus section/per-item statuses documented |
| Input reference typed | Y — 14 field rows, each with a type (SERVICE.md field table + recorded input schema) |
| Worked examples verbatim-verified | Y — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/reconciled-portfolio-performance-report/evidence.json` |

