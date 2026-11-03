/**
 * POST /api/delete   { key }
 *
 * Removes one uploaded file. Same token gate as the upload endpoint.
 */

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

function authorized(request, env) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) return false;
  const provided = request.headers.get("x-admin-token") || "";
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_TOKEN) {
    return json({ error: "ADMIN_TOKEN is not set on this project" }, 503);
  }
  if (!authorized(request, env)) return json({ error: "unauthorized" }, 401);

  const media = env.MEDIA;
  if (!media) {
    return json({ error: "No MEDIA KV namespace is bound to this project" }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "expected a JSON body" }, 400);
  }

  const key = String(body && body.key ? body.key : "");
  // The key is an opaque KV key, not a filesystem path, so ".." and encoded
  // slashes cannot traverse anything. What is worth rejecting is anything that
  // is not a plausible upload key: an empty key deletes nothing, and a key over
  // KV's 512-byte limit makes the KV call throw (a 500) instead of answering.
  // The prefix check is the namespace boundary: this token may delete uploads,
  // never anything else that might share the namespace.
  if (!key || key.length > 512) {
    return json({ error: "a valid key is required" }, 400);
  }
  if (/[\u0000-\u001f\u007f]/.test(key)) {
    return json({ error: "invalid key" }, 400);
  }
  if (!key.startsWith("uploads/")) {
    return json({ error: "refusing to delete outside uploads/" }, 400);
  }

  await media.delete(key);
  return json({ ok: true, key });
}
