# Single living trip itinerary — `single-living-trip-itinerary`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build one living itinerary per trip — flights, stays, ground transport, and activities with ideas, held, and booked kept distinct.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Everyday life who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Family trips to India planning**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the single living trip itinerary manifest

The caller submits one JSON manifest: a declared itinerary
record for one trip — its header, its constraint checks, its
entries (flights, stays, ground transport, activities), its
skeleton, its declared booked total, its conflict flags, its
pre-departure read-through and its red-line record. Every
field below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a
field present but false / invalid / inconsistent = the check
fails (`SINGLE_LIVING_TRIP_ITINERARY_NOT_READY`). All fields
are booleans or strings unless noted. Dates are declared ISO
date strings, compared lexicographically (identically in both
implementations); no date is parsed and no timezone conversion
is attempted.

| Field | Read by |
|---|---|
| `trip_title` (string; carried into the verdict output, not itself checked) | — |
| `header.purpose` (string, non-empty) | trip_header |
| `header.travellers` (string, non-empty) | trip_header |
| `header.trip_start_date` (string, non-empty) | trip_header |
| `header.trip_end_date` (string, non-empty) | trip_header |
| `header.single_itinerary_maintained` (boolean) | trip_header |
| `constraints.entry_checked_before_routing` (boolean) | entry_and_transit_constraints |
| `constraints.transit_checked_before_routing` (boolean) | entry_and_transit_constraints |
| `constraints.passport_validity_checked` (boolean) | entry_and_transit_constraints |
| `constraints.visa_needs_checked` (boolean) | entry_and_transit_constraints |
| `constraints.baggage_rules_checked` (boolean) | entry_and_transit_constraints |
| `constraints.connection_minimums_checked` (boolean) | entry_and_transit_constraints |
| `entries` (list of entry objects with the entry fields below; computed, see below) | entry_states_and_totals, skeleton_and_ordering |
| `entries[].entry_id` (string; names the row in the computed outputs) | entry_states_and_totals |
| `entries[].kind` (string; `flight` and `ground_transport` rows are the movement legs) | skeleton_and_ordering |
| `entries[].state` (string; must be `idea`, `held` or `booked`) | entry_states_and_totals |
| `entries[].start_date` / `entries[].end_date` (strings) | skeleton_and_ordering |
| `entries[].origin` / `entries[].destination` (strings; movement legs) | skeleton_and_ordering |
| `entries[].total_amount` (number; the entry's declared total) | entry_states_and_totals |
| `entries[].price_timestamp` (string, non-empty when the entry is priced) | entry_states_and_totals |
| `entries[].booking_reference` (string, non-empty on booked entries; must be absent/empty on idea entries) | entry_states_and_totals |
| `entries[].terms_recorded` (boolean; must be `true` on booked entries) | entry_states_and_totals |
| `entries[].held_expiry_or_timestamp` (string, non-empty on held entries) | entry_states_and_totals |
| `skeleton.outbound_laid` (boolean) | skeleton_and_ordering |
| `skeleton.stays_laid` (boolean) | skeleton_and_ordering |
| `skeleton.internal_moves_laid_or_none_needed` (boolean) | skeleton_and_ordering |
| `skeleton.return_laid` (boolean) | skeleton_and_ordering |
| `totals.declared_booked_total` (number; computed, see below) | entry_states_and_totals |
| `conflicts.scanned_early` (boolean) | conflicts_flagged |
| `conflicts.tight_connections_flagged` (boolean) | conflicts_flagged |
| `conflicts.arrival_after_checkin_flagged` (boolean) | conflicts_flagged |
| `conflicts.clashing_plans_flagged` (boolean) | conflicts_flagged |
| `conflicts.conflicts_name_pieces_and_cost` (boolean) | conflicts_flagged |
| `readiness.full_readthrough_completed` (boolean) | predeparture_readthrough |
| `readiness.documents_checked` (boolean) | predeparture_readthrough |
| `readiness.times_with_timezones_checked` (boolean) | predeparture_readthrough |
| `readiness.contacts_checked` (boolean) | predeparture_readthrough |
| `readiness.gaps_checked` (boolean) | predeparture_readthrough |
| `red_lines.date_change_suggested_present` (boolean; must be `false` — skill red line) | red_lines |
| `red_lines.idea_or_quote_presented_as_booking_present` (boolean; must be `false` — skill red line) | red_lines |
| `red_lines.invented_facts_present` (boolean; must be `false` — skill red line) | red_lines |
| `red_lines.routing_before_constraints_checked_present` (boolean; must be `false` — skill red line) | red_lines |
| `red_lines.unauthorized_booking_or_payment_present` (boolean; must be `false` — skill red line) | red_lines |

Several checks are computed from the declared record, using
only the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Trip window in order:** the declared fixed start date is
  not after the declared fixed end date (lexicographic on the
  declared ISO strings).
- **Entries declared:** the `entries` list passes when it is
  present. An empty list passes: it declares a skeleton with
  no entries yet, and the per-entry checks pass vacuously.
- **Valid state per entry:** every entry's `state` is one of
  `idea`, `held`, `booked` (the skill's three states). A row
  with `state` absent is missing evidence; any other label
  fails. Offending rows are named in
  `itinerary_entry_ids_without_valid_state`.
- **No entry id duplicated:** no `entry_id` appears on more
  than one row; duplicates are named in
  `duplicate_itinerary_entry_ids`. A row with `entry_id`
  absent is missing evidence for this check.
- **Booked discipline:** every booked entry carries a
  non-empty `booking_reference`, records a `total_amount`,
  and declares `terms_recorded` true (the skill: booked =
  paid or confirmed, with a reference, a total, and terms
  recorded). A booked row with a field absent is missing
  evidence for that check; a present-but-empty/false value
  fails.
- **Held discipline:** every held entry states a non-empty
  `held_expiry_or_timestamp` (the skill: held = reserved or
  quoted live, with its expiry or timestamp stated), under
  the same absent/empty rules.
- **Idea discipline:** no idea entry carries a non-empty
  `booking_reference` — an idea is a possibility, never
  presented as a booking. The entries list itself is the
  evidence for this check.
- **Price timestamps:** every entry carrying a `total_amount`
  also carries a non-empty `price_timestamp` (the skill:
  every price is a verified total from a live result with a
  timestamp). An absent timestamp is missing evidence; an
  empty one fails.
- **Declared booked total:** `totals.declared_booked_total`
  must equal the sum of the declared `total_amount` values of
  the booked entries only (held quotes and ideas are not
  booked totals). A booked entry without a total makes the
  sum underivable — missing evidence.
- **Date order:** entries are in non-decreasing declared
  `start_date` order; entries stepping backwards are named in
  `entries_out_of_date_order`.
- **No entry ends before it starts:** every entry's declared
  `end_date` is not before its `start_date`; offenders are
  named in `entries_ending_before_start`.
- **Inside the trip window:** every entry lies inside the
  declared fixed window (start not before `trip_start_date`,
  end not after `trip_end_date` — the plan is built inside
  the chosen dates); offenders are named in
  `entries_outside_trip_window`.
- **Movement legs connect:** consecutive movement legs
  (entries whose `kind` is `flight` or `ground_transport`, in
  declared order) connect — each leg's `origin` equals the
  previous movement leg's `destination`. Breaks are named by
  the leg that fails to connect, in
  `movement_leg_break_entry_ids`. A movement leg with an
  endpoint absent is missing evidence; an empty endpoint
  fails.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the fifteen computed checks above cannot be completed),
`entries_count` and `booked_entries_count` (integers, exactly;
null when the entries list is not declared),
`computed_booked_total` and `booked_total_difference`
(declared minus computed). **Fixed serialization rule:**
computed amounts are reported as strings with exactly six
decimal places, produced in both implementations by the same
rule — round half up to 6dp, `floor(v * 1000000 + 0.5) /
1000000`, then format with exactly six decimals; the total
comparison uses the fixed-6dp difference against zero. An
amount is null when the entries list is absent or a booked
entry's total is missing. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.

The skill states no numeric threshold at all — its demands
are qualitative declarations and internal consistency, not
bars the atom can set. Declined thresholds, named: a budget
cap or a maximum trip cost (only the declared booked total's
arithmetic is re-derived; no amount is judged too high or too
low); a minimum connection time in minutes or a maximum
layover (only that connection minimums were *checked* is
declared — the skill states no number); a hotel check-in or
check-out hour against which an arrival could be judged (only
that arrival-after-check-in-close is *flagged* is declared);
a passport-validity period in months or a named visa rule for
any country or stop (the atom states no entry rule — only
that validity and visa needs were *checked* is declared); a
maximum number of entries, stays, travellers or hotel moves;
a rest period after long hauls in hours; a price-freshness
window for a price timestamp (only that a timestamp is
carried is checked, never its age); a requirement that any
particular kind of entry exist beyond the skeleton
declarations (an itinerary of only ideas can pass if it is
labelled, ordered and consistent — state honesty, not
completeness of booking, is the discipline).

The verdict is one of `SINGLE_LIVING_TRIP_ITINERARY_READY`
(all 45 checks pass), `SINGLE_LIVING_TRIP_ITINERARY_NOT_READY`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails
but evidence is missing), across seven sections: trip_header,
entry_and_transit_constraints, entry_states_and_totals,
skeleton_and_ordering, conflicts_flagged,
predeparture_readthrough, red_lines.

