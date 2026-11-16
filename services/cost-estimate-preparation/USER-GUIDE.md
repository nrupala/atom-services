# Cost estimate preparation — user guide

## What it does

You have a cost estimate artifact — its basis document (class, method, assumptions, exclusions, estimator), its element line items, its three-point uncertainty items, its declared totals chain, its should-cost / vendor-quote record and its estimate-vs-actual feedback record. This atom reads one declared manifest and returns one deterministic verdict across six sections: **COST_ESTIMATE_READY**, **COST_ESTIMATE_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not produce an estimate, price your work, or judge whether the numbers are realistic. Computed checks: the declared estimate class must be one of the stated tokens (`concept_rom`, `budget`, `definitive`) and the method one of (`bottom_up`, `parametric`, `analogous`) — no class percentage band is imposed as a pass mark; each declared line amount must equal its quantity × unit rate and the declared subtotal must equal the sum of the declared line amounts; each three-point item must be in optimistic ≤ likely ≤ pessimistic order and its declared spread must equal pessimistic − optimistic (the declared expected value is presence-checked only — no expected-value formula is stated, so none is imposed); the declared contingency amount must equal subtotal × contingency percent and the declared escalation amount must equal subtotal × escalation percent (neither percent is fixed, so neither is judged); the declared grand total must equal subtotal + declared contingency + declared escalation; and the declared should-cost variance percent must equal (vendor quote − should-cost benchmark) / benchmark × 100 with a non-zero benchmark (whether the variance is acceptable is not judged). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "cost-estimate-preparation"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/cost-estimate-preparation` — tool name `cost_estimate_preparation`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/cost-estimate-preparation` — body = the manifest object; same `Authorization` header.

## Input — the cost-estimate-preparation manifest

