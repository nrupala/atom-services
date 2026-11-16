# Finance content compliance check — `finance-content-compliance-check`

**Finance content compliance check** · slug `finance-content-compliance-check` · deliverable type: CHECK · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Field table source: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

Bound capability (from SERVICE.md): Publish finance education safely — advice-vs-education boundaries, dated figures, disclosures, no return promises.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run — the exact request and response are reproduced verbatim under **Worked examples → 1. Full-pass** below, so every number quoted here can be checked against that record.

**Step 1 — Get a key.** Follow the key flow in the How-to below (sign up, mint a session, issue a key for this atom). You send that key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** Build one JSON object for the subject `content` = `Investment basics for beginners.`. Fill in every group in the Input reference: absent fields are not neutral — they become missing evidence (or, for the report atom, labeled gaps). Present-but-wrong values are what produce a failing verdict, so declare what is actually true, including the red-line fields that must be `false`.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/finance-content-compliance-check` with the manifest as the body and the Authorization header (full curl in the How-to below).

**Step 4 — Read the verdict.** The recorded call returned HTTP 200 with `verdict: "COMPLIANT"`, every section `pass`, and the summary: "32 pass, 0 fail, 0 missing of 32 checks across six sections." The `checks` array carries one entry per check (`section`, `check`, `status`, `evidence`), and the `stamp` field is a plain-text rendering of the same verdict for logs and tickets.

**Step 5 — Confirm determinism.** The verification battery called the same manifest twice over REST and once over MCP: the REST repeat was byte-identical and the MCP structured content was equal to the REST result (see TEST-REPORT.md). Same manifest in → same result out is the product property, not a hope.

**Step 6 — Iterate.** If the result is not the passing one, do not resubmit blindly: use the How-to 'Read a failing verdict and fix the manifest' below. Each failing or missing check names the exact field to correct or supply.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "finance-content-compliance-check"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom (USER-GUIDE.md). The contract adds: scope is this atom only — a key for one atom never verifies for another.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -s -X POST https://atoms.pipavia.com/v1/finance-content-compliance-check \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

### Call via MCP

- MCP endpoint: `POST https://atoms.pipavia.com/mcp/finance-content-compliance-check`
- Tool name: `finance_content_compliance_check` (recorded in evidence.json as `mcp_tool_name`; `tools/list` returned HTTP 200).
- Call the tool with `tools/call`; the tool arguments are exactly the input object documented in the Input reference — the same manifest as the REST body, with no wrapper fields of the atom's own.
- MCP and REST are two faces of the same deterministic core: the verification battery's parity case checks that MCP structured content equals the REST result for the full-pass manifest.

### Read a failing verdict and fix the manifest

Use the recorded violations run (Worked examples → 2. Violations) as the pattern. It returned `NON_COMPLIANT` with the summary: "27 pass, 3 fail, 2 missing of 32 checks across six sections."

The checks with `status: "fail"` in that recorded run were:

- `advice_boundary.teaches_frameworks_and_criteria` — evidence: "education, not advice: teach frameworks, math, and how-to-choose criteria"
- `advice_boundary.no_personalized_recommendations` — evidence: "red line: no personalized recommendations, ever — personalized advice is licensed activity"
- `advice_boundary.advice_like_content_flagged` — evidence: "compliance touchpoint: content that edges toward advice-like (individualized) is flagged"

Fix procedure:

1. **Separate `fail` from `missing`.** A `fail` means a field was present but false / invalid, or a must-be-false red-line field was true — correct the underlying fact or the declaration. A `missing` check means the field was absent — supply the evidence. Adding a missing field cannot fix a fail, and vice versa.
2. **Work section by section.** The `sections` object rolls the checks up: a section is `fail` if any of its checks fails, otherwise `insufficient_evidence` if any is missing, otherwise `pass`. Fix every failing check in a section before re-reading its roll-up.
3. **Respect the gates.** Some checks only bite when a gate field says they apply (see the notes in the Input reference). If a gated check fails, either the gated thing must be brought up to standard or the gate declaration was wrong — fix whichever is true, never just flip the gate to make the check disappear if the gated thing exists.
4. **Resubmit the whole manifest.** The atom is stateless per call; there is no partial update. Resubmit the corrected full manifest and confirm the summary counts move (fail count to zero, then missing count to zero).

### Handle a 422 invalid_input

A 422 is not a verdict — the manifest was rejected before evaluation because a field had the wrong JSON type. The recorded malformed run (Worked examples → 3. Malformed) returned exactly:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "jurisdiction",
  "detail": "jurisdiction must be a string"
}
```

Fix the field named in `field` (`jurisdiction`): `detail` says what was expected ("jurisdiction must be a string"). Correct the type in your manifest — do not delete the field to dodge the error, because an absent field becomes missing evidence / a gap and changes the result — then resubmit. Note the contrast the verification battery was built to enforce: a type-violating field is a 422, while an absent field is evaluated as missing evidence.

## Reference

### Endpoints

| Face | Endpoint | Notes |
|---|---|---|
| REST | `POST https://atoms.pipavia.com/v1/finance-content-compliance-check` | Body = the input object; `Authorization: Bearer <key>` |
| MCP | `POST https://atoms.pipavia.com/mcp/finance-content-compliance-check` | Tool name `finance_content_compliance_check`; `tools/call` arguments = the input object |
| Gateway | `https://atoms.pipavia.com` | Recorded gateway version 1.1.0; health HTTP 200 at evidence time |

