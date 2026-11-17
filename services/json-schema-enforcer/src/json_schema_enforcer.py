"""JSON schema enforcer — validate a JSON payload against a JSON
Schema subset and report every violation with its path.

Method (skill: json-schema-enforcement, v1). The enforcer checks a
payload against the documented subset below. It collects ALL
violations (never stops at the first), each carrying the payload
path (JSON-Pointer style), the rule broken, what was expected, and
what was found. Any schema keyword outside the subset is named in
the result's unsupported_keywords — never silently ignored.

Supported: type (string, number, integer, boolean, object, array,
null), enum, const, required, properties, additionalProperties
(boolean form), items (single-schema form), minItems, maxItems,
minLength, maxLength, pattern, minimum, maximum, exclusiveMinimum,
exclusiveMaximum (numeric form), multipleOf, allOf, anyOf, oneOf,
not, and local $ref (#, #/definitions/..., #/$defs/... — resolved as
a JSON Pointer against the root schema).

Annotation keywords (title, description, default, examples, $schema,
$id, $comment, deprecated, readOnly, writeOnly) are ignored, as JSON
Schema intends. checks_performed counts every keyword evaluation,
including those inside combinators and $ref targets. Type checks are
strict JSON types: a boolean is never a number; a float with an
integral value is an integer; string lengths count Unicode code
points.

Deterministic: same payload and schema, same verdict, same
violations in the same order (keywords are evaluated in a fixed
order, not schema order).
"""

import json
import math
import re
import sys

SUPPORTED = {
    "$ref", "type", "enum", "const", "allOf", "anyOf", "oneOf", "not",
    "required", "properties", "additionalProperties", "items",
    "minItems", "maxItems", "minLength", "maxLength", "pattern",
    "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum",
    "multipleOf",
}
ANNOTATIONS = {
    "title", "description", "default", "examples", "$schema", "$id",
    "$comment", "deprecated", "readOnly", "writeOnly",
}
KEYWORD_ORDER = (
    "$ref", "type", "enum", "const", "allOf", "anyOf", "oneOf", "not",
    "required", "properties", "additionalProperties", "items",
    "minItems", "maxItems", "minLength", "maxLength", "pattern",
    "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum",
    "multipleOf",
)
MAX_REF_DEPTH = 50


def _type_name(value):
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "integer" if value.is_integer() else "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    return "null"


def _is_number(value):
    return not isinstance(value, bool) and isinstance(value, (int, float))


def _type_matches(value, expected):
    actual = _type_name(value)
    if expected == "number":
        return actual in ("integer", "number")
    return actual == expected


def _json_equal(a, b):
    if isinstance(a, bool) != isinstance(b, bool):
        return False
    if _is_number(a) and _is_number(b):
        return a == b
    if type(a) is not type(b):
        if isinstance(a, float) and isinstance(b, int):
            return a == b
        if isinstance(a, int) and isinstance(b, float):
            return a == b
        return False
    if isinstance(a, dict):
        return a.keys() == b.keys() and all(_json_equal(a[k], b[k]) for k in a)
    if isinstance(a, list):
        return len(a) == len(b) and all(
            _json_equal(x, y) for x, y in zip(a, b)
        )
    return a == b


def _brief(value):
    try:
        s = json.dumps(value, sort_keys=True)
    except (TypeError, ValueError):
        s = repr(value)
    return s if len(s) <= 60 else s[:57] + "..."


def _escape(segment):
    return segment.replace("~", "~0").replace("/", "~1")


class _Ctx:
    def __init__(self, root_schema):
        self.root = root_schema
        self.violations = []
        self.checks = 0
        self.unsupported = set()

    def fail(self, path, rule, expected, found):
        self.violations.append(
            {"path": path, "rule": rule, "expected": expected, "found": found}
        )


def _resolve_ref(ref, ctx):
    if ref == "#":
        return ctx.root
    if not ref.startswith("#/"):
        return None
    cur = ctx.root
    for raw in ref[2:].split("/"):
        key = raw.replace("~1", "/").replace("~0", "~")
        if not isinstance(cur, dict) or key not in cur:
            return None
        cur = cur[key]
    return cur if isinstance(cur, dict) else None


