# Data analysis deliverable — `data-analysis-deliverable`

**Display name:** Data analysis deliverable · **Slug:** `data-analysis-deliverable` · **Deliverable type:** REPORT · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run for this atom; the exact request and response are reproduced verbatim under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up and issue a gateway key scoped to `data-analysis-deliverable` (the full flow is in the first how-to guide below). Every call sends it as `Authorization: Bearer <key>`.
2. **Assemble the manifest.** Build one JSON object declaring the evidence the atom checks. In the recorded run the question is `Why did conversion drop?`. Fill every group the Input reference lists — an absent field is not a neutral omission: it is recorded as missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`.
3. **Send it.** `POST https://atoms.pipavia.com/v1/data-analysis-deliverable` with the manifest as the body (or call the MCP tool `data_analysis_deliverable` with the same object as its arguments).
4. **Read the verdict first.** The recorded response returns HTTP 200 with verdict `DELIVERABLE_COMPLETE` — the strongest verdict this atom gives. Its `summary` reads: "40 pass, 0 fail, 0 missing of 40 checks across six sections."
5. **Read the sections, then the checks.** All 6 sections report `pass` (`question_framing`, `data_provenance`, `descriptive_and_diagnostic`, `statistical_care`, `insight_and_action`, `reporting_and_reproducibility`), and all 40 entries in `checks` report `status: pass`, each carrying the `evidence` string that states the requirement it checked.
6. **Read the computed fields.** The record declares segment values whose sum, mean and window-to-window percent change exactly match the stated figures, so all three re-derivations agree with the caller's stated numbers and `computed_status` is `within_stated_limits_on_declared_evidence`. The response's `computed_status` is `within_stated_limits_on_declared_evidence`, and its `stamp` field carries a plain-text rendering of the same verdict for logs and tickets.
7. **Keep the response.** It is the deliverable: one bounded judgment artifact for that one manifest. Same manifest in → same response out (the verification battery confirmed byte-identical repeat REST responses and MCP/REST parity for the full-pass manifest).

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "data-analysis-deliverable"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -X POST https://atoms.pipavia.com/v1/data-analysis-deliverable \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

A well-formed manifest returns HTTP 200 and a verdict body (see Reference — Output format). Authentication and shape failures return the error shapes listed under Reference — Errors, never a verdict.

### Call via MCP

