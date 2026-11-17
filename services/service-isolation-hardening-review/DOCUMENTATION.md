# Service isolation hardening review — documentation

**Service isolation hardening review** · slug `service-isolation-hardening-review` · deliverable type REVIEW · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189), RC soak to 2026-11-22.

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

The atom audits a caller-declared service-isolation hardening record for completeness and consistency only: it returns pass / fail / missing verdicts on the record plus a computed coverage ratio over the caller's own rows, and it inspects no live system. Surfaces: REST `POST /v1/service-isolation-hardening-review` and MCP `POST /mcp/service-isolation-hardening-review`. Pricing rate is `null` — free during trial (see Rate limits and pricing).

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/service-isolation-hardening-review/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment b71b0351b5994d9da5dc7bebffcd3189), in RC soak to 2026-11-22. This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `subject` "production-fleet-alpha"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "service-isolation-hardening-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the service isolation manifest.** You declare a service-isolation record for one host or fleet, made from the services' actual hardening — the atom audits the declared record, it does not harden any service or inspect any host (see Explanation). The recorded full-pass manifest declares the subject `production-fleet-alpha`: all four identity flags `true`; one rostered service `auth-svc` (dedicated user assigned, filesystem access scoped, egress restricted — all `true`); all nine systemd directive flags `true`; all eight confinement flags `true`; all four resource-containment flags `true`; all three egress-monitoring flags `true`; all three verification flags `true`; and all three red-line flags `false` (no root service run for convenience, no host-wide mounts into isolated services, no sandbox disabled to make a service run).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/service-isolation-hardening-review` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED`: "39 pass, 0 fail, 0 missing of 39 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `services_count` is 1, `services_without_dedicated_user`, `services_without_filesystem_scope` and `services_without_egress_restriction` are each `[]`, `dedicated_user_coverage`, `filesystem_scope_coverage` and `egress_restriction_coverage` are each `"1.000000"`, and `duplicate_service_names` is `[]`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "service-isolation-hardening-review"}`.
3. Call: `POST https://atoms.pipavia.com/v1/service-isolation-hardening-review` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/service-isolation-hardening-review` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `service_isolation_hardening_review`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `every_rostered_service_has_dedicated_user_assignment`, `no_root_isolated_service_run_for_convenience`, and the summary reads "37 pass, 2 fail, 0 missing of 39 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `services[0].dedicated_user_assigned` is declared `false`, failing `every_rostered_service_has_dedicated_user_assignment`, with `services_without_dedicated_user` naming `["auth-svc"]` and `dedicated_user_coverage` `"0.000000"`; and `red_lines.root_service_run_for_convenience_present` is declared `true`, failing `no_root_isolated_service_run_for_convenience`; sections `least_privilege_identity` and `red_lines` report `fail`, the other five sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a list is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "services",
  "detail": "services must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/service-isolation-hardening-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/service-isolation-hardening-review` — tool name `service_isolation_hardening_review`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `service_isolation_hardening_review` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `subject` and the row `name` field are noted as strings, and `services` as a list there. Where SERVICE.md states no type — the section container objects (`identity`, `systemd`, `confinement`, `resources`, `egress_monitoring`, `verification`, `red_lines`) and the row object (`services[]`) — the type below is grounded in the recorded evidence inputs and, for the top-level containers and the `services` list, in the MCP `inputSchema` recorded in evidence.json, which types `subject` as `string`, the containers as `object` and `services` as `array`; that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `subject` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md; recorded MCP `inputSchema` types it `string`) |

#### Read by: least_privilege_identity

