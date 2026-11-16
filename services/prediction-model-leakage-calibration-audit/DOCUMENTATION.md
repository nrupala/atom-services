# Prediction model leakage calibration audit — `prediction-model-leakage-calibration-audit`

**Prediction model leakage calibration audit** · slug `prediction-model-leakage-calibration-audit` · deliverable type: CHECK · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Field table source: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

Bound capability (from SERVICE.md): Predict with models honestly — baselines, leakage-free validation, calibration, drift awareness.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run — the exact request and response are reproduced verbatim under **Worked examples → 1. Full-pass** below, so every number quoted here can be checked against that record.

**Step 1 — Get a key.** Follow the key flow in the How-to below (sign up, mint a session, issue a key for this atom). You send that key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** Build one JSON object for the subject `model` = `test-model-v1`. Fill in every group in the Input reference: absent fields are not neutral — they become missing evidence (or, for the report atom, labeled gaps). Present-but-wrong values are what produce a failing verdict, so declare what is actually true, including the red-line fields that must be `false`.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/prediction-model-leakage-calibration-audit` with the manifest as the body and the Authorization header (full curl in the How-to below).

**Step 4 — Read the verdict.** The recorded call returned HTTP 200 with `verdict: "PREDICTION_AUDIT_SOUND"`, every section `pass`, and the summary: "27 pass, 0 fail, 0 missing of 27 checks across six sections." The `checks` array carries one entry per check (`section`, `check`, `status`, `evidence`), and the `stamp` field is a plain-text rendering of the same verdict for logs and tickets.

**Step 5 — Confirm determinism.** The verification battery called the same manifest twice over REST and once over MCP: the REST repeat was byte-identical and the MCP structured content was equal to the REST result (see TEST-REPORT.md). Same manifest in → same result out is the product property, not a hope.

**Step 6 — Iterate.** If the result is not the passing one, do not resubmit blindly: use the How-to 'Read a failing verdict and fix the manifest' below. Each failing or missing check names the exact field to correct or supply.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "prediction-model-leakage-calibration-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom (USER-GUIDE.md). The contract adds: scope is this atom only — a key for one atom never verifies for another.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -s -X POST https://atoms.pipavia.com/v1/prediction-model-leakage-calibration-audit \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

### Call via MCP

- MCP endpoint: `POST https://atoms.pipavia.com/mcp/prediction-model-leakage-calibration-audit`
- Tool name: `prediction_model_leakage_calibration_audit` (recorded in evidence.json as `mcp_tool_name`; `tools/list` returned HTTP 200).
- Call the tool with `tools/call`; the tool arguments are exactly the input object documented in the Input reference — the same manifest as the REST body, with no wrapper fields of the atom's own.
- MCP and REST are two faces of the same deterministic core: the verification battery's parity case checks that MCP structured content equals the REST result for the full-pass manifest.

### Read a failing verdict and fix the manifest

Use the recorded violations run (Worked examples → 2. Violations) as the pattern. It returned `PREDICTION_AUDIT_UNSOUND` with the summary: "21 pass, 6 fail, 0 missing of 27 checks across six sections."

The checks with `status: "fail"` in that recorded run were:

- `baseline_and_holdout.model_beats_baseline_on_holdout` — evidence: "quality gate: baseline computed; improvement demonstrated on untouched holdout — a model that doesn't beat the baseline doesn't ship"
- `leakage_and_validation.no_random_split_for_temporal_data` — evidence: "skill red line: no random splits for time-series reality — time-based splits for temporal data"
- `leakage_and_validation.features_available_at_prediction_time` — evidence: "every feature is available at or before the declared prediction time — no future information leaks in"
- `leakage_and_validation.no_target_derived_features` — evidence: "no feature is derived from the target itself"
- `calibration_and_evaluation.calibration_within_declared_tolerance` — evidence: "check calibration: |mean predicted − mean observed| over the declared series, within the caller's declared max_tolerated_error — when it says 70%, it should be right ~70%"
- `calibration_and_evaluation.segment_errors_within_declared_max` — evidence: "segment errors reported, not just aggregate — every segment within the caller's declared max_segment_error; the worst cohort is the story"

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
  "field": "model",
  "detail": "model must be a string"
}
```

Fix the field named in `field` (`model`): `detail` says what was expected ("model must be a string"). Correct the type in your manifest — do not delete the field to dodge the error, because an absent field becomes missing evidence / a gap and changes the result — then resubmit. Note the contrast the verification battery was built to enforce: a type-violating field is a 422, while an absent field is evaluated as missing evidence.

## Reference

### Endpoints

| Face | Endpoint | Notes |
|---|---|---|
| REST | `POST https://atoms.pipavia.com/v1/prediction-model-leakage-calibration-audit` | Body = the input object; `Authorization: Bearer <key>` |
| MCP | `POST https://atoms.pipavia.com/mcp/prediction-model-leakage-calibration-audit` | Tool name `prediction_model_leakage_calibration_audit`; `tools/call` arguments = the input object |
| Gateway | `https://atoms.pipavia.com` | Recorded gateway version 1.1.0; health HTTP 200 at evidence time |

