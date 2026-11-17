# Knowledge graph design — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing a knowledge graph that should serve users with provenance, immutable history and portable exports, and you have a record of how that graph was designed. This atom reads one declared manifest and returns one deterministic verdict across six sections: **KNOWLEDGE_GRAPH_DESIGN_SOUND**, **KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it builds no graph, runs no graph database, ingests no data, answers no query, and does not verify that a declared control actually works. A design is sound *on your declared evidence*: it never judges whether the schema is the right model for the domain, whether a confidence value is honest, whether the chosen storage actually fits the real query load, or whether an export really round-trips. Computed checks: the declared `schema.core_type_count` must lie in the skill's stated start-small range of 10–20 inclusive; the declared `assertions` list must be present and non-empty; every assertion row must declare source, date and confidence, and must declare its origin classified. The graph-DB justification check is conditional: it is required only when `storage.dedicated_graph_db_used` is declared `true`; otherwise it passes as not applicable. No other numeric threshold is imposed — no confidence minimum or scale, no graph size / node / edge count or query-complexity number at which a dedicated graph DB becomes required, no query bound, result limit or token budget in numbers, no number of canonical query patterns beyond declaring them defined, no snapshot frequency or retention period, no encryption algorithm or key length, no schema-version number or migration count, and no coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "knowledge-graph-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/knowledge-graph-design` — tool name `knowledge_graph_design`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/knowledge-graph-design` — body = the manifest object; same `Authorization` header.

## Input — the knowledge-graph-design manifest

