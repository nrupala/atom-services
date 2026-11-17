# Production Python engineering pack expert — documentation

**Production Python engineering pack expert** · slug `production-python-engineering-pack-expert` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/production-python-engineering-pack-expert/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 9595ea665b634289aad158b7fff277ac). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "expert-system-core"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "production-python-engineering-pack-expert"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the expert Python engineering record manifest.** You declare a record of an expert-level Python project — strict typing, profiling before optimizing, structured concurrency, and the expert anti-patterns refused — the atom audits the declared record, it does not run the code or inspect the repository (see Explanation). The recorded full-pass manifest declares the project `expert-system-core`: type hints covering all functions, strict type-checker mode where feasible, and types as executable documentation; structured data modelled with dataclasses or pydantic, pathlib over os.path, f-strings, context managers, enumerate/zip over manual indexing, and comprehensions over manual loops; a venv + pip + PYTHONPATH environment, pyproject.toml declaring the project, pinned requirements, a reproducible environment without containers, src layout, clear module boundaries, no circular imports, and main guards on entry modules; asyncio for async paths, TaskGroup structured concurrency, no blocking calls in async paths, blocking work offloaded to a thread or process pool, and async HTTP via httpx or aiohttp; profiling before optimizing with cProfile or py-spy tooling, numpy vectorization where data-parallel, and cold code left un-micro-optimized, with one hot path `matrix_multiply` profiled before optimizing and naming the route `numpy_vectorization`; FastAPI for typed services, pydantic contracts on API boundaries, an API health endpoint, a CLI built with argparse or typer with sane exit codes and pipe-friendly output; pytest fixtures and parametrize, hypothesis property tests on core logic, coverage measured on the critical path, ruff lint and format, mypy as a tooling gate, pre-commit hooks, and failures loud in development; and all five red-line flags `false` (no untyped sprawling script, no mutable default arguments, no bare except, no hidden global state, no Docker used to paper over a venv problem).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/production-python-engineering-pack-expert` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY`: "48 pass, 0 fail, 0 missing of 48 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `hot_paths_count` is 1, `profiled_first_coverage` and `skill_route_coverage` are both `"1.000000"`, and all three name lists are empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "production-python-engineering-pack-expert"}`.
3. Call: `POST https://atoms.pipavia.com/v1/production-python-engineering-pack-expert` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/production-python-engineering-pack-expert` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `production_python_engineering_pack_expert`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `expert_every_hot_path_profiled_before_optimizing`, `expert_every_hot_path_uses_skill_named_acceleration_route`, `expert_no_bare_except_clauses`, `expert_no_untyped_sprawling_scripts`, and the summary reads "44 pass, 4 fail, 0 missing of 48 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `hot_paths_not_profiled_first` and `hot_paths_with_non_skill_route` both name `matrix_multiply` — that row declares `profiled_before_optimizing_expert: false` and `acceleration_route_expert: "invalid_route"` — `profiled_first_coverage` and `skill_route_coverage` are both `"0.000000"`, `red_lines.untyped_sprawling_script_present` is declared `true`, failing `expert_no_untyped_sprawling_scripts`, and `red_lines.bare_except_present` is declared `true`, failing `expert_no_bare_except_clauses`; sections `expert_performance_and_profiling` and `red_lines` report `fail`, the other five `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "expert_typing",
  "detail": "expert_typing must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/production-python-engineering-pack-expert` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/production-python-engineering-pack-expert` — tool name `production_python_engineering_pack_expert`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `production_python_engineering_pack_expert` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `project` and the `hot_paths[]` string fields are noted as strings and `hot_paths` as a list there. Where SERVICE.md states no type — the section container objects (`expert_typing`, `expert_idioms`, `expert_packaging`, `expert_async`, `expert_performance`, `expert_surfaces`, `expert_testing`, `red_lines`) and a `hot_paths[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and `hot_paths`, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `hot_paths` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: expert_typing_and_idiomatic_style

| Field | Type | Notes |
|---|---|---|
| `expert_typing` | object | The expert-typing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `expert_typing.type_hints_cover_all_functions_expert` | boolean | — |
| `expert_typing.strict_type_checker_mode_where_feasible_expert` | boolean | — |
| `expert_typing.types_used_as_executable_documentation_expert` | boolean | — |
| `expert_idioms` | object | The expert-idioms section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `expert_idioms.structured_data_modelled_with_dataclasses_or_pydantic_expert` | boolean | — |
| `expert_idioms.pathlib_preferred_over_os_path_expert` | boolean | — |
| `expert_idioms.f_strings_used_for_formatting_expert` | boolean | — |
| `expert_idioms.context_managers_used_for_resources_expert` | boolean | — |
| `expert_idioms.enumerate_and_zip_used_over_manual_indexing_expert` | boolean | — |
| `expert_idioms.comprehensions_preferred_over_manual_loops_expert` | boolean | — |

#### Read by: expert_packaging_and_module_boundaries

| Field | Type | Notes |
|---|---|---|
| `expert_packaging` | object | The expert-packaging section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `expert_packaging.venv_pip_pythonpath_environment_declared_expert` | boolean | — |
| `expert_packaging.pyproject_toml_declares_project_expert` | boolean | — |
| `expert_packaging.requirements_pinned_expert` | boolean | — |
| `expert_packaging.reproducible_environment_without_containers_expert` | boolean | — |
| `expert_packaging.src_layout_used_expert` | boolean | — |
| `expert_packaging.clear_module_boundaries_declared_expert` | boolean | — |
| `expert_packaging.no_circular_imports_declared_expert` | boolean | — |
| `expert_packaging.main_guard_on_entry_modules_expert` | boolean | — |

#### Read by: expert_async_concurrency

| Field | Type | Notes |
|---|---|---|
| `expert_async` | object | The expert-async section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `expert_async.asyncio_used_for_async_paths_expert` | boolean | — |
| `expert_async.taskgroup_structured_concurrency_used_expert` | boolean | — |
| `expert_async.no_blocking_calls_in_async_paths_expert` | boolean | — |
| `expert_async.blocking_work_offloaded_to_thread_or_process_pool_expert` | boolean | — |
| `expert_async.async_http_via_httpx_or_aiohttp_expert` | boolean | — |

