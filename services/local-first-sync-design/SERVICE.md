# Local first sync design — `local-first-sync-design`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build local-first apps - offline data, CRDT sync, conflict handling, E2EE multi-device, honest state UI.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Vault app offline sync design**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the local-first-sync manifest

The caller submits one JSON manifest: a declared local-first
sync design record for one app. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`LOCAL_FIRST_SYNC_NOT_SOUND`). All fields are
booleans unless noted. A documented field present with the wrong
JSON type is a caller error (the gateway renders 422) — it is
never evaluated into a verdict.

| Field | Read by |
|---|---|
| `app` (string; carried into the verdict output, not itself checked) | — |
| `local_truth.device_store_authoritative` (boolean) | local_truth_and_data_model |
| `local_truth.server_is_relay_and_backup_not_gate` (boolean) | local_truth_and_data_model |
| `local_truth.core_flows_designed_airplane_mode_first` (boolean) | local_truth_and_data_model |
| `local_truth.core_flows_work_fully_offline` (boolean) | local_truth_and_data_model |
| `local_truth.sync_resumes_cleanly_after_long_offline` (boolean) | local_truth_and_data_model |
| `data_model.mergeable_state_uses_crdt_or_ot` (boolean) | local_truth_and_data_model |
| `data_model.tombstones_declared` (boolean) | local_truth_and_data_model |
| `data_model.compaction_policy_declared` (boolean) | local_truth_and_data_model |
| `entities` (list of entity-row objects, each with the entry fields below; computed, see below) | local_truth_and_data_model, conflicts_and_state_ui |
| `entities[].name` (string; names the row in the computed outputs) | local_truth_and_data_model, conflicts_and_state_ui |
| `entities[].per_field_merge_semantics_declared` (boolean) | local_truth_and_data_model |
| `entities[].stable_id_declared` (boolean) | local_truth_and_data_model |
| `entities[].is_user_prose` (boolean; gates the per-entity last-write-wins check below) | conflicts_and_state_ui |
| `entities[].silent_last_write_wins_present` (boolean; must be `false` per user-prose row to pass the computed red-line check) | conflicts_and_state_ui |
| `sync_protocol.delta_sync_declared` (boolean) | sync_protocol |
| `sync_protocol.causal_ordering_declared` (boolean) | sync_protocol |
| `sync_protocol.resumability_declared` (boolean) | sync_protocol |
| `sync_protocol.bandwidth_budgets_declared` (boolean) | sync_protocol |
| `sync_protocol.store_and_forward_for_intermittent_peers` (boolean) | sync_protocol |
| `sync_protocol.vector_clocks_or_version_vectors_declared` (boolean) | sync_protocol |
| `encryption.e2ee_before_upload` (boolean) | encryption_and_keys |
| `encryption.keys_never_leave_devices` (boolean) | encryption_and_keys |
| `encryption.per_device_keys_declared` (boolean) | encryption_and_keys |
| `encryption.key_hierarchy_declared` (boolean) | encryption_and_keys |
| `encryption.key_recovery_ux_tested_like_a_feature` (boolean) | encryption_and_keys |
| `encryption.key_recovery_exercised_end_to_end` (boolean) | encryption_and_keys |
| `encryption.e2ee_verified` (boolean) | encryption_and_keys |
| `personal_data_sync.personal_data_synced` (boolean; gates the encryption red-line check below) | encryption_and_keys |
| `personal_data_sync.personal_data_encrypted_before_sync` (boolean; required when personal data is declared synced; otherwise the check passes as not applicable) | encryption_and_keys |
| `conflicts.automatic_merge_for_text_and_counters` (boolean) | conflicts_and_state_ui |
| `conflicts.explicit_ui_only_for_semantic_conflicts` (boolean) | conflicts_and_state_ui |
| `conflicts.silent_data_loss_present` (boolean; must be `false` to pass — skill red line) | conflicts_and_state_ui |
| `conflicts.silent_last_write_wins_on_user_prose_present` (boolean; must be `false` to pass — skill red line) | conflicts_and_state_ui |
| `state_ui.offline_state_shown` (boolean) | conflicts_and_state_ui |
| `state_ui.queued_state_shown` (boolean) | conflicts_and_state_ui |
| `state_ui.syncing_state_shown` (boolean) | conflicts_and_state_ui |
| `state_ui.synced_state_shown` (boolean) | conflicts_and_state_ui |
| `state_ui.conflict_state_shown` (boolean) | conflicts_and_state_ui |
| `state_ui.export_escape_hatch_present` (boolean) | conflicts_and_state_ui |
| `state_ui.import_escape_hatch_present` (boolean) | conflicts_and_state_ui |
| `state_ui.sync_diagnostics_present` (boolean) | conflicts_and_state_ui |
| `state_ui.sync_badge_claimed` (boolean; gates the round-trip red-line check below) | conflicts_and_state_ui |
| `testing.chaos_offline_scenario_tested` (boolean) | testing_and_quality_gates |
| `testing.chaos_clock_skew_scenario_tested` (boolean) | testing_and_quality_gates |
| `testing.chaos_concurrent_edits_scenario_tested` (boolean) | testing_and_quality_gates |
| `testing.chaos_device_loss_scenario_tested` (boolean) | testing_and_quality_gates |
| `testing.merge_invariants_property_tested` (boolean) | testing_and_quality_gates |
| `testing.export_import_tested_on_real_data_volumes` (boolean) | testing_and_quality_gates |
| `testing.real_device_matrix_tested` (boolean) | testing_and_quality_gates |
| `testing.multi_device_round_trip_tests_passed` (boolean; required when a sync badge is claimed; also checked on its own) | testing_and_quality_gates, conflicts_and_state_ui |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Entities declared:** the declared `entities` list passes
  only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **Merge semantics per entity:** every declared entity row must
  declare `per_field_merge_semantics_declared: true` (the skill's
  data model: "per-field merge semantics"). A row with the field
  absent is missing evidence.