def _validate(value, schema, path, ctx, depth):
    for key in schema:
        if key not in SUPPORTED and key not in ANNOTATIONS:
            ctx.unsupported.add(key)
    for kw in KEYWORD_ORDER:
        if kw not in schema:
            continue
        rule = schema[kw]
        if kw == "$ref":
            ctx.checks += 1
            if depth >= MAX_REF_DEPTH:
                ctx.fail(path, "$ref", "ref depth within limit", _brief(rule))
                continue
            target = _resolve_ref(rule, ctx) if isinstance(rule, str) else None
            if target is None:
                ctx.fail(path, "$ref", "a resolvable local ref", _brief(rule))
            else:
                _validate(value, target, path, ctx, depth + 1)
        elif kw == "type":
            ctx.checks += 1
            expected_types = rule if isinstance(rule, list) else [rule]
            if not any(
                isinstance(t, str) and _type_matches(value, t)
                for t in expected_types
            ):
                ctx.fail(
                    path, "type", _brief(rule), f"type {_type_name(value)}"
                )
        elif kw == "enum":
            ctx.checks += 1
            if isinstance(rule, list) and not any(
                _json_equal(value, item) for item in rule
            ):
                ctx.fail(path, "enum", _brief(rule), _brief(value))
        elif kw == "const":
            ctx.checks += 1
            if not _json_equal(value, rule):
                ctx.fail(path, "const", _brief(rule), _brief(value))
        elif kw == "allOf":
            ctx.checks += 1
            if isinstance(rule, list):
                for sub in rule:
                    if isinstance(sub, dict):
                        _validate(value, sub, path, ctx, depth)
        elif kw == "anyOf":
            ctx.checks += 1
            if isinstance(rule, list):
                mark = len(ctx.violations)
                matched = False
                for sub in rule:
                    if not isinstance(sub, dict):
                        continue
                    before = len(ctx.violations)
                    _validate(value, sub, path, ctx, depth)
                    if len(ctx.violations) == before:
                        matched = True
                del ctx.violations[mark:]
                if not matched:
                    ctx.fail(
                        path, "anyOf",
                        "at least one matching schema", _brief(value),
                    )
        elif kw == "oneOf":
            ctx.checks += 1
            if isinstance(rule, list):
                mark = len(ctx.violations)
                matches = 0
                for sub in rule:
                    if not isinstance(sub, dict):
                        continue
                    before = len(ctx.violations)
                    _validate(value, sub, path, ctx, depth)
                    if len(ctx.violations) == before:
                        matches += 1
                del ctx.violations[mark:]
                if matches != 1:
                    ctx.fail(
                        path, "oneOf",
                        f"exactly one matching schema (matched {matches})",
                        _brief(value),
                    )
        elif kw == "not":
            ctx.checks += 1
            if isinstance(rule, dict):
                before = len(ctx.violations)
                _validate(value, rule, path, ctx, depth)
                matched = len(ctx.violations) == before
                del ctx.violations[before:]
                if matched:
                    ctx.fail(
                        path, "not", "payload not matching the schema",
                        _brief(value),
                    )
        elif kw == "required":
            ctx.checks += 1
            if isinstance(value, dict) and isinstance(rule, list):
                for name in rule:
                    if isinstance(name, str) and name not in value:
                        ctx.fail(
                            path, "required",
                            f"property '{name}' present", "absent",
                        )
        elif kw == "properties":
            ctx.checks += 1
            if isinstance(value, dict) and isinstance(rule, dict):
                for name, sub in rule.items():
                    if name in value and isinstance(sub, dict):
                        _validate(
                            value[name], sub,
                            path + "/" + _escape(name), ctx, depth,
                        )
        elif kw == "additionalProperties":
            ctx.checks += 1
            if isinstance(rule, dict):
                ctx.unsupported.add("additionalProperties (schema form)")
            elif rule is False and isinstance(value, dict):
                declared = schema.get("properties", {})
                for name in value:
                    if name not in declared:
                        ctx.fail(
                            path + "/" + _escape(name),
                            "additionalProperties",
                            "no properties beyond the declared set",
                            "undeclared property present",
                        )
        elif kw == "items":
            ctx.checks += 1
            if isinstance(rule, list):
                ctx.unsupported.add("items (tuple form)")
            elif isinstance(rule, dict) and isinstance(value, list):
                for i, item in enumerate(value):
                    _validate(item, rule, f"{path}/{i}", ctx, depth)
        elif kw == "minItems":
            ctx.checks += 1
            if isinstance(value, list) and len(value) < rule:
                ctx.fail(path, "minItems", f"at least {rule} item(s)",
                         f"{len(value)} item(s)")
        elif kw == "maxItems":
            ctx.checks += 1
            if isinstance(value, list) and len(value) > rule:
                ctx.fail(path, "maxItems", f"at most {rule} item(s)",
                         f"{len(value)} item(s)")
        elif kw == "minLength":
            ctx.checks += 1
            if isinstance(value, str) and len(value) < rule:
                ctx.fail(path, "minLength", f"length at least {rule}",
                         f"length {len(value)}")
        elif kw == "maxLength":
            ctx.checks += 1
            if isinstance(value, str) and len(value) > rule:
                ctx.fail(path, "maxLength", f"length at most {rule}",
                         f"length {len(value)}")
        elif kw == "pattern":
            ctx.checks += 1
            if isinstance(value, str) and isinstance(rule, str):
                try:
                    ok = re.search(rule, value) is not None
                except re.error:
                    ctx.fail(path, "pattern", "a valid regex", _brief(rule))
                    continue
                if not ok:
                    ctx.fail(path, "pattern", f"matching /{rule}/",
                             _brief(value))
        elif kw == "minimum":
            ctx.checks += 1
            if _is_number(value) and value < rule:
                ctx.fail(path, "minimum", f">= {rule}", _brief(value))
        elif kw == "maximum":
            ctx.checks += 1
            if _is_number(value) and value > rule:
                ctx.fail(path, "maximum", f"<= {rule}", _brief(value))
        elif kw == "exclusiveMinimum":
            ctx.checks += 1
            if isinstance(rule, bool):
                ctx.unsupported.add("exclusiveMinimum (boolean form)")
            elif _is_number(value) and value <= rule:
                ctx.fail(path, "exclusiveMinimum", f"> {rule}", _brief(value))
        elif kw == "exclusiveMaximum":
            ctx.checks += 1
            if isinstance(rule, bool):
                ctx.unsupported.add("exclusiveMaximum (boolean form)")
            elif _is_number(value) and value >= rule:
                ctx.fail(path, "exclusiveMaximum", f"< {rule}", _brief(value))
        elif kw == "multipleOf":
            ctx.checks += 1
            if _is_number(value) and _is_number(rule) and rule != 0:
                q = value / rule
                if abs(q - round(q)) > 1e-9:
                    ctx.fail(path, "multipleOf", f"multiple of {rule}",
                             _brief(value))