#### Read by: expert_performance_and_profiling

| Field | Type | Notes |
|---|---|---|
| `expert_performance` | object | The expert-performance section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `expert_performance.profiling_before_optimizing_declared_expert` | boolean | — |
| `expert_performance.profiler_tooling_cprofile_or_py_spy_declared_expert` | boolean | — |
| `expert_performance.numpy_vectorization_applied_where_data_parallel_expert` | boolean | — |
| `expert_performance.cold_code_left_un_micro_optimized_expert` | boolean | — |
| `hot_paths` | list | list of hot-path-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `hot_paths[]` | object | One declared hot-path row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `hot_paths[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `hot_paths[].profiled_before_optimizing_expert` | boolean | must be `true` per row — profile before optimizing (type stated in SERVICE.md) |
| `hot_paths[].acceleration_route_expert` | string | must be one of the skill-named routes `rust_pyo3`, `c_extension`, `numpy_vectorization` per row (type stated in SERVICE.md) |

#### Read by: expert_api_and_cli_surfaces

| Field | Type | Notes |
|---|---|---|
| `expert_surfaces` | object | The expert-surfaces section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `expert_surfaces.fastapi_used_for_typed_services_expert` | boolean | — |
| `expert_surfaces.pydantic_contracts_on_api_boundaries_expert` | boolean | — |
| `expert_surfaces.api_health_endpoint_provided_expert` | boolean | — |
| `expert_surfaces.cli_built_with_argparse_or_typer_expert` | boolean | — |
| `expert_surfaces.cli_sane_exit_codes_declared_expert` | boolean | — |
| `expert_surfaces.cli_pipe_friendly_output_declared_expert` | boolean | — |

#### Read by: expert_testing_and_tooling

| Field | Type | Notes |
|---|---|---|
| `expert_testing` | object | The expert-testing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `expert_testing.pytest_fixtures_and_parametrize_used_expert` | boolean | — |
| `expert_testing.hypothesis_property_tests_on_core_logic_expert` | boolean | — |
| `expert_testing.coverage_measured_on_critical_path_expert` | boolean | — |
| `expert_testing.ruff_lint_and_format_applied_expert` | boolean | — |
| `expert_testing.mypy_run_as_tooling_gate_expert` | boolean | — |
| `expert_testing.pre_commit_hooks_configured_expert` | boolean | — |
| `expert_testing.failures_loud_in_development_expert` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.untyped_sprawling_script_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.mutable_default_arguments_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.bare_except_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.hidden_global_state_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.docker_used_to_paper_over_venv_problem_present` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

All 48 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: expert_typing_and_idiomatic_style

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `expert_type_hints_cover_all_functions` | expert typing: type hints everywhere — all functions are hinted, not only public ones | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_strict_type_checker_mode_where_feasible` | expert typing: mypy/pyright runs strict where feasible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_types_used_as_executable_documentation` | expert typing: types are treated as executable documentation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_structured_data_via_dataclasses_or_pydantic` | expert idioms: structured data is modelled with dataclasses / pydantic | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_pathlib_preferred_over_os_path` | expert idioms: pathlib is used over os.path | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_f_strings_used_for_formatting` | expert idioms: f-strings are used for formatting | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_context_managers_used_for_resources` | expert idioms: context managers are used for resources | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_enumerate_and_zip_over_manual_indexing` | expert idioms: enumerate/zip are used over manual indexing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_comprehensions_preferred_over_manual_loops` | expert idioms: comprehensions are preferred over manual loops | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: expert_packaging_and_module_boundaries

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `expert_venv_pip_pythonpath_environment_declared` | expert packaging: the environment is venv + pip + PYTHONPATH | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_pyproject_toml_declares_project` | expert packaging: pyproject.toml declares the project | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_requirements_pinned` | expert packaging: requirements are pinned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_reproducible_environment_without_containers` | expert packaging: the environment is reproducible without containers | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_src_layout_used` | expert packaging: src/ layout is used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_clear_module_boundaries_declared` | expert packaging: module boundaries are clear | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_no_circular_imports_declared` | expert packaging: no circular imports | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_main_guard_on_entry_modules` | expert packaging: entry modules carry if __name__ == "__main__": guards | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: expert_async_concurrency

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `expert_asyncio_used_for_async_paths` | expert async: asyncio is used for async paths | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_taskgroup_structured_concurrency_used` | expert async: structured concurrency with TaskGroup is used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_no_blocking_calls_in_async_paths` | expert async: no blocking code is called in an async path | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_blocking_work_offloaded_to_thread_or_process_pool` | expert async: blocking work is pushed to a thread/process pool | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_async_http_via_httpx_or_aiohttp` | expert async: httpx/aiohttp are used for async IO | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: expert_performance_and_profiling

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `expert_profiling_before_optimizing_declared` | expert performance: profiling happens before optimizing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_profiler_tooling_cprofile_or_py_spy_declared` | expert performance: the profiler is cProfile or py-spy | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_numpy_vectorization_where_data_parallel` | expert performance: data-parallel work is vectorized with numpy | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_cold_code_left_un_micro_optimized` | expert performance: cold code is not micro-optimized | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_hot_paths_declared` | the declared record names its hot paths — the hot_paths list is present; an empty list declares that the record has no hot paths | Computed over the declared record. Pass: the `hot_paths` list is present — an empty list passes, because it declares that the record has no hot paths. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `expert_every_hot_path_profiled_before_optimizing` | expert performance: every declared hot path was profiled before optimizing | Computed over the declared record. Pass: every declared hot-path row declares `profiled_before_optimizing_expert` `true` — on an empty list the check passes vacuously. Fail: a row declares the field present but not `true` (offending rows are named in `hot_paths_not_profiled_first`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `hot_paths_not_profiled_first`). |
| `expert_every_hot_path_uses_skill_named_acceleration_route` | expert performance: every declared hot path names a skill-named acceleration route — rust_pyo3, c_extension or numpy_vectorization | Computed over the declared record. Pass: every declared hot-path row declares `acceleration_route_expert` as exactly one of `rust_pyo3`, `c_extension` or `numpy_vectorization` — on an empty list the check passes vacuously. Fail: a row declares the field present but not one of those three routes, including an empty string (offending rows are named in `hot_paths_with_non_skill_route`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `hot_paths_with_non_skill_route`). |
| `expert_no_hot_path_name_duplicated` | expert performance: no declared hot-path name is owned by more than one hot-path row | Computed over the declared record. Pass: no declared `name` string appears on more than one hot-path row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_hot_path_names`). Missing: the list is absent, or a row has `name` absent (such a row is missing evidence for this check). |