- **Stable ID per entity:** every declared entity row must
  declare `stable_id_declared: true` (the skill's data model:
  "stable document/entity IDs").
- **No silent last-write-wins on prose entities:** no entity row
  with `is_user_prose: true` may declare
  `silent_last_write_wins_present: true` (the skill's red line:
  "never silent last-write-wins on user prose"). A row with
  `is_user_prose` absent, or a prose row with the target field
  absent, is missing evidence; designs with no prose rows pass
  as not applicable. Last-write-wins on a non-prose row is not
  judged by this check — the skill's red line is scoped to user
  prose.

Two checks are conditional, following the skill's own scoping —
computed from the declared gate fields:

- **Personal data encryption:** the skill's red line is "No sync
  of personal data without encryption (per product class)".
  `personal_data_encrypted_before_sync` is therefore required
  only when `personal_data_sync.personal_data_synced` is declared
  `true`; when no personal data is declared synced, the check
  passes as not applicable.
- **Sync badge:** the skill's red line is 'No "sync" badge
  without real multi-device round-trip tests'.
  `testing.multi_device_round_trip_tests_passed` is therefore
  required only when `state_ui.sync_badge_claimed` is declared
  `true`; when no badge is claimed, the check passes as not
  applicable. (The round-trip fact is also checked on its own in
  testing_and_quality_gates.)

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the four primary computed checks above cannot be completed),
`entities_count` (the declared list length, or null when the
list is not declared — counts are reported as integers, exactly),
the row-name lists `entities_without_merge_semantics` (entities
whose field is present but not true; an entity with the field
absent is missing evidence and does not appear),
`entities_without_stable_id` (entities whose field is present
but not true) and `prose_entities_with_silent_last_write_wins`
(user-prose entities declaring `silent_last_write_wins_present:
true`), and the two coverage ratios `merge_semantics_coverage`
(entities declaring per-field merge semantics ÷ declared
entities) and `stable_id_coverage` (entities declaring a stable
ID ÷ declared entities).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric pass/fail threshold — its protocol
and testing vocabulary is design content the record attests to,
not bars the atom can set. Quantities are computed and reported;
the only bar on the computed rows is completeness over the
caller's own declared rows, exactly as stated above. Declined
thresholds, named: a bandwidth budget in bytes, bits per second
or percent (the skill requires bandwidth budgets but states no
figure — caller attestation only); a maximum offline duration
or a resume-time limit for the "long offline periods" quality
gate (no duration is stated); a compaction interval, a tombstone
retention period, or a tombstone count/size cap (the skill
requires a compaction policy but states no number); a key length,
key-derivation parameter, or named cipher requirement (the skill
requires E2EE and a key hierarchy but names no algorithm or
parameter); a chaos-scenario count, property-test case count, or
test-coverage percentage (the skill names the scenarios and the
invariants — commutative, associative, idempotent — but no
counts); a real-device matrix size or a named device/OS set (the
skill requires real device matrices but states no size); a data
volume for the export/import quality gate (the skill says "real
data volumes" but states no figure); a sync-state latency or
indicator-accuracy bar for honest state UI (the skill requires
the indicators to tell the truth but states no timing); a
coverage percentage below completeness for the entity rows.

The verdict is one of `LOCAL_FIRST_SYNC_SOUND` (all 47 checks
pass), `LOCAL_FIRST_SYNC_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across five sections: local_truth_and_data_model, sync_protocol,
encryption_and_keys, conflicts_and_state_ui,
testing_and_quality_gates.

## Distinct ground

Two staged sibling atoms sit near this ground, and the boundary
is explicit. `offline-first-pwa-engineering-pack` (bound skill
`pwa-offline-engineering`) covers the web/PWA surface — service
workers, installability, sync queues for web apps; this atom
does not check any service-worker or installability fact.
`zero-knowledge-system-design-pack` (bound skill
`zero-knowledge-systems`) covers zero-knowledge system design in
general; this atom checks encryption only as the local-first
skill scopes it — E2EE before upload, keys never leaving
devices, per-device keys, recovery exercised — as one section of
a sync design, not as a zero-knowledge audit. Both siblings are
scaffolded only (no checks implemented), so this atom shares
**zero checks** with any live or staged sibling; every check
here is drawn from `local-first-engineering` alone — device-held
truth, the CRDT/OT data model, the sync protocol, conflict
handling, honest sync-state UI, and local-first testing.

## Honest scoping

This atom audits a **declared** local-first sync design record —
it designs no sync engine, runs no sync, merges no data, encrypts
nothing, probes no live app, and does not verify that a declared
control actually works. A design is sound *on the caller's
declared evidence*: a manifest that declares device-held truth,
CRDT merge semantics, and E2EE before upload passes those checks
even if the real app does none of it. It is a completeness and
consistency audit of the record the skill requires, **not a sync
implementation, a data-loss guarantee, or a security
certification**: it never judges whether a CRDT choice actually
preserves edits, whether the encryption actually achieves
end-to-end properties, whether a conflict UI is usable, or
whether the declared tests were really run — only that the
record contains what the skill's method, quality gates and red
lines demand, and that its declared rows are internally
consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds beyond
the skill's own stated rules (see the declined list above); no
live verification of any declared fact; merge correctness
(whether the chosen CRDT/OT and per-field semantics are the
right ones for an entity, and whether merges are in fact
lossless) is a caller declaration — the atom checks only that
semantics are declared per entity; encryption soundness
(algorithm choice, key derivation, protocol correctness) is a
caller declaration — only its declared presence and scoping are
checked; conflict-UX quality (whether a semantic-conflict UI is
comprehensible, whether state indicators are noticed) is a
caller declaration; whether "user prose" is the right
classification for an entity row is the caller's declaration —
the atom applies the red line to rows as classified; transport
choice (WebSocket vs WebRTC vs another channel) is not judged —
the skill names the channels as the delta-sync medium, and only
the declared presence of delta sync, causality, resumability and
budgets is checked.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Generic engineering advice
