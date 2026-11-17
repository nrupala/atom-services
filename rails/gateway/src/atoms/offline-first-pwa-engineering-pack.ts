// Offline-first PWA engineering pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/offline-first-pwa-engineering-pack/src/offline_first_pwa_engineering_pack.py
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
  architecture: {
    local_store_is_primary_source: "boolean",
    server_is_sync_target_or_absent: "boolean",
  },
  core_flows: [{
    name: "string",
    works_fully_offline: "boolean",
  }],
  service_worker: {
    app_shell_precached: "boolean",
    versioned_assets_precached: "boolean",
    sensitive_responses_not_cached_blindly: "boolean",
    update_flow_new_version_ready_ui_present: "boolean",
    skip_waiting_controlled: "boolean",
  },
  storage: {
    versioned_schema_migrations_present: "boolean",
    migrations_tested: "boolean",
    quota_awareness_present: "boolean",
    quota_exhaustion_handled_gracefully: "boolean",
    export_path_exists: "boolean",
    import_path_exists: "boolean",
    export_import_round_trip_verified: "boolean",
  },
  sync: {
    server_sync_used: "boolean",
    queue_with_retry_and_backoff: "boolean",
    operations_idempotent: "boolean",
    conflict_rules_explicit: "boolean",
    state_visible_pending_synced_failed: "boolean",
    indefinite_spinners_avoided: "boolean",
  },
  installability: {
    web_app_manifest_present: "boolean",
    icons_present: "boolean",
    theming_present: "boolean",
    keyboard_first_usability_addressed: "boolean",
    degraded_mode_messaging_present: "boolean",
  },
  encryption: {
    zero_knowledge_claimed: "boolean",
    webcrypto_used: "boolean",
    keys_never_exported_unencrypted: "boolean",
    platform_limits_disclosed_honestly: "boolean",
  },
  testing: {
    devtools_offline_test_performed: "boolean",
    devtools_throttle_test_performed: "boolean",
    storage_full_simulation_performed: "boolean",
    upgrade_path_old_data_tested: "boolean",
    install_uninstall_flows_tested: "boolean",
    service_worker_update_flow_exercised: "boolean",
  },
  red_lines: {
    silent_data_loss_present: "boolean",
    caching_of_secrets_present: "boolean",
    network_required_core_flows_claimed_offline_first_present: "boolean",
  },
};

