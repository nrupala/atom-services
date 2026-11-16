# Test report — rag-retrieval-evaluation-tuning

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw. The undersigned verification lane re-checked every
judgment against the raw evidence before disposition (one tester error
and one Gemini misread were caught and corrected — see below).
**Second tester:** DeepSeek (independent recomputation — see its section
below).
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/rag-retrieval-evaluation-tuning/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`; DeepSeek raw:
`deepseek-raw.txt`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — all evidence true, one golden query with perfect retrieval (recall/MRR/nDCG all 1.0 vs thresholds 1.0) | HTTP 200, verdict `RAG_EVALUATION_SOUND`, 36/36 checks pass, mean metrics `1.0000` | HTTP 200, `RAG_EVALUATION_SOUND`, "36 pass, 0 fail, 0 missing", metrics `mean_recall_at_k=1.0000`, `mean_mrr=1.0000`, `mean_ndcg_at_k=1.0000`, leaked 0 | PASS (after tester-error correction, below) |
| 2 | violations — query retrieves a forbidden doc, context 2000 tokens vs budget 500 | HTTP 200, verdict `RAG_EVALUATION_UNSOUND`, leakage + context-budget + golden-metrics checks fail | HTTP 200, `RAG_EVALUATION_UNSOUND`, exactly those 3 checks fail, metrics 0.0000 / 0.0000 / 0.0000, `leaked_doc_count=1` (33 other checks missing — the case declares only the violating evidence, by design) | PASS |
| 3 | sparse — only `system` named | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 36 missing, metrics null | PASS |
| 4 | malformed — `corpus: "this-should-be-an-object"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 36 missing) — the type-violating value was evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `rag_retrieval_evaluation_tuning`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full
response carries all 36 checks and a text stamp):

```json
{"service":"rag-retrieval-evaluation-tuning","atom_version":"0.1.0","system":"production-search-v1","verdict":"RAG_EVALUATION_SOUND","sections":{"corpus_and_chunking":"pass","hybrid_retrieval":"pass","reranking_and_filters":"pass","index_hygiene":"pass","evaluation":"pass","serving_and_privacy":"pass"},"metrics":{"queries_total":1,"queries_meeting_thresholds":1,"mean_recall_at_k":"1.0000","mean_mrr":"1.0000","mean_ndcg_at_k":"1.0000","leaked_doc_count":0},"summary":"36 pass, 0 fail, 0 missing of 36 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding):

```json
{"service":"rag-retrieval-evaluation-tuning","atom_version":"0.1.0","system":null,"verdict":"INSUFFICIENT_EVIDENCE","sections":{"corpus_and_chunking":"insufficient_evidence","hybrid_retrieval":"insufficient_evidence","reranking_and_filters":"insufficient_evidence","index_hygiene":"insufficient_evidence","evaluation":"insufficient_evidence","serving_and_privacy":"insufficient_evidence"},"summary":"0 pass, 0 fail, 36 missing of 36 checks across six sections."}
```

## Tester error — corrected, not an atom failure

Gemini's original full-pass case declared the golden query's
`relevance_grades` as a **list** (`[1]`). SERVICE.md defines the grade
as the declared `relevance_grades` value for a doc ("unlisted = 0") —
i.e. an **object mapping doc id → grade** — and the atom treated the
list form as incomplete metric evidence: the first run returned
`INSUFFICIENT_EVIDENCE` with the golden-metrics check `missing` and all
mean metrics `null`. The case was corrected to
`relevance_grades: {"doc1": 1}`, steps 2–3 were re-run, and the
corrected run passes in full (table above). **1 tester error, recorded
as such — never as an atom failure.**

Related correction: Gemini's *first* judgment reported the computed
spot checks as matching at `1.0000` while the (uncorrected) recorded
artifact actually carried `null` metrics — a misread of the raw output.
After the case correction and re-judgment, Gemini's computed checks
match the recorded artifact. The misread is noted here per disposition
rules; it changed no outcome.

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `corpus` as a string instead of an object. Expected
(test doctrine for this program + the gateway's `invalid_input`
mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with
an `INSUFFICIENT_EVIDENCE` verdict computed over the garbage value.
The atom's handler does not validate manifest field types before
evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/rag-retrieval-evaluation-tuning.md`.
Retest on redeploy.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from
the case inputs by hand (recall@k, reciprocal rank and nDCG@k per
golden query from the declared relevant/retrieved lists and grades;
scope-leakage count; context-budget comparison) and verified the
artifact's numbers and verdicts. Raw output:
`verification/work/rag-retrieval-evaluation-tuning/deepseek-raw.txt`.

**DeepSeek verdict: FAIL** — the same single defect finding
(malformed input returns HTTP 200 with a verdict instead of HTTP 422).

