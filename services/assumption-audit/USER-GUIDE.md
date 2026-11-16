# Assumption Audit — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are about to act on a decision. This atom reads a short evidence
manifest describing how the decision was made — the decision named,
real options listed, the decision-maker and objective identified,
criteria and a change-my-mind threshold set before the data was seen,
loss framed in each direction, stakes and reversibility assessed,
exploratory and confirmatory data kept separate, and the decision
reviewed separately from its outcome — and returns one deterministic
verdict across six sections with per-check evidence: **SOUND**,
**UNSOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but
evidence is missing — the verdict names exactly which). Same
manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "assumption-audit"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/assumption-audit`
  — tool name `assumption_audit`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/assumption-audit`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `decision` (string) | decision name; carried into the output, not itself checked |
| `framing.decision_named`, `framing.options_listed`, `framing.decision_maker_identified`, `framing.objective_defined` | framing |
| `preset.criteria_set_before_data`, `preset.default_action_set`, `preset.change_threshold_set_before_data` | criteria preset before data |
| `loss.framed_each_direction`, `loss.threshold_reflects_asymmetry` | loss function |
| `rigor.stakes_assessed`, `rigor.reversibility_assessed`, `rigor.effort_matched` | rigor sizing |
| `data.exploratory_confirmatory_separated`, `data.conclusion_not_from_inspiring_data`, `data.evidence_could_change_decision`, `data.roles_clear` | data discipline |
| `review.conducted`, `review.separates_decision_from_outcome` | review |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the
section fails (counts toward UNSOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/assumption-audit`:

```json
{
  "decision": "Launch new product line",
  "framing": {
    "decision_named": true,
    "options_listed": true,
    "decision_maker_identified": true,
    "objective_defined": true
  },
  "preset": {
    "criteria_set_before_data": true,
    "default_action_set": true,
    "change_threshold_set_before_data": true
  },
  "loss": {
    "framed_each_direction": true,
    "threshold_reflects_asymmetry": true
  },
  "rigor": {
    "stakes_assessed": true,
    "reversibility_assessed": true,
    "effort_matched": true
  },
  "data": {
    "exploratory_confirmatory_separated": true,
    "conclusion_not_from_inspiring_data": true,
    "evidence_could_change_decision": true,
    "roles_clear": true
  },
  "review": {
    "conducted": true,
    "separates_decision_from_outcome": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "assumption-audit",
  "atom_version": "0.1.0",
  "decision": "Launch new product line",
  "verdict": "SOUND",
  "sections": {"framing": "pass", "preset_criteria": "pass", "loss_function": "pass", "rigor_sizing": "pass", "data_discipline": "pass", "review": "pass"},
  "summary": "18 pass, 0 fail, 0 missing of 18 checks across six sections."
}
```

## Verdicts

- **SOUND** — every check passes; the decision process clears all six sections.
- **UNSOUND** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
