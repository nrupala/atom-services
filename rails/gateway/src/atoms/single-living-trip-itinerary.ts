// Single living trip itinerary — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/single-living-trip-itinerary/src/single_living_trip_itinerary.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Declared amounts use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; the total comparison uses the fixed-6dp difference.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  trip_title: "string",
  header: {
    purpose: "string",
    travellers: "string",
    trip_start_date: "string",
    trip_end_date: "string",
    single_itinerary_maintained: "boolean",
  },
  constraints: {
    entry_checked_before_routing: "boolean",
    transit_checked_before_routing: "boolean",
    passport_validity_checked: "boolean",
    visa_needs_checked: "boolean",
    baggage_rules_checked: "boolean",
    connection_minimums_checked: "boolean",
  },
  entries: [{
    entry_id: "string",
    kind: "string",
    state: "string",
    start_date: "string",
    end_date: "string",
    origin: "string",
    destination: "string",
    total_amount: "number",
    price_timestamp: "string",
    booking_reference: "string",
    terms_recorded: "boolean",
    held_expiry_or_timestamp: "string",
  }],
  skeleton: {
    outbound_laid: "boolean",
    stays_laid: "boolean",
    internal_moves_laid_or_none_needed: "boolean",
    return_laid: "boolean",
  },
  totals: {
    declared_booked_total: "number",
  },
  conflicts: {
    scanned_early: "boolean",
    tight_connections_flagged: "boolean",
    arrival_after_checkin_flagged: "boolean",
    clashing_plans_flagged: "boolean",
    conflicts_name_pieces_and_cost: "boolean",
  },
  readiness: {
    full_readthrough_completed: "boolean",
    documents_checked: "boolean",
    times_with_timezones_checked: "boolean",
    contacts_checked: "boolean",
    gaps_checked: "boolean",
  },
  red_lines: {
    date_change_suggested_present: "boolean",
    idea_or_quote_presented_as_booking_present: "boolean",
    invented_facts_present: "boolean",
    routing_before_constraints_checked_present: "boolean",
    unauthorized_booking_or_payment_present: "boolean",
  },
};

export const SECTIONS = [
  "trip_header",
  "entry_and_transit_constraints",
  "entry_states_and_totals",
  "skeleton_and_ordering",
  "conflicts_flagged",
  "predeparture_readthrough",
  "red_lines",
] as const;

