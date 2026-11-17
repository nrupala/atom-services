# Technical explainer content pack — `technical-explainer-content-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): explain technical topics to broad audiences — accurate simplifications, analogies, examples, fact-checked. The skill's own line governs: "Teaching is compression that must not lie" — explainers that make technical topics understandable to non-specialists without becoming wrong.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result. In this atom's deterministic form, the caller submits a **declared technical-explainer content production record** and receives the content-pack audit verdict as the deliverable: the atom writes no explainer, teaches nothing, authors no content and certifies no learning (see Honest scoping).

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Writing & documents who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Explainers for content sites**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the explainer content pack manifest

The caller submits one JSON manifest: a declared technical
explainer content production record for one explainer, made
from the production as actually carried out. Every field
below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a
field present but false / invalid = the check fails
(`EXPLAINER_CONTENT_NOT_SOUND`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `explainer_title` (string; carried into the verdict output, not itself checked) | — |
| `audience.defined` (boolean) | audience_and_prerequisites |
| `audience.reader_outcome_stated` (boolean) | audience_and_prerequisites |
| `audience.prior_knowledge_assumption_stated` (boolean) | audience_and_prerequisites |
| `audience.prior_knowledge_assumed` (boolean; gates the prerequisites-listed check below) | audience_and_prerequisites |
| `prerequisites` (list of prerequisite-row objects, each with the entry fields below; computed, see below) | audience_and_prerequisites |
| `prerequisites[].prerequisite_id` (string; must be unique per row) | audience_and_prerequisites |
| `prerequisites[].description` (non-empty string) | audience_and_prerequisites |
| `learning_objective_framing.outcomes_stated_as_do_or_say` (boolean) | learning_objectives |
| `learning_objectives` (list of learning-objective-row objects, each with the entry fields below; computed, see below) | learning_objectives |
| `learning_objectives[].objective_id` (string; must be unique per row) | learning_objectives |
| `learning_objectives[].outcome` (non-empty string) | learning_objectives |
| `structure.follows_spine_order` (boolean) | explanation_spine_and_structure |
| `structure.single_core_idea_confirmed` (boolean) | explanation_spine_and_structure |
| `structure.second_core_idea_present` (boolean; gates the split-off check below) | explanation_spine_and_structure |
| `structure.second_core_idea_split_off` (boolean; required when a second core idea is declared present; otherwise the check passes as not applicable) | explanation_spine_and_structure |
| `explanation_sections` (list of explanation-section-row objects, each with the entry fields below; computed, see below) | explanation_spine_and_structure |
| `explanation_sections[].section_id` (string; must be unique per row) | explanation_spine_and_structure |
| `explanation_sections[].spine_stage` (string; one of `question`, `why_it_matters`, `core_idea`, `how_it_works`, `where_it_breaks`, `what_to_watch`) | explanation_spine_and_structure |
| `explanation_sections[].objective_id` (string; computed — must name a declared learning objective, see below) | explanation_spine_and_structure |
| `simplification.language_simplified_not_facts` (boolean) | simplification_and_analogy_integrity |
| `simplification.simplifications_flagged_explicitly` (boolean) | simplification_and_analogy_integrity |
| `simplification.units_preserved_correct` (boolean) | simplification_and_analogy_integrity |
| `simplification.orders_of_magnitude_preserved_correct` (boolean) | simplification_and_analogy_integrity |
| `simplification.directions_preserved_correct` (boolean) | simplification_and_analogy_integrity |
| `simplification.jargon_defined_on_first_use` (boolean) | simplification_and_analogy_integrity |
| `simplification.reading_level_appropriate_for_audience` (boolean) | simplification_and_analogy_integrity |
| `analogy.analogy_used` (boolean; gates the two analogy checks below) | simplification_and_analogy_integrity |
| `analogy.single_analogy_confirmed` (boolean; required when an analogy is declared used; otherwise the check passes as not applicable) | simplification_and_analogy_integrity |
| `analogy.failure_mode_stated` (boolean; gated as above) | simplification_and_analogy_integrity |
| `example_work.worked_mini_examples_included` (boolean) | worked_examples_and_concrete_numbers |
| `example_work.concrete_numbers_included` (boolean) | worked_examples_and_concrete_numbers |
| `example_work.concrete_cases_included` (boolean) | worked_examples_and_concrete_numbers |
| `example_work.visuals_included_where_they_carry_weight` (boolean) | worked_examples_and_concrete_numbers |
| `worked_examples` (list of worked-example-row objects, each with the entry fields below; computed, see below) | worked_examples_and_concrete_numbers |
| `worked_examples[].example_id` (string; must be unique per row) | worked_examples_and_concrete_numbers |
| `worked_examples[].objective_id` (string; computed — must name a declared learning objective, see below) | worked_examples_and_concrete_numbers |
| `worked_examples[].source_id` (string; computed — must name a declared accuracy source, see below) | worked_examples_and_concrete_numbers |
| `worked_examples[].steps_declared_complete` (boolean) | worked_examples_and_concrete_numbers |
| `misconceptions` (list of misconception-row objects, each with the entry fields below; computed, see below) | misconceptions_accuracy_and_safety |
| `misconceptions[].misconception_id` (string; must be unique per row) | misconceptions_accuracy_and_safety |
| `misconceptions[].description` (non-empty string) | misconceptions_accuracy_and_safety |
| `misconceptions[].addressed_section_id` (string; computed — must name a declared explanation section, see below) | misconceptions_accuracy_and_safety |
| `accuracy.accuracy_review_done` (boolean) | misconceptions_accuracy_and_safety |
| `accuracy.every_factual_claim_labeled` (boolean) | misconceptions_accuracy_and_safety |
| `accuracy.every_factual_claim_sourced` (boolean) | misconceptions_accuracy_and_safety |
| `sources` (list of accuracy-source-row objects, each with the entry fields below; computed, see below) | misconceptions_accuracy_and_safety |
| `sources[].source_id` (string; must be unique per row) | misconceptions_accuracy_and_safety |
| `sources[].citation` (non-empty string; the citation as recorded) | misconceptions_accuracy_and_safety |
| `sources[].archived` (boolean) | misconceptions_accuracy_and_safety |
| `safety.safety_relevant_topic` (boolean; gates the two safety checks below) | misconceptions_accuracy_and_safety |
| `safety.expert_review_by_qualified_person` (boolean; required when a safety-relevant topic is declared; otherwise the check passes as not applicable) | misconceptions_accuracy_and_safety |
| `safety.defers_to_licensed_practice_note_included` (boolean; gated as above) | misconceptions_accuracy_and_safety |
| `canonical.canonical_explainer_identified` (boolean) | renderings_and_corrections |
| `canonical.renderings_regenerated_from_canonical_after_updates` (boolean) | renderings_and_corrections |
| `renderings` (list of rendering-row objects, each with the entry fields below; computed, see below) | renderings_and_corrections |
| `renderings[].rendering_id` (string; must be unique per row) | renderings_and_corrections |
| `renderings[].rendering_kind` (string; one of `faq`, `thread`, `video_script`) | renderings_and_corrections |
| `renderings[].derived_from_canonical_source` (boolean) | renderings_and_corrections |
| `corrections.corrections_dated` (boolean) | renderings_and_corrections |
| `corrections.corrections_visible` (boolean) | renderings_and_corrections |
| `corrections.corrections_logged` (boolean) | renderings_and_corrections |
| `red_lines.invented_numbers_or_figures_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.unsupported_studies_show_claim_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.fear_mongering_or_hype_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.teaching_beyond_declared_competence_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.unlicensed_practice_encouraged_present` (boolean; must be `false` to pass — skill red line) | red_lines |

Twenty-eight checks are computed from the declared rows,
using only the skill's own stated rules plus the consistency
of the declared record itself — no outside threshold is
imported:

- **Prerequisites listed where prior knowledge is assumed:**
  the declared `prerequisites` list passes when prior
  knowledge is declared assumed and the list is present and
  names at least one row (this check is also gated — see
  below). An absent list under an assumed-prior-knowledge
  declaration is missing evidence; an empty list fails.
- **Prerequisite ids unique:** no declared `prerequisite_id`
  may appear on more than one row. A row with
  `prerequisite_id` absent is missing evidence for this
  check.
- **Description per prerequisite:** every declared
  prerequisite row declares a non-empty `description`. A row
  with the field absent is missing evidence; a row declaring
  an empty description fails and is named in
  `technical_explainer_prerequisites_without_description`.
- **Learning objectives declared:** the declared
  `learning_objectives` list passes when it is present and
  names at least one objective. An absent list is missing
  evidence; an empty list fails — it declares no objective
  at all.
- **Learning objective ids unique:** no declared
  `objective_id` may appear on more than one objective row.
- **Outcome per learning objective:** every declared
  objective row declares a non-empty `outcome`. A row with
  the field absent is missing evidence; a row declaring an
  empty outcome fails and is named in
  `technical_explainer_learning_objectives_without_outcome`.
- **Explanation sections declared:** the declared
  `explanation_sections` list passes when it is present and
  names at least one section. An absent list is missing
  evidence; an empty list fails — it declares no structure
  at all.
- **Explanation section ids unique:** no declared
  `section_id` may appear on more than one section row.
- **Spine stage recognised per section:** every declared
  section row's `spine_stage` is one of the six stages the
  skill names — `question`, `why_it_matters`, `core_idea`,
  `how_it_works`, `where_it_breaks`, `what_to_watch`. Any
  other value fails and is named in
  `technical_explainer_explanation_sections_with_invalid_spine_stage`.
- **Every section's objective reference resolves:** every
  declared section's `objective_id` names one of the
  declared learning objectives. A section with `objective_id`
  absent, or a record with the objectives list absent, is
  missing evidence; a section naming an undeclared objective
  fails and is named in
  `technical_explainer_explanation_sections_with_unknown_objective_reference`.
- **All six spine stages present:** all six spine stages
  appear among the declared explanation sections; the stages
  not present are named in
  `technical_explainer_missing_spine_stages`.
- **Worked examples declared:** the declared
  `worked_examples` list passes when it is present and names
  at least one example. An absent list is missing evidence;
  an empty list fails — it declares no worked example at all.
- **Worked example ids unique:** no declared `example_id`
  may appear on more than one example row.
- **Every example's objective reference resolves:** every
  declared example's `objective_id` names one of the declared
  learning objectives; a failure is named in
  `technical_explainer_worked_examples_with_unknown_objective_reference`.
- **Every example's source reference resolves:** every
  declared example's `source_id` names one of the declared
  accuracy sources — its figures trace to a declared source;
  a failure is named in
  `technical_explainer_worked_examples_with_unknown_source_reference`.
- **Every example steps-complete:** every declared example
  row declares `steps_declared_complete: true`. A row with
  the field absent is missing evidence; a row declaring it
  false fails and is named in
  `technical_explainer_worked_examples_without_complete_steps`.
- **Accuracy sources declared:** the declared `sources` list
  passes when it is present and names at least one source.
  An absent list is missing evidence; an empty list fails —
  it declares no sourced explainer at all.
- **Accuracy source ids unique:** no declared `source_id`
  may appear on more than one source row.
- **Citation per accuracy source:** every declared source
  row declares a non-empty `citation` — the citation as
  recorded. A row with the field absent is missing evidence;
  a row declaring an empty citation fails and is named in
  `technical_explainer_accuracy_sources_without_citation`.
- **Every accuracy source archived:** every declared source
  row declares `archived: true` (the skill's quality gate:
  accuracy review done, sources archived). A row declaring
  it false fails and is named in
  `technical_explainer_accuracy_sources_not_archived`.
- **Misconceptions declared:** the declared `misconceptions`
  list passes when it is present and names at least one
  misconception. An absent list is missing evidence; an
  empty list fails — it declares no misconception handling
  at all.
- **Misconception ids unique:** no declared
  `misconception_id` may appear on more than one row.
- **Description per misconception:** every declared
  misconception row declares a non-empty `description`; a
  failure is named in
  `technical_explainer_misconceptions_without_description`.
- **Every misconception's addressed-section reference
  resolves:** every declared misconception's
  `addressed_section_id` names one of the declared
  explanation sections; a failure is named in
  `technical_explainer_misconceptions_with_unknown_addressed_section`.
- **Renderings declared:** the declared `renderings` list
  passes when it is present and names at least one rendering.
  An absent list is missing evidence; an empty list fails —
  it declares no rendering at all.
- **Rendering ids unique:** no declared `rendering_id` may
  appear on more than one rendering row.
- **Rendering kind recognised:** every declared rendering's
  `rendering_kind` is one of `faq`, `thread`, `video_script`
  — the renderings the skill names ("re-render, don't
  rewrite: one canonical explainer → FAQ/thread/video-script
  renderings"). Any other value fails and is named in
  `technical_explainer_renderings_with_invalid_kind`.
- **Every rendering derived from the canonical source:**
  every declared rendering row declares
  `derived_from_canonical_source: true`. A row declaring it
  false fails and is named in
  `technical_explainer_renderings_not_derived_from_canonical`.

Six further checks are gated on the record's own declared
gate fields, following the skill's own conditional scope —
when the gate is declared `false`, the check passes as not
applicable; when the gate field is absent, the check is
missing evidence; when the gate is `true`, the target
declaration is required:

- **Prerequisites listed:** at least one prerequisite row is
  required only where `audience.prior_knowledge_assumed` is
  declared `true` (the skill: state assumed prior knowledge
  — none assumed by default).
- **Second core idea split off:** a split-off piece is
  required only where `structure.second_core_idea_present`
  is declared `true` (the skill: one idea per piece; split
  if two).
- **Single analogy and analogy failure mode:** each is
  required only where `analogy.analogy_used` is declared
  `true` (the skill: one analogy, stated with its failure
  mode).
- **Safety expert review and defer-to-licensed-practice
  note:** each is required only where
  `safety.safety_relevant_topic` is declared `true` (the
  skill: safety-relevant topics get expert review and
  "defers to licensed practice" notes).

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when no
computed check fails but not all twenty-eight primary
computed checks above pass), `technical_explainer_prerequisites_count`,
`technical_explainer_learning_objectives_count`,
`technical_explainer_explanation_sections_count`,
`technical_explainer_worked_examples_count`,
`technical_explainer_misconceptions_count`,
`technical_explainer_accuracy_sources_count` and
`technical_explainer_renderings_count` (the declared list
lengths, or null when a list is not declared — counts are
reported as integers, exactly), the duplicate-id lists
`duplicate_technical_explainer_prerequisite_ids`,
`duplicate_technical_explainer_learning_objective_ids`,
`duplicate_technical_explainer_explanation_section_ids`,
`duplicate_technical_explainer_worked_example_ids`,
`duplicate_technical_explainer_misconception_ids`,
`duplicate_technical_explainer_accuracy_source_ids` and
`duplicate_technical_explainer_rendering_ids`, the row-name
lists named in the computed checks above, and the ratios
`spine_stage_coverage_ratio` (distinct declared spine stages
÷ the six stages the skill names),
`objective_section_coverage_ratio` (declared objectives
referenced by at least one declared section ÷ declared
objectives), `worked_example_traceability_ratio` (examples
both traced to a declared objective and a declared source
and declared steps-complete ÷ declared examples),
`accuracy_source_archive_ratio` (sources declared archived
÷ declared sources), `misconception_resolution_ratio`
(misconceptions whose addressed-section reference resolves
to a declared section ÷ declared misconceptions) and
`rendering_derivation_ratio` (renderings declared derived
from the canonical source ÷ declared renderings). **Fixed
serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with
exactly six decimals. A ratio is null when its denominator
list is absent or empty (the spine-stage coverage ratio is
also null when the sections list is absent or empty, and
the objective-section coverage ratio is also null when
either the objectives or the sections list is absent). That
fixed serialization is what makes the Python and TypeScript
outputs byte-identical.

The skill states no numeric threshold at all — its demands
are audience and outcome, the six-stage spine, the
simplification contract, a confessing analogy, concrete
numbers and cases, labelled and sourced claims, and
re-rendering from one canonical source, not bars the atom
can set. Quantities are computed and reported; the only bars
on the computed rows are exact cross-reference and
completeness over the caller's own declared rows, exactly as
stated above. Declined thresholds, named: a reading-level
score or grade (reading level is checked as declared
appropriate for the declared audience, never measured); a
word count, piece length, or section length; a minimum or
maximum number of prerequisites, learning objectives,
explanation sections, worked examples, misconceptions,
accuracy sources or renderings beyond at least one each
where the corresponding list is required above; a number of
analogies beyond the skill's own one-analogy rule where an
analogy is declared used; a source-quality, authority or
recency bar for declared sources (a citation is checked as
recorded and declared archived, never graded); a factual
accuracy bar beyond declared labelling, sourcing and
traceability to declared sources (the atom receives no
source text and verifies nothing against the world); a
simplification-correctness bar beyond the declared
preservation of units, orders of magnitude and directions;
a jargon-density or defined-term coverage bar beyond jargon
declared defined on first use; a learning-effectiveness,
comprehension or learner-assessment bar — no test score,
pass mark or mastery threshold of any kind (this atom
certifies no learning; see U-13); a misconception-coverage
bar beyond at least one declared misconception resolving to
a declared section; a worked-example step-count or
figure-freshness bar beyond steps declared complete and
figures traced to a declared source; a visual-quality or
visual-coverage bar beyond visuals declared included where
they carry weight; a rendering-quality, rendering-length or
per-kind rendering-count bar beyond kind recognised and
derivation from the canonical source declared; a
correction-timeliness bar beyond corrections declared
dated, visible and logged; any judgment that the explainer
is good, clear, engaging or worth publishing (only that its
declared production record contains what the skill
requires).

The verdict is one of `EXPLAINER_CONTENT_SOUND` (all 63
checks pass), `EXPLAINER_CONTENT_NOT_SOUND` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across eight sections:
audience_and_prerequisites, learning_objectives,
explanation_spine_and_structure,
simplification_and_analogy_integrity,
worked_examples_and_concrete_numbers,
misconceptions_accuracy_and_safety,
renderings_and_corrections, red_lines.

## Check register — all 63 checks

Every check the oracle runs, grouped by section, with what
each requires. A boolean declaration check passes only on a
declared `true` (a red-line check only on a declared
`false`); a computed check passes only as described in the
Inputs section above; a gated check passes as not applicable
when its gate is declared `false`.

### audience_and_prerequisites (6 checks)

- `technical_explainer_audience_defined` — the explainer audience was defined.
- `technical_explainer_reader_outcome_stated` — what the reader should be able to do or say afterwards was stated.
- `technical_explainer_prior_knowledge_assumption_stated` — the assumed prior knowledge was stated (none assumed by default).
- `technical_explainer_prerequisites_listed_where_prior_knowledge_assumed` — gated, computed: where prior knowledge is declared assumed, the record names at least one prerequisite row.
- `every_technical_explainer_prerequisite_id_unique` — computed: no declared `prerequisite_id` appears on more than one row.
- `every_technical_explainer_prerequisite_description_declared` — computed: every declared prerequisite declares a non-empty `description`.

### learning_objectives (4 checks)

- `technical_explainer_objectives_stated_as_do_or_say_outcomes` — the objectives are stated as what the reader can do or say afterwards, not as topics covered.
- `technical_explainer_learning_objectives_list_declared` — computed: the learning-objectives list is present and names at least one objective.
- `every_technical_explainer_learning_objective_id_unique` — computed: no declared `objective_id` appears on more than one row.
- `every_technical_explainer_learning_objective_outcome_declared` — computed: every declared objective declares a non-empty `outcome`.

### explanation_spine_and_structure (8 checks)

- `technical_explainer_spine_order_followed` — the piece follows question → why it matters → one core idea → how it works → where it breaks → what to watch, in order.
- `technical_explainer_single_core_idea_confirmed` — the piece carries one core idea only.
- `technical_explainer_second_core_idea_split_off_where_present` — gated: where a second core idea is declared present, it was split off into its own piece.
- `technical_explainer_explanation_sections_list_declared` — computed: the explanation-sections list is present and names at least one section.
- `every_technical_explainer_explanation_section_id_unique` — computed: no declared `section_id` appears on more than one row.
- `every_technical_explainer_explanation_section_spine_stage_recognised` — computed: every declared section's `spine_stage` is one of the six stages the skill names.
- `every_technical_explainer_explanation_section_objective_reference_resolves` — computed: every declared section's `objective_id` names a declared learning objective.
- `technical_explainer_all_spine_stages_declared_present` — computed: all six spine stages are present among the declared explanation sections, none missing.

### simplification_and_analogy_integrity (9 checks)

- `technical_explainer_language_simplified_not_facts` — language was simplified, never facts.
- `technical_explainer_simplifications_flagged_explicitly` — what was simplified, and how, was explicitly flagged.
- `technical_explainer_units_preserved_correct` — units were kept correct through simplification.
- `technical_explainer_orders_of_magnitude_preserved_correct` — orders of magnitude were kept correct through simplification.
- `technical_explainer_directions_preserved_correct` — directions (up/down) were kept correct through simplification.
- `technical_explainer_jargon_defined_on_first_use` — jargon was defined on first use.
- `technical_explainer_reading_level_appropriate_for_audience` — the reading level was declared appropriate for the declared audience.
- `technical_explainer_single_analogy_confirmed_where_analogy_used` — gated: where an analogy is declared used, only one analogy is used.
- `technical_explainer_analogy_failure_mode_stated_where_analogy_used` — gated: where an analogy is declared used, the analogy is stated with its failure mode — where it breaks.

### worked_examples_and_concrete_numbers (9 checks)

- `technical_explainer_worked_mini_examples_included` — worked mini-examples are included.
- `technical_explainer_concrete_numbers_included` — concrete numbers are included, as real figures with dates and sources.
- `technical_explainer_concrete_cases_included` — concrete cases are included.
- `technical_explainer_visuals_included_where_they_carry_weight` — visuals are included where they carry weight.
- `technical_explainer_worked_examples_list_declared` — computed: the worked-examples list is present and names at least one example.
- `every_technical_explainer_worked_example_id_unique` — computed: no declared `example_id` appears on more than one row.
- `every_technical_explainer_worked_example_objective_reference_resolves` — computed: every declared example's `objective_id` names a declared learning objective.
- `every_technical_explainer_worked_example_source_reference_resolves` — computed: every declared example's `source_id` names a declared accuracy source.
- `every_technical_explainer_worked_example_steps_declared_complete` — computed: every declared example is declared steps-complete.

### misconceptions_accuracy_and_safety (13 checks)

- `technical_explainer_accuracy_review_done` — accuracy review was done.
- `technical_explainer_every_factual_claim_labeled` — every factual claim was labeled.
- `technical_explainer_every_factual_claim_sourced` — every factual claim was sourced.
- `technical_explainer_accuracy_sources_list_declared` — computed: the accuracy-sources list is present and names at least one source.
- `every_technical_explainer_accuracy_source_id_unique` — computed: no declared `source_id` appears on more than one row.
- `every_technical_explainer_accuracy_source_citation_recorded` — computed: every declared source declares a non-empty `citation` as recorded.
- `every_technical_explainer_accuracy_source_archived` — computed: every declared source is declared archived.
- `technical_explainer_misconceptions_list_declared` — computed: the misconceptions list is present and names at least one misconception.
- `every_technical_explainer_misconception_id_unique` — computed: no declared `misconception_id` appears on more than one row.
- `every_technical_explainer_misconception_description_declared` — computed: every declared misconception declares a non-empty `description`.
- `every_technical_explainer_misconception_addressed_section_reference_resolves` — computed: every declared misconception's `addressed_section_id` names a declared explanation section.
- `technical_explainer_safety_expert_review_where_safety_relevant` — gated: where a safety-relevant topic is declared, safety-relevant content was reviewed by a qualified person.
- `technical_explainer_defers_to_licensed_practice_note_where_safety_relevant` — gated: where a safety-relevant topic is declared, a defers-to-licensed-practice note is included for it.

### renderings_and_corrections (9 checks)

- `technical_explainer_canonical_explainer_identified` — one canonical explainer was identified as the source.
- `technical_explainer_renderings_regenerated_from_canonical_after_updates` — after an update, the source was updated and the renderings regenerated from it.
- `technical_explainer_renderings_list_declared` — computed: the renderings list is present and names at least one rendering.
- `every_technical_explainer_rendering_id_unique` — computed: no declared `rendering_id` appears on more than one row.
- `every_technical_explainer_rendering_kind_recognised` — computed: every declared rendering's kind is one of `faq`, `thread`, `video_script`.
- `every_technical_explainer_rendering_derived_from_canonical_source` — computed: every declared rendering is declared derived from the canonical explainer, not rewritten separately.
- `technical_explainer_corrections_dated` — corrections are dated.
- `technical_explainer_corrections_visible` — corrections are visible.
- `technical_explainer_corrections_logged` — corrections are logged.

### red_lines (5 checks)

- `technical_explainer_free_of_invented_numbers_or_figures` — red line: no invented numbers or figures are present in the record (`invented_numbers_or_figures_present` declared `false`).
- `technical_explainer_free_of_unsupported_studies_show_claim` — red line: no "studies show" claim without a study is present in the record (`unsupported_studies_show_claim_present` declared `false`).
- `technical_explainer_free_of_fear_mongering_or_hype` — red line: no fear-mongering or hype is present in the record (`fear_mongering_or_hype_present` declared `false`).
- `technical_explainer_free_of_teaching_beyond_declared_competence` — red line: no teaching beyond competence without review is present in the record (`teaching_beyond_declared_competence_present` declared `false`).
- `technical_explainer_free_of_unlicensed_practice_encouragement` — red line: no encouragement of unlicensed practice — in particular electrical/power practice — is present in the record (`unlicensed_practice_encouraged_present` declared `false`).

## Distinct ground

The nearest siblings are `technical-documentation-pack`
(product/system documentation for the users, operators or
developers of the documented thing — how the thing works
and how to use it), `long-form-authoring-pipeline` (a
declared long-form written work — approved outline, drafting
loop, review passes, versioning and publishing of prose) and
`sourced-podcast-episode-production` (a declared podcast
episode production record — scoping, script for listening,
narration, show notes and authorized publishing of one audio
episode). This atom shares **zero checks** with any of them
(verified mechanically by enumerating `evaluate({})` check
names from every atom oracle in `services/*/src/*.py` and
comparing, with a grep of check strings over the same files
as the fallback for oracles whose `evaluate({})` raises or
returns a different shape — zero overlap by both methods):
every check here is a learner-facing explainer question — an
audience and a do-or-say reader outcome declared with its
prior-knowledge assumption, learning objectives as declared
rows, explanation sections carrying the skill's six spine
stages and resolving to declared objectives, simplifications
flagged with units, magnitudes and directions preserved, a
single analogy confessing its failure mode, worked examples
resolving to declared objectives and declared sources,
misconceptions resolved to the sections that address them,
safety-relevant topics expert-reviewed with a
defer-to-licensed-practice note, and one canonical explainer
re-rendered rather than rewritten. The boundaries, in both
directions: **against `technical-documentation-pack`** — the
boundary is audience and purpose: documentation serves
someone using, operating or building the documented thing
and is organised around the thing; this atom serves a
learner and is organised around the learner's progression —
objectives, spine stages and misconceptions — and a record
that documents a product completely still declares nothing
this atom checks, just as a sound explainer pack documents
no product. **Against `long-form-authoring-pipeline`** —
general long-form authoring of prose there (its outline,
drafting, review and publishing discipline, whatever the
subject and reader); a technical explainer pack here, whose
structure is fixed by the skill's pedagogical spine and
whose rows are objectives, worked examples and
misconceptions, not drafts and versions. **Against
`sourced-podcast-episode-production`** — audio episode
production there (a script written for the ear, narration,
listen-back QC, show notes and publishing of an episode);
explainer content packs here, in whatever rendering —
including a `video_script` rendering, which this atom checks
only as a declared derivation from the canonical explainer,
never as a produced or narrated episode. The boundary is:
one learner-facing explainer's declared production record
here; documentation of a thing, a prose authoring pipeline,
and an episode's production there.

## Honest scoping

This atom reviews a **declared** technical explainer content
production record — it writes no explainer, teaches nothing,
researches nothing, fetches or opens no source, verifies no
fact, number, citation or claim against the world, assesses
no learner, and publishes nothing. An explainer pack is
sound *on the caller's declared evidence*: a record that
declares its claims labelled and sourced, its simplifications
flagged, its analogy's failure mode stated and its
safety-relevant topic expert-reviewed passes those checks
even if the real production did none of it. It is a
completeness and consistency audit of the production record
the skill requires, **not a content-authoring service, a
fact-check, a teaching service, or a guarantee that the
explainer is accurate, clear or effective**: it never judges
whether a declared citation actually supports the claim or
example that cites it, whether a simplification is in fact
faithful, whether an analogy is apt, whether any learner
learned anything, or whether the explainer should be
published — only that the record contains what the skill's
method, quality gates and red lines demand, and that its
declared rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never performed or judged): the skill's
generative authorship itself — writing the explainer,
drafting the simplification, choosing and wording the
analogy, working the examples, and composing any rendering
(FAQ, thread or video script); the research and reading
behind the accuracy sources (the related
`verification-and-fact-checking` discipline the skill's
corrections line invokes); audience and outcome design as a
judgment (what this reader should be able to do or say is
the author's call, declared here, never made by the atom);
the accuracy review itself, as a judgment on the content
(declared done here, never performed); expert review of
safety-relevant content itself (declared here; the atom
judges no reviewer's qualification and no review's
sufficiency); any assessment, testing or certification of
learning — the bound skill names no certification or
credentialing step at all, and any such step is EXCLUDED as
a red line from this atom: it certifies no learning, issues
no credential, and no output of it may be read as doing so;
and publishing or distribution execution itself — each is
EXCLUDED by name from this atom, which audits only the
declared record of those steps. Boundary cases, named: an
explainer with genuinely no misconception to handle, no
worked example, no source or no rendering cannot pass this
record format's corresponding list-declared check (the
format requires at least one declared row of each — such a
piece is outside this atom's computed reach, not failed on
its merits); safety review and the licensed-practice note
are gated declarations in this record (required only where
the caller declares a safety-relevant topic, and the atom
judges neither the review's nor the note's professional or
legal sufficiency).

