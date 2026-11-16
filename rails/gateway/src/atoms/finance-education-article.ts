// Finance education article — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/finance-education-article/src/
// finance_education_article.py (evaluate() + stamp()).
// No logic changes: every verdict, section outcome, per-check status,
// evidence string and the summary string are byte-identical to the
// Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  article: "string",
  topic: "string",
  structure: {
    concept_explained: "boolean",
    framework_taught_not_answer: "boolean",
    what_to_watch_close_present: "boolean",
    section_order: ["string"],
  },
  worked_example: {
    present: "boolean",
    steps: [{
      operation: "string",
      operands: ["number"],
      declared_result: "number",
    }],
  },
  signals: {
    buy_sell_signals_present: "boolean",
    implied_trade_present: "boolean",
    trade_execution_present: "boolean",
  },
  disclosure: {
    uses_data_or_assumptions: "boolean",
    assumptions_stated: "boolean",
    data_dates_stated: "boolean",
    limits_stated: "boolean",
    data_as_of: "string",
  },
  review: {
    education_only_review_passed: "boolean",
    think_with_finance_voice_confirmed: "boolean",
    plain_language_review_passed: "boolean",
    no_hype_confirmed: "boolean",
  },
};

export const SECTIONS = [
  "article_structure",
  "worked_example",
  "no_signals",
  "disclosures",
  "review",
] as const;

const EXPECTED_SECTION_ORDER = ["concept", "worked_example", "what_to_watch"];
const OPERATIONS = ["add", "subtract", "multiply", "divide"];

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
  article: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  steps_evaluated: number;
  steps_incomplete: number;
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

function isNonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  path: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [value, present] = getPath(manifest, ...path);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, value, present, value === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function gatedStringCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  path: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [value, present] = getPath(manifest, ...path);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, value, present, isNonemptyStr(value), evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function computeStep(operation: string, operands: number[]): number {
  if (operation === "add") {
    let result = 0;
    for (const operand of operands) result = result + operand;
    return result;
  }
  if (operation === "multiply") {
    let result = 1;
    for (const operand of operands) result = result * operand;
    return result;
  }
  if (operation === "subtract") {
    let result = operands[0];
    for (const operand of operands.slice(1)) result = result - operand;
    return result;
  }
  let result = operands[0];
  for (const operand of operands.slice(1)) result = result / operand;
  return result;
}

function workedExampleChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): [number, number] {
  const [steps, hasSteps] = getPath(manifest, "worked_example", "steps");
  if (!hasSteps || !Array.isArray(steps) || steps.length === 0) {
    check(results, "worked_example", "worked_example_steps_complete",
      steps, false, false, "no worked-example steps declared");
    check(results, "worked_example", "worked_example_arithmetic_correct",
      steps, false, false, "no worked-example steps declared");
    return [0, 0];
  }
  let incomplete = 0;
  let evaluated = 0;
  let arithmeticWrong = false;
  for (const step of steps) {
    if (!isPyDict(step)) {
      incomplete += 1;
      continue;
    }
    const [operation, hasOperation] = getPath(step, "operation");
    const [operands, hasOperands] = getPath(step, "operands");
    const [declared, hasDeclared] = getPath(step, "declared_result");
    if (!(hasOperation && hasOperands && hasDeclared &&
          typeof operation === "string" && OPERATIONS.includes(operation) &&
          Array.isArray(operands) && operands.length > 0 &&
          (!(["subtract", "divide"].includes(operation)) || operands.length >= 2) &&
          (operation !== "divide" ||
            operands.slice(1).every((o) => o !== 0)))) {
      incomplete += 1;
      continue;
    }
    evaluated += 1;
    if (fmt6(computeStep(operation as string, operands as number[])) !==
        fmt6(declared as number)) {
      arithmeticWrong = true;
    }
  }
  if (incomplete > 0) {
    check(results, "worked_example", "worked_example_steps_complete",
      steps, false, false,
      "a worked-example step is missing its operation, operands, or declared result, or cannot be re-derived (unknown operation or division by zero)");
    check(results, "worked_example", "worked_example_arithmetic_correct",
      steps, false, false,
      "a worked-example step is incomplete, so its arithmetic cannot be verified");
  } else {
    check(results, "worked_example", "worked_example_steps_complete",
      steps, true, true,
      "every worked-example step declares an operation, operands, and a declared result");
    check(results, "worked_example", "worked_example_arithmetic_correct",
      steps, true, !arithmeticWrong,
      "every worked-example step re-derives to its declared result at 6-decimal formatting (skill: show the mechanics with a worked example)");
  }
  return [evaluated, incomplete];
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: article_structure ----
  const [topic, hasTopic] = getPath(manifest, "topic");
  check(results, "article_structure", "topic_stated",
    topic, hasTopic, isNonemptyStr(topic),
    "the article's concept/topic is stated (skill example: explain what a yield curve is)");
  boolCheck(results, "article_structure", "concept_explained",
    manifest, ["structure", "concept_explained"],
    "structure: the concept is explained");
  boolCheck(results, "article_structure",
    "framework_taught_not_answer", manifest,
    ["structure", "framework_taught_not_answer"],
    "teach the framework (how to think), not the answer (what to do)");
  boolCheck(results, "article_structure",
    "what_to_watch_close_present", manifest,
    ["structure", "what_to_watch_close_present"],
    "structure: the article closes with what to watch");
  const [order, hasOrder] = getPath(manifest, "structure", "section_order");
  check(results, "article_structure", "section_order_matches_skill",
    order, hasOrder,
    Array.isArray(order) && order.length === EXPECTED_SECTION_ORDER.length &&
      order.every((v, i) => v === EXPECTED_SECTION_ORDER[i]),
    "declared section order is concept, worked_example, what_to_watch — the skill's structure, in order");

  // ---- Section 2: worked_example ----
  boolCheck(results, "worked_example", "worked_example_present",
    manifest, ["worked_example", "present"],
    "structure: the mechanics are shown with a worked example");
  const [stepsEvaluated, stepsIncomplete] = workedExampleChecks(results, manifest);

  // ---- Section 3: no_signals ----
  falseCheck(results, "no_signals", "no_buy_sell_signals", manifest,
    ["signals", "buy_sell_signals_present"],
    "hard rule: no buy/sell signals — never imply a trade; no 'buy', 'sell', 'overweight' as instructions");
  falseCheck(results, "no_signals", "no_implied_trade", manifest,
    ["signals", "implied_trade_present"],
    "hard rule: never imply a trade");
  falseCheck(results, "no_signals", "no_trade_execution", manifest,
    ["signals", "trade_execution_present"],
    "hard rule: no trade execution — analysis and frameworks only");

  // ---- Section 4: disclosures ----
  gatedBoolCheck(results, "disclosures", "assumptions_stated", manifest,
    ["disclosure", "uses_data_or_assumptions"],
    ["disclosure", "assumptions_stated"],
    "disclosures: assumptions stated where relevant",
    "article declares no data or assumptions — disclosure not applicable");
  gatedBoolCheck(results, "disclosures", "data_dates_stated", manifest,
    ["disclosure", "uses_data_or_assumptions"],
    ["disclosure", "data_dates_stated"],
    "disclosures: data dates stated where relevant",
    "article declares no data or assumptions — disclosure not applicable");
  gatedBoolCheck(results, "disclosures", "limits_stated", manifest,
    ["disclosure", "uses_data_or_assumptions"],
    ["disclosure", "limits_stated"],
    "disclosures: limits stated where relevant",
    "article declares no data or assumptions — disclosure not applicable");
  gatedStringCheck(results, "disclosures", "data_as_of_stated", manifest,
    ["disclosure", "uses_data_or_assumptions"],
    ["disclosure", "data_as_of"],
    "disclosures: the article's data as-of date is stated",
    "article declares no data or assumptions — disclosure not applicable");

  // ---- Section 5: review ----
  boolCheck(results, "review", "education_only_review_passed",
    manifest, ["review", "education_only_review_passed"],
    "review declaration: the piece is education only — the reader should understand more, not act more");
  boolCheck(results, "review", "think_with_finance_voice_confirmed",
    manifest, ["review", "think_with_finance_voice_confirmed"],
    "review declaration: the piece is in the Think With Finance voice");
  boolCheck(results, "review", "plain_language_review_passed",
    manifest, ["review", "plain_language_review_passed"],
    "review declaration: concepts and analysis are explained simply");
  boolCheck(results, "review", "no_hype_confirmed",
    manifest, ["review", "no_hype_confirmed"],
    "review declaration: no hype");

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
    verdict = "NOT_ARTICLE_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "ARTICLE_READY";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "finance-education-article",
    atom_version: "0.1.0",
    article: manifest["article"] ?? null,
    verdict,
    sections,
    checks: results,
    steps_evaluated: stepsEvaluated,
    steps_incomplete: stepsIncomplete,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "FINANCE EDUCATION ARTICLE",
    `article: ${pyStr(verdict.article ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(26)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
