# JSON schema enforcer — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You hand this atom a JSON payload and a JSON Schema, and it hands back a verdict you can act on: `valid`, plus every violation it found — validation never stops at the first failure — each with its JSON-Pointer path, the rule broken, what was expected, and what was found. It enforces a documented subset: `type` (string, number, integer, boolean, object, array, null), `enum`, `const`, `required`, `properties`, `additionalProperties` (boolean form), `items` (single-schema form), `minItems`/`maxItems`, `minLength`/`maxLength`, `pattern`, `minimum`/`maximum`, `exclusiveMinimum`/`exclusiveMaximum` (numeric form), `multipleOf`, the combinators `allOf`/`anyOf`/`oneOf`/`not`, and local `$ref` into `definitions`/`$defs`. Type checks are strict JSON types — a boolean is never a number, a float with an integral value counts as an integer, string lengths count Unicode code points — and `checks_performed` counts every keyword evaluation, including inside combinators and `$ref` targets, so you can see how much of the schema actually ran. The second honesty rule is the one most validators skip: any schema keyword outside the subset is named in `unsupported_keywords`, never silently ignored — a schema using `propertyNames` or `format` is enforced partially, and the result says so on its face, leaving the accept/reject call to you. Annotation keywords (`title`, `description`, `default`, and friends) are ignored, as JSON Schema intends. The enforcer judges shape only: a valid payload can still be wrong or unauthorized — enforcement is the floor, not the decision. Same payload and schema in → same verdict and the same violation list out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "json-schema-enforcer"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/json-schema-enforcer` — tool name `json_schema_enforcer`; `tools/call` arguments = the payload object below.
- **REST:** `POST https://atoms.pipavia.com/v1/json-schema-enforcer` — body = the payload object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `payload` (any JSON value, required) | the value under test — may be `null`; presence is what is required |
| `schema` (object, required) | an object schema over the supported subset (see "What it does") |

## Output

| Field | Meaning |
|---|---|
| `valid` | true only when `violations` is empty |
| `violations` | list of `{path, rule, expected, found}` — `path` is JSON-Pointer style, empty at the root |
| `checks_performed` | every keyword evaluation, including inside combinators and `$ref` targets |
| `unsupported_keywords` | sorted list of schema keywords outside the subset |
| `summary` | one-line human summary |
| `stamp` | the same result as a short text block |

## Errors

- **401 / 403** — missing key, or a key without this atom's scope.
- **422** — `invalid_input`: the envelope is malformed (non-object body, missing `payload`/`schema`, or a non-object `schema`). An invalid payload against a valid schema is **not** an error — it is the normal `valid: false` result.
- **429** — per-key rate limit (60/minute, 10,000/day).
