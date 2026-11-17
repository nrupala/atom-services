# Local-first sync design — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are building a local-first app — the device holds the truth, it works offline, and it syncs and merges without loss — and you have a record of how that sync was designed. This atom reads one declared manifest and returns one deterministic verdict across five sections: **LOCAL_FIRST_SYNC_SOUND**, **LOCAL_FIRST_SYNC_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it designs no sync engine, runs no sync, merges no data, encrypts nothing, probes no live app, and does not verify that a declared control actually works. A design is sound *on your declared evidence*: it never judges whether a CRDT choice actually preserves edits, whether the encryption actually achieves end-to-end properties, whether a conflict UI is usable, or whether the declared tests were really run. Computed checks: the declared `entities` list must be present and non-empty; every entity row must declare per-field merge semantics and a stable ID; and no entity row declared as user prose may declare silent last-write-wins. Two checks are conditional: personal-data encryption is required only when `personal_data_sync.personal_data_synced` is declared `true`, otherwise it passes as not applicable; and multi-device round-trip tests are required for a sync badge only when `state_ui.sync_badge_claimed` is declared `true`, otherwise that check passes as not applicable (the round-trip fact is also checked on its own). No numeric threshold is imposed — no bandwidth budget in bytes, bits per second or percent, no maximum offline duration or resume-time limit, no compaction interval, tombstone retention period or tombstone count/size cap, no key length, key-derivation parameter or named cipher, no chaos-scenario count, property-test case count or test-coverage percentage, no real-device matrix size or named device/OS set, no data volume for the export/import gate, no sync-state latency or indicator-accuracy bar, and no coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "local-first-sync-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/local-first-sync-design` — tool name `local_first_sync_design`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/local-first-sync-design` — body = the manifest object; same `Authorization` header.

## Input — the local-first-sync manifest

