# Single living trip itinerary — documentation

**Single living trip itinerary** · slug `single-living-trip-itinerary` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189, RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared single living trip-itinerary record for completeness and internal consistency only — including whether the declared booked total equals the sum of the booked entry totals. It surfaces REST `POST /v1/single-living-trip-itinerary` and MCP `POST /mcp/single-living-trip-itinerary`. Pricing rate is `null` — free during trial.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/single-living-trip-itinerary/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment b71b0351b5994d9da5dc7bebffcd3189). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the trip `Family Trip to India`); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "single-living-trip-itinerary"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the trip-itinerary manifest.** You declare a record of one living itinerary for one trip — its flights, stays, ground transport and activities, with ideas, held pieces and booked pieces kept distinct — the atom audits the declared record, it does not search, price or book anything (see Explanation). The recorded full-pass manifest declares the trip `Family Trip to India`: header purpose `Vacation`, travellers `4`, trip window `2025-01-01` to `2025-01-10`, single itinerary maintained `true`; all six constraint flags `true`; one entry `leg_1` (kind `flight`, state `booked`, `2025-01-01` to `2025-01-01`, origin `JFK`, destination `DEL`, total `1000.0`, price timestamp `2024-12-01T10:00:00Z`, booking reference `ABC123`, terms recorded `true`); all four skeleton flags `true`; declared booked total `1000.0`; all five conflict flags `true`; all five readiness flags `true`; and all five red-line flags `false` (no date change suggested, no idea or quote presented as a booking, no invented facts, no routing before constraints were checked, no booking or payment without authorization).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/single-living-trip-itinerary` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `SINGLE_LIVING_TRIP_ITINERARY_READY`: "45 pass, 0 fail, 0 missing of 45 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `entries_count` is 1, `booked_entries_count` is 1, `computed_booked_total` is `"1000.000000"`, `booked_total_difference` is `"0.000000"`, and every row-name / ordering list is empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `SINGLE_LIVING_TRIP_ITINERARY_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "single-living-trip-itinerary"}`.
3. Call: `POST https://atoms.pipavia.com/v1/single-living-trip-itinerary` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/single-living-trip-itinerary` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `single_living_trip_itinerary`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `SINGLE_LIVING_TRIP_ITINERARY_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — exactly 1 check fails: `declared_booked_total_matches_sum_of_booked_entry_totals`, and the summary reads "44 pass, 1 fail, 0 missing of 45 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `totals.declared_booked_total` is declared `999.0` against a sum of booked entry totals of `1000.0`, failing `declared_booked_total_matches_sum_of_booked_entry_totals`; `computed_booked_total` is `"1000.000000"`, `booked_total_difference` is `"-1.000000"`, section `entry_states_and_totals` reports `fail`, the other six sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "header",
  "detail": "header must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/single-living-trip-itinerary` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/single-living-trip-itinerary` — tool name `single_living_trip_itinerary`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `single_living_trip_itinerary` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans or strings unless noted**, and `entries` is noted as a list, `entries[].total_amount` and `totals.declared_booked_total` as numbers, and the header date / travellers / purpose fields as strings there. Where SERVICE.md states no type — the section container objects (`header`, `constraints`, `entries` row objects, `skeleton`, `totals`, `conflicts`, `readiness`, `red_lines`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the `entries` list, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object`, `trip_title` `string` and `entries` `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `SINGLE_LIVING_TRIP_ITINERARY_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them; the entry-row fields SERVICE.md reads under `skeleton_and_ordering` (`kind`, dates, endpoints) are grouped there, and the remaining entry-row fields under `entry_states_and_totals`.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `trip_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md; recorded MCP `inputSchema` types it `string`) |

#### Read by: trip_header

| Field | Type | Notes |
|---|---|---|
| `header` | object | The trip-header section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `header.purpose` | string | Must be non-empty (type stated in SERVICE.md) |
| `header.travellers` | string | Must be non-empty (type stated in SERVICE.md) |
| `header.trip_start_date` | string | Declared ISO date string, compared lexicographically; must be non-empty (type stated in SERVICE.md) |
| `header.trip_end_date` | string | Declared ISO date string, compared lexicographically; must be non-empty (type stated in SERVICE.md) |
| `header.single_itinerary_maintained` | boolean | — |

#### Read by: entry_and_transit_constraints

| Field | Type | Notes |
|---|---|---|
| `constraints` | object | The constraints section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `constraints.entry_checked_before_routing` | boolean | — |
| `constraints.transit_checked_before_routing` | boolean | — |
| `constraints.passport_validity_checked` | boolean | — |
| `constraints.visa_needs_checked` | boolean | — |
| `constraints.baggage_rules_checked` | boolean | — |
| `constraints.connection_minimums_checked` | boolean | — |

#### Read by: entry_states_and_totals

| Field | Type | Notes |
|---|---|---|
| `entries` | list | List of entry objects with the entry fields below and in the `skeleton_and_ordering` group; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`). Also read by `skeleton_and_ordering` |
| `entries[]` | object | One declared itinerary entry row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `entries[].entry_id` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `entries[].state` | string | Must be `idea`, `held` or `booked` (type stated in SERVICE.md) |
| `entries[].total_amount` | number | The entry's declared total (type stated in SERVICE.md) |
| `entries[].price_timestamp` | string | Must be non-empty when the entry is priced (type stated in SERVICE.md) |
| `entries[].booking_reference` | string | Must be non-empty on booked entries; must be absent/empty on idea entries (type stated in SERVICE.md) |
| `entries[].terms_recorded` | boolean | Must be `true` on booked entries |
| `entries[].held_expiry_or_timestamp` | string | Must be non-empty on held entries (type stated in SERVICE.md). It does not appear in the recorded full-pass entry row, which is a booked row; it is included here because SERVICE.md states it and a recorded check reads it |
| `totals` | object | The totals section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `totals.declared_booked_total` | number | Computed, see below: must equal the sum of the booked entries' declared totals (type stated in SERVICE.md) |

#### Read by: skeleton_and_ordering

| Field | Type | Notes |
|---|---|---|
| `entries[].kind` | string | `flight` and `ground_transport` rows are the movement legs (type stated in SERVICE.md) |
| `entries[].start_date` | string | Declared ISO date string, compared lexicographically (type stated in SERVICE.md) |
| `entries[].end_date` | string | Declared ISO date string, compared lexicographically (type stated in SERVICE.md) |
| `entries[].origin` | string | Movement-leg endpoint (type stated in SERVICE.md) |
| `entries[].destination` | string | Movement-leg endpoint (type stated in SERVICE.md) |
| `skeleton` | object | The skeleton section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `skeleton.outbound_laid` | boolean | — |
| `skeleton.stays_laid` | boolean | — |
| `skeleton.internal_moves_laid_or_none_needed` | boolean | — |
| `skeleton.return_laid` | boolean | — |

#### Read by: conflicts_flagged

| Field | Type | Notes |
|---|---|---|
| `conflicts` | object | The conflicts section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `conflicts.scanned_early` | boolean | — |
| `conflicts.tight_connections_flagged` | boolean | — |
| `conflicts.arrival_after_checkin_flagged` | boolean | — |
| `conflicts.clashing_plans_flagged` | boolean | — |
| `conflicts.conflicts_name_pieces_and_cost` | boolean | — |

#### Read by: predeparture_readthrough

| Field | Type | Notes |
|---|---|---|
| `readiness` | object | The readiness (pre-departure read-through) section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `readiness.full_readthrough_completed` | boolean | — |
| `readiness.documents_checked` | boolean | — |
| `readiness.times_with_timezones_checked` | boolean | — |
| `readiness.contacts_checked` | boolean | — |
| `readiness.gaps_checked` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.date_change_suggested_present` | boolean | Must be `false` to pass — skill red line |
| `red_lines.idea_or_quote_presented_as_booking_present` | boolean | Must be `false` to pass — skill red line |
| `red_lines.invented_facts_present` | boolean | Must be `false` to pass — skill red line |
| `red_lines.routing_before_constraints_checked_present` | boolean | Must be `false` to pass — skill red line |
| `red_lines.unauthorized_booking_or_payment_present` | boolean | Must be `false` to pass — skill red line |

