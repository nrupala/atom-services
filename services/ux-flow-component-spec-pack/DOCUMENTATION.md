# Ux flow component spec pack — documentation

**Ux flow component spec pack** · slug `ux-flow-component-spec-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 22647267ae414ecbb3a5ee342afd73f8; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared UX flow + component specification record for completeness and internal consistency only. It surfaces two faces: REST `POST /v1/ux-flow-component-spec-pack` and MCP `POST /mcp/ux-flow-component-spec-pack`. It designs no interface, builds no frontend, renders nothing, measures no contrast, tests no keyboard path and certifies no accessibility conformance of any kind — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **AUTHORED + STAGED — not deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/ux-flow-component-spec-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 22647267ae414ecbb3a5ee342afd73f8). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the spec `Dashboard Flow`); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "ux-flow-component-spec-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the UX flow + component specification manifest.** You declare a UX flow and component specification record for one product surface, made from the specification as actually produced; the atom audits the declared record, it does not design anything for you (see Explanation). The recorded full-pass manifest declares the spec `Dashboard Flow`: the four flow-design flags all `true` (flows designed before implementation, primary journeys documented as step diagrams, information hierarchy defined per screen, content before decoration); one flow step `s1` (intent `Login`, entry `User at landing`, exit `Authenticated`, `next_step_ids` `[]` — a terminal step); all six design-token flags `true`; one component `c1` (purpose `Button`, variants `Primary, Secondary`, `interactive` true, `decorative_only` false, `states_declared` all seven skill-named states); one screen `scr1` (`is_data_surface` true, empty/loading/error states designed true, contrast and keyboard checks noted true); accessibility target `WCAG AA` with all four accessibility flags `true`; all four microcopy flags `true`; all three critique flags `true`; and all four red-line flags `false` (no placeholder lorem shipped, no dead controls, no trade of accessibility for aesthetics, no trade of aesthetics for accessibility).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/ux-flow-component-spec-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `UX_SPEC_SOUND`: "45 pass, 0 fail, 0 missing of 45 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `ux_flow_steps_count` is 1, `ux_components_count` is 1, `ux_screens_count` is 1, `ux_interactive_components_count` is 1, `ux_data_surfaces_count` is 1, all sixteen duplicate / row-name lists are empty (`[]`), and all four ratios — `flow_step_reference_resolution_ratio`, `interactive_component_complete_state_ratio`, `data_surface_complete_state_ratio`, `screen_accessibility_check_ratio` — are `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `UX_SPEC_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "ux-flow-component-spec-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/ux-flow-component-spec-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/ux-flow-component-spec-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `ux_flow_component_spec_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `UX_SPEC_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_ux_flow_step_intent_declared`, `every_ux_flow_step_next_step_reference_resolves`, `every_interactive_ux_component_state_inventory_complete`, and `no_interactive_ux_component_decorative_only`, and the summary reads "41 pass, 4 fail, 0 missing of 45 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, the step `s1` declares an empty `intent` and `next_step_ids` `["nonexistent"]`, failing the intent and reference-resolution checks, with `ux_flow_steps_without_intent` and `ux_flow_steps_with_unresolved_next_step_references` each naming `["s1"]` and `flow_step_reference_resolution_ratio` `"0.000000"`; and the component `c1` declares `states_declared` `["default"]` only and `decorative_only` `true` while interactive, failing the state-inventory and decorative-only checks, with `interactive_ux_components_with_incomplete_states` and `interactive_ux_components_declared_decorative_only` each naming `["c1"]` and `interactive_component_complete_state_ratio` `"0.000000"`, while `data_surface_complete_state_ratio` and `screen_accessibility_check_ratio` stay `"1.000000"`; sections `ux_flows_and_hierarchy` and `ux_component_inventory_and_states` report `fail`, the other five sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). Declare only what is true of the actual specification: give the step its real intent and a resolving next-step list (or `[]` for a terminal step), declare the component's full seven-state inventory, and correct the decorative-only declaration. For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a list is required) and no checks ran. The body names the field and the expected type:


```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "flow_steps",
  "detail": "flow_steps must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/ux-flow-component-spec-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/ux-flow-component-spec-pack` — tool name `ux_flow_component_spec_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `ux_flow_component_spec_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `spec_title`, `flow_steps[].step_id`, `flow_steps[].intent`, `flow_steps[].entry_condition`, `flow_steps[].exit_condition`, `components[].component_id`, `components[].purpose`, `components[].variants_declared`, `screens[].screen_id` and `accessibility.wcag_target_declared` are noted as strings, and `flow_steps`, `flow_steps[].next_step_ids`, `components`, `components[].states_declared` and `screens` as lists there. Where SERVICE.md states no type — the section container objects (`flow_design`, `design_tokens`, `accessibility`, `microcopy`, `critique`, `red_lines`) and the row objects (`flow_steps[]`, `components[]`, `screens[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object`); that grounding is said so in the Notes column. Note the recorded MCP `inputSchema` types the three list properties (`flow_steps`, `components`, `screens`) as `object`, not `array` — SERVICE.md's table and the recorded inputs govern; see Discrepancies. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `UX_SPEC_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, as SERVICE.md groups them — with the multi-section rows named where they occur: the `screens` rows are read by two recorded sections (`ux_data_surface_states` for the list, id and data-surface state fields, and `ux_accessibility_declarations` for the per-screen contrast / keyboard fields), exactly as SERVICE.md's table groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `spec_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: ux_flows_and_hierarchy

| Field | Type | Notes |
|---|---|---|
| `flow_design` | object | The flow-design section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `flow_design.flows_designed_before_implementation` | boolean | — |
| `flow_design.primary_journeys_documented_as_step_diagrams` | boolean | — |
| `flow_design.information_hierarchy_defined_per_screen` | boolean | — |
| `flow_design.content_before_decoration` | boolean | — |
| `flow_steps` | list | List of flow-step-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). The recorded MCP `inputSchema` types this property `object` — see Discrepancies |
| `flow_steps[]` | object | One declared flow-step row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `flow_steps[].step_id` | string | Names the row in the computed outputs; computed: must be unique per row (type stated in SERVICE.md) |
| `flow_steps[].intent` | string | Computed — must be present and non-empty on every row; one intent per step (type stated in SERVICE.md) |
| `flow_steps[].entry_condition` | string | Computed — must be present and non-empty on every row (type stated in SERVICE.md) |
| `flow_steps[].exit_condition` | string | Computed — must be present and non-empty on every row (type stated in SERVICE.md) |
| `flow_steps[].next_step_ids` | list of strings | Computed — every id must name a declared step; an empty list declares a terminal step (type stated in SERVICE.md) |

#### Read by: ux_design_tokens

| Field | Type | Notes |
|---|---|---|
| `design_tokens` | object | The design-tokens section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `design_tokens.tokens_single_source_declared` | boolean | — |
| `design_tokens.color_tokens_defined` | boolean | — |
| `design_tokens.type_scale_tokens_defined` | boolean | — |
| `design_tokens.spacing_tokens_defined` | boolean | — |
| `design_tokens.radius_tokens_defined` | boolean | — |
| `design_tokens.elevation_tokens_defined` | boolean | — |

#### Read by: ux_component_inventory_and_states

| Field | Type | Notes |
|---|---|---|
| `components` | list | List of component-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). The recorded MCP `inputSchema` types this property `object` — see Discrepancies |
| `components[]` | object | One declared component row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `components[].component_id` | string | Names the row in the computed outputs; computed: must be unique per row (type stated in SERVICE.md) |
| `components[].purpose` | string | Computed — must be present and non-empty on every row (type stated in SERVICE.md) |
| `components[].variants_declared` | string | Computed — must be present and non-empty on every row (type stated in SERVICE.md) |
| `components[].interactive` | boolean | Gates the state-inventory and decorative-only checks below |
| `components[].decorative_only` | boolean | Computed-gated — must not be `true` on an interactive row |
| `components[].states_declared` | list of strings | Computed-gated for interactive rows — must contain all seven skill-named states: `default`, `hover`, `active`, `disabled`, `focus`, `loading`, `error` (type stated in SERVICE.md) |

#### Read by: ux_data_surface_states

| Field | Type | Notes |
|---|---|---|
| `screens` | list | List of screen-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Also read by `ux_accessibility_declarations` for the per-screen contrast / keyboard fields grouped there. The recorded MCP `inputSchema` types this property `object` — see Discrepancies |
| `screens[]` | object | One declared screen row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `screens[].screen_id` | string | Names the row in the computed outputs; computed: must be unique per row (type stated in SERVICE.md) |
| `screens[].is_data_surface` | boolean | Gates the empty/loading/error checks below |
| `screens[].empty_state_designed` | boolean | Required when the screen is declared a data surface; otherwise the check passes as not applicable |
| `screens[].loading_state_designed` | boolean | Gated as above |
| `screens[].error_state_designed` | boolean | Gated as above |

#### Read by: ux_accessibility_declarations

| Field | Type | Notes |
|---|---|---|
| `screens[].contrast_check_noted` | boolean | Computed — must be `true` on every screen row; noted as a declaration only, no contrast is measured. Sits in the `screens` rows but is read by this section, as SERVICE.md groups it |
| `screens[].keyboard_check_noted` | boolean | Computed — must be `true` on every screen row; noted as a declaration only, no keyboard path is tested. Grouped as above |
| `accessibility` | object | The accessibility section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `accessibility.wcag_target_declared` | string | Computed — must be present and non-empty; declaration only, no conformance is certified (type stated in SERVICE.md) |
| `accessibility.keyboard_reachable_declared` | boolean | — |
| `accessibility.labels_on_all_fields_declared` | boolean | — |
| `accessibility.visible_focus_declared` | boolean | — |
| `accessibility.reduced_motion_respected_declared` | boolean | — |

#### Read by: ux_microcopy_and_critique

| Field | Type | Notes |
|---|---|---|
| `microcopy` | object | The microcopy section object — read by this same recorded section, which merges the `microcopy` and `critique` input objects. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `microcopy.buttons_say_what_they_do` | boolean | — |
| `microcopy.errors_say_how_to_fix` | boolean | — |
| `microcopy.empty_states_say_what_to_do_next` | boolean | — |
| `microcopy.microcopy_reviewed_for_clarity` | boolean | — |
| `critique` | object | The critique section object — read by this same recorded section. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `critique.compared_against_brief` | boolean | — |
| `critique.compared_against_domain_conventions` | boolean | — |
| `critique.non_orienting_decoration_cut` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.placeholder_lorem_shipped_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.dead_controls_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.accessibility_traded_for_aesthetics_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.aesthetics_traded_for_accessibility_present` | boolean | must be `false` to pass — skill red line, vice-versa direction |

