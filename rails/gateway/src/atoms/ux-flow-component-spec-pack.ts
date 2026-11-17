// Ux flow component spec pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/ux-flow-component-spec-pack/src/ux_flow_component_spec_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  spec_title: "string",
  flow_design: {
    flows_designed_before_implementation: "boolean",
    primary_journeys_documented_as_step_diagrams: "boolean",
    information_hierarchy_defined_per_screen: "boolean",
    content_before_decoration: "boolean",
  },
  flow_steps: [{
    step_id: "string",
    intent: "string",
    entry_condition: "string",
    exit_condition: "string",
    next_step_ids: ["string"],
  }],
  design_tokens: {
    tokens_single_source_declared: "boolean",
    color_tokens_defined: "boolean",
    type_scale_tokens_defined: "boolean",
    spacing_tokens_defined: "boolean",
    radius_tokens_defined: "boolean",
    elevation_tokens_defined: "boolean",
  },
  components: [{
    component_id: "string",
    purpose: "string",
    variants_declared: "string",
    interactive: "boolean",
    decorative_only: "boolean",
    states_declared: ["string"],
  }],
  screens: [{
    screen_id: "string",
    is_data_surface: "boolean",
    empty_state_designed: "boolean",
    loading_state_designed: "boolean",
    error_state_designed: "boolean",
    contrast_check_noted: "boolean",
    keyboard_check_noted: "boolean",
  }],
  accessibility: {
    wcag_target_declared: "string",
    keyboard_reachable_declared: "boolean",
    labels_on_all_fields_declared: "boolean",
    visible_focus_declared: "boolean",
    reduced_motion_respected_declared: "boolean",
  },
  microcopy: {
    buttons_say_what_they_do: "boolean",
    errors_say_how_to_fix: "boolean",
    empty_states_say_what_to_do_next: "boolean",
    microcopy_reviewed_for_clarity: "boolean",
  },
  critique: {
    compared_against_brief: "boolean",
    compared_against_domain_conventions: "boolean",
    non_orienting_decoration_cut: "boolean",
  },
  red_lines: {
    placeholder_lorem_shipped_present: "boolean",
    dead_controls_present: "boolean",
    accessibility_traded_for_aesthetics_present: "boolean",
    aesthetics_traded_for_accessibility_present: "boolean",
  },
};

export const SECTIONS = [
  "ux_flows_and_hierarchy",
  "ux_design_tokens",
  "ux_component_inventory_and_states",
  "ux_data_surface_states",
  "ux_accessibility_declarations",
  "ux_microcopy_and_critique",
  "red_lines",
] as const;

