## electrical-test-record-preparation

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"asset": 12345, "record": "not-an-object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage values (`asset` echoed as `12345`; 0 pass / 0 fail / 41 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence (`asset` as number, `record` as string).
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case (`asset` as number, `record` as string) → 422 each.
  Entry point: `src/electrical_test_record_preparation.py — evaluate(manifest) -> verdict dict; CLI prints JSON + stamp`.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.
