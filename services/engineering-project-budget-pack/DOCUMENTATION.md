# Engineering project budget pack — documentation

**Engineering project budget pack** · slug `engineering-project-budget-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `entity` "Project Alpha"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "engineering-project-budget-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the budget-pack manifest.** You declare a budget pack artifact already prepared — its basis document, its budget line items, its declared totals chain, its approval / baseline record, its change log, its tracking record, and its closeout record — the atom audits the declared artifact, it does not prepare the budget (see Explanation). The recorded full-pass manifest declares the entity `Project Alpha`: the basis document is present and states the scope of the estimate, the assumptions, the exclusions, quote validity and FX/escalation treatment, and names the estimator; labour is costed as rate × hours and indirects are included; the three must-be-false flags are `false` (no padding buried in the estimate, no work without an approved estimate or PO, no verbal change orders). It declares one line item, `Wiring` (category `Labor`, `pricing_basis` `quote_based`, quantity 10 × unit rate 50 = declared amount 500), a declared subtotal of 500, contingency 10% = 50, a management reserve of 100 held separately, and a declared total budget of 650. It declares one change entry, `Additional conduit run` (+50, impact statement present, approved before work), a declared total change impact of 50 and a declared revised budget of 700; tracking with commitments 500, actuals 400 and forecast-to-complete 100 (total forecast 500, forecast variance −200); and closeout with final cost 600, final variance −100, contingency used 20 and unspent contingency 30.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/engineering-project-budget-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `BUDGET_PACK_READY`: "42 pass, 0 fail, 0 missing of 42 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`.

