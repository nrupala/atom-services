# Multiplatform core design — documentation

**Multiplatform core design** · slug `multiplatform-core-design` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80) — Director's publish ruling: PUBLISH (U13-RULING-2026-11-16.md, 2026-11-16 00:42 CST).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”, and contract.yaml still says status: scaffolded. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/multiplatform-core-design/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment a15298eb9b7f40bf80d306cea4a33f80), and U13-RULING-2026-11-16.md records the Director's ruling: PUBLISH, with no hold and no park. This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "Vault"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "multiplatform-core-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the multiplatform core design manifest.** You declare a record of one project's multiplatform design — the atom audits the declared record, it does not inspect a codebase, build a surface or run a test (see Explanation). The recorded full-pass manifest declares the project `Vault`: the portable core holds the logic, the crypto and the data model, is in a portable language, and has one internal API defined; the web / PWA surface is installable, offline-capable via a service worker and responsive; mobile is PWA-first where sufficient and native only when truly needed; desktop / CLI is a single static binary where possible, with good help, correct exit codes and pipe-friendly output; the API is one typed contract; one surface row, `web_client`, with valid kind `web_pwa`, consuming the core contract, platform code isolated and no core logic reimplemented; the source of truth is on the device, sync is an enhancement not a requirement, and user data and keys stay on device hardware; platform-specific code is behind interfaces, per-platform forks are minimized, one design system runs across surfaces and each platform's conventions are respected; builds are reproducible and signed, Docker is not used (`packaging.docker_used: false`), and the distribution route is decided per surface; the shared core is tested thoroughly once and each surface is smoke-tested; and all four red-line flags are `false` (no core logic rewritten per platform, no lowest-common-denominator UX, no platform conventions ignored, not online-only where offline matters).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/multiplatform-core-design` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `MULTIPLATFORM_CORE_SOUND`: "37 pass, 0 fail, 0 missing of 37 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `surfaces_count` is 1, and `valid_kind_coverage`, `core_contract_coverage`, `isolated_platform_code_coverage` and `no_core_reimplementation_coverage` are each `"1.000000"`, with all four row-name lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `MULTIPLATFORM_CORE_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "multiplatform-core-design"}`.
3. Call: `POST https://atoms.pipavia.com/v1/multiplatform-core-design` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/multiplatform-core-design` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `multiplatform_core_design`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `MULTIPLATFORM_CORE_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_surface_kind_valid`, `every_surface_consumes_core_contract`, `no_surface_reimplements_core_logic`, `no_docker`, and the summary reads "33 pass, 4 fail, 0 missing of 37 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `surfaces_with_invalid_kind` names `web_client` — that row declares `kind: "watch"`, outside the skill's set — `valid_kind_coverage` is `"0.000000"`, `surfaces_not_consuming_core_contract` names `web_client` with `core_contract_coverage` `"0.000000"`, `surfaces_reimplementing_core_logic` names `web_client` with `no_core_reimplementation_coverage` `"0.000000"`, and `packaging.docker_used` is declared `true`, failing `no_docker`; the row's `platform_code_isolated` is declared `true`, so `every_surface_platform_code_isolated` passes, `surfaces_without_isolated_platform_code` is `[]` and `isolated_platform_code_coverage` is `"1.000000"`; sections `surfaces_and_thin_adapters` and `packaging_and_testing` report `fail`, the other three `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "core",
  "detail": "core must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/multiplatform-core-design` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/multiplatform-core-design` — tool name `multiplatform_core_design`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `multiplatform_core_design` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `project` and the `surfaces[]` string fields are noted as strings and `surfaces` as a list there. Where SERVICE.md states no type — the section container objects (`core`, `web`, `mobile`, `desktop_cli`, `api`, `local_first`, `portability`, `packaging`, `testing`, `red_lines`) and a `surfaces[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `surfaces` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `MULTIPLATFORM_CORE_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: core_architecture

| Field | Type | Notes |
|---|---|---|
| `core` | object | The core section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `core.core_holds_logic` | boolean | — |
| `core.core_holds_crypto` | boolean | — |
| `core.core_holds_data_model` | boolean | — |
| `core.core_in_portable_language` | boolean | — |
| `core.single_internal_api_defined` | boolean | — |

