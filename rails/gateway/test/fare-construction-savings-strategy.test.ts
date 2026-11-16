import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/fare-construction-savings-strategy.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY manifest, copied
// from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  trip_label: "Calgary to Mumbai, December",
  trip: {
    origin: "Calgary",
    destination: "Mumbai",
    travel_dates: "2026-12-10 to 2026-12-20",
    flexibility: "plus or minus 3 days",
  },
  drivers: {
    advance_purchase_explained: true,
    day_of_week_explained: true,
    nearby_airports_considered: true,
    split_tickets_considered: true,
  },
  strategy: {
    search_strategy_given: true,
    price_only_without_strategy: false,
  },
  total_cost: {
    headline_fare: 800,
    fees: 120,
    baggage_fees: 75,
    seat_fees: 45,
    declared_total_cost: 1040,
    total_cost_surfaced: true,
    headline_presented_as_total_cost: false,
  },
  construction: {
    legs: [
      { label: "leg_1_calgary_toronto", price: 300 },
      { label: "leg_2_toronto_mumbai", price: 450 },
    ],
    declared_constructed_total: 750,
    baseline_direct_fare: 900,
    declared_savings: 150,
    constructed_option_compared_to_direct: true,
  },
  integrity: {
    prices_invented: false,
    quoted_fare_presented_as_starting_point: true,
    recheck_before_booking_advised: true,
    uncheckable_items_disclosed: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 21);
  assert.equal(v.legs_evaluated, 2);
  assert.equal(v.computed_constructed_total, "750.000000");
  assert.equal(v.constructed_total_difference, "0.000000");
  assert.equal(v.computed_total_cost, "1040.000000");
  assert.equal(v.total_cost_difference, "0.000000");
  assert.equal(v.computed_savings, "150.000000");
  assert.equal(v.savings_difference, "0.000000");
});

test("test_total_cost_at_other_values_passes", () => {
  const m = clone(COMPLETE) as any;
  Object.assign(m.total_cost, {
    headline_fare: 500, fees: 50, baggage_fees: 0, seat_fees: 25,
    declared_total_cost: 575,
  });
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY");
  assert.equal(v.computed_total_cost, "575.000000");
});

test("test_total_cost_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.total_cost.declared_total_cost = 1000;
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
  assert.equal(v.sections["total_cost_surface"], "fail");
  assert.equal(
    checkStatus(v, "total_cost_matches_headline_plus_fees_bags_seats"),
    "fail");
  assert.equal(v.total_cost_difference, "-40.000000");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_missing_total_cost_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.total_cost.baggage_fees;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_total_cost, null);
  assert.equal(v.total_cost_difference, null);
  assert.equal(v.computed_status, null);
});

test("test_headline_presented_as_total_fails", () => {
  const m = clone(COMPLETE) as any;
  m.total_cost.headline_presented_as_total_cost = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
  assert.equal(
    checkStatus(v, "headline_not_presented_as_total_cost"), "fail");
});

test("test_total_cost_not_surfaced_fails", () => {
  const m = clone(COMPLETE) as any;
  m.total_cost.total_cost_surfaced = false;
  assert.equal(evaluate(m).verdict,
    "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
});

test("test_constructed_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.construction.declared_constructed_total = 700;
  m.construction.declared_savings = 200;
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
  assert.equal(
    checkStatus(v, "constructed_total_matches_sum_of_leg_prices"), "fail");
  assert.equal(v.constructed_total_difference, "-50.000000");
  assert.equal(v.computed_savings, "200.000000");
});

test("test_savings_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.construction.declared_savings = 100;
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
  assert.equal(
    checkStatus(v,
      "declared_savings_matches_baseline_minus_constructed_total"),
    "fail");
  assert.equal(v.savings_difference, "-50.000000");
});

test("test_savings_at_other_values_passes", () => {
  const m = clone(COMPLETE) as any;
  m.construction.baseline_direct_fare = 1000;
  m.construction.declared_savings = 250;
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY");
  assert.equal(v.computed_savings, "250.000000");
});

test("test_missing_savings_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.construction.baseline_direct_fare;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_savings, null);
  assert.equal(v.computed_constructed_total, "750.000000");
});

test("test_missing_legs_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.construction.legs;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "construction_legs_complete"), "missing");
  assert.equal(v.legs_evaluated, 0);
  assert.equal(v.computed_constructed_total, null);
  assert.equal(v.computed_savings, "150.000000");
});

test("test_empty_legs_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  m.construction.legs = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "constructed_total_matches_sum_of_leg_prices"),
    "missing");
});

test("test_incomplete_leg_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.construction.legs[1].price;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "construction_legs_complete"), "missing");
  assert.equal(v.legs_evaluated, 1);
  assert.equal(v.computed_constructed_total, null);
});

