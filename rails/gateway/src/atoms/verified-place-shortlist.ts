// Verified place shortlist — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/verified-place-shortlist/src/verified_place_shortlist.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  shortlist_title: "string",
  constraints: {
    constraints_declared: "boolean",
    area_declared: "boolean",
    visit_timing_declared: "boolean",
    budget_constraint_declared: "boolean",
    noise_constraint_declared: "boolean",
    parking_constraint_declared: "boolean",
    accessibility_needs_declared: "boolean",
    candidates_searched_within_declared_constraints: "boolean",
    only_real_named_results_kept: "boolean",
  },
  criteria: [{
    criterion_id: "string",
    criterion_name: "string",
  }],
  places: [{
    place_id: "string",
    place_name: "string",
    address: "string",
    address_verified_from_listing: "boolean",
    existence_confirmed: "boolean",
    hours_status: "string",
    verification_method: "string",
    verification_date: "string",
    rating: "number",
    review_count: "number",
    recent_complaints_noted: "boolean",
    photo_checked: "boolean",
    special_hours_noted_where_shown: "boolean",
    criterion_ids_met: ["string"],
  }],
  evaluation: {
    rating_signals_read_critically: "boolean",
    fit_checked_beyond_rating: "boolean",
  },
  ranking: {
    ranking_recorded: "boolean",
    ranking_based_on_declared_criteria: "boolean",
    winner_place_id: "string",
    winner_rationale_recorded: "boolean",
    winner_drawback_recorded: "boolean",
    winner_map_ready_address_declared: "boolean",
    winner_hours_recorded: "boolean",
    winner_booking_or_queue_warning_recorded: "boolean",
    timing_matters: "boolean",
    backup_place_id: "string",
  },
  handling: {
    hours_flagged_unverified_when_not_same_day_confirmed: "boolean",
    listings_checked_for_staleness_duplication_and_closure: "boolean",
    stale_duplicate_or_closed_listings_flagged: "boolean",
    no_unconfirmed_place_used_to_fill_gap: "boolean",
    original_area_has_no_verified_options: "boolean",
    nearest_verified_area_offered: "boolean",
  },
  red_lines: {
    invented_address_hours_rating_or_photo_present: "boolean",
    stale_hours_presented_as_current_fact_present: "boolean",
    place_breaking_stated_constraint_recommended_present: "boolean",
    ranking_by_rating_alone_present: "boolean",
    unverified_listing_passed_as_confirmed_open_present: "boolean",
  },
};

export const SECTIONS = [
  "constraints_and_criteria",
  "place_rows_and_verification_evidence",
  "rating_signals_and_fit",
  "ranking_winner_and_backup",
  "freshness_uncertainty_and_alternatives",
  "red_lines",
] as const;

