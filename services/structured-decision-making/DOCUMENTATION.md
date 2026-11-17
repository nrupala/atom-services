# Structured decision making — documentation

**Structured decision making** · slug `structured-decision-making` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared structured decision record for completeness and internal consistency only, and recomputes the arithmetic the record itself declares. It surfaces two faces: REST `POST /v1/structured-decision-making` and MCP `POST /mcp/structured-decision-making`. It makes no decision, recommends no option, ranks no option, and predicts nothing — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/structured-decision-making/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment ac6ddba696934ceb84596876507fc08c). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `decision` "Choose cloud provider"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "structured-decision-making"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the structured decision manifest.** You declare a structured decision record for one decision, made from the decision as actually recorded — frame → options → criteria → evaluate → commit → review; the atom audits the declared record, it does not decide anything for you (see Explanation). The recorded full-pass manifest declares the decision `Choose cloud provider`: the framing flags all `true` (decision restated crisp, decide-by date stated, constraints named, out of scope named, stakes assessed, effort budget matched to stakes and reversibility, and slowed deliberation declared), with `framing.classification` `reversible`; three options — `AWS` (kind `action`, score 5.0 on `Cost`, declared weighted total 5.0), `GCP` (kind `status_quo`, 4.0, 4.0) and `Azure` (kind `smaller_reversible_step`, 3.0, 3.0); one criterion `Cost` with weight 1.0, declared defined before scoring; an evaluation declaring method `decision_matrix`, the caller's own score scale 0.0–10.0, probabilities not estimable, expected value not used, scenario thinking used, uncertainty flagged, and base rates considered; a pre-mortem declaring the decision not material, so its other three flags are `false` and pass as not applicable; a log declaring the choice recorded, the chosen option `AWS`, the rationale and assumptions recorded, and the decision communicated with why; a review declaring a review date set, an outcomes-vs-expectations review planned, and luck separated from process; and all four red-line flags `false` (no decision without options, no criteria invented after scores, no irreversible decision rushed, no irreversible decision made in a mood).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/structured-decision-making` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `DECISION_RECORD_SOUND`: "46 pass, 0 fail, 0 missing of 46 checks across eight sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `options_count` is 3, `criteria_count` is 1, `criteria_weights_sum` is `"1.000000"`, the recomputed weighted totals are AWS `"5.000000"` / GCP `"4.000000"` / Azure `"3.000000"`, both duplicate-name lists and both incomplete / mismatch lists are empty (`[]`), `score_coverage_ratio` and `weighted_total_match_ratio` are each `"1.000000"`, and `chosen_option` is `AWS` — reported, never graded against the totals.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `DECISION_RECORD_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "structured-decision-making"}`.
3. Call: `POST https://atoms.pipavia.com/v1/structured-decision-making` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/structured-decision-making` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `structured_decision_making`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `DECISION_RECORD_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 5 checks fail: `structured_every_score_lies_within_the_declared_scale`, `structured_every_declared_weighted_total_recomputes`, `structured_evaluation_uncertainty_is_flagged`, `structured_evaluation_base_rates_are_considered`, and `structured_scenario_thinking_used_when_probabilities_not_estimable`, and the summary reads "41 pass, 5 fail, 0 missing of 46 checks across eight sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, the `AWS` option declares a `Cost` score of 11.0, outside the record's own declared scale of 0.0–10.0, failing `structured_every_score_lies_within_the_declared_scale` — its declared total was set to 11.0 so it still recomputes on its own; the `GCP` option declares `declared_weighted_total` 999.0 against a recomputed `"4.000000"`, failing `structured_every_declared_weighted_total_recomputes`, with `options_with_weighted_total_mismatch` naming `["GCP"]`, the recomputed totals AWS `"11.000000"` / GCP `"4.000000"` / Azure `"3.000000"`, and `weighted_total_match_ratio` `"0.666667"` while `score_coverage_ratio` stays `"1.000000"` and `criteria_weights_sum` stays `"1.000000"`; and `evaluation.uncertainty_flagged`, `evaluation.base_rates_considered` and `evaluation.scenario_thinking_used` are each declared `false` — the last failing because probabilities are declared not estimable, so scenario thinking is the required fitting tool — failing the other three named checks; sections `structured_matrix_scoring` and `structured_evaluation_and_uncertainty` report `fail`, the other six sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). Declare only what is true of the actual record: correct the score (and its declared total) or the scale, set GCP's declared total to its recomputed value, and supply the true evaluation declarations. For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a number where a string is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "decision",
  "detail": "decision must be a string"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/structured-decision-making` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/structured-decision-making` — tool name `structured_decision_making`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `structured_decision_making` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `decision`, `framing.classification`, `options[].name`, `options[].kind`, `options[].scores[].criterion`, `criteria[].name`, `evaluation.method` and `log.chosen_option` are noted as strings, `options[].scores[].score`, `options[].declared_weighted_total`, `criteria[].weight`, `evaluation.score_scale_min` and `evaluation.score_scale_max` as numbers, and `options`, `options[].scores` and `criteria` as lists there. Where SERVICE.md states no type — the section container objects (`framing`, `evaluation`, `premortem`, `log`, `review`, `red_lines`) and the row objects (`options[]`, `criteria[]`, `options[].scores[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the `options` / `criteria` lists, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and those lists `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `DECISION_RECORD_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, as SERVICE.md groups them — with the multi-section rows named where they occur: the `options` and `criteria` rows are also read by `structured_matrix_scoring` (and the option rows by `structured_commit_log_and_review` for the chosen-option check), and `evaluation.score_scale_min` / `evaluation.score_scale_max` sit in the `evaluation` object but are read by `structured_matrix_scoring`, exactly as SERVICE.md's table groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `decision` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: structured_framing

| Field | Type | Notes |
|---|---|---|
| `framing` | object | The framing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `framing.decision_restated_crisp` | boolean | — |
| `framing.decide_by_date_stated` | boolean | — |
| `framing.constraints_named` | boolean | — |
| `framing.out_of_scope_named` | boolean | — |
| `framing.classification` | string | Computed — must be `reversible` or `irreversible` (type stated in SERVICE.md) |
| `framing.stakes_assessed` | boolean | — |
| `framing.effort_budget_matched_to_stakes_and_reversibility` | boolean | — |
| `framing.slowed_deliberation_declared` | boolean | Required when the classification is declared `irreversible`; otherwise the check that reads it passes as not applicable |

#### Read by: structured_options

| Field | Type | Notes |
|---|---|---|
| `options` | list | List of option-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`). Also read by `structured_matrix_scoring` and `structured_commit_log_and_review` |
| `options[]` | object | One declared option row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `options[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `options[].kind` | string | Computed — one of `action`, `status_quo`, `smaller_reversible_step` (type stated in SERVICE.md) |

#### Read by: structured_criteria

| Field | Type | Notes |
|---|---|---|
| `criteria` | list | List of criterion-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`). Also read by `structured_matrix_scoring` |
| `criteria[]` | object | One declared criterion row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `criteria[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `criteria[].weight` | number | Computed — must be non-negative, and the weights must sum positive (type stated in SERVICE.md) |
| `criteria[].defined_before_scoring` | boolean | — |

#### Read by: structured_matrix_scoring

| Field | Type | Notes |
|---|---|---|
| `options[].scores` | list | List of score-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `options[].scores[]` | object | One declared score row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `options[].scores[].criterion` | string | Must name a declared criterion (type stated in SERVICE.md) |
| `options[].scores[].score` | number | Computed — must lie inside the declared scale (type stated in SERVICE.md) |
| `options[].declared_weighted_total` | number | Computed — must recompute from the declared scores × declared weights (type stated in SERVICE.md) |
| `evaluation.score_scale_min` | number | Computed — the caller's declared scale bound; sits in the `evaluation` object but is read by this section, as SERVICE.md groups it (type stated in SERVICE.md) |
| `evaluation.score_scale_max` | number | Computed — the caller's declared scale bound; sits in the `evaluation` object but is read by this section, as SERVICE.md groups it (type stated in SERVICE.md) |

#### Read by: structured_evaluation_and_uncertainty

| Field | Type | Notes |
|---|---|---|
| `evaluation` | object | The evaluation section object — its `score_scale_min` / `score_scale_max` fields are grouped under `structured_matrix_scoring` above, as SERVICE.md groups them. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `evaluation.method` | string | Computed — one of `decision_matrix`, `expected_value`, `decision_tree`, `scenario_thinking` (type stated in SERVICE.md) |
| `evaluation.probabilities_estimable` | boolean | Gates the two fitting-tool checks below |
| `evaluation.expected_value_used` | boolean | Required when probabilities are declared estimable; otherwise the check passes as not applicable |
| `evaluation.scenario_thinking_used` | boolean | Required when probabilities are declared not estimable; otherwise the check passes as not applicable |
| `evaluation.uncertainty_flagged` | boolean | — |
| `evaluation.base_rates_considered` | boolean | — |

#### Read by: structured_pre_mortem

| Field | Type | Notes |
|---|---|---|
| `premortem` | object | The pre-mortem section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `premortem.decision_is_material` | boolean | Gates the three pre-mortem checks below |
| `premortem.conducted` | boolean | Required when the decision is declared material; otherwise the check passes as not applicable |
| `premortem.failure_reasons_named` | boolean | Required when the decision is declared material; otherwise the check passes as not applicable |
| `premortem.top_reasons_fixed_or_hedged` | boolean | Required when the decision is declared material; otherwise the check passes as not applicable |

#### Read by: structured_commit_log_and_review

| Field | Type | Notes |
|---|---|---|
| `log` | object | The commit-log section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `log.choice_recorded` | boolean | — |
| `log.chosen_option` | string | Computed — must name a declared option row; never compared against the recomputed totals (type stated in SERVICE.md) |
| `log.rationale_recorded` | boolean | — |
| `log.assumptions_recorded` | boolean | — |
| `log.communicated_with_why` | boolean | — |
| `review` | object | The review section object — read by this same recorded section, which merges the `log` and `review` input objects. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `review.review_date_set` | boolean | — |
| `review.outcomes_vs_expectations_review_planned` | boolean | — |
| `review.luck_separated_from_process_declared` | boolean | — |

#### Read by: structured_red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.decision_without_options_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.criteria_invented_after_scores_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.irreversible_decision_rushed_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.irreversible_decision_made_in_mood_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 46 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Note on gated checks: the evidence text of a gated check is case-dependent — the full-pass run's text is quoted here; when the gate state differs (an irreversible classification, estimable probabilities, a material decision, or an absent gate), the recorded response carries the corresponding not-applicable or required-form text instead (the sparse run records those variants).

#### Section: structured_framing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `structured_framing_decision_restated_crisp` | frame: the actual decision is restated until it is crisp — what needs deciding is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_framing_decide_by_date_stated` | frame: by when the decision must be made is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_framing_constraints_named` | frame: the constraints on the decision are named | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_framing_out_of_scope_named` | frame: what is out of scope for the decision is named | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_classification_is_reversible_or_irreversible` | classify: the decision is classified reversible or irreversible — speed where reversible, care where not | Computed over the declared record. Pass: `framing.classification` is `reversible` or `irreversible`. Fail: it is any other value. Missing: the field is absent. |
| `structured_framing_stakes_assessed` | classify: the stakes of the decision are assessed — stakes x reversibility sets the effort budget | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_effort_budget_matched_to_stakes_and_reversibility` | classify: the effort spent on the decision is declared matched to its stakes and reversibility | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_slowed_deliberation_when_irreversible` | decision is not classified irreversible — slowed deliberation is not required by the classification | Computed-gated over the declared record. Pass: the classification is `reversible` (the check passes as not applicable), or it is `irreversible` and `framing.slowed_deliberation_declared` is declared `true`. Fail: the classification is `irreversible` and the field is declared `false`. Missing: the classification is absent, or the classification is `irreversible` and the field is absent. |

#### Section: structured_options

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `structured_options_list_declares_at_least_three` | options: the declared record names at least three options — binary choices are usually false binaries; an absent list is missing evidence and a shorter list fails | Computed over the declared record. Pass: the `options` list is present and names at least three rows. Fail: the list is present with fewer than three rows. Missing: the list is absent. |
| `structured_every_option_row_names_the_option` | options: every declared option row names the option (a non-empty name) | Computed over the declared record. Pass: every declared option row declares a non-empty `name`. Fail: a row declares an empty or non-string `name`. Missing: the list is absent, or a row has `name` absent. |
| `structured_option_names_are_unique` | options: no declared option name is owned by more than one row | Computed over the declared record. Pass: no declared option `name` appears on more than one row. Fail: a `name` is declared on more than one row (duplicates are named in `duplicate_option_names`, in the order their second occurrence appears). Missing: the list is absent, or a row has `name` absent. |
| `structured_every_option_kind_is_recognised` | options: every declared option's kind is one of action, status_quo, smaller_reversible_step | Computed over the declared record. Pass: every declared option row's `kind` is one of `action`, `status_quo`, `smaller_reversible_step`. Fail: a row declares any other `kind`. Missing: the list is absent, or a row has `kind` absent. |
| `structured_options_include_a_status_quo_row` | options: the declared rows include a status-quo option ('do nothing / wait') | Computed over the declared record. Pass: at least one declared row has `kind` `status_quo`. Fail: no declared row has that kind. Missing: the list is absent, or a row has `kind` absent. |
| `structured_options_include_a_smaller_reversible_step_row` | options: the declared rows include a smaller reversible step option | Computed over the declared record. Pass: at least one declared row has `kind` `smaller_reversible_step`. Fail: no declared row has that kind. Missing: the list is absent, or a row has `kind` absent. |

#### Section: structured_criteria

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `structured_criteria_list_is_declared` | criteria: the declared record names its criteria — the criteria list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all | Computed over the declared record. Pass: the `criteria` list is present and names at least one criterion. Fail: the list is present but empty. Missing: the list is absent. |
| `structured_every_criterion_row_names_the_criterion` | criteria: every declared criterion row names the criterion (a non-empty name) | Computed over the declared record. Pass: every declared criterion row declares a non-empty `name`. Fail: a row declares an empty or non-string `name`. Missing: the list is absent, or a row has `name` absent. |
| `structured_criterion_names_are_unique` | criteria: no declared criterion name is owned by more than one row | Computed over the declared record. Pass: no declared criterion `name` appears on more than one row. Fail: a `name` is declared on more than one row (duplicates are named in `duplicate_criterion_names`, in the order their second occurrence appears). Missing: the list is absent, or a row has `name` absent. |
| `structured_every_criterion_weight_is_nonnegative` | criteria: every declared criterion declares a non-negative weight | Computed over the declared record. Pass: every declared criterion row declares a numeric `weight` that is non-negative. Fail: a row declares a negative `weight`. Missing: the list is absent, or a row has `weight` absent. |
| `structured_criteria_weights_sum_is_positive` | criteria: the declared criterion weights sum to a positive total — a matrix whose weights sum to zero scores nothing | Computed over the declared record. Pass: the declared criterion weights sum to a positive total (reported as `criteria_weights_sum`). Fail: the weights sum to zero. Missing: the list is absent, or a row has `weight` absent. |
| `structured_every_criterion_defined_before_scoring` | criteria: every declared criterion is declared defined before scoring — criteria first, weights before scores | Computed over the declared record. Pass: every declared criterion row declares `defined_before_scoring` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |

#### Section: structured_matrix_scoring

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `structured_every_option_scores_every_declared_criterion` | matrix: every declared option scores every declared criterion — the score matrix is complete over the record's own declared criteria | Computed over the declared record. Pass: every declared option's score rows cover all declared criterion names. Fail: an option is short of full coverage (incomplete options are named in `options_without_complete_scores`; `score_coverage_ratio` reports complete options ÷ declared options). Missing: the `options` or `criteria` list is absent, or the score structure the check reads is absent or incomplete. |
| `structured_no_option_scores_an_undeclared_criterion` | matrix: no declared option scores a criterion the record does not declare | Computed over the declared record. Pass: no score row names a criterion the record does not declare. Fail: a score row names an undeclared criterion. Missing: the `options` or `criteria` list is absent, or the score structure the check reads is absent or incomplete. |
| `structured_no_option_scores_a_criterion_twice` | matrix: no declared option scores the same criterion on more than one score row | Computed over the declared record. Pass: no option scores the same criterion on more than one score row. Fail: an option scores a criterion twice. Missing: the `options` or `criteria` list is absent, or the score structure the check reads is absent or incomplete. |
| `structured_score_scale_bounds_are_coherent` | matrix: the record's declared score scale bounds are coherent — score_scale_min does not exceed score_scale_max | Computed over the declared record. Pass: `evaluation.score_scale_min` does not exceed `evaluation.score_scale_max`. Fail: the minimum exceeds the maximum. Missing: either bound is absent. |
| `structured_every_score_lies_within_the_declared_scale` | matrix: every declared score lies within the score scale the record itself declares | Computed over the declared record. Pass: every declared `score` lies between the record's declared scale bounds, inclusive. Fail: a score lies outside the declared scale. Missing: the `options` list, a scale bound, or a row's `score` field is absent. |
| `structured_every_declared_weighted_total_recomputes` | matrix: every declared option's declared weighted total recomputes exactly as sum(declared criterion weight x declared score) over the declared criteria (6dp serialization) | Computed over the declared record. Pass: every option's `declared_weighted_total` recomputes as Σ (declared criterion weight × declared score) over the declared criteria, compared on the fixed 6dp serialization. Fail: an option complete enough to verify declares a total that differs (offending options are named in `options_with_weighted_total_mismatch`; `weighted_total_match_ratio` reports recomputing options ÷ declared options). Missing: the rows, scores, weights or declared totals the check reads are absent or incomplete. |

#### Section: structured_evaluation_and_uncertainty

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `structured_evaluation_method_is_recognised` | evaluation: the declared evaluation method is one of decision_matrix, expected_value, decision_tree, scenario_thinking — a fitting tool for the decision | Computed over the declared record. Pass: `evaluation.method` is one of `decision_matrix`, `expected_value`, `decision_tree`, `scenario_thinking`. Fail: it is any other value. Missing: the field is absent. |
| `structured_evaluation_uncertainty_is_flagged` | evaluation: the uncertainty in the evaluation is flagged | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_evaluation_base_rates_are_considered` | evaluation: base-rate / reference information is declared considered before the inside view of this decision (its arithmetic, if any, is the base-rate-card atom's ground, not this record's) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_expected_value_used_when_probabilities_estimable` | probabilities are not declared estimable — expected-value evaluation is not required | Computed-gated over the declared record. Pass: `evaluation.probabilities_estimable` is declared `false` (the check passes as not applicable), or it is declared `true` and `evaluation.expected_value_used` is declared `true`. Fail: probabilities are declared estimable and `expected_value_used` is declared `false`. Missing: the gate field is absent, or probabilities are declared estimable and the field is absent. |
| `structured_scenario_thinking_used_when_probabilities_not_estimable` | evaluation: when probabilities are declared not estimable, scenario thinking is declared used | Computed-gated over the declared record. Pass: `evaluation.probabilities_estimable` is declared `true` (the check passes as not applicable), or it is declared `false` and `evaluation.scenario_thinking_used` is declared `true`. Fail: probabilities are declared not estimable and `scenario_thinking_used` is declared `false`. Missing: the gate field is absent, or probabilities are declared not estimable and the field is absent. |

#### Section: structured_pre_mortem

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `structured_premortem_conducted_when_decision_is_material` | decision is not declared material — a pre-mortem is not required by the quality gate | Computed-gated over the declared record. Pass: `premortem.decision_is_material` is declared `false` (the check passes as not applicable), or it is declared `true` and `premortem.conducted` is declared `true`. Fail: the decision is declared material and `conducted` is declared `false`. Missing: the gate field is absent, or the decision is declared material and the field is absent. |
| `structured_premortem_failure_reasons_named_when_material` | decision is not declared material — pre-mortem failure reasons are not required | Computed-gated over the declared record. Pass: `premortem.decision_is_material` is declared `false` (the check passes as not applicable), or it is declared `true` and `premortem.failure_reasons_named` is declared `true`. Fail: the decision is declared material and the field is declared `false`. Missing: the gate field is absent, or the decision is declared material and the field is absent. |
| `structured_premortem_top_reasons_fixed_or_hedged_when_material` | decision is not declared material — pre-mortem hedging is not required | Computed-gated over the declared record. Pass: `premortem.decision_is_material` is declared `false` (the check passes as not applicable), or it is declared `true` and `premortem.top_reasons_fixed_or_hedged` is declared `true`. Fail: the decision is declared material and the field is declared `false`. Missing: the gate field is absent, or the decision is declared material and the field is absent. |

#### Section: structured_commit_log_and_review

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `structured_log_choice_is_recorded` | commit: the choice is recorded in the decision log | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_logged_chosen_option_matches_a_declared_option` | commit: the logged chosen option names a declared option row — the log commits to an option the record actually evaluated (which option is chosen is the caller's decision; this atom never checks it against the recomputed totals) | Computed over the declared record. Pass: `log.chosen_option` equals the `name` of a declared option row — it is never compared against the recomputed totals. Fail: the chosen option names no declared option. Missing: the chosen option is absent, or the `options` list is absent. |
| `structured_log_rationale_is_recorded` | commit: the rationale for the choice is recorded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_log_assumptions_are_recorded` | commit: the assumptions behind the choice are recorded in the log | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_log_decision_communicated_with_why` | commit: the decision is declared communicated with the 'why' | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_review_date_is_set` | review: a review date is set — review on schedule | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_review_compares_outcomes_to_expectations` | review: the review is declared to compare outcomes against the expectations recorded at commit time | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_review_separates_luck_from_process` | review: the review is declared to separate luck from process and update the record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: structured_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `structured_record_free_of_decision_without_options` | red line: no decision without options is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `structured_record_free_of_criteria_invented_after_scores` | red line: no criteria invented after scores are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `structured_record_free_of_irreversible_decision_rushed` | red line: no irreversible decision made in a rush is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `structured_record_free_of_irreversible_decision_in_a_mood` | red line: no irreversible decision made in a mood is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object, with these top-level fields in the recorded order:

- `service` (`"structured-decision-making"`), `atom_version` (`"0.1.0"`), and `decision` (the manifest's declared decision value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `options_count` and `criteria_count` (the declared list lengths as integers, or null when the list is not declared); `duplicate_option_names` and `duplicate_criterion_names` (names declared on more than one row, in the order their second occurrence appears; each null when the underlying list is not declared, as recorded in the sparse case); `criteria_weights_sum` (the declared criterion weights summed — a string with exactly six decimal places; null when the criteria list is not declared, is empty, or a row's weight is absent, as recorded in the sparse case — SERVICE.md states no null rule for this field, see Discrepancies); `recomputed_weighted_totals` (a list of `{option, recomputed_weighted_total}` entries, one per declared option, each total a string with exactly six decimal places or null for an option whose scores or the weights are incomplete; the whole field is null when the `options` or `criteria` list is not declared, as recorded in the sparse case); `options_with_weighted_total_mismatch` (options complete enough to verify whose declared total differs from the recomputed total; null when the `options` or `criteria` list is not declared, as recorded in the sparse case) and `options_without_complete_scores` (options whose score rows do not cover exactly the declared criteria; null on the same condition, as recorded in the sparse case); the ratios `score_coverage_ratio` (complete options ÷ declared options) and `weighted_total_match_ratio` (recomputing options ÷ declared options) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty, or when the criteria / weights it needs are incomplete; and `chosen_option` (the declared logged choice string, or null when it is not declared). Computed quantities use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; weighted-total comparisons are made on the same 6dp serializations — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "46 pass, 0 fail, 0 missing of 46 checks across eight sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared decision value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `DECISION_RECORD_SOUND` — all 46 checks pass: the declared structured decision record is complete and consistent with the bound skill's method, quality gates and red lines.
- `DECISION_RECORD_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only — the fourteen computed checks named in SERVICE.md): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the fourteen computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for a gated check, including passes as not applicable when its gate is off); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `options_count`, `criteria_count`, `duplicate_option_names`, `duplicate_criterion_names`, `criteria_weights_sum`, `recomputed_weighted_totals`, `options_with_weighted_total_mismatch`, `options_without_complete_scores`, `score_coverage_ratio`, `weighted_total_match_ratio` and `chosen_option` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"decision","detail":"decision must be a string"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Decide deliberately — reversible vs irreversible, options, criteria, expected value, pre-mortems, decision logs (the bound capability, from the skill). Its method is this atom's record structure: frame → options → criteria → evaluate → commit → review; speed where reversible, care where not. You submit one declared record — the structured decision manifest, made from the decision as actually recorded — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, and recomputes the arithmetic the record itself declares, returning one deterministic verdict across 8 sections (`structured_framing`, `structured_options`, `structured_criteria`, `structured_matrix_scoring`, `structured_evaluation_and_uncertainty`, `structured_pre_mortem`, `structured_commit_log_and_review`, `structured_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest siblings `decision-process-design`, `decision-trap-sweep`, `base-rate-card` and `assumption-audit` (SERVICE.md, Distinct ground): every check here is a question about the single decision record's row structure and declared arithmetic — process engineering, trap attestations, a single claim's base rate, and assumption attestations are those atoms' ground, not this one's.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (fourteen, per SERVICE.md) are calculated from the declared rows and values themselves — the classification must be recognised, slowed deliberation is gated on irreversibility, the options list must name at least three rows with unique names, recognised kinds, a status-quo row and a smaller-reversible-step row, the criteria list must be declared with unique names and non-negative weights summing positive, the score matrix must be complete over exactly the declared criteria with coherent declared scale bounds and every score inside them, every declared weighted total must recompute exactly from declared scores × declared weights, and the logged chosen option must name a declared option row — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *Gated checks* follow the skill's own scoping: the fitting-tool checks are gated on the caller's `probabilities_estimable` declaration, and the three pre-mortem checks are gated on the decision being declared material; with the gate off, a gated check passes as not applicable. Aggregation is strict: any `fail` anywhere produces `DECISION_RECORD_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `DECISION_RECORD_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold beyond "at least three" options — so no numeric threshold check is invented beyond the skill's own count and the internal consistency of the declared rows. Declined, named, exactly as SERVICE.md names them: a criterion weight-sum target (1.0, 100, or any other — weights are checked non-negative and positive in total, never against a target sum); a score scale of the atom's own (no 0–5, 0–10 or 1–100 scale is imposed — only the record's declared bounds bind its scores); a minimum winning margin or a rule that the chosen option must hold the highest (or any rank of) recomputed total — **declined by design: picking the winner from the totals would be a recommendation, and this atom recommends nothing; a non-highest-total logged choice passes by design, because the logged-choice check never compares the choice against the recomputed totals**; a stakes level or numeric stakes × reversibility effort formula (stakes and the effort match are caller declarations); a probability, expected-value or scenario-quality bar (the fitting tool's use is declared and gated on the caller's estimability declaration; no expected value is computed, because the record declares no probabilities); a base-rate value or reference-class bar (base rates are declared considered; sourcing and recomputing a base rate is the `base-rate-card` atom's ground); a pre-mortem risk count or severity bar; a review interval in days (a review date is declared set, its distance is the caller's); any judgment that the declared criteria, weights or scores are the right ones for this decision (only that they are declared, ordered before scoring, complete and internally consistent is checked). Quantities are computed and reported; the only bars on the computed rows are exact recomputation, the caller's own declared scale, and completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** decision record: a verdict of `DECISION_RECORD_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its criteria defined before scoring, its pre-mortem conducted and every weighted total recomputing passes those checks even if the real decision did none of it. It is a completeness and consistency audit of the decision record the skill requires, **not a decision service, a recommendation engine, or a decision-quality certification**. Specifically: **the atom makes no decision, recommends no option as the answer, ranks no option for the caller, and predicts nothing** — it decides nothing for the caller. It generates no options or criteria, assigns no weights or scores, runs no expected-value, decision-tree or scenario analysis, performs no pre-mortem, and does not verify that any declared step (criteria defined before scoring, a pre-mortem conducted, deliberation slowed, a decision communicated) ever actually happened. It never judges whether the decision is the right one, whether the named options are the genuinely real ones, whether the criteria and weights are the right ones, whether the scores are fair, or whether the logged choice is wise — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows and totals are internally consistent. Named exclusions: decide-for-me and recommendation-shaped steps are excluded by name (generating options, setting criteria or weights, scoring options, computing an expected value or a decision tree, running scenario analysis, picking or recommending the winning option, and conducting the pre-mortem for the caller are not performed in any form); no probability or expected-value computation (the record declares no probabilities, and none are invented); no verification that criteria were actually defined before scoring (timing is attested, never timestamp-verified); no judgment of framing quality, stakes level, or whether the effort truly matched them; no live verification of any declared fact; no review of the decision's actual outcome (the review is checked as a declared plan with a date, never performed).

