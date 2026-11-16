# Strategy backtest validation — full documentation

**Strategy backtest validation** · slug `strategy-backtest-validation` · deliverable type: VALIDATION · atom version 0.1.0 · status: **live — release candidate (one-week RC soak to 2026-11-22)**

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (worked example 1 below reproduces its request and response verbatim).

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the full flow is in the how-to below). Every call sends the key as `Authorization: Bearer <key>`.

**Step 2 — build the manifest.** The caller assembles one JSON manifest naming the subject in `strategy` (`"Alpha-Trend-01"`) and declaring the evidence the atom checks, group by group (the input reference below lists every field and its type). In the recorded run, every checked field is supplied.

**Step 3 — call the REST endpoint.** `POST https://atoms.pipavia.com/v1/strategy-backtest-validation` with the manifest as the body and the `Authorization` header set.

**Step 4 — read the verdict.** The recorded response came back HTTP 200 with verdict `VALIDATED`. Its summary: "36 pass, 0 fail, 0 missing of 36 checks across six sections." Every section reports `pass` (harness_standards, protocol_and_reporting, costs_and_frictions, overfit_and_fragility, paper_gate, live_monitoring_and_house_gates) and every check in the `checks` array reports `pass` — that array, with its per-check evidence strings, is the deliverable's reasoning, not decoration.

**Step 5 — trust but verify.** The same manifest submitted twice returned byte-identical REST responses, and the MCP face returned a structurally identical result — both properties are recorded in the evidence (`determinism_byte_identical`, `parity_structured_equal`). Same input in, same deliverable out.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "strategy-backtest-validation"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. `POST https://atoms.pipavia.com/v1/strategy-backtest-validation` — body = the manifest object; same `Authorization` header. HTTP 200 returns the deliverable as JSON.

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/strategy-backtest-validation`
- Tool name: `strategy_backtest_validation` — `tools/call` arguments = the manifest object (the same object you would POST to REST).
- Send the same `Authorization: Bearer <key>` header. The MCP result's structured content is the same deliverable the REST face returns (parity is recorded in the evidence).

### Read a failing verdict and fix the manifest

The recorded violations run (worked example 2) returned HTTP 200 with verdict `NOT_VALIDATED`: "30 pass, 5 fail, 1 missing of 36 checks across six sections." Read a failing response in this order:

1. **`verdict` + `summary`** — the counts tell you how many checks fail vs are missing. Fail and missing are different problems: a fail means your manifest *declares evidence against you*; missing means you *did not declare the evidence at all*.
2. **`checks` with `status: "fail"`** — in the recorded run:
   - `no_look_ahead` (section `harness_standards`) — evidence: "harness standards: no look-ahead — signals use only what was known then"
   - `no_skipped_costs` (section `costs_and_frictions`) — evidence: "skill red line: no skipped costs"
   - `no_curve_fit_parameters` (section `overfit_and_fragility`) — evidence: "skill red line: no curve-fit parameters"
   - `paper_gate_completed_or_waived` (section `paper_gate`) — evidence: "quality gate: paper gate completed (or consciously waived with written reason + approval)"
   - `no_backtest_alone_as_live_confirmation` (section `live_monitoring_and_house_gates`) — evidence: "skill red line: no "the backtest says so" as a substitute for live confirmation discipline"
   Fix = change the underlying practice or record so the declaration becomes true, then resubmit. Editing the manifest to claim what is not true defeats the deliverable — the atom checks declared evidence, and its value is that the declaration is yours.
3. **`checks` with `status: "missing"`** — 1 in the recorded run; supply the absent fields named by those checks and resubmit.

### Handle a 422 invalid_input

A type-violating manifest is rejected before any verdict is computed. The recorded malformed run (worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "harness",
  "detail": "harness must be an object"
}
```

Read `field` for the offending field and `detail` for the expected shape — here, `harness`: "harness must be an object". Fix the type at that field (per the input reference below) and resubmit. A 422 is never a verdict and is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/strategy-backtest-validation` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/strategy-backtest-validation` — tool name `strategy_backtest_validation`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Support: info@pipavia.com

### Input reference

Every field, grouped as SERVICE.md groups them, with its type. All fields are booleans unless a type is noted.

**Group: —**

| Field | Type | Notes |
|---|---|---|
| `strategy` | string | carried into the verdict output, not itself checked |

**Group: `harness_standards`**

| Field | Type | Notes |
|---|---|---|
| `harness.deterministic_runs` | see SERVICE.md note |  |
| `harness.data_snapshots_versioned` | see SERVICE.md note |  |
| `harness.point_in_time_universe` | see SERVICE.md note |  |
| `harness.look_ahead_used` | must be `false` to pass | must be `false` to pass |
| `harness.realistic_fills_modeled` | see SERVICE.md note |  |

**Group: `protocol_and_reporting`**

| Field | Type | Notes |
|---|---|---|
| `protocol.hypothesis_stated` | see SERVICE.md note |  |
| `protocol.in_sample_reported` | see SERVICE.md note |  |
| `protocol.out_of_sample_reported` | see SERVICE.md note |  |
| `protocol.holdout_untouched_until_end` | see SERVICE.md note |  |
| `protocol.walk_forward_reported` | see SERVICE.md note |  |
| `protocol.reported_side_by_side` | see SERVICE.md note |  |

