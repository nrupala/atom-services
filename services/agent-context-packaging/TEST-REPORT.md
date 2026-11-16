# Test report — agent-context-packaging

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester; **Date:** 2026-11-15; **Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7f9cae9fdd60417eb72062905a066554; **Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering; **Evidence:** verification/work/agent-context-packaging/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — pack agent_handoff_v1, all evidence true / red-line fields false, privacy fields under `privacy` | HTTP 200, verdict `PACK_SOUND`, 29 pass | HTTP 200, `PACK_SOUND`, 29 pass, 0 fail, 0 missing, all six sections `pass` | PASS |
| 2 | violations — `contacts_or_financials_included: true`, `secrets_or_pii_unredacted_present: true`, `hand_assembled: true`, `derived_pack_hand_maintained_silently: true` | HTTP 200, verdict `PACK_NOT_SOUND`, redaction and reproducibility_and_signing fail | HTTP 200, `PACK_NOT_SOUND`, 23 pass, 4 fail, 2 missing, redaction and reproducibility_and_signing `fail` | PASS |
| 3 | sparse — only `pack` + `scope.what_travels_declared: true` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass, 0 fail, 28 missing | PASS |
| 4 | malformed — `scope: "not_an_object"` (string, object expected) | HTTP 422, `invalid_input` | HTTP 422, `{"ok":false,"error":"invalid_input","field":"scope"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `agent_context_packaging`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; sections trimmed — the full
response also carries the per-check list and a text stamp):

```json
{
  "service": "agent-context-packaging",
  "atom_version": "0.1.0",
  "pack": "agent_handoff_v1",
  "verdict": "PACK_SOUND",
  "sections": {
    "scope_declaration": "pass",
    "redaction": "pass",
    "structure_and_manifest": "pass",
    "reproducibility_and_signing": "pass",
    "handoff_dossier": "pass",
    "freshness_and_privacy": "pass"
  },
  "summary": "29 pass, 0 fail, 0 missing of 29 checks across six sections."
}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"scope","detail":"scope must be an object"}
```

## Findings

No findings.

## Tester errors

One tester error in this atom's run: Gemini's designed full-pass and violations cases nested the privacy fields (`stored_privately`, `access_limited`, `contact_handling_rules_complied`, `third_party_personal_data_included`) under `freshness` instead of under a separate `privacy` object, contrary to SERVICE.md's field table (`privacy.*`). The cases were corrected minimally before execution and were not scored against the atom in their original form.

## Final verdict

**PASS** — all four cases matched the contract on the live gateway: the full-pass, violations and sparse outcomes were exactly as documented in SERVICE.md, the malformed case returned HTTP 422 with `error: "invalid_input"` on first execution, and both determinism (byte-identical) and MCP/REST parity (structured-equal) held true.
