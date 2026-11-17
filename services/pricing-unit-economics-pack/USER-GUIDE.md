# Pricing unit economics pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are reviewing the pricing of one product — its revenue model, its price tiers, its discount guardrails, its unit economics, its churn and MRR record — and you have a declared record of that review. This atom reads one declared manifest and returns one deterministic verdict across six sections (revenue_model_and_recognition, pricing_and_packaging, discount_and_payment_guardrails, unit_economics, churn_retention_and_reporting, red_lines): **PRICING_UNIT_ECONOMICS_PACK_READY**, **PRICING_UNIT_ECONOMICS_PACK_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 37 checks. It audits the declared pricing / unit-economics record's completeness and arithmetic consistency only — it sets no price, inspects no accounting system, CRM, price list, contract or ledger, runs no market or competitor analysis, and does not verify that a declared record was ever carried out. A record is ready *on your declared evidence*: it never judges whether a price is right, whether a margin is good, whether a discount should have been given, whether the declared assumptions are realistic, or whether the product will sell. It is not a pricing service, a revenue forecast, an accounting or tax opinion, or financial advice of any kind. The skill's advice-shaped steps are excluded and are red lines here, not features: working out what the unit economics say about pricing, recommending a price, tier structure, discount or deal, projecting revenue, MRR or churn forward, and valuing a customer (LTV) or a business are never performed — the atom audits the record of decisions you have already made. The computed checks: the declared `model_kind` must be one of the four kinds the skill names (`one_time`, `subscription`, `usage` or `hybrid`); the declared `tiers` list must be present (an empty list passes — it declares that the record prices no tier); every tier row must declare all six entry fields with a non-empty `name`; no tier name may be duplicated; every row's `declared_revenue` must equal its `price` × `units` and its `declared_contribution` must equal (`price` − `variable_cost_per_unit`) × `units`; the declared `discounts` list must be present (an empty list declares that no discounts were given); every discount row must log a non-empty `reason`; no discount label may be duplicated; the declared contribution-margin ratio must equal (`price_per_unit` − `variable_cost_per_unit`) ÷ `price_per_unit`; the declared break-even units must equal `fixed_costs` ÷ (`price_per_unit` − `variable_cost_per_unit`); the declared total contribution must equal `units_sold` × (`price_per_unit` − `variable_cost_per_unit`); and the declared closing MRR must equal opening + new + expansion − contraction − churned MRR. No numeric threshold is imposed — no minimum or target contribution margin, gross margin or markup; no maximum discount percentage or amount and no floor-price level the atom would set itself; no churn, retention or expansion-revenue bar; no LTV, CAC, ARPU or payback figure, ratio (such as LTV/CAC) or ceiling — the skill names ARPU, LTV, CAC and payback months as unit-economics numbers but states no formula and no bar for any of them, so none is computed, checked or reported here; no price point, price increase or elasticity figure for any tier; no break-even deadline or maximum break-even volume beyond the arithmetic consistency of the declared figures; no MRR/ARR growth rate or bridge-component bar; no cohort size or observation window; no refund, credit or dunning period or amount; and no forecast range width. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "pricing-unit-economics-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/pricing-unit-economics-pack` — tool name `pricing_unit_economics_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/pricing-unit-economics-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `product` | Product name (string; carried into the output, not checked) |
| `revenue_model.model_kind` (string) | computed: must be one of `one_time`, `subscription`, `usage` or `hybrid` |
| `revenue_model.bookings_billings_and_recognized_revenue_kept_distinct` | revenue model evidence: bookings, billings and recognized revenue are kept distinct |
| `revenue_model.recognition_timing_documented` | revenue model evidence: revenue recognition timing is documented |
| `revenue_model.accountant_alignment_on_recognition_declared` | revenue model evidence: recognition timing is aligned with the accountant |
| `pricing.value_based_anchor_documented` | pricing evidence: the value-based anchor is documented |
| `pricing.good_better_best_tiers_declared` | pricing evidence: good-better-best tiers are declared |
| `pricing.price_change_grandfathering_plan_present` | pricing evidence: price changes carry a grandfathering plan |
| `pricing.pricing_reviewed_annually_declared` | pricing evidence: pricing is reviewed annually |
| `tiers` (list of price-tier row objects) | computed: must be present (an empty list declares that the record prices no tier); reported as `tiers_count` |
| `tiers[].name` (string) | names the row in the computed outputs; computed: must be non-empty per row and no name may appear on more than one row |
| `tiers[].price` (number) | the tier's declared price point |
| `tiers[].variable_cost_per_unit` (number) | the tier's declared variable cost per unit |
| `tiers[].units` (number) | declared volume at this tier |
| `tiers[].declared_revenue` (number) | computed: must equal `price` × `units` |
| `tiers[].declared_contribution` (number) | computed: must equal (`price` − `variable_cost_per_unit`) × `units` |
| `discount_policy.approval_matrix_present` | discount guardrail evidence: a discount approval matrix exists |
| `discount_policy.floor_prices_set` | discount guardrail evidence: floor prices are set |
| `discount_policy.deal_desk_for_exceptions_present` | discount guardrail evidence: a deal desk handles exceptions |
| `discount_policy.refund_and_credit_policy_present` | guardrail evidence: a refund and credit policy exists |
| `discount_policy.failed_payment_dunning_process_present` | guardrail evidence: failed-payment handling (dunning) is in place |
| `discount_policy.fraud_and_dispute_basics_present` | guardrail evidence: fraud and dispute basics are in place |
| `discounts` (list of discount-row objects) | computed: must be present (an empty list declares that no discounts were given); reported as `discounts_count` |
| `discounts[].label` (string) | names the row in the computed outputs; computed: no label may appear on more than one row |
| `discounts[].reason` (string) | computed: every row must log a present, non-empty reason; rows with the field present but empty are reported in `discounts_without_reason` |
| `unit_economics.assumptions_stated` | unit-economics evidence: the assumptions behind the figures are stated |
| `unit_economics.assumptions_conservative_declared` | unit-economics evidence: the stated assumptions are declared conservative |
| `unit_economics.unit_economics_updated_quarterly_declared` | unit-economics evidence: the figures are updated quarterly |
| `unit_economics.price_per_unit` (number) | declared price per unit |
| `unit_economics.variable_cost_per_unit` (number) | declared variable cost per unit |
| `unit_economics.fixed_costs` (number) | declared fixed costs |
| `unit_economics.units_sold` (number) | declared units sold |
| `unit_economics.declared_contribution_margin_ratio` (number) | computed: must equal (`price_per_unit` − `variable_cost_per_unit`) ÷ `price_per_unit` |
| `unit_economics.declared_break_even_units` (number) | computed: must equal `fixed_costs` ÷ (`price_per_unit` − `variable_cost_per_unit`) |
| `unit_economics.declared_total_contribution` (number) | computed: must equal `units_sold` × (`price_per_unit` − `variable_cost_per_unit`) |
| `churn.gross_and_net_churn_kept_distinct` | churn evidence: gross churn and net churn are kept distinct |
| `churn.cohort_curves_used_not_single_period_averages` | churn evidence: retention is read from cohort curves, not single-period averages |
| `churn.expansion_revenue_tracked` | churn evidence: expansion revenue is tracked |
| `mrr_bridge.opening_mrr` (number) | declared opening MRR |
| `mrr_bridge.new_mrr` (number) | declared new MRR |
| `mrr_bridge.expansion_mrr` (number) | declared expansion MRR |
| `mrr_bridge.contraction_mrr` (number) | declared contraction MRR |
| `mrr_bridge.churned_mrr` (number) | declared churned MRR |
| `mrr_bridge.declared_closing_mrr` (number) | computed: must equal opening + new + expansion − contraction − churned MRR |
| `reporting.cash_collection_and_recognized_revenue_kept_distinct` | reporting evidence: cash collection and recognized revenue are kept distinct |
| `reporting.forecast_inputs_handed_over_with_ranges_declared` | reporting evidence: forecast inputs are handed over with ranges (this atom hands inputs over; it forecasts nothing itself) |
| `red_lines.bookings_presented_as_revenue_present` | must be `false` to pass (red line: no bookings presented as revenue) |
| `red_lines.unrecorded_discounts_present` | must be `false` to pass (red line: no unrecorded discounts) |
| `red_lines.improvised_recognition_decisions_present` | must be `false` to pass (red line: no improvised recognition decisions) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward PRICING_UNIT_ECONOMICS_PACK_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/pricing-unit-economics-pack`:

```json
{
  "product": "SaaS-Platform-Alpha",
  "revenue_model": {
    "model_kind": "subscription",
    "bookings_billings_and_recognized_revenue_kept_distinct": true,
    "recognition_timing_documented": true,
    "accountant_alignment_on_recognition_declared": true
  },
  "pricing": {
    "value_based_anchor_documented": true,
    "good_better_best_tiers_declared": true,
    "price_change_grandfathering_plan_present": true,
    "pricing_reviewed_annually_declared": true
  },
  "tiers": [
    {
      "name": "Basic",
      "price": 100.0,
      "variable_cost_per_unit": 20.0,
      "units": 10,
      "declared_revenue": 1000.0,
      "declared_contribution": 800.0
    }
  ],
  "discount_policy": {
    "approval_matrix_present": true,
    "floor_prices_set": true,
    "deal_desk_for_exceptions_present": true,
    "refund_and_credit_policy_present": true,
    "failed_payment_dunning_process_present": true,
    "fraud_and_dispute_basics_present": true
  },
  "discounts": [
    {
      "label": "EarlyBird",
      "reason": "Launch promotion"
    }
  ],
  "unit_economics": {
    "assumptions_stated": true,
    "assumptions_conservative_declared": true,
    "unit_economics_updated_quarterly_declared": true,
    "price_per_unit": 100.0,
    "variable_cost_per_unit": 20.0,
    "fixed_costs": 500.0,
    "units_sold": 10,
    "declared_contribution_margin_ratio": 0.8,
    "declared_break_even_units": 6.25,
    "declared_total_contribution": 800.0
  },
  "churn": {
    "gross_and_net_churn_kept_distinct": true,
    "cohort_curves_used_not_single_period_averages": true,
    "expansion_revenue_tracked": true
  },
  "mrr_bridge": {
    "opening_mrr": 1000.0,
    "new_mrr": 200.0,
    "expansion_mrr": 50.0,
    "contraction_mrr": 10.0,
    "churned_mrr": 40.0,
    "declared_closing_mrr": 1200.0
  },
  "reporting": {
    "cash_collection_and_recognized_revenue_kept_distinct": true,
    "forecast_inputs_handed_over_with_ranges_declared": true
  },
  "red_lines": {
    "bookings_presented_as_revenue_present": false,
    "unrecorded_discounts_present": false,
    "improvised_recognition_decisions_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 37 checks and a text stamp of the verdict):

```json
{
  "service": "pricing-unit-economics-pack",
  "atom_version": "0.1.0",
  "product": "SaaS-Platform-Alpha",
  "verdict": "PRICING_UNIT_ECONOMICS_PACK_READY",
  "sections": {
    "revenue_model_and_recognition": "pass",
    "pricing_and_packaging": "pass",
    "discount_and_payment_guardrails": "pass",
    "unit_economics": "pass",
    "churn_retention_and_reporting": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "tiers_count": 1,
  "duplicate_tier_names": [],
  "tiers_mismatching_revenue": [],
  "tiers_mismatching_contribution": [],
  "total_declared_tier_revenue": "1000.000000",
  "total_declared_tier_contribution": "800.000000",
  "tier_contribution_margin": "0.800000",
  "discounts_count": 1,
  "discounts_without_reason": [],
  "duplicate_discount_labels": [],
  "discount_reason_coverage": "1.000000",
  "computed_contribution_margin_ratio": "0.800000",
  "contribution_margin_difference": "0.000000",
  "computed_break_even_units": "6.250000",
  "break_even_difference": "0.000000",
  "computed_total_contribution": "800.000000",
  "total_contribution_difference": "0.000000",
  "computed_closing_mrr": "1200.000000",
  "closing_mrr_difference": "0.000000",
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across six sections."
}
```

## Verdicts

- **PRICING_UNIT_ECONOMICS_PACK_READY** — every check passes; the declared pricing / unit-economics record is complete and arithmetically consistent with the skill's checklist and red lines.
- **PRICING_UNIT_ECONOMICS_PACK_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `tiers_count` and `discounts_count` (the declared list lengths as integers, or null when a list is not declared), `duplicate_tier_names` and `duplicate_discount_labels` (names declared on more than one row, in the order their second occurrence appears; null when the list is not declared), the row-name lists `tiers_mismatching_revenue` and `tiers_mismatching_contribution` (rows whose figures are all declared and whose declared revenue / contribution does not re-derive; null when the `tiers` list is not declared), `discounts_without_reason` (discounts whose reason field is present but empty; null when the `discounts` list is not declared), the sums `total_declared_tier_revenue` and `total_declared_tier_contribution` (null when any row lacks the figure), the ratio `tier_contribution_margin` (total contribution ÷ total revenue; null when the totals are absent or revenue is zero), the coverage ratio `discount_reason_coverage` (discounts logging a reason ÷ declared discounts; null when there are no declared discounts), and the re-derived figures with their differences against the declared figures: `computed_contribution_margin_ratio`, `contribution_margin_difference`, `computed_break_even_units`, `break_even_difference`, `computed_total_contribution`, `total_contribution_difference`, `computed_closing_mrr` and `closing_mrr_difference` (each null when its inputs are not all declared or its denominator is zero; computed amounts and ratios are strings with exactly six decimal places), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the thirteen primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
