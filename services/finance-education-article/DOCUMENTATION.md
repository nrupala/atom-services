# Finance education article — documentation

**Finance education article** · slug `finance-education-article` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `article` "Understanding Compound Interest"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "finance-education-article"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the finance-education article-production manifest.** You declare a record of how an article was produced — the atom audits the record, it does not write the article and does not read its prose (see Explanation). The recorded full-pass manifest declares the article `Understanding Compound Interest` on the topic `Compound Interest`: the concept is explained, the framework is taught not the answer, and the article closes with what to watch, with the declared section order exactly `["concept", "worked_example", "what_to_watch"]`. It declares a worked example present with one step — `multiply` 100 × 1.05 with declared result 105.0 — and no signals: `buy_sell_signals_present`, `implied_trade_present` and `trade_execution_present` are all `false`. Disclosures are gated on `uses_data_or_assumptions: true`, with assumptions, data dates and limits all stated and `data_as_of` `2026-11-01`, and the review declarations are all `true` — education only, Think With Finance voice confirmed, plain-language review passed, and no hype confirmed.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/finance-education-article` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `ARTICLE_READY`: "19 pass, 0 fail, 0 missing of 19 checks across five sections." Every section reports `pass`, the response carries the full per-check list, and it reports `steps_evaluated` 1 and `steps_incomplete` 0.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `NOT_ARTICLE_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "finance-education-article"}`.
3. Call: `POST https://atoms.pipavia.com/v1/finance-education-article` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, `steps_evaluated`, `steps_incomplete`, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/finance-education-article` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `finance_education_article`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `NOT_ARTICLE_READY` means at least one check has status `fail`: a field is present but false/invalid, or a declared value breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 3 checks fail: `section_order_matches_skill`, `worked_example_arithmetic_correct`, `no_buy_sell_signals`, and the summary reads "16 pass, 3 fail, 0 missing of 19 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value in your manifest — in the recorded violations run, restore the section order to `["concept", "worked_example", "what_to_watch"]`, correct the worked-example step so its re-derived result matches its declared result, and declare `signals.buy_sell_signals_present` `false`. For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a number where a string is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "topic",
  "detail": "topic must be a string"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/finance-education-article` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/finance-education-article` — tool name `finance_education_article`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `finance_education_article` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `NOT_ARTICLE_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `article` | string | The article title, carried into the verdict output, not itself checked |

#### Read by: article_structure

| Field | Type | Notes |
|---|---|---|
| `topic` | non-empty string | The concept the article explains |
| `structure` | object | The structure section object — a present non-object value is rejected before evaluation |
| `structure.concept_explained` | boolean | — |
| `structure.framework_taught_not_answer` | boolean | — |
| `structure.what_to_watch_close_present` | boolean | — |
| `structure.section_order` | list of strings | Computed check — must equal exactly `["concept", "worked_example", "what_to_watch"]`, the skill's structure in order |

#### Read by: worked_example

| Field | Type | Notes |
|---|---|---|
| `worked_example` | object | The worked-example section object — a present non-object value is rejected before evaluation |
| `worked_example.present` | boolean | — |
| `worked_example.steps` | list | List of worked-example steps; absent / not a list / empty = both computed checks missing |
| `worked_example.steps[]` | object | One declared worked-example step — a present non-object entry makes the step incomplete |
| `worked_example.steps[].operation` | string | One of `add`, `subtract`, `multiply`, `divide` — any other value makes the step incomplete, not failed |
| `worked_example.steps[].operands` | list of numbers | At least one operand, at least two for `subtract`/`divide`; a zero divisor after the first operand makes the step incomplete |
| `worked_example.steps[].declared_result` | number | Compared with the re-derived result at 6-decimal formatting |

#### Read by: no_signals

| Field | Type | Notes |
|---|---|---|
| `signals` | object | The signals section object — a present non-object value is rejected before evaluation |
| `signals.buy_sell_signals_present` | boolean | must be `false` to pass |
| `signals.implied_trade_present` | boolean | must be `false` to pass |
| `signals.trade_execution_present` | boolean | must be `false` to pass |

#### Read by: disclosures

| Field | Type | Notes |
|---|---|---|
| `disclosure` | object | The disclosure section object — a present non-object value is rejected before evaluation |
| `disclosure.uses_data_or_assumptions` | boolean (gate) | Gates all four disclosure checks below |
| `disclosure.assumptions_stated` | boolean | Required when the article uses data or assumptions; otherwise the check passes as not applicable |
| `disclosure.data_dates_stated` | boolean | Required when the article uses data or assumptions; otherwise the check passes as not applicable |
| `disclosure.limits_stated` | boolean | Required when the article uses data or assumptions; otherwise the check passes as not applicable |
| `disclosure.data_as_of` | non-empty string | The article's data as-of date; required when the article uses data or assumptions, otherwise the check passes as not applicable |

#### Read by: review

| Field | Type | Notes |
|---|---|---|
| `review` | object | The review section object — a present non-object value is rejected before evaluation |
| `review.education_only_review_passed` | boolean | — |
| `review.think_with_finance_voice_confirmed` | boolean | — |
| `review.plain_language_review_passed` | boolean | — |
| `review.no_hype_confirmed` | boolean | — |

### Checks

All 19 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is declared `false` reports `pass` with evidence stating the disclosure is not applicable — that is the not-applicable outcome; a gated check whose gate is absent reports `missing` (as the recorded sparse run shows). Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: article_structure

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `topic_stated` | the article's concept/topic is stated (skill example: explain what a yield curve is) | Pass: a non-empty string is declared. Fail: it is declared empty / invalid. Missing: the field is absent. |
| `concept_explained` | structure: the concept is explained | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `framework_taught_not_answer` | teach the framework (how to think), not the answer (what to do) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `what_to_watch_close_present` | structure: the article closes with what to watch | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `section_order_matches_skill` | declared section order is concept, worked_example, what_to_watch — the skill's structure, in order | Computed over the declared record. Pass: the declared order equals exactly `["concept", "worked_example", "what_to_watch"]`. Fail: a different declared order — no partial credit. Missing: the field is absent. |

#### Section: worked_example

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `worked_example_present` | structure: the mechanics are shown with a worked example | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `worked_example_steps_complete` | every worked-example step declares an operation, operands, and a declared result | Computed over the declared steps. Pass: every declared step is complete — it declares a usable operation, operands and a declared result. Missing: `steps` is absent / not a list / empty, or a step is incomplete (missing a usable operation, operands or declared result, an operation outside `add`/`subtract`/`multiply`/`divide`, too few operands for `subtract`/`divide`, or a zero divisor) — an incomplete step is counted in `steps_incomplete`, not failed. This check has no `fail` outcome. |
| `worked_example_arithmetic_correct` | every worked-example step re-derives to its declared result at 6-decimal formatting (skill: show the mechanics with a worked example) | Computed over the declared steps. Pass: every complete step re-derives to its declared result at 6-decimal formatting. Fail: a complete step re-derives to a different result. Missing: `steps` is absent / not a list / empty, or a step is incomplete so its arithmetic cannot be verified. |

#### Section: no_signals

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_buy_sell_signals` | hard rule: no buy/sell signals — never imply a trade; no 'buy', 'sell', 'overweight' as instructions | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_implied_trade` | hard rule: never imply a trade | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_trade_execution` | hard rule: no trade execution — analysis and frameworks only | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

