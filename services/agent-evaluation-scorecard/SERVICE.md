# Agent evaluation scorecard — `agent-evaluation-scorecard`

**Deliverable type:** EVALUATION. This atom sells the evaluation it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Measure agents before trusting them — task suites, regression gates, calibrated judging, scorecards.

A caller submits the inputs the bound skill works on and receives one evaluation back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in How Milo works who need this evaluation on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Agent model change regression gates**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the agent-evaluation evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_TRUSTED`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `agent` (string; carried into the scorecard output, not itself checked) | — |
| `suite.versioned` | task_suite |
| `suite.criteria_written_before_run` | task_suite |
| `suite.acceptance_criteria_per_task` | task_suite |
| `suite.versioned_with_agent` | task_suite |
| `run.model_version_pinned` | reproducible_runs |
| `run.sampling_settings_pinned` | reproducible_runs |
| `run.tool_state_pinned` | reproducible_runs |
| `run.fixtures_pinned` | reproducible_runs |
| `run.raw_transcripts_stored` | reproducible_runs |
| `run.same_suite_per_candidate` | reproducible_runs |
| `judging.deterministic_checks_first` | judging |
| `judging.llm_judge_used` (gates the three LLM-judge controls below: required only when true) | judging |
| `judging.judge_calibrated_against_human_labels` | judging |
| `judging.judge_blinded` | judging |
| `judging.position_bias_controls` | judging |
| `judging.model_judges_itself` (fails when true and the judge is uncalibrated) | judging |
| `gates.eval_runs_before_merge` | regression_gates |
| `gates.regressions_block_merge` | regression_gates |
| `gates.accepted_tradeoffs_written` | regression_gates |
| `metrics.steps_tracked` | beyond_accuracy |
| `metrics.cost_tracked` | beyond_accuracy |
| `metrics.latency_tracked` | beyond_accuracy |
| `metrics.refusal_error_rates_tracked` | beyond_accuracy |
| `metrics.safety_violations_tracked` | beyond_accuracy |
| `metrics.silent_wrongness_tracked` | beyond_accuracy |
| `incidents.misbehavior_becomes_named_tests` | incident_replay |
| `incidents.all_production_incidents_replayed` | incident_replay |
| `scorecard.published_per_run` | scorecard |
| `scorecard.stored` | scorecard |
| `tasks[]` (list of task results, see below) | scorecard |
| `hygiene.contamination_checked` | benchmark_hygiene |
| `hygiene.variance_reported` | benchmark_hygiene |
| `hygiene.rebaselined_after_model_updates` | benchmark_hygiene |

Each `tasks[]` entry is `{name, passed, cost, allowed_cost, latency_ms,
allowed_latency_ms, safety_violation}`. The scorecard's computed check
passes only when every task met its own declared acceptance criteria
(passed, cost and latency within allowance, no safety violation); a
task missing any acceptance field makes the check
`INSUFFICIENT_EVIDENCE`. The output also carries the computed
`scorecard` counts (tasks_total / tasks_passing / safety_violations).

The verdict is one of `TRUSTED` (all 32 checks pass), `NOT_TRUSTED`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across eight sections: task_suite,
reproducible_runs, judging, regression_gates, beyond_accuracy,
incident_replay, scorecard, benchmark_hygiene.

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
