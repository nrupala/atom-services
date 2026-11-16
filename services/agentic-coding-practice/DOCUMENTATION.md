# Agentic coding practice — `agentic-coding-practice`

**Display name:** Agentic coding practice · **Slug:** `agentic-coding-practice` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "agentic-coding-practice"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the agentic-coding practice manifest.** Fill every group in the [Input reference](#input-reference): the identifier field `practice` plus one object per section. Declare values truthfully — the atom judges declared evidence (see Explanation). The recorded run's manifest is example 1 below.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/agentic-coding-practice` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `RELIABLE_PRACTICE` — 27 pass, 0 fail, 0 missing of 27 checks across six sections. Broad write access is declared in the passing pattern only together with guardrails present (see the recorded input under Worked examples) — the one conditional check follows the skill's anti-pattern wording exactly: the failure is broad write access **and zero guardrails**, not broad access on its own.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "agentic-coding-practice"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/agentic-coding-practice` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/agentic-coding-practice` with the same `Authorization: Bearer <key>` header and call the tool `agentic_coding_practice` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `NOT_RELIABLE_PRACTICE` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples), four checks fail: `docker_not_used`, `agent_run_not_unbounded`, `whole_repo_not_dumped` and `broad_write_access_has_guardrails`. Fix = remove Docker from the workflow, bound agent runs, stop dumping the whole repo into context, and either narrow write access or declare (real) guardrails — then resubmit with the true values.
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `spec.spec_written_first` with detail "spec.spec_written_first must be a boolean" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/agentic-coding-practice` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/agentic-coding-practice` — tool name `agentic_coding_practice`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks. Types are from SERVICE.md's field table (all fields are booleans unless noted), corroborated by contract.yaml and the recorded evidence input schema. An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `practice` | string | — | string; carried into the verdict output, not itself checked |
| `spec.spec_written_first` | boolean | spec_and_slicing |  |
| `spec.small_vertical_slices` | boolean | spec_and_slicing |  |
| `spec.diffs_reviewed` | boolean | spec_and_slicing |  |
| `hooks.wired_as_guardrails` | boolean | hooks_and_events |  |
| `hooks.events_and_payloads_known` | boolean | hooks_and_events |  |
| `hooks.protected_paths_blocked` | boolean | hooks_and_events |  |
| `hooks.formatters_auto_run` | boolean | hooks_and_events |  |
| `hooks.secrets_denied` | boolean | hooks_and_events |  |
| `feedback.tests_run_after_edit` | boolean | feedback_loop |  |
| `feedback.tests_wired_into_hooks` | boolean | feedback_loop |  |
| `feedback.linters_wired_into_hooks` | boolean | feedback_loop |  |
| `guardrails.protected_paths_declared` | boolean | guardrails |  |
| `guardrails.no_secrets` | boolean | guardrails |  |
| `guardrails.docker_used` | boolean | guardrails | must be `false` to pass — skill house rule: no Docker |
| `guardrails.staging_first` | boolean | guardrails |  |
| `guardrails.human_in_loop_on_irreversible` | boolean | guardrails |  |
| `guardrails.autonomous_only_safe_reversible` | boolean | guardrails |  |
| `guardrails.agent_run_unbounded` | boolean | guardrails | must be `false` to pass — skill anti-pattern |
| `context.only_what_agent_needs` | boolean | context_and_tools |  |
| `context.whole_repo_dumped` | boolean | context_and_tools | must be `false` to pass — skill anti-pattern |
| `context.files_pulled_into_workspace` | boolean | context_and_tools |  |
| `tools.mcp_tools_typed` | boolean | context_and_tools |  |
| `tools.mcp_tools_narrowly_scoped` | boolean | context_and_tools |  |
| `delegation.subagent_tasks_bounded` | boolean | delegation_and_access |  |
| `delegation.subagent_context_narrow` | boolean | delegation_and_access |  |
| `delegation.planner_worker_reviewer_pattern` | boolean | delegation_and_access |  |
| `access.broad_write_access` | boolean | delegation_and_access | gates the guardrails check below |
| `access.guardrails_present` | boolean | delegation_and_access | required when broad write access is declared; otherwise the check passes as not applicable |

### Checks

All 27 checks, exactly as named in the recorded full-pass REST response, grouped by section/bar. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence (a gated check whose gate is closed also reports `pass`, as not applicable); `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. There is no separate not-applicable status value in the output.

#### Section: `spec_and_slicing` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `spec_written_before_coding` | spec first: the spec is written before the coding agent builds |
| `small_vertical_slices` | work is split into small vertical slices |
| `diffs_reviewed_not_rubber_stamped` | review diffs — never rubber-stamp (anti-pattern: rubber-stamping diffs) |
#### Section: `hooks_and_events` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `hooks_wired_as_deterministic_guardrails` | hooks are wired as deterministic guardrails — don't rely on the model's goodwill; wire the policy |
| `hook_events_and_payloads_known` | events & payloads: what each hook/event carries is known, so the automation is precise, not guesswork |
| `protected_path_edits_blocked_by_hooks` | hooks block edits to protected paths |
| `formatters_auto_run_by_hooks` | hooks auto-run formatters |
| `secrets_denied_by_hooks` | hooks deny secrets |
#### Section: `feedback_loop` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `tests_run_after_every_edit` | hooks run tests after every edit |
| `tests_wired_into_hooks` | tight feedback: tests are wired into hooks so the agent gets automatic signal (anti-pattern: no automated tests in the loop) |
| `linters_wired_into_hooks` | tight feedback: linters are wired into hooks so the agent gets automatic signal |
#### Section: `guardrails` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `protected_paths_declared` | guardrails: protected paths are declared |
| `secrets_not_used` | guardrails: no secrets |
| `docker_not_used` | guardrails: no Docker (house rule) |
| `staging_first` | guardrails: staging-first |
| `human_in_loop_on_irreversible_actions` | human-in-the-loop on irreversible actions |
| `autonomous_only_on_safe_reversible_actions` | autonomous only on safe, reversible actions |
| `agent_run_not_unbounded` | anti-pattern to refuse: letting the agent run unbounded |
#### Section: `context_and_tools` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `context_limited_to_what_agent_needs` | context hygiene: give the agent only what it needs |
| `whole_repo_not_dumped` | anti-pattern to refuse: dumping whole repos into context |
| `files_pulled_into_workspace` | pull files into a workspace (the town-github-coding-workflow VFS pattern) rather than dumping the whole repo |
| `mcp_tools_typed` | MCP tools: prefer typed tools over broad ones |
| `mcp_tools_narrowly_scoped` | MCP tools: prefer narrowly-scoped tools over broad ones |
#### Section: `delegation_and_access` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `subagent_tasks_bounded` | sub-agents: delegate bounded tasks to focused agents |
| `subagent_context_narrow` | sub-agents: keep each one's context narrow |
| `planner_worker_reviewer_orchestration` | sub-agents: orchestrate planner -> worker -> reviewer patterns |
| `broad_write_access_has_guardrails` | anti-pattern to refuse: agents with broad write access and zero guardrails — broad write access requires guardrails |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug.
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `practice` — The caller's identifier value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 27 per-check results: `section`, `check`, `status`, `evidence`.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, identifier, verdict, per-section statuses, summary) for logs and tickets.

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `RELIABLE_PRACTICE` — All 27 checks pass.
- `NOT_RELIABLE_PRACTICE` — At least one check fails.
- `INSUFFICIENT_EVIDENCE` — Nothing fails, but at least one check is `missing` — evidence was not declared.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks. Gated/not-applicable checks report `pass` when their gate is closed; there is no distinct not-applicable value.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key. No verdict is produced.
- **403** — the key lacks this atom's scope. Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "spec.spec_written_first", "detail": "spec.spec_written_first must be a boolean"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); prices are set only from measured production cost per unit.

## Explanation

The atom judges a declared agentic-coding setup/workflow across six sections: spec-first working in small vertical slices with reviewed diffs; hooks wired as guardrails; tests and linters wired into the feedback loop; guardrails (protected paths, no secrets, no Docker — a house rule, staging first, human-in-the-loop on irreversible actions, autonomy only for safe reversible work, no unbounded runs); context discipline and narrowly scoped typed MCP tools; and bounded delegation with the planner → worker → reviewer pattern. No check is computed from a numeric value: the skill states no numeric threshold, limit, count, or closed vocabulary, so none is invented — every check is a declared boolean read against a statement the skill itself makes. Two pairs of checks deliberately cover the same ground twice because the skill states it twice (protected paths and secrets each appear as both a hooks action and a guardrail; tests appear as both a timing check and a loop-wiring check) — that is the skill's building-blocks list and disciplines list, not two different findings.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is the not-passing verdict). Any single `fail` decides the verdict immediately in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns the passing verdict. Where a check is gated, a closed gate makes it pass as not applicable rather than missing: the gate field itself carries the evidence that the check does not apply.

**What it does NOT do.** It evaluates **declared** evidence only — it does not inspect a repository, read hook configurations, watch an agent run, review actual diffs, or verify that a declared practice is actually followed. Named exclusions: it does not write a spec for a feature, does not judge spec quality, diff quality, or code quality, does not name which files belong in context, and does not score or rank practices. The skill's named multi-agent examples are examples, not requirements. No threshold is checked for how small a slice is, how narrow a context is, or how long a bounded run may be — the skill states none.

**Buyer / use context.** Teams and agents in engineering & code who run coding agents and need a repeatable reliability verdict on the workflow — the house's own workflow is coding agent build workflows. One unit of sale = one delivered result (pricing unit: tokens). The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/agentic_coding_practice.py` — `evaluate(manifest) -> verdict dict`; tests: tests/test_agentic_coding_practice.py — 36 tests, all passing 2026-11-15). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/agentic-coding-practice` and MCP `POST /mcp/agentic-coding-practice` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-16T00:01:51.397569+00:00 against gateway v1.1.0, external verification lane, source `verification/work/agentic-coding-practice/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

