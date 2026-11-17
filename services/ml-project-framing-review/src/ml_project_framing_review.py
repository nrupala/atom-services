#!/usr/bin/env python3
"""ML project framing review — deterministic core.

Built from the bound skill `ai-ml-ds-engineer`: "Frames AI and
data projects rigorously — a baseline first, an honest metric,
evaluation before modeling — so the work survives contact with
reality." ("Rigor over novelty. Most AI projects fail at framing
and evaluation, not modeling.")

This atom is a REVIEW of a declared project-framing record: it
audits the record a caller declares against the FRAMING stage
the skill defines — whether ML is needed at all, the decision
the metric serves, the baseline written down before anything
complex is built, the data and evaluation PLAN, the starting
approach, reproducibility and LLM/RAG framing, and the skill's
anti-patterns refused. It does not frame a project itself, train
or run a model, read live data, or verify that a declared plan
was ever executed — it checks that the framing record the skill
requires is present and internally complete and consistent on
the declared evidence.

Distinct ground: the deployed sibling `applied-ml-validation`
validates a DECLARED validation record for an existing
model/project — baseline actually beaten, splits actually used,
ladder actually climbed, calibration actually reported,
monitoring planned for a built model. This atom sits one stage
earlier: every check here is a framing-stage question (assessed,
named, written down, planned, committed — before modeling), and
zero checks are shared with that atom.

The caller submits a framing manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- metrics: the declared `metrics` list must be non-empty, and
  every declared metric row must be tied to a decision, name
  the decision action it drives, and have its baseline recorded
  before modeling (the skill: "Tie the metric to a decision";
  "Write down the baseline number before building anything
  complex");
- metric-name ownership: no declared metric name may be owned
  by more than one metric row (one primary record per metric —
  internal consistency of the declared rows).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold — no baseline margin, no
metric target, no accuracy bar, no dataset size, no latency or
cost budget number, no coverage percentage — so no numeric
threshold check is invented; those quantities are caller
attestations at most, and quantities here are computed and
reported, with completeness (every declared metric row) as the
only bar, exactly as stated above.

Verdict:
- any fail             -> ML_FRAMING_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> ML_FRAMING_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "ml_necessity_and_decision_framing",
    "metric_and_baseline_framing",
    "data_and_evaluation_plan",
    "approach_reproducibility_and_llm_framing",
    "anti_pattern_red_lines",
)

MANIFEST_SPEC = {
    "project": "string",
    "framing": {
        "problem_statement_defined": "boolean",
        "ml_necessity_assessed": "boolean",
        "non_ml_rule_or_heuristic_considered": "boolean",
        "decision_and_action_named": "boolean",
        "framing_completed_before_modeling": "boolean",
    },
    "metric": {
        "primary_metric_named": "boolean",
        "metric_tied_to_decision": "boolean",
        "accuracy_for_its_own_sake_present": "boolean",
    },
    "baseline": {
        "baseline_value_written_down": "boolean",
        "baseline_is_rule_or_heuristic_benchmark": "boolean",
        "baseline_recorded_before_complex_build": "boolean",
    },
    "metrics": [{
        "name": "string",
        "decision_action": "string",
        "tied_to_decision": "boolean",
        "baseline_recorded_before_modeling": "boolean",
    }],
    "data_plan": {
        "provenance_plan_stated": "boolean",
        "leakage_risks_identified": "boolean",
        "split_honesty_strategy_planned": "boolean",
        "never_tune_on_test_committed": "boolean",
        "distribution_shift_risk_noted": "boolean",
    },
    "evaluation_plan": {
        "evaluation_designed_before_modeling": "boolean",
        "offline_online_gap_acknowledged": "boolean",
        "online_check_planned": "boolean",
        "ablation_planned": "boolean",
    },
    "approach": {
        "start_simple_first_step_named": "boolean",
        "complexity_must_earn_keep_accepted": "boolean",
        "reproducibility_plan_stated": "boolean",
        "uncertainty_reporting_planned": "boolean",
        "worst_case_failure_analysis_planned": "boolean",
    },
    "llm": {
        "uses_llm_or_rag": "boolean",
        "retrieval_quality_prioritized_over_model_size": "boolean",
        "golden_set_evaluation_planned": "boolean",
        "grounding_citation_and_idk_required": "boolean",
        "prompts_versioned_with_changelog": "boolean",
    },
    "serving": {
        "local_first_serving_options_considered": "boolean",
        "latency_and_cost_budget_considered": "boolean",
    },
    "red_lines": {
        "chasing_sota_without_baseline_present": "boolean",
        "evaluating_on_training_data_present": "boolean",
        "demo_driven_development_present": "boolean",
        "tuning_on_test_present": "boolean",
        "latency_cost_ignored_present": "boolean",
        "llm_output_treated_as_correct_present": "boolean",
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


def _gated_llm_check(results, section, name, manifest, field, evidence):
    """LLM/RAG check gated on the declared applicability flag.

    Missing gate or missing field -> missing evidence. Gate
    declared false -> pass (not applicable to this project).
    Gate declared true -> the field must be declared true.
    """
    gate, gate_present = _get(manifest, "llm", "uses_llm_or_rag")
    value, present = _get(manifest, "llm", field)
    both_present = gate_present and present
    if gate_present and gate is False:
        ok = True
    else:
        ok = value is True
    _check(results, section, name, value, both_present, ok, evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for an ML project framing manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    metrics, has_metrics = _get(manifest, "metrics")
    metrics_is_list = has_metrics and isinstance(metrics, list)
    metrics_count = len(metrics) if metrics_is_list else None
    rows = metrics if metrics_is_list else []

    metrics_without_tied_decision = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "tied_to_decision" in c
         and c.get("tied_to_decision") is not True]
        if metrics_is_list else None
    )
    metrics_without_baseline_recorded = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "baseline_recorded_before_modeling" in c
         and c.get("baseline_recorded_before_modeling") is not True]
        if metrics_is_list else None
    )
    duplicate_metric_names = None
    if metrics_is_list:
        seen = []
        duplicate_metric_names = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("name"), str):
                nm = c["name"]
                if nm in seen and nm not in duplicate_metric_names:
                    duplicate_metric_names.append(nm)
                seen.append(nm)
    tied_to_decision_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("tied_to_decision") is True)
        / metrics_count
        if metrics_is_list and metrics_count > 0 else None
    )
    baseline_recorded_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("baseline_recorded_before_modeling") is True)
        / metrics_count
        if metrics_is_list and metrics_count > 0 else None
    )

    # ---- Section 1: ml_necessity_and_decision_framing (skill
    #      "Frame before you model" — does this even need ML, a
    #      rule or heuristic considered first, the decision and
    #      the action it changes named, framing done before
    #      modeling) ----
    _bool_check(results, "ml_necessity_and_decision_framing",
                "problem_statement_defined", manifest,
                ("framing", "problem_statement_defined"),
                "framing: the problem statement is defined before "
                "any modeling")
    _bool_check(results, "ml_necessity_and_decision_framing",
                "ml_necessity_assessed", manifest,
                ("framing", "ml_necessity_assessed"),
                "framing: whether this even needs ML is assessed")
    _bool_check(results, "ml_necessity_and_decision_framing",
                "non_ml_rule_or_heuristic_considered", manifest,
                ("framing", "non_ml_rule_or_heuristic_considered"),
                "framing: a rule or heuristic alternative is "
                "considered — it is often enough")
    _bool_check(results, "ml_necessity_and_decision_framing",
                "decision_and_action_named", manifest,
                ("framing", "decision_and_action_named"),
                "framing: the decision is named — what action "
                "changes based on the output")
    _bool_check(results, "ml_necessity_and_decision_framing",
                "framing_completed_before_modeling", manifest,
                ("framing", "framing_completed_before_modeling"),
                "framing: the framing is completed before "
                "modeling begins")

    # ---- Section 2: metric_and_baseline_framing (skill "Frame
    #      before you model" — metric tied to a decision, never
    #      accuracy for its own sake; the baseline number written
    #      down before anything complex, the rule/heuristic
    #      benchmark to beat; plus the computed metric rows) ----
    _bool_check(results, "metric_and_baseline_framing",
                "primary_metric_named", manifest,
                ("metric", "primary_metric_named"),
                "metric: a primary metric is named at framing")
    _bool_check(results, "metric_and_baseline_framing",
                "metric_tied_to_decision", manifest,
                ("metric", "metric_tied_to_decision"),
                "metric: the metric is tied to a decision")
    _false_check(results, "metric_and_baseline_framing",
                 "no_accuracy_for_its_own_sake", manifest,
                 ("metric", "accuracy_for_its_own_sake_present"),
                 "metric: accuracy is not optimized for its own "
                 "sake")
    _bool_check(results, "metric_and_baseline_framing",
                "baseline_value_written_down", manifest,
                ("baseline", "baseline_value_written_down"),
                "baseline: the baseline number is written down "
                "before building anything complex")
    _bool_check(results, "metric_and_baseline_framing",
                "baseline_is_rule_or_heuristic_benchmark", manifest,
                ("baseline", "baseline_is_rule_or_heuristic_benchmark"),
                "baseline: the benchmark to beat is a rule or "
                "heuristic baseline")
    _bool_check(results, "metric_and_baseline_framing",
                "baseline_recorded_before_complex_build", manifest,
                ("baseline", "baseline_recorded_before_complex_build"),
                "baseline: the baseline is recorded before any "
                "complex build begins")
    _check(results, "metric_and_baseline_framing",
           "metrics_declared", metrics, metrics_is_list,
           metrics_is_list and metrics_count > 0,
           "the declared record names its metrics — the metrics "
           "list is present and non-empty")
    tied_present = (
        metrics_is_list
        and all(isinstance(c, dict) and "tied_to_decision" in c
                for c in rows)
    )
    _check(results, "metric_and_baseline_framing",
           "every_metric_tied_to_decision", metrics, tied_present,
           metrics_is_list and metrics_count > 0
           and all(isinstance(c, dict)
                   and c.get("tied_to_decision") is True
                   for c in rows),
           "metric: every declared metric row is tied to a "
           "decision")
    action_present = (
        metrics_is_list
        and all(isinstance(c, dict) and "decision_action" in c
                for c in rows)
    )
    _check(results, "metric_and_baseline_framing",
           "every_metric_names_decision_action", metrics,
           action_present,
           metrics_is_list and metrics_count > 0
           and all(isinstance(c, dict)
                   and isinstance(c.get("decision_action"), str)
                   and c.get("decision_action") != ""
                   for c in rows),
           "metric: every declared metric row names the "
           "decision action it drives")
    base_present = (
        metrics_is_list
        and all(isinstance(c, dict)
                and "baseline_recorded_before_modeling" in c
                for c in rows)
    )
    _check(results, "metric_and_baseline_framing",
           "every_metric_baseline_recorded_before_modeling",
           metrics, base_present,
           metrics_is_list and metrics_count > 0
           and all(isinstance(c, dict)
                   and c.get("baseline_recorded_before_modeling")
                   is True
                   for c in rows),
           "baseline: every declared metric row has its "
           "baseline recorded before modeling")
    name_present = (
        metrics_is_list
        and all(isinstance(c, dict) and "name" in c for c in rows)
    )
    _check(results, "metric_and_baseline_framing",
           "no_metric_name_duplicated", metrics, name_present,
           metrics_is_list and duplicate_metric_names is not None
           and len(duplicate_metric_names) == 0,
           "metric: no declared metric name is owned by more "
           "than one metric row")

    # ---- Section 3: data_and_evaluation_plan (skill "Data
    #      discipline" and "Evaluation honesty" as a PLAN made
    #      at framing — provenance and leakage questions faced
    #      up front, an honest split strategy, never tune on
    #      test, shift risk noted; evaluation designed before
    #      modeling, the offline/online gap acknowledged, an
    #      online check and ablation planned) ----
    _bool_check(results, "data_and_evaluation_plan",
                "provenance_plan_stated", manifest,
                ("data_plan", "provenance_plan_stated"),
                "data plan: where the data comes from is stated "
                "at framing — provenance first")
    _bool_check(results, "data_and_evaluation_plan",
                "leakage_risks_identified", manifest,
                ("data_plan", "leakage_risks_identified"),
                "data plan: leakage risks — could the label leak "
                "into features — are identified at framing")
    _bool_check(results, "data_and_evaluation_plan",
                "split_honesty_strategy_planned", manifest,
                ("data_plan", "split_honesty_strategy_planned"),
                "data plan: an honest split strategy — strict "
                "train / validation / test separation, no "
                "temporal or group leakage — is planned")
    _bool_check(results, "data_and_evaluation_plan",
                "never_tune_on_test_committed", manifest,
                ("data_plan", "never_tune_on_test_committed"),
                "data plan: never tune on test is committed at "
                "framing")
    _bool_check(results, "data_and_evaluation_plan",
                "distribution_shift_risk_noted", manifest,
                ("data_plan", "distribution_shift_risk_noted"),
                "data plan: distribution shift between training "
                "and serving is noted as a framing risk")
    _bool_check(results, "data_and_evaluation_plan",
                "evaluation_designed_before_modeling", manifest,
                ("evaluation_plan",
                 "evaluation_designed_before_modeling"),
                "evaluation plan: evaluation is designed before "
                "modeling — evaluation before modeling")
    _bool_check(results, "data_and_evaluation_plan",
                "offline_online_gap_acknowledged", manifest,
                ("evaluation_plan", "offline_online_gap_acknowledged"),
                "evaluation plan: offline metrics are not online "
                "value — the gap is acknowledged")
    _bool_check(results, "data_and_evaluation_plan",
                "online_check_planned", manifest,
                ("evaluation_plan", "online_check_planned"),
                "evaluation plan: an online check — A/B or "
                "shadow — is planned for anything that ships")
    _bool_check(results, "data_and_evaluation_plan",
                "ablation_planned", manifest,
                ("evaluation_plan", "ablation_planned"),
                "evaluation plan: ablation is planned — show "
                "which component actually drives the gain")

    # ---- Section 4: approach_reproducibility_and_llm_framing
    #      (skill "Modeling", "LLM / RAG specifics" and
    #      "Sovereign / local-first serving" as framing —
    #      start simple, complexity earns its keep, a
    #      reproducibility plan, uncertainty and worst-case
    #      analysis planned; LLM/RAG framing gated on the
    #      declared applicability flag; local-first serving and
    #      latency/cost considered at framing) ----
    _bool_check(results, "approach_reproducibility_and_llm_framing",
                "start_simple_first_step_named", manifest,
                ("approach", "start_simple_first_step_named"),
                "approach: the first step is simple — linear / "
                "tree / baseline — and is named")
    _bool_check(results, "approach_reproducibility_and_llm_framing",
                "complexity_must_earn_keep_accepted", manifest,
                ("approach", "complexity_must_earn_keep_accepted"),
                "approach: complexity is added only when it "
                "earns its keep")
    _bool_check(results, "approach_reproducibility_and_llm_framing",
                "reproducibility_plan_stated", manifest,
                ("approach", "reproducibility_plan_stated"),
                "reproducibility plan: pin seeds, version data + "
                "config + code, log experiments — a result that "
                "cannot be reproduced is not a result")
    _bool_check(results, "approach_reproducibility_and_llm_framing",
                "uncertainty_reporting_planned", manifest,
                ("approach", "uncertainty_reporting_planned"),
                "approach: reporting uncertainty — confidence "
                "intervals, error bars, not just point metrics — "
                "is planned")
    _bool_check(results, "approach_reproducibility_and_llm_framing",
                "worst_case_failure_analysis_planned", manifest,
                ("approach", "worst_case_failure_analysis_planned"),
                "approach: failure analysis on the worst cases "
                "is planned")
    gate_value, gate_present = _get(manifest, "llm", "uses_llm_or_rag")
    _check(results, "approach_reproducibility_and_llm_framing",
           "llm_applicability_declared", gate_value, gate_present,
           True,
           "LLM/RAG framing: whether the project uses an LLM "
           "or RAG is declared — the LLM/RAG checks apply only "
           "when it does")
    _gated_llm_check(results,
                     "approach_reproducibility_and_llm_framing",
                     "retrieval_quality_prioritized_over_model_size",
                     manifest,
                     "retrieval_quality_prioritized_over_model_size",
                     "LLM/RAG framing: retrieval quality beats "
                     "model size — chunking, embeddings and "
                     "reranking get the investment")
    _gated_llm_check(results,
                     "approach_reproducibility_and_llm_framing",
                     "golden_set_evaluation_planned",
                     manifest,
                     "golden_set_evaluation_planned",
                     "LLM/RAG framing: evaluation against a "
                     "golden set of question to expected-answer "
                     "pairs is planned, with regressions tracked")
    _gated_llm_check(results,
                     "approach_reproducibility_and_llm_framing",
                     "grounding_citation_and_idk_required",
                     manifest,
                     "grounding_citation_and_idk_required",
                     "LLM/RAG framing: answers are grounded in "
                     "retrieved context, sources are cited, and "
                     "I don't know is preferred over confident "
                     "fabrication")
    _gated_llm_check(results,
                     "approach_reproducibility_and_llm_framing",
                     "prompts_versioned_with_changelog",
                     manifest,
                     "prompts_versioned_with_changelog",
                     "LLM/RAG framing: prompts are versioned "
                     "like code, with a prompt/eval changelog")
    _bool_check(results, "approach_reproducibility_and_llm_framing",
                "local_first_serving_options_considered", manifest,
                ("serving", "local_first_serving_options_considered"),
                "serving framing: sovereign / local-first "
                "serving options are considered over locked-in "
                "cloud APIs")
    _bool_check(results, "approach_reproducibility_and_llm_framing",
                "latency_and_cost_budget_considered", manifest,
                ("serving", "latency_and_cost_budget_considered"),
                "serving framing: latency and cost are "
                "considered at framing, not ignored")

    # ---- Section 5: anti_pattern_red_lines (skill
    #      "Anti-patterns to refuse" — no SOTA chasing without a
    #      baseline, no evaluating on training data, no
    #      demo-driven development, no tuning on test, no
    #      ignoring latency/cost, no treating fluent LLM output
    #      as correct output) ----
    _false_check(results, "anti_pattern_red_lines",
                 "no_chasing_sota_without_baseline", manifest,
                 ("red_lines", "chasing_sota_without_baseline_present"),
                 "red line: no chasing SOTA without a baseline "
                 "is present in the framing")
    _false_check(results, "anti_pattern_red_lines",
                 "no_evaluating_on_training_data", manifest,
                 ("red_lines", "evaluating_on_training_data_present"),
                 "red line: no evaluating on training data is "
                 "present in the framing")
    _false_check(results, "anti_pattern_red_lines",
                 "no_demo_driven_development", manifest,
                 ("red_lines", "demo_driven_development_present"),
                 "red line: no demo-driven development is "
                 "present in the framing")
    _false_check(results, "anti_pattern_red_lines",
                 "no_tuning_on_test", manifest,
                 ("red_lines", "tuning_on_test_present"),
                 "red line: no tuning on test is present in "
                 "the framing")
    _false_check(results, "anti_pattern_red_lines",
                 "no_latency_cost_ignored", manifest,
                 ("red_lines", "latency_cost_ignored_present"),
                 "red line: latency and cost are not ignored "
                 "in the framing")
    _false_check(results, "anti_pattern_red_lines",
                 "no_llm_output_treated_as_correct", manifest,
                 ("red_lines",
                  "llm_output_treated_as_correct_present"),
                 "red line: an LLM's fluent output is not "
                 "treated as correct output in the framing")

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
        verdict = "ML_FRAMING_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "ML_FRAMING_SOUND"

    computed_names = (
        "metrics_declared",
        "every_metric_tied_to_decision",
        "every_metric_names_decision_action",
        "every_metric_baseline_recorded_before_modeling",
        "no_metric_name_duplicated",
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
        "service": "ml-project-framing-review",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "metrics_count": metrics_count,
        "metrics_without_tied_decision": metrics_without_tied_decision,
        "tied_to_decision_coverage": _fmt6(tied_to_decision_coverage),
        "metrics_without_baseline_recorded":
            metrics_without_baseline_recorded,
        "baseline_recorded_coverage": _fmt6(baseline_recorded_coverage),
        "duplicate_metric_names": duplicate_metric_names,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "ML PROJECT FRAMING REVIEW",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: ml_project_framing_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "ML_FRAMING_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
