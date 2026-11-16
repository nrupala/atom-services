# Home shortlist carrying cost comparison — `home-shortlist-carrying-cost-comparison`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Support a home search with defined criteria, real comparable listings and full carrying-cost comparison — organized research, not real-estate advice

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one query.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Calgary family home search**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the home-shortlist manifest

The caller submits one JSON manifest: a declared home-search
record for one search — the criteria written before searching,
the tracked candidate homes with their declared figures, the
tracking record, and the presentation record. Every field below
is read by the named section's checks. A field **absent** =
evidence missing (`INSUFFICIENT_EVIDENCE`); a field present but
false / invalid = the check fails
(`HOME_SHORTLIST_COMPARISON_NOT_READY`). All fields are booleans
unless noted.

| Field | Type | Read by |
|---|---|---|
| `search_name` | string (carried into the verdict output, not itself checked) | — |
| `currency` | string (must be a non-empty string for the check to pass — an absent field is missing evidence, an empty string fails; no currency vocabulary is imposed) | criteria_first |
| `criteria.written_before_search` | boolean | criteria_first |
| `criteria.area` | string (must be non-empty for the check to pass; absent = missing, empty = fail) | criteria_first |
| `criteria.property_type` | string (must be non-empty for the check to pass; absent = missing, empty = fail) | criteria_first |
| `criteria.budget_ceiling` | number (the caller's declared asking-price ceiling in the declared currency; must be > 0 for the check to pass; absent = missing) | criteria_first, carrying_cost_computation (budget comparison outputs) |
| `criteria.must_haves_defined` | boolean | criteria_first |
| `criteria.deal_breakers_defined` | boolean | criteria_first |
| `homes` | list of home-row objects, each with the entry fields below (computed, see below) | candidate_records, carrying_cost_computation |
| `homes[].name` | string (names the row in the computed outputs; a row without a string name is reported as `unnamed`) | candidate_records, carrying_cost_computation |
| `homes[].listing_source` | string (must be non-empty per row for the check to pass; field absent from a row = missing evidence, empty string = fail) | candidate_records |
| `homes[].fetch_date` | string (the date the listing was fetched, as declared; must be non-empty per row; absent = missing, empty = fail; the format and age are not judged — see the declined thresholds) | candidate_records |
| `homes[].status` | string (must be one of the four statuses the skill names — `live`, `ruled_out`, `viewed`, `awaiting_information`; field absent from a row = missing evidence, any other value = fail) | candidate_records |
| `homes[].ruled_out_reason` | string (required non-empty when the row's status is `ruled_out`; absent from a ruled-out row = missing evidence, empty = fail; not read for other statuses) | candidate_records |
| `homes[].asking_price` | number (must be > 0 per row for the check to pass; absent = missing) | carrying_cost_computation |
| `homes[].monthly_housing_payment` | number (the caller-declared monthly mortgage or rent payment; must be >= 0; absent = missing. Never derived from the asking price — see the declined thresholds) | carrying_cost_computation |
| `homes[].monthly_property_tax` | number (declared monthly property tax; must be >= 0; absent = missing) | carrying_cost_computation |
| `homes[].monthly_utilities_estimate` | number (declared monthly utilities estimate; must be >= 0; absent = missing) | carrying_cost_computation |
| `homes[].monthly_condo_or_hoa_fees` | number (declared monthly condo or HOA fees; must be >= 0 — zero declares none; absent = missing) | carrying_cost_computation |
| `homes[].declared_monthly_carrying_cost` | number (the caller's own stated monthly total for the row, re-derived and compared — see below; absent = missing) | carrying_cost_computation |
| `homes[].open_questions` | list of strings (the field must be declared per row — an empty list declares no open questions; field absent from a row = missing evidence) | candidate_records |
| `homes[].meets_criteria` | boolean (the caller's fit declaration per row; field absent from a row = missing evidence) | candidate_records |
| `tracking.tracked_in_one_list` | boolean | tracking_and_refresh |
| `tracking.refreshed_before_comparison` | boolean | tracking_and_refresh |
| `tracking.criteria_market_conflict_addressed` | boolean | tracking_and_refresh |
| `presentation.ranked_on_carrying_cost_not_price_alone` | boolean | ranking_and_presentation |
| `presentation.sources_and_fetch_dates_attached` | boolean | ranking_and_presentation |
| `presentation.unknowns_presented_as_questions` | boolean | ranking_and_presentation |
| `presentation.freshness_limits_stated` | boolean | ranking_and_presentation |
| `presentation.presented_as_research_not_advice` | boolean | ranking_and_presentation |

Several values are computed from the declared rows, using only
the declared figures plus the skill's own stated rules — no
outside threshold is imported:

- **Homes declared:** the declared `homes` list passes only when
  it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Listing source and fetch date per home:** every declared home
  row must name a non-empty `listing_source` and `fetch_date`
  (the skill's quality gate: "Every candidate names its listing
  source and fetch date"). A row with the field absent is missing
  evidence; a row naming an empty string fails and is named in
  `homes_without_listing_source` / `homes_without_fetch_date`.
- **Status per home:** every row must declare a `status` from the
  four statuses the skill names (method step 6: live, ruled out,
  viewed, awaiting information). A row with the field absent is
  missing evidence; a row naming any other value fails and is
  named in `homes_with_invalid_status`.
- **Ruled-out reason:** every row with `status: ruled_out` must
  name a non-empty `ruled_out_reason` (the quality gate:
  "Ruled-out homes carry a reason, not just a deletion"). A
  ruled-out row with the field absent is missing evidence; an
  empty reason fails and the home is named in
  `ruled_out_homes_without_reason` (a ruled-out row with the field
  absent does not appear in that list). Searches with no
  ruled-out rows pass as not applicable.
- **Monthly carrying cost per home:** the sum of the row's four
  declared monthly components — `monthly_housing_payment` +
  `monthly_property_tax` + `monthly_utilities_estimate` +
  `monthly_condo_or_hoa_fees` (method step 3 names the full
  picture; step 4 requires one comparable monthly carrying cost
  per candidate). A row missing any component has no computed
  cost (its entry in `monthly_carrying_costs` is null) and is
  excluded from the totals and the ranking.
- **Declared-total consistency:** every row's
  `declared_monthly_carrying_cost` must equal the re-derived sum
  of its components; a mismatch fails and the home is named in
  `homes_with_carrying_cost_mismatch`.
- **Budget comparison (reported, never failed):** a home is over
  budget exactly when its declared `asking_price` exceeds the
  declared `criteria.budget_ceiling`. `homes_over_budget_ceiling`
  names those homes, `homes_within_budget_count` counts the
  priced homes at or under the ceiling, and
  `any_home_within_budget` reports whether any priced home is
  within it. All three are null when the homes list or the
  ceiling is not declared. Being over budget is market reality to
  show plainly (method step 7), not a defect in the record.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the seven primary computed checks above cannot be completed),
`homes_count` (the declared list length, or null when the list is
not declared — counts are reported as integers, exactly),
`monthly_carrying_costs` (one `{name, monthly_carrying_cost}`
entry per declared home, in declared order; null when the list
is not declared), `total_monthly_carrying_cost` (the sum over
homes with complete cost figures; null when no home has complete
figures), `lowest_monthly_carrying_cost`,
`highest_monthly_carrying_cost` and `carrying_cost_spread`
(highest − lowest; each null under the same condition),
`ranked_home_names` (homes with complete cost figures ranked by
re-derived monthly carrying cost, ascending, ties in declared
order; null when the list is not declared),
`cheapest_home_name` (the first ranked home, or null),
`cost_figure_coverage` (homes with complete cost figures ÷
declared homes), and `homes_not_meeting_criteria` (homes whose
declared `meets_criteria` is present and false; null when the
list is not declared).
**Fixed serialization rule:** computed amounts and ratios are
reported as strings with exactly six decimal places, produced in
both implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; the declared-total comparison uses the fixed-6dp
difference against zero. An amount is null when its inputs are
not declared, exactly as stated per field above. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric pass/fail threshold beyond its own
rules — no affordability ratio, no income figure, no interest
rate: its budget ceiling is the caller's own declared number,
and quantities are computed and reported against it without any
bar of the atom's. Declined thresholds, named: an affordability
ratio or income multiple (the skill sets no share-of-income bar
— the caller's declared ceiling is the only budget figure); a
mortgage interest rate, amortization term, or down-payment
assumption for deriving a housing payment from an asking price
(the skill states none — the housing payment is caller-declared,
never derived); a fetch-date staleness age in days (the skill
says refresh stale candidates but states no age — caller
attestation only, and the fetch date's format is not judged); a
property-tax annual-to-monthly conversion (callers declare
monthly figures directly — no divisor is assumed); a
carrying-cost gap or spread that would make one home "too
expensive" relative to another (costs are ranked and reported,
never barred); a minimum or maximum shortlist size beyond
non-empty; a currency vocabulary or exchange conversion (one
declared currency per record, figures summed as declared).

The verdict is one of `HOME_SHORTLIST_COMPARISON_READY` (all 25
checks pass), `HOME_SHORTLIST_COMPARISON_NOT_READY` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across five sections: criteria_first,
candidate_records, carrying_cost_computation, tracking_and_refresh,
ranking_and_presentation.

## Honest scoping

This atom compares a **declared** home-shortlist record — it
fetches no listings, searches no listing source, and values no
homes. It does not verify that a declared listing exists, that a
declared price or fee is what the source stated, that a fetch
date is real, or that a home is still available: a comparison is
ready *on the caller's declared evidence*. It is a completeness
and arithmetic audit of the record the skill requires, **not a
real-estate service or advice**: it never judges whether a home
is worth its price, whether the declared budget is affordable for
the caller, whether a declared tax or utilities figure is
realistic for the area, or which home the caller should buy —
only that the record contains what the skill's method, quality
gates and red lines demand, that its declared totals re-derive
from its declared components, and how its declared homes rank on
the declared figures.

Named exclusions: no numeric thresholds beyond the skill's own
stated rules (see the declined list above); no listing search,
fetch, or availability check; no home valuation or price
verification; no mortgage calculation (payments are declared,
never derived); no neighbourhood, commute, school, or services
assessment (the skill lists those as search considerations — no
field in this record carries them, and no check here audits
them); no rental-versus-buy judgment beyond the same arithmetic
applied to declared figures (a rental home declares its rent as
its housing payment).

## Pricing

Pricing unit: **query**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Self-use marginal; no active search
