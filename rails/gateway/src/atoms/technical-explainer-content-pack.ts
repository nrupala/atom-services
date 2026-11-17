// Technical explainer content pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/technical-explainer-content-pack/src/technical_explainer_content_pack.py
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
  explainer_title: "string",
  audience: {
    defined: "boolean",
    reader_outcome_stated: "boolean",
    prior_knowledge_assumption_stated: "boolean",
    prior_knowledge_assumed: "boolean",
  },
  prerequisites: [{
    prerequisite_id: "string",
    description: "string",
  }],
  learning_objective_framing: {
    outcomes_stated_as_do_or_say: "boolean",
  },
  learning_objectives: [{
    objective_id: "string",
    outcome: "string",
  }],
  structure: {
    follows_spine_order: "boolean",
    single_core_idea_confirmed: "boolean",
    second_core_idea_present: "boolean",
    second_core_idea_split_off: "boolean",
  },
  explanation_sections: [{
    section_id: "string",
    spine_stage: "string",
    objective_id: "string",
  }],
  simplification: {
    language_simplified_not_facts: "boolean",
    simplifications_flagged_explicitly: "boolean",
    units_preserved_correct: "boolean",
    orders_of_magnitude_preserved_correct: "boolean",
    directions_preserved_correct: "boolean",
    jargon_defined_on_first_use: "boolean",
    reading_level_appropriate_for_audience: "boolean",
  },
  analogy: {
    analogy_used: "boolean",
    single_analogy_confirmed: "boolean",
    failure_mode_stated: "boolean",
  },
  example_work: {
    worked_mini_examples_included: "boolean",
    concrete_numbers_included: "boolean",
    concrete_cases_included: "boolean",
    visuals_included_where_they_carry_weight: "boolean",
  },
  worked_examples: [{
    example_id: "string",
    objective_id: "string",
    source_id: "string",
    steps_declared_complete: "boolean",
  }],
  misconceptions: [{
    misconception_id: "string",
    description: "string",
    addressed_section_id: "string",
  }],
  accuracy: {
    accuracy_review_done: "boolean",
    every_factual_claim_labeled: "boolean",
    every_factual_claim_sourced: "boolean",
  },
  sources: [{
    source_id: "string",
    citation: "string",
    archived: "boolean",
  }],
  safety: {
    safety_relevant_topic: "boolean",
    expert_review_by_qualified_person: "boolean",
    defers_to_licensed_practice_note_included: "boolean",
  },
  canonical: {
    canonical_explainer_identified: "boolean",
    renderings_regenerated_from_canonical_after_updates: "boolean",
  },
  renderings: [{
    rendering_id: "string",
    rendering_kind: "string",
    derived_from_canonical_source: "boolean",
  }],
  corrections: {
    corrections_dated: "boolean",
    corrections_visible: "boolean",
    corrections_logged: "boolean",
  },
  red_lines: {
    invented_numbers_or_figures_present: "boolean",
    unsupported_studies_show_claim_present: "boolean",
    fear_mongering_or_hype_present: "boolean",
    teaching_beyond_declared_competence_present: "boolean",
    unlicensed_practice_encouraged_present: "boolean",
  },
};

export const SECTIONS = [
  "audience_and_prerequisites",
  "learning_objectives",
  "explanation_spine_and_structure",
  "simplification_and_analogy_integrity",
  "worked_examples_and_concrete_numbers",
  "misconceptions_accuracy_and_safety",
  "renderings_and_corrections",
  "red_lines",
] as const;

const SPINE_STAGES = ["question", "why_it_matters", "core_idea", "how_it_works", "where_it_breaks", "what_to_watch"];
const RENDERING_KINDS = ["faq", "thread", "video_script"];

