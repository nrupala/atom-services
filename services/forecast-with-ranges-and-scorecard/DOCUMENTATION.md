# Forecast with ranges and scorecard — `forecast-with-ranges-and-scorecard`

**Forecast with ranges and scorecard** · slug `forecast-with-ranges-and-scorecard` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Field table source: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

Bound capability (from SERVICE.md): Forecast with discipline — baselines, seasonality, drivers, ranges, accuracy tracking, revision hygiene.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run — the exact request and response are reproduced verbatim under **Worked examples → 1. Full-pass** below, so every number quoted here can be checked against that record.

**Step 1 — Get a key.** Follow the key flow in the How-to below (sign up, mint a session, issue a key for this atom). You send that key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** Build one JSON object for the subject `series` = `revenue_q1_2026`. Fill in every group in the Input reference: absent fields are not neutral — they become missing evidence (or, for the report atom, labeled gaps). Present-but-wrong values are what produce a failing verdict, so declare what is actually true, including the red-line fields that must be `false`.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/forecast-with-ranges-and-scorecard` with the manifest as the body and the Authorization header (full curl in the How-to below).

**Step 4 — Read the verdict.** The recorded call returned HTTP 200 with `verdict: "FORECAST_READY"`, every section `pass`, and the summary: "25 pass, 0 fail, 0 missing of 25 checks across six sections." The `checks` array carries one entry per check (`section`, `check`, `status`, `evidence`), and the `stamp` field is a plain-text rendering of the same verdict for logs and tickets.

**Step 5 — Confirm determinism.** The verification battery called the same manifest twice over REST and once over MCP: the REST repeat was byte-identical and the MCP structured content was equal to the REST result (see TEST-REPORT.md). Same manifest in → same result out is the product property, not a hope.

**Step 6 — Iterate.** If the result is not the passing one, do not resubmit blindly: use the How-to 'Read a failing verdict and fix the manifest' below. Each failing or missing check names the exact field to correct or supply.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "forecast-with-ranges-and-scorecard"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom (USER-GUIDE.md). The contract adds: scope is this atom only — a key for one atom never verifies for another.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -s -X POST https://atoms.pipavia.com/v1/forecast-with-ranges-and-scorecard \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

### Call via MCP

- MCP endpoint: `POST https://atoms.pipavia.com/mcp/forecast-with-ranges-and-scorecard`
- Tool name: `forecast_with_ranges_and_scorecard` (recorded in evidence.json as `mcp_tool_name`; `tools/list` returned HTTP 200).
- Call the tool with `tools/call`; the tool arguments are exactly the input object documented in the Input reference — the same manifest as the REST body, with no wrapper fields of the atom's own.
- MCP and REST are two faces of the same deterministic core: the verification battery's parity case checks that MCP structured content equals the REST result for the full-pass manifest.

### Read a failing verdict and fix the manifest

Use the recorded violations run (Worked examples → 2. Violations) as the pattern. It returned `FORECAST_NOT_READY` with the summary: "1 pass, 4 fail, 20 missing of 25 checks across six sections."

The checks with `status: "fail"` in that recorded run were:

- `ranges_and_scenarios.range_ordered_and_nondegenerate` — evidence: "ranges, not points: low <= base <= high with low < high — a bare point is false precision"
- `scorecard_accuracy.declared_mae_matches_computed` — evidence: "accuracy tracking: the declared MAE agrees with the MAE recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals)"
- `scorecard_accuracy.declared_mape_matches_computed` — evidence: "accuracy tracking: the declared MAPE (percent) agrees with the MAPE (percent) recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals)"
- `scorecard_accuracy.declared_bias_matches_computed` — evidence: "accuracy tracking: the declared bias (mean signed error, forecast - actual) agrees with the bias (mean signed error, forecast - actual) recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals)"

Fix procedure:

1. **Separate `fail` from `missing`.** A `fail` means a field was present but false / invalid, or a must-be-false red-line field was true — correct the underlying fact or the declaration. A `missing` check means the field was absent — supply the evidence. Adding a missing field cannot fix a fail, and vice versa.
2. **Work section by section.** The `sections` object rolls the checks up: a section is `fail` if any of its checks fails, otherwise `insufficient_evidence` if any is missing, otherwise `pass`. Fix every failing check in a section before re-reading its roll-up.
3. **Respect the gates.** Some checks only bite when a gate field says they apply (see the notes in the Input reference). If a gated check fails, either the gated thing must be brought up to standard or the gate declaration was wrong — fix whichever is true, never just flip the gate to make the check disappear if the gated thing exists.
4. **Resubmit the whole manifest.** The atom is stateless per call; there is no partial update. Resubmit the corrected full manifest and confirm the summary counts move (fail count to zero, then missing count to zero).

