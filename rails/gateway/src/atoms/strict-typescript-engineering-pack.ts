// Strict TypeScript engineering pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/strict-typescript-engineering-pack/src/strict_typescript_engineering_pack.py
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
  tsconfig: {
    strict_true_enabled: "boolean",
    no_unchecked_indexed_access_enabled: "boolean",
    tsc_no_emit_in_development_loop: "boolean",
    tsc_no_emit_clean_under_strict: "boolean",
  },
  typing: {
    unknown_used_and_narrowed_instead_of_any: "boolean",
    no_any_in_src: "boolean",
    casts_avoided_or_remaining_justified: "boolean",
    non_null_assertion_chains_absent: "boolean",
  },
  boundary_validation: {
    external_input_validated_with_schema: "boolean",
    parse_not_trust_at_edges: "boolean",
  },
  boundaries: [{
    name: "string",
    schema_validated: "boolean",
    schema_tested: "boolean",
  }],
  state_modelling: {
    discriminated_unions_for_status_machines: "boolean",
    exhaustive_switch_with_never_check: "boolean",
    illegal_states_unrepresentable_by_design: "boolean",
  },
  module_structure: {
    small_files_kept: "boolean",
    deep_imports_preferred_over_barrel_files: "boolean",
    explicit_public_surfaces: "boolean",
  },
  modules: [{
    name: "string",
    any_free: "boolean",
    explicit_public_surface: "boolean",
  }],
  async_practices: {
    all_promises_awaited_or_handled: "boolean",
    no_floating_promises: "boolean",
    promise_handling_lint_rule_enabled: "boolean",
    abort_controller_for_cancellable_work: "boolean",
  },
  testing: {
    unit_tests_for_logic_with_vitest: "boolean",
    integration_tests_at_module_edges: "boolean",
    types_tested_by_compilation: "boolean",
  },
  build_tooling: {
    tsc_for_types_and_bundler_for_bundling: "boolean",
    source_maps_enabled: "boolean",
    dependencies_pinned: "boolean",
    lint_clean: "boolean",
  },
  red_lines: {
    ts_ignore_or_ts_expect_error_without_tracked_reason_present: "boolean",
    unvalidated_runtime_shapes_assumed_present: "boolean",
    any_in_src_present: "boolean",
    floating_promises_present: "boolean",
  },
};

