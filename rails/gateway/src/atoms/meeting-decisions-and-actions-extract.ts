// Meeting decisions and actions extract — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/meeting-decisions-and-actions-extract/src/meeting_decisions_and_actions_extract.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  meeting: "string",
  source: {
    read_in_full: "boolean",
    attendees_recorded: "boolean",
    meeting_date_recorded: "boolean",
    meeting_identity_confirmed: "boolean",
    absent_attendees_named_when_relevant: "boolean",
    speaker_attribution_kept_where_it_matters: "boolean",
    numbers_dates_amounts_copied_exactly: "boolean",
    names_spelled_as_in_source_or_contacts: "boolean",
  },
  decisions_record: {
    decisions_stated_close_to_source_wording: "boolean",
    inferred_items_labelled_as_inferred: "boolean",
  },
  decisions: [{
    name: "string",
    source_anchor: "string",
    faithful_to_source: "boolean",
    is_inferred: "boolean",
    inference_marked: "boolean",
  }],
  actions_record: {
    owners_and_due_dates_drawn_from_source: "boolean",
    loose_deadlines_flagged_not_guessed: "boolean",
  },
  actions: [{
    name: "string",
    owner: "string",
    due_date: "string",
    source_anchor: "string",
  }],
  open_questions_record: {
    unresolved_items_collected_separately: "boolean",
    ownerless_we_should_listed_as_open_questions: "boolean",
    prior_open_items_carried_forward_visibly: "boolean",
  },
  open_questions: [{
    name: "string",
    source_anchor: "string",
  }],
  recap: {
    decisions_first_then_actions_then_open_questions: "boolean",
    concise_enough_to_be_read: "boolean",
    shown_as_draft_before_any_send: "boolean",
  },
  handoff: {
    confirmed_actions_handed_off_with_owners_and_dates_on_approval: "boolean",
    recap_sent_only_through_directed_channel_on_approval: "boolean",
  },
  red_lines: {
    inferred_decision_presented_as_made_present: "boolean",
    invented_owner_or_due_date_present: "boolean",
    recap_sent_without_approval_present: "boolean",
    unresolved_question_dropped_for_cleanliness_present: "boolean",
    meeting_contents_disclosed_beyond_named_attendees_present: "boolean",
  },
};