### Input reference

Types are taken from SERVICE.md's field table: 'All fields are booleans unless noted' — fields with no type note in that table are listed as boolean, and fields with a note carry that note's type. Notes (gates / conditionals / must-be-false and must-be-true conditions) are preserved from SERVICE.md.

#### `content`

| Field | Type | Read by / notes |
|---|---|---|
| `content` | string | carried into the verdict output, not itself checked |

#### `jurisdiction`

| Field | Type | Read by / notes |
|---|---|---|
| `jurisdiction` | non-empty string | Read by: advice_boundary; the stated CA/US/other context |

#### `advice_boundary`

| Field | Type | Read by / notes |
|---|---|---|
| `advice_boundary.teaches_frameworks_not_recommendations` | boolean | Read by: advice_boundary |
| `advice_boundary.personalized_recommendations_present` | boolean | Read by: advice_boundary; must be `false` to pass |
| `advice_boundary.education_not_advice_disclaimer_present` | boolean | Read by: advice_boundary |
| `advice_boundary.checklist_passed` | boolean | Read by: advice_boundary |
| `advice_boundary.advice_like_content_present` | boolean | Read by: advice_boundary; gates the flagged check below |
| `advice_boundary.advice_like_flagged_for_review` | boolean | Read by: advice_boundary; required when advice-like content is present; otherwise the check passes as not applicable |

#### `figures`

| Field | Type | Read by / notes |
|---|---|---|
| `figures` | list of figures | Read by: accuracy_and_sourcing; absent / not a list / empty = both computed checks missing |
| `figures[].label` | non-empty string | Read by: accuracy_and_sourcing |
| `figures[].as_of` | non-empty string | Read by: accuracy_and_sourcing; the figure's as-of date |
| `figures[].source` | non-empty string | Read by: accuracy_and_sourcing |
| `figures[].source_is_primary` | boolean | Read by: accuracy_and_sourcing; must be `true` for a complete figure to pass |
| `figures[].rederived` | boolean | Read by: accuracy_and_sourcing; must be `true` for a complete figure to pass |

#### `accuracy`

| Field | Type | Read by / notes |
|---|---|---|
| `accuracy.primary_sources_linked` | boolean | Read by: accuracy_and_sourcing |
| `accuracy.rates_and_limits_dated` | boolean | Read by: accuracy_and_sourcing |
| `accuracy.recheck_cadence_set` | boolean | Read by: accuracy_and_sourcing |

#### `risk`

| Field | Type | Read by / notes |
|---|---|---|
| `risk.risk_before_upside` | boolean | Read by: risk_framing |
| `risk.uses_past_performance` | boolean | Read by: risk_framing; gates the caveat check below |
| `risk.past_performance_caveat_present` | boolean | Read by: risk_framing; required when past performance is used; otherwise the check passes as not applicable |
| `risk.fees_visible` | boolean | Read by: risk_framing |
| `risk.taxes_visible` | boolean | Read by: risk_framing |
| `risk.return_promises_present` | boolean | Read by: risk_framing; must be `false` to pass |
| `risk.forecasts_presented_as_fact` | boolean | Read by: risk_framing; must be `false` to pass |
| `risk.survivorship_examples_used` | boolean | Read by: risk_framing; must be `false` to pass |

#### `calculators`

| Field | Type | Read by / notes |
|---|---|---|
| `calculators.includes_calculator` | boolean | Read by: calculators_and_tools; gates all four calculator checks below |
| `calculators.spec_with_formulas_present` | boolean | Read by: calculators_and_tools; required when a calculator is included; otherwise the check passes as not applicable |
| `calculators.boundary_cases_tested` | boolean | Read by: calculators_and_tools; required when a calculator is included; otherwise the check passes as not applicable |
| `calculators.assumptions_visible_in_ui` | boolean | Read by: calculators_and_tools; required when a calculator is included; otherwise the check passes as not applicable |
| `calculators.dark_patterns_present` | boolean | Read by: calculators_and_tools; must be `false` when a calculator is included; otherwise the check passes as not applicable |

#### `commercial`

| Field | Type | Read by / notes |
|---|---|---|
| `commercial.has_sponsored_or_affiliate_content` | boolean | Read by: commercial_honesty; gates the labeling check below |
| `commercial.sponsored_affiliate_hard_labeled` | boolean | Read by: commercial_honesty; required when sponsored/affiliate content exists; otherwise the check passes as not applicable |
| `commercial.conflicts_disclosed` | boolean | Read by: commercial_honesty |
| `commercial.editorial_separated_from_sales` | boolean | Read by: commercial_honesty |
| `commercial.recommendations_for_undisclosed_compensation` | boolean | Read by: commercial_honesty; must be `false` to pass |
| `commercial.fear_based_selling_present` | boolean | Read by: commercial_honesty; must be `false` to pass |

#### `compliance`

| Field | Type | Read by / notes |
|---|---|---|
| `compliance.jurisdiction_notes_file_kept` | boolean | Read by: compliance_and_corrections |
| `compliance.tools_collect_user_data` | boolean | Read by: compliance_and_corrections; gates the privacy check below |
| `compliance.privacy_rules_applied` | boolean | Read by: compliance_and_corrections; required when tools collect user data; otherwise the check passes as not applicable |
| `compliance.user_data_leaves_device_without_consent` | boolean | Read by: compliance_and_corrections; must be `false` to pass |

