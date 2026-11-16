# Decision-trap sweep — user guide

## What it does

You are about to make a decision. This atom reads a declared decision
record — how the decision was framed and classified (reversible or
irreversible), the options considered, criteria set before scoring, the
evaluation method, the pre-mortem, whether it was made in a rush or a
mood, and the decision log — and sweeps it for decision traps across
seven sections (framing_and_classification, options,
criteria_before_evaluation, evaluation_and_uncertainty, pre_mortem,
rush_and_mood_trap, decision_log_and_review). The verdict is
**TRAP_CLEAR**, **TRAPS_PRESENT**, or **INSUFFICIENT_EVIDENCE** (nothing
failed, but evidence is missing — the verdict names exactly which).
Same record in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "decision-trap-sweep"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/decision-trap-sweep`
  — tool name `decision_trap_sweep`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/decision-trap-sweep`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `decision` (string) | the decision (carried into the output) |
| `framing.decision_stated`, `framing.decide_by_named`, `framing.constraints_named`, `framing.out_of_scope_named`, `framing.classification` (`reversible`/`irreversible`), `framing.stakes_assessed` | the decision is framed, owned, bounded and classified |
| `options.list` (at least 3), `options.includes_status_quo`, `options.includes_smaller_reversible_step` | real options, including doing nothing and a smaller reversible step |
| `criteria.criteria_listed`, `criteria.defined_before_scoring`, `criteria.weights_assigned_before_scoring` | criteria and weights fixed before scoring |
| `evaluation.method_named`, `evaluation.uncertainty_flagged`, `evaluation.probabilities_estimable`, `evaluation.expected_value_used` | a fitting evaluation method; expected value used when probabilities are estimable |
| `premortem.decision_is_material`, `premortem.conducted`, `premortem.top_risks_hedged` | a pre-mortem for material decisions, with top risks hedged |
| `rush.made_in_rush` (must be `false`), `rush.made_in_a_mood` (must be `false`) | irreversible decisions are never made in a rush or a mood |
| `log.choice_recorded`, `log.rationale_recorded`, `log.assumptions_recorded`, `log.review_date_set`, `log.communicated_with_why` | the decision is logged and communicated |

All fields are booleans unless noted. A field **absent** = evidence
missing (counts toward INSUFFICIENT_EVIDENCE). A field present but
false/invalid = the trap is present (counts toward TRAPS_PRESENT).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/decision-trap-sweep`:

```json
{
  "decision": "Migrate database to cloud",
  "framing": {
    "decision_stated": true,
    "decide_by_named": true,
    "constraints_named": true,
    "out_of_scope_named": true,
    "classification": "irreversible",
    "stakes_assessed": true
  },
  "options": {
    "list": [
      "Option A",
      "Option B",
      "Option C"
    ],
    "includes_status_quo": true,
    "includes_smaller_reversible_step": true
  },
  "criteria": {
    "criteria_listed": true,
    "defined_before_scoring": true,
    "weights_assigned_before_scoring": true
  },
  "evaluation": {
    "method_named": true,
    "uncertainty_flagged": true,
    "probabilities_estimable": true,
    "expected_value_used": true
  },
  "premortem": {
    "decision_is_material": true,
    "conducted": true,
    "top_risks_hedged": true
  },
  "rush": {
    "made_in_rush": false,
    "made_in_a_mood": false
  },
  "log": {
    "choice_recorded": true,
    "rationale_recorded": true,
    "assumptions_recorded": true,
    "review_date_set": true,
    "communicated_with_why": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 24 checks and a text stamp of the verdict):

```json
{
  "service": "decision-trap-sweep",
  "atom_version": "0.1.0",
  "decision": "Migrate database to cloud",
  "verdict": "TRAP_CLEAR",
  "sections": {
    "framing_and_classification": "pass",
    "options": "pass",
    "criteria_before_evaluation": "pass",
    "evaluation_and_uncertainty": "pass",
    "pre_mortem": "pass",
    "rush_and_mood_trap": "pass",
    "decision_log_and_review": "pass"
  },
  "summary": "24 pass, 0 fail, 0 missing of 24 checks across seven sections."
}
```

## Verdicts

- **TRAP_CLEAR** — every check passes; no trap is present in the record.
- **TRAPS_PRESENT** — at least one check fails; the failing checks name the trap and the section it sits in.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
