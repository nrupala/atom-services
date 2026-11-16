// Finance tool design advisory — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/finance-tool-design-advisory/src/finance_tool_design_advisory.py
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
  tool: "string",
  compliance: {
    tool_calculates_user_decides: "boolean",
    recommendation_language_present: "boolean",
    disclaimers_carried: "boolean",
    finra_2214_and_csa_framing_addressed: "boolean",
    advice_like_language_redesigned_to_scenarios: "boolean",
  },
  margin: {
    margin_features_present: "boolean",
    margin_disclosure_carried: "boolean",
  },
  quant: {
    risk_and_return_presented_together: "boolean",
    diversification_and_correlation_addressed: "boolean",
    mpt_limits_disclosed: "boolean",
    factor_thinking_addressed: "boolean",
    regime_awareness_addressed: "boolean",
    tax_and_fee_aware_returns: "boolean",
  },
  features: [{
    name: "string",
    shows_scenarios_and_tradeoffs: "boolean",
    implies_advice_present: "boolean",
    figures_traceable: "boolean",
    is_backtest: "boolean",
    overfit_and_survivorship_addressed: "boolean",
  }],
  open_building_blocks: {
    open_data_sources_used: "boolean",
    open_source_analytics_used: "boolean",
    every_number_reproducible_and_auditable: "boolean",
  },
  privacy: {
    zero_knowledge_design: "boolean",
    user_held_keys: "boolean",
    data_selling_present: "boolean",
  },
  business_model: {
    monetization_via_certification_membership_or_developer_licenses: "boolean",
    core_features_gated_present: "boolean",
  },
  behavioral: {
    biases_accounted_for: "boolean",
    decision_history_used_as_insight: "boolean",
  },
  anti_patterns: {
    guaranteed_or_return_promising_language_present: "boolean",
    black_box_risk_numbers_present: "boolean",
    fees_taxes_slippage_ignored_present: "boolean",
    overfit_backtests_present: "boolean",
    survivorship_bias_present: "boolean",
  },
};

