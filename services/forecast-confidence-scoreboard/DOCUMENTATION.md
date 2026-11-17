# Confidence scoreboard — documentation

**Confidence scoreboard** · slug `forecast-confidence-scoreboard` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples. Note on sources: where SERVICE.md and the recorded response differ, this document follows the recorded response and names the difference — SERVICE.md's status line still reads "built-locally — no endpoint is live", while the recorded battery below was executed against the live gateway v1.1.0 and the header above follows that recorded, live status; and several recorded check names differ from the SERVICE.md field names they read (see the note under Checks).

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `subject` "Q1 2024 Revenue"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "forecast-confidence-scoreboard"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the forecast-confidence manifest.** You declare a record of a forecaster ledger already resolved — the atom audits the record, it does not make any forecast (see Explanation). The recorded full-pass manifest declares the subject `Q1 2024 Revenue`: resolution criteria predeclared, forecasts recorded before resolution, and unresolved forecasts excluded. Its ledger holds two resolved binary forecasts on the claim "Revenue > 1M" — Alice stated probability 0.8, outcome 1; Bob stated probability 0.4, outcome 1. Its published scoreboard carries one row per forecaster with the aggregates recomputed from those rows: Alice — count 1, mean stated probability 0.8, hit rate 1.0, calibration gap 0.2, Brier score 0.04, rank 1; Bob — count 1, mean stated probability 0.4, hit rate 1.0, calibration gap 0.6, Brier score 0.36, rank 2 (lower Brier ranks first). It declares calibration reported per forecaster, outputs as probabilities, calibration reported not just ranking, and the worst forecaster surfaced; the scoreboard's decision stated with its costs considered; and the two honesty red lines absent (`metric_chosen_to_flatter_present: false`, `silent_score_rewrites_present: false`) with scores refreshed as outcomes resolve.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/forecast-confidence-scoreboard` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `CONFIDENCE_SCOREBOARD_SOUND`: "26 pass, 0 fail, 0 missing of 26 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `forecasts_count` is 2, `forecasters_count` is 2, the overall aggregates are `overall_mean_stated_probability` `"0.600000"`, `overall_hit_rate` `"1.000000"`, `overall_calibration_gap` `"0.400000"` and `overall_brier_score` `"0.200000"`, `calibration_direction` is `underconfident`, `worst_calibrated_forecaster` is `Bob`, and all four row-name lists are empty.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and its published scoreboard is the scoreboard of its own ledger — nothing more (see Explanation for what the atom does not certify). If the verdict had been `CONFIDENCE_SCOREBOARD_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "forecast-confidence-scoreboard"}`.
3. Call: `POST https://atoms.pipavia.com/v1/forecast-confidence-scoreboard` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/forecast-confidence-scoreboard` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `forecast_confidence_scoreboard`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `CONFIDENCE_SCOREBOARD_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 1 check fails: `every_scoreboard_forecast_count_matches_ledger`, and the summary reads "25 pass, 1 fail, 0 missing of 26 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, the scoreboard declares `forecasts_count` 99 for Alice while the ledger contains 1 row for her, so `mismatched_scoreboard_rows` names `Alice`; the section `per_forecaster_scoring` reports `fail`, the other four sections `pass`, and the remaining computed outputs are `forecasts_count` 1, `forecasters_count` 1, `overall_mean_stated_probability` `"0.800000"`, `overall_hit_rate` `"1.000000"`, `overall_calibration_gap` `"0.200000"`, `overall_brier_score` `"0.040000"`, `calibration_direction` `underconfident`, `worst_calibrated_forecaster` `Alice`, with `computed_status` `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "forecasts",
  "detail": "forecasts must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/forecast-confidence-scoreboard` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/forecast-confidence-scoreboard` — tool name `forecast_confidence_scoreboard`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `forecast_confidence_scoreboard` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `CONFIDENCE_SCOREBOARD_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `subject` | string | Carried into the verdict output, not itself checked |

#### Read by: ledger_and_resolution

| Field | Type | Notes |
|---|---|---|
| `record` | object | The record section object — a present non-object value is rejected before evaluation |
| `record.resolution_criteria_predeclared` | boolean | — |
| `record.forecasts_recorded_before_resolution` | boolean | — |
| `record.unresolved_forecasts_excluded` | boolean | — |
| `forecasts` | list | list of forecast-row objects, each with the entry fields below; computed, see below; also read by per_forecaster_scoring, calibration_reporting and ranking_integrity |
| `forecasts[]` | object | One declared forecast row — a present non-object entry is rejected before evaluation |
| `forecasts[].forecaster` | string | Names the row's forecaster in the computed outputs; must be a non-empty string for the row to pass the computed forecaster check |
| `forecasts[].claim` | string | The claim that was predicted; must be a non-empty string for the row to pass the computed claim check |
| `forecasts[].stated_probability` | number | Must lie in [0, 1] for the row to pass the computed probability check and to enter any aggregate |
| `forecasts[].outcome` | number | Must be exactly 0 or 1 for the row to pass the computed outcome check and to enter any aggregate |

