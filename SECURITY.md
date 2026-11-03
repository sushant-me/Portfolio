# Security Policy

## Reporting a Vulnerability

Security is a priority for this project. If you discover a vulnerability, please report it privately so it can be addressed before public disclosure:

- Open a **private security advisory** using the "Report a vulnerability" button on the repository's Security tab, or
- Email [sushant.poudel2028@gmail.com](mailto:sushant.poudel2028@gmail.com) with reproduction steps, impact, and any suggested fix.

The same contacts are published in machine-readable form at
[`/.well-known/security.txt`](https://sushantpoudel2028.com.np/.well-known/security.txt)
(RFC 9116), whose `Expires` field is checked by `scripts/verify-security.py` so
the file cannot quietly go stale:

- https://sushantpoudel2028.com.np/.well-known/security.txt

Please do **not** open a public issue for security problems. Reports are acknowledged within 48 hours, and fixes are prioritized by severity.

## In scope

- `https://sushantpoudel2028.com.np` — the site and its Pages Functions API (`/api/upload`, `/api/file/*`, `/api/list`, `/api/delete`, `/api/health`).
- The DNS records for the domain (SPF, DMARC, CAA) and the transport configuration in front of it.

## Out of scope

- Denial of service, volumetric or load testing.
- The admin surface: `/admin` and every `/api/*` route require a token that is not
  distributed. Reports that amount to "the admin panel is reachable" without a
  working bypass are not actionable. A **bypass** of that token check is in scope.
- Findings that depend on the reporter's own device being compromised, on
  browser extensions, or on a service the site does not control.
- Automated scanner output with no reproduction steps. Please include the request
  and response (redacted) and the impact you can demonstrate.

## Testing expectations

The site is a static export, so most of it is public content by design. Keep testing
non-destructive: no brute force, no state-changing requests, no data exfiltration,
and no testing that degrades availability. Testing against the live site must stay
within the scope above.

## What happens after a report

- Acknowledgement within 48 hours.
- An initial assessment (severity, whether it is reproducible) within five working days.
- Fixes prioritized by severity. Findings in this repository's own configuration
  get a regression check where one is possible — for example, `scripts/check-security-output.sh`
  fails a build that loses the security headers, and `scripts/verify-security.py`
  re-tests the deployed site.

There is no paid bug bounty program. Credit is offered in the fix commit or the
advisory unless you ask to stay anonymous.