def evaluate(manifest):
    """Return the enforcement result dict for
    {"payload": <any JSON value>, "schema": <object>}."""
    if not isinstance(manifest, dict):
        raise ValueError("payload must be an object")
    if "payload" not in manifest:
        raise ValueError("payload is required")
    if "schema" not in manifest:
        raise ValueError("schema is required")
    schema = manifest["schema"]
    if not isinstance(schema, dict):
        raise ValueError("schema must be an object")
    ctx = _Ctx(schema)
    _validate(manifest["payload"], schema, "", ctx, 0)
    valid = not ctx.violations
    unsupported = sorted(ctx.unsupported)
    return {
        "valid": valid,
        "violations": ctx.violations,
        "checks_performed": ctx.checks,
        "unsupported_keywords": unsupported,
        "summary": (
            f"{'VALID' if valid else 'INVALID'}: "
            f"{len(ctx.violations)} violation(s) across "
            f"{ctx.checks} check(s)"
            + (
                f"; unsupported keywords reported: {', '.join(unsupported)}."
                if unsupported else "."
            )
        ),
    }


def stamp(result):
    """Human-readable stamp of an enforcement result dict."""
    lines = [
        "JSON SCHEMA ENFORCER",
        f"valid: {result['valid']}  checks: {result['checks_performed']}",
    ]
    for v in result["violations"]:
        lines.append(
            f"  {v['path'] or '<root>'} [{v['rule']}] "
            f"expected {v['expected']}, found {v['found']}"
        )
    if result["unsupported_keywords"]:
        lines.append(
            "  unsupported: " + ", ".join(result["unsupported_keywords"])
        )
    lines.append(result["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: json_schema_enforcer.py <payload.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        payload = json.load(fh)
    result = evaluate(payload)
    print(json.dumps(result, indent=2))
    print()
    print(stamp(result))
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
