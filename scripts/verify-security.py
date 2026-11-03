#!/usr/bin/env python3
"""Independently verify the security hardening this site claims, as served.

Why this exists
---------------
The HybridSec-QA scan of 2026-11-03 (scan 12b22277123d) found missing HSTS,
missing SPF/DMARC, missing X-Frame-Options/Permissions-Policy, and no
RFC 9116 security.txt. A header pasted into `public/_headers` can look correct
in the repository and still not reach a browser: Cloudflare Pages only applies
`_headers` to static asset responses (not Pages Functions), a bad path pattern
silently matches nothing, and DNS records live outside the repository entirely.
The only trustworthy statement is what the domain actually serves.

So this tool talks to the deployed site and the public DNS. It does not read
`public/_headers`, `out/`, or wrangler config, because those are inputs, not
outcomes. Run it before a change to capture what is wrong, and after to prove
what is fixed.

What it checks
--------------
1. HTTPS response headers on `/` and on one HTML subpage:
   - `Strict-Transport-Security` present with `max-age` >= 15552000 (180 days)
   - `X-Frame-Options` is DENY/SAMEORIGIN, or CSP carries `frame-ancestors`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy` present
   - `Permissions-Policy` present
   - `Content-Security-Policy` present and enforcing (not report-only) with
     `frame-ancestors`, `base-uri` and `object-src`
   - `http://` redirects to `https://` with a 301
2. `/.well-known/security.txt` and `/security.txt`: at least one returns
   HTTP 200 with `Contact:` and an ISO-8601 `Expires:` at least 30 days in the
   future (RFC 9116 requires the field; the 30-day floor keeps it from going
   stale silently).
3. DNS over HTTPS (Cloudflare's JSON API): one SPF TXT record on the apex whose
   last mechanism is `-all` or `~all`, and one DMARC TXT record at `_dmarc`
   with `p=reject` or `p=quarantine`. TTLs and full record values are reported.
4. `robots.txt`: HTTP 200, a `Sitemap:` line with an absolute URL, and no
   `Disallow` path that looks like access control for something sensitive
   (robots.txt is a crawler request, not an authorization mechanism).

Exit status is 0 only when every check passes. There is deliberately no way to
turn a failing check off: a check that can be skipped to get green is not a
check. See `docs/security/README.md` for the operator runbook.

Dependencies: Python 3 standard library only. No pip install, no `dig`, no
`requests`. DNS is queried through https://cloudflare-dns.com/dns-query so the
verdict does not depend on the resolver configured on the machine running it.

Examples
--------
    python3 scripts/verify-security.py
    python3 scripts/verify-security.py --json > verify-after.json
    python3 scripts/verify-security.py --url https://<hash>.portfolio.pages.dev \\
        --domain sushantpoudel2028.com.np
    python3 scripts/verify-security.py --timeout 5 --subpage /press
"""

from __future__ import annotations

import argparse
import http.client
import json
import re
import sys
import textwrap
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
from html.parser import HTMLParser

DEFAULT_URL = "https://sushantpoudel2028.com.np"
DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query"
DOH_ACCEPT = "application/dns-json"
USER_AGENT = "portfolio-security-verify/1.0 (+https://sushantpoudel2028.com.np)"

# 180 days. The scan asked for HSTS on every HTML response; this is the floor
# this tool accepts, while the runbook recommends a full year (31536000), which
# is also the minimum for the preload list.
HSTS_MIN_MAX_AGE = 15_552_000

MAX_HTML_BYTES = 2_000_000
MAX_TEXT_BYTES = 1_000_000

# Where RFC 9116 says the file should live, then the historical path. RFC 9116
# allows either; the script accepts whichever one is actually served.
SECURITY_TXT_PATHS = ("/.well-known/security.txt", "/security.txt")

# An Expires field that is 29 days away is still RFC 9116-valid, but it is a
# maintenance failure waiting to happen. Public/.well-known/security.txt and
# SECURITY.md both promise this gate, so refresh the date before it trips.
SECURITYTXT_MIN_REMAINING_DAYS = 30

# Paths that are usually not representative HTML pages or that are private
# tooling. Checking /admin as "the subpage" would test a page visitors never see.
_SKIP_PREFIXES = ("/_next/", "/images/", "/og/", "/papers/", "/admin")
_ASSET_EXTENSIONS = frozenset(
    {
        ".avif", ".css", ".gif", ".ico", ".jpeg", ".jpg", ".js", ".json",
        ".map", ".mp4", ".pdf", ".png", ".svg", ".ttf", ".txt", ".webmanifest",
        ".webp", ".woff", ".woff2", ".xml", ".zip",
    }
)

# Words that suggest a Disallow rule is standing in for real access control.
# Matching is intentionally generous: a false positive here costs an operator
# one sentence of explanation; a false negative blesses a path that is only
# "hidden" because crawlers were asked to look away.
_SENSITIVE_TOKENS = (
    ".env", ".git", "account", "admin", "api", "auth", "backup", "config",
    "credential", "dashboard", "database", "delete", "dump", "internal",
    "login", "panel", "passwd", "password", "private", "secret", "staging",
    "token", "upload",
)

# Fixed candidates are tried before links found on the homepage, so the set of
# pages checked is deterministic for this site. Discovery is the fallback for
# other deployments (for example a preview URL with a different route set).
_SUBPAGE_CANDIDATES = ("/writing", "/press", "/publications")


