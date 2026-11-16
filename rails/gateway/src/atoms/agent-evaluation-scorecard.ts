// Agent evaluation scorecard — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/agent-evaluation-scorecard/src/agent_evaluation_scorecard.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string are
// byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";

import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  agent: "string",
  suite: {
    versioned: "boolean",
    criteria_written_before_run: "boolean",
    acceptance_criteria_per_task: "boolean",
    versioned_with_agent: "boolean",
  },
  run: {
    model_version_pinned: "boolean",
    sampling_settings_pinned: "boolean",
    tool_state_pinned: "boolean",
    fixtures_pinned: "boolean",
    raw_transcripts_stored: "boolean",
    same_suite_per_candidate: "boolean",
  },
  judging: {
    deterministic_checks_first: "boolean",
    llm_judge_used: "boolean",
    judge_calibrated_against_human_labels: "boolean",
    judge_blinded: "boolean",
    position_bias_controls: "boolean",
    model_judges_itself: "boolean",
  },
  gates: {
    eval_runs_before_merge: "boolean",
    regressions_block_merge: "boolean",
    accepted_tradeoffs_written: "boolean",
  },
  metrics: {
    steps_tracked: "boolean",
    cost_tracked: "boolean",
    latency_tracked: "boolean",
    refusal_error_rates_tracked: "boolean",
    safety_violations_tracked: "boolean",
    silent_wrongness_tracked: "boolean",
  },
  incidents: {
    misbehavior_becomes_named_tests: "boolean",
    all_production_incidents_replayed: "boolean",
  },
  scorecard: {
    published_per_run: "boolean",
    stored: "boolean",
  },
  tasks: [{
    name: "string",
    passed: "boolean",
    cost: "number",
    allowed_cost: "number",
    latency_ms: "number",
    allowed_latency_ms: "number",
    safety_violation: "boolean",
  }],
  hygiene: {
    contamination_checked: "boolean",
    variance_reported: "boolean",
    rebaselined_after_model_updates: "boolean",
  },
};