export const SECTIONS = [
  "source_and_meeting_identity",
  "decisions_fidelity",
  "action_ownership_and_dates",
  "open_questions_and_carry_forward",
  "recap_draft_and_handoff",
  "red_lines",
] as const;

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
  meeting: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  decisions_count: number | null;
  decisions_without_source_anchor: string[] | null;
  decision_anchor_coverage: string | null;
  decisions_not_faithful: string[] | null;
  decision_faithful_coverage: string | null;
  inferred_decisions_unmarked: string[] | null;
  inferred_marking_coverage: string | null;
  actions_count: number | null;
  actions_without_owner: string[] | null;
  action_owner_coverage: string | null;
  actions_without_due_date: string[] | null;
  action_due_date_coverage: string | null;
  actions_without_source_anchor: string[] | null;
  action_anchor_coverage: string | null;
  open_questions_count: number | null;
  open_questions_without_source_anchor: string[] | null;
  open_question_anchor_coverage: string | null;
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

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function nonempty(entry: unknown, field: string): boolean {
  return isPyDict(entry) && typeof entry[field] === "string" &&
    (entry[field] as string) !== "";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [decisionsRaw, hasDecisions] = getPath(manifest, "decisions");
  const decisionsIsList = hasDecisions && Array.isArray(decisionsRaw);
  const dRows: unknown[] = decisionsIsList ? (decisionsRaw as unknown[]) : [];
  const decisionsCount: number | null = decisionsIsList ? dRows.length : null;

  const [actionsRaw, hasActions] = getPath(manifest, "actions");
  const actionsIsList = hasActions && Array.isArray(actionsRaw);
  const aRows: unknown[] = actionsIsList ? (actionsRaw as unknown[]) : [];
  const actionsCount: number | null = actionsIsList ? aRows.length : null;

  const [openQuestionsRaw, hasOpenQuestions] = getPath(manifest, "open_questions");
  const oqIsList = hasOpenQuestions && Array.isArray(openQuestionsRaw);
  const qRows: unknown[] = oqIsList ? (openQuestionsRaw as unknown[]) : [];
  const oqCount: number | null = oqIsList ? qRows.length : null;

  const decisionsWithoutSourceAnchor: string[] | null = decisionsIsList
    ? dRows.filter((c) => hasField(c, "source_anchor") &&
        !nonempty(c, "source_anchor")).map(rowName)
    : null;
  const decisionsNotFaithful: string[] | null = decisionsIsList
    ? dRows.filter((c) => hasField(c, "faithful_to_source") &&
        (c as Record<string, unknown>)["faithful_to_source"] !== true)
        .map(rowName)
    : null;
  const inferredDecisionsUnmarked: string[] | null = decisionsIsList
    ? dRows.filter((c) => isPyDict(c) && c["is_inferred"] === true &&
        hasField(c, "inference_marked") && c["inference_marked"] !== true)
        .map(rowName)
    : null;
  const inferredCount: number | null = decisionsIsList
    ? dRows.filter((c) => isPyDict(c) && c["is_inferred"] === true).length
    : null;
  const actionsWithoutOwner: string[] | null = actionsIsList
    ? aRows.filter((c) => hasField(c, "owner") && !nonempty(c, "owner"))
        .map(rowName)
    : null;
  const actionsWithoutDueDate: string[] | null = actionsIsList
    ? aRows.filter((c) => hasField(c, "due_date") && !nonempty(c, "due_date"))
        .map(rowName)
    : null;
  const actionsWithoutSourceAnchor: string[] | null = actionsIsList
    ? aRows.filter((c) => hasField(c, "source_anchor") &&
        !nonempty(c, "source_anchor")).map(rowName)
    : null;
  const openQuestionsWithoutSourceAnchor: string[] | null = oqIsList
    ? qRows.filter((c) => hasField(c, "source_anchor") &&
        !nonempty(c, "source_anchor")).map(rowName)
    : null;
  const decisionAnchorCoverage: number | null =
    decisionsIsList && decisionsCount !== null && decisionsCount > 0
      ? dRows.filter((c) => nonempty(c, "source_anchor")).length / decisionsCount
      : null;
  const decisionFaithfulCoverage: number | null =
    decisionsIsList && decisionsCount !== null && decisionsCount > 0
      ? dRows.filter((c) => isPyDict(c) &&
          c["faithful_to_source"] === true).length / decisionsCount
      : null;
  const inferredMarkingCoverage: number | null =
    decisionsIsList && inferredCount !== null && inferredCount > 0
      ? dRows.filter((c) => isPyDict(c) && c["is_inferred"] === true &&
          c["inference_marked"] === true).length / inferredCount
      : null;
  const actionOwnerCoverage: number | null =
    actionsIsList && actionsCount !== null && actionsCount > 0
      ? aRows.filter((c) => nonempty(c, "owner")).length / actionsCount
      : null;
  const actionDueDateCoverage: number | null =
    actionsIsList && actionsCount !== null && actionsCount > 0
      ? aRows.filter((c) => nonempty(c, "due_date")).length / actionsCount
      : null;
  const actionAnchorCoverage: number | null =
    actionsIsList && actionsCount !== null && actionsCount > 0
      ? aRows.filter((c) => nonempty(c, "source_anchor")).length / actionsCount
      : null;
  const openQuestionAnchorCoverage: number | null =
    oqIsList && oqCount !== null && oqCount > 0
      ? qRows.filter((c) => nonempty(c, "source_anchor")).length / oqCount
      : null;

  // ---- Section 1: source_and_meeting_identity ----
  boolCheck(results, "source_and_meeting_identity",
    "source_read_in_full", manifest,
    ["source", "read_in_full"],
    "source: the notes or transcript were read in full, end to end, before extraction");
  boolCheck(results, "source_and_meeting_identity",
    "attendees_recorded", manifest,
    ["source", "attendees_recorded"],
    "meeting identity: who attended is recorded from the source");
  boolCheck(results, "source_and_meeting_identity",
    "meeting_date_recorded", manifest,
    ["source", "meeting_date_recorded"],
    "meeting identity: when the meeting happened is recorded from the source");
  boolCheck(results, "source_and_meeting_identity",
    "meeting_identity_confirmed", manifest,
    ["source", "meeting_identity_confirmed"],
    "meeting identity: attendees, date and meeting identity are confirmed from the source");
  boolCheck(results, "source_and_meeting_identity",
    "absent_attendees_named_when_relevant", manifest,
    ["source", "absent_attendees_named_when_relevant"],
    "meeting identity: who was absent is named as well as who attended, when attendance matters to a decision");
  boolCheck(results, "source_and_meeting_identity",
    "speaker_attribution_kept_where_it_matters", manifest,
    ["source", "speaker_attribution_kept_where_it_matters"],
    "source: speaker attribution is kept where it matters for ownership");
  boolCheck(results, "source_and_meeting_identity",
    "numbers_dates_amounts_copied_exactly", manifest,
    ["source", "numbers_dates_amounts_copied_exactly"],
    "source: numbers, dates and amounts are copied exactly from the source, never rounded or tidied");
  boolCheck(results, "source_and_meeting_identity",
    "names_spelled_as_in_source_or_contacts", manifest,
    ["source", "names_spelled_as_in_source_or_contacts"],
    "source: names are spelled as in the source or the contacts, checked when a name is unclear");

  // ---- Section 2: decisions_fidelity ----
  boolCheck(results, "decisions_fidelity",
    "decisions_stated_close_to_source_wording", manifest,
    ["decisions_record", "decisions_stated_close_to_source_wording"],
    "decisions: each decision is stated as it was actually made, close to the source's own wording");
  boolCheck(results, "decisions_fidelity",
    "inferred_items_labelled_as_inferred", manifest,
    ["decisions_record", "inferred_items_labelled_as_inferred"],
    "decisions: anything inferred is marked as inferred, not presented as settled");
  check(results, "decisions_fidelity",
    "decisions_declared", decisionsRaw, decisionsIsList,
    decisionsIsList && (decisionsCount as number) > 0,
    "the declared record names its decisions — the decisions list is present and non-empty");
  const anchorPresent = decisionsIsList &&
    dRows.every((c) => hasField(c, "source_anchor"));
  check(results, "decisions_fidelity",
    "every_decision_has_source_anchor", decisionsRaw, anchorPresent,
    decisionsIsList && (decisionsCount as number) > 0 &&
      dRows.every((c) => nonempty(c, "source_anchor")),
    "decisions: every declared decision row carries a non-empty source anchor");
  const faithfulPresent = decisionsIsList &&
    dRows.every((c) => hasField(c, "faithful_to_source"));
  check(results, "decisions_fidelity",
    "every_decision_faithful_to_source", decisionsRaw, faithfulPresent,
    decisionsIsList && (decisionsCount as number) > 0 &&
      dRows.every((c) => isPyDict(c) && c["faithful_to_source"] === true),
    "decisions: every declared decision row declares itself faithful to the source");
  const inferredPresent = decisionsIsList &&
    dRows.every((c) => hasField(c, "is_inferred") &&
      (!isPyDict(c) || c["is_inferred"] !== true ||
        hasField(c, "inference_marked")));
  check(results, "decisions_fidelity",
    "every_inferred_decision_marked", decisionsRaw, inferredPresent,
    decisionsIsList && (decisionsCount as number) > 0 &&
      dRows.every((c) => isPyDict(c) &&
        (c["is_inferred"] !== true || c["inference_marked"] === true)),
    "decisions: every declared decision row that is inferred is marked as inferred");

  // ---- Section 3: action_ownership_and_dates ----
  boolCheck(results, "action_ownership_and_dates",
    "owners_and_due_dates_drawn_from_source", manifest,
    ["actions_record", "owners_and_due_dates_drawn_from_source"],
    "actions: each action's owner and due date are drawn from the source");
  boolCheck(results, "action_ownership_and_dates",
    "loose_deadlines_flagged_not_guessed", manifest,
    ["actions_record", "loose_deadlines_flagged_not_guessed"],
    "actions: deadlines stated loosely in the meeting are flagged to pin, not guessed");
  check(results, "action_ownership_and_dates",
    "actions_declared", actionsRaw, actionsIsList,
    actionsIsList && (actionsCount as number) > 0,
    "the declared record names its action items — the actions list is present and non-empty");
  const ownerPresent = actionsIsList &&
    aRows.every((c) => hasField(c, "owner"));
  check(results, "action_ownership_and_dates",
    "every_action_has_named_owner", actionsRaw, ownerPresent,
    actionsIsList && (actionsCount as number) > 0 &&
      aRows.every((c) => nonempty(c, "owner")),
    "actions: every declared action row carries a non-empty named owner");
  const duePresent = actionsIsList &&
    aRows.every((c) => hasField(c, "due_date"));
  check(results, "action_ownership_and_dates",
    "every_action_has_due_date", actionsRaw, duePresent,
    actionsIsList && (actionsCount as number) > 0 &&
      aRows.every((c) => nonempty(c, "due_date")),
    "actions: every declared action row carries a non-empty due date");
  const aAnchorPresent = actionsIsList &&
    aRows.every((c) => hasField(c, "source_anchor"));
  check(results, "action_ownership_and_dates",
    "every_action_has_source_anchor", actionsRaw, aAnchorPresent,
    actionsIsList && (actionsCount as number) > 0 &&
      aRows.every((c) => nonempty(c, "source_anchor")),
    "actions: every declared action row carries a non-empty source anchor");

  // ---- Section 4: open_questions_and_carry_forward ----
  boolCheck(results, "open_questions_and_carry_forward",
    "unresolved_items_collected_separately", manifest,
    ["open_questions_record", "unresolved_items_collected_separately"],
    "open questions: anything raised and left unresolved is collected separately");
  boolCheck(results, "open_questions_and_carry_forward",
    "ownerless_we_should_listed_as_open_questions", manifest,
    ["open_questions_record", "ownerless_we_should_listed_as_open_questions"],
    "open questions: a \"we should\" with no owner is listed as an open question, not an action item");
  boolCheck(results, "open_questions_and_carry_forward",
    "prior_open_items_carried_forward_visibly", manifest,
    ["open_questions_record", "prior_open_items_carried_forward_visibly"],
    "open questions: a second meeting in a series carries its open items forward visibly");
  check(results, "open_questions_and_carry_forward",
    "open_questions_declared", openQuestionsRaw, oqIsList,
    oqIsList,
    "the declared record names its open questions — the open_questions list is present (an empty list declares that nothing is open)");
  const qAnchorPresent = oqIsList &&
    qRows.every((c) => hasField(c, "source_anchor"));
  check(results, "open_questions_and_carry_forward",
    "every_open_question_has_source_anchor", openQuestionsRaw, qAnchorPresent,
    oqIsList && qRows.every((c) => nonempty(c, "source_anchor")),
    "open questions: every declared open-question row carries a non-empty source anchor");

  // ---- Section 5: recap_draft_and_handoff ----
  boolCheck(results, "recap_draft_and_handoff",
    "recap_decisions_first_then_actions_then_open_questions", manifest,
    ["recap", "decisions_first_then_actions_then_open_questions"],
    "recap: the draft runs decisions first, then action items with owners and dates, then open questions");
  boolCheck(results, "recap_draft_and_handoff",
    "recap_concise_enough_to_be_read", manifest,
    ["recap", "concise_enough_to_be_read"],
    "recap: the draft is short enough to actually be read");
  boolCheck(results, "recap_draft_and_handoff",
    "recap_shown_as_draft_before_any_send", manifest,
    ["recap", "shown_as_draft_before_any_send"],
    "recap: the recap is shown as a draft; it goes nowhere until it is approved");
  boolCheck(results, "recap_draft_and_handoff",
    "confirmed_actions_handed_off_on_approval", manifest,
    ["handoff", "confirmed_actions_handed_off_with_owners_and_dates_on_approval"],
    "handoff: on approval, confirmed action items are handed off with their owners and dates");
  boolCheck(results, "recap_draft_and_handoff",
    "recap_sent_only_through_directed_channel_on_approval", manifest,
    ["handoff", "recap_sent_only_through_directed_channel_on_approval"],
    "handoff: on approval, the recap is sent through the directed channel only");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "no_inferred_decision_presented_as_made", manifest,
    ["red_lines", "inferred_decision_presented_as_made_present"],
    "red line: no inferred decision is presented as one that was actually made");
  falseCheck(results, "red_lines",
    "no_invented_owner_or_due_date", manifest,
    ["red_lines", "invented_owner_or_due_date_present"],
    "red line: no invented owner or due date the meeting did not set is present");
  falseCheck(results, "red_lines",
    "no_recap_sent_without_approval", manifest,
    ["red_lines", "recap_sent_without_approval_present"],
    "red line: the recap was not sent without approval for that send");
  falseCheck(results, "red_lines",
    "no_unresolved_question_dropped_for_cleanliness", manifest,
    ["red_lines", "unresolved_question_dropped_for_cleanliness_present"],
    "red line: no unresolved question was dropped because the recap reads cleaner without it");
  falseCheck(results, "red_lines",
    "no_disclosure_beyond_named_attendees", manifest,
    ["red_lines", "meeting_contents_disclosed_beyond_named_attendees_present"],
    "red line: meeting contents go only to the attendees named — no disclosure beyond them is present");

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
    verdict = "MEETING_EXTRACTION_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "MEETING_EXTRACTION_SOUND";
  }

  const computedNames = [
    "decisions_declared",
    "every_decision_has_source_anchor",
    "every_decision_faithful_to_source",
    "every_inferred_decision_marked",
    "actions_declared",
    "every_action_has_named_owner",
    "every_action_has_due_date",
    "every_action_has_source_anchor",
    "open_questions_declared",
    "every_open_question_has_source_anchor",
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
    service: "meeting-decisions-and-actions-extract",
    atom_version: "0.1.0",
    meeting: manifest["meeting"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    decisions_count: decisionsCount,
    decisions_without_source_anchor: decisionsWithoutSourceAnchor,
    decision_anchor_coverage: fmt6(decisionAnchorCoverage),
    decisions_not_faithful: decisionsNotFaithful,
    decision_faithful_coverage: fmt6(decisionFaithfulCoverage),
    inferred_decisions_unmarked: inferredDecisionsUnmarked,
    inferred_marking_coverage: fmt6(inferredMarkingCoverage),
    actions_count: actionsCount,
    actions_without_owner: actionsWithoutOwner,
    action_owner_coverage: fmt6(actionOwnerCoverage),
    actions_without_due_date: actionsWithoutDueDate,
    action_due_date_coverage: fmt6(actionDueDateCoverage),
    actions_without_source_anchor: actionsWithoutSourceAnchor,
    action_anchor_coverage: fmt6(actionAnchorCoverage),
    open_questions_count: oqCount,
    open_questions_without_source_anchor: openQuestionsWithoutSourceAnchor,
    open_question_anchor_coverage: fmt6(openQuestionAnchorCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "MEETING DECISIONS AND ACTIONS EXTRACT",
    `meeting: ${pyStr(verdict.meeting ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
