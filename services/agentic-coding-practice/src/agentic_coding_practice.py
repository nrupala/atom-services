#!/usr/bin/env python3
"""Agentic coding practice — deterministic core.

Built from the bound skill `agentic-coding`: "Coding agents
multiply output — and chaos, if undirected. The skill is making
them reliable: clear specs, tight feedback loops, and
deterministic guardrails so you're not just hoping the model
behaves."

The caller submits a practice manifest (a dict, or JSON on the
CLI): a DECLARED agentic-coding setup / workflow. Every check
reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Every check traces to a statement the skill itself makes — its
building blocks (hooks, sub-agents, MCP tools, events &
payloads), its disciplines (spec first, small vertical slices,
review diffs, tests + linters in hooks, context hygiene,
guardrails: protected paths, no secrets, no Docker, staging-
first, human-in-the-loop on irreversible actions), and its
anti-patterns to refuse (unbounded runs, rubber-stamping diffs,
no automated tests in the loop, dumping whole repos into
context, broad write access with zero guardrails). No threshold,
limit, count, or vocabulary is imported from outside the skill:
the skill states no numeric threshold, so this core computes
none.

One check is conditional, following the skill's anti-pattern
wording exactly: "agents with broad write access and zero
guardrails" is the refusal — broad write access is a failure
only when it is declared together with no guardrails. When
broad write access is declared, `access.guardrails_present`
must be declared true; when no broad write access is declared,
the check passes as not applicable.

Verdict:
- any fail             -> NOT_RELIABLE_PRACTICE
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> RELIABLE_PRACTICE

This is a verdict over declared evidence about a practice — it
does not inspect a repository, read hook configurations, run an
agent, or verify that a declared practice is actually followed.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "spec_and_slicing",
    "hooks_and_events",
    "feedback_loop",
    "guardrails",
    "context_and_tools",
    "delegation_and_access",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "practice": "string",
    "spec": {
        "spec_written_first": "boolean",
        "small_vertical_slices": "boolean",
        "diffs_reviewed": "boolean",
    },
    "hooks": {
        "wired_as_guardrails": "boolean",
        "events_and_payloads_known": "boolean",
        "protected_paths_blocked": "boolean",
        "formatters_auto_run": "boolean",
        "secrets_denied": "boolean",
    },
    "feedback": {
        "tests_run_after_edit": "boolean",
        "tests_wired_into_hooks": "boolean",
        "linters_wired_into_hooks": "boolean",
    },
    "guardrails": {
        "protected_paths_declared": "boolean",
        "no_secrets": "boolean",
        "docker_used": "boolean",
        "staging_first": "boolean",
        "human_in_loop_on_irreversible": "boolean",
        "autonomous_only_safe_reversible": "boolean",
        "agent_run_unbounded": "boolean",
    },
    "context": {
        "only_what_agent_needs": "boolean",
        "whole_repo_dumped": "boolean",
        "files_pulled_into_workspace": "boolean",
    },
    "tools": {
        "mcp_tools_typed": "boolean",
        "mcp_tools_narrowly_scoped": "boolean",
    },
    "delegation": {
        "subagent_tasks_bounded": "boolean",
        "subagent_context_narrow": "boolean",
        "planner_worker_reviewer_pattern": "boolean",
    },
    "access": {
        "broad_write_access": "boolean",
        "guardrails_present": "boolean",
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
    """Return the verdict dict for an agentic-coding practice manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: spec_and_slicing (skill disciplines: "Spec
    #      first, small vertical slices. Review diffs — never
    #      rubber-stamp.") ----
    _bool_check(results, "spec_and_slicing", "spec_written_before_coding",
                manifest, ("spec", "spec_written_first"),
                "spec first: the spec is written before the coding "
                "agent builds")
    _bool_check(results, "spec_and_slicing", "small_vertical_slices",
                manifest, ("spec", "small_vertical_slices"),
                "work is split into small vertical slices")
    _bool_check(results, "spec_and_slicing",
                "diffs_reviewed_not_rubber_stamped",
                manifest, ("spec", "diffs_reviewed"),
                "review diffs — never rubber-stamp (anti-pattern: "
                "rubber-stamping diffs)")

    # ---- Section 2: hooks_and_events (skill building blocks:
    #      hooks as deterministic guardrails; events & payloads
    #      known so automation is precise) ----
    _bool_check(results, "hooks_and_events",
                "hooks_wired_as_deterministic_guardrails",
                manifest, ("hooks", "wired_as_guardrails"),
                "hooks are wired as deterministic guardrails — "
                "don't rely on the model's goodwill; wire the policy")
    _bool_check(results, "hooks_and_events",
                "hook_events_and_payloads_known",
                manifest, ("hooks", "events_and_payloads_known"),
                "events & payloads: what each hook/event carries is "
                "known, so the automation is precise, not guesswork")
    _bool_check(results, "hooks_and_events",
                "protected_path_edits_blocked_by_hooks",
                manifest, ("hooks", "protected_paths_blocked"),
                "hooks block edits to protected paths")
    _bool_check(results, "hooks_and_events",
                "formatters_auto_run_by_hooks",
                manifest, ("hooks", "formatters_auto_run"),
                "hooks auto-run formatters")
    _bool_check(results, "hooks_and_events", "secrets_denied_by_hooks",
                manifest, ("hooks", "secrets_denied"),
                "hooks deny secrets")

    # ---- Section 3: feedback_loop (skill disciplines: "Tight
    #      feedback in the loop: tests + linters wired into hooks
    #      so the agent gets automatic signal"; hooks bullet:
    #      "run tests after every edit"; anti-pattern: "no
    #      automated tests in the loop") ----
    _bool_check(results, "feedback_loop", "tests_run_after_every_edit",
                manifest, ("feedback", "tests_run_after_edit"),
                "hooks run tests after every edit")
    _bool_check(results, "feedback_loop", "tests_wired_into_hooks",
                manifest, ("feedback", "tests_wired_into_hooks"),
                "tight feedback: tests are wired into hooks so the "
                "agent gets automatic signal (anti-pattern: no "
                "automated tests in the loop)")
    _bool_check(results, "feedback_loop", "linters_wired_into_hooks",
                manifest, ("feedback", "linters_wired_into_hooks"),
                "tight feedback: linters are wired into hooks so "
                "the agent gets automatic signal")

    # ---- Section 4: guardrails (skill disciplines: guardrails —
    #      protected paths, no secrets, no Docker (house rule),
    #      staging-first; human-in-the-loop on irreversible
    #      actions; autonomous on safe, reversible ones;
    #      anti-pattern: letting the agent run unbounded) ----
    _bool_check(results, "guardrails", "protected_paths_declared",
                manifest, ("guardrails", "protected_paths_declared"),
                "guardrails: protected paths are declared")
    _bool_check(results, "guardrails", "secrets_not_used",
                manifest, ("guardrails", "no_secrets"),
                "guardrails: no secrets")
    _false_check(results, "guardrails", "docker_not_used",
                 manifest, ("guardrails", "docker_used"),
                 "guardrails: no Docker (house rule)")
    _bool_check(results, "guardrails", "staging_first",
                manifest, ("guardrails", "staging_first"),
                "guardrails: staging-first")
    _bool_check(results, "guardrails",
                "human_in_loop_on_irreversible_actions",
                manifest, ("guardrails", "human_in_loop_on_irreversible"),
                "human-in-the-loop on irreversible actions")
    _bool_check(results, "guardrails",
                "autonomous_only_on_safe_reversible_actions",
                manifest, ("guardrails", "autonomous_only_safe_reversible"),
                "autonomous only on safe, reversible actions")
    _false_check(results, "guardrails", "agent_run_not_unbounded",
                 manifest, ("guardrails", "agent_run_unbounded"),
                 "anti-pattern to refuse: letting the agent run "
                 "unbounded")

    # ---- Section 5: context_and_tools (skill disciplines:
    #      context hygiene; building blocks: MCP tools — prefer
    #      typed, narrowly-scoped tools over broad ones;
    #      anti-pattern: dumping whole repos into context) ----
    _bool_check(results, "context_and_tools",
                "context_limited_to_what_agent_needs",
                manifest, ("context", "only_what_agent_needs"),
                "context hygiene: give the agent only what it needs")
    _false_check(results, "context_and_tools", "whole_repo_not_dumped",
                 manifest, ("context", "whole_repo_dumped"),
                 "anti-pattern to refuse: dumping whole repos into "
                 "context")
    _bool_check(results, "context_and_tools",
                "files_pulled_into_workspace",
                manifest, ("context", "files_pulled_into_workspace"),
                "pull files into a workspace (the "
                "town-github-coding-workflow VFS pattern) rather "
                "than dumping the whole repo")
    _bool_check(results, "context_and_tools", "mcp_tools_typed",
                manifest, ("tools", "mcp_tools_typed"),
                "MCP tools: prefer typed tools over broad ones")
    _bool_check(results, "context_and_tools",
                "mcp_tools_narrowly_scoped",
                manifest, ("tools", "mcp_tools_narrowly_scoped"),
                "MCP tools: prefer narrowly-scoped tools over "
                "broad ones")

    # ---- Section 6: delegation_and_access (skill building
    #      blocks: sub-agents — delegate bounded tasks, keep each
    #      one's context narrow, orchestrate planner -> worker ->
    #      reviewer patterns; anti-pattern: agents with broad
    #      write access and zero guardrails) ----
    _bool_check(results, "delegation_and_access",
                "subagent_tasks_bounded",
                manifest, ("delegation", "subagent_tasks_bounded"),
                "sub-agents: delegate bounded tasks to focused agents")
    _bool_check(results, "delegation_and_access",
                "subagent_context_narrow",
                manifest, ("delegation", "subagent_context_narrow"),
                "sub-agents: keep each one's context narrow")
    _bool_check(results, "delegation_and_access",
                "planner_worker_reviewer_orchestration",
                manifest, ("delegation", "planner_worker_reviewer_pattern"),
                "sub-agents: orchestrate planner -> worker -> "
                "reviewer patterns")
    broad, has_broad = _get(manifest, "access", "broad_write_access")
    guardrails, has_guardrails = _get(manifest, "access",
                                      "guardrails_present")
    if has_broad and broad:
        _check(results, "delegation_and_access",
               "broad_write_access_has_guardrails",
               guardrails, has_guardrails, guardrails is True,
               "anti-pattern to refuse: agents with broad write "
               "access and zero guardrails — broad write access "
               "requires guardrails")
    else:
        _check(results, "delegation_and_access",
               "broad_write_access_has_guardrails",
               broad, has_broad, True,
               "no broad write access declared")

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
        verdict = "NOT_RELIABLE_PRACTICE"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "RELIABLE_PRACTICE"

    return {
        "service": "agentic-coding-practice",
        "atom_version": "0.1.0",
        "practice": manifest.get("practice"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "AGENTIC CODING PRACTICE VERDICT",
        f"practice: {verdict.get('practice')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: agentic_coding_practice.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "RELIABLE_PRACTICE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
