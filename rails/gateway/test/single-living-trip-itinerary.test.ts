import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/single-living-trip-itinerary.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  trip_title: "family-mumbai-2027",
  header: { purpose: "Family visit and wedding in Mumbai",
            travellers: "Two adults and one child",
            trip_start_date: "2027-02-10",
            trip_end_date: "2027-02-20",
            single_itinerary_maintained: true },
  constraints: { entry_checked_before_routing: true,
                 transit_checked_before_routing: true,
                 passport_validity_checked: true,
                 visa_needs_checked: true,
                 baggage_rules_checked: true,
                 connection_minimums_checked: true },
  entries: [
    { entry_id: "outbound-flight", kind: "flight", state: "booked",
      start_date: "2027-02-10", end_date: "2027-02-11", origin: "ORD",
      destination: "BOM", total_amount: 1200,
      price_timestamp: "2027-01-05T10:00:00Z",
      booking_reference: "UA-REF-1", terms_recorded: true },
    { entry_id: "airport-transfer", kind: "ground_transport", state: "held",
      start_date: "2027-02-11", end_date: "2027-02-11", origin: "BOM",
      destination: "BOM", total_amount: 40,
      price_timestamp: "2027-01-06T09:00:00Z",
      held_expiry_or_timestamp: "2027-01-20T00:00:00Z" },
    { entry_id: "mumbai-stay", kind: "stay", state: "booked",
      start_date: "2027-02-11", end_date: "2027-02-18", total_amount: 800,
      price_timestamp: "2027-01-05T11:00:00Z",
      booking_reference: "HTL-REF-2", terms_recorded: true },
    { entry_id: "gateway-day-out", kind: "activity", state: "idea",
      start_date: "2027-02-14", end_date: "2027-02-14" },
    { entry_id: "return-transfer", kind: "ground_transport", state: "held",
      start_date: "2027-02-18", end_date: "2027-02-18", origin: "BOM",
      destination: "BOM",
      held_expiry_or_timestamp: "2027-01-20T00:00:00Z" },
    { entry_id: "return-flight", kind: "flight", state: "booked",
      start_date: "2027-02-19", end_date: "2027-02-20", origin: "BOM",
      destination: "ORD", total_amount: 1100,
      price_timestamp: "2027-01-05T10:30:00Z",
      booking_reference: "UA-REF-3", terms_recorded: true },
  ],
  skeleton: { outbound_laid: true, stays_laid: true,
              internal_moves_laid_or_none_needed: true, return_laid: true },
  totals: { declared_booked_total: 3100 },
  conflicts: { scanned_early: true, tight_connections_flagged: true,
               arrival_after_checkin_flagged: true,
               clashing_plans_flagged: true,
               conflicts_name_pieces_and_cost: true },
  readiness: { full_readthrough_completed: true, documents_checked: true,
               times_with_timezones_checked: true, contacts_checked: true,
               gaps_checked: true },
  red_lines: { date_change_suggested_present: false,
               idea_or_quote_presented_as_booking_present: false,
               invented_facts_present: false,
               routing_before_constraints_checked_present: false,
               unauthorized_booking_or_payment_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "SINGLE_LIVING_TRIP_ITINERARY_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 45);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.entries_count, 6);
  assert.equal(v.booked_entries_count, 3);
  assert.equal(v.computed_booked_total, "3100.000000");
  assert.equal(v.booked_total_difference, "0.000000");
  assert.deepEqual(v.duplicate_itinerary_entry_ids, []);
  assert.deepEqual(v.itinerary_entry_ids_without_valid_state, []);
  assert.deepEqual(v.movement_leg_break_entry_ids, []);
  assert.deepEqual(v.entries_out_of_date_order, []);
  assert.deepEqual(v.entries_ending_before_start, []);
  assert.deepEqual(v.entries_outside_trip_window, []);
});