#### Read by: per_forecaster_scoring

| Field | Type | Notes |
|---|---|---|
| `scoreboard` | list | list of scoreboard-row objects, each with the entry fields below; computed, see below; also read by calibration_reporting and ranking_integrity |
| `scoreboard[]` | object | One declared scoreboard row — a present non-object entry is rejected before evaluation |
| `scoreboard[].forecaster` | string | Names the row's forecaster; also read by calibration_reporting and ranking_integrity |
| `scoreboard[].forecasts_count` | number | Recomputed as the count of ledger rows naming this forecaster |
| `scoreboard[].mean_stated_probability` | number | Recomputed as the mean of this forecaster's stated probabilities |
| `scoreboard[].hit_rate` | number | Recomputed as the mean of this forecaster's outcomes |
| `scoreboard[].brier_score` | number | Recomputed as the mean of (stated probability − outcome)² for this forecaster; also read by ranking_integrity |

#### Read by: calibration_reporting

| Field | Type | Notes |
|---|---|---|
| `scoreboard[].calibration_gap` | number | Recomputed as \|mean stated probability − hit rate\| for this forecaster |
| `confidence_reporting` | object | The confidence-reporting section object — a present non-object value is rejected before evaluation |
| `confidence_reporting.calibration_reported_per_forecaster` | boolean | — |
| `confidence_reporting.outputs_are_probabilities` | boolean | — |
| `confidence_reporting.calibration_reported_not_just_ranking` | boolean | — |
| `confidence_reporting.worst_forecaster_surfaced` | boolean | — |

#### Read by: ranking_integrity

| Field | Type | Notes |
|---|---|---|
| `scoreboard[].rank` | number | Must be integral, the ranks together exactly 1..N, and must follow the recomputed Brier order |

#### Read by: honesty_and_live_use

| Field | Type | Notes |
|---|---|---|
| `scoreboard_use` | object | The scoreboard-use section object — a present non-object value is rejected before evaluation |
| `scoreboard_use.decision_stated` | boolean | — |
| `scoreboard_use.decision_costs_considered` | boolean | — |
| `honesty` | object | The honesty section object — a present non-object value is rejected before evaluation |
| `honesty.metric_chosen_to_flatter_present` | boolean | must be `false` to pass — skill red line |
| `honesty.silent_score_rewrites_present` | boolean | must be `false` to pass — skill red line |
| `honesty.scores_refreshed_as_outcomes_resolve` | boolean | — |

### Checks

All 26 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only; this atom has no conditional (gated) checks — every check is either an attestation check over a single declared boolean or a computed check over the declared rows. Section and verdict aggregation are defined under Verdict vocabulary. Naming note (recorded response governs): several recorded check names differ from the SERVICE.md field names they read — `unresolved_forecasts_excluded_from_scoring` reads `record.unresolved_forecasts_excluded`; `probabilities_reported_not_point_verdicts` reads `confidence_reporting.outputs_are_probabilities`; `worst_calibrated_forecaster_surfaced` reads `confidence_reporting.worst_forecaster_surfaced`; `scoreboard_decision_stated` reads `scoreboard_use.decision_stated`; `no_metric_chosen_to_flatter` reads `honesty.metric_chosen_to_flatter_present`; `no_silent_score_rewrites` reads `honesty.silent_score_rewrites_present`; `live_scores_refreshed_on_resolution` reads `honesty.scores_refreshed_as_outcomes_resolve`. The check names in the tables below are the recorded ones.

