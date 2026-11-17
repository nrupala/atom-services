# Process waste review coaching — documentation

**Process waste review coaching** · slug `process-waste-review-coaching` · deliverable type REVIEW · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/process-waste-review-coaching/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 9595ea665b634289aad158b7fff277ac). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `process` "Order Fulfillment"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "process-waste-review-coaching"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the process waste review manifest.** You declare a record of one process's waste review, made at review time — despite the atom's name, the atom audits the declared record, it does not coach a person, observe a process, time a step or inspect a workplace (see Explanation and the Regulators role view). The recorded full-pass manifest declares the process `Order Fulfillment`: the problem, measurable goal, scope, customer need and whole-system scope are stated, and the whole flow is mapped with work made visible and the process defined before automation; two step rows, `Pick` (10 minutes, wait 2) and `Pack` (5 minutes, wait 1); one waste row, category `waiting` on step `Pick`; a baseline established with data and from data not anecdote, leading and lagging indicators declared, KPIs limited to the meaningful and metrics made visible; root-cause analysis performed and the Pareto vital few identified, the bottleneck identified with non-bottleneck effort subordinated and the declared bottleneck step name `Pick`; an improvement piloted before scaling, a PDCA cycle declared, verification against baseline before scaling, small continuous improvement declared and flow and pull pursued over push, with the win standardized, monitoring in place and regression made visible; and all six red-line flags `false` (no automating a broken process, no vanity metrics, no hero-culture reliance, no optimizing a non-constraint, no tradition without data, no local optimization hurting the whole).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/process-waste-review-coaching` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `PROCESS_WASTE_REVIEW_READY`: "40 pass, 0 fail, 0 missing of 40 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `steps_count` is 2, `wastes_count` is 1, `total_duration_minutes` is 15, `total_wait_minutes` is 3, `wait_share` is `"0.166667"`, `distinct_waste_categories` is `["waiting"]`, `duplicate_step_names` and `unmatched_waste_step_names` are both `[]`, `waste_step_coverage` is `"1.000000"`, and `bottleneck_step_computed` is `"Pick"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `PROCESS_WASTE_REVIEW_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "process-waste-review-coaching"}`.
3. Call: `POST https://atoms.pipavia.com/v1/process-waste-review-coaching` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/process-waste-review-coaching` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `process_waste_review_coaching`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `PROCESS_WASTE_REVIEW_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 6 checks fail: `declared_bottleneck_matches_longest_step`, `every_waste_category_valid_downtime`, `every_waste_step_names_declared_step`, `no_automating_broken_process`, `no_step_name_duplicated`, `process_problem_stated`, and the summary reads "34 pass, 6 fail, 0 missing of 40 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `define.problem_stated` is declared `false`, failing `process_problem_stated`; `steps[1].name` is duplicated as `Pick`, failing `no_step_name_duplicated`, with `duplicate_step_names` `["Pick"]`; `wastes[0].category` is `unknown_waste`, failing `every_waste_category_valid_downtime`, with `distinct_waste_categories` `[]`; `wastes[0].step_name` is `UnknownStep`, failing `every_waste_step_names_declared_step`, with `unmatched_waste_step_names` `["UnknownStep"]` and `waste_step_coverage` `"0.000000"`; `constraint.bottleneck_step_name` is declared `Pack` while the computed bottleneck is `Pick`, failing `declared_bottleneck_matches_longest_step`; and `red_lines.automating_broken_process_present` is declared `true`, failing `no_automating_broken_process`; sections `define_and_visibility`, `steps_and_waste_observation`, `analysis_and_constraint` and `red_lines` report `fail`, `measurement_and_metrics` and `improvement_and_control` report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "define",
  "detail": "define must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3; the recorded input declares `define: "not_an_object"`.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/process-waste-review-coaching` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/process-waste-review-coaching` — tool name `process_waste_review_coaching`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `process_waste_review_coaching` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `process`, the `steps[]` / `wastes[]` string fields and `constraint.bottleneck_step_name` are noted as strings, `steps[].duration_minutes` and `steps[].wait_before_minutes` as numbers, and `steps` and `wastes` as lists there. Where SERVICE.md states no type — the section container objects (`define`, `mapping`, `measure`, `metrics`, `analyze`, `constraint`, `improve`, `control`, `red_lines`) and a `steps[]` or `wastes[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and `steps` / `wastes`, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `steps` / `wastes` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `PROCESS_WASTE_REVIEW_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `process` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: define_and_visibility

| Field | Type | Notes |
|---|---|---|
| `define` | object | The define section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `define.problem_stated` | boolean | — |
| `define.goal_measurable_stated` | boolean | — |
| `define.scope_stated` | boolean | — |
| `define.customer_need_stated` | boolean | — |
| `define.whole_system_scope_declared` | boolean | — |
| `mapping` | object | The mapping section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `mapping.whole_flow_mapped` | boolean | — |
| `mapping.work_made_visible` | boolean | — |
| `mapping.process_defined_before_automation` | boolean | — |

#### Read by: steps_and_waste_observation

