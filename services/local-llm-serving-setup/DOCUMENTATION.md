# Local llm serving setup — documentation

**Local llm serving setup** · slug `local-llm-serving-setup` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate, RC soak to 2026-11-22 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

**Status discrepancy (named, not papered over):** SERVICE.md still states status **built-locally** — "deterministic core, Python oracle and TypeScript port built and parity-proven locally; no endpoint is live." That statement is stale against the recorded evidence: TEST-REPORT.md and `verification/work/local-llm-serving-setup/evidence.json` record live calls against atoms-gateway v1.1.0 (deployment fe07be725c5a4817ad7b7e341310a97b) at https://atoms.pipavia.com. This document follows the evidenced live state — live, release candidate, RC soak to 2026-11-22 — and names the SERVICE.md status line as the discrepancy. See Discrepancies for every other divergence found.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `setup` "production-cluster-alpha"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "local-llm-serving-setup"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the local-LLM-serving-setup manifest.** You declare a record of a serving setup already designed and run — the atom audits the record, it does not provision or run the setup (see Explanation). The recorded full-pass manifest declares the setup `production-cluster-alpha`: the workload's tasks, context lengths and concurrency defined, the compute and VRAM/RAM budget computed from them, KV-cache growth accounted for with headroom left, and quantization chosen deliberately with its trade-offs weighed; model size matched to task; one model, `llama-3-8b`, with its VRAM/RAM + context budget documented, its version pinned with checksum recorded, its license vetted for commercial use, its performance measured at realistic context, and a golden-task eval recorded; the serving stack selected to fit host and workload, running daemonless under a supervisor with auto-restart, bound to loopback only (verified), with remote access only via an authenticated tunnel and no unauthenticated inference-port exposure (`unauthenticated_inference_port_exposure_present: false`); tokens/s and time-to-first-token measured at realistic context, offload layers and parallelism tuned, and no VRAM overcommit (`vram_overcommit_present: false`); a health endpoint, structured logs, a pinned model catalog, disk space for weights monitored, and an upgrade path of backup → swap → verify with rollback; a fallback chain declared local primary → local secondary → declared provider, model swaps behind a stable OpenAI-compatible API, and each failover tested deliberately including primary failure; and a golden-task suite run per model change, quality and speed recorded before promotion, and no silent model swaps (`silent_model_swaps_present: false`).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/local-llm-serving-setup` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `LOCAL_LLM_SERVING_SOUND`: "32 pass, 0 fail, 0 missing of 32 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `models_count` is 1, and `budget_coverage`, `performance_coverage` and `golden_eval_coverage` are each `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `LOCAL_LLM_SERVING_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "local-llm-serving-setup"}`.
3. Call: `POST https://atoms.pipavia.com/v1/local-llm-serving-setup` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/local-llm-serving-setup` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `local_llm_serving_setup`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `LOCAL_LLM_SERVING_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared model row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_model_license_vetted_for_commercial_use`, `no_unauthenticated_inference_port_exposure`, `no_vram_overcommit`, `no_silent_model_swaps`, and the summary reads "28 pass, 4 fail, 0 missing of 32 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `models_without_vetted_license` names `llama-3-8b` — the one declared model, whose `license_vetted_for_commercial_use` is declared `false`; the run also declares `serving.unauthenticated_inference_port_exposure_present` and `performance.vram_overcommit_present` as `true` and `evaluation.silent_model_swaps_present` as `true`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "workload",
  "detail": "workload must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/local-llm-serving-setup` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/local-llm-serving-setup` — tool name `local_llm_serving_setup`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `local_llm_serving_setup` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. SERVICE.md states no type for the seven section container objects (`workload`, `model_selection`, `serving`, `performance`, `operations`, `fallback`, `evaluation`) or for a `models[]` row object itself; those eight types are grounded in the recorded evidence instead — the MCP `inputSchema` in `verification/work/local-llm-serving-setup/evidence.json` types each section as an object and `models` as an array, and the recorded malformed run proves the object typing is enforced (`workload must be an object`) — and are marked "evidence" below. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `LOCAL_LLM_SERVING_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `setup` | string | Carried into the verdict output, not itself checked |

#### Read by: workload_and_memory_budget