# --------------------------------------------------------------------------- #
# Result collection
# --------------------------------------------------------------------------- #


@dataclass
class Check:
    """One assertion, with the evidence needed to argue about it later."""

    id: str
    name: str
    status: str  # "PASS" or "FAIL"
    detail: str
    evidence: dict = field(default_factory=dict)

    @property
    def passed(self) -> bool:
        return self.status == "PASS"


class Report:
    """Ordered list of checks plus the counts the exit code is derived from."""

    def __init__(self) -> None:
        self.checks: list[Check] = []

    def add(
        self,
        check_id: str,
        name: str,
        passed: bool,
        detail: str,
        evidence: dict | None = None,
    ) -> None:
        self.checks.append(
            Check(
                id=check_id,
                name=name,
                status="PASS" if passed else "FAIL",
                detail=detail,
                evidence=evidence or {},
            )
        )

    @property
    def passed_count(self) -> int:
        return sum(1 for check in self.checks if check.passed)

    @property
    def failed(self) -> list[Check]:
        return [check for check in self.checks if not check.passed]

    def summary(self) -> dict:
        return {
            "total": len(self.checks),
            "passed": self.passed_count,
            "failed": len(self.failed),
        }


def log(message: str) -> None:
    """Progress goes to stderr so `--json` keeps stdout machine-readable."""
    print(f"[verify] {message}", file=sys.stderr)


# --------------------------------------------------------------------------- #
# HTTP
# --------------------------------------------------------------------------- #


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Surface the 3xx itself; the redirect check needs the status and Location."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001
        return None


@dataclass
class HttpResponse:
    status: int | None
    url: str
    headers: list[tuple[str, str]]
    body: bytes
    elapsed: float
    error: str | None = None

    def header(self, name: str) -> str | None:
        values = self.header_values(name)
        return values[0] if values else None

    def header_values(self, name: str) -> list[str]:
        wanted = name.lower()
        return [value for key, value in self.headers if key.lower() == wanted]

    def header_map(self) -> dict[str, list[str]]:
        mapped: dict[str, list[str]] = {}
        for key, value in self.headers:
            mapped.setdefault(key.lower(), []).append(value)
        return mapped

    def content_type(self) -> str:
        return (self.header("content-type") or "").lower()

    def text(self) -> str:
        return self.body.decode("utf-8", "replace")


def _read_limited(response, limit: int) -> bytes:  # noqa: ANN001
    try:
        return response.read(limit)
    except Exception:  # pragma: no cover - a broken read still leaves headers
        return b""


def fetch(
    url: str,
    *,
    timeout: float,
    follow: bool = True,
    limit: int = MAX_TEXT_BYTES,
) -> HttpResponse:
    """GET a URL and return status/headers/body without hiding failures.

    HTTP error statuses (404, 500) are responses, not exceptions: a 404 on
    security.txt is a finding, not a transport error. Only a failure to
    complete a request at all becomes `error`, because that is the case where
    the check result means "unknown" and should not be reported as "absent".
    """
    handlers = [] if follow else [_NoRedirect]
    opener = urllib.request.build_opener(*handlers)
    request = urllib.request.Request(
        url,
        method="GET",
        headers={"User-Agent": USER_AGENT, "Accept-Encoding": "identity"},
    )
    started = time.monotonic()
    try:
        with opener.open(request, timeout=timeout) as response:
            return HttpResponse(
                status=response.status,
                url=response.geturl(),
                headers=list(response.headers.raw_items()),
                body=_read_limited(response, limit),
                elapsed=time.monotonic() - started,
            )
    except urllib.error.HTTPError as exc:
        return HttpResponse(
            status=exc.code,
            url=exc.geturl() or url,
            headers=list(exc.headers.raw_items()) if exc.headers else [],
            body=_read_limited(exc, limit),
            elapsed=time.monotonic() - started,
        )
    except (urllib.error.URLError, http.client.HTTPException, TimeoutError, OSError) as exc:
        reason = getattr(exc, "reason", exc)
        return HttpResponse(
            status=None,
            url=url,
            headers=[],
            body=b"",
            elapsed=time.monotonic() - started,
            error=f"{type(exc).__name__}: {reason}",
        )


# --------------------------------------------------------------------------- #
# DNS over HTTPS
# --------------------------------------------------------------------------- #


_TXT_QUOTED = re.compile(r'"((?:[^"\\]|\\.)*)"')


def decode_txt(data: str) -> str:
    """Turn a DoH TXT rdata string into the record value.

    Cloudflare's JSON API returns TXT data as DNS presentation format:
    `"v=spf1 -all"` or several quoted chunks for long records. The chunks are
    concatenated (they are one logical character-string sequence), and the
    backslash escapes DNS uses for quotes/backslashes are undone.
    """
    chunks = _TXT_QUOTED.findall(data or "")
    if not chunks:
        return (data or "").strip().strip('"')
    return "".join(
        chunk.replace('\\"', '"').replace("\\\\", "\\") for chunk in chunks
    )


