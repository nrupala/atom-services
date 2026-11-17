# JSON schema enforcer — `json-schema-enforcer`

**Display name:** JSON schema enforcer · **Slug:** `json-schema-enforcer` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** built-locally — gateway port complete, deploy follows the fleet pipeline

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md)

This document follows the house documentation standard: Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked example is a real recorded run of the atom's core, reproduced verbatim.

## Tutorial

A first call, walked through end to end.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email), open the emailed sign-in link, then issue a key for this atom: `POST /v1/keys` with `{"atom": "json-schema-enforcer"}`. Keep the key; you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides, below.)

**Step 2 — Assemble the payload.** One JSON object with two fields: `payload` (the value under test — here, a tool-call record) and `schema` (the contract it must satisfy). The worked example below validates a `send_email` tool call whose arguments carry two defects: `count` is a string where the schema demands an integer, and `priority` is 9 where the schema caps it at 5.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/json-schema-enforcer` with the payload as the JSON body and the `Authorization` header set.

**Step 4 — Read the result.** The response carries `valid`, the full `violations` list, `checks_performed`, `unsupported_keywords`, a one-line `summary`, and a human-readable `stamp`. In the worked example: `valid: false`, exactly two violations — `/args/count` (type) and `/args/priority` (maximum) — across 17 checks performed.

**Step 5 — Fix by the list, not by trial.** Each violation names the path, the rule, what was expected, and what was found. Fix every listed path and re-submit; validation collects all violations in one pass, so one round-trip shows the whole defect list. A schema keyword the enforcer does not implement never passes silently — it appears in `unsupported_keywords`, and you decide whether partial enforcement is acceptable for that schema.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "json-schema-enforcer"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. This atom's key scope (namespace) is `json_schema_enforcer` — a key without this scope gets a 403 (see Errors).
3. Call `POST https://atoms.pipavia.com/v1/json-schema-enforcer` with the payload object as the JSON body and the header `Authorization: Bearer <key>`.
4. Read the JSON response: `valid`, `violations`, `checks_performed`, `unsupported_keywords`, `summary`, and the text `stamp`.

### Call via MCP

1. Get a key exactly as above (the MCP surface is key-gated on this gateway too).
2. Send JSON-RPC to `POST https://atoms.pipavia.com/mcp/json-schema-enforcer` with the same `Authorization: Bearer <key>` header.
3. Call `tools/call` for the tool `json_schema_enforcer`; the call arguments are the payload object itself (the same object you would POST to REST).
4. The tool's `structuredContent` is the same result object the REST face returns.

### Reuse a subschema with $ref

Define shared shapes once under `definitions` (or `$defs`) in the root schema and reference them locally: `{"$ref": "#/definitions/positiveInt"}`. Refs are resolved as JSON Pointers against the root schema, may nest, and are depth-limited; an unresolvable ref is itself a violation (rule `$ref`), never a silent skip.

### Read the unsupported list

If your schema uses a keyword outside the supported subset — say `propertyNames` or `format` — the result's `unsupported_keywords` names it. The rest of the schema is still enforced, and `checks_performed` counts only checks that actually ran. Treat a non-empty unsupported list as "enforced partially, on the record": for a hard gate, reject schemas with unsupported keywords at your side; for a soft check, the list tells you exactly which rules were not applied.

### Handle a 422 invalid_input

