// C engineering review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/c-engineering-review/src/c_engineering_review.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the banned-call list entries) are validated
// as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  subject: "string",
  memory: {
    one_owner_per_allocation: "boolean",
    freed_on_same_path_as_allocation: "boolean",
    ownership_documented_in_headers: "boolean",
    caller_supplied_buffers_preferred: "boolean",
    ownership_documented_for_outliving_pointers: "boolean",
  },
  undefined_behavior: {
    integer_overflow_addressed: "boolean",
    strict_aliasing_respected: "boolean",
    uninitialized_reads_avoided: "boolean",
    signed_shifts_checked: "boolean",
    sequence_point_traps_avoided: "boolean",
    ub_shortcuts_used: "boolean",
  },
  warnings: {
    warnings_treated_as_errors: "boolean",
    warning_count: "number",
  },
  bounds: {
    sized_apis_used: "boolean",
    lengths_validated_at_boundaries: "boolean",
    unbounded_operations_in_diff: "boolean",
    banned_calls: ["string"],
  },
  sanitizers: {
    asan_enabled_in_test_builds: "boolean",
    ubsan_enabled_in_test_builds: "boolean",
    asan_ubsan_clean_on_suite: "boolean",
    valgrind_used_for_leaks: "boolean",
    parsers_fuzzed: "boolean",
    static_analysis_run: "boolean",
    static_analysis_findings_treated_as_bugs: "boolean",
  },
  portability: {
    fixed_width_types_used: "boolean",
    compiler_extensions_isolated: "boolean",
    tested_on_target_platforms: "boolean",
  },
  build_and_test: {
    build_system_pinned: "boolean",
    unit_tests_at_function_boundaries: "boolean",
    integration_tests_at_edges: "boolean",
  },
};

export const SECTIONS = [
  "memory_discipline",
  "undefined_behavior",
  "warnings_and_build",
  "bounds_and_strings",
  "sanitizers_and_static_analysis",
  "portability",
  "build_and_test",
] as const;

