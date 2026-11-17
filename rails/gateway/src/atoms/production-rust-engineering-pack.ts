// Production Rust engineering pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/production-rust-engineering-pack/src/production_rust_engineering_pack.py
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
  ownership: {
    borrow_before_cloning_practised: "boolean",
    lifetimes_kept_local: "boolean",
    owned_data_at_boundaries_borrows_within: "boolean",
    clones_justified_where_present: "boolean",
  },
  errors: {
    error_enums_used_for_fallible_apis: "boolean",
    thiserror_used_for_library_errors: "boolean",
    anyhow_used_for_binary_errors: "boolean",
    question_mark_propagation_used: "boolean",
    no_unwrap_or_expect_in_production_paths: "boolean",
    unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages: "boolean",
  },
  unsafe_policy: {
    unsafe_forbidden_by_default_declared: "boolean",
    unsafe_isolated_in_dedicated_modules: "boolean",
  },
  unsafe_blocks: [{
    location: "string",
    invariant_documented: "boolean",
    tests_covering_block: "boolean",
  }],
  async_runtime: {
    structured_tasks_with_tokio_used: "boolean",
    blocking_calls_absent_from_async_code: "boolean",
    bounded_channels_used: "boolean",
    timeouts_applied_everywhere: "boolean",
  },
  testing: {
    unit_tests_beside_code_present: "boolean",
    integration_tests_in_tests_directory_present: "boolean",
    doc_tests_for_examples_present: "boolean",
    error_paths_tested: "boolean",
    criterion_benchmarks_present: "boolean",
    tests_green_including_failure_paths: "boolean",
  },
  tooling: {
    clippy_clean_with_deny_warnings: "boolean",
    cargo_fmt_check_clean: "boolean",
    lints_fixed_not_silenced_without_reason: "boolean",
  },
  workspace: {
    crates_split_only_at_real_boundaries: "boolean",
    feature_flags_kept_minimal_no_default_bloat: "boolean",
  },
  supply_chain: {
    cargo_audit_run: "boolean",
    msrv_pinned: "boolean",
    new_crates_reviewed_before_adoption: "boolean",
  },
  red_lines: {
    blocking_work_inside_async_present: "boolean",
    unbounded_channels_present: "boolean",
    spawn_loops_without_backpressure_present: "boolean",
  },
};

