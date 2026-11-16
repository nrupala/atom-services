// Creative ideation session — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/creative-ideation-session/src/creative_ideation_session.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed value and
// the summary string are byte-identical to the Python output for
// the same input. Computed differences use the shared fixed
// serialization: round half up to 6dp — floor(v * 1000000 + 0.5)
// / 1000000 — then format with exactly six decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// The methods-used list is validated as a list of strings only,
// never membership-checked: membership in the skill's stated set
// is a verdict check, not a type error.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  session_title: "string",
  brief: {
    written: "boolean",
    goal_or_question_stated: "boolean",
    constraints_declared: "boolean",
  },
  preparation: {
    scheduled_in_advance: "boolean",
    prepared_with_inputs_ready: "boolean",
  },
  capture: {
    capture_system_used: "boolean",
    all_ideas_captured: "boolean",
    no_judging_at_capture: "boolean",
  },
  generation: {
    editing_separated_from_generating: "boolean",
    small_reps_or_low_start_bar_used: "boolean",
  },
  divergence: {
    diverged_before_converging: "boolean",
    methods_used: ["string"],
    constraints_used_as_prompt: "boolean",
  },
  idea_pool: {
    target_idea_count: "number",
    total_ideas_captured: "number",
    dedup_performed: "boolean",
    duplicates_removed: "number",
    unique_ideas_after_dedup: "number",
    ideas_clustered_or_grouped: "boolean",
  },
  selection: {
    criteria_written_before_scoring: "boolean",
    criteria_applied_to_all_unique_ideas: "boolean",
    scoring_only_after_divergence_complete: "boolean",
  },
  shortlist: {
    shortlist_count: "number",
    rationale_written: "boolean",
    rationale_references_criteria: "boolean",
  },
  outcome: {
    shared_for_feedback: "boolean",
  },
};

export const SECTIONS = [
  "brief_and_preparation",
  "capture_and_generation",
  "divergence_and_methods",
  "idea_pool_and_volume",
  "selection_and_convergence",
  "shortlist_and_ship",
] as const;