export const SECTIONS = [
  "offline_first_architecture",
  "service_worker_discipline",
  "storage_engineering",
  "sync_and_honest_state",
  "installability_encryption_and_ux",
  "testing_and_quality_gates",
  "pwa_red_lines",
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
  core_flows_count: number | null;
  flows_without_offline_support: string[] | null;
  offline_coverage: string | null;
  duplicate_flow_names: string[] | null;
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

function gatedCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  fieldPath: string[],
  evidence: string,
): void {
  const [gate, gatePresent] = getPath(manifest, ...gatePath);
  const [value, present] = getPath(manifest, ...fieldPath);
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [flowsRaw, hasFlows] = getPath(manifest, "core_flows");
  const flowsIsList = hasFlows && Array.isArray(flowsRaw);
  const rows: unknown[] = flowsIsList ? (flowsRaw as unknown[]) : [];
  const flowsCount: number | null = flowsIsList ? rows.length : null;

  const flowsWithoutOfflineSupport: string[] | null = flowsIsList
    ? rows.filter((c) => hasField(c, "works_fully_offline") &&
        (c as Record<string, unknown>)["works_fully_offline"] !== true)
        .map(rowName)
    : null;
  let duplicateFlowNames: string[] | null = null;
  if (flowsIsList) {
    const seen: string[] = [];
    duplicateFlowNames = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["name"] === "string") {
        const nm = c["name"] as string;
        if (seen.includes(nm) && !duplicateFlowNames.includes(nm)) {
          duplicateFlowNames.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const offlineCoverage: number | null =
    flowsIsList && flowsCount !== null && flowsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["works_fully_offline"] === true).length / flowsCount
      : null;

  // ---- Section 1: offline_first_architecture ----
  boolCheck(results, "offline_first_architecture",
    "local_store_is_primary_source", manifest,
    ["architecture", "local_store_is_primary_source"],
    "architecture: the local store is the primary source for user data");
  boolCheck(results, "offline_first_architecture",
    "server_is_sync_target_or_absent", manifest,
    ["architecture", "server_is_sync_target_or_absent"],
    "architecture: the server is a sync target, or absent entirely, never the primary source");
  check(results, "offline_first_architecture",
    "core_flows_declared", flowsRaw, flowsIsList,
    flowsIsList && (flowsCount as number) > 0,
    "the declared record names its core flows -- the core flows list is present and non-empty");
  const worksPresent = flowsIsList &&
    rows.every((c) => hasField(c, "works_fully_offline"));
  check(results, "offline_first_architecture",
    "every_core_flow_works_fully_offline", flowsRaw, worksPresent,
    flowsIsList && (flowsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["works_fully_offline"] === true),
    "architecture: every declared core flow works fully offline");
  const namePresent = flowsIsList &&
    rows.every((c) => hasField(c, "name"));
  check(results, "offline_first_architecture",
    "no_core_flow_name_duplicated", flowsRaw, namePresent,
    flowsIsList && duplicateFlowNames !== null &&
      duplicateFlowNames.length === 0,
    "core flows: no declared core flow name is owned by more than one core flow row");

  // ---- Section 2: service_worker_discipline ----
  boolCheck(results, "service_worker_discipline",
    "app_shell_precached", manifest,
    ["service_worker", "app_shell_precached"],
    "service worker: the app shell is pre-cached");
  boolCheck(results, "service_worker_discipline",
    "versioned_assets_precached", manifest,
    ["service_worker", "versioned_assets_precached"],
    "service worker: versioned assets are pre-cached");
  boolCheck(results, "service_worker_discipline",
    "sensitive_responses_not_cached_blindly", manifest,
    ["service_worker", "sensitive_responses_not_cached_blindly"],
    "service worker: sensitive responses are never cached blindly");
  boolCheck(results, "service_worker_discipline",
    "update_flow_new_version_ready_ui_present", manifest,
    ["service_worker", "update_flow_new_version_ready_ui_present"],
    "service worker: the update flow is explicit, with a new version ready UI");
  boolCheck(results, "service_worker_discipline",
    "skip_waiting_controlled", manifest,
    ["service_worker", "skip_waiting_controlled"],
    "service worker: skipWaiting is controlled, not automatic and uncontrolled");

  // ---- Section 3: storage_engineering ----
  boolCheck(results, "storage_engineering",
    "versioned_schema_migrations_present", manifest,
    ["storage", "versioned_schema_migrations_present"],
    "storage: versioned schema migrations are present");
  boolCheck(results, "storage_engineering",
    "migrations_tested", manifest,
    ["storage", "migrations_tested"],
    "storage: storage migrations are tested");
  boolCheck(results, "storage_engineering",
    "quota_awareness_present", manifest,
    ["storage", "quota_awareness_present"],
    "storage: quota awareness is present");
  boolCheck(results, "storage_engineering",
    "quota_exhaustion_handled_gracefully", manifest,
    ["storage", "quota_exhaustion_handled_gracefully"],
    "storage: quota exhaustion is handled gracefully, including storage-full");
  boolCheck(results, "storage_engineering",
    "export_path_exists", manifest,
    ["storage", "export_path_exists"],
    "storage: an export path exists so users truly own their data");
  boolCheck(results, "storage_engineering",
    "import_path_exists", manifest,
    ["storage", "import_path_exists"],
    "storage: an import path exists so users truly own their data");
  boolCheck(results, "storage_engineering",
    "export_import_round_trip_verified", manifest,
    ["storage", "export_import_round_trip_verified"],
    "storage: the export path exists and round-trips through import");

  // ---- Section 4: sync_and_honest_state ----
  const [gateValue, gatePresent] = getPath(manifest, "sync", "server_sync_used");
  check(results, "sync_and_honest_state",
    "sync_applicability_declared", gateValue, gatePresent, true,
    "sync: whether the app uses server sync is declared -- the sync checks apply only when it does, because the server may be absent entirely");
  gatedCheck(results, "sync_and_honest_state",
    "queue_with_retry_and_backoff", manifest,
    ["sync", "server_sync_used"], ["sync", "queue_with_retry_and_backoff"],
    "sync: changes are queued with retry and backoff");
  gatedCheck(results, "sync_and_honest_state",
    "operations_idempotent", manifest,
    ["sync", "server_sync_used"], ["sync", "operations_idempotent"],
    "sync: sync operations are idempotent");
  gatedCheck(results, "sync_and_honest_state",
    "conflict_rules_explicit", manifest,
    ["sync", "server_sync_used"], ["sync", "conflict_rules_explicit"],
    "sync: conflict rules are explicit -- last-write-wins or a domain-specific merge, declared not implicit");
  gatedCheck(results, "sync_and_honest_state",
    "state_visible_pending_synced_failed", manifest,
    ["sync", "server_sync_used"], ["sync", "state_visible_pending_synced_failed"],
    "sync: visible sync state -- pending, synced and failed -- is shown");
  boolCheck(results, "sync_and_honest_state",
    "indefinite_spinners_avoided", manifest,
    ["sync", "indefinite_spinners_avoided"],
    "honest state: there are no spinners-forever -- the UI tells the truth about sync state");

  // ---- Section 5: installability_encryption_and_ux ----
  boolCheck(results, "installability_encryption_and_ux",
    "web_app_manifest_present", manifest,
    ["installability", "web_app_manifest_present"],
    "installability: a web app manifest is present");
  boolCheck(results, "installability_encryption_and_ux",
    "icons_present", manifest,
    ["installability", "icons_present"],
    "installability: icons are present");
  boolCheck(results, "installability_encryption_and_ux",
    "theming_present", manifest,
    ["installability", "theming_present"],
    "installability: theming is present");
  boolCheck(results, "installability_encryption_and_ux",
    "keyboard_first_usability_addressed", manifest,
    ["installability", "keyboard_first_usability_addressed"],
    "UX: keyboard-first usability is addressed");
  boolCheck(results, "installability_encryption_and_ux",
    "degraded_mode_messaging_present", manifest,
    ["installability", "degraded_mode_messaging_present"],
    "UX: degraded-mode messaging is present when features need connectivity");
  const [encGate, encGatePresent] = getPath(manifest, "encryption", "zero_knowledge_claimed");
  check(results, "installability_encryption_and_ux",
    "zero_knowledge_applicability_declared", encGate, encGatePresent, true,
    "encryption: whether zero-knowledge is claimed is declared -- the encryption checks apply only when it is claimed");
  gatedCheck(results, "installability_encryption_and_ux",
    "webcrypto_used", manifest,
    ["encryption", "zero_knowledge_claimed"], ["encryption", "webcrypto_used"],
    "encryption: WebCrypto is used when zero-knowledge is claimed");
  gatedCheck(results, "installability_encryption_and_ux",
    "keys_never_exported_unencrypted", manifest,
    ["encryption", "zero_knowledge_claimed"], ["encryption", "keys_never_exported_unencrypted"],
    "encryption: keys never leave the device unencrypted");
  gatedCheck(results, "installability_encryption_and_ux",
    "platform_limits_disclosed_honestly", manifest,
    ["encryption", "zero_knowledge_claimed"], ["encryption", "platform_limits_disclosed_honestly"],
    "encryption: web-platform limits, including secure storage constraints, are disclosed honestly");

  // ---- Section 6: testing_and_quality_gates ----
  boolCheck(results, "testing_and_quality_gates",
    "devtools_offline_test_performed", manifest,
    ["testing", "devtools_offline_test_performed"],
    "testing: a DevTools offline test is performed");
  boolCheck(results, "testing_and_quality_gates",
    "devtools_throttle_test_performed", manifest,
    ["testing", "devtools_throttle_test_performed"],
    "testing: a DevTools throttle test is performed");
  boolCheck(results, "testing_and_quality_gates",
    "storage_full_simulation_performed", manifest,
    ["testing", "storage_full_simulation_performed"],
    "testing: a storage-full simulation is performed");
  boolCheck(results, "testing_and_quality_gates",
    "upgrade_path_old_data_tested", manifest,
    ["testing", "upgrade_path_old_data_tested"],
    "testing: the upgrade path is tested -- old data to new version");
  boolCheck(results, "testing_and_quality_gates",
    "install_uninstall_flows_tested", manifest,
    ["testing", "install_uninstall_flows_tested"],
    "testing: install and uninstall flows are tested");
  boolCheck(results, "testing_and_quality_gates",
    "service_worker_update_flow_exercised", manifest,
    ["testing", "service_worker_update_flow_exercised"],
    "testing: the update flow for a new service worker is exercised");

  // ---- Section 7: pwa_red_lines ----
  falseCheck(results, "pwa_red_lines",
    "silent_data_loss_refused", manifest,
    ["red_lines", "silent_data_loss_present"],
    "red line: no silent data loss -- quota and deletes must warn");
  falseCheck(results, "pwa_red_lines",
    "secrets_caching_refused", manifest,
    ["red_lines", "caching_of_secrets_present"],
    "red line: no caching of secrets is present in the record");
  falseCheck(results, "pwa_red_lines",
    "network_required_core_flow_offline_claim_refused", manifest,
    ["red_lines", "network_required_core_flows_claimed_offline_first_present"],
    "red line: no offline-first claim is made with network-required core flows");

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
    verdict = "OFFLINE_FIRST_PWA_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "OFFLINE_FIRST_PWA_SOUND";
  }

  const computedNames = [
    "core_flows_declared",
    "every_core_flow_works_fully_offline",
    "no_core_flow_name_duplicated",
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
    service: "offline-first-pwa-engineering-pack",
    atom_version: "0.1.0",
    app: manifest["app"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    core_flows_count: flowsCount,
    flows_without_offline_support: flowsWithoutOfflineSupport,
    offline_coverage: fmt6(offlineCoverage),
    duplicate_flow_names: duplicateFlowNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "OFFLINE-FIRST PWA ENGINEERING PACK",
    `app: ${pyStr(verdict.app ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
