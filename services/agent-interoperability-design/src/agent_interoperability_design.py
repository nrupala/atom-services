#!/usr/bin/env python3
"""Agent interoperability design — deterministic core.

Built from the bound skill `agent-interoperability` (v1): speak
standard protocols, bridge them deliberately, and give every
handoff a contract. This atom is a DESIGN verdict over a declared
agent-interoperability design manifest: the protocol chosen per
integration, the bridge architecture, the gateway in front of
remote paths, the handoff contract, agent identity, versioning
and discovery, the audit log, handshake testing, and the skill's
two red lines.

The caller submits a design manifest (a dict, or JSON on the CLI).
Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

One section is computed, not merely declared, and uses ONLY the
mapping the skill itself states in Method step 1 ("Pick by
counterparty, not fashion") — no outside criterion is imported:

- tools/resources for models        -> MCP            ("mcp")
- editor <-> agent sessions         -> ACP over stdio ("acp_stdio")
- agent <-> agent runs / services   -> ACP over REST  ("acp_rest")
                                       or A2A         ("a2a")
- humans, scripts, anything         -> REST/CLI/web   ("rest_cli_web")

A declared integration whose counterparty type is outside that
vocabulary fails the vocabulary check; a declared protocol that
does not match its counterparty's stated protocol fails the match
check. The computed outcome is also reported as `protocol_status`:
"not_sound_on_declared_evidence" when either computed check
fails, "sound_on_declared_evidence" when both pass, otherwise
null. The declared number of integrations is reported as
`integration_count` (null when no integration list is declared).
Both are exact integers / fixed strings, so the Python and
TypeScript outputs are byte-identical.

Verdict:
- any fail             -> DESIGN_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DESIGN_SOUND

This is a verdict over declared evidence about a design — it does
not connect to any agent, run a handshake, or verify that a
declared value is true.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "protocol_selection",
    "bridge_architecture",
    "gateway_and_remote_access",
    "handoff_contracts",
    "identity_and_credentials",
    "versioning_and_discovery",
    "audit_and_provenance",
    "handshake_testing_and_red_lines",
)

# Method step 1, verbatim: the protocol(s) the skill assigns to
# each counterparty class. These tokens are the manifest's
# serialization of the skill's own names.
COUNTERPARTY_PROTOCOLS = {
    "tools_for_models": ("mcp",),
    "editor_agent_session": ("acp_stdio",),
    "agent_to_agent": ("acp_rest", "a2a"),
    "human_or_script": ("rest_cli_web",),
}

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "design": "string",
    "integrations": [{
        "counterparty_type": "string",
        "protocol": "string",
        "rationale_documented": "boolean",
    }],
    "architecture": {
        "single_core": "boolean",
        "protocol_adapters": "boolean",
        "business_logic_per_protocol": "boolean",
    },
    "gateway": {
        "remote_or_untrusted_agents_present": "boolean",
        "single_authenticated_broker": "boolean",
        "broker_authenticated": "boolean",
        "broker_audited": "boolean",
        "broker_rate_limited": "boolean",
        "direct_doors_to_remote_agents": "boolean",
    },
    "handoff": {
        "contracts_used_for_non_trivial_coordination": "boolean",
        "contract_states_goal": "boolean",
        "contract_states_constraints": "boolean",
        "contract_states_acceptance_criteria": "boolean",
        "contract_states_report_back_location": "boolean",
    },
    "identity": {
        "each_agent_own_credential": "boolean",
        "credentials_least_privilege": "boolean",
        "credentials_short_lived": "boolean",
        "credentials_revocable": "boolean",
        "shared_forever_keys_present": "boolean",
    },
    "discovery": {
        "capabilities_published": "boolean",
        "version_published": "boolean",
        "negotiation_supported": "boolean",
        "graceful_degradation_declared": "boolean",
    },
    "audit": {
        "message_log_kept": "boolean",
        "log_records_who_asked": "boolean",
        "log_records_what_ran": "boolean",
        "log_records_what_changed": "boolean",
    },
    "testing": {
        "handshake_tests_exist": "boolean",
        "handshake_tests_pass": "boolean",
        "handshake_tests_both_directions": "boolean",
        "handshake_tests_per_protocol": "boolean",
    },
    "red_lines": {
        "unsandboxed_third_party_agents_present": "boolean",
        "secrets_or_private_data_in_messages_by_default": "boolean",
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


def _gateway_check(results, name, manifest, field, evidence, ok_if):
    """A gateway property, required only when remote/untrusted
    agents are declared present (Method step 3 scopes the gateway
    pattern to remote/untrusted agents). Follows the house
    conditional pattern: the gate field itself absent -> missing;
    gate declared false -> pass as not applicable; gate true ->
    the property is checked on its declared value."""
    gate, has_gate = _get(manifest, "gateway",
                          "remote_or_untrusted_agents_present")
    value, has_value = _get(manifest, "gateway", field)
    if has_gate and gate:
        _check(results, "gateway_and_remote_access", name, value,
               has_value, ok_if(value), evidence)
    else:
        _check(results, "gateway_and_remote_access", name, gate,
               has_gate, True,
               "no remote or untrusted agents declared — the "
               "gateway pattern is not applicable")


def evaluate(manifest):
    """Return the verdict dict for an interoperability design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: protocol_selection (Method step 1 + quality
    #      gate: protocol choice documented per integration + why).
    #      Computed from the declared integration list against the
    #      skill's own counterparty -> protocol mapping. ----
    integrations, has_integrations = _get(manifest, "integrations")
    integrations_is_list = has_integrations and isinstance(
        integrations, list)
    integration_count = len(integrations) if integrations_is_list else None
    _check(results, "protocol_selection", "integrations_declared",
           integrations, integrations_is_list,
           integrations_is_list and len(integrations) > 0,
           "the design declares its integrations — protocol choice "
           "is made per integration, by counterparty")
    entries = integrations if integrations_is_list else []

    def _entry_field(entry, field):
        if not isinstance(entry, dict) or field not in entry:
            return None, False
        return entry[field], True

    counterparty_missing = False
    counterparty_invalid = False
    for entry in entries:
        ctype, has_ctype = _entry_field(entry, "counterparty_type")
        if not has_ctype:
            counterparty_missing = True
        elif not (isinstance(ctype, str)
                  and ctype in COUNTERPARTY_PROTOCOLS):
            counterparty_invalid = True
    _check(results, "protocol_selection",
           "counterparty_types_in_skill_vocabulary", None,
           integrations_is_list and not counterparty_missing,
           integrations_is_list and not counterparty_invalid
           and len(entries) > 0,
           "Method step 1 names four counterparty classes: "
           "tools/resources for models, editor <-> agent sessions, "
           "agent <-> agent runs/services, humans/scripts/anything")
    match_missing = False
    match_failed = False
    for entry in entries:
        ctype, has_ctype = _entry_field(entry, "counterparty_type")
        protocol, has_protocol = _entry_field(entry, "protocol")
        if not has_ctype or not has_protocol:
            match_missing = True
        elif not (isinstance(ctype, str)
                  and ctype in COUNTERPARTY_PROTOCOLS):
            # The skill assigns no protocol to a counterparty
            # outside its vocabulary, so no declared protocol can
            # match — a failure, not missing evidence.
            match_failed = True
        elif protocol not in COUNTERPARTY_PROTOCOLS[ctype]:
            match_failed = True
    _check(results, "protocol_selection",
           "protocols_match_counterparty_per_skill", None,
           integrations_is_list and not match_missing,
           integrations_is_list and not match_failed
           and len(entries) > 0,
           "Method step 1: tools/resources for models -> MCP; "
           "editor <-> agent sessions -> ACP (stdio); agent <-> "
           "agent runs/services -> ACP (REST) or A2A; humans, "
           "scripts, anything -> REST/CLI/web")
    rationale_missing = False
    rationale_failed = False
    for entry in entries:
        rationale, has_rationale = _entry_field(
            entry, "rationale_documented")
        if not has_rationale:
            rationale_missing = True
        elif rationale is not True:
            rationale_failed = True
    _check(results, "protocol_selection",
           "protocol_choice_documented_with_why_per_integration", None,
           integrations_is_list and not rationale_missing,
           integrations_is_list and not rationale_failed
           and len(entries) > 0,
           "quality gate: protocol choice documented per "
           "integration + why")

    # ---- Section 2: bridge_architecture (Method step 2: bridge,
    #      don't fork — one core, many protocol adapters; never
    #      implement business logic per protocol) ----
    _bool_check(results, "bridge_architecture", "single_core_declared",
                manifest, ("architecture", "single_core"),
                "bridge, don't fork: one core, many protocol "
                "adapters (the multi-surface pattern)")
    _bool_check(results, "bridge_architecture",
                "protocol_adapters_declared", manifest,
                ("architecture", "protocol_adapters"),
                "bridge, don't fork: many protocol adapters over "
                "the one core")
    _false_check(results, "bridge_architecture",
                 "no_business_logic_per_protocol", manifest,
                 ("architecture", "business_logic_per_protocol"),
                 "never implement business logic per protocol")

    # ---- Section 3: gateway_and_remote_access (Method step 3 +
    #      quality gate: broker in front of remote paths). Every
    #      property is required only when remote/untrusted agents
    #      are declared present. ----
    _gateway_check(results, "single_authenticated_broker_in_front",
                   manifest, "single_authenticated_broker",
                   "gateway pattern for remote/untrusted agents: a "
                   "single authenticated broker in front of remote "
                   "paths — not N direct doors",
                   lambda v: v is True)
    _gateway_check(results, "broker_authenticated", manifest,
                   "broker_authenticated",
                   "the broker is authenticated (mTLS/tokens)",
                   lambda v: v is True)
    _gateway_check(results, "broker_audited", manifest,
                   "broker_audited",
                   "the broker is audited",
                   lambda v: v is True)
    _gateway_check(results, "broker_rate_limited", manifest,
                   "broker_rate_limited",
                   "the broker is rate-limited",
                   lambda v: v is True)
    _gateway_check(results, "no_direct_doors_to_remote_agents",
                   manifest, "direct_doors_to_remote_agents",
                   "gateway pattern: not N direct doors to remote "
                   "agents",
                   lambda v: v is False)

    # ---- Section 4: handoff_contracts (Method step 4 + quality
    #      gate: handoff contracts used for non-trivial
    #      coordination; every cross-agent message states goal,
    #      constraints, acceptance criteria, report-back location)
    #      ----
    _bool_check(results, "handoff_contracts",
                "contracts_used_for_non_trivial_coordination",
                manifest,
                ("handoff", "contracts_used_for_non_trivial_coordination"),
                "quality gate: handoff contracts used for "
                "non-trivial coordination")
    _bool_check(results, "handoff_contracts", "contract_states_goal",
                manifest, ("handoff", "contract_states_goal"),
                "every cross-agent message states the goal")
    _bool_check(results, "handoff_contracts",
                "contract_states_constraints", manifest,
                ("handoff", "contract_states_constraints"),
                "every cross-agent message states the constraints")
    _bool_check(results, "handoff_contracts",
                "contract_states_acceptance_criteria", manifest,
                ("handoff", "contract_states_acceptance_criteria"),
                "every cross-agent message states the acceptance "
                "criteria")
    _bool_check(results, "handoff_contracts",
                "contract_states_report_back_location", manifest,
                ("handoff", "contract_states_report_back_location"),
                "every cross-agent message states the report-back "
                "location")

    # ---- Section 5: identity_and_credentials (Method step 5 +
    #      quality gate: agent credentials scoped + revocable) ----
    _bool_check(results, "identity_and_credentials",
                "each_agent_has_own_credential", manifest,
                ("identity", "each_agent_own_credential"),
                "identity between agents: each agent has its own "
                "credential")
    _bool_check(results, "identity_and_credentials",
                "credentials_least_privilege", manifest,
                ("identity", "credentials_least_privilege"),
                "identity between agents: least privilege — "
                "credentials are scoped")
    _bool_check(results, "identity_and_credentials",
                "credentials_short_lived", manifest,
                ("identity", "credentials_short_lived"),
                "identity between agents: credentials are "
                "short-lived")
    _bool_check(results, "identity_and_credentials",
                "credentials_revocable", manifest,
                ("identity", "credentials_revocable"),
                "identity between agents: credentials are revocable "
                "(quality gate: scoped + revocable)")
    _false_check(results, "identity_and_credentials",
                 "no_shared_forever_keys", manifest,
                 ("identity", "shared_forever_keys_present"),
                 "no shared 'service-to-service forever' keys")

    # ---- Section 6: versioning_and_discovery (Method step 6:
    #      publish capabilities (tools list, agent card, version);
    #      negotiate; degrade gracefully) ----
    _bool_check(results, "versioning_and_discovery",
                "capabilities_published", manifest,
                ("discovery", "capabilities_published"),
                "versioning + discovery: publish capabilities "
                "(tools list, agent card, version)")
    _bool_check(results, "versioning_and_discovery",
                "version_published", manifest,
                ("discovery", "version_published"),
                "versioning + discovery: the version is published "
                "with the capabilities")
    _bool_check(results, "versioning_and_discovery",
                "negotiation_supported", manifest,
                ("discovery", "negotiation_supported"),
                "versioning + discovery: negotiate with the "
                "counterparty")
    _bool_check(results, "versioning_and_discovery",
                "graceful_degradation_declared", manifest,
                ("discovery", "graceful_degradation_declared"),
                "degrade gracefully when the counterparty is "
                "older/newer")

    # ---- Section 7: audit_and_provenance (Method step 7: audit
    #      everything — message log with provenance: who asked,
    #      what ran, what changed) ----
    _bool_check(results, "audit_and_provenance", "message_log_kept",
                manifest, ("audit", "message_log_kept"),
                "audit everything: a message log is kept — history "
                "is the dispute resolver")
    _bool_check(results, "audit_and_provenance",
                "log_records_who_asked", manifest,
                ("audit", "log_records_who_asked"),
                "provenance: the log records who asked")
    _bool_check(results, "audit_and_provenance",
                "log_records_what_ran", manifest,
                ("audit", "log_records_what_ran"),
                "provenance: the log records what ran")
    _bool_check(results, "audit_and_provenance",
                "log_records_what_changed", manifest,
                ("audit", "log_records_what_changed"),
                "provenance: the log records what changed")

    # ---- Section 8: handshake_testing_and_red_lines (Method
    #      step 8 + quality gate: handshake test exists and passes,
    #      both directions; the skill's two red lines) ----
    _bool_check(results, "handshake_testing_and_red_lines",
                "handshake_tests_exist", manifest,
                ("testing", "handshake_tests_exist"),
                "test the handshake: scripted counterparty tests "
                "per protocol — not just 'it worked once in the "
                "demo' (quality gate: handshake test exists)")
    _bool_check(results, "handshake_testing_and_red_lines",
                "handshake_tests_pass", manifest,
                ("testing", "handshake_tests_pass"),
                "quality gate: the handshake test passes")
    _bool_check(results, "handshake_testing_and_red_lines",
                "handshake_tests_both_directions", manifest,
                ("testing", "handshake_tests_both_directions"),
                "quality gate: the handshake test passes in both "
                "directions")
    _bool_check(results, "handshake_testing_and_red_lines",
                "handshake_tests_per_protocol", manifest,
                ("testing", "handshake_tests_per_protocol"),
                "test the handshake: scripted counterparty tests "
                "exist per protocol")
    _false_check(results, "handshake_testing_and_red_lines",
                 "no_unsandboxed_third_party_agents", manifest,
                 ("red_lines", "unsandboxed_third_party_agents_present"),
                 "red line: no unsandboxed third-party agents "
                 "hitting your systems")
    _false_check(results, "handshake_testing_and_red_lines",
                 "no_secrets_or_private_data_in_messages_by_default",
                 manifest,
                 ("red_lines",
                  "secrets_or_private_data_in_messages_by_default"),
                 "red line: no secrets or private data in "
                 "agent-to-agent messages by default")

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
        verdict = "DESIGN_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DESIGN_SOUND"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("counterparty_types_in_skill_vocabulary",
                          "protocols_match_counterparty_per_skill")
    ]
    if any(s == "fail" for s in computed_statuses):
        protocol_status = "not_sound_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        protocol_status = "sound_on_declared_evidence"
    else:
        protocol_status = None

    return {
        "service": "agent-interoperability-design",
        "atom_version": "0.1.0",
        "design": manifest.get("design"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "protocol_status": protocol_status,
        "integration_count": integration_count,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across eight sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "AGENT INTEROPERABILITY DESIGN VERDICT",
        f"design: {verdict.get('design')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: agent_interoperability_design.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
