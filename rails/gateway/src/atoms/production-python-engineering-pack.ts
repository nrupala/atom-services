// Production Python engineering pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/production-python-engineering-pack/src/production_python_engineering_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  project: "string",
  environment: {
    virtualenv_per_project_used: "boolean",
    dependencies_declared_in_pyproject: "boolean",
    dependency_lockfile_present: "boolean",
    no_installs_into_system_python: "boolean",
  },
  dependencies: [{
    name: "string",
    version_pinned: "boolean",
  }],
  typing: {
    public_functions_annotated: "boolean",
    type_checker_run_in_loop: "boolean",
    typed_models_at_boundaries_for_validation: "boolean",
  },
  style: {
    ruff_linter_configured: "boolean",
    formatter_ruff_format_or_black_configured: "boolean",
    no_mutable_default_arguments: "boolean",
    f_strings_used_for_formatting: "boolean",
    pathlib_used_over_string_paths: "boolean",
  },
  errors: {
    specific_exceptions_caught: "boolean",
    errors_fail_loudly_with_context: "boolean",
    logging_used_not_print_in_libraries: "boolean",
  },
  resources: {
    context_managers_used_for_files_sockets_locks: "boolean",
    orphaned_handles_avoided: "boolean",
  },
  async_practices: {
    no_blocking_calls_in_event_loops: "boolean",
    timeouts_on_every_network_call: "boolean",
    structured_concurrency_used_where_possible: "boolean",
  },
  testing: {
    pytest_suite_present: "boolean",
    pytest_fixtures_used: "boolean",
    pytest_parametrize_used: "boolean",
    error_paths_tested_under_pytest: "boolean",
    time_and_randomness_frozen_in_tests: "boolean",
    unit_tests_fast_declared: "boolean",
    pytest_green_including_error_paths: "boolean",
  },
  packaging: {
    pyproject_metadata_present: "boolean",
    console_entry_points_declared: "boolean",
    reproducible_builds_declared: "boolean",
    production_dependencies_pinned: "boolean",
    ruff_and_type_checker_clean_on_diff: "boolean",
    virtualenv_reproducible_declared: "boolean",
  },
  red_lines: {
    secrets_in_code_or_notebooks_present: "boolean",
    unpinned_pip_install_in_production_paths_present: "boolean",
    bare_except_present: "boolean",
  },
};

