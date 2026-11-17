# Offline first pwa engineering pack — `offline-first-pwa-engineering-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build offline-first web apps — service workers, local storage, sync queues, installability, honest state UI.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Dogear and vault app builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the offline-first PWA engineering manifest

The caller submits one JSON manifest: a declared offline-first
PWA engineering record for one web app. Every field below is
read by the named section's checks. A field **absent** =
evidence missing (`INSUFFICIENT_EVIDENCE`); a field present
but false / invalid = the check fails
(`OFFLINE_FIRST_PWA_NOT_SOUND`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `app` (string; carried into the verdict output, not itself checked) | — |
| `architecture.local_store_is_primary_source` (boolean) | offline_first_architecture |
| `architecture.server_is_sync_target_or_absent` (boolean) | offline_first_architecture |
| `core_flows` (list of core-flow-row objects, each with the entry fields below; computed, see below) | offline_first_architecture |
| `core_flows[].name` (string; names the row in the computed outputs) | offline_first_architecture |
| `core_flows[].works_fully_offline` (boolean) | offline_first_architecture |
| `service_worker.app_shell_precached` (boolean) | service_worker_discipline |
| `service_worker.versioned_assets_precached` (boolean) | service_worker_discipline |
| `service_worker.sensitive_responses_not_cached_blindly` (boolean) | service_worker_discipline |
| `service_worker.update_flow_new_version_ready_ui_present` (boolean) | service_worker_discipline |
| `service_worker.skip_waiting_controlled` (boolean) | service_worker_discipline |
| `storage.versioned_schema_migrations_present` (boolean) | storage_engineering |
| `storage.migrations_tested` (boolean) | storage_engineering |
| `storage.quota_awareness_present` (boolean) | storage_engineering |
| `storage.quota_exhaustion_handled_gracefully` (boolean) | storage_engineering |
| `storage.export_path_exists` (boolean) | storage_engineering |
| `storage.import_path_exists` (boolean) | storage_engineering |
| `storage.export_import_round_trip_verified` (boolean) | storage_engineering |
| `sync.server_sync_used` (boolean; the applicability gate for the four sync checks below) | sync_and_honest_state |
| `sync.queue_with_retry_and_backoff` (boolean; gated — applies only when `server_sync_used` is `true`) | sync_and_honest_state |
| `sync.operations_idempotent` (boolean; gated, as above) | sync_and_honest_state |
| `sync.conflict_rules_explicit` (boolean; gated, as above) | sync_and_honest_state |
| `sync.state_visible_pending_synced_failed` (boolean; gated, as above) | sync_and_honest_state |
| `sync.indefinite_spinners_avoided` (boolean) | sync_and_honest_state |
| `installability.web_app_manifest_present` (boolean) | installability_encryption_and_ux |
| `installability.icons_present` (boolean) | installability_encryption_and_ux |
| `installability.theming_present` (boolean) | installability_encryption_and_ux |
| `installability.keyboard_first_usability_addressed` (boolean) | installability_encryption_and_ux |
| `installability.degraded_mode_messaging_present` (boolean) | installability_encryption_and_ux |
| `encryption.zero_knowledge_claimed` (boolean; the applicability gate for the three encryption checks below) | installability_encryption_and_ux |
| `encryption.webcrypto_used` (boolean; gated — applies only when `zero_knowledge_claimed` is `true`) | installability_encryption_and_ux |
| `encryption.keys_never_exported_unencrypted` (boolean; gated, as above) | installability_encryption_and_ux |
| `encryption.platform_limits_disclosed_honestly` (boolean; gated, as above) | installability_encryption_and_ux |
| `testing.devtools_offline_test_performed` (boolean) | testing_and_quality_gates |
| `testing.devtools_throttle_test_performed` (boolean) | testing_and_quality_gates |
| `testing.storage_full_simulation_performed` (boolean) | testing_and_quality_gates |
| `testing.upgrade_path_old_data_tested` (boolean) | testing_and_quality_gates |
| `testing.install_uninstall_flows_tested` (boolean) | testing_and_quality_gates |
| `testing.service_worker_update_flow_exercised` (boolean) | testing_and_quality_gates |
| `red_lines.silent_data_loss_present` (boolean; must be `false` to pass) | pwa_red_lines |
| `red_lines.caching_of_secrets_present` (boolean; must be `false` to pass) | pwa_red_lines |
| `red_lines.network_required_core_flows_claimed_offline_first_present` (boolean; must be `false` to pass) | pwa_red_lines |

Both gated groups follow the declared applicability flag,
exactly as declared. `sync_applicability_declared` passes
whenever `sync.server_sync_used` is present (either value);
each gated sync check is **missing** when the gate or the
field itself is absent, **passes as not applicable** when the
gate is declared `false` (whatever the field declares), and
when the gate is declared `true` passes only when the field
is declared `true`. The encryption group is identical in
shape, gated on `encryption.zero_knowledge_claimed` with its
own `zero_knowledge_applicability_declared` check — the gate
exists because the skill allows a server to be absent
entirely, and requires WebCrypto only when zero-knowledge is
claimed.

Several checks are computed from the declared rows, using
only the skill's own stated rules plus the consistency of
the declared record itself — no outside threshold is
imported:

- **Core flows declared:** the declared `core_flows` list
  passes only when it is present and non-empty; an absent
  list is missing evidence, an empty list fails.
- **Every core flow works fully offline:** every declared
  core-flow row must declare `works_fully_offline: true`
  (the skill: "Core flows work fully offline"). A row with
  the field absent is missing evidence.
- **No core flow name duplicated:** no declared core-flow
  `name` may appear on more than one core-flow row. A row
  with `name` absent is missing evidence for this check.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the three primary computed checks above cannot be
completed), `core_flows_count` (the declared list length, or
null when the list is not declared — counts are reported as
integers, exactly), the row-name list
`flows_without_offline_support` (flows whose field is
present but not true; a flow with the field absent is
missing evidence and does not appear) and
`duplicate_flow_names` (flow names declared on more than one
row, in the order their second occurrence appears), and the
coverage ratio `offline_coverage` (flows working fully
offline ÷ declared flows). **Fixed serialization rule:**
computed ratios are reported as strings with exactly six
decimal places, produced in both implementations by the same
rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly
six decimals; comparisons use the unrounded values. A ratio
is null when its denominator list is absent or empty. That
fixed serialization is what makes the Python and TypeScript
outputs byte-identical.

