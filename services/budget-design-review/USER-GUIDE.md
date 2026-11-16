# Budget design review — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a budget design — its scope, lines, owners, drivers, totals, revenue link, contingency, approval baseline, monitoring and close — and you want to know whether the design holds together before money moves against it. This atom reads one declared budget-design manifest and returns one deterministic verdict across six sections and 29 checks: **BUDGET_DESIGN_SOUND**, **BUDGET_DESIGN_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Computed checks: the budget type must be one of the kinds the method names (`operating`, `capital`, `personal`); every line must carry a named owner and a stated approach (`zero_based` or `incremental`); every line amount must equal its driver quantity × driver unit cost; the declared total must equal the sum of the line amounts and must not exceed expected income; and the rolling forecast horizon must be exactly 12 months. Hidden padding, silent reallocations, and unannotated edits to actuals are red lines — declaring any of them fails the design. Same manifest in → same verdict out. The review audits the design's own declarations for completeness and consistency; it is not financial advice and does not judge whether the amounts are wise.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "budget-design-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/budget-design-review` — tool name `budget_design_review`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/budget-design-review` — body = the manifest object; same `Authorization` header.

## Input — the budget-design-review manifest

| Field | Meaning |
|---|---|
| `budget` | budget name (string; carried into the output, not checked) |
| `scope.budget_type` (string) | computed: must be `operating`, `capital`, or `personal` |
| `scope.entity_named` / `currency_stated` / `governs_stated` / `exclusions_stated` | scope evidence |
| `lines` (list of line objects) | absent = line-derived checks missing; empty list = `lines_present` fails |
| `lines[].name` | line name (string; carried for readability, not checked) |
| `lines[].owner` (string) | computed: every line must carry a non-empty owner; offending positions reported as `ownerless_line_indexes`, count as `lines_evaluated` |
| `lines[].approach` (string) | computed: must be `zero_based` or `incremental` on every line |
| `lines[].driver_documented` | drivers evidence |
| `lines[].driver_quantity` (number), `lines[].driver_unit_cost` (number), `lines[].amount` (number) | computed: amount must equal driver_quantity × driver_unit_cost on every line |
| `totals.declared_total` (number) | computed: must equal the sum of the line amounts; reported re-derived as `computed_total` with `total_difference` (declared minus computed), both strings with exactly two decimals |
| `totals.expected_income` (number) | computed: declared total must not exceed it |
| `revenue.linked_to_forecast` | revenue evidence |
| `contingency.explicit_line_present` / `sized_to_identified_risks` | contingency evidence |
| `contingency.hidden_padding_present` | must be `false` to pass |
| `approval.baseline_approved_and_locked` / `approval_thresholds_documented` / `revisions_reapproved` | approval and baseline evidence |
| `monitoring.monthly_variance_process_running` / `variance_thresholds_trigger_explanations` / `variance_actions_tracked` / `rolling_forecast_cadence_set` | monitoring evidence |
| `monitoring.rolling_horizon_months` (number) | computed: must be exactly 12 |
| `close.annual_true_up_done` / `carry_over_rules_decided` / `lessons_carried_to_next_cycle` | close evidence |
| `close.silent_reallocations_made` / `actuals_edited_without_annotation` | both must be `false` to pass |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward BUDGET_DESIGN_NOT_SOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/budget-design-review`:

```json
{
  "budget": "Q1 Marketing Plan",
  "scope": {
    "budget_type": "operating",
    "entity_named": true,
    "currency_stated": true,
    "governs_stated": true,
    "exclusions_stated": true
  },
  "lines": [
    {
      "name": "Ads",
      "owner": "Marketing Lead",
      "approach": "zero_based",
      "driver_documented": true,
      "driver_quantity": 100,
      "driver_unit_cost": 5,
      "amount": 500
    }
  ],
  "totals": {
    "declared_total": 500,
    "expected_income": 1000
  },
  "revenue": {
    "linked_to_forecast": true
  },
  "contingency": {
    "explicit_line_present": true,
    "sized_to_identified_risks": true,
    "hidden_padding_present": false
  },
  "approval": {
    "baseline_approved_and_locked": true,
    "approval_thresholds_documented": true,
    "revisions_reapproved": true
  },
  "monitoring": {
    "monthly_variance_process_running": true,
    "variance_thresholds_trigger_explanations": true,
    "variance_actions_tracked": true,
    "rolling_forecast_cadence_set": true,
    "rolling_horizon_months": 12
  },
  "close": {
    "annual_true_up_done": true,
    "carry_over_rules_decided": true,
    "lessons_carried_to_next_cycle": true,
    "silent_reallocations_made": false,
    "actuals_edited_without_annotation": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 29 checks and a text stamp of the verdict):

```json
{
  "service": "budget-design-review",
  "atom_version": "0.1.0",
  "budget": "Q1 Marketing Plan",
  "verdict": "BUDGET_DESIGN_SOUND",
  "sections": {
    "scope": "pass",
    "structure_and_owners": "pass",
    "drivers_and_totals": "pass",
    "revenue_and_contingency": "pass",
    "approval_and_baseline": "pass",
    "monitoring_and_close": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "lines_evaluated": 1,
  "ownerless_line_indexes": [],
  "computed_total": "500.00",
  "total_difference": "0.00",
  "summary": "29 pass, 0 fail, 0 missing of 29 checks across six sections."
}
```

## Verdicts

- **BUDGET_DESIGN_SOUND** — every check passes; the design is sound on the declared evidence.
- **BUDGET_DESIGN_NOT_SOUND** — at least one check fails; the failing checks name the breached rule and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_total` (re-derived sum of the line amounts, string with exactly two decimals, or null), `total_difference` (declared minus computed, two decimals, or null), `lines_evaluated` (number of lines declared, or null), `ownerless_line_indexes` (positions of lines without a named owner, or null when no lines list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
