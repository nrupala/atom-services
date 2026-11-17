# Process waste review coaching — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have carried out a process waste review — problem and measurable goal defined, the whole flow mapped, step durations and waits recorded, waste observations classified, a baseline, an analysis, an improvement and a control plan — and you have a record of that review. Despite the atom's name, what is delivered is a **record audit**, never coaching of a person: this atom reads one declared manifest and returns one deterministic verdict across six sections (define_and_visibility, steps_and_waste_observation, measurement_and_metrics, analysis_and_constraint, improvement_and_control, red_lines): **PROCESS_WASTE_REVIEW_READY**, **PROCESS_WASTE_REVIEW_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 40 checks. It audits the declared review record's completeness and consistency only — it observes no process itself, times no step, interviews no one, inspects no workplace, dashboard, or value-stream map, and does not verify that a declared review was ever carried out. A review is ready *on your declared evidence*: it never judges whether the named bottleneck is really the system's constraint in the world, whether the declared root cause is the true cause, whether a waste classification is the best one, or whether the improvement will work. It is not a consulting engagement, a Lean/Six Sigma certification, an operational audit of a real process, or a prediction that removing the declared waste will improve the process. The skill's person-directed coaching steps are excluded entirely — no check reads, scores, or outputs anything about a person; the review is of a process, never of a person's performance. The computed checks: the declared `steps` list must be present (an empty list passes — it declares that no steps are recorded); every step row must name a non-empty `name` and declare `duration_minutes` and `wait_before_minutes`, neither negative; no step name may be duplicated; the declared `wastes` list must be present (an empty list passes — it declares that no waste is observed); every waste row's `category` must be exactly one of the eight DOWNTIME wastes (`defects`, `overproduction`, `waiting`, `non_utilized_talent`, `transportation`, `inventory`, `motion`, `excess_processing`); every waste row's `step_name` must name a declared step; and the declared `constraint.bottleneck_step_name` must equal the computed bottleneck — the first declared step with the greatest `duration_minutes`. The skill states no numeric threshold at all, and none is imposed — declined thresholds, named: no maximum wait share or wait time for a step or a process; no maximum or minimum number of steps, wastes, or waste categories a review must record; no cycle-time, lead-time, or throughput target; no number of KPIs that counts as "a few", and no KPI value target; no Pareto percentage (such as an 80/20 split) the vital few must account for; no number of Whys a root-cause analysis must ask; no bottleneck utilization or capacity figure; no pilot size, duration, or success percentage; no improvement percentage a pilot must achieve against baseline before scaling; no monitoring frequency or regression threshold; and no 5S audit score. Quantities are computed and reported; the only bars on the computed rows are completeness, non-negativity, category validity, step-name consistency, and the bottleneck identity. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "process-waste-review-coaching"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/process-waste-review-coaching` — tool name `process_waste_review_coaching`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/process-waste-review-coaching` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `process` | Process name (string; carried into the output, not checked) |
| `define.problem_stated` | define evidence: the process problem is stated |
| `define.goal_measurable_stated` | define evidence: the goal is stated in measurable form |
| `define.scope_stated` | define evidence: the scope of the review is stated |
| `define.customer_need_stated` | define evidence: the customer's actual need is stated |
| `define.whole_system_scope_declared` | define evidence: the review covers the whole process, not only a local part |
| `mapping.whole_flow_mapped` | mapping evidence: the whole flow is mapped |
| `mapping.work_made_visible` | mapping evidence: the work is made visible |
| `mapping.process_defined_before_automation` | mapping evidence: the process is defined before it is automated |
| `steps` (list of step-row objects) | computed: must be present (an empty list declares no steps recorded); reported as `steps_count` |
| `steps[].name` (string) | names the row in the computed outputs; computed: every row must name a non-empty name and no name may appear on more than one row |
| `steps[].duration_minutes` (number) | computed: every row must declare it and it may not be negative; summed into `total_duration_minutes` |
| `steps[].wait_before_minutes` (number) | computed: every row must declare it and it may not be negative; summed into `total_wait_minutes` |
| `wastes` (list of waste-row objects) | computed: must be present (an empty list declares no waste observed); reported as `wastes_count` |
| `wastes[].category` (string) | computed: must be exactly one of the eight DOWNTIME categories (`defects`, `overproduction`, `waiting`, `non_utilized_talent`, `transportation`, `inventory`, `motion`, `excess_processing`) |
| `wastes[].step_name` (string) | computed: must name a step declared in the `steps` list |
| `measure.baseline_established_with_data` | measure evidence: a real baseline is established with data |
| `measure.baseline_from_data_not_anecdote` | measure evidence: the baseline rests on data, not anecdote |
| `metrics.leading_indicators_declared` | metrics evidence: leading (predictive) indicators are declared |
| `metrics.lagging_indicators_declared` | metrics evidence: lagging (outcome) indicators are declared |
| `metrics.kpis_limited_to_meaningful_declared` | metrics evidence: the KPI set is limited to a few meaningful indicators |
| `metrics.metrics_made_visible` | metrics evidence: the indicators are made visible |
| `analyze.root_cause_analysis_performed` | analyze evidence: root-cause analysis (5 Whys or fishbone) is performed |
| `analyze.pareto_vital_few_identified` | analyze evidence: the Pareto vital few are identified |
| `constraint.bottleneck_identified` | constraint evidence: the bottleneck is identified |
| `constraint.non_bottleneck_effort_subordinated` | constraint evidence: everything else is subordinated to the bottleneck |
| `constraint.bottleneck_step_name` (string) | computed: must equal the computed bottleneck — the first declared step with the greatest `duration_minutes`; reported back as `bottleneck_step_computed` |
| `improve.improvement_piloted_before_scaling` | improve evidence: the change is piloted before it is scaled |
| `improve.pdca_cycle_declared` | improve evidence: the improvement follows a PDCA cycle |
| `improve.verified_against_baseline_before_scaling` | improve evidence: the pilot is verified against the baseline before scaling |
| `improve.small_continuous_improvement_declared` | improve evidence: the change is a small continuous improvement (kaizen) |
| `improve.flow_and_pull_pursued_over_push` | improve evidence: flow and pull are pursued over push |
| `control.win_standardized` | control evidence: the win is standardized |
| `control.monitoring_in_place` | control evidence: the standardized win is monitored |
| `control.regression_made_visible` | control evidence: regression is made visible |
| `red_lines.automating_broken_process_present` | must be `false` to pass (red line by design: no automating a broken process) |
| `red_lines.vanity_metrics_present` | must be `false` to pass (red line by design: no vanity metrics) |
| `red_lines.hero_culture_reliance_present` | must be `false` to pass (red line by design: no hero culture instead of systems) |
| `red_lines.optimizing_non_constraint_present` | must be `false` to pass (red line by design: no optimizing a non-constraint) |
| `red_lines.tradition_without_data_present` | must be `false` to pass (red line by design: no "we've always done it this way" without data) |
| `red_lines.local_optimization_hurting_whole_present` | must be `false` to pass (red line by design: no local optimization that hurts the whole) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward PROCESS_WASTE_REVIEW_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/process-waste-review-coaching`:

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

Response — HTTP 200 (trimmed; the full response carries all 40 checks and a text stamp of the verdict):

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
  "summary": "40 pass, 0 fail, 0 missing of 40 checks across six sections."
}
```

## Verdicts

- **PROCESS_WASTE_REVIEW_READY** — every check passes; the declared process waste review record is complete and consistent with the skill's checklist and red lines.
- **PROCESS_WASTE_REVIEW_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `steps_count` and `wastes_count` (the declared list lengths as integers, or null when a list is not declared), `total_duration_minutes` and `total_wait_minutes` (the exact sums of the declared step numbers; each is null when its list is absent or any row omits that number, and 0 for an empty list), `wait_share` (total wait ÷ (total wait + total duration)), `distinct_waste_categories` (the valid DOWNTIME categories actually observed, in order of first appearance; null when the wastes list is absent), `duplicate_step_names` (step names declared on more than one row, in the order their second occurrence appears), `unmatched_waste_step_names` (waste rows' step names that name no declared step, per row in declared order; null when either list is absent), `waste_step_coverage` (waste rows naming a declared step ÷ declared waste rows), and `bottleneck_step_computed` (the computed bottleneck step name, or null when it cannot be computed from the declared rows). Ratios (`wait_share`, `waste_step_coverage`) are reported as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty (for `wait_share`, when either total is unavailable or the two totals sum to zero). `computed_status` is `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the eight primary computed checks cannot be completed.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
