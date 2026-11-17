// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

// JSON schema enforcer — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/json-schema-enforcer/src/json_schema_enforcer.py
// (evaluate() + stamp()). No logic changes: the verdict, the
// violation list (paths, rules, expected, found), the check count
// and the unsupported-keyword list are identical to the Python
// output for the same input on the fixture corpus. Brief value
// rendering mirrors Python json.dumps(value, sort_keys=True) with
// its ", " / ": " separators; integral floats render as integers
// (a JS number carries no int/float distinction).

const SUPPORTED = new Set([
  "$ref", "type", "enum", "const", "allOf", "anyOf", "oneOf", "not",
  "required", "properties", "additionalProperties", "items",
  "minItems", "maxItems", "minLength", "maxLength", "pattern",
  "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum",
  "multipleOf",
]);
const ANNOTATIONS = new Set([
  "title", "description", "default", "examples", "$schema", "$id",
  "$comment", "deprecated", "readOnly", "writeOnly",
]);
const KEYWORD_ORDER = [
  "$ref", "type", "enum", "const", "allOf", "anyOf", "oneOf", "not",
  "required", "properties", "additionalProperties", "items",
  "minItems", "maxItems", "minLength", "maxLength", "pattern",
  "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum",
  "multipleOf",
];
const MAX_REF_DEPTH = 50;

export interface Violation {
  path: string;
  rule: string;
  expected: string;
  found: string;
}

