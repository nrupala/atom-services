# Single living trip itinerary — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are planning one trip — its flights, stays, ground transport and activities — and you keep one living itinerary record for it, with ideas, held pieces and booked pieces kept distinct. This atom reads one declared manifest and returns one deterministic verdict across seven sections (trip_header, entry_and_transit_constraints, entry_states_and_totals, skeleton_and_ordering, conflicts_flagged, predeparture_readthrough, red_lines): **SINGLE_LIVING_TRIP_ITINERARY_READY**, **SINGLE_LIVING_TRIP_ITINERARY_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 45 checks. It audits the declared itinerary record's completeness and internal consistency only — it searches no flight, hotel, transport or activity inventory, checks no live price, schedule, visa rule or availability, verifies no booking reference with any carrier or property, and books or pays for nothing. An itinerary is ready *on your declared evidence*: a record that declares its constraints checked, its booked entries referenced and its legs connecting passes those checks even if none of it ever happened. It is not a travel agent, a booking service, or a guarantee that the trip is feasible, legal to enter, or well-planned: it never judges whether a declared connection is actually long enough, whether a declared visa check reached the right answer, whether a stay fits the travellers, or whether the declared places and times exist. The skill's red lines are checks here, not features: no date change suggested, no idea or quote presented as a booking, no invented prices, schedules, visa rules or availability, no routing before constraints are checked, and no booking or payment without authorization are ever performed — the atom audits the record of the plan you have already made. The computed checks: the declared fixed start date must not be after the declared fixed end date (dates are declared ISO strings, compared lexicographically; no date is parsed and no timezone conversion is attempted); the declared `entries` list must be present (an empty list passes — it declares a skeleton with no entries yet, and the per-entry checks pass vacuously); every entry's `state` must be one of `idea`, `held` or `booked`; no `entry_id` may appear on more than one row; every booked entry must carry a non-empty `booking_reference`, record a `total_amount` and declare `terms_recorded` true; every held entry must state a non-empty `held_expiry_or_timestamp`; no idea entry may carry a non-empty `booking_reference`; every entry carrying a `total_amount` must also carry a non-empty `price_timestamp`; the declared booked total must equal the sum of the declared `total_amount` values of the booked entries only; entries must be in non-decreasing declared `start_date` order; no entry's `end_date` may be before its `start_date`; every entry must lie inside the declared fixed trip window; and consecutive movement legs (entries whose `kind` is `flight` or `ground_transport`, in declared order) must connect — each leg's `origin` equal to the previous movement leg's `destination`. No numeric threshold is imposed — no budget cap or maximum trip cost (only the declared booked total's arithmetic is re-derived; no amount is judged too high or too low); no minimum connection time in minutes or maximum layover (only that connection minimums were *checked* is declared); no hotel check-in or check-out hour against which an arrival could be judged (only that arrival-after-check-in-close is *flagged* is declared); no passport-validity period in months or named visa rule for any country or stop (only that validity and visa needs were *checked* is declared); no maximum number of entries, stays, travellers or hotel moves; no rest period after long hauls in hours; no price-freshness window for a price timestamp (only that a timestamp is carried is checked, never its age); and no requirement that any particular kind of entry exist beyond the skeleton declarations (an itinerary of only ideas can pass if it is labelled, ordered and consistent — state honesty, not completeness of booking, is the discipline). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "single-living-trip-itinerary"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/single-living-trip-itinerary` — tool name `single_living_trip_itinerary`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/single-living-trip-itinerary` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `trip_title` | Trip title (string; carried into the output, not checked) |
| `header.purpose` (string) | trip-header evidence: the trip purpose, stated at the top of the itinerary; must be non-empty |
| `header.travellers` (string) | trip-header evidence: the travellers, stated at the top of the itinerary; must be non-empty |
| `header.trip_start_date` (string) | the declared fixed start date; must be non-empty; computed with `trip_end_date`: the start must not be after the end |
| `header.trip_end_date` (string) | the declared fixed end date; must be non-empty |
| `header.single_itinerary_maintained` | trip-header evidence: one itinerary only — this record is the single living itinerary, updated not duplicated |
| `constraints.entry_checked_before_routing` | constraint evidence: entry constraints were checked before routing choices |
| `constraints.transit_checked_before_routing` | constraint evidence: transit constraints were checked before routing choices |
| `constraints.passport_validity_checked` | constraint evidence: passport validity was checked for every traveller |
| `constraints.visa_needs_checked` | constraint evidence: visa and transit-visa needs were checked for every stop, including airport changes |
| `constraints.baggage_rules_checked` | constraint evidence: baggage rules were checked for carrier changes mid-journey |
| `constraints.connection_minimums_checked` | constraint evidence: minimum connection times were checked against the actual layovers on offer |
| `entries` (list of entry objects) | computed: must be present (an empty list declares a skeleton with no entries yet); reported as `entries_count` |
| `entries[].entry_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `entries[].kind` (string) | the entry kind; `flight` and `ground_transport` rows are the movement legs whose connections are computed |
| `entries[].state` (string) | computed: must be `idea`, `held` or `booked` |
| `entries[].start_date` / `entries[].end_date` (strings) | computed: entries must be in non-decreasing `start_date` order, no entry may end before it starts, and every entry must lie inside the declared trip window |
| `entries[].origin` / `entries[].destination` (strings) | movement-leg endpoints; computed: each movement leg's `origin` must equal the previous movement leg's `destination` |
| `entries[].total_amount` (number) | the entry's declared total; computed: booked totals are summed into the booked-total check |
| `entries[].price_timestamp` (string) | computed: every entry carrying a `total_amount` must carry a present, non-empty price timestamp |
| `entries[].booking_reference` (string) | computed: must be present and non-empty on booked entries, and absent/empty on idea entries |
| `entries[].terms_recorded` | computed: must be `true` on booked entries |
| `entries[].held_expiry_or_timestamp` (string) | computed: must be present and non-empty on held entries |
| `skeleton.outbound_laid` | skeleton evidence: the outbound leg is laid |
| `skeleton.stays_laid` | skeleton evidence: the stays are laid |
| `skeleton.internal_moves_laid_or_none_needed` | skeleton evidence: the internal moves are laid, or the record declares none are needed |
| `skeleton.return_laid` | skeleton evidence: the return leg is laid |
| `totals.declared_booked_total` (number) | computed: must equal the sum of the declared `total_amount` values of the booked entries only |
| `conflicts.scanned_early` | conflict evidence: the itinerary was scanned for conflicts early |
| `conflicts.tight_connections_flagged` | conflict evidence: tight connections are flagged where present |
| `conflicts.arrival_after_checkin_flagged` | conflict evidence: arrival after check-in closes is flagged where present |
| `conflicts.clashing_plans_flagged` | conflict evidence: clashing plans are flagged where present |
| `conflicts.conflicts_name_pieces_and_cost` | conflict evidence: each flagged conflict names the pieces involved and the cost of ignoring it |
| `readiness.full_readthrough_completed` | read-through evidence: a full read-through of the itinerary was completed before departure |
| `readiness.documents_checked` | read-through evidence: documents were checked |
| `readiness.times_with_timezones_checked` | read-through evidence: times with their timezones were checked |
| `readiness.contacts_checked` | read-through evidence: contacts were checked |
| `readiness.gaps_checked` | read-through evidence: gaps in the itinerary were checked |
| `red_lines.date_change_suggested_present` | must be `false` to pass (red line: no change to the chosen travel dates is suggested) |
| `red_lines.idea_or_quote_presented_as_booking_present` | must be `false` to pass (red line: no idea or quote is presented as a booking) |
| `red_lines.invented_facts_present` | must be `false` to pass (red line: no invented prices, schedules, visa rules or availability) |
| `red_lines.routing_before_constraints_checked_present` | must be `false` to pass (red line: no routing was adopted before its entry and transit constraints were checked) |
| `red_lines.unauthorized_booking_or_payment_present` | must be `false` to pass (red line: no piece was booked or paid for without the traveller's authorization) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward SINGLE_LIVING_TRIP_ITINERARY_NOT_READY). All fields are booleans or strings unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/single-living-trip-itinerary`:

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