export type CheckStatus = "pass" | "fail" | "missing";
export interface CheckResult { section: string; check: string; status: CheckStatus; evidence: string; }
export interface Verdict {
  service: string; atom_version: string; explainer_title: unknown; verdict: string;
  sections: Record<string, string>; checks: CheckResult[]; computed_status: string | null;
  technical_explainer_prerequisites_count: number | null;
  technical_explainer_learning_objectives_count: number | null;
  technical_explainer_explanation_sections_count: number | null;
  technical_explainer_worked_examples_count: number | null;
  technical_explainer_misconceptions_count: number | null;
  technical_explainer_accuracy_sources_count: number | null;
  technical_explainer_renderings_count: number | null;
  duplicate_technical_explainer_prerequisite_ids: string[] | null;
  duplicate_technical_explainer_learning_objective_ids: string[] | null;
  duplicate_technical_explainer_explanation_section_ids: string[] | null;
  duplicate_technical_explainer_worked_example_ids: string[] | null;
  duplicate_technical_explainer_misconception_ids: string[] | null;
  duplicate_technical_explainer_accuracy_source_ids: string[] | null;
  duplicate_technical_explainer_rendering_ids: string[] | null;
  technical_explainer_prerequisites_without_description: string[] | null;
  technical_explainer_learning_objectives_without_outcome: string[] | null;
  technical_explainer_explanation_sections_with_invalid_spine_stage: string[] | null;
  technical_explainer_explanation_sections_with_unknown_objective_reference: string[] | null;
  technical_explainer_missing_spine_stages: string[] | null;
  technical_explainer_worked_examples_with_unknown_objective_reference: string[] | null;
  technical_explainer_worked_examples_with_unknown_source_reference: string[] | null;
  technical_explainer_worked_examples_without_complete_steps: string[] | null;
  technical_explainer_accuracy_sources_without_citation: string[] | null;
  technical_explainer_accuracy_sources_not_archived: string[] | null;
  technical_explainer_misconceptions_without_description: string[] | null;
  technical_explainer_misconceptions_with_unknown_addressed_section: string[] | null;
  technical_explainer_renderings_with_invalid_kind: string[] | null;
  technical_explainer_renderings_not_derived_from_canonical: string[] | null;
  spine_stage_coverage_ratio: string | null;
  objective_section_coverage_ratio: string | null;
  worked_example_traceability_ratio: string | null;
  accuracy_source_archive_ratio: string | null;
  misconception_resolution_ratio: string | null;
  rendering_derivation_ratio: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function getPath(manifest: Record<string, unknown>, ...path: string[]): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) return [null, false];
    cur = cur[key];
  }
  return [cur, true];
}
function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) && Object.prototype.hasOwnProperty.call(entry, field);
}
function check(results: CheckResult[], section: string, name: string, _value: unknown, present: boolean, ok: boolean, evidence: string): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}
function boolCheck(results: CheckResult[], section: string, name: string, manifest: Record<string, unknown>, path: string[], evidence: string): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}
function falseCheck(results: CheckResult[], section: string, name: string, manifest: Record<string, unknown>, path: string[], evidence: string): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}
function gatedBoolCheck(results: CheckResult[], section: string, name: string, manifest: Record<string, unknown>, gatePath: string[], targetPath: string[], evidence: string, naEvidence: string): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && gate) {
    check(results, section, name, target, hasTarget, target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}
function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}
function nonemptyStr(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") return entry[field] as string;
  return "unnamed";
}
function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = []; const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}
function idsOf(rows: unknown[], field: string): string[] {
  const out: string[] = [];
  for (const c of rows) if (isPyDict(c) && typeof c[field] === "string") out.push(c[field] as string);
  return out;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) throw new TypeError("manifest must be a JSON object");
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [prereqsRaw, hasPrereqs] = getPath(manifest, "prerequisites");
  const prereqsIsList = hasPrereqs && Array.isArray(prereqsRaw);
  const prereqRows: unknown[] = prereqsIsList ? (prereqsRaw as unknown[]) : [];
  const prereqsCount: number | null = prereqsIsList ? prereqRows.length : null;

  const [objectivesRaw, hasObjectives] = getPath(manifest, "learning_objectives");
  const objectivesIsList = hasObjectives && Array.isArray(objectivesRaw);
  const objectiveRows: unknown[] = objectivesIsList ? (objectivesRaw as unknown[]) : [];
  const objectivesCount: number | null = objectivesIsList ? objectiveRows.length : null;
  const objectiveIds = idsOf(objectiveRows, "objective_id");

  const [sectionsRaw, hasSections] = getPath(manifest, "explanation_sections");
  const sectionsIsList = hasSections && Array.isArray(sectionsRaw);
  const sectionRows: unknown[] = sectionsIsList ? (sectionsRaw as unknown[]) : [];
  const sectionsCount: number | null = sectionsIsList ? sectionRows.length : null;
  const sectionIds = idsOf(sectionRows, "section_id");

  const [examplesRaw, hasExamples] = getPath(manifest, "worked_examples");
  const examplesIsList = hasExamples && Array.isArray(examplesRaw);
  const exampleRows: unknown[] = examplesIsList ? (examplesRaw as unknown[]) : [];
  const examplesCount: number | null = examplesIsList ? exampleRows.length : null;

  const [miscRaw, hasMisc] = getPath(manifest, "misconceptions");
  const miscIsList = hasMisc && Array.isArray(miscRaw);
  const miscRows: unknown[] = miscIsList ? (miscRaw as unknown[]) : [];
  const miscCount: number | null = miscIsList ? miscRows.length : null;

  const [sourcesRaw, hasSources] = getPath(manifest, "sources");
  const sourcesIsList = hasSources && Array.isArray(sourcesRaw);
  const sourceRows: unknown[] = sourcesIsList ? (sourcesRaw as unknown[]) : [];
  const sourcesCount: number | null = sourcesIsList ? sourceRows.length : null;
  const sourceIds = idsOf(sourceRows, "source_id");

  const [renderingsRaw, hasRenderings] = getPath(manifest, "renderings");
  const renderingsIsList = hasRenderings && Array.isArray(renderingsRaw);
  const renderingRows: unknown[] = renderingsIsList ? (renderingsRaw as unknown[]) : [];
  const renderingsCount: number | null = renderingsIsList ? renderingRows.length : null;

  const dupPrereq: string[] | null = prereqsIsList ? duplicates(prereqRows, "prerequisite_id") : null;
  const dupObjective: string[] | null = objectivesIsList ? duplicates(objectiveRows, "objective_id") : null;
  const dupSection: string[] | null = sectionsIsList ? duplicates(sectionRows, "section_id") : null;
  const dupExample: string[] | null = examplesIsList ? duplicates(exampleRows, "example_id") : null;
  const dupMisc: string[] | null = miscIsList ? duplicates(miscRows, "misconception_id") : null;
  const dupSource: string[] | null = sourcesIsList ? duplicates(sourceRows, "source_id") : null;
  const dupRendering: string[] | null = renderingsIsList ? duplicates(renderingRows, "rendering_id") : null;

  const prereqsWithoutDesc: string[] | null = prereqsIsList ? prereqRows.filter((c) => hasField(c, "description") && !nonemptyStr((c as Record<string, unknown>)["description"])).map((c) => rowName(c, "prerequisite_id")) : null;
  const objectivesWithoutOutcome: string[] | null = objectivesIsList ? objectiveRows.filter((c) => hasField(c, "outcome") && !nonemptyStr((c as Record<string, unknown>)["outcome"])).map((c) => rowName(c, "objective_id")) : null;
  const sectionsInvalidStage: string[] | null = sectionsIsList ? sectionRows.filter((c) => hasField(c, "spine_stage") && !SPINE_STAGES.includes((c as Record<string, unknown>)["spine_stage"] as string)).map((c) => rowName(c, "section_id")) : null;
  const sectionsUnknownObj: string[] | null = sectionsIsList && objectivesIsList ? sectionRows.filter((c) => hasField(c, "objective_id") && !objectiveIds.includes((c as Record<string, unknown>)["objective_id"] as string)).map((c) => rowName(c, "section_id")) : null;
  const declaredStages = idsOf(sectionRows, "spine_stage");
  const missingSpineStages: string[] | null = sectionsIsList ? SPINE_STAGES.filter((s) => !declaredStages.includes(s)) : null;
  const examplesUnknownObj: string[] | null = examplesIsList && objectivesIsList ? exampleRows.filter((c) => hasField(c, "objective_id") && !objectiveIds.includes((c as Record<string, unknown>)["objective_id"] as string)).map((c) => rowName(c, "example_id")) : null;
  const examplesUnknownSrc: string[] | null = examplesIsList && sourcesIsList ? exampleRows.filter((c) => hasField(c, "source_id") && !sourceIds.includes((c as Record<string, unknown>)["source_id"] as string)).map((c) => rowName(c, "example_id")) : null;
  const examplesWithoutSteps: string[] | null = examplesIsList ? exampleRows.filter((c) => hasField(c, "steps_declared_complete") && (c as Record<string, unknown>)["steps_declared_complete"] !== true).map((c) => rowName(c, "example_id")) : null;
  const sourcesWithoutCitation: string[] | null = sourcesIsList ? sourceRows.filter((c) => hasField(c, "citation") && !nonemptyStr((c as Record<string, unknown>)["citation"])).map((c) => rowName(c, "source_id")) : null;
  const sourcesNotArchived: string[] | null = sourcesIsList ? sourceRows.filter((c) => hasField(c, "archived") && (c as Record<string, unknown>)["archived"] !== true).map((c) => rowName(c, "source_id")) : null;
  const miscWithoutDesc: string[] | null = miscIsList ? miscRows.filter((c) => hasField(c, "description") && !nonemptyStr((c as Record<string, unknown>)["description"])).map((c) => rowName(c, "misconception_id")) : null;
  const miscUnknownSection: string[] | null = miscIsList && sectionsIsList ? miscRows.filter((c) => hasField(c, "addressed_section_id") && !sectionIds.includes((c as Record<string, unknown>)["addressed_section_id"] as string)).map((c) => rowName(c, "misconception_id")) : null;
  const renderingsInvalidKind: string[] | null = renderingsIsList ? renderingRows.filter((c) => hasField(c, "rendering_kind") && !RENDERING_KINDS.includes((c as Record<string, unknown>)["rendering_kind"] as string)).map((c) => rowName(c, "rendering_id")) : null;
  const renderingsNotDerived: string[] | null = renderingsIsList ? renderingRows.filter((c) => hasField(c, "derived_from_canonical_source") && (c as Record<string, unknown>)["derived_from_canonical_source"] !== true).map((c) => rowName(c, "rendering_id")) : null;

  const exampleTraced = (c: unknown): boolean => objectivesIsList && sourcesIsList && hasField(c, "objective_id") && objectiveIds.includes((c as Record<string, unknown>)["objective_id"] as string) && hasField(c, "source_id") && sourceIds.includes((c as Record<string, unknown>)["source_id"] as string) && (c as Record<string, unknown>)["steps_declared_complete"] === true;

  const spineCoverageRatio: number | null = sectionsIsList && sectionsCount !== null && sectionsCount > 0 ? SPINE_STAGES.filter((s) => declaredStages.includes(s)).length / SPINE_STAGES.length : null;
  const sectionObjectiveIds = idsOf(sectionRows, "objective_id");
  const objectiveCoverageRatio: number | null = objectivesIsList && sectionsIsList && objectivesCount !== null && objectivesCount > 0 ? objectiveIds.filter((o) => sectionObjectiveIds.includes(o)).length / objectivesCount : null;
  const exampleTraceabilityRatio: number | null = examplesIsList && examplesCount !== null && examplesCount > 0 ? exampleRows.filter((c) => exampleTraced(c)).length / examplesCount : null;
  const sourceArchiveRatio: number | null = sourcesIsList && sourcesCount !== null && sourcesCount > 0 ? sourceRows.filter((c) => isPyDict(c) && c["archived"] === true).length / sourcesCount : null;
  const miscResolutionRatio: number | null = miscIsList && miscCount !== null && miscCount > 0 ? miscRows.filter((c) => sectionsIsList && hasField(c, "addressed_section_id") && sectionIds.includes((c as Record<string, unknown>)["addressed_section_id"] as string)).length / miscCount : null;
  const renderingDerivationRatio: number | null = renderingsIsList && renderingsCount !== null && renderingsCount > 0 ? renderingRows.filter((c) => isPyDict(c) && c["derived_from_canonical_source"] === true).length / renderingsCount : null;

  // S1
  let S = "audience_and_prerequisites";
  boolCheck(results, S, "technical_explainer_audience_defined", manifest, ["audience", "defined"], "audience: the explainer audience was defined");
  boolCheck(results, S, "technical_explainer_reader_outcome_stated", manifest, ["audience", "reader_outcome_stated"], "audience & outcome: what the reader should be able to do or say afterwards was stated");
  boolCheck(results, S, "technical_explainer_prior_knowledge_assumption_stated", manifest, ["audience", "prior_knowledge_assumption_stated"], "audience: the assumed prior knowledge was stated — none assumed by default");
  {
    const [gate, hasGate] = getPath(manifest, "audience", "prior_knowledge_assumed");
    if (hasGate && gate) {
      check(results, S, "technical_explainer_prerequisites_listed_where_prior_knowledge_assumed", prereqsRaw, prereqsIsList, prereqsIsList && prereqsCount !== null && prereqsCount > 0, "prerequisites: prior knowledge is declared assumed, so the declared record names at least one prerequisite row");
    } else {
      check(results, S, "technical_explainer_prerequisites_listed_where_prior_knowledge_assumed", gate, hasGate, true, "no prior knowledge declared assumed");
    }
  }
  const prereqIdPresent = prereqsIsList && prereqRows.every((c) => hasField(c, "prerequisite_id"));
  check(results, S, "every_technical_explainer_prerequisite_id_unique", prereqsRaw, prereqIdPresent, prereqsIsList && dupPrereq !== null && dupPrereq.length === 0, "prerequisites: no declared prerequisite_id is owned by more than one row");
  const prereqDescPresent = prereqsIsList && prereqRows.every((c) => hasField(c, "description"));
  check(results, S, "every_technical_explainer_prerequisite_description_declared", prereqsRaw, prereqDescPresent, prereqsIsList && prereqRows.every((c) => isPyDict(c) && nonemptyStr(c["description"])), "prerequisites: every declared prerequisite declares a non-empty description");

  // S2
  S = "learning_objectives";
  boolCheck(results, S, "technical_explainer_objectives_stated_as_do_or_say_outcomes", manifest, ["learning_objective_framing", "outcomes_stated_as_do_or_say"], "learning objectives: the objectives are stated as what the reader can do or say afterwards, not as topics covered");
  check(results, S, "technical_explainer_learning_objectives_list_declared", objectivesRaw, objectivesIsList, objectivesIsList && objectivesCount !== null && objectivesCount > 0, "learning objectives: the declared record names its learning objectives — the list is present and names at least one objective; an absent list is missing evidence and an empty list declares no objective at all");
  const objIdPresent = objectivesIsList && objectiveRows.every((c) => hasField(c, "objective_id"));
  check(results, S, "every_technical_explainer_learning_objective_id_unique", objectivesRaw, objIdPresent, objectivesIsList && dupObjective !== null && dupObjective.length === 0, "learning objectives: no declared objective_id is owned by more than one row");
  const outcomePresent = objectivesIsList && objectiveRows.every((c) => hasField(c, "outcome"));
  check(results, S, "every_technical_explainer_learning_objective_outcome_declared", objectivesRaw, outcomePresent, objectivesIsList && objectiveRows.every((c) => isPyDict(c) && nonemptyStr(c["outcome"])), "learning objectives: every declared objective declares a non-empty outcome");

  // S3
  S = "explanation_spine_and_structure";
  boolCheck(results, S, "technical_explainer_spine_order_followed", manifest, ["structure", "follows_spine_order"], "spine: the piece follows question, why it matters, one core idea, how it works, where it breaks, what to watch, in order");
  boolCheck(results, S, "technical_explainer_single_core_idea_confirmed", manifest, ["structure", "single_core_idea_confirmed"], "spine: the piece carries one core idea only");
  gatedBoolCheck(results, S, "technical_explainer_second_core_idea_split_off_where_present", manifest, ["structure", "second_core_idea_present"], ["structure", "second_core_idea_split_off"], "spine: a second core idea was split off into its own piece", "no second core idea declared present");
  check(results, S, "technical_explainer_explanation_sections_list_declared", sectionsRaw, sectionsIsList, sectionsIsList && sectionsCount !== null && sectionsCount > 0, "explanation sections: the declared record names its explanation sections — the list is present and names at least one section; an absent list is missing evidence and an empty list declares no structure at all");
  const secIdPresent = sectionsIsList && sectionRows.every((c) => hasField(c, "section_id"));
  check(results, S, "every_technical_explainer_explanation_section_id_unique", sectionsRaw, secIdPresent, sectionsIsList && dupSection !== null && dupSection.length === 0, "explanation sections: no declared section_id is owned by more than one row");
  const stagePresent = sectionsIsList && sectionRows.every((c) => hasField(c, "spine_stage"));
  check(results, S, "every_technical_explainer_explanation_section_spine_stage_recognised", sectionsRaw, stagePresent, sectionsIsList && sectionRows.every((c) => isPyDict(c) && SPINE_STAGES.includes(c["spine_stage"] as string)), "explanation sections: every declared section's spine stage is one of question, why_it_matters, core_idea, how_it_works, where_it_breaks, what_to_watch");
  const secObjPresent = sectionsIsList && objectivesIsList && sectionRows.every((c) => hasField(c, "objective_id"));
  check(results, S, "every_technical_explainer_explanation_section_objective_reference_resolves", sectionsRaw, secObjPresent, sectionsIsList && objectivesIsList && sectionRows.every((c) => hasField(c, "objective_id") && objectiveIds.includes((c as Record<string, unknown>)["objective_id"] as string)), "explanation sections: every declared section's objective_id names a declared learning objective");
  check(results, S, "technical_explainer_all_spine_stages_declared_present", sectionsRaw, stagePresent, sectionsIsList && missingSpineStages !== null && missingSpineStages.length === 0, "spine: all six spine stages are present among the declared explanation sections — none missing");

  // S4
  S = "simplification_and_analogy_integrity";
  boolCheck(results, S, "technical_explainer_language_simplified_not_facts", manifest, ["simplification", "language_simplified_not_facts"], "simplification contract: language was simplified, never facts");
  boolCheck(results, S, "technical_explainer_simplifications_flagged_explicitly", manifest, ["simplification", "simplifications_flagged_explicitly"], "simplification contract / quality gate: what was simplified, and how, was explicitly flagged");
  boolCheck(results, S, "technical_explainer_units_preserved_correct", manifest, ["simplification", "units_preserved_correct"], "simplification contract: units were kept correct through simplification");
  boolCheck(results, S, "technical_explainer_orders_of_magnitude_preserved_correct", manifest, ["simplification", "orders_of_magnitude_preserved_correct"], "simplification contract: orders of magnitude were kept correct through simplification");
  boolCheck(results, S, "technical_explainer_directions_preserved_correct", manifest, ["simplification", "directions_preserved_correct"], "simplification contract: directions (up/down) were kept correct through simplification");
  boolCheck(results, S, "technical_explainer_jargon_defined_on_first_use", manifest, ["simplification", "jargon_defined_on_first_use"], "quality gate: jargon was defined on first use");
  boolCheck(results, S, "technical_explainer_reading_level_appropriate_for_audience", manifest, ["simplification", "reading_level_appropriate_for_audience"], "quality gate: the reading level was declared appropriate for the declared audience");
  gatedBoolCheck(results, S, "technical_explainer_single_analogy_confirmed_where_analogy_used", manifest, ["analogy", "analogy_used"], ["analogy", "single_analogy_confirmed"], "analogies that confess: only one analogy is used", "no analogy declared used");
  gatedBoolCheck(results, S, "technical_explainer_analogy_failure_mode_stated_where_analogy_used", manifest, ["analogy", "analogy_used"], ["analogy", "failure_mode_stated"], "analogies that confess / quality gate: the analogy is stated with its failure mode — where it breaks", "no analogy declared used");

  // S5
  S = "worked_examples_and_concrete_numbers";
  boolCheck(results, S, "technical_explainer_worked_mini_examples_included", manifest, ["example_work", "worked_mini_examples_included"], "concrete numbers & cases: worked mini-examples are included");
  boolCheck(results, S, "technical_explainer_concrete_numbers_included", manifest, ["example_work", "concrete_numbers_included"], "concrete numbers & cases: concrete numbers are included, as real figures with dates and sources");
  boolCheck(results, S, "technical_explainer_concrete_cases_included", manifest, ["example_work", "concrete_cases_included"], "concrete numbers & cases: concrete cases are included");
  boolCheck(results, S, "technical_explainer_visuals_included_where_they_carry_weight", manifest, ["example_work", "visuals_included_where_they_carry_weight"], "concrete numbers & cases: visuals are included where they carry weight");
  check(results, S, "technical_explainer_worked_examples_list_declared", examplesRaw, examplesIsList, examplesIsList && examplesCount !== null && examplesCount > 0, "worked examples: the declared record names its worked examples — the list is present and names at least one example; an absent list is missing evidence and an empty list declares no worked example at all");
  const exIdPresent = examplesIsList && exampleRows.every((c) => hasField(c, "example_id"));
  check(results, S, "every_technical_explainer_worked_example_id_unique", examplesRaw, exIdPresent, examplesIsList && dupExample !== null && dupExample.length === 0, "worked examples: no declared example_id is owned by more than one row");
  const exObjPresent = examplesIsList && objectivesIsList && exampleRows.every((c) => hasField(c, "objective_id"));
  check(results, S, "every_technical_explainer_worked_example_objective_reference_resolves", examplesRaw, exObjPresent, examplesIsList && objectivesIsList && exampleRows.every((c) => hasField(c, "objective_id") && objectiveIds.includes((c as Record<string, unknown>)["objective_id"] as string)), "worked examples: every declared example's objective_id names a declared learning objective");
  const exSrcPresent = examplesIsList && sourcesIsList && exampleRows.every((c) => hasField(c, "source_id"));
  check(results, S, "every_technical_explainer_worked_example_source_reference_resolves", examplesRaw, exSrcPresent, examplesIsList && sourcesIsList && exampleRows.every((c) => hasField(c, "source_id") && sourceIds.includes((c as Record<string, unknown>)["source_id"] as string)), "worked examples: every declared example's source_id names a declared accuracy source — its figures trace to a declared source");
  const stepsPresent = examplesIsList && exampleRows.every((c) => hasField(c, "steps_declared_complete"));
  check(results, S, "every_technical_explainer_worked_example_steps_declared_complete", examplesRaw, stepsPresent, examplesIsList && exampleRows.every((c) => isPyDict(c) && c["steps_declared_complete"] === true), "worked examples: every declared example is declared steps-complete");

  // S6
  S = "misconceptions_accuracy_and_safety";
  boolCheck(results, S, "technical_explainer_accuracy_review_done", manifest, ["accuracy", "accuracy_review_done"], "verification loop / quality gate: accuracy review was done");
  boolCheck(results, S, "technical_explainer_every_factual_claim_labeled", manifest, ["accuracy", "every_factual_claim_labeled"], "verification loop / quality gate: every factual claim was labeled");
  boolCheck(results, S, "technical_explainer_every_factual_claim_sourced", manifest, ["accuracy", "every_factual_claim_sourced"], "verification loop: every factual claim was sourced");
  check(results, S, "technical_explainer_accuracy_sources_list_declared", sourcesRaw, sourcesIsList, sourcesIsList && sourcesCount !== null && sourcesCount > 0, "accuracy sources: the declared record names its sources — the list is present and names at least one source; an absent list is missing evidence and an empty list declares no sourced explainer at all");
  const srcIdPresent = sourcesIsList && sourceRows.every((c) => hasField(c, "source_id"));
  check(results, S, "every_technical_explainer_accuracy_source_id_unique", sourcesRaw, srcIdPresent, sourcesIsList && dupSource !== null && dupSource.length === 0, "accuracy sources: no declared source_id is owned by more than one row");
  const citationPresent = sourcesIsList && sourceRows.every((c) => hasField(c, "citation"));
  check(results, S, "every_technical_explainer_accuracy_source_citation_recorded", sourcesRaw, citationPresent, sourcesIsList && sourceRows.every((c) => isPyDict(c) && nonemptyStr(c["citation"])), "accuracy sources: every declared source declares a non-empty citation as recorded");
  const archivedPresent = sourcesIsList && sourceRows.every((c) => hasField(c, "archived"));
  check(results, S, "every_technical_explainer_accuracy_source_archived", sourcesRaw, archivedPresent, sourcesIsList && sourceRows.every((c) => isPyDict(c) && c["archived"] === true), "accuracy sources / quality gate: every declared source is declared archived");
  check(results, S, "technical_explainer_misconceptions_list_declared", miscRaw, miscIsList, miscIsList && miscCount !== null && miscCount > 0, "misconceptions: the declared record names the misconceptions it handles — the list is present and names at least one misconception; an absent list is missing evidence and an empty list declares no misconception handling at all");
  const miscIdPresent = miscIsList && miscRows.every((c) => hasField(c, "misconception_id"));
  check(results, S, "every_technical_explainer_misconception_id_unique", miscRaw, miscIdPresent, miscIsList && dupMisc !== null && dupMisc.length === 0, "misconceptions: no declared misconception_id is owned by more than one row");
  const miscDescPresent = miscIsList && miscRows.every((c) => hasField(c, "description"));
  check(results, S, "every_technical_explainer_misconception_description_declared", miscRaw, miscDescPresent, miscIsList && miscRows.every((c) => isPyDict(c) && nonemptyStr(c["description"])), "misconceptions: every declared misconception declares a non-empty description");
  const miscSecPresent = miscIsList && sectionsIsList && miscRows.every((c) => hasField(c, "addressed_section_id"));
  check(results, S, "every_technical_explainer_misconception_addressed_section_reference_resolves", miscRaw, miscSecPresent, miscIsList && sectionsIsList && miscRows.every((c) => hasField(c, "addressed_section_id") && sectionIds.includes((c as Record<string, unknown>)["addressed_section_id"] as string)), "misconceptions: every declared misconception's addressed_section_id names a declared explanation section");
  gatedBoolCheck(results, S, "technical_explainer_safety_expert_review_where_safety_relevant", manifest, ["safety", "safety_relevant_topic"], ["safety", "expert_review_by_qualified_person"], "verification loop / quality gate: safety-relevant content was reviewed by a qualified person", "no safety-relevant topic declared");
  gatedBoolCheck(results, S, "technical_explainer_defers_to_licensed_practice_note_where_safety_relevant", manifest, ["safety", "safety_relevant_topic"], ["safety", "defers_to_licensed_practice_note_included"], "verification loop: a defers-to-licensed-practice note is included for the safety-relevant topic", "no safety-relevant topic declared");

  // S7
  S = "renderings_and_corrections";
  boolCheck(results, S, "technical_explainer_canonical_explainer_identified", manifest, ["canonical", "canonical_explainer_identified"], "re-render, don't rewrite: one canonical explainer was identified as the source");
  boolCheck(results, S, "technical_explainer_renderings_regenerated_from_canonical_after_updates", manifest, ["canonical", "renderings_regenerated_from_canonical_after_updates"], "re-render, don't rewrite: after an update, the source was updated and the renderings regenerated from it");
  check(results, S, "technical_explainer_renderings_list_declared", renderingsRaw, renderingsIsList, renderingsIsList && renderingsCount !== null && renderingsCount > 0, "renderings: the declared record names its renderings — the list is present and names at least one rendering; an absent list is missing evidence and an empty list declares no rendering at all");
  const rendIdPresent = renderingsIsList && renderingRows.every((c) => hasField(c, "rendering_id"));
  check(results, S, "every_technical_explainer_rendering_id_unique", renderingsRaw, rendIdPresent, renderingsIsList && dupRendering !== null && dupRendering.length === 0, "renderings: no declared rendering_id is owned by more than one row");
  const kindPresent = renderingsIsList && renderingRows.every((c) => hasField(c, "rendering_kind"));
  check(results, S, "every_technical_explainer_rendering_kind_recognised", renderingsRaw, kindPresent, renderingsIsList && renderingRows.every((c) => isPyDict(c) && RENDERING_KINDS.includes(c["rendering_kind"] as string)), "renderings: every declared rendering's kind is one of faq, thread, video_script — the renderings the skill names");
  const derivedPresent = renderingsIsList && renderingRows.every((c) => hasField(c, "derived_from_canonical_source"));
  check(results, S, "every_technical_explainer_rendering_derived_from_canonical_source", renderingsRaw, derivedPresent, renderingsIsList && renderingRows.every((c) => isPyDict(c) && c["derived_from_canonical_source"] === true), "renderings: every declared rendering is declared derived from the canonical explainer, not rewritten separately");
  boolCheck(results, S, "technical_explainer_corrections_dated", manifest, ["corrections", "corrections_dated"], "corrections: corrections are dated");
  boolCheck(results, S, "technical_explainer_corrections_visible", manifest, ["corrections", "corrections_visible"], "corrections: corrections are visible");
  boolCheck(results, S, "technical_explainer_corrections_logged", manifest, ["corrections", "corrections_logged"], "corrections: corrections are logged");

  // S8
  S = "red_lines";
  falseCheck(results, S, "technical_explainer_free_of_invented_numbers_or_figures", manifest, ["red_lines", "invented_numbers_or_figures_present"], "red line: no invented numbers or figures are present in the record");
  falseCheck(results, S, "technical_explainer_free_of_unsupported_studies_show_claim", manifest, ["red_lines", "unsupported_studies_show_claim_present"], "red line: no 'studies show' claim without a study is present in the record");
  falseCheck(results, S, "technical_explainer_free_of_fear_mongering_or_hype", manifest, ["red_lines", "fear_mongering_or_hype_present"], "red line: no fear-mongering or hype is present in the record");
  falseCheck(results, S, "technical_explainer_free_of_teaching_beyond_declared_competence", manifest, ["red_lines", "teaching_beyond_declared_competence_present"], "red line: no teaching beyond competence without review is present in the record");
  falseCheck(results, S, "technical_explainer_free_of_unlicensed_practice_encouragement", manifest, ["red_lines", "unlicensed_practice_encouraged_present"], "red line: no encouragement of unlicensed practice — in particular electrical/power practice — is present in the record");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) sections[section] = "fail";
    else if (secResults.some((r) => r.status === "missing")) sections[section] = "insufficient_evidence";
    else sections[section] = "pass";
  }
  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) verdict = "EXPLAINER_CONTENT_NOT_SOUND";
  else if (Object.values(sections).some((v) => v === "insufficient_evidence")) verdict = "INSUFFICIENT_EVIDENCE";
  else verdict = "EXPLAINER_CONTENT_SOUND";

  const computedNames = [
    "technical_explainer_prerequisites_listed_where_prior_knowledge_assumed",
    "every_technical_explainer_prerequisite_id_unique",
    "every_technical_explainer_prerequisite_description_declared",
    "technical_explainer_learning_objectives_list_declared",
    "every_technical_explainer_learning_objective_id_unique",
    "every_technical_explainer_learning_objective_outcome_declared",
    "technical_explainer_explanation_sections_list_declared",
    "every_technical_explainer_explanation_section_id_unique",
    "every_technical_explainer_explanation_section_spine_stage_recognised",
    "every_technical_explainer_explanation_section_objective_reference_resolves",
    "technical_explainer_all_spine_stages_declared_present",
    "technical_explainer_worked_examples_list_declared",
    "every_technical_explainer_worked_example_id_unique",
    "every_technical_explainer_worked_example_objective_reference_resolves",
    "every_technical_explainer_worked_example_source_reference_resolves",
    "every_technical_explainer_worked_example_steps_declared_complete",
    "technical_explainer_accuracy_sources_list_declared",
    "every_technical_explainer_accuracy_source_id_unique",
    "every_technical_explainer_accuracy_source_citation_recorded",
    "every_technical_explainer_accuracy_source_archived",
    "technical_explainer_misconceptions_list_declared",
    "every_technical_explainer_misconception_id_unique",
    "every_technical_explainer_misconception_description_declared",
    "every_technical_explainer_misconception_addressed_section_reference_resolves",
    "technical_explainer_renderings_list_declared",
    "every_technical_explainer_rendering_id_unique",
    "every_technical_explainer_rendering_kind_recognised",
    "every_technical_explainer_rendering_derived_from_canonical_source",
  ];
  const computedStatuses = results.filter((r) => computedNames.includes(r.check)).map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) computedStatus = "outside_stated_limits_on_declared_evidence";
  else if (computedStatuses.every((s) => s === "pass")) computedStatus = "within_stated_limits_on_declared_evidence";
  else computedStatus = null;

  const count = (status: CheckStatus) => results.filter((r) => r.status === status).length;

  return {
    service: "technical-explainer-content-pack",
    atom_version: "0.1.0",
    explainer_title: manifest["explainer_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    technical_explainer_prerequisites_count: prereqsCount,
    technical_explainer_learning_objectives_count: objectivesCount,
    technical_explainer_explanation_sections_count: sectionsCount,
    technical_explainer_worked_examples_count: examplesCount,
    technical_explainer_misconceptions_count: miscCount,
    technical_explainer_accuracy_sources_count: sourcesCount,
    technical_explainer_renderings_count: renderingsCount,
    duplicate_technical_explainer_prerequisite_ids: dupPrereq,
    duplicate_technical_explainer_learning_objective_ids: dupObjective,
    duplicate_technical_explainer_explanation_section_ids: dupSection,
    duplicate_technical_explainer_worked_example_ids: dupExample,
    duplicate_technical_explainer_misconception_ids: dupMisc,
    duplicate_technical_explainer_accuracy_source_ids: dupSource,
    duplicate_technical_explainer_rendering_ids: dupRendering,
    technical_explainer_prerequisites_without_description: prereqsWithoutDesc,
    technical_explainer_learning_objectives_without_outcome: objectivesWithoutOutcome,
    technical_explainer_explanation_sections_with_invalid_spine_stage: sectionsInvalidStage,
    technical_explainer_explanation_sections_with_unknown_objective_reference: sectionsUnknownObj,
    technical_explainer_missing_spine_stages: missingSpineStages,
    technical_explainer_worked_examples_with_unknown_objective_reference: examplesUnknownObj,
    technical_explainer_worked_examples_with_unknown_source_reference: examplesUnknownSrc,
    technical_explainer_worked_examples_without_complete_steps: examplesWithoutSteps,
    technical_explainer_accuracy_sources_without_citation: sourcesWithoutCitation,
    technical_explainer_accuracy_sources_not_archived: sourcesNotArchived,
    technical_explainer_misconceptions_without_description: miscWithoutDesc,
    technical_explainer_misconceptions_with_unknown_addressed_section: miscUnknownSection,
    technical_explainer_renderings_with_invalid_kind: renderingsInvalidKind,
    technical_explainer_renderings_not_derived_from_canonical: renderingsNotDerived,
    spine_stage_coverage_ratio: fmt6(spineCoverageRatio),
    objective_section_coverage_ratio: fmt6(objectiveCoverageRatio),
    worked_example_traceability_ratio: fmt6(exampleTraceabilityRatio),
    accuracy_source_archive_ratio: fmt6(sourceArchiveRatio),
    misconception_resolution_ratio: fmt6(miscResolutionRatio),
    rendering_derivation_ratio: fmt6(renderingDerivationRatio),
    summary: `${count("pass")} pass, ${count("fail")} fail, ${count("missing")} missing of ${results.length} checks across eight sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "TECHNICAL EXPLAINER CONTENT PACK",
    `explainer_title: ${pyStr(verdict.explainer_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
