// Zero-knowledge claim audit — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/zero-knowledge-claim-audit/src/zero_knowledge_claim_audit.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string
// are byte-identical to the Python output for the same input.
// No computed numbers appear in the output except the integer pass /
// fail / missing counts in the summary, serialized as plain base-10
// integers in both implementations (no rounding rule needed).

import { pyRepr, pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  product: "string",
  claims: {
    claim_basis: "string",
  },
  access: {
    server_can_read_user_data: "boolean",
  },
  storage: {
    server_stores_only_opaque_bytes: "boolean",
  },
  encryption: {
    encryption_happens_on_client_device: "boolean",
    plaintext_exists_only_on_client_device: "boolean",
    authenticated_encryption: "boolean",
    relies_on_tls_alone: "boolean",
  },
  keys: {
    keys_never_leave_device: "boolean",
    key_derivation_client_side: "boolean",
    key_journey_documented: "boolean",
    key_backup_uploads_key_to_server: "boolean",
  },
  trust: {
    key_escrow: "boolean",
    recovery_backdoor: "boolean",
    admin_plaintext_view: "boolean",
    trusted_components: ["string"],
    trusted_third_parties_in_data_path: ["string"],
  },
  recovery: {
    password_reset_recovers_data: "boolean",
    no_recovery_possible_claimed: "boolean",
  },
  scope: {
    plaintext_locations_documented: "boolean",
    plaintext_in_logs: "boolean",
    plaintext_in_crash_dumps: "boolean",
    plaintext_in_thumbnails_or_previews: "boolean",
    metadata_leakage_acknowledged: "boolean",
    residual_risks_documented: "boolean",
  },
  theater: {
    client_type: "string",
    web_app_trust_distinction_acknowledged: "boolean",
    search_or_indexing_requires_server_plaintext_or_tokens: "boolean",
    threat_model_includes_malicious_operator: "boolean",
  },
};

