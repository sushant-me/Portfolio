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
    "The 46.2% and 17.2% are rates over all 600 scenarios the evaluator was shown, not over the subset the policy blocks or escalates. Of those 600, the JSON-only arm approved 277 and free-form approved 103. Restricted to the 449 scenarios whose ground truth is block-or-escalate, the rates are 61.7% and 22.9%. The abstract above carries the same conflation and is reproduced here unaltered, because it is the paper's own text; the paper's body states the denominator correctly, and this is logged for the camera-ready rather than silently rewritten on a web page.",
    "The proposed schema is the most accurate arm, but it is not the safest on the abstract's headline measure. Free-form scored 17.2% unsafe accepts against the schema's 23.5%, and 64.5% decision accuracy against 66.3% — a 1.8-point gain whose confidence intervals overlap (free-form 60.6–68.2, schema 62.4–69.9). Where it does win is the irreversible class: 6 of 208 hard denials, against 11 for free-form and 71 for JSON-only.",
    "The repository holds 3,000 generations, not 1,800. The abstract describes the paper's three-condition comparison; the committed results also include a fourth condition, cot_av (600), and a 200-scenario replication of three conditions (600). The fourth condition reaches 96.0% rule attribution against the proposed arm's 86.5% and matches it on hard denials, which is why it is reported rather than dropped.",
    "One figure in the abstract is not checker-derived. Peak VRAM is a declared recorded constant rather than a value computed from the raw outputs, and the abstract states 3.95 GiB while the measurement file records 3,947 MiB (3.85 GiB). The repository flags the unit question as unresolved; it is recorded here rather than quietly reconciled.",
    "Status: accepted with revision at ICICSET 2026, hosted at NCIT. The acceptance arrived by email from the conference's submission system; it is not independently checkable from a public source, and the reproducibility record for this paper verifies only that a public repository exists, which is a different claim. It is not an IEEE paper — the IEEE acceptance in this record belongs to the PREBAS paper at RTC 2026.",
  ],
  prebas: [
    "Status: accepted for the 2026 IEEE RTC in Chicago. The acceptance rests on the organiser's notification, which is available on request; the submission portal row is not a public URL, so it cannot be checked from this page.",
    "Accepted is the claim this page supports — not published. The RTC research track is published in IEEE Xplore, but this paper appears in neither IEEE Xplore nor Crossref as of 28 September 2026. The conference was held 22–23 September 2026 and proceedings normally follow by weeks or months, and inclusion depended on author registration, which was not completed: the associated mailbox holds only registration reminders, with no registration or payment confirmation. Treat any description of this paper as already in IEEE Xplore as premature.",
    "No artifact was released. The paper reports measurements but its code, data and raw outputs are not public, so nothing on it can be independently reproduced — which is what the Artifact label below means, not a judgement about the work.",
  ],
};

// The notes are corrections to how a page should be read, which is not always about numbers.
const NOTE_LABEL: Record<string, string> = {
  "agentic-verification": "How to read these numbers",
  prebas: "Before you cite this",
  "leo-d2d": "Before you cite this",
  swayam: "Before you cite this",
};

// Status claims that are not checkable from a public source, recorded on the page rather than left
// for a reader to discover. Both of these carry a "presented" badge with nothing behind it in the
// claim ledger, which is exactly the kind of status this site says elsewhere it does not present
// as fact.
const STATUS_DISCLOSURES: Record<string, string[]> = {
  "leo-d2d": [
    "Status: presented at Space Con 2026. That status is the author's own claim — it has no public record and no entry in the claim ledger, so it cannot be checked from this page.",
    "The premise that more than 40 percent of Nepal's land sits above 3,000 metres carries no citation in the paper. It is stated here as the paper states it; it was not independently verified.",
  ],
  swayam: [
    "Status: presented at the Municipal AI Governance Conference 2026, Budhanilkantha Municipality. As with the other presented papers here, that status is the author's own claim and has no public record behind it.",
    "The Gatekeeper figures are a benchmark on the authors' own corpus, not a field deployment. The paper itself states that absolute invulnerability is not claimed.",
  ],
};

const ARTIFACT_TEXT: Record<string, string> = {
  "public-reproducible":
    "Public and reproducible. The code, the 600-scenario corpus and all 3,000 raw model generations are in the repository, and its own checker re-derives every number in the abstract from them — the corpus regenerating byte-for-byte and the metrics recomputing from the committed generations.",
  "not-released":
    "No artifact released. This paper reports measurements, but its code, corpus and raw outputs are not public, so the numbers above cannot be independently checked. Treat the results as unreproduced.",
  "not-empirical":
    "No experiment asserted. This is architecture, feasibility or position work, so there is no measurement to reproduce and no artifact owed.",
};

function bibtexKey(title: string, authors: string[]) {
  const first = (authors[0] ?? "anon").split(" ").pop()!.toLowerCase();
  const word = (title.match(/[A-Za-z]{4,}/g) ?? ["paper"]).find((w) => w.length > 3) ?? "paper";
  return `${first}${new Date().getFullYear()}${word.toLowerCase()}`;
}

// Two papers generated the same citation key, because both titles open with the same word and both
// credit the same first author. A duplicated key makes one of them uncitable and silently
// overwrites the other in any tool that imports both, so uniqueness is enforced here rather than
// left to chance. The base key is kept wherever it is already unique.
const BASE_KEYS = PAPERS.map((x) => bibtexKey(x.title, x.authors));
const KEY_COUNTS = BASE_KEYS.reduce<Record<string, number>>((acc, key) => {
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {});

function uniqueKey(paper: { slug: string; title: string; authors: string[] }) {
  const base = bibtexKey(paper.title, paper.authors);
  if ((KEY_COUNTS[base] ?? 0) < 2) return base;
  return `${base}${paper.slug.split("-").pop()!.replace(/[^a-z0-9]/gi, "")}`;
}

export default async function Paper({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PAPERS.find((x) => x.slug === slug);
  if (!p) notFound();

  const bib = `@misc{${uniqueKey(p)},
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
        {(p.affiliation ?? "Dept. of Computer Science and Engineering, Nepal Engineering College, Bhaktapur, Nepal") && (
          <div className="affil">
            {p.affiliation ?? "Dept. of Computer Science and Engineering, Nepal Engineering College, Bhaktapur, Nepal"}
          </div>
        )}
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
        {(NUMBER_NOTES[slug] || STATUS_DISCLOSURES[slug]) && (
          <>
            <div className="abstract-label">{NOTE_LABEL[slug] ?? "How to read this page"}</div>
            <ul className="number-notes">
              {[...(NUMBER_NOTES[slug] ?? []), ...(STATUS_DISCLOSURES[slug] ?? [])].map((note) => (
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
          Claims about his own work that the ledger covers are re-checked weekly against their
          public source by{" "}
          <a href="https://github.com/sushant-me/reputation">sushant-me/reputation</a> — 28 claims
          today, 21 checked live. Coverage is stated rather than implied: it does not yet extend to
          every manuscript listed here. The reproducibility note above is part of that record: where
          no artifact exists, the page says so instead of implying one.
        </p>
      </div>
    </main>
  );
}
