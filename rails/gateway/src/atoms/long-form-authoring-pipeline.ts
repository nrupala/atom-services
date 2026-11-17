// Long-form authoring pipeline — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/long-form-authoring-pipeline/src/long_form_authoring_pipeline.py
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
  work: "string",
  outline: {
    toc_approved_before_drafting: "boolean",
    chapters_or_modules_defined: "boolean",
    scope_fences_defined: "boolean",
  },
  units: [{
    name: "string",
    point_or_outcome: "string",
    has_single_point: "boolean",
  }],
  drafting: {
    small_units_used: "boolean",
    examples_before_abstractions: "boolean",
    style_sheet_maintained: "boolean",
    glossary_maintained: "boolean",
  },
  review: {
    comments_triaged_not_blind_applied: "boolean",
  },
  review_passes: [{
    name: "string",
    pass_type: "string",
    recorded: "boolean",
  }],
  versioning: {
    sources_in_git_markdown: "boolean",
    research_kept_separate_from_prose: "boolean",
    editions_tagged: "boolean",
    changelog_per_edition: "boolean",
  },
  builds: {
    deterministic_pipeline: "boolean",
    templates_pinned: "boolean",
    preview_builds_for_reviewers: "boolean",
    artifacts_hashed: "boolean",
    artifacts_signed: "boolean",
  },
  publishing: {
    distribution_channels_defined: "boolean",
    metadata_or_platform_setup_complete: "boolean",
    launch_checklist_completed: "boolean",
    sample_and_errata_pages_published: "boolean",
  },
  feedback: {
    reader_learner_feedback_collected: "boolean",
    corrections_list_maintained: "boolean",
    corrections_feed_next_edition: "boolean",
    errata_visible: "boolean",
    drop_off_analytics_reviewed: "boolean",
  },
  red_lines: {
    published_without_accuracy_pass_present: "boolean",
    silent_edition_edits_present: "boolean",
    unverified_quotes_or_attributions_present: "boolean",
  },
};

export const SECTIONS = [
  "outline_as_contract",
  "drafting_loop",
  "review_passes",
  "versioning_and_builds",
  "publishing",
  "feedback_loop_and_red_lines",
] as const;

