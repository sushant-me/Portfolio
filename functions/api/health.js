/**
 * GET /api/health
 *
 * Reports which pieces of the admin panel are wired up, without revealing any
 * secret. Useful from the browser: if this says both flags are true and uploads
 * still fail, the problem is the key value, not the configuration.
 */

const json = (body) =>
  new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export async function onRequestGet({ env }) {
  return json({
    ok: true,
    // The KV namespace that stores uploads.
    media: Boolean(env.MEDIA),
    // The shared admin key. Its value is never returned, only whether it exists.
    adminToken: Boolean(env.ADMIN_TOKEN),
    // True when running on Cloudflare Pages rather than a local dev server.
    onPages: Boolean(env.CF_PAGES),
    limits: { maxBytes: 24 * 1024 * 1024 },
  });
}
