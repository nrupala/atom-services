#!/usr/bin/env python3
"""Generate golden fixtures for the Batch 23 utility atoms
(markdown-sanitizer, token-estimator, json-schema-enforcer) from
their Python implementations (the regression oracles).

Each fixture file is {name, manifest, expected} where expected is the
exact Python evaluate() output, written to test/fixtures/ with the
<atom>--<name>.json naming the gateway suites read.

Run: python3 test/gen_fixtures_utilities.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ATOM_ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
FIXTURES = os.path.join(HERE, "fixtures")

CASES = {
    "markdown-sanitizer": [
        ("clean", {"text": "# Title\n\nSome *markdown* text.\n"}),
        ("script-and-tags", {
            "text": "before\n<script>alert(1)</script>\na <b>bold</b> "
                    "link [x](javascript:evil())",
        }),
        ("code-protected", {
            "text": "Example:\n\n```html\n<script>alert(1)</script>\n```"
                    "\n\nUse `<b>` inline.",
        }),
        ("options-off", {
            "text": '<a href="javascript:evil()">x</a>',
            "options": {"strip_html": False},
        }),
        ("images", {
            "text": "![alt](https://example.com/x.png) caption",
            "options": {"strip_images": True},
        }),
        ("messy-whitespace", {"text": "a  \n\n\n\n\nb<!-- note -->"}),
    ],
    "token-estimator": [
        ("hello", {"text": "hello"}),
        ("sentence", {"text": "The quick brown fox jumps over the lazy dog."}),
        ("numbers-cjk", {"text": "Order 1234567 ships today, 世界"}),
        ("messages", {
            "messages": [
                {"role": "user", "content": "hello"},
                {"role": "assistant", "content": "hello world"},
            ],
        }),
        ("claude-family", {
            "text": "word word word word",
            "model_family": "claude",
        }),
        ("empty", {"text": ""}),
    ],
    "json-schema-enforcer": [
        ("valid-object", {
            "payload": {"name": "x", "age": 3},
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "age": {"type": "integer"},
                },
                "required": ["name"],
            },
        }),
        ("violations", {
            "payload": {"a": "x", "b": "y", "sneaky": 1},
            "schema": {
                "type": "object",
                "properties": {
                    "a": {"type": "integer"},
                    "b": {"type": "integer"},
                },
                "additionalProperties": False,
            },
        }),
        ("numeric-rules", {
            "payload": 7,
            "schema": {"minimum": 10, "multipleOf": 3},
        }),
        ("combinators", {
            "payload": 2,
            "schema": {"oneOf": [{"type": "number"}, {"type": "integer"}]},
        }),
        ("ref", {
            "payload": {"count": 0},
            "schema": {
                "definitions": {
                    "pos": {"type": "integer", "minimum": 1},
                },
                "type": "object",
                "properties": {"count": {"$ref": "#/definitions/pos"}},
            },
        }),
        ("unsupported", {
            "payload": {"a": 1},
            "schema": {
                "type": "object",
                "propertyNames": {"maxLength": 3},
                "contains": {"type": "integer"},
            },
        }),
        ("nested", {
            "payload": {"a": {"b": ["ok", 5]}},
            "schema": {
                "type": "object",
                "properties": {
                    "a": {
                        "type": "object",
                        "properties": {
                            "b": {"type": "array",
                                  "items": {"type": "string"}},
                        },
                    },
                },
            },
        }),
    ],
}

MODULES = {
    "markdown-sanitizer": "markdown_sanitizer",
    "token-estimator": "token_estimator",
    "json-schema-enforcer": "json_schema_enforcer",
}


def main():
    os.makedirs(FIXTURES, exist_ok=True)
    for atom, cases in CASES.items():
        src = os.path.join(ATOM_ROOT, "services", atom, "src")
        sys.path.insert(0, src)
        module = __import__(MODULES[atom])
        for name, manifest in cases:
            expected = module.evaluate(manifest)
            doc = {"name": name, "manifest": manifest, "expected": expected}
            out = os.path.join(FIXTURES, f"{atom}--{name}.json")
            with open(out, "w", encoding="utf-8") as fh:
                json.dump(doc, fh, indent=2, ensure_ascii=False)
                fh.write("\n")
            print("wrote", out)
        sys.path.remove(src)


if __name__ == "__main__":
    main()
