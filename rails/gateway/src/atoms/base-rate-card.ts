// Base-rate card — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/base-rate-card/src/base_rate_card.py (evaluate() +
// stamp()). No logic changes: every verdict, section outcome,
// per-check status, evidence string, computed value and the
// summary string are byte-identical to the Python output for the
// same input. Computed rates use the shared fixed serialization:
// round half up to 6dp — floor(v * 1000000 + 0.5) / 1000000 — then
// format with exactly six decimals; comparisons use the unrounded
// values except the consistency check, which compares the
// fixed-6dp difference to zero.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the fallacy list entries) are validated as
// strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  claim: "string",
  evidence: {
    claim_restated_precisely: "boolean",
    supporting_evidence_sought: "boolean",
    refuting_evidence_sought: "boolean",
    hierarchy_applied: "boolean",
    conflicts_noted_with_reasons: "boolean",
  },
  base_rate: {
    reference_class_defined: "boolean",
    considered_first: "boolean",
    reference_class_size: "number",
    reference_class_successes: "number",
    stated: "number",
  },
  steelman: {
    strongest_counterargument_built: "boolean",
    counterargument_engaged: "boolean",
    opposing_view_strawmanned: "boolean",
  },
  fallacies: {
    spot_check_performed: "boolean",
    checked: ["string"],
  },
  calibration: {
    confidence_stated: "boolean",
    confidence_value: "number",
    outcomes_reviewed: "boolean",
    hit_rate_tracked_by_confidence_band: "boolean",
  },
  judgment: {
    second_order_effects_considered: "boolean",
    written: "boolean",
    includes_confidence: "boolean",
    includes_key_uncertainties: "boolean",
    conclusion_from_vibes_or_authority_alone: "boolean",
    certainty_outruns_evidence: "boolean",
  },
};

export const SECTIONS = [
  "claim_and_evidence",
  "base_rates",
  "steelman",
  "fallacy_spot_check",
  "calibration",
  "second_order_and_judgment",
] as const;