| Field | Type | Notes |
|---|---|---|
| `workload` | object (evidence) | The workload section object — a present non-object value is rejected before evaluation (proven by the recorded malformed run) |
| `workload.tasks_defined` | boolean | — |
| `workload.context_lengths_defined` | boolean | — |
| `workload.concurrency_defined` | boolean | — |
| `workload.compute_and_vram_ram_budget_computed` | boolean | — |
| `workload.kv_cache_growth_accounted_and_headroom_left` | boolean | — |
| `workload.quantization_chosen_deliberately_with_tradeoffs` | boolean | — |
| `models` | list | list of model-row objects, each with the entry fields below; computed, see below |
| `models[]` | object (evidence) | One declared model row |
| `models[].name` | string | Names the row in the computed outputs |
| `models[].vram_ram_and_context_budget_documented` | boolean | — |

#### Read by: model_selection_and_provenance

| Field | Type | Notes |
|---|---|---|
| `model_selection` | object (evidence) | The model-selection section object — a present non-object value is rejected before evaluation |
| `model_selection.model_size_matched_to_task` | boolean | — |
| `models[].version_pinned_and_checksum_recorded` | boolean | — |
| `models[].license_vetted_for_commercial_use` | boolean | must be `true` per row — skill red line: no unvetted model licenses |

#### Read by: serving_stack_and_exposure

| Field | Type | Notes |
|---|---|---|
| `serving` | object (evidence) | The serving section object — a present non-object value is rejected before evaluation |
| `serving.stack_fits_host_and_workload` | boolean | — |
| `serving.runs_daemonless_under_supervisor_with_auto_restart` | boolean | — |
| `serving.bound_to_loopback_only_verified` | boolean | — |
| `serving.remote_access_only_via_authenticated_tunnel` | boolean | — |
| `serving.unauthenticated_inference_port_exposure_present` | boolean | must be `false` to pass — skill red line |

#### Read by: performance_and_operations

| Field | Type | Notes |
|---|---|---|
| `performance` | object (evidence) | The performance section object — a present non-object value is rejected before evaluation |
| `performance.tokens_per_second_and_ttft_measured_at_realistic_context` | boolean | — |
| `performance.offload_layers_and_parallelism_tuned` | boolean | — |
| `performance.vram_overcommit_present` | boolean | must be `false` to pass — the skill: don't overcommit VRAM |
| `models[].performance_measured_at_realistic_context` | boolean | — |
| `operations` | object (evidence) | The operations section object — a present non-object value is rejected before evaluation |
| `operations.health_endpoint_present` | boolean | — |
| `operations.structured_logs_present` | boolean | — |
| `operations.model_catalog_pinned` | boolean | — |
| `operations.disk_space_for_weights_monitored` | boolean | — |
| `operations.upgrade_path_backup_swap_verify_rollback_present` | boolean | — |

#### Read by: fallback_chains_and_evaluation

| Field | Type | Notes |
|---|---|---|
| `fallback` | object (evidence) | The fallback section object — a present non-object value is rejected before evaluation |
| `fallback.fallback_chain_declared_local_primary_secondary_provider` | boolean | — |
| `fallback.model_swaps_behind_stable_openai_compatible_api` | boolean | — |
| `fallback.each_failover_tested_deliberately_including_primary_failure` | boolean | — |
| `evaluation` | object (evidence) | The evaluation section object — a present non-object value is rejected before evaluation |
| `evaluation.golden_task_suite_run_per_model_change` | boolean | — |
| `evaluation.quality_and_speed_recorded_before_promotion` | boolean | — |
| `evaluation.silent_model_swaps_present` | boolean | must be `false` to pass — skill red line: no silent model swaps |
| `models[].golden_task_eval_recorded` | boolean | — |

### Checks

All 32 checks, in the recorded order, grouped by section. Check names are the recorded names from the full-pass response in `verification/work/local-llm-serving-setup/evidence.json`, verbatim — several differ from the input field they read (see Discrepancies). "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. This atom has no conditional (gated) checks: every check is an attestation check over one declared boolean or a computed check over the declared `models` rows. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: workload_and_memory_budget

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tasks_defined` | workload first: the tasks the setup serves are defined before any budget is set | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `context_lengths_defined` | workload first: the context lengths served are defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `concurrency_defined` | workload first: the concurrency served is defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `compute_and_vram_ram_budget_computed` | workload first: compute and VRAM/RAM budget are computed from the declared tasks, context lengths and concurrency | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `kv_cache_growth_accounted_and_headroom_left` | workload first: KV-cache growth with context is accounted for and headroom is left | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `quantization_chosen_deliberately_with_tradeoffs` | workload first: quantization is chosen deliberately — Q4/Q5/Q8 trade-offs weighed — not by default | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `models_declared` | the declared record names its served models — the models list is present and non-empty | Computed over the declared record. Pass: the `models` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_model_vram_ram_and_context_budget_documented` | quality gate: VRAM/RAM + context budget are documented for each served model | Computed over the declared rows. Pass: every declared model row declares `vram_ram_and_context_budget_documented: true`. Fail: a row declares the field present but not `true` (offending rows are named in `models_without_budget_documentation`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `models_without_budget_documentation`). |