| Field | Type | Notes |
|---|---|---|
| `identity` | object | The identity section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `identity.dedicated_non_login_system_user_per_isolated_service` | boolean | — |
| `identity.isolated_services_run_as_non_root` | boolean | — |
| `identity.cross_service_filesystem_access_denied_between_services` | boolean | — |
| `identity.per_service_capability_set_minimised` | boolean | — |
| `services` | list | list of service-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `services[]` | object | One declared service row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `services[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `services[].dedicated_user_assigned` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `services[].filesystem_access_scoped` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `services[].egress_restricted` | boolean | Must be `true` per row (type stated in SERVICE.md) |

#### Read by: systemd_sandbox_directives

| Field | Type | Notes |
|---|---|---|
| `systemd` | object | The systemd section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `systemd.systemd_no_new_privileges_directive_set` | boolean | — |
| `systemd.systemd_protect_system_strict_directive_set` | boolean | — |
| `systemd.systemd_protect_home_directive_set` | boolean | — |
| `systemd.systemd_private_tmp_directive_set` | boolean | — |
| `systemd.systemd_dynamic_user_directive_set` | boolean | — |
| `systemd.systemd_capability_bounding_set_directive_restricted` | boolean | — |
| `systemd.systemd_system_call_filter_directive_applied` | boolean | — |
| `systemd.systemd_restrict_address_families_directive_applied` | boolean | — |
| `systemd.systemd_read_write_paths_directive_limited_to_required_paths` | boolean | — |

#### Read by: confinement_and_sandbox_tools

| Field | Type | Notes |
|---|---|---|
| `confinement` | object | The confinement section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `confinement.sandbox_tool_used_for_one_off_untrusted_execution_isolation` | boolean | — |
| `confinement.namespaces_provide_filesystem_and_network_separation_for_isolated_services` | boolean | — |
| `confinement.mac_profile_confines_network_exposed_isolated_services` | boolean | — |
| `confinement.mac_denials_audited_without_blanket_disabling_confinement` | boolean | — |
| `confinement.wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation` | boolean | — |
| `confinement.microvm_used_where_kernel_level_isolation_is_required` | boolean | — |
| `confinement.windows_low_privilege_isolation_equivalents_applied_where_in_scope` | boolean | — |
| `confinement.chroot_not_relied_upon_as_sole_service_isolation` | boolean | — |

#### Read by: resource_containment

| Field | Type | Notes |
|---|---|---|
| `resources` | object | The resources section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `resources.cgroups_v2_cpu_memory_io_limits_set_for_isolated_services` | boolean | — |
| `resources.per_service_ulimits_configured_for_isolated_services` | boolean | — |
| `resources.execution_timeouts_configured_for_isolated_services` | boolean | — |
| `resources.restart_limits_configured_for_isolated_services` | boolean | — |

#### Read by: egress_monitoring_and_kill_switch

| Field | Type | Notes |
|---|---|---|
| `egress_monitoring` | object | The egress-monitoring section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `egress_monitoring.outbound_egress_restricted_for_isolated_services_not_needing_world_access` | boolean | — |
| `egress_monitoring.exec_and_spawn_events_logged_for_isolated_services` | boolean | — |
| `egress_monitoring.per_service_kill_switch_available_for_isolated_services` | boolean | — |

#### Read by: isolation_verification

| Field | Type | Notes |
|---|---|---|
| `verification` | object | The verification section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `verification.runaway_service_behaviour_tested_against_resource_limits` | boolean | — |
| `verification.sandbox_escape_and_abuse_cases_exercised_for_isolated_services` | boolean | — |
| `verification.sandbox_blocking_verified_not_assumed_for_isolated_services` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.root_service_run_for_convenience_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.host_wide_mounts_into_isolated_services_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.sandbox_disabled_to_make_service_run_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 39 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: least_privilege_identity

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `dedicated_non_login_system_user_per_isolated_service` | least-privilege accounts: one service, one non-login system user | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `isolated_services_run_as_non_root` | least-privilege accounts: services run non-root | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cross_service_filesystem_access_denied_between_services` | least-privilege accounts: no cross-service file access between services | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `per_service_capability_set_minimised` | least-privilege accounts: each service's capability set is minimal | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `isolated_services_roster_declared` | the declared record rosters its isolated services — the services list is present; an empty list declares that the record rosters no services | Computed over the declared record. Pass: the `services` list is present — an empty list passes, because it declares that the record rosters no services. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_rostered_service_has_dedicated_user_assignment` | rostered services: every declared service row declares a dedicated user assigned to it | Computed over the declared record. Pass: every declared service row declares `dedicated_user_assigned` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending services are named in `services_without_dedicated_user`). Missing: the list is absent, or a row has the field absent. |
| `every_rostered_service_has_scoped_filesystem_access` | rostered services: every declared service row declares its filesystem access scoped | Computed over the declared record. Pass: every declared service row declares `filesystem_access_scoped` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending services are named in `services_without_filesystem_scope`). Missing: the list is absent, or a row has the field absent. |
| `every_rostered_service_has_restricted_egress_declaration` | rostered services: every declared service row declares its egress restricted | Computed over the declared record. Pass: every declared service row declares `egress_restricted` `true` — on an empty list the check passes vacuously. Fail: a row declares it `false` (offending services are named in `services_without_egress_restriction`). Missing: the list is absent, or a row has the field absent. |
| `no_rostered_service_name_duplicated` | rostered services: no declared service name is owned by more than one row | Computed over the declared record. Pass: no declared service `name` appears on more than one row (duplicates would be named in `duplicate_service_names`). Fail: a `name` is declared on more than one row. Missing: the list is absent, or a row has `name` absent. |

