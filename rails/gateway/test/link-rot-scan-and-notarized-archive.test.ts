import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/link-rot-scan-and-notarized-archive.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
function link(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "L1",
    url: "https://example.org/paper",
    is_published_citation: true,
    observed_status: "ok",
    archived: true,
    capture_hash_present: true,
    capture_timestamp_present: true,
    capture_at_cite_time: true,
    canonicalized: true,
    stable_id_present: true,
    content_hash: "sha256:aaa",
    canonical_url: "https://example.org/paper",
    notarized: true,
    repair_action: "none_needed",
    repair_logged: true,
    ...overrides,
  };
}

const SOUND: Record<string, unknown> = {
  site: "docs.example.org",
  scan: {
    scans_scheduled: true,
    scan_records_status: true,
    scan_records_content_hash: true,
    dashboard_lists_rot_with_owners: true,
    last_scan_within_cadence: true,
  },
  links: [
    link(),
    link({
      id: "L2", url: "https://example.org/old-post",
      observed_status: "dead", content_hash: "sha256:bbb",
      canonical_url: "https://example.org/old-post",
      repair_action: "archived_copy",
    }),
    link({
      id: "L3", url: "https://example.org/draft",
      is_published_citation: false, content_hash: "sha256:ccc",
      canonical_url: "https://example.org/draft",
    }),
  ],
  archive: {
    capture_format_warc_or_singlefile: true,
    fallback_chain_configured: true,
  },
  canonicalization: {
    tracker_params_stripped: true,
    redirects_resolved: true,
    dedupe_by_content_hash: true,
  },
  notarization: {
    hash_algorithm_sha256: true,
    timestamp_source: "rfc3161_tsa",
    evidence_bundle_complete: true,
    tool_versions_recorded: true,
    verification_recipe_published: true,
  },
  serving: {
    as_seen_views_available: true,
    live_vs_archive_diff_available: true,
    provenance_badge_shows_capture_date: true,
    provenance_badge_shows_verification_status: true,
    archived_presented_as_current: false,
    authorship_preserved: true,
  },
  repair: {
    repairs_logged: true,
    silent_drops_made: false,
  },
  compliance: {
    robots_and_tos_honored: true,
    rate_limits_respected: true,
    access_controls_bypassed: false,
    fabricated_captures_present: false,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 27 Python VerdictTests, ported ----

test("test_sound_manifest_is_link_integrity_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "LINK_INTEGRITY_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 33);
  assert.equal(v.links_evaluated, 3);
  assert.equal(v.citations_total, 2);
  assert.equal(v.rotted_citations, 1);
  assert.equal(v.unarchived_citations, 0);
});

test("test_unarchived_citation_fails", () => {
  const m = clone(SOUND) as any;
  m.links[0].archived = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_UNSOUND");
  assert.equal(v.sections["archive_capture"], "fail");
  assert.equal(v.unarchived_citations, 1);
});

test("test_citation_without_capture_hash_fails", () => {
  const m = clone(SOUND) as any;
  m.links[0].capture_hash_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_UNSOUND");
  assert.equal(v.unarchived_citations, 1);
});

test("test_capture_not_at_cite_time_fails", () => {
  const m = clone(SOUND) as any;
  m.links[0].capture_at_cite_time = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_UNSOUND");
  assert.equal(v.sections["archive_capture"], "fail");
});

test("test_non_citation_unarchived_does_not_fail_archive_gate", () => {
  const m = clone(SOUND) as any;
  m.links[2].archived = false;
  m.links[2].capture_hash_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_SOUND");
  assert.equal(v.unarchived_citations, 0);
});

test("test_rotted_citation_without_repair_fails", () => {
  const m = clone(SOUND) as any;
  m.links[1].repair_action = "none";
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_UNSOUND");
  assert.equal(v.sections["repair_and_compliance"], "fail");
});

test("test_rotted_citation_with_unlogged_repair_fails", () => {
  const m = clone(SOUND) as any;
  m.links[1].repair_logged = false;
  assert.equal(evaluate(m).verdict, "LINK_INTEGRITY_UNSOUND");
});

test("test_rotted_citation_with_removal_note_passes", () => {
  const m = clone(SOUND) as any;
  m.links[1].repair_action = "removal_note";
  assert.equal(evaluate(m).verdict, "LINK_INTEGRITY_SOUND");
});

test("test_paywalled_citation_is_not_rotted", () => {
  const m = clone(SOUND) as any;
  m.links[0].observed_status = "paywalled";
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_SOUND");
  assert.equal(v.rotted_citations, 1);
});