### Checks

All 45 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Note on gated checks: the state-inventory and decorative-only checks are gated on a component row's declared `interactive` field, and the empty/loading/error checks are gated on a screen row's declared `is_data_surface` field; with the gate off, a gated check passes as not applicable on the declared rows.


#### Section: ux_flows_and_hierarchy

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ux_flow_designed_before_implementation` | flows first: the flows were designed before implementation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_primary_journeys_documented_as_step_diagrams` | flows first: the primary journeys are documented as step diagrams | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_information_hierarchy_defined_per_screen` | hierarchy: primary, secondary and tertiary hierarchy is defined per screen | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_content_before_decoration_declared` | hierarchy: content is placed before decoration | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_flow_steps_list_declared` | flow steps: the declared record names its flow steps — the list is present and names at least one step; an absent list is missing evidence and an empty list declares no flow at all | Computed over the declared record. Pass: the `flow_steps` list is present and names at least one step. Fail: the list is present but empty. Missing: the list is absent. |
| `every_ux_flow_step_id_unique` | flow steps: no declared step_id is owned by more than one row | Computed over the declared record. Pass: no declared `step_id` appears on more than one row. Fail: a `step_id` is declared on more than one row (duplicates are named in `duplicate_ux_flow_step_ids`). Missing: the list is absent, or a row has `step_id` absent. |
| `every_ux_flow_step_intent_declared` | flow steps: every declared step declares a non-empty intent — each step carries one intent | Computed over the declared record. Pass: every declared step row declares a non-empty `intent`. Fail: a row declares an empty `intent` (offending rows are named in `ux_flow_steps_without_intent`). Missing: the list is absent, or a row has `intent` absent. |
| `every_ux_flow_step_entry_condition_declared` | flow steps: every declared step declares a non-empty entry condition | Computed over the declared record. Pass: every declared step row declares a non-empty `entry_condition`. Fail: a row declares an empty `entry_condition` (offending rows are named in `ux_flow_steps_without_entry_condition`). Missing: the list is absent, or a row has `entry_condition` absent. |
| `every_ux_flow_step_exit_condition_declared` | flow steps: every declared step declares a non-empty exit condition | Computed over the declared record. Pass: every declared step row declares a non-empty `exit_condition`. Fail: a row declares an empty `exit_condition` (offending rows are named in `ux_flow_steps_without_exit_condition`). Missing: the list is absent, or a row has `exit_condition` absent. |
| `every_ux_flow_step_next_step_reference_resolves` | flow steps: every declared next_step_id on every row names a declared step_id — no dangling flow reference; an empty next list declares a terminal step | Computed over the declared record. Pass: every id in every row's `next_step_ids` names a declared `step_id` (an empty list declares a terminal step and resolves vacuously). Fail: a row names an undeclared step (offending rows are named in `ux_flow_steps_with_unresolved_next_step_references`). Missing: the list is absent, or a row has `next_step_ids` absent. |

#### Section: ux_design_tokens

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ux_design_tokens_single_source_declared` | tokens: the design tokens are declared as a single source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_color_tokens_defined` | tokens: color tokens are defined in the token source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_type_scale_tokens_defined` | tokens: type scale tokens are defined in the token source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_spacing_tokens_defined` | tokens: spacing tokens are defined in the token source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_radius_tokens_defined` | tokens: radius tokens are defined in the token source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_elevation_tokens_defined` | tokens: elevation tokens are defined in the token source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: ux_component_inventory_and_states

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ux_components_list_declared` | components: the declared record names its components — the list is present and names at least one component; an absent list is missing evidence and an empty list declares no inventory at all | Computed over the declared record. Pass: the `components` list is present and names at least one component. Fail: the list is present but empty. Missing: the list is absent. |
| `every_ux_component_id_unique` | components: no declared component_id is owned by more than one row | Computed over the declared record. Pass: no declared `component_id` appears on more than one row. Fail: a `component_id` is declared on more than one row (duplicates are named in `duplicate_ux_component_ids`). Missing: the list is absent, or a row has `component_id` absent. |
| `every_ux_component_purpose_declared` | components: every declared component declares a non-empty purpose | Computed over the declared record. Pass: every declared component row declares a non-empty `purpose`. Fail: a row declares an empty `purpose` (offending rows are named in `ux_components_without_purpose`). Missing: the list is absent, or a row has `purpose` absent. |
| `every_ux_component_variants_declared` | components: every declared component declares its variants in a non-empty declaration | Computed over the declared record. Pass: every declared component row declares a non-empty `variants_declared`. Fail: a row declares an empty `variants_declared` (offending rows are named in `ux_components_without_variants`). Missing: the list is absent, or a row has `variants_declared` absent. |
| `every_interactive_ux_component_state_inventory_complete` | components / quality gate: every interactive component's declared states contain all seven states the skill names — default, hover, active, disabled, focus, loading, error — none missing | Computed-gated over the declared record. Pass: every row declared `interactive: true` has a `states_declared` list containing all seven skill-named states (`default`, `hover`, `active`, `disabled`, `focus`, `loading`, `error`); non-interactive rows are not required to carry the seven and pass as not applicable. Fail: an interactive row's inventory is incomplete (offending rows are named in `interactive_ux_components_with_incomplete_states`). Missing: the list is absent, or an interactive row has `states_declared` (or the gate field `interactive`) absent. |
| `no_interactive_ux_component_decorative_only` | components / quality gate: no interactive component is declared decorative-only | Computed-gated over the declared record. Pass: no row declared `interactive: true` also declares `decorative_only: true`. Fail: an interactive row declares `decorative_only: true` (offending rows are named in `interactive_ux_components_declared_decorative_only`). Missing: the list is absent, or a row has `interactive` or `decorative_only` absent. |

