# Production python engineering pack expert — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have an expert-level Python project — strict typing, profiling before optimizing, structured concurrency, and the expert anti-patterns refused — and you have a record of that engineering. This atom reads one declared manifest and returns one deterministic verdict across seven sections (expert_typing_and_idiomatic_style, expert_packaging_and_module_boundaries, expert_async_concurrency, expert_performance_and_profiling, expert_api_and_cli_surfaces, expert_testing_and_tooling, red_lines): **PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY**, **PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 48 checks. It audits the declared expert Python engineering record's completeness and consistency only — it runs no code, type checker, profiler, linter, or test suite, inspects no repository, and does not verify that a declared practice was ever carried out. A record is ready *on your declared evidence*: it never judges whether a named hot path is really hot, whether the declared profiler output justified the route chosen, whether the strict typing is genuinely feasible further, or whether the design is sound. The computed checks: the declared `hot_paths` list must be present (an empty list passes — it declares the record has no hot paths); every declared hot-path row must declare `profiled_before_optimizing_expert` true; every row must name an `acceleration_route_expert` that is exactly one of the skill-named routes `rust_pyo3`, `c_extension`, or `numpy_vectorization`; and no hot-path `name` may appear on more than one row. The skill states no numeric threshold at all — its demands are qualitative declarations, not bars the atom can set. Declined thresholds, named: a type-hint coverage percentage or a count of untyped functions; a strictness level beyond the skill's "strict where feasible" declaration; a profiling duration, sample count, or required speedup factor; a numpy/Rust/C performance gain percentage; a coverage percentage for the critical path; a number of hypothesis examples or property tests; a number of pre-commit hooks or ruff/mypy findings tolerated; a response-time or throughput figure for the FastAPI surface or its `/api/health` endpoint; specific exit-code values beyond CLIs declaring sane exit codes; a Python, mypy/pyright, ruff, or dependency version number; a module count, file size, or circular-import count beyond the declarations that boundaries are clear and no circular imports exist. Quantities are computed and reported; the only bar on the computed rows is completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "production-python-engineering-pack-expert"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/production-python-engineering-pack-expert` — tool name `production_python_engineering_pack_expert`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/production-python-engineering-pack-expert` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `project` | Project name (string; carried into the output, not checked) |
| `expert_typing.type_hints_cover_all_functions_expert` | expert typing: type hints cover all functions |
| `expert_typing.strict_type_checker_mode_where_feasible_expert` | expert typing: strict type-checker mode where feasible |
| `expert_typing.types_used_as_executable_documentation_expert` | expert typing: types used as executable documentation |
| `expert_idioms.structured_data_modelled_with_dataclasses_or_pydantic_expert` | expert idioms: structured data modelled with dataclasses or pydantic |
| `expert_idioms.pathlib_preferred_over_os_path_expert` | expert idioms: pathlib preferred over os.path |
| `expert_idioms.f_strings_used_for_formatting_expert` | expert idioms: f-strings used for formatting |
| `expert_idioms.context_managers_used_for_resources_expert` | expert idioms: context managers used for resources |
| `expert_idioms.enumerate_and_zip_used_over_manual_indexing_expert` | expert idioms: enumerate and zip used over manual indexing |
| `expert_idioms.comprehensions_preferred_over_manual_loops_expert` | expert idioms: comprehensions preferred over manual loops |
| `expert_packaging.venv_pip_pythonpath_environment_declared_expert` | expert packaging: venv + pip + PYTHONPATH environment declared |
| `expert_packaging.pyproject_toml_declares_project_expert` | expert packaging: pyproject.toml declares the project |
| `expert_packaging.requirements_pinned_expert` | expert packaging: requirements pinned |
| `expert_packaging.reproducible_environment_without_containers_expert` | expert packaging: reproducible environment without containers |
| `expert_packaging.src_layout_used_expert` | expert packaging: src layout used |
| `expert_packaging.clear_module_boundaries_declared_expert` | expert packaging: clear module boundaries declared |
| `expert_packaging.no_circular_imports_declared_expert` | expert packaging: no circular imports declared |
| `expert_packaging.main_guard_on_entry_modules_expert` | expert packaging: main guard on entry modules |
| `expert_async.asyncio_used_for_async_paths_expert` | expert async: asyncio used for async paths |
| `expert_async.taskgroup_structured_concurrency_used_expert` | expert async: TaskGroup structured concurrency used |
| `expert_async.no_blocking_calls_in_async_paths_expert` | expert async: no blocking calls in async paths |
| `expert_async.blocking_work_offloaded_to_thread_or_process_pool_expert` | expert async: blocking work offloaded to a thread or process pool |
| `expert_async.async_http_via_httpx_or_aiohttp_expert` | expert async: async HTTP via httpx or aiohttp |
| `expert_performance.profiling_before_optimizing_declared_expert` | expert performance: profiling before optimizing declared |
| `expert_performance.profiler_tooling_cprofile_or_py_spy_declared_expert` | expert performance: profiler tooling cProfile or py-spy declared |
| `expert_performance.numpy_vectorization_applied_where_data_parallel_expert` | expert performance: numpy vectorization applied where data-parallel |
| `expert_performance.cold_code_left_un_micro_optimized_expert` | expert performance: cold code left un-micro-optimized |
| `hot_paths` (list of hot-path-row objects) | computed: must be present (an empty list passes); reported as `hot_paths_count` |
| `hot_paths[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row |
| `hot_paths[].profiled_before_optimizing_expert` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `hot_paths_not_profiled_first` |
| `hot_paths[].acceleration_route_expert` (string) | computed: must be one of `rust_pyo3`, `c_extension`, or `numpy_vectorization` per row; rows with a non-skill route are reported in `hot_paths_with_non_skill_route` |
| `expert_surfaces.fastapi_used_for_typed_services_expert` | expert surfaces: FastAPI used for typed services |
| `expert_surfaces.pydantic_contracts_on_api_boundaries_expert` | expert surfaces: pydantic contracts on API boundaries |
| `expert_surfaces.api_health_endpoint_provided_expert` | expert surfaces: API health endpoint provided |
| `expert_surfaces.cli_built_with_argparse_or_typer_expert` | expert surfaces: CLI built with argparse or typer |
| `expert_surfaces.cli_sane_exit_codes_declared_expert` | expert surfaces: CLI sane exit codes declared |
| `expert_surfaces.cli_pipe_friendly_output_declared_expert` | expert surfaces: CLI pipe-friendly output declared |
| `expert_testing.pytest_fixtures_and_parametrize_used_expert` | expert testing: pytest fixtures and parametrize used |
| `expert_testing.hypothesis_property_tests_on_core_logic_expert` | expert testing: hypothesis property tests on core logic |
| `expert_testing.coverage_measured_on_critical_path_expert` | expert testing: coverage measured on the critical path |
| `expert_testing.ruff_lint_and_format_applied_expert` | expert testing: ruff lint and format applied |
| `expert_testing.mypy_run_as_tooling_gate_expert` | expert testing: mypy run as a tooling gate |
| `expert_testing.pre_commit_hooks_configured_expert` | expert testing: pre-commit hooks configured |
| `expert_testing.failures_loud_in_development_expert` | expert testing: failures loud in development |
| `red_lines.untyped_sprawling_script_present` | must be `false` to pass (red line: no untyped sprawling script) |
| `red_lines.mutable_default_arguments_present` | must be `false` to pass (red line: no mutable default arguments) |
| `red_lines.bare_except_present` | must be `false` to pass (red line: no bare except) |
| `red_lines.hidden_global_state_present` | must be `false` to pass (red line: no hidden global state) |
| `red_lines.docker_used_to_paper_over_venv_problem_present` | must be `false` to pass (red line: no Docker used to paper over a venv problem) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/production-python-engineering-pack-expert`:

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

Response — HTTP 200 (trimmed; the full response carries all 48 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "hot_paths_count": 1,
  "hot_paths_not_profiled_first": [],
  "hot_paths_with_non_skill_route": [],
  "profiled_first_coverage": "1.000000",
  "skill_route_coverage": "1.000000",
  "duplicate_hot_path_names": [],
  "summary": "48 pass, 0 fail, 0 missing of 48 checks across seven sections."
}
```

## Verdicts

- **PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY** — every check passes; the declared expert Python engineering record is complete and consistent with the skill's checklist and red lines.
- **PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `hot_paths_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `hot_paths_not_profiled_first` and `hot_paths_with_non_skill_route` and the name list `duplicate_hot_path_names` (null when the `hot_paths` list is not declared; a hot path with the relevant field absent is missing evidence and does not appear in the first two lists), the coverage values `profiled_first_coverage` and `skill_route_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the four primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