export const SECTIONS = [
  "core_test",
  "client_side_encryption",
  "key_journey",
  "trusted_parties_and_recovery",
  "plaintext_and_metadata_scope",
  "theater_and_threat_model",
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
  product: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: core_test ----
  const [serverRead, hasServerRead] = getPath(manifest, "access", "server_can_read_user_data");
  check(
    results, "core_test", "server_operator_cannot_read_user_data",
    serverRead, hasServerRead, serverRead === false,
    "skill: the core test — can the server operator (malicious, curious, or compelled) read user data? If yes, the system is not zero-knowledge",
  );

  const [opaque, hasOpaque] = getPath(manifest, "storage", "server_stores_only_opaque_bytes");
  check(
    results, "core_test", "server_stores_only_opaque_bytes",
    opaque, hasOpaque, opaque === true,
    "skill: the server receives and stores opaque bytes; plaintext exists only on the user's device",
  );

  const [basis, hasBasis] = getPath(manifest, "claims", "claim_basis");
  check(
    results, "core_test", "claim_basis_is_cryptographic_guarantee",
    basis, hasBasis, basis === "cryptographic_guarantee",
    `claim_basis=${pyRepr(basis)} (skill: distinguish can't read (cryptographic guarantee) from won't read (policy promise); only the first is ZK)`,
  );

  // ---- Section 2: client_side_encryption ----
  const [onDevice, hasOnDevice] = getPath(manifest, "encryption", "encryption_happens_on_client_device");
  check(
    results, "client_side_encryption", "encryption_on_client_device",
    onDevice, hasOnDevice, onDevice === true,
    "skill: client-side encryption, always — if encryption does not happen on your device, it is not zero-knowledge, whatever the marketing page says",
  );

  const [plaintextOnly, hasPo] = getPath(manifest, "encryption", "plaintext_exists_only_on_client_device");
  check(
    results, "client_side_encryption", "plaintext_only_on_client_device",
    plaintextOnly, hasPo, plaintextOnly === true,
    "skill: plaintext exists only on the user's device; the server stores unreadable bytes and only the user decrypts",
  );

  const [authenticated, hasAuth] = getPath(manifest, "encryption", "authenticated_encryption");
  check(
    results, "client_side_encryption", "authenticated_encryption",
    authenticated, hasAuth, authenticated === true,
    "skill: authenticated encryption — ciphertext must be tamper-evident; encryption without authentication lets an attacker modify data silently",
  );

  const [tlsAlone, hasTlsAlone] = getPath(manifest, "encryption", "relies_on_tls_alone");
  check(
    results, "client_side_encryption", "encryption_independent_of_transport",
    tlsAlone, hasTlsAlone, tlsAlone === false,
    "skill: encryption independent of transport — TLS protects the pipe, ZK protects the data; a system that relies on TLS alone trusts the server at the end of the pipe",
  );

  // ---- Section 3: key_journey ----
  const [neverLeave, hasNl] = getPath(manifest, "keys", "keys_never_leave_device");
  check(
    results, "key_journey", "keys_never_leave_device",
    neverLeave, hasNl, neverLeave === true,
    "skill: keys never leave the device — not in transit, not 'temporarily', not for 'convenience features'",
  );

  const [derivLocal, hasDl] = getPath(manifest, "keys", "key_derivation_client_side");
  check(
    results, "key_journey", "key_derivation_client_side",
    derivLocal, hasDl, derivLocal === true,
    "skill: key derivation happens locally (password -> KDF -> key, all client-side)",
  );

  const [journey, hasJourney] = getPath(manifest, "keys", "key_journey_documented");
  check(
    results, "key_journey", "key_journey_documented",
    journey, hasJourney, journey === true,
    "skill: follow the key — where is it generated, where is it stored, what crosses the network? Gaps in the diagram are the audit findings",
  );

  const [backupUpload, hasBu] = getPath(manifest, "keys", "key_backup_uploads_key_to_server");
  check(
    results, "key_journey", "no_key_backup_uploaded_to_server",
    backupUpload, hasBu, backupUpload === false,
    "skill (theater): key 'backup' uploads the key to the server under another name",
  );

  // ---- Section 4: trusted_parties_and_recovery ----
  const [escrow, hasEscrow] = getPath(manifest, "trust", "key_escrow");
  check(
    results, "trusted_parties_and_recovery", "no_key_escrow",
    escrow, hasEscrow, escrow === false,
    "skill: no trusted third parties in the data path — no key escrow",
  );

  const [backdoor, hasBackdoor] = getPath(manifest, "trust", "recovery_backdoor");
  check(
    results, "trusted_parties_and_recovery", "no_recovery_backdoor",
    backdoor, hasBackdoor, backdoor === false,
    "skill: no trusted third parties in the data path — no recovery backdoor",
  );

  const [adminView, hasAv] = getPath(manifest, "trust", "admin_plaintext_view");
  check(
    results, "trusted_parties_and_recovery", "no_admin_plaintext_view",
    adminView, hasAv, adminView === false,
    "skill: no trusted third parties in the data path — no admin plaintext view",
  );

  const [components, hasComp] = getPath(manifest, "trust", "trusted_components");
  check(
    results, "trusted_parties_and_recovery", "trusted_components_named_including_client_os_distribution",
    components, hasComp,
    Array.isArray(components) &&
      components.includes("client") &&
      components.includes("operating_system") &&
      components.includes("distribution_channel"),
    `trusted_components=${pyRepr(components)} (skill: name every trusted component explicitly — including the client itself, the OS, and the distribution channel)`,
  );

  const [thirdParties, hasTp] = getPath(manifest, "trust", "trusted_third_parties_in_data_path");
  check(
    results, "trusted_parties_and_recovery", "trusted_third_parties_in_data_path_listed",
    thirdParties, hasTp, Array.isArray(thirdParties),
    `trusted_third_parties_in_data_path=${pyRepr(thirdParties)} (skill: each exception is a named party you now trust — list them; an empty list declares none)`,
  );

  const [recovers, hasRecovers] = getPath(manifest, "recovery", "password_reset_recovers_data");
  const [noRecovery, hasNoRec] = getPath(manifest, "recovery", "no_recovery_possible_claimed");
  check(
    results, "trusted_parties_and_recovery", "recovery_claims_consistent",
    recovers, hasRecovers && hasNoRec,
    !(recovers === true && noRecovery === true),
    `password_reset_recovers_data=${pyRepr(recovers)} no_recovery_possible_claimed=${pyRepr(noRecovery)} (skill: read the recovery story — 'forgot password' recovery and 'we can't recover your data' cannot both be true; the recovery mechanism defines the real trust model)`,
  );

  // ---- Section 5: plaintext_and_metadata_scope ----
  const [locations, hasLoc] = getPath(manifest, "scope", "plaintext_locations_documented");
  check(
    results, "plaintext_and_metadata_scope", "plaintext_locations_documented",
    locations, hasLoc, locations === true,
    "skill: follow the plaintext — list every place plaintext exists, however briefly (memory, logs, crash dumps, thumbnails, previews); each is a scope boundary",
  );

  const [inLogs, hasLogs] = getPath(manifest, "scope", "plaintext_in_logs");
  check(
    results, "plaintext_and_metadata_scope", "plaintext_not_in_logs",
    inLogs, hasLogs, inLogs === false,
    "skill: follow the plaintext — plaintext in logs is a scope boundary where plaintext exists outside the device guarantee",
  );

  const [inDumps, hasDumps] = getPath(manifest, "scope", "plaintext_in_crash_dumps");
  check(
    results, "plaintext_and_metadata_scope", "plaintext_not_in_crash_dumps",
    inDumps, hasDumps, inDumps === false,
    "skill: follow the plaintext — plaintext in crash dumps is a scope boundary where plaintext exists outside the device guarantee",
  );

  const [inThumbs, hasThumbs] = getPath(manifest, "scope", "plaintext_in_thumbnails_or_previews");
  check(
    results, "plaintext_and_metadata_scope", "plaintext_not_in_thumbnails_or_previews",
    inThumbs, hasThumbs, inThumbs === false,
    "skill: follow the plaintext — plaintext in thumbnails and previews is a scope boundary where plaintext exists outside the device guarantee",
  );

  const [metadata, hasMeta] = getPath(manifest, "scope", "metadata_leakage_acknowledged");
  check(
    results, "plaintext_and_metadata_scope", "metadata_leakage_acknowledged",
    metadata, hasMeta, metadata === true,
    "skill: check the metadata — traffic analysis and blob-size leakage survive encryption; sizes, timing, and access patterns are data too, and ZK does not hide that you store data, how much, or when you access it",
  );

  const [residual, hasRes] = getPath(manifest, "scope", "residual_risks_documented");
  check(
    results, "plaintext_and_metadata_scope", "residual_risks_documented",
    residual, hasRes, residual === true,
    "skill: residual risks are part of the answer, not a footnote",
  );

  // ---- Section 6: theater_and_threat_model ----
  const [clientType, hasCt] = getPath(manifest, "theater", "client_type");
  check(
    results, "theater_and_threat_model", "client_type_declared",
    clientType, hasCt,
    typeof clientType === "string" && clientType.trim().length > 0,
    `client_type=${pyRepr(clientType)} (skill: say which one you are looking at — a locally installed client or a web app served by the same server)`,
  );

  const [webAck, hasWebAck] = getPath(manifest, "theater", "web_app_trust_distinction_acknowledged");
  if (hasCt && clientType === "web_app_served_by_same_server") {
    check(
      results, "theater_and_threat_model", "web_app_trust_distinction_acknowledged",
      webAck, hasWebAck, webAck === true,
      `client_type=${pyRepr(clientType)} web_app_trust_distinction_acknowledged=${pyRepr(webAck)} (skill: the web-app paradox — browser-delivered crypto moves trust to the server's code pipeline; it is not the same guarantee as a locally installed client, and that distinction must be stated)`,
    );
  } else {
    check(
      results, "theater_and_threat_model", "web_app_trust_distinction_acknowledged",
      clientType, hasCt, true,
      "client is not declared as a web app served by the same server",
    );
  }

  const [searchTokens, hasSt] = getPath(manifest, "theater", "search_or_indexing_requires_server_plaintext_or_tokens");
  check(
    results, "theater_and_threat_model", "search_indexing_does_not_expose_plaintext_or_tokens",
    searchTokens, hasSt, searchTokens === false,
    "skill (theater): the 'encrypted' search/indexing requires the server to see plaintext or searchable tokens",
  );

  const [malicious, hasMal] = getPath(manifest, "theater", "threat_model_includes_malicious_operator");
  check(
    results, "theater_and_threat_model", "threat_model_includes_malicious_operator",
    malicious, hasMal, malicious === true,
    "skill (theater): the threat model quietly excludes the actual adversary (a malicious operator)",
  );

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
    verdict = "CLAIMS_UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CLAIMS_SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "zero-knowledge-claim-audit",
    atom_version: "0.1.0",
    product: manifest["product"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ZERO-KNOWLEDGE CLAIM AUDIT",
    `product: ${pyStr(verdict.product ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
