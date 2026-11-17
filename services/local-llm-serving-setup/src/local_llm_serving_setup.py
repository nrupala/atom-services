#!/usr/bin/env python3
"""Local LLM serving setup — deterministic core.

Built from the bound skill `local-llm-serving`: "Run local LLMs
in production — model/quant choice, serving stacks, VRAM budgets,
fallback chains, evaluation." Local inference is infrastructure:
match the model to the box, serve it safely, and never let it
become a single point of failure.

This atom is an AUDIT of a declared local-LLM serving setup
record: it validates the record a caller declares against the
skill's method, quality gates and red lines — workload and
memory budget, model selection and provenance, the serving stack
and its exposure, performance and operations, and fallback chains
and evaluation. It does not provision, configure, benchmark or
probe any serving stack, load any model, or verify that a
declared control actually works — it checks that the record the
skill requires is present and internally complete and consistent
on the declared evidence.

The caller submits a serving-setup manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- models: the declared `models` list must be non-empty, and
  every declared model row must show its VRAM/RAM + context
  budget documented (the skill's quality gate), its exact version
  pinned with checksum recorded and its license vetted for
  commercial use (the skill: "pin exact versions + checksums";
  "check licenses for commercial use before adopting"; red line:
  "no unvetted model licenses"), its performance measured at
  realistic context (the skill: "measure tokens/s +
  time-to-first-token at realistic context"), and a golden-task
  eval recorded (the skill's quality gate: "Golden-task evals
  recorded per model change").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no numeric threshold — no minimum tokens per
second, no maximum time-to-first-token, no VRAM/RAM gigabyte cap
or floor, no context-length minimum, no concurrency count, no
mandated quantization level, no KV-cache headroom percentage, no
disk-space floor, no evaluation score — so no numeric threshold
check is invented; those quantities are caller attestations at
most, and quantities here are computed and reported, with
completeness (every declared model) as the only bar, exactly as
stated above. The skill's mention of 16GB-class cards names a
hardware class it works on, not a budget cap, and is not treated
as one.

Verdict:
- any fail             -> LOCAL_LLM_SERVING_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> LOCAL_LLM_SERVING_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "workload_and_memory_budget",
    "model_selection_and_provenance",
    "serving_stack_and_exposure",
    "performance_and_operations",
    "fallback_chains_and_evaluation",
)

MANIFEST_SPEC = {
    "setup": "string",
    "workload": {
        "tasks_defined": "boolean",
        "context_lengths_defined": "boolean",
        "concurrency_defined": "boolean",
        "compute_and_vram_ram_budget_computed": "boolean",
        "kv_cache_growth_accounted_and_headroom_left": "boolean",
        "quantization_chosen_deliberately_with_tradeoffs": "boolean",
    },
    "model_selection": {
        "model_size_matched_to_task": "boolean",
    },
    "models": [{
        "name": "string",
        "vram_ram_and_context_budget_documented": "boolean",
        "version_pinned_and_checksum_recorded": "boolean",
        "license_vetted_for_commercial_use": "boolean",
        "performance_measured_at_realistic_context": "boolean",
        "golden_task_eval_recorded": "boolean",
    }],
    "serving": {
        "stack_fits_host_and_workload": "boolean",
        "runs_daemonless_under_supervisor_with_auto_restart": "boolean",
        "bound_to_loopback_only_verified": "boolean",
        "remote_access_only_via_authenticated_tunnel": "boolean",
        "unauthenticated_inference_port_exposure_present": "boolean",
    },
    "performance": {
        "tokens_per_second_and_ttft_measured_at_realistic_context": "boolean",
        "offload_layers_and_parallelism_tuned": "boolean",
        "vram_overcommit_present": "boolean",
    },
    "operations": {
        "health_endpoint_present": "boolean",
        "structured_logs_present": "boolean",
        "model_catalog_pinned": "boolean",
        "disk_space_for_weights_monitored": "boolean",
        "upgrade_path_backup_swap_verify_rollback_present": "boolean",
    },
    "fallback": {
        "fallback_chain_declared_local_primary_secondary_provider": "boolean",
        "model_swaps_behind_stable_openai_compatible_api": "boolean",
        "each_failover_tested_deliberately_including_primary_failure": "boolean",
    },
    "evaluation": {
        "golden_task_suite_run_per_model_change": "boolean",
        "quality_and_speed_recorded_before_promotion": "boolean",
        "silent_model_swaps_present": "boolean",
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


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _rows_without(rows, field):
    return [_row_name(c) for c in rows
            if isinstance(c, dict) and field in c
            and c.get(field) is not True]


def _coverage(rows, count, field):
    if count is None or count == 0:
        return None
    return (sum(1 for c in rows
                if isinstance(c, dict) and c.get(field) is True)
            / count)


def _every_check(results, section, name, models, is_list, rows, field,
                 evidence):
    present = (
        is_list
        and all(isinstance(c, dict) and field in c for c in rows)
    )
    _check(results, section, name, models, present,
           is_list and len(rows) > 0
           and all(isinstance(c, dict) and c.get(field) is True
                   for c in rows),
           evidence)


def evaluate(manifest):
    """Return the verdict dict for a serving-setup manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    models, has_models = _get(manifest, "models")
    models_is_list = has_models and isinstance(models, list)
    models_count = len(models) if models_is_list else None
    rows = models if models_is_list else []

    models_without_budget = (
        _rows_without(rows, "vram_ram_and_context_budget_documented")
        if models_is_list else None
    )
    models_without_pin = (
        _rows_without(rows, "version_pinned_and_checksum_recorded")
        if models_is_list else None
    )
    models_without_vetted_license = (
        _rows_without(rows, "license_vetted_for_commercial_use")
        if models_is_list else None
    )
    models_without_performance = (
        _rows_without(rows, "performance_measured_at_realistic_context")
        if models_is_list else None
    )
    models_without_golden_eval = (
        _rows_without(rows, "golden_task_eval_recorded")
        if models_is_list else None
    )
    budget_coverage = (
        _coverage(rows, models_count,
                  "vram_ram_and_context_budget_documented")
        if models_is_list else None
    )
    performance_coverage = (
        _coverage(rows, models_count,
                  "performance_measured_at_realistic_context")
        if models_is_list else None
    )
    golden_eval_coverage = (
        _coverage(rows, models_count, "golden_task_eval_recorded")
        if models_is_list else None
    )

    # ---- Section 1: workload_and_memory_budget (skill method 1:
    #      workload -> budget first — tasks, context lengths,
    #      concurrency -> compute + VRAM/RAM budget; the KV cache
    #      grows with context, leave headroom; quantize
    #      deliberately, not by default. Quality gate: VRAM/RAM +
    #      context budget documented for each served model) ----
    _bool_check(results, "workload_and_memory_budget",
                "tasks_defined", manifest,
                ("workload", "tasks_defined"),
                "workload first: the tasks the setup serves are "
                "defined before any budget is set")
    _bool_check(results, "workload_and_memory_budget",
                "context_lengths_defined", manifest,
                ("workload", "context_lengths_defined"),
                "workload first: the context lengths served are "
                "defined")
    _bool_check(results, "workload_and_memory_budget",
                "concurrency_defined", manifest,
                ("workload", "concurrency_defined"),
                "workload first: the concurrency served is defined")
    _bool_check(results, "workload_and_memory_budget",
                "compute_and_vram_ram_budget_computed", manifest,
                ("workload", "compute_and_vram_ram_budget_computed"),
                "workload first: compute and VRAM/RAM budget are "
                "computed from the declared tasks, context lengths "
                "and concurrency")
    _bool_check(results, "workload_and_memory_budget",
                "kv_cache_growth_accounted_and_headroom_left",
                manifest,
                ("workload",
                 "kv_cache_growth_accounted_and_headroom_left"),
                "workload first: KV-cache growth with context is "
                "accounted for and headroom is left")
    _bool_check(results, "workload_and_memory_budget",
                "quantization_chosen_deliberately_with_tradeoffs",
                manifest,
                ("workload",
                 "quantization_chosen_deliberately_with_tradeoffs"),
                "workload first: quantization is chosen "
                "deliberately — Q4/Q5/Q8 trade-offs weighed — not "
                "by default")
    _check(results, "workload_and_memory_budget",
           "models_declared", models, models_is_list,
           models_is_list and models_count > 0,
           "the declared record names its served models — the "
           "models list is present and non-empty")
    _every_check(results, "workload_and_memory_budget",
                 "every_model_vram_ram_and_context_budget_documented",
                 models, models_is_list, rows,
                 "vram_ram_and_context_budget_documented",
                 "quality gate: VRAM/RAM + context budget are "
                 "documented for each served model")

    # ---- Section 2: model_selection_and_provenance (skill method
    #      2: match model size to task; check licenses for
    #      commercial use before adopting; pin exact versions +
    #      checksums. Red line: no unvetted model licenses) ----
    _bool_check(results, "model_selection_and_provenance",
                "model_size_matched_to_task", manifest,
                ("model_selection", "model_size_matched_to_task"),
                "model selection: model size is matched to task — "
                "small for routing/summaries, larger for reasoning")
    _every_check(results, "model_selection_and_provenance",
                 "every_model_version_pinned_and_checksum_recorded",
                 models, models_is_list, rows,
                 "version_pinned_and_checksum_recorded",
                 "model selection: every served model row pins its "
                 "exact version and records its checksum "
                 "(provenance)")
    _every_check(results, "model_selection_and_provenance",
                 "every_model_license_vetted_for_commercial_use",
                 models, models_is_list, rows,
                 "license_vetted_for_commercial_use",
                 "red line: every served model row declares its "
                 "license checked for commercial use before "
                 "adoption — no unvetted model licenses")

    # ---- Section 3: serving_stack_and_exposure (skill method 3:
    #      serving stack as fits; daemonless under systemd or a
    #      Windows service with auto-restart; bind loopback —
    #      remote access only via authenticated tunnel. Red line:
    #      no unauthenticated exposure of inference ports.
    #      Quality gate: loopback-only binding verified) ----
    _bool_check(results, "serving_stack_and_exposure",
                "serving_stack_selected_to_fit_host_and_workload",
                manifest,
                ("serving", "stack_fits_host_and_workload"),
                "serving stack: the stack — llama.cpp server / "
                "Ollama / vLLM-class — is selected as it fits the "
                "host and workload")
    _bool_check(results, "serving_stack_and_exposure",
                "runs_daemonless_under_supervisor_with_auto_restart",
                manifest,
                ("serving",
                 "runs_daemonless_under_supervisor_with_auto_restart"),
                "serving stack: the server runs daemonless under "
                "systemd (or a Windows service) with auto-restart")
    _bool_check(results, "serving_stack_and_exposure",
                "loopback_only_binding_verified", manifest,
                ("serving", "bound_to_loopback_only_verified"),
                "quality gate: loopback-only binding is verified")
    _bool_check(results, "serving_stack_and_exposure",
                "remote_access_only_via_authenticated_tunnel",
                manifest,
                ("serving",
                 "remote_access_only_via_authenticated_tunnel"),
                "serving stack: remote access is only via an "
                "authenticated tunnel")
    _false_check(results, "serving_stack_and_exposure",
                 "no_unauthenticated_inference_port_exposure",
                 manifest,
                 ("serving",
                  "unauthenticated_inference_port_exposure_present"),
                 "red line: no unauthenticated exposure of "
                 "inference ports is present")

    # ---- Section 4: performance_and_operations (skill methods 4
    #      and 5: measure tokens/s + time-to-first-token at
    #      realistic context; tune offload layers and parallelism;
    #      don't overcommit VRAM. Operations: health endpoint,
    #      structured logs, model catalog pinned, disk space
    #      monitored for weights; upgrades = backup -> swap ->
    #      verify -> rollback path) ----
    _bool_check(results, "performance_and_operations",
                "tokens_per_second_and_ttft_measured_at_realistic_context",
                manifest,
                ("performance",
                 "tokens_per_second_and_ttft_measured_at_realistic_context"),
                "performance: tokens/s and time-to-first-token are "
                "measured at realistic context")
    _bool_check(results, "performance_and_operations",
                "offload_layers_and_parallelism_tuned", manifest,
                ("performance", "offload_layers_and_parallelism_tuned"),
                "performance: offload layers and parallelism are "
                "tuned")
    _false_check(results, "performance_and_operations",
                 "no_vram_overcommit", manifest,
                 ("performance", "vram_overcommit_present"),
                 "performance: VRAM is not overcommitted — \"it "
                 "loads\" is not \"it serves\"")
    _every_check(results, "performance_and_operations",
                 "every_model_performance_measured_at_realistic_context",
                 models, models_is_list, rows,
                 "performance_measured_at_realistic_context",
                 "performance: every served model row declares "
                 "its performance measured at realistic context")
    _bool_check(results, "performance_and_operations",
                "health_endpoint_present", manifest,
                ("operations", "health_endpoint_present"),
                "operations: a health endpoint is present")
    _bool_check(results, "performance_and_operations",
                "structured_logs_present", manifest,
                ("operations", "structured_logs_present"),
                "operations: structured logs are kept")
    _bool_check(results, "performance_and_operations",
                "model_catalog_pinned", manifest,
                ("operations", "model_catalog_pinned"),
                "operations: the model catalog is pinned")
    _bool_check(results, "performance_and_operations",
                "disk_space_for_weights_monitored", manifest,
                ("operations", "disk_space_for_weights_monitored"),
                "operations: disk space for weights is monitored")
    _bool_check(results, "performance_and_operations",
                "upgrade_path_backup_swap_verify_rollback_present",
                manifest,
                ("operations",
                 "upgrade_path_backup_swap_verify_rollback_present"),
                "operations: upgrades follow backup -> swap -> "
                "verify, with a rollback path")

    # ---- Section 5: fallback_chains_and_evaluation (skill
    #      methods 6 and 7: local primary -> local secondary ->
    #      declared provider; swap models behind a stable
    #      OpenAI-compatible API so apps never change; test each
    #      failover deliberately. Quality gate: fallback chain
    #      tested — fail the primary on purpose. Evaluation:
    #      golden task suite per model change; record quality +
    #      speed before promotion. Red line: no silent model
    #      swaps in production) ----
    _bool_check(results, "fallback_chains_and_evaluation",
                "fallback_chain_declared_local_primary_secondary_provider",
                manifest,
                ("fallback",
                 "fallback_chain_declared_local_primary_secondary_provider"),
                "fallback chains: the chain is declared — local "
                "primary -> local secondary -> declared provider")
    _bool_check(results, "fallback_chains_and_evaluation",
                "model_swaps_behind_stable_openai_compatible_api",
                manifest,
                ("fallback",
                 "model_swaps_behind_stable_openai_compatible_api"),
                "fallback chains: models swap behind a stable API "
                "(OpenAI-compatible surface) so apps never change")
    _bool_check(results, "fallback_chains_and_evaluation",
                "fallback_chain_tested_by_failing_primary_deliberately",
                manifest,
                ("fallback",
                 "each_failover_tested_deliberately_including_primary_failure"),
                "quality gate: the fallback chain is tested — "
                "each failover is tested deliberately, the "
                "primary failed on purpose")
    _bool_check(results, "fallback_chains_and_evaluation",
                "golden_task_suite_run_per_model_change", manifest,
                ("evaluation", "golden_task_suite_run_per_model_change"),
                "evaluation: a golden task suite is run per model "
                "change")
    _bool_check(results, "fallback_chains_and_evaluation",
                "quality_and_speed_recorded_before_promotion",
                manifest,
                ("evaluation",
                 "quality_and_speed_recorded_before_promotion"),
                "evaluation: quality and speed are recorded "
                "before promotion")
    _false_check(results, "fallback_chains_and_evaluation",
                 "no_silent_model_swaps", manifest,
                 ("evaluation", "silent_model_swaps_present"),
                 "red line: no silent model swaps in production "
                 "are present")
    _every_check(results, "fallback_chains_and_evaluation",
                 "every_model_golden_task_eval_recorded",
                 models, models_is_list, rows,
                 "golden_task_eval_recorded",
                 "quality gate: a golden-task eval is recorded "
                 "for every served model")

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
        verdict = "LOCAL_LLM_SERVING_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "LOCAL_LLM_SERVING_SOUND"

    computed_names = (
        "models_declared",
        "every_model_vram_ram_and_context_budget_documented",
        "every_model_version_pinned_and_checksum_recorded",
        "every_model_license_vetted_for_commercial_use",
        "every_model_performance_measured_at_realistic_context",
        "every_model_golden_task_eval_recorded",
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
        "service": "local-llm-serving-setup",
        "atom_version": "0.1.0",
        "setup": manifest.get("setup"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "models_count": models_count,
        "models_without_budget_documentation": models_without_budget,
        "budget_coverage": _fmt6(budget_coverage),
        "models_without_pinned_version_and_checksum": models_without_pin,
        "models_without_vetted_license": models_without_vetted_license,
        "models_without_performance_measurement": models_without_performance,
        "performance_coverage": _fmt6(performance_coverage),
        "models_without_golden_task_eval": models_without_golden_eval,
        "golden_eval_coverage": _fmt6(golden_eval_coverage),
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
        "LOCAL LLM SERVING SETUP",
        f"setup: {verdict.get('setup')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: local_llm_serving_setup.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "LOCAL_LLM_SERVING_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
