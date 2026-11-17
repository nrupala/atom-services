# Vendor evaluation three way match pack — `vendor-evaluation-three-way-match-pack`

**Deliverable type:** EVALUATION. This atom sells the evaluation it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Procure well — specs, sourcing, vendor evaluation, PO discipline, 3-way match, performance reviews.

A caller submits the inputs the bound skill works on and receives one evaluation back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result. In this atom's deterministic form, the caller submits a **declared vendor evaluation and three-way match record** and receives the record audit verdict as the evaluation: the atom fetches nothing, contacts no vendor, approves no payment and gives no procurement advice (see Honest scoping).

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this evaluation on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **EE and software vendor purchases**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the vendor evaluation three-way match manifest

The caller submits one JSON manifest: a declared vendor
evaluation and three-way match record for one purchase, made
from the procurement record as actually kept. Every field
below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a
field present but false / invalid = the check fails
(`VENDOR_EVALUATION_AND_MATCH_NOT_SOUND`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `pack_title` (string; carried into the verdict output, not itself checked) | — |
| `spec.spec_written_before_quotes` (boolean) | spec_and_sourcing |
| `spec.spec_includes_functional_requirements` (boolean) | spec_and_sourcing |
| `spec.spec_includes_compliance_requirements` (boolean) | spec_and_sourcing |
| `spec.spec_includes_interface_requirements` (boolean) | spec_and_sourcing |
| `sourcing.quotes_comparable_same_scope_declared` (boolean) | spec_and_sourcing |
| `sourcing.single_source_used` (boolean; gates the justification check below) | spec_and_sourcing |
| `sourcing.single_source_justification_recorded` (boolean; required when a single-source purchase is declared used; otherwise the check passes as not applicable) | spec_and_sourcing |
| `evaluation_setup.criteria_set_before_scoring` (boolean) | vendor_evaluation_and_total_cost |
| `evaluation_setup.tco_evaluation_documented` (boolean) | vendor_evaluation_and_total_cost |
| `evaluation_setup.tco_includes_acquisition_cost` (boolean) | vendor_evaluation_and_total_cost |
| `evaluation_setup.tco_includes_operations_cost` (boolean) | vendor_evaluation_and_total_cost |
| `evaluation_setup.tco_includes_spares_cost` (boolean) | vendor_evaluation_and_total_cost |
| `evaluation_setup.tco_includes_support_cost` (boolean) | vendor_evaluation_and_total_cost |
| `evaluation_setup.tco_includes_switching_cost` (boolean) | vendor_evaluation_and_total_cost |
| `evaluation_setup.evidence_basis_recorded` (boolean) | vendor_evaluation_and_total_cost |
| `evaluation_setup.evaluation_applied_consistently_across_vendors` (boolean) | vendor_evaluation_and_total_cost |
| `vendors` (list of vendor-row objects, each with the entry fields below; computed, see below) | vendor_evaluation_and_total_cost |
| `vendors[].vendor_id` (string; must be unique per row) | vendor_evaluation_and_total_cost |
| `vendors[].vendor_name` (non-empty string) | vendor_evaluation_and_total_cost |
| `vendors[].evidence_note` (non-empty string) | vendor_evaluation_and_total_cost |
| `vendors[].scores` (list of score-row objects, each with the entry fields below; computed, see below) | vendor_evaluation_and_total_cost |
| `vendors[].scores[].criterion_id` (string; computed — must name a declared criterion, see below) | vendor_evaluation_and_total_cost |
| `vendors[].scores[].score` (number) | vendor_evaluation_and_total_cost |
| `vendors[].weighted_total_declared` (number; computed — must recompute from the declared weights and scores, see below) | vendor_evaluation_and_total_cost |
| `criteria` (list of criterion-row objects, each with the entry fields below; computed, see below) | vendor_evaluation_and_total_cost |
| `criteria[].criterion_id` (string; must be unique per row) | vendor_evaluation_and_total_cost |
| `criteria[].criterion_name` (non-empty string) | vendor_evaluation_and_total_cost |
| `criteria[].weight` (number; must be non-negative) | vendor_evaluation_and_total_cost |
| `contract.exclusions_reviewed` (boolean) | contract_and_terms |
| `contract.payment_terms_reviewed` (boolean) | contract_and_terms |
| `contract.penalties_reviewed` (boolean) | contract_and_terms |
| `contract.warranty_reviewed` (boolean) | contract_and_terms |
| `contract.price_escalation_clauses_reviewed` (boolean) | contract_and_terms |
| `contract.binding_terms_reviewed` (boolean) | contract_and_terms |
| `po_discipline.po_issued_before_delivery` (boolean) | purchase_order_discipline |
| `po_discipline.changes_via_change_order_declared` (boolean) | purchase_order_discipline |
| `po_discipline.verbal_commitments_papered_same_day_declared` (boolean) | purchase_order_discipline |
| `po_discipline.po_references_spec_declared` (boolean) | purchase_order_discipline |
| `three_way_match.match_performed_before_payment_declared` (boolean) | three_way_match |
| `three_way_match.discrepancies_resolved_before_payment_declared` (boolean) | three_way_match |
| `three_way_match.inspection_against_spec_on_arrival_declared` (boolean) | three_way_match |
| `three_way_match.receipt_verification_before_payment_declared` (boolean) | three_way_match |
| `three_way_match.purchase_order_total_declared` (number; computed — must recompute from the declared purchase-order line totals and agree with the declared invoice total, see below) | three_way_match |
| `three_way_match.invoice_total_declared` (number; computed — must recompute from the declared invoice line totals, see below) | three_way_match |
| `purchase_order_lines` (list of purchase-order line-row objects, each with the entry fields below; computed, see below) | three_way_match |
| `purchase_order_lines[].line_id` (string; must be unique per row within the set) | three_way_match |
| `purchase_order_lines[].quantity` (number) | three_way_match |
| `purchase_order_lines[].unit_price` (number) | three_way_match |
| `purchase_order_lines[].line_total_declared` (number; computed — must recompute as declared quantity × declared unit price, see below) | three_way_match |
| `receipt_lines` (list of goods-receipt line-row objects, each with the entry fields below; computed, see below) | three_way_match |
| `receipt_lines[].line_id` (string; must be unique per row within the set) | three_way_match |
| `receipt_lines[].quantity` (number) | three_way_match |
| `invoice_lines` (list of invoice line-row objects, each with the entry fields below; computed, see below) | three_way_match |
| `invoice_lines[].line_id` (string; must be unique per row within the set) | three_way_match |
| `invoice_lines[].quantity` (number) | three_way_match |
| `invoice_lines[].unit_price` (number) | three_way_match |
| `invoice_lines[].line_total_declared` (number; computed — must recompute as declared quantity × declared unit price, see below) | three_way_match |
| `vendor_records.vendor_terms_recorded` (boolean) | vendor_records_and_performance |
| `vendor_records.vendor_contacts_recorded` (boolean) | vendor_records_and_performance |
| `vendor_records.performance_log_maintained` (boolean) | vendor_records_and_performance |
| `vendor_records.performance_log_covers_on_time_quality_responsiveness` (boolean) | vendor_records_and_performance |
| `vendor_records.annual_review_cadence_set` (boolean) | vendor_records_and_performance |
| `vendor_records.two_viable_sources_for_critical_items_declared` (boolean) | vendor_records_and_performance |
| `vendor_records.banking_detail_changes_verified_via_known_contacts` (boolean) | vendor_records_and_performance |
| `vendor_records.segregation_of_duties_declared` (boolean) | vendor_records_and_performance |
| `vendor_records.gifts_conflict_policy_respected_declared` (boolean) | vendor_records_and_performance |
| `red_lines.po_less_purchase_above_threshold_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.payment_without_delivery_confirmation_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.payment_before_three_way_match_present` (boolean; must be `false` to pass — skill quality gate) | red_lines |
| `red_lines.silent_bank_detail_change_present` (boolean; must be `false` to pass — skill red line) | red_lines |

Twenty-four checks are computed from the declared rows,
using only the skill's own stated rules plus the consistency
of the declared record itself — no outside threshold is
imported:

- **Vendors declared:** the declared `vendors` list passes
  when it is present and names at least two vendors. An
  absent list is missing evidence; a list of fewer than two
  fails — an evaluation that selects between vendors is
  comparative by its own framing, and one row compares
  nothing.
- **Vendor ids unique:** no declared `vendor_id` may appear
  on more than one row. A row with `vendor_id` absent is
  missing evidence for this check.
- **Vendor name per vendor:** every declared vendor row
  declares a non-empty `vendor_name`. A row with the field
  absent is missing evidence; a row declaring an empty name
  fails and is named in
  `vendor_evaluation_vendors_without_name`.
- **Evidence note per vendor:** every declared vendor row
  declares a non-empty `evidence_note`. A row with the field
  absent is missing evidence; a row declaring an empty note
  fails and is named in
  `vendor_evaluation_vendors_without_evidence_note`.
- **Criteria declared:** the declared `criteria` list passes
  when it is present and names at least one criterion. An
  absent list is missing evidence; an empty list fails — it
  declares no evaluation at all.
- **Criterion ids unique:** no declared `criterion_id` may
  appear on more than one criterion row.
- **Criterion name per criterion:** every declared criterion
  row declares a non-empty `criterion_name`, named in
  `vendor_evaluation_criteria_without_name` when empty.
- **Criterion weights non-negative:** every declared
  criterion declares a non-negative `weight`. A row with the
  field absent is missing evidence; a negative weight fails
  and is named in
  `vendor_evaluation_criteria_with_invalid_weight`.
- **Criterion weights sum positive:** the declared weights
  sum to a positive total (reported as
  `vendor_evaluation_criteria_weights_sum`). An evaluation
  whose weights sum to zero scores nothing — internal
  consistency of the declared rows, not an imported target;
  the skill states no weight-sum target such as 1 or 100, so
  none is checked.
- **Every vendor scores every declared criterion:** every
  declared vendor's `scores` list names every declared
  criterion and no other criterion, exactly once. A vendor
  with `scores` absent, or a criterion row without a
  `criterion_id`, is missing evidence; a vendor scoring
  incompletely, extra, or twice fails and is named in
  `vendor_evaluation_vendors_with_incomplete_or_extra_scores`.
- **Every vendor's weighted total recomputes:** every
  declared vendor's `weighted_total_declared` recomputes as
  sum(declared weight × declared score) over its declared
  scores, compared on the fixed 6dp serialization below. A
  vendor with the total or its scores absent is missing
  evidence; a mismatch fails and is named in
  `vendor_evaluation_vendors_with_weighted_total_mismatch`.
- **Purchase-order lines declared:** the declared
  `purchase_order_lines` list passes when it is present and
  names at least one line. An absent list is missing
  evidence; an empty list fails — it declares no purchase at
  all.
- **Line ids unique per document set:** no declared
  `line_id` may appear on more than one row within the
  purchase-order set, the receipt set, or the invoice set
  (three checks, one per set).
- **Purchase-order line totals recompute:** every declared
  purchase-order line's `line_total_declared` recomputes as
  declared quantity × declared unit price, compared on the
  fixed 6dp serialization below. A line with any of the three
  fields absent is missing evidence; a mismatch fails and is
  named in `purchase_order_lines_with_line_total_mismatch`.
- **Invoice line totals recompute:** the same recomputation
  over the declared invoice lines, named in
  `invoice_lines_with_line_total_mismatch` when a line fails.
- **Receipt lines cover the purchase order exactly:** the
  declared receipt line ids are exactly the declared
  purchase-order line ids — none missing
  (`purchase_order_line_ids_missing_from_receipt`), none
  extra (`receipt_line_ids_not_on_purchase_order`), none
  duplicated (`duplicate_receipt_line_ids`). Either list
  absent, or a row without a `line_id`, is missing evidence.
- **Invoice lines cover the purchase order exactly:** the
  same exact-coverage rule for the declared invoice line ids
  against the declared purchase-order line ids
  (`purchase_order_line_ids_missing_from_invoice`,
  `invoice_line_ids_not_on_purchase_order`,
  `duplicate_invoice_line_ids`).
- **Quantities match across the three documents:** for every
  declared line, the declared quantity agrees across the
  purchase order, the receipt and the invoice. A line named
  on both sides whose quantities differ fails and is named
  in `three_way_lines_with_quantity_mismatch`; coverage
  failures (a line missing from a document) fail this check
  through the coverage lists above.
- **Unit prices match from purchase order to invoice:** for
  every declared line, the declared invoice unit price
  agrees with the declared purchase-order unit price, named
  in `three_way_lines_with_unit_price_mismatch` when a line
  differs.
- **Purchase-order grand total recomputes:** the declared
  `three_way_match.purchase_order_total_declared` recomputes
  as the sum of the declared purchase-order line totals. An
  absent grand total or line list is missing evidence; a
  mismatch fails.
- **Invoice grand total recomputes:** the same recomputation
  for `three_way_match.invoice_total_declared` over the
  declared invoice line totals.
- **Grand totals match:** the declared purchase-order grand
  total and the declared invoice grand total agree with each
  other, compared on the fixed 6dp serialization below. The
  atom checks **only** that the declared totals agree — it
  never states that the invoice should be paid (see Honest
  scoping).

One further check is gated on the record's own declared gate
field, following the skill's own conditional scope — when the
gate is declared `false`, the check passes as not
applicable; when the gate field is absent, the check is
missing evidence; when the gate is `true`, the target
declaration is required:

- **Single-source justification:** a single-source decision
  is justified in writing only where
  `sourcing.single_source_used` is declared `true` (the
  skill: single-source decisions justified in writing).

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the twenty-four primary computed checks above cannot be
completed), `vendor_evaluation_vendors_count`,
`vendor_evaluation_criteria_count`,
`purchase_order_lines_count`, `receipt_lines_count` and
`invoice_lines_count` (the declared list lengths, or null
when a list is not declared — counts are reported as
integers, exactly), the duplicate-id lists
`duplicate_vendor_evaluation_vendor_ids`,
`duplicate_vendor_evaluation_criterion_ids`,
`duplicate_purchase_order_line_ids`,
`duplicate_receipt_line_ids` and
`duplicate_invoice_line_ids`, the row-name and mismatch lists
named in the computed checks above,
`vendor_evaluation_criteria_weights_sum` (the sum of the
declared criterion weights), `purchase_order_lines_total`
and `invoice_lines_total` (the sums of each set's declared
line totals), and the ratios `vendor_score_coverage_ratio`
(vendors scoring every declared criterion exactly ÷ declared
vendors), `vendor_weighted_total_match_ratio` (vendors whose
declared weighted total recomputes ÷ declared vendors),
`vendor_evidence_note_ratio` (vendors with a recorded
evidence note ÷ declared vendors),
`three_way_quantity_match_ratio` (purchase-order lines whose
declared quantity agrees across all three documents ÷
declared purchase-order lines) and
`three_way_amount_match_ratio` (purchase-order lines whose
declared invoice line total agrees with the declared
purchase-order line total ÷ declared purchase-order lines).
**Fixed serialization rule:** computed quantities and ratios
are reported as strings with exactly six decimal places,
produced in both implementations by the same rule — round
half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then
format with exactly six decimals. Declared amounts are
compared only through that fixed serialization, so money
arithmetic is exact at the declared precision. A ratio is
null when its denominator list is absent or empty (the
score-coverage and weighted-total ratios are also null when
the criteria list is not declared; the quantity-match ratio
is also null when any of the three document lists is not
declared). That fixed serialization is what makes the Python
and TypeScript outputs byte-identical.

