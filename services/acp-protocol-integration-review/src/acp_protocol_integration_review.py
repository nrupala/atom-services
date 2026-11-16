#!/usr/bin/env python3
"""ACP protocol integration review — deterministic core.

Built from the bound skill `acp-engineering` (v1): "ACP" is two
protocols — the Agent Client Protocol (editors <-> agents, stdio
sessions) and the Agent Communication Protocol (agent <-> agent
REST runs) — and an integration is reviewed against the skill's
method, quality gates and red lines.

The caller submits an integration manifest (a dict, or JSON on the
CLI): a DECLARED review pack for one ACP integration. Every check
reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

One check is computed from the skill's own vocabulary, and no
outside threshold is imported (the skill states that chunk sizes
are bounded and output sizes are capped, but states no number for
either, so those are declared booleans, never arithmetic):

- the declared protocol flavour must be exactly "ACP-client" or
  "ACP-comm" — the skill's quality gate requires disambiguated
  naming in docs/code ("ACP-client" vs "ACP-comm"). Any other
  declared value fails. The derived flavour is also reported as
  `flavor_status`: "acp_client" / "acp_comm" / "unrecognized" /
  null when no flavour is declared.

Four protocol-surface checks are conditional on the declared
flavour, and one security check is conditional on remote endpoints
being present, following the house not-applicable pattern: when the
condition does not hold, the check passes as not applicable (its
status is "missing" only when the gating field itself is absent).

Verdict:
- any fail             -> INTEGRATION_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> INTEGRATION_SOUND

Red lines (skill): no unauthenticated remote endpoints; no
pretending unsupported features work.

This reviews declared evidence about an integration — it does not
connect to, probe, or run the integration, and does not verify
that a declared value is true.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "disambiguation_and_scope",
    "adapter_architecture",
    "protocol_surface",
    "lifecycle_correctness",
    "streaming_discipline",
    "security",
    "honesty_tests_and_upgrade_path",
)

RECOGNIZED_FLAVORS = ("ACP-client", "ACP-comm")

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "implementation": "string",
    "protocol": {
        "flavor": "string",
        "disambiguated_naming": "boolean",
        "spec_version_documented": "boolean",
        "supported_subset_documented": "boolean",
    },
    "adapter": {
        "thin": "boolean",
        "single_core_protocol_at_edge": "boolean",
        "business_logic_in_wire_layer": "boolean",
    },
    "surface": {
        "client_flow_complete": "boolean",
        "client_permissions_handled": "boolean",
        "comm_endpoints_complete": "boolean",
        "comm_message_parts_typed": "boolean",
    },
    "lifecycle": {
        "unknown_sessions_or_runs_handled": "boolean",
        "cancels_handled": "boolean",
        "errors_handled": "boolean",
        "reconnects_handled": "boolean",
        "state_leaks_across_sessions": "boolean",
    },
    "streaming": {
        "updates_ordered": "boolean",
        "chunk_sizes_bounded": "boolean",
        "backpressure_addressed": "boolean",
        "terminal_states_clear": "boolean",
    },
    "security": {
        "remote_endpoints_present": "boolean",
        "remote_endpoints_authenticated": "boolean",
        "inputs_validated": "boolean",
        "output_sizes_capped": "boolean",
        "tool_execution_sandboxed": "boolean",
    },
    "honesty": {
        "unimplemented_modes_noted": "boolean",
        "unsupported_features_faked": "boolean",
    },
    "tests": {
        "scripted_client_handshake_covered": "boolean",
        "lifecycle_happy_error_cancel_covered": "boolean",
        "contract_tests_in_ci_per_protocol": "boolean",
    },
    "upgrade": {
        "sdk_upgrade_path_documented": "boolean",
        "adapter_tests_kept_for_sdk_swap": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def evaluate(manifest):
    """Return the verdict dict for an ACP integration manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    flavor, has_flavor = _get(manifest, "protocol", "flavor")

    # ---- Section 1: disambiguation_and_scope (skill method 1 +
    #      quality gates: disambiguated naming; spec version +
    #      supported subset documented) ----
    _bool_check(results, "disambiguation_and_scope",
                "disambiguated_naming_in_docs_and_code",
                manifest, ("protocol", "disambiguated_naming"),
                "quality gate: disambiguated naming in docs/code "
                "('ACP-client' vs 'ACP-comm') — always disambiguate "
                "which ACP is meant")
    _check(results, "disambiguation_and_scope", "flavor_recognized",
           flavor, has_flavor, flavor in RECOGNIZED_FLAVORS,
           "the declared flavour is one of the skill's two ACPs: "
           "'ACP-client' (Agent Client Protocol) or 'ACP-comm' "
           "(Agent Communication Protocol)")
    _bool_check(results, "disambiguation_and_scope",
                "spec_version_documented",
                manifest, ("protocol", "spec_version_documented"),
                "minimal-but-honest: label spec versions supported")
    _bool_check(results, "disambiguation_and_scope",
                "supported_subset_documented",
                manifest, ("protocol", "supported_subset_documented"),
                "quality gate: spec version + supported subset "
                "documented")

    # ---- Section 2: adapter_architecture (skill method 2:
    #      protocol adapters stay thin) ----
    _bool_check(results, "adapter_architecture", "adapter_thin",
                manifest, ("adapter", "thin"),
                "protocol adapters stay thin: protocol sits at the "
                "edge")
    _bool_check(results, "adapter_architecture",
                "single_core_protocol_at_edge",
                manifest, ("adapter", "single_core_protocol_at_edge"),
                "one core, protocol sits at the edge "
                "('agent-commands'-style mapping)")
    _false_check(results, "adapter_architecture",
                 "no_business_logic_in_wire_layer",
                 manifest, ("adapter", "business_logic_in_wire_layer"),
                 "no business logic in the wire layer")

    # ---- Section 3: protocol_surface (skill method 1: the two
    #      flavours' declared surfaces, gated on the flavour) ----
    if has_flavor and flavor == "ACP-client":
        _bool_check(results, "protocol_surface",
                    "client_flow_complete_when_client_flavor",
                    manifest, ("surface", "client_flow_complete"),
                    "ACP-client surface: initialize -> session/new "
                    "-> session/prompt with streamed session/update "
                    "chunks, over stdio JSON-RPC")
        _bool_check(results, "protocol_surface",
                    "client_permissions_handled_when_client_flavor",
                    manifest, ("surface", "client_permissions_handled"),
                    "ACP-client surface: permissions are handled")
    else:
        _check(results, "protocol_surface",
               "client_flow_complete_when_client_flavor",
               flavor, has_flavor, True,
               "not an ACP-client integration")
        _check(results, "protocol_surface",
               "client_permissions_handled_when_client_flavor",
               flavor, has_flavor, True,
               "not an ACP-client integration")
    if has_flavor and flavor == "ACP-comm":
        _bool_check(results, "protocol_surface",
                    "comm_endpoints_complete_when_comm_flavor",
                    manifest, ("surface", "comm_endpoints_complete"),
                    "ACP-comm surface: REST — GET /agents, POST "
                    "/runs (sync/async/stream), GET /runs/:id, cancel")
        _bool_check(results, "protocol_surface",
                    "comm_message_parts_typed_when_comm_flavor",
                    manifest, ("surface", "comm_message_parts_typed"),
                    "ACP-comm surface: message parts with content "
                    "types")
    else:
        _check(results, "protocol_surface",
               "comm_endpoints_complete_when_comm_flavor",
               flavor, has_flavor, True,
               "not an ACP-comm integration")
        _check(results, "protocol_surface",
               "comm_message_parts_typed_when_comm_flavor",
               flavor, has_flavor, True,
               "not an ACP-comm integration")

    # ---- Section 4: lifecycle_correctness (skill method 3:
    #      session/run lifecycle correctness) ----
    _bool_check(results, "lifecycle_correctness",
                "unknown_sessions_or_runs_handled",
                manifest, ("lifecycle", "unknown_sessions_or_runs_handled"),
                "lifecycle: handle unknown sessions/runs")
    _bool_check(results, "lifecycle_correctness", "cancels_handled",
                manifest, ("lifecycle", "cancels_handled"),
                "lifecycle: handle cancels")
    _bool_check(results, "lifecycle_correctness", "errors_handled",
                manifest, ("lifecycle", "errors_handled"),
                "lifecycle: handle errors")
    _bool_check(results, "lifecycle_correctness", "reconnects_handled",
                manifest, ("lifecycle", "reconnects_handled"),
                "lifecycle: handle reconnects")
    _false_check(results, "lifecycle_correctness",
                 "no_state_leak_across_sessions",
                 manifest, ("lifecycle", "state_leaks_across_sessions"),
                 "lifecycle: never leak state across sessions")

    # ---- Section 5: streaming_discipline (skill method 4) ----
    _bool_check(results, "streaming_discipline", "updates_ordered",
                manifest, ("streaming", "updates_ordered"),
                "streaming discipline: order updates")
    _bool_check(results, "streaming_discipline", "chunk_sizes_bounded",
                manifest, ("streaming", "chunk_sizes_bounded"),
                "streaming discipline: bounded chunk sizes (the "
                "skill states bounded, and states no number — the "
                "bound is declared, not computed)")
    _bool_check(results, "streaming_discipline",
                "backpressure_addressed",
                manifest, ("streaming", "backpressure_addressed"),
                "streaming discipline: backpressure awareness")
    _bool_check(results, "streaming_discipline",
                "terminal_states_clear",
                manifest, ("streaming", "terminal_states_clear"),
                "streaming discipline: clear terminal states "
                "(stopReason / run status)")

    # ---- Section 6: security (skill method 7 + red line: no
    #      unauthenticated remote endpoints) ----
    remote, has_remote = _get(manifest, "security",
                              "remote_endpoints_present")
    auth, has_auth = _get(manifest, "security",
                          "remote_endpoints_authenticated")
    if has_remote and remote:
        _check(results, "security",
               "remote_endpoints_authenticated_when_remote",
               auth, has_auth, auth is True,
               "red line: no unauthenticated remote endpoints — "
               "remote ACP endpoints require auth (tokens/mTLS)")
    else:
        _check(results, "security",
               "remote_endpoints_authenticated_when_remote",
               remote, has_remote, True,
               "no remote endpoints declared")
    _bool_check(results, "security", "inputs_validated",
                manifest, ("security", "inputs_validated"),
                "security: validate all inputs (quality gate: "
                "remote endpoints authenticated; inputs validated)")
    _bool_check(results, "security", "output_sizes_capped",
                manifest, ("security", "output_sizes_capped"),
                "security: cap output sizes (the skill states a "
                "cap, and states no number — the cap is declared, "
                "not computed)")
    _bool_check(results, "security",
                "prompt_triggered_tool_execution_sandboxed",
                manifest, ("security", "tool_execution_sandboxed"),
                "security: sandbox any tool execution triggered "
                "via prompts")

    # ---- Section 7: honesty_tests_and_upgrade_path (skill methods
    #      5, 6 and 8 + quality gates + red line: no pretending
    #      unsupported features work) ----
    _bool_check(results, "honesty_tests_and_upgrade_path",
                "unimplemented_modes_noted",
                manifest, ("honesty", "unimplemented_modes_noted"),
                "minimal-but-honest: note unimplemented modes "
                "(e.g. stream)")
    _false_check(results, "honesty_tests_and_upgrade_path",
                 "unsupported_features_not_faked",
                 manifest, ("honesty", "unsupported_features_faked"),
                 "red line: never fake compliance — no pretending "
                 "unsupported features work")
    _bool_check(results, "honesty_tests_and_upgrade_path",
                "scripted_client_handshake_covered",
                manifest, ("tests", "scripted_client_handshake_covered"),
                "contract tests: scripted client covering handshake")
    _bool_check(results, "honesty_tests_and_upgrade_path",
                "lifecycle_happy_error_cancel_covered",
                manifest,
                ("tests", "lifecycle_happy_error_cancel_covered"),
                "quality gate / contract tests: lifecycle tests — "
                "session/run happy + error + cancel")
    _bool_check(results, "honesty_tests_and_upgrade_path",
                "contract_tests_in_ci_per_protocol",
                manifest, ("tests", "contract_tests_in_ci_per_protocol"),
                "contract tests: in CI, per protocol")
    _bool_check(results, "honesty_tests_and_upgrade_path",
                "sdk_upgrade_path_documented",
                manifest, ("upgrade", "sdk_upgrade_path_documented"),
                "production upgrade path: official SDKs when the "
                "surface grows")
    _bool_check(results, "honesty_tests_and_upgrade_path",
                "adapter_tests_kept_for_sdk_swap",
                manifest, ("upgrade", "adapter_tests_kept_for_sdk_swap"),
                "production upgrade path: keep the adapter tests "
                "so swaps are safe")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "INTEGRATION_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "INTEGRATION_SOUND"

    if not has_flavor:
        flavor_status = None
    elif flavor == "ACP-client":
        flavor_status = "acp_client"
    elif flavor == "ACP-comm":
        flavor_status = "acp_comm"
    else:
        flavor_status = "unrecognized"

    return {
        "service": "acp-protocol-integration-review",
        "atom_version": "0.1.0",
        "implementation": manifest.get("implementation"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "flavor_status": flavor_status,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "ACP PROTOCOL INTEGRATION REVIEW",
        f"implementation: {verdict.get('implementation')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: acp_protocol_integration_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "INTEGRATION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
