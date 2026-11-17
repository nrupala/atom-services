# Pricing unit economics pack — `pricing-unit-economics-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Understand revenue — models, pricing, unit economics, MRR/ARR discipline, churn math, deal guardrails.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Pricing reviews for product launches**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the pricing unit economics manifest

The caller submits one JSON manifest: a declared pricing /
unit-economics record for one product, made at a pricing
review. Every field below is read by the named section's
checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`PRICING_UNIT_ECONOMICS_PACK_NOT_READY`). All
fields are booleans unless noted.

| Field | Read by |
|---|---|
| `product` (string; carried into the verdict output, not itself checked) | — |
| `revenue_model.model_kind` (string; must be one of the kinds the skill names — `one_time`, `subscription`, `usage`, `hybrid`) | revenue_model_and_recognition |
| `revenue_model.bookings_billings_and_recognized_revenue_kept_distinct` (boolean) | revenue_model_and_recognition |
| `revenue_model.recognition_timing_documented` (boolean) | revenue_model_and_recognition |
| `revenue_model.accountant_alignment_on_recognition_declared` (boolean) | revenue_model_and_recognition |
| `pricing.value_based_anchor_documented` (boolean) | pricing_and_packaging |
| `pricing.good_better_best_tiers_declared` (boolean) | pricing_and_packaging |
| `pricing.price_change_grandfathering_plan_present` (boolean) | pricing_and_packaging |
| `pricing.pricing_reviewed_annually_declared` (boolean) | pricing_and_packaging |
| `tiers` (list of price-tier row objects, each with the entry fields below; computed, see below) | pricing_and_packaging |
| `tiers[].name` (string; names the row in the computed outputs) | pricing_and_packaging |
| `tiers[].price` (number; the tier's declared price point) | pricing_and_packaging |
| `tiers[].variable_cost_per_unit` (number) | pricing_and_packaging |
| `tiers[].units` (number; declared volume at this tier) | pricing_and_packaging |
| `tiers[].declared_revenue` (number; must equal `price` × `units`) | pricing_and_packaging |
| `tiers[].declared_contribution` (number; must equal (`price` − `variable_cost_per_unit`) × `units`) | pricing_and_packaging |
| `discount_policy.approval_matrix_present` (boolean) | discount_and_payment_guardrails |
| `discount_policy.floor_prices_set` (boolean) | discount_and_payment_guardrails |
| `discount_policy.deal_desk_for_exceptions_present` (boolean) | discount_and_payment_guardrails |
| `discount_policy.refund_and_credit_policy_present` (boolean) | discount_and_payment_guardrails |
| `discount_policy.failed_payment_dunning_process_present` (boolean) | discount_and_payment_guardrails |
| `discount_policy.fraud_and_dispute_basics_present` (boolean) | discount_and_payment_guardrails |
| `discounts` (list of discount-row objects, each with the entry fields below; computed, see below) | discount_and_payment_guardrails |
| `discounts[].label` (string; names the row in the computed outputs) | discount_and_payment_guardrails |
| `discounts[].reason` (string; the logged reason for the discount; must be present and non-empty per row) | discount_and_payment_guardrails |
| `unit_economics.assumptions_stated` (boolean) | unit_economics |
| `unit_economics.assumptions_conservative_declared` (boolean) | unit_economics |
| `unit_economics.unit_economics_updated_quarterly_declared` (boolean) | unit_economics |
| `unit_economics.price_per_unit` (number) | unit_economics |
| `unit_economics.variable_cost_per_unit` (number) | unit_economics |
| `unit_economics.fixed_costs` (number) | unit_economics |
| `unit_economics.units_sold` (number) | unit_economics |
| `unit_economics.declared_contribution_margin_ratio` (number; must equal (`price_per_unit` − `variable_cost_per_unit`) ÷ `price_per_unit`) | unit_economics |
| `unit_economics.declared_break_even_units` (number; must equal `fixed_costs` ÷ (`price_per_unit` − `variable_cost_per_unit`)) | unit_economics |
| `unit_economics.declared_total_contribution` (number; must equal `units_sold` × (`price_per_unit` − `variable_cost_per_unit`)) | unit_economics |
| `churn.gross_and_net_churn_kept_distinct` (boolean) | churn_retention_and_reporting |
| `churn.cohort_curves_used_not_single_period_averages` (boolean) | churn_retention_and_reporting |
| `churn.expansion_revenue_tracked` (boolean) | churn_retention_and_reporting |
| `mrr_bridge.opening_mrr` (number) | churn_retention_and_reporting |
| `mrr_bridge.new_mrr` (number) | churn_retention_and_reporting |
| `mrr_bridge.expansion_mrr` (number) | churn_retention_and_reporting |
| `mrr_bridge.contraction_mrr` (number) | churn_retention_and_reporting |
| `mrr_bridge.churned_mrr` (number) | churn_retention_and_reporting |
| `mrr_bridge.declared_closing_mrr` (number; must equal opening + new + expansion − contraction − churned) | churn_retention_and_reporting |
| `reporting.cash_collection_and_recognized_revenue_kept_distinct` (boolean) | churn_retention_and_reporting |
| `reporting.forecast_inputs_handed_over_with_ranges_declared` (boolean) | churn_retention_and_reporting |
| `red_lines.bookings_presented_as_revenue_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.unrecorded_discounts_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.improvised_recognition_decisions_present` (boolean; must be `false` to pass — skill red line) | red_lines |

Several checks are computed from the declared figures, using
only the skill's own stated rules plus the arithmetic of the
declared figures themselves — no outside threshold is imported:

- **Revenue model kind is a stated kind:** the declared
  `model_kind` must be one of the four kinds the skill's
  Method 1 names — one-time, subscription, usage or hybrid. A
  kind absent is missing evidence; any other string fails.
- **Price tiers declared:** the declared `tiers` list passes
  when it is present. An absent list is missing evidence. An
  empty list passes: it declares that the record prices no
  tier, and the skill requires no tier.
- **Every price tier entry complete:** every declared tier row
  must declare all six entry fields, the `name` non-empty. A
  row with a field absent is missing evidence; a row naming an
  empty name fails. On an empty list the check passes
  vacuously.
- **No price tier name duplicated:** no declared tier `name`
  may appear on more than one tier row. A row with `name`
  absent is missing evidence for this check.
- **Tier revenue matches price times units:** every row's
  `declared_revenue` must equal its `price` × `units`. A row
  missing any of the three figures is missing evidence for
  this check.
- **Tier contribution matches unit contribution times units:**
  every row's `declared_contribution` must equal (`price` −
  `variable_cost_per_unit`) × `units`.
