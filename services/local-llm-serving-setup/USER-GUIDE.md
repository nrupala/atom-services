# Local LLM serving setup — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You run local LLMs in production — or plan to — and you have a record of how that serving setup was designed. This atom reads one declared manifest and returns one deterministic verdict across five sections: **LOCAL_LLM_SERVING_SOUND**, **LOCAL_LLM_SERVING_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it provisions no stack, loads no model, runs no benchmark, probes no port, and does not verify that a declared control actually works. A setup is sound *on your declared evidence*: it never judges whether a chosen model or quantization is actually right for a task, whether a measured tokens/s figure is good, whether a license is actually sufficient for your use, or whether a fallback chain would really hold. Computed checks: the declared `models` list must be present and non-empty; every model row must declare its VRAM/RAM + context budget documented, its version pinned with checksum recorded, its license vetted for commercial use, its performance measured at realistic context, and a golden-task eval recorded. No numeric threshold is imposed — no minimum tokens-per-second rate or maximum time-to-first-token, no VRAM or RAM budget cap or floor in gigabytes, no minimum or maximum context length, no concurrency count, no mandated quantization level, no KV-cache headroom percentage, no number of offload layers or parallelism degree, no free disk-space floor, no health-endpoint uptime percentage, no golden-task score, pass rate or number of tasks, no number of fallback tiers beyond the declared chain shape (local primary → local secondary → declared provider), and no coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "local-llm-serving-setup"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/local-llm-serving-setup` — tool name `local_llm_serving_setup`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/local-llm-serving-setup` — body = the manifest object; same `Authorization` header.

## Input — the local-LLM-serving-setup manifest

