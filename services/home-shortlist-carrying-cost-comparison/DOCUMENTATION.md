# Home shortlist carrying cost comparison — documentation

**Home shortlist carrying cost comparison** · slug `home-shortlist-carrying-cost-comparison` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `search_name` "Calgary Family Home"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "home-shortlist-carrying-cost-comparison"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the home-shortlist manifest.** You declare a record of a home search — the criteria written before searching, the tracked candidate homes with their declared figures, the tracking record, and the presentation record — the atom audits the record and computes the carrying-cost comparison over the declared figures; it does not fetch listings or do the search (see Explanation). The recorded full-pass manifest declares the search `Calgary Family Home` in `CAD`: criteria written before search, area `NW Calgary`, property type `Detached`, a declared budget ceiling of `600000`, and must-haves and deal-breakers defined. It declares one home, `Home A`: listing source `MLS`, fetched `2023-10-01`, status `live`, asking price `550000`, and the four declared monthly components — housing payment `2500`, property tax `300`, utilities estimate `200`, condo or HOA fees `0` — with a declared monthly carrying cost of `3000`, no open questions, and `meets_criteria` declared `true`. It declares the candidates tracked in one list, refreshed before comparison, with any criteria/market conflict addressed; and the shortlist ranked on carrying cost not price alone, sources and fetch dates attached, unknowns presented as questions, freshness limits stated, and the comparison presented as research not advice.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/home-shortlist-carrying-cost-comparison` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `HOME_SHORTLIST_COMPARISON_READY`: "25 pass, 0 fail, 0 missing of 25 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `homes_count` is 1, `monthly_carrying_costs` is `[{"name": "Home A", "monthly_carrying_cost": "3000.000000"}]` (the re-derived sum `2500 + 300 + 200 + 0 = 3000`), `total_monthly_carrying_cost`, `lowest_monthly_carrying_cost` and `highest_monthly_carrying_cost` are each `"3000.000000"`, `carrying_cost_spread` is `"0.000000"`, `ranked_home_names` is `["Home A"]`, `cheapest_home_name` is `"Home A"`, `cost_figure_coverage` is `"1.000000"`, `homes_over_budget_ceiling` is `[]`, `homes_within_budget_count` is 1, and `any_home_within_budget` is `true`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and its declared totals re-derive from its declared components — nothing more (see Explanation for what the atom does not certify). If the verdict had been `HOME_SHORTLIST_COMPARISON_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "home-shortlist-carrying-cost-comparison"}`.
3. Call: `POST https://atoms.pipavia.com/v1/home-shortlist-carrying-cost-comparison` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/home-shortlist-carrying-cost-comparison` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `home_shortlist_carrying_cost_comparison`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `HOME_SHORTLIST_COMPARISON_NOT_READY` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 1 check fails: `declared_carrying_costs_match_rederived`, and the summary reads "24 pass, 1 fail, 0 missing of 25 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `homes_with_carrying_cost_mismatch` names the row `Bad Home`: its four declared monthly components re-derive to `100` — `100 + 0 + 0 + 0` — but its `declared_monthly_carrying_cost` is `999`; its entry in `monthly_carrying_costs` is `{"name": "Bad Home", "monthly_carrying_cost": "100.000000"}`, the section `carrying_cost_computation` reports `fail` while the other four sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "homes",
  "detail": "homes must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/home-shortlist-carrying-cost-comparison` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/home-shortlist-carrying-cost-comparison` — tool name `home_shortlist_carrying_cost_comparison`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `home_shortlist_carrying_cost_comparison` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `HOME_SHORTLIST_COMPARISON_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `search_name` | string | Carried into the verdict output, not itself checked |

#### Read by: criteria_first

| Field | Type | Notes |
|---|---|---|
| `currency` | string | Must be a non-empty string for the check to pass — an absent field is missing evidence, an empty string fails; no currency vocabulary is imposed |
| `criteria` | object | The criteria section object — a present non-object value is rejected before evaluation |
| `criteria.written_before_search` | boolean | — |
| `criteria.area` | string | Must be non-empty for the check to pass; absent = missing, empty = fail |
| `criteria.property_type` | string | Must be non-empty for the check to pass; absent = missing, empty = fail |
| `criteria.budget_ceiling` | number | The caller's declared asking-price ceiling in the declared currency; must be > 0 for the check to pass; absent = missing; also read by carrying_cost_computation (budget comparison outputs) |
| `criteria.must_haves_defined` | boolean | — |
| `criteria.deal_breakers_defined` | boolean | — |

#### Read by: candidate_records