#### `corrections`

| Field | Type | Read by / notes |
|---|---|---|
| `corrections.correction_log_maintained` | boolean | Read by: compliance_and_corrections |
| `corrections.corrections_made` | boolean | Read by: compliance_and_corrections; gates the correction-note check below |
| `corrections.correction_note_visible_and_dated` | boolean | Read by: compliance_and_corrections; required when corrections were made; otherwise the check passes as not applicable |

Input fields documented: 43 (every row of SERVICE.md's field table(s), typed).

### Checks

Ground truth is the `checks` array in the recorded full-pass REST response: **32 checks**, grouped by section as recorded. For each check, the 'requires' column quotes the recorded `evidence` string from that response — it is the atom's own statement of what the check attests.

Per-check status semantics:

- `pass` — the evidence was present and satisfied the check. This includes gated checks that do not apply: they report `pass` with evidence explaining the non-applicability (for example 'no calculator or tool included'); there is no separate not-applicable status in the recorded responses.
- `fail` — the evidence was present but false / invalid, a must-be-false field was true, or a computed check's recomputation disagreed. Any single `fail` produces the failing verdict, regardless of missing checks.
- `missing` — the field (or list, or gate structure) was absent, so the check could not be evaluated. Missing checks never produce the failing verdict on their own; if nothing fails and at least one check is missing, the verdict is `INSUFFICIENT_EVIDENCE`.

Two checks are computed, not declared: `figures_complete_and_dated` and `figures_primary_sourced_and_rederived` are computed over every entry in `figures[]` (label, as-of date, source, primary-source flag, re-derivation flag). The response also reports `figures_evaluated` and `figures_incomplete`. All other checks read a declared boolean directly, subject to the gates in the input reference (for example the calculator checks are gated on `calculators.includes_calculator`).

#### Section `advice_boundary` — 6 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `teaches_frameworks_and_criteria` | education, not advice: teach frameworks, math, and how-to-choose criteria |
| `no_personalized_recommendations` | red line: no personalized recommendations, ever — personalized advice is licensed activity |
| `education_not_advice_disclaimer_present` | 'this is education; for your situation see a licensed advisor' included where relevant |
| `jurisdiction_context_stated` | jurisdiction context stated (CA/US contexts differ — state the context) |
| `advice_boundary_checklist_passed` | quality gate: advice-boundary checklist passed for every piece |
| `advice_like_content_flagged` | no advice-like (individualized) content declared |

#### Section `accuracy_and_sourcing` — 5 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `figures_complete_and_dated` | every figure carries a label, an as-of date, and a source (skill: date all rates/limits, 'as of <date>, source: ...') |
| `figures_primary_sourced_and_rederived` | every figure is linked to a primary source and its number re-derived (skill: re-derive every number; link primary sources — CRA/IRS/central banks) |
| `primary_sources_linked` | primary sources linked (CRA/IRS/central banks) |
| `rates_and_limits_dated` | all rates/limits dated ('as of <date>, source: ...') |
| `recheck_cadence_set` | quality gate: figures re-checked on a schedule, since figures rot faster than pages |

#### Section `risk_framing` — 7 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `risk_stated_before_upside` | risk-first framing: uncertainty and risk stated before upside |
| `past_performance_caveat_present` | no past performance used — caveat not required |
| `fees_made_visible` | fees made visible |
| `taxes_made_visible` | taxes made visible |
| `no_return_promises` | red line: never promise returns or imply guaranteed outcomes |
| `no_forecasts_as_fact` | no forecasts presented as fact |
| `no_survivorship_examples` | no survivorship examples (only-the-winners case studies) |

#### Section `calculators_and_tools` — 4 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `calculator_spec_with_formulas` | no calculator or tool included |
| `calculator_boundary_cases_tested` | no calculator or tool included |
| `calculator_assumptions_visible` | no calculator or tool included |
| `no_dark_patterns_in_tools` | no calculator or tool included |

#### Section `commercial_honesty` — 5 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `sponsored_affiliate_content_hard_labeled` | no sponsored or affiliate content declared |
| `conflicts_disclosed` | conflicts disclosed |
| `editorial_separated_from_sales` | editorial separated from sales |
| `no_recommendations_for_undisclosed_compensation` | red line: nothing 'recommended' for undisclosed compensation — no hidden compensation |
| `no_fear_based_selling` | red line: no fear-based selling |

#### Section `compliance_and_corrections` — 5 checks (full-pass section status: `pass`)

| Check | Requires to pass (recorded evidence, full-pass) |
|---|---|
| `jurisdiction_notes_file_kept` | compliance touchpoint: jurisdiction notes file kept |
| `privacy_rules_applied_to_user_data` | tools collect no user data — privacy rules not applicable |
| `no_user_data_leaves_without_consent` | red line: user financial data never leaves the device without explicit, informed consent |
| `correction_log_maintained` | quality gate: correction log maintained |
| `corrections_visible_and_dated` | no corrections declared |

### Output format

A JSON object (the REST body and the MCP structured content are the same shape):

- `service` (string, `"finance-content-compliance-check"`) and `atom_version` (string, `"0.1.0"`)
- `content` — the subject value carried through from the manifest
- `verdict` — one of the verdict values below
- `sections` — an object mapping each section name to its section status (see Verdict vocabulary)
- `checks` — an array of `{section, check, status, evidence}` objects, in section order, covering every check
- Computed count / value fields recorded in the full-pass response: `figures_evaluated`, `figures_incomplete`
- `summary` — a one-line count summary, for example the recorded full-pass summary quoted in the Tutorial
- `stamp` — a plain-text rendering of the verdict, for logs, tickets and filings

Determinism: the same manifest produces a byte-identical REST response on repeat, and MCP structured content equal to REST (both recorded in the verification battery).

### Verdict vocabulary

Every verdict value this atom can return (from SERVICE.md and the recorded responses — the recorded cases exercise all three):

| Verdict | Meaning |
|---|---|
| `COMPLIANT` | All 32 checks pass across all six sections. |
| `NON_COMPLIANT` | At least one check fails (a present field is false / invalid, or a red-line field is present). Missing evidence may also be present, but a fail takes precedence. |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but at least one check is `missing` — evidence was not declared. |

Section statuses (values of the `sections` object): `pass` (every check in the section passes, including gated checks that pass as not applicable), `fail` (at least one check in the section fails), `insufficient_evidence` (no check in the section fails, but at least one is missing).

Per-check statuses (values of `checks[].status`): `pass`, `fail`, `missing` — semantics as defined under Checks above. There is no separate not-applicable status; gated non-applicability is a `pass` whose evidence says so.

### Errors

Only error shapes evidenced in the repo / gateway documentation are listed. The 422 shape is recorded verbatim in the evidence; the other statuses are named in USER-GUIDE.md with the meanings below — no payload shape for them is recorded in the evidence, so none is invented here.

| HTTP | Meaning | Shape / notes |
|---|---|---|
| 401 | Unauthenticated — missing / invalid key | Named in USER-GUIDE.md; send `Authorization: Bearer <key>` |
| 403 | Key lacks this atom's scope | Named in USER-GUIDE.md; issue a key for this atom (contract: scope is this atom only) |
| 422 | `invalid_input` — a field has the wrong JSON type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance: field `jurisdiction`, detail "jurisdiction must be a string" |
| 429 | Rate limit exceeded | Named in USER-GUIDE.md; limits below |

### Rate limits + pricing status

- Rate limit (contract.yaml): **60 per key per minute, 10,000 per key per day**.
- Pricing (contract.yaml): `pricing.rate` is `null` (`rate_status: pending`), so the rate is: **Free during trial — rate pending.** No price is set; SERVICE.md states prices are set only from measured production cost per unit.

## Explanation

What this atom does in depth. The six sections separate concerns that fail in different ways: giving personalised advice (a licensed activity), publishing undated or unsourced figures, framing upside before risk, hiding calculator assumptions, hiding commercial interests, and mishandling user data or corrections. A piece can be accurate and still be non-compliant on commercial honesty, which is why the verdict is sectioned rather than a single score.

**How the verdict is decided — the deterministic core.** The atom is a deterministic evaluator over a declared evidence manifest: no model call, no network fetch, no clock. Each check reads named fields (Input reference), applies its gate if it has one, and lands as `pass`, `fail` or `missing`. The verdict is then a pure roll-up: any `fail` → the failing verdict; otherwise any `missing` → `INSUFFICIENT_EVIDENCE`; otherwise the passing verdict. Sections roll up the same way. That ordering matters: **an absent field is missing evidence, never a fail, and a present-but-false field is a fail, never missing** — conflating the two would either punish callers for not declaring something or let a declared violation hide as a gap.

Two checks are computed, not declared: `figures_complete_and_dated` and `figures_primary_sourced_and_rederived` are computed over every entry in `figures[]` (label, as-of date, source, primary-source flag, re-derivation flag). The response also reports `figures_evaluated` and `figures_incomplete`. All other checks read a declared boolean directly, subject to the gates in the input reference (for example the calculator checks are gated on `calculators.includes_calculator`).

**What it does NOT do:**

- It checks the caller's declared evidence only. It does not read the underlying content artifact, fetch a cited source, or re-derive a figure itself — `figures[].rederived` and `figures[].source_is_primary` are caller declarations that the computed checks test for completeness and consistency, not facts the atom independently verifies.
- It is not legal advice and not financial advice, and a `COMPLIANT` verdict is not a legal clearance. SERVICE.md frames it as 'a check over declared evidence, not legal or financial advice' (MCP tool description).
- No figure, rate or threshold is invented by the atom.
- Gated checks that do not apply (for example, no calculator included, no sponsored content declared) are reported as `pass` with evidence saying why they are not applicable — there is no separate `not_applicable` status in the recorded responses.

**Buyer / use context.** First buyer hypothesis (SERVICE.md, not yet market-tested): teams and agents working in Writing & documents who need this check on demand (first buyer hypothesis in SERVICE.md, not yet market-tested). Internal self-use (R3, passed): Think With Finance compliance content review — Wright is an internal caller at zero price, metered to the internal cost ledger. The atom sells its deliverable — the check it produces — never the underlying knowledge itself.

## Role views

### For integrators (Users)

Start with USER-GUIDE.md for the quick start, then the Tutorial and How-to guides above. Your integration surface is exactly two endpoints (REST and MCP, same manifest, same result), one scoped key, and the error table above. Pin your client to the verdict / status vocabulary and the per-check (or gaps) semantics in the Reference — those are the stable contract at atom version 0.1.0; treat `evidence` / `summary` strings as human-readable, not parse targets, except for `checks[].section`, `checks[].check` and `checks[].status` (or, for the report atom, `status`, `layers`, `counts` and `gaps`) which are machine-stable.

### For developers

Manifest authoring: author against the Input reference — every SERVICE.md field, typed, with its gates. Determinism: the core is a pure function of the manifest (Python 3, stdlib only); the same manifest yields a byte-identical REST repeat and MCP/REST parity, both recorded. Implementation: `src/finance_content_compliance_check.py` — contract entry: src/finance_content_compliance_check.py — evaluate(manifest) -> verdict dict; CLI prints JSON + stamp. Tests: tests/test_finance_content_compliance_check.py — 28 tests, all passing 2026-11-15. Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract binding rule R1).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/finance-content-compliance-check`, MCP `POST https://atoms.pipavia.com/mcp/finance-content-compliance-check` (tool `finance_content_compliance_check`). Gateway version recorded at evidence time: 1.1.0. Rate limits: 60/min and 10,000/day per key; watch for 429s as the capacity signal. Key scope: per user, per atom — a 403 spike means clients using a key without this atom's scope, not an outage. Error monitoring: separate 422s (client manifest type errors; the `field` value is the diagnostic) from verdict outcomes (200 with a failing verdict / partial status is a successful call, not an error). Status: live — release candidate, one-week RC soak to 2026-11-22; verification retest verdict PASS on 2026-11-15 (gateway 1.1.0, deployment 7f9cae9fdd60417eb72062905a066554).

