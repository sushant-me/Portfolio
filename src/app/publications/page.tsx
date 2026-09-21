import type { Metadata } from "next";
import Link from "next/link";
import { PAPERS } from "../../../content/publications";
import "./publications.css";

const BASE = "https://sushantpoudel2028.com.np";

export const metadata: Metadata = {
  title: "Publications — Sushant Poudel",
  description:
    "Papers on AI agent security, LLM prompt-injection defences, edge verification, and satellite networking — with abstracts and full PDFs.",
  alternates: { canonical: `${BASE}/publications` },
  openGraph: {
    title: "Publications — Sushant Poudel",
    description:
      "Papers on AI agent security, LLM prompt-injection defences, edge verification, and satellite networking.",
    url: `${BASE}/publications`,
    type: "website",
  },
};

const STATUS_LABEL: Record<string, string> = {
  accepted: "accepted",
  presented: "presented",
  manuscript: "manuscript",
};

export default function PublicationsIndex() {
  return (
    <main className="pub">
      <div className="pub-wrap">
        <Link href="/" className="pub-back">
          ← sushantpoudel2028.com.np
        </Link>
        <h1>Publications</h1>
        <p className="sub">
          {PAPERS.length} papers on agent security, prompt-injection defence, edge verification and
          satellite networking. Each page carries its full abstract and a link to the PDF, and is
          marked up so that academic indexers can read the citation.
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
            </li>
          ))}
        </ul>

        <p className="footnote">
          Authors are listed in the order printed on each paper. Where a paper is co-authored, the
          byline says so. PDFs are the authors&rsquo; own copies hosted here so that each paper has a
          stable URL that can be cited.
        </p>
      </div>
    </main>
  );
}