POST to `https://atoms.pipavia.com/mcp/data-analysis-deliverable` with the same `Authorization: Bearer <key>` header and call the tool named `data_analysis_deliverable`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same report core as the REST response (parity was verified in the recorded battery: the full-pass manifest's MCP `structuredContent` was deep-equal to the REST artifact).

### Read a failing verdict and fix the manifest

A failing verdict is still HTTP 200 — it is a result, not a transport error. Work it in this order:

1. **Read `verdict`.** `DELIVERABLE_NOT_COMPLETE` means at least one check failed. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. The passing verdict here is `DELIVERABLE_COMPLETE`.
2. **Read `sections`.** A section reports `fail` if any of its checks failed, `insufficient_evidence` if none failed but at least one is missing, and `pass` only when all of its checks pass. Start with the failing sections.
3. **Read `checks`.** Filter to `status: fail` for breaches and `status: missing` for gaps. Each entry names its `section`, its `check`, and an `evidence` string stating the requirement. `fail` means the field was present but false, invalid, or arithmetically inconsistent; `missing` means the field (or a value a computation needs) was absent.
4. **Fix the underlying facts, then resubmit.** In the recorded violations run the failing checks were exactly: `no_cherry_picked_baselines`, `stated_total_matches_declared_values`, `stated_mean_matches_declared_values`, `stated_percent_change_matches_declared_windows`, `no_causal_claims_from_observational_data_alone` (35 pass, 5 fail, 0 missing of 40 checks across six sections.) In the recorded violations run the stated total, mean and percent change did not match the declared values, cherry-picked baselines were declared used, and causal claims from observational data alone were declared made. Fixing the verdict means correcting the analysis record's facts — restate figures that match the declared values (or correct the declared values), use non-cherry-picked baselines, and withdraw the unsupported causal claim — then resubmit.
5. **Do not confuse a verdict with a 422.** A failing verdict means the manifest was well-typed and was judged. A 422 means the manifest was not well-typed and was never judged — see the next guide.

### Handle a 422 invalid_input

A type violation returns HTTP 422 with a body naming the offending field — it never returns a verdict. The recorded malformed run for this atom sent a value of the wrong type and received:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "figures.stated_total",
  "detail": "figures.stated_total must be a number"
}
```

To handle it: read `field` (`figures.stated_total`) and `detail` ("figures.stated_total must be a number"), correct the value's type in your manifest at exactly that path, and resubmit the whole manifest. Do not drop the field to silence the error — an absent field is missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`. One 422 reports one field; if several fields are mistyped, fix and resubmit iteratively.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/data-analysis-deliverable` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/data-analysis-deliverable` — tool name `data_analysis_deliverable`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` (email; sign-in link emailed), then `POST /v1/keys` with `{"atom": "data-analysis-deliverable"}` after opening the link. A key for one atom never verifies for another: scope is per atom.

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table (which states: all fields are booleans unless noted) and corroborated by `contract.yaml` and the recorded MCP `inputSchema`. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them). An absent field = missing evidence; a present-but-false/invalid field = a failed check, except where a note says otherwise.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `question` | string | (string; carried into the verdict output, not itself checked) |

#### Read by: question_framing

| Field | Type | Notes |
|---|---|---|
| `framing.question_stated` | boolean | — |
| `framing.decision_named` | boolean | — |
| `framing.decision_owner_named` | boolean | — |
| `framing.decision_deadline_stated` | boolean | — |
| `framing.data_that_would_change_decision_stated` | boolean | — |

#### Read by: data_provenance

| Field | Type | Notes |
|---|---|---|
| `data.sources` | array | (list of strings; computed, see below) |
| `data.provenance_documented` | boolean | — |
| `data.coverage_documented` | boolean | — |
| `data.definitions_documented` | boolean | — |
| `data.metrics_have_single_definition` | boolean | — |
| `data.gaps_documented` | boolean | — |
| `data.biases_documented` | boolean | — |

#### Read by: descriptive_and_diagnostic

| Field | Type | Notes |
|---|---|---|
| `analysis.distributions_shown` | boolean | — |
| `analysis.segments_shown` | boolean | — |
| `analysis.trends_on_comparable_windows` | boolean | — |
| `analysis.cherry_picked_baselines_used` | boolean | (must be `false` to pass — skill method step 3) |
| `analysis.decomposition_performed` | boolean | — |
| `analysis.cohort_views_shown` | boolean | — |
| `analysis.mechanisms_triangulated` | boolean | — |
| `figures.values` | array | (list of numbers; computed, see below) |
| `figures.stated_total` | number | (number; computed, see below) |
| `figures.stated_mean` | number | (number; computed, see below) |
| `figures.prior_window_value` | number | (number; computed, see below) |
| `figures.current_window_value` | number | (number; computed, see below) |
| `figures.stated_percent_change` | number | (number; computed, see below) |

#### Read by: statistical_care

| Field | Type | Notes |
|---|---|---|
| `inference.sample_size_or_power_considered` | boolean | — |
| `inference.uncertainty_stated` | boolean | — |
| `inference.practical_vs_statistical_significance_distinguished` | boolean | — |
| `inference.multiple_comparisons_checked` | boolean | — |
| `inference.causal_claims_from_observational_data_alone` | boolean | (must be `false` to pass — skill red line) |

#### Read by: insight_and_action

| Field | Type | Notes |
|---|---|---|
| `recommendation.so_what_stated` | boolean | — |
| `recommendation.recommendation_made` | boolean | — |
| `recommendation.expected_effect_stated` | boolean | — |
| `recommendation.recommendation_owner_named` | boolean | — |
| `recommendation.measurement_plan_stated` | boolean | — |
| `recommendation.uncertainty_stated_plainly` | boolean | — |

#### Read by: reporting_and_reproducibility

| Field | Type | Notes |
|---|---|---|
| `report.covers_question_data_method_finding_recommendation_caveats` | boolean | — |
| `report.is_one_page` | boolean | — |
| `report.caveats_stated` | boolean | — |
| `report.charts_oversell_findings` | boolean | (must be `false` to pass — skill red line) |
| `report.numbers_reproducible` | boolean | — |
| `closure.predicted_vs_actual_compared` | boolean | — |
| `closure.model_of_world_updated` | boolean | — |

Total typed input fields documented: 44 (each SERVICE.md field-table row; nested row-entry fields are listed individually where SERVICE.md lists them).

### Checks

All 40 checks, named exactly as in the recorded full-pass REST response's `checks` array (cross-checked against SERVICE.md; the counts agree). For each check, the Requirement column is the recorded `evidence` string, which states what must hold to pass.

**Per-check status semantics (all checks):** `pass` = the requirement held on the declared evidence; `fail` = the field was present but false/invalid, or a computed comparison did not hold; `missing` = the field, list, or a value a computation needs was absent, so the check could not be evaluated. There is no separate not-applicable status in the recorded responses: where a check is conditional and its gate is not declared, it is recorded as `pass` with evidence stating that no such case was declared (see the notes on the individual conditional checks, where this atom has them).

#### Section: question_framing

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `question_stated` | red line: no analysis without a question — the question is stated | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `decision_named` | method step 1 / quality gate: the decision the analysis feeds is named before analysis | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `decision_owner_named` | method step 1 / quality gate: who decides is named — the decision owner | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `decision_deadline_stated` | method step 1: by when the decision is made is stated | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `data_that_would_change_decision_stated` | method step 1: what data would change the decision is stated | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: data_provenance

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `data_sources_declared` | method step 2: the data sources the analysis uses are declared — a present-but-empty list declares none | Computed. Pass requires `data.sources` to be a present, non-empty list of strings. Absent list is `missing`; a present-but-empty list fails. Entries are validated as strings only, never enum-checked. |
| `provenance_documented` | method step 2 / quality gate: data provenance is documented | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `coverage_documented` | method step 2: data coverage is documented | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `definitions_documented` | method step 2 / quality gate: definitions are documented | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `metrics_have_single_definition` | method step 2: every metric has a single definition — a metric with two definitions is a bug | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `gaps_documented` | method step 2: gaps in the data are documented | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `biases_documented` | method step 2: biases in the data are documented | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: descriptive_and_diagnostic

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `distributions_shown` | method step 3 / quality gate: distributions are shown — distributions before averages | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `segments_shown` | method step 3 / quality gate: segments are shown — segments before totals | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `trends_on_comparable_windows` | method step 3: trends are shown on comparable windows | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_cherry_picked_baselines` | method step 3: no cherry-picked baselines | Pass requires `analysis.cherry_picked_baselines_used` to be declared `false`. Declared `true` fails; absent is `missing`. |
| `decomposition_performed` | method step 4: what moved the metric is decomposed | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `cohort_views_shown` | method step 4: cohort views are shown | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `mechanisms_triangulated` | method step 4: mechanisms are triangulated | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `stated_total_matches_declared_values` | method step 3: the stated total equals the sum of the declared segment values (segments before totals) | Computed re-derivation. Pass requires declared `figures.stated_total` to equal the sum of declared `figures.values` over a non-empty list. Absent values or total is `missing`; a present-but-empty values list fails. |
| `stated_mean_matches_declared_values` | method step 3: the stated mean equals the mean of the declared values (distributions before averages) | Computed re-derivation. Pass requires declared `figures.stated_mean` to equal the mean of the declared `figures.values`. Absence is `missing`. |
| `stated_percent_change_matches_declared_windows` | method step 3: the stated percent change equals (current - prior) / prior * 100 over the declared comparable-window values, with a non-zero prior window | Computed re-derivation. Pass requires declared `figures.stated_percent_change` to equal (current − prior) / prior × 100 over the declared window values, with a non-zero prior window. Absence of any of the three numbers is `missing`. |
#### Section: statistical_care

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `sample_size_or_power_considered` | method step 5: sample size / power is considered when inferring | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `uncertainty_stated` | method step 5 / quality gate: inference claims carry uncertainty — confidence is stated | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `practical_vs_statistical_significance_distinguished` | method step 5: practical vs statistical significance is distinguished | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `multiple_comparisons_checked` | method step 5 / quality gate: multiple-comparison risk is checked | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_causal_claims_from_observational_data_alone` | red line: no causal claims from observational data alone | Pass requires `inference.causal_claims_from_observational_data_alone` to be declared `false` (skill red line). Declared `true` fails; absent is `missing`. |
#### Section: insight_and_action

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `so_what_stated` | method step 6: the so-what is stated — the insight that changes an action | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `recommendation_made` | method step 6: a recommendation is made | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `expected_effect_stated` | method step 6: the recommendation's expected effect is stated | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `recommendation_owner_named` | method step 6 / quality gate: the recommendation has an owner | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `measurement_plan_stated` | method step 6 / quality gate: a measurement plan is stated | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `uncertainty_stated_plainly` | method step 6: uncertainty is stated plainly | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: reporting_and_reproducibility

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `report_covers_required_parts` | method step 7: the report covers question, data, method, finding, recommendation, and caveats | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `report_is_one_page` | method step 7: the report is one page | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `caveats_stated` | method step 7: caveats are stated in the report | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `charts_do_not_oversell` | red line: no charts that oversell | Pass requires `report.charts_oversell_findings` to be declared `false` (skill red line). Declared `true` fails; absent is `missing`. |
| `numbers_reproducible` | method step 7 / quality gate: numbers are reproducible — results reproducible | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `predicted_vs_actual_compared` | method step 8: after the action, predicted vs actual is compared — close the loop | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `model_of_world_updated` | method step 8: the model of the world is updated from the comparison | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |

### Output format

HTTP 200 returns one JSON object. Fields observed in the recorded full-pass response, in recorded order:

| Field | Type (as recorded) | Meaning |
|---|---|---|
| `service` | string | Atom slug. |
| `atom_version` | string | Atom version that produced the verdict. |
| `question` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `verdict` | string | The verdict (see Verdict vocabulary). |
| `sections` | object | Per-section statuses keyed by section name. |
| `checks` | array | Array of `{section, check, status, evidence}` objects — one per check. |
| `computed_status` | string | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when a computed check cannot be completed. |
| `recomputed_total` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `recomputed_mean` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `recomputed_percent_change` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `summary` | string | One-line pass/fail/missing count summary. |
| `stamp` | string | Plain-text rendering of the verdict, sections and summary. |

Computed numeric fields follow the fixed serialization rule stated in SERVICE.md (fixed-decimal strings where SERVICE.md specifies them), shared by both implementations so repeat calls are byte-identical.

### Verdict vocabulary

- **`DELIVERABLE_COMPLETE`** — Every check passes (40 pass, 0 fail, 0 missing of 40 checks across six sections.) The declared evidence is complete and consistent with the bound skill's method, quality gates and red lines.
- **`DELIVERABLE_NOT_COMPLETE`** — At least one check fails. The failing checks name the breached requirement and the evidence against it.
- **`INSUFFICIENT_EVIDENCE`** — Nothing failed, but at least one check is `missing`. The missing checks say exactly what to supply.

- **Section statuses:** `pass` (all checks in the section pass) · `fail` (at least one check in the section fails) · `insufficient_evidence` (no check fails but at least one is missing).
- **Per-check statuses:** `pass` · `fail` · `missing` (see Checks). No other per-check status occurs in the recorded responses; conditional checks that do not apply are recorded as `pass`, as documented above.
- **`computed_status` values:** `within_stated_limits_on_declared_evidence` (every computed check that could be completed held) · `outside_stated_limits_on_declared_evidence` (at least one computed check failed) · `null` (at least one computed check could not be completed).

### Errors

Only the shapes evidenced in the repo/gateway docs are listed; no other error payload is documented, and none should be assumed.

- **401 — unauthenticated:** missing or invalid key (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 401; do not assume one. Fix: send a valid key as `Authorization: Bearer <key>`.
- **403 — scope:** the key lacks this atom's scope (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 403; do not assume one. Fix: issue this atom's scope on your key via `POST /v1/keys`.
- **422 — `invalid_input`:** a field has the wrong type. Recorded body shape (verbatim from the recorded malformed run):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "figures.stated_total",
  "detail": "figures.stated_total must be a number"
}
```

  Here `field` is `figures.stated_total` and `detail` is "figures.stated_total must be a number". A 422 never carries a verdict.
