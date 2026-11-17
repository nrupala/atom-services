# Tech stack decision memo — documentation

**Tech stack decision memo** · slug `tech-stack-decision-memo` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 22647267ae414ecbb3a5ee342afd73f8; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared tech-stack decision memo record for completeness and internal consistency only, and recomputes the arithmetic the record itself declares. It surfaces two faces: REST `POST /v1/tech-stack-decision-memo` and MCP `POST /mcp/tech-stack-decision-memo`. It recommends no stack, picks no stack, ranks no candidate and applies no default stack — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/tech-stack-decision-memo/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 22647267ae414ecbb3a5ee342afd73f8). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the memo "Database Migration Strategy"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "tech-stack-decision-memo"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the tech-stack decision memo manifest.** You declare a tech-stack decision memo record for one stack selection, made from the memo as actually written — hard constraints framed, candidates compared under a boring-technology bias, criteria and scores declared, total cost and operability weighed, a decision recorded, and reversibility kept; the atom audits the declared record, it does not choose a stack for you (see Explanation). The recorded full-pass manifest declares the memo `Database Migration Strategy`: all nine context flags `true` (hard constraints declared; the security-model, regulatory, performance and offline constraints addressed; access and usage patterns declared; team operability context declared; the decision framed as sticky); all four candidate-work flags `true` (candidates compared against the same hard constraints, boring-technology bias addressed, novelty budget allocation declared, novelty spend tied to differentiation); two candidates — `c1` (stack `PostgreSQL`, novelty classification `proven`, evidence note `Industry standard`, score 10 on criterion `perf`, declared weighted total 10.0) and `c2` (stack `FoundationDB`, `novel`, evidence note `High throughput`, score 8, declared weighted total 8.0); both evaluation flags `true` (evidence basis recorded, evaluation applied consistently across candidates); one criterion `perf` (name `Performance`, weight 1.0); the TCO flags `true` with `free_tier_or_free_choice_used` declared `false`, so the hidden-fragility check passes as not applicable and the manifest declares no `hidden_fragility_cost_named` field at all; a decision recorded with chosen candidate `c1`, rationale recorded and tied to the hard constraints and the evaluation criteria, tradeoffs recorded, and declared ranking `["c1", "c2"]`; all four reversibility flags `true`; and all five red-line flags `false` (no framework-of-the-week chosen for novelty, no microservices for a solo project, no Docker-by-default choice, no lock-in with no exit, no technology chosen to pad a CV).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/tech-stack-decision-memo` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `TECH_STACK_DECISION_SOUND`: "51 pass, 0 fail, 0 missing of 51 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `tech_stack_candidates_count` is 2, `tech_stack_criteria_count` is 1, `tech_stack_criteria_weights_sum` is `"1.000000"`, all thirteen duplicate / row-name / ranking lists are empty (`[]`), and `candidate_score_coverage_ratio`, `candidate_weighted_total_match_ratio` and `candidate_evidence_note_ratio` are each `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `TECH_STACK_DECISION_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "tech-stack-decision-memo"}`.
3. Call: `POST https://atoms.pipavia.com/v1/tech-stack-decision-memo` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/tech-stack-decision-memo` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `tech_stack_decision_memo`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `TECH_STACK_DECISION_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_tech_stack_memo_candidate_stack_name_declared`, `every_tech_stack_memo_candidate_novelty_classification_recognised`, `every_tech_stack_memo_candidate_evidence_note_declared`, and `tech_stack_memo_free_of_framework_of_the_week_chosen_for_novelty`, and the summary reads "47 pass, 4 fail, 0 missing of 51 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, candidate `c1` declares an empty `stack_name`, named in `tech_stack_candidates_without_stack_name` as `["c1"]`; candidate `c2` declares `novelty_classification` `unknown`, outside the two recognised classes `proven` / `novel`, named in `tech_stack_candidates_with_invalid_novelty_classification` as `["c2"]`, and an empty `evidence_note`, named in `tech_stack_candidates_without_evidence_note` as `["c2"]`, which drops `candidate_evidence_note_ratio` to `"0.500000"` while `candidate_score_coverage_ratio` and `candidate_weighted_total_match_ratio` stay `"1.000000"` and `tech_stack_criteria_weights_sum` stays `"1.000000"`; and `red_lines.framework_of_the_week_chosen_for_novelty_present` is declared `true`, failing the red-line check; sections `candidates_and_boring_technology` and `red_lines` report `fail`, the other five sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). Declare only what is true of the actual memo: supply the real stack name and evidence note, correct the novelty classification to the class the memo actually assigns, and record the true red-line state. For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "context",
  "detail": "context must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/tech-stack-decision-memo` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/tech-stack-decision-memo` — tool name `tech_stack_decision_memo`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `tech_stack_decision_memo` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `memo_title`, `candidates[].candidate_id`, `candidates[].stack_name`, `candidates[].novelty_classification`, `candidates[].evidence_note`, `candidates[].scores[].criterion_id`, `criteria[].criterion_id`, `criteria[].criterion_name` and `decision.chosen_candidate_id` are noted as strings, `candidates[].scores[].score`, `candidates[].weighted_total_declared` and `criteria[].weight` as numbers, `candidates`, `candidates[].scores` and `criteria` as lists, and `decision.declared_ranking_candidate_ids` as a list of strings there. Where SERVICE.md states no type — the section container objects (`context`, `candidate_work`, `evaluation`, `tco`, `decision`, `reversibility`, `red_lines`) and the row objects (`candidates[]`, `criteria[]`, `candidates[].scores[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` — it also types the `candidates` and `criteria` lists `object`, which contradicts SERVICE.md and the recorded inputs; see Discrepancies). A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `TECH_STACK_DECISION_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, as SERVICE.md groups them — with the multi-section rows named where they occur: the `candidates` rows are also read by `evaluation_criteria_and_evidence` (their `scores` and `weighted_total_declared` fields) and by `decision_and_rationale` (for the chosen-candidate and declared-ranking checks).

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `memo_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: context_and_constraints

| Field | Type | Notes |
|---|---|---|
| `context` | object | The context section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `context.hard_constraints_declared` | boolean | — |
| `context.security_model_constraint_addressed` | boolean | — |
| `context.regulatory_constraint_addressed` | boolean | — |
| `context.performance_constraint_addressed` | boolean | — |
| `context.offline_constraint_addressed` | boolean | — |
| `context.access_patterns_declared` | boolean | — |
| `context.usage_patterns_declared` | boolean | — |
| `context.team_operability_context_declared` | boolean | — |
| `context.decision_framed_as_sticky` | boolean | — |

#### Read by: candidates_and_boring_technology

| Field | Type | Notes |
|---|---|---|
| `candidate_work` | object | The candidate-work section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `candidate_work.candidates_compared_against_same_hard_constraints` | boolean | — |
| `candidate_work.boring_technology_bias_addressed` | boolean | — |
| `candidate_work.novelty_budget_allocation_declared` | boolean | — |
| `candidate_work.novelty_spend_tied_to_differentiation_declared` | boolean | — |
| `candidates` | list | List of candidate-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list; the recorded MCP `inputSchema` types it `object` — see Discrepancies). Also read by `evaluation_criteria_and_evidence` and `decision_and_rationale` |
| `candidates[]` | object | One declared candidate row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `candidates[].candidate_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `candidates[].stack_name` | string | Computed — must be non-empty on every row (type stated in SERVICE.md) |
| `candidates[].novelty_classification` | string | Computed — one of `proven`, `novel` (type stated in SERVICE.md) |
| `candidates[].evidence_note` | string | Computed — must be non-empty on every row (type stated in SERVICE.md) |

#### Read by: evaluation_criteria_and_evidence

| Field | Type | Notes |
|---|---|---|
| `candidates[].scores` | list | List of score-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Sits on the candidate rows but is read by this section, as SERVICE.md groups it |
| `candidates[].scores[]` | object | One declared score row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `candidates[].scores[].criterion_id` | string | Computed — must name a declared criterion (type stated in SERVICE.md) |
| `candidates[].scores[].score` | number | The caller-declared score for that criterion (type stated in SERVICE.md) |
| `candidates[].weighted_total_declared` | number | Computed — must recompute from the declared weights and scores, see below (type stated in SERVICE.md). Sits on the candidate rows but is read by this section, as SERVICE.md groups it |
| `evaluation` | object | The evaluation section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `evaluation.evidence_basis_recorded` | boolean | — |
| `evaluation.evaluation_applied_consistently_across_candidates` | boolean | — |
| `criteria` | list | List of criterion-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list; the recorded MCP `inputSchema` types it `object` — see Discrepancies) |
| `criteria[]` | object | One declared criterion row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `criteria[].criterion_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `criteria[].criterion_name` | string | Computed — must be non-empty on every row (type stated in SERVICE.md) |
| `criteria[].weight` | number | Computed — must be non-negative, and the weights must sum positive (type stated in SERVICE.md) |

#### Read by: total_cost_and_operability

| Field | Type | Notes |
|---|---|---|
| `tco` | object | The total-cost-and-operability section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `tco.licensing_cost_addressed` | boolean | — |
| `tco.operations_burden_addressed` | boolean | — |
| `tco.learning_curve_addressed` | boolean | — |
| `tco.lock_in_cost_addressed` | boolean | — |
| `tco.operability_cost_addressed` | boolean | — |
| `tco.on_call_operability_owner_declared` | boolean | — |
| `tco.team_can_operate_declared_stack` | boolean | — |
| `tco.free_tier_or_free_choice_used` | boolean | Gates the hidden-fragility check below |
| `tco.hidden_fragility_cost_named` | boolean | Required when `tco.free_tier_or_free_choice_used` is declared `true`; otherwise the check that reads it passes as not applicable — the recorded full-pass manifest omits this field entirely (its gate is declared `false`) and the check passes |

#### Read by: decision_and_rationale

| Field | Type | Notes |
|---|---|---|
| `decision` | object | The decision section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `decision.decision_recorded` | boolean | — |
| `decision.chosen_candidate_id` | string | Computed — must name a declared candidate; only that the reference resolves is checked, never that the chosen candidate is top-ranked or highest-scoring (type stated in SERVICE.md) |
| `decision.rationale_recorded` | boolean | — |
| `decision.rationale_tied_to_hard_constraints` | boolean | — |
| `decision.rationale_tied_to_evaluation_criteria` | boolean | — |
| `decision.tradeoffs_of_decision_recorded` | boolean | — |
| `decision.declared_ranking_candidate_ids` | list of strings | Computed — must be exactly the declared candidate ids, none missing, none extra, none duplicated (type stated in SERVICE.md) |

#### Read by: reversibility_and_exit

| Field | Type | Notes |
|---|---|---|
| `reversibility` | object | The reversibility section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `reversibility.exit_cost_assessed` | boolean | — |
| `reversibility.exit_path_kept` | boolean | — |
| `reversibility.vendor_specific_pieces_isolated_behind_interfaces` | boolean | — |
| `reversibility.reversibility_assessed` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.framework_of_the_week_chosen_for_novelty_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.microservices_for_solo_project_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.docker_by_default_choice_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.lock_in_with_no_exit_present` | boolean | must be `false` to pass — skill anti-pattern |
| `red_lines.technology_chosen_to_pad_cv_present` | boolean | must be `false` to pass — skill anti-pattern |