**Step 5 — Act on it.** A positive verdict means the declared artifact is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `BUDGET_PACK_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "engineering-project-budget-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/engineering-project-budget-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/engineering-project-budget-pack` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `engineering_project_budget_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `BUDGET_PACK_NOT_READY` means at least one check has status `fail`: a field is present but false/invalid, or a declared value breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `line_item_pricing_basis_marked`, `subtotal_matches_sum_of_line_items`, and the summary reads "40 pass, 2 fail, 0 missing of 42 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the re-derived values and differences (see Output format). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "basis",
  "detail": "basis must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/engineering-project-budget-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/engineering-project-budget-pack` — tool name `engineering_project_budget_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `engineering_project_budget_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `BUDGET_PACK_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors) — the section objects themselves (`basis`, `build`, `contingency`, `totals`, `approval`, `changes`, `tracking`, `closeout`) must be objects, and `line_items` / `change_entries` must be lists of entry objects. Fields are grouped below exactly as SERVICE.md groups them — by the section(s) that read them, in SERVICE.md's field-table order.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `entity` | string | Carried into the verdict output, not itself checked |

#### Read by: basis_document

| Field | Type | Notes |
|---|---|---|
| `basis.document_present` | boolean | — |
| `basis.scope_of_estimate_stated` | boolean | — |
| `basis.assumptions_stated` | boolean | — |
| `basis.exclusions_stated` | boolean | — |
| `basis.quote_validity_stated` | boolean | — |
| `basis.fx_escalation_stated` | boolean | — |
| `basis.estimator_named` | boolean | — |

#### Read by: budget_build_and_line_items

| Field | Type | Notes |
|---|---|---|
| `build.labor_costed_rate_times_hours` | boolean | — |
| `build.indirects_included` | boolean | — |
| `line_items` | list | List of line-item entries; absent / not a list / empty = all four computed line-item checks missing |
| `line_items[].label` | string | Must be non-empty for the entry to be complete |
| `line_items[].category` | string | Must be non-empty for the entry to be complete; validated as a string only, never enum-checked — the skill names the build components as guidance, and no category coverage is imposed |
| `line_items[].pricing_basis` | string | Computed vocabulary check: passes only when every complete entry declares `quote_based` or `allowance`; validated as a string only at the type layer — membership is a verdict check, not a type error |
| `line_items[].quantity` | number | Computed, see below |
| `line_items[].unit_rate` | number | Computed, see below |
| `line_items[].declared_amount` | number | Declared, re-derived: must equal `quantity` × `unit_rate` |

#### Read by: budget_build_and_line_items, contingency_reserve_and_totals

| Field | Type | Notes |
|---|---|---|
| `totals.declared_subtotal` | number | Computed: must equal the sum of the declared line amounts |

#### Read by: contingency_reserve_and_totals

| Field | Type | Notes |
|---|---|---|
| `contingency.risks_listed_for_contingency` | boolean | — |
| `contingency.management_reserve_held_separately` | boolean | — |
| `contingency.padding_buried_in_estimate` | boolean | must be `false` to pass — skill method step 3, "never bury padding" |
| `totals.contingency_percent` | number | A declaration — never a pass mark; only its amount arithmetic is re-derived |
| `totals.declared_management_reserve_amount` | number | Computed: enters the total budget as its own declared line |

#### Read by: contingency_reserve_and_totals, closeout_and_contingency_disposition

| Field | Type | Notes |
|---|---|---|
| `totals.declared_contingency_amount` | number | Declared, re-derived: must equal `declared_subtotal` × `contingency_percent` / 100 |

#### Read by: contingency_reserve_and_totals, change_control_and_tracking

| Field | Type | Notes |
|---|---|---|
| `totals.declared_total_budget` | number | Declared, re-derived: must equal `declared_subtotal` + `declared_contingency_amount` + `declared_management_reserve_amount` |

#### Read by: approval_and_baseline

| Field | Type | Notes |
|---|---|---|
| `approval.approval_recorded` | boolean | — |
| `approval.baseline_from_approved_amount` | boolean | — |
| `approval.revisions_reapproved` | boolean | — |
| `approval.work_without_approved_estimate_or_po` | boolean | must be `false` to pass — skill red line |

#### Read by: change_control_and_tracking

| Field | Type | Notes |
|---|---|---|
| `changes.log_maintained` | boolean | — |
| `changes.verbal_change_orders_used` | boolean | must be `false` to pass — skill red line |
| `change_entries` | list | List of change-log entries; absent / not a list / empty = all four computed change checks missing |
| `change_entries[].label` | string | Must be non-empty for the entry to be complete |
| `change_entries[].cost_impact` | number | Computed; may be negative — a descope reduces the budget |
| `change_entries[].impact_statement_present` | boolean | Must be present for the entry to be complete, and `true` on every entry for the impact-statement check to pass |
| `change_entries[].approved_before_work` | boolean | Must be present for the entry to be complete, and `true` on every entry for the approval-before-work check to pass |
| `totals.declared_total_change_impact` | number | Declared, re-derived: must equal the sum of the change entries' `cost_impact` values |
| `tracking.commitments_vs_actuals_tracked` | boolean | — |
| `tracking.invoice_reconciliation_against_delivery` | boolean | — |
| `tracking.monthly_report_issued` | boolean | — |
| `tracking.variance_reported_with_reasons` | boolean | — |
| `tracking.commitments_amount` | number | Declared context for the tracking record — read by the core's type validation; no check re-derives it, because the skill states no arithmetic over commitments alone |
| `tracking.actuals_amount` | number | Computed: summed into the total forecast |
| `tracking.forecast_to_complete_amount` | number | Computed: summed into the total forecast |
| `tracking.declared_total_forecast_amount` | number | Declared, re-derived: must equal `actuals_amount` + `forecast_to_complete_amount` |
| `tracking.declared_forecast_variance_amount` | number | Declared, re-derived: must equal `declared_total_forecast_amount` − `declared_revised_budget` |

#### Read by: change_control_and_tracking, closeout_and_contingency_disposition

| Field | Type | Notes |
|---|---|---|
| `totals.declared_revised_budget` | number | Declared, re-derived: must equal `declared_total_budget` + `declared_total_change_impact` |

#### Read by: closeout_and_contingency_disposition

| Field | Type | Notes |
|---|---|---|
| `closeout.final_cost_reconciled` | boolean | — |
| `closeout.variance_explained` | boolean | — |
| `closeout.lessons_captured` | boolean | — |
| `closeout.contingency_disposition_stated` | boolean | — |
| `closeout.unspent_contingency_released_explicitly` | boolean | — |
| `closeout.declared_final_cost` | number | Computed: enters the final variance |
| `closeout.declared_final_variance_amount` | number | Declared, re-derived: must equal `declared_final_cost` − `declared_revised_budget` |
| `closeout.contingency_used_amount` | number | Computed: enters the unspent contingency |
| `closeout.declared_unspent_contingency_amount` | number | Declared, re-derived: must equal `declared_contingency_amount` − `contingency_used_amount` |

### Checks

All 42 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: this atom has no conditional (gated) checks and the recorded response carries no not-applicable per-check status. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: basis_document

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `basis_document_present` | quality gate: a basis document is present for every estimate | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `basis_scope_of_estimate_stated` | method step 1: the basis document states the scope of the estimate | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `basis_assumptions_stated` | method step 1: the basis document states the estimate's assumptions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `basis_exclusions_stated` | method step 1: the basis document states the estimate's exclusions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `basis_quote_validity_stated` | method step 1: the basis document states quote validity | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `basis_fx_escalation_stated` | method step 1: the basis document states FX and escalation treatment | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `basis_estimator_named` | method step 1: the basis document names the estimator | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: budget_build_and_line_items

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `labor_costed_rate_times_hours` | method step 2: labor is built as rate x hours | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `indirects_included` | method step 2: indirects — freight and permits — are included in the build | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `line_item_entries_complete` | every line item carries a label, a category, a pricing basis, a quantity, a unit rate, and a declared amount | Computed over the declared entries. Pass: every entry is complete. Missing: the list is absent / not a list / empty, or an entry is incomplete — SERVICE.md states an incomplete entry makes this check missing (the entry cannot be re-derived). |
| `line_item_pricing_basis_marked` | method step 2: every line item is marked quote-based or allowance (declared as quote_based or allowance) | Computed over the declared entries. Pass: the rule holds over every complete entry. Fail: a complete entry breaks the rule (a declared value on a complete entry violates it). Missing: the list is absent / not a list / empty, or an entry is incomplete so the rule cannot be re-derived. |
| `line_item_amounts_match_quantity_times_rate` | method step 2: each declared line amount equals its declared quantity multiplied by its declared unit rate | Computed over the declared entries. Pass: the rule holds over every complete entry. Fail: a complete entry breaks the rule (a declared value on a complete entry violates it). Missing: the list is absent / not a list / empty, or an entry is incomplete so the rule cannot be re-derived. |
| `subtotal_matches_sum_of_line_items` | method step 2: the declared subtotal equals the sum of the declared line amounts | Computed from the declared values. Pass: the declared value equals the re-derived value (fixed-6dp difference `0.000000`). Fail: the declared value differs from the re-derived value. Missing: a value the identity reads is absent, or the underlying list is absent / empty / incomplete so it cannot be re-derived. |

#### Section: contingency_reserve_and_totals

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `contingency_tied_to_listed_risks` | method step 3: the contingency is tied to listed risks | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `management_reserve_held_separately` | method step 3: the management reserve is held separately from the contingency | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_padding_buried_in_estimate` | method step 3: no padding is buried in the estimate | Pass: the field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `contingency_amount_matches_subtotal_times_percent` | method step 3: the declared contingency amount equals the declared subtotal multiplied by the declared contingency percent (the percent itself is fixed by no statement in the skill and is not judged here) | Computed from the declared values. Pass: the declared value equals the re-derived value (fixed-6dp difference `0.000000`). Fail: the declared value differs from the re-derived value. Missing: a value the identity reads is absent, or the underlying list is absent / empty / incomplete so it cannot be re-derived. |
| `total_budget_matches_subtotal_plus_contingency_plus_reserve` | the declared total budget equals the declared subtotal plus the declared contingency amount plus the declared management reserve amount (the reserve held separately, as its own declared line) | Computed from the declared values. Pass: the declared value equals the re-derived value (fixed-6dp difference `0.000000`). Fail: the declared value differs from the re-derived value. Missing: a value the identity reads is absent, or the underlying list is absent / empty / incomplete so it cannot be re-derived. |

