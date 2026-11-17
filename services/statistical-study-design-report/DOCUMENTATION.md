# Statistical study design report — documentation

**Statistical study design report** · slug `statistical-study-design-report` · deliverable type REPORT · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared statistical study design record for completeness and consistency only. It surfaces two faces: REST `POST /v1/statistical-study-design-report` and MCP `POST /mcp/statistical-study-design-report`, tool name `statistical_study_design_report`. It runs no study, collects or analyses no data, and judges no scientific conclusion — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/statistical-study-design-report/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment ac6ddba696934ceb84596876507fc08c). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the study "Test Study"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "statistical-study-design-report"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the study design manifest.** You declare a statistical study design record for one study, made from the design as actually planned — the atom audits the declared record, it does not run any study (see Explanation). The recorded full-pass manifest declares the study `Test Study`: all six framing flags `true` (decision stated, research question stated, outcome defined, unit of analysis defined, population defined, timeframe defined); design type `randomized_experiment` with assignment mechanism, estimand and confounders all stated `true`; one variable `v1` with role `outcome`; all four sampling flags `true` with declared total sample size `100`, declared alpha `0.05`, declared target power `0.8` and declared effect size `0.5`; one group `g1` with declared size `100`; all seven analysis-plan flags `true` (plan written before collection, plan pre-registered, primary method named, assumption checks planned, effect size with uncertainty planned, multiple-comparison discipline planned, deviations logging planned); all five validation flags `true`; all four delivery flags `true`; and all five red-line flags `false` (no significance without effect size and uncertainty, no p-hacking or selective reporting, no causal language from observational without design, no unredacted PII or unapproved reuse, no outcome guarantee).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/statistical-study-design-report` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `STUDY_DESIGN_READY`: "46 pass, 0 fail, 0 missing of 46 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `variables_count` is 1, `outcome_variable_count` is 1, `groups_count` is 1, `computed_total_sample_size` is 100, `declared_total_sample_size` is 100, `total_sample_size_difference` is 0, `largest_group_share` is `"1.000000"`, and `declared_alpha`, `declared_target_power` and `declared_effect_size` are `0.05`, `0.8` and `0.5`, with every duplicate / unrecognised list empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `STUDY_DESIGN_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "statistical-study-design-report"}`.
3. Call: `POST https://atoms.pipavia.com/v1/statistical-study-design-report` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/statistical-study-design-report` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `statistical_study_design_report`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `STUDY_DESIGN_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `study_design_type_recognised`, `study_design_total_sample_size_matches_group_sum`, `study_design_alpha_in_valid_probability_range` and `study_design_effect_size_nonzero`, and the summary reads "42 pass, 4 fail, 0 missing of 46 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending quantities (in the recorded violations run, `design.design_type` is declared `invalid_type`, failing `study_design_type_recognised`; `sampling.declared_total_sample_size` is declared `50` against a group sum of `100`, failing `study_design_total_sample_size_matches_group_sum`, with `computed_total_sample_size` `100`, `declared_total_sample_size` `50` and `total_sample_size_difference` `-50`; `sampling.declared_alpha` is declared `1.5`, failing `study_design_alpha_in_valid_probability_range`; and `sampling.declared_effect_size` is declared `0`, failing `study_design_effect_size_nonzero`; `declared_target_power` remains `0.8` and `largest_group_share` remains `"1.000000"`; sections `design_and_variables` and `sampling_and_power` report `fail`, the other five sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "framing.decision_stated",
  "detail": "framing.decision_stated must be a boolean"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3, whose recorded input declares `framing.decision_stated` as `"yes"`.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/statistical-study-design-report` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/statistical-study-design-report` — tool name `statistical_study_design_report`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `statistical_study_design_report` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `study_title`, `design.design_type`, `variables[].variable_id`, `variables[].role` and `groups[].group_id` are noted as strings, `sampling.declared_total_sample_size`, `sampling.declared_alpha`, `sampling.declared_target_power`, `sampling.declared_effect_size` and `groups[].declared_size` as numbers, and `variables` and `groups` as lists there. Where SERVICE.md states no type — the section container objects (`framing`, `design`, `sampling`, `analysis`, `validation`, `delivery`, `red_lines`) and the variable-row and group-row objects (`variables[]`, `groups[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the `variables` and `groups` lists, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `variables` and `groups` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `STUDY_DESIGN_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `study_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: decision_framing

| Field | Type | Notes |
|---|---|---|
| `framing` | object | The decision-framing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `framing.decision_stated` | boolean | — |
| `framing.research_question_stated` | boolean | — |
| `framing.outcome_defined` | boolean | — |
| `framing.unit_of_analysis_defined` | boolean | — |
| `framing.population_defined` | boolean | — |
| `framing.timeframe_defined` | boolean | — |

#### Read by: design_and_variables

| Field | Type | Notes |
|---|---|---|
| `design` | object | The design section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `design.design_type` | string | Computed — must be a recognised design type, see Checks (type stated in SERVICE.md) |
| `design.assignment_mechanism_stated` | boolean | — |
| `design.estimand_stated` | boolean | — |
| `design.confounders_identified` | boolean | — |
| `variables` | list | list of variable-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `variables[]` | object | One declared variable row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `variables[].variable_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `variables[].role` | string | One of `outcome`, `exposure`, `predictor`, `confounder`, `covariate`, `stratification` (type stated in SERVICE.md) |

#### Read by: sampling_and_power

| Field | Type | Notes |
|---|---|---|
| `sampling` | object | The sampling section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `sampling.sampling_frame_defined` | boolean | — |
| `sampling.sampling_method_stated` | boolean | — |
| `sampling.inclusion_exclusion_criteria_stated` | boolean | — |
| `sampling.power_analysis_done_before_collection` | boolean | — |
| `sampling.declared_total_sample_size` | number | Computed — must equal the sum of the declared group sizes, see Checks (type stated in SERVICE.md) |
| `sampling.declared_alpha` | number | Computed — must lie strictly between 0 and 1, see Checks (type stated in SERVICE.md) |
| `sampling.declared_target_power` | number | Computed — must lie strictly between 0 and 1, see Checks (type stated in SERVICE.md) |
| `sampling.declared_effect_size` | number | Computed — must be non-zero, see Checks (type stated in SERVICE.md) |
| `groups` | list | list of group-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `groups[]` | object | One declared group row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `groups[].group_id` | string | Names the row; must be unique per row (type stated in SERVICE.md) |
| `groups[].declared_size` | number | Must be a positive whole number (type stated in SERVICE.md) |

#### Read by: analysis_plan

| Field | Type | Notes |
|---|---|---|
| `analysis` | object | The analysis-plan section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `analysis.plan_written_before_collection` | boolean | — |
| `analysis.plan_preregistered` | boolean | — |
| `analysis.primary_method_named` | boolean | — |
| `analysis.assumption_checks_planned` | boolean | — |
| `analysis.effect_size_with_uncertainty_planned` | boolean | — |
| `analysis.multiple_comparison_discipline_planned` | boolean | — |
| `analysis.deviations_logging_planned` | boolean | — |

#### Read by: validation_and_bias_controls

| Field | Type | Notes |
|---|---|---|
| `validation` | object | The validation section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `validation.sensitivity_analyses_planned` | boolean | — |
| `validation.robustness_checks_planned` | boolean | — |
| `validation.leakage_audit_planned` | boolean | — |
| `validation.limitations_section_planned` | boolean | — |
| `validation.what_would_change_conclusion_stated` | boolean | — |

#### Read by: delivery_and_reproducibility

| Field | Type | Notes |
|---|---|---|
| `delivery` | object | The delivery section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `delivery.executive_summary_planned` | boolean | — |
| `delivery.methods_memo_planned` | boolean | — |
| `delivery.reproducible_appendix_planned` | boolean | — |
| `delivery.pipeline_sealed_for_rerun` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.significance_without_effect_size_and_uncertainty_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.p_hacking_or_selective_reporting_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.causal_language_from_observational_without_design_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unredacted_pii_or_unapproved_reuse_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.outcome_guarantee_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 46 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: decision_framing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `study_design_decision_stated_before_design` | intake: the decision that changes with the answer is stated and written before the design | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_research_question_stated` | intake: the research question the study answers is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_primary_outcome_defined` | intake: the outcome is defined before design | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_unit_of_analysis_defined` | intake: the unit of analysis is defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_target_population_defined` | intake: the target population is defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_timeframe_defined` | intake: the timeframe is defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: design_and_variables

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `study_design_type_recognised` | design: the declared design type is one of randomized_experiment, factorial_experiment, sequential_experiment, quasi_experiment, observational | Computed over the declared record. Pass: `design.design_type` is one of `randomized_experiment`, `factorial_experiment`, `sequential_experiment`, `quasi_experiment`, `observational`. Fail: any other value. Missing: the field is absent. |
| `study_design_assignment_mechanism_stated` | design: the assignment or exposure mechanism is stated (randomization, factorial allocation, blocking, sequential rule, or observational exposure as the design provides) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_estimand_stated` | design: the target estimand is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_confounders_identified` | design: confounders are identified, with matching or weighting declared where the design uses them | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_variables_list_declared` | the declared record names its variables — the variables list is present and names at least one variable; an absent list is missing evidence and an empty list declares no variables at all | Computed over the declared record. Pass: the `variables` list is present and names at least one variable. Fail: the list is present but empty. Missing: the list is absent. |
| `study_design_every_variable_id_unique` | variables: no declared variable_id is owned by more than one row | Computed over the declared record. Pass: no declared `variable_id` appears on more than one row — on an empty list the check passes vacuously. Fail: a `variable_id` is declared on more than one row (duplicates are named in `duplicate_variable_ids`). Missing: the list is absent, or a row has `variable_id` absent. |
| `study_design_every_variable_role_recognised` | variables: every declared variable's role is one of outcome, exposure, predictor, confounder, covariate, stratification | Computed over the declared record. Pass: every declared row's `role` is one of `outcome`, `exposure`, `predictor`, `confounder`, `covariate`, `stratification` — on an empty list the check passes vacuously. Fail: a row declares any other value (offending rows are named in `variables_with_unrecognised_role`). Missing: the list is absent, or a row has `role` absent. |
| `study_design_at_least_one_outcome_variable_declared` | variables: at least one declared variable has the outcome role — the intake outcome is among the declared variables | Computed over the declared record. Pass: at least one declared variable has the `outcome` role. Fail: the list is present, every row declares a `role`, and no row has the `outcome` role (including an empty list). Missing: the list is absent, or a row has `role` absent. |

#### Section: sampling_and_power

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `study_design_sampling_frame_defined` | sampling: the sampling frame is defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_sampling_method_stated` | sampling: the sampling method is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_inclusion_exclusion_criteria_stated` | sampling: inclusion and exclusion criteria are stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_power_analysis_done_before_collection` | design: power / precision analysis is done before collection, not after | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_groups_list_declared` | the declared record names its groups — the groups list is present and names at least one group; an absent list is missing evidence and an empty list declares no groups at all | Computed over the declared record. Pass: the `groups` list is present and names at least one group. Fail: the list is present but empty. Missing: the list is absent. |
| `study_design_every_group_id_unique` | groups: no declared group_id is owned by more than one row | Computed over the declared record. Pass: no declared `group_id` appears on more than one row — on an empty list the check passes vacuously. Fail: a `group_id` is declared on more than one row (duplicates are named in `duplicate_group_ids`). Missing: the list is absent, or a row has `group_id` absent. |
| `study_design_every_group_size_positive_whole` | groups: every declared group size is a positive whole number (at least one) | Computed over the declared record. Pass: every declared group's `declared_size` is a positive whole number (at least one) — on an empty list the check passes vacuously. Fail: a size is zero, negative or fractional. Missing: the list is absent, or a row has `declared_size` absent or not a number. |
| `study_design_total_sample_size_matches_group_sum` | sample size: the declared total sample size equals the sum of the declared group sizes (6dp serialization) | Computed over the declared record. Pass: `sampling.declared_total_sample_size` equals the sum of the declared group sizes, compared on the fixed 6dp serialization. Fail: the declared total differs from that sum. Missing: the groups list is absent or empty, the total is absent, or a group has no numeric size. |
| `study_design_alpha_in_valid_probability_range` | power inputs: the declared alpha is a probability — strictly between 0 and 1 | Computed over the declared record. Pass: `sampling.declared_alpha` lies strictly between 0 and 1. Fail: it is 0, 1 or anything outside that range. Missing: the field is absent. |
| `study_design_target_power_in_valid_probability_range` | power inputs: the declared target power is a probability — strictly between 0 and 1 | Computed over the declared record. Pass: `sampling.declared_target_power` lies strictly between 0 and 1. Fail: it is 0, 1 or anything outside that range. Missing: the field is absent. |
| `study_design_effect_size_nonzero` | power inputs: the declared effect size is non-zero — a zero effect is the null, not an effect to detect | Computed over the declared record. Pass: `sampling.declared_effect_size` is non-zero, positive or negative, of any magnitude. Fail: it is zero. Missing: the field is absent. |

#### Section: analysis_plan

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `study_design_analysis_plan_written_before_collection` | analysis plan: the analysis plan is written before collection | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_analysis_plan_preregistered` | analysis plan: the analysis plan is pre-registered | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_primary_analysis_method_named` | analysis plan: the primary analysis method is named (the model ladder starts simple) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_assumption_checks_planned` | analysis plan: assumption checks are planned — assumptions tested, not assumed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_effect_size_with_uncertainty_planned` | analysis plan: effect sizes with uncertainty (confidence / credible intervals) are planned — never bare p-values | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_multiple_comparison_discipline_planned` | analysis plan: multiple-comparison discipline is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_analysis_plan_deviations_logging_planned` | quality gate: deviations from the analysis plan will be logged with reasons | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: validation_and_bias_controls

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `study_design_sensitivity_analyses_planned` | validate: sensitivity analyses are planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_robustness_checks_planned` | validate: robustness to outliers and misspecification is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_leakage_audit_planned` | intake audit: a leakage audit of the data is planned (with provenance and missingness) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_limitations_section_planned` | quality gate: a limitations section is planned and honest | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_what_would_change_conclusion_stated` | handoff: what would change the conclusion is documented | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: delivery_and_reproducibility

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `study_design_executive_summary_planned` | deliver: a one-page executive summary is planned (findings, decisions, limitations) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_methods_memo_planned` | deliver: a methods memo is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_reproducible_appendix_planned` | deliver: a reproducible appendix is planned (script, data checksums, environment) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `study_design_pipeline_sealed_for_rerun` | handoff: the pipeline is sealed so the analysis can be re-run when data updates | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `study_design_free_of_significance_without_uncertainty` | red line: no significance reported without effect size and uncertainty is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `study_design_free_of_p_hacking_or_selective_reporting` | red line: no p-hacking or selective reporting is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `study_design_free_of_unsupported_causal_language` | red line: no causal language from observational data without the design to back it is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `study_design_free_of_unredacted_pii_or_unapproved_reuse` | red line: no unredacted PII or unapproved reuse of client data is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `study_design_free_of_outcome_guarantees` | red line: no guarantee of outcomes is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"statistical-study-design-report"`), `atom_version` (`"0.1.0"`), and `study_title` (the manifest's declared study title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `variables_count` (the declared `variables` list length as an integer, or null when the list is not declared); `outcome_variable_count` (the number of declared variables with the `outcome` role, or null when the `variables` list is not declared, as recorded in the sparse case — SERVICE.md states no null rule for this field, see Discrepancies); `duplicate_variable_ids` (ids declared on more than one variable row, in the order their second occurrence appears; null when the `variables` list is not declared, as recorded in the sparse case) and `variables_with_unrecognised_role` (variable rows whose `role` is present as a string but not recognised, named by their `variable_id`; null when the `variables` list is not declared, as recorded in the sparse case); `groups_count` (the declared `groups` list length as an integer, or null when the list is not declared); `duplicate_group_ids` (ids declared on more than one group row, in the order their second occurrence appears; null when the `groups` list is not declared, as recorded in the sparse case); `computed_total_sample_size` (the sum of the declared group sizes, or null when it cannot be computed); `declared_total_sample_size` (the declared total, or null); `total_sample_size_difference` (declared total minus computed total, or null); `largest_group_share` (the largest declared group size ÷ the computed total sample size) — a string with exactly six decimal places; it is null when the computed total cannot be computed, as recorded in the sparse case (SERVICE.md states no null rule for this field, see Discrepancies); and the declared power inputs reported verbatim, `declared_alpha`, `declared_target_power` and `declared_effect_size` (each null when not declared as a number). `largest_group_share` uses the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; the total sample-size comparison is made on the same 6dp serializations of the declared and recomputed values — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "46 pass, 0 fail, 0 missing of 46 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared study title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `STUDY_DESIGN_READY` — all 46 checks pass: the declared statistical study design record is complete and consistent with the bound skill's method, quality gates and red lines.
- `STUDY_DESIGN_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the twelve primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `variables_count`, `outcome_variable_count`, `duplicate_variable_ids`, `variables_with_unrecognised_role`, `groups_count`, `duplicate_group_ids`, `computed_total_sample_size`, `declared_total_sample_size`, `total_sample_size_difference`, `largest_group_share`, `declared_alpha`, `declared_target_power`, `declared_effect_size` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"framing.decision_stated","detail":"framing.decision_stated must be a boolean"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type REPORT — this atom sells the report it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Run statistics engagements — problem framing, study design, assumption checks, reports clients can act on (the bound capability, from the skill). Its method is that statistics fails when the analysis starts before the decision is defined, so the engagement runs frame → design → analyze → validate → deliver, with an audit trail; power/precision analysis happens before collection and the analysis plan is pre-registered. You submit one declared record — the statistical study design manifest, made from the design as actually planned — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 7 sections (`decision_framing`, `design_and_variables`, `sampling_and_power`, `analysis_plan`, `validation_and_bias_controls`, `delivery_and_reproducibility`, `red_lines`). The atom sells that report — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest siblings `bias-controlled-quant-study-pack`, `quant-math-derivation-sanity-check` and `forecast-with-ranges-and-scorecard` (SERVICE.md, Distinct ground); every check here is a study-design question, where the siblings audit a market quant study pack, a mathematical derivation, and a forecast artifact respectively.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows and values themselves — twelve of them: the declared design type must be recognised; the `variables` list must be present and name at least one variable, every `variable_id` unique, every `role` recognised, and at least one variable must carry the `outcome` role; the `groups` list must be present and name at least one group, every `group_id` unique, and every `declared_size` a positive whole number; the declared total sample size must equal the sum of the declared group sizes; and the declared alpha and target power must each lie strictly between 0 and 1, with a non-zero declared effect size — using only the skill's own stated method plus the consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `STUDY_DESIGN_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `STUDY_DESIGN_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no sample-size or power adequacy threshold at all — its demands are a power/precision analysis done before collection, a pre-registered plan, declared assumption checks and qualitative declarations the record makes, not bars the atom can set. Declined, named: a sample-size adequacy bar (no minimum total or per-group sample size beyond a positive whole count — a design with tiny groups passes the computed checks if its arithmetic agrees; adequacy for the caller's question is not judged); a minimum target power (the conventional 0.8 is **not** imposed — a declared target power of 0.2 passes exactly as 0.8 does; power is reported verbatim, never graded); a prescribed significance level / alpha (no 0.05 or any other level is required — any alpha strictly between 0 and 1 passes); an effect-size magnitude bar (no small/medium/large grading — only non-zero is checked, because zero is the null); a required number of groups, variables or outcomes beyond at least one variable, one group and one outcome variable; an allocation-ratio or group-balance bar (unequal groups are reported via `largest_group_share`, never failed); a precision or confidence-interval width bar; a required sample-size / power formula (no z-test, t-test or any other closed-form recomputation of required sample size is performed — the skill names no formula, and choosing one would import a distributional assumption the record does not declare); any judgment that the chosen design type, sampling method or primary analysis method is the right one for the caller's actual study (only that a recognised type is declared, the method is named, and the plan is pre-registered is checked). Quantities are computed and reported; the only bars on the computed rows are the valid probability ranges, non-zero effect, positive whole group counts, exact recomputation of the declared total from the declared groups, and completeness over the caller's own declared record.

