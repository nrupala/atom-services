# Knowledge graph design — `knowledge-graph-design`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build knowledge graphs that serve users — schema, provenance, immutable history, query patterns, portable exports.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Knowledge mining graph build work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the knowledge-graph-design manifest

The caller submits one JSON manifest: a declared knowledge-graph
design record for one graph. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `graph` (string; carried into the verdict output, not itself checked) | — |
| `schema.entities_relations_attributes_modeled` (boolean) | schema_and_modeling |
| `schema.schema_changes_go_through_migrations` (boolean) | schema_and_modeling |
| `schema.migration_path_documented` (boolean) | schema_and_modeling |
| `schema.stable_ids_everywhere` (boolean) | schema_and_modeling |
| `schema.core_type_count` (number; computed, see below) | schema_and_modeling |
| `provenance.provenance_on_every_assertion` (boolean) | provenance |
| `provenance.user_asserted_inferred_imported_distinguished` (boolean) | provenance |
| `assertions` (list of assertion-row objects, each with the entry fields below; computed, see below) | provenance |
| `assertions[].name` (string; names the row in the computed outputs) | provenance |
| `assertions[].source_declared` (boolean) | provenance |
| `assertions[].date_declared` (boolean) | provenance |
| `assertions[].confidence_declared` (boolean) | provenance |
| `assertions[].origin_classified` (boolean) | provenance |
| `history.append_only_event_log_is_source_of_truth` (boolean) | immutable_history |
| `history.current_state_is_projection` (boolean) | immutable_history |
| `history.corrections_are_new_events_referencing_old` (boolean) | immutable_history |
| `history.silent_edits_present` (boolean; must be `false` to pass — skill red line) | immutable_history |
| `storage.storage_fit_selected` (boolean) | storage_and_query_retrieval |
| `storage.dedicated_graph_db_used` (boolean; gates the graph-DB justification check below) | storage_and_query_retrieval |
| `storage.graph_db_justified_by_query_complexity_or_scale` (boolean; required when a dedicated graph DB is declared used; otherwise the check passes as not applicable) | storage_and_query_retrieval |
| `query.canonical_query_patterns_defined` (boolean) | storage_and_query_retrieval |
| `query.full_text_and_vector_indexes_paired` (boolean) | storage_and_query_retrieval |
| `query.agent_queries_bounded` (boolean) | storage_and_query_retrieval |
| `query.counts_first_expand_on_request` (boolean) | storage_and_query_retrieval |
| `query.full_graph_dumps_present` (boolean; must be `false` to pass — skill: never dump the graph) | storage_and_query_retrieval |
| `portability.export_import_formats_json_or_jsonld` (boolean) | portability_and_ownership |
| `portability.export_import_round_trip_tested` (boolean) | portability_and_ownership |
| `portability.versioned_snapshots` (boolean) | portability_and_ownership |
| `portability.deletion_is_real` (boolean) | portability_and_ownership |
| `portability.tombstones_where_required_addressed` (boolean) | portability_and_ownership |
| `privacy.access_scoped` (boolean) | privacy_and_red_lines |
| `privacy.encryption_at_rest` (boolean) | privacy_and_red_lines |
| `privacy.sensitive_nodes_redactable` (boolean) | privacy_and_red_lines |
| `privacy.third_party_personal_data_without_lawful_basis_present` (boolean; must be `false` to pass — skill privacy line) | privacy_and_red_lines |
| `red_lines.unprovenanced_assertions_presented_as_fact_present` (boolean; must be `false` to pass — skill red line) | privacy_and_red_lines |

Several checks are computed from the declared values, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Core type count:** the skill's method step 1 states "start
  small (10–20 core types)". The declared
  `schema.core_type_count` therefore passes only when it lies in
  that stated range, 10–20 inclusive; an absent count is missing
  evidence. The output reports it back as
  `declared_core_type_count` (the declared number, or null when
  not declared).
- **Assertions declared:** the declared `assertions` list passes
  only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **Full provenance per assertion:** every declared assertion
  row must declare `source_declared`, `date_declared` and
  `confidence_declared` all `true` (the skill: provenance on
  every assertion — source, date, confidence). A row with any of
  the fields absent is missing evidence.