#### Section: ledger_and_resolution

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `resolution_criteria_predeclared` | target & decision: the criteria that resolve each claim are declared before outcomes are known | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `forecasts_recorded_before_resolution` | validation without leakage: every forecast is recorded before its outcome resolves — no peeking | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unresolved_forecasts_excluded_from_scoring` | scoreboard honesty: only resolved forecasts are scored — unresolved forecasts are excluded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `forecasts_declared` | the declared record names its resolved forecasts — the forecasts list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_forecast_names_forecaster` | every declared forecast row names its forecaster — a non-empty forecaster string | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_forecast_states_claim` | every declared forecast row states the claim that was predicted — a non-empty claim string | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_forecast_probability_in_range` | probabilities, not fortune-telling: every declared forecast row states a probability inside [0, 1] | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_forecast_outcome_binary` | every declared forecast row records a binary outcome — 0 or 1 | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |

#### Section: per_forecaster_scoring

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `scoreboard_declared` | the declared record publishes its scoreboard — the scoreboard list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `scoreboard_covers_every_forecaster` | the scoreboard covers exactly the forecasters in the ledger — no forecaster omitted, no row without forecasts, no duplicate rows | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_scoreboard_forecast_count_matches_ledger` | every scoreboard row's forecasts_count equals the number of ledger rows naming that forecaster | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. If any ledger entry is not complete and valid for scoring (forecaster, in-range probability, binary outcome), this check cannot be verified and is missing. |
| `every_scoreboard_mean_probability_matches` | every scoreboard row's mean stated probability agrees with the mean recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization) | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. If any ledger entry is not complete and valid for scoring (forecaster, in-range probability, binary outcome), this check cannot be verified and is missing. |
| `every_scoreboard_hit_rate_matches` | every scoreboard row's hit rate agrees with the hit rate recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization) | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. If any ledger entry is not complete and valid for scoring (forecaster, in-range probability, binary outcome), this check cannot be verified and is missing. |
| `every_scoreboard_brier_score_matches` | every scoreboard row's Brier score — mean squared (stated probability - outcome) — agrees with the Brier score recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization) | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. If any ledger entry is not complete and valid for scoring (forecaster, in-range probability, binary outcome), this check cannot be verified and is missing. |

#### Section: calibration_reporting

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `every_scoreboard_calibration_gap_matches` | every scoreboard row's calibration gap — |mean stated probability - hit rate| — agrees with the gap recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization) | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. If any ledger entry is not complete and valid for scoring (forecaster, in-range probability, binary outcome), this check cannot be verified and is missing. |
| `calibration_reported_per_forecaster` | check calibration: calibration is reported per forecaster, not only in aggregate | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `probabilities_reported_not_point_verdicts` | probabilities, not fortune-telling: the scoreboard reports stated probabilities, not bare point verdicts | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `calibration_reported_not_just_ranking` | check calibration — not just ranking ability: calibration is reported alongside any ranking | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `worst_calibrated_forecaster_surfaced` | segment errors — the worst cohort is the story: the worst-calibrated forecaster is surfaced, not hidden in the aggregate | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: ranking_integrity

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `scoreboard_ranks_complete_and_unique` | the published ranks are exactly 1..N over the scoreboard rows — complete, unique, integral | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. If any ledger entry is not complete and valid for scoring (forecaster, in-range probability, binary outcome), this check cannot be verified and is missing. |
| `scoreboard_ranking_matches_brier_order` | the published ranking follows the recomputed Brier order — lower Brier ranks first, ties break by forecaster name ascending | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. If any ledger entry is not complete and valid for scoring (forecaster, in-range probability, binary outcome), this check cannot be verified and is missing. |