#### Section: systemd_sandbox_directives

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `systemd_no_new_privileges_directive_set` | systemd hardening: NoNewPrivileges is set | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `systemd_protect_system_strict_directive_set` | systemd hardening: ProtectSystem=strict is set | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `systemd_protect_home_directive_set` | systemd hardening: ProtectHome is set | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `systemd_private_tmp_directive_set` | systemd hardening: PrivateTmp is set | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `systemd_dynamic_user_directive_set` | systemd hardening: DynamicUser is set | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `systemd_capability_bounding_set_directive_restricted` | systemd hardening: CapabilityBoundingSet is restricted to what the service needs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `systemd_system_call_filter_directive_applied` | systemd hardening: SystemCallFilter is applied (the skill's @system-service class) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `systemd_restrict_address_families_directive_applied` | systemd hardening: RestrictAddressFamilies is applied | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `systemd_read_write_paths_directive_limited_to_required_paths` | systemd hardening: ReadWritePaths names only what the service needs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: confinement_and_sandbox_tools

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sandbox_tool_used_for_one_off_untrusted_execution_isolation` | sandbox tools: a bubblewrap/nsjail/firejail-class sandbox tool is used for one-off untrusted execution | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `namespaces_provide_filesystem_and_network_separation_for_isolated_services` | sandbox tools: namespaces provide filesystem and network separation for the services | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mac_profile_confines_network_exposed_isolated_services` | MAC profiles: an AppArmor/SELinux profile confines anything exposed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mac_denials_audited_without_blanket_disabling_confinement` | MAC profiles: denials are audited, not blanket-disabled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation` | WASM/WASI: untrusted plugin logic runs under WASM/WASI isolation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `microvm_used_where_kernel_level_isolation_is_required` | microVMs: a Firecracker-class microVM is used where kernel isolation is the requirement | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `windows_low_privilege_isolation_equivalents_applied_where_in_scope` | Windows equivalents: where Windows services are in scope, dedicated low-privilege accounts, AppContainer, Windows Sandbox and Job Objects are applied as the equivalents | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `chroot_not_relied_upon_as_sole_service_isolation` | sandbox tools: chroot is not relied upon as the sole isolation mechanism (the skill: chroot only with care, given its classic escape history) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: resource_containment

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `cgroups_v2_cpu_memory_io_limits_set_for_isolated_services` | resource limits: cgroups v2 CPU, memory and IO limits are set | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `per_service_ulimits_configured_for_isolated_services` | resource limits: per-service ulimits are configured | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `execution_timeouts_configured_for_isolated_services` | resource limits: execution timeouts are configured | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `restart_limits_configured_for_isolated_services` | resource limits: restart limits are configured | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: egress_monitoring_and_kill_switch

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `outbound_egress_restricted_for_isolated_services_not_needing_world_access` | egress: outbound access is restricted where the service doesn't need the world | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `exec_and_spawn_events_logged_for_isolated_services` | monitoring: exec/spawn events are logged | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `per_service_kill_switch_available_for_isolated_services` | monitoring: a kill switch exists per service | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: isolation_verification

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `runaway_service_behaviour_tested_against_resource_limits` | quality gates: runaway behaviour is tested — a runaway kills itself, not the host | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sandbox_escape_and_abuse_cases_exercised_for_isolated_services` | quality gates: escape and abuse cases are exercised against the sandbox | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sandbox_blocking_verified_not_assumed_for_isolated_services` | quality gates: the sandbox is verified to actually block, not assumed to | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_root_isolated_service_run_for_convenience` | red line: no root service run "for convenience" is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_host_wide_mounts_into_isolated_services` | red line: no host-wide mounts into isolated services are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_sandbox_disabled_to_make_isolated_service_run` | red line: no sandbox disabled to make something run is present in the record — the permission design is fixed instead | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"service-isolation-hardening-review"`), `atom_version` (`"0.1.0"`), and `subject` (the manifest's declared subject value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `services_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `services_without_dedicated_user` (services whose dedicated-user field is present but not true; a service with the field absent is missing evidence and does not appear), `services_without_filesystem_scope` and `services_without_egress_restriction` (same rule for their fields) and `duplicate_service_names` (names declared on more than one row, in the order their second occurrence appears) — the counts and lists in this group are null when the list they are computed from is not declared, as recorded in the sparse case; and the coverage ratios `dedicated_user_coverage` (services with a dedicated user ÷ declared services), `filesystem_scope_coverage` and `egress_restriction_coverage` — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; comparisons use the unrounded values — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "39 pass, 0 fail, 0 missing of 39 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared subject value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED` — all 39 checks pass: the declared service-isolation record is complete and consistent with the bound skill's checklist, quality gates and red lines.
- `SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the five primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `services_count`, `services_without_dedicated_user`, `services_without_filesystem_scope`, `services_without_egress_restriction`, `duplicate_service_names`, `dedicated_user_coverage`, `filesystem_scope_coverage`, `egress_restriction_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"services","detail":"services must be a list"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type REVIEW — this atom sells the review it produces, a bounded judgment artifact, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Isolate services and untrusted code without Docker — systemd hardening, sandboxes, WASM, least privilege (the bound capability, from the skill). You submit one declared record — the service isolation manifest, for one host or fleet, made from the services' actual hardening — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 7 sections (`least_privilege_identity`, `systemd_sandbox_directives`, `confinement_and_sandbox_tools`, `resource_containment`, `egress_monitoring_and_kill_switch`, `isolation_verification`, `red_lines`). The atom sells that review — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `services` list must be present (an empty list passes, because it declares that the record rosters no services), every declared service row must declare `dedicated_user_assigned`, `filesystem_access_scoped` and `egress_restricted` all `true`, and no declared service `name` may appear on more than one row — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are qualitative declarations the record makes, not bars the atom can set. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows. Declined, named: a CPU, memory or IO quota value under cgroups v2, or a percentage-of-host resource bar; a timeout duration in seconds; a restart limit count or restart interval; a ulimit value for any resource; an egress destination count, or a named list of permitted destinations beyond restricted-as-declared; a number of escape/abuse cases that must be exercised, or a pass rate for them; a MAC denial count or audit frequency; a syscall list beyond the skill's own `@system-service` filter class as declared; a capability list beyond minimal / bounding-set-restricted as declared; a `ReadWritePaths` path count beyond only-what's-needed as declared; a log-retention period for exec/spawn events; a minimum number of rostered services; a criterion for when kernel isolation is "required" beyond the caller's declaration that a microVM is used where it is; a rule for when Windows equivalents are in scope beyond the caller's declaration.

**What it does NOT do.** The atom reviews a **declared** service-isolation record: a verdict of `SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED` means the record is complete and consistent *on the caller's declared evidence* — a record that declares `NoNewPrivileges`, a dedicated user per service, and exercised escape cases passes those checks even if the real host did none of it. It is a completeness and consistency audit of the isolation record the skill requires, **not a penetration test, a sandbox-escape assessment, a host audit, a hardening service, a security certification, or a guarantee that any service is actually isolated**. Specifically: it probes no live system, reads no unit file, inspects no process, namespace, cgroup or MAC profile, runs no sandbox or escape test, and does not verify that any declared hardening was ever applied. It never judges whether a declared directive is correctly valued in the real unit file, whether a MAC profile is well-written, whether an escape case was competently designed, or whether the isolation design is adequate for the real threat — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared service rows are internally consistent. Named exclusions: no numeric thresholds at all (the skill states none — see the declined list above); no live verification of any declared fact; no judgment of hardening *quality* — whether the directive values, capability set, egress destinations or MAC profile are adequate for the real services is the caller's declaration, checked only for declared presence and consistency; the skill's house rule on container runtimes (no Docker in application code, Podman only as a last resort) is context for the method, not a check — this atom takes no position on any specific runtime a caller uses, and no check derives from it.

**Buyer and use context.** Teams and agents working in Security & privacy who need this review on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Fleet service sandbox hardening work (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom is security-adjacent and was deployed census-style under a U-13 regulatory screen recorded in SERVICE.md. The screen result and all of its named controls are reproduced exactly as SERVICE.md's U-13 section records them:

**Screen result: No — flag-with-controls (census class).** This atom's output could not read as regulated professional advice, and the flag is recorded with the controls that keep it so. It is security-adjacent (it reviews a declared service-isolation hardening record), so the screen was applied strictly. What prevents an advice reading: (1) the atom audits a caller-**declared** record for completeness and consistency only — every output is a pass / fail / missing verdict on the record, a computed coverage ratio over the caller's own rows, or a row name from the caller's own roster; (2) it gives **no recommendation and no remediation instruction** — it never says what a service's hardening should be beyond whether the record declares what the bound skill's method, quality gates and red lines name; (3) it is **not a certification, audit attestation or penetration test** — it probes no live system and verifies no declared fact, and its verdict names only the record (`..._HARDENED` = the declared record is complete against the skill), never the real host; (4) it offers no engineering-practice advice in the APEGA sense (no design, stamping, or safety judgment over physical systems), no financial or securities advice, nothing psychology-adjacent, and no medical or legal advice. Its subject is software service-isolation practice only, the same class as the software-engineering and security-record titles that stayed live at the census pending the owner's review.

The flag stays open for the Director's review: the screen result above is the recorded census disposition, not a clearance, and this atom's verdict is a completeness and consistency judgment on the caller's declared evidence — not compliance evidence, not a certification, audit attestation or penetration test.

### For integrators (Users)

You need: a gateway key with the `service_isolation_hardening_review` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/service_isolation_hardening_review.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_service_isolation_hardening_review.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/service-isolation-hardening-review` (REST) and `POST /mcp/service-isolation-hardening-review` (MCP, tool `service_isolation_hardening_review`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment b71b0351b5994d9da5dc7bebffcd3189), RC soak to 2026-11-22. Key scope: `service_isolation_hardening_review`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189, RC soak to 2026-11-22) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** several recorded check names are not the input field names they read. In `least_privilege_identity` the computed checks `isolated_services_roster_declared` reads the `services` list, `every_rostered_service_has_dedicated_user_assignment` reads the rows' `services[].dedicated_user_assigned`, `every_rostered_service_has_scoped_filesystem_access` reads the rows' `services[].filesystem_access_scoped`, `every_rostered_service_has_restricted_egress_declaration` reads the rows' `services[].egress_restricted`, and `no_rostered_service_name_duplicated` reads the rows' `services[].name`, rather than any single input field of the same name (the other four checks in the section match the leaf name of the field they read). In `red_lines` all three recorded check names differ from their fields: `no_root_isolated_service_run_for_convenience` (input `red_lines.root_service_run_for_convenience_present`), `no_host_wide_mounts_into_isolated_services` (input `red_lines.host_wide_mounts_into_isolated_services_present`) and `no_sandbox_disabled_to_make_isolated_service_run` (input `red_lines.sandbox_disabled_to_make_service_run_present`). The recorded checks in `systemd_sandbox_directives`, `confinement_and_sandbox_tools`, `resource_containment`, `egress_monitoring_and_kill_switch` and `isolation_verification` match the leaf name of the field they read. Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`identity`, `systemd`, `confinement`, `resources`, `egress_monitoring`, `verification`, `red_lines`) or for a row object (`services[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the `services` list, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 39 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, `services_count` and the coverage ratios, but does not state a null rule for the row-name lists `services_without_dedicated_user`, `services_without_filesystem_scope`, `services_without_egress_restriction` or `duplicate_service_names`. The recorded sparse response returns all of them as `null` when the list they are computed from is not declared (as the Output format section records); this document follows the recording.
6. **Section grouping vs input objects:** one recorded section merges separate input objects — the `identity` object and the `services` list are both read by the single recorded section `least_privilege_identity`. The other six recorded sections each read a single input object (`systemd`, `confinement`, `resources`, `egress_monitoring`, `verification`, `red_lines`), although the recorded section names for the `egress_monitoring` and `verification` objects are expanded forms (`egress_monitoring_and_kill_switch`, `isolation_verification`). This document groups the Input reference and the Checks by the recorded section names.
7. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (5 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named section names instead of exact check names — `least_privilege_identity` and `red_lines` (R1 ×2); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); and the designed violations input was missing key paths present in the full-pass manifest (R3 ×1). These are unscored design prose; where the corrected-away design prose differed, the recorded responses govern.
8. **Deployment id not in evidence.json:** evidence.json records the gateway base, version (`1.1.0`) and health status, but no deployment id; the deployment id `b71b0351b5994d9da5dc7bebffcd3189` used in this document's header and Ops view is the one asserted in TEST-REPORT.md. No other source in the atom's record carries it.

## Worked examples

Provenance: recorded 2026-11-16T10:50:40.761486+00:00 against gateway v1.1.0, external-verification battery Wave 14, source `verification/work/service-isolation-hardening-review/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T10:50:40.761486+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/service-isolation-hardening-review/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "least_privilege_identity",
      "check": "dedicated_non_login_system_user_per_isolated_service",
      "status": "pass",
      "evidence": "least-privilege accounts: one service, one non-login system user"
    },
    {
      "section": "least_privilege_identity",
      "check": "isolated_services_run_as_non_root",
      "status": "pass",
      "evidence": "least-privilege accounts: services run non-root"
    },
    {
      "section": "least_privilege_identity",
      "check": "cross_service_filesystem_access_denied_between_services",
      "status": "pass",
      "evidence": "least-privilege accounts: no cross-service file access between services"
    },
    {
      "section": "least_privilege_identity",
      "check": "per_service_capability_set_minimised",
      "status": "pass",
      "evidence": "least-privilege accounts: each service's capability set is minimal"
    },
    {
      "section": "least_privilege_identity",
      "check": "isolated_services_roster_declared",
      "status": "pass",
      "evidence": "the declared record rosters its isolated services — the services list is present; an empty list declares that the record rosters no services"
    },
    {
      "section": "least_privilege_identity",
      "check": "every_rostered_service_has_dedicated_user_assignment",
      "status": "pass",
      "evidence": "rostered services: every declared service row declares a dedicated user assigned to it"
    },
    {
      "section": "least_privilege_identity",
      "check": "every_rostered_service_has_scoped_filesystem_access",
      "status": "pass",
      "evidence": "rostered services: every declared service row declares its filesystem access scoped"
    },
    {
      "section": "least_privilege_identity",
      "check": "every_rostered_service_has_restricted_egress_declaration",
      "status": "pass",
      "evidence": "rostered services: every declared service row declares its egress restricted"
    },
    {
      "section": "least_privilege_identity",
      "check": "no_rostered_service_name_duplicated",
      "status": "pass",
      "evidence": "rostered services: no declared service name is owned by more than one row"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_no_new_privileges_directive_set",
      "status": "pass",
      "evidence": "systemd hardening: NoNewPrivileges is set"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_protect_system_strict_directive_set",
      "status": "pass",
      "evidence": "systemd hardening: ProtectSystem=strict is set"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_protect_home_directive_set",
      "status": "pass",
      "evidence": "systemd hardening: ProtectHome is set"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_private_tmp_directive_set",
      "status": "pass",
      "evidence": "systemd hardening: PrivateTmp is set"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_dynamic_user_directive_set",
      "status": "pass",
      "evidence": "systemd hardening: DynamicUser is set"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_capability_bounding_set_directive_restricted",
      "status": "pass",
      "evidence": "systemd hardening: CapabilityBoundingSet is restricted to what the service needs"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_system_call_filter_directive_applied",
      "status": "pass",
      "evidence": "systemd hardening: SystemCallFilter is applied (the skill's @system-service class)"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_restrict_address_families_directive_applied",
      "status": "pass",
      "evidence": "systemd hardening: RestrictAddressFamilies is applied"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_read_write_paths_directive_limited_to_required_paths",
      "status": "pass",
      "evidence": "systemd hardening: ReadWritePaths names only what the service needs"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "sandbox_tool_used_for_one_off_untrusted_execution_isolation",
      "status": "pass",
      "evidence": "sandbox tools: a bubblewrap/nsjail/firejail-class sandbox tool is used for one-off untrusted execution"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "namespaces_provide_filesystem_and_network_separation_for_isolated_services",
      "status": "pass",
      "evidence": "sandbox tools: namespaces provide filesystem and network separation for the services"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "mac_profile_confines_network_exposed_isolated_services",
      "status": "pass",
      "evidence": "MAC profiles: an AppArmor/SELinux profile confines anything exposed"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "mac_denials_audited_without_blanket_disabling_confinement",
      "status": "pass",
      "evidence": "MAC profiles: denials are audited, not blanket-disabled"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation",
      "status": "pass",
      "evidence": "WASM/WASI: untrusted plugin logic runs under WASM/WASI isolation"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "microvm_used_where_kernel_level_isolation_is_required",
      "status": "pass",
      "evidence": "microVMs: a Firecracker-class microVM is used where kernel isolation is the requirement"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "windows_low_privilege_isolation_equivalents_applied_where_in_scope",
      "status": "pass",
      "evidence": "Windows equivalents: where Windows services are in scope, dedicated low-privilege accounts, AppContainer, Windows Sandbox and Job Objects are applied as the equivalents"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "chroot_not_relied_upon_as_sole_service_isolation",
      "status": "pass",
      "evidence": "sandbox tools: chroot is not relied upon as the sole isolation mechanism (the skill: chroot only with care, given its classic escape history)"
    },
    {
      "section": "resource_containment",
      "check": "cgroups_v2_cpu_memory_io_limits_set_for_isolated_services",
      "status": "pass",
      "evidence": "resource limits: cgroups v2 CPU, memory and IO limits are set"
    },
    {
      "section": "resource_containment",
      "check": "per_service_ulimits_configured_for_isolated_services",
      "status": "pass",
      "evidence": "resource limits: per-service ulimits are configured"
    },
    {
      "section": "resource_containment",
      "check": "execution_timeouts_configured_for_isolated_services",
      "status": "pass",
      "evidence": "resource limits: execution timeouts are configured"
    },
    {
      "section": "resource_containment",
      "check": "restart_limits_configured_for_isolated_services",
      "status": "pass",
      "evidence": "resource limits: restart limits are configured"
    },
    {
      "section": "egress_monitoring_and_kill_switch",
      "check": "outbound_egress_restricted_for_isolated_services_not_needing_world_access",
      "status": "pass",
      "evidence": "egress: outbound access is restricted where the service doesn't need the world"
    },
    {
      "section": "egress_monitoring_and_kill_switch",
      "check": "exec_and_spawn_events_logged_for_isolated_services",
      "status": "pass",
      "evidence": "monitoring: exec/spawn events are logged"
    },
    {
      "section": "egress_monitoring_and_kill_switch",
      "check": "per_service_kill_switch_available_for_isolated_services",
      "status": "pass",
      "evidence": "monitoring: a kill switch exists per service"
    },
    {
      "section": "isolation_verification",
      "check": "runaway_service_behaviour_tested_against_resource_limits",
      "status": "pass",
      "evidence": "quality gates: runaway behaviour is tested — a runaway kills itself, not the host"
    },
    {
      "section": "isolation_verification",
      "check": "sandbox_escape_and_abuse_cases_exercised_for_isolated_services",
      "status": "pass",
      "evidence": "quality gates: escape and abuse cases are exercised against the sandbox"
    },
    {
      "section": "isolation_verification",
      "check": "sandbox_blocking_verified_not_assumed_for_isolated_services",
      "status": "pass",
      "evidence": "quality gates: the sandbox is verified to actually block, not assumed to"
    },
    {
      "section": "red_lines",
      "check": "no_root_isolated_service_run_for_convenience",
      "status": "pass",
      "evidence": "red line: no root service run \"for convenience\" is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_host_wide_mounts_into_isolated_services",
      "status": "pass",
      "evidence": "red line: no host-wide mounts into isolated services are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_sandbox_disabled_to_make_isolated_service_run",
      "status": "pass",
      "evidence": "red line: no sandbox disabled to make something run is present in the record — the permission design is fixed instead"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "services_count": 1,
  "services_without_dedicated_user": [],
  "services_without_filesystem_scope": [],
  "services_without_egress_restriction": [],
  "dedicated_user_coverage": "1.000000",
  "filesystem_scope_coverage": "1.000000",
  "egress_restriction_coverage": "1.000000",
  "duplicate_service_names": [],
  "summary": "39 pass, 0 fail, 0 missing of 39 checks across seven sections.",
  "stamp": "SERVICE ISOLATION HARDENING REVIEW\nsubject: production-fleet-alpha\nVERDICT: SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED\n  least_privilege_identity                     pass\n  systemd_sandbox_directives                   pass\n  confinement_and_sandbox_tools                pass\n  resource_containment                         pass\n  egress_monitoring_and_kill_switch            pass\n  isolation_verification                       pass\n  red_lines                                    pass\n39 pass, 0 fail, 0 missing of 39 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T10:50:40.761486+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/service-isolation-hardening-review/evidence.json`.

Input:

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
      "dedicated_user_assigned": false,
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
    "root_service_run_for_convenience_present": true,
    "host_wide_mounts_into_isolated_services_present": false,
    "sandbox_disabled_to_make_service_run_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "service-isolation-hardening-review",
  "atom_version": "0.1.0",
  "subject": "production-fleet-alpha",
  "verdict": "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED",
  "sections": {
    "least_privilege_identity": "fail",
    "systemd_sandbox_directives": "pass",
    "confinement_and_sandbox_tools": "pass",
    "resource_containment": "pass",
    "egress_monitoring_and_kill_switch": "pass",
    "isolation_verification": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "least_privilege_identity",
      "check": "dedicated_non_login_system_user_per_isolated_service",
      "status": "pass",
      "evidence": "least-privilege accounts: one service, one non-login system user"
    },
    {
      "section": "least_privilege_identity",
      "check": "isolated_services_run_as_non_root",
      "status": "pass",
      "evidence": "least-privilege accounts: services run non-root"
    },
    {
      "section": "least_privilege_identity",
      "check": "cross_service_filesystem_access_denied_between_services",
      "status": "pass",
      "evidence": "least-privilege accounts: no cross-service file access between services"
    },
    {
      "section": "least_privilege_identity",
      "check": "per_service_capability_set_minimised",
      "status": "pass",
      "evidence": "least-privilege accounts: each service's capability set is minimal"
    },
    {
      "section": "least_privilege_identity",
      "check": "isolated_services_roster_declared",
      "status": "pass",
      "evidence": "the declared record rosters its isolated services — the services list is present; an empty list declares that the record rosters no services"
    },
    {
      "section": "least_privilege_identity",
      "check": "every_rostered_service_has_dedicated_user_assignment",
      "status": "fail",
      "evidence": "rostered services: every declared service row declares a dedicated user assigned to it"
    },
    {
      "section": "least_privilege_identity",
      "check": "every_rostered_service_has_scoped_filesystem_access",
      "status": "pass",
      "evidence": "rostered services: every declared service row declares its filesystem access scoped"
    },
    {
      "section": "least_privilege_identity",
      "check": "every_rostered_service_has_restricted_egress_declaration",
      "status": "pass",
      "evidence": "rostered services: every declared service row declares its egress restricted"
    },
    {
      "section": "least_privilege_identity",
      "check": "no_rostered_service_name_duplicated",
      "status": "pass",
      "evidence": "rostered services: no declared service name is owned by more than one row"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_no_new_privileges_directive_set",
      "status": "pass",
      "evidence": "systemd hardening: NoNewPrivileges is set"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_protect_system_strict_directive_set",
      "status": "pass",
      "evidence": "systemd hardening: ProtectSystem=strict is set"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_protect_home_directive_set",
      "status": "pass",
      "evidence": "systemd hardening: ProtectHome is set"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_private_tmp_directive_set",
      "status": "pass",
      "evidence": "systemd hardening: PrivateTmp is set"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_dynamic_user_directive_set",
      "status": "pass",
      "evidence": "systemd hardening: DynamicUser is set"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_capability_bounding_set_directive_restricted",
      "status": "pass",
      "evidence": "systemd hardening: CapabilityBoundingSet is restricted to what the service needs"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_system_call_filter_directive_applied",
      "status": "pass",
      "evidence": "systemd hardening: SystemCallFilter is applied (the skill's @system-service class)"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_restrict_address_families_directive_applied",
      "status": "pass",
      "evidence": "systemd hardening: RestrictAddressFamilies is applied"
    },
    {
      "section": "systemd_sandbox_directives",
      "check": "systemd_read_write_paths_directive_limited_to_required_paths",
      "status": "pass",
      "evidence": "systemd hardening: ReadWritePaths names only what the service needs"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "sandbox_tool_used_for_one_off_untrusted_execution_isolation",
      "status": "pass",
      "evidence": "sandbox tools: a bubblewrap/nsjail/firejail-class sandbox tool is used for one-off untrusted execution"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "namespaces_provide_filesystem_and_network_separation_for_isolated_services",
      "status": "pass",
      "evidence": "sandbox tools: namespaces provide filesystem and network separation for the services"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "mac_profile_confines_network_exposed_isolated_services",
      "status": "pass",
      "evidence": "MAC profiles: an AppArmor/SELinux profile confines anything exposed"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "mac_denials_audited_without_blanket_disabling_confinement",
      "status": "pass",
      "evidence": "MAC profiles: denials are audited, not blanket-disabled"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation",
      "status": "pass",
      "evidence": "WASM/WASI: untrusted plugin logic runs under WASM/WASI isolation"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "microvm_used_where_kernel_level_isolation_is_required",
      "status": "pass",
      "evidence": "microVMs: a Firecracker-class microVM is used where kernel isolation is the requirement"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "windows_low_privilege_isolation_equivalents_applied_where_in_scope",
      "status": "pass",
      "evidence": "Windows equivalents: where Windows services are in scope, dedicated low-privilege accounts, AppContainer, Windows Sandbox and Job Objects are applied as the equivalents"
    },
    {
      "section": "confinement_and_sandbox_tools",
      "check": "chroot_not_relied_upon_as_sole_service_isolation",
      "status": "pass",
      "evidence": "sandbox tools: chroot is not relied upon as the sole isolation mechanism (the skill: chroot only with care, given its classic escape history)"
    },
    {
      "section": "resource_containment",
      "check": "cgroups_v2_cpu_memory_io_limits_set_for_isolated_services",
      "status": "pass",
      "evidence": "resource limits: cgroups v2 CPU, memory and IO limits are set"
    },
    {
      "section": "resource_containment",
      "check": "per_service_ulimits_configured_for_isolated_services",
      "status": "pass",
      "evidence": "resource limits: per-service ulimits are configured"
    },
    {
      "section": "resource_containment",
      "check": "execution_timeouts_configured_for_isolated_services",
      "status": "pass",
      "evidence": "resource limits: execution timeouts are configured"
    },
    {
      "section": "resource_containment",
      "check": "restart_limits_configured_for_isolated_services",
      "status": "pass",
      "evidence": "resource limits: restart limits are configured"
    },
    {
      "section": "egress_monitoring_and_kill_switch",
      "check": "outbound_egress_restricted_for_isolated_services_not_needing_world_access",
      "status": "pass",
      "evidence": "egress: outbound access is restricted where the service doesn't need the world"
    },
    {
      "section": "egress_monitoring_and_kill_switch",
      "check": "exec_and_spawn_events_logged_for_isolated_services",
      "status": "pass",
      "evidence": "monitoring: exec/spawn events are logged"
    },
    {
      "section": "egress_monitoring_and_kill_switch",
      "check": "per_service_kill_switch_available_for_isolated_services",
      "status": "pass",
      "evidence": "monitoring: a kill switch exists per service"
    },
    {
      "section": "isolation_verification",
      "check": "runaway_service_behaviour_tested_against_resource_limits",
      "status": "pass",
      "evidence": "quality gates: runaway behaviour is tested — a runaway kills itself, not the host"
    },
    {
      "section": "isolation_verification",
      "check": "sandbox_escape_and_abuse_cases_exercised_for_isolated_services",
      "status": "pass",
      "evidence": "quality gates: escape and abuse cases are exercised against the sandbox"
    },
    {
      "section": "isolation_verification",
      "check": "sandbox_blocking_verified_not_assumed_for_isolated_services",
      "status": "pass",
      "evidence": "quality gates: the sandbox is verified to actually block, not assumed to"
    },
    {
      "section": "red_lines",
      "check": "no_root_isolated_service_run_for_convenience",
      "status": "fail",
      "evidence": "red line: no root service run \"for convenience\" is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_host_wide_mounts_into_isolated_services",
      "status": "pass",
      "evidence": "red line: no host-wide mounts into isolated services are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_sandbox_disabled_to_make_isolated_service_run",
      "status": "pass",
      "evidence": "red line: no sandbox disabled to make something run is present in the record — the permission design is fixed instead"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "services_count": 1,
  "services_without_dedicated_user": [
    "auth-svc"
  ],
  "services_without_filesystem_scope": [],
  "services_without_egress_restriction": [],
  "dedicated_user_coverage": "0.000000",
  "filesystem_scope_coverage": "1.000000",
  "egress_restriction_coverage": "1.000000",
  "duplicate_service_names": [],
  "summary": "37 pass, 2 fail, 0 missing of 39 checks across seven sections.",
  "stamp": "SERVICE ISOLATION HARDENING REVIEW\nsubject: production-fleet-alpha\nVERDICT: SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED\n  least_privilege_identity                     fail\n  systemd_sandbox_directives                   pass\n  confinement_and_sandbox_tools                pass\n  resource_containment                         pass\n  egress_monitoring_and_kill_switch            pass\n  isolation_verification                       pass\n  red_lines                                    fail\n37 pass, 2 fail, 0 missing of 39 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T10:50:40.761486+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/service-isolation-hardening-review/evidence.json`.

Input:

```json
{
  "subject": "production-fleet-alpha",
  "identity": {
    "dedicated_non_login_system_user_per_isolated_service": true,
    "isolated_services_run_as_non_root": true,
    "cross_service_filesystem_access_denied_between_services": true,
    "per_service_capability_set_minimised": true
  },
  "services": "not-a-list",
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

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "services",
  "detail": "services must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — this atom is security-adjacent and deployed census-style under a U-13 screen recorded as **No — flag-with-controls (census class)** in SERVICE.md, with all of its named controls reproduced exactly in the Regulators view above; the flag stays open for the Director's review. |
| Checks named | 39 documented / 39 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`services_count`, the four row-name lists and the three coverage ratios) |
| Input reference typed | Yes — 48 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/service-isolation-hardening-review/evidence.json` |
