// Javascript review and build — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/javascript-review-and-build/src/javascript_review_and_build.py
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
  subject: "string",
  modules: {
    esm_used_everywhere: "boolean",
    implicit_globals_present: "boolean",
    var_used_present: "boolean",
    const_by_default_let_when_reassigned: "boolean",
    strict_mode_in_effect: "boolean",
    jsdoc_types_for_reused_code: "boolean",
  },
  async: {
    async_await_with_real_error_handling: "boolean",
    every_promise_handled_or_explicitly_caught: "boolean",
    network_calls_present: "boolean",
    network_timeouts_via_abort_controller: "boolean",
  },
  dom: {
    nodes_built_with_text_content_and_create_element: "boolean",
    user_input_via_inner_html_present: "boolean",
    html_truly_needed_present: "boolean",
    sanitization_applied_when_html_truly_needed: "boolean",
  },
  environment: {
    no_dom_apis_in_node_code: "boolean",
    shared_code_present: "boolean",
    feature_detection_when_shared_code: "boolean",
  },
  bundle: {
    bundle_contents_known: "boolean",
    huge_dependencies_for_small_jobs_present: "boolean",
    optional_code_split: "boolean",
  },
  files: [{
    name: "string",
    esm_module: "boolean",
    var_present: "boolean",
    unhandled_promise_present: "boolean",
    inner_html_with_user_input_present: "boolean",
  }],
  tests: {
    pure_logic_unit_tested: "boolean",
    ui_present: "boolean",
    manual_smoke_for_ui: "boolean",
    logic_extracted_from_event_handlers_and_tested: "boolean",
  },
  red_lines: {
    eval_or_function_on_untrusted_input_present: "boolean",
    secrets_in_client_side_code_present: "boolean",
  },
};