def doh_txt(name: str, *, timeout: float, attempts: int = 2) -> dict:
    """Query TXT records for `name` through Cloudflare's DoH JSON API."""
    last_error = None
    for attempt in range(attempts):
        try:
            query = urllib.parse.urlencode({"name": name, "type": "TXT"})
            request = urllib.request.Request(
                f"{DOH_ENDPOINT}?{query}",
                headers={"Accept": DOH_ACCEPT, "User-Agent": USER_AGENT},
            )
            with urllib.request.urlopen(request, timeout=timeout) as response:
                document = json.loads(_read_limited(response, 2_000_000).decode("utf-8"))
            records = []
            for answer in document.get("Answer", []):
                if int(answer.get("type", 0)) != 16:  # 16 = TXT
                    continue
                records.append(
                    {
                        "name": answer.get("name", ""),
                        "ttl": int(answer.get("TTL", 0)),
                        "value": decode_txt(answer.get("data", "")),
                    }
                )
            return {
                "name": name,
                "status": int(document.get("Status", -1)),
                "records": records,
                "error": None,
            }
        except Exception as exc:  # noqa: BLE001 - report, retry once, then fail
            last_error = f"{type(exc).__name__}: {exc}"
            if attempt + 1 < attempts:
                time.sleep(0.5)
    return {"name": name, "status": None, "records": [], "error": last_error}


# --------------------------------------------------------------------------- #
# Header parsing
# --------------------------------------------------------------------------- #


def parse_hsts(value: str) -> dict:
    directives: dict[str, str] = {}
    for part in value.split(";"):
        part = part.strip()
        if not part:
            continue
        key, separator, raw = part.partition("=")
        directives[key.strip().lower()] = raw.strip() if separator else ""
    return directives


def hsts_max_age(value: str) -> int | None:
    raw = parse_hsts(value).get("max-age", "")
    return int(raw) if raw.isdigit() else None


def csp_directive_names(value: str) -> list[str]:
    names = []
    for part in value.split(";"):
        part = part.strip()
        if part:
            names.append(part.split(None, 1)[0].lower())
    return names


def _note_weak_referrer(value: str) -> str:
    weak = {
        "unsafe-url": "sends full URLs cross-origin; prefer strict-origin-when-cross-origin or no-referrer",
        "no-referrer-when-downgrade": "this is the browser default and adds no protection",
    }
    lowered = value.strip().lower()
    return f" (weak: {weak[lowered]})" if lowered in weak else ""


# --------------------------------------------------------------------------- #
# Checks: HTTPS headers
# --------------------------------------------------------------------------- #


def add_header_checks(report: Report, label: str, path: str, response: HttpResponse) -> None:
    """Run the six header assertions for one fetched HTML page."""
    if response.error:
        report.add(
            f"headers.fetch:{path}",
            f"Page reachable {path}",
            False,
            f"GET {path} failed: {response.error}",
            {"path": path, "error": response.error},
        )
        return
    if response.status != 200:
        report.add(
            f"headers.fetch:{path}",
            f"Page reachable {path}",
            False,
            f"expected HTTP 200 from {path}, got {response.status}",
            {"path": path, "status": response.status, "url": response.url},
        )
        return

    headers = response.header_map()
    evidence = {"path": path, "url": response.url, "headers": headers}

    # 1. HSTS. Present on every HTML response, long enough to matter.
    hsts = response.header("strict-transport-security")
    if hsts is None:
        report.add(
            f"headers.hsts:{path}",
            f"HSTS header on {path}",
            False,
            "Strict-Transport-Security absent; add `max-age=31536000` (see docs/security/README.md)",
            evidence,
        )
    else:
        max_age = hsts_max_age(hsts)
        if max_age is None:
            report.add(
                f"headers.hsts:{path}",
                f"HSTS header on {path}",
                False,
                f"Strict-Transport-Security has no parseable max-age: {hsts!r}",
                evidence,
            )
        elif max_age < HSTS_MIN_MAX_AGE:
            report.add(
                f"headers.hsts:{path}",
                f"HSTS header on {path}",
                False,
                f"max-age={max_age} is below {HSTS_MIN_MAX_AGE} (180 days): {hsts!r}",
                evidence,
            )
        else:
            parsed = parse_hsts(hsts)
            extras = [
                flag
                for flag in ("includesubdomains", "preload")
                if flag in parsed
            ]
            suffix = ", ".join(extras) if extras else "no includeSubDomains/preload"
            report.add(
                f"headers.hsts:{path}",
                f"HSTS header on {path}",
                True,
                f"max-age={max_age} (>= {HSTS_MIN_MAX_AGE}), {suffix}",
                evidence,
            )

    # 2. X-Frame-Options, with CSP frame-ancestors as the modern equivalent.
    xfo = (response.header("x-frame-options") or "").strip()
    csp_value = response.header("content-security-policy")
    directives = csp_directive_names(csp_value) if csp_value else []
    xfo_ok = xfo.upper() in {"DENY", "SAMEORIGIN"}
    if xfo_ok:
        report.add(
            f"headers.xfo:{path}",
            f"X-Frame-Options on {path}",
            True,
            f"{xfo.upper()}" + ("; CSP frame-ancestors also set" if "frame-ancestors" in directives else ""),
            evidence,
        )
    elif "frame-ancestors" in directives:
        report.add(
            f"headers.xfo:{path}",
            f"X-Frame-Options on {path}",
            True,
            "X-Frame-Options absent, but CSP sets frame-ancestors (accepted equivalent)",
            evidence,
        )
    elif xfo:
        report.add(
            f"headers.xfo:{path}",
            f"X-Frame-Options on {path}",
            False,
            f"X-Frame-Options value {xfo!r} is not DENY/SAMEORIGIN and CSP has no frame-ancestors",
            evidence,
        )
    else:
        report.add(
            f"headers.xfo:{path}",
            f"X-Frame-Options on {path}",
            False,
            "X-Frame-Options absent and CSP has no frame-ancestors; the page can be framed",
            evidence,
        )

    # 3. MIME sniffing. Cloudflare Pages sends this by default, but the check
    #    is on the response, not on the platform's documented defaults.
    nosniff = (response.header("x-content-type-options") or "").strip().lower()
    report.add(
        f"headers.nosniff:{path}",
        f"X-Content-Type-Options on {path}",
        "nosniff" in nosniff,
        f"{nosniff or 'absent'}" if "nosniff" in nosniff else f"missing or wrong: {nosniff or 'absent'}",
        evidence,
    )

    # 4. Referrer-Policy. Presence is the requirement; weak values are noted so
    #    a passing check does not read as an endorsement.
    referrer = (response.header("referrer-policy") or "").strip()
    if referrer:
        report.add(
            f"headers.referrer-policy:{path}",
            f"Referrer-Policy on {path}",
            True,
            referrer + _note_weak_referrer(referrer),
            evidence,
        )
    else:
        report.add(
            f"headers.referrer-policy:{path}",
            f"Referrer-Policy on {path}",
            False,
            "Referrer-Policy absent; add `strict-origin-when-cross-origin` or `no-referrer`",
            evidence,
        )

    # 5. Permissions-Policy.
    permissions = (response.header("permissions-policy") or "").strip()
    permissions_detail = permissions or (
        "Permissions-Policy absent; disable unused features explicitly "
        "(camera=(), microphone=(), geolocation=(), ...)"
    )
    report.add(
        f"headers.permissions-policy:{path}",
        f"Permissions-Policy on {path}",
        bool(permissions),
        permissions_detail,
        evidence,
    )

    # 6. CSP. A report-only header does not enforce anything, so it does not
    #    count. The three directives checked here are the ones the scan named
    #    and the ones that bound framing, base-URI hijacking and plugin loads.
    required = ("frame-ancestors", "base-uri", "object-src")
    report_only = response.header("content-security-policy-report-only")
    if not csp_value:
        detail = "Content-Security-Policy absent"
        if report_only:
            detail += " (only a Content-Security-Policy-Report-Only header is set; report-only does not enforce)"
        detail += "; add `frame-ancestors 'none'; base-uri 'self'; object-src 'none'` at minimum"
        report.add(f"headers.csp:{path}", f"Content-Security-Policy on {path}", False, detail, evidence)
    else:
        missing = [directive for directive in required if directive not in directives]
        if missing:
            report.add(
                f"headers.csp:{path}",
                f"Content-Security-Policy on {path}",
                False,
                f"CSP is present but missing: {', '.join(missing)}",
                evidence,
            )
        else:
            report.add(
                f"headers.csp:{path}",
                f"Content-Security-Policy on {path}",
                True,
                "frame-ancestors, base-uri and object-src present",
                evidence,
            )


