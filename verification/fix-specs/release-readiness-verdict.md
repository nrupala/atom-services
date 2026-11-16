## release-readiness-verdict

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"product": 123, "version": "1.2.3",
  "version_bump_locations": "not-a-list", "tag": "invalid-object-type"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `NOT_READY` computed over the garbage
  values (`product` echoed as `123`; 1 pass / 1 fail / 17 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `product` as number,
  `version_bump_locations` as string, `tag` as string → 422 each.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---

## F3 — Fix-stream validation stricter than the documented input table (retest wave, 2026-11-15)

Full spec in `verification/FIX-SPECS.md` §F3. Summary: the F1 fix
declares `release_notes.breaking_changes` a list; SERVICE.md's input
table declares no type for the field; the recorded Wave 1 full-pass and
violations manifests carry `breaking_changes: false` (HTTP 200
`READY`/`NOT_READY` in Wave 1) and now return HTTP 422 `invalid_input`,
with MCP parity failing as a consequence. Remedy: align validation to
SERVICE.md as written (no type declared → no type rejection; preserve
the pre-fix `false` semantics). Retest on the recorded battery
unchanged.