const REVIEW_PASS_TYPES = [
  "structure",
  "technical_accuracy",
  "style_read_aloud",
  "facts_attribution",
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
  work: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  units_count: number | null;
  units_without_single_point: string[] | null;
  single_point_coverage: string | null;
  units_without_point_or_outcome: string[] | null;
  point_or_outcome_coverage: string | null;
  review_passes_count: number | null;
  review_passes_without_record: string[] | null;
  recorded_review_pass_coverage: string | null;
  review_passes_with_invalid_type: string[] | null;
  valid_review_pass_type_coverage: string | null;
  missing_review_pass_types: string[] | null;
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

  const [unitsRaw, hasUnits] = getPath(manifest, "units");
  const unitsIsList = hasUnits && Array.isArray(unitsRaw);
  const urows: unknown[] = unitsIsList ? (unitsRaw as unknown[]) : [];
  const unitsCount: number | null = unitsIsList ? urows.length : null;

  const unitsWithoutSinglePoint: string[] | null = unitsIsList
    ? urows.filter((c) => hasField(c, "has_single_point") &&
        (c as Record<string, unknown>)["has_single_point"] !== true)
        .map(rowName)
    : null;
  const unitsWithoutPointOrOutcome: string[] | null = unitsIsList
    ? urows.filter((c) => hasField(c, "point_or_outcome") &&
        (c as Record<string, unknown>)["point_or_outcome"] === "")
        .map(rowName)
    : null;
  const singlePointCoverage: number | null =
    unitsIsList && unitsCount !== null && unitsCount > 0
      ? urows.filter((c) => isPyDict(c) &&
          c["has_single_point"] === true).length / unitsCount
      : null;
  const pointOrOutcomeCoverage: number | null =
    unitsIsList && unitsCount !== null && unitsCount > 0
      ? urows.filter((c) => isPyDict(c) &&
          typeof c["point_or_outcome"] === "string" &&
          (c["point_or_outcome"] as string).length > 0).length / unitsCount
      : null;

  const [passesRaw, hasPasses] = getPath(manifest, "review_passes");
  const passesIsList = hasPasses && Array.isArray(passesRaw);
  const prows: unknown[] = passesIsList ? (passesRaw as unknown[]) : [];
  const passesCount: number | null = passesIsList ? prows.length : null;

  const reviewPassesWithoutRecord: string[] | null = passesIsList
    ? prows.filter((c) => hasField(c, "recorded") &&
        (c as Record<string, unknown>)["recorded"] !== true)
        .map(rowName)
    : null;
  const reviewPassesWithInvalidType: string[] | null = passesIsList
    ? prows.filter((c) => hasField(c, "pass_type") &&
        !REVIEW_PASS_TYPES.includes(
          (c as Record<string, unknown>)["pass_type"] as string))
        .map(rowName)
    : null;
  let missingReviewPassTypes: string[] | null = null;
  if (passesIsList) {
    const declaredTypes: string[] = [];
    for (const c of prows) {
      if (isPyDict(c) && typeof c["pass_type"] === "string") {
        declaredTypes.push(c["pass_type"] as string);
      }
    }
    missingReviewPassTypes = REVIEW_PASS_TYPES.filter(
      (t) => !declaredTypes.includes(t));
  }
  const recordedCoverage: number | null =
    passesIsList && passesCount !== null && passesCount > 0
      ? prows.filter((c) => isPyDict(c) &&
          c["recorded"] === true).length / passesCount
      : null;
  const validTypeCoverage: number | null =
    passesIsList && passesCount !== null && passesCount > 0
      ? prows.filter((c) => isPyDict(c) &&
          REVIEW_PASS_TYPES.includes(c["pass_type"] as string)).length / passesCount
      : null;

  // ---- Section 1: outline_as_contract ----
  boolCheck(results, "outline_as_contract",
    "toc_approved_before_drafting", manifest,
    ["outline", "toc_approved_before_drafting"],
    "outline as contract: the TOC is approved before drafting");
  boolCheck(results, "outline_as_contract",
    "chapters_or_modules_defined", manifest,
    ["outline", "chapters_or_modules_defined"],
    "outline as contract: chapters or modules are defined");
  boolCheck(results, "outline_as_contract",
    "scope_fences_defined", manifest,
    ["outline", "scope_fences_defined"],
    "outline as contract: scope fences — what the work won't cover — are defined");
  check(results, "outline_as_contract",
    "units_declared", unitsRaw, unitsIsList,
    unitsIsList && (unitsCount as number) > 0,
    "the declared record names its units — the units list is present and non-empty");
  const singlePresent = unitsIsList &&
    urows.every((c) => hasField(c, "has_single_point"));
  check(results, "outline_as_contract",
    "every_unit_has_single_point", unitsRaw, singlePresent,
    unitsIsList && (unitsCount as number) > 0 &&
      urows.every((c) => isPyDict(c) && c["has_single_point"] === true),
    "outline as contract: every declared unit row has one point");
  const outcomePresent = unitsIsList &&
    urows.every((c) => hasField(c, "point_or_outcome"));
  check(results, "outline_as_contract",
    "every_unit_point_or_outcome_declared", unitsRaw, outcomePresent,
    unitsIsList && (unitsCount as number) > 0 &&
      urows.every((c) => isPyDict(c) &&
        typeof c["point_or_outcome"] === "string" &&
        (c["point_or_outcome"] as string).length > 0),
    "outline as contract: every declared unit row maps to a claim or learning outcome — its point or outcome is declared and non-empty");

  // ---- Section 2: drafting_loop ----
  boolCheck(results, "drafting_loop",
    "small_units_used", manifest,
    ["drafting", "small_units_used"],
    "drafting loop: drafting proceeds in small units");
  boolCheck(results, "drafting_loop",
    "examples_before_abstractions", manifest,
    ["drafting", "examples_before_abstractions"],
    "drafting loop: examples come before abstractions");
  boolCheck(results, "drafting_loop",
    "style_sheet_maintained", manifest,
    ["drafting", "style_sheet_maintained"],
    "drafting loop: a running style sheet is maintained for consistency");
  boolCheck(results, "drafting_loop",
    "glossary_maintained", manifest,
    ["drafting", "glossary_maintained"],
    "drafting loop: a glossary is maintained for consistency");

  // ---- Section 3: review_passes ----
  boolCheck(results, "review_passes",
    "comments_triaged_not_blind_applied", manifest,
    ["review", "comments_triaged_not_blind_applied"],
    "review passes: comments are triaged, not blind-applied");
  check(results, "review_passes",
    "review_passes_declared", passesRaw, passesIsList,
    passesIsList && (passesCount as number) > 0,
    "the declared record names its review passes — the review_passes list is present and non-empty");
  const recordedPresent = passesIsList &&
    prows.every((c) => hasField(c, "recorded"));
  check(results, "review_passes",
    "every_review_pass_recorded", passesRaw, recordedPresent,
    passesIsList && (passesCount as number) > 0 &&
      prows.every((c) => isPyDict(c) && c["recorded"] === true),
    "review passes: every declared review pass row is recorded — who, when, what changed");
  const ptypePresent = passesIsList &&
    prows.every((c) => hasField(c, "pass_type"));
  check(results, "review_passes",
    "every_review_pass_type_valid", passesRaw, ptypePresent,
    passesIsList && (passesCount as number) > 0 &&
      prows.every((c) => isPyDict(c) &&
        REVIEW_PASS_TYPES.includes(c["pass_type"] as string)),
    "review passes: every declared review pass row declares a pass type from the skill's set — structure / technical_accuracy / style_read_aloud / facts_attribution");
  check(results, "review_passes",
    "all_required_review_pass_types_present", passesRaw, ptypePresent,
    passesIsList && missingReviewPassTypes !== null &&
      missingReviewPassTypes.length === 0,
    "review passes: all four of the skill's pass types are present — structure, technical/accuracy, style/read-aloud and facts/attribution");

  // ---- Section 4: versioning_and_builds ----
  boolCheck(results, "versioning_and_builds",
    "sources_in_git_markdown", manifest,
    ["versioning", "sources_in_git_markdown"],
    "versioning: sources are in git, in markdown");
  boolCheck(results, "versioning_and_builds",
    "research_kept_separate_from_prose", manifest,
    ["versioning", "research_kept_separate_from_prose"],
    "versioning: research is kept separate from prose");
  boolCheck(results, "versioning_and_builds",
    "editions_tagged", manifest,
    ["versioning", "editions_tagged"],
    "versioning: editions are tagged");
  boolCheck(results, "versioning_and_builds",
    "changelog_per_edition", manifest,
    ["versioning", "changelog_per_edition"],
    "versioning: a changelog is kept per edition");
  boolCheck(results, "versioning_and_builds",
    "deterministic_pipeline", manifest,
    ["builds", "deterministic_pipeline"],
    "builds: the build pipeline is deterministic — markdown to HTML / ebook / PDF");
  boolCheck(results, "versioning_and_builds",
    "templates_pinned", manifest,
    ["builds", "templates_pinned"],
    "builds: templates are pinned");
  boolCheck(results, "versioning_and_builds",
    "preview_builds_for_reviewers", manifest,
    ["builds", "preview_builds_for_reviewers"],
    "builds: preview builds are distributed for reviewers");
  boolCheck(results, "versioning_and_builds",
    "artifacts_hashed", manifest,
    ["builds", "artifacts_hashed"],
    "builds: artifacts are hashed");
  boolCheck(results, "versioning_and_builds",
    "artifacts_signed", manifest,
    ["builds", "artifacts_signed"],
    "builds: artifacts are signed");

  // ---- Section 5: publishing ----
  boolCheck(results, "publishing",
    "distribution_channels_defined", manifest,
    ["publishing", "distribution_channels_defined"],
    "publishing: distribution channels are defined");
  boolCheck(results, "publishing",
    "metadata_or_platform_setup_complete", manifest,
    ["publishing", "metadata_or_platform_setup_complete"],
    "publishing: book metadata — ISBN, description, cover — or course platform setup, including entitlements, is complete");
  boolCheck(results, "publishing",
    "launch_checklist_completed", manifest,
    ["publishing", "launch_checklist_completed"],
    "publishing: the launch checklist is completed");
  boolCheck(results, "publishing",
    "sample_and_errata_pages_published", manifest,
    ["publishing", "sample_and_errata_pages_published"],
    "publishing: sample and errata pages are published");

  // ---- Section 6: feedback_loop_and_red_lines ----
  boolCheck(results, "feedback_loop_and_red_lines",
    "reader_learner_feedback_collected", manifest,
    ["feedback", "reader_learner_feedback_collected"],
    "feedback loop: reader or learner feedback is collected");
  boolCheck(results, "feedback_loop_and_red_lines",
    "corrections_list_maintained", manifest,
    ["feedback", "corrections_list_maintained"],
    "feedback loop: feedback feeds a corrections list");
  boolCheck(results, "feedback_loop_and_red_lines",
    "corrections_feed_next_edition", manifest,
    ["feedback", "corrections_feed_next_edition"],
    "feedback loop: the corrections list feeds the next edition");
  boolCheck(results, "feedback_loop_and_red_lines",
    "errata_visible", manifest,
    ["feedback", "errata_visible"],
    "feedback loop: errata are visible — the errata and feedback channel is live");
  boolCheck(results, "feedback_loop_and_red_lines",
    "drop_off_analytics_reviewed", manifest,
    ["feedback", "drop_off_analytics_reviewed"],
    "feedback loop: analytics on drop-off points are reviewed");
  falseCheck(results, "feedback_loop_and_red_lines",
    "no_publishing_without_accuracy_pass", manifest,
    ["red_lines", "published_without_accuracy_pass_present"],
    "red line: no publishing without an accuracy pass is present");
  falseCheck(results, "feedback_loop_and_red_lines",
    "no_silent_edition_edits", manifest,
    ["red_lines", "silent_edition_edits_present"],
    "red line: no silent edition edits are present — no silent edits across editions");
  falseCheck(results, "feedback_loop_and_red_lines",
    "no_unverified_quotes_or_attributions", manifest,
    ["red_lines", "unverified_quotes_or_attributions_present"],
    "red line: no unverified quotes or attributions are present — quotes and attributions are verified");

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
    verdict = "AUTHORING_PIPELINE_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "AUTHORING_PIPELINE_SOUND";
  }

  const computedNames = [
    "units_declared",
    "every_unit_has_single_point",
    "every_unit_point_or_outcome_declared",
    "review_passes_declared",
    "every_review_pass_recorded",
    "every_review_pass_type_valid",
    "all_required_review_pass_types_present",
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
    service: "long-form-authoring-pipeline",
    atom_version: "0.1.0",
    work: manifest["work"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    units_count: unitsCount,
    units_without_single_point: unitsWithoutSinglePoint,
    single_point_coverage: fmt6(singlePointCoverage),
    units_without_point_or_outcome: unitsWithoutPointOrOutcome,
    point_or_outcome_coverage: fmt6(pointOrOutcomeCoverage),
    review_passes_count: passesCount,
    review_passes_without_record: reviewPassesWithoutRecord,
    recorded_review_pass_coverage: fmt6(recordedCoverage),
    review_passes_with_invalid_type: reviewPassesWithInvalidType,
    valid_review_pass_type_coverage: fmt6(validTypeCoverage),
    missing_review_pass_types: missingReviewPassTypes,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "LONG FORM AUTHORING PIPELINE",
    `work: ${pyStr(verdict.work ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