#### Section: honesty_and_live_use

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `scoreboard_decision_stated` | target & decision: the decision this scoreboard drives — whose forecasts get trusted or weighted — is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `decision_costs_considered` | target & decision: the metric is chosen from the decision's costs — false positives vs false negatives rarely cost the same | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_metric_chosen_to_flatter` | red line: no metric-chosen-to-flatter — the published score is not selected to flatter a forecaster | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_silent_score_rewrites` | red line: no silent updates — published scores are never silently rewritten after resolution | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `live_scores_refreshed_on_resolution` | drift & loops: monitor live performance — scores are refreshed as new outcomes resolve | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"forecast-confidence-scoreboard"`), `atom_version` (`"0.1.0"`), and `subject` (the manifest's declared subject value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `forecasts_count` (the declared ledger length as an integer, or null when the list is not declared) and `forecasters_count` (distinct non-empty forecaster names in the ledger, or null); the overall aggregates `overall_mean_stated_probability`, `overall_hit_rate`, `overall_calibration_gap` and `overall_brier_score` (computed over the stats-valid ledger entries — entries with a forecaster, an in-range probability and a binary outcome); `calibration_direction` and `worst_calibrated_forecaster` (see Verdict vocabulary); and the name lists `forecasters_without_scoreboard_row` and `scoreboard_rows_without_forecasts` (null when either list is not declared), `mismatched_scoreboard_rows` (scoreboard rows whose present count or aggregate fields disagree with the recomputed values; null when either list is not declared) and `forecasters_with_wrong_rank` (null when the ranking cannot be recomputed). The overall aggregates are strings with exactly six decimal places, and are null when there are no stats-valid entries. Aggregates use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical; declared-vs-recomputed agreement is judged on the serialized values and other comparisons use the unrounded values.
- `summary` — a one-line count, e.g. "26 pass, 0 fail, 0 missing of 26 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared subject value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `CONFIDENCE_SCOREBOARD_SOUND` — all 26 checks pass: the declared forecast-confidence record is complete and its published scoreboard is the scoreboard of its own ledger.
- `CONFIDENCE_SCOREBOARD_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the fourteen primary computed checks cannot be completed because the rows or fields it reads are absent.

**`calibration_direction`**: `overconfident` when the overall mean stated probability exceeds the hit rate, `underconfident` when it falls below, `exact` when equal, `null` when there are no stats-valid entries — reported, never failed. **`worst_calibrated_forecaster`**: the forecaster with the highest per-forecaster calibration gap; ties break to the first name in ascending order; `null` when no forecaster has a stats-valid entry.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the forecast_confidence_scoreboard scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the forecast_confidence_scoreboard scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"forecasts","detail":"forecasts must be a list"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for forecast-confidence-scoreboard exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = query (one query = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Predict with models honestly — baselines, leakage-free validation, calibration, drift awareness (the bound capability, from the `prediction` skill). You submit one declared record — the forecast-confidence manifest: a ledger of resolved binary probabilistic forecasts by named human forecasters, each claim with the probability its forecaster stated before resolution and its binary outcome, plus the published per-forecaster scoreboard over that ledger — and the atom audits that record for completeness and internal consistency against the bound skill's checklist and red lines, recomputing every per-forecaster aggregate and the ranking from the ledger, returning one deterministic verdict across 5 sections (`ledger_and_resolution`, `per_forecaster_scoring`, `calibration_reporting`, `ranking_integrity`, `honesty_and_live_use`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `forecasts` list must be present and non-empty with every row naming a non-empty `forecaster`, stating a non-empty `claim`, stating a `stated_probability` inside [0, 1] and recording an `outcome` of exactly 0 or 1; the declared `scoreboard` list must be present and non-empty, cover exactly the forecasters in the ledger with no duplicate rows, and every row's `forecasts_count`, `mean_stated_probability`, `hit_rate`, `calibration_gap` and `brier_score` must agree with the values recomputed from that forecaster's ledger rows at the fixed 6-decimal serialization; and the published `rank` values must be exactly 1..N and follow the recomputed Brier order (lower Brier ranks first; ties break by forecaster name, ascending) — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `CONFIDENCE_SCOREBOARD_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `CONFIDENCE_SCOREBOARD_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a tolerated calibration gap (the skill states no band around its illustrative "when it says 70%, it should be right ~70%" — the gap is computed and reported per forecaster, never failed); a Brier-score pass bar; a hit-rate or accuracy bar; a minimum number of forecasts per forecaster for inclusion or ranking (small samples score and rank like any other, with their counts published); a probability-bucket / binning scheme for calibration (calibration here is per forecaster over the stated probabilities themselves, not over bins); an overconfidence gap bar (the direction is reported, never failed); a rank-separation or significance margin (tied Brier scores rank by the stated name tiebreak); a recency window or drift threshold for the ledger (refresh on resolution is a caller attestation only); and a false-positive / false-negative cost ratio (caller attestation only). Quantities are computed and reported; the only bars on the computed rows are completeness over the caller's own declared rows and agreement between the published scoreboard and its own ledger.

**What it does NOT do.** The atom scores a **declared** forecast-confidence record: a verdict of `CONFIDENCE_SCOREBOARD_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares predeclared resolution criteria, forecasts recorded before resolution, and a scoreboard whose aggregates match its ledger passes those checks even if the real ledger was written after the fact. It is a completeness and consistency audit of the record the skill requires, **not a forecasting service, not a forecaster certification, and not a judgment that any forecaster is good**. Specifically: it resolves no claim itself, reads no outcome source, verifies no timestamp, and does not verify that a declared control actually works. It never judges whether a stated probability was wise, whether a claim was worth predicting, whether the resolution criteria were fair, or whether the best-ranked forecaster will stay best — only that the record contains what the skill's sections and red lines demand, and that its published scores are the scores of its declared rows. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no forecast is produced and no probability is supplied or corrected; no numeric (non-binary) outcome scoring — that is the sibling `forecast-with-ranges-and-scorecard`'s MAE / MAPE / bias ground, deliberately not re-entered here (this atom shares no check, no field and no computed quantity with that sibling, and never reads a baseline value, a range, a scenario, or a numeric forecast-vs-actual pair); no model validation — features, splits, holdouts and model calibration tolerances are the ML-model audit's (`prediction-model-leakage-calibration-audit`) ground, deliberately not re-entered here; no live verification of any declared fact (record-before-resolution and predeclared criteria are caller declarations, the atom reads no clock and no resolution source); no bucketed calibration curve — the skill states no binning scheme, so none is imposed.

