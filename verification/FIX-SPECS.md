# Fix specifications — external verification findings

Filed by the external verification lane (Gemini tester, DeepSeek second
tester on computed atoms). The lane does not edit the gateway tree;
these specs route into the replication stream. Retest protocol per
spec: redeploy the fixed atom, the external lane re-runs its recorded
cases, and the atom's verdict in `VERIFICATION-INDEX.md` flips only
when every case passes.

## Systemic class F1 — manifest type validation (35 atoms)

**Defect (one class, 35 instances):** the atom handler evaluates a
manifest whose fields carry wrong JSON types and returns HTTP 200 with
a verdict/status computed over the garbage, instead of rejecting it.
**Expected (all atoms):** HTTP 422 `{ok:false,
error:"invalid_input", field:<field>}` — the mechanism already exists
in the gateway (`callpath.ts` maps `InputError` → 422) and the two
validating atoms (`codebase-structural-query`,
`semantic-code-taint-analysis-report`) prove it live.
**Remedy shape (per atom):** validate every documented manifest
field's type (string / boolean / number / list / object sections per
the atom's SERVICE.md input table) in the core before evaluation —
Python oracle first, then the TS port — throwing `InputError(<field>)`
on mismatch; add regression tests mirroring the external malformed
case recorded in each atom's TEST-REPORT.md.
**Per-atom instances:** each fragment below records the atom's exact
malformed input and observed output.

## Unique finding — reconciled-portfolio-performance-report F2

Empty `holdings: []` declared against a non-zero final value is treated
as "absent" (all-null leg, no gap) instead of the discrepancy finding
SERVICE.md specifies (difference −1210.000000, fraction −1.000000 on
the recorded case). Detail in the atom's fragment below.

---
## agent-evaluation-scorecard

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"agent": 12345, "tasks": "not-a-list"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage values (`agent` echoed as `12345`; 0 pass / 0 fail / 32 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence; entry `src/agent_evaluation_scorecard.py — evaluate(manifest)`),
  validate the type of every documented manifest field (string /
  boolean / number / list / object sections) before running checks;
  on mismatch throw `InputError(<field>)` so the gateway answers 422.
  Add regression tests mirroring the external malformed case.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## agent-safety-guardrail-audit

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"guardrails_disabled": "not-a-boolean", "tool_access": "should-be-an-object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `NOT_GUARDED` computed over the garbage
  values (0 pass, 1 fail, 33 missing of 34 checks across eight sections.).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `guardrails_disabled` as string, `tool_access` as string → 422 each.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## append-only-ledger-design-audit

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"ledger_name": "Malformed Ledger", "version": "1.0.0", "append_only": "should_be_an_object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage
  values (0 pass, 0 fail, 29 missing of 29 checks across five sections.).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `append_only` as string → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## assumption-audit

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"decision": "Malformed test", "framing": "not-an-object", "preset": {"criteria_set_before_data": "should-be-boolean"}}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `UNSOUND` computed over the garbage values (0 pass / 1 fail / 17 missing; the string `"should-be-boolean"` was counted as a failed check).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence; entry `src/assumption_audit.py — evaluate(manifest)`),
  validate the type of every documented manifest field (string /
  boolean / number / list / object sections) before running checks;
  on mismatch throw `InputError(<field>)` so the gateway answers 422.
  Add regression tests mirroring the external malformed case.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
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
## condition-monitoring-triage

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"asset": "Motor-001", "baseline": "NOT_A_BOOLEAN_OBJECT"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage value (0 pass / 0 fail / 19 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence; entry `src/condition_monitoring_triage.py — evaluate(manifest)`),
  validate the type of every documented manifest field (string /
  boolean / number / list / object sections) before running checks;
  on mismatch throw `InputError(<field>)` so the gateway answers 422.
  Add regression tests mirroring the external malformed case.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## correctness-verification-certificate

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"component": 12345, "register": "not-an-object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage values (`component` echoed as `12345`; 0 pass / 0 fail / 26 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence (`component` as number, `register` as string).
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case (`component` as number, `register` as string) → 422 each.
  Entry point: `src/correctness_verification_certificate.py — evaluate(manifest) -> verdict dict; CLI prints JSON + stamp`.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
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