**Group: `costs_and_frictions`**

| Field | Type | Notes |
|---|---|---|
| `costs.commissions_modeled` | see SERVICE.md note |  |
| `costs.spreads_modeled` | see SERVICE.md note |  |
| `costs.slippage_modeled` | see SERVICE.md note |  |
| `costs.borrow_modeled` | see SERVICE.md note |  |
| `costs.financing_modeled` | see SERVICE.md note |  |
| `costs.taxes_material` | gates the taxes check below |  |
| `costs.taxes_modeled` | required when taxes are declared material; otherwise the check passes as not applicable |  |
| `costs.costs_skipped` | must be `false` to pass — skill red line | must be `false` to pass — skill red line |

**Group: `overfit_and_fragility`**

| Field | Type | Notes |
|---|---|---|
| `overfit.parameter_sensitivity_shown` | see SERVICE.md note |  |
| `overfit.sensitivity_shows_smooth_plateau` | see SERVICE.md note |  |
| `overfit.parameter_count` | number | with the observation count below, the params-vs-data ratio is recomputed from the two declared counts |
| `overfit.observation_count` | number | must be non-zero for the ratio to be computable |
| `overfit.best_of_n_disclosed` | see SERVICE.md note |  |
| `overfit.curve_fit_parameters_used` | must be `false` to pass — skill red line | must be `false` to pass — skill red line |
| `fragility.single_name_dominance_checked` | see SERVICE.md note |  |
| `fragility.regime_dependence_checked` | see SERVICE.md note |  |
| `fragility.capacity_liquidity_checked` | see SERVICE.md note |  |

**Group: `paper_gate`**

| Field | Type | Notes |
|---|---|---|
| `paper.period_or_fill_count_defined` | see SERVICE.md note |  |
| `paper.completed` | with `paper.waived` below | at least one must be declared; the gate passes when either is `true` |
| `paper.waived` | gates the waiver and comparison checks below |  |
| `paper.waiver_written_reason` | required when the gate is waived; otherwise the check passes as not applicable |  |
| `paper.waiver_approval_recorded` | required when the gate is waived; otherwise the check passes as not applicable |  |
| `paper.live_vs_model_compared` | required unless the gate is waived, in which case the waiver discharges it |  |

**Group: `live_monitoring_and_house_gates`**

| Field | Type | Notes |
|---|---|---|
| `monitoring.divergence_tracked` | see SERVICE.md note |  |
| `monitoring.kill_criteria_defined_before_scaling` | see SERVICE.md note |  |
| `monitoring.kill_criteria_cover_all_three` | drawdown, divergence, invalidation |  |
| `house_gates.explicit_confirmation_for_live_trades` | see SERVICE.md note |  |
| `house_gates.max_planned_trade_usd` | number | gates the clear-yes check below |
| `house_gates.clear_yes_for_trades_over_500` | required when the maximum planned trade is over $500; at or under $500 the check passes as not applicable |  |
| `house_gates.backtest_used_as_sole_live_confirmation` | must be `false` to pass — skill red line | must be `false` to pass — skill red line |

### Checks

Every check the atom runs — 36 in total, exactly as named in the recorded full-pass response, grouped by section. For each check: what it requires to pass (the recorded evidence text states the requirement), and the status semantics that follow the table.

**Section: `harness_standards`**

| Check | Requires to pass | Notes |
|---|---|---|
| `deterministic_runs` | harness standards: deterministic runs |  |
| `data_snapshots_versioned` | harness standards: versioned data snapshots |  |
| `point_in_time_universe_correct` | harness standards: correct point-in-time universes |  |
| `no_look_ahead` | harness standards: no look-ahead — signals use only what was known then |  |
| `realistic_fills_modeled` | harness standards: realistic fills (next-open or worse for illiquid names) |  |
**Section: `protocol_and_reporting`**

| Check | Requires to pass | Notes |
|---|---|---|
| `hypothesis_stated_before_testing` | protocol: hypothesis stated before in-sample development |  |
| `in_sample_results_reported` | protocol: in-sample development results reported |  |
| `out_of_sample_holdout_reported` | protocol: out-of-sample holdout results reported |  |
| `holdout_untouched_until_end` | protocol: the out-of-sample holdout was untouched until the end |  |
| `walk_forward_results_reported` | protocol: walk-forward window results reported |  |
| `all_three_reported_side_by_side` | quality gate: OOS + walk-forward results reported with in-sample, side by side — all three, not just the shiny one |  |
**Section: `costs_and_frictions`**

| Check | Requires to pass | Notes |
|---|---|---|
| `commissions_modeled` | costs & frictions: commissions modeled from day one, not as an afterthought |  |
| `spreads_modeled` | costs & frictions: spreads modeled |  |
| `slippage_modeled` | costs & frictions: slippage modeled |  |
| `borrow_modeled` | costs & frictions: borrow modeled |  |
| `financing_modeled` | costs & frictions: financing modeled |  |
| `taxes_modeled_when_material` | costs & frictions: taxes modeled where material | Conditional: required only when `costs.taxes_material` is true; otherwise it passes as not applicable. |
| `no_skipped_costs` | skill red line: no skipped costs |  |
**Section: `overfit_and_fragility`**

