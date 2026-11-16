// Framework adoption ADR — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/framework-adoption-adr/src/framework_adoption_adr.py
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
  framework: "string",
  adr: {
    logged: "boolean",
    alternatives_stated: "boolean",
    exit_cost_stated: "boolean",
  },
  candidates: [{
    name: "string",
    team_familiarity_assessed: "boolean",
    maintenance_health_assessed: "boolean",
    ecosystem_assessed: "boolean",
    performance_assessed: "boolean",
    exit_cost_assessed: "boolean",
    selected: "boolean",
  }],
  house_stack: {
    one_framework_per_layer: "boolean",
    core_logic_imports_no_framework_code: "boolean",
    framework_at_edges_ports_adapters: "boolean",
    is_mid_project_change: "boolean",
    migration_plan_documented: "boolean",
    migration_plan_approved: "boolean",
  },
  versions: {
    exact_versions_pinned: "boolean",
    unpinned_latest_in_production_present: "boolean",
    changelogs_read: "boolean",
    updates_batched: "boolean",
    major_upgrade_planned: "boolean",
    major_upgrade_written_plan: "boolean",
    major_upgrade_full_suite_run: "boolean",
  },
  runtime: {
    explicit_configuration_preferred: "boolean",
    runtime_behaviour_understood: "boolean",
    lifecycle_understood: "boolean",
    dependency_injection_understood: "boolean",
    caching_behaviour_understood: "boolean",
    deprecated_apis_on_hot_path_present: "boolean",
  },
  plugins: {
    plugins_present: "boolean",
    plugins_treated_as_dependencies: "boolean",
    unused_plugins_removed: "boolean",
    items: [{
      name: "string",
      reviewed: "boolean",
      pinned: "boolean",
    }],
  },
  deprecations: {
    warnings_tracked: "boolean",
    migrations_scheduled: "boolean",
    zombie_code_paths_present: "boolean",
  },
};

const FIT_FIELDS = [
  "team_familiarity_assessed",
  "maintenance_health_assessed",
  "ecosystem_assessed",
  "performance_assessed",
  "exit_cost_assessed",
] as const;

