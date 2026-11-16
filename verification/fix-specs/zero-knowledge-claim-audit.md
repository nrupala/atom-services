## zero-knowledge-claim-audit

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"product": "MalformedAudit", "claims": {"claim_basis": 12345}, "access": "not_an_object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `CLAIMS_UNSOUND` computed over the garbage
  values (0 pass, 1 fail, 26 missing of 27 checks across six sections.;
  the numeric `claim_basis` was evaluated as the failing check
  `claim_basis_is_cryptographic_guarantee` and the string `access` was
  treated as absent evidence).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `claims.claim_basis` as number, `access` as string → 422 each.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.
