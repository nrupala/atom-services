# Test report — agent-safety-guardrail-audit

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw.
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/agent-safety-guardrail-audit/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid evidence manifest | HTTP 200, verdict `GUARDED` | HTTP 200, `GUARDED`, "34 pass, 0 fail, 0 missing of 34 checks across eight sections." stamp present and well-formed | PASS |
| 2 | violations — deliberate contract violations | HTTP 200, verdict `NOT_GUARDED` | HTTP 200, `NOT_GUARDED`, failing checks: `approval_not_bypassable_by_agent`, `guardrails_not_disabled`, `model_output_not_evaled`, `secret_values_not_in_context` (0 pass, 4 fail, 30 missing) | PASS |
| 3 | sparse — minimal manifest | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 34 missing | PASS |
| 4 | malformed — `guardrails_disabled` as a string, `tool_access` as a string | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `NOT_GUARDED` (0 pass, 1 fail, 33 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `agent_safety_guardrail_audit`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"agent-safety-guardrail-audit","atom_version":"0.1.0","system":"test-agent","version":"1.0.0","verdict":"GUARDED","sections":{"injection_defense":"pass","tool_least_privilege":"pass","approval_gates":"pass","sandboxing":"pass","budgets_and_circuit_breakers":"pass","output_validation":"pass","secrets_hygiene":"pass","red_teaming":"pass"},"checks":[{"section":"injection_defense","check":"external_content_treated_as_data","status":"pass","evidence":"skill method 1: all external content is hostile data, never instructions"},{"section":"injection_defense","check":"suspicious_imperatives_flagged","status":"pass","evidence":"content stripped/annotated before model use; suspicious imperatives flagged"},{"section":"injection_defense","check":"injection_test_suite_present","status":"pass","evidence":"quality gate: injection test suite exists on the agent's inputs"},{"section":"injection_defense","check":"injection_test_suite_passing","status":"pass","evidence":"quality gate: injection test suite passes on the agent's inputs"},{"section":"tool_least_privilege","check":"tools_scoped_to_job","status":"pass","evidence":"each agent gets only the tools its job needs"},{"section":"tool_least_privilege","check":"read_write_tools_separated","status":"pass","evidence":"read tools granted before write tools"},{"section":"tool_least_privilege","check":"destructive_tools_gated","status":"pass","evidence":"destructive tools gated (approval or explicit scope)"},{"section":"tool_least_privilege","check":"shell_access_sandboxed","status":"pass","evidence":"no shell passthrough without sandbox"},{"section":"approval_gates","check":"destructive_actions_require_approval","status":"pass","evidence":"deploys, payments, deletions, external sends, credential changes — human confirms"},{"section":"approval_gates","check":"approval_requirement_verified","status":"pass","evidence":"quality gate: destructive actions require approval (verified, not assumed)"},{"section":"approval_gates","check":"approvals_cover_all_sensitive_actions","status":"pass","evidence":"covered_actions=['deploys', 'payments', 'deletions', 'external_sends', 'credential_changes']"},{"section":"approval_gates","check":"approval_not_bypassable_by_agent","status":"pass","evidence":"the guardrail is not configurable away by the agent"},{"section":"approval_gates","check":"guardrails_not_disabled","status":"pass","evidence":"skill red line: never disable guardrails 'to make it work'"},{"section":"sandboxing","check":"untrusted_code_sandboxed","status":"pass","evidence":"untrusted code/tooling runs in isolation"},{"section":"sandboxing","check":"filesystem_scope_minimal","status":"pass","evidence":"filesystem scope minimal"},{"section":"sandboxing","check":"egress_restricted","status":"pass","evidence":"egress restricted"},{"section":"sandboxing","check":"resource_caps_enforced","status":"pass","evidence":"resource caps enforced"},{"section":"sandboxing","check":"sandbox_abuse_test_passed","status":"pass","evidence":"quality gate: sandbox + egress + resource caps verified with an abuse test"},{"section":"budgets_and_circuit_breakers","check":"budget_caps_set","status":"pass","evidence":"token/cost/time caps set"},{"section":"budgets_and_circuit_breakers","check":"budgets_alert_before_cap","status":"pass","evidence":"quality gate: budgets alert before cap"},{"section":"budgets_and_circuit_breakers","check":"loop_detection_enabled","status":"pass","evidence":"loop detection: same action N times -> stop + escalate"},{"section":"budgets_and_circuit_breakers","check":"kill_switch_present","status":"pass","evidence":"kill switch per agent"},{"section":"budgets_and_circuit_breakers","check":"kill_switch_tested","status":"pass","evidence":"quality gate: kill switch tested"},{"section":"output_validation","check":"output_schema_checked","status":"pass","evidence":"schema-check what agents produce before acting on it"},{"section":"output_validation","check":"model_output_not_evaled","status":"pass","evidence":"never eval model output"},{"section":"output_validation","check":"downstream_calls_parameterized","status":"pass","evidence":"parameterize everything downstream"},{"section":"secrets_hygiene","check":"secret_values_not_in_context","status":"pass","evidence":"skill red line: no secrets in agent context by default"},{"section":"secrets_hygiene","check":"pii_not_in_context","status":"pass","evidence":"skill red line: no PII in agent context by default"},{"section":"secrets_hygiene","check":"credential_handles_only","status":"pass","evidence":"agents reference credential handles, not values"},{"section":"secrets_hygiene","check":"exfiltration_paths_tested","status":"pass","evidence":"exfiltration paths (rendering, URLs, logs) considered in tests"},{"section":"red_teaming","check":"injection_suite_run_against_interface","status":"pass","evidence":"injection suites: instructions hidden in content"},{"section":"red_teaming","check":"jailbreak_attempts_tested","status":"pass","evidence":"jailbreak attempts run against the interface"},{"section":"red_teaming","check":"canary_tokens_used","status":"pass","evidence":"canary tokens for leak detection"},{"section":"red_teaming","check":"findings_become_regression_tests","status":"pass","evidence":"findings become regression tests"}],"summary":"34 pass, 0 fail, 0 missing of 34 checks across eight sections.","stamp":"AGENT-SAFETY GUARDRAIL AUDIT\nsystem: test-agent  version: 1.0.0\nVERDICT: GUARDED\n  injection_defense              pass\n  tool_least_privilege           pass\n  approval_gates                 pass\n  sandboxing                     pass\n  budgets_and_circuit_breakers   pass\n  output_validation              pass\n  secrets_hygiene                pass\n  red_teaming                    pass\n34 pass, 0 fail, 0 missing of 34 checks across eight sections."}
```

Malformed response (REST, HTTP 200 — the finding; key fields, full
response in the evidence file):

```json
{
 "service": "agent-safety-guardrail-audit",
 "atom_version": "0.1.0",
 "system": null,
 "version": null,
 "verdict": "NOT_GUARDED",
 "sections": {
  "injection_defense": "insufficient_evidence",
  "tool_least_privilege": "insufficient_evidence",
  "approval_gates": "fail",
  "sandboxing": "insufficient_evidence",
  "budgets_and_circuit_breakers": "insufficient_evidence",
  "output_validation": "insufficient_evidence",
  "secrets_hygiene": "insufficient_evidence",
  "red_teaming": "insufficient_evidence"
 },
 "summary": "0 pass, 1 fail, 33 missing of 34 checks across eight sections."
}
```

Malformed input submitted:

```json
{"guardrails_disabled": "not-a-boolean", "tool_access": "should-be-an-object"}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `guardrails_disabled` as a string, `tool_access` as a string. Expected (test doctrine for
this program + the gateway's `invalid_input` mechanism in
`callpath.ts`): HTTP 422 `{ok:false, error:"invalid_input", field:...}`.
Actual: HTTP 200 with a `NOT_GUARDED` verdict computed over the
garbage values (0 pass, 1 fail, 33 missing of 34 checks across eight sections.; failing checks: `guardrails_not_disabled`). The atom's
handler does not validate manifest field types before evaluation.
Contract clause: SERVICE.md: Inputs — the agent-safety evidence manifest. Disposition: **fix spec filed** —
`verification/fix-specs/agent-safety-guardrail-audit.md`, entry `agent-safety-guardrail-audit F1`.
Retest on redeploy.