#### Section: model_selection_and_provenance

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `model_size_matched_to_task` | model selection: model size is matched to task — small for routing/summaries, larger for reasoning | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_model_version_pinned_and_checksum_recorded` | model selection: every served model row pins its exact version and records its checksum (provenance) | Computed over the declared rows. Pass: every declared model row declares `version_pinned_and_checksum_recorded: true`. Fail: a row declares the field present but not `true` (offending rows are named in `models_without_pinned_version_and_checksum`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `models_without_pinned_version_and_checksum`). |
| `every_model_license_vetted_for_commercial_use` | red line: every served model row declares its license checked for commercial use before adoption — no unvetted model licenses | Computed over the declared rows. Pass: every declared model row declares `license_vetted_for_commercial_use: true`. Fail: a row declares the field present but not `true` (offending rows are named in `models_without_vetted_license`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `models_without_vetted_license`). |

#### Section: serving_stack_and_exposure

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `serving_stack_selected_to_fit_host_and_workload` | serving stack: the stack — llama.cpp server / Ollama / vLLM-class — is selected as it fits the host and workload | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `runs_daemonless_under_supervisor_with_auto_restart` | serving stack: the server runs daemonless under systemd (or a Windows service) with auto-restart | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `loopback_only_binding_verified` | quality gate: loopback-only binding is verified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `remote_access_only_via_authenticated_tunnel` | serving stack: remote access is only via an authenticated tunnel | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_unauthenticated_inference_port_exposure` | red line: no unauthenticated exposure of inference ports is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

