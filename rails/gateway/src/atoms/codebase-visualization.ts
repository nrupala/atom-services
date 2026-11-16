// Codebase visualization — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/codebase-visualization/src/codebase_visualization.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts and ratios use the
// shared fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals; computed comparisons compare the fixed-6dp
// difference to zero. This atom validates a declared
// visualization artifact record; it renders no graphics, reads
// no actual code, and exercises no judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (diagram formats, C4 level entries) are
// validated as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  diagrams_as_code: {
    key_diagrams_exist_as_code_in_repo: "boolean",
    regenerable: "boolean",
    versioned_and_diffable: "boolean",
    regenerated_on_change: "boolean",
    diagrams: [{
      name: "string",
      format: "string",
      scope: "string",
      generation_source: "string",
      generated_at: "string",
    }],
  },
  dependency: {
    graph_present: "boolean",
    cycles_highlighted: "boolean",
    layering_violations_highlighted: "boolean",
    known_issues_list_maintained: "boolean",
    modules_total: "number",
    modules_included: "number",
  },
  call_and_flow: {
    call_graph_for_hot_paths_present: "boolean",
    sequence_diagrams_for_critical_journeys_present: "boolean",
    data_flow_for_pipelines_present: "boolean",
  },
  architecture: {
    map_present: "boolean",
    levels_declared: ["string"],
    one_page_per_level: "boolean",
    owners_annotated: "boolean",
    boundaries_annotated: "boolean",
    adrs_live_beside_maps: "boolean",
  },
  metrics: {
    complexity_heatmap_present: "boolean",
    coverage_overlay_present: "boolean",
    hotspot_view_considered: "boolean",
    hotspot_change_frequency: "number",
    hotspot_complexity: "number",
    declared_hotspot_score: "number",
  },
  history: {
    churn_timeline_present: "boolean",
    ownership_map_present: "boolean",
    incident_overlays_present: "boolean",
  },
  honesty: {
    each_diagram_labeled_scope_and_generation_source: "boolean",
    diagrams_labeled_generated_at_tool_scope: "boolean",
    generatable_diagrams_generated: "boolean",
    stale_diagrams_shipped_as_truth: "boolean",
    unlabeled_hand_drawn_maps_guiding_decisions: "boolean",
  },
};

export const SECTIONS = [
  "diagrams_as_code",
  "dependency_views",
  "call_and_flow_views",
  "architecture_maps",
  "metrics_and_history_views",
  "honesty_and_currency",
] as const;

export const STATED_DIAGRAM_FORMATS = [
  "mermaid",
  "graphviz",
  "plantuml",
];