| Check | Requires to pass | Notes |
|---|---|---|
| `parameter_sensitivity_shown` | overfit detection: parameter sensitivity shown |  |
| `sensitivity_shows_smooth_plateau_not_sharp_peak` | overfit detection: sensitivity shows smooth plateaus, not sharp peaks — if it only works at exactly 14/3/7, it doesn't work |  |
| `params_vs_data_ratio_computable` | overfit detection: params-vs-data ratio recomputed from the declared parameter and observation counts (reported, with no acceptance bar — the skill states none) | Computed: the ratio is recomputed from `overfit.parameter_count` and `overfit.observation_count`; missing when a count is absent or the observation count is zero. The ratio is reported with no acceptance bar. |
| `best_of_n_trials_disclosed` | overfit detection: "best of N" awareness — the number of trials the reported result was selected from is disclosed |  |
| `no_curve_fit_parameters` | skill red line: no curve-fit parameters |  |
| `single_name_dominance_checked` | fragility checks: single-name dominance checked |  |
| `regime_dependence_checked` | fragility checks: regime dependence checked (works only in bull markets?) |  |
| `capacity_liquidity_checked` | fragility checks: capacity/liquidity checked (can the size actually trade?) |  |
**Section: `paper_gate`**

| Check | Requires to pass | Notes |
|---|---|---|
| `paper_period_or_fill_count_defined` | paper gate: paper-trade (or tiny size with explicit sign-off) for a defined period/fill count |  |
| `paper_gate_completed_or_waived` | quality gate: paper gate completed (or consciously waived with written reason + approval) | Computed/conditional: passes when the gate is declared completed, or waived with the waiver evidence; the waiver also discharges the live-vs-model comparison check. |
| `waiver_reason_and_approval_documented` | paper gate not waived — no waiver reason or approval is required | Conditional: required only when the paper gate is waived; when the gate is not waived it passes as not applicable (recorded evidence: "paper gate not waived — no waiver reason or approval is required"). |
| `live_vs_model_behavior_compared` | paper gate: compare live vs model behavior (slippage, signal timing) before scaling |  |
**Section: `live_monitoring_and_house_gates`**

| Check | Requires to pass | Notes |
|---|---|---|
| `live_vs_backtest_divergence_tracked` | live monitoring: live-vs-backtest divergence tracked |  |
| `kill_criteria_defined_before_scaling` | quality gate: kill criteria defined before scaling |  |
| `kill_criteria_cover_drawdown_divergence_invalidation` | live monitoring: kill criteria cover drawdown, divergence and invalidation, defined in advance |  |
| `explicit_confirmation_for_live_trades` | house gate: no live trade without explicit confirmation |  |
| `trades_over_500_have_clear_yes` | house gate: >$500 trades need a clear yes | Conditional: binds only when the declared maximum planned trade is over $500; at or under $500 it passes as not applicable. |
| `no_backtest_alone_as_live_confirmation` | skill red line: no "the backtest says so" as a substitute for live confirmation discipline |  |

**Per-check status semantics:** `pass` — the requirement is met on the declared evidence (a conditional check whose gate does not bind also reports `pass`, with its evidence text saying why it does not bind, e.g. "no conveyor drives declared"); `fail` — the field is present but false/invalid, a red line is crossed, or a computed comparison fails; `missing` — the field (or a value a computed check needs) is absent. There is no separate not-applicable status value in the recorded responses: not-applicable is expressed as `pass` with explanatory evidence.

### Output format

A successful call returns one JSON object. The recorded full-pass response carries these top-level keys, in order: `service`, `atom_version`, `strategy`, `verdict`, `sections`, `checks`, `results_sets_reported`, `params_to_data_ratio`, `paper_gate_status`, `over_500_trade_declared`, `summary`, `stamp`. It always includes `service` and `atom_version`, the subject echo where the manifest names one, the verdict/status, a human-readable `summary`, and a text `stamp` restating the result.

The response also carries `results_sets_reported`, `params_to_data_ratio` (string, exactly four decimal places by the fixed round-half-up rule; null when not computable), `paper_gate_status`, `over_500_trade_declared`, a `summary` and a text `stamp`.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `VALIDATED` | All 36 checks pass — the declared validation evidence is complete and consistent. This is validation of declared evidence, not a recommendation to trade the strategy. |
| `NOT_VALIDATED` | At least one check fails — a declared boolean is false, a red line is crossed, or a conditional/computed check fails (e.g. taxes declared material but not modeled, paper gate neither completed nor properly waived, a planned trade over $500 without the clear-yes evidence). |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but evidence is missing (absent fields, or the params-vs-data ratio not computable because a count is absent). |
| `paper_gate_status = completed / waived / not_completed / null` | Derived from the declared paper-gate fields; null when it cannot be derived. |
| `results_sets_reported = 0–3` | How many of the in-sample / out-of-sample / walk-forward result sets are declared reported. |
| `over_500_trade_declared = true / false / null` | Whether the declared maximum planned trade is over $500 (null when no numeric maximum is declared). |
| section status `pass` | Every check in the section passes (including not-applicable passes). |
| section status `fail` | At least one check in the section fails. |
| section status `insufficient_evidence` | No check in the section fails, but at least one is missing. |
| check status `pass` / `fail` / `missing` | See the status semantics under Checks. |