A malformed envelope is rejected before evaluation — you get HTTP 422, never a verdict: a non-object request body, a missing `payload` or `schema` field, or a `schema` that is not an object. (An *invalid payload against a valid schema* is not a 422 — that is the atom's normal `valid: false` result, HTTP 200.) Fix the envelope and re-submit; a 422 is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/json-schema-enforcer`
- **MCP:** `POST https://atoms.pipavia.com/mcp/json-schema-enforcer` — tool `json_schema_enforcer`

### Input reference

| Field | Type | Meaning |
|---|---|---|
| `payload` | any JSON value, required | the value under test (may be `null` — presence is what is required) |
| `schema` | object, required | an object schema over the supported subset |

### Supported subset

`type` (string, number, integer, boolean, object, array, null — a list of types is also accepted), `enum`, `const`, `required`, `properties`, `additionalProperties` (boolean form), `items` (single-schema form), `minItems`, `maxItems`, `minLength`, `maxLength`, `pattern`, `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum` (numeric form), `multipleOf`, `allOf`, `anyOf`, `oneOf`, `not`, and local `$ref` (`#`, `#/definitions/...`, `#/$defs/...`).

Annotation keywords are ignored, as JSON Schema intends: `title`, `description`, `default`, `examples`, `$schema`, `$id`, `$comment`, `deprecated`, `readOnly`, `writeOnly`. Everything else — including the schema form of `additionalProperties`, the tuple form of `items`, and the boolean form of the exclusive bounds — is reported in `unsupported_keywords`.

Type checks are strict JSON types: a boolean is never a number; a float with an integral value counts as an integer; string lengths count Unicode code points. Keywords are evaluated in a fixed order (not schema order), so the violation list is deterministic.

### Output reference

| Field | Meaning |
|---|---|
| `valid` | true only when `violations` is empty |
| `violations` | list of `{path, rule, expected, found}` — `path` is JSON-Pointer style (empty string at the root), `expected`/`found` are brief JSON renderings |
| `checks_performed` | every keyword evaluation, including inside combinators and `$ref` targets |
| `unsupported_keywords` | sorted list of schema keywords outside the subset |
| `summary` | one-line human summary |
| `stamp` | the same result as a short text block |

### Errors

- **401** — no key, or an unrecognized key.
- **403** — the key carries no scope for this atom.
- **422** — `invalid_input`: the envelope is malformed (see the how-to above).
- **429** — per-key rate limit (60/minute, 10,000/day).

## Explanation

Agents and APIs exchange payloads whose shape is a contract; acting on an unchecked payload is how a malformed tool call becomes a real-world side effect. This atom implements the house json-schema-enforcement method: validate at the boundary, against a documented subset, and report everything — every violation with its path, and every schema keyword that was not enforced, named. The two honesty rules are the product: validation never stops at the first failure (a caller fixing one defect per round-trip is a caller who stops fixing), and an unimplemented keyword is never silently ignored (a silent pass on an unenforced rule is a false claim about the payload).

Limits, stated plainly: the subset is deliberately bounded — full JSON Schema (with `format`, `propertyNames`, remote refs, and the rest) is out of scope, and schemas using it are enforced partially with the gap on the record. `pattern` uses the host regex engine; extremely exotic patterns can differ between regex dialects. The enforcer judges shape only: a valid payload can still be wrong, unauthorized, or unwise — enforcement is the floor, not the decision.

## Worked example

Recorded run of the atom's core (Python oracle, CLI), 2026-11-17. Input:

```json
{"payload": {"tool": "send_email", "args": {"to": "team@example.com", "subject": "Launch", "count": "three", "priority": 9}}, "schema": {"type": "object", "properties": {"tool": {"type": "string"}, "args": {"type": "object", "properties": {"to": {"type": "string", "pattern": "@"}, "subject": {"type": "string", "maxLength": 60}, "count": {"type": "integer", "minimum": 1}, "priority": {"type": "integer", "minimum": 1, "maximum": 5}}, "required": ["to", "count"], "additionalProperties": false}}, "required": ["tool", "args"]}}
```

Output, verbatim:

```json
{
  "valid": false,
  "violations": [
    {
      "path": "/args/count",
      "rule": "type",
      "expected": "\"integer\"",
      "found": "type string"
    },
    {
      "path": "/args/priority",
      "rule": "maximum",
      "expected": "<= 5",
      "found": "9"
    }
  ],
  "checks_performed": 17,
  "unsupported_keywords": [],
  "summary": "INVALID: 2 violation(s) across 17 check(s)."
}
```

Both planted defects are named with their paths; every other rule in the schema was checked and passed, and nothing in the schema fell outside the subset.
