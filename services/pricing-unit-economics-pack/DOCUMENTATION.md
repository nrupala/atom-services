# Pricing unit economics pack — documentation

**Pricing unit economics pack** · slug `pricing-unit-economics-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac) · U-13 flag: screen NO — open for the Director's review (see For regulators).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/pricing-unit-economics-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 9595ea665b634289aad158b7fff277ac). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `product` "SaaS-Platform-Alpha"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "pricing-unit-economics-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the pricing unit economics manifest.** You declare a record of one product's pricing and unit economics, made at a pricing review — the atom audits the declared record, it does not set a price, recommend anything or project anything (see Explanation). The recorded full-pass manifest declares the product `SaaS-Platform-Alpha`: revenue model `subscription` with bookings, billings and recognized revenue kept distinct, recognition timing documented and accountant alignment declared; a value-based anchor documented, good-better-best tiers declared, a price-change grandfathering plan present and annual pricing review declared; one price tier, `Basic` (price `100.0`, variable cost per unit `20.0`, units `10`, declared revenue `1000.0`, declared contribution `800.0`); all six discount-policy and guardrail flags `true`; one discount, `EarlyBird` with reason `Launch promotion`; unit economics with assumptions stated and declared conservative, quarterly updates declared, price per unit `100.0`, variable cost per unit `20.0`, fixed costs `500.0`, units sold `10`, declared contribution-margin ratio `0.8`, declared break-even units `6.25` and declared total contribution `800.0`; gross and net churn kept distinct, cohort curves used and expansion revenue tracked; an MRR bridge of opening `1000.0` + new `200.0` + expansion `50.0` − contraction `10.0` − churned `40.0` = declared closing `1200.0`; cash collection kept distinct from recognized revenue and forecast inputs handed over with ranges declared; and all three red-line flags `false` (no bookings presented as revenue, no unrecorded discounts, no improvised recognition decisions).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/pricing-unit-economics-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `PRICING_UNIT_ECONOMICS_PACK_READY`: "37 pass, 0 fail, 0 missing of 37 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `tiers_count` is 1, `total_declared_tier_revenue` is `"1000.000000"`, `total_declared_tier_contribution` is `"800.000000"`, `tier_contribution_margin` is `"0.800000"`, `discounts_count` is 1, `discount_reason_coverage` is `"1.000000"`, `computed_contribution_margin_ratio` is `"0.800000"`, `computed_break_even_units` is `"6.250000"`, `computed_total_contribution` is `"800.000000"` and `computed_closing_mrr` is `"1200.000000"`, with all differences `"0.000000"` and all row-name lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and arithmetically consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `PRICING_UNIT_ECONOMICS_PACK_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "pricing-unit-economics-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/pricing-unit-economics-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/pricing-unit-economics-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `pricing_unit_economics_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `PRICING_UNIT_ECONOMICS_PACK_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 1 check fails: `tier_revenue_matches_price_times_units`, and the summary reads "36 pass, 1 fail, 0 missing of 37 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `tiers_mismatching_revenue` names `Basic` — that row declares `declared_revenue: 999.0` while its `price` `100.0` × `units` `10` = `1000.0` — `total_declared_tier_revenue` is `"999.000000"`, `tier_contribution_margin` is `"0.800801"`, section `pricing_and_packaging` reports `fail`, the other five sections `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`; the fix is to declare the tier revenue that re-derives from the row's own price and units, `1000.0`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "revenue_model",
  "detail": "revenue_model must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3; the violating field is `revenue_model`, sent as the string `"should_be_an_object"` where an object is required.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/pricing-unit-economics-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/pricing-unit-economics-pack` — tool name `pricing_unit_economics_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `pricing_unit_economics_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `product`, `revenue_model.model_kind` and the `tiers[]` / `discounts[]` string fields are noted as strings, the numeric entry and figure fields as numbers, and `tiers` / `discounts` as lists of row objects there. Where SERVICE.md states no type — the section container objects (`revenue_model`, `pricing`, `discount_policy`, `unit_economics`, `churn`, `mrr_bridge`, `reporting`, `red_lines`) and a `tiers[]` / `discounts[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and `tiers` / `discounts`, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `tiers` / `discounts` as `array`); that grounding is said so in the Notes column. The recorded MCP `inputSchema` types only the top-level properties; the nested field types rest on SERVICE.md and the recorded evidence inputs. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `PRICING_UNIT_ECONOMICS_PACK_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `product` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: revenue_model_and_recognition

| Field | Type | Notes |
|---|---|---|
| `revenue_model` | object | The revenue-model section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `revenue_model.model_kind` | string | Must be one of the kinds the skill names — `one_time`, `subscription`, `usage`, `hybrid` (type stated in SERVICE.md) |
| `revenue_model.bookings_billings_and_recognized_revenue_kept_distinct` | boolean | — |
| `revenue_model.recognition_timing_documented` | boolean | — |
| `revenue_model.accountant_alignment_on_recognition_declared` | boolean | — |

#### Read by: pricing_and_packaging

