#!/usr/bin/env python3
"""Knowledge graph design — deterministic core.

Built from the bound skill `knowledge-graph-engineering`: "Build
knowledge graphs that serve users — schema, provenance, immutable
history, query patterns, portable exports." A knowledge graph
earns trust three ways: everything has provenance, nothing is
silently rewritten, and the user can walk away with their data.

This atom is an AUDIT of a declared knowledge-graph design
record: it validates the record a caller declares against the
skill's method, quality gates and red lines. It does not build
a graph, run a graph database, ingest data, answer queries, or
verify that a declared control actually works — it checks that
the record the skill requires is present and internally complete
and consistent on the declared evidence.

The caller submits a knowledge-graph manifest (a dict, or JSON
on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- core types: the declared `schema.core_type_count` must lie in
  the skill's own stated start-small range, 10-20 core types;
- assertions: the declared `assertions` list must be non-empty,
  and every declared assertion row must carry full provenance
  (source, date and confidence declared) and must declare its
  origin classified (user-asserted vs inferred vs imported —
  the skill's provenance distinction).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no other numeric threshold — no confidence
minimum, no graph size or scale number at which a dedicated
graph DB becomes required, no query token budget, no snapshot
frequency — so no other numeric threshold check is invented;
those quantities are caller attestations at most, and quantities
here are computed and reported, with completeness (every
declared assertion) as the only bar, exactly as stated above.

Verdict:
- any fail             -> KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> KNOWLEDGE_GRAPH_DESIGN_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "schema_and_modeling",
    "provenance",
    "immutable_history",
    "storage_and_query_retrieval",
    "portability_and_ownership",
    "privacy_and_red_lines",
)

MANIFEST_SPEC = {
    "graph": "string",
    "schema": {
        "entities_relations_attributes_modeled": "boolean",
        "schema_changes_go_through_migrations": "boolean",
        "migration_path_documented": "boolean",
        "stable_ids_everywhere": "boolean",
        "core_type_count": "number",
    },
    "provenance": {
        "provenance_on_every_assertion": "boolean",
        "user_asserted_inferred_imported_distinguished": "boolean",
    },
    "assertions": [{
        "name": "string",
        "source_declared": "boolean",
        "date_declared": "boolean",
        "confidence_declared": "boolean",
        "origin_classified": "boolean",
    }],
    "history": {
        "append_only_event_log_is_source_of_truth": "boolean",
        "current_state_is_projection": "boolean",
        "corrections_are_new_events_referencing_old": "boolean",
        "silent_edits_present": "boolean",
    },
    "storage": {
        "storage_fit_selected": "boolean",
        "dedicated_graph_db_used": "boolean",
        "graph_db_justified_by_query_complexity_or_scale": "boolean",
    },
    "query": {
        "canonical_query_patterns_defined": "boolean",
        "full_text_and_vector_indexes_paired": "boolean",
        "agent_queries_bounded": "boolean",
        "counts_first_expand_on_request": "boolean",
        "full_graph_dumps_present": "boolean",
    },
    "portability": {
        "export_import_formats_json_or_jsonld": "boolean",
        "export_import_round_trip_tested": "boolean",
        "versioned_snapshots": "boolean",
        "deletion_is_real": "boolean",
        "tombstones_where_required_addressed": "boolean",
    },
    "privacy": {
        "access_scoped": "boolean",
        "encryption_at_rest": "boolean",
        "sensitive_nodes_redactable": "boolean",
        "third_party_personal_data_without_lawful_basis_present":
            "boolean",
    },
    "red_lines": {
        "unprovenanced_assertions_presented_as_fact_present": "boolean",
    },
}

PROVENANCE_FIELDS = (
    "source_declared",
    "date_declared",
    "confidence_declared",
)


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


def _has_full_provenance(entry):
    return (
        isinstance(entry, dict)
        and all(entry.get(f) is True for f in PROVENANCE_FIELDS)
    )


def evaluate(manifest):
    """Return the verdict dict for a knowledge-graph manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows / numbers, read once for computed checks ----
    assertions, has_assertions = _get(manifest, "assertions")
    assertions_is_list = has_assertions and isinstance(assertions, list)
    assertions_count = len(assertions) if assertions_is_list else None
    rows = assertions if assertions_is_list else []

    core_type_count, has_core_type_count = _get(
        manifest, "schema", "core_type_count")
    declared_core_type_count = (
        core_type_count if has_core_type_count else None
    )

    assertions_without_full_provenance = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and any(f in c and c.get(f) is not True
                 for f in PROVENANCE_FIELDS)]
        if assertions_is_list else None
    )
    assertions_without_origin_classification = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "origin_classified" in c
         and c.get("origin_classified") is not True]
        if assertions_is_list else None
    )
    provenance_coverage = (
        sum(1 for c in rows if _has_full_provenance(c))
        / assertions_count
        if assertions_is_list and assertions_count > 0 else None
    )
    origin_classification_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("origin_classified") is True)
        / assertions_count
        if assertions_is_list and assertions_count > 0 else None
    )

    # ---- Section 1: schema_and_modeling (skill method 1: model
    #      deliberately — entities/relations/attributes; start
    #      small (10-20 core types); schema changes go through
    #      migrations like a database; stable IDs everywhere.
    #      Quality gate: schema + migration path documented;
    #      stable IDs) ----
    _bool_check(results, "schema_and_modeling",
                "entities_relations_attributes_modeled", manifest,
                ("schema", "entities_relations_attributes_modeled"),
                "model deliberately: entities, relations and "
                "attributes are modeled deliberately")
    _bool_check(results, "schema_and_modeling",
                "schema_changes_go_through_migrations", manifest,
                ("schema", "schema_changes_go_through_migrations"),
                "model deliberately: schema changes go through "
                "migrations like a database")
    _bool_check(results, "schema_and_modeling",
                "migration_path_documented", manifest,
                ("schema", "migration_path_documented"),
                "quality gate: schema and migration path are "
                "documented")
    _bool_check(results, "schema_and_modeling",
                "stable_ids_everywhere", manifest,
                ("schema", "stable_ids_everywhere"),
                "model deliberately: stable IDs everywhere")
    _check(results, "schema_and_modeling",
           "core_type_count_within_stated_start_range",
           core_type_count, has_core_type_count,
           has_core_type_count
           and 10 <= core_type_count <= 20,
           "model deliberately: the declared core type count "
           "starts small — the skill states 10-20 core types")

    # ---- Section 2: provenance (skill method 2: provenance on
    #      every assertion — source, date, confidence; distinguish
    #      user-asserted vs inferred vs imported facts. Quality
    #      gate: every assertion carries provenance) ----
    _bool_check(results, "provenance",
                "provenance_on_every_assertion", manifest,
                ("provenance", "provenance_on_every_assertion"),
                "provenance: every assertion carries provenance "
                "— source, date and confidence")
    _bool_check(results, "provenance",
                "user_asserted_inferred_imported_distinguished",
                manifest,
                ("provenance",
                 "user_asserted_inferred_imported_distinguished"),
                "provenance: user-asserted, inferred and imported "
                "facts are distinguished")
    _check(results, "provenance",
           "assertions_declared", assertions, assertions_is_list,
           assertions_is_list and assertions_count > 0,
           "the declared record names its assertions — the "
           "assertions list is present and non-empty")
    provenance_present = (
        assertions_is_list
        and all(isinstance(c, dict)
                and all(f in c for f in PROVENANCE_FIELDS)
                for c in rows)
    )
    _check(results, "provenance",
           "every_assertion_carries_full_provenance", assertions,
           provenance_present,
           assertions_is_list and assertions_count > 0
           and all(_has_full_provenance(c) for c in rows),
           "provenance: every declared assertion row declares "
           "source, date and confidence")
    origin_present = (
        assertions_is_list
        and all(isinstance(c, dict) and "origin_classified" in c
                for c in rows)
    )
    _check(results, "provenance",
           "every_assertion_origin_classified", assertions,
           origin_present,
           assertions_is_list and assertions_count > 0
           and all(isinstance(c, dict)
                   and c.get("origin_classified") is True
                   for c in rows),
           "provenance: every declared assertion row declares "
           "its origin classified")

    # ---- Section 3: immutable_history (skill method 3:
    #      append-only event log as the source of truth; current
    #      state = projection; corrections = new events
    #      referencing the old. Red line: no silent edits) ----
    _bool_check(results, "immutable_history",
                "append_only_event_log_is_source_of_truth", manifest,
                ("history", "append_only_event_log_is_source_of_truth"),
                "immutable history: an append-only event log is "
                "the source of truth")
    _bool_check(results, "immutable_history",
                "current_state_is_projection", manifest,
                ("history", "current_state_is_projection"),
                "immutable history: current state is a projection "
                "of the event log")
    _bool_check(results, "immutable_history",
                "corrections_are_new_events_referencing_old",
                manifest,
                ("history",
                 "corrections_are_new_events_referencing_old"),
                "immutable history: corrections are new events "
                "referencing the old")
    _false_check(results, "immutable_history",
                 "no_silent_edits", manifest,
                 ("history", "silent_edits_present"),
                 "red line: no silent edits — append or version")

    # ---- Section 4: storage_and_query_retrieval (skill method
    #      4: storage fit — SQLite/Postgres with an edges table
    #      for most needs; a dedicated graph DB only when query
    #      complexity or scale demands; pair with full-text +
    #      vector indexes. Method 5: canonical query patterns;
    #      bounded agent answers — counts first, expand on
    #      request; never dump the graph. Quality gate: agent
    #      queries bounded) ----
    _bool_check(results, "storage_and_query_retrieval",
                "storage_fit_selected", manifest,
                ("storage", "storage_fit_selected"),
                "storage fit: storage is selected to fit — "
                "SQLite/Postgres with an edges table for most "
                "needs, a dedicated graph DB only when query "
                "complexity or scale demands")
    _gated_bool_check(
        results, "storage_and_query_retrieval",
        "graph_db_justified_when_dedicated_graph_db_used",
        manifest,
        ("storage", "dedicated_graph_db_used"),
        ("storage", "graph_db_justified_by_query_complexity_or_scale"),
        "storage fit: a dedicated graph DB is justified by "
        "query complexity or scale when one is used",
        "no dedicated graph DB declared")
    _bool_check(results, "storage_and_query_retrieval",
                "canonical_query_patterns_defined", manifest,
                ("query", "canonical_query_patterns_defined"),
                "query and retrieval: canonical query patterns "
                "— neighborhoods, paths and temporal windows — "
                "are defined")
    _bool_check(results, "storage_and_query_retrieval",
                "retrieval_indexes_paired", manifest,
                ("query", "full_text_and_vector_indexes_paired"),
                "storage fit: full-text and vector indexes are "
                "paired for retrieval")
    _bool_check(results, "storage_and_query_retrieval",
                "agent_queries_bounded", manifest,
                ("query", "agent_queries_bounded"),
                "quality gate: agent queries are bounded")
    _bool_check(results, "storage_and_query_retrieval",
                "counts_first_expand_on_request", manifest,
                ("query", "counts_first_expand_on_request"),
                "query and retrieval: bounded answers for agents "
                "— counts first, expand on request (token-aware "
                "serialization)")
    _false_check(results, "storage_and_query_retrieval",
                 "no_full_graph_dumps", manifest,
                 ("query", "full_graph_dumps_present"),
                 "query and retrieval: the graph is never dumped "
                 "— bounded answers only")

    # ---- Section 5: portability_and_ownership (skill method 6:
    #      export/import formats tested round-trip (simple
    #      JSON/JSON-LD); versioned snapshots; deletion is real
    #      (plus tombstones where required). Quality gate:
    #      export/import round-trip tested. Red line: deletion
    #      must actually delete) ----
    _bool_check(results, "portability_and_ownership",
                "export_import_formats_json_or_jsonld", manifest,
                ("portability", "export_import_formats_json_or_jsonld"),
                "portability and ownership: export and import "
                "formats are simple JSON or JSON-LD")
    _bool_check(results, "portability_and_ownership",
                "export_import_round_trip_tested", manifest,
                ("portability", "export_import_round_trip_tested"),
                "quality gate: export and import are tested "
                "round-trip")
    _bool_check(results, "portability_and_ownership",
                "versioned_snapshots", manifest,
                ("portability", "versioned_snapshots"),
                "portability and ownership: versioned snapshots "
                "are kept")
    _bool_check(results, "portability_and_ownership",
                "deletion_is_real", manifest,
                ("portability", "deletion_is_real"),
                "red line: deletion is real — deletion must "
                "actually delete")
    _bool_check(results, "portability_and_ownership",
                "tombstones_where_required_addressed", manifest,
                ("portability",
                 "tombstones_where_required_addressed"),
                "portability and ownership: tombstones where "
                "required are addressed alongside real deletion")

    # ---- Section 6: privacy_and_red_lines (skill method 7:
    #      graphs reveal relationships — scope access, encrypt
    #      at rest; sensitive nodes redactable; never ingest
    #      third-party personal data without a lawful basis.
    #      Quality gate: access scoped. Red line: no
    #      unprovenanced assertions presented as fact) ----
    _bool_check(results, "privacy_and_red_lines",
                "access_scoped", manifest,
                ("privacy", "access_scoped"),
                "quality gate: access is scoped — graphs reveal "
                "relationships")
    _bool_check(results, "privacy_and_red_lines",
                "encryption_at_rest", manifest,
                ("privacy", "encryption_at_rest"),
                "privacy and encryption: the graph is encrypted "
                "at rest")
    _bool_check(results, "privacy_and_red_lines",
                "sensitive_nodes_redactable", manifest,
                ("privacy", "sensitive_nodes_redactable"),
                "privacy and encryption: sensitive nodes are "
                "redactable")
    _false_check(results, "privacy_and_red_lines",
                 "no_third_party_personal_data_without_lawful_basis",
                 manifest,
                 ("privacy",
                  "third_party_personal_data_without_lawful_basis_present"),
                 "privacy and encryption: no third-party personal "
                 "data is ingested without a lawful basis")
    _false_check(results, "privacy_and_red_lines",
                 "no_unprovenanced_assertions_presented_as_fact",
                 manifest,
                 ("red_lines",
                  "unprovenanced_assertions_presented_as_fact_present"),
                 "red line: no unprovenanced assertions are "
                 "presented as fact")

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
        verdict = "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "KNOWLEDGE_GRAPH_DESIGN_SOUND"

    computed_names = (
        "core_type_count_within_stated_start_range",
        "assertions_declared",
        "every_assertion_carries_full_provenance",
        "every_assertion_origin_classified",
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
        "service": "knowledge-graph-design",
        "atom_version": "0.1.0",
        "graph": manifest.get("graph"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "assertions_count": assertions_count,
        "assertions_without_full_provenance":
            assertions_without_full_provenance,
        "provenance_coverage": _fmt6(provenance_coverage),
        "assertions_without_origin_classification":
            assertions_without_origin_classification,
        "origin_classification_coverage":
            _fmt6(origin_classification_coverage),
        "declared_core_type_count": declared_core_type_count,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "KNOWLEDGE GRAPH DESIGN",
        f"graph: {verdict.get('graph')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: knowledge_graph_design.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "KNOWLEDGE_GRAPH_DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
