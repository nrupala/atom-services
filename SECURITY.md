# Security Policy

## Reporting a vulnerability

Report vulnerabilities privately by email to **info@aimlds.org** with the
subject line `SECURITY: atom-services`. Do not open a public issue,
discussion, or pull request for a security report.

Please include:

- the atom (service name) or rail affected, and the version or commit;
- what an attacker can do, and the steps to reproduce it;
- any proof-of-concept input, kept to the minimum needed.

## What happens next

| Step | Target |
|---|---|
| Acknowledgement of your report | within 5 business days |
| First assessment (confirmed, not reproduced, or out of scope) | within 10 business days |
| Fix released for a confirmed critical or high issue | within 30 days of confirmation |
| Fix released for a confirmed medium or low issue | within 60 days of confirmation |

We keep you informed at each step. If a fix needs longer, we tell you why
and give a new date.

## Disclosure

We follow coordinated disclosure. Please give us the time above to ship a
fix before you publish. Once the fix is released we publish an advisory
on GitHub and record it in `CHANGELOG.md`, naming the fixed version.

## Credit

With your permission we credit you by name (or handle) in the advisory
and the changelog. Tell us if you prefer to stay anonymous.

## Supported versions

| Version | Security fixes |
|---|---|
| Latest release and the default branch (`main`) | Yes |
| Older releases | No. Upgrade to the latest release |

## Scope

In scope: the code in this repository, including every service unit under
`services/` and the gateway under `rails/gateway/`, and the live serving
surface at https://atoms.pipavia.com.

Out of scope: denial-of-service by volume, social engineering, findings
in third-party services we do not control, and reports produced only by
automated scanners without a demonstrated impact.
