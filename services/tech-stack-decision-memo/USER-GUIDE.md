# Tech stack decision memo — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are deciding a technology stack for a requirement and the team that must run it, and you keep a decision memo for that selection. This atom reads one declared tech-stack decision memo record and returns one deterministic verdict across seven sections (context_and_constraints, candidates_and_boring_technology, evaluation_criteria_and_evidence, total_cost_and_operability, decision_and_rationale, reversibility_and_exit, red_lines): **TECH_STACK_DECISION_SOUND**, **TECH_STACK_DECISION_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 51 checks. It audits the declared memo record's completeness and internal consistency only — it researches no technology, evaluates no stack itself, verifies no candidate claim against the world, and recommends, chooses and ranks nothing, and applies no default stack: it never judges whether a declared score is fair, whether the evidence note actually supports the candidate, whether the chosen stack will perform, or whether the decision should stand — only that the record contains what the skill's method and anti-patterns demand, and that its declared rows are internally consistent. A memo is sound *on your declared evidence*: a record that declares its constraints addressed, its candidates evidenced and its exit path kept passes those checks even if the real memo did none of it. It is not a stack recommendation, an architecture review, or a guarantee that the chosen stack is right. The computed checks: the declared `candidates` list must be present and name at least two candidates, with unique `candidate_id` values, a non-empty `stack_name` and a non-empty `evidence_note` on every row, and every `novelty_classification` one of `proven` or `novel`; the declared `criteria` list must be present and name at least one criterion, with unique `criterion_id` values, a non-empty `criterion_name` on every row, every `weight` non-negative, and the declared weights summing to a positive total (reported as `tech_stack_criteria_weights_sum` — no weight-sum target such as 1 or 100 is checked); every candidate must score every declared criterion and no other criterion, exactly once; every candidate's `weighted_total_declared` must recompute exactly as sum(declared weight × declared score) over its declared scores; the declared `decision.chosen_candidate_id` must name a declared candidate (only that the reference resolves — never that the chosen candidate is top-ranked or highest-scoring); and the declared `decision.declared_ranking_candidate_ids` list must be exactly the declared candidate ids — none missing, none extra, none duplicated (checking a declared ranking's internal consistency is audit, not advice: the atom produces no ranking of its own). One further check is gated on the record's own declared gate field — when the gate is declared `false` the check passes as not applicable, when the gate field is absent the check is missing evidence, and when the gate is `true` the target declaration is required: the hidden fragility cost must be named only where `tco.free_tier_or_free_choice_used` is declared `true`. The skill states no numeric threshold at all, and none is imported: no minimum team size or team-capability bar (the team is checked as declared in context, never measured); no cost ceiling for licensing, operations or total cost of ownership; no exit-cost amount or ceiling; no score scale of the atom's own (scores are caller-declared numbers, checked only for coverage and arithmetic — no scale is imposed and no score is judged good or bad); no minimum winning margin between candidates, or any check that the chosen candidate scored highest or ranked first; no novelty-budget percentage or maximum number or share of novel candidates; no candidate-count maximum, or a criterion-count bar beyond at least one criterion and at least two candidates; no conformity bar against any house or default stack (the skill's house stack defaults are a prescription for one house, not a bar this atom sets); and no judgment that the chosen stack is right, good or advisable (only that its declared memo record contains what the skill requires). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "tech-stack-decision-memo"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/tech-stack-decision-memo` — tool name `tech_stack_decision_memo`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/tech-stack-decision-memo` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `memo_title` | Memo title (string; carried into the output, not checked) |
| `context.hard_constraints_declared` | context evidence: the memo declares its hard constraints |
| `context.security_model_constraint_addressed` | context evidence: the security-model hard constraint is addressed |
| `context.regulatory_constraint_addressed` | context evidence: the regulatory hard constraint is addressed |
| `context.performance_constraint_addressed` | context evidence: the performance hard constraint is addressed |
| `context.offline_constraint_addressed` | context evidence: the offline hard constraint is addressed |
| `context.access_patterns_declared` | context evidence: the access patterns the stack must serve are declared |
| `context.usage_patterns_declared` | context evidence: the usage patterns the stack must serve are declared |
| `context.team_operability_context_declared` | context evidence: the team that must run the stack is declared |
| `context.decision_framed_as_sticky` | context evidence: the stack choice is framed as sticky — a one-way door, not fashion |
| `candidate_work.candidates_compared_against_same_hard_constraints` | candidate evidence: every candidate was compared against the same hard constraints |
| `candidate_work.boring_technology_bias_addressed` | candidate evidence: the boring-technology bias is addressed |
| `candidate_work.novelty_budget_allocation_declared` | candidate evidence: the novelty budget allocation is declared |
| `candidate_work.novelty_spend_tied_to_differentiation_declared` | candidate evidence: novelty spend is tied to differentiation |
| `candidates` (list of candidate objects) | computed: must be present and name at least two candidates; reported as `tech_stack_candidates_count` |
| `candidates[].candidate_id` (string) | names the row in the computed outputs; computed: must be unique per row |
| `candidates[].stack_name` (string) | computed: must be present and non-empty on every row |
| `candidates[].novelty_classification` (string) | computed: must be one of `proven`, `novel` |
| `candidates[].evidence_note` (string) | computed: must be present and non-empty on every row |
| `candidates[].scores` (list of score objects) | computed: must name every declared criterion and no other, exactly once |
| `candidates[].scores[].criterion_id` (string) | computed: must name a declared criterion |
| `candidates[].scores[].score` (number) | the caller-declared score for that criterion |
| `candidates[].weighted_total_declared` (number) | computed: must recompute as sum(declared weight × declared score) over the declared scores |
| `evaluation.evidence_basis_recorded` | evaluation evidence: the evidence basis for the evaluation is recorded |
| `evaluation.evaluation_applied_consistently_across_candidates` | evaluation evidence: evaluation was applied consistently across candidates |
| `criteria` (list of criterion objects) | computed: must be present and name at least one criterion; reported as `tech_stack_criteria_count` |
| `criteria[].criterion_id` (string) | names the row in the computed outputs; computed: must be unique per row |
| `criteria[].criterion_name` (string) | computed: must be present and non-empty on every row |
| `criteria[].weight` (number) | computed: must be non-negative; the declared weights must sum to a positive total |
| `tco.licensing_cost_addressed` | TCO evidence: licensing cost is addressed |
| `tco.operations_burden_addressed` | TCO evidence: operations burden is addressed |
| `tco.learning_curve_addressed` | TCO evidence: learning curve is addressed |
| `tco.lock_in_cost_addressed` | TCO evidence: lock-in cost is addressed |
| `tco.operability_cost_addressed` | TCO evidence: operability cost is addressed |
| `tco.on_call_operability_owner_declared` | TCO evidence: the on-call operability owner is declared |
| `tco.team_can_operate_declared_stack` | TCO evidence: the team can operate the declared stack |
| `tco.free_tier_or_free_choice_used` | gates the hidden-fragility check: the hidden fragility cost is required only where a free-tier/free choice is declared used |
| `tco.hidden_fragility_cost_named` | required when `tco.free_tier_or_free_choice_used` is `true`; otherwise the check passes as not applicable |
| `decision.decision_recorded` | decision evidence: a decision is recorded |
| `decision.chosen_candidate_id` (string) | computed: must name a declared candidate |
| `decision.rationale_recorded` | decision evidence: the rationale is recorded |
| `decision.rationale_tied_to_hard_constraints` | decision evidence: the rationale is tied to the hard constraints |
| `decision.rationale_tied_to_evaluation_criteria` | decision evidence: the rationale is tied to the evaluation criteria |
| `decision.tradeoffs_of_decision_recorded` | decision evidence: the tradeoffs of the decision are recorded |
| `decision.declared_ranking_candidate_ids` (list of strings) | computed: must be exactly the declared candidate ids — none missing, none extra, none duplicated |
| `reversibility.exit_cost_assessed` | reversibility evidence: the exit cost is assessed |
| `reversibility.exit_path_kept` | reversibility evidence: an exit path is kept |
| `reversibility.vendor_specific_pieces_isolated_behind_interfaces` | reversibility evidence: vendor-specific pieces are isolated behind interfaces |
| `reversibility.reversibility_assessed` | reversibility evidence: reversibility is assessed |
| `red_lines.framework_of_the_week_chosen_for_novelty_present` | must be `false` to pass (red line: no framework-of-the-week chosen for novelty) |
| `red_lines.microservices_for_solo_project_present` | must be `false` to pass (red line: no microservices for a solo project) |
| `red_lines.docker_by_default_choice_present` | must be `false` to pass (red line: no Docker-by-default choice) |
| `red_lines.lock_in_with_no_exit_present` | must be `false` to pass (red line: no lock-in with no exit) |
| `red_lines.technology_chosen_to_pad_cv_present` | must be `false` to pass (red line: no technology chosen to pad a CV) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward TECH_STACK_DECISION_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/tech-stack-decision-memo`:

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

Response — HTTP 200 (trimmed; the full response carries all 51 checks and a text stamp of the verdict):

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
  "summary": "51 pass, 0 fail, 0 missing of 51 checks across seven sections."
}
```

