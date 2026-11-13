import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import CrossNav from "@/components/CrossNav";
import { getPosts, formatDate } from "@/lib/writing";
import {
  SITE,
  PERSON_ID,
  breadcrumbList,
  metaDescription,
  pageNode,
} from "@/lib/site";
import "./writing.css";

const BASE = SITE;
const TITLE = "Writing on AI agent security — Sushant Poudel";
const DESCRIPTION = metaDescription(
  "Technical write-ups on AI agent security: tool-boundary bugs, MCP tool poisoning, evaluation, and the results that went against what the author expected.",
);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/writing` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/writing`,
    type: "website",
    // Restated because a child `openGraph` replaces the layout's, image included.
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Writing — Sushant Poudel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function WritingIndex() {
  const posts = getPosts();

  return (
    <main className="wr">
      {/* Each post is a BlogPosting node in the list, not just a link. That is what
          lets an index page say "these articles exist, with these dates and this
          author" without a crawler having to fetch every one first. */}
      <JsonLd
        data={pageNode({
          type: "CollectionPage",
          url: "/writing",
          name: TITLE,
          description: DESCRIPTION,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: posts.length,
            itemListElement: posts.map((post, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "BlogPosting",
                headline: post.title,
                url: `${BASE}/writing/${post.slug}`,
                datePublished: post.date,
                author: { "@id": PERSON_ID },
              },
            })),
          },
        })}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Writing", path: "/writing" },
        ])}
      />
      <div className="wr-wrap">
        <Link href="/" className="wr-back">
          ← sushantpoudel2028.com.np
        </Link>
        <h1>Writing</h1>
        <p className="sub">
          Notes from finding and fixing tool-boundary bugs in AI agents — including the
          results that went against what I expected. Each post links to the code and the raw
          output it describes.
        </p>

        {posts.length === 0 ? (
          <p className="sub">No posts yet.</p>
        ) : (
          <ul className="wr-list">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/writing/${p.slug}`} className="title">
                  {p.title}
                </Link>
                <div className="wr-meta">
                  {formatDate(p.date)} · {p.minutes} min read
                </div>
                {p.summary && <p>{p.summary}</p>}
              </li>
            ))}
          </ul>
        )}

        <p className="footnote">
          The canonical copy of each post is in the{" "}
          <a href="https://github.com/sushant-me/writeups">writeups repository</a>. If you are
          reading this because you are hiring or need a review,{" "}
          <Link href="/hire">what I do and how to start</Link> is one page; the{" "}
          <Link href="/publications">papers</Link> are the longer-form versions of the same work.
        </p>

        <CrossNav current="/writing" />
      </div>
    </main>
  );
}
