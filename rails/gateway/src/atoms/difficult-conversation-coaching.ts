// Difficult conversation coaching — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/difficult-conversation-coaching/src/difficult_conversation_coaching.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 4dp —
// floor(v * 10000 + 0.5) / 10000 — then format with exactly four
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  conversation_title: "string",
  preparation_domains: ["string"],
  self_awareness: {
    emotion_named: "boolean",
    pause_before_reacting_planned: "boolean",
  },
  self_management: {
    firm_not_hot_stance_declared: "boolean",
    regulation_approach_declared: "boolean",
    venting_in_writing_present: "boolean",
    emotion_suppressed_instead_of_regulated_present: "boolean",
  },
  rehearsal: {
    rehearsal_completed: "boolean",
  },
  empathy: {
    counterpart_emotion_considered: "boolean",
    emotion_separated_from_position: "boolean",
    acknowledgement_before_redirect_planned: "boolean",
    strongest_reasonable_version_identified: "boolean",
  },
  framing: {
    facts_led_with: "boolean",
    specifics_prepared: "boolean",
    ask_stated_clearly: "boolean",
    boundary_stated_clearly: "boolean",
    firm_on_substance_warm_on_tone_declared: "boolean",
    hostility_mirroring_present: "boolean",
  },
  structure: {
    own_part_owned: "boolean",
    other_view_invited: "boolean",
    concrete_next_step_proposed: "boolean",
  },
  feedback: {
    feedback_to_be_given: "boolean",
  },
  feedback_points: [{
    name: "string",
    situation_stated: "boolean",
    behavior_described: "boolean",
    impact_stated: "boolean",
    targets_identity: "boolean",
  }],
  safeguards: {
    do_not_respond_list_checked: "boolean",
    target_on_do_not_respond_list: "boolean",
    register_appropriate_to_relationship_declared: "boolean",
  },
  repair: {
    thread_has_soured: "boolean",
    repair_move_planned: "boolean",
    relationship_and_outcome_protected_over_point_scoring_declared: "boolean",
    winning_argument_losing_relationship_present: "boolean",
  },
};

export const SECTIONS = [
  "preparation_and_self_regulation",
  "empathy_and_social_awareness",
  "framing_and_assertiveness",
  "structure_feedback_and_next_step",
  "safeguards_repair_and_close",
] as const;