test("test_empty_entries_list_is_a_valid_declaration", () => {
  const m = clone(COMPLETE) as any;
  m.entries = [];
  m.totals.declared_booked_total = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "SINGLE_LIVING_TRIP_ITINERARY_READY");
  assert.equal(v.entries_count, 0);
  assert.equal(v.computed_booked_total, "0.000000");
  assert.equal(checkStatus(v, "itinerary_entries_declared"), "pass");
  assert.equal(checkStatus(v, "every_itinerary_entry_labelled_with_valid_state"), "pass");
});

test("test_missing_purpose_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.header.purpose;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "trip_purpose_stated_in_header"), "missing");
});

test("test_reversed_trip_window_fails", () => {
  const m = clone(COMPLETE) as any;
  m.header.trip_start_date = "2027-02-20";
  m.header.trip_end_date = "2027-02-10";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "trip_window_start_not_after_end"), "fail");
  assert.equal(v.verdict, "SINGLE_LIVING_TRIP_ITINERARY_NOT_READY");
});

test("test_second_itinerary_fails_single_itinerary_check", () => {
  const m = clone(COMPLETE) as any;
  m.header.single_itinerary_maintained = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "single_living_itinerary_maintained"), "fail");
  assert.equal(v.sections["trip_header"], "fail");
});

test("test_constraints_not_checked_before_routing_fails", () => {
  const m = clone(COMPLETE) as any;
  m.constraints.entry_checked_before_routing = false;
  const v = evaluate(m);
  assert.equal(v.sections["entry_and_transit_constraints"], "fail");
  assert.equal(checkStatus(v, "entry_constraints_checked_before_routing_choices"), "fail");
});

test("test_invalid_entry_state_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.entries[3].state = "maybe";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_itinerary_entry_labelled_with_valid_state"), "fail");
  assert.deepEqual(v.itinerary_entry_ids_without_valid_state, ["gateway-day-out"]);
});

test("test_entry_missing_state_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.entries[3].state;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_itinerary_entry_labelled_with_valid_state"), "missing");
});

test("test_duplicate_entry_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.entries[1].entry_id = "outbound-flight";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_itinerary_entry_id_duplicated"), "fail");
  assert.deepEqual(v.duplicate_itinerary_entry_ids, ["outbound-flight"]);
});

test("test_booked_entry_without_reference_fails", () => {
  const m = clone(COMPLETE) as any;
  m.entries[0].booking_reference = "";
  assert.equal(checkStatus(evaluate(m), "every_booked_entry_carries_booking_reference"), "fail");
});

test("test_booked_entry_missing_reference_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.entries[0].booking_reference;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_booked_entry_carries_booking_reference"), "missing");
});

test("test_booked_entry_without_terms_fails", () => {
  const m = clone(COMPLETE) as any;
  m.entries[2].terms_recorded = false;
  assert.equal(checkStatus(evaluate(m), "every_booked_entry_records_its_terms"), "fail");
});

test("test_held_entry_without_expiry_fails", () => {
  const m = clone(COMPLETE) as any;
  m.entries[1].held_expiry_or_timestamp = "";
  assert.equal(checkStatus(evaluate(m), "every_held_entry_states_expiry_or_timestamp"), "fail");
});

test("test_idea_entry_with_booking_reference_fails", () => {
  const m = clone(COMPLETE) as any;
  m.entries[3].booking_reference = "FAKE-REF";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_idea_entry_free_of_booking_reference"), "fail");
  assert.equal(v.sections["entry_states_and_totals"], "fail");
});

test("test_priced_entry_without_timestamp_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.entries[0].price_timestamp;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_priced_itinerary_entry_carries_price_timestamp"), "missing");
});

test("test_declared_booked_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_booked_total = 3000;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "declared_booked_total_matches_sum_of_booked_entry_totals"), "fail");
  assert.equal(v.booked_total_difference, "-100.000000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_absent_entries_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.entries;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "itinerary_entries_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.entries_count, null);
  assert.equal(v.computed_booked_total, null);
  assert.equal(v.duplicate_itinerary_entry_ids, null);
});

