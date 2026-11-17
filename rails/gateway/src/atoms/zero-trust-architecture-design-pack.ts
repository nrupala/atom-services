// Zero trust architecture design pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/zero-trust-architecture-design-pack/src/zero_trust_architecture_design_pack.py
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
  design_title: "string",
  identity: {
    identity_first_design_declared: "boolean",
    user_identities_declared: "boolean",
    workload_identities_declared: "boolean",
    short_lived_credentials_declared: "boolean",
    credentials_scoped_declared: "boolean",
    credentials_rotated_declared: "boolean",
    no_implicit_network_trust_declared: "boolean",
    every_hop_authenticated_and_authorized_declared: "boolean",
    policy_layer_decides_access_declared: "boolean",
  },
  assets: [{
    asset_id: "string",
    asset_name: "string",
    asset_kind: "string",
  }],
  policies: [{
    policy_id: "string",
    policy_name: "string",
    covered_asset_ids: ["string"],
  }],
  segmentation: {
    segmentation_declared: "boolean",
    blast_radius_boundaries_declared: "boolean",
    egress_restricted_declared: "boolean",
    egress_monitored_declared: "boolean",
    deny_by_default_declared: "boolean",
    least_privilege_declared: "boolean",
  },
  trust: {
    device_posture_checks_declared: "boolean",
    device_inventory_declared: "boolean",
    server_posture_checks_declared: "boolean",
    workload_attestation_declared: "boolean",
    node_trust_requires_attestation_declared: "boolean",
    encryption_in_transit_declared: "boolean",
    encryption_at_rest_declared: "boolean",
    end_to_end_encryption_demanded: "boolean",
    end_to_end_encryption_declared: "boolean",
  },
  monitoring: {
    audit_logging_declared: "boolean",
    privileged_actions_logged_immutably_declared: "boolean",
    anomaly_alerting_declared: "boolean",
    audit_trail_survives_component_declared: "boolean",
    egress_changes_audited_declared: "boolean",
    privilege_changes_audited_declared: "boolean",
    incident_response_path_declared: "boolean",
    break_glass_documented_declared: "boolean",
    break_glass_ceremony_gated_declared: "boolean",
    break_glass_tested_declared: "boolean",
  },
  migration: {
    migration_phases_declared: "boolean",
    rollout_order_declared: "boolean",
    legacy_implicit_trust_removal_declared: "boolean",
    rollback_path_declared: "boolean",
    per_hop_verification_during_rollout_declared: "boolean",
    permissions_review_and_revocation_declared: "boolean",
  },
  red_lines: {
    internal_network_trusted_present: "boolean",
    shared_credentials_present: "boolean",
    long_lived_wide_scope_secrets_present: "boolean",
    unrevocable_access_present: "boolean",
    anonymous_east_west_access_present: "boolean",
  },
};

export const SECTIONS = [
  "identity_and_perimeter_framing",
  "policy_coverage_and_segmentation",
  "device_and_workload_trust",
  "monitoring_audit_and_response",
  "migration_and_rollout",
  "red_lines",
] as const;