#### Section: performance_and_operations

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tokens_per_second_and_ttft_measured_at_realistic_context` | performance: tokens/s and time-to-first-token are measured at realistic context | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `offload_layers_and_parallelism_tuned` | performance: offload layers and parallelism are tuned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_vram_overcommit` | performance: VRAM is not overcommitted — "it loads" is not "it serves" | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `every_model_performance_measured_at_realistic_context` | performance: every served model row declares its performance measured at realistic context | Computed over the declared rows. Pass: every declared model row declares `performance_measured_at_realistic_context: true`. Fail: a row declares the field present but not `true` (offending rows are named in `models_without_performance_measurement`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `models_without_performance_measurement`). |
| `health_endpoint_present` | operations: a health endpoint is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_logs_present` | operations: structured logs are kept | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `model_catalog_pinned` | operations: the model catalog is pinned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `disk_space_for_weights_monitored` | operations: disk space for weights is monitored | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `upgrade_path_backup_swap_verify_rollback_present` | operations: upgrades follow backup -> swap -> verify, with a rollback path | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: fallback_chains_and_evaluation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `fallback_chain_declared_local_primary_secondary_provider` | fallback chains: the chain is declared — local primary -> local secondary -> declared provider | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `model_swaps_behind_stable_openai_compatible_api` | fallback chains: models swap behind a stable API (OpenAI-compatible surface) so apps never change | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `fallback_chain_tested_by_failing_primary_deliberately` | quality gate: the fallback chain is tested — each failover is tested deliberately, the primary failed on purpose | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `golden_task_suite_run_per_model_change` | evaluation: a golden task suite is run per model change | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `quality_and_speed_recorded_before_promotion` | evaluation: quality and speed are recorded before promotion | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_silent_model_swaps` | red line: no silent model swaps in production are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `every_model_golden_task_eval_recorded` | quality gate: a golden-task eval is recorded for every served model | Computed over the declared rows. Pass: every declared model row declares `golden_task_eval_recorded: true`. Fail: a row declares the field present but not `true` (offending rows are named in `models_without_golden_task_eval`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `models_without_golden_task_eval`). |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"local-llm-serving-setup"`), `atom_version` (`"0.1.0"`), and `setup` (the manifest's declared setup value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `models_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `models_without_budget_documentation`, `models_without_pinned_version_and_checksum`, `models_without_vetted_license`, `models_without_performance_measurement` and `models_without_golden_task_eval` (models whose relevant field is present but not `true`; a model with the field absent is missing evidence and does not appear in those lists; all five lists are null when the `models` list is not declared); and the ratios `budget_coverage` (models with documented VRAM/RAM + context budget ÷ declared models), `performance_coverage` (models with performance measured at realistic context ÷ declared models) and `golden_eval_coverage` (models with a golden-task eval recorded ÷ declared models) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "32 pass, 0 fail, 0 missing of 32 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared setup value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `LOCAL_LLM_SERVING_SOUND` — all 32 checks pass: the declared local-LLM serving setup record is complete and consistent with the bound skill's checklist, quality gates and red lines.
- `LOCAL_LLM_SERVING_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes (the six primary computed checks are: models declared, budget per model, provenance per model, license per model, performance per model, golden-task eval per model); `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Only the 422 body below is recorded in this atom's verification battery. The 401, 403 and 429 rows carry HTTP status and meaning only — **no body was recorded for them in the battery, and no payload shape is asserted for them here (unrecorded)**. A failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no body in the recorded battery; status and meaning only.* | Missing or invalid gateway API key. |
| 403 | *Unrecorded — no body in the recorded battery; status and meaning only.* | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. |
| 422 | `{"ok":false,"error":"invalid_input","field":"workload","detail":"workload must be an object"}` (this atom's recorded malformed run, verbatim) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no body in the recorded battery; status and meaning only.* | Per-key rate limit exceeded for this atom (60/minute, 10,000/day — see Rate limits and pricing). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Run local LLMs in production — model/quant choice, serving stacks, VRAM budgets, fallback chains, evaluation (the bound capability, from the `local-llm-serving` skill). You submit one declared record — the local-LLM-serving-setup manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`workload_and_memory_budget`, `model_selection_and_provenance`, `serving_stack_and_exposure`, `performance_and_operations`, `fallback_chains_and_evaluation`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `models` list must be present and non-empty, and every declared model row must declare its VRAM/RAM + context budget documented, its version pinned with checksum recorded, its license vetted for commercial use, its performance measured at realistic context, and a golden-task eval recorded — using only the declared record, with no outside threshold imported. There are no conditional (gated) checks in this atom. Aggregation is strict: any `fail` anywhere produces `LOCAL_LLM_SERVING_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `LOCAL_LLM_SERVING_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a minimum tokens-per-second rate or a maximum time-to-first-token in milliseconds (the skill requires both be measured at realistic context but states no number); a VRAM or RAM budget cap or floor in gigabytes (the skill's mention of 16GB-class cards names a hardware class it works on, not a cap, and is not treated as one); a minimum or maximum context length in tokens; a concurrency count; a mandated quantization level (the skill names Q4/Q5/Q8 as trade-offs to weigh deliberately, never one level to use); a KV-cache headroom percentage or gigabyte figure (the skill says "leave headroom", no amount); a number of offload layers or a parallelism degree; a free disk-space floor for weights; a health-endpoint uptime percentage; a golden-task evaluation score, pass rate or number of tasks; a number of fallback tiers beyond the declared chain shape (local primary → local secondary → declared provider); a coverage percentage below completeness. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** local-LLM serving setup record: a verdict of `LOCAL_LLM_SERVING_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares loopback-only binding verified, licenses vetted, and fallback tested passes those checks even if the real setup does none of it. It is a completeness and consistency audit of the record the skill requires, **not a serving service, a benchmark, or a security certification**. Specifically: it provisions no stack, loads no model, runs no benchmark, probes no port, and does not verify that a declared control actually works. It never judges whether a chosen model or quantization is actually right for a task, whether a measured tokens/s figure is good, whether a license is actually sufficient for a caller's use, or whether a fallback chain would really hold — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no inspection of actual model files, checksums, licenses, configurations or logs — every such fact is a caller-declared flag; model, stack and quantization suitability for a workload is a caller declaration — the atom checks only that the choice is declared deliberate and matched, never that it is optimal; evaluation quality (whether a golden task suite is well designed or its scores are good) is a caller declaration — only its recorded presence per model change is checked.

**Distinct ground.** Sibling atoms touch neighbouring ground; this atom shares no check with them (per SERVICE.md). `agent-evaluation-scorecard` audits agent task suites themselves — this atom never scores a task or a judge; its only evaluation checks are that a golden-task suite is run per model change and that an eval is recorded for every served model. `network-exposure-audit` audits a whole network surface — this atom makes no network-wide claim; its only exposure checks are the three declared serving-stack facts (loopback-only binding verified, remote access only via an authenticated tunnel, no unauthenticated exposure of this setup's inference ports). `rag-retrieval-evaluation-tuning` tunes retrieval quality — this atom has no retrieval surface at all.

**Buyer and use context.** Teams and agents working in How Milo works who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Fleet local model serving operations (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared local-LLM serving setup record; its verdict is a completeness and consistency judgment on the declared evidence, not compliance or audit evidence and not a security certification (SERVICE.md states this explicitly in its Honest scoping), and a local LLM serving setup record is not itself a compliance determination. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `local_llm_serving_setup` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/local_llm_serving_setup.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_local_llm_serving_setup.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/local-llm-serving-setup` (REST) and `POST /mcp/local-llm-serving-setup` (MCP, tool `local_llm_serving_setup`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `local_llm_serving_setup`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume; only the 422 body shape is recorded in the battery (see Errors). Status: live — release candidate, RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

This document follows the **recorded response** wherever SERVICE.md, TEST-REPORT.md or USER-GUIDE.md disagree with it. Every discrepancy found is named here; none is papered over.

1. **SERVICE.md status is stale.** SERVICE.md states status **built-locally** ("no endpoint is live"), while TEST-REPORT.md and the recorded battery in `verification/work/local-llm-serving-setup/evidence.json` record live calls against atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b. This document follows the evidenced live state (live — release candidate, RC soak to 2026-11-22) and names the SERVICE.md status line as stale.
2. **Recorded check names differ from input field names.** The Checks section uses the recorded check names verbatim. They differ from the input fields they read for at least: input `serving.stack_fits_host_and_workload` → check `serving_stack_selected_to_fit_host_and_workload`; input `serving.bound_to_loopback_only_verified` → check `loopback_only_binding_verified`; input `performance.vram_overcommit_present` → check `no_vram_overcommit`; input `serving.unauthenticated_inference_port_exposure_present` → check `no_unauthenticated_inference_port_exposure`; input `evaluation.silent_model_swaps_present` → check `no_silent_model_swaps`; input `fallback.each_failover_tested_deliberately_including_primary_failure` → check `fallback_chain_tested_by_failing_primary_deliberately`; and the six computed checks (`models_declared`, `every_model_vram_ram_and_context_budget_documented`, `every_model_version_pinned_and_checksum_recorded`, `every_model_license_vetted_for_commercial_use`, `every_model_performance_measured_at_realistic_context`, `every_model_golden_task_eval_recorded`), which have no single same-named input field.
3. **Container-object types are unstated in SERVICE.md.** SERVICE.md's field table gives no type for the seven section container objects or for a `models[]` row object. The Input reference types them from the recorded evidence (the battery's MCP `inputSchema` plus the recorded malformed run) and marks each such type "evidence".
4. **USER-GUIDE.md and TEST-REPORT.md show trimmed responses.** Both present the full-pass response trimmed — the `checks` array and the `stamp` field are omitted (USER-GUIDE.md says so explicitly). The recorded full response carries all 32 checks and the `stamp`; the Worked examples below reproduce the recorded responses in full, and this document follows the recording.

