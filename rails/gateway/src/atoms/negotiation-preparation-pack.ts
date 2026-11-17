// Negotiation preparation pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/negotiation-preparation-pack/src/negotiation_preparation_pack.py
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
  negotiation: "string",
  batna_and_reservation: {
    batna_identified: "boolean",
    batna_strengthened: "boolean",
    reservation_price_set: "boolean",
    counterpart_reservation_estimated: "boolean",
    zopa_assessed: "boolean",
    walk_away_commitment_declared: "boolean",
    fundamentals_prepared_before_negotiation: "boolean",
  },
  interests: {
    own_interests_identified: "boolean",
    counterpart_interests_identified: "boolean",
    counterpart_why_to_be_asked_planned: "boolean",
    interests_not_positions_framing_adopted: "boolean",
  },
  value_creation: {
    value_created_before_claiming_planned: "boolean",
    non_zero_sum_opportunities_sought: "boolean",
    trade_across_differently_valued_issues_planned: "boolean",
  },
  issues: [{
    name: "string",
    own_underlying_interest: "string",
    counterpart_underlying_interest: "string",
    trade_potential_assessed: "boolean",
  }],
  direction: {
    sense_of_direction_stated: "boolean",
    plan_not_script_approach_adopted: "boolean",
    plan_b_prepared: "boolean",
    plan_c_prepared: "boolean",
  },
  presence_and_awareness: {
    own_emotional_state_management_planned: "boolean",
    composure_commitment_declared: "boolean",
    situational_awareness_planned: "boolean",
  },
  sequence: {
    opening_planned: "boolean",
    critical_moments_recognition_planned: "boolean",
    closing_cleanly_planned: "boolean",
  },
  anchoring: {
    informed_enough_to_anchor_first: "boolean",
    anchor_first_planned: "boolean",
  },
  tactics: {
    counterpart_yes_made_easy_planned: "boolean",
    people_separated_from_problem_declared: "boolean",
    hard_on_problem_soft_on_person_declared: "boolean",
    fair_enough_agreement_aim_declared: "boolean",
  },
  learning: {
    debrief_planned_after_negotiation: "boolean",
    deliberate_debrief_review_committed: "boolean",
    misleading_feedback_caution_acknowledged: "boolean",
  },
  red_lines: {
    no_batna_present: "boolean",
    arguing_positions_present: "boolean",
    treating_everything_as_zero_sum_present: "boolean",
    rigid_script_reliance_present: "boolean",
    losing_composure_present: "boolean",
    never_debriefing_present: "boolean",
  },
};