### For regulators

This view is included because: Its verdict is itself compliance evidence for finance-education content in a regulated domain (advice boundary, disclosures, privacy, corrections).

What the output is, as evidence: a deterministic, reproducible judgment over a declared manifest, with per-check evidence strings, a section roll-up, a one-line summary and a plain-text stamp, produced identically over REST and MCP from the same manifest (parity recorded). What it is not: an independent inspection of the underlying reality — the manifest is caller-declared, and the limits under Explanation ('What it does NOT do') bound exactly how far the verdict can be relied on. The worked examples below are the recorded external-verification runs, reproduced verbatim, so the evidence format can be assessed against real outputs rather than samples. Verification record: TEST-REPORT.md and `verification/results/finance-content-compliance-check.json` (retest verdict PASS, 2026-11-15).

## Worked examples

Provenance: recorded 2026-11-15T23:57:40.882345+00:00 against gateway v1.1.0, external verification lane, source `verification/work/finance-content-compliance-check/evidence.json`. The three examples below are that record's `full-pass`, `violations` and `malformed` cases: each is the case's `input` followed by the REST execution's `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values identical to the record — mechanically verified, see the checklist below).

### 1. Full-pass — `full-pass` (recorded HTTP 200)

Input:

```json
{
  "content": "Investment basics for beginners.",
  "jurisdiction": "US",
  "advice_boundary": {
    "teaches_frameworks_not_recommendations": true,
    "personalized_recommendations_present": false,
    "education_not_advice_disclaimer_present": true,
    "checklist_passed": true,
    "advice_like_content_present": false,
    "advice_like_flagged_for_review": true
  },
  "figures": [
    {
      "label": "S&P 500 Avg Return",
      "as_of": "2023-12-31",
      "source": "SEC.gov",
      "source_is_primary": true,
      "rederived": true
    }
  ],
  "accuracy": {
    "primary_sources_linked": true,
    "rates_and_limits_dated": true,
    "recheck_cadence_set": true
  },
  "risk": {
    "risk_before_upside": true,
    "uses_past_performance": false,
    "past_performance_caveat_present": true,
    "fees_visible": true,
    "taxes_visible": true,
    "return_promises_present": false,
    "forecasts_presented_as_fact": false,
    "survivorship_examples_used": false
  },
  "calculators": {
    "includes_calculator": false,
    "spec_with_formulas_present": true,
    "boundary_cases_tested": true,
    "assumptions_visible_in_ui": true,
    "dark_patterns_present": false
  },
  "commercial": {
    "has_sponsored_or_affiliate_content": false,
    "sponsored_affiliate_hard_labeled": true,
    "conflicts_disclosed": true,
    "editorial_separated_from_sales": true,
    "recommendations_for_undisclosed_compensation": false,
    "fear_based_selling_present": false
  },
  "compliance": {
    "jurisdiction_notes_file_kept": true,
    "tools_collect_user_data": false,
    "privacy_rules_applied": true,
    "user_data_leaves_device_without_consent": false
  },
  "corrections": {
    "correction_log_maintained": true,
    "corrections_made": false,
    "correction_note_visible_and_dated": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "finance-content-compliance-check",
  "atom_version": "0.1.0",
  "content": "Investment basics for beginners.",
  "verdict": "COMPLIANT",
  "sections": {
    "advice_boundary": "pass",
    "accuracy_and_sourcing": "pass",
    "risk_framing": "pass",
    "calculators_and_tools": "pass",
    "commercial_honesty": "pass",
    "compliance_and_corrections": "pass"
  },
  "checks": [
    {
      "section": "advice_boundary",
      "check": "teaches_frameworks_and_criteria",
      "status": "pass",
      "evidence": "education, not advice: teach frameworks, math, and how-to-choose criteria"
    },
    {
      "section": "advice_boundary",
      "check": "no_personalized_recommendations",
      "status": "pass",
      "evidence": "red line: no personalized recommendations, ever — personalized advice is licensed activity"
    },
    {
      "section": "advice_boundary",
      "check": "education_not_advice_disclaimer_present",
      "status": "pass",
      "evidence": "'this is education; for your situation see a licensed advisor' included where relevant"
    },
    {
      "section": "advice_boundary",
      "check": "jurisdiction_context_stated",
      "status": "pass",
      "evidence": "jurisdiction context stated (CA/US contexts differ — state the context)"
    },
    {
      "section": "advice_boundary",
      "check": "advice_boundary_checklist_passed",
      "status": "pass",
      "evidence": "quality gate: advice-boundary checklist passed for every piece"
    },
    {
      "section": "advice_boundary",
      "check": "advice_like_content_flagged",
      "status": "pass",
      "evidence": "no advice-like (individualized) content declared"
    },
    {
      "section": "accuracy_and_sourcing",
      "check": "figures_complete_and_dated",
      "status": "pass",
      "evidence": "every figure carries a label, an as-of date, and a source (skill: date all rates/limits, 'as of <date>, source: ...')"
    },
    {
      "section": "accuracy_and_sourcing",
      "check": "figures_primary_sourced_and_rederived",
      "status": "pass",
      "evidence": "every figure is linked to a primary source and its number re-derived (skill: re-derive every number; link primary sources — CRA/IRS/central banks)"
    },
    {
      "section": "accuracy_and_sourcing",
      "check": "primary_sources_linked",
      "status": "pass",
      "evidence": "primary sources linked (CRA/IRS/central banks)"
    },
    {
      "section": "accuracy_and_sourcing",
      "check": "rates_and_limits_dated",
      "status": "pass",
      "evidence": "all rates/limits dated ('as of <date>, source: ...')"
    },
    {
      "section": "accuracy_and_sourcing",
      "check": "recheck_cadence_set",
      "status": "pass",
      "evidence": "quality gate: figures re-checked on a schedule, since figures rot faster than pages"
    },
    {
      "section": "risk_framing",
      "check": "risk_stated_before_upside",
      "status": "pass",
      "evidence": "risk-first framing: uncertainty and risk stated before upside"
    },
    {
      "section": "risk_framing",
      "check": "past_performance_caveat_present",
      "status": "pass",
      "evidence": "no past performance used — caveat not required"
    },
    {
      "section": "risk_framing",
      "check": "fees_made_visible",
      "status": "pass",
      "evidence": "fees made visible"
    },
    {
      "section": "risk_framing",
      "check": "taxes_made_visible",
      "status": "pass",
      "evidence": "taxes made visible"
    },
    {
      "section": "risk_framing",
      "check": "no_return_promises",
      "status": "pass",
      "evidence": "red line: never promise returns or imply guaranteed outcomes"
    },
    {
      "section": "risk_framing",
      "check": "no_forecasts_as_fact",
      "status": "pass",
      "evidence": "no forecasts presented as fact"
    },
    {
      "section": "risk_framing",
      "check": "no_survivorship_examples",
      "status": "pass",
      "evidence": "no survivorship examples (only-the-winners case studies)"
    },
    {
      "section": "calculators_and_tools",
      "check": "calculator_spec_with_formulas",
      "status": "pass",
      "evidence": "no calculator or tool included"
    },
    {
      "section": "calculators_and_tools",
      "check": "calculator_boundary_cases_tested",
      "status": "pass",
      "evidence": "no calculator or tool included"
    },
    {
      "section": "calculators_and_tools",
      "check": "calculator_assumptions_visible",
      "status": "pass",
      "evidence": "no calculator or tool included"
    },
    {
      "section": "calculators_and_tools",
      "check": "no_dark_patterns_in_tools",
      "status": "pass",
      "evidence": "no calculator or tool included"
    },
    {
      "section": "commercial_honesty",
      "check": "sponsored_affiliate_content_hard_labeled",
      "status": "pass",
      "evidence": "no sponsored or affiliate content declared"
    },
    {
      "section": "commercial_honesty",
      "check": "conflicts_disclosed",
      "status": "pass",
      "evidence": "conflicts disclosed"
    },
    {
      "section": "commercial_honesty",
      "check": "editorial_separated_from_sales",
      "status": "pass",
      "evidence": "editorial separated from sales"
    },
    {
      "section": "commercial_honesty",
      "check": "no_recommendations_for_undisclosed_compensation",
      "status": "pass",
      "evidence": "red line: nothing 'recommended' for undisclosed compensation — no hidden compensation"
    },
    {
      "section": "commercial_honesty",
      "check": "no_fear_based_selling",
      "status": "pass",
      "evidence": "red line: no fear-based selling"
    },
    {
      "section": "compliance_and_corrections",
      "check": "jurisdiction_notes_file_kept",
      "status": "pass",
      "evidence": "compliance touchpoint: jurisdiction notes file kept"
    },
    {
      "section": "compliance_and_corrections",
      "check": "privacy_rules_applied_to_user_data",
      "status": "pass",
      "evidence": "tools collect no user data — privacy rules not applicable"
    },
    {
      "section": "compliance_and_corrections",
      "check": "no_user_data_leaves_without_consent",
      "status": "pass",
      "evidence": "red line: user financial data never leaves the device without explicit, informed consent"
    },
    {
      "section": "compliance_and_corrections",
      "check": "correction_log_maintained",
      "status": "pass",
      "evidence": "quality gate: correction log maintained"
    },
    {
      "section": "compliance_and_corrections",
      "check": "corrections_visible_and_dated",
      "status": "pass",
      "evidence": "no corrections declared"
    }
  ],
  "figures_evaluated": 1,
  "figures_incomplete": 0,
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across six sections.",
  "stamp": "FINANCE CONTENT COMPLIANCE CHECK\ncontent: Investment basics for beginners.\nVERDICT: COMPLIANT\n  advice_boundary            pass\n  accuracy_and_sourcing      pass\n  risk_framing               pass\n  calculators_and_tools      pass\n  commercial_honesty         pass\n  compliance_and_corrections pass\n32 pass, 0 fail, 0 missing of 32 checks across six sections."
}
```

