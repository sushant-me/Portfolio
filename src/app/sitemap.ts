import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/writing";
import { CV_UPDATED, HOME_UPDATED } from "@/lib/site";
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
 *
 * Not listed: /search. It is marked `noindex` (its content already exists at the
 * URLs it returns), and a sitemap entry for a page that asks not to be indexed is a
 * contradiction. /admin is absent for the same reason it always was — it is a
 * private tool with a `noindex` header, not a page anyone should land on.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  const newestPost = posts[0]?.date ? new Date(`${posts[0].date}T00:00:00Z`) : undefined;

  return [
    {
      url: BASE,
      // The homepage's own copy now carries a hand-set revision date (HOME_UPDATED,
      // in src/lib/site.ts); it is more accurate than the newest post, which changes
      // without the page's copy changing.
      lastModified: new Date(`${HOME_UPDATED}T00:00:00Z`),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      // The page a hiring manager or a client needs: services, process and a
      // contact route. Ranked alongside the homepage now that conversion, not just
      // discovery, is the job.
      url: `${BASE}/hire`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      // The E-E-A-T page: identity, education, awards and the checkable record.
      url: `${BASE}/about`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/contact`,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      // A document a recruiter can take away, which is the point of the page. The
      // date is the one stamped on the PDFs themselves.
      url: `${BASE}/cv`,
      lastModified: new Date(`${CV_UPDATED}T00:00:00Z`),
      changeFrequency: "yearly",
      priority: 0.8,
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
      // work in one URL.
      url: `${BASE}/press`,
      changeFrequency: "monthly",
      priority: 0.8,
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