The skill states no numeric procurement threshold the atom
may set — its demands are spec, comparability, total-cost
weighing, PO discipline and matched payment, not bars the
atom can set. Quantities are computed and reported; the only
bars on the computed rows are exact recomputation and
completeness over the caller's own declared rows, exactly as
stated above. Declined thresholds, named: a spend threshold
amount for the PO-less red line or for material spend (the
record declares whether the red line is present; the atom
sets no currency amount); a minimum quote count as a counted
bar, including importing the skill's three-quote discipline
as a number the atom counts to (comparability and
single-source justification are checked as declarations, not
as a counted quote bar); a price ceiling, a total-cost
ceiling, or any judgment that a declared price is too high;
a score scale of the atom's own (scores are caller-declared
numbers, checked only for coverage and arithmetic — no scale
is imposed and no score is judged good or bad); a minimum
winning margin between vendors, or any check that the
winning vendor scored highest (the record declares no winner
to this atom at all — checking one would be the atom
choosing, and it is declined by name); a tolerance band on
the three-way match (quantities, prices and totals must
agree exactly at the declared 6dp precision — a tolerance
would be the atom deciding which discrepancies may be paid,
which is payment judgment, not audit); a vendor-count
maximum, or a criterion-count bar beyond at least one
criterion and at least two vendors; any judgment that the
chosen vendor is right, good or advisable (only that its
declared evaluation record contains what the skill
requires).

