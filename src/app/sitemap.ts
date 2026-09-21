import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/writing";
import { PAPERS } from "../../content/publications";

// Required under `output: export` — generated at build time from committed content.
export const dynamic = "force-static";

const BASE = "https://sushantpoudel2028.com.np";

/**
 * Without this the site had no sitemap and no robots.txt at all, so the search engines
 * that decide whether anyone finds the writing had nothing to follow. The posts were
 * published only as Markdown in a GitHub repository, where the URL belongs to GitHub
 * and the writing does not help this domain at all.
 *
 * Generated from the same source the pages are, so a new post cannot be published
 * without appearing here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();

  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE}/writing`,
      lastModified: posts[0]?.date ? new Date(`${posts[0].date}T00:00:00Z`) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE}/publications`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...PAPERS.map((p) => ({
      url: `${BASE}/publications/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: `${BASE}/writing/${p.slug}`,
      lastModified: p.date ? new Date(`${p.date}T00:00:00Z`) : new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
