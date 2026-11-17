# Fare construction savings strategy — documentation

**Fare construction savings strategy** · slug `fare-construction-savings-strategy` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `trip_label` "NYC-LON-2025"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "fare-construction-savings-strategy"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the fare-construction-savings-strategy manifest.** You declare a record of a fare construction — the atom audits the record, it does not search fares, quote prices, or book anything (see Explanation). The recorded full-pass manifest declares the trip `NYC-LON-2025`: origin `JFK`, destination `LHR`, travel dates `2025-06-01` and flexibility `low`. It declares all four fare drivers explained or considered (advance purchase, day of week, nearby airports, split tickets); a search strategy given, and not a price alone without a strategy (`price_only_without_strategy: false`). Its total-cost figures are headline fare 500, fees 50, baggage fees 20 and seat fees 30, with a declared total cost of 600, the total cost surfaced and the headline fare not presented as the total cost. Its construction declares two legs, `Leg1` at 300 and `Leg2` at 250, a declared constructed total of 550, a baseline direct fare of 600 and declared savings of 50, with the constructed option compared to the direct option. Its price-integrity record declares prices not invented (`prices_invented: false`), a quoted fare presented as a starting point, rechecking before booking advised, and uncheckable items disclosed.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/fare-construction-savings-strategy` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY`: "21 pass, 0 fail, 0 missing of 21 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `legs_evaluated` is 2, `computed_total_cost` is `"600.000000"`, `computed_constructed_total` is `"550.000000"`, `computed_savings` is `"50.000000"`, and all three differences are `"0.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "fare-construction-savings-strategy"}`.
3. Call: `POST https://atoms.pipavia.com/v1/fare-construction-savings-strategy` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/fare-construction-savings-strategy` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `fare_construction_savings_strategy`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY` means at least one check has status `fail`: a field is present but false/invalid, or a declared value breaks a computed arithmetic rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `total_cost_matches_headline_plus_fees_bags_seats`, `declared_savings_matches_baseline_minus_constructed_total`, and the summary reads "19 pass, 2 fail, 0 missing of 21 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value in your manifest — for the two computed failures in the recorded run, correct the declared total cost or the declared savings so the declared arithmetic holds (the computed outputs show the re-derived values and the differences). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "total_cost.headline_fare",
  "detail": "total_cost.headline_fare must be a number"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/fare-construction-savings-strategy` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/fare-construction-savings-strategy` — tool name `fare_construction_savings_strategy`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `fare_construction_savings_strategy` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `trip_label` | string | Carried into the verdict output, not itself checked |

#### Read by: trip_definition

| Field | Type | Notes |
|---|---|---|
| `trip` | object | The trip section object — a present non-object value is rejected before evaluation |
| `trip.origin` | string | Must be non-empty to pass |
| `trip.destination` | string | Must be non-empty to pass |
| `trip.travel_dates` | string | Must be non-empty to pass |
| `trip.flexibility` | string | Must be non-empty to pass |

#### Read by: fare_drivers_explained

| Field | Type | Notes |
|---|---|---|
| `drivers` | object | The fare-drivers section object — a present non-object value is rejected before evaluation |
| `drivers.advance_purchase_explained` | boolean | — |
| `drivers.day_of_week_explained` | boolean | — |
| `drivers.nearby_airports_considered` | boolean | — |
| `drivers.split_tickets_considered` | boolean | — |

#### Read by: search_strategy

| Field | Type | Notes |
|---|---|---|
| `strategy` | object | The search-strategy section object — a present non-object value is rejected before evaluation |
| `strategy.search_strategy_given` | boolean | — |
| `strategy.price_only_without_strategy` | boolean | must be `false` to pass — skill step 3 |

#### Read by: total_cost_surface

| Field | Type | Notes |
|---|---|---|
| `total_cost` | object | The total-cost section object — a present non-object value is rejected before evaluation |
| `total_cost.headline_fare` | number | Computed, see below — part of the total-cost sum |
| `total_cost.fees` | number | Computed, see below — part of the total-cost sum |
| `total_cost.baggage_fees` | number | Computed, see below — part of the total-cost sum |
| `total_cost.seat_fees` | number | Computed, see below — part of the total-cost sum |
| `total_cost.declared_total_cost` | number | Computed, see below — must equal headline fare + fees + baggage fees + seat fees |
| `total_cost.total_cost_surfaced` | boolean | — |
| `total_cost.headline_presented_as_total_cost` | boolean | must be `false` to pass — skill rule |

