import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import CrossNav from "@/components/CrossNav";
import { PAPERS } from "../../../content/publications";
import {
  SITE,
  breadcrumbList,
  metaDescription,
  pageNode,
} from "@/lib/site";
import "./publications.css";

const BASE = SITE;

const TITLE = "Publications — AI security papers by Sushant Poudel";
const DESCRIPTION = metaDescription(
  "Papers on AI agent security, prompt-injection defences, edge verification and satellite networking — full abstracts, PDFs, and what can and cannot be reproduced.",
);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/publications` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/publications`,
    type: "website",
    // A child `openGraph` replaces the layout's rather than merging into it, so the
    // shared card has to be repeated here or this page unfurls with no image.
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Publications — Sushant Poudel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

const STATUS_LABEL: Record<string, string> = {
  accepted: "accepted",
  presented: "presented",
  manuscript: "manuscript",
};

/* What a reader can actually check, stated per paper. The alternative — showing a reproducible
   result and an unreproducible one the same way — is how a record gets oversold. */
const ARTIFACT_LABEL: Record<string, { short: string; title: string }> = {
  "public-reproducible": {
    short: "artifact: public",
    title: "Code, corpus and raw outputs are public, and the repository's own checker re-derives every reported number.",
  },
  "not-released": {
    short: "artifact: none released",
    title:
      "The paper reports measurements, but no code, corpus or raw output has been released, so the numbers cannot be independently checked.",
  },
  "not-empirical": {
    short: "no experiment asserted",
    title: "Architecture, feasibility or position work: no experimental result is claimed, so no artifact is owed.",
  },
};

export default function PublicationsIndex() {
  return (
    <main className="pub">
      {/* A collection of papers, with the list as its mainEntity. The ItemList is
          what tells a crawler these nine URLs are the same kind of thing, rather
          than nine unrelated pages that happen to link to each other. */}
      <JsonLd
        data={pageNode({
          type: "CollectionPage",
          url: "/publications",
          name: TITLE,
          description: DESCRIPTION,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: PAPERS.length,
            itemListElement: PAPERS.map((p, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${BASE}/publications/${p.slug}`,
              name: p.shortTitle,
            })),
          },
        })}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Publications", path: "/publications" },
        ])}
      />
      <div className="pub-wrap">
        <Link href="/" className="pub-back">
          ← sushantpoudel2028.com.np
        </Link>
        <h1>Publications</h1>
        <p className="sub">
          {PAPERS.length} papers on agent security, prompt-injection defence, edge verification and
          satellite networking. Each page carries its full abstract and a link to the PDF, is
          marked up so that academic indexers can read the citation, and states whether the work
          is independently checkable.
        </p>

        <ul className="pub-list">
          {PAPERS.map((p) => (
            <li key={p.slug}>
              <Link href={`/publications/${p.slug}`} className="title">
                {p.title}
              </Link>
              <div className="pub-authors">{p.authors.join(" · ")}</div>
              <div className="pub-venue">
                <span className={`tag ${p.status}`}>{STATUS_LABEL[p.status]}</span>
                {p.venue}
              </div>
              <div className="pub-artifact" title={ARTIFACT_LABEL[p.artifact].title}>
                {ARTIFACT_LABEL[p.artifact].short}
              </div>
            </li>
          ))}
        </ul>

        <p className="footnote">
          Authors are listed in the order printed on each paper. Where a paper is co-authored, the
          byline says so. PDFs are the authors&rsquo; own copies hosted here so that each paper has a
          stable URL that can be cited. &ldquo;Artifact&rdquo; says what you can check for yourself:
          one paper ships its code, corpus and raw model outputs and re-derives its own numbers in
          CI. Of the others, several report measurements with no released artifact and several assert
          no experiment at all &mdash; architecture and feasibility work &mdash; and each page says
          which it is rather than presenting either as reproducible.
        </p>
        <p className="footnote">
          Acceptance status is the author&rsquo;s own claim and is not independently checkable from a
          public source. Where it rests on a notification rather than a public record, the paper&rsquo;s
          page says so. The <Link href="/about">about page</Link> has the author&rsquo;s record and
          the <Link href="/press">press page</Link> the short bio for commissioning.
        </p>

        <CrossNav current="/publications" />
      </div>
    </main>
  );
}
