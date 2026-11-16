// Argument analysis review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/argument-analysis-review/src/argument_analysis_review.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed status and
// the summary string are byte-identical to the Python output for
// the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  argument: "string",
  anatomy: {
    premises_identified: "boolean",
    conclusion_identified: "boolean",
    validity_distinguished_from_soundness: "boolean",
    steelman_stated: "boolean",
  },
  evidence: {
    source_quality_assessed: "boolean",
    sample_size_considered: "boolean",
    confounders_considered: "boolean",
    replication_considered: "boolean",
    anecdote_treated_as_data: "boolean",
  },
  calibration: {
    base_rate_stated: "boolean",
    diagnosticity_assessed: "boolean",
    confidence_percent: "number",
    known_vs_believed_separated: "boolean",
  },
  stress_test: {
    inversion_or_premortem_done: "boolean",
    second_order_consequences_traced: "boolean",
    change_mind_evidence_prestated: "boolean",
  },
  screening: {
    fallacies_screened: ["string"],
    biases_screened: ["string"],
  },
  razors: {
    simplest_explanation_preferred: "boolean",
    malice_not_assumed_without_evidence: "boolean",
    chestertons_fence_respected: "boolean",
    map_territory_distinguished: "boolean",
  },
  countercase: {
    key_assumption_named: "boolean",
    strongest_countercase_offered: "boolean",
  },
};

export const SECTIONS = [
  "anatomy_and_steelman",
  "evidence_weighing",
  "base_rates_and_calibration",
  "stress_testing",
  "fallacy_and_bias_screening",
  "razors_and_countercase",
] as const;

export const REQUIRED_FALLACIES = [
  "ad_hominem",
  "straw_man",
  "false_dichotomy",
  "appeal_to_authority",
  "slippery_slope",
  "correlation_as_causation",
  "survivorship_bias",
  "base_rate_neglect",
  "sunk_cost",
] as const;

