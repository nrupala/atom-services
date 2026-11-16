// Append-only ledger design audit — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/append-only-ledger-design-audit/src/append_only_ledger_design_audit.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string are
// byte-identical to the Python output for the same input.

import { pyRepr, pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  ledger_name: "string",
  version: "string",
  append_only: {
    events_immutable: "boolean",
    update_on_posted_entries: "boolean",
    delete_on_posted_entries: "boolean",
    no_mutation_paths_verified: "boolean",
    correction_model: "string",
    corrections_reference_original: "boolean",
    retention_and_legal_holds: "boolean",
  },
  money: {
    moves_money: "boolean",
    double_entry: "boolean",
    transaction_sum_zero: "boolean",
    amount_representation: "string",
    currency_explicit_per_entry: "boolean",
    fx_rates_recorded_at_event_time: "boolean",
  },
  structure: {
    accounts_entries_transactions: "boolean",
    transactions_atomic: "boolean",
    stable_ids: "boolean",
    event_fields: ["string"],
  },
  derived_state: {
    balances_are_projections: "boolean",
    projections_recomputable: "boolean",
    checkpoint_hashes: "boolean",
  },
  reconciliation: {
    cadence: "string",
    discrepancy_workflow_recorded: "boolean",
    unreconciled_period_closed_silently: "boolean",
  },
  reporting: {
    audit_queries_who_what_when_why: "boolean",
    tax_ready_exports: "boolean",
  },
  security: {
    encryption_at_rest: "boolean",
    scoped_access: "boolean",
  },
  recovery: {
    restore_drill_done: "boolean",
    restore_replay_verified: "boolean",
  },
  tests: { balance_invariant_tests: "boolean" },
};

export const SECTIONS = [
  "append_only",
  "money_discipline",
  "structure_and_derivation",
  "reconciliation_and_reporting",
  "security_and_recovery",
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
  ledger_name: unknown;
  version: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  summary: string;
}

const CORRECTION_MODELS = [
  "reversing_entry",
  "adjusting_entry",
  "reversing_or_adjusting_entry",
];