const VALID_STATES = ["idea", "held", "booked"];
const MOVEMENT_KINDS = ["flight", "ground_transport"];

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  trip_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  entries_count: number | null;
  booked_entries_count: number | null;
  computed_booked_total: string | null;
  booked_total_difference: string | null;
  duplicate_itinerary_entry_ids: string[] | null;
  itinerary_entry_ids_without_valid_state: string[] | null;
  movement_leg_break_entry_ids: string[] | null;
  entries_out_of_date_order: string[] | null;
  entries_ending_before_start: string[] | null;
  entries_outside_trip_window: string[] | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function fieldOf(entry: unknown, field: string): unknown {
  return isPyDict(entry) ? entry[field] : undefined;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function stringCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, nonempty(value), evidence);
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["entry_id"] === "string") {
    return entry["entry_id"] as string;
  }
  return "unnamed";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [entriesRaw, hasEntries] = getPath(manifest, "entries");
  const entriesIsList = hasEntries && Array.isArray(entriesRaw);
  const rows: unknown[] = entriesIsList ? (entriesRaw as unknown[]) : [];
  const entriesCount: number | null = entriesIsList ? rows.length : null;
  const rowsWithState = (state: string) =>
    rows.filter((c) => isPyDict(c) && c["state"] === state);
  const bookedRows = entriesIsList ? rowsWithState("booked") : [];
  const heldRows = entriesIsList ? rowsWithState("held") : [];
  const ideaRows = entriesIsList ? rowsWithState("idea") : [];
  const bookedCount: number | null = entriesIsList ? bookedRows.length : null;

  const [tripStart, hasTripStart] = getPath(manifest, "header", "trip_start_date");
  const [tripEnd, hasTripEnd] = getPath(manifest, "header", "trip_end_date");
  const headerDatesPresent = hasTripStart && hasTripEnd &&
    nonempty(tripStart) && nonempty(tripEnd);

  let duplicateEntryIds: string[] | null = null;
  if (entriesIsList) {
    const seen: string[] = [];
    duplicateEntryIds = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["entry_id"] === "string") {
        const nm = c["entry_id"] as string;
        if (seen.includes(nm) && !duplicateEntryIds.includes(nm)) {
          duplicateEntryIds.push(nm);
        }
        seen.push(nm);
      }
    }
  }

  const idsWithoutValidState: string[] | null = entriesIsList
    ? rows.filter((c) => hasField(c, "state") &&
        !VALID_STATES.includes(fieldOf(c, "state") as string))
        .map(rowName)
    : null;

  const bookedTotalComplete = entriesIsList &&
    bookedRows.every((c) => isNumber(fieldOf(c, "total_amount")));
  let computedBookedTotal: number | null = null;
  if (bookedTotalComplete) {
    let sum = 0;
    for (const c of bookedRows) {
      sum += fieldOf(c, "total_amount") as number;
    }
    computedBookedTotal = sum;
  }
  const [declaredTotal, hasDeclaredTotal] = getPath(
    manifest, "totals", "declared_booked_total");
  const bookedTotalDifference: number | null =
    computedBookedTotal !== null && hasDeclaredTotal &&
      isNumber(declaredTotal)
      ? (declaredTotal as number) - computedBookedTotal
      : null;

  const movementRows = entriesIsList
    ? rows.filter((c) => isPyDict(c) &&
        MOVEMENT_KINDS.includes(fieldOf(c, "kind") as string))
    : [];
  let movementLegBreaks: string[] | null = null;
  if (entriesIsList) {
    movementLegBreaks = [];
    let prev: string | null = null;
    for (const c of movementRows) {
      if (!(nonempty(fieldOf(c, "origin")) &&
          nonempty(fieldOf(c, "destination")))) {
        prev = null;
        continue;
      }
      if (prev !== null && fieldOf(c, "origin") !== prev) {
        movementLegBreaks.push(rowName(c));
      }
      prev = fieldOf(c, "destination") as string;
    }
  }

  let entriesOutOfDateOrder: string[] | null = null;
  if (entriesIsList) {
    entriesOutOfDateOrder = [];
    let prevStart: string | null = null;
    for (const c of rows) {
      if (nonempty(fieldOf(c, "start_date"))) {
        const sd = fieldOf(c, "start_date") as string;
        if (prevStart !== null && sd < prevStart) {
          entriesOutOfDateOrder.push(rowName(c));
        }
        prevStart = sd;
      }
    }
  }

  const entriesEndingBeforeStart: string[] | null = entriesIsList
    ? rows.filter((c) => nonempty(fieldOf(c, "start_date")) &&
        nonempty(fieldOf(c, "end_date")) &&
        (fieldOf(c, "end_date") as string) <
          (fieldOf(c, "start_date") as string))
        .map(rowName)
    : null;
  const entriesOutsideTripWindow: string[] | null =
    entriesIsList && headerDatesPresent
      ? rows.filter((c) => nonempty(fieldOf(c, "start_date")) &&
          nonempty(fieldOf(c, "end_date")) &&
          ((fieldOf(c, "start_date") as string) < (tripStart as string) ||
           (fieldOf(c, "end_date") as string) > (tripEnd as string)))
          .map(rowName)
      : null;

  // ---- Section 1: trip_header ----
  stringCheck(results, "trip_header",
    "trip_purpose_stated_in_header", manifest,
    ["header", "purpose"],
    "header: the trip purpose is stated at the top of the itinerary");
  stringCheck(results, "trip_header",
    "travellers_stated_in_header", manifest,
    ["header", "travellers"],
    "header: the travellers are stated at the top of the itinerary");
  stringCheck(results, "trip_header",
    "trip_start_date_stated_in_header", manifest,
    ["header", "trip_start_date"],
    "header: the fixed start date is stated at the top of the itinerary");
  stringCheck(results, "trip_header",
    "trip_end_date_stated_in_header", manifest,
    ["header", "trip_end_date"],
    "header: the fixed end date is stated at the top of the itinerary");
  check(results, "trip_header",
    "trip_window_start_not_after_end", tripStart,
    hasTripStart && hasTripEnd,
    headerDatesPresent && (tripStart as string) <= (tripEnd as string),
    "header: the declared fixed start date is not after the declared fixed end date");
  boolCheck(results, "trip_header",
    "single_living_itinerary_maintained", manifest,
    ["header", "single_itinerary_maintained"],
    "header: one itinerary only — this record is the single living itinerary, updated not duplicated");

  // ---- Section 2: entry_and_transit_constraints ----
  boolCheck(results, "entry_and_transit_constraints",
    "entry_constraints_checked_before_routing_choices", manifest,
    ["constraints", "entry_checked_before_routing"],
    "constraints: entry constraints were checked before routing choices");
  boolCheck(results, "entry_and_transit_constraints",
    "transit_constraints_checked_before_routing_choices", manifest,
    ["constraints", "transit_checked_before_routing"],
    "constraints: transit constraints were checked before routing choices");
  boolCheck(results, "entry_and_transit_constraints",
    "passport_validity_checked_for_every_traveller", manifest,
    ["constraints", "passport_validity_checked"],
    "constraints: passport validity was checked for every traveller against each country's entry rule");
  boolCheck(results, "entry_and_transit_constraints",
    "visa_needs_checked_for_every_stop_including_airport_changes", manifest,
    ["constraints", "visa_needs_checked"],
    "constraints: visa and transit-visa needs were checked for every stop, including airport changes");
  boolCheck(results, "entry_and_transit_constraints",
    "baggage_rules_checked_when_carriers_change_mid_journey", manifest,
    ["constraints", "baggage_rules_checked"],
    "constraints: baggage rules were checked for carrier changes mid-journey");
  boolCheck(results, "entry_and_transit_constraints",
    "connection_minimums_checked_for_declared_connections", manifest,
    ["constraints", "connection_minimums_checked"],
    "constraints: minimum connection times were checked against the actual layovers on offer");

  // ---- Section 3: entry_states_and_totals ----
  check(results, "entry_states_and_totals",
    "itinerary_entries_declared", entriesRaw, entriesIsList,
    entriesIsList,
    "the declared record names its itinerary entries — the entries list is present; an empty list declares a skeleton with no entries yet");
  const statePresent = entriesIsList &&
    rows.every((c) => hasField(c, "state"));
  check(results, "entry_states_and_totals",
    "every_itinerary_entry_labelled_with_valid_state", entriesRaw,
    statePresent,
    entriesIsList &&
      rows.every((c) => VALID_STATES.includes(fieldOf(c, "state") as string)),
    "states: every declared entry is labelled idea, held or booked — no ambiguity and no other label");
  const idPresent = entriesIsList &&
    rows.every((c) => hasField(c, "entry_id"));
  check(results, "entry_states_and_totals",
    "no_itinerary_entry_id_duplicated", entriesRaw, idPresent,
    entriesIsList && duplicateEntryIds !== null &&
      duplicateEntryIds.length === 0,
    "entries: no declared entry_id is carried by more than one entry — one record per entry");
  const bookedRefPresent = entriesIsList &&
    bookedRows.every((c) => hasField(c, "booking_reference"));
  check(results, "entry_states_and_totals",
    "every_booked_entry_carries_booking_reference", entriesRaw,
    bookedRefPresent,
    entriesIsList &&
      bookedRows.every((c) => nonempty(fieldOf(c, "booking_reference"))),
    "states: every booked entry carries its booking reference — booked means paid or confirmed");
  check(results, "entry_states_and_totals",
    "every_booked_entry_records_its_total", entriesRaw,
    entriesIsList &&
      bookedRows.every((c) => hasField(c, "total_amount")),
    bookedTotalComplete,
    "states: every booked entry records its total");
  const bookedTermsPresent = entriesIsList &&
    bookedRows.every((c) => hasField(c, "terms_recorded"));
  check(results, "entry_states_and_totals",
    "every_booked_entry_records_its_terms", entriesRaw,
    bookedTermsPresent,
    entriesIsList &&
      bookedRows.every((c) => fieldOf(c, "terms_recorded") === true),
    "states: every booked entry records its terms");
  const heldExpiryPresent = entriesIsList &&
    heldRows.every((c) => hasField(c, "held_expiry_or_timestamp"));
  check(results, "entry_states_and_totals",
    "every_held_entry_states_expiry_or_timestamp", entriesRaw,
    heldExpiryPresent,
    entriesIsList &&
      heldRows.every((c) => nonempty(fieldOf(c, "held_expiry_or_timestamp"))),
    "states: every held entry states its expiry or timestamp — held means reserved or quoted live");
  check(results, "entry_states_and_totals",
    "every_idea_entry_free_of_booking_reference", entriesRaw,
    entriesIsList,
    entriesIsList &&
      ideaRows.every((c) => !nonempty(fieldOf(c, "booking_reference"))),
    "states: no idea entry carries a booking reference — an idea is a possibility, never presented as a booking");
  const pricedRows = entriesIsList
    ? rows.filter((c) => hasField(c, "total_amount"))
    : [];
  const pricedTsPresent = entriesIsList &&
    pricedRows.every((c) => hasField(c, "price_timestamp"));
  check(results, "entry_states_and_totals",
    "every_priced_itinerary_entry_carries_price_timestamp", entriesRaw,
    pricedTsPresent,
    entriesIsList &&
      pricedRows.every((c) => nonempty(fieldOf(c, "price_timestamp"))),
    "prices: every priced entry carries the timestamp of the live result its total came from");
  check(results, "entry_states_and_totals",
    "declared_booked_total_matches_sum_of_booked_entry_totals",
    declaredTotal,
    computedBookedTotal !== null && hasDeclaredTotal &&
      isNumber(declaredTotal),
    computedBookedTotal !== null && hasDeclaredTotal &&
      isNumber(declaredTotal) &&
      fmt6((declaredTotal as number) - computedBookedTotal) === "0.000000",
    "totals: the declared booked total equals the sum of the declared totals of the booked entries — arithmetic over declared numbers only");

  // ---- Section 4: skeleton_and_ordering ----
  boolCheck(results, "skeleton_and_ordering",
    "outbound_leg_laid_in_skeleton", manifest,
    ["skeleton", "outbound_laid"],
    "skeleton: the outbound leg is laid");
  boolCheck(results, "skeleton_and_ordering",
    "stays_laid_in_skeleton", manifest,
    ["skeleton", "stays_laid"],
    "skeleton: the stays are laid");
  boolCheck(results, "skeleton_and_ordering",
    "internal_moves_laid_or_declared_none_needed", manifest,
    ["skeleton", "internal_moves_laid_or_none_needed"],
    "skeleton: the internal moves are laid, or the record declares none are needed");
  boolCheck(results, "skeleton_and_ordering",
    "return_leg_laid_in_skeleton", manifest,
    ["skeleton", "return_laid"],
    "skeleton: the return leg is laid");
  const startPresent = entriesIsList &&
    rows.every((c) => hasField(c, "start_date"));
  check(results, "skeleton_and_ordering",
    "itinerary_entries_in_declared_date_order", entriesRaw,
    startPresent,
    entriesIsList && entriesOutOfDateOrder !== null &&
      entriesOutOfDateOrder.length === 0 &&
      rows.every((c) => nonempty(fieldOf(c, "start_date"))),
    "skeleton: the declared entries are in date order by their declared start dates");
  const bothDatesPresent = entriesIsList &&
    rows.every((c) => hasField(c, "start_date") && hasField(c, "end_date"));
  check(results, "skeleton_and_ordering",
    "no_itinerary_entry_ends_before_it_starts", entriesRaw,
    bothDatesPresent,
    entriesIsList && entriesEndingBeforeStart !== null &&
      entriesEndingBeforeStart.length === 0 &&
      rows.every((c) => nonempty(fieldOf(c, "start_date")) &&
        nonempty(fieldOf(c, "end_date"))),
    "skeleton: no declared entry ends before it starts");
  check(results, "skeleton_and_ordering",
    "every_itinerary_entry_within_trip_window", entriesRaw,
    bothDatesPresent && hasTripStart && hasTripEnd,
    entriesIsList && headerDatesPresent && bothDatesPresent &&
      entriesOutsideTripWindow !== null &&
      entriesOutsideTripWindow.length === 0 &&
      rows.every((c) => nonempty(fieldOf(c, "start_date")) &&
        nonempty(fieldOf(c, "end_date"))),
    "skeleton: every declared entry lies inside the declared fixed trip window — the plan is built inside the chosen dates");
  const movementEndpointsPresent = entriesIsList &&
    movementRows.every((c) => hasField(c, "origin") &&
      hasField(c, "destination"));
  check(results, "skeleton_and_ordering",
    "declared_movement_legs_connect_in_sequence", entriesRaw,
    movementEndpointsPresent,
    entriesIsList && movementLegBreaks !== null &&
      movementLegBreaks.length === 0 && movementEndpointsPresent &&
      movementRows.every((c) => nonempty(fieldOf(c, "origin")) &&
        nonempty(fieldOf(c, "destination"))),
    "skeleton: consecutive declared movement legs connect — each flight or ground-transport leg starts where the previous movement leg ended");

  // ---- Section 5: conflicts_flagged ----
  boolCheck(results, "conflicts_flagged",
    "conflicts_scanned_early_in_itinerary", manifest,
    ["conflicts", "scanned_early"],
    "conflicts: the itinerary was scanned for conflicts early");
  boolCheck(results, "conflicts_flagged",
    "tight_connections_flagged_in_itinerary", manifest,
    ["conflicts", "tight_connections_flagged"],
    "conflicts: tight connections are flagged where present, even when an airline will sell them");
  boolCheck(results, "conflicts_flagged",
    "arrival_after_checkin_close_flagged_in_itinerary", manifest,
    ["conflicts", "arrival_after_checkin_flagged"],
    "conflicts: arrival after check-in closes is flagged where present, the moment the flight time is known");
  boolCheck(results, "conflicts_flagged",
    "clashing_plans_flagged_in_itinerary", manifest,
    ["conflicts", "clashing_plans_flagged"],
    "conflicts: clashing plans are flagged where present");
  boolCheck(results, "conflicts_flagged",
    "flagged_conflicts_name_pieces_and_cost_of_ignoring", manifest,
    ["conflicts", "conflicts_name_pieces_and_cost"],
    "conflicts: each flagged conflict names the pieces involved and the cost of ignoring it");

  // ---- Section 6: predeparture_readthrough ----
  boolCheck(results, "predeparture_readthrough",
    "predeparture_full_readthrough_completed", manifest,
    ["readiness", "full_readthrough_completed"],
    "read-through: a full read-through of the itinerary was completed before departure");
  boolCheck(results, "predeparture_readthrough",
    "predeparture_documents_checked", manifest,
    ["readiness", "documents_checked"],
    "read-through: documents were checked");
  boolCheck(results, "predeparture_readthrough",
    "predeparture_times_with_timezones_checked", manifest,
    ["readiness", "times_with_timezones_checked"],
    "read-through: times with their timezones were checked");
  boolCheck(results, "predeparture_readthrough",
    "predeparture_contacts_checked", manifest,
    ["readiness", "contacts_checked"],
    "read-through: contacts were checked");
  boolCheck(results, "predeparture_readthrough",
    "predeparture_gaps_checked", manifest,
    ["readiness", "gaps_checked"],
    "read-through: gaps in the itinerary were checked");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "no_trip_date_change_suggested_in_itinerary", manifest,
    ["red_lines", "date_change_suggested_present"],
    "red line: no change to the chosen travel dates is suggested in the record — the plan works within the dates chosen");
  falseCheck(results, "red_lines",
    "no_idea_or_held_quote_presented_as_booking", manifest,
    ["red_lines", "idea_or_quote_presented_as_booking_present"],
    "red line: no idea or quote is presented as a booking in the record");
  falseCheck(results, "red_lines",
    "no_invented_prices_schedules_visa_rules_or_availability_in_itinerary", manifest,
    ["red_lines", "invented_facts_present"],
    "red line: no invented prices, schedules, visa rules or availability are present in the record");
  falseCheck(results, "red_lines",
    "no_routing_adopted_before_entry_transit_constraints_checked", manifest,
    ["red_lines", "routing_before_constraints_checked_present"],
    "red line: no routing was adopted before its entry and transit constraints were checked");
  falseCheck(results, "red_lines",
    "no_booking_or_payment_without_traveller_authorization", manifest,
    ["red_lines", "unauthorized_booking_or_payment_present"],
    "red line: no piece was booked or paid for without the traveller's authorization for that purchase");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "SINGLE_LIVING_TRIP_ITINERARY_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SINGLE_LIVING_TRIP_ITINERARY_READY";
  }

  const computedNames = [
    "trip_window_start_not_after_end",
    "itinerary_entries_declared",
    "every_itinerary_entry_labelled_with_valid_state",
    "no_itinerary_entry_id_duplicated",
    "every_booked_entry_carries_booking_reference",
    "every_booked_entry_records_its_total",
    "every_booked_entry_records_its_terms",
    "every_held_entry_states_expiry_or_timestamp",
    "every_idea_entry_free_of_booking_reference",
    "every_priced_itinerary_entry_carries_price_timestamp",
    "declared_booked_total_matches_sum_of_booked_entry_totals",
    "itinerary_entries_in_declared_date_order",
    "no_itinerary_entry_ends_before_it_starts",
    "every_itinerary_entry_within_trip_window",
    "declared_movement_legs_connect_in_sequence",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "single-living-trip-itinerary",
    atom_version: "0.1.0",
    trip_title: manifest["trip_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    entries_count: entriesCount,
    booked_entries_count: bookedCount,
    computed_booked_total: fmt6(computedBookedTotal),
    booked_total_difference: fmt6(bookedTotalDifference),
    duplicate_itinerary_entry_ids: duplicateEntryIds,
    itinerary_entry_ids_without_valid_state: idsWithoutValidState,
    movement_leg_break_entry_ids: movementLegBreaks,
    entries_out_of_date_order: entriesOutOfDateOrder,
    entries_ending_before_start: entriesEndingBeforeStart,
    entries_outside_trip_window: entriesOutsideTripWindow,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "SINGLE LIVING TRIP ITINERARY",
    `trip_title: ${pyStr(verdict.trip_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
