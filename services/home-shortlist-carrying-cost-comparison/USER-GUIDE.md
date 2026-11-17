# Home shortlist carrying cost comparison — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are searching for a home and tracking candidate homes in a shortlist. This atom reads one declared home-shortlist record — the criteria written before searching, the tracked candidate homes with their declared figures, the tracking record, and the presentation record — and returns one deterministic verdict across five sections: **HOME_SHORTLIST_COMPARISON_READY**, **HOME_SHORTLIST_COMPARISON_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and arithmetic only — it fetches no listings, searches no listing source, and values no homes. It does not verify that a declared listing exists, that a declared price or fee is what the source stated, that a fetch date is real, or that a home is still available: a comparison is ready *on your declared evidence*. It is a completeness and arithmetic audit, **not a real-estate service or advice**: it never judges whether a home is worth its price, whether the declared budget is affordable for you, whether a declared tax or utilities figure is realistic for the area, or which home you should buy. Computed checks: the declared `homes` list must be present and non-empty; every home must name a non-empty `listing_source` and `fetch_date`, declare a `status` from the four statuses the skill names (`live`, `ruled_out`, `viewed`, `awaiting_information`), and declare whether it meets the criteria; every `ruled_out` home must name a non-empty `ruled_out_reason`; every home must declare its `asking_price` and all four monthly cost components; and every home's `declared_monthly_carrying_cost` must equal the re-derived sum of its four declared monthly components (`monthly_housing_payment` + `monthly_property_tax` + `monthly_utilities_estimate` + `monthly_condo_or_hoa_fees`). The budget comparison is reported, never failed: a home is over budget exactly when its declared `asking_price` exceeds the declared `criteria.budget_ceiling`. No numeric threshold is imposed beyond the record's own rules — no affordability ratio or income multiple, no mortgage interest rate, amortization term, or down-payment assumption (the housing payment is declared, never derived from the asking price), no fetch-date staleness age, no property-tax annual-to-monthly conversion (monthly figures are declared directly), no carrying-cost gap that bars a home, no minimum or maximum shortlist size beyond non-empty, and no currency vocabulary or exchange conversion. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "home-shortlist-carrying-cost-comparison"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/home-shortlist-carrying-cost-comparison` — tool name `home_shortlist_carrying_cost_comparison`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/home-shortlist-carrying-cost-comparison` — body = the manifest object; same `Authorization` header.

## Input — the home-shortlist-carrying-cost-comparison manifest