The verdict is one of `VENDOR_EVALUATION_AND_MATCH_SOUND`
(all 66 checks pass),
`VENDOR_EVALUATION_AND_MATCH_NOT_SOUND` (any check fails),
or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across seven sections: spec_and_sourcing (6
checks), vendor_evaluation_and_total_cost (20),
contract_and_terms (6), purchase_order_discipline (4),
three_way_match (17), vendor_records_and_performance (9),
red_lines (4).

## Distinct ground

The nearest siblings are `structured-decision-making` (a
general decision process — frame, options, criteria,
evaluate, commit and review for any decision),
`cost-estimate-preparation` (estimating a cost honestly —
classes, methods, ranges, escalation, and learning from
estimate vs actual), `budget-design-review` (running budgets
that hold — cycles, owners, zero-based vs incremental,
variance reviews, rolling forecasts) and
`append-only-ledger-design-audit` (designing append-only
ledgers and audit trails — double-entry where money moves,
immutability, reconciliation). This atom shares **zero
checks** with any of them (verified mechanically by grepping
every check name in this atom's oracle across
`services/*/src/*.py` — zero collisions): every check here
is a procurement-record question — spec written before
quotes with functional / compliance / interface
requirements, comparable same-scope sourcing with a
single-source justification gate, vendor rows scored against
procurement criteria set before scoring with acquisition /
operations / spares / support / switching total-cost
components weighed and declared weighted totals recomputed,
contract care for a vendor agreement (exclusions, payment
terms, penalties, warranty, escalation, binding terms),
PO-before-delivery discipline with change orders and
same-day papering of verbal commitments, the three-way match
recomputed line by line across the declared purchase-order,
goods-receipt and invoice rows (coverage, quantities, unit
prices, line totals and grand totals), vendor performance
records with fraud hygiene, and the procurement red lines
refused. The boundary is: one vendor evaluation and
payment-match record here; a general decision process, a
cost estimate, a budget, and a ledger design there.