const REQUIRED_INTERACTIVE_STATES = [
  "default", "hover", "active", "disabled", "focus", "loading", "error",
];

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  spec_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  ux_flow_steps_count: number | null;
  ux_components_count: number | null;
  ux_screens_count: number | null;
  ux_interactive_components_count: number | null;
  ux_data_surfaces_count: number | null;
  duplicate_ux_flow_step_ids: string[] | null;
  duplicate_ux_component_ids: string[] | null;
  duplicate_ux_screen_ids: string[] | null;
  ux_flow_steps_without_intent: string[] | null;
  ux_flow_steps_without_entry_condition: string[] | null;
  ux_flow_steps_without_exit_condition: string[] | null;
  ux_flow_steps_with_unresolved_next_step_references: string[] | null;
  ux_components_without_purpose: string[] | null;
  ux_components_without_variants: string[] | null;
  interactive_ux_components_with_incomplete_states: string[] | null;
  interactive_ux_components_declared_decorative_only: string[] | null;
  ux_data_surfaces_without_empty_state: string[] | null;
  ux_data_surfaces_without_loading_state: string[] | null;
  ux_data_surfaces_without_error_state: string[] | null;
  ux_screens_without_contrast_check: string[] | null;
  ux_screens_without_keyboard_check: string[] | null;
  flow_step_reference_resolution_ratio: string | null;
  interactive_component_complete_state_ratio: string | null;
  data_surface_complete_state_ratio: string | null;
  screen_accessibility_check_ratio: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function idsOf(rows: unknown[], field: string): string[] {
  const out: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      out.push(c[field] as string);
    }
  }
  return out;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [flowStepsRaw, hasFlowSteps] = getPath(manifest, "flow_steps");
  const stepsIsList = hasFlowSteps && Array.isArray(flowStepsRaw);
  const stepRows: unknown[] = stepsIsList ? (flowStepsRaw as unknown[]) : [];
  const stepsCount: number | null = stepsIsList ? stepRows.length : null;
  const stepIds = idsOf(stepRows, "step_id");

  const [componentsRaw, hasComponents] = getPath(manifest, "components");
  const compsIsList = hasComponents && Array.isArray(componentsRaw);
  const compRows: unknown[] = compsIsList ? (componentsRaw as unknown[]) : [];
  const compsCount: number | null = compsIsList ? compRows.length : null;

  const [screensRaw, hasScreens] = getPath(manifest, "screens");
  const screensIsList = hasScreens && Array.isArray(screensRaw);
  const screenRows: unknown[] = screensIsList ? (screensRaw as unknown[]) : [];
  const screensCount: number | null = screensIsList ? screenRows.length : null;

  const duplicateStepIds: string[] | null = stepsIsList
    ? duplicates(stepRows, "step_id") : null;
  const duplicateComponentIds: string[] | null = compsIsList
    ? duplicates(compRows, "component_id") : null;
  const duplicateScreenIds: string[] | null = screensIsList
    ? duplicates(screenRows, "screen_id") : null;

  const stepsWithoutIntent: string[] | null = stepsIsList
    ? stepRows.filter((c) => hasField(c, "intent") &&
        !nonemptyStr((c as Record<string, unknown>)["intent"]))
        .map((c) => rowName(c, "step_id"))
    : null;
  const stepsWithoutEntry: string[] | null = stepsIsList
    ? stepRows.filter((c) => hasField(c, "entry_condition") &&
        !nonemptyStr((c as Record<string, unknown>)["entry_condition"]))
        .map((c) => rowName(c, "step_id"))
    : null;
  const stepsWithoutExit: string[] | null = stepsIsList
    ? stepRows.filter((c) => hasField(c, "exit_condition") &&
        !nonemptyStr((c as Record<string, unknown>)["exit_condition"]))
        .map((c) => rowName(c, "step_id"))
    : null;

  const nextResolves = (c: unknown): boolean =>
    hasField(c, "next_step_ids") &&
    Array.isArray((c as Record<string, unknown>)["next_step_ids"]) &&
    ((c as Record<string, unknown>)["next_step_ids"] as unknown[])
      .every((n) => typeof n === "string" && stepIds.includes(n));

  const stepsWithUnresolved: string[] | null = stepsIsList
    ? stepRows.filter((c) => hasField(c, "next_step_ids") &&
        Array.isArray((c as Record<string, unknown>)["next_step_ids"]) &&
        ((c as Record<string, unknown>)["next_step_ids"] as unknown[])
          .some((n) => !(typeof n === "string" && stepIds.includes(n))))
        .map((c) => rowName(c, "step_id"))
    : null;

  const compsWithoutPurpose: string[] | null = compsIsList
    ? compRows.filter((c) => hasField(c, "purpose") &&
        !nonemptyStr((c as Record<string, unknown>)["purpose"]))
        .map((c) => rowName(c, "component_id"))
    : null;
  const compsWithoutVariants: string[] | null = compsIsList
    ? compRows.filter((c) => hasField(c, "variants_declared") &&
        !nonemptyStr((c as Record<string, unknown>)["variants_declared"]))
        .map((c) => rowName(c, "component_id"))
    : null;

  const isInteractive = (c: unknown): boolean =>
    isPyDict(c) && c["interactive"] === true;
  const statesComplete = (c: unknown): boolean =>
    hasField(c, "states_declared") &&
    Array.isArray((c as Record<string, unknown>)["states_declared"]) &&
    REQUIRED_INTERACTIVE_STATES.every((s) =>
      ((c as Record<string, unknown>)["states_declared"] as unknown[]).includes(s));

  const interactiveRows = compRows.filter((c) => isInteractive(c));
  const interactiveCount: number | null = compsIsList ? interactiveRows.length : null;
  const interactiveIncomplete: string[] | null = compsIsList
    ? interactiveRows.filter((c) => hasField(c, "states_declared") && !statesComplete(c))
        .map((c) => rowName(c, "component_id"))
    : null;
  const interactiveDecorative: string[] | null = compsIsList
    ? interactiveRows.filter((c) => isPyDict(c) && c["decorative_only"] === true)
        .map((c) => rowName(c, "component_id"))
    : null;

  const isData = (c: unknown): boolean =>
    isPyDict(c) && c["is_data_surface"] === true;
  const dataRows = screenRows.filter((c) => isData(c));
  const dataCount: number | null = screensIsList ? dataRows.length : null;

  const withoutField = (field: string): string[] | null =>
    screensIsList
      ? dataRows.filter((c) => hasField(c, field) &&
          (c as Record<string, unknown>)[field] !== true)
          .map((c) => rowName(c, "screen_id"))
      : null;
  const dataWithoutEmpty = withoutField("empty_state_designed");
  const dataWithoutLoading = withoutField("loading_state_designed");
  const dataWithoutError = withoutField("error_state_designed");

  const screensWithoutContrast: string[] | null = screensIsList
    ? screenRows.filter((c) => hasField(c, "contrast_check_noted") &&
        (c as Record<string, unknown>)["contrast_check_noted"] !== true)
        .map((c) => rowName(c, "screen_id"))
    : null;
  const screensWithoutKeyboard: string[] | null = screensIsList
    ? screenRows.filter((c) => hasField(c, "keyboard_check_noted") &&
        (c as Record<string, unknown>)["keyboard_check_noted"] !== true)
        .map((c) => rowName(c, "screen_id"))
    : null;

  const flowStepResolutionRatio: number | null =
    stepsIsList && stepsCount !== null && stepsCount > 0
      ? stepRows.filter((c) => nextResolves(c)).length / stepsCount
      : null;
  const interactiveStateRatio: number | null =
    compsIsList && interactiveCount !== null && interactiveCount > 0
      ? interactiveRows.filter((c) => statesComplete(c)).length / interactiveCount
      : null;
  const dataSurfaceRatio: number | null =
    screensIsList && dataCount !== null && dataCount > 0
      ? dataRows.filter((c) => isPyDict(c) &&
          c["empty_state_designed"] === true &&
          c["loading_state_designed"] === true &&
          c["error_state_designed"] === true).length / dataCount
      : null;
  const screenA11yRatio: number | null =
    screensIsList && screensCount !== null && screensCount > 0
      ? screenRows.filter((c) => isPyDict(c) &&
          c["contrast_check_noted"] === true &&
          c["keyboard_check_noted"] === true).length / screensCount
      : null;

  // ---- Section 1: ux_flows_and_hierarchy ----
  boolCheck(results, "ux_flows_and_hierarchy",
    "ux_flow_designed_before_implementation", manifest,
    ["flow_design", "flows_designed_before_implementation"],
    "flows first: the flows were designed before implementation");
  boolCheck(results, "ux_flows_and_hierarchy",
    "ux_primary_journeys_documented_as_step_diagrams", manifest,
    ["flow_design", "primary_journeys_documented_as_step_diagrams"],
    "flows first: the primary journeys are documented as step diagrams");
  boolCheck(results, "ux_flows_and_hierarchy",
    "ux_information_hierarchy_defined_per_screen", manifest,
    ["flow_design", "information_hierarchy_defined_per_screen"],
    "hierarchy: primary, secondary and tertiary hierarchy is defined per screen");
  boolCheck(results, "ux_flows_and_hierarchy",
    "ux_content_before_decoration_declared", manifest,
    ["flow_design", "content_before_decoration"],
    "hierarchy: content is placed before decoration");
  check(results, "ux_flows_and_hierarchy",
    "ux_flow_steps_list_declared", flowStepsRaw, stepsIsList,
    stepsIsList && stepsCount !== null && stepsCount > 0,
    "flow steps: the declared record names its flow steps — the list is present and names at least one step; an absent list is missing evidence and an empty list declares no flow at all");
  const stepIdPresent = stepsIsList && stepRows.every((c) => hasField(c, "step_id"));
  check(results, "ux_flows_and_hierarchy",
    "every_ux_flow_step_id_unique", flowStepsRaw, stepIdPresent,
    stepsIsList && duplicateStepIds !== null && duplicateStepIds.length === 0,
    "flow steps: no declared step_id is owned by more than one row");
  const intentPresent = stepsIsList && stepRows.every((c) => hasField(c, "intent"));
  check(results, "ux_flows_and_hierarchy",
    "every_ux_flow_step_intent_declared", flowStepsRaw, intentPresent,
    stepsIsList && stepRows.every((c) => isPyDict(c) && nonemptyStr(c["intent"])),
    "flow steps: every declared step declares a non-empty intent — each step carries one intent");
  const entryPresent = stepsIsList && stepRows.every((c) => hasField(c, "entry_condition"));
  check(results, "ux_flows_and_hierarchy",
    "every_ux_flow_step_entry_condition_declared", flowStepsRaw, entryPresent,
    stepsIsList && stepRows.every((c) => isPyDict(c) && nonemptyStr(c["entry_condition"])),
    "flow steps: every declared step declares a non-empty entry condition");
  const exitPresent = stepsIsList && stepRows.every((c) => hasField(c, "exit_condition"));
  check(results, "ux_flows_and_hierarchy",
    "every_ux_flow_step_exit_condition_declared", flowStepsRaw, exitPresent,
    stepsIsList && stepRows.every((c) => isPyDict(c) && nonemptyStr(c["exit_condition"])),
    "flow steps: every declared step declares a non-empty exit condition");
  const nextPresent = stepsIsList && stepRows.every((c) => hasField(c, "next_step_ids"));
  check(results, "ux_flows_and_hierarchy",
    "every_ux_flow_step_next_step_reference_resolves", flowStepsRaw, nextPresent,
    stepsIsList && stepRows.every((c) => nextResolves(c)),
    "flow steps: every declared next_step_id on every row names a declared step_id — no dangling flow reference; an empty next list declares a terminal step");

  // ---- Section 2: ux_design_tokens ----
  boolCheck(results, "ux_design_tokens",
    "ux_design_tokens_single_source_declared", manifest,
    ["design_tokens", "tokens_single_source_declared"],
    "tokens: the design tokens are declared as a single source");
  boolCheck(results, "ux_design_tokens",
    "ux_color_tokens_defined", manifest,
    ["design_tokens", "color_tokens_defined"],
    "tokens: color tokens are defined in the token source");
  boolCheck(results, "ux_design_tokens",
    "ux_type_scale_tokens_defined", manifest,
    ["design_tokens", "type_scale_tokens_defined"],
    "tokens: type scale tokens are defined in the token source");
  boolCheck(results, "ux_design_tokens",
    "ux_spacing_tokens_defined", manifest,
    ["design_tokens", "spacing_tokens_defined"],
    "tokens: spacing tokens are defined in the token source");
  boolCheck(results, "ux_design_tokens",
    "ux_radius_tokens_defined", manifest,
    ["design_tokens", "radius_tokens_defined"],
    "tokens: radius tokens are defined in the token source");
  boolCheck(results, "ux_design_tokens",
    "ux_elevation_tokens_defined", manifest,
    ["design_tokens", "elevation_tokens_defined"],
    "tokens: elevation tokens are defined in the token source");

  // ---- Section 3: ux_component_inventory_and_states ----
  check(results, "ux_component_inventory_and_states",
    "ux_components_list_declared", componentsRaw, compsIsList,
    compsIsList && compsCount !== null && compsCount > 0,
    "components: the declared record names its components — the list is present and names at least one component; an absent list is missing evidence and an empty list declares no inventory at all");
  const compIdPresent = compsIsList && compRows.every((c) => hasField(c, "component_id"));
  check(results, "ux_component_inventory_and_states",
    "every_ux_component_id_unique", componentsRaw, compIdPresent,
    compsIsList && duplicateComponentIds !== null && duplicateComponentIds.length === 0,
    "components: no declared component_id is owned by more than one row");
  const purposePresent = compsIsList && compRows.every((c) => hasField(c, "purpose"));
  check(results, "ux_component_inventory_and_states",
    "every_ux_component_purpose_declared", componentsRaw, purposePresent,
    compsIsList && compRows.every((c) => isPyDict(c) && nonemptyStr(c["purpose"])),
    "components: every declared component declares a non-empty purpose");
  const variantsPresent = compsIsList && compRows.every((c) => hasField(c, "variants_declared"));
  check(results, "ux_component_inventory_and_states",
    "every_ux_component_variants_declared", componentsRaw, variantsPresent,
    compsIsList && compRows.every((c) => isPyDict(c) && nonemptyStr(c["variants_declared"])),
    "components: every declared component declares its variants in a non-empty declaration");
  const statesPresent = compsIsList &&
    compRows.every((c) => !isInteractive(c) || hasField(c, "states_declared")) &&
    compRows.every((c) => hasField(c, "interactive"));
  check(results, "ux_component_inventory_and_states",
    "every_interactive_ux_component_state_inventory_complete", componentsRaw,
    statesPresent,
    compsIsList && compRows.every((c) => !isInteractive(c) || statesComplete(c)),
    "components / quality gate: every interactive component's declared states contain all seven states the skill names — default, hover, active, disabled, focus, loading, error — none missing");
  const decorativePresent = compsIsList &&
    compRows.every((c) => hasField(c, "interactive") && hasField(c, "decorative_only"));
  check(results, "ux_component_inventory_and_states",
    "no_interactive_ux_component_decorative_only", componentsRaw, decorativePresent,
    compsIsList && compRows.every((c) => !(isInteractive(c) && isPyDict(c) && c["decorative_only"] === true)),
    "components / quality gate: no interactive component is declared decorative-only");

  // ---- Section 4: ux_data_surface_states ----
  check(results, "ux_data_surface_states",
    "ux_screens_list_declared", screensRaw, screensIsList,
    screensIsList && screensCount !== null && screensCount > 0,
    "screens: the declared record names its screens — the list is present and names at least one screen; an absent list is missing evidence and an empty list declares no screens at all");
  const screenIdPresent = screensIsList && screenRows.every((c) => hasField(c, "screen_id"));
  check(results, "ux_data_surface_states",
    "every_ux_screen_id_unique", screensRaw, screenIdPresent,
    screensIsList && duplicateScreenIds !== null && duplicateScreenIds.length === 0,
    "screens: no declared screen_id is owned by more than one row");
  const dataCheck = (name: string, field: string, evidence: string): void => {
    const present = screensIsList && screenRows.every((c) =>
      hasField(c, "is_data_surface") && (!isData(c) || hasField(c, field)));
    const ok = screensIsList && screenRows.every((c) =>
      !isData(c) || (isPyDict(c) && c[field] === true));
    check(results, "ux_data_surface_states", name, screensRaw, present, ok, evidence);
  };
  dataCheck("every_ux_data_surface_empty_state_designed", "empty_state_designed",
    "data surfaces / quality gate: every screen declared a data surface declares its empty state designed");
  dataCheck("every_ux_data_surface_loading_state_designed", "loading_state_designed",
    "data surfaces / quality gate: every screen declared a data surface declares its loading state designed");
  dataCheck("every_ux_data_surface_error_state_designed", "error_state_designed",
    "data surfaces / quality gate: every screen declared a data surface declares its error state designed");

  // ---- Section 5: ux_accessibility_declarations ----
  const [wcagValue, wcagPresent] = getPath(manifest, "accessibility", "wcag_target_declared");
  check(results, "ux_accessibility_declarations",
    "ux_accessibility_wcag_target_declared", wcagValue, wcagPresent,
    nonemptyStr(wcagValue),
    "accessibility: the record declares its accessibility target in a non-empty declaration (the skill names WCAG AA) — declaration only; this atom certifies no conformance with any target");
  boolCheck(results, "ux_accessibility_declarations",
    "ux_keyboard_reachable_declared", manifest,
    ["accessibility", "keyboard_reachable_declared"],
    "accessibility: keyboard reachability is declared for the design");
  boolCheck(results, "ux_accessibility_declarations",
    "ux_labels_on_all_fields_declared", manifest,
    ["accessibility", "labels_on_all_fields_declared"],
    "accessibility: labels on all fields are declared");
  boolCheck(results, "ux_accessibility_declarations",
    "ux_visible_focus_declared", manifest,
    ["accessibility", "visible_focus_declared"],
    "accessibility: visible focus is declared");
  boolCheck(results, "ux_accessibility_declarations",
    "ux_reduced_motion_respected_declared", manifest,
    ["accessibility", "reduced_motion_respected_declared"],
    "accessibility: reduced motion being respected is declared");
  const contrastPresent = screensIsList && screenRows.every((c) => hasField(c, "contrast_check_noted"));
  check(results, "ux_accessibility_declarations",
    "every_ux_screen_contrast_check_noted", screensRaw, contrastPresent,
    screensIsList && screenRows.every((c) => isPyDict(c) && c["contrast_check_noted"] === true),
    "accessibility / quality gate: every declared screen declares its contrast check noted — noted as a declaration only; no contrast is measured and no conformance is certified");
  const keyboardPresent = screensIsList && screenRows.every((c) => hasField(c, "keyboard_check_noted"));
  check(results, "ux_accessibility_declarations",
    "every_ux_screen_keyboard_check_noted", screensRaw, keyboardPresent,
    screensIsList && screenRows.every((c) => isPyDict(c) && c["keyboard_check_noted"] === true),
    "accessibility / quality gate: every declared screen declares its keyboard check noted — noted as a declaration only; no keyboard path is tested");

  // ---- Section 6: ux_microcopy_and_critique ----
  boolCheck(results, "ux_microcopy_and_critique",
    "ux_microcopy_buttons_say_what_they_do", manifest,
    ["microcopy", "buttons_say_what_they_do"],
    "microcopy: buttons say what they do");
  boolCheck(results, "ux_microcopy_and_critique",
    "ux_microcopy_errors_say_how_to_fix", manifest,
    ["microcopy", "errors_say_how_to_fix"],
    "microcopy: errors say how to fix the problem");
  boolCheck(results, "ux_microcopy_and_critique",
    "ux_microcopy_empty_states_say_what_to_do_next", manifest,
    ["microcopy", "empty_states_say_what_to_do_next"],
    "microcopy: empty states say what to do next");
  boolCheck(results, "ux_microcopy_and_critique",
    "ux_microcopy_reviewed_for_clarity", manifest,
    ["microcopy", "microcopy_reviewed_for_clarity"],
    "microcopy / quality gate: the microcopy was reviewed for clarity");
  boolCheck(results, "ux_microcopy_and_critique",
    "ux_critique_compared_against_brief", manifest,
    ["critique", "compared_against_brief"],
    "critique: the design was compared against the brief");
  boolCheck(results, "ux_microcopy_and_critique",
    "ux_critique_compared_against_domain_conventions", manifest,
    ["critique", "compared_against_domain_conventions"],
    "critique: the design was compared against the domain's conventions");
  boolCheck(results, "ux_microcopy_and_critique",
    "ux_critique_non_orienting_decoration_cut", manifest,
    ["critique", "non_orienting_decoration_cut"],
    "critique: decoration that doesn't orient was cut");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "ux_spec_free_of_placeholder_lorem_shipped", manifest,
    ["red_lines", "placeholder_lorem_shipped_present"],
    "red line: no placeholder lorem shipped is present in the record");
  falseCheck(results, "red_lines",
    "ux_spec_free_of_dead_controls", manifest,
    ["red_lines", "dead_controls_present"],
    "red line: no dead controls are present in the record");
  falseCheck(results, "red_lines",
    "ux_spec_free_of_accessibility_traded_for_aesthetics", manifest,
    ["red_lines", "accessibility_traded_for_aesthetics_present"],
    "red line: no trade of accessibility for aesthetics is present in the record");
  falseCheck(results, "red_lines",
    "ux_spec_free_of_aesthetics_traded_for_accessibility", manifest,
    ["red_lines", "aesthetics_traded_for_accessibility_present"],
    "red line: no trade of aesthetics for accessibility is present in the record — the skill forbids the trade in either direction");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "UX_SPEC_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "UX_SPEC_SOUND";
  }

  const computedNames = [
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
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "ux-flow-component-spec-pack",
    atom_version: "0.1.0",
    spec_title: manifest["spec_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    ux_flow_steps_count: stepsCount,
    ux_components_count: compsCount,
    ux_screens_count: screensCount,
    ux_interactive_components_count: interactiveCount,
    ux_data_surfaces_count: dataCount,
    duplicate_ux_flow_step_ids: duplicateStepIds,
    duplicate_ux_component_ids: duplicateComponentIds,
    duplicate_ux_screen_ids: duplicateScreenIds,
    ux_flow_steps_without_intent: stepsWithoutIntent,
    ux_flow_steps_without_entry_condition: stepsWithoutEntry,
    ux_flow_steps_without_exit_condition: stepsWithoutExit,
    ux_flow_steps_with_unresolved_next_step_references: stepsWithUnresolved,
    ux_components_without_purpose: compsWithoutPurpose,
    ux_components_without_variants: compsWithoutVariants,
    interactive_ux_components_with_incomplete_states: interactiveIncomplete,
    interactive_ux_components_declared_decorative_only: interactiveDecorative,
    ux_data_surfaces_without_empty_state: dataWithoutEmpty,
    ux_data_surfaces_without_loading_state: dataWithoutLoading,
    ux_data_surfaces_without_error_state: dataWithoutError,
    ux_screens_without_contrast_check: screensWithoutContrast,
    ux_screens_without_keyboard_check: screensWithoutKeyboard,
    flow_step_reference_resolution_ratio: fmt6(flowStepResolutionRatio),
    interactive_component_complete_state_ratio: fmt6(interactiveStateRatio),
    data_surface_complete_state_ratio: fmt6(dataSurfaceRatio),
    screen_accessibility_check_ratio: fmt6(screenA11yRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "UX FLOW COMPONENT SPEC PACK",
    `spec_title: ${pyStr(verdict.spec_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
