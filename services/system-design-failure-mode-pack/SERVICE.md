# System design failure mode pack — `system-design-failure-mode-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Designs systems from the data flow and the failure modes — clear boundaries, single responsibilities, the simplest thing that holds under load.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result. In this atom's deterministic form, the caller submits a **declared system-design failure-mode analysis record** and receives the failure-mode pack audit verdict as the deliverable: the atom designs no system, invents no failure mode, performs no failure-mode analysis, assigns no rating, and certifies nothing (see Honest scoping and the U-13 screen).

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Designing product systems before builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the failure-mode manifest

The caller submits one JSON manifest: a declared system-design
failure-mode analysis record for one design, made from the
analysis as actually carried out before the design was built.
Every field below is read by the named section's checks. A
field **absent** = evidence missing (`INSUFFICIENT_EVIDENCE`);
a field present but false / invalid = the check fails
(`FAILURE_MODE_PACK_NOT_SOUND`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `design_name` (string; carried into the verdict output, not itself checked) | — |
| `design_context.requirement_stated` (boolean) | design_framing_and_boundaries |
| `design_context.data_flow_described` (boolean) | design_framing_and_boundaries |
| `design_context.analysis_performed_before_build` (boolean) | design_framing_and_boundaries |
| `design_context.component_boundaries_clear` (boolean) | design_framing_and_boundaries |
| `design_context.single_responsibility_per_component_declared` (boolean) | design_framing_and_boundaries |
| `design_context.loose_coupling_declared` (boolean) | design_framing_and_boundaries |
| `design_context.layer_failure_independence_declared` (boolean) | design_framing_and_boundaries |
| `components` (list of component-row objects, each with the entry fields below; computed, see below) | component_inventory |
| `components[].component_id` (string; must be unique per row) | component_inventory |
| `components[].responsibility` (non-empty string) | component_inventory |
| `components[].contract_declared` (boolean; must be `true` per row) | component_inventory |
| `failure_modes` (list of failure-mode-row objects, each with the entry fields below; computed, see below) | failure_mode_rows |
| `failure_modes[].failure_id` (string; must be unique per row) | failure_mode_rows |
| `failure_modes[].component_id` (string; computed — must name a declared component, see below) | failure_mode_rows |
| `failure_modes[].failure_mode` (non-empty string) | failure_mode_rows |
| `failure_modes[].effect` (non-empty string) | failure_mode_rows |
| `failure_modes[].severity` (number; computed — must be positive; no scale is imposed, see below) | failure_mode_rows |
| `failure_modes[].occurrence` (number; computed — must be positive; no scale is imposed, see below) | failure_mode_rows |
| `failure_modes[].detection` (number; computed — must be positive; no scale is imposed, see below) | failure_mode_rows |
| `failure_modes[].rpn_declared` (number; computed — must recompute exactly as `severity` × `occurrence` × `detection`, see below) | failure_mode_rows |
| `failure_modes[].mitigation_id` (string; computed — must name a declared mitigation, see below) | mitigation_coverage |
| `mitigations` (list of mitigation-row objects, each with the entry fields below; computed, see below) | mitigation_coverage |
| `mitigations[].mitigation_id` (string; must be unique per row) | mitigation_coverage |
| `mitigations[].description` (non-empty string) | mitigation_coverage |
| `mitigations[].residual_risk_stated` (boolean; must be `true` per row) | mitigation_coverage |
| `mitigation_work.mitigations_considered_before_build` (boolean) | mitigation_coverage |
| `mitigation_work.residual_risk_acceptance_stated` (boolean) | mitigation_coverage |
| `state_and_reliability.source_of_truth_identified` (boolean) | state_reliability_and_queues |
| `state_and_reliability.distributed_state_minimized_declared` (boolean) | state_reliability_and_queues |
| `state_and_reliability.idempotency_for_retryable_operations_declared` (boolean) | state_reliability_and_queues |
| `state_and_reliability.cap_tradeoffs_stated_explicitly` (boolean) | state_reliability_and_queues |
| `state_and_reliability.timeouts_declared` (boolean) | state_reliability_and_queues |
| `state_and_reliability.retries_with_jitter_declared` (boolean) | state_reliability_and_queues |
| `state_and_reliability.circuit_breakers_declared` (boolean) | state_reliability_and_queues |
| `state_and_reliability.graceful_degradation_declared` (boolean) | state_reliability_and_queues |
| `state_and_reliability.readiness_vs_liveness_distinguished` (boolean) | state_reliability_and_queues |
| `state_and_reliability.slow_unreliable_work_behind_queue_declared` (boolean) | state_reliability_and_queues |
| `queues.queues_used` (boolean; gates the three queue checks below) | state_reliability_and_queues |
| `queues.at_least_once_delivery_with_idempotent_consumers_declared` (boolean; required when queue use is declared; otherwise the check passes as not applicable) | state_reliability_and_queues |
| `queues.queue_backpressure_declared` (boolean; gated as above) | state_reliability_and_queues |
| `queues.dead_letter_handling_declared` (boolean; gated as above) | state_reliability_and_queues |
| `observability_scaling_security.structured_logs_declared` (boolean) | observability_scaling_and_security |
| `observability_scaling_security.metrics_declared` (boolean) | observability_scaling_and_security |
| `observability_scaling_security.traces_declared` (boolean) | observability_scaling_and_security |
| `observability_scaling_security.bottleneck_identified_before_scaling` (boolean) | observability_scaling_and_security |
| `observability_scaling_security.measure_before_scaling_declared` (boolean) | observability_scaling_and_security |
| `observability_scaling_security.stateless_horizontal_scaling_where_scaled_declared` (boolean) | observability_scaling_and_security |
| `observability_scaling_security.zero_trust_boundaries_declared` (boolean) | observability_scaling_and_security |
| `observability_scaling_security.least_privilege_declared` (boolean) | observability_scaling_and_security |
| `observability_scaling_security.secrets_management_declared` (boolean) | observability_scaling_and_security |
| `observability_scaling_security.external_trust_boundary_stated` (boolean) | observability_scaling_and_security |
| `caching.caching_used` (boolean; gates the cache-invalidation check below) | observability_scaling_and_security |
| `caching.cache_invalidation_stated` (boolean; required when caching use is declared; otherwise the check passes as not applicable) | observability_scaling_and_security |
| `red_lines.distributed_monolith_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.shared_mutable_state_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.retries_without_idempotency_or_backpressure_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.design_without_observability_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.premature_microservices_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.strong_consistency_assumed_without_tradeoff_present` (boolean; must be `false` to pass — skill red line) | red_lines |

### Check register — all 56 checks

The verdict rests on **56 checks** across seven sections.
Every check is named below, grouped by its section, with what
it requires. A check whose evidence field is absent is
`missing`; a check whose evidence is present but does not meet
the requirement is `fail`; otherwise it is `pass`.

**design_framing_and_boundaries (7 checks)** — the design is
framed from its requirement and its data flow, prospectively,
with its boundaries declared:

- `failure_mode_pack_requirement_stated` — the requirement the design must meet is declared stated; design starts from the requirement, not the happy path.
- `failure_mode_pack_data_flow_described` — the design's data flow is declared described; the design is framed from its data flow.
- `failure_mode_pack_analysis_performed_before_build` — this failure-mode analysis is declared performed before the design was built; it is prospective, not a retrospective on an incident.
- `failure_mode_pack_component_boundaries_clear` — clear boundaries between the design's components are declared.
- `failure_mode_pack_single_responsibility_per_component_declared` — a single responsibility for each component is declared.
- `failure_mode_pack_loose_coupling_declared` — loose coupling between components is declared.
- `failure_mode_pack_layer_failure_independence_declared` — each layer or component is declared to fail independently of the others.

**component_inventory (4 checks)** — computed over the
declared component rows:

- `failure_mode_pack_components_list_declared` — the declared `components` list is present and names at least one component; an absent list is missing evidence and an empty list fails, declaring no design at all.
- `every_failure_mode_pack_component_id_unique` — no declared `component_id` appears on more than one row; a row with `component_id` absent is missing evidence for this check.
- `every_failure_mode_pack_component_responsibility_declared` — every declared component row declares a non-empty `responsibility`; a row with the field absent is missing evidence, a row declaring an empty responsibility fails and is named in `failure_mode_components_without_responsibility`.
- `every_failure_mode_pack_component_contract_declared` — every declared component row declares `contract_declared: true`, a clear contract with the components it interacts with; a row with the field absent is missing evidence, a row declaring it false fails and is named in `failure_mode_components_without_contract`.

**failure_mode_rows (8 checks)** — computed over the declared
failure-mode rows:

- `failure_mode_pack_failure_modes_list_declared` — the declared `failure_modes` list is present and names at least one failure mode; an absent list is missing evidence and an empty list fails, declaring no failure-mode analysis at all.
- `every_failure_mode_pack_failure_id_unique` — no declared `failure_id` appears on more than one row; a row with `failure_id` absent is missing evidence for this check.
- `every_failure_mode_pack_failure_component_referenced` — every declared failure mode's `component_id` names one of the declared components; a row with `component_id` absent, or a record with the components list absent, is missing evidence, a row naming an undeclared component fails and is named in `failure_modes_with_unknown_component_reference`.
- `every_failure_mode_pack_failure_mode_description_declared` — every declared row declares a non-empty `failure_mode` description; a row with the field absent is missing evidence, a row declaring it empty fails and is named in `failure_modes_without_description`.
- `every_failure_mode_pack_failure_effect_declared` — every declared row declares a non-empty `effect`; a row with the field absent is missing evidence, a row declaring it empty fails and is named in `failure_modes_without_effect`.
- `every_failure_mode_pack_failure_ratings_positive` — every declared row declares `severity`, `occurrence` and `detection` ratings, each a positive number; positivity only — no rating scale is imposed by this atom. A row with any rating absent is missing evidence; a row declaring a non-positive rating fails and is named in `failure_modes_with_nonpositive_rating`.
- `every_failure_mode_pack_failure_rpn_recomputes` — every declared row's `rpn_declared` recomputes exactly as its declared `severity` × `occurrence` × `detection`; declared arithmetic only, no RPN cutoff is imposed. A row with any of the four numbers absent is missing evidence; a row whose declared RPN does not recompute fails and is named in `failure_modes_with_rpn_mismatch`.
- `every_failure_mode_pack_component_covered_by_failure_mode` — every declared component is covered by at least one declared failure mode; the analysis covers the whole declared design, not part of it. A component row or failure row with `component_id` absent is missing evidence; an uncovered component fails and is named in `failure_mode_components_without_failure_mode`.

**mitigation_coverage (7 checks)** — the declared mitigations
the failure modes reference, considered before build, with
residual risk stated:

- `failure_mode_pack_mitigations_considered_before_build` — mitigations for the declared failure modes are declared considered before the design was built.
- `failure_mode_pack_residual_risk_acceptance_stated` — how the residual risk remaining after mitigation is accepted or carried is declared stated.
- `failure_mode_pack_mitigations_list_declared` — computed: the declared `mitigations` list is present and names at least one mitigation; an absent list is missing evidence and an empty list fails, declaring no mitigations at all.
- `every_failure_mode_pack_mitigation_id_unique` — computed: no declared `mitigation_id` appears on more than one row; a row with `mitigation_id` absent is missing evidence for this check.
- `every_failure_mode_pack_mitigation_description_declared` — computed: every declared mitigation row declares a non-empty `description`; a row with the field absent is missing evidence, a row declaring it empty fails and is named in `failure_mode_mitigations_without_description`.
- `every_failure_mode_pack_failure_mitigation_referenced` — computed: every declared failure mode's `mitigation_id` names one of the declared mitigations; a row with `mitigation_id` absent, or a record with the mitigations list absent, is missing evidence, a row naming an undeclared mitigation fails and is named in `failure_modes_with_unknown_mitigation_reference`.
- `every_failure_mode_pack_mitigation_residual_risk_stated` — computed: every declared mitigation row declares `residual_risk_stated: true`, the residual risk remaining after it; a row with the field absent is missing evidence, a row declaring it false fails and is named in `failure_mode_mitigations_without_residual_risk`.

**state_reliability_and_queues (13 checks)** — where the
source of truth lives, how partial failure is designed for,
and, where queues are used, how they behave:

- `failure_mode_pack_source_of_truth_identified` — exactly where the source of truth lives is declared identified.
- `failure_mode_pack_distributed_state_minimized_declared` — distributed state is declared minimised; a single store is preferred over premature distribution.
- `failure_mode_pack_idempotency_for_retryable_operations_declared` — idempotency is declared for anything that can be retried.
- `failure_mode_pack_cap_tradeoffs_stated_explicitly` — CAP trade-offs are declared stated explicitly, rather than strong consistency being assumed for free.
- `failure_mode_pack_timeouts_declared` — timeouts are declared for partial failure.
- `failure_mode_pack_retries_with_jitter_declared` — retries with jitter are declared for partial failure.
- `failure_mode_pack_circuit_breakers_declared` — circuit breakers are declared for partial failure.
- `failure_mode_pack_graceful_degradation_declared` — graceful degradation is declared for partial failure.
- `failure_mode_pack_readiness_vs_liveness_distinguished` — health endpoints are declared to distinguish readiness from liveness.
- `failure_mode_pack_slow_unreliable_work_behind_queue_declared` — slow or unreliable work is declared to sit behind a queue.
- `failure_mode_pack_queue_delivery_semantics_declared_where_queues_used` — gated: at-least-once delivery with idempotent consumers is declared, required only where `queues.queues_used` is declared `true`; when the gate is declared `false` the check passes as not applicable, and when the gate field is absent the check is missing evidence.
- `failure_mode_pack_queue_backpressure_declared_where_queues_used` — gated as above: backpressure is declared for the queues used.
- `failure_mode_pack_dead_letter_handling_declared_where_queues_used` — gated as above: dead-letter handling is declared for the queues used.

**observability_scaling_and_security (11 checks)** — seeing
the system, scaling its bottleneck, and its security
architecture, plus cache honesty where caching is used:

- `failure_mode_pack_structured_logs_declared` — structured logs are declared from day one.
- `failure_mode_pack_metrics_declared` — metrics are declared from day one.
- `failure_mode_pack_traces_declared` — traces are declared from day one.
- `failure_mode_pack_bottleneck_identified_before_scaling` — the bottleneck is declared identified; scaling targets the bottleneck, not everything.
- `failure_mode_pack_measure_before_scaling_declared` — measurement before scaling is declared.
- `failure_mode_pack_stateless_horizontal_scaling_where_scaled_declared` — services that scale are declared stateless and scaling horizontally.
- `failure_mode_pack_zero_trust_boundaries_declared` — zero-trust boundaries are declared.
- `failure_mode_pack_least_privilege_declared` — least privilege is declared.
- `failure_mode_pack_secrets_management_declared` — real secrets management is declared.
- `failure_mode_pack_external_trust_boundary_stated` — where the external trust boundary sits is declared stated; the skill's topology keeps it at the tunnel, not the app.
- `failure_mode_pack_cache_invalidation_stated_where_caching_used` — gated: cache invalidation is stated honestly for the caching used, required only where `caching.caching_used` is declared `true`; when the gate is declared `false` the check passes as not applicable, and when the gate field is absent the check is missing evidence. Caching is deliberate and its invalidation is named.

**red_lines (6 checks)** — the skill's anti-patterns, each of
which must be declared absent (`false`) to pass; an absent
field is missing evidence:

- `failure_mode_pack_free_of_distributed_monolith` — no distributed monolith is present in the record (`red_lines.distributed_monolith_present` is `false`).
- `failure_mode_pack_free_of_shared_mutable_state` — no shared mutable state is present in the record (`red_lines.shared_mutable_state_present` is `false`).
- `failure_mode_pack_free_of_retries_without_idempotency_or_backpressure` — no retries without idempotency or backpressure are present in the record (`red_lines.retries_without_idempotency_or_backpressure_present` is `false`).
- `failure_mode_pack_free_of_design_without_observability` — no design without observability is present in the record (`red_lines.design_without_observability_present` is `false`).
- `failure_mode_pack_free_of_premature_microservices` — no microservices adopted before the monolith hurts are present in the record (`red_lines.premature_microservices_present` is `false`).
- `failure_mode_pack_free_of_strong_consistency_assumed_without_tradeoff` — no strong consistency assumed for free, without its trade-off stated, is present in the record (`red_lines.strong_consistency_assumed_without_tradeoff_present` is `false`).

Seventeen checks are computed from the declared rows, using
only the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:
the four component-inventory checks, the eight
failure-mode-row checks, and five of the mitigation-coverage
checks (`failure_mode_pack_mitigations_list_declared`,
`every_failure_mode_pack_mitigation_id_unique`,
`every_failure_mode_pack_mitigation_description_declared`,
`every_failure_mode_pack_failure_mitigation_referenced`,
`every_failure_mode_pack_mitigation_residual_risk_stated`).
Four further checks are gated on the record's own declared
gate fields, following the skill's own conditional scope —
when the gate is declared `false`, the check passes as not
applicable; when the gate field is absent, the check is
missing evidence; when the gate is `true`, the target
declaration is required: the three queue checks (gated on
`queues.queues_used`) and the cache-invalidation check
(gated on `caching.caching_used`).

### Verdict vocabulary and computed fields

The verdict is one of `FAILURE_MODE_PACK_SOUND` (all 56
checks pass), `FAILURE_MODE_PACK_NOT_SOUND` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across seven sections:
design_framing_and_boundaries, component_inventory,
failure_mode_rows, mitigation_coverage,
state_reliability_and_queues,
observability_scaling_and_security, red_lines. Each section
is itself reported as `pass`, `fail`, or
`insufficient_evidence` on the same rule.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the seventeen primary computed checks above cannot be
completed — that is, when none of them fails but at least one
is missing), `failure_mode_components_count`,
`failure_modes_count` and `failure_mode_mitigations_count`
(the declared list lengths, or null when a list is not
declared — counts are reported as integers, exactly), the
duplicate-id lists `duplicate_failure_mode_component_ids`,
`duplicate_failure_mode_ids` and
`duplicate_failure_mode_mitigation_ids`, the row-name lists
named in the computed checks above
(`failure_mode_components_without_responsibility`,
`failure_mode_components_without_contract`,
`failure_modes_with_unknown_component_reference`,
`failure_modes_without_description`,
`failure_modes_without_effect`,
`failure_modes_with_nonpositive_rating`,
`failure_modes_with_rpn_mismatch`,
`failure_mode_components_without_failure_mode`,
`failure_mode_mitigations_without_description`,
`failure_mode_mitigations_without_residual_risk`,
`failure_modes_with_unknown_mitigation_reference`), and the
ratios `component_contract_ratio` (components declaring a
contract ÷ declared components), `component_failure_coverage_ratio`
(declared component ids covered by a declared failure mode ÷
declared components), `rpn_recompute_ratio` (failure modes
whose declared RPN recomputes exactly ÷ declared failure
modes) and `mitigation_resolution_ratio` (failure modes whose
`mitigation_id` resolves to a declared mitigation ÷ declared
failure modes). **Fixed serialization rule:** computed ratios
are reported as strings with exactly six decimal places,
produced in both implementations by the same rule — round
half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then
format with exactly six decimals. A ratio is null when its
denominator list is absent or empty (the coverage and
resolution ratios are also null when the second list they
depend on is not declared). That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.

