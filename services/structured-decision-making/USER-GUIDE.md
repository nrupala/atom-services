# Structured decision making — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have made — or are recording — one decision deliberately, and you keep one structured decision record for it: frame → options → criteria → evaluate → commit → review, with speed where the decision is reversible and care where it is not. This atom reads one declared structured decision record and returns one deterministic verdict across eight sections (structured_framing, structured_options, structured_criteria, structured_matrix_scoring, structured_evaluation_and_uncertainty, structured_pre_mortem, structured_commit_log_and_review, structured_red_lines): **DECISION_RECORD_SOUND**, **DECISION_RECORD_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 46 checks. The atom makes no decision, recommends no option as the answer, ranks no option for you, and predicts nothing — it audits the record you declare and recomputes the arithmetic the record itself declares. It generates no options or criteria, assigns no weights or scores, runs no expected-value, decision-tree or scenario analysis, performs no pre-mortem, and does not verify that any declared step (criteria defined before scoring, a pre-mortem conducted, deliberation slowed, a decision communicated) ever actually happened. A record is sound *on your declared evidence*: a record that declares its criteria defined before scoring, its pre-mortem conducted and every weighted total recomputing passes those checks even if the real decision did none of it. It is a completeness and consistency audit of the decision record, not a decision service, a recommendation engine, or a decision-quality certification: it never judges whether the decision is the right one, whether the named options are the genuinely real ones, whether the criteria and weights are the right ones, whether the scores are fair, or whether the logged choice is wise — and the logged chosen option is never compared against the recomputed totals, because picking the winner from the totals would be a recommendation. The computed checks are: the declared classification must be `reversible` or `irreversible`; slowed deliberation is required only when the classification is declared `irreversible`; the options list must name at least three rows, with unique names, recognised kinds, a status-quo row and a smaller-reversible-step row; the criteria list must be declared with unique names, non-negative weights summing to a positive total (reported as `criteria_weights_sum`), and every criterion declared defined before scoring; every option must score every declared criterion, no option may score an undeclared criterion or score a criterion twice, the declared score-scale bounds must be coherent, every score must lie inside the record's own declared scale, and every option's `declared_weighted_total` must recompute exactly as Σ (declared criterion weight × declared score) on the fixed six-decimal serialization; the evaluation method must be one of `decision_matrix`, `expected_value`, `decision_tree`, `scenario_thinking`, with expected value required only when probabilities are declared estimable and scenario thinking required only when they are declared not estimable; the pre-mortem checks are required only when the decision is declared material; and the logged chosen option must name a declared option row. Declined thresholds, named: no criterion weight-sum target (1.0, 100, or any other — weights are checked non-negative and positive in total only); no score scale of the atom's own (no 0–5, 0–10 or 1–100 scale is imposed — only the record's declared bounds bind its scores); no minimum winning margin and no rule that the chosen option must hold the highest (or any rank of) recomputed total; no stakes level or numeric stakes × reversibility effort formula; no probability, expected-value or scenario-quality bar (no expected value is computed, because the record declares no probabilities); no base-rate value or reference-class bar; no pre-mortem risk count or severity bar; no review interval in days; and no judgment that the declared criteria, weights or scores are the right ones for this decision. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "structured-decision-making"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/structured-decision-making` — tool name `structured_decision_making`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/structured-decision-making` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `decision` (string) | Decision under review; carried into the verdict output, not itself checked |
| `framing.decision_restated_crisp` | framing evidence: the actual decision is restated until it is crisp |
| `framing.decide_by_date_stated` | framing evidence: by when the decision must be made is stated |
| `framing.constraints_named` | framing evidence: the constraints on the decision are named |
| `framing.out_of_scope_named` | framing evidence: what is out of scope is named |
| `framing.classification` (string) | computed: must be `reversible` or `irreversible` |
| `framing.stakes_assessed` | framing evidence: the stakes are assessed |
| `framing.effort_budget_matched_to_stakes_and_reversibility` | framing evidence: effort is declared matched to stakes and reversibility |
| `framing.slowed_deliberation_declared` | computed-gated: required when classification is `irreversible`; passes as not applicable for a reversible decision |
| `options` (list of option-row objects) | computed: must name at least three rows; reported as `options_count` |
| `options[].name` (string) | names the row in the computed outputs; computed: names must be unique |
| `options[].kind` (string) | computed: one of `action`, `status_quo`, `smaller_reversible_step`; the rows must include a status-quo row and a smaller-reversible-step row |
| `options[].scores` (list of score-row objects) | computed: each option's scores must cover every declared criterion exactly once |
| `options[].scores[].criterion` (string) | must name a declared criterion |
| `options[].scores[].score` (number) | computed: must lie inside the declared scale, inclusive |
| `options[].declared_weighted_total` (number) | computed: must recompute as Σ (declared criterion weight × declared score) |
| `criteria` (list of criterion-row objects) | computed: must be present and name at least one criterion; reported as `criteria_count` |
| `criteria[].name` (string) | names the row in the computed outputs; computed: names must be unique |
| `criteria[].weight` (number) | computed: must be non-negative, and the weights must sum positive |
| `criteria[].defined_before_scoring` | criterion evidence: the criterion was defined before scoring |
| `evaluation.method` (string) | computed: one of `decision_matrix`, `expected_value`, `decision_tree`, `scenario_thinking` |
| `evaluation.score_scale_min` (number) | the declared score scale lower bound |
| `evaluation.score_scale_max` (number) | the declared score scale upper bound; computed with the minimum: the minimum must not exceed the maximum |
| `evaluation.probabilities_estimable` | gates the fitting-tool checks below |
| `evaluation.expected_value_used` | required when probabilities are declared estimable; otherwise passes as not applicable |
| `evaluation.scenario_thinking_used` | required when probabilities are declared not estimable; otherwise passes as not applicable |
| `evaluation.uncertainty_flagged` | evaluation evidence: uncertainty is flagged |
| `evaluation.base_rates_considered` | evaluation evidence: base rates are considered |
| `premortem.decision_is_material` | gates the three pre-mortem checks below |
| `premortem.conducted` | required when the decision is declared material; otherwise passes as not applicable |
| `premortem.failure_reasons_named` | required when the decision is declared material; otherwise passes as not applicable |
| `premortem.top_reasons_fixed_or_hedged` | required when the decision is declared material; otherwise passes as not applicable |
| `log.choice_recorded` | log evidence: the choice is recorded |
| `log.chosen_option` (string) | computed: must name a declared option row; never compared against the recomputed totals |
| `log.rationale_recorded` | log evidence: the rationale is recorded |
| `log.assumptions_recorded` | log evidence: the assumptions are recorded |
| `log.communicated_with_why` | log evidence: the decision was communicated with why |
| `review.review_date_set` | review evidence: a review date is set |
| `review.outcomes_vs_expectations_review_planned` | review evidence: an outcomes-vs-expectations review is planned |
| `review.luck_separated_from_process_declared` | review evidence: luck is declared separated from process |
| `red_lines.decision_without_options_present` | must be `false` to pass (red line) |
| `red_lines.criteria_invented_after_scores_present` | must be `false` to pass (red line) |
| `red_lines.irreversible_decision_rushed_present` | must be `false` to pass (red line) |
| `red_lines.irreversible_decision_made_in_mood_present` | must be `false` to pass (red line) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward DECISION_RECORD_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/structured-decision-making`:

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

Response — HTTP 200 (trimmed; the full response carries all 46 checks and a text stamp of the verdict):

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
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across eight sections."
}
```

## Verdicts

- **DECISION_RECORD_SOUND** — every check passes; the declared decision record is complete and internally consistent with the skill's method, quality gates and red lines.
- **DECISION_RECORD_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the fourteen computed checks cannot be completed), `options_count` and `criteria_count` (the declared list lengths, or null when the list is not declared), `duplicate_option_names` and `duplicate_criterion_names` (names declared on more than one row; null when the underlying list is not declared), `criteria_weights_sum`, `recomputed_weighted_totals` (the recomputed total per option, null for an option whose scores or the weights are incomplete), `options_with_weighted_total_mismatch`, `options_without_complete_scores`, `score_coverage_ratio` and `weighted_total_match_ratio` (each a string with exactly six decimal places, and null when its denominator list is absent or empty or the criteria/weights it needs are incomplete), and `chosen_option` (the declared logged choice string, or null when it is not declared).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