def check_https_redirect(report: Report, base: str, domain: str, timeout: float) -> None:
    """An HTTP request to the apex must answer 301 to the HTTPS origin."""
    netloc = urllib.parse.urlsplit(base).netloc
    url = f"http://{netloc}/"
    response = fetch(url, timeout=timeout, follow=False, limit=8192)
    evidence = {
        "url": url,
        "status": response.status,
        "location": response.header("location"),
        "error": response.error,
    }
    if response.error:
        report.add("redirect.https", "HTTP to HTTPS redirect", False, f"GET {url} failed: {response.error}", evidence)
        return
    if response.status != 301:
        report.add(
            "redirect.https",
            "HTTP to HTTPS redirect",
            False,
            f"expected 301 from {url}, got {response.status}",
            evidence,
        )
        return
    location = response.header("location") or ""
    if not location:
        report.add("redirect.https", "HTTP to HTTPS redirect", False, "301 response has no Location header", evidence)
        return
    target = urllib.parse.urlsplit(location)
    if target.scheme.lower() != "https":
        report.add(
            "redirect.https",
            "HTTP to HTTPS redirect",
            False,
            f"301 Location is not HTTPS: {location}",
            evidence,
        )
        return
    if (target.hostname or "").lower() != domain:
        report.add(
            "redirect.https",
            "HTTP to HTTPS redirect",
            False,
            f"301 Location changes hostname ({location}); expected https://{domain}/",
            evidence,
        )
        return
    report.add("redirect.https", "HTTP to HTTPS redirect", True, f"301 -> {location}", evidence)


# --------------------------------------------------------------------------- #
# Subpage discovery
# --------------------------------------------------------------------------- #


class _HrefParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:  # noqa: ANN001
        for key, value in attrs:
            if key == "href" and value:
                self.hrefs.append(value)


def _has_asset_extension(path: str) -> bool:
    last = path.rsplit("/", 1)[-1]
    if "." not in last:
        return False
    return ("." + last.rsplit(".", 1)[-1].lower()) in _ASSET_EXTENSIONS


