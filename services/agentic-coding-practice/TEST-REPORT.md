# Test report — agentic-coding-practice

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester; **Date:** 2026-11-15; **Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7f9cae9fdd60417eb72062905a066554; **Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering; **Evidence:** verification/work/agentic-coding-practice/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — all evidence in passing state, including `docker_used: false`, `agent_run_unbounded: false`, `whole_repo_dumped: false`, broad write access with guardrails present | HTTP 200, verdict `RELIABLE_PRACTICE`, 27 pass | HTTP 200, `RELIABLE_PRACTICE`, 27 pass, 0 fail, 0 missing, all six sections `pass` | PASS |
| 2 | violations — `docker_used: true`, `agent_run_unbounded: true`, `whole_repo_dumped: true`, broad write access with `guardrails_present: false` | HTTP 200, verdict `NOT_RELIABLE_PRACTICE`, guardrails, context_and_tools and delegation_and_access fail | HTTP 200, `NOT_RELIABLE_PRACTICE`, 23 pass, 4 fail, 0 missing, exactly those three sections `fail` | PASS |
| 3 | sparse — only `practice` + `spec.spec_written_first: true` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass, 0 fail, 26 missing | PASS |
| 4 | malformed — `spec.spec_written_first: "YES_PLEASE"` (string, boolean expected) | HTTP 422, `invalid_input` | HTTP 422, `{"ok":false,"error":"invalid_input","field":"spec.spec_written_first"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `agentic_coding_practice`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; sections trimmed — the full
response also carries the per-check list and a text stamp):

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

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"spec.spec_written_first","detail":"spec.spec_written_first must be a boolean"}
```

## Findings

No findings.

## Tester errors

No tester errors in this atom's run.

## Final verdict

**PASS** — all four cases matched the contract on the live gateway: the full-pass, violations and sparse outcomes were exactly as documented in SERVICE.md, the malformed case returned HTTP 422 with `error: "invalid_input"` on first execution, and both determinism (byte-identical) and MCP/REST parity (structured-equal) held true.
