// Code review service — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/code-review-service/src/code_review_service.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts and ratios use the
// shared fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals; computed comparisons compare the fixed-6dp
// difference to zero. This atom validates a declared code-review
// record; it does not read or review actual code and exercises
// no review judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the checklist-item list entries) are
// validated as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  pr: {
    changed_lines: "number",
    description_what_present: "boolean",
    description_why_present: "boolean",
    description_how_to_test_present: "boolean",
    spec_or_issue_linked: "boolean",
    screenshots_included_for_ui_changes: "boolean",
  },
  checklist: {
    covered_items: ["string"],
    correctness_edge_cases_checked: "boolean",
    security_inputs_secrets_dependencies_checked: "boolean",
    tests_coverage_and_determinism_checked: "boolean",
    readability_names_and_structure_checked: "boolean",
  },
  feedback: {
    total_comments: "number",
    labeled_comments: "number",
    labels_use_must_nit_q_scheme: "boolean",
    why_explained: "boolean",
    proposes_not_dictates: "boolean",
  },
  resolution: {
    total_comments: "number",
    answered_comments: "number",
    resolved_only_when_addressed: "boolean",
    resolved_nits_not_relitigated: "boolean",
  },
  gates: {
    ci_green_before_approval: "boolean",
    change_nontrivial: "boolean",
    reviewer_count: "number",
    reviewer_sign_off_recorded: "boolean",
    unresolved_comments: "number",
    behavior_changing: "boolean",
    docs_and_changelog_updated: "boolean",
    approver_would_ship: "boolean",
  },
  red_lines: {
    force_push_over_review_without_telling: "boolean",
    rubber_stamped: "boolean",
    unexplained_blocking: "boolean",
  },
  merge: {
    self_merged_unreviewed: "boolean",
    emergency_hotfix: "boolean",
    hotfix_post_review_completed: "boolean",
  },
};

export const SECTIONS = [
  "pr_size_and_description",
  "review_checklist",
  "feedback_etiquette",
  "response_and_resolution",
  "approval_gates",
  "red_lines_and_merge_discipline",
] as const;

export const STATED_CHECKLIST_ITEMS = [
  "correctness",
  "security",
  "tests",
  "readability",
  "docs",
];

export const STATED_CHANGED_LINES_AIM = 400;

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
  computed_changed_lines: string | null;
  changed_lines_over_stated_aim: string | null;
  checklist_items_not_covered: string[] | null;
  labeled_comment_difference: string | null;
  answered_comment_difference: string | null;
  computed_reviewer_count: string | null;
  computed_unresolved_comments: string | null;
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

