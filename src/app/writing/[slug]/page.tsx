import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import CrossNav from "@/components/CrossNav";
import {
  getPost,
  getPosts,
  ogImageFor,
  formatDate,
  relatedPosts,
  sectionFor,
} from "@/lib/writing";
import {
  SITE,
  WEBSITE_ID,
  PERSON_ID,
  breadcrumbList,
  metaDescription,
  postTitle,
} from "@/lib/site";
import "../writing.css";

const BASE = SITE;

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
  const url = `${BASE}/writing/${post.slug}`;
  const title = postTitle(post.title);
  const description = metaDescription(post.summary);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      // Without this the child's openGraph *replaces* the layout's, so the image
      // the rest of the site advertises is dropped on every post page and links
      // to the writing render as bare text in Slack, LinkedIn and X.
      images: [{ url: ogImageFor(post.slug), alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageFor(post.slug)],
    },
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = `${BASE}/writing/${post.slug}`;
  const related = relatedPosts(getPosts(), post.slug);

  return (
    <main className="wr">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": `${url}#article`,
          headline: post.title,
          description: post.summary,
          image: [`${BASE}${ogImageFor(post.slug)}`],
          datePublished: post.date,
          dateModified: post.date,
          wordCount: post.words,
          inLanguage: "en",
          // The topic the post belongs to. Derived from the post's own words because
          // the synced frontmatter has no section field; an aggregator that groups by
          // section otherwise files all of this under nothing.
          articleSection: sectionFor(post),
          url,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          isPartOf: { "@id": WEBSITE_ID },
          // `@id` plus name + sameAs: the id makes this the same entity as the
          // Person node every page carries, and the explicit name keeps the author
          // readable for consumers that do not resolve cross-script references.
          author: {
            "@type": "Person",
            "@id": PERSON_ID,
            name: "Sushant Poudel",
            url: `${BASE}/`,
          },
          publisher: { "@id": PERSON_ID },
        }}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Writing", path: "/writing" },
          { name: post.title, path: `/writing/${post.slug}` },
        ])}
      />
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
            <a href={post.source}>view the source of this one</a>. Claims about my own work that
            the ledger covers are re-checked weekly against their public source by{" "}
            <a href="https://github.com/sushant-me/reputation">reputation</a> — 28 claims today, 20 checked live, and it does not yet extend to every page on this site.
          </p>
        )}

        {/* Every post used to end here, which made each one a dead end for a reader
            who arrived from a search result: the only onward links were inside the
            prose, and nothing pointed at the paper or at the fact that the author
            is available for work. */}
        <section className="post-related" aria-labelledby="related-heading">
          <h2 id="related-heading">Related writing</h2>
          <ul>
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/writing/${item.slug}`}>{item.title}</Link>
                <span className="wr-meta">
                  {formatDate(item.date)} · {sectionFor(item)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="post-next">
          More of this work sits in the <Link href="/publications">papers</Link> — the
          published versions with abstracts, PDFs and a note on what can be reproduced. If you
          are hiring, or you have an agent or MCP server that needs a security review,{" "}
          <Link href="/hire">here is what I do</Link> or{" "}
          <Link href="/contact">email me directly</Link>.
        </p>

        <CrossNav current="/writing" />
      </div>
    </main>
  );
}
