## crypto-inventory-pq-migration-map

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"system": 12345, "inventory": "not-a-list"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, status `insufficient_evidence` computed over the garbage values (`system` echoed as `12345`; empty map, all counts 0). Confirmed independently by the DeepSeek second tester.
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence (`system` as number, `inventory` as string).
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case (`system` as number, `inventory` as string) → 422 each.
  Entry point: `src/crypto_inventory_pq_migration_map.py — evaluate(manifest) -> migration-map dict; CLI prints JSON + stamp`.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.
