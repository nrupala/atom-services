# Offline first pwa engineering pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are building an offline-first web app — service workers, local storage, sync queues, installability, honest state UI — and you have a record of that engineering. This atom reads one declared manifest and returns one deterministic verdict across seven sections (offline_first_architecture, service_worker_discipline, storage_engineering, sync_and_honest_state, installability_encryption_and_ux, testing_and_quality_gates, pwa_red_lines): **OFFLINE_FIRST_PWA_SOUND**, **OFFLINE_FIRST_PWA_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 41 checks. It audits the declared record's completeness and consistency only — it builds no PWA, runs no service worker, opens no browser, reads no cache, storage or manifest from a live app, and does not verify that a declared practice was ever carried out. A record is sound *on your declared evidence*: it never judges whether the caching strategy is right, whether the conflict rule is good, whether the local store design is sound, or whether users will succeed. The three computed checks: the declared `core_flows` list must be present and non-empty; every declared core-flow row must declare `works_fully_offline: true`; and no declared core-flow `name` may appear on more than one row. Two groups are gated on declared applicability flags: the four sync checks apply only when `sync.server_sync_used` is `true`, and the three encryption checks apply only when `encryption.zero_knowledge_claimed` is `true` (when a gate is declared `false`, its gated checks pass as not applicable). Note: the three `red_lines.*_present` flags must be `false` to pass. No numeric threshold is imposed — no cache size or precache byte/count budget, no storage quota size in bytes or quota-warning percentage, no sync retry count, backoff interval or sync latency, no icon size, icon count or manifest completeness score, no number of core flows an app must declare beyond the one declared list being non-empty, no coverage percentage below completeness, no specific local store technology mandate, and no specific conflict-resolution algorithm (only that the rule is explicit is checked); those declined thresholds are named in the service definition. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "offline-first-pwa-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/offline-first-pwa-engineering-pack` — tool name `offline_first_pwa_engineering_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/offline-first-pwa-engineering-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `app` | app name (string; carried into the output, not checked) |
| `architecture.local_store_is_primary_source` | offline-first architecture evidence: the local store is the primary source for user data |
| `architecture.server_is_sync_target_or_absent` | offline-first architecture evidence: the server is a sync target, or absent entirely, never the primary source |
| `core_flows` (list of core-flow-row objects) | computed: must be present and non-empty; reported as `core_flows_count` |
| `core_flows[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row (duplicates reported in `duplicate_flow_names`) |
| `core_flows[].works_fully_offline` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `flows_without_offline_support` |
| `service_worker.app_shell_precached` | service worker evidence: the app shell is pre-cached |
| `service_worker.versioned_assets_precached` | service worker evidence: versioned assets are pre-cached |
| `service_worker.sensitive_responses_not_cached_blindly` | service worker evidence: sensitive responses are never cached blindly |
| `service_worker.update_flow_new_version_ready_ui_present` | service worker evidence: the update flow is explicit, with a "new version ready" UI |
| `service_worker.skip_waiting_controlled` | service worker evidence: skipWaiting is controlled, not automatic and uncontrolled |
| `storage.versioned_schema_migrations_present` | storage evidence: versioned schema migrations are present |
| `storage.migrations_tested` | storage evidence: storage migrations are tested |
| `storage.quota_awareness_present` | storage evidence: quota awareness is present |
| `storage.quota_exhaustion_handled_gracefully` | storage evidence: quota exhaustion is handled gracefully, including storage-full |
| `storage.export_path_exists` | storage evidence: an export path exists so users truly own their data |
| `storage.import_path_exists` | storage evidence: an import path exists so users truly own their data |
| `storage.export_import_round_trip_verified` | storage evidence: the export/import round trip is verified |
| `sync.server_sync_used` | the applicability gate for the four gated sync checks below; declaring it (either value) passes `sync_applicability_declared` |
| `sync.queue_with_retry_and_backoff` | gated (applies only when `server_sync_used` is `true`): changes are queued with retry and backoff |
| `sync.operations_idempotent` | gated, as above: sync operations are idempotent |
| `sync.conflict_rules_explicit` | gated, as above: conflict rules are explicit — last-write-wins or a domain-specific merge, declared not implicit |
| `sync.state_visible_pending_synced_failed` | gated, as above: visible sync state — pending, synced and failed — is shown |
| `sync.indefinite_spinners_avoided` | honest state evidence: there are no spinners-forever — the UI tells the truth about sync state |
| `installability.web_app_manifest_present` | installability evidence: a web app manifest is present |
| `installability.icons_present` | installability evidence: icons are present |
| `installability.theming_present` | installability evidence: theming is present |
| `installability.keyboard_first_usability_addressed` | UX evidence: keyboard-first usability is addressed |
| `installability.degraded_mode_messaging_present` | UX evidence: degraded-mode messaging is present when features need connectivity |
| `encryption.zero_knowledge_claimed` | the applicability gate for the three gated encryption checks below; declaring it (either value) passes `zero_knowledge_applicability_declared` |
| `encryption.webcrypto_used` | gated (applies only when `zero_knowledge_claimed` is `true`): WebCrypto is used when zero-knowledge is claimed |
| `encryption.keys_never_exported_unencrypted` | gated, as above: keys never leave the device unencrypted |
| `encryption.platform_limits_disclosed_honestly` | gated, as above: web-platform limits, including secure storage constraints, are disclosed honestly |
| `testing.devtools_offline_test_performed` | testing evidence: a DevTools offline test is performed |
| `testing.devtools_throttle_test_performed` | testing evidence: a DevTools throttle test is performed |
| `testing.storage_full_simulation_performed` | testing evidence: a storage-full simulation is performed |
| `testing.upgrade_path_old_data_tested` | testing evidence: the upgrade path is tested — old data to new version |
| `testing.install_uninstall_flows_tested` | testing evidence: install and uninstall flows are tested |
| `testing.service_worker_update_flow_exercised` | testing evidence: the update flow for a new service worker is exercised |
| `red_lines.silent_data_loss_present` | must be `false` to pass (red line: no silent data loss) |
| `red_lines.caching_of_secrets_present` | must be `false` to pass (red line: no caching of secrets) |
| `red_lines.network_required_core_flows_claimed_offline_first_present` | must be `false` to pass (red line: no offline-first claim with network-required core flows) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward OFFLINE_FIRST_PWA_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/offline-first-pwa-engineering-pack`:

```json
{
  "app": "TestApp",
  "architecture": {
    "local_store_is_primary_source": true,
    "server_is_sync_target_or_absent": true
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
  ],
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
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 41 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "core_flows_count": 2,
  "flows_without_offline_support": [],
  "offline_coverage": "1.000000",
  "duplicate_flow_names": [],
  "summary": "41 pass, 0 fail, 0 missing of 41 checks across seven sections."
}
```

## Verdicts

- **OFFLINE_FIRST_PWA_SOUND** — every check passes; the declared offline-first PWA engineering record is complete and consistent with the skill's checklist and red lines.
- **OFFLINE_FIRST_PWA_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `core_flows_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `flows_without_offline_support` and `duplicate_flow_names` (null when the `core_flows` list is not declared; a flow with the relevant field absent is missing evidence and does not appear in `flows_without_offline_support`), the coverage value `offline_coverage` (a ratio as a string with exactly six decimal places; null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the three primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