> Contract note: `contract.yaml` for this atom lists endpoints `API` and `agent` only, omitting MCP — but the MCP face is live and recorded (tool listed, parity case passed). The contract list is incomplete against the recorded evidence; the MCP endpoint above is the evidenced one.

### Input reference

Types are taken from SERVICE.md's field table: 'All fields are booleans unless noted' — fields with no type note in that table are listed as boolean, and fields with a note carry that note's type. Notes (gates / conditionals / must-be-false and must-be-true conditions) are preserved from SERVICE.md.

#### `model`

| Field | Type | Read by / notes |
|---|---|---|
| `model` | string | carried into the verdict output, not itself checked |

#### `prediction_time`

| Field | Type | Read by / notes |
|---|---|---|
| `prediction_time` | number | Read by: leakage_and_validation; every feature must be available at or before it |

#### `target`

| Field | Type | Read by / notes |
|---|---|---|
| `target.defined` | boolean | Read by: target_and_decision |
| `target.horizon_declared` | boolean | Read by: target_and_decision |
| `target.decision_defined` | boolean | Read by: target_and_decision |
| `target.metric_chosen_from_decision_costs` | boolean | Read by: target_and_decision |

#### `baseline`

| Field | Type | Read by / notes |
|---|---|---|
| `baseline.computed` | boolean | Read by: baseline_and_holdout |
| `baseline.evaluated_on_same_holdout` | boolean | Read by: baseline_and_holdout |

#### `holdout`

| Field | Type | Read by / notes |
|---|---|---|
| `holdout.model_score` | number | Read by: baseline_and_holdout; compared against the baseline by the computed check |
| `holdout.baseline_score` | number | Read by: baseline_and_holdout; see above |
| `holdout.metric_direction` | string: `"lower_is_better"` or `"higher_is_better"` | Read by: baseline_and_holdout; the model must strictly beat the baseline in that direction |
| `holdout.untouched` | boolean | Read by: baseline_and_holdout |

#### `validation`

| Field | Type | Read by / notes |
|---|---|---|
| `validation.split_strategy_documented` | boolean | Read by: leakage_and_validation |
| `validation.temporal_data` | boolean | Read by: leakage_and_validation; with `validation.split_type`; a temporal dataset with a `"random"` split is the red-line fail |
| `validation.split_type` | string, e.g. `"time_based"` | Read by: leakage_and_validation; see above |
| `validation.peeking_at_validation` | boolean | Read by: leakage_and_validation; must be `false` to pass |

#### `features`

| Field | Type | Read by / notes |
|---|---|---|
| `features[]` | list of feature records, see below | Read by: leakage_and_validation |
| `features[].available_at` | number | Read by: leakage_and_validation; must be ≤ `prediction_time` |
| `features[].derived_from_target` | boolean | Read by: leakage_and_validation; must be `false` for every feature |

#### `approach`

| Field | Type | Read by / notes |
|---|---|---|
| `approach.simple_model_tried_first` | boolean | Read by: model_ladder_and_thresholds |
| `approach.complexity_justified` | boolean | Read by: model_ladder_and_thresholds |
| `approach.outputs_probabilities` | boolean | Read by: model_ladder_and_thresholds |
| `approach.action_thresholds_from_decision_costs` | boolean | Read by: model_ladder_and_thresholds |

#### `calibration`

| Field | Type | Read by / notes |
|---|---|---|
| `calibration.reported` | boolean | Read by: calibration_and_evaluation |
| `calibration.max_tolerated_error` | number | Read by: calibration_and_evaluation; the caller's declared tolerance for the computed calibration error |
| `calibration.observations[]` | list of `{predicted, outcome}` records, see below | Read by: calibration_and_evaluation |
| `calibration.observations[].predicted` | number, 0–1: a predicted probability | Read by: calibration_and_evaluation |
| `calibration.observations[].outcome` | number: `0` or `1`, the observed outcome | Read by: calibration_and_evaluation |

#### `evaluation`

| Field | Type | Read by / notes |
|---|---|---|
| `evaluation.segment_errors_reported` | boolean | Read by: calibration_and_evaluation |
| `evaluation.max_segment_error` | number | Read by: calibration_and_evaluation; the caller's declared maximum segment error |
| `evaluation.segments[]` | list of `{name, error}` records, see below | Read by: calibration_and_evaluation |
| `evaluation.segments[].error` | number | Read by: calibration_and_evaluation; must be ≤ `evaluation.max_segment_error` |

#### `drift`

| Field | Type | Read by / notes |
|---|---|---|
| `drift.monitoring_in_place` | boolean | Read by: drift_and_deployment |
| `drift.feedback_loops_identified` | boolean | Read by: drift_and_deployment |
| `drift.retraining_policy_defined` | boolean | Read by: drift_and_deployment |

#### `deployment`