export const STATED_METHODS = [
  "brainstorm",
  "scamper",
  "analogies",
  "combining_distant_domains",
  "what_if",
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
  session_title: unknown;
  methods_used: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  target_idea_count: unknown;
  total_ideas_captured: unknown;
  volume_gap_ideas: string | null;
  duplicates_removed: unknown;
  unique_ideas_after_dedup: unknown;
  dedup_discrepancy_ideas: string | null;
  shortlist_count: unknown;
  methods_used_count: number | null;
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
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

  // ---- Section 1: brief_and_preparation ----
  boolCheck(results, "brief_and_preparation", "brief_written",
    manifest, ["brief", "written"],
    "the session record carries a written brief");
  boolCheck(results, "brief_and_preparation",
    "brief_goal_or_question_stated",
    manifest, ["brief", "goal_or_question_stated"],
    "the brief states the goal or question the session works on");
  boolCheck(results, "brief_and_preparation", "constraints_declared",
    manifest, ["brief", "constraints_declared"],
    "the brief declares the session's constraints — a tight box forces invention");
  boolCheck(results, "brief_and_preparation",
    "session_scheduled_in_advance",
    manifest, ["preparation", "scheduled_in_advance"],
    "habits over moods: the session is created on a schedule, not when inspired");
  boolCheck(results, "brief_and_preparation",
    "prepared_with_inputs_ready",
    manifest, ["preparation", "prepared_with_inputs_ready"],
    "the session shows up prepared — inputs ready to draw from the well");

  // ---- Section 2: capture_and_generation ----
  boolCheck(results, "capture_and_generation", "capture_system_used",
    manifest, ["capture", "capture_system_used"],
    "capture everything: an idea-capture system is used — raw ideas are perishable");
  boolCheck(results, "capture_and_generation", "all_ideas_captured",
    manifest, ["capture", "all_ideas_captured"],
    "capture everything: all raw ideas from the session are captured");
  boolCheck(results, "capture_and_generation", "no_judging_at_capture",
    manifest, ["capture", "no_judging_at_capture"],
    "never judge at the moment of capture");
  boolCheck(results, "capture_and_generation",
    "editing_separated_from_generating",
    manifest, ["generation", "editing_separated_from_generating"],
    "separate drafting from editing — editing never happens while generating");
  boolCheck(results, "capture_and_generation",
    "small_reps_or_low_start_bar_used",
    manifest, ["generation", "small_reps_or_low_start_bar_used"],
    "beat the resistance: the bar to start is lowered or the work is done in small reps");

  // ---- Section 3: divergence_and_methods ----
  boolCheck(results, "divergence_and_methods",
    "diverged_before_converging",
    manifest, ["divergence", "diverged_before_converging"],
    "diverge, then converge: the session diverges widely before any convergence");
  const [methods, hasMethods] = getPath(manifest, "divergence", "methods_used");
  const methodsIsList = hasMethods && Array.isArray(methods);
  check(results, "divergence_and_methods",
    "methods_used_are_stated_methods", methods, methodsIsList,
    methodsIsList && (methods as unknown[]).length > 0 &&
      (methods as unknown[]).every((m) => STATED_METHODS.includes(m as string)),
    "diverge step: every method used is one the skill names — brainstorm, scamper, analogies, combining_distant_domains, or what_if — and at least one method is used; the skill requires no particular method and no minimum count beyond that");
  boolCheck(results, "divergence_and_methods",
    "constraints_used_as_prompt",
    manifest, ["divergence", "constraints_used_as_prompt"],
    "constraints help: the declared constraints are used as a prompt for invention");

  // ---- Section 4: idea_pool_and_volume ----
  const [target, hasTarget] = getPath(manifest, "idea_pool", "target_idea_count");
  const [total, hasTotal] = getPath(manifest, "idea_pool", "total_ideas_captured");
  const bothCounts = hasTarget && hasTotal &&
    isNumber(target) && isNumber(total);
  const volumeGap: number | null = bothCounts
    ? (total as number) - (target as number)
    : null;
  const volumeOk = bothCounts &&
    (target as number) > 0 &&
    (total as number) >= 0 &&
    (total as number) >= (target as number);
  check(results, "idea_pool_and_volume",
    "volume_meets_declared_target", total, bothCounts, volumeOk,
    "volume precedes quality: the captured idea count meets the caller-declared target, the target is positive, and the captured count is not negative — the skill states no number for 'many', so only the declared numbers are compared");
  boolCheck(results, "idea_pool_and_volume", "dedup_performed",
    manifest, ["idea_pool", "dedup_performed"],
    "the idea pool is deduplicated before selection");
  const [duplicates, hasDuplicates] = getPath(manifest, "idea_pool", "duplicates_removed");
  const [unique, hasUnique] = getPath(manifest, "idea_pool", "unique_ideas_after_dedup");
  const dedupNumbers = hasTotal && hasDuplicates && hasUnique &&
    isNumber(total) && isNumber(duplicates) && isNumber(unique);
  const dedupDiscrepancy: number | null = dedupNumbers
    ? (unique as number) - ((total as number) - (duplicates as number))
    : null;
  const dedupOk = dedupNumbers &&
    (total as number) >= 0 &&
    (duplicates as number) >= 0 &&
    (unique as number) >= 0 &&
    (duplicates as number) <= (total as number) &&
    (unique as number) === (total as number) - (duplicates as number);
  check(results, "idea_pool_and_volume",
    "dedup_arithmetic_consistent", unique, dedupNumbers, dedupOk,
    "the declared unique-after-dedup count equals the declared captured total minus the declared duplicates removed, with no negative counts and no more duplicates removed than ideas captured");
  boolCheck(results, "idea_pool_and_volume",
    "ideas_clustered_or_grouped",
    manifest, ["idea_pool", "ideas_clustered_or_grouped"],
    "the deduplicated idea pool is clustered or grouped before selection");

  // ---- Section 5: selection_and_convergence ----
  boolCheck(results, "selection_and_convergence",
    "selection_criteria_written_before_scoring",
    manifest, ["selection", "criteria_written_before_scoring"],
    "the selection criteria are written before any idea is scored");
  boolCheck(results, "selection_and_convergence",
    "criteria_applied_to_all_unique_ideas",
    manifest, ["selection", "criteria_applied_to_all_unique_ideas"],
    "the declared criteria are applied to all unique ideas, not only to favourites");
  boolCheck(results, "selection_and_convergence",
    "scoring_only_after_divergence_complete",
    manifest, ["selection", "scoring_only_after_divergence_complete"],
    "diverge, then converge: scoring starts only after divergence is complete");
  const [shortlistCount, hasShortlist] = getPath(manifest, "shortlist", "shortlist_count");
  const shortlistNumbers = hasShortlist && hasUnique &&
    isNumber(shortlistCount) && isNumber(unique);
  const shortlistOk = shortlistNumbers &&
    (shortlistCount as number) >= 1 &&
    (shortlistCount as number) <= (unique as number);
  check(results, "selection_and_convergence",
    "shortlist_within_unique_pool", shortlistCount, shortlistNumbers,
    shortlistOk,
    "the declared shortlist holds at least one idea and does not exceed the declared unique-after-dedup pool");

  // ---- Section 6: shortlist_and_ship ----
  boolCheck(results, "shortlist_and_ship", "shortlist_rationale_written",
    manifest, ["shortlist", "rationale_written"],
    "a written rationale for the shortlist is recorded");
  boolCheck(results, "shortlist_and_ship",
    "shortlist_rationale_references_criteria",
    manifest, ["shortlist", "rationale_references_criteria"],
    "the shortlist rationale references the selection criteria declared before scoring");
  boolCheck(results, "shortlist_and_ship", "shared_for_feedback",
    manifest, ["outcome", "shared_for_feedback"],
    "ship: the session's output is finished and shared — real feedback only arrives after shipping; perfectionism that prevents shipping is refused");

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
    verdict = "SESSION_NOT_COMPLETE";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SESSION_COMPLETE";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "volume_meets_declared_target" ||
      r.check === "dedup_arithmetic_consistent" ||
      r.check === "shortlist_within_unique_pool" ||
      r.check === "methods_used_are_stated_methods")
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

  const divergenceVal = manifest["divergence"];

  return {
    service: "creative-ideation-session",
    atom_version: "0.1.0",
    session_title: manifest["session_title"] ?? null,
    methods_used: isPyDict(divergenceVal) && hasMethods ? methods : null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    target_idea_count: hasTarget ? target : null,
    total_ideas_captured: hasTotal ? total : null,
    volume_gap_ideas: fmt6(volumeGap),
    duplicates_removed: hasDuplicates ? duplicates : null,
    unique_ideas_after_dedup: hasUnique ? unique : null,
    dedup_discrepancy_ideas: fmt6(dedupDiscrepancy),
    shortlist_count: hasShortlist ? shortlistCount : null,
    methods_used_count: methodsIsList ? (methods as unknown[]).length : null,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CREATIVE IDEATION SESSION",
    `session: ${pyStr(verdict.session_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
