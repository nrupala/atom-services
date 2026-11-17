#!/usr/bin/env python3
"""Production Python engineering pack expert — deterministic core.

Built from the bound skill `python-expert`: "Write Python that a
stranger (or future Nrupal) can read, type-check, and trust.
Modern Python is typed Python."

This atom is the EXPERT pack, distinct from the base
production pack built from `python-engineering`. It audits only
the expert skill's distinct advanced material: type hints
EVERYWHERE with strict mypy/pyright where feasible and the
expert idioms (enumerate/zip, comprehensions over manual
loops); packaging Nrupal's way — venv + pip + PYTHONPATH,
src/ layout, clear module boundaries, no circular imports,
``__main__`` guards, and NO containers; asyncio with TaskGroup
structured concurrency, blocking work pushed to a thread/
process pool, httpx/aiohttp for async IO; performance by
profiling FIRST (cProfile, py-spy), numpy vectorization, hot
loops pushed to Rust (pyo3) or C, and no micro-optimizing cold
code; FastAPI services with pydantic contracts and an
/api/health endpoint, and CLIs with sane exit codes and
pipe-friendly output; hypothesis property-based tests on core
logic, coverage on the critical path, ruff + mypy + pre-commit
tooling; and the expert anti-patterns refused (untyped
sprawling scripts, mutable default arguments, bare except:,
hidden global state, Docker reached for to paper over a venv
problem).

Distinct ground: the base `production-python-engineering-pack`
(from `python-engineering`) covers the production basics —
one venv per project, annotating public functions, pytest
discipline, stdlib-first style, honest error handling,
packaging metadata. This atom shares zero checks with it by
construction: every check name here carries the expert
material (strict typing, TaskGroup, py-spy/cProfile profiling,
pyo3/C hot paths, hypothesis, /api/health, PYTHONPATH/no-
container packaging, __main__ guards, circular imports), and
every manifest field is named for that expert material. It
also shares zero checks with `c-engineering-review` and
`cpp-engineering-review` (verified mechanically against their
handlers): those review C/C++ diffs — memory ownership, UB,
sanitizers, RAII, smart pointers — while this atom audits a
declared expert-Python record.

The caller submits an expert record manifest (a dict, or JSON
on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- hot_paths: the declared `hot_paths` list must be present
  (an empty list is a valid declaration — the record declares
  no hot paths; the skill requires no hot path), and every
  declared hot-path row must declare it was profiled BEFORE
  optimizing (the skill: "Profile before optimizing"), and
  must name an acceleration route the skill itself names —
  exactly one of `rust_pyo3`, `c_extension` or
  `numpy_vectorization` (the skill: vectorize with numpy;
  push hot loops to Rust (pyo3) or C);
- hot-path-name ownership: no declared hot-path name may be
  owned by more than one hot-path row.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons
use the unrounded values. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.
Counts are reported as integers (exact).

The skill states NO numeric threshold — no typing-coverage
percentage, no profiling duration, no speedup factor, no
coverage percentage, no test count — so no numeric threshold
check is invented; those quantities are caller attestations
at most, and quantities here are computed and reported, with
completeness (every declared hot-path row) as the only bar,
exactly as stated above.

Verdict:
- any fail             -> PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism
is the product.
"""
import json
import math
import sys

SECTIONS = (
    "expert_typing_and_idiomatic_style",
    "expert_packaging_and_module_boundaries",
    "expert_async_concurrency",
    "expert_performance_and_profiling",
    "expert_api_and_cli_surfaces",
    "expert_testing_and_tooling",
    "red_lines",
)

SKILL_ACCELERATION_ROUTES = ("rust_pyo3", "c_extension",
                             "numpy_vectorization")

