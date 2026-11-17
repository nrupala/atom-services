# Ml project framing review — documentation

**Ml project framing review** · slug `ml-project-framing-review` · deliverable type REVIEW · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/ml-project-framing-review/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment a15298eb9b7f40bf80d306cea4a33f80). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "Test Project"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "ml-project-framing-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the ML project framing manifest.** You declare a project-framing record for one ML project, made at the framing stage — before modeling — the atom audits the declared record, it does not frame the project itself or train or run a model (see Explanation). The recorded full-pass manifest declares the project `Test Project`: all five framing declarations `true` (problem statement defined, ML necessity assessed, a non-ML rule or heuristic considered, decision and action named, framing completed before modeling); a primary metric named and tied to a decision, with accuracy-for-its-own-sake not present; the baseline value written down, as a rule-or-heuristic benchmark, recorded before any complex build; one metric row, `m1`, with `decision_action` `update_threshold`, `tied_to_decision: true` and `baseline_recorded_before_modeling: true`; all five data-plan declarations and all four evaluation-plan declarations `true`; all five approach declarations `true`; the LLM/RAG gate `uses_llm_or_rag` `false` with the four gated fields declared `false` (they pass as not applicable); both serving declarations `true`; and all six red-line flags `false` (no chasing SOTA without a baseline, no evaluating on training data, no demo-driven development, no tuning on test, latency/cost not ignored, LLM output not treated as correct).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/ml-project-framing-review` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `ML_FRAMING_SOUND`: "43 pass, 0 fail, 0 missing of 43 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `metrics_count` is 1, and `tied_to_decision_coverage` and `baseline_recorded_coverage` are each `"1.000000"`, with all three row-name lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `ML_FRAMING_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "ml-project-framing-review"}`.
3. Call: `POST https://atoms.pipavia.com/v1/ml-project-framing-review` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format).

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/ml-project-framing-review` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `ml_project_framing_review`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `ML_FRAMING_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `no_accuracy_for_its_own_sake`, `every_metric_tied_to_decision`, `every_metric_names_decision_action`, `no_metric_name_duplicated`, and the summary reads "39 pass, 4 fail, 0 missing of 43 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `metrics_without_tied_decision` names `m1` — the appended second `m1` row declares `tied_to_decision: false` and `decision_action` `""` — `tied_to_decision_coverage` is `"0.500000"`, `duplicate_metric_names` is `["m1"]`, `metrics_count` is 2, and `metric.accuracy_for_its_own_sake_present` is declared `true`, failing `no_accuracy_for_its_own_sake`; section `metric_and_baseline_framing` reports `fail`, the other four `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "framing",
  "detail": "framing must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/ml-project-framing-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/ml-project-framing-review` — tool name `ml_project_framing_review`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `ml_project_framing_review` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `project` and the `metrics[]` string fields are noted as strings and `metrics` as a list there. Where SERVICE.md states no type — the section container objects (`framing`, `metric`, `baseline`, `data_plan`, `evaluation_plan`, `approach`, `llm`, `serving`, `red_lines`) and a `metrics[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `metrics` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `ML_FRAMING_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: ml_necessity_and_decision_framing

| Field | Type | Notes |
|---|---|---|
| `framing` | object | The framing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `framing.problem_statement_defined` | boolean | — |
| `framing.ml_necessity_assessed` | boolean | — |
| `framing.non_ml_rule_or_heuristic_considered` | boolean | — |
| `framing.decision_and_action_named` | boolean | — |
| `framing.framing_completed_before_modeling` | boolean | — |

#### Read by: metric_and_baseline_framing

| Field | Type | Notes |
|---|---|---|
| `metric` | object | The metric section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `metric.primary_metric_named` | boolean | — |
| `metric.metric_tied_to_decision` | boolean | — |
| `metric.accuracy_for_its_own_sake_present` | boolean | must be `false` to pass |
| `baseline` | object | The baseline section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `baseline.baseline_value_written_down` | boolean | — |
| `baseline.baseline_is_rule_or_heuristic_benchmark` | boolean | — |
| `baseline.baseline_recorded_before_complex_build` | boolean | — |
| `metrics` | list | list of metric-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `metrics[]` | object | One declared metric row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `metrics[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `metrics[].decision_action` | string | The action that changes based on the metric; must be present and non-empty per row (type stated in SERVICE.md) |
| `metrics[].tied_to_decision` | boolean | — |
| `metrics[].baseline_recorded_before_modeling` | boolean | — |

#### Read by: data_and_evaluation_plan

| Field | Type | Notes |
|---|---|---|
| `data_plan` | object | The data-plan section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `data_plan.provenance_plan_stated` | boolean | — |
| `data_plan.leakage_risks_identified` | boolean | — |
| `data_plan.split_honesty_strategy_planned` | boolean | — |
| `data_plan.never_tune_on_test_committed` | boolean | — |
| `data_plan.distribution_shift_risk_noted` | boolean | — |
| `evaluation_plan` | object | The evaluation-plan section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `evaluation_plan.evaluation_designed_before_modeling` | boolean | — |
| `evaluation_plan.offline_online_gap_acknowledged` | boolean | — |
| `evaluation_plan.online_check_planned` | boolean | — |
| `evaluation_plan.ablation_planned` | boolean | — |

#### Read by: approach_reproducibility_and_llm_framing

| Field | Type | Notes |
|---|---|---|
| `approach` | object | The approach section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `approach.start_simple_first_step_named` | boolean | — |
| `approach.complexity_must_earn_keep_accepted` | boolean | — |
| `approach.reproducibility_plan_stated` | boolean | — |
| `approach.uncertainty_reporting_planned` | boolean | — |
| `approach.worst_case_failure_analysis_planned` | boolean | — |
| `llm` | object | The LLM section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `llm.uses_llm_or_rag` | boolean | The applicability gate for the four LLM/RAG checks below |
| `llm.retrieval_quality_prioritized_over_model_size` | boolean | gated — applies only when `uses_llm_or_rag` is `true` |
| `llm.golden_set_evaluation_planned` | boolean | gated, as above |
| `llm.grounding_citation_and_idk_required` | boolean | gated, as above |
| `llm.prompts_versioned_with_changelog` | boolean | gated, as above |
| `serving` | object | The serving section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `serving.local_first_serving_options_considered` | boolean | — |
| `serving.latency_and_cost_budget_considered` | boolean | — |

#### Read by: anti_pattern_red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.chasing_sota_without_baseline_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.evaluating_on_training_data_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.demo_driven_development_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.tuning_on_test_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.latency_cost_ignored_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.llm_output_treated_as_correct_present` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

