import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/verified-place-shortlist.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  shortlist_title: "sunday-cafe-shortlist",
  constraints: { constraints_declared: true, area_declared: true,
                 visit_timing_declared: true, budget_constraint_declared: true,
                 noise_constraint_declared: true, parking_constraint_declared: true,
                 accessibility_needs_declared: true,
                 candidates_searched_within_declared_constraints: true,
                 only_real_named_results_kept: true },
  criteria: [
    { criterion_id: "crit-1", criterion_name: "Quiet enough to work" },
    { criterion_id: "crit-2", criterion_name: "Open Sunday morning" },
    { criterion_id: "crit-3", criterion_name: "Parking available" },
  ],
  places: [
    { place_id: "place-1", place_name: "North Hill Cafe",
      address: "101 10 Ave NW, Calgary, AB",
      address_verified_from_listing: true, existence_confirmed: true,
      hours_status: "same_day_verified",
      verification_method: "listing itself", verification_date: "2026-11-15",
      rating: 4.5, review_count: 320, recent_complaints_noted: true,
      photo_checked: true, special_hours_noted_where_shown: true,
      criterion_ids_met: ["crit-1", "crit-2", "crit-3"] },
    { place_id: "place-2", place_name: "Riverbend Coffee",
      address: "22 River Ave SE, Calgary, AB",
      address_verified_from_listing: true, existence_confirmed: true,
      hours_status: "flagged_unverified",
      verification_method: "listing itself", verification_date: "2026-11-15",
      rating: 4.2, review_count: 140, recent_complaints_noted: true,
      photo_checked: true, special_hours_noted_where_shown: true,
      criterion_ids_met: ["crit-1", "crit-2", "crit-3"] },
  ],
  evaluation: { rating_signals_read_critically: true,
                fit_checked_beyond_rating: true },
  ranking: { ranking_recorded: true, ranking_based_on_declared_criteria: true,
             winner_place_id: "place-1", winner_rationale_recorded: true,
             winner_drawback_recorded: true,
             winner_map_ready_address_declared: true,
             winner_hours_recorded: true,
             winner_booking_or_queue_warning_recorded: true,
             timing_matters: true, backup_place_id: "place-2" },
  handling: { hours_flagged_unverified_when_not_same_day_confirmed: true,
              listings_checked_for_staleness_duplication_and_closure: true,
              stale_duplicate_or_closed_listings_flagged: true,
              no_unconfirmed_place_used_to_fill_gap: true,
              original_area_has_no_verified_options: false,
              nearest_verified_area_offered: false },
  red_lines: { invented_address_hours_rating_or_photo_present: false,
               stale_hours_presented_as_current_fact_present: false,
               place_breaking_stated_constraint_recommended_present: false,
               ranking_by_rating_alone_present: false,
               unverified_listing_passed_as_confirmed_open_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "VERIFIED_PLACE_SHORTLIST_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 51);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.verified_places_count, 2);
  assert.equal(v.verified_place_criteria_count, 3);
  assert.deepEqual(v.duplicate_verified_place_ids, []);
  assert.deepEqual(v.duplicate_verified_place_addresses, []);
  assert.equal(v.verified_places_total_review_count, "460.000000");
  assert.equal(v.place_address_verification_ratio, "1.000000");
  assert.equal(v.place_hours_same_day_verified_ratio, "0.500000");
  assert.equal(v.place_criterion_coverage_ratio, "1.000000");
  assert.equal(v.place_rating_evidence_ratio, "1.000000");
});

test("test_constraints_not_declared_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.constraints.constraints_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "VERIFIED_PLACE_SHORTLIST_NOT_SOUND");
  assert.equal(v.sections["constraints_and_criteria"], "fail");
  assert.equal(checkStatus(v, "verified_place_shortlist_constraints_declared"), "fail");
});

test("test_duplicate_place_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.places[1].place_id = "place-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_verified_place_id_unique"), "fail");
  assert.deepEqual(v.duplicate_verified_place_ids, ["place-1"]);
});

test("test_duplicate_address_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.places[1].address = m.places[0].address;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_verified_place_address_unique"), "fail");
  assert.deepEqual(v.duplicate_verified_place_addresses, ["101 10 Ave NW, Calgary, AB"]);
});

test("test_single_place_fails_shortlist", () => {
  const m = clone(COMPLETE) as any;
  m.places = m.places.slice(0, 1);
  assert.equal(checkStatus(evaluate(m), "verified_place_shortlist_places_list_declared"), "fail");
});

test("test_absent_places_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.places;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "verified_place_shortlist_places_list_declared"), "missing");
  assert.equal(v.verified_places_count, null);
  assert.equal(v.computed_status, null);
});

test("test_unrecognised_hours_status_fails", () => {
  const m = clone(COMPLETE) as any;
  m.places[0].hours_status = "probably_open";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_verified_place_hours_status_recognised"), "fail");
  assert.deepEqual(v.verified_places_with_unrecognised_hours_status, ["place-1"]);
});

test("test_empty_address_fails", () => {
  const m = clone(COMPLETE) as any;
  m.places[1].address = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_verified_place_address_declared"), "fail");
  assert.deepEqual(v.verified_places_without_address, ["place-2"]);
});

