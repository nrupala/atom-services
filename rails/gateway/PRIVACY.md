# Privacy — Conduit Atoms gateway

What the gateway holds about a user, and nothing more:

- the account email address (to derive keys and send sign-in links);
- key issuance records (timestamps, a key fingerprint, scopes,
  revocation state) — never the key itself;
- a prepaid-balance ledger (grants, draws, refunds) — a financial
  record, retained for accounting with the email as its identity;
- metering rows (key fingerprint, atom, timestamp, charge) — call
  payloads are processed in memory and never stored or logged.

Data export or deletion: email **info@aimlds.org** from the account
address. Export returns the account record, key records, balance,
and ledger. Deletion removes the user record, keys, sessions, and
metering identity; balance-ledger rows are retained in anonymized
form where accounting law requires the financial record itself.

Payments are processed by Stripe on Stripe-hosted pages; the
gateway never sees or stores card data. Sold by 2351485 ALBERTA
INC. (AIMLDS).