| Field | Type | Notes |
|---|---|---|
| `steps` | list | list of step-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `steps[]` | object | One declared step row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `steps[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `steps[].duration_minutes` | number | The step's declared duration (type stated in SERVICE.md) |
| `steps[].wait_before_minutes` | number | The declared wait before the step (type stated in SERVICE.md) |
| `wastes` | list | list of waste-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `wastes[]` | object | One declared waste row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `wastes[].category` | string | Must be one of the eight DOWNTIME categories — `defects`, `overproduction`, `waiting`, `non_utilized_talent`, `transportation`, `inventory`, `motion`, `excess_processing` (type and set stated in SERVICE.md) |
| `wastes[].step_name` | string | Must name a declared step (type stated in SERVICE.md) |

#### Read by: measurement_and_metrics

| Field | Type | Notes |
|---|---|---|
| `measure` | object | The measure section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `measure.baseline_established_with_data` | boolean | — |
| `measure.baseline_from_data_not_anecdote` | boolean | — |
| `metrics` | object | The metrics section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `metrics.leading_indicators_declared` | boolean | — |
| `metrics.lagging_indicators_declared` | boolean | — |
| `metrics.kpis_limited_to_meaningful_declared` | boolean | — |
| `metrics.metrics_made_visible` | boolean | — |

#### Read by: analysis_and_constraint

| Field | Type | Notes |
|---|---|---|
| `analyze` | object | The analyze section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `analyze.root_cause_analysis_performed` | boolean | — |
| `analyze.pareto_vital_few_identified` | boolean | — |
| `constraint` | object | The constraint section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `constraint.bottleneck_identified` | boolean | — |
| `constraint.non_bottleneck_effort_subordinated` | boolean | — |
| `constraint.bottleneck_step_name` | string | Must equal the computed bottleneck, see below (type stated in SERVICE.md) |

#### Read by: improvement_and_control

| Field | Type | Notes |
|---|---|---|
| `improve` | object | The improve section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `improve.improvement_piloted_before_scaling` | boolean | — |
| `improve.pdca_cycle_declared` | boolean | — |
| `improve.verified_against_baseline_before_scaling` | boolean | — |
| `improve.small_continuous_improvement_declared` | boolean | — |
| `improve.flow_and_pull_pursued_over_push` | boolean | — |
| `control` | object | The control section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `control.win_standardized` | boolean | — |
| `control.monitoring_in_place` | boolean | — |
| `control.regression_made_visible` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.automating_broken_process_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.vanity_metrics_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.hero_culture_reliance_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.optimizing_non_constraint_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.tradition_without_data_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.local_optimization_hurting_whole_present` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

All 40 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: define_and_visibility

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `process_problem_stated` | define: the process problem is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `process_goal_measurable_stated` | define: the goal is stated in measurable form | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `process_scope_stated` | define: the scope of the review is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `customer_need_stated` | define: the customer's actual need is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `whole_system_scope_declared` | systems thinking: the review covers the whole process, not only a local part | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `whole_flow_mapped` | value stream: the whole flow is mapped | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `work_made_visible` | visibility: the work is made visible — kanban or a simple dashboard | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `process_defined_before_automation` | the process is defined before it is automated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: steps_and_waste_observation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `steps_declared` | the declared record names its process steps — the steps list is present; an empty list declares that no steps are recorded | Computed over the declared record. Pass: the `steps` list is present — an empty list passes, because it declares that no steps are recorded. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_step_named` | steps: every declared step row names a non-empty step name | Computed over the declared record. Pass: every declared step row names a non-empty `name` string — on an empty list the check passes vacuously. Fail: a row names an empty name. Missing: the list is absent, or a row has `name` absent. |
| `every_step_times_declared_and_nonnegative` | steps: every declared step row declares a duration and a wait before it, and neither is negative — the waits expose the delays in the flow | Computed over the declared record. Pass: every declared step row declares both `duration_minutes` and `wait_before_minutes`, and neither is negative. Fail: a declared duration or wait is negative. Missing: the list is absent, or a row has either field absent. |
| `no_step_name_duplicated` | steps: no declared step name is owned by more than one step row | Computed over the declared record. Pass: no declared `name` string appears on more than one step row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_step_names`). Missing: the list is absent, or a row has `name` absent. |
| `wastes_declared` | the declared record names its waste observations — the wastes list is present; an empty list declares that no waste is observed | Computed over the declared record. Pass: the `wastes` list is present — an empty list passes, because it declares that no waste is observed. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_waste_category_valid_downtime` | wastes: every declared waste row's category is one of the eight DOWNTIME wastes — defects, overproduction, waiting, non-utilized talent, transportation, inventory, motion, excess processing | Computed over the declared record. Pass: every declared waste row's `category` is exactly one of the eight DOWNTIME categories — on an empty list the check passes vacuously. Fail: a row declares a `category` that is any other string. Missing: the list is absent, or a row has `category` absent. |
| `every_waste_step_names_declared_step` | wastes: every declared waste row names a step that is declared in the step record | Computed over the declared record. Pass: every declared waste row's `step_name` names a step declared in the `steps` list. Fail: a waste is tied to an undeclared step (offending names are named in `unmatched_waste_step_names`). Missing: the list is absent, or a row has `step_name` absent, or the `steps` list itself is absent. |

