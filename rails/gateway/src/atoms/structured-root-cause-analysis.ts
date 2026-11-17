// Structured root cause analysis — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/structured-root-cause-analysis/src/structured_root_cause_analysis.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  analysis_title: "string",
  problem: {
    problem_statement_stated: "boolean",
    inference_type_classified: "boolean",
    scope_boundary_stated: "boolean",
    trigger_distinguished_from_root_cause: "boolean",
    controllable_cause_targeted: "boolean",
  },
  decomposition: {
    mece_decomposition_declared: "boolean",
    hypothesis_tree_declared: "boolean",
    branches_ranked_by_likelihood_and_test_cost: "boolean",
  },
  timeline_events: [{
    event_id: "string",
    sequence_number: "number",
  }],
  factors: [{
    factor_id: "string",
    category: "string",
    evidence_tier: "string",
  }],
  causal_chain: [{
    link_id: "string",
    depth: "number",
    factor_id: "string",
  }],
  evidence: {
    evidence_tiers_applied: "boolean",
    base_rates_considered_first: "boolean",
    evidence_update_stated: "boolean",
    magnitudes_and_ranges_quantified: "boolean",
    units_and_assumptions_stated: "boolean",
  },
  verification: {
    root_cause_verified_by_revert_or_test: "boolean",
    counterfactual_test_recorded: "boolean",
    strongest_counterargument_stated: "boolean",
    contradicting_data_named: "boolean",
    revision_conditions_stated: "boolean",
  },
  conclusion: {
    conclusion_confidence_and_basis_stated: "boolean",
  },
  corrective_actions: [{
    action_id: "string",
    factor_id: "string",
  }],
  red_lines: {
    unverified_single_source_conclusion_present: "boolean",
    post_hoc_storytelling_present: "boolean",
    plausible_presented_as_proven_present: "boolean",
    cause_asserted_without_declared_evidence_present: "boolean",
    person_blame_as_root_cause_present: "boolean",
  },
};

export const SECTIONS = [
  "problem_framing_and_inference",
  "decomposition_and_timeline",
  "causal_chain_and_fishbone",
  "evidence_and_quantification",
  "verification_falsification_and_conclusion",
  "red_lines",
] as const;

const EVIDENCE_TIERS = ["measurement", "log", "report", "opinion"];

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
  analysis_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  timeline_events_count: number | null;
  factor_rows_count: number | null;
  causal_chain_links_count: number | null;
  corrective_action_rows_count: number | null;
  duplicate_timeline_event_ids: string[] | null;
  duplicate_factor_ids: string[] | null;
  duplicate_causal_chain_link_ids: string[] | null;
  duplicate_corrective_action_ids: string[] | null;
  factors_without_category: string[] | null;
  factors_missing_evidence_tier: string[] | null;
  factors_with_unrecognised_evidence_tier: string[] | null;
  causal_chain_links_with_unreferenced_factor: string[] | null;
  corrective_actions_with_unreferenced_factor: string[] | null;
  fishbone_categories_declared_count: number | null;
  factor_category_coverage_ratio: string | null;
  factor_evidence_tier_ratio: string | null;
  causal_chain_reference_ratio: string | null;
  corrective_action_reference_ratio: string | null;
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

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function rowId(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) {
        dups.push(nm);
      }
      seen.push(nm);
    }
  }
  return dups;
}

function factorCompleteForCategory(entry: unknown): boolean {
  return isPyDict(entry) && hasField(entry, "category") &&
    nonemptyStr(entry["category"]);
}

function factorCompleteForTier(entry: unknown): boolean {
  return isPyDict(entry) && hasField(entry, "evidence_tier") &&
    nonemptyStr(entry["evidence_tier"]);
}

function factorTierRecognised(entry: unknown): boolean {
  return factorCompleteForTier(entry) &&
    EVIDENCE_TIERS.includes(
      (entry as Record<string, unknown>)["evidence_tier"] as string);
}

function refComplete(entry: unknown): boolean {
  return isPyDict(entry) && hasField(entry, "factor_id") &&
    nonemptyStr(entry["factor_id"]);
}