#### Read by: surfaces_and_thin_adapters

| Field | Type | Notes |
|---|---|---|
| `web` | object | The web section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `web.web_installable` | boolean | — |
| `web.web_offline_capable_service_worker` | boolean | — |
| `web.web_responsive` | boolean | — |
| `mobile` | object | The mobile section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `mobile.mobile_pwa_first_where_sufficient` | boolean | — |
| `mobile.mobile_native_only_when_truly_needed` | boolean | — |
| `desktop_cli` | object | The desktop / CLI section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `desktop_cli.desktop_single_static_binary_where_possible` | boolean | — |
| `desktop_cli.cli_good_help` | boolean | — |
| `desktop_cli.cli_correct_exit_codes` | boolean | — |
| `desktop_cli.cli_pipe_friendly_output` | boolean | — |
| `api` | object | The API section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `api.api_one_typed_contract` | boolean | — |
| `surfaces` | list | list of surface-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `surfaces[]` | object | One declared surface row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `surfaces[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `surfaces[].kind` | string | Must be one of `web_pwa`, `mobile`, `desktop_cli`, `api` — the skill's own surface set (type and set stated in SERVICE.md) |
| `surfaces[].consumes_core_contract` | boolean | — |
| `surfaces[].platform_code_isolated` | boolean | — |
| `surfaces[].core_logic_reimplemented` | boolean | must be `false` to pass |

#### Read by: local_first_and_portability

| Field | Type | Notes |
|---|---|---|
| `local_first` | object | The local-first section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `local_first.source_of_truth_on_device` | boolean | — |
| `local_first.sync_is_enhancement_not_requirement` | boolean | — |
| `local_first.user_data_and_keys_stay_on_device_hardware` | boolean | — |
| `portability` | object | The portability section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `portability.platform_specific_code_behind_interfaces` | boolean | — |
| `portability.per_platform_forks_minimized` | boolean | — |
| `portability.one_design_system_across_surfaces` | boolean | — |
| `portability.each_platform_conventions_respected` | boolean | — |

#### Read by: packaging_and_testing

| Field | Type | Notes |
|---|---|---|
| `packaging` | object | The packaging section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `packaging.reproducible_builds` | boolean | — |
| `packaging.signed_builds` | boolean | — |
| `packaging.docker_used` | boolean | must be `false` to pass |
| `packaging.distribution_route_decided_per_surface` | boolean | — |
| `testing` | object | The testing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `testing.shared_core_tested_thoroughly_once` | boolean | — |
| `testing.each_surface_smoke_tested` | boolean | — |

#### Read by: anti_pattern_red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.core_logic_rewritten_per_platform_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.lowest_common_denominator_ux_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.platform_conventions_ignored_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.online_only_where_offline_matters_present` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