- **429 — rate limit:** the per-key rate limit was exceeded (60/min, 10,000/day per key; USER-GUIDE.md and `contract.yaml`). No error body shape is evidenced in the repo for 429; do not assume one. Fix: slow down and retry within the limits.

### Rate limits + pricing status

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- **Pricing:** unit = deliverable; `pricing.rate` is null (rate_status: pending). **Free during trial — rate pending.** No price is set; per SERVICE.md, prices are set only from measured production cost per unit.

## Explanation

This atom is a deterministic completeness-and-consistency audit of a **declared** data-analysis deliverable record — the question framing, data provenance, descriptive and diagnostic work, statistical care, insight and action, and reporting and reproducibility, as 40 checks across six sections. Three checks are true re-derivations: the stated total must equal the sum of the declared segment values (segments before totals), the stated mean must equal the mean of the same declared values (distributions before averages), and the stated percent change must equal (current − prior) / prior × 100 over the declared comparable-window values with a non-zero prior. A fourth computed check requires the declared data-source list to be present and non-empty. Everything else is a declared-presence check against the skill's method steps, quality gates and red lines.

The verdict is decided mechanically. Each check ends `pass`, `fail`, or `missing`. Any `fail` makes the verdict `DELIVERABLE_NOT_COMPLETE`. Otherwise any `missing` makes it `INSUFFICIENT_EVIDENCE`. Only when all 40 checks pass is the verdict `DELIVERABLE_COMPLETE`. Computed figures are serialized as strings with exactly six decimal places by a fixed round-half-up rule shared by both implementations, which is what makes repeat calls byte-identical.

