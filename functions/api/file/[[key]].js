/**
 * GET /api/file/<key>
 *
 * Serves an uploaded file straight out of the MEDIA KV namespace with the
 * content type it was stored with, so an <img src> or a download link works
 * against the uploaded key. Public by design: these are the site's own assets.
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

export async function onRequestGet({ request, params, env }) {
  const media = env.MEDIA;
  if (!media) {
    return new Response("No MEDIA KV namespace is bound to this project", {
      status: 503,
    });
  }

  const parts = Array.isArray(params.key) ? params.key : [params.key];
  const key = parts.map((p) => decodeURIComponent(String(p))).join("/");
  if (!key) return new Response("missing key", { status: 400 });

  const etag = `"${key.slice(-24)}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { etag, "cache-control": "no-cache" },
    });
  }

  const { value, metadata } = await media.getWithMetadata(key, {
    type: "arrayBuffer",
  });
  if (value === null) {
    // Not cached either: a key can be re-uploaded under the same name.
    return new Response("not found", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }

  const type = (metadata && metadata.type) || "application/octet-stream";
  const name = (metadata && metadata.name) || "download";
  const inline =
    /^(image|video|audio)\//.test(type) || type === "application/pdf";

  return new Response(value, {
    headers: {
      "content-type": type,
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${name.replace(/"/g, "")}"`,
      "cache-control": "no-cache, must-revalidate",
      etag,
    },
  });
}
