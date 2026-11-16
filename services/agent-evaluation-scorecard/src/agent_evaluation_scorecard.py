#!/usr/bin/env python3
"""Agent evaluation scorecard — deterministic core.

Built from the bound skill `agent-evaluation` (v1): "Measure agents
before trusting them — task suites, regression gates, calibrated
judging, scorecards."

The caller submits an agent-evaluation evidence manifest (a dict, or
JSON on the CLI). Every check in every section reads declared manifest
fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

The scorecard section also carries one computed check: every declared
task result is compared against its own declared acceptance criteria
(passed, cost <= allowed cost, latency <= allowed latency, no safety
violation) — arithmetic, not judgment.

Verdict:
- any fail             -> NOT_TRUSTED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> TRUSTED

No model call, no network, no clock dependence: the same manifest
always produces the same scorecard. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "task_suite",
    "reproducible_runs",
    "judging",
    "regression_gates",
    "beyond_accuracy",
    "incident_replay",
    "scorecard",
    "benchmark_hygiene",
)


# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "agent": "string",
    "suite": {
        "versioned": "boolean",
        "criteria_written_before_run": "boolean",
        "acceptance_criteria_per_task": "boolean",
        "versioned_with_agent": "boolean",
    },
    "run": {
        "model_version_pinned": "boolean",
        "sampling_settings_pinned": "boolean",
        "tool_state_pinned": "boolean",
        "fixtures_pinned": "boolean",
        "raw_transcripts_stored": "boolean",
        "same_suite_per_candidate": "boolean",
    },
    "judging": {
        "deterministic_checks_first": "boolean",
        "llm_judge_used": "boolean",
        "judge_calibrated_against_human_labels": "boolean",
        "judge_blinded": "boolean",
        "position_bias_controls": "boolean",
        "model_judges_itself": "boolean",
    },
    "gates": {
        "eval_runs_before_merge": "boolean",
        "regressions_block_merge": "boolean",
        "accepted_tradeoffs_written": "boolean",
    },
    "metrics": {
        "steps_tracked": "boolean",
        "cost_tracked": "boolean",
        "latency_tracked": "boolean",
        "refusal_error_rates_tracked": "boolean",
        "safety_violations_tracked": "boolean",
        "silent_wrongness_tracked": "boolean",
    },
    "incidents": {
        "misbehavior_becomes_named_tests": "boolean",
        "all_production_incidents_replayed": "boolean",
    },
    "scorecard": {
        "published_per_run": "boolean",
        "stored": "boolean",
    },
    "tasks": [{
        "name": "string",
        "passed": "boolean",
        "cost": "number",
        "allowed_cost": "number",
        "latency_ms": "number",
        "allowed_latency_ms": "number",
        "safety_violation": "boolean",
    }],
    "hygiene": {
        "contamination_checked": "boolean",
        "variance_reported": "boolean",
        "rebaselined_after_model_updates": "boolean",
    },
}

def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _judge_conditional(results, name, manifest, field, evidence):
    """A judging control is required only when an LLM judge is used."""
    llm_used, has_llm = _get(manifest, "judging", "llm_judge_used")
    value, present = _get(manifest, "judging", field)
    if has_llm and llm_used:
        _check(results, "judging", name, value, present, value is True,
               evidence)
    else:
        _check(results, "judging", name, llm_used, has_llm, True,
               "no LLM judge declared")


def _task_results_check(results, manifest):
    tasks, has_tasks = _get(manifest, "tasks")
    if not has_tasks or not isinstance(tasks, list) or not tasks:
        _check(results, "scorecard", "all_tasks_meet_acceptance_criteria",
               tasks, False, False,
               "no task results declared")
        return {"tasks_total": 0, "tasks_passing": 0,
                "safety_violations": 0}
    passing = 0
    violations = 0
    incomplete = False
    failing = False
    for task in tasks:
        if not isinstance(task, dict):
            incomplete = True
            continue
        passed, has_passed = _get(task, "passed")
        cost, has_cost = _get(task, "cost")
        allowed_cost, has_allowed_cost = _get(task, "allowed_cost")
        latency, has_latency = _get(task, "latency_ms")
        allowed_latency, has_allowed_latency = _get(task,
                                                    "allowed_latency_ms")
        violation, has_violation = _get(task, "safety_violation")
        if not (has_passed and has_cost and has_allowed_cost
                and has_latency and has_allowed_latency and has_violation
                and _is_number(cost) and _is_number(allowed_cost)
                and _is_number(latency) and _is_number(allowed_latency)):
            incomplete = True
            continue
        if violation is True:
            violations += 1
        ok = (passed is True and cost <= allowed_cost
              and latency <= allowed_latency and violation is not True)
        if ok:
            passing += 1
        else:
            failing = True
    scorecard = {"tasks_total": len(tasks), "tasks_passing": passing,
                 "safety_violations": violations}
    if incomplete:
        _check(results, "scorecard", "all_tasks_meet_acceptance_criteria",
               tasks, False, False,
               "task results missing acceptance fields")
    else:
        _check(results, "scorecard", "all_tasks_meet_acceptance_criteria",
               tasks, True, not failing,
               "every task met its declared acceptance criteria "
               "(passed, cost and latency within allowance, "
               "no safety violation)")
    return scorecard


def evaluate(manifest):
    """Return the scorecard dict for an agent-evaluation manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: task_suite (skill method 1 + quality gate) ----
    _bool_check(results, "task_suite", "suite_versioned", manifest,
                ("suite", "versioned"),
                "quality gate: suite versioned, criteria written before running")
    _bool_check(results, "task_suite", "criteria_written_before_running",
                manifest, ("suite", "criteria_written_before_run"),
                "acceptance criteria written before the run, not after")
    _bool_check(results, "task_suite", "acceptance_criteria_defined_per_task",
                manifest, ("suite", "acceptance_criteria_per_task"),
                "golden tasks per capability with success definition, "
                "allowed cost, allowed latency, safety constraints")
    _bool_check(results, "task_suite", "suite_versioned_with_agent",
                manifest, ("suite", "versioned_with_agent"),
                "task suites versioned with the agent")

    # ---- Section 2: reproducible_runs (skill method 2) ----
    _bool_check(results, "reproducible_runs", "model_version_pinned",
                manifest, ("run", "model_version_pinned"),
                "pin model versions")
    _bool_check(results, "reproducible_runs", "sampling_settings_pinned",
                manifest, ("run", "sampling_settings_pinned"),
                "pin seeds/temperatures")
    _bool_check(results, "reproducible_runs", "tool_state_pinned",
                manifest, ("run", "tool_state_pinned"),
                "pin tool states")
    _bool_check(results, "reproducible_runs", "fixtures_pinned",
                manifest, ("run", "fixtures_pinned"),
                "pin fixtures")
    _bool_check(results, "reproducible_runs", "raw_transcripts_stored",
                manifest, ("run", "raw_transcripts_stored"),
                "store raw transcripts")
    _bool_check(results, "reproducible_runs", "same_suite_for_every_candidate",
                manifest, ("run", "same_suite_per_candidate"),
                "run the same suite per candidate")

    # ---- Section 3: judging (skill method 3 + red line) ----
    _bool_check(results, "judging", "deterministic_checks_first", manifest,
                ("judging", "deterministic_checks_first"),
                "deterministic checks first (did it do the thing?)")
    _judge_conditional(results, "llm_judge_calibrated_against_human_labels",
                       manifest, "judge_calibrated_against_human_labels",
                       "LLM-judges only when calibrated against human labels")
    _judge_conditional(results, "judge_blinded", manifest, "judge_blinded",
                       "LLM judge blinded")
    _judge_conditional(results, "position_bias_controls", manifest,
                       "position_bias_controls",
                       "position bias controls for LLM judges")
    itself, has_itself = _get(manifest, "judging", "model_judges_itself")
    calibrated, has_calibrated = _get(
        manifest, "judging", "judge_calibrated_against_human_labels")
    if has_itself and itself:
        _check(results, "judging", "no_uncalibrated_self_judging",
               calibrated, has_calibrated, calibrated is True,
               "skill red line: the model under test never judges itself "
               "uncalibrated")
    else:
        _check(results, "judging", "no_uncalibrated_self_judging",
               itself, has_itself, True,
               "the model under test does not judge itself")

    # ---- Section 4: regression_gates (skill method 4) ----
    _bool_check(results, "regression_gates", "eval_runs_before_merge",
                manifest, ("gates", "eval_runs_before_merge"),
                "eval suite runs before merging agent changes")
    _bool_check(results, "regression_gates", "regressions_block_merge",
                manifest, ("gates", "regressions_block_merge"),
                "regressions block until explained")
    _bool_check(results, "regression_gates", "accepted_tradeoffs_written",
                manifest, ("gates", "accepted_tradeoffs_written"),
                "accepted trade-offs are written, not vibes")

    # ---- Section 5: beyond_accuracy (skill method 5) ----
    _bool_check(results, "beyond_accuracy", "steps_to_completion_tracked",
                manifest, ("metrics", "steps_tracked"),
                "track steps-to-completion")
    _bool_check(results, "beyond_accuracy", "cost_tracked", manifest,
                ("metrics", "cost_tracked"), "track cost")
    _bool_check(results, "beyond_accuracy", "latency_tracked", manifest,
                ("metrics", "latency_tracked"), "track latency")
    _bool_check(results, "beyond_accuracy", "refusal_and_error_rates_tracked",
                manifest, ("metrics", "refusal_error_rates_tracked"),
                "track refusal/error rates")
    _bool_check(results, "beyond_accuracy", "safety_violations_tracked",
                manifest, ("metrics", "safety_violations_tracked"),
                "track safety violations")
    _bool_check(results, "beyond_accuracy", "silent_wrongness_tracked",
                manifest, ("metrics", "silent_wrongness_tracked"),
                "track silent wrongness (confident bad output)")

    # ---- Section 6: incident_replay (skill method 6) ----
    _bool_check(results, "incident_replay",
                "misbehavior_becomes_named_test_cases", manifest,
                ("incidents", "misbehavior_becomes_named_tests"),
                "every production misbehavior becomes a named test case")
    _bool_check(results, "incident_replay",
                "all_production_incidents_replayed", manifest,
                ("incidents", "all_production_incidents_replayed"),
                "incident replay: incidents turned into permanent "
                "regression tests")

    # ---- Section 7: scorecard (skill method 7) ----
    _bool_check(results, "scorecard", "scorecard_published_per_run",
                manifest, ("scorecard", "published_per_run"),
                "publish a compact scorecard per run")
    _bool_check(results, "scorecard", "scorecards_stored", manifest,
                ("scorecard", "stored"),
                "quality gate: scorecards stored")
    scorecard = _task_results_check(results, manifest)

    # ---- Section 8: benchmark_hygiene (skill method 8) ----
    _bool_check(results, "benchmark_hygiene", "contamination_checked",
                manifest, ("hygiene", "contamination_checked"),
                "watch contamination (tasks leaking into training)")
    _bool_check(results, "benchmark_hygiene", "variance_reported",
                manifest, ("hygiene", "variance_reported"),
                "run N times, report spread")
    _bool_check(results, "benchmark_hygiene",
                "rebaselined_after_model_updates", manifest,
                ("hygiene", "rebaselined_after_model_updates"),
                "re-baseline after model updates")

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
        verdict = "NOT_TRUSTED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "TRUSTED"

    return {
        "service": "agent-evaluation-scorecard",
        "atom_version": "0.1.0",
        "agent": manifest.get("agent"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "scorecard": scorecard,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across eight sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a scorecard dict."""
    lines = [
        "AGENT-EVALUATION SCORECARD",
        f"agent: {verdict.get('agent')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<18} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: agent_evaluation_scorecard.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "TRUSTED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
