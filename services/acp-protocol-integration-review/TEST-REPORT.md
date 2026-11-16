# Test report — acp-protocol-integration-review

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester; **Date:** 2026-11-15; **Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7f9cae9fdd60417eb72062905a066554; **Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering; **Evidence:** verification/work/acp-protocol-integration-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — implementation v1.0.0-stable, flavour ACP-client, all evidence true / red-line fields false | HTTP 200, verdict `INTEGRATION_SOUND`, 31 pass | HTTP 200, `INTEGRATION_SOUND`, 31 pass, 0 fail, 0 missing, `flavor_status` `acp_client`, all seven sections `pass` | PASS |
| 2 | violations — `business_logic_in_wire_layer: true`, `state_leaks_across_sessions: true`, `unsupported_features_faked: true` | HTTP 200, verdict `INTEGRATION_NOT_SOUND`, adapter_architecture, lifecycle_correctness and honesty_tests_and_upgrade_path fail | HTTP 200, `INTEGRATION_NOT_SOUND`, 28 pass, 3 fail, 0 missing, exactly those three sections `fail` | PASS |
| 3 | sparse — only `implementation` + `protocol.flavor: "ACP-client"` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 3 pass, 0 fail, 28 missing | PASS |
| 4 | malformed — `protocol.flavor: 123` (integer, string expected) | HTTP 422, `invalid_input` | HTTP 422, `{"ok":false,"error":"invalid_input","field":"protocol.flavor"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `acp_protocol_integration_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; sections trimmed — the full
response also carries the per-check list and a text stamp):

```json
{
  "service": "acp-protocol-integration-review",
  "atom_version": "0.1.0",
  "implementation": "v1.0.0-stable",
  "verdict": "INTEGRATION_SOUND",
  "sections": {
    "disambiguation_and_scope": "pass",
    "adapter_architecture": "pass",
    "protocol_surface": "pass",
    "lifecycle_correctness": "pass",
    "streaming_discipline": "pass",
    "security": "pass",
    "honesty_tests_and_upgrade_path": "pass"
  },
  "flavor_status": "acp_client",
  "summary": "31 pass, 0 fail, 0 missing of 31 checks across seven sections."
}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"protocol.flavor","detail":"protocol.flavor must be a string"}
```

## Findings

No findings.

## Tester errors

One tester error in this atom's run: Gemini's designed full-pass and violations cases nested the three contract-test fields (`scripted_client_handshake_covered`, `lifecycle_happy_error_cancel_covered`, `contract_tests_in_ci_per_protocol`) under `honesty` instead of under a separate `tests` object, contrary to SERVICE.md's field table (`tests.*`). The cases were corrected minimally before execution and were not scored against the atom in their original form.

## Final verdict

**PASS** — all four cases matched the contract on the live gateway: the full-pass, violations and sparse outcomes were exactly as documented in SERVICE.md, the malformed case returned HTTP 422 with `error: "invalid_input"` on first execution, and both determinism (byte-identical) and MCP/REST parity (structured-equal) held true.