export interface EnforcementResult {
  valid: boolean;
  violations: Violation[];
  checks_performed: number;
  unsupported_keywords: string[];
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cpLen(s: string): number {
  return [...s].length;
}

function typeName(value: unknown): string {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  if (typeof value === "string") return "string";
  if (Array.isArray(value)) return "array";
  if (isPyDict(value)) return "object";
  return "null";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function typeMatches(value: unknown, expected: string): boolean {
  const actual = typeName(value);
  if (expected === "number") {
    return actual === "integer" || actual === "number";
  }
  return actual === expected;
}

function jsonEqual(a: unknown, b: unknown): boolean {
  if ((typeof a === "boolean") !== (typeof b === "boolean")) return false;
  if (isNumber(a) && isNumber(b)) return a === b;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    return (
      a.length === b.length &&
      a.every((item, i) => jsonEqual(item, b[i]))
    );
  }
  if (isPyDict(a) && isPyDict(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return (
      aKeys.length === bKeys.length &&
      aKeys.every(
        (k) =>
          Object.prototype.hasOwnProperty.call(b, k) && jsonEqual(a[k], b[k]),
      )
    );
  }
  return a === b;
}

// Python json.dumps(value, sort_keys=True) with default separators.
function pyJson(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map((item) => pyJson(item)).join(", ") + "]";
  }
  if (isPyDict(value)) {
    const parts = Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}: ${pyJson(value[k])}`);
    return "{" + parts.join(", ") + "}";
  }
  return JSON.stringify(String(value));
}

function brief(value: unknown): string {
  const s = pyJson(value);
  return cpLen(s) <= 60 ? s : [...s].slice(0, 57).join("") + "...";
}

function escapeSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

class Ctx {
  violations: Violation[] = [];
  checks = 0;
  unsupported = new Set<string>();
  constructor(public root: Record<string, unknown>) {}
  fail(path: string, rule: string, expected: string, found: string): void {
    this.violations.push({ path, rule, expected, found });
  }
}

function resolveRef(
  ref: unknown,
  ctx: Ctx,
): Record<string, unknown> | null {
  if (typeof ref !== "string") return null;
  if (ref === "#") return ctx.root;
  if (!ref.startsWith("#/")) return null;
  let cur: unknown = ctx.root;
  for (const raw of ref.slice(2).split("/")) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isPyDict(cur) ||
        !Object.prototype.hasOwnProperty.call(cur, key)) {
      return null;
    }
    cur = cur[key];
  }
  return isPyDict(cur) ? cur : null;
}

function validate(
  value: unknown,
  schema: Record<string, unknown>,
  path: string,
  ctx: Ctx,
  depth: number,
): void {
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED.has(key) && !ANNOTATIONS.has(key)) {
      ctx.unsupported.add(key);
    }
  }
  for (const kw of KEYWORD_ORDER) {
    if (!Object.prototype.hasOwnProperty.call(schema, kw)) continue;
    const rule = schema[kw];
    if (kw === "$ref") {
      ctx.checks += 1;
      if (depth >= MAX_REF_DEPTH) {
        ctx.fail(path, "$ref", "ref depth within limit", brief(rule));
        continue;
      }
      const target = resolveRef(rule, ctx);
      if (target === null) {
        ctx.fail(path, "$ref", "a resolvable local ref", brief(rule));
      } else {
        validate(value, target, path, ctx, depth + 1);
      }
    } else if (kw === "type") {
      ctx.checks += 1;
      const expectedTypes = Array.isArray(rule) ? rule : [rule];
      const ok = expectedTypes.some(
        (t) => typeof t === "string" && typeMatches(value, t),
      );
      if (!ok) {
        ctx.fail(path, "type", brief(rule), `type ${typeName(value)}`);
      }
    } else if (kw === "enum") {
      ctx.checks += 1;
      if (Array.isArray(rule) &&
          !rule.some((item) => jsonEqual(value, item))) {
        ctx.fail(path, "enum", brief(rule), brief(value));
      }
    } else if (kw === "const") {
      ctx.checks += 1;
      if (!jsonEqual(value, rule)) {
        ctx.fail(path, "const", brief(rule), brief(value));
      }
    } else if (kw === "allOf") {
      ctx.checks += 1;
      if (Array.isArray(rule)) {
        for (const sub of rule) {
          if (isPyDict(sub)) validate(value, sub, path, ctx, depth);
        }
      }
    } else if (kw === "anyOf") {
      ctx.checks += 1;
      if (Array.isArray(rule)) {
        const mark = ctx.violations.length;
        let matched = false;
        for (const sub of rule) {
          if (!isPyDict(sub)) continue;
          const before = ctx.violations.length;
          validate(value, sub, path, ctx, depth);
          if (ctx.violations.length === before) matched = true;
        }
        ctx.violations.splice(mark);
        if (!matched) {
          ctx.fail(
            path, "anyOf", "at least one matching schema", brief(value),
          );
        }
      }
    } else if (kw === "oneOf") {
      ctx.checks += 1;
      if (Array.isArray(rule)) {
        const mark = ctx.violations.length;
        let matches = 0;
        for (const sub of rule) {
          if (!isPyDict(sub)) continue;
          const before = ctx.violations.length;
          validate(value, sub, path, ctx, depth);
          if (ctx.violations.length === before) matches += 1;
        }
        ctx.violations.splice(mark);
        if (matches !== 1) {
          ctx.fail(
            path, "oneOf",
            `exactly one matching schema (matched ${matches})`,
            brief(value),
          );
        }
      }
    } else if (kw === "not") {
      ctx.checks += 1;
      if (isPyDict(rule)) {
        const before = ctx.violations.length;
        validate(value, rule, path, ctx, depth);
        const matched = ctx.violations.length === before;
        ctx.violations.splice(before);
        if (matched) {
          ctx.fail(
            path, "not", "payload not matching the schema", brief(value),
          );
        }
      }
    } else if (kw === "required") {
      ctx.checks += 1;
      if (isPyDict(value) && Array.isArray(rule)) {
        for (const name of rule) {
          if (typeof name === "string" &&
              !Object.prototype.hasOwnProperty.call(value, name)) {
            ctx.fail(
              path, "required", `property '${name}' present`, "absent",
            );
          }
        }
      }
    } else if (kw === "properties") {
      ctx.checks += 1;
      if (isPyDict(value) && isPyDict(rule)) {
        for (const [name, sub] of Object.entries(rule)) {
          if (Object.prototype.hasOwnProperty.call(value, name) &&
              isPyDict(sub)) {
            validate(
              value[name], sub, path + "/" + escapeSegment(name), ctx, depth,
            );
          }
        }
      }
    } else if (kw === "additionalProperties") {
      ctx.checks += 1;
      if (isPyDict(rule)) {
        ctx.unsupported.add("additionalProperties (schema form)");
      } else if (rule === false && isPyDict(value)) {
        const declared = isPyDict(schema.properties) ? schema.properties : {};
        for (const name of Object.keys(value)) {
          if (!Object.prototype.hasOwnProperty.call(declared, name)) {
            ctx.fail(
              path + "/" + escapeSegment(name),
              "additionalProperties",
              "no properties beyond the declared set",
              "undeclared property present",
            );
          }
        }
      }
    } else if (kw === "items") {
      ctx.checks += 1;
      if (Array.isArray(rule)) {
        ctx.unsupported.add("items (tuple form)");
      } else if (isPyDict(rule) && Array.isArray(value)) {
        value.forEach((item, i) =>
          validate(item, rule, `${path}/${i}`, ctx, depth),
        );
      }
    } else if (kw === "minItems") {
      ctx.checks += 1;
      if (Array.isArray(value) && typeof rule === "number" &&
          value.length < rule) {
        ctx.fail(
          path, "minItems", `at least ${rule} item(s)`,
          `${value.length} item(s)`,
        );
      }
    } else if (kw === "maxItems") {
      ctx.checks += 1;
      if (Array.isArray(value) && typeof rule === "number" &&
          value.length > rule) {
        ctx.fail(
          path, "maxItems", `at most ${rule} item(s)`,
          `${value.length} item(s)`,
        );
      }
    } else if (kw === "minLength") {
      ctx.checks += 1;
      if (typeof value === "string" && typeof rule === "number" &&
          cpLen(value) < rule) {
        ctx.fail(
          path, "minLength", `length at least ${rule}`,
          `length ${cpLen(value)}`,
        );
      }
    } else if (kw === "maxLength") {
      ctx.checks += 1;
      if (typeof value === "string" && typeof rule === "number" &&
          cpLen(value) > rule) {
        ctx.fail(
          path, "maxLength", `length at most ${rule}`,
          `length ${cpLen(value)}`,
        );
      }
    } else if (kw === "pattern") {
      ctx.checks += 1;
      if (typeof value === "string" && typeof rule === "string") {
        let ok: boolean;
        try {
          ok = new RegExp(rule).test(value);
        } catch {
          ctx.fail(path, "pattern", "a valid regex", brief(rule));
          continue;
        }
        if (!ok) {
          ctx.fail(path, "pattern", `matching /${rule}/`, brief(value));
        }
      }
    } else if (kw === "minimum") {
      ctx.checks += 1;
      if (isNumber(value) && typeof rule === "number" && value < rule) {
        ctx.fail(path, "minimum", `>= ${rule}`, brief(value));
      }
    } else if (kw === "maximum") {
      ctx.checks += 1;
      if (isNumber(value) && typeof rule === "number" && value > rule) {
        ctx.fail(path, "maximum", `<= ${rule}`, brief(value));
      }
    } else if (kw === "exclusiveMinimum") {
      ctx.checks += 1;
      if (typeof rule === "boolean") {
        ctx.unsupported.add("exclusiveMinimum (boolean form)");
      } else if (isNumber(value) && typeof rule === "number" &&
                 value <= rule) {
        ctx.fail(path, "exclusiveMinimum", `> ${rule}`, brief(value));
      }
    } else if (kw === "exclusiveMaximum") {
      ctx.checks += 1;
      if (typeof rule === "boolean") {
        ctx.unsupported.add("exclusiveMaximum (boolean form)");
      } else if (isNumber(value) && typeof rule === "number" &&
                 value >= rule) {
        ctx.fail(path, "exclusiveMaximum", `< ${rule}`, brief(value));
      }
    } else if (kw === "multipleOf") {
      ctx.checks += 1;
      if (isNumber(value) && typeof rule === "number" && rule !== 0) {
        const q = value / rule;
        if (Math.abs(q - Math.round(q)) > 1e-9) {
          ctx.fail(path, "multipleOf", `multiple of ${rule}`, brief(value));
        }
      }
    }
  }
}

export function evaluate(manifest: unknown): EnforcementResult {
  if (!isPyDict(manifest)) {
    throw new TypeError("payload must be an object");
  }
  if (!Object.prototype.hasOwnProperty.call(manifest, "payload")) {
    throw new TypeError("payload is required");
  }
  if (!Object.prototype.hasOwnProperty.call(manifest, "schema")) {
    throw new TypeError("schema is required");
  }
  const schema = manifest.schema;
  if (!isPyDict(schema)) {
    throw new TypeError("schema must be an object");
  }
  const ctx = new Ctx(schema);
  validate(manifest.payload, schema, "", ctx, 0);
  const valid = ctx.violations.length === 0;
  const unsupported = [...ctx.unsupported].sort();
  return {
    valid,
    violations: ctx.violations,
    checks_performed: ctx.checks,
    unsupported_keywords: unsupported,
    summary:
      `${valid ? "VALID" : "INVALID"}: ${ctx.violations.length} ` +
      `violation(s) across ${ctx.checks} check(s)` +
      (unsupported.length
        ? `; unsupported keywords reported: ${unsupported.join(", ")}.`
        : "."),
  };
}

export function stamp(result: EnforcementResult): string {
  const lines = [
    "JSON SCHEMA ENFORCER",
    `valid: ${result.valid ? "True" : "False"}  ` +
      `checks: ${result.checks_performed}`,
  ];
  for (const v of result.violations) {
    lines.push(
      `  ${v.path || "<root>"} [${v.rule}] ` +
        `expected ${v.expected}, found ${v.found}`,
    );
  }
  if (result.unsupported_keywords.length) {
    lines.push("  unsupported: " + result.unsupported_keywords.join(", "));
  }
  lines.push(result.summary);
  return lines.join("\n");
}
