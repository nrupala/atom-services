# Agent evaluation scorecard — documentation

**Agent evaluation scorecard** · slug `agent-evaluation-scorecard` · deliverable type: EVALUATION · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. All worked examples are real recorded trial runs — see the provenance line under Worked examples.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run — an evaluation of the agent `milo-v4` — whose verbatim request and response appear as Worked example 1 below.

1. **Get a key.** Sign up at `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session; then issue a key for this atom with `POST /v1/keys` and body `{"atom": "agent-evaluation-scorecard"}`. Keep the returned key — you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides.)
2. **Assemble the manifest.** Build one JSON object: an agent-evaluation evidence manifest: how the agent was evaluated — task suite, reproducible runs, judging, regression gates, beyond-accuracy metrics, incident replay, the scorecard itself, per-task results, and benchmark hygiene. In the recorded run the manifest names `agent: "milo-v4"` and declares every field `true` in the passing sense (every must-be-false field `false`), with the supporting rows the computed checks read.
3. **Send it.** `POST https://atoms.pipavia.com/v1/agent-evaluation-scorecard` with the manifest as the body and the `Authorization` header set.
4. **Read the verdict.** The recorded response is HTTP 200 with verdict `TRUSTED`. Its `summary` reads: “32 pass, 0 fail, 0 missing of 32 checks across eight sections.” Every section in `sections` is `pass`, and every entry in `checks` carries `status: "pass"` with its evidence line.
5. **Read the computed block.** `scorecard` object — computed counts from the `tasks[]` rows: `tasks_total`, `tasks_passing`, `safety_violations`. In the recorded run it reads `{"scorecard": {"tasks_total": 1, "tasks_passing": 1, "safety_violations": 0}}` — recomputed by the atom from the submitted rows, never taken from the caller's word.
6. **Keep the stamp.** The response's `stamp` field is the same verdict as a plain-text block, suitable for pasting into a change record or review note.

You now have the deliverable: one deterministic verdict. Same manifest in → same verdict out (the recorded battery proves byte-identical repeat responses and MCP/REST parity — see TEST-REPORT.md).

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "agent-evaluation-scorecard"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Keys are per user, per atom in scope: a key never verifies for an atom outside its granted scope (contract.yaml: key = HMAC-SHA256 over email | atom service | issued-at, version-prefixed, regenerated on demand after authentication, never stored).
3. Call:

```bash
curl -X POST https://atoms.pipavia.com/v1/agent-evaluation-scorecard \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The body is the manifest object itself (see Reference — Input reference). HTTP 200 returns the verdict object (see Reference — Output format).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/agent-evaluation-scorecard`
- Tool name: `agent_evaluation_scorecard`
- Send the same `Authorization: Bearer <key>` header. In the `tools/call` request, the tool arguments are the manifest object — the same object you would POST as the REST body. The recorded battery proves parity: the MCP `structuredContent` is deep-equal to the REST artifact for the same manifest.

### Read a failing verdict and fix the manifest

Worked example 2 below is the recorded failing run: verdict `NOT_TRUSTED`, summary “30 pass, 2 fail, 0 missing of 32 checks across eight sections.”. To fix a failing verdict:

1. **Find the non-pass checks.** In the response's `checks` array, look for `status: "fail"` (present but wrong) and `status: "missing"` (not declared). In the recorded violations run the failing checks are:
   - `suite_versioned` (section `task_suite`) — evidence: “quality gate: suite versioned, criteria written before running”
   - `all_tasks_meet_acceptance_criteria` (section `scorecard`) — evidence: “every task met its declared acceptance criteria (passed, cost and latency within allowance, no safety violation)”
2. **Note the section roll-up.** `sections` marks each affected section `fail` (or `insufficient_evidence` when nothing in it failed but evidence is missing). The verdict is `NOT_TRUSTED` when any check fails, `INSUFFICIENT_EVIDENCE` when nothing fails but any check is missing, and `TRUSTED` only when every check passes.
3. **Fix the underlying fact, then the manifest.** Each check's Reference entry names the manifest field it reads. Correct the real-world condition first (the atom reads declarations — declaring `true` for work not done defeats the purpose), set the field to the passing value, and resubmit the whole manifest. The atom is stateless: a resubmission is a fresh, complete evaluation.
4. **Re-read the new summary.** It counts pass / fail / missing across all checks; you are done when it reads all-pass and the verdict is `TRUSTED`.

### Handle a 422 invalid_input