def discover_links(html: str, base: str, domain: str, limit: int = 8) -> list[str]:
    parser = _HrefParser()
    try:
        parser.feed(html)
    except Exception:  # noqa: BLE001 - malformed HTML just yields fewer candidates
        pass
    found: list[str] = []
    seen: set[str] = set()
    for href in parser.hrefs:
        href = href.strip()
        if not href or href.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
            continue
        joined = urllib.parse.urljoin(base + "/", href)
        parts = urllib.parse.urlsplit(joined)
        if parts.scheme not in ("http", "https"):
            continue
        if (parts.hostname or "").lower() != domain:
            continue
        path = parts.path or "/"
        if path == "/" or path in seen:
            continue
        if any(path.startswith(prefix) for prefix in _SKIP_PREFIXES):
            continue
        if _has_asset_extension(path):
            continue
        seen.add(path)
        found.append(path)
        if len(found) >= limit:
            break
    return found


def pick_subpage(
    base: str,
    domain: str,
    timeout: float,
    override: str | None,
    homepage: HttpResponse | None,
) -> tuple[str | None, HttpResponse | None]:
    """Return (path, response) for one HTML subpage, or (None, None)."""
    if override:
        path = override if override.startswith("/") else "/" + override
        return path, fetch(base + path, timeout=timeout, limit=MAX_HTML_BYTES)

    candidates = list(_SUBPAGE_CANDIDATES)
    if homepage is not None and homepage.status == 200 and homepage.content_type().startswith("text/html"):
        for path in discover_links(homepage.text(), base, domain):
            if path not in candidates:
                candidates.append(path)

    tried: list[str] = []
    for path in candidates:
        path = path.split("#", 1)[0]
        if path in tried:
            continue
        tried.append(path)
        response = fetch(base + path, timeout=timeout, limit=MAX_HTML_BYTES)
        if response.status == 200 and response.content_type().startswith("text/html"):
            return path, response
    log(f"no HTML subpage found; tried {', '.join(tried)}")
    return None, None


# --------------------------------------------------------------------------- #
# Check: security.txt (RFC 9116)
# --------------------------------------------------------------------------- #


def parse_security_txt(text: str) -> dict[str, list[str]]:
    """Parse `Field: value` lines; field names are case-insensitive per RFC 9116."""
    fields: dict[str, list[str]] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, _, value = line.partition(":")
        fields.setdefault(key.strip().lower(), []).append(value.strip())
    return fields


def parse_iso8601(value: str) -> datetime | None:
    raw = value.strip()
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def check_security_txt(report: Report, base: str, timeout: float) -> None:
    results = []
    for path in SECURITY_TXT_PATHS:
        response = fetch(base + path, timeout=timeout)
        result = {
            "path": path,
            "status": response.status,
            "content_type": response.content_type(),
            "error": response.error,
            "fields": {},
        }
        if response.status == 200:
            result["fields"] = parse_security_txt(response.text())
        results.append(result)
        log(f"{path} -> {response.status if response.status is not None else response.error}")

    available = [result for result in results if result["status"] == 200]
    statuses = ", ".join(
        f"{result['path']}={result['status'] if result['status'] is not None else 'error'}"
        for result in results
    )
    report.add(
        "securitytxt.available",
        "security.txt published",
        bool(available),
        f"at least one path must return 200: {statuses}" if not available else statuses,
        {"results": results},
    )

    chosen = None
    for result in results:  # well-known first, as RFC 9116 prefers
        fields = result["fields"]
        if result["status"] == 200 and fields.get("contact") and fields.get("expires"):
            chosen = result
            break
    if chosen is None and available:
        chosen = available[0]

    if chosen is None:
        report.add(
            "securitytxt.fields",
            "security.txt has Contact and Expires",
            False,
            "not evaluated: no security.txt was served, so there is no policy to parse",
            {"results": results},
        )
        return

    fields = chosen["fields"]
    problems: list[str] = []
    contacts = fields.get("contact") or []
    expires_values = fields.get("expires") or []
    if not contacts:
        problems.append("missing Contact:")
    if not expires_values:
        problems.append("missing Expires:")
    else:
        expires_raw = expires_values[0]
        expires_at = parse_iso8601(expires_raw)
        now = datetime.now(timezone.utc)
        if expires_at is None:
            problems.append(f"Expires is not ISO 8601: {expires_raw!r}")
        elif expires_at <= now:
            problems.append(f"Expires is in the past: {expires_raw}")
        elif (expires_at - now).days < SECURITYTXT_MIN_REMAINING_DAYS:
            problems.append(
                f"Expires is only {(expires_at - now).days} day(s) away; renew the file "
                f"(minimum {SECURITYTXT_MIN_REMAINING_DAYS} days remaining)"
            )

    detail_parts = []
    detail_parts.append(f"{len(contacts)} Contact field(s)")
    if expires_values:
        detail_parts.append(f"Expires: {expires_values[0]}")
    detail = ", ".join(detail_parts) if not problems else "; ".join(problems)
    if not problems:
        remaining = (parse_iso8601(expires_values[0]) - datetime.now(timezone.utc)).days
        detail = f"{detail}, {remaining} day(s) remaining (via {chosen['path']})"
    expires_parsed = parse_iso8601(expires_values[0]) if expires_values else None
    report.add(
        "securitytxt.fields",
        "security.txt has Contact and Expires",
        not problems,
        detail,
        {
            "path": chosen["path"],
            "fields": fields,
            "http_status": chosen["status"],
            "expires_parsed": expires_parsed.isoformat() if expires_parsed else None,
        },
    )


# --------------------------------------------------------------------------- #
# Checks: DNS (SPF, DMARC)
# --------------------------------------------------------------------------- #


