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
  if (!key.startsWith("uploads/")) {
    return json({ error: "refusing to delete outside uploads/" }, 400);
  }

  await media.delete(key);
  return json({ ok: true, key });
}
