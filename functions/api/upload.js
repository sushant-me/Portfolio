/**
 * POST /api/upload
 *
 * Stores one uploaded file in the MEDIA KV namespace and returns the URL to
 * reach it. Accepts any file type — images, PDFs, certificates, CVs, archives —
 * because the site's own content is a mix of exactly those.
 *
 * Auth is a shared token in the x-admin-token header, compared against the
 * ADMIN_TOKEN environment variable set on the Pages project. Without that
 * variable configured the endpoint refuses everything rather than defaulting
 * open.
 */

const PREFIX = "uploads/";
const MAX_BYTES = 24 * 1024 * 1024; // KV values cap at 25 MiB

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

function safeName(name) {
  const base = String(name || "file")
    .split(/[\\/]/)
    .pop()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-90);
  return base || "file";
}

export async function onRequestPost({ request, env }) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) {
    return json({ error: "ADMIN_TOKEN is not set on this project" }, 503);
  }
  const provided = request.headers.get("x-admin-token") || "";
  // Constant-time-ish compare: length check first, then XOR accumulate.
  if (provided.length !== expected.length) {
    return json({ error: "unauthorized" }, 401);
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return json({ error: "unauthorized" }, 401);
  }

  const media = env.MEDIA;
  if (!media) {
    return json(
      { error: "No MEDIA KV namespace is bound to this project" },
      503
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "expected multipart/form-data" }, 400);
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return json({ error: "no file field in the form" }, 400);
  }
  if (file.size === 0) return json({ error: "file is empty" }, 400);
  if (file.size > MAX_BYTES) {
    return json(
      { error: `file is larger than ${Math.round(MAX_BYTES / 1048576)} MB` },
      413
    );
  }

  const name = safeName(file.name);
  const type = file.type || "application/octet-stream";
  const key = `${PREFIX}${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${name}`;

  await media.put(key, await file.arrayBuffer(), {
    metadata: { name, type, size: file.size, uploaded: new Date().toISOString() },
  });

  return json({
    ok: true,
    key,
    name,
    type,
    size: file.size,
    url: `/api/file/${encodeURIComponent(key)}`,
  });
}
