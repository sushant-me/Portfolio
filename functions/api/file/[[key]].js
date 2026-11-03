/**
 * GET /api/file/<key>
 *
 * Serves an uploaded file straight out of the MEDIA KV namespace with the
 * content type it was stored with, so an <img src> or a download link works
 * against the uploaded key. Public by design: these are the site's own assets.
 *
 * The bytes here are attacker-influenced (anyone holding the admin token can
 * upload any bytes and declare any content type), and they are served from this
 * site's own origin, so a response without hardening is stored XSS. Three
 * headers close that off and are the reason this route looks paranoid:
 *
 *  - `x-content-type-options: nosniff` — the browser must not reconsider the
 *    stored type. Without it, an upload declared as octet-stream (or a type the
 *    browser does not recognise) can be sniffed into an HTML document.
 *  - `content-security-policy: sandbox; default-src 'none'` — every file is
 *    treated as an inert document. `sandbox` without `allow-scripts` means an
 *    inline SVG/XML upload cannot execute script on this origin, and
 *    `default-src 'none'` means it cannot load anything either. This is a
 *    response header on the file itself, so it is NOT inherited by pages that
 *    embed the file with <img> — image previews keep working.
 *  - `content-disposition: attachment` for every type that is not an image,
 *    video, audio or PDF — a document type must never be an inline navigation.
 *
 * A Content-Disposition of `inline` is kept for image/video/audio/PDF because
 * the site embeds uploaded images and links PDFs. The only one of those that can
 * carry script is SVG; it stays inline so `site.svg` images keep rendering, and
 * the CSP sandbox above neutralises the script instead. The documented
 * trade-off: if SVG uploads are ever only used as images, forcing `attachment`
 * for image/svg+xml is the stronger option.
 *
 * On caching, two measured facts rather than assumptions:
 *
 *  - This zone rewrites origin Cache-Control max-age to its own Browser Cache
 *    TTL (4 hours at the time of writing), so a max-age chosen here is not
 *    actually honoured. Setting one is therefore pointless.
 *  - That does NOT delay deletes: with a cache-busting query on the URL, a
 *    deleted file answered 404 within 10 seconds. The brief delay before that
 *    is KV's own eventual consistency, which no header can change.
 *
 * So the header here is simply revalidate-always with an ETag: repeat views get
 * a cheap 304 and nothing is ever served stale on purpose.
 */

const PREFIX = "uploads/";
const INLINE = /^(image|video|audio)\//;

// Applied to every response this route produces, including errors and 304s.
const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "content-security-policy": "sandbox; default-src 'none'",
};

function headers(extra) {
  return { ...SECURITY_HEADERS, ...extra };
}

function plain(body, status) {
  return new Response(body, {
    status,
    headers: headers({
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    }),
  });
}

/**
 * Makes a value safe to place inside a quoted header parameter. Metadata is
 * written by the upload route, which already strips separators, but a quote or
 * a newline in a header value is header injection (CWE-113) and this route
 * should not depend on every writer of the KV namespace remembering that.
 */
function safeName(name) {
  const cleaned = String(name || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/["\\]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .trim()
    .slice(0, 120);
  return cleaned || "download";
}

/**
 * A content type is echoed into a response header, so control characters would
 * make `new Response` throw (a 500) rather than be a response-splitting bug. Cap
 * it and fall back to the generic type if nothing usable is left.
 */
function safeType(type) {
  const cleaned = String(type || "")
    .replace(/[^\x20-\x7e]/g, "")
    .slice(0, 120);
  return cleaned || "application/octet-stream";
}

/** ETag derived from the key: an upload key is never reused for new bytes. */
function etagFor(key) {
  const tail = key.slice(-24).replace(/[^a-zA-Z0-9._-]/g, "");
  return `"${tail || "file"}"`;
}

export async function onRequestGet({ request, params, env }) {
  const media = env.MEDIA;
  if (!media) {
    return plain("No MEDIA KV namespace is bound to this project", 503);
  }

  let key;
  try {
    const parts = Array.isArray(params.key)
      ? params.key
      : params.key
        ? [params.key]
        : [];
    // A malformed percent-encoding used to escape as an uncaught URIError and
    // surface as a Cloudflare 1101 page (500). Bad input is a 400.
    key = parts.map((p) => decodeURIComponent(String(p))).join("/");
  } catch {
    return plain("malformed key", 400);
  }
  if (!key) return plain("missing key", 400);

  // Uploads are the only thing this namespace is for. Anything else that ever
  // lands in KV is not a public asset, so do not serve it.
  if (!key.startsWith(PREFIX)) return plain("not found", 404);

  const etag = etagFor(key);
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: headers({ etag, "cache-control": "no-cache" }),
    });
  }

  const { value, metadata } = await media.getWithMetadata(key, {
    type: "arrayBuffer",
  });
  if (value === null) {
    // Not cached either: a key can be re-uploaded under the same name.
    return plain("not found", 404);
  }

  const type = safeType(metadata && metadata.type);
  const name = safeName(metadata && metadata.name);
  const inline = INLINE.test(type) || type === "application/pdf";

  return new Response(value, {
    headers: headers({
      "content-type": type,
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
      "cache-control": "no-cache, must-revalidate",
      etag,
    }),
  });
}
