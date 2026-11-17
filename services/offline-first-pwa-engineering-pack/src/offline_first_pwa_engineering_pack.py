#!/usr/bin/env python3
"""Offline-first PWA engineering pack -- deterministic core.

Built from the bound skill `pwa-offline-engineering`: "Build
offline-first web apps -- service workers, local storage, sync
queues, installability, honest state UI." ("The app must work
when the network doesn't. Local data is primary, the network is
a sync partner, and the UI always tells the truth about both.")

This atom is a REVIEW of a declared offline-first PWA
engineering record: it audits the record a caller declares
against the engineering the skill defines -- local store as
primary source, service-worker discipline (app shell and
versioned assets pre-cached, sensitive responses never cached
blindly, an explicit update flow with controlled skipWaiting),
storage engineering (versioned schema migrations, quota
awareness, export/import ownership), sync (a queue with
retry/backoff, idempotent operations, explicit conflict rules,
visible pending/synced/failed state, no spinners-forever),
installability and UX, client-side encryption when
zero-knowledge is claimed, the skill's testing set, its quality
gates and its red lines. It does not build a PWA itself, run a
service worker, read live app data, or verify that a declared
practice was ever carried out -- it checks that the engineering
record the skill requires is present and internally complete
and consistent on the declared evidence.

Distinct ground: the nearest sibling is the deployed
`local-first-sync-design`, whose ground is SYNC DESIGN for a
local-first system -- device store authoritative over a relay
server, CRDT/OT mergeable state, tombstones and compaction,
per-entity per-field merge semantics and stable ids, delta
sync, causal ordering and version vectors, end-to-end
encryption and key hierarchy/recovery for synced data,
semantic-conflict UI, prose last-write-wins rules, and chaos /
multi-device round-trip sync tests. This atom's ground is the
offline-first PWA ENGINEERING record for a web app -- a service
worker, a web app manifest, IndexedDB/OPFS-style local storage
engineering, installability, DevTools offline/throttle and
storage-full testing, and a PWA update flow. Zero checks are
shared with `local-first-sync-design` or any other sibling:
every check here asks a PWA-engineering question (pre-cached,
versioned, installable, quota-handled, update-flow-exercised)
that no sibling asks, and no sibling's sync-design question
(merge semantics, ordering, tombstones, key hierarchy) appears
here. Sync appears here only in the skill's own PWA form --
a queue, idempotence, explicit conflict rules and visible
state -- gated on the caller declaring that server sync is
used at all, because the skill allows the server to be absent
entirely.

The caller submits a PWA engineering manifest (a dict, or JSON
on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves -- no outside
threshold is imported:

- core_flows: the declared `core_flows` list must be non-empty,
  and every declared core-flow row must work fully offline
  (the skill: "Core flows work fully offline" and the red line
  against offline-first claims with network-required core
  flows);
- core-flow-name ownership: no declared core-flow name may be
  owned by more than one core-flow row (one primary record per
  core flow -- internal consistency of the declared rows).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule -- round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold -- no cache size, no
quota size, no retry count or backoff interval, no sync
latency, no icon size or count, no coverage percentage -- so
no numeric threshold check is invented; those quantities are
caller attestations at most, and quantities here are computed
and reported, with completeness (every declared core-flow row)
as the only bar, exactly as stated above.

Verdict:
- any fail             -> OFFLINE_FIRST_PWA_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> OFFLINE_FIRST_PWA_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "offline_first_architecture",
    "service_worker_discipline",
    "storage_engineering",
    "sync_and_honest_state",
    "installability_encryption_and_ux",
    "testing_and_quality_gates",
    "pwa_red_lines",
)

MANIFEST_SPEC = {
    "app": "string",
    "architecture": {
        "local_store_is_primary_source": "boolean",
        "server_is_sync_target_or_absent": "boolean",
    },
    "core_flows": [{
        "name": "string",
        "works_fully_offline": "boolean",
    }],
    "service_worker": {
        "app_shell_precached": "boolean",
        "versioned_assets_precached": "boolean",
        "sensitive_responses_not_cached_blindly": "boolean",
        "update_flow_new_version_ready_ui_present": "boolean",
        "skip_waiting_controlled": "boolean",
    },
    "storage": {
        "versioned_schema_migrations_present": "boolean",
        "migrations_tested": "boolean",
        "quota_awareness_present": "boolean",
        "quota_exhaustion_handled_gracefully": "boolean",
        "export_path_exists": "boolean",
        "import_path_exists": "boolean",
        "export_import_round_trip_verified": "boolean",
    },
    "sync": {
        "server_sync_used": "boolean",
        "queue_with_retry_and_backoff": "boolean",
        "operations_idempotent": "boolean",
        "conflict_rules_explicit": "boolean",
        "state_visible_pending_synced_failed": "boolean",
        "indefinite_spinners_avoided": "boolean",
    },
    "installability": {
        "web_app_manifest_present": "boolean",
        "icons_present": "boolean",
        "theming_present": "boolean",
        "keyboard_first_usability_addressed": "boolean",
        "degraded_mode_messaging_present": "boolean",
    },
    "encryption": {
        "zero_knowledge_claimed": "boolean",
        "webcrypto_used": "boolean",
        "keys_never_exported_unencrypted": "boolean",
        "platform_limits_disclosed_honestly": "boolean",
    },
    "testing": {
        "devtools_offline_test_performed": "boolean",
        "devtools_throttle_test_performed": "boolean",
        "storage_full_simulation_performed": "boolean",
        "upgrade_path_old_data_tested": "boolean",
        "install_uninstall_flows_tested": "boolean",
        "service_worker_update_flow_exercised": "boolean",
    },
    "red_lines": {
        "silent_data_loss_present": "boolean",
        "caching_of_secrets_present": "boolean",
        "network_required_core_flows_claimed_offline_first_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _gated_check(results, section, name, manifest, gate_path, field_path,
                 evidence):
    """Check gated on a declared applicability flag.

    Missing gate or missing field -> missing evidence. Gate
    declared false -> pass (not applicable to this app). Gate
    declared true -> the field must be declared true.
    """
    gate, gate_present = _get(manifest, *gate_path)
    value, present = _get(manifest, *field_path)
    both_present = gate_present and present
    if gate_present and gate is False:
        ok = True
    else:
        ok = value is True
    _check(results, section, name, value, both_present, ok, evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for an offline-first PWA manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    flows, has_flows = _get(manifest, "core_flows")
    flows_is_list = has_flows and isinstance(flows, list)
    flows_count = len(flows) if flows_is_list else None
    rows = flows if flows_is_list else []

    flows_without_offline_support = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "works_fully_offline" in c
         and c.get("works_fully_offline") is not True]
        if flows_is_list else None
    )
    duplicate_flow_names = None
    if flows_is_list:
        seen = []
        duplicate_flow_names = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("name"), str):
                nm = c["name"]
                if nm in seen and nm not in duplicate_flow_names:
                    duplicate_flow_names.append(nm)
                seen.append(nm)
    offline_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("works_fully_offline") is True)
        / flows_count
        if flows_is_list and flows_count > 0 else None
    )

    # ---- Section 1: offline_first_architecture ----
    _bool_check(results, "offline_first_architecture",
                "local_store_is_primary_source", manifest,
                ("architecture", "local_store_is_primary_source"),
                "architecture: the local store is the primary source for user data")
    _bool_check(results, "offline_first_architecture",
                "server_is_sync_target_or_absent", manifest,
                ("architecture", "server_is_sync_target_or_absent"),
                "architecture: the server is a sync target, or absent entirely, never the primary source")
    _check(results, "offline_first_architecture",
           "core_flows_declared", flows, flows_is_list,
           flows_is_list and flows_count > 0,
           "the declared record names its core flows -- the core flows list is present and non-empty")
    works_present = (
        flows_is_list
        and all(isinstance(c, dict) and "works_fully_offline" in c
                for c in rows)
    )
    _check(results, "offline_first_architecture",
           "every_core_flow_works_fully_offline", flows, works_present,
           flows_is_list and flows_count > 0
           and all(isinstance(c, dict)
                   and c.get("works_fully_offline") is True
                   for c in rows),
           "architecture: every declared core flow works fully offline")
    name_present = (
        flows_is_list
        and all(isinstance(c, dict) and "name" in c for c in rows)
    )
    _check(results, "offline_first_architecture",
           "no_core_flow_name_duplicated", flows, name_present,
           flows_is_list and duplicate_flow_names is not None
           and len(duplicate_flow_names) == 0,
           "core flows: no declared core flow name is owned by more than one core flow row")

    # ---- Section 2: service_worker_discipline ----
    _bool_check(results, "service_worker_discipline",
                "app_shell_precached", manifest,
                ("service_worker", "app_shell_precached"),
                "service worker: the app shell is pre-cached")
    _bool_check(results, "service_worker_discipline",
                "versioned_assets_precached", manifest,
                ("service_worker", "versioned_assets_precached"),
                "service worker: versioned assets are pre-cached")
    _bool_check(results, "service_worker_discipline",
                "sensitive_responses_not_cached_blindly", manifest,
                ("service_worker", "sensitive_responses_not_cached_blindly"),
                "service worker: sensitive responses are never cached blindly")
    _bool_check(results, "service_worker_discipline",
                "update_flow_new_version_ready_ui_present", manifest,
                ("service_worker", "update_flow_new_version_ready_ui_present"),
                "service worker: the update flow is explicit, with a new version ready UI")
    _bool_check(results, "service_worker_discipline",
                "skip_waiting_controlled", manifest,
                ("service_worker", "skip_waiting_controlled"),
                "service worker: skipWaiting is controlled, not automatic and uncontrolled")

    # ---- Section 3: storage_engineering ----
    _bool_check(results, "storage_engineering",
                "versioned_schema_migrations_present", manifest,
                ("storage", "versioned_schema_migrations_present"),
                "storage: versioned schema migrations are present")
    _bool_check(results, "storage_engineering",
                "migrations_tested", manifest,
                ("storage", "migrations_tested"),
                "storage: storage migrations are tested")
    _bool_check(results, "storage_engineering",
                "quota_awareness_present", manifest,
                ("storage", "quota_awareness_present"),
                "storage: quota awareness is present")
    _bool_check(results, "storage_engineering",
                "quota_exhaustion_handled_gracefully", manifest,
                ("storage", "quota_exhaustion_handled_gracefully"),
                "storage: quota exhaustion is handled gracefully, including storage-full")
    _bool_check(results, "storage_engineering",
                "export_path_exists", manifest,
                ("storage", "export_path_exists"),
                "storage: an export path exists so users truly own their data")
    _bool_check(results, "storage_engineering",
                "import_path_exists", manifest,
                ("storage", "import_path_exists"),
                "storage: an import path exists so users truly own their data")
    _bool_check(results, "storage_engineering",
                "export_import_round_trip_verified", manifest,
                ("storage", "export_import_round_trip_verified"),
                "storage: the export path exists and round-trips through import")

    # ---- Section 4: sync_and_honest_state ----
    gate_value, gate_present = _get(manifest, "sync", "server_sync_used")
    _check(results, "sync_and_honest_state",
           "sync_applicability_declared", gate_value, gate_present,
           True,
           "sync: whether the app uses server sync is declared -- the sync checks apply only when it does, because the server may be absent entirely")
    _gated_check(results, "sync_and_honest_state",
                 "queue_with_retry_and_backoff", manifest,
                 ("sync", "server_sync_used"),
                 ("sync", "queue_with_retry_and_backoff"),
                 "sync: changes are queued with retry and backoff")
    _gated_check(results, "sync_and_honest_state",
                 "operations_idempotent", manifest,
                 ("sync", "server_sync_used"),
                 ("sync", "operations_idempotent"),
                 "sync: sync operations are idempotent")
    _gated_check(results, "sync_and_honest_state",
                 "conflict_rules_explicit", manifest,
                 ("sync", "server_sync_used"),
                 ("sync", "conflict_rules_explicit"),
                 "sync: conflict rules are explicit -- last-write-wins or a domain-specific merge, declared not implicit")
    _gated_check(results, "sync_and_honest_state",
                 "state_visible_pending_synced_failed", manifest,
                 ("sync", "server_sync_used"),
                 ("sync", "state_visible_pending_synced_failed"),
                 "sync: visible sync state -- pending, synced and failed -- is shown")
    _bool_check(results, "sync_and_honest_state",
                "indefinite_spinners_avoided", manifest,
                ("sync", "indefinite_spinners_avoided"),
                "honest state: there are no spinners-forever -- the UI tells the truth about sync state")

    # ---- Section 5: installability_encryption_and_ux ----
    _bool_check(results, "installability_encryption_and_ux",
                "web_app_manifest_present", manifest,
                ("installability", "web_app_manifest_present"),
                "installability: a web app manifest is present")
    _bool_check(results, "installability_encryption_and_ux",
                "icons_present", manifest,
                ("installability", "icons_present"),
                "installability: icons are present")
    _bool_check(results, "installability_encryption_and_ux",
                "theming_present", manifest,
                ("installability", "theming_present"),
                "installability: theming is present")
    _bool_check(results, "installability_encryption_and_ux",
                "keyboard_first_usability_addressed", manifest,
                ("installability", "keyboard_first_usability_addressed"),
                "UX: keyboard-first usability is addressed")
    _bool_check(results, "installability_encryption_and_ux",
                "degraded_mode_messaging_present", manifest,
                ("installability", "degraded_mode_messaging_present"),
                "UX: degraded-mode messaging is present when features need connectivity")
    enc_gate, enc_gate_present = _get(manifest, "encryption", "zero_knowledge_claimed")
    _check(results, "installability_encryption_and_ux",
           "zero_knowledge_applicability_declared", enc_gate, enc_gate_present,
           True,
           "encryption: whether zero-knowledge is claimed is declared -- the encryption checks apply only when it is claimed")
    _gated_check(results, "installability_encryption_and_ux",
                 "webcrypto_used", manifest,
                 ("encryption", "zero_knowledge_claimed"),
                 ("encryption", "webcrypto_used"),
                 "encryption: WebCrypto is used when zero-knowledge is claimed")
    _gated_check(results, "installability_encryption_and_ux",
                 "keys_never_exported_unencrypted", manifest,
                 ("encryption", "zero_knowledge_claimed"),
                 ("encryption", "keys_never_exported_unencrypted"),
                 "encryption: keys never leave the device unencrypted")
    _gated_check(results, "installability_encryption_and_ux",
                 "platform_limits_disclosed_honestly", manifest,
                 ("encryption", "zero_knowledge_claimed"),
                 ("encryption", "platform_limits_disclosed_honestly"),
                 "encryption: web-platform limits, including secure storage constraints, are disclosed honestly")

    # ---- Section 6: testing_and_quality_gates ----
    _bool_check(results, "testing_and_quality_gates",
                "devtools_offline_test_performed", manifest,
                ("testing", "devtools_offline_test_performed"),
                "testing: a DevTools offline test is performed")
    _bool_check(results, "testing_and_quality_gates",
                "devtools_throttle_test_performed", manifest,
                ("testing", "devtools_throttle_test_performed"),
                "testing: a DevTools throttle test is performed")
    _bool_check(results, "testing_and_quality_gates",
                "storage_full_simulation_performed", manifest,
                ("testing", "storage_full_simulation_performed"),
                "testing: a storage-full simulation is performed")
    _bool_check(results, "testing_and_quality_gates",
                "upgrade_path_old_data_tested", manifest,
                ("testing", "upgrade_path_old_data_tested"),
                "testing: the upgrade path is tested -- old data to new version")
    _bool_check(results, "testing_and_quality_gates",
                "install_uninstall_flows_tested", manifest,
                ("testing", "install_uninstall_flows_tested"),
                "testing: install and uninstall flows are tested")
    _bool_check(results, "testing_and_quality_gates",
                "service_worker_update_flow_exercised", manifest,
                ("testing", "service_worker_update_flow_exercised"),
                "testing: the update flow for a new service worker is exercised")

    # ---- Section 7: pwa_red_lines ----
    _false_check(results, "pwa_red_lines",
                 "silent_data_loss_refused", manifest,
                 ("red_lines", "silent_data_loss_present"),
                 "red line: no silent data loss -- quota and deletes must warn")
    _false_check(results, "pwa_red_lines",
                 "secrets_caching_refused", manifest,
                 ("red_lines", "caching_of_secrets_present"),
                 "red line: no caching of secrets is present in the record")
    _false_check(results, "pwa_red_lines",
                 "network_required_core_flow_offline_claim_refused", manifest,
                 ("red_lines", "network_required_core_flows_claimed_offline_first_present"),
                 "red line: no offline-first claim is made with network-required core flows")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "OFFLINE_FIRST_PWA_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "OFFLINE_FIRST_PWA_SOUND"

    computed_names = (
        "core_flows_declared",
        "every_core_flow_works_fully_offline",
        "no_core_flow_name_duplicated",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "offline-first-pwa-engineering-pack",
        "atom_version": "0.1.0",
        "app": manifest.get("app"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "core_flows_count": flows_count,
        "flows_without_offline_support": flows_without_offline_support,
        "offline_coverage": _fmt6(offline_coverage),
        "duplicate_flow_names": duplicate_flow_names,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "OFFLINE-FIRST PWA ENGINEERING PACK",
        f"app: {verdict.get('app')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: offline_first_pwa_engineering_pack.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "OFFLINE_FIRST_PWA_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