- **Discounts declared:** the declared `discounts` list passes
  when it is present; an empty list declares that no discounts
  were given.
- **Every discount names a reason:** every declared discount
  row must log a non-empty `reason` string (the skill:
  "every discount logged with reason — no ad-hoc generosity").
  A row with the field absent is missing evidence; a row
  logging an empty reason fails. On an empty list the check
  passes vacuously.
- **No discount label duplicated:** no declared discount
  `label` may appear on more than one discount row.
- **Contribution margin ratio matches price and variable
  cost:** the declared ratio must equal (`price_per_unit` −
  `variable_cost_per_unit`) ÷ `price_per_unit`. A zero price
  makes the ratio undefined: the check fails (the figures are
  present but the ratio cannot hold) and the computed ratio is
  reported null.
- **Break-even units match fixed costs over unit
  contribution:** the declared break-even units must equal
  `fixed_costs` ÷ (`price_per_unit` −
  `variable_cost_per_unit`). A zero unit contribution makes
  break-even undefined: the check fails and the computed
  break-even is reported null.
- **Total contribution matches units sold times unit
  contribution:** the declared total must equal `units_sold`
  × (`price_per_unit` − `variable_cost_per_unit`).
- **MRR bridge closes on declared figures:** the skill's
  Method 6 states the bridge verbatim — new + expansion −
  contraction − churn = delta — so the declared closing MRR
  must equal opening + new + expansion − contraction −
  churned MRR. A bridge with any figure absent is missing
  evidence.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the thirteen primary computed checks above cannot be