### Handle a 422 invalid_input

A 422 is not a verdict — the manifest was rejected before evaluation because a field had the wrong JSON type. The recorded malformed run (Worked examples → 3. Malformed) returned exactly:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "baselines.naive_value",
  "detail": "baselines.naive_value must be a number"
}
```

Fix the field named in `field` (`baselines.naive_value`): `detail` says what was expected ("baselines.naive_value must be a number"). Correct the type in your manifest — do not delete the field to dodge the error, because an absent field becomes missing evidence / a gap and changes the result — then resubmit. Note the contrast the verification battery was built to enforce: a type-violating field is a 422, while an absent field is evaluated as missing evidence.

## Reference

### Endpoints

| Face | Endpoint | Notes |
|---|---|---|
| REST | `POST https://atoms.pipavia.com/v1/forecast-with-ranges-and-scorecard` | Body = the input object; `Authorization: Bearer <key>` |
| MCP | `POST https://atoms.pipavia.com/mcp/forecast-with-ranges-and-scorecard` | Tool name `forecast_with_ranges_and_scorecard`; `tools/call` arguments = the input object |
| Gateway | `https://atoms.pipavia.com` | Recorded gateway version 1.1.0; health HTTP 200 at evidence time |

### Input reference

Types are taken from SERVICE.md's field table: 'All fields are booleans unless noted' — fields with no type note in that table are listed as boolean, and fields with a note carry that note's type. Notes (gates / conditionals / must-be-false and must-be-true conditions) are preserved from SERVICE.md.

#### `series`

| Field | Type | Read by / notes |
|---|---|---|
| `series` | string | carried into the verdict output, not itself checked |

#### `forecast`

| Field | Type | Read by / notes |
|---|---|---|
| `forecast.purpose_stated` | boolean | Read by: purpose_and_horizon |
| `forecast.horizon_stated` | boolean | Read by: purpose_and_horizon |
| `forecast.decision_cadence_matched` | boolean | Read by: purpose_and_horizon |
| `forecast.owner_named` | boolean | Read by: purpose_and_horizon |

#### `baselines`

| Field | Type | Read by / notes |
|---|---|---|
| `baselines.naive_value` | number | Read by: baselines_and_decomposition; with the two baselines below, all three must be present as numbers |
| `baselines.moving_average_value` | number | Read by: baselines_and_decomposition; see above |
| `baselines.seasonal_naive_value` | number | Read by: baselines_and_decomposition; see above |
| `baselines.compared_to_forecast` | boolean | Read by: baselines_and_decomposition |
| `baselines.complex_model_used` | boolean | Read by: baselines_and_decomposition; gates the beats-baseline check below |
| `baselines.complex_model_beats_baselines` | boolean | Read by: baselines_and_decomposition; required when a complex model is used; otherwise the check passes as not applicable |

#### `decomposition`

| Field | Type | Read by / notes |
|---|---|---|
| `decomposition.level_trend_seasonality_shown` | boolean | Read by: baselines_and_decomposition |
| `decomposition.drivers_known` | boolean | Read by: baselines_and_decomposition; gates the driver-based check below |
| `decomposition.driver_based_shown` | boolean | Read by: baselines_and_decomposition; required when drivers are known; otherwise the check passes as not applicable |

#### `range`

| Field | Type | Read by / notes |
|---|---|---|
| `range.low` | number | Read by: ranges_and_scenarios; must be ≤ `range.base` and < `range.high` |
| `range.base` | number | Read by: ranges_and_scenarios |
| `range.high` | number | Read by: ranges_and_scenarios |

#### `scenarios`

| Field | Type | Read by / notes |
|---|---|---|
| `scenarios` | list of scenarios | Read by: ranges_and_scenarios; absent / not a list / empty = both computed scenario checks missing |
| `scenarios[].name` | string | Read by: ranges_and_scenarios; the set must cover `"base"`, `"best"` and `"worst"` |
| `scenarios[].trigger_condition` | non-empty string | Read by: ranges_and_scenarios; required on every scenario |

#### `scenario_detail`

| Field | Type | Read by / notes |
|---|---|---|
| `scenario_detail.sensitivity_shown` | boolean | Read by: ranges_and_scenarios |

#### `scorecard`

| Field | Type | Read by / notes |
|---|---|---|
| `scorecard.published` | boolean | Read by: scorecard_accuracy |
| `scorecard.tracked_per_series` | boolean | Read by: scorecard_accuracy |
| `scorecard.history` | list of past forecast-vs-actual entries | Read by: scorecard_accuracy; absent / not a list / empty = all computed scorecard checks missing |
| `scorecard.history[].period` | non-empty string | Read by: scorecard_accuracy |
| `scorecard.history[].forecast` | number | Read by: scorecard_accuracy |
| `scorecard.history[].actual` | number | Read by: scorecard_accuracy |
| `scorecard.declared_mae` | number | Read by: scorecard_accuracy; compared against the MAE recomputed from the history |
| `scorecard.declared_mape_percent` | number | Read by: scorecard_accuracy; MAPE in percent, recomputed over entries with a non-zero actual |
| `scorecard.declared_bias` | number | Read by: scorecard_accuracy; mean signed error, forecast − actual, recomputed from the history |

