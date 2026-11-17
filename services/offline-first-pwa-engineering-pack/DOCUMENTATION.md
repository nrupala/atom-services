# Offline first pwa engineering pack — documentation

**Offline first pwa engineering pack** · slug `offline-first-pwa-engineering-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/offline-first-pwa-engineering-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment c64bdc48fce84cd4817fe3a293be6ae5). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `app` "TestApp"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "offline-first-pwa-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the offline-first PWA engineering manifest.** You declare a record of an app's offline-first PWA engineering — the atom audits the declared record, it does not build a PWA or inspect a live app (see Explanation). The recorded full-pass manifest declares the app `TestApp`: the local store is the primary source and the server is a sync target or absent; two core-flow rows, `login` and `view_dashboard`, both working fully offline; the app shell and versioned assets pre-cached, sensitive responses not cached blindly, an explicit "new version ready" update-flow UI present, and skipWaiting controlled; versioned schema migrations present and tested, quota awareness present and quota exhaustion handled gracefully, export and import paths present, and the export/import round trip verified; server sync used, with a queue with retry and backoff, idempotent operations, explicit conflict rules, visible pending/synced/failed state, and indefinite spinners avoided; a web app manifest, icons and theming present, keyboard-first usability addressed, and degraded-mode messaging present; zero-knowledge claimed, with WebCrypto used, keys never exported unencrypted, and platform limits disclosed honestly; DevTools offline and throttle tests performed, a storage-full simulation performed, the upgrade path from old data tested, install/uninstall flows tested, and the service-worker update flow exercised; and all three red-line flags `false` (no silent data loss present, no caching of secrets present, no network-required core flows claimed offline-first present).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/offline-first-pwa-engineering-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `OFFLINE_FIRST_PWA_SOUND`: "41 pass, 0 fail, 0 missing of 41 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `core_flows_count` is 2, `offline_coverage` is `"1.000000"`, and both row-name lists are empty (`flows_without_offline_support` and `duplicate_flow_names` are each `[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `OFFLINE_FIRST_PWA_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "offline-first-pwa-engineering-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/offline-first-pwa-engineering-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/offline-first-pwa-engineering-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `offline_first_pwa_engineering_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `OFFLINE_FIRST_PWA_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `app_shell_precached`, `every_core_flow_works_fully_offline`, `no_core_flow_name_duplicated`, `silent_data_loss_refused`, and the summary reads "37 pass, 4 fail, 0 missing of 41 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `flows_without_offline_support` names `login` — the first core-flow row declares `works_fully_offline: false` — `offline_coverage` is `"0.500000"`, `duplicate_flow_names` names `login` — both core-flow rows declare the name `login` — `service_worker.app_shell_precached` is declared `false`, failing `app_shell_precached`, and `red_lines.silent_data_loss_present` is declared `true`, failing `silent_data_loss_refused`; sections `offline_first_architecture`, `service_worker_discipline` and `pwa_red_lines` report `fail`, the other four `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "architecture.local_store_is_primary_source",
  "detail": "architecture.local_store_is_primary_source must be a boolean"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/offline-first-pwa-engineering-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/offline-first-pwa-engineering-pack` — tool name `offline_first_pwa_engineering_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `offline_first_pwa_engineering_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `app` and the `core_flows[]` name field are noted as strings and `core_flows` as a list there. Where SERVICE.md states no type — the section container objects (`architecture`, `service_worker`, `storage`, `sync`, `installability`, `encryption`, `testing`, `red_lines`) and a `core_flows[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and `core_flows`, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `core_flows` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `OFFLINE_FIRST_PWA_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `app` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: offline_first_architecture

| Field | Type | Notes |
|---|---|---|
| `architecture` | object | The architecture section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `architecture.local_store_is_primary_source` | boolean | — |
| `architecture.server_is_sync_target_or_absent` | boolean | — |
| `core_flows` | list | list of core-flow-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `core_flows[]` | object | One declared core-flow row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `core_flows[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `core_flows[].works_fully_offline` | boolean | — |

#### Read by: service_worker_discipline

| Field | Type | Notes |
|---|---|---|
| `service_worker` | object | The service-worker section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `service_worker.app_shell_precached` | boolean | — |
| `service_worker.versioned_assets_precached` | boolean | — |
| `service_worker.sensitive_responses_not_cached_blindly` | boolean | — |
| `service_worker.update_flow_new_version_ready_ui_present` | boolean | — |
| `service_worker.skip_waiting_controlled` | boolean | — |

#### Read by: storage_engineering

| Field | Type | Notes |
|---|---|---|
| `storage` | object | The storage section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `storage.versioned_schema_migrations_present` | boolean | — |
| `storage.migrations_tested` | boolean | — |
| `storage.quota_awareness_present` | boolean | — |
| `storage.quota_exhaustion_handled_gracefully` | boolean | — |
| `storage.export_path_exists` | boolean | — |
| `storage.import_path_exists` | boolean | — |
| `storage.export_import_round_trip_verified` | boolean | — |

#### Read by: sync_and_honest_state

| Field | Type | Notes |
|---|---|---|
| `sync` | object | The sync section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `sync.server_sync_used` | boolean | the applicability gate for the four sync checks below |
| `sync.queue_with_retry_and_backoff` | boolean | gated — applies only when `server_sync_used` is `true` |
| `sync.operations_idempotent` | boolean | gated, as above |
| `sync.conflict_rules_explicit` | boolean | gated, as above |
| `sync.state_visible_pending_synced_failed` | boolean | gated, as above |
| `sync.indefinite_spinners_avoided` | boolean | — |

#### Read by: installability_encryption_and_ux

| Field | Type | Notes |
|---|---|---|
| `installability` | object | The installability section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `installability.web_app_manifest_present` | boolean | — |
| `installability.icons_present` | boolean | — |
| `installability.theming_present` | boolean | — |
| `installability.keyboard_first_usability_addressed` | boolean | — |
| `installability.degraded_mode_messaging_present` | boolean | — |
| `encryption` | object | The encryption section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `encryption.zero_knowledge_claimed` | boolean | the applicability gate for the three encryption checks below |
| `encryption.webcrypto_used` | boolean | gated — applies only when `zero_knowledge_claimed` is `true` |
| `encryption.keys_never_exported_unencrypted` | boolean | gated, as above |
| `encryption.platform_limits_disclosed_honestly` | boolean | gated, as above |

#### Read by: testing_and_quality_gates

| Field | Type | Notes |
|---|---|---|
| `testing` | object | The testing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `testing.devtools_offline_test_performed` | boolean | — |
| `testing.devtools_throttle_test_performed` | boolean | — |
| `testing.storage_full_simulation_performed` | boolean | — |
| `testing.upgrade_path_old_data_tested` | boolean | — |
| `testing.install_uninstall_flows_tested` | boolean | — |
| `testing.service_worker_update_flow_exercised` | boolean | — |

#### Read by: pwa_red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.silent_data_loss_present` | boolean | must be `false` to pass |
| `red_lines.caching_of_secrets_present` | boolean | must be `false` to pass |
| `red_lines.network_required_core_flows_claimed_offline_first_present` | boolean | must be `false` to pass |

### Checks

All 41 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: offline_first_architecture

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `local_store_is_primary_source` | architecture: the local store is the primary source for user data | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `server_is_sync_target_or_absent` | architecture: the server is a sync target, or absent entirely, never the primary source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `core_flows_declared` | the declared record names its core flows -- the core flows list is present and non-empty | Computed over the declared record. Pass: the `core_flows` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_core_flow_works_fully_offline` | architecture: every declared core flow works fully offline | Computed over the declared record. Pass: every declared core-flow row declares `works_fully_offline: true`. Fail: a row declares `works_fully_offline` present but not `true` (offending rows are named in `flows_without_offline_support`). Missing: the list is absent, or a row has `works_fully_offline` absent (such a row is missing evidence and does not appear in `flows_without_offline_support`). |
| `no_core_flow_name_duplicated` | core flows: no declared core flow name is owned by more than one core flow row | Computed over the declared record. Pass: no declared `name` string appears on more than one core-flow row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_flow_names`). Missing: the list is absent, or a row has `name` absent (such a row is missing evidence for this check). |

#### Section: service_worker_discipline

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `app_shell_precached` | service worker: the app shell is pre-cached | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `versioned_assets_precached` | service worker: versioned assets are pre-cached | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sensitive_responses_not_cached_blindly` | service worker: sensitive responses are never cached blindly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `update_flow_new_version_ready_ui_present` | service worker: the update flow is explicit, with a new version ready UI | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `skip_waiting_controlled` | service worker: skipWaiting is controlled, not automatic and uncontrolled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: storage_engineering

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `versioned_schema_migrations_present` | storage: versioned schema migrations are present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `migrations_tested` | storage: storage migrations are tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `quota_awareness_present` | storage: quota awareness is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `quota_exhaustion_handled_gracefully` | storage: quota exhaustion is handled gracefully, including storage-full | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `export_path_exists` | storage: an export path exists so users truly own their data | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `import_path_exists` | storage: an import path exists so users truly own their data | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `export_import_round_trip_verified` | storage: the export path exists and round-trips through import | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: sync_and_honest_state

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sync_applicability_declared` | sync: whether the app uses server sync is declared -- the sync checks apply only when it does, because the server may be absent entirely | Pass: `sync.server_sync_used` is declared (either `true` or `false`) -- SERVICE.md states this check passes whenever the gate field is present. Fail: no fail condition is stated for a present gate field. Missing: the gate field is absent. |
| `queue_with_retry_and_backoff` | sync: changes are queued with retry and backoff | Gated on `sync.server_sync_used`. Pass: the gate is declared `false` (passes as not applicable, whatever the field declares), or the gate is declared `true` and the field is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate or the field itself is absent. |
| `operations_idempotent` | sync: sync operations are idempotent | Gated on `sync.server_sync_used`. Pass: the gate is declared `false` (passes as not applicable, whatever the field declares), or the gate is declared `true` and the field is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate or the field itself is absent. |
| `conflict_rules_explicit` | sync: conflict rules are explicit -- last-write-wins or a domain-specific merge, declared not implicit | Gated on `sync.server_sync_used`. Pass: the gate is declared `false` (passes as not applicable, whatever the field declares), or the gate is declared `true` and the field is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate or the field itself is absent. |
| `state_visible_pending_synced_failed` | sync: visible sync state -- pending, synced and failed -- is shown | Gated on `sync.server_sync_used`. Pass: the gate is declared `false` (passes as not applicable, whatever the field declares), or the gate is declared `true` and the field is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate or the field itself is absent. |
| `indefinite_spinners_avoided` | honest state: there are no spinners-forever -- the UI tells the truth about sync state | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: installability_encryption_and_ux

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `web_app_manifest_present` | installability: a web app manifest is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `icons_present` | installability: icons are present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `theming_present` | installability: theming is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `keyboard_first_usability_addressed` | UX: keyboard-first usability is addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `degraded_mode_messaging_present` | UX: degraded-mode messaging is present when features need connectivity | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zero_knowledge_applicability_declared` | encryption: whether zero-knowledge is claimed is declared -- the encryption checks apply only when it is claimed | Pass: `encryption.zero_knowledge_claimed` is declared (either `true` or `false`) -- SERVICE.md states this check passes whenever the gate field is present. Fail: no fail condition is stated for a present gate field. Missing: the gate field is absent. |
| `webcrypto_used` | encryption: WebCrypto is used when zero-knowledge is claimed | Gated on `encryption.zero_knowledge_claimed`. Pass: the gate is declared `false` (passes as not applicable, whatever the field declares), or the gate is declared `true` and the field is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate or the field itself is absent. |
| `keys_never_exported_unencrypted` | encryption: keys never leave the device unencrypted | Gated on `encryption.zero_knowledge_claimed`. Pass: the gate is declared `false` (passes as not applicable, whatever the field declares), or the gate is declared `true` and the field is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate or the field itself is absent. |
| `platform_limits_disclosed_honestly` | encryption: web-platform limits, including secure storage constraints, are disclosed honestly | Gated on `encryption.zero_knowledge_claimed`. Pass: the gate is declared `false` (passes as not applicable, whatever the field declares), or the gate is declared `true` and the field is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate or the field itself is absent. |

#### Section: testing_and_quality_gates

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `devtools_offline_test_performed` | testing: a DevTools offline test is performed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `devtools_throttle_test_performed` | testing: a DevTools throttle test is performed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `storage_full_simulation_performed` | testing: a storage-full simulation is performed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `upgrade_path_old_data_tested` | testing: the upgrade path is tested -- old data to new version | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `install_uninstall_flows_tested` | testing: install and uninstall flows are tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `service_worker_update_flow_exercised` | testing: the update flow for a new service worker is exercised | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: pwa_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `silent_data_loss_refused` | red line: no silent data loss -- quota and deletes must warn | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `secrets_caching_refused` | red line: no caching of secrets is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `network_required_core_flow_offline_claim_refused` | red line: no offline-first claim is made with network-required core flows | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"offline-first-pwa-engineering-pack"`), `atom_version` (`"0.1.0"`), and `app` (the manifest's declared app value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `core_flows_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `flows_without_offline_support` (flows whose `works_fully_offline` field is present but not `true`; a flow with the field absent is missing evidence and does not appear) and `duplicate_flow_names` (flow names declared on more than one row, in the order their second occurrence appears) — both lists are null when the `core_flows` list is not declared, as recorded in the sparse case; and the ratio `offline_coverage` (flows working fully offline ÷ declared flows) — a string with exactly six decimal places; the ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "41 pass, 0 fail, 0 missing of 41 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared app value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `OFFLINE_FIRST_PWA_SOUND` — all 41 checks pass: the declared offline-first PWA engineering record is complete and consistent with the bound skill's checklist and red lines.
- `OFFLINE_FIRST_PWA_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the three primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for a gated check, also when its gate is declared `false` and the check passes as not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent (for a gated check, also when its gate is absent).

**Secondary computed fields:** `core_flows_count`, `flows_without_offline_support`, `offline_coverage`, `duplicate_flow_names` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"architecture.local_store_is_primary_source","detail":"architecture.local_store_is_primary_source must be a boolean"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Build offline-first web apps — service workers, local storage, sync queues, installability, honest state UI (the bound capability, from the skill). You submit one declared record — the offline-first PWA engineering manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 7 sections (`offline_first_architecture`, `service_worker_discipline`, `storage_engineering`, `sync_and_honest_state`, `installability_encryption_and_ux`, `testing_and_quality_gates`, `pwa_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Gated checks* follow a declared applicability flag exactly as declared: `sync_applicability_declared` passes whenever `sync.server_sync_used` is present (either value), and each gated sync check is `missing` when the gate or the field itself is absent, passes as not applicable when the gate is declared `false` (whatever the field declares), and when the gate is declared `true` passes only when the field is declared `true`; the encryption group is identical in shape, gated on `encryption.zero_knowledge_claimed` with its own `zero_knowledge_applicability_declared` check. *Computed checks* are calculated from the declared rows themselves — the declared `core_flows` list must be present and non-empty, every core-flow row must declare `works_fully_offline: true`, and no declared `name` string may appear on more than one core-flow row — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `OFFLINE_FIRST_PWA_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `OFFLINE_FIRST_PWA_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a cache size or precache byte/count budget; a storage quota size in bytes or a quota-warning percentage; a sync retry count, backoff interval, or sync latency; an icon size, icon count, or manifest completeness score; a number of core flows an app must declare beyond the one declared list being non-empty; a coverage percentage below completeness; a specific local store technology mandate (the skill names IndexedDB for structured data and OPFS for files as its method — this atom checks that the local store is primary, not which named technology a caller chose); a specific conflict-resolution algorithm (the skill allows last-write-wins or a domain-specific merge — only that the rule is explicit is checked). Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** offline-first PWA engineering record: a verdict of `OFFLINE_FIRST_PWA_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its app shell pre-cached, its migrations tested and no secrets cached passes those checks even if the real app did none of it. It is a completeness and consistency audit of the engineering record the skill requires, **not PWA engineering, a browser test, or a guarantee that the app works offline**. Specifically: it builds no PWA, runs no service worker, opens no browser, reads no cache, storage or manifest from a live app, and does not verify that a declared practice was ever carried out. It never judges whether the caching strategy is right, whether the conflict rule is good, whether the local store design is sound, or whether users will succeed — only that the record contains what the skill's sections and red lines demand, and that its declared core-flow rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no judgment of engineering quality — whether the service worker, storage or sync design will work is the caller's declaration, checked only for declared presence and consistency; encryption substance (whether WebCrypto is used correctly, whether keys are actually safe) is a caller declaration — only its declared presence under a zero-knowledge claim is checked.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Dogear and vault app builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared offline-first PWA engineering record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence in a regulated domain, and SERVICE.md states explicitly (including its U-13 regulatory screen) that its output could not read as regulated professional advice, that it is not PWA engineering, a browser test, or a guarantee that the app works offline, and that it verifies no live fact. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `offline_first_pwa_engineering_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/offline_first_pwa_engineering_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_offline_first_pwa_engineering_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/offline-first-pwa-engineering-pack` (REST) and `POST /mcp/offline-first-pwa-engineering-pack` (MCP, tool `offline_first_pwa_engineering_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment c64bdc48fce84cd4817fe3a293be6ae5). Key scope: `offline_first_pwa_engineering_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally — NOT deployed**, “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the red-line checks, the applicability checks and the computed checks. Recorded check names used verbatim in the Checks section include `silent_data_loss_refused` (input `red_lines.silent_data_loss_present`), `secrets_caching_refused` (input `red_lines.caching_of_secrets_present`) and `network_required_core_flow_offline_claim_refused` (input `red_lines.network_required_core_flows_claimed_offline_first_present` — note also the singular `core_flow` in the check name against the plural `core_flows` in the input field name), plus `sync_applicability_declared` (reads the gate field `sync.server_sync_used`), `zero_knowledge_applicability_declared` (reads the gate field `encryption.zero_knowledge_claimed`), and the computed checks `core_flows_declared`, `every_core_flow_works_fully_offline` and `no_core_flow_name_duplicated`, which read the `core_flows` rows rather than any single input field.
3. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md's raw-output excerpt likewise trims the checks array). The recorded REST response carries all 41 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
4. **Section grouping vs input objects:** the recorded sections merge separate input objects — `architecture` and the top-level `core_flows` list are read by the single recorded section `offline_first_architecture`, and `installability` and `encryption` inputs are read by the single recorded section `installability_encryption_and_ux`. This document groups the Input reference and the Checks by the recorded section names.
5. **Null lists on an undeclared `core_flows` list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `core_flows_count` and the coverage ratio, but does not state a null rule for the two row-name lists. The recorded sparse response returns both lists (`flows_without_offline_support` and `duplicate_flow_names`) as `null` when `core_flows` is not declared (as USER-GUIDE.md also states); this document follows the recording.
6. **Case-design nesting of `core_flows` — unscored prose / raw design, responses govern:** the Wave 12 case design first nested `core_flows` inside `architecture` (visible in the raw design file `verification/work/offline-first-pwa-engineering-pack/cases-raw-gemini.json` and recorded as a tester error in TEST-REPORT.md and `corrections.json`); the oracle pre-run caught 3 missing checks (`core_flows_declared`, `every_core_flow_works_fully_offline`, `no_core_flow_name_duplicated`) and the field was moved to the top level per SERVICE.md / MANIFEST_SPEC. The executed `cases.json` and the recorded evidence inputs carry `core_flows` at the top level, and the executed battery is the corrected one. Any earlier nesting is unscored design prose only; the recorded executions govern.
7. **Contract endpoints list vs live faces:** contract.yaml lists only `agent` under `endpoints`, while the recorded battery proves live REST and MCP faces (REST, REST-repeat and MCP executions in evidence.json, with MCP/REST parity). This document follows the recording: REST and MCP are the documented endpoints.

## Worked examples

Provenance: recorded 2026-11-16T08:32:44.994733+00:00 against gateway v1.1.0, external verification lane, source `verification/work/offline-first-pwa-engineering-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T08:32:44.994733+00:00 · gateway v1.1.0 · source `verification/work/offline-first-pwa-engineering-pack/evidence.json`.

Input:

```json
{
  "app": "TestApp",
  "architecture": {
    "local_store_is_primary_source": true,
    "server_is_sync_target_or_absent": true
  },
  "service_worker": {
    "app_shell_precached": true,
    "versioned_assets_precached": true,
    "sensitive_responses_not_cached_blindly": true,
    "update_flow_new_version_ready_ui_present": true,
    "skip_waiting_controlled": true
  },
  "storage": {
    "versioned_schema_migrations_present": true,
    "migrations_tested": true,
    "quota_awareness_present": true,
    "quota_exhaustion_handled_gracefully": true,
    "export_path_exists": true,
    "import_path_exists": true,
    "export_import_round_trip_verified": true
  },
  "sync": {
    "server_sync_used": true,
    "queue_with_retry_and_backoff": true,
    "operations_idempotent": true,
    "conflict_rules_explicit": true,
    "state_visible_pending_synced_failed": true,
    "indefinite_spinners_avoided": true
  },
  "installability": {
    "web_app_manifest_present": true,
    "icons_present": true,
    "theming_present": true,
    "keyboard_first_usability_addressed": true,
    "degraded_mode_messaging_present": true
  },
  "encryption": {
    "zero_knowledge_claimed": true,
    "webcrypto_used": true,
    "keys_never_exported_unencrypted": true,
    "platform_limits_disclosed_honestly": true
  },
  "testing": {
    "devtools_offline_test_performed": true,
    "devtools_throttle_test_performed": true,
    "storage_full_simulation_performed": true,
    "upgrade_path_old_data_tested": true,
    "install_uninstall_flows_tested": true,
    "service_worker_update_flow_exercised": true
  },
  "red_lines": {
    "silent_data_loss_present": false,
    "caching_of_secrets_present": false,
    "network_required_core_flows_claimed_offline_first_present": false
  },
  "core_flows": [
    {
      "name": "login",
      "works_fully_offline": true
    },
    {
      "name": "view_dashboard",
      "works_fully_offline": true
    }
  ]
}
```

Response (HTTP 200):

```json
{
  "service": "offline-first-pwa-engineering-pack",
  "atom_version": "0.1.0",
  "app": "TestApp",
  "verdict": "OFFLINE_FIRST_PWA_SOUND",
  "sections": {
    "offline_first_architecture": "pass",
    "service_worker_discipline": "pass",
    "storage_engineering": "pass",
    "sync_and_honest_state": "pass",
    "installability_encryption_and_ux": "pass",
    "testing_and_quality_gates": "pass",
    "pwa_red_lines": "pass"
  },
  "checks": [
    {
      "section": "offline_first_architecture",
      "check": "local_store_is_primary_source",
      "status": "pass",
      "evidence": "architecture: the local store is the primary source for user data"
    },
    {
      "section": "offline_first_architecture",
      "check": "server_is_sync_target_or_absent",
      "status": "pass",
      "evidence": "architecture: the server is a sync target, or absent entirely, never the primary source"
    },
    {
      "section": "offline_first_architecture",
      "check": "core_flows_declared",
      "status": "pass",
      "evidence": "the declared record names its core flows -- the core flows list is present and non-empty"
    },
    {
      "section": "offline_first_architecture",
      "check": "every_core_flow_works_fully_offline",
      "status": "pass",
      "evidence": "architecture: every declared core flow works fully offline"
    },
    {
      "section": "offline_first_architecture",
      "check": "no_core_flow_name_duplicated",
      "status": "pass",
      "evidence": "core flows: no declared core flow name is owned by more than one core flow row"
    },
    {
      "section": "service_worker_discipline",
      "check": "app_shell_precached",
      "status": "pass",
      "evidence": "service worker: the app shell is pre-cached"
    },
    {
      "section": "service_worker_discipline",
      "check": "versioned_assets_precached",
      "status": "pass",
      "evidence": "service worker: versioned assets are pre-cached"
    },
    {
      "section": "service_worker_discipline",
      "check": "sensitive_responses_not_cached_blindly",
      "status": "pass",
      "evidence": "service worker: sensitive responses are never cached blindly"
    },
    {
      "section": "service_worker_discipline",
      "check": "update_flow_new_version_ready_ui_present",
      "status": "pass",
      "evidence": "service worker: the update flow is explicit, with a new version ready UI"
    },
    {
      "section": "service_worker_discipline",
      "check": "skip_waiting_controlled",
      "status": "pass",
      "evidence": "service worker: skipWaiting is controlled, not automatic and uncontrolled"
    },
    {
      "section": "storage_engineering",
      "check": "versioned_schema_migrations_present",
      "status": "pass",
      "evidence": "storage: versioned schema migrations are present"
    },
    {
      "section": "storage_engineering",
      "check": "migrations_tested",
      "status": "pass",
      "evidence": "storage: storage migrations are tested"
    },
    {
      "section": "storage_engineering",
      "check": "quota_awareness_present",
      "status": "pass",
      "evidence": "storage: quota awareness is present"
    },
    {
      "section": "storage_engineering",
      "check": "quota_exhaustion_handled_gracefully",
      "status": "pass",
      "evidence": "storage: quota exhaustion is handled gracefully, including storage-full"
    },
    {
      "section": "storage_engineering",
      "check": "export_path_exists",
      "status": "pass",
      "evidence": "storage: an export path exists so users truly own their data"
    },
    {
      "section": "storage_engineering",
      "check": "import_path_exists",
      "status": "pass",
      "evidence": "storage: an import path exists so users truly own their data"
    },
    {
      "section": "storage_engineering",
      "check": "export_import_round_trip_verified",
      "status": "pass",
      "evidence": "storage: the export path exists and round-trips through import"
    },
    {
      "section": "sync_and_honest_state",
      "check": "sync_applicability_declared",
      "status": "pass",
      "evidence": "sync: whether the app uses server sync is declared -- the sync checks apply only when it does, because the server may be absent entirely"
    },
    {
      "section": "sync_and_honest_state",
      "check": "queue_with_retry_and_backoff",
      "status": "pass",
      "evidence": "sync: changes are queued with retry and backoff"
    },
    {
      "section": "sync_and_honest_state",
      "check": "operations_idempotent",
      "status": "pass",
      "evidence": "sync: sync operations are idempotent"
    },
    {
      "section": "sync_and_honest_state",
      "check": "conflict_rules_explicit",
      "status": "pass",
      "evidence": "sync: conflict rules are explicit -- last-write-wins or a domain-specific merge, declared not implicit"
    },
    {
      "section": "sync_and_honest_state",
      "check": "state_visible_pending_synced_failed",
      "status": "pass",
      "evidence": "sync: visible sync state -- pending, synced and failed -- is shown"
    },
    {
      "section": "sync_and_honest_state",
      "check": "indefinite_spinners_avoided",
      "status": "pass",
      "evidence": "honest state: there are no spinners-forever -- the UI tells the truth about sync state"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "web_app_manifest_present",
      "status": "pass",
      "evidence": "installability: a web app manifest is present"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "icons_present",
      "status": "pass",
      "evidence": "installability: icons are present"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "theming_present",
      "status": "pass",
      "evidence": "installability: theming is present"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "keyboard_first_usability_addressed",
      "status": "pass",
      "evidence": "UX: keyboard-first usability is addressed"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "degraded_mode_messaging_present",
      "status": "pass",
      "evidence": "UX: degraded-mode messaging is present when features need connectivity"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "zero_knowledge_applicability_declared",
      "status": "pass",
      "evidence": "encryption: whether zero-knowledge is claimed is declared -- the encryption checks apply only when it is claimed"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "webcrypto_used",
      "status": "pass",
      "evidence": "encryption: WebCrypto is used when zero-knowledge is claimed"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "keys_never_exported_unencrypted",
      "status": "pass",
      "evidence": "encryption: keys never leave the device unencrypted"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "platform_limits_disclosed_honestly",
      "status": "pass",
      "evidence": "encryption: web-platform limits, including secure storage constraints, are disclosed honestly"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "devtools_offline_test_performed",
      "status": "pass",
      "evidence": "testing: a DevTools offline test is performed"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "devtools_throttle_test_performed",
      "status": "pass",
      "evidence": "testing: a DevTools throttle test is performed"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "storage_full_simulation_performed",
      "status": "pass",
      "evidence": "testing: a storage-full simulation is performed"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "upgrade_path_old_data_tested",
      "status": "pass",
      "evidence": "testing: the upgrade path is tested -- old data to new version"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "install_uninstall_flows_tested",
      "status": "pass",
      "evidence": "testing: install and uninstall flows are tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "service_worker_update_flow_exercised",
      "status": "pass",
      "evidence": "testing: the update flow for a new service worker is exercised"
    },
    {
      "section": "pwa_red_lines",
      "check": "silent_data_loss_refused",
      "status": "pass",
      "evidence": "red line: no silent data loss -- quota and deletes must warn"
    },
    {
      "section": "pwa_red_lines",
      "check": "secrets_caching_refused",
      "status": "pass",
      "evidence": "red line: no caching of secrets is present in the record"
    },
    {
      "section": "pwa_red_lines",
      "check": "network_required_core_flow_offline_claim_refused",
      "status": "pass",
      "evidence": "red line: no offline-first claim is made with network-required core flows"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "core_flows_count": 2,
  "flows_without_offline_support": [],
  "offline_coverage": "1.000000",
  "duplicate_flow_names": [],
  "summary": "41 pass, 0 fail, 0 missing of 41 checks across seven sections.",
  "stamp": "OFFLINE-FIRST PWA ENGINEERING PACK\napp: TestApp\nVERDICT: OFFLINE_FIRST_PWA_SOUND\n  offline_first_architecture                   pass\n  service_worker_discipline                    pass\n  storage_engineering                          pass\n  sync_and_honest_state                        pass\n  installability_encryption_and_ux             pass\n  testing_and_quality_gates                    pass\n  pwa_red_lines                                pass\n41 pass, 0 fail, 0 missing of 41 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T08:32:44.994733+00:00 · gateway v1.1.0 · source `verification/work/offline-first-pwa-engineering-pack/evidence.json`.

Input:

```json
{
  "app": "TestApp",
  "architecture": {
    "local_store_is_primary_source": true,
    "server_is_sync_target_or_absent": true
  },
  "service_worker": {
    "app_shell_precached": false,
    "versioned_assets_precached": true,
    "sensitive_responses_not_cached_blindly": true,
    "update_flow_new_version_ready_ui_present": true,
    "skip_waiting_controlled": true
  },
  "storage": {
    "versioned_schema_migrations_present": true,
    "migrations_tested": true,
    "quota_awareness_present": true,
    "quota_exhaustion_handled_gracefully": true,
    "export_path_exists": true,
    "import_path_exists": true,
    "export_import_round_trip_verified": true
  },
  "sync": {
    "server_sync_used": true,
    "queue_with_retry_and_backoff": true,
    "operations_idempotent": true,
    "conflict_rules_explicit": true,
    "state_visible_pending_synced_failed": true,
    "indefinite_spinners_avoided": true
  },
  "installability": {
    "web_app_manifest_present": true,
    "icons_present": true,
    "theming_present": true,
    "keyboard_first_usability_addressed": true,
    "degraded_mode_messaging_present": true
  },
  "encryption": {
    "zero_knowledge_claimed": true,
    "webcrypto_used": true,
    "keys_never_exported_unencrypted": true,
    "platform_limits_disclosed_honestly": true
  },
  "testing": {
    "devtools_offline_test_performed": true,
    "devtools_throttle_test_performed": true,
    "storage_full_simulation_performed": true,
    "upgrade_path_old_data_tested": true,
    "install_uninstall_flows_tested": true,
    "service_worker_update_flow_exercised": true
  },
  "red_lines": {
    "silent_data_loss_present": true,
    "caching_of_secrets_present": false,
    "network_required_core_flows_claimed_offline_first_present": false
  },
  "core_flows": [
    {
      "name": "login",
      "works_fully_offline": false
    },
    {
      "name": "login",
      "works_fully_offline": true
    }
  ]
}
```

Response (HTTP 200):

```json
{
  "service": "offline-first-pwa-engineering-pack",
  "atom_version": "0.1.0",
  "app": "TestApp",
  "verdict": "OFFLINE_FIRST_PWA_NOT_SOUND",
  "sections": {
    "offline_first_architecture": "fail",
    "service_worker_discipline": "fail",
    "storage_engineering": "pass",
    "sync_and_honest_state": "pass",
    "installability_encryption_and_ux": "pass",
    "testing_and_quality_gates": "pass",
    "pwa_red_lines": "fail"
  },
  "checks": [
    {
      "section": "offline_first_architecture",
      "check": "local_store_is_primary_source",
      "status": "pass",
      "evidence": "architecture: the local store is the primary source for user data"
    },
    {
      "section": "offline_first_architecture",
      "check": "server_is_sync_target_or_absent",
      "status": "pass",
      "evidence": "architecture: the server is a sync target, or absent entirely, never the primary source"
    },
    {
      "section": "offline_first_architecture",
      "check": "core_flows_declared",
      "status": "pass",
      "evidence": "the declared record names its core flows -- the core flows list is present and non-empty"
    },
    {
      "section": "offline_first_architecture",
      "check": "every_core_flow_works_fully_offline",
      "status": "fail",
      "evidence": "architecture: every declared core flow works fully offline"
    },
    {
      "section": "offline_first_architecture",
      "check": "no_core_flow_name_duplicated",
      "status": "fail",
      "evidence": "core flows: no declared core flow name is owned by more than one core flow row"
    },
    {
      "section": "service_worker_discipline",
      "check": "app_shell_precached",
      "status": "fail",
      "evidence": "service worker: the app shell is pre-cached"
    },
    {
      "section": "service_worker_discipline",
      "check": "versioned_assets_precached",
      "status": "pass",
      "evidence": "service worker: versioned assets are pre-cached"
    },
    {
      "section": "service_worker_discipline",
      "check": "sensitive_responses_not_cached_blindly",
      "status": "pass",
      "evidence": "service worker: sensitive responses are never cached blindly"
    },
    {
      "section": "service_worker_discipline",
      "check": "update_flow_new_version_ready_ui_present",
      "status": "pass",
      "evidence": "service worker: the update flow is explicit, with a new version ready UI"
    },
    {
      "section": "service_worker_discipline",
      "check": "skip_waiting_controlled",
      "status": "pass",
      "evidence": "service worker: skipWaiting is controlled, not automatic and uncontrolled"
    },
    {
      "section": "storage_engineering",
      "check": "versioned_schema_migrations_present",
      "status": "pass",
      "evidence": "storage: versioned schema migrations are present"
    },
    {
      "section": "storage_engineering",
      "check": "migrations_tested",
      "status": "pass",
      "evidence": "storage: storage migrations are tested"
    },
    {
      "section": "storage_engineering",
      "check": "quota_awareness_present",
      "status": "pass",
      "evidence": "storage: quota awareness is present"
    },
    {
      "section": "storage_engineering",
      "check": "quota_exhaustion_handled_gracefully",
      "status": "pass",
      "evidence": "storage: quota exhaustion is handled gracefully, including storage-full"
    },
    {
      "section": "storage_engineering",
      "check": "export_path_exists",
      "status": "pass",
      "evidence": "storage: an export path exists so users truly own their data"
    },
    {
      "section": "storage_engineering",
      "check": "import_path_exists",
      "status": "pass",
      "evidence": "storage: an import path exists so users truly own their data"
    },
    {
      "section": "storage_engineering",
      "check": "export_import_round_trip_verified",
      "status": "pass",
      "evidence": "storage: the export path exists and round-trips through import"
    },
    {
      "section": "sync_and_honest_state",
      "check": "sync_applicability_declared",
      "status": "pass",
      "evidence": "sync: whether the app uses server sync is declared -- the sync checks apply only when it does, because the server may be absent entirely"
    },
    {
      "section": "sync_and_honest_state",
      "check": "queue_with_retry_and_backoff",
      "status": "pass",
      "evidence": "sync: changes are queued with retry and backoff"
    },
    {
      "section": "sync_and_honest_state",
      "check": "operations_idempotent",
      "status": "pass",
      "evidence": "sync: sync operations are idempotent"
    },
    {
      "section": "sync_and_honest_state",
      "check": "conflict_rules_explicit",
      "status": "pass",
      "evidence": "sync: conflict rules are explicit -- last-write-wins or a domain-specific merge, declared not implicit"
    },
    {
      "section": "sync_and_honest_state",
      "check": "state_visible_pending_synced_failed",
      "status": "pass",
      "evidence": "sync: visible sync state -- pending, synced and failed -- is shown"
    },
    {
      "section": "sync_and_honest_state",
      "check": "indefinite_spinners_avoided",
      "status": "pass",
      "evidence": "honest state: there are no spinners-forever -- the UI tells the truth about sync state"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "web_app_manifest_present",
      "status": "pass",
      "evidence": "installability: a web app manifest is present"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "icons_present",
      "status": "pass",
      "evidence": "installability: icons are present"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "theming_present",
      "status": "pass",
      "evidence": "installability: theming is present"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "keyboard_first_usability_addressed",
      "status": "pass",
      "evidence": "UX: keyboard-first usability is addressed"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "degraded_mode_messaging_present",
      "status": "pass",
      "evidence": "UX: degraded-mode messaging is present when features need connectivity"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "zero_knowledge_applicability_declared",
      "status": "pass",
      "evidence": "encryption: whether zero-knowledge is claimed is declared -- the encryption checks apply only when it is claimed"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "webcrypto_used",
      "status": "pass",
      "evidence": "encryption: WebCrypto is used when zero-knowledge is claimed"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "keys_never_exported_unencrypted",
      "status": "pass",
      "evidence": "encryption: keys never leave the device unencrypted"
    },
    {
      "section": "installability_encryption_and_ux",
      "check": "platform_limits_disclosed_honestly",
      "status": "pass",
      "evidence": "encryption: web-platform limits, including secure storage constraints, are disclosed honestly"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "devtools_offline_test_performed",
      "status": "pass",
      "evidence": "testing: a DevTools offline test is performed"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "devtools_throttle_test_performed",
      "status": "pass",
      "evidence": "testing: a DevTools throttle test is performed"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "storage_full_simulation_performed",
      "status": "pass",
      "evidence": "testing: a storage-full simulation is performed"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "upgrade_path_old_data_tested",
      "status": "pass",
      "evidence": "testing: the upgrade path is tested -- old data to new version"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "install_uninstall_flows_tested",
      "status": "pass",
      "evidence": "testing: install and uninstall flows are tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "service_worker_update_flow_exercised",
      "status": "pass",
      "evidence": "testing: the update flow for a new service worker is exercised"
    },
    {
      "section": "pwa_red_lines",
      "check": "silent_data_loss_refused",
      "status": "fail",
      "evidence": "red line: no silent data loss -- quota and deletes must warn"
    },
    {
      "section": "pwa_red_lines",
      "check": "secrets_caching_refused",
      "status": "pass",
      "evidence": "red line: no caching of secrets is present in the record"
    },
    {
      "section": "pwa_red_lines",
      "check": "network_required_core_flow_offline_claim_refused",
      "status": "pass",
      "evidence": "red line: no offline-first claim is made with network-required core flows"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "core_flows_count": 2,
  "flows_without_offline_support": [
    "login"
  ],
  "offline_coverage": "0.500000",
  "duplicate_flow_names": [
    "login"
  ],
  "summary": "37 pass, 4 fail, 0 missing of 41 checks across seven sections.",
  "stamp": "OFFLINE-FIRST PWA ENGINEERING PACK\napp: TestApp\nVERDICT: OFFLINE_FIRST_PWA_NOT_SOUND\n  offline_first_architecture                   fail\n  service_worker_discipline                    fail\n  storage_engineering                          pass\n  sync_and_honest_state                        pass\n  installability_encryption_and_ux             pass\n  testing_and_quality_gates                    pass\n  pwa_red_lines                                fail\n37 pass, 4 fail, 0 missing of 41 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T08:32:44.994733+00:00 · gateway v1.1.0 · source `verification/work/offline-first-pwa-engineering-pack/evidence.json`.

Input:

```json
{
  "app": "MalformedApp",
  "architecture": {
    "local_store_is_primary_source": "NOT_A_BOOLEAN"
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "architecture.local_store_is_primary_source",
  "detail": "architecture.local_store_is_primary_source must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared offline-first PWA engineering record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence in a regulated domain, not PWA engineering, a browser test or a guarantee that the app works offline, and it verifies no live fact. |
| Checks named | 41 documented / 41 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`core_flows_count`, the two row-name lists and the coverage ratio) |
| Input reference typed | Yes — 51 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/offline-first-pwa-engineering-pack/evidence.json` |