export const BANNED_CALLS = [
  "gets",
  "strcpy",
  "sprintf",
  "unchecked_scanf",
];

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
  subject: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  warning_count: number | null;
  banned_calls_found: string[] | null;
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: memory_discipline ----
  boolCheck(results, "memory_discipline", "one_owner_per_allocation",
    manifest, ["memory", "one_owner_per_allocation"],
    "method step 1: one clear owner per allocation");
  boolCheck(results, "memory_discipline",
    "freed_on_same_path_as_allocation",
    manifest, ["memory", "freed_on_same_path_as_allocation"],
    "method step 1: each allocation is freed on the same path as its allocation");
  boolCheck(results, "memory_discipline",
    "ownership_documented_in_headers",
    manifest, ["memory", "ownership_documented_in_headers"],
    "method step 1: ownership is documented in headers");
  boolCheck(results, "memory_discipline",
    "caller_supplied_buffers_preferred_over_hidden_allocations",
    manifest, ["memory", "caller_supplied_buffers_preferred"],
    "method step 1: caller-supplied buffers are preferred over hidden allocations");
  boolCheck(results, "memory_discipline",
    "ownership_documented_for_outliving_pointers",
    manifest, ["memory", "ownership_documented_for_outliving_pointers"],
    "quality gate: ownership is documented for pointers that outlive their function");

  // ---- Section 2: undefined_behavior ----
  boolCheck(results, "undefined_behavior", "integer_overflow_addressed",
    manifest, ["undefined_behavior", "integer_overflow_addressed"],
    "method step 2: integer overflow is minded — no overflow trap is left unaddressed");
  boolCheck(results, "undefined_behavior", "strict_aliasing_respected",
    manifest, ["undefined_behavior", "strict_aliasing_respected"],
    "method step 2: strict aliasing is respected");
  boolCheck(results, "undefined_behavior", "uninitialized_reads_avoided",
    manifest, ["undefined_behavior", "uninitialized_reads_avoided"],
    "method step 2: uninitialized reads are avoided");
  boolCheck(results, "undefined_behavior", "signed_shifts_checked",
    manifest, ["undefined_behavior", "signed_shifts_checked"],
    "method step 2: signed shifts are checked");
  boolCheck(results, "undefined_behavior", "sequence_point_traps_avoided",
    manifest, ["undefined_behavior", "sequence_point_traps_avoided"],
    "method step 2: sequence-point traps are avoided");
  falseCheck(results, "undefined_behavior", "no_ub_shortcuts",
    manifest, ["undefined_behavior", "ub_shortcuts_used"],
    "method step 2 / red line: no UB shortcuts — no UB 'because it works on my machine'");

  // ---- Section 3: warnings_and_build ----
  boolCheck(results, "warnings_and_build", "warnings_treated_as_errors",
    manifest, ["warnings", "warnings_treated_as_errors"],
    "method step 3: warnings are errors — the build uses -Wall -Wextra -Werror (MSVC /W4 /WX)");
  const [warnCount, hasWarnCount] = getPath(
    manifest, "warnings", "warning_count");
  const warnIsNumber = hasWarnCount && isNumber(warnCount);
  check(results, "warnings_and_build", "zero_warnings_maintained",
    warnCount, warnIsNumber,
    warnIsNumber && (warnCount as number) === 0,
    "method step 3 / quality gate: zero warnings maintained — warning-clean with -Werror on target compilers");

  // ---- Section 4: bounds_and_strings ----
  boolCheck(results, "bounds_and_strings", "sized_apis_used",
    manifest, ["bounds", "sized_apis_used"],
    "method step 4: sized APIs are used (snprintf, checked memcpy) instead of unbounded ones");
  boolCheck(results, "bounds_and_strings",
    "lengths_validated_at_boundaries",
    manifest, ["bounds", "lengths_validated_at_boundaries"],
    "method step 4: every length crossing a boundary is validated");
  falseCheck(results, "bounds_and_strings",
    "no_unbounded_operations_in_diff",
    manifest, ["bounds", "unbounded_operations_in_diff"],
    "quality gate: no unbounded string/mem operations in the diff");
  const [banned, hasBanned] = getPath(manifest, "bounds", "banned_calls");
  const bannedIsList = hasBanned && Array.isArray(banned);
  const bannedFound: string[] | null = bannedIsList
    ? BANNED_CALLS.filter((b) => (banned as unknown[]).includes(b))
    : null;
  check(results, "bounds_and_strings", "no_banned_functions_present",
    banned, bannedIsList,
    bannedIsList && (bannedFound as string[]).length === 0,
    "red line: no gets, strcpy, sprintf, unchecked scanf — ever");

  // ---- Section 5: sanitizers_and_static_analysis ----
  boolCheck(results, "sanitizers_and_static_analysis",
    "asan_enabled_in_test_builds",
    manifest, ["sanitizers", "asan_enabled_in_test_builds"],
    "method step 5: ASan is enabled in test builds");
  boolCheck(results, "sanitizers_and_static_analysis",
    "ubsan_enabled_in_test_builds",
    manifest, ["sanitizers", "ubsan_enabled_in_test_builds"],
    "method step 5: UBSan is enabled in test builds");
  boolCheck(results, "sanitizers_and_static_analysis",
    "asan_ubsan_clean_on_suite",
    manifest, ["sanitizers", "asan_ubsan_clean_on_suite"],
    "quality gate: ASan/UBSan clean on the suite");
  boolCheck(results, "sanitizers_and_static_analysis",
    "valgrind_used_for_leaks",
    manifest, ["sanitizers", "valgrind_used_for_leaks"],
    "method step 5: Valgrind is used for leaks");
  boolCheck(results, "sanitizers_and_static_analysis", "parsers_fuzzed",
    manifest, ["sanitizers", "parsers_fuzzed"],
    "method step 5: parsers are fuzzed (libFuzzer/AFL)");
  boolCheck(results, "sanitizers_and_static_analysis",
    "static_analysis_run_in_loop",
    manifest, ["sanitizers", "static_analysis_run"],
    "method step 6: static analysis is in the loop — clang-tidy plus the compiler analyzer");
  boolCheck(results, "sanitizers_and_static_analysis",
    "static_analysis_findings_treated_as_bugs",
    manifest, ["sanitizers", "static_analysis_findings_treated_as_bugs"],
    "method step 6: static-analysis findings are treated as bugs until proven otherwise");

  // ---- Section 6: portability ----
  boolCheck(results, "portability", "fixed_width_types_used",
    manifest, ["portability", "fixed_width_types_used"],
    "method step 7: fixed-width types are used (stdint.h)");
  boolCheck(results, "portability", "compiler_extensions_isolated",
    manifest, ["portability", "compiler_extensions_isolated"],
    "method step 7: compiler extensions are isolated");
  boolCheck(results, "portability", "tested_on_target_platforms",
    manifest, ["portability", "tested_on_target_platforms"],
    "method step 7: the code is tested on target platforms");

  // ---- Section 7: build_and_test ----
  boolCheck(results, "build_and_test", "build_system_pinned",
    manifest, ["build_and_test", "build_system_pinned"],
    "method step 8: the build is pinned (Make/CMake)");
  boolCheck(results, "build_and_test",
    "unit_tests_at_function_boundaries",
    manifest, ["build_and_test", "unit_tests_at_function_boundaries"],
    "method step 8: unit tests sit at function boundaries");
  boolCheck(results, "build_and_test", "integration_tests_at_edges",
    manifest, ["build_and_test", "integration_tests_at_edges"],
    "method step 8: integration tests sit at the edges");

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
    verdict = "REVIEW_DEFICIENT";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "REVIEW_SOUND";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "zero_warnings_maintained" ||
      r.check === "no_banned_functions_present")
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const countStatus = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "c-engineering-review",
    atom_version: "0.1.0",
    subject: manifest["subject"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    warning_count: warnIsNumber ? (warnCount as number) : null,
    banned_calls_found: bannedFound,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "C ENGINEERING REVIEW",
    `subject: ${pyStr(verdict.subject ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
