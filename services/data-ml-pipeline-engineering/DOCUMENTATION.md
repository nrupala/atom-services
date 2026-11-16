# Data ml pipeline engineering — `data-ml-pipeline-engineering`

**Display name:** Data ml pipeline engineering · **Slug:** `data-ml-pipeline-engineering` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run for this atom; the exact request and response are reproduced verbatim under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up and issue a gateway key scoped to `data-ml-pipeline-engineering` (the full flow is in the first how-to guide below). Every call sends it as `Authorization: Bearer <key>`.
2. **Assemble the manifest.** Build one JSON object declaring the evidence the atom checks. In the recorded run the entity is `test-pipeline-001`. Fill every group the Input reference lists — an absent field is not a neutral omission: it is recorded as missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`.
3. **Send it.** `POST https://atoms.pipavia.com/v1/data-ml-pipeline-engineering` with the manifest as the body (or call the MCP tool `data_ml_pipeline_engineering` with the same object as its arguments).
4. **Read the verdict first.** The recorded response returns HTTP 200 with verdict `DATA_ML_PIPELINE_READY` — the strongest verdict this atom gives. Its `summary` reads: "46 pass, 0 fail, 0 missing of 46 checks across seven sections."
5. **Read the sections, then the checks.** All 7 sections report `pass` (`contracts_and_ingestion`, `idempotency_and_orchestration`, `quality_gates`, `lineage_and_reproducibility`, `ml_hygiene_and_splits`, `lifecycle_and_serving`, `monitoring_and_drift`), and all 46 entries in `checks` report `status: pass`, each carrying the `evidence` string that states the requirement it checked.
6. **Read the computed fields.** The record declares two complete source datasets whose rows sum to the declared total, split rows that sum to the declared split total, and estimated latency and monthly cost inside the budgets the caller itself declares — so all five computed checks pass and both headroom figures are positive. The response's `computed_status` is `within_stated_limits_on_declared_evidence`, and its `stamp` field carries a plain-text rendering of the same verdict for logs and tickets.
7. **Keep the response.** It is the deliverable: one bounded judgment artifact for that one manifest. Same manifest in → same response out (the verification battery confirmed byte-identical repeat REST responses and MCP/REST parity for the full-pass manifest).

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "data-ml-pipeline-engineering"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -X POST https://atoms.pipavia.com/v1/data-ml-pipeline-engineering \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

A well-formed manifest returns HTTP 200 and a verdict body (see Reference — Output format). Authentication and shape failures return the error shapes listed under Reference — Errors, never a verdict.

### Call via MCP

