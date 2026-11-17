# Engineering project budget pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have an engineering project budget pack — its basis document, its budget line items, its declared totals chain, its approval and baseline record, its change log, its tracking record and its closeout record — and you want that declared artifact checked for completeness and internal consistency. This atom reads one declared manifest and returns one deterministic verdict across six sections: **BUDGET_PACK_READY**, **BUDGET_PACK_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact only — it does not prepare a project budget, exercises no budgeting judgment, prices no work, and does not verify that any declared value is true. A pack is ready *on your declared evidence* even if its underlying numbers are optimistic: it never decides whether quantities or rates are realistic, whether the contingency is adequate for the risks, whether the reserve is the right size, whether a change should have been approved, or whether the variance reasons are good reasons. Computed checks: every line item must be complete with its declared amount equal to `quantity` × `unit_rate` and its `pricing_basis` one of `quote_based` / `allowance`; the declared subtotal must equal the sum of the declared line amounts; the declared contingency amount must equal declared subtotal × declared contingency percent / 100; the declared total budget must equal subtotal + contingency + management reserve; the declared total change impact must equal the sum of the change entries' cost impacts (every entry complete, with an impact statement and approval before work); the declared revised budget must equal total budget + total change impact; the declared total forecast must equal actuals + forecast-to-complete; the declared forecast variance must equal total forecast − revised budget; the declared final variance must equal final cost − revised budget; and the declared unspent contingency must equal contingency amount − contingency used. No numeric threshold is imposed — no approval threshold amounts or tiers, no contingency percent or management-reserve size, no acceptable-variance bar, no change re-approval size threshold, no FX/escalation rate, and no line-item category coverage requirement; those are carried as your declarations only. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "engineering-project-budget-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/engineering-project-budget-pack` — tool name `engineering_project_budget_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/engineering-project-budget-pack` — body = the manifest object; same `Authorization` header.

## Input — the engineering-project-budget-pack manifest

