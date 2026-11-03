import type { MetadataRoute } from "next";

// Required under `output: export` — the route is generated at build time and must say so.
export const dynamic = "force-static";

const BASE = "https://sushantpoudel2028.com.np";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing is disallowed here, deliberately.
        //
        // This file used to list /admin. That was the wrong half of the problem:
        // robots.txt is a request, not access control, so the line stopped no
        // crawler that ignored it — and it published the path of a private tool
        // to every crawler and every reader of the file. The HybridSec-QA scan of
        // 2026-11-03 flagged exactly that ("confirm it does not reveal sensitive
        // paths"). The admin tool is protected by the token its API requires, not
        // by being unlisted, and it is kept out of search results by an
        // `X-Robots-Tag: noindex` header on /admin* in public/_headers, which is
        // stronger than a Disallow: a disallowed URL can still be indexed from
        // links, a noindex'd one cannot.
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