#### Section: expert_api_and_cli_surfaces

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `expert_fastapi_used_for_typed_services` | expert surfaces: FastAPI is used for typed services | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_pydantic_contracts_on_api_boundaries` | expert surfaces: APIs carry pydantic contracts | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_api_health_endpoint_provided` | expert surfaces: an /api/health endpoint is provided | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_cli_built_with_argparse_or_typer` | expert surfaces: CLIs are built with argparse/typer | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_cli_sane_exit_codes_declared` | expert surfaces: CLIs use sane exit codes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_cli_pipe_friendly_output_declared` | expert surfaces: CLI output is pipe-friendly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: expert_testing_and_tooling

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `expert_pytest_fixtures_and_parametrize_used` | expert testing: pytest is used with fixtures and parametrize | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_hypothesis_property_tests_on_core_logic` | expert testing: hypothesis property-based tests cover core logic | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_coverage_measured_on_critical_path` | expert testing: coverage is measured on the critical path | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_ruff_lint_and_format_applied` | expert tooling: ruff (lint + format) is applied | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_mypy_run_as_tooling_gate` | expert tooling: mypy is run as a tooling gate | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_pre_commit_hooks_configured` | expert tooling: pre-commit hooks are configured | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expert_failures_loud_in_development` | expert tooling: failures are loud in development | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `expert_no_untyped_sprawling_scripts` | red line: no untyped sprawling scripts are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `expert_no_mutable_default_arguments` | red line: no mutable default arguments are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `expert_no_bare_except_clauses` | red line: no bare except: clauses are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `expert_no_hidden_global_state` | red line: no hidden global state is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `expert_no_docker_substitute_for_venv_fix` | red line: Docker is not reached for to paper over an environment problem that venv solves | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"production-python-engineering-pack-expert"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `hot_paths_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `hot_paths_not_profiled_first` (hot paths whose profiling field is present but not true; a hot path with the field absent is missing evidence and does not appear) and `hot_paths_with_non_skill_route` (hot paths whose route field is present but is not one of the three skill-named routes) and the name list `duplicate_hot_path_names` (hot-path names declared on more than one row, in the order their second occurrence appears) — all three lists are null when the `hot_paths` list is not declared, as recorded in the sparse case; and the ratios `profiled_first_coverage` (hot paths profiled first ÷ declared hot paths) and `skill_route_coverage` (hot paths naming a skill route ÷ declared hot paths) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "48 pass, 0 fail, 0 missing of 48 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY` — all 48 checks pass: the declared expert Python engineering record is complete and consistent with the bound skill's checklist and red lines.
- `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the four primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `hot_paths_count`, `hot_paths_not_profiled_first`, `hot_paths_with_non_skill_route`, `duplicate_hot_path_names`, `profiled_first_coverage`, `skill_route_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"expert_typing","detail":"expert_typing must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Write Python that a stranger can read, type-check, and trust — modern, typed, readable Python, at the expert level: strict typing, profiling before optimizing, structured concurrency, and the expert anti-patterns refused (the bound capability, from the skill). You submit one declared record — the expert Python engineering record manifest for one project — and the atom audits that record for completeness and internal consistency against the bound skill's checklist and red lines, returning one deterministic verdict across 7 sections (`expert_typing_and_idiomatic_style`, `expert_packaging_and_module_boundaries`, `expert_async_concurrency`, `expert_performance_and_profiling`, `expert_api_and_cli_surfaces`, `expert_testing_and_tooling`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `hot_paths` list must be present (an empty list passes: it declares that the record has no hot paths, and the skill requires no hot path), every hot-path row must declare `profiled_before_optimizing_expert` true, every row must name an `acceleration_route_expert` that is exactly one of the skill-named routes `rust_pyo3`, `c_extension` or `numpy_vectorization`, and no declared `name` may appear on more than one hot-path row — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states **no numeric threshold at all** — its demands are qualitative declarations the record makes, not bars the atom can set. Declined, named: a type-hint coverage percentage or a count of untyped functions; a strictness level beyond the skill's "strict where feasible" declaration; a profiling duration, sample count, or required speedup factor before a hot path counts as optimized; a numpy/Rust/C performance gain percentage; a coverage percentage for the critical path (the skill says coverage is measured there, never a number); a number of hypothesis examples or property tests; a number of pre-commit hooks or ruff/mypy findings tolerated; a response-time or throughput figure for the FastAPI surface or its `/api/health` endpoint; specific exit-code values beyond CLIs declaring sane exit codes; a Python, mypy/pyright, ruff, or dependency version number (only that requirements are pinned is checked); a module count, file size, or circular-import count beyond the declaration that boundaries are clear and no circular imports exist. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** expert Python engineering record — it runs no code, type checker, profiler, linter, or test suite, inspects no repository, and does not verify that a declared practice was ever carried out. A record is ready *on the caller's declared evidence*: a record that declares strict typing, profiled-first hot paths, and no bare excepts passes those checks even if the real project did none of it. It is a completeness and consistency audit of the record the skill requires, **not a code review, a profiling service, a performance guarantee, or a judgment that the code is good**: it never judges whether a named hot path is really hot, whether the declared profiler output justified the route chosen, whether the strict typing is genuinely feasible further, or whether the design is sound — only that the record contains what the skill's method and refused anti-patterns demand, and that its declared hot-path rows are internally consistent. Named exclusions: no numeric thresholds at all (see the declined list above); no live verification of any declared fact; no judgment of code *quality* — whether the typing, concurrency design, or optimizations are adequate for the real project is the caller's declaration, checked only for declared presence and consistency; the skill's named tools (mypy/pyright, ruff, cProfile, py-spy, hypothesis, FastAPI, httpx/aiohttp, argparse/typer) are checked only as the declarations the skill states — this atom runs none of them and takes no position on their current versions or configuration.