```json
{
  "practice": "Standardized Agentic Workflow",
  "spec": {
    "spec_written_first": true,
    "small_vertical_slices": true,
    "diffs_reviewed": true
  },
  "hooks": {
    "wired_as_guardrails": true,
    "events_and_payloads_known": true,
    "protected_paths_blocked": true,
    "formatters_auto_run": true,
    "secrets_denied": true
  },
  "feedback": {
    "tests_run_after_edit": true,
    "tests_wired_into_hooks": true,
    "linters_wired_into_hooks": true
  },
  "guardrails": {
    "protected_paths_declared": true,
    "no_secrets": true,
    "docker_used": false,
    "staging_first": true,
    "human_in_loop_on_irreversible": true,
    "autonomous_only_safe_reversible": true,
    "agent_run_unbounded": false
  },
  "context": {
    "only_what_agent_needs": true,
    "whole_repo_dumped": false,
    "files_pulled_into_workspace": true
  },
  "tools": {
    "mcp_tools_typed": true,
    "mcp_tools_narrowly_scoped": true
  },
  "delegation": {
    "subagent_tasks_bounded": true,
    "subagent_context_narrow": true,
    "planner_worker_reviewer_pattern": true
  },
  "access": {
    "broad_write_access": true,
    "guardrails_present": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "agentic-coding-practice",
  "atom_version": "0.1.0",
  "practice": "Standardized Agentic Workflow",
  "verdict": "RELIABLE_PRACTICE",
  "sections": {
    "spec_and_slicing": "pass",
    "hooks_and_events": "pass",
    "feedback_loop": "pass",
    "guardrails": "pass",
    "context_and_tools": "pass",
    "delegation_and_access": "pass"
  },
  "checks": [
    {
      "section": "spec_and_slicing",
      "check": "spec_written_before_coding",
      "status": "pass",
      "evidence": "spec first: the spec is written before the coding agent builds"
    },
    {
      "section": "spec_and_slicing",
      "check": "small_vertical_slices",
      "status": "pass",
      "evidence": "work is split into small vertical slices"
    },
    {
      "section": "spec_and_slicing",
      "check": "diffs_reviewed_not_rubber_stamped",
      "status": "pass",
      "evidence": "review diffs \u2014 never rubber-stamp (anti-pattern: rubber-stamping diffs)"
    },
    {
      "section": "hooks_and_events",
      "check": "hooks_wired_as_deterministic_guardrails",
      "status": "pass",
      "evidence": "hooks are wired as deterministic guardrails \u2014 don't rely on the model's goodwill; wire the policy"
    },
    {
      "section": "hooks_and_events",
      "check": "hook_events_and_payloads_known",
      "status": "pass",
      "evidence": "events & payloads: what each hook/event carries is known, so the automation is precise, not guesswork"
    },
    {
      "section": "hooks_and_events",
      "check": "protected_path_edits_blocked_by_hooks",
      "status": "pass",
      "evidence": "hooks block edits to protected paths"
    },
    {
      "section": "hooks_and_events",
      "check": "formatters_auto_run_by_hooks",
      "status": "pass",
      "evidence": "hooks auto-run formatters"
    },
    {
      "section": "hooks_and_events",
      "check": "secrets_denied_by_hooks",
      "status": "pass",
      "evidence": "hooks deny secrets"
    },
    {
      "section": "feedback_loop",
      "check": "tests_run_after_every_edit",
      "status": "pass",
      "evidence": "hooks run tests after every edit"
    },
    {
      "section": "feedback_loop",
      "check": "tests_wired_into_hooks",
      "status": "pass",
      "evidence": "tight feedback: tests are wired into hooks so the agent gets automatic signal (anti-pattern: no automated tests in the loop)"
    },
    {
      "section": "feedback_loop",
      "check": "linters_wired_into_hooks",
      "status": "pass",
      "evidence": "tight feedback: linters are wired into hooks so the agent gets automatic signal"
    },
    {
      "section": "guardrails",
      "check": "protected_paths_declared",
      "status": "pass",
      "evidence": "guardrails: protected paths are declared"
    },
    {
      "section": "guardrails",
      "check": "secrets_not_used",
      "status": "pass",
      "evidence": "guardrails: no secrets"
    },
    {
      "section": "guardrails",
      "check": "docker_not_used",
      "status": "pass",
      "evidence": "guardrails: no Docker (house rule)"
    },
    {
      "section": "guardrails",
      "check": "staging_first",
      "status": "pass",
      "evidence": "guardrails: staging-first"
    },
    {
      "section": "guardrails",
      "check": "human_in_loop_on_irreversible_actions",
      "status": "pass",
      "evidence": "human-in-the-loop on irreversible actions"
    },
    {
      "section": "guardrails",
      "check": "autonomous_only_on_safe_reversible_actions",
      "status": "pass",
      "evidence": "autonomous only on safe, reversible actions"
    },
    {
      "section": "guardrails",
      "check": "agent_run_not_unbounded",
      "status": "pass",
      "evidence": "anti-pattern to refuse: letting the agent run unbounded"
    },
    {
      "section": "context_and_tools",
      "check": "context_limited_to_what_agent_needs",
      "status": "pass",
      "evidence": "context hygiene: give the agent only what it needs"
    },
    {
      "section": "context_and_tools",
      "check": "whole_repo_not_dumped",
      "status": "pass",
      "evidence": "anti-pattern to refuse: dumping whole repos into context"
    },
    {
      "section": "context_and_tools",
      "check": "files_pulled_into_workspace",
      "status": "pass",
      "evidence": "pull files into a workspace (the town-github-coding-workflow VFS pattern) rather than dumping the whole repo"
    },
    {
      "section": "context_and_tools",
      "check": "mcp_tools_typed",
      "status": "pass",
      "evidence": "MCP tools: prefer typed tools over broad ones"
    },
    {
      "section": "context_and_tools",
      "check": "mcp_tools_narrowly_scoped",
      "status": "pass",
      "evidence": "MCP tools: prefer narrowly-scoped tools over broad ones"
    },
    {
      "section": "delegation_and_access",
      "check": "subagent_tasks_bounded",
      "status": "pass",
      "evidence": "sub-agents: delegate bounded tasks to focused agents"
    },
    {
      "section": "delegation_and_access",
      "check": "subagent_context_narrow",
      "status": "pass",
      "evidence": "sub-agents: keep each one's context narrow"
    },
    {
      "section": "delegation_and_access",
      "check": "planner_worker_reviewer_orchestration",
      "status": "pass",
      "evidence": "sub-agents: orchestrate planner -> worker -> reviewer patterns"
    },
    {
      "section": "delegation_and_access",
      "check": "broad_write_access_has_guardrails",
      "status": "pass",
      "evidence": "anti-pattern to refuse: agents with broad write access and zero guardrails \u2014 broad write access requires guardrails"
    }
  ],
  "summary": "27 pass, 0 fail, 0 missing of 27 checks across six sections.",
  "stamp": "AGENTIC CODING PRACTICE VERDICT\npractice: Standardized Agentic Workflow\nVERDICT: RELIABLE_PRACTICE\n  spec_and_slicing                 pass\n  hooks_and_events                 pass\n  feedback_loop                    pass\n  guardrails                       pass\n  context_and_tools                pass\n  delegation_and_access            pass\n27 pass, 0 fail, 0 missing of 27 checks across six sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "practice": "Unsafe Workflow",
  "spec": {
    "spec_written_first": true,
    "small_vertical_slices": true,
    "diffs_reviewed": true
  },
  "hooks": {
    "wired_as_guardrails": true,
    "events_and_payloads_known": true,
    "protected_paths_blocked": true,
    "formatters_auto_run": true,
    "secrets_denied": true
  },
  "feedback": {
    "tests_run_after_edit": true,
    "tests_wired_into_hooks": true,
    "linters_wired_into_hooks": true
  },
  "guardrails": {
    "protected_paths_declared": true,
    "no_secrets": true,
    "docker_used": true,
    "staging_first": true,
    "human_in_loop_on_irreversible": true,
    "autonomous_only_safe_reversible": true,
    "agent_run_unbounded": true
  },
  "context": {
    "only_what_agent_needs": true,
    "whole_repo_dumped": true,
    "files_pulled_into_workspace": true
  },
  "tools": {
    "mcp_tools_typed": true,
    "mcp_tools_narrowly_scoped": true
  },
  "delegation": {
    "subagent_tasks_bounded": true,
    "subagent_context_narrow": true,
    "planner_worker_reviewer_pattern": true
  },
  "access": {
    "broad_write_access": true,
    "guardrails_present": false
  }
}
```

