// CI/CD pipeline design — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/cicd-pipeline-design/src/cicd_pipeline_design.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts use the shared
// fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals; computed comparisons compare the fixed-6dp
// difference to zero. This atom validates a declared CI/CD
// pipeline artifact; it designs no pipeline and exercises no
// DevOps judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the stage-name entries) are validated as
// strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  pipeline: {
    stages: [{
      name: "string",
      minutes: "number",
    }],
    declared_total_minutes: "number",
    fails_fast: "boolean",
    reports_first_real_cause: "boolean",
    is_primary_green_gate: "boolean",
  },
  determinism: {
    lockfile_enforced_installs: "boolean",
    tool_versions_pinned: "boolean",
    byte_exact_checkouts_where_hashes_matter: "boolean",
    same_commit_same_artifact_verified: "boolean",
    third_party_actions_pinned: "boolean",
    unpinned_third_party_actions_present: "boolean",
  },
  caching: {
    dependency_cache_keyed_on_lockfile: "boolean",
    build_cache_keyed_on_lockfile: "boolean",
    secrets_cached: "boolean",
    test_fixtures_cached: "boolean",
  },
  secrets: {
    from_secret_store_only: "boolean",
    masked_in_logs: "boolean",
    in_artifacts: "boolean",
    error_output_scrubbed: "boolean",
    appeared_in_logs_or_artifacts: "boolean",
  },
  budget: {
    estimated_minutes_per_run: "number",
    runs_per_month: "number",
    declared_monthly_minutes: "number",
    monthly_minutes_budget: "number",
    workflows_minimal_where_constrained: "boolean",
    heavy_builds_on_owned_hardware: "boolean",
    duplicates_primary_gate: "boolean",
  },
  provenance: {
    checksums_published: "boolean",
    releases_signed: "boolean",
    build_outputs_retained: "boolean",
    manifest_hashes_retained: "boolean",
    release_artifacts_carry_hash_and_signature: "boolean",
  },
  deploys: {
    hitl_approval_required: "boolean",
    rollback_path_present: "boolean",
    direct_to_prod_from_laptop: "boolean",
  },
  gates: {
    disabled_to_unblock_merge: "boolean",
    overrides_logged_with_reason: "boolean",
  },
};

export const SECTIONS = [
  "stages_and_fail_fast",
  "determinism_and_pinning",
  "caching_and_secrets",
  "budget_awareness",
  "provenance_and_signing",
  "deploys_and_gates",
] as const;

