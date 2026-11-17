#!/usr/bin/env python3
"""Pricing unit economics pack — deterministic core.

Built from the bound skill `revenue-management`: "Understand
revenue — models, pricing, unit economics, MRR/ARR discipline,
churn math, deal guardrails." ("Revenue is the scoreboard, but
only if you keep the score honestly: know your model, protect
pricing, and read retention before celebrating growth.")

This atom is a DELIVERABLE audit of a declared pricing /
unit-economics record: it audits the record a caller declares
against the record the skill defines — revenue-model clarity
with bookings, billings and recognized revenue kept distinct,
value-anchored pricing and packaging over declared price
tiers, discount guardrails over declared discount rows, unit
economics with stated assumptions whose declared margin,
break-even and total-contribution figures re-derive from the
declared price / cost / volume inputs, churn and retention
math with an MRR bridge that closes on its own declared
figures, and the skill's red lines refused. It does not set a
price, recommend a price, discount, model or figure, project
or forecast anything, inspect an accounting system, a CRM or
a ledger, or verify that a declared record was ever carried
out — it checks that the pricing / unit-economics record the
skill requires is present and internally complete and
consistent on the declared evidence. That scoping is also the
U-13 screen: the output is a completeness and arithmetic
audit of a caller-declared record, never advice.

Distinct ground: the nearest siblings are
`cost-estimate-preparation` (a project cost-estimate record —
estimate class and method, line-item quantities times rates,
contingency and escalation percentages, vendor quotes),
`cash-flow-forecast` (a declared 13-week cash forecast —
weekly closing balances, reserve target, runway) and
`budget-design-review` (a budget record — budget type, line
owners, driver products, a total balanced against expected
income). This atom shares zero checks with any of them: every
check here is a pricing / unit-economics question — the
revenue model kind stated with bookings / billings /
recognized revenue distinct and recognition timing aligned
with the accountant, a value-based anchor with good-better-
best tiers and a grandfathering plan for price changes,
declared tier revenue and contribution re-derived from price,
variable cost and units, a discount approval matrix with
floor prices and a deal desk over discount rows that each log
a reason, a contribution-margin ratio, break-even units and
total contribution that re-derive from the declared unit
inputs, gross and net churn kept distinct with cohort curves,
and an MRR bridge that closes. The boundary is: one product's
pricing and unit-economics record here; project cost
estimation, cash-flow forecasting and budget design there.

The caller submits a pricing manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the arithmetic of the declared figures themselves — no
outside threshold is imported:

- revenue model kind: the declared `model_kind` must be one
  of the four kinds the skill names — one-time, subscription,
  usage, hybrid;
- price tiers: the declared `tiers` list must be present (an
  empty list is a valid declaration — the record prices no
  tier; the skill requires no tier), every declared tier row
  must be complete (name, price, variable cost per unit,
  units, declared revenue and declared contribution all
  present, the name non-empty), no tier name may be duplicated,
  each row's declared revenue must equal its price times its
  units, and each row's declared contribution must equal
  (price − variable cost per unit) times its units;
- discount rows: the declared `discounts` list must be present
  (an empty list declares no discounts were given), every
  declared discount row must log a non-empty `reason` (the
  skill: "every discount logged with reason — no ad-hoc
  generosity"), and no discount label may be duplicated;
- unit economics: the declared contribution-margin ratio must
  equal (price per unit − variable cost per unit) ÷ price per
  unit, the declared break-even units must equal fixed costs
  ÷ (price per unit − variable cost per unit), and the
  declared total contribution must equal units sold times
  (price per unit − variable cost per unit) — sums, margins
  and break-even consistency over the declared figures only;
- MRR bridge (skill Method 6, stated verbatim): the declared
  closing MRR must equal opening + new + expansion −
  contraction − churned MRR.

Computed amounts and ratios are serialized as strings with
exactly six decimal places, produced in both implementations
by the same fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly
six decimals; computed comparisons compare the fixed-6dp
difference to zero, and ratio comparisons use the unrounded
values through that same difference. That fixed serialization
is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states NO numeric threshold at all — no margin bar,
no discount cap, no churn or payback ceiling, no LTV/CAC
ratio, no price point, no elasticity figure — so no numeric
threshold check is invented; those quantities are computed
and reported, with completeness and arithmetic consistency
over the caller's own declared figures as the only bars,
exactly as stated above. In particular the skill names ARPU,
LTV, CAC and payback months as unit-economics numbers but
states no formula and no bar for any of them, so none is
computed, checked or reported here; a caller may declare them
elsewhere, this atom takes no position on them.

Verdict:
- any fail             -> PRICING_UNIT_ECONOMICS_PACK_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PRICING_UNIT_ECONOMICS_PACK_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "revenue_model_and_recognition",
    "pricing_and_packaging",
    "discount_and_payment_guardrails",
    "unit_economics",
    "churn_retention_and_reporting",
    "red_lines",
)

STATED_MODEL_KINDS = ("one_time", "subscription", "usage", "hybrid")

MANIFEST_SPEC = {
    "product": "string",
    "revenue_model": {
        "model_kind": "string",
        "bookings_billings_and_recognized_revenue_kept_distinct": "boolean",
        "recognition_timing_documented": "boolean",
        "accountant_alignment_on_recognition_declared": "boolean",
    },
    "pricing": {
        "value_based_anchor_documented": "boolean",
        "good_better_best_tiers_declared": "boolean",
        "price_change_grandfathering_plan_present": "boolean",
        "pricing_reviewed_annually_declared": "boolean",
    },
    "tiers": [{
        "name": "string",
        "price": "number",
        "variable_cost_per_unit": "number",
        "units": "number",
        "declared_revenue": "number",
        "declared_contribution": "number",
    }],
    "discount_policy": {
        "approval_matrix_present": "boolean",
        "floor_prices_set": "boolean",
        "deal_desk_for_exceptions_present": "boolean",
        "refund_and_credit_policy_present": "boolean",
        "failed_payment_dunning_process_present": "boolean",
        "fraud_and_dispute_basics_present": "boolean",
    },
    "discounts": [{
        "label": "string",
        "reason": "string",
    }],
    "unit_economics": {
        "assumptions_stated": "boolean",
        "assumptions_conservative_declared": "boolean",
        "unit_economics_updated_quarterly_declared": "boolean",
        "price_per_unit": "number",
        "variable_cost_per_unit": "number",
        "fixed_costs": "number",
        "units_sold": "number",
        "declared_contribution_margin_ratio": "number",
        "declared_break_even_units": "number",
        "declared_total_contribution": "number",
    },
    "churn": {
        "gross_and_net_churn_kept_distinct": "boolean",
        "cohort_curves_used_not_single_period_averages": "boolean",
        "expansion_revenue_tracked": "boolean",
    },
    "mrr_bridge": {
        "opening_mrr": "number",
        "new_mrr": "number",
        "expansion_mrr": "number",
        "contraction_mrr": "number",
        "churned_mrr": "number",
        "declared_closing_mrr": "number",
    },
    "reporting": {
        "cash_collection_and_recognized_revenue_kept_distinct": "boolean",
        "forecast_inputs_handed_over_with_ranges_declared": "boolean",
    },
    "red_lines": {
        "bookings_presented_as_revenue_present": "boolean",
        "unrecorded_discounts_present": "boolean",
        "improvised_recognition_decisions_present": "boolean",
    },
}

TIER_FIELDS = (
    "name", "price", "variable_cost_per_unit", "units",
    "declared_revenue", "declared_contribution",
)
REVENUE_FIELDS = ("price", "units", "declared_revenue")
CONTRIBUTION_FIELDS = (
    "price", "variable_cost_per_unit", "units", "declared_contribution",
)
BRIDGE_FIELDS = (
    "opening_mrr", "new_mrr", "expansion_mrr", "contraction_mrr",
    "churned_mrr", "declared_closing_mrr",
)


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _is_num(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _row_numbers(entry, fields):
    return (
        isinstance(entry, dict)
        and all(_is_num(entry.get(f)) for f in fields)
    )


def evaluate(manifest):
    """Return the verdict dict for a pricing unit economics manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows / figures, read once for computed checks ----
    tiers, has_tiers = _get(manifest, "tiers")
    tiers_is_list = has_tiers and isinstance(tiers, list)
    tiers_count = len(tiers) if tiers_is_list else None
    trows = tiers if tiers_is_list else []

    tiers_mismatching_revenue = (
        [_row_name(c, "name") for c in trows
         if _row_numbers(c, REVENUE_FIELDS)
         and _fmt6(c["declared_revenue"] - c["price"] * c["units"])
         != "0.000000"]
        if tiers_is_list else None
    )
    tiers_mismatching_contribution = (
        [_row_name(c, "name") for c in trows
         if _row_numbers(c, CONTRIBUTION_FIELDS)
         and _fmt6(c["declared_contribution"]
                   - (c["price"] - c["variable_cost_per_unit"])
                   * c["units"]) != "0.000000"]
        if tiers_is_list else None
    )
    duplicate_tier_names = None
    if tiers_is_list:
        seen = []
        duplicate_tier_names = []
        for c in trows:
            if isinstance(c, dict) and isinstance(c.get("name"), str):
                nm = c["name"]
                if nm in seen and nm not in duplicate_tier_names:
                    duplicate_tier_names.append(nm)
                seen.append(nm)
    total_tier_revenue = (
        sum(c["declared_revenue"] for c in trows
            if _is_num(c.get("declared_revenue")))
        if tiers_is_list
        and all(_row_numbers(c, ("declared_revenue",)) for c in trows)
        else None
    )
    total_tier_contribution = (
        sum(c["declared_contribution"] for c in trows
            if _is_num(c.get("declared_contribution")))
        if tiers_is_list
        and all(_row_numbers(c, ("declared_contribution",))
                for c in trows)
        else None
    )
    tier_contribution_margin = (
        total_tier_contribution / total_tier_revenue
        if total_tier_revenue is not None
        and total_tier_contribution is not None
        and total_tier_revenue != 0 else None
    )

    discounts, has_discounts = _get(manifest, "discounts")
    discounts_is_list = has_discounts and isinstance(discounts, list)
    discounts_count = len(discounts) if discounts_is_list else None
    drows = discounts if discounts_is_list else []

    discounts_without_reason = (
        [_row_name(c, "label") for c in drows
         if isinstance(c, dict)
         and "reason" in c
         and not (isinstance(c.get("reason"), str)
                  and c.get("reason") != "")]
        if discounts_is_list else None
    )
    duplicate_discount_labels = None
    if discounts_is_list:
        seen = []
        duplicate_discount_labels = []
        for c in drows:
            if isinstance(c, dict) and isinstance(c.get("label"), str):
                nm = c["label"]
                if nm in seen and nm not in duplicate_discount_labels:
                    duplicate_discount_labels.append(nm)
                seen.append(nm)
    discount_reason_coverage = (
        sum(1 for c in drows
            if isinstance(c, dict)
            and isinstance(c.get("reason"), str)
            and c.get("reason") != "")
        / discounts_count
        if discounts_is_list and discounts_count > 0 else None
    )

    ue, has_ue = _get(manifest, "unit_economics")
    ue = ue if isinstance(ue, dict) else {}

    def _ue(field):
        return ue.get(field) if _is_num(ue.get(field)) else None

    price_per_unit = _ue("price_per_unit")
    ue_variable = _ue("variable_cost_per_unit")
    fixed_costs = _ue("fixed_costs")
    units_sold = _ue("units_sold")
    declared_ratio = _ue("declared_contribution_margin_ratio")
    declared_be = _ue("declared_break_even_units")
    declared_total_contrib = _ue("declared_total_contribution")

    unit_contribution = (
        price_per_unit - ue_variable
        if price_per_unit is not None and ue_variable is not None
        else None
    )
    computed_ratio = (
        unit_contribution / price_per_unit
        if unit_contribution is not None and price_per_unit != 0
        else None
    )
    ratio_difference = (
        declared_ratio - computed_ratio
        if declared_ratio is not None and computed_ratio is not None
        else None
    )
    computed_be = (
        fixed_costs / unit_contribution
        if fixed_costs is not None and unit_contribution is not None
        and unit_contribution != 0 else None
    )
    be_difference = (
        declared_be - computed_be
        if declared_be is not None and computed_be is not None
        else None
    )
    computed_total_contrib = (
        units_sold * unit_contribution
        if units_sold is not None and unit_contribution is not None
        else None
    )
    total_contrib_difference = (
        declared_total_contrib - computed_total_contrib
        if declared_total_contrib is not None
        and computed_total_contrib is not None else None
    )

    bridge, has_bridge = _get(manifest, "mrr_bridge")
    bridge = bridge if isinstance(bridge, dict) else {}
    bridge_present = all(
        _is_num(bridge.get(f)) for f in BRIDGE_FIELDS
    ) if has_bridge and isinstance(bridge, dict) else False
    # present for the check means every bridge field is declared;
    # a partially declared bridge is missing evidence, exactly as
    # an absent bridge is.
    bridge_all_declared = (
        isinstance(bridge, dict)
        and all(f in bridge for f in BRIDGE_FIELDS)
        and bridge_present
    )
    computed_closing = (
        bridge["opening_mrr"] + bridge["new_mrr"]
        + bridge["expansion_mrr"] - bridge["contraction_mrr"]
        - bridge["churned_mrr"]
        if bridge_all_declared else None
    )
    closing_difference = (
        bridge["declared_closing_mrr"] - computed_closing
        if bridge_all_declared else None
    )

    # ---- Section 1: revenue_model_and_recognition (skill Method
    #      1 "Model clarity first" and Quality gate 1 — the model
    #      documented incl. recognition timing, with accountant
    #      alignment) ----
    model_kind, model_kind_present = _get(
        manifest, "revenue_model", "model_kind")
    _check(results, "revenue_model_and_recognition",
           "revenue_model_kind_is_stated_kind", model_kind,
           model_kind_present,
           model_kind in STATED_MODEL_KINDS,
           "model clarity: the revenue model kind is one of the "
           "kinds the skill names — one-time, subscription, "
           "usage or hybrid")
    _bool_check(results, "revenue_model_and_recognition",
                "bookings_billings_and_recognized_revenue_kept_distinct",
                manifest,
                ("revenue_model",
                 "bookings_billings_and_recognized_revenue_kept_distinct"),
                "model clarity: bookings, billings and recognized "
                "revenue are different things and are kept distinct")
    _bool_check(results, "revenue_model_and_recognition",
                "recognition_timing_documented", manifest,
                ("revenue_model", "recognition_timing_documented"),
                "model clarity: revenue recognition timing is "
                "documented")
    _bool_check(results, "revenue_model_and_recognition",
                "accountant_alignment_on_recognition_declared",
                manifest,
                ("revenue_model",
                 "accountant_alignment_on_recognition_declared"),
                "model clarity: recognition timing is aligned "
                "with the accountant — the accountant owns "
                "filings, the record keeps the data clean")

    # ---- Section 2: pricing_and_packaging (skill Method 2 —
    #      value-based anchors, good-better-best tiers, price
    #      changes with a grandfathering plan, annual review;
    #      plus the computed tier rows) ----
    _bool_check(results, "pricing_and_packaging",
                "value_based_anchor_documented", manifest,
                ("pricing", "value_based_anchor_documented"),
                "pricing: the value-based anchor — what it is "
                "worth to the buyer — is documented")
    _bool_check(results, "pricing_and_packaging",
                "good_better_best_tiers_declared", manifest,
                ("pricing", "good_better_best_tiers_declared"),
                "pricing: good-better-best tiers are declared")
    _bool_check(results, "pricing_and_packaging",
                "price_change_grandfathering_plan_present", manifest,
                ("pricing", "price_change_grandfathering_plan_present"),
                "pricing: price changes carry a grandfathering "
                "plan")
    _bool_check(results, "pricing_and_packaging",
                "pricing_reviewed_annually_declared", manifest,
                ("pricing", "pricing_reviewed_annually_declared"),
                "pricing: pricing is reviewed annually")
    _check(results, "pricing_and_packaging",
           "price_tiers_declared", tiers, tiers_is_list,
           tiers_is_list,
           "the declared record names its price tiers — the "
           "tiers list is present; an empty list declares that "
           "the record prices no tier")
    tier_complete_present = (
        tiers_is_list
        and all(isinstance(c, dict)
                and all(f in c for f in TIER_FIELDS) for c in trows)
    )
    _check(results, "pricing_and_packaging",
           "every_price_tier_entry_complete", tiers,
           tier_complete_present,
           tiers_is_list
           and all(isinstance(c, dict)
                   and isinstance(c.get("name"), str)
                   and c.get("name") != ""
                   and all(_is_num(c.get(f)) for f in TIER_FIELDS[1:])
                   for c in trows),
           "price tiers: every declared tier row is complete — "
           "name, price, variable cost per unit, units, declared "
           "revenue and declared contribution all declared, the "
           "name non-empty")
    tier_name_present = (
        tiers_is_list
        and all(isinstance(c, dict) and "name" in c for c in trows)
    )
    _check(results, "pricing_and_packaging",
           "no_price_tier_name_duplicated", tiers,
           tier_name_present,
           tiers_is_list
           and duplicate_tier_names is not None
           and len(duplicate_tier_names) == 0,
           "price tiers: no declared tier name is owned by more "
           "than one tier row")
    tier_rev_present = (
        tiers_is_list
        and all(_row_numbers(c, REVENUE_FIELDS) for c in trows)
        and all(isinstance(c, dict) and all(f in c for f in REVENUE_FIELDS)
                for c in trows)
    )
    _check(results, "pricing_and_packaging",
           "tier_revenue_matches_price_times_units", tiers,
           tier_rev_present,
           tiers_is_list
           and tiers_mismatching_revenue is not None
           and len(tiers_mismatching_revenue) == 0,
           "price tiers: every declared tier revenue equals its "
           "price times its units")
    tier_con_present = (
        tiers_is_list
        and all(isinstance(c, dict)
                and all(f in c for f in CONTRIBUTION_FIELDS)
                for c in trows)
        and all(_row_numbers(c, CONTRIBUTION_FIELDS) for c in trows)
    )
    _check(results, "pricing_and_packaging",
           "tier_contribution_matches_unit_contribution_times_units",
           tiers, tier_con_present,
           tiers_is_list
           and tiers_mismatching_contribution is not None
           and len(tiers_mismatching_contribution) == 0,
           "price tiers: every declared tier contribution equals "
           "(price minus variable cost per unit) times its units")

    # ---- Section 3: discount_and_payment_guardrails (skill
    #      Method 3 "Discount guardrails" and Method 7
    #      "Guardrails", plus the computed discount rows and
    #      Quality gate 3 — discount policy exists, exceptions
    #      logged) ----
    _bool_check(results, "discount_and_payment_guardrails",
                "discount_approval_matrix_present", manifest,
                ("discount_policy", "approval_matrix_present"),
                "discount guardrails: a discount approval matrix "
                "exists")
    _bool_check(results, "discount_and_payment_guardrails",
                "discount_floor_prices_set", manifest,
                ("discount_policy", "floor_prices_set"),
                "discount guardrails: floor prices are set")
    _bool_check(results, "discount_and_payment_guardrails",
                "deal_desk_for_exceptions_present", manifest,
                ("discount_policy", "deal_desk_for_exceptions_present"),
                "discount guardrails: a deal desk handles "
                "exceptions")
    _bool_check(results, "discount_and_payment_guardrails",
                "refund_and_credit_policy_present", manifest,
                ("discount_policy", "refund_and_credit_policy_present"),
                "guardrails: a refund and credit policy exists")
    _bool_check(results, "discount_and_payment_guardrails",
                "failed_payment_dunning_process_present", manifest,
                ("discount_policy",
                 "failed_payment_dunning_process_present"),
                "guardrails: failed-payment handling — dunning — "
                "is in place")
    _bool_check(results, "discount_and_payment_guardrails",
                "fraud_and_dispute_basics_present", manifest,
                ("discount_policy", "fraud_and_dispute_basics_present"),
                "guardrails: fraud and dispute basics are in place")
    _check(results, "discount_and_payment_guardrails",
           "discounts_declared", discounts, discounts_is_list,
           discounts_is_list,
           "the declared record names its discounts — the "
           "discounts list is present; an empty list declares "
           "that no discounts were given")
    reason_present = (
        discounts_is_list
        and all(isinstance(c, dict) and "reason" in c for c in drows)
    )
    _check(results, "discount_and_payment_guardrails",
           "every_discount_names_reason", discounts, reason_present,
           discounts_is_list
           and all(isinstance(c, dict)
                   and isinstance(c.get("reason"), str)
                   and c.get("reason") != ""
                   for c in drows),
           "discount guardrails: every declared discount row "
           "logs a reason — no ad-hoc generosity")
    label_present = (
        discounts_is_list
        and all(isinstance(c, dict) and "label" in c for c in drows)
    )
    _check(results, "discount_and_payment_guardrails",
           "no_discount_label_duplicated", discounts, label_present,
           discounts_is_list
           and duplicate_discount_labels is not None
           and len(duplicate_discount_labels) == 0,
           "discount guardrails: no declared discount label is "
           "owned by more than one discount row")

    # ---- Section 4: unit_economics (skill Method 4 — unit
    #      economics with assumptions visible; Quality gate 2 —
    #      stated assumptions, updated quarterly; plus the
    #      computed margin / break-even / total checks) ----
    _bool_check(results, "unit_economics",
                "unit_economics_assumptions_stated", manifest,
                ("unit_economics", "assumptions_stated"),
                "unit economics: the assumptions behind the "
                "figures are stated and visible")
    _bool_check(results, "unit_economics",
                "unit_economics_assumptions_conservative_declared",
                manifest,
                ("unit_economics", "assumptions_conservative_declared"),
                "unit economics: the stated assumptions are "
                "declared conservative")
    _bool_check(results, "unit_economics",
                "unit_economics_updated_quarterly_declared", manifest,
                ("unit_economics",
                 "unit_economics_updated_quarterly_declared"),
                "unit economics: the figures are updated "
                "quarterly")
    ratio_present = (
        price_per_unit is not None and ue_variable is not None
        and declared_ratio is not None
    )
    _check(results, "unit_economics",
           "contribution_margin_ratio_matches_price_and_variable_cost",
           ue if has_ue else None, ratio_present,
           ratio_present and computed_ratio is not None
           and _fmt6(ratio_difference) == "0.000000",
           "unit economics: the declared contribution-margin "
           "ratio equals (price per unit minus variable cost "
           "per unit) divided by price per unit")
    be_present = (
        fixed_costs is not None and price_per_unit is not None
        and ue_variable is not None and declared_be is not None
    )
    _check(results, "unit_economics",
           "break_even_units_matches_fixed_costs_over_unit_contribution",
           ue if has_ue else None, be_present,
           be_present and computed_be is not None
           and _fmt6(be_difference) == "0.000000",
           "unit economics: the declared break-even units equal "
           "fixed costs divided by (price per unit minus "
           "variable cost per unit)")
    total_present = (
        units_sold is not None and price_per_unit is not None
        and ue_variable is not None
        and declared_total_contrib is not None
    )
    _check(results, "unit_economics",
           "total_contribution_matches_units_sold_times_unit_contribution",
           ue if has_ue else None, total_present,
           total_present and computed_total_contrib is not None
           and _fmt6(total_contrib_difference) == "0.000000",
           "unit economics: the declared total contribution "
           "equals units sold times (price per unit minus "
           "variable cost per unit)")

    # ---- Section 5: churn_retention_and_reporting (skill Method
    #      5 "Churn & retention math", Method 6 "Reporting" with
    #      the MRR bridge, Method 8 "Forecast inputs", and
    #      Quality gate 4 — MRR bridge maintained, cash vs
    #      recognized separate) ----
    _bool_check(results, "churn_retention_and_reporting",
                "gross_and_net_churn_kept_distinct", manifest,
                ("churn", "gross_and_net_churn_kept_distinct"),
                "churn: gross churn and net churn are kept "
                "distinct")
    _bool_check(results, "churn_retention_and_reporting",
                "cohort_curves_used_not_single_period_averages",
                manifest,
                ("churn",
                 "cohort_curves_used_not_single_period_averages"),
                "churn: retention is read from cohort curves, "
                "not single-period averages")
    _bool_check(results, "churn_retention_and_reporting",
                "expansion_revenue_tracked", manifest,
                ("churn", "expansion_revenue_tracked"),
                "churn: expansion revenue is tracked")
    _check(results, "churn_retention_and_reporting",
           "mrr_bridge_closes_on_declared_figures",
           bridge if has_bridge else None, bridge_all_declared,
           bridge_all_declared
           and _fmt6(closing_difference) == "0.000000",
           "reporting: the MRR bridge closes — declared closing "
           "MRR equals opening plus new plus expansion minus "
           "contraction minus churned MRR")
    _bool_check(results, "churn_retention_and_reporting",
                "cash_collection_and_recognized_revenue_kept_distinct",
                manifest,
                ("reporting",
                 "cash_collection_and_recognized_revenue_kept_distinct"),
                "reporting: cash collection and recognized "
                "revenue are kept distinct")
    _bool_check(results, "churn_retention_and_reporting",
                "forecast_inputs_handed_over_with_ranges_declared",
                manifest,
                ("reporting",
                 "forecast_inputs_handed_over_with_ranges_declared"),
                "forecast inputs: committed plus pipeline plus "
                "base rates are handed to forecasting with "
                "ranges — this atom hands inputs over, it "
                "forecasts nothing itself")

    # ---- Section 6: red_lines (skill "Red lines" — no vanity
    #      metrics, no unrecorded discounts, no improvised
    #      recognition decisions) ----
    _false_check(results, "red_lines",
                 "no_bookings_presented_as_revenue", manifest,
                 ("red_lines", "bookings_presented_as_revenue_present"),
                 "red line: no vanity metrics — bookings presented "
                 "as revenue are not present in the record")
    _false_check(results, "red_lines",
                 "no_unrecorded_discounts", manifest,
                 ("red_lines", "unrecorded_discounts_present"),
                 "red line: no unrecorded discounts are present "
                 "in the record")
    _false_check(results, "red_lines",
                 "no_improvised_recognition_decisions", manifest,
                 ("red_lines",
                  "improvised_recognition_decisions_present"),
                 "red line: no improvised recognition decisions "
                 "are present in the record")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "PRICING_UNIT_ECONOMICS_PACK_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PRICING_UNIT_ECONOMICS_PACK_READY"

    computed_names = (
        "revenue_model_kind_is_stated_kind",
        "price_tiers_declared",
        "every_price_tier_entry_complete",
        "no_price_tier_name_duplicated",
        "tier_revenue_matches_price_times_units",
        "tier_contribution_matches_unit_contribution_times_units",
        "discounts_declared",
        "every_discount_names_reason",
        "no_discount_label_duplicated",
        "contribution_margin_ratio_matches_price_and_variable_cost",
        "break_even_units_matches_fixed_costs_over_unit_contribution",
        "total_contribution_matches_units_sold_times_unit_contribution",
        "mrr_bridge_closes_on_declared_figures",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "pricing-unit-economics-pack",
        "atom_version": "0.1.0",
        "product": manifest.get("product"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "tiers_count": tiers_count,
        "duplicate_tier_names": duplicate_tier_names,
        "tiers_mismatching_revenue": tiers_mismatching_revenue,
        "tiers_mismatching_contribution": tiers_mismatching_contribution,
        "total_declared_tier_revenue": _fmt6(total_tier_revenue),
        "total_declared_tier_contribution": _fmt6(
            total_tier_contribution),
        "tier_contribution_margin": _fmt6(tier_contribution_margin),
        "discounts_count": discounts_count,
        "discounts_without_reason": discounts_without_reason,
        "duplicate_discount_labels": duplicate_discount_labels,
        "discount_reason_coverage": _fmt6(discount_reason_coverage),
        "computed_contribution_margin_ratio": _fmt6(computed_ratio),
        "contribution_margin_difference": _fmt6(ratio_difference),
        "computed_break_even_units": _fmt6(computed_be),
        "break_even_difference": _fmt6(be_difference),
        "computed_total_contribution": _fmt6(computed_total_contrib),
        "total_contribution_difference": _fmt6(
            total_contrib_difference),
        "computed_closing_mrr": _fmt6(computed_closing),
        "closing_mrr_difference": _fmt6(closing_difference),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "PRICING UNIT ECONOMICS PACK",
        f"product: {verdict.get('product')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: pricing_unit_economics_pack.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "PRICING_UNIT_ECONOMICS_PACK_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