## Honest scoping

This atom reviews a **declared** vendor evaluation and
three-way match record — it fetches no quote, verifies no
delivery, contacts no vendor, and approves no payment. A
record is sound *on the caller's declared evidence*: a
record that declares its spec written, its vendors scored
and its three documents matched passes those checks even if
the real purchase did none of it. It is a completeness and
consistency audit of the procurement record the skill
requires, **not a vendor recommendation, a payment approval,
or a guarantee that the purchase was sound**: it never
judges whether a declared score is fair, whether the
evidence note actually supports the vendor, whether the
goods were really received, or whether the invoice should
be paid — only that the record contains what the skill's
method and red lines demand, and that its declared rows are
internally consistent.

Named exclusions and non-reducible parts (excluded by name,
never performed): sourcing or finding vendors; selecting,
recommending or ranking a vendor for the caller; negotiating
terms with a vendor; contacting a vendor in any way; placing
or issuing a purchase order; receiving or inspecting goods;
paying an invoice; approving a payment — a matched record is
an audit verdict on declared rows, never a pay / do-not-pay
instruction; verifying banking details or any vendor fact
against the world; and giving procurement, purchasing or
spending advice of any kind — each is EXCLUDED by name from
this atom, which audits only the declared record. Boundary
case, named: a purchase with genuinely only one vendor ever
considered cannot pass this record format's vendors-declared
check (the format requires at least two compared vendors —
such a purchase is outside this atom's computed reach, not
failed on its merits; its single-source justification is
still checked as a declaration when declared).