A complete verdict means the declared record is complete and its three stated figures re-derive from its own declared inputs — it does **not** certify the analysis or its conclusions. The atom runs no analysis, sources or inspects no data, re-derives nothing beyond the three declared figures, and verifies no declared value. It never decides whether the question was the right one, whether a decomposition or cohort view is actually informative, whether an inference is sound, or whether the recommendation is wise. Thresholds the skill does not state are declined, not invented: no minimum sample size or power, no significance or confidence level, no effect-size pass mark, and no accuracy pass mark for the predicted-vs-actual comparison.

**Buyer / use context.** Buyers are teams and agents doing product and operations analysis who need every analysis deliverable held to the same completeness and arithmetic-consistency bar, per use. The house's own product and operations analysis workflow is an internal caller. What is sold is the report — the verdict with per-check evidence and the recomputed figures — never the underlying analytics knowledge itself.

## Role views

### For integrators (Users)

Integrate against the two endpoints above with one scoped key per atom. Treat HTTP 200 as a judged result (read `verdict`, then `sections`, then `checks`), HTTP 422 as a client-side type bug (read `field`/`detail`, fix, resubmit), and 401/403/429 as auth/scope/rate problems respectively. Cache nothing about a verdict across manifests: the verdict is a pure function of the manifest you sent, so re-send after any manifest change. The worked examples below are real recorded request/response pairs — use example 1 as your golden-path fixture and example 3 as your 422-handling fixture.

### For developers

Manifest authoring: declare facts, do not target the verdict — computed checks re-derive totals, coverage and vocabulary membership from the declared values themselves, so inconsistent declarations fail on their own arithmetic. Determinism: the core is deterministic (Python oracle and TypeScript port, parity-proven locally per SERVICE.md); the same manifest returns a byte-identical REST response, and MCP structured content equals the REST report core. Implementation pointers: `src/` holds the atom's core, `tests/` its test suite, `SERVICE.md` is the normative field/check specification, and `contract.yaml` the machine-readable contract (key namespace/prefix, rate limits, pricing status). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract binding rule R1).

### For ops

Endpoints: REST `POST /v1/data-analysis-deliverable` and MCP `POST /mcp/data-analysis-deliverable` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope is per atom — a 403 spike means clients are calling with keys that lack this atom's scope, not an outage. Rate limits: 60/min and 10,000/day per key; watch 429s per key before raising limits. Error monitoring: alert on 5xx (none are part of this atom's documented behavior) and on 422 rate by `field` (a rising 422 rate on one field usually means a client manifest generator changed shape). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing is still pending (free during trial), so metering is for the cost ledger, not billing.

## Worked examples

Provenance: recorded 2026-11-16T02:43:03.804596+00:00 against gateway v1.1.0, external verification lane, source `verification/work/data-analysis-deliverable/evidence.json`. Inputs and REST responses below are reproduced verbatim (pretty-printed with indent 2 only) and were verified mechanically against that evidence file after writing: each fenced block parses to a JSON value identical to the recorded value.

### Example 1 — Full-pass

Recorded expectation: HTTP 200, verdict `DELIVERABLE_COMPLETE`.

