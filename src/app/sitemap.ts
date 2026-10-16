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
 *
 * `lastmod` is a claim about when the content changed, so it is only emitted where
 * a real date exists. It used to be `new Date()` — the build time — on the
 * homepage, the publications index, the press page and every paper page. That
 * meant every deploy, including one that only touched a header rule, told Google
 * that all ten publication URLs had just changed. Two builds of byte-identical
 * content produced different values, which is the definition of an unreliable
 * `lastmod`, and Google's documented response to that is to stop trusting it
 * rather than to recrawl. Omitting the field is the honest option and costs
 * nothing: it is optional in the sitemap spec.
 *
 * Posts carry a real publication date, so they keep one, and /writing inherits the
 * newest of them because that is what actually changes on that page.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  const newestPost = posts[0]?.date ? new Date(`${posts[0].date}T00:00:00Z`) : undefined;

  return [
    {
      url: BASE,
      // The homepage is reordered by new work rather than edited, so the newest
      // dated thing on it stands in for "last meaningfully changed".
      lastModified: newestPost,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE}/writing`,
      lastModified: newestPost,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE}/publications`,
      // No paper carries a date, so there is nothing truthful to put here.
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      // The page an editor or journalist should land on: bio, headshot, topics and checkable
      // work in one URL. Ranked above an individual paper because it is the entry point for
      // commissioning rather than a destination for readers.
      url: `${BASE}/press`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...PAPERS.map((p) => ({
      url: `${BASE}/publications/${p.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: `${BASE}/writing/${p.slug}`,
      lastModified: p.date ? new Date(`${p.date}T00:00:00Z`) : undefined,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
