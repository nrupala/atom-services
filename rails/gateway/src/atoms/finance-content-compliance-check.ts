// Finance content compliance check — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/finance-content-compliance-check/src/
// finance_content_compliance_check.py (evaluate() + stamp()).
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
  content: "string",
  jurisdiction: "string",
  advice_boundary: {
    teaches_frameworks_not_recommendations: "boolean",
    personalized_recommendations_present: "boolean",
    education_not_advice_disclaimer_present: "boolean",
    checklist_passed: "boolean",
    advice_like_content_present: "boolean",
    advice_like_flagged_for_review: "boolean",
  },
  figures: [{
    label: "string",
    as_of: "string",
    source: "string",
    source_is_primary: "boolean",
    rederived: "boolean",
  }],
  accuracy: {
    primary_sources_linked: "boolean",
    rates_and_limits_dated: "boolean",
    recheck_cadence_set: "boolean",
  },
  risk: {
    risk_before_upside: "boolean",
    uses_past_performance: "boolean",
    past_performance_caveat_present: "boolean",
    fees_visible: "boolean",
    taxes_visible: "boolean",
    return_promises_present: "boolean",
    forecasts_presented_as_fact: "boolean",
    survivorship_examples_used: "boolean",
  },
  calculators: {
    includes_calculator: "boolean",
    spec_with_formulas_present: "boolean",
    boundary_cases_tested: "boolean",
    assumptions_visible_in_ui: "boolean",
    dark_patterns_present: "boolean",
  },
  commercial: {
    has_sponsored_or_affiliate_content: "boolean",
    sponsored_affiliate_hard_labeled: "boolean",
    conflicts_disclosed: "boolean",
    editorial_separated_from_sales: "boolean",
    recommendations_for_undisclosed_compensation: "boolean",
    fear_based_selling_present: "boolean",
  },
  compliance: {
    jurisdiction_notes_file_kept: "boolean",
    tools_collect_user_data: "boolean",
    privacy_rules_applied: "boolean",
    user_data_leaves_device_without_consent: "boolean",
  },
  corrections: {
    correction_log_maintained: "boolean",
    corrections_made: "boolean",
    correction_note_visible_and_dated: "boolean",
  },
};

