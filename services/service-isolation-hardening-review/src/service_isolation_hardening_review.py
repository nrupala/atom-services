#!/usr/bin/env python3
"""Service isolation hardening review — deterministic core.

Built from the bound skill `non-docker-isolation`: "Isolate
services and untrusted code without Docker — systemd
hardening, sandboxes, WASM, least privilege." ("House rule: no
Docker in application code; systemd services on owned machines
are the default. Isolation still matters — do it with the OS,
not a daemon.")

This atom is a REVIEW of a declared service-isolation record:
it audits the record a caller declares against the practice
the skill defines — one non-login system user per service with
services running non-root and no cross-service file access,
the systemd hardening directive set, sandbox tools and
namespaces for untrusted execution with MAC confinement,
resource limits so a runaway kills itself and not the host,
restricted egress with exec/spawn logging and a per-service
kill switch, and exercised escape/abuse cases — plus the
skill's red lines refused. It does not probe a live system,
read a unit file, inspect a process, run a sandbox, test an
escape, or verify that any declared hardening was ever applied
— it checks that the isolation record the skill requires is
present and internally complete and consistent on the declared
evidence.

Distinct ground: the nearest siblings are
`zero-trust-evaluation-verdict` (a verdict on a zero-trust
claim and its evaluation pack), `tested-authorization-policy-pack`
(a declared authorization policy and its tests),
`firewall-rules-audit` (declared firewall rule rows — default
policies, rule shadowing, port ranges) and
`confidential-computing-design` (a declared confidential-
computing design — enclaves, attestation). This atom shares
zero checks with any of them: every check here is a service-
isolation question — a dedicated non-login user per rostered
service, the named systemd directives (NoNewPrivileges,
ProtectSystem=strict, ProtectHome, PrivateTmp, DynamicUser,
CapabilityBoundingSet, SystemCallFilter, RestrictAddressFamilies,
ReadWritePaths), bubblewrap/nsjail/firejail-class sandboxing
with namespace separation, AppArmor/SELinux confinement with
denials audited rather than disabled, WASM/WASI for untrusted
plugin logic and microVMs where kernel isolation is required,
cgroups v2 limits with timeouts and restart limits, a
per-service kill switch, exercised sandbox-escape cases, and
the isolation red lines (no root service for convenience, no
host-wide mounts, never disable the sandbox to make something
run). The boundary is: how declared services are isolated from
the host and each other here; trust claims, authorization
policy, firewall rules and enclave design there.

The caller submits an isolation manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- rostered services: the declared `services` list must be
  present (an empty list is a valid declaration — the record
  rosters no services, and the per-service completeness checks
  below pass vacuously on it; the skill requires no minimum
  fleet size), and every declared service row must declare a
  dedicated user assigned, filesystem access scoped, and
  egress restricted (the skill: "one service, one non-login
  system user; no cross-service file access", "restrict
  outbound");
- service-name ownership: no declared service name may be
  owned by more than one row (one record per service —
  internal consistency of the declared rows).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold at all — no CPU, memory
or IO quota, no timeout duration, no restart count, no egress
destination count, no escape-test count — so no numeric
threshold check is invented; those quantities are caller
attestations at most, and quantities here are computed and
reported, with completeness (every declared service row) as
the only bar, exactly as stated above.

Verdict:
- any fail             -> SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "least_privilege_identity",
    "systemd_sandbox_directives",
    "confinement_and_sandbox_tools",
    "resource_containment",
    "egress_monitoring_and_kill_switch",
    "isolation_verification",
    "red_lines",
)

MANIFEST_SPEC = {
    "subject": "string",
    "identity": {
        "dedicated_non_login_system_user_per_isolated_service": "boolean",
        "isolated_services_run_as_non_root": "boolean",
        "cross_service_filesystem_access_denied_between_services": "boolean",
        "per_service_capability_set_minimised": "boolean",
    },
    "services": [{
        "name": "string",
        "dedicated_user_assigned": "boolean",
        "filesystem_access_scoped": "boolean",
        "egress_restricted": "boolean",
    }],
    "systemd": {
        "systemd_no_new_privileges_directive_set": "boolean",
        "systemd_protect_system_strict_directive_set": "boolean",
        "systemd_protect_home_directive_set": "boolean",
        "systemd_private_tmp_directive_set": "boolean",
        "systemd_dynamic_user_directive_set": "boolean",
        "systemd_capability_bounding_set_directive_restricted": "boolean",
        "systemd_system_call_filter_directive_applied": "boolean",
        "systemd_restrict_address_families_directive_applied": "boolean",
        "systemd_read_write_paths_directive_limited_to_required_paths": "boolean",
    },
    "confinement": {
        "sandbox_tool_used_for_one_off_untrusted_execution_isolation": "boolean",
        "namespaces_provide_filesystem_and_network_separation_for_isolated_services": "boolean",
        "mac_profile_confines_network_exposed_isolated_services": "boolean",
        "mac_denials_audited_without_blanket_disabling_confinement": "boolean",
        "wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation": "boolean",
        "microvm_used_where_kernel_level_isolation_is_required": "boolean",
        "windows_low_privilege_isolation_equivalents_applied_where_in_scope": "boolean",
        "chroot_not_relied_upon_as_sole_service_isolation": "boolean",
    },
    "resources": {
        "cgroups_v2_cpu_memory_io_limits_set_for_isolated_services": "boolean",
        "per_service_ulimits_configured_for_isolated_services": "boolean",
        "execution_timeouts_configured_for_isolated_services": "boolean",
        "restart_limits_configured_for_isolated_services": "boolean",
    },
    "egress_monitoring": {
        "outbound_egress_restricted_for_isolated_services_not_needing_world_access": "boolean",
        "exec_and_spawn_events_logged_for_isolated_services": "boolean",
        "per_service_kill_switch_available_for_isolated_services": "boolean",
    },
    "verification": {
        "runaway_service_behaviour_tested_against_resource_limits": "boolean",
        "sandbox_escape_and_abuse_cases_exercised_for_isolated_services": "boolean",
        "sandbox_blocking_verified_not_assumed_for_isolated_services": "boolean",
    },
    "red_lines": {
        "root_service_run_for_convenience_present": "boolean",
        "host_wide_mounts_into_isolated_services_present": "boolean",
        "sandbox_disabled_to_make_service_run_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for a service isolation manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    services, has_services = _get(manifest, "services")
    services_is_list = has_services and isinstance(services, list)
    services_count = len(services) if services_is_list else None
    rows = services if services_is_list else []

    services_without_dedicated_user = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "dedicated_user_assigned" in c
         and c.get("dedicated_user_assigned") is not True]
        if services_is_list else None
    )
    services_without_filesystem_scope = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "filesystem_access_scoped" in c
         and c.get("filesystem_access_scoped") is not True]
        if services_is_list else None
    )
    services_without_egress_restriction = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "egress_restricted" in c
         and c.get("egress_restricted") is not True]
        if services_is_list else None
    )
    duplicate_service_names = None
    if services_is_list:
        seen = []
        duplicate_service_names = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("name"), str):
                nm = c["name"]
                if nm in seen and nm not in duplicate_service_names:
                    duplicate_service_names.append(nm)
                seen.append(nm)
    dedicated_user_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("dedicated_user_assigned") is True)
        / services_count
        if services_is_list and services_count > 0 else None
    )
    filesystem_scope_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("filesystem_access_scoped") is True)
        / services_count
        if services_is_list and services_count > 0 else None
    )
    egress_restriction_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("egress_restricted") is True)
        / services_count
        if services_is_list and services_count > 0 else None
    )

    # ---- Section 1: least_privilege_identity (skill Method 1
    #      "Least-privilege accounts" — one service, one
    #      non-login system user; no cross-service file access;
    #      plus the quality gate's services run non-root with
    #      minimal capabilities; plus the computed per-service
    #      roster checks over the declared rows) ----
    _bool_check(results, "least_privilege_identity",
                "dedicated_non_login_system_user_per_isolated_service",
                manifest,
                ("identity",
                 "dedicated_non_login_system_user_per_isolated_service"),
                "least-privilege accounts: one service, one "
                "non-login system user")
    _bool_check(results, "least_privilege_identity",
                "isolated_services_run_as_non_root", manifest,
                ("identity", "isolated_services_run_as_non_root"),
                "least-privilege accounts: services run non-root")
    _bool_check(results, "least_privilege_identity",
                "cross_service_filesystem_access_denied_between_services",
                manifest,
                ("identity",
                 "cross_service_filesystem_access_denied_between_services"),
                "least-privilege accounts: no cross-service file "
                "access between services")
    _bool_check(results, "least_privilege_identity",
                "per_service_capability_set_minimised", manifest,
                ("identity", "per_service_capability_set_minimised"),
                "least-privilege accounts: each service's "
                "capability set is minimal")
    _check(results, "least_privilege_identity",
           "isolated_services_roster_declared", services,
           services_is_list, services_is_list,
           "the declared record rosters its isolated services — "
           "the services list is present; an empty list declares "
           "that the record rosters no services")
    user_present = (
        services_is_list
        and all(isinstance(c, dict) and "dedicated_user_assigned" in c
                for c in rows)
    )
    _check(results, "least_privilege_identity",
           "every_rostered_service_has_dedicated_user_assignment",
           services, user_present,
           services_is_list
           and all(isinstance(c, dict)
                   and c.get("dedicated_user_assigned") is True
                   for c in rows),
           "rostered services: every declared service row "
           "declares a dedicated user assigned to it")
    scope_present = (
        services_is_list
        and all(isinstance(c, dict) and "filesystem_access_scoped" in c
                for c in rows)
    )
    _check(results, "least_privilege_identity",
           "every_rostered_service_has_scoped_filesystem_access",
           services, scope_present,
           services_is_list
           and all(isinstance(c, dict)
                   and c.get("filesystem_access_scoped") is True
                   for c in rows),
           "rostered services: every declared service row "
           "declares its filesystem access scoped")
    egress_row_present = (
        services_is_list
        and all(isinstance(c, dict) and "egress_restricted" in c
                for c in rows)
    )
    _check(results, "least_privilege_identity",
           "every_rostered_service_has_restricted_egress_declaration",
           services, egress_row_present,
           services_is_list
           and all(isinstance(c, dict)
                   and c.get("egress_restricted") is True
                   for c in rows),
           "rostered services: every declared service row "
           "declares its egress restricted")
    name_present = (
        services_is_list
        and all(isinstance(c, dict) and "name" in c for c in rows)
    )
    _check(results, "least_privilege_identity",
           "no_rostered_service_name_duplicated", services,
           name_present,
           services_is_list
           and duplicate_service_names is not None
           and len(duplicate_service_names) == 0,
           "rostered services: no declared service name is owned "
           "by more than one row")

    # ---- Section 2: systemd_sandbox_directives (skill Method 2
    #      "systemd hardening" — the named directive set, the
    #      Linux default on owned machines) ----
    _bool_check(results, "systemd_sandbox_directives",
                "systemd_no_new_privileges_directive_set", manifest,
                ("systemd", "systemd_no_new_privileges_directive_set"),
                "systemd hardening: NoNewPrivileges is set")
    _bool_check(results, "systemd_sandbox_directives",
                "systemd_protect_system_strict_directive_set", manifest,
                ("systemd",
                 "systemd_protect_system_strict_directive_set"),
                "systemd hardening: ProtectSystem=strict is set")
    _bool_check(results, "systemd_sandbox_directives",
                "systemd_protect_home_directive_set", manifest,
                ("systemd", "systemd_protect_home_directive_set"),
                "systemd hardening: ProtectHome is set")
    _bool_check(results, "systemd_sandbox_directives",
                "systemd_private_tmp_directive_set", manifest,
                ("systemd", "systemd_private_tmp_directive_set"),
                "systemd hardening: PrivateTmp is set")
    _bool_check(results, "systemd_sandbox_directives",
                "systemd_dynamic_user_directive_set", manifest,
                ("systemd", "systemd_dynamic_user_directive_set"),
                "systemd hardening: DynamicUser is set")
    _bool_check(results, "systemd_sandbox_directives",
                "systemd_capability_bounding_set_directive_restricted",
                manifest,
                ("systemd",
                 "systemd_capability_bounding_set_directive_restricted"),
                "systemd hardening: CapabilityBoundingSet is "
                "restricted to what the service needs")
    _bool_check(results, "systemd_sandbox_directives",
                "systemd_system_call_filter_directive_applied", manifest,
                ("systemd",
                 "systemd_system_call_filter_directive_applied"),
                "systemd hardening: SystemCallFilter is applied "
                "(the skill's @system-service class)")
    _bool_check(results, "systemd_sandbox_directives",
                "systemd_restrict_address_families_directive_applied",
                manifest,
                ("systemd",
                 "systemd_restrict_address_families_directive_applied"),
                "systemd hardening: RestrictAddressFamilies is "
                "applied")
    _bool_check(results, "systemd_sandbox_directives",
                "systemd_read_write_paths_directive_limited_to_required_paths",
                manifest,
                ("systemd",
                 "systemd_read_write_paths_directive_limited_to_required_paths"),
                "systemd hardening: ReadWritePaths names only "
                "what the service needs")

    # ---- Section 3: confinement_and_sandbox_tools (skill
    #      Method 3 "Sandbox tools", Method 4 "MAC profiles",
    #      Method 6 "WASM/WASI" and microVMs, and Method 7
    #      "Windows equivalents") ----
    _bool_check(results, "confinement_and_sandbox_tools",
                "sandbox_tool_used_for_one_off_untrusted_execution_isolation",
                manifest,
                ("confinement",
                 "sandbox_tool_used_for_one_off_untrusted_execution_isolation"),
                "sandbox tools: a bubblewrap/nsjail/firejail-class "
                "sandbox tool is used for one-off untrusted "
                "execution")
    _bool_check(results, "confinement_and_sandbox_tools",
                "namespaces_provide_filesystem_and_network_separation_for_isolated_services",
                manifest,
                ("confinement",
                 "namespaces_provide_filesystem_and_network_separation_for_isolated_services"),
                "sandbox tools: namespaces provide filesystem "
                "and network separation for the services")
    _bool_check(results, "confinement_and_sandbox_tools",
                "mac_profile_confines_network_exposed_isolated_services",
                manifest,
                ("confinement",
                 "mac_profile_confines_network_exposed_isolated_services"),
                "MAC profiles: an AppArmor/SELinux profile "
                "confines anything exposed")
    _bool_check(results, "confinement_and_sandbox_tools",
                "mac_denials_audited_without_blanket_disabling_confinement",
                manifest,
                ("confinement",
                 "mac_denials_audited_without_blanket_disabling_confinement"),
                "MAC profiles: denials are audited, not "
                "blanket-disabled")
    _bool_check(results, "confinement_and_sandbox_tools",
                "wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation",
                manifest,
                ("confinement",
                 "wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation"),
                "WASM/WASI: untrusted plugin logic runs under "
                "WASM/WASI isolation")
    _bool_check(results, "confinement_and_sandbox_tools",
                "microvm_used_where_kernel_level_isolation_is_required",
                manifest,
                ("confinement",
                 "microvm_used_where_kernel_level_isolation_is_required"),
                "microVMs: a Firecracker-class microVM is used "
                "where kernel isolation is the requirement")
    _bool_check(results, "confinement_and_sandbox_tools",
                "windows_low_privilege_isolation_equivalents_applied_where_in_scope",
                manifest,
                ("confinement",
                 "windows_low_privilege_isolation_equivalents_applied_where_in_scope"),
                "Windows equivalents: where Windows services are "
                "in scope, dedicated low-privilege accounts, "
                "AppContainer, Windows Sandbox and Job Objects "
                "are applied as the equivalents")
    _bool_check(results, "confinement_and_sandbox_tools",
                "chroot_not_relied_upon_as_sole_service_isolation",
                manifest,
                ("confinement",
                 "chroot_not_relied_upon_as_sole_service_isolation"),
                "sandbox tools: chroot is not relied upon as the "
                "sole isolation mechanism (the skill: chroot only "
                "with care, given its classic escape history)")

    # ---- Section 4: resource_containment (skill Method 5
    #      "Resource limits" — cgroups v2, ulimit, timeouts,
    #      restart limits; a runaway should kill itself, not
    #      the host) ----
    _bool_check(results, "resource_containment",
                "cgroups_v2_cpu_memory_io_limits_set_for_isolated_services",
                manifest,
                ("resources",
                 "cgroups_v2_cpu_memory_io_limits_set_for_isolated_services"),
                "resource limits: cgroups v2 CPU, memory and IO "
                "limits are set")
    _bool_check(results, "resource_containment",
                "per_service_ulimits_configured_for_isolated_services",
                manifest,
                ("resources",
                 "per_service_ulimits_configured_for_isolated_services"),
                "resource limits: per-service ulimits are "
                "configured")
    _bool_check(results, "resource_containment",
                "execution_timeouts_configured_for_isolated_services",
                manifest,
                ("resources",
                 "execution_timeouts_configured_for_isolated_services"),
                "resource limits: execution timeouts are "
                "configured")
    _bool_check(results, "resource_containment",
                "restart_limits_configured_for_isolated_services",
                manifest,
                ("resources",
                 "restart_limits_configured_for_isolated_services"),
                "resource limits: restart limits are configured")

    # ---- Section 5: egress_monitoring_and_kill_switch (skill
    #      Method 8 "Egress + monitoring" — restrict outbound;
    #      log exec/spawn events; a kill switch per service;
    #      plus the quality gate's egress restricted where the
    #      service doesn't need the world) ----
    _bool_check(results, "egress_monitoring_and_kill_switch",
                "outbound_egress_restricted_for_isolated_services_not_needing_world_access",
                manifest,
                ("egress_monitoring",
                 "outbound_egress_restricted_for_isolated_services_not_needing_world_access"),
                "egress: outbound access is restricted where the "
                "service doesn't need the world")
    _bool_check(results, "egress_monitoring_and_kill_switch",
                "exec_and_spawn_events_logged_for_isolated_services",
                manifest,
                ("egress_monitoring",
                 "exec_and_spawn_events_logged_for_isolated_services"),
                "monitoring: exec/spawn events are logged")
    _bool_check(results, "egress_monitoring_and_kill_switch",
                "per_service_kill_switch_available_for_isolated_services",
                manifest,
                ("egress_monitoring",
                 "per_service_kill_switch_available_for_isolated_services"),
                "monitoring: a kill switch exists per service")

    # ---- Section 6: isolation_verification (skill "Quality
    #      gates" — resource limits set with runaway behaviour
    #      tested; escape/abuse cases exercised, the sandbox
    #      actually blocks) ----
    _bool_check(results, "isolation_verification",
                "runaway_service_behaviour_tested_against_resource_limits",
                manifest,
                ("verification",
                 "runaway_service_behaviour_tested_against_resource_limits"),
                "quality gates: runaway behaviour is tested — a "
                "runaway kills itself, not the host")
    _bool_check(results, "isolation_verification",
                "sandbox_escape_and_abuse_cases_exercised_for_isolated_services",
                manifest,
                ("verification",
                 "sandbox_escape_and_abuse_cases_exercised_for_isolated_services"),
                "quality gates: escape and abuse cases are "
                "exercised against the sandbox")
    _bool_check(results, "isolation_verification",
                "sandbox_blocking_verified_not_assumed_for_isolated_services",
                manifest,
                ("verification",
                 "sandbox_blocking_verified_not_assumed_for_isolated_services"),
                "quality gates: the sandbox is verified to "
                "actually block, not assumed to")

    # ---- Section 7: red_lines (skill "Red lines" — no root
    #      services "for convenience"; no host-wide mounts;
    #      never disable the sandbox to make something run) ----
    _false_check(results, "red_lines",
                 "no_root_isolated_service_run_for_convenience", manifest,
                 ("red_lines", "root_service_run_for_convenience_present"),
                 "red line: no root service run \"for convenience\" "
                 "is present in the record")
    _false_check(results, "red_lines",
                 "no_host_wide_mounts_into_isolated_services", manifest,
                 ("red_lines",
                  "host_wide_mounts_into_isolated_services_present"),
                 "red line: no host-wide mounts into isolated "
                 "services are present in the record")
    _false_check(results, "red_lines",
                 "no_sandbox_disabled_to_make_isolated_service_run",
                 manifest,
                 ("red_lines", "sandbox_disabled_to_make_service_run_present"),
                 "red line: no sandbox disabled to make something "
                 "run is present in the record — the permission "
                 "design is fixed instead")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED"

    computed_names = (
        "isolated_services_roster_declared",
        "every_rostered_service_has_dedicated_user_assignment",
        "every_rostered_service_has_scoped_filesystem_access",
        "every_rostered_service_has_restricted_egress_declaration",
        "no_rostered_service_name_duplicated",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "service-isolation-hardening-review",
        "atom_version": "0.1.0",
        "subject": manifest.get("subject"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "services_count": services_count,
        "services_without_dedicated_user": services_without_dedicated_user,
        "services_without_filesystem_scope": services_without_filesystem_scope,
        "services_without_egress_restriction": services_without_egress_restriction,
        "dedicated_user_coverage": _fmt6(dedicated_user_coverage),
        "filesystem_scope_coverage": _fmt6(filesystem_scope_coverage),
        "egress_restriction_coverage": _fmt6(egress_restriction_coverage),
        "duplicate_service_names": duplicate_service_names,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "SERVICE ISOLATION HARDENING REVIEW",
        f"subject: {verdict.get('subject')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: service_isolation_hardening_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
