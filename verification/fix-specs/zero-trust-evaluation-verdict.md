## zero-trust-evaluation-verdict

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification, 2026-11-15 (Gemini tester;
  independently confirmed by the DeepSeek second tester), case
  `malformed`.
- **Input:** `{"system": "malformed-test", "evaluation": "not-an-object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the
  garbage value (0 pass / 0 fail / 26 missing; the string
  `"not-an-object"` in place of the `evaluation` section object was
  treated as missing evidence for every check).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are treated as missing evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence; entry
  `src/zero_trust_evaluation_verdict.py — evaluate(manifest)`),
  validate the type of every documented manifest field (`system`
  string; `evaluation` / `gauntlet` / `identity` / `cryptography` /
  `findings` / `inventory` / `limits` sections as objects of booleans,
  with `cryptography.password_kdf` a string and
  `cryptography.minimum_secret_length_chars` a number) before running
  checks; on mismatch throw `InputError(<field>)` so the gateway
  answers 422. Add regression tests mirroring the external malformed
  case.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.
