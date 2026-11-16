# Delivery plan preparation — documentation

**Delivery plan preparation** · slug `delivery-plan-preparation` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `plan` "Project Alpha"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "delivery-plan-preparation"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the delivery-plan manifest.** You declare a record of work already done — the atom audits the record, it does not do the work (see Explanation). The recorded full-pass manifest declares the plan `Project Alpha`: goal, deliverable, constraints and definition of done are declared, the plan is approved before build, and build has not started before approval. Its phases each name an owner, declare exit criteria, carry a size from the skill's vocabulary (`S`, `M` or `L`), declare assumptions, and carry strict ISO dates in order; every `depends_on` entry names a declared phase and no dependency ends after its dependent starts. Milestones name declared phases and owners and fall due within their phase's dates. Risks each declare a mitigation and a trigger, the least-known item is flagged as top risk, and decision-log entries carry the full log shape (parseable date, decision text, rationale and alternatives declared) in an append-only log. Execution declares a WIP limit, one worked item per lane, approval-gated plan updates and HITL-approved deploys, with no silent re-scoping and no direct-to-production change; status declares phase, done, next, blockers and confidence.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/delivery-plan-preparation` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `DELIVERY_PLAN_READY`: "38 pass, 0 fail, 0 missing of 38 checks across four sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `DELIVERY_PLAN_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "delivery-plan-preparation"}`.
3. Call: `POST https://atoms.pipavia.com/v1/delivery-plan-preparation` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/delivery-plan-preparation` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `delivery_plan_preparation`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `DELIVERY_PLAN_NOT_READY` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_phase_has_owner_named`, `every_phase_has_exit_criteria`, `every_phase_has_skill_size`, `every_risk_has_mitigation`, and the summary reads "34 pass, 4 fail, 0 missing of 38 checks across four sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (see Output format). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "phases",
  "detail": "phases must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/delivery-plan-preparation` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/delivery-plan-preparation` — tool name `delivery_plan_preparation`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `delivery_plan_preparation` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `DELIVERY_PLAN_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `plan` | string | Carried into the verdict output, not itself checked |

#### Read by: framing_and_approval

| Field | Type | Notes |
|---|---|---|
| `framing.goal_declared` | boolean | — |
| `framing.deliverable_declared` | boolean | — |
| `framing.constraints_declared` | boolean | — |
| `framing.definition_of_done_declared` | boolean | — |
| `framing.plan_approved_before_build` | boolean | — |
| `framing.build_started_before_approval` | boolean | must be `false` to pass — charter violation |

#### Read by: phases_milestones_and_dependencies

| Field | Type | Notes |
|---|---|---|
| `phases` | list | list of phase-row objects, each `{name, owner, exit_criteria_declared, start_date, end_date, depends_on, size, assumptions_declared}` — see the eight entry fields below; computed, see below |
| `phases[].name` | string | Names the row in the computed outputs and is the name other rows' `depends_on` entries and milestones' `phase` fields must equal to resolve |
| `phases[].owner` | string | Must be a non-empty string for the row to pass the computed owner check — an absent field is missing evidence, an empty string fails |
| `phases[].exit_criteria_declared` | boolean | — |
| `phases[].start_date` | string | Strict ISO `YYYY-MM-DD` — must parse as a real calendar date for the row to pass the computed date checks; an absent field is missing evidence, an unparseable or impossible date such as `2027-02-30` fails |
| `phases[].end_date` | string | Strict ISO `YYYY-MM-DD`, same rule as `start_date`; the end must not fall before the start |
| `phases[].depends_on` | list of strings | Each entry must name a declared phase — see the computed dependency checks below; an empty list declares no dependencies and passes |
| `phases[].size` | string | Must be one of the skill's own size vocabulary — `S`, `M` or `L` — for the row to pass the computed size check; any other string fails, an absent field is missing evidence |
| `milestones` | list | list of milestone-row objects, each `{name, phase, owner, due_date}` — see the four entry fields below; computed, see below |
| `milestones[].name` | string | Names the row in the computed outputs |
| `milestones[].phase` | string | Must name a declared phase for the row to pass the computed phase-resolution and due-date checks |
| `milestones[].owner` | string | Must be a non-empty string for the row to pass the computed owner check — an absent field is missing evidence, an empty string fails |
| `milestones[].due_date` | string | Strict ISO `YYYY-MM-DD`, same date rule as the phase dates; must fall within the named phase's declared start and end dates, inclusive |

