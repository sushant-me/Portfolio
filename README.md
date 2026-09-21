This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## How the site is put together

It is a statically exported Next.js app (`output: 'export'`) deployed to Cloudflare
Pages, which is Git-connected: pushing to `main` builds and deploys it.

### Scroll system

One rAF loop drives every scroll effect, in `src/components/ScrollProvider.tsx`.
The loop reads scroll state, runs every `measure` callback, then every `apply`
callback, then the plain listeners. That two-phase split is deliberate: six
independently animated elements that each read layout and then write style force
one browser layout *each* per frame, which measured 27 fps; batching all reads
before all writes measured 80+ fps.

Effects are driven by a unitless `--p` custom property (0 → 1) that
`useScrollProgress` writes per frame, so CSS does the animating and React never
re-renders on scroll. Progress modes: `view`, `enter`, `pin` (sticky wrapper),
and `pinExit` (pin plus the natural exit, so a full-viewport pinned element does
not fade out and leave an empty screen before it releases).

What is built on it:

- **Pinned hero** (`pinExit`) — the block drifts, shrinks and fades as the WebGL
  core swells toward the camera.
- **Horizontal project wall** (`pin`) — the wrapper is sized to viewport +
  overflow so one pixel of scroll equals one pixel of sideways travel.
- **Scrubbed skill bars**, an **experience timeline fill**, **gallery parallax**
  with per-column depth, masked heading reveals, a reading-progress bar and a
  section rail.
- `Scene3D.tsx` is a dynamically imported three.js backdrop (particle shell,
  wireframe core, orbit rings) that answers scroll, pointer and the active
  section's accent colour. It is a separate chunk that `index.html` never
  preloads, and it does not initialise at all under `prefers-reduced-motion`.

Sticky positioning note: `overflow-x: hidden` on an ancestor turns it into a
scroll container and silently breaks every `position: sticky` descendant. The
layout uses `overflow-x: clip` for that reason.

### Images

`public/images` holds full-resolution originals — five gallery photos are
16-20 MB each (~112 MB total). `scripts/optimize-images.py` generates
`public/images/optimized/*` (long edge ≤ 1600 px, JPEG q82, progressive, EXIF
rotation baked in) plus small avatar and favicon variants. The grids and the
avatar load the derivatives; the lightbox still opens the original. Regenerate
after adding a photo:

```bash
python3 scripts/optimize-images.py
```

Total cold page weight after optimisation: ~3.7 MB, most of it the lazily loaded
three.js chunk.

### Admin panel (media uploads)

`/admin` uploads images, documents and files. Uploads are stored in a Cloudflare
KV namespace and served back at `/api/file/<key>`, so anything uploaded can be
linked from anywhere on the site. The endpoints are Pages Functions in
`functions/api/`:

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/upload` | POST | `x-admin-token` | multipart form, field `file`, up to 24 MB |
| `/api/list` | GET | `x-admin-token` | every upload with its metadata |
| `/api/delete` | POST | `x-admin-token` | body `{ key }`, restricted to `uploads/` |
| `/api/file/<key>` | GET | public | serves the file with its stored content type |

**Run it locally** — this exercises the real Pages runtime with a simulated KV
namespace, so nothing touches your Cloudflare account:

```bash
npm run build
npx wrangler pages dev out --kv MEDIA --binding ADMIN_TOKEN=your-dev-key
# then open http://localhost:8788/admin
```

**Turn it on in production** (three steps, all in the Cloudflare dashboard):

1. **Workers & Pages → KV → Create namespace**, name it `portfolio-media`.
2. **Workers & Pages → the `portfolio` project → Settings → Functions → KV
   namespace bindings** → add binding `MEDIA` → select that namespace.
3. Same page → **Environment variables** → add `ADMIN_TOKEN`, marked encrypted.
4. Redeploy (any push, or *Retry deployment*).

Then open `/admin` on the live site, paste the token, and upload. Until `MEDIA`
and `ADMIN_TOKEN` are both configured the API answers `503` and the panel says
so in plain words — the public site is unaffected either way.

Note on storage: KV values cap at 25 MiB, which is why uploads are limited to
24 MB each. Cloudflare R2 would be the better home for large binaries, but it
requires a subscription on this account (verified: the R2 page redirects to a
plan signup), so KV is the free path that works today.


