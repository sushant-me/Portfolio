import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PAPERS } from "../../../../content/publications";
import "../publications.css";

const BASE = "https://sushantpoudel2028.com.np";

export function generateStaticParams() {
  return PAPERS.map((p) => ({ slug: p.slug }));
}

/**
 * Highwire Press metadata, which is the tag scheme Google Scholar documents for
 * indexing a paper from its landing page. The requirements this page is built to
 * meet, from the Scholar-facing guidance:
 *
 *   - the title in the largest element on the page (here an <h1>);
 *   - author names in a smaller size directly beneath it;
 *   - the abstract as searchable text rather than an image;
 *   - a citation_pdf_url whose PDF is under 5 MB and does not use Type 3 fonts.
 *
 * That last one is not theoretical: an earlier candidate PDF for one of these
 * papers carried Type 3 fonts, which break text extraction, and linking it here
 * would have made the paper silently unindexable.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = PAPERS.find((x) => x.slug === slug);
  if (!p) return { title: "Not found — Sushant Poudel" };

  const url = `${BASE}/publications/${p.slug}`;
  const pdf = `${BASE}${p.pdf}`;

  /* eslint-disable @typescript-eslint/naming-convention */
  const citation: Record<string, string | string[]> = {
    citation_title: p.title,
    // One meta tag per author, which is what the scheme expects.
    citation_author: p.authors,
    citation_publication_date: "2026",
    citation_pdf_url: pdf,
    citation_abstract_html_url: url,
    citation_language: "en",
    citation_technical_report_institution: "Nepal Engineering College",
  };
  /* eslint-enable @typescript-eslint/naming-convention */

  return {
    title: `${p.title} — Sushant Poudel`,
    description: p.abstract.slice(0, 300),
    alternates: { canonical: url },
    openGraph: {
      title: p.title,
      description: p.abstract.slice(0, 200),
      url,
      type: "article",
    },
    twitter: { card: "summary_large_image", title: p.title },
    other: citation,
  };
}

const ARTIFACT_TEXT: Record<string, string> = {
  "public-reproducible":
    "Public and reproducible. The code, the 600-scenario corpus and all 3,000 raw model generations are in the repository, and its own checker re-derives every number in the abstract from them — the corpus regenerating byte-for-byte and the metrics recomputing from the committed generations.",
  "not-released":
    "No artifact released. This paper reports measurements, but its code, corpus and raw outputs are not public, so the numbers above cannot be independently checked. Written as a manuscript; treat the results as unreproduced.",
  "not-empirical":
    "No experiment asserted. This is architecture, feasibility or position work, so there is no measurement to reproduce and no artifact owed.",
};

function bibtexKey(title: string, authors: string[]) {
  const first = (authors[0] ?? "anon").split(" ").pop()!.toLowerCase();
  const word = (title.match(/[A-Za-z]{4,}/g) ?? ["paper"]).find((w) => w.length > 3) ?? "paper";
  return `${first}${new Date().getFullYear()}${word.toLowerCase()}`;
}

export default async function Paper({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PAPERS.find((x) => x.slug === slug);
  if (!p) notFound();

  const bib = `@misc{${bibtexKey(p.title, p.authors)},
  title  = {${p.title}},
  author = {${p.authors.join(" and ")}},
  year   = {2026},
  note   = {${p.venue}},
  url    = {${BASE}${p.pdf}}
}`;

  return (
    <main className="pub">
      <div className="pub-wrap paper">
        <Link href="/publications" className="pub-back">
          ← All publications
        </Link>

        {/* Title first and largest, authors directly beneath — the layout Scholar's
            crawler uses to identify a paper's title and byline. */}
        <h1>{p.title}</h1>
        <div className="pub-authors">{p.authors.join(" · ")}</div>
        <div className="affil">
          Dept. of Computer Science and Engineering, Nepal Engineering College, Bhaktapur, Nepal
        </div>
        <div className="pub-venue">
          <span className={`tag ${p.status}`}>{p.status}</span>
          {p.venue}
        </div>

        {p.abstract && (
          <>
            <div className="abstract-label">Abstract</div>
            <p className="abstract">{p.abstract}</p>
          </>
        )}

        <div className="pub-actions">
          <a href={p.pdf}>Read the PDF</a>
          <a href={p.pdf} download>
            Download
          </a>
          {p.repo && <a href={p.repo}>Code, corpus and raw outputs</a>}
        </div>

        <div className="abstract-label">Reproducibility</div>
        <p className="artifact-note">{ARTIFACT_TEXT[p.artifact]}</p>

        <div className="abstract-label">Cite this</div>
        <pre className="bibtex">{bib}</pre>

        <p className="footnote">
          Every factual claim Sushant makes about his own work is re-checked weekly against its
          public source by{" "}
          <a href="https://github.com/sushant-me/reputation">sushant-me/reputation</a>. The
          reproducibility note above is part of that record: where no artifact exists, the page
          says so instead of implying one.
        </p>
      </div>
    </main>
  );
}
