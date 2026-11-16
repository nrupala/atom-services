# Agent Evaluation Scorecard — user guide

## What it does

You are about to trust an AI agent with real work. This atom reads a
short evidence manifest describing how that agent was evaluated — a
versioned task suite with criteria written before the run, pinned
model/sampling/tool state, calibrated and blinded judging, regression
gates, tracked cost/latency/safety metrics, incident replay, and the
per-task results — and returns one deterministic verdict across eight
sections with per-check evidence: **TRUSTED**, **NOT_TRUSTED**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). It also computes the scorecard
counts (tasks_total / tasks_passing / safety_violations) from the task
rows you submit. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "agent-evaluation-scorecard"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/agent-evaluation-scorecard`
  — tool name `agent_evaluation_scorecard`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/agent-evaluation-scorecard`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `agent` (string) | agent name; carried into the output, not itself checked |
| `suite.versioned`, `suite.criteria_written_before_run`, `suite.acceptance_criteria_per_task`, `suite.versioned_with_agent` | the task suite |
| `run.model_version_pinned`, `run.sampling_settings_pinned`, `run.tool_state_pinned`, `run.fixtures_pinned`, `run.raw_transcripts_stored`, `run.same_suite_per_candidate` | reproducible runs |
| `judging.deterministic_checks_first`, `judging.llm_judge_used`, `judging.judge_calibrated_against_human_labels`, `judging.judge_blinded`, `judging.position_bias_controls`, `judging.model_judges_itself` | judging controls (the LLM-judge controls are required only when an LLM judge is used; self-judging fails only when uncalibrated) |
| `gates.eval_runs_before_merge`, `gates.regressions_block_merge`, `gates.accepted_tradeoffs_written` | regression gates |
| `metrics.steps_tracked`, `metrics.cost_tracked`, `metrics.latency_tracked`, `metrics.refusal_error_rates_tracked`, `metrics.safety_violations_tracked`, `metrics.silent_wrongness_tracked` | beyond-accuracy metrics |
| `incidents.misbehavior_becomes_named_tests`, `incidents.all_production_incidents_replayed` | incident replay |
| `scorecard.published_per_run`, `scorecard.stored` | the scorecard itself |
| `tasks[]` | task rows `{name, passed, cost, allowed_cost, latency_ms, allowed_latency_ms, safety_violation}`; every task must meet its own declared criteria |
| `hygiene.contamination_checked`, `hygiene.variance_reported`, `hygiene.rebaselined_after_model_updates` | benchmark hygiene |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the
section fails (counts toward NOT_TRUSTED).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/agent-evaluation-scorecard`:

```json
{
  "agent": "milo-v4",
  "suite": {
    "versioned": true,
    "criteria_written_before_run": true,
    "acceptance_criteria_per_task": true,
    "versioned_with_agent": true
  },
  "run": {
    "model_version_pinned": true,
    "sampling_settings_pinned": true,
    "tool_state_pinned": true,
    "fixtures_pinned": true,
    "raw_transcripts_stored": true,
    "same_suite_per_candidate": true
  },
  "judging": {
    "deterministic_checks_first": true,
    "llm_judge_used": false,
    "judge_calibrated_against_human_labels": true,
    "judge_blinded": true,
    "position_bias_controls": true,
    "model_judges_itself": false
  },
  "gates": {
    "eval_runs_before_merge": true,
    "regressions_block_merge": true,
    "accepted_tradeoffs_written": true
  },
  "metrics": {
    "steps_tracked": true,
    "cost_tracked": true,
    "latency_tracked": true,
    "refusal_error_rates_tracked": true,
    "safety_violations_tracked": true,
    "silent_wrongness_tracked": true
  },
  "incidents": {
    "misbehavior_becomes_named_tests": true,
    "all_production_incidents_replayed": true
  },
  "scorecard": {
    "published_per_run": true,
    "stored": true
  },
  "tasks": [
    {
      "name": "t1",
      "passed": true,
      "cost": 0.1,
      "allowed_cost": 0.5,
      "latency_ms": 100,
      "allowed_latency_ms": 500,
      "safety_violation": false
    }
  ],
  "hygiene": {
    "contamination_checked": true,
    "variance_reported": true,
    "rebaselined_after_model_updates": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "agent-evaluation-scorecard",
  "atom_version": "0.1.0",
  "agent": "milo-v4",
  "verdict": "TRUSTED",
  "sections": {"task_suite": "pass", "reproducible_runs": "pass", "judging": "pass", "regression_gates": "pass", "beyond_accuracy": "pass", "incident_replay": "pass", "scorecard": "pass", "benchmark_hygiene": "pass"},
  "scorecard": {"tasks_total": 1, "tasks_passing": 1, "safety_violations": 0},
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across eight sections."
}
```

## Verdicts

- **TRUSTED** — every check passes; the evaluation clears all eight sections.
- **NOT_TRUSTED** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
