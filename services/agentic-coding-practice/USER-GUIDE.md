# Agentic coding practice — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are running coding agents. This atom reads a declared agentic-coding practice manifest — spec/slicing, hooks/events, feedback loop, guardrails, context/tools, and delegation/access — and returns one deterministic verdict across six sections (spec_and_slicing, hooks_and_events, feedback_loop, guardrails, context_and_tools, delegation_and_access): **RELIABLE_PRACTICE**, **NOT_RELIABLE_PRACTICE**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Same manifest in → same verdict out. It evaluates declared evidence only; it does not inspect a repository or watch an agent run.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "agentic-coding-practice"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/agentic-coding-practice`
  — tool name `agentic_coding_practice`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/agentic-coding-practice`
  — body = the manifest object; same `Authorization` header.

## Input

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

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = a check
fails (counts toward the not-sound verdict).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/agentic-coding-practice`:

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

Response — HTTP 200 (trimmed; the full response carries all checks
and a text stamp of the verdict):

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
  "summary": "27 pass, 0 fail, 0 missing of 27 checks across six sections."
}
```

## Verdicts

- **RELIABLE_PRACTICE** — all 27 checks pass.
- **NOT_RELIABLE_PRACTICE** — at least one check fails; the failing sections name the breached discipline.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
