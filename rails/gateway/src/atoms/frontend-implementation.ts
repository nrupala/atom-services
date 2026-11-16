// Frontend implementation — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/frontend-implementation/src/frontend_implementation.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  project: "string",
  structure: {
    semantic_html_first: "boolean",
    small_single_responsibility_components: "boolean",
    data_down_events_up: "boolean",
    god_components_present: "boolean",
    follows_project_stack_and_styles: "boolean",
    uses_design_tokens: "boolean",
  },
  framework: {
    new_framework_introduced: "boolean",
    adr_recorded: "boolean",
  },
  data_views: [{
    name: "string",
    loading_implemented: "boolean",
    empty_implemented: "boolean",
    error_implemented: "boolean",
    success_implemented: "boolean",
  }],
  interactions: {
    buttons_disabled_while_submitting: "boolean",
    dead_controls_present: "boolean",
    silent_failures_present: "boolean",
  },
  data_layer: {
    single_small_client_per_app: "boolean",
    retries_with_backoff_for_transient_errors: "boolean",
    whole_screen_blocked_by_single_widget_present: "boolean",
  },
  verification: {
    state_matrix_documented: "boolean",
    smoke_tests_for_key_flows: "boolean",
    keyboard_only_primary_journey_passed: "boolean",
  },
  responsive: {
    fluid_grids_used: "boolean",
    wrap_safe_text: "boolean",
    stable_dimensions: "boolean",
    widths_verified_360_to_desktop: "boolean",
    overflow_present: "boolean",
    overlap_present: "boolean",
    has_fixed_bars: "boolean",
    nothing_hidden_behind_fixed_bars: "boolean",
  },
  accessibility: {
    labels_on_all_fields: "boolean",
    logical_focus_order: "boolean",
    aria_live_for_async_results: "boolean",
    fully_keyboard_operable: "boolean",
  },
  performance: {
    budget_defined_before_build: "boolean",
    lazy_load_below_fold: "boolean",
    layout_shift_avoided: "boolean",
    static_assets_cached: "boolean",
    budget_checked_bundle_and_first_paint: "boolean",
    budget_checked_on_slow_throttle: "boolean",
  },
  errors: {
    human_readable_messages_in_ui: "boolean",
    details_sent_to_logs_not_ui: "boolean",
    console_spam_present: "boolean",
  },
  security: {
    secrets_in_frontend_code_present: "boolean",
  },
};

const STATE_FIELDS = [
  "loading_implemented",
  "empty_implemented",
  "error_implemented",
  "success_implemented",
] as const;

