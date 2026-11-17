import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from json_schema_enforcer import evaluate, stamp


def run(payload, schema):
    return evaluate({"payload": payload, "schema": schema})


def test_valid_simple_object():
    r = run({"name": "x", "age": 3},
            {"type": "object",
             "properties": {"name": {"type": "string"},
                            "age": {"type": "integer"}},
             "required": ["name"]})
    assert r["valid"] is True
    assert r["violations"] == []


def test_type_mismatch_reported_with_path():
    r = run({"age": "three"},
            {"type": "object", "properties": {"age": {"type": "integer"}}})
    assert r["valid"] is False
    assert r["violations"][0]["path"] == "/age"
    assert r["violations"][0]["rule"] == "type"


def test_boolean_is_not_a_number():
    r = run(True, {"type": "number"})
    assert r["valid"] is False
    r2 = run(True, {"type": "boolean"})
    assert r2["valid"] is True


def test_integral_float_is_integer():
    assert run(2.0, {"type": "integer"})["valid"] is True
    assert run(2.5, {"type": "integer"})["valid"] is False


def test_required_missing():
    r = run({}, {"type": "object", "required": ["id", "name"]})
    rules = [v["rule"] for v in r["violations"]]
    assert rules == ["required", "required"]


def test_all_violations_collected():
    r = run({"a": "x", "b": "y"},
            {"type": "object",
             "properties": {"a": {"type": "integer"},
                            "b": {"type": "integer"}}})
    assert len(r["violations"]) == 2


def test_additional_properties_false():
    r = run({"a": 1, "sneaky": 2},
            {"type": "object", "properties": {"a": {"type": "integer"}},
             "additionalProperties": False})
    assert r["valid"] is False
    assert r["violations"][0]["path"] == "/sneaky"


def test_items_and_length_bounds():
    r = run([1, "two", 3],
            {"type": "array", "items": {"type": "integer"}, "maxItems": 2})
    paths = {(v["path"], v["rule"]) for v in r["violations"]}
    assert ("/1", "type") in paths
    assert ("", "maxItems") in paths


def test_string_rules():
    r = run("ab", {"type": "string", "minLength": 3, "pattern": "^z"})
    rules = {v["rule"] for v in r["violations"]}
    assert rules == {"minLength", "pattern"}
    assert run("zebra", {"pattern": "zeb"})["valid"] is True


def test_numeric_rules():
    r = run(7, {"minimum": 10, "multipleOf": 3})
    rules = {v["rule"] for v in r["violations"]}
    assert rules == {"minimum", "multipleOf"}
    assert run(9, {"multipleOf": 3, "exclusiveMaximum": 10})["valid"] is True
    assert run(10, {"exclusiveMaximum": 10})["valid"] is False


def test_enum_and_const():
    assert run("red", {"enum": ["red", "blue"]})["valid"] is True
    assert run("green", {"enum": ["red", "blue"]})["valid"] is False
    assert run(1, {"const": True})["valid"] is False
    assert run(True, {"const": True})["valid"] is True


def test_anyof_oneof_not():
    schema = {"anyOf": [{"type": "string"}, {"type": "integer"}]}
    assert run("x", schema)["valid"] is True
    assert run(1.5, schema)["valid"] is False
    one = {"oneOf": [{"type": "number"}, {"type": "integer"}]}
    assert run(2.5, one)["valid"] is True
    assert run(2, one)["valid"] is False
    assert run("x", {"not": {"type": "string"}})["valid"] is False
    assert run(3, {"not": {"type": "string"}})["valid"] is True


def test_ref_resolution():
    schema = {
        "definitions": {"pos": {"type": "integer", "minimum": 1}},
        "type": "object",
        "properties": {"count": {"$ref": "#/definitions/pos"}},
    }
    assert run({"count": 3}, schema)["valid"] is True
    r = run({"count": 0}, schema)
    assert r["valid"] is False
    assert r["violations"][0]["path"] == "/count"


def test_unresolvable_ref_is_a_violation():
    r = run(1, {"$ref": "#/definitions/missing"})
    assert r["valid"] is False
    assert r["violations"][0]["rule"] == "$ref"


def test_unsupported_keywords_named():
    r = run({"a": 1},
            {"type": "object", "propertyNames": {"maxLength": 3},
             "contains": {"type": "integer"}})
    assert "propertyNames" in r["unsupported_keywords"]
    assert "contains" in r["unsupported_keywords"]


def test_annotations_ignored():
    r = run("x", {"type": "string", "title": "T", "description": "D",
                  "default": "y", "examples": ["z"]})
    assert r["valid"] is True
    assert r["unsupported_keywords"] == []


def test_nested_path_reporting():
    schema = {"type": "object",
              "properties": {"a": {"type": "object",
                                   "properties": {
                                       "b": {"type": "array",
                                             "items": {"type": "string"}}}}}}
    r = run({"a": {"b": ["ok", 5]}}, schema)
    assert r["violations"][0]["path"] == "/a/b/1"


def test_missing_envelope_fields_raise():
    for bad in ({"schema": {}}, {"payload": 1}):
        try:
            evaluate(bad)
        except ValueError:
            pass
        else:
            raise AssertionError("expected ValueError")


def test_deterministic():
    payload = {"payload": {"x": "no"},
               "schema": {"type": "object",
                          "properties": {"x": {"type": "integer"}},
                          "required": ["y"]}}
    assert evaluate(payload) == evaluate(payload)


def test_stamp_renders():
    s = stamp(run({"a": "x"}, {"properties": {"a": {"type": "integer"}}}))
    assert s.startswith("JSON SCHEMA ENFORCER")
    assert "/a" in s