Input (recorded `input`):

```json
{
  "question": "Why did conversion drop?",
  "framing": {
    "question_stated": true,
    "decision_named": true,
    "decision_owner_named": true,
    "decision_deadline_stated": true,
    "data_that_would_change_decision_stated": true
  },
  "data": {
    "sources": [
      "db_logs",
      "crm_data"
    ],
    "provenance_documented": true,
    "coverage_documented": true,
    "definitions_documented": true,
    "metrics_have_single_definition": true,
    "gaps_documented": true,
    "biases_documented": true
  },
  "analysis": {
    "distributions_shown": true,
    "segments_shown": true,
    "trends_on_comparable_windows": true,
    "cherry_picked_baselines_used": false,
    "decomposition_performed": true,
    "cohort_views_shown": true,
    "mechanisms_triangulated": true
  },
  "figures": {
    "values": [
      10.0,
      20.0
    ],
    "stated_total": 30.0,
    "stated_mean": 15.0,
    "prior_window_value": 100.0,
    "current_window_value": 110.0,
    "stated_percent_change": 10.0
  },
  "inference": {
    "sample_size_or_power_considered": true,
    "uncertainty_stated": true,
    "practical_vs_statistical_significance_distinguished": true,
    "multiple_comparisons_checked": true,
    "causal_claims_from_observational_data_alone": false
  },
  "recommendation": {
    "so_what_stated": true,
    "recommendation_made": true,
    "expected_effect_stated": true,
    "recommendation_owner_named": true,
    "measurement_plan_stated": true,
    "uncertainty_stated_plainly": true
  },
  "report": {
    "covers_question_data_method_finding_recommendation_caveats": true,
    "is_one_page": true,
    "caveats_stated": true,
    "charts_oversell_findings": false,
    "numbers_reproducible": true
  },
  "closure": {
    "predicted_vs_actual_compared": true,
    "model_of_world_updated": true
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "data-analysis-deliverable",
  "atom_version": "0.1.0",
  "question": "Why did conversion drop?",
  "verdict": "DELIVERABLE_COMPLETE",
  "sections": {
    "question_framing": "pass",
    "data_provenance": "pass",
    "descriptive_and_diagnostic": "pass",
    "statistical_care": "pass",
    "insight_and_action": "pass",
    "reporting_and_reproducibility": "pass"
  },
  "checks": [
    {
      "section": "question_framing",
      "check": "question_stated",
      "status": "pass",
      "evidence": "red line: no analysis without a question — the question is stated"
    },
    {
      "section": "question_framing",
      "check": "decision_named",
      "status": "pass",
      "evidence": "method step 1 / quality gate: the decision the analysis feeds is named before analysis"
    },
    {
      "section": "question_framing",
      "check": "decision_owner_named",
      "status": "pass",
      "evidence": "method step 1 / quality gate: who decides is named — the decision owner"
    },
    {
      "section": "question_framing",
      "check": "decision_deadline_stated",
      "status": "pass",
      "evidence": "method step 1: by when the decision is made is stated"
    },
    {
      "section": "question_framing",
      "check": "data_that_would_change_decision_stated",
      "status": "pass",
      "evidence": "method step 1: what data would change the decision is stated"
    },
    {
      "section": "data_provenance",
      "check": "data_sources_declared",
      "status": "pass",
      "evidence": "method step 2: the data sources the analysis uses are declared — a present-but-empty list declares none"
    },
    {
      "section": "data_provenance",
      "check": "provenance_documented",
      "status": "pass",
      "evidence": "method step 2 / quality gate: data provenance is documented"
    },
    {
      "section": "data_provenance",
      "check": "coverage_documented",
      "status": "pass",
      "evidence": "method step 2: data coverage is documented"
    },
    {
      "section": "data_provenance",
      "check": "definitions_documented",
      "status": "pass",
      "evidence": "method step 2 / quality gate: definitions are documented"
    },
    {
      "section": "data_provenance",
      "check": "metrics_have_single_definition",
      "status": "pass",
      "evidence": "method step 2: every metric has a single definition — a metric with two definitions is a bug"
    },
    {
      "section": "data_provenance",
      "check": "gaps_documented",
      "status": "pass",
      "evidence": "method step 2: gaps in the data are documented"
    },
    {
      "section": "data_provenance",
      "check": "biases_documented",
      "status": "pass",
      "evidence": "method step 2: biases in the data are documented"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "distributions_shown",
      "status": "pass",
      "evidence": "method step 3 / quality gate: distributions are shown — distributions before averages"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "segments_shown",
      "status": "pass",
      "evidence": "method step 3 / quality gate: segments are shown — segments before totals"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "trends_on_comparable_windows",
      "status": "pass",
      "evidence": "method step 3: trends are shown on comparable windows"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "no_cherry_picked_baselines",
      "status": "pass",
      "evidence": "method step 3: no cherry-picked baselines"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "decomposition_performed",
      "status": "pass",
      "evidence": "method step 4: what moved the metric is decomposed"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "cohort_views_shown",
      "status": "pass",
      "evidence": "method step 4: cohort views are shown"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "mechanisms_triangulated",
      "status": "pass",
      "evidence": "method step 4: mechanisms are triangulated"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "stated_total_matches_declared_values",
      "status": "pass",
      "evidence": "method step 3: the stated total equals the sum of the declared segment values (segments before totals)"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "stated_mean_matches_declared_values",
      "status": "pass",
      "evidence": "method step 3: the stated mean equals the mean of the declared values (distributions before averages)"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "stated_percent_change_matches_declared_windows",
      "status": "pass",
      "evidence": "method step 3: the stated percent change equals (current - prior) / prior * 100 over the declared comparable-window values, with a non-zero prior window"
    },
    {
      "section": "statistical_care",
      "check": "sample_size_or_power_considered",
      "status": "pass",
      "evidence": "method step 5: sample size / power is considered when inferring"
    },
    {
      "section": "statistical_care",
      "check": "uncertainty_stated",
      "status": "pass",
      "evidence": "method step 5 / quality gate: inference claims carry uncertainty — confidence is stated"
    },
    {
      "section": "statistical_care",
      "check": "practical_vs_statistical_significance_distinguished",
      "status": "pass",
      "evidence": "method step 5: practical vs statistical significance is distinguished"
    },
    {
      "section": "statistical_care",
      "check": "multiple_comparisons_checked",
      "status": "pass",
      "evidence": "method step 5 / quality gate: multiple-comparison risk is checked"
    },
    {
      "section": "statistical_care",
      "check": "no_causal_claims_from_observational_data_alone",
      "status": "pass",
      "evidence": "red line: no causal claims from observational data alone"
    },
    {
      "section": "insight_and_action",
      "check": "so_what_stated",
      "status": "pass",
      "evidence": "method step 6: the so-what is stated — the insight that changes an action"
    },
    {
      "section": "insight_and_action",
      "check": "recommendation_made",
      "status": "pass",
      "evidence": "method step 6: a recommendation is made"
    },
    {
      "section": "insight_and_action",
      "check": "expected_effect_stated",
      "status": "pass",
      "evidence": "method step 6: the recommendation's expected effect is stated"
    },
    {
      "section": "insight_and_action",
      "check": "recommendation_owner_named",
      "status": "pass",
      "evidence": "method step 6 / quality gate: the recommendation has an owner"
    },
    {
      "section": "insight_and_action",
      "check": "measurement_plan_stated",
      "status": "pass",
      "evidence": "method step 6 / quality gate: a measurement plan is stated"
    },
    {
      "section": "insight_and_action",
      "check": "uncertainty_stated_plainly",
      "status": "pass",
      "evidence": "method step 6: uncertainty is stated plainly"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "report_covers_required_parts",
      "status": "pass",
      "evidence": "method step 7: the report covers question, data, method, finding, recommendation, and caveats"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "report_is_one_page",
      "status": "pass",
      "evidence": "method step 7: the report is one page"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "caveats_stated",
      "status": "pass",
      "evidence": "method step 7: caveats are stated in the report"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "charts_do_not_oversell",
      "status": "pass",
      "evidence": "red line: no charts that oversell"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "numbers_reproducible",
      "status": "pass",
      "evidence": "method step 7 / quality gate: numbers are reproducible — results reproducible"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "predicted_vs_actual_compared",
      "status": "pass",
      "evidence": "method step 8: after the action, predicted vs actual is compared — close the loop"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "model_of_world_updated",
      "status": "pass",
      "evidence": "method step 8: the model of the world is updated from the comparison"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "recomputed_total": "30.000000",
  "recomputed_mean": "15.000000",
  "recomputed_percent_change": "10.000000",
  "summary": "40 pass, 0 fail, 0 missing of 40 checks across six sections.",
  "stamp": "DATA ANALYSIS DELIVERABLE\nquestion: Why did conversion drop?\nVERDICT: DELIVERABLE_COMPLETE\n  question_framing             pass\n  data_provenance              pass\n  descriptive_and_diagnostic   pass\n  statistical_care             pass\n  insight_and_action           pass\n  reporting_and_reproducibility pass\n40 pass, 0 fail, 0 missing of 40 checks across six sections."
}
```