def _format_records(records: list[dict]) -> str:
    return "; ".join(f"{record['value']} (TTL {record['ttl']})" for record in records)


def check_spf(report: Report, domain: str, timeout: float) -> None:
    result = doh_txt(domain, timeout=timeout)
    evidence = {
        "name": domain,
        "status": result["status"],
        "error": result["error"],
        "records": result["records"],
    }
    name = "SPF record on apex"
    if result["error"]:
        report.add("dns.spf", name, False, f"DNS-over-HTTPS query for TXT {domain} failed: {result['error']}", evidence)
        return
    spf_records = [
        record
        for record in result["records"]
        if record["value"].strip().lower().startswith("v=spf1")
    ]
    evidence["spf_records"] = spf_records
    if not spf_records:
        others = [record["value"] for record in result["records"]]
        hint = f" (other TXT records present: {others})" if others else ""
        report.add(
            "dns.spf",
            name,
            False,
            f"no TXT record starting v=spf1 at {domain}{hint}; add `v=spf1 -all` if the domain sends no mail",
            evidence,
        )
        return
    if len(spf_records) > 1:
        report.add(
            "dns.spf",
            name,
            False,
            f"{len(spf_records)} SPF records at {domain}; publish exactly one: {_format_records(spf_records)}",
            evidence,
        )
        return
    record = spf_records[0]
    value = record["value"].strip()
    terminal = value.lower().endswith("-all") or value.lower().endswith("~all")
    report.add(
        "dns.spf",
        name,
        terminal,
        value + f" (TTL {record['ttl']})"
        if terminal
        else f"SPF record does not end in -all or ~all: {value!r} (TTL {record['ttl']})",
        evidence,
    )


def _parse_dmarc_tags(value: str) -> list[tuple[str, str]]:
    tags = []
    for part in value.split(";"):
        part = part.strip()
        if not part or "=" not in part:
            continue
        key, _, raw = part.partition("=")
        tags.append((key.strip().lower(), raw.strip().strip('"')))
    return tags


def check_dmarc(report: Report, domain: str, timeout: float) -> None:
    name = f"_dmarc.{domain}"
    result = doh_txt(name, timeout=timeout)
    evidence = {
        "name": name,
        "status": result["status"],
        "error": result["error"],
        "records": result["records"],
    }
    check_name = "DMARC record at _dmarc"
    if result["error"]:
        report.add("dns.dmarc", check_name, False, f"DNS-over-HTTPS query for TXT {name} failed: {result['error']}", evidence)
        return
    # Find records that claim to be DMARC even if the version tag is not first,
    # so a malformed record is reported as malformed rather than as missing.
    dmarc_records = [
        record for record in result["records"] if "v=dmarc1" in record["value"].lower()
    ]
    evidence["dmarc_records"] = dmarc_records
    if not dmarc_records:
        reason = "NXDOMAIN" if result["status"] == 3 else "no DMARC TXT record"
        report.add(
            "dns.dmarc",
            check_name,
            False,
            f"{reason} at {name}; add `v=DMARC1; p=reject` (see runbook for rua caveat)",
            evidence,
        )
        return
    if len(dmarc_records) > 1:
        report.add(
            "dns.dmarc",
            check_name,
            False,
            f"{len(dmarc_records)} DMARC records at {name}; publish exactly one: {_format_records(dmarc_records)}",
            evidence,
        )
        return
    record = dmarc_records[0]
    value = record["value"].strip()
    tags = _parse_dmarc_tags(value)
    evidence["tags"] = {key: val for key, val in tags}
    problems = []
    if not tags or tags[0][0] != "v" or tags[0][1].lower() != "dmarc1":
        problems.append("v=DMARC1 must be the first tag")
    policy = dict(tags).get("p")
    if not policy:
        problems.append("no p= tag")
    elif policy.lower() not in {"reject", "quarantine"}:
        problems.append(f"p={policy}; must be reject or quarantine")
    report.add(
        "dns.dmarc",
        check_name,
        not problems,
        "; ".join(problems) if problems else f"{value} (TTL {record['ttl']})",
        evidence,
    )


# --------------------------------------------------------------------------- #
# Check: robots.txt
# --------------------------------------------------------------------------- #


def parse_robots(text: str) -> tuple[list[tuple[str, str, str]], list[str]]:
    """Return ([(user-agent, directive, value)], [sitemap urls])."""
    rules: list[tuple[str, str, str]] = []
    sitemaps: list[str] = []
    agents: list[str] = []
    previous_was_agent = False
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            agents = []
            previous_was_agent = False
            continue
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip().lower()
        value = value.strip()
        if key == "user-agent":
            if not previous_was_agent:
                agents = []
            agents.append(value.lower())
            previous_was_agent = True
            continue
        previous_was_agent = False
        if key in ("disallow", "allow"):
            for agent in agents or ["*"]:
                rules.append((agent, key, value))
        elif key == "sitemap":
            sitemaps.append(value)
    return rules, sitemaps


