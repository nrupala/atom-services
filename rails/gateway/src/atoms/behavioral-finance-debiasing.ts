// Behavioral finance debiasing — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/behavioral-finance-debiasing/src/behavioral_finance_debiasing.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed status and
// the summary string are byte-identical to the Python output for
// the same input. The computed drift/share values use the shared
// fixed serialization: round half up to 4dp —
// floor(v * 10000 + 0.5) / 10000 — then format with exactly four
// decimals; comparisons use the unrounded values.

import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  decision: "string",
  context: {
    is_big_trade: "boolean",
  },
  bias_screening: {
    loss_aversion_screened: "boolean",
    disposition_effect_screened: "boolean",
    mental_accounting_screened: "boolean",
    anchoring_to_purchase_price_screened: "boolean",
    recency_availability_screened: "boolean",
    herding_fomo_screened: "boolean",
    overconfidence_illusion_of_control_screened: "boolean",
    confirmation_screened: "boolean",
    sunk_cost_screened: "boolean",
    home_bias_screened: "boolean",
    narrative_bias_screened: "boolean",
  },
  bias_patterns: {
    found: [{
      bias: "string",
      technique_named: "boolean",
      surfaced_to_user: "boolean",
    }],
  },
  prospect_theory: {
    reference_point_identified: "boolean",
    framed_vs_reference_not_absolute_wealth: "boolean",
    loss_asymmetry_acknowledged: "boolean",
    risk_attitude_by_domain_checked: "boolean",
    probability_weighting_checked: "boolean",
  },
  precommitment: {
    investment_policy_statement_present: "boolean",
    written_sell_criteria_present: "boolean",
    rules_decided_before_emotion_arrives: "boolean",
    rebalancing_target_allocation_percent: "number",
    rebalancing_current_allocation_percent: "number",
    rebalancing_band_percent: "number",
  },
  journal_and_checklists: {
    decision_journal_reasoning_recorded: "boolean",
    decisions_reviewed_separately_from_outcomes: "boolean",
    base_rates_used: "boolean",
    checklists_used: "boolean",
    cooling_off_period_taken: "boolean",
  },
  whole_portfolio: {
    reframed_in_whole_portfolio_absolute_terms: "boolean",
    single_position_pnl_framing_used: "boolean",
    position_value: "number",
    whole_portfolio_value: "number",
  },
  guardrails: {
    bias_patterns_surfaced_to_user: "boolean",
    tool_calculates_user_decides: "boolean",
    not_advice_line_respected: "boolean",
    biases_used_to_manipulate: "boolean",
    trade_nudge_present: "boolean",
    markets_assumed_perfectly_efficient_or_irrational: "boolean",
    single_bias_treated_as_whole_story: "boolean",
  },
};