### Example 2 — Violations

Recorded expectation: HTTP 200, verdict `DELIVERABLE_NOT_COMPLETE`.

Input (recorded `input`):

```json
{
  "question": "Test violation",
  "framing": {
    "question_stated": true,
    "decision_named": true,
    "decision_owner_named": true,
    "decision_deadline_stated": true,
    "data_that_would_change_decision_stated": true
  },
  "data": {
    "sources": [
      "db_logs",
      "crm_data"
    ],
    "provenance_documented": true,
    "coverage_documented": true,
    "definitions_documented": true,
    "metrics_have_single_definition": true,
    "gaps_documented": true,
    "biases_documented": true
  },
  "analysis": {
    "distributions_shown": true,
    "segments_shown": true,
    "trends_on_comparable_windows": true,
    "cherry_picked_baselines_used": true,
    "decomposition_performed": true,
    "cohort_views_shown": true,
    "mechanisms_triangulated": true
  },
  "figures": {
    "values": [
      10.0,
      10.0
    ],
    "stated_total": 50.0,
    "stated_mean": 15.0,
    "prior_window_value": 100.0,
    "current_window_value": 110.0,
    "stated_percent_change": 5.0
  },
  "inference": {
    "sample_size_or_power_considered": true,
    "uncertainty_stated": true,
    "practical_vs_statistical_significance_distinguished": true,
    "multiple_comparisons_checked": true,
    "causal_claims_from_observational_data_alone": true
  },
  "recommendation": {
    "so_what_stated": true,
    "recommendation_made": true,
    "expected_effect_stated": true,
    "recommendation_owner_named": true,
    "measurement_plan_stated": true,
    "uncertainty_stated_plainly": true
  },
  "report": {
    "covers_question_data_method_finding_recommendation_caveats": true,
    "is_one_page": true,
    "caveats_stated": true,
    "charts_oversell_findings": false,
    "numbers_reproducible": true
  },
  "closure": {
    "predicted_vs_actual_compared": true,
    "model_of_world_updated": true
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "data-analysis-deliverable",
  "atom_version": "0.1.0",
  "question": "Test violation",
  "verdict": "DELIVERABLE_NOT_COMPLETE",
  "sections": {
    "question_framing": "pass",
    "data_provenance": "pass",
    "descriptive_and_diagnostic": "fail",
    "statistical_care": "fail",
    "insight_and_action": "pass",
    "reporting_and_reproducibility": "pass"
  },
  "checks": [
    {
      "section": "question_framing",
      "check": "question_stated",
      "status": "pass",
      "evidence": "red line: no analysis without a question — the question is stated"
    },
    {
      "section": "question_framing",
      "check": "decision_named",
      "status": "pass",
      "evidence": "method step 1 / quality gate: the decision the analysis feeds is named before analysis"
    },
    {
      "section": "question_framing",
      "check": "decision_owner_named",
      "status": "pass",
      "evidence": "method step 1 / quality gate: who decides is named — the decision owner"
    },
    {
      "section": "question_framing",
      "check": "decision_deadline_stated",
      "status": "pass",
      "evidence": "method step 1: by when the decision is made is stated"
    },
    {
      "section": "question_framing",
      "check": "data_that_would_change_decision_stated",
      "status": "pass",
      "evidence": "method step 1: what data would change the decision is stated"
    },
    {
      "section": "data_provenance",
      "check": "data_sources_declared",
      "status": "pass",
      "evidence": "method step 2: the data sources the analysis uses are declared — a present-but-empty list declares none"
    },
    {
      "section": "data_provenance",
      "check": "provenance_documented",
      "status": "pass",
      "evidence": "method step 2 / quality gate: data provenance is documented"
    },
    {
      "section": "data_provenance",
      "check": "coverage_documented",
      "status": "pass",
      "evidence": "method step 2: data coverage is documented"
    },
    {
      "section": "data_provenance",
      "check": "definitions_documented",
      "status": "pass",
      "evidence": "method step 2 / quality gate: definitions are documented"
    },
    {
      "section": "data_provenance",
      "check": "metrics_have_single_definition",
      "status": "pass",
      "evidence": "method step 2: every metric has a single definition — a metric with two definitions is a bug"
    },
    {
      "section": "data_provenance",
      "check": "gaps_documented",
      "status": "pass",
      "evidence": "method step 2: gaps in the data are documented"
    },
    {
      "section": "data_provenance",
      "check": "biases_documented",
      "status": "pass",
      "evidence": "method step 2: biases in the data are documented"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "distributions_shown",
      "status": "pass",
      "evidence": "method step 3 / quality gate: distributions are shown — distributions before averages"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "segments_shown",
      "status": "pass",
      "evidence": "method step 3 / quality gate: segments are shown — segments before totals"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "trends_on_comparable_windows",
      "status": "pass",
      "evidence": "method step 3: trends are shown on comparable windows"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "no_cherry_picked_baselines",
      "status": "fail",
      "evidence": "method step 3: no cherry-picked baselines"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "decomposition_performed",
      "status": "pass",
      "evidence": "method step 4: what moved the metric is decomposed"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "cohort_views_shown",
      "status": "pass",
      "evidence": "method step 4: cohort views are shown"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "mechanisms_triangulated",
      "status": "pass",
      "evidence": "method step 4: mechanisms are triangulated"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "stated_total_matches_declared_values",
      "status": "fail",
      "evidence": "method step 3: the stated total equals the sum of the declared segment values (segments before totals)"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "stated_mean_matches_declared_values",
      "status": "fail",
      "evidence": "method step 3: the stated mean equals the mean of the declared values (distributions before averages)"
    },
    {
      "section": "descriptive_and_diagnostic",
      "check": "stated_percent_change_matches_declared_windows",
      "status": "fail",
      "evidence": "method step 3: the stated percent change equals (current - prior) / prior * 100 over the declared comparable-window values, with a non-zero prior window"
    },
    {
      "section": "statistical_care",
      "check": "sample_size_or_power_considered",
      "status": "pass",
      "evidence": "method step 5: sample size / power is considered when inferring"
    },
    {
      "section": "statistical_care",
      "check": "uncertainty_stated",
      "status": "pass",
      "evidence": "method step 5 / quality gate: inference claims carry uncertainty — confidence is stated"
    },
    {
      "section": "statistical_care",
      "check": "practical_vs_statistical_significance_distinguished",
      "status": "pass",
      "evidence": "method step 5: practical vs statistical significance is distinguished"
    },
    {
      "section": "statistical_care",
      "check": "multiple_comparisons_checked",
      "status": "pass",
      "evidence": "method step 5 / quality gate: multiple-comparison risk is checked"
    },
    {
      "section": "statistical_care",
      "check": "no_causal_claims_from_observational_data_alone",
      "status": "fail",
      "evidence": "red line: no causal claims from observational data alone"
    },
    {
      "section": "insight_and_action",
      "check": "so_what_stated",
      "status": "pass",
      "evidence": "method step 6: the so-what is stated — the insight that changes an action"
    },
    {
      "section": "insight_and_action",
      "check": "recommendation_made",
      "status": "pass",
      "evidence": "method step 6: a recommendation is made"
    },
    {
      "section": "insight_and_action",
      "check": "expected_effect_stated",
      "status": "pass",
      "evidence": "method step 6: the recommendation's expected effect is stated"
    },
    {
      "section": "insight_and_action",
      "check": "recommendation_owner_named",
      "status": "pass",
      "evidence": "method step 6 / quality gate: the recommendation has an owner"
    },
    {
      "section": "insight_and_action",
      "check": "measurement_plan_stated",
      "status": "pass",
      "evidence": "method step 6 / quality gate: a measurement plan is stated"
    },
    {
      "section": "insight_and_action",
      "check": "uncertainty_stated_plainly",
      "status": "pass",
      "evidence": "method step 6: uncertainty is stated plainly"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "report_covers_required_parts",
      "status": "pass",
      "evidence": "method step 7: the report covers question, data, method, finding, recommendation, and caveats"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "report_is_one_page",
      "status": "pass",
      "evidence": "method step 7: the report is one page"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "caveats_stated",
      "status": "pass",
      "evidence": "method step 7: caveats are stated in the report"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "charts_do_not_oversell",
      "status": "pass",
      "evidence": "red line: no charts that oversell"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "numbers_reproducible",
      "status": "pass",
      "evidence": "method step 7 / quality gate: numbers are reproducible — results reproducible"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "predicted_vs_actual_compared",
      "status": "pass",
      "evidence": "method step 8: after the action, predicted vs actual is compared — close the loop"
    },
    {
      "section": "reporting_and_reproducibility",
      "check": "model_of_world_updated",
      "status": "pass",
      "evidence": "method step 8: the model of the world is updated from the comparison"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "recomputed_total": "20.000000",
  "recomputed_mean": "10.000000",
  "recomputed_percent_change": "10.000000",
  "summary": "35 pass, 5 fail, 0 missing of 40 checks across six sections.",
  "stamp": "DATA ANALYSIS DELIVERABLE\nquestion: Test violation\nVERDICT: DELIVERABLE_NOT_COMPLETE\n  question_framing             pass\n  data_provenance              pass\n  descriptive_and_diagnostic   fail\n  statistical_care             fail\n  insight_and_action           pass\n  reporting_and_reproducibility pass\n35 pass, 5 fail, 0 missing of 40 checks across six sections."
}
```

