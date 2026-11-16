# Decision process design — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a decision to make and a record of how the decision process was engineered — what is actually being decided, who decides, what would change the answer, and how you will know if it worked. This atom reads one declared manifest and returns one deterministic verdict across four sections: **DECISION_PROCESS_SOUND**, **DECISION_PROCESS_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it makes no decision, frames no decision for you, gathers or analyses no data, sets no criteria or thresholds, and does not verify that a declared pre-commitment actually happened when declared. A process is sound *on your declared evidence*: it never judges whether the decision is the right one, whether the named options are the genuinely real ones, or whether the declared thresholds are well-chosen. Computed checks: the declared `options` and `criteria` lists must be present and non-empty with every row named (and, for options, declared viable; for criteria, declared set before the data with a threshold declared); the declared `precommitment.default_action` must name one of the declared options; and both declared loss costs must be present and non-negative. Four checks are conditional: threshold adjustment is required only when asymmetric costs are declared, slowing down only when an irreversible decision is declared, defaulting to action only when a reversible decision is declared, and a pre-registered hypothesis only when confirmatory analysis is declared in use. No numeric threshold is imposed — no minimum option or criterion count beyond present-and-non-empty, no loss-cost amount or ratio bar, and no stakes level. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "decision-process-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/decision-process-design` — tool name `decision_process_design`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/decision-process-design` — body = the manifest object; same `Authorization` header.

## Input — the decision-process-design manifest