#### Read by: fare_construction

| Field | Type | Notes |
|---|---|---|
| `construction` | object | The fare-construction section object — a present non-object value is rejected before evaluation |
| `construction.legs` | list | List of leg objects, each `{label, price}` — see the three entry fields below; computed, see below. Absent / empty = both leg-derived computed checks are missing; a present non-list value is rejected before evaluation |
| `construction.legs[]` | object | One declared construction leg entry — a present non-object entry is rejected before evaluation |
| `construction.legs[].label` | string | Must be non-empty for the entry to be complete |
| `construction.legs[].price` | number | — |
| `construction.declared_constructed_total` | number | Computed, see below — must equal the sum of the leg prices; also used in the savings arithmetic |
| `construction.baseline_direct_fare` | number | Computed, see below — used in the savings arithmetic |
| `construction.declared_savings` | number | Computed, see below — must equal baseline direct fare − declared constructed total; no minimum saving is imposed |
| `construction.constructed_option_compared_to_direct` | boolean | — |

#### Read by: price_integrity

| Field | Type | Notes |
|---|---|---|
| `integrity` | object | The price-integrity section object — a present non-object value is rejected before evaluation |
| `integrity.prices_invented` | boolean | must be `false` to pass — skill red line |
| `integrity.quoted_fare_presented_as_starting_point` | boolean | — |
| `integrity.recheck_before_booking_advised` | boolean | — |
| `integrity.uncheckable_items_disclosed` | boolean | — |

### Checks

All 21 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: this atom has no conditional (gated) checks, so there is no not-applicable per-check status. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: trip_definition

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `origin_declared` | step 1: the trip origin is declared | Pass: the field is declared as a non-empty string. Fail: it is present but empty / invalid. Missing: the field is absent. |
| `destination_declared` | step 1: the trip destination is declared | Pass: the field is declared as a non-empty string. Fail: it is present but empty / invalid. Missing: the field is absent. |
| `travel_dates_declared` | step 1: the travel dates are declared | Pass: the field is declared as a non-empty string. Fail: it is present but empty / invalid. Missing: the field is absent. |
| `flexibility_declared` | step 1: the traveller's date flexibility is declared | Pass: the field is declared as a non-empty string. Fail: it is present but empty / invalid. Missing: the field is absent. |

#### Section: fare_drivers_explained

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `advance_purchase_driver_explained` | step 2: the advance-purchase driver is explained for this route | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `day_of_week_driver_explained` | step 2: the day-of-week driver is explained for this route | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `nearby_airports_considered` | step 2: nearby airports are considered for this route | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `split_tickets_considered` | step 2: split tickets are considered for this route | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: search_strategy

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `search_strategy_given` | step 3: a search strategy is given, not just a price | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `not_price_only_without_strategy` | step 3: the record is not a price alone without a strategy | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

#### Section: total_cost_surface

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `total_cost_surfaced` | rule: the total cost is surfaced to the caller, not only the headline fare | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `headline_not_presented_as_total_cost` | rule: the headline fare is never presented as the cost | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `total_cost_matches_headline_plus_fees_bags_seats` | rule: the declared total cost equals the declared headline fare plus the declared fees, baggage fees and seat fees (fees, bags, seats are surfaced, never folded silently into the headline) | Computed over the declared values. Pass: the declared total cost equals headline fare + fees + baggage fees + seat fees (the fixed-6dp difference is zero). Fail: all the numbers the rule reads are present and the declared total differs. Missing: any of headline fare, fees, baggage fees, seat fees or the declared total cost is absent, so the check cannot be completed. |

