import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/knowledge-graph-design.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  graph: "research-notes",
  schema: { entities_relations_attributes_modeled: true,
            schema_changes_go_through_migrations: true,
            migration_path_documented: true,
            stable_ids_everywhere: true,
            core_type_count: 14 },
  provenance: { provenance_on_every_assertion: true,
                user_asserted_inferred_imported_distinguished: true },
  assertions: [
    { name: "paper-supports-claim", source_declared: true,
      date_declared: true, confidence_declared: true,
      origin_classified: true },
    { name: "author-works-at-lab", source_declared: true,
      date_declared: true, confidence_declared: true,
      origin_classified: true },
    { name: "note-links-project", source_declared: true,
      date_declared: true, confidence_declared: true,
      origin_classified: true },
  ],
  history: { append_only_event_log_is_source_of_truth: true,
             current_state_is_projection: true,
             corrections_are_new_events_referencing_old: true,
             silent_edits_present: false },
  storage: { storage_fit_selected: true,
             dedicated_graph_db_used: true,
             graph_db_justified_by_query_complexity_or_scale: true },
  query: { canonical_query_patterns_defined: true,
           full_text_and_vector_indexes_paired: true,
           agent_queries_bounded: true,
           counts_first_expand_on_request: true,
           full_graph_dumps_present: false },
  portability: { export_import_formats_json_or_jsonld: true,
                 export_import_round_trip_tested: true,
                 versioned_snapshots: true,
                 deletion_is_real: true,
                 tombstones_where_required_addressed: true },
  privacy: { access_scoped: true, encryption_at_rest: true,
             sensitive_nodes_redactable: true,
             third_party_personal_data_without_lawful_basis_present: false },
  red_lines: { unprovenanced_assertions_presented_as_fact_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "KNOWLEDGE_GRAPH_DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 31);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.assertions_count, 3);
  assert.deepEqual(v.assertions_without_full_provenance, []);
  assert.equal(v.provenance_coverage, "1.000000");
  assert.deepEqual(v.assertions_without_origin_classification, []);
  assert.equal(v.origin_classification_coverage, "1.000000");
  assert.equal(v.declared_core_type_count, 14);
});

test("test_unmodeled_schema_fails_schema_section", () => {
  const m = clone(COMPLETE) as any;
  m.schema.entities_relations_attributes_modeled = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND");
  assert.equal(v.sections["schema_and_modeling"], "fail");
});

test("test_core_type_count_above_stated_range_fails", () => {
  const m = clone(COMPLETE) as any;
  m.schema.core_type_count = 25;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "core_type_count_within_stated_start_range"), "fail");
  assert.equal(v.declared_core_type_count, 25);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_core_type_count_below_stated_range_fails", () => {
  const m = clone(COMPLETE) as any;
  m.schema.core_type_count = 9;
  assert.equal(checkStatus(evaluate(m), "core_type_count_within_stated_start_range"), "fail");
});

test("test_core_type_count_at_stated_bounds_passes", () => {
  for (const count of [10, 20]) {
    const m = clone(COMPLETE) as any;
    m.schema.core_type_count = count;
    assert.equal(checkStatus(evaluate(m), "core_type_count_within_stated_start_range"), "pass");
  }
});

test("test_core_type_count_missing_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.schema.core_type_count;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.declared_core_type_count, null);
  assert.equal(v.computed_status, null);
});

test("test_no_stable_ids_fails", () => {
  const m = clone(COMPLETE) as any;
  m.schema.stable_ids_everywhere = false;
  assert.equal(evaluate(m).verdict, "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND");
});

test("test_assertion_without_source_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.assertions[0].source_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "every_assertion_carries_full_provenance"), "fail");
  assert.deepEqual(v.assertions_without_full_provenance, ["paper-supports-claim"]);
  assert.equal(v.provenance_coverage, "0.666667");
});

test("test_assertion_missing_provenance_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.assertions[1].date_declared;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_assertion_carries_full_provenance"), "missing");
  assert.deepEqual(v.assertions_without_full_provenance, []);
});

test("test_assertion_without_origin_classification_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.assertions[2].origin_classified = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_assertion_origin_classified"), "fail");
  assert.deepEqual(v.assertions_without_origin_classification, ["note-links-project"]);
  assert.equal(v.origin_classification_coverage, "0.666667");
});