export const SECTIONS = [
  "adr_and_fit",
  "house_stack_and_core",
  "pinning_and_upgrades",
  "explicitness_and_runtime",
  "plugins_and_deprecations",
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
  framework: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  candidates_count: number | null;
  candidates_without_name: string[] | null;
  candidates_without_fit_assessment: string[] | null;
  fit_assessment_coverage: string | null;
  selected_count: number | null;
  selected_candidate: string | null;
  plugins_count: number | null;
  plugins_without_review_or_pin: string[] | null;
  plugin_compliance_coverage: string | null;
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

function nonemptyStr(entry: unknown, field: string): boolean {
  return isPyDict(entry) && typeof entry[field] === "string" &&
    (entry[field] as string).length > 0;
}

function fitComplete(entry: unknown): boolean {
  return isPyDict(entry) &&
    FIT_FIELDS.every((f) => entry[f] === true);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [candidatesRaw, hasCandidates] = getPath(manifest, "candidates");
  const candidatesIsList = hasCandidates && Array.isArray(candidatesRaw);
  const rows: unknown[] = candidatesIsList ? (candidatesRaw as unknown[]) : [];
  const candidatesCount: number | null = candidatesIsList ? rows.length : null;

  const candidatesWithoutName: string[] | null = candidatesIsList
    ? rows.filter((c) => !nonemptyStr(c, "name")).map(rowName)
    : null;
  const fitRows = rows.filter(fitComplete);
  const candidatesWithoutFit: string[] | null = candidatesIsList
    ? rows.filter((c) => isPyDict(c) &&
        FIT_FIELDS.some((f) => hasField(c, f)) && !fitComplete(c))
        .map(rowName)
    : null;
  const fitAssessmentCoverage: number | null =
    candidatesIsList && candidatesCount !== null && candidatesCount > 0
      ? fitRows.length / candidatesCount
      : null;
  const selectedRows = rows.filter(
    (c) => isPyDict(c) && c["selected"] === true);
  const selectedCount: number | null = candidatesIsList
    ? selectedRows.length
    : null;
  const selectedCandidate: string | null =
    selectedRows.length === 1 && nonemptyStr(selectedRows[0], "name")
      ? (selectedRows[0] as Record<string, unknown>)["name"] as string
      : null;

  const [pluginItemsRaw, hasPluginItems] = getPath(
    manifest, "plugins", "items");
  const pluginsIsList = hasPluginItems && Array.isArray(pluginItemsRaw);
  const prows: unknown[] = pluginsIsList ? (pluginItemsRaw as unknown[]) : [];
  const pluginsCount: number | null = pluginsIsList ? prows.length : null;
  const compliantProws = prows.filter(
    (c) => isPyDict(c) && c["reviewed"] === true && c["pinned"] === true);
  const pluginsWithoutReviewOrPin: string[] | null = pluginsIsList
    ? prows.filter((c) => isPyDict(c) &&
        (hasField(c, "reviewed") || hasField(c, "pinned")) &&
        !(c["reviewed"] === true && c["pinned"] === true)).map(rowName)
    : null;
  const pluginComplianceCoverage: number | null =
    pluginsIsList && pluginsCount !== null && pluginsCount > 0
      ? compliantProws.length / pluginsCount
      : null;

  // ---- Section 1: adr_and_fit ----
  boolCheck(results, "adr_and_fit",
    "adr_logged_for_new_framework", manifest,
    ["adr", "logged"],
    "quality gate: the new framework has a logged ADR");
  boolCheck(results, "adr_and_fit",
    "adr_states_alternatives", manifest,
    ["adr", "alternatives_stated"],
    "quality gate: the adoption ADR states the alternatives considered");
  boolCheck(results, "adr_and_fit",
    "adr_states_exit_cost", manifest,
    ["adr", "exit_cost_stated"],
    "quality gate: the adoption ADR states the exit cost of taking on this framework");
  check(results, "adr_and_fit", "candidates_declared",
    candidatesRaw, candidatesIsList,
    candidatesIsList && (candidatesCount as number) > 0,
    "choose by fit: the declared record names its candidate frameworks — the candidates list is present and non-empty");
  const namePresent = candidatesIsList &&
    rows.every((c) => hasField(c, "name"));
  check(results, "adr_and_fit",
    "every_candidate_names_framework", candidatesRaw, namePresent,
    candidatesIsList && (candidatesCount as number) > 0 &&
      candidatesWithoutName !== null &&
      candidatesWithoutName.length === 0,
    "choose by fit: every declared candidate row names its framework — a non-empty name string");
  const fitPresent = candidatesIsList &&
    rows.every((c) => FIT_FIELDS.every((f) => hasField(c, f)));
  check(results, "adr_and_fit",
    "every_candidate_fit_fully_assessed", candidatesRaw, fitPresent,
    candidatesIsList && (candidatesCount as number) > 0 &&
      fitRows.length === candidatesCount,
    "choose by fit: every declared candidate row declares all five fit criteria assessed — team familiarity, maintenance health, ecosystem, performance, exit cost");
  const selectedPresent = candidatesIsList &&
    rows.every((c) => hasField(c, "selected"));
  check(results, "adr_and_fit",
    "exactly_one_candidate_selected", candidatesRaw, selectedPresent,
    candidatesIsList && selectedRows.length === 1,
    "choose by fit: exactly one declared candidate row is selected — an adoption ADR decides one framework");

  // ---- Section 2: house_stack_and_core ----
  boolCheck(results, "house_stack_and_core",
    "one_framework_per_layer", manifest,
    ["house_stack", "one_framework_per_layer"],
    "house stack: one framework per layer");
  boolCheck(results, "house_stack_and_core",
    "core_logic_imports_no_framework_code", manifest,
    ["house_stack", "core_logic_imports_no_framework_code"],
    "framework-free core / quality gate: core logic imports no framework code");
  boolCheck(results, "house_stack_and_core",
    "framework_at_edges_ports_adapters", manifest,
    ["house_stack", "framework_at_edges_ports_adapters"],
    "framework-free core: the framework sits at the edges (ports & adapters); business logic lives in plain functions/modules");
  gatedBoolCheck(results, "house_stack_and_core",
    "mid_project_migration_plan_documented", manifest,
    ["house_stack", "is_mid_project_change"],
    ["house_stack", "migration_plan_documented"],
    "house stack: a mid-project framework change has a documented migration plan (change = ADR + migration plan)",
    "not a mid-project change");
  gatedBoolCheck(results, "house_stack_and_core",
    "mid_project_migration_plan_approved", manifest,
    ["house_stack", "is_mid_project_change"],
    ["house_stack", "migration_plan_approved"],
    "red line: no framework-hopping mid-project without an approved migration plan — the plan is approved",
    "not a mid-project change");

  // ---- Section 3: pinning_and_upgrades ----
  boolCheck(results, "pinning_and_upgrades",
    "exact_versions_pinned", manifest,
    ["versions", "exact_versions_pinned"],
    "pin and plan upgrades / quality gate: versions are pinned exactly");
  falseCheck(results, "pinning_and_upgrades",
    "no_unpinned_latest_in_production", manifest,
    ["versions", "unpinned_latest_in_production_present"],
    "red line: no unpinned \"latest\" from CDNs or tags in production");
  boolCheck(results, "pinning_and_upgrades",
    "changelogs_read_before_upgrades", manifest,
    ["versions", "changelogs_read"],
    "pin and plan upgrades: changelogs are read before upgrades");
  boolCheck(results, "pinning_and_upgrades",
    "updates_batched", manifest,
    ["versions", "updates_batched"],
    "pin and plan upgrades: updates are batched");
  gatedBoolCheck(results, "pinning_and_upgrades",
    "major_upgrade_written_plan", manifest,
    ["versions", "major_upgrade_planned"],
    ["versions", "major_upgrade_written_plan"],
    "quality gate: a major upgrade has a written plan — never jump majors blind",
    "no major upgrade declared");
  gatedBoolCheck(results, "pinning_and_upgrades",
    "major_upgrade_full_suite_run", manifest,
    ["versions", "major_upgrade_planned"],
    ["versions", "major_upgrade_full_suite_run"],
    "quality gate: a major upgrade has a full-suite run",
    "no major upgrade declared");

  // ---- Section 4: explicitness_and_runtime ----
  boolCheck(results, "explicitness_and_runtime",
    "explicit_configuration_preferred", manifest,
    ["runtime", "explicit_configuration_preferred"],
    "avoid magic: explicit configuration is preferred");
  boolCheck(results, "explicitness_and_runtime",
    "runtime_behaviour_understood", manifest,
    ["runtime", "runtime_behaviour_understood"],
    "avoid magic: what the framework does at runtime is understood");
  boolCheck(results, "explicitness_and_runtime",
    "lifecycle_understood", manifest,
    ["runtime", "lifecycle_understood"],
    "avoid magic: the framework lifecycle is understood");
  boolCheck(results, "explicitness_and_runtime",
    "dependency_injection_understood", manifest,
    ["runtime", "dependency_injection_understood"],
    "avoid magic: the framework's dependency injection is understood");
  boolCheck(results, "explicitness_and_runtime",
    "caching_behaviour_understood", manifest,
    ["runtime", "caching_behaviour_understood"],
    "avoid magic: the framework's caching behaviour is understood");
  falseCheck(results, "explicitness_and_runtime",
    "no_deprecated_apis_on_hot_path", manifest,
    ["runtime", "deprecated_apis_on_hot_path_present"],
    "quality gate: no deprecated APIs on the hot path");

  // ---- Section 5: plugins_and_deprecations ----
  boolCheck(results, "plugins_and_deprecations",
    "plugins_treated_as_dependencies", manifest,
    ["plugins", "plugins_treated_as_dependencies"],
    "plugin discipline: plugins are treated as dependencies");
  const [pluginsGate, hasPluginsGate] = getPath(
    manifest, "plugins", "plugins_present");
  if (hasPluginsGate && pyTruthy(pluginsGate)) {
    const pluginRowsPresent = pluginsIsList &&
      prows.every((c) => hasField(c, "reviewed") && hasField(c, "pinned"));
    check(results, "plugins_and_deprecations",
      "every_plugin_reviewed_and_pinned", pluginItemsRaw,
      pluginRowsPresent,
      pluginsIsList && (pluginsCount as number) > 0 &&
        compliantProws.length === pluginsCount,
      "plugin discipline: every declared plugin row declares itself reviewed and pinned");
    boolCheck(results, "plugins_and_deprecations",
      "unused_plugins_removed", manifest,
      ["plugins", "unused_plugins_removed"],
      "plugin discipline: unused plugins are removed");
  } else {
    check(results, "plugins_and_deprecations",
      "every_plugin_reviewed_and_pinned", pluginsGate,
      hasPluginsGate, true, "no plugins declared");
    check(results, "plugins_and_deprecations",
      "unused_plugins_removed", pluginsGate,
      hasPluginsGate, true, "no plugins declared");
  }
  boolCheck(results, "plugins_and_deprecations",
    "deprecation_warnings_tracked", manifest,
    ["deprecations", "warnings_tracked"],
    "deprecations: deprecation warnings are tracked");
  boolCheck(results, "plugins_and_deprecations",
    "deprecation_migrations_scheduled", manifest,
    ["deprecations", "migrations_scheduled"],
    "deprecations: deprecation migrations happen on schedule");
  falseCheck(results, "plugins_and_deprecations",
    "no_zombie_code_paths", manifest,
    ["deprecations", "zombie_code_paths_present"],
    "deprecations: no zombie code paths waiting to break");

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
    verdict = "FRAMEWORK_ADOPTION_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "FRAMEWORK_ADOPTION_SOUND";
  }

  const computedNames = [
    "candidates_declared",
    "every_candidate_names_framework",
    "every_candidate_fit_fully_assessed",
    "exactly_one_candidate_selected",
    "every_plugin_reviewed_and_pinned",
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
    service: "framework-adoption-adr",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    framework: manifest["framework"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    candidates_count: candidatesCount,
    candidates_without_name: candidatesWithoutName,
    candidates_without_fit_assessment: candidatesWithoutFit,
    fit_assessment_coverage: fmt6(fitAssessmentCoverage),
    selected_count: selectedCount,
    selected_candidate: selectedCandidate,
    plugins_count: pluginsCount,
    plugins_without_review_or_pin: pluginsWithoutReviewOrPin,
    plugin_compliance_coverage: fmt6(pluginComplianceCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "FRAMEWORK ADOPTION ADR",
    `project: ${pyStr(verdict.project ?? null)}`,
    `framework: ${pyStr(verdict.framework ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