| Field | Meaning |
|---|---|
| `search_name` | search name (string; carried into the output, not checked) |
| `currency` | currency all declared figures are in (string; must be non-empty to pass — absent = missing evidence, empty string = fail; no currency vocabulary is imposed) |
| `criteria.written_before_search` | criteria evidence: the criteria were written down before listings were gathered |
| `criteria.area` | criteria evidence: the search area (string; must be non-empty to pass; absent = missing, empty = fail) |
| `criteria.property_type` | criteria evidence: the property type (string; must be non-empty to pass; absent = missing, empty = fail) |
| `criteria.budget_ceiling` | criteria evidence: your declared asking-price ceiling in the declared currency (number; must be > 0 to pass; absent = missing); also drives the reported budget-comparison outputs |
| `criteria.must_haves_defined` | criteria evidence: the must-haves are defined in writing |
| `criteria.deal_breakers_defined` | criteria evidence: the deal-breakers are defined in writing |
| `homes` (list of home-row objects) | computed: must be present and non-empty; reported as `homes_count` |
| `homes[].name` (string) | names the row in the computed outputs; a row without a string name is reported as `unnamed` |
| `homes[].listing_source` (string) | computed: every row must name a non-empty string; rows that do not are reported in `homes_without_listing_source` (field absent from a row = missing evidence, empty string = fail) |
| `homes[].fetch_date` (string) | computed: the date the listing was fetched, as declared; every row must name a non-empty string; rows that do not are reported in `homes_without_fetch_date` (absent = missing, empty = fail; the format and age are not judged) |
| `homes[].status` (string) | computed: every row must declare one of `live`, `ruled_out`, `viewed`, `awaiting_information`; rows naming any other value are reported in `homes_with_invalid_status` (field absent from a row = missing evidence) |
| `homes[].ruled_out_reason` (string) | computed: required non-empty when the row's status is `ruled_out`; a ruled-out row with an empty reason is reported in `ruled_out_homes_without_reason` (absent from a ruled-out row = missing evidence and does not appear in that list; not read for other statuses) |
| `homes[].asking_price` (number) | computed: every row must declare a positive amount; also compared against `criteria.budget_ceiling` for the reported budget outputs |
| `homes[].monthly_housing_payment` (number) | computed component: your declared monthly mortgage or rent payment (must be >= 0; absent = missing; never derived from the asking price) |
| `homes[].monthly_property_tax` (number) | computed component: declared monthly property tax (must be >= 0; absent = missing) |
| `homes[].monthly_utilities_estimate` (number) | computed component: declared monthly utilities estimate (must be >= 0; absent = missing) |
| `homes[].monthly_condo_or_hoa_fees` (number) | computed component: declared monthly condo or HOA fees (must be >= 0 — zero declares none; absent = missing) |
| `homes[].declared_monthly_carrying_cost` (number) | computed: your own stated monthly total for the row; must equal the re-derived sum of the four components above, or the row is reported in `homes_with_carrying_cost_mismatch` (absent = missing) |
| `homes[].open_questions` (list of strings) | computed: must be declared per row — an empty list declares no open questions (field absent from a row = missing evidence) |
| `homes[].meets_criteria` | computed: your fit declaration per row (field absent from a row = missing evidence); rows declared `false` are reported in `homes_not_meeting_criteria` |
| `tracking.tracked_in_one_list` | tracking evidence: the candidates are tracked in one list |
| `tracking.refreshed_before_comparison` | tracking evidence: stale candidates were refreshed before the comparison |
| `tracking.criteria_market_conflict_addressed` | tracking evidence: where criteria and market reality conflict, that is addressed plainly |
| `presentation.ranked_on_carrying_cost_not_price_alone` | presentation evidence: the shortlist is ranked on carrying cost, not price alone |
| `presentation.sources_and_fetch_dates_attached` | presentation evidence: sources and fetch dates are attached to the shortlist |
| `presentation.unknowns_presented_as_questions` | presentation evidence: unknowns are presented as questions, not assumptions |
| `presentation.freshness_limits_stated` | presentation evidence: the freshness limits are stated |
| `presentation.presented_as_research_not_advice` | presentation evidence: the comparison is presented as research, not advice |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward HOME_SHORTLIST_COMPARISON_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/home-shortlist-carrying-cost-comparison`:

```json
{
  "search_name": "Calgary Family Home",
  "currency": "CAD",
  "criteria": {
    "written_before_search": true,
    "area": "NW Calgary",
    "property_type": "Detached",
    "budget_ceiling": 600000,
    "must_haves_defined": true,
    "deal_breakers_defined": true
  },
  "homes": [
    {
      "name": "Home A",
      "listing_source": "MLS",
      "fetch_date": "2023-10-01",
      "status": "live",
      "asking_price": 550000,
      "monthly_housing_payment": 2500,
      "monthly_property_tax": 300,
      "monthly_utilities_estimate": 200,
      "monthly_condo_or_hoa_fees": 0,
      "declared_monthly_carrying_cost": 3000,
      "open_questions": [],
      "meets_criteria": true
    }
  ],
  "tracking": {
    "tracked_in_one_list": true,
    "refreshed_before_comparison": true,
    "criteria_market_conflict_addressed": true
  },
  "presentation": {
    "ranked_on_carrying_cost_not_price_alone": true,
    "sources_and_fetch_dates_attached": true,
    "unknowns_presented_as_questions": true,
    "freshness_limits_stated": true,
    "presented_as_research_not_advice": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 25 checks and a text stamp of the verdict):

```json
{
  "service": "home-shortlist-carrying-cost-comparison",
  "atom_version": "0.1.0",
  "search_name": "Calgary Family Home",
  "verdict": "HOME_SHORTLIST_COMPARISON_READY",
  "sections": {
    "criteria_first": "pass",
    "candidate_records": "pass",
    "carrying_cost_computation": "pass",
    "tracking_and_refresh": "pass",
    "ranking_and_presentation": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "homes_count": 1,
  "monthly_carrying_costs": [
    {
      "name": "Home A",
      "monthly_carrying_cost": "3000.000000"
    }
  ],
  "total_monthly_carrying_cost": "3000.000000",
  "lowest_monthly_carrying_cost": "3000.000000",
  "highest_monthly_carrying_cost": "3000.000000",
  "carrying_cost_spread": "0.000000",
  "ranked_home_names": ["Home A"],
  "cheapest_home_name": "Home A",
  "cost_figure_coverage": "1.000000",
  "homes_without_listing_source": [],
  "homes_without_fetch_date": [],
  "homes_with_invalid_status": [],
  "ruled_out_homes_without_reason": [],
  "homes_not_meeting_criteria": [],
  "homes_with_carrying_cost_mismatch": [],
  "homes_over_budget_ceiling": [],
  "homes_within_budget_count": 1,
  "any_home_within_budget": true,
  "summary": "25 pass, 0 fail, 0 missing of 25 checks across five sections."
}
```

## Verdicts

- **HOME_SHORTLIST_COMPARISON_READY** — every check passes; the declared home-shortlist record is complete and its declared totals re-derive from its declared components.
- **HOME_SHORTLIST_COMPARISON_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `homes_count` (the declared list length as an integer, or null when the list is not declared), `monthly_carrying_costs` (one `{name, monthly_carrying_cost}` entry per declared home, in declared order; null when the list is not declared — a row missing any component has a null cost entry and is excluded from the totals and the ranking), `total_monthly_carrying_cost` (the sum over homes with complete cost figures; null when no home has complete figures), `lowest_monthly_carrying_cost`, `highest_monthly_carrying_cost` and `carrying_cost_spread` (highest − lowest; each null under the same condition), `ranked_home_names` (homes with complete cost figures ranked by re-derived monthly carrying cost, ascending, ties in declared order; null when the list is not declared), `cheapest_home_name` (the first ranked home, or null), `cost_figure_coverage` (homes with complete cost figures ÷ declared homes), the row-name lists `homes_without_listing_source`, `homes_without_fetch_date`, `homes_with_invalid_status`, `ruled_out_homes_without_reason`, `homes_not_meeting_criteria` and `homes_with_carrying_cost_mismatch` (null when the `homes` list is not declared), the budget outputs `homes_over_budget_ceiling`, `homes_within_budget_count` and `any_home_within_budget` (all null when the homes list or the ceiling is not declared), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the seven primary computed checks cannot be completed). Computed amounts and ratios are strings with exactly six decimal places (round half up to 6dp: `floor(v * 1000000 + 0.5) / 1000000`, then formatted with exactly six decimals); counts are integers.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