## Verdicts

- **TECH_STACK_DECISION_SOUND** — every check passes; the declared tech-stack decision memo record is complete and internally consistent with the skill's method and anti-patterns.
- **TECH_STACK_DECISION_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `tech_stack_candidates_count` and `tech_stack_criteria_count` (integers, exactly; null when the corresponding list is not declared), `duplicate_tech_stack_candidate_ids`, `duplicate_tech_stack_criterion_ids` and `duplicate_declared_ranking_candidate_ids` (ids carried by more than one row; each null when its list is not declared), `tech_stack_candidates_without_stack_name`, `tech_stack_candidates_with_invalid_novelty_classification`, `tech_stack_candidates_without_evidence_note`, `tech_stack_criteria_without_name`, `tech_stack_criteria_with_invalid_weight`, `tech_stack_candidates_with_incomplete_or_extra_scores`, `tech_stack_candidates_with_weighted_total_mismatch`, `tech_stack_candidates_missing_from_declared_ranking` and `declared_ranking_ids_not_declared_as_candidates` (the offending rows for each computed rule; each null when its underlying list is not declared), `tech_stack_criteria_weights_sum` (the sum of the declared criterion weights), `candidate_score_coverage_ratio` (candidates scoring every declared criterion exactly ÷ declared candidates), `candidate_weighted_total_match_ratio` (candidates whose declared weighted total recomputes ÷ declared candidates) and `candidate_evidence_note_ratio` (candidates with a recorded evidence note ÷ declared candidates; each quantity and ratio a string with exactly six decimal places, and null when its denominator list is absent or empty — the score-coverage and weighted-total ratios are also null when the criteria list is not declared), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the fourteen primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
