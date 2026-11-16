// C++ engineering review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/cpp-engineering-review/src/cpp_engineering_review.py
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
// Vocabulary strings (the forbidden-construct list entries) are
// validated as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  subject: "string",
  raii: {
    resources_owned_by_objects: "boolean",
    destructors_clean_up_resources: "boolean",
    manual_new_delete_in_new_code: "boolean",
    raw_owning_pointers_in_new_code: "boolean",
    forbidden_constructs: ["string"],
  },
  value_semantics: {
    values_const_references_preferred: "boolean",
    move_semantics_used_where_copies_expensive: "boolean",
    rule_of_zero_honored: "boolean",
    special_members_justified_when_present: "boolean",
  },
  smart_pointers: {
    unique_ptr_is_default: "boolean",
    shared_ptr_only_for_real_shared_ownership: "boolean",
    weak_ptr_used_to_break_cycles: "boolean",
  },
  stl: {
    algorithms_preferred_over_hand_loops: "boolean",
    containers_matched_to_access_patterns: "boolean",
    ranges_used_where_available: "boolean",
    templates_used_only_for_real_genericity: "boolean",
    template_error_messages_readable: "boolean",
  },
  exceptions_and_abi: {
    exceptions_policy_chosen: "boolean",
    exceptions_policy_documented: "boolean",
    exceptions_policy_applied_consistently: "boolean",
    stable_library_interfaces: "boolean",
    pimpl_used_where_needed: "boolean",
    symbols_versioned: "boolean",
  },
  tooling: {
    clang_tidy_run: "boolean",
    clang_tidy_clean_on_diff: "boolean",
    clang_format_applied: "boolean",
    warnings_treated_as_errors: "boolean",
    warning_count: "number",
  },
  sanitizers: {
    asan_enabled_in_test_builds: "boolean",
    ubsan_enabled_in_test_builds: "boolean",
    tsan_enabled_in_test_builds: "boolean",
    sanitizer_clean_test_run: "boolean",
  },
  safety: {
    dangling_references_across_async_boundaries: "boolean",
    macros_used_where_language_features_exist: "boolean",
  },
};

export const SECTIONS = [
  "raii_and_ownership",
  "value_semantics",
  "smart_pointers",
  "stl_and_templates",
  "exceptions_and_abi",
  "tooling_and_warnings",
  "sanitizers",
  "safety_red_lines",
] as const;