| Field | Type | Notes |
|---|---|---|
| `pricing` | object | The pricing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `pricing.value_based_anchor_documented` | boolean | — |
| `pricing.good_better_best_tiers_declared` | boolean | — |
| `pricing.price_change_grandfathering_plan_present` | boolean | — |
| `pricing.pricing_reviewed_annually_declared` | boolean | — |
| `tiers` | list | list of price-tier row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `tiers[]` | object | One declared price-tier row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `tiers[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `tiers[].price` | number | The tier's declared price point (type stated in SERVICE.md) |
| `tiers[].variable_cost_per_unit` | number | (type stated in SERVICE.md) |
| `tiers[].units` | number | Declared volume at this tier (type stated in SERVICE.md) |
| `tiers[].declared_revenue` | number | Must equal `price` × `units` (type stated in SERVICE.md) |
| `tiers[].declared_contribution` | number | Must equal (`price` − `variable_cost_per_unit`) × `units` (type stated in SERVICE.md) |

#### Read by: discount_and_payment_guardrails

| Field | Type | Notes |
|---|---|---|
| `discount_policy` | object | The discount-policy section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `discount_policy.approval_matrix_present` | boolean | — |
| `discount_policy.floor_prices_set` | boolean | — |
| `discount_policy.deal_desk_for_exceptions_present` | boolean | — |
| `discount_policy.refund_and_credit_policy_present` | boolean | — |
| `discount_policy.failed_payment_dunning_process_present` | boolean | — |
| `discount_policy.fraud_and_dispute_basics_present` | boolean | — |
| `discounts` | list | list of discount-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `discounts[]` | object | One declared discount row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `discounts[].label` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `discounts[].reason` | string | The logged reason for the discount; must be present and non-empty per row (type stated in SERVICE.md) |

#### Read by: unit_economics

| Field | Type | Notes |
|---|---|---|
| `unit_economics` | object | The unit-economics section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `unit_economics.assumptions_stated` | boolean | — |
| `unit_economics.assumptions_conservative_declared` | boolean | — |
| `unit_economics.unit_economics_updated_quarterly_declared` | boolean | — |
| `unit_economics.price_per_unit` | number | (type stated in SERVICE.md) |
| `unit_economics.variable_cost_per_unit` | number | (type stated in SERVICE.md) |
| `unit_economics.fixed_costs` | number | (type stated in SERVICE.md) |
| `unit_economics.units_sold` | number | (type stated in SERVICE.md) |
| `unit_economics.declared_contribution_margin_ratio` | number | Must equal (`price_per_unit` − `variable_cost_per_unit`) ÷ `price_per_unit` (type stated in SERVICE.md) |
| `unit_economics.declared_break_even_units` | number | Must equal `fixed_costs` ÷ (`price_per_unit` − `variable_cost_per_unit`) (type stated in SERVICE.md) |
| `unit_economics.declared_total_contribution` | number | Must equal `units_sold` × (`price_per_unit` − `variable_cost_per_unit`) (type stated in SERVICE.md) |

#### Read by: churn_retention_and_reporting

| Field | Type | Notes |
|---|---|---|
| `churn` | object | The churn section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `churn.gross_and_net_churn_kept_distinct` | boolean | — |
| `churn.cohort_curves_used_not_single_period_averages` | boolean | — |
| `churn.expansion_revenue_tracked` | boolean | — |
| `mrr_bridge` | object | The MRR-bridge section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `mrr_bridge.opening_mrr` | number | (type stated in SERVICE.md) |
| `mrr_bridge.new_mrr` | number | (type stated in SERVICE.md) |
| `mrr_bridge.expansion_mrr` | number | (type stated in SERVICE.md) |
| `mrr_bridge.contraction_mrr` | number | (type stated in SERVICE.md) |
| `mrr_bridge.churned_mrr` | number | (type stated in SERVICE.md) |
| `mrr_bridge.declared_closing_mrr` | number | Must equal opening + new + expansion − contraction − churned (type stated in SERVICE.md) |
| `reporting` | object | The reporting section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `reporting.cash_collection_and_recognized_revenue_kept_distinct` | boolean | — |
| `reporting.forecast_inputs_handed_over_with_ranges_declared` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.bookings_presented_as_revenue_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unrecorded_discounts_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.improvised_recognition_decisions_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 37 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: revenue_model_and_recognition

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `revenue_model_kind_is_stated_kind` | model clarity: the revenue model kind is one of the kinds the skill names — one-time, subscription, usage or hybrid | Computed over the declared record. Pass: `revenue_model.model_kind` is one of `one_time`, `subscription`, `usage` or `hybrid`. Fail: it is any other string. Missing: the field is absent. |
| `bookings_billings_and_recognized_revenue_kept_distinct` | model clarity: bookings, billings and recognized revenue are different things and are kept distinct | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `recognition_timing_documented` | model clarity: revenue recognition timing is documented | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `accountant_alignment_on_recognition_declared` | model clarity: recognition timing is aligned with the accountant — the accountant owns filings, the record keeps the data clean | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: pricing_and_packaging

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `value_based_anchor_documented` | pricing: the value-based anchor — what it is worth to the buyer — is documented | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `good_better_best_tiers_declared` | pricing: good-better-best tiers are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `price_change_grandfathering_plan_present` | pricing: price changes carry a grandfathering plan | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pricing_reviewed_annually_declared` | pricing: pricing is reviewed annually | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `price_tiers_declared` | the declared record names its price tiers — the tiers list is present; an empty list declares that the record prices no tier | Computed over the declared record. Pass: the `tiers` list is present — an empty list passes, because it declares that the record prices no tier, and the skill requires no tier. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_price_tier_entry_complete` | price tiers: every declared tier row is complete — name, price, variable cost per unit, units, declared revenue and declared contribution all declared, the name non-empty | Computed over the declared record. Pass: every declared tier row declares all six entry fields with a non-empty `name` — on an empty list the check passes vacuously. Fail: a row declares `name` present but empty. Missing: the list is absent, or a row has an entry field absent. |
| `no_price_tier_name_duplicated` | price tiers: no declared tier name is owned by more than one tier row | Computed over the declared record. Pass: no declared `name` string appears on more than one tier row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_tier_names`). Missing: the list is absent, or a row has `name` absent (such a row is missing evidence for this check). |
| `tier_revenue_matches_price_times_units` | price tiers: every declared tier revenue equals its price times its units | Computed over the declared record. Pass: every row's `declared_revenue` equals its `price` × `units`. Fail: a row whose three figures are all declared does not re-derive (offending rows are named in `tiers_mismatching_revenue`). Missing: the list is absent, or a row is missing any of the three figures. |
| `tier_contribution_matches_unit_contribution_times_units` | price tiers: every declared tier contribution equals (price minus variable cost per unit) times its units | Computed over the declared record. Pass: every row's `declared_contribution` equals (`price` − `variable_cost_per_unit`) × `units`. Fail: a row whose figures are all declared does not re-derive (offending rows are named in `tiers_mismatching_contribution`). Missing: the list is absent, or a row is missing any of the figures the rule reads. |