export const SECTIONS = [
  "environment_and_dependencies",
  "typing_and_style",
  "errors_resources_and_async",
  "testing_discipline",
  "packaging_and_reproducibility",
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
  dependencies_count: number | null;
  dependencies_without_pin: string[] | null;
  pin_coverage: string | null;
  duplicate_dependency_names: string[] | null;
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

  const [dependenciesRaw, hasDependencies] = getPath(manifest, "dependencies");
  const dependenciesIsList = hasDependencies && Array.isArray(dependenciesRaw);
  const rows: unknown[] = dependenciesIsList ? (dependenciesRaw as unknown[]) : [];
  const dependenciesCount: number | null = dependenciesIsList ? rows.length : null;

  const dependenciesWithoutPin: string[] | null = dependenciesIsList
    ? rows.filter((c) => hasField(c, "version_pinned") &&
        (c as Record<string, unknown>)["version_pinned"] !== true)
        .map(rowName)
    : null;
  let duplicateDependencyNames: string[] | null = null;
  if (dependenciesIsList) {
    const seen: string[] = [];
    duplicateDependencyNames = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["name"] === "string") {
        const nm = c["name"] as string;
        if (seen.includes(nm) && !duplicateDependencyNames.includes(nm)) {
          duplicateDependencyNames.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const pinCoverage: number | null =
    dependenciesIsList && dependenciesCount !== null && dependenciesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["version_pinned"] === true).length / dependenciesCount
      : null;

  // ---- Section 1: environment_and_dependencies ----
  boolCheck(results, "environment_and_dependencies",
    "virtualenv_per_project_used", manifest,
    ["environment", "virtualenv_per_project_used"],
    "environment: one virtualenv is used per project");
  boolCheck(results, "environment_and_dependencies",
    "dependencies_declared_in_pyproject", manifest,
    ["environment", "dependencies_declared_in_pyproject"],
    "environment: dependencies are declared in pyproject.toml");
  boolCheck(results, "environment_and_dependencies",
    "dependency_lockfile_present", manifest,
    ["environment", "dependency_lockfile_present"],
    "environment: dependencies are pinned in pyproject.toml plus a lock — a lockfile is present");
  boolCheck(results, "environment_and_dependencies",
    "no_installs_into_system_python", manifest,
    ["environment", "no_installs_into_system_python"],
    "environment: nothing is installed into system Python");
  check(results, "environment_and_dependencies",
    "dependencies_declared", dependenciesRaw, dependenciesIsList,
    dependenciesIsList,
    "the declared record names its dependencies — the dependencies list is present; an empty list declares that the project has no third-party dependencies");
  const pinPresent = dependenciesIsList &&
    rows.every((c) => hasField(c, "version_pinned"));
  check(results, "environment_and_dependencies",
    "every_dependency_version_pinned", dependenciesRaw, pinPresent,
    dependenciesIsList &&
      rows.every((c) => isPyDict(c) &&
        c["version_pinned"] === true),
    "dependencies: every declared dependency row declares its version pinned — dependencies are pinned and no unpinned install reaches production paths");
  const depNamePresent = dependenciesIsList &&
    rows.every((c) => hasField(c, "name"));
  check(results, "environment_and_dependencies",
    "no_dependency_name_duplicated", dependenciesRaw, depNamePresent,
    dependenciesIsList && duplicateDependencyNames !== null &&
      duplicateDependencyNames.length === 0,
    "dependencies: no declared dependency name is owned by more than one dependency row");

  // ---- Section 2: typing_and_style ----
  boolCheck(results, "typing_and_style",
    "public_functions_annotated", manifest,
    ["typing", "public_functions_annotated"],
    "typing: public functions are annotated");
  boolCheck(results, "typing_and_style",
    "type_checker_run_in_loop", manifest,
    ["typing", "type_checker_run_in_loop"],
    "typing: mypy or pyright runs in the development loop");
  boolCheck(results, "typing_and_style",
    "typed_models_at_boundaries_for_validation", manifest,
    ["typing", "typed_models_at_boundaries_for_validation"],
    "typing: dataclasses or Pydantic models validate at the boundaries");
  boolCheck(results, "typing_and_style",
    "ruff_linter_configured", manifest,
    ["style", "ruff_linter_configured"],
    "style: ruff is configured as the linter");
  boolCheck(results, "typing_and_style",
    "formatter_ruff_format_or_black_configured", manifest,
    ["style", "formatter_ruff_format_or_black_configured"],
    "style: a formatter — ruff format or black — is configured");
  boolCheck(results, "typing_and_style",
    "no_mutable_default_arguments", manifest,
    ["style", "no_mutable_default_arguments"],
    "style: no mutable default arguments are used");
  boolCheck(results, "typing_and_style",
    "f_strings_used_for_formatting", manifest,
    ["style", "f_strings_used_for_formatting"],
    "style: f-strings are used for string formatting");
  boolCheck(results, "typing_and_style",
    "pathlib_used_over_string_paths", manifest,
    ["style", "pathlib_used_over_string_paths"],
    "style: pathlib is used over string paths");

  // ---- Section 3: errors_resources_and_async ----
  boolCheck(results, "errors_resources_and_async",
    "specific_exceptions_caught", manifest,
    ["errors", "specific_exceptions_caught"],
    "errors: specific exceptions are caught, not blanket handlers");
  boolCheck(results, "errors_resources_and_async",
    "errors_fail_loudly_with_context", manifest,
    ["errors", "errors_fail_loudly_with_context"],
    "errors: failures are loud and carry context");
  boolCheck(results, "errors_resources_and_async",
    "logging_used_not_print_in_libraries", manifest,
    ["errors", "logging_used_not_print_in_libraries"],
    "errors: libraries log with the logging module — never print in libraries");
  boolCheck(results, "errors_resources_and_async",
    "context_managers_used_for_files_sockets_locks", manifest,
    ["resources", "context_managers_used_for_files_sockets_locks"],
    "resources: context managers are used for files, sockets and locks");
  boolCheck(results, "errors_resources_and_async",
    "orphaned_handles_avoided", manifest,
    ["resources", "orphaned_handles_avoided"],
    "resources: no orphaned handles are left behind");
  boolCheck(results, "errors_resources_and_async",
    "no_blocking_calls_in_event_loops", manifest,
    ["async_practices", "no_blocking_calls_in_event_loops"],
    "async discipline: no blocking calls run in event loops");
  boolCheck(results, "errors_resources_and_async",
    "timeouts_on_every_network_call", manifest,
    ["async_practices", "timeouts_on_every_network_call"],
    "async discipline: every network call carries a timeout");
  boolCheck(results, "errors_resources_and_async",
    "structured_concurrency_used_where_possible", manifest,
    ["async_practices", "structured_concurrency_used_where_possible"],
    "async discipline: structured concurrency is used where possible");

  // ---- Section 4: testing_discipline ----
  boolCheck(results, "testing_discipline",
    "pytest_suite_present", manifest,
    ["testing", "pytest_suite_present"],
    "tests: the test suite runs under pytest");
  boolCheck(results, "testing_discipline",
    "pytest_fixtures_used", manifest,
    ["testing", "pytest_fixtures_used"],
    "tests: pytest fixtures are used");
  boolCheck(results, "testing_discipline",
    "pytest_parametrize_used", manifest,
    ["testing", "pytest_parametrize_used"],
    "tests: pytest parametrize is used for case tables");
  boolCheck(results, "testing_discipline",
    "error_paths_tested_under_pytest", manifest,
    ["testing", "error_paths_tested_under_pytest"],
    "tests: error paths are tested, not only happy paths");
  boolCheck(results, "testing_discipline",
    "time_and_randomness_frozen_in_tests", manifest,
    ["testing", "time_and_randomness_frozen_in_tests"],
    "tests: time and randomness are frozen where the tests depend on them");
  boolCheck(results, "testing_discipline",
    "unit_tests_fast_declared", manifest,
    ["testing", "unit_tests_fast_declared"],
    "tests: unit tests are kept fast, as declared");
  boolCheck(results, "testing_discipline",
    "pytest_green_including_error_paths", manifest,
    ["testing", "pytest_green_including_error_paths"],
    "tests: pytest is green, including the error-path tests");

  // ---- Section 5: packaging_and_reproducibility ----
  boolCheck(results, "packaging_and_reproducibility",
    "pyproject_metadata_present", manifest,
    ["packaging", "pyproject_metadata_present"],
    "packaging: pyproject carries the package metadata");
  boolCheck(results, "packaging_and_reproducibility",
    "console_entry_points_declared", manifest,
    ["packaging", "console_entry_points_declared"],
    "packaging: console entry points are declared");
  boolCheck(results, "packaging_and_reproducibility",
    "reproducible_builds_declared", manifest,
    ["packaging", "reproducible_builds_declared"],
    "packaging: builds are reproducible, as declared");
  boolCheck(results, "packaging_and_reproducibility",
    "production_dependencies_pinned", manifest,
    ["packaging", "production_dependencies_pinned"],
    "packaging: dependencies are pinned for production");
  boolCheck(results, "packaging_and_reproducibility",
    "ruff_and_type_checker_clean_on_diff", manifest,
    ["packaging", "ruff_and_type_checker_clean_on_diff"],
    "quality gate: ruff and the type checker are clean on the diff");
  boolCheck(results, "packaging_and_reproducibility",
    "virtualenv_reproducible_declared", manifest,
    ["packaging", "virtualenv_reproducible_declared"],
    "quality gate: the virtualenv is reproducible, as declared");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "no_secrets_in_code_or_notebooks", manifest,
    ["red_lines", "secrets_in_code_or_notebooks_present"],
    "red line: no secrets in code or notebooks are present — secrets live in env or a keystore");
  falseCheck(results, "red_lines",
    "no_unpinned_pip_install_in_production_paths", manifest,
    ["red_lines", "unpinned_pip_install_in_production_paths_present"],
    "red line: no unpinned pip install is present in production paths");
  falseCheck(results, "red_lines",
    "no_bare_except_clauses", manifest,
    ["red_lines", "bare_except_present"],
    "red line: no bare except clauses are present");

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
    verdict = "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PRODUCTION_PYTHON_ENGINEERING_PACK_READY";
  }

  const computedNames = [
    "dependencies_declared",
    "every_dependency_version_pinned",
    "no_dependency_name_duplicated",
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
    service: "production-python-engineering-pack",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    dependencies_count: dependenciesCount,
    dependencies_without_pin: dependenciesWithoutPin,
    pin_coverage: fmt6(pinCoverage),
    duplicate_dependency_names: duplicateDependencyNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PRODUCTION PYTHON ENGINEERING PACK",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