## Worked examples

Provenance: recorded 2026-11-16T06:30:16.987570+00:00 against gateway v1.1.0, external verification lane, source `verification/work/local-llm-serving-setup/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "workload_and_memory_budget",
      "check": "tasks_defined",
      "status": "pass",
      "evidence": "workload first: the tasks the setup serves are defined before any budget is set"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "context_lengths_defined",
      "status": "pass",
      "evidence": "workload first: the context lengths served are defined"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "concurrency_defined",
      "status": "pass",
      "evidence": "workload first: the concurrency served is defined"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "compute_and_vram_ram_budget_computed",
      "status": "pass",
      "evidence": "workload first: compute and VRAM/RAM budget are computed from the declared tasks, context lengths and concurrency"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "kv_cache_growth_accounted_and_headroom_left",
      "status": "pass",
      "evidence": "workload first: KV-cache growth with context is accounted for and headroom is left"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "quantization_chosen_deliberately_with_tradeoffs",
      "status": "pass",
      "evidence": "workload first: quantization is chosen deliberately — Q4/Q5/Q8 trade-offs weighed — not by default"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "models_declared",
      "status": "pass",
      "evidence": "the declared record names its served models — the models list is present and non-empty"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "every_model_vram_ram_and_context_budget_documented",
      "status": "pass",
      "evidence": "quality gate: VRAM/RAM + context budget are documented for each served model"
    },
    {
      "section": "model_selection_and_provenance",
      "check": "model_size_matched_to_task",
      "status": "pass",
      "evidence": "model selection: model size is matched to task — small for routing/summaries, larger for reasoning"
    },
    {
      "section": "model_selection_and_provenance",
      "check": "every_model_version_pinned_and_checksum_recorded",
      "status": "pass",
      "evidence": "model selection: every served model row pins its exact version and records its checksum (provenance)"
    },
    {
      "section": "model_selection_and_provenance",
      "check": "every_model_license_vetted_for_commercial_use",
      "status": "pass",
      "evidence": "red line: every served model row declares its license checked for commercial use before adoption — no unvetted model licenses"
    },
    {
      "section": "serving_stack_and_exposure",
      "check": "serving_stack_selected_to_fit_host_and_workload",
      "status": "pass",
      "evidence": "serving stack: the stack — llama.cpp server / Ollama / vLLM-class — is selected as it fits the host and workload"
    },
    {
      "section": "serving_stack_and_exposure",
      "check": "runs_daemonless_under_supervisor_with_auto_restart",
      "status": "pass",
      "evidence": "serving stack: the server runs daemonless under systemd (or a Windows service) with auto-restart"
    },
    {
      "section": "serving_stack_and_exposure",
      "check": "loopback_only_binding_verified",
      "status": "pass",
      "evidence": "quality gate: loopback-only binding is verified"
    },
    {
      "section": "serving_stack_and_exposure",
      "check": "remote_access_only_via_authenticated_tunnel",
      "status": "pass",
      "evidence": "serving stack: remote access is only via an authenticated tunnel"
    },
    {
      "section": "serving_stack_and_exposure",
      "check": "no_unauthenticated_inference_port_exposure",
      "status": "pass",
      "evidence": "red line: no unauthenticated exposure of inference ports is present"
    },
    {
      "section": "performance_and_operations",
      "check": "tokens_per_second_and_ttft_measured_at_realistic_context",
      "status": "pass",
      "evidence": "performance: tokens/s and time-to-first-token are measured at realistic context"
    },
    {
      "section": "performance_and_operations",
      "check": "offload_layers_and_parallelism_tuned",
      "status": "pass",
      "evidence": "performance: offload layers and parallelism are tuned"
    },
    {
      "section": "performance_and_operations",
      "check": "no_vram_overcommit",
      "status": "pass",
      "evidence": "performance: VRAM is not overcommitted — \"it loads\" is not \"it serves\""
    },
    {
      "section": "performance_and_operations",
      "check": "every_model_performance_measured_at_realistic_context",
      "status": "pass",
      "evidence": "performance: every served model row declares its performance measured at realistic context"
    },
    {
      "section": "performance_and_operations",
      "check": "health_endpoint_present",
      "status": "pass",
      "evidence": "operations: a health endpoint is present"
    },
    {
      "section": "performance_and_operations",
      "check": "structured_logs_present",
      "status": "pass",
      "evidence": "operations: structured logs are kept"
    },
    {
      "section": "performance_and_operations",
      "check": "model_catalog_pinned",
      "status": "pass",
      "evidence": "operations: the model catalog is pinned"
    },
    {
      "section": "performance_and_operations",
      "check": "disk_space_for_weights_monitored",
      "status": "pass",
      "evidence": "operations: disk space for weights is monitored"
    },
    {
      "section": "performance_and_operations",
      "check": "upgrade_path_backup_swap_verify_rollback_present",
      "status": "pass",
      "evidence": "operations: upgrades follow backup -> swap -> verify, with a rollback path"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "fallback_chain_declared_local_primary_secondary_provider",
      "status": "pass",
      "evidence": "fallback chains: the chain is declared — local primary -> local secondary -> declared provider"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "model_swaps_behind_stable_openai_compatible_api",
      "status": "pass",
      "evidence": "fallback chains: models swap behind a stable API (OpenAI-compatible surface) so apps never change"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "fallback_chain_tested_by_failing_primary_deliberately",
      "status": "pass",
      "evidence": "quality gate: the fallback chain is tested — each failover is tested deliberately, the primary failed on purpose"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "golden_task_suite_run_per_model_change",
      "status": "pass",
      "evidence": "evaluation: a golden task suite is run per model change"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "quality_and_speed_recorded_before_promotion",
      "status": "pass",
      "evidence": "evaluation: quality and speed are recorded before promotion"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "no_silent_model_swaps",
      "status": "pass",
      "evidence": "red line: no silent model swaps in production are present"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "every_model_golden_task_eval_recorded",
      "status": "pass",
      "evidence": "quality gate: a golden-task eval is recorded for every served model"
    }
  ],
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
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across five sections.",
  "stamp": "LOCAL LLM SERVING SETUP\nsetup: production-cluster-alpha\nVERDICT: LOCAL_LLM_SERVING_SOUND\n  workload_and_memory_budget           pass\n  model_selection_and_provenance       pass\n  serving_stack_and_exposure           pass\n  performance_and_operations           pass\n  fallback_chains_and_evaluation       pass\n32 pass, 0 fail, 0 missing of 32 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

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
      "license_vetted_for_commercial_use": false,
      "performance_measured_at_realistic_context": true,
      "golden_task_eval_recorded": true
    }
  ],
  "serving": {
    "stack_fits_host_and_workload": true,
    "runs_daemonless_under_supervisor_with_auto_restart": true,
    "bound_to_loopback_only_verified": true,
    "remote_access_only_via_authenticated_tunnel": true,
    "unauthenticated_inference_port_exposure_present": true
  },
  "performance": {
    "tokens_per_second_and_ttft_measured_at_realistic_context": true,
    "offload_layers_and_parallelism_tuned": true,
    "vram_overcommit_present": true
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
    "silent_model_swaps_present": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "local-llm-serving-setup",
  "atom_version": "0.1.0",
  "setup": "production-cluster-alpha",
  "verdict": "LOCAL_LLM_SERVING_NOT_SOUND",
  "sections": {
    "workload_and_memory_budget": "pass",
    "model_selection_and_provenance": "fail",
    "serving_stack_and_exposure": "fail",
    "performance_and_operations": "fail",
    "fallback_chains_and_evaluation": "fail"
  },
  "checks": [
    {
      "section": "workload_and_memory_budget",
      "check": "tasks_defined",
      "status": "pass",
      "evidence": "workload first: the tasks the setup serves are defined before any budget is set"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "context_lengths_defined",
      "status": "pass",
      "evidence": "workload first: the context lengths served are defined"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "concurrency_defined",
      "status": "pass",
      "evidence": "workload first: the concurrency served is defined"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "compute_and_vram_ram_budget_computed",
      "status": "pass",
      "evidence": "workload first: compute and VRAM/RAM budget are computed from the declared tasks, context lengths and concurrency"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "kv_cache_growth_accounted_and_headroom_left",
      "status": "pass",
      "evidence": "workload first: KV-cache growth with context is accounted for and headroom is left"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "quantization_chosen_deliberately_with_tradeoffs",
      "status": "pass",
      "evidence": "workload first: quantization is chosen deliberately — Q4/Q5/Q8 trade-offs weighed — not by default"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "models_declared",
      "status": "pass",
      "evidence": "the declared record names its served models — the models list is present and non-empty"
    },
    {
      "section": "workload_and_memory_budget",
      "check": "every_model_vram_ram_and_context_budget_documented",
      "status": "pass",
      "evidence": "quality gate: VRAM/RAM + context budget are documented for each served model"
    },
    {
      "section": "model_selection_and_provenance",
      "check": "model_size_matched_to_task",
      "status": "pass",
      "evidence": "model selection: model size is matched to task — small for routing/summaries, larger for reasoning"
    },
    {
      "section": "model_selection_and_provenance",
      "check": "every_model_version_pinned_and_checksum_recorded",
      "status": "pass",
      "evidence": "model selection: every served model row pins its exact version and records its checksum (provenance)"
    },
    {
      "section": "model_selection_and_provenance",
      "check": "every_model_license_vetted_for_commercial_use",
      "status": "fail",
      "evidence": "red line: every served model row declares its license checked for commercial use before adoption — no unvetted model licenses"
    },
    {
      "section": "serving_stack_and_exposure",
      "check": "serving_stack_selected_to_fit_host_and_workload",
      "status": "pass",
      "evidence": "serving stack: the stack — llama.cpp server / Ollama / vLLM-class — is selected as it fits the host and workload"
    },
    {
      "section": "serving_stack_and_exposure",
      "check": "runs_daemonless_under_supervisor_with_auto_restart",
      "status": "pass",
      "evidence": "serving stack: the server runs daemonless under systemd (or a Windows service) with auto-restart"
    },
    {
      "section": "serving_stack_and_exposure",
      "check": "loopback_only_binding_verified",
      "status": "pass",
      "evidence": "quality gate: loopback-only binding is verified"
    },
    {
      "section": "serving_stack_and_exposure",
      "check": "remote_access_only_via_authenticated_tunnel",
      "status": "pass",
      "evidence": "serving stack: remote access is only via an authenticated tunnel"
    },
    {
      "section": "serving_stack_and_exposure",
      "check": "no_unauthenticated_inference_port_exposure",
      "status": "fail",
      "evidence": "red line: no unauthenticated exposure of inference ports is present"
    },
    {
      "section": "performance_and_operations",
      "check": "tokens_per_second_and_ttft_measured_at_realistic_context",
      "status": "pass",
      "evidence": "performance: tokens/s and time-to-first-token are measured at realistic context"
    },
    {
      "section": "performance_and_operations",
      "check": "offload_layers_and_parallelism_tuned",
      "status": "pass",
      "evidence": "performance: offload layers and parallelism are tuned"
    },
    {
      "section": "performance_and_operations",
      "check": "no_vram_overcommit",
      "status": "fail",
      "evidence": "performance: VRAM is not overcommitted — \"it loads\" is not \"it serves\""
    },
    {
      "section": "performance_and_operations",
      "check": "every_model_performance_measured_at_realistic_context",
      "status": "pass",
      "evidence": "performance: every served model row declares its performance measured at realistic context"
    },
    {
      "section": "performance_and_operations",
      "check": "health_endpoint_present",
      "status": "pass",
      "evidence": "operations: a health endpoint is present"
    },
    {
      "section": "performance_and_operations",
      "check": "structured_logs_present",
      "status": "pass",
      "evidence": "operations: structured logs are kept"
    },
    {
      "section": "performance_and_operations",
      "check": "model_catalog_pinned",
      "status": "pass",
      "evidence": "operations: the model catalog is pinned"
    },
    {
      "section": "performance_and_operations",
      "check": "disk_space_for_weights_monitored",
      "status": "pass",
      "evidence": "operations: disk space for weights is monitored"
    },
    {
      "section": "performance_and_operations",
      "check": "upgrade_path_backup_swap_verify_rollback_present",
      "status": "pass",
      "evidence": "operations: upgrades follow backup -> swap -> verify, with a rollback path"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "fallback_chain_declared_local_primary_secondary_provider",
      "status": "pass",
      "evidence": "fallback chains: the chain is declared — local primary -> local secondary -> declared provider"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "model_swaps_behind_stable_openai_compatible_api",
      "status": "pass",
      "evidence": "fallback chains: models swap behind a stable API (OpenAI-compatible surface) so apps never change"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "fallback_chain_tested_by_failing_primary_deliberately",
      "status": "pass",
      "evidence": "quality gate: the fallback chain is tested — each failover is tested deliberately, the primary failed on purpose"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "golden_task_suite_run_per_model_change",
      "status": "pass",
      "evidence": "evaluation: a golden task suite is run per model change"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "quality_and_speed_recorded_before_promotion",
      "status": "pass",
      "evidence": "evaluation: quality and speed are recorded before promotion"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "no_silent_model_swaps",
      "status": "fail",
      "evidence": "red line: no silent model swaps in production are present"
    },
    {
      "section": "fallback_chains_and_evaluation",
      "check": "every_model_golden_task_eval_recorded",
      "status": "pass",
      "evidence": "quality gate: a golden-task eval is recorded for every served model"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "models_count": 1,
  "models_without_budget_documentation": [],
  "budget_coverage": "1.000000",
  "models_without_pinned_version_and_checksum": [],
  "models_without_vetted_license": [
    "llama-3-8b"
  ],
  "models_without_performance_measurement": [],
  "performance_coverage": "1.000000",
  "models_without_golden_task_eval": [],
  "golden_eval_coverage": "1.000000",
  "summary": "28 pass, 4 fail, 0 missing of 32 checks across five sections.",
  "stamp": "LOCAL LLM SERVING SETUP\nsetup: production-cluster-alpha\nVERDICT: LOCAL_LLM_SERVING_NOT_SOUND\n  workload_and_memory_budget           pass\n  model_selection_and_provenance       fail\n  serving_stack_and_exposure           fail\n  performance_and_operations           fail\n  fallback_chains_and_evaluation       fail\n28 pass, 4 fail, 0 missing of 32 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "setup": "production-cluster-alpha",
  "workload": "should_be_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "workload",
  "detail": "workload must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared local-LLM serving setup record; its verdict is a completeness and consistency judgment on the declared evidence, not compliance or audit evidence and not a security certification, and a local LLM serving setup record is not itself a compliance determination. |
| Checks named | 32 documented / 32 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses |
| Input reference typed | Yes — 42 fields, each with its type from SERVICE.md, except the 8 container/row-object types grounded in the recorded evidence and marked "evidence" |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/local-llm-serving-setup/evidence.json` |
