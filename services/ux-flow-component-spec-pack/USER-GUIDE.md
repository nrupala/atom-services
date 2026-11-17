# Ux flow component spec pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing a product interface before build and you keep a UX flow and component specification record for one product surface. This atom reads one declared UX flow + component specification record and returns one deterministic verdict across seven sections (ux_flows_and_hierarchy, ux_design_tokens, ux_component_inventory_and_states, ux_data_surface_states, ux_accessibility_declarations, ux_microcopy_and_critique, red_lines): **UX_SPEC_SOUND**, **UX_SPEC_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 45 checks. It audits the declared specification record's completeness and internal consistency only — it designs no interface, produces no flow diagram, token file or component spec, builds no frontend, renders nothing, opens no screen, measures no contrast, traverses no keyboard path, and certifies no accessibility conformance of any kind, to WCAG or to any other standard. A spec is sound *on your declared evidence*: a record that declares its steps resolving, its interactive states complete and its checks noted passes those checks even if the real specification does none of it. It is not a design service, a usability test, or an accessibility audit or certification: it never judges whether a flow is usable, whether a hierarchy is right, whether the declared contrast actually holds, or whether the design should be built — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. The computed checks: the declared `flow_steps` list must be present and name at least one step, with unique `step_id` values, a non-empty `intent`, `entry_condition` and `exit_condition` on every row, and every id in every row's `next_step_ids` naming a declared step (an empty list declares a terminal step); the declared `components` list must be present and name at least one component, with unique `component_id` values and a non-empty `purpose` and `variants_declared` on every row; the declared `screens` list must be present and name at least one screen, with unique `screen_id` values; `accessibility.wcag_target_declared` must be a non-empty string (declaration only — the skill names WCAG AA, but no conformance level is imposed and none is certified); and every declared screen row must declare its contrast check and its keyboard check noted. Three groups of checks are gated on the record's own declared gate fields — when the gate field is absent the check is missing evidence, and rows outside the gate pass as not applicable: every row declared `interactive: true` must carry a `states_declared` list containing all seven states the skill names (`default`, `hover`, `active`, `disabled`, `focus`, `loading`, `error`) and no interactive row may declare `decorative_only: true`, while non-interactive rows are not required to carry the seven; and for every screen row declared `is_data_surface: true`, each of `empty_state_designed`, `loading_state_designed` and `error_state_designed` must be declared `true`, while non-data-surface screens pass those checks as not applicable. A specification with genuinely no interactive component and no data surface passes the gated state checks vacuously on its declared rows, and its gated ratios are null. No numeric threshold is imposed — no external accessibility conformance level imposed as a pass bar, including treating the skill's named WCAG AA as a certification (only that a target is declared, plus the per-screen and per-component declarations); no measured contrast ratio (no contrast is measured); no keyboard-traversal time, tab-count or focus-order bar beyond the declared per-screen keyboard check; no minimum or maximum number of flow steps, components or screens beyond at least one each; no token count, type-scale ratio, spacing unit or elevation scale bar (tokens are checked as defined and single-source, never graded); no state list beyond the seven states the skill itself names for interactive components; no requirement that every product carry every component type the skill lists as examples (inputs, buttons, cards, tables, nav, lists — a component row is checked on its own declarations, not on a universal inventory); and no judgment that the flow is usable, the interface is beautiful, or the design is good (only that its declared specification record contains what the skill requires). The only bars on the computed rows are exact completeness and reference resolution over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "ux-flow-component-spec-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/ux-flow-component-spec-pack` — tool name `ux_flow_component_spec_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/ux-flow-component-spec-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `spec_title` | Specification title (string; carried into the output, not checked) |
| `flow_design.flows_designed_before_implementation` | flow evidence: the flows were designed before implementation |
| `flow_design.primary_journeys_documented_as_step_diagrams` | flow evidence: the primary journeys are documented as step diagrams |
| `flow_design.information_hierarchy_defined_per_screen` | flow evidence: information hierarchy (primary/secondary/tertiary) is defined per screen |
| `flow_design.content_before_decoration` | flow evidence: content is placed before decoration |
| `flow_steps` (list of flow-step objects) | computed: must be present and name at least one step; reported as `ux_flow_steps_count` |
| `flow_steps[].step_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `flow_steps[].intent` (string) | computed: must be present and non-empty on every row — one intent per step |
| `flow_steps[].entry_condition` (string) | computed: must be present and non-empty on every row |
| `flow_steps[].exit_condition` (string) | computed: must be present and non-empty on every row |
| `flow_steps[].next_step_ids` (list of strings) | computed: every id must name a declared step; an empty list declares a terminal step |
| `design_tokens.tokens_single_source_declared` | token evidence: the design tokens are declared as a single source |
| `design_tokens.color_tokens_defined` | token evidence: color tokens are defined |
| `design_tokens.type_scale_tokens_defined` | token evidence: type scale tokens are defined |
| `design_tokens.spacing_tokens_defined` | token evidence: spacing tokens are defined |
| `design_tokens.radius_tokens_defined` | token evidence: radius tokens are defined |
| `design_tokens.elevation_tokens_defined` | token evidence: elevation tokens are defined |
| `components` (list of component objects) | computed: must be present and name at least one component; reported as `ux_components_count` |
| `components[].component_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `components[].purpose` (string) | computed: must be present and non-empty on every row |
| `components[].variants_declared` (string) | computed: must be present and non-empty on every row |
| `components[].interactive` | gates the state-inventory and decorative-only checks: they apply only where a component is declared interactive |
| `components[].decorative_only` | computed: must not be `true` on an interactive row |
| `components[].states_declared` (list of strings) | computed for interactive rows: must contain all seven skill-named states — `default`, `hover`, `active`, `disabled`, `focus`, `loading`, `error` |
| `screens` (list of screen objects) | computed: must be present and name at least one screen; reported as `ux_screens_count` |
| `screens[].screen_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `screens[].is_data_surface` | gates the empty/loading/error checks: they apply only where a screen is declared a data surface |
| `screens[].empty_state_designed` | required when `screens[].is_data_surface` is `true`; otherwise the check passes as not applicable |
| `screens[].loading_state_designed` | gated as above: the loading state is designed for the data surface |
| `screens[].error_state_designed` | gated as above: the error state is designed for the data surface |
| `screens[].contrast_check_noted` | computed: must be `true` on every row — noted as a declaration only; no contrast is measured |
| `screens[].keyboard_check_noted` | computed: must be `true` on every row — noted as a declaration only; no keyboard path is tested |
| `accessibility.wcag_target_declared` (string) | computed: must be present and non-empty — declaration only; no conformance is certified |
| `accessibility.keyboard_reachable_declared` | accessibility evidence: keyboard reachability is declared for the design |
| `accessibility.labels_on_all_fields_declared` | accessibility evidence: labels on all fields are declared |
| `accessibility.visible_focus_declared` | accessibility evidence: visible focus is declared |
| `accessibility.reduced_motion_respected_declared` | accessibility evidence: reduced motion being respected is declared |
| `microcopy.buttons_say_what_they_do` | microcopy evidence: buttons say what they do |
| `microcopy.errors_say_how_to_fix` | microcopy evidence: errors say how to fix the problem |
| `microcopy.empty_states_say_what_to_do_next` | microcopy evidence: empty states say what to do next |
| `microcopy.microcopy_reviewed_for_clarity` | microcopy evidence: the microcopy was reviewed for clarity |
| `critique.compared_against_brief` | critique evidence: the design was compared against the brief |
| `critique.compared_against_domain_conventions` | critique evidence: the design was compared against the domain's conventions |
| `critique.non_orienting_decoration_cut` | critique evidence: decoration that doesn't orient was cut |
| `red_lines.placeholder_lorem_shipped_present` | must be `false` to pass (red line: no placeholder lorem shipped) |
| `red_lines.dead_controls_present` | must be `false` to pass (red line: no dead controls) |
| `red_lines.accessibility_traded_for_aesthetics_present` | must be `false` to pass (red line: no trade of accessibility for aesthetics) |
| `red_lines.aesthetics_traded_for_accessibility_present` | must be `false` to pass (red line: no trade of aesthetics for accessibility — the trade is forbidden in either direction) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward UX_SPEC_NOT_SOUND). All fields are booleans or strings unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/ux-flow-component-spec-pack`:

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

