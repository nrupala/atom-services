# Argument analysis review — `argument-analysis-review`

**Argument analysis review** · slug `argument-analysis-review` · deliverable type REVIEW · atom version 0.1.0 · status live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is from that recording.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "argument-analysis-review"}`. Send the key as `Authorization: Bearer <key>` on every call.
2. **Assemble the manifest.** The manifest is one JSON object: a declared record for one argument. In the recorded run the argument is `All men are mortal; Socrates is a man; therefore Socrates is mortal.` — an argument-analysis record for the syllogism below — anatomy and steelman, evidence weighing, base rates and calibration (confidence 75), stress testing, fallacy and bias screening, razors and countercase. Build yours field by field from the Input reference below; leave a field out only if you want it reported as missing evidence.
3. **Call the atom.** `POST https://atoms.pipavia.com/v1/argument-analysis-review` with the manifest as the body and the `Authorization` header set (see How-to guides for the MCP form of the same call).
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `ARGUMENT_ANALYSIS_COMPLETE`: 24 pass, 0 fail, 0 missing of 24 checks across six sections. Every section status is `pass` and every check status is `pass`.
5. **Use the detail.** The `checks` array names each of the 24 checks with its section and the evidence it read; `summary` counts pass / fail / missing; `stamp` is the same verdict as a plain-text stamp you can paste into a record. If any check had failed or been missing, the verdict, the section statuses and the check statuses would name exactly which — that is the subject of the third how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "argument-analysis-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call: `POST https://atoms.pipavia.com/v1/argument-analysis-review` — body = the manifest object (see Input reference). The response is the verdict object (see Output format).

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/argument-analysis-review` with the same `Authorization: Bearer <key>` header, and call the tool `argument_analysis_review`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same verdict object the REST face returns (external verification confirmed MCP/REST parity on the full-pass case; see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

A verdict other than `ARGUMENT_ANALYSIS_COMPLETE` is not an error — it is the deliverable doing its job. Read it in this order:

1. **Verdict.** `ARGUMENT_ANALYSIS_DEFICIENT` — At least one check fails; the failing checks name the breached section and the evidence against it. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing.
2. **Sections.** The `sections` object gives one status per section: `pass`, `fail`, or `insufficient_evidence`. Start with the sections that are not `pass`.
3. **Checks.** In the `checks` array, find entries with status `fail` (a field was present but did not meet the requirement — for a must-be-`false` field, it was declared `true`; for a computed check, the declared values did not satisfy the computed rule) and entries with status `missing` (the supporting field was absent from the manifest). Each check's `evidence` string states what the check requires.
4. **Fix the manifest, not the verdict.** For a `fail`, correct the declared value in the underlying record, then redeclare it truthfully. For a `missing`, supply the absent field. Then resubmit the whole manifest — the atom is stateless and deterministic, so the same manifest always returns the same verdict.
Worked example 2 below is a real failing run of this atom: verdict `ARGUMENT_ANALYSIS_DEFICIENT`, 20 pass, 4 fail, 0 missing of 24 checks across six sections. The failing checks are: `anecdote_not_treated_as_data`, `confidence_probabilistic_and_explicit`, `all_listed_fallacies_screened`, `all_listed_biases_screened`.

### Handle a 422 invalid_input

A type error is rejected before any check runs — you get HTTP 422, never a verdict. The recorded malformed run for this atom (Worked example 3) returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "anatomy.premises_identified",
  "detail": "anatomy.premises_identified must be a boolean"
}
```