MANIFEST_SPEC = {
    "project": "string",
    "expert_typing": {
        "type_hints_cover_all_functions_expert": "boolean",
        "strict_type_checker_mode_where_feasible_expert": "boolean",
        "types_used_as_executable_documentation_expert": "boolean",
    },
    "expert_idioms": {
        "structured_data_modelled_with_dataclasses_or_pydantic_expert": "boolean",
        "pathlib_preferred_over_os_path_expert": "boolean",
        "f_strings_used_for_formatting_expert": "boolean",
        "context_managers_used_for_resources_expert": "boolean",
        "enumerate_and_zip_used_over_manual_indexing_expert": "boolean",
        "comprehensions_preferred_over_manual_loops_expert": "boolean",
    },
    "expert_packaging": {
        "venv_pip_pythonpath_environment_declared_expert": "boolean",
        "pyproject_toml_declares_project_expert": "boolean",
        "requirements_pinned_expert": "boolean",
        "reproducible_environment_without_containers_expert": "boolean",
        "src_layout_used_expert": "boolean",
        "clear_module_boundaries_declared_expert": "boolean",
        "no_circular_imports_declared_expert": "boolean",
        "main_guard_on_entry_modules_expert": "boolean",
    },
    "expert_async": {
        "asyncio_used_for_async_paths_expert": "boolean",
        "taskgroup_structured_concurrency_used_expert": "boolean",
        "no_blocking_calls_in_async_paths_expert": "boolean",
        "blocking_work_offloaded_to_thread_or_process_pool_expert": "boolean",
        "async_http_via_httpx_or_aiohttp_expert": "boolean",
    },
    "expert_performance": {
        "profiling_before_optimizing_declared_expert": "boolean",
        "profiler_tooling_cprofile_or_py_spy_declared_expert": "boolean",
        "numpy_vectorization_applied_where_data_parallel_expert": "boolean",
        "cold_code_left_un_micro_optimized_expert": "boolean",
    },
    "hot_paths": [{
        "name": "string",
        "profiled_before_optimizing_expert": "boolean",
        "acceleration_route_expert": "string",
    }],
    "expert_surfaces": {
        "fastapi_used_for_typed_services_expert": "boolean",
        "pydantic_contracts_on_api_boundaries_expert": "boolean",
        "api_health_endpoint_provided_expert": "boolean",
        "cli_built_with_argparse_or_typer_expert": "boolean",
        "cli_sane_exit_codes_declared_expert": "boolean",
        "cli_pipe_friendly_output_declared_expert": "boolean",
    },
    "expert_testing": {
        "pytest_fixtures_and_parametrize_used_expert": "boolean",
        "hypothesis_property_tests_on_core_logic_expert": "boolean",
        "coverage_measured_on_critical_path_expert": "boolean",
        "ruff_lint_and_format_applied_expert": "boolean",
        "mypy_run_as_tooling_gate_expert": "boolean",
        "pre_commit_hooks_configured_expert": "boolean",
        "failures_loud_in_development_expert": "boolean",
    },
    "red_lines": {
        "untyped_sprawling_script_present": "boolean",
        "mutable_default_arguments_present": "boolean",
        "bare_except_present": "boolean",
        "hidden_global_state_present": "boolean",
        "docker_used_to_paper_over_venv_problem_present": "boolean",
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


def evaluate(manifest):
    """Return the verdict dict for an expert Python record manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    hot_paths, has_hot_paths = _get(manifest, "hot_paths")
    hot_paths_is_list = has_hot_paths and isinstance(hot_paths, list)
    hot_paths_count = len(hot_paths) if hot_paths_is_list else None
    rows = hot_paths if hot_paths_is_list else []

    hot_paths_not_profiled_first = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "profiled_before_optimizing_expert" in c
         and c.get("profiled_before_optimizing_expert") is not True]
        if hot_paths_is_list else None
    )
    hot_paths_with_non_skill_route = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "acceleration_route_expert" in c
         and c.get("acceleration_route_expert")
         not in SKILL_ACCELERATION_ROUTES]
        if hot_paths_is_list else None
    )
    duplicate_hot_path_names = None
    if hot_paths_is_list:
        seen = []
        duplicate_hot_path_names = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("name"), str):
                nm = c["name"]
                if nm in seen and nm not in duplicate_hot_path_names:
                    duplicate_hot_path_names.append(nm)
                seen.append(nm)
    profiled_first_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("profiled_before_optimizing_expert") is True)
        / hot_paths_count
        if hot_paths_is_list and hot_paths_count > 0 else None
    )
    skill_route_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("acceleration_route_expert")
            in SKILL_ACCELERATION_ROUTES)
        / hot_paths_count
        if hot_paths_is_list and hot_paths_count > 0 else None
    )

    # ---- Section 1: expert_typing_and_idiomatic_style ----
    _bool_check(results, "expert_typing_and_idiomatic_style",
                "expert_type_hints_cover_all_functions", manifest,
                ("expert_typing", "type_hints_cover_all_functions_expert"),
                "expert typing: type hints everywhere — all "
                "functions are hinted, not only public ones")
    _bool_check(results, "expert_typing_and_idiomatic_style",
                "expert_strict_type_checker_mode_where_feasible", manifest,
                ("expert_typing",
                 "strict_type_checker_mode_where_feasible_expert"),
                "expert typing: mypy/pyright runs strict where "
                "feasible")
    _bool_check(results, "expert_typing_and_idiomatic_style",
                "expert_types_used_as_executable_documentation", manifest,
                ("expert_typing",
                 "types_used_as_executable_documentation_expert"),
                "expert typing: types are treated as executable "
                "documentation")
    _bool_check(results, "expert_typing_and_idiomatic_style",
                "expert_structured_data_via_dataclasses_or_pydantic",
                manifest,
                ("expert_idioms",
                 "structured_data_modelled_with_dataclasses_or_pydantic_expert"),
                "expert idioms: structured data is modelled "
                "with dataclasses / pydantic")
    _bool_check(results, "expert_typing_and_idiomatic_style",
                "expert_pathlib_preferred_over_os_path", manifest,
                ("expert_idioms", "pathlib_preferred_over_os_path_expert"),
                "expert idioms: pathlib is used over os.path")
    _bool_check(results, "expert_typing_and_idiomatic_style",
                "expert_f_strings_used_for_formatting", manifest,
                ("expert_idioms", "f_strings_used_for_formatting_expert"),
                "expert idioms: f-strings are used for formatting")
    _bool_check(results, "expert_typing_and_idiomatic_style",
                "expert_context_managers_used_for_resources", manifest,
                ("expert_idioms",
                 "context_managers_used_for_resources_expert"),
                "expert idioms: context managers are used for "
                "resources")
    _bool_check(results, "expert_typing_and_idiomatic_style",
                "expert_enumerate_and_zip_over_manual_indexing", manifest,
                ("expert_idioms",
                 "enumerate_and_zip_used_over_manual_indexing_expert"),
                "expert idioms: enumerate/zip are used over "
                "manual indexing")
    _bool_check(results, "expert_typing_and_idiomatic_style",
                "expert_comprehensions_preferred_over_manual_loops",
                manifest,
                ("expert_idioms",
                 "comprehensions_preferred_over_manual_loops_expert"),
                "expert idioms: comprehensions are preferred "
                "over manual loops")

    # ---- Section 2: expert_packaging_and_module_boundaries ----
    _bool_check(results, "expert_packaging_and_module_boundaries",
                "expert_venv_pip_pythonpath_environment_declared", manifest,
                ("expert_packaging",
                 "venv_pip_pythonpath_environment_declared_expert"),
                "expert packaging: the environment is venv + "
                "pip + PYTHONPATH")
    _bool_check(results, "expert_packaging_and_module_boundaries",
                "expert_pyproject_toml_declares_project", manifest,
                ("expert_packaging",
                 "pyproject_toml_declares_project_expert"),
                "expert packaging: pyproject.toml declares the "
                "project")
    _bool_check(results, "expert_packaging_and_module_boundaries",
                "expert_requirements_pinned", manifest,
                ("expert_packaging", "requirements_pinned_expert"),
                "expert packaging: requirements are pinned")
    _bool_check(results, "expert_packaging_and_module_boundaries",
                "expert_reproducible_environment_without_containers",
                manifest,
                ("expert_packaging",
                 "reproducible_environment_without_containers_expert"),
                "expert packaging: the environment is "
                "reproducible without containers")
    _bool_check(results, "expert_packaging_and_module_boundaries",
                "expert_src_layout_used", manifest,
                ("expert_packaging", "src_layout_used_expert"),
                "expert packaging: src/ layout is used")
    _bool_check(results, "expert_packaging_and_module_boundaries",
                "expert_clear_module_boundaries_declared", manifest,
                ("expert_packaging",
                 "clear_module_boundaries_declared_expert"),
                "expert packaging: module boundaries are clear")
    _bool_check(results, "expert_packaging_and_module_boundaries",
                "expert_no_circular_imports_declared", manifest,
                ("expert_packaging", "no_circular_imports_declared_expert"),
                "expert packaging: no circular imports")
    _bool_check(results, "expert_packaging_and_module_boundaries",
                "expert_main_guard_on_entry_modules", manifest,
                ("expert_packaging", "main_guard_on_entry_modules_expert"),
                "expert packaging: entry modules carry "
                "if __name__ == \"__main__\": guards")

    # ---- Section 3: expert_async_concurrency ----
    _bool_check(results, "expert_async_concurrency",
                "expert_asyncio_used_for_async_paths", manifest,
                ("expert_async", "asyncio_used_for_async_paths_expert"),
                "expert async: asyncio is used for async paths")
    _bool_check(results, "expert_async_concurrency",
                "expert_taskgroup_structured_concurrency_used", manifest,
                ("expert_async",
                 "taskgroup_structured_concurrency_used_expert"),
                "expert async: structured concurrency with "
                "TaskGroup is used")
    _bool_check(results, "expert_async_concurrency",
                "expert_no_blocking_calls_in_async_paths", manifest,
                ("expert_async",
                 "no_blocking_calls_in_async_paths_expert"),
                "expert async: no blocking code is called in "
                "an async path")
    _bool_check(results, "expert_async_concurrency",
                "expert_blocking_work_offloaded_to_thread_or_process_pool",
                manifest,
                ("expert_async",
                 "blocking_work_offloaded_to_thread_or_process_pool_expert"),
                "expert async: blocking work is pushed to a "
                "thread/process pool")
    _bool_check(results, "expert_async_concurrency",
                "expert_async_http_via_httpx_or_aiohttp", manifest,
                ("expert_async", "async_http_via_httpx_or_aiohttp_expert"),
                "expert async: httpx/aiohttp are used for "
                "async IO")

    # ---- Section 4: expert_performance_and_profiling ----
    _bool_check(results, "expert_performance_and_profiling",
                "expert_profiling_before_optimizing_declared", manifest,
                ("expert_performance",
                 "profiling_before_optimizing_declared_expert"),
                "expert performance: profiling happens before "
                "optimizing")
    _bool_check(results, "expert_performance_and_profiling",
                "expert_profiler_tooling_cprofile_or_py_spy_declared",
                manifest,
                ("expert_performance",
                 "profiler_tooling_cprofile_or_py_spy_declared_expert"),
                "expert performance: the profiler is cProfile "
                "or py-spy")
    _bool_check(results, "expert_performance_and_profiling",
                "expert_numpy_vectorization_where_data_parallel", manifest,
                ("expert_performance",
                 "numpy_vectorization_applied_where_data_parallel_expert"),
                "expert performance: data-parallel work is "
                "vectorized with numpy")
    _bool_check(results, "expert_performance_and_profiling",
                "expert_cold_code_left_un_micro_optimized", manifest,
                ("expert_performance",
                 "cold_code_left_un_micro_optimized_expert"),
                "expert performance: cold code is not "
                "micro-optimized")
    _check(results, "expert_performance_and_profiling",
           "expert_hot_paths_declared", hot_paths, hot_paths_is_list,
           hot_paths_is_list,
           "the declared record names its hot paths — the "
           "hot_paths list is present; an empty list declares "
           "that the record has no hot paths")
    profiled_present = (
        hot_paths_is_list
        and all(isinstance(c, dict)
                and "profiled_before_optimizing_expert" in c
                for c in rows)
    )
    _check(results, "expert_performance_and_profiling",
           "expert_every_hot_path_profiled_before_optimizing", hot_paths,
           profiled_present,
           hot_paths_is_list
           and all(isinstance(c, dict)
                   and c.get("profiled_before_optimizing_expert") is True
                   for c in rows),
           "expert performance: every declared hot path was "
           "profiled before optimizing")
    route_present = (
        hot_paths_is_list
        and all(isinstance(c, dict)
                and "acceleration_route_expert" in c for c in rows)
    )
    _check(results, "expert_performance_and_profiling",
           "expert_every_hot_path_uses_skill_named_acceleration_route",
           hot_paths, route_present,
           hot_paths_is_list
           and all(isinstance(c, dict)
                   and c.get("acceleration_route_expert")
                   in SKILL_ACCELERATION_ROUTES
                   for c in rows),
           "expert performance: every declared hot path names "
           "a skill-named acceleration route — rust_pyo3, "
           "c_extension or numpy_vectorization")
    hot_name_present = (
        hot_paths_is_list
        and all(isinstance(c, dict) and "name" in c for c in rows)
    )
    _check(results, "expert_performance_and_profiling",
           "expert_no_hot_path_name_duplicated", hot_paths,
           hot_name_present,
           hot_paths_is_list
           and duplicate_hot_path_names is not None
           and len(duplicate_hot_path_names) == 0,
           "expert performance: no declared hot-path name is "
           "owned by more than one hot-path row")

    # ---- Section 5: expert_api_and_cli_surfaces ----
    _bool_check(results, "expert_api_and_cli_surfaces",
                "expert_fastapi_used_for_typed_services", manifest,
                ("expert_surfaces",
                 "fastapi_used_for_typed_services_expert"),
                "expert surfaces: FastAPI is used for typed "
                "services")
    _bool_check(results, "expert_api_and_cli_surfaces",
                "expert_pydantic_contracts_on_api_boundaries", manifest,
                ("expert_surfaces",
                 "pydantic_contracts_on_api_boundaries_expert"),
                "expert surfaces: APIs carry pydantic contracts")
    _bool_check(results, "expert_api_and_cli_surfaces",
                "expert_api_health_endpoint_provided", manifest,
                ("expert_surfaces", "api_health_endpoint_provided_expert"),
                "expert surfaces: an /api/health endpoint is "
                "provided")
    _bool_check(results, "expert_api_and_cli_surfaces",
                "expert_cli_built_with_argparse_or_typer", manifest,
                ("expert_surfaces",
                 "cli_built_with_argparse_or_typer_expert"),
                "expert surfaces: CLIs are built with "
                "argparse/typer")
    _bool_check(results, "expert_api_and_cli_surfaces",
                "expert_cli_sane_exit_codes_declared", manifest,
                ("expert_surfaces", "cli_sane_exit_codes_declared_expert"),
                "expert surfaces: CLIs use sane exit codes")
    _bool_check(results, "expert_api_and_cli_surfaces",
                "expert_cli_pipe_friendly_output_declared", manifest,
                ("expert_surfaces",
                 "cli_pipe_friendly_output_declared_expert"),
                "expert surfaces: CLI output is pipe-friendly")

    # ---- Section 6: expert_testing_and_tooling ----
    _bool_check(results, "expert_testing_and_tooling",
                "expert_pytest_fixtures_and_parametrize_used", manifest,
                ("expert_testing",
                 "pytest_fixtures_and_parametrize_used_expert"),
                "expert testing: pytest is used with fixtures "
                "and parametrize")
    _bool_check(results, "expert_testing_and_tooling",
                "expert_hypothesis_property_tests_on_core_logic", manifest,
                ("expert_testing",
                 "hypothesis_property_tests_on_core_logic_expert"),
                "expert testing: hypothesis property-based "
                "tests cover core logic")
    _bool_check(results, "expert_testing_and_tooling",
                "expert_coverage_measured_on_critical_path", manifest,
                ("expert_testing",
                 "coverage_measured_on_critical_path_expert"),
                "expert testing: coverage is measured on the "
                "critical path")
    _bool_check(results, "expert_testing_and_tooling",
                "expert_ruff_lint_and_format_applied", manifest,
                ("expert_testing", "ruff_lint_and_format_applied_expert"),
                "expert tooling: ruff (lint + format) is applied")
    _bool_check(results, "expert_testing_and_tooling",
                "expert_mypy_run_as_tooling_gate", manifest,
                ("expert_testing", "mypy_run_as_tooling_gate_expert"),
                "expert tooling: mypy is run as a tooling gate")
    _bool_check(results, "expert_testing_and_tooling",
                "expert_pre_commit_hooks_configured", manifest,
                ("expert_testing", "pre_commit_hooks_configured_expert"),
                "expert tooling: pre-commit hooks are configured")
    _bool_check(results, "expert_testing_and_tooling",
                "expert_failures_loud_in_development", manifest,
                ("expert_testing", "failures_loud_in_development_expert"),
                "expert tooling: failures are loud in development")

    # ---- Section 7: red_lines ----
    _false_check(results, "red_lines",
                 "expert_no_untyped_sprawling_scripts", manifest,
                 ("red_lines", "untyped_sprawling_script_present"),
                 "red line: no untyped sprawling scripts are "
                 "present in the record")
    _false_check(results, "red_lines",
                 "expert_no_mutable_default_arguments", manifest,
                 ("red_lines", "mutable_default_arguments_present"),
                 "red line: no mutable default arguments are "
                 "present in the record")
    _false_check(results, "red_lines",
                 "expert_no_bare_except_clauses", manifest,
                 ("red_lines", "bare_except_present"),
                 "red line: no bare except: clauses are present "
                 "in the record")
    _false_check(results, "red_lines",
                 "expert_no_hidden_global_state", manifest,
                 ("red_lines", "hidden_global_state_present"),
                 "red line: no hidden global state is present "
                 "in the record")
    _false_check(results, "red_lines",
                 "expert_no_docker_substitute_for_venv_fix", manifest,
                 ("red_lines",
                  "docker_used_to_paper_over_venv_problem_present"),
                 "red line: Docker is not reached for to paper "
                 "over an environment problem that venv solves")

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
        verdict = "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY"

    computed_names = (
        "expert_hot_paths_declared",
        "expert_every_hot_path_profiled_before_optimizing",
        "expert_every_hot_path_uses_skill_named_acceleration_route",
        "expert_no_hot_path_name_duplicated",
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
        "service": "production-python-engineering-pack-expert",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "hot_paths_count": hot_paths_count,
        "hot_paths_not_profiled_first": hot_paths_not_profiled_first,
        "hot_paths_with_non_skill_route": hot_paths_with_non_skill_route,
        "profiled_first_coverage": _fmt6(profiled_first_coverage),
        "skill_route_coverage": _fmt6(skill_route_coverage),
        "duplicate_hot_path_names": duplicate_hot_path_names,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "PRODUCTION PYTHON ENGINEERING PACK EXPERT",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: production_python_engineering_pack_expert.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if (verdict["verdict"] ==
                 "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY") else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