### Checks

All 51 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Note on the gated check: the one gated check (`tech_stack_memo_hidden_fragility_cost_named_where_free_choice_used`) carries the same recorded evidence text, "no free-tier or free choice declared used", in both its full-pass `pass` state and its sparse-run `missing` state — see Discrepancies.

#### Section: context_and_constraints

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tech_stack_memo_hard_constraints_declared` | decision frame: the memo declares its hard constraints | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_security_model_constraint_addressed` | decision frame: the security-model hard constraint is addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_regulatory_constraint_addressed` | decision frame: the regulatory hard constraint is addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_performance_constraint_addressed` | decision frame: the performance hard constraint is addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_offline_constraint_addressed` | decision frame: the offline hard constraint is addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_access_patterns_declared` | decision frame: the access patterns the stack must serve are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_usage_patterns_declared` | decision frame: the usage patterns the stack must serve are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_team_operability_context_declared` | decision frame: the team that must run the stack — its size and capability — is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_decision_framed_as_sticky` | decision frame: the stack choice is framed as sticky — decided like a one-way door, not fashion | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: candidates_and_boring_technology

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tech_stack_memo_candidates_compared_against_same_hard_constraints` | candidates: every candidate stack was compared against the same declared hard constraints | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_boring_technology_bias_addressed` | boring-technology bias: the memo addresses preferring proven, well-understood tools for the plumbing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_novelty_budget_allocation_declared` | boring-technology bias: the memo declares how its limited novelty budget is allocated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_novelty_spend_tied_to_differentiation_declared` | boring-technology bias: any novelty spend is declared tied to where it actually differentiates | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_candidates_list_declared` | candidates: the declared record names its candidate stacks — the list is present and names at least two candidates; an absent list is missing evidence and a list of fewer than two declares no comparison at all | Computed over the declared record. Pass: the `candidates` list is present and names at least two candidates. Fail: the list is present with fewer than two candidates. Missing: the list is absent. |
| `every_tech_stack_memo_candidate_id_unique` | candidates: no declared candidate_id is owned by more than one row | Computed over the declared record. Pass: no declared `candidate_id` appears on more than one row. Fail: a `candidate_id` is declared on more than one row (duplicates are named in `duplicate_tech_stack_candidate_ids`). Missing: the list is absent, or a row has `candidate_id` absent. |
| `every_tech_stack_memo_candidate_stack_name_declared` | candidates: every declared candidate declares a non-empty stack name | Computed over the declared record. Pass: every declared candidate row declares a non-empty `stack_name`. Fail: a row declares an empty name (offending rows are named in `tech_stack_candidates_without_stack_name`). Missing: the list is absent, or a row has `stack_name` absent. |
| `every_tech_stack_memo_candidate_novelty_classification_recognised` | candidates: every declared candidate's novelty classification is one of proven, novel — the two classes the boring-technology bias works with | Computed over the declared record. Pass: every declared candidate's `novelty_classification` is one of `proven`, `novel`. Fail: a row declares any other value (offending rows are named in `tech_stack_candidates_with_invalid_novelty_classification`). Missing: the list is absent, or a row has `novelty_classification` absent. |
| `every_tech_stack_memo_candidate_evidence_note_declared` | candidates: every declared candidate declares a non-empty evidence note | Computed over the declared record. Pass: every declared candidate row declares a non-empty `evidence_note`. Fail: a row declares an empty note (offending rows are named in `tech_stack_candidates_without_evidence_note`). Missing: the list is absent, or a row has `evidence_note` absent. |