#### `revision`

| Field | Type | Read by / notes |
|---|---|---|
| `revision.forecast_actual_history_preserved` | boolean | Read by: revision_hygiene |
| `revision.revisions_made` | boolean | Read by: revision_hygiene; gates the reasons check below |
| `revision.revision_reasons_documented` | boolean | Read by: revision_hygiene; required when revisions were made; otherwise the check passes as not applicable |
| `revision.silently_restated` | boolean | Read by: revision_hygiene; must be `false` to pass |

#### `cadence`

| Field | Type | Read by / notes |
|---|---|---|
| `cadence.rolling_forecast_maintained` | boolean | Read by: cadence |
| `cadence.cadence_matches_review_rhythm` | boolean | Read by: cadence |
| `cadence.forecast_updated_on_cadence` | boolean | Read by: cadence |

Input fields documented: 37 (every row of SERVICE.md's field table(s), typed).

### Checks

Ground truth is the `checks` array in the recorded full-pass REST response: **25 checks**, grouped by section as recorded. For each check, the 'requires' column quotes the recorded `evidence` string from that response — it is the atom's own statement of what the check attests.

Per-check status semantics:

- `pass` — the evidence was present and satisfied the check. This includes gated checks that do not apply: they report `pass` with evidence explaining the non-applicability (for example 'no calculator or tool included'); there is no separate not-applicable status in the recorded responses.
- `fail` — the evidence was present but false / invalid, a must-be-false field was true, or a computed check's recomputation disagreed. Any single `fail` produces the failing verdict, regardless of missing checks.
- `missing` — the field (or list, or gate structure) was absent, so the check could not be evaluated. Missing checks never produce the failing verdict on their own; if nothing fails and at least one check is missing, the verdict is `INSUFFICIENT_EVIDENCE`.

Four computed themes in SERVICE.md, realised as seven named checks in the recorded response, are computed, not declared: `baselines_computed_and_shown` (all three baseline values present as numbers), `range_ordered_and_nondegenerate` (`low ≤ base ≤ high` with `low < high`), `scenarios_cover_base_best_worst` plus `scenario_triggers_documented` (the scenario set covers `base` / `best` / `worst`, each with a trigger condition), and the three scorecard checks `declared_mae_matches_computed`, `declared_mape_matches_computed` and `declared_bias_matches_computed` (declared MAE, MAPE and bias recomputed from `scorecard.history[]` and required to agree within 0.01). The response also reports `history_entries_evaluated` and `scenarios_evaluated`.

#### Section `purpose_and_horizon` — 4 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `purpose_stated` | purpose stated: what decision this forecast feeds |
| `horizon_stated` | horizon stated: operational (weeks) vs strategic (years) |
| `forecast_matched_to_decision_cadence` | forecast to the decision cadence — daily forecasts for daily decisions |
| `owner_named` | red line: no forecasts without owners |

#### Section `baselines_and_decomposition` — 5 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `baselines_computed_and_shown` | baseline methods always: naive, moving average and seasonal-naive — computed and shown |
| `baseline_compared_to_forecast` | quality gate: baseline computed and compared |
| `complex_model_beats_baselines` | complexity must beat simplicity to earn its place |
| `decomposition_shown` | decompose: level / trend / seasonality shown |
| `driver_based_when_drivers_known` | prefer driver-based forecasts where drivers are known (units x price, loads x rates, headcount x costs) over blind extrapolation |

#### Section `ranges_and_scenarios` — 4 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `range_ordered_and_nondegenerate` | ranges, not points: low <= base <= high with low < high — a bare point is false precision |
| `scenarios_cover_base_best_worst` | scenario & sensitivity: base/best/worst scenarios delivered |
| `scenario_triggers_documented` | every scenario carries a trigger condition (what signal tells you you're in that case) |
| `sensitivity_shown` | scenario & sensitivity: sensitivity of the forecast to its drivers shown |

#### Section `scorecard_accuracy` — 6 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `scorecard_published` | publish scorecards so trust is earned |
| `accuracy_tracked_per_series` | quality gate: accuracy tracked per series with a scorecard |
| `history_entries_complete` | every history entry carries a period, a forecast, and an actual |
| `declared_mae_matches_computed` | accuracy tracking: the declared MAE agrees with the MAE recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals) |
| `declared_mape_matches_computed` | accuracy tracking: the declared MAPE (percent) agrees with the MAPE (percent) recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals) |
| `declared_bias_matches_computed` | accuracy tracking: the declared bias (mean signed error, forecast - actual) agrees with the bias (mean signed error, forecast - actual) recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals) |

