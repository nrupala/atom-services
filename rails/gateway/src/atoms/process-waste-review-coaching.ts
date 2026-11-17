// Process waste review coaching — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/process-waste-review-coaching/src/process_waste_review_coaching.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const DOWNTIME_CATEGORIES = [
  "defects",
  "overproduction",
  "waiting",
  "non_utilized_talent",
  "transportation",
  "inventory",
  "motion",
  "excess_processing",
];

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  process: "string",
  define: {
    problem_stated: "boolean",
    goal_measurable_stated: "boolean",
    scope_stated: "boolean",
    customer_need_stated: "boolean",
    whole_system_scope_declared: "boolean",
  },
  mapping: {
    whole_flow_mapped: "boolean",
    work_made_visible: "boolean",
    process_defined_before_automation: "boolean",
  },
  steps: [{
    name: "string",
    duration_minutes: "number",
    wait_before_minutes: "number",
  }],
  wastes: [{
    category: "string",
    step_name: "string",
  }],
  measure: {
    baseline_established_with_data: "boolean",
    baseline_from_data_not_anecdote: "boolean",
  },
  metrics: {
    leading_indicators_declared: "boolean",
    lagging_indicators_declared: "boolean",
    kpis_limited_to_meaningful_declared: "boolean",
    metrics_made_visible: "boolean",
  },
  analyze: {
    root_cause_analysis_performed: "boolean",
    pareto_vital_few_identified: "boolean",
  },
  constraint: {
    bottleneck_identified: "boolean",
    non_bottleneck_effort_subordinated: "boolean",
    bottleneck_step_name: "string",
  },
  improve: {
    improvement_piloted_before_scaling: "boolean",
    pdca_cycle_declared: "boolean",
    verified_against_baseline_before_scaling: "boolean",
    small_continuous_improvement_declared: "boolean",
    flow_and_pull_pursued_over_push: "boolean",
  },
  control: {
    win_standardized: "boolean",
    monitoring_in_place: "boolean",
    regression_made_visible: "boolean",
  },
  red_lines: {
    automating_broken_process_present: "boolean",
    vanity_metrics_present: "boolean",
    hero_culture_reliance_present: "boolean",
    optimizing_non_constraint_present: "boolean",
    tradition_without_data_present: "boolean",
    local_optimization_hurting_whole_present: "boolean",
  },
};