const ASSET_KINDS = ["service", "workload", "device", "data_store", "admin_path"];

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
  design_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  zero_trust_design_assets_count: number | null;
  zero_trust_design_policies_count: number | null;
  duplicate_zero_trust_design_asset_ids: string[] | null;
  duplicate_zero_trust_design_policy_ids: string[] | null;
  zero_trust_design_assets_without_name: string[] | null;
  zero_trust_design_assets_with_invalid_kind: string[] | null;
  zero_trust_design_policies_without_name: string[] | null;
  zero_trust_design_policies_without_coverage: string[] | null;
  zero_trust_design_policy_refs_not_declared_as_assets: string[] | null;
  zero_trust_design_assets_without_policy_coverage: string[] | null;
  zero_trust_design_policy_coverage_ratio: string | null;
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

  const [assetsRaw, hasAssets] = getPath(manifest, "assets");
  const assetsIsList = hasAssets && Array.isArray(assetsRaw);
  const assetRows: unknown[] = assetsIsList ? (assetsRaw as unknown[]) : [];
  const assetsCount: number | null = assetsIsList ? assetRows.length : null;
  const assetIds = idsOf(assetRows, "asset_id");

  const [policiesRaw, hasPolicies] = getPath(manifest, "policies");
  const policiesIsList = hasPolicies && Array.isArray(policiesRaw);
  const policyRows: unknown[] = policiesIsList ? (policiesRaw as unknown[]) : [];
  const policiesCount: number | null = policiesIsList ? policyRows.length : null;

  const duplicateAssetIds: string[] | null = assetsIsList
    ? duplicates(assetRows, "asset_id") : null;
  const duplicatePolicyIds: string[] | null = policiesIsList
    ? duplicates(policyRows, "policy_id") : null;

  const assetsWithoutName: string[] | null = assetsIsList
    ? assetRows.filter((c) => hasField(c, "asset_name") &&
        !nonemptyStr((c as Record<string, unknown>)["asset_name"]))
        .map((c) => rowName(c, "asset_id"))
    : null;
  const assetsWithInvalidKind: string[] | null = assetsIsList
    ? assetRows.filter((c) => hasField(c, "asset_kind") &&
        !ASSET_KINDS.includes((c as Record<string, unknown>)["asset_kind"] as string))
        .map((c) => rowName(c, "asset_id"))
    : null;
  const policiesWithoutName: string[] | null = policiesIsList
    ? policyRows.filter((c) => hasField(c, "policy_name") &&
        !nonemptyStr((c as Record<string, unknown>)["policy_name"]))
        .map((c) => rowName(c, "policy_id"))
    : null;
  const policiesWithoutCoverage: string[] | null = policiesIsList
    ? policyRows.filter((c) => hasField(c, "covered_asset_ids") &&
        Array.isArray((c as Record<string, unknown>)["covered_asset_ids"]) &&
        ((c as Record<string, unknown>)["covered_asset_ids"] as unknown[]).length === 0)
        .map((c) => rowName(c, "policy_id"))
    : null;

  const coveredIds: string[] = [];
  if (policiesIsList) {
    for (const p of policyRows) {
      const cov = isPyDict(p) ? p["covered_asset_ids"] : null;
      if (Array.isArray(cov)) {
        for (const cid of cov) {
          if (typeof cid === "string" && !coveredIds.includes(cid)) {
            coveredIds.push(cid);
          }
        }
      }
    }
  }
  let refsNotDeclared: string[] | null = null;
  let assetsWithoutCoverage: string[] | null = null;
  if (assetsIsList && policiesIsList) {
    refsNotDeclared = coveredIds.filter((cid) => !assetIds.includes(cid));
    assetsWithoutCoverage = [];
    for (const aid of assetIds) {
      if (!coveredIds.includes(aid) && !assetsWithoutCoverage.includes(aid)) {
        assetsWithoutCoverage.push(aid);
      }
    }
  }

  const coverageRatio: number | null =
    assetsIsList && policiesIsList && assetsCount !== null && assetsCount > 0
      ? assetIds.filter((aid) => coveredIds.includes(aid)).length / assetsCount
      : null;

  // ---- Section 1: identity_and_perimeter_framing ----
  boolCheck(results, "identity_and_perimeter_framing",
    "zero_trust_design_identity_first_design_declared", manifest,
    ["identity", "identity_first_design_declared"],
    "identity-first: the design is declared identity-first — identity, not network location, is the perimeter");
  boolCheck(results, "identity_and_perimeter_framing",
    "zero_trust_design_user_identities_declared", manifest,
    ["identity", "user_identities_declared"],
    "identity-first: strong identities for users are declared");
  boolCheck(results, "identity_and_perimeter_framing",
    "zero_trust_design_workload_identities_declared", manifest,
    ["identity", "workload_identities_declared"],
    "identity-first: strong identities for workloads are declared");
  boolCheck(results, "identity_and_perimeter_framing",
    "zero_trust_design_short_lived_credentials_declared", manifest,
    ["identity", "short_lived_credentials_declared"],
    "identity-first: credentials are declared short-lived (tokens, certs) — no shared or static long-lived secrets");
  boolCheck(results, "identity_and_perimeter_framing",
    "zero_trust_design_credentials_scoped_declared", manifest,
    ["identity", "credentials_scoped_declared"],
    "identity-first: credentials are declared scoped");
  boolCheck(results, "identity_and_perimeter_framing",
    "zero_trust_design_credentials_rotated_declared", manifest,
    ["identity", "credentials_rotated_declared"],
    "identity-first: credentials are declared rotated");
  boolCheck(results, "identity_and_perimeter_framing",
    "zero_trust_design_no_implicit_network_trust_declared", manifest,
    ["identity", "no_implicit_network_trust_declared"],
    "identity-first: no implicit network trust is declared — location proves nothing");
  boolCheck(results, "identity_and_perimeter_framing",
    "zero_trust_design_every_hop_authenticated_and_authorized_declared",
    manifest,
    ["identity", "every_hop_authenticated_and_authorized_declared"],
    "every hop: every request is declared authenticated and authorized — humans and workloads alike");
  boolCheck(results, "identity_and_perimeter_framing",
    "zero_trust_design_policy_layer_decides_access_declared", manifest,
    ["identity", "policy_layer_decides_access_declared"],
    "every hop: a policy layer is declared to decide access, not network position");

  // ---- Section 2: policy_coverage_and_segmentation ----
  check(results, "policy_coverage_and_segmentation",
    "zero_trust_design_assets_list_declared", assetsRaw, assetsIsList,
    assetsIsList && assetsCount !== null && assetsCount >= 1,
    "assets: the declared record names its assets — the list is present and names at least one asset; an absent list is missing evidence and an empty list declares no hop at all");
  const assetIdPresent = assetsIsList &&
    assetRows.every((c) => hasField(c, "asset_id"));
  check(results, "policy_coverage_and_segmentation",
    "every_zero_trust_design_asset_id_unique", assetsRaw, assetIdPresent,
    assetsIsList && duplicateAssetIds !== null && duplicateAssetIds.length === 0,
    "assets: no declared asset_id is owned by more than one row");
  const assetNamePresent = assetsIsList &&
    assetRows.every((c) => hasField(c, "asset_name"));
  check(results, "policy_coverage_and_segmentation",
    "every_zero_trust_design_asset_name_declared", assetsRaw, assetNamePresent,
    assetsIsList && assetRows.every((c) => isPyDict(c) && nonemptyStr(c["asset_name"])),
    "assets: every declared asset declares a non-empty asset name");
  const kindPresent = assetsIsList &&
    assetRows.every((c) => hasField(c, "asset_kind"));
  check(results, "policy_coverage_and_segmentation",
    "every_zero_trust_design_asset_kind_recognised", assetsRaw, kindPresent,
    assetsIsList && assetRows.every((c) => isPyDict(c) &&
      ASSET_KINDS.includes(c["asset_kind"] as string)),
    "assets: every declared asset's kind is one of service, workload, device, data_store, admin_path — the kinds of hop the design record names");
  check(results, "policy_coverage_and_segmentation",
    "zero_trust_design_policies_list_declared", policiesRaw, policiesIsList,
    policiesIsList && policiesCount !== null && policiesCount >= 1,
    "policies: the declared record names its policy rows — the list is present and names at least one policy; an absent list is missing evidence and an empty list declares no policy coverage at all");
  const policyIdPresent = policiesIsList &&
    policyRows.every((c) => hasField(c, "policy_id"));
  check(results, "policy_coverage_and_segmentation",
    "every_zero_trust_design_policy_id_unique", policiesRaw, policyIdPresent,
    policiesIsList && duplicatePolicyIds !== null && duplicatePolicyIds.length === 0,
    "policies: no declared policy_id is owned by more than one row");
  const policyNamePresent = policiesIsList &&
    policyRows.every((c) => hasField(c, "policy_name"));
  check(results, "policy_coverage_and_segmentation",
    "every_zero_trust_design_policy_name_declared", policiesRaw, policyNamePresent,
    policiesIsList && policyRows.every((c) => isPyDict(c) && nonemptyStr(c["policy_name"])),
    "policies: every declared policy declares a non-empty policy name");
  const coveragePresent = policiesIsList &&
    policyRows.every((c) => hasField(c, "covered_asset_ids"));
  check(results, "policy_coverage_and_segmentation",
    "every_zero_trust_design_policy_covers_at_least_one_asset",
    policiesRaw, coveragePresent,
    policiesIsList && policyRows.every((c) => isPyDict(c) &&
      Array.isArray(c["covered_asset_ids"]) &&
      (c["covered_asset_ids"] as unknown[]).length > 0),
    "policies: every declared policy declares coverage of at least one asset");
  const refsPresent = assetsIsList && policiesIsList &&
    policyRows.every((c) => hasField(c, "covered_asset_ids")) &&
    assetRows.every((c) => hasField(c, "asset_id"));
  check(results, "policy_coverage_and_segmentation",
    "every_zero_trust_design_policy_coverage_reference_resolves",
    policiesRaw, refsPresent,
    refsPresent && refsNotDeclared !== null && refsNotDeclared.length === 0,
    "policies: every declared coverage reference names a declared asset — no policy claims coverage of an asset the record does not declare");
  check(results, "policy_coverage_and_segmentation",
    "every_zero_trust_design_declared_asset_covered_by_policy",
    assetsRaw, refsPresent,
    refsPresent && assetsWithoutCoverage !== null && assetsWithoutCoverage.length === 0,
    "coverage: every declared asset is covered by at least one declared policy — a declared asset no declared policy covers is a hop the design leaves unverified on its own record");
  boolCheck(results, "policy_coverage_and_segmentation",
    "zero_trust_design_segmentation_declared", manifest,
    ["segmentation", "segmentation_declared"],
    "segment: the design declares segmentation between services and environments");
  boolCheck(results, "policy_coverage_and_segmentation",
    "zero_trust_design_blast_radius_boundaries_declared", manifest,
    ["segmentation", "blast_radius_boundaries_declared"],
    "segment: blast-radius boundaries are declared between services and environments");
  boolCheck(results, "policy_coverage_and_segmentation",
    "zero_trust_design_egress_restricted_declared", manifest,
    ["segmentation", "egress_restricted_declared"],
    "segment: egress is declared restricted");
  boolCheck(results, "policy_coverage_and_segmentation",
    "zero_trust_design_egress_monitored_declared", manifest,
    ["segmentation", "egress_monitored_declared"],
    "segment: egress is declared monitored");
  boolCheck(results, "policy_coverage_and_segmentation",
    "zero_trust_design_deny_by_default_declared", manifest,
    ["segmentation", "deny_by_default_declared"],
    "least privilege: access is declared deny by default");
  boolCheck(results, "policy_coverage_and_segmentation",
    "zero_trust_design_least_privilege_declared", manifest,
    ["segmentation", "least_privilege_declared"],
    "least privilege: scoped tokens and just-in-time elevation are declared under a least-privilege design");

  // ---- Section 3: device_and_workload_trust ----
  boolCheck(results, "device_and_workload_trust",
    "zero_trust_design_device_posture_checks_declared", manifest,
    ["trust", "device_posture_checks_declared"],
    "attest: device posture checks are declared before a device is trusted");
  boolCheck(results, "device_and_workload_trust",
    "zero_trust_design_device_inventory_declared", manifest,
    ["trust", "device_inventory_declared"],
    "attest: a device inventory is declared");
  boolCheck(results, "device_and_workload_trust",
    "zero_trust_design_server_posture_checks_declared", manifest,
    ["trust", "server_posture_checks_declared"],
    "attest: server posture checks are declared before a node is trusted");
  boolCheck(results, "device_and_workload_trust",
    "zero_trust_design_workload_attestation_declared", manifest,
    ["trust", "workload_attestation_declared"],
    "attest: workload attestation is declared");
  boolCheck(results, "device_and_workload_trust",
    "zero_trust_design_node_trust_requires_attestation_declared",
    manifest,
    ["trust", "node_trust_requires_attestation_declared"],
    "attest: node trust is declared to require attestation — no node is trusted on presence alone");
  boolCheck(results, "device_and_workload_trust",
    "zero_trust_design_encryption_in_transit_declared", manifest,
    ["trust", "encryption_in_transit_declared"],
    "encrypt: encryption in transit is declared");
  boolCheck(results, "device_and_workload_trust",
    "zero_trust_design_encryption_at_rest_declared", manifest,
    ["trust", "encryption_at_rest_declared"],
    "encrypt: encryption at rest is declared");
  gatedBoolCheck(results, "device_and_workload_trust",
    "zero_trust_design_end_to_end_encryption_declared_where_demanded",
    manifest,
    ["trust", "end_to_end_encryption_demanded"],
    ["trust", "end_to_end_encryption_declared"],
    "encrypt: end-to-end encryption is declared where the design's model demands it",
    "end-to-end encryption not declared demanded by the design's model");

  // ---- Section 4: monitoring_audit_and_response ----
  boolCheck(results, "monitoring_audit_and_response",
    "zero_trust_design_audit_logging_declared", manifest,
    ["monitoring", "audit_logging_declared"],
    "audit: every request is declared logged — audit everything");
  boolCheck(results, "monitoring_audit_and_response",
    "zero_trust_design_privileged_actions_logged_immutably_declared",
    manifest,
    ["monitoring", "privileged_actions_logged_immutably_declared"],
    "audit: privileged actions are declared logged immutably");
  boolCheck(results, "monitoring_audit_and_response",
    "zero_trust_design_anomaly_alerting_declared", manifest,
    ["monitoring", "anomaly_alerting_declared"],
    "audit: alerts on anomalies are declared");
  boolCheck(results, "monitoring_audit_and_response",
    "zero_trust_design_audit_trail_survives_component_declared",
    manifest,
    ["monitoring", "audit_trail_survives_component_declared"],
    "audit: audit trails are declared to survive the component they describe");
  boolCheck(results, "monitoring_audit_and_response",
    "zero_trust_design_egress_changes_audited_declared", manifest,
    ["monitoring", "egress_changes_audited_declared"],
    "audit: egress changes are declared audited");
  boolCheck(results, "monitoring_audit_and_response",
    "zero_trust_design_privilege_changes_audited_declared", manifest,
    ["monitoring", "privilege_changes_audited_declared"],
    "audit: privilege changes are declared audited");
  boolCheck(results, "monitoring_audit_and_response",
    "zero_trust_design_incident_response_path_declared", manifest,
    ["monitoring", "incident_response_path_declared"],
    "response: an incident response path for a failed verification is declared");
  boolCheck(results, "monitoring_audit_and_response",
    "zero_trust_design_break_glass_documented_declared", manifest,
    ["monitoring", "break_glass_documented_declared"],
    "break-glass: the emergency path is declared documented");
  boolCheck(results, "monitoring_audit_and_response",
    "zero_trust_design_break_glass_ceremony_gated_declared", manifest,
    ["monitoring", "break_glass_ceremony_gated_declared"],
    "break-glass: the emergency path is declared ceremony-gated");
  boolCheck(results, "monitoring_audit_and_response",
    "zero_trust_design_break_glass_tested_declared", manifest,
    ["monitoring", "break_glass_tested_declared"],
    "break-glass: the emergency path is declared tested once");

  // ---- Section 5: migration_and_rollout ----
  boolCheck(results, "migration_and_rollout",
    "zero_trust_design_migration_phases_declared", manifest,
    ["migration", "migration_phases_declared"],
    "migration: migration phases from the current design to the zero-trust design are declared");
  boolCheck(results, "migration_and_rollout",
    "zero_trust_design_rollout_order_declared", manifest,
    ["migration", "rollout_order_declared"],
    "migration: the rollout order across services and environments is declared");
  boolCheck(results, "migration_and_rollout",
    "zero_trust_design_legacy_implicit_trust_removal_declared",
    manifest,
    ["migration", "legacy_implicit_trust_removal_declared"],
    "migration: removal of legacy implicit trust (the trusted internal network) is declared");
  boolCheck(results, "migration_and_rollout",
    "zero_trust_design_rollback_path_declared", manifest,
    ["migration", "rollback_path_declared"],
    "migration: a rollback path for a failed rollout step is declared");
  boolCheck(results, "migration_and_rollout",
    "zero_trust_design_per_hop_verification_during_rollout_declared",
    manifest,
    ["migration", "per_hop_verification_during_rollout_declared"],
    "migration: per-hop verification during rollout is declared — no hop is left trusted by transition");
  boolCheck(results, "migration_and_rollout",
    "zero_trust_design_permissions_review_and_revocation_declared",
    manifest,
    ["migration", "permissions_review_and_revocation_declared"],
    "migration: permissions are declared reviewed and revoked routinely as the rollout proceeds");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "zero_trust_design_free_of_internal_network_trusted",
    manifest,
    ["red_lines", "internal_network_trusted_present"],
    "red line: no 'it is on the internal network, so it is fine' trust is present in the record");
  falseCheck(results, "red_lines",
    "zero_trust_design_free_of_shared_credentials",
    manifest,
    ["red_lines", "shared_credentials_present"],
    "red line: no shared credentials across services or people are present in the record");
  falseCheck(results, "red_lines",
    "zero_trust_design_free_of_long_lived_wide_scope_secrets",
    manifest,
    ["red_lines", "long_lived_wide_scope_secrets_present"],
    "red line: no long-lived wide-scope secrets are present in the record");
  falseCheck(results, "red_lines",
    "zero_trust_design_free_of_unrevocable_access",
    manifest,
    ["red_lines", "unrevocable_access_present"],
    "red line: no unrevocable access is present in the record");
  falseCheck(results, "red_lines",
    "zero_trust_design_free_of_anonymous_east_west_access",
    manifest,
    ["red_lines", "anonymous_east_west_access_present"],
    "red line: no anonymous east-west access is present in the record — every service call is authenticated and authorized");

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
    verdict = "ZERO_TRUST_DESIGN_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "ZERO_TRUST_DESIGN_SOUND";
  }

  const computedNames = [
    "zero_trust_design_assets_list_declared",
    "every_zero_trust_design_asset_id_unique",
    "every_zero_trust_design_asset_name_declared",
    "every_zero_trust_design_asset_kind_recognised",
    "zero_trust_design_policies_list_declared",
    "every_zero_trust_design_policy_id_unique",
    "every_zero_trust_design_policy_name_declared",
    "every_zero_trust_design_policy_covers_at_least_one_asset",
    "every_zero_trust_design_policy_coverage_reference_resolves",
    "every_zero_trust_design_declared_asset_covered_by_policy",
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
    service: "zero-trust-architecture-design-pack",
    atom_version: "0.1.0",
    design_title: manifest["design_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    zero_trust_design_assets_count: assetsCount,
    zero_trust_design_policies_count: policiesCount,
    duplicate_zero_trust_design_asset_ids: duplicateAssetIds,
    duplicate_zero_trust_design_policy_ids: duplicatePolicyIds,
    zero_trust_design_assets_without_name: assetsWithoutName,
    zero_trust_design_assets_with_invalid_kind: assetsWithInvalidKind,
    zero_trust_design_policies_without_name: policiesWithoutName,
    zero_trust_design_policies_without_coverage: policiesWithoutCoverage,
    zero_trust_design_policy_refs_not_declared_as_assets: refsNotDeclared,
    zero_trust_design_assets_without_policy_coverage: assetsWithoutCoverage,
    zero_trust_design_policy_coverage_ratio: fmt6(coverageRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ZERO TRUST ARCHITECTURE DESIGN PACK",
    `design_title: ${pyStr(verdict.design_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