**What it does NOT do.** The atom reviews a **declared** study design record: a verdict of `STUDY_DESIGN_READY` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its plan pre-registered, its confounders identified and its group sizes summing to its total passes those checks even if the real study did none of it. It is a completeness and consistency audit of the study design record the skill requires, **not a study, a statistical analysis, a peer review, or a guarantee that the design will answer the research question**. Specifically: it runs no study, collects or analyses no data, performs no power calculation of its own, tests no hypothesis, and does not verify that any declared plan (of randomization, sampling, assumption checks, sensitivity analyses or a reproducible pipeline) was ever actually carried out. It never judges whether the declared design can identify the declared estimand, whether the declared sample size is adequate for the caller's question, whether the named method's assumptions will hold, or whether any future result is true — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared numbers are internally consistent. Named exclusions: recommending a design for the caller's actual study — choosing between experimental and observational designs, recommending a sample size, a significance level, a target power or an analysis method for a real question is advice-shaped work this atom does not do; interpreting results — no dataset is received, no estimate, interval, p-value or finding is produced or interpreted, and no conclusion about any real-world claim is given; running the skill's Analyze step itself (EDA, assumption tests on data, the model ladder, effect-size estimation) — the atom checks only that those steps are *planned* in the declared record; executing the skill's Validate step on real results (sensitivity and robustness are checked as planned declarations only); writing the caller's executive summary, methods memo or report — delivery artifacts are checked as planned, never authored; any numeric adequacy bar (see the declined list above).