## Distinct ground

The nearest neighbour is `fare-construction-savings-strategy`
(a declared fare-construction record — fare drivers explained,
a search strategy, a surfaced total cost of headline plus
fees/bags/seats, split-ticket construction legs and a declared
saving against a baseline direct fare). This atom shares
**zero checks** with it, and with every other atom in the
fleet (verified mechanically: every check name here was
compared against the `evaluate({})` check names of every
other atom's Python oracle — 124 oracles enumerated, zero
overlap — and against a static scan of every other oracle's
source, zero hits): every check here is an itinerary question
— one living record with its purpose, travellers and fixed
dates at the top; entry/transit/passport/visa/baggage/
connection-minimum checks declared done before routing; the
three-state discipline over the record's own entries (booked
entries carrying reference, total and terms; held entries
carrying expiry or timestamp; idea entries carrying no
booking reference; priced entries carrying their live-result
timestamp; the declared booked total re-derived from the
booked entries alone); the skeleton in date order with
entries inside the fixed window, none ending before it
starts, and consecutive movement legs connecting; conflicts
flagged rather than smoothed over; a pre-departure
read-through; and the trip-planning red lines (no date change
suggested, no idea or quote presented as a booking, no
invented prices/schedules/visa rules/availability, no routing
before constraints, no booking or payment without
authorization). The boundary is: the single itinerary record
and its internal consistency here; fare construction and
savings arithmetic over a fare record there. This atom never
searches live flights or hotels, never prices anything live,
and never books — the fare atom's search-strategy and
construction ground, and the booking skills' live ground,
stay theirs.