All 37 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: core_architecture

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `core_holds_logic` | core architecture: the portable core holds the logic | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `core_holds_crypto` | core architecture: the portable core holds the crypto | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `core_holds_data_model` | core architecture: the portable core holds the data model | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `core_in_portable_language` | core architecture: the core is in a portable language | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `single_internal_api_defined` | core architecture: one internal API the core exposes is defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: surfaces_and_thin_adapters

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `web_installable` | surfaces: the web / PWA surface is installable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `web_offline_capable_service_worker` | surfaces: the web / PWA surface is offline-capable via a service worker | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `web_responsive` | surfaces: the web / PWA surface is responsive | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mobile_pwa_first_where_sufficient` | surfaces: mobile is PWA-first where it suffices | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mobile_native_only_when_truly_needed` | surfaces: mobile is native / APK only when truly needed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `desktop_single_static_binary_where_possible` | surfaces: desktop / CLI is a single static binary where possible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cli_good_help` | surfaces: the CLI has good --help | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cli_correct_exit_codes` | surfaces: the CLI uses correct exit codes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cli_pipe_friendly_output` | surfaces: the CLI output is pipe-friendly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `api_one_typed_contract` | surfaces: the API is one typed contract any surface consumes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `surfaces_declared` | the declared record names its surfaces — the surfaces list is present and non-empty | Computed over the declared record. Pass: the `surfaces` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_surface_kind_valid` | surfaces: every declared surface row declares a kind from the skill's set — web_pwa / mobile / desktop_cli / api | Computed over the declared record. Pass: every declared surface row declares `kind` from the skill's set — `web_pwa`, `mobile`, `desktop_cli`, `api`. Fail: a row declares `kind` present but not in that set (offending rows are named in `surfaces_with_invalid_kind`). Missing: the list is absent, or a row has `kind` absent (such a row is missing evidence and does not appear in `surfaces_with_invalid_kind`). |
| `every_surface_consumes_core_contract` | surfaces: every declared surface row consumes the same core contract — surfaces are thin adapters, not rewrites | Computed over the declared record. Pass: every declared surface row declares `consumes_core_contract: true`. Fail: a row declares `consumes_core_contract` present but not `true` (offending rows are named in `surfaces_not_consuming_core_contract`). Missing: the list is absent, or a row has `consumes_core_contract` absent (such a row is missing evidence and does not appear in `surfaces_not_consuming_core_contract`). |
| `every_surface_platform_code_isolated` | surfaces: every declared surface row isolates its platform-specific code behind interfaces | Computed over the declared record. Pass: every declared surface row declares `platform_code_isolated: true`. Fail: a row declares `platform_code_isolated` present but not `true` (offending rows are named in `surfaces_without_isolated_platform_code`). Missing: the list is absent, or a row has `platform_code_isolated` absent (such a row is missing evidence and does not appear in `surfaces_without_isolated_platform_code`). |
| `no_surface_reimplements_core_logic` | surfaces: no declared surface row reimplements core logic — the core is shared, not rewritten per platform | Computed over the declared record. Pass: every declared surface row declares `core_logic_reimplemented: false`. Fail: a row declares `core_logic_reimplemented` present but not `false` (offending rows are named in `surfaces_reimplementing_core_logic`). Missing: the list is absent, or a row has `core_logic_reimplemented` absent (such a row is missing evidence and does not appear in `surfaces_reimplementing_core_logic`). |

