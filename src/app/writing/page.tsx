import type { Metadata } from "next";
import Link from "next/link";
import { getPosts, formatDate } from "@/lib/writing";
import "./writing.css";

export const metadata: Metadata = {
  title: "Writing — Sushant Poudel",
  description:
    "Technical write-ups on AI agent security: tool-boundary bugs, MCP tool poisoning, evaluation, and the negative results.",
  alternates: { canonical: "https://sushantpoudel2028.com.np/writing" },
  openGraph: {
    title: "Writing — Sushant Poudel",
    description:
      "Technical write-ups on AI agent security: tool-boundary bugs, MCP tool poisoning, evaluation, and the negative results.",
    url: "https://sushantpoudel2028.com.np/writing",
    type: "website",
  },
};

export default function WritingIndex() {
  const posts = getPosts();

  return (
    <main className="wr">
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
      </div>
    </main>
  );
}