const AMOUNT_REPRESENTATIONS = ["integer_minor_units", "exact_decimal"];

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Python truthiness for JSON-shaped values (not exported by the template).
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: append_only ----
  const [immutable, hasImm] = getPath(manifest, "append_only", "events_immutable");
  check(results, "append_only", "events_immutable", immutable, hasImm,
    immutable === true,
    "events are immutable (skill method 1: append-only by design)");

  const [update, hasUpdate] = getPath(manifest, "append_only", "update_on_posted_entries");
  check(results, "append_only", "no_update_on_posted_entries", update, hasUpdate,
    update === false,
    "skill red line: never edit history — no UPDATE on posted facts");

  const [del, hasDelete] = getPath(manifest, "append_only", "delete_on_posted_entries");
  check(results, "append_only", "no_delete_on_posted_entries", del, hasDelete,
    del === false, "no DELETE on posted facts (skill method 1)");

  const [verified, hasVerified] = getPath(manifest, "append_only", "no_mutation_paths_verified");
  check(results, "append_only", "no_mutation_code_paths_verified", verified, hasVerified,
    verified === true,
    "quality gate: no mutation code paths on posted entries (verified)");

  const [correctionModel, hasCm] = getPath(manifest, "append_only", "correction_model");
  check(results, "append_only", "corrections_are_new_reversing_or_adjusting_entries",
    correctionModel, hasCm,
    typeof correctionModel === "string" && CORRECTION_MODELS.includes(correctionModel),
    `correction_model=${pyRepr(correctionModel)} (skill: corrections are new reversing/adjusting entries)`);

  const [refs, hasRefs] = getPath(manifest, "append_only", "corrections_reference_original");
  check(results, "append_only", "corrections_reference_originals", refs, hasRefs,
    refs === true, "corrections reference the originals they reverse/adjust");

  const [retention, hasRet] = getPath(manifest, "append_only", "retention_and_legal_holds");
  check(results, "append_only", "retention_policy_and_legal_holds", retention, hasRet,
    retention === true, "retention per policy; legal holds respected");

  // ---- Section 2: money_discipline ----
  const [moves, hasMoves] = getPath(manifest, "money", "moves_money");
  const [doubleEntry, hasDouble] = getPath(manifest, "money", "double_entry");
  if (hasMoves && pyTruthy(moves)) {
    check(results, "money_discipline", "double_entry_when_money_moves",
      doubleEntry, hasDouble, doubleEntry === true,
      "double-entry for anything monetary (skill method 2)");
  } else {
    check(results, "money_discipline", "double_entry_when_money_moves",
      moves, hasMoves, true, "no monetary movement declared");
  }

  const [sumZero, hasSz] = getPath(manifest, "money", "transaction_sum_zero");
  check(results, "money_discipline", "per_transaction_sum_zero", sumZero, hasSz,
    sumZero === true, "double-entry invariant: sum = zero per transaction");

  const [representation, hasRepr] = getPath(manifest, "money", "amount_representation");
  check(results, "money_discipline", "no_float_money", representation, hasRepr,
    typeof representation === "string" && AMOUNT_REPRESENTATIONS.includes(representation),
    `amount_representation=${pyRepr(representation)} (skill red line: no float money — integer minor units or exact decimals)`);

  const [currency, hasCurrency] = getPath(manifest, "money", "currency_explicit_per_entry");
  check(results, "money_discipline", "currency_explicit_per_entry", currency, hasCurrency,
    currency === true, "currency explicit per entry");

  const [fx, hasFx] = getPath(manifest, "money", "fx_rates_recorded_at_event_time");
  check(results, "money_discipline", "fx_rates_recorded_at_event_time", fx, hasFx,
    fx === true, "FX rates recorded at event time");

  // ---- Section 3: structure_and_derivation ----
  const [hierarchy, hasHier] = getPath(manifest, "structure", "accounts_entries_transactions");
  check(results, "structure_and_derivation", "accounts_entries_transactions_hierarchy",
    hierarchy, hasHier, hierarchy === true,
    "structure: accounts -> entries -> transactions");

  const [atomic, hasAtomic] = getPath(manifest, "structure", "transactions_atomic");
  check(results, "structure_and_derivation", "transactions_are_atomic_groups",
    atomic, hasAtomic, atomic === true, "transactions are atomic groups of entries");

  const [stableIds, hasIds] = getPath(manifest, "structure", "stable_ids");
  check(results, "structure_and_derivation", "stable_ids", stableIds, hasIds,
    stableIds === true, "stable IDs for accounts, entries and transactions");

  const [eventFields, hasFields] = getPath(manifest, "structure", "event_fields");
  check(results, "structure_and_derivation", "every_event_carries_timestamp_actor_source",
    eventFields, hasFields,
    Array.isArray(eventFields) &&
      ["timestamp", "actor", "source"].every((f) => eventFields.includes(f)),
    `event_fields=${pyRepr(eventFields)} (skill: every event carries timestamp, actor, source)`);

  const [projections, hasProj] = getPath(manifest, "derived_state", "balances_are_projections");
  check(results, "structure_and_derivation", "balances_are_derived_projections",
    projections, hasProj, projections === true,
    "balances and reports are projections — never authoritative over the log");

  const [recomputable, hasRecomp] = getPath(manifest, "derived_state", "projections_recomputable");
  check(results, "structure_and_derivation", "projections_recomputable",
    recomputable, hasRecomp, recomputable === true,
    "projections are recomputable and checkpointed");

  const [checkpoint, hasCp] = getPath(manifest, "derived_state", "checkpoint_hashes");
  check(results, "structure_and_derivation", "checkpoint_hashes_for_tamper_evidence",
    checkpoint, hasCp, checkpoint === true,
    "periodic checkpoint hashes for tamper evidence");

  // ---- Section 4: reconciliation_and_reporting ----
  const [cadence, hasCadence] = getPath(manifest, "reconciliation", "cadence");
  check(results, "reconciliation_and_reporting", "reconciliation_cadence_defined",
    cadence, hasCadence,
    typeof cadence === "string" && cadence.trim().length > 0,
    `cadence=${pyRepr(cadence)} (ledger vs bank/processor/external statements on a cadence)`);

  const [workflow, hasWf] = getPath(manifest, "reconciliation", "discrepancy_workflow_recorded");
  check(results, "reconciliation_and_reporting", "discrepancy_workflow_with_resolution_records",
    workflow, hasWf, workflow === true,
    "discrepancies get a workflow: found -> investigated -> resolved with record");

  const [silent, hasSilent] = getPath(manifest, "reconciliation", "unreconciled_period_closed_silently");
  check(results, "reconciliation_and_reporting", "no_unreconciled_period_closed_silently",
    silent, hasSilent, silent === false,
    "skill red line: never close an unreconciled period silently");

  const [auditQ, hasAq] = getPath(manifest, "reporting", "audit_queries_who_what_when_why");
  check(results, "reconciliation_and_reporting", "audit_queries_answer_who_what_when_why",
    auditQ, hasAq, auditQ === true,
    "audit queries answer who changed what, when, why; period summaries produced");

  const [tax, hasTax] = getPath(manifest, "reporting", "tax_ready_exports");
  check(results, "reconciliation_and_reporting", "tax_ready_exports", tax, hasTax,
    tax === true, "tax-ready exports for the accountant");

  // ---- Section 5: security_and_recovery ----
  const [encryption, hasEnc] = getPath(manifest, "security", "encryption_at_rest");
  check(results, "security_and_recovery", "encryption_at_rest", encryption, hasEnc,
    encryption === true, "encryption at rest");

  const [scoped, hasScoped] = getPath(manifest, "security", "scoped_access");
  check(results, "security_and_recovery", "scoped_access", scoped, hasScoped,
    scoped === true, "scoped access");

  const [drill, hasDrill] = getPath(manifest, "recovery", "restore_drill_done");
  check(results, "security_and_recovery", "restore_drill_done", drill, hasDrill,
    drill === true, "quality gate: restore drill done; backups restore-tested");

  const [replay, hasReplay] = getPath(manifest, "recovery", "restore_replay_verified");
  check(results, "security_and_recovery", "restore_replays_log_and_verifies_invariants",
    replay, hasReplay, replay === true,
    "restore = replay the log and verify invariants");

  const [invariantTests, hasIt] = getPath(manifest, "tests", "balance_invariant_tests");
  check(results, "security_and_recovery", "balance_invariant_tests_in_suite",
    invariantTests, hasIt, invariantTests === true,
    "quality gate: balance invariant tests in the suite (sums, double-entry)");

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
    verdict = "UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "append-only-ledger-design-audit",
    atom_version: "0.1.0",
    ledger_name: manifest["ledger_name"] ?? null,
    version: manifest["version"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "APPEND-ONLY LEDGER DESIGN AUDIT",
    `ledger_name: ${pyStr(verdict.ledger_name ?? null)}  version: ${pyStr(verdict.version ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
