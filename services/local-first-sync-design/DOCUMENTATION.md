# Local first sync design — documentation

**Local first sync design** · slug `local-first-sync-design` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate, RC soak to 2026-11-22 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples. Where SERVICE.md, TEST-REPORT.md or USER-GUIDE.md disagree with the recorded response, this document follows the recorded response and names the disagreement under [Discrepancies and recording precedence](#discrepancies-and-recording-precedence).

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `app` "Vault"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "local-first-sync-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the local-first-sync manifest.** You declare a record of a sync design already made — the atom audits the record, it does not do the design (see Explanation). The recorded full-pass manifest declares the app `Vault`: the device store authoritative, the server a relay and backup rather than a gate, core flows designed airplane-mode-first, working fully offline, and resuming cleanly after long offline periods; mergeable state on CRDT or OT, with tombstones and a compaction policy declared; one entity, `notes` — user prose, with per-field merge semantics and a stable ID declared, and no silent last-write-wins (`silent_last_write_wins_present: false`); delta sync with causal ordering, resumability, bandwidth budgets, store-and-forward for intermittent peers, and vector clocks / version vectors declared; end-to-end encryption before upload, keys never leaving devices, per-device keys and a key hierarchy declared, key-recovery UX tested like a feature and exercised end to end, and E2EE verified; no personal data synced (`personal_data_synced: false`, so the personal-data encryption check passes as not applicable); automatic merge for text and counters, explicit UI only for semantic conflicts, and neither red line present (`silent_data_loss_present: false`, `silent_last_write_wins_on_user_prose_present: false`); the offline, queued, syncing, synced and conflict states all shown, export and import escape hatches and sync diagnostics present, and no sync badge claimed (`sync_badge_claimed: false`, so the badge check passes as not applicable); and the offline, clock-skew, concurrent-edits and device-loss chaos scenarios tested, merge invariants property-tested, export/import tested on real data volumes, a real device matrix tested, and multi-device round-trip tests passed.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/local-first-sync-design` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `LOCAL_FIRST_SYNC_SOUND`: "47 pass, 0 fail, 0 missing of 47 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `entities_count` is 1, `merge_semantics_coverage` is `"1.000000"`, `stable_id_coverage` is `"1.000000"`, and all three row-name lists (`entities_without_merge_semantics`, `entities_without_stable_id`, `prose_entities_with_silent_last_write_wins`) are empty.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `LOCAL_FIRST_SYNC_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "local-first-sync-design"}`.
3. Call: `POST https://atoms.pipavia.com/v1/local-first-sync-design` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/local-first-sync-design` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `local_first_sync_design`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `LOCAL_FIRST_SYNC_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `no_silent_last_write_wins_on_user_prose`, `no_prose_entity_uses_silent_last_write_wins`, and the summary reads "45 pass, 2 fail, 0 missing of 47 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `prose_entities_with_silent_last_write_wins` names `notes`: the one declared entity, user prose with `silent_last_write_wins_present` changed to `true`, in a manifest that also declares `conflicts.silent_last_write_wins_on_user_prose_present` as `true`; nothing else differs from the full-pass manifest). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "local_truth.device_store_authoritative",
  "detail": "local_truth.device_store_authoritative must be a boolean"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/local-first-sync-design` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/local-first-sync-design` — tool name `local_first_sync_design`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `local_first_sync_design` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. SERVICE.md states no explicit type for the section container objects (`local_truth`, `data_model`, `sync_protocol`, `encryption`, `personal_data_sync`, `conflicts`, `state_ui`, `testing`) or for an `entities[]` row object; those rows are typed `object` here, grounded in the recorded evidence inputs in `verification/work/local-first-sync-design/evidence.json`, where every container is a JSON object. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `LOCAL_FIRST_SYNC_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `app` | string | Carried into the verdict output, not itself checked |

#### Read by: local_truth_and_data_model

| Field | Type | Notes |
|---|---|---|
| `local_truth` | object | The local-truth section object (type grounded in the recorded evidence inputs; SERVICE.md states no type for the container) — a present non-object value is rejected before evaluation |
| `local_truth.device_store_authoritative` | boolean | — |
| `local_truth.server_is_relay_and_backup_not_gate` | boolean | — |
| `local_truth.core_flows_designed_airplane_mode_first` | boolean | — |
| `local_truth.core_flows_work_fully_offline` | boolean | — |
| `local_truth.sync_resumes_cleanly_after_long_offline` | boolean | — |
| `data_model` | object | The data-model section object (type grounded in the recorded evidence inputs; SERVICE.md states no type for the container) — a present non-object value is rejected before evaluation |
| `data_model.mergeable_state_uses_crdt_or_ot` | boolean | — |
| `data_model.tombstones_declared` | boolean | — |
| `data_model.compaction_policy_declared` | boolean | — |
| `entities` | list | list of entity-row objects, each with the entry fields below; computed, see below |
| `entities[]` | object | One declared entity row (type grounded in the recorded evidence inputs; SERVICE.md states no type for the row object) — a present non-object entry is rejected before evaluation |
| `entities[].name` | string | Names the row in the computed outputs |
| `entities[].per_field_merge_semantics_declared` | boolean | — |
| `entities[].stable_id_declared` | boolean | — |
| `entities[].is_user_prose` | boolean (gate) | gates the per-entity last-write-wins check below |
| `entities[].silent_last_write_wins_present` | boolean | must be `false` per user-prose row to pass the computed red-line check |

#### Read by: sync_protocol

| Field | Type | Notes |
|---|---|---|
| `sync_protocol` | object | The sync-protocol section object (type grounded in the recorded evidence inputs; SERVICE.md states no type for the container) — a present non-object value is rejected before evaluation |
| `sync_protocol.delta_sync_declared` | boolean | — |
| `sync_protocol.causal_ordering_declared` | boolean | — |
| `sync_protocol.resumability_declared` | boolean | — |
| `sync_protocol.bandwidth_budgets_declared` | boolean | — |
| `sync_protocol.store_and_forward_for_intermittent_peers` | boolean | — |
| `sync_protocol.vector_clocks_or_version_vectors_declared` | boolean | — |

#### Read by: encryption_and_keys

| Field | Type | Notes |
|---|---|---|
| `encryption` | object | The encryption section object (type grounded in the recorded evidence inputs; SERVICE.md states no type for the container) — a present non-object value is rejected before evaluation |
| `encryption.e2ee_before_upload` | boolean | — |
| `encryption.keys_never_leave_devices` | boolean | — |
| `encryption.per_device_keys_declared` | boolean | — |
| `encryption.key_hierarchy_declared` | boolean | — |
| `encryption.key_recovery_ux_tested_like_a_feature` | boolean | — |
| `encryption.key_recovery_exercised_end_to_end` | boolean | — |
| `encryption.e2ee_verified` | boolean | — |
| `personal_data_sync` | object | The personal-data-sync section object (type grounded in the recorded evidence inputs; SERVICE.md states no type for the container) — a present non-object value is rejected before evaluation |
| `personal_data_sync.personal_data_synced` | boolean (gate) | gates the encryption red-line check below |
| `personal_data_sync.personal_data_encrypted_before_sync` | boolean | required when personal data is declared synced; otherwise the check passes as not applicable |

#### Read by: conflicts_and_state_ui

| Field | Type | Notes |
|---|---|---|
| `conflicts` | object | The conflicts section object (type grounded in the recorded evidence inputs; SERVICE.md states no type for the container) — a present non-object value is rejected before evaluation |
| `conflicts.automatic_merge_for_text_and_counters` | boolean | — |
| `conflicts.explicit_ui_only_for_semantic_conflicts` | boolean | — |
| `conflicts.silent_data_loss_present` | boolean | must be `false` to pass — skill red line |
| `conflicts.silent_last_write_wins_on_user_prose_present` | boolean | must be `false` to pass — skill red line |
| `state_ui` | object | The state-UI section object (type grounded in the recorded evidence inputs; SERVICE.md states no type for the container) — a present non-object value is rejected before evaluation |
| `state_ui.offline_state_shown` | boolean | — |
| `state_ui.queued_state_shown` | boolean | — |
| `state_ui.syncing_state_shown` | boolean | — |
| `state_ui.synced_state_shown` | boolean | — |
| `state_ui.conflict_state_shown` | boolean | — |
| `state_ui.export_escape_hatch_present` | boolean | — |
| `state_ui.import_escape_hatch_present` | boolean | — |
| `state_ui.sync_diagnostics_present` | boolean | — |
| `state_ui.sync_badge_claimed` | boolean (gate) | gates the round-trip red-line check below |

#### Read by: testing_and_quality_gates

| Field | Type | Notes |
|---|---|---|
| `testing` | object | The testing section object (type grounded in the recorded evidence inputs; SERVICE.md states no type for the container) — a present non-object value is rejected before evaluation |
| `testing.chaos_offline_scenario_tested` | boolean | — |
| `testing.chaos_clock_skew_scenario_tested` | boolean | — |
| `testing.chaos_concurrent_edits_scenario_tested` | boolean | — |
| `testing.chaos_device_loss_scenario_tested` | boolean | — |
| `testing.merge_invariants_property_tested` | boolean | — |
| `testing.export_import_tested_on_real_data_volumes` | boolean | — |
| `testing.real_device_matrix_tested` | boolean | — |
| `testing.multi_device_round_trip_tests_passed` | boolean | required when a sync badge is claimed; also checked on its own |

### Checks

All 47 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Check names are the recorded names verbatim; eight of them differ from the input field names they read (see Discrepancies, D3) and are used here exactly as recorded. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: local_truth_and_data_model

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `device_store_authoritative` | local truth: the device store (IndexedDB/SQLite) is authoritative | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `server_is_relay_and_backup_not_gate` | local truth: the server is a relay + backup, not a gate | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `core_flows_designed_airplane_mode_first` | local truth: flows are designed airplane-mode-first | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `core_flows_work_fully_offline` | quality gate: core flows work fully offline | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sync_resumes_cleanly_after_long_offline` | quality gate: sync resumes cleanly after long offline periods | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mergeable_state_uses_crdt_or_ot` | data model: CRDTs (or OT) are used for mergeable state | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tombstones_declared` | data model: tombstones are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `compaction_policy_declared` | data model: a compaction policy is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `entities_declared` | the declared record names its entities — the entities list is present and non-empty | Computed over the declared record. Pass: the `entities` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_entity_per_field_merge_semantics_declared` | data model: every declared entity row declares per-field merge semantics | Computed over the declared rows. Pass: every declared entity row declares `per_field_merge_semantics_declared: true`. Fail: a row declares the field present but not `true` (offending rows are named in `entities_without_merge_semantics`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `entities_without_merge_semantics`). |
| `every_entity_stable_id_declared` | data model: every declared entity row declares a stable document/entity ID | Computed over the declared rows. Pass: every declared entity row declares `stable_id_declared: true`. Fail: a row declares the field present but not `true` (offending rows are named in `entities_without_stable_id`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `entities_without_stable_id`). |

#### Section: sync_protocol

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `delta_sync_declared` | sync protocol: delta sync (over WebSocket/WebRTC) is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `causal_ordering_declared` | sync protocol: causal ordering is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `resumability_declared` | sync protocol: resumability is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `bandwidth_budgets_declared` | sync protocol: bandwidth budgets are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `store_and_forward_for_intermittent_peers` | sync protocol: store-and-forward for intermittent peers is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vector_clocks_or_version_vectors_declared` | sync protocol: vector clocks / version vectors for causality are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: encryption_and_keys

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `e2ee_before_upload` | encryption: end-to-end encryption happens before upload | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `keys_never_leave_devices` | encryption: keys never leave devices | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `per_device_keys_declared` | encryption: per-device keys are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `key_hierarchy_declared` | encryption: a key hierarchy is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `key_recovery_ux_tested_like_a_feature` | encryption: recovery UX is tested like a feature | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `key_recovery_exercised_end_to_end` | quality gate: key recovery is exercised end-to-end | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `e2ee_verified` | quality gate: E2EE is verified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `personal_data_encrypted_when_personal_data_synced` | no personal data declared synced | Conditional on `personal_data_sync.personal_data_synced`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered (`personal_data_synced` declared `false`), in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no personal data declared synced"). Fail: the gate is declared `true` and `personal_data_encrypted_before_sync` is declared `false`. Missing: the gate field is absent, or the gate is declared `true` and the required field is absent. Note the recorded sparse run: with both gate fields absent this check reports `missing` even though its evidence text still reads "no personal data declared synced" — the status, not the evidence text, carries the outcome. |

#### Section: conflicts_and_state_ui

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `automatic_merge_for_text_and_counters` | conflicts: automatic merges (CRDT) cover text & counters | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `explicit_ui_only_for_semantic_conflicts` | conflicts: explicit UI is used only for semantic conflicts | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_silent_data_loss` | red line: no silent data loss, ever | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_silent_last_write_wins_on_user_prose` | red line: no silent last-write-wins on user prose is present in the declared design | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_prose_entity_uses_silent_last_write_wins` | red line: no declared entity row that is user prose declares silent last-write-wins | Computed over the declared rows, scoped to user prose. Pass: no row with `is_user_prose: true` declares `silent_last_write_wins_present: true` — or there are no prose rows, in which case the check passes as not applicable. Fail: a prose row declares `silent_last_write_wins_present: true` (offending rows are named in `prose_entities_with_silent_last_write_wins`). Missing: the list is absent, or a row has `is_user_prose` absent, or a prose row has `silent_last_write_wins_present` absent. |
| `offline_state_shown` | state UI: the offline state is shown honestly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `queued_state_shown` | state UI: the queued state is shown honestly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `syncing_state_shown` | state UI: the syncing state is shown honestly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `synced_state_shown` | state UI: the synced state is shown honestly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `conflict_state_shown` | state UI: the conflict state is shown honestly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `export_escape_hatch_present` | state UI: an export escape hatch is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `import_escape_hatch_present` | state UI: an import escape hatch is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sync_diagnostics_present` | state UI: sync diagnostics are present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sync_badge_only_with_multi_device_round_trip_tests` | no sync badge claimed | Conditional on `state_ui.sync_badge_claimed`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered (`sync_badge_claimed` declared `false`), in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no sync badge claimed"). Fail: the gate is declared `true` and `testing.multi_device_round_trip_tests_passed` is declared `false`. Missing: the gate field is absent, or the gate is declared `true` and the required field is absent. The round-trip fact is also checked on its own as `multi_device_round_trip_tests_passed`. Note the recorded sparse run: with the gate fields absent this check reports `missing` even though its evidence text still reads "no sync badge claimed" — the status, not the evidence text, carries the outcome. |

#### Section: testing_and_quality_gates

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `chaos_offline_scenario_tested` | testing: the offline chaos scenario is tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `chaos_clock_skew_scenario_tested` | testing: the clock-skew chaos scenario is tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `chaos_concurrent_edits_scenario_tested` | testing: the concurrent-edits chaos scenario is tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `chaos_device_loss_scenario_tested` | testing: the device-loss chaos scenario is tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `merge_invariants_property_tested` | quality gate: merge invariants are property-tested — commutative, associative, idempotent — and no user edit can be lost | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `export_import_tested_on_real_data_volumes` | quality gate: export/import is tested on real data volumes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `real_device_matrix_tested` | testing: a real device matrix is tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `multi_device_round_trip_tests_passed` | red line: real multi-device round-trip tests are passed — the evidence a "sync" claim stands on | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |


### Output format

HTTP 200 returns one JSON object:

- `service` (`"local-first-sync-design"`), `atom_version` (`"0.1.0"`), and `app` (the manifest's declared app value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `entities_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `entities_without_merge_semantics` (entities whose `per_field_merge_semantics_declared` field is present but not `true`; an entity with the field absent is missing evidence and does not appear), `entities_without_stable_id` (entities whose `stable_id_declared` field is present but not `true`) and `prose_entities_with_silent_last_write_wins` (user-prose entities declaring `silent_last_write_wins_present: true`) — all three lists are null when the `entities` list is not declared; and the ratios `merge_semantics_coverage` (entities declaring per-field merge semantics ÷ declared entities) and `stable_id_coverage` (entities declaring a stable ID ÷ declared entities) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "47 pass, 0 fail, 0 missing of 47 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared app value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `LOCAL_FIRST_SYNC_SOUND` — all 47 checks pass: the declared local-first sync design record is complete and consistent with the bound skill's checklist and red lines.
- `LOCAL_FIRST_SYNC_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (the four primary computed checks only — `entities_declared`, `every_entity_per_field_merge_semantics_declared`, `every_entity_stable_id_declared`, `no_prose_entity_uses_silent_last_write_wins`): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields** (all values below are as defined under Output format): `entities_count` (integer or null), `entities_without_merge_semantics` (list of entity names or null), `merge_semantics_coverage` (six-decimal string or null), `entities_without_stable_id` (list of entity names or null), `stable_id_coverage` (six-decimal string or null), `prose_entities_with_silent_last_write_wins` (list of entity names or null). The recorded battery exercises all three verdicts and both non-null `computed_status` values: full-pass returns `LOCAL_FIRST_SYNC_SOUND` with `computed_status` `within_stated_limits_on_declared_evidence`; violations returns `LOCAL_FIRST_SYNC_NOT_SOUND` with `computed_status` `outside_stated_limits_on_declared_evidence` and `prose_entities_with_silent_last_write_wins` `["notes"]`; the sparse case (see TEST-REPORT.md) returns `INSUFFICIENT_EVIDENCE` with every computed field null, including `computed_status`.

### Errors

A failed call is not metered. Only the 422 body below was recorded in the verification battery; the 401, 403 and 429 rows carry HTTP status and meaning only — **no body was recorded for them, and no payload shape is asserted for them here**.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no body in the verification battery; status and meaning only.* | Missing or invalid gateway API key (per USER-GUIDE.md). |
| 403 | *Unrecorded — no body in the verification battery; status and meaning only.* | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry (per USER-GUIDE.md). |
| 422 | `{"ok":false,"error":"invalid_input","field":"local_truth.device_store_authoritative","detail":"local_truth.device_store_authoritative must be a boolean"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a boolean"}` for a boolean field — other field types name their own expected type in `detail`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no body in the verification battery; status and meaning only.* | Per-key rate limit exceeded for this atom (60/minute, 10,000/day per key — see Rate limits and pricing); the call is not metered (per USER-GUIDE.md). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Build local-first apps — offline data, CRDT sync, conflict handling, E2EE multi-device, honest state UI (the bound capability, from the `local-first-engineering` skill). You submit one declared record — the local-first-sync manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`local_truth_and_data_model`, `sync_protocol`, `encryption_and_keys`, `conflicts_and_state_ui`, `testing_and_quality_gates`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `entities` list must be present and non-empty, every entity row must declare per-field merge semantics and a stable ID, and no entity row classified as user prose may declare silent last-write-wins — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies — personal-data encryption is required only when `personal_data_sync.personal_data_synced` is declared `true`, and multi-device round-trip tests are required for a sync badge only when `state_ui.sync_badge_claimed` is declared `true` (the round-trip fact is also checked on its own in `testing_and_quality_gates`); when a gate is not triggered those checks pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `LOCAL_FIRST_SYNC_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `LOCAL_FIRST_SYNC_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a bandwidth budget in bytes, bits per second or percent (the skill requires bandwidth budgets but states no figure — caller attestation only); a maximum offline duration or a resume-time limit for the "long offline periods" quality gate (no duration is stated); a compaction interval, a tombstone retention period, or a tombstone count/size cap (the skill requires a compaction policy but states no number); a key length, key-derivation parameter, or named cipher requirement (the skill requires E2EE and a key hierarchy but names no algorithm or parameter); a chaos-scenario count, property-test case count, or test-coverage percentage (the skill names the scenarios and the invariants — commutative, associative, idempotent — but no counts); a real-device matrix size or a named device/OS set (the skill requires real device matrices but states no size); a data volume for the export/import quality gate (the skill says "real data volumes" but states no figure); a sync-state latency or indicator-accuracy bar for honest state UI (the skill requires the indicators to tell the truth but states no timing); and a coverage percentage below completeness for the entity rows. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** local-first sync design record: a verdict of `LOCAL_FIRST_SYNC_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares device-held truth, CRDT merge semantics, and E2EE before upload passes those checks even if the real app does none of it. It is a completeness and consistency audit of the record the skill requires, **not a sync implementation, a data-loss guarantee, or a security certification**. Specifically: it designs no sync engine, runs no sync, merges no data, encrypts nothing, probes no live app, and does not verify that a declared control actually works. It never judges whether a CRDT choice actually preserves edits, whether the encryption actually achieves end-to-end properties, whether a conflict UI is usable, or whether the declared tests were really run — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; merge correctness (whether the chosen CRDT/OT and per-field semantics are the right ones for an entity, and whether merges are in fact lossless) is a caller declaration — the atom checks only that semantics are declared per entity; encryption soundness (algorithm choice, key derivation, protocol correctness) is a caller declaration — only its declared presence and scoping are checked; conflict-UX quality (whether a semantic-conflict UI is comprehensible, whether state indicators are noticed) is a caller declaration; whether "user prose" is the right classification for an entity row is the caller's declaration — the atom applies the red line to rows as classified; transport choice (WebSocket vs WebRTC vs another channel) is not judged — the skill names the channels as the delta-sync medium, and only the declared presence of delta sync, causality, resumability and budgets is checked. Boundary with staged siblings: `offline-first-pwa-engineering-pack` covers the web/PWA surface (service workers, installability, sync queues) — this atom checks no service-worker or installability fact; `zero-knowledge-system-design-pack` covers zero-knowledge system design in general — this atom checks encryption only as the local-first skill scopes it, as one section of a sync design, not as a zero-knowledge audit. Both siblings are scaffolded only, so this atom shares zero checks with any live or staged sibling.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Vault app offline sync design (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Discrepancies and recording precedence

This document follows the recorded response in `verification/work/local-first-sync-design/evidence.json` wherever the prose documents disagree with it. Every discrepancy found is named here; none is papered over.

- **D1 — Status (SERVICE.md is stale).** SERVICE.md's Status section reads "Tier B · status: **built-locally** — deterministic core, Python oracle and TypeScript port built and parity-proven locally; no endpoint is live." The recorded battery contradicts it: the atom was exercised live at https://atoms.pipavia.com on atoms-gateway v1.1.0 (deployment fe07be725c5a4817ad7b7e341310a97b), with determinism and REST/MCP parity proven — see TEST-REPORT.md. This document therefore carries the evidenced live state in its status header (live — release candidate, RC soak to 2026-11-22) and names SERVICE.md's built-locally line as stale. Related staleness, same direction: contract.yaml still records `status: scaffolded`.
- **D2 — Trimmed example responses (USER-GUIDE.md, TEST-REPORT.md).** The USER-GUIDE.md worked-example response and the TEST-REPORT.md full-pass excerpt both omit the `checks` array and the `stamp` field (both are labelled trimmed/excerpt). Every value they do show matches the recorded full-pass response exactly, and their request input is identical in JSON value to the recorded full-pass input — the disagreement is omission only, not values. This document reproduces the full recorded responses, `checks` and `stamp` included.
- **D3 — Check names differ from input field names (recorded names govern).** Eight recorded check names are not the input field names they read: `entities_declared` (reads `entities`); `every_entity_per_field_merge_semantics_declared` (reads `entities[].per_field_merge_semantics_declared`); `every_entity_stable_id_declared` (reads `entities[].stable_id_declared`); `personal_data_encrypted_when_personal_data_synced` (reads `personal_data_sync.personal_data_encrypted_before_sync`, gated by `personal_data_sync.personal_data_synced`); `no_silent_data_loss` (reads `conflicts.silent_data_loss_present`); `no_silent_last_write_wins_on_user_prose` (reads `conflicts.silent_last_write_wins_on_user_prose_present`); `no_prose_entity_uses_silent_last_write_wins` (reads `entities[].silent_last_write_wins_present` on rows gated by `entities[].is_user_prose`); `sync_badge_only_with_multi_device_round_trip_tests` (reads `testing.multi_device_round_trip_tests_passed`, gated by `state_ui.sync_badge_claimed`). The Checks section uses the recorded names verbatim.
- **D4 — Battery dates (reconciled, no substantive conflict).** TEST-REPORT.md and USER-GUIDE.md date the external testing 2026-11-15; the evidence file's recorded timestamp is 2026-11-16T06:29:46.142331+00:00. That instant is 2026-11-15 in America/Edmonton (23:29 MST), so the prose dates and the recording describe the same sitting; the provenance lines in this document quote the recorded UTC timestamp verbatim.

## Role views

*Regulators: N/A — this atom audits a declared local-first sync design record (offline data, CRDT sync, conflict handling, E2EE and state UI, as declared by the caller); its verdict is a completeness and consistency judgment on the declared evidence, not compliance or audit evidence — SERVICE.md states explicitly that it is not a sync implementation, a data-loss guarantee, or a security certification, and it verifies no declared fact against a live app. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `local_first_sync_design` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/local_first_sync_design.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_local_first_sync_design.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/local-first-sync-design` (REST) and `POST /mcp/local-first-sync-design` (MCP, tool `local_first_sync_design`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `local_first_sync_design`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered; no 429 body was recorded — see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume; only the 422 body shape is recorded. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T06:29:46.142331+00:00 against gateway v1.1.0, external verification lane, source `verification/work/local-first-sync-design/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "app": "Vault",
  "local_truth": {
    "device_store_authoritative": true,
    "server_is_relay_and_backup_not_gate": true,
    "core_flows_designed_airplane_mode_first": true,
    "core_flows_work_fully_offline": true,
    "sync_resumes_cleanly_after_long_offline": true
  },
  "data_model": {
    "mergeable_state_uses_crdt_or_ot": true,
    "tombstones_declared": true,
    "compaction_policy_declared": true
  },
  "entities": [
    {
      "name": "notes",
      "per_field_merge_semantics_declared": true,
      "stable_id_declared": true,
      "is_user_prose": true,
      "silent_last_write_wins_present": false
    }
  ],
  "sync_protocol": {
    "delta_sync_declared": true,
    "causal_ordering_declared": true,
    "resumability_declared": true,
    "bandwidth_budgets_declared": true,
    "store_and_forward_for_intermittent_peers": true,
    "vector_clocks_or_version_vectors_declared": true
  },
  "encryption": {
    "e2ee_before_upload": true,
    "keys_never_leave_devices": true,
    "per_device_keys_declared": true,
    "key_hierarchy_declared": true,
    "key_recovery_ux_tested_like_a_feature": true,
    "key_recovery_exercised_end_to_end": true,
    "e2ee_verified": true
  },
  "personal_data_sync": {
    "personal_data_synced": false,
    "personal_data_encrypted_before_sync": true
  },
  "conflicts": {
    "automatic_merge_for_text_and_counters": true,
    "explicit_ui_only_for_semantic_conflicts": true,
    "silent_data_loss_present": false,
    "silent_last_write_wins_on_user_prose_present": false
  },
  "state_ui": {
    "offline_state_shown": true,
    "queued_state_shown": true,
    "syncing_state_shown": true,
    "synced_state_shown": true,
    "conflict_state_shown": true,
    "export_escape_hatch_present": true,
    "import_escape_hatch_present": true,
    "sync_diagnostics_present": true,
    "sync_badge_claimed": false
  },
  "testing": {
    "chaos_offline_scenario_tested": true,
    "chaos_clock_skew_scenario_tested": true,
    "chaos_concurrent_edits_scenario_tested": true,
    "chaos_device_loss_scenario_tested": true,
    "merge_invariants_property_tested": true,
    "export_import_tested_on_real_data_volumes": true,
    "real_device_matrix_tested": true,
    "multi_device_round_trip_tests_passed": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "local-first-sync-design",
  "atom_version": "0.1.0",
  "app": "Vault",
  "verdict": "LOCAL_FIRST_SYNC_SOUND",
  "sections": {
    "local_truth_and_data_model": "pass",
    "sync_protocol": "pass",
    "encryption_and_keys": "pass",
    "conflicts_and_state_ui": "pass",
    "testing_and_quality_gates": "pass"
  },
  "checks": [
    {
      "section": "local_truth_and_data_model",
      "check": "device_store_authoritative",
      "status": "pass",
      "evidence": "local truth: the device store (IndexedDB/SQLite) is authoritative"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "server_is_relay_and_backup_not_gate",
      "status": "pass",
      "evidence": "local truth: the server is a relay + backup, not a gate"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "core_flows_designed_airplane_mode_first",
      "status": "pass",
      "evidence": "local truth: flows are designed airplane-mode-first"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "core_flows_work_fully_offline",
      "status": "pass",
      "evidence": "quality gate: core flows work fully offline"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "sync_resumes_cleanly_after_long_offline",
      "status": "pass",
      "evidence": "quality gate: sync resumes cleanly after long offline periods"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "mergeable_state_uses_crdt_or_ot",
      "status": "pass",
      "evidence": "data model: CRDTs (or OT) are used for mergeable state"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "tombstones_declared",
      "status": "pass",
      "evidence": "data model: tombstones are declared"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "compaction_policy_declared",
      "status": "pass",
      "evidence": "data model: a compaction policy is declared"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "entities_declared",
      "status": "pass",
      "evidence": "the declared record names its entities — the entities list is present and non-empty"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "every_entity_per_field_merge_semantics_declared",
      "status": "pass",
      "evidence": "data model: every declared entity row declares per-field merge semantics"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "every_entity_stable_id_declared",
      "status": "pass",
      "evidence": "data model: every declared entity row declares a stable document/entity ID"
    },
    {
      "section": "sync_protocol",
      "check": "delta_sync_declared",
      "status": "pass",
      "evidence": "sync protocol: delta sync (over WebSocket/WebRTC) is declared"
    },
    {
      "section": "sync_protocol",
      "check": "causal_ordering_declared",
      "status": "pass",
      "evidence": "sync protocol: causal ordering is declared"
    },
    {
      "section": "sync_protocol",
      "check": "resumability_declared",
      "status": "pass",
      "evidence": "sync protocol: resumability is declared"
    },
    {
      "section": "sync_protocol",
      "check": "bandwidth_budgets_declared",
      "status": "pass",
      "evidence": "sync protocol: bandwidth budgets are declared"
    },
    {
      "section": "sync_protocol",
      "check": "store_and_forward_for_intermittent_peers",
      "status": "pass",
      "evidence": "sync protocol: store-and-forward for intermittent peers is declared"
    },
    {
      "section": "sync_protocol",
      "check": "vector_clocks_or_version_vectors_declared",
      "status": "pass",
      "evidence": "sync protocol: vector clocks / version vectors for causality are declared"
    },
    {
      "section": "encryption_and_keys",
      "check": "e2ee_before_upload",
      "status": "pass",
      "evidence": "encryption: end-to-end encryption happens before upload"
    },
    {
      "section": "encryption_and_keys",
      "check": "keys_never_leave_devices",
      "status": "pass",
      "evidence": "encryption: keys never leave devices"
    },
    {
      "section": "encryption_and_keys",
      "check": "per_device_keys_declared",
      "status": "pass",
      "evidence": "encryption: per-device keys are declared"
    },
    {
      "section": "encryption_and_keys",
      "check": "key_hierarchy_declared",
      "status": "pass",
      "evidence": "encryption: a key hierarchy is declared"
    },
    {
      "section": "encryption_and_keys",
      "check": "key_recovery_ux_tested_like_a_feature",
      "status": "pass",
      "evidence": "encryption: recovery UX is tested like a feature"
    },
    {
      "section": "encryption_and_keys",
      "check": "key_recovery_exercised_end_to_end",
      "status": "pass",
      "evidence": "quality gate: key recovery is exercised end-to-end"
    },
    {
      "section": "encryption_and_keys",
      "check": "e2ee_verified",
      "status": "pass",
      "evidence": "quality gate: E2EE is verified"
    },
    {
      "section": "encryption_and_keys",
      "check": "personal_data_encrypted_when_personal_data_synced",
      "status": "pass",
      "evidence": "no personal data declared synced"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "automatic_merge_for_text_and_counters",
      "status": "pass",
      "evidence": "conflicts: automatic merges (CRDT) cover text & counters"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "explicit_ui_only_for_semantic_conflicts",
      "status": "pass",
      "evidence": "conflicts: explicit UI is used only for semantic conflicts"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "no_silent_data_loss",
      "status": "pass",
      "evidence": "red line: no silent data loss, ever"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "no_silent_last_write_wins_on_user_prose",
      "status": "pass",
      "evidence": "red line: no silent last-write-wins on user prose is present in the declared design"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "no_prose_entity_uses_silent_last_write_wins",
      "status": "pass",
      "evidence": "red line: no declared entity row that is user prose declares silent last-write-wins"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "offline_state_shown",
      "status": "pass",
      "evidence": "state UI: the offline state is shown honestly"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "queued_state_shown",
      "status": "pass",
      "evidence": "state UI: the queued state is shown honestly"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "syncing_state_shown",
      "status": "pass",
      "evidence": "state UI: the syncing state is shown honestly"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "synced_state_shown",
      "status": "pass",
      "evidence": "state UI: the synced state is shown honestly"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "conflict_state_shown",
      "status": "pass",
      "evidence": "state UI: the conflict state is shown honestly"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "export_escape_hatch_present",
      "status": "pass",
      "evidence": "state UI: an export escape hatch is present"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "import_escape_hatch_present",
      "status": "pass",
      "evidence": "state UI: an import escape hatch is present"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "sync_diagnostics_present",
      "status": "pass",
      "evidence": "state UI: sync diagnostics are present"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "sync_badge_only_with_multi_device_round_trip_tests",
      "status": "pass",
      "evidence": "no sync badge claimed"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "chaos_offline_scenario_tested",
      "status": "pass",
      "evidence": "testing: the offline chaos scenario is tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "chaos_clock_skew_scenario_tested",
      "status": "pass",
      "evidence": "testing: the clock-skew chaos scenario is tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "chaos_concurrent_edits_scenario_tested",
      "status": "pass",
      "evidence": "testing: the concurrent-edits chaos scenario is tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "chaos_device_loss_scenario_tested",
      "status": "pass",
      "evidence": "testing: the device-loss chaos scenario is tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "merge_invariants_property_tested",
      "status": "pass",
      "evidence": "quality gate: merge invariants are property-tested — commutative, associative, idempotent — and no user edit can be lost"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "export_import_tested_on_real_data_volumes",
      "status": "pass",
      "evidence": "quality gate: export/import is tested on real data volumes"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "real_device_matrix_tested",
      "status": "pass",
      "evidence": "testing: a real device matrix is tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "multi_device_round_trip_tests_passed",
      "status": "pass",
      "evidence": "red line: real multi-device round-trip tests are passed — the evidence a \"sync\" claim stands on"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "entities_count": 1,
  "entities_without_merge_semantics": [],
  "merge_semantics_coverage": "1.000000",
  "entities_without_stable_id": [],
  "stable_id_coverage": "1.000000",
  "prose_entities_with_silent_last_write_wins": [],
  "summary": "47 pass, 0 fail, 0 missing of 47 checks across five sections.",
  "stamp": "LOCAL FIRST SYNC DESIGN\napp: Vault\nVERDICT: LOCAL_FIRST_SYNC_SOUND\n  local_truth_and_data_model           pass\n  sync_protocol                        pass\n  encryption_and_keys                  pass\n  conflicts_and_state_ui               pass\n  testing_and_quality_gates            pass\n47 pass, 0 fail, 0 missing of 47 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "app": "Vault",
  "local_truth": {
    "device_store_authoritative": true,
    "server_is_relay_and_backup_not_gate": true,
    "core_flows_designed_airplane_mode_first": true,
    "core_flows_work_fully_offline": true,
    "sync_resumes_cleanly_after_long_offline": true
  },
  "data_model": {
    "mergeable_state_uses_crdt_or_ot": true,
    "tombstones_declared": true,
    "compaction_policy_declared": true
  },
  "entities": [
    {
      "name": "notes",
      "per_field_merge_semantics_declared": true,
      "stable_id_declared": true,
      "is_user_prose": true,
      "silent_last_write_wins_present": true
    }
  ],
  "sync_protocol": {
    "delta_sync_declared": true,
    "causal_ordering_declared": true,
    "resumability_declared": true,
    "bandwidth_budgets_declared": true,
    "store_and_forward_for_intermittent_peers": true,
    "vector_clocks_or_version_vectors_declared": true
  },
  "encryption": {
    "e2ee_before_upload": true,
    "keys_never_leave_devices": true,
    "per_device_keys_declared": true,
    "key_hierarchy_declared": true,
    "key_recovery_ux_tested_like_a_feature": true,
    "key_recovery_exercised_end_to_end": true,
    "e2ee_verified": true
  },
  "personal_data_sync": {
    "personal_data_synced": false,
    "personal_data_encrypted_before_sync": true
  },
  "conflicts": {
    "automatic_merge_for_text_and_counters": true,
    "explicit_ui_only_for_semantic_conflicts": true,
    "silent_data_loss_present": false,
    "silent_last_write_wins_on_user_prose_present": true
  },
  "state_ui": {
    "offline_state_shown": true,
    "queued_state_shown": true,
    "syncing_state_shown": true,
    "synced_state_shown": true,
    "conflict_state_shown": true,
    "export_escape_hatch_present": true,
    "import_escape_hatch_present": true,
    "sync_diagnostics_present": true,
    "sync_badge_claimed": false
  },
  "testing": {
    "chaos_offline_scenario_tested": true,
    "chaos_clock_skew_scenario_tested": true,
    "chaos_concurrent_edits_scenario_tested": true,
    "chaos_device_loss_scenario_tested": true,
    "merge_invariants_property_tested": true,
    "export_import_tested_on_real_data_volumes": true,
    "real_device_matrix_tested": true,
    "multi_device_round_trip_tests_passed": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "local-first-sync-design",
  "atom_version": "0.1.0",
  "app": "Vault",
  "verdict": "LOCAL_FIRST_SYNC_NOT_SOUND",
  "sections": {
    "local_truth_and_data_model": "pass",
    "sync_protocol": "pass",
    "encryption_and_keys": "pass",
    "conflicts_and_state_ui": "fail",
    "testing_and_quality_gates": "pass"
  },
  "checks": [
    {
      "section": "local_truth_and_data_model",
      "check": "device_store_authoritative",
      "status": "pass",
      "evidence": "local truth: the device store (IndexedDB/SQLite) is authoritative"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "server_is_relay_and_backup_not_gate",
      "status": "pass",
      "evidence": "local truth: the server is a relay + backup, not a gate"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "core_flows_designed_airplane_mode_first",
      "status": "pass",
      "evidence": "local truth: flows are designed airplane-mode-first"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "core_flows_work_fully_offline",
      "status": "pass",
      "evidence": "quality gate: core flows work fully offline"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "sync_resumes_cleanly_after_long_offline",
      "status": "pass",
      "evidence": "quality gate: sync resumes cleanly after long offline periods"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "mergeable_state_uses_crdt_or_ot",
      "status": "pass",
      "evidence": "data model: CRDTs (or OT) are used for mergeable state"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "tombstones_declared",
      "status": "pass",
      "evidence": "data model: tombstones are declared"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "compaction_policy_declared",
      "status": "pass",
      "evidence": "data model: a compaction policy is declared"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "entities_declared",
      "status": "pass",
      "evidence": "the declared record names its entities — the entities list is present and non-empty"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "every_entity_per_field_merge_semantics_declared",
      "status": "pass",
      "evidence": "data model: every declared entity row declares per-field merge semantics"
    },
    {
      "section": "local_truth_and_data_model",
      "check": "every_entity_stable_id_declared",
      "status": "pass",
      "evidence": "data model: every declared entity row declares a stable document/entity ID"
    },
    {
      "section": "sync_protocol",
      "check": "delta_sync_declared",
      "status": "pass",
      "evidence": "sync protocol: delta sync (over WebSocket/WebRTC) is declared"
    },
    {
      "section": "sync_protocol",
      "check": "causal_ordering_declared",
      "status": "pass",
      "evidence": "sync protocol: causal ordering is declared"
    },
    {
      "section": "sync_protocol",
      "check": "resumability_declared",
      "status": "pass",
      "evidence": "sync protocol: resumability is declared"
    },
    {
      "section": "sync_protocol",
      "check": "bandwidth_budgets_declared",
      "status": "pass",
      "evidence": "sync protocol: bandwidth budgets are declared"
    },
    {
      "section": "sync_protocol",
      "check": "store_and_forward_for_intermittent_peers",
      "status": "pass",
      "evidence": "sync protocol: store-and-forward for intermittent peers is declared"
    },
    {
      "section": "sync_protocol",
      "check": "vector_clocks_or_version_vectors_declared",
      "status": "pass",
      "evidence": "sync protocol: vector clocks / version vectors for causality are declared"
    },
    {
      "section": "encryption_and_keys",
      "check": "e2ee_before_upload",
      "status": "pass",
      "evidence": "encryption: end-to-end encryption happens before upload"
    },
    {
      "section": "encryption_and_keys",
      "check": "keys_never_leave_devices",
      "status": "pass",
      "evidence": "encryption: keys never leave devices"
    },
    {
      "section": "encryption_and_keys",
      "check": "per_device_keys_declared",
      "status": "pass",
      "evidence": "encryption: per-device keys are declared"
    },
    {
      "section": "encryption_and_keys",
      "check": "key_hierarchy_declared",
      "status": "pass",
      "evidence": "encryption: a key hierarchy is declared"
    },
    {
      "section": "encryption_and_keys",
      "check": "key_recovery_ux_tested_like_a_feature",
      "status": "pass",
      "evidence": "encryption: recovery UX is tested like a feature"
    },
    {
      "section": "encryption_and_keys",
      "check": "key_recovery_exercised_end_to_end",
      "status": "pass",
      "evidence": "quality gate: key recovery is exercised end-to-end"
    },
    {
      "section": "encryption_and_keys",
      "check": "e2ee_verified",
      "status": "pass",
      "evidence": "quality gate: E2EE is verified"
    },
    {
      "section": "encryption_and_keys",
      "check": "personal_data_encrypted_when_personal_data_synced",
      "status": "pass",
      "evidence": "no personal data declared synced"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "automatic_merge_for_text_and_counters",
      "status": "pass",
      "evidence": "conflicts: automatic merges (CRDT) cover text & counters"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "explicit_ui_only_for_semantic_conflicts",
      "status": "pass",
      "evidence": "conflicts: explicit UI is used only for semantic conflicts"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "no_silent_data_loss",
      "status": "pass",
      "evidence": "red line: no silent data loss, ever"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "no_silent_last_write_wins_on_user_prose",
      "status": "fail",
      "evidence": "red line: no silent last-write-wins on user prose is present in the declared design"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "no_prose_entity_uses_silent_last_write_wins",
      "status": "fail",
      "evidence": "red line: no declared entity row that is user prose declares silent last-write-wins"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "offline_state_shown",
      "status": "pass",
      "evidence": "state UI: the offline state is shown honestly"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "queued_state_shown",
      "status": "pass",
      "evidence": "state UI: the queued state is shown honestly"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "syncing_state_shown",
      "status": "pass",
      "evidence": "state UI: the syncing state is shown honestly"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "synced_state_shown",
      "status": "pass",
      "evidence": "state UI: the synced state is shown honestly"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "conflict_state_shown",
      "status": "pass",
      "evidence": "state UI: the conflict state is shown honestly"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "export_escape_hatch_present",
      "status": "pass",
      "evidence": "state UI: an export escape hatch is present"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "import_escape_hatch_present",
      "status": "pass",
      "evidence": "state UI: an import escape hatch is present"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "sync_diagnostics_present",
      "status": "pass",
      "evidence": "state UI: sync diagnostics are present"
    },
    {
      "section": "conflicts_and_state_ui",
      "check": "sync_badge_only_with_multi_device_round_trip_tests",
      "status": "pass",
      "evidence": "no sync badge claimed"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "chaos_offline_scenario_tested",
      "status": "pass",
      "evidence": "testing: the offline chaos scenario is tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "chaos_clock_skew_scenario_tested",
      "status": "pass",
      "evidence": "testing: the clock-skew chaos scenario is tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "chaos_concurrent_edits_scenario_tested",
      "status": "pass",
      "evidence": "testing: the concurrent-edits chaos scenario is tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "chaos_device_loss_scenario_tested",
      "status": "pass",
      "evidence": "testing: the device-loss chaos scenario is tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "merge_invariants_property_tested",
      "status": "pass",
      "evidence": "quality gate: merge invariants are property-tested — commutative, associative, idempotent — and no user edit can be lost"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "export_import_tested_on_real_data_volumes",
      "status": "pass",
      "evidence": "quality gate: export/import is tested on real data volumes"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "real_device_matrix_tested",
      "status": "pass",
      "evidence": "testing: a real device matrix is tested"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "multi_device_round_trip_tests_passed",
      "status": "pass",
      "evidence": "red line: real multi-device round-trip tests are passed — the evidence a \"sync\" claim stands on"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "entities_count": 1,
  "entities_without_merge_semantics": [],
  "merge_semantics_coverage": "1.000000",
  "entities_without_stable_id": [],
  "stable_id_coverage": "1.000000",
  "prose_entities_with_silent_last_write_wins": [
    "notes"
  ],
  "summary": "45 pass, 2 fail, 0 missing of 47 checks across five sections.",
  "stamp": "LOCAL FIRST SYNC DESIGN\napp: Vault\nVERDICT: LOCAL_FIRST_SYNC_NOT_SOUND\n  local_truth_and_data_model           pass\n  sync_protocol                        pass\n  encryption_and_keys                  pass\n  conflicts_and_state_ui               fail\n  testing_and_quality_gates            pass\n45 pass, 2 fail, 0 missing of 47 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "app": "MalformedApp",
  "local_truth": {
    "device_store_authoritative": "NOT_A_BOOLEAN"
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "local_truth.device_store_authoritative",
  "detail": "local_truth.device_store_authoritative must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared local-first sync design record; its verdict is a completeness and consistency judgment on the declared evidence, not compliance or audit evidence, and SERVICE.md states it is not a security certification. |
| Checks named | 47 documented / 47 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`), plus all secondary computed fields |
| Input reference typed | Yes — 60 fields, each with its type from SERVICE.md (container objects typed `object` from the recorded evidence inputs, as noted in the Input reference) |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/local-first-sync-design/evidence.json` |
