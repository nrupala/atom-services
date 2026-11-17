// Production Python engineering pack expert — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/production-python-engineering-pack-expert/src/
// production_python_engineering_pack_expert.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const SKILL_ACCELERATION_ROUTES = ["rust_pyo3", "c_extension", "numpy_vectorization"];

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  project: "string",
  expert_typing: {
    type_hints_cover_all_functions_expert: "boolean",
    strict_type_checker_mode_where_feasible_expert: "boolean",
    types_used_as_executable_documentation_expert: "boolean",
  },
  expert_idioms: {
    structured_data_modelled_with_dataclasses_or_pydantic_expert: "boolean",
    pathlib_preferred_over_os_path_expert: "boolean",
    f_strings_used_for_formatting_expert: "boolean",
    context_managers_used_for_resources_expert: "boolean",
    enumerate_and_zip_used_over_manual_indexing_expert: "boolean",
    comprehensions_preferred_over_manual_loops_expert: "boolean",
  },
  expert_packaging: {
    venv_pip_pythonpath_environment_declared_expert: "boolean",
    pyproject_toml_declares_project_expert: "boolean",
    requirements_pinned_expert: "boolean",
    reproducible_environment_without_containers_expert: "boolean",
    src_layout_used_expert: "boolean",
    clear_module_boundaries_declared_expert: "boolean",
    no_circular_imports_declared_expert: "boolean",
    main_guard_on_entry_modules_expert: "boolean",
  },
  expert_async: {
    asyncio_used_for_async_paths_expert: "boolean",
    taskgroup_structured_concurrency_used_expert: "boolean",
    no_blocking_calls_in_async_paths_expert: "boolean",
    blocking_work_offloaded_to_thread_or_process_pool_expert: "boolean",
    async_http_via_httpx_or_aiohttp_expert: "boolean",
  },
  expert_performance: {
    profiling_before_optimizing_declared_expert: "boolean",
    profiler_tooling_cprofile_or_py_spy_declared_expert: "boolean",
    numpy_vectorization_applied_where_data_parallel_expert: "boolean",
    cold_code_left_un_micro_optimized_expert: "boolean",
  },
  hot_paths: [{
    name: "string",
    profiled_before_optimizing_expert: "boolean",
    acceleration_route_expert: "string",
  }],
  expert_surfaces: {
    fastapi_used_for_typed_services_expert: "boolean",
    pydantic_contracts_on_api_boundaries_expert: "boolean",
    api_health_endpoint_provided_expert: "boolean",
    cli_built_with_argparse_or_typer_expert: "boolean",
    cli_sane_exit_codes_declared_expert: "boolean",
    cli_pipe_friendly_output_declared_expert: "boolean",
  },
  expert_testing: {
    pytest_fixtures_and_parametrize_used_expert: "boolean",
    hypothesis_property_tests_on_core_logic_expert: "boolean",
    coverage_measured_on_critical_path_expert: "boolean",
    ruff_lint_and_format_applied_expert: "boolean",
    mypy_run_as_tooling_gate_expert: "boolean",
    pre_commit_hooks_configured_expert: "boolean",
    failures_loud_in_development_expert: "boolean",
  },
  red_lines: {
    untyped_sprawling_script_present: "boolean",
    mutable_default_arguments_present: "boolean",
    bare_except_present: "boolean",
    hidden_global_state_present: "boolean",
    docker_used_to_paper_over_venv_problem_present: "boolean",
  },
};

