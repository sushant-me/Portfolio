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
        // The media admin is a private tool, not a page. It carries no content and
        // needs no index entry; the API behind it is token-gated separately.
        disallow: ["/admin"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
