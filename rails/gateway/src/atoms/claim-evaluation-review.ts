// Claim evaluation review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/claim-evaluation-review/src/claim_evaluation_review.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts and ratios use the
// shared fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals; computed comparisons compare the fixed-6dp
// difference to zero. This atom validates a declared
// claim-evaluation artifact; it evaluates no claim and exercises
// no judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the fallacy list entries) are validated
// as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  claims: [{
    label: "string",
    restated_precisely: "boolean",
    supporting_evidence_sought: "boolean",
    refuting_evidence_sought: "boolean",
    evidence_presence_assessed: "boolean",
  }],
  hierarchy: {
    evidence_ranked_by_hierarchy: "boolean",
    conflicts_noted: "boolean",
    conflict_reasons_and_incentives_examined: "boolean",
    conclusions_from_vibes_or_authority_alone: "boolean",
  },
  base_rates: {
    considered_first: "boolean",
    reference_class_identified: "boolean",
    used_where_applicable: "boolean",
    base_rate_percent: "number",
  },
  steelman: {
    strongest_counterargument_constructed: "boolean",
    strongest_counterargument_engaged: "boolean",
    straw_manning_in_own_favor: "boolean",
  },
  fallacy_screen: {
    fallacies_checked: ["string"],
  },
  calibration: {
    confidence_stated: "boolean",
    confidence_percent: "number",
    outcomes_reviewed: "boolean",
    hit_rate_tracked_by_confidence_band: "boolean",
    outcomes_correct: "number",
    outcomes_total: "number",
    declared_hit_rate_percent: "number",
    certainty_outruns_evidence: "boolean",
  },
  second_order: {
    second_order_thinking_applied: "boolean",
  },
  judgment: {
    judgment_written: "boolean",
    judgment_includes_key_uncertainties: "boolean",
    judgment_checkable_later: "boolean",
  },
};

export const SECTIONS = [
  "claim_set_and_evidence",
  "evidence_hierarchy_and_conflicts",
  "base_rates_and_reference_class",
  "steelman_and_fallacy_screen",
  "calibration",
  "second_order_and_judgment",
] as const;

