# Knowledge graph design — documentation

**Knowledge graph design** · slug `knowledge-graph-design` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate, RC soak to 2026-11-22 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

> **Status discrepancy (named, not papered over):** SERVICE.md still says “Tier B · status: **built-locally** — deterministic core, Python oracle and TypeScript port built and parity-proven locally; no endpoint is live.” That is stale. This document follows the evidenced live state above: the external verification battery in `verification/work/knowledge-graph-design/evidence.json` was recorded against the live gateway (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b, per TEST-REPORT.md), and the atom is live — release candidate on RC soak to 2026-11-22.

This document follows the house documentation standard (AppDoc Studio, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under each worked example.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `graph` "customer-360-graph"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "knowledge-graph-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the knowledge-graph design manifest.** You declare a record of a knowledge graph already designed — the atom audits the record, it does not build the graph (see Explanation). The recorded full-pass manifest declares the graph `customer-360-graph`: entities, relations and attributes modeled, schema changes through migrations with the migration path documented, stable IDs everywhere, and a declared `core_type_count` of 15 (inside the skill's stated start-small range of 10–20); provenance on every assertion with user-asserted, inferred and imported facts distinguished, and one assertion row, `row_1`, declaring source, date and confidence and its origin classified; an append-only event log as the source of truth, current state as a projection, corrections as new events referencing the old, and no silent edits (`silent_edits_present: false`); storage fit selected, a dedicated graph DB used and justified by query complexity or scale, canonical query patterns defined, full-text and vector indexes paired, agent queries bounded, counts first / expand on request, and no full graph dumps (`full_graph_dumps_present: false`); export/import in JSON or JSON-LD with the round-trip tested, versioned snapshots, real deletion and tombstones where required addressed; and access scoped, encryption at rest, sensitive nodes redactable, no third-party personal data without a lawful basis (`third_party_personal_data_without_lawful_basis_present: false`) and no unprovenanced assertions presented as fact (`unprovenanced_assertions_presented_as_fact_present: false`).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/knowledge-graph-design` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `KNOWLEDGE_GRAPH_DESIGN_SOUND`: "31 pass, 0 fail, 0 missing of 31 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `declared_core_type_count` is 15, `assertions_count` is 1, `assertions_without_full_provenance` and `assertions_without_origin_classification` are both `[]`, and `provenance_coverage` and `origin_classification_coverage` are both `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "knowledge-graph-design"}`.
3. Call: `POST https://atoms.pipavia.com/v1/knowledge-graph-design` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/knowledge-graph-design` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `knowledge_graph_design`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `core_type_count_within_stated_start_range`, `every_assertion_carries_full_provenance`, `no_silent_edits`, `no_full_graph_dumps`, and the summary reads "27 pass, 4 fail, 0 missing of 31 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `assertions_without_full_provenance` names `row_1` — the row declaring `source_declared: false` — `provenance_coverage` falls to `"0.000000"`, `declared_core_type_count` is 5, outside the stated 10–20 range, and the run also declares `silent_edits_present` and `full_graph_dumps_present` as `true`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number is required) and no checks ran. The body names the field and the expected type — see Errors for this atom's recorded malformed body verbatim, and Worked examples, example 3, for the full recorded run. Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/knowledge-graph-design` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/knowledge-graph-design` — tool name `knowledge_graph_design`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `knowledge_graph_design` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. Where SERVICE.md states no type — the section container objects (`schema`, `provenance`, `history`, `storage`, `query`, `portability`, `privacy`, `red_lines`) and an `assertions[]` row object — the type given below is grounded in the recorded evidence inputs (and, for the containers, in the MCP `inputSchema` recorded in the same evidence file), and is marked “(from recorded evidence)”. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `graph` | string | Carried into the verdict output, not itself checked |

#### Read by: schema_and_modeling

| Field | Type | Notes |
|---|---|---|
| `schema` | object (from recorded evidence) | The schema section object |
| `schema.entities_relations_attributes_modeled` | boolean | — |
| `schema.schema_changes_go_through_migrations` | boolean | — |
| `schema.migration_path_documented` | boolean | — |
| `schema.stable_ids_everywhere` | boolean | — |
| `schema.core_type_count` | number | Computed, see below: passes only in the skill's stated range 10–20 inclusive; reported back as `declared_core_type_count` |

#### Read by: provenance

| Field | Type | Notes |
|---|---|---|
| `provenance` | object (from recorded evidence) | The provenance section object |
| `provenance.provenance_on_every_assertion` | boolean | — |
| `provenance.user_asserted_inferred_imported_distinguished` | boolean | — |
| `assertions` | list | List of assertion-row objects, each with the entry fields below; computed, see below: must be present and non-empty; reported as `assertions_count` |
| `assertions[]` | object (from recorded evidence) | One declared assertion row |
| `assertions[].name` | string | Names the row in the computed outputs |
| `assertions[].source_declared` | boolean | Computed per row, see below |
| `assertions[].date_declared` | boolean | Computed per row, see below |
| `assertions[].confidence_declared` | boolean | Computed per row, see below |
| `assertions[].origin_classified` | boolean | Computed per row, see below |

#### Read by: immutable_history

| Field | Type | Notes |
|---|---|---|
| `history` | object (from recorded evidence) | The history section object |
| `history.append_only_event_log_is_source_of_truth` | boolean | — |
| `history.current_state_is_projection` | boolean | — |
| `history.corrections_are_new_events_referencing_old` | boolean | — |
| `history.silent_edits_present` | boolean | must be `false` to pass — skill red line |

#### Read by: storage_and_query_retrieval

| Field | Type | Notes |
|---|---|---|
| `storage` | object (from recorded evidence) | The storage section object |
| `storage.storage_fit_selected` | boolean | — |
| `storage.dedicated_graph_db_used` | boolean (gate) | Gates the graph-DB justification check below |
| `storage.graph_db_justified_by_query_complexity_or_scale` | boolean | Required when a dedicated graph DB is declared used; otherwise the check passes as not applicable |
| `query` | object (from recorded evidence) | The query section object — note: a top-level object separate from `storage`, although both are read by the `storage_and_query_retrieval` section |
| `query.canonical_query_patterns_defined` | boolean | — |
| `query.full_text_and_vector_indexes_paired` | boolean | Read by the check recorded as `retrieval_indexes_paired` (see Discrepancies) |
| `query.agent_queries_bounded` | boolean | — |
| `query.counts_first_expand_on_request` | boolean | — |
| `query.full_graph_dumps_present` | boolean | must be `false` to pass — skill: never dump the graph |

#### Read by: portability_and_ownership

| Field | Type | Notes |
|---|---|---|
| `portability` | object (from recorded evidence) | The portability section object |
| `portability.export_import_formats_json_or_jsonld` | boolean | — |
| `portability.export_import_round_trip_tested` | boolean | — |
| `portability.versioned_snapshots` | boolean | — |
| `portability.deletion_is_real` | boolean | — |
| `portability.tombstones_where_required_addressed` | boolean | — |

#### Read by: privacy_and_red_lines

| Field | Type | Notes |
|---|---|---|
| `privacy` | object (from recorded evidence) | The privacy section object |
| `privacy.access_scoped` | boolean | — |
| `privacy.encryption_at_rest` | boolean | — |
| `privacy.sensitive_nodes_redactable` | boolean | — |
| `privacy.third_party_personal_data_without_lawful_basis_present` | boolean | must be `false` to pass — skill privacy line |
| `red_lines` | object (from recorded evidence) | The red-lines section object |
| `red_lines.unprovenanced_assertions_presented_as_fact_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 31 checks, in the recorded order, grouped by section. Check names are the recorded names verbatim from the full-pass response in `verification/work/knowledge-graph-design/evidence.json`, even where they differ from the input field names they read (see Discrepancies). "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` as not applicable. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: schema_and_modeling

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `entities_relations_attributes_modeled` | model deliberately: entities, relations and attributes are modeled deliberately | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `schema_changes_go_through_migrations` | model deliberately: schema changes go through migrations like a database | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `migration_path_documented` | quality gate: schema and migration path are documented | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `stable_ids_everywhere` | model deliberately: stable IDs everywhere | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `core_type_count_within_stated_start_range` | model deliberately: the declared core type count starts small — the skill states 10-20 core types | Computed. Pass: `schema.core_type_count` is declared and lies in 10–20 inclusive. Fail: it is declared outside that range (recorded violations run: 5). Missing: the count is absent. |

#### Section: provenance

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `provenance_on_every_assertion` | provenance: every assertion carries provenance — source, date and confidence | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `user_asserted_inferred_imported_distinguished` | provenance: user-asserted, inferred and imported facts are distinguished | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `assertions_declared` | the declared record names its assertions — the assertions list is present and non-empty | Computed over the declared record. Pass: the `assertions` list is present and non-empty. Fail: the list is present and empty. Missing: the list is absent. |
| `every_assertion_carries_full_provenance` | provenance: every declared assertion row declares source, date and confidence | Computed over the declared rows. Pass: every row declares `source_declared`, `date_declared` and `confidence_declared` all `true`. Fail: a row declares any of those fields present but not `true` (offending rows are named in `assertions_without_full_provenance`). Missing: the list is absent, or a row has any of those fields absent (such a row is missing evidence and does not appear in `assertions_without_full_provenance`). |
| `every_assertion_origin_classified` | provenance: every declared assertion row declares its origin classified | Computed over the declared rows. Pass: every row declares `origin_classified: true`. Fail: a row declares `origin_classified` present but not `true` (offending rows are named in `assertions_without_origin_classification`). Missing: the list is absent, or a row has `origin_classified` absent (such a row is missing evidence and does not appear in `assertions_without_origin_classification`). |

#### Section: immutable_history

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `append_only_event_log_is_source_of_truth` | immutable history: an append-only event log is the source of truth | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `current_state_is_projection` | immutable history: current state is a projection of the event log | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `corrections_are_new_events_referencing_old` | immutable history: corrections are new events referencing the old | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_silent_edits` | red line: no silent edits — append or version | Pass: `history.silent_edits_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. Recorded check name differs from the input field name (see Discrepancies). |

#### Section: storage_and_query_retrieval

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `storage_fit_selected` | storage fit: storage is selected to fit — SQLite/Postgres with an edges table for most needs, a dedicated graph DB only when query complexity or scale demands | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `graph_db_justified_when_dedicated_graph_db_used` | storage fit: a dedicated graph DB is justified by query complexity or scale when one is used | Conditional on `storage.dedicated_graph_db_used`. Pass: the gate is declared `true` and `storage.graph_db_justified_by_query_complexity_or_scale` is declared `true` — or no dedicated graph DB is declared used, in which case the check passes as not applicable. Fail: the gate is declared `true` and the justification is declared `false`. Missing: the gate is declared `true` and the justification is absent — and, on the recorded sparse run, the check is `missing` when the gate field itself is absent, with recorded evidence text "no dedicated graph DB declared" (see Discrepancies). Recorded check name differs from the input field name it reads. |
| `canonical_query_patterns_defined` | query and retrieval: canonical query patterns — neighborhoods, paths and temporal windows — are defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `retrieval_indexes_paired` | storage fit: full-text and vector indexes are paired for retrieval | Pass: `query.full_text_and_vector_indexes_paired` is declared `true`. Fail: it is declared `false`. Missing: the field is absent. Recorded check name differs from the input field name (see Discrepancies). |
| `agent_queries_bounded` | quality gate: agent queries are bounded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `counts_first_expand_on_request` | query and retrieval: bounded answers for agents — counts first, expand on request (token-aware serialization) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_full_graph_dumps` | query and retrieval: the graph is never dumped — bounded answers only | Pass: `query.full_graph_dumps_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. Recorded check name differs from the input field name (see Discrepancies). |

#### Section: portability_and_ownership

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `export_import_formats_json_or_jsonld` | portability and ownership: export and import formats are simple JSON or JSON-LD | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `export_import_round_trip_tested` | quality gate: export and import are tested round-trip | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `versioned_snapshots` | portability and ownership: versioned snapshots are kept | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deletion_is_real` | red line: deletion is real — deletion must actually delete | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tombstones_where_required_addressed` | portability and ownership: tombstones where required are addressed alongside real deletion | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: privacy_and_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `access_scoped` | quality gate: access is scoped — graphs reveal relationships | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `encryption_at_rest` | privacy and encryption: the graph is encrypted at rest | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sensitive_nodes_redactable` | privacy and encryption: sensitive nodes are redactable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_third_party_personal_data_without_lawful_basis` | privacy and encryption: no third-party personal data is ingested without a lawful basis | Pass: `privacy.third_party_personal_data_without_lawful_basis_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. Recorded check name differs from the input field name (see Discrepancies). |
| `no_unprovenanced_assertions_presented_as_fact` | red line: no unprovenanced assertions are presented as fact | Pass: `red_lines.unprovenanced_assertions_presented_as_fact_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. Recorded check name differs from the input field name (see Discrepancies). |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"knowledge-graph-design"`), `atom_version` (`"0.1.0"`), and `graph` (the manifest's declared graph value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `declared_core_type_count` (the declared number, or null when not declared) and `assertions_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `assertions_without_full_provenance` (assertions where a provenance field — source, date or confidence — is present but not `true`; an assertion with the field absent is missing evidence and does not appear) and `assertions_without_origin_classification` (assertions declaring `origin_classified` present but not `true`) — both lists are null when the `assertions` list is not declared, as the recorded sparse run shows; and the ratios `provenance_coverage` (assertions with source, date and confidence all declared ÷ declared assertions) and `origin_classification_coverage` (assertions with origin classified ÷ declared assertions) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "31 pass, 0 fail, 0 missing of 31 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared graph value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `KNOWLEDGE_GRAPH_DESIGN_SOUND` — all 31 checks pass: the declared knowledge-graph design record is complete and consistent with the bound skill's checklist and red lines.
- `KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes (the four primary computed checks in SERVICE.md: core type count, assertions declared, full provenance per assertion, origin classified per assertion); `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including a gated check passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for the gated check: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `declared_core_type_count`, `assertions_count`, `assertions_without_full_provenance`, `assertions_without_origin_classification`, `provenance_coverage` and `origin_classification_coverage` — meanings and null rules are given in Output format above; their recorded values in the three worked examples are 15 / 1 / `[]` / `[]` / `"1.000000"` / `"1.000000"` (full-pass), 5 / 1 / `["row_1"]` / `[]` / `"0.000000"` / `"1.000000"` (violations), and, on the recorded sparse run in TEST-REPORT.md, all null.

### Errors

A failed call is not metered. Only the 422 body below was recorded in this atom's verification battery; the 401, 403 and 429 bodies were **not recorded** in the battery — for those, this document gives the HTTP status and meaning only, explicitly flagged as unrecorded, and invents no payload shape.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no body in the verification battery; status and meaning only.* | Missing or invalid gateway key. |
| 403 | *Unrecorded — no body in the verification battery; status and meaning only.* | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. |
| 422 | `{"ok":false,"error":"invalid_input","field":"schema.core_type_count","detail":"schema.core_type_count must be a number"}` — verbatim from this atom's recorded malformed run (Worked examples, example 3); the `field` and `detail` name the type violation | The manifest failed type validation before evaluation; no verdict is returned. |
| 429 | *Unrecorded — no body in the verification battery; status and meaning only.* | Per-key rate limit exceeded for this atom (60/minute, 10,000/day per key — see Rate limits and pricing). |

### Rate limits and pricing

- **Rate limits (per key, per atom, per USER-GUIDE.md):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above, unrecorded body) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). No price is set in SERVICE.md — prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production). **Free during trial — rate pending** (per USER-GUIDE.md).

