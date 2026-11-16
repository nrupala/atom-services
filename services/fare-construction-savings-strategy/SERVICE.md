# Fare construction savings strategy — `fare-construction-savings-strategy`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Lowest-cost travel booking guidance (FareSutra).

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one query.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Everyday life who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Finding lowest fares for trips**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the fare-construction-savings-strategy manifest

This atom does not search fares, quote prices, or book anything,
and exercises no travel judgment. The caller submits one JSON
manifest declaring a fare-construction record — its trip
definition, its fare-driver explanations, its search-strategy
record, its surfaced total-cost figures, its constructed
itinerary legs and savings declaration, and its price-integrity
record — and the atom validates that record deterministically.
Every field below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a field
present but false / invalid = the check fails
(`FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY`). All fields are
booleans unless noted. Explicit type notes for every
non-boolean field: `trip_label`, `trip.origin`,
`trip.destination`, `trip.travel_dates` and `trip.flexibility`
are strings; `total_cost.headline_fare`, `total_cost.fees`,
`total_cost.baggage_fees`, `total_cost.seat_fees`,
`total_cost.declared_total_cost`,
`construction.declared_constructed_total`,
`construction.baseline_direct_fare`,
`construction.declared_savings` and
`construction.legs[].price` are numbers;
`construction.legs` is a list of leg objects (absent / not a
list / empty = the two leg-derived computed checks are
missing); `construction.legs[].label` is a string (must be
non-empty for the entry to be complete). A documented field
present with the wrong type is rejected before evaluation
(TypeError naming the field path), never evaluated.

| Field | Read by |
|---|---|
| `trip_label` (string; carried into the verdict output, not itself checked) | — |
| `trip.origin` (string; must be non-empty to pass) | trip_definition |
| `trip.destination` (string; must be non-empty to pass) | trip_definition |
| `trip.travel_dates` (string; must be non-empty to pass) | trip_definition |
| `trip.flexibility` (string; must be non-empty to pass) | trip_definition |
| `drivers.advance_purchase_explained` | fare_drivers_explained |
| `drivers.day_of_week_explained` | fare_drivers_explained |
| `drivers.nearby_airports_considered` | fare_drivers_explained |
| `drivers.split_tickets_considered` | fare_drivers_explained |
| `strategy.search_strategy_given` | search_strategy |
| `strategy.price_only_without_strategy` (must be `false` to pass — skill step 3) | search_strategy |
| `total_cost.headline_fare` (number; computed, see below) | total_cost_surface |
| `total_cost.fees` (number; computed, see below) | total_cost_surface |
| `total_cost.baggage_fees` (number; computed, see below) | total_cost_surface |
| `total_cost.seat_fees` (number; computed, see below) | total_cost_surface |
| `total_cost.declared_total_cost` (number; computed, see below) | total_cost_surface |
| `total_cost.total_cost_surfaced` | total_cost_surface |
| `total_cost.headline_presented_as_total_cost` (must be `false` to pass — skill rule) | total_cost_surface |
| `construction.legs` (list of leg objects; absent / not a list / empty = both leg-derived computed checks missing) | fare_construction |
| `construction.legs[].label` (string; must be non-empty for the entry to be complete) | fare_construction |
| `construction.legs[].price` (number) | fare_construction |
| `construction.declared_constructed_total` (number; computed, see below) | fare_construction |
| `construction.baseline_direct_fare` (number; computed, see below) | fare_construction |
| `construction.declared_savings` (number; computed, see below) | fare_construction |
| `construction.constructed_option_compared_to_direct` | fare_construction |
| `integrity.prices_invented` (must be `false` to pass — skill red line) | price_integrity |
| `integrity.quoted_fare_presented_as_starting_point` | price_integrity |
| `integrity.recheck_before_booking_advised` | price_integrity |
| `integrity.uncheckable_items_disclosed` | price_integrity |

Three checks are computed from the declared values, using only
what the skill itself states plus the arithmetic of the declared
numbers — no outside threshold is imported:

- **Total cost:** the skill's rule is "Surface the total: fees,
  bags, seats. The headline fare is never the cost." The
  declared `total_cost.declared_total_cost` therefore passes
  only when it equals `total_cost.headline_fare` +
  `total_cost.fees` + `total_cost.baggage_fees` +
  `total_cost.seat_fees`. The output reports
  `computed_total_cost` and `total_cost_difference` (declared
  minus computed, null when either cannot be computed).
- **Constructed total:** the skill names split tickets among
  the fare drivers, and a construction is its declared legs.
  The declared `construction.declared_constructed_total`
  therefore passes only when it equals the sum of the declared
  `construction.legs[].price` values. A missing or empty leg
  list is missing evidence; an incomplete leg (missing /
  empty `label`, missing `price`) makes both leg-derived
  checks missing (the total cannot be re-derived). The output
  reports `legs_evaluated` (the count of complete legs),
  `computed_constructed_total` and
  `constructed_total_difference` (declared minus computed,
  null likewise).
- **Declared savings:** the declared
  `construction.declared_savings` passes only when it equals
  `construction.baseline_direct_fare` −
  `construction.declared_constructed_total`. The skill states
  no minimum saving, so **no minimum is imposed** — only the
  arithmetic is re-derived, and a matching zero or negative
  declared saving passes the arithmetic check as the caller's
  own declaration. The output reports `computed_savings` and
  `savings_difference` (declared minus computed, null when
  either cannot be computed).

**Fixed serialization rule:** computed amounts are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly
six decimals; computed comparisons compare the fixed-6dp
difference to zero. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the four computed checks cannot be completed).

The verdict is one of `FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY`
(all 21 checks pass),
`FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence
is missing), across six sections: trip_definition,
fare_drivers_explained, search_strategy, total_cost_surface,
fare_construction, price_integrity.

**Declined thresholds (named, not imposed):** the skill states
none of the following numbers, so this atom imposes none of
them — (1) no minimum savings amount or savings percentage a
construction must achieve; (2) no advance-purchase window in
days (the skill names advance purchase as a driver and states
no window); (3) no cheapest day-of-week ranking; (4) no
nearby-airport distance or radius; (5) no maximum acceptable
total cost or traveller budget cap; (6) no fare-recheck
interval or quote-validity period (only that rechecking before
booking is advised is checked, as a declaration); (7) no
required leg count for a construction beyond at least one
complete declared leg, and no requirement that a construction
be a split ticket rather than any other declared leg set;
(8) no caps on fees, baggage fees or seat fees — only that
they are declared and summed into the surfaced total.

## Honest scoping

This atom audits a **declared** fare-construction record — it
does not search for fares, quote or verify any price, check
that a declared fare exists or is current, or book anything.
The register's named doubt for this atom — FareSutra
product-internal, separable as strategy — is answered by this
framing: the record declares its own trip, drivers, strategy,
figures, legs and savings, and this core checks only their
internal consistency and the completeness of the skill's
method on the declared evidence. A record is ready *on the
caller's declared evidence* even if its fares are stale. It is
a completeness and consistency audit, **not a fare search**:
the non-reducible parts are stated plainly — whether a fare is
genuinely the lowest available, whether a declared price is
real or still bookable, whether the search strategy will in
fact find a lower fare, and whether a constructed itinerary is
wise for this traveller (connection risk, separate-ticket
consequences, schedule fit) are judgments this atom never
makes; they are carried only as caller declarations
(`integrity.*`, `strategy.*`,
`construction.constructed_option_compared_to_direct`) and are
never judged here.

Named exclusions: no fare search or price quotation; no
verification of any declared fare, fee, leg price or saving;
no lowest-fare, savings-adequacy or construction-wisdom
judgment; no booking or rebooking; no live verification of any
declared fact.

## Pricing

Pricing unit: **query**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Anchor doubt: FareSutra product-internal, separable as strategy