| Field | Meaning |
|---|---|
| `setup` | setup name (string; carried into the output, not checked) |
| `workload.tasks_defined` | workload evidence: the tasks the setup serves are defined |
| `workload.context_lengths_defined` | workload evidence: the context lengths served are defined |
| `workload.concurrency_defined` | workload evidence: the concurrency served is defined |
| `workload.compute_and_vram_ram_budget_computed` | workload evidence: compute and VRAM/RAM budget are computed from the declared tasks, context lengths and concurrency |
| `workload.kv_cache_growth_accounted_and_headroom_left` | workload evidence: KV-cache growth with context is accounted for and headroom is left |
| `workload.quantization_chosen_deliberately_with_tradeoffs` | workload evidence: quantization is chosen deliberately — Q4/Q5/Q8 trade-offs weighed — not by default |
| `model_selection.model_size_matched_to_task` | model-selection evidence: model size is matched to task |
| `models` (list of model-row objects) | computed: must be present and non-empty; reported as `models_count` |
| `models[].name` (string) | names the row in the computed outputs |
| `models[].vram_ram_and_context_budget_documented` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `models_without_budget_documentation` |
| `models[].version_pinned_and_checksum_recorded` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `models_without_pinned_version_and_checksum` |
| `models[].license_vetted_for_commercial_use` | computed: must be `true` per row (red line: no unvetted model licenses); rows declaring `false` are reported in `models_without_vetted_license` |
| `models[].performance_measured_at_realistic_context` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `models_without_performance_measurement` |
| `models[].golden_task_eval_recorded` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `models_without_golden_task_eval` |
| `serving.stack_fits_host_and_workload` | serving evidence: the stack is selected as it fits the host and workload |
| `serving.runs_daemonless_under_supervisor_with_auto_restart` | serving evidence: the server runs daemonless under a supervisor with auto-restart |
| `serving.bound_to_loopback_only_verified` | serving evidence: loopback-only binding is verified |
| `serving.remote_access_only_via_authenticated_tunnel` | serving evidence: remote access is only via an authenticated tunnel |
| `serving.unauthenticated_inference_port_exposure_present` | must be `false` to pass (red line: no unauthenticated exposure of inference ports) |
| `performance.tokens_per_second_and_ttft_measured_at_realistic_context` | performance evidence: tokens/s and time-to-first-token are measured at realistic context |
| `performance.offload_layers_and_parallelism_tuned` | performance evidence: offload layers and parallelism are tuned |
| `performance.vram_overcommit_present` | must be `false` to pass (the skill: don't overcommit VRAM) |
| `operations.health_endpoint_present` | operations evidence: a health endpoint is present |
| `operations.structured_logs_present` | operations evidence: structured logs are kept |
| `operations.model_catalog_pinned` | operations evidence: the model catalog is pinned |
| `operations.disk_space_for_weights_monitored` | operations evidence: disk space for weights is monitored |
| `operations.upgrade_path_backup_swap_verify_rollback_present` | operations evidence: upgrades follow backup → swap → verify, with a rollback path |
| `fallback.fallback_chain_declared_local_primary_secondary_provider` | fallback evidence: the chain is declared — local primary → local secondary → declared provider |
| `fallback.model_swaps_behind_stable_openai_compatible_api` | fallback evidence: models swap behind a stable OpenAI-compatible API |
| `fallback.each_failover_tested_deliberately_including_primary_failure` | fallback evidence: each failover is tested deliberately, including failing the primary on purpose |
| `evaluation.golden_task_suite_run_per_model_change` | evaluation evidence: a golden task suite is run per model change |
| `evaluation.quality_and_speed_recorded_before_promotion` | evaluation evidence: quality and speed are recorded before promotion |
| `evaluation.silent_model_swaps_present` | must be `false` to pass (red line: no silent model swaps) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward LOCAL_LLM_SERVING_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/local-llm-serving-setup`:

```json
{
  "setup": "production-cluster-alpha",
  "workload": {
    "tasks_defined": true,
    "context_lengths_defined": true,
    "concurrency_defined": true,
    "compute_and_vram_ram_budget_computed": true,
    "kv_cache_growth_accounted_and_headroom_left": true,
    "quantization_chosen_deliberately_with_tradeoffs": true
  },
  "model_selection": {
    "model_size_matched_to_task": true
  },
  "models": [
    {
      "name": "llama-3-8b",
      "vram_ram_and_context_budget_documented": true,
      "version_pinned_and_checksum_recorded": true,
      "license_vetted_for_commercial_use": true,
      "performance_measured_at_realistic_context": true,
      "golden_task_eval_recorded": true
    }
  ],
  "serving": {
    "stack_fits_host_and_workload": true,
    "runs_daemonless_under_supervisor_with_auto_restart": true,
    "bound_to_loopback_only_verified": true,
    "remote_access_only_via_authenticated_tunnel": true,
    "unauthenticated_inference_port_exposure_present": false
  },
  "performance": {
    "tokens_per_second_and_ttft_measured_at_realistic_context": true,
    "offload_layers_and_parallelism_tuned": true,
    "vram_overcommit_present": false
  },
  "operations": {
    "health_endpoint_present": true,
    "structured_logs_present": true,
    "model_catalog_pinned": true,
    "disk_space_for_weights_monitored": true,
    "upgrade_path_backup_swap_verify_rollback_present": true
  },
  "fallback": {
    "fallback_chain_declared_local_primary_secondary_provider": true,
    "model_swaps_behind_stable_openai_compatible_api": true,
    "each_failover_tested_deliberately_including_primary_failure": true
  },
  "evaluation": {
    "golden_task_suite_run_per_model_change": true,
    "quality_and_speed_recorded_before_promotion": true,
    "silent_model_swaps_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 32 checks and a text stamp of the verdict):

```json
{
  "service": "local-llm-serving-setup",
  "atom_version": "0.1.0",
  "setup": "production-cluster-alpha",
  "verdict": "LOCAL_LLM_SERVING_SOUND",
  "sections": {
    "workload_and_memory_budget": "pass",
    "model_selection_and_provenance": "pass",
    "serving_stack_and_exposure": "pass",
    "performance_and_operations": "pass",
    "fallback_chains_and_evaluation": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "models_count": 1,
  "models_without_budget_documentation": [],
  "budget_coverage": "1.000000",
  "models_without_pinned_version_and_checksum": [],
  "models_without_vetted_license": [],
  "models_without_performance_measurement": [],
  "performance_coverage": "1.000000",
  "models_without_golden_task_eval": [],
  "golden_eval_coverage": "1.000000",
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across five sections."
}
```

## Verdicts

- **LOCAL_LLM_SERVING_SOUND** — every check passes; the declared local-LLM serving setup record is complete and consistent with the skill's checklist and lines.
- **LOCAL_LLM_SERVING_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `models_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `models_without_budget_documentation`, `models_without_pinned_version_and_checksum`, `models_without_vetted_license`, `models_without_performance_measurement` and `models_without_golden_task_eval` (null when the `models` list is not declared; a model with the relevant field absent is missing evidence and does not appear in those lists), the coverage values `budget_coverage`, `performance_coverage` and `golden_eval_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the six primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
