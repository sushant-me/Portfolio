import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import CrossNav from "@/components/CrossNav";
import SearchClient, { type SearchDoc } from "./SearchClient";
import { getPosts, formatDate } from "@/lib/writing";
import { PAPERS } from "../../../content/publications";
import {
  SITE,
  breadcrumbList,
  metaDescription,
  pageNode,
} from "@/lib/site";
import "../site-pages.css";

const BASE = SITE;
const TITLE = "Search — Sushant Poudel";
const DESCRIPTION = metaDescription(
  "Search every post and every paper on this site: AI agent security, MCP tool boundaries, verification and testing, memory safety, CTF write-ups.",
);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/search` },
  // Search-results pages are not useful as search results themselves: the same
  // content is already indexed at its own URL, and a results page indexed on its
  // query string is an infinite set of thin URLs. `follow` stays on so the links
  // in the results still pass crawling through.
  robots: { index: false, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/search`,
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Search sushantpoudel2028.com.np" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

/**
 * The index is built from the same two sources the site renders from — the synced
 * Markdown and the publications file — so a post cannot be published without being
 * searchable, and nothing has to be re-indexed by hand when one is added.
 */
export default function SearchPage() {
  const posts = getPosts();

  const docs: SearchDoc[] = [
    ...posts.map((post) => ({
      kind: "Writing" as const,
      title: post.title,
      href: `/writing/${post.slug}`,
      summary: post.summary,
      meta: `${formatDate(post.date)} · ${post.minutes} min read`,
    })),
    ...PAPERS.map((paper) => ({
      kind: "Paper" as const,
      title: paper.title,
      href: `/publications/${paper.slug}`,
      summary: paper.summary,
      meta: `${paper.venue} · ${paper.status}`,
    })),
  ];

  return (
    <main className="pg">
      <JsonLd
        data={pageNode({
          type: "SearchResultsPage",
          url: "/search",
          name: TITLE,
          description: DESCRIPTION,
        })}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Search", path: "/search" },
        ])}
      />
      <div className="pg-wrap">
        <Link href="/" className="pg-back">
          ← sushantpoudel2028.com.np
        </Link>
        <h1>Search</h1>
        <p className="lead">
          Every post and every paper on this site, filtered as you type. Nothing leaves the
          browser: the index is part of the page, so this works with no backend and records
          nothing about the query.
        </p>

        <SearchClient docs={docs} />

        <CrossNav current="/search" />
      </div>
    </main>
  );
}