**Buyer and use context.** Teams and agents working in Thinking & decisions who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: scoring our own product forecasts (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared forecaster ledger and its published scoreboard; its verdict is a method/artifact-readiness judgment on the declared evidence — whether the record is complete and its published scores are the scores of its own ledger — not compliance or audit evidence in a regulated domain, and not a forecaster certification (SERVICE.md states this explicitly; precedent: the sibling `forecast-with-ranges-and-scorecard` is likewise N/A). No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `forecast_confidence_scoreboard` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios and scores are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/forecast_confidence_scoreboard.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_forecast_confidence_scoreboard.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/forecast-confidence-scoreboard` (REST) and `POST /mcp/forecast-confidence-scoreboard` (MCP, tool `forecast_confidence_scoreboard`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `forecast_confidence_scoreboard`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T05:39:37.716850+00:00 against gateway v1.1.0, external verification lane, source `verification/work/forecast-confidence-scoreboard/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "subject": "Q1 2024 Revenue",
  "record": {
    "resolution_criteria_predeclared": true,
    "forecasts_recorded_before_resolution": true,
    "unresolved_forecasts_excluded": true
  },
  "forecasts": [
    {
      "forecaster": "Alice",
      "claim": "Revenue > 1M",
      "stated_probability": 0.8,
      "outcome": 1
    },
    {
      "forecaster": "Bob",
      "claim": "Revenue > 1M",
      "stated_probability": 0.4,
      "outcome": 1
    }
  ],
  "scoreboard": [
    {
      "forecaster": "Alice",
      "forecasts_count": 1,
      "mean_stated_probability": 0.8,
      "hit_rate": 1.0,
      "calibration_gap": 0.2,
      "brier_score": 0.04,
      "rank": 1
    },
    {
      "forecaster": "Bob",
      "forecasts_count": 1,
      "mean_stated_probability": 0.4,
      "hit_rate": 1.0,
      "calibration_gap": 0.6,
      "brier_score": 0.36,
      "rank": 2
    }
  ],
  "confidence_reporting": {
    "calibration_reported_per_forecaster": true,
    "outputs_are_probabilities": true,
    "calibration_reported_not_just_ranking": true,
    "worst_forecaster_surfaced": true
  },
  "scoreboard_use": {
    "decision_stated": true,
    "decision_costs_considered": true
  },
  "honesty": {
    "metric_chosen_to_flatter_present": false,
    "silent_score_rewrites_present": false,
    "scores_refreshed_as_outcomes_resolve": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "forecast-confidence-scoreboard",
  "atom_version": "0.1.0",
  "subject": "Q1 2024 Revenue",
  "verdict": "CONFIDENCE_SCOREBOARD_SOUND",
  "sections": {
    "ledger_and_resolution": "pass",
    "per_forecaster_scoring": "pass",
    "calibration_reporting": "pass",
    "ranking_integrity": "pass",
    "honesty_and_live_use": "pass"
  },
  "checks": [
    {
      "section": "ledger_and_resolution",
      "check": "resolution_criteria_predeclared",
      "status": "pass",
      "evidence": "target & decision: the criteria that resolve each claim are declared before outcomes are known"
    },
    {
      "section": "ledger_and_resolution",
      "check": "forecasts_recorded_before_resolution",
      "status": "pass",
      "evidence": "validation without leakage: every forecast is recorded before its outcome resolves — no peeking"
    },
    {
      "section": "ledger_and_resolution",
      "check": "unresolved_forecasts_excluded_from_scoring",
      "status": "pass",
      "evidence": "scoreboard honesty: only resolved forecasts are scored — unresolved forecasts are excluded"
    },
    {
      "section": "ledger_and_resolution",
      "check": "forecasts_declared",
      "status": "pass",
      "evidence": "the declared record names its resolved forecasts — the forecasts list is present and non-empty"
    },
    {
      "section": "ledger_and_resolution",
      "check": "every_forecast_names_forecaster",
      "status": "pass",
      "evidence": "every declared forecast row names its forecaster — a non-empty forecaster string"
    },
    {
      "section": "ledger_and_resolution",
      "check": "every_forecast_states_claim",
      "status": "pass",
      "evidence": "every declared forecast row states the claim that was predicted — a non-empty claim string"
    },
    {
      "section": "ledger_and_resolution",
      "check": "every_forecast_probability_in_range",
      "status": "pass",
      "evidence": "probabilities, not fortune-telling: every declared forecast row states a probability inside [0, 1]"
    },
    {
      "section": "ledger_and_resolution",
      "check": "every_forecast_outcome_binary",
      "status": "pass",
      "evidence": "every declared forecast row records a binary outcome — 0 or 1"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "scoreboard_declared",
      "status": "pass",
      "evidence": "the declared record publishes its scoreboard — the scoreboard list is present and non-empty"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "scoreboard_covers_every_forecaster",
      "status": "pass",
      "evidence": "the scoreboard covers exactly the forecasters in the ledger — no forecaster omitted, no row without forecasts, no duplicate rows"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "every_scoreboard_forecast_count_matches_ledger",
      "status": "pass",
      "evidence": "every scoreboard row's forecasts_count equals the number of ledger rows naming that forecaster"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "every_scoreboard_mean_probability_matches",
      "status": "pass",
      "evidence": "every scoreboard row's mean stated probability agrees with the mean recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "every_scoreboard_hit_rate_matches",
      "status": "pass",
      "evidence": "every scoreboard row's hit rate agrees with the hit rate recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "every_scoreboard_brier_score_matches",
      "status": "pass",
      "evidence": "every scoreboard row's Brier score — mean squared (stated probability - outcome) — agrees with the Brier score recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)"
    },
    {
      "section": "calibration_reporting",
      "check": "every_scoreboard_calibration_gap_matches",
      "status": "pass",
      "evidence": "every scoreboard row's calibration gap — |mean stated probability - hit rate| — agrees with the gap recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)"
    },
    {
      "section": "calibration_reporting",
      "check": "calibration_reported_per_forecaster",
      "status": "pass",
      "evidence": "check calibration: calibration is reported per forecaster, not only in aggregate"
    },
    {
      "section": "calibration_reporting",
      "check": "probabilities_reported_not_point_verdicts",
      "status": "pass",
      "evidence": "probabilities, not fortune-telling: the scoreboard reports stated probabilities, not bare point verdicts"
    },
    {
      "section": "calibration_reporting",
      "check": "calibration_reported_not_just_ranking",
      "status": "pass",
      "evidence": "check calibration — not just ranking ability: calibration is reported alongside any ranking"
    },
    {
      "section": "calibration_reporting",
      "check": "worst_calibrated_forecaster_surfaced",
      "status": "pass",
      "evidence": "segment errors — the worst cohort is the story: the worst-calibrated forecaster is surfaced, not hidden in the aggregate"
    },
    {
      "section": "ranking_integrity",
      "check": "scoreboard_ranks_complete_and_unique",
      "status": "pass",
      "evidence": "the published ranks are exactly 1..N over the scoreboard rows — complete, unique, integral"
    },
    {
      "section": "ranking_integrity",
      "check": "scoreboard_ranking_matches_brier_order",
      "status": "pass",
      "evidence": "the published ranking follows the recomputed Brier order — lower Brier ranks first, ties break by forecaster name ascending"
    },
    {
      "section": "honesty_and_live_use",
      "check": "scoreboard_decision_stated",
      "status": "pass",
      "evidence": "target & decision: the decision this scoreboard drives — whose forecasts get trusted or weighted — is stated"
    },
    {
      "section": "honesty_and_live_use",
      "check": "decision_costs_considered",
      "status": "pass",
      "evidence": "target & decision: the metric is chosen from the decision's costs — false positives vs false negatives rarely cost the same"
    },
    {
      "section": "honesty_and_live_use",
      "check": "no_metric_chosen_to_flatter",
      "status": "pass",
      "evidence": "red line: no metric-chosen-to-flatter — the published score is not selected to flatter a forecaster"
    },
    {
      "section": "honesty_and_live_use",
      "check": "no_silent_score_rewrites",
      "status": "pass",
      "evidence": "red line: no silent updates — published scores are never silently rewritten after resolution"
    },
    {
      "section": "honesty_and_live_use",
      "check": "live_scores_refreshed_on_resolution",
      "status": "pass",
      "evidence": "drift & loops: monitor live performance — scores are refreshed as new outcomes resolve"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "forecasts_count": 2,
  "forecasters_count": 2,
  "overall_mean_stated_probability": "0.600000",
  "overall_hit_rate": "1.000000",
  "overall_calibration_gap": "0.400000",
  "overall_brier_score": "0.200000",
  "calibration_direction": "underconfident",
  "worst_calibrated_forecaster": "Bob",
  "forecasters_without_scoreboard_row": [],
  "scoreboard_rows_without_forecasts": [],
  "mismatched_scoreboard_rows": [],
  "forecasters_with_wrong_rank": [],
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across five sections.",
  "stamp": "FORECAST CONFIDENCE SCOREBOARD\nsubject: Q1 2024 Revenue\nVERDICT: CONFIDENCE_SCOREBOARD_SOUND\n  ledger_and_resolution        pass\n  per_forecaster_scoring       pass\n  calibration_reporting        pass\n  ranking_integrity            pass\n  honesty_and_live_use         pass\n26 pass, 0 fail, 0 missing of 26 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "subject": "Q1 2024 Revenue",
  "record": {
    "resolution_criteria_predeclared": true,
    "forecasts_recorded_before_resolution": true,
    "unresolved_forecasts_excluded": true
  },
  "forecasts": [
    {
      "forecaster": "Alice",
      "claim": "Revenue > 1M",
      "stated_probability": 0.8,
      "outcome": 1
    }
  ],
  "scoreboard": [
    {
      "forecaster": "Alice",
      "forecasts_count": 99,
      "mean_stated_probability": 0.8,
      "hit_rate": 1.0,
      "calibration_gap": 0.2,
      "brier_score": 0.04,
      "rank": 1
    }
  ],
  "confidence_reporting": {
    "calibration_reported_per_forecaster": true,
    "outputs_are_probabilities": true,
    "calibration_reported_not_just_ranking": true,
    "worst_forecaster_surfaced": true
  },
  "scoreboard_use": {
    "decision_stated": true,
    "decision_costs_considered": true
  },
  "honesty": {
    "metric_chosen_to_flatter_present": false,
    "silent_score_rewrites_present": false,
    "scores_refreshed_as_outcomes_resolve": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "forecast-confidence-scoreboard",
  "atom_version": "0.1.0",
  "subject": "Q1 2024 Revenue",
  "verdict": "CONFIDENCE_SCOREBOARD_NOT_SOUND",
  "sections": {
    "ledger_and_resolution": "pass",
    "per_forecaster_scoring": "fail",
    "calibration_reporting": "pass",
    "ranking_integrity": "pass",
    "honesty_and_live_use": "pass"
  },
  "checks": [
    {
      "section": "ledger_and_resolution",
      "check": "resolution_criteria_predeclared",
      "status": "pass",
      "evidence": "target & decision: the criteria that resolve each claim are declared before outcomes are known"
    },
    {
      "section": "ledger_and_resolution",
      "check": "forecasts_recorded_before_resolution",
      "status": "pass",
      "evidence": "validation without leakage: every forecast is recorded before its outcome resolves — no peeking"
    },
    {
      "section": "ledger_and_resolution",
      "check": "unresolved_forecasts_excluded_from_scoring",
      "status": "pass",
      "evidence": "scoreboard honesty: only resolved forecasts are scored — unresolved forecasts are excluded"
    },
    {
      "section": "ledger_and_resolution",
      "check": "forecasts_declared",
      "status": "pass",
      "evidence": "the declared record names its resolved forecasts — the forecasts list is present and non-empty"
    },
    {
      "section": "ledger_and_resolution",
      "check": "every_forecast_names_forecaster",
      "status": "pass",
      "evidence": "every declared forecast row names its forecaster — a non-empty forecaster string"
    },
    {
      "section": "ledger_and_resolution",
      "check": "every_forecast_states_claim",
      "status": "pass",
      "evidence": "every declared forecast row states the claim that was predicted — a non-empty claim string"
    },
    {
      "section": "ledger_and_resolution",
      "check": "every_forecast_probability_in_range",
      "status": "pass",
      "evidence": "probabilities, not fortune-telling: every declared forecast row states a probability inside [0, 1]"
    },
    {
      "section": "ledger_and_resolution",
      "check": "every_forecast_outcome_binary",
      "status": "pass",
      "evidence": "every declared forecast row records a binary outcome — 0 or 1"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "scoreboard_declared",
      "status": "pass",
      "evidence": "the declared record publishes its scoreboard — the scoreboard list is present and non-empty"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "scoreboard_covers_every_forecaster",
      "status": "pass",
      "evidence": "the scoreboard covers exactly the forecasters in the ledger — no forecaster omitted, no row without forecasts, no duplicate rows"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "every_scoreboard_forecast_count_matches_ledger",
      "status": "fail",
      "evidence": "every scoreboard row's forecasts_count equals the number of ledger rows naming that forecaster"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "every_scoreboard_mean_probability_matches",
      "status": "pass",
      "evidence": "every scoreboard row's mean stated probability agrees with the mean recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "every_scoreboard_hit_rate_matches",
      "status": "pass",
      "evidence": "every scoreboard row's hit rate agrees with the hit rate recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)"
    },
    {
      "section": "per_forecaster_scoring",
      "check": "every_scoreboard_brier_score_matches",
      "status": "pass",
      "evidence": "every scoreboard row's Brier score — mean squared (stated probability - outcome) — agrees with the Brier score recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)"
    },
    {
      "section": "calibration_reporting",
      "check": "every_scoreboard_calibration_gap_matches",
      "status": "pass",
      "evidence": "every scoreboard row's calibration gap — |mean stated probability - hit rate| — agrees with the gap recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)"
    },
    {
      "section": "calibration_reporting",
      "check": "calibration_reported_per_forecaster",
      "status": "pass",
      "evidence": "check calibration: calibration is reported per forecaster, not only in aggregate"
    },
    {
      "section": "calibration_reporting",
      "check": "probabilities_reported_not_point_verdicts",
      "status": "pass",
      "evidence": "probabilities, not fortune-telling: the scoreboard reports stated probabilities, not bare point verdicts"
    },
    {
      "section": "calibration_reporting",
      "check": "calibration_reported_not_just_ranking",
      "status": "pass",
      "evidence": "check calibration — not just ranking ability: calibration is reported alongside any ranking"
    },
    {
      "section": "calibration_reporting",
      "check": "worst_calibrated_forecaster_surfaced",
      "status": "pass",
      "evidence": "segment errors — the worst cohort is the story: the worst-calibrated forecaster is surfaced, not hidden in the aggregate"
    },
    {
      "section": "ranking_integrity",
      "check": "scoreboard_ranks_complete_and_unique",
      "status": "pass",
      "evidence": "the published ranks are exactly 1..N over the scoreboard rows — complete, unique, integral"
    },
    {
      "section": "ranking_integrity",
      "check": "scoreboard_ranking_matches_brier_order",
      "status": "pass",
      "evidence": "the published ranking follows the recomputed Brier order — lower Brier ranks first, ties break by forecaster name ascending"
    },
    {
      "section": "honesty_and_live_use",
      "check": "scoreboard_decision_stated",
      "status": "pass",
      "evidence": "target & decision: the decision this scoreboard drives — whose forecasts get trusted or weighted — is stated"
    },
    {
      "section": "honesty_and_live_use",
      "check": "decision_costs_considered",
      "status": "pass",
      "evidence": "target & decision: the metric is chosen from the decision's costs — false positives vs false negatives rarely cost the same"
    },
    {
      "section": "honesty_and_live_use",
      "check": "no_metric_chosen_to_flatter",
      "status": "pass",
      "evidence": "red line: no metric-chosen-to-flatter — the published score is not selected to flatter a forecaster"
    },
    {
      "section": "honesty_and_live_use",
      "check": "no_silent_score_rewrites",
      "status": "pass",
      "evidence": "red line: no silent updates — published scores are never silently rewritten after resolution"
    },
    {
      "section": "honesty_and_live_use",
      "check": "live_scores_refreshed_on_resolution",
      "status": "pass",
      "evidence": "drift & loops: monitor live performance — scores are refreshed as new outcomes resolve"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "forecasts_count": 1,
  "forecasters_count": 1,
  "overall_mean_stated_probability": "0.800000",
  "overall_hit_rate": "1.000000",
  "overall_calibration_gap": "0.200000",
  "overall_brier_score": "0.040000",
  "calibration_direction": "underconfident",
  "worst_calibrated_forecaster": "Alice",
  "forecasters_without_scoreboard_row": [],
  "scoreboard_rows_without_forecasts": [],
  "mismatched_scoreboard_rows": [
    "Alice"
  ],
  "forecasters_with_wrong_rank": [],
  "summary": "25 pass, 1 fail, 0 missing of 26 checks across five sections.",
  "stamp": "FORECAST CONFIDENCE SCOREBOARD\nsubject: Q1 2024 Revenue\nVERDICT: CONFIDENCE_SCOREBOARD_NOT_SOUND\n  ledger_and_resolution        pass\n  per_forecaster_scoring       fail\n  calibration_reporting        pass\n  ranking_integrity            pass\n  honesty_and_live_use         pass\n25 pass, 1 fail, 0 missing of 26 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "subject": "Bad Types",
  "forecasts": "not-a-list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "forecasts",
  "detail": "forecasts must be a list"
}
```
