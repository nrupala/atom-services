#!/usr/bin/env python3
"""Local-first sync design — deterministic core.

Built from the bound skill `local-first-engineering`: "Local-first:
the device holds the truth, the network is an enhancement. Data
works offline, syncs when possible, merges without loss, and stays
encrypted in transit."

This atom is an AUDIT of a declared local-first sync design record:
it validates the record a caller declares against the skill's
method (local truth, data model, sync protocol, encryption,
conflicts, state UI, testing), its quality gates, and its red
lines. It does not design a sync engine, run a sync, merge data,
encrypt anything, or verify that a declared control actually
works — it checks that the record the skill requires is present
and internally complete and consistent on the declared evidence.

The caller submits a local-first manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- entities: the declared `entities` list must be non-empty, and
  every declared entity row must declare per-field merge
  semantics and a stable ID (the skill's data model: "per-field
  merge semantics; stable document/entity IDs");
- prose entities: no entity row declared as user prose may
  declare silent last-write-wins (the skill's red line: "never
  silent last-write-wins on user prose").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no numeric threshold — no bandwidth budget, no
offline duration, no compaction interval or tombstone retention,
no test-count or coverage bar, no device-matrix size — so no
numeric threshold check is invented; those quantities are caller
attestations at most, and quantities here are computed and
reported, with completeness (every declared entity) as the only
bar, exactly as stated above.

Verdict:
- any fail             -> LOCAL_FIRST_SYNC_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> LOCAL_FIRST_SYNC_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "local_truth_and_data_model",
    "sync_protocol",
    "encryption_and_keys",
    "conflicts_and_state_ui",
    "testing_and_quality_gates",
)

MANIFEST_SPEC = {
    "app": "string",
    "local_truth": {
        "device_store_authoritative": "boolean",
        "server_is_relay_and_backup_not_gate": "boolean",
        "core_flows_designed_airplane_mode_first": "boolean",
        "core_flows_work_fully_offline": "boolean",
        "sync_resumes_cleanly_after_long_offline": "boolean",
    },
    "data_model": {
        "mergeable_state_uses_crdt_or_ot": "boolean",
        "tombstones_declared": "boolean",
        "compaction_policy_declared": "boolean",
    },
    "entities": [{
        "name": "string",
        "per_field_merge_semantics_declared": "boolean",
        "stable_id_declared": "boolean",
        "is_user_prose": "boolean",
        "silent_last_write_wins_present": "boolean",
    }],
    "sync_protocol": {
        "delta_sync_declared": "boolean",
        "causal_ordering_declared": "boolean",
        "resumability_declared": "boolean",
        "bandwidth_budgets_declared": "boolean",
        "store_and_forward_for_intermittent_peers": "boolean",
        "vector_clocks_or_version_vectors_declared": "boolean",
    },
    "encryption": {
        "e2ee_before_upload": "boolean",
        "keys_never_leave_devices": "boolean",
        "per_device_keys_declared": "boolean",
        "key_hierarchy_declared": "boolean",
        "key_recovery_ux_tested_like_a_feature": "boolean",
        "key_recovery_exercised_end_to_end": "boolean",
        "e2ee_verified": "boolean",
    },
    "personal_data_sync": {
        "personal_data_synced": "boolean",
        "personal_data_encrypted_before_sync": "boolean",
    },
    "conflicts": {
        "automatic_merge_for_text_and_counters": "boolean",
        "explicit_ui_only_for_semantic_conflicts": "boolean",
        "silent_data_loss_present": "boolean",
        "silent_last_write_wins_on_user_prose_present": "boolean",
    },
    "state_ui": {
        "offline_state_shown": "boolean",
        "queued_state_shown": "boolean",
        "syncing_state_shown": "boolean",
        "synced_state_shown": "boolean",
        "conflict_state_shown": "boolean",
        "export_escape_hatch_present": "boolean",
        "import_escape_hatch_present": "boolean",
        "sync_diagnostics_present": "boolean",
        "sync_badge_claimed": "boolean",
    },
    "testing": {
        "chaos_offline_scenario_tested": "boolean",
        "chaos_clock_skew_scenario_tested": "boolean",
        "chaos_concurrent_edits_scenario_tested": "boolean",
        "chaos_device_loss_scenario_tested": "boolean",
        "merge_invariants_property_tested": "boolean",
        "export_import_tested_on_real_data_volumes": "boolean",
        "real_device_matrix_tested": "boolean",
        "multi_device_round_trip_tests_passed": "boolean",
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


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


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
    """Return the verdict dict for a local-first sync manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    entities, has_entities = _get(manifest, "entities")
    entities_is_list = has_entities and isinstance(entities, list)
    entities_count = len(entities) if entities_is_list else None
    rows = entities if entities_is_list else []

    entities_without_merge_semantics = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "per_field_merge_semantics_declared" in c
         and c.get("per_field_merge_semantics_declared") is not True]
        if entities_is_list else None
    )
    entities_without_stable_id = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "stable_id_declared" in c
         and c.get("stable_id_declared") is not True]
        if entities_is_list else None
    )
    prose_rows = [
        c for c in rows
        if isinstance(c, dict) and c.get("is_user_prose") is True
    ]
    prose_entities_with_silent_lww = (
        [_row_name(c) for c in prose_rows
         if c.get("silent_last_write_wins_present") is True]
        if entities_is_list else None
    )
    merge_semantics_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("per_field_merge_semantics_declared") is True)
        / entities_count
        if entities_is_list and entities_count > 0 else None
    )
    stable_id_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("stable_id_declared") is True)
        / entities_count
        if entities_is_list and entities_count > 0 else None
    )

    # ---- Section 1: local_truth_and_data_model (skill method 1–2:
    #      local truth — device store authoritative, server a relay
    #      + backup not a gate, airplane-mode-first; data model —
    #      CRDTs (or OT), per-field merge semantics, stable IDs,
    #      tombstones + compaction policy; quality gate — core
    #      flows work fully offline, sync resumes cleanly) ----
    _bool_check(results, "local_truth_and_data_model",
                "device_store_authoritative", manifest,
                ("local_truth", "device_store_authoritative"),
                "local truth: the device store (IndexedDB/SQLite) "
                "is authoritative")
    _bool_check(results, "local_truth_and_data_model",
                "server_is_relay_and_backup_not_gate", manifest,
                ("local_truth", "server_is_relay_and_backup_not_gate"),
                "local truth: the server is a relay + backup, not "
                "a gate")
    _bool_check(results, "local_truth_and_data_model",
                "core_flows_designed_airplane_mode_first", manifest,
                ("local_truth",
                 "core_flows_designed_airplane_mode_first"),
                "local truth: flows are designed airplane-mode-first")
    _bool_check(results, "local_truth_and_data_model",
                "core_flows_work_fully_offline", manifest,
                ("local_truth", "core_flows_work_fully_offline"),
                "quality gate: core flows work fully offline")
    _bool_check(results, "local_truth_and_data_model",
                "sync_resumes_cleanly_after_long_offline", manifest,
                ("local_truth",
                 "sync_resumes_cleanly_after_long_offline"),
                "quality gate: sync resumes cleanly after long "
                "offline periods")
    _bool_check(results, "local_truth_and_data_model",
                "mergeable_state_uses_crdt_or_ot", manifest,
                ("data_model", "mergeable_state_uses_crdt_or_ot"),
                "data model: CRDTs (or OT) are used for mergeable "
                "state")
    _bool_check(results, "local_truth_and_data_model",
                "tombstones_declared", manifest,
                ("data_model", "tombstones_declared"),
                "data model: tombstones are declared")
    _bool_check(results, "local_truth_and_data_model",
                "compaction_policy_declared", manifest,
                ("data_model", "compaction_policy_declared"),
                "data model: a compaction policy is declared")
    _check(results, "local_truth_and_data_model",
           "entities_declared", entities, entities_is_list,
           entities_is_list and entities_count > 0,
           "the declared record names its entities — the entities "
           "list is present and non-empty")
    merge_present = (
        entities_is_list
        and all(isinstance(c, dict)
                and "per_field_merge_semantics_declared" in c
                for c in rows)
    )
    _check(results, "local_truth_and_data_model",
           "every_entity_per_field_merge_semantics_declared",
           entities, merge_present,
           entities_is_list and entities_count > 0
           and all(isinstance(c, dict)
                   and c.get("per_field_merge_semantics_declared")
                   is True for c in rows),
           "data model: every declared entity row declares "
           "per-field merge semantics")
    stable_id_present = (
        entities_is_list
        and all(isinstance(c, dict) and "stable_id_declared" in c
                for c in rows)
    )
    _check(results, "local_truth_and_data_model",
           "every_entity_stable_id_declared", entities,
           stable_id_present,
           entities_is_list and entities_count > 0
           and all(isinstance(c, dict)
                   and c.get("stable_id_declared") is True
                   for c in rows),
           "data model: every declared entity row declares a "
           "stable document/entity ID")

    # ---- Section 2: sync_protocol (skill method 3: delta sync,
    #      causal ordering, resumability, bandwidth budgets,
    #      store-and-forward for intermittent peers, vector clocks
    #      / version vectors for causality) ----
    _bool_check(results, "sync_protocol",
                "delta_sync_declared", manifest,
                ("sync_protocol", "delta_sync_declared"),
                "sync protocol: delta sync (over WebSocket/WebRTC) "
                "is declared")
    _bool_check(results, "sync_protocol",
                "causal_ordering_declared", manifest,
                ("sync_protocol", "causal_ordering_declared"),
                "sync protocol: causal ordering is declared")
    _bool_check(results, "sync_protocol",
                "resumability_declared", manifest,
                ("sync_protocol", "resumability_declared"),
                "sync protocol: resumability is declared")
    _bool_check(results, "sync_protocol",
                "bandwidth_budgets_declared", manifest,
                ("sync_protocol", "bandwidth_budgets_declared"),
                "sync protocol: bandwidth budgets are declared")
    _bool_check(results, "sync_protocol",
                "store_and_forward_for_intermittent_peers", manifest,
                ("sync_protocol",
                 "store_and_forward_for_intermittent_peers"),
                "sync protocol: store-and-forward for intermittent "
                "peers is declared")
    _bool_check(results, "sync_protocol",
                "vector_clocks_or_version_vectors_declared", manifest,
                ("sync_protocol",
                 "vector_clocks_or_version_vectors_declared"),
                "sync protocol: vector clocks / version vectors "
                "for causality are declared")

    # ---- Section 3: encryption_and_keys (skill method 4: E2EE
    #      before upload — keys never leave devices; per-device
    #      keys, key hierarchy, recovery UX tested like a feature;
    #      quality gate: E2EE verified, key recovery exercised
    #      end-to-end; red line: no sync of personal data without
    #      encryption) ----
    _bool_check(results, "encryption_and_keys",
                "e2ee_before_upload", manifest,
                ("encryption", "e2ee_before_upload"),
                "encryption: end-to-end encryption happens before "
                "upload")
    _bool_check(results, "encryption_and_keys",
                "keys_never_leave_devices", manifest,
                ("encryption", "keys_never_leave_devices"),
                "encryption: keys never leave devices")
    _bool_check(results, "encryption_and_keys",
                "per_device_keys_declared", manifest,
                ("encryption", "per_device_keys_declared"),
                "encryption: per-device keys are declared")
    _bool_check(results, "encryption_and_keys",
                "key_hierarchy_declared", manifest,
                ("encryption", "key_hierarchy_declared"),
                "encryption: a key hierarchy is declared")
    _bool_check(results, "encryption_and_keys",
                "key_recovery_ux_tested_like_a_feature", manifest,
                ("encryption", "key_recovery_ux_tested_like_a_feature"),
                "encryption: recovery UX is tested like a feature")
    _bool_check(results, "encryption_and_keys",
                "key_recovery_exercised_end_to_end", manifest,
                ("encryption", "key_recovery_exercised_end_to_end"),
                "quality gate: key recovery is exercised "
                "end-to-end")
    _bool_check(results, "encryption_and_keys",
                "e2ee_verified", manifest,
                ("encryption", "e2ee_verified"),
                "quality gate: E2EE is verified")
    _gated_bool_check(
        results, "encryption_and_keys",
        "personal_data_encrypted_when_personal_data_synced",
        manifest,
        ("personal_data_sync", "personal_data_synced"),
        ("personal_data_sync", "personal_data_encrypted_before_sync"),
        "red line: personal data is encrypted before sync when "
        "personal data is declared synced",
        "no personal data declared synced")

    # ---- Section 4: conflicts_and_state_ui (skill method 5–6:
    #      conflicts — automatic merges for text & counters,
    #      explicit UI only for semantic conflicts, always
    #      no-data-loss; red lines — no silent data loss, no
    #      last-write-wins on user prose, no "sync" badge without
    #      real multi-device round-trip tests; state UI — honest
    #      indicators offline / queued / syncing / synced /
    #      conflict, export & import escape hatches, sync
    #      diagnostics; quality gate — state UI tells the truth
    #      in every sync state) ----
    _bool_check(results, "conflicts_and_state_ui",
                "automatic_merge_for_text_and_counters", manifest,
                ("conflicts", "automatic_merge_for_text_and_counters"),
                "conflicts: automatic merges (CRDT) cover text & "
                "counters")
    _bool_check(results, "conflicts_and_state_ui",
                "explicit_ui_only_for_semantic_conflicts", manifest,
                ("conflicts",
                 "explicit_ui_only_for_semantic_conflicts"),
                "conflicts: explicit UI is used only for semantic "
                "conflicts")
    _false_check(results, "conflicts_and_state_ui",
                 "no_silent_data_loss", manifest,
                 ("conflicts", "silent_data_loss_present"),
                 "red line: no silent data loss, ever")
    _false_check(results, "conflicts_and_state_ui",
                 "no_silent_last_write_wins_on_user_prose", manifest,
                 ("conflicts",
                  "silent_last_write_wins_on_user_prose_present"),
                 "red line: no silent last-write-wins on user "
                 "prose is present in the declared design")
    prose_gate_present = (
        entities_is_list
        and all(isinstance(c, dict) and "is_user_prose" in c
                for c in rows)
    )
    prose_present = (
        entities_is_list and prose_gate_present
        and all("silent_last_write_wins_present" in c
                for c in prose_rows)
    )
    _check(results, "conflicts_and_state_ui",
           "no_prose_entity_uses_silent_last_write_wins", entities,
           prose_present,
           entities_is_list
           and len(prose_entities_with_silent_lww) == 0,
           "red line: no declared entity row that is user prose "
           "declares silent last-write-wins")
    _bool_check(results, "conflicts_and_state_ui",
                "offline_state_shown", manifest,
                ("state_ui", "offline_state_shown"),
                "state UI: the offline state is shown honestly")
    _bool_check(results, "conflicts_and_state_ui",
                "queued_state_shown", manifest,
                ("state_ui", "queued_state_shown"),
                "state UI: the queued state is shown honestly")
    _bool_check(results, "conflicts_and_state_ui",
                "syncing_state_shown", manifest,
                ("state_ui", "syncing_state_shown"),
                "state UI: the syncing state is shown honestly")
    _bool_check(results, "conflicts_and_state_ui",
                "synced_state_shown", manifest,
                ("state_ui", "synced_state_shown"),
                "state UI: the synced state is shown honestly")
    _bool_check(results, "conflicts_and_state_ui",
                "conflict_state_shown", manifest,
                ("state_ui", "conflict_state_shown"),
                "state UI: the conflict state is shown honestly")
    _bool_check(results, "conflicts_and_state_ui",
                "export_escape_hatch_present", manifest,
                ("state_ui", "export_escape_hatch_present"),
                "state UI: an export escape hatch is present")
    _bool_check(results, "conflicts_and_state_ui",
                "import_escape_hatch_present", manifest,
                ("state_ui", "import_escape_hatch_present"),
                "state UI: an import escape hatch is present")
    _bool_check(results, "conflicts_and_state_ui",
                "sync_diagnostics_present", manifest,
                ("state_ui", "sync_diagnostics_present"),
                "state UI: sync diagnostics are present")
    _gated_bool_check(
        results, "conflicts_and_state_ui",
        "sync_badge_only_with_multi_device_round_trip_tests",
        manifest,
        ("state_ui", "sync_badge_claimed"),
        ("testing", "multi_device_round_trip_tests_passed"),
        "red line: a \"sync\" badge is claimed only with real "
        "multi-device round-trip tests passed",
        "no sync badge claimed")

    # ---- Section 5: testing_and_quality_gates (skill method 7:
    #      testing — chaos scenarios: offline, clock skew,
    #      concurrent edits, device loss; property tests for merge
    #      invariants: commutative, associative, idempotent; real
    #      device matrices; quality gates — merge invariants
    #      property-tested, no user edit can be lost, export/import
    #      tested on real data volumes) ----
    _bool_check(results, "testing_and_quality_gates",
                "chaos_offline_scenario_tested", manifest,
                ("testing", "chaos_offline_scenario_tested"),
                "testing: the offline chaos scenario is tested")
    _bool_check(results, "testing_and_quality_gates",
                "chaos_clock_skew_scenario_tested", manifest,
                ("testing", "chaos_clock_skew_scenario_tested"),
                "testing: the clock-skew chaos scenario is tested")
    _bool_check(results, "testing_and_quality_gates",
                "chaos_concurrent_edits_scenario_tested", manifest,
                ("testing", "chaos_concurrent_edits_scenario_tested"),
                "testing: the concurrent-edits chaos scenario is "
                "tested")
    _bool_check(results, "testing_and_quality_gates",
                "chaos_device_loss_scenario_tested", manifest,
                ("testing", "chaos_device_loss_scenario_tested"),
                "testing: the device-loss chaos scenario is tested")
    _bool_check(results, "testing_and_quality_gates",
                "merge_invariants_property_tested", manifest,
                ("testing", "merge_invariants_property_tested"),
                "quality gate: merge invariants are property-tested "
                "— commutative, associative, idempotent — and no "
                "user edit can be lost")
    _bool_check(results, "testing_and_quality_gates",
                "export_import_tested_on_real_data_volumes", manifest,
                ("testing",
                 "export_import_tested_on_real_data_volumes"),
                "quality gate: export/import is tested on real "
                "data volumes")
    _bool_check(results, "testing_and_quality_gates",
                "real_device_matrix_tested", manifest,
                ("testing", "real_device_matrix_tested"),
                "testing: a real device matrix is tested")
    _bool_check(results, "testing_and_quality_gates",
                "multi_device_round_trip_tests_passed", manifest,
                ("testing", "multi_device_round_trip_tests_passed"),
                "red line: real multi-device round-trip tests are "
                "passed — the evidence a \"sync\" claim stands on")

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
        verdict = "LOCAL_FIRST_SYNC_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "LOCAL_FIRST_SYNC_SOUND"

    computed_names = (
        "entities_declared",
        "every_entity_per_field_merge_semantics_declared",
        "every_entity_stable_id_declared",
        "no_prose_entity_uses_silent_last_write_wins",
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
        "service": "local-first-sync-design",
        "atom_version": "0.1.0",
        "app": manifest.get("app"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "entities_count": entities_count,
        "entities_without_merge_semantics":
            entities_without_merge_semantics,
        "merge_semantics_coverage": _fmt6(merge_semantics_coverage),
        "entities_without_stable_id": entities_without_stable_id,
        "stable_id_coverage": _fmt6(stable_id_coverage),
        "prose_entities_with_silent_last_write_wins":
            prose_entities_with_silent_lww,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "LOCAL FIRST SYNC DESIGN",
        f"app: {verdict.get('app')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: local_first_sync_design.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "LOCAL_FIRST_SYNC_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