completed), `tiers_count` and `discounts_count` (declared
list lengths, or null when a list is not declared — counts
are reported as integers, exactly), `duplicate_tier_names`
and `duplicate_discount_labels` (names declared on more than
one row, in the order their second occurrence appears), the
row-name lists `tiers_mismatching_revenue` and
`tiers_mismatching_contribution` (rows whose figures are all
declared and whose declared revenue / contribution does not
re-derive), `discounts_without_reason` (discounts whose
reason field is present but empty), the sums
`total_declared_tier_revenue` and
`total_declared_tier_contribution` (null when any row lacks
the figure), the ratio `tier_contribution_margin` (total
contribution ÷ total revenue; null when the totals are absent
or revenue is zero), the coverage ratio
`discount_reason_coverage` (discounts logging a reason ÷
declared discounts), and the re-derived unit-economics and
bridge figures with their differences against the declared
figures: `computed_contribution_margin_ratio`,
`contribution_margin_difference`, `computed_break_even_units`,
`break_even_difference`, `computed_total_contribution`,
`total_contribution_difference`, `computed_closing_mrr` and
`closing_mrr_difference` (each null when its inputs are not
all declared or its denominator is zero).
**Fixed serialization rule:** computed amounts and ratios are
reported as strings with exactly six decimal places, produced
in both implementations by the same rule — round half up to
6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with
exactly six decimals; computed comparisons compare the
fixed-6dp difference to zero. A figure is null when its
inputs are absent or its denominator is zero. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states **no numeric threshold at all** — its demands
are the model, packaging, guardrail and reporting declarations
above plus arithmetic consistency over the caller's own
figures. Quantities are computed and reported; the only bars
on the computed rows are completeness and re-derivation over
the caller's own declared figures, exactly as stated above.
Declined thresholds, named: a minimum or target contribution
margin, gross margin or markup; a maximum discount percentage
or amount, or a floor-price level the atom would set itself;
a churn, retention or expansion-revenue bar; an LTV, CAC,
ARPU or payback figure, ratio (such as LTV/CAC) or ceiling —
the skill names ARPU, LTV (with assumptions visible and
conservative), CAC and payback months as unit-economics
numbers but states **no formula and no bar** for any of them,
so none is computed, checked or reported here; a price point,
price increase or elasticity figure for any tier; a
break-even deadline or a maximum break-even volume beyond
the arithmetic consistency of the declared figures; an MRR /
ARR growth rate or bridge-component bar; a cohort size or
observation window for cohort curves; a refund, credit or
dunning period or amount; a forecast range width for the
inputs handed to forecasting.

The verdict is one of `PRICING_UNIT_ECONOMICS_PACK_READY`
(all 37 checks pass), `PRICING_UNIT_ECONOMICS_PACK_NOT_READY`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails
but evidence is missing), across six sections:
revenue_model_and_recognition, pricing_and_packaging,
discount_and_payment_guardrails, unit_economics,
churn_retention_and_reporting, red_lines.

## Distinct ground

