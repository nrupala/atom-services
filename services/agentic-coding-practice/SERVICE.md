# Agentic coding practice — `agentic-coding-practice`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Agentic coding — gets reliable work out of coding agents: tight specs, fast feedback loops, and guardrails so automated coding helps instead of creating chaos.

A caller submits a declared agentic-coding practice manifest and receives one verdict back: is this declared practice reliable, on the skill's own disciplines? One unit of sale = tokens.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Coding agent build workflows**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the agentic-coding practice manifest

The caller submits one JSON manifest: a declared agentic-coding
setup / workflow. Every field below is read by the named section's
checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`NOT_RELIABLE_PRACTICE`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `practice` (string; carried into the verdict output, not itself checked) | — |
| `spec.spec_written_first` | spec_and_slicing |
| `spec.small_vertical_slices` | spec_and_slicing |
| `spec.diffs_reviewed` | spec_and_slicing |
| `hooks.wired_as_guardrails` | hooks_and_events |
| `hooks.events_and_payloads_known` | hooks_and_events |
| `hooks.protected_paths_blocked` | hooks_and_events |
| `hooks.formatters_auto_run` | hooks_and_events |
| `hooks.secrets_denied` | hooks_and_events |
| `feedback.tests_run_after_edit` | feedback_loop |
| `feedback.tests_wired_into_hooks` | feedback_loop |
| `feedback.linters_wired_into_hooks` | feedback_loop |
| `guardrails.protected_paths_declared` | guardrails |
| `guardrails.no_secrets` | guardrails |
| `guardrails.docker_used` (must be `false` to pass — skill house rule: no Docker) | guardrails |
| `guardrails.staging_first` | guardrails |
| `guardrails.human_in_loop_on_irreversible` | guardrails |
| `guardrails.autonomous_only_safe_reversible` | guardrails |
| `guardrails.agent_run_unbounded` (must be `false` to pass — skill anti-pattern) | guardrails |
| `context.only_what_agent_needs` | context_and_tools |
| `context.whole_repo_dumped` (must be `false` to pass — skill anti-pattern) | context_and_tools |
| `context.files_pulled_into_workspace` | context_and_tools |
| `tools.mcp_tools_typed` | context_and_tools |
| `tools.mcp_tools_narrowly_scoped` | context_and_tools |
| `delegation.subagent_tasks_bounded` | delegation_and_access |
| `delegation.subagent_context_narrow` | delegation_and_access |
| `delegation.planner_worker_reviewer_pattern` | delegation_and_access |
| `access.broad_write_access` (gates the guardrails check below) | delegation_and_access |
| `access.guardrails_present` (required when broad write access is declared; otherwise the check passes as not applicable) | delegation_and_access |

One check is conditional, following the skill's anti-pattern
wording exactly: the skill refuses "agents with broad write
access **and zero guardrails**" — broad write access on its own
is not the failure. When `access.broad_write_access` is declared
true, `access.guardrails_present` must be declared true; when no
broad write access is declared, the check passes as not
applicable.

No check is computed from a numeric value: the skill states no
numeric threshold, limit, count, or closed vocabulary (its hook
lifecycle list is open — "PreToolUse, PostToolUse, etc."), so
none is invented. Every check is a declared boolean read against
a statement the skill itself makes.

The verdict is one of `RELIABLE_PRACTICE` (all 27 checks pass),
`NOT_RELIABLE_PRACTICE` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: spec_and_slicing, hooks_and_events,
feedback_loop, guardrails, context_and_tools,
delegation_and_access.

Two pairs of checks cover the same skill ground twice, stated
plainly: protected paths appear both as a hooks action
(`hooks.protected_paths_blocked` — hooks "block edits to
protected paths") and as a guardrail declaration
(`guardrails.protected_paths_declared` — guardrails list
"protected paths"); secrets appear both as a hooks action
(`hooks.secrets_denied` — hooks "deny secrets") and as a
guardrail (`guardrails.no_secrets` — guardrails list "no
secrets"). That is the skill stating the same ground in its
building-blocks list and its disciplines list, not two different
findings. Likewise tests appear as a timing check
(`feedback.tests_run_after_edit` — hooks "run tests after every
edit") and as a loop-wiring check
(`feedback.tests_wired_into_hooks` — "tests + linters wired into
hooks").

## Honest scoping

This atom evaluates **declared** evidence about a coding-agent
practice — it does not inspect a repository, read hook
configurations, watch an agent run, review actual diffs, or
verify that a declared practice is actually followed. A practice
is reliable *on the caller's declared evidence*: a workflow that
declares spec-first, hook-wired tests, and no Docker passes those
checks even if the real workflow does something else.

Named exclusions: it does not write a spec for a feature (the
skill's example ask — generative authorship, not a checkable
manifest), does not judge spec quality, diff quality, or code
quality, does not name which files belong in context, and does
not score or rank practices. The skill's named multi-agent
examples (LocalForge's Planner -> Writer -> Reviewer -> Tester,
the argent WASM sandbox) are examples, not requirements, so no
check requires them; the one orchestration check reads the
skill's general planner -> worker -> reviewer pattern. No
threshold is checked for how small a slice is, how narrow a
context is, or how long a bounded run may be — the skill states
none.

## Pricing

Pricing unit: **tokens**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