#### Section `revision_hygiene` — 3 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `forecast_actual_history_preserved` | revision hygiene: keep forecast-vs-actual history |
| `revision_reasons_documented` | document why revisions happened |
| `no_silent_restatement` | red line: no hindsight edits — never silently restate old forecasts |

#### Section `cadence` — 3 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `rolling_forecast_maintained` | monthly rolling forecasts (12-month) typical; weekly for operations; annual for strategy |
| `cadence_matches_review_rhythm` | cadence matched to the review rhythm |
| `forecast_updated_on_cadence` | the forecast is actually updated on its declared cadence |

### Output format

A JSON object (the REST body and the MCP structured content are the same shape):

- `service` (string, `"forecast-with-ranges-and-scorecard"`) and `atom_version` (string, `"0.1.0"`)
- `series` — the subject value carried through from the manifest
- `verdict` — one of the verdict values below
- `sections` — an object mapping each section name to its section status (see Verdict vocabulary)
- `checks` — an array of `{section, check, status, evidence}` objects, in section order, covering every check
- Computed count / value fields recorded in the full-pass response: `history_entries_evaluated`, `scenarios_evaluated`
- `summary` — a one-line count summary, for example the recorded full-pass summary quoted in the Tutorial
- `stamp` — a plain-text rendering of the verdict, for logs, tickets and filings

Determinism: the same manifest produces a byte-identical REST response on repeat, and MCP structured content equal to REST (both recorded in the verification battery).

### Verdict vocabulary

Every verdict value this atom can return (from SERVICE.md and the recorded responses — the recorded cases exercise all three):

| Verdict | Meaning |
|---|---|
| `FORECAST_READY` | All 25 checks pass across all six sections. |
| `FORECAST_NOT_READY` | At least one check fails (a present field is false / invalid, the range is mis-ordered or degenerate, or a declared scorecard value disagrees with the recomputed value). |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but at least one check is `missing` — evidence was not declared. |

Section statuses (values of the `sections` object): `pass` (every check in the section passes, including gated checks that pass as not applicable), `fail` (at least one check in the section fails), `insufficient_evidence` (no check in the section fails, but at least one is missing).

Per-check statuses (values of `checks[].status`): `pass`, `fail`, `missing` — semantics as defined under Checks above. There is no separate not-applicable status; gated non-applicability is a `pass` whose evidence says so.

### Errors

Only error shapes evidenced in the repo / gateway documentation are listed. The 422 shape is recorded verbatim in the evidence; the other statuses are named in USER-GUIDE.md with the meanings below — no payload shape for them is recorded in the evidence, so none is invented here.

| HTTP | Meaning | Shape / notes |
|---|---|---|
| 401 | Unauthenticated — missing / invalid key | Named in USER-GUIDE.md; send `Authorization: Bearer <key>` |
| 403 | Key lacks this atom's scope | Named in USER-GUIDE.md; issue a key for this atom (contract: scope is this atom only) |
| 422 | `invalid_input` — a field has the wrong JSON type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance: field `baselines.naive_value`, detail "baselines.naive_value must be a number" |
| 429 | Rate limit exceeded | Named in USER-GUIDE.md; limits below |

### Rate limits + pricing status

- Rate limit (contract.yaml): **60 per key per minute, 10,000 per key per day**.
- Pricing (contract.yaml): `pricing.rate` is `null` (`rate_status: pending`), so the rate is: **Free during trial — rate pending.** No price is set; SERVICE.md states prices are set only from measured production cost per unit.

## Explanation

What this atom does in depth. The differentiating discipline is the scorecard. Baselines, ranges and scenarios are common forecasting hygiene; recomputing a published scorecard's MAE, MAPE and bias from its own declared history — and failing the artifact when the declared numbers do not agree — is what makes a forecast's track record checkable rather than asserted. SERVICE.md records the named doubt: 'Methods are commodity; scorecard differentiates.'

**How the verdict is decided — the deterministic core.** The atom is a deterministic evaluator over a declared evidence manifest: no model call, no network fetch, no clock. Each check reads named fields (Input reference), applies its gate if it has one, and lands as `pass`, `fail` or `missing`. The verdict is then a pure roll-up: any `fail` → the failing verdict; otherwise any `missing` → `INSUFFICIENT_EVIDENCE`; otherwise the passing verdict. Sections roll up the same way. That ordering matters: **an absent field is missing evidence, never a fail, and a present-but-false field is a fail, never missing** — conflating the two would either punish callers for not declaring something or let a declared violation hide as a gap.