#### Section: discount_and_payment_guardrails

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `discount_approval_matrix_present` | discount guardrails: a discount approval matrix exists | Pass: the field (`discount_policy.approval_matrix_present`) is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `discount_floor_prices_set` | discount guardrails: floor prices are set | Pass: the field (`discount_policy.floor_prices_set`) is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deal_desk_for_exceptions_present` | discount guardrails: a deal desk handles exceptions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `refund_and_credit_policy_present` | guardrails: a refund and credit policy exists | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `failed_payment_dunning_process_present` | guardrails: failed-payment handling — dunning — is in place | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `fraud_and_dispute_basics_present` | guardrails: fraud and dispute basics are in place | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `discounts_declared` | the declared record names its discounts — the discounts list is present; an empty list declares that no discounts were given | Computed over the declared record. Pass: the `discounts` list is present — an empty list passes, because it declares that no discounts were given. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_discount_names_reason` | discount guardrails: every declared discount row logs a reason — no ad-hoc generosity | Computed over the declared record. Pass: every declared discount row logs `reason` as a present, non-empty string — on an empty list the check passes vacuously. Fail: a row declares `reason` present but empty (such discounts are named in `discounts_without_reason`). Missing: the list is absent, or a row has `reason` absent. |
| `no_discount_label_duplicated` | discount guardrails: no declared discount label is owned by more than one discount row | Computed over the declared record. Pass: no declared `label` string appears on more than one discount row. Fail: a `label` string is declared on more than one row (offending labels are named in `duplicate_discount_labels`). Missing: the list is absent. |

#### Section: unit_economics

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `unit_economics_assumptions_stated` | unit economics: the assumptions behind the figures are stated and visible | Pass: the field (`unit_economics.assumptions_stated`) is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unit_economics_assumptions_conservative_declared` | unit economics: the stated assumptions are declared conservative | Pass: the field (`unit_economics.assumptions_conservative_declared`) is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unit_economics_updated_quarterly_declared` | unit economics: the figures are updated quarterly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `contribution_margin_ratio_matches_price_and_variable_cost` | unit economics: the declared contribution-margin ratio equals (price per unit minus variable cost per unit) divided by price per unit | Computed over the declared record. Pass: `declared_contribution_margin_ratio` equals (`price_per_unit` − `variable_cost_per_unit`) ÷ `price_per_unit` under the fixed-6dp comparison. Fail: the figures are present but the ratio does not hold — including a zero `price_per_unit`, which makes the ratio undefined: the check fails and the computed ratio is reported null. Missing: any figure the rule reads is absent. |
| `break_even_units_matches_fixed_costs_over_unit_contribution` | unit economics: the declared break-even units equal fixed costs divided by (price per unit minus variable cost per unit) | Computed over the declared record. Pass: `declared_break_even_units` equals `fixed_costs` ÷ (`price_per_unit` − `variable_cost_per_unit`) under the fixed-6dp comparison. Fail: the figures are present but the value does not hold — including a zero unit contribution, which makes break-even undefined: the check fails and the computed break-even is reported null. Missing: any figure the rule reads is absent. |
| `total_contribution_matches_units_sold_times_unit_contribution` | unit economics: the declared total contribution equals units sold times (price per unit minus variable cost per unit) | Computed over the declared record. Pass: `declared_total_contribution` equals `units_sold` × (`price_per_unit` − `variable_cost_per_unit`) under the fixed-6dp comparison. Fail: the figures are present but the total does not hold. Missing: any figure the rule reads is absent. |