`field` names the offending field (`anatomy.premises_identified`) and `detail` states the expected type ("anatomy.premises_identified must be a boolean"). Fix that field's type in the manifest — consult the Input reference for each field's type — and resubmit. Do not drop the field to silence the 422 unless you intend it to be reported as missing evidence instead.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/argument-analysis-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/argument-analysis-review` — tool name `argument_analysis_review`; `tools/call` arguments = the manifest object.
- **Keys:** sign up via `POST /v1/signup`, then `POST /v1/keys` with `{"atom": "argument-analysis-review"}`. Key scope: this atom only — a key's scope for one atom never verifies for another (per `contract.yaml`, keys are per user, per atom; the key itself is regenerated on demand after authentication and never stored).

### Input reference

The manifest is one JSON object with 25 fields. All fields are booleans unless a different type is stated in the Type column. A field **absent** = evidence missing (counts toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them).

#### Top level

| Field | Type | Notes |
|---|---|---|
| `argument` | string | string; carried into the verdict output, not itself checked |

#### `anatomy_and_steelman`

| Field | Type | Notes |
|---|---|---|
| `anatomy.premises_identified` | boolean | — |
| `anatomy.conclusion_identified` | boolean | — |
| `anatomy.validity_distinguished_from_soundness` | boolean | — |
| `anatomy.steelman_stated` | boolean | — |

#### `evidence_weighing`

| Field | Type | Notes |
|---|---|---|
| `evidence.source_quality_assessed` | boolean | — |
| `evidence.sample_size_considered` | boolean | — |
| `evidence.confounders_considered` | boolean | — |
| `evidence.replication_considered` | boolean | — |
| `evidence.anecdote_treated_as_data` | boolean | must be `false` to pass |

#### `base_rates_and_calibration`

| Field | Type | Notes |
|---|---|---|
| `calibration.base_rate_stated` | boolean | — |
| `calibration.diagnosticity_assessed` | boolean | — |
| `calibration.confidence_percent` | number | number; computed, see below |
| `calibration.known_vs_believed_separated` | boolean | — |

#### `stress_testing`

| Field | Type | Notes |
|---|---|---|
| `stress_test.inversion_or_premortem_done` | boolean | — |
| `stress_test.second_order_consequences_traced` | boolean | — |
| `stress_test.change_mind_evidence_prestated` | boolean | — |

#### `fallacy_and_bias_screening`

| Field | Type | Notes |
|---|---|---|
| `screening.fallacies_screened` | array of string | list of string tokens; computed, see below |
| `screening.biases_screened` | array of string | list of string tokens; computed, see below |

#### `razors_and_countercase`

| Field | Type | Notes |
|---|---|---|
| `razors.simplest_explanation_preferred` | boolean | — |
| `razors.malice_not_assumed_without_evidence` | boolean | — |
| `razors.chestertons_fence_respected` | boolean | — |
| `razors.map_territory_distinguished` | boolean | — |
| `countercase.key_assumption_named` | boolean | — |
| `countercase.strongest_countercase_offered` | boolean | — |

### Checks

The recorded full-pass response carries 24 checks across 6 sections (`anatomy_and_steelman`, `evidence_weighing`, `base_rates_and_calibration`, `stress_testing`, `fallacy_and_bias_screening`, `razors_and_countercase`). Every check is listed below with the requirement stated in its recorded `evidence` string. General semantics: a check's status is `pass` when its requirement is met on the declared values, `fail` when the supporting field is present but the requirement is not met, and `missing` when the supporting field is absent. A section's status is `pass` when all its checks pass, `fail` when any check fails, and `insufficient_evidence` when no check fails but at least one is missing.

No check group is conditional in this atom. The two screen checks and the confidence check are computed (see above); every other check is a plain declared-evidence check.

| Section | Check | What passing requires (recorded evidence) | Pass / fail / missing semantics |
|---|---|---|---|
| `anatomy_and_steelman` | `premises_identified` | anatomy: the argument's premises are identified | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `anatomy_and_steelman` | `conclusion_identified` | anatomy: the argument's conclusion is identified | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `anatomy_and_steelman` | `validity_distinguished_from_soundness` | anatomy: validity (does the conclusion follow from the form?) is distinguished from soundness (valid and true premises) | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `anatomy_and_steelman` | `steelman_stated_before_critique` | steelman first: the strongest version of the view under critique is stated before the critique | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `evidence_weighing` | `source_quality_assessed` | evidence: source quality is assessed | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `evidence_weighing` | `sample_size_considered` | evidence: sample size is considered | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `evidence_weighing` | `confounders_considered` | evidence: confounders are considered | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `evidence_weighing` | `replication_considered` | evidence: replication is considered | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `evidence_weighing` | `anecdote_not_treated_as_data` | evidence: anecdote is not data — no anecdote is treated as data | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `base_rates_and_calibration` | `base_rate_stated_first` | base rates first: the prior / base rate is stated before the new evidence is weighed | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `base_rates_and_calibration` | `diagnosticity_assessed` | base rates first: how diagnostic the new evidence is — how much it should move the belief — is assessed | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `base_rates_and_calibration` | `confidence_probabilistic_and_explicit` | calibration: an explicit confidence is held probabilistically — strictly between 0 and 100 percent, not binary certainty | Computed: declared `confidence_percent` strictly between 0 and 100 → `pass`; 0, 100 or out of range → `fail`; absent → `missing` |
| `base_rates_and_calibration` | `known_separated_from_believed` | calibration: what is known is separated from what is believed | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `stress_testing` | `inversion_or_premortem_run` | stress-test: inversion is run — how would this fail? — as a premortem | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `stress_testing` | `second_order_consequences_traced` | stress-test: second-order thinking — consequences of consequences are traced | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `stress_testing` | `falsifiability_change_mind_prestated` | falsifiability: what evidence would change the conclusion is pre-stated | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `fallacy_and_bias_screening` | `all_listed_fallacies_screened` | fallacies: the screen covers every fallacy the skill names — ad hominem, straw man, false dichotomy, appeal to authority, slippery slope, correlation as causation, survivorship bias, base-rate neglect, sunk cost | Computed: declared list contains all nine skill-named fallacy tokens → `pass`; present but incomplete → `fail`; absent → `missing` |
| `fallacy_and_bias_screening` | `all_listed_biases_screened` | biases: the screen covers every bias the skill names — confirmation, anchoring, availability, motivated reasoning, recency, overconfidence | Computed: declared list contains all six skill-named bias tokens → `pass`; present but incomplete → `fail`; absent → `missing` |
| `razors_and_countercase` | `simplest_explanation_preferred` | Occam: the simplest explanation that fits the facts is preferred | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `razors_and_countercase` | `malice_not_assumed_without_evidence` | Hanlon: malice is not attributed to what incompetence explains, absent evidence | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `razors_and_countercase` | `chestertons_fence_respected` | Chesterton's fence: why something exists is understood before it is removed | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `razors_and_countercase` | `map_territory_distinguished` | map is not territory: the model is distinguished from the reality | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `razors_and_countercase` | `key_assumption_named` | how to show up: the key assumption is named | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `razors_and_countercase` | `strongest_countercase_offered` | how to show up: the strongest honest counter-case is offered | `true` → `pass`; `false` → `fail`; absent → `missing` |

### Output format

A successful call (HTTP 200) returns one JSON object:

| Field | Meaning |
|---|---|
| `service` | Always `"argument-analysis-review"` |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"`) |
| `argument` | The declared argument, carried through from the manifest (not itself checked) |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`) |
| `checks` | Array of 24 objects, each `{section, check, status, evidence}` — `status` is `pass` / `fail` / `missing`; `evidence` states what the check requires |
| `computed_status` | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the three computed checks cannot be completed |
| `missing_fallacies` | Skill-named fallacy tokens absent from the declared screen, in skill order; null when the screen list is not declared |
| `missing_biases` | Skill-named bias tokens absent from the declared screen, in skill order; null when the screen list is not declared |
| `confidence_percent` | The declared numeric confidence, or null |
| `summary` | Plain-language count, e.g. the recorded full-pass summary: "24 pass, 0 fail, 0 missing of 24 checks across six sections." |
| `stamp` | The same verdict rendered as a plain-text stamp for pasting into a record |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `ARGUMENT_ANALYSIS_COMPLETE` — Every check passes; the analysis record is complete on the declared evidence.
- `ARGUMENT_ANALYSIS_DEFICIENT` — At least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — Nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values in the `sections` object): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (the `status` field of each `checks` entry): `pass` — the requirement is met on the declared values (for a conditional check whose gate is off, `pass` is recorded with not-applicable semantics — see Checks); `fail` — the supporting field is present but the requirement is not met; `missing` — the supporting field is absent, so there is no evidence to judge.

**Computed status** (the `computed_status` field, where present): see Output format — it summarises the computed checks as within / outside the stated limits on the declared evidence, or null when a primary computed check cannot be completed.

### Errors

Only the error shapes evidenced in the gateway documentation (USER-GUIDE.md) and the recorded trial runs are documented here; no other payload shapes are claimed.

- **401 — unauthenticated:** missing or invalid key. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **403 — scope:** the key lacks this atom's scope. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **422 — `invalid_input`:** a manifest field has the wrong type. Recorded body shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance is `anatomy.premises_identified` / "anatomy.premises_identified must be a boolean" (Worked example 3, verbatim). No verdict is returned.
- **429 — rate limit:** the per-key rate limit (below) is exceeded. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)

### Rate limits and pricing

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. The contract notes this is the SPEC default capacity guard for open public usage, tuned per atom at build-out from measured production cost.
- **Pricing:** Free during trial — rate pending. `contract.yaml` sets pricing unit `deliverable` with `rate: null` (`rate_status: pending`); SERVICE.md states no price is set and prices are set only from measured production cost per unit.

## Explanation

What this atom does, in depth: you submit a declared record — the manifest — and the atom audits that record, deterministically, against the method, quality gates and red lines of its bound skill. It runs 24 checks grouped into 6 sections (anatomy_and_steelman, evidence_weighing, base_rates_and_calibration, stress_testing, fallacy_and_bias_screening, razors_and_countercase), computes the computed checks described below from the declared values alone, and returns a single verdict with per-section and per-check evidence. Same manifest in → same verdict out: external verification confirmed byte-identical repeat REST responses and MCP/REST parity (see TEST-REPORT.md). One unit of sale is one delivered verdict — the atom sells the review it produces, never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic; there is no model judgment in the loop. Each check reads declared field(s): an **absent** field is missing evidence (check status `missing`), while a field **present but false / invalid** is a failure (check status `fail`) — that distinction is the atom's central semantics, and it drives the verdict: any `fail` produces the failing verdict; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only when every check passes does the atom return its pass verdict. Section statuses aggregate the same way (`pass` / `fail` / `insufficient_evidence`).

**Computed checks.** Three checks are computed from the declared values, using only what the bound skill itself states. **Fallacy screen completeness:** `screening.fallacies_screened` must contain all nine skill-named tokens (`ad_hominem`, `straw_man`, `false_dichotomy`, `appeal_to_authority`, `slippery_slope`, `correlation_as_causation`, `survivorship_bias`, `base_rate_neglect`, `sunk_cost`); extra tokens are ignored and tokens are validated as strings only. **Bias screen completeness:** `screening.biases_screened` must contain all six tokens (`confirmation`, `anchoring`, `availability`, `motivated_reasoning`, `recency`, `overconfidence`). **Probabilistic confidence:** `calibration.confidence_percent` passes only strictly between 0 and 100; 0 and 100 are binary certainty and fail; an absent value is missing evidence, not a failure. The output reports `computed_status`, `missing_fallacies` and `missing_biases` (skill-named tokens absent from each screen, in skill order; null when a screen is not declared) and `confidence_percent` (the declared value, or null).

**What it does NOT do.** This atom audits a **declared** argument-analysis record — it
does not read the underlying argument, restate it, or verify that
a declared step was performed well. An analysis is complete *on
the caller's declared evidence*: a manifest that declares a
steelman, a base rate, and complete fallacy/bias screens passes
those checks even if the underlying reasoning was never done. It
is a completeness audit of the record the skill requires, **not a
judgment of the argument itself**: it never decides whether the
conclusion is true, whether the premises are true (soundness of
the actual argument), or whether the stated confidence is well
calibrated against outcomes — only that the record contains what
the skill's anatomy, evidence, stress-test, screening and razor
steps demand.

Named exclusions: no grading of prose quality (steelman strength,
counter-case honesty, evidence appraisal are judgment, and the
skill states no scale for grading them, so none is invented); no
fallacy/bias vocabulary beyond the skill's own lists is required
(extra screened tokens are accepted and ignored); no verification
that any declared analysis step actually happened.

**Buyer and use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this review on demand and would rather buy it per use than build or staff the capability themselves. Self-use (passed): see SERVICE.md — the house itself calls this atom in its own workflow, as an internal caller at zero price metered to the internal cost ledger. The recorded trial runs below are the external-verification battery for the release candidate now in its one-week RC soak.

## Role views

### For integrators

You need the verdict inside another system or agent loop. Use the REST endpoint `POST https://atoms.pipavia.com/v1/argument-analysis-review` (or the MCP tool `argument_analysis_review`) with a per-atom scoped key, treat HTTP 200 verdicts — including failing verdicts — as successful deliveries, and branch on `verdict`, `sections` and the per-check `status` values rather than on HTTP status. Reserve error handling for 401 / 403 / 422 / 429 (see Errors). The call is stateless and deterministic: cache or replay a manifest freely; an identical manifest returns an identical verdict. Respect the per-key limits (60/min, 10,000/day) and note pricing is free during trial with the rate pending.