#### Read by: risks_estimates_and_decisions

| Field | Type | Notes |
|---|---|---|
| `phases[].assumptions_declared` | boolean | — |
| `estimation.least_known_item_flagged_as_top_risk` | boolean | — |
| `risks` | list | list of risk-row objects, each `{name, mitigation_declared, trigger_declared}` — see the three entry fields below; computed, see below |
| `risks[].name` | string | Names the row in the computed `risks_without_*` outputs |
| `risks[].mitigation_declared` | boolean | — |
| `risks[].trigger_declared` | boolean | — |
| `risk_management.register_reviewed_each_phase` | boolean | — |
| `decisions` | list | list of decision-log entry objects, each `{date, decision, rationale_declared, alternatives_declared}` — see the four entry fields below; computed, see below |
| `decisions[].date` | string | Strict ISO `YYYY-MM-DD`, same date rule as the phase dates; must parse as a real calendar date for the entry to pass the computed completeness check |
| `decisions[].decision` | string | Must be a non-empty string for the entry to pass the computed completeness check, and names the entry in the computed `decisions_incomplete` output |
| `decisions[].rationale_declared` | boolean | — |
| `decisions[].alternatives_declared` | boolean | — |
| `decision_log.append_only` | boolean | — |
| `decision_log.logged_at_decision_time` | boolean | — |

#### Read by: execution_discipline_and_status

| Field | Type | Notes |
|---|---|---|
| `execution.wip_limit_declared` | boolean | — |
| `execution.one_worked_item_per_lane` | boolean | — |
| `execution.plan_updates_through_approval` | boolean | — |
| `execution.silent_rescoping_present` | boolean | must be `false` to pass — skill red line |
| `execution.deploys_hitl_approved` | boolean | — |
| `execution.direct_to_production_change_present` | boolean | must be `false` to pass — charter violation |
| `status.phase_declared` | boolean | — |
| `status.done_declared` | boolean | — |
| `status.next_declared` | boolean | — |
| `status.blockers_declared` | boolean | — |
| `status.confidence_declared` | boolean | — |

### Checks

