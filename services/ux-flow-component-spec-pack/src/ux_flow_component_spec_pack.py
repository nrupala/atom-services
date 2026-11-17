#!/usr/bin/env python3
"""Ux flow component spec pack — deterministic core.

Built from the bound skill `ux-ui-design`: "Design user flows
and interfaces — tokens, component specs, states, and
accessibility — before implementation." Its method is this
atom's method: flows first (primary journeys as step diagrams,
each step carrying one intent); information hierarchy
(primary/secondary/tertiary per screen, content before
decoration); design tokens (color, type scale, spacing,
radius, elevation — single source); component inventory
(inputs, buttons, cards, tables, nav, lists — each with
purpose, variants, and all states: default / hover / active /
disabled / focus / loading / error); accessibility (WCAG AA
contrast, keyboard reachable, labels on all fields, visible
focus, reduced motion respected); microcopy (buttons say what
they do, errors say how to fix, empty states say what to do
next); critique (compare against the brief and the domain's
conventions, cut decoration that doesn't orient). Its quality
gates: every interactive element has defined states (none
missing, none decorative-only); empty, loading and error
states designed for every data surface; contrast + keyboard
checks noted per screen; microcopy reviewed for clarity. Its
red lines: no placeholder lorem shipped; no dead controls;
never trade accessibility for aesthetics (or vice versa).

This atom is a DELIVERABLE audit of a declared UX flow +
component specification record: it audits the record a caller
declares — declared flow-step rows with entry/exit
declarations and next-step references, design-token
declarations, declared component rows with state inventories,
declared screen rows with empty/loading/error and per-screen
contrast/keyboard declarations, accessibility declarations,
microcopy and critique declarations, and the red lines
refused. It designs no interface, builds no frontend, renders
nothing, measures no contrast, tests no keyboard path and
certifies NO accessibility conformance — it checks that the
specification record the skill requires is present and
internally consistent on the declared evidence, and it
recomputes declared-row consistency exactly. Where the skill
names WCAG AA, this atom checks only that the record DECLARES
its target (a non-empty `wcag_target_declared` string) plus
the per-screen / per-component declarations below; it never
certifies that any target is met.

Distinct ground: the nearest siblings are
`frontend-implementation` (building the frontend itself —
implemented views, states in code, performance and shipped
behaviour), `semantic-html-review` (the built markup's
semantics — landmarks, headings, labels in actual HTML) and
`audience-contract-design` (an audience/offer contract — who
it is for and what is promised, a different artifact). This
atom shares zero checks with any of them: every check here is
a pre-implementation specification question — a flow step
with one intent, entry and exit, whose next-step references
resolve to declared steps; a single-source token set; a
component whose interactive state inventory is complete
against the seven states the skill names; a data surface with
empty/loading/error designed; an accessibility target merely
declared, never certified. The boundary is: the flow/component
specification record here; the built frontend, the built
markup's semantics, and the audience contract there.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- flow steps: at least one declared row, unique step ids, a
  non-empty intent / entry_condition / exit_condition on every
  row, and every row's declared next_step_ids resolving to a
  declared step id (an empty next list is a declared terminal
  step and resolves vacuously);
- components: at least one declared row, unique component
  ids, a non-empty purpose and variants declaration on every
  row, every interactive row's states_declared containing all
  seven states the skill names (default, hover, active,
  disabled, focus, loading, error), and no interactive row
  declared decorative-only;
- screens: at least one declared row, unique screen ids, and
  for every row declared a data surface, empty / loading /
  error states all declared designed;
- accessibility per screen: every declared screen row declares
  its contrast check and its keyboard check noted;
- accessibility target: the record declares a non-empty
  wcag_target_declared string — declaration only, never a
  conformance finding.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no step count,
no component count, no contrast ratio, no type-scale ratio,
no spacing unit — so no such check is invented; those
quantities are caller declarations at most, and quantities
here are computed and reported, with exact completeness and
reference resolution over the caller's own declared rows as
the only bars. In particular NO external accessibility
conformance level is imposed beyond the skill's own naming of
WCAG AA, and even that is checked as a declaration only.

Verdict:
- any fail             -> UX_SPEC_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> UX_SPEC_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "ux_flows_and_hierarchy",
    "ux_design_tokens",
    "ux_component_inventory_and_states",
    "ux_data_surface_states",
    "ux_accessibility_declarations",
    "ux_microcopy_and_critique",
    "red_lines",
)

REQUIRED_INTERACTIVE_STATES = (
    "default", "hover", "active", "disabled", "focus",
    "loading", "error",
)

MANIFEST_SPEC = {
    "spec_title": "string",
    "flow_design": {
        "flows_designed_before_implementation": "boolean",
        "primary_journeys_documented_as_step_diagrams": "boolean",
        "information_hierarchy_defined_per_screen": "boolean",
        "content_before_decoration": "boolean",
    },
    "flow_steps": [{
        "step_id": "string",
        "intent": "string",
        "entry_condition": "string",
        "exit_condition": "string",
        "next_step_ids": ["string"],
    }],
    "design_tokens": {
        "tokens_single_source_declared": "boolean",
        "color_tokens_defined": "boolean",
        "type_scale_tokens_defined": "boolean",
        "spacing_tokens_defined": "boolean",
        "radius_tokens_defined": "boolean",
        "elevation_tokens_defined": "boolean",
    },
    "components": [{
        "component_id": "string",
        "purpose": "string",
        "variants_declared": "string",
        "interactive": "boolean",
        "decorative_only": "boolean",
        "states_declared": ["string"],
    }],
    "screens": [{
        "screen_id": "string",
        "is_data_surface": "boolean",
        "empty_state_designed": "boolean",
        "loading_state_designed": "boolean",
        "error_state_designed": "boolean",
        "contrast_check_noted": "boolean",
        "keyboard_check_noted": "boolean",
    }],
    "accessibility": {
        "wcag_target_declared": "string",
        "keyboard_reachable_declared": "boolean",
        "labels_on_all_fields_declared": "boolean",
        "visible_focus_declared": "boolean",
        "reduced_motion_respected_declared": "boolean",
    },
    "microcopy": {
        "buttons_say_what_they_do": "boolean",
        "errors_say_how_to_fix": "boolean",
        "empty_states_say_what_to_do_next": "boolean",
        "microcopy_reviewed_for_clarity": "boolean",
    },
    "critique": {
        "compared_against_brief": "boolean",
        "compared_against_domain_conventions": "boolean",
        "non_orienting_decoration_cut": "boolean",
    },
    "red_lines": {
        "placeholder_lorem_shipped_present": "boolean",
        "dead_controls_present": "boolean",
        "accessibility_traded_for_aesthetics_present": "boolean",
        "aesthetics_traded_for_accessibility_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _fmt6(value):
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _duplicates(rows, field):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            nm = c[field]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _ids(rows, field):
    return [c[field] for c in rows
            if isinstance(c, dict) and isinstance(c.get(field), str)]


def evaluate(manifest):
    """Return the verdict dict for a UX flow/component spec manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once ----
    flow_steps, has_flow_steps = _get(manifest, "flow_steps")
    steps_is_list = has_flow_steps and isinstance(flow_steps, list)
    steps_count = len(flow_steps) if steps_is_list else None
    step_rows = flow_steps if steps_is_list else []
    step_ids = _ids(step_rows, "step_id")

    components, has_components = _get(manifest, "components")
    comps_is_list = has_components and isinstance(components, list)
    comps_count = len(components) if comps_is_list else None
    comp_rows = components if comps_is_list else []

    screens, has_screens = _get(manifest, "screens")
    screens_is_list = has_screens and isinstance(screens, list)
    screens_count = len(screens) if screens_is_list else None
    screen_rows = screens if screens_is_list else []

    duplicate_step_ids = (
        _duplicates(step_rows, "step_id") if steps_is_list else None)
    duplicate_component_ids = (
        _duplicates(comp_rows, "component_id") if comps_is_list else None)
    duplicate_screen_ids = (
        _duplicates(screen_rows, "screen_id") if screens_is_list else None)

    steps_without_intent = (
        [_row_name(c, "step_id") for c in step_rows
         if _has(c, "intent") and not _nonempty_str(c.get("intent"))]
        if steps_is_list else None)
    steps_without_entry = (
        [_row_name(c, "step_id") for c in step_rows
         if _has(c, "entry_condition")
         and not _nonempty_str(c.get("entry_condition"))]
        if steps_is_list else None)
    steps_without_exit = (
        [_row_name(c, "step_id") for c in step_rows
         if _has(c, "exit_condition")
         and not _nonempty_str(c.get("exit_condition"))]
        if steps_is_list else None)

    def _next_resolves(c):
        return (_has(c, "next_step_ids")
                and isinstance(c.get("next_step_ids"), list)
                and all(n in step_ids for n in c.get("next_step_ids")))

    steps_with_unresolved = (
        [_row_name(c, "step_id") for c in step_rows
         if _has(c, "next_step_ids")
         and isinstance(c.get("next_step_ids"), list)
         and any(n not in step_ids for n in c.get("next_step_ids"))]
        if steps_is_list else None)

    comps_without_purpose = (
        [_row_name(c, "component_id") for c in comp_rows
         if _has(c, "purpose") and not _nonempty_str(c.get("purpose"))]
        if comps_is_list else None)
    comps_without_variants = (
        [_row_name(c, "component_id") for c in comp_rows
         if _has(c, "variants_declared")
         and not _nonempty_str(c.get("variants_declared"))]
        if comps_is_list else None)

    def _is_interactive(c):
        return isinstance(c, dict) and c.get("interactive") is True

    def _states_complete(c):
        return (_has(c, "states_declared")
                and isinstance(c.get("states_declared"), list)
                and all(s in c.get("states_declared")
                        for s in REQUIRED_INTERACTIVE_STATES))

    interactive_rows = [c for c in comp_rows if _is_interactive(c)]
    interactive_count = len(interactive_rows) if comps_is_list else None
    interactive_incomplete = (
        [_row_name(c, "component_id") for c in interactive_rows
         if _has(c, "states_declared") and not _states_complete(c)]
        if comps_is_list else None)
    interactive_decorative = (
        [_row_name(c, "component_id") for c in interactive_rows
         if c.get("decorative_only") is True]
        if comps_is_list else None)

    def _is_data(c):
        return isinstance(c, dict) and c.get("is_data_surface") is True

    data_rows = [c for c in screen_rows if _is_data(c)]
    data_count = len(data_rows) if screens_is_list else None

    def _without(field):
        return [_row_name(c, "screen_id") for c in data_rows
                if _has(c, field) and c.get(field) is not True]

    data_without_empty = _without("empty_state_designed") if screens_is_list else None
    data_without_loading = _without("loading_state_designed") if screens_is_list else None
    data_without_error = _without("error_state_designed") if screens_is_list else None

    screens_without_contrast = (
        [_row_name(c, "screen_id") for c in screen_rows
         if _has(c, "contrast_check_noted")
         and c.get("contrast_check_noted") is not True]
        if screens_is_list else None)
    screens_without_keyboard = (
        [_row_name(c, "screen_id") for c in screen_rows
         if _has(c, "keyboard_check_noted")
         and c.get("keyboard_check_noted") is not True]
        if screens_is_list else None)

    flow_step_resolution_ratio = (
        sum(1 for c in step_rows if _next_resolves(c)) / steps_count
        if steps_is_list and steps_count > 0 else None)
    interactive_state_ratio = (
        sum(1 for c in interactive_rows if _states_complete(c))
        / interactive_count
        if comps_is_list and interactive_count else None)
    data_surface_ratio = (
        sum(1 for c in data_rows
            if c.get("empty_state_designed") is True
            and c.get("loading_state_designed") is True
            and c.get("error_state_designed") is True) / data_count
        if screens_is_list and data_count else None)
    screen_a11y_ratio = (
        sum(1 for c in screen_rows
            if c.get("contrast_check_noted") is True
            and c.get("keyboard_check_noted") is True) / screens_count
        if screens_is_list and screens_count > 0 else None)

    # ---- Section 1: ux_flows_and_hierarchy ----
    _bool_check(results, "ux_flows_and_hierarchy",
                "ux_flow_designed_before_implementation", manifest,
                ("flow_design", "flows_designed_before_implementation"),
                "flows first: the flows were designed before implementation")
    _bool_check(results, "ux_flows_and_hierarchy",
                "ux_primary_journeys_documented_as_step_diagrams", manifest,
                ("flow_design", "primary_journeys_documented_as_step_diagrams"),
                "flows first: the primary journeys are documented as step diagrams")
    _bool_check(results, "ux_flows_and_hierarchy",
                "ux_information_hierarchy_defined_per_screen", manifest,
                ("flow_design", "information_hierarchy_defined_per_screen"),
                "hierarchy: primary, secondary and tertiary hierarchy is defined per screen")
    _bool_check(results, "ux_flows_and_hierarchy",
                "ux_content_before_decoration_declared", manifest,
                ("flow_design", "content_before_decoration"),
                "hierarchy: content is placed before decoration")
    _check(results, "ux_flows_and_hierarchy",
           "ux_flow_steps_list_declared", flow_steps, steps_is_list,
           steps_is_list and steps_count > 0,
           "flow steps: the declared record names its flow steps — the list is present and names at least one step; an absent list is missing evidence and an empty list declares no flow at all")
    step_id_present = steps_is_list and all(
        _has(c, "step_id") for c in step_rows)
    _check(results, "ux_flows_and_hierarchy",
           "every_ux_flow_step_id_unique", flow_steps, step_id_present,
           steps_is_list and duplicate_step_ids is not None
           and len(duplicate_step_ids) == 0,
           "flow steps: no declared step_id is owned by more than one row")
    intent_present = steps_is_list and all(
        _has(c, "intent") for c in step_rows)
    _check(results, "ux_flows_and_hierarchy",
           "every_ux_flow_step_intent_declared", flow_steps, intent_present,
           steps_is_list
           and all(_nonempty_str(c.get("intent")) for c in step_rows),
           "flow steps: every declared step declares a non-empty intent — each step carries one intent")
    entry_present = steps_is_list and all(
        _has(c, "entry_condition") for c in step_rows)
    _check(results, "ux_flows_and_hierarchy",
           "every_ux_flow_step_entry_condition_declared", flow_steps,
           entry_present,
           steps_is_list
           and all(_nonempty_str(c.get("entry_condition")) for c in step_rows),
           "flow steps: every declared step declares a non-empty entry condition")
    exit_present = steps_is_list and all(
        _has(c, "exit_condition") for c in step_rows)
    _check(results, "ux_flows_and_hierarchy",
           "every_ux_flow_step_exit_condition_declared", flow_steps,
           exit_present,
           steps_is_list
           and all(_nonempty_str(c.get("exit_condition")) for c in step_rows),
           "flow steps: every declared step declares a non-empty exit condition")
    next_present = steps_is_list and all(
        _has(c, "next_step_ids") for c in step_rows)
    _check(results, "ux_flows_and_hierarchy",
           "every_ux_flow_step_next_step_reference_resolves", flow_steps,
           next_present,
           steps_is_list and all(_next_resolves(c) for c in step_rows),
           "flow steps: every declared next_step_id on every row names a declared step_id — no dangling flow reference; an empty next list declares a terminal step")

    # ---- Section 2: ux_design_tokens ----
    _bool_check(results, "ux_design_tokens",
                "ux_design_tokens_single_source_declared", manifest,
                ("design_tokens", "tokens_single_source_declared"),
                "tokens: the design tokens are declared as a single source")
    _bool_check(results, "ux_design_tokens",
                "ux_color_tokens_defined", manifest,
                ("design_tokens", "color_tokens_defined"),
                "tokens: color tokens are defined in the token source")
    _bool_check(results, "ux_design_tokens",
                "ux_type_scale_tokens_defined", manifest,
                ("design_tokens", "type_scale_tokens_defined"),
                "tokens: type scale tokens are defined in the token source")
    _bool_check(results, "ux_design_tokens",
                "ux_spacing_tokens_defined", manifest,
                ("design_tokens", "spacing_tokens_defined"),
                "tokens: spacing tokens are defined in the token source")
    _bool_check(results, "ux_design_tokens",
                "ux_radius_tokens_defined", manifest,
                ("design_tokens", "radius_tokens_defined"),
                "tokens: radius tokens are defined in the token source")
    _bool_check(results, "ux_design_tokens",
                "ux_elevation_tokens_defined", manifest,
                ("design_tokens", "elevation_tokens_defined"),
                "tokens: elevation tokens are defined in the token source")

    # ---- Section 3: ux_component_inventory_and_states ----
    _check(results, "ux_component_inventory_and_states",
           "ux_components_list_declared", components, comps_is_list,
           comps_is_list and comps_count > 0,
           "components: the declared record names its components — the list is present and names at least one component; an absent list is missing evidence and an empty list declares no inventory at all")
    comp_id_present = comps_is_list and all(
        _has(c, "component_id") for c in comp_rows)
    _check(results, "ux_component_inventory_and_states",
           "every_ux_component_id_unique", components, comp_id_present,
           comps_is_list and duplicate_component_ids is not None
           and len(duplicate_component_ids) == 0,
           "components: no declared component_id is owned by more than one row")
    purpose_present = comps_is_list and all(
        _has(c, "purpose") for c in comp_rows)
    _check(results, "ux_component_inventory_and_states",
           "every_ux_component_purpose_declared", components, purpose_present,
           comps_is_list
           and all(_nonempty_str(c.get("purpose")) for c in comp_rows),
           "components: every declared component declares a non-empty purpose")
    variants_present = comps_is_list and all(
        _has(c, "variants_declared") for c in comp_rows)
    _check(results, "ux_component_inventory_and_states",
           "every_ux_component_variants_declared", components,
           variants_present,
           comps_is_list
           and all(_nonempty_str(c.get("variants_declared")) for c in comp_rows),
           "components: every declared component declares its variants in a non-empty declaration")
    states_present = comps_is_list and all(
        (not _is_interactive(c)) or _has(c, "states_declared")
        for c in comp_rows) and all(
        _has(c, "interactive") for c in comp_rows)
    _check(results, "ux_component_inventory_and_states",
           "every_interactive_ux_component_state_inventory_complete",
           components, states_present,
           comps_is_list
           and all((not _is_interactive(c)) or _states_complete(c)
                   for c in comp_rows),
           "components / quality gate: every interactive component's declared states contain all seven states the skill names — default, hover, active, disabled, focus, loading, error — none missing")
    decorative_present = comps_is_list and all(
        _has(c, "interactive") and _has(c, "decorative_only")
        for c in comp_rows)
    _check(results, "ux_component_inventory_and_states",
           "no_interactive_ux_component_decorative_only", components,
           decorative_present,
           comps_is_list
           and all(not (_is_interactive(c)
                        and c.get("decorative_only") is True)
                   for c in comp_rows),
           "components / quality gate: no interactive component is declared decorative-only")

    # ---- Section 4: ux_data_surface_states ----
    _check(results, "ux_data_surface_states",
           "ux_screens_list_declared", screens, screens_is_list,
           screens_is_list and screens_count > 0,
           "screens: the declared record names its screens — the list is present and names at least one screen; an absent list is missing evidence and an empty list declares no screens at all")
    screen_id_present = screens_is_list and all(
        _has(c, "screen_id") for c in screen_rows)
    _check(results, "ux_data_surface_states",
           "every_ux_screen_id_unique", screens, screen_id_present,
           screens_is_list and duplicate_screen_ids is not None
           and len(duplicate_screen_ids) == 0,
           "screens: no declared screen_id is owned by more than one row")

    def _data_check(name, field, evidence):
        present = screens_is_list and all(
            _has(c, "is_data_surface")
            and ((not _is_data(c)) or _has(c, field))
            for c in screen_rows)
        ok = screens_is_list and all(
            (not _is_data(c)) or c.get(field) is True
            for c in screen_rows)
        _check(results, "ux_data_surface_states", name, screens,
               present, ok, evidence)

    _data_check("every_ux_data_surface_empty_state_designed",
                "empty_state_designed",
                "data surfaces / quality gate: every screen declared a data surface declares its empty state designed")
    _data_check("every_ux_data_surface_loading_state_designed",
                "loading_state_designed",
                "data surfaces / quality gate: every screen declared a data surface declares its loading state designed")
    _data_check("every_ux_data_surface_error_state_designed",
                "error_state_designed",
                "data surfaces / quality gate: every screen declared a data surface declares its error state designed")

    # ---- Section 5: ux_accessibility_declarations ----
    wcag_value, wcag_present = _get(
        manifest, "accessibility", "wcag_target_declared")
    _check(results, "ux_accessibility_declarations",
           "ux_accessibility_wcag_target_declared", wcag_value, wcag_present,
           _nonempty_str(wcag_value),
           "accessibility: the record declares its accessibility target in a non-empty declaration (the skill names WCAG AA) — declaration only; this atom certifies no conformance with any target")
    _bool_check(results, "ux_accessibility_declarations",
                "ux_keyboard_reachable_declared", manifest,
                ("accessibility", "keyboard_reachable_declared"),
                "accessibility: keyboard reachability is declared for the design")
    _bool_check(results, "ux_accessibility_declarations",
                "ux_labels_on_all_fields_declared", manifest,
                ("accessibility", "labels_on_all_fields_declared"),
                "accessibility: labels on all fields are declared")
    _bool_check(results, "ux_accessibility_declarations",
                "ux_visible_focus_declared", manifest,
                ("accessibility", "visible_focus_declared"),
                "accessibility: visible focus is declared")
    _bool_check(results, "ux_accessibility_declarations",
                "ux_reduced_motion_respected_declared", manifest,
                ("accessibility", "reduced_motion_respected_declared"),
                "accessibility: reduced motion being respected is declared")
    contrast_present = screens_is_list and all(
        _has(c, "contrast_check_noted") for c in screen_rows)
    _check(results, "ux_accessibility_declarations",
           "every_ux_screen_contrast_check_noted", screens, contrast_present,
           screens_is_list
           and all(c.get("contrast_check_noted") is True
                   for c in screen_rows),
           "accessibility / quality gate: every declared screen declares its contrast check noted — noted as a declaration only; no contrast is measured and no conformance is certified")
    keyboard_present = screens_is_list and all(
        _has(c, "keyboard_check_noted") for c in screen_rows)
    _check(results, "ux_accessibility_declarations",
           "every_ux_screen_keyboard_check_noted", screens, keyboard_present,
           screens_is_list
           and all(c.get("keyboard_check_noted") is True
                   for c in screen_rows),
           "accessibility / quality gate: every declared screen declares its keyboard check noted — noted as a declaration only; no keyboard path is tested")

    # ---- Section 6: ux_microcopy_and_critique ----
    _bool_check(results, "ux_microcopy_and_critique",
                "ux_microcopy_buttons_say_what_they_do", manifest,
                ("microcopy", "buttons_say_what_they_do"),
                "microcopy: buttons say what they do")
    _bool_check(results, "ux_microcopy_and_critique",
                "ux_microcopy_errors_say_how_to_fix", manifest,
                ("microcopy", "errors_say_how_to_fix"),
                "microcopy: errors say how to fix the problem")
    _bool_check(results, "ux_microcopy_and_critique",
                "ux_microcopy_empty_states_say_what_to_do_next", manifest,
                ("microcopy", "empty_states_say_what_to_do_next"),
                "microcopy: empty states say what to do next")
    _bool_check(results, "ux_microcopy_and_critique",
                "ux_microcopy_reviewed_for_clarity", manifest,
                ("microcopy", "microcopy_reviewed_for_clarity"),
                "microcopy / quality gate: the microcopy was reviewed for clarity")
    _bool_check(results, "ux_microcopy_and_critique",
                "ux_critique_compared_against_brief", manifest,
                ("critique", "compared_against_brief"),
                "critique: the design was compared against the brief")
    _bool_check(results, "ux_microcopy_and_critique",
                "ux_critique_compared_against_domain_conventions", manifest,
                ("critique", "compared_against_domain_conventions"),
                "critique: the design was compared against the domain's conventions")
    _bool_check(results, "ux_microcopy_and_critique",
                "ux_critique_non_orienting_decoration_cut", manifest,
                ("critique", "non_orienting_decoration_cut"),
                "critique: decoration that doesn't orient was cut")

    # ---- Section 7: red_lines ----
    _false_check(results, "red_lines",
                 "ux_spec_free_of_placeholder_lorem_shipped", manifest,
                 ("red_lines", "placeholder_lorem_shipped_present"),
                 "red line: no placeholder lorem shipped is present in the record")
    _false_check(results, "red_lines",
                 "ux_spec_free_of_dead_controls", manifest,
                 ("red_lines", "dead_controls_present"),
                 "red line: no dead controls are present in the record")
    _false_check(results, "red_lines",
                 "ux_spec_free_of_accessibility_traded_for_aesthetics",
                 manifest,
                 ("red_lines", "accessibility_traded_for_aesthetics_present"),
                 "red line: no trade of accessibility for aesthetics is present in the record")
    _false_check(results, "red_lines",
                 "ux_spec_free_of_aesthetics_traded_for_accessibility",
                 manifest,
                 ("red_lines", "aesthetics_traded_for_accessibility_present"),
                 "red line: no trade of aesthetics for accessibility is present in the record — the skill forbids the trade in either direction")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "UX_SPEC_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "UX_SPEC_SOUND"

    computed_names = (
        "ux_flow_steps_list_declared",
        "every_ux_flow_step_id_unique",
        "every_ux_flow_step_intent_declared",
        "every_ux_flow_step_entry_condition_declared",
        "every_ux_flow_step_exit_condition_declared",
        "every_ux_flow_step_next_step_reference_resolves",
        "ux_components_list_declared",
        "every_ux_component_id_unique",
        "every_ux_component_purpose_declared",
        "every_ux_component_variants_declared",
        "every_interactive_ux_component_state_inventory_complete",
        "no_interactive_ux_component_decorative_only",
        "ux_screens_list_declared",
        "every_ux_screen_id_unique",
        "every_ux_data_surface_empty_state_designed",
        "every_ux_data_surface_loading_state_designed",
        "every_ux_data_surface_error_state_designed",
        "ux_accessibility_wcag_target_declared",
        "every_ux_screen_contrast_check_noted",
        "every_ux_screen_keyboard_check_noted",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "ux-flow-component-spec-pack",
        "atom_version": "0.1.0",
        "spec_title": manifest.get("spec_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "ux_flow_steps_count": steps_count,
        "ux_components_count": comps_count,
        "ux_screens_count": screens_count,
        "ux_interactive_components_count": interactive_count,
        "ux_data_surfaces_count": data_count,
        "duplicate_ux_flow_step_ids": duplicate_step_ids,
        "duplicate_ux_component_ids": duplicate_component_ids,
        "duplicate_ux_screen_ids": duplicate_screen_ids,
        "ux_flow_steps_without_intent": steps_without_intent,
        "ux_flow_steps_without_entry_condition": steps_without_entry,
        "ux_flow_steps_without_exit_condition": steps_without_exit,
        "ux_flow_steps_with_unresolved_next_step_references": steps_with_unresolved,
        "ux_components_without_purpose": comps_without_purpose,
        "ux_components_without_variants": comps_without_variants,
        "interactive_ux_components_with_incomplete_states": interactive_incomplete,
        "interactive_ux_components_declared_decorative_only": interactive_decorative,
        "ux_data_surfaces_without_empty_state": data_without_empty,
        "ux_data_surfaces_without_loading_state": data_without_loading,
        "ux_data_surfaces_without_error_state": data_without_error,
        "ux_screens_without_contrast_check": screens_without_contrast,
        "ux_screens_without_keyboard_check": screens_without_keyboard,
        "flow_step_reference_resolution_ratio": _fmt6(flow_step_resolution_ratio),
        "interactive_component_complete_state_ratio": _fmt6(interactive_state_ratio),
        "data_surface_complete_state_ratio": _fmt6(data_surface_ratio),
        "screen_accessibility_check_ratio": _fmt6(screen_a11y_ratio),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "UX FLOW COMPONENT SPEC PACK",
        f"spec_title: {verdict.get('spec_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: ux_flow_component_spec_pack.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "UX_SPEC_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