export const SECTIONS = [
  "modules_and_strictness",
  "async_discipline",
  "dom_safety",
  "environment_and_bundle",
  "tests_and_red_lines",
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
  subject: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  files_count: number | null;
  files_without_esm: string[] | null;
  esm_coverage: string | null;
  files_using_var: string[] | null;
  files_with_unhandled_promises: string[] | null;
  files_injecting_user_input_via_inner_html: string[] | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pyTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPyDict(value)) return Object.keys(value).length > 0;
  return Boolean(value);
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

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
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

  const [filesRaw, hasFiles] = getPath(manifest, "files");
  const filesIsList = hasFiles && Array.isArray(filesRaw);
  const rows: unknown[] = filesIsList ? (filesRaw as unknown[]) : [];
  const filesCount: number | null = filesIsList ? rows.length : null;

  const filesWithoutEsm: string[] | null = filesIsList
    ? rows.filter((c) => hasField(c, "esm_module") &&
        (c as Record<string, unknown>)["esm_module"] !== true)
        .map(rowName)
    : null;
  const filesUsingVar: string[] | null = filesIsList
    ? rows.filter((c) => isPyDict(c) && c["var_present"] === true)
        .map(rowName)
    : null;
  const filesWithUnhandled: string[] | null = filesIsList
    ? rows.filter((c) => isPyDict(c) &&
        c["unhandled_promise_present"] === true).map(rowName)
    : null;
  const filesInjecting: string[] | null = filesIsList
    ? rows.filter((c) => isPyDict(c) &&
        c["inner_html_with_user_input_present"] === true).map(rowName)
    : null;
  const esmCoverage: number | null =
    filesIsList && filesCount !== null && filesCount > 0
      ? rows.filter((c) => isPyDict(c) && c["esm_module"] === true)
          .length / filesCount
      : null;

  // ---- Section 1: modules_and_strictness ----
  boolCheck(results, "modules_and_strictness",
    "esm_used_everywhere", manifest,
    ["modules", "esm_used_everywhere"],
    "modules: ESM (import/export) is used everywhere");
  falseCheck(results, "modules_and_strictness",
    "no_implicit_globals", manifest,
    ["modules", "implicit_globals_present"],
    "quality gate: no implicit globals are present");
  falseCheck(results, "modules_and_strictness",
    "no_var_used", manifest,
    ["modules", "var_used_present"],
    "modules: never var — const by default, let when reassigned");
  boolCheck(results, "modules_and_strictness",
    "const_by_default_let_when_reassigned", manifest,
    ["modules", "const_by_default_let_when_reassigned"],
    "modules: const by default, let when reassigned");
  boolCheck(results, "modules_and_strictness",
    "strict_mode_in_effect", manifest,
    ["modules", "strict_mode_in_effect"],
    "strictness: use strict is in effect — implicit in modules");
  boolCheck(results, "modules_and_strictness",
    "jsdoc_types_for_reused_code", manifest,
    ["modules", "jsdoc_types_for_reused_code"],
    "strictness: JSDoc types are carried for anything reused without TypeScript");
  check(results, "modules_and_strictness",
    "files_declared", filesRaw, filesIsList,
    filesIsList && (filesCount as number) > 0,
    "the declared record names its files — the files list is present and non-empty");
  const esmPresent = filesIsList &&
    rows.every((c) => hasField(c, "esm_module"));
  check(results, "modules_and_strictness",
    "every_file_is_esm", filesRaw, esmPresent,
    filesIsList && (filesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["esm_module"] === true),
    "modules: every declared file row is an ES module");
  const varPresentAll = filesIsList &&
    rows.every((c) => hasField(c, "var_present"));
  check(results, "modules_and_strictness",
    "no_file_uses_var", filesRaw, varPresentAll,
    filesIsList && filesUsingVar !== null && filesUsingVar.length === 0,
    "quality gate: no declared file row uses var");

  // ---- Section 2: async_discipline ----
  boolCheck(results, "async_discipline",
    "async_await_with_real_error_handling", manifest,
    ["async", "async_await_with_real_error_handling"],
    "async discipline: async/await is used with real error handling");
  boolCheck(results, "async_discipline",
    "every_promise_handled_or_explicitly_caught", manifest,
    ["async", "every_promise_handled_or_explicitly_caught"],
    "async discipline: every promise is handled or explicitly .catch'ed");
  gatedBoolCheck(results, "async_discipline",
    "network_timeouts_via_abort_controller_when_network_calls", manifest,
    ["async", "network_calls_present"],
    ["async", "network_timeouts_via_abort_controller"],
    "async discipline: network calls have timeouts via AbortController when network calls are declared present",
    "no network calls declared");
  const unhandledPresent = filesIsList &&
    rows.every((c) => hasField(c, "unhandled_promise_present"));
  check(results, "async_discipline",
    "no_file_has_unhandled_promise", filesRaw, unhandledPresent,
    filesIsList && filesWithUnhandled !== null &&
      filesWithUnhandled.length === 0,
    "quality gate: no declared file row carries an unhandled promise");

  // ---- Section 3: dom_safety ----
  boolCheck(results, "dom_safety",
    "nodes_built_with_text_content_and_create_element", manifest,
    ["dom", "nodes_built_with_text_content_and_create_element"],
    "DOM safety: nodes are built with textContent / createElement");
  falseCheck(results, "dom_safety",
    "no_user_input_via_inner_html", manifest,
    ["dom", "user_input_via_inner_html_present"],
    "DOM safety: user input is never injected via innerHTML");
  gatedBoolCheck(results, "dom_safety",
    "sanitization_when_html_truly_needed", manifest,
    ["dom", "html_truly_needed_present"],
    ["dom", "sanitization_applied_when_html_truly_needed"],
    "DOM safety: sanitization is applied when HTML is truly needed",
    "no HTML rendering truly needed declared");
  const injectionPresent = filesIsList &&
    rows.every((c) => hasField(c, "inner_html_with_user_input_present"));
  check(results, "dom_safety",
    "no_file_injects_user_input_via_inner_html", filesRaw,
    injectionPresent,
    filesIsList && filesInjecting !== null && filesInjecting.length === 0,
    "quality gate: no declared file row injects user input via innerHTML");

  // ---- Section 4: environment_and_bundle ----
  boolCheck(results, "environment_and_bundle",
    "no_dom_apis_in_node_code", manifest,
    ["environment", "no_dom_apis_in_node_code"],
    "environment split: no DOM APIs are used in Node code");
  gatedBoolCheck(results, "environment_and_bundle",
    "feature_detection_when_shared_code", manifest,
    ["environment", "shared_code_present"],
    ["environment", "feature_detection_when_shared_code"],
    "environment split: feature detection is used when code is shared between environments",
    "no shared code declared");
  boolCheck(results, "environment_and_bundle",
    "bundle_contents_known", manifest,
    ["bundle", "bundle_contents_known"],
    "bundle awareness: what ships is known");
  falseCheck(results, "environment_and_bundle",
    "no_huge_dependencies_for_small_jobs", manifest,
    ["bundle", "huge_dependencies_for_small_jobs_present"],
    "bundle awareness: no huge dependencies are carried for small jobs");
  boolCheck(results, "environment_and_bundle",
    "optional_code_split", manifest,
    ["bundle", "optional_code_split"],
    "bundle awareness: anything optional is code-split");

  // ---- Section 5: tests_and_red_lines ----
  boolCheck(results, "tests_and_red_lines",
    "pure_logic_unit_tested", manifest,
    ["tests", "pure_logic_unit_tested"],
    "tests: pure logic is unit-tested (vitest / node:test)");
  gatedBoolCheck(results, "tests_and_red_lines",
    "manual_smoke_for_ui_when_ui_present", manifest,
    ["tests", "ui_present"],
    ["tests", "manual_smoke_for_ui"],
    "tests: a manual smoke test is done for the UI when a UI is declared present",
    "no UI declared");
  boolCheck(results, "tests_and_red_lines",
    "logic_extracted_from_event_handlers_and_tested", manifest,
    ["tests", "logic_extracted_from_event_handlers_and_tested"],
    "quality gate: logic is extracted from event handlers so it is testable, and tested");
  falseCheck(results, "tests_and_red_lines",
    "no_eval_or_function_on_untrusted_input", manifest,
    ["red_lines", "eval_or_function_on_untrusted_input_present"],
    "red line: never eval / Function on untrusted input");
  falseCheck(results, "tests_and_red_lines",
    "no_secrets_in_client_side_code", manifest,
    ["red_lines", "secrets_in_client_side_code_present"],
    "red line: no secrets in client-side code — assume it is public");

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
    verdict = "JAVASCRIPT_REVIEW_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "JAVASCRIPT_REVIEW_SOUND";
  }

  const computedNames = [
    "files_declared",
    "every_file_is_esm",
    "no_file_uses_var",
    "no_file_has_unhandled_promise",
    "no_file_injects_user_input_via_inner_html",
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
    service: "javascript-review-and-build",
    atom_version: "0.1.0",
    subject: manifest["subject"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    files_count: filesCount,
    files_without_esm: filesWithoutEsm,
    esm_coverage: fmt6(esmCoverage),
    files_using_var: filesUsingVar,
    files_with_unhandled_promises: filesWithUnhandled,
    files_injecting_user_input_via_inner_html: filesInjecting,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "JAVASCRIPT REVIEW AND BUILD",
    `subject: ${pyStr(verdict.subject ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