No tester errors in this atom's run.

The violations case's expected failing list named sections; the actual failing checks are the four check-level names inside those sections (`guardrails_not_disabled` is in approval_gates), and Gemini's computed check confirmed the fail count (4). Verdict exactly as expected.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases,
determinism and MCP/REST parity hold, the stamp is well-formed; the
single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health HTTP 200), deployment `7f9cae9fdd60417eb72062905a066554`. Full recorded Wave 1 battery re-run unchanged via `verification/harness.py`; judgment via `verification/gemini_judge.py` (Gemini verdict: PASS); mechanical verification from the new `evidence.json` governs where the two conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict=GUARDED | HTTP 200, verdict=GUARDED | PASS |
| 2 | violations | HTTP 200, verdict=NOT_GUARDED | HTTP 200, verdict=NOT_GUARDED | PASS |
| 3 | sparse | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | HTTP 422, error=invalid_input | HTTP 422, error=invalid_input, field=guardrails_disabled | PASS |
| 5 | determinism | byte-identical repeat (full-pass) | byte_identical=True | PASS |
| 6 | parity | MCP structuredContent deep-equal to REST (full-pass) | structured_equal=True | PASS |

F1 disposition: F1 closed — malformed now returns 422 invalid_input (field: guardrails_disabled). The Wave 1 defect (HTTP 200 verdict computed over wrong-typed fields) no longer reproduces; all other recorded cases return their expected HTTP status and verdict, and the full-pass case is deterministic (byte-identical) with MCP/REST parity (structuredContent deep-equal).

Tester errors this wave: none. Gemini's judgment (PASS, no findings, no tester errors) agrees with the mechanical evidence.

**Retest verdict: PASS**

