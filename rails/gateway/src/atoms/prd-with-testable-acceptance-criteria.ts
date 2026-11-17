// PRD with testable acceptance criteria — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/prd-with-testable-acceptance-criteria/src/prd_with_testable_acceptance_criteria.py
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
  product: "string",
  problem: {
    statement_declared: "boolean",
    who_has_it_declared: "boolean",
    why_now_declared: "boolean",
    problem_first_before_solution_declared: "boolean",
    statement_sentence_count: "number",
  },
  outcome: {
    observable_change_defined: "boolean",
    outcome_is_behavior_or_metric_not_feature_only: "boolean",
  },
  stories: [{
    id: "string",
    role: "string",
    capability: "string",
    benefit: "string",
    priority: "string",
  }],
  acceptance_criteria: [{
    id: "string",
    story_id: "string",
    testable_declared: "boolean",
    binary_declared: "boolean",
  }],
  out_of_scope_items: ["string"],
  scope: {
    explicit_out_of_scope_list_declared: "boolean",
    explicit_scope_boundaries_declared: "boolean",
    deferrals_placed_in_later_list: "boolean",
    deferrals_not_silently_inside_scope: "boolean",
  },
  priorities: {
    priority_scheme_p0_p1_p2_applied: "boolean",
    priority_tiers_applied_in_shipping_order: "boolean",
    p0_items_shippable_alone_declared: "boolean",
    priority_conflicts_resolved_with_decision_owner: "boolean",
  },
  decisions: {
    decision_owner_named: "boolean",
    key_decisions_logged_in_prd: "boolean",
  },
  open_questions: [{
    id: "string",
    architecture_changing: "boolean",
    blocks_build: "boolean",
  }],
  open_question_tracking: {
    tracked_explicitly: "boolean",
    architecture_changing_questions_block_build: "boolean",
    non_architecture_questions_do_not_block_build: "boolean",
  },
  approval: {
    approved_spec_declared: "boolean",
  },
  red_lines: {
    build_started_before_approved_spec_present: "boolean",
    unlabeled_spike_treated_as_approved_spec_present: "boolean",
    scope_widened_mid_phase_without_prd_update_and_reapproval_present: "boolean",
  },
};

export const SECTIONS = [
  "problem_and_outcome",
  "stories_and_acceptance_criteria",
  "scope_fences",
  "priorities_and_decisions",
  "open_questions_and_approval",
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
  product: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  problem_statement_sentence_count: number | null;
  stories_count: number | null;
  acceptance_criteria_count: number | null;
  p0_story_count: number | null;
  stories_without_criteria: string[] | null;
  criteria_without_declared_story: string[] | null;
  duplicate_story_ids: string[] | null;
  duplicate_criterion_ids: string[] | null;
  story_criteria_coverage: string | null;
  testable_criteria_coverage: string | null;
  binary_criteria_coverage: string | null;
  out_of_scope_items_count: number | null;
  misc_bucket_items: string[] | null;
  open_questions_count: number | null;
  architecture_changing_open_questions_count: number | null;
  blocking_open_questions_count: number | null;
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

function rowId(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["id"] === "string") {
    return entry["id"] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[]): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const row of rows) {
    if (isPyDict(row) && typeof row["id"] === "string") {
      const value = row["id"] as string;
      if (seen.includes(value) && !dups.includes(value)) {
        dups.push(value);
      }
      seen.push(value);
    }
  }
  return dups;
}

