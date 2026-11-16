## claim-verification-fact-check-stamp

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"document": "Malformed input", "process": "should_be_an_object", "claims": "should_be_a_list"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage values (0 pass / 0 fail / 16 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence; entry `src/claim_verification_fact_check_stamp.py — evaluate(manifest)`),
  validate the type of every documented manifest field (string /
  boolean / number / list / object sections) before running checks;
  on mismatch throw `InputError(<field>)` so the gateway answers 422.
  Add regression tests mirroring the external malformed case.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---

## F4 — Recorded cases vs the document's blanket boolean default (retest wave, 2026-11-15; contested, decision routed)

Full spec in `verification/FIX-SPECS.md` §F4. Summary: the recorded
full-pass/violations cases carry `claims[].primary_source` as URL
strings; the F1 fix rejects them (422, "must be a boolean"). SERVICE.md
states "All fields are booleans unless noted" and does not note a type
for `primary_source`, and the check logic uses the field purely as a
boolean flag — so the recorded cases are arguably Wave 1 tester-design
errors the pre-fix atom's tolerance masked. The wave verdict stays FAIL
on the recorded battery. Decision routed: (a) declare the boolean
explicitly in SERVICE.md and the external lane re-designs the two cases
(lane's recommendation), or (b) declare the field a string in
SERVICE.md and relax validation to match.