| Field | Type | Notes |
|---|---|---|
| `homes` | list | List of home-row objects, each with the entry fields below; computed, see below; also read by carrying_cost_computation |
| `homes[]` | object | One declared home row — a present non-object entry is rejected before evaluation |
| `homes[].name` | string | Names the row in the computed outputs; a row without a string name is reported as `unnamed`; also read by carrying_cost_computation |
| `homes[].listing_source` | string | Must be non-empty per row for the check to pass; field absent from a row = missing evidence, empty string = fail |
| `homes[].fetch_date` | string | The date the listing was fetched, as declared; must be non-empty per row; absent = missing, empty = fail; the format and age are not judged — see the declined thresholds |
| `homes[].status` | string | Must be one of the four statuses the skill names — `live`, `ruled_out`, `viewed`, `awaiting_information`; field absent from a row = missing evidence, any other value = fail |
| `homes[].ruled_out_reason` | string (conditional) | Required non-empty when the row's status is `ruled_out`; absent from a ruled-out row = missing evidence, empty = fail; not read for other statuses |
| `homes[].open_questions` | list of strings | The field must be declared per row — an empty list declares no open questions; field absent from a row = missing evidence |
| `homes[].meets_criteria` | boolean | The caller's fit declaration per row; field absent from a row = missing evidence |

#### Read by: carrying_cost_computation

| Field | Type | Notes |
|---|---|---|
| `homes[].asking_price` | number | Must be > 0 per row for the check to pass; absent = missing |
| `homes[].monthly_housing_payment` | number | The caller-declared monthly mortgage or rent payment; must be >= 0; absent = missing. Never derived from the asking price — see the declined thresholds |
| `homes[].monthly_property_tax` | number | Declared monthly property tax; must be >= 0; absent = missing |
| `homes[].monthly_utilities_estimate` | number | Declared monthly utilities estimate; must be >= 0; absent = missing |
| `homes[].monthly_condo_or_hoa_fees` | number | Declared monthly condo or HOA fees; must be >= 0 — zero declares none; absent = missing |
| `homes[].declared_monthly_carrying_cost` | number | The caller's own stated monthly total for the row, re-derived and compared — see the computed rules in Explanation; absent = missing |

#### Read by: tracking_and_refresh

| Field | Type | Notes |
|---|---|---|
| `tracking` | object | The tracking section object — a present non-object value is rejected before evaluation |
| `tracking.tracked_in_one_list` | boolean | — |
| `tracking.refreshed_before_comparison` | boolean | — |
| `tracking.criteria_market_conflict_addressed` | boolean | — |

#### Read by: ranking_and_presentation

| Field | Type | Notes |
|---|---|---|
| `presentation` | object | The presentation section object — a present non-object value is rejected before evaluation |
| `presentation.ranked_on_carrying_cost_not_price_alone` | boolean | — |
| `presentation.sources_and_fetch_dates_attached` | boolean | — |
| `presentation.unknowns_presented_as_questions` | boolean | — |
| `presentation.freshness_limits_stated` | boolean | — |
| `presentation.presented_as_research_not_advice` | boolean | — |

### Checks

All 25 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: criteria_first

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `criteria_written_before_search` | method step 1 / quality gate: the criteria were written down before listings were gathered | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `currency_declared` | method step 3: every declared figure is in one declared currency — a non-empty currency string, so the comparison sums like with like | Pass: the field is declared as a non-empty string. Fail: it is declared as an empty string. Missing: the field is absent. |
| `criteria_area_declared` | method step 1: the criteria name the search area — a non-empty area string | Pass: the field is declared as a non-empty string. Fail: it is declared as an empty string. Missing: the field is absent. |
| `criteria_property_type_declared` | method step 1: the criteria name the property type — a non-empty property_type string | Pass: the field is declared as a non-empty string. Fail: it is declared as an empty string. Missing: the field is absent. |
| `criteria_budget_ceiling_declared` | method step 1: the criteria declare a budget ceiling — a positive declared amount, the caller's own ceiling (no affordability bar is imposed here) | Pass: the field is declared as a number greater than 0. Fail: it is declared as a number that is not greater than 0. Missing: the field is absent. |
| `must_haves_defined` | method step 1: the must-haves are defined in writing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deal_breakers_defined` | method step 1: the deal-breakers are defined in writing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: candidate_records

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `homes_declared` | method step 2: the declared record names its candidate homes — the homes list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_home_names_listing_source` | quality gate: every candidate names its listing source — a non-empty listing_source string per home | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_home_names_fetch_date` | quality gate: every candidate names the date its listing was fetched — a non-empty fetch_date string per home | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_home_declares_stated_status` | method step 6: every home declares a tracking status from the statuses the skill names — live, ruled_out, viewed, awaiting_information | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_home_declares_fit_to_criteria` | method step 9: every home declares whether it meets the written criteria, so the shortlist can be ranked on fit as well as carrying cost | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_ruled_out_home_has_reason` | quality gate: ruled-out homes carry a reason, not just a deletion — every home declared ruled_out names a non-empty ruled_out_reason | Computed over the declared record, conditional per row on `homes[].status` being `ruled_out`. Pass: every ruled-out row names a non-empty `ruled_out_reason` — or there are no ruled-out rows, in which case the check passes as not applicable. Fail: a ruled-out row declares an empty `ruled_out_reason` (offending rows are named in `ruled_out_homes_without_reason`). Missing: the list is absent, or a ruled-out row has `ruled_out_reason` absent (such a row is missing evidence and does not appear in `ruled_out_homes_without_reason`). |
| `every_home_lists_open_questions` | method step 5: every home lists what the listing does not say as open questions — the open_questions list is declared per home (an empty list declares none) | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |

