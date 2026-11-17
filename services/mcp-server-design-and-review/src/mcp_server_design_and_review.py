#!/usr/bin/env python3
"""MCP server design and review — deterministic core.

Built from the bound skill `mcp-engineering`: "Build and consume
MCP well — tool design, transports, auth, injection-safe
tooling, contract tests."

This atom is a REVIEW of a declared MCP server record: it
validates the record a caller declares against the skill's
sections — tool design and the context budget, transports and
auth, safety rails and injection awareness, versioning /
contract tests / observability, and the red lines. It does not
connect to a server, run a handshake, execute a tool, read live
traffic, or verify that a declared control actually works — it
checks that the record the skill requires is present and
internally complete and consistent on the declared evidence.

The caller submits an MCP server manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- tools: the declared `tools` list must be non-empty, and every
  declared tool row must carry a typed schema, do a single job,
  declare an operation from the skill's own separation set
  (read / write / destructive), and carry a negative test;
- tool-name ownership: no declared tool name may appear on more
  than one tool row (tool names identify tools — a duplicated
  name is an internally inconsistent record);
- destructive gating: every declared tool row whose operation
  is `destructive` must declare an approval or scope gate (the
  skill: destructive actions "gated by human approval or
  explicit scopes"; quality gate: "Destructive tools carry
  approval/scope gates"). A record with no destructive rows
  passes this check vacuously.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold — no maximum tool count
("aim for the smallest set that covers the job" states no
number; its "why does it have 40 tools?" is a review question,
not a cap), no response-size byte cap, no error-rate spike
percentage, no test-coverage percentage, no timeout, no
deprecation notice period, and no mandated protocol version —
so no numeric threshold check is invented; those quantities are
caller attestations at most, and quantities here are computed
and reported, with completeness (every declared tool) as the
only bar, exactly as stated above.

Verdict:
- any fail             -> MCP_SERVER_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> MCP_SERVER_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "tool_design_and_budget",
    "transports_and_auth",
    "safety_rails_and_injection_awareness",
    "versioning_contract_tests_and_observability",
    "red_lines",
)

OPERATIONS = ("read", "write", "destructive")

MANIFEST_SPEC = {
    "server": "string",
    "tool_design": {
        "names_are_verb_noun": "boolean",
        "typed_json_schemas": "boolean",
        "descriptions_state_when_to_use": "boolean",
        "errors_teach_fix": "boolean",
        "one_job_per_tool": "boolean",
        "god_tools_present": "boolean",
    },
    "budget": {
        "smallest_set_covers_job": "boolean",
        "related_operations_grouped": "boolean",
    },
    "tools": [{
        "name": "string",
        "operation": "string",
        "has_typed_schema": "boolean",
        "single_job": "boolean",
        "has_negative_test": "boolean",
        "approval_or_scope_gate_present": "boolean",
    }],
    "transport": {
        "transport_matches_deployment": "boolean",
        "handlers_stateless_where_possible": "boolean",
        "boundary_validation_applied": "boolean",
    },
    "auth": {
        "remote_transports_authenticated": "boolean",
        "remote_tls_present": "boolean",
        "least_privilege_tokens_per_server": "boolean",
    },
    "safety": {
        "destructive_actions_gated_by_approval_or_scope": "boolean",
        "read_and_write_separated": "boolean",
    },
    "injection": {
        "tool_results_treated_as_untrusted": "boolean",
        "fetched_text_never_treated_as_instructions": "boolean",
        "response_sizes_capped": "boolean",
        "outputs_sanitized_before_echoing": "boolean",
    },
    "versioning": {
        "capabilities_negotiated": "boolean",
        "changes_additive": "boolean",
        "deprecations_announced_loudly": "boolean",
        "protocol_versions_pinned": "boolean",
    },
    "tests": {
        "handshake_smoke_in_ci": "boolean",
        "per_tool_happy_and_error_cases_covered": "boolean",
        "malformed_input_tests_present": "boolean",
        "schema_valid_tool_definitions": "boolean",
    },
    "observability": {
        "calls_logged_with_tool_duration_outcome": "boolean",
        "error_rate_spike_alerts_present": "boolean",
        "secrets_or_sensitive_payloads_logged_present": "boolean",
    },
    "red_lines": {
        "shell_passthrough_without_sandboxing_present": "boolean",
        "secrets_echoed_back_present": "boolean",
        "unbounded_resource_reads_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for an MCP server design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    tools, has_tools = _get(manifest, "tools")
    tools_is_list = has_tools and isinstance(tools, list)
    tools_count = len(tools) if tools_is_list else None
    rows = tools if tools_is_list else []

    tools_without_typed_schema = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "has_typed_schema" in c
         and c.get("has_typed_schema") is not True]
        if tools_is_list else None
    )
    tools_not_single_job = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "single_job" in c
         and c.get("single_job") is not True]
        if tools_is_list else None
    )
    tools_with_invalid_operation = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "operation" in c
         and c.get("operation") not in OPERATIONS]
        if tools_is_list else None
    )
    duplicate_tool_names = None
    if tools_is_list:
        seen = []
        duplicate_tool_names = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("name"), str):
                name = c["name"]
                if name in seen and name not in duplicate_tool_names:
                    duplicate_tool_names.append(name)
                seen.append(name)
    destructive_rows = (
        [c for c in rows
         if isinstance(c, dict) and c.get("operation") == "destructive"]
        if tools_is_list else []
    )
    destructive_tools_without_gate = (
        [_row_name(c) for c in destructive_rows
         if "approval_or_scope_gate_present" in c
         and c.get("approval_or_scope_gate_present") is not True]
        if tools_is_list else None
    )
    tools_without_negative_test = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "has_negative_test" in c
         and c.get("has_negative_test") is not True]
        if tools_is_list else None
    )
    typed_schema_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("has_typed_schema") is True)
        / tools_count
        if tools_is_list and tools_count > 0 else None
    )
    single_job_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("single_job") is True)
        / tools_count
        if tools_is_list and tools_count > 0 else None
    )
    valid_operation_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("operation") in OPERATIONS)
        / tools_count
        if tools_is_list and tools_count > 0 else None
    )
    destructive_gate_coverage = (
        sum(1 for c in destructive_rows
            if c.get("approval_or_scope_gate_present") is True)
        / len(destructive_rows)
        if tools_is_list and len(destructive_rows) > 0 else None
    )
    negative_test_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("has_negative_test") is True)
        / tools_count
        if tools_is_list and tools_count > 0 else None
    )

    # ---- Section 1: tool_design_and_budget (skill method 1-2 —
    #      clear verb_noun names, typed JSON schemas, descriptions
    #      that say when to use the tool, errors that teach the
    #      fix, one job per tool, no god-tools; the smallest set
    #      that covers the job, related operations grouped) ----
    _bool_check(results, "tool_design_and_budget",
                "names_are_verb_noun", manifest,
                ("tool_design", "names_are_verb_noun"),
                "tool design: tool names are clear verb_noun names")
    _bool_check(results, "tool_design_and_budget",
                "typed_json_schemas", manifest,
                ("tool_design", "typed_json_schemas"),
                "tool design: tools carry typed JSON schemas")
    _bool_check(results, "tool_design_and_budget",
                "descriptions_state_when_to_use", manifest,
                ("tool_design", "descriptions_state_when_to_use"),
                "tool design: concise descriptions say when to "
                "use each tool")
    _bool_check(results, "tool_design_and_budget",
                "errors_teach_fix", manifest,
                ("tool_design", "errors_teach_fix"),
                "tool design: errors teach the fix")
    _bool_check(results, "tool_design_and_budget",
                "one_job_per_tool", manifest,
                ("tool_design", "one_job_per_tool"),
                "tool design: one job per tool")
    _false_check(results, "tool_design_and_budget",
                 "no_god_tools", manifest,
                 ("tool_design", "god_tools_present"),
                 "tool design: no god-tools are present")
    _bool_check(results, "tool_design_and_budget",
                "smallest_set_covers_job", manifest,
                ("budget", "smallest_set_covers_job"),
                "respect the budget: the tool set is the smallest "
                "set that covers the job — each tool costs context "
                "and confusion")
    _bool_check(results, "tool_design_and_budget",
                "related_operations_grouped", manifest,
                ("budget", "related_operations_grouped"),
                "respect the budget: related operations are grouped")
    _check(results, "tool_design_and_budget",
           "tools_declared", tools, tools_is_list,
           tools_is_list and tools_count > 0,
           "the declared record names its tools — the tools "
           "list is present and non-empty")
    schema_present = (
        tools_is_list
        and all(isinstance(c, dict) and "has_typed_schema" in c
                for c in rows)
    )
    _check(results, "tool_design_and_budget",
           "every_tool_has_typed_schema", tools, schema_present,
           tools_is_list and tools_count > 0
           and all(isinstance(c, dict)
                   and c.get("has_typed_schema") is True
                   for c in rows),
           "tool design: every declared tool row carries a "
           "typed schema")
    job_present = (
        tools_is_list
        and all(isinstance(c, dict) and "single_job" in c
                for c in rows)
    )
    _check(results, "tool_design_and_budget",
           "every_tool_single_job", tools, job_present,
           tools_is_list and tools_count > 0
           and all(isinstance(c, dict)
                   and c.get("single_job") is True
                   for c in rows),
           "tool design: every declared tool row does a single "
           "job — no god-tools")
    operation_present = (
        tools_is_list
        and all(isinstance(c, dict) and "operation" in c
                for c in rows)
    )
    _check(results, "tool_design_and_budget",
           "every_tool_operation_valid", tools, operation_present,
           tools_is_list and tools_count > 0
           and all(isinstance(c, dict)
                   and c.get("operation") in OPERATIONS
                   for c in rows),
           "tool design: every declared tool row declares an "
           "operation from the skill's separation set — read / "
           "write / destructive")
    name_present = (
        tools_is_list
        and all(isinstance(c, dict) and "name" in c for c in rows)
    )
    _check(results, "tool_design_and_budget",
           "no_tool_name_duplicated", tools, name_present,
           tools_is_list and duplicate_tool_names is not None
           and len(duplicate_tool_names) == 0,
           "tool design: no declared tool name appears on more "
           "than one tool row")

    # ---- Section 2: transports_and_auth (skill method 3 —
    #      stdio for local single-user, HTTP for remote with auth
    #      and TLS, handlers stateless where possible, validate
    #      everything at the boundary; quality gate: remote
    #      transports authenticated, local = least privilege) ----
    _bool_check(results, "transports_and_auth",
                "transport_matches_deployment", manifest,
                ("transport", "transport_matches_deployment"),
                "transports: the transport matches the deployment "
                "— stdio for local single-user, HTTP for remote")
    _bool_check(results, "transports_and_auth",
                "handlers_stateless_where_possible", manifest,
                ("transport", "handlers_stateless_where_possible"),
                "transports: handlers are stateless where possible")
    _bool_check(results, "transports_and_auth",
                "boundary_validation_applied", manifest,
                ("transport", "boundary_validation_applied"),
                "transports: everything is validated at the "
                "boundary")
    _bool_check(results, "transports_and_auth",
                "remote_transports_authenticated", manifest,
                ("auth", "remote_transports_authenticated"),
                "transports: remote transports are authenticated")
    _bool_check(results, "transports_and_auth",
                "remote_tls_present", manifest,
                ("auth", "remote_tls_present"),
                "transports: remote HTTP runs with TLS")
    _bool_check(results, "transports_and_auth",
                "least_privilege_tokens_per_server", manifest,
                ("auth", "least_privilege_tokens_per_server"),
                "auth: least-privilege tokens are held per server")

    # ---- Section 3: safety_rails_and_injection_awareness (skill
    #      methods 4-5 — destructive actions gated by human
    #      approval or explicit scopes, read vs write separated;
    #      tool results are untrusted content, fetched text is
    #      never instructions, response sizes capped, sanitize
    #      before echoing) ----
    _bool_check(results, "safety_rails_and_injection_awareness",
                "destructive_actions_gated_by_approval_or_scope",
                manifest,
                ("safety",
                 "destructive_actions_gated_by_approval_or_scope"),
                "safety rails: destructive actions — delete, "
                "send, pay, deploy — are gated by human approval "
                "or explicit scopes")
    _bool_check(results, "safety_rails_and_injection_awareness",
                "read_and_write_separated", manifest,
                ("safety", "read_and_write_separated"),
                "safety rails: read and write tools are separated")
    _bool_check(results, "safety_rails_and_injection_awareness",
                "tool_results_treated_as_untrusted", manifest,
                ("injection", "tool_results_treated_as_untrusted"),
                "injection-aware: tool results are treated as "
                "untrusted content")
    _bool_check(results, "safety_rails_and_injection_awareness",
                "fetched_text_never_treated_as_instructions",
                manifest,
                ("injection",
                 "fetched_text_never_treated_as_instructions"),
                "injection-aware: fetched text is never treated "
                "as instructions")
    _bool_check(results, "safety_rails_and_injection_awareness",
                "response_sizes_capped", manifest,
                ("injection", "response_sizes_capped"),
                "injection-aware: response sizes are capped")
    _bool_check(results, "safety_rails_and_injection_awareness",
                "outputs_sanitized_before_echoing", manifest,
                ("injection", "outputs_sanitized_before_echoing"),
                "injection-aware: outputs are sanitized before "
                "echoing anywhere")
    gate_present = (
        tools_is_list
        and all("approval_or_scope_gate_present" in c
                for c in destructive_rows)
    )
    _check(results, "safety_rails_and_injection_awareness",
           "every_destructive_tool_gated", tools, gate_present,
           tools_is_list
           and all(c.get("approval_or_scope_gate_present") is True
                   for c in destructive_rows),
           "safety rails: every declared destructive tool row "
           "carries an approval or scope gate — a record with "
           "no destructive rows passes vacuously")

    # ---- Section 4: versioning_contract_tests_and_observability
    #      (skill methods 6-8 — negotiate capabilities, additive
    #      changes, deprecate loudly, pin protocol versions;
    #      handshake smoke in CI, per-tool happy + error cases,
    #      malformed-input tests, schema-valid definitions and
    #      negative tests per tool; log tool / duration /
    #      outcome, alert on error-rate spikes, never log
    #      secrets or full sensitive payloads) ----
    _bool_check(results, "versioning_contract_tests_and_observability",
                "capabilities_negotiated", manifest,
                ("versioning", "capabilities_negotiated"),
                "versioning: capabilities are negotiated")
    _bool_check(results, "versioning_contract_tests_and_observability",
                "changes_additive", manifest,
                ("versioning", "changes_additive"),
                "versioning: changes are additive")
    _bool_check(results, "versioning_contract_tests_and_observability",
                "deprecations_announced_loudly", manifest,
                ("versioning", "deprecations_announced_loudly"),
                "versioning: deprecations are announced loudly")
    _bool_check(results, "versioning_contract_tests_and_observability",
                "protocol_versions_pinned", manifest,
                ("versioning", "protocol_versions_pinned"),
                "versioning: the protocol versions clients speak "
                "are pinned")
    _bool_check(results, "versioning_contract_tests_and_observability",
                "handshake_smoke_in_ci", manifest,
                ("tests", "handshake_smoke_in_ci"),
                "contract tests: handshake — initialize / list / "
                "call — smoke runs in CI")
    _bool_check(results, "versioning_contract_tests_and_observability",
                "per_tool_happy_and_error_cases_covered", manifest,
                ("tests", "per_tool_happy_and_error_cases_covered"),
                "contract tests: per-tool happy and error cases "
                "are covered")
    _bool_check(results, "versioning_contract_tests_and_observability",
                "malformed_input_tests_present", manifest,
                ("tests", "malformed_input_tests_present"),
                "contract tests: malformed-input tests are present")
    _bool_check(results, "versioning_contract_tests_and_observability",
                "schema_valid_tool_definitions", manifest,
                ("tests", "schema_valid_tool_definitions"),
                "quality gate: tool definitions are schema-valid")
    negative_present = (
        tools_is_list
        and all(isinstance(c, dict) and "has_negative_test" in c
                for c in rows)
    )
    _check(results, "versioning_contract_tests_and_observability",
           "every_tool_has_negative_test", tools, negative_present,
           tools_is_list and tools_count > 0
           and all(isinstance(c, dict)
                   and c.get("has_negative_test") is True
                   for c in rows),
           "quality gate: every declared tool row carries a "
           "negative test")
    _bool_check(results, "versioning_contract_tests_and_observability",
                "calls_logged_with_tool_duration_outcome", manifest,
                ("observability",
                 "calls_logged_with_tool_duration_outcome"),
                "observability: calls are logged with tool, "
                "duration and outcome")
    _bool_check(results, "versioning_contract_tests_and_observability",
                "error_rate_spike_alerts_present", manifest,
                ("observability", "error_rate_spike_alerts_present"),
                "observability: alerts fire on error-rate spikes")
    _false_check(results, "versioning_contract_tests_and_observability",
                 "no_secrets_or_sensitive_payloads_logged", manifest,
                 ("observability",
                  "secrets_or_sensitive_payloads_logged_present"),
                 "observability: no secrets or full payloads of "
                 "sensitive data are logged")

    # ---- Section 5: red_lines (skill red lines — no shell
    #      passthrough tools without sandboxing, no secrets
    #      echoed back, no unbounded resource reads) ----
    _false_check(results, "red_lines",
                 "no_shell_passthrough_without_sandboxing", manifest,
                 ("red_lines",
                  "shell_passthrough_without_sandboxing_present"),
                 "red line: no shell passthrough tools without "
                 "sandboxing are present")
    _false_check(results, "red_lines",
                 "no_secrets_echoed_back", manifest,
                 ("red_lines", "secrets_echoed_back_present"),
                 "red line: no secrets are echoed back")
    _false_check(results, "red_lines",
                 "no_unbounded_resource_reads", manifest,
                 ("red_lines", "unbounded_resource_reads_present"),
                 "red line: no unbounded resource reads are present")

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
        verdict = "MCP_SERVER_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "MCP_SERVER_SOUND"

    computed_names = (
        "tools_declared",
        "every_tool_has_typed_schema",
        "every_tool_single_job",
        "every_tool_operation_valid",
        "no_tool_name_duplicated",
        "every_destructive_tool_gated",
        "every_tool_has_negative_test",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "mcp-server-design-and-review",
        "atom_version": "0.1.0",
        "server": manifest.get("server"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "tools_count": tools_count,
        "tools_without_typed_schema": tools_without_typed_schema,
        "typed_schema_coverage": _fmt6(typed_schema_coverage),
        "tools_not_single_job": tools_not_single_job,
        "single_job_coverage": _fmt6(single_job_coverage),
        "tools_with_invalid_operation": tools_with_invalid_operation,
        "valid_operation_coverage": _fmt6(valid_operation_coverage),
        "duplicate_tool_names": duplicate_tool_names,
        "destructive_tools_without_gate": destructive_tools_without_gate,
        "destructive_gate_coverage": _fmt6(destructive_gate_coverage),
        "tools_without_negative_test": tools_without_negative_test,
        "negative_test_coverage": _fmt6(negative_test_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "MCP SERVER DESIGN AND REVIEW",
        f"server: {verdict.get('server')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: mcp_server_design_and_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "MCP_SERVER_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