All 38 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: framing_and_approval

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `goal_declared` | frame: the goal is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deliverable_declared` | frame: the deliverable is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `constraints_declared` | frame: the constraints — time, cost, licenses, environment — are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `definition_of_done_declared` | frame: the definition of done is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `plan_approved_before_build` | quality gate: the plan is approved before build starts | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_build_started_before_approval` | charter: no building before an approved plan — build has not started before approval | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
#### Section: phases_milestones_and_dependencies

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `phases_declared` | phase the work: the declared plan record names its phases — the phases list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_phase_has_owner_named` | quality gate: every phase has an owner — every declared phase row names a non-empty owner | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_phase_has_exit_criteria` | quality gate: every phase has exit criteria — what must be true to move on — declared on every phase row | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_phase_has_skill_size` | estimate honestly: every declared phase row carries a size from the skill's own vocabulary — S, M or L | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_phase_dates_valid_and_in_order` | phase the work: every declared phase row carries a valid ISO start and end date, and the end does not fall before the start | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_dependency_names_declared_phase` | dependencies: every name in a phase's declared depends_on list names a phase the plan declares | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_dependency_precedes_dependent` | sequencing: schedule arithmetic over the declared dates — a dependency's declared end date does not fall after the dependent phase's declared start date | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `milestones_declared` | milestones: the declared plan record names its milestones — the milestones list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_milestone_names_declared_phase` | milestones: every declared milestone names a phase the plan declares | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_milestone_has_owner_named` | milestones: every declared milestone row names a non-empty owner | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_milestone_due_within_phase_dates` | milestones: schedule arithmetic over the declared dates — every milestone's declared due date falls within its named phase's declared start and end dates | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
#### Section: risks_estimates_and_decisions

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `risks_declared` | risk register: the declared plan record names its risks — the risks list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_risk_has_mitigation` | quality gate: risks have mitigations — every declared risk row declares a mitigation | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_risk_has_trigger` | quality gate: risks have triggers — every declared risk row declares a trigger | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `risk_register_reviewed_each_phase` | risk register: the register is reviewed each phase | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_phase_declares_assumptions` | estimate honestly: sizes come with assumptions listed — every declared phase row declares its assumptions | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `least_known_item_flagged_as_top_risk` | estimate honestly: the least-known item is flagged as the top risk | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `decisions_declared` | decision log: the declared plan record names its decision-log entries — the decisions list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_decision_entry_complete` | decision log: every entry carries the skill's log shape — a valid date, the decision, a declared rationale and declared alternatives considered | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `decision_log_append_only` | decision log: the log is append-only | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `decisions_logged_at_decision_time` | quality gate: decisions are logged when made, not reconstructed later | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
#### Section: execution_discipline_and_status

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `wip_limit_declared` | WIP limit: a work-in-progress limit is declared — finish phases, don't parallelize beyond capacity | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `one_worked_item_per_lane` | WIP limit: one worked item per lane | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `plan_updates_through_approval` | red line: plan updates go through approval | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_silent_rescoping` | red line: no silent re-scoping | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `deploys_hitl_approved` | red line: deploys are HITL — human approves; automation prepares, humans decide | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_direct_to_production_change` | charter: never a direct-to-production change | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `status_phase_declared` | status: the current phase is reported | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `status_done_declared` | status: what is done is reported | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `status_next_declared` | status: what is next is reported | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `status_blockers_declared` | status: blockers are reported | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `status_confidence_declared` | status: confidence is reported | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"delivery-plan-preparation"`), `atom_version` (`"0.1.0"`), and `plan` (the manifest's declared title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `phases_count`, `milestones_count`, `risks_count` and `decisions_count` (declared list lengths as integers, or null when the list is not declared); the row-name lists `phases_without_owner`, `phases_without_exit_criteria`, `phases_with_date_problems`, `unknown_dependencies`, `dependency_order_violations`, `milestones_without_owner`, `milestones_with_unknown_phase`, `milestones_due_outside_phase_dates`, `risks_without_mitigation`, `risks_without_trigger` and `decisions_incomplete` (each null when its underlying list — or, for the milestone-phase lists, either list — is not declared; dependency entries are reported as `dependent->dependency`); `total_duration_days` (the exact integer day count from the earliest declared phase start to the latest declared phase end; null unless every declared phase carries both dates and both parse); the ratios `owner_coverage`, `dependency_coverage` and `milestone_phase_coverage` (strings with exactly four decimal places; null when the denominator list is absent or empty — for dependency coverage, when no phase declares any dependency; for milestone phase coverage, when either list is absent); and `computed_status` (see Verdict vocabulary). Ratios use the fixed serialization rule — round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, formatted with exactly four decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "38 pass, 0 fail, 0 missing of 38 checks across four sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `DELIVERY_PLAN_READY` — all 38 checks pass: the declared record is complete and consistent with the bound skill's checklist, gates and red lines.
- `DELIVERY_PLAN_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the delivery_plan_preparation scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the delivery_plan_preparation scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"phases","detail":"phases must be a list"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for delivery-plan-preparation exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Plan and run delivery in phases — plan gates, milestones, risk register, decision log, and honest status (bound from the delivery-planning skill). You submit one declared record — the delivery-plan manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 4 sections (`framing_and_approval`, `phases_milestones_and_dependencies`, `risks_estimates_and_decisions`, `execution_discipline_and_status`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — list presence, per-row completeness, cross-row consistency and, where the skill states them, its own arithmetic — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies; when the gate is not triggered they pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `DELIVERY_PLAN_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `DELIVERY_PLAN_READY`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: no numeric WIP limit (only that a limit is declared), no minimum or maximum phase or milestone count, no minimum risk-register size, no minimum decision-log entry count beyond non-empty, no confidence scale or percentage, no maximum total or phase duration, and no estimate-accuracy tolerance. The bars that do exist are the skill's own: the `S` / `M` / `L` size vocabulary, strict ISO calendar dates, and completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** record: a verdict of `DELIVERY_PLAN_READY` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares the required acts passes those checks even if the real work did none of it. It is a completeness and consistency audit, not a certification of the underlying work. Specifically: it writes no plan, sequences no work, estimates nothing, reads no `PLAN.md` / `RISKS.md` files or project trackers, and does not verify that a declared control actually happens. It never judges whether the goal is the right goal, whether the phases are the right decomposition, whether a size is honest, whether a mitigation would actually work, or whether the reported confidence is warranted. Caller declarations only, never judged: whether the constraints list is complete, whether an exit criterion is strong enough to gate on, whether the flagged least-known item truly is the least known, whether a decision's rationale is sound or its alternatives genuinely considered, what the caller's actual capacity is (only that a WIP limit is declared is checked), and whether the reported status is honest rather than status theater. There is no critical-path computation beyond the declared dependency-order arithmetic, and no check that a phase's dates are realistic.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: multi-step project planning. Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared delivery-plan record; its verdict is a planning-completeness judgment, not compliance or audit evidence, and delivery planning is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `delivery_plan_preparation` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly four decimal places under the fixed rule `floor(v * 10000 + 0.5) / 10000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/delivery_plan_preparation.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_delivery_plan_preparation.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/delivery-plan-preparation` (REST) and `POST /mcp/delivery-plan-preparation` (MCP, tool `delivery_plan_preparation`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `delivery_plan_preparation`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T03:29:08.588468+00:00 against gateway v1.1.0, external verification lane, source `verification/work/delivery-plan-preparation/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "framing_and_approval",
      "check": "goal_declared",
      "status": "pass",
      "evidence": "frame: the goal is declared"
    },
    {
      "section": "framing_and_approval",
      "check": "deliverable_declared",
      "status": "pass",
      "evidence": "frame: the deliverable is declared"
    },
    {
      "section": "framing_and_approval",
      "check": "constraints_declared",
      "status": "pass",
      "evidence": "frame: the constraints \u2014 time, cost, licenses, environment \u2014 are declared"
    },
    {
      "section": "framing_and_approval",
      "check": "definition_of_done_declared",
      "status": "pass",
      "evidence": "frame: the definition of done is declared"
    },
    {
      "section": "framing_and_approval",
      "check": "plan_approved_before_build",
      "status": "pass",
      "evidence": "quality gate: the plan is approved before build starts"
    },
    {
      "section": "framing_and_approval",
      "check": "no_build_started_before_approval",
      "status": "pass",
      "evidence": "charter: no building before an approved plan \u2014 build has not started before approval"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "phases_declared",
      "status": "pass",
      "evidence": "phase the work: the declared plan record names its phases \u2014 the phases list is present and non-empty"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_phase_has_owner_named",
      "status": "pass",
      "evidence": "quality gate: every phase has an owner \u2014 every declared phase row names a non-empty owner"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_phase_has_exit_criteria",
      "status": "pass",
      "evidence": "quality gate: every phase has exit criteria \u2014 what must be true to move on \u2014 declared on every phase row"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_phase_has_skill_size",
      "status": "pass",
      "evidence": "estimate honestly: every declared phase row carries a size from the skill's own vocabulary \u2014 S, M or L"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_phase_dates_valid_and_in_order",
      "status": "pass",
      "evidence": "phase the work: every declared phase row carries a valid ISO start and end date, and the end does not fall before the start"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_dependency_names_declared_phase",
      "status": "pass",
      "evidence": "dependencies: every name in a phase's declared depends_on list names a phase the plan declares"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_dependency_precedes_dependent",
      "status": "pass",
      "evidence": "sequencing: schedule arithmetic over the declared dates \u2014 a dependency's declared end date does not fall after the dependent phase's declared start date"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "milestones_declared",
      "status": "pass",
      "evidence": "milestones: the declared plan record names its milestones \u2014 the milestones list is present and non-empty"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_milestone_names_declared_phase",
      "status": "pass",
      "evidence": "milestones: every declared milestone names a phase the plan declares"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_milestone_has_owner_named",
      "status": "pass",
      "evidence": "milestones: every declared milestone row names a non-empty owner"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_milestone_due_within_phase_dates",
      "status": "pass",
      "evidence": "milestones: schedule arithmetic over the declared dates \u2014 every milestone's declared due date falls within its named phase's declared start and end dates"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "risks_declared",
      "status": "pass",
      "evidence": "risk register: the declared plan record names its risks \u2014 the risks list is present and non-empty"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "every_risk_has_mitigation",
      "status": "pass",
      "evidence": "quality gate: risks have mitigations \u2014 every declared risk row declares a mitigation"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "every_risk_has_trigger",
      "status": "pass",
      "evidence": "quality gate: risks have triggers \u2014 every declared risk row declares a trigger"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "risk_register_reviewed_each_phase",
      "status": "pass",
      "evidence": "risk register: the register is reviewed each phase"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "every_phase_declares_assumptions",
      "status": "pass",
      "evidence": "estimate honestly: sizes come with assumptions listed \u2014 every declared phase row declares its assumptions"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "least_known_item_flagged_as_top_risk",
      "status": "pass",
      "evidence": "estimate honestly: the least-known item is flagged as the top risk"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "decisions_declared",
      "status": "pass",
      "evidence": "decision log: the declared plan record names its decision-log entries \u2014 the decisions list is present and non-empty"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "every_decision_entry_complete",
      "status": "pass",
      "evidence": "decision log: every entry carries the skill's log shape \u2014 a valid date, the decision, a declared rationale and declared alternatives considered"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "decision_log_append_only",
      "status": "pass",
      "evidence": "decision log: the log is append-only"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "decisions_logged_at_decision_time",
      "status": "pass",
      "evidence": "quality gate: decisions are logged when made, not reconstructed later"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "wip_limit_declared",
      "status": "pass",
      "evidence": "WIP limit: a work-in-progress limit is declared \u2014 finish phases, don't parallelize beyond capacity"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "one_worked_item_per_lane",
      "status": "pass",
      "evidence": "WIP limit: one worked item per lane"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "plan_updates_through_approval",
      "status": "pass",
      "evidence": "red line: plan updates go through approval"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "no_silent_rescoping",
      "status": "pass",
      "evidence": "red line: no silent re-scoping"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "deploys_hitl_approved",
      "status": "pass",
      "evidence": "red line: deploys are HITL \u2014 human approves; automation prepares, humans decide"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "no_direct_to_production_change",
      "status": "pass",
      "evidence": "charter: never a direct-to-production change"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "status_phase_declared",
      "status": "pass",
      "evidence": "status: the current phase is reported"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "status_done_declared",
      "status": "pass",
      "evidence": "status: what is done is reported"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "status_next_declared",
      "status": "pass",
      "evidence": "status: what is next is reported"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "status_blockers_declared",
      "status": "pass",
      "evidence": "status: blockers are reported"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "status_confidence_declared",
      "status": "pass",
      "evidence": "status: confidence is reported"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "phases_count": 1,
  "phases_without_owner": [],
  "phases_without_exit_criteria": [],
  "phases_with_date_problems": [],
  "owner_coverage": "1.0000",
  "unknown_dependencies": [],
  "dependency_order_violations": [],
  "dependency_coverage": null,
  "total_duration_days": 9,
  "milestones_count": 1,
  "milestones_without_owner": [],
  "milestones_with_unknown_phase": [],
  "milestones_due_outside_phase_dates": [],
  "milestone_phase_coverage": "1.0000",
  "risks_count": 1,
  "risks_without_mitigation": [],
  "risks_without_trigger": [],
  "decisions_count": 1,
  "decisions_incomplete": [],
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across four sections.",
  "stamp": "DELIVERY PLAN PREPARATION\nplan: Project Alpha\nVERDICT: DELIVERY_PLAN_READY\n  framing_and_approval                 pass\n  phases_milestones_and_dependencies   pass\n  risks_estimates_and_decisions        pass\n  execution_discipline_and_status      pass\n38 pass, 0 fail, 0 missing of 38 checks across four sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

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
      "owner": "",
      "exit_criteria_declared": false,
      "start_date": "2023-01-01",
      "end_date": "2023-01-10",
      "depends_on": [],
      "size": "XL",
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
      "mitigation_declared": false,
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

Response (HTTP 200):

```json
{
  "service": "delivery-plan-preparation",
  "atom_version": "0.1.0",
  "plan": "Project Alpha",
  "verdict": "DELIVERY_PLAN_NOT_READY",
  "sections": {
    "framing_and_approval": "pass",
    "phases_milestones_and_dependencies": "fail",
    "risks_estimates_and_decisions": "fail",
    "execution_discipline_and_status": "pass"
  },
  "checks": [
    {
      "section": "framing_and_approval",
      "check": "goal_declared",
      "status": "pass",
      "evidence": "frame: the goal is declared"
    },
    {
      "section": "framing_and_approval",
      "check": "deliverable_declared",
      "status": "pass",
      "evidence": "frame: the deliverable is declared"
    },
    {
      "section": "framing_and_approval",
      "check": "constraints_declared",
      "status": "pass",
      "evidence": "frame: the constraints \u2014 time, cost, licenses, environment \u2014 are declared"
    },
    {
      "section": "framing_and_approval",
      "check": "definition_of_done_declared",
      "status": "pass",
      "evidence": "frame: the definition of done is declared"
    },
    {
      "section": "framing_and_approval",
      "check": "plan_approved_before_build",
      "status": "pass",
      "evidence": "quality gate: the plan is approved before build starts"
    },
    {
      "section": "framing_and_approval",
      "check": "no_build_started_before_approval",
      "status": "pass",
      "evidence": "charter: no building before an approved plan \u2014 build has not started before approval"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "phases_declared",
      "status": "pass",
      "evidence": "phase the work: the declared plan record names its phases \u2014 the phases list is present and non-empty"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_phase_has_owner_named",
      "status": "fail",
      "evidence": "quality gate: every phase has an owner \u2014 every declared phase row names a non-empty owner"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_phase_has_exit_criteria",
      "status": "fail",
      "evidence": "quality gate: every phase has exit criteria \u2014 what must be true to move on \u2014 declared on every phase row"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_phase_has_skill_size",
      "status": "fail",
      "evidence": "estimate honestly: every declared phase row carries a size from the skill's own vocabulary \u2014 S, M or L"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_phase_dates_valid_and_in_order",
      "status": "pass",
      "evidence": "phase the work: every declared phase row carries a valid ISO start and end date, and the end does not fall before the start"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_dependency_names_declared_phase",
      "status": "pass",
      "evidence": "dependencies: every name in a phase's declared depends_on list names a phase the plan declares"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_dependency_precedes_dependent",
      "status": "pass",
      "evidence": "sequencing: schedule arithmetic over the declared dates \u2014 a dependency's declared end date does not fall after the dependent phase's declared start date"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "milestones_declared",
      "status": "pass",
      "evidence": "milestones: the declared plan record names its milestones \u2014 the milestones list is present and non-empty"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_milestone_names_declared_phase",
      "status": "pass",
      "evidence": "milestones: every declared milestone names a phase the plan declares"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_milestone_has_owner_named",
      "status": "pass",
      "evidence": "milestones: every declared milestone row names a non-empty owner"
    },
    {
      "section": "phases_milestones_and_dependencies",
      "check": "every_milestone_due_within_phase_dates",
      "status": "pass",
      "evidence": "milestones: schedule arithmetic over the declared dates \u2014 every milestone's declared due date falls within its named phase's declared start and end dates"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "risks_declared",
      "status": "pass",
      "evidence": "risk register: the declared plan record names its risks \u2014 the risks list is present and non-empty"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "every_risk_has_mitigation",
      "status": "fail",
      "evidence": "quality gate: risks have mitigations \u2014 every declared risk row declares a mitigation"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "every_risk_has_trigger",
      "status": "pass",
      "evidence": "quality gate: risks have triggers \u2014 every declared risk row declares a trigger"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "risk_register_reviewed_each_phase",
      "status": "pass",
      "evidence": "risk register: the register is reviewed each phase"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "every_phase_declares_assumptions",
      "status": "pass",
      "evidence": "estimate honestly: sizes come with assumptions listed \u2014 every declared phase row declares its assumptions"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "least_known_item_flagged_as_top_risk",
      "status": "pass",
      "evidence": "estimate honestly: the least-known item is flagged as the top risk"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "decisions_declared",
      "status": "pass",
      "evidence": "decision log: the declared plan record names its decision-log entries \u2014 the decisions list is present and non-empty"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "every_decision_entry_complete",
      "status": "pass",
      "evidence": "decision log: every entry carries the skill's log shape \u2014 a valid date, the decision, a declared rationale and declared alternatives considered"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "decision_log_append_only",
      "status": "pass",
      "evidence": "decision log: the log is append-only"
    },
    {
      "section": "risks_estimates_and_decisions",
      "check": "decisions_logged_at_decision_time",
      "status": "pass",
      "evidence": "quality gate: decisions are logged when made, not reconstructed later"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "wip_limit_declared",
      "status": "pass",
      "evidence": "WIP limit: a work-in-progress limit is declared \u2014 finish phases, don't parallelize beyond capacity"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "one_worked_item_per_lane",
      "status": "pass",
      "evidence": "WIP limit: one worked item per lane"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "plan_updates_through_approval",
      "status": "pass",
      "evidence": "red line: plan updates go through approval"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "no_silent_rescoping",
      "status": "pass",
      "evidence": "red line: no silent re-scoping"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "deploys_hitl_approved",
      "status": "pass",
      "evidence": "red line: deploys are HITL \u2014 human approves; automation prepares, humans decide"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "no_direct_to_production_change",
      "status": "pass",
      "evidence": "charter: never a direct-to-production change"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "status_phase_declared",
      "status": "pass",
      "evidence": "status: the current phase is reported"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "status_done_declared",
      "status": "pass",
      "evidence": "status: what is done is reported"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "status_next_declared",
      "status": "pass",
      "evidence": "status: what is next is reported"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "status_blockers_declared",
      "status": "pass",
      "evidence": "status: blockers are reported"
    },
    {
      "section": "execution_discipline_and_status",
      "check": "status_confidence_declared",
      "status": "pass",
      "evidence": "status: confidence is reported"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "phases_count": 1,
  "phases_without_owner": [
    "Phase1"
  ],
  "phases_without_exit_criteria": [
    "Phase1"
  ],
  "phases_with_date_problems": [],
  "owner_coverage": "0.0000",
  "unknown_dependencies": [],
  "dependency_order_violations": [],
  "dependency_coverage": null,
  "total_duration_days": 9,
  "milestones_count": 1,
  "milestones_without_owner": [],
  "milestones_with_unknown_phase": [],
  "milestones_due_outside_phase_dates": [],
  "milestone_phase_coverage": "1.0000",
  "risks_count": 1,
  "risks_without_mitigation": [
    "Risk1"
  ],
  "risks_without_trigger": [],
  "decisions_count": 1,
  "decisions_incomplete": [],
  "summary": "34 pass, 4 fail, 0 missing of 38 checks across four sections.",
  "stamp": "DELIVERY PLAN PREPARATION\nplan: Project Alpha\nVERDICT: DELIVERY_PLAN_NOT_READY\n  framing_and_approval                 pass\n  phases_milestones_and_dependencies   fail\n  risks_estimates_and_decisions        fail\n  execution_discipline_and_status      pass\n34 pass, 4 fail, 0 missing of 38 checks across four sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "phases": "not-a-list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "phases",
  "detail": "phases must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared delivery-plan record; its verdict is a planning-completeness judgment, not compliance or audit evidence, and delivery planning is not a regulated domain. |
| Checks named | 38 documented / 38 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 45 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/delivery-plan-preparation/evidence.json` |