| Field | Meaning |
|---|---|
| `decision` | decision name (string; carried into the output, not checked) |
| `framing.decision_named` / `decision_maker_identified` / `objective_stated` | framing evidence: the decision itself is named; the decision-maker is identified; the objective is stated |
| `framing.decision_maker_defines_what_matters` / `analyst_informs_not_decides` | role evidence: the decision-maker defines what matters; the analyst informs, not decides |
| `framing.analysis_makes_the_call_present` | must be `false` to pass (anti-pattern: analysis quietly making the call) |
| `options` (list of `{name, viable}` rows) | computed: must be present and non-empty; reported as `options_count` |
| `options[].name` (string) | computed: every row must name the option (non-empty); rows that do not are reported in `options_without_name` |
| `options[].viable` | computed: every row must declare `viable: true`; rows that do not are reported in `options_not_declared_viable` |
| `criteria` (list of `{name, set_before_data, threshold_declared}` rows) | computed: must be present and non-empty; reported as `criteria_count` |
| `criteria[].name` (string) | computed: every row must name the criterion (non-empty); rows that do not are reported in `criteria_without_name` |
| `criteria[].set_before_data` | computed: every row must declare `true`; rows that do not are reported in `criteria_not_set_before_data` |
| `criteria[].threshold_declared` | computed: every row must declare `true`; rows that do not are reported in `criteria_without_threshold` |
| `precommitment.default_action` (string) | computed: must equal the `name` of a declared option row; reported as `default_action` |
| `precommitment.change_my_mind_threshold_stated` / `criteria_and_thresholds_set_before_data_seen` | pre-commitment evidence: what evidence would flip the default is stated; criteria and thresholds were set before the data was seen |
| `precommitment.data_seen_before_criteria_set_present` | must be `false` to pass (anti-pattern: data seen before the criteria were set) |
| `loss.loss_function_framed` / `cost_of_being_wrong_in_each_direction_stated` | loss evidence: the loss function is framed; the cost of being wrong is stated in each direction |
| `loss.cost_of_false_action` (number) / `cost_of_false_inaction` (number) | computed: both must be present and non-negative; their ratio (`cost_of_false_action` ÷ `cost_of_false_inaction`) is reported as `loss_cost_ratio` |
| `loss.asymmetric_costs_declared` | gate: declares whether the costs are asymmetric |
| `loss.threshold_adjusted_for_asymmetric_costs` | required `true` only when `loss.asymmetric_costs_declared` is `true`; otherwise passes as not applicable |
| `rigor.stakes_assessed` / `reversibility_assessed` / `effort_matched_to_stakes_and_reversibility` / `data_gathering_worth_assessed` | rigor evidence: stakes and reversibility assessed; effort matched to them; how much data gathering is worth it assessed |
| `rigor.irreversible_declared` | gate: declares an irreversible (one-way-door) decision |
| `rigor.slowed_down_and_more_evidence_for_irreversible` | required `true` only when `rigor.irreversible_declared` is `true`; otherwise passes as not applicable |
| `rigor.reversible_declared` | gate: declares a reversible (two-way-door) decision |
| `rigor.default_to_action_for_reversible` | required `true` only when `rigor.reversible_declared` is `true`; otherwise passes as not applicable |
| `evidence.exploratory_and_confirmatory_distinguished` | evidence evidence: exploratory and confirmatory analysis are distinguished |
| `evidence.confirmatory_analysis_used` | gate: declares confirmatory analysis in use |
| `evidence.hypothesis_preregistered` | required `true` only when `evidence.confirmatory_analysis_used` is `true`; otherwise passes as not applicable |
| `evidence.conclusion_drawn_from_inspiring_data_present` | must be `false` to pass (anti-pattern: a conclusion drawn from the data that inspired it) |
| `evidence.evidence_has_power_to_change_decision` | evidence evidence: some possible data could change the action |
| `evidence.data_is_decoration_present` | must be `false` to pass (anti-pattern: data gathered as decoration) |
| `evidence.acted_per_preset_criteria_after_gathering` | evidence evidence: after gathering, the action was taken per the pre-set criteria |
| `review.decision_quality_reviewed_separately_from_outcome` / `decision_judged_by_process_and_information_at_time` | review evidence: decision quality is reviewed separately from the outcome; the decision is judged by the process and information at the time |
| `review.outcome_used_alone_to_judge_present` | must be `false` to pass (anti-pattern: the outcome alone used to judge the decision) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward DECISION_PROCESS_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/decision-process-design`:

```json
{
  "decision": "Launch new feature",
  "framing": {
    "decision_named": true,
    "decision_maker_identified": true,
    "objective_stated": true,
    "decision_maker_defines_what_matters": true,
    "analyst_informs_not_decides": true,
    "analysis_makes_the_call_present": false
  },
  "options": [
    {
      "name": "A",
      "viable": true
    },
    {
      "name": "B",
      "viable": true
    }
  ],
  "criteria": [
    {
      "name": "C1",
      "set_before_data": true,
      "threshold_declared": true
    }
  ],
  "precommitment": {
    "default_action": "A",
    "change_my_mind_threshold_stated": true,
    "criteria_and_thresholds_set_before_data_seen": true,
    "data_seen_before_criteria_set_present": false
  },
  "loss": {
    "loss_function_framed": true,
    "cost_of_being_wrong_in_each_direction_stated": true,
    "cost_of_false_action": 100,
    "cost_of_false_inaction": 50,
    "asymmetric_costs_declared": false
  },
  "rigor": {
    "stakes_assessed": true,
    "reversibility_assessed": true,
    "effort_matched_to_stakes_and_reversibility": true,
    "data_gathering_worth_assessed": true,
    "irreversible_declared": false,
    "reversible_declared": false
  },
  "evidence": {
    "exploratory_and_confirmatory_distinguished": true,
    "confirmatory_analysis_used": false,
    "conclusion_drawn_from_inspiring_data_present": false,
    "evidence_has_power_to_change_decision": true,
    "data_is_decoration_present": false,
    "acted_per_preset_criteria_after_gathering": true
  },
  "review": {
    "decision_quality_reviewed_separately_from_outcome": true,
    "decision_judged_by_process_and_information_at_time": true,
    "outcome_used_alone_to_judge_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 36 checks and a text stamp of the verdict):

```json
{
  "service": "decision-process-design",
  "atom_version": "0.1.0",
  "decision": "Launch new feature",
  "verdict": "DECISION_PROCESS_SOUND",
  "sections": {
    "framing_and_roles": "pass",
    "precommitment_before_data": "pass",
    "loss_stakes_and_rigor": "pass",
    "evidence_discipline_and_review": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "options_count": 2,
  "options_without_name": [],
  "options_not_declared_viable": [],
  "option_name_coverage": "1.0000",
  "criteria_count": 1,
  "criteria_without_name": [],
  "criteria_not_set_before_data": [],
  "criteria_without_threshold": [],
  "criterion_set_before_data_coverage": "1.0000",
  "criterion_threshold_coverage": "1.0000",
  "default_action": "A",
  "loss_cost_ratio": "2.0000",
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across four sections."
}
```

## Verdicts

- **DECISION_PROCESS_SOUND** — every check passes; the declared decision-process record is complete and consistent with the skill's checklist and tenets.
- **DECISION_PROCESS_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `options_count` and `criteria_count` (the declared list lengths as integers, or null when the list is not declared), the row-name lists `options_without_name`, `options_not_declared_viable`, `criteria_without_name`, `criteria_not_set_before_data` and `criteria_without_threshold` (null when the underlying list is not declared), `default_action` (the declared string, or null), the coverage / ratio values `option_name_coverage`, `criterion_set_before_data_coverage`, `criterion_threshold_coverage` and `loss_cost_ratio` (ratios as strings with exactly four decimal places; a coverage is null when its denominator list is absent or empty, and `loss_cost_ratio` is null when either cost is absent or `cost_of_false_inaction` is zero), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the nine primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
