## tested-authorization-policy-pack

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification, 2026-11-15 (Gemini tester;
  independently confirmed by the DeepSeek second tester), case
  `malformed`.
- **Input:** `{"pack": "bad-types", "decision_model": "not-an-object", "policies": "not-a-list"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the
  garbage values (0 pass / 0 fail / 29 missing of 29 checks).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are treated as missing evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the top-level field
  types (`pack` string, the section fields objects of booleans,
  `policies[]` and `tests[]` lists with entries in the documented
  shape) before evaluation; on mismatch throw `InputError(<field>)`
  so the gateway answers 422. Add regression tests mirroring the
  external case: `decision_model` as string and `policies` as
  string → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  case passes when it returns 422 and the other five cases still pass.