#### Section: local_first_and_portability

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `source_of_truth_on_device` | local-first: the source of truth is on the device | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sync_is_enhancement_not_requirement` | local-first: sync is an enhancement, not a requirement | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `user_data_and_keys_stay_on_device_hardware` | local-first: the user's data and keys stay on their hardware | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `platform_specific_code_behind_interfaces` | portability discipline: platform-specific code is isolated behind interfaces | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `per_platform_forks_minimized` | portability discipline: per-platform forks are minimized | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `one_design_system_across_surfaces` | portability discipline: one design system runs across surfaces | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `each_platform_conventions_respected` | portability discipline: each platform's conventions are respected | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: packaging_and_testing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `reproducible_builds` | packaging: builds are reproducible | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `signed_builds` | packaging: builds are signed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_docker` | packaging: no Docker is used | Pass: the anti-pattern field `packaging.docker_used` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `distribution_route_decided_per_surface` | packaging: store vs sideload vs direct is decided per surface | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `shared_core_tested_thoroughly_once` | testing: the shared core is tested thoroughly once | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `each_surface_smoke_tested` | testing: each surface is smoke-tested for integration and platform quirks | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: anti_pattern_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_core_logic_rewritten_per_platform` | red line: core logic is not rewritten per platform | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_lowest_common_denominator_ux` | red line: no lowest-common-denominator UX is shipped | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_platform_conventions_ignored` | red line: platform conventions are not ignored | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_online_only_where_offline_matters` | red line: the design is not online-only where offline genuinely matters | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"multiplatform-core-design"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `surfaces_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `surfaces_with_invalid_kind` (surfaces whose `kind` is present but not in the skill's set), `surfaces_not_consuming_core_contract` (surfaces whose `consumes_core_contract` field is present but not `true`), `surfaces_without_isolated_platform_code` (surfaces whose `platform_code_isolated` field is present but not `true`) and `surfaces_reimplementing_core_logic` (surfaces whose `core_logic_reimplemented` field is present but not `false`) — a surface with the relevant field absent is missing evidence and does not appear in these lists, and all four lists are null when the `surfaces` list is not declared, as recorded in the sparse case; and the ratios `valid_kind_coverage` (surfaces with a valid kind ÷ declared surfaces), `core_contract_coverage` (surfaces consuming the core contract ÷ declared surfaces), `isolated_platform_code_coverage` (surfaces with isolated platform code ÷ declared surfaces) and `no_core_reimplementation_coverage` (surfaces not reimplementing core logic ÷ declared surfaces) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "37 pass, 0 fail, 0 missing of 37 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `MULTIPLATFORM_CORE_SOUND` — all 37 checks pass: the declared multiplatform design record is complete and consistent with the bound skill's checklist and red lines.
- `MULTIPLATFORM_CORE_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the five primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `surfaces_count`, `surfaces_with_invalid_kind`, `valid_kind_coverage`, `surfaces_not_consuming_core_contract`, `core_contract_coverage`, `surfaces_without_isolated_platform_code`, `isolated_platform_code_coverage`, `surfaces_reimplementing_core_logic`, `no_core_reimplementation_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"core","detail":"core must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Designs one portable core with many thin surfaces — shared logic and data model, native-feeling apps on each platform (the bound capability, from the skill). You submit one declared record — the multiplatform core design manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`core_architecture`, `surfaces_and_thin_adapters`, `local_first_and_portability`, `packaging_and_testing`, `anti_pattern_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, and for `packaging.docker_used`, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `surfaces` list must be present and non-empty, every surface row must declare a `kind` from the skill's own set (`web_pwa`, `mobile`, `desktop_cli`, `api`), must declare `consumes_core_contract: true`, must declare `platform_code_isolated: true`, and must declare `core_logic_reimplemented: false` — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `MULTIPLATFORM_CORE_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `MULTIPLATFORM_CORE_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a code-sharing percentage or shared-vs-platform code ratio (the skill says share the logic, crypto and data model — not the UI — but states no percentage); a number of surfaces or platforms a design must have (the skill's reference example has three faces, stated as an example, not a minimum); a core-language whitelist (the skill names Rust/Python for the core and Rust/Go for a static binary as patterns, not an exclusive set); a core test-coverage percentage or number of tests (the skill says "thoroughly", no number); a number of smoke tests per surface beyond the skill's one smoke pass for integration and platform quirks; a binary size, startup time or sync latency bar; an offline-duration requirement; a fork count behind "minimized" (no number is stated); a signing algorithm, key length or build-reproducibility hash count; a design-system component count; a coverage percentage below completeness. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** multiplatform design record: a verdict of `MULTIPLATFORM_CORE_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares one core holding the logic, crypto and data model, signed reproducible builds and no per-platform core rewrite passes those checks even if the real project does none of it. It is a completeness and consistency audit of the record the skill requires, **not an architecture service, a portability guarantee, or a build certification**. Specifically: it inspects no codebase, builds no surface, runs no test, measures no sharing, and does not verify that a declared core actually is portable or that a declared adapter is actually thin. It never judges whether the core boundary is drawn in the right place, whether a native build was genuinely needed, whether a platform's conventions are respected in substance, or whether the shared contract is well designed — only that the record contains what the skill's sections and anti-patterns demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no code inspection — core-logic reimplementation per surface is a caller-declared flag plus the declared row field, the atom reads no source; whether offline "genuinely matters" for a given product, and whether PWA "suffices" for a given mobile surface, are caller judgments — only their declared outcomes are checked; cryptographic soundness of the core's crypto is out of scope — only its declared placement in the core is checked.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Vault product cross-platform design (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared multiplatform design record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly that it is not an architecture service, a portability guarantee, or a build certification, and that it inspects no codebase and verifies no live fact. The U-13 regulatory flag recorded in U13-RULING-2026-11-16.md was a pre-publication keyword screen on the atom's title, ruled PUBLISH by the Director; it does not make this atom's verdict regulatory evidence. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `multiplatform_core_design` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/multiplatform_core_design.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_multiplatform_core_design.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/multiplatform-core-design` (REST) and `POST /mcp/multiplatform-core-design` (MCP, tool `multiplatform_core_design`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment a15298eb9b7f40bf80d306cea4a33f80). Publication status: the Director ruled PUBLISH on the U-13 regulatory flag (U13-RULING-2026-11-16.md, 2026-11-16 00:42 CST / 2026-11-15 23:42 MST), with no hold and no park; the ruling records that the atom deploys with Batch 16 when the batch precondition (Batch 15's documentation PROVEN) is met. Key scope: `multiplatform_core_design`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live on the recorded gateway above; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally**, “no endpoint is live”, and contract.yaml says status: scaffolded. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80) shows the atom live, and U13-RULING-2026-11-16.md records the Director's PUBLISH ruling for this atom. This document follows the evidenced live state.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the anti-pattern / packaging checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_docker` (input `packaging.docker_used`), `no_core_logic_rewritten_per_platform` (input `red_lines.core_logic_rewritten_per_platform_present`), `no_lowest_common_denominator_ux` (input `red_lines.lowest_common_denominator_ux_present`), `no_platform_conventions_ignored` (input `red_lines.platform_conventions_ignored_present`) and `no_online_only_where_offline_matters` (input `red_lines.online_only_where_offline_matters_present`), plus the computed checks `surfaces_declared`, `every_surface_kind_valid`, `every_surface_consumes_core_contract`, `every_surface_platform_code_isolated` and `no_surface_reimplements_core_logic`, which read the `surfaces` rows rather than any single input field.
3. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 37 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
4. **Section grouping vs input objects:** the recorded sections merge separate input objects — `web`, `mobile`, `desktop_cli`, `api` and `surfaces` inputs are read by the single recorded section `surfaces_and_thin_adapters`, `local_first` and `portability` inputs are read by the single recorded section `local_first_and_portability`, and `packaging` and `testing` inputs are read by the single recorded section `packaging_and_testing`. This document groups the Input reference and the Checks by the recorded section names.
5. **Null lists on an undeclared `surfaces` list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `surfaces_count` and the coverage ratios, but does not state a null rule for the four row-name lists. The recorded sparse response returns all four lists as `null` when `surfaces` is not declared (as USER-GUIDE.md also states); this document follows the recording.
6. **Violations case `notes` prose misdescribes the isolation flag (unscored prose):** the violations case's `notes` text in cases.json and evidence.json says “platform_code_isolated is false”, but that case's recorded input declares `platform_code_isolated: true`, its structured expected spot checks and the recorded response agree with the input — `every_surface_platform_code_isolated` passes, `surfaces_without_isolated_platform_code` is `[]` and `isolated_platform_code_coverage` is `"1.000000"`. The `notes` text is unscored prose; the input, expected values and recorded responses govern, and this document follows them.

## Worked examples

Provenance: recorded 2026-11-16T07:28:17.034919+00:00 against gateway v1.1.0, external verification lane, source `verification/work/multiplatform-core-design/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T07:28:17.034919+00:00 · gateway v1.1.0 · source `verification/work/multiplatform-core-design/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "core_architecture",
      "check": "core_holds_logic",
      "status": "pass",
      "evidence": "core architecture: the portable core holds the logic"
    },
    {
      "section": "core_architecture",
      "check": "core_holds_crypto",
      "status": "pass",
      "evidence": "core architecture: the portable core holds the crypto"
    },
    {
      "section": "core_architecture",
      "check": "core_holds_data_model",
      "status": "pass",
      "evidence": "core architecture: the portable core holds the data model"
    },
    {
      "section": "core_architecture",
      "check": "core_in_portable_language",
      "status": "pass",
      "evidence": "core architecture: the core is in a portable language"
    },
    {
      "section": "core_architecture",
      "check": "single_internal_api_defined",
      "status": "pass",
      "evidence": "core architecture: one internal API the core exposes is defined"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "web_installable",
      "status": "pass",
      "evidence": "surfaces: the web / PWA surface is installable"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "web_offline_capable_service_worker",
      "status": "pass",
      "evidence": "surfaces: the web / PWA surface is offline-capable via a service worker"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "web_responsive",
      "status": "pass",
      "evidence": "surfaces: the web / PWA surface is responsive"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "mobile_pwa_first_where_sufficient",
      "status": "pass",
      "evidence": "surfaces: mobile is PWA-first where it suffices"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "mobile_native_only_when_truly_needed",
      "status": "pass",
      "evidence": "surfaces: mobile is native / APK only when truly needed"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "desktop_single_static_binary_where_possible",
      "status": "pass",
      "evidence": "surfaces: desktop / CLI is a single static binary where possible"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "cli_good_help",
      "status": "pass",
      "evidence": "surfaces: the CLI has good --help"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "cli_correct_exit_codes",
      "status": "pass",
      "evidence": "surfaces: the CLI uses correct exit codes"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "cli_pipe_friendly_output",
      "status": "pass",
      "evidence": "surfaces: the CLI output is pipe-friendly"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "api_one_typed_contract",
      "status": "pass",
      "evidence": "surfaces: the API is one typed contract any surface consumes"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "surfaces_declared",
      "status": "pass",
      "evidence": "the declared record names its surfaces — the surfaces list is present and non-empty"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "every_surface_kind_valid",
      "status": "pass",
      "evidence": "surfaces: every declared surface row declares a kind from the skill's set — web_pwa / mobile / desktop_cli / api"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "every_surface_consumes_core_contract",
      "status": "pass",
      "evidence": "surfaces: every declared surface row consumes the same core contract — surfaces are thin adapters, not rewrites"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "every_surface_platform_code_isolated",
      "status": "pass",
      "evidence": "surfaces: every declared surface row isolates its platform-specific code behind interfaces"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "no_surface_reimplements_core_logic",
      "status": "pass",
      "evidence": "surfaces: no declared surface row reimplements core logic — the core is shared, not rewritten per platform"
    },
    {
      "section": "local_first_and_portability",
      "check": "source_of_truth_on_device",
      "status": "pass",
      "evidence": "local-first: the source of truth is on the device"
    },
    {
      "section": "local_first_and_portability",
      "check": "sync_is_enhancement_not_requirement",
      "status": "pass",
      "evidence": "local-first: sync is an enhancement, not a requirement"
    },
    {
      "section": "local_first_and_portability",
      "check": "user_data_and_keys_stay_on_device_hardware",
      "status": "pass",
      "evidence": "local-first: the user's data and keys stay on their hardware"
    },
    {
      "section": "local_first_and_portability",
      "check": "platform_specific_code_behind_interfaces",
      "status": "pass",
      "evidence": "portability discipline: platform-specific code is isolated behind interfaces"
    },
    {
      "section": "local_first_and_portability",
      "check": "per_platform_forks_minimized",
      "status": "pass",
      "evidence": "portability discipline: per-platform forks are minimized"
    },
    {
      "section": "local_first_and_portability",
      "check": "one_design_system_across_surfaces",
      "status": "pass",
      "evidence": "portability discipline: one design system runs across surfaces"
    },
    {
      "section": "local_first_and_portability",
      "check": "each_platform_conventions_respected",
      "status": "pass",
      "evidence": "portability discipline: each platform's conventions are respected"
    },
    {
      "section": "packaging_and_testing",
      "check": "reproducible_builds",
      "status": "pass",
      "evidence": "packaging: builds are reproducible"
    },
    {
      "section": "packaging_and_testing",
      "check": "signed_builds",
      "status": "pass",
      "evidence": "packaging: builds are signed"
    },
    {
      "section": "packaging_and_testing",
      "check": "no_docker",
      "status": "pass",
      "evidence": "packaging: no Docker is used"
    },
    {
      "section": "packaging_and_testing",
      "check": "distribution_route_decided_per_surface",
      "status": "pass",
      "evidence": "packaging: store vs sideload vs direct is decided per surface"
    },
    {
      "section": "packaging_and_testing",
      "check": "shared_core_tested_thoroughly_once",
      "status": "pass",
      "evidence": "testing: the shared core is tested thoroughly once"
    },
    {
      "section": "packaging_and_testing",
      "check": "each_surface_smoke_tested",
      "status": "pass",
      "evidence": "testing: each surface is smoke-tested for integration and platform quirks"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_core_logic_rewritten_per_platform",
      "status": "pass",
      "evidence": "red line: core logic is not rewritten per platform"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_lowest_common_denominator_ux",
      "status": "pass",
      "evidence": "red line: no lowest-common-denominator UX is shipped"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_platform_conventions_ignored",
      "status": "pass",
      "evidence": "red line: platform conventions are not ignored"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_online_only_where_offline_matters",
      "status": "pass",
      "evidence": "red line: the design is not online-only where offline genuinely matters"
    }
  ],
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
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across five sections.",
  "stamp": "MULTIPLATFORM CORE DESIGN\nproject: Vault\nVERDICT: MULTIPLATFORM_CORE_SOUND\n  core_architecture                    pass\n  surfaces_and_thin_adapters           pass\n  local_first_and_portability          pass\n  packaging_and_testing                pass\n  anti_pattern_red_lines               pass\n37 pass, 0 fail, 0 missing of 37 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T07:28:17.034919+00:00 · gateway v1.1.0 · source `verification/work/multiplatform-core-design/evidence.json`.

