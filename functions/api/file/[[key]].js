/**
 * GET /api/file/<key>
 *
 * Serves an uploaded file straight out of the MEDIA KV namespace with the
 * content type it was stored with, so an <img src> or a download link works
 * against the uploaded key. Public by design: these are the site's own assets.
 *
 * Caching is deliberately revalidate-always rather than a long max-age. A long
 * cache means a file deleted in the admin panel keeps being served — this zone
 * overrides origin max-age with its own Browser Cache TTL (4 hours at the time
 * of writing), so a "5 minute" header was not actually honoured. With
 * max-age=0 + ETag the browser still gets a cheap 304 on repeat views, but a
 * delete is effective immediately everywhere.
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