### 2. Violations — `violations` (recorded HTTP 200)

Input:

```json
{
  "content": "Aggressive stock picks.",
  "jurisdiction": "US",
  "advice_boundary": {
    "teaches_frameworks_not_recommendations": false,
    "personalized_recommendations_present": true,
    "education_not_advice_disclaimer_present": true,
    "checklist_passed": true,
    "advice_like_content_present": true,
    "advice_like_flagged_for_review": false
  },
  "figures": [],
  "accuracy": {
    "primary_sources_linked": true,
    "rates_and_limits_dated": true,
    "recheck_cadence_set": true
  },
  "risk": {
    "risk_before_upside": true,
    "uses_past_performance": false,
    "past_performance_caveat_present": true,
    "fees_visible": true,
    "taxes_visible": true,
    "return_promises_present": false,
    "forecasts_presented_as_fact": false,
    "survivorship_examples_used": false
  },
  "calculators": {
    "includes_calculator": false,
    "spec_with_formulas_present": true,
    "boundary_cases_tested": true,
    "assumptions_visible_in_ui": true,
    "dark_patterns_present": false
  },
  "commercial": {
    "has_sponsored_or_affiliate_content": false,
    "sponsored_affiliate_hard_labeled": true,
    "conflicts_disclosed": true,
    "editorial_separated_from_sales": true,
    "recommendations_for_undisclosed_compensation": false,
    "fear_based_selling_present": false
  },
  "compliance": {
    "jurisdiction_notes_file_kept": true,
    "tools_collect_user_data": false,
    "privacy_rules_applied": true,
    "user_data_leaves_device_without_consent": false
  },
  "corrections": {
    "correction_log_maintained": true,
    "corrections_made": false,
    "correction_note_visible_and_dated": true
  }
}
```

