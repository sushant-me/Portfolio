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

// The abstract is the paper's own text, reproduced verbatim, so ambiguity or a contradiction with
// the artifacts is corrected here rather than by editing the paper's words on a web page. Each note
// exists because a reader checking the figures would otherwise reach a conclusion the data do not
// support — the same failure the reproducibility checker exists to catch, one level up.
const NUMBER_NOTES: Record<string, string[]> = {
  "agentic-verification": [
    "The 46.2% and 17.2% are rates over all 600 scenarios the evaluator was shown, not over the subset the policy blocks or escalates. Of those 600, the JSON-only arm approved 277 and free-form approved 103. Restricted to the 449 scenarios whose ground truth is block-or-escalate, the rates are 61.7% and 22.9%.",
    "The proposed schema is the most accurate arm, but it is not the safest on the abstract's headline measure. Free-form scored 17.2% unsafe accepts against the schema's 23.5%, and 64.5% decision accuracy against 66.3% — a 1.8-point gain whose confidence intervals overlap (free-form 60.6–68.2, schema 62.4–69.9). Where it does win is the irreversible class: 6 of 208 hard denials, against 11 for free-form and 71 for JSON-only.",
    "The repository holds 3,000 generations, not 1,800. The abstract describes the paper's three-condition comparison; the committed results also include a fourth condition, cot_av (600), and a 200-scenario replication of three conditions (600). The fourth condition reaches 96.0% rule attribution against the proposed arm's 86.5% and matches it on hard denials, which is why it is reported rather than dropped.",
    "One figure in the abstract is not checker-derived. Peak VRAM is a declared recorded constant rather than a value computed from the raw outputs, and the abstract states 3.95 GiB while the measurement file records 3,947 MiB (3.85 GiB). The repository flags the unit question as unresolved; it is recorded here rather than quietly reconciled.",
    "Status: accepted, camera-ready in progress. The paper's acceptance is not independently checkable from a public source — the reproducibility record for it verifies that a public repository exists, which is a different claim.",
  ],
  prebas: [
    "Status: accepted for the 2026 IEEE RTC in Chicago. The acceptance rests on the organiser's notification, which is available on request; the submission portal row is not a public URL, so it cannot be checked from this page.",
    "No artifact was released. The paper reports measurements but its code, data and raw outputs are not public, so nothing on it can be independently reproduced — which is what the Artifact label below means, not a judgement about the work.",
  ],
};

// The notes are corrections to how a page should be read, which is not always about numbers.
const NOTE_LABEL: Record<string, string> = {
  "agentic-verification": "How to read these numbers",
  prebas: "Before you cite this",
};

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

        {/* The abstract is the paper's own text and is reproduced verbatim, so where it is
            ambiguous or contradicts the artifacts, the correction goes here rather than in it.
            An editor who checks a number should be able to see how the number was measured. */}
        {NUMBER_NOTES[slug] && (
          <>
            <div className="abstract-label">{NOTE_LABEL[slug] ?? "How to read this page"}</div>
            <ul className="number-notes">
              {NUMBER_NOTES[slug].map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
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