function isNonEmptyStr(value: unknown): boolean {
  return typeof value === "string" && value !== "";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [sentenceCountRaw, hasSentenceCount] = getPath(
    manifest, "problem", "statement_sentence_count");
  const sentenceCount: number | null =
    hasSentenceCount && typeof sentenceCountRaw === "number"
      ? sentenceCountRaw : null;

  const [storiesRaw, hasStories] = getPath(manifest, "stories");
  const storiesIsList = hasStories && Array.isArray(storiesRaw);
  const storyRows: unknown[] = storiesIsList ? (storiesRaw as unknown[]) : [];
  const storiesCount: number | null = storiesIsList ? storyRows.length : null;

  const [criteriaRaw, hasCriteria] = getPath(manifest, "acceptance_criteria");
  const criteriaIsList = hasCriteria && Array.isArray(criteriaRaw);
  const criteriaRows: unknown[] = criteriaIsList ? (criteriaRaw as unknown[]) : [];
  const criteriaCount: number | null = criteriaIsList ? criteriaRows.length : null;

  const storyIds: string[] = storiesIsList
    ? storyRows.filter((r) => isPyDict(r) && typeof r["id"] === "string" &&
        (r["id"] as string).length > 0)
        .map((r) => (r as Record<string, unknown>)["id"] as string)
    : [];
  const tracedStoryIds: string[] = criteriaIsList
    ? criteriaRows.filter((r) => isPyDict(r) && typeof r["story_id"] === "string")
        .map((r) => (r as Record<string, unknown>)["story_id"] as string)
    : [];
  const storiesWithoutCriteria: string[] | null =
    storiesIsList && criteriaIsList
      ? storyRows.filter((r) => hasField(r, "id") &&
          typeof (r as Record<string, unknown>)["id"] === "string" &&
          ((r as Record<string, unknown>)["id"] as string).length > 0 &&
          !tracedStoryIds.includes((r as Record<string, unknown>)["id"] as string))
          .map(rowId)
      : null;

  const traces = (row: unknown): boolean =>
    isPyDict(row) && typeof row["story_id"] === "string" &&
    storyIds.includes(row["story_id"] as string);

  const criteriaWithoutDeclaredStory: string[] | null =
    criteriaIsList && storiesIsList
      ? criteriaRows.filter((r) => hasField(r, "story_id") && !traces(r))
          .map(rowId)
      : null;
  const duplicateStoryIds: string[] | null = storiesIsList
    ? duplicates(storyRows) : null;
  const duplicateCriterionIds: string[] | null = criteriaIsList
    ? duplicates(criteriaRows) : null;
  const p0StoryCount: number | null = storiesIsList
    ? storyRows.filter((r) => isPyDict(r) && r["priority"] === "P0").length
    : null;
  const storyCriteriaCoverage: number | null =
    storiesWithoutCriteria !== null && storiesCount !== null && storiesCount
      ? (storiesCount - storiesWithoutCriteria.length) / storiesCount
      : null;
  const testableCriteriaCoverage: number | null =
    criteriaIsList && criteriaCount !== null && criteriaCount
      ? criteriaRows.filter((r) => isPyDict(r) &&
          r["testable_declared"] === true).length / criteriaCount
      : null;
  const binaryCriteriaCoverage: number | null =
    criteriaIsList && criteriaCount !== null && criteriaCount
      ? criteriaRows.filter((r) => isPyDict(r) &&
          r["binary_declared"] === true).length / criteriaCount
      : null;

  const [outRaw, hasOut] = getPath(manifest, "out_of_scope_items");
  const outIsList = hasOut && Array.isArray(outRaw);
  const outRows: unknown[] = outIsList ? (outRaw as unknown[]) : [];
  const outCount: number | null = outIsList ? outRows.length : null;
  const miscBucketItems: string[] | null = outIsList
    ? outRows.filter((e) => typeof e === "string" &&
        (e as string).trim().toLowerCase() === "misc") as string[]
    : null;

  const [questionsRaw, hasQuestions] = getPath(manifest, "open_questions");
  const questionsIsList = hasQuestions && Array.isArray(questionsRaw);
  const questionRows: unknown[] = questionsIsList ? (questionsRaw as unknown[]) : [];
  const questionsCount: number | null = questionsIsList ? questionRows.length : null;
  const architectureChangingCount: number | null = questionsIsList
    ? questionRows.filter((r) => isPyDict(r) &&
        r["architecture_changing"] === true).length
    : null;
  const blockingQuestionCount: number | null = questionsIsList
    ? questionRows.filter((r) => isPyDict(r) &&
        r["blocks_build"] === true).length
    : null;

  // ---- Section 1: problem_and_outcome ----
  boolCheck(results, "problem_and_outcome",
    "problem_statement_declared", manifest,
    ["problem", "statement_declared"],
    "problem first: the problem is stated in the PRD");
  boolCheck(results, "problem_and_outcome",
    "problem_who_has_it_declared", manifest,
    ["problem", "who_has_it_declared"],
    "problem first: the PRD states who has the problem");
  boolCheck(results, "problem_and_outcome",
    "problem_why_now_declared", manifest,
    ["problem", "why_now_declared"],
    "problem first: the PRD states why now");
  check(results, "problem_and_outcome",
    "problem_statement_within_five_sentences", sentenceCountRaw,
    hasSentenceCount,
    hasSentenceCount && typeof sentenceCountRaw === "number" &&
      sentenceCountRaw >= 1 && sentenceCountRaw <= 5,
    "problem first: the problem statement is five sentences or fewer, on the declared sentence count");
  boolCheck(results, "problem_and_outcome",
    "problem_considered_before_solution", manifest,
    ["problem", "problem_first_before_solution_declared"],
    "problem first: the problem is addressed before any solution or feature");
  boolCheck(results, "problem_and_outcome",
    "observable_outcome_defined", manifest,
    ["outcome", "observable_change_defined"],
    "outcome over output: the observable change the PRD aims at is defined");
  boolCheck(results, "problem_and_outcome",
    "outcome_expressed_as_behavior_or_metric", manifest,
    ["outcome", "outcome_is_behavior_or_metric_not_feature_only"],
    "outcome over output: the outcome is expressed as a behavior or metric, not just a feature");

  // ---- Section 2: stories_and_acceptance_criteria ----
  check(results, "stories_and_acceptance_criteria",
    "prd_stories_declared", storiesRaw, storiesIsList,
    storiesIsList && storiesCount !== null && storiesCount > 0,
    "stories: the declared PRD record names its user stories — the stories list is present and non-empty");
  const storyFormPresent = storiesIsList &&
    storyRows.every((r) => hasField(r, "role") && hasField(r, "capability") &&
      hasField(r, "benefit"));
  check(results, "stories_and_acceptance_criteria",
    "every_prd_story_states_role_capability_and_benefit", storiesRaw,
    storyFormPresent,
    storiesIsList && storiesCount !== null && storiesCount > 0 &&
      storyRows.every((r) => isPyDict(r) &&
        isNonEmptyStr(r["role"]) && isNonEmptyStr(r["capability"]) &&
        isNonEmptyStr(r["benefit"])),
    "stories: every declared story states its role, capability and benefit — As a <role>, I want <capability>, so that <benefit>");
  const storyIdPresent = storiesIsList &&
    storyRows.every((r) => hasField(r, "id"));
  check(results, "stories_and_acceptance_criteria",
    "every_prd_story_id_unique_and_nonempty", storiesRaw, storyIdPresent,
    storiesIsList && storiesCount !== null && storiesCount > 0 &&
      duplicateStoryIds !== null && duplicateStoryIds.length === 0 &&
      storyRows.every((r) => isPyDict(r) && typeof r["id"] === "string" &&
        (r["id"] as string).length > 0),
    "stories: every declared story carries a non-empty id, and no story id is declared twice");
  const priorityPresent = storiesIsList &&
    storyRows.every((r) => hasField(r, "priority"));
  check(results, "stories_and_acceptance_criteria",
    "every_prd_story_priority_is_p0_p1_or_p2", storiesRaw, priorityPresent,
    storiesIsList && storiesCount !== null && storiesCount > 0 &&
      storyRows.every((r) => isPyDict(r) &&
        (r["priority"] === "P0" || r["priority"] === "P1" ||
         r["priority"] === "P2")),
    "prioritize: every declared story carries one of the skill's stated priorities — P0 (must ship), P1 (should) or P2 (could)");
  check(results, "stories_and_acceptance_criteria",
    "acceptance_criteria_declared", criteriaRaw, criteriaIsList,
    criteriaIsList && criteriaCount !== null && criteriaCount > 0,
    "acceptance criteria: the declared PRD record names its acceptance criteria — the acceptance_criteria list is present and non-empty");
  const storyTracePresent = storiesIsList && criteriaIsList &&
    storyRows.every((r) => hasField(r, "id")) &&
    criteriaRows.every((r) => hasField(r, "story_id"));
  check(results, "stories_and_acceptance_criteria",
    "every_story_has_acceptance_criteria", storiesRaw, storyTracePresent,
    storiesIsList && criteriaIsList &&
      storiesCount !== null && storiesCount > 0 &&
      criteriaCount !== null && criteriaCount > 0 &&
      storiesWithoutCriteria !== null &&
      storiesWithoutCriteria.length === 0,
    "quality gate: every story has acceptance criteria — every declared story is traced to by at least one declared criterion");
  const criterionTracePresent = criteriaIsList && storiesIsList &&
    criteriaRows.every((r) => hasField(r, "story_id"));
  check(results, "stories_and_acceptance_criteria",
    "every_acceptance_criterion_traces_to_declared_story", criteriaRaw,
    criterionTracePresent,
    criteriaIsList && storiesIsList &&
      criteriaCount !== null && criteriaCount > 0 &&
      criteriaWithoutDeclaredStory !== null &&
      criteriaWithoutDeclaredStory.length === 0 &&
      criteriaRows.every(traces),
    "acceptance criteria: every declared criterion traces to a declared story");
  const criterionIdPresent = criteriaIsList &&
    criteriaRows.every((r) => hasField(r, "id"));
  check(results, "stories_and_acceptance_criteria",
    "every_acceptance_criterion_id_unique_and_nonempty", criteriaRaw,
    criterionIdPresent,
    criteriaIsList && criteriaCount !== null && criteriaCount > 0 &&
      duplicateCriterionIds !== null && duplicateCriterionIds.length === 0 &&
      criteriaRows.every((r) => isPyDict(r) && typeof r["id"] === "string" &&
        (r["id"] as string).length > 0),
    "acceptance criteria: every declared criterion carries a non-empty id, and no criterion id is declared twice");
  const testablePresent = criteriaIsList &&
    criteriaRows.every((r) => hasField(r, "testable_declared"));
  check(results, "stories_and_acceptance_criteria",
    "every_acceptance_criterion_declared_testable", criteriaRaw,
    testablePresent,
    criteriaIsList && criteriaCount !== null && criteriaCount > 0 &&
      criteriaRows.every((r) => isPyDict(r) &&
        r["testable_declared"] === true),
    "acceptance criteria: every declared criterion is declared testable — if it can't be tested, it's not a criterion");
  const binaryPresent = criteriaIsList &&
    criteriaRows.every((r) => hasField(r, "binary_declared"));
  check(results, "stories_and_acceptance_criteria",
    "every_acceptance_criterion_declared_binary", criteriaRaw, binaryPresent,
    criteriaIsList && criteriaCount !== null && criteriaCount > 0 &&
      criteriaRows.every((r) => isPyDict(r) &&
        r["binary_declared"] === true),
    "acceptance criteria: every declared criterion is declared binary — it passes or it fails, with no middle state");

  // ---- Section 3: scope_fences ----
  check(results, "scope_fences",
    "out_of_scope_items_declared", outRaw, outIsList,
    outIsList && outCount !== null && outCount > 0,
    "scope fences: the declared PRD record names its out-of-scope items — the out_of_scope_items list is present and non-empty");
  check(results, "scope_fences",
    "no_misc_bucket_in_out_of_scope_items", outRaw, outIsList,
    outIsList && miscBucketItems !== null && miscBucketItems.length === 0,
    "quality gate: the out-of-scope list carries no \"misc\" bucket");
  boolCheck(results, "scope_fences",
    "explicit_out_of_scope_list_declared", manifest,
    ["scope", "explicit_out_of_scope_list_declared"],
    "scope fences: an explicit out-of-scope list is declared in the PRD");
  boolCheck(results, "scope_fences",
    "explicit_scope_boundaries_declared", manifest,
    ["scope", "explicit_scope_boundaries_declared"],
    "scope fences: the PRD's scope boundaries are declared explicitly");
  boolCheck(results, "scope_fences",
    "deferrals_placed_in_later_list", manifest,
    ["scope", "deferrals_placed_in_later_list"],
    "scope fences: deferrals go to a \"later\" list");
  boolCheck(results, "scope_fences",
    "deferrals_not_silently_inside_scope", manifest,
    ["scope", "deferrals_not_silently_inside_scope"],
    "scope fences: no deferral sits silently inside the scope");

  // ---- Section 4: priorities_and_decisions ----
  boolCheck(results, "priorities_and_decisions",
    "priority_scheme_p0_p1_p2_applied", manifest,
    ["priorities", "priority_scheme_p0_p1_p2_applied"],
    "prioritize: the P0 (must ship) / P1 (should) / P2 (could) scheme is applied in the PRD");
  boolCheck(results, "priorities_and_decisions",
    "priority_tiers_applied_in_shipping_order", manifest,
    ["priorities", "priority_tiers_applied_in_shipping_order"],
    "prioritize: the priority tiers are applied in shipping order — P0 before P1 before P2");
  boolCheck(results, "priorities_and_decisions",
    "p0_stories_shippable_alone", manifest,
    ["priorities", "p0_items_shippable_alone_declared"],
    "quality gate: P0 items are shippable alone");
  boolCheck(results, "priorities_and_decisions",
    "priority_conflicts_resolved_with_decision_owner", manifest,
    ["priorities", "priority_conflicts_resolved_with_decision_owner"],
    "prioritize: priority conflicts are resolved with the decision owner");
  boolCheck(results, "priorities_and_decisions",
    "prd_decision_owner_named", manifest,
    ["decisions", "decision_owner_named"],
    "prioritize: the PRD's decision owner is named");
  boolCheck(results, "priorities_and_decisions",
    "prd_key_decisions_recorded", manifest,
    ["decisions", "key_decisions_logged_in_prd"],
    "quality gate: key decisions are logged in the PRD record");

  // ---- Section 5: open_questions_and_approval ----
  check(results, "open_questions_and_approval",
    "open_questions_declared", questionsRaw, questionsIsList,
    questionsIsList,
    "open questions: the declared PRD record names its open questions — the open_questions list is present; an empty list declares that the PRD tracks no open questions");
  const blockFlagPresent = questionsIsList &&
    questionRows.every((r) => hasField(r, "architecture_changing") &&
      hasField(r, "blocks_build"));
  check(results, "open_questions_and_approval",
    "every_open_question_block_flag_matches_architecture_impact",
    questionsRaw, blockFlagPresent,
    questionsIsList &&
      questionRows.every((r) => isPyDict(r) &&
        typeof r["architecture_changing"] === "boolean" &&
        typeof r["blocks_build"] === "boolean" &&
        r["blocks_build"] === r["architecture_changing"]),
    "open questions: on every declared question row, blocking build matches changing architecture — questions block build only on questions that change architecture");
  boolCheck(results, "open_questions_and_approval",
    "open_questions_tracked_explicitly", manifest,
    ["open_question_tracking", "tracked_explicitly"],
    "open questions: open questions are tracked explicitly in the PRD");
  boolCheck(results, "open_questions_and_approval",
    "architecture_changing_open_questions_block_build", manifest,
    ["open_question_tracking", "architecture_changing_questions_block_build"],
    "open questions: a question that changes architecture blocks build");
  boolCheck(results, "open_questions_and_approval",
    "non_architecture_open_questions_do_not_block_build", manifest,
    ["open_question_tracking", "non_architecture_questions_do_not_block_build"],
    "open questions: a question that does not change architecture does not block build");
  boolCheck(results, "open_questions_and_approval",
    "spec_approved_for_build", manifest,
    ["approval", "approved_spec_declared"],
    "approved spec: the PRD is declared approved — nothing enters build without an approved spec");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "no_build_before_approved_spec", manifest,
    ["red_lines", "build_started_before_approved_spec_present"],
    "red line: no build started before an approved spec is present in the record");
  falseCheck(results, "red_lines",
    "no_unlabeled_spike_as_spec_exception", manifest,
    ["red_lines", "unlabeled_spike_treated_as_approved_spec_present"],
    "red line: no unlabeled spike treated as an approved spec is present in the record — spike exceptions are timeboxed and labeled as such");
  falseCheck(results, "red_lines",
    "no_scope_widening_without_prd_update_and_reapproval", manifest,
    ["red_lines", "scope_widened_mid_phase_without_prd_update_and_reapproval_present"],
    "red line: no scope widened mid-phase without updating the PRD and re-approval is present in the record");

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
    verdict = "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY";
  }

  const computedNames = [
    "problem_statement_within_five_sentences",
    "prd_stories_declared",
    "every_prd_story_states_role_capability_and_benefit",
    "every_prd_story_id_unique_and_nonempty",
    "every_prd_story_priority_is_p0_p1_or_p2",
    "acceptance_criteria_declared",
    "every_story_has_acceptance_criteria",
    "every_acceptance_criterion_traces_to_declared_story",
    "every_acceptance_criterion_id_unique_and_nonempty",
    "every_acceptance_criterion_declared_testable",
    "every_acceptance_criterion_declared_binary",
    "out_of_scope_items_declared",
    "no_misc_bucket_in_out_of_scope_items",
    "open_questions_declared",
    "every_open_question_block_flag_matches_architecture_impact",
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
    service: "prd-with-testable-acceptance-criteria",
    atom_version: "0.1.0",
    product: manifest["product"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    problem_statement_sentence_count: sentenceCount,
    stories_count: storiesCount,
    acceptance_criteria_count: criteriaCount,
    p0_story_count: p0StoryCount,
    stories_without_criteria: storiesWithoutCriteria,
    criteria_without_declared_story: criteriaWithoutDeclaredStory,
    duplicate_story_ids: duplicateStoryIds,
    duplicate_criterion_ids: duplicateCriterionIds,
    story_criteria_coverage: fmt6(storyCriteriaCoverage),
    testable_criteria_coverage: fmt6(testableCriteriaCoverage),
    binary_criteria_coverage: fmt6(binaryCriteriaCoverage),
    out_of_scope_items_count: outCount,
    misc_bucket_items: miscBucketItems,
    open_questions_count: questionsCount,
    architecture_changing_open_questions_count: architectureChangingCount,
    blocking_open_questions_count: blockingQuestionCount,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PRD WITH TESTABLE ACCEPTANCE CRITERIA",
    `product: ${pyStr(verdict.product ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
