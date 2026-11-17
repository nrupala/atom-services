// Service isolation hardening review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/service-isolation-hardening-review/src/service_isolation_hardening_review.py
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
  subject: "string",
  identity: {
    dedicated_non_login_system_user_per_isolated_service: "boolean",
    isolated_services_run_as_non_root: "boolean",
    cross_service_filesystem_access_denied_between_services: "boolean",
    per_service_capability_set_minimised: "boolean",
  },
  services: [{
    name: "string",
    dedicated_user_assigned: "boolean",
    filesystem_access_scoped: "boolean",
    egress_restricted: "boolean",
  }],
  systemd: {
    systemd_no_new_privileges_directive_set: "boolean",
    systemd_protect_system_strict_directive_set: "boolean",
    systemd_protect_home_directive_set: "boolean",
    systemd_private_tmp_directive_set: "boolean",
    systemd_dynamic_user_directive_set: "boolean",
    systemd_capability_bounding_set_directive_restricted: "boolean",
    systemd_system_call_filter_directive_applied: "boolean",
    systemd_restrict_address_families_directive_applied: "boolean",
    systemd_read_write_paths_directive_limited_to_required_paths: "boolean",
  },
  confinement: {
    sandbox_tool_used_for_one_off_untrusted_execution_isolation: "boolean",
    namespaces_provide_filesystem_and_network_separation_for_isolated_services: "boolean",
    mac_profile_confines_network_exposed_isolated_services: "boolean",
    mac_denials_audited_without_blanket_disabling_confinement: "boolean",
    wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation: "boolean",
    microvm_used_where_kernel_level_isolation_is_required: "boolean",
    windows_low_privilege_isolation_equivalents_applied_where_in_scope: "boolean",
    chroot_not_relied_upon_as_sole_service_isolation: "boolean",
  },
  resources: {
    cgroups_v2_cpu_memory_io_limits_set_for_isolated_services: "boolean",
    per_service_ulimits_configured_for_isolated_services: "boolean",
    execution_timeouts_configured_for_isolated_services: "boolean",
    restart_limits_configured_for_isolated_services: "boolean",
  },
  egress_monitoring: {
    outbound_egress_restricted_for_isolated_services_not_needing_world_access: "boolean",
    exec_and_spawn_events_logged_for_isolated_services: "boolean",
    per_service_kill_switch_available_for_isolated_services: "boolean",
  },
  verification: {
    runaway_service_behaviour_tested_against_resource_limits: "boolean",
    sandbox_escape_and_abuse_cases_exercised_for_isolated_services: "boolean",
    sandbox_blocking_verified_not_assumed_for_isolated_services: "boolean",
  },
  red_lines: {
    root_service_run_for_convenience_present: "boolean",
    host_wide_mounts_into_isolated_services_present: "boolean",
    sandbox_disabled_to_make_service_run_present: "boolean",
  },
};