export const SECTIONS = [
  "structure_and_components",
  "states_and_data_layer",
  "responsive_and_accessibility",
  "performance_and_errors",
  "verification_and_red_lines",
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
  data_views_count: number | null;
  data_views_without_complete_states: string[] | null;
  state_coverage: string | null;
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

function viewComplete(entry: unknown): boolean {
  return isPyDict(entry) &&
    STATE_FIELDS.every((f) => entry[f] === true);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [viewsRaw, hasViews] = getPath(manifest, "data_views");
  const viewsIsList = hasViews && Array.isArray(viewsRaw);
  const rows: unknown[] = viewsIsList ? (viewsRaw as unknown[]) : [];
  const viewsCount: number | null = viewsIsList ? rows.length : null;

  const completeRows = rows.filter((c) => viewComplete(c));
  const stateCoverage: number | null =
    viewsIsList && viewsCount !== null && viewsCount > 0
      ? completeRows.length / viewsCount
      : null;
  const viewsWithoutComplete: string[] | null = viewsIsList
    ? rows.filter((c) => isPyDict(c) &&
        STATE_FIELDS.every((f) => hasField(c, f)) && !viewComplete(c))
        .map(rowName)
    : null;

  // ---- Section 1: structure_and_components ----
  boolCheck(results, "structure_and_components",
    "semantic_html_first", manifest,
    ["structure", "semantic_html_first"],
    "structure: semantic HTML comes first");
  boolCheck(results, "structure_and_components",
    "small_single_responsibility_components", manifest,
    ["structure", "small_single_responsibility_components"],
    "structure: components are small with single responsibilities");
  boolCheck(results, "structure_and_components",
    "data_down_events_up", manifest,
    ["structure", "data_down_events_up"],
    "structure: data flows down, events flow up");
  falseCheck(results, "structure_and_components",
    "no_god_components", manifest,
    ["structure", "god_components_present"],
    "structure: no god components");
  boolCheck(results, "structure_and_components",
    "follows_project_stack_and_styles", manifest,
    ["structure", "follows_project_stack_and_styles"],
    "structure: the implementation follows the project's stack and styles");
  boolCheck(results, "structure_and_components",
    "uses_design_tokens", manifest,
    ["structure", "uses_design_tokens"],
    "artifacts: components and styles use design tokens");
  gatedBoolCheck(results, "structure_and_components",
    "new_framework_has_adr", manifest,
    ["framework", "new_framework_introduced"],
    ["framework", "adr_recorded"],
    "structure: the new framework is covered by an ADR",
    "no new framework introduced");

  // ---- Section 2: states_and_data_layer ----
  check(results, "states_and_data_layer", "data_views_declared",
    viewsRaw, viewsIsList,
    viewsIsList && (viewsCount as number) > 0,
    "states always: the declared record names its data views — the data_views list is present and non-empty");
  const statesPresent = viewsIsList &&
    rows.every((c) => STATE_FIELDS.every((f) => hasField(c, f)));
  check(results, "states_and_data_layer",
    "every_data_view_has_all_four_states", viewsRaw, statesPresent,
    viewsIsList && (viewsCount as number) > 0 &&
      completeRows.length === viewsCount,
    "quality gate: every declared data view declares loading, empty, error and success implemented");
  boolCheck(results, "states_and_data_layer",
    "state_matrix_documented", manifest,
    ["verification", "state_matrix_documented"],
    "artifacts: the implemented state matrix is documented");
  boolCheck(results, "states_and_data_layer",
    "buttons_disabled_while_submitting", manifest,
    ["interactions", "buttons_disabled_while_submitting"],
    "states always: buttons are disabled while submitting");
  falseCheck(results, "states_and_data_layer",
    "no_dead_controls", manifest,
    ["interactions", "dead_controls_present"],
    "states always: no dead controls");
  falseCheck(results, "states_and_data_layer",
    "no_silent_failures", manifest,
    ["interactions", "silent_failures_present"],
    "red line: no \"nothing happened\" failures");
  boolCheck(results, "states_and_data_layer",
    "single_small_client_per_app", manifest,
    ["data_layer", "single_small_client_per_app"],
    "data layer: fetching goes through one small client per app");
  boolCheck(results, "states_and_data_layer",
    "retries_with_backoff_for_transient_errors", manifest,
    ["data_layer", "retries_with_backoff_for_transient_errors"],
    "data layer: transient errors are retried with backoff");
  falseCheck(results, "states_and_data_layer",
    "no_whole_screen_blocked_by_single_widget", manifest,
    ["data_layer", "whole_screen_blocked_by_single_widget_present"],
    "data layer: the whole screen is never blocked for one widget");

  // ---- Section 3: responsive_and_accessibility ----
  boolCheck(results, "responsive_and_accessibility",
    "fluid_grids_used", manifest,
    ["responsive", "fluid_grids_used"],
    "responsive: fluid grids are used");
  boolCheck(results, "responsive_and_accessibility",
    "wrap_safe_text", manifest,
    ["responsive", "wrap_safe_text"],
    "responsive: text is wrap-safe");
  boolCheck(results, "responsive_and_accessibility",
    "stable_dimensions", manifest,
    ["responsive", "stable_dimensions"],
    "responsive: dimensions are stable");
  boolCheck(results, "responsive_and_accessibility",
    "widths_verified_360_to_desktop", manifest,
    ["responsive", "widths_verified_360_to_desktop"],
    "responsive / quality gate: widths are verified from 360px to desktop");
  falseCheck(results, "responsive_and_accessibility",
    "no_overflow", manifest,
    ["responsive", "overflow_present"],
    "responsive: no overflow at the verified widths");
  falseCheck(results, "responsive_and_accessibility",
    "no_overlap", manifest,
    ["responsive", "overlap_present"],
    "responsive: no overlap at the verified widths");
  gatedBoolCheck(results, "responsive_and_accessibility",
    "nothing_hidden_behind_fixed_bars", manifest,
    ["responsive", "has_fixed_bars"],
    ["responsive", "nothing_hidden_behind_fixed_bars"],
    "responsive: nothing is hidden behind fixed bars",
    "no fixed bars declared");
  boolCheck(results, "responsive_and_accessibility",
    "labels_on_all_fields", manifest,
    ["accessibility", "labels_on_all_fields"],
    "accessibility: all fields have labels");
  boolCheck(results, "responsive_and_accessibility",
    "logical_focus_order", manifest,
    ["accessibility", "logical_focus_order"],
    "accessibility: focus order is logical");
  boolCheck(results, "responsive_and_accessibility",
    "aria_live_for_async_results", manifest,
    ["accessibility", "aria_live_for_async_results"],
    "accessibility: async results use aria-live");
  boolCheck(results, "responsive_and_accessibility",
    "fully_keyboard_operable", manifest,
    ["accessibility", "fully_keyboard_operable"],
    "accessibility: the interface is fully keyboard operable");

  // ---- Section 4: performance_and_errors ----
  boolCheck(results, "performance_and_errors",
    "budget_defined_before_build", manifest,
    ["performance", "budget_defined_before_build"],
    "performance: the budget is defined first — bundle size and first paint");
  boolCheck(results, "performance_and_errors",
    "lazy_load_below_fold", manifest,
    ["performance", "lazy_load_below_fold"],
    "performance: below-the-fold content is lazy-loaded");
  boolCheck(results, "performance_and_errors",
    "layout_shift_avoided", manifest,
    ["performance", "layout_shift_avoided"],
    "performance: layout shift is avoided");
  boolCheck(results, "performance_and_errors",
    "static_assets_cached", manifest,
    ["performance", "static_assets_cached"],
    "performance: static assets are cached");
  boolCheck(results, "performance_and_errors",
    "budget_checked_bundle_and_first_paint", manifest,
    ["performance", "budget_checked_bundle_and_first_paint"],
    "quality gate: the performance budget is checked — bundle and first paint");
  boolCheck(results, "performance_and_errors",
    "budget_checked_on_slow_throttle", manifest,
    ["performance", "budget_checked_on_slow_throttle"],
    "quality gate: the budget check runs on a slow throttle");
  boolCheck(results, "performance_and_errors",
    "human_readable_error_messages_in_ui", manifest,
    ["errors", "human_readable_messages_in_ui"],
    "errors are UI: messages in the interface are human-readable");
  boolCheck(results, "performance_and_errors",
    "error_details_to_logs_not_ui", manifest,
    ["errors", "details_sent_to_logs_not_ui"],
    "errors are UI: details go to logs/telemetry, not into the user's face");

  // ---- Section 5: verification_and_red_lines ----
  boolCheck(results, "verification_and_red_lines",
    "smoke_tests_for_key_flows", manifest,
    ["verification", "smoke_tests_for_key_flows"],
    "artifacts: smoke/tests cover the key flows");
  boolCheck(results, "verification_and_red_lines",
    "keyboard_only_primary_journey_passed", manifest,
    ["verification", "keyboard_only_primary_journey_passed"],
    "quality gate: a keyboard-only pass of the primary journey is completed");
  falseCheck(results, "verification_and_red_lines",
    "no_console_spam", manifest,
    ["errors", "console_spam_present"],
    "red line: no console spam");
  falseCheck(results, "verification_and_red_lines",
    "no_secrets_in_frontend_code", manifest,
    ["security", "secrets_in_frontend_code_present"],
    "red line: no secrets or keys in frontend code — ever");

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
    verdict = "FRONTEND_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "FRONTEND_SOUND";
  }

  const computedNames = [
    "data_views_declared",
    "every_data_view_has_all_four_states",
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
    service: "frontend-implementation",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    data_views_count: viewsCount,
    data_views_without_complete_states: viewsWithoutComplete,
    state_coverage: fmt6(stateCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "FRONTEND IMPLEMENTATION",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
