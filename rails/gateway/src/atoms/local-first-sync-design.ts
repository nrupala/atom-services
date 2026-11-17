// Local-first sync design — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/local-first-sync-design/src/local_first_sync_design.py
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
  app: "string",
  local_truth: {
    device_store_authoritative: "boolean",
    server_is_relay_and_backup_not_gate: "boolean",
    core_flows_designed_airplane_mode_first: "boolean",
    core_flows_work_fully_offline: "boolean",
    sync_resumes_cleanly_after_long_offline: "boolean",
  },
  data_model: {
    mergeable_state_uses_crdt_or_ot: "boolean",
    tombstones_declared: "boolean",
    compaction_policy_declared: "boolean",
  },
  entities: [{
    name: "string",
    per_field_merge_semantics_declared: "boolean",
    stable_id_declared: "boolean",
    is_user_prose: "boolean",
    silent_last_write_wins_present: "boolean",
  }],
  sync_protocol: {
    delta_sync_declared: "boolean",
    causal_ordering_declared: "boolean",
    resumability_declared: "boolean",
    bandwidth_budgets_declared: "boolean",
    store_and_forward_for_intermittent_peers: "boolean",
    vector_clocks_or_version_vectors_declared: "boolean",
  },
  encryption: {
    e2ee_before_upload: "boolean",
    keys_never_leave_devices: "boolean",
    per_device_keys_declared: "boolean",
    key_hierarchy_declared: "boolean",
    key_recovery_ux_tested_like_a_feature: "boolean",
    key_recovery_exercised_end_to_end: "boolean",
    e2ee_verified: "boolean",
  },
  personal_data_sync: {
    personal_data_synced: "boolean",
    personal_data_encrypted_before_sync: "boolean",
  },
  conflicts: {
    automatic_merge_for_text_and_counters: "boolean",
    explicit_ui_only_for_semantic_conflicts: "boolean",
    silent_data_loss_present: "boolean",
    silent_last_write_wins_on_user_prose_present: "boolean",
  },
  state_ui: {
    offline_state_shown: "boolean",
    queued_state_shown: "boolean",
    syncing_state_shown: "boolean",
    synced_state_shown: "boolean",
    conflict_state_shown: "boolean",
    export_escape_hatch_present: "boolean",
    import_escape_hatch_present: "boolean",
    sync_diagnostics_present: "boolean",
    sync_badge_claimed: "boolean",
  },
  testing: {
    chaos_offline_scenario_tested: "boolean",
    chaos_clock_skew_scenario_tested: "boolean",
    chaos_concurrent_edits_scenario_tested: "boolean",
    chaos_device_loss_scenario_tested: "boolean",
    merge_invariants_property_tested: "boolean",
    export_import_tested_on_real_data_volumes: "boolean",
    real_device_matrix_tested: "boolean",
    multi_device_round_trip_tests_passed: "boolean",
  },
};