#### Section: measurement_and_metrics

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `baseline_established_with_data` | measure: a real baseline is established | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `baseline_from_data_not_anecdote` | measure: the baseline rests on data, not anecdote | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `leading_indicators_declared` | metrics: leading — predictive — indicators are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `lagging_indicators_declared` | metrics: lagging — outcome — indicators are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `kpis_limited_to_meaningful_declared` | metrics: the KPI set is limited to a few meaningful indicators | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `metrics_made_visible` | metrics: the indicators are made visible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: analysis_and_constraint

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `root_cause_analysis_performed` | analyze: root-cause analysis — 5 Whys or fishbone — is performed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pareto_vital_few_identified` | analyze: the Pareto vital few are identified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `process_bottleneck_identified` | theory of constraints: the bottleneck is identified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `non_bottleneck_effort_subordinated` | theory of constraints: everything else is subordinated to the bottleneck | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `declared_bottleneck_matches_longest_step` | theory of constraints: the declared bottleneck step is the longest declared step — the first step with the greatest declared duration | Computed over the declared record. Pass: `constraint.bottleneck_step_name` equals the computed bottleneck — the first declared step with the greatest `duration_minutes` (ties resolve to the first such step). Fail: the declared name does not equal the computed bottleneck. Missing: the step list is absent or empty, any step lacks a name or a duration, or the bottleneck name itself is absent. |

#### Section: improvement_and_control

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `improvement_piloted_before_scaling` | improve: the change is piloted before it is scaled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `improvement_pdca_cycle_declared` | improve: the improvement follows a PDCA cycle | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `improvement_verified_against_baseline_before_scaling` | improve: the pilot is verified against the baseline before scaling | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `small_continuous_improvement_declared` | improve: the change is a small continuous improvement — kaizen — not a big rare one | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `flow_and_pull_pursued_over_push` | improve: flow and pull are pursued over push | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `win_standardized` | control: the win is standardized | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `monitoring_in_place` | control: the standardized win is monitored | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `regression_made_visible` | control: regression is made visible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_automating_broken_process` | red line: no automating a broken process is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_vanity_metrics` | red line: no vanity metrics are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_hero_culture_reliance` | red line: no hero culture instead of systems is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_optimizing_non_constraint` | red line: no optimizing a non-constraint is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_tradition_without_data` | red line: no "we've always done it this way" without data is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_local_optimization_hurting_whole` | red line: no local optimization that hurts the whole is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"process-waste-review-coaching"`), `atom_version` (`"0.1.0"`), and `process` (the manifest's declared process value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `steps_count` and `wastes_count` (the declared list lengths as integers, or null when a list is not declared); `total_duration_minutes` and `total_wait_minutes` (the exact sums of the declared step numbers; each is null when its list is absent or any row omits that number, and 0 for an empty list); `wait_share` (total wait ÷ (total wait + total duration)); `distinct_waste_categories` (the valid DOWNTIME categories actually observed, in order of first appearance; null when the wastes list is absent); `duplicate_step_names` (step names declared on more than one row, in the order their second occurrence appears; null when the `steps` list is not declared, as recorded in the sparse case — see Discrepancies); `unmatched_waste_step_names` (waste rows' step names that name no declared step, per row in declared order; null when either list is absent); `waste_step_coverage` (waste rows naming a declared step ÷ declared waste rows); and `bottleneck_step_computed` (the computed bottleneck step name, or null when it cannot be computed from the declared rows). Ratios (`wait_share`, `waste_step_coverage`) are reported as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty (for `wait_share`, when either total is unavailable or the two totals sum to zero). Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; comparisons use the unrounded values — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "40 pass, 0 fail, 0 missing of 40 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared process value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `PROCESS_WASTE_REVIEW_READY` — all 40 checks pass: the declared process waste review record is complete and consistent with the bound skill's checklist and red lines.
- `PROCESS_WASTE_REVIEW_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the eight primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `steps_count`, `wastes_count`, `total_duration_minutes`, `total_wait_minutes`, `wait_share`, `distinct_waste_categories`, `duplicate_step_names`, `unmatched_waste_step_names`, `waste_step_coverage`, `bottleneck_step_computed` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"define","detail":"define must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type REVIEW — this atom sells the review it produces, a bounded judgment artifact, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Improve the system, not just the instance — make work visible, remove waste, and respect the people doing the work (operational excellence: Lean, Six Sigma DMAIC, Theory of Constraints — the bound capability, from the skill). You submit one declared record — the process waste review manifest, for one process, made at review time — and the atom audits that record for completeness and internal consistency against the bound skill's checklist and red lines, returning one deterministic verdict across 6 sections (`define_and_visibility`, `steps_and_waste_observation`, `measurement_and_metrics`, `analysis_and_constraint`, `improvement_and_control`, `red_lines`). Despite the atom's name, what is delivered is a **record audit** — a completeness and consistency review of a declared process-waste review record — never coaching of a person. The atom sells that review — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `steps` list must be present (an empty list passes: it declares that no steps are recorded), every step row must name a non-empty `name` and declare `duration_minutes` and `wait_before_minutes`, neither negative, and no step name may be duplicated; the declared `wastes` list must be present (an empty list passes: it declares that no waste is observed), every waste row's `category` must be exactly one of the eight DOWNTIME wastes and every waste row's `step_name` must name a declared step; and the declared `constraint.bottleneck_step_name` must equal the computed bottleneck, the first declared step with the greatest `duration_minutes` — using only the skill's own stated rules plus the arithmetic and consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `PROCESS_WASTE_REVIEW_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `PROCESS_WASTE_REVIEW_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states **no numeric threshold at all** — its demands are qualitative declarations the record makes, plus the classification and consistency rules above, not bars the atom can set. Quantities are computed and reported; the only bars on the computed rows are completeness, non-negativity, category validity, step-name consistency, and the bottleneck identity. Declined thresholds, named: a maximum wait share or wait time for a step or a process; a maximum or minimum number of steps, wastes, or waste categories a review must record; a cycle-time, lead-time, or throughput target; a number of KPIs that counts as "a few", or any KPI value target; a Pareto percentage (such as an 80/20 split) the vital few must account for; a number of Whys a root-cause analysis must ask; a bottleneck utilization or capacity figure; a pilot size, duration, or success percentage; an improvement percentage a pilot must achieve against baseline before scaling; a monitoring frequency or a regression threshold; a 5S audit score (5S is named in the skill's Lean survey but states no record field or score the review can check — it is not reduced to a check).

**What it does NOT do.** The atom audits a **declared** process review record: a verdict of `PROCESS_WASTE_REVIEW_READY` means the record is complete and consistent *on the caller's declared evidence* — a record that declares a data baseline, a mapped flow, and no anti-patterns passes those checks even if the real review did none of it. It is a completeness and consistency audit of the review record the skill requires, **not a consulting engagement, a Lean/Six Sigma certification, an operational audit of a real process, or a prediction that removing the declared waste will improve the process**. Specifically: it observes no process itself, times no step, interviews no one, inspects no workplace, dashboard, or value-stream map, and does not verify that a declared review was ever carried out. It never judges whether the named bottleneck is really the system's constraint in the world, whether the declared root cause is the true cause, whether a waste classification is the best one, or whether the improvement will work — only that the record contains what the skill's method demands, and that its declared step and waste rows are internally consistent and arithmetically sound. Named exclusions and non-reducible parts (carried as caller declarations only, never judged): no numeric thresholds at all (see the declined list above); no live verification of any declared fact; no judgment of review *quality* — whether the mapping, analysis, or improvement is adequate for the real process is the caller's declaration, checked only for declared presence and consistency; **the skill's person-directed coaching steps are excluded entirely** — its "How to coach Nrupal specifically" material (reinforcing one named person's habits, telling that person to do less properly, closing that person's open loops, naming trade-offs to that person) is interpersonal coaching of an individual, not a process record, and no check in this atom reads, scores, or outputs anything about a person; likewise the skill's respect-for-people principle is honoured by the record's shape (the review is of a process, never of a person's performance) and is not itself a check, because it states no record field that could be declared or falsified.

**Buyer and use context.** Teams and agents working in How Milo works who need this review on demand and would rather buy it per use than build or staff the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Release process improvement coaching (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was deployed census-style under a U-13 flag, and the flag stays open for the Director's review. U-13 screen, as recorded in SERVICE.md: the screen was triggered by the "coaching" keyword in the atom's name. Screen result: **No — with the coaching exclusion applied and named.** SERVICE.md records the screen in full: "This atom's output could not read as regulated professional advice, and in particular it is not psychology-adjacent coaching: the census precedent disabled `difficult-conversation-coaching` because its subject was an interpersonal conversation with a person. This atom's subject is the opposite — an operations process record. Its output is a record audit (completeness, classification, and consistency of a declared process-waste review: step rows, DOWNTIME waste rows, a baseline declaration, a bottleneck identity); it coaches no person, assesses no person's behaviour, mental state, relationships, or performance, and offers no interpersonal, psychological, engineering, financial, medical, or legal advice." The named exclusion, exactly as SERVICE.md records it: **the bound skill's one person-directed section ("How to coach Nrupal specifically") is excluded by design as a named red line** — in SERVICE.md's Honest scoping, "the skill's person-directed coaching steps are excluded entirely — its 'How to coach Nrupal specifically' material (reinforcing one named person's habits, telling that person to do less properly, closing that person's open loops, naming trade-offs to that person) is interpersonal coaching of an individual, not a process record, and no check in this atom reads, scores, or outputs anything about a person"; no check derives from that section. The remaining skill content is operations method (Lean wastes, DMAIC, Theory of Constraints) applied to a declared record, which SERVICE.md records is not a regulated professional service. Operations-record audit only: the verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence and not regulated professional advice. The U-13 flag is not closed by this document or by deployment: it stays open for the Director's review.

### For integrators (Users)

You need: a gateway key with the `process_waste_review_coaching` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/process_waste_review_coaching.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_process_waste_review_coaching.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/process-waste-review-coaching` (REST) and `POST /mcp/process-waste-review-coaching` (MCP, tool `process_waste_review_coaching`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 9595ea665b634289aad158b7fff277ac). Key scope: `process_waste_review_coaching`. U-13 flag: deployed under a screen-NO U-13 flag with the named coaching exclusion (see For regulators); the flag stays open for the Director's review — do not treat deployment as closing it. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for several attestation checks, for the red-line checks and for the computed checks. Recorded check names used verbatim in the Checks section include `process_problem_stated` (input `define.problem_stated`), `process_goal_measurable_stated` (input `define.goal_measurable_stated` — see item 2), `process_scope_stated` (input `define.scope_stated`), `process_bottleneck_identified` (input `constraint.bottleneck_identified`), `improvement_piloted_before_scaling` (input `improve.improvement_piloted_before_scaling`), `improvement_pdca_cycle_declared` (input `improve.pdca_cycle_declared`) and `improvement_verified_against_baseline_before_scaling` (input `improve.verified_against_baseline_before_scaling`); the six red-line checks `no_automating_broken_process`, `no_vanity_metrics`, `no_hero_culture_reliance`, `no_optimizing_non_constraint`, `no_tradition_without_data` and `no_local_optimization_hurting_whole` (inputs `red_lines.automating_broken_process_present`, `red_lines.vanity_metrics_present`, `red_lines.hero_culture_reliance_present`, `red_lines.optimizing_non_constraint_present`, `red_lines.tradition_without_data_present` and `red_lines.local_optimization_hurting_whole_present`); plus the computed checks `steps_declared`, `every_step_named`, `every_step_times_declared_and_nonnegative`, `no_step_name_duplicated`, `wastes_declared`, `every_waste_category_valid_downtime`, `every_waste_step_names_declared_step` and `declared_bottleneck_matches_longest_step`, which read the `steps` / `wastes` rows and `constraint.bottleneck_step_name` rather than any single input field of the same name. The remaining recorded check names match the leaf name of the input field they read (for example `customer_need_stated` reads `define.customer_need_stated`).
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`define`, `mapping`, `measure`, `metrics`, `analyze`, `constraint`, `improve`, `control`, `red_lines`) or for a `steps[]` or `wastes[]` row object. The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and `steps` / `wastes`, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 40 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `define` and `mapping` inputs are read by the single recorded section `define_and_visibility`, `steps` and `wastes` inputs are read by the single recorded section `steps_and_waste_observation`, `measure` and `metrics` inputs are read by the single recorded section `measurement_and_metrics`, `analyze` and `constraint` inputs are read by the single recorded section `analysis_and_constraint`, and `improve` and `control` inputs are read by the single recorded section `improvement_and_control`. This document groups the Input reference and the Checks by the recorded section names.
6. **Null list on an undeclared `steps` list — `duplicate_step_names`:** SERVICE.md's output paragraph states the null rules for `computed_status`, `steps_count` and `wastes_count`, the totals, `wait_share`, `distinct_waste_categories` (null when the wastes list is absent), `unmatched_waste_step_names` (null when either list is absent), `waste_step_coverage` and `bottleneck_step_computed`, but does not state a null rule for `duplicate_step_names`. The recorded sparse response returns `duplicate_step_names` as `null` when `steps` is not declared (USER-GUIDE.md's verdict paragraph likewise gives no null rule for that list); this document follows the recording.
7. **Case-design prose divergences (corrections.json — corrected at design time, before execution):** the recorded corrections record 5 tester errors, none scored against the atom and none in the executed battery. (R1, ×2) The original violations design named the input field paths `constraint.bottleneck_step_name` and `red_lines.automating_broken_process_present` in `failing_checks` instead of exact check names; the validator rejected both, and the case was rebuilt with the exact check names `declared_bottleneck_matches_longest_step` and `no_automating_broken_process` among its 6 failing checks. (R2, ×2) The original full-pass and violations `expect` blocks carried no structured `computed_spot_checks` — the computed quantities appeared only in prose notes, in the full-pass case with `wait_share` as a bare number rather than the fixed 6-decimal string; structured spot checks computed from the Python oracle were injected before execution. (R3, ×1) The original violations input was a sparse manifest missing 43 key paths present in the full-pass manifest; it was rebuilt as a deep copy of the full-pass manifest, changing values only. The corrected, executed cases in cases.json match the recorded executions in evidence.json in inputs and expects; where the design-time prose (including the R3 key-path list, which names `define.goal_measurable_stated` — see item 2) differed, the recorded inputs and responses govern, and this document follows them.