export const SECTIONS = [
  "strict_tsconfig_and_compiler_gate",
  "typing_discipline_no_any",
  "typed_boundaries_and_schema_validation",
  "state_modelling_with_discriminated_unions",
  "module_structure_and_declared_modules",
  "async_and_cancellation_discipline",
  "tests_build_and_tooling",
  "typescript_red_lines",
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
  boundaries_count: number | null;
  modules_count: number | null;
  boundaries_without_schema_validation: string[] | null;
  boundaries_without_schema_tests: string[] | null;
  modules_not_any_free: string[] | null;
  modules_without_explicit_public_surface: string[] | null;
  strict_flag_coverage: string | null;
  schema_validation_coverage: string | null;
  schema_test_coverage: string | null;
  any_free_coverage: string | null;
  explicit_public_surface_coverage: string | null;
  duplicate_boundary_names: string[] | null;
  duplicate_module_names: string[] | null;
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

function duplicates(rows: unknown[]): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c["name"] === "string") {
      const nm = c["name"] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function without(rows: unknown[], field: string): string[] {
  return rows
    .filter((c) => hasField(c, field) &&
      (c as Record<string, unknown>)[field] !== true)
    .map(rowName);
}

function coverage(
  rows: unknown[],
  field: string,
  count: number | null,
): number | null {
  if (count === null || count === 0) return null;
  return rows.filter((c) => isPyDict(c) && c[field] === true).length / count;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [boundariesRaw, hasBoundaries] = getPath(manifest, "boundaries");
  const boundariesIsList = hasBoundaries && Array.isArray(boundariesRaw);
  const brows: unknown[] = boundariesIsList ? (boundariesRaw as unknown[]) : [];
  const boundariesCount: number | null = boundariesIsList ? brows.length : null;

  const [modulesRaw, hasModules] = getPath(manifest, "modules");
  const modulesIsList = hasModules && Array.isArray(modulesRaw);
  const mrows: unknown[] = modulesIsList ? (modulesRaw as unknown[]) : [];
  const modulesCount: number | null = modulesIsList ? mrows.length : null;

  const boundariesWithoutSchema: string[] | null = boundariesIsList
    ? without(brows, "schema_validated") : null;
  const boundariesWithoutSchemaTests: string[] | null = boundariesIsList
    ? without(brows, "schema_tested") : null;
  const duplicateBoundaryNames: string[] | null = boundariesIsList
    ? duplicates(brows) : null;
  const modulesNotAnyFree: string[] | null = modulesIsList
    ? without(mrows, "any_free") : null;
  const modulesWithoutSurface: string[] | null = modulesIsList
    ? without(mrows, "explicit_public_surface") : null;
  const duplicateModuleNames: string[] | null = modulesIsList
    ? duplicates(mrows) : null;

  const schemaValidationCoverage: number | null = boundariesIsList
    ? coverage(brows, "schema_validated", boundariesCount) : null;
  const schemaTestCoverage: number | null = boundariesIsList
    ? coverage(brows, "schema_tested", boundariesCount) : null;
  const anyFreeCoverage: number | null = modulesIsList
    ? coverage(mrows, "any_free", modulesCount) : null;
  const explicitSurfaceCoverage: number | null = modulesIsList
    ? coverage(mrows, "explicit_public_surface", modulesCount) : null;

  const [strictVal, strictPresent] = getPath(manifest, "tsconfig", "strict_true_enabled");
  const [nuiVal, nuiPresent] = getPath(manifest, "tsconfig", "no_unchecked_indexed_access_enabled");
  const strictFlagCoverage: number | null = strictPresent && nuiPresent
    ? ((strictVal === true ? 1 : 0) + (nuiVal === true ? 1 : 0)) / 2
    : null;

  // ---- Section 1: strict_tsconfig_and_compiler_gate ----
  boolCheck(results, "strict_tsconfig_and_compiler_gate",
    "ts_strict_true_enabled", manifest,
    ["tsconfig", "strict_true_enabled"],
    "strict tsconfig: strict mode is always on - the tsconfig declares strict true");
  boolCheck(results, "strict_tsconfig_and_compiler_gate",
    "ts_no_unchecked_indexed_access_enabled", manifest,
    ["tsconfig", "no_unchecked_indexed_access_enabled"],
    "strict tsconfig: noUncheckedIndexedAccess is enabled alongside strict");
  boolCheck(results, "strict_tsconfig_and_compiler_gate",
    "ts_tsc_no_emit_in_loop", manifest,
    ["tsconfig", "tsc_no_emit_in_development_loop"],
    "strict tsconfig: tsc --noEmit runs in the development loop");
  boolCheck(results, "strict_tsconfig_and_compiler_gate",
    "ts_tsc_no_emit_clean_under_strict", manifest,
    ["tsconfig", "tsc_no_emit_clean_under_strict"],
    "quality gate: tsc --noEmit is clean under strict");

  // ---- Section 2: typing_discipline_no_any ----
  boolCheck(results, "typing_discipline_no_any",
    "ts_unknown_narrowed_instead_of_any", manifest,
    ["typing", "unknown_used_and_narrowed_instead_of_any"],
    "typing discipline: unknown is used and narrowed instead of any");
  boolCheck(results, "typing_discipline_no_any",
    "ts_src_declared_any_free", manifest,
    ["typing", "no_any_in_src"],
    "typing discipline: no any appears in src");
  boolCheck(results, "typing_discipline_no_any",
    "ts_casts_avoided_or_justified", manifest,
    ["typing", "casts_avoided_or_remaining_justified"],
    "typing discipline: as casts are avoided, and any that remain are justified");
  boolCheck(results, "typing_discipline_no_any",
    "ts_non_null_assertion_chains_absent", manifest,
    ["typing", "non_null_assertion_chains_absent"],
    "typing discipline: no non-null assertion chains are used");

  // ---- Section 3: typed_boundaries_and_schema_validation ----
  boolCheck(results, "typed_boundaries_and_schema_validation",
    "ts_external_input_schema_validated", manifest,
    ["boundary_validation", "external_input_validated_with_schema"],
    "typed boundaries: external input - API, storage, env - is validated with a schema such as zod or valibot");
  boolCheck(results, "typed_boundaries_and_schema_validation",
    "ts_boundaries_parse_not_trust", manifest,
    ["boundary_validation", "parse_not_trust_at_edges"],
    "typed boundaries: boundaries parse rather than trust - validate at the edges and trust the compiler inside");
  check(results, "typed_boundaries_and_schema_validation",
    "ts_boundaries_declared", boundariesRaw, boundariesIsList,
    boundariesIsList,
    "the declared record names its boundaries - the boundaries list is present; an empty list declares that the codebase has no external boundaries");
  const schemaPresent = boundariesIsList &&
    brows.every((c) => hasField(c, "schema_validated"));
  check(results, "typed_boundaries_and_schema_validation",
    "every_ts_boundary_schema_validated", boundariesRaw, schemaPresent,
    boundariesIsList &&
      brows.every((c) => isPyDict(c) && c["schema_validated"] === true),
    "boundaries: every declared boundary row declares schema validation");
  const schemaTestPresent = boundariesIsList &&
    brows.every((c) => hasField(c, "schema_tested"));
  check(results, "typed_boundaries_and_schema_validation",
    "every_ts_boundary_schema_tested", boundariesRaw, schemaTestPresent,
    boundariesIsList &&
      brows.every((c) => isPyDict(c) && c["schema_tested"] === true),
    "boundaries: every declared boundary row declares its schema is tested");
  const bnamePresent = boundariesIsList &&
    brows.every((c) => hasField(c, "name"));
  check(results, "typed_boundaries_and_schema_validation",
    "no_ts_boundary_name_duplicated", boundariesRaw, bnamePresent,
    boundariesIsList && duplicateBoundaryNames !== null &&
      duplicateBoundaryNames.length === 0,
    "boundaries: no declared boundary name is owned by more than one row");

  // ---- Section 4: state_modelling_with_discriminated_unions ----
  boolCheck(results, "state_modelling_with_discriminated_unions",
    "ts_status_machines_as_discriminated_unions", manifest,
    ["state_modelling", "discriminated_unions_for_status_machines"],
    "state modelling: status machines are modelled as discriminated unions");
  boolCheck(results, "state_modelling_with_discriminated_unions",
    "ts_exhaustive_switch_never_check", manifest,
    ["state_modelling", "exhaustive_switch_with_never_check"],
    "state modelling: switches are exhaustive with a never check");
  boolCheck(results, "state_modelling_with_discriminated_unions",
    "ts_illegal_states_unrepresentable", manifest,
    ["state_modelling", "illegal_states_unrepresentable_by_design"],
    "state modelling: illegal states are made unrepresentable by the type design");

  // ---- Section 5: module_structure_and_declared_modules ----
  boolCheck(results, "module_structure_and_declared_modules",
    "ts_small_module_files_kept", manifest,
    ["module_structure", "small_files_kept"],
    "modules: module files are kept small");
  boolCheck(results, "module_structure_and_declared_modules",
    "ts_deep_imports_over_cycle_hiding_barrels", manifest,
    ["module_structure", "deep_imports_preferred_over_barrel_files"],
    "modules: deep imports are preferred over barrel files that hide cycles");
  boolCheck(results, "module_structure_and_declared_modules",
    "ts_explicit_public_surfaces_declared", manifest,
    ["module_structure", "explicit_public_surfaces"],
    "modules: public surfaces are explicit");
  check(results, "module_structure_and_declared_modules",
    "ts_modules_declared", modulesRaw, modulesIsList,
    modulesIsList,
    "the declared record names its modules - the modules list is present; an empty list declares no module rows");
  const anyFreePresent = modulesIsList &&
    mrows.every((c) => hasField(c, "any_free"));
  check(results, "module_structure_and_declared_modules",
    "every_ts_module_any_free", modulesRaw, anyFreePresent,
    modulesIsList &&
      mrows.every((c) => isPyDict(c) && c["any_free"] === true),
    "modules: every declared module row declares it is any-free");
  const surfacePresent = modulesIsList &&
    mrows.every((c) => hasField(c, "explicit_public_surface"));
  check(results, "module_structure_and_declared_modules",
    "every_ts_module_explicit_public_surface", modulesRaw, surfacePresent,
    modulesIsList &&
      mrows.every((c) => isPyDict(c) && c["explicit_public_surface"] === true),
    "modules: every declared module row declares an explicit public surface");
  const mnamePresent = modulesIsList &&
    mrows.every((c) => hasField(c, "name"));
  check(results, "module_structure_and_declared_modules",
    "no_ts_module_name_duplicated", modulesRaw, mnamePresent,
    modulesIsList && duplicateModuleNames !== null &&
      duplicateModuleNames.length === 0,
    "modules: no declared module name is owned by more than one row");

  // ---- Section 6: async_and_cancellation_discipline ----
  boolCheck(results, "async_and_cancellation_discipline",
    "ts_all_promises_awaited_or_handled", manifest,
    ["async_practices", "all_promises_awaited_or_handled"],
    "async: all promises are awaited or handled");
  boolCheck(results, "async_and_cancellation_discipline",
    "ts_no_floating_promises_declared", manifest,
    ["async_practices", "no_floating_promises"],
    "async: no floating promises are present");
  boolCheck(results, "async_and_cancellation_discipline",
    "ts_promise_handling_lint_rule_enabled", manifest,
    ["async_practices", "promise_handling_lint_rule_enabled"],
    "async: a lint rule enforces that promises are awaited or handled");
  boolCheck(results, "async_and_cancellation_discipline",
    "ts_abort_controller_for_cancellable_work", manifest,
    ["async_practices", "abort_controller_for_cancellable_work"],
    "async: AbortController is used for cancellable work");

  // ---- Section 7: tests_build_and_tooling ----
  boolCheck(results, "tests_build_and_tooling",
    "ts_logic_unit_tested_with_vitest", manifest,
    ["testing", "unit_tests_for_logic_with_vitest"],
    "tests: unit tests for logic run under vitest");
  boolCheck(results, "tests_build_and_tooling",
    "ts_module_edge_integration_tested", manifest,
    ["testing", "integration_tests_at_module_edges"],
    "tests: integration tests run at the module edges");
  boolCheck(results, "tests_build_and_tooling",
    "ts_types_tested_by_compilation", manifest,
    ["testing", "types_tested_by_compilation"],
    "tests: types are tested by compilation");
  boolCheck(results, "tests_build_and_tooling",
    "ts_tsc_for_types_bundler_for_bundling", manifest,
    ["build_tooling", "tsc_for_types_and_bundler_for_bundling"],
    "build: tsc is used for types and esbuild or vite for bundling");
  boolCheck(results, "tests_build_and_tooling",
    "ts_source_maps_enabled", manifest,
    ["build_tooling", "source_maps_enabled"],
    "build: source maps are on");
  boolCheck(results, "tests_build_and_tooling",
    "ts_dependencies_pinned_for_build", manifest,
    ["build_tooling", "dependencies_pinned"],
    "build: dependencies are pinned");
  boolCheck(results, "tests_build_and_tooling",
    "ts_lint_clean_declared", manifest,
    ["build_tooling", "lint_clean"],
    "quality gate: lint is clean");

  // ---- Section 8: typescript_red_lines ----
  falseCheck(results, "typescript_red_lines",
    "ts_no_untracked_ts_ignore_or_expect_error", manifest,
    ["red_lines", "ts_ignore_or_ts_expect_error_without_tracked_reason_present"],
    "red line: no ts-ignore or ts-expect-error without a tracked reason is present in the record");
  falseCheck(results, "typescript_red_lines",
    "ts_no_unvalidated_runtime_shape_assumption", manifest,
    ["red_lines", "unvalidated_runtime_shapes_assumed_present"],
    "red line: no runtime shapes assumed that were not validated are present in the record");
  falseCheck(results, "typescript_red_lines",
    "ts_red_line_any_absent_from_src", manifest,
    ["red_lines", "any_in_src_present"],
    "red line: no any in src is present in the record");
  falseCheck(results, "typescript_red_lines",
    "ts_red_line_floating_promises_absent", manifest,
    ["red_lines", "floating_promises_present"],
    "red line: no floating promises are present in the record");

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
    verdict = "STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "STRICT_TYPESCRIPT_ENGINEERING_PACK_READY";
  }

  const computedNames = [
    "ts_boundaries_declared",
    "every_ts_boundary_schema_validated",
    "every_ts_boundary_schema_tested",
    "no_ts_boundary_name_duplicated",
    "ts_modules_declared",
    "every_ts_module_any_free",
    "every_ts_module_explicit_public_surface",
    "no_ts_module_name_duplicated",
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
    service: "strict-typescript-engineering-pack",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    boundaries_count: boundariesCount,
    modules_count: modulesCount,
    boundaries_without_schema_validation: boundariesWithoutSchema,
    boundaries_without_schema_tests: boundariesWithoutSchemaTests,
    modules_not_any_free: modulesNotAnyFree,
    modules_without_explicit_public_surface: modulesWithoutSurface,
    strict_flag_coverage: fmt6(strictFlagCoverage),
    schema_validation_coverage: fmt6(schemaValidationCoverage),
    schema_test_coverage: fmt6(schemaTestCoverage),
    any_free_coverage: fmt6(anyFreeCoverage),
    explicit_public_surface_coverage: fmt6(explicitSurfaceCoverage),
    duplicate_boundary_names: duplicateBoundaryNames,
    duplicate_module_names: duplicateModuleNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across eight sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "STRICT TYPESCRIPT ENGINEERING PACK",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
