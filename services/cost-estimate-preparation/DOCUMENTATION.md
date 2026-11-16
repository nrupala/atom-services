# Cost estimate preparation — `cost-estimate-preparation`

**Display name:** Cost estimate preparation · **Slug:** `cost-estimate-preparation` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "cost-estimate-preparation"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the manifest.** Fill every group in the [Input reference](#input-reference) — one JSON object declaring the artifact this atom audits. Declare values truthfully: the atom judges declared evidence only (see Explanation). The recorded run's manifest (example 1 below) declares `entity` = "Project Alpha" and supplies every section's fields.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/cost-estimate-preparation` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `COST_ESTIMATE_READY` — 35 pass, 0 fail, 0 missing of 35 checks across six sections. Recorded computed values: `computed_subtotal` = `"5000.000000"`; `subtotal_difference` = `"0.000000"`; `computed_total_spread` = `"20.000000"`; `total_spread_difference` = `"0.000000"`; `computed_contingency_amount` = `"500.000000"`; `contingency_difference` = `"0.000000"`; `computed_escalation_amount` = `"250.000000"`; `escalation_difference` = `"0.000000"`; `computed_grand_total` = `"5750.000000"`; `grand_total_difference` = `"0.000000"`; `computed_quote_variance_percent` = `"10.000000"`; `quote_variance_difference` = `"0.000000"`; `line_items_evaluated` = `1`; `uncertainty_items_evaluated` = `1`; `computed_status` = `"within_stated_limits_on_declared_evidence"`.
   Why it passes, in the tester's recorded words: All arithmetic matches: line 100 x 50 = 5000 = subtotal 5000; spread 30-10 = 20 declared 20; contingency 5000 x 10% = 500; escalation 5000 x 5% = 250; grand total 5000+500+250 = 5750; quote variance (110-100)/100 x 100 = 10. All 35 checks pass.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "cost-estimate-preparation"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/cost-estimate-preparation` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/cost-estimate-preparation` with the same `Authorization: Bearer <key>` header and call the tool `cost_estimate_preparation` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `COST_ESTIMATE_NOT_READY` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing (the recorded sparse run — a manifest carrying only `entity` — returned exactly that: 0 pass, 0 fail, 35 missing of 35 checks across six sections). A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples, example 2), the verdict was `COST_ESTIMATE_NOT_READY` — 30 pass, 5 fail, 0 missing of 35 checks across six sections. The failing checks were exactly: `estimate_class_in_stated_classes`, `line_item_amounts_match_quantity_times_rate`, `no_hidden_padding_in_rates`, `three_point_spreads_match_pessimistic_minus_optimistic`, `contingency_amount_matches_subtotal_times_percent`. Recorded case notes: Full manifest with exactly 5 planted violations: estimate_class 'invalid_class' not in stated tokens; hidden_padding_in_rates=true (red line); line declared_amount 6000 vs 100 x 50 = 5000; declared_spread 50 vs 30-10 = 20; declared_contingency_amount 500 vs 6000 x 10% = 600. Subtotal 6000 equals sum of declared amounts, escalation 300 = 6000 x 5%, grand total 6800 = 6000+500+300 on declared amounts, and quote variance 10 all hold, so no other check fails.
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `totals.declared_subtotal` with detail "totals.declared_subtotal must be a number" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/cost-estimate-preparation` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/cost-estimate-preparation` — tool name `cost_estimate_preparation`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks, grouped as SERVICE.md groups them (by the section that reads the field). Types are from SERVICE.md's field table — all fields are booleans unless noted in the table — corroborated by contract.yaml and the recorded evidence input schema (`inputSchema` in the MCP tool definition). An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `entity` | string | — | string; carried into the verdict output, not itself checked |
| `basis.document_present` | boolean | basis_and_class |  |
| `basis.estimate_class` | string | basis_and_class | string; computed vocabulary check, see below |
| `basis.method` | string | basis_and_class | string; computed vocabulary check, see below |
| `basis.assumptions_documented` | boolean | basis_and_class |  |
| `basis.exclusions_documented` | boolean | basis_and_class |  |
| `basis.estimator_identified` | boolean | basis_and_class |  |
| `elements.breakdown_not_lump_sum` | boolean | elements_and_line_items |  |
| `elements.labor_burden_included` | boolean | elements_and_line_items |  |
| `elements.hidden_padding_in_rates` | boolean | elements_and_line_items | must be `false` to pass — skill red line |
| `line_items` | list of line-item entries | elements_and_line_items | list of line-item entries; absent / not a list / empty = all three computed line-item checks missing |
| `line_items[].label` | string | elements_and_line_items | string; must be non-empty for the entry to be complete |
| `line_items[].category` | string | elements_and_line_items | string; must be non-empty for the entry to be complete; validated as a string only, never enum-checked — the skill names the element categories as guidance, and no category coverage is imposed |
| `line_items[].quantity` | number | elements_and_line_items | number; computed, see below |
| `line_items[].unit_rate` | number | elements_and_line_items | number; computed, see below |
| `line_items[].declared_amount` | number | elements_and_line_items | number; declared, re-derived, see below |
| `uncertainty.ranges_stated_for_material_uncertainty` | boolean | uncertainty_and_ranges |  |
| `uncertainty.items` | list of three-point items | uncertainty_and_ranges | list of three-point items; absent / not a list / empty = all three computed uncertainty checks missing |
| `uncertainty.items[].label` | string | uncertainty_and_ranges | string; must be non-empty for the entry to be complete |
| `uncertainty.items[].optimistic` | number | uncertainty_and_ranges | number; computed, see below |
| `uncertainty.items[].likely` | number | uncertainty_and_ranges | number; computed, see below |
| `uncertainty.items[].pessimistic` | number | uncertainty_and_ranges | number; computed, see below |
| `uncertainty.items[].declared_expected_value` | number | uncertainty_and_ranges | number; presence only — the skill states no expected-value formula, see Thresholds declined |
| `uncertainty.items[].declared_spread` | number | uncertainty_and_ranges | number; declared, re-derived, see below |
| `uncertainty.expected_values_stated` | boolean | uncertainty_and_ranges |  |
| `uncertainty.single_number_precision_on_uncertain_scope` | boolean | uncertainty_and_ranges | must be `false` to pass — skill red line |
| `totals.declared_subtotal` | number | elements_and_line_items, totals_escalation_and_currency | number; computed, see below |
| `totals.contingency_percent` | number | totals_escalation_and_currency | number; a declaration — never a pass mark, see below |
| `totals.declared_contingency_amount` | number | totals_escalation_and_currency | number; declared, re-derived, see below |
| `totals.escalation_percent` | number | totals_escalation_and_currency | number; a declaration — never a pass mark, see below |
| `totals.declared_escalation_amount` | number | totals_escalation_and_currency | number; declared, re-derived, see below |
| `totals.declared_grand_total` | number | totals_escalation_and_currency | number; declared, re-derived, see below |
| `totals.escalation_impacts_stated` | boolean | totals_escalation_and_currency |  |
| `totals.currency_impacts_stated` | boolean | totals_escalation_and_currency |  |
| `totals.quote_validity_dates_captured` | boolean | totals_escalation_and_currency |  |
| `should_cost.benchmark_built_for_big_items` | boolean | should_cost_and_quotes |  |
| `should_cost.vendor_quote_amount` | number | should_cost_and_quotes | number; computed, see below |
| `should_cost.should_cost_amount` | number | should_cost_and_quotes | number; computed, see below |
| `should_cost.declared_variance_percent` | number | should_cost_and_quotes | number; declared, re-derived, see below |
| `should_cost.quote_compared_to_benchmark` | boolean | should_cost_and_quotes |  |
| `should_cost.divergences_explained` | boolean | should_cost_and_quotes |  |
| `should_cost.quote_exclusions_reviewed` | boolean | should_cost_and_quotes |  |
| `should_cost.quote_assumptions_reviewed` | boolean | should_cost_and_quotes |  |
| `should_cost.validity_period_respected` | boolean | should_cost_and_quotes |  |
| `should_cost.quote_accepted_without_scope_review` | boolean | should_cost_and_quotes | must be `false` to pass — skill red line |
| `feedback.estimate_vs_actual_tracked_per_item` | boolean | feedback_loop |  |
| `feedback.rates_updated_from_actuals` | boolean | feedback_loop |  |
| `feedback.variance_lessons_published` | boolean | feedback_loop |  |

### Checks

All 35 checks, exactly as named in the recorded full-pass REST response, grouped by section. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence; `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. Across all recorded cases for this atom the only per-check status values observed are `pass`, `fail` and `missing`; there is no separate not-applicable status value in the output — where a check is gated by another declared field (see the gated checks' evidence lines), the gate's declared value decides whether the requirement is held, as the evidence line states.

#### Section: `basis_and_class` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `basis_document_present` | quality gate: a basis document is present for the estimate |
| `estimate_class_in_stated_classes` | method step 1: the declared estimate class is one of the classes the skill names — concept/ROM, budget, definitive (declared as concept_rom, budget, or definitive) |
| `method_in_stated_methods` | method step 2: the declared method is one of the methods the skill names — bottom-up, parametric, analogous (declared as bottom_up, parametric, or analogous) |
| `assumptions_documented` | quality gate: the basis document states the estimate's assumptions |
| `exclusions_documented` | quality gate: the basis document states the estimate's exclusions |
| `estimator_identified` | quality gate: the basis document identifies the estimator |

#### Section: `elements_and_line_items` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `elements_broken_down_not_lump_sum` | method step 3: the estimate is broken into elements, not lump sums — material, labor, equipment, subcontract, freight, indirects |
| `labor_rates_include_burden` | method step 3: labor is costed as hours x rates including burden |
| `line_item_entries_complete` | every line item carries a label, a category, a quantity, a unit rate, and a declared amount |
| `line_item_amounts_match_quantity_times_rate` | method step 3: each declared line amount equals its declared quantity multiplied by its declared unit rate |
| `subtotal_matches_sum_of_line_items` | method step 3: the declared subtotal equals the sum of the declared line amounts |
| `no_hidden_padding_in_rates` | red line: no padding is hidden inside rates |

#### Section: `uncertainty_and_ranges` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `ranges_stated_for_material_uncertainty` | quality gate: ranges, not points, are stated for material uncertainty |
| `uncertainty_entries_complete` | every uncertainty item carries a label, three points, a declared expected value, and a declared spread |
| `three_point_ordering_valid` | method step 4: each item's three points are in optimistic <= likely <= pessimistic order |
| `three_point_spreads_match_pessimistic_minus_optimistic` | method step 4: each declared spread equals its declared pessimistic minus optimistic value (the declared expected value states no formula in the skill and is checked for presence only) |
| `expected_values_stated` | method step 4: an expected value is stated for each shaky item alongside its spread |
| `no_single_number_precision_on_uncertain_scope` | red line: no single-number precision is presented on uncertain scope |

#### Section: `totals_escalation_and_currency` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `contingency_amount_matches_subtotal_times_percent` | the declared contingency amount equals the declared subtotal multiplied by the declared contingency percent (the percent itself is fixed by no statement in the skill and is not judged here) |
| `escalation_amount_matches_subtotal_times_percent` | method step 5: the declared escalation amount equals the declared subtotal multiplied by the declared escalation percent (the percent itself is fixed by no statement in the skill and is not judged here) |
| `grand_total_matches_subtotal_plus_contingency_plus_escalation` | the declared grand total equals the declared subtotal plus the declared contingency amount plus the declared escalation amount |
| `escalation_impacts_stated` | method step 5: escalation impacts — inflation and lead-time — are stated |
| `currency_impacts_stated` | method step 5: currency (fx) impacts are stated |
| `quote_validity_dates_captured` | method step 5: quote validity dates are captured |

#### Section: `should_cost_and_quotes` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `should_cost_benchmark_built` | method step 6: an independent should-cost benchmark is built for big items |
| `quote_compared_to_benchmark` | method step 6: vendor quotes are compared against the should-cost benchmark |
| `quote_variance_percent_matches_rederived` | method step 6: the declared variance percent equals the declared vendor quote minus the declared should-cost benchmark, divided by the benchmark, times 100 (whether the variance is acceptable is not judged here) |
| `divergences_explained` | quality gate: divergences between quotes and the benchmark are explained — scope, rates, or margin |
| `quote_exclusions_reviewed` | quality gate: the quotes' exclusions are reviewed line by line |
| `quote_assumptions_reviewed` | method step 7: the quotes' assumptions are reviewed line by line |
| `validity_period_respected` | method step 7: the quote validity period is respected |
| `no_quote_accepted_without_scope_review` | red line: no vendor quote is accepted without scope review |

#### Section: `feedback_loop` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `estimate_vs_actual_tracked_per_item` | quality gate: estimate vs actual is tracked per item |
| `rates_updated_from_actuals` | quality gate: tracked actuals are fed back into rates |
| `variance_lessons_published` | method step 8: variance lessons are published |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug (`cost-estimate-preparation`).
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `entity` — The caller's `entity` value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 35 per-check results: `section`, `check`, `status`, `evidence`.
- `computed_status` — Computed/reported field; recorded full-pass value: `"within_stated_limits_on_declared_evidence"`.
- `line_items_evaluated` — Computed/reported field; recorded full-pass value: `1`.
- `computed_subtotal` — Computed/reported field; recorded full-pass value: `"5000.000000"`.
- `subtotal_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `uncertainty_items_evaluated` — Computed/reported field; recorded full-pass value: `1`.
- `computed_total_spread` — Computed/reported field; recorded full-pass value: `"20.000000"`.
- `total_spread_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `computed_contingency_amount` — Computed/reported field; recorded full-pass value: `"500.000000"`.
- `contingency_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `computed_escalation_amount` — Computed/reported field; recorded full-pass value: `"250.000000"`.
- `escalation_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `computed_grand_total` — Computed/reported field; recorded full-pass value: `"5750.000000"`.
- `grand_total_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `computed_quote_variance_percent` — Computed/reported field; recorded full-pass value: `"10.000000"`.
- `quote_variance_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, entity, verdict, per-section statuses, summary) for logs and tickets.

From USER-GUIDE.md's verdict notes: The response also reports `line_items_evaluated` (count of complete line-item entries), `computed_subtotal` and `subtotal_difference`, `uncertainty_items_evaluated` (count of complete three-point items), `computed_total_spread` and `total_spread_difference`, `computed_contingency_amount` and `contingency_difference`, `computed_escalation_amount` and `escalation_difference`, `computed_grand_total` and `grand_total_difference`, `computed_quote_variance_percent` and `quote_variance_difference` (computed amounts as strings with exactly six decimals, or null when they cannot be computed) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `COST_ESTIMATE_READY` — every check passes; the estimate artifact is complete and internally consistent on the declared evidence.
- `COST_ESTIMATE_NOT_READY` — at least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks.

**Computed fields:**

- `computed_status` — `within_stated_limits_on_declared_evidence` when every computed check that can be completed is within its stated limits; `outside_stated_limits_on_declared_evidence` when a computed check is breached; `null` when a computed check cannot be completed (recorded sparse-run value: `null`).
- `line_items_evaluated` — reported as in the recorded responses (full-pass value `1`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_subtotal` — reported as in the recorded responses (full-pass value `"5000.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `subtotal_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `uncertainty_items_evaluated` — reported as in the recorded responses (full-pass value `1`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_total_spread` — reported as in the recorded responses (full-pass value `"20.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `total_spread_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_contingency_amount` — reported as in the recorded responses (full-pass value `"500.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `contingency_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_escalation_amount` — reported as in the recorded responses (full-pass value `"250.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `escalation_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_grand_total` — reported as in the recorded responses (full-pass value `"5750.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `grand_total_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_quote_variance_percent` — reported as in the recorded responses (full-pass value `"10.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `quote_variance_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key (gateway DESIGN.md: unknown/revoked key = 401). No verdict is produced.
- **403** — the key lacks this atom's scope (gateway DESIGN.md: missing scope at an atom = 403). Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "totals.declared_subtotal", "detail": "totals.declared_subtotal must be a number"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits; gateway DESIGN.md: over limit → 429 naming the limit, and the call is not metered). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); pricing unit is the deliverable, and prices are set only from measured production cost per unit.

## Explanation

You have a cost estimate artifact — its basis document (class, method, assumptions, exclusions, estimator), its element line items, its three-point uncertainty items, its declared totals chain, its should-cost / vendor-quote record and its estimate-vs-actual feedback record. This atom reads one declared manifest and returns one deterministic verdict across six sections: **COST_ESTIMATE_READY**, **COST_ESTIMATE_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not produce an estimate, price your work, or judge whether the numbers are realistic. Computed checks: the declared estimate class must be one of the stated tokens (`concept_rom`, `budget`, `definitive`) and the method one of (`bottom_up`, `parametric`, `analogous`) — no class percentage band is imposed as a pass mark; each declared line amount must equal its quantity × unit rate and the declared subtotal must equal the sum of the declared line amounts; each three-point item must be in optimistic ≤ likely ≤ pessimistic order and its declared spread must equal pessimistic − optimistic (the declared expected value is presence-checked only — no expected-value formula is stated, so none is imposed); the declared contingency amount must equal subtotal × contingency percent and the declared escalation amount must equal subtotal × escalation percent (neither percent is fixed, so neither is judged); the declared grand total must equal subtotal + declared contingency + declared escalation; and the declared should-cost variance percent must equal (vendor quote − should-cost benchmark) / benchmark × 100 with a non-zero benchmark (whether the variance is acceptable is not judged). Same manifest in → same verdict out.

**Computed checks.** Nine checks are computed from the declared values, using only what the skill itself states plus the arithmetic of the declared numbers — no outside threshold is imported:

- **Estimate class:** the skill's method step 1 names the classes — concept/ROM, budget, definitive. The declared `basis.estimate_class` therefore passes only when it is one of the stated tokens (`concept_rom`, `budget`, `definitive`); any other string is present and fails, an absent field is missing. The string is validated as a string only at the type layer — membership is a verdict check, not a type error.
- **Method:** the skill's method step 2 names the methods — bottom-up (elements) when design exists, parametric (unit rates, cost curves) when history exists, analogous (adjust a comparable explicitly) for one-offs. The declared `basis.method` therefore passes only when it is one of the stated tokens (`bottom_up`, `parametric`, `analogous`). Which method fits the situation is the estimator's judgment and is not second-guessed here.
- **Line-item amounts:** the skill's method step 3 builds the estimate from elements — material, labor (hours × rates incl. burden), equipment, subcontract, freight, indirects. Each declared line amount therefore passes only when it equals its declared `quantity` × `unit_rate`, and the entries check only when every entry carries a non-empty `label` and `category` and numeric `quantity`, `unit_rate` and `declared_amount`. A missing or empty list is missing evidence; an incomplete entry makes the entries, amounts and subtotal checks missing (the entry cannot be re-derived). The output reports `line_items_evaluated` (the count of complete entries).
- **Subtotal:** the declared `totals.declared_subtotal` passes only when it equals the sum of the declared line amounts. The output reports `computed_subtotal` and `subtotal_difference` (declared minus computed, null when either cannot be computed).
- **Three-point spreads and ordering:** the skill's method step 4 states three points — optimistic / likely / pessimistic — yielding an expected value and a spread. Each declared `declared_spread` therefore passes only when it equals `pessimistic` − `optimistic`, and the ordering check only when every item is in optimistic ≤ likely ≤ pessimistic order. The output reports `uncertainty_items_evaluated`, `computed_total_spread` (the sum of the re-derived spreads) and `total_spread_difference` (the sum of declared spreads minus the computed total, null when an item is incomplete). The declared expected value is **not** re-derived: the skill states no formula for it (see Thresholds declined), so it is checked for presence as part of entry completeness only.
- **Contingency amount:** the declared `totals.declared_contingency_amount` passes only when it equals `totals.declared_subtotal` × `totals.contingency_percent` / 100. The output reports `computed_contingency_amount` and `contingency_difference` (declared minus computed, null when either cannot be computed).
- **Escalation amount:** the declared `totals.declared_escalation_amount` passes only when it equals `totals.declared_subtotal` × `totals.escalation_percent` / 100. The output reports `computed_escalation_amount` and `escalation_difference` (declared minus computed, null likewise).
- **Grand total:** the declared `totals.declared_grand_total` passes only when it equals `totals.declared_subtotal` + `totals.declared_contingency_amount` + `totals.declared_escalation_amount` (the declared amounts, so a wrong contingency amount fails its own check without cascading into this one). The output reports `computed_grand_total` and `grand_total_difference` (declared minus computed, null likewise).
- **Should-cost variance:** the skill's method step 6 builds an independent benchmark for big items and compares vendor quotes against it. The declared `should_cost.declared_variance_percent` therefore passes only when it equals (`should_cost.vendor_quote_amount` − `should_cost.should_cost_amount`) / `should_cost.should_cost_amount` × 100, with a non-zero benchmark (a zero benchmark fails — no finite variance exists). Whether the variance is acceptable, and how a gap reconciles (scope, rates, or margin), is the caller's recorded answer (`should_cost.divergences_explained`), not this atom's judgment. The output reports `computed_quote_variance_percent` and `quote_variance_difference` (declared minus computed, null when either cannot be computed).

**Fixed serialization rule:** computed amounts and ratios are reported as strings with exactly six decimal places, produced in both implementations by the same rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; computed comparisons compare the fixed-6dp difference to zero. That fixed serialization is what makes the Python and TypeScript outputs byte-identical.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is `COST_ESTIMATE_NOT_READY`) — and a wrong-*typed* value is neither: it is rejected up front as a 422. Any single `fail` decides the verdict in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns `COST_ESTIMATE_READY`. The verdict is one of `COST_ESTIMATE_READY` (all 35 checks pass), `COST_ESTIMATE_NOT_READY` (any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing), across six sections: basis_and_class, elements_and_line_items, uncertainty_and_ranges, totals_escalation_and_currency, should_cost_and_quotes, feedback_loop.

**What it does NOT do.**

*Thresholds declined (from SERVICE.md):*

The following are deliberately **not** imposed, because the skill does not fix them. Naming them here is the audit trail for their absence:

- **Class percentage bands as pass marks.** The skill gives each class a reality band (concept/ROM ±30–50%, budget ±15–20%, definitive ±5–10%) as a description of what the class means, not a fixed value an artifact's declared range must hit. No declared range percent is checked against a band; the class token alone is checked.
- **Expected-value formula.** Method step 4 says three points yield an "expected value + spread" but states no formula — neither a PERT weighting ((optimistic + 4 × likely + pessimistic) / 6) nor a simple mean is written in the skill, so neither is imposed. The declared expected value is presence-checked only; the spread, whose arithmetic the points themselves define, is re-derived.
- **Contingency percent.** The skill never fixes a contingency percentage. The declared percent is a declaration whose amount arithmetic alone is re-derived — any percent passes if its amount holds.
- **Escalation percent / rate.** The skill requires escalation to be handled and its impacts stated, but fixes no inflation, fx, or lead-time rate. The declared percent is treated exactly like the contingency percent.
- **Acceptable quote variance.** The skill requires gaps between quotes and the should-cost benchmark to be reconciled and explained; it states no variance percentage at which a quote becomes unacceptable. Only the variance arithmetic is re-derived.
- **Line-item category coverage.** The skill names the element categories (material, labor, equipment, subcontract, freight, indirects) as the breakdown to build from; it does not state that every estimate must carry every category (a services estimate may have no freight). Categories are validated as non-empty strings for traceability; no coverage check is imposed.
- **Analogous-estimate adjustment size.** Method step 2 says an analogous estimate adjusts a comparable "explicitly"; it states no adjustment factor or bound, so none is checked — the method token and the basis document carry that evidence.

*Honest scoping (from SERVICE.md):*

This atom audits a **declared** cost estimate artifact — it does not build the estimate, price the caller's actual work, verify that a declared value is true, or give estimating advice. An artifact is ready *on the caller's declared evidence* even if its underlying numbers are optimistic. It is a completeness and consistency audit, **not an estimate review**: it never decides whether the quantities or rates are realistic, whether the class fits the scope's maturity, whether the contingency or escalation percent is adequate (the skill fixes neither, so none is imposed), whether the expected values are well derived (no formula is stated, so none is imposed), or whether a vendor quote should be accepted (only that its scope was reviewed, its exclusions and assumptions read, its validity respected, and its divergence from the benchmark explained and arithmetically consistent).

Named exclusions: no production of an estimate from raw scope or drawings; no verification of any declared quantity, rate, amount, quote, or actual; no rate benchmarking against market data; no class-band, contingency-adequacy, escalation-adequacy or variance-acceptability judgment; no live verification of any declared fact.

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves. The house's own workflow that calls it: **EE work package estimates**. One unit of sale = one delivered result. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/cost_estimate_preparation.py` — `evaluate(manifest) -> verdict dict`; tests: `tests/test_cost_estimate_preparation.py` — 50 tests; see TEST-REPORT.md for the recorded external battery). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/cost-estimate-preparation` and MCP `POST /mcp/cost-estimate-preparation` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-16T02:00:57.377313+00:00 against gateway v1.1.0, external verification lane, source `verification/work/cost-estimate-preparation/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

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

Response (`response_text`):

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
  "checks": [
    {
      "section": "basis_and_class",
      "check": "basis_document_present",
      "status": "pass",
      "evidence": "quality gate: a basis document is present for the estimate"
    },
    {
      "section": "basis_and_class",
      "check": "estimate_class_in_stated_classes",
      "status": "pass",
      "evidence": "method step 1: the declared estimate class is one of the classes the skill names — concept/ROM, budget, definitive (declared as concept_rom, budget, or definitive)"
    },
    {
      "section": "basis_and_class",
      "check": "method_in_stated_methods",
      "status": "pass",
      "evidence": "method step 2: the declared method is one of the methods the skill names — bottom-up, parametric, analogous (declared as bottom_up, parametric, or analogous)"
    },
    {
      "section": "basis_and_class",
      "check": "assumptions_documented",
      "status": "pass",
      "evidence": "quality gate: the basis document states the estimate's assumptions"
    },
    {
      "section": "basis_and_class",
      "check": "exclusions_documented",
      "status": "pass",
      "evidence": "quality gate: the basis document states the estimate's exclusions"
    },
    {
      "section": "basis_and_class",
      "check": "estimator_identified",
      "status": "pass",
      "evidence": "quality gate: the basis document identifies the estimator"
    },
    {
      "section": "elements_and_line_items",
      "check": "elements_broken_down_not_lump_sum",
      "status": "pass",
      "evidence": "method step 3: the estimate is broken into elements, not lump sums — material, labor, equipment, subcontract, freight, indirects"
    },
    {
      "section": "elements_and_line_items",
      "check": "labor_rates_include_burden",
      "status": "pass",
      "evidence": "method step 3: labor is costed as hours x rates including burden"
    },
    {
      "section": "elements_and_line_items",
      "check": "line_item_entries_complete",
      "status": "pass",
      "evidence": "every line item carries a label, a category, a quantity, a unit rate, and a declared amount"
    },
    {
      "section": "elements_and_line_items",
      "check": "line_item_amounts_match_quantity_times_rate",
      "status": "pass",
      "evidence": "method step 3: each declared line amount equals its declared quantity multiplied by its declared unit rate"
    },
    {
      "section": "elements_and_line_items",
      "check": "subtotal_matches_sum_of_line_items",
      "status": "pass",
      "evidence": "method step 3: the declared subtotal equals the sum of the declared line amounts"
    },
    {
      "section": "elements_and_line_items",
      "check": "no_hidden_padding_in_rates",
      "status": "pass",
      "evidence": "red line: no padding is hidden inside rates"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "ranges_stated_for_material_uncertainty",
      "status": "pass",
      "evidence": "quality gate: ranges, not points, are stated for material uncertainty"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "uncertainty_entries_complete",
      "status": "pass",
      "evidence": "every uncertainty item carries a label, three points, a declared expected value, and a declared spread"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "three_point_ordering_valid",
      "status": "pass",
      "evidence": "method step 4: each item's three points are in optimistic <= likely <= pessimistic order"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "three_point_spreads_match_pessimistic_minus_optimistic",
      "status": "pass",
      "evidence": "method step 4: each declared spread equals its declared pessimistic minus optimistic value (the declared expected value states no formula in the skill and is checked for presence only)"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "expected_values_stated",
      "status": "pass",
      "evidence": "method step 4: an expected value is stated for each shaky item alongside its spread"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "no_single_number_precision_on_uncertain_scope",
      "status": "pass",
      "evidence": "red line: no single-number precision is presented on uncertain scope"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "contingency_amount_matches_subtotal_times_percent",
      "status": "pass",
      "evidence": "the declared contingency amount equals the declared subtotal multiplied by the declared contingency percent (the percent itself is fixed by no statement in the skill and is not judged here)"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "escalation_amount_matches_subtotal_times_percent",
      "status": "pass",
      "evidence": "method step 5: the declared escalation amount equals the declared subtotal multiplied by the declared escalation percent (the percent itself is fixed by no statement in the skill and is not judged here)"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "grand_total_matches_subtotal_plus_contingency_plus_escalation",
      "status": "pass",
      "evidence": "the declared grand total equals the declared subtotal plus the declared contingency amount plus the declared escalation amount"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "escalation_impacts_stated",
      "status": "pass",
      "evidence": "method step 5: escalation impacts — inflation and lead-time — are stated"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "currency_impacts_stated",
      "status": "pass",
      "evidence": "method step 5: currency (fx) impacts are stated"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "quote_validity_dates_captured",
      "status": "pass",
      "evidence": "method step 5: quote validity dates are captured"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "should_cost_benchmark_built",
      "status": "pass",
      "evidence": "method step 6: an independent should-cost benchmark is built for big items"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "quote_compared_to_benchmark",
      "status": "pass",
      "evidence": "method step 6: vendor quotes are compared against the should-cost benchmark"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "quote_variance_percent_matches_rederived",
      "status": "pass",
      "evidence": "method step 6: the declared variance percent equals the declared vendor quote minus the declared should-cost benchmark, divided by the benchmark, times 100 (whether the variance is acceptable is not judged here)"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "divergences_explained",
      "status": "pass",
      "evidence": "quality gate: divergences between quotes and the benchmark are explained — scope, rates, or margin"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "quote_exclusions_reviewed",
      "status": "pass",
      "evidence": "quality gate: the quotes' exclusions are reviewed line by line"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "quote_assumptions_reviewed",
      "status": "pass",
      "evidence": "method step 7: the quotes' assumptions are reviewed line by line"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "validity_period_respected",
      "status": "pass",
      "evidence": "method step 7: the quote validity period is respected"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "no_quote_accepted_without_scope_review",
      "status": "pass",
      "evidence": "red line: no vendor quote is accepted without scope review"
    },
    {
      "section": "feedback_loop",
      "check": "estimate_vs_actual_tracked_per_item",
      "status": "pass",
      "evidence": "quality gate: estimate vs actual is tracked per item"
    },
    {
      "section": "feedback_loop",
      "check": "rates_updated_from_actuals",
      "status": "pass",
      "evidence": "quality gate: tracked actuals are fed back into rates"
    },
    {
      "section": "feedback_loop",
      "check": "variance_lessons_published",
      "status": "pass",
      "evidence": "method step 8: variance lessons are published"
    }
  ],
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
  "summary": "35 pass, 0 fail, 0 missing of 35 checks across six sections.",
  "stamp": "COST ESTIMATE PREPARATION\nentity: Project Alpha\nVERDICT: COST_ESTIMATE_READY\n  basis_and_class              pass\n  elements_and_line_items      pass\n  uncertainty_and_ranges       pass\n  totals_escalation_and_currency pass\n  should_cost_and_quotes       pass\n  feedback_loop                pass\n35 pass, 0 fail, 0 missing of 35 checks across six sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "entity": "Project Alpha",
  "basis": {
    "document_present": true,
    "estimate_class": "invalid_class",
    "method": "bottom_up",
    "assumptions_documented": true,
    "exclusions_documented": true,
    "estimator_identified": true
  },
  "elements": {
    "breakdown_not_lump_sum": true,
    "labor_burden_included": true,
    "hidden_padding_in_rates": true
  },
  "line_items": [
    {
      "label": "Labor",
      "category": "labor",
      "quantity": 100.0,
      "unit_rate": 50.0,
      "declared_amount": 6000.0
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
        "declared_spread": 50.0
      }
    ],
    "expected_values_stated": true,
    "single_number_precision_on_uncertain_scope": false
  },
  "totals": {
    "declared_subtotal": 6000.0,
    "contingency_percent": 10.0,
    "declared_contingency_amount": 500.0,
    "escalation_percent": 5.0,
    "declared_escalation_amount": 300.0,
    "declared_grand_total": 6800.0,
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

Response (`response_text`):

```json
{
  "service": "cost-estimate-preparation",
  "atom_version": "0.1.0",
  "entity": "Project Alpha",
  "verdict": "COST_ESTIMATE_NOT_READY",
  "sections": {
    "basis_and_class": "fail",
    "elements_and_line_items": "fail",
    "uncertainty_and_ranges": "fail",
    "totals_escalation_and_currency": "fail",
    "should_cost_and_quotes": "pass",
    "feedback_loop": "pass"
  },
  "checks": [
    {
      "section": "basis_and_class",
      "check": "basis_document_present",
      "status": "pass",
      "evidence": "quality gate: a basis document is present for the estimate"
    },
    {
      "section": "basis_and_class",
      "check": "estimate_class_in_stated_classes",
      "status": "fail",
      "evidence": "method step 1: the declared estimate class is one of the classes the skill names — concept/ROM, budget, definitive (declared as concept_rom, budget, or definitive)"
    },
    {
      "section": "basis_and_class",
      "check": "method_in_stated_methods",
      "status": "pass",
      "evidence": "method step 2: the declared method is one of the methods the skill names — bottom-up, parametric, analogous (declared as bottom_up, parametric, or analogous)"
    },
    {
      "section": "basis_and_class",
      "check": "assumptions_documented",
      "status": "pass",
      "evidence": "quality gate: the basis document states the estimate's assumptions"
    },
    {
      "section": "basis_and_class",
      "check": "exclusions_documented",
      "status": "pass",
      "evidence": "quality gate: the basis document states the estimate's exclusions"
    },
    {
      "section": "basis_and_class",
      "check": "estimator_identified",
      "status": "pass",
      "evidence": "quality gate: the basis document identifies the estimator"
    },
    {
      "section": "elements_and_line_items",
      "check": "elements_broken_down_not_lump_sum",
      "status": "pass",
      "evidence": "method step 3: the estimate is broken into elements, not lump sums — material, labor, equipment, subcontract, freight, indirects"
    },
    {
      "section": "elements_and_line_items",
      "check": "labor_rates_include_burden",
      "status": "pass",
      "evidence": "method step 3: labor is costed as hours x rates including burden"
    },
    {
      "section": "elements_and_line_items",
      "check": "line_item_entries_complete",
      "status": "pass",
      "evidence": "every line item carries a label, a category, a quantity, a unit rate, and a declared amount"
    },
    {
      "section": "elements_and_line_items",
      "check": "line_item_amounts_match_quantity_times_rate",
      "status": "fail",
      "evidence": "method step 3: each declared line amount equals its declared quantity multiplied by its declared unit rate"
    },
    {
      "section": "elements_and_line_items",
      "check": "subtotal_matches_sum_of_line_items",
      "status": "pass",
      "evidence": "method step 3: the declared subtotal equals the sum of the declared line amounts"
    },
    {
      "section": "elements_and_line_items",
      "check": "no_hidden_padding_in_rates",
      "status": "fail",
      "evidence": "red line: no padding is hidden inside rates"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "ranges_stated_for_material_uncertainty",
      "status": "pass",
      "evidence": "quality gate: ranges, not points, are stated for material uncertainty"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "uncertainty_entries_complete",
      "status": "pass",
      "evidence": "every uncertainty item carries a label, three points, a declared expected value, and a declared spread"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "three_point_ordering_valid",
      "status": "pass",
      "evidence": "method step 4: each item's three points are in optimistic <= likely <= pessimistic order"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "three_point_spreads_match_pessimistic_minus_optimistic",
      "status": "fail",
      "evidence": "method step 4: each declared spread equals its declared pessimistic minus optimistic value (the declared expected value states no formula in the skill and is checked for presence only)"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "expected_values_stated",
      "status": "pass",
      "evidence": "method step 4: an expected value is stated for each shaky item alongside its spread"
    },
    {
      "section": "uncertainty_and_ranges",
      "check": "no_single_number_precision_on_uncertain_scope",
      "status": "pass",
      "evidence": "red line: no single-number precision is presented on uncertain scope"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "contingency_amount_matches_subtotal_times_percent",
      "status": "fail",
      "evidence": "the declared contingency amount equals the declared subtotal multiplied by the declared contingency percent (the percent itself is fixed by no statement in the skill and is not judged here)"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "escalation_amount_matches_subtotal_times_percent",
      "status": "pass",
      "evidence": "method step 5: the declared escalation amount equals the declared subtotal multiplied by the declared escalation percent (the percent itself is fixed by no statement in the skill and is not judged here)"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "grand_total_matches_subtotal_plus_contingency_plus_escalation",
      "status": "pass",
      "evidence": "the declared grand total equals the declared subtotal plus the declared contingency amount plus the declared escalation amount"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "escalation_impacts_stated",
      "status": "pass",
      "evidence": "method step 5: escalation impacts — inflation and lead-time — are stated"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "currency_impacts_stated",
      "status": "pass",
      "evidence": "method step 5: currency (fx) impacts are stated"
    },
    {
      "section": "totals_escalation_and_currency",
      "check": "quote_validity_dates_captured",
      "status": "pass",
      "evidence": "method step 5: quote validity dates are captured"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "should_cost_benchmark_built",
      "status": "pass",
      "evidence": "method step 6: an independent should-cost benchmark is built for big items"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "quote_compared_to_benchmark",
      "status": "pass",
      "evidence": "method step 6: vendor quotes are compared against the should-cost benchmark"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "quote_variance_percent_matches_rederived",
      "status": "pass",
      "evidence": "method step 6: the declared variance percent equals the declared vendor quote minus the declared should-cost benchmark, divided by the benchmark, times 100 (whether the variance is acceptable is not judged here)"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "divergences_explained",
      "status": "pass",
      "evidence": "quality gate: divergences between quotes and the benchmark are explained — scope, rates, or margin"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "quote_exclusions_reviewed",
      "status": "pass",
      "evidence": "quality gate: the quotes' exclusions are reviewed line by line"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "quote_assumptions_reviewed",
      "status": "pass",
      "evidence": "method step 7: the quotes' assumptions are reviewed line by line"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "validity_period_respected",
      "status": "pass",
      "evidence": "method step 7: the quote validity period is respected"
    },
    {
      "section": "should_cost_and_quotes",
      "check": "no_quote_accepted_without_scope_review",
      "status": "pass",
      "evidence": "red line: no vendor quote is accepted without scope review"
    },
    {
      "section": "feedback_loop",
      "check": "estimate_vs_actual_tracked_per_item",
      "status": "pass",
      "evidence": "quality gate: estimate vs actual is tracked per item"
    },
    {
      "section": "feedback_loop",
      "check": "rates_updated_from_actuals",
      "status": "pass",
      "evidence": "quality gate: tracked actuals are fed back into rates"
    },
    {
      "section": "feedback_loop",
      "check": "variance_lessons_published",
      "status": "pass",
      "evidence": "method step 8: variance lessons are published"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "line_items_evaluated": 1,
  "computed_subtotal": "6000.000000",
  "subtotal_difference": "0.000000",
  "uncertainty_items_evaluated": 1,
  "computed_total_spread": "20.000000",
  "total_spread_difference": "30.000000",
  "computed_contingency_amount": "600.000000",
  "contingency_difference": "-100.000000",
  "computed_escalation_amount": "300.000000",
  "escalation_difference": "0.000000",
  "computed_grand_total": "6800.000000",
  "grand_total_difference": "0.000000",
  "computed_quote_variance_percent": "10.000000",
  "quote_variance_difference": "0.000000",
  "summary": "30 pass, 5 fail, 0 missing of 35 checks across six sections.",
  "stamp": "COST ESTIMATE PREPARATION\nentity: Project Alpha\nVERDICT: COST_ESTIMATE_NOT_READY\n  basis_and_class              fail\n  elements_and_line_items      fail\n  uncertainty_and_ranges       fail\n  totals_escalation_and_currency fail\n  should_cost_and_quotes       pass\n  feedback_loop                pass\n30 pass, 5 fail, 0 missing of 35 checks across six sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "totals": {
    "declared_subtotal": "five thousand"
  }
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "totals.declared_subtotal",
  "detail": "totals.declared_subtotal must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 35 / 35 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 48 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom audits a declared cost-estimate artifact for completeness and arithmetic consistency. Although an estimate is a financial planning document, its verdict is a preparation-quality judgment on declared evidence — not regulatory compliance or audit evidence, and cost estimating is not itself a regulated filing or licensed activity.