## Worked examples

Provenance: recorded 2026-11-16T09:46:34.308509+00:00 against gateway v1.1.0, external verification lane, source `verification/work/process-waste-review-coaching/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T09:46:34.308509+00:00 · gateway v1.1.0 · source `verification/work/process-waste-review-coaching/evidence.json`.

Input:

```json
{
  "process": "Order Fulfillment",
  "define": {
    "problem_stated": true,
    "goal_measurable_stated": true,
    "scope_stated": true,
    "customer_need_stated": true,
    "whole_system_scope_declared": true
  },
  "mapping": {
    "whole_flow_mapped": true,
    "work_made_visible": true,
    "process_defined_before_automation": true
  },
  "steps": [
    {
      "name": "Pick",
      "duration_minutes": 10,
      "wait_before_minutes": 2
    },
    {
      "name": "Pack",
      "duration_minutes": 5,
      "wait_before_minutes": 1
    }
  ],
  "wastes": [
    {
      "category": "waiting",
      "step_name": "Pick"
    }
  ],
  "measure": {
    "baseline_established_with_data": true,
    "baseline_from_data_not_anecdote": true
  },
  "metrics": {
    "leading_indicators_declared": true,
    "lagging_indicators_declared": true,
    "kpis_limited_to_meaningful_declared": true,
    "metrics_made_visible": true
  },
  "analyze": {
    "root_cause_analysis_performed": true,
    "pareto_vital_few_identified": true
  },
  "constraint": {
    "bottleneck_identified": true,
    "non_bottleneck_effort_subordinated": true,
    "bottleneck_step_name": "Pick"
  },
  "improve": {
    "improvement_piloted_before_scaling": true,
    "pdca_cycle_declared": true,
    "verified_against_baseline_before_scaling": true,
    "small_continuous_improvement_declared": true,
    "flow_and_pull_pursued_over_push": true
  },
  "control": {
    "win_standardized": true,
    "monitoring_in_place": true,
    "regression_made_visible": true
  },
  "red_lines": {
    "automating_broken_process_present": false,
    "vanity_metrics_present": false,
    "hero_culture_reliance_present": false,
    "optimizing_non_constraint_present": false,
    "tradition_without_data_present": false,
    "local_optimization_hurting_whole_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "process-waste-review-coaching",
  "atom_version": "0.1.0",
  "process": "Order Fulfillment",
  "verdict": "PROCESS_WASTE_REVIEW_READY",
  "sections": {
    "define_and_visibility": "pass",
    "steps_and_waste_observation": "pass",
    "measurement_and_metrics": "pass",
    "analysis_and_constraint": "pass",
    "improvement_and_control": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "define_and_visibility",
      "check": "process_problem_stated",
      "status": "pass",
      "evidence": "define: the process problem is stated"
    },
    {
      "section": "define_and_visibility",
      "check": "process_goal_measurable_stated",
      "status": "pass",
      "evidence": "define: the goal is stated in measurable form"
    },
    {
      "section": "define_and_visibility",
      "check": "process_scope_stated",
      "status": "pass",
      "evidence": "define: the scope of the review is stated"
    },
    {
      "section": "define_and_visibility",
      "check": "customer_need_stated",
      "status": "pass",
      "evidence": "define: the customer's actual need is stated"
    },
    {
      "section": "define_and_visibility",
      "check": "whole_system_scope_declared",
      "status": "pass",
      "evidence": "systems thinking: the review covers the whole process, not only a local part"
    },
    {
      "section": "define_and_visibility",
      "check": "whole_flow_mapped",
      "status": "pass",
      "evidence": "value stream: the whole flow is mapped"
    },
    {
      "section": "define_and_visibility",
      "check": "work_made_visible",
      "status": "pass",
      "evidence": "visibility: the work is made visible — kanban or a simple dashboard"
    },
    {
      "section": "define_and_visibility",
      "check": "process_defined_before_automation",
      "status": "pass",
      "evidence": "the process is defined before it is automated"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "steps_declared",
      "status": "pass",
      "evidence": "the declared record names its process steps — the steps list is present; an empty list declares that no steps are recorded"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "every_step_named",
      "status": "pass",
      "evidence": "steps: every declared step row names a non-empty step name"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "every_step_times_declared_and_nonnegative",
      "status": "pass",
      "evidence": "steps: every declared step row declares a duration and a wait before it, and neither is negative — the waits expose the delays in the flow"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "no_step_name_duplicated",
      "status": "pass",
      "evidence": "steps: no declared step name is owned by more than one step row"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "wastes_declared",
      "status": "pass",
      "evidence": "the declared record names its waste observations — the wastes list is present; an empty list declares that no waste is observed"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "every_waste_category_valid_downtime",
      "status": "pass",
      "evidence": "wastes: every declared waste row's category is one of the eight DOWNTIME wastes — defects, overproduction, waiting, non-utilized talent, transportation, inventory, motion, excess processing"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "every_waste_step_names_declared_step",
      "status": "pass",
      "evidence": "wastes: every declared waste row names a step that is declared in the step record"
    },
    {
      "section": "measurement_and_metrics",
      "check": "baseline_established_with_data",
      "status": "pass",
      "evidence": "measure: a real baseline is established"
    },
    {
      "section": "measurement_and_metrics",
      "check": "baseline_from_data_not_anecdote",
      "status": "pass",
      "evidence": "measure: the baseline rests on data, not anecdote"
    },
    {
      "section": "measurement_and_metrics",
      "check": "leading_indicators_declared",
      "status": "pass",
      "evidence": "metrics: leading — predictive — indicators are declared"
    },
    {
      "section": "measurement_and_metrics",
      "check": "lagging_indicators_declared",
      "status": "pass",
      "evidence": "metrics: lagging — outcome — indicators are declared"
    },
    {
      "section": "measurement_and_metrics",
      "check": "kpis_limited_to_meaningful_declared",
      "status": "pass",
      "evidence": "metrics: the KPI set is limited to a few meaningful indicators"
    },
    {
      "section": "measurement_and_metrics",
      "check": "metrics_made_visible",
      "status": "pass",
      "evidence": "metrics: the indicators are made visible"
    },
    {
      "section": "analysis_and_constraint",
      "check": "root_cause_analysis_performed",
      "status": "pass",
      "evidence": "analyze: root-cause analysis — 5 Whys or fishbone — is performed"
    },
    {
      "section": "analysis_and_constraint",
      "check": "pareto_vital_few_identified",
      "status": "pass",
      "evidence": "analyze: the Pareto vital few are identified"
    },
    {
      "section": "analysis_and_constraint",
      "check": "process_bottleneck_identified",
      "status": "pass",
      "evidence": "theory of constraints: the bottleneck is identified"
    },
    {
      "section": "analysis_and_constraint",
      "check": "non_bottleneck_effort_subordinated",
      "status": "pass",
      "evidence": "theory of constraints: everything else is subordinated to the bottleneck"
    },
    {
      "section": "analysis_and_constraint",
      "check": "declared_bottleneck_matches_longest_step",
      "status": "pass",
      "evidence": "theory of constraints: the declared bottleneck step is the longest declared step — the first step with the greatest declared duration"
    },
    {
      "section": "improvement_and_control",
      "check": "improvement_piloted_before_scaling",
      "status": "pass",
      "evidence": "improve: the change is piloted before it is scaled"
    },
    {
      "section": "improvement_and_control",
      "check": "improvement_pdca_cycle_declared",
      "status": "pass",
      "evidence": "improve: the improvement follows a PDCA cycle"
    },
    {
      "section": "improvement_and_control",
      "check": "improvement_verified_against_baseline_before_scaling",
      "status": "pass",
      "evidence": "improve: the pilot is verified against the baseline before scaling"
    },
    {
      "section": "improvement_and_control",
      "check": "small_continuous_improvement_declared",
      "status": "pass",
      "evidence": "improve: the change is a small continuous improvement — kaizen — not a big rare one"
    },
    {
      "section": "improvement_and_control",
      "check": "flow_and_pull_pursued_over_push",
      "status": "pass",
      "evidence": "improve: flow and pull are pursued over push"
    },
    {
      "section": "improvement_and_control",
      "check": "win_standardized",
      "status": "pass",
      "evidence": "control: the win is standardized"
    },
    {
      "section": "improvement_and_control",
      "check": "monitoring_in_place",
      "status": "pass",
      "evidence": "control: the standardized win is monitored"
    },
    {
      "section": "improvement_and_control",
      "check": "regression_made_visible",
      "status": "pass",
      "evidence": "control: regression is made visible"
    },
    {
      "section": "red_lines",
      "check": "no_automating_broken_process",
      "status": "pass",
      "evidence": "red line: no automating a broken process is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_vanity_metrics",
      "status": "pass",
      "evidence": "red line: no vanity metrics are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_hero_culture_reliance",
      "status": "pass",
      "evidence": "red line: no hero culture instead of systems is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_optimizing_non_constraint",
      "status": "pass",
      "evidence": "red line: no optimizing a non-constraint is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_tradition_without_data",
      "status": "pass",
      "evidence": "red line: no \"we've always done it this way\" without data is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_local_optimization_hurting_whole",
      "status": "pass",
      "evidence": "red line: no local optimization that hurts the whole is present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "steps_count": 2,
  "wastes_count": 1,
  "total_duration_minutes": 15,
  "total_wait_minutes": 3,
  "wait_share": "0.166667",
  "distinct_waste_categories": [
    "waiting"
  ],
  "duplicate_step_names": [],
  "unmatched_waste_step_names": [],
  "waste_step_coverage": "1.000000",
  "bottleneck_step_computed": "Pick",
  "summary": "40 pass, 0 fail, 0 missing of 40 checks across six sections.",
  "stamp": "PROCESS WASTE REVIEW COACHING\nprocess: Order Fulfillment\nVERDICT: PROCESS_WASTE_REVIEW_READY\n  define_and_visibility                        pass\n  steps_and_waste_observation                  pass\n  measurement_and_metrics                      pass\n  analysis_and_constraint                      pass\n  improvement_and_control                      pass\n  red_lines                                    pass\n40 pass, 0 fail, 0 missing of 40 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T09:46:34.308509+00:00 · gateway v1.1.0 · source `verification/work/process-waste-review-coaching/evidence.json`.

Input:

```json
{
  "process": "Order Fulfillment",
  "define": {
    "problem_stated": false,
    "goal_measurable_stated": true,
    "scope_stated": true,
    "customer_need_stated": true,
    "whole_system_scope_declared": true
  },
  "mapping": {
    "whole_flow_mapped": true,
    "work_made_visible": true,
    "process_defined_before_automation": true
  },
  "steps": [
    {
      "name": "Pick",
      "duration_minutes": 10,
      "wait_before_minutes": 2
    },
    {
      "name": "Pick",
      "duration_minutes": 5,
      "wait_before_minutes": 1
    }
  ],
  "wastes": [
    {
      "category": "unknown_waste",
      "step_name": "UnknownStep"
    }
  ],
  "measure": {
    "baseline_established_with_data": true,
    "baseline_from_data_not_anecdote": true
  },
  "metrics": {
    "leading_indicators_declared": true,
    "lagging_indicators_declared": true,
    "kpis_limited_to_meaningful_declared": true,
    "metrics_made_visible": true
  },
  "analyze": {
    "root_cause_analysis_performed": true,
    "pareto_vital_few_identified": true
  },
  "constraint": {
    "bottleneck_identified": true,
    "non_bottleneck_effort_subordinated": true,
    "bottleneck_step_name": "Pack"
  },
  "improve": {
    "improvement_piloted_before_scaling": true,
    "pdca_cycle_declared": true,
    "verified_against_baseline_before_scaling": true,
    "small_continuous_improvement_declared": true,
    "flow_and_pull_pursued_over_push": true
  },
  "control": {
    "win_standardized": true,
    "monitoring_in_place": true,
    "regression_made_visible": true
  },
  "red_lines": {
    "automating_broken_process_present": true,
    "vanity_metrics_present": false,
    "hero_culture_reliance_present": false,
    "optimizing_non_constraint_present": false,
    "tradition_without_data_present": false,
    "local_optimization_hurting_whole_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "process-waste-review-coaching",
  "atom_version": "0.1.0",
  "process": "Order Fulfillment",
  "verdict": "PROCESS_WASTE_REVIEW_NOT_READY",
  "sections": {
    "define_and_visibility": "fail",
    "steps_and_waste_observation": "fail",
    "measurement_and_metrics": "pass",
    "analysis_and_constraint": "fail",
    "improvement_and_control": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "define_and_visibility",
      "check": "process_problem_stated",
      "status": "fail",
      "evidence": "define: the process problem is stated"
    },
    {
      "section": "define_and_visibility",
      "check": "process_goal_measurable_stated",
      "status": "pass",
      "evidence": "define: the goal is stated in measurable form"
    },
    {
      "section": "define_and_visibility",
      "check": "process_scope_stated",
      "status": "pass",
      "evidence": "define: the scope of the review is stated"
    },
    {
      "section": "define_and_visibility",
      "check": "customer_need_stated",
      "status": "pass",
      "evidence": "define: the customer's actual need is stated"
    },
    {
      "section": "define_and_visibility",
      "check": "whole_system_scope_declared",
      "status": "pass",
      "evidence": "systems thinking: the review covers the whole process, not only a local part"
    },
    {
      "section": "define_and_visibility",
      "check": "whole_flow_mapped",
      "status": "pass",
      "evidence": "value stream: the whole flow is mapped"
    },
    {
      "section": "define_and_visibility",
      "check": "work_made_visible",
      "status": "pass",
      "evidence": "visibility: the work is made visible — kanban or a simple dashboard"
    },
    {
      "section": "define_and_visibility",
      "check": "process_defined_before_automation",
      "status": "pass",
      "evidence": "the process is defined before it is automated"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "steps_declared",
      "status": "pass",
      "evidence": "the declared record names its process steps — the steps list is present; an empty list declares that no steps are recorded"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "every_step_named",
      "status": "pass",
      "evidence": "steps: every declared step row names a non-empty step name"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "every_step_times_declared_and_nonnegative",
      "status": "pass",
      "evidence": "steps: every declared step row declares a duration and a wait before it, and neither is negative — the waits expose the delays in the flow"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "no_step_name_duplicated",
      "status": "fail",
      "evidence": "steps: no declared step name is owned by more than one step row"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "wastes_declared",
      "status": "pass",
      "evidence": "the declared record names its waste observations — the wastes list is present; an empty list declares that no waste is observed"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "every_waste_category_valid_downtime",
      "status": "fail",
      "evidence": "wastes: every declared waste row's category is one of the eight DOWNTIME wastes — defects, overproduction, waiting, non-utilized talent, transportation, inventory, motion, excess processing"
    },
    {
      "section": "steps_and_waste_observation",
      "check": "every_waste_step_names_declared_step",
      "status": "fail",
      "evidence": "wastes: every declared waste row names a step that is declared in the step record"
    },
    {
      "section": "measurement_and_metrics",
      "check": "baseline_established_with_data",
      "status": "pass",
      "evidence": "measure: a real baseline is established"
    },
    {
      "section": "measurement_and_metrics",
      "check": "baseline_from_data_not_anecdote",
      "status": "pass",
      "evidence": "measure: the baseline rests on data, not anecdote"
    },
    {
      "section": "measurement_and_metrics",
      "check": "leading_indicators_declared",
      "status": "pass",
      "evidence": "metrics: leading — predictive — indicators are declared"
    },
    {
      "section": "measurement_and_metrics",
      "check": "lagging_indicators_declared",
      "status": "pass",
      "evidence": "metrics: lagging — outcome — indicators are declared"
    },
    {
      "section": "measurement_and_metrics",
      "check": "kpis_limited_to_meaningful_declared",
      "status": "pass",
      "evidence": "metrics: the KPI set is limited to a few meaningful indicators"
    },
    {
      "section": "measurement_and_metrics",
      "check": "metrics_made_visible",
      "status": "pass",
      "evidence": "metrics: the indicators are made visible"
    },
    {
      "section": "analysis_and_constraint",
      "check": "root_cause_analysis_performed",
      "status": "pass",
      "evidence": "analyze: root-cause analysis — 5 Whys or fishbone — is performed"
    },
    {
      "section": "analysis_and_constraint",
      "check": "pareto_vital_few_identified",
      "status": "pass",
      "evidence": "analyze: the Pareto vital few are identified"
    },
    {
      "section": "analysis_and_constraint",
      "check": "process_bottleneck_identified",
      "status": "pass",
      "evidence": "theory of constraints: the bottleneck is identified"
    },
    {
      "section": "analysis_and_constraint",
      "check": "non_bottleneck_effort_subordinated",
      "status": "pass",
      "evidence": "theory of constraints: everything else is subordinated to the bottleneck"
    },
    {
      "section": "analysis_and_constraint",
      "check": "declared_bottleneck_matches_longest_step",
      "status": "fail",
      "evidence": "theory of constraints: the declared bottleneck step is the longest declared step — the first step with the greatest declared duration"
    },
    {
      "section": "improvement_and_control",
      "check": "improvement_piloted_before_scaling",
      "status": "pass",
      "evidence": "improve: the change is piloted before it is scaled"
    },
    {
      "section": "improvement_and_control",
      "check": "improvement_pdca_cycle_declared",
      "status": "pass",
      "evidence": "improve: the improvement follows a PDCA cycle"
    },
    {
      "section": "improvement_and_control",
      "check": "improvement_verified_against_baseline_before_scaling",
      "status": "pass",
      "evidence": "improve: the pilot is verified against the baseline before scaling"
    },
    {
      "section": "improvement_and_control",
      "check": "small_continuous_improvement_declared",
      "status": "pass",
      "evidence": "improve: the change is a small continuous improvement — kaizen — not a big rare one"
    },
    {
      "section": "improvement_and_control",
      "check": "flow_and_pull_pursued_over_push",
      "status": "pass",
      "evidence": "improve: flow and pull are pursued over push"
    },
    {
      "section": "improvement_and_control",
      "check": "win_standardized",
      "status": "pass",
      "evidence": "control: the win is standardized"
    },
    {
      "section": "improvement_and_control",
      "check": "monitoring_in_place",
      "status": "pass",
      "evidence": "control: the standardized win is monitored"
    },
    {
      "section": "improvement_and_control",
      "check": "regression_made_visible",
      "status": "pass",
      "evidence": "control: regression is made visible"
    },
    {
      "section": "red_lines",
      "check": "no_automating_broken_process",
      "status": "fail",
      "evidence": "red line: no automating a broken process is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_vanity_metrics",
      "status": "pass",
      "evidence": "red line: no vanity metrics are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_hero_culture_reliance",
      "status": "pass",
      "evidence": "red line: no hero culture instead of systems is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_optimizing_non_constraint",
      "status": "pass",
      "evidence": "red line: no optimizing a non-constraint is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_tradition_without_data",
      "status": "pass",
      "evidence": "red line: no \"we've always done it this way\" without data is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_local_optimization_hurting_whole",
      "status": "pass",
      "evidence": "red line: no local optimization that hurts the whole is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "steps_count": 2,
  "wastes_count": 1,
  "total_duration_minutes": 15,
  "total_wait_minutes": 3,
  "wait_share": "0.166667",
  "distinct_waste_categories": [],
  "duplicate_step_names": [
    "Pick"
  ],
  "unmatched_waste_step_names": [
    "UnknownStep"
  ],
  "waste_step_coverage": "0.000000",
  "bottleneck_step_computed": "Pick",
  "summary": "34 pass, 6 fail, 0 missing of 40 checks across six sections.",
  "stamp": "PROCESS WASTE REVIEW COACHING\nprocess: Order Fulfillment\nVERDICT: PROCESS_WASTE_REVIEW_NOT_READY\n  define_and_visibility                        fail\n  steps_and_waste_observation                  fail\n  measurement_and_metrics                      pass\n  analysis_and_constraint                      fail\n  improvement_and_control                      pass\n  red_lines                                    fail\n34 pass, 6 fail, 0 missing of 40 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T09:46:34.308509+00:00 · gateway v1.1.0 · source `verification/work/process-waste-review-coaching/evidence.json`.

Input:

```json
{
  "process": "Malformed Input",
  "define": "not_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "define",
  "detail": "define must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — U-13 screen recorded as screen **No — with the coaching exclusion applied and named** (operations-record audit only; the bound skill's person-directed section "How to coach Nrupal specifically" excluded by design as a red line), and the flag stated to stay open for the Director's review |
| Checks named | 40 documented / 40 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`steps_count`, `wastes_count`, the two totals, the two ratios, the three row-name / category lists and `bottleneck_step_computed`) |
| Input reference typed | Yes — 52 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/process-waste-review-coaching/evidence.json` |
