// Backend engineering advice — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/backend-engineering-advice/src/backend_engineering_advice.py
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
  system: "string",
  contract: {
    defined_before_code: "boolean",
    inputs_defined: "boolean",
    outputs_defined: "boolean",
    errors_defined: "boolean",
    versioned: "boolean",
    kept_in_repo: "boolean",
  },
  validation: {
    at_boundaries: "boolean",
    rejects_bad_input_early_with_specific_errors: "boolean",
    clients_trusted: "boolean",
  },
  idempotency: {
    mutating_operation_count: "number",
    keys_on_mutating_operations: "boolean",
    double_sends_possible: "boolean",
    double_charges_possible: "boolean",
    behavior_verified: "boolean",
  },
  errors: {
    taxonomy_structured: "boolean",
    taxonomy_consistent: "boolean",
    categories_covered: ["string"],
    validation_and_error_paths_tested: "boolean",
    silent_catch_all_present: "boolean",
  },
  jobs: {
    has_async_jobs: "boolean",
    retries_with_backoff_and_jitter: "boolean",
    dead_letter_path_present: "boolean",
    work_can_be_lost: "boolean",
    status_observable: "boolean",
  },
  data: {
    has_migrations: "boolean",
    migrations_reversible: "boolean",
    migrations_backed_up: "boolean",
    migrations_reviewed_before_live_data: "boolean",
    constraints_enforced_in_database: "boolean",
    plaintext_secrets_at_rest: "boolean",
    direct_to_prod_changes: "boolean",
  },
  observability: {
    structured_logs_with_ids_and_timings: "boolean",
    metrics_at_edges: "boolean",
    trace_ids_propagated: "boolean",
    secrets_in_logs: "boolean",
    pii_in_logs: "boolean",
  },
};

export const SECTIONS = [
  "contract_first",
  "boundary_validation",
  "idempotency",
  "error_taxonomy",
  "jobs_and_queues",
  "data_safety",
  "observability",
] as const;