---
## decision-trap-sweep

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"decision": "Malformed input", "framing": {"classification": 123}, "options": "not-a-list"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `TRAPS_PRESENT` computed over the garbage values (2 pass / 1 fail / 21 missing; the numeric `classification` failed its check instead of being rejected).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence (`framing.classification` as number, `options` as string).
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case (`framing.classification` as number, `options` as string) → 422 each.
  Entry point: `src/decision_trap_sweep.py — evaluate(manifest) -> verdict dict; CLI prints JSON + stamp`.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## defined-flow-auditor

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"system": "malformed-test", "auth": {"every_request_authenticated": "YES_PLEASE"}}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `NOT_DEFINED` computed over the garbage value (0 pass / 1 fail / 23 missing; the string `"YES_PLEASE"` was counted as a failed check).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence; entry `src/defined_flow_auditor.py — evaluate(manifest)`),
  validate the type of every documented manifest field (string /
  boolean / number / list / object sections) before running checks;
  on mismatch throw `InputError(<field>)` so the gateway answers 422.
  Add regression tests mirroring the external malformed case.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## dependency-governance-audit

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"project": "malformed-project", "justification": "not-an-object", "sources": {"all_official": "should-be-boolean"}}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `NOT_GOVERNED` computed over the garbage
  values (0 pass, 1 fail, 20 missing of 21 checks across six sections.).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `justification` as string, `sources.all_official` as string → 422 each.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## distribution-equipment-rating-condition-check

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"lineup": "Malformed-Input", "ratings": "invalid_string_instead_of_object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage values (0 pass / 0 fail / 27 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence (`ratings` as string).
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case (`ratings` as string) → 422 each.
  Entry point: `src/distribution_equipment_rating_condition_check.py — evaluate(manifest) -> verdict dict; CLI prints JSON + stamp`.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## electrical-machinery-engineering-check

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"machine": "Motor-004", "duty": "invalid_string_instead_of_object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage values (0 pass / 0 fail / 38 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence (`duty` as string).
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case (`duty` as string) → 422 each.
  Entry point: `src/electrical_machinery_engineering_check.py — evaluate(manifest) -> verdict dict; CLI prints JSON + stamp`.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
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