export const SECTIONS = [
  "advice_boundary",
  "accuracy_and_sourcing",
  "risk_framing",
  "calculators_and_tools",
  "commercial_honesty",
  "compliance_and_corrections",
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
  content: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  figures_evaluated: number;
  figures_incomplete: number;
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

function gatedFalseCheck(
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
    check(results, section, name, value, present, value === false, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function figuresChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): [number, number] {
  const [figures, hasFigures] = getPath(manifest, "figures");
  if (!hasFigures || !Array.isArray(figures) || figures.length === 0) {
    check(results, "accuracy_and_sourcing", "figures_complete_and_dated",
      figures, false, false, "no figures declared");
    check(results, "accuracy_and_sourcing",
      "figures_primary_sourced_and_rederived",
      figures, false, false, "no figures declared");
    return [0, 0];
  }
  let incomplete = 0;
  let evaluated = 0;
  let notPrimaryOrRederived = false;
  for (const figure of figures) {
    if (!isPyDict(figure)) {
      incomplete += 1;
      continue;
    }
    const [label, hasLabel] = getPath(figure, "label");
    const [asOf, hasAsOf] = getPath(figure, "as_of");
    const [source, hasSource] = getPath(figure, "source");
    const [primary, hasPrimary] = getPath(figure, "source_is_primary");
    const [rederived, hasRederived] = getPath(figure, "rederived");
    if (!(hasLabel && hasAsOf && hasSource && hasPrimary && hasRederived &&
          isNonemptyStr(label) && isNonemptyStr(asOf) &&
          isNonemptyStr(source))) {
      incomplete += 1;
      continue;
    }
    evaluated += 1;
    if (primary !== true || rederived !== true) {
      notPrimaryOrRederived = true;
    }
  }
  if (incomplete > 0) {
    check(results, "accuracy_and_sourcing", "figures_complete_and_dated",
      figures, false, false,
      "a figure is missing its label, as-of date, source, primary-source flag, or re-derivation flag");
    check(results, "accuracy_and_sourcing",
      "figures_primary_sourced_and_rederived",
      figures, false, false,
      "a figure is incomplete, so its sourcing and re-derivation cannot be verified");
  } else {
    check(results, "accuracy_and_sourcing", "figures_complete_and_dated",
      figures, true, true,
      "every figure carries a label, an as-of date, and a source (skill: date all rates/limits, 'as of <date>, source: ...')");
    check(results, "accuracy_and_sourcing",
      "figures_primary_sourced_and_rederived",
      figures, true, !notPrimaryOrRederived,
      "every figure is linked to a primary source and its number re-derived (skill: re-derive every number; link primary sources — CRA/IRS/central banks)");
  }
  return [evaluated, incomplete];
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: advice_boundary ----
  boolCheck(results, "advice_boundary",
    "teaches_frameworks_and_criteria", manifest,
    ["advice_boundary", "teaches_frameworks_not_recommendations"],
    "education, not advice: teach frameworks, math, and how-to-choose criteria");
  falseCheck(results, "advice_boundary",
    "no_personalized_recommendations", manifest,
    ["advice_boundary", "personalized_recommendations_present"],
    "red line: no personalized recommendations, ever — personalized advice is licensed activity");
  boolCheck(results, "advice_boundary",
    "education_not_advice_disclaimer_present", manifest,
    ["advice_boundary", "education_not_advice_disclaimer_present"],
    "'this is education; for your situation see a licensed advisor' included where relevant");
  const [jurisdiction, hasJurisdiction] = getPath(manifest, "jurisdiction");
  check(results, "advice_boundary", "jurisdiction_context_stated",
    jurisdiction, hasJurisdiction, isNonemptyStr(jurisdiction),
    "jurisdiction context stated (CA/US contexts differ — state the context)");
  boolCheck(results, "advice_boundary",
    "advice_boundary_checklist_passed", manifest,
    ["advice_boundary", "checklist_passed"],
    "quality gate: advice-boundary checklist passed for every piece");
  gatedBoolCheck(results, "advice_boundary", "advice_like_content_flagged",
    manifest,
    ["advice_boundary", "advice_like_content_present"],
    ["advice_boundary", "advice_like_flagged_for_review"],
    "compliance touchpoint: content that edges toward advice-like (individualized) is flagged",
    "no advice-like (individualized) content declared");

  // ---- Section 2: accuracy_and_sourcing ----
  const [figuresEvaluated, figuresIncomplete] = figuresChecks(results, manifest);
  boolCheck(results, "accuracy_and_sourcing",
    "primary_sources_linked", manifest,
    ["accuracy", "primary_sources_linked"],
    "primary sources linked (CRA/IRS/central banks)");
  boolCheck(results, "accuracy_and_sourcing",
    "rates_and_limits_dated", manifest,
    ["accuracy", "rates_and_limits_dated"],
    "all rates/limits dated ('as of <date>, source: ...')");
  boolCheck(results, "accuracy_and_sourcing",
    "recheck_cadence_set", manifest,
    ["accuracy", "recheck_cadence_set"],
    "quality gate: figures re-checked on a schedule, since figures rot faster than pages");

  // ---- Section 3: risk_framing ----
  boolCheck(results, "risk_framing", "risk_stated_before_upside",
    manifest, ["risk", "risk_before_upside"],
    "risk-first framing: uncertainty and risk stated before upside");
  gatedBoolCheck(results, "risk_framing", "past_performance_caveat_present",
    manifest,
    ["risk", "uses_past_performance"],
    ["risk", "past_performance_caveat_present"],
    "past-performance caveats present where past performance is used",
    "no past performance used — caveat not required");
  boolCheck(results, "risk_framing", "fees_made_visible", manifest,
    ["risk", "fees_visible"], "fees made visible");
  boolCheck(results, "risk_framing", "taxes_made_visible", manifest,
    ["risk", "taxes_visible"], "taxes made visible");
  falseCheck(results, "risk_framing", "no_return_promises", manifest,
    ["risk", "return_promises_present"],
    "red line: never promise returns or imply guaranteed outcomes");
  falseCheck(results, "risk_framing", "no_forecasts_as_fact",
    manifest, ["risk", "forecasts_presented_as_fact"],
    "no forecasts presented as fact");
  falseCheck(results, "risk_framing", "no_survivorship_examples",
    manifest, ["risk", "survivorship_examples_used"],
    "no survivorship examples (only-the-winners case studies)");

  // ---- Section 4: calculators_and_tools ----
  gatedBoolCheck(results, "calculators_and_tools",
    "calculator_spec_with_formulas", manifest,
    ["calculators", "includes_calculator"],
    ["calculators", "spec_with_formulas_present"],
    "calculators & tools: written spec with formulas",
    "no calculator or tool included");
  gatedBoolCheck(results, "calculators_and_tools",
    "calculator_boundary_cases_tested", manifest,
    ["calculators", "includes_calculator"],
    ["calculators", "boundary_cases_tested"],
    "quality gate: boundary cases tested (zero, negative, max caps)",
    "no calculator or tool included");
  gatedBoolCheck(results, "calculators_and_tools",
    "calculator_assumptions_visible", manifest,
    ["calculators", "includes_calculator"],
    ["calculators", "assumptions_visible_in_ui"],
    "assumptions visible in the UI",
    "no calculator or tool included");
  gatedFalseCheck(results, "calculators_and_tools",
    "no_dark_patterns_in_tools", manifest,
    ["calculators", "includes_calculator"],
    ["calculators", "dark_patterns_present"],
    "red line: no dark patterns in money tools",
    "no calculator or tool included");

  // ---- Section 5: commercial_honesty ----
  gatedBoolCheck(results, "commercial_honesty",
    "sponsored_affiliate_content_hard_labeled", manifest,
    ["commercial", "has_sponsored_or_affiliate_content"],
    ["commercial", "sponsored_affiliate_hard_labeled"],
    "sponsored/affiliate content hard-labeled",
    "no sponsored or affiliate content declared");
  boolCheck(results, "commercial_honesty", "conflicts_disclosed",
    manifest, ["commercial", "conflicts_disclosed"],
    "conflicts disclosed");
  boolCheck(results, "commercial_honesty",
    "editorial_separated_from_sales", manifest,
    ["commercial", "editorial_separated_from_sales"],
    "editorial separated from sales");
  falseCheck(results, "commercial_honesty",
    "no_recommendations_for_undisclosed_compensation", manifest,
    ["commercial", "recommendations_for_undisclosed_compensation"],
    "red line: nothing 'recommended' for undisclosed compensation — no hidden compensation");
  falseCheck(results, "commercial_honesty", "no_fear_based_selling",
    manifest, ["commercial", "fear_based_selling_present"],
    "red line: no fear-based selling");

  // ---- Section 6: compliance_and_corrections ----
  boolCheck(results, "compliance_and_corrections",
    "jurisdiction_notes_file_kept", manifest,
    ["compliance", "jurisdiction_notes_file_kept"],
    "compliance touchpoint: jurisdiction notes file kept");
  gatedBoolCheck(results, "compliance_and_corrections",
    "privacy_rules_applied_to_user_data", manifest,
    ["compliance", "tools_collect_user_data"],
    ["compliance", "privacy_rules_applied"],
    "compliance touchpoint: privacy rules applied to any user data in tools",
    "tools collect no user data — privacy rules not applicable");
  falseCheck(results, "compliance_and_corrections",
    "no_user_data_leaves_without_consent", manifest,
    ["compliance", "user_data_leaves_device_without_consent"],
    "red line: user financial data never leaves the device without explicit, informed consent");
  boolCheck(results, "compliance_and_corrections",
    "correction_log_maintained", manifest,
    ["corrections", "correction_log_maintained"],
    "quality gate: correction log maintained");
  gatedBoolCheck(results, "compliance_and_corrections",
    "corrections_visible_and_dated", manifest,
    ["corrections", "corrections_made"],
    ["corrections", "correction_note_visible_and_dated"],
    "corrections: fix fast, date the fix, log it — wrong figures get a visible correction note, not a silent edit",
    "no corrections declared");

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
    verdict = "NON_COMPLIANT";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "COMPLIANT";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "finance-content-compliance-check",
    atom_version: "0.1.0",
    content: manifest["content"] ?? null,
    verdict,
    sections,
    checks: results,
    figures_evaluated: figuresEvaluated,
    figures_incomplete: figuresIncomplete,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "FINANCE CONTENT COMPLIANCE CHECK",
    `content: ${pyStr(verdict.content ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(26)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
