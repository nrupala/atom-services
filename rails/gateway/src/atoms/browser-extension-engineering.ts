// Browser extension engineering — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/browser-extension-engineering/src/
// browser_extension_engineering.py (evaluate() + stamp()). No
// logic changes: every verdict, section outcome, per-check
// status, evidence string, computed value and the summary string
// are byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the permission and browser list entries)
// are validated as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  extension_name: "string",
  mv3: {
    service_worker_background: "boolean",
    persistent_background_page_used: "boolean",
    alarms_used_instead_of_timers: "boolean",
    declarative_apis_used_where_possible: "boolean",
    remote_code_executed: "boolean",
    all_code_bundled: "boolean",
  },
  permissions: {
    only_needed_requested: "boolean",
    host_patterns_narrow: "boolean",
    optional_permissions_for_power_features: "boolean",
    permission_list_reviewed_as_security_audit: "boolean",
    overbroad_permissions_present: "boolean",
    requested: ["string"],
    justified: ["string"],
  },
  architecture: {
    content_scripts_isolated_from_page_context: "boolean",
    message_passing_well_defined: "boolean",
    messages_validated_on_both_ends: "boolean",
    storage_scoped_sync_vs_local: "boolean",
    secrets_stored_in_extension_storage: "boolean",
  },
  ux: {
    popup_or_options_pages_provided: "boolean",
    logged_out_and_unavailable_states_provided: "boolean",
    keyboard_shortcuts_provided: "boolean",
    drive_by_dom_changes_without_user_intent: "boolean",
  },
  privacy: {
    page_data_processed_locally_by_default: "boolean",
    telemetry_requires_explicit_consent: "boolean",
    telemetry_clearly_disclosed: "boolean",
    privacy_disclosure_matches_behavior_tested: "boolean",
    browsing_data_exfiltrated: "boolean",
    hidden_data_collection_present: "boolean",
  },
  distribution: {
    store_listing_screenshots_provided: "boolean",
    store_privacy_form_accurate: "boolean",
    staged_rollout_planned: "boolean",
    version_discipline_followed: "boolean",
    firefox_mv3_differences_addressed: "boolean",
    target_browsers: ["string"],
    tested_browsers: ["string"],
    difference_documented_browsers: ["string"],
  },
  security: {
    csp_discipline_followed: "boolean",
    injected_ui_sanitized: "boolean",
    auto_update_via_store_only: "boolean",
    eval_or_remote_scripts_used: "boolean",
  },
};