The skill states no numeric pass/fail threshold — its
engineering demands are qualitative declarations the record
makes, not bars the atom can set. Quantities are computed
and reported; the only bar on the computed rows is
completeness over the caller's own declared rows, exactly as
stated above. Declined thresholds, named: a cache size or
precache byte/count budget; a storage quota size in bytes or
a quota-warning percentage; a sync retry count, backoff
interval, or sync latency; an icon size, icon count, or
manifest completeness score; a number of core flows an app
must declare beyond the one declared list being non-empty; a
coverage percentage below completeness; a specific local
store technology mandate (the skill names IndexedDB for
structured data and OPFS for files as its method — this atom
checks that the local store is primary, not which named
technology a caller chose); a specific conflict-resolution
algorithm (the skill allows last-write-wins or a
domain-specific merge — only that the rule is explicit is
checked).

The verdict is one of `OFFLINE_FIRST_PWA_SOUND` (all 41
checks pass), `OFFLINE_FIRST_PWA_NOT_SOUND` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across seven sections:
offline_first_architecture, service_worker_discipline,
storage_engineering, sync_and_honest_state,
installability_encryption_and_ux, testing_and_quality_gates,
pwa_red_lines.

## Distinct ground

The nearest sibling is the deployed `local-first-sync-design`,
whose ground is **sync design** for a local-first system: its
checks ask whether a device store is authoritative over a
relay/backup server, whether mergeable state uses CRDT/OT,
whether tombstones and a compaction policy are declared,
whether every entity declares per-field merge semantics and
a stable id, whether delta sync, causal ordering and version
vectors are declared, whether synced data is end-to-end
encrypted with a key hierarchy and tested key recovery,
whether only semantic conflicts reach explicit UI, whether
prose is protected from silent last-write-wins, and whether
chaos scenarios and multi-device round trips were tested.
This atom's ground is the **offline-first PWA engineering
record** for a web app, and it shares **zero checks** with
that atom (verified by exact check-name comparison against
every sibling's source): every check here is a
PWA-engineering question — an app shell and versioned assets
pre-cached, sensitive responses never cached blindly, an
explicit "new version ready" update flow with controlled
skipWaiting, versioned schema migrations and quota handling,
a web app manifest with icons and theming, keyboard-first
usability and degraded-mode messaging, DevTools
offline/throttle tests, a storage-full simulation, an
upgrade-path test and install/uninstall flows. Sync appears
here only in the skill's own PWA form — a queue with
retry/backoff, idempotent operations, explicit conflict
rules and visible pending/synced/failed state, gated on
server sync being used at all — with none of the sibling's
merge, ordering, entity or key-hierarchy questions. No other
live or staged sibling reviews a PWA engineering record.

## Honest scoping

This atom reviews a **declared** offline-first PWA
engineering record — it builds no PWA, runs no service
worker, opens no browser, reads no cache, storage or
manifest from a live app, and does not verify that a
declared practice was ever carried out. An app is sound *on
the caller's declared evidence*: a record that declares its
app shell pre-cached, its migrations tested and no secrets
cached passes those checks even if the real app did none of
it. It is a completeness and consistency audit of the
engineering record the skill requires, **not PWA
engineering, a browser test, or a guarantee that the app
works offline**: it never judges whether the caching
strategy is right, whether the conflict rule is good,
whether the local store design is sound, or whether users
will succeed — only that the record contains what the
skill's method, quality gates and red lines demand, and
that its declared core-flow rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds
beyond the skill's own stated rules (see the declined list
above); no live verification of any declared fact; no
judgment of engineering *quality* — whether the service
worker, storage or sync design will work is the caller's
declaration, checked only for declared presence and
consistency; encryption substance (whether WebCrypto is
used correctly, whether keys are actually safe) is a caller
declaration — only its declared presence under a
zero-knowledge claim is checked.

## U-13 regulatory screen

This atom's output could not read as regulated professional
advice: it audits a declared software-engineering record for
completeness and consistency only, and offers no
engineering, financial, medical or legal advice about any
real system.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved
queue.
