# Test report — agent-interoperability-design

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester; **Date:** 2026-11-15; **Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7f9cae9fdd60417eb72062905a066554; **Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering; **Evidence:** verification/work/agent-interoperability-design/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — one agent_to_agent / acp_rest integration, all evidence true / red-line fields false, no remote/untrusted agents | HTTP 200, verdict `DESIGN_SOUND`, 36 pass, `integration_count` 1, `protocol_status` `sound_on_declared_evidence` | HTTP 200, `DESIGN_SOUND`, 36 pass, 0 fail, 0 missing, `integration_count` 1, `protocol_status` `sound_on_declared_evidence`, all eight sections `pass` | PASS |
| 2 | violations — tools_for_models paired with acp_rest, `business_logic_per_protocol: true`, remote agents present with unauthenticated/un-audited/un-rate-limited broker, `direct_doors_to_remote_agents: true`, `shared_forever_keys_present: true` | HTTP 200, verdict `DESIGN_NOT_SOUND`, protocol_selection, bridge_architecture, gateway_and_remote_access and identity_and_credentials fail | HTTP 200, `DESIGN_NOT_SOUND`, 5 pass, 8 fail, 23 missing, exactly those four sections `fail` | PASS |
| 3 | sparse — only `design: "Minimalist"` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass, 0 fail, 36 missing | PASS |
| 4 | malformed — `integrations: "not_a_list"`, `architecture: 123` | HTTP 422, `invalid_input` | HTTP 422, `{"ok":false,"error":"invalid_input","field":"integrations"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `agent_interoperability_design`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; sections trimmed — the full
response also carries the per-check list and a text stamp):

```json
{
  "service": "agent-interoperability-design",
  "atom_version": "0.1.0",
  "design": "Standard A2A bridge",
  "verdict": "DESIGN_SOUND",
  "sections": {
    "protocol_selection": "pass",
    "bridge_architecture": "pass",
    "gateway_and_remote_access": "pass",
    "handoff_contracts": "pass",
    "identity_and_credentials": "pass",
    "versioning_and_discovery": "pass",
    "audit_and_provenance": "pass",
    "handshake_testing_and_red_lines": "pass"
  },
  "protocol_status": "sound_on_declared_evidence",
  "integration_count": 1,
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across eight sections."
}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"integrations","detail":"integrations must be a list"}
```

## Findings

No findings.

## Tester errors

No tester errors in this atom's run.

## Final verdict

**PASS** — all four cases matched the contract on the live gateway: the full-pass, violations and sparse outcomes were exactly as documented in SERVICE.md, the malformed case returned HTTP 422 with `error: "invalid_input"` on first execution, and both determinism (byte-identical) and MCP/REST parity (structured-equal) held true.