test("test_address_not_verified_fails", () => {
  const m = clone(COMPLETE) as any;
  m.places[0].address_verified_from_listing = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_verified_place_address_verified_from_listing"), "fail");
  assert.equal(v.place_address_verification_ratio, "0.500000");
});

test("test_zero_review_count_fails", () => {
  const m = clone(COMPLETE) as any;
  m.places[0].review_count = 0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_verified_place_review_count_positive"), "fail");
  assert.deepEqual(v.verified_places_with_invalid_review_count, ["place-1"]);
});

test("test_negative_rating_fails", () => {
  const m = clone(COMPLETE) as any;
  m.places[1].rating = -1;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_verified_place_rating_declared"), "fail");
  assert.deepEqual(v.verified_places_with_invalid_rating, ["place-2"]);
});

test("test_place_missing_a_criterion_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.places[1].criterion_ids_met = ["crit-1", "crit-2"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_verified_place_meets_all_declared_criteria"), "fail");
  assert.deepEqual(v.verified_places_not_meeting_all_declared_criteria, ["place-2"]);
  assert.equal(v.place_criterion_coverage_ratio, "0.500000");
});

test("test_place_with_extra_criterion_fails", () => {
  const m = clone(COMPLETE) as any;
  m.places[0].criterion_ids_met = ["crit-1", "crit-2", "crit-3", "crit-9"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_verified_place_criterion_mapping_names_only_declared_criteria"), "fail");
  assert.deepEqual(v.verified_places_with_extra_criterion_ids, ["place-1"]);
});

test("test_missing_verification_date_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.places[0].verification_date;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_verified_place_verification_date_declared"), "missing");
});

test("test_winner_unknown_place_fails", () => {
  const m = clone(COMPLETE) as any;
  m.ranking.winner_place_id = "place-99";
  assert.equal(checkStatus(evaluate(m), "verified_place_shortlist_winner_resolves_to_declared_place"), "fail");
});

test("test_winner_not_highest_rated_still_passes", () => {
  const m = clone(COMPLETE) as any;
  m.ranking.winner_place_id = "place-2";
  m.ranking.backup_place_id = "place-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "verified_place_shortlist_winner_resolves_to_declared_place"), "pass");
  assert.equal(v.verdict, "VERIFIED_PLACE_SHORTLIST_SOUND");
});

test("test_backup_same_as_winner_fails_where_timing_matters", () => {
  const m = clone(COMPLETE) as any;
  m.ranking.backup_place_id = "place-1";
  assert.equal(checkStatus(evaluate(m), "verified_place_shortlist_backup_resolves_and_differs_where_timing_matters"), "fail");
});

test("test_no_timing_matters_passes_backup_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.ranking.timing_matters = false;
  delete m.ranking.backup_place_id;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "verified_place_shortlist_backup_resolves_and_differs_where_timing_matters"), "pass");
  assert.equal(v.verdict, "VERIFIED_PLACE_SHORTLIST_SOUND");
});

test("test_no_verified_options_without_nearest_area_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.handling.original_area_has_no_verified_options = true;
  m.handling.nearest_verified_area_offered = false;
  assert.equal(checkStatus(evaluate(m), "verified_place_shortlist_nearest_verified_area_offered_where_no_verified_options"), "fail");
});

test("test_verified_options_present_passes_gated_as_na", () => {
  assert.equal(checkStatus(evaluate(clone(COMPLETE)), "verified_place_shortlist_nearest_verified_area_offered_where_no_verified_options"), "pass");
});

test("test_special_hours_not_noted_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.places[0].special_hours_noted_where_shown = false;
  assert.equal(evaluate(m).sections["freshness_uncertainty_and_alternatives"], "fail");
});

test("test_invented_evidence_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.invented_address_hours_rating_or_photo_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "VERIFIED_PLACE_SHORTLIST_NOT_SOUND");
});

test("test_unverified_listing_passed_as_open_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unverified_listing_passed_as_confirmed_open_present = true;
  assert.equal(checkStatus(evaluate(m), "verified_place_shortlist_free_of_unverified_listing_passed_as_confirmed_open"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.handling;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["freshness_uncertainty_and_alternatives"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.verified_places_count, null);
  assert.equal(v.verified_places_total_review_count, null);
  assert.equal(v.place_criterion_coverage_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: VERIFIED_PLACE_SHORTLIST_SOUND"));
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
  m.shortlist_title = 12345;
  assert.throws(() => evaluate(m), fieldError("shortlist_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ constraints: "should-be-an-object" }), fieldError("constraints"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ places: { place_id: "place-1" } }), fieldError("places"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ criteria: ["crit-1"] }), fieldError("criteria[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.constraints.constraints_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("constraints.constraints_declared"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.places[0].rating = "4.5";
  assert.throws(() => evaluate(m), fieldError("places[0].rating"));
});

test("malformed: nested mapping entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.places[0].criterion_ids_met = [42];
  assert.throws(() => evaluate(m), fieldError("places[0].criterion_ids_met[0]"));
});

test("malformed: string list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.places[0].criterion_ids_met = "crit-1";
  assert.throws(() => evaluate(m), fieldError("places[0].criterion_ids_met"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.handling = null;
  assert.throws(() => evaluate(m), fieldError("handling"));
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
  .filter((f) => f.startsWith("verified-place-shortlist--") && f.endsWith(".json"))
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
