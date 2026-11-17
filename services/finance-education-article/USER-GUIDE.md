# Finance education article — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a finance-education article and a record of how it was produced. This atom reads one declared manifest and returns one deterministic verdict across five sections: **ARTICLE_READY**, **NOT_ARTICLE_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared article-production record only — it writes no article, reads no article prose, and does not judge writing quality, clarity, pedagogy, or voice fidelity; those enter only as caller/reviewer declarations. It is distinct from the compliance sibling: it checks whether the record shows an article built the way the finance-content skill prescribes — its structure in the skill's order, its mechanics shown in a worked example whose arithmetic re-derives, no buy/sell signals and no trade execution, the article's own disclosures (assumptions, data dates, limits), and the education-only review declarations. Computed checks: the declared `structure.section_order` must equal exactly `["concept", "worked_example", "what_to_watch"]`, and every complete worked-example step is re-derived from its declared operands and operation and compared with its declared result at 6-decimal formatting; the verdict also reports `steps_evaluated` and `steps_incomplete`. Four disclosure checks are conditional: they are required only when `disclosure.uses_data_or_assumptions` is true; otherwise they pass as not applicable. No threshold is imposed — no article length, no readability/reading-level score, no freshness window for data dates, no minimum source count, no arithmetic tolerance beyond 6-decimal formatting, and no partial credit for section order. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "finance-education-article"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/finance-education-article` — tool name `finance_education_article`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/finance-education-article` — body = the manifest object; same `Authorization` header.

## Input — the finance-education-article manifest

| Field | Meaning |
|---|---|
| `article` | article title (string; carried into the verdict output, not itself checked) |
| `topic` | the concept the article explains (non-empty string) |
| `structure.concept_explained` | structure evidence: the concept is explained |
| `structure.framework_taught_not_answer` | structure evidence: the framework is taught, not the answer given |
| `structure.what_to_watch_close_present` | structure evidence: the article closes with what to watch |
| `structure.section_order` (list of strings) | computed: must equal exactly `["concept", "worked_example", "what_to_watch"]`, the skill's structure in order |
| `worked_example.present` | worked-example evidence: the mechanics are shown with a worked example |
| `worked_example.steps` (list of steps) | computed: absent / not a list / empty = both computed worked-example checks missing; reported via `steps_evaluated` / `steps_incomplete` |
| `worked_example.steps[].operation` (string) | one of `add`, `subtract`, `multiply`, `divide` — any other value makes the step incomplete, not failed |
| `worked_example.steps[].operands` (list of numbers) | at least one operand, at least two for `subtract`/`divide`; a zero divisor after the first operand makes the step incomplete |
| `worked_example.steps[].declared_result` (number) | compared with the re-derived result at 6-decimal formatting |
| `signals.buy_sell_signals_present` | must be `false` to pass |
| `signals.implied_trade_present` | must be `false` to pass |
| `signals.trade_execution_present` | must be `false` to pass |
| `disclosure.uses_data_or_assumptions` | gate: declares whether the article uses data or assumptions; gates all four disclosure checks below |
| `disclosure.assumptions_stated` | required `true` only when `disclosure.uses_data_or_assumptions` is `true`; otherwise passes as not applicable |
| `disclosure.data_dates_stated` | required `true` only when `disclosure.uses_data_or_assumptions` is `true`; otherwise passes as not applicable |
| `disclosure.limits_stated` | required `true` only when `disclosure.uses_data_or_assumptions` is `true`; otherwise passes as not applicable |
| `disclosure.data_as_of` (non-empty string) | the article's data as-of date; required only when `disclosure.uses_data_or_assumptions` is `true`; otherwise passes as not applicable |
| `review.education_only_review_passed` | review declaration: the piece is education only |
| `review.think_with_finance_voice_confirmed` | review declaration: the piece is in the Think With Finance voice |
| `review.plain_language_review_passed` | review declaration: concepts are explained simply / plain language |
| `review.no_hype_confirmed` | review declaration: no hype |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward NOT_ARTICLE_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/finance-education-article`:

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

Response — HTTP 200 (trimmed; the full response carries all 19 checks and a text stamp of the verdict):

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
  "steps_evaluated": 1,
  "steps_incomplete": 0,
  "summary": "19 pass, 0 fail, 0 missing of 19 checks across five sections."
}
```

## Verdicts

- **ARTICLE_READY** — every check passes; the declared article-production record is complete and consistent with the skill's structure, worked-example, no-signals, disclosure and review requirements.
- **NOT_ARTICLE_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `steps_evaluated` and `steps_incomplete` (integers counting the worked-example steps complete enough to re-derive, and the steps missing a usable operation, operands, or declared result, or that cannot be re-derived; both are `0` when no steps are declared — they are never null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
