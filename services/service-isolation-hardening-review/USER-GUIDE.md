# Service isolation hardening review — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are isolating services and untrusted code on a host or fleet — dedicated non-login system users, systemd sandbox directives, confinement, resource limits, egress control — and you have a declared record of that hardening. This atom reads one declared manifest and returns one deterministic verdict across seven sections (least_privilege_identity, systemd_sandbox_directives, confinement_and_sandbox_tools, resource_containment, egress_monitoring_and_kill_switch, isolation_verification, red_lines): **SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED**, **SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 39 checks. It audits the declared service-isolation record's completeness and consistency only — it probes no live system, reads no unit file, inspects no process, namespace, cgroup or MAC profile, runs no sandbox or escape test, and does not verify that any declared hardening was ever applied. A fleet is hardened *on your declared evidence*: it never judges whether a declared directive is correctly valued in the real unit file, whether a MAC profile is well-written, whether an escape case was competently designed, or whether the isolation design is adequate for the real threat. It is not a penetration test, a sandbox-escape assessment, a host audit, or a guarantee that any service is actually isolated, and it gives no recommendation and no remediation instruction. The computed checks: the declared `services` list must be present (an empty list passes — it declares that the record rosters no services); every declared service row must declare `dedicated_user_assigned` true (one service, one non-login system user); every declared service row must declare `filesystem_access_scoped` true (no cross-service file access); every declared service row must declare `egress_restricted` true (restrict outbound); and no declared service `name` may appear on more than one row — under the same absent/false/vacuous rules for each (a row with the field absent is missing evidence; a row declaring it false fails; on an empty list the check passes vacuously). No numeric threshold is imposed — no CPU, memory or IO quota value under cgroups v2, or percentage-of-host resource bar; no timeout duration in seconds; no restart limit count or restart interval; no ulimit value for any resource; no egress destination count, or named list of permitted destinations beyond restricted-as-declared; no number of escape/abuse cases that must be exercised, or pass rate for them; no MAC denial count or audit frequency; no syscall list beyond the skill's own `@system-service` filter class as declared; no capability list beyond minimal / bounding-set-restricted as declared; no `ReadWritePaths` path count beyond only-what's-needed as declared; no log-retention period for exec/spawn events; no minimum number of rostered services; no criterion for when kernel isolation is "required" beyond your declaration that a microVM is used where it is; and no rule for when Windows equivalents are in scope beyond your declaration. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "service-isolation-hardening-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/service-isolation-hardening-review` — tool name `service_isolation_hardening_review`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/service-isolation-hardening-review` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `subject` | Subject name (string; carried into the output, not checked) |
| `identity.dedicated_non_login_system_user_per_isolated_service` | least-privilege evidence: one dedicated non-login system user per isolated service |
| `identity.isolated_services_run_as_non_root` | least-privilege evidence: isolated services run as non-root |
| `identity.cross_service_filesystem_access_denied_between_services` | least-privilege evidence: cross-service filesystem access is denied between services |
| `identity.per_service_capability_set_minimised` | least-privilege evidence: the per-service capability set is minimised |
| `services` (list of service-row objects) | computed: must be present (an empty list declares that the record rosters no services); reported as `services_count` |
| `services[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row |
| `services[].dedicated_user_assigned` | computed: must be `true` per row (a dedicated user is assigned) |
| `services[].filesystem_access_scoped` | computed: must be `true` per row (filesystem access is scoped) |
| `services[].egress_restricted` | computed: must be `true` per row (egress is restricted) |
| `systemd.systemd_no_new_privileges_directive_set` | systemd evidence: the `NoNewPrivileges` directive is set |
| `systemd.systemd_protect_system_strict_directive_set` | systemd evidence: the `ProtectSystem=strict` directive is set |
| `systemd.systemd_protect_home_directive_set` | systemd evidence: the `ProtectHome` directive is set |
| `systemd.systemd_private_tmp_directive_set` | systemd evidence: the `PrivateTmp` directive is set |
| `systemd.systemd_dynamic_user_directive_set` | systemd evidence: the `DynamicUser` directive is set |
| `systemd.systemd_capability_bounding_set_directive_restricted` | systemd evidence: the `CapabilityBoundingSet=` directive is restricted |
| `systemd.systemd_system_call_filter_directive_applied` | systemd evidence: the `SystemCallFilter` directive is applied |
| `systemd.systemd_restrict_address_families_directive_applied` | systemd evidence: the `RestrictAddressFamilies` directive is applied |
| `systemd.systemd_read_write_paths_directive_limited_to_required_paths` | systemd evidence: the `ReadWritePaths=` directive is limited to required paths |
| `confinement.sandbox_tool_used_for_one_off_untrusted_execution_isolation` | confinement evidence: a sandbox tool is used for one-off untrusted execution isolation |
| `confinement.namespaces_provide_filesystem_and_network_separation_for_isolated_services` | confinement evidence: namespaces provide filesystem and network separation for isolated services |
| `confinement.mac_profile_confines_network_exposed_isolated_services` | confinement evidence: a MAC profile confines network-exposed isolated services |
| `confinement.mac_denials_audited_without_blanket_disabling_confinement` | confinement evidence: MAC denials are audited without blanket-disabling confinement |
| `confinement.wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation` | confinement evidence: a WASM/WASI runtime is used for untrusted plugin logic isolation |
| `confinement.microvm_used_where_kernel_level_isolation_is_required` | confinement evidence: a microVM is used where kernel-level isolation is required |
| `confinement.windows_low_privilege_isolation_equivalents_applied_where_in_scope` | confinement evidence: Windows low-privilege isolation equivalents are applied where in scope |
| `confinement.chroot_not_relied_upon_as_sole_service_isolation` | confinement evidence: chroot is not relied upon as the sole service isolation |
| `resources.cgroups_v2_cpu_memory_io_limits_set_for_isolated_services` | resource evidence: cgroups v2 CPU, memory and IO limits are set for isolated services |
| `resources.per_service_ulimits_configured_for_isolated_services` | resource evidence: per-service ulimits are configured for isolated services |
| `resources.execution_timeouts_configured_for_isolated_services` | resource evidence: execution timeouts are configured for isolated services |
| `resources.restart_limits_configured_for_isolated_services` | resource evidence: restart limits are configured for isolated services |
| `egress_monitoring.outbound_egress_restricted_for_isolated_services_not_needing_world_access` | egress evidence: outbound egress is restricted for isolated services not needing world access |
| `egress_monitoring.exec_and_spawn_events_logged_for_isolated_services` | monitoring evidence: exec and spawn events are logged for isolated services |
| `egress_monitoring.per_service_kill_switch_available_for_isolated_services` | monitoring evidence: a per-service kill switch is available for isolated services |
| `verification.runaway_service_behaviour_tested_against_resource_limits` | verification evidence: runaway service behaviour is tested against resource limits |
| `verification.sandbox_escape_and_abuse_cases_exercised_for_isolated_services` | verification evidence: sandbox escape and abuse cases are exercised for isolated services |
| `verification.sandbox_blocking_verified_not_assumed_for_isolated_services` | verification evidence: sandbox blocking is verified, not assumed, for isolated services |
| `red_lines.root_service_run_for_convenience_present` | must be `false` to pass (red line: no root service run for convenience) |
| `red_lines.host_wide_mounts_into_isolated_services_present` | must be `false` to pass (red line: no host-wide mounts into isolated services) |
| `red_lines.sandbox_disabled_to_make_service_run_present` | must be `false` to pass (red line: no sandbox disabled to make a service run) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/service-isolation-hardening-review`:

