#!/usr/bin/env python3
"""Process waste review coaching — deterministic core.

Built from the bound skill `operational-excellence-coach`:
"Improve the system, not just the instance. Optimize the whole
over the part, make work visible, and remove waste relentlessly
— while respecting the people doing the work." This atom is a
REVIEW audit of a declared process-waste review record: DMAIC
Define/Measure declarations, a value-stream step record with
declared durations and waits, waste observations classified
against the skill's eight DOWNTIME wastes, root-cause and
Theory-of-Constraints analysis, a piloted/PDCA improvement
verified against baseline, standardized control with regression
made visible, and the skill's anti-patterns refused as red
lines. It is a record audit only: it coaches no person, judges
no interpersonal behaviour, and offers no psychological advice
— the skill's person-directed coaching steps for a named
individual are excluded by design (see SERVICE.md).

Distinct ground: the nearest siblings are `decision-process-
design` (a decision record — framing, precommitment before
data, loss functions), `delivery-plan-preparation` (a delivery
plan — phases, milestones, dependencies, risks) and
`decision-trap-sweep` (a single decision swept for traps —
options, criteria, pre-mortem). This atom shares zero checks
with any of them: every check here is a process-waste review
question — a measurable process goal and customer need, the
whole flow mapped and work made visible, declared step times
with waits exposed, waste rows classified into the eight
DOWNTIME categories and tied to declared steps, a baseline
from data not anecdote, leading paired with lagging
indicators, Pareto/root-cause analysis, the bottleneck as the
longest declared step with effort subordinated to it, a pilot
verified against baseline before scaling, the win
standardized with regression visible, and the operational-
excellence anti-patterns refused. The boundary is: one
process's waste review here; decision design, delivery
planning and decision traps there.

The caller submits a review manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the consistency and arithmetic of the declared rows
themselves — no outside threshold is imported:

- steps: the declared `steps` list must be present (an empty
  list is a valid declaration — no steps recorded), every step
  row must name a non-empty `name` and declare
  `duration_minutes` and `wait_before_minutes` that are
  non-negative numbers, and no step name may be duplicated;
- wastes: the declared `wastes` list must be present (an
  empty list declares no waste observed), every waste row's
  `category` must be one of the skill's eight DOWNTIME wastes,
  and every waste row's `step_name` must name a declared step;
- bottleneck: the declared `bottleneck_step_name` must equal
  the computed bottleneck — the first declared step with the
  greatest `duration_minutes` (the skill: throughput is set
  by the bottleneck).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons
use the unrounded values. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.
Counts are reported as integers (exact); totals are reported
as the exact sums of the declared numbers.

The skill states no numeric threshold at all — no maximum
wait share, no waste count, no KPI count, no cycle-time bar —
so no numeric threshold check is invented; quantities are
computed and reported, with completeness and consistency
over the caller's own declared rows as the only bars, exactly
as stated above.

Verdict:
- any fail             -> PROCESS_WASTE_REVIEW_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PROCESS_WASTE_REVIEW_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "define_and_visibility",
    "steps_and_waste_observation",
    "measurement_and_metrics",
    "analysis_and_constraint",
    "improvement_and_control",
    "red_lines",
)

DOWNTIME_CATEGORIES = (
    "defects",
    "overproduction",
    "waiting",
    "non_utilized_talent",
    "transportation",
    "inventory",
    "motion",
    "excess_processing",
)

MANIFEST_SPEC = {
    "process": "string",
    "define": {
        "problem_stated": "boolean",
        "goal_measurable_stated": "boolean",
        "scope_stated": "boolean",
        "customer_need_stated": "boolean",
        "whole_system_scope_declared": "boolean",
    },
    "mapping": {
        "whole_flow_mapped": "boolean",
        "work_made_visible": "boolean",
        "process_defined_before_automation": "boolean",
    },
    "steps": [{
        "name": "string",
        "duration_minutes": "number",
        "wait_before_minutes": "number",
    }],
    "wastes": [{
        "category": "string",
        "step_name": "string",
    }],
    "measure": {
        "baseline_established_with_data": "boolean",
        "baseline_from_data_not_anecdote": "boolean",
    },
    "metrics": {
        "leading_indicators_declared": "boolean",
        "lagging_indicators_declared": "boolean",
        "kpis_limited_to_meaningful_declared": "boolean",
        "metrics_made_visible": "boolean",
    },
    "analyze": {
        "root_cause_analysis_performed": "boolean",
        "pareto_vital_few_identified": "boolean",
    },
    "constraint": {
        "bottleneck_identified": "boolean",
        "non_bottleneck_effort_subordinated": "boolean",
        "bottleneck_step_name": "string",
    },
    "improve": {
        "improvement_piloted_before_scaling": "boolean",
        "pdca_cycle_declared": "boolean",
        "verified_against_baseline_before_scaling": "boolean",
        "small_continuous_improvement_declared": "boolean",
        "flow_and_pull_pursued_over_push": "boolean",
    },
    "control": {
        "win_standardized": "boolean",
        "monitoring_in_place": "boolean",
        "regression_made_visible": "boolean",
    },
    "red_lines": {
        "automating_broken_process_present": "boolean",
        "vanity_metrics_present": "boolean",
        "hero_culture_reliance_present": "boolean",
        "optimizing_non_constraint_present": "boolean",
        "tradition_without_data_present": "boolean",
        "local_optimization_hurting_whole_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def evaluate(manifest):
    """Return the verdict dict for a process waste review manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    steps, has_steps = _get(manifest, "steps")
    steps_is_list = has_steps and isinstance(steps, list)
    steps_count = len(steps) if steps_is_list else None
    srows = steps if steps_is_list else []

    wastes, has_wastes = _get(manifest, "wastes")
    wastes_is_list = has_wastes and isinstance(wastes, list)
    wastes_count = len(wastes) if wastes_is_list else None
    wrows = wastes if wastes_is_list else []

    step_names = (
        [c["name"] for c in srows
         if isinstance(c, dict) and isinstance(c.get("name"), str)]
        if steps_is_list else []
    )
    duplicate_step_names = None
    if steps_is_list:
        seen = []
        duplicate_step_names = []
        for nm in step_names:
            if nm in seen and nm not in duplicate_step_names:
                duplicate_step_names.append(nm)
            seen.append(nm)
    total_duration_minutes = None
    if steps_is_list and all(
            isinstance(c, dict) and _is_number(c.get("duration_minutes"))
            for c in srows):
        total_duration_minutes = sum(c["duration_minutes"] for c in srows)
    total_wait_minutes = None
    if steps_is_list and all(
            isinstance(c, dict)
            and _is_number(c.get("wait_before_minutes"))
            for c in srows):
        total_wait_minutes = sum(c["wait_before_minutes"] for c in srows)
    wait_share = (
        total_wait_minutes / (total_wait_minutes + total_duration_minutes)
        if total_wait_minutes is not None
        and total_duration_minutes is not None
        and (total_wait_minutes + total_duration_minutes) > 0 else None
    )
    bottleneck_step_computed = None
    if (steps_is_list and len(srows) > 0 and all(
            isinstance(c, dict) and isinstance(c.get("name"), str)
            and _is_number(c.get("duration_minutes")) for c in srows)):
        best = srows[0]
        for c in srows[1:]:
            if c["duration_minutes"] > best["duration_minutes"]:
                best = c
        bottleneck_step_computed = best["name"]
    distinct_waste_categories = None
    if wastes_is_list:
        distinct_waste_categories = []
        for c in wrows:
            if (isinstance(c, dict)
                    and isinstance(c.get("category"), str)
                    and c.get("category") in DOWNTIME_CATEGORIES
                    and c.get("category") not in distinct_waste_categories):
                distinct_waste_categories.append(c["category"])
    unmatched_waste_step_names = None
    if wastes_is_list and steps_is_list:
        unmatched_waste_step_names = (
            [c["step_name"] for c in wrows
             if isinstance(c, dict)
             and isinstance(c.get("step_name"), str)
             and c.get("step_name") not in step_names]
        )
    waste_step_coverage = (
        sum(1 for c in wrows
            if isinstance(c, dict)
            and isinstance(c.get("step_name"), str)
            and c.get("step_name") in step_names)
        / wastes_count
        if wastes_is_list and steps_is_list and wastes_count > 0 else None
    )

    # ---- Section 1: define_and_visibility (skill DMAIC
    #      "Define" — problem, measurable goal, scope, the
    #      customer's actual need; systems thinking — the whole
    #      over the part; value-stream mapping and making work
    #      visible; define the process before automating it) ----
    _bool_check(results, "define_and_visibility",
                "process_problem_stated", manifest,
                ("define", "problem_stated"),
                "define: the process problem is stated")
    _bool_check(results, "define_and_visibility",
                "process_goal_measurable_stated", manifest,
                ("define", "goal_measurable_stated"),
                "define: the goal is stated in measurable form")
    _bool_check(results, "define_and_visibility",
                "process_scope_stated", manifest,
                ("define", "scope_stated"),
                "define: the scope of the review is stated")
    _bool_check(results, "define_and_visibility",
                "customer_need_stated", manifest,
                ("define", "customer_need_stated"),
                "define: the customer's actual need is stated")
    _bool_check(results, "define_and_visibility",
                "whole_system_scope_declared", manifest,
                ("define", "whole_system_scope_declared"),
                "systems thinking: the review covers the whole "
                "process, not only a local part")
    _bool_check(results, "define_and_visibility",
                "whole_flow_mapped", manifest,
                ("mapping", "whole_flow_mapped"),
                "value stream: the whole flow is mapped")
    _bool_check(results, "define_and_visibility",
                "work_made_visible", manifest,
                ("mapping", "work_made_visible"),
                "visibility: the work is made visible — kanban "
                "or a simple dashboard")
    _bool_check(results, "define_and_visibility",
                "process_defined_before_automation", manifest,
                ("mapping", "process_defined_before_automation"),
                "the process is defined before it is automated")

    # ---- Section 2: steps_and_waste_observation (the declared
    #      step record with durations and waits exposing the
    #      delays, and waste observations classified against
    #      the skill's eight DOWNTIME wastes, each tied to a
    #      declared step) ----
    _check(results, "steps_and_waste_observation",
           "steps_declared", steps, steps_is_list, steps_is_list,
           "the declared record names its process steps — the "
           "steps list is present; an empty list declares that "
           "no steps are recorded")
    step_name_present = (
        steps_is_list
        and all(isinstance(c, dict) and "name" in c for c in srows)
    )
    _check(results, "steps_and_waste_observation",
           "every_step_named", steps, step_name_present,
           steps_is_list
           and all(isinstance(c, dict)
                   and isinstance(c.get("name"), str)
                   and c.get("name") != "" for c in srows),
           "steps: every declared step row names a non-empty "
           "step name")
    step_times_present = (
        steps_is_list
        and all(isinstance(c, dict) and "duration_minutes" in c
                and "wait_before_minutes" in c for c in srows)
    )
    _check(results, "steps_and_waste_observation",
           "every_step_times_declared_and_nonnegative", steps,
           step_times_present,
           steps_is_list
           and all(isinstance(c, dict)
                   and _is_number(c.get("duration_minutes"))
                   and c.get("duration_minutes") >= 0
                   and _is_number(c.get("wait_before_minutes"))
                   and c.get("wait_before_minutes") >= 0
                   for c in srows),
           "steps: every declared step row declares a duration "
           "and a wait before it, and neither is negative — "
           "the waits expose the delays in the flow")
    _check(results, "steps_and_waste_observation",
           "no_step_name_duplicated", steps, step_name_present,
           steps_is_list and duplicate_step_names is not None
           and len(duplicate_step_names) == 0,
           "steps: no declared step name is owned by more than "
           "one step row")
    _check(results, "steps_and_waste_observation",
           "wastes_declared", wastes, wastes_is_list, wastes_is_list,
           "the declared record names its waste observations — "
           "the wastes list is present; an empty list declares "
           "that no waste is observed")
    waste_category_present = (
        wastes_is_list
        and all(isinstance(c, dict) and "category" in c for c in wrows)
    )
    _check(results, "steps_and_waste_observation",
           "every_waste_category_valid_downtime", wastes,
           waste_category_present,
           wastes_is_list
           and all(isinstance(c, dict)
                   and c.get("category") in DOWNTIME_CATEGORIES
                   for c in wrows),
           "wastes: every declared waste row's category is one "
           "of the eight DOWNTIME wastes — defects, "
           "overproduction, waiting, non-utilized talent, "
           "transportation, inventory, motion, excess processing")
    waste_step_present = (
        wastes_is_list and steps_is_list
        and all(isinstance(c, dict) and "step_name" in c for c in wrows)
    )
    _check(results, "steps_and_waste_observation",
           "every_waste_step_names_declared_step", wastes,
           waste_step_present,
           wastes_is_list and steps_is_list
           and all(isinstance(c, dict)
                   and isinstance(c.get("step_name"), str)
                   and c.get("step_name") in step_names
                   for c in wrows),
           "wastes: every declared waste row names a step that "
           "is declared in the step record")

    # ---- Section 3: measurement_and_metrics (skill DMAIC
    #      "Measure" — a real baseline with data, not anecdote;
    #      Metrics — a few meaningful KPIs, leading paired with
    #      lagging, made visible) ----
    _bool_check(results, "measurement_and_metrics",
                "baseline_established_with_data", manifest,
                ("measure", "baseline_established_with_data"),
                "measure: a real baseline is established")
    _bool_check(results, "measurement_and_metrics",
                "baseline_from_data_not_anecdote", manifest,
                ("measure", "baseline_from_data_not_anecdote"),
                "measure: the baseline rests on data, not anecdote")
    _bool_check(results, "measurement_and_metrics",
                "leading_indicators_declared", manifest,
                ("metrics", "leading_indicators_declared"),
                "metrics: leading — predictive — indicators are "
                "declared")
    _bool_check(results, "measurement_and_metrics",
                "lagging_indicators_declared", manifest,
                ("metrics", "lagging_indicators_declared"),
                "metrics: lagging — outcome — indicators are declared")
    _bool_check(results, "measurement_and_metrics",
                "kpis_limited_to_meaningful_declared", manifest,
                ("metrics", "kpis_limited_to_meaningful_declared"),
                "metrics: the KPI set is limited to a few "
                "meaningful indicators")
    _bool_check(results, "measurement_and_metrics",
                "metrics_made_visible", manifest,
                ("metrics", "metrics_made_visible"),
                "metrics: the indicators are made visible")

    # ---- Section 4: analysis_and_constraint (skill DMAIC
    #      "Analyze" — root cause and Pareto's vital few;
    #      Theory of Constraints — throughput is set by the
    #      bottleneck, effort subordinated to it, and the
    #      declared bottleneck consistent with the longest
    #      declared step) ----
    _bool_check(results, "analysis_and_constraint",
                "root_cause_analysis_performed", manifest,
                ("analyze", "root_cause_analysis_performed"),
                "analyze: root-cause analysis — 5 Whys or "
                "fishbone — is performed")
    _bool_check(results, "analysis_and_constraint",
                "pareto_vital_few_identified", manifest,
                ("analyze", "pareto_vital_few_identified"),
                "analyze: the Pareto vital few are identified")
    _bool_check(results, "analysis_and_constraint",
                "process_bottleneck_identified", manifest,
                ("constraint", "bottleneck_identified"),
                "theory of constraints: the bottleneck is identified")
    _bool_check(results, "analysis_and_constraint",
                "non_bottleneck_effort_subordinated", manifest,
                ("constraint", "non_bottleneck_effort_subordinated"),
                "theory of constraints: everything else is "
                "subordinated to the bottleneck")
    bottleneck_name, has_bottleneck_name = _get(
        manifest, "constraint", "bottleneck_step_name")
    bottleneck_present = (
        bottleneck_step_computed is not None and has_bottleneck_name
    )
    _check(results, "analysis_and_constraint",
           "declared_bottleneck_matches_longest_step",
           bottleneck_name, bottleneck_present,
           bottleneck_step_computed is not None
           and bottleneck_name == bottleneck_step_computed,
           "theory of constraints: the declared bottleneck step "
           "is the longest declared step — the first step with "
           "the greatest declared duration")

    # ---- Section 5: improvement_and_control (skill DMAIC
    #      "Improve" — pilot, PDCA, verify against baseline
    #      before scaling, small continuous kaizen, flow and
    #      pull over push; "Control" — standardize the win,
    #      monitor it, make regression visible) ----
    _bool_check(results, "improvement_and_control",
                "improvement_piloted_before_scaling", manifest,
                ("improve", "improvement_piloted_before_scaling"),
                "improve: the change is piloted before it is scaled")
    _bool_check(results, "improvement_and_control",
                "improvement_pdca_cycle_declared", manifest,
                ("improve", "pdca_cycle_declared"),
                "improve: the improvement follows a PDCA cycle")
    _bool_check(results, "improvement_and_control",
                "improvement_verified_against_baseline_before_scaling",
                manifest,
                ("improve", "verified_against_baseline_before_scaling"),
                "improve: the pilot is verified against the "
                "baseline before scaling")
    _bool_check(results, "improvement_and_control",
                "small_continuous_improvement_declared", manifest,
                ("improve", "small_continuous_improvement_declared"),
                "improve: the change is a small continuous "
                "improvement — kaizen — not a big rare one")
    _bool_check(results, "improvement_and_control",
                "flow_and_pull_pursued_over_push", manifest,
                ("improve", "flow_and_pull_pursued_over_push"),
                "improve: flow and pull are pursued over push")
    _bool_check(results, "improvement_and_control",
                "win_standardized", manifest,
                ("control", "win_standardized"),
                "control: the win is standardized")
    _bool_check(results, "improvement_and_control",
                "monitoring_in_place", manifest,
                ("control", "monitoring_in_place"),
                "control: the standardized win is monitored")
    _bool_check(results, "improvement_and_control",
                "regression_made_visible", manifest,
                ("control", "regression_made_visible"),
                "control: regression is made visible")

    # ---- Section 6: red_lines (skill "Anti-patterns to call
    #      out" — automating a broken process, vanity metrics,
    #      hero culture instead of systems, optimizing a
    #      non-constraint, "we've always done it this way" with
    #      no data, and local optimization that hurts the
    #      whole) ----
    _false_check(results, "red_lines",
                 "no_automating_broken_process", manifest,
                 ("red_lines", "automating_broken_process_present"),
                 "red line: no automating a broken process is "
                 "present in the record")
    _false_check(results, "red_lines",
                 "no_vanity_metrics", manifest,
                 ("red_lines", "vanity_metrics_present"),
                 "red line: no vanity metrics are present in "
                 "the record")
    _false_check(results, "red_lines",
                 "no_hero_culture_reliance", manifest,
                 ("red_lines", "hero_culture_reliance_present"),
                 "red line: no hero culture instead of systems "
                 "is present in the record")
    _false_check(results, "red_lines",
                 "no_optimizing_non_constraint", manifest,
                 ("red_lines", "optimizing_non_constraint_present"),
                 "red line: no optimizing a non-constraint is "
                 "present in the record")
    _false_check(results, "red_lines",
                 "no_tradition_without_data", manifest,
                 ("red_lines", "tradition_without_data_present"),
                 "red line: no \"we've always done it this way\" "
                 "without data is present in the record")
    _false_check(results, "red_lines",
                 "no_local_optimization_hurting_whole", manifest,
                 ("red_lines",
                  "local_optimization_hurting_whole_present"),
                 "red line: no local optimization that hurts the "
                 "whole is present in the record")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "PROCESS_WASTE_REVIEW_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PROCESS_WASTE_REVIEW_READY"

    computed_names = (
        "steps_declared",
        "every_step_named",
        "every_step_times_declared_and_nonnegative",
        "no_step_name_duplicated",
        "wastes_declared",
        "every_waste_category_valid_downtime",
        "every_waste_step_names_declared_step",
        "declared_bottleneck_matches_longest_step",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "process-waste-review-coaching",
        "atom_version": "0.1.0",
        "process": manifest.get("process"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "steps_count": steps_count,
        "wastes_count": wastes_count,
        "total_duration_minutes": total_duration_minutes,
        "total_wait_minutes": total_wait_minutes,
        "wait_share": _fmt6(wait_share),
        "distinct_waste_categories": distinct_waste_categories,
        "duplicate_step_names": duplicate_step_names,
        "unmatched_waste_step_names": unmatched_waste_step_names,
        "waste_step_coverage": _fmt6(waste_step_coverage),
        "bottleneck_step_computed": bottleneck_step_computed,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "PROCESS WASTE REVIEW COACHING",
        f"process: {verdict.get('process')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: process_waste_review_coaching.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "PROCESS_WASTE_REVIEW_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