All 43 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: ml_necessity_and_decision_framing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `problem_statement_defined` | framing: the problem statement is defined before any modeling | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ml_necessity_assessed` | framing: whether this even needs ML is assessed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `non_ml_rule_or_heuristic_considered` | framing: a rule or heuristic alternative is considered — it is often enough | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `decision_and_action_named` | framing: the decision is named — what action changes based on the output | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `framing_completed_before_modeling` | framing: the framing is completed before modeling begins | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: metric_and_baseline_framing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `primary_metric_named` | metric: a primary metric is named at framing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `metric_tied_to_decision` | metric: the metric is tied to a decision | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_accuracy_for_its_own_sake` | metric: accuracy is not optimized for its own sake | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `baseline_value_written_down` | baseline: the baseline number is written down before building anything complex | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `baseline_is_rule_or_heuristic_benchmark` | baseline: the benchmark to beat is a rule or heuristic baseline | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `baseline_recorded_before_complex_build` | baseline: the baseline is recorded before any complex build begins | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `metrics_declared` | the declared record names its metrics — the metrics list is present and non-empty | Computed over the declared record. Pass: the `metrics` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_metric_tied_to_decision` | metric: every declared metric row is tied to a decision | Computed over the declared record. Pass: every declared metric row declares `tied_to_decision: true`. Fail: a row declares `tied_to_decision` present but not `true` (offending rows are named in `metrics_without_tied_decision`). Missing: the list is absent, or a row has `tied_to_decision` absent (such a row is missing evidence and does not appear in `metrics_without_tied_decision`). |
| `every_metric_names_decision_action` | metric: every declared metric row names the decision action it drives | Computed over the declared record. Pass: every declared metric row names a non-empty `decision_action` string. Fail: a row names an empty `decision_action`. Missing: the list is absent, or a row has `decision_action` absent (such a row is missing evidence). |
| `every_metric_baseline_recorded_before_modeling` | baseline: every declared metric row has its baseline recorded before modeling | Computed over the declared record. Pass: every declared metric row declares `baseline_recorded_before_modeling: true`. Fail: a row declares `baseline_recorded_before_modeling` present but not `true` (offending rows are named in `metrics_without_baseline_recorded`). Missing: the list is absent, or a row has `baseline_recorded_before_modeling` absent (such a row is missing evidence and does not appear in `metrics_without_baseline_recorded`). |
| `no_metric_name_duplicated` | metric: no declared metric name is owned by more than one metric row | Computed over the declared record. Pass: no declared metric `name` appears on more than one metric row. Fail: a `name` is declared on more than one row (duplicated names are named in `duplicate_metric_names`, in the order their second occurrence appears). Missing: the list is absent, or a row has `name` absent (such a row is missing evidence for this check). |

#### Section: data_and_evaluation_plan

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `provenance_plan_stated` | data plan: where the data comes from is stated at framing — provenance first | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `leakage_risks_identified` | data plan: leakage risks — could the label leak into features — are identified at framing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `split_honesty_strategy_planned` | data plan: an honest split strategy — strict train / validation / test separation, no temporal or group leakage — is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `never_tune_on_test_committed` | data plan: never tune on test is committed at framing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `distribution_shift_risk_noted` | data plan: distribution shift between training and serving is noted as a framing risk | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `evaluation_designed_before_modeling` | evaluation plan: evaluation is designed before modeling — evaluation before modeling | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `offline_online_gap_acknowledged` | evaluation plan: offline metrics are not online value — the gap is acknowledged | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `online_check_planned` | evaluation plan: an online check — A/B or shadow — is planned for anything that ships | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ablation_planned` | evaluation plan: ablation is planned — show which component actually drives the gain | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: approach_reproducibility_and_llm_framing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `start_simple_first_step_named` | approach: the first step is simple — linear / tree / baseline — and is named | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `complexity_must_earn_keep_accepted` | approach: complexity is added only when it earns its keep | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `reproducibility_plan_stated` | reproducibility plan: pin seeds, version data + config + code, log experiments — a result that cannot be reproduced is not a result | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uncertainty_reporting_planned` | approach: reporting uncertainty — confidence intervals, error bars, not just point metrics — is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `worst_case_failure_analysis_planned` | approach: failure analysis on the worst cases is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `llm_applicability_declared` | LLM/RAG framing: whether the project uses an LLM or RAG is declared — the LLM/RAG checks apply only when it does | Pass: `llm.uses_llm_or_rag` is present (either value). Missing: the field is absent. (SERVICE.md states no fail case for this gate check — it passes whenever the gate field is present.) |
| `retrieval_quality_prioritized_over_model_size` | LLM/RAG framing: retrieval quality beats model size — chunking, embeddings and reranking get the investment | Gated on `llm.uses_llm_or_rag`. Pass: the gate is declared `false` and the field itself is declared (passes as not applicable, whatever the field declares), or the gate is declared `true` and the field is declared `true`. Fail: the gate is declared `true` and the field is declared present but not `true`. Missing: the gate or the field itself is absent. |
| `golden_set_evaluation_planned` | LLM/RAG framing: evaluation against a golden set of question to expected-answer pairs is planned, with regressions tracked | Gated on `llm.uses_llm_or_rag`. Pass: the gate is declared `false` and the field itself is declared (passes as not applicable, whatever the field declares), or the gate is declared `true` and the field is declared `true`. Fail: the gate is declared `true` and the field is declared present but not `true`. Missing: the gate or the field itself is absent. |
| `grounding_citation_and_idk_required` | LLM/RAG framing: answers are grounded in retrieved context, sources are cited, and I don't know is preferred over confident fabrication | Gated on `llm.uses_llm_or_rag`. Pass: the gate is declared `false` and the field itself is declared (passes as not applicable, whatever the field declares), or the gate is declared `true` and the field is declared `true`. Fail: the gate is declared `true` and the field is declared present but not `true`. Missing: the gate or the field itself is absent. |
| `prompts_versioned_with_changelog` | LLM/RAG framing: prompts are versioned like code, with a prompt/eval changelog | Gated on `llm.uses_llm_or_rag`. Pass: the gate is declared `false` and the field itself is declared (passes as not applicable, whatever the field declares), or the gate is declared `true` and the field is declared `true`. Fail: the gate is declared `true` and the field is declared present but not `true`. Missing: the gate or the field itself is absent. |
| `local_first_serving_options_considered` | serving framing: sovereign / local-first serving options are considered over locked-in cloud APIs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `latency_and_cost_budget_considered` | serving framing: latency and cost are considered at framing, not ignored | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: anti_pattern_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_chasing_sota_without_baseline` | red line: no chasing SOTA without a baseline is present in the framing | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_evaluating_on_training_data` | red line: no evaluating on training data is present in the framing | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_demo_driven_development` | red line: no demo-driven development is present in the framing | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_tuning_on_test` | red line: no tuning on test is present in the framing | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_latency_cost_ignored` | red line: latency and cost are not ignored in the framing | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_llm_output_treated_as_correct` | red line: an LLM's fluent output is not treated as correct output in the framing | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
### Output format

HTTP 200 returns one JSON object:

- `service` (`"ml-project-framing-review"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `metrics_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `metrics_without_tied_decision` (metrics whose `tied_to_decision` field is present but not `true`; a metric with the field absent is missing evidence and does not appear), `metrics_without_baseline_recorded` (metrics whose `baseline_recorded_before_modeling` field is present but not `true`) and `duplicate_metric_names` (metric names declared on more than one row, in the order their second occurrence appears) — all three lists are null when the `metrics` list is not declared, as recorded in the sparse case; and the ratios `tied_to_decision_coverage` (metrics tied to a decision ÷ declared metrics) and `baseline_recorded_coverage` (metrics with a baseline recorded before modeling ÷ declared metrics) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "43 pass, 0 fail, 0 missing of 43 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `ML_FRAMING_SOUND` — all 43 checks pass: the declared framing record is complete and consistent with the bound skill's framing sections and anti-patterns.
- `ML_FRAMING_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the five primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `metrics_count`, `metrics_without_tied_decision`, `tied_to_decision_coverage`, `metrics_without_baseline_recorded`, `baseline_recorded_coverage`, `duplicate_metric_names` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"framing","detail":"framing must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above).
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type REVIEW — this atom sells the review it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Frames AI and data projects rigorously — a baseline first, an honest metric, evaluation before modeling — so the work survives contact with reality (the bound capability, from the skill). You submit one declared record — the ML project framing manifest, made at the framing stage, before modeling — and the atom audits that record for completeness and internal consistency against the bound skill's framing sections and anti-patterns, returning one deterministic verdict across 5 sections (`ml_necessity_and_decision_framing`, `metric_and_baseline_framing`, `data_and_evaluation_plan`, `approach_reproducibility_and_llm_framing`, `anti_pattern_red_lines`). The atom sells that review — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Gated checks* read the four LLM/RAG fields through the `llm.uses_llm_or_rag` gate: `llm_applicability_declared` passes whenever the gate field is present (either value); each gated check is `missing` when the gate or the field itself is absent, passes as not applicable when the gate is declared `false` (whatever the field declares), and when the gate is declared `true` passes only when the field is declared `true`. *Computed checks* are calculated from the declared rows themselves — the declared `metrics` list must be present and non-empty, every metric row must declare `tied_to_decision: true`, must name a non-empty `decision_action`, and must declare `baseline_recorded_before_modeling: true`, and no declared metric `name` may appear on more than one row — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `ML_FRAMING_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `ML_FRAMING_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a baseline margin or improvement the model must beat (the skill says write the baseline number down and beat the benchmark — it states no margin, and whether a built model beat it is `applied-ml-validation`'s ground, not this atom's); a metric target, accuracy bar, or error-cost figure; a dataset size, row count, or class-balance bar; a latency millisecond or serving-cost budget number (the skill says do not ignore latency/cost — the budget itself is the caller's); a golden-set size or retrieval-quality score for LLM/RAG projects; a number of metrics, approaches, or candidate solutions a framing must contain beyond the one declared metrics list being non-empty; a coverage percentage below completeness. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** project-framing record: a verdict of `ML_FRAMING_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares ML necessity assessed, a baseline written down, and no SOTA-chasing passes those checks even if the real project did none of it. It is a completeness and consistency audit of the framing record the skill requires, **not ML engineering, a modeling service, or a prediction that the project will succeed**. Specifically: it frames no project itself, trains or runs no model, reads no training data, recomputes no metric or baseline, and does not verify that a declared plan was ever carried out. It never judges whether ML is genuinely the right choice, whether the named metric is the right metric, whether the baseline number is honest, or whether the plan is good — only that the record contains what the skill's framing sections and anti-patterns demand, and that its declared metric rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no judgment of framing *quality* — whether the problem framing, metric choice, or approach will work is the caller's declaration, checked only for declared presence and consistency; the skill's sovereign/local-first serving lean is checked only as *considered at framing* — this atom provisions no serving, selects no backend, and takes no position on any specific host, instance, or vendor named in the skill's own notes; LLM/RAG substance (whether retrieval is actually good, whether a golden set is representative) is a caller declaration — only its declared planned presence is checked.

**Buyer and use context.** Teams and agents working in Engineering & code who need this review on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Research Analyst model framing (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared ML project-framing record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly that it is not ML engineering, a modeling service, or a prediction that the project will succeed, and that it trains or runs no model and verifies no declared plan was ever carried out. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `ml_project_framing_review` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/ml_project_framing_review.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_ml_project_framing_review.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/ml-project-framing-review` (REST) and `POST /mcp/ml-project-framing-review` (MCP, tool `ml_project_framing_review`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment a15298eb9b7f40bf80d306cea4a33f80). Key scope: `ml_project_framing_review`. Rate limits: 60/minute, 10,000/day per key per atom (429 — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; an unset rate meters at zero (free-trial posture, per contract.yaml `pricing.rate: null` and USER-GUIDE.md).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally**, “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the anti-pattern / red-line checks, the LLM applicability gate and the computed checks. Recorded check names used verbatim in the Checks section include `no_accuracy_for_its_own_sake` (input `metric.accuracy_for_its_own_sake_present`), `llm_applicability_declared` (input `llm.uses_llm_or_rag`), `no_chasing_sota_without_baseline` (input `red_lines.chasing_sota_without_baseline_present`), `no_evaluating_on_training_data` (input `red_lines.evaluating_on_training_data_present`), `no_demo_driven_development` (input `red_lines.demo_driven_development_present`), `no_tuning_on_test` (input `red_lines.tuning_on_test_present`), `no_latency_cost_ignored` (input `red_lines.latency_cost_ignored_present`) and `no_llm_output_treated_as_correct` (input `red_lines.llm_output_treated_as_correct_present`), plus the computed checks `metrics_declared`, `every_metric_tied_to_decision`, `every_metric_names_decision_action`, `every_metric_baseline_recorded_before_modeling` and `no_metric_name_duplicated`, which read the `metrics` rows rather than any single input field.
3. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 43 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
4. **Section grouping vs input objects:** the recorded sections merge separate input objects — `metric`, `baseline` and `metrics` inputs are read by the single recorded section `metric_and_baseline_framing`, `data_plan` and `evaluation_plan` inputs are read by the single recorded section `data_and_evaluation_plan`, and `approach`, `llm` and `serving` inputs are read by the single recorded section `approach_reproducibility_and_llm_framing`. This document groups the Input reference and the Checks by the recorded section names.
5. **Null lists on an undeclared `metrics` list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `metrics_count` and the coverage ratios, but does not state a null rule for the three row-name lists. The recorded sparse response returns all three lists as `null` when `metrics` is not declared (as USER-GUIDE.md also states); this document follows the recording.
6. **Documentation absence at verification time:** TEST-REPORT.md records that at verification time `GET https://atoms.pipavia.com/docs/ml-project-framing-review` returned 404 and the catalogue entry carried no `documentation` key, and states that absence was designed — Batch 16's WS1 documentation pass follows that wave. This document is that WS1 pass; the recorded 404 describes the state at verification time, not the state after this document is written.

## Worked examples

Provenance: recorded 2026-11-16T07:36:58.331961+00:00 against gateway v1.1.0, external verification lane, source `verification/work/ml-project-framing-review/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T07:36:58.331961+00:00 · gateway v1.1.0 · source `verification/work/ml-project-framing-review/evidence.json`.

Input:

```json
{
  "project": "Test Project",
  "framing": {
    "problem_statement_defined": true,
    "ml_necessity_assessed": true,
    "non_ml_rule_or_heuristic_considered": true,
    "decision_and_action_named": true,
    "framing_completed_before_modeling": true
  },
  "metric": {
    "primary_metric_named": true,
    "metric_tied_to_decision": true,
    "accuracy_for_its_own_sake_present": false
  },
  "metrics": [
    {
      "name": "m1",
      "decision_action": "update_threshold",
      "tied_to_decision": true,
      "baseline_recorded_before_modeling": true
    }
  ],
  "data_plan": {
    "provenance_plan_stated": true,
    "leakage_risks_identified": true,
    "split_honesty_strategy_planned": true,
    "never_tune_on_test_committed": true,
    "distribution_shift_risk_noted": true
  },
  "evaluation_plan": {
    "evaluation_designed_before_modeling": true,
    "offline_online_gap_acknowledged": true,
    "online_check_planned": true,
    "ablation_planned": true
  },
  "approach": {
    "start_simple_first_step_named": true,
    "complexity_must_earn_keep_accepted": true,
    "reproducibility_plan_stated": true,
    "uncertainty_reporting_planned": true,
    "worst_case_failure_analysis_planned": true
  },
  "llm": {
    "uses_llm_or_rag": false,
    "retrieval_quality_prioritized_over_model_size": false,
    "golden_set_evaluation_planned": false,
    "grounding_citation_and_idk_required": false,
    "prompts_versioned_with_changelog": false
  },
  "serving": {
    "local_first_serving_options_considered": true,
    "latency_and_cost_budget_considered": true
  },
  "red_lines": {
    "chasing_sota_without_baseline_present": false,
    "evaluating_on_training_data_present": false,
    "demo_driven_development_present": false,
    "tuning_on_test_present": false,
    "latency_cost_ignored_present": false,
    "llm_output_treated_as_correct_present": false
  },
  "baseline": {
    "baseline_value_written_down": true,
    "baseline_is_rule_or_heuristic_benchmark": true,
    "baseline_recorded_before_complex_build": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "ml-project-framing-review",
  "atom_version": "0.1.0",
  "project": "Test Project",
  "verdict": "ML_FRAMING_SOUND",
  "sections": {
    "ml_necessity_and_decision_framing": "pass",
    "metric_and_baseline_framing": "pass",
    "data_and_evaluation_plan": "pass",
    "approach_reproducibility_and_llm_framing": "pass",
    "anti_pattern_red_lines": "pass"
  },
  "checks": [
    {
      "section": "ml_necessity_and_decision_framing",
      "check": "problem_statement_defined",
      "status": "pass",
      "evidence": "framing: the problem statement is defined before any modeling"
    },
    {
      "section": "ml_necessity_and_decision_framing",
      "check": "ml_necessity_assessed",
      "status": "pass",
      "evidence": "framing: whether this even needs ML is assessed"
    },
    {
      "section": "ml_necessity_and_decision_framing",
      "check": "non_ml_rule_or_heuristic_considered",
      "status": "pass",
      "evidence": "framing: a rule or heuristic alternative is considered — it is often enough"
    },
    {
      "section": "ml_necessity_and_decision_framing",
      "check": "decision_and_action_named",
      "status": "pass",
      "evidence": "framing: the decision is named — what action changes based on the output"
    },
    {
      "section": "ml_necessity_and_decision_framing",
      "check": "framing_completed_before_modeling",
      "status": "pass",
      "evidence": "framing: the framing is completed before modeling begins"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "primary_metric_named",
      "status": "pass",
      "evidence": "metric: a primary metric is named at framing"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "metric_tied_to_decision",
      "status": "pass",
      "evidence": "metric: the metric is tied to a decision"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "no_accuracy_for_its_own_sake",
      "status": "pass",
      "evidence": "metric: accuracy is not optimized for its own sake"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "baseline_value_written_down",
      "status": "pass",
      "evidence": "baseline: the baseline number is written down before building anything complex"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "baseline_is_rule_or_heuristic_benchmark",
      "status": "pass",
      "evidence": "baseline: the benchmark to beat is a rule or heuristic baseline"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "baseline_recorded_before_complex_build",
      "status": "pass",
      "evidence": "baseline: the baseline is recorded before any complex build begins"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "metrics_declared",
      "status": "pass",
      "evidence": "the declared record names its metrics — the metrics list is present and non-empty"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "every_metric_tied_to_decision",
      "status": "pass",
      "evidence": "metric: every declared metric row is tied to a decision"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "every_metric_names_decision_action",
      "status": "pass",
      "evidence": "metric: every declared metric row names the decision action it drives"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "every_metric_baseline_recorded_before_modeling",
      "status": "pass",
      "evidence": "baseline: every declared metric row has its baseline recorded before modeling"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "no_metric_name_duplicated",
      "status": "pass",
      "evidence": "metric: no declared metric name is owned by more than one metric row"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "provenance_plan_stated",
      "status": "pass",
      "evidence": "data plan: where the data comes from is stated at framing — provenance first"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "leakage_risks_identified",
      "status": "pass",
      "evidence": "data plan: leakage risks — could the label leak into features — are identified at framing"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "split_honesty_strategy_planned",
      "status": "pass",
      "evidence": "data plan: an honest split strategy — strict train / validation / test separation, no temporal or group leakage — is planned"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "never_tune_on_test_committed",
      "status": "pass",
      "evidence": "data plan: never tune on test is committed at framing"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "distribution_shift_risk_noted",
      "status": "pass",
      "evidence": "data plan: distribution shift between training and serving is noted as a framing risk"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "evaluation_designed_before_modeling",
      "status": "pass",
      "evidence": "evaluation plan: evaluation is designed before modeling — evaluation before modeling"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "offline_online_gap_acknowledged",
      "status": "pass",
      "evidence": "evaluation plan: offline metrics are not online value — the gap is acknowledged"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "online_check_planned",
      "status": "pass",
      "evidence": "evaluation plan: an online check — A/B or shadow — is planned for anything that ships"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "ablation_planned",
      "status": "pass",
      "evidence": "evaluation plan: ablation is planned — show which component actually drives the gain"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "start_simple_first_step_named",
      "status": "pass",
      "evidence": "approach: the first step is simple — linear / tree / baseline — and is named"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "complexity_must_earn_keep_accepted",
      "status": "pass",
      "evidence": "approach: complexity is added only when it earns its keep"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "reproducibility_plan_stated",
      "status": "pass",
      "evidence": "reproducibility plan: pin seeds, version data + config + code, log experiments — a result that cannot be reproduced is not a result"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "uncertainty_reporting_planned",
      "status": "pass",
      "evidence": "approach: reporting uncertainty — confidence intervals, error bars, not just point metrics — is planned"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "worst_case_failure_analysis_planned",
      "status": "pass",
      "evidence": "approach: failure analysis on the worst cases is planned"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "llm_applicability_declared",
      "status": "pass",
      "evidence": "LLM/RAG framing: whether the project uses an LLM or RAG is declared — the LLM/RAG checks apply only when it does"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "retrieval_quality_prioritized_over_model_size",
      "status": "pass",
      "evidence": "LLM/RAG framing: retrieval quality beats model size — chunking, embeddings and reranking get the investment"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "golden_set_evaluation_planned",
      "status": "pass",
      "evidence": "LLM/RAG framing: evaluation against a golden set of question to expected-answer pairs is planned, with regressions tracked"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "grounding_citation_and_idk_required",
      "status": "pass",
      "evidence": "LLM/RAG framing: answers are grounded in retrieved context, sources are cited, and I don't know is preferred over confident fabrication"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "prompts_versioned_with_changelog",
      "status": "pass",
      "evidence": "LLM/RAG framing: prompts are versioned like code, with a prompt/eval changelog"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "local_first_serving_options_considered",
      "status": "pass",
      "evidence": "serving framing: sovereign / local-first serving options are considered over locked-in cloud APIs"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "latency_and_cost_budget_considered",
      "status": "pass",
      "evidence": "serving framing: latency and cost are considered at framing, not ignored"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_chasing_sota_without_baseline",
      "status": "pass",
      "evidence": "red line: no chasing SOTA without a baseline is present in the framing"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_evaluating_on_training_data",
      "status": "pass",
      "evidence": "red line: no evaluating on training data is present in the framing"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_demo_driven_development",
      "status": "pass",
      "evidence": "red line: no demo-driven development is present in the framing"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_tuning_on_test",
      "status": "pass",
      "evidence": "red line: no tuning on test is present in the framing"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_latency_cost_ignored",
      "status": "pass",
      "evidence": "red line: latency and cost are not ignored in the framing"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_llm_output_treated_as_correct",
      "status": "pass",
      "evidence": "red line: an LLM's fluent output is not treated as correct output in the framing"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "metrics_count": 1,
  "metrics_without_tied_decision": [],
  "tied_to_decision_coverage": "1.000000",
  "metrics_without_baseline_recorded": [],
  "baseline_recorded_coverage": "1.000000",
  "duplicate_metric_names": [],
  "summary": "43 pass, 0 fail, 0 missing of 43 checks across five sections.",
  "stamp": "ML PROJECT FRAMING REVIEW\nproject: Test Project\nVERDICT: ML_FRAMING_SOUND\n  ml_necessity_and_decision_framing            pass\n  metric_and_baseline_framing                  pass\n  data_and_evaluation_plan                     pass\n  approach_reproducibility_and_llm_framing     pass\n  anti_pattern_red_lines                       pass\n43 pass, 0 fail, 0 missing of 43 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T07:36:58.331961+00:00 · gateway v1.1.0 · source `verification/work/ml-project-framing-review/evidence.json`.

Input:

```json
{
  "project": "Test Project",
  "framing": {
    "problem_statement_defined": true,
    "ml_necessity_assessed": true,
    "non_ml_rule_or_heuristic_considered": true,
    "decision_and_action_named": true,
    "framing_completed_before_modeling": true
  },
  "metric": {
    "primary_metric_named": true,
    "metric_tied_to_decision": true,
    "accuracy_for_its_own_sake_present": true
  },
  "metrics": [
    {
      "name": "m1",
      "decision_action": "update_threshold",
      "tied_to_decision": true,
      "baseline_recorded_before_modeling": true
    },
    {
      "name": "m1",
      "decision_action": "",
      "tied_to_decision": false,
      "baseline_recorded_before_modeling": true
    }
  ],
  "data_plan": {
    "provenance_plan_stated": true,
    "leakage_risks_identified": true,
    "split_honesty_strategy_planned": true,
    "never_tune_on_test_committed": true,
    "distribution_shift_risk_noted": true
  },
  "evaluation_plan": {
    "evaluation_designed_before_modeling": true,
    "offline_online_gap_acknowledged": true,
    "online_check_planned": true,
    "ablation_planned": true
  },
  "approach": {
    "start_simple_first_step_named": true,
    "complexity_must_earn_keep_accepted": true,
    "reproducibility_plan_stated": true,
    "uncertainty_reporting_planned": true,
    "worst_case_failure_analysis_planned": true
  },
  "llm": {
    "uses_llm_or_rag": false,
    "retrieval_quality_prioritized_over_model_size": false,
    "golden_set_evaluation_planned": false,
    "grounding_citation_and_idk_required": false,
    "prompts_versioned_with_changelog": false
  },
  "serving": {
    "local_first_serving_options_considered": true,
    "latency_and_cost_budget_considered": true
  },
  "red_lines": {
    "chasing_sota_without_baseline_present": false,
    "evaluating_on_training_data_present": false,
    "demo_driven_development_present": false,
    "tuning_on_test_present": false,
    "latency_cost_ignored_present": false,
    "llm_output_treated_as_correct_present": false
  },
  "baseline": {
    "baseline_value_written_down": true,
    "baseline_is_rule_or_heuristic_benchmark": true,
    "baseline_recorded_before_complex_build": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "ml-project-framing-review",
  "atom_version": "0.1.0",
  "project": "Test Project",
  "verdict": "ML_FRAMING_NOT_SOUND",
  "sections": {
    "ml_necessity_and_decision_framing": "pass",
    "metric_and_baseline_framing": "fail",
    "data_and_evaluation_plan": "pass",
    "approach_reproducibility_and_llm_framing": "pass",
    "anti_pattern_red_lines": "pass"
  },
  "checks": [
    {
      "section": "ml_necessity_and_decision_framing",
      "check": "problem_statement_defined",
      "status": "pass",
      "evidence": "framing: the problem statement is defined before any modeling"
    },
    {
      "section": "ml_necessity_and_decision_framing",
      "check": "ml_necessity_assessed",
      "status": "pass",
      "evidence": "framing: whether this even needs ML is assessed"
    },
    {
      "section": "ml_necessity_and_decision_framing",
      "check": "non_ml_rule_or_heuristic_considered",
      "status": "pass",
      "evidence": "framing: a rule or heuristic alternative is considered — it is often enough"
    },
    {
      "section": "ml_necessity_and_decision_framing",
      "check": "decision_and_action_named",
      "status": "pass",
      "evidence": "framing: the decision is named — what action changes based on the output"
    },
    {
      "section": "ml_necessity_and_decision_framing",
      "check": "framing_completed_before_modeling",
      "status": "pass",
      "evidence": "framing: the framing is completed before modeling begins"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "primary_metric_named",
      "status": "pass",
      "evidence": "metric: a primary metric is named at framing"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "metric_tied_to_decision",
      "status": "pass",
      "evidence": "metric: the metric is tied to a decision"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "no_accuracy_for_its_own_sake",
      "status": "fail",
      "evidence": "metric: accuracy is not optimized for its own sake"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "baseline_value_written_down",
      "status": "pass",
      "evidence": "baseline: the baseline number is written down before building anything complex"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "baseline_is_rule_or_heuristic_benchmark",
      "status": "pass",
      "evidence": "baseline: the benchmark to beat is a rule or heuristic baseline"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "baseline_recorded_before_complex_build",
      "status": "pass",
      "evidence": "baseline: the baseline is recorded before any complex build begins"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "metrics_declared",
      "status": "pass",
      "evidence": "the declared record names its metrics — the metrics list is present and non-empty"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "every_metric_tied_to_decision",
      "status": "fail",
      "evidence": "metric: every declared metric row is tied to a decision"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "every_metric_names_decision_action",
      "status": "fail",
      "evidence": "metric: every declared metric row names the decision action it drives"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "every_metric_baseline_recorded_before_modeling",
      "status": "pass",
      "evidence": "baseline: every declared metric row has its baseline recorded before modeling"
    },
    {
      "section": "metric_and_baseline_framing",
      "check": "no_metric_name_duplicated",
      "status": "fail",
      "evidence": "metric: no declared metric name is owned by more than one metric row"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "provenance_plan_stated",
      "status": "pass",
      "evidence": "data plan: where the data comes from is stated at framing — provenance first"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "leakage_risks_identified",
      "status": "pass",
      "evidence": "data plan: leakage risks — could the label leak into features — are identified at framing"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "split_honesty_strategy_planned",
      "status": "pass",
      "evidence": "data plan: an honest split strategy — strict train / validation / test separation, no temporal or group leakage — is planned"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "never_tune_on_test_committed",
      "status": "pass",
      "evidence": "data plan: never tune on test is committed at framing"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "distribution_shift_risk_noted",
      "status": "pass",
      "evidence": "data plan: distribution shift between training and serving is noted as a framing risk"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "evaluation_designed_before_modeling",
      "status": "pass",
      "evidence": "evaluation plan: evaluation is designed before modeling — evaluation before modeling"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "offline_online_gap_acknowledged",
      "status": "pass",
      "evidence": "evaluation plan: offline metrics are not online value — the gap is acknowledged"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "online_check_planned",
      "status": "pass",
      "evidence": "evaluation plan: an online check — A/B or shadow — is planned for anything that ships"
    },
    {
      "section": "data_and_evaluation_plan",
      "check": "ablation_planned",
      "status": "pass",
      "evidence": "evaluation plan: ablation is planned — show which component actually drives the gain"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "start_simple_first_step_named",
      "status": "pass",
      "evidence": "approach: the first step is simple — linear / tree / baseline — and is named"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "complexity_must_earn_keep_accepted",
      "status": "pass",
      "evidence": "approach: complexity is added only when it earns its keep"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "reproducibility_plan_stated",
      "status": "pass",
      "evidence": "reproducibility plan: pin seeds, version data + config + code, log experiments — a result that cannot be reproduced is not a result"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "uncertainty_reporting_planned",
      "status": "pass",
      "evidence": "approach: reporting uncertainty — confidence intervals, error bars, not just point metrics — is planned"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "worst_case_failure_analysis_planned",
      "status": "pass",
      "evidence": "approach: failure analysis on the worst cases is planned"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "llm_applicability_declared",
      "status": "pass",
      "evidence": "LLM/RAG framing: whether the project uses an LLM or RAG is declared — the LLM/RAG checks apply only when it does"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "retrieval_quality_prioritized_over_model_size",
      "status": "pass",
      "evidence": "LLM/RAG framing: retrieval quality beats model size — chunking, embeddings and reranking get the investment"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "golden_set_evaluation_planned",
      "status": "pass",
      "evidence": "LLM/RAG framing: evaluation against a golden set of question to expected-answer pairs is planned, with regressions tracked"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "grounding_citation_and_idk_required",
      "status": "pass",
      "evidence": "LLM/RAG framing: answers are grounded in retrieved context, sources are cited, and I don't know is preferred over confident fabrication"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "prompts_versioned_with_changelog",
      "status": "pass",
      "evidence": "LLM/RAG framing: prompts are versioned like code, with a prompt/eval changelog"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "local_first_serving_options_considered",
      "status": "pass",
      "evidence": "serving framing: sovereign / local-first serving options are considered over locked-in cloud APIs"
    },
    {
      "section": "approach_reproducibility_and_llm_framing",
      "check": "latency_and_cost_budget_considered",
      "status": "pass",
      "evidence": "serving framing: latency and cost are considered at framing, not ignored"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_chasing_sota_without_baseline",
      "status": "pass",
      "evidence": "red line: no chasing SOTA without a baseline is present in the framing"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_evaluating_on_training_data",
      "status": "pass",
      "evidence": "red line: no evaluating on training data is present in the framing"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_demo_driven_development",
      "status": "pass",
      "evidence": "red line: no demo-driven development is present in the framing"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_tuning_on_test",
      "status": "pass",
      "evidence": "red line: no tuning on test is present in the framing"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_latency_cost_ignored",
      "status": "pass",
      "evidence": "red line: latency and cost are not ignored in the framing"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_llm_output_treated_as_correct",
      "status": "pass",
      "evidence": "red line: an LLM's fluent output is not treated as correct output in the framing"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "metrics_count": 2,
  "metrics_without_tied_decision": [
    "m1"
  ],
  "tied_to_decision_coverage": "0.500000",
  "metrics_without_baseline_recorded": [],
  "baseline_recorded_coverage": "1.000000",
  "duplicate_metric_names": [
    "m1"
  ],
  "summary": "39 pass, 4 fail, 0 missing of 43 checks across five sections.",
  "stamp": "ML PROJECT FRAMING REVIEW\nproject: Test Project\nVERDICT: ML_FRAMING_NOT_SOUND\n  ml_necessity_and_decision_framing            pass\n  metric_and_baseline_framing                  fail\n  data_and_evaluation_plan                     pass\n  approach_reproducibility_and_llm_framing     pass\n  anti_pattern_red_lines                       pass\n39 pass, 4 fail, 0 missing of 43 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T07:36:58.331961+00:00 · gateway v1.1.0 · source `verification/work/ml-project-framing-review/evidence.json`.

Input:

```json
{
  "project": "Malformed Project",
  "framing": "not_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "framing",
  "detail": "framing must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared ML project-framing record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not ML engineering, a modeling service or a prediction that the project will succeed, and it verifies no declared plan was ever carried out. |
| Checks named | 43 documented / 43 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`metrics_count`, the three row-name lists and the two coverage ratios) |
| Input reference typed | Yes — 54 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/ml-project-framing-review/evidence.json` |
