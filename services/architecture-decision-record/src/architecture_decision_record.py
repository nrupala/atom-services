#!/usr/bin/env python3
"""Architecture decision record — deterministic core.

Built from the bound skill `architecture-decisions` (v1): "Design
before build: boundaries, interfaces, and the reasoning trail.
Decisions live in ADRs — written once, superseded (never silently
rewritten)." This atom is an AUDIT of a declared ADR pack: it
validates the record a caller declares against the skill's method
steps, its four quality gates, and its two red lines. It does not
write the ADR, choose the technology, or judge whether the decision
itself is wise — it checks that the record the skill requires is
present and internally complete on the declared evidence.

The caller submits an ADR manifest (a dict, or JSON on the CLI).
Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Two checks are computed, not merely declared, and use ONLY the
values the skill itself states — no outside threshold is imported:

- the alternatives list must hold 2-3 real alternatives (skill
  method step 4: "list 2-3 real alternatives with trade-offs";
  quality gate: "at least one serious alternative considered per
  major decision" — computed here as a count in the stated range,
  every listed alternative carrying stated trade-offs, and at
  least one alternative flagged serious);
- the ADR must be one page max (skill method step 5: "ADR format:
  Context -> Decision -> Consequences (positive/negative/risks)
  -> Status. One page max") — a declared page count at or below 1
  passes, above 1 fails; equality passes, because the skill states
  a maximum, not a margin below it.

The computed outcome is also reported as `computed_status`:
"outside_stated_limits_on_declared_evidence" when either computed
check fails, "within_stated_limits_on_declared_evidence" when both
computed checks pass, otherwise null. The declared page count's
excess over the stated one-page maximum is reported as
`page_count_over_limit`, a string with exactly four decimal
places produced in both implementations by the same fixed rule:
round half up to 4dp — floor(v * 10000 + 0.5) / 10000 — then format
with exactly four decimals. Comparisons use the unrounded values.
That fixed serialization is what makes the Python and TypeScript
outputs byte-identical. The number of declared alternatives is
reported as `alternatives_count` (null when no list is declared).

Verdict:
- any fail             -> ADR_NOT_COMPLETE
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> ADR_COMPLETE

This is a completeness audit over declared evidence, not an
architecture review: a record that declares every field passes
even if the underlying decision is poor, and nothing here verifies
that a declared value is true.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "nfrs_first",
    "boundaries_and_contracts",
    "options_and_tradeoffs",
    "adr_format",
    "reversibility_and_security",
    "lifecycle_and_dependencies",
)

STATED_MIN_ALTERNATIVES = 2
STATED_MAX_ALTERNATIVES = 3
STATED_MAX_PAGES = 1

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "decision": "string",
    "nfrs": {
        "written": "boolean",
        "quantified_where_possible": "boolean",
        "agreed_before_design_freeze": "boolean",
    },
    "boundaries": {
        "contexts_drawn": "boolean",
        "core_kept_small": "boolean",
        "hidden_coupling_present": "boolean",
        "backdoor_paths_present": "boolean",
    },
    "contracts": {
        "interfaces_documented": "boolean",
        "interfaces_versioned": "boolean",
        "inputs_outputs_defined": "boolean",
        "errors_defined": "boolean",
        "defined_before_code": "boolean",
    },
    "options": {
        "alternatives": [{
            "name": "string",
            "serious": "boolean",
            "tradeoffs_stated": "boolean",
        }],
        "prefers_boring_replaceable_tech": "boolean",
    },
    "adr": {
        "numbered": "boolean",
        "context_stated": "boolean",
        "decision_stated": "boolean",
        "consequences_positive_stated": "boolean",
        "consequences_negative_stated": "boolean",
        "consequences_risks_stated": "boolean",
        "status_stated": "boolean",
        "page_count": "number",
    },
    "reversibility": {
        "assessed": "boolean",
        "expensive_choices_isolated_behind_interfaces": "boolean",
        "irreversible_decisions_deferred": "boolean",
    },
    "security": {
        "data_flows_mapped": "boolean",
        "encryption_verification_addressed": "boolean",
    },
    "dependencies": {
        "new_dependency_introduced": "boolean",
        "new_dependency_reason_stated": "boolean",
    },
    "supersession": {
        "has_superseded_adrs": "boolean",
        "superseded_adrs_linked_to_replacements": "boolean",
        "superseded_silently_rewritten": "boolean",
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def evaluate(manifest):
    """Return the verdict dict for an architecture-decision manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: nfrs_first (skill method step 1: "NFRs first:
    #      performance, scale, availability, security, cost —
    #      quantified where possible"; quality gate: "NFRs written
    #      and agreed before design freeze") ----
    _bool_check(results, "nfrs_first", "nfrs_written",
                manifest, ("nfrs", "written"),
                "NFRs first: non-functional requirements (performance, "
                "scale, availability, security, cost) are written "
                "before the design")
    _bool_check(results, "nfrs_first", "nfrs_quantified_where_possible",
                manifest, ("nfrs", "quantified_where_possible"),
                "NFRs are quantified where possible, per the skill's "
                "method step 1")
    _bool_check(results, "nfrs_first",
                "nfrs_agreed_before_design_freeze", manifest,
                ("nfrs", "agreed_before_design_freeze"),
                "quality gate: NFRs written and agreed before design "
                "freeze")

    # ---- Section 2: boundaries_and_contracts (skill method steps
    #      2-3: boundaries drawn, core kept small, clear interfaces
    #      at the seams; contracts before code — inputs, outputs,
    #      errors, versioned; quality gate: "Interfaces documented
    #      and versioned"; red line: "No hidden coupling across
    #      boundaries; no backdoor paths around the contracts") ----
    _bool_check(results, "boundaries_and_contracts", "boundaries_drawn",
                manifest, ("boundaries", "contexts_drawn"),
                "boundaries: contexts/modules are drawn before the "
                "build")
    _bool_check(results, "boundaries_and_contracts", "core_kept_small",
                manifest, ("boundaries", "core_kept_small"),
                "boundaries: the core is kept small, with clear "
                "interfaces at the seams")
    _bool_check(results, "boundaries_and_contracts",
                "interfaces_documented", manifest,
                ("contracts", "interfaces_documented"),
                "quality gate: interfaces are documented")
    _bool_check(results, "boundaries_and_contracts",
                "interfaces_versioned", manifest,
                ("contracts", "interfaces_versioned"),
                "quality gate: interfaces are versioned — contracts "
                "are defined and versioned before code")
    _bool_check(results, "boundaries_and_contracts",
                "contract_inputs_outputs_defined", manifest,
                ("contracts", "inputs_outputs_defined"),
                "contracts before code: API/module contracts define "
                "inputs and outputs")
    _bool_check(results, "boundaries_and_contracts",
                "contract_errors_defined", manifest,
                ("contracts", "errors_defined"),
                "contracts before code: API/module contracts define "
                "errors")
    _bool_check(results, "boundaries_and_contracts",
                "contracts_defined_before_code", manifest,
                ("contracts", "defined_before_code"),
                "contracts before code: the contracts are defined "
                "before the code that implements them")
    _false_check(results, "boundaries_and_contracts",
                 "no_hidden_coupling_across_boundaries", manifest,
                 ("boundaries", "hidden_coupling_present"),
                 "red line: no hidden coupling across boundaries")
    _false_check(results, "boundaries_and_contracts",
                 "no_backdoor_paths_around_contracts", manifest,
                 ("boundaries", "backdoor_paths_present"),
                 "red line: no backdoor paths around the contracts")

    # ---- Section 3: options_and_tradeoffs (skill method step 4:
    #      "list 2-3 real alternatives with trade-offs; prefer
    #      boring, replaceable tech; no new dependency without a
    #      reason"; quality gate: "At least one serious alternative
    #      considered per major decision") ----
    alts, has_alts = _get(manifest, "options", "alternatives")
    alts_is_list = has_alts and isinstance(alts, list)
    alt_count = len(alts) if alts_is_list else None
    count_ok = (alts_is_list
                and STATED_MIN_ALTERNATIVES <= len(alts)
                <= STATED_MAX_ALTERNATIVES)
    _check(results, "options_and_tradeoffs",
           "alternatives_count_in_stated_range", alt_count,
           alts_is_list, count_ok,
           "options: list 2-3 real alternatives — the declared "
           "alternatives list holds between two and three entries")
    tradeoffs_ok = (alts_is_list and len(alts) > 0 and all(
        isinstance(a, dict) and a.get("tradeoffs_stated") is True
        for a in alts))
    _check(results, "options_and_tradeoffs",
           "all_alternatives_tradeoffs_stated", alts, alts_is_list,
           tradeoffs_ok,
           "options: each listed alternative carries its trade-offs "
           "(honest trade-offs, stated per alternative)")
    serious_ok = (alts_is_list and any(
        isinstance(a, dict) and a.get("serious") is True for a in alts))
    _check(results, "options_and_tradeoffs",
           "at_least_one_serious_alternative", alts, alts_is_list,
           serious_ok,
           "quality gate: at least one serious alternative "
           "considered per major decision")
    _bool_check(results, "options_and_tradeoffs",
                "boring_replaceable_tech_preferred", manifest,
                ("options", "prefers_boring_replaceable_tech"),
                "options: prefer boring, replaceable tech")

    # ---- Section 4: adr_format (skill method step 5: "ADR format:
    #      Context -> Decision -> Consequences
    #      (positive/negative/risks) -> Status. One page max";
    #      artifacts: "docs/adr/NNNN-title.md (numbered)") ----
    _bool_check(results, "adr_format", "adr_numbered",
                manifest, ("adr", "numbered"),
                "artifacts: the ADR is numbered (docs/adr/NNNN-title)")
    _bool_check(results, "adr_format", "context_stated",
                manifest, ("adr", "context_stated"),
                "ADR format: Context is stated")
    _bool_check(results, "adr_format", "decision_stated",
                manifest, ("adr", "decision_stated"),
                "ADR format: Decision is stated")
    _bool_check(results, "adr_format", "consequences_positive_stated",
                manifest, ("adr", "consequences_positive_stated"),
                "ADR format: Consequences state the positives")
    _bool_check(results, "adr_format", "consequences_negative_stated",
                manifest, ("adr", "consequences_negative_stated"),
                "ADR format: Consequences state the negatives")
    _bool_check(results, "adr_format", "consequences_risks_stated",
                manifest, ("adr", "consequences_risks_stated"),
                "ADR format: Consequences state the risks")
    _bool_check(results, "adr_format", "status_stated",
                manifest, ("adr", "status_stated"),
                "ADR format: Status is stated")
    pages, has_pages = _get(manifest, "adr", "page_count")
    pages_is_number = has_pages and _is_number(pages)
    pages_ok = pages_is_number and pages <= STATED_MAX_PAGES
    _check(results, "adr_format", "adr_within_one_page_max", pages,
           pages_is_number, pages_ok,
           "ADR format: one page max — the declared page count is "
           "at or below one page")
    page_over = (pages - STATED_MAX_PAGES if pages_is_number else None)

    # ---- Section 5: reversibility_and_security (skill method
    #      steps 6-7: "prefer choices that are cheap to undo;
    #      isolate the expensive ones behind interfaces"; "Security
    #      by design: map data flows; encrypt/verify"; red line:
    #      "No 'we'll figure it out later' for irreversible
    #      decisions") ----
    _bool_check(results, "reversibility_and_security",
                "reversibility_assessed", manifest,
                ("reversibility", "assessed"),
                "reversibility: the decision's reversibility is "
                "assessed — choices that are cheap to undo are "
                "preferred")
    _bool_check(results, "reversibility_and_security",
                "expensive_choices_isolated_behind_interfaces",
                manifest,
                ("reversibility",
                 "expensive_choices_isolated_behind_interfaces"),
                "reversibility: expensive-to-reverse choices are "
                "isolated behind interfaces")
    _false_check(results, "reversibility_and_security",
                 "irreversible_decisions_not_deferred", manifest,
                 ("reversibility", "irreversible_decisions_deferred"),
                 "red line: no 'we'll figure it out later' for "
                 "irreversible decisions")
    _bool_check(results, "reversibility_and_security",
                "data_flows_mapped", manifest,
                ("security", "data_flows_mapped"),
                "security by design: data flows are mapped")
    _bool_check(results, "reversibility_and_security",
                "encryption_and_verification_addressed", manifest,
                ("security", "encryption_verification_addressed"),
                "security by design: encryption/verification is "
                "addressed per the secure-build pattern")

    # ---- Section 6: lifecycle_and_dependencies (skill method
    #      step 4: "no new dependency without a reason"; preamble:
    #      ADRs are "superseded (never silently rewritten)";
    #      quality gate: "Superseded ADRs link to their
    #      replacements") ----
    introduced, has_introduced = _get(
        manifest, "dependencies", "new_dependency_introduced")
    reason, has_reason = _get(
        manifest, "dependencies", "new_dependency_reason_stated")
    if has_introduced and introduced:
        _check(results, "lifecycle_and_dependencies",
               "new_dependency_reason_stated_when_introduced",
               reason, has_reason, reason is True,
               "options: no new dependency without a reason — a "
               "reason is stated for the introduced dependency")
    else:
        _check(results, "lifecycle_and_dependencies",
               "new_dependency_reason_stated_when_introduced",
               introduced, has_introduced, True,
               "no new dependency introduced")
    superseded, has_superseded = _get(
        manifest, "supersession", "has_superseded_adrs")
    linked, has_linked = _get(
        manifest, "supersession",
        "superseded_adrs_linked_to_replacements")
    if has_superseded and superseded:
        _check(results, "lifecycle_and_dependencies",
               "superseded_adrs_link_to_replacements",
               linked, has_linked, linked is True,
               "quality gate: superseded ADRs link to their "
               "replacements")
    else:
        _check(results, "lifecycle_and_dependencies",
               "superseded_adrs_link_to_replacements",
               superseded, has_superseded, True,
               "no superseded ADRs declared")
    _false_check(results, "lifecycle_and_dependencies",
                 "superseded_adrs_not_silently_rewritten", manifest,
                 ("supersession", "superseded_silently_rewritten"),
                 "decisions live in ADRs — written once, superseded, "
                 "never silently rewritten")

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
        verdict = "ADR_NOT_COMPLETE"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "ADR_COMPLETE"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("alternatives_count_in_stated_range",
                          "adr_within_one_page_max")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "architecture-decision-record",
        "atom_version": "0.1.0",
        "decision": manifest.get("decision"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "alternatives_count": alt_count,
        "page_count_over_limit": _fmt4(page_over),
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
        "ARCHITECTURE DECISION RECORD",
        f"decision: {verdict.get('decision')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: architecture_decision_record.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "ADR_COMPLETE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
