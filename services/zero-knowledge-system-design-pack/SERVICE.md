# Zero knowledge system design pack — `zero-knowledge-system-design-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): design systems that can't see user data — client-side E2EE, metadata honesty, ZKP only where justified.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result. In this atom's deterministic form, the caller submits a **declared zero-knowledge system design record** and receives the design-record audit verdict as the deliverable: the atom proves nothing, verifies no proof, runs no cryptography, and certifies no security property (see Honest scoping).

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Designing vault-family apps**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the zero-knowledge system design manifest

The caller submits one JSON manifest: a declared ZK system
design record for one system being designed, made from the
design record as actually written. Every field below is read
by the named section's checks. A field **absent** = evidence
missing (`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the check fails (`ZK_DESIGN_RECORD_NOT_SOUND`).
All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `design_title` (string; carried into the verdict output, not itself checked) | — |
| `trust_model.server_content_visibility_declared` (boolean) | trust_model_and_key_custody |
| `trust_model.server_metadata_visibility_declared` (boolean) | trust_model_and_key_custody |
| `trust_model.server_access_pattern_visibility_declared` (boolean) | trust_model_and_key_custody |
| `trust_model.server_role_in_design_declared` (boolean) | trust_model_and_key_custody |
| `trust_model.key_custody_description_declared` (boolean) | trust_model_and_key_custody |
| `trust_model.key_generation_location_declared` (boolean) | trust_model_and_key_custody |
| `trust_model.key_storage_location_declared` (boolean) | trust_model_and_key_custody |
| `trust_model.threat_actors_in_design_declared` (boolean) | trust_model_and_key_custody |
| `e2ee_design.client_encryption_architecture_declared` (boolean) | client_encryption_sharing_and_auth_design |
| `e2ee_design.key_derivation_approach_declared` (boolean) | client_encryption_sharing_and_auth_design |
| `e2ee_design.ciphertext_envelope_format_declared` (boolean) | client_encryption_sharing_and_auth_design |
| `e2ee_design.auth_flow_without_credential_exposure_declared` (boolean) | client_encryption_sharing_and_auth_design |
| `e2ee_design.pake_style_auth_approach_addressed` (boolean) | client_encryption_sharing_and_auth_design |
| `e2ee_design.sharing_key_wrapping_design_declared` (boolean) | client_encryption_sharing_and_auth_design |
| `e2ee_design.share_revocation_design_declared` (boolean) | client_encryption_sharing_and_auth_design |
| `e2ee_design.share_reencryption_path_declared` (boolean) | client_encryption_sharing_and_auth_design |
| `proof_design.zkp_use_justification_declared` (boolean) | proof_system_and_circuit_design |
| `proof_design.zkp_specific_claim_statement_declared` (boolean) | proof_system_and_circuit_design |
| `proof_design.e2ee_alternative_for_proof_need_addressed` (boolean) | proof_system_and_circuit_design |
| `proof_design.circuit_work_budget_declared` (boolean) | proof_system_and_circuit_design |
| `proof_design.total_constraint_count_declared` (number; computed — must recompute from the declared circuit rows, see below) | proof_system_and_circuit_design |
| `circuits` (list of circuit-row objects, each with the entry fields below; computed, see below) | proof_system_and_circuit_design |
| `circuits[].circuit_id` (string; must be unique per row) | proof_system_and_circuit_design |
| `circuits[].circuit_name` (non-empty string) | proof_system_and_circuit_design |
| `circuits[].statement_description` (non-empty string) | proof_system_and_circuit_design |
| `circuits[].constraint_count_declared` (number; must be non-negative) | proof_system_and_circuit_design |
| `setup_and_verifier.trusted_setup_required` (boolean; gates the ceremony check below) | setup_and_verifier_deployment |
| `setup_and_verifier.ceremony_procedure_declared` (boolean; required when a trusted setup is declared required; otherwise the check passes as not applicable) | setup_and_verifier_deployment |
| `setup_and_verifier.setup_parameter_generation_declared` (boolean) | setup_and_verifier_deployment |
| `setup_and_verifier.setup_transcript_publication_declared` (boolean) | setup_and_verifier_deployment |
| `setup_and_verifier.verifier_location_declared` (boolean) | setup_and_verifier_deployment |
| `setup_and_verifier.verification_failure_handling_declared` (boolean) | setup_and_verifier_deployment |
| `verifiers` (list of verifier-row objects, each with the entry fields below; computed, see below) | setup_and_verifier_deployment |
| `verifiers[].verifier_id` (string; must be unique per row) | setup_and_verifier_deployment |
| `verifiers[].verifier_name` (non-empty string) | setup_and_verifier_deployment |
| `verifiers[].deployment_target` (non-empty string) | setup_and_verifier_deployment |
| `verifiers[].verification_key_reference` (non-empty string) | setup_and_verifier_deployment |
| `properties.soundness_property_declaration_recorded` (boolean) | properties_and_proof_selection |
| `properties.completeness_property_declaration_recorded` (boolean) | properties_and_proof_selection |
| `properties.zero_knowledge_property_declaration_recorded` (boolean) | properties_and_proof_selection |
| `properties.soundness_assumptions_declared` (boolean) | properties_and_proof_selection |
| `properties.cryptographic_assumptions_declared` (boolean) | properties_and_proof_selection |
| `properties.proof_system_selection_rationale_recorded` (boolean) | properties_and_proof_selection |
| `properties.proof_system_alternatives_compared_declared` (boolean) | properties_and_proof_selection |
| `properties.proof_system_selection_tradeoffs_recorded` (boolean) | properties_and_proof_selection |
| `recovery_and_limits.recovery_mechanism_design_declared` (boolean) | recovery_limits_and_claim_mapping |
| `recovery_and_limits.recovery_weakening_effects_declared` (boolean) | recovery_limits_and_claim_mapping |
| `recovery_and_limits.recovery_choice_rationale_declared` (boolean) | recovery_limits_and_claim_mapping |
| `recovery_and_limits.encrypted_search_limits_declared` (boolean) | recovery_limits_and_claim_mapping |
| `recovery_and_limits.server_inference_limits_declared` (boolean) | recovery_limits_and_claim_mapping |
| `recovery_and_limits.design_limitations_declared` (boolean) | recovery_limits_and_claim_mapping |
| `claim_mappings` (list of mapping-row objects, each with the entry fields below; computed, see below) | recovery_limits_and_claim_mapping |
| `claim_mappings[].mapping_id` (string; must be unique per row) | recovery_limits_and_claim_mapping |
| `claim_mappings[].claim_text` (non-empty string) | recovery_limits_and_claim_mapping |
| `claim_mappings[].mechanism_reference` (non-empty string) | recovery_limits_and_claim_mapping |
| `red_lines.zk_label_without_key_custody_description_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.zkp_promotion_without_declared_proof_system_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.trusted_setup_ceremony_omitted_where_required_present` (boolean; must be `false` to pass) | red_lines |
| `red_lines.verifier_without_failure_handling_in_design_present` (boolean; must be `false` to pass) | red_lines |
| `red_lines.recovery_weakening_undisclosed_in_design_present` (boolean; must be `false` to pass) | red_lines |

Fifteen checks are computed from the declared rows, using
only the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Circuits declared:** the declared `circuits` list passes
  when it is present and names at least one circuit. An absent
  list is missing evidence; an empty list fails — a record
  that declares a proof system declares no circuit work.
- **Circuit ids unique:** no declared `circuit_id` may appear
  on more than one row. A row with `circuit_id` absent is
  missing evidence for this check.
- **Circuit name per circuit:** every declared circuit row
  declares a non-empty `circuit_name`. A row with the field
  absent is missing evidence; a row declaring an empty name
  fails and is named in `zk_design_circuits_without_name`.
- **Statement per circuit:** every declared circuit row
  declares a non-empty `statement_description` — the claim
  that circuit is written for. Empty fails and is named in
  `zk_design_circuits_without_statement`.
- **Constraint counts non-negative:** every declared circuit
  declares a non-negative `constraint_count_declared`. A
  negative count fails and is named in
  `zk_design_circuits_with_invalid_constraint_count`.
- **Total constraint count recomputes:** the declared
  `proof_design.total_constraint_count_declared` recomputes
  as the sum of the declared per-circuit constraint counts,
  compared on the fixed 6dp serialization below. An absent
  total, an absent circuits list, or a circuit row without a
  count is missing evidence; a mismatch fails.
- **Verifiers declared:** the declared `verifiers` list
  passes when it is present and names at least one verifier
  row. An absent list is missing evidence; an empty list
  fails — it declares no deployment.
- **Verifier ids unique:** no declared `verifier_id` may
  appear on more than one row.
- **Verifier name per verifier:** every declared verifier row
  declares a non-empty `verifier_name`, named in
  `zk_design_verifiers_without_name` when empty.
- **Deployment target per verifier:** every declared verifier
  row declares a non-empty `deployment_target`, named in
  `zk_design_verifiers_without_deployment_target` when empty.
- **Verification-key reference per verifier:** every declared
  verifier row declares a non-empty
  `verification_key_reference`, named in
  `zk_design_verifiers_without_verification_key_reference`
  when empty. The atom records that a reference is declared;
  it never uses the reference to verify anything.
- **Claim mappings declared:** the declared `claim_mappings`
  list passes when it is present and names at least one row.
  An absent list is missing evidence; an empty list fails —
  it declares no mapping at all (the skill: every statement
  maps to a mechanism; no orphans).
- **Mapping ids unique:** no declared `mapping_id` may appear
  on more than one row.
- **Claim text per mapping:** every declared mapping row
  declares a non-empty `claim_text`, named in
  `zk_design_claim_mappings_without_claim_text` when empty.
- **Mechanism reference per mapping:** every declared mapping
  row declares a non-empty `mechanism_reference`, named in
  `zk_design_claim_mappings_without_mechanism_reference` when
  empty.

One further check is gated on the record's own declared gate
field, following the skill's own conditional scope — when the
gate is declared `false`, the check passes as not applicable;
when the gate field is absent, the check is missing evidence;
when the gate is `true`, the target declaration is required:

- **Ceremony procedure:** a ceremony procedure is declared
  only where `setup_and_verifier.trusted_setup_required` is
  declared `true` (a transparent or universal setup that
  declares no trusted setup required owes no ceremony
  procedure in this record format).

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the fifteen primary computed checks above cannot be
completed), `zk_design_circuits_count`,
`zk_design_verifiers_count` and
`zk_design_claim_mappings_count` (the declared list lengths,
or null when a list is not declared — counts are reported as
integers, exactly), the duplicate-id lists
`duplicate_zk_design_circuit_ids`,
`duplicate_zk_design_verifier_ids` and
`duplicate_zk_design_claim_mapping_ids`, the row-name lists
named in the computed checks above,
`zk_design_constraint_count_sum` (the sum of the declared
per-circuit constraint counts), and the ratios
`circuit_statement_coverage_ratio` (circuits with a recorded
statement description ÷ declared circuits),
`verifier_key_reference_coverage_ratio` (verifiers with a
recorded verification-key reference ÷ declared verifiers) and
`claim_mapping_mechanism_coverage_ratio` (mappings with a
recorded mechanism reference ÷ declared mappings). **Fixed
serialization rule:** computed quantities and ratios are
reported as strings with exactly six decimal places, produced
in both implementations by the same rule — round half up to
6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with
exactly six decimals. A ratio is null when its denominator
list is absent or empty. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.

The skill states no numeric threshold at all — its demands
are an exact trust model, key custody described, ZKP only
where justified and budgeted, recovery weakening documented,
limits stated honestly and statements mapped to mechanisms,
not bars the atom can set. Quantities are computed and
reported; the only bars on the computed rows are exact
recomputation and completeness over the caller's own declared
rows, exactly as stated above. Declined thresholds, named: a
minimum or maximum constraint count for any circuit or in
total; a soundness-error bound or any numeric security
parameter (bits of security, curve or field size, hash
output length); a key length, KDF choice, KDF iteration count
or algorithm choice (the skill names Argon2id / OPAQUE as
examples of an approach class, not as a bar this atom sets —
the derivation and auth checks judge only that an approach is
declared and addressed, never which one); a ceremony size,
participant count or contribution threshold; a proof size,
proving time or verification time ceiling; a verifier count
beyond at least one declared row, or a circuit or mapping
count beyond at least one declared row; any judgment that a
declared soundness, completeness or zero-knowledge property
actually holds (those checks record that a declaration and
its assumptions are in the record — they establish nothing);
any judgment that the selected proof system is the right,
best or advisable one (only that a rationale, alternatives
and trade-offs are recorded).

The verdict is one of `ZK_DESIGN_RECORD_SOUND` (all 59 checks
pass), `ZK_DESIGN_RECORD_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across seven sections:
trust_model_and_key_custody,
client_encryption_sharing_and_auth_design,
proof_system_and_circuit_design, setup_and_verifier_deployment,
properties_and_proof_selection,
recovery_limits_and_claim_mapping, red_lines. The verdict
names the **record** — `ZK_DESIGN_RECORD_SOUND` means the
declared design record is complete and internally consistent
on its own declared evidence. It does not mean, and must
never be read as, that the designed system is sound, secure
or zero-knowledge.

## Distinct ground

The nearest sibling is `zero-knowledge-claim-audit` (live,
Tier A) — and the boundary is exact. That atom is a CHECK of
an **existing product's published zero-knowledge claims**
against its declared posture: whether a server operator can
read user data, whether a server stores only opaque bytes,
whether encryption happens on a client device, whether keys
leave a device, escrow and recovery-claim consistency,
plaintext locations in logs / crash dumps / previews,
metadata acknowledgement in the claim, and theater in the
claim's threat model. This atom is a DELIVERABLE audit of a
**design record for a system being designed**: whether the
record's trust-model section states content / metadata /
access-pattern visibility and key custody, whether its
client-encryption, auth and sharing sections are written,
whether its declared circuit rows carry statement
descriptions and constraint counts that recompute to a
declared total, whether a setup ceremony is declared where a
trusted setup is required, whether its verifier / deployment
rows name deployment targets and verification-key references,
whether soundness / completeness / zero-knowledge property
**declarations** and a proof-system selection rationale are
recorded, whether recovery weakening and encrypted-search
limits are declared, and whether the record's own
claim-to-mechanism mapping rows are complete. This atom
shares **zero checks** with the claim audit (verified
mechanically by enumerating `evaluate({})` check names from
every atom oracle in `services/*/src/*.py` and comparing —
zero overlap, and zero overlap with the claim audit in
particular): no check here asks whether any claim about a
running product is true or sound, and no check in the claim
audit asks about circuits, constraint counts, setup
ceremonies, verifier deployments, property declarations or
selection rationale in a design record. The boundary is: the
design record here; published claims about an existing
product there.

## Honest scoping

This atom reviews a **declared** ZK system design record — it
**proves NOTHING, verifies no proof, runs no cryptography,
and certifies no security property**. It inspects no running
system, reads no code, executes no circuit, and tests no
declared posture against the world. A design record is sound
*on the caller's declared evidence*: a record that declares
its trust model written, its circuits listed, its ceremony
declared and its property declarations recorded passes those
checks even if the real design did none of it. It is a
completeness and consistency audit of the design record the
skill requires, **not a security certification, a
cryptographic review, a proof verification, or a guarantee
that the designed system is zero-knowledge, sound, complete
or secure**: it never judges whether a declared property
holds, whether a declared constraint count is the real count
of any real circuit, whether a mechanism reference actually
supports the statement mapped to it, or whether the design
should be built — only that the record contains what the
skill's method and red lines demand, and that its declared
rows are internally consistent.

Named exclusions and non-reducible parts (excluded by name,
never performed): generating a proof; verifying a proof;
certifying the security, soundness, completeness or
zero-knowledge property of any system or design; cryptographic
advice — choosing a proof system, curve, field, hash,
commitment scheme, key-derivation function or security
parameter for a caller, or judging any such declared choice
sound or advisable; constructing, writing or auditing an
actual circuit; running, witnessing or attesting a setup
ceremony; assessing whether a declared mechanism actually
delivers the statement mapped to it; and assessing any real
system's privacy in operation — each is EXCLUDED by name from
this atom, which audits only the declared design record.
Boundary case, named: a design that uses no proof system at
all (pure client-side E2EE, which the skill says is what most
products need) cannot pass this record format's
circuits-declared and verifiers-declared checks (the format
requires at least one declared circuit row and one declared
verifier row — such a design is outside this atom's computed
reach, not failed on its merits).

## U-13 regulatory screen

Screen classification: **(b) — screen-NO, flag-with-controls
(census class).** Keyword screen: the bound skill and this
record name zero-knowledge proof systems, soundness,
cryptographic assumptions and security properties — no
engineering-practice, securities/financial-advice or
psychology-adjacent subject is the atom's output, but a ZK
system design sits adjacent to professional security and
cryptographic engineering judgment: a naive version of this
atom that verified proofs, certified a design secure, or
advised on cryptographic construction could read as
professional advice a reader might rely on. Substance screen:
this atom's output could not itself read as regulated
professional advice **while the controls below hold** — it
audits a caller-**declared** design record for completeness
and internal consistency only (trust-model and design-section
declarations, circuit / verifier / mapping rows recomputed
over the declared rows, setup and ceremony declarations,
property and selection-rationale declarations recorded, and
the red lines refused); every output is a pass / fail /
missing verdict on the record or a quantity recomputed from
the caller's own declared rows, and the verdict vocabulary
names the **record** (`ZK_DESIGN_RECORD_SOUND`), never the
system. Named controls: (1) it **proves nothing, verifies no
proof, runs no cryptography and certifies no security
property** — proof generation, proof verification, security
certification and cryptographic advice are excluded by name
in Honest scoping above; (2) its property checks record only
that a soundness / completeness / zero-knowledge
**declaration** and its assumptions are in the record — they
never state or imply that any property holds, and SERVICE.md
and the check evidence say so in the check itself; (3) it
sets **no threshold** on any cryptographic quantity (see the
declined list) and judges no declared algorithm, parameter or
proof-system choice; (4) it produces **no design** — the
skill's designing steps are the caller's work, recorded in
their record; professional security and cryptographic
decisions for real systems remain the caller's responsible
professionals, on their record. Because the adjacency is real
(a ZK design for a production system is professional security
work) this is the census flag-with-controls class, not class
(a); it is not the genuinely-open personal-financial-snapshot
class (no personal position of any kind is handled). It is
not flagged HOLD CANDIDATE: the HOLD class is for a record
whose shape itself implies a determination a reader could
rely on professionally, and this record's shape — declarations
recorded, rows recomputed, verdict naming the record only,
with the no-certification controls above — makes no such
determination. No deploy happens on this atom without the
owner's explicit per-unit ruling in any case.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **AUTHORED + STAGED — not deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