| Field | Type | Read by / notes |
|---|---|---|
| `deployment.versioned_model_and_card` | boolean | Read by: drift_and_deployment |
| `deployment.rollback_path_defined` | boolean | Read by: drift_and_deployment |
| `deployment.silent_updates_in_production` | boolean | Read by: drift_and_deployment; must be `false` to pass |

Input fields documented: 38 (every row of SERVICE.md's field table(s), typed).

### Checks

Ground truth is the `checks` array in the recorded full-pass REST response: **27 checks**, grouped by section as recorded. For each check, the 'requires' column quotes the recorded `evidence` string from that response — it is the atom's own statement of what the check attests.

Per-check status semantics:

- `pass` — the evidence was present and satisfied the check. This includes gated checks that do not apply: they report `pass` with evidence explaining the non-applicability (for example 'no calculator or tool included'); there is no separate not-applicable status in the recorded responses.
- `fail` — the evidence was present but false / invalid, a must-be-false field was true, or a computed check's recomputation disagreed. Any single `fail` produces the failing verdict, regardless of missing checks.
- `missing` — the field (or list, or gate structure) was absent, so the check could not be evaluated. Missing checks never produce the failing verdict on their own; if nothing fails and at least one check is missing, the verdict is `INSUFFICIENT_EVIDENCE`.

The computed checks are: `model_beats_baseline_on_holdout` (the model must strictly beat the baseline on the untouched holdout in the declared `metric_direction`), `features_available_at_prediction_time` (every `features[].available_at` ≤ `prediction_time`), `no_target_derived_features`, `no_random_split_for_temporal_data` (a temporal dataset with a `random` split is the red-line fail), `calibration_within_declared_tolerance` (|mean predicted − mean observed| over `calibration.observations[]` within the caller's `max_tolerated_error`), and `segment_errors_within_declared_max` (every `evaluation.segments[].error` ≤ `max_segment_error`) — six named checks in the recorded response, covering the five computed themes in SERVICE.md, because feature leakage splits into availability and target-derivation. The response also reports `holdout_improvement`, `mean_predicted`, `mean_observed` and `calibration_error` as strings with exactly four decimal places, and `worst_segment` (the segment with the highest error, first such segment on a tie).

#### Section `target_and_decision` — 4 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `target_defined` | what is predicted — the target is defined |
| `prediction_horizon_declared` | the prediction horizon is declared |
| `decision_defined` | the decision the prediction drives is defined |
| `metric_chosen_from_decision_costs` | metric chosen from the decision's costs — false positives vs false negatives rarely cost the same |

#### Section `baseline_and_holdout` — 4 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `baseline_computed` | baseline first: naive rule / historical mean / current heuristic — computed and reported |
| `baseline_evaluated_on_same_holdout` | baseline and model are scored on the same holdout |
| `model_beats_baseline_on_holdout` | quality gate: baseline computed; improvement demonstrated on untouched holdout — a model that doesn't beat the baseline doesn't ship |
| `holdout_untouched` | holdout kept untouched for the final read — no peeking at validation |

#### Section `leakage_and_validation` — 5 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `split_strategy_documented` | quality gate: split strategy documented; temporal leakage explicitly checked |
| `no_random_split_for_temporal_data` | skill red line: no random splits for time-series reality — time-based splits for temporal data |
| `features_available_at_prediction_time` | every feature is available at or before the declared prediction time — no future information leaks in |
| `no_target_derived_features` | no feature is derived from the target itself |
| `no_validation_peeking` | no peeking at validation during model selection |

#### Section `model_ladder_and_thresholds` — 4 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `simple_model_tried_first` | model ladder: simple first (regression, rules, seasonal means) |
| `complexity_justified` | complexity earns its keep in accuracy, explainability, and maintenance cost |
| `outputs_probabilities` | probabilities, not fortune-telling: the model outputs probabilities |
| `thresholds_from_decision_costs` | action thresholds set from decision costs |

#### Section `calibration_and_evaluation` — 4 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `calibration_reported` | quality gate: calibration reported, not just ranking ability |
| `calibration_within_declared_tolerance` | check calibration: /mean predicted − mean observed/ over the declared series, within the caller's declared max_tolerated_error — when it says 70%, it should be right ~70% |
| `segment_errors_reported` | quality gate: segment errors reported, not just aggregate |
| `segment_errors_within_declared_max` | segment errors reported, not just aggregate — every segment within the caller's declared max_segment_error; the worst cohort is the story |

#### Section `drift_and_deployment` — 6 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `drift_monitoring_in_place` | quality gate: monitor input drift and live performance |
| `feedback_loops_identified` | feedback loops identified — predictions change behavior change data |
| `retraining_policy_defined` | quality gate: retrain policy in place before relying on the model |
| `versioned_model_and_card` | deploy carefully: versioned model + card |
| `rollback_path_defined` | rollout with monitoring and a rollback path |
| `no_silent_model_updates` | skill red line: no silent model updates in production |

### Output format

A JSON object (the REST body and the MCP structured content are the same shape):

- `service` (string, `"prediction-model-leakage-calibration-audit"`) and `atom_version` (string, `"0.1.0"`)
- `model` — the subject value carried through from the manifest
- `verdict` — one of the verdict values below
- `sections` — an object mapping each section name to its section status (see Verdict vocabulary)
- `checks` — an array of `{section, check, status, evidence}` objects, in section order, covering every check
- Computed count / value fields recorded in the full-pass response: `holdout_improvement`, `mean_predicted`, `mean_observed`, `calibration_error`, `worst_segment`
- `summary` — a one-line count summary, for example the recorded full-pass summary quoted in the Tutorial
- `stamp` — a plain-text rendering of the verdict, for logs, tickets and filings

Determinism: the same manifest produces a byte-identical REST response on repeat, and MCP structured content equal to REST (both recorded in the verification battery).

### Verdict vocabulary

Every verdict value this atom can return (from SERVICE.md and the recorded responses — the recorded cases exercise all three):

| Verdict | Meaning |
|---|---|
| `PREDICTION_AUDIT_SOUND` | All 27 checks pass across all six sections. |
| `PREDICTION_AUDIT_UNSOUND` | At least one check fails (a present field is false / invalid, or one of the computed checks fails). |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but at least one check is `missing` — evidence was not declared. |

Section statuses (values of the `sections` object): `pass` (every check in the section passes, including gated checks that pass as not applicable), `fail` (at least one check in the section fails), `insufficient_evidence` (no check in the section fails, but at least one is missing).

Per-check statuses (values of `checks[].status`): `pass`, `fail`, `missing` — semantics as defined under Checks above. There is no separate not-applicable status; gated non-applicability is a `pass` whose evidence says so.

### Errors

Only error shapes evidenced in the repo / gateway documentation are listed. The 422 shape is recorded verbatim in the evidence; the other statuses are named in USER-GUIDE.md with the meanings below — no payload shape for them is recorded in the evidence, so none is invented here.

| HTTP | Meaning | Shape / notes |
|---|---|---|
| 401 | Unauthenticated — missing / invalid key | Named in USER-GUIDE.md; send `Authorization: Bearer <key>` |
| 403 | Key lacks this atom's scope | Named in USER-GUIDE.md; issue a key for this atom (contract: scope is this atom only) |
| 422 | `invalid_input` — a field has the wrong JSON type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance: field `model`, detail "model must be a string" |
| 429 | Rate limit exceeded | Named in USER-GUIDE.md; limits below |

### Rate limits + pricing status

- Rate limit (contract.yaml): **60 per key per minute, 10,000 per key per day**.
- Pricing (contract.yaml): `pricing.rate` is `null` (`rate_status: pending`), so the rate is: **Free during trial — rate pending.** No price is set; SERVICE.md states prices are set only from measured production cost per unit.

## Explanation

What this atom does in depth. Leakage is the central failure this atom exists to catch, because a leaked model looks excellent in validation and fails in production. Three of the computed checks are leakage checks in different forms — a feature available after prediction time, a feature derived from the target, and a random split on temporal data — and they are computed from the declared records rather than taken as a 'no leakage' boolean, precisely because that boolean is the one callers get wrong.

**How the verdict is decided — the deterministic core.** The atom is a deterministic evaluator over a declared evidence manifest: no model call, no network fetch, no clock. Each check reads named fields (Input reference), applies its gate if it has one, and lands as `pass`, `fail` or `missing`. The verdict is then a pure roll-up: any `fail` → the failing verdict; otherwise any `missing` → `INSUFFICIENT_EVIDENCE`; otherwise the passing verdict. Sections roll up the same way. That ordering matters: **an absent field is missing evidence, never a fail, and a present-but-false field is a fail, never missing** — conflating the two would either punish callers for not declaring something or let a declared violation hide as a gap.

The computed checks are: `model_beats_baseline_on_holdout` (the model must strictly beat the baseline on the untouched holdout in the declared `metric_direction`), `features_available_at_prediction_time` (every `features[].available_at` ≤ `prediction_time`), `no_target_derived_features`, `no_random_split_for_temporal_data` (a temporal dataset with a `random` split is the red-line fail), `calibration_within_declared_tolerance` (|mean predicted − mean observed| over `calibration.observations[]` within the caller's `max_tolerated_error`), and `segment_errors_within_declared_max` (every `evaluation.segments[].error` ≤ `max_segment_error`) — six named checks in the recorded response, covering the five computed themes in SERVICE.md, because feature leakage splits into availability and target-derivation. The response also reports `holdout_improvement`, `mean_predicted`, `mean_observed` and `calibration_error` as strings with exactly four decimal places, and `worst_segment` (the segment with the highest error, first such segment on a tie).

**What it does NOT do:**

- It does not train, run or score a model itself. The holdout scores, feature availability times, calibration observations and segment errors are caller declarations; the computed checks test those declarations against each other and against the caller's own tolerances.
- No threshold is invented by the atom — both tolerances (`calibration.max_tolerated_error`, `evaluation.max_segment_error`) are the caller's declared values.
- A `PREDICTION_AUDIT_SOUND` verdict means the declared evidence is internally sound — it is not a guarantee that the model will perform live; drift and deployment are checked as declared practice (monitoring, feedback loops, retraining policy, versioning, rollback), not observed live behaviour.

**Buyer / use context.** First buyer hypothesis (SERVICE.md, not yet market-tested): teams and agents working in Thinking & decisions who need this check on demand (first buyer hypothesis in SERVICE.md, not yet market-tested). Internal self-use (R3, passed): Validating RA and PdM models — Wright is an internal caller at zero price, metered to the internal cost ledger. The atom sells its deliverable — the check it produces — never the underlying knowledge itself.

## Role views

### For integrators (Users)

Start with USER-GUIDE.md for the quick start, then the Tutorial and How-to guides above. Your integration surface is exactly two endpoints (REST and MCP, same manifest, same result), one scoped key, and the error table above. Pin your client to the verdict / status vocabulary and the per-check (or gaps) semantics in the Reference — those are the stable contract at atom version 0.1.0; treat `evidence` / `summary` strings as human-readable, not parse targets, except for `checks[].section`, `checks[].check` and `checks[].status` (or, for the report atom, `status`, `layers`, `counts` and `gaps`) which are machine-stable.

### For developers

Manifest authoring: author against the Input reference — every SERVICE.md field, typed, with its gates. Determinism: the core is a pure function of the manifest (Python 3, stdlib only); the same manifest yields a byte-identical REST repeat and MCP/REST parity, both recorded. Implementation: `src/prediction_model_leakage_calibration_audit.py` — contract entry: src/prediction_model_leakage_calibration_audit.py — evaluate(manifest) -> verdict dict; CLI prints JSON + stamp. Tests: tests/test_prediction_model_leakage_calibration_audit.py — 24 tests, all passing 2026-11-15. Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract binding rule R1).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/prediction-model-leakage-calibration-audit`, MCP `POST https://atoms.pipavia.com/mcp/prediction-model-leakage-calibration-audit` (tool `prediction_model_leakage_calibration_audit`). Gateway version recorded at evidence time: 1.1.0. Rate limits: 60/min and 10,000/day per key; watch for 429s as the capacity signal. Key scope: per user, per atom — a 403 spike means clients using a key without this atom's scope, not an outage. Error monitoring: separate 422s (client manifest type errors; the `field` value is the diagnostic) from verdict outcomes (200 with a failing verdict / partial status is a successful call, not an error). Status: live — release candidate, one-week RC soak to 2026-11-22; verification retest verdict PASS on 2026-11-15 (gateway 1.1.0, deployment 7f9cae9fdd60417eb72062905a066554).

## Worked examples

Provenance: recorded 2026-11-15T23:57:56.668655+00:00 against gateway v1.1.0, external verification lane, source `verification/work/prediction-model-leakage-calibration-audit/evidence.json`. The three examples below are that record's `full-pass`, `violations` and `malformed` cases: each is the case's `input` followed by the REST execution's `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values identical to the record — mechanically verified, see the checklist below).

### 1. Full-pass — `full-pass` (recorded HTTP 200)

Input:

```json
{
  "model": "test-model-v1",
  "prediction_time": 100,
  "target": {
    "defined": true,
    "horizon_declared": true,
    "decision_defined": true,
    "metric_chosen_from_decision_costs": true
  },
  "baseline": {
    "computed": true,
    "evaluated_on_same_holdout": true
  },
  "holdout": {
    "model_score": 0.8,
    "baseline_score": 0.5,
    "metric_direction": "higher_is_better",
    "untouched": true
  },
  "validation": {
    "split_strategy_documented": true,
    "temporal_data": true,
    "split_type": "time_based",
    "peeking_at_validation": false
  },
  "features": [
    {
      "available_at": 50,
      "derived_from_target": false
    }
  ],
  "approach": {
    "simple_model_tried_first": true,
    "complexity_justified": true,
    "outputs_probabilities": true,
    "action_thresholds_from_decision_costs": true
  },
  "calibration": {
    "reported": true,
    "max_tolerated_error": 0.05,
    "observations": [
      {
        "predicted": 0.6,
        "outcome": 1
      },
      {
        "predicted": 0.4,
        "outcome": 0
      }
    ]
  },
  "evaluation": {
    "segment_errors_reported": true,
    "max_segment_error": 0.1,
    "segments": [
      {
        "name": "A",
        "error": 0.02
      }
    ]
  },
  "drift": {
    "monitoring_in_place": true,
    "feedback_loops_identified": true,
    "retraining_policy_defined": true
  },
  "deployment": {
    "versioned_model_and_card": true,
    "rollback_path_defined": true,
    "silent_updates_in_production": false
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "prediction-model-leakage-calibration-audit",
  "atom_version": "0.1.0",
  "model": "test-model-v1",
  "verdict": "PREDICTION_AUDIT_SOUND",
  "sections": {
    "target_and_decision": "pass",
    "baseline_and_holdout": "pass",
    "leakage_and_validation": "pass",
    "model_ladder_and_thresholds": "pass",
    "calibration_and_evaluation": "pass",
    "drift_and_deployment": "pass"
  },
  "checks": [
    {
      "section": "target_and_decision",
      "check": "target_defined",
      "status": "pass",
      "evidence": "what is predicted — the target is defined"
    },
    {
      "section": "target_and_decision",
      "check": "prediction_horizon_declared",
      "status": "pass",
      "evidence": "the prediction horizon is declared"
    },
    {
      "section": "target_and_decision",
      "check": "decision_defined",
      "status": "pass",
      "evidence": "the decision the prediction drives is defined"
    },
    {
      "section": "target_and_decision",
      "check": "metric_chosen_from_decision_costs",
      "status": "pass",
      "evidence": "metric chosen from the decision's costs — false positives vs false negatives rarely cost the same"
    },
    {
      "section": "baseline_and_holdout",
      "check": "baseline_computed",
      "status": "pass",
      "evidence": "baseline first: naive rule / historical mean / current heuristic — computed and reported"
    },
    {
      "section": "baseline_and_holdout",
      "check": "baseline_evaluated_on_same_holdout",
      "status": "pass",
      "evidence": "baseline and model are scored on the same holdout"
    },
    {
      "section": "baseline_and_holdout",
      "check": "model_beats_baseline_on_holdout",
      "status": "pass",
      "evidence": "quality gate: baseline computed; improvement demonstrated on untouched holdout — a model that doesn't beat the baseline doesn't ship"
    },
    {
      "section": "baseline_and_holdout",
      "check": "holdout_untouched",
      "status": "pass",
      "evidence": "holdout kept untouched for the final read — no peeking at validation"
    },
    {
      "section": "leakage_and_validation",
      "check": "split_strategy_documented",
      "status": "pass",
      "evidence": "quality gate: split strategy documented; temporal leakage explicitly checked"
    },
    {
      "section": "leakage_and_validation",
      "check": "no_random_split_for_temporal_data",
      "status": "pass",
      "evidence": "skill red line: no random splits for time-series reality — time-based splits for temporal data"
    },
    {
      "section": "leakage_and_validation",
      "check": "features_available_at_prediction_time",
      "status": "pass",
      "evidence": "every feature is available at or before the declared prediction time — no future information leaks in"
    },
    {
      "section": "leakage_and_validation",
      "check": "no_target_derived_features",
      "status": "pass",
      "evidence": "no feature is derived from the target itself"
    },
    {
      "section": "leakage_and_validation",
      "check": "no_validation_peeking",
      "status": "pass",
      "evidence": "no peeking at validation during model selection"
    },
    {
      "section": "model_ladder_and_thresholds",
      "check": "simple_model_tried_first",
      "status": "pass",
      "evidence": "model ladder: simple first (regression, rules, seasonal means)"
    },
    {
      "section": "model_ladder_and_thresholds",
      "check": "complexity_justified",
      "status": "pass",
      "evidence": "complexity earns its keep in accuracy, explainability, and maintenance cost"
    },
    {
      "section": "model_ladder_and_thresholds",
      "check": "outputs_probabilities",
      "status": "pass",
      "evidence": "probabilities, not fortune-telling: the model outputs probabilities"
    },
    {
      "section": "model_ladder_and_thresholds",
      "check": "thresholds_from_decision_costs",
      "status": "pass",
      "evidence": "action thresholds set from decision costs"
    },
    {
      "section": "calibration_and_evaluation",
      "check": "calibration_reported",
      "status": "pass",
      "evidence": "quality gate: calibration reported, not just ranking ability"
    },
    {
      "section": "calibration_and_evaluation",
      "check": "calibration_within_declared_tolerance",
      "status": "pass",
      "evidence": "check calibration: |mean predicted − mean observed| over the declared series, within the caller's declared max_tolerated_error — when it says 70%, it should be right ~70%"
    },
    {
      "section": "calibration_and_evaluation",
      "check": "segment_errors_reported",
      "status": "pass",
      "evidence": "quality gate: segment errors reported, not just aggregate"
    },
    {
      "section": "calibration_and_evaluation",
      "check": "segment_errors_within_declared_max",
      "status": "pass",
      "evidence": "segment errors reported, not just aggregate — every segment within the caller's declared max_segment_error; the worst cohort is the story"
    },
    {
      "section": "drift_and_deployment",
      "check": "drift_monitoring_in_place",
      "status": "pass",
      "evidence": "quality gate: monitor input drift and live performance"
    },
    {
      "section": "drift_and_deployment",
      "check": "feedback_loops_identified",
      "status": "pass",
      "evidence": "feedback loops identified — predictions change behavior change data"
    },
    {
      "section": "drift_and_deployment",
      "check": "retraining_policy_defined",
      "status": "pass",
      "evidence": "quality gate: retrain policy in place before relying on the model"
    },
    {
      "section": "drift_and_deployment",
      "check": "versioned_model_and_card",
      "status": "pass",
      "evidence": "deploy carefully: versioned model + card"
    },
    {
      "section": "drift_and_deployment",
      "check": "rollback_path_defined",
      "status": "pass",
      "evidence": "rollout with monitoring and a rollback path"
    },
    {
      "section": "drift_and_deployment",
      "check": "no_silent_model_updates",
      "status": "pass",
      "evidence": "skill red line: no silent model updates in production"
    }
  ],
  "holdout_improvement": "0.3000",
  "mean_predicted": "0.5000",
  "mean_observed": "0.5000",
  "calibration_error": "0.0000",
  "worst_segment": "A",
  "summary": "27 pass, 0 fail, 0 missing of 27 checks across six sections.",
  "stamp": "PREDICTION-MODEL LEAKAGE CALIBRATION AUDIT\nmodel: test-model-v1\nVERDICT: PREDICTION_AUDIT_SOUND\n  target_and_decision          pass\n  baseline_and_holdout         pass\n  leakage_and_validation       pass\n  model_ladder_and_thresholds  pass\n  calibration_and_evaluation   pass\n  drift_and_deployment         pass\n27 pass, 0 fail, 0 missing of 27 checks across six sections."
}
```

### 2. Violations — `violations` (recorded HTTP 200)

Input:

```json
{
  "model": "bad-model",
  "prediction_time": 100,
  "target": {
    "defined": true,
    "horizon_declared": true,
    "decision_defined": true,
    "metric_chosen_from_decision_costs": true
  },
  "baseline": {
    "computed": true,
    "evaluated_on_same_holdout": true
  },
  "holdout": {
    "model_score": 0.4,
    "baseline_score": 0.8,
    "metric_direction": "higher_is_better",
    "untouched": true
  },
  "validation": {
    "split_strategy_documented": true,
    "temporal_data": true,
    "split_type": "random",
    "peeking_at_validation": false
  },
  "features": [
    {
      "available_at": 150,
      "derived_from_target": true
    }
  ],
  "approach": {
    "simple_model_tried_first": true,
    "complexity_justified": true,
    "outputs_probabilities": true,
    "action_thresholds_from_decision_costs": true
  },
  "calibration": {
    "reported": true,
    "max_tolerated_error": 0.01,
    "observations": [
      {
        "predicted": 0.9,
        "outcome": 0
      }
    ]
  },
  "evaluation": {
    "segment_errors_reported": true,
    "max_segment_error": 0.01,
    "segments": [
      {
        "name": "B",
        "error": 0.5
      }
    ]
  },
  "drift": {
    "monitoring_in_place": true,
    "feedback_loops_identified": true,
    "retraining_policy_defined": true
  },
  "deployment": {
    "versioned_model_and_card": true,
    "rollback_path_defined": true,
    "silent_updates_in_production": false
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "prediction-model-leakage-calibration-audit",
  "atom_version": "0.1.0",
  "model": "bad-model",
  "verdict": "PREDICTION_AUDIT_UNSOUND",
  "sections": {
    "target_and_decision": "pass",
    "baseline_and_holdout": "fail",
    "leakage_and_validation": "fail",
    "model_ladder_and_thresholds": "pass",
    "calibration_and_evaluation": "fail",
    "drift_and_deployment": "pass"
  },
  "checks": [
    {
      "section": "target_and_decision",
      "check": "target_defined",
      "status": "pass",
      "evidence": "what is predicted — the target is defined"
    },
    {
      "section": "target_and_decision",
      "check": "prediction_horizon_declared",
      "status": "pass",
      "evidence": "the prediction horizon is declared"
    },
    {
      "section": "target_and_decision",
      "check": "decision_defined",
      "status": "pass",
      "evidence": "the decision the prediction drives is defined"
    },
    {
      "section": "target_and_decision",
      "check": "metric_chosen_from_decision_costs",
      "status": "pass",
      "evidence": "metric chosen from the decision's costs — false positives vs false negatives rarely cost the same"
    },
    {
      "section": "baseline_and_holdout",
      "check": "baseline_computed",
      "status": "pass",
      "evidence": "baseline first: naive rule / historical mean / current heuristic — computed and reported"
    },
    {
      "section": "baseline_and_holdout",
      "check": "baseline_evaluated_on_same_holdout",
      "status": "pass",
      "evidence": "baseline and model are scored on the same holdout"
    },
    {
      "section": "baseline_and_holdout",
      "check": "model_beats_baseline_on_holdout",
      "status": "fail",
      "evidence": "quality gate: baseline computed; improvement demonstrated on untouched holdout — a model that doesn't beat the baseline doesn't ship"
    },
    {
      "section": "baseline_and_holdout",
      "check": "holdout_untouched",
      "status": "pass",
      "evidence": "holdout kept untouched for the final read — no peeking at validation"
    },
    {
      "section": "leakage_and_validation",
      "check": "split_strategy_documented",
      "status": "pass",
      "evidence": "quality gate: split strategy documented; temporal leakage explicitly checked"
    },
    {
      "section": "leakage_and_validation",
      "check": "no_random_split_for_temporal_data",
      "status": "fail",
      "evidence": "skill red line: no random splits for time-series reality — time-based splits for temporal data"
    },
    {
      "section": "leakage_and_validation",
      "check": "features_available_at_prediction_time",
      "status": "fail",
      "evidence": "every feature is available at or before the declared prediction time — no future information leaks in"
    },
    {
      "section": "leakage_and_validation",
      "check": "no_target_derived_features",
      "status": "fail",
      "evidence": "no feature is derived from the target itself"
    },
    {
      "section": "leakage_and_validation",
      "check": "no_validation_peeking",
      "status": "pass",
      "evidence": "no peeking at validation during model selection"
    },
    {
      "section": "model_ladder_and_thresholds",
      "check": "simple_model_tried_first",
      "status": "pass",
      "evidence": "model ladder: simple first (regression, rules, seasonal means)"
    },
    {
      "section": "model_ladder_and_thresholds",
      "check": "complexity_justified",
      "status": "pass",
      "evidence": "complexity earns its keep in accuracy, explainability, and maintenance cost"
    },
    {
      "section": "model_ladder_and_thresholds",
      "check": "outputs_probabilities",
      "status": "pass",
      "evidence": "probabilities, not fortune-telling: the model outputs probabilities"
    },
    {
      "section": "model_ladder_and_thresholds",
      "check": "thresholds_from_decision_costs",
      "status": "pass",
      "evidence": "action thresholds set from decision costs"
    },
    {
      "section": "calibration_and_evaluation",
      "check": "calibration_reported",
      "status": "pass",
      "evidence": "quality gate: calibration reported, not just ranking ability"
    },
    {
      "section": "calibration_and_evaluation",
      "check": "calibration_within_declared_tolerance",
      "status": "fail",
      "evidence": "check calibration: |mean predicted − mean observed| over the declared series, within the caller's declared max_tolerated_error — when it says 70%, it should be right ~70%"
    },
    {
      "section": "calibration_and_evaluation",
      "check": "segment_errors_reported",
      "status": "pass",
      "evidence": "quality gate: segment errors reported, not just aggregate"
    },
    {
      "section": "calibration_and_evaluation",
      "check": "segment_errors_within_declared_max",
      "status": "fail",
      "evidence": "segment errors reported, not just aggregate — every segment within the caller's declared max_segment_error; the worst cohort is the story"
    },
    {
      "section": "drift_and_deployment",
      "check": "drift_monitoring_in_place",
      "status": "pass",
      "evidence": "quality gate: monitor input drift and live performance"
    },
    {
      "section": "drift_and_deployment",
      "check": "feedback_loops_identified",
      "status": "pass",
      "evidence": "feedback loops identified — predictions change behavior change data"
    },
    {
      "section": "drift_and_deployment",
      "check": "retraining_policy_defined",
      "status": "pass",
      "evidence": "quality gate: retrain policy in place before relying on the model"
    },
    {
      "section": "drift_and_deployment",
      "check": "versioned_model_and_card",
      "status": "pass",
      "evidence": "deploy carefully: versioned model + card"
    },
    {
      "section": "drift_and_deployment",
      "check": "rollback_path_defined",
      "status": "pass",
      "evidence": "rollout with monitoring and a rollback path"
    },
    {
      "section": "drift_and_deployment",
      "check": "no_silent_model_updates",
      "status": "pass",
      "evidence": "skill red line: no silent model updates in production"
    }
  ],
  "holdout_improvement": "-0.4000",
  "mean_predicted": "0.9000",
  "mean_observed": "0.0000",
  "calibration_error": "0.9000",
  "worst_segment": "B",
  "summary": "21 pass, 6 fail, 0 missing of 27 checks across six sections.",
  "stamp": "PREDICTION-MODEL LEAKAGE CALIBRATION AUDIT\nmodel: bad-model\nVERDICT: PREDICTION_AUDIT_UNSOUND\n  target_and_decision          pass\n  baseline_and_holdout         fail\n  leakage_and_validation       fail\n  model_ladder_and_thresholds  pass\n  calibration_and_evaluation   fail\n  drift_and_deployment         pass\n21 pass, 6 fail, 0 missing of 27 checks across six sections."
}
```

### 3. Malformed — `malformed` (recorded HTTP 422)

Input:

```json
{
  "model": 123,
  "prediction_time": "not-a-number"
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "model",
  "detail": "model must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Yes — integrators, developers, ops |
| Regulators view | N/A — Not compliance-facing: the verdict is a model-quality / leakage / calibration audit of declared evidence, not regulatory compliance evidence, and SERVICE.md makes no regulatory claim. |
| Checks named count vs recorded count | 27 / 27 — every check in the recorded full-pass `checks` array is named in the Reference |
| Verdict vocabulary complete | Yes — 3 values listed (PREDICTION_AUDIT_SOUND, PREDICTION_AUDIT_UNSOUND, INSUFFICIENT_EVIDENCE), plus section and per-check statuses |
| Input reference typed | Yes — 38 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/prediction-model-leakage-calibration-audit/evidence.json` after writing |
| Output format | CommonMark markdown |