- **Origin classified per assertion:** every declared assertion
  row must declare `origin_classified: true` (the skill:
  distinguish user-asserted vs inferred vs imported facts). A
  row with the field absent is missing evidence.

One check is conditional, following the skill's own scoping —
computed from the declared gate field:

- **Graph-DB justification:** the skill's storage-fit step says
  a dedicated graph DB is used "only when query complexity or
  scale demands". `graph_db_justified_by_query_complexity_or_scale`
  is therefore required only when `storage.dedicated_graph_db_used`
  is declared `true`; when no dedicated graph DB is declared,
  the check passes as not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the four primary computed checks above cannot be completed),
`assertions_count` (the declared list length, or null when the
list is not declared — counts are reported as integers, exactly),
the row-name lists `assertions_without_full_provenance`
(assertions where a provenance field is present but not true; an
assertion with the field absent is missing evidence and does not
appear) and `assertions_without_origin_classification`
(assertions declaring `origin_classified` present but not true),
and the two coverage ratios `provenance_coverage` (assertions
with source, date and confidence all declared ÷ declared
assertions) and `origin_classification_coverage` (assertions
with origin classified ÷ declared assertions).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no other numeric pass/fail threshold — its one
stated range (10–20 core types) is used above, and everything
else is design content the record attests to, not bars the atom
can set. Quantities are computed and reported; the only other
bar on the computed rows is completeness over the caller's own
declared rows, exactly as stated above. Declined thresholds,
named: a confidence minimum or confidence scale (the skill
requires confidence to be carried as provenance, but states no
level, value or scale — only its declared presence is checked);
a graph size, node/edge count, or query-complexity number at
which a dedicated graph DB becomes required (the skill states
the condition in words only — caller attestation via the gated
justification check); a query bound, result limit or token
budget in numbers (the skill requires bounded, token-aware,
counts-first answers but states no number); a number of
canonical query patterns a design must define, beyond declaring
the patterns defined (the skill names neighborhoods, paths and
temporal windows as the pattern vocabulary, not a quota); a
snapshot frequency or retention period; an encryption algorithm
or key length; a schema-version number or migration count; a
coverage percentage below completeness for assertions.

The verdict is one of `KNOWLEDGE_GRAPH_DESIGN_SOUND` (all 31
checks pass), `KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence
is missing), across six sections: schema_and_modeling,
provenance, immutable_history, storage_and_query_retrieval,
portability_and_ownership, privacy_and_red_lines.

## Distinct ground

- **`codebase-structural-query` (live)** computes structural
  answers (descendants, ancestors, blast radius, paths, stats,
  snapshot) over a submitted *code-graph index* and one query.
  This atom computes nothing over a graph and answers no query:
  it audits a declared knowledge-graph *design record*. Zero
  shared checks.
- **`codebase-visualization` (live)** audits a declared
  *visualization artifact* record — diagrams-as-code, dependency
  and call views, architecture maps, hotspot views. This atom
  audits schema, provenance, history, storage/query, portability
  and privacy design declarations for a knowledge graph itself.
  Zero shared checks.

## Honest scoping

This atom audits a **declared** knowledge-graph design record —
it builds no graph, runs no graph database, ingests no data,
answers no query, and does not verify that a declared control
actually works. A design is sound *on the caller's declared
evidence*: a manifest that declares provenance on every
assertion, an append-only log, and a tested export round-trip
passes those checks even if the real graph does none of it. It
is a completeness and consistency audit of the record the skill
requires, **not a knowledge-graph build service or a design
certification**: it never judges whether the schema is the right
model for the domain, whether a confidence value is honest,
whether the chosen storage actually fits the real query load,
or whether an export really round-trips — only that the record
contains what the skill's method, quality gates and red lines
demand, and that its declared rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds beyond
the skill's own stated 10–20 core-type range (see the declined
list above); no live verification of any declared fact; no
inspection of real assertions, events, snapshots or exports —
provenance, origin classification, deletion and round-trip
testing are caller-declared flags and row declarations, the atom
reads no graph data; modeling quality (whether the entities,
relations and attributes chosen are the right ones) is a caller
declaration — the atom checks only that modeling is declared
deliberate and the stated start-small range is respected;
lawful-basis sufficiency for any third-party personal data in
any jurisdiction is not judged — only that the record declares
no ingestion without a lawful basis.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Generic engineering advice