export const SECTIONS = [
  "define_and_visibility",
  "steps_and_waste_observation",
  "measurement_and_metrics",
  "analysis_and_constraint",
  "improvement_and_control",
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
  process: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  steps_count: number | null;
  wastes_count: number | null;
  total_duration_minutes: number | null;
  total_wait_minutes: number | null;
  wait_share: string | null;
  distinct_waste_categories: string[] | null;
  duplicate_step_names: string[] | null;
  unmatched_waste_step_names: string[] | null;
  waste_step_coverage: string | null;
  bottleneck_step_computed: string | null;
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

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [stepsRaw, hasSteps] = getPath(manifest, "steps");
  const stepsIsList = hasSteps && Array.isArray(stepsRaw);
  const srows: unknown[] = stepsIsList ? (stepsRaw as unknown[]) : [];
  const stepsCount: number | null = stepsIsList ? srows.length : null;

  const [wastesRaw, hasWastes] = getPath(manifest, "wastes");
  const wastesIsList = hasWastes && Array.isArray(wastesRaw);
  const wrows: unknown[] = wastesIsList ? (wastesRaw as unknown[]) : [];
  const wastesCount: number | null = wastesIsList ? wrows.length : null;

  const stepNames: string[] = stepsIsList
    ? srows.filter((c) => isPyDict(c) && typeof c["name"] === "string")
        .map((c) => (c as Record<string, unknown>)["name"] as string)
    : [];
  let duplicateStepNames: string[] | null = null;
  if (stepsIsList) {
    const seen: string[] = [];
    duplicateStepNames = [];
    for (const nm of stepNames) {
      if (seen.includes(nm) && !duplicateStepNames.includes(nm)) {
        duplicateStepNames.push(nm);
      }
      seen.push(nm);
    }
  }
  let totalDurationMinutes: number | null = null;
  if (stepsIsList && srows.every((c) => isPyDict(c) && isNumber(c["duration_minutes"]))) {
    let total = 0;
    for (const c of srows) {
      total += (c as Record<string, unknown>)["duration_minutes"] as number;
    }
    totalDurationMinutes = total;
  }
  let totalWaitMinutes: number | null = null;
  if (stepsIsList && srows.every((c) => isPyDict(c) && isNumber(c["wait_before_minutes"]))) {
    let total = 0;
    for (const c of srows) {
      total += (c as Record<string, unknown>)["wait_before_minutes"] as number;
    }
    totalWaitMinutes = total;
  }
  const waitShare: number | null =
    totalWaitMinutes !== null && totalDurationMinutes !== null &&
    (totalWaitMinutes + totalDurationMinutes) > 0
      ? totalWaitMinutes / (totalWaitMinutes + totalDurationMinutes)
      : null;
  let bottleneckStepComputed: string | null = null;
  if (stepsIsList && srows.length > 0 &&
      srows.every((c) => isPyDict(c) && typeof c["name"] === "string" &&
        isNumber(c["duration_minutes"]))) {
    let best = srows[0] as Record<string, unknown>;
    for (const c of srows.slice(1)) {
      const row = c as Record<string, unknown>;
      if ((row["duration_minutes"] as number) > (best["duration_minutes"] as number)) {
        best = row;
      }
    }
    bottleneckStepComputed = best["name"] as string;
  }
  let distinctWasteCategories: string[] | null = null;
  if (wastesIsList) {
    distinctWasteCategories = [];
    for (const c of wrows) {
      if (isPyDict(c) && typeof c["category"] === "string" &&
          DOWNTIME_CATEGORIES.includes(c["category"] as string) &&
          !distinctWasteCategories.includes(c["category"] as string)) {
        distinctWasteCategories.push(c["category"] as string);
      }
    }
  }
  let unmatchedWasteStepNames: string[] | null = null;
  if (wastesIsList && stepsIsList) {
    unmatchedWasteStepNames = wrows
      .filter((c) => isPyDict(c) && typeof c["step_name"] === "string" &&
        !stepNames.includes(c["step_name"] as string))
      .map((c) => (c as Record<string, unknown>)["step_name"] as string);
  }
  const wasteStepCoverage: number | null =
    wastesIsList && stepsIsList && wastesCount !== null && wastesCount > 0
      ? wrows.filter((c) => isPyDict(c) && typeof c["step_name"] === "string" &&
          stepNames.includes(c["step_name"] as string)).length / wastesCount
      : null;

  // ---- Section 1: define_and_visibility ----
  boolCheck(results, "define_and_visibility",
    "process_problem_stated", manifest,
    ["define", "problem_stated"],
    "define: the process problem is stated");
  boolCheck(results, "define_and_visibility",
    "process_goal_measurable_stated", manifest,
    ["define", "goal_measurable_stated"],
    "define: the goal is stated in measurable form");
  boolCheck(results, "define_and_visibility",
    "process_scope_stated", manifest,
    ["define", "scope_stated"],
    "define: the scope of the review is stated");
  boolCheck(results, "define_and_visibility",
    "customer_need_stated", manifest,
    ["define", "customer_need_stated"],
    "define: the customer's actual need is stated");
  boolCheck(results, "define_and_visibility",
    "whole_system_scope_declared", manifest,
    ["define", "whole_system_scope_declared"],
    "systems thinking: the review covers the whole process, not only a local part");
  boolCheck(results, "define_and_visibility",
    "whole_flow_mapped", manifest,
    ["mapping", "whole_flow_mapped"],
    "value stream: the whole flow is mapped");
  boolCheck(results, "define_and_visibility",
    "work_made_visible", manifest,
    ["mapping", "work_made_visible"],
    "visibility: the work is made visible — kanban or a simple dashboard");
  boolCheck(results, "define_and_visibility",
    "process_defined_before_automation", manifest,
    ["mapping", "process_defined_before_automation"],
    "the process is defined before it is automated");

  // ---- Section 2: steps_and_waste_observation ----
  check(results, "steps_and_waste_observation",
    "steps_declared", stepsRaw, stepsIsList, stepsIsList,
    "the declared record names its process steps — the steps list is present; an empty list declares that no steps are recorded");
  const stepNamePresent = stepsIsList &&
    srows.every((c) => hasField(c, "name"));
  check(results, "steps_and_waste_observation",
    "every_step_named", stepsRaw, stepNamePresent,
    stepsIsList && srows.every((c) => isPyDict(c) &&
      typeof c["name"] === "string" && c["name"] !== ""),
    "steps: every declared step row names a non-empty step name");
  const stepTimesPresent = stepsIsList &&
    srows.every((c) => hasField(c, "duration_minutes") && hasField(c, "wait_before_minutes"));
  check(results, "steps_and_waste_observation",
    "every_step_times_declared_and_nonnegative", stepsRaw, stepTimesPresent,
    stepsIsList && srows.every((c) => isPyDict(c) &&
      isNumber(c["duration_minutes"]) && (c["duration_minutes"] as number) >= 0 &&
      isNumber(c["wait_before_minutes"]) && (c["wait_before_minutes"] as number) >= 0),
    "steps: every declared step row declares a duration and a wait before it, and neither is negative — the waits expose the delays in the flow");
  check(results, "steps_and_waste_observation",
    "no_step_name_duplicated", stepsRaw, stepNamePresent,
    stepsIsList && duplicateStepNames !== null && duplicateStepNames.length === 0,
    "steps: no declared step name is owned by more than one step row");
  check(results, "steps_and_waste_observation",
    "wastes_declared", wastesRaw, wastesIsList, wastesIsList,
    "the declared record names its waste observations — the wastes list is present; an empty list declares that no waste is observed");
  const wasteCategoryPresent = wastesIsList &&
    wrows.every((c) => hasField(c, "category"));
  check(results, "steps_and_waste_observation",
    "every_waste_category_valid_downtime", wastesRaw, wasteCategoryPresent,
    wastesIsList && wrows.every((c) => isPyDict(c) &&
      DOWNTIME_CATEGORIES.includes(c["category"] as string)),
    "wastes: every declared waste row's category is one of the eight DOWNTIME wastes — defects, overproduction, waiting, non-utilized talent, transportation, inventory, motion, excess processing");
  const wasteStepPresent = wastesIsList && stepsIsList &&
    wrows.every((c) => hasField(c, "step_name"));
  check(results, "steps_and_waste_observation",
    "every_waste_step_names_declared_step", wastesRaw, wasteStepPresent,
    wastesIsList && stepsIsList && wrows.every((c) => isPyDict(c) &&
      typeof c["step_name"] === "string" &&
      stepNames.includes(c["step_name"] as string)),
    "wastes: every declared waste row names a step that is declared in the step record");

  // ---- Section 3: measurement_and_metrics ----
  boolCheck(results, "measurement_and_metrics",
    "baseline_established_with_data", manifest,
    ["measure", "baseline_established_with_data"],
    "measure: a real baseline is established");
  boolCheck(results, "measurement_and_metrics",
    "baseline_from_data_not_anecdote", manifest,
    ["measure", "baseline_from_data_not_anecdote"],
    "measure: the baseline rests on data, not anecdote");
  boolCheck(results, "measurement_and_metrics",
    "leading_indicators_declared", manifest,
    ["metrics", "leading_indicators_declared"],
    "metrics: leading — predictive — indicators are declared");
  boolCheck(results, "measurement_and_metrics",
    "lagging_indicators_declared", manifest,
    ["metrics", "lagging_indicators_declared"],
    "metrics: lagging — outcome — indicators are declared");
  boolCheck(results, "measurement_and_metrics",
    "kpis_limited_to_meaningful_declared", manifest,
    ["metrics", "kpis_limited_to_meaningful_declared"],
    "metrics: the KPI set is limited to a few meaningful indicators");
  boolCheck(results, "measurement_and_metrics",
    "metrics_made_visible", manifest,
    ["metrics", "metrics_made_visible"],
    "metrics: the indicators are made visible");

  // ---- Section 4: analysis_and_constraint ----
  boolCheck(results, "analysis_and_constraint",
    "root_cause_analysis_performed", manifest,
    ["analyze", "root_cause_analysis_performed"],
    "analyze: root-cause analysis — 5 Whys or fishbone — is performed");
  boolCheck(results, "analysis_and_constraint",
    "pareto_vital_few_identified", manifest,
    ["analyze", "pareto_vital_few_identified"],
    "analyze: the Pareto vital few are identified");
  boolCheck(results, "analysis_and_constraint",
    "process_bottleneck_identified", manifest,
    ["constraint", "bottleneck_identified"],
    "theory of constraints: the bottleneck is identified");
  boolCheck(results, "analysis_and_constraint",
    "non_bottleneck_effort_subordinated", manifest,
    ["constraint", "non_bottleneck_effort_subordinated"],
    "theory of constraints: everything else is subordinated to the bottleneck");
  const [bottleneckName, hasBottleneckName] = getPath(manifest, "constraint", "bottleneck_step_name");
  const bottleneckPresent = bottleneckStepComputed !== null && hasBottleneckName;
  check(results, "analysis_and_constraint",
    "declared_bottleneck_matches_longest_step", bottleneckName, bottleneckPresent,
    bottleneckStepComputed !== null && bottleneckName === bottleneckStepComputed,
    "theory of constraints: the declared bottleneck step is the longest declared step — the first step with the greatest declared duration");

  // ---- Section 5: improvement_and_control ----
  boolCheck(results, "improvement_and_control",
    "improvement_piloted_before_scaling", manifest,
    ["improve", "improvement_piloted_before_scaling"],
    "improve: the change is piloted before it is scaled");
  boolCheck(results, "improvement_and_control",
    "improvement_pdca_cycle_declared", manifest,
    ["improve", "pdca_cycle_declared"],
    "improve: the improvement follows a PDCA cycle");
  boolCheck(results, "improvement_and_control",
    "improvement_verified_against_baseline_before_scaling", manifest,
    ["improve", "verified_against_baseline_before_scaling"],
    "improve: the pilot is verified against the baseline before scaling");
  boolCheck(results, "improvement_and_control",
    "small_continuous_improvement_declared", manifest,
    ["improve", "small_continuous_improvement_declared"],
    "improve: the change is a small continuous improvement — kaizen — not a big rare one");
  boolCheck(results, "improvement_and_control",
    "flow_and_pull_pursued_over_push", manifest,
    ["improve", "flow_and_pull_pursued_over_push"],
    "improve: flow and pull are pursued over push");
  boolCheck(results, "improvement_and_control",
    "win_standardized", manifest,
    ["control", "win_standardized"],
    "control: the win is standardized");
  boolCheck(results, "improvement_and_control",
    "monitoring_in_place", manifest,
    ["control", "monitoring_in_place"],
    "control: the standardized win is monitored");
  boolCheck(results, "improvement_and_control",
    "regression_made_visible", manifest,
    ["control", "regression_made_visible"],
    "control: regression is made visible");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "no_automating_broken_process", manifest,
    ["red_lines", "automating_broken_process_present"],
    "red line: no automating a broken process is present in the record");
  falseCheck(results, "red_lines",
    "no_vanity_metrics", manifest,
    ["red_lines", "vanity_metrics_present"],
    "red line: no vanity metrics are present in the record");
  falseCheck(results, "red_lines",
    "no_hero_culture_reliance", manifest,
    ["red_lines", "hero_culture_reliance_present"],
    "red line: no hero culture instead of systems is present in the record");
  falseCheck(results, "red_lines",
    "no_optimizing_non_constraint", manifest,
    ["red_lines", "optimizing_non_constraint_present"],
    "red line: no optimizing a non-constraint is present in the record");
  falseCheck(results, "red_lines",
    "no_tradition_without_data", manifest,
    ["red_lines", "tradition_without_data_present"],
    "red line: no \"we've always done it this way\" without data is present in the record");
  falseCheck(results, "red_lines",
    "no_local_optimization_hurting_whole", manifest,
    ["red_lines", "local_optimization_hurting_whole_present"],
    "red line: no local optimization that hurts the whole is present in the record");

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
    verdict = "PROCESS_WASTE_REVIEW_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PROCESS_WASTE_REVIEW_READY";
  }

  const computedNames = [
    "steps_declared",
    "every_step_named",
    "every_step_times_declared_and_nonnegative",
    "no_step_name_duplicated",
    "wastes_declared",
    "every_waste_category_valid_downtime",
    "every_waste_step_names_declared_step",
    "declared_bottleneck_matches_longest_step",
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
    service: "process-waste-review-coaching",
    atom_version: "0.1.0",
    process: manifest["process"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    steps_count: stepsCount,
    wastes_count: wastesCount,
    total_duration_minutes: totalDurationMinutes,
    total_wait_minutes: totalWaitMinutes,
    wait_share: fmt6(waitShare),
    distinct_waste_categories: distinctWasteCategories,
    duplicate_step_names: duplicateStepNames,
    unmatched_waste_step_names: unmatchedWasteStepNames,
    waste_step_coverage: fmt6(wasteStepCoverage),
    bottleneck_step_computed: bottleneckStepComputed,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PROCESS WASTE REVIEW COACHING",
    `process: ${pyStr(verdict.process ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