Its computed checks (all match):

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass q1 recall@1 | 1.0000 | 1.0000 | ✓ |
| full-pass q1 reciprocal rank (MRR) | 1.0000 | 1.0000 | ✓ |
| full-pass q1 nDCG@1 (DCG 1 / IDCG 1) | 1.0000 | 1.0000 | ✓ |
| violations q_fail recall@1 / MRR / nDCG@1 | 0.0000 / 0.0000 / 0.0000 | 0.0000 / 0.0000 / 0.0000 | ✓ |
| violations leaked_doc_count | 1 | 1 | ✓ |
| violations context budget | 2000 > 500 → fail | fail | ✓ |

Note on form: DeepSeek's raw output also lists the violations,
full-pass and sparse cases under its `findings` array, but each of
those entries concludes the artifact **matches** its hand recomputation
— they are confirmations, not defects. Only the malformed entry is a
defect finding.

**Agreement:** full on substance. DeepSeek and Gemini agree on the
verdict, on the single defect, and on every recomputed metric. No
disagreement to disposition.

## Final verdict

**FAIL** — verdict logic and the computed retrieval metrics are exact
on the valid cases (confirmed by two independent testers),
determinism and MCP/REST parity hold; the single defect is F1
(malformed-input handling). One tester error was corrected during the
run (see above).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health 200), deployment 7f9cae9fdd60417eb72062905a066554. Full recorded battery re-run live via `verification/harness.py` against the unchanged `cases.json`; Wave 1 evidence/judgment preserved as `evidence-wave1.json` / `judgment-wave1.json`. No HTTP 429 was encountered. Gemini judge re-run on the new evidence (`judgment.json`); mechanical verification from the new `evidence.json` governs where testers and evidence conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `RAG_EVALUATION_SOUND`, mean recall/MRR/nDCG = 1.0000 each | HTTP 200, verdict `RAG_EVALUATION_SOUND`, 36/36 checks pass, metrics 1.0000 / 1.0000 / 1.0000, leaked_doc_count = 0 | PASS |
| 2 | violations | HTTP 200, verdict `RAG_EVALUATION_UNSOUND`, failing sections reranking_and_filters + evaluation | HTTP 200, verdict `RAG_EVALUATION_UNSOUND`, sections reranking_and_filters = fail, evaluation = fail, metrics 0.0000 each, leaked_doc_count = 1 | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE`, 36 checks missing, metrics null | PASS |
| 4 | malformed | HTTP 422 `invalid_input` (corpus must be an object) | HTTP 422, `{ok:false, error:"invalid_input", field:"corpus"}` — no verdict artifact | PASS |
| 5 | determinism | REST repeat byte-identical | `determinism_byte_identical: true` | PASS |
| 6 | parity | MCP structuredContent deep-equals REST artifact | `parity_structured_equal: true` | PASS |

F1 disposition: **CLOSED**. Wave 1: `corpus` as a string returned HTTP 200 with an `INSUFFICIENT_EVIDENCE` verdict. Retest: the same malformed case returns HTTP 422 `{ok:false, error:"invalid_input", field:"corpus"}` ("corpus must be an object") and no verdict is produced. Mechanical check of the new evidence: malformed status == 422 and body error == "invalid_input" — confirmed. Retrieval metrics on the valid cases are unchanged and exact.

### Second tester — DeepSeek (retest)

**Second tester:** DeepSeek via the house `custom.legacy-deepseek` connector (`ds_chat.py`) — independent second read mirroring the Wave 1 scope, given SERVICE.md's computed rules, the `cases.json` inputs and the NEW evidence artifacts (full-pass and violations), and instructed to recompute the headline computed quantities by hand and show its arithmetic. Raw output: `verification/work/rag-retrieval-evaluation-tuning/deepseek-retest-raw.txt`.

**DeepSeek verdict: PASS** — no defects. DeepSeek's `findings` array lists per-case confirmations (expected = actual), not defects. All 10 computed checks match.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass mean recall@k / MRR / nDCG@k | 1.0000 / 1.0000 / 1.0000 | 1.0000 / 1.0000 / 1.0000 | ✓ |
| full-pass leaked_doc_count | 0 | 0 | ✓ |
| violations mean recall@k / MRR / nDCG@k | 0.0000 / 0.0000 / 0.0000 | 0.0000 / 0.0000 / 0.0000 | ✓ |
| violations leaked_doc_count | 1 | 1 | ✓ |
| violations context budget | 2000 > 500 → fail | fail | ✓ |
| malformed HTTP + error | 422 / invalid_input | 422 / invalid_input | ✓ |

**Agreement:** DeepSeek agrees with Gemini (retest verdict PASS, findings: none) on the verdict and on every recomputed quantity. No disagreement to disposition.

**Tester errors this wave:** none

**Retest verdict: PASS**