### For developers

Manifest authoring: declare every field in the Input reference truthfully — omitting a field is a positive statement that the evidence does not exist (`missing`), not a neutral default, and declaring `false` where the record is actually silent converts a fixable `INSUFFICIENT_EVIDENCE` into a failing verdict. Mind the must-be-`false` fields, the computed checks (their rules are stated in full under Explanation), and the conditional gates where this atom has them. Determinism: the verdict core is a deterministic function of the manifest alone. Implementation pointers: core in `src/argument_analysis_review.py`, tests in `tests/test_argument_analysis_review.py` (see TEST-REPORT.md for the external battery: full-pass, violations, sparse, malformed, determinism, and MCP/REST parity).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/argument-analysis-review` and MCP `POST https://atoms.pipavia.com/mcp/argument-analysis-review` on gateway v1.1.0 at https://atoms.pipavia.com. Keys are per user, per atom; a 403 spike means callers are presenting keys without this atom's scope, a 401 spike means missing/invalid keys, 422s mean malformed manifests naming the field in the body, and 429s mean the per-key limit (60/min, 10,000/day) is being hit — monitor those four codes separately from verdict mix, since failing verdicts are HTTP 200 by design. Status: live — release candidate (one-week RC soak to 2026-11-22); atom version 0.1.0. Pricing is free during trial (rate pending), so trial traffic is metered, not billed, per `contract.yaml`.

