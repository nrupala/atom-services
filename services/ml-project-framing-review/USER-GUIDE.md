# ML project framing review — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are framing an AI / data project — before any modeling — and you want the framing to survive contact with reality: ML necessity assessed, a non-ML alternative considered, the decision and action named, a baseline written down first, an honest metric tied to a decision, data and evaluation planned up front, and the skill's anti-patterns refused. This atom reads one declared project-framing manifest and returns one deterministic verdict across five sections: **ML_FRAMING_SOUND**, **ML_FRAMING_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it frames no project itself, trains or runs no model, reads no training data, recomputes no metric or baseline, and does not verify that a declared plan was ever carried out. A framing is sound *on your declared evidence*: it never judges whether ML is genuinely the right choice, whether the named metric is the right metric, whether the baseline number is honest, or whether the plan is good. Computed checks: the declared `metrics` list must be present and non-empty; every metric row must declare `tied_to_decision: true`, must name a non-empty `decision_action`, and must declare `baseline_recorded_before_modeling: true`; and no declared metric `name` may appear on more than one row. The four LLM/RAG checks are gated on `llm.uses_llm_or_rag`: they pass as not applicable when the gate is declared `false`, and when the gate is `true` each passes only when its field is declared `true`. No numeric threshold is imposed — no baseline margin or improvement the model must beat, no metric target, accuracy bar or error-cost figure, no dataset size, row count or class-balance bar, no latency millisecond or serving-cost budget number, no golden-set size or retrieval-quality score, no number of metrics or approaches beyond the one declared metrics list being non-empty, and no coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "ml-project-framing-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/ml-project-framing-review` — tool name `ml_project_framing_review`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/ml-project-framing-review` — body = the manifest object; same `Authorization` header.

## Input — the ML project framing manifest

| Field | Meaning |
|---|---|
| `project` | project name (string; carried into the output, not checked) |
| `framing.problem_statement_defined` | framing evidence: the problem statement is defined before any modeling |
| `framing.ml_necessity_assessed` | framing evidence: whether this even needs ML is assessed |
| `framing.non_ml_rule_or_heuristic_considered` | framing evidence: a rule or heuristic alternative is considered |
| `framing.decision_and_action_named` | framing evidence: the decision is named — what action changes based on the output |
| `framing.framing_completed_before_modeling` | framing evidence: the framing is completed before modeling begins |
| `metric.primary_metric_named` | metric evidence: a primary metric is named at framing |
| `metric.metric_tied_to_decision` | metric evidence: the metric is tied to a decision |
| `metric.accuracy_for_its_own_sake_present` | must be `false` to pass (metric line: accuracy is not optimized for its own sake) |
| `baseline.baseline_value_written_down` | baseline evidence: the baseline number is written down before building anything complex |
| `baseline.baseline_is_rule_or_heuristic_benchmark` | baseline evidence: the benchmark to beat is a rule or heuristic baseline |
| `baseline.baseline_recorded_before_complex_build` | baseline evidence: the baseline is recorded before any complex build begins |
| `metrics` (list of metric-row objects) | computed: must be present and non-empty; reported as `metrics_count` |
| `metrics[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row (reported in `duplicate_metric_names`) |
| `metrics[].decision_action` (string) | the action that changes based on the metric; computed: every row must name a non-empty action |
| `metrics[].tied_to_decision` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `metrics_without_tied_decision` |
| `metrics[].baseline_recorded_before_modeling` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `metrics_without_baseline_recorded` |
| `data_plan.provenance_plan_stated` | data-plan evidence: a provenance plan is stated |
| `data_plan.leakage_risks_identified` | data-plan evidence: leakage risks are identified |
| `data_plan.split_honesty_strategy_planned` | data-plan evidence: a split-honesty strategy is planned |
| `data_plan.never_tune_on_test_committed` | data-plan evidence: a never-tune-on-test commitment is made |
| `data_plan.distribution_shift_risk_noted` | data-plan evidence: distribution-shift risk is noted |
| `evaluation_plan.evaluation_designed_before_modeling` | evaluation-plan evidence: evaluation is designed before modeling |
| `evaluation_plan.offline_online_gap_acknowledged` | evaluation-plan evidence: the offline/online gap is acknowledged |
| `evaluation_plan.online_check_planned` | evaluation-plan evidence: an online check is planned |
| `evaluation_plan.ablation_planned` | evaluation-plan evidence: an ablation is planned |
| `approach.start_simple_first_step_named` | approach evidence: a start-simple first step is named |
| `approach.complexity_must_earn_keep_accepted` | approach evidence: complexity must earn its keep is accepted |
| `approach.reproducibility_plan_stated` | approach evidence: a reproducibility plan is stated |
| `approach.uncertainty_reporting_planned` | approach evidence: uncertainty reporting is planned |
| `approach.worst_case_failure_analysis_planned` | approach evidence: worst-case failure analysis is planned |
| `llm.uses_llm_or_rag` | the applicability gate for the four LLM/RAG fields below |
| `llm.retrieval_quality_prioritized_over_model_size` | gated LLM evidence: retrieval quality is prioritized over model size (applies only when the gate is `true`; passes as not applicable when the gate is `false`) |
| `llm.golden_set_evaluation_planned` | gated LLM evidence: golden-set evaluation is planned (gated, as above) |
| `llm.grounding_citation_and_idk_required` | gated LLM evidence: grounding, citation and IDK are required (gated, as above) |
| `llm.prompts_versioned_with_changelog` | gated LLM evidence: prompts are versioned with a changelog (gated, as above) |
| `serving.local_first_serving_options_considered` | serving evidence: local-first serving options are considered |
| `serving.latency_and_cost_budget_considered` | serving evidence: latency and cost budget are considered |
| `red_lines.chasing_sota_without_baseline_present` | must be `false` to pass (red line: no chasing SOTA without a baseline) |
| `red_lines.evaluating_on_training_data_present` | must be `false` to pass (red line: no evaluating on training data) |
| `red_lines.demo_driven_development_present` | must be `false` to pass (red line: no demo-driven development) |
| `red_lines.tuning_on_test_present` | must be `false` to pass (red line: no tuning on test) |
| `red_lines.latency_cost_ignored_present` | must be `false` to pass (red line: latency/cost is not ignored) |
| `red_lines.llm_output_treated_as_correct_present` | must be `false` to pass (red line: LLM output is not treated as correct) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE) — this includes a gated `llm` field absent even when the gate is `false`, so declare all four gated fields explicitly. A field present but false/invalid = the check fails (counts toward ML_FRAMING_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/ml-project-framing-review`:

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

Response — HTTP 200 (trimmed; the full response carries all 43 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "metrics_count": 1,
  "metrics_without_tied_decision": [],
  "tied_to_decision_coverage": "1.000000",
  "metrics_without_baseline_recorded": [],
  "baseline_recorded_coverage": "1.000000",
  "duplicate_metric_names": [],
  "summary": "43 pass, 0 fail, 0 missing of 43 checks across five sections."
}
```

## Verdicts

- **ML_FRAMING_SOUND** — every check passes; the declared framing record is complete and consistent with the skill's framing sections and anti-patterns.
- **ML_FRAMING_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `metrics_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `metrics_without_tied_decision`, `metrics_without_baseline_recorded` and `duplicate_metric_names` (null when the `metrics` list is not declared; a metric with the relevant field absent is missing evidence and does not appear in the first two lists), the coverage values `tied_to_decision_coverage` and `baseline_recorded_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
