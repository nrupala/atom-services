# Prd with testable acceptance criteria — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a product requirements document (PRD) for a product or feature, made at the specification stage before build — the problem, the outcome, user stories with acceptance criteria, scope boundaries and priorities — and you have a record of that PRD. This atom reads one declared manifest and returns one deterministic verdict across six sections (problem_and_outcome, stories_and_acceptance_criteria, scope_fences, priorities_and_decisions, open_questions_and_approval, red_lines): **PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY**, **PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 38 checks. It audits the declared PRD record's completeness and consistency only — it writes no PRD itself, interviews no user, runs no test against any criterion, inspects no product, repository or approval system, and does not verify that a declared PRD was ever approved, built from, or shipped. A PRD is ready *on your declared evidence*: it never judges whether the stated problem is the real problem, whether a criterion declared testable can actually be tested in practice, whether the stories are the right stories, or whether the priorities are wise. The computed checks: the declared problem statement count must be between 1 and 5 inclusive (the skill's own stated limit of five sentences or fewer, checked only against your declared count — the atom never parses or counts prose itself); the declared `stories` and `acceptance_criteria` lists must each be present and non-empty; every story row must state a non-empty `role`, `capability` and `benefit`, carry a unique non-empty `id`, and carry a `priority` that is one of `P0`, `P1` or `P2`; every story must be named as the `story_id` of at least one criterion row and every criterion row's `story_id` must name a declared story; every criterion row must carry a unique non-empty `id` and declare itself both testable and binary; the declared `out_of_scope_items` list must be present and non-empty and no entry may be the `"misc"` bucket (an entry whose trimmed, lower-cased text is exactly `misc`); the declared `open_questions` list must be present (an empty list passes — it declares no open questions) and on every row `blocks_build` must equal `architecture_changing`. The skill states exactly one numeric limit — the problem statement at five sentences or fewer — and no other numeric threshold is imposed: no problem statement length in words or characters, or a sentence limit other than the skill's stated five; no minimum or maximum number of stories, or of acceptance criteria per story beyond the every-story-has-criteria completeness gate; no required priority mix (for example a minimum number or share of P0 stories — P0 rows are counted and reported, never quota'd); no story-point, effort or duration estimate per story or for the PRD; no maximum number of open questions, or a deadline by which they must close; no testability or binary score beyond each criterion's own declared flags; no required wording template for a criterion beyond testable-and-binary (given/when/then is stated by the skill as "fine" — permitted, never required — so its syntax is not parsed or mandated); no approval quorum, approver seniority, or approval expiry; and no spike duration beyond a spike being timeboxed and labeled as declared. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "prd-with-testable-acceptance-criteria"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/prd-with-testable-acceptance-criteria` — tool name `prd_with_testable_acceptance_criteria`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/prd-with-testable-acceptance-criteria` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `product` | Product name (string; carried into the output, not checked) |
| `problem.statement_declared` | problem evidence: the problem is stated in the PRD |
| `problem.who_has_it_declared` | problem evidence: the PRD states who has the problem |
| `problem.why_now_declared` | problem evidence: the PRD states why now |
| `problem.statement_sentence_count` (number) | computed: the declared sentence count; must be between 1 and 5 inclusive; reported as `problem_statement_sentence_count` |
| `problem.problem_first_before_solution_declared` | problem evidence: the problem is addressed before any solution or feature |
| `outcome.observable_change_defined` | outcome evidence: the observable change the PRD aims at is defined |
| `outcome.outcome_is_behavior_or_metric_not_feature_only` | outcome evidence: the outcome is expressed as a behaviour or metric, not just a feature |
| `stories` (list of story-row objects) | computed: must be present and non-empty; reported as `stories_count` |
| `stories[].id` (string) | names the row in the computed outputs; computed: must be present, non-empty and unique per row |
| `stories[].role` (string) | the `<role>` of the story form; computed: must be present and non-empty per row |
| `stories[].capability` (string) | the `<capability>` of the story form; computed: must be present and non-empty per row |
| `stories[].benefit` (string) | the `<benefit>` of the story form; computed: must be present and non-empty per row |
| `stories[].priority` (string) | computed: must be present per row and one of `P0`, `P1` or `P2` |
| `acceptance_criteria` (list of criterion-row objects) | computed: must be present and non-empty; reported as `acceptance_criteria_count` |
| `acceptance_criteria[].id` (string) | names the row in the computed outputs; computed: must be present, non-empty and unique per row |
| `acceptance_criteria[].story_id` (string) | the declared story the criterion accepts; computed: must name a declared story; every declared story must be named by at least one row |
| `acceptance_criteria[].testable_declared` | computed: must be `true` per row |
| `acceptance_criteria[].binary_declared` | computed: must be `true` per row |
| `out_of_scope_items` (list of strings) | computed: must be present and non-empty; reported as `out_of_scope_items_count`; no entry may be exactly `misc` (trimmed, lower-cased) |
| `scope.explicit_out_of_scope_list_declared` | scope evidence: an explicit out-of-scope list is declared in the PRD |
| `scope.explicit_scope_boundaries_declared` | scope evidence: the PRD's scope boundaries are declared explicitly |
| `scope.deferrals_placed_in_later_list` | scope evidence: deferrals go to a "later" list |
| `scope.deferrals_not_silently_inside_scope` | scope evidence: no deferral sits silently inside the scope |
| `priorities.priority_scheme_p0_p1_p2_applied` | priorities evidence: the P0 / P1 / P2 scheme is applied in the PRD |
| `priorities.priority_tiers_applied_in_shipping_order` | priorities evidence: the priority tiers are applied in shipping order |
| `priorities.p0_items_shippable_alone_declared` | priorities evidence: P0 items are shippable alone |
| `priorities.priority_conflicts_resolved_with_decision_owner` | priorities evidence: priority conflicts are resolved with the decision owner |
| `decisions.decision_owner_named` | decisions evidence: the PRD's decision owner is named |
| `decisions.key_decisions_logged_in_prd` | decisions evidence: key decisions are logged in the PRD record |
| `open_questions` (list of open-question-row objects) | computed: must be present (an empty list passes); reported as `open_questions_count` |
| `open_questions[].id` (string) | names the row in the computed outputs |
| `open_questions[].architecture_changing` | whether the question changes architecture; computed: `blocks_build` must equal this value per row |
| `open_questions[].blocks_build` | computed: must equal `architecture_changing` per row |
| `open_question_tracking.tracked_explicitly` | open-questions evidence: open questions are tracked explicitly in the PRD |
| `open_question_tracking.architecture_changing_questions_block_build` | open-questions evidence: a question that changes architecture blocks build |
| `open_question_tracking.non_architecture_questions_do_not_block_build` | open-questions evidence: a question that does not change architecture does not block build |
| `approval.approved_spec_declared` | approval evidence: the PRD is declared approved — nothing enters build without an approved spec |
| `red_lines.build_started_before_approved_spec_present` | must be `false` to pass (skill red line: no build before an approved spec) |
| `red_lines.unlabeled_spike_treated_as_approved_spec_present` | must be `false` to pass (skill red line: no unlabeled spike treated as an approved spec; spike exceptions are timeboxed and labeled as such) |
| `red_lines.scope_widened_mid_phase_without_prd_update_and_reapproval_present` | must be `false` to pass (skill red line: no scope widened mid-phase without a PRD update and re-approval) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/prd-with-testable-acceptance-criteria`:

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

Response — HTTP 200 (trimmed; the full response carries all 38 checks and a text stamp of the verdict):

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
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across six sections."
}
```