#### Section: ux_data_surface_states

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ux_screens_list_declared` | screens: the declared record names its screens — the list is present and names at least one screen; an absent list is missing evidence and an empty list declares no screens at all | Computed over the declared record. Pass: the `screens` list is present and names at least one screen. Fail: the list is present but empty. Missing: the list is absent. |
| `every_ux_screen_id_unique` | screens: no declared screen_id is owned by more than one row | Computed over the declared record. Pass: no declared `screen_id` appears on more than one row. Fail: a `screen_id` is declared on more than one row (duplicates are named in `duplicate_ux_screen_ids`). Missing: the list is absent, or a row has `screen_id` absent. |
| `every_ux_data_surface_empty_state_designed` | data surfaces / quality gate: every screen declared a data surface declares its empty state designed | Computed-gated over the declared record. Pass: every screen row declared `is_data_surface: true` declares `empty_state_designed: true`; non-data-surface screens pass as not applicable. Fail: a data-surface row declares it `false` (offending screens are named in `ux_data_surfaces_without_empty_state`). Missing: the list is absent, or a data-surface row has the field (or the gate field `is_data_surface`) absent. |
| `every_ux_data_surface_loading_state_designed` | data surfaces / quality gate: every screen declared a data surface declares its loading state designed | Computed-gated over the declared record. Pass: every screen row declared `is_data_surface: true` declares `loading_state_designed: true`; non-data-surface screens pass as not applicable. Fail: a data-surface row declares it `false` (offending screens are named in `ux_data_surfaces_without_loading_state`). Missing: the list is absent, or a data-surface row has the field (or the gate field `is_data_surface`) absent. |
| `every_ux_data_surface_error_state_designed` | data surfaces / quality gate: every screen declared a data surface declares its error state designed | Computed-gated over the declared record. Pass: every screen row declared `is_data_surface: true` declares `error_state_designed: true`; non-data-surface screens pass as not applicable. Fail: a data-surface row declares it `false` (offending screens are named in `ux_data_surfaces_without_error_state`). Missing: the list is absent, or a data-surface row has the field (or the gate field `is_data_surface`) absent. |

#### Section: ux_accessibility_declarations

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ux_accessibility_wcag_target_declared` | accessibility: the record declares its accessibility target in a non-empty declaration (the skill names WCAG AA) — declaration only; this atom certifies no conformance with any target | Computed over the declared record. Pass: `accessibility.wcag_target_declared` is a non-empty string (declaration only — no conformance level is imposed and none is certified). Fail: it is an empty string. Missing: the field is absent. |
| `ux_keyboard_reachable_declared` | accessibility: keyboard reachability is declared for the design | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_labels_on_all_fields_declared` | accessibility: labels on all fields are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_visible_focus_declared` | accessibility: visible focus is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_reduced_motion_respected_declared` | accessibility: reduced motion being respected is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_ux_screen_contrast_check_noted` | accessibility / quality gate: every declared screen declares its contrast check noted — noted as a declaration only; no contrast is measured and no conformance is certified | Computed over the declared record. Pass: every declared screen row declares `contrast_check_noted: true` (noted as a declaration only — no contrast is measured). Fail: a row declares it `false` (offending screens are named in `ux_screens_without_contrast_check`). Missing: the list is absent, or a row has the field absent. |
| `every_ux_screen_keyboard_check_noted` | accessibility / quality gate: every declared screen declares its keyboard check noted — noted as a declaration only; no keyboard path is tested | Computed over the declared record. Pass: every declared screen row declares `keyboard_check_noted: true` (noted as a declaration only — no keyboard path is tested). Fail: a row declares it `false` (offending screens are named in `ux_screens_without_keyboard_check`). Missing: the list is absent, or a row has the field absent. |

#### Section: ux_microcopy_and_critique

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ux_microcopy_buttons_say_what_they_do` | microcopy: buttons say what they do | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_microcopy_errors_say_how_to_fix` | microcopy: errors say how to fix the problem | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_microcopy_empty_states_say_what_to_do_next` | microcopy: empty states say what to do next | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_microcopy_reviewed_for_clarity` | microcopy / quality gate: the microcopy was reviewed for clarity | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_critique_compared_against_brief` | critique: the design was compared against the brief | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_critique_compared_against_domain_conventions` | critique: the design was compared against the domain's conventions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ux_critique_non_orienting_decoration_cut` | critique: decoration that doesn't orient was cut | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `ux_spec_free_of_placeholder_lorem_shipped` | red line: no placeholder lorem shipped is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `ux_spec_free_of_dead_controls` | red line: no dead controls are present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `ux_spec_free_of_accessibility_traded_for_aesthetics` | red line: no trade of accessibility for aesthetics is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `ux_spec_free_of_aesthetics_traded_for_accessibility` | red line: no trade of aesthetics for accessibility is present in the record — the skill forbids the trade in either direction | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object, with these top-level fields in the recorded order:

- `service` (`"ux-flow-component-spec-pack"`), `atom_version` (`"0.1.0"`), and `spec_title` (the manifest's declared spec title, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `ux_flow_steps_count`, `ux_components_count`, `ux_screens_count`, `ux_interactive_components_count` and `ux_data_surfaces_count` (the declared list lengths / gated row counts as integers, exactly, or null when the parent list is not declared); `duplicate_ux_flow_step_ids`, `duplicate_ux_component_ids` and `duplicate_ux_screen_ids` (ids carried by more than one row; each null when its list is not declared, as recorded in the sparse case); `ux_flow_steps_without_intent`, `ux_flow_steps_without_entry_condition`, `ux_flow_steps_without_exit_condition`, `ux_flow_steps_with_unresolved_next_step_references`, `ux_components_without_purpose`, `ux_components_without_variants`, `interactive_ux_components_with_incomplete_states`, `interactive_ux_components_declared_decorative_only`, `ux_data_surfaces_without_empty_state`, `ux_data_surfaces_without_loading_state`, `ux_data_surfaces_without_error_state`, `ux_screens_without_contrast_check` and `ux_screens_without_keyboard_check` (the offending rows for each computed rule; each null when its underlying list is not declared, as recorded in the sparse case); and the ratios `flow_step_reference_resolution_ratio` (steps whose declared next-step references all resolve ÷ declared steps), `interactive_component_complete_state_ratio` (interactive components with a complete seven-state inventory ÷ interactive components; null when there are none), `data_surface_complete_state_ratio` (data surfaces with all three of empty/loading/error designed ÷ data surfaces; null when there are none) and `screen_accessibility_check_ratio` (screens with both contrast and keyboard checks noted ÷ declared screens) — each a string with exactly six decimal places; a ratio is null when its denominator list is absent or empty (or, for the gated ratios, when no row falls under the gate). Computed ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "45 pass, 0 fail, 0 missing of 45 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared spec title, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `UX_SPEC_SOUND` — all 45 checks pass: the declared UX flow + component specification record is complete and internally consistent with the bound skill's method, quality gates and red lines.
- `UX_SPEC_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only — the twenty computed checks named in SERVICE.md): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the twenty computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for a gated check, including passes as not applicable when its gate is off); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `ux_flow_steps_count`, `ux_components_count`, `ux_screens_count`, `ux_interactive_components_count`, `ux_data_surfaces_count`, the three duplicate-id lists, the thirteen row-name lists, and the four ratios (`flow_step_reference_resolution_ratio`, `interactive_component_complete_state_ratio`, `data_surface_complete_state_ratio`, `screen_accessibility_check_ratio`) — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |

| 422 | `{"ok":false,"error":"invalid_input","field":"flow_steps","detail":"flow_steps must be a list"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Design user flows and interfaces — tokens, component specs, states, and accessibility — before implementation (the bound capability, from the skill). You submit one declared record — the UX flow + component specification manifest, made from the specification as actually produced — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 7 sections (`ux_flows_and_hierarchy`, `ux_design_tokens`, `ux_component_inventory_and_states`, `ux_data_surface_states`, `ux_accessibility_declarations`, `ux_microcopy_and_critique`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest siblings `frontend-implementation`, `semantic-html-review` and `audience-contract-design` (SERVICE.md, Distinct ground): every check here is a pre-implementation specification question — the built frontend, the built markup's semantics, and the audience contract are those atoms' ground, not this one's.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (twenty, per SERVICE.md) are calculated from the declared rows themselves — the three declared lists must each be present and name at least one row, with unique ids; every flow step must declare a non-empty intent, entry and exit, and every next-step reference must resolve to a declared step; every component must declare a non-empty purpose and variants; the accessibility target must be a non-empty string; and every screen must declare its contrast and keyboard checks noted — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *Gated checks* follow the skill's own scoping: the state-inventory and decorative-only checks are gated on a component being declared `interactive`, and the empty/loading/error checks are gated on a screen being declared a data surface; with the gate off, a gated check passes as not applicable, and a specification with genuinely no interactive component and no data surface passes the gated state checks vacuously, with its gated ratios null. Aggregation is strict: any `fail` anywhere produces `UX_SPEC_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `UX_SPEC_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are flows-first, hierarchy, single-source tokens, complete state inventories, per-surface states, noted accessibility checks and clear microcopy, not bars the atom can set. Declined, named, exactly as SERVICE.md names them: any external accessibility conformance level imposed as a pass bar — including treating the skill's named WCAG AA as a certification (the atom checks only that a target is declared, plus the per-screen and per-component declarations; it never certifies conformance); a measured contrast ratio (no contrast is measured); a keyboard-traversal time, tab-count or focus-order bar beyond the declared per-screen keyboard check; a minimum or maximum number of flow steps, components or screens beyond at least one each; a token count, type-scale ratio, spacing unit or elevation scale bar (tokens are checked as defined and single-source, never graded); a state list beyond the seven states the skill itself names for interactive components; a requirement that every product carry every component type the skill lists as examples (inputs, buttons, cards, tables, nav, lists — a component row is checked on its own declarations, not on a universal inventory); any judgment that the flow is usable, the interface is beautiful, or the design is good (only that its declared specification record contains what the skill requires). Quantities are computed and reported; the only bars on the computed rows are exact completeness and reference resolution over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** UX flow + component specification record: a verdict of `UX_SPEC_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its steps resolving, its interactive states complete and its checks noted passes those checks even if the real specification does none of it. It is a completeness and consistency audit of the specification record the skill requires, **not a design service, a usability test, or an accessibility audit or certification**. Specifically: **the atom designs no interface, produces no flow diagram, token file or component spec, builds no frontend, renders nothing, opens no screen, measures no contrast, traverses no keyboard path, and certifies no accessibility conformance of any kind, to WCAG or to any other standard.** It never judges whether a flow is usable, whether a hierarchy is right, whether the declared contrast actually holds, or whether the design should be built — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: the design work itself (drawing flows, defining tokens, specifying components); usability testing with real users; accessibility testing, measurement and conformance evaluation of any built or unbuilt interface; frontend implementation (the sibling `frontend-implementation` ground); and review of built markup (the sibling `semantic-html-review` ground) — each is EXCLUDED by name from this atom, which audits only the declared record of the specification step.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Designing product interfaces before build (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was deployed census-style under a U-13 regulatory screen classified **(b) — screen-NO, with the accessibility boundary as the named control (census class)**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: the bound skill and this record name accessibility and WCAG — no engineering-practice, securities/financial-advice or psychology-adjacent subject, and no regulated profession's advice vocabulary; the adjacency is not a regulated-advice subject but a legal-conformance adjacency: accessibility conformance can carry legal weight for a caller in some jurisdictions, so an output that read as certifying conformance would be an exposure. The substance screen, as SERVICE.md records it: this atom's output does not and cannot certify any such thing — it audits a caller-declared specification record for completeness and internal consistency only (flow, hierarchy, token, component-state, data-surface-state, accessibility, microcopy and critique declarations, computed row consistency recomputed over the declared rows, and the red lines refused); every output is a pass / fail / missing verdict on the record or a ratio recomputed from the caller's own declared rows. What prevents a certification or advice reading, as named controls, exactly as SERVICE.md records them: (1) the atom **certifies NO legal or accessibility conformance** — the WCAG check verifies only that a non-empty target is declared in the record, plus that per-screen contrast/keyboard checks are declared noted and per-component state inventories are declared; it measures no contrast, tests no keyboard path, evaluates no interface, and no output states or implies that any product meets WCAG, any accessibility law, or any other standard — conformance, and any legal reliance on it, remain the caller's responsibility, on their own testing; (2) it produces **no design and no advice of any kind** — no flow, no token set, no component spec, no recommendation about any interface; the skill's design steps are excluded from production by name in SERVICE.md — this atom performs none of them; (3) it sets **no threshold** on any subject matter beyond the skill's own stated lists (see the declined list in Explanation). Subject to that named control, the screen outcome is NO, as SERVICE.md records it: the output could not read as regulated professional advice, and with control (1) in force it does not read as an accessibility-conformance certification either. The flag stays open for the Director's review: the screen-NO classification and its controls stand as recorded, and the census flag is not closed by this document.

### For integrators (Users)

You need: a gateway key with the `ux_flow_component_spec_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/ux_flow_component_spec_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_ux_flow_component_spec_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/ux-flow-component-spec-pack` (REST) and `POST /mcp/ux-flow-component-spec-pack` (MCP, tool `ux_flow_component_spec_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 22647267ae414ecbb3a5ee342afd73f8; RC soak to 2026-11-22). Key scope: `ux_flow_component_spec_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **AUTHORED + STAGED — not deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 22647267ae414ecbb3a5ee342afd73f8) shows the atom live. This document follows the evidenced live state: live. The same staleness touches SERVICE.md's U-13 section, which records that “no deploy happens on this atom without the owner's explicit per-unit ruling in any case” — the recorded deployment exists; the U-13 flag itself stays open for the Director's review (see Role views, For regulators) and is not closed by this document.
2. **Check names differ from input field names:** the recorded check names are not the leaf names of the input fields they read. The plain attestation checks are the closest, but most rename or rephrase the field (for example `ux_content_before_decoration_declared` reads `flow_design.content_before_decoration`; `ux_design_tokens_single_source_declared` reads `design_tokens.tokens_single_source_declared`; `ux_accessibility_wcag_target_declared` reads `accessibility.wcag_target_declared`; `ux_keyboard_reachable_declared` reads `accessibility.keyboard_reachable_declared`). The twenty computed checks have no single same-named field at all: for example `ux_flow_steps_list_declared` (the `flow_steps` list), `every_ux_flow_step_next_step_reference_resolves` (every row's `next_step_ids` against the declared `step_id` values), `every_interactive_ux_component_state_inventory_complete` (interactive rows' `states_declared` against the seven skill-named states), and the four red-line checks (`ux_spec_free_of_placeholder_lorem_shipped` and its siblings read the `red_lines.*_present` fields). Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`flow_design`, `design_tokens`, `accessibility`, `microcopy`, `critique`, `red_lines`) or for a row object (`flow_steps[]`, `components[]`, `screens[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers, in the recorded MCP `inputSchema`, and are said so there.
4. **Recorded MCP `inputSchema` types the list properties as `object`:** the `inputSchema` recorded in evidence.json types all ten top-level properties `object` (except `spec_title`, typed `string`) — including `flow_steps`, `components` and `screens`, which SERVICE.md's field table types as lists and the recorded inputs carry as JSON arrays. The schema also states no nested row or leaf types at all — the nested types in the Input reference rest on the recorded evidence inputs and SERVICE.md's table, not on the schema. This document follows SERVICE.md and the recorded inputs: the three properties are lists.
5. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 45 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
6. **Null rules partly unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, the five counts (null when the parent list is not declared) and the ratios (null when the denominator list is absent or empty, or when no row falls under a gated ratio's gate), but it does not state a null rule for the three duplicate-id lists or the thirteen row-name lists. The recorded sparse response returns all of those as `null` when the underlying lists are not declared (as the Output format section records); this document follows the recording.
7. **Section groupings merging and splitting input objects:** the recorded sections do not map one-to-one onto input objects. `ux_microcopy_and_critique` merges two separate input objects, `microcopy` and `critique`. The single `screens` list is split across two recorded sections: `ux_data_surface_states` reads the list, the id-uniqueness rule and the gated empty/loading/error fields, while `ux_accessibility_declarations` reads the same rows' `contrast_check_noted` / `keyboard_check_noted` fields alongside the separate `accessibility` object — so the screen rows are read by two sections, exactly as SERVICE.md's table groups them. This document groups the Input reference and the Checks by the recorded section names, with those mergings and splittings named in place.
8. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (7 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named four computed row-name lists (`ux_flow_steps_without_intent`, `ux_flow_steps_with_unresolved_next_step_references`, `interactive_ux_components_with_incomplete_states`, `interactive_ux_components_declared_decorative_only`) instead of exact check names (R1 ×4); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); and the designed violations input was missing the key paths present in the full-pass manifest across the `accessibility`, `critique`, `design_tokens`, `flow_design`, `microcopy`, `red_lines` and `screens` groups (R3 ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.
9. **Second-tester check-count claim adjudicated (DeepSeek 46 vs recorded 45):** the DeepSeek second read returned "AGREEMENT: partial", claiming the artifact's `checks` array carries 46 entries (10+6+6+6+7+7+4) against a summary of 45. A direct recount of the recorded artifact (evidence.json) finds exactly 45 entries — the `ux_data_surface_states` section carries 5 checks, not DeepSeek's 6 (that section carries the screens-list check, the screen-id-uniqueness check and the three empty/loading/error checks) — and the Python oracle's check register is likewise 45. The adjudication is on record in TEST-REPORT.md: agreement is full in substance (every quantity DeepSeek actually recomputed matches), the partial rests on the second tester's own arithmetic slip, and the recorded 45 governs everywhere in this document.

## Worked examples


Provenance: recorded 2026-11-16T14:11:37.525203+00:00 against gateway v1.1.0, external verification battery Wave 16, source `verification/work/ux-flow-component-spec-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.


### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T14:11:37.525203+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/ux-flow-component-spec-pack/evidence.json`.


Input:

```json
{
  "spec_title": "Dashboard Flow",
  "flow_design": {
    "flows_designed_before_implementation": true,
    "primary_journeys_documented_as_step_diagrams": true,
    "information_hierarchy_defined_per_screen": true,
    "content_before_decoration": true
  },
  "flow_steps": [
    {
      "step_id": "s1",
      "intent": "Login",
      "entry_condition": "User at landing",
      "exit_condition": "Authenticated",
      "next_step_ids": []
    }
  ],
  "design_tokens": {
    "tokens_single_source_declared": true,
    "color_tokens_defined": true,
    "type_scale_tokens_defined": true,
    "spacing_tokens_defined": true,
    "radius_tokens_defined": true,
    "elevation_tokens_defined": true
  },
  "components": [
    {
      "component_id": "c1",
      "purpose": "Button",
      "variants_declared": "Primary, Secondary",
      "interactive": true,
      "decorative_only": false,
      "states_declared": [
        "default",
        "hover",
        "active",
        "disabled",
        "focus",
        "loading",
        "error"
      ]
    }
  ],
  "screens": [
    {
      "screen_id": "scr1",
      "is_data_surface": true,
      "empty_state_designed": true,
      "loading_state_designed": true,
      "error_state_designed": true,
      "contrast_check_noted": true,
      "keyboard_check_noted": true
    }
  ],
  "accessibility": {
    "wcag_target_declared": "WCAG AA",
    "keyboard_reachable_declared": true,
    "labels_on_all_fields_declared": true,
    "visible_focus_declared": true,
    "reduced_motion_respected_declared": true
  },
  "microcopy": {
    "buttons_say_what_they_do": true,
    "errors_say_how_to_fix": true,
    "empty_states_say_what_to_do_next": true,
    "microcopy_reviewed_for_clarity": true
  },
  "critique": {
    "compared_against_brief": true,
    "compared_against_domain_conventions": true,
    "non_orienting_decoration_cut": true
  },
  "red_lines": {
    "placeholder_lorem_shipped_present": false,
    "dead_controls_present": false,
    "accessibility_traded_for_aesthetics_present": false,
    "aesthetics_traded_for_accessibility_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "ux-flow-component-spec-pack",
  "atom_version": "0.1.0",
  "spec_title": "Dashboard Flow",
  "verdict": "UX_SPEC_SOUND",
  "sections": {
    "ux_flows_and_hierarchy": "pass",
    "ux_design_tokens": "pass",
    "ux_component_inventory_and_states": "pass",
    "ux_data_surface_states": "pass",
    "ux_accessibility_declarations": "pass",
    "ux_microcopy_and_critique": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "ux_flows_and_hierarchy",
      "check": "ux_flow_designed_before_implementation",
      "status": "pass",
      "evidence": "flows first: the flows were designed before implementation"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "ux_primary_journeys_documented_as_step_diagrams",
      "status": "pass",
      "evidence": "flows first: the primary journeys are documented as step diagrams"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "ux_information_hierarchy_defined_per_screen",
      "status": "pass",
      "evidence": "hierarchy: primary, secondary and tertiary hierarchy is defined per screen"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "ux_content_before_decoration_declared",
      "status": "pass",
      "evidence": "hierarchy: content is placed before decoration"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "ux_flow_steps_list_declared",
      "status": "pass",
      "evidence": "flow steps: the declared record names its flow steps \u2014 the list is present and names at least one step; an absent list is missing evidence and an empty list declares no flow at all"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "every_ux_flow_step_id_unique",
      "status": "pass",
      "evidence": "flow steps: no declared step_id is owned by more than one row"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "every_ux_flow_step_intent_declared",
      "status": "pass",
      "evidence": "flow steps: every declared step declares a non-empty intent \u2014 each step carries one intent"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "every_ux_flow_step_entry_condition_declared",
      "status": "pass",
      "evidence": "flow steps: every declared step declares a non-empty entry condition"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "every_ux_flow_step_exit_condition_declared",
      "status": "pass",
      "evidence": "flow steps: every declared step declares a non-empty exit condition"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "every_ux_flow_step_next_step_reference_resolves",
      "status": "pass",
      "evidence": "flow steps: every declared next_step_id on every row names a declared step_id \u2014 no dangling flow reference; an empty next list declares a terminal step"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_design_tokens_single_source_declared",
      "status": "pass",
      "evidence": "tokens: the design tokens are declared as a single source"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_color_tokens_defined",
      "status": "pass",
      "evidence": "tokens: color tokens are defined in the token source"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_type_scale_tokens_defined",
      "status": "pass",
      "evidence": "tokens: type scale tokens are defined in the token source"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_spacing_tokens_defined",
      "status": "pass",
      "evidence": "tokens: spacing tokens are defined in the token source"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_radius_tokens_defined",
      "status": "pass",
      "evidence": "tokens: radius tokens are defined in the token source"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_elevation_tokens_defined",
      "status": "pass",
      "evidence": "tokens: elevation tokens are defined in the token source"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "ux_components_list_declared",
      "status": "pass",
      "evidence": "components: the declared record names its components \u2014 the list is present and names at least one component; an absent list is missing evidence and an empty list declares no inventory at all"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "every_ux_component_id_unique",
      "status": "pass",
      "evidence": "components: no declared component_id is owned by more than one row"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "every_ux_component_purpose_declared",
      "status": "pass",
      "evidence": "components: every declared component declares a non-empty purpose"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "every_ux_component_variants_declared",
      "status": "pass",
      "evidence": "components: every declared component declares its variants in a non-empty declaration"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "every_interactive_ux_component_state_inventory_complete",
      "status": "pass",
      "evidence": "components / quality gate: every interactive component's declared states contain all seven states the skill names \u2014 default, hover, active, disabled, focus, loading, error \u2014 none missing"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "no_interactive_ux_component_decorative_only",
      "status": "pass",
      "evidence": "components / quality gate: no interactive component is declared decorative-only"
    },
    {
      "section": "ux_data_surface_states",
      "check": "ux_screens_list_declared",
      "status": "pass",
      "evidence": "screens: the declared record names its screens \u2014 the list is present and names at least one screen; an absent list is missing evidence and an empty list declares no screens at all"
    },
    {
      "section": "ux_data_surface_states",
      "check": "every_ux_screen_id_unique",
      "status": "pass",
      "evidence": "screens: no declared screen_id is owned by more than one row"
    },
    {
      "section": "ux_data_surface_states",
      "check": "every_ux_data_surface_empty_state_designed",
      "status": "pass",
      "evidence": "data surfaces / quality gate: every screen declared a data surface declares its empty state designed"
    },
    {
      "section": "ux_data_surface_states",
      "check": "every_ux_data_surface_loading_state_designed",
      "status": "pass",
      "evidence": "data surfaces / quality gate: every screen declared a data surface declares its loading state designed"
    },
    {
      "section": "ux_data_surface_states",
      "check": "every_ux_data_surface_error_state_designed",
      "status": "pass",
      "evidence": "data surfaces / quality gate: every screen declared a data surface declares its error state designed"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "ux_accessibility_wcag_target_declared",
      "status": "pass",
      "evidence": "accessibility: the record declares its accessibility target in a non-empty declaration (the skill names WCAG AA) \u2014 declaration only; this atom certifies no conformance with any target"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "ux_keyboard_reachable_declared",
      "status": "pass",
      "evidence": "accessibility: keyboard reachability is declared for the design"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "ux_labels_on_all_fields_declared",
      "status": "pass",
      "evidence": "accessibility: labels on all fields are declared"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "ux_visible_focus_declared",
      "status": "pass",
      "evidence": "accessibility: visible focus is declared"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "ux_reduced_motion_respected_declared",
      "status": "pass",
      "evidence": "accessibility: reduced motion being respected is declared"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "every_ux_screen_contrast_check_noted",
      "status": "pass",
      "evidence": "accessibility / quality gate: every declared screen declares its contrast check noted \u2014 noted as a declaration only; no contrast is measured and no conformance is certified"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "every_ux_screen_keyboard_check_noted",
      "status": "pass",
      "evidence": "accessibility / quality gate: every declared screen declares its keyboard check noted \u2014 noted as a declaration only; no keyboard path is tested"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_microcopy_buttons_say_what_they_do",
      "status": "pass",
      "evidence": "microcopy: buttons say what they do"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_microcopy_errors_say_how_to_fix",
      "status": "pass",
      "evidence": "microcopy: errors say how to fix the problem"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_microcopy_empty_states_say_what_to_do_next",
      "status": "pass",
      "evidence": "microcopy: empty states say what to do next"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_microcopy_reviewed_for_clarity",
      "status": "pass",
      "evidence": "microcopy / quality gate: the microcopy was reviewed for clarity"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_critique_compared_against_brief",
      "status": "pass",
      "evidence": "critique: the design was compared against the brief"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_critique_compared_against_domain_conventions",
      "status": "pass",
      "evidence": "critique: the design was compared against the domain's conventions"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_critique_non_orienting_decoration_cut",
      "status": "pass",
      "evidence": "critique: decoration that doesn't orient was cut"
    },
    {
      "section": "red_lines",
      "check": "ux_spec_free_of_placeholder_lorem_shipped",
      "status": "pass",
      "evidence": "red line: no placeholder lorem shipped is present in the record"
    },
    {
      "section": "red_lines",
      "check": "ux_spec_free_of_dead_controls",
      "status": "pass",
      "evidence": "red line: no dead controls are present in the record"
    },
    {
      "section": "red_lines",
      "check": "ux_spec_free_of_accessibility_traded_for_aesthetics",
      "status": "pass",
      "evidence": "red line: no trade of accessibility for aesthetics is present in the record"
    },
    {
      "section": "red_lines",
      "check": "ux_spec_free_of_aesthetics_traded_for_accessibility",
      "status": "pass",
      "evidence": "red line: no trade of aesthetics for accessibility is present in the record \u2014 the skill forbids the trade in either direction"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "ux_flow_steps_count": 1,
  "ux_components_count": 1,
  "ux_screens_count": 1,
  "ux_interactive_components_count": 1,
  "ux_data_surfaces_count": 1,
  "duplicate_ux_flow_step_ids": [],
  "duplicate_ux_component_ids": [],
  "duplicate_ux_screen_ids": [],
  "ux_flow_steps_without_intent": [],
  "ux_flow_steps_without_entry_condition": [],
  "ux_flow_steps_without_exit_condition": [],
  "ux_flow_steps_with_unresolved_next_step_references": [],
  "ux_components_without_purpose": [],
  "ux_components_without_variants": [],
  "interactive_ux_components_with_incomplete_states": [],
  "interactive_ux_components_declared_decorative_only": [],
  "ux_data_surfaces_without_empty_state": [],
  "ux_data_surfaces_without_loading_state": [],
  "ux_data_surfaces_without_error_state": [],
  "ux_screens_without_contrast_check": [],
  "ux_screens_without_keyboard_check": [],
  "flow_step_reference_resolution_ratio": "1.000000",
  "interactive_component_complete_state_ratio": "1.000000",
  "data_surface_complete_state_ratio": "1.000000",
  "screen_accessibility_check_ratio": "1.000000",
  "summary": "45 pass, 0 fail, 0 missing of 45 checks across seven sections.",
  "stamp": "UX FLOW COMPONENT SPEC PACK\nspec_title: Dashboard Flow\nVERDICT: UX_SPEC_SOUND\n  ux_flows_and_hierarchy                       pass\n  ux_design_tokens                             pass\n  ux_component_inventory_and_states            pass\n  ux_data_surface_states                       pass\n  ux_accessibility_declarations                pass\n  ux_microcopy_and_critique                    pass\n  red_lines                                    pass\n45 pass, 0 fail, 0 missing of 45 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T14:11:37.525203+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/ux-flow-component-spec-pack/evidence.json`.


Input:

```json
{
  "spec_title": "Dashboard Flow",
  "flow_design": {
    "flows_designed_before_implementation": true,
    "primary_journeys_documented_as_step_diagrams": true,
    "information_hierarchy_defined_per_screen": true,
    "content_before_decoration": true
  },
  "flow_steps": [
    {
      "step_id": "s1",
      "intent": "",
      "entry_condition": "User at landing",
      "exit_condition": "Authenticated",
      "next_step_ids": [
        "nonexistent"
      ]
    }
  ],
  "design_tokens": {
    "tokens_single_source_declared": true,
    "color_tokens_defined": true,
    "type_scale_tokens_defined": true,
    "spacing_tokens_defined": true,
    "radius_tokens_defined": true,
    "elevation_tokens_defined": true
  },
  "components": [
    {
      "component_id": "c1",
      "purpose": "Button",
      "variants_declared": "Primary, Secondary",
      "interactive": true,
      "decorative_only": true,
      "states_declared": [
        "default"
      ]
    }
  ],
  "screens": [
    {
      "screen_id": "scr1",
      "is_data_surface": true,
      "empty_state_designed": true,
      "loading_state_designed": true,
      "error_state_designed": true,
      "contrast_check_noted": true,
      "keyboard_check_noted": true
    }
  ],
  "accessibility": {
    "wcag_target_declared": "WCAG AA",
    "keyboard_reachable_declared": true,
    "labels_on_all_fields_declared": true,
    "visible_focus_declared": true,
    "reduced_motion_respected_declared": true
  },
  "microcopy": {
    "buttons_say_what_they_do": true,
    "errors_say_how_to_fix": true,
    "empty_states_say_what_to_do_next": true,
    "microcopy_reviewed_for_clarity": true
  },
  "critique": {
    "compared_against_brief": true,
    "compared_against_domain_conventions": true,
    "non_orienting_decoration_cut": true
  },
  "red_lines": {
    "placeholder_lorem_shipped_present": false,
    "dead_controls_present": false,
    "accessibility_traded_for_aesthetics_present": false,
    "aesthetics_traded_for_accessibility_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "ux-flow-component-spec-pack",
  "atom_version": "0.1.0",
  "spec_title": "Dashboard Flow",
  "verdict": "UX_SPEC_NOT_SOUND",
  "sections": {
    "ux_flows_and_hierarchy": "fail",
    "ux_design_tokens": "pass",
    "ux_component_inventory_and_states": "fail",
    "ux_data_surface_states": "pass",
    "ux_accessibility_declarations": "pass",
    "ux_microcopy_and_critique": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "ux_flows_and_hierarchy",
      "check": "ux_flow_designed_before_implementation",
      "status": "pass",
      "evidence": "flows first: the flows were designed before implementation"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "ux_primary_journeys_documented_as_step_diagrams",
      "status": "pass",
      "evidence": "flows first: the primary journeys are documented as step diagrams"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "ux_information_hierarchy_defined_per_screen",
      "status": "pass",
      "evidence": "hierarchy: primary, secondary and tertiary hierarchy is defined per screen"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "ux_content_before_decoration_declared",
      "status": "pass",
      "evidence": "hierarchy: content is placed before decoration"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "ux_flow_steps_list_declared",
      "status": "pass",
      "evidence": "flow steps: the declared record names its flow steps \u2014 the list is present and names at least one step; an absent list is missing evidence and an empty list declares no flow at all"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "every_ux_flow_step_id_unique",
      "status": "pass",
      "evidence": "flow steps: no declared step_id is owned by more than one row"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "every_ux_flow_step_intent_declared",
      "status": "fail",
      "evidence": "flow steps: every declared step declares a non-empty intent \u2014 each step carries one intent"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "every_ux_flow_step_entry_condition_declared",
      "status": "pass",
      "evidence": "flow steps: every declared step declares a non-empty entry condition"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "every_ux_flow_step_exit_condition_declared",
      "status": "pass",
      "evidence": "flow steps: every declared step declares a non-empty exit condition"
    },
    {
      "section": "ux_flows_and_hierarchy",
      "check": "every_ux_flow_step_next_step_reference_resolves",
      "status": "fail",
      "evidence": "flow steps: every declared next_step_id on every row names a declared step_id \u2014 no dangling flow reference; an empty next list declares a terminal step"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_design_tokens_single_source_declared",
      "status": "pass",
      "evidence": "tokens: the design tokens are declared as a single source"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_color_tokens_defined",
      "status": "pass",
      "evidence": "tokens: color tokens are defined in the token source"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_type_scale_tokens_defined",
      "status": "pass",
      "evidence": "tokens: type scale tokens are defined in the token source"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_spacing_tokens_defined",
      "status": "pass",
      "evidence": "tokens: spacing tokens are defined in the token source"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_radius_tokens_defined",
      "status": "pass",
      "evidence": "tokens: radius tokens are defined in the token source"
    },
    {
      "section": "ux_design_tokens",
      "check": "ux_elevation_tokens_defined",
      "status": "pass",
      "evidence": "tokens: elevation tokens are defined in the token source"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "ux_components_list_declared",
      "status": "pass",
      "evidence": "components: the declared record names its components \u2014 the list is present and names at least one component; an absent list is missing evidence and an empty list declares no inventory at all"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "every_ux_component_id_unique",
      "status": "pass",
      "evidence": "components: no declared component_id is owned by more than one row"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "every_ux_component_purpose_declared",
      "status": "pass",
      "evidence": "components: every declared component declares a non-empty purpose"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "every_ux_component_variants_declared",
      "status": "pass",
      "evidence": "components: every declared component declares its variants in a non-empty declaration"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "every_interactive_ux_component_state_inventory_complete",
      "status": "fail",
      "evidence": "components / quality gate: every interactive component's declared states contain all seven states the skill names \u2014 default, hover, active, disabled, focus, loading, error \u2014 none missing"
    },
    {
      "section": "ux_component_inventory_and_states",
      "check": "no_interactive_ux_component_decorative_only",
      "status": "fail",
      "evidence": "components / quality gate: no interactive component is declared decorative-only"
    },
    {
      "section": "ux_data_surface_states",
      "check": "ux_screens_list_declared",
      "status": "pass",
      "evidence": "screens: the declared record names its screens \u2014 the list is present and names at least one screen; an absent list is missing evidence and an empty list declares no screens at all"
    },
    {
      "section": "ux_data_surface_states",
      "check": "every_ux_screen_id_unique",
      "status": "pass",
      "evidence": "screens: no declared screen_id is owned by more than one row"
    },
    {
      "section": "ux_data_surface_states",
      "check": "every_ux_data_surface_empty_state_designed",
      "status": "pass",
      "evidence": "data surfaces / quality gate: every screen declared a data surface declares its empty state designed"
    },
    {
      "section": "ux_data_surface_states",
      "check": "every_ux_data_surface_loading_state_designed",
      "status": "pass",
      "evidence": "data surfaces / quality gate: every screen declared a data surface declares its loading state designed"
    },
    {
      "section": "ux_data_surface_states",
      "check": "every_ux_data_surface_error_state_designed",
      "status": "pass",
      "evidence": "data surfaces / quality gate: every screen declared a data surface declares its error state designed"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "ux_accessibility_wcag_target_declared",
      "status": "pass",
      "evidence": "accessibility: the record declares its accessibility target in a non-empty declaration (the skill names WCAG AA) \u2014 declaration only; this atom certifies no conformance with any target"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "ux_keyboard_reachable_declared",
      "status": "pass",
      "evidence": "accessibility: keyboard reachability is declared for the design"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "ux_labels_on_all_fields_declared",
      "status": "pass",
      "evidence": "accessibility: labels on all fields are declared"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "ux_visible_focus_declared",
      "status": "pass",
      "evidence": "accessibility: visible focus is declared"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "ux_reduced_motion_respected_declared",
      "status": "pass",
      "evidence": "accessibility: reduced motion being respected is declared"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "every_ux_screen_contrast_check_noted",
      "status": "pass",
      "evidence": "accessibility / quality gate: every declared screen declares its contrast check noted \u2014 noted as a declaration only; no contrast is measured and no conformance is certified"
    },
    {
      "section": "ux_accessibility_declarations",
      "check": "every_ux_screen_keyboard_check_noted",
      "status": "pass",
      "evidence": "accessibility / quality gate: every declared screen declares its keyboard check noted \u2014 noted as a declaration only; no keyboard path is tested"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_microcopy_buttons_say_what_they_do",
      "status": "pass",
      "evidence": "microcopy: buttons say what they do"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_microcopy_errors_say_how_to_fix",
      "status": "pass",
      "evidence": "microcopy: errors say how to fix the problem"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_microcopy_empty_states_say_what_to_do_next",
      "status": "pass",
      "evidence": "microcopy: empty states say what to do next"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_microcopy_reviewed_for_clarity",
      "status": "pass",
      "evidence": "microcopy / quality gate: the microcopy was reviewed for clarity"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_critique_compared_against_brief",
      "status": "pass",
      "evidence": "critique: the design was compared against the brief"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_critique_compared_against_domain_conventions",
      "status": "pass",
      "evidence": "critique: the design was compared against the domain's conventions"
    },
    {
      "section": "ux_microcopy_and_critique",
      "check": "ux_critique_non_orienting_decoration_cut",
      "status": "pass",
      "evidence": "critique: decoration that doesn't orient was cut"
    },
    {
      "section": "red_lines",
      "check": "ux_spec_free_of_placeholder_lorem_shipped",
      "status": "pass",
      "evidence": "red line: no placeholder lorem shipped is present in the record"
    },
    {
      "section": "red_lines",
      "check": "ux_spec_free_of_dead_controls",
      "status": "pass",
      "evidence": "red line: no dead controls are present in the record"
    },
    {
      "section": "red_lines",
      "check": "ux_spec_free_of_accessibility_traded_for_aesthetics",
      "status": "pass",
      "evidence": "red line: no trade of accessibility for aesthetics is present in the record"
    },
    {
      "section": "red_lines",
      "check": "ux_spec_free_of_aesthetics_traded_for_accessibility",
      "status": "pass",
      "evidence": "red line: no trade of aesthetics for accessibility is present in the record \u2014 the skill forbids the trade in either direction"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "ux_flow_steps_count": 1,
  "ux_components_count": 1,
  "ux_screens_count": 1,
  "ux_interactive_components_count": 1,
  "ux_data_surfaces_count": 1,
  "duplicate_ux_flow_step_ids": [],
  "duplicate_ux_component_ids": [],
  "duplicate_ux_screen_ids": [],
  "ux_flow_steps_without_intent": [
    "s1"
  ],
  "ux_flow_steps_without_entry_condition": [],
  "ux_flow_steps_without_exit_condition": [],
  "ux_flow_steps_with_unresolved_next_step_references": [
    "s1"
  ],
  "ux_components_without_purpose": [],
  "ux_components_without_variants": [],
  "interactive_ux_components_with_incomplete_states": [
    "c1"
  ],
  "interactive_ux_components_declared_decorative_only": [
    "c1"
  ],
  "ux_data_surfaces_without_empty_state": [],
  "ux_data_surfaces_without_loading_state": [],
  "ux_data_surfaces_without_error_state": [],
  "ux_screens_without_contrast_check": [],
  "ux_screens_without_keyboard_check": [],
  "flow_step_reference_resolution_ratio": "0.000000",
  "interactive_component_complete_state_ratio": "0.000000",
  "data_surface_complete_state_ratio": "1.000000",
  "screen_accessibility_check_ratio": "1.000000",
  "summary": "41 pass, 4 fail, 0 missing of 45 checks across seven sections.",
  "stamp": "UX FLOW COMPONENT SPEC PACK\nspec_title: Dashboard Flow\nVERDICT: UX_SPEC_NOT_SOUND\n  ux_flows_and_hierarchy                       fail\n  ux_design_tokens                             pass\n  ux_component_inventory_and_states            fail\n  ux_data_surface_states                       pass\n  ux_accessibility_declarations                pass\n  ux_microcopy_and_critique                    pass\n  red_lines                                    pass\n41 pass, 4 fail, 0 missing of 45 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T14:11:37.525203+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/ux-flow-component-spec-pack/evidence.json`.


Input:

```json
{
  "spec_title": "Malformed",
  "flow_steps": "not-a-list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "flow_steps",
  "detail": "flow_steps must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — this atom was deployed census-style under a U-13 screen classified (b) — screen-NO, with the accessibility boundary as the named control (census class), with the three named controls recorded in SERVICE.md's U-13 section; the flag stays open for the Director's review (see Role views, For regulators) |
| Checks named | 45 documented / 45 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (the five counts, the three duplicate-id lists, the thirteen row-name lists, and the four ratios) |
| Input reference typed | Yes — 57 fields (45 leaf fields), each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/ux-flow-component-spec-pack/evidence.json` |