### Checks

All 45 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: trip_header

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `trip_purpose_stated_in_header` | header: the trip purpose is stated at the top of the itinerary | Pass: `header.purpose` is present and non-empty. Fail: it is present but empty. Missing: it is absent. |
| `travellers_stated_in_header` | header: the travellers are stated at the top of the itinerary | Pass: `header.travellers` is present and non-empty. Fail: it is present but empty. Missing: it is absent. |
| `trip_start_date_stated_in_header` | header: the fixed start date is stated at the top of the itinerary | Pass: `header.trip_start_date` is present and non-empty. Fail: it is present but empty. Missing: it is absent. |
| `trip_end_date_stated_in_header` | header: the fixed end date is stated at the top of the itinerary | Pass: `header.trip_end_date` is present and non-empty. Fail: it is present but empty. Missing: it is absent. |
| `trip_window_start_not_after_end` | header: the declared fixed start date is not after the declared fixed end date | Computed over the declared record. Pass: the declared fixed start date is not after the declared fixed end date (lexicographic on the declared ISO strings; no date is parsed and no timezone conversion is attempted). Fail: the start date is after the end date. Missing: either date is absent. |
| `single_living_itinerary_maintained` | header: one itinerary only — this record is the single living itinerary, updated not duplicated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: entry_and_transit_constraints

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `entry_constraints_checked_before_routing_choices` | constraints: entry constraints were checked before routing choices | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `transit_constraints_checked_before_routing_choices` | constraints: transit constraints were checked before routing choices | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `passport_validity_checked_for_every_traveller` | constraints: passport validity was checked for every traveller against each country's entry rule | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `visa_needs_checked_for_every_stop_including_airport_changes` | constraints: visa and transit-visa needs were checked for every stop, including airport changes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `baggage_rules_checked_when_carriers_change_mid_journey` | constraints: baggage rules were checked for carrier changes mid-journey | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `connection_minimums_checked_for_declared_connections` | constraints: minimum connection times were checked against the actual layovers on offer | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: entry_states_and_totals

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `itinerary_entries_declared` | the declared record names its itinerary entries — the entries list is present; an empty list declares a skeleton with no entries yet | Computed over the declared record. Pass: the `entries` list is present — an empty list passes, because it declares a skeleton with no entries yet, and the per-entry checks pass vacuously. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_itinerary_entry_labelled_with_valid_state` | states: every declared entry is labelled idea, held or booked — no ambiguity and no other label | Computed over the declared record. Pass: every declared entry row's `state` is one of `idea`, `held` or `booked`. Fail: a row declares any other label (offending rows are named in `itinerary_entry_ids_without_valid_state`). Missing: the list is absent, or a row has `state` absent. |
| `no_itinerary_entry_id_duplicated` | entries: no declared entry_id is carried by more than one entry — one record per entry | Computed over the declared record. Pass: no `entry_id` appears on more than one row. Fail: an `entry_id` is declared on more than one row (duplicates are named in `duplicate_itinerary_entry_ids`). Missing: the list is absent, or a row has `entry_id` absent. |
| `every_booked_entry_carries_booking_reference` | states: every booked entry carries its booking reference — booked means paid or confirmed | Computed over the declared record. Pass: every booked entry row carries a non-empty `booking_reference`. Fail: a booked row's reference is present but empty. Missing: the list is absent, or a booked row has `booking_reference` absent. |
| `every_booked_entry_records_its_total` | states: every booked entry records its total | Computed over the declared record. Pass: every booked entry row records a `total_amount`. Missing: the list is absent, or a booked row has `total_amount` absent — a booked entry without a total also makes the booked-total sum underivable. |
| `every_booked_entry_records_its_terms` | states: every booked entry records its terms | Computed over the declared record. Pass: every booked entry row declares `terms_recorded` `true`. Fail: a booked row declares it `false`. Missing: the list is absent, or a booked row has the field absent. |
| `every_held_entry_states_expiry_or_timestamp` | states: every held entry states its expiry or timestamp — held means reserved or quoted live | Computed over the declared record. Pass: every held entry row states a non-empty `held_expiry_or_timestamp`. Fail: a held row's value is present but empty. Missing: the list is absent, or a held row has the field absent. |
| `every_idea_entry_free_of_booking_reference` | states: no idea entry carries a booking reference — an idea is a possibility, never presented as a booking | Computed over the declared record — the entries list itself is the evidence for this check. Pass: no idea entry row carries a non-empty `booking_reference`. Fail: an idea row carries a non-empty `booking_reference`. Missing: the list is absent. |
| `every_priced_itinerary_entry_carries_price_timestamp` | prices: every priced entry carries the timestamp of the live result its total came from | Computed over the declared record. Pass: every entry row carrying a `total_amount` also carries a non-empty `price_timestamp`. Fail: a priced row's timestamp is present but empty. Missing: the list is absent, or a priced row has `price_timestamp` absent. |
| `declared_booked_total_matches_sum_of_booked_entry_totals` | totals: the declared booked total equals the sum of the declared totals of the booked entries — arithmetic over declared numbers only | Computed over the declared record. Pass: `totals.declared_booked_total` equals the sum of the declared `total_amount` values of the booked entries only (held quotes and ideas are not booked totals), under the fixed six-decimal serialization rule. Fail: the declared total is present but unequal to that sum. Missing: the entries list or the declared total is absent, or a booked entry's total is missing, so the sum is underivable. |

#### Section: skeleton_and_ordering

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `outbound_leg_laid_in_skeleton` | skeleton: the outbound leg is laid | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `stays_laid_in_skeleton` | skeleton: the stays are laid | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `internal_moves_laid_or_declared_none_needed` | skeleton: the internal moves are laid, or the record declares none are needed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `return_leg_laid_in_skeleton` | skeleton: the return leg is laid | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `itinerary_entries_in_declared_date_order` | skeleton: the declared entries are in date order by their declared start dates | Computed over the declared record. Pass: entries are in non-decreasing declared `start_date` order. Fail: an entry steps backwards (offending entries are named in `entries_out_of_date_order`). Missing: the list is absent, or a row has `start_date` absent. |
| `no_itinerary_entry_ends_before_it_starts` | skeleton: no declared entry ends before it starts | Computed over the declared record. Pass: no entry's declared `end_date` is before its `start_date`. Fail: an entry ends before it starts (offenders are named in `entries_ending_before_start`). Missing: the list is absent, or a row has a date absent. |
| `every_itinerary_entry_within_trip_window` | skeleton: every declared entry lies inside the declared fixed trip window — the plan is built inside the chosen dates | Computed over the declared record. Pass: every entry lies inside the declared fixed window (start not before `trip_start_date`, end not after `trip_end_date`). Fail: an entry lies outside the window (offenders are named in `entries_outside_trip_window`). Missing: the list, a row date, or a window date is absent. |
| `declared_movement_legs_connect_in_sequence` | skeleton: consecutive declared movement legs connect — each flight or ground-transport leg starts where the previous movement leg ended | Computed over the declared record. Pass: consecutive movement legs (entries whose `kind` is `flight` or `ground_transport`, in declared order) connect — each leg's `origin` equals the previous movement leg's `destination`. Fail: a leg's endpoint is present but empty, or a break occurs (breaks are named by the leg that fails to connect, in `movement_leg_break_entry_ids`). Missing: the list is absent, or a movement leg has an endpoint absent. |

#### Section: conflicts_flagged

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `conflicts_scanned_early_in_itinerary` | conflicts: the itinerary was scanned for conflicts early | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tight_connections_flagged_in_itinerary` | conflicts: tight connections are flagged where present, even when an airline will sell them | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `arrival_after_checkin_close_flagged_in_itinerary` | conflicts: arrival after check-in closes is flagged where present, the moment the flight time is known | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `clashing_plans_flagged_in_itinerary` | conflicts: clashing plans are flagged where present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `flagged_conflicts_name_pieces_and_cost_of_ignoring` | conflicts: each flagged conflict names the pieces involved and the cost of ignoring it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: predeparture_readthrough

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `predeparture_full_readthrough_completed` | read-through: a full read-through of the itinerary was completed before departure | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `predeparture_documents_checked` | read-through: documents were checked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `predeparture_times_with_timezones_checked` | read-through: times with their timezones were checked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `predeparture_contacts_checked` | read-through: contacts were checked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `predeparture_gaps_checked` | read-through: gaps in the itinerary were checked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_trip_date_change_suggested_in_itinerary` | red line: no change to the chosen travel dates is suggested in the record — the plan works within the dates chosen | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_idea_or_held_quote_presented_as_booking` | red line: no idea or quote is presented as a booking in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_invented_prices_schedules_visa_rules_or_availability_in_itinerary` | red line: no invented prices, schedules, visa rules or availability are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_routing_adopted_before_entry_transit_constraints_checked` | red line: no routing was adopted before its entry and transit constraints were checked | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_booking_or_payment_without_traveller_authorization` | red line: no piece was booked or paid for without the traveller's authorization for that purchase | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"single-living-trip-itinerary"`), `atom_version` (`"0.1.0"`), and `trip_title` (the manifest's declared trip-title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `entries_count` and `booked_entries_count` (integers, exactly; null when the entries list is not declared); `computed_booked_total` and `booked_total_difference` (declared minus computed — the re-derived sum of the booked entries' declared totals, and the declared total minus that sum; each a string with exactly six decimal places, produced under the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; the total comparison uses the fixed-6dp difference against zero; each null when the entries list is absent or a booked entry's total is missing); and the row-name / ordering lists `duplicate_itinerary_entry_ids` (entry ids carried by more than one row), `itinerary_entry_ids_without_valid_state` (rows whose declared state is not `idea`, `held` or `booked`), `movement_leg_break_entry_ids` (movement legs whose origin does not equal the previous movement leg's destination, named by the leg that fails to connect), `entries_out_of_date_order`, `entries_ending_before_start` and `entries_outside_trip_window` (the offending entries for each ordering rule) — the recorded sparse response returns all six lists as null when the entries list is not declared (see Discrepancies).
- `summary` — a one-line count, e.g. "45 pass, 0 fail, 0 missing of 45 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared trip-title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `SINGLE_LIVING_TRIP_ITINERARY_READY` — all 45 checks pass: the declared itinerary record is complete and internally consistent with the skill's three states, method, quality gates and red lines.
- `SINGLE_LIVING_TRIP_ITINERARY_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the fifteen computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `entries_count`, `booked_entries_count`, `computed_booked_total`, `booked_total_difference`, `duplicate_itinerary_entry_ids`, `itinerary_entry_ids_without_valid_state`, `movement_leg_break_entry_ids`, `entries_out_of_date_order`, `entries_ending_before_start`, `entries_outside_trip_window` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"header","detail":"header must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Build one living itinerary per trip — flights, stays, ground transport, and activities with ideas, held, and booked kept distinct (the bound capability, from the skill). You submit one declared record — the trip-itinerary manifest for one trip — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 7 sections (`trip_header`, `entry_and_transit_constraints`, `entry_states_and_totals`, `skeleton_and_ordering`, `conflicts_flagged`, `predeparture_readthrough`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean or non-empty string: declared `true` (or, for the header strings, present and non-empty) passes — for red-line / anti-pattern fields, declared `false` passes; present-but-opposite or empty fails; absent is `missing`. *Computed checks* are calculated from the declared rows and fields themselves — the declared fixed start date must not be after the declared fixed end date, the `entries` list must be present (an empty list passes), every entry's `state` must be one of `idea`, `held` or `booked`, no `entry_id` may appear on more than one row, every booked entry must carry a non-empty `booking_reference`, record a `total_amount` and declare `terms_recorded` true, every held entry must state a non-empty `held_expiry_or_timestamp`, no idea entry may carry a non-empty `booking_reference`, every entry carrying a `total_amount` must also carry a non-empty `price_timestamp`, the declared booked total must equal the sum of the declared `total_amount` values of the booked entries only, entries must be in non-decreasing declared `start_date` order, no entry's `end_date` may be before its `start_date`, every entry must lie inside the declared fixed trip window, and consecutive movement legs (entries whose `kind` is `flight` or `ground_transport`, in declared order) must connect, each leg's `origin` equal to the previous movement leg's `destination` — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `SINGLE_LIVING_TRIP_ITINERARY_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `SINGLE_LIVING_TRIP_ITINERARY_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false, empty or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are qualitative declarations and internal consistency, not bars the atom can set. Declined, named: a budget cap or a maximum trip cost (only the declared booked total's arithmetic is re-derived; no amount is judged too high or too low); a minimum connection time in minutes or a maximum layover (only that connection minimums were *checked* is declared — the skill states no number); a hotel check-in or check-out hour against which an arrival could be judged (only that arrival-after-check-in-close is *flagged* is declared); a passport-validity period in months or a named visa rule for any country or stop (the atom states no entry rule — only that validity and visa needs were *checked* is declared); a maximum number of entries, stays, travellers or hotel moves; a rest period after long hauls in hours; a price-freshness window for a price timestamp (only that a timestamp is carried is checked, never its age); a requirement that any particular kind of entry exist beyond the skeleton declarations (an itinerary of only ideas can pass if it is labelled, ordered and consistent — state honesty, not completeness of booking, is the discipline).

**What it does NOT do.** The atom audits a **declared** itinerary record: it searches no flight, hotel, transport or activity inventory, checks no live price, schedule, visa rule or availability, verifies no booking reference with any carrier or property, and books or pays for nothing. An itinerary is ready *on the caller's declared evidence*: a record that declares its constraints checked, its booked entries referenced and its legs connecting passes those checks even if none of it ever happened. It is a completeness and consistency audit of the itinerary record the skill requires, **not a travel agency, booking service, or financial advice, and not a guarantee that the trip is feasible, legal to enter, or well-planned**: it never judges whether a declared connection is actually long enough, whether a declared visa check reached the right answer, whether a stay fits the travellers, or whether the declared places and times exist — only that the record contains what the skill's three states, method, quality gates and red lines demand, and that its declared entries are internally consistent (states, references, totals, dates, window and leg connections). Named exclusions: no live verification of any declared fact; no entry, transit or visa *content* — the atom states no country's rule and takes no position on whether any traveller may enter or transit anywhere; no connection-time, check-in-window or rest adequacy judgment (see the declined thresholds above); no judgment of plan *quality* — whether the route, pace or choices are good for the travellers is the caller's declaration, checked only for declared presence and consistency.

**Buyer and use context.** Teams and agents working in Everyday life who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Family trips to India planning (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared trip-itinerary record for completeness and internal consistency; its verdict is a judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly (U-13 regulatory screen, classification (a) No outright) that its output could not read as regulated professional advice, that it offers no engineering, financial, medical, psychological or legal advice — the only arithmetic is re-deriving a declared booked total from the record's own declared entry totals, a consistency check over caller numbers, not a recommendation about money — and that it states no visa, passport or entry rule for any country and takes no position on any traveller's eligibility. It is not a travel agency, booking service, or financial advice. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `single_living_trip_itinerary` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans or strings unless noted; a wrong type is a 422 before evaluation, never a verdict. Dates are declared ISO date strings, compared lexicographically in both implementations; no date is parsed and no timezone conversion is attempted. Determinism: the core is a deterministic function of the manifest; computed amounts are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/single_living_trip_itinerary.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_single_living_trip_itinerary.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/single-living-trip-itinerary` (REST) and `POST /mcp/single-living-trip-itinerary` (MCP, tool `single_living_trip_itinerary`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment b71b0351b5994d9da5dc7bebffcd3189, RC soak to 2026-11-22). Key scope: `single_living_trip_itinerary`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment b71b0351b5994d9da5dc7bebffcd3189) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** many recorded check names are not the input field names they read. In `trip_header`: `trip_purpose_stated_in_header` reads `header.purpose`, `travellers_stated_in_header` reads `header.travellers`, `trip_start_date_stated_in_header` reads `header.trip_start_date`, `trip_end_date_stated_in_header` reads `header.trip_end_date`, `trip_window_start_not_after_end` is computed from the two header dates, and `single_living_itinerary_maintained` reads `header.single_itinerary_maintained`. In `entry_and_transit_constraints` every recorded check name expands its field: for example `entry_constraints_checked_before_routing_choices` reads `constraints.entry_checked_before_routing`, `passport_validity_checked_for_every_traveller` reads `constraints.passport_validity_checked`, `visa_needs_checked_for_every_stop_including_airport_changes` reads `constraints.visa_needs_checked`, and `connection_minimums_checked_for_declared_connections` reads `constraints.connection_minimums_checked`. In `entry_states_and_totals` the computed checks `itinerary_entries_declared`, `every_itinerary_entry_labelled_with_valid_state`, `no_itinerary_entry_id_duplicated`, `every_booked_entry_carries_booking_reference`, `every_booked_entry_records_its_total`, `every_booked_entry_records_its_terms`, `every_held_entry_states_expiry_or_timestamp`, `every_idea_entry_free_of_booking_reference` and `every_priced_itinerary_entry_carries_price_timestamp` read the `entries` rows and their fields, and `declared_booked_total_matches_sum_of_booked_entry_totals` reads `totals.declared_booked_total` together with the booked rows' `total_amount` values, rather than any single input field of the same name. In `skeleton_and_ordering`: `outbound_leg_laid_in_skeleton` reads `skeleton.outbound_laid`, `stays_laid_in_skeleton` reads `skeleton.stays_laid`, `internal_moves_laid_or_declared_none_needed` reads `skeleton.internal_moves_laid_or_none_needed`, `return_leg_laid_in_skeleton` reads `skeleton.return_laid`, and the computed checks `itinerary_entries_in_declared_date_order`, `no_itinerary_entry_ends_before_it_starts`, `every_itinerary_entry_within_trip_window` and `declared_movement_legs_connect_in_sequence` read the entry rows' dates, window and endpoints. In `conflicts_flagged` every recorded check name expands or rewords its field: for example `conflicts_scanned_early_in_itinerary` reads `conflicts.scanned_early`, `arrival_after_checkin_close_flagged_in_itinerary` reads `conflicts.arrival_after_checkin_flagged`, and `flagged_conflicts_name_pieces_and_cost_of_ignoring` reads `conflicts.conflicts_name_pieces_and_cost`. In `predeparture_readthrough` every recorded check name is prefixed `predeparture_` over its `readiness.*` field: for example `predeparture_full_readthrough_completed` reads `readiness.full_readthrough_completed` and `predeparture_times_with_timezones_checked` reads `readiness.times_with_timezones_checked`. In `red_lines` all five recorded check names differ from their fields: `no_trip_date_change_suggested_in_itinerary` (input `red_lines.date_change_suggested_present`), `no_idea_or_held_quote_presented_as_booking` (input `red_lines.idea_or_quote_presented_as_booking_present` — note the check says *held* where the field says *quote*), `no_invented_prices_schedules_visa_rules_or_availability_in_itinerary` (input `red_lines.invented_facts_present`), `no_routing_adopted_before_entry_transit_constraints_checked` (input `red_lines.routing_before_constraints_checked_present`) and `no_booking_or_payment_without_traveller_authorization` (input `red_lines.unauthorized_booking_or_payment_present`). Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`header`, `constraints`, `skeleton`, `totals`, `conflicts`, `readiness`, `red_lines`) or for a row object (`entries[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the `entries` list, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 45 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, `entries_count`, `booked_entries_count`, `computed_booked_total` and `booked_total_difference`, but does not state a null rule for the six row-name / ordering lists `duplicate_itinerary_entry_ids`, `itinerary_entry_ids_without_valid_state`, `movement_leg_break_entry_ids`, `entries_out_of_date_order`, `entries_ending_before_start` and `entries_outside_trip_window`. The recorded sparse response returns all of them as `null` when the entries list is not declared (as the Output format section records); this document follows the recording.
6. **Section groupings merging input objects:** the recorded sections merge separate input objects — `entries` and `totals` inputs are read by the single recorded section `entry_states_and_totals`, and `skeleton` declarations together with the `entries` rows' `kind`, dates and endpoints are read by the single recorded section `skeleton_and_ordering` (so the `entries` object is read by two recorded sections). The other recorded sections map to one input object each, two of them under a different name: `conflicts` is read by `conflicts_flagged` and `readiness` is read by `predeparture_readthrough`. This document groups the Input reference and the Checks by the recorded section names.
7. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (6 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named two prose labels instead of exact check names — `Trip window in order` and `Declared booked total` (R1 ×2); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); the designed violations input was missing the key paths present in the full-pass manifest (R3 ×1); and the designed malformed input carried 2 type violations instead of exactly one (R4 ×1). These are unscored prose divergences: where the corrected-away design prose differed, the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T10:51:07.652205+00:00 against gateway v1.1.0, external-verification battery Wave 14, source `verification/work/single-living-trip-itinerary/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T10:51:07.652205+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/single-living-trip-itinerary/evidence.json`.

Input:

```json
{
  "trip_title": "Family Trip to India",
  "header": {
    "purpose": "Vacation",
    "travellers": "4",
    "trip_start_date": "2025-01-01",
    "trip_end_date": "2025-01-10",
    "single_itinerary_maintained": true
  },
  "constraints": {
    "entry_checked_before_routing": true,
    "transit_checked_before_routing": true,
    "passport_validity_checked": true,
    "visa_needs_checked": true,
    "baggage_rules_checked": true,
    "connection_minimums_checked": true
  },
  "entries": [
    {
      "entry_id": "leg_1",
      "kind": "flight",
      "state": "booked",
      "start_date": "2025-01-01",
      "end_date": "2025-01-01",
      "origin": "JFK",
      "destination": "DEL",
      "total_amount": 1000.0,
      "price_timestamp": "2024-12-01T10:00:00Z",
      "booking_reference": "ABC123",
      "terms_recorded": true
    }
  ],
  "skeleton": {
    "outbound_laid": true,
    "stays_laid": true,
    "internal_moves_laid_or_none_needed": true,
    "return_laid": true
  },
  "totals": {
    "declared_booked_total": 1000.0
  },
  "conflicts": {
    "scanned_early": true,
    "tight_connections_flagged": true,
    "arrival_after_checkin_flagged": true,
    "clashing_plans_flagged": true,
    "conflicts_name_pieces_and_cost": true
  },
  "readiness": {
    "full_readthrough_completed": true,
    "documents_checked": true,
    "times_with_timezones_checked": true,
    "contacts_checked": true,
    "gaps_checked": true
  },
  "red_lines": {
    "date_change_suggested_present": false,
    "idea_or_quote_presented_as_booking_present": false,
    "invented_facts_present": false,
    "routing_before_constraints_checked_present": false,
    "unauthorized_booking_or_payment_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "single-living-trip-itinerary",
  "atom_version": "0.1.0",
  "trip_title": "Family Trip to India",
  "verdict": "SINGLE_LIVING_TRIP_ITINERARY_READY",
  "sections": {
    "trip_header": "pass",
    "entry_and_transit_constraints": "pass",
    "entry_states_and_totals": "pass",
    "skeleton_and_ordering": "pass",
    "conflicts_flagged": "pass",
    "predeparture_readthrough": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "trip_header",
      "check": "trip_purpose_stated_in_header",
      "status": "pass",
      "evidence": "header: the trip purpose is stated at the top of the itinerary"
    },
    {
      "section": "trip_header",
      "check": "travellers_stated_in_header",
      "status": "pass",
      "evidence": "header: the travellers are stated at the top of the itinerary"
    },
    {
      "section": "trip_header",
      "check": "trip_start_date_stated_in_header",
      "status": "pass",
      "evidence": "header: the fixed start date is stated at the top of the itinerary"
    },
    {
      "section": "trip_header",
      "check": "trip_end_date_stated_in_header",
      "status": "pass",
      "evidence": "header: the fixed end date is stated at the top of the itinerary"
    },
    {
      "section": "trip_header",
      "check": "trip_window_start_not_after_end",
      "status": "pass",
      "evidence": "header: the declared fixed start date is not after the declared fixed end date"
    },
    {
      "section": "trip_header",
      "check": "single_living_itinerary_maintained",
      "status": "pass",
      "evidence": "header: one itinerary only — this record is the single living itinerary, updated not duplicated"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "entry_constraints_checked_before_routing_choices",
      "status": "pass",
      "evidence": "constraints: entry constraints were checked before routing choices"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "transit_constraints_checked_before_routing_choices",
      "status": "pass",
      "evidence": "constraints: transit constraints were checked before routing choices"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "passport_validity_checked_for_every_traveller",
      "status": "pass",
      "evidence": "constraints: passport validity was checked for every traveller against each country's entry rule"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "visa_needs_checked_for_every_stop_including_airport_changes",
      "status": "pass",
      "evidence": "constraints: visa and transit-visa needs were checked for every stop, including airport changes"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "baggage_rules_checked_when_carriers_change_mid_journey",
      "status": "pass",
      "evidence": "constraints: baggage rules were checked for carrier changes mid-journey"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "connection_minimums_checked_for_declared_connections",
      "status": "pass",
      "evidence": "constraints: minimum connection times were checked against the actual layovers on offer"
    },
    {
      "section": "entry_states_and_totals",
      "check": "itinerary_entries_declared",
      "status": "pass",
      "evidence": "the declared record names its itinerary entries — the entries list is present; an empty list declares a skeleton with no entries yet"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_itinerary_entry_labelled_with_valid_state",
      "status": "pass",
      "evidence": "states: every declared entry is labelled idea, held or booked — no ambiguity and no other label"
    },
    {
      "section": "entry_states_and_totals",
      "check": "no_itinerary_entry_id_duplicated",
      "status": "pass",
      "evidence": "entries: no declared entry_id is carried by more than one entry — one record per entry"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_booked_entry_carries_booking_reference",
      "status": "pass",
      "evidence": "states: every booked entry carries its booking reference — booked means paid or confirmed"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_booked_entry_records_its_total",
      "status": "pass",
      "evidence": "states: every booked entry records its total"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_booked_entry_records_its_terms",
      "status": "pass",
      "evidence": "states: every booked entry records its terms"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_held_entry_states_expiry_or_timestamp",
      "status": "pass",
      "evidence": "states: every held entry states its expiry or timestamp — held means reserved or quoted live"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_idea_entry_free_of_booking_reference",
      "status": "pass",
      "evidence": "states: no idea entry carries a booking reference — an idea is a possibility, never presented as a booking"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_priced_itinerary_entry_carries_price_timestamp",
      "status": "pass",
      "evidence": "prices: every priced entry carries the timestamp of the live result its total came from"
    },
    {
      "section": "entry_states_and_totals",
      "check": "declared_booked_total_matches_sum_of_booked_entry_totals",
      "status": "pass",
      "evidence": "totals: the declared booked total equals the sum of the declared totals of the booked entries — arithmetic over declared numbers only"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "outbound_leg_laid_in_skeleton",
      "status": "pass",
      "evidence": "skeleton: the outbound leg is laid"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "stays_laid_in_skeleton",
      "status": "pass",
      "evidence": "skeleton: the stays are laid"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "internal_moves_laid_or_declared_none_needed",
      "status": "pass",
      "evidence": "skeleton: the internal moves are laid, or the record declares none are needed"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "return_leg_laid_in_skeleton",
      "status": "pass",
      "evidence": "skeleton: the return leg is laid"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "itinerary_entries_in_declared_date_order",
      "status": "pass",
      "evidence": "skeleton: the declared entries are in date order by their declared start dates"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "no_itinerary_entry_ends_before_it_starts",
      "status": "pass",
      "evidence": "skeleton: no declared entry ends before it starts"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "every_itinerary_entry_within_trip_window",
      "status": "pass",
      "evidence": "skeleton: every declared entry lies inside the declared fixed trip window — the plan is built inside the chosen dates"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "declared_movement_legs_connect_in_sequence",
      "status": "pass",
      "evidence": "skeleton: consecutive declared movement legs connect — each flight or ground-transport leg starts where the previous movement leg ended"
    },
    {
      "section": "conflicts_flagged",
      "check": "conflicts_scanned_early_in_itinerary",
      "status": "pass",
      "evidence": "conflicts: the itinerary was scanned for conflicts early"
    },
    {
      "section": "conflicts_flagged",
      "check": "tight_connections_flagged_in_itinerary",
      "status": "pass",
      "evidence": "conflicts: tight connections are flagged where present, even when an airline will sell them"
    },
    {
      "section": "conflicts_flagged",
      "check": "arrival_after_checkin_close_flagged_in_itinerary",
      "status": "pass",
      "evidence": "conflicts: arrival after check-in closes is flagged where present, the moment the flight time is known"
    },
    {
      "section": "conflicts_flagged",
      "check": "clashing_plans_flagged_in_itinerary",
      "status": "pass",
      "evidence": "conflicts: clashing plans are flagged where present"
    },
    {
      "section": "conflicts_flagged",
      "check": "flagged_conflicts_name_pieces_and_cost_of_ignoring",
      "status": "pass",
      "evidence": "conflicts: each flagged conflict names the pieces involved and the cost of ignoring it"
    },
    {
      "section": "predeparture_readthrough",
      "check": "predeparture_full_readthrough_completed",
      "status": "pass",
      "evidence": "read-through: a full read-through of the itinerary was completed before departure"
    },
    {
      "section": "predeparture_readthrough",
      "check": "predeparture_documents_checked",
      "status": "pass",
      "evidence": "read-through: documents were checked"
    },
    {
      "section": "predeparture_readthrough",
      "check": "predeparture_times_with_timezones_checked",
      "status": "pass",
      "evidence": "read-through: times with their timezones were checked"
    },
    {
      "section": "predeparture_readthrough",
      "check": "predeparture_contacts_checked",
      "status": "pass",
      "evidence": "read-through: contacts were checked"
    },
    {
      "section": "predeparture_readthrough",
      "check": "predeparture_gaps_checked",
      "status": "pass",
      "evidence": "read-through: gaps in the itinerary were checked"
    },
    {
      "section": "red_lines",
      "check": "no_trip_date_change_suggested_in_itinerary",
      "status": "pass",
      "evidence": "red line: no change to the chosen travel dates is suggested in the record — the plan works within the dates chosen"
    },
    {
      "section": "red_lines",
      "check": "no_idea_or_held_quote_presented_as_booking",
      "status": "pass",
      "evidence": "red line: no idea or quote is presented as a booking in the record"
    },
    {
      "section": "red_lines",
      "check": "no_invented_prices_schedules_visa_rules_or_availability_in_itinerary",
      "status": "pass",
      "evidence": "red line: no invented prices, schedules, visa rules or availability are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_routing_adopted_before_entry_transit_constraints_checked",
      "status": "pass",
      "evidence": "red line: no routing was adopted before its entry and transit constraints were checked"
    },
    {
      "section": "red_lines",
      "check": "no_booking_or_payment_without_traveller_authorization",
      "status": "pass",
      "evidence": "red line: no piece was booked or paid for without the traveller's authorization for that purchase"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "entries_count": 1,
  "booked_entries_count": 1,
  "computed_booked_total": "1000.000000",
  "booked_total_difference": "0.000000",
  "duplicate_itinerary_entry_ids": [],
  "itinerary_entry_ids_without_valid_state": [],
  "movement_leg_break_entry_ids": [],
  "entries_out_of_date_order": [],
  "entries_ending_before_start": [],
  "entries_outside_trip_window": [],
  "summary": "45 pass, 0 fail, 0 missing of 45 checks across seven sections.",
  "stamp": "SINGLE LIVING TRIP ITINERARY\ntrip_title: Family Trip to India\nVERDICT: SINGLE_LIVING_TRIP_ITINERARY_READY\n  trip_header                                  pass\n  entry_and_transit_constraints                pass\n  entry_states_and_totals                      pass\n  skeleton_and_ordering                        pass\n  conflicts_flagged                            pass\n  predeparture_readthrough                     pass\n  red_lines                                    pass\n45 pass, 0 fail, 0 missing of 45 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T10:51:07.652205+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/single-living-trip-itinerary/evidence.json`.

Input:

```json
{
  "trip_title": "Family Trip to India",
  "header": {
    "purpose": "Vacation",
    "travellers": "4",
    "trip_start_date": "2025-01-01",
    "trip_end_date": "2025-01-10",
    "single_itinerary_maintained": true
  },
  "constraints": {
    "entry_checked_before_routing": true,
    "transit_checked_before_routing": true,
    "passport_validity_checked": true,
    "visa_needs_checked": true,
    "baggage_rules_checked": true,
    "connection_minimums_checked": true
  },
  "entries": [
    {
      "entry_id": "leg_1",
      "kind": "flight",
      "state": "booked",
      "start_date": "2025-01-01",
      "end_date": "2025-01-01",
      "origin": "JFK",
      "destination": "DEL",
      "total_amount": 1000.0,
      "price_timestamp": "2024-12-01T10:00:00Z",
      "booking_reference": "ABC123",
      "terms_recorded": true
    }
  ],
  "skeleton": {
    "outbound_laid": true,
    "stays_laid": true,
    "internal_moves_laid_or_none_needed": true,
    "return_laid": true
  },
  "totals": {
    "declared_booked_total": 999.0
  },
  "conflicts": {
    "scanned_early": true,
    "tight_connections_flagged": true,
    "arrival_after_checkin_flagged": true,
    "clashing_plans_flagged": true,
    "conflicts_name_pieces_and_cost": true
  },
  "readiness": {
    "full_readthrough_completed": true,
    "documents_checked": true,
    "times_with_timezones_checked": true,
    "contacts_checked": true,
    "gaps_checked": true
  },
  "red_lines": {
    "date_change_suggested_present": false,
    "idea_or_quote_presented_as_booking_present": false,
    "invented_facts_present": false,
    "routing_before_constraints_checked_present": false,
    "unauthorized_booking_or_payment_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "single-living-trip-itinerary",
  "atom_version": "0.1.0",
  "trip_title": "Family Trip to India",
  "verdict": "SINGLE_LIVING_TRIP_ITINERARY_NOT_READY",
  "sections": {
    "trip_header": "pass",
    "entry_and_transit_constraints": "pass",
    "entry_states_and_totals": "fail",
    "skeleton_and_ordering": "pass",
    "conflicts_flagged": "pass",
    "predeparture_readthrough": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "trip_header",
      "check": "trip_purpose_stated_in_header",
      "status": "pass",
      "evidence": "header: the trip purpose is stated at the top of the itinerary"
    },
    {
      "section": "trip_header",
      "check": "travellers_stated_in_header",
      "status": "pass",
      "evidence": "header: the travellers are stated at the top of the itinerary"
    },
    {
      "section": "trip_header",
      "check": "trip_start_date_stated_in_header",
      "status": "pass",
      "evidence": "header: the fixed start date is stated at the top of the itinerary"
    },
    {
      "section": "trip_header",
      "check": "trip_end_date_stated_in_header",
      "status": "pass",
      "evidence": "header: the fixed end date is stated at the top of the itinerary"
    },
    {
      "section": "trip_header",
      "check": "trip_window_start_not_after_end",
      "status": "pass",
      "evidence": "header: the declared fixed start date is not after the declared fixed end date"
    },
    {
      "section": "trip_header",
      "check": "single_living_itinerary_maintained",
      "status": "pass",
      "evidence": "header: one itinerary only — this record is the single living itinerary, updated not duplicated"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "entry_constraints_checked_before_routing_choices",
      "status": "pass",
      "evidence": "constraints: entry constraints were checked before routing choices"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "transit_constraints_checked_before_routing_choices",
      "status": "pass",
      "evidence": "constraints: transit constraints were checked before routing choices"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "passport_validity_checked_for_every_traveller",
      "status": "pass",
      "evidence": "constraints: passport validity was checked for every traveller against each country's entry rule"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "visa_needs_checked_for_every_stop_including_airport_changes",
      "status": "pass",
      "evidence": "constraints: visa and transit-visa needs were checked for every stop, including airport changes"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "baggage_rules_checked_when_carriers_change_mid_journey",
      "status": "pass",
      "evidence": "constraints: baggage rules were checked for carrier changes mid-journey"
    },
    {
      "section": "entry_and_transit_constraints",
      "check": "connection_minimums_checked_for_declared_connections",
      "status": "pass",
      "evidence": "constraints: minimum connection times were checked against the actual layovers on offer"
    },
    {
      "section": "entry_states_and_totals",
      "check": "itinerary_entries_declared",
      "status": "pass",
      "evidence": "the declared record names its itinerary entries — the entries list is present; an empty list declares a skeleton with no entries yet"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_itinerary_entry_labelled_with_valid_state",
      "status": "pass",
      "evidence": "states: every declared entry is labelled idea, held or booked — no ambiguity and no other label"
    },
    {
      "section": "entry_states_and_totals",
      "check": "no_itinerary_entry_id_duplicated",
      "status": "pass",
      "evidence": "entries: no declared entry_id is carried by more than one entry — one record per entry"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_booked_entry_carries_booking_reference",
      "status": "pass",
      "evidence": "states: every booked entry carries its booking reference — booked means paid or confirmed"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_booked_entry_records_its_total",
      "status": "pass",
      "evidence": "states: every booked entry records its total"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_booked_entry_records_its_terms",
      "status": "pass",
      "evidence": "states: every booked entry records its terms"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_held_entry_states_expiry_or_timestamp",
      "status": "pass",
      "evidence": "states: every held entry states its expiry or timestamp — held means reserved or quoted live"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_idea_entry_free_of_booking_reference",
      "status": "pass",
      "evidence": "states: no idea entry carries a booking reference — an idea is a possibility, never presented as a booking"
    },
    {
      "section": "entry_states_and_totals",
      "check": "every_priced_itinerary_entry_carries_price_timestamp",
      "status": "pass",
      "evidence": "prices: every priced entry carries the timestamp of the live result its total came from"
    },
    {
      "section": "entry_states_and_totals",
      "check": "declared_booked_total_matches_sum_of_booked_entry_totals",
      "status": "fail",
      "evidence": "totals: the declared booked total equals the sum of the declared totals of the booked entries — arithmetic over declared numbers only"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "outbound_leg_laid_in_skeleton",
      "status": "pass",
      "evidence": "skeleton: the outbound leg is laid"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "stays_laid_in_skeleton",
      "status": "pass",
      "evidence": "skeleton: the stays are laid"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "internal_moves_laid_or_declared_none_needed",
      "status": "pass",
      "evidence": "skeleton: the internal moves are laid, or the record declares none are needed"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "return_leg_laid_in_skeleton",
      "status": "pass",
      "evidence": "skeleton: the return leg is laid"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "itinerary_entries_in_declared_date_order",
      "status": "pass",
      "evidence": "skeleton: the declared entries are in date order by their declared start dates"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "no_itinerary_entry_ends_before_it_starts",
      "status": "pass",
      "evidence": "skeleton: no declared entry ends before it starts"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "every_itinerary_entry_within_trip_window",
      "status": "pass",
      "evidence": "skeleton: every declared entry lies inside the declared fixed trip window — the plan is built inside the chosen dates"
    },
    {
      "section": "skeleton_and_ordering",
      "check": "declared_movement_legs_connect_in_sequence",
      "status": "pass",
      "evidence": "skeleton: consecutive declared movement legs connect — each flight or ground-transport leg starts where the previous movement leg ended"
    },
    {
      "section": "conflicts_flagged",
      "check": "conflicts_scanned_early_in_itinerary",
      "status": "pass",
      "evidence": "conflicts: the itinerary was scanned for conflicts early"
    },
    {
      "section": "conflicts_flagged",
      "check": "tight_connections_flagged_in_itinerary",
      "status": "pass",
      "evidence": "conflicts: tight connections are flagged where present, even when an airline will sell them"
    },
    {
      "section": "conflicts_flagged",
      "check": "arrival_after_checkin_close_flagged_in_itinerary",
      "status": "pass",
      "evidence": "conflicts: arrival after check-in closes is flagged where present, the moment the flight time is known"
    },
    {
      "section": "conflicts_flagged",
      "check": "clashing_plans_flagged_in_itinerary",
      "status": "pass",
      "evidence": "conflicts: clashing plans are flagged where present"
    },
    {
      "section": "conflicts_flagged",
      "check": "flagged_conflicts_name_pieces_and_cost_of_ignoring",
      "status": "pass",
      "evidence": "conflicts: each flagged conflict names the pieces involved and the cost of ignoring it"
    },
    {
      "section": "predeparture_readthrough",
      "check": "predeparture_full_readthrough_completed",
      "status": "pass",
      "evidence": "read-through: a full read-through of the itinerary was completed before departure"
    },
    {
      "section": "predeparture_readthrough",
      "check": "predeparture_documents_checked",
      "status": "pass",
      "evidence": "read-through: documents were checked"
    },
    {
      "section": "predeparture_readthrough",
      "check": "predeparture_times_with_timezones_checked",
      "status": "pass",
      "evidence": "read-through: times with their timezones were checked"
    },
    {
      "section": "predeparture_readthrough",
      "check": "predeparture_contacts_checked",
      "status": "pass",
      "evidence": "read-through: contacts were checked"
    },
    {
      "section": "predeparture_readthrough",
      "check": "predeparture_gaps_checked",
      "status": "pass",
      "evidence": "read-through: gaps in the itinerary were checked"
    },
    {
      "section": "red_lines",
      "check": "no_trip_date_change_suggested_in_itinerary",
      "status": "pass",
      "evidence": "red line: no change to the chosen travel dates is suggested in the record — the plan works within the dates chosen"
    },
    {
      "section": "red_lines",
      "check": "no_idea_or_held_quote_presented_as_booking",
      "status": "pass",
      "evidence": "red line: no idea or quote is presented as a booking in the record"
    },
    {
      "section": "red_lines",
      "check": "no_invented_prices_schedules_visa_rules_or_availability_in_itinerary",
      "status": "pass",
      "evidence": "red line: no invented prices, schedules, visa rules or availability are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_routing_adopted_before_entry_transit_constraints_checked",
      "status": "pass",
      "evidence": "red line: no routing was adopted before its entry and transit constraints were checked"
    },
    {
      "section": "red_lines",
      "check": "no_booking_or_payment_without_traveller_authorization",
      "status": "pass",
      "evidence": "red line: no piece was booked or paid for without the traveller's authorization for that purchase"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "entries_count": 1,
  "booked_entries_count": 1,
  "computed_booked_total": "1000.000000",
  "booked_total_difference": "-1.000000",
  "duplicate_itinerary_entry_ids": [],
  "itinerary_entry_ids_without_valid_state": [],
  "movement_leg_break_entry_ids": [],
  "entries_out_of_date_order": [],
  "entries_ending_before_start": [],
  "entries_outside_trip_window": [],
  "summary": "44 pass, 1 fail, 0 missing of 45 checks across seven sections.",
  "stamp": "SINGLE LIVING TRIP ITINERARY\ntrip_title: Family Trip to India\nVERDICT: SINGLE_LIVING_TRIP_ITINERARY_NOT_READY\n  trip_header                                  pass\n  entry_and_transit_constraints                pass\n  entry_states_and_totals                      fail\n  skeleton_and_ordering                        pass\n  conflicts_flagged                            pass\n  predeparture_readthrough                     pass\n  red_lines                                    pass\n44 pass, 1 fail, 0 missing of 45 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T10:51:07.652205+00:00 · gateway v1.1.0 · external-verification battery Wave 14 · source `verification/work/single-living-trip-itinerary/evidence.json`.

Input:

```json
{
  "trip_title": "Family Trip to India",
  "header": "should_be_an_object",
  "constraints": {
    "entry_checked_before_routing": true,
    "transit_checked_before_routing": true,
    "passport_validity_checked": true,
    "visa_needs_checked": true,
    "baggage_rules_checked": true,
    "connection_minimums_checked": true
  },
  "entries": [
    {
      "entry_id": "leg_1",
      "kind": "flight",
      "state": "booked",
      "start_date": "2025-01-01",
      "end_date": "2025-01-01",
      "origin": "JFK",
      "destination": "DEL",
      "total_amount": 1000.0,
      "price_timestamp": "2024-12-01T10:00:00Z",
      "booking_reference": "ABC123",
      "terms_recorded": true
    }
  ],
  "skeleton": {
    "outbound_laid": true,
    "stays_laid": true,
    "internal_moves_laid_or_none_needed": true,
    "return_laid": true
  },
  "totals": {
    "declared_booked_total": 1000.0
  },
  "conflicts": {
    "scanned_early": true,
    "tight_connections_flagged": true,
    "arrival_after_checkin_flagged": true,
    "clashing_plans_flagged": true,
    "conflicts_name_pieces_and_cost": true
  },
  "readiness": {
    "full_readthrough_completed": true,
    "documents_checked": true,
    "times_with_timezones_checked": true,
    "contacts_checked": true,
    "gaps_checked": true
  },
  "red_lines": {
    "date_change_suggested_present": false,
    "idea_or_quote_presented_as_booking_present": false,
    "invented_facts_present": false,
    "routing_before_constraints_checked_present": false,
    "unauthorized_booking_or_payment_present": false
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "header",
  "detail": "header must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared trip-itinerary record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not a travel agency, booking service, or financial advice, and SERVICE.md's U-13 screen (classification (a) No outright) states its output could not read as regulated professional advice and states no visa, passport or entry rule for any country. |
| Checks named | 45 documented / 45 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`entries_count`, `booked_entries_count`, `computed_booked_total`, `booked_total_difference` and the six row-name / ordering lists) |
| Input reference typed | Yes — 53 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/single-living-trip-itinerary/evidence.json` |
