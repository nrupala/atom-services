# Statistical study design report — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You submit one declared statistical study design record — the design as actually planned for one study — and this atom returns one deterministic verdict across seven sections (decision_framing, design_and_variables, sampling_and_power, analysis_plan, validation_and_bias_controls, delivery_and_reproducibility, red_lines): **STUDY_DESIGN_READY**, **STUDY_DESIGN_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 46 checks. Its method is that statistics fails when the analysis starts before the decision is defined, so the record must show frame → design → analyze → validate → deliver, with power/precision analysis done before collection and the analysis plan pre-registered. Twelve checks are computed from your declared rows and values, using only the skill's own stated method plus the consistency of your declared record itself — no outside threshold is imported: the declared design type must be one of `randomized_experiment`, `factorial_experiment`, `sequential_experiment`, `quasi_experiment`, `observational`; the declared `variables` list must be present and name at least one variable (an absent list is missing evidence, an empty list fails); no `variable_id` may appear on more than one row; every variable's `role` must be one of `outcome`, `exposure`, `predictor`, `confounder`, `covariate`, `stratification`; at least one variable must carry the `outcome` role; the declared `groups` list must be present and name at least one group (an absent list is missing evidence, an empty list fails); no `group_id` may appear on more than one row; every group's `declared_size` must be a positive whole number; the declared total sample size must equal the sum of the declared group sizes (compared on the fixed 6dp serialization); the declared alpha must lie strictly between 0 and 1; the declared target power must lie strictly between 0 and 1; and the declared effect size must be non-zero. The response also reports `largest_group_share` (the largest declared group size ÷ the computed total sample size) as a string with exactly six decimal places, produced by the rule round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals — that fixed serialization is what makes the outputs byte-identical. It audits the declared study design record's completeness and internal consistency only — it runs no study, collects or analyses no data, performs no power calculation of its own, tests no hypothesis, and does not verify that any declared plan (of randomization, sampling, assumption checks, sensitivity analyses or a reproducible pipeline) was ever actually carried out. A design is ready *on your declared evidence*: a record that declares its plan pre-registered, its confounders identified and its group sizes summing to its total passes those checks even if the real study did none of it. It is not a study, a statistical analysis, a peer review, or a guarantee that the design will answer the research question: it never judges whether the declared design can identify the declared estimand, whether the declared sample size is adequate for your question, whether the named method's assumptions will hold, or whether any future result is true — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared numbers are internally consistent. It does not do the advice-shaped or execution-shaped work either: recommending a design for your actual study — choosing between experimental and observational designs, recommending a sample size, a significance level, a target power or an analysis method for a real question — is excluded; interpreting results is excluded (no dataset is received, no estimate, interval, p-value or finding is produced or interpreted, and no conclusion about any real-world claim is given); running the skill's Analyze step itself (EDA, assumption tests on data, the model ladder, effect-size estimation) is excluded — only that those steps are *planned* is checked; executing the Validate step on real results is excluded (sensitivity and robustness are checked as planned declarations only); and writing your executive summary, methods memo or report is excluded (delivery artifacts are checked as planned, never authored). Declined thresholds, named: no sample-size adequacy bar (no minimum total or per-group sample size beyond a positive whole count — a design with tiny groups passes the computed checks if its arithmetic agrees; adequacy for your question is not judged); no minimum target power (the conventional 0.8 is **not** imposed — a declared target power of 0.2 passes exactly as 0.8 does, the value is reported verbatim, never graded); no prescribed significance level / alpha (no 0.05 or any other level is required — any alpha strictly between 0 and 1 passes); no effect-size magnitude bar (no small/medium/large grading — only non-zero is checked, because zero is the null); no required number of groups, variables or outcomes beyond at least one variable, one group and one outcome variable; no allocation-ratio or group-balance bar (unequal groups are reported via `largest_group_share`, never failed); no precision or confidence-interval width bar; no required sample-size / power formula (no z-test, t-test or any other closed-form recomputation of required sample size is performed — the skill names no formula, and choosing one would import a distributional assumption the record does not declare); and no judgment that the chosen design type, sampling method or primary analysis method is the right one for your actual study (only that a recognised type is declared, the method is named, and the plan is pre-registered is checked). The skill's red lines are checks here, not features: significance without effect size and uncertainty, p-hacking or selective reporting, causal language from observational designs without design support, unredacted PII or unapproved reuse, and outcome guarantees must all be absent. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "statistical-study-design-report"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/statistical-study-design-report` — tool name `statistical_study_design_report`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/statistical-study-design-report` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `study_title` | Study title (string; carried into the verdict output, not itself checked) |
| `framing.decision_stated` | decision_framing evidence: the decision that changes with the answer is stated and written before the design |
| `framing.research_question_stated` | decision_framing evidence: the research question the study answers is stated |
| `framing.outcome_defined` | decision_framing evidence: the outcome is defined before design |
| `framing.unit_of_analysis_defined` | decision_framing evidence: the unit of analysis is defined |
| `framing.population_defined` | decision_framing evidence: the target population is defined |
| `framing.timeframe_defined` | decision_framing evidence: the timeframe is defined |
| `design.design_type` (string) | computed: must be one of `randomized_experiment`, `factorial_experiment`, `sequential_experiment`, `quasi_experiment`, `observational` |
| `design.assignment_mechanism_stated` | design evidence: the assignment or exposure mechanism is stated |
| `design.estimand_stated` | design evidence: the target estimand is stated |
| `design.confounders_identified` | design evidence: confounders are identified |
| `variables` (list of variable-row objects) | computed: must be present and name at least one variable; reported as `variables_count` |
| `variables[].variable_id` (string) | names the row; computed: must be unique per row |
| `variables[].role` (string) | computed: must be one of `outcome`, `exposure`, `predictor`, `confounder`, `covariate`, `stratification`; at least one row must carry the `outcome` role |
| `sampling.sampling_frame_defined` | sampling evidence: the sampling frame is defined |
| `sampling.sampling_method_stated` | sampling evidence: the sampling method is stated |
| `sampling.inclusion_exclusion_criteria_stated` | sampling evidence: inclusion and exclusion criteria are stated |
| `sampling.power_analysis_done_before_collection` | sampling evidence: power / precision analysis is done before collection, not after |
| `sampling.declared_total_sample_size` (number) | computed: must equal the sum of the declared group sizes (6dp serialization) |
| `sampling.declared_alpha` (number) | computed: must lie strictly between 0 and 1 — alpha is a probability; no significance level is prescribed |
| `sampling.declared_target_power` (number) | computed: must lie strictly between 0 and 1 — power is a probability; no minimum power is imposed |
| `sampling.declared_effect_size` (number) | computed: must be non-zero — a zero effect is the null; any non-zero value, positive or negative, of any magnitude, passes |
| `groups` (list of group-row objects) | computed: must be present and name at least one group; reported as `groups_count` |
| `groups[].group_id` (string) | names the row; computed: must be unique per row |
| `groups[].declared_size` (number) | computed: must be a positive whole number (at least one) |
| `analysis.plan_written_before_collection` | analysis-plan evidence: the analysis plan is written before collection |
| `analysis.plan_preregistered` | analysis-plan evidence: the analysis plan is pre-registered |
| `analysis.primary_method_named` | analysis-plan evidence: the primary analysis method is named |
| `analysis.assumption_checks_planned` | analysis-plan evidence: assumption checks are planned |
| `analysis.effect_size_with_uncertainty_planned` | analysis-plan evidence: effect sizes with uncertainty (confidence / credible intervals) are planned — never bare p-values |
| `analysis.multiple_comparison_discipline_planned` | analysis-plan evidence: multiple-comparison discipline is planned |
| `analysis.deviations_logging_planned` | analysis-plan evidence: deviations logging is planned |
| `validation.sensitivity_analyses_planned` | validation evidence: sensitivity analyses are planned |
| `validation.robustness_checks_planned` | validation evidence: robustness checks are planned |
| `validation.leakage_audit_planned` | validation evidence: a leakage audit is planned |
| `validation.limitations_section_planned` | validation evidence: a limitations section is planned |
| `validation.what_would_change_conclusion_stated` | validation evidence: what would change the conclusion is stated |
| `delivery.executive_summary_planned` | delivery evidence: an executive summary is planned |
| `delivery.methods_memo_planned` | delivery evidence: a methods memo is planned |
| `delivery.reproducible_appendix_planned` | delivery evidence: a reproducible appendix is planned |
| `delivery.pipeline_sealed_for_rerun` | delivery evidence: the pipeline is sealed for rerun |
| `red_lines.significance_without_effect_size_and_uncertainty_present` | must be `false` to pass (red line: no significance reported without effect size and uncertainty) |
| `red_lines.p_hacking_or_selective_reporting_present` | must be `false` to pass (red line: no p-hacking or selective reporting) |
| `red_lines.causal_language_from_observational_without_design_present` | must be `false` to pass (red line: no causal language from an observational design without design support) |
| `red_lines.unredacted_pii_or_unapproved_reuse_present` | must be `false` to pass (red line: no unredacted PII or unapproved reuse) |
| `red_lines.outcome_guarantee_present` | must be `false` to pass (red line: no outcome guarantee) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward STUDY_DESIGN_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/statistical-study-design-report`:

```json
{
  "study_title": "Test Study",
  "framing": {
    "decision_stated": true,
    "research_question_stated": true,
    "outcome_defined": true,
    "unit_of_analysis_defined": true,
    "population_defined": true,
    "timeframe_defined": true
  },
  "design": {
    "design_type": "randomized_experiment",
    "assignment_mechanism_stated": true,
    "estimand_stated": true,
    "confounders_identified": true
  },
  "variables": [
    {
      "variable_id": "v1",
      "role": "outcome"
    }
  ],
  "sampling": {
    "sampling_frame_defined": true,
    "sampling_method_stated": true,
    "inclusion_exclusion_criteria_stated": true,
    "power_analysis_done_before_collection": true,
    "declared_total_sample_size": 100,
    "declared_alpha": 0.05,
    "declared_target_power": 0.8,
    "declared_effect_size": 0.5
  },
  "groups": [
    {
      "group_id": "g1",
      "declared_size": 100
    }
  ],
  "analysis": {
    "plan_written_before_collection": true,
    "plan_preregistered": true,
    "primary_method_named": true,
    "assumption_checks_planned": true,
    "effect_size_with_uncertainty_planned": true,
    "multiple_comparison_discipline_planned": true,
    "deviations_logging_planned": true
  },
  "validation": {
    "sensitivity_analyses_planned": true,
    "robustness_checks_planned": true,
    "leakage_audit_planned": true,
    "limitations_section_planned": true,
    "what_would_change_conclusion_stated": true
  },
  "delivery": {
    "executive_summary_planned": true,
    "methods_memo_planned": true,
    "reproducible_appendix_planned": true,
    "pipeline_sealed_for_rerun": true
  },
  "red_lines": {
    "significance_without_effect_size_and_uncertainty_present": false,
    "p_hacking_or_selective_reporting_present": false,
    "causal_language_from_observational_without_design_present": false,
    "unredacted_pii_or_unapproved_reuse_present": false,
    "outcome_guarantee_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 46 checks and a text stamp of the verdict):

```json
{
  "service": "statistical-study-design-report",
  "atom_version": "0.1.0",
  "study_title": "Test Study",
  "verdict": "STUDY_DESIGN_READY",
  "sections": {
    "decision_framing": "pass",
    "design_and_variables": "pass",
    "sampling_and_power": "pass",
    "analysis_plan": "pass",
    "validation_and_bias_controls": "pass",
    "delivery_and_reproducibility": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "variables_count": 1,
  "outcome_variable_count": 1,
  "duplicate_variable_ids": [],
  "variables_with_unrecognised_role": [],
  "groups_count": 1,
  "duplicate_group_ids": [],
  "computed_total_sample_size": 100,
  "declared_total_sample_size": 100,
  "total_sample_size_difference": 0,
  "largest_group_share": "1.000000",
  "declared_alpha": 0.05,
  "declared_target_power": 0.8,
  "declared_effect_size": 0.5,
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across seven sections."
}
```

## Verdicts

- **STUDY_DESIGN_READY** — every check passes; the declared study design record is complete and internally consistent with the skill's method, quality gates and red lines.
- **STUDY_DESIGN_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the twelve computed checks cannot be completed), `variables_count` and `groups_count` (the declared list lengths, or null when a list is not declared — counts are reported as integers, exactly), `outcome_variable_count`, `duplicate_variable_ids` and `duplicate_group_ids` (ids declared on more than one row, in the order their second occurrence appears), `variables_with_unrecognised_role`, `computed_total_sample_size` (the sum of the declared group sizes, or null when it cannot be computed), `declared_total_sample_size` (the declared total, or null), `total_sample_size_difference` (declared total minus computed total, or null), the declared power inputs reported verbatim (`declared_alpha`, `declared_target_power`, `declared_effect_size`, each null when not declared as a number), and `largest_group_share` (the largest declared group size ÷ the computed total sample size, as a string with exactly six decimal places).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
