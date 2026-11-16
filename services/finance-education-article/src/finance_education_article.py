#!/usr/bin/env python3
"""Finance education article — deterministic core.

Built from the bound skill `finance-content` (v1): "Finance
education content, no signals (thinkwithfinance)" — education only,
in the Think With Finance voice.

The caller submits a finance-education article-production record
(a dict, or JSON on the CLI): the article's declared topic and
structure (concept explained, framework taught, worked example,
what-to-watch close, in the skill's order), the worked example's
declared arithmetic steps, the no-signals record, the disclosure
record, and the review declarations.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Distinct ground: the live sibling `finance-content-compliance-check`
audits the COMPLIANCE posture of finance content (advice-vs-licensing
boundary, risk framing, calculators, commercial honesty, corrections,
privacy). This atom audits the ARTICLE-PRODUCTION record under its
own skill: does the declared record show an article built the way
the skill prescribes — structure in order, mechanics shown in a
worked example whose arithmetic re-derives, no buy/sell signals or
trade execution, disclosures of assumptions / data dates / limits,
and the education-only review declarations. Its check set does not
duplicate the sibling's.

Computed, not declared: the section-order check (the declared order
must equal the skill's structure: concept, worked example,
what-to-watch) and the worked-example arithmetic (every complete
step is re-derived from its declared operands and operation and
compared with its declared result at 6-decimal formatting). No
threshold, length, freshness window or readability score is invented
here — the skill states none (see SERVICE.md, declined thresholds).
Judgment-shaped parts (writing quality, clarity, pedagogy, voice
fidelity, whether prose implies a trade) are caller declarations
only, never judged; the atom never reads the article's prose.

Verdict:
- any fail             -> NOT_ARTICLE_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> ARTICLE_READY

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "article_structure",
    "worked_example",
    "no_signals",
    "disclosures",
    "review",
)

EXPECTED_SECTION_ORDER = ["concept", "worked_example", "what_to_watch"]
OPERATIONS = ("add", "subtract", "multiply", "divide")


class ManifestTypeError(TypeError, ValueError):
    """A documented field present with the wrong JSON type.

    Subclasses both TypeError (this atom's contract) and ValueError
    (the fleet F1 convention the gateway maps to HTTP 422), so
    callers catching either see the rejection.
    """


# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ManifestTypeError,
# raised before evaluation), never evidence: F1 remedy, external
# verification Wave 1. Absent fields are not validated — absence
# is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "article": "string",
    "topic": "string",
    "structure": {
        "concept_explained": "boolean",
        "framework_taught_not_answer": "boolean",
        "what_to_watch_close_present": "boolean",
        "section_order": ["string"],
    },
    "worked_example": {
        "present": "boolean",
        "steps": [{
            "operation": "string",
            "operands": ["number"],
            "declared_result": "number",
        }],
    },
    "signals": {
        "buy_sell_signals_present": "boolean",
        "implied_trade_present": "boolean",
        "trade_execution_present": "boolean",
    },
    "disclosure": {
        "uses_data_or_assumptions": "boolean",
        "assumptions_stated": "boolean",
        "data_dates_stated": "boolean",
        "limits_stated": "boolean",
        "data_as_of": "string",
    },
    "review": {
        "education_only_review_passed": "boolean",
        "think_with_finance_voice_confirmed": "boolean",
        "plain_language_review_passed": "boolean",
        "no_hype_confirmed": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ManifestTypeError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ManifestTypeError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ManifestTypeError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ManifestTypeError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ManifestTypeError(f"{path} must be an object")
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


def _is_nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _gated_bool_check(results, section, name, manifest, gate_path,
                      path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    value, present = _get(manifest, *path)
    if has_gate and gate:
        _check(results, section, name, value, present, value is True,
               evidence)
    else:
        _check(results, section, name, gate, has_gate, True, na_evidence)


def _gated_string_check(results, section, name, manifest, gate_path,
                        path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    value, present = _get(manifest, *path)
    if has_gate and gate:
        _check(results, section, name, value, present,
               _is_nonempty_str(value), evidence)
    else:
        _check(results, section, name, gate, has_gate, True, na_evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _compute_step(operation, operands):
    if operation == "add":
        result = 0
        for operand in operands:
            result = result + operand
        return result
    if operation == "multiply":
        result = 1
        for operand in operands:
            result = result * operand
        return result
    if operation == "subtract":
        result = operands[0]
        for operand in operands[1:]:
            result = result - operand
        return result
    # divide
    result = operands[0]
    for operand in operands[1:]:
        result = result / operand
    return result


def _worked_example_checks(results, manifest):
    """Computed checks over the declared worked-example steps.

    Returns (steps_evaluated, steps_incomplete): counts of steps
    complete enough to re-derive, and of steps missing a usable
    operation, operands, or declared result.
    """
    steps, has_steps = _get(manifest, "worked_example", "steps")
    if not has_steps or not isinstance(steps, list) or not steps:
        _check(results, "worked_example", "worked_example_steps_complete",
               steps, False, False, "no worked-example steps declared")
        _check(results, "worked_example",
               "worked_example_arithmetic_correct",
               steps, False, False, "no worked-example steps declared")
        return 0, 0
    incomplete = 0
    evaluated = 0
    arithmetic_wrong = False
    for step in steps:
        if not isinstance(step, dict):
            incomplete += 1
            continue
        operation, has_operation = _get(step, "operation")
        operands, has_operands = _get(step, "operands")
        declared, has_declared = _get(step, "declared_result")
        if not (has_operation and has_operands and has_declared
                and operation in OPERATIONS
                and isinstance(operands, list) and len(operands) > 0
                and (operation not in ("subtract", "divide")
                     or len(operands) >= 2)
                and (operation != "divide"
                     or all(o != 0 for o in operands[1:]))):
            incomplete += 1
            continue
        evaluated += 1
        if _fmt6(_compute_step(operation, operands)) != _fmt6(declared):
            arithmetic_wrong = True
    if incomplete:
        _check(results, "worked_example", "worked_example_steps_complete",
               steps, False, False,
               "a worked-example step is missing its operation, "
               "operands, or declared result, or cannot be re-derived "
               "(unknown operation or division by zero)")
        _check(results, "worked_example",
               "worked_example_arithmetic_correct",
               steps, False, False,
               "a worked-example step is incomplete, so its arithmetic "
               "cannot be verified")
    else:
        _check(results, "worked_example", "worked_example_steps_complete",
               steps, True, True,
               "every worked-example step declares an operation, "
               "operands, and a declared result")
        _check(results, "worked_example",
               "worked_example_arithmetic_correct",
               steps, True, not arithmetic_wrong,
               "every worked-example step re-derives to its declared "
               "result at 6-decimal formatting (skill: show the "
               "mechanics with a worked example)")
    return evaluated, incomplete


def evaluate(manifest):
    """Return the verdict dict for a finance-education article record."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: article_structure (skill Structure: explain the
    #      concept, show the mechanics with a worked example, close
    #      with what to watch; teach the framework, not the answer) ----
    topic, has_topic = _get(manifest, "topic")
    _check(results, "article_structure", "topic_stated",
           topic, has_topic, _is_nonempty_str(topic),
           "the article's concept/topic is stated (skill example: "
           "explain what a yield curve is)")
    _bool_check(results, "article_structure", "concept_explained",
                manifest, ("structure", "concept_explained"),
                "structure: the concept is explained")
    _bool_check(results, "article_structure",
                "framework_taught_not_answer", manifest,
                ("structure", "framework_taught_not_answer"),
                "teach the framework (how to think), not the answer "
                "(what to do)")
    _bool_check(results, "article_structure",
                "what_to_watch_close_present", manifest,
                ("structure", "what_to_watch_close_present"),
                "structure: the article closes with what to watch")
    order, has_order = _get(manifest, "structure", "section_order")
    _check(results, "article_structure", "section_order_matches_skill",
           order, has_order, order == EXPECTED_SECTION_ORDER,
           "declared section order is concept, worked_example, "
           "what_to_watch — the skill's structure, in order")

    # ---- Section 2: worked_example (skill Structure: show the
    #      mechanics with a worked example; arithmetic computed) ----
    _bool_check(results, "worked_example", "worked_example_present",
                manifest, ("worked_example", "present"),
                "structure: the mechanics are shown with a worked "
                "example")
    steps_evaluated, steps_incomplete = _worked_example_checks(
        results, manifest)

    # ---- Section 3: no_signals (skill hard rules: no buy/sell
    #      signals, never imply a trade, no trade execution) ----
    _false_check(results, "no_signals", "no_buy_sell_signals", manifest,
                 ("signals", "buy_sell_signals_present"),
                 "hard rule: no buy/sell signals — never imply a "
                 "trade; no 'buy', 'sell', 'overweight' as instructions")
    _false_check(results, "no_signals", "no_implied_trade", manifest,
                 ("signals", "implied_trade_present"),
                 "hard rule: never imply a trade")
    _false_check(results, "no_signals", "no_trade_execution", manifest,
                 ("signals", "trade_execution_present"),
                 "hard rule: no trade execution — analysis and "
                 "frameworks only")

    # ---- Section 4: disclosures (skill hard rule: disclosures where
    #      relevant — state assumptions, data dates, limits; every
    #      check gated on the article using data or assumptions) ----
    _gated_bool_check(
        results, "disclosures", "assumptions_stated", manifest,
        ("disclosure", "uses_data_or_assumptions"),
        ("disclosure", "assumptions_stated"),
        "disclosures: assumptions stated where relevant",
        "article declares no data or assumptions — disclosure not "
        "applicable")
    _gated_bool_check(
        results, "disclosures", "data_dates_stated", manifest,
        ("disclosure", "uses_data_or_assumptions"),
        ("disclosure", "data_dates_stated"),
        "disclosures: data dates stated where relevant",
        "article declares no data or assumptions — disclosure not "
        "applicable")
    _gated_bool_check(
        results, "disclosures", "limits_stated", manifest,
        ("disclosure", "uses_data_or_assumptions"),
        ("disclosure", "limits_stated"),
        "disclosures: limits stated where relevant",
        "article declares no data or assumptions — disclosure not "
        "applicable")
    _gated_string_check(
        results, "disclosures", "data_as_of_stated", manifest,
        ("disclosure", "uses_data_or_assumptions"),
        ("disclosure", "data_as_of"),
        "disclosures: the article's data as-of date is stated",
        "article declares no data or assumptions — disclosure not "
        "applicable")

    # ---- Section 5: review (skill: education only, Think With
    #      Finance voice, explained simply, no hype — all carried
    #      as reviewer declarations, never judged by the atom) ----
    _bool_check(results, "review", "education_only_review_passed",
                manifest, ("review", "education_only_review_passed"),
                "review declaration: the piece is education only — "
                "the reader should understand more, not act more")
    _bool_check(results, "review", "think_with_finance_voice_confirmed",
                manifest,
                ("review", "think_with_finance_voice_confirmed"),
                "review declaration: the piece is in the Think With "
                "Finance voice")
    _bool_check(results, "review", "plain_language_review_passed",
                manifest, ("review", "plain_language_review_passed"),
                "review declaration: concepts and analysis are "
                "explained simply")
    _bool_check(results, "review", "no_hype_confirmed",
                manifest, ("review", "no_hype_confirmed"),
                "review declaration: no hype")

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
        verdict = "NOT_ARTICLE_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "ARTICLE_READY"

    return {
        "service": "finance-education-article",
        "atom_version": "0.1.0",
        "article": manifest.get("article"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "steps_evaluated": steps_evaluated,
        "steps_incomplete": steps_incomplete,
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
        "FINANCE EDUCATION ARTICLE",
        f"article: {verdict.get('article')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<26} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: finance_education_article.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "ARTICLE_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