#### Section: churn_retention_and_reporting

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `gross_and_net_churn_kept_distinct` | churn: gross churn and net churn are kept distinct | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `cohort_curves_used_not_single_period_averages` | churn: retention is read from cohort curves, not single-period averages | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `expansion_revenue_tracked` | churn: expansion revenue is tracked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mrr_bridge_closes_on_declared_figures` | reporting: the MRR bridge closes — declared closing MRR equals opening plus new plus expansion minus contraction minus churned MRR | Computed over the declared record. Pass: `declared_closing_mrr` equals opening + new + expansion − contraction − churned MRR under the fixed-6dp comparison. Fail: all bridge figures are declared but the bridge does not close. Missing: any bridge figure is absent. |
| `cash_collection_and_recognized_revenue_kept_distinct` | reporting: cash collection and recognized revenue are kept distinct | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `forecast_inputs_handed_over_with_ranges_declared` | forecast inputs: committed plus pipeline plus base rates are handed to forecasting with ranges — this atom hands inputs over, it forecasts nothing itself | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_bookings_presented_as_revenue` | red line: no vanity metrics — bookings presented as revenue are not present in the record | Pass: the anti-pattern field (`red_lines.bookings_presented_as_revenue_present`) is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_unrecorded_discounts` | red line: no unrecorded discounts are present in the record | Pass: the anti-pattern field (`red_lines.unrecorded_discounts_present`) is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_improvised_recognition_decisions` | red line: no improvised recognition decisions are present in the record | Pass: the anti-pattern field (`red_lines.improvised_recognition_decisions_present`) is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"pricing-unit-economics-pack"`), `atom_version` (`"0.1.0"`), and `product` (the manifest's declared product value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `tiers_count` and `discounts_count` (the declared list lengths as integers, or null when a list is not declared — counts are reported as integers, exactly); `duplicate_tier_names` and `duplicate_discount_labels` (names declared on more than one row, in the order their second occurrence appears), the row-name lists `tiers_mismatching_revenue` and `tiers_mismatching_contribution` (rows whose figures are all declared and whose declared revenue / contribution does not re-derive), and `discounts_without_reason` (discounts whose reason field is present but empty) — all five lists are null when the list they read is not declared, as recorded in the sparse case; the sums `total_declared_tier_revenue` and `total_declared_tier_contribution` (null when any row lacks the figure); the ratio `tier_contribution_margin` (total contribution ÷ total revenue; null when the totals are absent or revenue is zero); the coverage ratio `discount_reason_coverage` (discounts logging a reason ÷ declared discounts; null when the `discounts` list is not declared, as recorded in the sparse case); and the re-derived unit-economics and bridge figures with their differences against the declared figures: `computed_contribution_margin_ratio`, `contribution_margin_difference`, `computed_break_even_units`, `break_even_difference`, `computed_total_contribution`, `total_contribution_difference`, `computed_closing_mrr` and `closing_mrr_difference` (each null when its inputs are not all declared or its denominator is zero). Computed amounts and ratios are strings with exactly six decimal places under the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; computed comparisons compare the fixed-6dp difference to zero — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "37 pass, 0 fail, 0 missing of 37 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared product value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `PRICING_UNIT_ECONOMICS_PACK_READY` — all 37 checks pass: the declared pricing / unit-economics record is complete and arithmetically consistent with the bound skill's checklist and red lines.
- `PRICING_UNIT_ECONOMICS_PACK_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the thirteen primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `tiers_count`, `discounts_count`, `duplicate_tier_names`, `duplicate_discount_labels`, `tiers_mismatching_revenue`, `tiers_mismatching_contribution`, `discounts_without_reason`, `total_declared_tier_revenue`, `total_declared_tier_contribution`, `tier_contribution_margin`, `discount_reason_coverage`, `computed_contribution_margin_ratio`, `contribution_margin_difference`, `computed_break_even_units`, `break_even_difference`, `computed_total_contribution`, `total_contribution_difference`, `computed_closing_mrr`, `closing_mrr_difference` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"revenue_model","detail":"revenue_model must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Understand revenue — models, pricing, unit economics, MRR/ARR discipline, churn math, deal guardrails (the bound capability, from the skill). You submit one declared record — the pricing unit economics manifest, a declared pricing / unit-economics record for one product, made at a pricing review — and the atom audits that record for completeness and arithmetic consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 6 sections (`revenue_model_and_recognition`, `pricing_and_packaging`, `discount_and_payment_guardrails`, `unit_economics`, `churn_retention_and_reporting`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared figures themselves, using only the skill's own stated rules plus the arithmetic of the declared figures — the declared `model_kind` must be one of the four kinds the skill names (`one_time`, `subscription`, `usage`, `hybrid`); the declared `tiers` and `discounts` lists must be present (an empty list passes in each case: it declares that the record prices no tier, or that no discounts were given); every tier row must declare all six entry fields with a non-empty `name`, no tier `name` or discount `label` may be duplicated, and every discount row must log a non-empty `reason`; every row's `declared_revenue` must equal `price` × `units` and its `declared_contribution` must equal (`price` − `variable_cost_per_unit`) × `units`; the declared contribution-margin ratio must equal (`price_per_unit` − `variable_cost_per_unit`) ÷ `price_per_unit`, the declared break-even units must equal `fixed_costs` ÷ (`price_per_unit` − `variable_cost_per_unit`), and the declared total contribution must equal `units_sold` × (`price_per_unit` − `variable_cost_per_unit`); and the declared closing MRR must equal opening + new + expansion − contraction − churned MRR — with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `PRICING_UNIT_ECONOMICS_PACK_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `PRICING_UNIT_ECONOMICS_PACK_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states **no numeric threshold at all** — its demands are the model, packaging, guardrail and reporting declarations above plus arithmetic consistency over the caller's own figures. Quantities are computed and reported; the only bars on the computed rows are completeness and re-derivation over the caller's own declared figures. Declined thresholds, named: a minimum or target contribution margin, gross margin or markup; a maximum discount percentage or amount, or a floor-price level the atom would set itself; a churn, retention or expansion-revenue bar; an LTV, CAC, ARPU or payback figure, ratio (such as LTV/CAC) or ceiling — the skill names ARPU, LTV (with assumptions visible and conservative), CAC and payback months as unit-economics numbers but states **no formula and no bar** for any of them, so none is computed, checked or reported here; a price point, price increase or elasticity figure for any tier; a break-even deadline or a maximum break-even volume beyond the arithmetic consistency of the declared figures; an MRR / ARR growth rate or bridge-component bar; a cohort size or observation window for cohort curves; a refund, credit or dunning period or amount; a forecast range width for the inputs handed to forecasting.

**What it does NOT do.** The atom reviews a **declared** pricing / unit-economics record: a verdict of `PRICING_UNIT_ECONOMICS_PACK_READY` means the record is complete and internally consistent *on the caller's declared evidence* — a record that declares a documented value anchor, logged discount reasons and closing bridge figures passes those checks even if the real pricing did none of it. It is a completeness and arithmetic audit of the pricing record the skill requires, **not a pricing service, a revenue forecast, an accounting or tax opinion, or financial advice of any kind**. Specifically: it sets no price, inspects no accounting system, CRM, price list, contract or ledger, runs no market or competitor analysis, and does not verify that a declared record was ever carried out. It never judges whether a price is right, whether a margin is good, whether a discount should have been given, whether the declared assumptions are realistic, or whether the product will sell — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared figures are internally consistent. Named exclusions and non-reducible parts (carried as caller declarations only, never judged): no numeric thresholds at all (see the declined list above); no live verification of any declared fact; no judgment of pricing *quality* — whether the anchor, tiers, discounts or assumptions are adequate for the real product is the caller's declaration, checked only for declared presence and arithmetic consistency; the skill's advice-shaped steps are **excluded from production and are red lines here, not features**: working out what the unit economics "say about pricing" (the skill's own example), recommending a price, tier structure, discount or deal, projecting revenue, MRR or churn forward, and valuing a customer (LTV) or a business are never performed — the atom audits the record of decisions the caller has already made; recognition substance (whether a timing decision is correct under accounting rules) is a caller declaration aligned with their accountant — only its declared presence is checked, and the output is not accounting advice.