test("test_empty_assertions_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.assertions = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "assertions_declared"), "fail");
  assert.equal(v.assertions_count, 0);
  assert.equal(v.provenance_coverage, null);
  assert.equal(v.origin_classification_coverage, null);
});

test("test_silent_edits_fail_history_as_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.history.silent_edits_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_silent_edits"), "fail");
  assert.equal(v.sections["immutable_history"], "fail");
});

test("test_mutable_history_fails", () => {
  const m = clone(COMPLETE) as any;
  m.history.append_only_event_log_is_source_of_truth = false;
  assert.equal(evaluate(m).verdict, "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND");
});

test("test_graph_db_without_justification_fails", () => {
  const m = clone(COMPLETE) as any;
  m.storage.graph_db_justified_by_query_complexity_or_scale = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "graph_db_justified_when_dedicated_graph_db_used"), "fail");
});

test("test_no_dedicated_graph_db_passes_justification_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.storage = { storage_fit_selected: true, dedicated_graph_db_used: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "KNOWLEDGE_GRAPH_DESIGN_SOUND");
  assert.equal(checkStatus(v, "graph_db_justified_when_dedicated_graph_db_used"), "pass");
});

test("test_graph_db_target_missing_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.storage.graph_db_justified_by_query_complexity_or_scale;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "graph_db_justified_when_dedicated_graph_db_used"), "missing");
});

test("test_unbounded_agent_queries_fail", () => {
  const m = clone(COMPLETE) as any;
  m.query.agent_queries_bounded = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND");
  assert.equal(v.sections["storage_and_query_retrieval"], "fail");
});

test("test_full_graph_dumps_fail", () => {
  const m = clone(COMPLETE) as any;
  m.query.full_graph_dumps_present = true;
  assert.equal(checkStatus(evaluate(m), "no_full_graph_dumps"), "fail");
});

test("test_round_trip_not_tested_fails_portability", () => {
  const m = clone(COMPLETE) as any;
  m.portability.export_import_round_trip_tested = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND");
  assert.equal(v.sections["portability_and_ownership"], "fail");
});

test("test_deletion_not_real_fails_as_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.portability.deletion_is_real = false;
  assert.equal(checkStatus(evaluate(m), "deletion_is_real"), "fail");
});

test("test_unscoped_access_fails_privacy", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.access_scoped = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND");
  assert.equal(v.sections["privacy_and_red_lines"], "fail");
});

test("test_third_party_personal_data_without_basis_fails", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.third_party_personal_data_without_lawful_basis_present = true;
  assert.equal(checkStatus(evaluate(m), "no_third_party_personal_data_without_lawful_basis"), "fail");
});

test("test_unprovenanced_assertions_as_fact_fail_as_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unprovenanced_assertions_presented_as_fact_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unprovenanced_assertions_presented_as_fact"), "fail");
  assert.equal(v.sections["privacy_and_red_lines"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.history;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["immutable_history"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.assertions_count, null);
  assert.equal(v.assertions_without_full_provenance, null);
  assert.equal(v.provenance_coverage, null);
  assert.equal(v.assertions_without_origin_classification, null);
  assert.equal(v.origin_classification_coverage, null);
  assert.equal(v.declared_core_type_count, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: KNOWLEDGE_GRAPH_DESIGN_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.graph = 12345;
  assert.throws(() => evaluate(m), fieldError("graph"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ schema: "should-be-an-object" }), fieldError("schema"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ assertions: { name: "paper-supports-claim" } }), fieldError("assertions"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ assertions: ["paper-supports-claim"] }), fieldError("assertions[0]"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.schema.core_type_count = "fourteen";
  assert.throws(() => evaluate(m), fieldError("schema.core_type_count"));
});

test("malformed: number leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.schema.core_type_count = true;
  assert.throws(() => evaluate(m), fieldError("schema.core_type_count"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.schema.stable_ids_everywhere = "yes";
  assert.throws(() => evaluate(m), fieldError("schema.stable_ids_everywhere"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.assertions[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("assertions[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.assertions[1].origin_classified = "yes";
  assert.throws(() => evaluate(m), fieldError("assertions[1].origin_classified"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.privacy = null;
  assert.throws(() => evaluate(m), fieldError("privacy"));
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture {
  name: string;
  manifest: unknown;
  expected: unknown;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("knowledge-graph-design--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