export const STATED_FALLACIES = [
  "ad_hominem",
  "straw_man",
  "false_dilemma",
  "appeal_to_authority_or_antiquity",
  "survivorship",
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
  claim: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  reference_rate: string | null;
  base_rate_difference: string | null;
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

  // ---- Section 1: claim_and_evidence ----
  boolCheck(results, "claim_and_evidence", "claim_restated_precisely",
    manifest, ["evidence", "claim_restated_precisely"],
    "method step 1: the claim is restated precisely");
  boolCheck(results, "claim_and_evidence", "supporting_evidence_sought",
    manifest, ["evidence", "supporting_evidence_sought"],
    "quality gate: supporting evidence is sought — what evidence would support the claim, and is any actually present");
  boolCheck(results, "claim_and_evidence", "refuting_evidence_sought",
    manifest, ["evidence", "refuting_evidence_sought"],
    "quality gate: refuting evidence is sought — what evidence would refute the claim, and is any actually present");
  boolCheck(results, "claim_and_evidence", "evidence_hierarchy_applied",
    manifest, ["evidence", "hierarchy_applied"],
    "method step 2: the evidence hierarchy is applied — measurements/data over documents/logs over expert synthesis over hearsay");
  boolCheck(results, "claim_and_evidence",
    "evidence_conflicts_noted_with_reasons",
    manifest, ["evidence", "conflicts_noted_with_reasons"],
    "method step 2: conflicts between evidence are noted with why they exist (incentives)");

  // ---- Section 2: base_rates ----
  boolCheck(results, "base_rates", "reference_class_defined",
    manifest, ["base_rate", "reference_class_defined"],
    "method step 3: a reference class is defined — what usually happens in cases like this");
  boolCheck(results, "base_rates", "base_rate_considered_first",
    manifest, ["base_rate", "considered_first"],
    "method step 3: base rates come first — the reference class is consulted before the compelling story");
  const [size, hasSize] = getPath(
    manifest, "base_rate", "reference_class_size");
  const [successes, hasSuccesses] = getPath(
    manifest, "base_rate", "reference_class_successes");
  const [stated, hasStated] = getPath(manifest, "base_rate", "stated");
  const allNumbers = hasSize && hasSuccesses && hasStated &&
    isNumber(size) && isNumber(successes) && isNumber(stated);
  const referenceRate: number | null =
    hasSize && hasSuccesses && isNumber(size) && isNumber(successes) &&
      (size as number) > 0
      ? (successes as number) / (size as number)
      : null;
  const difference: number | null =
    referenceRate !== null && hasStated && isNumber(stated)
      ? (stated as number) - referenceRate
      : null;
  const consistent = allNumbers &&
    (size as number) > 0 &&
    0 <= (successes as number) && (successes as number) <= (size as number) &&
    0 <= (stated as number) && (stated as number) <= 1 &&
    fmt6((stated as number) - (successes as number) / (size as number)) ===
      "0.000000";
  check(results, "base_rates",
    "base_rate_consistent_with_reference_counts", stated,
    allNumbers, consistent,
    "method step 3: the stated base rate equals the rate the declared reference-class counts imply (successes / size), with coherent counts and a stated rate that is a probability");

  // ---- Section 3: steelman ----
  boolCheck(results, "steelman", "strongest_counterargument_built",
    manifest, ["steelman", "strongest_counterargument_built"],
    "method step 4: the strongest version of the opposing view is built");
  boolCheck(results, "steelman", "steelman_engaged",
    manifest, ["steelman", "counterargument_engaged"],
    "quality gate: the strongest counterargument is engaged (steelman, not strawman)");
  falseCheck(results, "steelman", "no_strawmanning",
    manifest, ["steelman", "opposing_view_strawmanned"],
    "red line: no straw-manning in your own favor");

  // ---- Section 4: fallacy_spot_check ----
  boolCheck(results, "fallacy_spot_check", "fallacy_spot_check_performed",
    manifest, ["fallacies", "spot_check_performed"],
    "method step 5: a fallacy spot-check is performed");
  const [checkedList, hasChecked] = getPath(manifest, "fallacies", "checked");
  const checkedIsList = hasChecked && Array.isArray(checkedList);
  const notChecked: string[] | null = checkedIsList
    ? STATED_FALLACIES.filter(
        (f) => !(checkedList as unknown[]).includes(f))
    : null;
  check(results, "fallacy_spot_check", "all_stated_fallacies_checked",
    checkedList, checkedIsList,
    checkedIsList && (notChecked as string[]).length === 0,
    "method step 5: the spot-check covers every fallacy the skill names — ad hominem, straw man, false dilemma, appeal to authority/antiquity, survivorship stories, motivated reasoning, cherry-picked windows");

  // ---- Section 5: calibration ----
  boolCheck(results, "calibration", "confidence_stated",
    manifest, ["calibration", "confidence_stated"],
    "method step 6: confidence is stated (e.g. '80% sure')");
  const [conf, hasConf] = getPath(
    manifest, "calibration", "confidence_value");
  const confIsNumber = hasConf && isNumber(conf);
  check(results, "calibration", "confidence_within_probability_bounds",
    conf, confIsNumber,
    confIsNumber && 0 <= (conf as number) && (conf as number) <= 1,
    "method step 6: the stated confidence is a probability — between zero and one inclusive");
  boolCheck(results, "calibration", "outcomes_reviewed_for_calibration",
    manifest, ["calibration", "outcomes_reviewed"],
    "quality gate: outcomes are reviewed for calibration");
  boolCheck(results, "calibration", "hit_rate_tracked_by_confidence_band",
    manifest, ["calibration", "hit_rate_tracked_by_confidence_band"],
    "method step 6: hit rate is tracked by confidence band");

  // ---- Section 6: second_order_and_judgment ----
  boolCheck(results, "second_order_and_judgment",
    "second_order_effects_considered",
    manifest, ["judgment", "second_order_effects_considered"],
    "method step 7: second-order effects are considered — incentives, timing, competition, future options");
  boolCheck(results, "second_order_and_judgment", "judgment_written",
    manifest, ["judgment", "written"],
    "method step 8: the judgment is written — short and checkable later");
  boolCheck(results, "second_order_and_judgment",
    "judgment_includes_confidence",
    manifest, ["judgment", "includes_confidence"],
    "method step 8: the written judgment includes its confidence");
  boolCheck(results, "second_order_and_judgment",
    "judgment_includes_key_uncertainties",
    manifest, ["judgment", "includes_key_uncertainties"],
    "method step 8: the written judgment includes its key uncertainties");
  falseCheck(results, "second_order_and_judgment",
    "conclusion_not_from_vibes_or_authority_alone",
    manifest, ["judgment", "conclusion_from_vibes_or_authority_alone"],
    "red line: no conclusions from vibes or authority alone");
  falseCheck(results, "second_order_and_judgment",
    "certainty_does_not_outrun_evidence",
    manifest, ["judgment", "certainty_outruns_evidence"],
    "red line: certainty does not outrun evidence");

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
    verdict = "CARD_NOT_COMPLETE";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CARD_COMPLETE";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "base_rate_consistent_with_reference_counts" ||
      r.check === "all_stated_fallacies_checked" ||
      r.check === "confidence_within_probability_bounds")
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
    service: "base-rate-card",
    atom_version: "0.1.0",
    claim: manifest["claim"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    reference_rate: fmt6(referenceRate),
    base_rate_difference: fmt6(difference),
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
    "BASE-RATE CARD",
    `claim: ${pyStr(verdict.claim ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