**Buyer and use context.** Teams and agents working in Money & markets who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Pricing reviews for product launches (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For integrators (Users)

You need: a gateway key with the `pricing_unit_economics_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed amounts and ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/pricing_unit_economics_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_pricing_unit_economics_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps. The bound skill is `revenue-management`.

### For ops

Endpoints: `POST /v1/pricing-unit-economics-pack` (REST) and `POST /mcp/pricing-unit-economics-pack` (MCP, tool `pricing_unit_economics_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 9595ea665b634289aad158b7fff277ac). Key scope: `pricing_unit_economics_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture). U-13 flag: this atom is deployed under a screen-NO U-13 flag that stays open for the Director's review — see For regulators; do not treat deployment as closure of the flag.

### For regulators

This atom was deployed census-style under a U-13 regulatory screen flag. The screen recorded in SERVICE.md (section "U-13 regulatory screen") is reproduced here exactly; **the flag stays open for the Director's review** — nothing in this document, in the atom's deployment, or in its verification PASS closes it.

Screen result, as recorded in SERVICE.md: **No — with the design controls below, this atom's output could not read as regulated financial advice.** It is finance-adjacent (it handles a business's own pricing and revenue figures), so the screen was applied strictly. What prevents an advice reading — the five controls, exactly as SERVICE.md records them:

1. the atom audits a caller-**declared** record for completeness and arithmetic consistency only — every output is a pass / fail / missing verdict on the record, a re-derived figure, or a difference against the caller's own declared figure;
2. it gives **no recommendation, no projection and no forecast** — it never says what a price, discount, margin or model should be, and its one forward-looking check is a declaration that forecast *inputs* were handed to a separate forecasting capability with ranges;
3. it sets **no threshold** — no margin bar, churn bar or LTV/CAC ratio against which a caller's business could be graded as good or bad;
4. the skill's advice-shaped steps (working out what the figures say about pricing, deal approvals, LTV/CAC/payback computation) are excluded from production and named as exclusions above — ARPU, LTV, CAC and payback are not computed, checked or reported at all, because the skill states no formula for them and computing them would turn an audit into an analysis;
5. the figures are a business's own operating record, not a personal financial position, a security, a portfolio or a credit decision, and no output is addressed to an investment or borrowing choice.

Residual risk, stated plainly (as SERVICE.md states it): a caller could paste the verdict into their own pricing decision — that is their decision, made on their record; the artifact itself recommends nothing. The verdict is a completeness and arithmetic-consistency judgment on the caller's declared evidence only: it is not financial advice, not an accounting or tax opinion, and not compliance evidence. The U-13 flag remains open for the Director's review.

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the computed checks, the prefixed attestation checks and the red-line checks. Recorded check names used verbatim in the Checks section include `revenue_model_kind_is_stated_kind` (input `revenue_model.model_kind`), `discount_approval_matrix_present` (input `discount_policy.approval_matrix_present`), `discount_floor_prices_set` (input `discount_policy.floor_prices_set`), `unit_economics_assumptions_stated` (input `unit_economics.assumptions_stated`) and `unit_economics_assumptions_conservative_declared` (input `unit_economics.assumptions_conservative_declared`), `no_bookings_presented_as_revenue` (input `red_lines.bookings_presented_as_revenue_present`), `no_unrecorded_discounts` (input `red_lines.unrecorded_discounts_present`) and `no_improvised_recognition_decisions` (input `red_lines.improvised_recognition_decisions_present`), plus the computed checks `price_tiers_declared`, `every_price_tier_entry_complete`, `no_price_tier_name_duplicated`, `tier_revenue_matches_price_times_units` and `tier_contribution_matches_unit_contribution_times_units`, which read the `tiers` rows rather than any single input field; `discounts_declared`, `every_discount_names_reason` and `no_discount_label_duplicated`, which read the `discounts` rows; `contribution_margin_ratio_matches_price_and_variable_cost`, `break_even_units_matches_fixed_costs_over_unit_contribution` and `total_contribution_matches_units_sold_times_unit_contribution`, which read the `unit_economics` figures; and `mrr_bridge_closes_on_declared_figures`, which reads the `mrr_bridge` figures. The remaining recorded check names match the leaf name of the input field they read (for example `recognition_timing_documented` reads `revenue_model.recognition_timing_documented`).
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`revenue_model`, `pricing`, `discount_policy`, `unit_economics`, `churn`, `mrr_bridge`, `reporting`, `red_lines`) or for a `tiers[]` / `discounts[]` row object itself. The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and `tiers` / `discounts`, in the recorded MCP `inputSchema`, and are said so there. The recorded MCP `inputSchema` in turn types only the top-level properties (with `additionalProperties: true`) and states no nested field schema at all; the nested types rest on SERVICE.md and the recorded inputs.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 37 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, `tiers_count` / `discounts_count`, the tier totals, `tier_contribution_margin` and the re-derived figures, but states no null rule for `duplicate_tier_names`, `duplicate_discount_labels`, `tiers_mismatching_revenue`, `tiers_mismatching_contribution` or `discounts_without_reason`, and no null rule for `discount_reason_coverage`. The recorded sparse response returns all of those fields as `null` when the list they read is not declared (USER-GUIDE.md states the list null rules, and states `discount_reason_coverage` null "when there are no declared discounts"); this document follows the recording. The empty-list case for `discount_reason_coverage` is not separately recorded: the sparse recording covers the list-absent case only.
6. **Section grouping vs input objects:** the recorded sections merge separate input objects — `pricing` and `tiers` inputs are read by the single recorded section `pricing_and_packaging`, `discount_policy` and `discounts` inputs are read by the single recorded section `discount_and_payment_guardrails`, and `churn`, `mrr_bridge` and `reporting` inputs are read by the single recorded section `churn_retention_and_reporting`. This document groups the Input reference and the Checks by the recorded section names.
7. **Case-design prose divergences (corrections.json):** the raw case design diverged from the atom's register and rules in four places, all corrected at design time before execution and recorded in `corrections.json` (TEST-REPORT.md scores them as tester errors, not atom findings): (R1) the violations `failing_checks` named the prose label `Tier revenue matches price times units` instead of an exact check name — corrected to exactly `tier_revenue_matches_price_times_units`; (R2, twice) the full-pass and violations `expect` blocks carried no structured `computed_spot_checks`, the computed quantities appearing only in prose notes — structured spot checks (20 quantities each) were injected, computed per SERVICE.md and confirmed against the Python oracle; (R3) the violations input was missing the key paths `discounts[].label` and `discounts[].reason` present in the full-pass manifest (it carried an empty `discounts` list) — the violations input was rebuilt as a deep copy of the full-pass manifest carrying only the planted change `tiers[0].declared_revenue` = `999.0`. The executed `cases.json` inputs and expects match the recorded executions in evidence.json, and this document follows the recorded executions. Two unscored shorthand divergences remain in the verification prose: the full-pass case `notes` name the spot checks `contribution_margin_ratio` and `break_even_units`, and `judgment.json`'s `computed_checks` name the quantities `contribution_margin_ratio`, `break_even_units` and `closing_mrr` — none of those is an output field name; the recorded output fields are `computed_contribution_margin_ratio`, `computed_break_even_units` and `computed_closing_mrr`, which this document uses.
8. **Evidence-text wording vs accepted value:** the recorded evidence text of `revenue_model_kind_is_stated_kind` spells the first accepted kind "one-time" ("one-time, subscription, usage or hybrid"), while the accepted input value stated in SERVICE.md and USER-GUIDE.md is `one_time`. The Checks section quotes the recorded evidence text verbatim; the Input reference and the check's semantics give the accepted values. Callers must send `one_time`.

## Worked examples

Provenance: recorded 2026-11-16T09:46:02.369628+00:00 against gateway v1.1.0, Wave 13 external verification, source `verification/work/pricing-unit-economics-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded run `full-pass`, Wave 13 external verification, 2026-11-16T09:46:02.369628+00:00 · gateway v1.1.0 · source `verification/work/pricing-unit-economics-pack/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "revenue_model_and_recognition",
      "check": "revenue_model_kind_is_stated_kind",
      "status": "pass",
      "evidence": "model clarity: the revenue model kind is one of the kinds the skill names — one-time, subscription, usage or hybrid"
    },
    {
      "section": "revenue_model_and_recognition",
      "check": "bookings_billings_and_recognized_revenue_kept_distinct",
      "status": "pass",
      "evidence": "model clarity: bookings, billings and recognized revenue are different things and are kept distinct"
    },
    {
      "section": "revenue_model_and_recognition",
      "check": "recognition_timing_documented",
      "status": "pass",
      "evidence": "model clarity: revenue recognition timing is documented"
    },
    {
      "section": "revenue_model_and_recognition",
      "check": "accountant_alignment_on_recognition_declared",
      "status": "pass",
      "evidence": "model clarity: recognition timing is aligned with the accountant — the accountant owns filings, the record keeps the data clean"
    },
    {
      "section": "pricing_and_packaging",
      "check": "value_based_anchor_documented",
      "status": "pass",
      "evidence": "pricing: the value-based anchor — what it is worth to the buyer — is documented"
    },
    {
      "section": "pricing_and_packaging",
      "check": "good_better_best_tiers_declared",
      "status": "pass",
      "evidence": "pricing: good-better-best tiers are declared"
    },
    {
      "section": "pricing_and_packaging",
      "check": "price_change_grandfathering_plan_present",
      "status": "pass",
      "evidence": "pricing: price changes carry a grandfathering plan"
    },
    {
      "section": "pricing_and_packaging",
      "check": "pricing_reviewed_annually_declared",
      "status": "pass",
      "evidence": "pricing: pricing is reviewed annually"
    },
    {
      "section": "pricing_and_packaging",
      "check": "price_tiers_declared",
      "status": "pass",
      "evidence": "the declared record names its price tiers — the tiers list is present; an empty list declares that the record prices no tier"
    },
    {
      "section": "pricing_and_packaging",
      "check": "every_price_tier_entry_complete",
      "status": "pass",
      "evidence": "price tiers: every declared tier row is complete — name, price, variable cost per unit, units, declared revenue and declared contribution all declared, the name non-empty"
    },
    {
      "section": "pricing_and_packaging",
      "check": "no_price_tier_name_duplicated",
      "status": "pass",
      "evidence": "price tiers: no declared tier name is owned by more than one tier row"
    },
    {
      "section": "pricing_and_packaging",
      "check": "tier_revenue_matches_price_times_units",
      "status": "pass",
      "evidence": "price tiers: every declared tier revenue equals its price times its units"
    },
    {
      "section": "pricing_and_packaging",
      "check": "tier_contribution_matches_unit_contribution_times_units",
      "status": "pass",
      "evidence": "price tiers: every declared tier contribution equals (price minus variable cost per unit) times its units"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "discount_approval_matrix_present",
      "status": "pass",
      "evidence": "discount guardrails: a discount approval matrix exists"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "discount_floor_prices_set",
      "status": "pass",
      "evidence": "discount guardrails: floor prices are set"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "deal_desk_for_exceptions_present",
      "status": "pass",
      "evidence": "discount guardrails: a deal desk handles exceptions"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "refund_and_credit_policy_present",
      "status": "pass",
      "evidence": "guardrails: a refund and credit policy exists"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "failed_payment_dunning_process_present",
      "status": "pass",
      "evidence": "guardrails: failed-payment handling — dunning — is in place"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "fraud_and_dispute_basics_present",
      "status": "pass",
      "evidence": "guardrails: fraud and dispute basics are in place"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "discounts_declared",
      "status": "pass",
      "evidence": "the declared record names its discounts — the discounts list is present; an empty list declares that no discounts were given"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "every_discount_names_reason",
      "status": "pass",
      "evidence": "discount guardrails: every declared discount row logs a reason — no ad-hoc generosity"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "no_discount_label_duplicated",
      "status": "pass",
      "evidence": "discount guardrails: no declared discount label is owned by more than one discount row"
    },
    {
      "section": "unit_economics",
      "check": "unit_economics_assumptions_stated",
      "status": "pass",
      "evidence": "unit economics: the assumptions behind the figures are stated and visible"
    },
    {
      "section": "unit_economics",
      "check": "unit_economics_assumptions_conservative_declared",
      "status": "pass",
      "evidence": "unit economics: the stated assumptions are declared conservative"
    },
    {
      "section": "unit_economics",
      "check": "unit_economics_updated_quarterly_declared",
      "status": "pass",
      "evidence": "unit economics: the figures are updated quarterly"
    },
    {
      "section": "unit_economics",
      "check": "contribution_margin_ratio_matches_price_and_variable_cost",
      "status": "pass",
      "evidence": "unit economics: the declared contribution-margin ratio equals (price per unit minus variable cost per unit) divided by price per unit"
    },
    {
      "section": "unit_economics",
      "check": "break_even_units_matches_fixed_costs_over_unit_contribution",
      "status": "pass",
      "evidence": "unit economics: the declared break-even units equal fixed costs divided by (price per unit minus variable cost per unit)"
    },
    {
      "section": "unit_economics",
      "check": "total_contribution_matches_units_sold_times_unit_contribution",
      "status": "pass",
      "evidence": "unit economics: the declared total contribution equals units sold times (price per unit minus variable cost per unit)"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "gross_and_net_churn_kept_distinct",
      "status": "pass",
      "evidence": "churn: gross churn and net churn are kept distinct"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "cohort_curves_used_not_single_period_averages",
      "status": "pass",
      "evidence": "churn: retention is read from cohort curves, not single-period averages"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "expansion_revenue_tracked",
      "status": "pass",
      "evidence": "churn: expansion revenue is tracked"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "mrr_bridge_closes_on_declared_figures",
      "status": "pass",
      "evidence": "reporting: the MRR bridge closes — declared closing MRR equals opening plus new plus expansion minus contraction minus churned MRR"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "cash_collection_and_recognized_revenue_kept_distinct",
      "status": "pass",
      "evidence": "reporting: cash collection and recognized revenue are kept distinct"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "forecast_inputs_handed_over_with_ranges_declared",
      "status": "pass",
      "evidence": "forecast inputs: committed plus pipeline plus base rates are handed to forecasting with ranges — this atom hands inputs over, it forecasts nothing itself"
    },
    {
      "section": "red_lines",
      "check": "no_bookings_presented_as_revenue",
      "status": "pass",
      "evidence": "red line: no vanity metrics — bookings presented as revenue are not present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_unrecorded_discounts",
      "status": "pass",
      "evidence": "red line: no unrecorded discounts are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_improvised_recognition_decisions",
      "status": "pass",
      "evidence": "red line: no improvised recognition decisions are present in the record"
    }
  ],
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
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across six sections.",
  "stamp": "PRICING UNIT ECONOMICS PACK\nproduct: SaaS-Platform-Alpha\nVERDICT: PRICING_UNIT_ECONOMICS_PACK_READY\n  revenue_model_and_recognition                pass\n  pricing_and_packaging                        pass\n  discount_and_payment_guardrails              pass\n  unit_economics                               pass\n  churn_retention_and_reporting                pass\n  red_lines                                    pass\n37 pass, 0 fail, 0 missing of 37 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded run `violations`, Wave 13 external verification, 2026-11-16T09:46:02.369628+00:00 · gateway v1.1.0 · source `verification/work/pricing-unit-economics-pack/evidence.json`.

Input:

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
      "declared_revenue": 999.0,
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

Response (HTTP 200):

```json
{
  "service": "pricing-unit-economics-pack",
  "atom_version": "0.1.0",
  "product": "SaaS-Platform-Alpha",
  "verdict": "PRICING_UNIT_ECONOMICS_PACK_NOT_READY",
  "sections": {
    "revenue_model_and_recognition": "pass",
    "pricing_and_packaging": "fail",
    "discount_and_payment_guardrails": "pass",
    "unit_economics": "pass",
    "churn_retention_and_reporting": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "revenue_model_and_recognition",
      "check": "revenue_model_kind_is_stated_kind",
      "status": "pass",
      "evidence": "model clarity: the revenue model kind is one of the kinds the skill names — one-time, subscription, usage or hybrid"
    },
    {
      "section": "revenue_model_and_recognition",
      "check": "bookings_billings_and_recognized_revenue_kept_distinct",
      "status": "pass",
      "evidence": "model clarity: bookings, billings and recognized revenue are different things and are kept distinct"
    },
    {
      "section": "revenue_model_and_recognition",
      "check": "recognition_timing_documented",
      "status": "pass",
      "evidence": "model clarity: revenue recognition timing is documented"
    },
    {
      "section": "revenue_model_and_recognition",
      "check": "accountant_alignment_on_recognition_declared",
      "status": "pass",
      "evidence": "model clarity: recognition timing is aligned with the accountant — the accountant owns filings, the record keeps the data clean"
    },
    {
      "section": "pricing_and_packaging",
      "check": "value_based_anchor_documented",
      "status": "pass",
      "evidence": "pricing: the value-based anchor — what it is worth to the buyer — is documented"
    },
    {
      "section": "pricing_and_packaging",
      "check": "good_better_best_tiers_declared",
      "status": "pass",
      "evidence": "pricing: good-better-best tiers are declared"
    },
    {
      "section": "pricing_and_packaging",
      "check": "price_change_grandfathering_plan_present",
      "status": "pass",
      "evidence": "pricing: price changes carry a grandfathering plan"
    },
    {
      "section": "pricing_and_packaging",
      "check": "pricing_reviewed_annually_declared",
      "status": "pass",
      "evidence": "pricing: pricing is reviewed annually"
    },
    {
      "section": "pricing_and_packaging",
      "check": "price_tiers_declared",
      "status": "pass",
      "evidence": "the declared record names its price tiers — the tiers list is present; an empty list declares that the record prices no tier"
    },
    {
      "section": "pricing_and_packaging",
      "check": "every_price_tier_entry_complete",
      "status": "pass",
      "evidence": "price tiers: every declared tier row is complete — name, price, variable cost per unit, units, declared revenue and declared contribution all declared, the name non-empty"
    },
    {
      "section": "pricing_and_packaging",
      "check": "no_price_tier_name_duplicated",
      "status": "pass",
      "evidence": "price tiers: no declared tier name is owned by more than one tier row"
    },
    {
      "section": "pricing_and_packaging",
      "check": "tier_revenue_matches_price_times_units",
      "status": "fail",
      "evidence": "price tiers: every declared tier revenue equals its price times its units"
    },
    {
      "section": "pricing_and_packaging",
      "check": "tier_contribution_matches_unit_contribution_times_units",
      "status": "pass",
      "evidence": "price tiers: every declared tier contribution equals (price minus variable cost per unit) times its units"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "discount_approval_matrix_present",
      "status": "pass",
      "evidence": "discount guardrails: a discount approval matrix exists"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "discount_floor_prices_set",
      "status": "pass",
      "evidence": "discount guardrails: floor prices are set"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "deal_desk_for_exceptions_present",
      "status": "pass",
      "evidence": "discount guardrails: a deal desk handles exceptions"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "refund_and_credit_policy_present",
      "status": "pass",
      "evidence": "guardrails: a refund and credit policy exists"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "failed_payment_dunning_process_present",
      "status": "pass",
      "evidence": "guardrails: failed-payment handling — dunning — is in place"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "fraud_and_dispute_basics_present",
      "status": "pass",
      "evidence": "guardrails: fraud and dispute basics are in place"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "discounts_declared",
      "status": "pass",
      "evidence": "the declared record names its discounts — the discounts list is present; an empty list declares that no discounts were given"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "every_discount_names_reason",
      "status": "pass",
      "evidence": "discount guardrails: every declared discount row logs a reason — no ad-hoc generosity"
    },
    {
      "section": "discount_and_payment_guardrails",
      "check": "no_discount_label_duplicated",
      "status": "pass",
      "evidence": "discount guardrails: no declared discount label is owned by more than one discount row"
    },
    {
      "section": "unit_economics",
      "check": "unit_economics_assumptions_stated",
      "status": "pass",
      "evidence": "unit economics: the assumptions behind the figures are stated and visible"
    },
    {
      "section": "unit_economics",
      "check": "unit_economics_assumptions_conservative_declared",
      "status": "pass",
      "evidence": "unit economics: the stated assumptions are declared conservative"
    },
    {
      "section": "unit_economics",
      "check": "unit_economics_updated_quarterly_declared",
      "status": "pass",
      "evidence": "unit economics: the figures are updated quarterly"
    },
    {
      "section": "unit_economics",
      "check": "contribution_margin_ratio_matches_price_and_variable_cost",
      "status": "pass",
      "evidence": "unit economics: the declared contribution-margin ratio equals (price per unit minus variable cost per unit) divided by price per unit"
    },
    {
      "section": "unit_economics",
      "check": "break_even_units_matches_fixed_costs_over_unit_contribution",
      "status": "pass",
      "evidence": "unit economics: the declared break-even units equal fixed costs divided by (price per unit minus variable cost per unit)"
    },
    {
      "section": "unit_economics",
      "check": "total_contribution_matches_units_sold_times_unit_contribution",
      "status": "pass",
      "evidence": "unit economics: the declared total contribution equals units sold times (price per unit minus variable cost per unit)"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "gross_and_net_churn_kept_distinct",
      "status": "pass",
      "evidence": "churn: gross churn and net churn are kept distinct"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "cohort_curves_used_not_single_period_averages",
      "status": "pass",
      "evidence": "churn: retention is read from cohort curves, not single-period averages"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "expansion_revenue_tracked",
      "status": "pass",
      "evidence": "churn: expansion revenue is tracked"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "mrr_bridge_closes_on_declared_figures",
      "status": "pass",
      "evidence": "reporting: the MRR bridge closes — declared closing MRR equals opening plus new plus expansion minus contraction minus churned MRR"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "cash_collection_and_recognized_revenue_kept_distinct",
      "status": "pass",
      "evidence": "reporting: cash collection and recognized revenue are kept distinct"
    },
    {
      "section": "churn_retention_and_reporting",
      "check": "forecast_inputs_handed_over_with_ranges_declared",
      "status": "pass",
      "evidence": "forecast inputs: committed plus pipeline plus base rates are handed to forecasting with ranges — this atom hands inputs over, it forecasts nothing itself"
    },
    {
      "section": "red_lines",
      "check": "no_bookings_presented_as_revenue",
      "status": "pass",
      "evidence": "red line: no vanity metrics — bookings presented as revenue are not present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_unrecorded_discounts",
      "status": "pass",
      "evidence": "red line: no unrecorded discounts are present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_improvised_recognition_decisions",
      "status": "pass",
      "evidence": "red line: no improvised recognition decisions are present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "tiers_count": 1,
  "duplicate_tier_names": [],
  "tiers_mismatching_revenue": [
    "Basic"
  ],
  "tiers_mismatching_contribution": [],
  "total_declared_tier_revenue": "999.000000",
  "total_declared_tier_contribution": "800.000000",
  "tier_contribution_margin": "0.800801",
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
  "summary": "36 pass, 1 fail, 0 missing of 37 checks across six sections.",
  "stamp": "PRICING UNIT ECONOMICS PACK\nproduct: SaaS-Platform-Alpha\nVERDICT: PRICING_UNIT_ECONOMICS_PACK_NOT_READY\n  revenue_model_and_recognition                pass\n  pricing_and_packaging                        fail\n  discount_and_payment_guardrails              pass\n  unit_economics                               pass\n  churn_retention_and_reporting                pass\n  red_lines                                    pass\n36 pass, 1 fail, 0 missing of 37 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded run `malformed`, Wave 13 external verification, 2026-11-16T09:46:02.369628+00:00 · gateway v1.1.0 · source `verification/work/pricing-unit-economics-pack/evidence.json`.

Input:

```json
{
  "product": "Malformed-Product",
  "revenue_model": "should_be_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "revenue_model",
  "detail": "revenue_model must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — U-13 screen NO with its five controls stated exactly as SERVICE.md records them; the flag stays open for the Director's review |
| Checks named | 37 documented / 37 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (the two counts, the five row-name / name lists, the two tier totals, the tier margin, the coverage ratio, the four re-derived figures and their four differences) |
| Input reference typed | Yes — 59 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/pricing-unit-economics-pack/evidence.json` |