The nearest siblings are `cost-estimate-preparation` (a
project cost-estimate record — estimate class and method,
line-item quantities times rates, contingency and escalation
percentages of a subtotal, should-cost benchmarks and vendor
quotes), `cash-flow-forecast` (a declared 13-week cash
forecast — weekly closing balances re-derived from opening
plus inflows minus outflows, a reserve target sized in months
of fixed costs, runway as cash divided by burn, stress cases)
and `budget-design-review` (a budget record — budget type and
line owners, line amounts as driver quantity times unit cost,
a declared total balanced against expected income, variance
and close process). This atom shares **zero checks** with any
of them (verified by comparing every check name here against
every other atom's source): every check here is a pricing /
unit-economics question — the revenue model kind stated with
bookings, billings and recognized revenue kept distinct and
recognition timing aligned with the accountant, a value-based
anchor with good-better-best tiers, a grandfathering plan and
annual pricing review, declared tier revenue and contribution
re-derived from price, variable cost and units, a discount
approval matrix with floor prices and a deal desk over
discount rows that each log a reason, refund / dunning /
fraud guardrails, a contribution-margin ratio, break-even
units and total contribution re-derived from the declared
unit inputs, gross and net churn kept distinct with cohort
curves and expansion revenue tracked, an MRR bridge that
closes on its own declared figures, cash collection kept
distinct from recognized revenue, forecast inputs handed over
with ranges, and the revenue red lines. The boundary is: one
product's pricing and unit-economics record here; project
cost estimation, cash-flow forecasting and budget design
there.

## Honest scoping

This atom reviews a **declared** pricing / unit-economics
record — it sets no price, inspects no accounting system,
CRM, price list, contract or ledger, runs no market or
competitor analysis, and does not verify that a declared
record was ever carried out. A record is ready *on the
caller's declared evidence*: a record that declares a
documented value anchor, logged discount reasons and closing
bridge figures passes those checks even if the real pricing
did none of it. It is a completeness and arithmetic audit of
the pricing record the skill requires, **not a pricing
service, a revenue forecast, an accounting or tax opinion, or
financial advice of any kind**: it never judges whether a
price is right, whether a margin is good, whether a discount
should have been given, whether the declared assumptions are
realistic, or whether the product will sell — only that the
record contains what the skill's method, quality gates and
red lines demand, and that its declared figures are
internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds at
all (see the declined list above); no live verification of
any declared fact; no judgment of pricing *quality* — whether
the anchor, tiers, discounts or assumptions are adequate for
the real product is the caller's declaration, checked only
for declared presence and arithmetic consistency; the skill's
advice-shaped steps are **excluded from production and are
red lines here, not features**: working out what the unit
economics "say about pricing" (the skill's own example),
recommending a price, tier structure, discount or deal,
projecting revenue, MRR or churn forward, and valuing a
customer (LTV) or a business are never performed — the atom
audits the record of decisions the caller has already made;
recognition substance (whether a timing decision is correct
under accounting rules) is a caller declaration aligned with
their accountant — only its declared presence is checked, and
the output is not accounting advice.

## U-13 regulatory screen

Screen result: **No — with the design controls below, this
atom's output could not read as regulated financial advice.**
It is finance-adjacent (it handles a business's own pricing
and revenue figures), so the screen was applied strictly.
What prevents an advice reading: (1) the atom audits a
caller-**declared** record for completeness and arithmetic
consistency only — every output is a pass / fail / missing
verdict on the record, a re-derived figure, or a difference
against the caller's own declared figure; (2) it gives **no
recommendation, no projection and no forecast** — it never
says what a price, discount, margin or model should be, and
its one forward-looking check is a declaration that forecast
*inputs* were handed to a separate forecasting capability
with ranges; (3) it sets **no threshold** — no margin bar,
churn bar or LTV/CAC ratio against which a caller's business
could be graded as good or bad; (4) the skill's advice-shaped
steps (working out what the figures say about pricing,
deal approvals, LTV/CAC/payback computation) are excluded
from production and named as exclusions above — ARPU, LTV,
CAC and payback are not computed, checked or reported at all,
because the skill states no formula for them and computing
them would turn an audit into an analysis; (5) the figures
are a business's own operating record, not a personal
financial position, a security, a portfolio or a credit
decision, and no output is addressed to an investment or
borrowing choice. Residual risk, stated plainly: a caller
could paste the verdict into their own pricing decision —
that is their decision, made on their record; the artifact
itself recommends nothing.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