#### Section: evaluation_criteria_and_evidence

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tech_stack_memo_evaluation_evidence_basis_recorded` | evaluation: the evidence basis for the candidate evaluation is recorded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_evaluation_applied_consistently_across_candidates` | evaluation: the same criteria and evidence basis were applied consistently across all candidates | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_criteria_list_declared` | criteria: the declared record names its evaluation criteria — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no evaluation at all | Computed over the declared record. Pass: the `criteria` list is present and names at least one criterion. Fail: the list is present but empty. Missing: the list is absent. |
| `every_tech_stack_memo_criterion_id_unique` | criteria: no declared criterion_id is owned by more than one row | Computed over the declared record. Pass: no declared `criterion_id` appears on more than one row. Fail: a `criterion_id` is declared on more than one row (duplicates are named in `duplicate_tech_stack_criterion_ids`). Missing: the list is absent, or a row has `criterion_id` absent. |
| `every_tech_stack_memo_criterion_name_declared` | criteria: every declared criterion declares a non-empty criterion name | Computed over the declared record. Pass: every declared criterion row declares a non-empty `criterion_name`. Fail: a row declares an empty name (offending rows are named in `tech_stack_criteria_without_name`). Missing: the list is absent, or a row has `criterion_name` absent. |
| `every_tech_stack_memo_criterion_weight_non_negative` | criteria: every declared criterion declares a non-negative weight | Computed over the declared record. Pass: every declared criterion row declares a non-negative `weight`. Fail: a row declares a negative weight (offending rows are named in `tech_stack_criteria_with_invalid_weight`). Missing: the list is absent, or a row has `weight` absent. |
| `tech_stack_memo_criteria_weights_sum_positive` | criteria: the declared criterion weights sum to a positive total — a memo whose weights sum to zero scores nothing | Computed over the declared record. Pass: the declared criterion weights sum to a positive total (reported as `tech_stack_criteria_weights_sum`). Fail: the weights sum to zero. Missing: the list is absent, or a row has `weight` absent. |
| `every_tech_stack_memo_candidate_scores_every_declared_criterion` | scores: every declared candidate scores every declared criterion and no other criterion, exactly once | Computed over the declared record. Pass: every declared candidate's `scores` list names every declared criterion and no other criterion, exactly once. Fail: a candidate scores incompletely, extra, or twice (offending candidates are named in `tech_stack_candidates_with_incomplete_or_extra_scores`). Missing: a candidate's `scores` is absent, or a criterion row has no `criterion_id`. |
| `every_tech_stack_memo_candidate_weighted_total_recomputes` | scores: every declared candidate's declared weighted total recomputes exactly as the sum of declared weight times declared score over its declared scores | Computed over the declared record. Pass: every declared candidate's `weighted_total_declared` recomputes as sum(declared weight × declared score) over its declared scores, compared on the fixed 6dp serialization. Fail: a candidate's declared total differs (offending candidates are named in `tech_stack_candidates_with_weighted_total_mismatch`). Missing: a candidate's total or its scores are absent. |

#### Section: total_cost_and_operability

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tech_stack_memo_licensing_cost_addressed` | total cost of ownership: licensing cost is weighed — not just the sticker | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_operations_burden_addressed` | total cost of ownership: operations burden is weighed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_learning_curve_addressed` | total cost of ownership: learning curve for the team that must run the stack is weighed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_lock_in_cost_addressed` | total cost of ownership: lock-in cost is weighed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_operability_cost_addressed` | operability: the operability cost of the stack — who runs this at 2am — is addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_on_call_operability_owner_declared` | operability: the on-call operability owner who runs the stack at 2am is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_team_can_operate_declared_stack` | operability: the memo declares the team can operate the declared stack | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_hidden_fragility_cost_named_where_free_choice_used` | no free-tier or free choice declared used | Computed-gated over the declared record. Pass: `tco.free_tier_or_free_choice_used` is declared `false` (the check passes as not applicable — the recorded full-pass manifest omits `tco.hidden_fragility_cost_named` and still passes), or the gate is declared `true` and `tco.hidden_fragility_cost_named` is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate field is absent, or the gate is declared `true` and the field is absent. |

#### Section: decision_and_rationale

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tech_stack_memo_decision_recorded` | decision: the memo records a decision | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_rationale_recorded` | decision: the memo records the rationale for its decision | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_rationale_tied_to_hard_constraints` | decision: the recorded rationale is tied to the declared hard constraints | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_rationale_tied_to_evaluation_criteria` | decision: the recorded rationale is tied to the declared evaluation criteria | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_tradeoffs_of_decision_recorded` | decision: the trade-offs of the recorded decision are recorded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_chosen_candidate_resolves_to_declared_candidate` | decision: the declared chosen candidate id names one of the declared candidates — the atom checks only that the reference resolves; it never checks that the chosen candidate is the top-ranked or highest-scoring one | Computed over the declared record. Pass: `decision.chosen_candidate_id` names one of the declared candidates — only that the reference resolves; it is never compared against scores or ranking. Fail: the id names no declared candidate. Missing: the chosen id is absent, or the `candidates` list is absent. |
| `tech_stack_memo_declared_ranking_matches_declared_candidates` | decision: the candidate ids in the memo's declared ranking are exactly the declared candidate ids — none missing, none extra, none duplicated; checking a declared ranking's internal consistency is audit, not advice, and the atom produces no ranking of its own | Computed over the declared record. Pass: `decision.declared_ranking_candidate_ids` is exactly the declared candidate ids — none missing, none extra, none duplicated. Fail: an id is missing (named in `tech_stack_candidates_missing_from_declared_ranking`), extra (named in `declared_ranking_ids_not_declared_as_candidates`) or duplicated (named in `duplicate_declared_ranking_candidate_ids`). Missing: either list is absent, or a candidate row has no `candidate_id`. |

#### Section: reversibility_and_exit

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tech_stack_memo_exit_cost_assessed` | reversibility: the exit cost if this choice is wrong is assessed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_exit_path_kept` | reversibility: an exit path from the chosen stack is kept | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_vendor_specific_pieces_isolated_behind_interfaces` | reversibility: vendor-specific pieces are isolated behind interfaces | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tech_stack_memo_reversibility_assessed` | reversibility: the reversibility of the stack choice is assessed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `tech_stack_memo_free_of_framework_of_the_week_chosen_for_novelty` | red line: no framework-of-the-week chosen for novelty is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `tech_stack_memo_free_of_microservices_for_solo_project` | red line: no microservices architecture for a solo project is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `tech_stack_memo_free_of_docker_by_default_choice` | red line: no Docker-by-default choice is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `tech_stack_memo_free_of_lock_in_with_no_exit` | red line: no lock-in with no exit is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `tech_stack_memo_free_of_technology_chosen_to_pad_cv` | red line: no technology chosen to pad a CV is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object, with these top-level fields in the recorded order:

- `service` (`"tech-stack-decision-memo"`), `atom_version` (`"0.1.0"`), and `memo_title` (the manifest's declared memo title, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `tech_stack_candidates_count` and `tech_stack_criteria_count` (the declared list lengths as integers, exactly, or null when the list is not declared); `duplicate_tech_stack_candidate_ids`, `duplicate_tech_stack_criterion_ids` and `duplicate_declared_ranking_candidate_ids` (ids carried by more than one row; each null when its underlying list is not declared, as recorded in the sparse case); `tech_stack_candidates_without_stack_name`, `tech_stack_candidates_with_invalid_novelty_classification`, `tech_stack_candidates_without_evidence_note`, `tech_stack_criteria_without_name`, `tech_stack_criteria_with_invalid_weight`, `tech_stack_candidates_with_incomplete_or_extra_scores`, `tech_stack_candidates_with_weighted_total_mismatch`, `tech_stack_candidates_missing_from_declared_ranking` and `declared_ranking_ids_not_declared_as_candidates` (the offending rows for each computed rule; each null when its underlying list is not declared, as recorded in the sparse case); `tech_stack_criteria_weights_sum` (the sum of the declared criterion weights — a string with exactly six decimal places; null when the criteria list is not declared, as recorded in the sparse case); and the ratios `candidate_score_coverage_ratio` (candidates scoring every declared criterion exactly ÷ declared candidates), `candidate_weighted_total_match_ratio` (candidates whose declared weighted total recomputes ÷ declared candidates) and `candidate_evidence_note_ratio` (candidates with a recorded evidence note ÷ declared candidates) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty, and the score-coverage and weighted-total ratios are also null when the criteria list is not declared. Computed quantities use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; weighted-total comparisons are made on the same 6dp serializations — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "51 pass, 0 fail, 0 missing of 51 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared memo title, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `TECH_STACK_DECISION_SOUND` — all 51 checks pass: the declared tech-stack decision memo record is complete and internally consistent with the skill's method and anti-patterns.
- `TECH_STACK_DECISION_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only — the fourteen computed checks named in SERVICE.md): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the fourteen computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for the gated check, including passes as not applicable when its gate is off); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `tech_stack_candidates_count`, `tech_stack_criteria_count`, the three duplicate-id lists, the nine row-name / ranking lists, `tech_stack_criteria_weights_sum`, `candidate_score_coverage_ratio`, `candidate_weighted_total_match_ratio` and `candidate_evidence_note_ratio` — each defined in Output format above, with the values and null rules recorded there (19 computed fields in total, including `computed_status`).

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"context","detail":"context must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Choose technology stacks for the requirement and the team that must run them — decided like one-way doors, not fashion — framed by hard constraints, access/usage patterns, operability cost and exit cost, under a boring-technology bias and a total-cost-of-ownership weighing, with reversibility kept (the bound capability, from the skill). You submit one declared record — the tech-stack decision memo manifest, made from the memo as actually written — and the atom audits that record for completeness and internal consistency against the bound skill's method and anti-patterns, and recomputes the arithmetic the record itself declares, returning one deterministic verdict across 7 sections (`context_and_constraints`, `candidates_and_boring_technology`, `evaluation_criteria_and_evidence`, `total_cost_and_operability`, `decision_and_rationale`, `reversibility_and_exit`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest siblings `architecture-decision-record` (a single decision's ADR), `framework-adoption-adr` (the adoption record for taking on one framework) and `structured-decision-making` (a general decision process) (SERVICE.md, Distinct ground): every check here is a tech-stack memo question — hard constraints (security model, regulatory, performance, offline), access/usage patterns and team operability framing for a stack choice, candidate stacks classified proven or novel under a declared novelty budget with the boring-technology bias addressed, stack-evaluation criteria with declared weights and per-candidate stack scores whose declared weighted totals recompute exactly, licensing / operations / learning-curve / lock-in total cost with the hidden fragility cost of a free choice named, a declared stack ranking that matches the declared candidates exactly, and exit cost / exit path / vendor isolation for the stack.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (fourteen, per SERVICE.md) are calculated from the declared rows and values themselves — the candidates list must name at least two rows with unique ids, non-empty stack names and evidence notes, and recognised novelty classifications; the criteria list must be declared with unique ids, non-empty names and non-negative weights summing positive; every candidate must score every declared criterion and no other, exactly once, and every declared weighted total must recompute exactly from declared scores × declared weights; the chosen candidate id must name a declared candidate; and the declared ranking must be exactly the declared candidate ids — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *The gated check* follows the skill's own conditional scope: the hidden fragility cost is required only where `tco.free_tier_or_free_choice_used` is declared `true`; with the gate declared `false` the check passes as not applicable, and with the gate absent the check is missing evidence. Aggregation is strict: any `fail` anywhere produces `TECH_STACK_DECISION_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `TECH_STACK_DECISION_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are framing, comparison, total-cost weighing and reversibility, not bars the atom can set. Declined, named, exactly as SERVICE.md names them: a minimum team size or a team-capability bar (the team is checked as declared in context, never measured); a cost ceiling for licensing, operations or total cost of ownership; an exit-cost amount or ceiling; a score scale of the atom's own (scores are caller-declared numbers, checked only for coverage and arithmetic — no scale is imposed and no score is judged good or bad); a minimum winning margin between candidates, or any check that the chosen candidate scored highest or ranked first (that check would be the atom choosing, and it is declined by name); a novelty-budget percentage or a maximum number or share of novel candidates; a candidate-count maximum, or a criterion-count bar beyond at least one criterion and at least two candidates; a conformity bar against any house or default stack (the skill's house stack defaults are a prescription for one house, not a bar this atom sets); and any judgment that the chosen stack is right, good or advisable (only that its declared memo record contains what the skill requires). Quantities are computed and reported; the only bars on the computed rows are exact recomputation and completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** tech-stack decision memo record: a verdict of `TECH_STACK_DECISION_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its constraints addressed, its candidates evidenced and its exit path kept passes those checks even if the real memo did none of it. It is a completeness and consistency audit of the memo record the skill requires, **not a stack recommendation, an architecture review, or a guarantee that the chosen stack is right**. Specifically: **the atom recommends no stack, picks no stack, ranks no candidate and applies no default stack** — it researches no technology, evaluates no stack itself, and verifies no candidate claim against the world. It never judges whether a declared score is fair, whether the evidence note actually supports the candidate, whether the chosen stack will perform, or whether the decision should stand — only that the record contains what the skill's method and anti-patterns demand, and that its declared rows are internally consistent. Named exclusions: choosing a stack for a requirement; recommending a candidate to the caller; ranking candidates as the atom's own output; applying the skill's house stack defaults (vanilla TypeScript + Web Components frontend; Rust / Python / C backend; SQLite/relational data; sovereign-first / Fly.io / Render / Cloudflare hosting; zero-knowledge / zero-trust security) as a prescription or as a conformity bar — the defaults stay inside the skill as one house's prescription and are not imported into this atom, whose callers declare their own candidates; judging that the chosen candidate is the best, top-ranked or highest-scoring candidate; and assessing any stack's real performance, security or cost. Boundary case, named in SERVICE.md: a memo selecting a stack with genuinely only one candidate ever considered cannot pass this record format's candidates-declared check (the format requires at least two compared candidates — such a memo is outside this atom's computed reach, not failed on its merits).

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Stack choices for new products (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was deployed census-style under a U-13 regulatory screen classified **(b) — screen-NO, flag-with-controls (census class)**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: the keyword screen names technology stacks, security models and regulatory constraints as *context a memo must address* — no engineering-practice, securities/financial-advice or psychology-adjacent subject is the atom's output — but the substance screen flags the adjacency strictly: a stack memo sits adjacent to professional engineering judgment, and a naive version of this atom that recommended or chose a stack for a caller's system could read as professional advice, so the atom is flagged for the owner's per-unit ruling queue under U-13 on that adjacency. What prevents an advice reading, as named controls, exactly as SERVICE.md records them: (1) it produces **no recommendation and no choice** — the skill's recommending, choosing and default-applying steps are excluded by name in SERVICE.md's Honest scoping; the atom never names a stack the caller should adopt; (2) it **never ranks candidates as its own output** and never checks that the chosen candidate is top-ranked or highest-scoring — checking a **declared** ranking's internal consistency (it lists exactly the declared candidates) is audit, not advice, and that boundary is stated in the check itself; (3) it sets **no threshold** on any technology (see the declined list in Explanation) and imports no house stack default as a bar; (4) the regulatory-constraint check judges only that the memo *addresses* a regulatory constraint the caller declares — it states no regulatory requirement and judges no compliance; professional stack decisions for regulated systems remain the caller's responsible professionals, on their record. SERVICE.md records why this is the census flag-with-controls class and not class (a): the adjacency is real (stack choice for a regulated or safety-relevant system is professional work); and it is not the genuinely-open personal-financial-snapshot class, because no personal position of any kind is handled. The flag stays open for the Director's review: the screen-NO classification and its controls stand as recorded, and the census flag is not closed by this document.

### For integrators (Users)

You need: a gateway key with the `tech_stack_decision_memo` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed quantities are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, and weighted-total comparisons are made on the same 6dp serializations, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/tech_stack_decision_memo.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_tech_stack_decision_memo.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/tech-stack-decision-memo` (REST) and `POST /mcp/tech-stack-decision-memo` (MCP, tool `tech_stack_decision_memo`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 22647267ae414ecbb3a5ee342afd73f8; RC soak to 2026-11-22). Key scope: `tech_stack_decision_memo`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 22647267ae414ecbb3a5ee342afd73f8) shows the atom live. This document follows the evidenced live state: live. The same staleness touches SERVICE.md's U-13 section, which records that "no deploy happens on this atom without the owner's explicit per-unit ruling in any case" — the recorded deployment exists; the U-13 flag itself stays open for the Director's review (see Role views, For regulators) and is not closed by this document.
2. **Check names differ from input field names:** the recorded check names differ from the leaf name of the input field they read — the attestation names carry the `tech_stack_memo_` prefix (for example `tech_stack_memo_hard_constraints_declared` reads `context.hard_constraints_declared`; `tech_stack_memo_decision_recorded` reads `decision.decision_recorded`), the row-computed names carry an `every_tech_stack_memo_` form (for example `every_tech_stack_memo_candidate_id_unique` reads the candidate rows' `candidate_id` values; `every_tech_stack_memo_candidate_weighted_total_recomputes` reads the candidates' `scores` and `weighted_total_declared` values against recomputation), and the five red-line checks are phrased as freedoms (for example `tech_stack_memo_free_of_framework_of_the_week_chosen_for_novelty` reads `red_lines.framework_of_the_week_chosen_for_novelty_present`). The fourteen computed checks and the gated check have no single same-named field at all. Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md, and the recorded MCP `inputSchema` mis-types the two lists:** SERVICE.md states no type for the section container objects (`context`, `candidate_work`, `evaluation`, `tco`, `decision`, `reversibility`, `red_lines`) or for a row object (`candidates[]`, `criteria[]`, `candidates[].scores[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers, in the recorded MCP `inputSchema`, and are said so there. The recorded MCP `inputSchema` itself lists only the ten top-level properties (`memo_title`, `context`, `candidate_work`, `candidates`, `evaluation`, `criteria`, `tco`, `decision`, `reversibility`, `red_lines`) and types `candidates` and `criteria` as `object`, although SERVICE.md's table and every recorded input treat both as lists of row objects — the nested row and leaf types rest on the recorded evidence inputs and SERVICE.md's table, not on the schema, and the schema's `object` typing for the two lists is not followed.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 51 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md for the list and sum outputs:** SERVICE.md's output paragraph states the null rules for `computed_status`, `tech_stack_candidates_count`, `tech_stack_criteria_count` and the three ratios, but it does not state a null rule for the three duplicate-id lists, the nine row-name / ranking lists, or `tech_stack_criteria_weights_sum`. The recorded sparse response returns all of those as `null` when the underlying lists are not declared (as the Output format section records); this document follows the recording.
6. **Section groupings splitting the candidate rows:** the recorded sections do not map one-to-one onto input objects. The single `candidates` list is read by three recorded sections — `candidates_and_boring_technology` (the row identity fields), `evaluation_criteria_and_evidence` (the rows' `scores` and `weighted_total_declared` fields, which SERVICE.md groups under that section although they sit on the candidate rows) and `decision_and_rationale` (the chosen-candidate and declared-ranking checks read the declared candidate ids) — so the candidate rows are split across two recorded sections and the list across three. This document groups the Input reference and the Checks by the recorded section names, with those splittings named in place.
7. **The gated check's evidence text does not vary with its state:** the evidence text quoted in the Checks section is the full-pass run's text. For the one gated check, `tech_stack_memo_hidden_fragility_cost_named_where_free_choice_used`, the recorded sparse run carries the identical evidence string — "no free-tier or free choice declared used" — with status `missing` (its gate field is absent) as the full-pass run carries with status `pass` (its gate is declared `false` and the target field is absent from the manifest entirely). No distinct required-form evidence string for this check exists in the recordings; the Checks section says so at its head.
8. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (9 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named computed row-name lists and a prose phrase (`tech_stack_candidates_without_stack_name`, `candidate_ids_unique`, `tech_stack_candidates_with_invalid_novelty_classification`, `tech_stack_candidates_without_evidence_note`, `tech_stack_criteria_with_invalid_weight`) instead of exact check names (R1 ×5); the full-pass and violations `expect` blocks carried no structured `computed_spot_checks` (R2 ×2); the designed violations input was missing the key paths present in the full-pass manifest (R3 ×1); and, beyond the validator rejections, one oracle-pre-check correction (unscored design-time correction prose): the raw full-pass design lacked per-candidate `weighted_total_declared` values and carried a stray top-level `weighted_total_declared: 10.0` field instead, so the Python oracle returned `INSUFFICIENT_EVIDENCE` (50 pass / 0 fail / 1 missing, the weighted-total check missing); the stray field was removed and per-candidate totals recomputed from the declared weights and scores were added (`c1`: 1.0 × 10 = 10.0; `c2`: 1.0 × 8 = 8.0), after which the oracle returned `TECH_STACK_DECISION_SOUND` (51 pass / 0 fail / 0 missing). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T14:11:00.461606+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/tech-stack-decision-memo/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T14:11:00.461606+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/tech-stack-decision-memo/evidence.json`.

Input:

```json
{
  "memo_title": "Database Migration Strategy",
  "context": {
    "hard_constraints_declared": true,
    "security_model_constraint_addressed": true,
    "regulatory_constraint_addressed": true,
    "performance_constraint_addressed": true,
    "offline_constraint_addressed": true,
    "access_patterns_declared": true,
    "usage_patterns_declared": true,
    "team_operability_context_declared": true,
    "decision_framed_as_sticky": true
  },
  "candidate_work": {
    "candidates_compared_against_same_hard_constraints": true,
    "boring_technology_bias_addressed": true,
    "novelty_budget_allocation_declared": true,
    "novelty_spend_tied_to_differentiation_declared": true
  },
  "candidates": [
    {
      "candidate_id": "c1",
      "stack_name": "PostgreSQL",
      "novelty_classification": "proven",
      "evidence_note": "Industry standard",
      "scores": [
        {
          "criterion_id": "perf",
          "score": 10
        }
      ],
      "weighted_total_declared": 10.0
    },
    {
      "candidate_id": "c2",
      "stack_name": "FoundationDB",
      "novelty_classification": "novel",
      "evidence_note": "High throughput",
      "scores": [
        {
          "criterion_id": "perf",
          "score": 8
        }
      ],
      "weighted_total_declared": 8.0
    }
  ],
  "evaluation": {
    "evidence_basis_recorded": true,
    "evaluation_applied_consistently_across_candidates": true
  },
  "criteria": [
    {
      "criterion_id": "perf",
      "criterion_name": "Performance",
      "weight": 1.0
    }
  ],
  "tco": {
    "licensing_cost_addressed": true,
    "operations_burden_addressed": true,
    "learning_curve_addressed": true,
    "lock_in_cost_addressed": true,
    "operability_cost_addressed": true,
    "on_call_operability_owner_declared": true,
    "team_can_operate_declared_stack": true,
    "free_tier_or_free_choice_used": false
  },
  "decision": {
    "decision_recorded": true,
    "chosen_candidate_id": "c1",
    "rationale_recorded": true,
    "rationale_tied_to_hard_constraints": true,
    "rationale_tied_to_evaluation_criteria": true,
    "tradeoffs_of_decision_recorded": true,
    "declared_ranking_candidate_ids": [
      "c1",
      "c2"
    ]
  },
  "reversibility": {
    "exit_cost_assessed": true,
    "exit_path_kept": true,
    "vendor_specific_pieces_isolated_behind_interfaces": true,
    "reversibility_assessed": true
  },
  "red_lines": {
    "framework_of_the_week_chosen_for_novelty_present": false,
    "microservices_for_solo_project_present": false,
    "docker_by_default_choice_present": false,
    "lock_in_with_no_exit_present": false,
    "technology_chosen_to_pad_cv_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "tech-stack-decision-memo",
  "atom_version": "0.1.0",
  "memo_title": "Database Migration Strategy",
  "verdict": "TECH_STACK_DECISION_SOUND",
  "sections": {
    "context_and_constraints": "pass",
    "candidates_and_boring_technology": "pass",
    "evaluation_criteria_and_evidence": "pass",
    "total_cost_and_operability": "pass",
    "decision_and_rationale": "pass",
    "reversibility_and_exit": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_hard_constraints_declared",
      "status": "pass",
      "evidence": "decision frame: the memo declares its hard constraints"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_security_model_constraint_addressed",
      "status": "pass",
      "evidence": "decision frame: the security-model hard constraint is addressed"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_regulatory_constraint_addressed",
      "status": "pass",
      "evidence": "decision frame: the regulatory hard constraint is addressed"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_performance_constraint_addressed",
      "status": "pass",
      "evidence": "decision frame: the performance hard constraint is addressed"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_offline_constraint_addressed",
      "status": "pass",
      "evidence": "decision frame: the offline hard constraint is addressed"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_access_patterns_declared",
      "status": "pass",
      "evidence": "decision frame: the access patterns the stack must serve are declared"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_usage_patterns_declared",
      "status": "pass",
      "evidence": "decision frame: the usage patterns the stack must serve are declared"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_team_operability_context_declared",
      "status": "pass",
      "evidence": "decision frame: the team that must run the stack \u2014 its size and capability \u2014 is declared"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_decision_framed_as_sticky",
      "status": "pass",
      "evidence": "decision frame: the stack choice is framed as sticky \u2014 decided like a one-way door, not fashion"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "tech_stack_memo_candidates_compared_against_same_hard_constraints",
      "status": "pass",
      "evidence": "candidates: every candidate stack was compared against the same declared hard constraints"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "tech_stack_memo_boring_technology_bias_addressed",
      "status": "pass",
      "evidence": "boring-technology bias: the memo addresses preferring proven, well-understood tools for the plumbing"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "tech_stack_memo_novelty_budget_allocation_declared",
      "status": "pass",
      "evidence": "boring-technology bias: the memo declares how its limited novelty budget is allocated"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "tech_stack_memo_novelty_spend_tied_to_differentiation_declared",
      "status": "pass",
      "evidence": "boring-technology bias: any novelty spend is declared tied to where it actually differentiates"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "tech_stack_memo_candidates_list_declared",
      "status": "pass",
      "evidence": "candidates: the declared record names its candidate stacks \u2014 the list is present and names at least two candidates; an absent list is missing evidence and a list of fewer than two declares no comparison at all"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "every_tech_stack_memo_candidate_id_unique",
      "status": "pass",
      "evidence": "candidates: no declared candidate_id is owned by more than one row"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "every_tech_stack_memo_candidate_stack_name_declared",
      "status": "pass",
      "evidence": "candidates: every declared candidate declares a non-empty stack name"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "every_tech_stack_memo_candidate_novelty_classification_recognised",
      "status": "pass",
      "evidence": "candidates: every declared candidate's novelty classification is one of proven, novel \u2014 the two classes the boring-technology bias works with"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "every_tech_stack_memo_candidate_evidence_note_declared",
      "status": "pass",
      "evidence": "candidates: every declared candidate declares a non-empty evidence note"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "tech_stack_memo_evaluation_evidence_basis_recorded",
      "status": "pass",
      "evidence": "evaluation: the evidence basis for the candidate evaluation is recorded"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "tech_stack_memo_evaluation_applied_consistently_across_candidates",
      "status": "pass",
      "evidence": "evaluation: the same criteria and evidence basis were applied consistently across all candidates"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "tech_stack_memo_criteria_list_declared",
      "status": "pass",
      "evidence": "criteria: the declared record names its evaluation criteria \u2014 the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no evaluation at all"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "every_tech_stack_memo_criterion_id_unique",
      "status": "pass",
      "evidence": "criteria: no declared criterion_id is owned by more than one row"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "every_tech_stack_memo_criterion_name_declared",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-empty criterion name"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "every_tech_stack_memo_criterion_weight_non_negative",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-negative weight"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "tech_stack_memo_criteria_weights_sum_positive",
      "status": "pass",
      "evidence": "criteria: the declared criterion weights sum to a positive total \u2014 a memo whose weights sum to zero scores nothing"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "every_tech_stack_memo_candidate_scores_every_declared_criterion",
      "status": "pass",
      "evidence": "scores: every declared candidate scores every declared criterion and no other criterion, exactly once"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "every_tech_stack_memo_candidate_weighted_total_recomputes",
      "status": "pass",
      "evidence": "scores: every declared candidate's declared weighted total recomputes exactly as the sum of declared weight times declared score over its declared scores"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_licensing_cost_addressed",
      "status": "pass",
      "evidence": "total cost of ownership: licensing cost is weighed \u2014 not just the sticker"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_operations_burden_addressed",
      "status": "pass",
      "evidence": "total cost of ownership: operations burden is weighed"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_learning_curve_addressed",
      "status": "pass",
      "evidence": "total cost of ownership: learning curve for the team that must run the stack is weighed"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_lock_in_cost_addressed",
      "status": "pass",
      "evidence": "total cost of ownership: lock-in cost is weighed"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_operability_cost_addressed",
      "status": "pass",
      "evidence": "operability: the operability cost of the stack \u2014 who runs this at 2am \u2014 is addressed"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_on_call_operability_owner_declared",
      "status": "pass",
      "evidence": "operability: the on-call operability owner who runs the stack at 2am is declared"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_team_can_operate_declared_stack",
      "status": "pass",
      "evidence": "operability: the memo declares the team can operate the declared stack"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_hidden_fragility_cost_named_where_free_choice_used",
      "status": "pass",
      "evidence": "no free-tier or free choice declared used"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_decision_recorded",
      "status": "pass",
      "evidence": "decision: the memo records a decision"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_rationale_recorded",
      "status": "pass",
      "evidence": "decision: the memo records the rationale for its decision"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_rationale_tied_to_hard_constraints",
      "status": "pass",
      "evidence": "decision: the recorded rationale is tied to the declared hard constraints"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_rationale_tied_to_evaluation_criteria",
      "status": "pass",
      "evidence": "decision: the recorded rationale is tied to the declared evaluation criteria"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_tradeoffs_of_decision_recorded",
      "status": "pass",
      "evidence": "decision: the trade-offs of the recorded decision are recorded"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_chosen_candidate_resolves_to_declared_candidate",
      "status": "pass",
      "evidence": "decision: the declared chosen candidate id names one of the declared candidates \u2014 the atom checks only that the reference resolves; it never checks that the chosen candidate is the top-ranked or highest-scoring one"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_declared_ranking_matches_declared_candidates",
      "status": "pass",
      "evidence": "decision: the candidate ids in the memo's declared ranking are exactly the declared candidate ids \u2014 none missing, none extra, none duplicated; checking a declared ranking's internal consistency is audit, not advice, and the atom produces no ranking of its own"
    },
    {
      "section": "reversibility_and_exit",
      "check": "tech_stack_memo_exit_cost_assessed",
      "status": "pass",
      "evidence": "reversibility: the exit cost if this choice is wrong is assessed"
    },
    {
      "section": "reversibility_and_exit",
      "check": "tech_stack_memo_exit_path_kept",
      "status": "pass",
      "evidence": "reversibility: an exit path from the chosen stack is kept"
    },
    {
      "section": "reversibility_and_exit",
      "check": "tech_stack_memo_vendor_specific_pieces_isolated_behind_interfaces",
      "status": "pass",
      "evidence": "reversibility: vendor-specific pieces are isolated behind interfaces"
    },
    {
      "section": "reversibility_and_exit",
      "check": "tech_stack_memo_reversibility_assessed",
      "status": "pass",
      "evidence": "reversibility: the reversibility of the stack choice is assessed"
    },
    {
      "section": "red_lines",
      "check": "tech_stack_memo_free_of_framework_of_the_week_chosen_for_novelty",
      "status": "pass",
      "evidence": "red line: no framework-of-the-week chosen for novelty is present in the record"
    },
    {
      "section": "red_lines",
      "check": "tech_stack_memo_free_of_microservices_for_solo_project",
      "status": "pass",
      "evidence": "red line: no microservices architecture for a solo project is present in the record"
    },
    {
      "section": "red_lines",
      "check": "tech_stack_memo_free_of_docker_by_default_choice",
      "status": "pass",
      "evidence": "red line: no Docker-by-default choice is present in the record"
    },
    {
      "section": "red_lines",
      "check": "tech_stack_memo_free_of_lock_in_with_no_exit",
      "status": "pass",
      "evidence": "red line: no lock-in with no exit is present in the record"
    },
    {
      "section": "red_lines",
      "check": "tech_stack_memo_free_of_technology_chosen_to_pad_cv",
      "status": "pass",
      "evidence": "red line: no technology chosen to pad a CV is present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "tech_stack_candidates_count": 2,
  "tech_stack_criteria_count": 1,
  "duplicate_tech_stack_candidate_ids": [],
  "duplicate_tech_stack_criterion_ids": [],
  "duplicate_declared_ranking_candidate_ids": [],
  "tech_stack_candidates_without_stack_name": [],
  "tech_stack_candidates_with_invalid_novelty_classification": [],
  "tech_stack_candidates_without_evidence_note": [],
  "tech_stack_criteria_without_name": [],
  "tech_stack_criteria_with_invalid_weight": [],
  "tech_stack_candidates_with_incomplete_or_extra_scores": [],
  "tech_stack_candidates_with_weighted_total_mismatch": [],
  "tech_stack_candidates_missing_from_declared_ranking": [],
  "declared_ranking_ids_not_declared_as_candidates": [],
  "tech_stack_criteria_weights_sum": "1.000000",
  "candidate_score_coverage_ratio": "1.000000",
  "candidate_weighted_total_match_ratio": "1.000000",
  "candidate_evidence_note_ratio": "1.000000",
  "summary": "51 pass, 0 fail, 0 missing of 51 checks across seven sections.",
  "stamp": "TECH STACK DECISION MEMO\nmemo_title: Database Migration Strategy\nVERDICT: TECH_STACK_DECISION_SOUND\n  context_and_constraints                      pass\n  candidates_and_boring_technology             pass\n  evaluation_criteria_and_evidence             pass\n  total_cost_and_operability                   pass\n  decision_and_rationale                       pass\n  reversibility_and_exit                       pass\n  red_lines                                    pass\n51 pass, 0 fail, 0 missing of 51 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T14:11:00.461606+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/tech-stack-decision-memo/evidence.json`.

Input:

```json
{
  "memo_title": "Database Migration Strategy",
  "context": {
    "hard_constraints_declared": true,
    "security_model_constraint_addressed": true,
    "regulatory_constraint_addressed": true,
    "performance_constraint_addressed": true,
    "offline_constraint_addressed": true,
    "access_patterns_declared": true,
    "usage_patterns_declared": true,
    "team_operability_context_declared": true,
    "decision_framed_as_sticky": true
  },
  "candidate_work": {
    "candidates_compared_against_same_hard_constraints": true,
    "boring_technology_bias_addressed": true,
    "novelty_budget_allocation_declared": true,
    "novelty_spend_tied_to_differentiation_declared": true
  },
  "candidates": [
    {
      "candidate_id": "c1",
      "stack_name": "",
      "novelty_classification": "proven",
      "evidence_note": "Industry standard",
      "scores": [
        {
          "criterion_id": "perf",
          "score": 10
        }
      ],
      "weighted_total_declared": 10.0
    },
    {
      "candidate_id": "c2",
      "stack_name": "FoundationDB",
      "novelty_classification": "unknown",
      "evidence_note": "",
      "scores": [
        {
          "criterion_id": "perf",
          "score": 8
        }
      ],
      "weighted_total_declared": 8.0
    }
  ],
  "evaluation": {
    "evidence_basis_recorded": true,
    "evaluation_applied_consistently_across_candidates": true
  },
  "criteria": [
    {
      "criterion_id": "perf",
      "criterion_name": "Performance",
      "weight": 1.0
    }
  ],
  "tco": {
    "licensing_cost_addressed": true,
    "operations_burden_addressed": true,
    "learning_curve_addressed": true,
    "lock_in_cost_addressed": true,
    "operability_cost_addressed": true,
    "on_call_operability_owner_declared": true,
    "team_can_operate_declared_stack": true,
    "free_tier_or_free_choice_used": false
  },
  "decision": {
    "decision_recorded": true,
    "chosen_candidate_id": "c1",
    "rationale_recorded": true,
    "rationale_tied_to_hard_constraints": true,
    "rationale_tied_to_evaluation_criteria": true,
    "tradeoffs_of_decision_recorded": true,
    "declared_ranking_candidate_ids": [
      "c1",
      "c2"
    ]
  },
  "reversibility": {
    "exit_cost_assessed": true,
    "exit_path_kept": true,
    "vendor_specific_pieces_isolated_behind_interfaces": true,
    "reversibility_assessed": true
  },
  "red_lines": {
    "framework_of_the_week_chosen_for_novelty_present": true,
    "microservices_for_solo_project_present": false,
    "docker_by_default_choice_present": false,
    "lock_in_with_no_exit_present": false,
    "technology_chosen_to_pad_cv_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "tech-stack-decision-memo",
  "atom_version": "0.1.0",
  "memo_title": "Database Migration Strategy",
  "verdict": "TECH_STACK_DECISION_NOT_SOUND",
  "sections": {
    "context_and_constraints": "pass",
    "candidates_and_boring_technology": "fail",
    "evaluation_criteria_and_evidence": "pass",
    "total_cost_and_operability": "pass",
    "decision_and_rationale": "pass",
    "reversibility_and_exit": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_hard_constraints_declared",
      "status": "pass",
      "evidence": "decision frame: the memo declares its hard constraints"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_security_model_constraint_addressed",
      "status": "pass",
      "evidence": "decision frame: the security-model hard constraint is addressed"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_regulatory_constraint_addressed",
      "status": "pass",
      "evidence": "decision frame: the regulatory hard constraint is addressed"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_performance_constraint_addressed",
      "status": "pass",
      "evidence": "decision frame: the performance hard constraint is addressed"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_offline_constraint_addressed",
      "status": "pass",
      "evidence": "decision frame: the offline hard constraint is addressed"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_access_patterns_declared",
      "status": "pass",
      "evidence": "decision frame: the access patterns the stack must serve are declared"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_usage_patterns_declared",
      "status": "pass",
      "evidence": "decision frame: the usage patterns the stack must serve are declared"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_team_operability_context_declared",
      "status": "pass",
      "evidence": "decision frame: the team that must run the stack \u2014 its size and capability \u2014 is declared"
    },
    {
      "section": "context_and_constraints",
      "check": "tech_stack_memo_decision_framed_as_sticky",
      "status": "pass",
      "evidence": "decision frame: the stack choice is framed as sticky \u2014 decided like a one-way door, not fashion"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "tech_stack_memo_candidates_compared_against_same_hard_constraints",
      "status": "pass",
      "evidence": "candidates: every candidate stack was compared against the same declared hard constraints"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "tech_stack_memo_boring_technology_bias_addressed",
      "status": "pass",
      "evidence": "boring-technology bias: the memo addresses preferring proven, well-understood tools for the plumbing"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "tech_stack_memo_novelty_budget_allocation_declared",
      "status": "pass",
      "evidence": "boring-technology bias: the memo declares how its limited novelty budget is allocated"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "tech_stack_memo_novelty_spend_tied_to_differentiation_declared",
      "status": "pass",
      "evidence": "boring-technology bias: any novelty spend is declared tied to where it actually differentiates"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "tech_stack_memo_candidates_list_declared",
      "status": "pass",
      "evidence": "candidates: the declared record names its candidate stacks \u2014 the list is present and names at least two candidates; an absent list is missing evidence and a list of fewer than two declares no comparison at all"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "every_tech_stack_memo_candidate_id_unique",
      "status": "pass",
      "evidence": "candidates: no declared candidate_id is owned by more than one row"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "every_tech_stack_memo_candidate_stack_name_declared",
      "status": "fail",
      "evidence": "candidates: every declared candidate declares a non-empty stack name"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "every_tech_stack_memo_candidate_novelty_classification_recognised",
      "status": "fail",
      "evidence": "candidates: every declared candidate's novelty classification is one of proven, novel \u2014 the two classes the boring-technology bias works with"
    },
    {
      "section": "candidates_and_boring_technology",
      "check": "every_tech_stack_memo_candidate_evidence_note_declared",
      "status": "fail",
      "evidence": "candidates: every declared candidate declares a non-empty evidence note"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "tech_stack_memo_evaluation_evidence_basis_recorded",
      "status": "pass",
      "evidence": "evaluation: the evidence basis for the candidate evaluation is recorded"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "tech_stack_memo_evaluation_applied_consistently_across_candidates",
      "status": "pass",
      "evidence": "evaluation: the same criteria and evidence basis were applied consistently across all candidates"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "tech_stack_memo_criteria_list_declared",
      "status": "pass",
      "evidence": "criteria: the declared record names its evaluation criteria \u2014 the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no evaluation at all"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "every_tech_stack_memo_criterion_id_unique",
      "status": "pass",
      "evidence": "criteria: no declared criterion_id is owned by more than one row"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "every_tech_stack_memo_criterion_name_declared",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-empty criterion name"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "every_tech_stack_memo_criterion_weight_non_negative",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-negative weight"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "tech_stack_memo_criteria_weights_sum_positive",
      "status": "pass",
      "evidence": "criteria: the declared criterion weights sum to a positive total \u2014 a memo whose weights sum to zero scores nothing"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "every_tech_stack_memo_candidate_scores_every_declared_criterion",
      "status": "pass",
      "evidence": "scores: every declared candidate scores every declared criterion and no other criterion, exactly once"
    },
    {
      "section": "evaluation_criteria_and_evidence",
      "check": "every_tech_stack_memo_candidate_weighted_total_recomputes",
      "status": "pass",
      "evidence": "scores: every declared candidate's declared weighted total recomputes exactly as the sum of declared weight times declared score over its declared scores"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_licensing_cost_addressed",
      "status": "pass",
      "evidence": "total cost of ownership: licensing cost is weighed \u2014 not just the sticker"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_operations_burden_addressed",
      "status": "pass",
      "evidence": "total cost of ownership: operations burden is weighed"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_learning_curve_addressed",
      "status": "pass",
      "evidence": "total cost of ownership: learning curve for the team that must run the stack is weighed"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_lock_in_cost_addressed",
      "status": "pass",
      "evidence": "total cost of ownership: lock-in cost is weighed"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_operability_cost_addressed",
      "status": "pass",
      "evidence": "operability: the operability cost of the stack \u2014 who runs this at 2am \u2014 is addressed"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_on_call_operability_owner_declared",
      "status": "pass",
      "evidence": "operability: the on-call operability owner who runs the stack at 2am is declared"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_team_can_operate_declared_stack",
      "status": "pass",
      "evidence": "operability: the memo declares the team can operate the declared stack"
    },
    {
      "section": "total_cost_and_operability",
      "check": "tech_stack_memo_hidden_fragility_cost_named_where_free_choice_used",
      "status": "pass",
      "evidence": "no free-tier or free choice declared used"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_decision_recorded",
      "status": "pass",
      "evidence": "decision: the memo records a decision"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_rationale_recorded",
      "status": "pass",
      "evidence": "decision: the memo records the rationale for its decision"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_rationale_tied_to_hard_constraints",
      "status": "pass",
      "evidence": "decision: the recorded rationale is tied to the declared hard constraints"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_rationale_tied_to_evaluation_criteria",
      "status": "pass",
      "evidence": "decision: the recorded rationale is tied to the declared evaluation criteria"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_tradeoffs_of_decision_recorded",
      "status": "pass",
      "evidence": "decision: the trade-offs of the recorded decision are recorded"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_chosen_candidate_resolves_to_declared_candidate",
      "status": "pass",
      "evidence": "decision: the declared chosen candidate id names one of the declared candidates \u2014 the atom checks only that the reference resolves; it never checks that the chosen candidate is the top-ranked or highest-scoring one"
    },
    {
      "section": "decision_and_rationale",
      "check": "tech_stack_memo_declared_ranking_matches_declared_candidates",
      "status": "pass",
      "evidence": "decision: the candidate ids in the memo's declared ranking are exactly the declared candidate ids \u2014 none missing, none extra, none duplicated; checking a declared ranking's internal consistency is audit, not advice, and the atom produces no ranking of its own"
    },
    {
      "section": "reversibility_and_exit",
      "check": "tech_stack_memo_exit_cost_assessed",
      "status": "pass",
      "evidence": "reversibility: the exit cost if this choice is wrong is assessed"
    },
    {
      "section": "reversibility_and_exit",
      "check": "tech_stack_memo_exit_path_kept",
      "status": "pass",
      "evidence": "reversibility: an exit path from the chosen stack is kept"
    },
    {
      "section": "reversibility_and_exit",
      "check": "tech_stack_memo_vendor_specific_pieces_isolated_behind_interfaces",
      "status": "pass",
      "evidence": "reversibility: vendor-specific pieces are isolated behind interfaces"
    },
    {
      "section": "reversibility_and_exit",
      "check": "tech_stack_memo_reversibility_assessed",
      "status": "pass",
      "evidence": "reversibility: the reversibility of the stack choice is assessed"
    },
    {
      "section": "red_lines",
      "check": "tech_stack_memo_free_of_framework_of_the_week_chosen_for_novelty",
      "status": "fail",
      "evidence": "red line: no framework-of-the-week chosen for novelty is present in the record"
    },
    {
      "section": "red_lines",
      "check": "tech_stack_memo_free_of_microservices_for_solo_project",
      "status": "pass",
      "evidence": "red line: no microservices architecture for a solo project is present in the record"
    },
    {
      "section": "red_lines",
      "check": "tech_stack_memo_free_of_docker_by_default_choice",
      "status": "pass",
      "evidence": "red line: no Docker-by-default choice is present in the record"
    },
    {
      "section": "red_lines",
      "check": "tech_stack_memo_free_of_lock_in_with_no_exit",
      "status": "pass",
      "evidence": "red line: no lock-in with no exit is present in the record"
    },
    {
      "section": "red_lines",
      "check": "tech_stack_memo_free_of_technology_chosen_to_pad_cv",
      "status": "pass",
      "evidence": "red line: no technology chosen to pad a CV is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "tech_stack_candidates_count": 2,
  "tech_stack_criteria_count": 1,
  "duplicate_tech_stack_candidate_ids": [],
  "duplicate_tech_stack_criterion_ids": [],
  "duplicate_declared_ranking_candidate_ids": [],
  "tech_stack_candidates_without_stack_name": [
    "c1"
  ],
  "tech_stack_candidates_with_invalid_novelty_classification": [
    "c2"
  ],
  "tech_stack_candidates_without_evidence_note": [
    "c2"
  ],
  "tech_stack_criteria_without_name": [],
  "tech_stack_criteria_with_invalid_weight": [],
  "tech_stack_candidates_with_incomplete_or_extra_scores": [],
  "tech_stack_candidates_with_weighted_total_mismatch": [],
  "tech_stack_candidates_missing_from_declared_ranking": [],
  "declared_ranking_ids_not_declared_as_candidates": [],
  "tech_stack_criteria_weights_sum": "1.000000",
  "candidate_score_coverage_ratio": "1.000000",
  "candidate_weighted_total_match_ratio": "1.000000",
  "candidate_evidence_note_ratio": "0.500000",
  "summary": "47 pass, 4 fail, 0 missing of 51 checks across seven sections.",
  "stamp": "TECH STACK DECISION MEMO\nmemo_title: Database Migration Strategy\nVERDICT: TECH_STACK_DECISION_NOT_SOUND\n  context_and_constraints                      pass\n  candidates_and_boring_technology             fail\n  evaluation_criteria_and_evidence             pass\n  total_cost_and_operability                   pass\n  decision_and_rationale                       pass\n  reversibility_and_exit                       pass\n  red_lines                                    fail\n47 pass, 4 fail, 0 missing of 51 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T14:11:00.461606+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/tech-stack-decision-memo/evidence.json`.

Input:

```json
{
  "context": "not_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "context",
  "detail": "context must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — this atom was deployed census-style under a U-13 screen classified (b) — screen-NO with flag-with-controls (census class), with the four named controls recorded in SERVICE.md's U-13 section; the flag stays open for the Director's review (see Role views, For regulators) |
| Checks named | 51 documented / 51 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`tech_stack_candidates_count`, `tech_stack_criteria_count`, the three duplicate-id lists, the nine row-name / ranking lists, `tech_stack_criteria_weights_sum`, and the three ratios) |
| Input reference typed | Yes — 64 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/tech-stack-decision-memo/evidence.json` |