A type-violating manifest is rejected before evaluation — never scored. The recorded malformed run (Worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "agent",
  "detail": "agent must be a string"
}
```

- `field` names the offending field (`agent` in the recorded run) and `detail` says what type was expected (`"agent must be a string"`).
- Fix exactly that field's type in your manifest (see the types in the Input reference) and resubmit. Validation reports the first offending field it reaches, so a manifest with several type errors may need more than one fix-and-resubmit round.
- A 422 carries no verdict and no `checks` array — do not read it as a failing evaluation.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/agent-evaluation-scorecard` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/agent-evaluation-scorecard` — tool name `agent_evaluation_scorecard`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Contract endpoints: API, MCP, agent.

### Input reference

One JSON manifest per call. Types are from SERVICE.md's field table, corroborated by the recorded MCP `inputSchema` and the evidence inputs. Unless a field is marked otherwise, every boolean field follows the same rule: **absent = evidence missing** (the check it feeds is `missing`; the verdict degrades to `INSUFFICIENT_EVIDENCE`), **present but false/invalid = the check fails** (the verdict degrades to `NOT_TRUSTED`). Fields marked “must be `false`” invert the passing value, as noted.

**Identity**

| Field | Type | Notes |
|---|---|---|
| `agent` | string | Agent name. Carried into the output; not itself checked. |

**`suite` — task suite**

| Field | Type | Notes |
|---|---|---|
| `suite.versioned` | boolean | Read by section `task_suite`. |
| `suite.criteria_written_before_run` | boolean | Read by section `task_suite`. |
| `suite.acceptance_criteria_per_task` | boolean | Read by section `task_suite`. |
| `suite.versioned_with_agent` | boolean | Read by section `task_suite`. |

**`run` — reproducible runs**

| Field | Type | Notes |
|---|---|---|
| `run.model_version_pinned` | boolean | Read by section `reproducible_runs`. |
| `run.sampling_settings_pinned` | boolean | Read by section `reproducible_runs`. |
| `run.tool_state_pinned` | boolean | Read by section `reproducible_runs`. |
| `run.fixtures_pinned` | boolean | Read by section `reproducible_runs`. |
| `run.raw_transcripts_stored` | boolean | Read by section `reproducible_runs`. |
| `run.same_suite_per_candidate` | boolean | Read by section `reproducible_runs`. |

**`judging` — judging**

| Field | Type | Notes |
|---|---|---|
| `judging.deterministic_checks_first` | boolean | Read by section `judging`. |
| `judging.llm_judge_used` | boolean | Gate: the three LLM-judge controls below are required only when this is `true`. |
| `judging.judge_calibrated_against_human_labels` | boolean | Required only when `judging.llm_judge_used` is `true`. |
| `judging.judge_blinded` | boolean | Required only when `judging.llm_judge_used` is `true`. |
| `judging.position_bias_controls` | boolean | Required only when `judging.llm_judge_used` is `true`. |
| `judging.model_judges_itself` | boolean | Fails (via check `no_uncalibrated_self_judging`) when `true` and the judge is uncalibrated. |

**`gates` — regression gates**

| Field | Type | Notes |
|---|---|---|
| `gates.eval_runs_before_merge` | boolean | Read by section `regression_gates`. |
| `gates.regressions_block_merge` | boolean | Read by section `regression_gates`. |
| `gates.accepted_tradeoffs_written` | boolean | Read by section `regression_gates`. |

**`metrics` — beyond accuracy**

| Field | Type | Notes |
|---|---|---|
| `metrics.steps_tracked` | boolean | Read by section `beyond_accuracy`. |
| `metrics.cost_tracked` | boolean | Read by section `beyond_accuracy`. |
| `metrics.latency_tracked` | boolean | Read by section `beyond_accuracy`. |
| `metrics.refusal_error_rates_tracked` | boolean | Read by section `beyond_accuracy`. |
| `metrics.safety_violations_tracked` | boolean | Read by section `beyond_accuracy`. |
| `metrics.silent_wrongness_tracked` | boolean | Read by section `beyond_accuracy`. |

**`incidents` — incident replay**

| Field | Type | Notes |
|---|---|---|
| `incidents.misbehavior_becomes_named_tests` | boolean | Read by section `incident_replay`. |
| `incidents.all_production_incidents_replayed` | boolean | Read by section `incident_replay`. |

**`scorecard` and `tasks[]` — scorecard**

| Field | Type | Notes |
|---|---|---|
| `scorecard.published_per_run` | boolean | Read by section `scorecard`. |
| `scorecard.stored` | boolean | Read by section `scorecard`. |
| `tasks[]` | array of objects | Task rows `{name (string), passed (boolean), cost (number), allowed_cost (number), latency_ms (number), allowed_latency_ms (number), safety_violation (boolean)}`. Read by the computed check `all_tasks_meet_acceptance_criteria` in section `scorecard`; also the source of the computed `scorecard` counts in the output. |

**`hygiene` — benchmark hygiene**

| Field | Type | Notes |
|---|---|---|
| `hygiene.contamination_checked` | boolean | Read by section `benchmark_hygiene`. |
| `hygiene.variance_reported` | boolean | Read by section `benchmark_hygiene`. |
| `hygiene.rebaselined_after_model_updates` | boolean | Read by section `benchmark_hygiene`. |

### Checks

The recorded full-pass REST response carries 32 checks. Every check is listed below, grouped by its `section` exactly as recorded. For each check: what it requires to pass, and its semantics — `pass` = the requirement is met on the declared evidence; `fail` = the field is present but false/invalid (or a must-be-false field is `true`, or a computed condition is breached); `missing` = the field (or the rows a computed check reads) is absent. There is no separate not-applicable status value in recorded responses: a gated check whose gate is closed reports `pass`, with its evidence line saying why (for example “no LLM judge declared”).

**Section `task_suite`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `suite_versioned` | The task suite is versioned. Recorded full-pass evidence: “quality gate: suite versioned, criteria written before running” | `suite.versioned` |
| `criteria_written_before_running` | Acceptance criteria were written before the run, not after. Recorded full-pass evidence: “acceptance criteria written before the run, not after” | `suite.criteria_written_before_run` |
| `acceptance_criteria_defined_per_task` | Acceptance criteria are defined per task — golden tasks per capability with a success definition, allowed cost, allowed latency, and safety constraints. Recorded full-pass evidence: “golden tasks per capability with success definition, allowed cost, allowed latency, safety constraints” | `suite.acceptance_criteria_per_task` |
| `suite_versioned_with_agent` | The task suite is versioned with the agent. Recorded full-pass evidence: “task suites versioned with the agent” | `suite.versioned_with_agent` |
**Section `reproducible_runs`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `model_version_pinned` | The model version is pinned. Recorded full-pass evidence: “pin model versions” | `run.model_version_pinned` |
| `sampling_settings_pinned` | Sampling settings (seeds/temperatures) are pinned. Recorded full-pass evidence: “pin seeds/temperatures” | `run.sampling_settings_pinned` |
| `tool_state_pinned` | Tool state is pinned. Recorded full-pass evidence: “pin tool states” | `run.tool_state_pinned` |
| `fixtures_pinned` | Fixtures are pinned. Recorded full-pass evidence: “pin fixtures” | `run.fixtures_pinned` |
| `raw_transcripts_stored` | Raw transcripts are stored. Recorded full-pass evidence: “store raw transcripts” | `run.raw_transcripts_stored` |
| `same_suite_for_every_candidate` | The same suite is run for every candidate. Recorded full-pass evidence: “run the same suite per candidate” | `run.same_suite_per_candidate` |
**Section `judging`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `deterministic_checks_first` | Deterministic checks run first (did it do the thing?). Recorded full-pass evidence: “deterministic checks first (did it do the thing?)” | `judging.deterministic_checks_first` |
| `llm_judge_calibrated_against_human_labels` | When an LLM judge is used, it is calibrated against human labels. When no LLM judge is declared (`judging.llm_judge_used` is `false`), this check passes as not applicable — the recorded evidence reads “no LLM judge declared”. Recorded full-pass evidence: “no LLM judge declared” | `judging.judge_calibrated_against_human_labels`, gated by `judging.llm_judge_used` |
| `judge_blinded` | When an LLM judge is used, the judge is blinded. When no LLM judge is declared, this check passes as not applicable — the recorded evidence reads “no LLM judge declared”. Recorded full-pass evidence: “no LLM judge declared” | `judging.judge_blinded`, gated by `judging.llm_judge_used` |
| `position_bias_controls` | When an LLM judge is used, position-bias controls are in place. When no LLM judge is declared, this check passes as not applicable — the recorded evidence reads “no LLM judge declared”. Recorded full-pass evidence: “no LLM judge declared” | `judging.position_bias_controls`, gated by `judging.llm_judge_used` |
| `no_uncalibrated_self_judging` | The model under test does not judge itself while uncalibrated: passes when `judging.model_judges_itself` is `false`, or when self-judging is declared together with calibration against human labels; fails when the model judges itself and the judge is uncalibrated. Recorded full-pass evidence: “the model under test does not judge itself” | `judging.model_judges_itself` together with `judging.judge_calibrated_against_human_labels` |
**Section `regression_gates`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `eval_runs_before_merge` | The eval suite runs before merging agent changes. Recorded full-pass evidence: “eval suite runs before merging agent changes” | `gates.eval_runs_before_merge` |
| `regressions_block_merge` | Regressions block merge until explained. Recorded full-pass evidence: “regressions block until explained” | `gates.regressions_block_merge` |
| `accepted_tradeoffs_written` | Accepted trade-offs are written down, not left as vibes. Recorded full-pass evidence: “accepted trade-offs are written, not vibes” | `gates.accepted_tradeoffs_written` |
**Section `beyond_accuracy`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `steps_to_completion_tracked` | Steps-to-completion are tracked. Recorded full-pass evidence: “track steps-to-completion” | `metrics.steps_tracked` |
| `cost_tracked` | Cost is tracked. Recorded full-pass evidence: “track cost” | `metrics.cost_tracked` |
| `latency_tracked` | Latency is tracked. Recorded full-pass evidence: “track latency” | `metrics.latency_tracked` |
| `refusal_and_error_rates_tracked` | Refusal and error rates are tracked. Recorded full-pass evidence: “track refusal/error rates” | `metrics.refusal_error_rates_tracked` |
| `safety_violations_tracked` | Safety violations are tracked. Recorded full-pass evidence: “track safety violations” | `metrics.safety_violations_tracked` |
| `silent_wrongness_tracked` | Silent wrongness (confident bad output) is tracked. Recorded full-pass evidence: “track silent wrongness (confident bad output)” | `metrics.silent_wrongness_tracked` |
**Section `incident_replay`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `misbehavior_becomes_named_test_cases` | Every production misbehavior becomes a named test case. Recorded full-pass evidence: “every production misbehavior becomes a named test case” | `incidents.misbehavior_becomes_named_tests` |
| `all_production_incidents_replayed` | All production incidents are replayed as permanent regression tests. Recorded full-pass evidence: “incident replay: incidents turned into permanent regression tests” | `incidents.all_production_incidents_replayed` |
**Section `scorecard`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `scorecard_published_per_run` | A compact scorecard is published per run. Recorded full-pass evidence: “publish a compact scorecard per run” | `scorecard.published_per_run` |
| `scorecards_stored` | Scorecards are stored. Recorded full-pass evidence: “quality gate: scorecards stored” | `scorecard.stored` |
| `all_tasks_meet_acceptance_criteria` | Computed check: every task in `tasks[]` met its own declared acceptance criteria — `passed` true, `cost` within `allowed_cost`, `latency_ms` within `allowed_latency_ms`, and no `safety_violation`. A task row missing any acceptance field makes this check `missing` (INSUFFICIENT_EVIDENCE), not failed. Recorded full-pass evidence: “every task met its declared acceptance criteria (passed, cost and latency within allowance, no safety violation)” | `tasks[]` (computed) |
**Section `benchmark_hygiene`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `contamination_checked` | Contamination is checked (tasks leaking into training). Recorded full-pass evidence: “watch contamination (tasks leaking into training)” | `hygiene.contamination_checked` |
| `variance_reported` | Variance is reported (run N times, report the spread). Recorded full-pass evidence: “run N times, report spread” | `hygiene.variance_reported` |
| `rebaselined_after_model_updates` | Results are re-baselined after model updates. Recorded full-pass evidence: “re-baseline after model updates” | `hygiene.rebaselined_after_model_updates` |

### Output format

HTTP 200 returns one JSON object:

| Field | Content |
|---|---|
| `service` | `"agent-evaluation-scorecard"` |
| `atom_version` | `"0.1.0" |
| `agent` | The manifest's `agent` value, carried through |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section to its section status (below) |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order |
| (computed) | `scorecard` object — computed counts from the `tasks[]` rows: `tasks_total`, `tasks_passing`, `safety_violations`. |
| `summary` | One line counting pass / fail / missing across all checks and sections |
| `stamp` | The same verdict as a plain-text block |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `TRUSTED` — All 32 checks pass across all eight sections. The evaluation is trusted on the evidence declared.
- `NOT_TRUSTED` — At least one check fails (a field present but false/invalid, a must-pass computed condition breached). The failing checks name the section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — No check fails, but at least one check is `missing` — evidence was not declared. The missing checks name exactly what to supply.