#### Section: fare_construction

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `construction_legs_complete` | every construction leg carries a label and a price | Computed over the declared legs. Pass: the leg list is present and non-empty and every leg carries a non-empty `label` and a `price`. Missing: the leg list is absent / empty, or a leg is incomplete (missing / empty `label`, missing `price`) — an incomplete leg makes both leg-derived computed checks missing, per SERVICE.md; no fail outcome is defined for this check. |
| `constructed_total_matches_sum_of_leg_prices` | the declared constructed total equals the sum of the declared construction leg prices | Computed over the declared legs. Pass: the declared constructed total equals the sum of the declared leg prices (the fixed-6dp difference is zero). Fail: the legs are complete, the declared constructed total is present, and it differs from the sum. Missing: the leg list is absent / empty / incomplete, or the declared constructed total is absent, so the total cannot be re-derived. |
| `declared_savings_matches_baseline_minus_constructed_total` | the declared savings equal the declared baseline direct fare minus the declared constructed total (no minimum saving is imposed — the skill states none; only the arithmetic is re-derived) | Computed over the declared values. Pass: the declared savings equal baseline direct fare − declared constructed total (the fixed-6dp difference is zero); a matching zero or negative declared saving passes — no minimum is imposed. Fail: all the numbers the rule reads are present and the declared savings differ. Missing: any of baseline direct fare, declared constructed total or declared savings is absent. |
| `constructed_option_compared_to_direct` | the constructed option is compared against the direct option on the record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: price_integrity

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `prices_not_invented` | rule: prices are never invented | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `quoted_fare_presented_as_starting_point_not_promise` | rule: a quoted fare is presented as a starting point, not a promise | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `recheck_before_booking_advised` | rule: rechecking the fare before booking is advised | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uncheckable_items_disclosed` | rule: what cannot be checked is said, not silently omitted | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"fare-construction-savings-strategy"`), `atom_version` (`"0.1.0"`), and `trip_label` (the manifest's declared trip label value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `legs_evaluated` (the count of complete construction legs, as an integer; `0` when no legs are declared); `computed_constructed_total` and `constructed_total_difference`, `computed_total_cost` and `total_cost_difference`, and `computed_savings` and `savings_difference` (computed amounts as strings with exactly six decimal places; a computed total is null when it cannot be re-derived — for the total cost when any of headline fare, fees, baggage fees or seat fees is absent, for the constructed total when the leg list is absent, empty or incomplete, and for savings when the baseline direct fare or the declared constructed total is absent — and a difference is null when either its declared or its computed value cannot be computed). Computed amounts use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; computed comparisons compare the fixed-6dp difference to zero — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "21 pass, 0 fail, 0 missing of 21 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared `trip_label` value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY` — all 21 checks pass: the declared fare-construction record is complete and consistent with the skill's method on the declared evidence.
- `FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY` — at least one check fails: a declared value contradicts a requirement, or a declared total or savings value breaks its computed arithmetic rule. The failing checks name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (the four computed checks only — `total_cost_matches_headline_plus_fees_bags_seats`, `construction_legs_complete`, `constructed_total_matches_sum_of_leg_prices`, `declared_savings_matches_baseline_minus_constructed_total`): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one computed check cannot be completed because the values or legs it reads are absent or incomplete.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent (for the leg-derived computed checks: the leg list is absent / empty, or a leg is incomplete).

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the fare_construction_savings_strategy scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the fare_construction_savings_strategy scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"total_cost.headline_fare","detail":"total_cost.headline_fare must be a number"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for fare-construction-savings-strategy exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = query (one query = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Lowest-cost travel booking guidance (FareSutra), as bound from the `travel-fares` skill. You submit one declared record — the fare-construction-savings-strategy manifest: its trip definition, its fare-driver explanations, its search-strategy record, its surfaced total-cost figures, its constructed itinerary legs and savings declaration, and its price-integrity record — and the atom validates that record deterministically, returning one deterministic verdict across 6 sections (`trip_definition`, `fare_drivers_explained`, `search_strategy`, `total_cost_surface`, `fare_construction`, `price_integrity`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared field: a declared boolean `true` passes (for must-be-false fields, declared `false` passes; for the trip string fields, a non-empty string passes); present-but-opposite or empty/invalid fails; absent is `missing`. *Computed checks* are calculated from the declared values themselves — the total-cost sum, the constructed-total leg sum, and the declared-savings arithmetic, plus the leg-completeness check those sums depend on — using only what the skill itself states plus the arithmetic of the declared numbers, with no outside threshold imported. This atom has no conditional (gated) checks. Aggregation is strict: any `fail` anywhere produces `FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented — the skill states none of the following numbers, so this atom imposes none of them: (1) no minimum savings amount or savings percentage a construction must achieve; (2) no advance-purchase window in days (the skill names advance purchase as a driver and states no window); (3) no cheapest day-of-week ranking; (4) no nearby-airport distance or radius; (5) no maximum acceptable total cost or traveller budget cap; (6) no fare-recheck interval or quote-validity period (only that rechecking before booking is advised is checked, as a declaration); (7) no required leg count for a construction beyond at least one complete declared leg, and no requirement that a construction be a split ticket rather than any other declared leg set; (8) no caps on fees, baggage fees or seat fees — only that they are declared and summed into the surfaced total.

**What it does NOT do.** The atom audits a **declared** fare-construction record — it does not search for fares, quote or verify any price, check that a declared fare exists or is current, or book anything. A record is ready *on the caller's declared evidence* even if its fares are stale. It is a completeness and consistency audit, **not a fare search**: whether a fare is genuinely the lowest available, whether a declared price is real or still bookable, whether the search strategy will in fact find a lower fare, and whether a constructed itinerary is wise for this traveller (connection risk, separate-ticket consequences, schedule fit) are judgments this atom never makes; they are carried only as caller declarations (`integrity.*`, `strategy.*`, `construction.constructed_option_compared_to_direct`) and are never judged here. Named exclusions: no fare search or price quotation; no verification of any declared fare, fee, leg price or saving; no lowest-fare, savings-adequacy or construction-wisdom judgment; no booking or rebooking; no live verification of any declared fact.

**Buyer and use context.** Teams and agents working in Everyday life who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: finding lowest fares for trips — Wright is an internal caller on this atom (zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared fare-construction record; its verdict is a completeness and consistency judgment on declared evidence, not compliance or audit evidence, and fare construction is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `fare_construction_savings_strategy` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed amounts are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/fare_construction_savings_strategy.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_fare_construction_savings_strategy.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/fare-construction-savings-strategy` (REST) and `POST /mcp/fare-construction-savings-strategy` (MCP, tool `fare_construction_savings_strategy`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `fare_construction_savings_strategy`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T04:26:41.895784+00:00 against gateway v1.1.0, external verification lane, source `verification/work/fare-construction-savings-strategy/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "trip_definition",
      "check": "origin_declared",
      "status": "pass",
      "evidence": "step 1: the trip origin is declared"
    },
    {
      "section": "trip_definition",
      "check": "destination_declared",
      "status": "pass",
      "evidence": "step 1: the trip destination is declared"
    },
    {
      "section": "trip_definition",
      "check": "travel_dates_declared",
      "status": "pass",
      "evidence": "step 1: the travel dates are declared"
    },
    {
      "section": "trip_definition",
      "check": "flexibility_declared",
      "status": "pass",
      "evidence": "step 1: the traveller's date flexibility is declared"
    },
    {
      "section": "fare_drivers_explained",
      "check": "advance_purchase_driver_explained",
      "status": "pass",
      "evidence": "step 2: the advance-purchase driver is explained for this route"
    },
    {
      "section": "fare_drivers_explained",
      "check": "day_of_week_driver_explained",
      "status": "pass",
      "evidence": "step 2: the day-of-week driver is explained for this route"
    },
    {
      "section": "fare_drivers_explained",
      "check": "nearby_airports_considered",
      "status": "pass",
      "evidence": "step 2: nearby airports are considered for this route"
    },
    {
      "section": "fare_drivers_explained",
      "check": "split_tickets_considered",
      "status": "pass",
      "evidence": "step 2: split tickets are considered for this route"
    },
    {
      "section": "search_strategy",
      "check": "search_strategy_given",
      "status": "pass",
      "evidence": "step 3: a search strategy is given, not just a price"
    },
    {
      "section": "search_strategy",
      "check": "not_price_only_without_strategy",
      "status": "pass",
      "evidence": "step 3: the record is not a price alone without a strategy"
    },
    {
      "section": "total_cost_surface",
      "check": "total_cost_surfaced",
      "status": "pass",
      "evidence": "rule: the total cost is surfaced to the caller, not only the headline fare"
    },
    {
      "section": "total_cost_surface",
      "check": "headline_not_presented_as_total_cost",
      "status": "pass",
      "evidence": "rule: the headline fare is never presented as the cost"
    },
    {
      "section": "total_cost_surface",
      "check": "total_cost_matches_headline_plus_fees_bags_seats",
      "status": "pass",
      "evidence": "rule: the declared total cost equals the declared headline fare plus the declared fees, baggage fees and seat fees (fees, bags, seats are surfaced, never folded silently into the headline)"
    },
    {
      "section": "fare_construction",
      "check": "construction_legs_complete",
      "status": "pass",
      "evidence": "every construction leg carries a label and a price"
    },
    {
      "section": "fare_construction",
      "check": "constructed_total_matches_sum_of_leg_prices",
      "status": "pass",
      "evidence": "the declared constructed total equals the sum of the declared construction leg prices"
    },
    {
      "section": "fare_construction",
      "check": "declared_savings_matches_baseline_minus_constructed_total",
      "status": "pass",
      "evidence": "the declared savings equal the declared baseline direct fare minus the declared constructed total (no minimum saving is imposed \u2014 the skill states none; only the arithmetic is re-derived)"
    },
    {
      "section": "fare_construction",
      "check": "constructed_option_compared_to_direct",
      "status": "pass",
      "evidence": "the constructed option is compared against the direct option on the record"
    },
    {
      "section": "price_integrity",
      "check": "prices_not_invented",
      "status": "pass",
      "evidence": "rule: prices are never invented"
    },
    {
      "section": "price_integrity",
      "check": "quoted_fare_presented_as_starting_point_not_promise",
      "status": "pass",
      "evidence": "rule: a quoted fare is presented as a starting point, not a promise"
    },
    {
      "section": "price_integrity",
      "check": "recheck_before_booking_advised",
      "status": "pass",
      "evidence": "rule: rechecking the fare before booking is advised"
    },
    {
      "section": "price_integrity",
      "check": "uncheckable_items_disclosed",
      "status": "pass",
      "evidence": "rule: what cannot be checked is said, not silently omitted"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "legs_evaluated": 2,
  "computed_constructed_total": "550.000000",
  "constructed_total_difference": "0.000000",
  "computed_total_cost": "600.000000",
  "total_cost_difference": "0.000000",
  "computed_savings": "50.000000",
  "savings_difference": "0.000000",
  "summary": "21 pass, 0 fail, 0 missing of 21 checks across six sections.",
  "stamp": "FARE CONSTRUCTION SAVINGS STRATEGY\ntrip_label: NYC-LON-2025\nVERDICT: FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY\n  trip_definition              pass\n  fare_drivers_explained       pass\n  search_strategy              pass\n  total_cost_surface           pass\n  fare_construction            pass\n  price_integrity              pass\n21 pass, 0 fail, 0 missing of 21 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

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
    "declared_total_cost": 999.0,
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
    "declared_savings": 100.0,
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

Response (HTTP 200):

```json
{
  "service": "fare-construction-savings-strategy",
  "atom_version": "0.1.0",
  "trip_label": "NYC-LON-2025",
  "verdict": "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY",
  "sections": {
    "trip_definition": "pass",
    "fare_drivers_explained": "pass",
    "search_strategy": "pass",
    "total_cost_surface": "fail",
    "fare_construction": "fail",
    "price_integrity": "pass"
  },
  "checks": [
    {
      "section": "trip_definition",
      "check": "origin_declared",
      "status": "pass",
      "evidence": "step 1: the trip origin is declared"
    },
    {
      "section": "trip_definition",
      "check": "destination_declared",
      "status": "pass",
      "evidence": "step 1: the trip destination is declared"
    },
    {
      "section": "trip_definition",
      "check": "travel_dates_declared",
      "status": "pass",
      "evidence": "step 1: the travel dates are declared"
    },
    {
      "section": "trip_definition",
      "check": "flexibility_declared",
      "status": "pass",
      "evidence": "step 1: the traveller's date flexibility is declared"
    },
    {
      "section": "fare_drivers_explained",
      "check": "advance_purchase_driver_explained",
      "status": "pass",
      "evidence": "step 2: the advance-purchase driver is explained for this route"
    },
    {
      "section": "fare_drivers_explained",
      "check": "day_of_week_driver_explained",
      "status": "pass",
      "evidence": "step 2: the day-of-week driver is explained for this route"
    },
    {
      "section": "fare_drivers_explained",
      "check": "nearby_airports_considered",
      "status": "pass",
      "evidence": "step 2: nearby airports are considered for this route"
    },
    {
      "section": "fare_drivers_explained",
      "check": "split_tickets_considered",
      "status": "pass",
      "evidence": "step 2: split tickets are considered for this route"
    },
    {
      "section": "search_strategy",
      "check": "search_strategy_given",
      "status": "pass",
      "evidence": "step 3: a search strategy is given, not just a price"
    },
    {
      "section": "search_strategy",
      "check": "not_price_only_without_strategy",
      "status": "pass",
      "evidence": "step 3: the record is not a price alone without a strategy"
    },
    {
      "section": "total_cost_surface",
      "check": "total_cost_surfaced",
      "status": "pass",
      "evidence": "rule: the total cost is surfaced to the caller, not only the headline fare"
    },
    {
      "section": "total_cost_surface",
      "check": "headline_not_presented_as_total_cost",
      "status": "pass",
      "evidence": "rule: the headline fare is never presented as the cost"
    },
    {
      "section": "total_cost_surface",
      "check": "total_cost_matches_headline_plus_fees_bags_seats",
      "status": "fail",
      "evidence": "rule: the declared total cost equals the declared headline fare plus the declared fees, baggage fees and seat fees (fees, bags, seats are surfaced, never folded silently into the headline)"
    },
    {
      "section": "fare_construction",
      "check": "construction_legs_complete",
      "status": "pass",
      "evidence": "every construction leg carries a label and a price"
    },
    {
      "section": "fare_construction",
      "check": "constructed_total_matches_sum_of_leg_prices",
      "status": "pass",
      "evidence": "the declared constructed total equals the sum of the declared construction leg prices"
    },
    {
      "section": "fare_construction",
      "check": "declared_savings_matches_baseline_minus_constructed_total",
      "status": "fail",
      "evidence": "the declared savings equal the declared baseline direct fare minus the declared constructed total (no minimum saving is imposed \u2014 the skill states none; only the arithmetic is re-derived)"
    },
    {
      "section": "fare_construction",
      "check": "constructed_option_compared_to_direct",
      "status": "pass",
      "evidence": "the constructed option is compared against the direct option on the record"
    },
    {
      "section": "price_integrity",
      "check": "prices_not_invented",
      "status": "pass",
      "evidence": "rule: prices are never invented"
    },
    {
      "section": "price_integrity",
      "check": "quoted_fare_presented_as_starting_point_not_promise",
      "status": "pass",
      "evidence": "rule: a quoted fare is presented as a starting point, not a promise"
    },
    {
      "section": "price_integrity",
      "check": "recheck_before_booking_advised",
      "status": "pass",
      "evidence": "rule: rechecking the fare before booking is advised"
    },
    {
      "section": "price_integrity",
      "check": "uncheckable_items_disclosed",
      "status": "pass",
      "evidence": "rule: what cannot be checked is said, not silently omitted"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "legs_evaluated": 2,
  "computed_constructed_total": "550.000000",
  "constructed_total_difference": "0.000000",
  "computed_total_cost": "600.000000",
  "total_cost_difference": "399.000000",
  "computed_savings": "50.000000",
  "savings_difference": "50.000000",
  "summary": "19 pass, 2 fail, 0 missing of 21 checks across six sections.",
  "stamp": "FARE CONSTRUCTION SAVINGS STRATEGY\ntrip_label: NYC-LON-2025\nVERDICT: FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY\n  trip_definition              pass\n  fare_drivers_explained       pass\n  search_strategy              pass\n  total_cost_surface           fail\n  fare_construction            fail\n  price_integrity              pass\n19 pass, 2 fail, 0 missing of 21 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "trip_label": "Malformed",
  "total_cost": {
    "headline_fare": "should-be-a-number"
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "total_cost.headline_fare",
  "detail": "total_cost.headline_fare must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared fare-construction record; its verdict is a completeness and consistency judgment on declared evidence, not compliance or audit evidence, and fare construction is not a regulated domain. |
| Checks named | 21 documented / 21 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (no not-applicable per-check status — this atom has no gated checks) |
| Input reference typed | Yes — 36 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/fare-construction-savings-strategy/evidence.json` |