export const SECTIONS = [
  "local_truth_and_data_model",
  "sync_protocol",
  "encryption_and_keys",
  "conflicts_and_state_ui",
  "testing_and_quality_gates",
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
  app: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  entities_count: number | null;
  entities_without_merge_semantics: string[] | null;
  merge_semantics_coverage: string | null;
  entities_without_stable_id: string[] | null;
  stable_id_coverage: string | null;
  prose_entities_with_silent_last_write_wins: string[] | null;
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

  const [entitiesRaw, hasEntities] = getPath(manifest, "entities");
  const entitiesIsList = hasEntities && Array.isArray(entitiesRaw);
  const rows: unknown[] = entitiesIsList ? (entitiesRaw as unknown[]) : [];
  const entitiesCount: number | null = entitiesIsList ? rows.length : null;

  const entitiesWithoutMergeSemantics: string[] | null = entitiesIsList
    ? rows.filter((c) => hasField(c, "per_field_merge_semantics_declared") &&
        (c as Record<string, unknown>)["per_field_merge_semantics_declared"] !== true)
        .map(rowName)
    : null;
  const entitiesWithoutStableId: string[] | null = entitiesIsList
    ? rows.filter((c) => hasField(c, "stable_id_declared") &&
        (c as Record<string, unknown>)["stable_id_declared"] !== true)
        .map(rowName)
    : null;
  const proseRows = rows.filter(
    (c) => isPyDict(c) && c["is_user_prose"] === true);
  const proseEntitiesWithSilentLww: string[] | null = entitiesIsList
    ? proseRows.filter((c) => isPyDict(c) &&
        c["silent_last_write_wins_present"] === true).map(rowName)
    : null;
  const mergeSemanticsCoverage: number | null =
    entitiesIsList && entitiesCount !== null && entitiesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["per_field_merge_semantics_declared"] === true).length / entitiesCount
      : null;
  const stableIdCoverage: number | null =
    entitiesIsList && entitiesCount !== null && entitiesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["stable_id_declared"] === true).length / entitiesCount
      : null;

  // ---- Section 1: local_truth_and_data_model ----
  boolCheck(results, "local_truth_and_data_model",
    "device_store_authoritative", manifest,
    ["local_truth", "device_store_authoritative"],
    "local truth: the device store (IndexedDB/SQLite) is authoritative");
  boolCheck(results, "local_truth_and_data_model",
    "server_is_relay_and_backup_not_gate", manifest,
    ["local_truth", "server_is_relay_and_backup_not_gate"],
    "local truth: the server is a relay + backup, not a gate");
  boolCheck(results, "local_truth_and_data_model",
    "core_flows_designed_airplane_mode_first", manifest,
    ["local_truth", "core_flows_designed_airplane_mode_first"],
    "local truth: flows are designed airplane-mode-first");
  boolCheck(results, "local_truth_and_data_model",
    "core_flows_work_fully_offline", manifest,
    ["local_truth", "core_flows_work_fully_offline"],
    "quality gate: core flows work fully offline");
  boolCheck(results, "local_truth_and_data_model",
    "sync_resumes_cleanly_after_long_offline", manifest,
    ["local_truth", "sync_resumes_cleanly_after_long_offline"],
    "quality gate: sync resumes cleanly after long offline periods");
  boolCheck(results, "local_truth_and_data_model",
    "mergeable_state_uses_crdt_or_ot", manifest,
    ["data_model", "mergeable_state_uses_crdt_or_ot"],
    "data model: CRDTs (or OT) are used for mergeable state");
  boolCheck(results, "local_truth_and_data_model",
    "tombstones_declared", manifest,
    ["data_model", "tombstones_declared"],
    "data model: tombstones are declared");
  boolCheck(results, "local_truth_and_data_model",
    "compaction_policy_declared", manifest,
    ["data_model", "compaction_policy_declared"],
    "data model: a compaction policy is declared");
  check(results, "local_truth_and_data_model",
    "entities_declared", entitiesRaw, entitiesIsList,
    entitiesIsList && (entitiesCount as number) > 0,
    "the declared record names its entities — the entities list is present and non-empty");
  const mergePresent = entitiesIsList &&
    rows.every((c) => hasField(c, "per_field_merge_semantics_declared"));
  check(results, "local_truth_and_data_model",
    "every_entity_per_field_merge_semantics_declared", entitiesRaw,
    mergePresent,
    entitiesIsList && (entitiesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        c["per_field_merge_semantics_declared"] === true),
    "data model: every declared entity row declares per-field merge semantics");
  const stableIdPresent = entitiesIsList &&
    rows.every((c) => hasField(c, "stable_id_declared"));
  check(results, "local_truth_and_data_model",
    "every_entity_stable_id_declared", entitiesRaw, stableIdPresent,
    entitiesIsList && (entitiesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["stable_id_declared"] === true),
    "data model: every declared entity row declares a stable document/entity ID");

  // ---- Section 2: sync_protocol ----
  boolCheck(results, "sync_protocol",
    "delta_sync_declared", manifest,
    ["sync_protocol", "delta_sync_declared"],
    "sync protocol: delta sync (over WebSocket/WebRTC) is declared");
  boolCheck(results, "sync_protocol",
    "causal_ordering_declared", manifest,
    ["sync_protocol", "causal_ordering_declared"],
    "sync protocol: causal ordering is declared");
  boolCheck(results, "sync_protocol",
    "resumability_declared", manifest,
    ["sync_protocol", "resumability_declared"],
    "sync protocol: resumability is declared");
  boolCheck(results, "sync_protocol",
    "bandwidth_budgets_declared", manifest,
    ["sync_protocol", "bandwidth_budgets_declared"],
    "sync protocol: bandwidth budgets are declared");
  boolCheck(results, "sync_protocol",
    "store_and_forward_for_intermittent_peers", manifest,
    ["sync_protocol", "store_and_forward_for_intermittent_peers"],
    "sync protocol: store-and-forward for intermittent peers is declared");
  boolCheck(results, "sync_protocol",
    "vector_clocks_or_version_vectors_declared", manifest,
    ["sync_protocol", "vector_clocks_or_version_vectors_declared"],
    "sync protocol: vector clocks / version vectors for causality are declared");

  // ---- Section 3: encryption_and_keys ----
  boolCheck(results, "encryption_and_keys",
    "e2ee_before_upload", manifest,
    ["encryption", "e2ee_before_upload"],
    "encryption: end-to-end encryption happens before upload");
  boolCheck(results, "encryption_and_keys",
    "keys_never_leave_devices", manifest,
    ["encryption", "keys_never_leave_devices"],
    "encryption: keys never leave devices");
  boolCheck(results, "encryption_and_keys",
    "per_device_keys_declared", manifest,
    ["encryption", "per_device_keys_declared"],
    "encryption: per-device keys are declared");
  boolCheck(results, "encryption_and_keys",
    "key_hierarchy_declared", manifest,
    ["encryption", "key_hierarchy_declared"],
    "encryption: a key hierarchy is declared");
  boolCheck(results, "encryption_and_keys",
    "key_recovery_ux_tested_like_a_feature", manifest,
    ["encryption", "key_recovery_ux_tested_like_a_feature"],
    "encryption: recovery UX is tested like a feature");
  boolCheck(results, "encryption_and_keys",
    "key_recovery_exercised_end_to_end", manifest,
    ["encryption", "key_recovery_exercised_end_to_end"],
    "quality gate: key recovery is exercised end-to-end");
  boolCheck(results, "encryption_and_keys",
    "e2ee_verified", manifest,
    ["encryption", "e2ee_verified"],
    "quality gate: E2EE is verified");
  gatedBoolCheck(results, "encryption_and_keys",
    "personal_data_encrypted_when_personal_data_synced", manifest,
    ["personal_data_sync", "personal_data_synced"],
    ["personal_data_sync", "personal_data_encrypted_before_sync"],
    "red line: personal data is encrypted before sync when personal data is declared synced",
    "no personal data declared synced");

  // ---- Section 4: conflicts_and_state_ui ----
  boolCheck(results, "conflicts_and_state_ui",
    "automatic_merge_for_text_and_counters", manifest,
    ["conflicts", "automatic_merge_for_text_and_counters"],
    "conflicts: automatic merges (CRDT) cover text & counters");
  boolCheck(results, "conflicts_and_state_ui",
    "explicit_ui_only_for_semantic_conflicts", manifest,
    ["conflicts", "explicit_ui_only_for_semantic_conflicts"],
    "conflicts: explicit UI is used only for semantic conflicts");
  falseCheck(results, "conflicts_and_state_ui",
    "no_silent_data_loss", manifest,
    ["conflicts", "silent_data_loss_present"],
    "red line: no silent data loss, ever");
  falseCheck(results, "conflicts_and_state_ui",
    "no_silent_last_write_wins_on_user_prose", manifest,
    ["conflicts", "silent_last_write_wins_on_user_prose_present"],
    "red line: no silent last-write-wins on user prose is present in the declared design");
  const proseGatePresent = entitiesIsList &&
    rows.every((c) => hasField(c, "is_user_prose"));
  const prosePresent = entitiesIsList && proseGatePresent &&
    proseRows.every((c) => hasField(c, "silent_last_write_wins_present"));
  check(results, "conflicts_and_state_ui",
    "no_prose_entity_uses_silent_last_write_wins", entitiesRaw,
    prosePresent,
    entitiesIsList && proseEntitiesWithSilentLww !== null &&
      proseEntitiesWithSilentLww.length === 0,
    "red line: no declared entity row that is user prose declares silent last-write-wins");
  boolCheck(results, "conflicts_and_state_ui",
    "offline_state_shown", manifest,
    ["state_ui", "offline_state_shown"],
    "state UI: the offline state is shown honestly");
  boolCheck(results, "conflicts_and_state_ui",
    "queued_state_shown", manifest,
    ["state_ui", "queued_state_shown"],
    "state UI: the queued state is shown honestly");
  boolCheck(results, "conflicts_and_state_ui",
    "syncing_state_shown", manifest,
    ["state_ui", "syncing_state_shown"],
    "state UI: the syncing state is shown honestly");
  boolCheck(results, "conflicts_and_state_ui",
    "synced_state_shown", manifest,
    ["state_ui", "synced_state_shown"],
    "state UI: the synced state is shown honestly");
  boolCheck(results, "conflicts_and_state_ui",
    "conflict_state_shown", manifest,
    ["state_ui", "conflict_state_shown"],
    "state UI: the conflict state is shown honestly");
  boolCheck(results, "conflicts_and_state_ui",
    "export_escape_hatch_present", manifest,
    ["state_ui", "export_escape_hatch_present"],
    "state UI: an export escape hatch is present");
  boolCheck(results, "conflicts_and_state_ui",
    "import_escape_hatch_present", manifest,
    ["state_ui", "import_escape_hatch_present"],
    "state UI: an import escape hatch is present");
  boolCheck(results, "conflicts_and_state_ui",
    "sync_diagnostics_present", manifest,
    ["state_ui", "sync_diagnostics_present"],
    "state UI: sync diagnostics are present");
  gatedBoolCheck(results, "conflicts_and_state_ui",
    "sync_badge_only_with_multi_device_round_trip_tests", manifest,
    ["state_ui", "sync_badge_claimed"],
    ["testing", "multi_device_round_trip_tests_passed"],
    "red line: a \"sync\" badge is claimed only with real multi-device round-trip tests passed",
    "no sync badge claimed");

  // ---- Section 5: testing_and_quality_gates ----
  boolCheck(results, "testing_and_quality_gates",
    "chaos_offline_scenario_tested", manifest,
    ["testing", "chaos_offline_scenario_tested"],
    "testing: the offline chaos scenario is tested");
  boolCheck(results, "testing_and_quality_gates",
    "chaos_clock_skew_scenario_tested", manifest,
    ["testing", "chaos_clock_skew_scenario_tested"],
    "testing: the clock-skew chaos scenario is tested");
  boolCheck(results, "testing_and_quality_gates",
    "chaos_concurrent_edits_scenario_tested", manifest,
    ["testing", "chaos_concurrent_edits_scenario_tested"],
    "testing: the concurrent-edits chaos scenario is tested");
  boolCheck(results, "testing_and_quality_gates",
    "chaos_device_loss_scenario_tested", manifest,
    ["testing", "chaos_device_loss_scenario_tested"],
    "testing: the device-loss chaos scenario is tested");
  boolCheck(results, "testing_and_quality_gates",
    "merge_invariants_property_tested", manifest,
    ["testing", "merge_invariants_property_tested"],
    "quality gate: merge invariants are property-tested — commutative, associative, idempotent — and no user edit can be lost");
  boolCheck(results, "testing_and_quality_gates",
    "export_import_tested_on_real_data_volumes", manifest,
    ["testing", "export_import_tested_on_real_data_volumes"],
    "quality gate: export/import is tested on real data volumes");
  boolCheck(results, "testing_and_quality_gates",
    "real_device_matrix_tested", manifest,
    ["testing", "real_device_matrix_tested"],
    "testing: a real device matrix is tested");
  boolCheck(results, "testing_and_quality_gates",
    "multi_device_round_trip_tests_passed", manifest,
    ["testing", "multi_device_round_trip_tests_passed"],
    "red line: real multi-device round-trip tests are passed — the evidence a \"sync\" claim stands on");

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
    verdict = "LOCAL_FIRST_SYNC_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "LOCAL_FIRST_SYNC_SOUND";
  }

  const computedNames = [
    "entities_declared",
    "every_entity_per_field_merge_semantics_declared",
    "every_entity_stable_id_declared",
    "no_prose_entity_uses_silent_last_write_wins",
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
    service: "local-first-sync-design",
    atom_version: "0.1.0",
    app: manifest["app"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    entities_count: entitiesCount,
    entities_without_merge_semantics: entitiesWithoutMergeSemantics,
    merge_semantics_coverage: fmt6(mergeSemanticsCoverage),
    entities_without_stable_id: entitiesWithoutStableId,
    stable_id_coverage: fmt6(stableIdCoverage),
    prose_entities_with_silent_last_write_wins: proseEntitiesWithSilentLww,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "LOCAL FIRST SYNC DESIGN",
    `app: ${pyStr(verdict.app ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
