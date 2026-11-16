## vfd-application-engineering-check

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Batch 6, 2026-11-15 (Gemini tester;
  independently confirmed by the DeepSeek second tester), case
  `malformed`.
- **Input:** `{"asset": "VFD-004", "application": {"starts_per_hour": "not-a-number"}}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `NOT_SOUND` computed over the garbage
  value (0 pass / 1 fail / 36 missing — the string `starts_per_hour`
  was evaluated as a failed `starts_per_hour_declared` check).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; a wrong-typed
  numeric field is treated as present-but-invalid evidence and scored
  as a check failure instead of being rejected as invalid input.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field before evaluation — sections as objects,
  boolean fields as booleans, the numeric fields
  (`application.starts_per_hour`,
  `power_quality.harmonic_distortion_percent`,
  `power_quality.site_limit_percent`, `cable.cable_length_m`,
  `cable.oem_max_lead_length_m`, `drive.derated_current_a`,
  `drive.required_load_current_a`) as numbers,
  `application.load_torque_type` in its `"variable"` / `"constant"`
  vocabulary, and `records.firmware_version` as a string; on mismatch
  throw `InputError(<field>)` so the gateway answers 422. Add
  regression tests mirroring the external case.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  case passes when it returns 422 and the other five cases still pass.