export const SECTIONS = [
  "expert_typing_and_idiomatic_style",
  "expert_packaging_and_module_boundaries",
  "expert_async_concurrency",
  "expert_performance_and_profiling",
  "expert_api_and_cli_surfaces",
  "expert_testing_and_tooling",
  "red_lines",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  project: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  hot_paths_count: number | null;
  hot_paths_not_profiled_first: string[] | null;
  hot_paths_with_non_skill_route: string[] | null;
  profiled_first_coverage: string | null;
  skill_route_coverage: string | null;
  duplicate_hot_path_names: string[] | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [hotPathsRaw, hasHotPaths] = getPath(manifest, "hot_paths");
  const hotPathsIsList = hasHotPaths && Array.isArray(hotPathsRaw);
  const rows: unknown[] = hotPathsIsList ? (hotPathsRaw as unknown[]) : [];
  const hotPathsCount: number | null = hotPathsIsList ? rows.length : null;

  const hotPathsNotProfiledFirst: string[] | null = hotPathsIsList
    ? rows.filter((c) => hasField(c, "profiled_before_optimizing_expert") &&
        (c as Record<string, unknown>)["profiled_before_optimizing_expert"] !== true)
        .map(rowName)
    : null;
  const hotPathsWithNonSkillRoute: string[] | null = hotPathsIsList
    ? rows.filter((c) => hasField(c, "acceleration_route_expert") &&
        !SKILL_ACCELERATION_ROUTES.includes(
          (c as Record<string, unknown>)["acceleration_route_expert"] as string))
        .map(rowName)
    : null;
  let duplicateHotPathNames: string[] | null = null;
  if (hotPathsIsList) {
    const seen: string[] = [];
    duplicateHotPathNames = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["name"] === "string") {
        const nm = c["name"] as string;
        if (seen.includes(nm) && !duplicateHotPathNames.includes(nm)) {
          duplicateHotPathNames.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const profiledFirstCoverage: number | null =
    hotPathsIsList && hotPathsCount !== null && hotPathsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["profiled_before_optimizing_expert"] === true).length / hotPathsCount
      : null;
  const skillRouteCoverage: number | null =
    hotPathsIsList && hotPathsCount !== null && hotPathsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          SKILL_ACCELERATION_ROUTES.includes(
            c["acceleration_route_expert"] as string)).length / hotPathsCount
      : null;

  // ---- Section 1: expert_typing_and_idiomatic_style ----
  boolCheck(results, "expert_typing_and_idiomatic_style",
    "expert_type_hints_cover_all_functions", manifest,
    ["expert_typing", "type_hints_cover_all_functions_expert"],
    "expert typing: type hints everywhere — all functions are hinted, not only public ones");
  boolCheck(results, "expert_typing_and_idiomatic_style",
    "expert_strict_type_checker_mode_where_feasible", manifest,
    ["expert_typing", "strict_type_checker_mode_where_feasible_expert"],
    "expert typing: mypy/pyright runs strict where feasible");
  boolCheck(results, "expert_typing_and_idiomatic_style",
    "expert_types_used_as_executable_documentation", manifest,
    ["expert_typing", "types_used_as_executable_documentation_expert"],
    "expert typing: types are treated as executable documentation");
  boolCheck(results, "expert_typing_and_idiomatic_style",
    "expert_structured_data_via_dataclasses_or_pydantic", manifest,
    ["expert_idioms", "structured_data_modelled_with_dataclasses_or_pydantic_expert"],
    "expert idioms: structured data is modelled with dataclasses / pydantic");
  boolCheck(results, "expert_typing_and_idiomatic_style",
    "expert_pathlib_preferred_over_os_path", manifest,
    ["expert_idioms", "pathlib_preferred_over_os_path_expert"],
    "expert idioms: pathlib is used over os.path");
  boolCheck(results, "expert_typing_and_idiomatic_style",
    "expert_f_strings_used_for_formatting", manifest,
    ["expert_idioms", "f_strings_used_for_formatting_expert"],
    "expert idioms: f-strings are used for formatting");
  boolCheck(results, "expert_typing_and_idiomatic_style",
    "expert_context_managers_used_for_resources", manifest,
    ["expert_idioms", "context_managers_used_for_resources_expert"],
    "expert idioms: context managers are used for resources");
  boolCheck(results, "expert_typing_and_idiomatic_style",
    "expert_enumerate_and_zip_over_manual_indexing", manifest,
    ["expert_idioms", "enumerate_and_zip_used_over_manual_indexing_expert"],
    "expert idioms: enumerate/zip are used over manual indexing");
  boolCheck(results, "expert_typing_and_idiomatic_style",
    "expert_comprehensions_preferred_over_manual_loops", manifest,
    ["expert_idioms", "comprehensions_preferred_over_manual_loops_expert"],
    "expert idioms: comprehensions are preferred over manual loops");

  // ---- Section 2: expert_packaging_and_module_boundaries ----
  boolCheck(results, "expert_packaging_and_module_boundaries",
    "expert_venv_pip_pythonpath_environment_declared", manifest,
    ["expert_packaging", "venv_pip_pythonpath_environment_declared_expert"],
    "expert packaging: the environment is venv + pip + PYTHONPATH");
  boolCheck(results, "expert_packaging_and_module_boundaries",
    "expert_pyproject_toml_declares_project", manifest,
    ["expert_packaging", "pyproject_toml_declares_project_expert"],
    "expert packaging: pyproject.toml declares the project");
  boolCheck(results, "expert_packaging_and_module_boundaries",
    "expert_requirements_pinned", manifest,
    ["expert_packaging", "requirements_pinned_expert"],
    "expert packaging: requirements are pinned");
  boolCheck(results, "expert_packaging_and_module_boundaries",
    "expert_reproducible_environment_without_containers", manifest,
    ["expert_packaging", "reproducible_environment_without_containers_expert"],
    "expert packaging: the environment is reproducible without containers");
  boolCheck(results, "expert_packaging_and_module_boundaries",
    "expert_src_layout_used", manifest,
    ["expert_packaging", "src_layout_used_expert"],
    "expert packaging: src/ layout is used");
  boolCheck(results, "expert_packaging_and_module_boundaries",
    "expert_clear_module_boundaries_declared", manifest,
    ["expert_packaging", "clear_module_boundaries_declared_expert"],
    "expert packaging: module boundaries are clear");
  boolCheck(results, "expert_packaging_and_module_boundaries",
    "expert_no_circular_imports_declared", manifest,
    ["expert_packaging", "no_circular_imports_declared_expert"],
    "expert packaging: no circular imports");
  boolCheck(results, "expert_packaging_and_module_boundaries",
    "expert_main_guard_on_entry_modules", manifest,
    ["expert_packaging", "main_guard_on_entry_modules_expert"],
    "expert packaging: entry modules carry if __name__ == \"__main__\": guards");

  // ---- Section 3: expert_async_concurrency ----
  boolCheck(results, "expert_async_concurrency",
    "expert_asyncio_used_for_async_paths", manifest,
    ["expert_async", "asyncio_used_for_async_paths_expert"],
    "expert async: asyncio is used for async paths");
  boolCheck(results, "expert_async_concurrency",
    "expert_taskgroup_structured_concurrency_used", manifest,
    ["expert_async", "taskgroup_structured_concurrency_used_expert"],
    "expert async: structured concurrency with TaskGroup is used");
  boolCheck(results, "expert_async_concurrency",
    "expert_no_blocking_calls_in_async_paths", manifest,
    ["expert_async", "no_blocking_calls_in_async_paths_expert"],
    "expert async: no blocking code is called in an async path");
  boolCheck(results, "expert_async_concurrency",
    "expert_blocking_work_offloaded_to_thread_or_process_pool", manifest,
    ["expert_async", "blocking_work_offloaded_to_thread_or_process_pool_expert"],
    "expert async: blocking work is pushed to a thread/process pool");
  boolCheck(results, "expert_async_concurrency",
    "expert_async_http_via_httpx_or_aiohttp", manifest,
    ["expert_async", "async_http_via_httpx_or_aiohttp_expert"],
    "expert async: httpx/aiohttp are used for async IO");

  // ---- Section 4: expert_performance_and_profiling ----
  boolCheck(results, "expert_performance_and_profiling",
    "expert_profiling_before_optimizing_declared", manifest,
    ["expert_performance", "profiling_before_optimizing_declared_expert"],
    "expert performance: profiling happens before optimizing");
  boolCheck(results, "expert_performance_and_profiling",
    "expert_profiler_tooling_cprofile_or_py_spy_declared", manifest,
    ["expert_performance", "profiler_tooling_cprofile_or_py_spy_declared_expert"],
    "expert performance: the profiler is cProfile or py-spy");
  boolCheck(results, "expert_performance_and_profiling",
    "expert_numpy_vectorization_where_data_parallel", manifest,
    ["expert_performance", "numpy_vectorization_applied_where_data_parallel_expert"],
    "expert performance: data-parallel work is vectorized with numpy");
  boolCheck(results, "expert_performance_and_profiling",
    "expert_cold_code_left_un_micro_optimized", manifest,
    ["expert_performance", "cold_code_left_un_micro_optimized_expert"],
    "expert performance: cold code is not micro-optimized");
  check(results, "expert_performance_and_profiling",
    "expert_hot_paths_declared", hotPathsRaw, hotPathsIsList,
    hotPathsIsList,
    "the declared record names its hot paths — the hot_paths list is present; an empty list declares that the record has no hot paths");
  const profiledPresent = hotPathsIsList &&
    rows.every((c) => hasField(c, "profiled_before_optimizing_expert"));
  check(results, "expert_performance_and_profiling",
    "expert_every_hot_path_profiled_before_optimizing", hotPathsRaw, profiledPresent,
    hotPathsIsList &&
      rows.every((c) => isPyDict(c) &&
        c["profiled_before_optimizing_expert"] === true),
    "expert performance: every declared hot path was profiled before optimizing");
  const routePresent = hotPathsIsList &&
    rows.every((c) => hasField(c, "acceleration_route_expert"));
  check(results, "expert_performance_and_profiling",
    "expert_every_hot_path_uses_skill_named_acceleration_route", hotPathsRaw, routePresent,
    hotPathsIsList &&
      rows.every((c) => isPyDict(c) &&
        SKILL_ACCELERATION_ROUTES.includes(
          c["acceleration_route_expert"] as string)),
    "expert performance: every declared hot path names a skill-named acceleration route — rust_pyo3, c_extension or numpy_vectorization");
  const hotNamePresent = hotPathsIsList &&
    rows.every((c) => hasField(c, "name"));
  check(results, "expert_performance_and_profiling",
    "expert_no_hot_path_name_duplicated", hotPathsRaw, hotNamePresent,
    hotPathsIsList && duplicateHotPathNames !== null &&
      duplicateHotPathNames.length === 0,
    "expert performance: no declared hot-path name is owned by more than one hot-path row");

  // ---- Section 5: expert_api_and_cli_surfaces ----
  boolCheck(results, "expert_api_and_cli_surfaces",
    "expert_fastapi_used_for_typed_services", manifest,
    ["expert_surfaces", "fastapi_used_for_typed_services_expert"],
    "expert surfaces: FastAPI is used for typed services");
  boolCheck(results, "expert_api_and_cli_surfaces",
    "expert_pydantic_contracts_on_api_boundaries", manifest,
    ["expert_surfaces", "pydantic_contracts_on_api_boundaries_expert"],
    "expert surfaces: APIs carry pydantic contracts");
  boolCheck(results, "expert_api_and_cli_surfaces",
    "expert_api_health_endpoint_provided", manifest,
    ["expert_surfaces", "api_health_endpoint_provided_expert"],
    "expert surfaces: an /api/health endpoint is provided");
  boolCheck(results, "expert_api_and_cli_surfaces",
    "expert_cli_built_with_argparse_or_typer", manifest,
    ["expert_surfaces", "cli_built_with_argparse_or_typer_expert"],
    "expert surfaces: CLIs are built with argparse/typer");
  boolCheck(results, "expert_api_and_cli_surfaces",
    "expert_cli_sane_exit_codes_declared", manifest,
    ["expert_surfaces", "cli_sane_exit_codes_declared_expert"],
    "expert surfaces: CLIs use sane exit codes");
  boolCheck(results, "expert_api_and_cli_surfaces",
    "expert_cli_pipe_friendly_output_declared", manifest,
    ["expert_surfaces", "cli_pipe_friendly_output_declared_expert"],
    "expert surfaces: CLI output is pipe-friendly");

  // ---- Section 6: expert_testing_and_tooling ----
  boolCheck(results, "expert_testing_and_tooling",
    "expert_pytest_fixtures_and_parametrize_used", manifest,
    ["expert_testing", "pytest_fixtures_and_parametrize_used_expert"],
    "expert testing: pytest is used with fixtures and parametrize");
  boolCheck(results, "expert_testing_and_tooling",
    "expert_hypothesis_property_tests_on_core_logic", manifest,
    ["expert_testing", "hypothesis_property_tests_on_core_logic_expert"],
    "expert testing: hypothesis property-based tests cover core logic");
  boolCheck(results, "expert_testing_and_tooling",
    "expert_coverage_measured_on_critical_path", manifest,
    ["expert_testing", "coverage_measured_on_critical_path_expert"],
    "expert testing: coverage is measured on the critical path");
  boolCheck(results, "expert_testing_and_tooling",
    "expert_ruff_lint_and_format_applied", manifest,
    ["expert_testing", "ruff_lint_and_format_applied_expert"],
    "expert tooling: ruff (lint + format) is applied");
  boolCheck(results, "expert_testing_and_tooling",
    "expert_mypy_run_as_tooling_gate", manifest,
    ["expert_testing", "mypy_run_as_tooling_gate_expert"],
    "expert tooling: mypy is run as a tooling gate");
  boolCheck(results, "expert_testing_and_tooling",
    "expert_pre_commit_hooks_configured", manifest,
    ["expert_testing", "pre_commit_hooks_configured_expert"],
    "expert tooling: pre-commit hooks are configured");
  boolCheck(results, "expert_testing_and_tooling",
    "expert_failures_loud_in_development", manifest,
    ["expert_testing", "failures_loud_in_development_expert"],
    "expert tooling: failures are loud in development");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "expert_no_untyped_sprawling_scripts", manifest,
    ["red_lines", "untyped_sprawling_script_present"],
    "red line: no untyped sprawling scripts are present in the record");
  falseCheck(results, "red_lines",
    "expert_no_mutable_default_arguments", manifest,
    ["red_lines", "mutable_default_arguments_present"],
    "red line: no mutable default arguments are present in the record");
  falseCheck(results, "red_lines",
    "expert_no_bare_except_clauses", manifest,
    ["red_lines", "bare_except_present"],
    "red line: no bare except: clauses are present in the record");
  falseCheck(results, "red_lines",
    "expert_no_hidden_global_state", manifest,
    ["red_lines", "hidden_global_state_present"],
    "red line: no hidden global state is present in the record");
  falseCheck(results, "red_lines",
    "expert_no_docker_substitute_for_venv_fix", manifest,
    ["red_lines", "docker_used_to_paper_over_venv_problem_present"],
    "red line: Docker is not reached for to paper over an environment problem that venv solves");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY";
  }

  const computedNames = [
    "expert_hot_paths_declared",
    "expert_every_hot_path_profiled_before_optimizing",
    "expert_every_hot_path_uses_skill_named_acceleration_route",
    "expert_no_hot_path_name_duplicated",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "production-python-engineering-pack-expert",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    hot_paths_count: hotPathsCount,
    hot_paths_not_profiled_first: hotPathsNotProfiledFirst,
    hot_paths_with_non_skill_route: hotPathsWithNonSkillRoute,
    profiled_first_coverage: fmt6(profiledFirstCoverage),
    skill_route_coverage: fmt6(skillRouteCoverage),
    duplicate_hot_path_names: duplicateHotPathNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PRODUCTION PYTHON ENGINEERING PACK EXPERT",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