def check_robots(report: Report, base: str, timeout: float) -> None:
    response = fetch(base + "/robots.txt", timeout=timeout)
    evidence = {
        "url": base + "/robots.txt",
        "status": response.status,
        "error": response.error,
        "content_type": response.content_type(),
    }
    if response.error:
        report.add("robots.fetch", "robots.txt served", False, f"GET failed: {response.error}", evidence)
        report.add("robots.access-control", "robots.txt not used for access control", False, "not evaluated: robots.txt could not be fetched", evidence)
        report.add("robots.sitemap", "robots.txt advertises a sitemap", False, "not evaluated: robots.txt could not be fetched", evidence)
        return
    if response.status != 200:
        report.add(
            "robots.fetch",
            "robots.txt served",
            False,
            f"expected HTTP 200 from /robots.txt, got {response.status}",
            evidence,
        )
        report.add("robots.access-control", "robots.txt not used for access control", False, "not evaluated: robots.txt is not served", evidence)
        report.add("robots.sitemap", "robots.txt advertises a sitemap", False, "not evaluated: robots.txt is not served", evidence)
        return

    text = response.text()
    rules, sitemaps = parse_robots(text)
    managed = "cloudflare managed content" in text.lower()
    evidence["rules"] = [{"user_agent": agent, "directive": directive, "value": value} for agent, directive, value in rules]
    evidence["sitemaps"] = sitemaps
    evidence["managed_by_cloudflare"] = managed
    fetch_detail = "HTTP 200, text/plain" if "text/plain" in response.content_type() else "HTTP 200"
    if managed:
        fetch_detail += "; contains a Cloudflare-managed block (rules below it are the origin's)"
    report.add("robots.fetch", "robots.txt served", True, fetch_detail, evidence)

    # Group Disallow paths by the crawler they apply to. Flattening the list
    # hides whether a path is blocked for everyone or only for one AI crawler,
    # and that difference is exactly what the next check is about.
    per_path: dict[str, set[str]] = {}
    for agent, directive, value in rules:
        if directive == "disallow" and value:
            per_path.setdefault(value, set()).add(agent)
    if not per_path:
        listing = "none"
    else:
        parts = []
        for disallowed in sorted(per_path):
            agents = sorted(per_path[disallowed])
            if agents == ["*"]:
                parts.append(f"{disallowed} (all crawlers)")
            else:
                shown = ", ".join(agents[:3])
                if len(agents) > 3:
                    shown += f", +{len(agents) - 3} more"
                parts.append(f"{disallowed} ({shown})")
        listing = "; ".join(parts)
    sensitive = [
        path for path in per_path if any(token in path.lower() for token in _SENSITIVE_TOKENS)
    ]
    if sensitive:
        report.add(
            "robots.access-control",
            "robots.txt not used for access control",
            False,
            f"Disallow names sensitive path(s) ({', '.join(sorted(sensitive))}). robots.txt is public and "
            "advisory; it does not authenticate anyone. Protect these with real authorization and use "
            "X-Robots-Tag: noindex if they must stay out of search. Disallow paths present: " + listing,
            evidence,
        )
    else:
        report.add(
            "robots.access-control",
            "robots.txt not used for access control",
            True,
            "no sensitive path is being 'protected' by Disallow; Disallow paths present: " + listing,
            evidence,
        )

    absolute_sitemaps = [
        url for url in sitemaps if url.lower().startswith(("http://", "https://"))
    ]
    if not sitemaps:
        report.add("robots.sitemap", "robots.txt advertises a sitemap", False, "no Sitemap: line", evidence)
    elif not absolute_sitemaps:
        report.add(
            "robots.sitemap",
            "robots.txt advertises a sitemap",
            False,
            f"Sitemap: value must be an absolute URL: {', '.join(sitemaps)}",
            evidence,
        )
    else:
        report.add(
            "robots.sitemap",
            "robots.txt advertises a sitemap",
            True,
            ", ".join(absolute_sitemaps),
            evidence,
        )


# --------------------------------------------------------------------------- #
# Orchestration and rendering
# --------------------------------------------------------------------------- #


def normalize_base(raw: str) -> str:
    raw = raw.strip()
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw):
        raw = "https://" + raw
    parts = urllib.parse.urlsplit(raw)
    if parts.scheme.lower() not in ("http", "https"):
        raise ValueError(f"unsupported scheme {parts.scheme!r}; use http or https")
    if not parts.hostname:
        raise ValueError(f"no hostname in {raw!r}")
    return urllib.parse.urlunsplit((parts.scheme.lower(), parts.netloc, "", "", "")).rstrip("/")


def validate_domain(domain: str) -> str:
    domain = domain.strip().lower().rstrip(".")
    if not re.fullmatch(r"[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+", domain):
        raise ValueError(f"not a plausible DNS name: {domain!r}")
    return domain


def run_checks(base: str, domain: str, args: argparse.Namespace) -> Report:
    report = Report()

    log(f"fetching homepage headers from {base}/")
    homepage = fetch(base + "/", timeout=args.timeout, limit=MAX_HTML_BYTES)
    add_header_checks(report, "homepage", "/", homepage)

    log("finding an HTML subpage to check")
    subpage_path, subpage_response = pick_subpage(
        base, domain, args.timeout, args.subpage, homepage
    )
    if subpage_path is None or subpage_response is None:
        report.add(
            "headers.subpage",
            "HTML subpage reachable",
            False,
            "could not fetch an HTML subpage; tried the fixed candidates and the homepage's links",
            {"candidates": list(_SUBPAGE_CANDIDATES), "override": args.subpage},
        )
    else:
        log(f"checking subpage {subpage_path}")
        add_header_checks(report, "subpage", subpage_path, subpage_response)

    log(f"checking http://{urllib.parse.urlsplit(base).netloc}/ redirect")
    check_https_redirect(report, base, domain, args.timeout)

    log("checking security.txt (RFC 9116)")
    check_security_txt(report, base, args.timeout)

    log(f"querying DNS-over-HTTPS at cloudflare-dns.com for {domain} TXT records")
    check_spf(report, domain, args.timeout)
    check_dmarc(report, domain, args.timeout)

    log("checking robots.txt")
    check_robots(report, base, args.timeout)

    return report