export const STATED_C4_LEVELS = [
  "context",
  "containers",
  "components",
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
  entity: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  diagrams_evaluated: number;
  computed_dependency_coverage: string | null;
  dependency_coverage_difference: string | null;
  computed_hotspot_score: string | null;
  hotspot_score_difference: string | null;
  c4_levels_not_declared: string[] | null;
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

function getEntry(
  entry: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(entry, key)) {
    return [null, false];
  }
  return [entry[key], true];
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

function isNonemptyStr(value: unknown): boolean {
  return typeof value === "string" && value.length > 0;
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function diagramChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): number {
  const [diagrams, hasDiagrams] = getPath(
    manifest, "diagrams_as_code", "diagrams");
  if (!hasDiagrams || !Array.isArray(diagrams) || diagrams.length === 0) {
    for (const name of [
      "diagram_entries_complete",
      "diagram_formats_use_stated_diagrams_as_code_tools",
    ] as const) {
      check(results, "diagrams_as_code", name,
        diagrams, false, false, "no diagram entries declared");
    }
    return 0;
  }
  let incomplete = false;
  let evaluated = 0;
  let formatsOk = true;
  for (const entry of diagrams as unknown[]) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [nameV, hasName] = getEntry(entry, "name");
    const [formatV, hasFormat] = getEntry(entry, "format");
    const [scopeV, hasScope] = getEntry(entry, "scope");
    const [sourceV, hasSource] = getEntry(entry, "generation_source");
    const [genAtV, hasGenAt] = getEntry(entry, "generated_at");
    if (!(hasName && hasFormat && hasScope && hasSource && hasGenAt &&
        isNonemptyStr(nameV) && isNonemptyStr(formatV) &&
        isNonemptyStr(scopeV) && isNonemptyStr(sourceV) &&
        isNonemptyStr(genAtV))) {
      incomplete = true;
      continue;
    }
    evaluated += 1;
    if (!STATED_DIAGRAM_FORMATS.includes(formatV as string)) {
      formatsOk = false;
    }
  }
  if (incomplete) {
    check(results, "diagrams_as_code", "diagram_entries_complete",
      diagrams, false, false,
      "a diagram entry is missing its name, format, scope, generation source, or generated-at label");
  } else {
    check(results, "diagrams_as_code", "diagram_entries_complete",
      diagrams, true, true,
      "every diagram entry carries a name, format, scope, generation source, and generated-at label");
  }
  if (incomplete) {
    check(results, "diagrams_as_code",
      "diagram_formats_use_stated_diagrams_as_code_tools",
      diagrams, false, false,
      "a diagram entry is incomplete, so its format cannot be evaluated");
  } else {
    check(results, "diagrams_as_code",
      "diagram_formats_use_stated_diagrams_as_code_tools",
      diagrams, true, formatsOk,
      "method step 1: every declared diagram format is one of the diagrams-as-code tools the skill names — mermaid, graphviz, plantuml");
  }
  return evaluated;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: diagrams_as_code ----
  boolCheck(results, "diagrams_as_code",
    "key_diagrams_exist_as_code_in_repo",
    manifest, ["diagrams_as_code", "key_diagrams_exist_as_code_in_repo"],
    "quality gate: key diagrams exist as code in-repo");
  boolCheck(results, "diagrams_as_code", "diagrams_regenerable",
    manifest, ["diagrams_as_code", "regenerable"],
    "quality gate: the diagrams-as-code in-repo are regenerable");
  boolCheck(results, "diagrams_as_code", "diagrams_versioned_and_diffable",
    manifest, ["diagrams_as_code", "versioned_and_diffable"],
    "method step 1: diagrams-as-code are versioned and diff-able");
  boolCheck(results, "diagrams_as_code", "diagrams_regenerated_on_change",
    manifest, ["diagrams_as_code", "regenerated_on_change"],
    "method step 1: diagrams are regenerated on change");
  const diagramsEvaluated = diagramChecks(results, manifest);

  // ---- Section 2: dependency_views ----
  boolCheck(results, "dependency_views", "dependency_graph_present",
    manifest, ["dependency", "graph_present"],
    "method step 2: a module/package dependency (import) graph is present");
  boolCheck(results, "dependency_views", "cycles_highlighted",
    manifest, ["dependency", "cycles_highlighted"],
    "quality gate: cycles are highlighted / visible in the dependency view");
  boolCheck(results, "dependency_views",
    "layering_violations_highlighted",
    manifest, ["dependency", "layering_violations_highlighted"],
    "quality gate: layering violations are highlighted / visible in the dependency view");
  boolCheck(results, "dependency_views", "known_issues_list_maintained",
    manifest, ["dependency", "known_issues_list_maintained"],
    "quality gate: a known-issues ('known bad') list is maintained");
  const [total, hasTotal] = getPath(manifest, "dependency", "modules_total");
  const [included, hasIncluded] = getPath(
    manifest, "dependency", "modules_included");
  const depAllNumbers = hasTotal && hasIncluded &&
    isNumber(total) && isNumber(included);
  const computedCoverage: number | null =
    depAllNumbers && (total as number) > 0
      ? (included as number) / (total as number)
      : null;
  const coverageDifference: number | null = depAllNumbers
    ? (included as number) - (total as number)
    : null;
  const depConsistent = depAllNumbers && (total as number) > 0 &&
    fmt6((included as number) - (total as number)) === "0.000000";
  check(results, "dependency_views",
    "dependency_graph_covers_all_declared_modules",
    included, depAllNumbers, depConsistent,
    "method step 2: the declared modules included in the dependency graph equal the declared total modules (the graph covers the whole declared module set; no partial-coverage percentage is imposed)");

  // ---- Section 3: call_and_flow_views ----
  boolCheck(results, "call_and_flow_views",
    "call_graph_for_hot_paths_present",
    manifest, ["call_and_flow", "call_graph_for_hot_paths_present"],
    "method step 3: call graphs for hot paths are present");
  boolCheck(results, "call_and_flow_views",
    "sequence_diagrams_for_critical_journeys_present",
    manifest,
    ["call_and_flow", "sequence_diagrams_for_critical_journeys_present"],
    "method step 3: sequence diagrams for critical journeys are present");
  boolCheck(results, "call_and_flow_views",
    "data_flow_views_for_pipelines_present",
    manifest, ["call_and_flow", "data_flow_for_pipelines_present"],
    "method step 3: data-flow views for pipelines are present");

  // ---- Section 4: architecture_maps ----
  boolCheck(results, "architecture_maps", "architecture_map_present",
    manifest, ["architecture", "map_present"],
    "method step 4: an architecture map is present");
  const [levels, hasLevels] = getPath(
    manifest, "architecture", "levels_declared");
  const levelsIsList = hasLevels && Array.isArray(levels);
  const notDeclared: string[] | null = levelsIsList
    ? STATED_C4_LEVELS.filter(
        (level) => !(levels as unknown[]).includes(level))
    : null;
  check(results, "architecture_maps", "c4_levels_cover_stated_levels",
    levels, levelsIsList,
    levelsIsList && (notDeclared as string[]).length === 0,
    "method step 4: the declared architecture levels cover every C4-lite level the skill names — context, containers, components");
  boolCheck(results, "architecture_maps", "one_page_per_level",
    manifest, ["architecture", "one_page_per_level"],
    "method step 4: the architecture map keeps one page per level");
  boolCheck(results, "architecture_maps", "owners_annotated",
    manifest, ["architecture", "owners_annotated"],
    "method step 4: owners are annotated on the architecture map");
  boolCheck(results, "architecture_maps", "boundaries_annotated",
    manifest, ["architecture", "boundaries_annotated"],
    "method step 4: boundaries are annotated on the architecture map");
  boolCheck(results, "architecture_maps", "adrs_live_beside_maps",
    manifest, ["architecture", "adrs_live_beside_maps"],
    "method step 4: ADRs live beside the architecture maps");

  // ---- Section 5: metrics_and_history_views ----
  boolCheck(results, "metrics_and_history_views",
    "complexity_heatmap_present",
    manifest, ["metrics", "complexity_heatmap_present"],
    "method step 5: a complexity heatmap is present");
  boolCheck(results, "metrics_and_history_views",
    "coverage_overlay_present",
    manifest, ["metrics", "coverage_overlay_present"],
    "method step 5: a coverage overlay is present");
  boolCheck(results, "metrics_and_history_views",
    "hotspot_view_considered",
    manifest, ["metrics", "hotspot_view_considered"],
    "quality gate: a hotspot view (churn x complexity) is considered for refactor targets");
  const [changeFreq, hasCf] = getPath(
    manifest, "metrics", "hotspot_change_frequency");
  const [complexity, hasCx] = getPath(
    manifest, "metrics", "hotspot_complexity");
  const [declaredScore, hasScore] = getPath(
    manifest, "metrics", "declared_hotspot_score");
  const hotspotAllNumbers = hasCf && hasCx && hasScore &&
    isNumber(changeFreq) && isNumber(complexity) && isNumber(declaredScore);
  const computedHotspot: number | null =
    hasCf && hasCx && isNumber(changeFreq) && isNumber(complexity)
      ? (changeFreq as number) * (complexity as number)
      : null;
  const hotspotDifference: number | null =
    computedHotspot !== null && hasScore && isNumber(declaredScore)
      ? (declaredScore as number) - computedHotspot
      : null;
  const hotspotConsistent = hotspotAllNumbers &&
    fmt6((declaredScore as number) -
      (changeFreq as number) * (complexity as number)) === "0.000000";
  check(results, "metrics_and_history_views",
    "hotspot_score_matches_change_frequency_times_complexity",
    declaredScore, hotspotAllNumbers, hotspotConsistent,
    "method step 5: the declared hotspot score equals the declared change frequency multiplied by the declared complexity (change-frequency x complexity; no score cutoff is judged here)");
  boolCheck(results, "metrics_and_history_views", "churn_timeline_present",
    manifest, ["history", "churn_timeline_present"],
    "method step 6: a churn timeline history view is present");
  boolCheck(results, "metrics_and_history_views", "ownership_map_present",
    manifest, ["history", "ownership_map_present"],
    "method step 6: an ownership map history view is present");
  boolCheck(results, "metrics_and_history_views",
    "incident_overlays_present",
    manifest, ["history", "incident_overlays_present"],
    "method step 6: incident overlays on history views are present");

  // ---- Section 6: honesty_and_currency ----
  boolCheck(results, "honesty_and_currency",
    "each_diagram_labeled_with_scope_and_generation_source",
    manifest,
    ["honesty", "each_diagram_labeled_scope_and_generation_source"],
    "quality gate: each diagram is labeled with scope and generation source");
  boolCheck(results, "honesty_and_currency",
    "diagrams_labeled_generated_at_tool_and_scope",
    manifest, ["honesty", "diagrams_labeled_generated_at_tool_scope"],
    "method step 7: diagrams are labeled with generated-at, tool, and scope");
  boolCheck(results, "honesty_and_currency",
    "generatable_diagrams_generated",
    manifest, ["honesty", "generatable_diagrams_generated"],
    "method step 7: what can be generated is generated");
  falseCheck(results, "honesty_and_currency",
    "stale_diagrams_not_shipped_as_truth",
    manifest, ["honesty", "stale_diagrams_shipped_as_truth"],
    "red line: no stale diagrams are shipped as truth — stale diagrams are deleted or regenerated rather than let lie");
  falseCheck(results, "honesty_and_currency",
    "unlabeled_hand_drawn_maps_not_guiding_decisions",
    manifest, ["honesty", "unlabeled_hand_drawn_maps_guiding_decisions"],
    "red line: no unlabeled hand-drawn maps guide decisions — regenerate or remove");

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
    verdict = "CODEBASE_VISUALIZATION_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CODEBASE_VISUALIZATION_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "diagram_entries_complete" ||
      r.check === "diagram_formats_use_stated_diagrams_as_code_tools" ||
      r.check === "dependency_graph_covers_all_declared_modules" ||
      r.check === "c4_levels_cover_stated_levels" ||
      r.check === "hotspot_score_matches_change_frequency_times_complexity")
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
    service: "codebase-visualization",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    diagrams_evaluated: diagramsEvaluated,
    computed_dependency_coverage: fmt6(computedCoverage),
    dependency_coverage_difference: fmt6(coverageDifference),
    computed_hotspot_score: fmt6(computedHotspot),
    hotspot_score_difference: fmt6(hotspotDifference),
    c4_levels_not_declared: notDeclared,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CODEBASE VISUALIZATION",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