export const STATED_FALLACIES = [
  "ad_hominem",
  "straw_man",
  "false_dilemma",
  "appeal_to_authority",
  "appeal_to_antiquity",
  "survivorship_stories",
  "motivated_reasoning",
  "cherry_picked_windows",
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
  claims_evaluated: number;
  base_rate_percent: string | null;
  confidence_percent: string | null;
  computed_hit_rate_percent: string | null;
  hit_rate_difference: string | null;
  fallacies_not_checked: string[] | null;
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

function isBool(value: unknown): boolean {
  return typeof value === "boolean";
}

function isNonemptyStr(value: unknown): boolean {
  return typeof value === "string" && value.length > 0;
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function claimChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): number {
  const [claims, hasClaims] = getPath(manifest, "claims");
  if (!hasClaims || !Array.isArray(claims) || claims.length === 0) {
    for (const name of [
      "claim_entries_complete",
      "all_claims_restated_precisely",
      "all_claims_supporting_and_refuting_evidence_sought",
      "all_claims_evidence_presence_assessed",
    ]) {
      check(results, "claim_set_and_evidence", name,
        claims, false, false, "no claim entries declared");
    }
    return 0;
  }
  let incomplete = false;
  let evaluated = 0;
  let restatedOk = true;
  let soughtOk = true;
  let presenceOk = true;
  for (const entry of claims as unknown[]) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [label, hasLabel] = getEntry(entry, "label");
    const [restated, hasRestated] = getEntry(entry, "restated_precisely");
    const [supporting, hasSupporting] = getEntry(entry, "supporting_evidence_sought");
    const [refuting, hasRefuting] = getEntry(entry, "refuting_evidence_sought");
    const [presence, hasPresence] = getEntry(entry, "evidence_presence_assessed");
    if (!(hasLabel && hasRestated && hasSupporting && hasRefuting &&
        hasPresence && isNonemptyStr(label) && isBool(restated) &&
        isBool(supporting) && isBool(refuting) && isBool(presence))) {
      incomplete = true;
      continue;
    }
    evaluated += 1;
    if (restated !== true) restatedOk = false;
    if (!(supporting === true && refuting === true)) soughtOk = false;
    if (presence !== true) presenceOk = false;
  }
  if (incomplete) {
    check(results, "claim_set_and_evidence", "claim_entries_complete",
      claims, false, false,
      "a claim entry is missing its label, restated, supporting-sought, refuting-sought, or presence-assessed field");
    for (const [name, evidence] of [
      ["all_claims_restated_precisely",
       "a claim entry is incomplete, so restatement cannot be evaluated over the whole claim set"],
      ["all_claims_supporting_and_refuting_evidence_sought",
       "a claim entry is incomplete, so evidence seeking cannot be evaluated over the whole claim set"],
      ["all_claims_evidence_presence_assessed",
       "a claim entry is incomplete, so evidence presence cannot be evaluated over the whole claim set"],
    ] as const) {
      check(results, "claim_set_and_evidence", name, claims, false, false, evidence);
    }
  } else {
    check(results, "claim_set_and_evidence", "claim_entries_complete",
      claims, true, true,
      "every claim entry carries a label, a restatement flag, supporting- and refuting-evidence-sought flags, and an evidence-presence-assessed flag");
    check(results, "claim_set_and_evidence", "all_claims_restated_precisely",
      claims, true, restatedOk,
      "quality gate: every claim in the set is restated precisely");
    check(results, "claim_set_and_evidence",
      "all_claims_supporting_and_refuting_evidence_sought",
      claims, true, soughtOk,
      "quality gate: supporting AND refuting evidence is sought for every claim in the set");
    check(results, "claim_set_and_evidence",
      "all_claims_evidence_presence_assessed",
      claims, true, presenceOk,
      "method step 1: for every claim, whether evidence is actually present is assessed");
  }
  return evaluated;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: claim_set_and_evidence ----
  const claimsEvaluated = claimChecks(results, manifest);

  // ---- Section 2: evidence_hierarchy_and_conflicts ----
  boolCheck(results, "evidence_hierarchy_and_conflicts",
    "evidence_ranked_by_hierarchy",
    manifest, ["hierarchy", "evidence_ranked_by_hierarchy"],
    "method step 2: evidence is ranked by the stated hierarchy — measurements/data over documents/logs over expert synthesis over hearsay");
  boolCheck(results, "evidence_hierarchy_and_conflicts", "conflicts_noted",
    manifest, ["hierarchy", "conflicts_noted"],
    "method step 2: conflicts between evidence are noted");
  boolCheck(results, "evidence_hierarchy_and_conflicts",
    "conflict_reasons_and_incentives_examined",
    manifest, ["hierarchy", "conflict_reasons_and_incentives_examined"],
    "method step 2: why conflicts exist is examined — incentives included");
  falseCheck(results, "evidence_hierarchy_and_conflicts",
    "no_conclusions_from_vibes_or_authority_alone",
    manifest, ["hierarchy", "conclusions_from_vibes_or_authority_alone"],
    "red line: no conclusions from vibes or authority alone");

  // ---- Section 3: base_rates_and_reference_class ----
  boolCheck(results, "base_rates_and_reference_class",
    "base_rates_considered_first",
    manifest, ["base_rates", "considered_first"],
    "method step 3: base rates are considered first, before compelling stories");
  boolCheck(results, "base_rates_and_reference_class",
    "reference_class_identified",
    manifest, ["base_rates", "reference_class_identified"],
    "method step 3: a reference class is identified — what usually happens in cases like this");
  boolCheck(results, "base_rates_and_reference_class",
    "base_rates_used_where_applicable",
    manifest, ["base_rates", "used_where_applicable"],
    "quality gate: base rates / reference class are used where applicable");
  const [baseRate, hasBaseRate] = getPath(manifest, "base_rates", "base_rate_percent");
  const baseRateIsNumber = hasBaseRate && isNumber(baseRate);
  check(results, "base_rates_and_reference_class",
    "base_rate_percent_within_percent_range",
    baseRate, baseRateIsNumber,
    baseRateIsNumber && (baseRate as number) >= 0 && (baseRate as number) <= 100,
    "method step 3: the declared base rate is a percent — it lies between 0 and 100 inclusive; no base-rate level itself is judged here");

  // ---- Section 4: steelman_and_fallacy_screen ----
  boolCheck(results, "steelman_and_fallacy_screen",
    "strongest_counterargument_constructed",
    manifest, ["steelman", "strongest_counterargument_constructed"],
    "method step 4: the strongest version of the opposing view is constructed — a steelman");
  boolCheck(results, "steelman_and_fallacy_screen",
    "strongest_counterargument_engaged",
    manifest, ["steelman", "strongest_counterargument_engaged"],
    "quality gate: the strongest counterargument is engaged, not a strawman");
  falseCheck(results, "steelman_and_fallacy_screen",
    "no_straw_manning_in_own_favor",
    manifest, ["steelman", "straw_manning_in_own_favor"],
    "red line: no straw-manning in your own favor");
  const [checked, hasChecked] = getPath(manifest, "fallacy_screen", "fallacies_checked");
  const checkedIsList = hasChecked && Array.isArray(checked);
  const notChecked: string[] | null = checkedIsList
    ? STATED_FALLACIES.filter((f) => !(checked as unknown[]).includes(f))
    : null;
  check(results, "steelman_and_fallacy_screen",
    "fallacy_screen_covers_stated_fallacies",
    checked, checkedIsList,
    checkedIsList && (notChecked as string[]).length === 0,
    "method step 5: the fallacy spot-check covers every fallacy the skill names — ad hominem, straw man, false dilemma, appeal to authority, appeal to antiquity, survivorship stories, motivated reasoning, cherry-picked windows");

  // ---- Section 5: calibration ----
  boolCheck(results, "calibration", "confidence_stated",
    manifest, ["calibration", "confidence_stated"],
    "quality gate: confidence is stated");
  const [confidence, hasConfidence] = getPath(manifest, "calibration", "confidence_percent");
  const confidenceIsNumber = hasConfidence && isNumber(confidence);
  check(results, "calibration", "confidence_percent_within_percent_range",
    confidence, confidenceIsNumber,
    confidenceIsNumber && (confidence as number) >= 0 && (confidence as number) <= 100,
    "method step 6: the stated confidence is a percent — it lies between 0 and 100 inclusive; the skill's 80% example is an illustration of stating confidence, not a required level, and no level is judged here");
  boolCheck(results, "calibration", "outcomes_reviewed",
    manifest, ["calibration", "outcomes_reviewed"],
    "quality gate: outcomes are reviewed for calibration");
  boolCheck(results, "calibration", "hit_rate_tracked_by_confidence_band",
    manifest, ["calibration", "hit_rate_tracked_by_confidence_band"],
    "method step 6: hit rate is tracked by confidence band");
  const [correct, hasCorrect] = getPath(manifest, "calibration", "outcomes_correct");
  const [total, hasTotal] = getPath(manifest, "calibration", "outcomes_total");
  const [declaredHit, hasHit] = getPath(manifest, "calibration", "declared_hit_rate_percent");
  const hitAllNumbers = hasCorrect && hasTotal && hasHit &&
    isNumber(correct) && isNumber(total) && isNumber(declaredHit);
  const computedHit: number | null =
    hasCorrect && hasTotal && isNumber(correct) && isNumber(total) &&
      (total as number) > 0
      ? (correct as number) / (total as number) * 100
      : null;
  const hitDifference: number | null =
    computedHit !== null && hasHit && isNumber(declaredHit)
      ? (declaredHit as number) - computedHit
      : null;
  const hitConsistent = hitAllNumbers && (total as number) > 0 &&
    fmt6((declaredHit as number) -
      (correct as number) / (total as number) * 100) === "0.000000";
  check(results, "calibration",
    "declared_hit_rate_matches_correct_divided_by_total",
    declaredHit, hitAllNumbers, hitConsistent,
    "method step 6: the declared hit-rate percent equals the declared outcomes correct divided by the declared outcomes total, times 100 (track hit rate)");
  falseCheck(results, "calibration", "certainty_does_not_outrun_evidence",
    manifest, ["calibration", "certainty_outruns_evidence"],
    "red line: certainty does not outrun evidence");

  // ---- Section 6: second_order_and_judgment ----
  boolCheck(results, "second_order_and_judgment",
    "second_order_thinking_applied",
    manifest, ["second_order", "second_order_thinking_applied"],
    "method step 7: second-order thinking is applied — and then what? Effects on incentives, timing, competition, future options");
  boolCheck(results, "second_order_and_judgment", "judgment_written",
    manifest, ["judgment", "judgment_written"],
    "method step 8: the judgment is written — conclusion plus confidence plus key uncertainties");
  boolCheck(results, "second_order_and_judgment",
    "judgment_includes_key_uncertainties",
    manifest, ["judgment", "judgment_includes_key_uncertainties"],
    "method step 8: the written judgment includes the key uncertainties");
  boolCheck(results, "second_order_and_judgment", "judgment_checkable_later",
    manifest, ["judgment", "judgment_checkable_later"],
    "method step 8: the written judgment is short and checkable later");

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
    verdict = "CLAIM_EVALUATION_NOT_COMPLETE";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CLAIM_EVALUATION_COMPLETE";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "all_claims_restated_precisely" ||
      r.check === "all_claims_supporting_and_refuting_evidence_sought" ||
      r.check === "all_claims_evidence_presence_assessed" ||
      r.check === "base_rate_percent_within_percent_range" ||
      r.check === "fallacy_screen_covers_stated_fallacies" ||
      r.check === "confidence_percent_within_percent_range" ||
      r.check === "declared_hit_rate_matches_correct_divided_by_total")
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
    service: "claim-evaluation-review",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    claims_evaluated: claimsEvaluated,
    base_rate_percent: fmt6(baseRateIsNumber ? (baseRate as number) : null),
    confidence_percent: fmt6(confidenceIsNumber ? (confidence as number) : null),
    computed_hit_rate_percent: fmt6(computedHit),
    hit_rate_difference: fmt6(hitDifference),
    fallacies_not_checked: notChecked,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CLAIM EVALUATION REVIEW",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