Response (REST `response_text`):

```json
{
  "service": "finance-content-compliance-check",
  "atom_version": "0.1.0",
  "content": "Aggressive stock picks.",
  "verdict": "NON_COMPLIANT",
  "sections": {
    "advice_boundary": "fail",
    "accuracy_and_sourcing": "insufficient_evidence",
    "risk_framing": "pass",
    "calculators_and_tools": "pass",
    "commercial_honesty": "pass",
    "compliance_and_corrections": "pass"
  },
  "checks": [
    {
      "section": "advice_boundary",
      "check": "teaches_frameworks_and_criteria",
      "status": "fail",
      "evidence": "education, not advice: teach frameworks, math, and how-to-choose criteria"
    },
    {
      "section": "advice_boundary",
      "check": "no_personalized_recommendations",
      "status": "fail",
      "evidence": "red line: no personalized recommendations, ever — personalized advice is licensed activity"
    },
    {
      "section": "advice_boundary",
      "check": "education_not_advice_disclaimer_present",
      "status": "pass",
      "evidence": "'this is education; for your situation see a licensed advisor' included where relevant"
    },
    {
      "section": "advice_boundary",
      "check": "jurisdiction_context_stated",
      "status": "pass",
      "evidence": "jurisdiction context stated (CA/US contexts differ — state the context)"
    },
    {
      "section": "advice_boundary",
      "check": "advice_boundary_checklist_passed",
      "status": "pass",
      "evidence": "quality gate: advice-boundary checklist passed for every piece"
    },
    {
      "section": "advice_boundary",
      "check": "advice_like_content_flagged",
      "status": "fail",
      "evidence": "compliance touchpoint: content that edges toward advice-like (individualized) is flagged"
    },
    {
      "section": "accuracy_and_sourcing",
      "check": "figures_complete_and_dated",
      "status": "missing",
      "evidence": "no figures declared"
    },
    {
      "section": "accuracy_and_sourcing",
      "check": "figures_primary_sourced_and_rederived",
      "status": "missing",
      "evidence": "no figures declared"
    },
    {
      "section": "accuracy_and_sourcing",
      "check": "primary_sources_linked",
      "status": "pass",
      "evidence": "primary sources linked (CRA/IRS/central banks)"
    },
    {
      "section": "accuracy_and_sourcing",
      "check": "rates_and_limits_dated",
      "status": "pass",
      "evidence": "all rates/limits dated ('as of <date>, source: ...')"
    },
    {
      "section": "accuracy_and_sourcing",
      "check": "recheck_cadence_set",
      "status": "pass",
      "evidence": "quality gate: figures re-checked on a schedule, since figures rot faster than pages"
    },
    {
      "section": "risk_framing",
      "check": "risk_stated_before_upside",
      "status": "pass",
      "evidence": "risk-first framing: uncertainty and risk stated before upside"
    },
    {
      "section": "risk_framing",
      "check": "past_performance_caveat_present",
      "status": "pass",
      "evidence": "no past performance used — caveat not required"
    },
    {
      "section": "risk_framing",
      "check": "fees_made_visible",
      "status": "pass",
      "evidence": "fees made visible"
    },
    {
      "section": "risk_framing",
      "check": "taxes_made_visible",
      "status": "pass",
      "evidence": "taxes made visible"
    },
    {
      "section": "risk_framing",
      "check": "no_return_promises",
      "status": "pass",
      "evidence": "red line: never promise returns or imply guaranteed outcomes"
    },
    {
      "section": "risk_framing",
      "check": "no_forecasts_as_fact",
      "status": "pass",
      "evidence": "no forecasts presented as fact"
    },
    {
      "section": "risk_framing",
      "check": "no_survivorship_examples",
      "status": "pass",
      "evidence": "no survivorship examples (only-the-winners case studies)"
    },
    {
      "section": "calculators_and_tools",
      "check": "calculator_spec_with_formulas",
      "status": "pass",
      "evidence": "no calculator or tool included"
    },
    {
      "section": "calculators_and_tools",
      "check": "calculator_boundary_cases_tested",
      "status": "pass",
      "evidence": "no calculator or tool included"
    },
    {
      "section": "calculators_and_tools",
      "check": "calculator_assumptions_visible",
      "status": "pass",
      "evidence": "no calculator or tool included"
    },
    {
      "section": "calculators_and_tools",
      "check": "no_dark_patterns_in_tools",
      "status": "pass",
      "evidence": "no calculator or tool included"
    },
    {
      "section": "commercial_honesty",
      "check": "sponsored_affiliate_content_hard_labeled",
      "status": "pass",
      "evidence": "no sponsored or affiliate content declared"
    },
    {
      "section": "commercial_honesty",
      "check": "conflicts_disclosed",
      "status": "pass",
      "evidence": "conflicts disclosed"
    },
    {
      "section": "commercial_honesty",
      "check": "editorial_separated_from_sales",
      "status": "pass",
      "evidence": "editorial separated from sales"
    },
    {
      "section": "commercial_honesty",
      "check": "no_recommendations_for_undisclosed_compensation",
      "status": "pass",
      "evidence": "red line: nothing 'recommended' for undisclosed compensation — no hidden compensation"
    },
    {
      "section": "commercial_honesty",
      "check": "no_fear_based_selling",
      "status": "pass",
      "evidence": "red line: no fear-based selling"
    },
    {
      "section": "compliance_and_corrections",
      "check": "jurisdiction_notes_file_kept",
      "status": "pass",
      "evidence": "compliance touchpoint: jurisdiction notes file kept"
    },
    {
      "section": "compliance_and_corrections",
      "check": "privacy_rules_applied_to_user_data",
      "status": "pass",
      "evidence": "tools collect no user data — privacy rules not applicable"
    },
    {
      "section": "compliance_and_corrections",
      "check": "no_user_data_leaves_without_consent",
      "status": "pass",
      "evidence": "red line: user financial data never leaves the device without explicit, informed consent"
    },
    {
      "section": "compliance_and_corrections",
      "check": "correction_log_maintained",
      "status": "pass",
      "evidence": "quality gate: correction log maintained"
    },
    {
      "section": "compliance_and_corrections",
      "check": "corrections_visible_and_dated",
      "status": "pass",
      "evidence": "no corrections declared"
    }
  ],
  "figures_evaluated": 0,
  "figures_incomplete": 0,
  "summary": "27 pass, 3 fail, 2 missing of 32 checks across six sections.",
  "stamp": "FINANCE CONTENT COMPLIANCE CHECK\ncontent: Aggressive stock picks.\nVERDICT: NON_COMPLIANT\n  advice_boundary            fail\n  accuracy_and_sourcing      insufficient_evidence\n  risk_framing               pass\n  calculators_and_tools      pass\n  commercial_honesty         pass\n  compliance_and_corrections pass\n27 pass, 3 fail, 2 missing of 32 checks across six sections."
}
```

### 3. Malformed — `malformed` (recorded HTTP 422)

Input:

```json
{
  "content": "Bad types",
  "jurisdiction": 123,
  "advice_boundary": "not_an_object"
}
```

Response (REST `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "jurisdiction",
  "detail": "jurisdiction must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Yes — integrators, developers, ops, regulators |
| Regulators view | Yes |
| Checks named count vs recorded count | 32 / 32 — every check in the recorded full-pass `checks` array is named in the Reference |
| Verdict vocabulary complete | Yes — 3 values listed (COMPLIANT, NON_COMPLIANT, INSUFFICIENT_EVIDENCE), plus section and per-check statuses |
| Input reference typed | Yes — 43 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/finance-content-compliance-check/evidence.json` after writing |
| Output format | CommonMark markdown |