The skill states no numeric threshold at all — no severity,
occurrence or detection scale, no risk-priority-number
cutoff, no component or failure-mode count, no load or
latency bar — so no such check is invented. Quantities are
computed and reported; the only bars on the computed rows are
exact recomputation and completeness over the caller's own
declared rows, exactly as stated above. Declined thresholds,
named: a severity, occurrence or detection rating scale or
range (for example 1–10) or a maximum rating value (a rating
is checked for positivity only — that it is a rating at all);
an RPN cutoff, high-risk RPN bar, or any rule that an RPN
above some number requires a stronger mitigation (RPNs are
recomputed exactly, never graded); a minimum or maximum
number of components, failure modes or mitigations beyond at
least one row in each declared list; a failure-modes-per-component
count beyond at least one covering failure mode per declared
component; a residual-risk acceptability bar (only that
residual risk and its acceptance are stated is checked,
never whether the residual risk is acceptable); a load,
throughput or latency bar for the design under load (the
skill's "holds under load" is checked as declared framing,
never measured); timeout durations, retry counts, backoff or
jitter parameters, or circuit-breaker thresholds (only that
each mechanism is declared is checked); queue depth,
backpressure or dead-letter volume bars (only that each is
declared, where queues are used, is checked); a cache TTL or
invalidation-latency bar (only that invalidation is stated,
where caching is used, is checked); a scaling, log-volume,
metric-cardinality or trace-sampling bar; any judgment that
the design is safe, reliable, adequate or good (only that its
declared failure-mode record contains what the skill
requires, and that its declared rows are internally
consistent, is checked).