#### Section: disclosures

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `assumptions_stated` | disclosures: assumptions stated where relevant | Conditional on `disclosure.uses_data_or_assumptions`. Pass: the gate is declared `true` and the requirement is declared `true` — or the gate is declared `false`, in which case the check passes as not applicable and its evidence says "article declares no data or assumptions — disclosure not applicable". Fail: the gate is declared `true` and the requirement is declared `false`. Missing: the gate is declared `true` and the required field is absent, or the gate itself is absent. |
| `data_dates_stated` | disclosures: data dates stated where relevant | Conditional on `disclosure.uses_data_or_assumptions`. Pass: the gate is declared `true` and the requirement is declared `true` — or the gate is declared `false`, in which case the check passes as not applicable and its evidence says "article declares no data or assumptions — disclosure not applicable". Fail: the gate is declared `true` and the requirement is declared `false`. Missing: the gate is declared `true` and the required field is absent, or the gate itself is absent. |
| `limits_stated` | disclosures: limits stated where relevant | Conditional on `disclosure.uses_data_or_assumptions`. Pass: the gate is declared `true` and the requirement is declared `true` — or the gate is declared `false`, in which case the check passes as not applicable and its evidence says "article declares no data or assumptions — disclosure not applicable". Fail: the gate is declared `true` and the requirement is declared `false`. Missing: the gate is declared `true` and the required field is absent, or the gate itself is absent. |
| `data_as_of_stated` | disclosures: the article's data as-of date is stated | Conditional on `disclosure.uses_data_or_assumptions`. Pass: the gate is declared `true` and a non-empty string is declared — or the gate is declared `false`, in which case the check passes as not applicable and its evidence says "article declares no data or assumptions — disclosure not applicable". Fail: the gate is declared `true` and the field is declared empty / invalid. Missing: the gate is declared `true` and the field is absent, or the gate itself is absent. |