export const SECTIONS = [
  "task_suite",
  "reproducible_runs",
  "judging",
  "regression_gates",
  "beyond_accuracy",
  "incident_replay",
  "scorecard",
  "benchmark_hygiene",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Scorecard {
  tasks_total: number;
  tasks_passing: number;
  safety_violations: number;
}

export interface Verdict {
  service: string;
  atom_version: string;
  agent: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  scorecard: Scorecard;
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

function getFrom(
  obj: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return [null, false];
  return [obj[key], true];
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function judgeConditional(
  results: CheckResult[],
  name: string,
  manifest: Record<string, unknown>,
  field: string,
  evidence: string,
): void {
  const [llmUsed, hasLlm] = getPath(manifest, "judging", "llm_judge_used");
  const [value, present] = getPath(manifest, "judging", field);
  if (hasLlm && pyTruthy(llmUsed)) {
    check(results, "judging", name, value, present, value === true, evidence);
  } else {
    check(results, "judging", name, llmUsed, hasLlm, true,
      "no LLM judge declared");
  }
}

function taskResultsCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): Scorecard {
  const [tasks, hasTasks] = getPath(manifest, "tasks");
  if (!hasTasks || !Array.isArray(tasks) || tasks.length === 0) {
    check(results, "scorecard", "all_tasks_meet_acceptance_criteria",
      tasks, false, false, "no task results declared");
    return { tasks_total: 0, tasks_passing: 0, safety_violations: 0 };
  }
  let passing = 0;
  let violations = 0;
  let incomplete = false;
  let failing = false;
  for (const task of tasks) {
    if (!isPyDict(task)) {
      incomplete = true;
      continue;
    }
    const [passed, hasPassed] = getFrom(task, "passed");
    const [cost, hasCost] = getFrom(task, "cost");
    const [allowedCost, hasAllowedCost] = getFrom(task, "allowed_cost");
    const [latency, hasLatency] = getFrom(task, "latency_ms");
    const [allowedLatency, hasAllowedLatency] = getFrom(task, "allowed_latency_ms");
    const [violation, hasViolation] = getFrom(task, "safety_violation");
    if (!(hasPassed && hasCost && hasAllowedCost && hasLatency &&
          hasAllowedLatency && hasViolation && isNumber(cost) &&
          isNumber(allowedCost) && isNumber(latency) &&
          isNumber(allowedLatency))) {
      incomplete = true;
      continue;
    }
    if (violation === true) violations += 1;
    const ok = passed === true &&
      (cost as number) <= (allowedCost as number) &&
      (latency as number) <= (allowedLatency as number) &&
      violation !== true;
    if (ok) passing += 1;
    else failing = true;
  }
  const scorecard: Scorecard = {
    tasks_total: tasks.length,
    tasks_passing: passing,
    safety_violations: violations,
  };
  if (incomplete) {
    check(results, "scorecard", "all_tasks_meet_acceptance_criteria",
      tasks, false, false, "task results missing acceptance fields");
  } else {
    check(results, "scorecard", "all_tasks_meet_acceptance_criteria",
      tasks, true, !failing,
      "every task met its declared acceptance criteria (passed, cost and latency within allowance, no safety violation)");
  }
  return scorecard;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: task_suite (skill method 1 + quality gate) ----
  boolCheck(results, "task_suite", "suite_versioned", manifest,
    ["suite", "versioned"],
    "quality gate: suite versioned, criteria written before running");
  boolCheck(results, "task_suite", "criteria_written_before_running", manifest,
    ["suite", "criteria_written_before_run"],
    "acceptance criteria written before the run, not after");
  boolCheck(results, "task_suite", "acceptance_criteria_defined_per_task", manifest,
    ["suite", "acceptance_criteria_per_task"],
    "golden tasks per capability with success definition, allowed cost, allowed latency, safety constraints");
  boolCheck(results, "task_suite", "suite_versioned_with_agent", manifest,
    ["suite", "versioned_with_agent"],
    "task suites versioned with the agent");

  // ---- Section 2: reproducible_runs (skill method 2) ----
  boolCheck(results, "reproducible_runs", "model_version_pinned", manifest,
    ["run", "model_version_pinned"], "pin model versions");
  boolCheck(results, "reproducible_runs", "sampling_settings_pinned", manifest,
    ["run", "sampling_settings_pinned"], "pin seeds/temperatures");
  boolCheck(results, "reproducible_runs", "tool_state_pinned", manifest,
    ["run", "tool_state_pinned"], "pin tool states");
  boolCheck(results, "reproducible_runs", "fixtures_pinned", manifest,
    ["run", "fixtures_pinned"], "pin fixtures");
  boolCheck(results, "reproducible_runs", "raw_transcripts_stored", manifest,
    ["run", "raw_transcripts_stored"], "store raw transcripts");
  boolCheck(results, "reproducible_runs", "same_suite_for_every_candidate", manifest,
    ["run", "same_suite_per_candidate"], "run the same suite per candidate");

  // ---- Section 3: judging (skill method 3 + red line) ----
  boolCheck(results, "judging", "deterministic_checks_first", manifest,
    ["judging", "deterministic_checks_first"],
    "deterministic checks first (did it do the thing?)");
  judgeConditional(results, "llm_judge_calibrated_against_human_labels",
    manifest, "judge_calibrated_against_human_labels",
    "LLM-judges only when calibrated against human labels");
  judgeConditional(results, "judge_blinded", manifest, "judge_blinded",
    "LLM judge blinded");
  judgeConditional(results, "position_bias_controls", manifest,
    "position_bias_controls", "position bias controls for LLM judges");
  const [itself, hasItself] = getPath(manifest, "judging", "model_judges_itself");
  const [calibrated, hasCalibrated] = getPath(
    manifest, "judging", "judge_calibrated_against_human_labels");
  if (hasItself && pyTruthy(itself)) {
    check(results, "judging", "no_uncalibrated_self_judging",
      calibrated, hasCalibrated, calibrated === true,
      "skill red line: the model under test never judges itself uncalibrated");
  } else {
    check(results, "judging", "no_uncalibrated_self_judging",
      itself, hasItself, true,
      "the model under test does not judge itself");
  }

  // ---- Section 4: regression_gates (skill method 4) ----
  boolCheck(results, "regression_gates", "eval_runs_before_merge", manifest,
    ["gates", "eval_runs_before_merge"],
    "eval suite runs before merging agent changes");
  boolCheck(results, "regression_gates", "regressions_block_merge", manifest,
    ["gates", "regressions_block_merge"],
    "regressions block until explained");
  boolCheck(results, "regression_gates", "accepted_tradeoffs_written", manifest,
    ["gates", "accepted_tradeoffs_written"],
    "accepted trade-offs are written, not vibes");

  // ---- Section 5: beyond_accuracy (skill method 5) ----
  boolCheck(results, "beyond_accuracy", "steps_to_completion_tracked", manifest,
    ["metrics", "steps_tracked"], "track steps-to-completion");
  boolCheck(results, "beyond_accuracy", "cost_tracked", manifest,
    ["metrics", "cost_tracked"], "track cost");
  boolCheck(results, "beyond_accuracy", "latency_tracked", manifest,
    ["metrics", "latency_tracked"], "track latency");
  boolCheck(results, "beyond_accuracy", "refusal_and_error_rates_tracked", manifest,
    ["metrics", "refusal_error_rates_tracked"], "track refusal/error rates");
  boolCheck(results, "beyond_accuracy", "safety_violations_tracked", manifest,
    ["metrics", "safety_violations_tracked"], "track safety violations");
  boolCheck(results, "beyond_accuracy", "silent_wrongness_tracked", manifest,
    ["metrics", "silent_wrongness_tracked"],
    "track silent wrongness (confident bad output)");

  // ---- Section 6: incident_replay (skill method 6) ----
  boolCheck(results, "incident_replay", "misbehavior_becomes_named_test_cases", manifest,
    ["incidents", "misbehavior_becomes_named_tests"],
    "every production misbehavior becomes a named test case");
  boolCheck(results, "incident_replay", "all_production_incidents_replayed", manifest,
    ["incidents", "all_production_incidents_replayed"],
    "incident replay: incidents turned into permanent regression tests");

  // ---- Section 7: scorecard (skill method 7) ----
  boolCheck(results, "scorecard", "scorecard_published_per_run", manifest,
    ["scorecard", "published_per_run"], "publish a compact scorecard per run");
  boolCheck(results, "scorecard", "scorecards_stored", manifest,
    ["scorecard", "stored"], "quality gate: scorecards stored");
  const scorecard = taskResultsCheck(results, manifest);

  // ---- Section 8: benchmark_hygiene (skill method 8) ----
  boolCheck(results, "benchmark_hygiene", "contamination_checked", manifest,
    ["hygiene", "contamination_checked"],
    "watch contamination (tasks leaking into training)");
  boolCheck(results, "benchmark_hygiene", "variance_reported", manifest,
    ["hygiene", "variance_reported"], "run N times, report spread");
  boolCheck(results, "benchmark_hygiene", "rebaselined_after_model_updates", manifest,
    ["hygiene", "rebaselined_after_model_updates"],
    "re-baseline after model updates");

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
    verdict = "NOT_TRUSTED";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "TRUSTED";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "agent-evaluation-scorecard",
    atom_version: "0.1.0",
    agent: manifest["agent"] ?? null,
    verdict,
    sections,
    checks: results,
    scorecard,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across eight sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "AGENT-EVALUATION SCORECARD",
    `agent: ${pyStr(verdict.agent ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(18)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
