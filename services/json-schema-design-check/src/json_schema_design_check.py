#!/usr/bin/env python3
"""Json schema design check — deterministic core.

Built from the bound skill `json-data-interchange`: "Use JSON
safely and predictably — schemas, canonical forms, versioning,
parse limits, big-number care."

This atom is an AUDIT of a declared JSON schema-design record:
it validates the record a caller declares against the skill's
sections — schema-first design, strict writer / tolerant reader,
canonical form and number care, versioning, parsing safety, and
streaming / ops / red lines. It does not design a schema, parse
a live payload, validate a real document against a real schema,
or verify that a declared control actually works — it checks
that the record the skill requires is present and internally
complete and consistent on the declared evidence.

The caller submits a JSON schema-design manifest (a dict, or
JSON on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- payloads: the declared `payloads` list must be non-empty, and
  every declared payload row must show a schema and a sample
  (the skill: "Every external payload has a schema + sample"),
  a version field ("a version field on everything persisted or
  sent"), money / big-integer fields as strings ("money/big
  integers as strings"; "No float usage for money or >2^53
  integers"), and — for every row declared hashed or signed —
  canonical rules documented ("Canonicalization documented
  wherever hashes/signatures cover JSON").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states exactly one number — 2^53, the integer bound
beyond which integers are carried as strings — and it is used
only as the skill states it, in the wording of that check. The
skill states no other numeric threshold — no parse size limit
in bytes, no depth limit, no coverage percentage — so no other
numeric threshold check is invented; those quantities are
caller attestations at most, and quantities here are computed
and reported, with completeness (every declared payload) as
the only bar, exactly as stated above.

Verdict:
- any fail             -> JSON_SCHEMA_DESIGN_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> JSON_SCHEMA_DESIGN_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "schema_first_and_boundary",
    "canonical_form_and_number_care",
    "versioning",
    "parsing_safety_and_encoding",
    "streaming_ops_and_red_lines",
)

MANIFEST_SPEC = {
    "artifact": "string",
    "schema": {
        "schema_for_every_external_payload": "boolean",
        "validated_at_boundary": "boolean",
    },
    "writer_reader": {
        "strict_writer_emits_exactly_schema": "boolean",
        "tolerant_reader_accepts_documented_variations": "boolean",
        "undocumented_variations_rejected_loudly": "boolean",
    },
    "payloads": [{
        "name": "string",
        "has_schema": "boolean",
        "has_sample": "boolean",
        "has_version_field": "boolean",
        "money_and_bigint_fields_as_strings": "boolean",
        "is_hashed_or_signed": "boolean",
        "canonical_rules_documented": "boolean",
    }],
    "canonical": {
        "fixed_key_ordering_documented": "boolean",
        "number_formatting_documented": "boolean",
        "hashes_or_signatures_cover_json": "boolean",
        "canonical_rules_documented": "boolean",
        "money_as_strings": "boolean",
        "big_integers_as_strings": "boolean",
        "float_usage_for_money_or_big_integers_present": "boolean",
    },
    "versioning": {
        "version_field_on_everything_persisted_or_sent": "boolean",
        "additive_changes_by_default": "boolean",
        "breaking_changes_require_new_version": "boolean",
    },
    "parsing": {
        "size_limits_on_untrusted_input": "boolean",
        "depth_limits_on_untrusted_input": "boolean",
        "eval_used_present": "boolean",
        "duplicate_keys_handled_deliberately": "boolean",
        "utf8_only_and_escapes_normalized": "boolean",
        "parse_errors_explicit_not_silent_defaults": "boolean",
    },
    "streaming_ops": {
        "ndjson_for_logs_and_events": "boolean",
        "streaming_parsers_for_large_files": "boolean",
        "compact_for_machine_storage_pretty_for_humans": "boolean",
        "inspection_and_diffs_in_reviews": "boolean",
        "sample_fixtures_kept_per_schema": "boolean",
    },
    "red_lines": {
        "unbounded_parsing_of_untrusted_input_present": "boolean",
        "unvalidated_config_edits_without_ci_schema_validation_present": "boolean",
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


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


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
    """Return the verdict dict for a JSON schema-design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    payloads, has_payloads = _get(manifest, "payloads")
    payloads_is_list = has_payloads and isinstance(payloads, list)
    payloads_count = len(payloads) if payloads_is_list else None
    rows = payloads if payloads_is_list else []

    payloads_without_schema_or_sample = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and (("has_schema" in c
               and c.get("has_schema") is not True)
              or ("has_sample" in c
                  and c.get("has_sample") is not True))]
        if payloads_is_list else None
    )
    payloads_without_version_field = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "has_version_field" in c
         and c.get("has_version_field") is not True]
        if payloads_is_list else None
    )
    payloads_without_money_bigint_as_strings = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "money_and_bigint_fields_as_strings" in c
         and c.get("money_and_bigint_fields_as_strings") is not True]
        if payloads_is_list else None
    )
    hashed_rows = [
        c for c in rows
        if isinstance(c, dict) and c.get("is_hashed_or_signed") is True
    ]
    hashed_payloads_without_canonical_rules = (
        [_row_name(c) for c in hashed_rows
         if "canonical_rules_documented" in c
         and c.get("canonical_rules_documented") is not True]
        if payloads_is_list else None
    )
    schema_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("has_schema") is True)
        / payloads_count
        if payloads_is_list and payloads_count > 0 else None
    )
    version_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("has_version_field") is True)
        / payloads_count
        if payloads_is_list and payloads_count > 0 else None
    )
    money_bigint_string_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("money_and_bigint_fields_as_strings") is True)
        / payloads_count
        if payloads_is_list and payloads_count > 0 else None
    )
    canonical_coverage = (
        sum(1 for c in hashed_rows
            if c.get("canonical_rules_documented") is True)
        / len(hashed_rows)
        if payloads_is_list and len(hashed_rows) > 0 else None
    )

    # ---- Section 1: schema_first_and_boundary (skill: method
    #      1-2 and quality gate — schema-first for every external
    #      payload, validate at the boundary, strict writer /
    #      tolerant reader, reject the rest loudly; every
    #      external payload has a schema + sample) ----
    _bool_check(results, "schema_first_and_boundary",
                "schema_for_every_external_payload", manifest,
                ("schema", "schema_for_every_external_payload"),
                "schema-first: a JSON Schema (or typed schema) is "
                "declared for every external payload")
    _bool_check(results, "schema_first_and_boundary",
                "validated_at_boundary", manifest,
                ("schema", "validated_at_boundary"),
                "schema-first: payloads are validated at the "
                "boundary")
    _bool_check(results, "schema_first_and_boundary",
                "strict_writer_emits_exactly_schema", manifest,
                ("writer_reader", "strict_writer_emits_exactly_schema"),
                "strict writer / tolerant reader: the writer emits "
                "exactly its schema")
    _bool_check(results, "schema_first_and_boundary",
                "tolerant_reader_accepts_documented_variations",
                manifest,
                ("writer_reader",
                 "tolerant_reader_accepts_documented_variations"),
                "strict writer / tolerant reader: the reader "
                "accepts documented variations")
    _bool_check(results, "schema_first_and_boundary",
                "undocumented_variations_rejected_loudly", manifest,
                ("writer_reader",
                 "undocumented_variations_rejected_loudly"),
                "strict writer / tolerant reader: the rest is "
                "rejected loudly")
    _check(results, "schema_first_and_boundary",
           "payloads_declared", payloads, payloads_is_list,
           payloads_is_list and payloads_count > 0,
           "the declared record names its payloads — the "
           "payloads list is present and non-empty")
    schema_sample_present = (
        payloads_is_list
        and all(isinstance(c, dict) and "has_schema" in c
                and "has_sample" in c for c in rows)
    )
    _check(results, "schema_first_and_boundary",
           "every_payload_has_schema_and_sample", payloads,
           schema_sample_present,
           payloads_is_list and payloads_count > 0
           and all(isinstance(c, dict)
                   and c.get("has_schema") is True
                   and c.get("has_sample") is True
                   for c in rows),
           "quality gate: every declared payload row has a "
           "schema and a sample")

    # ---- Section 2: canonical_form_and_number_care (skill:
    #      method 3 and quality gate — canonical form when
    #      hashing/signing: fixed key ordering + number
    #      formatting, canonical rules documented next to the
    #      schema; floats are IEEE-754 — money/big integers as
    #      strings; no float usage for money or >2^53 integers) ----
    _bool_check(results, "canonical_form_and_number_care",
                "fixed_key_ordering_documented", manifest,
                ("canonical", "fixed_key_ordering_documented"),
                "canonical form: fixed key ordering is documented")
    _bool_check(results, "canonical_form_and_number_care",
                "number_formatting_documented", manifest,
                ("canonical", "number_formatting_documented"),
                "canonical form: number formatting is documented "
                "— floats are IEEE-754")
    _gated_bool_check(
        results, "canonical_form_and_number_care",
        "canonical_rules_documented_when_hashing_or_signing",
        manifest,
        ("canonical", "hashes_or_signatures_cover_json"),
        ("canonical", "canonical_rules_documented"),
        "canonical form: the canonical rules are documented "
        "next to the schema when hashes or signatures cover JSON",
        "no hashes or signatures cover JSON declared")
    _bool_check(results, "canonical_form_and_number_care",
                "money_as_strings", manifest,
                ("canonical", "money_as_strings"),
                "number care: money is carried as strings")
    _bool_check(results, "canonical_form_and_number_care",
                "big_integers_as_strings", manifest,
                ("canonical", "big_integers_as_strings"),
                "number care: big integers are carried as strings")
    _false_check(results, "canonical_form_and_number_care",
                 "no_float_for_money_or_big_integers", manifest,
                 ("canonical",
                  "float_usage_for_money_or_big_integers_present"),
                 "quality gate: no float usage for money or "
                 ">2^53 integers is present")
    hashed_gate_present = (
        payloads_is_list
        and all(isinstance(c, dict) and "is_hashed_or_signed" in c
                for c in rows)
    )
    hashed_present = (
        payloads_is_list and hashed_gate_present
        and all("canonical_rules_documented" in c
                for c in hashed_rows)
    )
    _check(results, "canonical_form_and_number_care",
           "every_hashed_or_signed_payload_canonical_documented",
           payloads, hashed_present,
           payloads_is_list
           and all(c.get("canonical_rules_documented") is True
                   for c in hashed_rows),
           "canonical form: every payload row declared hashed "
           "or signed declares its canonical rules documented")
    money_present = (
        payloads_is_list
        and all(isinstance(c, dict)
                and "money_and_bigint_fields_as_strings" in c
                for c in rows)
    )
    _check(results, "canonical_form_and_number_care",
           "every_payload_money_and_bigint_fields_as_strings",
           payloads, money_present,
           payloads_is_list and payloads_count > 0
           and all(isinstance(c, dict)
                   and c.get("money_and_bigint_fields_as_strings")
                   is True for c in rows),
           "number care: every declared payload row declares "
           "its money and big-integer fields as strings")

    # ---- Section 3: versioning (skill: method 4 — a version
    #      field on everything persisted or sent; additive
    #      changes by default; breaking changes = new version) ----
    _bool_check(results, "versioning",
                "version_field_on_everything_persisted_or_sent",
                manifest,
                ("versioning",
                 "version_field_on_everything_persisted_or_sent"),
                "versioning: a version field is carried on "
                "everything persisted or sent")
    _bool_check(results, "versioning",
                "additive_changes_by_default", manifest,
                ("versioning", "additive_changes_by_default"),
                "versioning: changes are additive by default")
    _bool_check(results, "versioning",
                "breaking_changes_require_new_version", manifest,
                ("versioning", "breaking_changes_require_new_version"),
                "versioning: breaking changes require a new "
                "version")
    version_present = (
        payloads_is_list
        and all(isinstance(c, dict) and "has_version_field" in c
                for c in rows)
    )
    _check(results, "versioning",
           "every_payload_has_version_field", payloads,
           version_present,
           payloads_is_list and payloads_count > 0
           and all(isinstance(c, dict)
                   and c.get("has_version_field") is True
                   for c in rows),
           "versioning: every declared payload row carries a "
           "version field")

    # ---- Section 4: parsing_safety_and_encoding (skill: method
    #      5 and quality gate — size + depth limits on untrusted
    #      input; no eval; duplicate keys handled deliberately;
    #      UTF-8 only, escapes normalized; parse errors on bad
    #      input are explicit, not silent defaults) ----
    _bool_check(results, "parsing_safety_and_encoding",
                "size_limits_on_untrusted_input", manifest,
                ("parsing", "size_limits_on_untrusted_input"),
                "parsing safety: size limits are applied to "
                "untrusted input")
    _bool_check(results, "parsing_safety_and_encoding",
                "depth_limits_on_untrusted_input", manifest,
                ("parsing", "depth_limits_on_untrusted_input"),
                "parsing safety: depth limits are applied to "
                "untrusted input")
    _false_check(results, "parsing_safety_and_encoding",
                 "no_eval", manifest,
                 ("parsing", "eval_used_present"),
                 "parsing safety: no eval is used")
    _bool_check(results, "parsing_safety_and_encoding",
                "duplicate_keys_handled_deliberately", manifest,
                ("parsing", "duplicate_keys_handled_deliberately"),
                "parsing safety: duplicate keys are handled "
                "deliberately")
    _bool_check(results, "parsing_safety_and_encoding",
                "utf8_only_and_escapes_normalized", manifest,
                ("parsing", "utf8_only_and_escapes_normalized"),
                "parsing safety: UTF-8 only, escapes normalized")
    _bool_check(results, "parsing_safety_and_encoding",
                "parse_errors_explicit_not_silent_defaults", manifest,
                ("parsing",
                 "parse_errors_explicit_not_silent_defaults"),
                "quality gate: parse errors on bad input are "
                "explicit, not silent defaults")

    # ---- Section 5: streaming_ops_and_red_lines (skill: method
    #      6-7 — NDJSON for logs/events; streaming parsers for
    #      large files; compact for machines, pretty for humans;
    #      jq for inspection, diffs in reviews, sample fixtures
    #      per schema. Red lines — no unbounded parsing of
    #      untrusted input; no "it's just JSON" config edits
    #      without schema validation in CI) ----
    _bool_check(results, "streaming_ops_and_red_lines",
                "ndjson_for_logs_and_events", manifest,
                ("streaming_ops", "ndjson_for_logs_and_events"),
                "streaming & scale: NDJSON is used for logs and "
                "events")
    _bool_check(results, "streaming_ops_and_red_lines",
                "streaming_parsers_for_large_files", manifest,
                ("streaming_ops", "streaming_parsers_for_large_files"),
                "streaming & scale: streaming parsers are used "
                "for large files")
    _bool_check(results, "streaming_ops_and_red_lines",
                "compact_for_machine_storage_pretty_for_humans",
                manifest,
                ("streaming_ops",
                 "compact_for_machine_storage_pretty_for_humans"),
                "streaming & scale: storage is compact for "
                "machines and pretty for humans — megabytes are "
                "not pretty-printed for storage")
    _bool_check(results, "streaming_ops_and_red_lines",
                "inspection_and_diffs_in_reviews", manifest,
                ("streaming_ops", "inspection_and_diffs_in_reviews"),
                "ops: jq is used for inspection and diffs are "
                "carried in reviews")
    _bool_check(results, "streaming_ops_and_red_lines",
                "sample_fixtures_kept_per_schema", manifest,
                ("streaming_ops", "sample_fixtures_kept_per_schema"),
                "ops: sample fixtures are kept per schema")
    _false_check(results, "streaming_ops_and_red_lines",
                 "no_unbounded_parsing_of_untrusted_input", manifest,
                 ("red_lines",
                  "unbounded_parsing_of_untrusted_input_present"),
                 "red line: no unbounded parsing of untrusted "
                 "input (DoS) is present")
    _false_check(
        results, "streaming_ops_and_red_lines",
        "no_unvalidated_config_edits_without_ci_schema_validation",
        manifest,
        ("red_lines",
         "unvalidated_config_edits_without_ci_schema_validation_present"),
        "red line: no \"it's just JSON\" config edits without "
        "schema validation in CI are present")

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
        verdict = "JSON_SCHEMA_DESIGN_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "JSON_SCHEMA_DESIGN_SOUND"

    computed_names = (
        "payloads_declared",
        "every_payload_has_schema_and_sample",
        "every_hashed_or_signed_payload_canonical_documented",
        "every_payload_has_version_field",
        "every_payload_money_and_bigint_fields_as_strings",
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
        "service": "json-schema-design-check",
        "atom_version": "0.1.0",
        "artifact": manifest.get("artifact"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "payloads_count": payloads_count,
        "payloads_without_schema_or_sample":
            payloads_without_schema_or_sample,
        "schema_coverage": _fmt6(schema_coverage),
        "payloads_without_version_field":
            payloads_without_version_field,
        "version_coverage": _fmt6(version_coverage),
        "payloads_without_money_and_bigint_fields_as_strings":
            payloads_without_money_bigint_as_strings,
        "money_bigint_string_coverage":
            _fmt6(money_bigint_string_coverage),
        "hashed_or_signed_payloads_without_canonical_rules":
            hashed_payloads_without_canonical_rules,
        "canonical_coverage": _fmt6(canonical_coverage),
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
        "JSON SCHEMA DESIGN CHECK",
        f"artifact: {verdict.get('artifact')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: json_schema_design_check.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "JSON_SCHEMA_DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
