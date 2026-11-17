# Multiplatform core design — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing one portable core with many thin surfaces — shared logic and data model, native-feeling apps on each platform — and you have a record of that design. This atom reads one declared manifest and returns one deterministic verdict across five sections (core_architecture, surfaces_and_thin_adapters, local_first_and_portability, packaging_and_testing, anti_pattern_red_lines): **MULTIPLATFORM_CORE_SOUND**, **MULTIPLATFORM_CORE_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 37 checks. It audits the declared record's completeness and consistency only — it inspects no codebase, builds no surface, runs no test, measures no sharing, and does not verify that a declared core actually is portable or that a declared adapter is actually thin. A record is sound *on your declared evidence*: it never judges whether the core boundary is drawn in the right place, whether a native build was genuinely needed, whether a platform's conventions are respected in substance, or whether the shared contract is well designed. The five computed checks: the declared `surfaces` list must be present and non-empty; every surface row must declare a `kind` from the skill's own set (`web_pwa`, `mobile`, `desktop_cli`, `api`); every row must consume the core contract; every row must isolate its platform-specific code; and no row may reimplement core logic. Note: `packaging.docker_used` must be `false` to pass, per the skill. No numeric threshold is imposed — the skill states no code-sharing percentage or shared-vs-platform code ratio, no number of surfaces or platforms a design must have, no core-language whitelist, no core test-coverage percentage or number of tests, no number of smoke tests per surface beyond the skill's one smoke pass, no binary size, startup time or sync latency bar, no offline-duration requirement, no fork count behind "minimized", no signing algorithm, key length or build-reproducibility hash count, no design-system component count, and no coverage percentage below completeness; those declined thresholds are named in the summary of the service definition. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "multiplatform-core-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/multiplatform-core-design` — tool name `multiplatform_core_design`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/multiplatform-core-design` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `project` | project name (string; carried into the output, not checked) |
| `core.core_holds_logic` | core architecture evidence: the portable core holds the logic |
| `core.core_holds_crypto` | core architecture evidence: the portable core holds the crypto |
| `core.core_holds_data_model` | core architecture evidence: the portable core holds the data model |
| `core.core_in_portable_language` | core architecture evidence: the core is in a portable language |
| `core.single_internal_api_defined` | core architecture evidence: one internal API the core exposes is defined |
| `web.web_installable` | surfaces evidence: the web / PWA surface is installable |
| `web.web_offline_capable_service_worker` | surfaces evidence: the web / PWA surface is offline-capable via a service worker |
| `web.web_responsive` | surfaces evidence: the web / PWA surface is responsive |
| `mobile.mobile_pwa_first_where_sufficient` | surfaces evidence: mobile is PWA-first where it suffices |
| `mobile.mobile_native_only_when_truly_needed` | surfaces evidence: mobile is native only when truly needed |
| `desktop_cli.desktop_single_static_binary_where_possible` | surfaces evidence: desktop / CLI is a single static binary where possible |
| `desktop_cli.cli_good_help` | surfaces evidence: the CLI has good help |
| `desktop_cli.cli_correct_exit_codes` | surfaces evidence: the CLI uses correct exit codes |
| `desktop_cli.cli_pipe_friendly_output` | surfaces evidence: the CLI output is pipe-friendly |
| `api.api_one_typed_contract` | surfaces evidence: the API is one typed contract |
| `surfaces` (list of surface-row objects) | computed: must be present and non-empty; reported as `surfaces_count` |
| `surfaces[].name` (string) | names the row in the computed outputs |
| `surfaces[].kind` (string) | computed: must be one of `web_pwa`, `mobile`, `desktop_cli`, `api`; rows declaring any other value are reported in `surfaces_with_invalid_kind` |
| `surfaces[].consumes_core_contract` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `surfaces_not_consuming_core_contract` |
| `surfaces[].platform_code_isolated` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `surfaces_without_isolated_platform_code` |
| `surfaces[].core_logic_reimplemented` | computed: every row must declare `false` to pass; rows with the field present but not `false` are reported in `surfaces_reimplementing_core_logic` |
| `local_first.source_of_truth_on_device` | local-first evidence: the source of truth is on the device |
| `local_first.sync_is_enhancement_not_requirement` | local-first evidence: sync is an enhancement, not a requirement |
| `local_first.user_data_and_keys_stay_on_device_hardware` | local-first evidence: user data and keys stay on device hardware |
| `portability.platform_specific_code_behind_interfaces` | portability evidence: platform-specific code is behind interfaces |
| `portability.per_platform_forks_minimized` | portability evidence: per-platform forks are minimized |
| `portability.one_design_system_across_surfaces` | portability evidence: one design system runs across surfaces |
| `portability.each_platform_conventions_respected` | portability evidence: each platform's conventions are respected |
| `packaging.reproducible_builds` | packaging evidence: builds are reproducible |
| `packaging.signed_builds` | packaging evidence: builds are signed |
| `packaging.docker_used` | must be `false` to pass (packaging line: no Docker is used) |
| `packaging.distribution_route_decided_per_surface` | packaging evidence: the distribution route is decided per surface |
| `testing.shared_core_tested_thoroughly_once` | testing evidence: the shared core is tested thoroughly once |
| `testing.each_surface_smoke_tested` | testing evidence: each surface is smoke-tested |
| `red_lines.core_logic_rewritten_per_platform_present` | must be `false` to pass (red line: no core logic rewritten per platform) |
| `red_lines.lowest_common_denominator_ux_present` | must be `false` to pass (red line: no lowest-common-denominator UX) |
| `red_lines.platform_conventions_ignored_present` | must be `false` to pass (red line: platform conventions are not ignored) |
| `red_lines.online_only_where_offline_matters_present` | must be `false` to pass (red line: not online-only where offline matters) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward MULTIPLATFORM_CORE_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/multiplatform-core-design`:

```json
{
  "project": "Vault",
  "core": {
    "core_holds_logic": true,
    "core_holds_crypto": true,
    "core_holds_data_model": true,
    "core_in_portable_language": true,
    "single_internal_api_defined": true
  },
  "web": {
    "web_installable": true,
    "web_offline_capable_service_worker": true,
    "web_responsive": true
  },
  "mobile": {
    "mobile_pwa_first_where_sufficient": true,
    "mobile_native_only_when_truly_needed": true
  },
  "desktop_cli": {
    "desktop_single_static_binary_where_possible": true,
    "cli_good_help": true,
    "cli_correct_exit_codes": true,
    "cli_pipe_friendly_output": true
  },
  "api": {
    "api_one_typed_contract": true
  },
  "surfaces": [
    {
      "name": "web_client",
      "kind": "web_pwa",
      "consumes_core_contract": true,
      "platform_code_isolated": true,
      "core_logic_reimplemented": false
    }
  ],
  "local_first": {
    "source_of_truth_on_device": true,
    "sync_is_enhancement_not_requirement": true,
    "user_data_and_keys_stay_on_device_hardware": true
  },
  "portability": {
    "platform_specific_code_behind_interfaces": true,
    "per_platform_forks_minimized": true,
    "one_design_system_across_surfaces": true,
    "each_platform_conventions_respected": true
  },
  "packaging": {
    "reproducible_builds": true,
    "signed_builds": true,
    "docker_used": false,
    "distribution_route_decided_per_surface": true
  },
  "testing": {
    "shared_core_tested_thoroughly_once": true,
    "each_surface_smoke_tested": true
  },
  "red_lines": {
    "core_logic_rewritten_per_platform_present": false,
    "lowest_common_denominator_ux_present": false,
    "platform_conventions_ignored_present": false,
    "online_only_where_offline_matters_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 37 checks and a text stamp of the verdict):

```json
{
  "service": "multiplatform-core-design",
  "atom_version": "0.1.0",
  "project": "Vault",
  "verdict": "MULTIPLATFORM_CORE_SOUND",
  "sections": {
    "core_architecture": "pass",
    "surfaces_and_thin_adapters": "pass",
    "local_first_and_portability": "pass",
    "packaging_and_testing": "pass",
    "anti_pattern_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "surfaces_count": 1,
  "surfaces_with_invalid_kind": [],
  "valid_kind_coverage": "1.000000",
  "surfaces_not_consuming_core_contract": [],
  "core_contract_coverage": "1.000000",
  "surfaces_without_isolated_platform_code": [],
  "isolated_platform_code_coverage": "1.000000",
  "surfaces_reimplementing_core_logic": [],
  "no_core_reimplementation_coverage": "1.000000",
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across five sections."
}
```

## Verdicts

- **MULTIPLATFORM_CORE_SOUND** — every check passes; the declared multiplatform design record is complete and consistent with the skill's checklist and red lines.
- **MULTIPLATFORM_CORE_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `surfaces_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `surfaces_with_invalid_kind`, `surfaces_not_consuming_core_contract`, `surfaces_without_isolated_platform_code` and `surfaces_reimplementing_core_logic` (null when the `surfaces` list is not declared; a surface with the relevant field absent is missing evidence and does not appear in these lists), the coverage values `valid_kind_coverage`, `core_contract_coverage`, `isolated_platform_code_coverage` and `no_core_reimplementation_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