**Distinct ground vs the base sibling.** As SERVICE.md states it, the nearest sibling is the base `production-python-engineering-pack`, built in parallel from the `python-engineering` skill — the production basics. This atom is built **only** from the `python-expert` skill's distinct advanced material, and every manifest field and check name is named for that material so the two packs cannot collide: type hints on **all** functions (not only public ones) with **strict** mypy/pyright where feasible and types as executable documentation; enumerate/zip and comprehensions over manual loops; packaging with venv + pip + **PYTHONPATH**, pinned **requirements**, reproducible **without containers**, **src/ layout**, clear module boundaries, **no circular imports**, `__main__` guards; **TaskGroup** structured concurrency with blocking work pushed to a **thread/process pool** and **httpx/aiohttp** async IO; **profiling before optimizing** with **cProfile/py-spy**, **numpy vectorization**, hot loops pushed to **Rust (pyo3) or C**, cold code never micro-optimized; **FastAPI** with an **`/api/health`** endpoint, **argparse/typer** CLIs with sane exit codes and pipe-friendly output; **hypothesis** property-based tests on core logic, coverage on the critical path, **pre-commit**; and the expert anti-patterns the base skill does not carry — untyped sprawling scripts, hidden global state, and Docker reached for to paper over a venv problem. Zero shared check names across the pair was verified mechanically at authoring time, as SERVICE.md states, and this atom's recorded checks all carry the `expert_` prefix pattern. SERVICE.md also states the boundary with `c-engineering-review` and `cpp-engineering-review`: those review C/C++ code, while this atom audits a declared expert-Python record.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Product services and automation builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared expert Python engineering record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly (U-13 regulatory screen) that its output could not read as regulated professional advice, that it offers no engineering-practice (APEGA), securities/financial, medical, psychological, or legal advice. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `production_python_engineering_pack_expert` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/production_python_engineering_pack_expert.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_production_python_engineering_pack_expert.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/production-python-engineering-pack-expert` (REST) and `POST /mcp/production-python-engineering-pack-expert` (MCP, tool `production_python_engineering_pack_expert`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 9595ea665b634289aad158b7fff277ac). Key scope: `production_python_engineering_pack_expert`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names. Recorded check names carry the `expert_` prefix, drop the trailing `_expert` of the input leaf names, and several are paraphrased. Examples used verbatim in the Checks section include `expert_structured_data_via_dataclasses_or_pydantic` (input `expert_idioms.structured_data_modelled_with_dataclasses_or_pydantic_expert`), `expert_enumerate_and_zip_over_manual_indexing` (input `expert_idioms.enumerate_and_zip_used_over_manual_indexing_expert`) and `expert_numpy_vectorization_where_data_parallel` (input `expert_performance.numpy_vectorization_applied_where_data_parallel_expert`), plus the red-line checks `expert_no_untyped_sprawling_scripts` (input `red_lines.untyped_sprawling_script_present`), `expert_no_mutable_default_arguments` (input `red_lines.mutable_default_arguments_present`), `expert_no_bare_except_clauses` (input `red_lines.bare_except_present`), `expert_no_hidden_global_state` (input `red_lines.hidden_global_state_present`) and `expert_no_docker_substitute_for_venv_fix` (input `red_lines.docker_used_to_paper_over_venv_problem_present`), and the computed checks `expert_hot_paths_declared`, `expert_every_hot_path_profiled_before_optimizing`, `expert_every_hot_path_uses_skill_named_acceleration_route` and `expert_no_hot_path_name_duplicated`, which read the `hot_paths` rows rather than any single input field.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`expert_typing`, `expert_idioms`, `expert_packaging`, `expert_async`, `expert_performance`, `expert_surfaces`, `expert_testing`, `red_lines`) or for a `hot_paths[]` row object. The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and `hot_paths`, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 48 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `expert_typing` and `expert_idioms` inputs are read by the single recorded section `expert_typing_and_idiomatic_style`, and `expert_performance` and the top-level `hot_paths` list are read by the single recorded section `expert_performance_and_profiling`. Other recorded section names also differ from the input object they read (`expert_surfaces` is read by `expert_api_and_cli_surfaces`, and `expert_testing` by `expert_testing_and_tooling`). This document groups the Input reference and the Checks by the recorded section names.
6. **Null lists on an undeclared `hot_paths` list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `hot_paths_count` and the coverage ratios, but does not state a null rule for the two row-name lists or the duplicate-name list. The recorded sparse response returns all three lists as `null` when `hot_paths` is not declared (as USER-GUIDE.md also states); this document follows the recording.
7. **Case-design prose divergences in corrections.json:** the original case design in `corrections.json` diverged from the recorded executions in five places, all corrected at design time before execution and not scored against the atom — (R1, ×2) the violations `failing_checks` named the section names `red_lines` and `expert_performance_and_profiling` instead of exact check names; (R2, ×2) the full-pass and violations `expect` blocks carried no structured `computed_spot_checks`, the computed quantities appearing only in prose notes; (R3, ×1) the violations input was missing key paths present in the full-pass manifest. The corrected, executed `cases.json` inputs and expects were compared with the recorded executions in evidence.json and match them (inputs and expects identical, and the case notes describe the same planted violations, sparse identity-only manifest and `expert_typing` type violation that the recorded responses show); where the original design prose differed, the responses govern.

## Worked examples

Provenance: recorded 2026-11-16T09:45:39.334333+00:00 against gateway v1.1.0, external verification lane, source `verification/work/production-python-engineering-pack-expert/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T09:45:39.334333+00:00 · gateway v1.1.0 · source `verification/work/production-python-engineering-pack-expert/evidence.json`.

