/**
 * GET /api/list
 *
 * Every uploaded file, newest first, read from the KV namespace's own key
 * listing (metadata comes back with it, so there is no separate index to keep
 * in sync).
 */

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export async function onRequestGet({ request, env }) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) {
    return json({ error: "ADMIN_TOKEN is not set on this project" }, 503);
  }
  const provided = request.headers.get("x-admin-token") || "";
  let diff = provided.length === expected.length ? 0 : 1;
  for (let i = 0; i < Math.min(provided.length, expected.length); i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return json({ error: "unauthorized" }, 401);

  const media = env.MEDIA;
  if (!media) {
    return json({ error: "No MEDIA KV namespace is bound to this project" }, 503);
  }

  const files = [];
  let cursor;
  do {
    const page = await media.list({ prefix: "uploads/", cursor });
    for (const k of page.keys) {
      const m = k.metadata || {};
      files.push({
        key: k.name,
        name: m.name || k.name.split("/").pop(),
        type: m.type || "application/octet-stream",
        size: m.size || 0,
        uploaded: m.uploaded || null,
        url: `/api/file/${encodeURIComponent(k.name)}`,
      });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  files.sort((a, b) => String(b.uploaded).localeCompare(String(a.uploaded)));
  return json({ ok: true, count: files.length, files });
}