export const SECTIONS = [
  "batna_reservation_price_and_zopa",
  "interests_and_value_creation",
  "improvisation_and_adaptation",
  "openings_moments_closing_and_tactics",
  "debrief_and_anti_pattern_red_lines",
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
  negotiation: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  issues_count: number | null;
  issues_without_own_interest: string[] | null;
  own_interest_coverage: string | null;
  issues_without_counterpart_interest: string[] | null;
  counterpart_interest_coverage: string | null;
  issues_without_trade_potential_assessed: string[] | null;
  trade_potential_assessed_coverage: string | null;
  duplicate_issue_names: string[] | null;
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

function gatedAnchorCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  field: string,
  evidence: string,
): void {
  const [gate, gatePresent] = getPath(manifest, "anchoring", "informed_enough_to_anchor_first");
  const [value, present] = getPath(manifest, "anchoring", field);
  const bothPresent = gatePresent && present;
  const ok = gatePresent && gate === false ? true : value === true;
  check(results, section, name, value, bothPresent, ok, evidence);
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

function nonempty(entry: unknown, field: string): boolean {
  return isPyDict(entry) && typeof entry[field] === "string" &&
    entry[field] !== "";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [issuesRaw, hasIssues] = getPath(manifest, "issues");
  const issuesIsList = hasIssues && Array.isArray(issuesRaw);
  const rows: unknown[] = issuesIsList ? (issuesRaw as unknown[]) : [];
  const issuesCount: number | null = issuesIsList ? rows.length : null;

  const issuesWithoutOwnInterest: string[] | null = issuesIsList
    ? rows.filter((c) => hasField(c, "own_underlying_interest") &&
        !nonempty(c, "own_underlying_interest")).map(rowName)
    : null;
  const issuesWithoutCounterpartInterest: string[] | null = issuesIsList
    ? rows.filter((c) => hasField(c, "counterpart_underlying_interest") &&
        !nonempty(c, "counterpart_underlying_interest")).map(rowName)
    : null;
  const issuesWithoutTradePotentialAssessed: string[] | null = issuesIsList
    ? rows.filter((c) => hasField(c, "trade_potential_assessed") &&
        (c as Record<string, unknown>)["trade_potential_assessed"] !== true)
        .map(rowName)
    : null;
  let duplicateIssueNames: string[] | null = null;
  if (issuesIsList) {
    const seen: string[] = [];
    duplicateIssueNames = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["name"] === "string") {
        const nm = c["name"] as string;
        if (seen.includes(nm) && !duplicateIssueNames.includes(nm)) {
          duplicateIssueNames.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const ownInterestCoverage: number | null =
    issuesIsList && issuesCount !== null && issuesCount > 0
      ? rows.filter((c) => nonempty(c, "own_underlying_interest")).length / issuesCount
      : null;
  const counterpartInterestCoverage: number | null =
    issuesIsList && issuesCount !== null && issuesCount > 0
      ? rows.filter((c) => nonempty(c, "counterpart_underlying_interest")).length / issuesCount
      : null;
  const tradePotentialAssessedCoverage: number | null =
    issuesIsList && issuesCount !== null && issuesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["trade_potential_assessed"] === true).length / issuesCount
      : null;

  // ---- Section 1: batna_reservation_price_and_zopa ----
  boolCheck(results, "batna_reservation_price_and_zopa",
    "batna_identified", manifest,
    ["batna_and_reservation", "batna_identified"],
    "BATNA: the Best Alternative To a Negotiated Agreement is identified");
  boolCheck(results, "batna_reservation_price_and_zopa",
    "batna_strengthened", manifest,
    ["batna_and_reservation", "batna_strengthened"],
    "BATNA: the BATNA is strengthened, not only known — it is the real walk-away power");
  boolCheck(results, "batna_reservation_price_and_zopa",
    "reservation_price_set", manifest,
    ["batna_and_reservation", "reservation_price_set"],
    "reservation price: the walk-away number is set before the table");
  boolCheck(results, "batna_reservation_price_and_zopa",
    "counterpart_reservation_estimated", manifest,
    ["batna_and_reservation", "counterpart_reservation_estimated"],
    "reservation price: the counterpart's walk-away range is estimated, so an overlap can be assessed");
  boolCheck(results, "batna_reservation_price_and_zopa",
    "zopa_assessed", manifest,
    ["batna_and_reservation", "zopa_assessed"],
    "ZOPA: the Zone of Possible Agreement — where the two reservation ranges overlap — is assessed");
  boolCheck(results, "batna_reservation_price_and_zopa",
    "walk_away_commitment_declared", manifest,
    ["batna_and_reservation", "walk_away_commitment_declared"],
    "reservation price: walking away beyond the reservation number is committed to in advance");
  boolCheck(results, "batna_reservation_price_and_zopa",
    "fundamentals_prepared_before_negotiation", manifest,
    ["batna_and_reservation", "fundamentals_prepared_before_negotiation"],
    "fundamentals: the fundamentals are prepared before the table, not improvised from nothing");

  // ---- Section 2: interests_and_value_creation ----
  boolCheck(results, "interests_and_value_creation",
    "own_interests_identified", manifest,
    ["interests", "own_interests_identified"],
    "interests: the caller's own underlying interests are identified, not only the stated demand");
  boolCheck(results, "interests_and_value_creation",
    "counterpart_interests_identified", manifest,
    ["interests", "counterpart_interests_identified"],
    "interests: the counterpart's underlying interests are identified, not only their stated demand");
  boolCheck(results, "interests_and_value_creation",
    "counterpart_why_to_be_asked_planned", manifest,
    ["interests", "counterpart_why_to_be_asked_planned"],
    "interests: asking why the counterpart wants what they ask for is planned");
  boolCheck(results, "interests_and_value_creation",
    "interests_not_positions_framing_adopted", manifest,
    ["interests", "interests_not_positions_framing_adopted"],
    "interests: the negotiation is framed on underlying interests, not positions");
  boolCheck(results, "interests_and_value_creation",
    "value_created_before_claiming_planned", manifest,
    ["value_creation", "value_created_before_claiming_planned"],
    "value creation: expanding the pie is planned before claiming a share of it");
  boolCheck(results, "interests_and_value_creation",
    "non_zero_sum_opportunities_sought", manifest,
    ["value_creation", "non_zero_sum_opportunities_sought"],
    "value creation: the deal is not treated as zero-sum — opportunities to create value are sought");
  boolCheck(results, "interests_and_value_creation",
    "trade_across_differently_valued_issues_planned", manifest,
    ["value_creation", "trade_across_differently_valued_issues_planned"],
    "value creation: trading across issues the two sides value differently is planned");
  check(results, "interests_and_value_creation",
    "issues_declared", issuesRaw, issuesIsList,
    issuesIsList && (issuesCount as number) > 0,
    "the declared record names its issues — the issues list is present and non-empty");
  const ownPresent = issuesIsList &&
    rows.every((c) => hasField(c, "own_underlying_interest"));
  check(results, "interests_and_value_creation",
    "every_issue_names_own_underlying_interest", issuesRaw, ownPresent,
    issuesIsList && (issuesCount as number) > 0 &&
      rows.every((c) => nonempty(c, "own_underlying_interest")),
    "interests: every declared issue row names the caller's own underlying interest behind the position");
  const counterpartPresent = issuesIsList &&
    rows.every((c) => hasField(c, "counterpart_underlying_interest"));
  check(results, "interests_and_value_creation",
    "every_issue_names_counterpart_underlying_interest", issuesRaw, counterpartPresent,
    issuesIsList && (issuesCount as number) > 0 &&
      rows.every((c) => nonempty(c, "counterpart_underlying_interest")),
    "interests: every declared issue row names the counterpart's underlying interest behind their position");
  const tradePresent = issuesIsList &&
    rows.every((c) => hasField(c, "trade_potential_assessed"));
  check(results, "interests_and_value_creation",
    "every_issue_trade_potential_assessed", issuesRaw, tradePresent,
    issuesIsList && (issuesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["trade_potential_assessed"] === true),
    "value creation: every declared issue row has its trade potential — whether the two sides value it differently — assessed");
  const namePresent = issuesIsList &&
    rows.every((c) => hasField(c, "name"));
  check(results, "interests_and_value_creation",
    "no_issue_name_duplicated", issuesRaw, namePresent,
    issuesIsList && duplicateIssueNames !== null &&
      duplicateIssueNames.length === 0,
    "issues: no declared issue name is owned by more than one issue row");

  // ---- Section 3: improvisation_and_adaptation ----
  boolCheck(results, "improvisation_and_adaptation",
    "sense_of_direction_stated", manifest,
    ["direction", "sense_of_direction_stated"],
    "direction: a sense of direction is stated — a map that orients even when the terrain differs");
  boolCheck(results, "improvisation_and_adaptation",
    "plan_not_script_approach_adopted", manifest,
    ["direction", "plan_not_script_approach_adopted"],
    "direction: the plan is carried as orientation, not as a rigid script");
  boolCheck(results, "improvisation_and_adaptation",
    "plan_b_prepared", manifest,
    ["direction", "plan_b_prepared"],
    "direction: a Plan B is carried");
  boolCheck(results, "improvisation_and_adaptation",
    "plan_c_prepared", manifest,
    ["direction", "plan_c_prepared"],
    "direction: a Plan C is carried, beyond Plan B");
  boolCheck(results, "improvisation_and_adaptation",
    "own_emotional_state_management_planned", manifest,
    ["presence_and_awareness", "own_emotional_state_management_planned"],
    "presence of mind: managing the caller's own emotional state during the negotiation is planned");
  boolCheck(results, "improvisation_and_adaptation",
    "composure_commitment_declared", manifest,
    ["presence_and_awareness", "composure_commitment_declared"],
    "presence of mind: staying composed is committed to in advance");
  boolCheck(results, "improvisation_and_adaptation",
    "situational_awareness_planned", manifest,
    ["presence_and_awareness", "situational_awareness_planned"],
    "situational awareness: reading shifting interests, constraints and emotions in real time is planned");

  // ---- Section 4: openings_moments_closing_and_tactics ----
  boolCheck(results, "openings_moments_closing_and_tactics",
    "opening_planned", manifest,
    ["sequence", "opening_planned"],
    "sequence: the opening is planned");
  boolCheck(results, "openings_moments_closing_and_tactics",
    "critical_moments_recognition_planned", manifest,
    ["sequence", "critical_moments_recognition_planned"],
    "sequence: recognizing the critical moments — the pivot points — is planned");
  boolCheck(results, "openings_moments_closing_and_tactics",
    "closing_cleanly_planned", manifest,
    ["sequence", "closing_cleanly_planned"],
    "sequence: closing cleanly is planned");
  const [gateValue, gatePresent] = getPath(manifest, "anchoring", "informed_enough_to_anchor_first");
  check(results, "openings_moments_closing_and_tactics",
    "anchoring_applicability_declared", gateValue, gatePresent, true,
    "anchoring: whether the caller is informed enough to anchor first is declared — anchoring first applies only when informed");
  gatedAnchorCheck(results, "openings_moments_closing_and_tactics",
    "anchor_first_planned_when_informed", manifest,
    "anchor_first_planned",
    "anchoring: anchoring first is planned for when the caller is informed");
  boolCheck(results, "openings_moments_closing_and_tactics",
    "counterpart_yes_made_easy_planned", manifest,
    ["tactics", "counterpart_yes_made_easy_planned"],
    "tactics: making the counterpart's yes easy is planned");
  boolCheck(results, "openings_moments_closing_and_tactics",
    "people_separated_from_problem_declared", manifest,
    ["tactics", "people_separated_from_problem_declared"],
    "tactics: the people are separated from the problem");
  boolCheck(results, "openings_moments_closing_and_tactics",
    "hard_on_problem_soft_on_person_declared", manifest,
    ["tactics", "hard_on_problem_soft_on_person_declared"],
    "tactics: hard on the problem, soft on the person is declared");
  boolCheck(results, "openings_moments_closing_and_tactics",
    "fair_enough_agreement_aim_declared", manifest,
    ["tactics", "fair_enough_agreement_aim_declared"],
    "tactics: the aim is a fair-enough agreement that holds, not a maximal extraction");

  // ---- Section 5: debrief_and_anti_pattern_red_lines ----
  boolCheck(results, "debrief_and_anti_pattern_red_lines",
    "debrief_planned_after_negotiation", manifest,
    ["learning", "debrief_planned_after_negotiation"],
    "debrief: a debrief after the negotiation is planned — every negotiation is debriefed");
  boolCheck(results, "debrief_and_anti_pattern_red_lines",
    "deliberate_debrief_review_committed", manifest,
    ["learning", "deliberate_debrief_review_committed"],
    "debrief: the debrief is a deliberate review, committed to in advance, so learning actually happens");
  boolCheck(results, "debrief_and_anti_pattern_red_lines",
    "misleading_feedback_caution_acknowledged", manifest,
    ["learning", "misleading_feedback_caution_acknowledged"],
    "debrief: negotiation is a wicked learning environment where feedback misleads — that caution is acknowledged");
  falseCheck(results, "debrief_and_anti_pattern_red_lines",
    "no_batna", manifest,
    ["red_lines", "no_batna_present"],
    "red line: no BATNA is present in the preparation");
  falseCheck(results, "debrief_and_anti_pattern_red_lines",
    "no_arguing_positions", manifest,
    ["red_lines", "arguing_positions_present"],
    "red line: arguing positions is not present in the preparation");
  falseCheck(results, "debrief_and_anti_pattern_red_lines",
    "no_zero_sum_treatment", manifest,
    ["red_lines", "treating_everything_as_zero_sum_present"],
    "red line: treating everything as zero-sum is not present in the preparation");
  falseCheck(results, "debrief_and_anti_pattern_red_lines",
    "no_rigid_script_reliance", manifest,
    ["red_lines", "rigid_script_reliance_present"],
    "red line: reliance on a rigid script is not present in the preparation");
  falseCheck(results, "debrief_and_anti_pattern_red_lines",
    "no_losing_composure", manifest,
    ["red_lines", "losing_composure_present"],
    "red line: losing composure is not present in the preparation");
  falseCheck(results, "debrief_and_anti_pattern_red_lines",
    "no_never_debriefing", manifest,
    ["red_lines", "never_debriefing_present"],
    "red line: never debriefing is not present in the preparation");

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
    verdict = "NEGOTIATION_PREPARATION_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "NEGOTIATION_PREPARATION_SOUND";
  }

  const computedNames = [
    "issues_declared",
    "every_issue_names_own_underlying_interest",
    "every_issue_names_counterpart_underlying_interest",
    "every_issue_trade_potential_assessed",
    "no_issue_name_duplicated",
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
    service: "negotiation-preparation-pack",
    atom_version: "0.1.0",
    negotiation: manifest["negotiation"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    issues_count: issuesCount,
    issues_without_own_interest: issuesWithoutOwnInterest,
    own_interest_coverage: fmt6(ownInterestCoverage),
    issues_without_counterpart_interest: issuesWithoutCounterpartInterest,
    counterpart_interest_coverage: fmt6(counterpartInterestCoverage),
    issues_without_trade_potential_assessed: issuesWithoutTradePotentialAssessed,
    trade_potential_assessed_coverage: fmt6(tradePotentialAssessedCoverage),
    duplicate_issue_names: duplicateIssueNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "NEGOTIATION PREPARATION PACK",
    `negotiation: ${pyStr(verdict.negotiation ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