export const SECTIONS = [
  "mv3_architecture",
  "least_privilege_permissions",
  "architecture_and_messaging",
  "ux_honesty",
  "privacy",
  "distribution_and_cross_browser",
  "security",
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
  extension_name: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  permissions_without_justification: string[] | null;
  browsers_not_covered: string[] | null;
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: mv3_architecture ----
  boolCheck(results, "mv3_architecture", "service_worker_background",
    manifest, ["mv3", "service_worker_background"],
    "method step 1: the background is a service worker");
  falseCheck(results, "mv3_architecture", "no_persistent_background_page",
    manifest, ["mv3", "persistent_background_page_used"],
    "method step 1: no persistent background page is used");
  boolCheck(results, "mv3_architecture", "alarms_used_instead_of_timers",
    manifest, ["mv3", "alarms_used_instead_of_timers"],
    "method step 1: alarms are used instead of timers");
  boolCheck(results, "mv3_architecture",
    "declarative_apis_used_where_possible",
    manifest, ["mv3", "declarative_apis_used_where_possible"],
    "method step 1: declarative APIs are used where possible");
  falseCheck(results, "mv3_architecture", "no_remote_code_execution",
    manifest, ["mv3", "remote_code_executed"],
    "method step 1: no remote code execution — everything is bundled");
  boolCheck(results, "mv3_architecture", "all_code_bundled",
    manifest, ["mv3", "all_code_bundled"],
    "method step 1: all code is bundled with the extension");

  // ---- Section 2: least_privilege_permissions ----
  boolCheck(results, "least_privilege_permissions",
    "only_needed_permissions_requested",
    manifest, ["permissions", "only_needed_requested"],
    "method step 2: only needed permissions are requested");
  boolCheck(results, "least_privilege_permissions", "host_patterns_narrow",
    manifest, ["permissions", "host_patterns_narrow"],
    "method step 2 / quality gate: host patterns are narrow / minimal");
  boolCheck(results, "least_privilege_permissions",
    "optional_permissions_for_power_features",
    manifest, ["permissions", "optional_permissions_for_power_features"],
    "method step 2: power features use optional permissions");
  boolCheck(results, "least_privilege_permissions",
    "permission_list_reviewed_as_security_audit",
    manifest, ["permissions", "permission_list_reviewed_as_security_audit"],
    "method step 2: the permission list is reviewed like a security audit");
  falseCheck(results, "least_privilege_permissions",
    "no_overbroad_permissions",
    manifest, ["permissions", "overbroad_permissions_present"],
    "red line: no overbroad permissions");
  const [requested, hasRequested] = getPath(
    manifest, "permissions", "requested");
  const [justified, hasJustified] = getPath(
    manifest, "permissions", "justified");
  const bothLists = hasRequested && hasJustified &&
    Array.isArray(requested) && Array.isArray(justified);
  const withoutJustification: string[] | null = bothLists
    ? (requested as unknown[]).filter(
        (p) => !(justified as unknown[]).includes(p)) as string[]
    : null;
  check(results, "least_privilege_permissions",
    "all_requested_permissions_justified_in_writing", requested,
    bothLists,
    bothLists && (withoutJustification as string[]).length === 0,
    "quality gate: each permission is justified in writing — every declared requested permission appears in the declared justified-in-writing list");

  // ---- Section 3: architecture_and_messaging ----
  boolCheck(results, "architecture_and_messaging",
    "content_scripts_isolated_from_page_context",
    manifest,
    ["architecture", "content_scripts_isolated_from_page_context"],
    "method step 3: content scripts are isolated from page context");
  boolCheck(results, "architecture_and_messaging",
    "message_passing_well_defined",
    manifest, ["architecture", "message_passing_well_defined"],
    "method step 3: message passing is well-defined");
  boolCheck(results, "architecture_and_messaging",
    "messages_validated_on_both_ends",
    manifest, ["architecture", "messages_validated_on_both_ends"],
    "method step 3 / quality gate: messages are validated on both ends");
  boolCheck(results, "architecture_and_messaging", "storage_scoped",
    manifest, ["architecture", "storage_scoped_sync_vs_local"],
    "method step 3: storage is scoped — storage.sync vs local chosen deliberately");
  falseCheck(results, "architecture_and_messaging",
    "no_secrets_in_extension_storage",
    manifest, ["architecture", "secrets_stored_in_extension_storage"],
    "method step 3: no secrets are kept in extension storage");

  // ---- Section 4: ux_honesty ----
  boolCheck(results, "ux_honesty", "popup_or_options_pages_provided",
    manifest, ["ux", "popup_or_options_pages_provided"],
    "method step 4: popup / options pages are provided");
  boolCheck(results, "ux_honesty",
    "logged_out_and_unavailable_states_provided",
    manifest, ["ux", "logged_out_and_unavailable_states_provided"],
    "method step 4: states for logged-out / unavailable are provided");
  boolCheck(results, "ux_honesty", "keyboard_shortcuts_provided",
    manifest, ["ux", "keyboard_shortcuts_provided"],
    "method step 4: keyboard shortcuts are provided");
  falseCheck(results, "ux_honesty",
    "no_drive_by_dom_changes_without_user_intent",
    manifest, ["ux", "drive_by_dom_changes_without_user_intent"],
    "method step 4: no drive-by DOM changes without user intent");

  // ---- Section 5: privacy ----
  boolCheck(results, "privacy", "page_data_processed_locally_by_default",
    manifest, ["privacy", "page_data_processed_locally_by_default"],
    "method step 5: page data is processed locally by default");
  boolCheck(results, "privacy", "telemetry_requires_explicit_consent",
    manifest, ["privacy", "telemetry_requires_explicit_consent"],
    "method step 5: any telemetry requires explicit consent");
  boolCheck(results, "privacy", "telemetry_clearly_disclosed",
    manifest, ["privacy", "telemetry_clearly_disclosed"],
    "method step 5: any telemetry is clearly disclosed");
  boolCheck(results, "privacy",
    "privacy_disclosure_matches_actual_behavior_tested",
    manifest, ["privacy", "privacy_disclosure_matches_behavior_tested"],
    "quality gate: the privacy disclosure matches actual behavior, tested");
  falseCheck(results, "privacy", "browsing_data_never_exfiltrated",
    manifest, ["privacy", "browsing_data_exfiltrated"],
    "method step 5: browsing data is never exfiltrated");
  falseCheck(results, "privacy", "no_hidden_data_collection",
    manifest, ["privacy", "hidden_data_collection_present"],
    "red line: no hidden data collection");

  // ---- Section 6: distribution_and_cross_browser ----
  boolCheck(results, "distribution_and_cross_browser",
    "store_listing_screenshots_provided",
    manifest, ["distribution", "store_listing_screenshots_provided"],
    "method step 6: the store listing includes screenshots");
  boolCheck(results, "distribution_and_cross_browser",
    "store_privacy_form_accurate",
    manifest, ["distribution", "store_privacy_form_accurate"],
    "method step 6: the store privacy form is accurate");
  boolCheck(results, "distribution_and_cross_browser",
    "staged_rollout_planned",
    manifest, ["distribution", "staged_rollout_planned"],
    "method step 6: distribution uses a staged rollout");
  boolCheck(results, "distribution_and_cross_browser",
    "version_discipline_followed",
    manifest, ["distribution", "version_discipline_followed"],
    "method step 6: version discipline is followed");
  boolCheck(results, "distribution_and_cross_browser",
    "firefox_mv3_differences_addressed",
    manifest, ["distribution", "firefox_mv3_differences_addressed"],
    "method step 6: Firefox MV3 differences are addressed (browser.* shim)");
  const [targets, hasTargets] = getPath(
    manifest, "distribution", "target_browsers");
  const [tested, hasTested] = getPath(
    manifest, "distribution", "tested_browsers");
  const [documented, hasDocumented] = getPath(
    manifest, "distribution", "difference_documented_browsers");
  const allLists = hasTargets && hasTested && hasDocumented &&
    Array.isArray(targets) && Array.isArray(tested) &&
    Array.isArray(documented);
  const notCovered: string[] | null = allLists
    ? (targets as unknown[]).filter(
        (b) => !(tested as unknown[]).includes(b) &&
          !(documented as unknown[]).includes(b)) as string[]
    : null;
  check(results, "distribution_and_cross_browser",
    "all_target_browsers_tested_or_differences_documented", targets,
    allLists,
    allLists && (targets as unknown[]).length > 0 &&
      (notCovered as string[]).length === 0,
    "quality gate: the extension works across target browsers, or differences are documented — every declared target browser appears in the declared tested list or the declared difference-documented list, and at least one target browser is declared");

  // ---- Section 7: security ----
  boolCheck(results, "security", "csp_discipline_followed",
    manifest, ["security", "csp_discipline_followed"],
    "method step 7: CSP discipline is followed");
  boolCheck(results, "security", "injected_ui_sanitized",
    manifest, ["security", "injected_ui_sanitized"],
    "method step 7: any injected UI is sanitized");
  boolCheck(results, "security", "auto_update_via_store_only",
    manifest, ["security", "auto_update_via_store_only"],
    "method step 7: auto-update is via the store only");
  falseCheck(results, "security", "no_eval_or_remote_scripts",
    manifest, ["security", "eval_or_remote_scripts_used"],
    "red line: no eval / remote scripts");

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
    verdict = "EXTENSION_DESIGN_DEFICIENT";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "EXTENSION_DESIGN_SOUND";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "all_requested_permissions_justified_in_writing" ||
      r.check === "all_target_browsers_tested_or_differences_documented")
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
    service: "browser-extension-engineering",
    atom_version: "0.1.0",
    extension_name: manifest["extension_name"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    permissions_without_justification: withoutJustification,
    browsers_not_covered: notCovered,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "BROWSER EXTENSION ENGINEERING",
    `extension: ${pyStr(verdict.extension_name ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
