# PRD with testable acceptance criteria — documentation

**PRD with testable acceptance criteria** · slug `prd-with-testable-acceptance-criteria` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/prd-with-testable-acceptance-criteria/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 9595ea665b634289aad158b7fff277ac). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `product` "Test Product"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "prd-with-testable-acceptance-criteria"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the PRD manifest.** You declare a record of a product requirements document (PRD) for one product or feature, made at the specification stage before build — the atom audits the declared record, it does not write the PRD or inspect any product (see Explanation). The recorded full-pass manifest declares the product `Test Product`: the problem stated, who has it and why now all declared, a declared problem-statement sentence count of `3`, and the problem addressed before any solution; the observable outcome change defined and expressed as a behaviour or metric, not a feature only; one story `S1` (role `User`, capability `Login`, benefit `Access`, priority `P0`); one acceptance criterion `AC1` traced to `S1` and declared both testable and binary; out-of-scope items `["Legacy support"]`; all scope, priorities, decisions, open-question-tracking and approval declarations `true`; `open_questions` declared as the empty list `[]` (the PRD tracks no open questions); and all three red-line flags `false` (no build started before an approved spec, no unlabeled spike treated as an approved spec, no scope widened mid-phase without a PRD update and re-approval).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/prd-with-testable-acceptance-criteria` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY`: "38 pass, 0 fail, 0 missing of 38 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `problem_statement_sentence_count` is 3, `stories_count` is 1, `acceptance_criteria_count` is 1, `p0_story_count` is 1, `out_of_scope_items_count` is 1, `open_questions_count` is 0, and `story_criteria_coverage`, `testable_criteria_coverage` and `binary_criteria_coverage` are each `"1.000000"`, with every row-name list empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "prd-with-testable-acceptance-criteria"}`.
3. Call: `POST https://atoms.pipavia.com/v1/prd-with-testable-acceptance-criteria` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/prd-with-testable-acceptance-criteria` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `prd_with_testable_acceptance_criteria`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 5 checks fail: `problem_statement_within_five_sentences`, `every_prd_story_priority_is_p0_p1_or_p2`, `every_acceptance_criterion_declared_testable`, `no_misc_bucket_in_out_of_scope_items`, `no_build_before_approved_spec`, and the summary reads "33 pass, 5 fail, 0 missing of 38 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `problem.statement_sentence_count` is declared `10`, failing `problem_statement_within_five_sentences` against the skill's stated limit of five sentences or fewer; `stories[0].priority` is declared `"P99"`, failing `every_prd_story_priority_is_p0_p1_or_p2`, and `p0_story_count` falls to `0`; `acceptance_criteria[0].testable_declared` is declared `false`, failing `every_acceptance_criterion_declared_testable`, and `testable_criteria_coverage` is `"0.000000"`; `out_of_scope_items` is `["misc"]`, failing `no_misc_bucket_in_out_of_scope_items`, with `misc_bucket_items` naming `["misc"]`; and `red_lines.build_started_before_approved_spec_present` is declared `true`, failing `no_build_before_approved_spec`; sections `problem_and_outcome`, `stories_and_acceptance_criteria`, `scope_fences` and `red_lines` report `fail`, `priorities_and_decisions` and `open_questions_and_approval` report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "problem",
  "detail": "problem must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/prd-with-testable-acceptance-criteria` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/prd-with-testable-acceptance-criteria` — tool name `prd_with_testable_acceptance_criteria`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `prd_with_testable_acceptance_criteria` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `product`, the row `id` / tracing / story-form / priority string fields are noted as strings, `problem.statement_sentence_count` as a number, and `stories`, `acceptance_criteria`, `out_of_scope_items` (a list of strings) and `open_questions` as lists there. Where SERVICE.md states no type — the section container objects (`problem`, `outcome`, `scope`, `priorities`, `decisions`, `open_question_tracking`, `approval`, `red_lines`) and the row objects (`stories[]`, `acceptance_criteria[]`, `open_questions[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the lists, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `stories`, `acceptance_criteria`, `out_of_scope_items` and `open_questions` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `product` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: problem_and_outcome

| Field | Type | Notes |
|---|---|---|
| `problem` | object | The problem section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `problem.statement_declared` | boolean | — |
| `problem.who_has_it_declared` | boolean | — |
| `problem.why_now_declared` | boolean | — |
| `problem.statement_sentence_count` | number | Computed, see below: passes when between 1 and 5 inclusive, against the skill's stated limit of five sentences or fewer; the count is the caller's declaration — the atom never parses or counts prose itself (type stated in SERVICE.md) |
| `problem.problem_first_before_solution_declared` | boolean | — |
| `outcome` | object | The outcome section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `outcome.observable_change_defined` | boolean | — |
| `outcome.outcome_is_behavior_or_metric_not_feature_only` | boolean | — |

#### Read by: stories_and_acceptance_criteria

| Field | Type | Notes |
|---|---|---|
| `stories` | list | list of story-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `stories[]` | object | One declared story row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `stories[].id` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `stories[].role` | string | The `<role>` of the story form; must be present and non-empty per row (type stated in SERVICE.md) |
| `stories[].capability` | string | The `<capability>` of the story form; must be present and non-empty per row (type stated in SERVICE.md) |
| `stories[].benefit` | string | The `<benefit>` of the story form; must be present and non-empty per row (type stated in SERVICE.md) |
| `stories[].priority` | string | Must be present per row and one of `P0`, `P1`, `P2` (type stated in SERVICE.md) |
| `acceptance_criteria` | list | list of criterion-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `acceptance_criteria[]` | object | One declared criterion row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `acceptance_criteria[].id` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `acceptance_criteria[].story_id` | string | The declared story the criterion accepts; must name a declared story (type stated in SERVICE.md) |
| `acceptance_criteria[].testable_declared` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `acceptance_criteria[].binary_declared` | boolean | Must be `true` per row (type stated in SERVICE.md) |

#### Read by: scope_fences

| Field | Type | Notes |
|---|---|---|
| `out_of_scope_items` | list of strings | Computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `scope` | object | The scope section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `scope.explicit_out_of_scope_list_declared` | boolean | — |
| `scope.explicit_scope_boundaries_declared` | boolean | — |
| `scope.deferrals_placed_in_later_list` | boolean | — |
| `scope.deferrals_not_silently_inside_scope` | boolean | — |

#### Read by: priorities_and_decisions

| Field | Type | Notes |
|---|---|---|
| `priorities` | object | The priorities section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `priorities.priority_scheme_p0_p1_p2_applied` | boolean | — |
| `priorities.priority_tiers_applied_in_shipping_order` | boolean | — |
| `priorities.p0_items_shippable_alone_declared` | boolean | — |
| `priorities.priority_conflicts_resolved_with_decision_owner` | boolean | — |
| `decisions` | object | The decisions section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `decisions.decision_owner_named` | boolean | — |
| `decisions.key_decisions_logged_in_prd` | boolean | — |

#### Read by: open_questions_and_approval

| Field | Type | Notes |
|---|---|---|
| `open_questions` | list | list of open-question-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `open_questions[]` | object | One declared open-question row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `open_questions[].id` | string | Names the row (type stated in SERVICE.md) |
| `open_questions[].architecture_changing` | boolean | Whether the question changes architecture (type stated in SERVICE.md) |
| `open_questions[].blocks_build` | boolean | Must equal `architecture_changing` per row (type stated in SERVICE.md) |
| `open_question_tracking` | object | The open-question-tracking section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `open_question_tracking.tracked_explicitly` | boolean | — |
| `open_question_tracking.architecture_changing_questions_block_build` | boolean | — |
| `open_question_tracking.non_architecture_questions_do_not_block_build` | boolean | — |
| `approval` | object | The approval section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `approval.approved_spec_declared` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.build_started_before_approved_spec_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unlabeled_spike_treated_as_approved_spec_present` | boolean | must be `false` to pass — skill red line exception shape |
| `red_lines.scope_widened_mid_phase_without_prd_update_and_reapproval_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 38 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: problem_and_outcome

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `problem_statement_declared` | problem first: the problem is stated in the PRD | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `problem_who_has_it_declared` | problem first: the PRD states who has the problem | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `problem_why_now_declared` | problem first: the PRD states why now | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `problem_statement_within_five_sentences` | problem first: the problem statement is five sentences or fewer, on the declared sentence count | Computed over the declared record. Pass: the declared `problem.statement_sentence_count` is between 1 and 5 inclusive — the skill's own stated limit, checked only against the declared count. Fail: the declared count is present but outside 1–5. Missing: the count is absent. |
| `problem_considered_before_solution` | problem first: the problem is addressed before any solution or feature | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `observable_outcome_defined` | outcome over output: the observable change the PRD aims at is defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `outcome_expressed_as_behavior_or_metric` | outcome over output: the outcome is expressed as a behavior or metric, not just a feature | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: stories_and_acceptance_criteria

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `prd_stories_declared` | stories: the declared PRD record names its user stories — the stories list is present and non-empty | Computed over the declared record. Pass: the `stories` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_prd_story_states_role_capability_and_benefit` | stories: every declared story states its role, capability and benefit — As a <role>, I want <capability>, so that <benefit> | Computed over the declared record. Pass: every declared story row states a non-empty `role`, `capability` and `benefit` string. Fail: a row names a field present but empty. Missing: the list is absent, or a row has one of the three fields absent. |
| `every_prd_story_id_unique_and_nonempty` | stories: every declared story carries a non-empty id, and no story id is declared twice | Computed over the declared record. Pass: every declared story row carries a non-empty `id` and no `id` appears on more than one row. Fail: a row declares an empty `id`, or an `id` is declared on more than one row (duplicates are named in `duplicate_story_ids`). Missing: the list is absent, or a row has `id` absent. |
| `every_prd_story_priority_is_p0_p1_or_p2` | prioritize: every declared story carries one of the skill's stated priorities — P0 (must ship), P1 (should) or P2 (could) | Computed over the declared record. Pass: every declared story row's `priority` is one of `P0`, `P1` or `P2`. Fail: a row declares any other value. Missing: the list is absent, or a row has `priority` absent. |
| `acceptance_criteria_declared` | acceptance criteria: the declared PRD record names its acceptance criteria — the acceptance_criteria list is present and non-empty | Computed over the declared record. Pass: the `acceptance_criteria` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_story_has_acceptance_criteria` | quality gate: every story has acceptance criteria — every declared story is traced to by at least one declared criterion | Computed over the declared record. Pass: every declared story is named as the `story_id` of at least one declared criterion row. Fail: a declared story is named by no criterion row (offending stories are named in `stories_without_criteria`). Missing: either list is absent, or a story or criterion row has its tracing field (`id` / `story_id`) absent — a story with `id` absent does not appear in `stories_without_criteria`. |
| `every_acceptance_criterion_traces_to_declared_story` | acceptance criteria: every declared criterion traces to a declared story | Computed over the declared record. Pass: every declared criterion row's `story_id` names a declared story. Fail: a row's `story_id` is present but names no declared story (offending criteria are named in `criteria_without_declared_story`). Missing: either list is absent, or a row has `story_id` absent. |
| `every_acceptance_criterion_id_unique_and_nonempty` | acceptance criteria: every declared criterion carries a non-empty id, and no criterion id is declared twice | Computed over the declared record. Pass: every declared criterion row carries a non-empty `id` and no `id` appears on more than one row. Fail: a row declares an empty `id`, or an `id` is declared on more than one row (duplicates are named in `duplicate_criterion_ids`). Missing: the list is absent, or a row has `id` absent. |
| `every_acceptance_criterion_declared_testable` | acceptance criteria: every declared criterion is declared testable — if it can't be tested, it's not a criterion | Computed over the declared record. Pass: every declared criterion row declares `testable_declared` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `every_acceptance_criterion_declared_binary` | acceptance criteria: every declared criterion is declared binary — it passes or it fails, with no middle state | Computed over the declared record. Pass: every declared criterion row declares `binary_declared` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |

#### Section: scope_fences

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `out_of_scope_items_declared` | scope fences: the declared PRD record names its out-of-scope items — the out_of_scope_items list is present and non-empty | Computed over the declared record. Pass: the `out_of_scope_items` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `no_misc_bucket_in_out_of_scope_items` | quality gate: the out-of-scope list carries no "misc" bucket | Computed over the declared record. Pass: no declared entry's trimmed, lower-cased text is exactly `misc` (an entry such as `miscellaneous` is not the bucket). Fail: a declared entry is the `misc` bucket (offending entries are named, spelled as declared, in `misc_bucket_items`). Missing: the list is absent. |
| `explicit_out_of_scope_list_declared` | scope fences: an explicit out-of-scope list is declared in the PRD | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `explicit_scope_boundaries_declared` | scope fences: the PRD's scope boundaries are declared explicitly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deferrals_placed_in_later_list` | scope fences: deferrals go to a "later" list | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deferrals_not_silently_inside_scope` | scope fences: no deferral sits silently inside the scope | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: priorities_and_decisions

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `priority_scheme_p0_p1_p2_applied` | prioritize: the P0 (must ship) / P1 (should) / P2 (could) scheme is applied in the PRD | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `priority_tiers_applied_in_shipping_order` | prioritize: the priority tiers are applied in shipping order — P0 before P1 before P2 | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `p0_stories_shippable_alone` | quality gate: P0 items are shippable alone | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `priority_conflicts_resolved_with_decision_owner` | prioritize: priority conflicts are resolved with the decision owner | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `prd_decision_owner_named` | prioritize: the PRD's decision owner is named | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `prd_key_decisions_recorded` | quality gate: key decisions are logged in the PRD record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: open_questions_and_approval

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `open_questions_declared` | open questions: the declared PRD record names its open questions — the open_questions list is present; an empty list declares that the PRD tracks no open questions | Computed over the declared record. Pass: the `open_questions` list is present — an empty list passes, because it declares that the PRD tracks no open questions. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_open_question_block_flag_matches_architecture_impact` | open questions: on every declared question row, blocking build matches changing architecture — questions block build only on questions that change architecture | Computed over the declared record. Pass: on every declared row `blocks_build` equals `architecture_changing` — on an empty list the check passes vacuously. Fail: a row's flags disagree. Missing: the list is absent, or a row has either field absent. |
| `open_questions_tracked_explicitly` | open questions: open questions are tracked explicitly in the PRD | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `architecture_changing_open_questions_block_build` | open questions: a question that changes architecture blocks build | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `non_architecture_open_questions_do_not_block_build` | open questions: a question that does not change architecture does not block build | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `spec_approved_for_build` | approved spec: the PRD is declared approved — nothing enters build without an approved spec | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_build_before_approved_spec` | red line: no build started before an approved spec is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_unlabeled_spike_as_spec_exception` | red line: no unlabeled spike treated as an approved spec is present in the record — spike exceptions are timeboxed and labeled as such | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_scope_widening_without_prd_update_and_reapproval` | red line: no scope widened mid-phase without updating the PRD and re-approval is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"prd-with-testable-acceptance-criteria"`), `atom_version` (`"0.1.0"`), and `product` (the manifest's declared product value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `problem_statement_sentence_count` (the declared count, or null when it is not declared); `stories_count`, `acceptance_criteria_count`, `out_of_scope_items_count` and `open_questions_count` (the declared list lengths as integers, or null when a list is not declared); `p0_story_count` (declared stories whose priority is exactly `P0`); `architecture_changing_open_questions_count` and `blocking_open_questions_count` (declared question rows whose respective flag is true); the row-name lists `stories_without_criteria` (declared stories no criterion traces to; a story with `id` absent is missing evidence and does not appear), `criteria_without_declared_story` (criteria whose `story_id` is present but names no declared story), `duplicate_story_ids` and `duplicate_criterion_ids` (ids declared on more than one row, in the order their second occurrence appears) and `misc_bucket_items` (the declared out-of-scope entries that are the `"misc"` bucket, spelled as declared) — the counts and lists in this group are null when the list they are computed from is not declared, as recorded in the sparse case; and the ratios `story_criteria_coverage` (stories traced to by at least one criterion ÷ declared stories), `testable_criteria_coverage` (criteria declared testable ÷ declared criteria) and `binary_criteria_coverage` (criteria declared binary ÷ declared criteria) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty (and, for `story_criteria_coverage`, when either tracing list is absent). Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; comparisons use the unrounded values — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "38 pass, 0 fail, 0 missing of 38 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared product value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY` — all 38 checks pass: the declared PRD record is complete and consistent with the bound skill's checklist, quality gates and red lines.
- `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the fifteen primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `problem_statement_sentence_count`, `stories_count`, `acceptance_criteria_count`, `p0_story_count`, `stories_without_criteria`, `criteria_without_declared_story`, `duplicate_story_ids`, `duplicate_criterion_ids`, `story_criteria_coverage`, `testable_criteria_coverage`, `binary_criteria_coverage`, `out_of_scope_items_count`, `misc_bucket_items`, `open_questions_count`, `architecture_changing_open_questions_count`, `blocking_open_questions_count` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"problem","detail":"problem must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Turn a fuzzy idea into an approved PRD — user stories, acceptance criteria, scope boundaries, and priorities (the bound capability, from the skill). You submit one declared record — the PRD manifest, made at the specification stage before build — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 6 sections (`problem_and_outcome`, `stories_and_acceptance_criteria`, `scope_fences`, `priorities_and_decisions`, `open_questions_and_approval`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows and fields themselves — the declared problem-statement count must lie between 1 and 5 inclusive, the `stories`, `acceptance_criteria` and `out_of_scope_items` lists must each be present and non-empty, every story row must state a non-empty role / capability / benefit, carry a unique non-empty `id` and a `P0` / `P1` / `P2` priority, every story must be traced to by at least one criterion and every criterion must trace back to a declared story with a unique non-empty `id` and declared testable and binary flags, no out-of-scope entry may be the `"misc"` bucket, the `open_questions` list must be present (an empty list passes), and on every open-question row `blocks_build` must equal `architecture_changing` — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states exactly one numeric limit — the problem statement at five sentences or fewer — and it is checked only against the caller's declared sentence count, never as prose the atom parses. No other numeric threshold is stated. Declined, named: a problem statement length in words or characters, or a sentence limit other than the skill's stated five; a minimum or maximum number of stories, or of acceptance criteria per story beyond the quality gate's every-story-has-criteria completeness; a required priority mix (for example a minimum number or share of P0 stories — P0 rows are counted and reported, never quota'd); a story-point, effort or duration estimate per story or for the PRD; a maximum number of open questions, or a deadline by which they must close; a testability or binary score beyond each criterion's own declared flags; a required wording template for a criterion beyond testable-and-binary (given/when/then is stated by the skill as "fine" — permitted, never required — so its syntax is not parsed or mandated); an approval quorum, approver seniority, or approval expiry; a spike duration beyond a spike being timeboxed and labeled as declared. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** PRD record: a verdict of `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY` means the record is complete and consistent *on the caller's declared evidence* — a record that declares testable and binary criteria, an approved spec, and no build started early passes those checks even if the real specification did none of it. It is a completeness and consistency audit of the PRD record the skill requires, **not a product-management service, a test-execution service, an approval authority, or a prediction that the product will succeed**. Specifically: it writes no PRD itself, interviews no user, runs no test against any criterion, inspects no product, repository, or approval system, and does not verify that a declared PRD was ever approved, built from, or shipped. It never judges whether the stated problem is the real problem, whether a criterion declared testable can actually be tested in practice, whether the stories are the right stories, or whether the priorities are wise — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared story, criterion and open-question rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated five-sentence limit, itself checked only against a declared count (see the declined list above); no parsing of prose — story and criterion text is never read for meaning, the story form is checked only as the declared role/capability/benefit fields being present and non-empty; no live verification of any declared fact; no judgment of PRD *quality* — whether the problem framing, the outcome, or the scope fences are adequate for the real product is the caller's declaration, checked only for declared presence and consistency; approval substance (whether the approval was given by someone entitled to give it, or is still current) is a caller declaration — only its declared presence is checked.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Specifying products before build phases (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared PRD record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly (U-13 regulatory screen) that its output could not read as regulated professional advice, that it offers no engineering, financial, medical, psychological, or legal advice, and that it takes no position on the product the PRD specifies. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `prd_with_testable_acceptance_criteria` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/prd_with_testable_acceptance_criteria.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_prd_with_testable_acceptance_criteria.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/prd-with-testable-acceptance-criteria` (REST) and `POST /mcp/prd-with-testable-acceptance-criteria` (MCP, tool `prd_with_testable_acceptance_criteria`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 9595ea665b634289aad158b7fff277ac). Key scope: `prd_with_testable_acceptance_criteria`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 9595ea665b634289aad158b7fff277ac) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** many recorded check names are not the input field names they read. In `problem_and_outcome`: `problem_statement_declared` reads `problem.statement_declared`, `problem_statement_within_five_sentences` reads `problem.statement_sentence_count`, `problem_considered_before_solution` reads `problem.problem_first_before_solution_declared`, `observable_outcome_defined` reads `outcome.observable_change_defined`, and `outcome_expressed_as_behavior_or_metric` reads `outcome.outcome_is_behavior_or_metric_not_feature_only`. In `stories_and_acceptance_criteria` the computed checks `prd_stories_declared`, `every_prd_story_states_role_capability_and_benefit`, `every_prd_story_id_unique_and_nonempty` and `every_prd_story_priority_is_p0_p1_or_p2` read the `stories` rows, `acceptance_criteria_declared` reads the `acceptance_criteria` list, and `every_story_has_acceptance_criteria`, `every_acceptance_criterion_traces_to_declared_story`, `every_acceptance_criterion_id_unique_and_nonempty`, `every_acceptance_criterion_declared_testable` and `every_acceptance_criterion_declared_binary` read the criterion rows and their tracing fields, rather than any single input field of the same name. In `scope_fences`, `out_of_scope_items_declared` and `no_misc_bucket_in_out_of_scope_items` read the `out_of_scope_items` list and its entries (the other `scope.*` checks match the leaf name of the field they read). In `priorities_and_decisions`: `p0_stories_shippable_alone` reads `priorities.p0_items_shippable_alone_declared`, `prd_decision_owner_named` reads `decisions.decision_owner_named`, and `prd_key_decisions_recorded` reads `decisions.key_decisions_logged_in_prd`. In `open_questions_and_approval`: `open_questions_declared` reads the `open_questions` list, `every_open_question_block_flag_matches_architecture_impact` reads the rows' `blocks_build` / `architecture_changing` pair, `open_questions_tracked_explicitly` reads `open_question_tracking.tracked_explicitly`, `architecture_changing_open_questions_block_build` reads `open_question_tracking.architecture_changing_questions_block_build`, `non_architecture_open_questions_do_not_block_build` reads `open_question_tracking.non_architecture_questions_do_not_block_build`, and `spec_approved_for_build` reads `approval.approved_spec_declared`. In `red_lines` all three recorded check names differ from their fields: `no_build_before_approved_spec` (input `red_lines.build_started_before_approved_spec_present`), `no_unlabeled_spike_as_spec_exception` (input `red_lines.unlabeled_spike_treated_as_approved_spec_present`) and `no_scope_widening_without_prd_update_and_reapproval` (input `red_lines.scope_widened_mid_phase_without_prd_update_and_reapproval_present`). Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`problem`, `outcome`, `scope`, `priorities`, `decisions`, `open_question_tracking`, `approval`, `red_lines`) or for a row object (`stories[]`, `acceptance_criteria[]`, `open_questions[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the lists, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 38 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `problem` and `outcome` inputs are read by the single recorded section `problem_and_outcome`; `stories` and `acceptance_criteria` inputs by `stories_and_acceptance_criteria`; `out_of_scope_items` and `scope` inputs by `scope_fences`; `priorities` and `decisions` inputs by `priorities_and_decisions`; and `open_questions`, `open_question_tracking` and `approval` inputs by `open_questions_and_approval`. Only `red_lines` maps one-to-one. This document groups the Input reference and the Checks by the recorded section names.
6. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, `problem_statement_sentence_count`, the four declared list-length counts and the coverage ratios, but does not state a null rule for `p0_story_count`, `architecture_changing_open_questions_count` or `blocking_open_questions_count`, nor for the row-name / bucket lists `stories_without_criteria`, `criteria_without_declared_story`, `duplicate_story_ids`, `duplicate_criterion_ids` and `misc_bucket_items`. The recorded sparse response returns all of them as `null` when the list they are computed from is not declared (as the Output format section records); this document follows the recording.
7. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (8 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named five prose phrases / an input field path instead of exact check names — `Problem statement within five sentences`, `Story priority is P0, P1 or P2`, `Every criterion declared testable`, `No "misc" bucket in the out-of-scope items` and `red_lines.build_started_before_approved_spec_present` (R1 ×5); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); and the designed violations input was missing 25 key paths present in the full-pass manifest (R3 ×1). The final `cases.json` inputs and expects were compared with the recorded executions in evidence.json and match them exactly; where the corrected-away design prose differed, the recorded responses govern.
8. **Deployment id not in evidence.json:** evidence.json records the gateway base, version (`1.1.0`) and health status, but no deployment id; the deployment id `9595ea665b634289aad158b7fff277ac` used in this document's header and Ops view is the one asserted in TEST-REPORT.md. No other source in the atom's record carries it.

