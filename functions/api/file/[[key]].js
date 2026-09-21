/**
 * GET /api/file/<key>
 *
 * Serves an uploaded file straight out of the MEDIA KV namespace with the
 * content type it was stored with, so an <img src> or a download link works
 * against the uploaded key. Public by design: these are the site's own assets.
 */

export async function onRequestGet({ params, env }) {
  const media = env.MEDIA;
  if (!media) {
    return new Response("No MEDIA KV namespace is bound to this project", {
      status: 503,
    });
  }

  const parts = Array.isArray(params.key) ? params.key : [params.key];
  const key = parts.map((p) => decodeURIComponent(String(p))).join("/");
  if (!key) return new Response("missing key", { status: 400 });

  const { value, metadata } = await media.getWithMetadata(key, {
    type: "arrayBuffer",
  });
  if (value === null) return new Response("not found", { status: 404 });

  const type = (metadata && metadata.type) || "application/octet-stream";
  const name = (metadata && metadata.name) || "download";
  const inline = /^(image|video|audio)\//.test(type) || type === "application/pdf";

  return new Response(value, {
    headers: {
      "content-type": type,
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${name.replace(/"/g, "")}"`,
      // Deliberately short. An immutable year-long cache means a file deleted
      // from the admin panel keeps being served from Cloudflare's edge — which
      // defeats deleting it. Five minutes still caches repeat views in a visit
      // and lets a delete take effect promptly. Purging on delete would need an
      // API token; this does not.
      "cache-control": "public, max-age=300",
      etag: `"${key.length}-${(metadata && metadata.size) || 0}"`,
    },
  });
}