POST to `https://atoms.pipavia.com/mcp/data-ml-pipeline-engineering` with the same `Authorization: Bearer <key>` header and call the tool named `data_ml_pipeline_engineering`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same report core as the REST response (parity was verified in the recorded battery: the full-pass manifest's MCP `structuredContent` was deep-equal to the REST artifact).

### Read a failing verdict and fix the manifest

A failing verdict is still HTTP 200 — it is a result, not a transport error. Work it in this order:

1. **Read `verdict`.** `DATA_ML_PIPELINE_NOT_READY` means at least one check failed. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. The passing verdict here is `DATA_ML_PIPELINE_READY`.
2. **Read `sections`.** A section reports `fail` if any of its checks failed, `insufficient_evidence` if none failed but at least one is missing, and `pass` only when all of its checks pass. Start with the failing sections.
3. **Read `checks`.** Filter to `status: fail` for breaches and `status: missing` for gaps. Each entry names its `section`, its `check`, and an `evidence` string stating the requirement. `fail` means the field was present but false, invalid, or arithmetically inconsistent; `missing` means the field (or a value a computation needs) was absent.
4. **Fix the underlying facts, then resubmit.** In the recorded violations run the failing checks were exactly: `total_rows_matches_sum_of_source_rows`, `no_silent_coercion`, `split_total_matches_sum_of_split_rows`, `no_pii_in_training_data_without_lawful_basis`, `latency_within_caller_declared_budget`, `cost_within_caller_declared_budget` (40 pass, 6 fail, 0 missing of 46 checks across seven sections.) In the recorded violations run the declared source total and split total did not match their declared parts, estimated latency and cost exceeded the caller-declared budgets, silent coercion was declared present, and PII without a lawful basis was declared present. Fixing the verdict means fixing the design record's facts — reconcile the totals, bring the estimates within the budgets you declare (or honestly re-declare the budgets), remove silent coercion, and remove the unlawful-basis PII — then resubmit.
5. **Do not confuse a verdict with a 422.** A failing verdict means the manifest was well-typed and was judged. A 422 means the manifest was not well-typed and was never judged — see the next guide.

### Handle a 422 invalid_input

A type violation returns HTTP 422 with a body naming the offending field — it never returns a verdict. The recorded malformed run for this atom sent a value of the wrong type and received:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "sources.declared_total_rows",
  "detail": "sources.declared_total_rows must be a number"
}
```

To handle it: read `field` (`sources.declared_total_rows`) and `detail` ("sources.declared_total_rows must be a number"), correct the value's type in your manifest at exactly that path, and resubmit the whole manifest. Do not drop the field to silence the error — an absent field is missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`. One 422 reports one field; if several fields are mistyped, fix and resubmit iteratively.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/data-ml-pipeline-engineering` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/data-ml-pipeline-engineering` — tool name `data_ml_pipeline_engineering`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` (email; sign-in link emailed), then `POST /v1/keys` with `{"atom": "data-ml-pipeline-engineering"}` after opening the link. A key for one atom never verifies for another: scope is per atom.

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table (which states: all fields are booleans unless noted) and corroborated by `contract.yaml` and the recorded MCP `inputSchema`. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them). An absent field = missing evidence; a present-but-false/invalid field = a failed check, except where a note says otherwise.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `entity` | string | (string; carried into the verdict output, not itself checked) |

#### Read by: contracts_and_ingestion

| Field | Type | Notes |
|---|---|---|
| `sources.datasets` | array | (list of dataset entries; absent / not a list / empty = both computed source checks missing) |
| `sources.datasets[].name` | string | (string; must be non-empty for the entry to be complete) |
| `sources.datasets[].rows` | number | (number; declared per-dataset rows, summed by the computed total check) |
| `sources.declared_total_rows` | number | (number; computed, see below) |
| `sources.schemas_and_expectations_declared_for_all_inputs_and_outputs` | boolean | — |
| `sources.validation_on_arrival` | boolean | — |
| `sources.bad_data_refused_loudly` | boolean | — |
| `sources.silent_coercion_present` | boolean | (must be `false` to pass — skill red line) |

#### Read by: idempotency_and_orchestration

| Field | Type | Notes |
|---|---|---|
| `pipeline.steps_rerunnable_idempotently` | boolean | — |
| `pipeline.exactly_once_effects_at_sinks` | boolean | — |
| `pipeline.backfill_tested_once` | boolean | — |
| `pipeline.explicit_step_dependencies` | boolean | — |
| `pipeline.schedules_documented` | boolean | — |
| `pipeline.failures_alert_and_retry` | boolean | — |
| `pipeline.unrecorded_manual_reruns_present` | boolean | (must be `false` to pass — skill method step 3) |

#### Read by: quality_gates

| Field | Type | Notes |
|---|---|---|
| `quality.row_count_checks_between_stages` | boolean | — |
| `quality.freshness_checks_between_stages` | boolean | — |
| `quality.null_uniqueness_distribution_checks_between_stages` | boolean | — |
| `quality.bad_partitions_quarantined` | boolean | — |
| `quality.pipeline_health_dashboard_present` | boolean | — |

#### Read by: lineage_and_reproducibility

| Field | Type | Notes |
|---|---|---|
| `lineage.source_to_transform_to_sink_tracked` | boolean | — |
| `lineage.code_versioned` | boolean | — |
| `lineage.config_versioned` | boolean | — |
| `lineage.data_snapshots_versioned` | boolean | — |
| `lineage.same_inputs_produce_same_outputs_verified` | boolean | — |
| `training.reproducible_with_seeds_and_pinned_env` | boolean | — |

#### Read by: ml_hygiene_and_splits

| Field | Type | Notes |
|---|---|---|
| `splits.train_rows` | number | (number; computed, see below) |
| `splits.eval_rows` | number | (number; computed, see below) |
| `splits.test_rows` | number | (number; computed, see below) |
| `splits.declared_total_rows` | number | (number; computed, see below) |
| `splits.leakage_checks_cover_time_target_and_cross_splits` | boolean | — |
| `splits.split_by_time_or_user_when_temporal` | boolean | — |
| `splits.class_balance_assessed` | boolean | — |
| `features.feature_definitions_declared` | boolean | — |
| `features.label_definition_declared` | boolean | — |
| `features.feature_store_only_when_justified` | boolean | — |
| `privacy.pii_in_training_data_without_lawful_basis` | boolean | (must be `false` to pass — skill red line) |

#### Read by: lifecycle_and_serving

| Field | Type | Notes |
|---|---|---|
| `lifecycle.eval_suites_versioned_with_model` | boolean | — |
| `lifecycle.model_registry_entry_exists` | boolean | — |
| `lifecycle.model_card_covers_data_metrics_and_limits` | boolean | — |
| `lifecycle.offline_eval_completed_before_prod` | boolean | — |
| `lifecycle.rollout_plan_present_before_prod` | boolean | — |
| `serving.deployment_pattern_declared` | boolean | — |
| `serving.estimated_latency_ms` | number | (number; computed, see below) |
| `serving.latency_budget_ms` | number | (number; the caller's own declared budget, computed, see below) |
| `serving.estimated_monthly_cost` | number | (number; computed, see below) |
| `serving.monthly_cost_budget` | number | (number; the caller's own declared budget, computed, see below) |

#### Read by: monitoring_and_drift

| Field | Type | Notes |
|---|---|---|
| `monitoring.input_drift_monitored` | boolean | — |
| `monitoring.output_drift_monitored` | boolean | — |
| `monitoring.performance_decay_monitored_vs_baselines` | boolean | — |
| `monitoring.alert_thresholds_set` | boolean | — |
| `monitoring.thresholds_tied_to_retraining_policy` | boolean | — |
| `monitoring.retraining_is_a_pipeline` | boolean | — |

Total typed input fields documented: 54 (each SERVICE.md field-table row; nested row-entry fields are listed individually where SERVICE.md lists them).

### Checks

All 46 checks, named exactly as in the recorded full-pass REST response's `checks` array (cross-checked against SERVICE.md; the counts agree). For each check, the Requirement column is the recorded `evidence` string, which states what must hold to pass.

**Per-check status semantics (all checks):** `pass` = the requirement held on the declared evidence; `fail` = the field was present but false/invalid, or a computed comparison did not hold; `missing` = the field, list, or a value a computation needs was absent, so the check could not be evaluated. There is no separate not-applicable status in the recorded responses: where a check is conditional and its gate is not declared, it is recorded as `pass` with evidence stating that no such case was declared (see the notes on the individual conditional checks, where this atom has them).

#### Section: contracts_and_ingestion

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `source_entries_complete` | every source dataset entry carries a non-empty name and numeric rows | Computed. Pass requires every declared `sources.datasets` entry to carry a non-empty `name` and numeric `rows`. A missing or empty list is `missing`; an incomplete entry makes this check `missing`. |
| `total_rows_matches_sum_of_source_rows` | the declared total source rows equal the sum of the declared per-dataset rows | Computed. Pass requires declared `sources.declared_total_rows` to equal the sum of declared per-dataset `rows`. Absence is `missing`. |
| `schemas_and_expectations_declared` | method step 1: schemas and expectations (types, ranges, nullability) are declared for every input and output | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `validation_on_arrival` | method step 1: data is validated on arrival at every edge | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `bad_data_refused_loudly` | method step 1: bad data is refused loudly, never accepted silently | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_silent_coercion` | red line: data is never coerced silently | Pass requires `sources.silent_coercion_present` to be declared `false` (skill red line). Declared `true` fails; absent is `missing`. |
#### Section: idempotency_and_orchestration

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `steps_rerunnable_idempotently` | method step 2 / quality gate: pipeline steps are rerunnable idempotently | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `exactly_once_effects_at_sinks` | method step 2: sinks have exactly-once effects (upserts/keys) | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `backfill_tested_once` | quality gate: a backfill was tested once — backfills are supported and cheap to rerun | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `explicit_step_dependencies` | method step 3: step dependencies are explicit | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `schedules_documented` | method step 3: schedules are documented | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `failures_alert_and_retry` | method step 3: failures alert and retry safely | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_unrecorded_manual_reruns` | method step 3: there are no unrecorded 'just rerun it' habits | Pass requires `pipeline.unrecorded_manual_reruns_present` to be declared `false`. Declared `true` fails; absent is `missing`. |
#### Section: quality_gates

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `row_count_checks_between_stages` | method step 4: row count checks run between stages | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `freshness_checks_between_stages` | method step 4: freshness checks run between stages | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `null_uniqueness_distribution_checks_between_stages` | method step 4: null, uniqueness and distribution checks run between stages | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `bad_partitions_quarantined` | method step 4: bad partitions are quarantined, not passed downstream | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `pipeline_health_dashboard_present` | method step 4: a pipeline-health dashboard exists | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: lineage_and_reproducibility

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `source_to_transform_to_sink_lineage_tracked` | method step 5: lineage is tracked from source through transform to sink | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `code_versioned` | method step 5: code is versioned | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `config_versioned` | method step 5: config is versioned | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `data_snapshots_versioned` | method step 5: data snapshots are versioned where it matters | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `same_inputs_produce_same_outputs_verified` | method step 5: the same inputs produce the same outputs — verified, not assumed | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `training_reproducible_with_seeds_and_pinned_env` | method step 7 / quality gate: training is reproducible — seeds recorded and the environment pinned | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: ml_hygiene_and_splits

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `split_total_matches_sum_of_split_rows` | method step 6: the declared total split rows equal the declared train rows plus eval rows plus test rows (the skill states no split ratio, so none is imposed here) | Computed. Pass requires declared `splits.declared_total_rows` to equal train + eval + test rows. No split ratio is imposed. Absence is `missing`. |
| `leakage_checks_cover_time_target_and_cross_splits` | method step 6: leakage checks cover time, target and cross-split leakage | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `split_by_time_or_user_when_temporal` | method step 6: data is split by time or user when reality is temporal | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `class_balance_assessed` | method step 6: class balance is assessed — awareness is declared, no ratio is imposed | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `feature_definitions_declared` | method step 6: feature definitions are declared | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `label_definition_declared` | method step 6: the label definition is declared | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `feature_store_only_when_justified` | method step 6: a feature store is used only when justified | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_pii_in_training_data_without_lawful_basis` | red line: no PII is in training data without a lawful basis | Pass requires `privacy.pii_in_training_data_without_lawful_basis` to be declared `false` (skill red line). Declared `true` fails; absent is `missing`. |
#### Section: lifecycle_and_serving

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `eval_suites_versioned_with_model` | method step 7: eval suites are versioned with the model | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `model_registry_entry_exists` | method step 7 / quality gate: a registry entry exists for the model | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `model_card_covers_data_metrics_and_limits` | method step 7 / quality gate: a model card exists covering data, metrics and limits | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `offline_eval_completed_before_prod` | red line: offline eval is completed before a model goes to prod | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `rollout_plan_present_before_prod` | red line: a rollout plan exists before a model goes to prod | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `deployment_pattern_declared` | method step 7: the deployment pattern (batch vs service) is declared | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `latency_within_caller_declared_budget` | method step 7: the declared estimated latency does not exceed the latency budget the caller itself declares (the skill states no latency number, so none is imposed here) | Computed. Pass requires declared `serving.estimated_latency_ms` not to exceed the caller-declared `serving.latency_budget_ms`. The skill states no latency number, so none is imposed. Absence is `missing`. |
| `cost_within_caller_declared_budget` | method step 7: the declared estimated monthly cost does not exceed the monthly cost budget the caller itself declares (the skill states no cost number, so none is imposed here) | Computed. Pass requires declared `serving.estimated_monthly_cost` not to exceed the caller-declared `serving.monthly_cost_budget`, on the same basis as latency. Absence is `missing`. |
#### Section: monitoring_and_drift

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `input_drift_monitored` | method step 8: input drift is monitored | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `output_drift_monitored` | method step 8: output drift is monitored | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `performance_decay_monitored_vs_baselines` | method step 8: performance decay is monitored against baselines | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `alert_thresholds_set` | quality gate: drift and performance monitoring is live with alert thresholds — the threshold values are the caller's, none is imposed here | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `thresholds_tied_to_retraining_policy` | method step 8: alert thresholds are tied to a retraining policy | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `retraining_is_a_pipeline` | method step 8: retraining is a pipeline, not a heroic weekend | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |

### Output format

HTTP 200 returns one JSON object. Fields observed in the recorded full-pass response, in recorded order:

| Field | Type (as recorded) | Meaning |
|---|---|---|
| `service` | string | Atom slug. |
| `atom_version` | string | Atom version that produced the verdict. |
| `entity` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `verdict` | string | The verdict (see Verdict vocabulary). |
| `sections` | object | Per-section statuses keyed by section name. |
| `checks` | array | Array of `{section, check, status, evidence}` objects — one per check. |
| `computed_status` | string | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when a computed check cannot be completed. |
| `sources_evaluated` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `computed_total_rows` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `total_rows_difference` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `computed_split_total_rows` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `split_total_difference` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `latency_headroom_ms` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `monthly_cost_headroom` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `summary` | string | One-line pass/fail/missing count summary. |
| `stamp` | string | Plain-text rendering of the verdict, sections and summary. |

Computed numeric fields follow the fixed serialization rule stated in SERVICE.md (fixed-decimal strings where SERVICE.md specifies them), shared by both implementations so repeat calls are byte-identical.

### Verdict vocabulary

- **`DATA_ML_PIPELINE_READY`** — Every check passes (46 pass, 0 fail, 0 missing of 46 checks across seven sections.) The declared evidence is complete and consistent with the bound skill's method, quality gates and red lines.
- **`DATA_ML_PIPELINE_NOT_READY`** — At least one check fails. The failing checks name the breached requirement and the evidence against it.
- **`INSUFFICIENT_EVIDENCE`** — Nothing failed, but at least one check is `missing`. The missing checks say exactly what to supply.