```json
{
  "subject": "production-fleet-alpha",
  "identity": {
    "dedicated_non_login_system_user_per_isolated_service": true,
    "isolated_services_run_as_non_root": true,
    "cross_service_filesystem_access_denied_between_services": true,
    "per_service_capability_set_minimised": true
  },
  "services": [
    {
      "name": "auth-svc",
      "dedicated_user_assigned": true,
      "filesystem_access_scoped": true,
      "egress_restricted": true
    }
  ],
  "systemd": {
    "systemd_no_new_privileges_directive_set": true,
    "systemd_protect_system_strict_directive_set": true,
    "systemd_protect_home_directive_set": true,
    "systemd_private_tmp_directive_set": true,
    "systemd_dynamic_user_directive_set": true,
    "systemd_capability_bounding_set_directive_restricted": true,
    "systemd_system_call_filter_directive_applied": true,
    "systemd_restrict_address_families_directive_applied": true,
    "systemd_read_write_paths_directive_limited_to_required_paths": true
  },
  "confinement": {
    "sandbox_tool_used_for_one_off_untrusted_execution_isolation": true,
    "namespaces_provide_filesystem_and_network_separation_for_isolated_services": true,
    "mac_profile_confines_network_exposed_isolated_services": true,
    "mac_denials_audited_without_blanket_disabling_confinement": true,
    "wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation": true,
    "microvm_used_where_kernel_level_isolation_is_required": true,
    "windows_low_privilege_isolation_equivalents_applied_where_in_scope": true,
    "chroot_not_relied_upon_as_sole_service_isolation": true
  },
  "resources": {
    "cgroups_v2_cpu_memory_io_limits_set_for_isolated_services": true,
    "per_service_ulimits_configured_for_isolated_services": true,
    "execution_timeouts_configured_for_isolated_services": true,
    "restart_limits_configured_for_isolated_services": true
  },
  "egress_monitoring": {
    "outbound_egress_restricted_for_isolated_services_not_needing_world_access": true,
    "exec_and_spawn_events_logged_for_isolated_services": true,
    "per_service_kill_switch_available_for_isolated_services": true
  },
  "verification": {
    "runaway_service_behaviour_tested_against_resource_limits": true,
    "sandbox_escape_and_abuse_cases_exercised_for_isolated_services": true,
    "sandbox_blocking_verified_not_assumed_for_isolated_services": true
  },
  "red_lines": {
    "root_service_run_for_convenience_present": false,
    "host_wide_mounts_into_isolated_services_present": false,
    "sandbox_disabled_to_make_service_run_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 39 checks and a text stamp of the verdict):

```json
{
  "service": "service-isolation-hardening-review",
  "atom_version": "0.1.0",
  "subject": "production-fleet-alpha",
  "verdict": "SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED",
  "sections": {
    "least_privilege_identity": "pass",
    "systemd_sandbox_directives": "pass",
    "confinement_and_sandbox_tools": "pass",
    "resource_containment": "pass",
    "egress_monitoring_and_kill_switch": "pass",
    "isolation_verification": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "services_count": 1,
  "services_without_dedicated_user": [],
  "services_without_filesystem_scope": [],
  "services_without_egress_restriction": [],
  "dedicated_user_coverage": "1.000000",
  "filesystem_scope_coverage": "1.000000",
  "egress_restriction_coverage": "1.000000",
  "duplicate_service_names": [],
  "summary": "39 pass, 0 fail, 0 missing of 39 checks across seven sections."
}
```

## Verdicts

- **SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED** — every check passes; the declared service-isolation record is complete and consistent with the skill's checklist and red lines.
- **SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `services_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `services_without_dedicated_user`, `services_without_filesystem_scope` and `services_without_egress_restriction` (services whose field is present but not true; a service with the field absent is missing evidence and does not appear; null when the `services` list is not declared), `duplicate_service_names` (names declared on more than one row, in the order their second occurrence appears; null when the list is not declared), the coverage ratios `dedicated_user_coverage` (services with a dedicated user ÷ declared services), `filesystem_scope_coverage` and `egress_restriction_coverage` (each a string with exactly six decimal places; null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
