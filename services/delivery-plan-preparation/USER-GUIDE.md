# Delivery plan preparation — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a delivery plan for one project and a record of how it is framed, phased and run — plan gates, milestones, a risk register, a decision log and honest status. This atom reads one declared manifest and returns one deterministic verdict across four sections: **DELIVERY_PLAN_READY**, **DELIVERY_PLAN_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and internal consistency only: computed checks verify, over your own declared rows, that every phase names an owner, declares exit criteria, carries a size from the skill's vocabulary (`S`, `M` or `L`) and valid in-order ISO dates, that every declared dependency names a declared phase and ends no later than its dependent starts, that every milestone names a declared phase and an owner and falls due within that phase's dates, that every risk declares a mitigation and a trigger, and that every decision-log entry is complete. It writes no plan, sequences no work, estimates nothing, reads no `PLAN.md` / `RISKS.md` files or project trackers, and does not verify that a declared control actually happens — it is not a project management service or a delivery certification, and it never judges whether the goal, the decomposition, a size, a mitigation or the reported confidence is right, only that the record contains what the method requires. No numeric threshold is applied: no WIP number, phase/milestone/risk/decision count, confidence scale or duration limit is invented. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "delivery-plan-preparation"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/delivery-plan-preparation` — tool name `delivery_plan_preparation`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/delivery-plan-preparation` — body = the manifest object; same `Authorization` header.

## Input — the delivery-plan-preparation manifest