#### Section: review

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `education_only_review_passed` | review declaration: the piece is education only — the reader should understand more, not act more | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `think_with_finance_voice_confirmed` | review declaration: the piece is in the Think With Finance voice | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `plain_language_review_passed` | review declaration: concepts and analysis are explained simply | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_hype_confirmed` | review declaration: no hype | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"finance-education-article"`), `atom_version` (`"0.1.0"`), and `article` (the manifest's declared title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `steps_evaluated` and `steps_incomplete` — integers counting the worked-example steps complete enough to re-derive, and the steps missing a usable operation, operands, or declared result, or that cannot be re-derived; both are `0` when no steps are declared — they are never null.
- `summary` — a one-line count, e.g. "19 pass, 0 fail, 0 missing of 19 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared article value, verdict and per-section statuses) for human-readable records.

The response carries no `computed_status` field — unlike some sibling atoms, this atom reports its computed outcomes through the two worked-example checks and the `steps_evaluated` / `steps_incomplete` counts above.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `ARTICLE_READY` — all 19 checks pass: the declared article-production record is complete and consistent with the skill's structure, worked-example, no-signals, disclosure and review requirements.
- `NOT_ARTICLE_READY` — at least one check fails: a declared value or a computed rule contradicts a requirement. The failing checks name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**Computed counts** (the response's only secondary computed fields — there is no `computed_status` field on this atom): `steps_evaluated` — the number of worked-example steps complete enough to re-derive (an integer, `0` when no steps are declared); `steps_incomplete` — the number of steps missing a usable operation, operands, or declared result, or that cannot be re-derived (an integer, `0` when no steps are declared).

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was declared `false` — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent, or — for the two computed worked-example checks and the gated disclosure checks — the steps or gate the check reads are absent or incomplete as described under Checks.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the finance_education_article scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the finance_education_article scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"topic","detail":"topic must be a string"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for finance-education-article exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Finance education content, no signals (Think With Finance), as bound from the `finance-content` skill. You submit one declared record — the finance-education article-production manifest — and the atom audits that record for completeness and internal consistency against the bound skill: whether the declared record shows an article built the way that skill prescribes — its structure in the skill's order, its mechanics shown in a worked example whose arithmetic re-derives, no buy/sell signals and no trade execution, the article's own disclosures (assumptions, data dates, limits), and the education-only review declarations — returning one deterministic verdict across 5 sections (`article_structure`, `worked_example`, `no_signals`, `disclosures`, `review`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. It is distinct from the live sibling `finance-content-compliance-check`, which audits the **compliance posture** of finance content: the check sets do not duplicate — no sibling check (personalized-recommendation, disclaimer, figure sourcing/re-derivation, risk framing, calculator, commercial, correction or privacy check) appears here, and no check here appears there.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for the three no-signals anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared record itself — the declared section order is compared with the skill's structure (concept, worked example, what-to-watch), and every complete worked-example step is re-derived from its declared operands and operation and compared with its declared result at 6-decimal formatting; the verdict also reports `steps_evaluated` and `steps_incomplete` counts. *Conditional checks* — the four disclosure checks — bind only when `disclosure.uses_data_or_assumptions` is declared `true`; when that gate is declared `false` they pass as not applicable, and when the gate itself is absent they report `missing`. Aggregation is strict: any `fail` anywhere produces `NOT_ARTICLE_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `ARTICLE_READY`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states none of the following, so the atom sets none of them: no article length threshold — no minimum or maximum word count, in the skill or here; no readability / reading-level score — "explained simply" is a reviewer declaration, never a computed score; no freshness window for data dates — the skill requires data dates to be stated, it sets no maximum age, so an old-but-stated date passes and only an unstated or empty date fails; no minimum source count and no per-figure sourcing rule — the skill for this atom states no sourcing count, and per-figure sourcing is the sibling compliance atom's ground, deliberately not duplicated here; no arithmetic tolerance beyond 6-decimal formatting — steps re-derive exactly at the fleet's 6-decimal formatting, with no looser percentage or absolute tolerance grounded in the skill; and no partial credit for section order — the skill gives one structure in one order, so a different declared order fails, with no near-miss band.

**What it does NOT do.** The atom audits a **declared** record: a verdict of `ARTICLE_READY` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares the required acts passes those checks even if the real work did none of it. It writes no article; it audits the declared article-production record only, and it never reads the article's prose. Writing quality, clarity, pedagogy, Think With Finance voice fidelity, whether the framework is genuinely taught rather than an answer given, and whether prose in fact implies a trade are judgment-shaped and cannot be decided from declared fields: they enter this atom only as caller/reviewer declarations (`review.*`, `structure.framework_taught_not_answer`, `signals.*`) — the atom records and verdicts those declarations, it never judges the prose itself and never claims to have read the article. It is not the sibling compliance audit: it does not check the advice-vs-licensing boundary, risk framing, calculators and tools, commercial honesty, corrections or privacy.

**Buyer and use context.** Teams and agents working in Money & markets who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Think With Finance article production — Wright is an internal caller on this atom (zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the article proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared article-production record for readiness against the finance-content skill; its verdict is an article-readiness judgment, not compliance or audit evidence, and the compliance posture of finance-education content is the sibling atom finance-content-compliance-check's ground, not this atom's. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `finance_education_article` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; worked-example arithmetic is compared at 6-decimal formatting, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/finance_education_article.py` (Python oracle, `evaluate(manifest) -> verdict dict`) with the TypeScript port at `rails/gateway/src/atoms/finance-education-article.ts`; tests: `tests/test_finance_education_article.py` in this atom's directory (31 tests per contract.yaml), the TypeScript port's 38 tests, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/finance-education-article` (REST) and `POST /mcp/finance-education-article` (MCP, tool `finance_education_article`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `finance_education_article`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T04:26:31.524719+00:00 against gateway v1.1.0, external verification lane, source `verification/work/finance-education-article/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "article": "Understanding Compound Interest",
  "topic": "Compound Interest",
  "structure": {
    "concept_explained": true,
    "framework_taught_not_answer": true,
    "what_to_watch_close_present": true,
    "section_order": [
      "concept",
      "worked_example",
      "what_to_watch"
    ]
  },
  "worked_example": {
    "present": true,
    "steps": [
      {
        "operation": "multiply",
        "operands": [
          100,
          1.05
        ],
        "declared_result": 105.0
      }
    ]
  },
  "signals": {
    "buy_sell_signals_present": false,
    "implied_trade_present": false,
    "trade_execution_present": false
  },
  "disclosure": {
    "uses_data_or_assumptions": true,
    "assumptions_stated": true,
    "data_dates_stated": true,
    "limits_stated": true,
    "data_as_of": "2026-11-01"
  },
  "review": {
    "education_only_review_passed": true,
    "think_with_finance_voice_confirmed": true,
    "plain_language_review_passed": true,
    "no_hype_confirmed": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "finance-education-article",
  "atom_version": "0.1.0",
  "article": "Understanding Compound Interest",
  "verdict": "ARTICLE_READY",
  "sections": {
    "article_structure": "pass",
    "worked_example": "pass",
    "no_signals": "pass",
    "disclosures": "pass",
    "review": "pass"
  },
  "checks": [
    {
      "section": "article_structure",
      "check": "topic_stated",
      "status": "pass",
      "evidence": "the article's concept/topic is stated (skill example: explain what a yield curve is)"
    },
    {
      "section": "article_structure",
      "check": "concept_explained",
      "status": "pass",
      "evidence": "structure: the concept is explained"
    },
    {
      "section": "article_structure",
      "check": "framework_taught_not_answer",
      "status": "pass",
      "evidence": "teach the framework (how to think), not the answer (what to do)"
    },
    {
      "section": "article_structure",
      "check": "what_to_watch_close_present",
      "status": "pass",
      "evidence": "structure: the article closes with what to watch"
    },
    {
      "section": "article_structure",
      "check": "section_order_matches_skill",
      "status": "pass",
      "evidence": "declared section order is concept, worked_example, what_to_watch \u2014 the skill's structure, in order"
    },
    {
      "section": "worked_example",
      "check": "worked_example_present",
      "status": "pass",
      "evidence": "structure: the mechanics are shown with a worked example"
    },
    {
      "section": "worked_example",
      "check": "worked_example_steps_complete",
      "status": "pass",
      "evidence": "every worked-example step declares an operation, operands, and a declared result"
    },
    {
      "section": "worked_example",
      "check": "worked_example_arithmetic_correct",
      "status": "pass",
      "evidence": "every worked-example step re-derives to its declared result at 6-decimal formatting (skill: show the mechanics with a worked example)"
    },
    {
      "section": "no_signals",
      "check": "no_buy_sell_signals",
      "status": "pass",
      "evidence": "hard rule: no buy/sell signals \u2014 never imply a trade; no 'buy', 'sell', 'overweight' as instructions"
    },
    {
      "section": "no_signals",
      "check": "no_implied_trade",
      "status": "pass",
      "evidence": "hard rule: never imply a trade"
    },
    {
      "section": "no_signals",
      "check": "no_trade_execution",
      "status": "pass",
      "evidence": "hard rule: no trade execution \u2014 analysis and frameworks only"
    },
    {
      "section": "disclosures",
      "check": "assumptions_stated",
      "status": "pass",
      "evidence": "disclosures: assumptions stated where relevant"
    },
    {
      "section": "disclosures",
      "check": "data_dates_stated",
      "status": "pass",
      "evidence": "disclosures: data dates stated where relevant"
    },
    {
      "section": "disclosures",
      "check": "limits_stated",
      "status": "pass",
      "evidence": "disclosures: limits stated where relevant"
    },
    {
      "section": "disclosures",
      "check": "data_as_of_stated",
      "status": "pass",
      "evidence": "disclosures: the article's data as-of date is stated"
    },
    {
      "section": "review",
      "check": "education_only_review_passed",
      "status": "pass",
      "evidence": "review declaration: the piece is education only \u2014 the reader should understand more, not act more"
    },
    {
      "section": "review",
      "check": "think_with_finance_voice_confirmed",
      "status": "pass",
      "evidence": "review declaration: the piece is in the Think With Finance voice"
    },
    {
      "section": "review",
      "check": "plain_language_review_passed",
      "status": "pass",
      "evidence": "review declaration: concepts and analysis are explained simply"
    },
    {
      "section": "review",
      "check": "no_hype_confirmed",
      "status": "pass",
      "evidence": "review declaration: no hype"
    }
  ],
  "steps_evaluated": 1,
  "steps_incomplete": 0,
  "summary": "19 pass, 0 fail, 0 missing of 19 checks across five sections.",
  "stamp": "FINANCE EDUCATION ARTICLE\narticle: Understanding Compound Interest\nVERDICT: ARTICLE_READY\n  article_structure          pass\n  worked_example             pass\n  no_signals                 pass\n  disclosures                pass\n  review                     pass\n19 pass, 0 fail, 0 missing of 19 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "article": "Understanding Compound Interest",
  "topic": "Compound Interest",
  "structure": {
    "concept_explained": true,
    "framework_taught_not_answer": true,
    "what_to_watch_close_present": true,
    "section_order": [
      "concept",
      "what_to_watch",
      "worked_example"
    ]
  },
  "worked_example": {
    "present": true,
    "steps": [
      {
        "operation": "add",
        "operands": [
          1,
          1
        ],
        "declared_result": 999.0
      }
    ]
  },
  "signals": {
    "buy_sell_signals_present": true,
    "implied_trade_present": false,
    "trade_execution_present": false
  },
  "disclosure": {
    "uses_data_or_assumptions": true,
    "assumptions_stated": true,
    "data_dates_stated": true,
    "limits_stated": true,
    "data_as_of": "2026-11-01"
  },
  "review": {
    "education_only_review_passed": true,
    "think_with_finance_voice_confirmed": true,
    "plain_language_review_passed": true,
    "no_hype_confirmed": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "finance-education-article",
  "atom_version": "0.1.0",
  "article": "Understanding Compound Interest",
  "verdict": "NOT_ARTICLE_READY",
  "sections": {
    "article_structure": "fail",
    "worked_example": "fail",
    "no_signals": "fail",
    "disclosures": "pass",
    "review": "pass"
  },
  "checks": [
    {
      "section": "article_structure",
      "check": "topic_stated",
      "status": "pass",
      "evidence": "the article's concept/topic is stated (skill example: explain what a yield curve is)"
    },
    {
      "section": "article_structure",
      "check": "concept_explained",
      "status": "pass",
      "evidence": "structure: the concept is explained"
    },
    {
      "section": "article_structure",
      "check": "framework_taught_not_answer",
      "status": "pass",
      "evidence": "teach the framework (how to think), not the answer (what to do)"
    },
    {
      "section": "article_structure",
      "check": "what_to_watch_close_present",
      "status": "pass",
      "evidence": "structure: the article closes with what to watch"
    },
    {
      "section": "article_structure",
      "check": "section_order_matches_skill",
      "status": "fail",
      "evidence": "declared section order is concept, worked_example, what_to_watch \u2014 the skill's structure, in order"
    },
    {
      "section": "worked_example",
      "check": "worked_example_present",
      "status": "pass",
      "evidence": "structure: the mechanics are shown with a worked example"
    },
    {
      "section": "worked_example",
      "check": "worked_example_steps_complete",
      "status": "pass",
      "evidence": "every worked-example step declares an operation, operands, and a declared result"
    },
    {
      "section": "worked_example",
      "check": "worked_example_arithmetic_correct",
      "status": "fail",
      "evidence": "every worked-example step re-derives to its declared result at 6-decimal formatting (skill: show the mechanics with a worked example)"
    },
    {
      "section": "no_signals",
      "check": "no_buy_sell_signals",
      "status": "fail",
      "evidence": "hard rule: no buy/sell signals \u2014 never imply a trade; no 'buy', 'sell', 'overweight' as instructions"
    },
    {
      "section": "no_signals",
      "check": "no_implied_trade",
      "status": "pass",
      "evidence": "hard rule: never imply a trade"
    },
    {
      "section": "no_signals",
      "check": "no_trade_execution",
      "status": "pass",
      "evidence": "hard rule: no trade execution \u2014 analysis and frameworks only"
    },
    {
      "section": "disclosures",
      "check": "assumptions_stated",
      "status": "pass",
      "evidence": "disclosures: assumptions stated where relevant"
    },
    {
      "section": "disclosures",
      "check": "data_dates_stated",
      "status": "pass",
      "evidence": "disclosures: data dates stated where relevant"
    },
    {
      "section": "disclosures",
      "check": "limits_stated",
      "status": "pass",
      "evidence": "disclosures: limits stated where relevant"
    },
    {
      "section": "disclosures",
      "check": "data_as_of_stated",
      "status": "pass",
      "evidence": "disclosures: the article's data as-of date is stated"
    },
    {
      "section": "review",
      "check": "education_only_review_passed",
      "status": "pass",
      "evidence": "review declaration: the piece is education only \u2014 the reader should understand more, not act more"
    },
    {
      "section": "review",
      "check": "think_with_finance_voice_confirmed",
      "status": "pass",
      "evidence": "review declaration: the piece is in the Think With Finance voice"
    },
    {
      "section": "review",
      "check": "plain_language_review_passed",
      "status": "pass",
      "evidence": "review declaration: concepts and analysis are explained simply"
    },
    {
      "section": "review",
      "check": "no_hype_confirmed",
      "status": "pass",
      "evidence": "review declaration: no hype"
    }
  ],
  "steps_evaluated": 1,
  "steps_incomplete": 0,
  "summary": "16 pass, 3 fail, 0 missing of 19 checks across five sections.",
  "stamp": "FINANCE EDUCATION ARTICLE\narticle: Understanding Compound Interest\nVERDICT: NOT_ARTICLE_READY\n  article_structure          fail\n  worked_example             fail\n  no_signals                 fail\n  disclosures                pass\n  review                     pass\n16 pass, 3 fail, 0 missing of 19 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "article": "Malformed Input",
  "topic": 123
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "topic",
  "detail": "topic must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared article-production record for readiness against the finance-content skill; its verdict is an article-readiness judgment, not compliance or audit evidence, and the compliance posture of finance-education content is the sibling atom finance-content-compliance-check's ground, not this atom's. |
| Checks named | 19 documented / 19 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`), plus the computed counts `steps_evaluated` / `steps_incomplete` (no `computed_status` field on this atom) |
| Input reference typed | Yes — 29 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/finance-education-article/evidence.json` |
