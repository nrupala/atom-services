# JSON schema enforcer — `json-schema-enforcer`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — the enforcement verdict with its violation list — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Validate a JSON payload against a JSON Schema subset, returning every violation with its path, and naming any schema keyword the enforcer does not implement.

A caller submits a payload and a schema and receives a validity verdict: every violation found (validation never stops at the first), each with its JSON-Pointer path, the rule broken, what was expected, and what was found — plus the list of any schema keywords outside the supported subset, named as unsupported rather than silently ignored. One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): agent builders and API operators who validate tool-call arguments, MCP payloads, and manifests at their boundaries and need the full violation list per call, not a boolean.

## Self-use (R3 — passed)

Our own workflow that calls it: **Validating MCP tool payloads and atom manifests before execution**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — Python oracle and test suite complete (20 tests passing, 2026-11-17); gateway port and deploy follow the fleet pipeline.

## Inputs — the enforcement payload

| Field | Read by |
|---|---|
| `payload` (any JSON value, required) | the enforcer — the value under test |
| `schema` (object, required) | the enforcer — an object schema over the supported subset |

Supported subset: `type` (string, number, integer, boolean, object, array, null), `enum`, `const`, `required`, `properties`, `additionalProperties` (boolean form), `items` (single-schema form), `minItems`, `maxItems`, `minLength`, `maxLength`, `pattern`, `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum` (numeric form), `multipleOf`, `allOf`, `anyOf`, `oneOf`, `not`, and local `$ref` (`#`, `#/definitions/...`, `#/$defs/...`, resolved as a JSON Pointer against the root schema, depth-limited). Annotation keywords (`title`, `description`, `default`, `examples`, `$schema`, `$id`, `$comment`, `deprecated`, `readOnly`, `writeOnly`) are ignored, as JSON Schema intends. Anything else is reported in `unsupported_keywords` — including the schema form of `additionalProperties`, the tuple form of `items`, and the boolean form of the exclusive bounds.

Type checks are strict JSON types: a boolean is never a number; a float with an integral value counts as an integer; string lengths count Unicode code points.

## Outputs — the enforcement result

| Field | Meaning |
|---|---|
| `valid` | true only when `violations` is empty |
| `violations` | list of `{path, rule, expected, found}` — path is JSON-Pointer style, empty string at the root |
| `checks_performed` | every keyword evaluation, including inside combinators and `$ref` targets |
| `unsupported_keywords` | sorted list of schema keywords outside the subset |
| `summary` | one-line human summary |

## Named doubt (from the register)

Subset only — unsupported keywords are reported, never silently ignored.