## U-13 regulatory screen

Screen classification: **(b) — screen-NO,
flag-with-controls (census class).** Keyword screen: the
bound skill and this record name safety-relevant topics
expressly — electrical, medical and money topics in the
skill's verification loop, and electrical/power practice in
its red lines — which is regulated-profession and
safety-practice vocabulary, so the keyword screen does not
clear outright. Substance screen: this atom's output could
not itself read as regulated professional advice — it audits
a caller-**declared** explainer production record for
completeness and internal consistency only (audience,
prerequisites and objectives declarations, spine-stage and
cross-reference recomputation over the declared rows,
simplification and analogy declarations, worked-example,
misconception, accuracy-source, safety, rendering and
corrections declarations, and the red lines refused); every
output is a pass / fail / missing verdict on the record or a
ratio recomputed from the caller's own declared rows, and it
produces no explainer content, no instruction and no advice
on any electrical, medical, financial or other regulated
subject. It is flagged, not cleared, because the packs it
audits may themselves be *about* such subjects, and a sound
verdict on the record must never be mistaken for approval of
safety-relevant content. Named controls: (1) it produces
**no explainer content and no advice of any kind** — no
explainer text, no worked example, no rendering, no
recommendation about any topic; the skill's generative and
judgment steps (authoring, researching, accuracy review,
expert review, publishing) are excluded from production by
name above — this atom performs none of them; (2) where a
safety-relevant topic is declared, expert review by a
qualified person and a defers-to-licensed-practice note are
**required checks**, not options, and the red line refuses
any record declaring encouragement of unlicensed practice —
in particular electrical/power practice; (3) it **certifies
no learning and issues no credential** — the bound skill
names no certification or credentialing step, any such step
is excluded as a red line (see Honest scoping), and no
output attests that any learner learned, is competent, or
is qualified to practise anything; (4) it sets **no
threshold** on any subject matter (see the declined list) —
the explainer's topic is whatever the caller declares, the
atom receives no explainer text, takes no position on the
subject, and no output is addressed to any regulated
decision; (5) the safety checks judge declared presence
only, never professional or legal sufficiency — whether the
expert review was adequate and whether the underlying
explainer may lawfully or safely be published remain the
caller's responsibility, on their record. This is the census
class (regulated adjacency flagged and controlled as above),
not (a) no-outright, and not the genuinely-open
personal-financial-snapshot class (no personal position of
any kind is handled). No deploy happens on this atom without
the owner's explicit per-unit ruling in any case.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