**Section statuses** (values in the `sections` object):

- `pass` — every check in the section passes.
- `fail` — at least one check in the section fails.
- `insufficient_evidence` — no check in the section fails, but at least one is `missing`.

**Per-check statuses** (the `status` field of each `checks[]` entry):

- `pass` — the requirement is met on the declared evidence (including gated checks whose gate is closed — see Checks).
- `fail` — the requirement is breached on present evidence.
- `missing` — the evidence the check reads was not declared.

### Errors

Only the shapes evidenced in the repo and gateway documentation are given; no payload is invented. USER-GUIDE.md evidences the four statuses; the 422 body is the recorded one.

| HTTP | Meaning | Body |
|---|---|---|
| 401 | Unauthenticated — key missing or invalid | No body shape is evidenced in the repo for this atom; treat the status itself as the signal and check the `Authorization: Bearer <key>` header. |
| 403 | Scope — the key is valid but lacks this atom's scope | No body shape is evidenced in the repo for this atom; issue this atom's scope on the key (`POST /v1/keys` with this atom) and retry. |
| 422 | `invalid_input` — the manifest violates a field type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "agent", "detail": "agent must be a string"}` — `field` and `detail` name the offending field and the expected type for your submission. |
| 429 | Rate limit — per-key limit exceeded (see Rate limits) | No body shape is evidenced in the repo for this atom; back off and retry within the limits below. |

### Rate limits and pricing

- Rate limits (contract.yaml): 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing: pricing unit `deliverable`; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**

## Explanation

The scorecard is an evaluation of declared evaluation practice, not a re-run of the agent: the atom never executes the agent, never re-scores its tasks, and never inspects transcripts. It checks that the evaluation around the agent was built so its result can be trusted — criteria fixed before the run, run conditions pinned, judging calibrated and blinded, regressions gated, and cost, latency and safety tracked alongside accuracy. The one computed element is the per-task acceptance check and the scorecard counts, both recomputed from the `tasks[]` rows the caller submits.

**How the verdict is decided.** The core is deterministic: the same manifest always produces the same verdict (the recorded battery proves byte-identical repeat responses, and MCP/REST parity). Each check reads named manifest fields and resolves to `pass`, `fail`, or `missing`. The distinction that drives the verdict is *absent vs false*: a field that is **absent** is missing evidence — its check is `missing`, and if nothing fails the verdict is `INSUFFICIENT_EVIDENCE`, naming exactly what to supply. A field that is **present but false or invalid** is a breached requirement — its check fails, and any single failure makes the verdict `NOT_TRUSTED`. Section statuses roll up the same way (`pass` / `fail` / `insufficient_evidence`). Gated checks follow their gate field: when the gate is closed (for example no LLM judge used, no repair declared, no NIST alignment claimed, no backdoor present), the gated check passes as not applicable rather than going missing; when the gate is open, the gated field is required. Must-be-false fields invert the test: declaring them `true` is the failure.

**What it does not do.**

- It does not run the agent or its task suite; it evaluates the declared evidence about an evaluation that happened elsewhere.
- It does not verify that declared booleans are true in the world — a manifest that declares `true` for work not done will pass; the verdict is evidence about the declaration, in the declared shape.
- It does not judge task quality, suite difficulty, or whether the acceptance thresholds themselves are well chosen.
- It sells the evaluation (the scorecard) — never the underlying evaluation knowledge itself.

**Buyer and use context.** Teams and agents working in “How Milo works” who need this evaluation on demand and would rather buy it per use than build or staff the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use: agent model-change regression gates — Wright is an internal caller (zero price, metered to the internal cost ledger). One unit of sale = one deliverable (the delivered verdict). The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge.

## Role views

### For integrators (Users)

You integrate one call: obtain a key, POST the manifest to the REST endpoint (or call the MCP tool `agent_evaluation_scorecard`), and consume `verdict`, `sections`, `checks`, `summary` and `stamp`. Treat the three verdict values as your branch points: `TRUSTED` = proceed; `NOT_TRUSTED` = stop and remediate the failing checks; `INSUFFICIENT_EVIDENCE` = collect the missing evidence named in the `missing` checks and resubmit. Handle 422 as a client bug (fix the named field's type), 401/403 as key problems, and 429 by backing off. The call is stateless and deterministic, so caching a verdict for an unchanged manifest is sound.

### For developers

Manifest authoring: declare facts, not aspirations — every boolean is a claim about work actually done, and must-be-false fields are the usual trap (declaring them `true` is an instant fail). Respect the gates: gated fields are required only when their gate field opens them. Implementation pointers: `src/agent_evaluation_scorecard.py` — `evaluate(manifest) -> scorecard dict`; CLI prints JSON + stamp. Tests: `tests/test_agent_evaluation_scorecard.py — 17 tests, all passing 2026-11-15`. Determinism is contractual: no randomness, no clock, no external calls in the evaluation path — the recorded battery's byte-identical repeat and MCP/REST parity results (TEST-REPORT.md) are the regression bar. Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/agent-evaluation-scorecard`, MCP `POST /mcp/agent-evaluation-scorecard` (tool `agent_evaluation_scorecard`) on gateway `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Key scope: per user, per atom — a 403 means the key lacks this atom's scope, a 401 means missing/invalid key. Rate limits: 60/min and 10,000/day per key; watch 429s as the capacity signal. Error monitoring: 422s indicate client manifest type bugs (the body names the field); a rising 422 rate after a client release is a client regression, not an atom fault. Status: live — release candidate (one-week RC soak to 2026-11-22); verification state PASS on the recorded battery (TEST-REPORT.md; `verification/results/agent-evaluation-scorecard.json`). Pricing is not yet metered for revenue: rate pending, free during trial.

## Worked examples

Provenance: recorded 2026-11-15T23:52:08.413337+00:00 against gateway v1.1.0, external verification lane, source `verification/work/agent-evaluation-scorecard/evidence.json`. Inputs are each case's recorded `input`; responses are the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — mechanically verified after writing).

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

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

Response (REST):

```json
{
  "service": "agent-evaluation-scorecard",
  "atom_version": "0.1.0",
  "agent": "milo-v4",
  "verdict": "TRUSTED",
  "sections": {
    "task_suite": "pass",
    "reproducible_runs": "pass",
    "judging": "pass",
    "regression_gates": "pass",
    "beyond_accuracy": "pass",
    "incident_replay": "pass",
    "scorecard": "pass",
    "benchmark_hygiene": "pass"
  },
  "checks": [
    {
      "section": "task_suite",
      "check": "suite_versioned",
      "status": "pass",
      "evidence": "quality gate: suite versioned, criteria written before running"
    },
    {
      "section": "task_suite",
      "check": "criteria_written_before_running",
      "status": "pass",
      "evidence": "acceptance criteria written before the run, not after"
    },
    {
      "section": "task_suite",
      "check": "acceptance_criteria_defined_per_task",
      "status": "pass",
      "evidence": "golden tasks per capability with success definition, allowed cost, allowed latency, safety constraints"
    },
    {
      "section": "task_suite",
      "check": "suite_versioned_with_agent",
      "status": "pass",
      "evidence": "task suites versioned with the agent"
    },
    {
      "section": "reproducible_runs",
      "check": "model_version_pinned",
      "status": "pass",
      "evidence": "pin model versions"
    },
    {
      "section": "reproducible_runs",
      "check": "sampling_settings_pinned",
      "status": "pass",
      "evidence": "pin seeds/temperatures"
    },
    {
      "section": "reproducible_runs",
      "check": "tool_state_pinned",
      "status": "pass",
      "evidence": "pin tool states"
    },
    {
      "section": "reproducible_runs",
      "check": "fixtures_pinned",
      "status": "pass",
      "evidence": "pin fixtures"
    },
    {
      "section": "reproducible_runs",
      "check": "raw_transcripts_stored",
      "status": "pass",
      "evidence": "store raw transcripts"
    },
    {
      "section": "reproducible_runs",
      "check": "same_suite_for_every_candidate",
      "status": "pass",
      "evidence": "run the same suite per candidate"
    },
    {
      "section": "judging",
      "check": "deterministic_checks_first",
      "status": "pass",
      "evidence": "deterministic checks first (did it do the thing?)"
    },
    {
      "section": "judging",
      "check": "llm_judge_calibrated_against_human_labels",
      "status": "pass",
      "evidence": "no LLM judge declared"
    },
    {
      "section": "judging",
      "check": "judge_blinded",
      "status": "pass",
      "evidence": "no LLM judge declared"
    },
    {
      "section": "judging",
      "check": "position_bias_controls",
      "status": "pass",
      "evidence": "no LLM judge declared"
    },
    {
      "section": "judging",
      "check": "no_uncalibrated_self_judging",
      "status": "pass",
      "evidence": "the model under test does not judge itself"
    },
    {
      "section": "regression_gates",
      "check": "eval_runs_before_merge",
      "status": "pass",
      "evidence": "eval suite runs before merging agent changes"
    },
    {
      "section": "regression_gates",
      "check": "regressions_block_merge",
      "status": "pass",
      "evidence": "regressions block until explained"
    },
    {
      "section": "regression_gates",
      "check": "accepted_tradeoffs_written",
      "status": "pass",
      "evidence": "accepted trade-offs are written, not vibes"
    },
    {
      "section": "beyond_accuracy",
      "check": "steps_to_completion_tracked",
      "status": "pass",
      "evidence": "track steps-to-completion"
    },
    {
      "section": "beyond_accuracy",
      "check": "cost_tracked",
      "status": "pass",
      "evidence": "track cost"
    },
    {
      "section": "beyond_accuracy",
      "check": "latency_tracked",
      "status": "pass",
      "evidence": "track latency"
    },
    {
      "section": "beyond_accuracy",
      "check": "refusal_and_error_rates_tracked",
      "status": "pass",
      "evidence": "track refusal/error rates"
    },
    {
      "section": "beyond_accuracy",
      "check": "safety_violations_tracked",
      "status": "pass",
      "evidence": "track safety violations"
    },
    {
      "section": "beyond_accuracy",
      "check": "silent_wrongness_tracked",
      "status": "pass",
      "evidence": "track silent wrongness (confident bad output)"
    },
    {
      "section": "incident_replay",
      "check": "misbehavior_becomes_named_test_cases",
      "status": "pass",
      "evidence": "every production misbehavior becomes a named test case"
    },
    {
      "section": "incident_replay",
      "check": "all_production_incidents_replayed",
      "status": "pass",
      "evidence": "incident replay: incidents turned into permanent regression tests"
    },
    {
      "section": "scorecard",
      "check": "scorecard_published_per_run",
      "status": "pass",
      "evidence": "publish a compact scorecard per run"
    },
    {
      "section": "scorecard",
      "check": "scorecards_stored",
      "status": "pass",
      "evidence": "quality gate: scorecards stored"
    },
    {
      "section": "scorecard",
      "check": "all_tasks_meet_acceptance_criteria",
      "status": "pass",
      "evidence": "every task met its declared acceptance criteria (passed, cost and latency within allowance, no safety violation)"
    },
    {
      "section": "benchmark_hygiene",
      "check": "contamination_checked",
      "status": "pass",
      "evidence": "watch contamination (tasks leaking into training)"
    },
    {
      "section": "benchmark_hygiene",
      "check": "variance_reported",
      "status": "pass",
      "evidence": "run N times, report spread"
    },
    {
      "section": "benchmark_hygiene",
      "check": "rebaselined_after_model_updates",
      "status": "pass",
      "evidence": "re-baseline after model updates"
    }
  ],
  "scorecard": {
    "tasks_total": 1,
    "tasks_passing": 1,
    "safety_violations": 0
  },
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across eight sections.",
  "stamp": "AGENT-EVALUATION SCORECARD\nagent: milo-v4\nVERDICT: TRUSTED\n  task_suite         pass\n  reproducible_runs  pass\n  judging            pass\n  regression_gates   pass\n  beyond_accuracy    pass\n  incident_replay    pass\n  scorecard          pass\n  benchmark_hygiene  pass\n32 pass, 0 fail, 0 missing of 32 checks across eight sections."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "agent": "milo-v4",
  "suite": {
    "versioned": false,
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
    "model_judges_itself": true
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
      "passed": false,
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

Response (REST):

```json
{
  "service": "agent-evaluation-scorecard",
  "atom_version": "0.1.0",
  "agent": "milo-v4",
  "verdict": "NOT_TRUSTED",
  "sections": {
    "task_suite": "fail",
    "reproducible_runs": "pass",
    "judging": "pass",
    "regression_gates": "pass",
    "beyond_accuracy": "pass",
    "incident_replay": "pass",
    "scorecard": "fail",
    "benchmark_hygiene": "pass"
  },
  "checks": [
    {
      "section": "task_suite",
      "check": "suite_versioned",
      "status": "fail",
      "evidence": "quality gate: suite versioned, criteria written before running"
    },
    {
      "section": "task_suite",
      "check": "criteria_written_before_running",
      "status": "pass",
      "evidence": "acceptance criteria written before the run, not after"
    },
    {
      "section": "task_suite",
      "check": "acceptance_criteria_defined_per_task",
      "status": "pass",
      "evidence": "golden tasks per capability with success definition, allowed cost, allowed latency, safety constraints"
    },
    {
      "section": "task_suite",
      "check": "suite_versioned_with_agent",
      "status": "pass",
      "evidence": "task suites versioned with the agent"
    },
    {
      "section": "reproducible_runs",
      "check": "model_version_pinned",
      "status": "pass",
      "evidence": "pin model versions"
    },
    {
      "section": "reproducible_runs",
      "check": "sampling_settings_pinned",
      "status": "pass",
      "evidence": "pin seeds/temperatures"
    },
    {
      "section": "reproducible_runs",
      "check": "tool_state_pinned",
      "status": "pass",
      "evidence": "pin tool states"
    },
    {
      "section": "reproducible_runs",
      "check": "fixtures_pinned",
      "status": "pass",
      "evidence": "pin fixtures"
    },
    {
      "section": "reproducible_runs",
      "check": "raw_transcripts_stored",
      "status": "pass",
      "evidence": "store raw transcripts"
    },
    {
      "section": "reproducible_runs",
      "check": "same_suite_for_every_candidate",
      "status": "pass",
      "evidence": "run the same suite per candidate"
    },
    {
      "section": "judging",
      "check": "deterministic_checks_first",
      "status": "pass",
      "evidence": "deterministic checks first (did it do the thing?)"
    },
    {
      "section": "judging",
      "check": "llm_judge_calibrated_against_human_labels",
      "status": "pass",
      "evidence": "no LLM judge declared"
    },
    {
      "section": "judging",
      "check": "judge_blinded",
      "status": "pass",
      "evidence": "no LLM judge declared"
    },
    {
      "section": "judging",
      "check": "position_bias_controls",
      "status": "pass",
      "evidence": "no LLM judge declared"
    },
    {
      "section": "judging",
      "check": "no_uncalibrated_self_judging",
      "status": "pass",
      "evidence": "skill red line: the model under test never judges itself uncalibrated"
    },
    {
      "section": "regression_gates",
      "check": "eval_runs_before_merge",
      "status": "pass",
      "evidence": "eval suite runs before merging agent changes"
    },
    {
      "section": "regression_gates",
      "check": "regressions_block_merge",
      "status": "pass",
      "evidence": "regressions block until explained"
    },
    {
      "section": "regression_gates",
      "check": "accepted_tradeoffs_written",
      "status": "pass",
      "evidence": "accepted trade-offs are written, not vibes"
    },
    {
      "section": "beyond_accuracy",
      "check": "steps_to_completion_tracked",
      "status": "pass",
      "evidence": "track steps-to-completion"
    },
    {
      "section": "beyond_accuracy",
      "check": "cost_tracked",
      "status": "pass",
      "evidence": "track cost"
    },
    {
      "section": "beyond_accuracy",
      "check": "latency_tracked",
      "status": "pass",
      "evidence": "track latency"
    },
    {
      "section": "beyond_accuracy",
      "check": "refusal_and_error_rates_tracked",
      "status": "pass",
      "evidence": "track refusal/error rates"
    },
    {
      "section": "beyond_accuracy",
      "check": "safety_violations_tracked",
      "status": "pass",
      "evidence": "track safety violations"
    },
    {
      "section": "beyond_accuracy",
      "check": "silent_wrongness_tracked",
      "status": "pass",
      "evidence": "track silent wrongness (confident bad output)"
    },
    {
      "section": "incident_replay",
      "check": "misbehavior_becomes_named_test_cases",
      "status": "pass",
      "evidence": "every production misbehavior becomes a named test case"
    },
    {
      "section": "incident_replay",
      "check": "all_production_incidents_replayed",
      "status": "pass",
      "evidence": "incident replay: incidents turned into permanent regression tests"
    },
    {
      "section": "scorecard",
      "check": "scorecard_published_per_run",
      "status": "pass",
      "evidence": "publish a compact scorecard per run"
    },
    {
      "section": "scorecard",
      "check": "scorecards_stored",
      "status": "pass",
      "evidence": "quality gate: scorecards stored"
    },
    {
      "section": "scorecard",
      "check": "all_tasks_meet_acceptance_criteria",
      "status": "fail",
      "evidence": "every task met its declared acceptance criteria (passed, cost and latency within allowance, no safety violation)"
    },
    {
      "section": "benchmark_hygiene",
      "check": "contamination_checked",
      "status": "pass",
      "evidence": "watch contamination (tasks leaking into training)"
    },
    {
      "section": "benchmark_hygiene",
      "check": "variance_reported",
      "status": "pass",
      "evidence": "run N times, report spread"
    },
    {
      "section": "benchmark_hygiene",
      "check": "rebaselined_after_model_updates",
      "status": "pass",
      "evidence": "re-baseline after model updates"
    }
  ],
  "scorecard": {
    "tasks_total": 1,
    "tasks_passing": 0,
    "safety_violations": 0
  },
  "summary": "30 pass, 2 fail, 0 missing of 32 checks across eight sections.",
  "stamp": "AGENT-EVALUATION SCORECARD\nagent: milo-v4\nVERDICT: NOT_TRUSTED\n  task_suite         fail\n  reproducible_runs  pass\n  judging            pass\n  regression_gates   pass\n  beyond_accuracy    pass\n  incident_replay    pass\n  scorecard          fail\n  benchmark_hygiene  pass\n30 pass, 2 fail, 0 missing of 32 checks across eight sections."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "agent": 12345,
  "tasks": "not-a-list"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "agent",
  "detail": "agent must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference, Explanation sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; Developers Yes; Ops Yes; Regulators N/A — The verdict evaluates an internal agent-evaluation process; it is not itself compliance or audit evidence for a regulated domain, and the domain (agent evaluation) is not a regulated one. |
| Checks named: documented vs recorded | 32 / 32 (from the recorded full-pass REST response `checks` array) |
| Verdict vocabulary complete | Yes — 3 verdict values, 3 section statuses, 3 per-check statuses |
| Input reference typed | Yes — 34 fields with types from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations, malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/agent-evaluation-scorecard/evidence.json` |