| Field | Meaning |
|---|---|
| `entity` | entity name (string; carried into the output, not checked) |
| `basis.document_present` | a basis document is present for the estimate |
| `basis.estimate_class` (string) | computed: must be one of the stated tokens — `concept_rom`, `budget`, `definitive` |
| `basis.method` (string) | computed: must be one of the stated tokens — `bottom_up`, `parametric`, `analogous` |
| `basis.assumptions_documented` / `exclusions_documented` / `estimator_identified` | basis document evidence |
| `elements.breakdown_not_lump_sum` / `labor_burden_included` | element breakdown and labor burden evidence |
| `elements.hidden_padding_in_rates` | must be `false` to pass |
| `line_items` (list of line-item entries) | computed: each entry needs a non-empty `label` (string), a non-empty `category` (string; validated as a string only, never enum-checked — no category coverage is imposed), and numeric `quantity`, `unit_rate` and `declared_amount`; each declared amount must equal quantity × unit rate; reported as `line_items_evaluated`, `computed_subtotal` and `subtotal_difference` (6 decimal places) |
| `uncertainty.ranges_stated_for_material_uncertainty` | ranges stated for material uncertainty |
| `uncertainty.items` (list of three-point items) | computed: each item needs a non-empty `label` (string) and numeric `optimistic`, `likely`, `pessimistic`, `declared_expected_value` (presence only — no formula is imposed) and `declared_spread`; points must be in optimistic ≤ likely ≤ pessimistic order and each declared spread must equal pessimistic − optimistic; reported as `uncertainty_items_evaluated`, `computed_total_spread` and `total_spread_difference` (6 decimal places) |
| `uncertainty.expected_values_stated` | expected values stated alongside spreads |
| `uncertainty.single_number_precision_on_uncertain_scope` | must be `false` to pass |
| `totals.declared_subtotal` (number) | computed: must equal the sum of the declared line amounts (see `line_items`) |
| `totals.contingency_percent` (number), `totals.declared_contingency_amount` (number) | computed: declared contingency amount must equal declared subtotal × contingency percent / 100 (the percent itself is never a pass mark); reported as `computed_contingency_amount` and `contingency_difference` (6 decimal places) |
| `totals.escalation_percent` (number), `totals.declared_escalation_amount` (number) | computed: declared escalation amount must equal declared subtotal × escalation percent / 100 (the percent itself is never a pass mark); reported as `computed_escalation_amount` and `escalation_difference` (6 decimal places) |
| `totals.declared_grand_total` (number) | computed: must equal declared subtotal + declared contingency amount + declared escalation amount; reported as `computed_grand_total` and `grand_total_difference` (6 decimal places) |
| `totals.escalation_impacts_stated` / `currency_impacts_stated` / `quote_validity_dates_captured` | escalation, currency and quote-validity evidence |
| `should_cost.benchmark_built_for_big_items` / `quote_compared_to_benchmark` | should-cost benchmark evidence |
| `should_cost.vendor_quote_amount` (number), `should_cost.should_cost_amount` (number), `should_cost.declared_variance_percent` (number) | computed: declared variance must equal (vendor quote − should-cost benchmark) / benchmark × 100, with a non-zero benchmark; reported as `computed_quote_variance_percent` and `quote_variance_difference` (6 decimal places) |
| `should_cost.divergences_explained` / `quote_exclusions_reviewed` / `quote_assumptions_reviewed` / `validity_period_respected` | quote discipline evidence |
| `should_cost.quote_accepted_without_scope_review` | must be `false` to pass |
| `feedback.estimate_vs_actual_tracked_per_item` / `rates_updated_from_actuals` / `variance_lessons_published` | estimate-vs-actual feedback evidence |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward COST_ESTIMATE_NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/cost-estimate-preparation`:

```json
{
  "entity": "Project Alpha",
  "basis": {
    "document_present": true,
    "estimate_class": "definitive",
    "method": "bottom_up",
    "assumptions_documented": true,
    "exclusions_documented": true,
    "estimator_identified": true
  },
  "elements": {
    "breakdown_not_lump_sum": true,
    "labor_burden_included": true,
    "hidden_padding_in_rates": false
  },
  "line_items": [
    {
      "label": "Labor",
      "category": "labor",
      "quantity": 100.0,
      "unit_rate": 50.0,
      "declared_amount": 5000.0
    }
  ],
  "uncertainty": {
    "ranges_stated_for_material_uncertainty": true,
    "items": [
      {
        "label": "Risk A",
        "optimistic": 10.0,
        "likely": 20.0,
        "pessimistic": 30.0,
        "declared_expected_value": 20.0,
        "declared_spread": 20.0
      }
    ],
    "expected_values_stated": true,
    "single_number_precision_on_uncertain_scope": false
  },
  "totals": {
    "declared_subtotal": 5000.0,
    "contingency_percent": 10.0,
    "declared_contingency_amount": 500.0,
    "escalation_percent": 5.0,
    "declared_escalation_amount": 250.0,
    "declared_grand_total": 5750.0,
    "escalation_impacts_stated": true,
    "currency_impacts_stated": true,
    "quote_validity_dates_captured": true
  },
  "should_cost": {
    "benchmark_built_for_big_items": true,
    "vendor_quote_amount": 110.0,
    "should_cost_amount": 100.0,
    "declared_variance_percent": 10.0,
    "quote_compared_to_benchmark": true,
    "divergences_explained": true,
    "quote_exclusions_reviewed": true,
    "quote_assumptions_reviewed": true,
    "validity_period_respected": true,
    "quote_accepted_without_scope_review": false
  },
  "feedback": {
    "estimate_vs_actual_tracked_per_item": true,
    "rates_updated_from_actuals": true,
    "variance_lessons_published": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 35 checks and a text stamp of the verdict):

```json
{
  "service": "cost-estimate-preparation",
  "atom_version": "0.1.0",
  "entity": "Project Alpha",
  "verdict": "COST_ESTIMATE_READY",
  "sections": {
    "basis_and_class": "pass",
    "elements_and_line_items": "pass",
    "uncertainty_and_ranges": "pass",
    "totals_escalation_and_currency": "pass",
    "should_cost_and_quotes": "pass",
    "feedback_loop": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "line_items_evaluated": 1,
  "computed_subtotal": "5000.000000",
  "subtotal_difference": "0.000000",
  "uncertainty_items_evaluated": 1,
  "computed_total_spread": "20.000000",
  "total_spread_difference": "0.000000",
  "computed_contingency_amount": "500.000000",
  "contingency_difference": "0.000000",
  "computed_escalation_amount": "250.000000",
  "escalation_difference": "0.000000",
  "computed_grand_total": "5750.000000",
  "grand_total_difference": "0.000000",
  "computed_quote_variance_percent": "10.000000",
  "quote_variance_difference": "0.000000",
  "summary": "35 pass, 0 fail, 0 missing of 35 checks across six sections."
}
```

## Verdicts

- **COST_ESTIMATE_READY** — every check passes; the estimate artifact is complete and internally consistent on the declared evidence.
- **COST_ESTIMATE_NOT_READY** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `line_items_evaluated` (count of complete line-item entries), `computed_subtotal` and `subtotal_difference`, `uncertainty_items_evaluated` (count of complete three-point items), `computed_total_spread` and `total_spread_difference`, `computed_contingency_amount` and `contingency_difference`, `computed_escalation_amount` and `escalation_difference`, `computed_grand_total` and `grand_total_difference`, `computed_quote_variance_percent` and `quote_variance_difference` (computed amounts as strings with exactly six decimals, or null when they cannot be computed) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