Input:

```json
{
  "project": "expert-system-core",
  "expert_typing": {
    "type_hints_cover_all_functions_expert": true,
    "strict_type_checker_mode_where_feasible_expert": true,
    "types_used_as_executable_documentation_expert": true
  },
  "expert_idioms": {
    "structured_data_modelled_with_dataclasses_or_pydantic_expert": true,
    "pathlib_preferred_over_os_path_expert": true,
    "f_strings_used_for_formatting_expert": true,
    "context_managers_used_for_resources_expert": true,
    "enumerate_and_zip_used_over_manual_indexing_expert": true,
    "comprehensions_preferred_over_manual_loops_expert": true
  },
  "expert_packaging": {
    "venv_pip_pythonpath_environment_declared_expert": true,
    "pyproject_toml_declares_project_expert": true,
    "requirements_pinned_expert": true,
    "reproducible_environment_without_containers_expert": true,
    "src_layout_used_expert": true,
    "clear_module_boundaries_declared_expert": true,
    "no_circular_imports_declared_expert": true,
    "main_guard_on_entry_modules_expert": true
  },
  "expert_async": {
    "asyncio_used_for_async_paths_expert": true,
    "taskgroup_structured_concurrency_used_expert": true,
    "no_blocking_calls_in_async_paths_expert": true,
    "blocking_work_offloaded_to_thread_or_process_pool_expert": true,
    "async_http_via_httpx_or_aiohttp_expert": true
  },
  "expert_performance": {
    "profiling_before_optimizing_declared_expert": true,
    "profiler_tooling_cprofile_or_py_spy_declared_expert": true,
    "numpy_vectorization_applied_where_data_parallel_expert": true,
    "cold_code_left_un_micro_optimized_expert": true
  },
  "hot_paths": [
    {
      "name": "matrix_multiply",
      "profiled_before_optimizing_expert": true,
      "acceleration_route_expert": "numpy_vectorization"
    }
  ],
  "expert_surfaces": {
    "fastapi_used_for_typed_services_expert": true,
    "pydantic_contracts_on_api_boundaries_expert": true,
    "api_health_endpoint_provided_expert": true,
    "cli_built_with_argparse_or_typer_expert": true,
    "cli_sane_exit_codes_declared_expert": true,
    "cli_pipe_friendly_output_declared_expert": true
  },
  "expert_testing": {
    "pytest_fixtures_and_parametrize_used_expert": true,
    "hypothesis_property_tests_on_core_logic_expert": true,
    "coverage_measured_on_critical_path_expert": true,
    "ruff_lint_and_format_applied_expert": true,
    "mypy_run_as_tooling_gate_expert": true,
    "pre_commit_hooks_configured_expert": true,
    "failures_loud_in_development_expert": true
  },
  "red_lines": {
    "untyped_sprawling_script_present": false,
    "mutable_default_arguments_present": false,
    "bare_except_present": false,
    "hidden_global_state_present": false,
    "docker_used_to_paper_over_venv_problem_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "production-python-engineering-pack-expert",
  "atom_version": "0.1.0",
  "project": "expert-system-core",
  "verdict": "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY",
  "sections": {
    "expert_typing_and_idiomatic_style": "pass",
    "expert_packaging_and_module_boundaries": "pass",
    "expert_async_concurrency": "pass",
    "expert_performance_and_profiling": "pass",
    "expert_api_and_cli_surfaces": "pass",
    "expert_testing_and_tooling": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_type_hints_cover_all_functions",
      "status": "pass",
      "evidence": "expert typing: type hints everywhere — all functions are hinted, not only public ones"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_strict_type_checker_mode_where_feasible",
      "status": "pass",
      "evidence": "expert typing: mypy/pyright runs strict where feasible"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_types_used_as_executable_documentation",
      "status": "pass",
      "evidence": "expert typing: types are treated as executable documentation"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_structured_data_via_dataclasses_or_pydantic",
      "status": "pass",
      "evidence": "expert idioms: structured data is modelled with dataclasses / pydantic"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_pathlib_preferred_over_os_path",
      "status": "pass",
      "evidence": "expert idioms: pathlib is used over os.path"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_f_strings_used_for_formatting",
      "status": "pass",
      "evidence": "expert idioms: f-strings are used for formatting"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_context_managers_used_for_resources",
      "status": "pass",
      "evidence": "expert idioms: context managers are used for resources"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_enumerate_and_zip_over_manual_indexing",
      "status": "pass",
      "evidence": "expert idioms: enumerate/zip are used over manual indexing"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_comprehensions_preferred_over_manual_loops",
      "status": "pass",
      "evidence": "expert idioms: comprehensions are preferred over manual loops"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_venv_pip_pythonpath_environment_declared",
      "status": "pass",
      "evidence": "expert packaging: the environment is venv + pip + PYTHONPATH"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_pyproject_toml_declares_project",
      "status": "pass",
      "evidence": "expert packaging: pyproject.toml declares the project"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_requirements_pinned",
      "status": "pass",
      "evidence": "expert packaging: requirements are pinned"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_reproducible_environment_without_containers",
      "status": "pass",
      "evidence": "expert packaging: the environment is reproducible without containers"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_src_layout_used",
      "status": "pass",
      "evidence": "expert packaging: src/ layout is used"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_clear_module_boundaries_declared",
      "status": "pass",
      "evidence": "expert packaging: module boundaries are clear"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_no_circular_imports_declared",
      "status": "pass",
      "evidence": "expert packaging: no circular imports"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_main_guard_on_entry_modules",
      "status": "pass",
      "evidence": "expert packaging: entry modules carry if __name__ == \"__main__\": guards"
    },
    {
      "section": "expert_async_concurrency",
      "check": "expert_asyncio_used_for_async_paths",
      "status": "pass",
      "evidence": "expert async: asyncio is used for async paths"
    },
    {
      "section": "expert_async_concurrency",
      "check": "expert_taskgroup_structured_concurrency_used",
      "status": "pass",
      "evidence": "expert async: structured concurrency with TaskGroup is used"
    },
    {
      "section": "expert_async_concurrency",
      "check": "expert_no_blocking_calls_in_async_paths",
      "status": "pass",
      "evidence": "expert async: no blocking code is called in an async path"
    },
    {
      "section": "expert_async_concurrency",
      "check": "expert_blocking_work_offloaded_to_thread_or_process_pool",
      "status": "pass",
      "evidence": "expert async: blocking work is pushed to a thread/process pool"
    },
    {
      "section": "expert_async_concurrency",
      "check": "expert_async_http_via_httpx_or_aiohttp",
      "status": "pass",
      "evidence": "expert async: httpx/aiohttp are used for async IO"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_profiling_before_optimizing_declared",
      "status": "pass",
      "evidence": "expert performance: profiling happens before optimizing"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_profiler_tooling_cprofile_or_py_spy_declared",
      "status": "pass",
      "evidence": "expert performance: the profiler is cProfile or py-spy"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_numpy_vectorization_where_data_parallel",
      "status": "pass",
      "evidence": "expert performance: data-parallel work is vectorized with numpy"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_cold_code_left_un_micro_optimized",
      "status": "pass",
      "evidence": "expert performance: cold code is not micro-optimized"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_hot_paths_declared",
      "status": "pass",
      "evidence": "the declared record names its hot paths — the hot_paths list is present; an empty list declares that the record has no hot paths"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_every_hot_path_profiled_before_optimizing",
      "status": "pass",
      "evidence": "expert performance: every declared hot path was profiled before optimizing"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_every_hot_path_uses_skill_named_acceleration_route",
      "status": "pass",
      "evidence": "expert performance: every declared hot path names a skill-named acceleration route — rust_pyo3, c_extension or numpy_vectorization"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_no_hot_path_name_duplicated",
      "status": "pass",
      "evidence": "expert performance: no declared hot-path name is owned by more than one hot-path row"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_fastapi_used_for_typed_services",
      "status": "pass",
      "evidence": "expert surfaces: FastAPI is used for typed services"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_pydantic_contracts_on_api_boundaries",
      "status": "pass",
      "evidence": "expert surfaces: APIs carry pydantic contracts"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_api_health_endpoint_provided",
      "status": "pass",
      "evidence": "expert surfaces: an /api/health endpoint is provided"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_cli_built_with_argparse_or_typer",
      "status": "pass",
      "evidence": "expert surfaces: CLIs are built with argparse/typer"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_cli_sane_exit_codes_declared",
      "status": "pass",
      "evidence": "expert surfaces: CLIs use sane exit codes"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_cli_pipe_friendly_output_declared",
      "status": "pass",
      "evidence": "expert surfaces: CLI output is pipe-friendly"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_pytest_fixtures_and_parametrize_used",
      "status": "pass",
      "evidence": "expert testing: pytest is used with fixtures and parametrize"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_hypothesis_property_tests_on_core_logic",
      "status": "pass",
      "evidence": "expert testing: hypothesis property-based tests cover core logic"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_coverage_measured_on_critical_path",
      "status": "pass",
      "evidence": "expert testing: coverage is measured on the critical path"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_ruff_lint_and_format_applied",
      "status": "pass",
      "evidence": "expert tooling: ruff (lint + format) is applied"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_mypy_run_as_tooling_gate",
      "status": "pass",
      "evidence": "expert tooling: mypy is run as a tooling gate"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_pre_commit_hooks_configured",
      "status": "pass",
      "evidence": "expert tooling: pre-commit hooks are configured"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_failures_loud_in_development",
      "status": "pass",
      "evidence": "expert tooling: failures are loud in development"
    },
    {
      "section": "red_lines",
      "check": "expert_no_untyped_sprawling_scripts",
      "status": "pass",
      "evidence": "red line: no untyped sprawling scripts are present in the record"
    },
    {
      "section": "red_lines",
      "check": "expert_no_mutable_default_arguments",
      "status": "pass",
      "evidence": "red line: no mutable default arguments are present in the record"
    },
    {
      "section": "red_lines",
      "check": "expert_no_bare_except_clauses",
      "status": "pass",
      "evidence": "red line: no bare except: clauses are present in the record"
    },
    {
      "section": "red_lines",
      "check": "expert_no_hidden_global_state",
      "status": "pass",
      "evidence": "red line: no hidden global state is present in the record"
    },
    {
      "section": "red_lines",
      "check": "expert_no_docker_substitute_for_venv_fix",
      "status": "pass",
      "evidence": "red line: Docker is not reached for to paper over an environment problem that venv solves"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "hot_paths_count": 1,
  "hot_paths_not_profiled_first": [],
  "hot_paths_with_non_skill_route": [],
  "profiled_first_coverage": "1.000000",
  "skill_route_coverage": "1.000000",
  "duplicate_hot_path_names": [],
  "summary": "48 pass, 0 fail, 0 missing of 48 checks across seven sections.",
  "stamp": "PRODUCTION PYTHON ENGINEERING PACK EXPERT\nproject: expert-system-core\nVERDICT: PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY\n  expert_typing_and_idiomatic_style            pass\n  expert_packaging_and_module_boundaries       pass\n  expert_async_concurrency                     pass\n  expert_performance_and_profiling             pass\n  expert_api_and_cli_surfaces                  pass\n  expert_testing_and_tooling                   pass\n  red_lines                                    pass\n48 pass, 0 fail, 0 missing of 48 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T09:45:39.334333+00:00 · gateway v1.1.0 · source `verification/work/production-python-engineering-pack-expert/evidence.json`.

Input:

```json
{
  "project": "expert-system-core",
  "expert_typing": {
    "type_hints_cover_all_functions_expert": true,
    "strict_type_checker_mode_where_feasible_expert": true,
    "types_used_as_executable_documentation_expert": true
  },
  "expert_idioms": {
    "structured_data_modelled_with_dataclasses_or_pydantic_expert": true,
    "pathlib_preferred_over_os_path_expert": true,
    "f_strings_used_for_formatting_expert": true,
    "context_managers_used_for_resources_expert": true,
    "enumerate_and_zip_used_over_manual_indexing_expert": true,
    "comprehensions_preferred_over_manual_loops_expert": true
  },
  "expert_packaging": {
    "venv_pip_pythonpath_environment_declared_expert": true,
    "pyproject_toml_declares_project_expert": true,
    "requirements_pinned_expert": true,
    "reproducible_environment_without_containers_expert": true,
    "src_layout_used_expert": true,
    "clear_module_boundaries_declared_expert": true,
    "no_circular_imports_declared_expert": true,
    "main_guard_on_entry_modules_expert": true
  },
  "expert_async": {
    "asyncio_used_for_async_paths_expert": true,
    "taskgroup_structured_concurrency_used_expert": true,
    "no_blocking_calls_in_async_paths_expert": true,
    "blocking_work_offloaded_to_thread_or_process_pool_expert": true,
    "async_http_via_httpx_or_aiohttp_expert": true
  },
  "expert_performance": {
    "profiling_before_optimizing_declared_expert": true,
    "profiler_tooling_cprofile_or_py_spy_declared_expert": true,
    "numpy_vectorization_applied_where_data_parallel_expert": true,
    "cold_code_left_un_micro_optimized_expert": true
  },
  "hot_paths": [
    {
      "name": "matrix_multiply",
      "profiled_before_optimizing_expert": false,
      "acceleration_route_expert": "invalid_route"
    }
  ],
  "expert_surfaces": {
    "fastapi_used_for_typed_services_expert": true,
    "pydantic_contracts_on_api_boundaries_expert": true,
    "api_health_endpoint_provided_expert": true,
    "cli_built_with_argparse_or_typer_expert": true,
    "cli_sane_exit_codes_declared_expert": true,
    "cli_pipe_friendly_output_declared_expert": true
  },
  "expert_testing": {
    "pytest_fixtures_and_parametrize_used_expert": true,
    "hypothesis_property_tests_on_core_logic_expert": true,
    "coverage_measured_on_critical_path_expert": true,
    "ruff_lint_and_format_applied_expert": true,
    "mypy_run_as_tooling_gate_expert": true,
    "pre_commit_hooks_configured_expert": true,
    "failures_loud_in_development_expert": true
  },
  "red_lines": {
    "untyped_sprawling_script_present": true,
    "mutable_default_arguments_present": false,
    "bare_except_present": true,
    "hidden_global_state_present": false,
    "docker_used_to_paper_over_venv_problem_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "production-python-engineering-pack-expert",
  "atom_version": "0.1.0",
  "project": "expert-system-core",
  "verdict": "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY",
  "sections": {
    "expert_typing_and_idiomatic_style": "pass",
    "expert_packaging_and_module_boundaries": "pass",
    "expert_async_concurrency": "pass",
    "expert_performance_and_profiling": "fail",
    "expert_api_and_cli_surfaces": "pass",
    "expert_testing_and_tooling": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_type_hints_cover_all_functions",
      "status": "pass",
      "evidence": "expert typing: type hints everywhere — all functions are hinted, not only public ones"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_strict_type_checker_mode_where_feasible",
      "status": "pass",
      "evidence": "expert typing: mypy/pyright runs strict where feasible"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_types_used_as_executable_documentation",
      "status": "pass",
      "evidence": "expert typing: types are treated as executable documentation"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_structured_data_via_dataclasses_or_pydantic",
      "status": "pass",
      "evidence": "expert idioms: structured data is modelled with dataclasses / pydantic"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_pathlib_preferred_over_os_path",
      "status": "pass",
      "evidence": "expert idioms: pathlib is used over os.path"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_f_strings_used_for_formatting",
      "status": "pass",
      "evidence": "expert idioms: f-strings are used for formatting"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_context_managers_used_for_resources",
      "status": "pass",
      "evidence": "expert idioms: context managers are used for resources"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_enumerate_and_zip_over_manual_indexing",
      "status": "pass",
      "evidence": "expert idioms: enumerate/zip are used over manual indexing"
    },
    {
      "section": "expert_typing_and_idiomatic_style",
      "check": "expert_comprehensions_preferred_over_manual_loops",
      "status": "pass",
      "evidence": "expert idioms: comprehensions are preferred over manual loops"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_venv_pip_pythonpath_environment_declared",
      "status": "pass",
      "evidence": "expert packaging: the environment is venv + pip + PYTHONPATH"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_pyproject_toml_declares_project",
      "status": "pass",
      "evidence": "expert packaging: pyproject.toml declares the project"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_requirements_pinned",
      "status": "pass",
      "evidence": "expert packaging: requirements are pinned"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_reproducible_environment_without_containers",
      "status": "pass",
      "evidence": "expert packaging: the environment is reproducible without containers"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_src_layout_used",
      "status": "pass",
      "evidence": "expert packaging: src/ layout is used"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_clear_module_boundaries_declared",
      "status": "pass",
      "evidence": "expert packaging: module boundaries are clear"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_no_circular_imports_declared",
      "status": "pass",
      "evidence": "expert packaging: no circular imports"
    },
    {
      "section": "expert_packaging_and_module_boundaries",
      "check": "expert_main_guard_on_entry_modules",
      "status": "pass",
      "evidence": "expert packaging: entry modules carry if __name__ == \"__main__\": guards"
    },
    {
      "section": "expert_async_concurrency",
      "check": "expert_asyncio_used_for_async_paths",
      "status": "pass",
      "evidence": "expert async: asyncio is used for async paths"
    },
    {
      "section": "expert_async_concurrency",
      "check": "expert_taskgroup_structured_concurrency_used",
      "status": "pass",
      "evidence": "expert async: structured concurrency with TaskGroup is used"
    },
    {
      "section": "expert_async_concurrency",
      "check": "expert_no_blocking_calls_in_async_paths",
      "status": "pass",
      "evidence": "expert async: no blocking code is called in an async path"
    },
    {
      "section": "expert_async_concurrency",
      "check": "expert_blocking_work_offloaded_to_thread_or_process_pool",
      "status": "pass",
      "evidence": "expert async: blocking work is pushed to a thread/process pool"
    },
    {
      "section": "expert_async_concurrency",
      "check": "expert_async_http_via_httpx_or_aiohttp",
      "status": "pass",
      "evidence": "expert async: httpx/aiohttp are used for async IO"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_profiling_before_optimizing_declared",
      "status": "pass",
      "evidence": "expert performance: profiling happens before optimizing"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_profiler_tooling_cprofile_or_py_spy_declared",
      "status": "pass",
      "evidence": "expert performance: the profiler is cProfile or py-spy"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_numpy_vectorization_where_data_parallel",
      "status": "pass",
      "evidence": "expert performance: data-parallel work is vectorized with numpy"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_cold_code_left_un_micro_optimized",
      "status": "pass",
      "evidence": "expert performance: cold code is not micro-optimized"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_hot_paths_declared",
      "status": "pass",
      "evidence": "the declared record names its hot paths — the hot_paths list is present; an empty list declares that the record has no hot paths"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_every_hot_path_profiled_before_optimizing",
      "status": "fail",
      "evidence": "expert performance: every declared hot path was profiled before optimizing"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_every_hot_path_uses_skill_named_acceleration_route",
      "status": "fail",
      "evidence": "expert performance: every declared hot path names a skill-named acceleration route — rust_pyo3, c_extension or numpy_vectorization"
    },
    {
      "section": "expert_performance_and_profiling",
      "check": "expert_no_hot_path_name_duplicated",
      "status": "pass",
      "evidence": "expert performance: no declared hot-path name is owned by more than one hot-path row"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_fastapi_used_for_typed_services",
      "status": "pass",
      "evidence": "expert surfaces: FastAPI is used for typed services"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_pydantic_contracts_on_api_boundaries",
      "status": "pass",
      "evidence": "expert surfaces: APIs carry pydantic contracts"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_api_health_endpoint_provided",
      "status": "pass",
      "evidence": "expert surfaces: an /api/health endpoint is provided"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_cli_built_with_argparse_or_typer",
      "status": "pass",
      "evidence": "expert surfaces: CLIs are built with argparse/typer"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_cli_sane_exit_codes_declared",
      "status": "pass",
      "evidence": "expert surfaces: CLIs use sane exit codes"
    },
    {
      "section": "expert_api_and_cli_surfaces",
      "check": "expert_cli_pipe_friendly_output_declared",
      "status": "pass",
      "evidence": "expert surfaces: CLI output is pipe-friendly"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_pytest_fixtures_and_parametrize_used",
      "status": "pass",
      "evidence": "expert testing: pytest is used with fixtures and parametrize"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_hypothesis_property_tests_on_core_logic",
      "status": "pass",
      "evidence": "expert testing: hypothesis property-based tests cover core logic"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_coverage_measured_on_critical_path",
      "status": "pass",
      "evidence": "expert testing: coverage is measured on the critical path"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_ruff_lint_and_format_applied",
      "status": "pass",
      "evidence": "expert tooling: ruff (lint + format) is applied"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_mypy_run_as_tooling_gate",
      "status": "pass",
      "evidence": "expert tooling: mypy is run as a tooling gate"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_pre_commit_hooks_configured",
      "status": "pass",
      "evidence": "expert tooling: pre-commit hooks are configured"
    },
    {
      "section": "expert_testing_and_tooling",
      "check": "expert_failures_loud_in_development",
      "status": "pass",
      "evidence": "expert tooling: failures are loud in development"
    },
    {
      "section": "red_lines",
      "check": "expert_no_untyped_sprawling_scripts",
      "status": "fail",
      "evidence": "red line: no untyped sprawling scripts are present in the record"
    },
    {
      "section": "red_lines",
      "check": "expert_no_mutable_default_arguments",
      "status": "pass",
      "evidence": "red line: no mutable default arguments are present in the record"
    },
    {
      "section": "red_lines",
      "check": "expert_no_bare_except_clauses",
      "status": "fail",
      "evidence": "red line: no bare except: clauses are present in the record"
    },
    {
      "section": "red_lines",
      "check": "expert_no_hidden_global_state",
      "status": "pass",
      "evidence": "red line: no hidden global state is present in the record"
    },
    {
      "section": "red_lines",
      "check": "expert_no_docker_substitute_for_venv_fix",
      "status": "pass",
      "evidence": "red line: Docker is not reached for to paper over an environment problem that venv solves"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "hot_paths_count": 1,
  "hot_paths_not_profiled_first": [
    "matrix_multiply"
  ],
  "hot_paths_with_non_skill_route": [
    "matrix_multiply"
  ],
  "profiled_first_coverage": "0.000000",
  "skill_route_coverage": "0.000000",
  "duplicate_hot_path_names": [],
  "summary": "44 pass, 4 fail, 0 missing of 48 checks across seven sections.",
  "stamp": "PRODUCTION PYTHON ENGINEERING PACK EXPERT\nproject: expert-system-core\nVERDICT: PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY\n  expert_typing_and_idiomatic_style            pass\n  expert_packaging_and_module_boundaries       pass\n  expert_async_concurrency                     pass\n  expert_performance_and_profiling             fail\n  expert_api_and_cli_surfaces                  pass\n  expert_testing_and_tooling                   pass\n  red_lines                                    fail\n44 pass, 4 fail, 0 missing of 48 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T09:45:39.334333+00:00 · gateway v1.1.0 · source `verification/work/production-python-engineering-pack-expert/evidence.json`.

Input:

```json
{
  "project": "malformed-input",
  "expert_typing": "should_be_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "expert_typing",
  "detail": "expert_typing must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared expert Python engineering record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not a code review, a profiling service, a performance guarantee or a judgment that the code is good, and it verifies no live fact. |
| Checks named | 48 documented / 48 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`hot_paths_count`, the two row-name lists, the duplicate-name list and the two coverage ratios) |
| Input reference typed | Yes — 58 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/production-python-engineering-pack-expert/evidence.json` |