Four computed themes in SERVICE.md, realised as seven named checks in the recorded response, are computed, not declared: `baselines_computed_and_shown` (all three baseline values present as numbers), `range_ordered_and_nondegenerate` (`low ≤ base ≤ high` with `low < high`), `scenarios_cover_base_best_worst` plus `scenario_triggers_documented` (the scenario set covers `base` / `best` / `worst`, each with a trigger condition), and the three scorecard checks `declared_mae_matches_computed`, `declared_mape_matches_computed` and `declared_bias_matches_computed` (declared MAE, MAPE and bias recomputed from `scorecard.history[]` and required to agree within 0.01). The response also reports `history_entries_evaluated` and `scenarios_evaluated`.

**What it does NOT do:**

- It does not produce a forecast and makes no forecast judgment. It validates a declared forecast artifact.
- No accuracy threshold is invented by the atom: it checks that the scorecard is honest about its own history, never that the forecast was good enough.
- Gated checks that do not apply (for example, no complex model used, no drivers known, no revisions made) are reported as `pass` with evidence saying why they are not applicable — there is no separate `not_applicable` status in the recorded responses.

**Buyer / use context.** First buyer hypothesis (SERVICE.md, not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand (first buyer hypothesis in SERVICE.md, not yet market-tested). Internal self-use (R3, passed): Portfolio revenue and demand forecasting — Wright is an internal caller at zero price, metered to the internal cost ledger. The atom sells its deliverable — the deliverable it produces — never the underlying knowledge itself.

## Role views

### For integrators (Users)

Start with USER-GUIDE.md for the quick start, then the Tutorial and How-to guides above. Your integration surface is exactly two endpoints (REST and MCP, same manifest, same result), one scoped key, and the error table above. Pin your client to the verdict / status vocabulary and the per-check (or gaps) semantics in the Reference — those are the stable contract at atom version 0.1.0; treat `evidence` / `summary` strings as human-readable, not parse targets, except for `checks[].section`, `checks[].check` and `checks[].status` (or, for the report atom, `status`, `layers`, `counts` and `gaps`) which are machine-stable.

### For developers

Manifest authoring: author against the Input reference — every SERVICE.md field, typed, with its gates. Determinism: the core is a pure function of the manifest (Python 3, stdlib only); the same manifest yields a byte-identical REST repeat and MCP/REST parity, both recorded. Implementation: `src/forecast_with_ranges_and_scorecard.py` — contract entry: src/forecast_with_ranges_and_scorecard.py — evaluate(manifest) -> verdict dict; CLI prints JSON + stamp. Tests: tests/test_forecast_with_ranges_and_scorecard.py — 26 tests, all passing 2026-11-15. Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract binding rule R1).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/forecast-with-ranges-and-scorecard`, MCP `POST https://atoms.pipavia.com/mcp/forecast-with-ranges-and-scorecard` (tool `forecast_with_ranges_and_scorecard`). Gateway version recorded at evidence time: 1.1.0. Rate limits: 60/min and 10,000/day per key; watch for 429s as the capacity signal. Key scope: per user, per atom — a 403 spike means clients using a key without this atom's scope, not an outage. Error monitoring: separate 422s (client manifest type errors; the `field` value is the diagnostic) from verdict outcomes (200 with a failing verdict / partial status is a successful call, not an error). Status: live — release candidate, one-week RC soak to 2026-11-22; verification retest verdict PASS on 2026-11-15 (gateway 1.1.0, deployment 7f9cae9fdd60417eb72062905a066554).

## Worked examples

Provenance: recorded 2026-11-15T23:49:15.081373+00:00 against gateway v1.1.0, external verification lane, source `verification/work/forecast-with-ranges-and-scorecard/evidence.json`. The three examples below are that record's `full-pass`, `violations` and `malformed` cases: each is the case's `input` followed by the REST execution's `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values identical to the record — mechanically verified, see the checklist below).

### 1. Full-pass — `full-pass` (recorded HTTP 200)

Input:

```json
{
  "series": "revenue_q1_2026",
  "forecast": {
    "purpose_stated": true,
    "horizon_stated": true,
    "decision_cadence_matched": true,
    "owner_named": true
  },
  "baselines": {
    "naive_value": 100,
    "moving_average_value": 105,
    "seasonal_naive_value": 110,
    "compared_to_forecast": true,
    "complex_model_used": true,
    "complex_model_beats_baselines": true
  },
  "decomposition": {
    "level_trend_seasonality_shown": true,
    "drivers_known": true,
    "driver_based_shown": true
  },
  "range": {
    "low": 90,
    "base": 100,
    "high": 110
  },
  "scenarios": [
    {
      "name": "base",
      "trigger_condition": "normal"
    },
    {
      "name": "best",
      "trigger_condition": "growth"
    },
    {
      "name": "worst",
      "trigger_condition": "recession"
    }
  ],
  "scenario_detail": {
    "sensitivity_shown": true
  },
  "scorecard": {
    "published": true,
    "tracked_per_series": true,
    "history": [
      {
        "period": "2025-Q4",
        "forecast": 100,
        "actual": 100
      }
    ],
    "declared_mae": 0.0,
    "declared_mape_percent": 0.0,
    "declared_bias": 0.0
  },
  "revision": {
    "forecast_actual_history_preserved": true,
    "revisions_made": true,
    "revision_reasons_documented": true,
    "silently_restated": false
  },
  "cadence": {
    "rolling_forecast_maintained": true,
    "cadence_matches_review_rhythm": true,
    "forecast_updated_on_cadence": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "forecast-with-ranges-and-scorecard",
  "atom_version": "0.1.0",
  "series": "revenue_q1_2026",
  "verdict": "FORECAST_READY",
  "sections": {
    "purpose_and_horizon": "pass",
    "baselines_and_decomposition": "pass",
    "ranges_and_scenarios": "pass",
    "scorecard_accuracy": "pass",
    "revision_hygiene": "pass",
    "cadence": "pass"
  },
  "checks": [
    {
      "section": "purpose_and_horizon",
      "check": "purpose_stated",
      "status": "pass",
      "evidence": "purpose stated: what decision this forecast feeds"
    },
    {
      "section": "purpose_and_horizon",
      "check": "horizon_stated",
      "status": "pass",
      "evidence": "horizon stated: operational (weeks) vs strategic (years)"
    },
    {
      "section": "purpose_and_horizon",
      "check": "forecast_matched_to_decision_cadence",
      "status": "pass",
      "evidence": "forecast to the decision cadence — daily forecasts for daily decisions"
    },
    {
      "section": "purpose_and_horizon",
      "check": "owner_named",
      "status": "pass",
      "evidence": "red line: no forecasts without owners"
    },
    {
      "section": "baselines_and_decomposition",
      "check": "baselines_computed_and_shown",
      "status": "pass",
      "evidence": "baseline methods always: naive, moving average and seasonal-naive — computed and shown"
    },
    {
      "section": "baselines_and_decomposition",
      "check": "baseline_compared_to_forecast",
      "status": "pass",
      "evidence": "quality gate: baseline computed and compared"
    },
    {
      "section": "baselines_and_decomposition",
      "check": "complex_model_beats_baselines",
      "status": "pass",
      "evidence": "complexity must beat simplicity to earn its place"
    },
    {
      "section": "baselines_and_decomposition",
      "check": "decomposition_shown",
      "status": "pass",
      "evidence": "decompose: level / trend / seasonality shown"
    },
    {
      "section": "baselines_and_decomposition",
      "check": "driver_based_when_drivers_known",
      "status": "pass",
      "evidence": "prefer driver-based forecasts where drivers are known (units x price, loads x rates, headcount x costs) over blind extrapolation"
    },
    {
      "section": "ranges_and_scenarios",
      "check": "range_ordered_and_nondegenerate",
      "status": "pass",
      "evidence": "ranges, not points: low <= base <= high with low < high — a bare point is false precision"
    },
    {
      "section": "ranges_and_scenarios",
      "check": "scenarios_cover_base_best_worst",
      "status": "pass",
      "evidence": "scenario & sensitivity: base/best/worst scenarios delivered"
    },
    {
      "section": "ranges_and_scenarios",
      "check": "scenario_triggers_documented",
      "status": "pass",
      "evidence": "every scenario carries a trigger condition (what signal tells you you're in that case)"
    },
    {
      "section": "ranges_and_scenarios",
      "check": "sensitivity_shown",
      "status": "pass",
      "evidence": "scenario & sensitivity: sensitivity of the forecast to its drivers shown"
    },
    {
      "section": "scorecard_accuracy",
      "check": "scorecard_published",
      "status": "pass",
      "evidence": "publish scorecards so trust is earned"
    },
    {
      "section": "scorecard_accuracy",
      "check": "accuracy_tracked_per_series",
      "status": "pass",
      "evidence": "quality gate: accuracy tracked per series with a scorecard"
    },
    {
      "section": "scorecard_accuracy",
      "check": "history_entries_complete",
      "status": "pass",
      "evidence": "every history entry carries a period, a forecast, and an actual"
    },
    {
      "section": "scorecard_accuracy",
      "check": "declared_mae_matches_computed",
      "status": "pass",
      "evidence": "accuracy tracking: the declared MAE agrees with the MAE recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals)"
    },
    {
      "section": "scorecard_accuracy",
      "check": "declared_mape_matches_computed",
      "status": "pass",
      "evidence": "accuracy tracking: the declared MAPE (percent) agrees with the MAPE (percent) recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals)"
    },
    {
      "section": "scorecard_accuracy",
      "check": "declared_bias_matches_computed",
      "status": "pass",
      "evidence": "accuracy tracking: the declared bias (mean signed error, forecast - actual) agrees with the bias (mean signed error, forecast - actual) recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals)"
    },
    {
      "section": "revision_hygiene",
      "check": "forecast_actual_history_preserved",
      "status": "pass",
      "evidence": "revision hygiene: keep forecast-vs-actual history"
    },
    {
      "section": "revision_hygiene",
      "check": "revision_reasons_documented",
      "status": "pass",
      "evidence": "document why revisions happened"
    },
    {
      "section": "revision_hygiene",
      "check": "no_silent_restatement",
      "status": "pass",
      "evidence": "red line: no hindsight edits — never silently restate old forecasts"
    },
    {
      "section": "cadence",
      "check": "rolling_forecast_maintained",
      "status": "pass",
      "evidence": "monthly rolling forecasts (12-month) typical; weekly for operations; annual for strategy"
    },
    {
      "section": "cadence",
      "check": "cadence_matches_review_rhythm",
      "status": "pass",
      "evidence": "cadence matched to the review rhythm"
    },
    {
      "section": "cadence",
      "check": "forecast_updated_on_cadence",
      "status": "pass",
      "evidence": "the forecast is actually updated on its declared cadence"
    }
  ],
  "history_entries_evaluated": 1,
  "scenarios_evaluated": 3,
  "summary": "25 pass, 0 fail, 0 missing of 25 checks across six sections.",
  "stamp": "FORECAST WITH RANGES AND SCORECARD\nseries: revenue_q1_2026\nVERDICT: FORECAST_READY\n  purpose_and_horizon          pass\n  baselines_and_decomposition  pass\n  ranges_and_scenarios         pass\n  scorecard_accuracy           pass\n  revision_hygiene             pass\n  cadence                      pass\n25 pass, 0 fail, 0 missing of 25 checks across six sections."
}
```