| Field | Meaning |
|---|---|
| `plan` | plan name (string; carried into the output, not checked) |
| `framing.goal_declared` / `deliverable_declared` / `constraints_declared` / `definition_of_done_declared` | framing evidence: the goal, deliverable, constraints and definition of done are declared |
| `framing.plan_approved_before_build` | the plan is approved before build starts |
| `framing.build_started_before_approval` | must be `false` to pass (charter violation: no building before an approved plan) |
| `phases` (list of phase rows) | computed: must be present and non-empty |
| `phases[].name` (string) | names the row; other rows' `depends_on` entries and milestones' `phase` fields must equal it to resolve |
| `phases[].owner` (string) | must be a non-empty string; an absent field is missing evidence, an empty string fails |
| `phases[].exit_criteria_declared` | every phase declares its exit criteria |
| `phases[].start_date` / `end_date` (string, strict ISO `YYYY-MM-DD`) | must parse as real calendar dates, with the end not before the start; an unparseable or impossible date such as `2027-02-30` fails |
| `phases[].depends_on` (list of strings) | each entry must name a declared phase, and a dependency's `end_date` must not fall after the dependent's `start_date`; an empty list declares no dependencies and passes |
| `phases[].size` (string) | must be one of `S`, `M` or `L`; any other string fails |
| `phases[].assumptions_declared` | every phase declares its assumptions (read by the risks/estimates section) |
| `milestones` (list of milestone rows) | computed: must be present and non-empty |
| `milestones[].name` (string) / `phase` (string) / `owner` (string) | `phase` must name a declared phase; `owner` must be a non-empty string |
| `milestones[].due_date` (string, strict ISO `YYYY-MM-DD`) | must fall within the named phase's declared start and end dates, inclusive |
| `estimation.least_known_item_flagged_as_top_risk` | the least-known item is flagged as the top risk |
| `risks` (list of risk rows) | computed: must be present and non-empty |
| `risks[].name` (string) / `mitigation_declared` / `trigger_declared` | every risk declares a mitigation and a trigger |
| `risk_management.register_reviewed_each_phase` | the risk register is reviewed each phase |
| `decisions` (list of decision-log entries) | computed: must be present and non-empty |
| `decisions[].date` (string, strict ISO `YYYY-MM-DD`) / `decision` (string) / `rationale_declared` / `alternatives_declared` | every entry must carry a parseable date, a non-empty decision, a declared rationale and declared alternatives |
| `decision_log.append_only` / `logged_at_decision_time` | the decision log is append-only and entries are logged when made |
| `execution.wip_limit_declared` / `one_worked_item_per_lane` / `plan_updates_through_approval` | execution discipline: a WIP limit is declared, one worked item per lane, plan updates go through approval |
| `execution.silent_rescoping_present` | must be `false` to pass (red line: no silent re-scoping) |
| `execution.deploys_hitl_approved` | deploys are human-approved |
| `execution.direct_to_production_change_present` | must be `false` to pass (charter violation: never a direct-to-production change) |
| `status.phase_declared` / `done_declared` / `next_declared` / `blockers_declared` / `confidence_declared` | status evidence: current phase, done, next, blockers and confidence are all reported |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward DELIVERY_PLAN_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/delivery-plan-preparation`:

```json
{
  "plan": "Project Alpha",
  "framing": {
    "goal_declared": true,
    "deliverable_declared": true,
    "constraints_declared": true,
    "definition_of_done_declared": true,
    "plan_approved_before_build": true,
    "build_started_before_approval": false
  },
  "phases": [
    {
      "name": "Phase1",
      "owner": "Alice",
      "exit_criteria_declared": true,
      "start_date": "2023-01-01",
      "end_date": "2023-01-10",
      "depends_on": [],
      "size": "S",
      "assumptions_declared": true
    }
  ],
  "milestones": [
    {
      "name": "M1",
      "phase": "Phase1",
      "owner": "Bob",
      "due_date": "2023-01-05"
    }
  ],
  "estimation": {
    "least_known_item_flagged_as_top_risk": true
  },
  "risks": [
    {
      "name": "Risk1",
      "mitigation_declared": true,
      "trigger_declared": true
    }
  ],
  "risk_management": {
    "register_reviewed_each_phase": true
  },
  "decisions": [
    {
      "date": "2023-01-02",
      "decision": "Use SQL",
      "rationale_declared": true,
      "alternatives_declared": true
    }
  ],
  "decision_log": {
    "append_only": true,
    "logged_at_decision_time": true
  },
  "execution": {
    "wip_limit_declared": true,
    "one_worked_item_per_lane": true,
    "plan_updates_through_approval": true,
    "silent_rescoping_present": false,
    "deploys_hitl_approved": true,
    "direct_to_production_change_present": false
  },
  "status": {
    "phase_declared": true,
    "done_declared": true,
    "next_declared": true,
    "blockers_declared": true,
    "confidence_declared": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 38 checks and a text stamp of the verdict):

```json
{
  "service": "delivery-plan-preparation",
  "atom_version": "0.1.0",
  "plan": "Project Alpha",
  "verdict": "DELIVERY_PLAN_READY",
  "sections": {
    "framing_and_approval": "pass",
    "phases_milestones_and_dependencies": "pass",
    "risks_estimates_and_decisions": "pass",
    "execution_discipline_and_status": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "phases_count": 1,
  "milestones_count": 1,
  "risks_count": 1,
  "decisions_count": 1,
  "total_duration_days": 9,
  "owner_coverage": "1.0000",
  "dependency_coverage": null,
  "milestone_phase_coverage": "1.0000",
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across four sections."
}
```

## Verdicts

- **DELIVERY_PLAN_READY** — every check passes; the declared delivery-plan record is complete and consistent with the skill's method, quality gates and red lines.
- **DELIVERY_PLAN_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports the counts `phases_count`, `milestones_count`, `risks_count` and `decisions_count` (integers, or null when the list is not declared), `total_duration_days` (the exact integer day count from the earliest declared phase start to the latest declared phase end, or null unless every phase carries both parseable dates), the row-name lists `phases_without_owner`, `phases_without_exit_criteria`, `phases_with_date_problems`, `unknown_dependencies`, `dependency_order_violations`, `milestones_without_owner`, `milestones_with_unknown_phase`, `milestones_due_outside_phase_dates`, `risks_without_mitigation`, `risks_without_trigger` and `decisions_incomplete` (each null when its underlying list is not declared), the coverage ratios `owner_coverage`, `dependency_coverage` and `milestone_phase_coverage` (strings with exactly four decimal places, round half up, or null when the denominator is absent or empty) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the six primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
