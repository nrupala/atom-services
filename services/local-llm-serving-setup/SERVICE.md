# Local llm serving setup — `local-llm-serving-setup`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Run local LLMs in production — model/quant choice, serving stacks, VRAM budgets, fallback chains, evaluation.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in How Milo works who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Fleet local model serving operations**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the local-LLM-serving-setup manifest

The caller submits one JSON manifest: a declared local-LLM
serving setup record for one setup. Every field below is read by
the named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`LOCAL_LLM_SERVING_NOT_SOUND`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `setup` (string; carried into the verdict output, not itself checked) | — |
| `workload.tasks_defined` (boolean) | workload_and_memory_budget |
| `workload.context_lengths_defined` (boolean) | workload_and_memory_budget |
| `workload.concurrency_defined` (boolean) | workload_and_memory_budget |
| `workload.compute_and_vram_ram_budget_computed` (boolean) | workload_and_memory_budget |
| `workload.kv_cache_growth_accounted_and_headroom_left` (boolean) | workload_and_memory_budget |
| `workload.quantization_chosen_deliberately_with_tradeoffs` (boolean) | workload_and_memory_budget |
| `model_selection.model_size_matched_to_task` (boolean) | model_selection_and_provenance |
| `models` (list of model-row objects, each with the entry fields below; computed, see below) | workload_and_memory_budget, model_selection_and_provenance, performance_and_operations, fallback_chains_and_evaluation |
| `models[].name` (string; names the row in the computed outputs) | workload_and_memory_budget, model_selection_and_provenance, performance_and_operations, fallback_chains_and_evaluation |
| `models[].vram_ram_and_context_budget_documented` (boolean) | workload_and_memory_budget |
| `models[].version_pinned_and_checksum_recorded` (boolean) | model_selection_and_provenance |
| `models[].license_vetted_for_commercial_use` (boolean; must be `true` per row — skill red line: no unvetted model licenses) | model_selection_and_provenance |
| `models[].performance_measured_at_realistic_context` (boolean) | performance_and_operations |
| `models[].golden_task_eval_recorded` (boolean) | fallback_chains_and_evaluation |
| `serving.stack_fits_host_and_workload` (boolean) | serving_stack_and_exposure |
| `serving.runs_daemonless_under_supervisor_with_auto_restart` (boolean) | serving_stack_and_exposure |
| `serving.bound_to_loopback_only_verified` (boolean) | serving_stack_and_exposure |
| `serving.remote_access_only_via_authenticated_tunnel` (boolean) | serving_stack_and_exposure |
| `serving.unauthenticated_inference_port_exposure_present` (boolean; must be `false` to pass — skill red line) | serving_stack_and_exposure |
| `performance.tokens_per_second_and_ttft_measured_at_realistic_context` (boolean) | performance_and_operations |
| `performance.offload_layers_and_parallelism_tuned` (boolean) | performance_and_operations |
| `performance.vram_overcommit_present` (boolean; must be `false` to pass — the skill: don't overcommit VRAM) | performance_and_operations |
| `operations.health_endpoint_present` (boolean) | performance_and_operations |
| `operations.structured_logs_present` (boolean) | performance_and_operations |
| `operations.model_catalog_pinned` (boolean) | performance_and_operations |
| `operations.disk_space_for_weights_monitored` (boolean) | performance_and_operations |
| `operations.upgrade_path_backup_swap_verify_rollback_present` (boolean) | performance_and_operations |
| `fallback.fallback_chain_declared_local_primary_secondary_provider` (boolean) | fallback_chains_and_evaluation |
| `fallback.model_swaps_behind_stable_openai_compatible_api` (boolean) | fallback_chains_and_evaluation |
| `fallback.each_failover_tested_deliberately_including_primary_failure` (boolean) | fallback_chains_and_evaluation |
| `evaluation.golden_task_suite_run_per_model_change` (boolean) | fallback_chains_and_evaluation |
| `evaluation.quality_and_speed_recorded_before_promotion` (boolean) | fallback_chains_and_evaluation |
| `evaluation.silent_model_swaps_present` (boolean; must be `false` to pass — skill red line: no silent model swaps) | fallback_chains_and_evaluation |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Models declared:** the declared `models` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Budget per model:** every declared model row must declare
  `vram_ram_and_context_budget_documented: true` (the skill's
  quality gate: "VRAM/RAM + context budget documented for each
  served model"). A row with the field absent is missing
  evidence.
- **Provenance per model:** every declared model row must
  declare `version_pinned_and_checksum_recorded: true` (the
  skill: "pin exact versions + checksums (provenance)").
- **License per model:** every declared model row must declare
  `license_vetted_for_commercial_use: true` (the skill: "check
  licenses for commercial use before adopting"; red line: "no
  unvetted model licenses").
- **Performance per model:** every declared model row must
  declare `performance_measured_at_realistic_context: true`
  (the skill: "measure tokens/s + time-to-first-token at
  realistic context").
- **Golden-task eval per model:** every declared model row must
  declare `golden_task_eval_recorded: true` (the skill's quality
  gate: "Golden-task evals recorded per model change").

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the six primary computed checks above cannot be completed),
`models_count` (the declared list length, or null when the list
is not declared — counts are reported as integers, exactly), the
row-name lists `models_without_budget_documentation`,
`models_without_pinned_version_and_checksum`,
`models_without_vetted_license`,
`models_without_performance_measurement` and
`models_without_golden_task_eval` (models whose field is present
but not true; a model with the field absent is missing evidence
and does not appear), and the three coverage ratios
`budget_coverage` (models with documented VRAM/RAM + context
budget ÷ declared models), `performance_coverage` (models with
performance measured at realistic context ÷ declared models) and
`golden_eval_coverage` (models with a golden-task eval recorded
÷ declared models).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric pass/fail threshold — its budgets,
measurements and evals are record content the setup attests to,
not bars the atom can set. Quantities are computed and reported;
the only bar on the computed rows is completeness over the
caller's own declared rows, exactly as stated above. Declined
thresholds, named: a minimum tokens-per-second rate or a maximum
time-to-first-token in milliseconds (the skill requires both be
measured at realistic context but states no number); a VRAM or
RAM budget cap or floor in gigabytes (the skill's mention of
16GB-class cards names a hardware class it works on, not a cap,
and is not treated as one); a minimum or maximum context length
in tokens; a concurrency count; a mandated quantization level
(the skill names Q4/Q5/Q8 as trade-offs to weigh deliberately,
never one level to use); a KV-cache headroom percentage or
gigabyte figure (the skill says "leave headroom", no amount); a
number of offload layers or a parallelism degree; a free
disk-space floor for weights; a health-endpoint uptime
percentage; a golden-task evaluation score, pass rate or number
of tasks; a number of fallback tiers beyond the declared chain
shape (local primary → local secondary → declared provider); a
coverage percentage below completeness.

The verdict is one of `LOCAL_LLM_SERVING_SOUND` (all 32 checks
pass), `LOCAL_LLM_SERVING_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across five sections: workload_and_memory_budget,
model_selection_and_provenance, serving_stack_and_exposure,
performance_and_operations, fallback_chains_and_evaluation.

## Distinct ground

Staged and live sibling atoms touch neighbouring ground; this
atom's boundary with each is named, and no check is shared:

- **`agent-evaluation-scorecard`** audits agent task suites,
  judging and regression gates themselves — it scores
  evaluations. This atom never scores a task or a judge; its
  only evaluation checks are that a golden-task suite is run per
  model change and that an eval is recorded for every served
  model in this serving record.
- **`network-exposure-audit`** audits a whole network surface —
  segmentation, TLS, DNS/email authentication, edge access and
  egress. This atom makes no network-wide claim; its only
  exposure checks are the three declared serving-stack facts:
  loopback-only binding verified, remote access only via an
  authenticated tunnel, and no unauthenticated exposure of the
  inference ports of this setup.
- **`rag-retrieval-evaluation-tuning`** tunes retrieval quality
  for a RAG pipeline. This atom has no retrieval surface at all:
  it audits the serving record of the models themselves.

## Honest scoping

This atom audits a **declared** local-LLM serving setup record —
it provisions no stack, loads no model, runs no benchmark, probes
no port, and does not verify that a declared control actually
works. A setup is sound *on the caller's declared evidence*: a
manifest that declares loopback-only binding verified, licenses
vetted, and fallback tested passes those checks even if the real
setup does none of it. It is a completeness and consistency audit
of the record the skill requires, **not a serving service, a
benchmark, or a security certification**: it never judges whether
a chosen model or quantization is actually right for a task,
whether a measured tokens/s figure is good, whether a license is
actually sufficient for a caller's use, or whether a fallback
chain would really hold — only that the record contains what the
skill's method, quality gates and red lines demand, and that its
declared rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds beyond
the skill's own stated rules (see the declined list above); no
live verification of any declared fact; no inspection of actual
model files, checksums, licenses, configurations or logs — every
such fact is a caller-declared flag; model, stack and
quantization suitability for a workload is a caller declaration —
the atom checks only that the choice is declared deliberate and
matched, never that it is optimal; evaluation quality (whether a
golden task suite is well designed or its scores are good) is a
caller declaration — only its recorded presence per model change
is checked.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Fleet-tied; method is general