function isBool(value: unknown): boolean {
  return typeof value === "boolean";
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: pr_size_and_description ----
  const [changed, hasChanged] = getPath(manifest, "pr", "changed_lines");
  const changedIsNumber = hasChanged && isNumber(changed);
  const changedLinesDifference: number | null = changedIsNumber
    ? (changed as number) - STATED_CHANGED_LINES_AIM
    : null;
  check(results, "pr_size_and_description", "pr_size_within_stated_aim",
    changed, changedIsNumber,
    changedIsNumber && (changed as number) <= STATED_CHANGED_LINES_AIM,
    "method step 1: the declared changed-line count is at or under the aim the skill names — keep PRs small (aim <= ~400 changed lines)");
  boolCheck(results, "pr_size_and_description",
    "pr_description_what_present",
    manifest, ["pr", "description_what_present"],
    "method step 2: the PR description states what changed");
  boolCheck(results, "pr_size_and_description",
    "pr_description_why_present",
    manifest, ["pr", "description_why_present"],
    "method step 2: the PR description states why the change was made");
  boolCheck(results, "pr_size_and_description",
    "pr_description_how_to_test_present",
    manifest, ["pr", "description_how_to_test_present"],
    "method step 2: the PR description states how-to-test");
  boolCheck(results, "pr_size_and_description", "spec_or_issue_linked",
    manifest, ["pr", "spec_or_issue_linked"],
    "method step 2: the PR description links the spec or issue");
  boolCheck(results, "pr_size_and_description",
    "screenshots_included_for_ui_changes",
    manifest, ["pr", "screenshots_included_for_ui_changes"],
    "method step 2: screenshots are included for UI changes");

  // ---- Section 2: review_checklist ----
  const [covered, hasCovered] = getPath(
    manifest, "checklist", "covered_items");
  const coveredIsList = hasCovered && Array.isArray(covered);
  const notCovered: string[] | null = coveredIsList
    ? STATED_CHECKLIST_ITEMS.filter(
        (c) => !(covered as unknown[]).includes(c))
    : null;
  check(results, "review_checklist",
    "checklist_items_cover_stated_checklist",
    covered, coveredIsList,
    coveredIsList && (notCovered as string[]).length === 0,
    "method step 3: the declared covered checklist items cover every category the skill names — correctness, security, tests, readability, docs");
  boolCheck(results, "review_checklist",
    "correctness_edge_cases_checked",
    manifest, ["checklist", "correctness_edge_cases_checked"],
    "method step 3: correctness is checked — logic, edge cases");
  boolCheck(results, "review_checklist",
    "security_inputs_secrets_dependencies_checked",
    manifest,
    ["checklist", "security_inputs_secrets_dependencies_checked"],
    "method step 3: security is checked — inputs, secrets, dependencies");
  boolCheck(results, "review_checklist",
    "tests_coverage_and_determinism_checked",
    manifest, ["checklist", "tests_coverage_and_determinism_checked"],
    "method step 3: tests are checked — coverage, determinism");
  boolCheck(results, "review_checklist",
    "readability_names_and_structure_checked",
    manifest, ["checklist", "readability_names_and_structure_checked"],
    "method step 3: readability is checked — names, structure");

  // ---- Section 3: feedback_etiquette ----
  const [fbTotal, hasFbTotal] = getPath(
    manifest, "feedback", "total_comments");
  const [fbLabeled, hasFbLabeled] = getPath(
    manifest, "feedback", "labeled_comments");
  const feedbackAllNumbers = hasFbTotal && hasFbLabeled &&
    isNumber(fbTotal) && isNumber(fbLabeled);
  const labeledDifference: number | null = feedbackAllNumbers
    ? (fbLabeled as number) - (fbTotal as number)
    : null;
  check(results, "feedback_etiquette", "feedback_comments_all_labeled",
    fbLabeled, feedbackAllNumbers,
    feedbackAllNumbers &&
      fmt6((fbLabeled as number) - (fbTotal as number)) === "0.000000",
    "method step 4: the declared labeled-comment count equals the declared total comment count — every comment carries a must:/nit:/q: label");
  boolCheck(results, "feedback_etiquette", "labels_use_must_nit_q_scheme",
    manifest, ["feedback", "labels_use_must_nit_q_scheme"],
    "method step 4: comments are labeled must: (blocking), nit: (non-blocking), q: (question)");
  boolCheck(results, "feedback_etiquette", "feedback_why_explained",
    manifest, ["feedback", "why_explained"],
    "method step 4: feedback explains the why");
  boolCheck(results, "feedback_etiquette",
    "feedback_proposes_not_dictates",
    manifest, ["feedback", "proposes_not_dictates"],
    "method step 4: feedback proposes, it does not dictate");

  // ---- Section 4: response_and_resolution ----
  const [resTotal, hasResTotal] = getPath(
    manifest, "resolution", "total_comments");
  const [resAnswered, hasResAnswered] = getPath(
    manifest, "resolution", "answered_comments");
  const resolutionAllNumbers = hasResTotal && hasResAnswered &&
    isNumber(resTotal) && isNumber(resAnswered);
  const answeredDifference: number | null = resolutionAllNumbers
    ? (resAnswered as number) - (resTotal as number)
    : null;
  check(results, "response_and_resolution",
    "authors_answer_every_comment",
    resAnswered, resolutionAllNumbers,
    resolutionAllNumbers &&
      fmt6((resAnswered as number) - (resTotal as number)) === "0.000000",
    "method step 5: the declared answered-comment count equals the declared total comment count — authors answer every comment");
  boolCheck(results, "response_and_resolution",
    "comments_resolved_only_when_addressed",
    manifest, ["resolution", "resolved_only_when_addressed"],
    "method step 5: comments are resolved only when addressed");
  boolCheck(results, "response_and_resolution",
    "resolved_nits_not_relitigated",
    manifest, ["resolution", "resolved_nits_not_relitigated"],
    "method step 5: resolved nits are never re-litigated");

  // ---- Section 5: approval_gates ----
  boolCheck(results, "approval_gates", "ci_green_before_approval",
    manifest, ["gates", "ci_green_before_approval"],
    "quality gate: CI is green before approval — red means no merge");
  const [nontrivial, hasNontrivial] = getPath(
    manifest, "gates", "change_nontrivial");
  const [reviewers, hasReviewers] = getPath(
    manifest, "gates", "reviewer_count");
  const reviewerGatePresent = hasNontrivial && hasReviewers &&
    isBool(nontrivial) && isNumber(reviewers);
  check(results, "approval_gates",
    "at_least_one_reviewer_for_nontrivial_change",
    reviewers, reviewerGatePresent,
    reviewerGatePresent &&
      (nontrivial === false || (reviewers as number) >= 1),
    "quality gate: a non-trivial change has at least one reviewer (a declared trivial change is not held to this gate by the skill)");
  boolCheck(results, "approval_gates", "reviewer_sign_off_recorded",
    manifest, ["gates", "reviewer_sign_off_recorded"],
    "method step 6: reviewer sign-off is recorded before approval");
  const [unresolved, hasUnresolved] = getPath(
    manifest, "gates", "unresolved_comments");
  const unresolvedIsNumber = hasUnresolved && isNumber(unresolved);
  check(results, "approval_gates",
    "no_unresolved_comments_before_approval",
    unresolved, unresolvedIsNumber,
    unresolvedIsNumber &&
      fmt6(unresolved as number) === "0.000000",
    "method step 6: the declared unresolved-comment count at approval is zero — approval gates require resolved comments");
  const [behavior, hasBehavior] = getPath(
    manifest, "gates", "behavior_changing");
  const [docsUpdated, hasDocs] = getPath(
    manifest, "gates", "docs_and_changelog_updated");
  const docsGatePresent = hasBehavior && hasDocs &&
    isBool(behavior) && isBool(docsUpdated);
  check(results, "approval_gates",
    "docs_and_changelog_updated_for_behavior_changing_change",
    docsUpdated, docsGatePresent,
    docsGatePresent &&
      (behavior === false || docsUpdated === true),
    "quality gate: a behavior-changing PR updates docs + changelog (a declared non-behavior-changing change is not held to this gate by the skill)");
  boolCheck(results, "approval_gates", "approver_would_ship",
    manifest, ["gates", "approver_would_ship"],
    "method step 6: the approver approves only what they would ship");

  // ---- Section 6: red_lines_and_merge_discipline ----
  falseCheck(results, "red_lines_and_merge_discipline",
    "no_force_push_over_review_without_telling",
    manifest,
    ["red_lines", "force_push_over_review_without_telling"],
    "red line: no force-push over someone else's review without telling them");
  falseCheck(results, "red_lines_and_merge_discipline",
    "no_rubber_stamping",
    manifest, ["red_lines", "rubber_stamped"],
    "red line: no rubber-stamping");
  falseCheck(results, "red_lines_and_merge_discipline",
    "no_unexplained_blocking",
    manifest, ["red_lines", "unexplained_blocking"],
    "red line: no unexplained blocking");
  falseCheck(results, "red_lines_and_merge_discipline",
    "no_self_merged_unreviewed_work",
    manifest, ["merge", "self_merged_unreviewed"],
    "when to use: no self-merged unreviewed work — every change is reviewed before merge");
  const [hotfix, hasHotfix] = getPath(
    manifest, "merge", "emergency_hotfix");
  const [postReview, hasPost] = getPath(
    manifest, "merge", "hotfix_post_review_completed");
  const hotfixGatePresent = hasHotfix && hasPost &&
    isBool(hotfix) && isBool(postReview);
  check(results, "red_lines_and_merge_discipline",
    "emergency_hotfix_post_reviewed_if_applicable",
    postReview, hotfixGatePresent,
    hotfixGatePresent &&
      (hotfix === false || postReview === true),
    "when to use: an emergency hotfix gets post-review (a declared non-hotfix is not held to this gate by the skill)");

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
    verdict = "CODE_REVIEW_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CODE_REVIEW_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "pr_size_within_stated_aim" ||
      r.check === "checklist_items_cover_stated_checklist" ||
      r.check === "feedback_comments_all_labeled" ||
      r.check === "authors_answer_every_comment" ||
      r.check === "at_least_one_reviewer_for_nontrivial_change" ||
      r.check === "no_unresolved_comments_before_approval" ||
      r.check === "docs_and_changelog_updated_for_behavior_changing_change" ||
      r.check === "emergency_hotfix_post_reviewed_if_applicable")
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
    service: "code-review-service",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    computed_changed_lines: fmt6(changedIsNumber ? (changed as number) : null),
    changed_lines_over_stated_aim: fmt6(changedLinesDifference),
    checklist_items_not_covered: notCovered,
    labeled_comment_difference: fmt6(labeledDifference),
    answered_comment_difference: fmt6(answeredDifference),
    computed_reviewer_count: fmt6(
      hasReviewers && isNumber(reviewers) ? (reviewers as number) : null),
    computed_unresolved_comments: fmt6(
      unresolvedIsNumber ? (unresolved as number) : null),
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CODE REVIEW",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