#### Section: carrying_cost_computation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `every_home_declares_asking_price` | method step 3: every home declares its asking price — a positive declared amount per home | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_home_declares_all_monthly_cost_components` | method step 3: every home declares all four monthly carrying-cost components — housing payment, property tax, utilities estimate, condo or HOA fees — each a non-negative declared amount (zero declares none, e.g. no HOA fees; nothing is estimated here) | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `declared_carrying_costs_match_rederived` | method step 4: each home's declared monthly carrying cost equals the re-derived sum of its four declared monthly components | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |

#### Section: tracking_and_refresh

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `candidates_tracked_in_one_list` | method step 6: the candidates are tracked in one list with honest status notes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `stale_candidates_refreshed_before_comparison` | method step 8: stale candidates were refreshed before the comparison is relied on — availability and price change without notice | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `criteria_market_conflict_addressed` | method step 7: where criteria and market reality conflict, that is stated plainly with the nearest trade-offs shown (or none was found) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: ranking_and_presentation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `shortlist_ranked_on_carrying_cost_not_price_alone` | method step 9 / red line: the shortlist is ranked on fit to criteria and full carrying cost — never on headline price while hiding fees | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sources_and_fetch_dates_attached_to_shortlist` | method step 9: sources and fetch dates are attached to the presented shortlist | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `unknowns_presented_as_questions_not_assumptions` | quality gate: unknowns are listed as questions, never filled in by guesswork | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `freshness_limits_stated` | red line: no listing price or availability is presented as current beyond its fetch time — the freshness limits are stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `presented_as_research_not_advice` | red line: the comparison is presented as education and organization, not real-estate advice — the buy decision stays with the caller and their own professionals | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"home-shortlist-carrying-cost-comparison"`), `atom_version` (`"0.1.0"`), and `search_name` (the manifest's declared search name, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `homes_count` (the declared list length as an integer, or null when the list is not declared); `monthly_carrying_costs` (one `{name, monthly_carrying_cost}` entry per declared home, in declared order; null when the list is not declared — a row missing any component has a null cost entry and is excluded from the totals and the ranking); `total_monthly_carrying_cost` (the sum over homes with complete cost figures; null when no home has complete figures), `lowest_monthly_carrying_cost`, `highest_monthly_carrying_cost` and `carrying_cost_spread` (highest − lowest; each null under the same condition); `ranked_home_names` (homes with complete cost figures ranked by re-derived monthly carrying cost, ascending, ties in declared order; null when the list is not declared); `cheapest_home_name` (the first ranked home, or null); `cost_figure_coverage` (homes with complete cost figures ÷ declared homes); the row-name lists `homes_without_listing_source`, `homes_without_fetch_date`, `homes_with_invalid_status`, `ruled_out_homes_without_reason`, `homes_not_meeting_criteria` and `homes_with_carrying_cost_mismatch` (null when the `homes` list is not declared; for `ruled_out_homes_without_reason`, a ruled-out home with `ruled_out_reason` absent is missing evidence and does not appear); and the budget outputs `homes_over_budget_ceiling` (homes whose declared `asking_price` exceeds the declared `criteria.budget_ceiling`), `homes_within_budget_count` (the priced homes at or under the ceiling) and `any_home_within_budget` (whether any priced home is within it) — all three null when the homes list or the ceiling is not declared. Computed amounts and ratios are strings with exactly six decimal places under the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; the declared-total comparison uses the fixed-6dp difference against zero — which is what makes the Python and TypeScript outputs byte-identical. Counts are reported as integers, exactly.
- `summary` — a one-line count, e.g. "25 pass, 0 fail, 0 missing of 25 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared search name, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `HOME_SHORTLIST_COMPARISON_READY` — all 25 checks pass: the declared home-shortlist record is complete and its declared totals re-derive from its declared components.
- `HOME_SHORTLIST_COMPARISON_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent (SERVICE.md phrases this as: null when any of the seven primary computed checks cannot be completed).

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the home_shortlist_carrying_cost_comparison scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the home_shortlist_carrying_cost_comparison scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"homes","detail":"homes must be a list"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for home-shortlist-carrying-cost-comparison exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = query (one query = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Support a home search with defined criteria, real comparable listings and full carrying-cost comparison — organized research, not real-estate advice (the bound capability, from the `home-search` skill). You submit one declared record — the home-shortlist manifest — and the atom audits that record for completeness and arithmetic against the bound skill's method, quality gates and red lines, and computes the carrying-cost comparison over the declared rows, returning one deterministic verdict across 5 sections (`criteria_first`, `candidate_records`, `carrying_cost_computation`, `tracking_and_refresh`, `ranking_and_presentation`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes; present-but-`false` fails; absent is `missing`. *Declared-value checks* read a single declared string or number: a non-empty string (for `currency`, `criteria.area`, `criteria.property_type`) or a positive number (for `criteria.budget_ceiling`) passes; an empty string or a non-positive number fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `homes` list must be present and non-empty, every row must name a non-empty `listing_source` and `fetch_date`, declare a `status` from the four statuses the skill names (`live`, `ruled_out`, `viewed`, `awaiting_information`), declare its open questions and whether it meets the criteria, declare its `asking_price` and all four monthly cost components, and every row's `declared_monthly_carrying_cost` must equal the re-derived sum of its four declared monthly components (`monthly_housing_payment` + `monthly_property_tax` + `monthly_utilities_estimate` + `monthly_condo_or_hoa_fees`) — using only the declared figures, with no outside threshold imported. The budget comparison is reported, never failed: a home is over budget exactly when its declared `asking_price` exceeds the declared `criteria.budget_ceiling`. *Conditional checks* bind only when their declared gate says the situation applies — the ruled-out-reason check is required only for rows whose `status` is `ruled_out`; when no row is ruled out it passes as not applicable. Aggregation is strict: any `fail` anywhere produces `HOME_SHORTLIST_COMPARISON_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `HOME_SHORTLIST_COMPARISON_READY`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: an affordability ratio or income multiple (the skill sets no share-of-income bar — the caller's declared ceiling is the only budget figure); a mortgage interest rate, amortization term, or down-payment assumption for deriving a housing payment from an asking price (the skill states none — the housing payment is caller-declared, never derived); a fetch-date staleness age in days (the skill says refresh stale candidates but states no age — caller attestation only, and the fetch date's format is not judged); a property-tax annual-to-monthly conversion (callers declare monthly figures directly — no divisor is assumed); a carrying-cost gap or spread that would make one home "too expensive" relative to another (costs are ranked and reported, never barred); a minimum or maximum shortlist size beyond non-empty; and a currency vocabulary or exchange conversion (one declared currency per record, figures summed as declared). Quantities are computed and reported against the caller's own declared ceiling; the only bar on the computed rows is completeness and arithmetic consistency over the caller's own declared rows.

**What it does NOT do.** The atom compares a **declared** home-shortlist record — it fetches no listings, searches no listing source, and values no homes. It does not verify that a declared listing exists, that a declared price or fee is what the source stated, that a fetch date is real, or that a home is still available: a comparison is ready *on the caller's declared evidence*. It is a completeness and arithmetic audit of the record the skill requires, **not a real-estate service or advice**: it never judges whether a home is worth its price, whether the declared budget is affordable for the caller, whether a declared tax or utilities figure is realistic for the area, or which home the caller should buy — only that the record contains what the skill's method, quality gates and red lines demand, that its declared totals re-derive from its declared components, and how its declared homes rank on the declared figures. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no listing search, fetch, or availability check; no home valuation or price verification; no mortgage calculation (payments are declared, never derived); no neighbourhood, commute, school, or services assessment (the skill lists those as search considerations — no field in this record carries them, and no check here audits them); no rental-versus-buy judgment beyond the same arithmetic applied to declared figures (a rental home declares its rent as its housing payment).

**Discrepancy note.** SERVICE.md's Status section and contract.yaml still describe this atom as `built-locally` with no endpoint live; the recorded external battery was executed against the live gateway (v1.1.0) and returned the verdicts reproduced below. Where they differ, this document follows the recorded response — status: live — release candidate — as stated in the header.

**Buyer and use context.** Teams and agents working in Money & markets who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Calgary family home search (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom compares a declared home-shortlist record whose figures are caller-declared; its verdict is a completeness and arithmetic judgment on the declared evidence, not compliance or audit evidence, and SERVICE.md frames the atom explicitly as organized research, not real-estate advice, verifying no listing. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `home_shortlist_carrying_cost_comparison` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed amounts and ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/home_shortlist_carrying_cost_comparison.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_home_shortlist_carrying_cost_comparison.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/home-shortlist-carrying-cost-comparison` (REST) and `POST /mcp/home-shortlist-carrying-cost-comparison` (MCP, tool `home_shortlist_carrying_cost_comparison`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `home_shortlist_carrying_cost_comparison`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T05:39:33.508461+00:00 against gateway v1.1.0, external verification lane, source `verification/work/home-shortlist-carrying-cost-comparison/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "search_name": "Calgary Family Home",
  "currency": "CAD",
  "criteria": {
    "written_before_search": true,
    "area": "NW Calgary",
    "property_type": "Detached",
    "budget_ceiling": 600000,
    "must_haves_defined": true,
    "deal_breakers_defined": true
  },
  "homes": [
    {
      "name": "Home A",
      "listing_source": "MLS",
      "fetch_date": "2023-10-01",
      "status": "live",
      "asking_price": 550000,
      "monthly_housing_payment": 2500,
      "monthly_property_tax": 300,
      "monthly_utilities_estimate": 200,
      "monthly_condo_or_hoa_fees": 0,
      "declared_monthly_carrying_cost": 3000,
      "open_questions": [],
      "meets_criteria": true
    }
  ],
  "tracking": {
    "tracked_in_one_list": true,
    "refreshed_before_comparison": true,
    "criteria_market_conflict_addressed": true
  },
  "presentation": {
    "ranked_on_carrying_cost_not_price_alone": true,
    "sources_and_fetch_dates_attached": true,
    "unknowns_presented_as_questions": true,
    "freshness_limits_stated": true,
    "presented_as_research_not_advice": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "home-shortlist-carrying-cost-comparison",
  "atom_version": "0.1.0",
  "search_name": "Calgary Family Home",
  "verdict": "HOME_SHORTLIST_COMPARISON_READY",
  "sections": {
    "criteria_first": "pass",
    "candidate_records": "pass",
    "carrying_cost_computation": "pass",
    "tracking_and_refresh": "pass",
    "ranking_and_presentation": "pass"
  },
  "checks": [
    {
      "section": "criteria_first",
      "check": "criteria_written_before_search",
      "status": "pass",
      "evidence": "method step 1 / quality gate: the criteria were written down before listings were gathered"
    },
    {
      "section": "criteria_first",
      "check": "currency_declared",
      "status": "pass",
      "evidence": "method step 3: every declared figure is in one declared currency \u2014 a non-empty currency string, so the comparison sums like with like"
    },
    {
      "section": "criteria_first",
      "check": "criteria_area_declared",
      "status": "pass",
      "evidence": "method step 1: the criteria name the search area \u2014 a non-empty area string"
    },
    {
      "section": "criteria_first",
      "check": "criteria_property_type_declared",
      "status": "pass",
      "evidence": "method step 1: the criteria name the property type \u2014 a non-empty property_type string"
    },
    {
      "section": "criteria_first",
      "check": "criteria_budget_ceiling_declared",
      "status": "pass",
      "evidence": "method step 1: the criteria declare a budget ceiling \u2014 a positive declared amount, the caller's own ceiling (no affordability bar is imposed here)"
    },
    {
      "section": "criteria_first",
      "check": "must_haves_defined",
      "status": "pass",
      "evidence": "method step 1: the must-haves are defined in writing"
    },
    {
      "section": "criteria_first",
      "check": "deal_breakers_defined",
      "status": "pass",
      "evidence": "method step 1: the deal-breakers are defined in writing"
    },
    {
      "section": "candidate_records",
      "check": "homes_declared",
      "status": "pass",
      "evidence": "method step 2: the declared record names its candidate homes \u2014 the homes list is present and non-empty"
    },
    {
      "section": "candidate_records",
      "check": "every_home_names_listing_source",
      "status": "pass",
      "evidence": "quality gate: every candidate names its listing source \u2014 a non-empty listing_source string per home"
    },
    {
      "section": "candidate_records",
      "check": "every_home_names_fetch_date",
      "status": "pass",
      "evidence": "quality gate: every candidate names the date its listing was fetched \u2014 a non-empty fetch_date string per home"
    },
    {
      "section": "candidate_records",
      "check": "every_home_declares_stated_status",
      "status": "pass",
      "evidence": "method step 6: every home declares a tracking status from the statuses the skill names \u2014 live, ruled_out, viewed, awaiting_information"
    },
    {
      "section": "candidate_records",
      "check": "every_home_declares_fit_to_criteria",
      "status": "pass",
      "evidence": "method step 9: every home declares whether it meets the written criteria, so the shortlist can be ranked on fit as well as carrying cost"
    },
    {
      "section": "candidate_records",
      "check": "every_ruled_out_home_has_reason",
      "status": "pass",
      "evidence": "quality gate: ruled-out homes carry a reason, not just a deletion \u2014 every home declared ruled_out names a non-empty ruled_out_reason"
    },
    {
      "section": "candidate_records",
      "check": "every_home_lists_open_questions",
      "status": "pass",
      "evidence": "method step 5: every home lists what the listing does not say as open questions \u2014 the open_questions list is declared per home (an empty list declares none)"
    },
    {
      "section": "carrying_cost_computation",
      "check": "every_home_declares_asking_price",
      "status": "pass",
      "evidence": "method step 3: every home declares its asking price \u2014 a positive declared amount per home"
    },
    {
      "section": "carrying_cost_computation",
      "check": "every_home_declares_all_monthly_cost_components",
      "status": "pass",
      "evidence": "method step 3: every home declares all four monthly carrying-cost components \u2014 housing payment, property tax, utilities estimate, condo or HOA fees \u2014 each a non-negative declared amount (zero declares none, e.g. no HOA fees; nothing is estimated here)"
    },
    {
      "section": "carrying_cost_computation",
      "check": "declared_carrying_costs_match_rederived",
      "status": "pass",
      "evidence": "method step 4: each home's declared monthly carrying cost equals the re-derived sum of its four declared monthly components"
    },
    {
      "section": "tracking_and_refresh",
      "check": "candidates_tracked_in_one_list",
      "status": "pass",
      "evidence": "method step 6: the candidates are tracked in one list with honest status notes"
    },
    {
      "section": "tracking_and_refresh",
      "check": "stale_candidates_refreshed_before_comparison",
      "status": "pass",
      "evidence": "method step 8: stale candidates were refreshed before the comparison is relied on \u2014 availability and price change without notice"
    },
    {
      "section": "tracking_and_refresh",
      "check": "criteria_market_conflict_addressed",
      "status": "pass",
      "evidence": "method step 7: where criteria and market reality conflict, that is stated plainly with the nearest trade-offs shown (or none was found)"
    },
    {
      "section": "ranking_and_presentation",
      "check": "shortlist_ranked_on_carrying_cost_not_price_alone",
      "status": "pass",
      "evidence": "method step 9 / red line: the shortlist is ranked on fit to criteria and full carrying cost \u2014 never on headline price while hiding fees"
    },
    {
      "section": "ranking_and_presentation",
      "check": "sources_and_fetch_dates_attached_to_shortlist",
      "status": "pass",
      "evidence": "method step 9: sources and fetch dates are attached to the presented shortlist"
    },
    {
      "section": "ranking_and_presentation",
      "check": "unknowns_presented_as_questions_not_assumptions",
      "status": "pass",
      "evidence": "quality gate: unknowns are listed as questions, never filled in by guesswork"
    },
    {
      "section": "ranking_and_presentation",
      "check": "freshness_limits_stated",
      "status": "pass",
      "evidence": "red line: no listing price or availability is presented as current beyond its fetch time \u2014 the freshness limits are stated"
    },
    {
      "section": "ranking_and_presentation",
      "check": "presented_as_research_not_advice",
      "status": "pass",
      "evidence": "red line: the comparison is presented as education and organization, not real-estate advice \u2014 the buy decision stays with the caller and their own professionals"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "homes_count": 1,
  "monthly_carrying_costs": [
    {
      "name": "Home A",
      "monthly_carrying_cost": "3000.000000"
    }
  ],
  "total_monthly_carrying_cost": "3000.000000",
  "lowest_monthly_carrying_cost": "3000.000000",
  "highest_monthly_carrying_cost": "3000.000000",
  "carrying_cost_spread": "0.000000",
  "ranked_home_names": [
    "Home A"
  ],
  "cheapest_home_name": "Home A",
  "cost_figure_coverage": "1.000000",
  "homes_without_listing_source": [],
  "homes_without_fetch_date": [],
  "homes_with_invalid_status": [],
  "ruled_out_homes_without_reason": [],
  "homes_not_meeting_criteria": [],
  "homes_with_carrying_cost_mismatch": [],
  "homes_over_budget_ceiling": [],
  "homes_within_budget_count": 1,
  "any_home_within_budget": true,
  "summary": "25 pass, 0 fail, 0 missing of 25 checks across five sections.",
  "stamp": "HOME SHORTLIST CARRYING COST COMPARISON\nsearch_name: Calgary Family Home\nVERDICT: HOME_SHORTLIST_COMPARISON_READY\n  criteria_first                       pass\n  candidate_records                    pass\n  carrying_cost_computation            pass\n  tracking_and_refresh                 pass\n  ranking_and_presentation             pass\n25 pass, 0 fail, 0 missing of 25 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "search_name": "Test",
  "currency": "CAD",
  "criteria": {
    "written_before_search": true,
    "area": "A",
    "property_type": "B",
    "budget_ceiling": 100,
    "must_haves_defined": true,
    "deal_breakers_defined": true
  },
  "homes": [
    {
      "name": "Bad Home",
      "listing_source": "MLS",
      "fetch_date": "2023-01-01",
      "status": "live",
      "asking_price": 100,
      "monthly_housing_payment": 100,
      "monthly_property_tax": 0,
      "monthly_utilities_estimate": 0,
      "monthly_condo_or_hoa_fees": 0,
      "declared_monthly_carrying_cost": 999,
      "open_questions": [],
      "meets_criteria": true
    }
  ],
  "tracking": {
    "tracked_in_one_list": true,
    "refreshed_before_comparison": true,
    "criteria_market_conflict_addressed": true
  },
  "presentation": {
    "ranked_on_carrying_cost_not_price_alone": true,
    "sources_and_fetch_dates_attached": true,
    "unknowns_presented_as_questions": true,
    "freshness_limits_stated": true,
    "presented_as_research_not_advice": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "home-shortlist-carrying-cost-comparison",
  "atom_version": "0.1.0",
  "search_name": "Test",
  "verdict": "HOME_SHORTLIST_COMPARISON_NOT_READY",
  "sections": {
    "criteria_first": "pass",
    "candidate_records": "pass",
    "carrying_cost_computation": "fail",
    "tracking_and_refresh": "pass",
    "ranking_and_presentation": "pass"
  },
  "checks": [
    {
      "section": "criteria_first",
      "check": "criteria_written_before_search",
      "status": "pass",
      "evidence": "method step 1 / quality gate: the criteria were written down before listings were gathered"
    },
    {
      "section": "criteria_first",
      "check": "currency_declared",
      "status": "pass",
      "evidence": "method step 3: every declared figure is in one declared currency \u2014 a non-empty currency string, so the comparison sums like with like"
    },
    {
      "section": "criteria_first",
      "check": "criteria_area_declared",
      "status": "pass",
      "evidence": "method step 1: the criteria name the search area \u2014 a non-empty area string"
    },
    {
      "section": "criteria_first",
      "check": "criteria_property_type_declared",
      "status": "pass",
      "evidence": "method step 1: the criteria name the property type \u2014 a non-empty property_type string"
    },
    {
      "section": "criteria_first",
      "check": "criteria_budget_ceiling_declared",
      "status": "pass",
      "evidence": "method step 1: the criteria declare a budget ceiling \u2014 a positive declared amount, the caller's own ceiling (no affordability bar is imposed here)"
    },
    {
      "section": "criteria_first",
      "check": "must_haves_defined",
      "status": "pass",
      "evidence": "method step 1: the must-haves are defined in writing"
    },
    {
      "section": "criteria_first",
      "check": "deal_breakers_defined",
      "status": "pass",
      "evidence": "method step 1: the deal-breakers are defined in writing"
    },
    {
      "section": "candidate_records",
      "check": "homes_declared",
      "status": "pass",
      "evidence": "method step 2: the declared record names its candidate homes \u2014 the homes list is present and non-empty"
    },
    {
      "section": "candidate_records",
      "check": "every_home_names_listing_source",
      "status": "pass",
      "evidence": "quality gate: every candidate names its listing source \u2014 a non-empty listing_source string per home"
    },
    {
      "section": "candidate_records",
      "check": "every_home_names_fetch_date",
      "status": "pass",
      "evidence": "quality gate: every candidate names the date its listing was fetched \u2014 a non-empty fetch_date string per home"
    },
    {
      "section": "candidate_records",
      "check": "every_home_declares_stated_status",
      "status": "pass",
      "evidence": "method step 6: every home declares a tracking status from the statuses the skill names \u2014 live, ruled_out, viewed, awaiting_information"
    },
    {
      "section": "candidate_records",
      "check": "every_home_declares_fit_to_criteria",
      "status": "pass",
      "evidence": "method step 9: every home declares whether it meets the written criteria, so the shortlist can be ranked on fit as well as carrying cost"
    },
    {
      "section": "candidate_records",
      "check": "every_ruled_out_home_has_reason",
      "status": "pass",
      "evidence": "quality gate: ruled-out homes carry a reason, not just a deletion \u2014 every home declared ruled_out names a non-empty ruled_out_reason"
    },
    {
      "section": "candidate_records",
      "check": "every_home_lists_open_questions",
      "status": "pass",
      "evidence": "method step 5: every home lists what the listing does not say as open questions \u2014 the open_questions list is declared per home (an empty list declares none)"
    },
    {
      "section": "carrying_cost_computation",
      "check": "every_home_declares_asking_price",
      "status": "pass",
      "evidence": "method step 3: every home declares its asking price \u2014 a positive declared amount per home"
    },
    {
      "section": "carrying_cost_computation",
      "check": "every_home_declares_all_monthly_cost_components",
      "status": "pass",
      "evidence": "method step 3: every home declares all four monthly carrying-cost components \u2014 housing payment, property tax, utilities estimate, condo or HOA fees \u2014 each a non-negative declared amount (zero declares none, e.g. no HOA fees; nothing is estimated here)"
    },
    {
      "section": "carrying_cost_computation",
      "check": "declared_carrying_costs_match_rederived",
      "status": "fail",
      "evidence": "method step 4: each home's declared monthly carrying cost equals the re-derived sum of its four declared monthly components"
    },
    {
      "section": "tracking_and_refresh",
      "check": "candidates_tracked_in_one_list",
      "status": "pass",
      "evidence": "method step 6: the candidates are tracked in one list with honest status notes"
    },
    {
      "section": "tracking_and_refresh",
      "check": "stale_candidates_refreshed_before_comparison",
      "status": "pass",
      "evidence": "method step 8: stale candidates were refreshed before the comparison is relied on \u2014 availability and price change without notice"
    },
    {
      "section": "tracking_and_refresh",
      "check": "criteria_market_conflict_addressed",
      "status": "pass",
      "evidence": "method step 7: where criteria and market reality conflict, that is stated plainly with the nearest trade-offs shown (or none was found)"
    },
    {
      "section": "ranking_and_presentation",
      "check": "shortlist_ranked_on_carrying_cost_not_price_alone",
      "status": "pass",
      "evidence": "method step 9 / red line: the shortlist is ranked on fit to criteria and full carrying cost \u2014 never on headline price while hiding fees"
    },
    {
      "section": "ranking_and_presentation",
      "check": "sources_and_fetch_dates_attached_to_shortlist",
      "status": "pass",
      "evidence": "method step 9: sources and fetch dates are attached to the presented shortlist"
    },
    {
      "section": "ranking_and_presentation",
      "check": "unknowns_presented_as_questions_not_assumptions",
      "status": "pass",
      "evidence": "quality gate: unknowns are listed as questions, never filled in by guesswork"
    },
    {
      "section": "ranking_and_presentation",
      "check": "freshness_limits_stated",
      "status": "pass",
      "evidence": "red line: no listing price or availability is presented as current beyond its fetch time \u2014 the freshness limits are stated"
    },
    {
      "section": "ranking_and_presentation",
      "check": "presented_as_research_not_advice",
      "status": "pass",
      "evidence": "red line: the comparison is presented as education and organization, not real-estate advice \u2014 the buy decision stays with the caller and their own professionals"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "homes_count": 1,
  "monthly_carrying_costs": [
    {
      "name": "Bad Home",
      "monthly_carrying_cost": "100.000000"
    }
  ],
  "total_monthly_carrying_cost": "100.000000",
  "lowest_monthly_carrying_cost": "100.000000",
  "highest_monthly_carrying_cost": "100.000000",
  "carrying_cost_spread": "0.000000",
  "ranked_home_names": [
    "Bad Home"
  ],
  "cheapest_home_name": "Bad Home",
  "cost_figure_coverage": "1.000000",
  "homes_without_listing_source": [],
  "homes_without_fetch_date": [],
  "homes_with_invalid_status": [],
  "ruled_out_homes_without_reason": [],
  "homes_not_meeting_criteria": [],
  "homes_with_carrying_cost_mismatch": [
    "Bad Home"
  ],
  "homes_over_budget_ceiling": [],
  "homes_within_budget_count": 1,
  "any_home_within_budget": true,
  "summary": "24 pass, 1 fail, 0 missing of 25 checks across five sections.",
  "stamp": "HOME SHORTLIST CARRYING COST COMPARISON\nsearch_name: Test\nVERDICT: HOME_SHORTLIST_COMPARISON_NOT_READY\n  criteria_first                       pass\n  candidate_records                    pass\n  carrying_cost_computation            fail\n  tracking_and_refresh                 pass\n  ranking_and_presentation             pass\n24 pass, 1 fail, 0 missing of 25 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "search_name": "Malformed",
  "homes": "not-a-list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "homes",
  "detail": "homes must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom is a declared-figure comparison whose verdict is not compliance evidence and which SERVICE.md frames as non-advisory (not real-estate advice, verifying no listing) |
| Checks named | 25 documented / 25 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 34 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/home-shortlist-carrying-cost-comparison/evidence.json` |