export const STATED_DOMAINS = [
  "self_awareness",
  "self_management",
  "social_awareness",
  "relationship_management",
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
  conversation_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  preparation_domains_count: number | null;
  preparation_domains_missing: string[] | null;
  preparation_domain_coverage: string | null;
  feedback_points_count: number | null;
  feedback_points_without_complete_sbi: string[] | null;
  feedback_points_targeting_identity: string[] | null;
  sbi_coverage: string | null;
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

function gatedComputedCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  present: boolean,
  ok: boolean,
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, gate, present, ok, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function sbiComplete(entry: unknown): boolean {
  return isPyDict(entry) && entry["situation_stated"] === true &&
    entry["behavior_described"] === true && entry["impact_stated"] === true;
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [domainsRaw, hasDomains] = getPath(manifest, "preparation_domains");
  const domainsIsList = hasDomains && Array.isArray(domainsRaw);
  const domains: unknown[] = domainsIsList ? (domainsRaw as unknown[]) : [];
  const [pointsRaw, hasPoints] = getPath(manifest, "feedback_points");
  const pointsIsList = hasPoints && Array.isArray(pointsRaw);
  const points: unknown[] = pointsIsList ? (pointsRaw as unknown[]) : [];

  const domainsCount: number | null = domainsIsList ? domains.length : null;
  const pointsCount: number | null = pointsIsList ? points.length : null;

  const declaredDomains: string[] = domainsIsList
    ? domains.filter((d): d is string => typeof d === "string")
    : [];
  const validDeclared = declaredDomains.filter((d) =>
    (STATED_DOMAINS as readonly string[]).includes(d));
  const domainsMissing: string[] | null = domainsIsList
    ? STATED_DOMAINS.filter((d) => !declaredDomains.includes(d))
    : null;
  const domainCoverage: number | null = domainsIsList
    ? new Set(validDeclared).size / STATED_DOMAINS.length
    : null;
  const domainsCoverInOrder = domainsIsList &&
    declaredDomains.length === STATED_DOMAINS.length &&
    declaredDomains.every((d, i) => d === STATED_DOMAINS[i]);

  const pointsWithoutSbi: string[] | null = pointsIsList
    ? points.filter((p) => !sbiComplete(p)).map(rowName)
    : null;
  const pointsTargetingIdentity: string[] | null = pointsIsList
    ? points.filter((p) => isPyDict(p) && p["targets_identity"] === true)
      .map(rowName)
    : null;
  const sbiCoverage: number | null =
    pointsIsList && pointsCount !== null && pointsCount > 0 &&
      pointsWithoutSbi !== null
      ? (pointsCount - pointsWithoutSbi.length) / pointsCount
      : null;

  // ---- Section 1: preparation_and_self_regulation ----
  check(results, "preparation_and_self_regulation",
    "preparation_domains_declared", domainsRaw, domainsIsList,
    domainsIsList && (domainsCount as number) > 0,
    "Goleman's four domains: the declared preparation record names the domains it worked through — the preparation domains list is present and non-empty");
  check(results, "preparation_and_self_regulation",
    "preparation_domains_cover_all_four_in_stated_order", domainsRaw,
    domainsIsList, domainsCoverInOrder,
    "Goleman's four domains: self-awareness, self-management, social awareness and relationship management are all declared, in that order — they build in that order");
  boolCheck(results, "preparation_and_self_regulation", "emotion_named",
    manifest, ["self_awareness", "emotion_named"],
    "self-regulation first: the emotion is named before reacting");
  boolCheck(results, "preparation_and_self_regulation",
    "pause_before_reacting_planned", manifest,
    ["self_awareness", "pause_before_reacting_planned"],
    "self-regulation first: a pause before reacting is planned");
  boolCheck(results, "preparation_and_self_regulation",
    "firm_not_hot_stance_declared", manifest,
    ["self_management", "firm_not_hot_stance_declared"],
    "self-management: the stance is firm, not hot — persistent and precise, not heated");
  boolCheck(results, "preparation_and_self_regulation",
    "regulation_approach_declared", manifest,
    ["self_management", "regulation_approach_declared"],
    "self-management: an approach for regulating the named emotion is declared");
  falseCheck(results, "preparation_and_self_regulation",
    "no_venting_in_writing", manifest,
    ["self_management", "venting_in_writing_present"],
    "anti-pattern: no venting in writing");
  falseCheck(results, "preparation_and_self_regulation",
    "emotion_regulated_not_suppressed", manifest,
    ["self_management", "emotion_suppressed_instead_of_regulated_present"],
    "anti-pattern: emotion is regulated, not suppressed instead of regulated");
  boolCheck(results, "preparation_and_self_regulation",
    "rehearsal_completed", manifest, ["rehearsal", "rehearsal_completed"],
    "preparation: the conversation is rehearsed before it happens — the preparation record declares the rehearsal done");

  // ---- Section 2: empathy_and_social_awareness ----
  boolCheck(results, "empathy_and_social_awareness",
    "counterpart_emotion_considered", manifest,
    ["empathy", "counterpart_emotion_considered"],
    "social awareness (empathy): the other person's emotional state is considered in preparation");
  boolCheck(results, "empathy_and_social_awareness",
    "emotion_separated_from_position", manifest,
    ["empathy", "emotion_separated_from_position"],
    "empathy: the person's emotion is separated from their position");
  boolCheck(results, "empathy_and_social_awareness",
    "acknowledgement_before_redirect_planned", manifest,
    ["empathy", "acknowledgement_before_redirect_planned"],
    "empathy: acknowledgement before redirecting is planned — acknowledge first, then redirect");
  boolCheck(results, "empathy_and_social_awareness",
    "strongest_reasonable_version_identified", manifest,
    ["empathy", "strongest_reasonable_version_identified"],
    "empathy: the strongest reasonable version of the other person's point is identified, and the preparation responds to that version");

  // ---- Section 3: framing_and_assertiveness ----
  boolCheck(results, "framing_and_assertiveness", "facts_led_with",
    manifest, ["framing", "facts_led_with"],
    "difficult conversations: the framing leads with facts");
  boolCheck(results, "framing_and_assertiveness", "specifics_prepared",
    manifest, ["framing", "specifics_prepared"],
    "difficult conversations: the framing is specific — the specifics are prepared");
  boolCheck(results, "framing_and_assertiveness", "ask_stated_clearly",
    manifest, ["framing", "ask_stated_clearly"],
    "assertive, not aggressive: the ask is stated clearly and calmly");
  boolCheck(results, "framing_and_assertiveness", "boundary_stated_clearly",
    manifest, ["framing", "boundary_stated_clearly"],
    "assertive, not aggressive: the boundary is stated clearly and calmly");
  boolCheck(results, "framing_and_assertiveness",
    "firm_on_substance_warm_on_tone_declared", manifest,
    ["framing", "firm_on_substance_warm_on_tone_declared"],
    "the combination that moves people: completely firm on the substance while staying respectful — warm — in tone is declared");
  falseCheck(results, "framing_and_assertiveness",
    "no_hostility_mirroring", manifest,
    ["framing", "hostility_mirroring_present"],
    "anti-pattern: no mirroring hostility");

  // ---- Section 4: structure_feedback_and_next_step ----
  boolCheck(results, "structure_feedback_and_next_step", "own_part_owned",
    manifest, ["structure", "own_part_owned"],
    "difficult conversations: your own part is owned");
  boolCheck(results, "structure_feedback_and_next_step",
    "other_view_invited", manifest, ["structure", "other_view_invited"],
    "difficult conversations: the other view is invited");
  boolCheck(results, "structure_feedback_and_next_step",
    "concrete_next_step_proposed", manifest,
    ["structure", "concrete_next_step_proposed"],
    "difficult conversations: a concrete next step is prepared to agree on");
  gatedComputedCheck(results, "structure_feedback_and_next_step",
    "feedback_points_declared_when_feedback_to_be_given", manifest,
    ["feedback", "feedback_to_be_given"], pointsIsList,
    pointsIsList && (pointsCount as number) > 0,
    "feedback: the declared preparation record names its feedback points — the feedback points list is present and non-empty",
    "no feedback declared to be given");
  const sbiFieldsPresent = pointsIsList &&
    points.every((p) => hasField(p, "situation_stated") &&
      hasField(p, "behavior_described") && hasField(p, "impact_stated"));
  gatedComputedCheck(results, "structure_feedback_and_next_step",
    "every_feedback_point_sbi_complete", manifest,
    ["feedback", "feedback_to_be_given"], sbiFieldsPresent,
    pointsIsList && (pointsCount as number) > 0 &&
      pointsWithoutSbi !== null && pointsWithoutSbi.length === 0,
    "feedback: every declared feedback point is in SBI form — Situation, Behavior, Impact all stated",
    "no feedback declared to be given");
  const identityFieldsPresent = pointsIsList &&
    points.every((p) => hasField(p, "targets_identity"));
  gatedComputedCheck(results, "structure_feedback_and_next_step",
    "no_feedback_point_targets_identity", manifest,
    ["feedback", "feedback_to_be_given"], identityFieldsPresent,
    pointsIsList && (pointsCount as number) > 0 &&
      pointsTargetingIdentity !== null &&
      pointsTargetingIdentity.length === 0,
    "feedback: critique the behavior, never the identity — no declared feedback point targets identity",
    "no feedback declared to be given");

  // ---- Section 5: safeguards_repair_and_close ----
  boolCheck(results, "safeguards_repair_and_close",
    "do_not_respond_list_checked", manifest,
    ["safeguards", "do_not_respond_list_checked"],
    "guardrails: the do-not-respond list is checked before the conversation — people on it are handled by the owner himself");
  falseCheck(results, "safeguards_repair_and_close",
    "target_not_on_do_not_respond_list", manifest,
    ["safeguards", "target_on_do_not_respond_list"],
    "guardrails: the conversation's counterpart is not on the do-not-respond list");
  boolCheck(results, "safeguards_repair_and_close",
    "register_appropriate_to_relationship_declared", manifest,
    ["safeguards", "register_appropriate_to_relationship_declared"],
    "guardrails: the register appropriate to the relationship is declared — strictly professional where that rule applies, warm where the relationship carries it");
  gatedBoolCheck(results, "safeguards_repair_and_close",
    "repair_move_planned_when_thread_soured", manifest,
    ["repair", "thread_has_soured"], ["repair", "repair_move_planned"],
    "repair: the thread has soured, and a repair move is planned — name it and make the high-functioning move",
    "no soured thread declared");
  boolCheck(results, "safeguards_repair_and_close",
    "relationship_and_outcome_protected_over_point_scoring", manifest,
    ["repair", "relationship_and_outcome_protected_over_point_scoring_declared"],
    "repair: the preparation protects the relationship and the outcome over scoring points");
  falseCheck(results, "safeguards_repair_and_close",
    "no_winning_argument_losing_relationship", manifest,
    ["repair", "winning_argument_losing_relationship_present"],
    "anti-pattern: no winning the argument but losing the relationship");

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
    verdict = "CONVERSATION_PREPARATION_INCOMPLETE";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CONVERSATION_PREPARATION_COMPLETE";
  }

  const computedNames = [
    "preparation_domains_declared",
    "preparation_domains_cover_all_four_in_stated_order",
    "feedback_points_declared_when_feedback_to_be_given",
    "every_feedback_point_sbi_complete",
    "no_feedback_point_targets_identity",
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
    service: "difficult-conversation-coaching",
    atom_version: "0.1.0",
    conversation_title: manifest["conversation_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    preparation_domains_count: domainsCount,
    preparation_domains_missing: domainsMissing,
    preparation_domain_coverage: fmt4(domainCoverage),
    feedback_points_count: pointsCount,
    feedback_points_without_complete_sbi: pointsWithoutSbi,
    feedback_points_targeting_identity: pointsTargetingIdentity,
    sbi_coverage: fmt4(sbiCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DIFFICULT CONVERSATION COACHING",
    `conversation_title: ${pyStr(verdict.conversation_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