**Buyer and use context.** Teams and agents working in Thinking & decisions who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Technical and project decisions (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was deployed census-style under a U-13 regulatory screen classified **(b) — screen-NO with flag-with-controls (census class)**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: this atom is decision/finance-adjacent by keyword — the bound skill names financial choices among the decisions its method fits, its criteria examples include cost and risk, and a decision record could be about a financial, health or legal choice — so the screen was applied strictly, and the atom is flagged for the owner's per-unit ruling queue under U-13 on that adjacency. What prevents an advice reading, as named controls, exactly as SERVICE.md records them: (1) the atom audits a caller-declared decision record for structure and internal consistency only — framing / classification declarations, option and criterion row completeness, score-matrix completeness, and exact recomputation of the caller's own declared weighted totals; every output is a pass / fail / missing verdict on the record, a count, a ratio, or a total recomputed from the caller's own declared scores and weights; (2) it gives no advice, no recommendation and no domain guidance of any kind — it never says which option to choose, never ranks options, never checks the logged choice against the recomputed totals, and takes no position on any financial, health, legal or other domain question the record may be about; the skill's performative steps (deciding, evaluating *for* the caller, recommending) are excluded from production and named as exclusions — this atom performs none of them, it only audits a declared record of them; (3) it sets no threshold — no return, risk, score, margin or quality bar against which a caller's decision could be graded as good or bad (the only scale that binds scores is the record's own declared scale); (4) the record's subject is whatever decision the caller declares — the atom reads no domain content beyond row names the caller supplies, and no output is addressed to a domain decision. Residual risk, stated plainly as SERVICE.md states it: a caller could paste the verdict, or the recomputed totals, into their own decision work — that is their decision, made on their record; the artifact itself recommends nothing and decides nothing. SERVICE.md records this as the same class as the quant-math-derivation-sanity-check precedent (declared-record audit, advice-shaped skill steps excluded as controls); it is not the genuinely-open personal-financial-snapshot class, because no personal financial position is handled and no advice-shaped step of the skill is performed. The flag stays open for the Director's review: the screen-NO classification and its controls stand as recorded, and the census flag is not closed by this document.