**Buyer and use context.** Teams and agents working in Thinking & decisions who need this report on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Studies behind RA and product decisions (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was deployed census-style under a U-13 regulatory screen classified **(b) screen-NO — flag-with-controls (census class)**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: this atom sits near research/statistics advice by keyword and by substance — its bound skill is a consulting engagement discipline, and a study design record could concern a regulated domain (a clinical, engineering or financial study) — so the screen was applied strictly, and the atom is flagged for the owner's per-unit ruling queue under U-13 on that adjacency. The named controls, exactly as SERVICE.md records them: (1) the atom audits a caller-declared study design record for completeness and internal consistency only — declared-framing, design, sampling, analysis-plan, validation and delivery attestations, plus recomputation of the caller's own declared group sizes against the caller's own declared total and the valid probability ranges of the caller's own declared alpha and power; every output is a pass / fail / missing verdict on the record or a quantity recomputed from it; (2) it gives no statistical advice, no design recommendation, no analysis, no interpretation and no conclusion about any real-world claim — it never says what design, sample size, method or level the caller should use, whether a study is well designed for its actual question, or what any result means; the skill's advice-shaped and execution-shaped steps (designing the caller's study, analysing their data, interpreting findings, delivering the engagement's own report) are excluded from production and named as exclusions in SERVICE.md — this atom performs none of them, it only audits a declared record of a design; (3) it sets no adequacy threshold — no sample-size, power, significance, effect-size or precision bar against which a caller's design could be graded as good or bad (see the declined list); (4) the record's subject is whatever study the caller declares — the atom takes no position on any clinical, engineering, financial or other regulated decision, and no output is addressed to one. SERVICE.md also records the residual risk plainly: a caller could paste the verdict into their own study documentation — that is their decision, made on their record; the artifact itself recommends nothing. The flag stays open for the Director's review: the screen-NO classification and its controls stand as recorded, and the census flag is not closed by this document.

### For integrators (Users)

You need: a gateway key with the `statistical_study_design_report` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; the computed ratio is serialized as a string with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, and the total sample-size comparison is made on the same 6dp serializations, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/statistical_study_design_report.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_statistical_study_design_report.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/statistical-study-design-report` (REST) and `POST /mcp/statistical-study-design-report` (MCP, tool `statistical_study_design_report`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22). Key scope: `statistical_study_design_report`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** every recorded check name carries the common prefix `study_design_`, which no input field name carries; after that prefix is stripped, 24 of the 46 recorded check names still differ from the leaf name of the field they read, and 22 match it. The differing names are: in `decision_framing`, `study_design_decision_stated_before_design` (input `framing.decision_stated`), `study_design_primary_outcome_defined` (input `framing.outcome_defined`) and `study_design_target_population_defined` (input `framing.population_defined`); in `design_and_variables`, the four computed checks `study_design_type_recognised` (input `design.design_type`), `study_design_variables_list_declared` (the `variables` list), `study_design_every_variable_id_unique` (rows' `variable_id`) and `study_design_every_variable_role_recognised` (rows' `role`), plus `study_design_at_least_one_outcome_variable_declared`, which reads the declared rows' `role` values collectively and no single input field; in `sampling_and_power`, the seven computed checks `study_design_groups_list_declared` (the `groups` list), `study_design_every_group_id_unique` (rows' `group_id`), `study_design_every_group_size_positive_whole` (rows' `declared_size`), `study_design_total_sample_size_matches_group_sum` (input `sampling.declared_total_sample_size`, against the group sum), `study_design_alpha_in_valid_probability_range` (input `sampling.declared_alpha`), `study_design_target_power_in_valid_probability_range` (input `sampling.declared_target_power`) and `study_design_effect_size_nonzero` (input `sampling.declared_effect_size`); in `analysis_plan`, `study_design_analysis_plan_written_before_collection` (input `analysis.plan_written_before_collection`), `study_design_analysis_plan_preregistered` (input `analysis.plan_preregistered`), `study_design_primary_analysis_method_named` (input `analysis.primary_method_named`) and `study_design_analysis_plan_deviations_logging_planned` (input `analysis.deviations_logging_planned`); and in `red_lines`, all five recorded check names differ from their fields: `study_design_free_of_significance_without_uncertainty` (input `red_lines.significance_without_effect_size_and_uncertainty_present`), `study_design_free_of_p_hacking_or_selective_reporting` (input `red_lines.p_hacking_or_selective_reporting_present`), `study_design_free_of_unsupported_causal_language` (input `red_lines.causal_language_from_observational_without_design_present`), `study_design_free_of_unredacted_pii_or_unapproved_reuse` (input `red_lines.unredacted_pii_or_unapproved_reuse_present`) and `study_design_free_of_outcome_guarantees` (input `red_lines.outcome_guarantee_present`). Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`framing`, `design`, `sampling`, `analysis`, `validation`, `delivery`, `red_lines`) or for a row object (`variables[]`, `groups[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the `variables` and `groups` lists, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 46 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, `variables_count`, `groups_count`, `computed_total_sample_size`, `declared_total_sample_size`, `total_sample_size_difference` and the verbatim declared power inputs (`declared_alpha`, `declared_target_power`, `declared_effect_size`), but does not state a null rule for `outcome_variable_count`, `duplicate_variable_ids`, `variables_with_unrecognised_role`, `duplicate_group_ids` or `largest_group_share`. The recorded sparse response returns all five as `null` when the relevant declared list is not declared (for `largest_group_share`, when the computed total cannot be computed, as the Output format section records); this document follows the recording.
6. **Section grouping vs input objects:** two recorded sections each merge two separate input objects — `design` and `variables` inputs are both read by the single recorded section `design_and_variables`, and `sampling` and `groups` inputs are both read by the single recorded section `sampling_and_power`. The other five recorded sections map one-to-one onto their input objects (`framing` → `decision_framing`, `analysis` → `analysis_plan`, `validation` → `validation_and_bias_controls`, `delivery` → `delivery_and_reproducibility`, `red_lines` → `red_lines`). This document groups the Input reference and the Checks by the recorded section names.
7. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (8 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named four prose labels instead of exact check names — `Design type recognised`, `Total sample size matches the group sum`, `Alpha in the valid probability range` and `Effect size non-zero` (R1 ×4); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); the designed violations input was not a full manifest — it was missing the many key paths present in the full-pass manifest listed in TEST-REPORT.md's tester-error 7 (R3 ×1); and the designed malformed input carried 2 type violations (`study_title` as a number and `framing` as a string) instead of exactly one (R4 ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T12:26:41.153671+00:00 against gateway v1.1.0, external verification battery Wave 15, source `verification/work/statistical-study-design-report/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T12:26:41.153671+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/statistical-study-design-report/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "decision_framing",
      "check": "study_design_decision_stated_before_design",
      "status": "pass",
      "evidence": "intake: the decision that changes with the answer is stated and written before the design"
    },
    {
      "section": "decision_framing",
      "check": "study_design_research_question_stated",
      "status": "pass",
      "evidence": "intake: the research question the study answers is stated"
    },
    {
      "section": "decision_framing",
      "check": "study_design_primary_outcome_defined",
      "status": "pass",
      "evidence": "intake: the outcome is defined before design"
    },
    {
      "section": "decision_framing",
      "check": "study_design_unit_of_analysis_defined",
      "status": "pass",
      "evidence": "intake: the unit of analysis is defined"
    },
    {
      "section": "decision_framing",
      "check": "study_design_target_population_defined",
      "status": "pass",
      "evidence": "intake: the target population is defined"
    },
    {
      "section": "decision_framing",
      "check": "study_design_timeframe_defined",
      "status": "pass",
      "evidence": "intake: the timeframe is defined"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_type_recognised",
      "status": "pass",
      "evidence": "design: the declared design type is one of randomized_experiment, factorial_experiment, sequential_experiment, quasi_experiment, observational"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_assignment_mechanism_stated",
      "status": "pass",
      "evidence": "design: the assignment or exposure mechanism is stated (randomization, factorial allocation, blocking, sequential rule, or observational exposure as the design provides)"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_estimand_stated",
      "status": "pass",
      "evidence": "design: the target estimand is stated"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_confounders_identified",
      "status": "pass",
      "evidence": "design: confounders are identified, with matching or weighting declared where the design uses them"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_variables_list_declared",
      "status": "pass",
      "evidence": "the declared record names its variables \u2014 the variables list is present and names at least one variable; an absent list is missing evidence and an empty list declares no variables at all"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_every_variable_id_unique",
      "status": "pass",
      "evidence": "variables: no declared variable_id is owned by more than one row"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_every_variable_role_recognised",
      "status": "pass",
      "evidence": "variables: every declared variable's role is one of outcome, exposure, predictor, confounder, covariate, stratification"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_at_least_one_outcome_variable_declared",
      "status": "pass",
      "evidence": "variables: at least one declared variable has the outcome role \u2014 the intake outcome is among the declared variables"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_sampling_frame_defined",
      "status": "pass",
      "evidence": "sampling: the sampling frame is defined"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_sampling_method_stated",
      "status": "pass",
      "evidence": "sampling: the sampling method is stated"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_inclusion_exclusion_criteria_stated",
      "status": "pass",
      "evidence": "sampling: inclusion and exclusion criteria are stated"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_power_analysis_done_before_collection",
      "status": "pass",
      "evidence": "design: power / precision analysis is done before collection, not after"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_groups_list_declared",
      "status": "pass",
      "evidence": "the declared record names its groups \u2014 the groups list is present and names at least one group; an absent list is missing evidence and an empty list declares no groups at all"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_every_group_id_unique",
      "status": "pass",
      "evidence": "groups: no declared group_id is owned by more than one row"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_every_group_size_positive_whole",
      "status": "pass",
      "evidence": "groups: every declared group size is a positive whole number (at least one)"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_total_sample_size_matches_group_sum",
      "status": "pass",
      "evidence": "sample size: the declared total sample size equals the sum of the declared group sizes (6dp serialization)"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_alpha_in_valid_probability_range",
      "status": "pass",
      "evidence": "power inputs: the declared alpha is a probability \u2014 strictly between 0 and 1"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_target_power_in_valid_probability_range",
      "status": "pass",
      "evidence": "power inputs: the declared target power is a probability \u2014 strictly between 0 and 1"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_effect_size_nonzero",
      "status": "pass",
      "evidence": "power inputs: the declared effect size is non-zero \u2014 a zero effect is the null, not an effect to detect"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_analysis_plan_written_before_collection",
      "status": "pass",
      "evidence": "analysis plan: the analysis plan is written before collection"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_analysis_plan_preregistered",
      "status": "pass",
      "evidence": "analysis plan: the analysis plan is pre-registered"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_primary_analysis_method_named",
      "status": "pass",
      "evidence": "analysis plan: the primary analysis method is named (the model ladder starts simple)"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_assumption_checks_planned",
      "status": "pass",
      "evidence": "analysis plan: assumption checks are planned \u2014 assumptions tested, not assumed"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_effect_size_with_uncertainty_planned",
      "status": "pass",
      "evidence": "analysis plan: effect sizes with uncertainty (confidence / credible intervals) are planned \u2014 never bare p-values"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_multiple_comparison_discipline_planned",
      "status": "pass",
      "evidence": "analysis plan: multiple-comparison discipline is planned"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_analysis_plan_deviations_logging_planned",
      "status": "pass",
      "evidence": "quality gate: deviations from the analysis plan will be logged with reasons"
    },
    {
      "section": "validation_and_bias_controls",
      "check": "study_design_sensitivity_analyses_planned",
      "status": "pass",
      "evidence": "validate: sensitivity analyses are planned"
    },
    {
      "section": "validation_and_bias_controls",
      "check": "study_design_robustness_checks_planned",
      "status": "pass",
      "evidence": "validate: robustness to outliers and misspecification is planned"
    },
    {
      "section": "validation_and_bias_controls",
      "check": "study_design_leakage_audit_planned",
      "status": "pass",
      "evidence": "intake audit: a leakage audit of the data is planned (with provenance and missingness)"
    },
    {
      "section": "validation_and_bias_controls",
      "check": "study_design_limitations_section_planned",
      "status": "pass",
      "evidence": "quality gate: a limitations section is planned and honest"
    },
    {
      "section": "validation_and_bias_controls",
      "check": "study_design_what_would_change_conclusion_stated",
      "status": "pass",
      "evidence": "handoff: what would change the conclusion is documented"
    },
    {
      "section": "delivery_and_reproducibility",
      "check": "study_design_executive_summary_planned",
      "status": "pass",
      "evidence": "deliver: a one-page executive summary is planned (findings, decisions, limitations)"
    },
    {
      "section": "delivery_and_reproducibility",
      "check": "study_design_methods_memo_planned",
      "status": "pass",
      "evidence": "deliver: a methods memo is planned"
    },
    {
      "section": "delivery_and_reproducibility",
      "check": "study_design_reproducible_appendix_planned",
      "status": "pass",
      "evidence": "deliver: a reproducible appendix is planned (script, data checksums, environment)"
    },
    {
      "section": "delivery_and_reproducibility",
      "check": "study_design_pipeline_sealed_for_rerun",
      "status": "pass",
      "evidence": "handoff: the pipeline is sealed so the analysis can be re-run when data updates"
    },
    {
      "section": "red_lines",
      "check": "study_design_free_of_significance_without_uncertainty",
      "status": "pass",
      "evidence": "red line: no significance reported without effect size and uncertainty is present in the record"
    },
    {
      "section": "red_lines",
      "check": "study_design_free_of_p_hacking_or_selective_reporting",
      "status": "pass",
      "evidence": "red line: no p-hacking or selective reporting is present in the record"
    },
    {
      "section": "red_lines",
      "check": "study_design_free_of_unsupported_causal_language",
      "status": "pass",
      "evidence": "red line: no causal language from observational data without the design to back it is present in the record"
    },
    {
      "section": "red_lines",
      "check": "study_design_free_of_unredacted_pii_or_unapproved_reuse",
      "status": "pass",
      "evidence": "red line: no unredacted PII or unapproved reuse of client data is present in the record"
    },
    {
      "section": "red_lines",
      "check": "study_design_free_of_outcome_guarantees",
      "status": "pass",
      "evidence": "red line: no guarantee of outcomes is present in the record"
    }
  ],
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
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across seven sections.",
  "stamp": "STATISTICAL STUDY DESIGN REPORT\nstudy_title: Test Study\nVERDICT: STUDY_DESIGN_READY\n  decision_framing                             pass\n  design_and_variables                         pass\n  sampling_and_power                           pass\n  analysis_plan                                pass\n  validation_and_bias_controls                 pass\n  delivery_and_reproducibility                 pass\n  red_lines                                    pass\n46 pass, 0 fail, 0 missing of 46 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T12:26:41.153671+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/statistical-study-design-report/evidence.json`.