Response — HTTP 200 (trimmed; the full response carries all 45 checks and a text stamp of the verdict):

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
  "summary": "45 pass, 0 fail, 0 missing of 45 checks across seven sections."
}
```

## Verdicts

- **UX_SPEC_SOUND** — every check passes; the declared UX flow + component specification record is complete and internally consistent with the skill's method, quality gates and red lines.
- **UX_SPEC_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `ux_flow_steps_count`, `ux_components_count`, `ux_screens_count`, `ux_interactive_components_count` and `ux_data_surfaces_count` (integers, exactly; each null when its parent list is not declared — the gated counts are the numbers of rows declared interactive / data-surface), `duplicate_ux_flow_step_ids`, `duplicate_ux_component_ids` and `duplicate_ux_screen_ids` (ids carried by more than one row; each null when its list is not declared), `ux_flow_steps_without_intent`, `ux_flow_steps_without_entry_condition`, `ux_flow_steps_without_exit_condition`, `ux_flow_steps_with_unresolved_next_step_references`, `ux_components_without_purpose`, `ux_components_without_variants`, `interactive_ux_components_with_incomplete_states`, `interactive_ux_components_declared_decorative_only`, `ux_data_surfaces_without_empty_state`, `ux_data_surfaces_without_loading_state`, `ux_data_surfaces_without_error_state`, `ux_screens_without_contrast_check` and `ux_screens_without_keyboard_check` (the offending rows for each computed rule; each null when its underlying list is not declared), `flow_step_reference_resolution_ratio` (steps whose declared next-step references all resolve ÷ declared steps), `interactive_component_complete_state_ratio` (interactive components with a complete seven-state inventory ÷ interactive components; null when there are none), `data_surface_complete_state_ratio` (data surfaces with all three of empty/loading/error designed ÷ data surfaces; null when there are none) and `screen_accessibility_check_ratio` (screens with both contrast and keyboard checks noted ÷ declared screens; each ratio a string with exactly six decimal places, and null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the twenty primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