export const STATED_STAGES = [
  "lint",
  "typecheck",
  "test",
  "build",
  "package_sign",
  "publish",
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
  stages_evaluated: number;
  computed_total_minutes: string | null;
  total_minutes_difference: string | null;
  stated_stages_not_declared: string[] | null;
  computed_monthly_minutes: string | null;
  monthly_minutes_difference: string | null;
  budget_headroom_minutes: string | null;
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

function isNonemptyStr(value: unknown): boolean {
  return typeof value === "string" && value.length > 0;
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

interface StageComputed {
  stagesEvaluated: number;
  computedTotal: number | null;
  totalDifference: number | null;
  notDeclared: string[] | null;
}

function stageChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): StageComputed {
  const [stages, hasStages] = getPath(manifest, "pipeline", "stages");
  const [declaredTotal, hasTotal] = getPath(
    manifest, "pipeline", "declared_total_minutes");
  if (!hasStages || !Array.isArray(stages) || stages.length === 0) {
    for (const [name, evidence] of [
      ["stage_entries_complete", "no pipeline stages declared"],
      ["stage_order_matches_stated_sequence",
       "no pipeline stages declared"],
      ["total_minutes_matches_sum_of_stage_minutes",
       "no pipeline stages declared"],
    ] as const) {
      check(results, "stages_and_fail_fast", name,
        stages, false, false, evidence);
    }
    return {
      stagesEvaluated: 0, computedTotal: null,
      totalDifference: null, notDeclared: null,
    };
  }
  let nameIncomplete = false;
  let minutesIncomplete = false;
  let evaluated = 0;
  const names: string[] = [];
  let total = 0;
  for (const entry of stages as unknown[]) {
    if (!isPyDict(entry)) {
      nameIncomplete = true;
      minutesIncomplete = true;
      continue;
    }
    const [name, hasName] = getEntry(entry, "name");
    const [minutes, hasMinutes] = getEntry(entry, "minutes");
    if (!(hasName && isNonemptyStr(name))) {
      nameIncomplete = true;
    } else {
      names.push(name as string);
    }
    if (!(hasMinutes && isNumber(minutes))) {
      minutesIncomplete = true;
    } else {
      total += minutes as number;
    }
    if (hasName && hasMinutes && isNonemptyStr(name) &&
        isNumber(minutes)) {
      evaluated += 1;
    }
  }
  const incomplete = nameIncomplete || minutesIncomplete;
  if (incomplete) {
    check(results, "stages_and_fail_fast", "stage_entries_complete",
      stages, false, false,
      "a stage entry is missing its name or minutes");
  } else {
    check(results, "stages_and_fail_fast", "stage_entries_complete",
      stages, true, true,
      "every stage entry carries a non-empty name and numeric minutes");
  }
  let notDeclared: string[] | null;
  if (nameIncomplete) {
    check(results, "stages_and_fail_fast",
      "stage_order_matches_stated_sequence",
      stages, false, false,
      "a stage entry carries no usable name, so the declared sequence cannot be compared with the stated sequence");
    notDeclared = null;
  } else {
    notDeclared = STATED_STAGES.filter((s) => !names.includes(s));
    check(results, "stages_and_fail_fast",
      "stage_order_matches_stated_sequence",
      stages, true,
      JSON.stringify(names) === JSON.stringify(STATED_STAGES),
      "method step 1: the declared stage names equal the stated sequence in order — lint, typecheck, test, build, package/sign, publish (cheapest first)");
  }
  let computedTotal: number | null = null;
  let difference: number | null = null;
  if (minutesIncomplete || !hasTotal || !isNumber(declaredTotal)) {
    check(results, "stages_and_fail_fast",
      "total_minutes_matches_sum_of_stage_minutes",
      stages, false, false,
      "the declared total minutes or a stage's minutes are missing, so the total cannot be re-derived");
  } else {
    computedTotal = total;
    difference = (declaredTotal as number) - total;
    check(results, "stages_and_fail_fast",
      "total_minutes_matches_sum_of_stage_minutes",
      stages, true, fmt6(difference) === "0.000000",
      "the declared total pipeline minutes equal the sum of the declared per-stage minutes");
  }
  return {
    stagesEvaluated: evaluated, computedTotal,
    totalDifference: difference, notDeclared,
  };
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: stages_and_fail_fast ----
  const { stagesEvaluated, computedTotal, totalDifference,
    notDeclared } = stageChecks(results, manifest);
  boolCheck(results, "stages_and_fail_fast", "pipeline_fails_fast",
    manifest, ["pipeline", "fails_fast"],
    "quality gate: the pipeline fails fast — the cheapest stages run first and stop the run on the first failure");
  boolCheck(results, "stages_and_fail_fast", "first_real_cause_reported",
    manifest, ["pipeline", "reports_first_real_cause"],
    "quality gate: the pipeline reports the first real cause of a failure");
  boolCheck(results, "stages_and_fail_fast",
    "pipeline_is_primary_green_gate",
    manifest, ["pipeline", "is_primary_green_gate"],
    "the pipeline is the primary green gate — humans approve deploys, the pipeline gates the merge");

  // ---- Section 2: determinism_and_pinning ----
  boolCheck(results, "determinism_and_pinning",
    "lockfile_enforced_installs",
    manifest, ["determinism", "lockfile_enforced_installs"],
    "method step 2: installs are lockfile-enforced (frozen-lockfile)");
  boolCheck(results, "determinism_and_pinning", "tool_versions_pinned",
    manifest, ["determinism", "tool_versions_pinned"],
    "method step 2: tool versions are pinned");
  boolCheck(results, "determinism_and_pinning",
    "byte_exact_checkouts_where_hashes_matter",
    manifest, ["determinism", "byte_exact_checkouts_where_hashes_matter"],
    "method step 2: checkouts are byte-exact where hashes matter");
  boolCheck(results, "determinism_and_pinning",
    "same_commit_produces_same_artifact",
    manifest, ["determinism", "same_commit_same_artifact_verified"],
    "quality gate: the same commit produces the same artifact — determinism is verified, not assumed");
  boolCheck(results, "determinism_and_pinning",
    "third_party_actions_pinned",
    manifest, ["determinism", "third_party_actions_pinned"],
    "red line: third-party actions are pinned to versions");
  falseCheck(results, "determinism_and_pinning",
    "no_unpinned_third_party_actions",
    manifest, ["determinism", "unpinned_third_party_actions_present"],
    "red line: no unpinned third-party actions are present in the pipeline");

  // ---- Section 3: caching_and_secrets ----
  boolCheck(results, "caching_and_secrets",
    "dependency_cache_keyed_on_lockfile",
    manifest, ["caching", "dependency_cache_keyed_on_lockfile"],
    "method step 3: the dependency cache is keyed on the lockfile");
  boolCheck(results, "caching_and_secrets",
    "build_cache_keyed_on_lockfile",
    manifest, ["caching", "build_cache_keyed_on_lockfile"],
    "method step 3: the build cache is keyed on the lockfile");
  falseCheck(results, "caching_and_secrets", "secrets_not_cached",
    manifest, ["caching", "secrets_cached"],
    "method step 3: secrets are never cached");
  falseCheck(results, "caching_and_secrets", "test_fixtures_not_cached",
    manifest, ["caching", "test_fixtures_cached"],
    "method step 3: test fixtures are never cached");
  boolCheck(results, "caching_and_secrets",
    "secrets_from_secret_store_only",
    manifest, ["secrets", "from_secret_store_only"],
    "method step 4: secrets come from the secret store only");
  boolCheck(results, "caching_and_secrets", "secrets_masked_in_logs",
    manifest, ["secrets", "masked_in_logs"],
    "method step 4: secrets are masked in logs");
  falseCheck(results, "caching_and_secrets", "secrets_never_in_artifacts",
    manifest, ["secrets", "in_artifacts"],
    "method step 4: secrets never appear in artifacts");
  boolCheck(results, "caching_and_secrets", "error_output_scrubbed",
    manifest, ["secrets", "error_output_scrubbed"],
    "method step 4: error output is scrubbed of secrets");
  falseCheck(results, "caching_and_secrets",
    "no_secret_appeared_in_logs_or_artifacts",
    manifest, ["secrets", "appeared_in_logs_or_artifacts"],
    "quality gate: no secret ever appears in logs or artifacts");

  // ---- Section 4: budget_awareness ----
  const [perRun, hasPerRun] = getPath(
    manifest, "budget", "estimated_minutes_per_run");
  const [runs, hasRuns] = getPath(manifest, "budget", "runs_per_month");
  const [declaredMonthly, hasDeclaredMonthly] = getPath(
    manifest, "budget", "declared_monthly_minutes");
  const [budgetCap, hasBudgetCap] = getPath(
    manifest, "budget", "monthly_minutes_budget");
  const monthlyAllNumbers = hasPerRun && hasRuns && hasDeclaredMonthly &&
    isNumber(perRun) && isNumber(runs) && isNumber(declaredMonthly);
  const computedMonthly: number | null =
    hasPerRun && hasRuns && isNumber(perRun) && isNumber(runs)
      ? (perRun as number) * (runs as number)
      : null;
  const monthlyDifference: number | null =
    computedMonthly !== null && hasDeclaredMonthly &&
      isNumber(declaredMonthly)
      ? (declaredMonthly as number) - computedMonthly
      : null;
  const monthlyConsistent = monthlyAllNumbers &&
    fmt6((declaredMonthly as number) -
      (perRun as number) * (runs as number)) === "0.000000";
  check(results, "budget_awareness",
    "monthly_minutes_matches_per_run_times_runs",
    declaredMonthly, monthlyAllNumbers, monthlyConsistent,
    "method step 5: the declared monthly minutes equal the declared estimated minutes per run multiplied by the declared runs per month");
  const budgetPresent = computedMonthly !== null && hasBudgetCap &&
    isNumber(budgetCap);
  const headroom: number | null = budgetPresent
    ? (budgetCap as number) - (computedMonthly as number)
    : null;
  check(results, "budget_awareness",
    "monthly_minutes_within_declared_budget",
    budgetCap, budgetPresent,
    budgetPresent && (computedMonthly as number) <= (budgetCap as number),
    "method step 5: the re-derived monthly minutes do not exceed the monthly minutes budget the caller itself declares (the skill states no budget number, so none is imposed here)");
  boolCheck(results, "budget_awareness",
    "workflows_minimal_where_minutes_constrained",
    manifest, ["budget", "workflows_minimal_where_constrained"],
    "method step 5: workflows are kept minimal where minutes are constrained");
  boolCheck(results, "budget_awareness",
    "heavy_builds_on_owned_hardware",
    manifest, ["budget", "heavy_builds_on_owned_hardware"],
    "method step 5: heavy builds run on owned hardware");
  falseCheck(results, "budget_awareness",
    "pipeline_does_not_duplicate_primary_gate",
    manifest, ["budget", "duplicates_primary_gate"],
    "method step 5: the pipeline does not duplicate the primary gate");

  // ---- Section 5: provenance_and_signing ----
  boolCheck(results, "provenance_and_signing",
    "artifact_checksums_published",
    manifest, ["provenance", "checksums_published"],
    "method step 6: artifacts are published with checksums");
  boolCheck(results, "provenance_and_signing", "releases_signed",
    manifest, ["provenance", "releases_signed"],
    "method step 6: releases are signed");
  boolCheck(results, "provenance_and_signing", "build_outputs_retained",
    manifest, ["provenance", "build_outputs_retained"],
    "method step 6: build outputs are kept");
  boolCheck(results, "provenance_and_signing",
    "manifest_hashes_retained",
    manifest, ["provenance", "manifest_hashes_retained"],
    "method step 6: manifest hashes are kept alongside the build outputs");
  boolCheck(results, "provenance_and_signing",
    "release_artifacts_carry_hash_and_signature",
    manifest, ["provenance", "release_artifacts_carry_hash_and_signature"],
    "quality gate: release artifacts carry hash + signature");

  // ---- Section 6: deploys_and_gates ----
  boolCheck(results, "deploys_and_gates", "hitl_approval_for_deploys",
    manifest, ["deploys", "hitl_approval_required"],
    "method step 7: deploys require HITL approval — humans approve deploys");
  boolCheck(results, "deploys_and_gates", "rollback_path_present",
    manifest, ["deploys", "rollback_path_present"],
    "method step 7: a rollback path always exists");
  falseCheck(results, "deploys_and_gates",
    "never_direct_to_prod_from_laptop",
    manifest, ["deploys", "direct_to_prod_from_laptop"],
    "method step 7: never direct-to-prod from a laptop");
  falseCheck(results, "deploys_and_gates",
    "gates_not_disabled_to_unblock_merge",
    manifest, ["gates", "disabled_to_unblock_merge"],
    "red line: gates are not disabled to unblock a merge");
  boolCheck(results, "deploys_and_gates",
    "gate_overrides_logged_with_reason",
    manifest, ["gates", "overrides_logged_with_reason"],
    "red line: a conscious gate override is logged with its reason");

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
    verdict = "CICD_PIPELINE_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CICD_PIPELINE_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "stage_entries_complete" ||
      r.check === "stage_order_matches_stated_sequence" ||
      r.check === "total_minutes_matches_sum_of_stage_minutes" ||
      r.check === "monthly_minutes_matches_per_run_times_runs" ||
      r.check === "monthly_minutes_within_declared_budget")
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
    service: "cicd-pipeline-design",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    stages_evaluated: stagesEvaluated,
    computed_total_minutes: fmt6(computedTotal),
    total_minutes_difference: fmt6(totalDifference),
    stated_stages_not_declared: notDeclared,
    computed_monthly_minutes: fmt6(computedMonthly),
    monthly_minutes_difference: fmt6(monthlyDifference),
    budget_headroom_minutes: fmt6(headroom),
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CI/CD PIPELINE DESIGN",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