test("test_out_of_order_entries_fail_and_are_named", () => {
  const m = clone(COMPLETE) as any;
  m.entries[3].start_date = "2027-02-12";
  m.entries[3].end_date = "2027-02-12";
  m.entries[1].start_date = "2027-02-09";
  m.entries[1].end_date = "2027-02-09";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "itinerary_entries_in_declared_date_order"), "fail");
  assert.deepEqual(v.entries_out_of_date_order, ["airport-transfer"]);
});

test("test_entry_ending_before_start_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.entries[3].end_date = "2027-02-13";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_itinerary_entry_ends_before_it_starts"), "fail");
  assert.deepEqual(v.entries_ending_before_start, ["gateway-day-out"]);
});

test("test_entry_outside_trip_window_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.entries[5].end_date = "2027-02-21";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_itinerary_entry_within_trip_window"), "fail");
  assert.deepEqual(v.entries_outside_trip_window, ["return-flight"]);
});

test("test_disconnected_movement_leg_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.entries[5].origin = "DEL";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "declared_movement_legs_connect_in_sequence"), "fail");
  assert.deepEqual(v.movement_leg_break_entry_ids, ["return-flight"]);
});

test("test_skeleton_return_missing_fails", () => {
  const m = clone(COMPLETE) as any;
  m.skeleton.return_laid = false;
  assert.equal(evaluate(m).sections["skeleton_and_ordering"], "fail");
});

test("test_unflagged_tight_connections_fail", () => {
  const m = clone(COMPLETE) as any;
  m.conflicts.tight_connections_flagged = false;
  const v = evaluate(m);
  assert.equal(v.sections["conflicts_flagged"], "fail");
  assert.equal(checkStatus(v, "tight_connections_flagged_in_itinerary"), "fail");
});

test("test_readthrough_not_completed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.readiness.full_readthrough_completed = false;
  assert.equal(evaluate(m).sections["predeparture_readthrough"], "fail");
});

test("test_date_change_suggested_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.date_change_suggested_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_trip_date_change_suggested_in_itinerary"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_idea_presented_as_booking_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.idea_or_quote_presented_as_booking_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_idea_or_held_quote_presented_as_booking"), "fail");
  assert.equal(v.verdict, "SINGLE_LIVING_TRIP_ITINERARY_NOT_READY");
});

test("test_unauthorized_booking_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unauthorized_booking_or_payment_present = true;
  assert.equal(checkStatus(evaluate(m), "no_booking_or_payment_without_traveller_authorization"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.conflicts;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["conflicts_flagged"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.entries_count, null);
  assert.equal(v.booked_entries_count, null);
  assert.equal(v.computed_booked_total, null);
  assert.equal(v.booked_total_difference, null);
  assert.equal(v.duplicate_itinerary_entry_ids, null);
  assert.equal(v.movement_leg_break_entry_ids, null);
  assert.equal(v.entries_outside_trip_window, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: SINGLE_LIVING_TRIP_ITINERARY_READY"));
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
  m.trip_title = 12345;
  assert.throws(() => evaluate(m), fieldError("trip_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ header: "should-be-an-object" }), fieldError("header"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ entries: { entry_id: "x" } }), fieldError("entries"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ entries: ["x"] }), fieldError("entries[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.readiness.documents_checked = "yes";
  assert.throws(() => evaluate(m), fieldError("readiness.documents_checked"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_booked_total = "3100";
  assert.throws(() => evaluate(m), fieldError("totals.declared_booked_total"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.entries[0].entry_id = 42;
  assert.throws(() => evaluate(m), fieldError("entries[0].entry_id"));
});

test("malformed: nested list entry number field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.entries[1].total_amount = "40";
  assert.throws(() => evaluate(m), fieldError("entries[1].total_amount"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.conflicts = null;
  assert.throws(() => evaluate(m), fieldError("conflicts"));
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
  .filter((f) => f.startsWith("single-living-trip-itinerary--") && f.endsWith(".json"))
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