export const REQUIRED_BIASES = [
  "confirmation",
  "anchoring",
  "availability",
  "motivated_reasoning",
  "recency",
  "overconfidence",
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
  argument: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  missing_fallacies: string[] | null;
  missing_biases: string[] | null;
  confidence_percent: number | null;
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: anatomy_and_steelman ----
  boolCheck(results, "anatomy_and_steelman", "premises_identified",
    manifest, ["anatomy", "premises_identified"],
    "anatomy: the argument's premises are identified");
  boolCheck(results, "anatomy_and_steelman", "conclusion_identified",
    manifest, ["anatomy", "conclusion_identified"],
    "anatomy: the argument's conclusion is identified");
  boolCheck(results, "anatomy_and_steelman",
    "validity_distinguished_from_soundness",
    manifest, ["anatomy", "validity_distinguished_from_soundness"],
    "anatomy: validity (does the conclusion follow from the form?) is distinguished from soundness (valid and true premises)");
  boolCheck(results, "anatomy_and_steelman",
    "steelman_stated_before_critique",
    manifest, ["anatomy", "steelman_stated"],
    "steelman first: the strongest version of the view under critique is stated before the critique");

  // ---- Section 2: evidence_weighing ----
  boolCheck(results, "evidence_weighing", "source_quality_assessed",
    manifest, ["evidence", "source_quality_assessed"],
    "evidence: source quality is assessed");
  boolCheck(results, "evidence_weighing", "sample_size_considered",
    manifest, ["evidence", "sample_size_considered"],
    "evidence: sample size is considered");
  boolCheck(results, "evidence_weighing", "confounders_considered",
    manifest, ["evidence", "confounders_considered"],
    "evidence: confounders are considered");
  boolCheck(results, "evidence_weighing", "replication_considered",
    manifest, ["evidence", "replication_considered"],
    "evidence: replication is considered");
  falseCheck(results, "evidence_weighing",
    "anecdote_not_treated_as_data",
    manifest, ["evidence", "anecdote_treated_as_data"],
    "evidence: anecdote is not data — no anecdote is treated as data");

  // ---- Section 3: base_rates_and_calibration ----
  boolCheck(results, "base_rates_and_calibration",
    "base_rate_stated_first",
    manifest, ["calibration", "base_rate_stated"],
    "base rates first: the prior / base rate is stated before the new evidence is weighed");
  boolCheck(results, "base_rates_and_calibration",
    "diagnosticity_assessed",
    manifest, ["calibration", "diagnosticity_assessed"],
    "base rates first: how diagnostic the new evidence is — how much it should move the belief — is assessed");
  const [confidence, hasConfidence] = getPath(
    manifest, "calibration", "confidence_percent");
  const confidenceIsNumber = hasConfidence && isNumber(confidence);
  const confidenceOk = confidenceIsNumber &&
    (confidence as number) > 0 && (confidence as number) < 100;
  check(results, "base_rates_and_calibration",
    "confidence_probabilistic_and_explicit", confidence,
    confidenceIsNumber, confidenceOk,
    "calibration: an explicit confidence is held probabilistically — strictly between 0 and 100 percent, not binary certainty");
  boolCheck(results, "base_rates_and_calibration",
    "known_separated_from_believed",
    manifest, ["calibration", "known_vs_believed_separated"],
    "calibration: what is known is separated from what is believed");

  // ---- Section 4: stress_testing ----
  boolCheck(results, "stress_testing", "inversion_or_premortem_run",
    manifest, ["stress_test", "inversion_or_premortem_done"],
    "stress-test: inversion is run — how would this fail? — as a premortem");
  boolCheck(results, "stress_testing",
    "second_order_consequences_traced",
    manifest, ["stress_test", "second_order_consequences_traced"],
    "stress-test: second-order thinking — consequences of consequences are traced");
  boolCheck(results, "stress_testing",
    "falsifiability_change_mind_prestated",
    manifest, ["stress_test", "change_mind_evidence_prestated"],
    "falsifiability: what evidence would change the conclusion is pre-stated");

  // ---- Section 5: fallacy_and_bias_screening ----
  const [fallacies, hasFallacies] = getPath(
    manifest, "screening", "fallacies_screened");
  const fallaciesIsList = hasFallacies && Array.isArray(fallacies);
  const missingFallacies: string[] | null = fallaciesIsList
    ? REQUIRED_FALLACIES.filter(
        (f) => !(fallacies as unknown[]).includes(f))
    : null;
  check(results, "fallacy_and_bias_screening",
    "all_listed_fallacies_screened", fallacies, fallaciesIsList,
    fallaciesIsList && missingFallacies !== null &&
      missingFallacies.length === 0,
    "fallacies: the screen covers every fallacy the skill names — ad hominem, straw man, false dichotomy, appeal to authority, slippery slope, correlation as causation, survivorship bias, base-rate neglect, sunk cost");
  const [biases, hasBiases] = getPath(
    manifest, "screening", "biases_screened");
  const biasesIsList = hasBiases && Array.isArray(biases);
  const missingBiases: string[] | null = biasesIsList
    ? REQUIRED_BIASES.filter(
        (b) => !(biases as unknown[]).includes(b))
    : null;
  check(results, "fallacy_and_bias_screening",
    "all_listed_biases_screened", biases, biasesIsList,
    biasesIsList && missingBiases !== null &&
      missingBiases.length === 0,
    "biases: the screen covers every bias the skill names — confirmation, anchoring, availability, motivated reasoning, recency, overconfidence");

  // ---- Section 6: razors_and_countercase ----
  boolCheck(results, "razors_and_countercase",
    "simplest_explanation_preferred",
    manifest, ["razors", "simplest_explanation_preferred"],
    "Occam: the simplest explanation that fits the facts is preferred");
  boolCheck(results, "razors_and_countercase",
    "malice_not_assumed_without_evidence",
    manifest, ["razors", "malice_not_assumed_without_evidence"],
    "Hanlon: malice is not attributed to what incompetence explains, absent evidence");
  boolCheck(results, "razors_and_countercase",
    "chestertons_fence_respected",
    manifest, ["razors", "chestertons_fence_respected"],
    "Chesterton's fence: why something exists is understood before it is removed");
  boolCheck(results, "razors_and_countercase",
    "map_territory_distinguished",
    manifest, ["razors", "map_territory_distinguished"],
    "map is not territory: the model is distinguished from the reality");
  boolCheck(results, "razors_and_countercase",
    "key_assumption_named",
    manifest, ["countercase", "key_assumption_named"],
    "how to show up: the key assumption is named");
  boolCheck(results, "razors_and_countercase",
    "strongest_countercase_offered",
    manifest, ["countercase", "strongest_countercase_offered"],
    "how to show up: the strongest honest counter-case is offered");

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
    verdict = "ARGUMENT_ANALYSIS_DEFICIENT";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "ARGUMENT_ANALYSIS_COMPLETE";
  }

  const computedStatuses = results
    .filter((r) => r.check === "all_listed_fallacies_screened" ||
      r.check === "all_listed_biases_screened" ||
      r.check === "confidence_probabilistic_and_explicit")
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
    service: "argument-analysis-review",
    atom_version: "0.1.0",
    argument: manifest["argument"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    missing_fallacies: missingFallacies,
    missing_biases: missingBiases,
    confidence_percent: confidenceIsNumber
      ? (confidence as number)
      : null,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ARGUMENT ANALYSIS REVIEW",
    `argument: ${pyStr(verdict.argument ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