export const SECTIONS = [
  "bias_screening",
  "prospect_theory_reframing",
  "precommitment_rules",
  "journal_checklists_and_cooling_off",
  "whole_portfolio_reframing",
  "guardrails_and_anti_patterns",
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
  decision: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  bias_patterns_found_count: number | null;
  allocation_drift_over_band_percent: string | null;
  position_share_percent_of_portfolio: string | null;
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

function pyStr(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
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

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: bias_screening ----
  const screening: [string, string][] = [
    ["loss_aversion_screened", "loss aversion"],
    ["disposition_effect_screened",
      "disposition effect (sell winners too early, ride losers too long)"],
    ["mental_accounting_screened", "mental accounting"],
    ["anchoring_to_purchase_price_screened", "anchoring to purchase price"],
    ["recency_availability_screened", "recency/availability"],
    ["herding_fomo_screened", "herding & FOMO"],
    ["overconfidence_illusion_of_control_screened",
      "overconfidence and illusion of control"],
    ["confirmation_screened", "confirmation"],
    ["sunk_cost_screened", "sunk cost"],
    ["home_bias_screened", "home bias"],
    ["narrative_bias_screened", "narrative bias"],
  ];
  for (const [field, label] of screening) {
    boolCheck(results, "bias_screening", field,
      manifest, ["bias_screening", field],
      `key money biases: the decision is screened for ${label}`);
  }
  const [found, hasFound] = getPath(manifest, "bias_patterns", "found");
  const foundIsList = hasFound && Array.isArray(found);
  const foundCount: number | null = foundIsList
    ? (found as unknown[]).length
    : null;
  const techniqueOk = foundIsList &&
    (found as unknown[]).every(
      (p) => isPyDict(p) && p["technique_named"] === true);
  check(results, "bias_screening",
    "all_found_patterns_have_technique_named", found,
    foundIsList, techniqueOk,
    "debiasing techniques: every bias pattern found carries a named debiasing technique (an empty found list passes — no found pattern lacks a technique)");
  const surfacedOk = foundIsList &&
    (found as unknown[]).every(
      (p) => isPyDict(p) && p["surfaced_to_user"] === true);
  check(results, "bias_screening",
    "all_found_patterns_surfaced_to_user", found,
    foundIsList, surfacedOk,
    "surface the user's own bias patterns back to them so they can self-correct (an empty found list passes — no found pattern was withheld)");

  // ---- Section 2: prospect_theory_reframing ----
  boolCheck(results, "prospect_theory_reframing",
    "reference_point_identified",
    manifest, ["prospect_theory", "reference_point_identified"],
    "prospect theory: decisions are reference-dependent — the reference point is identified");
  boolCheck(results, "prospect_theory_reframing",
    "framed_vs_reference_not_absolute_wealth",
    manifest, ["prospect_theory",
      "framed_vs_reference_not_absolute_wealth"],
    "prospect theory: the decision is framed as gain/loss vs the reference point, not absolute wealth");
  boolCheck(results, "prospect_theory_reframing",
    "loss_asymmetry_acknowledged",
    manifest, ["prospect_theory", "loss_asymmetry_acknowledged"],
    "prospect theory: losses loom roughly twice as large as equivalent gains — the asymmetry is acknowledged in the framing");
  boolCheck(results, "prospect_theory_reframing",
    "risk_attitude_by_domain_checked",
    manifest, ["prospect_theory", "risk_attitude_by_domain_checked"],
    "prospect theory: risk-averse in the domain of gains, risk-seeking in the domain of losses — the decision's domain attitude is checked");
  boolCheck(results, "prospect_theory_reframing",
    "probability_weighting_checked",
    manifest, ["prospect_theory", "probability_weighting_checked"],
    "prospect theory: rare probabilities are overweighted and near-certain ones underweighted — the weighting is checked");

  // ---- Section 3: precommitment_rules ----
  boolCheck(results, "precommitment_rules",
    "investment_policy_statement_present",
    manifest, ["precommitment", "investment_policy_statement_present"],
    "pre-commit rules: an investment policy statement is present");
  boolCheck(results, "precommitment_rules",
    "written_sell_criteria_present",
    manifest, ["precommitment", "written_sell_criteria_present"],
    "pre-commit rules: written sell criteria are present");
  boolCheck(results, "precommitment_rules",
    "rules_decided_before_emotion_arrives",
    manifest, ["precommitment", "rules_decided_before_emotion_arrives"],
    "pre-commit rules: decide before emotion arrives — the rules were decided before the emotion of this decision");
  const [target, hasTarget] = getPath(
    manifest, "precommitment", "rebalancing_target_allocation_percent");
  const [current, hasCurrent] = getPath(
    manifest, "precommitment", "rebalancing_current_allocation_percent");
  const [band, hasBand] = getPath(
    manifest, "precommitment", "rebalancing_band_percent");
  const bandPresent = hasTarget && isNumber(target) &&
    hasCurrent && isNumber(current) && hasBand && isNumber(band);
  const drift: number | null = bandPresent
    ? Math.abs((current as number) - (target as number))
    : null;
  check(results, "precommitment_rules",
    "allocation_within_rebalancing_band", current, bandPresent,
    bandPresent && (drift as number) <= (band as number),
    "pre-commit rules: rebalancing bands — the declared current allocation's distance from the declared target allocation is at or below the declared band percent");
  const driftOverBand: number | null = bandPresent
    ? (drift as number) - (band as number)
    : null;

  // ---- Section 4: journal_checklists_and_cooling_off ----
  boolCheck(results, "journal_checklists_and_cooling_off",
    "decision_journal_reasoning_recorded",
    manifest, ["journal_and_checklists",
      "decision_journal_reasoning_recorded"],
    "decision journal / decision archaeology: record the reasoning");
  boolCheck(results, "journal_checklists_and_cooling_off",
    "decisions_reviewed_separately_from_outcomes",
    manifest, ["journal_and_checklists",
      "decisions_reviewed_separately_from_outcomes"],
    "decision archaeology: review decisions separately from outcomes");
  boolCheck(results, "journal_checklists_and_cooling_off",
    "base_rates_used",
    manifest, ["journal_and_checklists", "base_rates_used"],
    "debiasing techniques: base rates are used");
  boolCheck(results, "journal_checklists_and_cooling_off",
    "checklists_used",
    manifest, ["journal_and_checklists", "checklists_used"],
    "debiasing techniques: checklists are used");
  const [isBig, hasBig] = getPath(manifest, "context", "is_big_trade");
  const [cooling, hasCooling] = getPath(
    manifest, "journal_and_checklists", "cooling_off_period_taken");
  if (hasBig && pyTruthy(isBig)) {
    check(results, "journal_checklists_and_cooling_off",
      "cooling_off_period_taken_before_big_trade", cooling,
      hasCooling, cooling === true,
      "debiasing techniques: cooling-off periods before big trades");
  } else {
    check(results, "journal_checklists_and_cooling_off",
      "cooling_off_period_taken_before_big_trade", isBig,
      hasBig, true, "not a big trade");
  }

  // ---- Section 5: whole_portfolio_reframing ----
  boolCheck(results, "whole_portfolio_reframing",
    "reframed_in_whole_portfolio_absolute_terms",
    manifest, ["whole_portfolio",
      "reframed_in_whole_portfolio_absolute_terms"],
    "debiasing techniques: reframe in whole-portfolio absolute terms");
  falseCheck(results, "whole_portfolio_reframing",
    "not_framed_as_single_position_pnl",
    manifest, ["whole_portfolio", "single_position_pnl_framing_used"],
    "debiasing techniques: the reframe is not left as single-position P&L");
  const [pos, hasPos] = getPath(manifest, "whole_portfolio", "position_value");
  const [whole, hasWhole] = getPath(
    manifest, "whole_portfolio", "whole_portfolio_value");
  const share: number | null =
    hasPos && isNumber(pos) && hasWhole && isNumber(whole) &&
      (whole as number) !== 0
      ? 100 * (pos as number) / (whole as number)
      : null;

  // ---- Section 6: guardrails_and_anti_patterns ----
  boolCheck(results, "guardrails_and_anti_patterns",
    "bias_patterns_surfaced_to_user",
    manifest, ["guardrails", "bias_patterns_surfaced_to_user"],
    "surface the user's own bias patterns back to them so they can self-correct");
  boolCheck(results, "guardrails_and_anti_patterns",
    "tool_calculates_user_decides",
    manifest, ["guardrails", "tool_calculates_user_decides"],
    "tool calculates, user decides");
  boolCheck(results, "guardrails_and_anti_patterns",
    "not_advice_line_respected",
    manifest, ["guardrails", "not_advice_line_respected"],
    "stay on the FINRA/CSA 'not advice' line");
  falseCheck(results, "guardrails_and_anti_patterns",
    "biases_not_used_to_manipulate",
    manifest, ["guardrails", "biases_used_to_manipulate"],
    "anti-pattern to refuse: using biases to manipulate");
  falseCheck(results, "guardrails_and_anti_patterns",
    "no_trade_nudge",
    manifest, ["guardrails", "trade_nudge_present"],
    "never nudge them into a trade");
  falseCheck(results, "guardrails_and_anti_patterns",
    "markets_not_assumed_perfectly_efficient_or_irrational",
    manifest, ["guardrails",
      "markets_assumed_perfectly_efficient_or_irrational"],
    "anti-pattern to refuse: assuming markets are perfectly efficient or perfectly irrational");
  falseCheck(results, "guardrails_and_anti_patterns",
    "single_bias_not_treated_as_whole_story",
    manifest, ["guardrails", "single_bias_treated_as_whole_story"],
    "anti-pattern to refuse: treating one bias as the whole story");

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
    verdict = "NOT_DEBIASED";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DEBIASED";
  }

  const bandStatus = results.find(
    (r) => r.check === "allocation_within_rebalancing_band")!.status;
  let computedStatus: string | null;
  if (bandStatus === "fail") {
    computedStatus = "outside_declared_band_on_declared_evidence";
  } else if (bandStatus === "pass") {
    computedStatus = "within_declared_band_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "behavioral-finance-debiasing",
    atom_version: "0.1.0",
    decision: manifest["decision"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    bias_patterns_found_count: foundCount,
    allocation_drift_over_band_percent: fmt4(driftOverBand),
    position_share_percent_of_portfolio: fmt4(share),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "BEHAVIORAL FINANCE DEBIASING",
    `decision: ${pyStr(verdict.decision ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
