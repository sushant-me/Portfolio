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
const MAX_MB = Math.round(MAX_BYTES / 1048576);

// Multipart framing (boundaries, part headers, the other form fields) is a few
// hundred bytes; 64 KiB is a generous allowance for the early Content-Length
// gate below without rejecting a legal 24 MB file.
const BODY_OVERHEAD_ALLOWANCE = 64 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // An authenticated, state-changing response must not be stored by a
      // browser or an intermediary.
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
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

  // Reject an obviously oversized body before request.formData() buffers it.
  // formData() parses the whole multipart body into memory first, so the exact
  // file.size check below only runs after Cloudflare has already accepted and
  // buffered everything up to the platform limit (100 MB on Workers). This is a
  // cheap first gate; the exact check still happens on the parsed File.
  const declared = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declared) && declared > MAX_BYTES + BODY_OVERHEAD_ALLOWANCE) {
    return json({ error: `file is larger than ${MAX_MB} MB` }, 413);
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
      { error: `file is larger than ${MAX_MB} MB` },
      413
    );
  }

  const name = safeName(file.name);
  // The browser-supplied type is stored and later echoed as the Content-Type of
  // /api/file/<key>, so it is attacker-controlled input. Accept only a bare
  // `type/subtype` token and lower-case it (the file route decides inline-vs-
  // download from it); anything else is stored as an opaque download. This is
  // not a type allowlist — legitimate PDFs, certificates, archives, images and
  // video all pass — it only keeps the stored value a safe header value.
  const declaredType = String(file.type || "").trim();
  const type = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(declaredType)
    ? declaredType.toLowerCase().slice(0, 120)
    : "application/octet-stream";
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