## Worked examples

Provenance: recorded 2026-11-16T09:45:52.752027+00:00 against gateway v1.1.0, external verification lane, source `verification/work/prd-with-testable-acceptance-criteria/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T09:45:52.752027+00:00 · gateway v1.1.0 · source `verification/work/prd-with-testable-acceptance-criteria/evidence.json`.

Input:

```json
{
  "product": "Test Product",
  "problem": {
    "statement_declared": true,
    "who_has_it_declared": true,
    "why_now_declared": true,
    "statement_sentence_count": 3,
    "problem_first_before_solution_declared": true
  },
  "outcome": {
    "observable_change_defined": true,
    "outcome_is_behavior_or_metric_not_feature_only": true
  },
  "stories": [
    {
      "id": "S1",
      "role": "User",
      "capability": "Login",
      "benefit": "Access",
      "priority": "P0"
    }
  ],
  "acceptance_criteria": [
    {
      "id": "AC1",
      "story_id": "S1",
      "testable_declared": true,
      "binary_declared": true
    }
  ],
  "out_of_scope_items": [
    "Legacy support"
  ],
  "scope": {
    "explicit_out_of_scope_list_declared": true,
    "explicit_scope_boundaries_declared": true,
    "deferrals_placed_in_later_list": true,
    "deferrals_not_silently_inside_scope": true
  },
  "priorities": {
    "priority_scheme_p0_p1_p2_applied": true,
    "priority_tiers_applied_in_shipping_order": true,
    "p0_items_shippable_alone_declared": true,
    "priority_conflicts_resolved_with_decision_owner": true
  },
  "decisions": {
    "decision_owner_named": true,
    "key_decisions_logged_in_prd": true
  },
  "open_questions": [],
  "open_question_tracking": {
    "tracked_explicitly": true,
    "architecture_changing_questions_block_build": true,
    "non_architecture_questions_do_not_block_build": true
  },
  "approval": {
    "approved_spec_declared": true
  },
  "red_lines": {
    "build_started_before_approved_spec_present": false,
    "unlabeled_spike_treated_as_approved_spec_present": false,
    "scope_widened_mid_phase_without_prd_update_and_reapproval_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "prd-with-testable-acceptance-criteria",
  "atom_version": "0.1.0",
  "product": "Test Product",
  "verdict": "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY",
  "sections": {
    "problem_and_outcome": "pass",
    "stories_and_acceptance_criteria": "pass",
    "scope_fences": "pass",
    "priorities_and_decisions": "pass",
    "open_questions_and_approval": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "problem_and_outcome",
      "check": "problem_statement_declared",
      "status": "pass",
      "evidence": "problem first: the problem is stated in the PRD"
    },
    {
      "section": "problem_and_outcome",
      "check": "problem_who_has_it_declared",
      "status": "pass",
      "evidence": "problem first: the PRD states who has the problem"
    },
    {
      "section": "problem_and_outcome",
      "check": "problem_why_now_declared",
      "status": "pass",
      "evidence": "problem first: the PRD states why now"
    },
    {
      "section": "problem_and_outcome",
      "check": "problem_statement_within_five_sentences",
      "status": "pass",
      "evidence": "problem first: the problem statement is five sentences or fewer, on the declared sentence count"
    },
    {
      "section": "problem_and_outcome",
      "check": "problem_considered_before_solution",
      "status": "pass",
      "evidence": "problem first: the problem is addressed before any solution or feature"
    },
    {
      "section": "problem_and_outcome",
      "check": "observable_outcome_defined",
      "status": "pass",
      "evidence": "outcome over output: the observable change the PRD aims at is defined"
    },
    {
      "section": "problem_and_outcome",
      "check": "outcome_expressed_as_behavior_or_metric",
      "status": "pass",
      "evidence": "outcome over output: the outcome is expressed as a behavior or metric, not just a feature"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "prd_stories_declared",
      "status": "pass",
      "evidence": "stories: the declared PRD record names its user stories — the stories list is present and non-empty"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_prd_story_states_role_capability_and_benefit",
      "status": "pass",
      "evidence": "stories: every declared story states its role, capability and benefit — As a <role>, I want <capability>, so that <benefit>"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_prd_story_id_unique_and_nonempty",
      "status": "pass",
      "evidence": "stories: every declared story carries a non-empty id, and no story id is declared twice"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_prd_story_priority_is_p0_p1_or_p2",
      "status": "pass",
      "evidence": "prioritize: every declared story carries one of the skill's stated priorities — P0 (must ship), P1 (should) or P2 (could)"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "acceptance_criteria_declared",
      "status": "pass",
      "evidence": "acceptance criteria: the declared PRD record names its acceptance criteria — the acceptance_criteria list is present and non-empty"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_story_has_acceptance_criteria",
      "status": "pass",
      "evidence": "quality gate: every story has acceptance criteria — every declared story is traced to by at least one declared criterion"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_acceptance_criterion_traces_to_declared_story",
      "status": "pass",
      "evidence": "acceptance criteria: every declared criterion traces to a declared story"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_acceptance_criterion_id_unique_and_nonempty",
      "status": "pass",
      "evidence": "acceptance criteria: every declared criterion carries a non-empty id, and no criterion id is declared twice"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_acceptance_criterion_declared_testable",
      "status": "pass",
      "evidence": "acceptance criteria: every declared criterion is declared testable — if it can't be tested, it's not a criterion"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_acceptance_criterion_declared_binary",
      "status": "pass",
      "evidence": "acceptance criteria: every declared criterion is declared binary — it passes or it fails, with no middle state"
    },
    {
      "section": "scope_fences",
      "check": "out_of_scope_items_declared",
      "status": "pass",
      "evidence": "scope fences: the declared PRD record names its out-of-scope items — the out_of_scope_items list is present and non-empty"
    },
    {
      "section": "scope_fences",
      "check": "no_misc_bucket_in_out_of_scope_items",
      "status": "pass",
      "evidence": "quality gate: the out-of-scope list carries no \"misc\" bucket"
    },
    {
      "section": "scope_fences",
      "check": "explicit_out_of_scope_list_declared",
      "status": "pass",
      "evidence": "scope fences: an explicit out-of-scope list is declared in the PRD"
    },
    {
      "section": "scope_fences",
      "check": "explicit_scope_boundaries_declared",
      "status": "pass",
      "evidence": "scope fences: the PRD's scope boundaries are declared explicitly"
    },
    {
      "section": "scope_fences",
      "check": "deferrals_placed_in_later_list",
      "status": "pass",
      "evidence": "scope fences: deferrals go to a \"later\" list"
    },
    {
      "section": "scope_fences",
      "check": "deferrals_not_silently_inside_scope",
      "status": "pass",
      "evidence": "scope fences: no deferral sits silently inside the scope"
    },
    {
      "section": "priorities_and_decisions",
      "check": "priority_scheme_p0_p1_p2_applied",
      "status": "pass",
      "evidence": "prioritize: the P0 (must ship) / P1 (should) / P2 (could) scheme is applied in the PRD"
    },
    {
      "section": "priorities_and_decisions",
      "check": "priority_tiers_applied_in_shipping_order",
      "status": "pass",
      "evidence": "prioritize: the priority tiers are applied in shipping order — P0 before P1 before P2"
    },
    {
      "section": "priorities_and_decisions",
      "check": "p0_stories_shippable_alone",
      "status": "pass",
      "evidence": "quality gate: P0 items are shippable alone"
    },
    {
      "section": "priorities_and_decisions",
      "check": "priority_conflicts_resolved_with_decision_owner",
      "status": "pass",
      "evidence": "prioritize: priority conflicts are resolved with the decision owner"
    },
    {
      "section": "priorities_and_decisions",
      "check": "prd_decision_owner_named",
      "status": "pass",
      "evidence": "prioritize: the PRD's decision owner is named"
    },
    {
      "section": "priorities_and_decisions",
      "check": "prd_key_decisions_recorded",
      "status": "pass",
      "evidence": "quality gate: key decisions are logged in the PRD record"
    },
    {
      "section": "open_questions_and_approval",
      "check": "open_questions_declared",
      "status": "pass",
      "evidence": "open questions: the declared PRD record names its open questions — the open_questions list is present; an empty list declares that the PRD tracks no open questions"
    },
    {
      "section": "open_questions_and_approval",
      "check": "every_open_question_block_flag_matches_architecture_impact",
      "status": "pass",
      "evidence": "open questions: on every declared question row, blocking build matches changing architecture — questions block build only on questions that change architecture"
    },
    {
      "section": "open_questions_and_approval",
      "check": "open_questions_tracked_explicitly",
      "status": "pass",
      "evidence": "open questions: open questions are tracked explicitly in the PRD"
    },
    {
      "section": "open_questions_and_approval",
      "check": "architecture_changing_open_questions_block_build",
      "status": "pass",
      "evidence": "open questions: a question that changes architecture blocks build"
    },
    {
      "section": "open_questions_and_approval",
      "check": "non_architecture_open_questions_do_not_block_build",
      "status": "pass",
      "evidence": "open questions: a question that does not change architecture does not block build"
    },
    {
      "section": "open_questions_and_approval",
      "check": "spec_approved_for_build",
      "status": "pass",
      "evidence": "approved spec: the PRD is declared approved — nothing enters build without an approved spec"
    },
    {
      "section": "red_lines",
      "check": "no_build_before_approved_spec",
      "status": "pass",
      "evidence": "red line: no build started before an approved spec is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_unlabeled_spike_as_spec_exception",
      "status": "pass",
      "evidence": "red line: no unlabeled spike treated as an approved spec is present in the record — spike exceptions are timeboxed and labeled as such"
    },
    {
      "section": "red_lines",
      "check": "no_scope_widening_without_prd_update_and_reapproval",
      "status": "pass",
      "evidence": "red line: no scope widened mid-phase without updating the PRD and re-approval is present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "problem_statement_sentence_count": 3,
  "stories_count": 1,
  "acceptance_criteria_count": 1,
  "p0_story_count": 1,
  "stories_without_criteria": [],
  "criteria_without_declared_story": [],
  "duplicate_story_ids": [],
  "duplicate_criterion_ids": [],
  "story_criteria_coverage": "1.000000",
  "testable_criteria_coverage": "1.000000",
  "binary_criteria_coverage": "1.000000",
  "out_of_scope_items_count": 1,
  "misc_bucket_items": [],
  "open_questions_count": 0,
  "architecture_changing_open_questions_count": 0,
  "blocking_open_questions_count": 0,
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across six sections.",
  "stamp": "PRD WITH TESTABLE ACCEPTANCE CRITERIA\nproduct: Test Product\nVERDICT: PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY\n  problem_and_outcome                          pass\n  stories_and_acceptance_criteria              pass\n  scope_fences                                 pass\n  priorities_and_decisions                     pass\n  open_questions_and_approval                  pass\n  red_lines                                    pass\n38 pass, 0 fail, 0 missing of 38 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T09:45:52.752027+00:00 · gateway v1.1.0 · source `verification/work/prd-with-testable-acceptance-criteria/evidence.json`.

Input:

```json
{
  "product": "Test Product",
  "problem": {
    "statement_declared": true,
    "who_has_it_declared": true,
    "why_now_declared": true,
    "statement_sentence_count": 10,
    "problem_first_before_solution_declared": true
  },
  "outcome": {
    "observable_change_defined": true,
    "outcome_is_behavior_or_metric_not_feature_only": true
  },
  "stories": [
    {
      "id": "S1",
      "role": "User",
      "capability": "Login",
      "benefit": "Access",
      "priority": "P99"
    }
  ],
  "acceptance_criteria": [
    {
      "id": "AC1",
      "story_id": "S1",
      "testable_declared": false,
      "binary_declared": true
    }
  ],
  "out_of_scope_items": [
    "misc"
  ],
  "scope": {
    "explicit_out_of_scope_list_declared": true,
    "explicit_scope_boundaries_declared": true,
    "deferrals_placed_in_later_list": true,
    "deferrals_not_silently_inside_scope": true
  },
  "priorities": {
    "priority_scheme_p0_p1_p2_applied": true,
    "priority_tiers_applied_in_shipping_order": true,
    "p0_items_shippable_alone_declared": true,
    "priority_conflicts_resolved_with_decision_owner": true
  },
  "decisions": {
    "decision_owner_named": true,
    "key_decisions_logged_in_prd": true
  },
  "open_questions": [],
  "open_question_tracking": {
    "tracked_explicitly": true,
    "architecture_changing_questions_block_build": true,
    "non_architecture_questions_do_not_block_build": true
  },
  "approval": {
    "approved_spec_declared": true
  },
  "red_lines": {
    "build_started_before_approved_spec_present": true,
    "unlabeled_spike_treated_as_approved_spec_present": false,
    "scope_widened_mid_phase_without_prd_update_and_reapproval_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "prd-with-testable-acceptance-criteria",
  "atom_version": "0.1.0",
  "product": "Test Product",
  "verdict": "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY",
  "sections": {
    "problem_and_outcome": "fail",
    "stories_and_acceptance_criteria": "fail",
    "scope_fences": "fail",
    "priorities_and_decisions": "pass",
    "open_questions_and_approval": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "problem_and_outcome",
      "check": "problem_statement_declared",
      "status": "pass",
      "evidence": "problem first: the problem is stated in the PRD"
    },
    {
      "section": "problem_and_outcome",
      "check": "problem_who_has_it_declared",
      "status": "pass",
      "evidence": "problem first: the PRD states who has the problem"
    },
    {
      "section": "problem_and_outcome",
      "check": "problem_why_now_declared",
      "status": "pass",
      "evidence": "problem first: the PRD states why now"
    },
    {
      "section": "problem_and_outcome",
      "check": "problem_statement_within_five_sentences",
      "status": "fail",
      "evidence": "problem first: the problem statement is five sentences or fewer, on the declared sentence count"
    },
    {
      "section": "problem_and_outcome",
      "check": "problem_considered_before_solution",
      "status": "pass",
      "evidence": "problem first: the problem is addressed before any solution or feature"
    },
    {
      "section": "problem_and_outcome",
      "check": "observable_outcome_defined",
      "status": "pass",
      "evidence": "outcome over output: the observable change the PRD aims at is defined"
    },
    {
      "section": "problem_and_outcome",
      "check": "outcome_expressed_as_behavior_or_metric",
      "status": "pass",
      "evidence": "outcome over output: the outcome is expressed as a behavior or metric, not just a feature"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "prd_stories_declared",
      "status": "pass",
      "evidence": "stories: the declared PRD record names its user stories — the stories list is present and non-empty"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_prd_story_states_role_capability_and_benefit",
      "status": "pass",
      "evidence": "stories: every declared story states its role, capability and benefit — As a <role>, I want <capability>, so that <benefit>"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_prd_story_id_unique_and_nonempty",
      "status": "pass",
      "evidence": "stories: every declared story carries a non-empty id, and no story id is declared twice"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_prd_story_priority_is_p0_p1_or_p2",
      "status": "fail",
      "evidence": "prioritize: every declared story carries one of the skill's stated priorities — P0 (must ship), P1 (should) or P2 (could)"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "acceptance_criteria_declared",
      "status": "pass",
      "evidence": "acceptance criteria: the declared PRD record names its acceptance criteria — the acceptance_criteria list is present and non-empty"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_story_has_acceptance_criteria",
      "status": "pass",
      "evidence": "quality gate: every story has acceptance criteria — every declared story is traced to by at least one declared criterion"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_acceptance_criterion_traces_to_declared_story",
      "status": "pass",
      "evidence": "acceptance criteria: every declared criterion traces to a declared story"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_acceptance_criterion_id_unique_and_nonempty",
      "status": "pass",
      "evidence": "acceptance criteria: every declared criterion carries a non-empty id, and no criterion id is declared twice"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_acceptance_criterion_declared_testable",
      "status": "fail",
      "evidence": "acceptance criteria: every declared criterion is declared testable — if it can't be tested, it's not a criterion"
    },
    {
      "section": "stories_and_acceptance_criteria",
      "check": "every_acceptance_criterion_declared_binary",
      "status": "pass",
      "evidence": "acceptance criteria: every declared criterion is declared binary — it passes or it fails, with no middle state"
    },
    {
      "section": "scope_fences",
      "check": "out_of_scope_items_declared",
      "status": "pass",
      "evidence": "scope fences: the declared PRD record names its out-of-scope items — the out_of_scope_items list is present and non-empty"
    },
    {
      "section": "scope_fences",
      "check": "no_misc_bucket_in_out_of_scope_items",
      "status": "fail",
      "evidence": "quality gate: the out-of-scope list carries no \"misc\" bucket"
    },
    {
      "section": "scope_fences",
      "check": "explicit_out_of_scope_list_declared",
      "status": "pass",
      "evidence": "scope fences: an explicit out-of-scope list is declared in the PRD"
    },
    {
      "section": "scope_fences",
      "check": "explicit_scope_boundaries_declared",
      "status": "pass",
      "evidence": "scope fences: the PRD's scope boundaries are declared explicitly"
    },
    {
      "section": "scope_fences",
      "check": "deferrals_placed_in_later_list",
      "status": "pass",
      "evidence": "scope fences: deferrals go to a \"later\" list"
    },
    {
      "section": "scope_fences",
      "check": "deferrals_not_silently_inside_scope",
      "status": "pass",
      "evidence": "scope fences: no deferral sits silently inside the scope"
    },
    {
      "section": "priorities_and_decisions",
      "check": "priority_scheme_p0_p1_p2_applied",
      "status": "pass",
      "evidence": "prioritize: the P0 (must ship) / P1 (should) / P2 (could) scheme is applied in the PRD"
    },
    {
      "section": "priorities_and_decisions",
      "check": "priority_tiers_applied_in_shipping_order",
      "status": "pass",
      "evidence": "prioritize: the priority tiers are applied in shipping order — P0 before P1 before P2"
    },
    {
      "section": "priorities_and_decisions",
      "check": "p0_stories_shippable_alone",
      "status": "pass",
      "evidence": "quality gate: P0 items are shippable alone"
    },
    {
      "section": "priorities_and_decisions",
      "check": "priority_conflicts_resolved_with_decision_owner",
      "status": "pass",
      "evidence": "prioritize: priority conflicts are resolved with the decision owner"
    },
    {
      "section": "priorities_and_decisions",
      "check": "prd_decision_owner_named",
      "status": "pass",
      "evidence": "prioritize: the PRD's decision owner is named"
    },
    {
      "section": "priorities_and_decisions",
      "check": "prd_key_decisions_recorded",
      "status": "pass",
      "evidence": "quality gate: key decisions are logged in the PRD record"
    },
    {
      "section": "open_questions_and_approval",
      "check": "open_questions_declared",
      "status": "pass",
      "evidence": "open questions: the declared PRD record names its open questions — the open_questions list is present; an empty list declares that the PRD tracks no open questions"
    },
    {
      "section": "open_questions_and_approval",
      "check": "every_open_question_block_flag_matches_architecture_impact",
      "status": "pass",
      "evidence": "open questions: on every declared question row, blocking build matches changing architecture — questions block build only on questions that change architecture"
    },
    {
      "section": "open_questions_and_approval",
      "check": "open_questions_tracked_explicitly",
      "status": "pass",
      "evidence": "open questions: open questions are tracked explicitly in the PRD"
    },
    {
      "section": "open_questions_and_approval",
      "check": "architecture_changing_open_questions_block_build",
      "status": "pass",
      "evidence": "open questions: a question that changes architecture blocks build"
    },
    {
      "section": "open_questions_and_approval",
      "check": "non_architecture_open_questions_do_not_block_build",
      "status": "pass",
      "evidence": "open questions: a question that does not change architecture does not block build"
    },
    {
      "section": "open_questions_and_approval",
      "check": "spec_approved_for_build",
      "status": "pass",
      "evidence": "approved spec: the PRD is declared approved — nothing enters build without an approved spec"
    },
    {
      "section": "red_lines",
      "check": "no_build_before_approved_spec",
      "status": "fail",
      "evidence": "red line: no build started before an approved spec is present in the record"
    },
    {
      "section": "red_lines",
      "check": "no_unlabeled_spike_as_spec_exception",
      "status": "pass",
      "evidence": "red line: no unlabeled spike treated as an approved spec is present in the record — spike exceptions are timeboxed and labeled as such"
    },
    {
      "section": "red_lines",
      "check": "no_scope_widening_without_prd_update_and_reapproval",
      "status": "pass",
      "evidence": "red line: no scope widened mid-phase without updating the PRD and re-approval is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "problem_statement_sentence_count": 10,
  "stories_count": 1,
  "acceptance_criteria_count": 1,
  "p0_story_count": 0,
  "stories_without_criteria": [],
  "criteria_without_declared_story": [],
  "duplicate_story_ids": [],
  "duplicate_criterion_ids": [],
  "story_criteria_coverage": "1.000000",
  "testable_criteria_coverage": "0.000000",
  "binary_criteria_coverage": "1.000000",
  "out_of_scope_items_count": 1,
  "misc_bucket_items": [
    "misc"
  ],
  "open_questions_count": 0,
  "architecture_changing_open_questions_count": 0,
  "blocking_open_questions_count": 0,
  "summary": "33 pass, 5 fail, 0 missing of 38 checks across six sections.",
  "stamp": "PRD WITH TESTABLE ACCEPTANCE CRITERIA\nproduct: Test Product\nVERDICT: PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY\n  problem_and_outcome                          fail\n  stories_and_acceptance_criteria              fail\n  scope_fences                                 fail\n  priorities_and_decisions                     pass\n  open_questions_and_approval                  pass\n  red_lines                                    fail\n33 pass, 5 fail, 0 missing of 38 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T09:45:52.752027+00:00 · gateway v1.1.0 · source `verification/work/prd-with-testable-acceptance-criteria/evidence.json`.

Input:

```json
{
  "product": "Malformed",
  "problem": "This should be an object, not a string"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "problem",
  "detail": "problem must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared PRD record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not a product-management service, a test-execution service, an approval authority or a prediction that the product will succeed, and SERVICE.md's U-13 screen states its output could not read as regulated professional advice and takes no position on the product the PRD specifies. |
| Checks named | 38 documented / 38 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`problem_statement_sentence_count`, the five declared counts, the five row-name / bucket lists and the three coverage ratios) |
| Input reference typed | Yes — 52 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/prd-with-testable-acceptance-criteria/evidence.json` |