## Distinct ground

The nearest siblings are `structured-root-cause-analysis` (a
declared root-cause analysis record for a problem that has
already occurred — problem framing, MECE decomposition and
hypothesis tree, timeline, fishbone factors, a causal chain,
tiered evidence, verification by revert/test, falsification
and corrective actions), `architecture-decision-record` (one
architecture decision — its context, options, decision and
consequences) and `service-isolation-hardening-review` (the
isolation and hardening posture of a service that already
exists). This atom shares **zero checks** with any of them
(verified mechanically by enumerating `evaluate({})` check
names from every atom oracle in `services/*/src/*.py` and
comparing, with a grep of check strings over the same files
as the fallback for oracles whose `evaluate({})` raises or
returns a different shape — zero overlap by both methods):
every check here is a prospective design-failure-mode
question — a design framed from its requirement and data flow
before build, a declared component inventory with a
responsibility and a contract per component, declared failure
modes each naming a declared component with a failure-mode
description, an effect, positive severity / occurrence /
detection ratings and an exactly recomputing RPN, every
declared component covered by a declared failure mode,
declared mitigations each failure mode resolves to with
residual risk stated, source of truth, minimised distributed
state, idempotency, explicit CAP trade-offs, timeouts,
retries with jitter, circuit breakers, graceful degradation,
readiness distinguished from liveness, queue semantics where
queues are used, logs / metrics / traces, bottleneck-first
scaling, zero-trust, least privilege, secrets management, the
external trust boundary, cache invalidation where caching is
used, and the systems-builder anti-patterns refused. The
boundary must be unmistakable, both ways: **this atom is
PROSPECTIVE** — a design's failure modes, asked before it is
built, about what *could* fail — while
`structured-root-cause-analysis` is **RETROSPECTIVE** — a
problem that *has* occurred, asked about what *did* cause it;
a design's prospective failure modes here, a past incident's
or problem's root causes there, and neither atom answers the
other's question. Likewise: a whole design's component-by-component
failure-mode coverage here; a single decision's record there;
a design that does not yet exist here; an existing service's
isolation and hardening posture there.

