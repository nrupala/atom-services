// Tech stack decision memo — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/tech-stack-decision-memo/src/tech_stack_decision_memo.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  memo_title: "string",
  context: {
    hard_constraints_declared: "boolean",
    security_model_constraint_addressed: "boolean",
    regulatory_constraint_addressed: "boolean",
    performance_constraint_addressed: "boolean",
    offline_constraint_addressed: "boolean",
    access_patterns_declared: "boolean",
    usage_patterns_declared: "boolean",
    team_operability_context_declared: "boolean",
    decision_framed_as_sticky: "boolean",
  },
  candidate_work: {
    candidates_compared_against_same_hard_constraints: "boolean",
    boring_technology_bias_addressed: "boolean",
    novelty_budget_allocation_declared: "boolean",
    novelty_spend_tied_to_differentiation_declared: "boolean",
  },
  candidates: [{
    candidate_id: "string",
    stack_name: "string",
    novelty_classification: "string",
    evidence_note: "string",
    scores: [{
      criterion_id: "string",
      score: "number",
    }],
    weighted_total_declared: "number",
  }],
  evaluation: {
    evidence_basis_recorded: "boolean",
    evaluation_applied_consistently_across_candidates: "boolean",
  },
  criteria: [{
    criterion_id: "string",
    criterion_name: "string",
    weight: "number",
  }],
  tco: {
    licensing_cost_addressed: "boolean",
    operations_burden_addressed: "boolean",
    learning_curve_addressed: "boolean",
    lock_in_cost_addressed: "boolean",
    operability_cost_addressed: "boolean",
    on_call_operability_owner_declared: "boolean",
    team_can_operate_declared_stack: "boolean",
    free_tier_or_free_choice_used: "boolean",
    hidden_fragility_cost_named: "boolean",
  },
  decision: {
    decision_recorded: "boolean",
    chosen_candidate_id: "string",
    rationale_recorded: "boolean",
    rationale_tied_to_hard_constraints: "boolean",
    rationale_tied_to_evaluation_criteria: "boolean",
    tradeoffs_of_decision_recorded: "boolean",
    declared_ranking_candidate_ids: ["string"],
  },
  reversibility: {
    exit_cost_assessed: "boolean",
    exit_path_kept: "boolean",
    vendor_specific_pieces_isolated_behind_interfaces: "boolean",
    reversibility_assessed: "boolean",
  },
  red_lines: {
    framework_of_the_week_chosen_for_novelty_present: "boolean",
    microservices_for_solo_project_present: "boolean",
    docker_by_default_choice_present: "boolean",
    lock_in_with_no_exit_present: "boolean",
    technology_chosen_to_pad_cv_present: "boolean",
  },
};

export const SECTIONS = [
  "context_and_constraints",
  "candidates_and_boring_technology",
  "evaluation_criteria_and_evidence",
  "total_cost_and_operability",
  "decision_and_rationale",
  "reversibility_and_exit",
  "red_lines",
] as const;