Input:

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
    "design_type": "invalid_type",
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
    "declared_total_sample_size": 50,
    "declared_alpha": 1.5,
    "declared_target_power": 0.8,
    "declared_effect_size": 0
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

Response (HTTP 200):

```json
{
  "service": "statistical-study-design-report",
  "atom_version": "0.1.0",
  "study_title": "Test Study",
  "verdict": "STUDY_DESIGN_NOT_READY",
  "sections": {
    "decision_framing": "pass",
    "design_and_variables": "fail",
    "sampling_and_power": "fail",
    "analysis_plan": "pass",
    "validation_and_bias_controls": "pass",
    "delivery_and_reproducibility": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "decision_framing",
      "check": "study_design_decision_stated_before_design",
      "status": "pass",
      "evidence": "intake: the decision that changes with the answer is stated and written before the design"
    },
    {
      "section": "decision_framing",
      "check": "study_design_research_question_stated",
      "status": "pass",
      "evidence": "intake: the research question the study answers is stated"
    },
    {
      "section": "decision_framing",
      "check": "study_design_primary_outcome_defined",
      "status": "pass",
      "evidence": "intake: the outcome is defined before design"
    },
    {
      "section": "decision_framing",
      "check": "study_design_unit_of_analysis_defined",
      "status": "pass",
      "evidence": "intake: the unit of analysis is defined"
    },
    {
      "section": "decision_framing",
      "check": "study_design_target_population_defined",
      "status": "pass",
      "evidence": "intake: the target population is defined"
    },
    {
      "section": "decision_framing",
      "check": "study_design_timeframe_defined",
      "status": "pass",
      "evidence": "intake: the timeframe is defined"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_type_recognised",
      "status": "fail",
      "evidence": "design: the declared design type is one of randomized_experiment, factorial_experiment, sequential_experiment, quasi_experiment, observational"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_assignment_mechanism_stated",
      "status": "pass",
      "evidence": "design: the assignment or exposure mechanism is stated (randomization, factorial allocation, blocking, sequential rule, or observational exposure as the design provides)"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_estimand_stated",
      "status": "pass",
      "evidence": "design: the target estimand is stated"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_confounders_identified",
      "status": "pass",
      "evidence": "design: confounders are identified, with matching or weighting declared where the design uses them"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_variables_list_declared",
      "status": "pass",
      "evidence": "the declared record names its variables \u2014 the variables list is present and names at least one variable; an absent list is missing evidence and an empty list declares no variables at all"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_every_variable_id_unique",
      "status": "pass",
      "evidence": "variables: no declared variable_id is owned by more than one row"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_every_variable_role_recognised",
      "status": "pass",
      "evidence": "variables: every declared variable's role is one of outcome, exposure, predictor, confounder, covariate, stratification"
    },
    {
      "section": "design_and_variables",
      "check": "study_design_at_least_one_outcome_variable_declared",
      "status": "pass",
      "evidence": "variables: at least one declared variable has the outcome role \u2014 the intake outcome is among the declared variables"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_sampling_frame_defined",
      "status": "pass",
      "evidence": "sampling: the sampling frame is defined"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_sampling_method_stated",
      "status": "pass",
      "evidence": "sampling: the sampling method is stated"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_inclusion_exclusion_criteria_stated",
      "status": "pass",
      "evidence": "sampling: inclusion and exclusion criteria are stated"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_power_analysis_done_before_collection",
      "status": "pass",
      "evidence": "design: power / precision analysis is done before collection, not after"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_groups_list_declared",
      "status": "pass",
      "evidence": "the declared record names its groups \u2014 the groups list is present and names at least one group; an absent list is missing evidence and an empty list declares no groups at all"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_every_group_id_unique",
      "status": "pass",
      "evidence": "groups: no declared group_id is owned by more than one row"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_every_group_size_positive_whole",
      "status": "pass",
      "evidence": "groups: every declared group size is a positive whole number (at least one)"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_total_sample_size_matches_group_sum",
      "status": "fail",
      "evidence": "sample size: the declared total sample size equals the sum of the declared group sizes (6dp serialization)"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_alpha_in_valid_probability_range",
      "status": "fail",
      "evidence": "power inputs: the declared alpha is a probability \u2014 strictly between 0 and 1"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_target_power_in_valid_probability_range",
      "status": "pass",
      "evidence": "power inputs: the declared target power is a probability \u2014 strictly between 0 and 1"
    },
    {
      "section": "sampling_and_power",
      "check": "study_design_effect_size_nonzero",
      "status": "fail",
      "evidence": "power inputs: the declared effect size is non-zero \u2014 a zero effect is the null, not an effect to detect"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_analysis_plan_written_before_collection",
      "status": "pass",
      "evidence": "analysis plan: the analysis plan is written before collection"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_analysis_plan_preregistered",
      "status": "pass",
      "evidence": "analysis plan: the analysis plan is pre-registered"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_primary_analysis_method_named",
      "status": "pass",
      "evidence": "analysis plan: the primary analysis method is named (the model ladder starts simple)"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_assumption_checks_planned",
      "status": "pass",
      "evidence": "analysis plan: assumption checks are planned \u2014 assumptions tested, not assumed"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_effect_size_with_uncertainty_planned",
      "status": "pass",
      "evidence": "analysis plan: effect sizes with uncertainty (confidence / credible intervals) are planned \u2014 never bare p-values"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_multiple_comparison_discipline_planned",
      "status": "pass",
      "evidence": "analysis plan: multiple-comparison discipline is planned"
    },
    {
      "section": "analysis_plan",
      "check": "study_design_analysis_plan_deviations_logging_planned",
      "status": "pass",
      "evidence": "quality gate: deviations from the analysis plan will be logged with reasons"
    },
    {
      "section": "validation_and_bias_controls",
      "check": "study_design_sensitivity_analyses_planned",
      "status": "pass",
      "evidence": "validate: sensitivity analyses are planned"
    },
    {
      "section": "validation_and_bias_controls",
      "check": "study_design_robustness_checks_planned",
      "status": "pass",
      "evidence": "validate: robustness to outliers and misspecification is planned"
    },
    {
      "section": "validation_and_bias_controls",
      "check": "study_design_leakage_audit_planned",
      "status": "pass",
      "evidence": "intake audit: a leakage audit of the data is planned (with provenance and missingness)"
    },
    {
      "section": "validation_and_bias_controls",
      "check": "study_design_limitations_section_planned",
      "status": "pass",
      "evidence": "quality gate: a limitations section is planned and honest"
    },
    {
      "section": "validation_and_bias_controls",
      "check": "study_design_what_would_change_conclusion_stated",
      "status": "pass",
      "evidence": "handoff: what would change the conclusion is documented"
    },
    {
      "section": "delivery_and_reproducibility",
      "check": "study_design_executive_summary_planned",
      "status": "pass",
      "evidence": "deliver: a one-page executive summary is planned (findings, decisions, limitations)"
    },
    {
      "section": "delivery_and_reproducibility",
      "check": "study_design_methods_memo_planned",
      "status": "pass",
      "evidence": "deliver: a methods memo is planned"
    },
    {
      "section": "delivery_and_reproducibility",
      "check": "study_design_reproducible_appendix_planned",
      "status": "pass",
      "evidence": "deliver: a reproducible appendix is planned (script, data checksums, environment)"
    },
    {
      "section": "delivery_and_reproducibility",
      "check": "study_design_pipeline_sealed_for_rerun",
      "status": "pass",
      "evidence": "handoff: the pipeline is sealed so the analysis can be re-run when data updates"
    },
    {
      "section": "red_lines",
      "check": "study_design_free_of_significance_without_uncertainty",
      "status": "pass",
      "evidence": "red line: no significance reported without effect size and uncertainty is present in the record"
    },
    {
      "section": "red_lines",
      "check": "study_design_free_of_p_hacking_or_selective_reporting",
      "status": "pass",
      "evidence": "red line: no p-hacking or selective reporting is present in the record"
    },
    {
      "section": "red_lines",
      "check": "study_design_free_of_unsupported_causal_language",
      "status": "pass",
      "evidence": "red line: no causal language from observational data without the design to back it is present in the record"
    },
    {
      "section": "red_lines",
      "check": "study_design_free_of_unredacted_pii_or_unapproved_reuse",
      "status": "pass",
      "evidence": "red line: no unredacted PII or unapproved reuse of client data is present in the record"
    },
    {
      "section": "red_lines",
      "check": "study_design_free_of_outcome_guarantees",
      "status": "pass",
      "evidence": "red line: no guarantee of outcomes is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "variables_count": 1,
  "outcome_variable_count": 1,
  "duplicate_variable_ids": [],
  "variables_with_unrecognised_role": [],
  "groups_count": 1,
  "duplicate_group_ids": [],
  "computed_total_sample_size": 100,
  "declared_total_sample_size": 50,
  "total_sample_size_difference": -50,
  "largest_group_share": "1.000000",
  "declared_alpha": 1.5,
  "declared_target_power": 0.8,
  "declared_effect_size": 0,
  "summary": "42 pass, 4 fail, 0 missing of 46 checks across seven sections.",
  "stamp": "STATISTICAL STUDY DESIGN REPORT\nstudy_title: Test Study\nVERDICT: STUDY_DESIGN_NOT_READY\n  decision_framing                             pass\n  design_and_variables                         fail\n  sampling_and_power                           fail\n  analysis_plan                                pass\n  validation_and_bias_controls                 pass\n  delivery_and_reproducibility                 pass\n  red_lines                                    pass\n42 pass, 4 fail, 0 missing of 46 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T12:26:41.153671+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/statistical-study-design-report/evidence.json`.

Input:

```json
{
  "study_title": "Test Study",
  "framing": {
    "decision_stated": "yes",
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

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "framing.decision_stated",
  "detail": "framing.decision_stated must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — this atom was deployed census-style under a U-13 screen classified (b) screen-NO — flag-with-controls (census class), with the four named controls recorded in SERVICE.md's U-13 section; the flag stays open for the Director's review (see Role views, For regulators) |
| Checks named | 46 documented / 46 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`variables_count`, `outcome_variable_count`, the duplicate / unrecognised lists, `groups_count`, `computed_total_sample_size`, `declared_total_sample_size`, `total_sample_size_difference`, `largest_group_share` and the three verbatim declared power inputs) |
| Input reference typed | Yes — 55 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/statistical-study-design-report/evidence.json` |
