## reconciled-portfolio-performance-report

### F1 — Type-violating manifest fields return a report instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester;
  independently confirmed by the DeepSeek second tester), case
  `malformed`.
- **Input:** `{"portfolio": 12345, "beginning_value": "one thousand", "period_end_values": "not a list"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a report and never a 500.
- **Actual:** HTTP 200, status `insufficient_evidence` computed over the
  garbage values (`portfolio` echoed as `12345`).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are treated as missing evidence. (Note the contrast with
  *entries inside* a list: non-numeric entries in `period_end_values`
  are a documented, counted gap — `counts.invalid_value_entries` —
  not this defect. The defect is wrong types for the top-level fields
  themselves.)
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the top-level field
  types (`portfolio` string, `beginning_value` number, the series and
  ledger fields lists) before evaluation; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  case passes when it returns 422 and the other five cases still pass.

### F2 — Declared empty holdings ledger (`holdings: []`) is treated as absent instead of reconciled
- **Found by:** external verification Wave 1, 2026-11-15 (DeepSeek
  second tester; missed by the Gemini judge; upheld by the
  verification lane from the raw evidence), case `violations`.
- **Input:** the violations manifest — beginning 1000, period-end
  [1100, 1210], `external_flows: [0.0]` (misaligned, a genuine gap),
  and `holdings: []` explicitly declared against a final declared
  value of 1210.
- **Expected:** the holdings-vs-declared-value reconciliation leg
  computed over the declared ledger: holdings total `0.000000`
  (Σ quantity × price over the empty list), difference
  `-1210.000000`, difference fraction of final `-1.000000` — printed
  as a discrepancy finding, per SERVICE.md: "A discrepancy is a
  *finding*, not a gap". Status stays `partial` (the flows gap
  drives it).
- **Actual:** `layers.holdings = "absent"`, `holdings = null`, and
  `reconciliation.holdings_vs_declared_value` all null (except
  `final_declared_value`); no gap entry names the holdings leg, so
  the discrepancy passes in silence.
- **Defect:** the core conflates an explicitly submitted empty list
  with an absent field for the holdings layer. Absent `holdings`
  (the sparse case) correctly yields an absent layer; a present
  `[]` is declared evidence of a zero-total ledger and must be
  reconciled like any other declared total.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port), distinguish field-absent from field-present-empty
  for `holdings` (and audit the same distinction for `transactions`):
  when `holdings` is present, mark the layer present, emit the
  holdings section with total `0.000000`, and compute the
  holdings-vs-declared-value leg. Add a regression test mirroring
  the external violations case.
- **Retest:** external lane re-runs the violations case on redeploy;
  the case passes when the holdings leg prints difference
  `-1210.000000` / fraction `-1.000000`, status remains `partial`,
  and the other five cases still pass.