| Field | Meaning |
|---|---|
| `graph` | graph name (string; carried into the output, not checked) |
| `schema.entities_relations_attributes_modeled` | schema evidence: entities, relations and attributes are modeled |
| `schema.schema_changes_go_through_migrations` | schema evidence: schema changes go through migrations |
| `schema.migration_path_documented` | schema evidence: the migration path is documented |
| `schema.stable_ids_everywhere` | schema evidence: stable IDs are used everywhere |
| `schema.core_type_count` | computed (number): must lie in 10–20 inclusive to pass; reported back as `declared_core_type_count` |
| `provenance.provenance_on_every_assertion` | provenance evidence: provenance is carried on every assertion |
| `provenance.user_asserted_inferred_imported_distinguished` | provenance evidence: user-asserted, inferred and imported facts are distinguished |
| `assertions` (list of assertion-row objects) | computed: must be present and non-empty; reported as `assertions_count` |
| `assertions[].name` (string) | names the row in the computed outputs |
| `assertions[].source_declared` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `assertions_without_full_provenance` |
| `assertions[].date_declared` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `assertions_without_full_provenance` |
| `assertions[].confidence_declared` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `assertions_without_full_provenance` |
| `assertions[].origin_classified` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `assertions_without_origin_classification` |
| `history.append_only_event_log_is_source_of_truth` | history evidence: an append-only event log is the source of truth |
| `history.current_state_is_projection` | history evidence: current state is a projection of the event log |
| `history.corrections_are_new_events_referencing_old` | history evidence: corrections are new events referencing the old |
| `history.silent_edits_present` | must be `false` to pass (red line: no silent edits) |
| `storage.storage_fit_selected` | storage evidence: storage fit is selected |
| `storage.dedicated_graph_db_used` | gate: declares whether a dedicated graph DB is used |
| `storage.graph_db_justified_by_query_complexity_or_scale` | required `true` only when `storage.dedicated_graph_db_used` is `true`; otherwise passes as not applicable |
| `query.canonical_query_patterns_defined` | query evidence: canonical query patterns are defined |
| `query.full_text_and_vector_indexes_paired` | query evidence: full-text and vector indexes are paired |
| `query.agent_queries_bounded` | query evidence: agent queries are bounded |
| `query.counts_first_expand_on_request` | query evidence: counts first, expand on request |
| `query.full_graph_dumps_present` | must be `false` to pass (skill: never dump the graph) |
| `portability.export_import_formats_json_or_jsonld` | portability evidence: export/import formats are JSON or JSON-LD |
| `portability.export_import_round_trip_tested` | portability evidence: export/import round-trip is tested |
| `portability.versioned_snapshots` | portability evidence: versioned snapshots are kept |
| `portability.deletion_is_real` | portability evidence: deletion is real |
| `portability.tombstones_where_required_addressed` | portability evidence: tombstones where required are addressed |
| `privacy.access_scoped` | privacy evidence: access is scoped |
| `privacy.encryption_at_rest` | privacy evidence: encryption at rest is in place |
| `privacy.sensitive_nodes_redactable` | privacy evidence: sensitive nodes are redactable |
| `privacy.third_party_personal_data_without_lawful_basis_present` | must be `false` to pass (privacy line: no third-party personal data without a lawful basis) |
| `red_lines.unprovenanced_assertions_presented_as_fact_present` | must be `false` to pass (red line: no unprovenanced assertions presented as fact) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/knowledge-graph-design`:

```json
{
  "graph": "customer-360-graph",
  "schema": {
    "entities_relations_attributes_modeled": true,
    "schema_changes_go_through_migrations": true,
    "migration_path_documented": true,
    "stable_ids_everywhere": true,
    "core_type_count": 15
  },
  "provenance": {
    "provenance_on_every_assertion": true,
    "user_asserted_inferred_imported_distinguished": true
  },
  "assertions": [
    {
      "name": "row_1",
      "source_declared": true,
      "date_declared": true,
      "confidence_declared": true,
      "origin_classified": true
    }
  ],
  "history": {
    "append_only_event_log_is_source_of_truth": true,
    "current_state_is_projection": true,
    "corrections_are_new_events_referencing_old": true,
    "silent_edits_present": false
  },
  "storage": {
    "storage_fit_selected": true,
    "dedicated_graph_db_used": true,
    "graph_db_justified_by_query_complexity_or_scale": true
  },
  "query": {
    "canonical_query_patterns_defined": true,
    "full_text_and_vector_indexes_paired": true,
    "agent_queries_bounded": true,
    "counts_first_expand_on_request": true,
    "full_graph_dumps_present": false
  },
  "portability": {
    "export_import_formats_json_or_jsonld": true,
    "export_import_round_trip_tested": true,
    "versioned_snapshots": true,
    "deletion_is_real": true,
    "tombstones_where_required_addressed": true
  },
  "privacy": {
    "access_scoped": true,
    "encryption_at_rest": true,
    "sensitive_nodes_redactable": true,
    "third_party_personal_data_without_lawful_basis_present": false
  },
  "red_lines": {
    "unprovenanced_assertions_presented_as_fact_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 31 checks and a text stamp of the verdict):

```json
{
  "service": "knowledge-graph-design",
  "atom_version": "0.1.0",
  "graph": "customer-360-graph",
  "verdict": "KNOWLEDGE_GRAPH_DESIGN_SOUND",
  "sections": {
    "schema_and_modeling": "pass",
    "provenance": "pass",
    "immutable_history": "pass",
    "storage_and_query_retrieval": "pass",
    "portability_and_ownership": "pass",
    "privacy_and_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "assertions_count": 1,
  "assertions_without_full_provenance": [],
  "provenance_coverage": "1.000000",
  "assertions_without_origin_classification": [],
  "origin_classification_coverage": "1.000000",
  "declared_core_type_count": 15,
  "summary": "31 pass, 0 fail, 0 missing of 31 checks across six sections."
}
```

## Verdicts

- **KNOWLEDGE_GRAPH_DESIGN_SOUND** — every check passes; the declared knowledge-graph design record is complete and consistent with the skill's checklist and lines.
- **KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `declared_core_type_count` (the declared number, or null when not declared), `assertions_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `assertions_without_full_provenance` and `assertions_without_origin_classification` (null when the `assertions` list is not declared; an assertion with the relevant field absent is missing evidence and does not appear in those lists), the coverage values `provenance_coverage` and `origin_classification_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the four primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