## Worked examples

Provenance: recorded 2026-11-16T00:43:12.360253+00:00 against gateway v1.1.0, external verification lane, source `verification/work/argument-analysis-review/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, pretty-printed with two-space indent; the JSON values are verbatim.

### Example 1 — full-pass

Request — `POST /v1/argument-analysis-review`:

```json
{
  "argument": "All men are mortal; Socrates is a man; therefore Socrates is mortal.",
  "anatomy": {
    "premises_identified": true,
    "conclusion_identified": true,
    "validity_distinguished_from_soundness": true,
    "steelman_stated": true
  },
  "evidence": {
    "source_quality_assessed": true,
    "sample_size_considered": true,
    "confounders_considered": true,
    "replication_considered": true,
    "anecdote_treated_as_data": false
  },
  "calibration": {
    "base_rate_stated": true,
    "diagnosticity_assessed": true,
    "confidence_percent": 75,
    "known_vs_believed_separated": true
  },
  "stress_test": {
    "inversion_or_premortem_done": true,
    "second_order_consequences_traced": true,
    "change_mind_evidence_prestated": true
  },
  "screening": {
    "fallacies_screened": [
      "ad_hominem",
      "straw_man",
      "false_dichotomy",
      "appeal_to_authority",
      "slippery_slope",
      "correlation_as_causation",
      "survivorship_bias",
      "base_rate_neglect",
      "sunk_cost"
    ],
    "biases_screened": [
      "confirmation",
      "anchoring",
      "availability",
      "motivated_reasoning",
      "recency",
      "overconfidence"
    ]
  },
  "razors": {
    "simplest_explanation_preferred": true,
    "malice_not_assumed_without_evidence": true,
    "chestertons_fence_respected": true,
    "map_territory_distinguished": true
  },
  "countercase": {
    "key_assumption_named": true,
    "strongest_countercase_offered": true
  }
}
```

Response — HTTP 200:

```json
{
  "service": "argument-analysis-review",
  "atom_version": "0.1.0",
  "argument": "All men are mortal; Socrates is a man; therefore Socrates is mortal.",
  "verdict": "ARGUMENT_ANALYSIS_COMPLETE",
  "sections": {
    "anatomy_and_steelman": "pass",
    "evidence_weighing": "pass",
    "base_rates_and_calibration": "pass",
    "stress_testing": "pass",
    "fallacy_and_bias_screening": "pass",
    "razors_and_countercase": "pass"
  },
  "checks": [
    {
      "section": "anatomy_and_steelman",
      "check": "premises_identified",
      "status": "pass",
      "evidence": "anatomy: the argument's premises are identified"
    },
    {
      "section": "anatomy_and_steelman",
      "check": "conclusion_identified",
      "status": "pass",
      "evidence": "anatomy: the argument's conclusion is identified"
    },
    {
      "section": "anatomy_and_steelman",
      "check": "validity_distinguished_from_soundness",
      "status": "pass",
      "evidence": "anatomy: validity (does the conclusion follow from the form?) is distinguished from soundness (valid and true premises)"
    },
    {
      "section": "anatomy_and_steelman",
      "check": "steelman_stated_before_critique",
      "status": "pass",
      "evidence": "steelman first: the strongest version of the view under critique is stated before the critique"
    },
    {
      "section": "evidence_weighing",
      "check": "source_quality_assessed",
      "status": "pass",
      "evidence": "evidence: source quality is assessed"
    },
    {
      "section": "evidence_weighing",
      "check": "sample_size_considered",
      "status": "pass",
      "evidence": "evidence: sample size is considered"
    },
    {
      "section": "evidence_weighing",
      "check": "confounders_considered",
      "status": "pass",
      "evidence": "evidence: confounders are considered"
    },
    {
      "section": "evidence_weighing",
      "check": "replication_considered",
      "status": "pass",
      "evidence": "evidence: replication is considered"
    },
    {
      "section": "evidence_weighing",
      "check": "anecdote_not_treated_as_data",
      "status": "pass",
      "evidence": "evidence: anecdote is not data \u2014 no anecdote is treated as data"
    },
    {
      "section": "base_rates_and_calibration",
      "check": "base_rate_stated_first",
      "status": "pass",
      "evidence": "base rates first: the prior / base rate is stated before the new evidence is weighed"
    },
    {
      "section": "base_rates_and_calibration",
      "check": "diagnosticity_assessed",
      "status": "pass",
      "evidence": "base rates first: how diagnostic the new evidence is \u2014 how much it should move the belief \u2014 is assessed"
    },
    {
      "section": "base_rates_and_calibration",
      "check": "confidence_probabilistic_and_explicit",
      "status": "pass",
      "evidence": "calibration: an explicit confidence is held probabilistically \u2014 strictly between 0 and 100 percent, not binary certainty"
    },
    {
      "section": "base_rates_and_calibration",
      "check": "known_separated_from_believed",
      "status": "pass",
      "evidence": "calibration: what is known is separated from what is believed"
    },
    {
      "section": "stress_testing",
      "check": "inversion_or_premortem_run",
      "status": "pass",
      "evidence": "stress-test: inversion is run \u2014 how would this fail? \u2014 as a premortem"
    },
    {
      "section": "stress_testing",
      "check": "second_order_consequences_traced",
      "status": "pass",
      "evidence": "stress-test: second-order thinking \u2014 consequences of consequences are traced"
    },
    {
      "section": "stress_testing",
      "check": "falsifiability_change_mind_prestated",
      "status": "pass",
      "evidence": "falsifiability: what evidence would change the conclusion is pre-stated"
    },
    {
      "section": "fallacy_and_bias_screening",
      "check": "all_listed_fallacies_screened",
      "status": "pass",
      "evidence": "fallacies: the screen covers every fallacy the skill names \u2014 ad hominem, straw man, false dichotomy, appeal to authority, slippery slope, correlation as causation, survivorship bias, base-rate neglect, sunk cost"
    },
    {
      "section": "fallacy_and_bias_screening",
      "check": "all_listed_biases_screened",
      "status": "pass",
      "evidence": "biases: the screen covers every bias the skill names \u2014 confirmation, anchoring, availability, motivated reasoning, recency, overconfidence"
    },
    {
      "section": "razors_and_countercase",
      "check": "simplest_explanation_preferred",
      "status": "pass",
      "evidence": "Occam: the simplest explanation that fits the facts is preferred"
    },
    {
      "section": "razors_and_countercase",
      "check": "malice_not_assumed_without_evidence",
      "status": "pass",
      "evidence": "Hanlon: malice is not attributed to what incompetence explains, absent evidence"
    },
    {
      "section": "razors_and_countercase",
      "check": "chestertons_fence_respected",
      "status": "pass",
      "evidence": "Chesterton's fence: why something exists is understood before it is removed"
    },
    {
      "section": "razors_and_countercase",
      "check": "map_territory_distinguished",
      "status": "pass",
      "evidence": "map is not territory: the model is distinguished from the reality"
    },
    {
      "section": "razors_and_countercase",
      "check": "key_assumption_named",
      "status": "pass",
      "evidence": "how to show up: the key assumption is named"
    },
    {
      "section": "razors_and_countercase",
      "check": "strongest_countercase_offered",
      "status": "pass",
      "evidence": "how to show up: the strongest honest counter-case is offered"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "missing_fallacies": [],
  "missing_biases": [],
  "confidence_percent": 75,
  "summary": "24 pass, 0 fail, 0 missing of 24 checks across six sections.",
  "stamp": "ARGUMENT ANALYSIS REVIEW\nargument: All men are mortal; Socrates is a man; therefore Socrates is mortal.\nVERDICT: ARGUMENT_ANALYSIS_COMPLETE\n  anatomy_and_steelman             pass\n  evidence_weighing                pass\n  base_rates_and_calibration       pass\n  stress_testing                   pass\n  fallacy_and_bias_screening       pass\n  razors_and_countercase           pass\n24 pass, 0 fail, 0 missing of 24 checks across six sections."
}
```

### Example 2 — violations

Request — `POST /v1/argument-analysis-review`:

```json
{
  "argument": "Test argument",
  "anatomy": {
    "premises_identified": true,
    "conclusion_identified": true,
    "validity_distinguished_from_soundness": true,
    "steelman_stated": true
  },
  "evidence": {
    "source_quality_assessed": true,
    "sample_size_considered": true,
    "confounders_considered": true,
    "replication_considered": true,
    "anecdote_treated_as_data": true
  },
  "calibration": {
    "base_rate_stated": true,
    "diagnosticity_assessed": true,
    "confidence_percent": 100,
    "known_vs_believed_separated": true
  },
  "stress_test": {
    "inversion_or_premortem_done": true,
    "second_order_consequences_traced": true,
    "change_mind_evidence_prestated": true
  },
  "screening": {
    "fallacies_screened": [
      "ad_hominem"
    ],
    "biases_screened": [
      "confirmation"
    ]
  },
  "razors": {
    "simplest_explanation_preferred": true,
    "malice_not_assumed_without_evidence": true,
    "chestertons_fence_respected": true,
    "map_territory_distinguished": true
  },
  "countercase": {
    "key_assumption_named": true,
    "strongest_countercase_offered": true
  }
}
```

Response — HTTP 200:

```json
{
  "service": "argument-analysis-review",
  "atom_version": "0.1.0",
  "argument": "Test argument",
  "verdict": "ARGUMENT_ANALYSIS_DEFICIENT",
  "sections": {
    "anatomy_and_steelman": "pass",
    "evidence_weighing": "fail",
    "base_rates_and_calibration": "fail",
    "stress_testing": "pass",
    "fallacy_and_bias_screening": "fail",
    "razors_and_countercase": "pass"
  },
  "checks": [
    {
      "section": "anatomy_and_steelman",
      "check": "premises_identified",
      "status": "pass",
      "evidence": "anatomy: the argument's premises are identified"
    },
    {
      "section": "anatomy_and_steelman",
      "check": "conclusion_identified",
      "status": "pass",
      "evidence": "anatomy: the argument's conclusion is identified"
    },
    {
      "section": "anatomy_and_steelman",
      "check": "validity_distinguished_from_soundness",
      "status": "pass",
      "evidence": "anatomy: validity (does the conclusion follow from the form?) is distinguished from soundness (valid and true premises)"
    },
    {
      "section": "anatomy_and_steelman",
      "check": "steelman_stated_before_critique",
      "status": "pass",
      "evidence": "steelman first: the strongest version of the view under critique is stated before the critique"
    },
    {
      "section": "evidence_weighing",
      "check": "source_quality_assessed",
      "status": "pass",
      "evidence": "evidence: source quality is assessed"
    },
    {
      "section": "evidence_weighing",
      "check": "sample_size_considered",
      "status": "pass",
      "evidence": "evidence: sample size is considered"
    },
    {
      "section": "evidence_weighing",
      "check": "confounders_considered",
      "status": "pass",
      "evidence": "evidence: confounders are considered"
    },
    {
      "section": "evidence_weighing",
      "check": "replication_considered",
      "status": "pass",
      "evidence": "evidence: replication is considered"
    },
    {
      "section": "evidence_weighing",
      "check": "anecdote_not_treated_as_data",
      "status": "fail",
      "evidence": "evidence: anecdote is not data \u2014 no anecdote is treated as data"
    },
    {
      "section": "base_rates_and_calibration",
      "check": "base_rate_stated_first",
      "status": "pass",
      "evidence": "base rates first: the prior / base rate is stated before the new evidence is weighed"
    },
    {
      "section": "base_rates_and_calibration",
      "check": "diagnosticity_assessed",
      "status": "pass",
      "evidence": "base rates first: how diagnostic the new evidence is \u2014 how much it should move the belief \u2014 is assessed"
    },
    {
      "section": "base_rates_and_calibration",
      "check": "confidence_probabilistic_and_explicit",
      "status": "fail",
      "evidence": "calibration: an explicit confidence is held probabilistically \u2014 strictly between 0 and 100 percent, not binary certainty"
    },
    {
      "section": "base_rates_and_calibration",
      "check": "known_separated_from_believed",
      "status": "pass",
      "evidence": "calibration: what is known is separated from what is believed"
    },
    {
      "section": "stress_testing",
      "check": "inversion_or_premortem_run",
      "status": "pass",
      "evidence": "stress-test: inversion is run \u2014 how would this fail? \u2014 as a premortem"
    },
    {
      "section": "stress_testing",
      "check": "second_order_consequences_traced",
      "status": "pass",
      "evidence": "stress-test: second-order thinking \u2014 consequences of consequences are traced"
    },
    {
      "section": "stress_testing",
      "check": "falsifiability_change_mind_prestated",
      "status": "pass",
      "evidence": "falsifiability: what evidence would change the conclusion is pre-stated"
    },
    {
      "section": "fallacy_and_bias_screening",
      "check": "all_listed_fallacies_screened",
      "status": "fail",
      "evidence": "fallacies: the screen covers every fallacy the skill names \u2014 ad hominem, straw man, false dichotomy, appeal to authority, slippery slope, correlation as causation, survivorship bias, base-rate neglect, sunk cost"
    },
    {
      "section": "fallacy_and_bias_screening",
      "check": "all_listed_biases_screened",
      "status": "fail",
      "evidence": "biases: the screen covers every bias the skill names \u2014 confirmation, anchoring, availability, motivated reasoning, recency, overconfidence"
    },
    {
      "section": "razors_and_countercase",
      "check": "simplest_explanation_preferred",
      "status": "pass",
      "evidence": "Occam: the simplest explanation that fits the facts is preferred"
    },
    {
      "section": "razors_and_countercase",
      "check": "malice_not_assumed_without_evidence",
      "status": "pass",
      "evidence": "Hanlon: malice is not attributed to what incompetence explains, absent evidence"
    },
    {
      "section": "razors_and_countercase",
      "check": "chestertons_fence_respected",
      "status": "pass",
      "evidence": "Chesterton's fence: why something exists is understood before it is removed"
    },
    {
      "section": "razors_and_countercase",
      "check": "map_territory_distinguished",
      "status": "pass",
      "evidence": "map is not territory: the model is distinguished from the reality"
    },
    {
      "section": "razors_and_countercase",
      "check": "key_assumption_named",
      "status": "pass",
      "evidence": "how to show up: the key assumption is named"
    },
    {
      "section": "razors_and_countercase",
      "check": "strongest_countercase_offered",
      "status": "pass",
      "evidence": "how to show up: the strongest honest counter-case is offered"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "missing_fallacies": [
    "straw_man",
    "false_dichotomy",
    "appeal_to_authority",
    "slippery_slope",
    "correlation_as_causation",
    "survivorship_bias",
    "base_rate_neglect",
    "sunk_cost"
  ],
  "missing_biases": [
    "anchoring",
    "availability",
    "motivated_reasoning",
    "recency",
    "overconfidence"
  ],
  "confidence_percent": 100,
  "summary": "20 pass, 4 fail, 0 missing of 24 checks across six sections.",
  "stamp": "ARGUMENT ANALYSIS REVIEW\nargument: Test argument\nVERDICT: ARGUMENT_ANALYSIS_DEFICIENT\n  anatomy_and_steelman             pass\n  evidence_weighing                fail\n  base_rates_and_calibration       fail\n  stress_testing                   pass\n  fallacy_and_bias_screening       fail\n  razors_and_countercase           pass\n20 pass, 4 fail, 0 missing of 24 checks across six sections."
}
```

### Example 3 — malformed

Request — `POST /v1/argument-analysis-review`:

```json
{
  "argument": "Malformed input",
  "anatomy": {
    "premises_identified": "not_a_boolean"
  }
}
```

Response — HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "anatomy.premises_identified",
  "detail": "anatomy.premises_identified must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference and Explanation sections above; output is CommonMark markdown |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; developers Yes; ops Yes; regulators N/A — Not compliance-facing: the verdict is a completeness audit of a declared argument-analysis record; the domain (reasoning quality) is not regulated and the verdict is not compliance or audit evidence. |
| Checks named (documented / recorded) | 24 / 24 — every check in the recorded full-pass response is listed under Reference → Checks |
| Verdict vocabulary complete | Yes — 3 verdict values, plus section statuses and per-check statuses |
| Input reference typed | Yes — 25 fields, each with its type, grouped as in SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses compared as JSON values against `verification/work/argument-analysis-review/evidence.json` after writing |