### Example 3 — Malformed

Recorded expectation: HTTP 422, error `invalid_input` — never a verdict.

Input (recorded `input`):

```json
{
  "question": "Why did conversion drop?",
  "framing": {
    "question_stated": true,
    "decision_named": true,
    "decision_owner_named": true,
    "decision_deadline_stated": true,
    "data_that_would_change_decision_stated": true
  },
  "data": {
    "sources": [
      "db_logs",
      "crm_data"
    ],
    "provenance_documented": true,
    "coverage_documented": true,
    "definitions_documented": true,
    "metrics_have_single_definition": true,
    "gaps_documented": true,
    "biases_documented": true
  },
  "analysis": {
    "distributions_shown": true,
    "segments_shown": true,
    "trends_on_comparable_windows": true,
    "cherry_picked_baselines_used": false,
    "decomposition_performed": true,
    "cohort_views_shown": true,
    "mechanisms_triangulated": true
  },
  "figures": {
    "values": [
      10.0,
      20.0
    ],
    "stated_total": "thirty",
    "stated_mean": 15.0,
    "prior_window_value": 100.0,
    "current_window_value": 110.0,
    "stated_percent_change": 10.0
  },
  "inference": {
    "sample_size_or_power_considered": true,
    "uncertainty_stated": true,
    "practical_vs_statistical_significance_distinguished": true,
    "multiple_comparisons_checked": true,
    "causal_claims_from_observational_data_alone": false
  },
  "recommendation": {
    "so_what_stated": true,
    "recommendation_made": true,
    "expected_effect_stated": true,
    "recommendation_owner_named": true,
    "measurement_plan_stated": true,
    "uncertainty_stated_plainly": true
  },
  "report": {
    "covers_question_data_method_finding_recommendation_caveats": true,
    "is_one_page": true,
    "caveats_stated": true,
    "charts_oversell_findings": false,
    "numbers_reproducible": true
  },
  "closure": {
    "predicted_vs_actual_compared": true,
    "model_of_world_updated": true
  }
}
```

REST response (recorded `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "figures.stated_total",
  "detail": "figures.stated_total must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Output format | CommonMark markdown |
| Role views present | Integrators (Users): Yes · Developers: Yes · Ops: Yes · Regulators: N/A — the verdict is an analysis-deliverable completeness audit; SERVICE.md names no regulation and the verdict is not compliance or audit evidence. |
| Checks named: documented / recorded | 40 / 40 |
| Verdict vocabulary complete | Yes — all 3 verdict values (DELIVERABLE_COMPLETE, DELIVERABLE_NOT_COMPLETE, INSUFFICIENT_EVIDENCE), section statuses, per-check statuses and `computed_status` values listed |
| Input reference typed | Yes — 44 fields, each with a type, grouped as SERVICE.md groups them |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/data-analysis-deliverable/evidence.json` after writing |