Response — HTTP 200 (trimmed; the full response carries all 45 checks and a text stamp of the verdict):

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
  "summary": "45 pass, 0 fail, 0 missing of 45 checks across seven sections."
}
```

## Verdicts

- **SINGLE_LIVING_TRIP_ITINERARY_READY** — every check passes; the declared itinerary record is complete and internally consistent with the skill's three states, method, quality gates and red lines.
- **SINGLE_LIVING_TRIP_ITINERARY_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `entries_count` and `booked_entries_count` (integers, exactly; null when the entries list is not declared), `duplicate_itinerary_entry_ids` (entry ids carried by more than one row; null when the entries list is not declared), `itinerary_entry_ids_without_valid_state` (rows whose declared state is not `idea`, `held` or `booked`; null when the entries list is not declared), `movement_leg_break_entry_ids` (movement legs whose origin does not equal the previous movement leg's destination, named by the leg that fails to connect; null when the entries list is not declared), `entries_out_of_date_order`, `entries_ending_before_start` and `entries_outside_trip_window` (the offending entries for each ordering rule; each null when the entries list is not declared), `computed_booked_total` and `booked_total_difference` (the re-derived sum of the booked entries' declared totals, and the declared total minus the computed total; each a string with exactly six decimal places, and null when the entries list is absent or a booked entry's total is missing), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the fifteen computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