## Explanation

**What the atom does.** Build knowledge graphs that serve users — schema, provenance, immutable history, query patterns, portable exports (the bound capability, from SERVICE.md). You submit one declared record — the knowledge-graph design manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 6 sections (`schema_and_modeling`, `provenance`, `immutable_history`, `storage_and_query_retrieval`, `portability_and_ownership`, `privacy_and_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared values themselves — the declared `schema.core_type_count` must lie in the skill's own stated start-small range of 10–20 inclusive; the declared `assertions` list must be present and non-empty; every assertion row must declare source, date and confidence, and must declare its origin classified — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *The conditional check* binds only when its declared gate field says the situation applies — graph-DB justification is required only when `storage.dedicated_graph_db_used` is declared `true`; when no dedicated graph DB is declared used, that check passes as not applicable (when the gate field itself is absent, the recorded sparse run reports the check as `missing` — see Discrepancies). Aggregation is strict: any `fail` anywhere produces `KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `KNOWLEDGE_GRAPH_DESIGN_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented beyond the skill's own stated 10–20 core-type range. Declined, named in SERVICE.md: a confidence minimum or confidence scale (the skill requires confidence to be carried as provenance, but states no level, value or scale — only its declared presence is checked); a graph size, node/edge count, or query-complexity number at which a dedicated graph DB becomes required (the skill states the condition in words only — caller attestation via the gated justification check); a query bound, result limit or token budget in numbers (the skill requires bounded, token-aware, counts-first answers but states no number); a number of canonical query patterns a design must define, beyond declaring the patterns defined (the skill names neighborhoods, paths and temporal windows as the pattern vocabulary, not a quota); a snapshot frequency or retention period; an encryption algorithm or key length; a schema-version number or migration count; and a coverage percentage below completeness for assertions. Quantities are computed and reported; the only other bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** knowledge-graph design record: a verdict of `KNOWLEDGE_GRAPH_DESIGN_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares provenance on every assertion, an append-only log, and a tested export round-trip passes those checks even if the real graph does none of it. It is a completeness and consistency audit of the record the skill requires, **not a knowledge-graph build service or a design certification**. Specifically: it builds no graph, runs no graph database, ingests no data, answers no query, and does not verify that a declared control actually works. It never judges whether the schema is the right model for the domain, whether a confidence value is honest, whether the chosen storage actually fits the real query load, or whether an export really round-trips — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated 10–20 core-type range (see the declined list above); no live verification of any declared fact; no inspection of real assertions, events, snapshots or exports — provenance, origin classification, deletion and round-trip testing are caller-declared flags and row declarations, the atom reads no graph data; modeling quality (whether the entities, relations and attributes chosen are the right ones) is a caller declaration — the atom checks only that modeling is declared deliberate and the stated start-small range is respected; lawful-basis sufficiency for any third-party personal data in any jurisdiction is not judged — only that the record declares no ingestion without a lawful basis.

**Distinct ground.** `codebase-structural-query` (live) computes structural answers over a submitted code-graph index and one query; this atom computes nothing over a graph and answers no query — it audits a declared knowledge-graph *design record*, with zero shared checks. `codebase-visualization` (live) audits a declared visualization artifact record; this atom audits schema, provenance, history, storage/query, portability and privacy design declarations for a knowledge graph itself, with zero shared checks.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Knowledge mining graph build work (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Discrepancies — recorded evidence prevails

Where SERVICE.md, TEST-REPORT.md or USER-GUIDE.md disagree with the recorded response in `verification/work/knowledge-graph-design/evidence.json`, this document follows the recorded response. Every discrepancy found is named here:

1. **Status staleness in SERVICE.md.** SERVICE.md says “built-locally … no endpoint is live”; the recorded battery was run against the live gateway (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b) and TEST-REPORT.md records PASS on the live faces. This document's status header follows the evidenced live state: live — release candidate, RC soak to 2026-11-22.
2. **Recorded check names differ from input field names (7 checks).** The Checks section uses the recorded names verbatim: `core_type_count_within_stated_start_range` (reads `schema.core_type_count`); `no_silent_edits` (reads `history.silent_edits_present`); `graph_db_justified_when_dedicated_graph_db_used` (reads `storage.graph_db_justified_by_query_complexity_or_scale`, gated by `storage.dedicated_graph_db_used`); `retrieval_indexes_paired` (reads `query.full_text_and_vector_indexes_paired`); `no_full_graph_dumps` (reads `query.full_graph_dumps_present`); `no_third_party_personal_data_without_lawful_basis` (reads `privacy.third_party_personal_data_without_lawful_basis_present`); and `no_unprovenanced_assertions_presented_as_fact` (reads `red_lines.unprovenanced_assertions_presented_as_fact_present`). Three further recorded check names are computed names with no single same-named input field: `assertions_declared`, `every_assertion_carries_full_provenance` and `every_assertion_origin_classified`.
3. **Gated check on absent evidence.** SERVICE.md says the graph-DB justification check “passes as not applicable” when no dedicated graph DB is declared. The recorded sparse run (only `graph` declared) reports that check as `missing`, with recorded evidence text “no dedicated graph DB declared” — not as a `pass`. This document follows the recording: a declared non-use passes as not applicable; an absent gate field is `missing`.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md.** The worked-example response in USER-GUIDE.md and the raw-output excerpts in TEST-REPORT.md are explicitly trimmed — they omit the `checks` array and the `stamp` field. The recorded full-pass response carries all 31 checks and a `stamp`; the Worked examples below reproduce the recorded responses in full, and the Reference describes the full shape.
5. **Section-object types not stated in SERVICE.md.** SERVICE.md states types for leaf fields (“all fields are booleans unless noted”, with `graph` and `assertions[].name` as string, `schema.core_type_count` as number and `assertions` as a list) but states no type for the section container objects or for an `assertions[]` row. The Input reference types those as `object`, grounded in the recorded evidence inputs (and the recorded MCP `inputSchema`), and marks them “(from recorded evidence)”.

No other discrepancy was found: verdicts, section names, computed values, the 31-check count, the sparse outcome and the malformed 422 field/detail agree across SERVICE.md, TEST-REPORT.md, USER-GUIDE.md and the recording.

## Role views

*Regulators: N/A — this atom audits a declared knowledge-graph design record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance or audit evidence and not a design certification (SERVICE.md states this explicitly, and expressly does not judge lawful-basis sufficiency for third-party personal data — only that the record declares no ingestion without a lawful basis), and knowledge-graph design is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `knowledge_graph_design` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Watch the name split in Discrepancy 2: several recorded check names do not match the input field names they read — search responses by check name, manifests by field name.

### For ops

Endpoints: `POST /v1/knowledge-graph-design` (REST) and `POST /mcp/knowledge-graph-design` (MCP, tool `knowledge_graph_design`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `knowledge_graph_design`. Rate limits: 60/minute, 10,000/day per key per atom (429, body unrecorded in the battery). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, RC soak to 2026-11-22 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b); a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

The three examples below are the recorded battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T06:30:11.832261+00:00 against gateway v1.1.0, source `verification/work/knowledge-graph-design/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "schema_and_modeling",
      "check": "entities_relations_attributes_modeled",
      "status": "pass",
      "evidence": "model deliberately: entities, relations and attributes are modeled deliberately"
    },
    {
      "section": "schema_and_modeling",
      "check": "schema_changes_go_through_migrations",
      "status": "pass",
      "evidence": "model deliberately: schema changes go through migrations like a database"
    },
    {
      "section": "schema_and_modeling",
      "check": "migration_path_documented",
      "status": "pass",
      "evidence": "quality gate: schema and migration path are documented"
    },
    {
      "section": "schema_and_modeling",
      "check": "stable_ids_everywhere",
      "status": "pass",
      "evidence": "model deliberately: stable IDs everywhere"
    },
    {
      "section": "schema_and_modeling",
      "check": "core_type_count_within_stated_start_range",
      "status": "pass",
      "evidence": "model deliberately: the declared core type count starts small — the skill states 10-20 core types"
    },
    {
      "section": "provenance",
      "check": "provenance_on_every_assertion",
      "status": "pass",
      "evidence": "provenance: every assertion carries provenance — source, date and confidence"
    },
    {
      "section": "provenance",
      "check": "user_asserted_inferred_imported_distinguished",
      "status": "pass",
      "evidence": "provenance: user-asserted, inferred and imported facts are distinguished"
    },
    {
      "section": "provenance",
      "check": "assertions_declared",
      "status": "pass",
      "evidence": "the declared record names its assertions — the assertions list is present and non-empty"
    },
    {
      "section": "provenance",
      "check": "every_assertion_carries_full_provenance",
      "status": "pass",
      "evidence": "provenance: every declared assertion row declares source, date and confidence"
    },
    {
      "section": "provenance",
      "check": "every_assertion_origin_classified",
      "status": "pass",
      "evidence": "provenance: every declared assertion row declares its origin classified"
    },
    {
      "section": "immutable_history",
      "check": "append_only_event_log_is_source_of_truth",
      "status": "pass",
      "evidence": "immutable history: an append-only event log is the source of truth"
    },
    {
      "section": "immutable_history",
      "check": "current_state_is_projection",
      "status": "pass",
      "evidence": "immutable history: current state is a projection of the event log"
    },
    {
      "section": "immutable_history",
      "check": "corrections_are_new_events_referencing_old",
      "status": "pass",
      "evidence": "immutable history: corrections are new events referencing the old"
    },
    {
      "section": "immutable_history",
      "check": "no_silent_edits",
      "status": "pass",
      "evidence": "red line: no silent edits — append or version"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "storage_fit_selected",
      "status": "pass",
      "evidence": "storage fit: storage is selected to fit — SQLite/Postgres with an edges table for most needs, a dedicated graph DB only when query complexity or scale demands"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "graph_db_justified_when_dedicated_graph_db_used",
      "status": "pass",
      "evidence": "storage fit: a dedicated graph DB is justified by query complexity or scale when one is used"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "canonical_query_patterns_defined",
      "status": "pass",
      "evidence": "query and retrieval: canonical query patterns — neighborhoods, paths and temporal windows — are defined"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "retrieval_indexes_paired",
      "status": "pass",
      "evidence": "storage fit: full-text and vector indexes are paired for retrieval"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "agent_queries_bounded",
      "status": "pass",
      "evidence": "quality gate: agent queries are bounded"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "counts_first_expand_on_request",
      "status": "pass",
      "evidence": "query and retrieval: bounded answers for agents — counts first, expand on request (token-aware serialization)"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "no_full_graph_dumps",
      "status": "pass",
      "evidence": "query and retrieval: the graph is never dumped — bounded answers only"
    },
    {
      "section": "portability_and_ownership",
      "check": "export_import_formats_json_or_jsonld",
      "status": "pass",
      "evidence": "portability and ownership: export and import formats are simple JSON or JSON-LD"
    },
    {
      "section": "portability_and_ownership",
      "check": "export_import_round_trip_tested",
      "status": "pass",
      "evidence": "quality gate: export and import are tested round-trip"
    },
    {
      "section": "portability_and_ownership",
      "check": "versioned_snapshots",
      "status": "pass",
      "evidence": "portability and ownership: versioned snapshots are kept"
    },
    {
      "section": "portability_and_ownership",
      "check": "deletion_is_real",
      "status": "pass",
      "evidence": "red line: deletion is real — deletion must actually delete"
    },
    {
      "section": "portability_and_ownership",
      "check": "tombstones_where_required_addressed",
      "status": "pass",
      "evidence": "portability and ownership: tombstones where required are addressed alongside real deletion"
    },
    {
      "section": "privacy_and_red_lines",
      "check": "access_scoped",
      "status": "pass",
      "evidence": "quality gate: access is scoped — graphs reveal relationships"
    },
    {
      "section": "privacy_and_red_lines",
      "check": "encryption_at_rest",
      "status": "pass",
      "evidence": "privacy and encryption: the graph is encrypted at rest"
    },
    {
      "section": "privacy_and_red_lines",
      "check": "sensitive_nodes_redactable",
      "status": "pass",
      "evidence": "privacy and encryption: sensitive nodes are redactable"
    },
    {
      "section": "privacy_and_red_lines",
      "check": "no_third_party_personal_data_without_lawful_basis",
      "status": "pass",
      "evidence": "privacy and encryption: no third-party personal data is ingested without a lawful basis"
    },
    {
      "section": "privacy_and_red_lines",
      "check": "no_unprovenanced_assertions_presented_as_fact",
      "status": "pass",
      "evidence": "red line: no unprovenanced assertions are presented as fact"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "assertions_count": 1,
  "assertions_without_full_provenance": [],
  "provenance_coverage": "1.000000",
  "assertions_without_origin_classification": [],
  "origin_classification_coverage": "1.000000",
  "declared_core_type_count": 15,
  "summary": "31 pass, 0 fail, 0 missing of 31 checks across six sections.",
  "stamp": "KNOWLEDGE GRAPH DESIGN\ngraph: customer-360-graph\nVERDICT: KNOWLEDGE_GRAPH_DESIGN_SOUND\n  schema_and_modeling                  pass\n  provenance                           pass\n  immutable_history                    pass\n  storage_and_query_retrieval          pass\n  portability_and_ownership            pass\n  privacy_and_red_lines                pass\n31 pass, 0 fail, 0 missing of 31 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T06:30:11.832261+00:00 against gateway v1.1.0, source `verification/work/knowledge-graph-design/evidence.json`.

Input:

```json
{
  "graph": "customer-360-graph",
  "schema": {
    "entities_relations_attributes_modeled": true,
    "schema_changes_go_through_migrations": true,
    "migration_path_documented": true,
    "stable_ids_everywhere": true,
    "core_type_count": 5
  },
  "provenance": {
    "provenance_on_every_assertion": true,
    "user_asserted_inferred_imported_distinguished": true
  },
  "assertions": [
    {
      "name": "row_1",
      "source_declared": false,
      "date_declared": true,
      "confidence_declared": true,
      "origin_classified": true
    }
  ],
  "history": {
    "append_only_event_log_is_source_of_truth": true,
    "current_state_is_projection": true,
    "corrections_are_new_events_referencing_old": true,
    "silent_edits_present": true
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
    "full_graph_dumps_present": true
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

Response (HTTP 200):

```json
{
  "service": "knowledge-graph-design",
  "atom_version": "0.1.0",
  "graph": "customer-360-graph",
  "verdict": "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND",
  "sections": {
    "schema_and_modeling": "fail",
    "provenance": "fail",
    "immutable_history": "fail",
    "storage_and_query_retrieval": "fail",
    "portability_and_ownership": "pass",
    "privacy_and_red_lines": "pass"
  },
  "checks": [
    {
      "section": "schema_and_modeling",
      "check": "entities_relations_attributes_modeled",
      "status": "pass",
      "evidence": "model deliberately: entities, relations and attributes are modeled deliberately"
    },
    {
      "section": "schema_and_modeling",
      "check": "schema_changes_go_through_migrations",
      "status": "pass",
      "evidence": "model deliberately: schema changes go through migrations like a database"
    },
    {
      "section": "schema_and_modeling",
      "check": "migration_path_documented",
      "status": "pass",
      "evidence": "quality gate: schema and migration path are documented"
    },
    {
      "section": "schema_and_modeling",
      "check": "stable_ids_everywhere",
      "status": "pass",
      "evidence": "model deliberately: stable IDs everywhere"
    },
    {
      "section": "schema_and_modeling",
      "check": "core_type_count_within_stated_start_range",
      "status": "fail",
      "evidence": "model deliberately: the declared core type count starts small — the skill states 10-20 core types"
    },
    {
      "section": "provenance",
      "check": "provenance_on_every_assertion",
      "status": "pass",
      "evidence": "provenance: every assertion carries provenance — source, date and confidence"
    },
    {
      "section": "provenance",
      "check": "user_asserted_inferred_imported_distinguished",
      "status": "pass",
      "evidence": "provenance: user-asserted, inferred and imported facts are distinguished"
    },
    {
      "section": "provenance",
      "check": "assertions_declared",
      "status": "pass",
      "evidence": "the declared record names its assertions — the assertions list is present and non-empty"
    },
    {
      "section": "provenance",
      "check": "every_assertion_carries_full_provenance",
      "status": "fail",
      "evidence": "provenance: every declared assertion row declares source, date and confidence"
    },
    {
      "section": "provenance",
      "check": "every_assertion_origin_classified",
      "status": "pass",
      "evidence": "provenance: every declared assertion row declares its origin classified"
    },
    {
      "section": "immutable_history",
      "check": "append_only_event_log_is_source_of_truth",
      "status": "pass",
      "evidence": "immutable history: an append-only event log is the source of truth"
    },
    {
      "section": "immutable_history",
      "check": "current_state_is_projection",
      "status": "pass",
      "evidence": "immutable history: current state is a projection of the event log"
    },
    {
      "section": "immutable_history",
      "check": "corrections_are_new_events_referencing_old",
      "status": "pass",
      "evidence": "immutable history: corrections are new events referencing the old"
    },
    {
      "section": "immutable_history",
      "check": "no_silent_edits",
      "status": "fail",
      "evidence": "red line: no silent edits — append or version"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "storage_fit_selected",
      "status": "pass",
      "evidence": "storage fit: storage is selected to fit — SQLite/Postgres with an edges table for most needs, a dedicated graph DB only when query complexity or scale demands"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "graph_db_justified_when_dedicated_graph_db_used",
      "status": "pass",
      "evidence": "storage fit: a dedicated graph DB is justified by query complexity or scale when one is used"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "canonical_query_patterns_defined",
      "status": "pass",
      "evidence": "query and retrieval: canonical query patterns — neighborhoods, paths and temporal windows — are defined"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "retrieval_indexes_paired",
      "status": "pass",
      "evidence": "storage fit: full-text and vector indexes are paired for retrieval"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "agent_queries_bounded",
      "status": "pass",
      "evidence": "quality gate: agent queries are bounded"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "counts_first_expand_on_request",
      "status": "pass",
      "evidence": "query and retrieval: bounded answers for agents — counts first, expand on request (token-aware serialization)"
    },
    {
      "section": "storage_and_query_retrieval",
      "check": "no_full_graph_dumps",
      "status": "fail",
      "evidence": "query and retrieval: the graph is never dumped — bounded answers only"
    },
    {
      "section": "portability_and_ownership",
      "check": "export_import_formats_json_or_jsonld",
      "status": "pass",
      "evidence": "portability and ownership: export and import formats are simple JSON or JSON-LD"
    },
    {
      "section": "portability_and_ownership",
      "check": "export_import_round_trip_tested",
      "status": "pass",
      "evidence": "quality gate: export and import are tested round-trip"
    },
    {
      "section": "portability_and_ownership",
      "check": "versioned_snapshots",
      "status": "pass",
      "evidence": "portability and ownership: versioned snapshots are kept"
    },
    {
      "section": "portability_and_ownership",
      "check": "deletion_is_real",
      "status": "pass",
      "evidence": "red line: deletion is real — deletion must actually delete"
    },
    {
      "section": "portability_and_ownership",
      "check": "tombstones_where_required_addressed",
      "status": "pass",
      "evidence": "portability and ownership: tombstones where required are addressed alongside real deletion"
    },
    {
      "section": "privacy_and_red_lines",
      "check": "access_scoped",
      "status": "pass",
      "evidence": "quality gate: access is scoped — graphs reveal relationships"
    },
    {
      "section": "privacy_and_red_lines",
      "check": "encryption_at_rest",
      "status": "pass",
      "evidence": "privacy and encryption: the graph is encrypted at rest"
    },
    {
      "section": "privacy_and_red_lines",
      "check": "sensitive_nodes_redactable",
      "status": "pass",
      "evidence": "privacy and encryption: sensitive nodes are redactable"
    },
    {
      "section": "privacy_and_red_lines",
      "check": "no_third_party_personal_data_without_lawful_basis",
      "status": "pass",
      "evidence": "privacy and encryption: no third-party personal data is ingested without a lawful basis"
    },
    {
      "section": "privacy_and_red_lines",
      "check": "no_unprovenanced_assertions_presented_as_fact",
      "status": "pass",
      "evidence": "red line: no unprovenanced assertions are presented as fact"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "assertions_count": 1,
  "assertions_without_full_provenance": [
    "row_1"
  ],
  "provenance_coverage": "0.000000",
  "assertions_without_origin_classification": [],
  "origin_classification_coverage": "1.000000",
  "declared_core_type_count": 5,
  "summary": "27 pass, 4 fail, 0 missing of 31 checks across six sections.",
  "stamp": "KNOWLEDGE GRAPH DESIGN\ngraph: customer-360-graph\nVERDICT: KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND\n  schema_and_modeling                  fail\n  provenance                           fail\n  immutable_history                    fail\n  storage_and_query_retrieval          fail\n  portability_and_ownership            pass\n  privacy_and_red_lines                pass\n27 pass, 4 fail, 0 missing of 31 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T06:30:11.832261+00:00 against gateway v1.1.0, source `verification/work/knowledge-graph-design/evidence.json`.

Input:

```json
{
  "graph": "malformed-graph",
  "schema": {
    "core_type_count": "not-a-number"
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "schema.core_type_count",
  "detail": "schema.core_type_count must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared knowledge-graph design record; its verdict is a completeness and consistency judgment on declared evidence, not compliance or audit evidence and not a design certification, SERVICE.md expressly does not judge lawful-basis sufficiency, and knowledge-graph design is not a regulated domain. |
| Checks named | 31 documented / 31 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`), plus the secondary computed fields (`declared_core_type_count`, `assertions_count`, `assertions_without_full_provenance`, `assertions_without_origin_classification`, `provenance_coverage`, `origin_classification_coverage`) |
| Input reference typed | Yes — 45 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and marked as such |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/knowledge-graph-design/evidence.json` |
