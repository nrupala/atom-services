// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** Shared manifest field-type validation (F1 remedy, external
 *  verification Wave 1). Every atom core validates the type of every
 *  documented manifest field before evaluation: a field that is
 *  present with the wrong JSON type is a caller error, never
 *  evidence. The Python oracle of each atom carries the identical
 *  spec and walker (raising ValueError); this module is its
 *  TypeScript mirror (raising FieldTypeError), and the registry
 *  factory maps FieldTypeError to InputError(field) → HTTP 422
 *  {ok:false, error:"invalid_input", field}.
 *
 *  Spec DSL (identical in both languages):
 *    "string" | "boolean" | "number"  — scalar field
 *    "any"                            — intentionally unvalidated
 *                                       (documented counted-invalid
 *                                       entry semantics, e.g.
 *                                       crypto-inventory entries)
 *    { field: spec, ... }             — object field, documented
 *                                       subfields validated in
 *                                       declaration order
 *    [spec]                           — list field, every entry
 *                                       validated against spec
 *  Absent fields are not validated (absence is missing evidence,
 *  the atom's own verdict logic decides what that means). Fields
 *  not in the spec are ignored (additionalProperties stays open).
 *  A present null fails every scalar/list/object check: null is
 *  not a string, boolean, number, list or object.
 */

export class FieldTypeError extends TypeError {
  constructor(public readonly field: string, message: string) {
    super(message);
    this.name = "FieldTypeError";
  }
}

export type FieldSpec =
  | "string"
  | "boolean"
  | "number"
  | "any"
  | { [field: string]: FieldSpec }
  | readonly [FieldSpec];

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateValue(value: unknown, spec: FieldSpec, path: string): void {
  if (spec === "any") {
    return;
  }
  if (spec === "string") {
    if (typeof value !== "string") {
      throw new FieldTypeError(path, `${path} must be a string`);
    }
    return;
  }
  if (spec === "boolean") {
    if (typeof value !== "boolean") {
      throw new FieldTypeError(path, `${path} must be a boolean`);
    }
    return;
  }
  if (spec === "number") {
    if (typeof value !== "number") {
      throw new FieldTypeError(path, `${path} must be a number`);
    }
    return;
  }
  if (Array.isArray(spec)) {
    if (!Array.isArray(value)) {
      throw new FieldTypeError(path, `${path} must be a list`);
    }
    const itemSpec: FieldSpec = spec[0];
    value.forEach((item, i) => validateValue(item, itemSpec, `${path}[${i}]`));
    return;
  }
  if (!isObj(value)) {
    throw new FieldTypeError(path, `${path} must be an object`);
  }
  validateFields(value, spec as { [field: string]: FieldSpec }, path);
}

function validateFields(
  obj: Record<string, unknown>,
  spec: { [field: string]: FieldSpec },
  prefix: string,
): void {
  for (const [field, fspec] of Object.entries(spec)) {
    if (!Object.prototype.hasOwnProperty.call(obj, field)) continue;
    validateValue(obj[field], fspec, prefix ? `${prefix}.${field}` : field);
  }
}

/** Validate a manifest against the atom's documented field spec.
 *  Throws FieldTypeError naming the first mistyped field (spec
 *  declaration order), exactly as the Python oracle raises
 *  ValueError with the same field path and message. */
export function validateManifest(
  manifest: Record<string, unknown>,
  spec: { [field: string]: FieldSpec },
): void {
  validateFields(manifest, spec, "");
}