## Honest scoping

This atom reviews a **declared** system-design failure-mode
analysis record — it designs no system, draws no data flow,
invents no component or failure mode, performs no
failure-mode analysis, assigns no severity, occurrence or
detection rating, computes no risk priority number of its
own (it only recomputes the caller's declared RPNs against
the caller's declared ratings), tests no load, inspects no
code, system or deployment, and does not verify that any
declared fact is true. A pack is sound *on the caller's
declared evidence*: a record that declares its analysis done
before build, its ratings positive, its RPNs recomputing, its
components covered and its mitigations resolving passes those
checks even if the real analysis did none of it. It is a
completeness and consistency audit of the failure-mode record
the skill requires, **not a design service, not a
failure-mode analysis service, not a safety or reliability
certification, and not engineering advice**: it never decides
whether a declared failure mode is the right one, whether a
declared rating is the right rating, whether a declared
mitigation will work, whether the residual risk is
acceptable, or whether the design should be built — only that
the record contains what the skill's method and red lines
demand, and that its declared rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never performed or judged): the skill's
design and advice steps are **excluded by name** from this
atom, which audits only the declared record of those steps —
designing a system or any part of one (choosing components,
boundaries, contracts, state stores, queues, caches or
topology); performing the failure-mode analysis itself
(identifying what could fail, or its effects); assigning or
advising severity, occurrence or detection ratings, or
recommending an RPN response; selecting, designing or
advising mitigations; advising on state, consistency, CAP,
reliability, scaling or security architecture for a caller's
real system; and reviewing or approving a design for build.
Each is a design/advice step the deterministic core does not
do. No numeric thresholds at all beyond positivity of a
declared rating and exact RPN recomputation (the skill states
none — see the declined list above); no live verification of
any declared fact; no judgment of design *quality* — whether
the declared design, analysis or mitigations are adequate for
the real system is the caller's declaration, checked only for
declared presence and consistency.