export const FORBIDDEN_CONSTRUCTS = [
  "raw_owning_pointer",
  "manual_new",
  "manual_delete",
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
  forbidden_constructs_found: string[] | null;
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

  // ---- Section 1: raii_and_ownership ----
  boolCheck(results, "raii_and_ownership", "resources_owned_by_objects",
    manifest, ["raii", "resources_owned_by_objects"],
    "method step 1: resources are owned by objects — RAII everywhere (memory, files, sockets, locks)");
  boolCheck(results, "raii_and_ownership",
    "destructors_clean_up_resources",
    manifest, ["raii", "destructors_clean_up_resources"],
    "method step 1: destructors clean up — no manual pairing");
  falseCheck(results, "raii_and_ownership",
    "no_manual_new_delete_in_new_code",
    manifest, ["raii", "manual_new_delete_in_new_code"],
    "quality gate: no manual new/delete in new code");
  falseCheck(results, "raii_and_ownership",
    "no_raw_owning_pointers_in_new_code",
    manifest, ["raii", "raw_owning_pointers_in_new_code"],
    "quality gate: no raw owning pointers in new code");
  const [forbidden, hasForbidden] = getPath(
    manifest, "raii", "forbidden_constructs");
  const forbiddenIsList = hasForbidden && Array.isArray(forbidden);
  const forbiddenFound: string[] | null = forbiddenIsList
    ? FORBIDDEN_CONSTRUCTS.filter((f) => (forbidden as unknown[]).includes(f))
    : null;
  check(results, "raii_and_ownership", "no_forbidden_constructs_present",
    forbidden, forbiddenIsList,
    forbiddenIsList && (forbiddenFound as string[]).length === 0,
    "quality gate: no raw owning pointers or manual new/delete in new code");

  // ---- Section 2: value_semantics ----
  boolCheck(results, "value_semantics",
    "values_const_references_preferred",
    manifest, ["value_semantics", "values_const_references_preferred"],
    "method step 2: values, const, and references are preferred — value semantics first");
  boolCheck(results, "value_semantics",
    "move_semantics_used_where_copies_expensive",
    manifest, ["value_semantics", "move_semantics_used_where_copies_expensive"],
    "method step 2: move semantics are used where copies are expensive");
  boolCheck(results, "value_semantics", "rule_of_zero_honored",
    manifest, ["value_semantics", "rule_of_zero_honored"],
    "method step 2 / quality gate: the Rule of Zero is honored — special members are written only when you must");
  boolCheck(results, "value_semantics",
    "special_members_justified_when_present",
    manifest, ["value_semantics", "special_members_justified_when_present"],
    "quality gate: special members are present only when justified");

  // ---- Section 3: smart_pointers ----
  boolCheck(results, "smart_pointers", "unique_ptr_is_default",
    manifest, ["smart_pointers", "unique_ptr_is_default"],
    "method step 3: unique_ptr is the default smart pointer");
  boolCheck(results, "smart_pointers",
    "shared_ptr_only_for_real_shared_ownership",
    manifest, ["smart_pointers", "shared_ptr_only_for_real_shared_ownership"],
    "method step 3: shared_ptr is used only for real shared ownership");
  boolCheck(results, "smart_pointers", "weak_ptr_used_to_break_cycles",
    manifest, ["smart_pointers", "weak_ptr_used_to_break_cycles"],
    "method step 3: weak_ptr is used to break cycles");

  // ---- Section 4: stl_and_templates ----
  boolCheck(results, "stl_and_templates",
    "algorithms_preferred_over_hand_loops",
    manifest, ["stl", "algorithms_preferred_over_hand_loops"],
    "method step 4: STL algorithms are preferred over hand loops");
  boolCheck(results, "stl_and_templates",
    "containers_matched_to_access_patterns",
    manifest, ["stl", "containers_matched_to_access_patterns"],
    "method step 4: containers are matched to access patterns");
  boolCheck(results, "stl_and_templates", "ranges_used_where_available",
    manifest, ["stl", "ranges_used_where_available"],
    "method step 4: ranges are used where available");
  boolCheck(results, "stl_and_templates",
    "templates_used_only_for_real_genericity",
    manifest, ["stl", "templates_used_only_for_real_genericity"],
    "method step 7: templates are used sparingly — for real genericity, not vanity");
  boolCheck(results, "stl_and_templates",
    "template_error_messages_readable",
    manifest, ["stl", "template_error_messages_readable"],
    "method step 7: template error messages are kept readable");

  // ---- Section 5: exceptions_and_abi ----
  boolCheck(results, "exceptions_and_abi", "exceptions_policy_chosen",
    manifest, ["exceptions_and_abi", "exceptions_policy_chosen"],
    "method step 5: one exceptions policy is picked for the codebase (exceptions on/off)");
  boolCheck(results, "exceptions_and_abi", "exceptions_policy_documented",
    manifest, ["exceptions_and_abi", "exceptions_policy_documented"],
    "method step 5: the exceptions policy is documented");
  boolCheck(results, "exceptions_and_abi",
    "exceptions_policy_applied_consistently",
    manifest, ["exceptions_and_abi", "exceptions_policy_applied_consistently"],
    "method step 5: the exceptions policy is applied consistently");
  boolCheck(results, "exceptions_and_abi", "stable_library_interfaces",
    manifest, ["exceptions_and_abi", "stable_library_interfaces"],
    "method step 8: library interfaces are stable");
  boolCheck(results, "exceptions_and_abi", "pimpl_used_where_needed",
    manifest, ["exceptions_and_abi", "pimpl_used_where_needed"],
    "method step 8: pimpl is used where needed");
  boolCheck(results, "exceptions_and_abi", "symbols_versioned",
    manifest, ["exceptions_and_abi", "symbols_versioned"],
    "method step 8: symbols are versioned");

  // ---- Section 6: tooling_and_warnings ----
  boolCheck(results, "tooling_and_warnings", "clang_tidy_run_in_loop",
    manifest, ["tooling", "clang_tidy_run"],
    "method step 6: clang-tidy is in the loop");
  boolCheck(results, "tooling_and_warnings", "clang_tidy_clean_on_diff",
    manifest, ["tooling", "clang_tidy_clean_on_diff"],
    "quality gate: clang-tidy is clean on the diff");
  boolCheck(results, "tooling_and_warnings", "clang_format_applied",
    manifest, ["tooling", "clang_format_applied"],
    "method step 6: clang-format is applied");
  boolCheck(results, "tooling_and_warnings", "warnings_treated_as_errors",
    manifest, ["tooling", "warnings_treated_as_errors"],
    "method step 6: warnings are treated as errors");
  const [warnCount, hasWarnCount] = getPath(
    manifest, "tooling", "warning_count");
  const warnIsNumber = hasWarnCount && isNumber(warnCount);
  check(results, "tooling_and_warnings", "zero_warnings_maintained",
    warnCount, warnIsNumber,
    warnIsNumber && (warnCount as number) === 0,
    "method step 6 / quality gate: zero warnings maintained — warnings-as-errors build green");

  // ---- Section 7: sanitizers ----
  boolCheck(results, "sanitizers", "asan_enabled_in_test_builds",
    manifest, ["sanitizers", "asan_enabled_in_test_builds"],
    "method step 6: ASan is enabled in test builds");
  boolCheck(results, "sanitizers", "ubsan_enabled_in_test_builds",
    manifest, ["sanitizers", "ubsan_enabled_in_test_builds"],
    "method step 6: UBSan is enabled in test builds");
  boolCheck(results, "sanitizers", "tsan_enabled_in_test_builds",
    manifest, ["sanitizers", "tsan_enabled_in_test_builds"],
    "method step 6: TSan is enabled in test builds");
  boolCheck(results, "sanitizers", "sanitizer_clean_test_run",
    manifest, ["sanitizers", "sanitizer_clean_test_run"],
    "quality gate: the test run is sanitizer-clean");

  // ---- Section 8: safety_red_lines ----
  falseCheck(results, "safety_red_lines",
    "no_dangling_references_across_async_boundaries",
    manifest, ["safety", "dangling_references_across_async_boundaries"],
    "red line: no dangling references across async boundaries");
  falseCheck(results, "safety_red_lines",
    "no_macros_where_language_features_exist",
    manifest, ["safety", "macros_used_where_language_features_exist"],
    "red line: no macros where language features exist");

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
      r.check === "no_forbidden_constructs_present")
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
    service: "cpp-engineering-review",
    atom_version: "0.1.0",
    subject: manifest["subject"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    warning_count: warnIsNumber ? (warnCount as number) : null,
    forbidden_constructs_found: forbiddenFound,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across eight sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CPP ENGINEERING REVIEW",
    `subject: ${pyStr(verdict.subject ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