const NOVELTY_CLASSIFICATIONS = ["proven", "novel"];

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
  memo_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  tech_stack_candidates_count: number | null;
  tech_stack_criteria_count: number | null;
  duplicate_tech_stack_candidate_ids: string[] | null;
  duplicate_tech_stack_criterion_ids: string[] | null;
  duplicate_declared_ranking_candidate_ids: string[] | null;
  tech_stack_candidates_without_stack_name: string[] | null;
  tech_stack_candidates_with_invalid_novelty_classification: string[] | null;
  tech_stack_candidates_without_evidence_note: string[] | null;
  tech_stack_criteria_without_name: string[] | null;
  tech_stack_criteria_with_invalid_weight: string[] | null;
  tech_stack_candidates_with_incomplete_or_extra_scores: string[] | null;
  tech_stack_candidates_with_weighted_total_mismatch: string[] | null;
  tech_stack_candidates_missing_from_declared_ranking: string[] | null;
  declared_ranking_ids_not_declared_as_candidates: string[] | null;
  tech_stack_criteria_weights_sum: string | null;
  candidate_score_coverage_ratio: string | null;
  candidate_weighted_total_match_ratio: string | null;
  candidate_evidence_note_ratio: string | null;
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
  if (hasGate && gate) {
    check(results, section, name, target, hasTarget, target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function strDuplicates(values: unknown[]): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const nm of values) {
    if (typeof nm === "string") {
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function idsOf(rows: unknown[], field: string): string[] {
  const out: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      out.push(c[field] as string);
    }
  }
  return out;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [candidatesRaw, hasCandidates] = getPath(manifest, "candidates");
  const candIsList = hasCandidates && Array.isArray(candidatesRaw);
  const candRows: unknown[] = candIsList ? (candidatesRaw as unknown[]) : [];
  const candCount: number | null = candIsList ? candRows.length : null;
  const candidateIds = idsOf(candRows, "candidate_id");

  const [criteriaRaw, hasCriteria] = getPath(manifest, "criteria");
  const critIsList = hasCriteria && Array.isArray(criteriaRaw);
  const critRows: unknown[] = critIsList ? (criteriaRaw as unknown[]) : [];
  const critCount: number | null = critIsList ? critRows.length : null;
  const criterionIds = idsOf(critRows, "criterion_id");

  const [rankingRaw, hasRanking] = getPath(
    manifest, "decision", "declared_ranking_candidate_ids");
  const rankingIsList = hasRanking && Array.isArray(rankingRaw);
  const rankingRows: unknown[] = rankingIsList ? (rankingRaw as unknown[]) : [];

  const [chosen, hasChosen] = getPath(manifest, "decision", "chosen_candidate_id");

  const duplicateCandidateIds: string[] | null = candIsList
    ? duplicates(candRows, "candidate_id") : null;
  const duplicateCriterionIds: string[] | null = critIsList
    ? duplicates(critRows, "criterion_id") : null;
  const duplicateRankingIds: string[] | null = rankingIsList
    ? strDuplicates(rankingRows) : null;

  const candidatesWithoutStackName: string[] | null = candIsList
    ? candRows.filter((c) => hasField(c, "stack_name") &&
        !nonemptyStr((c as Record<string, unknown>)["stack_name"]))
        .map((c) => rowName(c, "candidate_id"))
    : null;
  const candidatesWithInvalidNovelty: string[] | null = candIsList
    ? candRows.filter((c) => hasField(c, "novelty_classification") &&
        !NOVELTY_CLASSIFICATIONS.includes(
          (c as Record<string, unknown>)["novelty_classification"] as string))
        .map((c) => rowName(c, "candidate_id"))
    : null;
  const candidatesWithoutEvidenceNote: string[] | null = candIsList
    ? candRows.filter((c) => hasField(c, "evidence_note") &&
        !nonemptyStr((c as Record<string, unknown>)["evidence_note"]))
        .map((c) => rowName(c, "candidate_id"))
    : null;
  const criteriaWithoutName: string[] | null = critIsList
    ? critRows.filter((c) => hasField(c, "criterion_name") &&
        !nonemptyStr((c as Record<string, unknown>)["criterion_name"]))
        .map((c) => rowName(c, "criterion_id"))
    : null;
  const criteriaWithInvalidWeight: string[] | null = critIsList
    ? critRows.filter((c) => hasField(c, "weight") &&
        !(typeof (c as Record<string, unknown>)["weight"] === "number" &&
          ((c as Record<string, unknown>)["weight"] as number) >= 0))
        .map((c) => rowName(c, "criterion_id"))
    : null;

  const weightByCriterion = new Map<string, number>();
  if (critIsList) {
    for (const c of critRows) {
      if (isPyDict(c) && typeof c["criterion_id"] === "string" &&
          typeof c["weight"] === "number") {
        weightByCriterion.set(c["criterion_id"] as string,
                              c["weight"] as number);
      }
    }
  }
  let weightsSum: number | null = null;
  if (critIsList) {
    weightsSum = 0.0;
    for (const w of weightByCriterion.values()) weightsSum += w;
  }

  const scoreIds = (c: unknown): string[] | null => {
    const scores = isPyDict(c) ? c["scores"] : null;
    if (!Array.isArray(scores)) return null;
    const out: string[] = [];
    for (const s of scores) {
      if (isPyDict(s) && typeof s["criterion_id"] === "string") {
        out.push(s["criterion_id"] as string);
      }
    }
    return out;
  };

  const scoresCover = (c: unknown): boolean => {
    const sids = scoreIds(c);
    if (sids === null) return false;
    return sids.length === criterionIds.length &&
      new Set(sids).size === sids.length &&
      sids.every((sid) => criterionIds.includes(sid)) &&
      criterionIds.every((cid) => sids.includes(cid));
  };

  const recomputedTotal = (c: unknown): number | null => {
    const scores = isPyDict(c) ? c["scores"] : null;
    if (!Array.isArray(scores)) return null;
    let totalVal = 0.0;
    for (const s of scores) {
      if (isPyDict(s) && typeof s["criterion_id"] === "string" &&
          weightByCriterion.has(s["criterion_id"] as string) &&
          typeof s["score"] === "number") {
        totalVal += weightByCriterion.get(s["criterion_id"] as string)! *
          (s["score"] as number);
      }
    }
    return totalVal;
  };

  const totalMatches = (c: unknown): boolean => {
    if (!hasField(c, "weighted_total_declared")) return false;
    const rec = recomputedTotal(c);
    if (rec === null) return false;
    const declared = (c as Record<string, unknown>)["weighted_total_declared"];
    if (typeof declared !== "number") return false;
    return fmt6(rec) === fmt6(declared);
  };

  const candidatesWithIncompleteScores: string[] | null =
    candIsList && critIsList
      ? candRows.filter((c) => hasField(c, "scores") && !scoresCover(c))
          .map((c) => rowName(c, "candidate_id"))
      : null;
  const candidatesWithTotalMismatch: string[] | null =
    candIsList && critIsList
      ? candRows.filter((c) => hasField(c, "weighted_total_declared") &&
          hasField(c, "scores") && !totalMatches(c))
          .map((c) => rowName(c, "candidate_id"))
      : null;

  let rankingMissing: string[] | null = null;
  let rankingExtra: string[] | null = null;
  if (candIsList && rankingIsList) {
    rankingMissing = [];
    for (const cid of candidateIds) {
      if (!rankingRows.includes(cid) && !rankingMissing.includes(cid)) {
        rankingMissing.push(cid);
      }
    }
    rankingExtra = [];
    for (const rid of rankingRows) {
      if (typeof rid === "string" && !candidateIds.includes(rid) &&
          !rankingExtra.includes(rid)) {
        rankingExtra.push(rid);
      }
    }
  }

  const scoreCoverageRatio: number | null =
    candIsList && critIsList && candCount !== null && candCount > 0
      ? candRows.filter((c) => scoresCover(c)).length / candCount
      : null;
  const weightedTotalMatchRatio: number | null =
    candIsList && critIsList && candCount !== null && candCount > 0
      ? candRows.filter((c) => totalMatches(c)).length / candCount
      : null;
  const candidateEvidenceRatio: number | null =
    candIsList && candCount !== null && candCount > 0
      ? candRows.filter((c) => isPyDict(c) && nonemptyStr(c["evidence_note"])).length / candCount
      : null;

  // ---- Section 1: context_and_constraints ----
  boolCheck(results, "context_and_constraints",
    "tech_stack_memo_hard_constraints_declared", manifest,
    ["context", "hard_constraints_declared"],
    "decision frame: the memo declares its hard constraints");
  boolCheck(results, "context_and_constraints",
    "tech_stack_memo_security_model_constraint_addressed", manifest,
    ["context", "security_model_constraint_addressed"],
    "decision frame: the security-model hard constraint is addressed");
  boolCheck(results, "context_and_constraints",
    "tech_stack_memo_regulatory_constraint_addressed", manifest,
    ["context", "regulatory_constraint_addressed"],
    "decision frame: the regulatory hard constraint is addressed");
  boolCheck(results, "context_and_constraints",
    "tech_stack_memo_performance_constraint_addressed", manifest,
    ["context", "performance_constraint_addressed"],
    "decision frame: the performance hard constraint is addressed");
  boolCheck(results, "context_and_constraints",
    "tech_stack_memo_offline_constraint_addressed", manifest,
    ["context", "offline_constraint_addressed"],
    "decision frame: the offline hard constraint is addressed");
  boolCheck(results, "context_and_constraints",
    "tech_stack_memo_access_patterns_declared", manifest,
    ["context", "access_patterns_declared"],
    "decision frame: the access patterns the stack must serve are declared");
  boolCheck(results, "context_and_constraints",
    "tech_stack_memo_usage_patterns_declared", manifest,
    ["context", "usage_patterns_declared"],
    "decision frame: the usage patterns the stack must serve are declared");
  boolCheck(results, "context_and_constraints",
    "tech_stack_memo_team_operability_context_declared", manifest,
    ["context", "team_operability_context_declared"],
    "decision frame: the team that must run the stack — its size and capability — is declared");
  boolCheck(results, "context_and_constraints",
    "tech_stack_memo_decision_framed_as_sticky", manifest,
    ["context", "decision_framed_as_sticky"],
    "decision frame: the stack choice is framed as sticky — decided like a one-way door, not fashion");

  // ---- Section 2: candidates_and_boring_technology ----
  boolCheck(results, "candidates_and_boring_technology",
    "tech_stack_memo_candidates_compared_against_same_hard_constraints",
    manifest,
    ["candidate_work", "candidates_compared_against_same_hard_constraints"],
    "candidates: every candidate stack was compared against the same declared hard constraints");
  boolCheck(results, "candidates_and_boring_technology",
    "tech_stack_memo_boring_technology_bias_addressed", manifest,
    ["candidate_work", "boring_technology_bias_addressed"],
    "boring-technology bias: the memo addresses preferring proven, well-understood tools for the plumbing");
  boolCheck(results, "candidates_and_boring_technology",
    "tech_stack_memo_novelty_budget_allocation_declared", manifest,
    ["candidate_work", "novelty_budget_allocation_declared"],
    "boring-technology bias: the memo declares how its limited novelty budget is allocated");
  boolCheck(results, "candidates_and_boring_technology",
    "tech_stack_memo_novelty_spend_tied_to_differentiation_declared",
    manifest,
    ["candidate_work", "novelty_spend_tied_to_differentiation_declared"],
    "boring-technology bias: any novelty spend is declared tied to where it actually differentiates");
  check(results, "candidates_and_boring_technology",
    "tech_stack_memo_candidates_list_declared", candidatesRaw, candIsList,
    candIsList && candCount !== null && candCount >= 2,
    "candidates: the declared record names its candidate stacks — the list is present and names at least two candidates; an absent list is missing evidence and a list of fewer than two declares no comparison at all");
  const candIdPresent = candIsList &&
    candRows.every((c) => hasField(c, "candidate_id"));
  check(results, "candidates_and_boring_technology",
    "every_tech_stack_memo_candidate_id_unique", candidatesRaw, candIdPresent,
    candIsList && duplicateCandidateIds !== null &&
      duplicateCandidateIds.length === 0,
    "candidates: no declared candidate_id is owned by more than one row");
  const stackNamePresent = candIsList &&
    candRows.every((c) => hasField(c, "stack_name"));
  check(results, "candidates_and_boring_technology",
    "every_tech_stack_memo_candidate_stack_name_declared", candidatesRaw,
    stackNamePresent,
    candIsList && candRows.every((c) => isPyDict(c) && nonemptyStr(c["stack_name"])),
    "candidates: every declared candidate declares a non-empty stack name");
  const noveltyPresent = candIsList &&
    candRows.every((c) => hasField(c, "novelty_classification"));
  check(results, "candidates_and_boring_technology",
    "every_tech_stack_memo_candidate_novelty_classification_recognised",
    candidatesRaw, noveltyPresent,
    candIsList && candRows.every((c) => isPyDict(c) &&
      NOVELTY_CLASSIFICATIONS.includes(c["novelty_classification"] as string)),
    "candidates: every declared candidate's novelty classification is one of proven, novel — the two classes the boring-technology bias works with");
  const evidencePresent = candIsList &&
    candRows.every((c) => hasField(c, "evidence_note"));
  check(results, "candidates_and_boring_technology",
    "every_tech_stack_memo_candidate_evidence_note_declared", candidatesRaw,
    evidencePresent,
    candIsList && candRows.every((c) => isPyDict(c) && nonemptyStr(c["evidence_note"])),
    "candidates: every declared candidate declares a non-empty evidence note");

  // ---- Section 3: evaluation_criteria_and_evidence ----
  boolCheck(results, "evaluation_criteria_and_evidence",
    "tech_stack_memo_evaluation_evidence_basis_recorded", manifest,
    ["evaluation", "evidence_basis_recorded"],
    "evaluation: the evidence basis for the candidate evaluation is recorded");
  boolCheck(results, "evaluation_criteria_and_evidence",
    "tech_stack_memo_evaluation_applied_consistently_across_candidates",
    manifest,
    ["evaluation", "evaluation_applied_consistently_across_candidates"],
    "evaluation: the same criteria and evidence basis were applied consistently across all candidates");
  check(results, "evaluation_criteria_and_evidence",
    "tech_stack_memo_criteria_list_declared", criteriaRaw, critIsList,
    critIsList && critCount !== null && critCount > 0,
    "criteria: the declared record names its evaluation criteria — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no evaluation at all");
  const critIdPresent = critIsList &&
    critRows.every((c) => hasField(c, "criterion_id"));
  check(results, "evaluation_criteria_and_evidence",
    "every_tech_stack_memo_criterion_id_unique", criteriaRaw, critIdPresent,
    critIsList && duplicateCriterionIds !== null &&
      duplicateCriterionIds.length === 0,
    "criteria: no declared criterion_id is owned by more than one row");
  const critNamePresent = critIsList &&
    critRows.every((c) => hasField(c, "criterion_name"));
  check(results, "evaluation_criteria_and_evidence",
    "every_tech_stack_memo_criterion_name_declared", criteriaRaw,
    critNamePresent,
    critIsList && critRows.every((c) => isPyDict(c) && nonemptyStr(c["criterion_name"])),
    "criteria: every declared criterion declares a non-empty criterion name");
  const weightPresent = critIsList &&
    critRows.every((c) => hasField(c, "weight"));
  check(results, "evaluation_criteria_and_evidence",
    "every_tech_stack_memo_criterion_weight_non_negative", criteriaRaw,
    weightPresent,
    critIsList && critRows.every((c) => isPyDict(c) &&
      typeof c["weight"] === "number" && (c["weight"] as number) >= 0),
    "criteria: every declared criterion declares a non-negative weight");
  check(results, "evaluation_criteria_and_evidence",
    "tech_stack_memo_criteria_weights_sum_positive", criteriaRaw,
    weightPresent,
    critIsList && weightsSum !== null && weightsSum > 0,
    "criteria: the declared criterion weights sum to a positive total — a memo whose weights sum to zero scores nothing");
  const scoresPresent = candIsList && critIsList &&
    candRows.every((c) => hasField(c, "scores")) &&
    critRows.every((c) => hasField(c, "criterion_id")) &&
    candRows.every((c) => {
      const scores = isPyDict(c) ? c["scores"] : null;
      if (!Array.isArray(scores)) return true;
      return scores.every((s) => isPyDict(s) && hasField(s, "criterion_id"));
    });
  check(results, "evaluation_criteria_and_evidence",
    "every_tech_stack_memo_candidate_scores_every_declared_criterion",
    candidatesRaw, scoresPresent,
    candIsList && critIsList && candRows.every((c) => scoresCover(c)),
    "scores: every declared candidate scores every declared criterion and no other criterion, exactly once");
  const totalsPresent = candIsList && critIsList &&
    candRows.every((c) => hasField(c, "weighted_total_declared")) &&
    candRows.every((c) => hasField(c, "scores")) &&
    critRows.every((c) => hasField(c, "weight")) &&
    critRows.every((c) => hasField(c, "criterion_id"));
  check(results, "evaluation_criteria_and_evidence",
    "every_tech_stack_memo_candidate_weighted_total_recomputes",
    candidatesRaw, totalsPresent,
    candIsList && critIsList && candRows.every((c) => totalMatches(c)),
    "scores: every declared candidate's declared weighted total recomputes exactly as the sum of declared weight times declared score over its declared scores");

  // ---- Section 4: total_cost_and_operability ----
  boolCheck(results, "total_cost_and_operability",
    "tech_stack_memo_licensing_cost_addressed", manifest,
    ["tco", "licensing_cost_addressed"],
    "total cost of ownership: licensing cost is weighed — not just the sticker");
  boolCheck(results, "total_cost_and_operability",
    "tech_stack_memo_operations_burden_addressed", manifest,
    ["tco", "operations_burden_addressed"],
    "total cost of ownership: operations burden is weighed");
  boolCheck(results, "total_cost_and_operability",
    "tech_stack_memo_learning_curve_addressed", manifest,
    ["tco", "learning_curve_addressed"],
    "total cost of ownership: learning curve for the team that must run the stack is weighed");
  boolCheck(results, "total_cost_and_operability",
    "tech_stack_memo_lock_in_cost_addressed", manifest,
    ["tco", "lock_in_cost_addressed"],
    "total cost of ownership: lock-in cost is weighed");
  boolCheck(results, "total_cost_and_operability",
    "tech_stack_memo_operability_cost_addressed", manifest,
    ["tco", "operability_cost_addressed"],
    "operability: the operability cost of the stack — who runs this at 2am — is addressed");
  boolCheck(results, "total_cost_and_operability",
    "tech_stack_memo_on_call_operability_owner_declared", manifest,
    ["tco", "on_call_operability_owner_declared"],
    "operability: the on-call operability owner who runs the stack at 2am is declared");
  boolCheck(results, "total_cost_and_operability",
    "tech_stack_memo_team_can_operate_declared_stack", manifest,
    ["tco", "team_can_operate_declared_stack"],
    "operability: the memo declares the team can operate the declared stack");
  gatedBoolCheck(results, "total_cost_and_operability",
    "tech_stack_memo_hidden_fragility_cost_named_where_free_choice_used",
    manifest,
    ["tco", "free_tier_or_free_choice_used"],
    ["tco", "hidden_fragility_cost_named"],
    "total cost of ownership: the hidden fragility cost of the free-tier or free choice used is named explicitly, so the trade-off is chosen knowingly",
    "no free-tier or free choice declared used");

  // ---- Section 5: decision_and_rationale ----
  boolCheck(results, "decision_and_rationale",
    "tech_stack_memo_decision_recorded", manifest,
    ["decision", "decision_recorded"],
    "decision: the memo records a decision");
  boolCheck(results, "decision_and_rationale",
    "tech_stack_memo_rationale_recorded", manifest,
    ["decision", "rationale_recorded"],
    "decision: the memo records the rationale for its decision");
  boolCheck(results, "decision_and_rationale",
    "tech_stack_memo_rationale_tied_to_hard_constraints", manifest,
    ["decision", "rationale_tied_to_hard_constraints"],
    "decision: the recorded rationale is tied to the declared hard constraints");
  boolCheck(results, "decision_and_rationale",
    "tech_stack_memo_rationale_tied_to_evaluation_criteria", manifest,
    ["decision", "rationale_tied_to_evaluation_criteria"],
    "decision: the recorded rationale is tied to the declared evaluation criteria");
  boolCheck(results, "decision_and_rationale",
    "tech_stack_memo_tradeoffs_of_decision_recorded", manifest,
    ["decision", "tradeoffs_of_decision_recorded"],
    "decision: the trade-offs of the recorded decision are recorded");
  const chosenPresent = hasChosen && candIsList;
  check(results, "decision_and_rationale",
    "tech_stack_memo_chosen_candidate_resolves_to_declared_candidate",
    chosen, chosenPresent,
    chosenPresent && typeof chosen === "string" &&
      candidateIds.includes(chosen),
    "decision: the declared chosen candidate id names one of the declared candidates — the atom checks only that the reference resolves; it never checks that the chosen candidate is the top-ranked or highest-scoring one");
  const rankingPresent = rankingIsList && candIsList &&
    candRows.every((c) => hasField(c, "candidate_id"));
  check(results, "decision_and_rationale",
    "tech_stack_memo_declared_ranking_matches_declared_candidates",
    rankingRaw, rankingPresent,
    rankingPresent && rankingMissing !== null && rankingMissing.length === 0 &&
      rankingExtra !== null && rankingExtra.length === 0 &&
      duplicateRankingIds !== null && duplicateRankingIds.length === 0 &&
      rankingRows.length === candidateIds.length,
    "decision: the candidate ids in the memo's declared ranking are exactly the declared candidate ids — none missing, none extra, none duplicated; checking a declared ranking's internal consistency is audit, not advice, and the atom produces no ranking of its own");

  // ---- Section 6: reversibility_and_exit ----
  boolCheck(results, "reversibility_and_exit",
    "tech_stack_memo_exit_cost_assessed", manifest,
    ["reversibility", "exit_cost_assessed"],
    "reversibility: the exit cost if this choice is wrong is assessed");
  boolCheck(results, "reversibility_and_exit",
    "tech_stack_memo_exit_path_kept", manifest,
    ["reversibility", "exit_path_kept"],
    "reversibility: an exit path from the chosen stack is kept");
  boolCheck(results, "reversibility_and_exit",
    "tech_stack_memo_vendor_specific_pieces_isolated_behind_interfaces",
    manifest,
    ["reversibility", "vendor_specific_pieces_isolated_behind_interfaces"],
    "reversibility: vendor-specific pieces are isolated behind interfaces");
  boolCheck(results, "reversibility_and_exit",
    "tech_stack_memo_reversibility_assessed", manifest,
    ["reversibility", "reversibility_assessed"],
    "reversibility: the reversibility of the stack choice is assessed");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "tech_stack_memo_free_of_framework_of_the_week_chosen_for_novelty",
    manifest,
    ["red_lines", "framework_of_the_week_chosen_for_novelty_present"],
    "red line: no framework-of-the-week chosen for novelty is present in the record");
  falseCheck(results, "red_lines",
    "tech_stack_memo_free_of_microservices_for_solo_project", manifest,
    ["red_lines", "microservices_for_solo_project_present"],
    "red line: no microservices architecture for a solo project is present in the record");
  falseCheck(results, "red_lines",
    "tech_stack_memo_free_of_docker_by_default_choice", manifest,
    ["red_lines", "docker_by_default_choice_present"],
    "red line: no Docker-by-default choice is present in the record");
  falseCheck(results, "red_lines",
    "tech_stack_memo_free_of_lock_in_with_no_exit", manifest,
    ["red_lines", "lock_in_with_no_exit_present"],
    "red line: no lock-in with no exit is present in the record");
  falseCheck(results, "red_lines",
    "tech_stack_memo_free_of_technology_chosen_to_pad_cv", manifest,
    ["red_lines", "technology_chosen_to_pad_cv_present"],
    "red line: no technology chosen to pad a CV is present in the record");

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
    verdict = "TECH_STACK_DECISION_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "TECH_STACK_DECISION_SOUND";
  }

  const computedNames = [
    "tech_stack_memo_candidates_list_declared",
    "every_tech_stack_memo_candidate_id_unique",
    "every_tech_stack_memo_candidate_stack_name_declared",
    "every_tech_stack_memo_candidate_novelty_classification_recognised",
    "every_tech_stack_memo_candidate_evidence_note_declared",
    "tech_stack_memo_criteria_list_declared",
    "every_tech_stack_memo_criterion_id_unique",
    "every_tech_stack_memo_criterion_name_declared",
    "every_tech_stack_memo_criterion_weight_non_negative",
    "tech_stack_memo_criteria_weights_sum_positive",
    "every_tech_stack_memo_candidate_scores_every_declared_criterion",
    "every_tech_stack_memo_candidate_weighted_total_recomputes",
    "tech_stack_memo_chosen_candidate_resolves_to_declared_candidate",
    "tech_stack_memo_declared_ranking_matches_declared_candidates",
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
    service: "tech-stack-decision-memo",
    atom_version: "0.1.0",
    memo_title: manifest["memo_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    tech_stack_candidates_count: candCount,
    tech_stack_criteria_count: critCount,
    duplicate_tech_stack_candidate_ids: duplicateCandidateIds,
    duplicate_tech_stack_criterion_ids: duplicateCriterionIds,
    duplicate_declared_ranking_candidate_ids: duplicateRankingIds,
    tech_stack_candidates_without_stack_name: candidatesWithoutStackName,
    tech_stack_candidates_with_invalid_novelty_classification: candidatesWithInvalidNovelty,
    tech_stack_candidates_without_evidence_note: candidatesWithoutEvidenceNote,
    tech_stack_criteria_without_name: criteriaWithoutName,
    tech_stack_criteria_with_invalid_weight: criteriaWithInvalidWeight,
    tech_stack_candidates_with_incomplete_or_extra_scores: candidatesWithIncompleteScores,
    tech_stack_candidates_with_weighted_total_mismatch: candidatesWithTotalMismatch,
    tech_stack_candidates_missing_from_declared_ranking: rankingMissing,
    declared_ranking_ids_not_declared_as_candidates: rankingExtra,
    tech_stack_criteria_weights_sum: fmt6(weightsSum),
    candidate_score_coverage_ratio: fmt6(scoreCoverageRatio),
    candidate_weighted_total_match_ratio: fmt6(weightedTotalMatchRatio),
    candidate_evidence_note_ratio: fmt6(candidateEvidenceRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "TECH STACK DECISION MEMO",
    `memo_title: ${pyStr(verdict.memo_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