export const SECTIONS = [
  "least_privilege_identity",
  "systemd_sandbox_directives",
  "confinement_and_sandbox_tools",
  "resource_containment",
  "egress_monitoring_and_kill_switch",
  "isolation_verification",
  "red_lines",
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
  subject: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  services_count: number | null;
  services_without_dedicated_user: string[] | null;
  services_without_filesystem_scope: string[] | null;
  services_without_egress_restriction: string[] | null;
  dedicated_user_coverage: string | null;
  filesystem_scope_coverage: string | null;
  egress_restriction_coverage: string | null;
  duplicate_service_names: string[] | null;
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

  const [servicesRaw, hasServices] = getPath(manifest, "services");
  const servicesIsList = hasServices && Array.isArray(servicesRaw);
  const rows: unknown[] = servicesIsList ? (servicesRaw as unknown[]) : [];
  const servicesCount: number | null = servicesIsList ? rows.length : null;

  const servicesWithoutDedicatedUser: string[] | null = servicesIsList
    ? rows.filter((c) => hasField(c, "dedicated_user_assigned") &&
        (c as Record<string, unknown>)["dedicated_user_assigned"] !== true)
        .map(rowName)
    : null;
  const servicesWithoutFilesystemScope: string[] | null = servicesIsList
    ? rows.filter((c) => hasField(c, "filesystem_access_scoped") &&
        (c as Record<string, unknown>)["filesystem_access_scoped"] !== true)
        .map(rowName)
    : null;
  const servicesWithoutEgressRestriction: string[] | null = servicesIsList
    ? rows.filter((c) => hasField(c, "egress_restricted") &&
        (c as Record<string, unknown>)["egress_restricted"] !== true)
        .map(rowName)
    : null;
  let duplicateServiceNames: string[] | null = null;
  if (servicesIsList) {
    const seen: string[] = [];
    duplicateServiceNames = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["name"] === "string") {
        const nm = c["name"] as string;
        if (seen.includes(nm) && !duplicateServiceNames.includes(nm)) {
          duplicateServiceNames.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const dedicatedUserCoverage: number | null =
    servicesIsList && servicesCount !== null && servicesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["dedicated_user_assigned"] === true).length / servicesCount
      : null;
  const filesystemScopeCoverage: number | null =
    servicesIsList && servicesCount !== null && servicesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["filesystem_access_scoped"] === true).length / servicesCount
      : null;
  const egressRestrictionCoverage: number | null =
    servicesIsList && servicesCount !== null && servicesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["egress_restricted"] === true).length / servicesCount
      : null;

  // ---- Section 1: least_privilege_identity ----
  boolCheck(results, "least_privilege_identity",
    "dedicated_non_login_system_user_per_isolated_service", manifest,
    ["identity", "dedicated_non_login_system_user_per_isolated_service"],
    "least-privilege accounts: one service, one non-login system user");
  boolCheck(results, "least_privilege_identity",
    "isolated_services_run_as_non_root", manifest,
    ["identity", "isolated_services_run_as_non_root"],
    "least-privilege accounts: services run non-root");
  boolCheck(results, "least_privilege_identity",
    "cross_service_filesystem_access_denied_between_services", manifest,
    ["identity", "cross_service_filesystem_access_denied_between_services"],
    "least-privilege accounts: no cross-service file access between services");
  boolCheck(results, "least_privilege_identity",
    "per_service_capability_set_minimised", manifest,
    ["identity", "per_service_capability_set_minimised"],
    "least-privilege accounts: each service's capability set is minimal");
  check(results, "least_privilege_identity",
    "isolated_services_roster_declared", servicesRaw, servicesIsList,
    servicesIsList,
    "the declared record rosters its isolated services — the services list is present; an empty list declares that the record rosters no services");
  const userPresent = servicesIsList &&
    rows.every((c) => hasField(c, "dedicated_user_assigned"));
  check(results, "least_privilege_identity",
    "every_rostered_service_has_dedicated_user_assignment", servicesRaw, userPresent,
    servicesIsList &&
      rows.every((c) => isPyDict(c) && c["dedicated_user_assigned"] === true),
    "rostered services: every declared service row declares a dedicated user assigned to it");
  const scopePresent = servicesIsList &&
    rows.every((c) => hasField(c, "filesystem_access_scoped"));
  check(results, "least_privilege_identity",
    "every_rostered_service_has_scoped_filesystem_access", servicesRaw, scopePresent,
    servicesIsList &&
      rows.every((c) => isPyDict(c) && c["filesystem_access_scoped"] === true),
    "rostered services: every declared service row declares its filesystem access scoped");
  const egressRowPresent = servicesIsList &&
    rows.every((c) => hasField(c, "egress_restricted"));
  check(results, "least_privilege_identity",
    "every_rostered_service_has_restricted_egress_declaration", servicesRaw, egressRowPresent,
    servicesIsList &&
      rows.every((c) => isPyDict(c) && c["egress_restricted"] === true),
    "rostered services: every declared service row declares its egress restricted");
  const namePresent = servicesIsList &&
    rows.every((c) => hasField(c, "name"));
  check(results, "least_privilege_identity",
    "no_rostered_service_name_duplicated", servicesRaw, namePresent,
    servicesIsList && duplicateServiceNames !== null &&
      duplicateServiceNames.length === 0,
    "rostered services: no declared service name is owned by more than one row");

  // ---- Section 2: systemd_sandbox_directives ----
  boolCheck(results, "systemd_sandbox_directives",
    "systemd_no_new_privileges_directive_set", manifest,
    ["systemd", "systemd_no_new_privileges_directive_set"],
    "systemd hardening: NoNewPrivileges is set");
  boolCheck(results, "systemd_sandbox_directives",
    "systemd_protect_system_strict_directive_set", manifest,
    ["systemd", "systemd_protect_system_strict_directive_set"],
    "systemd hardening: ProtectSystem=strict is set");
  boolCheck(results, "systemd_sandbox_directives",
    "systemd_protect_home_directive_set", manifest,
    ["systemd", "systemd_protect_home_directive_set"],
    "systemd hardening: ProtectHome is set");
  boolCheck(results, "systemd_sandbox_directives",
    "systemd_private_tmp_directive_set", manifest,
    ["systemd", "systemd_private_tmp_directive_set"],
    "systemd hardening: PrivateTmp is set");
  boolCheck(results, "systemd_sandbox_directives",
    "systemd_dynamic_user_directive_set", manifest,
    ["systemd", "systemd_dynamic_user_directive_set"],
    "systemd hardening: DynamicUser is set");
  boolCheck(results, "systemd_sandbox_directives",
    "systemd_capability_bounding_set_directive_restricted", manifest,
    ["systemd", "systemd_capability_bounding_set_directive_restricted"],
    "systemd hardening: CapabilityBoundingSet is restricted to what the service needs");
  boolCheck(results, "systemd_sandbox_directives",
    "systemd_system_call_filter_directive_applied", manifest,
    ["systemd", "systemd_system_call_filter_directive_applied"],
    "systemd hardening: SystemCallFilter is applied (the skill's @system-service class)");
  boolCheck(results, "systemd_sandbox_directives",
    "systemd_restrict_address_families_directive_applied", manifest,
    ["systemd", "systemd_restrict_address_families_directive_applied"],
    "systemd hardening: RestrictAddressFamilies is applied");
  boolCheck(results, "systemd_sandbox_directives",
    "systemd_read_write_paths_directive_limited_to_required_paths", manifest,
    ["systemd", "systemd_read_write_paths_directive_limited_to_required_paths"],
    "systemd hardening: ReadWritePaths names only what the service needs");

  // ---- Section 3: confinement_and_sandbox_tools ----
  boolCheck(results, "confinement_and_sandbox_tools",
    "sandbox_tool_used_for_one_off_untrusted_execution_isolation", manifest,
    ["confinement", "sandbox_tool_used_for_one_off_untrusted_execution_isolation"],
    "sandbox tools: a bubblewrap/nsjail/firejail-class sandbox tool is used for one-off untrusted execution");
  boolCheck(results, "confinement_and_sandbox_tools",
    "namespaces_provide_filesystem_and_network_separation_for_isolated_services", manifest,
    ["confinement", "namespaces_provide_filesystem_and_network_separation_for_isolated_services"],
    "sandbox tools: namespaces provide filesystem and network separation for the services");
  boolCheck(results, "confinement_and_sandbox_tools",
    "mac_profile_confines_network_exposed_isolated_services", manifest,
    ["confinement", "mac_profile_confines_network_exposed_isolated_services"],
    "MAC profiles: an AppArmor/SELinux profile confines anything exposed");
  boolCheck(results, "confinement_and_sandbox_tools",
    "mac_denials_audited_without_blanket_disabling_confinement", manifest,
    ["confinement", "mac_denials_audited_without_blanket_disabling_confinement"],
    "MAC profiles: denials are audited, not blanket-disabled");
  boolCheck(results, "confinement_and_sandbox_tools",
    "wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation", manifest,
    ["confinement", "wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation"],
    "WASM/WASI: untrusted plugin logic runs under WASM/WASI isolation");
  boolCheck(results, "confinement_and_sandbox_tools",
    "microvm_used_where_kernel_level_isolation_is_required", manifest,
    ["confinement", "microvm_used_where_kernel_level_isolation_is_required"],
    "microVMs: a Firecracker-class microVM is used where kernel isolation is the requirement");
  boolCheck(results, "confinement_and_sandbox_tools",
    "windows_low_privilege_isolation_equivalents_applied_where_in_scope", manifest,
    ["confinement", "windows_low_privilege_isolation_equivalents_applied_where_in_scope"],
    "Windows equivalents: where Windows services are in scope, dedicated low-privilege accounts, AppContainer, Windows Sandbox and Job Objects are applied as the equivalents");
  boolCheck(results, "confinement_and_sandbox_tools",
    "chroot_not_relied_upon_as_sole_service_isolation", manifest,
    ["confinement", "chroot_not_relied_upon_as_sole_service_isolation"],
    "sandbox tools: chroot is not relied upon as the sole isolation mechanism (the skill: chroot only with care, given its classic escape history)");

  // ---- Section 4: resource_containment ----
  boolCheck(results, "resource_containment",
    "cgroups_v2_cpu_memory_io_limits_set_for_isolated_services", manifest,
    ["resources", "cgroups_v2_cpu_memory_io_limits_set_for_isolated_services"],
    "resource limits: cgroups v2 CPU, memory and IO limits are set");
  boolCheck(results, "resource_containment",
    "per_service_ulimits_configured_for_isolated_services", manifest,
    ["resources", "per_service_ulimits_configured_for_isolated_services"],
    "resource limits: per-service ulimits are configured");
  boolCheck(results, "resource_containment",
    "execution_timeouts_configured_for_isolated_services", manifest,
    ["resources", "execution_timeouts_configured_for_isolated_services"],
    "resource limits: execution timeouts are configured");
  boolCheck(results, "resource_containment",
    "restart_limits_configured_for_isolated_services", manifest,
    ["resources", "restart_limits_configured_for_isolated_services"],
    "resource limits: restart limits are configured");

  // ---- Section 5: egress_monitoring_and_kill_switch ----
  boolCheck(results, "egress_monitoring_and_kill_switch",
    "outbound_egress_restricted_for_isolated_services_not_needing_world_access", manifest,
    ["egress_monitoring", "outbound_egress_restricted_for_isolated_services_not_needing_world_access"],
    "egress: outbound access is restricted where the service doesn't need the world");
  boolCheck(results, "egress_monitoring_and_kill_switch",
    "exec_and_spawn_events_logged_for_isolated_services", manifest,
    ["egress_monitoring", "exec_and_spawn_events_logged_for_isolated_services"],
    "monitoring: exec/spawn events are logged");
  boolCheck(results, "egress_monitoring_and_kill_switch",
    "per_service_kill_switch_available_for_isolated_services", manifest,
    ["egress_monitoring", "per_service_kill_switch_available_for_isolated_services"],
    "monitoring: a kill switch exists per service");

  // ---- Section 6: isolation_verification ----
  boolCheck(results, "isolation_verification",
    "runaway_service_behaviour_tested_against_resource_limits", manifest,
    ["verification", "runaway_service_behaviour_tested_against_resource_limits"],
    "quality gates: runaway behaviour is tested — a runaway kills itself, not the host");
  boolCheck(results, "isolation_verification",
    "sandbox_escape_and_abuse_cases_exercised_for_isolated_services", manifest,
    ["verification", "sandbox_escape_and_abuse_cases_exercised_for_isolated_services"],
    "quality gates: escape and abuse cases are exercised against the sandbox");
  boolCheck(results, "isolation_verification",
    "sandbox_blocking_verified_not_assumed_for_isolated_services", manifest,
    ["verification", "sandbox_blocking_verified_not_assumed_for_isolated_services"],
    "quality gates: the sandbox is verified to actually block, not assumed to");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "no_root_isolated_service_run_for_convenience", manifest,
    ["red_lines", "root_service_run_for_convenience_present"],
    "red line: no root service run \"for convenience\" is present in the record");
  falseCheck(results, "red_lines",
    "no_host_wide_mounts_into_isolated_services", manifest,
    ["red_lines", "host_wide_mounts_into_isolated_services_present"],
    "red line: no host-wide mounts into isolated services are present in the record");
  falseCheck(results, "red_lines",
    "no_sandbox_disabled_to_make_isolated_service_run", manifest,
    ["red_lines", "sandbox_disabled_to_make_service_run_present"],
    "red line: no sandbox disabled to make something run is present in the record — the permission design is fixed instead");

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
    verdict = "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED";
  }

  const computedNames = [
    "isolated_services_roster_declared",
    "every_rostered_service_has_dedicated_user_assignment",
    "every_rostered_service_has_scoped_filesystem_access",
    "every_rostered_service_has_restricted_egress_declaration",
    "no_rostered_service_name_duplicated",
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
    service: "service-isolation-hardening-review",
    atom_version: "0.1.0",
    subject: manifest["subject"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    services_count: servicesCount,
    services_without_dedicated_user: servicesWithoutDedicatedUser,
    services_without_filesystem_scope: servicesWithoutFilesystemScope,
    services_without_egress_restriction: servicesWithoutEgressRestriction,
    dedicated_user_coverage: fmt6(dedicatedUserCoverage),
    filesystem_scope_coverage: fmt6(filesystemScopeCoverage),
    egress_restriction_coverage: fmt6(egressRestrictionCoverage),
    duplicate_service_names: duplicateServiceNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "SERVICE ISOLATION HARDENING REVIEW",
    `subject: ${pyStr(verdict.subject ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