export const STATED_ERROR_CATEGORIES = [
  "validation",
  "not_found",
  "conflict",
  "retryable",
  "fatal",
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
  system: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  taxonomy_categories_missing: string[] | null;
  mutating_operation_count: number | null;
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
  if (!hasGate) {
    check(results, section, name, gate, false, false, evidence);
  } else if (gate === false) {
    check(results, section, name, gate, true, true, naEvidence);
  } else {
    check(results, section, name, value, present, value === true, evidence);
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
  if (!hasGate) {
    check(results, section, name, gate, false, false, evidence);
  } else if (gate === false) {
    check(results, section, name, gate, true, true, naEvidence);
  } else {
    check(results, section, name, value, present, value === false, evidence);
  }
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: contract_first ----
  boolCheck(results, "contract_first", "contract_defined_before_code",
    manifest, ["contract", "defined_before_code"],
    "contract first: endpoints/queues are defined before code");
  boolCheck(results, "contract_first", "contract_inputs_defined",
    manifest, ["contract", "inputs_defined"],
    "contract first: the contract defines inputs");
  boolCheck(results, "contract_first", "contract_outputs_defined",
    manifest, ["contract", "outputs_defined"],
    "contract first: the contract defines outputs");
  boolCheck(results, "contract_first", "contract_errors_defined",
    manifest, ["contract", "errors_defined"],
    "contract first: the contract defines errors");
  boolCheck(results, "contract_first", "contract_versioned",
    manifest, ["contract", "versioned"],
    "quality gate: the contract is documented and versioned");
  boolCheck(results, "contract_first", "contracts_kept_in_repo",
    manifest, ["contract", "kept_in_repo"],
    "contract first: contracts are kept in the repo");

  // ---- Section 2: boundary_validation ----
  boolCheck(results, "boundary_validation", "validation_at_boundaries",
    manifest, ["validation", "at_boundaries"],
    "validate at boundaries: every boundary validates its input");
  boolCheck(results, "boundary_validation",
    "bad_input_rejected_early_with_specific_errors",
    manifest,
    ["validation", "rejects_bad_input_early_with_specific_errors"],
    "validate at boundaries: bad input is rejected early with specific errors");
  falseCheck(results, "boundary_validation", "clients_not_trusted",
    manifest, ["validation", "clients_trusted"],
    "validate at boundaries: clients are never trusted (including the caller's own frontend)");

  // ---- Section 3: idempotency ----
  const [count, hasCount] = getPath(
    manifest, "idempotency", "mutating_operation_count");
  const [keys, hasKeys] = getPath(
    manifest, "idempotency", "keys_on_mutating_operations");
  if (!hasCount) {
    check(results, "idempotency",
      "idempotency_keys_on_mutating_operations",
      count, false, false,
      "idempotency: mutating operations carry idempotency keys, so retries are safe");
  } else if ((count as number) <= 0) {
    check(results, "idempotency",
      "idempotency_keys_on_mutating_operations",
      count, true, true,
      "no mutating operations declared");
  } else {
    check(results, "idempotency",
      "idempotency_keys_on_mutating_operations",
      keys, hasKeys, keys === true,
      "idempotency: mutating operations carry idempotency keys, so retries are safe");
  }
  falseCheck(results, "idempotency", "no_double_sends",
    manifest, ["idempotency", "double_sends_possible"],
    "idempotency: retries cannot double-send");
  falseCheck(results, "idempotency", "no_double_charges",
    manifest, ["idempotency", "double_charges_possible"],
    "idempotency: retries cannot double-charge");
  boolCheck(results, "idempotency",
    "retry_idempotency_behavior_verified",
    manifest, ["idempotency", "behavior_verified"],
    "quality gate: retry/idempotency behavior is verified");

  // ---- Section 4: error_taxonomy ----
  boolCheck(results, "error_taxonomy", "error_taxonomy_structured",
    manifest, ["errors", "taxonomy_structured"],
    "error taxonomy: errors are structured");
  boolCheck(results, "error_taxonomy", "error_taxonomy_consistent",
    manifest, ["errors", "taxonomy_consistent"],
    "error taxonomy: errors are consistent across the service");
  const [covered, hasCovered] = getPath(
    manifest, "errors", "categories_covered");
  const coveredIsList = hasCovered && Array.isArray(covered);
  const missingCategories: string[] | null = coveredIsList
    ? STATED_ERROR_CATEGORIES.filter(
        (c) => !(covered as unknown[]).includes(c))
    : null;
  check(results, "error_taxonomy",
    "taxonomy_covers_all_stated_categories", covered,
    coveredIsList,
    coveredIsList && (missingCategories as string[]).length === 0,
    "error taxonomy: the taxonomy covers every category the skill names — validation, not-found, conflict, retryable, fatal");
  boolCheck(results, "error_taxonomy",
    "validation_and_error_paths_tested",
    manifest, ["errors", "validation_and_error_paths_tested"],
    "quality gate: validation and error paths are tested (not just the happy path)");
  falseCheck(results, "error_taxonomy", "no_silent_catch_all",
    manifest, ["errors", "silent_catch_all_present"],
    "red line: no silent catch-all — failing loudly beats corrupting quietly");

  // ---- Section 5: jobs_and_queues ----
  gatedBoolCheck(results, "jobs_and_queues",
    "job_retries_with_backoff_and_jitter",
    manifest, ["jobs", "has_async_jobs"],
    ["jobs", "retries_with_backoff_and_jitter"],
    "jobs and queues: job retries use backoff with jitter",
    "no async jobs declared");
  gatedBoolCheck(results, "jobs_and_queues", "dead_letter_path_present",
    manifest, ["jobs", "has_async_jobs"],
    ["jobs", "dead_letter_path_present"],
    "jobs and queues: a dead-letter path exists for failed jobs",
    "no async jobs declared");
  gatedFalseCheck(results, "jobs_and_queues", "no_lost_work",
    manifest, ["jobs", "has_async_jobs"],
    ["jobs", "work_can_be_lost"],
    "jobs and queues: no work is lost",
    "no async jobs declared");
  gatedBoolCheck(results, "jobs_and_queues", "job_status_observable",
    manifest, ["jobs", "has_async_jobs"],
    ["jobs", "status_observable"],
    "jobs and queues: job status is observable",
    "no async jobs declared");

  // ---- Section 6: data_safety ----
  const [gate, hasGate] = getPath(manifest, "data", "has_migrations");
  const [rev, hasRev] = getPath(manifest, "data", "migrations_reversible");
  const [backed, hasBacked] = getPath(
    manifest, "data", "migrations_backed_up");
  if (!hasGate) {
    check(results, "data_safety", "migrations_reversible_or_backed_up",
      gate, false, false,
      "data: migrations are reversible or backed-up");
  } else if (gate === false) {
    check(results, "data_safety", "migrations_reversible_or_backed_up",
      gate, true, true,
      "no migrations declared");
  } else if (!hasRev && !hasBacked) {
    check(results, "data_safety", "migrations_reversible_or_backed_up",
      rev, false, false,
      "data: migrations are reversible or backed-up");
  } else {
    check(results, "data_safety", "migrations_reversible_or_backed_up",
      hasRev ? rev : backed, true,
      rev === true || backed === true,
      "data: migrations are reversible or backed-up");
  }
  gatedBoolCheck(results, "data_safety",
    "migrations_reviewed_before_live_data",
    manifest, ["data", "has_migrations"],
    ["data", "migrations_reviewed_before_live_data"],
    "red line: migrations are reviewed before they run on live data",
    "no migrations declared");
  boolCheck(results, "data_safety", "constraints_enforced_in_database",
    manifest, ["data", "constraints_enforced_in_database"],
    "data: constraints are enforced in the database, not just the app");
  falseCheck(results, "data_safety", "no_plaintext_secrets_at_rest",
    manifest, ["data", "plaintext_secrets_at_rest"],
    "data: no plaintext secrets at rest");
  falseCheck(results, "data_safety", "no_direct_to_prod_changes",
    manifest, ["data", "direct_to_prod_changes"],
    "red line: no direct-to-prod changes");

  // ---- Section 7: observability ----
  boolCheck(results, "observability",
    "structured_logs_with_ids_and_timings",
    manifest, ["observability", "structured_logs_with_ids_and_timings"],
    "observability: structured logs carry ids and timings");
  boolCheck(results, "observability", "metrics_at_edges",
    manifest, ["observability", "metrics_at_edges"],
    "observability: metrics are emitted at the edges");
  boolCheck(results, "observability", "trace_ids_propagated",
    manifest, ["observability", "trace_ids_propagated"],
    "observability: trace ids are propagated");
  falseCheck(results, "observability", "no_secrets_in_logs",
    manifest, ["observability", "secrets_in_logs"],
    "quality gate: no secrets in logs");
  falseCheck(results, "observability", "no_pii_in_logs",
    manifest, ["observability", "pii_in_logs"],
    "quality gate: no PII in logs");

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
    verdict = "NOT_PRODUCTION_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PRODUCTION_READY";
  }

  const computedStatuses = results
    .filter((r) => r.check === "taxonomy_covers_all_stated_categories" ||
      r.check === "migrations_reversible_or_backed_up")
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
    service: "backend-engineering-advice",
    atom_version: "0.1.0",
    system: manifest["system"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    taxonomy_categories_missing: missingCategories,
    mutating_operation_count: hasCount ? (count as number) : null,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "BACKEND ENGINEERING ADVICE",
    `system: ${pyStr(verdict.system ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(24)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