test("test_missing_declared_constructed_total_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.construction.declared_constructed_total;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "constructed_total_matches_sum_of_leg_prices"),
    "missing");
  assert.equal(v.computed_constructed_total, "750.000000");
  assert.equal(v.constructed_total_difference, null);
});

test("test_single_leg_construction_passes", () => {
  const m = clone(COMPLETE) as any;
  m.construction.legs = [{ label: "only_leg", price: 750 }];
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY");
  assert.equal(v.legs_evaluated, 1);
});

test("test_origin_missing_is_insufficient", () => {
  const m = clone(COMPLETE) as any;
  delete m.trip.origin;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["trip_definition"], "insufficient_evidence");
});

test("test_empty_destination_string_fails", () => {
  const m = clone(COMPLETE) as any;
  m.trip.destination = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
  assert.equal(checkStatus(v, "destination_declared"), "fail");
});

test("test_flexibility_not_declared_section_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.trip;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["trip_definition"], "insufficient_evidence");
});

test("test_advance_purchase_not_explained_fails", () => {
  const m = clone(COMPLETE) as any;
  m.drivers.advance_purchase_explained = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
  assert.equal(v.sections["fare_drivers_explained"], "fail");
});

test("test_nearby_airports_not_considered_fails", () => {
  const m = clone(COMPLETE) as any;
  m.drivers.nearby_airports_considered = false;
  assert.equal(evaluate(m).verdict,
    "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
});

test("test_price_only_without_strategy_fails", () => {
  const m = clone(COMPLETE) as any;
  m.strategy.price_only_without_strategy = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
  assert.equal(v.sections["search_strategy"], "fail");
  assert.equal(
    checkStatus(v, "not_price_only_without_strategy"), "fail");
});

test("test_search_strategy_not_given_fails", () => {
  const m = clone(COMPLETE) as any;
  m.strategy.search_strategy_given = false;
  assert.equal(evaluate(m).verdict,
    "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
});

test("test_prices_invented_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.integrity.prices_invented = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
  assert.equal(v.sections["price_integrity"], "fail");
  assert.equal(checkStatus(v, "prices_not_invented"), "fail");
});

test("test_recheck_not_advised_fails", () => {
  const m = clone(COMPLETE) as any;
  m.integrity.recheck_before_booking_advised = false;
  assert.equal(evaluate(m).verdict,
    "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
});

test("test_uncheckable_items_not_disclosed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.integrity.uncheckable_items_disclosed = false;
  assert.equal(evaluate(m).verdict,
    "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
});

test("test_constructed_not_compared_to_direct_fails", () => {
  const m = clone(COMPLETE) as any;
  m.construction.constructed_option_compared_to_direct = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY");
  assert.equal(v.sections["fare_construction"], "fail");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.integrity;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["price_integrity"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.legs_evaluated, 0);
  assert.equal(v.computed_constructed_total, null);
  assert.equal(v.computed_total_cost, null);
  assert.equal(v.computed_savings, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes(
    "VERDICT: FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported. A documented field present with the
// wrong JSON type raises FieldTypeError naming the field — never
// a verdict over garbage.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.trip_label = 12345;
  assert.throws(() => evaluate(m), fieldError("trip_label"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ trip: "should-be-an-object" }),
    fieldError("trip"),
  );
});

test("malformed: trip string leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.trip.origin = 403;
  assert.throws(() => evaluate(m), fieldError("trip.origin"));
});

test("malformed: legs list as object rejected", () => {
  const m = clone(COMPLETE) as any;
  m.construction.legs = { label: "leg_1" };
  assert.throws(() => evaluate(m), fieldError("construction.legs"));
});

test("malformed: leg entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.construction.legs[0] = "leg_1";
  assert.throws(() => evaluate(m), fieldError("construction.legs[0]"));
});

test("malformed: leg price as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.construction.legs[1].price = "450";
  assert.throws(
    () => evaluate(m), fieldError("construction.legs[1].price"));
});

test("malformed: leg label as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.construction.legs[0].label = 1;
  assert.throws(
    () => evaluate(m), fieldError("construction.legs[0].label"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.drivers.split_tickets_considered = "yes";
  assert.throws(
    () => evaluate(m), fieldError("drivers.split_tickets_considered"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.total_cost.headline_fare = "800";
  assert.throws(() => evaluate(m), fieldError("total_cost.headline_fare"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.construction.declared_savings = true;
  assert.throws(
    () => evaluate(m), fieldError("construction.declared_savings"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.integrity = null;
  assert.throws(() => evaluate(m), fieldError("integrity"));
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
  .filter((f) =>
    f.startsWith("fare-construction-savings-strategy--") &&
    f.endsWith(".json"))
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