const HOURS_STATUSES = ["same_day_verified", "flagged_unverified"];

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
  shortlist_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  verified_places_count: number | null;
  verified_place_criteria_count: number | null;
  duplicate_verified_place_ids: string[] | null;
  duplicate_verified_place_criterion_ids: string[] | null;
  duplicate_verified_place_addresses: string[] | null;
  verified_places_without_name: string[] | null;
  verified_places_without_address: string[] | null;
  verified_places_with_unrecognised_hours_status: string[] | null;
  verified_places_without_verification_method: string[] | null;
  verified_places_without_verification_date: string[] | null;
  verified_places_with_invalid_rating: string[] | null;
  verified_places_with_invalid_review_count: string[] | null;
  verified_place_criteria_without_name: string[] | null;
  verified_places_not_meeting_all_declared_criteria: string[] | null;
  verified_places_with_extra_criterion_ids: string[] | null;
  verified_places_total_review_count: string | null;
  place_address_verification_ratio: string | null;
  place_hours_same_day_verified_ratio: string | null;
  place_criterion_coverage_ratio: string | null;
  place_rating_evidence_ratio: string | null;
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

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && gate) {
    check(results, section, name, target, hasTarget, target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function idsOf(rows: unknown[], field: string): string[] {
  const out: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      out.push(c[field] as string);
    }
  }
  return out;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [placesRaw, hasPlaces] = getPath(manifest, "places");
  const placesIsList = hasPlaces && Array.isArray(placesRaw);
  const placeRows: unknown[] = placesIsList ? (placesRaw as unknown[]) : [];
  const placesCount: number | null = placesIsList ? placeRows.length : null;
  const placeIds = idsOf(placeRows, "place_id");

  const [criteriaRaw, hasCriteria] = getPath(manifest, "criteria");
  const critIsList = hasCriteria && Array.isArray(criteriaRaw);
  const critRows: unknown[] = critIsList ? (criteriaRaw as unknown[]) : [];
  const critCount: number | null = critIsList ? critRows.length : null;
  const criterionIds = idsOf(critRows, "criterion_id");

  const [winner, hasWinner] = getPath(manifest, "ranking", "winner_place_id");
  const [backup, hasBackup] = getPath(manifest, "ranking", "backup_place_id");
  const [timingMatters, hasTiming] = getPath(manifest, "ranking", "timing_matters");

  const duplicatePlaceIds: string[] | null = placesIsList
    ? duplicates(placeRows, "place_id") : null;
  const duplicateCriterionIds: string[] | null = critIsList
    ? duplicates(critRows, "criterion_id") : null;
  const duplicateAddresses: string[] | null = placesIsList
    ? duplicates(placeRows, "address") : null;

  const placesWithoutName: string[] | null = placesIsList
    ? placeRows.filter((c) => hasField(c, "place_name") &&
        !nonemptyStr((c as Record<string, unknown>)["place_name"]))
        .map((c) => rowName(c, "place_id"))
    : null;
  const placesWithoutAddress: string[] | null = placesIsList
    ? placeRows.filter((c) => hasField(c, "address") &&
        !nonemptyStr((c as Record<string, unknown>)["address"]))
        .map((c) => rowName(c, "place_id"))
    : null;
  const placesWithUnrecognisedHoursStatus: string[] | null = placesIsList
    ? placeRows.filter((c) => hasField(c, "hours_status") &&
        !HOURS_STATUSES.includes(
          (c as Record<string, unknown>)["hours_status"] as string))
        .map((c) => rowName(c, "place_id"))
    : null;
  const placesWithoutVerificationMethod: string[] | null = placesIsList
    ? placeRows.filter((c) => hasField(c, "verification_method") &&
        !nonemptyStr((c as Record<string, unknown>)["verification_method"]))
        .map((c) => rowName(c, "place_id"))
    : null;
  const placesWithoutVerificationDate: string[] | null = placesIsList
    ? placeRows.filter((c) => hasField(c, "verification_date") &&
        !nonemptyStr((c as Record<string, unknown>)["verification_date"]))
        .map((c) => rowName(c, "place_id"))
    : null;
  const placesWithInvalidRating: string[] | null = placesIsList
    ? placeRows.filter((c) => hasField(c, "rating") &&
        !(isNumber((c as Record<string, unknown>)["rating"]) &&
          ((c as Record<string, unknown>)["rating"] as number) >= 0))
        .map((c) => rowName(c, "place_id"))
    : null;
  const placesWithInvalidReviewCount: string[] | null = placesIsList
    ? placeRows.filter((c) => hasField(c, "review_count") &&
        !(isNumber((c as Record<string, unknown>)["review_count"]) &&
          ((c as Record<string, unknown>)["review_count"] as number) > 0))
        .map((c) => rowName(c, "place_id"))
    : null;
  const criteriaWithoutName: string[] | null = critIsList
    ? critRows.filter((c) => hasField(c, "criterion_name") &&
        !nonemptyStr((c as Record<string, unknown>)["criterion_name"]))
        .map((c) => rowName(c, "criterion_id"))
    : null;

  const metIds = (c: unknown): string[] | null => {
    const met = isPyDict(c) ? c["criterion_ids_met"] : null;
    if (!Array.isArray(met)) return null;
    return met.filter((m): m is string => typeof m === "string");
  };

  const meetsAll = (c: unknown): boolean => {
    const met = metIds(c);
    if (met === null) return false;
    return met.length === new Set(met).size &&
      criterionIds.every((cid) => met.includes(cid));
  };

  const hasExtra = (c: unknown): boolean => {
    const met = metIds(c);
    if (met === null) return false;
    return met.some((m) => !criterionIds.includes(m));
  };

  const placesNotMeetingAll: string[] | null = placesIsList && critIsList
    ? placeRows.filter((c) => hasField(c, "criterion_ids_met") && !meetsAll(c))
        .map((c) => rowName(c, "place_id"))
    : null;
  const placesWithExtraCriteria: string[] | null = placesIsList && critIsList
    ? placeRows.filter((c) => hasField(c, "criterion_ids_met") && hasExtra(c))
        .map((c) => rowName(c, "place_id"))
    : null;

  let totalReviewCount: number | null = null;
  if (placesIsList) {
    totalReviewCount = 0.0;
    for (const c of placeRows) {
      if (isPyDict(c) && isNumber(c["review_count"])) {
        totalReviewCount += c["review_count"] as number;
      }
    }
  }

  const addressVerificationRatio: number | null =
    placesIsList && placesCount !== null && placesCount > 0
      ? placeRows.filter((c) => isPyDict(c) &&
          c["address_verified_from_listing"] === true).length / placesCount
      : null;
  const hoursSameDayRatio: number | null =
    placesIsList && placesCount !== null && placesCount > 0
      ? placeRows.filter((c) => isPyDict(c) &&
          c["hours_status"] === "same_day_verified").length / placesCount
      : null;
  const criterionCoverageRatio: number | null =
    placesIsList && critIsList && placesCount !== null && placesCount > 0
      ? placeRows.filter((c) => meetsAll(c)).length / placesCount
      : null;
  const ratingEvidenceRatio: number | null =
    placesIsList && placesCount !== null && placesCount > 0
      ? placeRows.filter((c) => isPyDict(c) && hasField(c, "rating") &&
          hasField(c, "review_count")).length / placesCount
      : null;

  const rowBoolPresent = (field: string): boolean =>
    placesIsList && placeRows.every((c) => hasField(c, field));
  const rowBoolAllTrue = (field: string): boolean =>
    placesIsList && placeRows.every((c) => isPyDict(c) && c[field] === true);

  // ---- Section 1: constraints_and_criteria ----
  boolCheck(results, "constraints_and_criteria",
    "verified_place_shortlist_constraints_declared", manifest,
    ["constraints", "constraints_declared"],
    "constraints: the shortlist record declares the constraints it worked to, written down first");
  boolCheck(results, "constraints_and_criteria",
    "verified_place_shortlist_area_constraint_declared", manifest,
    ["constraints", "area_declared"],
    "constraints: the area constraint is declared");
  boolCheck(results, "constraints_and_criteria",
    "verified_place_shortlist_visit_timing_constraint_declared", manifest,
    ["constraints", "visit_timing_declared"],
    "constraints: the visit timing — the day and time the places must be open for — is declared");
  boolCheck(results, "constraints_and_criteria",
    "verified_place_shortlist_budget_constraint_declared", manifest,
    ["constraints", "budget_constraint_declared"],
    "constraints: the budget constraint is declared");
  boolCheck(results, "constraints_and_criteria",
    "verified_place_shortlist_noise_constraint_declared", manifest,
    ["constraints", "noise_constraint_declared"],
    "constraints: the noise constraint is declared");
  boolCheck(results, "constraints_and_criteria",
    "verified_place_shortlist_parking_constraint_declared", manifest,
    ["constraints", "parking_constraint_declared"],
    "constraints: the parking constraint is declared");
  boolCheck(results, "constraints_and_criteria",
    "verified_place_shortlist_accessibility_needs_declared", manifest,
    ["constraints", "accessibility_needs_declared"],
    "constraints: the accessibility needs are declared");
  boolCheck(results, "constraints_and_criteria",
    "verified_place_shortlist_candidates_searched_within_constraints", manifest,
    ["constraints", "candidates_searched_within_declared_constraints"],
    "search discipline: candidate places were searched for inside the declared constraints");
  boolCheck(results, "constraints_and_criteria",
    "verified_place_shortlist_only_real_named_results_kept", manifest,
    ["constraints", "only_real_named_results_kept"],
    "search discipline: only real, named results were kept as candidates");
  check(results, "constraints_and_criteria",
    "verified_place_shortlist_criteria_list_declared", criteriaRaw, critIsList,
    critIsList && critCount !== null && critCount > 0,
    "criteria: the declared record names its shortlist criteria — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all");
  const critIdPresent = critIsList &&
    critRows.every((c) => hasField(c, "criterion_id"));
  check(results, "constraints_and_criteria",
    "every_verified_place_criterion_id_unique", criteriaRaw, critIdPresent,
    critIsList && duplicateCriterionIds !== null &&
      duplicateCriterionIds.length === 0,
    "criteria: no declared criterion_id is owned by more than one row");
  const critNamePresent = critIsList &&
    critRows.every((c) => hasField(c, "criterion_name"));
  check(results, "constraints_and_criteria",
    "every_verified_place_criterion_name_declared", criteriaRaw,
    critNamePresent,
    critIsList && critRows.every((c) => isPyDict(c) && nonemptyStr(c["criterion_name"])),
    "criteria: every declared criterion declares a non-empty criterion name");

  // ---- Section 2: place_rows_and_verification_evidence ----
  check(results, "place_rows_and_verification_evidence",
    "verified_place_shortlist_places_list_declared", placesRaw, placesIsList,
    placesIsList && placesCount !== null && placesCount >= 2,
    "places: the declared record names its shortlisted places — the list is present and names at least two places; an absent list is missing evidence and a list of fewer than two declares no shortlist to rank and no backup to keep");
  const placeIdPresent = rowBoolPresent("place_id");
  check(results, "place_rows_and_verification_evidence",
    "every_verified_place_id_unique", placesRaw, placeIdPresent,
    placesIsList && duplicatePlaceIds !== null &&
      duplicatePlaceIds.length === 0,
    "places: no declared place_id is owned by more than one row");
  check(results, "place_rows_and_verification_evidence",
    "every_verified_place_name_declared", placesRaw,
    rowBoolPresent("place_name"),
    placesIsList && placeRows.every((c) => isPyDict(c) && nonemptyStr(c["place_name"])),
    "places: every declared place declares a non-empty place name — every recommended place is a real, named result");
  check(results, "place_rows_and_verification_evidence",
    "every_verified_place_address_declared", placesRaw,
    rowBoolPresent("address"),
    placesIsList && placeRows.every((c) => isPyDict(c) && nonemptyStr(c["address"])),
    "places: every declared place declares a non-empty address");
  check(results, "place_rows_and_verification_evidence",
    "every_verified_place_address_unique", placesRaw,
    rowBoolPresent("address"),
    placesIsList && duplicateAddresses !== null &&
      duplicateAddresses.length === 0,
    "places: no declared address is shared by more than one row — a duplicated address is the duplicate-listing signal the record must flag, not repeat");
  check(results, "place_rows_and_verification_evidence",
    "every_verified_place_address_verified_from_listing", placesRaw,
    rowBoolPresent("address_verified_from_listing"),
    rowBoolAllTrue("address_verified_from_listing"),
    "verification evidence: every declared place declares its address verified from the listing itself");
  check(results, "place_rows_and_verification_evidence",
    "every_verified_place_existence_confirmed", placesRaw,
    rowBoolPresent("existence_confirmed"),
    rowBoolAllTrue("existence_confirmed"),
    "verification evidence: every declared place declares its existence confirmed — no gap is filled with a place whose existence was not confirmed");
  check(results, "place_rows_and_verification_evidence",
    "every_verified_place_hours_status_recognised", placesRaw,
    rowBoolPresent("hours_status"),
    placesIsList && placeRows.every((c) => isPyDict(c) &&
      HOURS_STATUSES.includes(c["hours_status"] as string)),
    "verification evidence: every declared place's hours status is one of same_day_verified, flagged_unverified — hours are same-day verified or explicitly flagged unverified, with no third state");
  check(results, "place_rows_and_verification_evidence",
    "every_verified_place_verification_method_declared", placesRaw,
    rowBoolPresent("verification_method"),
    placesIsList && placeRows.every((c) => isPyDict(c) && nonemptyStr(c["verification_method"])),
    "verification evidence: every declared place declares a non-empty verification method — how its evidence was verified is part of the record");
  check(results, "place_rows_and_verification_evidence",
    "every_verified_place_verification_date_declared", placesRaw,
    rowBoolPresent("verification_date"),
    placesIsList && placeRows.every((c) => isPyDict(c) && nonemptyStr(c["verification_date"])),
    "verification evidence: every declared place declares a non-empty verification date — the freshness of its evidence is part of the record");

  // ---- Section 3: rating_signals_and_fit ----
  boolCheck(results, "rating_signals_and_fit",
    "verified_place_shortlist_rating_signals_read_critically", manifest,
    ["evaluation", "rating_signals_read_critically"],
    "rating signals: the rating signals were read critically, not taken as a star number alone");
  boolCheck(results, "rating_signals_and_fit",
    "verified_place_shortlist_fit_checked_beyond_rating", manifest,
    ["evaluation", "fit_checked_beyond_rating"],
    "rating signals: fit against the declared constraints was checked beyond the rating");
  check(results, "rating_signals_and_fit",
    "every_verified_place_rating_declared", placesRaw,
    rowBoolPresent("rating"),
    placesIsList && placeRows.every((c) => isPyDict(c) &&
      isNumber(c["rating"]) && (c["rating"] as number) >= 0),
    "rating signals: every declared place declares a non-negative rating value");
  check(results, "rating_signals_and_fit",
    "every_verified_place_review_count_positive", placesRaw,
    rowBoolPresent("review_count"),
    placesIsList && placeRows.every((c) => isPyDict(c) &&
      isNumber(c["review_count"]) && (c["review_count"] as number) > 0),
    "rating signals: every declared place declares a positive review count — rating signals carry review volume, and a count of zero declares no volume at all");
  check(results, "rating_signals_and_fit",
    "every_verified_place_recent_complaints_noted", placesRaw,
    rowBoolPresent("recent_complaints_noted"),
    rowBoolAllTrue("recent_complaints_noted"),
    "rating signals: every declared place declares what its recent reviews actually complain about noted");
  check(results, "rating_signals_and_fit",
    "every_verified_place_photo_checked", placesRaw,
    rowBoolPresent("photo_checked"),
    rowBoolAllTrue("photo_checked"),
    "photo evidence: every declared place declares its photo evidence checked, to judge space, seating and condition");
  const mappingPresent = placesIsList &&
    placeRows.every((c) => hasField(c, "criterion_ids_met"));
  check(results, "rating_signals_and_fit",
    "every_verified_place_criterion_mapping_declared", placesRaw,
    mappingPresent,
    placesIsList && placeRows.every((c) => isPyDict(c) &&
      Array.isArray(c["criterion_ids_met"])),
    "criterion mapping: every declared place declares its criterion mapping — the declared criteria it meets");
  const mappingAndCriteriaPresent = mappingPresent && critIsList &&
    critRows.every((c) => hasField(c, "criterion_id"));
  check(results, "rating_signals_and_fit",
    "every_verified_place_criterion_mapping_names_only_declared_criteria",
    placesRaw, mappingAndCriteriaPresent,
    placesIsList && critIsList && placeRows.every((c) => !hasExtra(c)),
    "criterion mapping: every declared place's criterion mapping names only declared criteria — no other criterion, and none twice in the coverage check below");
  check(results, "rating_signals_and_fit",
    "every_verified_place_meets_all_declared_criteria", placesRaw,
    mappingAndCriteriaPresent,
    placesIsList && critIsList && placeRows.every((c) => meetsAll(c)),
    "criterion coverage: every declared place meets every declared criterion — the shortlist respects every constraint stated, and no shortlisted place breaks one");

  // ---- Section 4: ranking_winner_and_backup ----
  boolCheck(results, "ranking_winner_and_backup",
    "verified_place_shortlist_ranking_recorded", manifest,
    ["ranking", "ranking_recorded"],
    "ranking: the shortlist record records a ranking of its declared places");
  boolCheck(results, "ranking_winner_and_backup",
    "verified_place_shortlist_ranking_based_on_declared_criteria", manifest,
    ["ranking", "ranking_based_on_declared_criteria"],
    "ranking: the recorded ranking is based on the declared criteria and constraints, not on rating alone");
  boolCheck(results, "ranking_winner_and_backup",
    "verified_place_shortlist_winner_rationale_recorded", manifest,
    ["ranking", "winner_rationale_recorded"],
    "winner: the record records why the declared winner wins");
  boolCheck(results, "ranking_winner_and_backup",
    "verified_place_shortlist_winner_drawback_recorded", manifest,
    ["ranking", "winner_drawback_recorded"],
    "winner: one honest drawback for the top pick is recorded");
  boolCheck(results, "ranking_winner_and_backup",
    "verified_place_shortlist_winner_map_ready_address_declared", manifest,
    ["ranking", "winner_map_ready_address_declared"],
    "winner: the winner's address is declared in map-ready form");
  boolCheck(results, "ranking_winner_and_backup",
    "verified_place_shortlist_winner_hours_recorded", manifest,
    ["ranking", "winner_hours_recorded"],
    "winner: the winner's hours for the day in question are recorded, or flagged unverified in its row");
  boolCheck(results, "ranking_winner_and_backup",
    "verified_place_shortlist_winner_booking_or_queue_warning_recorded",
    manifest,
    ["ranking", "winner_booking_or_queue_warning_recorded"],
    "winner: any booking or queue warning for the winner is recorded");
  const winnerPresent = hasWinner && placesIsList;
  check(results, "ranking_winner_and_backup",
    "verified_place_shortlist_winner_resolves_to_declared_place",
    winner, winnerPresent,
    winnerPresent && typeof winner === "string" &&
      placeIds.includes(winner),
    "winner: the declared winner place id names one of the declared places — the atom checks only that the reference resolves; it never checks that the winner is the best or highest-rated place");
  if (hasTiming && timingMatters) {
    const backupPresent = hasBackup && placesIsList;
    check(results, "ranking_winner_and_backup",
      "verified_place_shortlist_backup_resolves_and_differs_where_timing_matters",
      backup, backupPresent,
      backupPresent && typeof backup === "string" &&
        placeIds.includes(backup) && backup !== winner,
      "backup: where timing matters, the declared backup place id names a declared place other than the winner — one backup option is kept in case the winner is closed or full");
  } else {
    check(results, "ranking_winner_and_backup",
      "verified_place_shortlist_backup_resolves_and_differs_where_timing_matters",
      timingMatters, hasTiming, true,
      "timing does not matter for this visit");
  }

  // ---- Section 5: freshness_uncertainty_and_alternatives ----
  boolCheck(results, "freshness_uncertainty_and_alternatives",
    "verified_place_shortlist_hours_flagged_unverified_when_not_same_day_confirmed",
    manifest,
    ["handling", "hours_flagged_unverified_when_not_same_day_confirmed"],
    "freshness: hours that could not be confirmed for the same day are flagged unverified");
  boolCheck(results, "freshness_uncertainty_and_alternatives",
    "verified_place_shortlist_listings_checked_for_staleness_duplication_and_closure",
    manifest,
    ["handling", "listings_checked_for_staleness_duplication_and_closure"],
    "freshness: the listings were checked for staleness, duplication and possible closure");
  boolCheck(results, "freshness_uncertainty_and_alternatives",
    "verified_place_shortlist_stale_duplicate_or_closed_listings_flagged",
    manifest,
    ["handling", "stale_duplicate_or_closed_listings_flagged"],
    "freshness: any listing that looks stale, duplicated or possibly closed is flagged as such in the record");
  boolCheck(results, "freshness_uncertainty_and_alternatives",
    "verified_place_shortlist_no_unconfirmed_place_used_to_fill_gap", manifest,
    ["handling", "no_unconfirmed_place_used_to_fill_gap"],
    "uncertainty: no gap in the shortlist was filled with a place whose existence was not confirmed");
  gatedBoolCheck(results, "freshness_uncertainty_and_alternatives",
    "verified_place_shortlist_nearest_verified_area_offered_where_no_verified_options",
    manifest,
    ["handling", "original_area_has_no_verified_options"],
    ["handling", "nearest_verified_area_offered"],
    "alternatives: where the original area has no verified options, the nearest area that does have verified options is offered instead of widening silently",
    "the original area is not declared to have no verified options");
  check(results, "freshness_uncertainty_and_alternatives",
    "every_verified_place_special_hours_noted_where_shown", placesRaw,
    rowBoolPresent("special_hours_noted_where_shown"),
    rowBoolAllTrue("special_hours_noted_where_shown"),
    "freshness: every declared place declares holiday or special hours noted where shown for the day in question");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "verified_place_shortlist_free_of_invented_address_hours_rating_or_photo",
    manifest,
    ["red_lines", "invented_address_hours_rating_or_photo_present"],
    "red line: no invented address, opening hour, rating or photo description is present in the record");
  falseCheck(results, "red_lines",
    "verified_place_shortlist_free_of_stale_hours_presented_as_current_fact",
    manifest,
    ["red_lines", "stale_hours_presented_as_current_fact_present"],
    "red line: no stale hours are presented as current fact in the record");
  falseCheck(results, "red_lines",
    "verified_place_shortlist_free_of_place_breaking_stated_constraint_recommended",
    manifest,
    ["red_lines", "place_breaking_stated_constraint_recommended_present"],
    "red line: no place that breaks a stated constraint is recommended in the record");
  falseCheck(results, "red_lines",
    "verified_place_shortlist_free_of_ranking_by_rating_alone", manifest,
    ["red_lines", "ranking_by_rating_alone_present"],
    "red line: no ranking by rating alone, without checking fit and review volume, is present in the record");
  falseCheck(results, "red_lines",
    "verified_place_shortlist_free_of_unverified_listing_passed_as_confirmed_open",
    manifest,
    ["red_lines", "unverified_listing_passed_as_confirmed_open_present"],
    "red line: no unverified listing is passed off as a confirmed open business in the record");

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
    verdict = "VERIFIED_PLACE_SHORTLIST_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "VERIFIED_PLACE_SHORTLIST_SOUND";
  }

  const computedNames = [
    "verified_place_shortlist_criteria_list_declared",
    "every_verified_place_criterion_id_unique",
    "every_verified_place_criterion_name_declared",
    "verified_place_shortlist_places_list_declared",
    "every_verified_place_id_unique",
    "every_verified_place_name_declared",
    "every_verified_place_address_declared",
    "every_verified_place_address_unique",
    "every_verified_place_address_verified_from_listing",
    "every_verified_place_existence_confirmed",
    "every_verified_place_hours_status_recognised",
    "every_verified_place_verification_method_declared",
    "every_verified_place_verification_date_declared",
    "every_verified_place_rating_declared",
    "every_verified_place_review_count_positive",
    "every_verified_place_recent_complaints_noted",
    "every_verified_place_photo_checked",
    "every_verified_place_criterion_mapping_declared",
    "every_verified_place_criterion_mapping_names_only_declared_criteria",
    "every_verified_place_meets_all_declared_criteria",
    "verified_place_shortlist_winner_resolves_to_declared_place",
    "every_verified_place_special_hours_noted_where_shown",
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
    service: "verified-place-shortlist",
    atom_version: "0.1.0",
    shortlist_title: manifest["shortlist_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    verified_places_count: placesCount,
    verified_place_criteria_count: critCount,
    duplicate_verified_place_ids: duplicatePlaceIds,
    duplicate_verified_place_criterion_ids: duplicateCriterionIds,
    duplicate_verified_place_addresses: duplicateAddresses,
    verified_places_without_name: placesWithoutName,
    verified_places_without_address: placesWithoutAddress,
    verified_places_with_unrecognised_hours_status: placesWithUnrecognisedHoursStatus,
    verified_places_without_verification_method: placesWithoutVerificationMethod,
    verified_places_without_verification_date: placesWithoutVerificationDate,
    verified_places_with_invalid_rating: placesWithInvalidRating,
    verified_places_with_invalid_review_count: placesWithInvalidReviewCount,
    verified_place_criteria_without_name: criteriaWithoutName,
    verified_places_not_meeting_all_declared_criteria: placesNotMeetingAll,
    verified_places_with_extra_criterion_ids: placesWithExtraCriteria,
    verified_places_total_review_count: fmt6(totalReviewCount),
    place_address_verification_ratio: fmt6(addressVerificationRatio),
    place_hours_same_day_verified_ratio: fmt6(hoursSameDayRatio),
    place_criterion_coverage_ratio: fmt6(criterionCoverageRatio),
    place_rating_evidence_ratio: fmt6(ratingEvidenceRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "VERIFIED PLACE SHORTLIST",
    `shortlist_title: ${pyStr(verdict.shortlist_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