## U-13 regulatory screen

**Classification: (b) — screen-NO, flag-with-controls (the
census class).** This atom is in the engineering class, so it
is screened with full care under the strictest reading, and
it is **not** classified (a) "No outright": its subject
matter is engineering territory — a failure-mode analysis
with severity / occurrence / detection ratings and risk
priority numbers is the vocabulary of engineering practice
(the FMEA discipline), the design under analysis could be a
safety-relevant or regulated system, and a bare "sound"
verdict over a real design's failure-mode record could be
read as an engineering determination if the controls below
were stripped. It is also **not** classified (c)
genuinely-open (the personal-financial-snapshot class): every
check reduces to deterministic completeness and consistency
over the declared record plus exact declared arithmetic (each
declared RPN recomputed from the caller's own declared
ratings) — no check requires the atom to exercise engineering
judgment, produce a design output, assign a rating, or render
advice, and no personal position of any kind is handled, so
the pfs-class open flag does not apply. It sits in the
precedent class of `smart-grid-der-design-pack` and
`structured-root-cause-analysis`: declared-record audit only,
advice/design steps excluded as controls, deployed only under
flag for the owner's per-unit ruling.

Controls (all carried in this document and in the atom's own
record, and binding on any deployment):

1. **Declared-record audit only.** The atom audits a
   caller-declared failure-mode analysis record for
   completeness and internal consistency. It produces NO
   system design, NO failure-mode analysis, NO ratings, NO
   mitigation advice, NO safety or reliability certification,
   NO engineering determination, and stamps nothing.