#### Section: approval_and_baseline

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `approval_recorded` | quality gate: the budget approval is recorded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `approved_amount_is_the_baseline` | method step 4: the approved number is the baseline | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `revisions_reapproved_not_drifted` | method step 4: revisions are re-approved, not drifted | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_work_without_approved_estimate_or_po` | red line: no work is done without an approved estimate or PO | Pass: the field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

#### Section: change_control_and_tracking

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `change_log_maintained` | method step 5: the change log is tracked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_verbal_change_orders` | red line: no verbal change orders are used | Pass: the field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `change_entries_complete` | every change entry carries a label, a cost impact, an impact-statement mark, and an approval-before-work mark | Computed over the declared entries. Pass: every entry is complete. Missing: the list is absent / not a list / empty, or an entry is incomplete — SERVICE.md states an incomplete entry makes this check missing (the entry cannot be re-derived). |
| `all_changes_have_impact_statements` | method step 5: every scope change carries a cost and schedule impact statement | Computed over the declared entries. Pass: the rule holds over every complete entry. Fail: a complete entry breaks the rule (a declared value on a complete entry violates it). Missing: the list is absent / not a list / empty, or an entry is incomplete so the rule cannot be re-derived. |
| `all_changes_approved_before_work` | method step 5: every scope change is approved before the work is done | Computed over the declared entries. Pass: the rule holds over every complete entry. Fail: a complete entry breaks the rule (a declared value on a complete entry violates it). Missing: the list is absent / not a list / empty, or an entry is incomplete so the rule cannot be re-derived. |
| `change_impact_total_matches_sum_of_entries` | method step 5: the declared total change impact equals the sum of the declared change entries' cost impacts | Computed from the declared values. Pass: the declared value equals the re-derived value (fixed-6dp difference `0.000000`). Fail: the declared value differs from the re-derived value. Missing: a value the identity reads is absent, or the underlying list is absent / empty / incomplete so it cannot be re-derived. |
| `revised_budget_matches_total_budget_plus_change_impact` | method step 4: the declared revised budget equals the declared total budget plus the declared total change impact (the baseline moves only through approved changes, never by drift) | Computed from the declared values. Pass: the declared value equals the re-derived value (fixed-6dp difference `0.000000`). Fail: the declared value differs from the re-derived value. Missing: a value the identity reads is absent, or the underlying list is absent / empty / incomplete so it cannot be re-derived. |
| `commitments_vs_actuals_tracked` | method step 6: commitments (POs) are tracked against actuals | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `invoice_reconciliation_against_delivery` | method step 6: invoices are reconciled against delivery | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `monthly_report_issued` | method step 6: the monthly one-page report is issued (variance, reasons, and actions) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `variance_reported_with_reasons` | quality gate: variance is reported with reasons — no unexplained deltas | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `total_forecast_matches_actuals_plus_forecast_to_complete` | method step 6: the declared total forecast equals the declared actuals plus the declared forecast-to-complete | Computed from the declared values. Pass: the declared value equals the re-derived value (fixed-6dp difference `0.000000`). Fail: the declared value differs from the re-derived value. Missing: a value the identity reads is absent, or the underlying list is absent / empty / incomplete so it cannot be re-derived. |
| `forecast_variance_matches_total_forecast_minus_revised_budget` | method step 6: the declared forecast variance equals the declared total forecast minus the declared revised budget (whether the variance is acceptable is not judged here) | Computed from the declared values. Pass: the declared value equals the re-derived value (fixed-6dp difference `0.000000`). Fail: the declared value differs from the re-derived value. Missing: a value the identity reads is absent, or the underlying list is absent / empty / incomplete so it cannot be re-derived. |