---
## encryption-claim-audit

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"product": 12345, "claims": "invalid_string_instead_of_object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage
  values (0 pass, 0 fail, 28 missing of 28 checks across six sections.).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `product` as number, `claims` as string → 422 each.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## finance-content-compliance-check

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"content": "Bad types", "jurisdiction": 123, "advice_boundary": "not_an_object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `NON_COMPLIANT` computed over the garbage values (0 pass / 1 fail / 31 missing; `jurisdiction_context_stated` failed on the numeric jurisdiction).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## firewall-rules-audit

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"system": "malformed-test", "review": {"cadence_days": "thirty"}}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `UNSOUND` computed over the garbage
  values (0 pass, 1 fail, 19 missing of 20 checks across five sections.).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `review.cadence_days` as string → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## forecast-with-ranges-and-scorecard

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"baselines": {"naive_value": "not_a_number", "moving_average_value": 100, "seasonal_naive_value": 100}}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `FORECAST_NOT_READY` computed over the garbage values (0 pass / 1 fail / 24 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## lean4-formal-proof

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"project": "malformed-input", "setup": "not-an-object", "theorems": "should-be-a-list"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage values (0 pass / 0 fail / 26 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## license-compliance-check

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"product": "BadTypeApp", "distribution_model": 123, "components": "not-an-array"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `NON_COMPLIANT` computed over the garbage
  values (3 pass, 1 fail, 15 missing of 19 checks across four sections.).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `distribution_model` as number, `components` as string → 422 each.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## link-rot-scan-and-notarized-archive

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"site": "malformed_test", "scan": "not_an_object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage values (0 pass / 0 fail / 33 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## network-exposure-audit

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"inventory": {"current": "not-a-boolean"}}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `UNSOUND` computed over the garbage values (0 pass / 1 fail / 26 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## portfolio-risk-analytics-report

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"portfolio": 12345, "returns": "not_a_list", "holdings": "should_be_a_list"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, status `insufficient_evidence` computed over the garbage values (portfolio echoed as `12345`, periods 0).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## prediction-model-leakage-calibration-audit

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"model": 123, "prediction_time": "not-a-number"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the garbage values (`model` echoed as `123`; 0 pass / 0 fail / 27 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (string / boolean / number / list / object
  sections) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## predictive-maintenance-failure-risk-assessment

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester),
  case `malformed`.
- **Input:** `{"asset": 12345, "strategy": "invalid_string_instead_of_object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the
  garbage values (`asset` echoed as `12345`; 0 pass / 0 fail / 24 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as missing evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (`asset` string; each section an object of
  booleans) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `asset` as number, `strategy` as
  string → 422 each.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## pump-conveyor-motor-suitability-check

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester;
  independently confirmed by the DeepSeek second tester), case
  `malformed`.
- **Input:** `{"asset": "ERR-001", "equipment_kind": 123, "duty": "invalid_string_instead_of_object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the
  garbage values (0 pass / 0 fail / 26 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as missing evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (`equipment_kind` in its vocabulary,
  sections as objects of booleans, `drives[]` entries with numeric
  rating fields) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `equipment_kind` as number,
  `duty` as string → 422 each.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
## rag-retrieval-evaluation-tuning

### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Wave 1, 2026-11-15 (Gemini tester;
  independently confirmed by the DeepSeek second tester), case
  `malformed`.
- **Input:** `{"corpus": "this-should-be-an-object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the
  garbage value (0 pass / 0 fail / 36 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as missing evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (sections as objects of booleans,
  `reranking.context_token_budget` numeric, `queries[]` entries in the
  documented shape) before running checks; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `corpus` as string → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
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

---
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
## strategy-backtest-validation
### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Batch 6, 2026-11-15 (Gemini tester;
  independently confirmed by the DeepSeek second tester), case
  `malformed`.
- **Input:** `{"strategy": "Malformed-Input", "harness": "should_be_an_object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the
  garbage value (0 pass / 0 fail / 36 missing).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are coerced or treated as missing evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the type of every
  documented manifest field (sections as objects of booleans,
  `overfit.parameter_count` / `overfit.observation_count` /
  `house_gates.max_planned_trade_usd` numeric, `strategy` string)
  before running checks; on mismatch throw `InputError(<field>)` so
  the gateway answers 422. Add regression tests mirroring the external
  case: `harness` as string → 422.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  atom's verdict flips to PASS when the case returns 422 and the other
  five cases still pass.

---
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

---
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

---
## vulnerability-triage-verified-closure
### F1 — Type-violating manifest fields return a verdict instead of HTTP 422
- **Found by:** external verification Batch 6, 2026-11-15 (Gemini tester;
  independently confirmed by the DeepSeek second tester), case
  `malformed`.
- **Input:** `{"scope": "malformed-test", "as_of_date": 20261115, "inventory": "not-an-object"}`.
- **Expected:** HTTP 422 `{ok:false, error:"invalid_input", field:...}` —
  the gateway's clean-input-error mechanism (`callpath.ts` maps
  `InputError` → 422), per the program's test doctrine: malformed input
  gets a clean input error, never a verdict and never a 500.
- **Actual:** HTTP 200, verdict `INSUFFICIENT_EVIDENCE` computed over the
  garbage values (0 pass / 0 fail / 23 missing; the type-violating
  `as_of_date` is echoed back as the integer `20261115`).
- **Defect:** the atom handler does not validate manifest field types
  against the SERVICE.md input table before evaluation; wrong-typed
  values are treated as missing evidence.
- **Suggested change:** in the atom's core (Python oracle first, then
  the TS port, per the house sequence), validate the top-level field
  types (`scope` string, `as_of_date` a strict `YYYY-MM-DD` date string,
  the section fields — `inventory`, `scanning`, `triage`, `patch_slas`,
  `mitigation`, `closure`, `disclosure`, `metrics` — objects, and
  `findings` a list) before evaluation; on mismatch throw
  `InputError(<field>)` so the gateway answers 422. Add regression
  tests mirroring the external case: `as_of_date` as integer,
  `inventory` as string → 422 each.
- **Retest:** external lane re-runs the malformed case on redeploy; the
  case passes when it returns 422 and the other five cases still pass.

---
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

---
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

---

---

## Retest wave findings — 2026-11-15 (post-fix deploy 7f9cae9fdd60417eb72062905a066554)

The retest wave re-ran the full recorded Wave 1 battery on all 37 atoms
plus first tests of Batch 7's seven: **42 PASS / 2 FAIL**. F1 is closed
on 35 of 37 retested atoms (malformed → 422 `invalid_input`, all other
cases green); F2 is closed on reconciled-portfolio-performance-report
(the violations case now prints difference `-1210.000000` / fraction
`-1.000000`, mechanically verified from the raw response and
independently recomputed by DeepSeek). The two remaining FAILs are both
in the fix's own validation layer, in opposite directions of doubt:

## F3 — release-readiness-verdict: fix-stream validation stricter than the documented input table (regression)

- **Found by:** external verification retest wave, 2026-11-15 (Gemini
  tester + mechanical verification), cases `full-pass` and `violations`.
- **Input (recorded Wave 1 battery, unchanged):** the full-pass and
  violations manifests carry `release_notes.breaking_changes: false`.
  In Wave 1 the same inputs returned HTTP 200 `READY` / `NOT_READY`
  live (the core treated `false` as "no breaking changes declared");
  those cases PASSED Wave 1 — the atom's only Wave 1 failure was F1.
- **Expected:** HTTP 200 with the recorded verdicts; MCP parity true.
- **Actual:** HTTP 422 `{ok:false, error:"invalid_input",
  field:"release_notes.breaking_changes", detail:"release_notes.breaking_changes
  must be a list"}` on both cases; MCP returns JSON-RPC -32602 (no
  structuredContent), so parity fails as a direct consequence.
- **Defect:** the F1 fix's type map declares `breaking_changes` as a
  list of strings, but SERVICE.md's input table names
  `release_notes.breaking_changes` **without declaring any type** —
  unlike neighbouring fields where the table does note a type
  (`version_bump_locations` "(list; ...)", `health_check.window_hours`
  "(must be 24–48)"). The F1 remedy spec said to validate field types
  "per the atom's SERVICE.md input table"; where the table declares no
  type, the fix invented one stricter than the contract customers
  already call against, and broke previously valid manifests.
- **Suggested change:** in the atom's core (oracle first, then TS port),
  align validation with SERVICE.md as written — a field with no
  documented type is not type-rejected; preserve the pre-fix semantics
  of `breaking_changes: false` (no breaking changes declared). If the
  product intent is to require a list, that is a contract change:
  amend SERVICE.md to declare the type explicitly and note it as a
  breaking input change — the lane recommends against it, since `false`
  manifests are already in the field.
- **Retest:** external lane re-runs the recorded battery unchanged; the
  verdict flips to PASS when full-pass/violations return 200
  `READY`/`NOT_READY`, parity is true, and the malformed case still
  returns 422.

## F4 — claim-verification-fact-check-stamp: recorded cases vs the document's blanket boolean default (contested — decision routed)

- **Found by:** external verification retest wave, 2026-11-15, cases
  `full-pass` and `violations`. The atom's verdict for this wave is
  FAIL on the recorded battery; this spec records why the lane does
  **not** score it as a plain fix regression.
- **Input (recorded Wave 1 battery, unchanged):** claim rows carry
  `primary_source` as URL strings (`"nasa.gov"`, `"blog.com"`). In
  Wave 1 the pre-fix atom accepted them and returned 200
  `STAMPED`/`NOT_STAMPED`; those cases passed Wave 1.
- **Actual (post-fix):** HTTP 422 `{ok:false, error:"invalid_input",
  field:"claims[0].primary_source", detail:"claims[0].primary_source
  must be a boolean"}` on both cases; parity fails as a consequence.
- **The documentary conflict:** SERVICE.md states "All fields are
  booleans unless noted", and its claims-row notation notes types only
  for `id (string)` and `independent_sources (number)` — `primary_source`
  is unnoted, so the document's own default makes it a boolean. The
  core's check logic also uses it purely as a flag (a material claim is
  triangulated with "one primary source plus >= 1 independent source").
  On that reading the fix implemented the documented type correctly and
  the Wave 1 cases — designed by the Gemini tester and passed by its
  judgment against the tolerant pre-fix atom — were themselves
  type-violating: a Wave 1 tester-design error the pre-fix coercion
  masked. On the other reading, callers reasonably send a source
  reference string and the blanket default was never meant for this
  field.
- **Decision routed to the replication stream (pick one, record it):**
  (a) **Boolean stands** — amend SERVICE.md's claims-row notation to
  mark `primary_source (boolean)` explicitly; the external lane then
  re-designs the two cases with boolean values and re-tests (expected
  `STAMPED`/`NOT_STAMPED`, parity true). The lane recommends (a): it
  matches the check logic and the document's default rule.
  (b) **String stands** — amend SERVICE.md to note `primary_source` as
  a string (source reference), and relax the core validation to accept
  strings, treating a non-empty string as "has primary source".
- **Retest:** after the decision lands and the chosen change deploys,
  the external lane re-runs (for (a), with the two redesigned cases
  recorded as corrected tester cases; for (b), with the recorded
  battery unchanged) and the verdict flips on the same conditions as F3.

---

## Wave 3 — 2026-11-15 (post fix-round-2 + Batch 8 deploy babe764a73734f93a8016267e77af193)

**F3 — CLOSED.** Retested on the recorded battery unchanged:
full-pass → HTTP 200 `READY`, violations → HTTP 200 `NOT_READY`
(failing checks `rollback_plan_testable`,
`post_release_health_window_24_to_48h`), malformed → 422 naming
`product`, determinism byte-identical, MCP↔REST parity true.
release-readiness-verdict verdict: PASS.

**F4 — CLOSED under ruling (a).** SERVICE.md declares
`claims[].primary_source (boolean)` explicitly; validation was not
relaxed. On the redesigned battery (Wave 1 battery preserved as
`cases-wave1.json`): full-pass → 200 `STAMPED`, violations → 200
`NOT_STAMPED` with exactly the four expected checks failing, sparse →
`INSUFFICIENT_EVIDENCE`, recorded malformed → 422 (field: `process`),
and the added string-`primary_source` case → 422 naming
`claims[0].primary_source`; determinism + parity true.
claim-verification-fact-check-stamp verdict: PASS. The Wave 1 FAIL on
the verdict cases is recorded as a tester-design error under the
now-explicit contract.

**No new findings.** All seven Batch 8 first tests PASS (DeepSeek
second reads in full agreement); no F5 issued.

---

## Wave 4 — 2026-11-15 (post Batch 9 deploy fa3faa42fac649da873fcc00cfa20f82)

**No new findings.** All seven Batch 9 first tests PASS (DeepSeek
second reads: full agreement on six atoms); no F5 issued.

**Documentation observation (not a defect, no fix required):**
budget-design-review — DeepSeek's second read expected the
violations case's `computed_status` to be `null` because a scalar
input was absent; the artifact reports
`outside_stated_limits_on_declared_evidence` under the fleet-wide
fail-precedence rule the oracle implements (any scalar check fails →
`outside_…`; `null` only when nothing fails and a scalar check is
incomplete). Adjudicated in the atom's favour on the evidence (see
the atom's TEST-REPORT.md and VERIFICATION-INDEX.md Wave 4 section).
Optional, at the replication stream's convenience: state the
fail-precedence explicitly in budget-design-review's SERVICE.md
where `computed_status` is described, so the summary no longer reads
as covering the fail case.

---

## Wave 5 — 2026-11-15 (post Batch 10 deploy 56f92826f4284ec9a8570d683113aa86)

**No new findings.** All seven Batch 10 first tests PASS (DeepSeek
second reads: full agreement on all seven atoms, every recomputed
quantity matched, exact violations fail sets confirmed); no F5
issued. All 65 live atoms now carry an external PASS as their
latest verdict.

---

## Wave 6 — 2026-11-15 (post Batch 11 deploy 05ec9d2252ec4e26a46fc028eede90ab)

**No new findings.** All seven Batch 11 first tests PASS (DeepSeek
second reads: full agreement on all seven atoms, every recomputed
quantity matched, exact violations fail sets confirmed); no F6
issued. All 72 live atoms now carry an external PASS as their
latest verdict.

**Documentation observation (not a defect, no fix required):**
data-visualization-design — two failing checks' static evidence
strings retain "(… passes vacuously)" wording while their
statuses are correctly `fail`. Verdicts, fail sets and computed
values are all correct. Optional, at the replication stream's
convenience: align those two evidence strings with the checks'
fail-state phrasing, as with the Wave 4 budget-design-review
observation.

---

## Wave 7 — 2026-11-15 (post Batch 12 deploy 7bad54c4e4a145e493e8766eb2f3bafb)

**No new findings.** All seven Batch 12 first tests PASS (DeepSeek
second reads: full agreement on all seven atoms, every recomputed
quantity matched, exact violations fail sets confirmed); no F7
issued. All 79 live atoms now carry an external PASS as their
latest verdict.

**Process change (no fix spec — a verification-lane change, not an
atom change):** the Wave 4–6 case-design checklist is now a
mechanical pre-flight validator, `verification/validate_cases.py`,
run by the harness on every designed case file before execution; a
rejected file is not executed. It enforces the four standing rules
(R1 exact check-register names, extracted from the atom's own
oracle core; R2 structured `computed_spot_checks`, never
prose-only; R3 violations inputs are full manifests; R4 malformed
cases carry exactly one type violation of a documented typed
field). Wave 7 effect: 52 rejections across the seven raw Gemini
designs (R1 ×26, R2 ×14, R3 ×7, R4 ×5), 39 design-time corrections
recorded in the per-atom reports, and zero tester errors in
executed cases — every executed battery validator-passed, the
Gemini judge recorded zero tester errors on all seven atoms.

---

**Gate-filed corpus item (2026-11-15, per-atom release gate WS2 — a
verification-lane bookkeeping change, not an atom change):** the
gate's live re-execution of all 79 corpora proved zero atom drift —
every atom's live failing set today is identical to its UAT-time live
failing set — but 37 early-wave recorded expects name checks by field
path or section where the live responses (and the atoms' registers)
use check names. Rewrite the early-wave `cases.json` expects in exact
check-register names (the R1 rule the Wave 4–6 validator now enforces
at design time, applied retroactively to Waves 1–3 corpora), so future
replays compare name-to-name without a normalization basis. Evidence:
`~/workspace/release-gate-runs/atoms-per-atom-gate-2026-11-15/pack.md`
(judgment-differential section) and GMSI-174 (corpora sealed with the
verdict).