test("test_duplicate_content_with_two_canonicals_fails", () => {
  const m = clone(SOUND) as any;
  m.links[2].content_hash = "sha256:aaa";
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_UNSOUND");
  assert.equal(v.sections["canonicalization"], "fail");
});

test("test_link_without_stable_id_fails", () => {
  const m = clone(SOUND) as any;
  m.links[0].stable_id_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_UNSOUND");
  assert.equal(v.sections["canonicalization"], "fail");
});

test("test_unnotarized_citation_fails", () => {
  const m = clone(SOUND) as any;
  m.links[0].notarized = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_UNSOUND");
  assert.equal(v.sections["notarization"], "fail");
});

test("test_timestamp_source_none_fails", () => {
  const m = clone(SOUND) as any;
  m.notarization.timestamp_source = "none";
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_UNSOUND");
  assert.equal(v.sections["notarization"], "fail");
});

test("test_transparency_log_timestamp_passes", () => {
  const m = clone(SOUND) as any;
  m.notarization.timestamp_source = "transparency_log";
  assert.equal(evaluate(m).verdict, "LINK_INTEGRITY_SOUND");
});

test("test_archived_presented_as_current_fails", () => {
  const m = clone(SOUND) as any;
  m.serving.archived_presented_as_current = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_UNSOUND");
  assert.equal(v.sections["honest_serving"], "fail");
});

test("test_provenance_badge_missing_status_fails", () => {
  const m = clone(SOUND) as any;
  m.serving.provenance_badge_shows_verification_status = false;
  assert.equal(evaluate(m).verdict, "LINK_INTEGRITY_UNSOUND");
});

test("test_silent_drop_fails", () => {
  const m = clone(SOUND) as any;
  m.repair.silent_drops_made = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_UNSOUND");
  assert.equal(v.sections["repair_and_compliance"], "fail");
});

test("test_fabricated_captures_fail", () => {
  const m = clone(SOUND) as any;
  m.compliance.fabricated_captures_present = true;
  assert.equal(evaluate(m).verdict, "LINK_INTEGRITY_UNSOUND");
});

test("test_access_control_bypass_fails", () => {
  const m = clone(SOUND) as any;
  m.compliance.access_controls_bypassed = true;
  assert.equal(evaluate(m).verdict, "LINK_INTEGRITY_UNSOUND");
});

test("test_scans_not_scheduled_fails", () => {
  const m = clone(SOUND) as any;
  m.scan.scans_scheduled = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LINK_INTEGRITY_UNSOUND");
  assert.equal(v.sections["scan_coverage"], "fail");
});

test("test_link_missing_field_is_insufficient_evidence", () => {
  const m = clone(SOUND) as any;
  delete m.links[0].content_hash;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.links_evaluated, 2);
});

test("test_link_with_unknown_status_is_insufficient_evidence", () => {
  const m = clone(SOUND) as any;
  m.links[0].observed_status = "redirected";
  assert.equal(evaluate(m).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.notarization;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["notarization"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.links_evaluated, 0);
});

test("test_no_links_declared_is_insufficient_evidence", () => {
  const m = clone(SOUND) as any;
  delete m.links;
  assert.equal(evaluate(m).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(
    stamp(evaluate(clone(SOUND))).includes("VERDICT: LINK_INTEGRITY_SOUND"),
  );
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types (external verification
// Wave 1) — the Python MalformedTypeTests, ported. A documented
// field present with the wrong JSON type raises FieldTypeError
// naming the field — never a verdict over garbage.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: recorded external case rejected", () => {
  assert.throws(
    () => evaluate({ site: "malformed_test", scan: "not_an_object" }),
    fieldError("scan"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ scan: "not_an_object" }),
    fieldError("scan"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.scan.scans_scheduled = "yes";
  assert.throws(() => evaluate(m), fieldError("scan.scans_scheduled"));
});

test("malformed: list field as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.links = "not-a-list";
  assert.throws(() => evaluate(m), fieldError("links"));
});

test("malformed: list entry field as number rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.links[0].observed_status = 404;
  assert.throws(() => evaluate(m), fieldError("links[0].observed_status"));
});

test("malformed: list entry as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.links[0] = "not-an-object";
  assert.throws(() => evaluate(m), fieldError("links[0]"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.notarization = null;
  assert.throws(() => evaluate(m), fieldError("notarization"));
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
  .filter((f) => f.startsWith("link-rot-scan-and-notarized-archive--") && f.endsWith(".json"))
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