def _colorize(status: str) -> str:
    if status == "PASS":
        return f"\033[32m{status}\033[0m"
    return f"\033[31m{status}\033[0m"


def render_table(base: str, domain: str, report: Report, elapsed: float) -> None:
    use_color = sys.stdout.isatty()
    checked_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    print("Security verification")
    print(f"  target  : {base}")
    print(f"  domain  : {domain}")
    print(f"  checked : {checked_at}")
    print()

    name_width = min(max([len("CHECK")] + [len(check.name) for check in report.checks]), 46)
    detail_width = max(48, 118 - name_width)
    print(f"{'RESULT':<6}  {'CHECK':<{name_width}}  DETAIL")
    print(f"{'-' * 6}  {'-' * name_width}  {'-' * min(detail_width, 70)}")
    for check in report.checks:
        detail_lines = textwrap.wrap(check.detail, width=detail_width) or [""]
        status_cell = f"{check.status:<6}"
        if use_color:
            status_cell = _colorize(check.status) + " " * (6 - len(check.status))
        print(f"{status_cell}  {check.name:<{name_width}}  {detail_lines[0]}")
        for line in detail_lines[1:]:
            print(f"{' ' * 8}{' ' * name_width}  {line}")

    summary = report.summary()
    print()
    print(
        f"SUMMARY: {summary['total']} checks: {summary['passed']} passed, "
        f"{summary['failed']} failed  ({elapsed:.1f}s)"
    )
    if summary["failed"]:
        print(f"RESULT: FAIL ({summary['failed']} failing check(s); see docs/security/README.md)")
    else:
        print("RESULT: PASS (every check passed)")


def build_json(base: str, domain: str, report: Report, elapsed: float) -> dict:
    summary = report.summary()
    failed = len(report.failed)
    return {
        "tool": "verify-security",
        "version": "1.0",
        "target": base,
        "dns_domain": domain,
        "checked_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "duration_seconds": round(elapsed, 2),
        "checks": [
            {
                "id": check.id,
                "name": check.name,
                "status": check.status,
                "detail": check.detail,
                "evidence": check.evidence,
            }
            for check in report.checks
        ],
        "summary": summary,
        "result": "PASS" if failed == 0 else "FAIL",
        "exit_code": 0 if failed == 0 else 1,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="verify-security.py",
        description=(
            "Verify HSTS/XFO/nosniff/Referrer-Policy/Permissions-Policy/CSP headers, "
            "the HTTP->HTTPS redirect, RFC 9116 security.txt, SPF/DMARC DNS records, "
            "and robots.txt safety against a deployed site. Exit 0 only if all pass."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  python3 scripts/verify-security.py\n"
            "  python3 scripts/verify-security.py --json\n"
            "  python3 scripts/verify-security.py --url https://abc.portfolio.pages.dev "
            "--domain sushantpoudel2028.com.np\n"
        ),
    )
    parser.add_argument("--url", default=DEFAULT_URL, help=f"base URL to test (default: {DEFAULT_URL})")
    parser.add_argument(
        "--domain",
        default=None,
        help="DNS domain for SPF/DMARC (default: hostname of --url). Set this when --url is a preview deployment.",
    )
    parser.add_argument("--json", action="store_true", help="emit one JSON object on stdout instead of the table")
    parser.add_argument("--timeout", type=float, default=15.0, help="per-request timeout in seconds (default: 15)")
    parser.add_argument(
        "--subpage",
        default=None,
        help=(
            "HTML path to check in addition to / (default: first reachable of "
            "/writing, /press, /publications, then homepage links)"
        ),
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.timeout <= 0:
        parser.error("--timeout must be greater than zero")

    try:
        base = normalize_base(args.url)
    except ValueError as exc:
        print(f"error: invalid --url: {exc}", file=sys.stderr)
        return 2
    hostname = urllib.parse.urlsplit(base).hostname or ""
    try:
        domain = validate_domain(args.domain or hostname)
    except ValueError as exc:
        print(
            f"error: invalid DNS domain: {exc}\n"
            "hint: pass --domain <public name> when --url points at a preview or local host",
            file=sys.stderr,
        )
        return 2
    if args.domain and domain != hostname.lower():
        log(f"--domain set to {domain}; DNS checks will not use {hostname}")
    if urllib.parse.urlsplit(base).scheme != "https":
        log("warning: --url is not HTTPS; header checks describe that scheme, not production")

    started = time.monotonic()
    report = run_checks(base, domain, args)
    elapsed = time.monotonic() - started

    if not report.checks:
        print("error: no checks ran; this is not a pass", file=sys.stderr)
        return 2

    exit_code = 0 if not report.failed else 1
    if args.json:
        print(json.dumps(build_json(base, domain, report, elapsed), indent=2))
    else:
        render_table(base, domain, report, elapsed)
    log(f"done in {elapsed:.1f}s; exit {exit_code}")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