## Verdicts

- **PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY** — every check passes; the declared PRD record is complete and consistent with the skill's checklist and red lines.
- **PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `problem_statement_sentence_count` (the declared count, or null when it is not declared), `stories_count`, `acceptance_criteria_count` and `out_of_scope_items_count` / `open_questions_count` (the declared list lengths, or null when a list is not declared — counts are reported as integers, exactly), `p0_story_count` (declared stories whose priority is exactly `P0`), `architecture_changing_open_questions_count` and `blocking_open_questions_count` (declared question rows whose respective flag is true), the row-name lists `stories_without_criteria` (declared stories no criterion traces to; a story with `id` absent is missing evidence and does not appear), `criteria_without_declared_story` (criteria whose `story_id` is present but names no declared story), `duplicate_story_ids` and `duplicate_criterion_ids` (ids declared on more than one row, in the order their second occurrence appears), `misc_bucket_items` (the declared out-of-scope entries that are the `"misc"` bucket, spelled as declared), and the coverage ratios `story_criteria_coverage` (stories traced to by at least one criterion ÷ declared stories), `testable_criteria_coverage` (criteria declared testable ÷ declared criteria) and `binary_criteria_coverage` (criteria declared binary ÷ declared criteria) (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty, and for `story_criteria_coverage` when either tracing list is absent), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the fifteen primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