### 2. Violations — `violations` (recorded HTTP 200)

Input:

```json
{
  "range": {
    "low": 120,
    "base": 100,
    "high": 110
  },
  "scorecard": {
    "history": [
      {
        "period": "2025-Q4",
        "forecast": 200,
        "actual": 100
      }
    ],
    "declared_mae": 0.0,
    "declared_mape_percent": 0.0,
    "declared_bias": 0.0
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "forecast-with-ranges-and-scorecard",
  "atom_version": "0.1.0",
  "series": null,
  "verdict": "FORECAST_NOT_READY",
  "sections": {
    "purpose_and_horizon": "insufficient_evidence",
    "baselines_and_decomposition": "insufficient_evidence",
    "ranges_and_scenarios": "fail",
    "scorecard_accuracy": "fail",
    "revision_hygiene": "insufficient_evidence",
    "cadence": "insufficient_evidence"
  },
  "checks": [
    {
      "section": "purpose_and_horizon",
      "check": "purpose_stated",
      "status": "missing",
      "evidence": "purpose stated: what decision this forecast feeds"
    },
    {
      "section": "purpose_and_horizon",
      "check": "horizon_stated",
      "status": "missing",
      "evidence": "horizon stated: operational (weeks) vs strategic (years)"
    },
    {
      "section": "purpose_and_horizon",
      "check": "forecast_matched_to_decision_cadence",
      "status": "missing",
      "evidence": "forecast to the decision cadence — daily forecasts for daily decisions"
    },
    {
      "section": "purpose_and_horizon",
      "check": "owner_named",
      "status": "missing",
      "evidence": "red line: no forecasts without owners"
    },
    {
      "section": "baselines_and_decomposition",
      "check": "baselines_computed_and_shown",
      "status": "missing",
      "evidence": "baseline methods always: naive, moving average and seasonal-naive — computed and shown"
    },
    {
      "section": "baselines_and_decomposition",
      "check": "baseline_compared_to_forecast",
      "status": "missing",
      "evidence": "quality gate: baseline computed and compared"
    },
    {
      "section": "baselines_and_decomposition",
      "check": "complex_model_beats_baselines",
      "status": "missing",
      "evidence": "no complex model declared — beating the baselines is not required"
    },
    {
      "section": "baselines_and_decomposition",
      "check": "decomposition_shown",
      "status": "missing",
      "evidence": "decompose: level / trend / seasonality shown"
    },
    {
      "section": "baselines_and_decomposition",
      "check": "driver_based_when_drivers_known",
      "status": "missing",
      "evidence": "no known drivers declared — a driver-based forecast is not required"
    },
    {
      "section": "ranges_and_scenarios",
      "check": "range_ordered_and_nondegenerate",
      "status": "fail",
      "evidence": "ranges, not points: low <= base <= high with low < high — a bare point is false precision"
    },
    {
      "section": "ranges_and_scenarios",
      "check": "scenarios_cover_base_best_worst",
      "status": "missing",
      "evidence": "no scenarios declared"
    },
    {
      "section": "ranges_and_scenarios",
      "check": "scenario_triggers_documented",
      "status": "missing",
      "evidence": "no scenarios declared"
    },
    {
      "section": "ranges_and_scenarios",
      "check": "sensitivity_shown",
      "status": "missing",
      "evidence": "scenario & sensitivity: sensitivity of the forecast to its drivers shown"
    },
    {
      "section": "scorecard_accuracy",
      "check": "scorecard_published",
      "status": "missing",
      "evidence": "publish scorecards so trust is earned"
    },
    {
      "section": "scorecard_accuracy",
      "check": "accuracy_tracked_per_series",
      "status": "missing",
      "evidence": "quality gate: accuracy tracked per series with a scorecard"
    },
    {
      "section": "scorecard_accuracy",
      "check": "history_entries_complete",
      "status": "pass",
      "evidence": "every history entry carries a period, a forecast, and an actual"
    },
    {
      "section": "scorecard_accuracy",
      "check": "declared_mae_matches_computed",
      "status": "fail",
      "evidence": "accuracy tracking: the declared MAE agrees with the MAE recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals)"
    },
    {
      "section": "scorecard_accuracy",
      "check": "declared_mape_matches_computed",
      "status": "fail",
      "evidence": "accuracy tracking: the declared MAPE (percent) agrees with the MAPE (percent) recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals)"
    },
    {
      "section": "scorecard_accuracy",
      "check": "declared_bias_matches_computed",
      "status": "fail",
      "evidence": "accuracy tracking: the declared bias (mean signed error, forecast - actual) agrees with the bias (mean signed error, forecast - actual) recomputed from the forecast-vs-actual history (within 0.01, the declared value rounded to two decimals)"
    },
    {
      "section": "revision_hygiene",
      "check": "forecast_actual_history_preserved",
      "status": "missing",
      "evidence": "revision hygiene: keep forecast-vs-actual history"
    },
    {
      "section": "revision_hygiene",
      "check": "revision_reasons_documented",
      "status": "missing",
      "evidence": "no revisions declared"
    },
    {
      "section": "revision_hygiene",
      "check": "no_silent_restatement",
      "status": "missing",
      "evidence": "red line: no hindsight edits — never silently restate old forecasts"
    },
    {
      "section": "cadence",
      "check": "rolling_forecast_maintained",
      "status": "missing",
      "evidence": "monthly rolling forecasts (12-month) typical; weekly for operations; annual for strategy"
    },
    {
      "section": "cadence",
      "check": "cadence_matches_review_rhythm",
      "status": "missing",
      "evidence": "cadence matched to the review rhythm"
    },
    {
      "section": "cadence",
      "check": "forecast_updated_on_cadence",
      "status": "missing",
      "evidence": "the forecast is actually updated on its declared cadence"
    }
  ],
  "history_entries_evaluated": 1,
  "scenarios_evaluated": 0,
  "summary": "1 pass, 4 fail, 20 missing of 25 checks across six sections.",
  "stamp": "FORECAST WITH RANGES AND SCORECARD\nseries: None\nVERDICT: FORECAST_NOT_READY\n  purpose_and_horizon          insufficient_evidence\n  baselines_and_decomposition  insufficient_evidence\n  ranges_and_scenarios         fail\n  scorecard_accuracy           fail\n  revision_hygiene             insufficient_evidence\n  cadence                      insufficient_evidence\n1 pass, 4 fail, 20 missing of 25 checks across six sections."
}
```

### 3. Malformed — `malformed` (recorded HTTP 422)

Input:

```json
{
  "baselines": {
    "naive_value": "not_a_number",
    "moving_average_value": 100,
    "seasonal_naive_value": 100
  }
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "baselines.naive_value",
  "detail": "baselines.naive_value must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Yes — integrators, developers, ops |
| Regulators view | N/A — Not compliance-facing: the verdict is a forecast-artifact readiness judgment, not compliance or audit evidence, and SERVICE.md makes no regulatory claim. |
| Checks named count vs recorded count | 25 / 25 — every check in the recorded full-pass `checks` array is named in the Reference |
| Verdict vocabulary complete | Yes — 3 values listed (FORECAST_READY, FORECAST_NOT_READY, INSUFFICIENT_EVIDENCE), plus section and per-check statuses |
| Input reference typed | Yes — 37 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/forecast-with-ranges-and-scorecard/evidence.json` after writing |
| Output format | CommonMark markdown |