- **Section statuses:** `pass` (all checks in the section pass) · `fail` (at least one check in the section fails) · `insufficient_evidence` (no check fails but at least one is missing).
- **Per-check statuses:** `pass` · `fail` · `missing` (see Checks). No other per-check status occurs in the recorded responses; conditional checks that do not apply are recorded as `pass`, as documented above.
- **`computed_status` values:** `within_stated_limits_on_declared_evidence` (every computed check that could be completed held) · `outside_stated_limits_on_declared_evidence` (at least one computed check failed) · `null` (at least one computed check could not be completed).

### Errors

Only the shapes evidenced in the repo/gateway docs are listed; no other error payload is documented, and none should be assumed.

- **401 — unauthenticated:** missing or invalid key (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 401; do not assume one. Fix: send a valid key as `Authorization: Bearer <key>`.
- **403 — scope:** the key lacks this atom's scope (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 403; do not assume one. Fix: issue this atom's scope on your key via `POST /v1/keys`.
- **422 — `invalid_input`:** a field has the wrong type. Recorded body shape (verbatim from the recorded malformed run):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "sources.declared_total_rows",
  "detail": "sources.declared_total_rows must be a number"
}
```

  Here `field` is `sources.declared_total_rows` and `detail` is "sources.declared_total_rows must be a number". A 422 never carries a verdict.
- **429 — rate limit:** the per-key rate limit was exceeded (60/min, 10,000/day per key; USER-GUIDE.md and `contract.yaml`). No error body shape is evidenced in the repo for 429; do not assume one. Fix: slow down and retry within the limits.

### Rate limits + pricing status

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- **Pricing:** unit = deliverable; `pricing.rate` is null (rate_status: pending). **Free during trial — rate pending.** No price is set; per SERVICE.md, prices are set only from measured production cost per unit.

## Explanation

This atom is a deterministic completeness-and-consistency audit of a **declared** data/ML pipeline design record — it designs or builds no pipeline, ingests or transforms no data, and trains or evaluates no model. Its 46 checks across seven sections cover contracts and ingestion, idempotency and orchestration, quality gates, lineage and reproducibility, ML hygiene and splits, lifecycle and serving, and monitoring and drift. Five checks are computed from declared numbers: source-entry completeness; the declared source total against the sum of per-dataset rows; the declared split total against train + eval + test rows (no split ratio is imposed, because the skill states none); estimated latency against the latency budget the caller itself declares; and estimated monthly cost against the cost budget the caller itself declares (the skill states no latency or cost number, so none is imposed).

The verdict is decided mechanically. Each check ends `pass`, `fail`, or `missing`. Any `fail` makes the verdict `DATA_ML_PIPELINE_NOT_READY`. Otherwise any `missing` makes it `INSUFFICIENT_EVIDENCE`. Only when all 46 checks pass is the verdict `DATA_ML_PIPELINE_READY`. Computed amounts are serialized as strings with exactly six decimal places by a fixed round-half-up rule shared by both implementations; computed comparisons compare the fixed-6dp difference to zero.

A ready verdict means the declared record is complete and its declared arithmetic closes — it does **not** mean the real pipeline is sound or the model is any good. The atom verifies no declared value against a live pipeline, dataset or registry, and judges nothing qualitative: not whether schemas are correct (only declared), whether leakage is actually absent (only that covering checks are declared), whether the split suits the problem, whether a feature store is truly justified, whether a lawful basis for PII actually exists in law (only that PII without one is declared absent), or whether drift thresholds are well chosen. Thresholds the skill does not state are declined, not invented: no split ratio, no latency/cost ceiling beyond the caller's own budgets, no drift threshold value, no class-balance ratio, no freshness or null-rate limit, and no minimum dataset size.

**Buyer / use context.** Buyers are teams and agents shipping data and ML pipelines who want every design record held to the same readiness bar before build-out, per use. The house's own RA data pipeline builds are an internal caller. What is sold is the deliverable — the readiness verdict with per-check evidence and recomputed totals/headrooms — never the underlying pipeline-engineering knowledge itself.

## Role views

### For integrators (Users)

Integrate against the two endpoints above with one scoped key per atom. Treat HTTP 200 as a judged result (read `verdict`, then `sections`, then `checks`), HTTP 422 as a client-side type bug (read `field`/`detail`, fix, resubmit), and 401/403/429 as auth/scope/rate problems respectively. Cache nothing about a verdict across manifests: the verdict is a pure function of the manifest you sent, so re-send after any manifest change. The worked examples below are real recorded request/response pairs — use example 1 as your golden-path fixture and example 3 as your 422-handling fixture.

### For developers

Manifest authoring: declare facts, do not target the verdict — computed checks re-derive totals, coverage and vocabulary membership from the declared values themselves, so inconsistent declarations fail on their own arithmetic. Determinism: the core is deterministic (Python oracle and TypeScript port, parity-proven locally per SERVICE.md); the same manifest returns a byte-identical REST response, and MCP structured content equals the REST report core. Implementation pointers: `src/` holds the atom's core, `tests/` its test suite, `SERVICE.md` is the normative field/check specification, and `contract.yaml` the machine-readable contract (key namespace/prefix, rate limits, pricing status). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract binding rule R1).

### For ops

Endpoints: REST `POST /v1/data-ml-pipeline-engineering` and MCP `POST /mcp/data-ml-pipeline-engineering` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope is per atom — a 403 spike means clients are calling with keys that lack this atom's scope, not an outage. Rate limits: 60/min and 10,000/day per key; watch 429s per key before raising limits. Error monitoring: alert on 5xx (none are part of this atom's documented behavior) and on 422 rate by `field` (a rising 422 rate on one field usually means a client manifest generator changed shape). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing is still pending (free during trial), so metering is for the cost ledger, not billing.

## Worked examples

Provenance: recorded 2026-11-16T02:44:00.806685+00:00 against gateway v1.1.0, external verification lane, source `verification/work/data-ml-pipeline-engineering/evidence.json`. Inputs and REST responses below are reproduced verbatim (pretty-printed with indent 2 only) and were verified mechanically against that evidence file after writing: each fenced block parses to a JSON value identical to the recorded value.

### Example 1 — Full-pass

Recorded expectation: HTTP 200, verdict `DATA_ML_PIPELINE_READY`.

Input (recorded `input`):

```json
{
  "entity": "test-pipeline-001",
  "features": {
    "feature_definitions_declared": true,
    "feature_store_only_when_justified": true,
    "label_definition_declared": true
  },
  "lifecycle": {
    "eval_suites_versioned_with_model": true,
    "model_card_covers_data_metrics_and_limits": true,
    "model_registry_entry_exists": true,
    "offline_eval_completed_before_prod": true,
    "rollout_plan_present_before_prod": true
  },
  "lineage": {
    "code_versioned": true,
    "config_versioned": true,
    "data_snapshots_versioned": true,
    "same_inputs_produce_same_outputs_verified": true,
    "source_to_transform_to_sink_tracked": true
  },
  "monitoring": {
    "alert_thresholds_set": true,
    "input_drift_monitored": true,
    "output_drift_monitored": true,
    "performance_decay_monitored_vs_baselines": true,
    "retraining_is_a_pipeline": true,
    "thresholds_tied_to_retraining_policy": true
  },
  "pipeline": {
    "backfill_tested_once": true,
    "exactly_once_effects_at_sinks": true,
    "explicit_step_dependencies": true,
    "failures_alert_and_retry": true,
    "schedules_documented": true,
    "steps_rerunnable_idempotently": true,
    "unrecorded_manual_reruns_present": false
  },
  "privacy": {
    "pii_in_training_data_without_lawful_basis": false
  },
  "quality": {
    "bad_partitions_quarantined": true,
    "freshness_checks_between_stages": true,
    "null_uniqueness_distribution_checks_between_stages": true,
    "pipeline_health_dashboard_present": true,
    "row_count_checks_between_stages": true
  },
  "serving": {
    "deployment_pattern_declared": true,
    "estimated_latency_ms": 100.0,
    "estimated_monthly_cost": 50.0,
    "latency_budget_ms": 200.0,
    "monthly_cost_budget": 100.0
  },
  "sources": {
    "bad_data_refused_loudly": true,
    "datasets": [
      {
        "name": "raw_logs",
        "rows": 100
      },
      {
        "name": "user_data",
        "rows": 50
      }
    ],
    "declared_total_rows": 150,
    "schemas_and_expectations_declared_for_all_inputs_and_outputs": true,
    "silent_coercion_present": false,
    "validation_on_arrival": true
  },
  "splits": {
    "class_balance_assessed": true,
    "declared_total_rows": 150,
    "eval_rows": 40,
    "leakage_checks_cover_time_target_and_cross_splits": true,
    "split_by_time_or_user_when_temporal": true,
    "test_rows": 30,
    "train_rows": 80
  },
  "training": {
    "reproducible_with_seeds_and_pinned_env": true
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "data-ml-pipeline-engineering",
  "atom_version": "0.1.0",
  "entity": "test-pipeline-001",
  "verdict": "DATA_ML_PIPELINE_READY",
  "sections": {
    "contracts_and_ingestion": "pass",
    "idempotency_and_orchestration": "pass",
    "quality_gates": "pass",
    "lineage_and_reproducibility": "pass",
    "ml_hygiene_and_splits": "pass",
    "lifecycle_and_serving": "pass",
    "monitoring_and_drift": "pass"
  },
  "checks": [
    {
      "section": "contracts_and_ingestion",
      "check": "source_entries_complete",
      "status": "pass",
      "evidence": "every source dataset entry carries a non-empty name and numeric rows"
    },
    {
      "section": "contracts_and_ingestion",
      "check": "total_rows_matches_sum_of_source_rows",
      "status": "pass",
      "evidence": "the declared total source rows equal the sum of the declared per-dataset rows"
    },
    {
      "section": "contracts_and_ingestion",
      "check": "schemas_and_expectations_declared",
      "status": "pass",
      "evidence": "method step 1: schemas and expectations (types, ranges, nullability) are declared for every input and output"
    },
    {
      "section": "contracts_and_ingestion",
      "check": "validation_on_arrival",
      "status": "pass",
      "evidence": "method step 1: data is validated on arrival at every edge"
    },
    {
      "section": "contracts_and_ingestion",
      "check": "bad_data_refused_loudly",
      "status": "pass",
      "evidence": "method step 1: bad data is refused loudly, never accepted silently"
    },
    {
      "section": "contracts_and_ingestion",
      "check": "no_silent_coercion",
      "status": "pass",
      "evidence": "red line: data is never coerced silently"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "steps_rerunnable_idempotently",
      "status": "pass",
      "evidence": "method step 2 / quality gate: pipeline steps are rerunnable idempotently"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "exactly_once_effects_at_sinks",
      "status": "pass",
      "evidence": "method step 2: sinks have exactly-once effects (upserts/keys)"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "backfill_tested_once",
      "status": "pass",
      "evidence": "quality gate: a backfill was tested once — backfills are supported and cheap to rerun"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "explicit_step_dependencies",
      "status": "pass",
      "evidence": "method step 3: step dependencies are explicit"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "schedules_documented",
      "status": "pass",
      "evidence": "method step 3: schedules are documented"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "failures_alert_and_retry",
      "status": "pass",
      "evidence": "method step 3: failures alert and retry safely"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "no_unrecorded_manual_reruns",
      "status": "pass",
      "evidence": "method step 3: there are no unrecorded 'just rerun it' habits"
    },
    {
      "section": "quality_gates",
      "check": "row_count_checks_between_stages",
      "status": "pass",
      "evidence": "method step 4: row count checks run between stages"
    },
    {
      "section": "quality_gates",
      "check": "freshness_checks_between_stages",
      "status": "pass",
      "evidence": "method step 4: freshness checks run between stages"
    },
    {
      "section": "quality_gates",
      "check": "null_uniqueness_distribution_checks_between_stages",
      "status": "pass",
      "evidence": "method step 4: null, uniqueness and distribution checks run between stages"
    },
    {
      "section": "quality_gates",
      "check": "bad_partitions_quarantined",
      "status": "pass",
      "evidence": "method step 4: bad partitions are quarantined, not passed downstream"
    },
    {
      "section": "quality_gates",
      "check": "pipeline_health_dashboard_present",
      "status": "pass",
      "evidence": "method step 4: a pipeline-health dashboard exists"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "source_to_transform_to_sink_lineage_tracked",
      "status": "pass",
      "evidence": "method step 5: lineage is tracked from source through transform to sink"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "code_versioned",
      "status": "pass",
      "evidence": "method step 5: code is versioned"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "config_versioned",
      "status": "pass",
      "evidence": "method step 5: config is versioned"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "data_snapshots_versioned",
      "status": "pass",
      "evidence": "method step 5: data snapshots are versioned where it matters"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "same_inputs_produce_same_outputs_verified",
      "status": "pass",
      "evidence": "method step 5: the same inputs produce the same outputs — verified, not assumed"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "training_reproducible_with_seeds_and_pinned_env",
      "status": "pass",
      "evidence": "method step 7 / quality gate: training is reproducible — seeds recorded and the environment pinned"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "split_total_matches_sum_of_split_rows",
      "status": "pass",
      "evidence": "method step 6: the declared total split rows equal the declared train rows plus eval rows plus test rows (the skill states no split ratio, so none is imposed here)"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "leakage_checks_cover_time_target_and_cross_splits",
      "status": "pass",
      "evidence": "method step 6: leakage checks cover time, target and cross-split leakage"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "split_by_time_or_user_when_temporal",
      "status": "pass",
      "evidence": "method step 6: data is split by time or user when reality is temporal"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "class_balance_assessed",
      "status": "pass",
      "evidence": "method step 6: class balance is assessed — awareness is declared, no ratio is imposed"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "feature_definitions_declared",
      "status": "pass",
      "evidence": "method step 6: feature definitions are declared"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "label_definition_declared",
      "status": "pass",
      "evidence": "method step 6: the label definition is declared"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "feature_store_only_when_justified",
      "status": "pass",
      "evidence": "method step 6: a feature store is used only when justified"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "no_pii_in_training_data_without_lawful_basis",
      "status": "pass",
      "evidence": "red line: no PII is in training data without a lawful basis"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "eval_suites_versioned_with_model",
      "status": "pass",
      "evidence": "method step 7: eval suites are versioned with the model"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "model_registry_entry_exists",
      "status": "pass",
      "evidence": "method step 7 / quality gate: a registry entry exists for the model"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "model_card_covers_data_metrics_and_limits",
      "status": "pass",
      "evidence": "method step 7 / quality gate: a model card exists covering data, metrics and limits"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "offline_eval_completed_before_prod",
      "status": "pass",
      "evidence": "red line: offline eval is completed before a model goes to prod"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "rollout_plan_present_before_prod",
      "status": "pass",
      "evidence": "red line: a rollout plan exists before a model goes to prod"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "deployment_pattern_declared",
      "status": "pass",
      "evidence": "method step 7: the deployment pattern (batch vs service) is declared"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "latency_within_caller_declared_budget",
      "status": "pass",
      "evidence": "method step 7: the declared estimated latency does not exceed the latency budget the caller itself declares (the skill states no latency number, so none is imposed here)"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "cost_within_caller_declared_budget",
      "status": "pass",
      "evidence": "method step 7: the declared estimated monthly cost does not exceed the monthly cost budget the caller itself declares (the skill states no cost number, so none is imposed here)"
    },
    {
      "section": "monitoring_and_drift",
      "check": "input_drift_monitored",
      "status": "pass",
      "evidence": "method step 8: input drift is monitored"
    },
    {
      "section": "monitoring_and_drift",
      "check": "output_drift_monitored",
      "status": "pass",
      "evidence": "method step 8: output drift is monitored"
    },
    {
      "section": "monitoring_and_drift",
      "check": "performance_decay_monitored_vs_baselines",
      "status": "pass",
      "evidence": "method step 8: performance decay is monitored against baselines"
    },
    {
      "section": "monitoring_and_drift",
      "check": "alert_thresholds_set",
      "status": "pass",
      "evidence": "quality gate: drift and performance monitoring is live with alert thresholds — the threshold values are the caller's, none is imposed here"
    },
    {
      "section": "monitoring_and_drift",
      "check": "thresholds_tied_to_retraining_policy",
      "status": "pass",
      "evidence": "method step 8: alert thresholds are tied to a retraining policy"
    },
    {
      "section": "monitoring_and_drift",
      "check": "retraining_is_a_pipeline",
      "status": "pass",
      "evidence": "method step 8: retraining is a pipeline, not a heroic weekend"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "sources_evaluated": 2,
  "computed_total_rows": "150.000000",
  "total_rows_difference": "0.000000",
  "computed_split_total_rows": "150.000000",
  "split_total_difference": "0.000000",
  "latency_headroom_ms": "100.000000",
  "monthly_cost_headroom": "50.000000",
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across seven sections.",
  "stamp": "DATA/ML PIPELINE ENGINEERING\nentity: test-pipeline-001\nVERDICT: DATA_ML_PIPELINE_READY\n  contracts_and_ingestion      pass\n  idempotency_and_orchestration pass\n  quality_gates                pass\n  lineage_and_reproducibility  pass\n  ml_hygiene_and_splits        pass\n  lifecycle_and_serving        pass\n  monitoring_and_drift         pass\n46 pass, 0 fail, 0 missing of 46 checks across seven sections."
}
```

### Example 2 — Violations

Recorded expectation: HTTP 200, verdict `DATA_ML_PIPELINE_NOT_READY`.

Input (recorded `input`):

```json
{
  "entity": "test-pipeline-001",
  "features": {
    "feature_definitions_declared": true,
    "feature_store_only_when_justified": true,
    "label_definition_declared": true
  },
  "lifecycle": {
    "eval_suites_versioned_with_model": true,
    "model_card_covers_data_metrics_and_limits": true,
    "model_registry_entry_exists": true,
    "offline_eval_completed_before_prod": true,
    "rollout_plan_present_before_prod": true
  },
  "lineage": {
    "code_versioned": true,
    "config_versioned": true,
    "data_snapshots_versioned": true,
    "same_inputs_produce_same_outputs_verified": true,
    "source_to_transform_to_sink_tracked": true
  },
  "monitoring": {
    "alert_thresholds_set": true,
    "input_drift_monitored": true,
    "output_drift_monitored": true,
    "performance_decay_monitored_vs_baselines": true,
    "retraining_is_a_pipeline": true,
    "thresholds_tied_to_retraining_policy": true
  },
  "pipeline": {
    "backfill_tested_once": true,
    "exactly_once_effects_at_sinks": true,
    "explicit_step_dependencies": true,
    "failures_alert_and_retry": true,
    "schedules_documented": true,
    "steps_rerunnable_idempotently": true,
    "unrecorded_manual_reruns_present": false
  },
  "privacy": {
    "pii_in_training_data_without_lawful_basis": true
  },
  "quality": {
    "bad_partitions_quarantined": true,
    "freshness_checks_between_stages": true,
    "null_uniqueness_distribution_checks_between_stages": true,
    "pipeline_health_dashboard_present": true,
    "row_count_checks_between_stages": true
  },
  "serving": {
    "deployment_pattern_declared": true,
    "estimated_latency_ms": 500.0,
    "estimated_monthly_cost": 500.0,
    "latency_budget_ms": 200.0,
    "monthly_cost_budget": 100.0
  },
  "sources": {
    "bad_data_refused_loudly": true,
    "datasets": [
      {
        "name": "raw_logs",
        "rows": 100
      },
      {
        "name": "user_data",
        "rows": 50
      }
    ],
    "declared_total_rows": 999,
    "schemas_and_expectations_declared_for_all_inputs_and_outputs": true,
    "silent_coercion_present": true,
    "validation_on_arrival": true
  },
  "splits": {
    "class_balance_assessed": true,
    "declared_total_rows": 100,
    "eval_rows": 40,
    "leakage_checks_cover_time_target_and_cross_splits": true,
    "split_by_time_or_user_when_temporal": true,
    "test_rows": 30,
    "train_rows": 80
  },
  "training": {
    "reproducible_with_seeds_and_pinned_env": true
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "data-ml-pipeline-engineering",
  "atom_version": "0.1.0",
  "entity": "test-pipeline-001",
  "verdict": "DATA_ML_PIPELINE_NOT_READY",
  "sections": {
    "contracts_and_ingestion": "fail",
    "idempotency_and_orchestration": "pass",
    "quality_gates": "pass",
    "lineage_and_reproducibility": "pass",
    "ml_hygiene_and_splits": "fail",
    "lifecycle_and_serving": "fail",
    "monitoring_and_drift": "pass"
  },
  "checks": [
    {
      "section": "contracts_and_ingestion",
      "check": "source_entries_complete",
      "status": "pass",
      "evidence": "every source dataset entry carries a non-empty name and numeric rows"
    },
    {
      "section": "contracts_and_ingestion",
      "check": "total_rows_matches_sum_of_source_rows",
      "status": "fail",
      "evidence": "the declared total source rows equal the sum of the declared per-dataset rows"
    },
    {
      "section": "contracts_and_ingestion",
      "check": "schemas_and_expectations_declared",
      "status": "pass",
      "evidence": "method step 1: schemas and expectations (types, ranges, nullability) are declared for every input and output"
    },
    {
      "section": "contracts_and_ingestion",
      "check": "validation_on_arrival",
      "status": "pass",
      "evidence": "method step 1: data is validated on arrival at every edge"
    },
    {
      "section": "contracts_and_ingestion",
      "check": "bad_data_refused_loudly",
      "status": "pass",
      "evidence": "method step 1: bad data is refused loudly, never accepted silently"
    },
    {
      "section": "contracts_and_ingestion",
      "check": "no_silent_coercion",
      "status": "fail",
      "evidence": "red line: data is never coerced silently"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "steps_rerunnable_idempotently",
      "status": "pass",
      "evidence": "method step 2 / quality gate: pipeline steps are rerunnable idempotently"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "exactly_once_effects_at_sinks",
      "status": "pass",
      "evidence": "method step 2: sinks have exactly-once effects (upserts/keys)"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "backfill_tested_once",
      "status": "pass",
      "evidence": "quality gate: a backfill was tested once — backfills are supported and cheap to rerun"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "explicit_step_dependencies",
      "status": "pass",
      "evidence": "method step 3: step dependencies are explicit"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "schedules_documented",
      "status": "pass",
      "evidence": "method step 3: schedules are documented"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "failures_alert_and_retry",
      "status": "pass",
      "evidence": "method step 3: failures alert and retry safely"
    },
    {
      "section": "idempotency_and_orchestration",
      "check": "no_unrecorded_manual_reruns",
      "status": "pass",
      "evidence": "method step 3: there are no unrecorded 'just rerun it' habits"
    },
    {
      "section": "quality_gates",
      "check": "row_count_checks_between_stages",
      "status": "pass",
      "evidence": "method step 4: row count checks run between stages"
    },
    {
      "section": "quality_gates",
      "check": "freshness_checks_between_stages",
      "status": "pass",
      "evidence": "method step 4: freshness checks run between stages"
    },
    {
      "section": "quality_gates",
      "check": "null_uniqueness_distribution_checks_between_stages",
      "status": "pass",
      "evidence": "method step 4: null, uniqueness and distribution checks run between stages"
    },
    {
      "section": "quality_gates",
      "check": "bad_partitions_quarantined",
      "status": "pass",
      "evidence": "method step 4: bad partitions are quarantined, not passed downstream"
    },
    {
      "section": "quality_gates",
      "check": "pipeline_health_dashboard_present",
      "status": "pass",
      "evidence": "method step 4: a pipeline-health dashboard exists"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "source_to_transform_to_sink_lineage_tracked",
      "status": "pass",
      "evidence": "method step 5: lineage is tracked from source through transform to sink"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "code_versioned",
      "status": "pass",
      "evidence": "method step 5: code is versioned"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "config_versioned",
      "status": "pass",
      "evidence": "method step 5: config is versioned"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "data_snapshots_versioned",
      "status": "pass",
      "evidence": "method step 5: data snapshots are versioned where it matters"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "same_inputs_produce_same_outputs_verified",
      "status": "pass",
      "evidence": "method step 5: the same inputs produce the same outputs — verified, not assumed"
    },
    {
      "section": "lineage_and_reproducibility",
      "check": "training_reproducible_with_seeds_and_pinned_env",
      "status": "pass",
      "evidence": "method step 7 / quality gate: training is reproducible — seeds recorded and the environment pinned"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "split_total_matches_sum_of_split_rows",
      "status": "fail",
      "evidence": "method step 6: the declared total split rows equal the declared train rows plus eval rows plus test rows (the skill states no split ratio, so none is imposed here)"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "leakage_checks_cover_time_target_and_cross_splits",
      "status": "pass",
      "evidence": "method step 6: leakage checks cover time, target and cross-split leakage"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "split_by_time_or_user_when_temporal",
      "status": "pass",
      "evidence": "method step 6: data is split by time or user when reality is temporal"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "class_balance_assessed",
      "status": "pass",
      "evidence": "method step 6: class balance is assessed — awareness is declared, no ratio is imposed"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "feature_definitions_declared",
      "status": "pass",
      "evidence": "method step 6: feature definitions are declared"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "label_definition_declared",
      "status": "pass",
      "evidence": "method step 6: the label definition is declared"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "feature_store_only_when_justified",
      "status": "pass",
      "evidence": "method step 6: a feature store is used only when justified"
    },
    {
      "section": "ml_hygiene_and_splits",
      "check": "no_pii_in_training_data_without_lawful_basis",
      "status": "fail",
      "evidence": "red line: no PII is in training data without a lawful basis"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "eval_suites_versioned_with_model",
      "status": "pass",
      "evidence": "method step 7: eval suites are versioned with the model"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "model_registry_entry_exists",
      "status": "pass",
      "evidence": "method step 7 / quality gate: a registry entry exists for the model"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "model_card_covers_data_metrics_and_limits",
      "status": "pass",
      "evidence": "method step 7 / quality gate: a model card exists covering data, metrics and limits"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "offline_eval_completed_before_prod",
      "status": "pass",
      "evidence": "red line: offline eval is completed before a model goes to prod"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "rollout_plan_present_before_prod",
      "status": "pass",
      "evidence": "red line: a rollout plan exists before a model goes to prod"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "deployment_pattern_declared",
      "status": "pass",
      "evidence": "method step 7: the deployment pattern (batch vs service) is declared"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "latency_within_caller_declared_budget",
      "status": "fail",
      "evidence": "method step 7: the declared estimated latency does not exceed the latency budget the caller itself declares (the skill states no latency number, so none is imposed here)"
    },
    {
      "section": "lifecycle_and_serving",
      "check": "cost_within_caller_declared_budget",
      "status": "fail",
      "evidence": "method step 7: the declared estimated monthly cost does not exceed the monthly cost budget the caller itself declares (the skill states no cost number, so none is imposed here)"
    },
    {
      "section": "monitoring_and_drift",
      "check": "input_drift_monitored",
      "status": "pass",
      "evidence": "method step 8: input drift is monitored"
    },
    {
      "section": "monitoring_and_drift",
      "check": "output_drift_monitored",
      "status": "pass",
      "evidence": "method step 8: output drift is monitored"
    },
    {
      "section": "monitoring_and_drift",
      "check": "performance_decay_monitored_vs_baselines",
      "status": "pass",
      "evidence": "method step 8: performance decay is monitored against baselines"
    },
    {
      "section": "monitoring_and_drift",
      "check": "alert_thresholds_set",
      "status": "pass",
      "evidence": "quality gate: drift and performance monitoring is live with alert thresholds — the threshold values are the caller's, none is imposed here"
    },
    {
      "section": "monitoring_and_drift",
      "check": "thresholds_tied_to_retraining_policy",
      "status": "pass",
      "evidence": "method step 8: alert thresholds are tied to a retraining policy"
    },
    {
      "section": "monitoring_and_drift",
      "check": "retraining_is_a_pipeline",
      "status": "pass",
      "evidence": "method step 8: retraining is a pipeline, not a heroic weekend"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "sources_evaluated": 2,
  "computed_total_rows": "150.000000",
  "total_rows_difference": "849.000000",
  "computed_split_total_rows": "150.000000",
  "split_total_difference": "-50.000000",
  "latency_headroom_ms": "-300.000000",
  "monthly_cost_headroom": "-400.000000",
  "summary": "40 pass, 6 fail, 0 missing of 46 checks across seven sections.",
  "stamp": "DATA/ML PIPELINE ENGINEERING\nentity: test-pipeline-001\nVERDICT: DATA_ML_PIPELINE_NOT_READY\n  contracts_and_ingestion      fail\n  idempotency_and_orchestration pass\n  quality_gates                pass\n  lineage_and_reproducibility  pass\n  ml_hygiene_and_splits        fail\n  lifecycle_and_serving        fail\n  monitoring_and_drift         pass\n40 pass, 6 fail, 0 missing of 46 checks across seven sections."
}
```

### Example 3 — Malformed

Recorded expectation: HTTP 422, error `invalid_input` — never a verdict.

Input (recorded `input`):

```json
{
  "sources": {
    "declared_total_rows": "one-hundred"
  }
}
```

REST response (recorded `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "sources.declared_total_rows",
  "detail": "sources.declared_total_rows must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Output format | CommonMark markdown |
| Role views present | Integrators (Users): Yes · Developers: Yes · Ops: Yes · Regulators: N/A — although the record carries a PII/lawful-basis declaration, the verdict is a pipeline-design readiness audit of declared facts, not a privacy-compliance determination; SERVICE.md names no regulation and claims no audit-evidence status. |
| Checks named: documented / recorded | 46 / 46 |
| Verdict vocabulary complete | Yes — all 3 verdict values (DATA_ML_PIPELINE_NOT_READY, DATA_ML_PIPELINE_READY, INSUFFICIENT_EVIDENCE), section statuses, per-check statuses and `computed_status` values listed |
| Input reference typed | Yes — 54 fields, each with a type, grouped as SERVICE.md groups them |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/data-ml-pipeline-engineering/evidence.json` after writing |
