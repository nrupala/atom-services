# Fare construction savings strategy — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a fare-construction record and want it checked for completeness and internal consistency. This atom reads one declared manifest and returns one deterministic verdict across six sections: **FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY**, **FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record only — it does not search fares, quote or verify any price, check that a declared fare exists or is current, judge whether a fare is genuinely the lowest available or a construction is wise for the traveller, or book anything. A record is ready *on your declared evidence* even if its fares are stale. Computed checks: the declared total cost must equal the headline fare plus fees, baggage fees and seat fees; the declared constructed total must equal the sum of the declared construction leg prices (every leg must carry a non-empty label and a price); and the declared savings must equal the baseline direct fare minus the declared constructed total. No numeric threshold is imposed — no minimum savings amount or percentage, no advance-purchase window, no cheapest day-of-week ranking, no nearby-airport distance, no maximum total cost or budget cap, no fare-recheck interval, no required leg count beyond at least one complete declared leg, and no caps on fees, baggage fees or seat fees. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "fare-construction-savings-strategy"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/fare-construction-savings-strategy` — tool name `fare_construction_savings_strategy`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/fare-construction-savings-strategy` — body = the manifest object; same `Authorization` header.

## Input — the fare-construction-savings-strategy manifest

| Field | Meaning |
|---|---|
| `trip_label` | trip name (string; carried into the output, not checked) |
| `trip.origin` (string) | trip evidence: the origin is declared (must be non-empty to pass) |
| `trip.destination` (string) | trip evidence: the destination is declared (must be non-empty to pass) |
| `trip.travel_dates` (string) | trip evidence: the travel dates are declared (must be non-empty to pass) |
| `trip.flexibility` (string) | trip evidence: the traveller's date flexibility is declared (must be non-empty to pass) |
| `drivers.advance_purchase_explained` | fare-driver evidence: the advance-purchase driver is explained for this route |
| `drivers.day_of_week_explained` | fare-driver evidence: the day-of-week driver is explained for this route |
| `drivers.nearby_airports_considered` | fare-driver evidence: nearby airports are considered for this route |
| `drivers.split_tickets_considered` | fare-driver evidence: split tickets are considered for this route |
| `strategy.search_strategy_given` | search-strategy evidence: a search strategy is given, not just a price |
| `strategy.price_only_without_strategy` | must be `false` to pass (the record is not a price alone without a strategy) |
| `total_cost.headline_fare` (number) | computed: part of the total-cost sum (headline fare) |
| `total_cost.fees` (number) | computed: part of the total-cost sum (fees) |
| `total_cost.baggage_fees` (number) | computed: part of the total-cost sum (baggage fees) |
| `total_cost.seat_fees` (number) | computed: part of the total-cost sum (seat fees) |
| `total_cost.declared_total_cost` (number) | computed: must equal headline fare + fees + baggage fees + seat fees |
| `total_cost.total_cost_surfaced` | total-cost evidence: the total cost is surfaced, not only the headline fare |
| `total_cost.headline_presented_as_total_cost` | must be `false` to pass (the headline fare is never presented as the cost) |
| `construction.legs` (list of `{label, price}` objects) | computed: must be present and non-empty with complete legs; reported as `legs_evaluated` |
| `construction.legs[].label` (string) | computed: every leg must carry a non-empty label for the entry to be complete |
| `construction.legs[].price` (number) | computed: every leg must carry a price; the leg prices are summed for the constructed total |
| `construction.declared_constructed_total` (number) | computed: must equal the sum of the leg prices; also used in the savings arithmetic |
| `construction.baseline_direct_fare` (number) | computed: the baseline direct fare used in the savings arithmetic |
| `construction.declared_savings` (number) | computed: must equal baseline direct fare − declared constructed total (no minimum saving is imposed) |
| `construction.constructed_option_compared_to_direct` | construction evidence: the constructed option is compared against the direct option |
| `integrity.prices_invented` | must be `false` to pass (prices are never invented) |
| `integrity.quoted_fare_presented_as_starting_point` | price-integrity evidence: a quoted fare is presented as a starting point, not a promise |
| `integrity.recheck_before_booking_advised` | price-integrity evidence: rechecking the fare before booking is advised |
| `integrity.uncheckable_items_disclosed` | price-integrity evidence: what cannot be checked is disclosed, not silently omitted |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/fare-construction-savings-strategy`:

```json
{
  "trip_label": "NYC-LON-2025",
  "trip": {
    "origin": "JFK",
    "destination": "LHR",
    "travel_dates": "2025-06-01",
    "flexibility": "low"
  },
  "drivers": {
    "advance_purchase_explained": true,
    "day_of_week_explained": true,
    "nearby_airports_considered": true,
    "split_tickets_considered": true
  },
  "strategy": {
    "search_strategy_given": true,
    "price_only_without_strategy": false
  },
  "total_cost": {
    "headline_fare": 500.0,
    "fees": 50.0,
    "baggage_fees": 20.0,
    "seat_fees": 30.0,
    "declared_total_cost": 600.0,
    "total_cost_surfaced": true,
    "headline_presented_as_total_cost": false
  },
  "construction": {
    "legs": [
      {
        "label": "Leg1",
        "price": 300.0
      },
      {
        "label": "Leg2",
        "price": 250.0
      }
    ],
    "declared_constructed_total": 550.0,
    "baseline_direct_fare": 600.0,
    "declared_savings": 50.0,
    "constructed_option_compared_to_direct": true
  },
  "integrity": {
    "prices_invented": false,
    "quoted_fare_presented_as_starting_point": true,
    "recheck_before_booking_advised": true,
    "uncheckable_items_disclosed": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 21 checks and a text stamp of the verdict):

```json
{
  "service": "fare-construction-savings-strategy",
  "atom_version": "0.1.0",
  "trip_label": "NYC-LON-2025",
  "verdict": "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY",
  "sections": {
    "trip_definition": "pass",
    "fare_drivers_explained": "pass",
    "search_strategy": "pass",
    "total_cost_surface": "pass",
    "fare_construction": "pass",
    "price_integrity": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "legs_evaluated": 2,
  "computed_constructed_total": "550.000000",
  "constructed_total_difference": "0.000000",
  "computed_total_cost": "600.000000",
  "total_cost_difference": "0.000000",
  "computed_savings": "50.000000",
  "savings_difference": "0.000000",
  "summary": "21 pass, 0 fail, 0 missing of 21 checks across six sections."
}
```

## Verdicts

- **FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY** — every check passes; the declared fare-construction record is complete and consistent with the skill's method on the declared evidence.
- **FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `legs_evaluated` (the count of complete construction legs, as an integer; `0` when no legs are declared), `computed_constructed_total` and `constructed_total_difference`, `computed_total_cost` and `total_cost_difference`, and `computed_savings` and `savings_difference` (computed amounts as strings with exactly six decimal places; a computed total is null when it cannot be re-derived — for the total cost when any of headline fare, fees, baggage fees or seat fees is absent, for the constructed total when the leg list is absent, empty or incomplete, and for savings when the baseline direct fare or the declared constructed total is absent — and a difference is null when either its declared or its computed value cannot be computed), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the four computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