Input:

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
      "kind": "watch",
      "consumes_core_contract": false,
      "platform_code_isolated": true,
      "core_logic_reimplemented": true
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
    "docker_used": true,
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

Response (HTTP 200):

```json
{
  "service": "multiplatform-core-design",
  "atom_version": "0.1.0",
  "project": "Vault",
  "verdict": "MULTIPLATFORM_CORE_NOT_SOUND",
  "sections": {
    "core_architecture": "pass",
    "surfaces_and_thin_adapters": "fail",
    "local_first_and_portability": "pass",
    "packaging_and_testing": "fail",
    "anti_pattern_red_lines": "pass"
  },
  "checks": [
    {
      "section": "core_architecture",
      "check": "core_holds_logic",
      "status": "pass",
      "evidence": "core architecture: the portable core holds the logic"
    },
    {
      "section": "core_architecture",
      "check": "core_holds_crypto",
      "status": "pass",
      "evidence": "core architecture: the portable core holds the crypto"
    },
    {
      "section": "core_architecture",
      "check": "core_holds_data_model",
      "status": "pass",
      "evidence": "core architecture: the portable core holds the data model"
    },
    {
      "section": "core_architecture",
      "check": "core_in_portable_language",
      "status": "pass",
      "evidence": "core architecture: the core is in a portable language"
    },
    {
      "section": "core_architecture",
      "check": "single_internal_api_defined",
      "status": "pass",
      "evidence": "core architecture: one internal API the core exposes is defined"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "web_installable",
      "status": "pass",
      "evidence": "surfaces: the web / PWA surface is installable"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "web_offline_capable_service_worker",
      "status": "pass",
      "evidence": "surfaces: the web / PWA surface is offline-capable via a service worker"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "web_responsive",
      "status": "pass",
      "evidence": "surfaces: the web / PWA surface is responsive"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "mobile_pwa_first_where_sufficient",
      "status": "pass",
      "evidence": "surfaces: mobile is PWA-first where it suffices"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "mobile_native_only_when_truly_needed",
      "status": "pass",
      "evidence": "surfaces: mobile is native / APK only when truly needed"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "desktop_single_static_binary_where_possible",
      "status": "pass",
      "evidence": "surfaces: desktop / CLI is a single static binary where possible"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "cli_good_help",
      "status": "pass",
      "evidence": "surfaces: the CLI has good --help"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "cli_correct_exit_codes",
      "status": "pass",
      "evidence": "surfaces: the CLI uses correct exit codes"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "cli_pipe_friendly_output",
      "status": "pass",
      "evidence": "surfaces: the CLI output is pipe-friendly"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "api_one_typed_contract",
      "status": "pass",
      "evidence": "surfaces: the API is one typed contract any surface consumes"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "surfaces_declared",
      "status": "pass",
      "evidence": "the declared record names its surfaces — the surfaces list is present and non-empty"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "every_surface_kind_valid",
      "status": "fail",
      "evidence": "surfaces: every declared surface row declares a kind from the skill's set — web_pwa / mobile / desktop_cli / api"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "every_surface_consumes_core_contract",
      "status": "fail",
      "evidence": "surfaces: every declared surface row consumes the same core contract — surfaces are thin adapters, not rewrites"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "every_surface_platform_code_isolated",
      "status": "pass",
      "evidence": "surfaces: every declared surface row isolates its platform-specific code behind interfaces"
    },
    {
      "section": "surfaces_and_thin_adapters",
      "check": "no_surface_reimplements_core_logic",
      "status": "fail",
      "evidence": "surfaces: no declared surface row reimplements core logic — the core is shared, not rewritten per platform"
    },
    {
      "section": "local_first_and_portability",
      "check": "source_of_truth_on_device",
      "status": "pass",
      "evidence": "local-first: the source of truth is on the device"
    },
    {
      "section": "local_first_and_portability",
      "check": "sync_is_enhancement_not_requirement",
      "status": "pass",
      "evidence": "local-first: sync is an enhancement, not a requirement"
    },
    {
      "section": "local_first_and_portability",
      "check": "user_data_and_keys_stay_on_device_hardware",
      "status": "pass",
      "evidence": "local-first: the user's data and keys stay on their hardware"
    },
    {
      "section": "local_first_and_portability",
      "check": "platform_specific_code_behind_interfaces",
      "status": "pass",
      "evidence": "portability discipline: platform-specific code is isolated behind interfaces"
    },
    {
      "section": "local_first_and_portability",
      "check": "per_platform_forks_minimized",
      "status": "pass",
      "evidence": "portability discipline: per-platform forks are minimized"
    },
    {
      "section": "local_first_and_portability",
      "check": "one_design_system_across_surfaces",
      "status": "pass",
      "evidence": "portability discipline: one design system runs across surfaces"
    },
    {
      "section": "local_first_and_portability",
      "check": "each_platform_conventions_respected",
      "status": "pass",
      "evidence": "portability discipline: each platform's conventions are respected"
    },
    {
      "section": "packaging_and_testing",
      "check": "reproducible_builds",
      "status": "pass",
      "evidence": "packaging: builds are reproducible"
    },
    {
      "section": "packaging_and_testing",
      "check": "signed_builds",
      "status": "pass",
      "evidence": "packaging: builds are signed"
    },
    {
      "section": "packaging_and_testing",
      "check": "no_docker",
      "status": "fail",
      "evidence": "packaging: no Docker is used"
    },
    {
      "section": "packaging_and_testing",
      "check": "distribution_route_decided_per_surface",
      "status": "pass",
      "evidence": "packaging: store vs sideload vs direct is decided per surface"
    },
    {
      "section": "packaging_and_testing",
      "check": "shared_core_tested_thoroughly_once",
      "status": "pass",
      "evidence": "testing: the shared core is tested thoroughly once"
    },
    {
      "section": "packaging_and_testing",
      "check": "each_surface_smoke_tested",
      "status": "pass",
      "evidence": "testing: each surface is smoke-tested for integration and platform quirks"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_core_logic_rewritten_per_platform",
      "status": "pass",
      "evidence": "red line: core logic is not rewritten per platform"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_lowest_common_denominator_ux",
      "status": "pass",
      "evidence": "red line: no lowest-common-denominator UX is shipped"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_platform_conventions_ignored",
      "status": "pass",
      "evidence": "red line: platform conventions are not ignored"
    },
    {
      "section": "anti_pattern_red_lines",
      "check": "no_online_only_where_offline_matters",
      "status": "pass",
      "evidence": "red line: the design is not online-only where offline genuinely matters"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "surfaces_count": 1,
  "surfaces_with_invalid_kind": [
    "web_client"
  ],
  "valid_kind_coverage": "0.000000",
  "surfaces_not_consuming_core_contract": [
    "web_client"
  ],
  "core_contract_coverage": "0.000000",
  "surfaces_without_isolated_platform_code": [],
  "isolated_platform_code_coverage": "1.000000",
  "surfaces_reimplementing_core_logic": [
    "web_client"
  ],
  "no_core_reimplementation_coverage": "0.000000",
  "summary": "33 pass, 4 fail, 0 missing of 37 checks across five sections.",
  "stamp": "MULTIPLATFORM CORE DESIGN\nproject: Vault\nVERDICT: MULTIPLATFORM_CORE_NOT_SOUND\n  core_architecture                    pass\n  surfaces_and_thin_adapters           fail\n  local_first_and_portability          pass\n  packaging_and_testing                fail\n  anti_pattern_red_lines               pass\n33 pass, 4 fail, 0 missing of 37 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T07:28:17.034919+00:00 · gateway v1.1.0 · source `verification/work/multiplatform-core-design/evidence.json`.

Input:

```json
{
  "project": "Malformed",
  "core": "not_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "core",
  "detail": "core must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared multiplatform design record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not an architecture service, a portability guarantee or a build certification, and it verifies no live fact. |
| Checks named | 37 documented / 37 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`surfaces_count`, the four row-name lists and the four coverage ratios) |
| Input reference typed | Yes — 50 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/multiplatform-core-design/evidence.json` |