## U-13 regulatory screen

Screen classification: **(b) — screen-NO, flag-with-controls
(census class).** Keyword screen: the bound skill and this
record name invoices, payments, purchase orders and banking
details — finance-adjacent subjects — so the screen was
applied strictly. Substance screen: this atom's output could
not itself read as regulated professional advice **while the
controls below hold** — it audits a caller-**declared**
business procurement record for completeness and internal
consistency only (spec / sourcing / contract / PO-discipline
declarations, vendor and criteria rows with declared weighted
totals recomputed over the declared rows, the three-way match
recomputed line by line over the declared purchase-order,
receipt and invoice rows, vendor-record and fraud-hygiene
declarations, and the procurement red lines refused); every
output is a pass / fail / missing verdict on the record or a
quantity recomputed from the caller's own declared rows.
Named controls: (1) it produces **no recommendation and no
payment decision** — the skill's sourcing, selecting,
negotiating, contacting, ordering, receiving and paying steps
are excluded by name in Honest scoping above; the atom never
names a vendor the caller should use and never states that
an invoice should or should not be paid; a matched record is
not a payment approval and the grand-totals check states
that boundary in its own evidence text; (2) it sets **no
threshold** on any amount (see the declined list) — no spend
bar, no price ceiling, no match tolerance — so no output
grades a purchase as financially good or bad; (3) it handles
**no personal financial position of any kind** — no person's
net worth, income, cash flow, holdings or personal accounts
appear in this record; the amounts are a business's declared
purchase-order and invoice rows for a procurement audit.
That is exactly what distinguishes this atom from the
genuinely-open personal-financial-snapshot class: that atom's
shape is a snapshot of a *person's* finances, whose verdict
could read as personal financial advice about that person's
position; this atom's shape is a *business's* procurement
record, and its verdict reads only as an audit of whether
that record is complete and arithmetically consistent. The
adjacency is nonetheless real (invoice amounts and banking-
detail hygiene are finance-adjacent, and a naive version of
this atom that approved payments could read as a financial
control decision), so this is the census flag-with-controls
class, not class (a). No deploy happens on this atom without
the owner's explicit per-unit ruling in any case.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **AUTHORED + STAGED — not deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