Response (`response_text`):

```json
{
  "service": "agentic-coding-practice",
  "atom_version": "0.1.0",
  "practice": "Unsafe Workflow",
  "verdict": "NOT_RELIABLE_PRACTICE",
  "sections": {
    "spec_and_slicing": "pass",
    "hooks_and_events": "pass",
    "feedback_loop": "pass",
    "guardrails": "fail",
    "context_and_tools": "fail",
    "delegation_and_access": "fail"
  },
  "checks": [
    {
      "section": "spec_and_slicing",
      "check": "spec_written_before_coding",
      "status": "pass",
      "evidence": "spec first: the spec is written before the coding agent builds"
    },
    {
      "section": "spec_and_slicing",
      "check": "small_vertical_slices",
      "status": "pass",
      "evidence": "work is split into small vertical slices"
    },
    {
      "section": "spec_and_slicing",
      "check": "diffs_reviewed_not_rubber_stamped",
      "status": "pass",
      "evidence": "review diffs \u2014 never rubber-stamp (anti-pattern: rubber-stamping diffs)"
    },
    {
      "section": "hooks_and_events",
      "check": "hooks_wired_as_deterministic_guardrails",
      "status": "pass",
      "evidence": "hooks are wired as deterministic guardrails \u2014 don't rely on the model's goodwill; wire the policy"
    },
    {
      "section": "hooks_and_events",
      "check": "hook_events_and_payloads_known",
      "status": "pass",
      "evidence": "events & payloads: what each hook/event carries is known, so the automation is precise, not guesswork"
    },
    {
      "section": "hooks_and_events",
      "check": "protected_path_edits_blocked_by_hooks",
      "status": "pass",
      "evidence": "hooks block edits to protected paths"
    },
    {
      "section": "hooks_and_events",
      "check": "formatters_auto_run_by_hooks",
      "status": "pass",
      "evidence": "hooks auto-run formatters"
    },
    {
      "section": "hooks_and_events",
      "check": "secrets_denied_by_hooks",
      "status": "pass",
      "evidence": "hooks deny secrets"
    },
    {
      "section": "feedback_loop",
      "check": "tests_run_after_every_edit",
      "status": "pass",
      "evidence": "hooks run tests after every edit"
    },
    {
      "section": "feedback_loop",
      "check": "tests_wired_into_hooks",
      "status": "pass",
      "evidence": "tight feedback: tests are wired into hooks so the agent gets automatic signal (anti-pattern: no automated tests in the loop)"
    },
    {
      "section": "feedback_loop",
      "check": "linters_wired_into_hooks",
      "status": "pass",
      "evidence": "tight feedback: linters are wired into hooks so the agent gets automatic signal"
    },
    {
      "section": "guardrails",
      "check": "protected_paths_declared",
      "status": "pass",
      "evidence": "guardrails: protected paths are declared"
    },
    {
      "section": "guardrails",
      "check": "secrets_not_used",
      "status": "pass",
      "evidence": "guardrails: no secrets"
    },
    {
      "section": "guardrails",
      "check": "docker_not_used",
      "status": "fail",
      "evidence": "guardrails: no Docker (house rule)"
    },
    {
      "section": "guardrails",
      "check": "staging_first",
      "status": "pass",
      "evidence": "guardrails: staging-first"
    },
    {
      "section": "guardrails",
      "check": "human_in_loop_on_irreversible_actions",
      "status": "pass",
      "evidence": "human-in-the-loop on irreversible actions"
    },
    {
      "section": "guardrails",
      "check": "autonomous_only_on_safe_reversible_actions",
      "status": "pass",
      "evidence": "autonomous only on safe, reversible actions"
    },
    {
      "section": "guardrails",
      "check": "agent_run_not_unbounded",
      "status": "fail",
      "evidence": "anti-pattern to refuse: letting the agent run unbounded"
    },
    {
      "section": "context_and_tools",
      "check": "context_limited_to_what_agent_needs",
      "status": "pass",
      "evidence": "context hygiene: give the agent only what it needs"
    },
    {
      "section": "context_and_tools",
      "check": "whole_repo_not_dumped",
      "status": "fail",
      "evidence": "anti-pattern to refuse: dumping whole repos into context"
    },
    {
      "section": "context_and_tools",
      "check": "files_pulled_into_workspace",
      "status": "pass",
      "evidence": "pull files into a workspace (the town-github-coding-workflow VFS pattern) rather than dumping the whole repo"
    },
    {
      "section": "context_and_tools",
      "check": "mcp_tools_typed",
      "status": "pass",
      "evidence": "MCP tools: prefer typed tools over broad ones"
    },
    {
      "section": "context_and_tools",
      "check": "mcp_tools_narrowly_scoped",
      "status": "pass",
      "evidence": "MCP tools: prefer narrowly-scoped tools over broad ones"
    },
    {
      "section": "delegation_and_access",
      "check": "subagent_tasks_bounded",
      "status": "pass",
      "evidence": "sub-agents: delegate bounded tasks to focused agents"
    },
    {
      "section": "delegation_and_access",
      "check": "subagent_context_narrow",
      "status": "pass",
      "evidence": "sub-agents: keep each one's context narrow"
    },
    {
      "section": "delegation_and_access",
      "check": "planner_worker_reviewer_orchestration",
      "status": "pass",
      "evidence": "sub-agents: orchestrate planner -> worker -> reviewer patterns"
    },
    {
      "section": "delegation_and_access",
      "check": "broad_write_access_has_guardrails",
      "status": "fail",
      "evidence": "anti-pattern to refuse: agents with broad write access and zero guardrails \u2014 broad write access requires guardrails"
    }
  ],
  "summary": "23 pass, 4 fail, 0 missing of 27 checks across six sections.",
  "stamp": "AGENTIC CODING PRACTICE VERDICT\npractice: Unsafe Workflow\nVERDICT: NOT_RELIABLE_PRACTICE\n  spec_and_slicing                 pass\n  hooks_and_events                 pass\n  feedback_loop                    pass\n  guardrails                       fail\n  context_and_tools                fail\n  delegation_and_access            fail\n23 pass, 4 fail, 0 missing of 27 checks across six sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "practice": "Malformed Input",
  "spec": {
    "spec_written_first": "YES_PLEASE"
  }
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "spec.spec_written_first",
  "detail": "spec.spec_written_first must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 27 / 27 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses listed |
| Input reference typed | Yes — 29 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom is an engineering/design review over declared evidence; its verdict is not itself compliance or audit evidence and its domain is not a regulated one (finance, security, licensing, privacy), so no regulator role view is included.