#### Section: closeout_and_contingency_disposition

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `final_cost_vs_budget_reconciled` | quality gate: closeout reconciles — final cost against budget | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `closeout_variance_explained` | method step 7: the closeout variance is explained | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `lessons_captured` | method step 7: lessons are captured at closeout | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `contingency_disposition_stated` | quality gate: the contingency disposition is stated at closeout | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unspent_contingency_released_explicitly` | method step 7: unspent contingency is released explicitly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `final_variance_matches_final_cost_minus_revised_budget` | method step 7: the declared final variance equals the declared final cost minus the declared revised budget | Computed from the declared values. Pass: the declared value equals the re-derived value (fixed-6dp difference `0.000000`). Fail: the declared value differs from the re-derived value. Missing: a value the identity reads is absent, or the underlying list is absent / empty / incomplete so it cannot be re-derived. |
| `unspent_contingency_matches_contingency_minus_used` | method step 7: the declared unspent contingency equals the declared contingency amount minus the declared contingency used amount | Computed from the declared values. Pass: the declared value equals the re-derived value (fixed-6dp difference `0.000000`). Fail: the declared value differs from the re-derived value. Missing: a value the identity reads is absent, or the underlying list is absent / empty / incomplete so it cannot be re-derived. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"engineering-project-budget-pack"`), `atom_version` (`"0.1.0"`), and `entity` (the manifest's declared entity value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `line_items_evaluated` and `change_entries_evaluated` (the counts of complete entries, as integers); the computed amounts `computed_subtotal`, `computed_change_impact_total`, `computed_contingency_amount`, `computed_total_budget`, `computed_revised_budget`, `computed_total_forecast`, `computed_forecast_variance`, `computed_final_variance` and `computed_unspent_contingency`, each with its matching difference `subtotal_difference`, `change_impact_difference`, `contingency_difference`, `total_budget_difference`, `revised_budget_difference`, `total_forecast_difference`, `forecast_variance_difference`, `final_variance_difference` and `unspent_contingency_difference` (each difference is declared minus computed). Amounts and differences are strings with exactly six decimal places; a computed amount and its difference are null when either side cannot be computed — for example when the underlying list is absent or empty or an entry is incomplete. Computed amounts use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; computed comparisons compare the fixed-6dp difference to zero — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "42 pass, 0 fail, 0 missing of 42 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, entity, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `BUDGET_PACK_READY` — all 42 checks pass: the declared budget-pack record is complete and consistent with the skill's checklist and arithmetic.
- `BUDGET_PACK_NOT_READY` — at least one check fails: a declared value or entry contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (the eleven computed checks only): `within_stated_limits_on_declared_evidence` — every one of the eleven computed checks passes; `outside_stated_limits_on_declared_evidence` — at least one of the eleven computed checks fails; `null` — at least one of the eleven computed checks cannot be completed.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent. There is no separate not-applicable per-check status in the recorded response, and this atom has no conditional (gated) checks.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the engineering_project_budget_pack scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the engineering_project_budget_pack scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"basis","detail":"basis must be an object"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for engineering-project-budget-pack exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Engineering budgets done right — estimate basis, contingency, change control, tracking actuals through closeout (the bound `project-budgets` skill). You submit one declared record — the budget-pack manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist and arithmetic, returning one deterministic verdict across 6 sections (`basis_document`, `budget_build_and_line_items`, `contingency_reserve_and_totals`, `approval_and_baseline`, `change_control_and_tracking`, `closeout_and_contingency_disposition`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. It does not prepare a project budget and exercises no budgeting judgment.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for the three must-be-false fields — padding buried in the estimate, work without an approved estimate or PO, verbal change orders — declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared values themselves — line-item and change-entry completeness, the pricing-basis vocabulary (`quote_based` / `allowance`), and the eleven computed checks counted in `computed_status` (the line-item pricing-basis mark, line-item amounts, subtotal, contingency amount, total budget, change-impact total, revised budget, total forecast, forecast variance, final variance, and unspent contingency — each an arithmetic identity over the declared numbers, except the pricing-basis mark, which is a vocabulary check) — using only what the skill itself states plus the arithmetic of the declared numbers, with no outside threshold imported. This atom has no conditional (gated) checks. Aggregation is strict: any `fail` anywhere produces `BUDGET_PACK_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `BUDGET_PACK_READY`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The following are deliberately not imposed, because the skill does not fix them; naming them here is the audit trail for their absence. **Approval thresholds** — method step 4 says "approval per thresholds" but the skill states no threshold amounts, tiers, or approver levels; approval is carried as caller declarations only. **Contingency percent** — method step 3 requires the contingency to be "sized to uncertainty" with an explicit %, but fixes no percent and no sizing formula; any percent passes if its amount arithmetic holds, and whether it truly matches the listed risks' uncertainty is judgment the atom does not exercise. **Management reserve size** — the skill requires the reserve to be held separately; it states no reserve amount, percent, or sizing rule; only its arithmetic place in the total budget is re-derived. **Acceptable variance (forecast or final)** — method steps 6 and 7 require variance to be reported with reasons and explained at closeout; the skill states no variance percent or amount at which a budget is in trouble; only the variance arithmetic is re-derived. **Change re-approval size threshold** — method step 5 requires every scope change to be approved before work, with no de-minimis exception stated, so every declared entry is held to the same marks and no size threshold is invented in either direction. **FX / escalation rate** — method step 1 requires FX and escalation treatment to be stated in the basis document; the skill fixes no rate or index; it is a declaration only. **Schedule impact magnitude** — method step 5 requires a cost + schedule impact statement per change; the statement's existence is declared per entry; the skill states no schedule unit or bound, so no schedule figure is re-derived. **Line-item category coverage** — method step 2 names the build components (material, labor, subcontract, rentals, indirects); it does not state that every budget must carry every component; categories are validated as non-empty strings for traceability, with no coverage check imposed. **Commitments arithmetic** — method step 6 tracks commitments vs actuals vs forecast-to-complete, but states no identity over the commitments figure alone; the commitments amount is declared context, and the forecast identity is over actuals + forecast-to-complete only.

**What it does NOT do.** The atom audits a **declared** budget pack artifact — it does not build the budget, price the caller's actual work, verify that a declared value is true, or give budgeting advice. A pack is ready *on the caller's declared evidence* even if its underlying numbers are optimistic. It is a completeness and consistency audit, **not a budget review**: it never decides whether the quantities or rates are realistic, whether the contingency is adequate for the risks, whether the reserve is the right size, whether a change should have been approved, whether the variance reasons are good reasons, or whether the lessons captured are the right lessons — those judgment-shaped parts are carried as caller declarations only, never judged. Named exclusions: no production of a budget from raw scope or drawings; no verification of any declared quantity, rate, amount, quote, commitment, actual, or final cost; no rate benchmarking against market data; no contingency-adequacy, reserve-adequacy, approval-threshold or variance-acceptability judgment; no live verification of any declared fact.

**Buyer and use context.** Teams and agents working in Electrical & energy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: EE capital project estimates (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared engineering budget-pack artifact; its verdict is a completeness and consistency judgment on declared evidence, not compliance or audit evidence, and engineering budget preparation is not a regulated filing. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `engineering_project_budget_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed amounts are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/engineering_project_budget_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_engineering_project_budget_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/engineering-project-budget-pack` (REST) and `POST /mcp/engineering-project-budget-pack` (MCP, tool `engineering_project_budget_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `engineering_project_budget_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T04:27:24.877789+00:00 against gateway v1.1.0, external verification lane, source `verification/work/engineering-project-budget-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "basis_document",
      "check": "basis_document_present",
      "status": "pass",
      "evidence": "quality gate: a basis document is present for every estimate"
    },
    {
      "section": "basis_document",
      "check": "basis_scope_of_estimate_stated",
      "status": "pass",
      "evidence": "method step 1: the basis document states the scope of the estimate"
    },
    {
      "section": "basis_document",
      "check": "basis_assumptions_stated",
      "status": "pass",
      "evidence": "method step 1: the basis document states the estimate's assumptions"
    },
    {
      "section": "basis_document",
      "check": "basis_exclusions_stated",
      "status": "pass",
      "evidence": "method step 1: the basis document states the estimate's exclusions"
    },
    {
      "section": "basis_document",
      "check": "basis_quote_validity_stated",
      "status": "pass",
      "evidence": "method step 1: the basis document states quote validity"
    },
    {
      "section": "basis_document",
      "check": "basis_fx_escalation_stated",
      "status": "pass",
      "evidence": "method step 1: the basis document states FX and escalation treatment"
    },
    {
      "section": "basis_document",
      "check": "basis_estimator_named",
      "status": "pass",
      "evidence": "method step 1: the basis document names the estimator"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "labor_costed_rate_times_hours",
      "status": "pass",
      "evidence": "method step 2: labor is built as rate x hours"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "indirects_included",
      "status": "pass",
      "evidence": "method step 2: indirects \u2014 freight and permits \u2014 are included in the build"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "line_item_entries_complete",
      "status": "pass",
      "evidence": "every line item carries a label, a category, a pricing basis, a quantity, a unit rate, and a declared amount"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "line_item_pricing_basis_marked",
      "status": "pass",
      "evidence": "method step 2: every line item is marked quote-based or allowance (declared as quote_based or allowance)"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "line_item_amounts_match_quantity_times_rate",
      "status": "pass",
      "evidence": "method step 2: each declared line amount equals its declared quantity multiplied by its declared unit rate"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "subtotal_matches_sum_of_line_items",
      "status": "pass",
      "evidence": "method step 2: the declared subtotal equals the sum of the declared line amounts"
    },
    {
      "section": "contingency_reserve_and_totals",
      "check": "contingency_tied_to_listed_risks",
      "status": "pass",
      "evidence": "method step 3: the contingency is tied to listed risks"
    },
    {
      "section": "contingency_reserve_and_totals",
      "check": "management_reserve_held_separately",
      "status": "pass",
      "evidence": "method step 3: the management reserve is held separately from the contingency"
    },
    {
      "section": "contingency_reserve_and_totals",
      "check": "no_padding_buried_in_estimate",
      "status": "pass",
      "evidence": "method step 3: no padding is buried in the estimate"
    },
    {
      "section": "contingency_reserve_and_totals",
      "check": "contingency_amount_matches_subtotal_times_percent",
      "status": "pass",
      "evidence": "method step 3: the declared contingency amount equals the declared subtotal multiplied by the declared contingency percent (the percent itself is fixed by no statement in the skill and is not judged here)"
    },
    {
      "section": "contingency_reserve_and_totals",
      "check": "total_budget_matches_subtotal_plus_contingency_plus_reserve",
      "status": "pass",
      "evidence": "the declared total budget equals the declared subtotal plus the declared contingency amount plus the declared management reserve amount (the reserve held separately, as its own declared line)"
    },
    {
      "section": "approval_and_baseline",
      "check": "approval_recorded",
      "status": "pass",
      "evidence": "quality gate: the budget approval is recorded"
    },
    {
      "section": "approval_and_baseline",
      "check": "approved_amount_is_the_baseline",
      "status": "pass",
      "evidence": "method step 4: the approved number is the baseline"
    },
    {
      "section": "approval_and_baseline",
      "check": "revisions_reapproved_not_drifted",
      "status": "pass",
      "evidence": "method step 4: revisions are re-approved, not drifted"
    },
    {
      "section": "approval_and_baseline",
      "check": "no_work_without_approved_estimate_or_po",
      "status": "pass",
      "evidence": "red line: no work is done without an approved estimate or PO"
    },
    {
      "section": "change_control_and_tracking",
      "check": "change_log_maintained",
      "status": "pass",
      "evidence": "method step 5: the change log is tracked"
    },
    {
      "section": "change_control_and_tracking",
      "check": "no_verbal_change_orders",
      "status": "pass",
      "evidence": "red line: no verbal change orders are used"
    },
    {
      "section": "change_control_and_tracking",
      "check": "change_entries_complete",
      "status": "pass",
      "evidence": "every change entry carries a label, a cost impact, an impact-statement mark, and an approval-before-work mark"
    },
    {
      "section": "change_control_and_tracking",
      "check": "all_changes_have_impact_statements",
      "status": "pass",
      "evidence": "method step 5: every scope change carries a cost and schedule impact statement"
    },
    {
      "section": "change_control_and_tracking",
      "check": "all_changes_approved_before_work",
      "status": "pass",
      "evidence": "method step 5: every scope change is approved before the work is done"
    },
    {
      "section": "change_control_and_tracking",
      "check": "change_impact_total_matches_sum_of_entries",
      "status": "pass",
      "evidence": "method step 5: the declared total change impact equals the sum of the declared change entries' cost impacts"
    },
    {
      "section": "change_control_and_tracking",
      "check": "revised_budget_matches_total_budget_plus_change_impact",
      "status": "pass",
      "evidence": "method step 4: the declared revised budget equals the declared total budget plus the declared total change impact (the baseline moves only through approved changes, never by drift)"
    },
    {
      "section": "change_control_and_tracking",
      "check": "commitments_vs_actuals_tracked",
      "status": "pass",
      "evidence": "method step 6: commitments (POs) are tracked against actuals"
    },
    {
      "section": "change_control_and_tracking",
      "check": "invoice_reconciliation_against_delivery",
      "status": "pass",
      "evidence": "method step 6: invoices are reconciled against delivery"
    },
    {
      "section": "change_control_and_tracking",
      "check": "monthly_report_issued",
      "status": "pass",
      "evidence": "method step 6: the monthly one-page report is issued (variance, reasons, and actions)"
    },
    {
      "section": "change_control_and_tracking",
      "check": "variance_reported_with_reasons",
      "status": "pass",
      "evidence": "quality gate: variance is reported with reasons \u2014 no unexplained deltas"
    },
    {
      "section": "change_control_and_tracking",
      "check": "total_forecast_matches_actuals_plus_forecast_to_complete",
      "status": "pass",
      "evidence": "method step 6: the declared total forecast equals the declared actuals plus the declared forecast-to-complete"
    },
    {
      "section": "change_control_and_tracking",
      "check": "forecast_variance_matches_total_forecast_minus_revised_budget",
      "status": "pass",
      "evidence": "method step 6: the declared forecast variance equals the declared total forecast minus the declared revised budget (whether the variance is acceptable is not judged here)"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "final_cost_vs_budget_reconciled",
      "status": "pass",
      "evidence": "quality gate: closeout reconciles \u2014 final cost against budget"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "closeout_variance_explained",
      "status": "pass",
      "evidence": "method step 7: the closeout variance is explained"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "lessons_captured",
      "status": "pass",
      "evidence": "method step 7: lessons are captured at closeout"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "contingency_disposition_stated",
      "status": "pass",
      "evidence": "quality gate: the contingency disposition is stated at closeout"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "unspent_contingency_released_explicitly",
      "status": "pass",
      "evidence": "method step 7: unspent contingency is released explicitly"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "final_variance_matches_final_cost_minus_revised_budget",
      "status": "pass",
      "evidence": "method step 7: the declared final variance equals the declared final cost minus the declared revised budget"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "unspent_contingency_matches_contingency_minus_used",
      "status": "pass",
      "evidence": "method step 7: the declared unspent contingency equals the declared contingency amount minus the declared contingency used amount"
    }
  ],
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
  "summary": "42 pass, 0 fail, 0 missing of 42 checks across six sections.",
  "stamp": "ENGINEERING PROJECT BUDGET PACK\nentity: Project Alpha\nVERDICT: BUDGET_PACK_READY\n  basis_document                         pass\n  budget_build_and_line_items            pass\n  contingency_reserve_and_totals         pass\n  approval_and_baseline                  pass\n  change_control_and_tracking            pass\n  closeout_and_contingency_disposition   pass\n42 pass, 0 fail, 0 missing of 42 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

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
      "pricing_basis": "invalid_token",
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
    "declared_subtotal": 600.0,
    "contingency_percent": 10.0,
    "declared_contingency_amount": 60.0,
    "declared_management_reserve_amount": 100.0,
    "declared_total_budget": 760.0,
    "declared_total_change_impact": 50.0,
    "declared_revised_budget": 810.0
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
    "declared_forecast_variance_amount": -310.0
  },
  "closeout": {
    "final_cost_reconciled": true,
    "variance_explained": true,
    "lessons_captured": true,
    "contingency_disposition_stated": true,
    "unspent_contingency_released_explicitly": true,
    "declared_final_cost": 600.0,
    "declared_final_variance_amount": -210.0,
    "contingency_used_amount": 20.0,
    "declared_unspent_contingency_amount": 40.0
  }
}
```

Response (HTTP 200):

```json
{
  "service": "engineering-project-budget-pack",
  "atom_version": "0.1.0",
  "entity": "Project Alpha",
  "verdict": "BUDGET_PACK_NOT_READY",
  "sections": {
    "basis_document": "pass",
    "budget_build_and_line_items": "fail",
    "contingency_reserve_and_totals": "pass",
    "approval_and_baseline": "pass",
    "change_control_and_tracking": "pass",
    "closeout_and_contingency_disposition": "pass"
  },
  "checks": [
    {
      "section": "basis_document",
      "check": "basis_document_present",
      "status": "pass",
      "evidence": "quality gate: a basis document is present for every estimate"
    },
    {
      "section": "basis_document",
      "check": "basis_scope_of_estimate_stated",
      "status": "pass",
      "evidence": "method step 1: the basis document states the scope of the estimate"
    },
    {
      "section": "basis_document",
      "check": "basis_assumptions_stated",
      "status": "pass",
      "evidence": "method step 1: the basis document states the estimate's assumptions"
    },
    {
      "section": "basis_document",
      "check": "basis_exclusions_stated",
      "status": "pass",
      "evidence": "method step 1: the basis document states the estimate's exclusions"
    },
    {
      "section": "basis_document",
      "check": "basis_quote_validity_stated",
      "status": "pass",
      "evidence": "method step 1: the basis document states quote validity"
    },
    {
      "section": "basis_document",
      "check": "basis_fx_escalation_stated",
      "status": "pass",
      "evidence": "method step 1: the basis document states FX and escalation treatment"
    },
    {
      "section": "basis_document",
      "check": "basis_estimator_named",
      "status": "pass",
      "evidence": "method step 1: the basis document names the estimator"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "labor_costed_rate_times_hours",
      "status": "pass",
      "evidence": "method step 2: labor is built as rate x hours"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "indirects_included",
      "status": "pass",
      "evidence": "method step 2: indirects \u2014 freight and permits \u2014 are included in the build"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "line_item_entries_complete",
      "status": "pass",
      "evidence": "every line item carries a label, a category, a pricing basis, a quantity, a unit rate, and a declared amount"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "line_item_pricing_basis_marked",
      "status": "fail",
      "evidence": "method step 2: every line item is marked quote-based or allowance (declared as quote_based or allowance)"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "line_item_amounts_match_quantity_times_rate",
      "status": "pass",
      "evidence": "method step 2: each declared line amount equals its declared quantity multiplied by its declared unit rate"
    },
    {
      "section": "budget_build_and_line_items",
      "check": "subtotal_matches_sum_of_line_items",
      "status": "fail",
      "evidence": "method step 2: the declared subtotal equals the sum of the declared line amounts"
    },
    {
      "section": "contingency_reserve_and_totals",
      "check": "contingency_tied_to_listed_risks",
      "status": "pass",
      "evidence": "method step 3: the contingency is tied to listed risks"
    },
    {
      "section": "contingency_reserve_and_totals",
      "check": "management_reserve_held_separately",
      "status": "pass",
      "evidence": "method step 3: the management reserve is held separately from the contingency"
    },
    {
      "section": "contingency_reserve_and_totals",
      "check": "no_padding_buried_in_estimate",
      "status": "pass",
      "evidence": "method step 3: no padding is buried in the estimate"
    },
    {
      "section": "contingency_reserve_and_totals",
      "check": "contingency_amount_matches_subtotal_times_percent",
      "status": "pass",
      "evidence": "method step 3: the declared contingency amount equals the declared subtotal multiplied by the declared contingency percent (the percent itself is fixed by no statement in the skill and is not judged here)"
    },
    {
      "section": "contingency_reserve_and_totals",
      "check": "total_budget_matches_subtotal_plus_contingency_plus_reserve",
      "status": "pass",
      "evidence": "the declared total budget equals the declared subtotal plus the declared contingency amount plus the declared management reserve amount (the reserve held separately, as its own declared line)"
    },
    {
      "section": "approval_and_baseline",
      "check": "approval_recorded",
      "status": "pass",
      "evidence": "quality gate: the budget approval is recorded"
    },
    {
      "section": "approval_and_baseline",
      "check": "approved_amount_is_the_baseline",
      "status": "pass",
      "evidence": "method step 4: the approved number is the baseline"
    },
    {
      "section": "approval_and_baseline",
      "check": "revisions_reapproved_not_drifted",
      "status": "pass",
      "evidence": "method step 4: revisions are re-approved, not drifted"
    },
    {
      "section": "approval_and_baseline",
      "check": "no_work_without_approved_estimate_or_po",
      "status": "pass",
      "evidence": "red line: no work is done without an approved estimate or PO"
    },
    {
      "section": "change_control_and_tracking",
      "check": "change_log_maintained",
      "status": "pass",
      "evidence": "method step 5: the change log is tracked"
    },
    {
      "section": "change_control_and_tracking",
      "check": "no_verbal_change_orders",
      "status": "pass",
      "evidence": "red line: no verbal change orders are used"
    },
    {
      "section": "change_control_and_tracking",
      "check": "change_entries_complete",
      "status": "pass",
      "evidence": "every change entry carries a label, a cost impact, an impact-statement mark, and an approval-before-work mark"
    },
    {
      "section": "change_control_and_tracking",
      "check": "all_changes_have_impact_statements",
      "status": "pass",
      "evidence": "method step 5: every scope change carries a cost and schedule impact statement"
    },
    {
      "section": "change_control_and_tracking",
      "check": "all_changes_approved_before_work",
      "status": "pass",
      "evidence": "method step 5: every scope change is approved before the work is done"
    },
    {
      "section": "change_control_and_tracking",
      "check": "change_impact_total_matches_sum_of_entries",
      "status": "pass",
      "evidence": "method step 5: the declared total change impact equals the sum of the declared change entries' cost impacts"
    },
    {
      "section": "change_control_and_tracking",
      "check": "revised_budget_matches_total_budget_plus_change_impact",
      "status": "pass",
      "evidence": "method step 4: the declared revised budget equals the declared total budget plus the declared total change impact (the baseline moves only through approved changes, never by drift)"
    },
    {
      "section": "change_control_and_tracking",
      "check": "commitments_vs_actuals_tracked",
      "status": "pass",
      "evidence": "method step 6: commitments (POs) are tracked against actuals"
    },
    {
      "section": "change_control_and_tracking",
      "check": "invoice_reconciliation_against_delivery",
      "status": "pass",
      "evidence": "method step 6: invoices are reconciled against delivery"
    },
    {
      "section": "change_control_and_tracking",
      "check": "monthly_report_issued",
      "status": "pass",
      "evidence": "method step 6: the monthly one-page report is issued (variance, reasons, and actions)"
    },
    {
      "section": "change_control_and_tracking",
      "check": "variance_reported_with_reasons",
      "status": "pass",
      "evidence": "quality gate: variance is reported with reasons \u2014 no unexplained deltas"
    },
    {
      "section": "change_control_and_tracking",
      "check": "total_forecast_matches_actuals_plus_forecast_to_complete",
      "status": "pass",
      "evidence": "method step 6: the declared total forecast equals the declared actuals plus the declared forecast-to-complete"
    },
    {
      "section": "change_control_and_tracking",
      "check": "forecast_variance_matches_total_forecast_minus_revised_budget",
      "status": "pass",
      "evidence": "method step 6: the declared forecast variance equals the declared total forecast minus the declared revised budget (whether the variance is acceptable is not judged here)"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "final_cost_vs_budget_reconciled",
      "status": "pass",
      "evidence": "quality gate: closeout reconciles \u2014 final cost against budget"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "closeout_variance_explained",
      "status": "pass",
      "evidence": "method step 7: the closeout variance is explained"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "lessons_captured",
      "status": "pass",
      "evidence": "method step 7: lessons are captured at closeout"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "contingency_disposition_stated",
      "status": "pass",
      "evidence": "quality gate: the contingency disposition is stated at closeout"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "unspent_contingency_released_explicitly",
      "status": "pass",
      "evidence": "method step 7: unspent contingency is released explicitly"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "final_variance_matches_final_cost_minus_revised_budget",
      "status": "pass",
      "evidence": "method step 7: the declared final variance equals the declared final cost minus the declared revised budget"
    },
    {
      "section": "closeout_and_contingency_disposition",
      "check": "unspent_contingency_matches_contingency_minus_used",
      "status": "pass",
      "evidence": "method step 7: the declared unspent contingency equals the declared contingency amount minus the declared contingency used amount"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "line_items_evaluated": 1,
  "computed_subtotal": "500.000000",
  "subtotal_difference": "100.000000",
  "change_entries_evaluated": 1,
  "computed_change_impact_total": "50.000000",
  "change_impact_difference": "0.000000",
  "computed_contingency_amount": "60.000000",
  "contingency_difference": "0.000000",
  "computed_total_budget": "760.000000",
  "total_budget_difference": "0.000000",
  "computed_revised_budget": "810.000000",
  "revised_budget_difference": "0.000000",
  "computed_total_forecast": "500.000000",
  "total_forecast_difference": "0.000000",
  "computed_forecast_variance": "-310.000000",
  "forecast_variance_difference": "0.000000",
  "computed_final_variance": "-210.000000",
  "final_variance_difference": "0.000000",
  "computed_unspent_contingency": "40.000000",
  "unspent_contingency_difference": "0.000000",
  "summary": "40 pass, 2 fail, 0 missing of 42 checks across six sections.",
  "stamp": "ENGINEERING PROJECT BUDGET PACK\nentity: Project Alpha\nVERDICT: BUDGET_PACK_NOT_READY\n  basis_document                         pass\n  budget_build_and_line_items            fail\n  contingency_reserve_and_totals         pass\n  approval_and_baseline                  pass\n  change_control_and_tracking            pass\n  closeout_and_contingency_disposition   pass\n40 pass, 2 fail, 0 missing of 42 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "basis": "not_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "basis",
  "detail": "basis must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared engineering budget-pack artifact; its verdict is a completeness and consistency judgment on declared evidence, not compliance or audit evidence, and engineering budget preparation is not a regulated filing. |
| Checks named | 42 documented / 42 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (no not-applicable per-check status in the recorded response; this atom has no gated checks) |
| Input reference typed | Yes — 56 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/engineering-project-budget-pack/evidence.json` |