function refMatches(entry: unknown, factorIds: string[]): boolean {
  return refComplete(entry) &&
    factorIds.includes((entry as Record<string, unknown>)["factor_id"] as string);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [timelineRaw, hasTimeline] = getPath(manifest, "timeline_events");
  const timelineIsList = hasTimeline && Array.isArray(timelineRaw);
  const tRows: unknown[] = timelineIsList ? (timelineRaw as unknown[]) : [];
  const timelineCount: number | null = timelineIsList ? tRows.length : null;

  const [factorsRaw, hasFactors] = getPath(manifest, "factors");
  const factorsIsList = hasFactors && Array.isArray(factorsRaw);
  const fRows: unknown[] = factorsIsList ? (factorsRaw as unknown[]) : [];
  const factorsCount: number | null = factorsIsList ? fRows.length : null;
  const factorIds: string[] = fRows
    .filter((c) => isPyDict(c) && typeof c["factor_id"] === "string")
    .map((c) => (c as Record<string, unknown>)["factor_id"] as string);

  const [chainRaw, hasChain] = getPath(manifest, "causal_chain");
  const chainIsList = hasChain && Array.isArray(chainRaw);
  const cRows: unknown[] = chainIsList ? (chainRaw as unknown[]) : [];
  const chainCount: number | null = chainIsList ? cRows.length : null;

  const [actionsRaw, hasActions] = getPath(manifest, "corrective_actions");
  const actionsIsList = hasActions && Array.isArray(actionsRaw);
  const aRows: unknown[] = actionsIsList ? (actionsRaw as unknown[]) : [];
  const actionsCount: number | null = actionsIsList ? aRows.length : null;

  const duplicateTimelineEventIds: string[] | null = timelineIsList
    ? duplicates(tRows, "event_id") : null;
  const duplicateFactorIds: string[] | null = factorsIsList
    ? duplicates(fRows, "factor_id") : null;
  const duplicateChainLinkIds: string[] | null = chainIsList
    ? duplicates(cRows, "link_id") : null;
  const duplicateActionIds: string[] | null = actionsIsList
    ? duplicates(aRows, "action_id") : null;
  const factorsWithoutCategory: string[] | null = factorsIsList
    ? fRows.filter((c) => !factorCompleteForCategory(c))
        .map((c) => rowId(c, "factor_id"))
    : null;
  const factorsMissingTier: string[] | null = factorsIsList
    ? fRows.filter((c) => !factorCompleteForTier(c))
        .map((c) => rowId(c, "factor_id"))
    : null;
  const factorsWithUnrecognisedTier: string[] | null = factorsIsList
    ? fRows.filter((c) => factorCompleteForTier(c) &&
        !factorTierRecognised(c)).map((c) => rowId(c, "factor_id"))
    : null;
  const chainLinksUnreferenced: string[] | null =
    chainIsList && factorsIsList
      ? cRows.filter((c) => refComplete(c) && !refMatches(c, factorIds))
          .map((c) => rowId(c, "link_id"))
      : null;
  const actionsUnreferenced: string[] | null =
    actionsIsList && factorsIsList
      ? aRows.filter((c) => refComplete(c) && !refMatches(c, factorIds))
          .map((c) => rowId(c, "action_id"))
      : null;
  const fishboneCategoriesCount: number | null = factorsIsList
    ? new Set(fRows.filter((c) => factorCompleteForCategory(c))
        .map((c) => (c as Record<string, unknown>)["category"] as string)).size
    : null;
  const factorCategoryCoverageRatio: number | null =
    factorsIsList && factorsCount !== null && factorsCount > 0
      ? fRows.filter((c) => factorCompleteForCategory(c)).length / factorsCount
      : null;
  const factorEvidenceTierRatio: number | null =
    factorsIsList && factorsCount !== null && factorsCount > 0
      ? fRows.filter((c) => factorTierRecognised(c)).length / factorsCount
      : null;
  const chainReferenceRatio: number | null =
    chainIsList && factorsIsList && chainCount !== null && chainCount > 0
      ? cRows.filter((c) => refMatches(c, factorIds)).length / chainCount
      : null;
  const actionReferenceRatio: number | null =
    actionsIsList && factorsIsList && actionsCount !== null && actionsCount > 0
      ? aRows.filter((c) => refMatches(c, factorIds)).length / actionsCount
      : null;

  // ---- Section 1: problem_framing_and_inference ----
  boolCheck(results, "problem_framing_and_inference",
    "rca_problem_statement_stated", manifest,
    ["problem", "problem_statement_stated"],
    "problem: the problem the analysis explains is stated");
  boolCheck(results, "problem_framing_and_inference",
    "rca_inference_type_classified", manifest,
    ["problem", "inference_type_classified"],
    "problem: the inference type is classified (deduction, induction or abduction) and the confidence that type earns is the confidence claimed");
  boolCheck(results, "problem_framing_and_inference",
    "rca_scope_boundary_stated", manifest,
    ["problem", "scope_boundary_stated"],
    "problem: the scope and boundary of the analysis are stated (what is in, what is out)");
  boolCheck(results, "problem_framing_and_inference",
    "rca_trigger_distinguished_from_root", manifest,
    ["problem", "trigger_distinguished_from_root_cause"],
    "problem: the trigger is distinguished from the root cause — the event that set it off is not recorded as the cause that explains it");
  boolCheck(results, "problem_framing_and_inference",
    "rca_controllable_cause_targeted", manifest,
    ["problem", "controllable_cause_targeted"],
    "problem: the hunt is aimed at the controllable cause, not at a cause no one can act on");

  // ---- Section 2: decomposition_and_timeline ----
  boolCheck(results, "decomposition_and_timeline",
    "rca_mece_decomposition_declared", manifest,
    ["decomposition", "mece_decomposition_declared"],
    "decomposition: the problem is decomposed MECE (no overlaps, no gaps) before it is answered");
  boolCheck(results, "decomposition_and_timeline",
    "rca_hypothesis_tree_declared", manifest,
    ["decomposition", "hypothesis_tree_declared"],
    "decomposition: the candidate causes are laid out as a hypothesis tree");
  boolCheck(results, "decomposition_and_timeline",
    "rca_branches_ranked_by_likelihood_and_test_cost", manifest,
    ["decomposition", "branches_ranked_by_likelihood_and_test_cost"],
    "decomposition: the tree's branches are ranked by likelihood x cost to test");
  check(results, "decomposition_and_timeline",
    "rca_timeline_events_list_declared", timelineRaw, timelineIsList,
    timelineIsList && timelineCount !== null && timelineCount > 0,
    "the declared record names its timeline events — the timeline_events list is present and names at least one event; an absent list is missing evidence and an empty list declares no timeline at all");
  const timelineIdPresent = timelineIsList &&
    tRows.every((c) => hasField(c, "event_id"));
  check(results, "decomposition_and_timeline",
    "every_rca_timeline_event_id_unique", timelineRaw, timelineIdPresent,
    timelineIsList && duplicateTimelineEventIds !== null &&
      duplicateTimelineEventIds.length === 0,
    "timeline events: no declared event_id is owned by more than one row");
  const sequencePresent = timelineIsList &&
    tRows.every((c) => hasField(c, "sequence_number") &&
      isNumber((c as Record<string, unknown>)["sequence_number"]));
  check(results, "decomposition_and_timeline",
    "rca_timeline_sequence_strictly_increasing", timelineRaw,
    sequencePresent,
    timelineIsList &&
      tRows.every((c, i) => i === 0 ||
        (isNumber((tRows[i - 1] as Record<string, unknown>)["sequence_number"]) &&
         isNumber((c as Record<string, unknown>)["sequence_number"]) &&
         ((c as Record<string, unknown>)["sequence_number"] as number) >
           ((tRows[i - 1] as Record<string, unknown>)["sequence_number"] as number))),
    "timeline events: the declared sequence numbers strictly increase in row order — the record's own timeline never runs backwards");

  // ---- Section 3: causal_chain_and_fishbone ----
  check(results, "causal_chain_and_fishbone",
    "rca_factor_rows_list_declared", factorsRaw, factorsIsList,
    factorsIsList && factorsCount !== null && factorsCount > 0,
    "the declared record names its fishbone factor rows — the factors list is present and names at least one factor; an absent list is missing evidence and an empty list declares no fishbone at all");
  const factorIdPresent = factorsIsList &&
    fRows.every((c) => hasField(c, "factor_id"));
  check(results, "causal_chain_and_fishbone",
    "every_rca_factor_id_unique", factorsRaw, factorIdPresent,
    factorsIsList && duplicateFactorIds !== null &&
      duplicateFactorIds.length === 0,
    "factor rows: no declared factor_id is owned by more than one row");
  const categoryPresent = factorsIsList &&
    fRows.every((c) => hasField(c, "category"));
  check(results, "causal_chain_and_fishbone",
    "every_rca_factor_category_declared", factorsRaw, categoryPresent,
    factorsIsList && fRows.every((c) => factorCompleteForCategory(c)),
    "factor rows: every declared factor declares its fishbone category, none empty");
  check(results, "causal_chain_and_fishbone",
    "rca_causal_chain_list_declared", chainRaw, chainIsList,
    chainIsList && chainCount !== null && chainCount > 0,
    "the declared record names its causal chain — the causal_chain list is present and names at least one link; an absent list is missing evidence and an empty list declares no chain at all");
  const linkIdPresent = chainIsList &&
    cRows.every((c) => hasField(c, "link_id"));
  check(results, "causal_chain_and_fishbone",
    "every_rca_causal_chain_link_id_unique", chainRaw, linkIdPresent,
    chainIsList && duplicateChainLinkIds !== null &&
      duplicateChainLinkIds.length === 0,
    "causal chain: no declared link_id is owned by more than one row");
  const depthPresent = chainIsList &&
    cRows.every((c) => hasField(c, "depth") &&
      isNumber((c as Record<string, unknown>)["depth"]));
  check(results, "causal_chain_and_fishbone",
    "rca_causal_chain_depths_consecutive_from_one", chainRaw, depthPresent,
    chainIsList &&
      cRows.every((c, i) => isNumber((c as Record<string, unknown>)["depth"]) &&
        (c as Record<string, unknown>)["depth"] === i + 1),
    "causal chain: the declared links' depths run consecutively from one in row order — the 5-whys chain the record declares has no skipped or repeated depth");
  const chainRefPresent = chainIsList && factorsIsList &&
    cRows.every((c) => hasField(c, "factor_id"));
  check(results, "causal_chain_and_fishbone",
    "every_rca_causal_chain_link_factor_referenced", chainRaw,
    chainRefPresent,
    chainIsList && factorsIsList &&
      cRows.every((c) => refMatches(c, factorIds)),
    "causal chain: every declared link's factor_id references a factor declared in the factor rows");

  // ---- Section 4: evidence_and_quantification ----
  boolCheck(results, "evidence_and_quantification",
    "rca_evidence_tiers_applied", manifest,
    ["evidence", "evidence_tiers_applied"],
    "evidence: the evidence is tiered (measurements > logs > reports > opinions)");
  boolCheck(results, "evidence_and_quantification",
    "rca_base_rates_considered_first", manifest,
    ["evidence", "base_rates_considered_first"],
    "evidence: base rates are considered first, before the case's own story");
  boolCheck(results, "evidence_and_quantification",
    "rca_evidence_update_stated", manifest,
    ["evidence", "evidence_update_stated"],
    "evidence: how new evidence updates the view is stated (how much this evidence should change it)");
  boolCheck(results, "evidence_and_quantification",
    "rca_magnitudes_and_ranges_quantified", manifest,
    ["evidence", "magnitudes_and_ranges_quantified"],
    "quantification: magnitudes and ranges are quantified — ballpark numbers, not hand-waving");
  boolCheck(results, "evidence_and_quantification",
    "rca_units_and_assumptions_stated", manifest,
    ["evidence", "units_and_assumptions_stated"],
    "quantification: units and assumptions are stated with the quantified magnitudes");
  const tierPresent = factorsIsList &&
    fRows.every((c) => hasField(c, "evidence_tier"));
  check(results, "evidence_and_quantification",
    "every_rca_factor_evidence_tier_recognised", factorsRaw, tierPresent,
    factorsIsList && fRows.every((c) => factorTierRecognised(c)),
    "factor rows: every declared factor's evidence tier is one of the skill's four tiers — measurement, log, report, opinion");

  // ---- Section 5: verification_falsification_and_conclusion ----
  boolCheck(results, "verification_falsification_and_conclusion",
    "rca_root_cause_verified_by_revert_or_test", manifest,
    ["verification", "root_cause_verified_by_revert_or_test"],
    "verification: the root cause is verified by reverting or testing the cause — a plausible candidate does not count until tested");
  boolCheck(results, "verification_falsification_and_conclusion",
    "rca_counterfactual_test_recorded", manifest,
    ["verification", "counterfactual_test_recorded"],
    "verification: a counterfactual test is recorded (removing the declared cause is declared to remove the declared effect)");
  boolCheck(results, "verification_falsification_and_conclusion",
    "rca_strongest_counterargument_stated", manifest,
    ["verification", "strongest_counterargument_stated"],
    "falsification: the strongest counterargument to the conclusion is stated");
  boolCheck(results, "verification_falsification_and_conclusion",
    "rca_contradicting_data_named", manifest,
    ["verification", "contradicting_data_named"],
    "falsification: the data that would contradict the conclusion is named");
  boolCheck(results, "verification_falsification_and_conclusion",
    "rca_revision_conditions_stated", manifest,
    ["verification", "revision_conditions_stated"],
    "falsification: what would change the analyst's mind is written down (revision conditions)");
  boolCheck(results, "verification_falsification_and_conclusion",
    "rca_conclusion_confidence_and_basis_stated", manifest,
    ["conclusion", "conclusion_confidence_and_basis_stated"],
    "conclusion: the record lands its conclusion with its confidence and its basis stated");
  check(results, "verification_falsification_and_conclusion",
    "rca_corrective_action_rows_list_declared", actionsRaw, actionsIsList,
    actionsIsList && actionsCount !== null && actionsCount > 0,
    "the declared record names its corrective actions — the corrective_actions list is present and names at least one action; an absent list is missing evidence and an empty list declares no corrective action at all");
  const actionIdPresent = actionsIsList &&
    aRows.every((c) => hasField(c, "action_id"));
  check(results, "verification_falsification_and_conclusion",
    "every_rca_corrective_action_id_unique", actionsRaw, actionIdPresent,
    actionsIsList && duplicateActionIds !== null &&
      duplicateActionIds.length === 0,
    "corrective actions: no declared action_id is owned by more than one row");
  const actionRefPresent = actionsIsList && factorsIsList &&
    aRows.every((c) => hasField(c, "factor_id"));
  check(results, "verification_falsification_and_conclusion",
    "every_rca_corrective_action_factor_referenced", actionsRaw,
    actionRefPresent,
    actionsIsList && factorsIsList &&
      aRows.every((c) => refMatches(c, factorIds)),
    "corrective actions: every declared action's factor_id references a factor declared in the factor rows — an action aimed at no declared factor is not linked to the record's own root cause");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "rca_free_of_unverified_single_source_conclusion", manifest,
    ["red_lines", "unverified_single_source_conclusion_present"],
    "red line: no conclusion drawn from an unverified single source is present in the record");
  falseCheck(results, "red_lines",
    "rca_free_of_post_hoc_storytelling", manifest,
    ["red_lines", "post_hoc_storytelling_present"],
    "red line: no post-hoc storytelling is present in the record (a story fitted after the fact is not a cause)");
  falseCheck(results, "red_lines",
    "rca_free_of_plausible_presented_as_proven", manifest,
    ["red_lines", "plausible_presented_as_proven_present"],
    "red line: nothing merely plausible is presented as proven in the record");
  falseCheck(results, "red_lines",
    "rca_free_of_cause_without_declared_evidence", manifest,
    ["red_lines", "cause_asserted_without_declared_evidence_present"],
    "red line: no cause asserted without declared evidence behind it is present in the record");
  falseCheck(results, "red_lines",
    "rca_free_of_person_blame_as_root_cause", manifest,
    ["red_lines", "person_blame_as_root_cause_present"],
    "red line: no person blame recorded as the root cause is present in the record — the hunt targets the controllable cause, not a person");

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
    verdict = "ROOT_CAUSE_ANALYSIS_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "ROOT_CAUSE_ANALYSIS_SOUND";
  }

  const computedNames = [
    "rca_timeline_events_list_declared",
    "every_rca_timeline_event_id_unique",
    "rca_timeline_sequence_strictly_increasing",
    "rca_factor_rows_list_declared",
    "every_rca_factor_id_unique",
    "every_rca_factor_category_declared",
    "rca_causal_chain_list_declared",
    "every_rca_causal_chain_link_id_unique",
    "rca_causal_chain_depths_consecutive_from_one",
    "every_rca_causal_chain_link_factor_referenced",
    "every_rca_factor_evidence_tier_recognised",
    "rca_corrective_action_rows_list_declared",
    "every_rca_corrective_action_id_unique",
    "every_rca_corrective_action_factor_referenced",
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
    service: "structured-root-cause-analysis",
    atom_version: "0.1.0",
    analysis_title: manifest["analysis_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    timeline_events_count: timelineCount,
    factor_rows_count: factorsCount,
    causal_chain_links_count: chainCount,
    corrective_action_rows_count: actionsCount,
    duplicate_timeline_event_ids: duplicateTimelineEventIds,
    duplicate_factor_ids: duplicateFactorIds,
    duplicate_causal_chain_link_ids: duplicateChainLinkIds,
    duplicate_corrective_action_ids: duplicateActionIds,
    factors_without_category: factorsWithoutCategory,
    factors_missing_evidence_tier: factorsMissingTier,
    factors_with_unrecognised_evidence_tier: factorsWithUnrecognisedTier,
    causal_chain_links_with_unreferenced_factor: chainLinksUnreferenced,
    corrective_actions_with_unreferenced_factor: actionsUnreferenced,
    fishbone_categories_declared_count: fishboneCategoriesCount,
    factor_category_coverage_ratio: fmt6(factorCategoryCoverageRatio),
    factor_evidence_tier_ratio: fmt6(factorEvidenceTierRatio),
    causal_chain_reference_ratio: fmt6(chainReferenceRatio),
    corrective_action_reference_ratio: fmt6(actionReferenceRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "STRUCTURED ROOT CAUSE ANALYSIS",
    `analysis_title: ${pyStr(verdict.analysis_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
