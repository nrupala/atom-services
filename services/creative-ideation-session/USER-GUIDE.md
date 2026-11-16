# Creative ideation session — user guide

## What it does

You have a creative ideation session record — a brief, preparation, capture, generation, divergence, idea-pool, selection, shortlist and sharing record for one session. This atom reads one declared manifest and returns one deterministic verdict across six sections: **SESSION_COMPLETE**, **SESSION_NOT_COMPLETE**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared session record's completeness and internal consistency only — it does not run the session, generate ideas, or judge whether any idea is good, original, or worth pursuing. Computed checks: the captured idea count must meet the caller-declared target (the skill states no number for "many", so no minimum is imposed); the declared unique-after-dedup count must equal captured minus duplicates removed; the shortlist must hold at least one idea and not exceed the unique pool (no shortlist size or ratio is imposed); and every divergence method used must be one of the five the skill names — `brainstorm`, `scamper`, `analogies`, `combining_distant_domains`, `what_if` (at least one stated method, no particular method mandatory). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "creative-ideation-session"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/creative-ideation-session` — tool name `creative_ideation_session`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/creative-ideation-session` — body = the manifest object; same `Authorization` header.

## Input — the creative-ideation-session manifest

| Field | Meaning |
|---|---|
| `session_title` | session title (string; carried into the output, not checked) |
| `brief.written` / `goal_or_question_stated` / `constraints_declared` | brief evidence: a written brief stating the goal or question, with constraints declared |
| `preparation.scheduled_in_advance` / `prepared_with_inputs_ready` | preparation evidence: scheduled in advance, prepared with inputs ready |
| `capture.capture_system_used` / `all_ideas_captured` / `no_judging_at_capture` | capture evidence: a capture system used, all ideas captured, no judging at capture |
| `generation.editing_separated_from_generating` / `small_reps_or_low_start_bar_used` | generation evidence: editing separated from generating; small reps or a low start bar used |
| `divergence.diverged_before_converging` | divergence happened before converging |
| `divergence.methods_used` (list of strings) | computed: must be non-empty and every entry one of `brainstorm`, `scamper`, `analogies`, `combining_distant_domains`, `what_if`; reported as `methods_used` and `methods_used_count` |
| `divergence.constraints_used_as_prompt` | constraints used as a prompt |
| `idea_pool.target_idea_count` (number), `idea_pool.total_ideas_captured` (number) | computed: captured must meet or exceed the declared target, the target must be positive and captured not negative; reported as `target_idea_count`, `total_ideas_captured` and `volume_gap_ideas` (6 decimal places) |
| `idea_pool.dedup_performed` / `ideas_clustered_or_grouped` | dedup and clustering evidence |
| `idea_pool.duplicates_removed` (number), `idea_pool.unique_ideas_after_dedup` (number) | computed: unique must equal captured minus duplicates, with no negative counts and duplicates not exceeding captured; reported as `duplicates_removed`, `unique_ideas_after_dedup` and `dedup_discrepancy_ideas` (6 decimal places) |
| `selection.criteria_written_before_scoring` / `criteria_applied_to_all_unique_ideas` / `scoring_only_after_divergence_complete` | selection evidence: criteria written before scoring, applied to all unique ideas, scoring only after divergence is complete |
| `shortlist.shortlist_count` (number) | computed: at least 1 and not more than the unique pool; reported as `shortlist_count` |
| `shortlist.rationale_written` / `rationale_references_criteria` | shortlist rationale evidence |
| `outcome.shared_for_feedback` | the session output was shared for feedback |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward SESSION_NOT_COMPLETE).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/creative-ideation-session`:

```json
{
  "session_title": "Q3 Product Strategy",
  "brief": {
    "written": true,
    "goal_or_question_stated": true,
    "constraints_declared": true
  },
  "preparation": {
    "scheduled_in_advance": true,
    "prepared_with_inputs_ready": true
  },
  "capture": {
    "capture_system_used": true,
    "all_ideas_captured": true,
    "no_judging_at_capture": true
  },
  "generation": {
    "editing_separated_from_generating": true,
    "small_reps_or_low_start_bar_used": true
  },
  "divergence": {
    "diverged_before_converging": true,
    "methods_used": [
      "brainstorm",
      "scamper"
    ],
    "constraints_used_as_prompt": true
  },
  "idea_pool": {
    "target_idea_count": 10,
    "total_ideas_captured": 12,
    "dedup_performed": true,
    "duplicates_removed": 2,
    "unique_ideas_after_dedup": 10,
    "ideas_clustered_or_grouped": true
  },
  "selection": {
    "criteria_written_before_scoring": true,
    "criteria_applied_to_all_unique_ideas": true,
    "scoring_only_after_divergence_complete": true
  },
  "shortlist": {
    "shortlist_count": 3,
    "rationale_written": true,
    "rationale_references_criteria": true
  },
  "outcome": {
    "shared_for_feedback": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 24 checks and a text stamp of the verdict):

```json
{
  "service": "creative-ideation-session",
  "atom_version": "0.1.0",
  "session_title": "Q3 Product Strategy",
  "methods_used": [
    "brainstorm",
    "scamper"
  ],
  "verdict": "SESSION_COMPLETE",
  "sections": {
    "brief_and_preparation": "pass",
    "capture_and_generation": "pass",
    "divergence_and_methods": "pass",
    "idea_pool_and_volume": "pass",
    "selection_and_convergence": "pass",
    "shortlist_and_ship": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "target_idea_count": 10,
  "total_ideas_captured": 12,
  "volume_gap_ideas": "2.000000",
  "duplicates_removed": 2,
  "unique_ideas_after_dedup": 10,
  "dedup_discrepancy_ideas": "0.000000",
  "shortlist_count": 3,
  "methods_used_count": 2,
  "summary": "24 pass, 0 fail, 0 missing of 24 checks across six sections."
}
```

## Verdicts

- **SESSION_COMPLETE** — every check passes; the session record is complete and internally consistent on the declared evidence.
- **SESSION_NOT_COMPLETE** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `target_idea_count`, `total_ideas_captured` and `volume_gap_ideas`, `duplicates_removed`, `unique_ideas_after_dedup` and `dedup_discrepancy_ideas` (computed differences as strings with exactly six decimals, or null when they cannot be computed), `shortlist_count`, `methods_used` and `methods_used_count` (or null when absent), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