| Field | Meaning |
|---|---|
| `entity` | entity / project name (string; carried into the output, not checked) |
| `basis.document_present` / `scope_of_estimate_stated` / `assumptions_stated` / `exclusions_stated` / `quote_validity_stated` / `fx_escalation_stated` / `estimator_named` | basis-document evidence: a basis document is present; it states the scope of the estimate, the assumptions, the exclusions, quote validity and FX/escalation treatment; it names the estimator |
| `build.labor_costed_rate_times_hours` / `indirects_included` | build evidence: labour is costed as rate × hours; indirects are included |
| `line_items` (list of line-item entries) | computed: absent / not a list / empty leaves all four line-item checks missing; reported count is `line_items_evaluated` |
| `line_items[].label` (string) / `category` (string) | computed: every entry must carry a non-empty label and category (category is validated as a string only, never enum-checked) for the entry to be complete |
| `line_items[].pricing_basis` (string) | computed: every complete entry must declare `quote_based` or `allowance`; any other string is present and fails |
| `line_items[].quantity` (number) / `unit_rate` (number) / `declared_amount` (number) | computed: every declared amount must equal `quantity` × `unit_rate` |
| `contingency.risks_listed_for_contingency` / `management_reserve_held_separately` | contingency evidence: the contingency is tied to listed risks; the management reserve is held separately |
| `contingency.padding_buried_in_estimate` | must be `false` to pass (no padding buried in the estimate) |
| `totals.declared_subtotal` (number) | computed: must equal the sum of the declared line amounts |
| `totals.contingency_percent` (number) | declaration only — never a pass mark; only its amount arithmetic is re-derived |
| `totals.declared_contingency_amount` (number) | computed: must equal `declared_subtotal` × `contingency_percent` / 100 |
| `totals.declared_management_reserve_amount` (number) | computed: enters the total budget as its own declared line |
| `totals.declared_total_budget` (number) | computed: must equal `declared_subtotal` + `declared_contingency_amount` + `declared_management_reserve_amount` |
| `totals.declared_total_change_impact` (number) | computed: must equal the sum of the change entries' `cost_impact` values |
| `totals.declared_revised_budget` (number) | computed: must equal `declared_total_budget` + `declared_total_change_impact` |
| `approval.approval_recorded` / `baseline_from_approved_amount` / `revisions_reapproved` | approval evidence: the approval is recorded; the approved amount is the baseline; revisions are re-approved |
| `approval.work_without_approved_estimate_or_po` | must be `false` to pass (red line: no work without an approved estimate or PO) |
| `changes.log_maintained` | change-control evidence: the change log is maintained |
| `changes.verbal_change_orders_used` | must be `false` to pass (red line: no verbal change orders) |
| `change_entries` (list of change-log entries) | computed: absent / not a list / empty leaves all four change checks missing; reported count is `change_entries_evaluated` |
| `change_entries[].label` (string) | computed: every entry must carry a non-empty label for the entry to be complete |
| `change_entries[].cost_impact` (number) | computed: summed into the total change impact; may be negative (a descope reduces the budget) |
| `change_entries[].impact_statement_present` | computed: must be present for the entry to be complete, and `true` on every entry for the impact-statement check to pass |
| `change_entries[].approved_before_work` | computed: must be present for the entry to be complete, and `true` on every entry for the approval-before-work check to pass |
| `tracking.commitments_vs_actuals_tracked` / `invoice_reconciliation_against_delivery` / `monthly_report_issued` / `variance_reported_with_reasons` | tracking evidence: commitments are tracked against actuals; invoices are reconciled against delivery; the monthly report is issued; variance is reported with reasons |
| `tracking.commitments_amount` (number) | declared context only — no check re-derives it |
| `tracking.actuals_amount` (number) / `forecast_to_complete_amount` (number) | computed: summed into the total forecast |
| `tracking.declared_total_forecast_amount` (number) | computed: must equal `actuals_amount` + `forecast_to_complete_amount` |
| `tracking.declared_forecast_variance_amount` (number) | computed: must equal `declared_total_forecast_amount` − `declared_revised_budget` |
| `closeout.final_cost_reconciled` / `variance_explained` / `lessons_captured` / `contingency_disposition_stated` / `unspent_contingency_released_explicitly` | closeout evidence: the final cost is reconciled; the variance is explained; lessons are captured; the contingency disposition is stated; unspent contingency is released explicitly |
| `closeout.declared_final_cost` (number) | computed: enters the final variance |
| `closeout.declared_final_variance_amount` (number) | computed: must equal `declared_final_cost` − `declared_revised_budget` |
| `closeout.contingency_used_amount` (number) | computed: enters the unspent contingency |
| `closeout.declared_unspent_contingency_amount` (number) | computed: must equal `declared_contingency_amount` − `contingency_used_amount` |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward BUDGET_PACK_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/engineering-project-budget-pack`:

```json
{
  "entity": "Project Alpha",
  "basis": {
    "document_present": true,
    "scope_of_estimate_stated": true,
    "assumptions_stated": true,
    "exclusions_stated": true,
    "quote_validity_stated": true,
    "fx_escalation_stated": true,
    "estimator_named": true
  },
  "build": {
    "labor_costed_rate_times_hours": true,
    "indirects_included": true
  },
  "line_items": [
    {
      "label": "Wiring",
      "category": "Labor",
      "pricing_basis": "quote_based",
      "quantity": 10.0,
      "unit_rate": 50.0,
      "declared_amount": 500.0
    }
  ],
  "contingency": {
    "risks_listed_for_contingency": true,
    "management_reserve_held_separately": true,
    "padding_buried_in_estimate": false
  },
  "totals": {
    "declared_subtotal": 500.0,
    "contingency_percent": 10.0,
    "declared_contingency_amount": 50.0,
    "declared_management_reserve_amount": 100.0,
    "declared_total_budget": 650.0,
    "declared_total_change_impact": 50.0,
    "declared_revised_budget": 700.0
  },
  "approval": {
    "approval_recorded": true,
    "baseline_from_approved_amount": true,
    "revisions_reapproved": true,
    "work_without_approved_estimate_or_po": false
  },
  "changes": {
    "log_maintained": true,
    "verbal_change_orders_used": false
  },
  "change_entries": [
    {
      "label": "Additional conduit run",
      "cost_impact": 50.0,
      "impact_statement_present": true,
      "approved_before_work": true
    }
  ],
  "tracking": {
    "commitments_vs_actuals_tracked": true,
    "invoice_reconciliation_against_delivery": true,
    "monthly_report_issued": true,
    "variance_reported_with_reasons": true,
    "commitments_amount": 500.0,
    "actuals_amount": 400.0,
    "forecast_to_complete_amount": 100.0,
    "declared_total_forecast_amount": 500.0,
    "declared_forecast_variance_amount": -200.0
  },
  "closeout": {
    "final_cost_reconciled": true,
    "variance_explained": true,
    "lessons_captured": true,
    "contingency_disposition_stated": true,
    "unspent_contingency_released_explicitly": true,
    "declared_final_cost": 600.0,
    "declared_final_variance_amount": -100.0,
    "contingency_used_amount": 20.0,
    "declared_unspent_contingency_amount": 30.0
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 42 checks and a text stamp of the verdict):

```json
{
  "service": "engineering-project-budget-pack",
  "atom_version": "0.1.0",
  "entity": "Project Alpha",
  "verdict": "BUDGET_PACK_READY",
  "sections": {
    "basis_document": "pass",
    "budget_build_and_line_items": "pass",
    "contingency_reserve_and_totals": "pass",
    "approval_and_baseline": "pass",
    "change_control_and_tracking": "pass",
    "closeout_and_contingency_disposition": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "line_items_evaluated": 1,
  "computed_subtotal": "500.000000",
  "subtotal_difference": "0.000000",
  "change_entries_evaluated": 1,
  "computed_change_impact_total": "50.000000",
  "change_impact_difference": "0.000000",
  "computed_contingency_amount": "50.000000",
  "contingency_difference": "0.000000",
  "computed_total_budget": "650.000000",
  "total_budget_difference": "0.000000",
  "computed_revised_budget": "700.000000",
  "revised_budget_difference": "0.000000",
  "computed_total_forecast": "500.000000",
  "total_forecast_difference": "0.000000",
  "computed_forecast_variance": "-200.000000",
  "forecast_variance_difference": "0.000000",
  "computed_final_variance": "-100.000000",
  "final_variance_difference": "0.000000",
  "computed_unspent_contingency": "30.000000",
  "unspent_contingency_difference": "0.000000",
  "summary": "42 pass, 0 fail, 0 missing of 42 checks across six sections."
}
```

## Verdicts

- **BUDGET_PACK_READY** — every check passes; the declared budget-pack record is complete and consistent with the skill's checklist and arithmetic.
- **BUDGET_PACK_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `line_items_evaluated` and `change_entries_evaluated` (the counts of complete entries, as integers), the computed amounts `computed_subtotal`, `computed_contingency_amount`, `computed_total_budget`, `computed_change_impact_total`, `computed_revised_budget`, `computed_total_forecast`, `computed_forecast_variance`, `computed_final_variance` and `computed_unspent_contingency` with their matching differences `subtotal_difference`, `contingency_difference`, `total_budget_difference`, `change_impact_difference`, `revised_budget_difference`, `total_forecast_difference`, `forecast_variance_difference`, `final_variance_difference` and `unspent_contingency_difference` (amounts and differences as strings with exactly six decimal places, each difference being declared minus computed; a computed amount and its difference are null when either side cannot be computed — for example when the underlying list is absent or empty or an entry is incomplete), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the eleven computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