| Field | Meaning |
|---|---|
| `app` | app name (string; carried into the output, not checked) |
| `local_truth.device_store_authoritative` | local-truth evidence: the device store is authoritative |
| `local_truth.server_is_relay_and_backup_not_gate` | local-truth evidence: the server is a relay and backup, not a gate |
| `local_truth.core_flows_designed_airplane_mode_first` | local-truth evidence: core flows are designed airplane-mode-first |
| `local_truth.core_flows_work_fully_offline` | local-truth evidence: core flows work fully offline |
| `local_truth.sync_resumes_cleanly_after_long_offline` | local-truth evidence: sync resumes cleanly after long offline periods |
| `data_model.mergeable_state_uses_crdt_or_ot` | data-model evidence: mergeable state uses CRDT or OT |
| `data_model.tombstones_declared` | data-model evidence: tombstones are declared |
| `data_model.compaction_policy_declared` | data-model evidence: a compaction policy is declared |
| `entities` (list of entity-row objects) | computed: must be present and non-empty; reported as `entities_count` |
| `entities[].name` (string) | names the row in the computed outputs |
| `entities[].per_field_merge_semantics_declared` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `entities_without_merge_semantics` |
| `entities[].stable_id_declared` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `entities_without_stable_id` |
| `entities[].is_user_prose` | computed gate: declares the row is user prose |
| `entities[].silent_last_write_wins_present` | computed: must be `false` per user-prose row to pass; prose rows declaring `true` are reported in `prose_entities_with_silent_last_write_wins` |
| `sync_protocol.delta_sync_declared` | sync-protocol evidence: delta sync is declared |
| `sync_protocol.causal_ordering_declared` | sync-protocol evidence: causal ordering is declared |
| `sync_protocol.resumability_declared` | sync-protocol evidence: resumability is declared |
| `sync_protocol.bandwidth_budgets_declared` | sync-protocol evidence: bandwidth budgets are declared |
| `sync_protocol.store_and_forward_for_intermittent_peers` | sync-protocol evidence: store-and-forward for intermittent peers is declared |
| `sync_protocol.vector_clocks_or_version_vectors_declared` | sync-protocol evidence: vector clocks / version vectors are declared |
| `encryption.e2ee_before_upload` | encryption evidence: end-to-end encryption happens before upload |
| `encryption.keys_never_leave_devices` | encryption evidence: keys never leave devices |
| `encryption.per_device_keys_declared` | encryption evidence: per-device keys are declared |
| `encryption.key_hierarchy_declared` | encryption evidence: a key hierarchy is declared |
| `encryption.key_recovery_ux_tested_like_a_feature` | encryption evidence: key recovery UX is tested like a feature |
| `encryption.key_recovery_exercised_end_to_end` | encryption evidence: key recovery is exercised end to end |
| `encryption.e2ee_verified` | encryption evidence: E2EE is verified |
| `personal_data_sync.personal_data_synced` | gate: declares whether personal data is synced |
| `personal_data_sync.personal_data_encrypted_before_sync` | required `true` only when `personal_data_sync.personal_data_synced` is `true`; otherwise passes as not applicable |
| `conflicts.automatic_merge_for_text_and_counters` | conflicts evidence: automatic merge covers text and counters |
| `conflicts.explicit_ui_only_for_semantic_conflicts` | conflicts evidence: explicit UI is used only for semantic conflicts |
| `conflicts.silent_data_loss_present` | must be `false` to pass (red line: no silent data loss) |
| `conflicts.silent_last_write_wins_on_user_prose_present` | must be `false` to pass (red line: no silent last-write-wins on user prose) |
| `state_ui.offline_state_shown` | state-UI evidence: the offline state is shown |
| `state_ui.queued_state_shown` | state-UI evidence: the queued state is shown |
| `state_ui.syncing_state_shown` | state-UI evidence: the syncing state is shown |
| `state_ui.synced_state_shown` | state-UI evidence: the synced state is shown |
| `state_ui.conflict_state_shown` | state-UI evidence: the conflict state is shown |
| `state_ui.export_escape_hatch_present` | state-UI evidence: an export escape hatch is present |
| `state_ui.import_escape_hatch_present` | state-UI evidence: an import escape hatch is present |
| `state_ui.sync_diagnostics_present` | state-UI evidence: sync diagnostics are present |
| `state_ui.sync_badge_claimed` | gate: declares whether a sync badge is claimed |
| `testing.chaos_offline_scenario_tested` | testing evidence: the offline chaos scenario is tested |
| `testing.chaos_clock_skew_scenario_tested` | testing evidence: the clock-skew chaos scenario is tested |
| `testing.chaos_concurrent_edits_scenario_tested` | testing evidence: the concurrent-edits chaos scenario is tested |
| `testing.chaos_device_loss_scenario_tested` | testing evidence: the device-loss chaos scenario is tested |
| `testing.merge_invariants_property_tested` | testing evidence: merge invariants are property-tested |
| `testing.export_import_tested_on_real_data_volumes` | testing evidence: export/import is tested on real data volumes |
| `testing.real_device_matrix_tested` | testing evidence: a real device matrix is tested |
| `testing.multi_device_round_trip_tests_passed` | testing evidence: multi-device round-trip tests passed; also required `true` only when `state_ui.sync_badge_claimed` is `true` for the badge check |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward LOCAL_FIRST_SYNC_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/local-first-sync-design`:

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

Response — HTTP 200 (trimmed; the full response carries all 47 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "entities_count": 1,
  "entities_without_merge_semantics": [],
  "merge_semantics_coverage": "1.000000",
  "entities_without_stable_id": [],
  "stable_id_coverage": "1.000000",
  "prose_entities_with_silent_last_write_wins": [],
  "summary": "47 pass, 0 fail, 0 missing of 47 checks across five sections."
}
```

## Verdicts

- **LOCAL_FIRST_SYNC_SOUND** — every check passes; the declared local-first sync design record is complete and consistent with the skill's checklist and lines.
- **LOCAL_FIRST_SYNC_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `entities_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `entities_without_merge_semantics`, `entities_without_stable_id` and `prose_entities_with_silent_last_write_wins` (null when the `entities` list is not declared; an entity with the relevant field absent is missing evidence and does not appear in the first two lists), the coverage values `merge_semantics_coverage` and `stable_id_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the four primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