### Errors

Only the shapes evidenced in the gateway code and the recorded battery are documented here:

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | Missing, malformed, unknown or revoked key (REST face shape, from the gateway call path). |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the <namespace> scope; issue it for this atom first"}` | The key is valid but was never issued for this atom — issue it for `strategy-backtest-validation` and retry. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "harness", "detail": "harness must be an object"}` (recorded verbatim in worked example 3) | The manifest violates a field type; `field` and `detail` name the problem. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for strategy-backtest-validation exceeded"}` (a per-day variant names the 10000/day limit) | Rate limit exceeded; the call is not metered. |

### Rate limits and pricing status

- Rate limits (contract.yaml, SPEC default): **60 calls/minute and 10000 calls/day per key** for this atom.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is null and `rate_status` is pending — **Free during trial — rate pending.** Prices are set only from measured production cost per unit, per the billing protocol in the contract.

## Explanation

This atom sells its deliverable — a bounded validation artifact — never the underlying knowledge itself. teams and agents working in Money & markets who need this validation on demand and would rather buy it per use than build or staff the capability themselves. House self-use: **Sail strategy validation gates**.

**How the verdict is decided.** Deterministic core (byte-identical repeats and REST/MCP parity recorded). This atom does not run a backtest: it validates the caller's declared evidence about one. Most checks read one declared boolean each. Four checks are computed or conditional, using only relationships the bound skill states: the params-vs-data ratio is recomputed from the declared parameter and observation counts (reported, never judged — the skill states no acceptance bar); taxes bind only where declared material; the paper gate passes on completion or on a conscious waiver carrying a written reason and an approval (and a waiver discharges the live-vs-model comparison); and a declared planned trade over $500 binds the clear-yes evidence — $500 is the skill's own house-gate threshold, the only numeric threshold in the atom. Absent = missing; present-but-false or a failed conditional = fail.

**What it does NOT do.**

- Declared evidence only: it does not run or re-run a backtest, inspect a harness, read market data, or verify that a declared result is true. A `VALIDATED` verdict holds *on the caller's declared evidence*, even if the underlying numbers are wrong.
- No acceptance bar on the params-vs-data ratio, out-of-sample performance, drawdown, or any other quantity — the ratio is reported, never judged.
- No judgment that a sensitivity plateau is genuinely smooth, that fills were genuinely realistic, or that a holdout was genuinely untouched — each is checked as declared evidence.
- No investment advice: a `VALIDATED` verdict is not a recommendation to trade the strategy.

## Role views

### For integrators (Users)

One manifest in, one deliverable out, over REST or MCP with the same key. Start with the tutorial, keep the input reference beside your manifest builder, and treat the response's verdict/status, summary and per-item detail as the product. Rate: free during trial — rate pending; limits 60/min, 10000/day per key. Support: info@pipavia.com.

### For developers

Manifest authoring: field names, groupings and types are exactly as in the input reference — a type violation is a 422 before any computation, and an absent field is a deliberate signal (missing evidence), not a default. Determinism: the core is deterministic — the recorded battery proves byte-identical repeat REST responses and REST/MCP structured parity for this atom, so golden-file testing against the worked examples below is sound. Implementation: `services/strategy-backtest-validation/src/strategy_backtest_validation.py` (Python 3, stdlib only; `evaluate(manifest)`), tests: `services/strategy-backtest-validation/tests/test_strategy_backtest_validation.py` (32 tests, per contract.yaml). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract R1 rule).

### For ops

Endpoints: REST `POST /v1/strategy-backtest-validation` and MCP `POST /mcp/strategy-backtest-validation` (tool `strategy_backtest_validation`) on https://atoms.pipavia.com. Key scope: per user, per atom — a key never verifies for another atom; 403 means the scope was never issued. Rate limits: 60/min, 10000/day per key (429, not metered). Error monitoring: watch the 401 (unauthorized) / 403 (scope_required) / 422 (invalid_input, with field+detail) / 429 (rate_limit) shapes in the errors table. Status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

### For regulators

Included because this atom is compliance-facing: its verdict is validation evidence over a trading strategy's backtest record. What it gives a reviewer: a deterministic verdict over the declared harness, protocol, cost, overfit, paper-gate and house-gate evidence, with the params-to-data ratio recomputed and reported (no invented acceptance bar) and every failing or missing check named. What it does not give: a run or re-run of the backtest, verification that declared results are true, investment advice, or a recommendation to trade.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:50:14.990445+00:00 against gateway v1.1.0, external verification lane, source `verification/work/strategy-backtest-validation/evidence.json`. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — verified mechanically against the evidence after writing).

### Example 1 — full-pass (recorded HTTP 200)

Recorded case note: All boolean constraints met including paper.live_vs_model_compared=true (required unless waived per SERVICE.md). Computed params_to_data_ratio = 0.0100 (10/1000). over_500_trade_declared = true. [Corrected: Gemini original omitted live_vs_model_compared — tester error.]

Input:

```json
{
  "strategy": "Alpha-Trend-01",
  "harness": {
    "deterministic_runs": true,
    "data_snapshots_versioned": true,
    "point_in_time_universe": true,
    "look_ahead_used": false,
    "realistic_fills_modeled": true
  },
  "protocol": {
    "hypothesis_stated": true,
    "in_sample_reported": true,
    "out_of_sample_reported": true,
    "holdout_untouched_until_end": true,
    "walk_forward_reported": true,
    "reported_side_by_side": true
  },
  "costs": {
    "commissions_modeled": true,
    "spreads_modeled": true,
    "slippage_modeled": true,
    "borrow_modeled": true,
    "financing_modeled": true,
    "taxes_material": true,
    "taxes_modeled": true,
    "costs_skipped": false
  },
  "overfit": {
    "parameter_sensitivity_shown": true,
    "sensitivity_shows_smooth_plateau": true,
    "parameter_count": 10,
    "observation_count": 1000,
    "best_of_n_disclosed": true,
    "curve_fit_parameters_used": false
  },
  "fragility": {
    "single_name_dominance_checked": true,
    "regime_dependence_checked": true,
    "capacity_liquidity_checked": true
  },
  "paper": {
    "period_or_fill_count_defined": true,
    "completed": true,
    "waived": false,
    "live_vs_model_compared": true
  },
  "monitoring": {
    "divergence_tracked": true,
    "kill_criteria_defined_before_scaling": true,
    "kill_criteria_cover_all_three": true
  },
  "house_gates": {
    "explicit_confirmation_for_live_trades": true,
    "max_planned_trade_usd": 600,
    "clear_yes_for_trades_over_500": true,
    "backtest_used_as_sole_live_confirmation": false
  }
}
```

Response (REST):

```json
{
  "service": "strategy-backtest-validation",
  "atom_version": "0.1.0",
  "strategy": "Alpha-Trend-01",
  "verdict": "VALIDATED",
  "sections": {
    "harness_standards": "pass",
    "protocol_and_reporting": "pass",
    "costs_and_frictions": "pass",
    "overfit_and_fragility": "pass",
    "paper_gate": "pass",
    "live_monitoring_and_house_gates": "pass"
  },
  "checks": [
    {
      "section": "harness_standards",
      "check": "deterministic_runs",
      "status": "pass",
      "evidence": "harness standards: deterministic runs"
    },
    {
      "section": "harness_standards",
      "check": "data_snapshots_versioned",
      "status": "pass",
      "evidence": "harness standards: versioned data snapshots"
    },
    {
      "section": "harness_standards",
      "check": "point_in_time_universe_correct",
      "status": "pass",
      "evidence": "harness standards: correct point-in-time universes"
    },
    {
      "section": "harness_standards",
      "check": "no_look_ahead",
      "status": "pass",
      "evidence": "harness standards: no look-ahead — signals use only what was known then"
    },
    {
      "section": "harness_standards",
      "check": "realistic_fills_modeled",
      "status": "pass",
      "evidence": "harness standards: realistic fills (next-open or worse for illiquid names)"
    },
    {
      "section": "protocol_and_reporting",
      "check": "hypothesis_stated_before_testing",
      "status": "pass",
      "evidence": "protocol: hypothesis stated before in-sample development"
    },
    {
      "section": "protocol_and_reporting",
      "check": "in_sample_results_reported",
      "status": "pass",
      "evidence": "protocol: in-sample development results reported"
    },
    {
      "section": "protocol_and_reporting",
      "check": "out_of_sample_holdout_reported",
      "status": "pass",
      "evidence": "protocol: out-of-sample holdout results reported"
    },
    {
      "section": "protocol_and_reporting",
      "check": "holdout_untouched_until_end",
      "status": "pass",
      "evidence": "protocol: the out-of-sample holdout was untouched until the end"
    },
    {
      "section": "protocol_and_reporting",
      "check": "walk_forward_results_reported",
      "status": "pass",
      "evidence": "protocol: walk-forward window results reported"
    },
    {
      "section": "protocol_and_reporting",
      "check": "all_three_reported_side_by_side",
      "status": "pass",
      "evidence": "quality gate: OOS + walk-forward results reported with in-sample, side by side — all three, not just the shiny one"
    },
    {
      "section": "costs_and_frictions",
      "check": "commissions_modeled",
      "status": "pass",
      "evidence": "costs & frictions: commissions modeled from day one, not as an afterthought"
    },
    {
      "section": "costs_and_frictions",
      "check": "spreads_modeled",
      "status": "pass",
      "evidence": "costs & frictions: spreads modeled"
    },
    {
      "section": "costs_and_frictions",
      "check": "slippage_modeled",
      "status": "pass",
      "evidence": "costs & frictions: slippage modeled"
    },
    {
      "section": "costs_and_frictions",
      "check": "borrow_modeled",
      "status": "pass",
      "evidence": "costs & frictions: borrow modeled"
    },
    {
      "section": "costs_and_frictions",
      "check": "financing_modeled",
      "status": "pass",
      "evidence": "costs & frictions: financing modeled"
    },
    {
      "section": "costs_and_frictions",
      "check": "taxes_modeled_when_material",
      "status": "pass",
      "evidence": "costs & frictions: taxes modeled where material"
    },
    {
      "section": "costs_and_frictions",
      "check": "no_skipped_costs",
      "status": "pass",
      "evidence": "skill red line: no skipped costs"
    },
    {
      "section": "overfit_and_fragility",
      "check": "parameter_sensitivity_shown",
      "status": "pass",
      "evidence": "overfit detection: parameter sensitivity shown"
    },
    {
      "section": "overfit_and_fragility",
      "check": "sensitivity_shows_smooth_plateau_not_sharp_peak",
      "status": "pass",
      "evidence": "overfit detection: sensitivity shows smooth plateaus, not sharp peaks — if it only works at exactly 14/3/7, it doesn't work"
    },
    {
      "section": "overfit_and_fragility",
      "check": "params_vs_data_ratio_computable",
      "status": "pass",
      "evidence": "overfit detection: params-vs-data ratio recomputed from the declared parameter and observation counts (reported, with no acceptance bar — the skill states none)"
    },
    {
      "section": "overfit_and_fragility",
      "check": "best_of_n_trials_disclosed",
      "status": "pass",
      "evidence": "overfit detection: \"best of N\" awareness — the number of trials the reported result was selected from is disclosed"
    },
    {
      "section": "overfit_and_fragility",
      "check": "no_curve_fit_parameters",
      "status": "pass",
      "evidence": "skill red line: no curve-fit parameters"
    },
    {
      "section": "overfit_and_fragility",
      "check": "single_name_dominance_checked",
      "status": "pass",
      "evidence": "fragility checks: single-name dominance checked"
    },
    {
      "section": "overfit_and_fragility",
      "check": "regime_dependence_checked",
      "status": "pass",
      "evidence": "fragility checks: regime dependence checked (works only in bull markets?)"
    },
    {
      "section": "overfit_and_fragility",
      "check": "capacity_liquidity_checked",
      "status": "pass",
      "evidence": "fragility checks: capacity/liquidity checked (can the size actually trade?)"
    },
    {
      "section": "paper_gate",
      "check": "paper_period_or_fill_count_defined",
      "status": "pass",
      "evidence": "paper gate: paper-trade (or tiny size with explicit sign-off) for a defined period/fill count"
    },
    {
      "section": "paper_gate",
      "check": "paper_gate_completed_or_waived",
      "status": "pass",
      "evidence": "quality gate: paper gate completed (or consciously waived with written reason + approval)"
    },
    {
      "section": "paper_gate",
      "check": "waiver_reason_and_approval_documented",
      "status": "pass",
      "evidence": "paper gate not waived — no waiver reason or approval is required"
    },
    {
      "section": "paper_gate",
      "check": "live_vs_model_behavior_compared",
      "status": "pass",
      "evidence": "paper gate: compare live vs model behavior (slippage, signal timing) before scaling"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "live_vs_backtest_divergence_tracked",
      "status": "pass",
      "evidence": "live monitoring: live-vs-backtest divergence tracked"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "kill_criteria_defined_before_scaling",
      "status": "pass",
      "evidence": "quality gate: kill criteria defined before scaling"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "kill_criteria_cover_drawdown_divergence_invalidation",
      "status": "pass",
      "evidence": "live monitoring: kill criteria cover drawdown, divergence and invalidation, defined in advance"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "explicit_confirmation_for_live_trades",
      "status": "pass",
      "evidence": "house gate: no live trade without explicit confirmation"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "trades_over_500_have_clear_yes",
      "status": "pass",
      "evidence": "house gate: >$500 trades need a clear yes"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "no_backtest_alone_as_live_confirmation",
      "status": "pass",
      "evidence": "skill red line: no \"the backtest says so\" as a substitute for live confirmation discipline"
    }
  ],
  "results_sets_reported": 3,
  "params_to_data_ratio": "0.0100",
  "paper_gate_status": "completed",
  "over_500_trade_declared": true,
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections.",
  "stamp": "STRATEGY BACKTEST VALIDATION\nstrategy: Alpha-Trend-01\nVERDICT: VALIDATED\n  harness_standards                pass\n  protocol_and_reporting           pass\n  costs_and_frictions              pass\n  overfit_and_fragility            pass\n  paper_gate                       pass\n  live_monitoring_and_house_gates  pass\n36 pass, 0 fail, 0 missing of 36 checks across six sections."
}
```

### Example 2 — violations (recorded HTTP 200)

Recorded case note: Violates red lines: look_ahead_used=true, costs_skipped=true, curve_fit_parameters_used=true, backtest_used_as_sole_live_confirmation=true. Paper gate incomplete.

Input:

```json
{
  "strategy": "Broken-Strategy",
  "harness": {
    "deterministic_runs": true,
    "data_snapshots_versioned": true,
    "point_in_time_universe": true,
    "look_ahead_used": true,
    "realistic_fills_modeled": true
  },
  "protocol": {
    "hypothesis_stated": true,
    "in_sample_reported": true,
    "out_of_sample_reported": true,
    "holdout_untouched_until_end": true,
    "walk_forward_reported": true,
    "reported_side_by_side": true
  },
  "costs": {
    "commissions_modeled": true,
    "spreads_modeled": true,
    "slippage_modeled": true,
    "borrow_modeled": true,
    "financing_modeled": true,
    "taxes_material": false,
    "taxes_modeled": false,
    "costs_skipped": true
  },
  "overfit": {
    "parameter_sensitivity_shown": true,
    "sensitivity_shows_smooth_plateau": true,
    "parameter_count": 5,
    "observation_count": 100,
    "best_of_n_disclosed": true,
    "curve_fit_parameters_used": true
  },
  "fragility": {
    "single_name_dominance_checked": true,
    "regime_dependence_checked": true,
    "capacity_liquidity_checked": true
  },
  "paper": {
    "period_or_fill_count_defined": true,
    "completed": false,
    "waived": false
  },
  "monitoring": {
    "divergence_tracked": true,
    "kill_criteria_defined_before_scaling": true,
    "kill_criteria_cover_all_three": true
  },
  "house_gates": {
    "explicit_confirmation_for_live_trades": true,
    "max_planned_trade_usd": 100,
    "clear_yes_for_trades_over_500": false,
    "backtest_used_as_sole_live_confirmation": true
  }
}
```

Response (REST):

```json
{
  "service": "strategy-backtest-validation",
  "atom_version": "0.1.0",
  "strategy": "Broken-Strategy",
  "verdict": "NOT_VALIDATED",
  "sections": {
    "harness_standards": "fail",
    "protocol_and_reporting": "pass",
    "costs_and_frictions": "fail",
    "overfit_and_fragility": "fail",
    "paper_gate": "fail",
    "live_monitoring_and_house_gates": "fail"
  },
  "checks": [
    {
      "section": "harness_standards",
      "check": "deterministic_runs",
      "status": "pass",
      "evidence": "harness standards: deterministic runs"
    },
    {
      "section": "harness_standards",
      "check": "data_snapshots_versioned",
      "status": "pass",
      "evidence": "harness standards: versioned data snapshots"
    },
    {
      "section": "harness_standards",
      "check": "point_in_time_universe_correct",
      "status": "pass",
      "evidence": "harness standards: correct point-in-time universes"
    },
    {
      "section": "harness_standards",
      "check": "no_look_ahead",
      "status": "fail",
      "evidence": "harness standards: no look-ahead — signals use only what was known then"
    },
    {
      "section": "harness_standards",
      "check": "realistic_fills_modeled",
      "status": "pass",
      "evidence": "harness standards: realistic fills (next-open or worse for illiquid names)"
    },
    {
      "section": "protocol_and_reporting",
      "check": "hypothesis_stated_before_testing",
      "status": "pass",
      "evidence": "protocol: hypothesis stated before in-sample development"
    },
    {
      "section": "protocol_and_reporting",
      "check": "in_sample_results_reported",
      "status": "pass",
      "evidence": "protocol: in-sample development results reported"
    },
    {
      "section": "protocol_and_reporting",
      "check": "out_of_sample_holdout_reported",
      "status": "pass",
      "evidence": "protocol: out-of-sample holdout results reported"
    },
    {
      "section": "protocol_and_reporting",
      "check": "holdout_untouched_until_end",
      "status": "pass",
      "evidence": "protocol: the out-of-sample holdout was untouched until the end"
    },
    {
      "section": "protocol_and_reporting",
      "check": "walk_forward_results_reported",
      "status": "pass",
      "evidence": "protocol: walk-forward window results reported"
    },
    {
      "section": "protocol_and_reporting",
      "check": "all_three_reported_side_by_side",
      "status": "pass",
      "evidence": "quality gate: OOS + walk-forward results reported with in-sample, side by side — all three, not just the shiny one"
    },
    {
      "section": "costs_and_frictions",
      "check": "commissions_modeled",
      "status": "pass",
      "evidence": "costs & frictions: commissions modeled from day one, not as an afterthought"
    },
    {
      "section": "costs_and_frictions",
      "check": "spreads_modeled",
      "status": "pass",
      "evidence": "costs & frictions: spreads modeled"
    },
    {
      "section": "costs_and_frictions",
      "check": "slippage_modeled",
      "status": "pass",
      "evidence": "costs & frictions: slippage modeled"
    },
    {
      "section": "costs_and_frictions",
      "check": "borrow_modeled",
      "status": "pass",
      "evidence": "costs & frictions: borrow modeled"
    },
    {
      "section": "costs_and_frictions",
      "check": "financing_modeled",
      "status": "pass",
      "evidence": "costs & frictions: financing modeled"
    },
    {
      "section": "costs_and_frictions",
      "check": "taxes_modeled_when_material",
      "status": "pass",
      "evidence": "taxes not declared material — modeling taxes is not required"
    },
    {
      "section": "costs_and_frictions",
      "check": "no_skipped_costs",
      "status": "fail",
      "evidence": "skill red line: no skipped costs"
    },
    {
      "section": "overfit_and_fragility",
      "check": "parameter_sensitivity_shown",
      "status": "pass",
      "evidence": "overfit detection: parameter sensitivity shown"
    },
    {
      "section": "overfit_and_fragility",
      "check": "sensitivity_shows_smooth_plateau_not_sharp_peak",
      "status": "pass",
      "evidence": "overfit detection: sensitivity shows smooth plateaus, not sharp peaks — if it only works at exactly 14/3/7, it doesn't work"
    },
    {
      "section": "overfit_and_fragility",
      "check": "params_vs_data_ratio_computable",
      "status": "pass",
      "evidence": "overfit detection: params-vs-data ratio recomputed from the declared parameter and observation counts (reported, with no acceptance bar — the skill states none)"
    },
    {
      "section": "overfit_and_fragility",
      "check": "best_of_n_trials_disclosed",
      "status": "pass",
      "evidence": "overfit detection: \"best of N\" awareness — the number of trials the reported result was selected from is disclosed"
    },
    {
      "section": "overfit_and_fragility",
      "check": "no_curve_fit_parameters",
      "status": "fail",
      "evidence": "skill red line: no curve-fit parameters"
    },
    {
      "section": "overfit_and_fragility",
      "check": "single_name_dominance_checked",
      "status": "pass",
      "evidence": "fragility checks: single-name dominance checked"
    },
    {
      "section": "overfit_and_fragility",
      "check": "regime_dependence_checked",
      "status": "pass",
      "evidence": "fragility checks: regime dependence checked (works only in bull markets?)"
    },
    {
      "section": "overfit_and_fragility",
      "check": "capacity_liquidity_checked",
      "status": "pass",
      "evidence": "fragility checks: capacity/liquidity checked (can the size actually trade?)"
    },
    {
      "section": "paper_gate",
      "check": "paper_period_or_fill_count_defined",
      "status": "pass",
      "evidence": "paper gate: paper-trade (or tiny size with explicit sign-off) for a defined period/fill count"
    },
    {
      "section": "paper_gate",
      "check": "paper_gate_completed_or_waived",
      "status": "fail",
      "evidence": "quality gate: paper gate completed (or consciously waived with written reason + approval)"
    },
    {
      "section": "paper_gate",
      "check": "waiver_reason_and_approval_documented",
      "status": "pass",
      "evidence": "paper gate not waived — no waiver reason or approval is required"
    },
    {
      "section": "paper_gate",
      "check": "live_vs_model_behavior_compared",
      "status": "missing",
      "evidence": "paper gate: compare live vs model behavior (slippage, signal timing) before scaling"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "live_vs_backtest_divergence_tracked",
      "status": "pass",
      "evidence": "live monitoring: live-vs-backtest divergence tracked"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "kill_criteria_defined_before_scaling",
      "status": "pass",
      "evidence": "quality gate: kill criteria defined before scaling"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "kill_criteria_cover_drawdown_divergence_invalidation",
      "status": "pass",
      "evidence": "live monitoring: kill criteria cover drawdown, divergence and invalidation, defined in advance"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "explicit_confirmation_for_live_trades",
      "status": "pass",
      "evidence": "house gate: no live trade without explicit confirmation"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "trades_over_500_have_clear_yes",
      "status": "pass",
      "evidence": "no trade over $500 declared — the clear-yes gate does not bind"
    },
    {
      "section": "live_monitoring_and_house_gates",
      "check": "no_backtest_alone_as_live_confirmation",
      "status": "fail",
      "evidence": "skill red line: no \"the backtest says so\" as a substitute for live confirmation discipline"
    }
  ],
  "results_sets_reported": 3,
  "params_to_data_ratio": "0.0500",
  "paper_gate_status": "not_completed",
  "over_500_trade_declared": false,
  "summary": "30 pass, 5 fail, 1 missing of 36 checks across six sections.",
  "stamp": "STRATEGY BACKTEST VALIDATION\nstrategy: Broken-Strategy\nVERDICT: NOT_VALIDATED\n  harness_standards                fail\n  protocol_and_reporting           pass\n  costs_and_frictions              fail\n  overfit_and_fragility            fail\n  paper_gate                       fail\n  live_monitoring_and_house_gates  fail\n30 pass, 5 fail, 1 missing of 36 checks across six sections."
}
```

### Example 3 — malformed (recorded HTTP 422)

Recorded case note: Type mismatch on harness field; expected object, received string.

Input:

```json
{
  "strategy": "Malformed-Input",
  "harness": "should_be_an_object"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "harness",
  "detail": "harness must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Y — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Integrators Y · Developers Y · Ops Y · Regulators Y (finance-adjacent and compliance-facing — the verdict is validation evidence over a trading strategy's backtest record (cost modelling, overfit evidence, paper gate, house gates), the kind of record a reviewer or auditor asks for before capital is committed; it is validation of declared evidence, not advice and not a certification.) |
| Checks named count vs recorded count | 36 / 36 — every check in the recorded full-pass response is documented |
| Verdict vocabulary complete | Y — 3 verdict values plus section/per-item statuses documented |
| Input reference typed | Y — 42 field rows, each with a type (SERVICE.md field table + recorded input schema) |
| Worked examples verbatim-verified | Y — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/strategy-backtest-validation/evidence.json` |

