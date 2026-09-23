import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts, formatDate } from "@/lib/writing";
import "../writing.css";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found — Sushant Poudel" };
  const url = `https://sushantpoudel2028.com.np/writing/${post.slug}`;
  return {
    title: `${post.title} — Sushant Poudel`,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.summary,
      url,
      type: "article",
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.summary },
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="wr">
      <div className="wr-wrap post">
        <Link href="/writing" className="wr-back">
          ← All writing
        </Link>
        <h1>{post.title}</h1>
        <div className="wr-meta">
          {formatDate(post.date)} · {post.minutes} min read · {post.words.toLocaleString("en-GB")}{" "}
          words
        </div>

        {/* Rendered from Markdown at build time; the content is committed, not fetched. */}
        <article className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />

        {post.source && (
          <p className="post-source">
            The canonical copy of this post lives in the{" "}
            <a href="https://github.com/sushant-me/writeups">writeups repository</a> —{" "}
            <a href={post.source}>view the source of this one</a>. Every factual claim I make
            about my own work is re-checked weekly against its public source by{" "}
            <a href="https://github.com/sushant-me/reputation">reputation</a>.
          </p>
        )}
        {/* BlogPosting schema. The site-wide blocks describe the person; without
            this the posts themselves are not eligible for article rich results,
            which is the difference between a post being indexed and being found. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.title,
              description: post.summary,
              datePublished: post.date,
              dateModified: post.date,
              wordCount: post.words,
              inLanguage: "en",
              url: `https://sushantpoudel2028.com.np/writing/${post.slug}`,
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://sushantpoudel2028.com.np/writing/${post.slug}`,
              },
              author: {
                "@type": "Person",
                name: "Sushant Poudel",
                url: "https://sushantpoudel2028.com.np",
              },
              publisher: {
                "@type": "Person",
                name: "Sushant Poudel",
                url: "https://sushantpoudel2028.com.np",
              },
            }),
          }}
        />
      </div>
    </main>
  );
}