## Honest scoping

This atom audits a **declared** itinerary record — it
searches no flight, hotel, transport or activity inventory,
checks no live price, schedule, visa rule or availability,
verifies no booking reference with any carrier or property,
and books or pays for nothing. An itinerary is ready *on the
caller's declared evidence*: a record that declares its
constraints checked, its booked entries referenced and its
legs connecting passes those checks even if none of it ever
happened. It is a completeness and consistency audit of the
itinerary record the skill requires, **not a travel agent, a
booking service, or a guarantee that the trip is feasible,
legal to enter, or well-planned**: it never judges whether a
declared connection is actually long enough, whether a
declared visa check reached the right answer, whether a stay
fits the travellers, or whether the declared places and times
exist — only that the record contains what the skill's three
states, method, quality gates and red lines demand, and that
its declared entries are internally consistent (states,
references, totals, dates, window and leg connections).

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no live verification of any
declared fact; no entry, transit or visa *content* — the atom
states no country's rule and takes no position on whether any
traveller may enter or transit anywhere; no connection-time,
check-in-window or rest adequacy judgment (see the declined
thresholds above); no judgment of plan *quality* — whether
the route, pace or choices are good for the travellers is the
caller's declaration, checked only for declared presence and
consistency.

## U-13 regulatory screen

Classification: **(a) No outright.** This atom's output could
not read as regulated professional advice: it audits a
declared trip-itinerary record for completeness and internal
consistency against a trip-planning skill. It offers no
engineering-practice advice, no securities or financial
advice (the only arithmetic is re-deriving a declared booked
total from the record's own declared entry totals — a
consistency check over caller numbers, not a recommendation
about money), nothing psychology-adjacent, no medical advice,
and no legal advice — in particular it states no visa,
passport or entry rule for any country and takes no position
on any traveller's eligibility to enter or transit anywhere;
passport and visa matters appear only as caller declarations
that checks were performed, and the skill's own red line
against inventing visa rules is one of this atom's red-line
checks. No controls beyond that scoping are required; the
atom never searches, prices or books, so no travel-sale
surface arises either.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