export const SECTIONS = [
  "compliance_and_advice_boundary",
  "quant_fundamentals",
  "reproducibility_privacy_and_open_finance",
  "business_model_and_behavioral_design",
  "anti_patterns",
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
  tool: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  features_count: number | null;
  features_without_scenarios_and_tradeoffs: string[] | null;
  scenario_coverage: string | null;
  features_implying_advice: string[] | null;
  features_without_traceable_figures: string[] | null;
  traceability_coverage: string | null;
  backtest_features_without_overfit_survivorship_address: string[] | null;
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

  const [featuresRaw, hasFeatures] = getPath(manifest, "features");
  const featuresIsList = hasFeatures && Array.isArray(featuresRaw);
  const rows: unknown[] = featuresIsList ? (featuresRaw as unknown[]) : [];
  const featuresCount: number | null = featuresIsList ? rows.length : null;

  const featuresWithoutScenarios: string[] | null = featuresIsList
    ? rows.filter((c) => hasField(c, "shows_scenarios_and_tradeoffs") &&
        (c as Record<string, unknown>)["shows_scenarios_and_tradeoffs"] !== true)
        .map(rowName)
    : null;
  const featuresImplyingAdvice: string[] | null = featuresIsList
    ? rows.filter((c) => isPyDict(c) && c["implies_advice_present"] === true)
        .map(rowName)
    : null;
  const featuresWithoutTraceable: string[] | null = featuresIsList
    ? rows.filter((c) => hasField(c, "figures_traceable") &&
        (c as Record<string, unknown>)["figures_traceable"] !== true)
        .map(rowName)
    : null;
  const backtestRows = rows.filter(
    (c) => isPyDict(c) && c["is_backtest"] === true);
  const backtestWithoutAddress: string[] | null = featuresIsList
    ? backtestRows.filter((c) => hasField(c, "overfit_and_survivorship_addressed") &&
        (c as Record<string, unknown>)["overfit_and_survivorship_addressed"] !== true)
        .map(rowName)
    : null;
  const scenarioCoverage: number | null =
    featuresIsList && featuresCount !== null && featuresCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["shows_scenarios_and_tradeoffs"] === true).length / featuresCount
      : null;
  const traceabilityCoverage: number | null =
    featuresIsList && featuresCount !== null && featuresCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["figures_traceable"] === true).length / featuresCount
      : null;

  // ---- Section 1: compliance_and_advice_boundary ----
  boolCheck(results, "compliance_and_advice_boundary",
    "tool_calculates_user_decides", manifest,
    ["compliance", "tool_calculates_user_decides"],
    "compliance line: the tool calculates, the user decides — analytics, scenarios and trade-offs are surfaced, never a decision for the user");
  falseCheck(results, "compliance_and_advice_boundary",
    "no_recommendation_language", manifest,
    ["compliance", "recommendation_language_present"],
    "compliance line: no recommendation to buy, sell or hold is present in the declared design");
  boolCheck(results, "compliance_and_advice_boundary",
    "disclaimers_carried", manifest,
    ["compliance", "disclaimers_carried"],
    "compliance line: clear disclaimers are carried");
  boolCheck(results, "compliance_and_advice_boundary",
    "finra_2214_and_csa_framing_addressed", manifest,
    ["compliance", "finra_2214_and_csa_framing_addressed"],
    "compliance line: FINRA Rule 2214 (margin disclosure) and CSA framing are addressed — the design stays out of registered-adviser territory");
  boolCheck(results, "compliance_and_advice_boundary",
    "advice_like_language_redesigned_to_scenarios", manifest,
    ["compliance", "advice_like_language_redesigned_to_scenarios"],
    "compliance line: anything that starts to sound like \"you should…\" is redesigned into \"here's what the numbers show, and what would have to be true\"");
  gatedBoolCheck(results, "compliance_and_advice_boundary",
    "margin_disclosure_when_margin_features", manifest,
    ["margin", "margin_features_present"],
    ["margin", "margin_disclosure_carried"],
    "compliance line: margin disclosure is carried when margin features are declared present",
    "no margin features declared");
  const scenariosPresent = featuresIsList &&
    rows.every((c) => hasField(c, "shows_scenarios_and_tradeoffs"));
  check(results, "compliance_and_advice_boundary",
    "every_feature_shows_scenarios_and_tradeoffs", featuresRaw,
    scenariosPresent,
    featuresIsList && (featuresCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        c["shows_scenarios_and_tradeoffs"] === true),
    "compliance line: every declared feature row shows scenarios and trade-offs");
  const advicePresent = featuresIsList &&
    rows.every((c) => hasField(c, "implies_advice_present"));
  check(results, "compliance_and_advice_boundary",
    "no_feature_implies_advice", featuresRaw, advicePresent,
    featuresIsList && featuresImplyingAdvice !== null &&
      featuresImplyingAdvice.length === 0,
    "anti-pattern: no declared feature row implies advice");

  // ---- Section 2: quant_fundamentals ----
  boolCheck(results, "quant_fundamentals",
    "risk_and_return_presented_together", manifest,
    ["quant", "risk_and_return_presented_together"],
    "quant fundamentals: risk and return are presented together");
  boolCheck(results, "quant_fundamentals",
    "diversification_and_correlation_addressed", manifest,
    ["quant", "diversification_and_correlation_addressed"],
    "quant fundamentals: diversification and correlation / anti-correlation are addressed");
  boolCheck(results, "quant_fundamentals",
    "mpt_limits_disclosed", manifest,
    ["quant", "mpt_limits_disclosed"],
    "quant fundamentals: MPT and its real-world limits are disclosed — fat tails, unstable correlations");
  boolCheck(results, "quant_fundamentals",
    "factor_thinking_addressed", manifest,
    ["quant", "factor_thinking_addressed"],
    "quant fundamentals: factor thinking is addressed");
  boolCheck(results, "quant_fundamentals",
    "regime_awareness_addressed", manifest,
    ["quant", "regime_awareness_addressed"],
    "quant fundamentals: regime awareness is addressed");
  boolCheck(results, "quant_fundamentals",
    "tax_and_fee_aware_returns", manifest,
    ["quant", "tax_and_fee_aware_returns"],
    "quant fundamentals: returns are tax- and fee-aware — gross is not net");

  // ---- Section 3: reproducibility_privacy_and_open_finance ----
  boolCheck(results, "reproducibility_privacy_and_open_finance",
    "open_data_sources_used", manifest,
    ["open_building_blocks", "open_data_sources_used"],
    "open finance building blocks: open data — rates, FX, fundamentals — is used");
  boolCheck(results, "reproducibility_privacy_and_open_finance",
    "open_source_analytics_used", manifest,
    ["open_building_blocks", "open_source_analytics_used"],
    "open finance building blocks: reproducible open-source analytics are used");
  boolCheck(results, "reproducibility_privacy_and_open_finance",
    "every_number_reproducible_and_auditable", manifest,
    ["open_building_blocks", "every_number_reproducible_and_auditable"],
    "open finance building blocks: every number shown is reproducible and auditable — a figure the user can't trace is a liability");
  boolCheck(results, "reproducibility_privacy_and_open_finance",
    "zero_knowledge_design", manifest,
    ["privacy", "zero_knowledge_design"],
    "data integrity & privacy: the design is zero-knowledge");
  boolCheck(results, "reproducibility_privacy_and_open_finance",
    "user_held_keys", manifest,
    ["privacy", "user_held_keys"],
    "data integrity & privacy: keys are user-held");
  falseCheck(results, "reproducibility_privacy_and_open_finance",
    "no_data_selling", manifest,
    ["privacy", "data_selling_present"],
    "data integrity & privacy: no data selling — trust and security are the moat");
  check(results, "reproducibility_privacy_and_open_finance",
    "features_declared", featuresRaw, featuresIsList,
    featuresIsList && (featuresCount as number) > 0,
    "the declared record names its features — the features list is present and non-empty");
  const traceabilityPresent = featuresIsList &&
    rows.every((c) => hasField(c, "figures_traceable"));
  check(results, "reproducibility_privacy_and_open_finance",
    "every_feature_figures_traceable", featuresRaw, traceabilityPresent,
    featuresIsList && (featuresCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["figures_traceable"] === true),
    "open finance building blocks: every declared feature row declares its figures traceable");

  // ---- Section 4: business_model_and_behavioral_design ----
  boolCheck(results, "business_model_and_behavioral_design",
    "monetization_via_ecosystem_not_gating", manifest,
    ["business_model", "monetization_via_certification_membership_or_developer_licenses"],
    "FOSS business model: monetization is via certification, membership and developer licenses — the ecosystem and credentialing");
  falseCheck(results, "business_model_and_behavioral_design",
    "no_core_features_gated", manifest,
    ["business_model", "core_features_gated_present"],
    "FOSS business model: the core is kept open — features are not gated");
  boolCheck(results, "business_model_and_behavioral_design",
    "biases_accounted_for", manifest,
    ["behavioral", "biases_accounted_for"],
    "behavioral finance: biases — loss aversion, recency, overconfidence — are accounted for");
  boolCheck(results, "business_model_and_behavioral_design",
    "decision_history_used_as_insight", manifest,
    ["behavioral", "decision_history_used_as_insight"],
    "behavioral finance: decision archaeology and conviction-weighting turn the user's own history into insight");

  // ---- Section 5: anti_patterns ----
  falseCheck(results, "anti_patterns",
    "no_guaranteed_or_return_promising_language", manifest,
    ["anti_patterns", "guaranteed_or_return_promising_language_present"],
    "anti-pattern: no \"guaranteed\" or return-promising language is present");
  falseCheck(results, "anti_patterns",
    "no_black_box_risk_numbers", manifest,
    ["anti_patterns", "black_box_risk_numbers_present"],
    "anti-pattern: no black-box risk numbers are present");
  falseCheck(results, "anti_patterns",
    "no_fees_taxes_slippage_ignored", manifest,
    ["anti_patterns", "fees_taxes_slippage_ignored_present"],
    "anti-pattern: fees, taxes and slippage are not ignored");
  falseCheck(results, "anti_patterns",
    "no_overfit_backtests", manifest,
    ["anti_patterns", "overfit_backtests_present"],
    "anti-pattern: no overfit backtests are present");
  falseCheck(results, "anti_patterns",
    "no_survivorship_bias", manifest,
    ["anti_patterns", "survivorship_bias_present"],
    "anti-pattern: no survivorship bias is present");
  const backtestGatePresent = featuresIsList &&
    rows.every((c) => hasField(c, "is_backtest"));
  const backtestPresent = featuresIsList && backtestGatePresent &&
    backtestRows.every((c) => hasField(c, "overfit_and_survivorship_addressed"));
  check(results, "anti_patterns",
    "every_backtest_feature_addresses_overfit_and_survivorship",
    featuresRaw, backtestPresent,
    featuresIsList &&
      backtestRows.every((c) => isPyDict(c) &&
        c["overfit_and_survivorship_addressed"] === true),
    "anti-pattern: every feature row declared as a backtest declares overfit and survivorship bias addressed");

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
    verdict = "FINANCE_TOOL_DESIGN_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "FINANCE_TOOL_DESIGN_SOUND";
  }

  const computedNames = [
    "features_declared",
    "every_feature_shows_scenarios_and_tradeoffs",
    "no_feature_implies_advice",
    "every_feature_figures_traceable",
    "every_backtest_feature_addresses_overfit_and_survivorship",
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
    service: "finance-tool-design-advisory",
    atom_version: "0.1.0",
    tool: manifest["tool"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    features_count: featuresCount,
    features_without_scenarios_and_tradeoffs: featuresWithoutScenarios,
    scenario_coverage: fmt6(scenarioCoverage),
    features_implying_advice: featuresImplyingAdvice,
    features_without_traceable_figures: featuresWithoutTraceable,
    traceability_coverage: fmt6(traceabilityCoverage),
    backtest_features_without_overfit_survivorship_address: backtestWithoutAddress,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "FINANCE TOOL DESIGN ADVISORY",
    `tool: ${pyStr(verdict.tool ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