### For integrators (Users)

You need: a gateway key with the `structured_decision_making` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed quantities are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, and weighted-total comparisons are made on the same 6dp serializations, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/structured_decision_making.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_structured_decision_making.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/structured-decision-making` (REST) and `POST /mcp/structured-decision-making` (MCP, tool `structured_decision_making`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22). Key scope: `structured_decision_making`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c) shows the atom live. This document follows the evidenced live state: live. The same staleness touches SERVICE.md's U-13 section, which records that “no deploy happens on this atom without the owner's explicit per-unit ruling after the screen” — the recorded deployment exists; the U-13 flag itself stays open for the Director's review (see Role views, For regulators) and is not closed by this document.
2. **Check names differ from input field names:** all 46 recorded check names differ from the leaf name of the input field they read — every recorded name carries the `structured_` prefix and most are descriptive sentences in snake case rather than field names. The plain attestation checks are the closest (for example `structured_framing_decision_restated_crisp` reads `framing.decision_restated_crisp`; `structured_log_choice_is_recorded` reads `log.choice_recorded`; `structured_review_compares_outcomes_to_expectations` reads `review.outcomes_vs_expectations_review_planned`). The fourteen computed checks and the gated checks have no single same-named field at all: for example `structured_classification_is_reversible_or_irreversible` (field `framing.classification`), `structured_slowed_deliberation_when_irreversible` (fields `framing.classification` + `framing.slowed_deliberation_declared`), `structured_options_list_declares_at_least_three` (the `options` list), `structured_every_declared_weighted_total_recomputes` (the options' `declared_weighted_total` values against recomputation), `structured_logged_chosen_option_matches_a_declared_option` (field `log.chosen_option` against the option rows), and the four red-line checks (`structured_record_free_of_decision_without_options` and its siblings read the `red_lines.*_present` fields). Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`framing`, `evaluation`, `premortem`, `log`, `review`, `red_lines`) or for a row object (`options[]`, `criteria[]`, `options[].scores[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the `options` / `criteria` lists, in the recorded MCP `inputSchema`, and are said so there. The recorded MCP `inputSchema` itself lists only the nine top-level properties (`decision`, `framing`, `options`, `criteria`, `evaluation`, `premortem`, `log`, `review`, `red_lines`) — the nested row and leaf types rest on the recorded evidence inputs and SERVICE.md's table, not on the schema.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts, and its sparse-case row names only some of the null computed fields — the recorded sparse response returns every computed field null). The recorded REST response carries all 46 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, `options_count`, `criteria_count`, `duplicate_option_names`, `duplicate_criterion_names` and `chosen_option`, and its computed-check prose states the per-option null inside `recomputed_weighted_totals`, but it does not state a null rule for `criteria_weights_sum`, for the `recomputed_weighted_totals` field as a whole, or for `options_with_weighted_total_mismatch` and `options_without_complete_scores`. The recorded sparse response returns all of those as `null` when the underlying lists are not declared (as the Output format section records); this document follows the recording.
6. **Section groupings merging and splitting input objects:** the recorded sections do not map one-to-one onto input objects. `structured_commit_log_and_review` merges two separate input objects, `log` and `review`. `structured_matrix_scoring` merges rows from three places — the `options` rows, the `criteria` rows, and the `evaluation` object's scale bounds (`evaluation.score_scale_min` / `evaluation.score_scale_max` are grouped by SERVICE.md under this section, not under `structured_evaluation_and_uncertainty`, which reads the rest of the `evaluation` object) — so one input object, `evaluation`, is split across two recorded sections, and the single `options` list is read by three recorded sections (`structured_options`, `structured_matrix_scoring`, `structured_commit_log_and_review`). This document groups the Input reference and the Checks by the recorded section names, with those mergings and splittings named in place.
7. **Gated-check evidence text is case-dependent:** the evidence text quoted in the Checks section is the full-pass run's text. For gated checks the recorded text changes with the gate state — in the sparse run, for example, `structured_scenario_thinking_used_when_probabilities_not_estimable` carries the text “probabilities are not declared non-estimable — scenario thinking is not the required fitting tool” instead of its full-pass text, and the pre-mortem and slowed-deliberation checks likewise carry their not-applicable forms. No single evidence string per check exists in the recordings; the Checks section says so at its head.
8. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (7 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named prose phrases `Every score within the declared scale` and `Every declared weighted total recomputes` instead of exact check names (R1 ×2); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); the designed violations input was missing the `premortem` key paths present in the full-pass manifest (R3 ×1); the designed malformed input carried 2 type violations (`decision` and `framing`) instead of exactly one (R4 ×1); and the oracle pre-check found the raw full-pass design returned `DECISION_RECORD_NOT_SOUND` (44 pass, 1 fail, 1 missing) — it set `evaluation.uncertainty_flagged` = `false` and placed `declared_weighted_total` at the top level instead of per-option (oracle-pre-check ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T12:26:55.725779+00:00 against gateway v1.1.0, external verification battery Wave 15, source `verification/work/structured-decision-making/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T12:26:55.725779+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/structured-decision-making/evidence.json`.

Input:

```json
{
  "decision": "Choose cloud provider",
  "framing": {
    "decision_restated_crisp": true,
    "decide_by_date_stated": true,
    "constraints_named": true,
    "out_of_scope_named": true,
    "classification": "reversible",
    "stakes_assessed": true,
    "effort_budget_matched_to_stakes_and_reversibility": true,
    "slowed_deliberation_declared": true
  },
  "options": [
    {
      "name": "AWS",
      "kind": "action",
      "scores": [
        {
          "criterion": "Cost",
          "score": 5.0
        }
      ],
      "declared_weighted_total": 5.0
    },
    {
      "name": "GCP",
      "kind": "status_quo",
      "scores": [
        {
          "criterion": "Cost",
          "score": 4.0
        }
      ],
      "declared_weighted_total": 4.0
    },
    {
      "name": "Azure",
      "kind": "smaller_reversible_step",
      "scores": [
        {
          "criterion": "Cost",
          "score": 3.0
        }
      ],
      "declared_weighted_total": 3.0
    }
  ],
  "criteria": [
    {
      "name": "Cost",
      "weight": 1.0,
      "defined_before_scoring": true
    }
  ],
  "evaluation": {
    "method": "decision_matrix",
    "score_scale_min": 0.0,
    "score_scale_max": 10.0,
    "probabilities_estimable": false,
    "expected_value_used": false,
    "scenario_thinking_used": true,
    "uncertainty_flagged": true,
    "base_rates_considered": true
  },
  "premortem": {
    "decision_is_material": false,
    "conducted": false,
    "failure_reasons_named": false,
    "top_reasons_fixed_or_hedged": false
  },
  "log": {
    "choice_recorded": true,
    "chosen_option": "AWS",
    "rationale_recorded": true,
    "assumptions_recorded": true,
    "communicated_with_why": true
  },
  "review": {
    "review_date_set": true,
    "outcomes_vs_expectations_review_planned": true,
    "luck_separated_from_process_declared": true
  },
  "red_lines": {
    "decision_without_options_present": false,
    "criteria_invented_after_scores_present": false,
    "irreversible_decision_rushed_present": false,
    "irreversible_decision_made_in_mood_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "structured-decision-making",
  "atom_version": "0.1.0",
  "decision": "Choose cloud provider",
  "verdict": "DECISION_RECORD_SOUND",
  "sections": {
    "structured_framing": "pass",
    "structured_options": "pass",
    "structured_criteria": "pass",
    "structured_matrix_scoring": "pass",
    "structured_evaluation_and_uncertainty": "pass",
    "structured_pre_mortem": "pass",
    "structured_commit_log_and_review": "pass",
    "structured_red_lines": "pass"
  },
  "checks": [
    {
      "section": "structured_framing",
      "check": "structured_framing_decision_restated_crisp",
      "status": "pass",
      "evidence": "frame: the actual decision is restated until it is crisp \u2014 what needs deciding is stated"
    },
    {
      "section": "structured_framing",
      "check": "structured_framing_decide_by_date_stated",
      "status": "pass",
      "evidence": "frame: by when the decision must be made is stated"
    },
    {
      "section": "structured_framing",
      "check": "structured_framing_constraints_named",
      "status": "pass",
      "evidence": "frame: the constraints on the decision are named"
    },
    {
      "section": "structured_framing",
      "check": "structured_framing_out_of_scope_named",
      "status": "pass",
      "evidence": "frame: what is out of scope for the decision is named"
    },
    {
      "section": "structured_framing",
      "check": "structured_classification_is_reversible_or_irreversible",
      "status": "pass",
      "evidence": "classify: the decision is classified reversible or irreversible \u2014 speed where reversible, care where not"
    },
    {
      "section": "structured_framing",
      "check": "structured_framing_stakes_assessed",
      "status": "pass",
      "evidence": "classify: the stakes of the decision are assessed \u2014 stakes x reversibility sets the effort budget"
    },
    {
      "section": "structured_framing",
      "check": "structured_effort_budget_matched_to_stakes_and_reversibility",
      "status": "pass",
      "evidence": "classify: the effort spent on the decision is declared matched to its stakes and reversibility"
    },
    {
      "section": "structured_framing",
      "check": "structured_slowed_deliberation_when_irreversible",
      "status": "pass",
      "evidence": "decision is not classified irreversible \u2014 slowed deliberation is not required by the classification"
    },
    {
      "section": "structured_options",
      "check": "structured_options_list_declares_at_least_three",
      "status": "pass",
      "evidence": "options: the declared record names at least three options \u2014 binary choices are usually false binaries; an absent list is missing evidence and a shorter list fails"
    },
    {
      "section": "structured_options",
      "check": "structured_every_option_row_names_the_option",
      "status": "pass",
      "evidence": "options: every declared option row names the option (a non-empty name)"
    },
    {
      "section": "structured_options",
      "check": "structured_option_names_are_unique",
      "status": "pass",
      "evidence": "options: no declared option name is owned by more than one row"
    },
    {
      "section": "structured_options",
      "check": "structured_every_option_kind_is_recognised",
      "status": "pass",
      "evidence": "options: every declared option's kind is one of action, status_quo, smaller_reversible_step"
    },
    {
      "section": "structured_options",
      "check": "structured_options_include_a_status_quo_row",
      "status": "pass",
      "evidence": "options: the declared rows include a status-quo option ('do nothing / wait')"
    },
    {
      "section": "structured_options",
      "check": "structured_options_include_a_smaller_reversible_step_row",
      "status": "pass",
      "evidence": "options: the declared rows include a smaller reversible step option"
    },
    {
      "section": "structured_criteria",
      "check": "structured_criteria_list_is_declared",
      "status": "pass",
      "evidence": "criteria: the declared record names its criteria \u2014 the criteria list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all"
    },
    {
      "section": "structured_criteria",
      "check": "structured_every_criterion_row_names_the_criterion",
      "status": "pass",
      "evidence": "criteria: every declared criterion row names the criterion (a non-empty name)"
    },
    {
      "section": "structured_criteria",
      "check": "structured_criterion_names_are_unique",
      "status": "pass",
      "evidence": "criteria: no declared criterion name is owned by more than one row"
    },
    {
      "section": "structured_criteria",
      "check": "structured_every_criterion_weight_is_nonnegative",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-negative weight"
    },
    {
      "section": "structured_criteria",
      "check": "structured_criteria_weights_sum_is_positive",
      "status": "pass",
      "evidence": "criteria: the declared criterion weights sum to a positive total \u2014 a matrix whose weights sum to zero scores nothing"
    },
    {
      "section": "structured_criteria",
      "check": "structured_every_criterion_defined_before_scoring",
      "status": "pass",
      "evidence": "criteria: every declared criterion is declared defined before scoring \u2014 criteria first, weights before scores"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_every_option_scores_every_declared_criterion",
      "status": "pass",
      "evidence": "matrix: every declared option scores every declared criterion \u2014 the score matrix is complete over the record's own declared criteria"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_no_option_scores_an_undeclared_criterion",
      "status": "pass",
      "evidence": "matrix: no declared option scores a criterion the record does not declare"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_no_option_scores_a_criterion_twice",
      "status": "pass",
      "evidence": "matrix: no declared option scores the same criterion on more than one score row"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_score_scale_bounds_are_coherent",
      "status": "pass",
      "evidence": "matrix: the record's declared score scale bounds are coherent \u2014 score_scale_min does not exceed score_scale_max"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_every_score_lies_within_the_declared_scale",
      "status": "pass",
      "evidence": "matrix: every declared score lies within the score scale the record itself declares"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_every_declared_weighted_total_recomputes",
      "status": "pass",
      "evidence": "matrix: every declared option's declared weighted total recomputes exactly as sum(declared criterion weight x declared score) over the declared criteria (6dp serialization)"
    },
    {
      "section": "structured_evaluation_and_uncertainty",
      "check": "structured_evaluation_method_is_recognised",
      "status": "pass",
      "evidence": "evaluation: the declared evaluation method is one of decision_matrix, expected_value, decision_tree, scenario_thinking \u2014 a fitting tool for the decision"
    },
    {
      "section": "structured_evaluation_and_uncertainty",
      "check": "structured_evaluation_uncertainty_is_flagged",
      "status": "pass",
      "evidence": "evaluation: the uncertainty in the evaluation is flagged"
    },
    {
      "section": "structured_evaluation_and_uncertainty",
      "check": "structured_evaluation_base_rates_are_considered",
      "status": "pass",
      "evidence": "evaluation: base-rate / reference information is declared considered before the inside view of this decision (its arithmetic, if any, is the base-rate-card atom's ground, not this record's)"
    },
    {
      "section": "structured_evaluation_and_uncertainty",
      "check": "structured_expected_value_used_when_probabilities_estimable",
      "status": "pass",
      "evidence": "probabilities are not declared estimable \u2014 expected-value evaluation is not required"
    },
    {
      "section": "structured_evaluation_and_uncertainty",
      "check": "structured_scenario_thinking_used_when_probabilities_not_estimable",
      "status": "pass",
      "evidence": "evaluation: when probabilities are declared not estimable, scenario thinking is declared used"
    },
    {
      "section": "structured_pre_mortem",
      "check": "structured_premortem_conducted_when_decision_is_material",
      "status": "pass",
      "evidence": "decision is not declared material \u2014 a pre-mortem is not required by the quality gate"
    },
    {
      "section": "structured_pre_mortem",
      "check": "structured_premortem_failure_reasons_named_when_material",
      "status": "pass",
      "evidence": "decision is not declared material \u2014 pre-mortem failure reasons are not required"
    },
    {
      "section": "structured_pre_mortem",
      "check": "structured_premortem_top_reasons_fixed_or_hedged_when_material",
      "status": "pass",
      "evidence": "decision is not declared material \u2014 pre-mortem hedging is not required"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_log_choice_is_recorded",
      "status": "pass",
      "evidence": "commit: the choice is recorded in the decision log"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_logged_chosen_option_matches_a_declared_option",
      "status": "pass",
      "evidence": "commit: the logged chosen option names a declared option row \u2014 the log commits to an option the record actually evaluated (which option is chosen is the caller's decision; this atom never checks it against the recomputed totals)"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_log_rationale_is_recorded",
      "status": "pass",
      "evidence": "commit: the rationale for the choice is recorded"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_log_assumptions_are_recorded",
      "status": "pass",
      "evidence": "commit: the assumptions behind the choice are recorded in the log"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_log_decision_communicated_with_why",
      "status": "pass",
      "evidence": "commit: the decision is declared communicated with the 'why'"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_review_date_is_set",
      "status": "pass",
      "evidence": "review: a review date is set \u2014 review on schedule"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_review_compares_outcomes_to_expectations",
      "status": "pass",
      "evidence": "review: the review is declared to compare outcomes against the expectations recorded at commit time"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_review_separates_luck_from_process",
      "status": "pass",
      "evidence": "review: the review is declared to separate luck from process and update the record"
    },
    {
      "section": "structured_red_lines",
      "check": "structured_record_free_of_decision_without_options",
      "status": "pass",
      "evidence": "red line: no decision without options is present in the record"
    },
    {
      "section": "structured_red_lines",
      "check": "structured_record_free_of_criteria_invented_after_scores",
      "status": "pass",
      "evidence": "red line: no criteria invented after scores are present in the record"
    },
    {
      "section": "structured_red_lines",
      "check": "structured_record_free_of_irreversible_decision_rushed",
      "status": "pass",
      "evidence": "red line: no irreversible decision made in a rush is present in the record"
    },
    {
      "section": "structured_red_lines",
      "check": "structured_record_free_of_irreversible_decision_in_a_mood",
      "status": "pass",
      "evidence": "red line: no irreversible decision made in a mood is present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "options_count": 3,
  "criteria_count": 1,
  "duplicate_option_names": [],
  "duplicate_criterion_names": [],
  "criteria_weights_sum": "1.000000",
  "recomputed_weighted_totals": [
    {
      "option": "AWS",
      "recomputed_weighted_total": "5.000000"
    },
    {
      "option": "GCP",
      "recomputed_weighted_total": "4.000000"
    },
    {
      "option": "Azure",
      "recomputed_weighted_total": "3.000000"
    }
  ],
  "options_with_weighted_total_mismatch": [],
  "options_without_complete_scores": [],
  "score_coverage_ratio": "1.000000",
  "weighted_total_match_ratio": "1.000000",
  "chosen_option": "AWS",
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across eight sections.",
  "stamp": "STRUCTURED DECISION MAKING\ndecision: Choose cloud provider\nVERDICT: DECISION_RECORD_SOUND\n  structured_framing                           pass\n  structured_options                           pass\n  structured_criteria                          pass\n  structured_matrix_scoring                    pass\n  structured_evaluation_and_uncertainty        pass\n  structured_pre_mortem                        pass\n  structured_commit_log_and_review             pass\n  structured_red_lines                         pass\n46 pass, 0 fail, 0 missing of 46 checks across eight sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T12:26:55.725779+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/structured-decision-making/evidence.json`.

Input:

```json
{
  "decision": "Choose cloud provider",
  "framing": {
    "decision_restated_crisp": true,
    "decide_by_date_stated": true,
    "constraints_named": true,
    "out_of_scope_named": true,
    "classification": "reversible",
    "stakes_assessed": true,
    "effort_budget_matched_to_stakes_and_reversibility": true,
    "slowed_deliberation_declared": true
  },
  "options": [
    {
      "name": "AWS",
      "kind": "action",
      "scores": [
        {
          "criterion": "Cost",
          "score": 11.0
        }
      ],
      "declared_weighted_total": 11.0
    },
    {
      "name": "GCP",
      "kind": "status_quo",
      "scores": [
        {
          "criterion": "Cost",
          "score": 4.0
        }
      ],
      "declared_weighted_total": 999.0
    },
    {
      "name": "Azure",
      "kind": "smaller_reversible_step",
      "scores": [
        {
          "criterion": "Cost",
          "score": 3.0
        }
      ],
      "declared_weighted_total": 3.0
    }
  ],
  "criteria": [
    {
      "name": "Cost",
      "weight": 1.0,
      "defined_before_scoring": true
    }
  ],
  "evaluation": {
    "method": "decision_matrix",
    "score_scale_min": 0.0,
    "score_scale_max": 10.0,
    "probabilities_estimable": false,
    "expected_value_used": false,
    "scenario_thinking_used": false,
    "uncertainty_flagged": false,
    "base_rates_considered": false
  },
  "premortem": {
    "decision_is_material": false,
    "conducted": false,
    "failure_reasons_named": false,
    "top_reasons_fixed_or_hedged": false
  },
  "log": {
    "choice_recorded": true,
    "chosen_option": "AWS",
    "rationale_recorded": true,
    "assumptions_recorded": true,
    "communicated_with_why": true
  },
  "review": {
    "review_date_set": true,
    "outcomes_vs_expectations_review_planned": true,
    "luck_separated_from_process_declared": true
  },
  "red_lines": {
    "decision_without_options_present": false,
    "criteria_invented_after_scores_present": false,
    "irreversible_decision_rushed_present": false,
    "irreversible_decision_made_in_mood_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "structured-decision-making",
  "atom_version": "0.1.0",
  "decision": "Choose cloud provider",
  "verdict": "DECISION_RECORD_NOT_SOUND",
  "sections": {
    "structured_framing": "pass",
    "structured_options": "pass",
    "structured_criteria": "pass",
    "structured_matrix_scoring": "fail",
    "structured_evaluation_and_uncertainty": "fail",
    "structured_pre_mortem": "pass",
    "structured_commit_log_and_review": "pass",
    "structured_red_lines": "pass"
  },
  "checks": [
    {
      "section": "structured_framing",
      "check": "structured_framing_decision_restated_crisp",
      "status": "pass",
      "evidence": "frame: the actual decision is restated until it is crisp \u2014 what needs deciding is stated"
    },
    {
      "section": "structured_framing",
      "check": "structured_framing_decide_by_date_stated",
      "status": "pass",
      "evidence": "frame: by when the decision must be made is stated"
    },
    {
      "section": "structured_framing",
      "check": "structured_framing_constraints_named",
      "status": "pass",
      "evidence": "frame: the constraints on the decision are named"
    },
    {
      "section": "structured_framing",
      "check": "structured_framing_out_of_scope_named",
      "status": "pass",
      "evidence": "frame: what is out of scope for the decision is named"
    },
    {
      "section": "structured_framing",
      "check": "structured_classification_is_reversible_or_irreversible",
      "status": "pass",
      "evidence": "classify: the decision is classified reversible or irreversible \u2014 speed where reversible, care where not"
    },
    {
      "section": "structured_framing",
      "check": "structured_framing_stakes_assessed",
      "status": "pass",
      "evidence": "classify: the stakes of the decision are assessed \u2014 stakes x reversibility sets the effort budget"
    },
    {
      "section": "structured_framing",
      "check": "structured_effort_budget_matched_to_stakes_and_reversibility",
      "status": "pass",
      "evidence": "classify: the effort spent on the decision is declared matched to its stakes and reversibility"
    },
    {
      "section": "structured_framing",
      "check": "structured_slowed_deliberation_when_irreversible",
      "status": "pass",
      "evidence": "decision is not classified irreversible \u2014 slowed deliberation is not required by the classification"
    },
    {
      "section": "structured_options",
      "check": "structured_options_list_declares_at_least_three",
      "status": "pass",
      "evidence": "options: the declared record names at least three options \u2014 binary choices are usually false binaries; an absent list is missing evidence and a shorter list fails"
    },
    {
      "section": "structured_options",
      "check": "structured_every_option_row_names_the_option",
      "status": "pass",
      "evidence": "options: every declared option row names the option (a non-empty name)"
    },
    {
      "section": "structured_options",
      "check": "structured_option_names_are_unique",
      "status": "pass",
      "evidence": "options: no declared option name is owned by more than one row"
    },
    {
      "section": "structured_options",
      "check": "structured_every_option_kind_is_recognised",
      "status": "pass",
      "evidence": "options: every declared option's kind is one of action, status_quo, smaller_reversible_step"
    },
    {
      "section": "structured_options",
      "check": "structured_options_include_a_status_quo_row",
      "status": "pass",
      "evidence": "options: the declared rows include a status-quo option ('do nothing / wait')"
    },
    {
      "section": "structured_options",
      "check": "structured_options_include_a_smaller_reversible_step_row",
      "status": "pass",
      "evidence": "options: the declared rows include a smaller reversible step option"
    },
    {
      "section": "structured_criteria",
      "check": "structured_criteria_list_is_declared",
      "status": "pass",
      "evidence": "criteria: the declared record names its criteria \u2014 the criteria list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all"
    },
    {
      "section": "structured_criteria",
      "check": "structured_every_criterion_row_names_the_criterion",
      "status": "pass",
      "evidence": "criteria: every declared criterion row names the criterion (a non-empty name)"
    },
    {
      "section": "structured_criteria",
      "check": "structured_criterion_names_are_unique",
      "status": "pass",
      "evidence": "criteria: no declared criterion name is owned by more than one row"
    },
    {
      "section": "structured_criteria",
      "check": "structured_every_criterion_weight_is_nonnegative",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-negative weight"
    },
    {
      "section": "structured_criteria",
      "check": "structured_criteria_weights_sum_is_positive",
      "status": "pass",
      "evidence": "criteria: the declared criterion weights sum to a positive total \u2014 a matrix whose weights sum to zero scores nothing"
    },
    {
      "section": "structured_criteria",
      "check": "structured_every_criterion_defined_before_scoring",
      "status": "pass",
      "evidence": "criteria: every declared criterion is declared defined before scoring \u2014 criteria first, weights before scores"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_every_option_scores_every_declared_criterion",
      "status": "pass",
      "evidence": "matrix: every declared option scores every declared criterion \u2014 the score matrix is complete over the record's own declared criteria"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_no_option_scores_an_undeclared_criterion",
      "status": "pass",
      "evidence": "matrix: no declared option scores a criterion the record does not declare"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_no_option_scores_a_criterion_twice",
      "status": "pass",
      "evidence": "matrix: no declared option scores the same criterion on more than one score row"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_score_scale_bounds_are_coherent",
      "status": "pass",
      "evidence": "matrix: the record's declared score scale bounds are coherent \u2014 score_scale_min does not exceed score_scale_max"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_every_score_lies_within_the_declared_scale",
      "status": "fail",
      "evidence": "matrix: every declared score lies within the score scale the record itself declares"
    },
    {
      "section": "structured_matrix_scoring",
      "check": "structured_every_declared_weighted_total_recomputes",
      "status": "fail",
      "evidence": "matrix: every declared option's declared weighted total recomputes exactly as sum(declared criterion weight x declared score) over the declared criteria (6dp serialization)"
    },
    {
      "section": "structured_evaluation_and_uncertainty",
      "check": "structured_evaluation_method_is_recognised",
      "status": "pass",
      "evidence": "evaluation: the declared evaluation method is one of decision_matrix, expected_value, decision_tree, scenario_thinking \u2014 a fitting tool for the decision"
    },
    {
      "section": "structured_evaluation_and_uncertainty",
      "check": "structured_evaluation_uncertainty_is_flagged",
      "status": "fail",
      "evidence": "evaluation: the uncertainty in the evaluation is flagged"
    },
    {
      "section": "structured_evaluation_and_uncertainty",
      "check": "structured_evaluation_base_rates_are_considered",
      "status": "fail",
      "evidence": "evaluation: base-rate / reference information is declared considered before the inside view of this decision (its arithmetic, if any, is the base-rate-card atom's ground, not this record's)"
    },
    {
      "section": "structured_evaluation_and_uncertainty",
      "check": "structured_expected_value_used_when_probabilities_estimable",
      "status": "pass",
      "evidence": "probabilities are not declared estimable \u2014 expected-value evaluation is not required"
    },
    {
      "section": "structured_evaluation_and_uncertainty",
      "check": "structured_scenario_thinking_used_when_probabilities_not_estimable",
      "status": "fail",
      "evidence": "evaluation: when probabilities are declared not estimable, scenario thinking is declared used"
    },
    {
      "section": "structured_pre_mortem",
      "check": "structured_premortem_conducted_when_decision_is_material",
      "status": "pass",
      "evidence": "decision is not declared material \u2014 a pre-mortem is not required by the quality gate"
    },
    {
      "section": "structured_pre_mortem",
      "check": "structured_premortem_failure_reasons_named_when_material",
      "status": "pass",
      "evidence": "decision is not declared material \u2014 pre-mortem failure reasons are not required"
    },
    {
      "section": "structured_pre_mortem",
      "check": "structured_premortem_top_reasons_fixed_or_hedged_when_material",
      "status": "pass",
      "evidence": "decision is not declared material \u2014 pre-mortem hedging is not required"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_log_choice_is_recorded",
      "status": "pass",
      "evidence": "commit: the choice is recorded in the decision log"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_logged_chosen_option_matches_a_declared_option",
      "status": "pass",
      "evidence": "commit: the logged chosen option names a declared option row \u2014 the log commits to an option the record actually evaluated (which option is chosen is the caller's decision; this atom never checks it against the recomputed totals)"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_log_rationale_is_recorded",
      "status": "pass",
      "evidence": "commit: the rationale for the choice is recorded"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_log_assumptions_are_recorded",
      "status": "pass",
      "evidence": "commit: the assumptions behind the choice are recorded in the log"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_log_decision_communicated_with_why",
      "status": "pass",
      "evidence": "commit: the decision is declared communicated with the 'why'"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_review_date_is_set",
      "status": "pass",
      "evidence": "review: a review date is set \u2014 review on schedule"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_review_compares_outcomes_to_expectations",
      "status": "pass",
      "evidence": "review: the review is declared to compare outcomes against the expectations recorded at commit time"
    },
    {
      "section": "structured_commit_log_and_review",
      "check": "structured_review_separates_luck_from_process",
      "status": "pass",
      "evidence": "review: the review is declared to separate luck from process and update the record"
    },
    {
      "section": "structured_red_lines",
      "check": "structured_record_free_of_decision_without_options",
      "status": "pass",
      "evidence": "red line: no decision without options is present in the record"
    },
    {
      "section": "structured_red_lines",
      "check": "structured_record_free_of_criteria_invented_after_scores",
      "status": "pass",
      "evidence": "red line: no criteria invented after scores are present in the record"
    },
    {
      "section": "structured_red_lines",
      "check": "structured_record_free_of_irreversible_decision_rushed",
      "status": "pass",
      "evidence": "red line: no irreversible decision made in a rush is present in the record"
    },
    {
      "section": "structured_red_lines",
      "check": "structured_record_free_of_irreversible_decision_in_a_mood",
      "status": "pass",
      "evidence": "red line: no irreversible decision made in a mood is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "options_count": 3,
  "criteria_count": 1,
  "duplicate_option_names": [],
  "duplicate_criterion_names": [],
  "criteria_weights_sum": "1.000000",
  "recomputed_weighted_totals": [
    {
      "option": "AWS",
      "recomputed_weighted_total": "11.000000"
    },
    {
      "option": "GCP",
      "recomputed_weighted_total": "4.000000"
    },
    {
      "option": "Azure",
      "recomputed_weighted_total": "3.000000"
    }
  ],
  "options_with_weighted_total_mismatch": [
    "GCP"
  ],
  "options_without_complete_scores": [],
  "score_coverage_ratio": "1.000000",
  "weighted_total_match_ratio": "0.666667",
  "chosen_option": "AWS",
  "summary": "41 pass, 5 fail, 0 missing of 46 checks across eight sections.",
  "stamp": "STRUCTURED DECISION MAKING\ndecision: Choose cloud provider\nVERDICT: DECISION_RECORD_NOT_SOUND\n  structured_framing                           pass\n  structured_options                           pass\n  structured_criteria                          pass\n  structured_matrix_scoring                    fail\n  structured_evaluation_and_uncertainty        fail\n  structured_pre_mortem                        pass\n  structured_commit_log_and_review             pass\n  structured_red_lines                         pass\n41 pass, 5 fail, 0 missing of 46 checks across eight sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T12:26:55.725779+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/structured-decision-making/evidence.json`.

Input:

```json
{
  "decision": 12345,
  "framing": {
    "decision_restated_crisp": true,
    "decide_by_date_stated": true,
    "constraints_named": true,
    "out_of_scope_named": true,
    "classification": "reversible",
    "stakes_assessed": true,
    "effort_budget_matched_to_stakes_and_reversibility": true,
    "slowed_deliberation_declared": true
  },
  "options": [
    {
      "name": "AWS",
      "kind": "action",
      "scores": [
        {
          "criterion": "Cost",
          "score": 5.0
        }
      ],
      "declared_weighted_total": 5.0
    },
    {
      "name": "GCP",
      "kind": "status_quo",
      "scores": [
        {
          "criterion": "Cost",
          "score": 4.0
        }
      ],
      "declared_weighted_total": 4.0
    },
    {
      "name": "Azure",
      "kind": "smaller_reversible_step",
      "scores": [
        {
          "criterion": "Cost",
          "score": 3.0
        }
      ],
      "declared_weighted_total": 3.0
    }
  ],
  "criteria": [
    {
      "name": "Cost",
      "weight": 1.0,
      "defined_before_scoring": true
    }
  ],
  "evaluation": {
    "method": "decision_matrix",
    "score_scale_min": 0.0,
    "score_scale_max": 10.0,
    "probabilities_estimable": false,
    "expected_value_used": false,
    "scenario_thinking_used": true,
    "uncertainty_flagged": true,
    "base_rates_considered": true
  },
  "premortem": {
    "decision_is_material": false,
    "conducted": false,
    "failure_reasons_named": false,
    "top_reasons_fixed_or_hedged": false
  },
  "log": {
    "choice_recorded": true,
    "chosen_option": "AWS",
    "rationale_recorded": true,
    "assumptions_recorded": true,
    "communicated_with_why": true
  },
  "review": {
    "review_date_set": true,
    "outcomes_vs_expectations_review_planned": true,
    "luck_separated_from_process_declared": true
  },
  "red_lines": {
    "decision_without_options_present": false,
    "criteria_invented_after_scores_present": false,
    "irreversible_decision_rushed_present": false,
    "irreversible_decision_made_in_mood_present": false
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "decision",
  "detail": "decision must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — this atom was deployed census-style under a U-13 screen classified (b) — screen-NO with flag-with-controls (census class), with the four named controls recorded in SERVICE.md's U-13 section; the flag stays open for the Director's review (see Role views, For regulators) |
| Checks named | 46 documented / 46 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`options_count`, `criteria_count`, the two duplicate-name lists, `criteria_weights_sum`, `recomputed_weighted_totals`, the mismatch and incomplete-scores lists, the two ratios, and `chosen_option`) |
| Input reference typed | Yes — 53 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/structured-decision-making/evidence.json` |