export const SECTIONS = [
  "ownership_and_lifetimes",
  "error_handling",
  "unsafe_discipline",
  "async_discipline",
  "testing_and_benchmarks",
  "tooling_workspace_and_supply_chain",
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
  unsafe_blocks_count: number | null;
  unsafe_blocks_without_invariant: string[] | null;
  unsafe_blocks_without_tests: string[] | null;
  documented_coverage: string | null;
  tested_coverage: string | null;
  duplicate_unsafe_block_locations: string[] | null;
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
  if (isPyDict(entry) && typeof entry["location"] === "string") {
    return entry["location"] as string;
  }
  return "unnamed";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [blocksRaw, hasBlocks] = getPath(manifest, "unsafe_blocks");
  const blocksIsList = hasBlocks && Array.isArray(blocksRaw);
  const rows: unknown[] = blocksIsList ? (blocksRaw as unknown[]) : [];
  const blocksCount: number | null = blocksIsList ? rows.length : null;

  const blocksWithoutInvariant: string[] | null = blocksIsList
    ? rows.filter((c) => hasField(c, "invariant_documented") &&
        (c as Record<string, unknown>)["invariant_documented"] !== true)
        .map(rowName)
    : null;
  const blocksWithoutTests: string[] | null = blocksIsList
    ? rows.filter((c) => hasField(c, "tests_covering_block") &&
        (c as Record<string, unknown>)["tests_covering_block"] !== true)
        .map(rowName)
    : null;
  let duplicateBlockLocations: string[] | null = null;
  if (blocksIsList) {
    const seen: string[] = [];
    duplicateBlockLocations = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["location"] === "string") {
        const nm = c["location"] as string;
        if (seen.includes(nm) && !duplicateBlockLocations.includes(nm)) {
          duplicateBlockLocations.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const documentedCoverage: number | null =
    blocksIsList && blocksCount !== null && blocksCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["invariant_documented"] === true).length / blocksCount
      : null;
  const testedCoverage: number | null =
    blocksIsList && blocksCount !== null && blocksCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["tests_covering_block"] === true).length / blocksCount
      : null;

  // ---- Section 1: ownership_and_lifetimes ----
  boolCheck(results, "ownership_and_lifetimes",
    "borrow_before_cloning_practised", manifest,
    ["ownership", "borrow_before_cloning_practised"],
    "ownership: borrow before cloning is practised");
  boolCheck(results, "ownership_and_lifetimes",
    "lifetimes_kept_local", manifest,
    ["ownership", "lifetimes_kept_local"],
    "ownership: lifetimes are kept local");
  boolCheck(results, "ownership_and_lifetimes",
    "owned_data_at_boundaries_borrows_within", manifest,
    ["ownership", "owned_data_at_boundaries_borrows_within"],
    "ownership: owned data at boundaries, borrows within");
  boolCheck(results, "ownership_and_lifetimes",
    "clones_justified_where_present", manifest,
    ["ownership", "clones_justified_where_present"],
    "ownership: every clone present is justified — borrowing was considered first");

  // ---- Section 2: error_handling ----
  boolCheck(results, "error_handling",
    "error_enums_used_for_fallible_apis", manifest,
    ["errors", "error_enums_used_for_fallible_apis"],
    "errors: errors are types — enums carry the fallible cases");
  boolCheck(results, "error_handling",
    "thiserror_used_for_library_errors", manifest,
    ["errors", "thiserror_used_for_library_errors"],
    "errors: thiserror is used for library errors");
  boolCheck(results, "error_handling",
    "anyhow_used_for_binary_errors", manifest,
    ["errors", "anyhow_used_for_binary_errors"],
    "errors: anyhow is used for binary errors");
  boolCheck(results, "error_handling",
    "question_mark_propagation_used", manifest,
    ["errors", "question_mark_propagation_used"],
    "errors: `?` is used for propagation");
  boolCheck(results, "error_handling",
    "no_unwrap_or_expect_in_production_paths", manifest,
    ["errors", "no_unwrap_or_expect_in_production_paths"],
    "errors: zero unwrap/expect in production paths — no unwrap/expect on fallible paths");
  boolCheck(results, "error_handling",
    "unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages", manifest,
    ["errors", "unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages"],
    "errors: any unwrap/expect exceptions are confined to tests and startup-time invariants, with messages");

  // ---- Section 3: unsafe_discipline ----
  boolCheck(results, "unsafe_discipline",
    "unsafe_forbidden_by_default_declared", manifest,
    ["unsafe_policy", "unsafe_forbidden_by_default_declared"],
    "unsafe policy: unsafe is forbidden by default");
  boolCheck(results, "unsafe_discipline",
    "unsafe_isolated_in_dedicated_modules", manifest,
    ["unsafe_policy", "unsafe_isolated_in_dedicated_modules"],
    "unsafe policy: where unsafe is needed, it is isolated in a dedicated module");
  check(results, "unsafe_discipline",
    "unsafe_blocks_declared", blocksRaw, blocksIsList,
    blocksIsList,
    "the declared record names its unsafe blocks — the unsafe_blocks list is present; an empty list declares that the codebase contains no unsafe blocks");
  const invariantPresent = blocksIsList &&
    rows.every((c) => hasField(c, "invariant_documented"));
  check(results, "unsafe_discipline",
    "every_unsafe_block_documents_its_invariant", blocksRaw, invariantPresent,
    blocksIsList &&
      rows.every((c) => isPyDict(c) && c["invariant_documented"] === true),
    "unsafe blocks: every declared unsafe block documents its invariant — unsafe is a contract");
  const testsPresent = blocksIsList &&
    rows.every((c) => hasField(c, "tests_covering_block"));
  check(results, "unsafe_discipline",
    "every_unsafe_block_has_covering_tests", blocksRaw, testsPresent,
    blocksIsList &&
      rows.every((c) => isPyDict(c) && c["tests_covering_block"] === true),
    "unsafe blocks: every declared unsafe block has tests covering it");
  const locationPresent = blocksIsList &&
    rows.every((c) => hasField(c, "location"));
  check(results, "unsafe_discipline",
    "no_unsafe_block_location_duplicated", blocksRaw, locationPresent,
    blocksIsList && duplicateBlockLocations !== null &&
      duplicateBlockLocations.length === 0,
    "unsafe blocks: no declared unsafe-block location is owned by more than one row");

  // ---- Section 4: async_discipline ----
  boolCheck(results, "async_discipline",
    "structured_tasks_with_tokio_used", manifest,
    ["async_runtime", "structured_tasks_with_tokio_used"],
    "async: structured tasks with tokio are used");
  boolCheck(results, "async_discipline",
    "blocking_calls_absent_from_async_code", manifest,
    ["async_runtime", "blocking_calls_absent_from_async_code"],
    "async: no blocking calls inside async code");
  boolCheck(results, "async_discipline",
    "bounded_channels_used", manifest,
    ["async_runtime", "bounded_channels_used"],
    "async: bounded channels are used");
  boolCheck(results, "async_discipline",
    "timeouts_applied_everywhere", manifest,
    ["async_runtime", "timeouts_applied_everywhere"],
    "async: timeouts are applied everywhere");

  // ---- Section 5: testing_and_benchmarks ----
  boolCheck(results, "testing_and_benchmarks",
    "unit_tests_beside_code_present", manifest,
    ["testing", "unit_tests_beside_code_present"],
    "testing: unit tests sit beside the code");
  boolCheck(results, "testing_and_benchmarks",
    "integration_tests_in_tests_directory_present", manifest,
    ["testing", "integration_tests_in_tests_directory_present"],
    "testing: integration tests live in tests/");
  boolCheck(results, "testing_and_benchmarks",
    "doc_tests_for_examples_present", manifest,
    ["testing", "doc_tests_for_examples_present"],
    "testing: doc tests cover the examples");
  boolCheck(results, "testing_and_benchmarks",
    "error_paths_tested", manifest,
    ["testing", "error_paths_tested"],
    "testing: the error paths are tested");
  boolCheck(results, "testing_and_benchmarks",
    "criterion_benchmarks_present", manifest,
    ["testing", "criterion_benchmarks_present"],
    "testing: criterion is used for benchmarks");
  boolCheck(results, "testing_and_benchmarks",
    "tests_green_including_failure_paths", manifest,
    ["testing", "tests_green_including_failure_paths"],
    "testing: tests are green, including the failure and error paths");

  // ---- Section 6: tooling_workspace_and_supply_chain ----
  boolCheck(results, "tooling_workspace_and_supply_chain",
    "clippy_clean_with_deny_warnings", manifest,
    ["tooling", "clippy_clean_with_deny_warnings"],
    "clippy gate: cargo clippy is clean with -D warnings");
  boolCheck(results, "tooling_workspace_and_supply_chain",
    "cargo_fmt_check_clean", manifest,
    ["tooling", "cargo_fmt_check_clean"],
    "clippy gate: cargo fmt --check is clean");
  boolCheck(results, "tooling_workspace_and_supply_chain",
    "lints_fixed_not_silenced_without_reason", manifest,
    ["tooling", "lints_fixed_not_silenced_without_reason"],
    "clippy gate: lints are fixed, not silenced without reason");
  boolCheck(results, "tooling_workspace_and_supply_chain",
    "crates_split_only_at_real_boundaries", manifest,
    ["workspace", "crates_split_only_at_real_boundaries"],
    "workspaces: crates are split only when boundaries are real");
  boolCheck(results, "tooling_workspace_and_supply_chain",
    "feature_flags_kept_minimal_no_default_bloat", manifest,
    ["workspace", "feature_flags_kept_minimal_no_default_bloat"],
    "workspaces: feature flags are kept minimal — no default bloat");
  boolCheck(results, "tooling_workspace_and_supply_chain",
    "cargo_audit_run", manifest,
    ["supply_chain", "cargo_audit_run"],
    "supply chain: cargo audit is run");
  boolCheck(results, "tooling_workspace_and_supply_chain",
    "msrv_pinned", manifest,
    ["supply_chain", "msrv_pinned"],
    "supply chain: the MSRV is pinned");
  boolCheck(results, "tooling_workspace_and_supply_chain",
    "new_crates_reviewed_before_adoption", manifest,
    ["supply_chain", "new_crates_reviewed_before_adoption"],
    "supply chain: new crates are reviewed before adoption");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "no_blocking_work_inside_async", manifest,
    ["red_lines", "blocking_work_inside_async_present"],
    "red line: no blocking work inside the async runtime is present in the record");
  falseCheck(results, "red_lines",
    "no_unbounded_channels", manifest,
    ["red_lines", "unbounded_channels_present"],
    "red line: no unbounded channels are present in the record");
  falseCheck(results, "red_lines",
    "no_spawn_loops_without_backpressure", manifest,
    ["red_lines", "spawn_loops_without_backpressure_present"],
    "red line: no spawn-loops without backpressure are present in the record");

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
    verdict = "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PRODUCTION_RUST_ENGINEERING_PACK_READY";
  }

  const computedNames = [
    "unsafe_blocks_declared",
    "every_unsafe_block_documents_its_invariant",
    "every_unsafe_block_has_covering_tests",
    "no_unsafe_block_location_duplicated",
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
    service: "production-rust-engineering-pack",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    unsafe_blocks_count: blocksCount,
    unsafe_blocks_without_invariant: blocksWithoutInvariant,
    unsafe_blocks_without_tests: blocksWithoutTests,
    documented_coverage: fmt6(documentedCoverage),
    tested_coverage: fmt6(testedCoverage),
    duplicate_unsafe_block_locations: duplicateBlockLocations,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PRODUCTION RUST ENGINEERING PACK",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