2. **Advice/design-production steps excluded as named red
   lines.** The bound skill's design and advisory steps —
   designing the system, performing the analysis, assigning
   ratings, selecting mitigations, advising on architecture —
   are named exclusions (see Honest scoping), never served
   output.
3. **No imported engineering limits.** The only numeric bars
   are positivity of a declared rating (that it is a rating at
   all) and exact recomputation of the caller's declared RPN
   from the caller's declared ratings. No rating scale, no RPN
   cutoff and no other outside threshold is imported; every
   declined threshold is named above.
4. **No certification.** A `FAILURE_MODE_PACK_SOUND` verdict
   certifies only that the declared record is complete and
   internally consistent on its declared evidence. It is not
   a finding that the design is safe, reliable, compliant or
   fit to build, and it must never be presented as one.
5. **Exclusion language.** This atom audits a declared record;
   it is not engineering advice, not a design service and not
   a failure-mode analysis service. That language is carried
   here, in the oracle's docstring, and in the verdict's own
   scoping, and must be carried on any serving surface.
6. **Deploy disposition.** Flagged for the owner's explicit
   per-unit ruling under U-13 before any deployment — this
   atom is built locally only and is NOT deployed (see
   Status). The flag does not block authoring; it decides the
   deploy disposition the coordinator reports to the owner.

Residual risk, stated plainly: a caller could paste the
verdict into their own design file for a regulated or
safety-relevant system — that is their decision, made on
their record; the artifact determines nothing about the
design. No deploy happens on this atom without the owner's
explicit per-unit ruling in any case.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
