import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import CrossNav from "@/components/CrossNav";
import { PAPERS } from "../../../../content/publications";
import {
  SITE,
  WEBSITE_ID,
  PERSON_ID,
  authorNode,
  breadcrumbList,
  metaDescription,
} from "@/lib/site";
import "../publications.css";

const BASE = SITE;

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
  // The full title is the page's <h1>; the <title> is the short name plus the
  // byline, because the printed titles run 107–167 characters and a title tag that
  // long is truncated before it reaches the part that names the paper.
  const title = `${p.shortTitle} — paper by Sushant Poudel`;
  const description = metaDescription(p.summary);

  // A date is only a publication date once the work has appeared somewhere. An
  // acceptance that names the venue's dates is not a publication, and emitting
  // citation_publication_date for it tells a citation index the paper is out when
  // the page's own badge says accepted.
  const appearsInVenueRecord = p.status === "published" || p.status === "presented";

  const citation: Record<string, string | string[]> = {
    citation_title: p.title,
    // One meta tag per author, which is what the scheme expects.
    citation_author: p.authors,
    // A year on its own is not a date in the scheme, and the previous hardcoded
    // "2026" was wrong for the 2025 report.
    ...(p.date && appearsInVenueRecord ? { citation_publication_date: p.date } : {}),
    citation_pdf_url: pdf,
    citation_abstract_html_url: url,
    citation_language: "en",
    // Journal fields only where a public record names the container. Highwire
    // distinguishes a journal article from a conference paper through these, and
    // leaving them off a published paper is how it gets indexed as a preprint.
    ...(p.periodical
      ? {
          citation_journal_title: p.periodical.name,
          citation_issn: p.periodical.issn,
        }
      : {}),
    ...(p.pagination
      ? {
          citation_firstpage: p.pagination.split("-")[0],
          citation_lastpage: p.pagination.split("-")[1],
        }
      : {}),
  };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: p.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
    other: citation,
  };
}

// The abstract is the paper's own text, reproduced verbatim, so ambiguity or a contradiction with
// the artifacts is corrected here rather than by editing the paper's words on a web page. Each note
// exists because a reader checking the figures would otherwise reach a conclusion the data do not
// support — the same failure the reproducibility checker exists to catch, one level up.
const NUMBER_NOTES: Record<string, string[]> = {
  "agentic-verification": [
    "The 46.2% and 17.2% are rates over all 600 scenarios the evaluator was shown, not over the subset the policy blocks or escalates. Of those 600, the JSON-only arm approved 277 and free-form approved 103. Restricted to the 449 scenarios whose ground truth is block-or-escalate, the rates are 61.7% and 22.9%. The abstract above carries the same conflation and is reproduced here unaltered, because it is the paper's own text; the paper's body states the denominator correctly, and this is logged rather than silently rewritten on a web page; the paper's published text is the reference.",
    "The proposed schema is the most accurate arm, but it is not the safest on the abstract's headline measure. Free-form scored 17.2% unsafe accepts against the schema's 23.5%, and 64.5% decision accuracy against 66.3% — a 1.8-point gain whose confidence intervals overlap (free-form 60.6–68.2, schema 62.4–69.9). Where it does win is the irreversible class: 6 of 208 hard denials, against 11 for free-form and 71 for JSON-only.",
    "The repository holds 3,000 generations, not 1,800. The abstract describes the paper's three-condition comparison; the committed results also include a fourth condition, cot_av (600), and a 200-scenario replication of three conditions (600). The fourth condition reaches 96.0% rule attribution against the proposed arm's 86.5% and matches it on hard denials, which is why it is reported rather than dropped.",
    "One figure in the abstract is not checker-derived. Peak VRAM is a declared recorded constant rather than a value computed from the raw outputs, and the abstract states 3.95 GiB while the measurement file records 3,947 MiB (3.85 GiB). The repository flags the unit question as unresolved; it is recorded here rather than quietly reconciled.",
    "Status: published, not merely accepted. ICICSET 2026, Vol. 3, No. 1, pp. 228–235 (2026), ISSN 3102-0682 e / 3102-0674 print, published 2 October 2026; the DOI above resolves to the publisher's landing page and Crossref records the same date and page range. The publisher is Nepal College of Information Technology, not IEEE — the IEEE acceptance in this record belongs to the PREBAS paper at RTC 2026.",
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

  const url = `${BASE}/publications/${p.slug}`;
  // Same rule as the metadata: a date is only a publication date once the work has
  // appeared in a venue record, not when an acceptance names future dates.
  const appearsInVenueRecord = p.status === "published" || p.status === "presented";

  const bib = `@misc{${uniqueKey(p)},
  title  = {${p.title}},
  author = {${p.authors.join(" and ")}},
  year   = {${p.year}},
  note   = {${p.venue}},
  url    = {${BASE}${p.pdf}}${p.doi ? `,\n  doi    = {${p.doi}}` : ""}
}`;

  /**
   * ScholarlyArticle rather than Article: the work is a paper, and the type is what
   * an academic index uses to decide whether a page is a paper's landing page. The
   * author list is emitted in the order printed on the PDF, with this site's owner
   * pointing at the shared Person node so the page resolves to the same entity as
   * the rest of the site instead of a second "Sushant Poudel" string.
   *
   * `datePublished` appears only once the work has appeared somewhere: a published
   * paper's publication date or a presented paper's presentation date. An accepted
   * paper with the venue's future dates is not published yet, so it gets no
   * datePublished even though the page knows the dates; omitting it is better than
   * a date a citation index would read as "out now".
   */
  const articleSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": `${url}#article`,
    headline: p.title,
    name: p.title,
    description: p.summary,
    ...(p.abstract ? { abstract: p.abstract } : {}),
    author: p.authors.map((name) => authorNode(name)),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    // A published paper belongs to its journal or proceedings, not only to this
    // site: `isPartOf` names the container (with its ISSN) so the citation can be
    // resolved without this page, and still points at the WebSite it is published
    // on. Before publication it is only part of the site.
    isPartOf: p.periodical
      ? [
          {
            "@type": "Periodical",
            name: p.periodical.name,
            issn: p.periodical.issn,
          },
          { "@id": WEBSITE_ID },
        ]
      : { "@id": WEBSITE_ID },
    publisher: { "@id": PERSON_ID },
    isAccessibleForFree: true,
    inLanguage: "en",
    ...(p.pagination ? { pagination: p.pagination } : {}),
    ...(p.date && appearsInVenueRecord ? { datePublished: p.date } : {}),
    ...(p.doi
      ? {
          identifier: {
            "@type": "PropertyValue",
            propertyID: "DOI",
            value: p.doi,
          },
          sameAs: `https://doi.org/${p.doi}`,
        }
      : {}),
  };

  return (
    <main className="pub">
      <JsonLd data={articleSchema} />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Publications", path: "/publications" },
          { name: p.shortTitle, path: `/publications/${p.slug}` },
        ])}
      />
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
        {/* The date line says what actually happened, not just that a date exists:
            a paper that was presented was not published, and a paper accepted for a
            future venue has no appeared-on date at all. */}
        {(p.status === "published" || p.status === "presented") && p.date && (
          <div className="pub-doi">
            {p.status === "published" ? "Published" : "Presented"}{" "}
            {new Date(`${p.date}T00:00:00Z`).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
            {p.status === "published" && p.doi && (
              <>
                {" · DOI "}
                <a href={`https://doi.org/${p.doi}`}>{p.doi}</a>
              </>
            )}
          </div>
        )}

        {p.abstract ? (
          <>
            <div className="abstract-label">Abstract</div>
            <p className="abstract">{p.abstract}</p>
          </>
        ) : (
          <>
            <div className="abstract-label">Summary</div>
            <p className="abstract">{p.summary}</p>
            {/* This report is a technical reference rather than a conference paper,
                and it prints no abstract. Saying so is more useful than presenting a
                page-written summary as if it were the report's own words. */}
            <p className="artifact-note">
              This technical report prints no abstract. The summary above is drawn from the
              report&rsquo;s own contents, which the PDF below is the primary source for.
            </p>
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
          {p.doi && <a href={`https://doi.org/${p.doi}`}>Published version (DOI)</a>}
          {p.repo && <a href={p.repo}>Code, corpus and raw outputs</a>}
        </div>

        <div className="abstract-label">Reproducibility</div>
        <p className="artifact-note">{ARTIFACT_TEXT[p.artifact]}</p>

        <div className="abstract-label">Cite this</div>
        <pre className="bibtex">{bib}</pre>

        {/* The landing page for a paper is also where a reader decides whether to
            trust its author. Both links exist so that check is one click rather
            than a search. */}
        <p className="footnote">
          Sushant Poudel is an AI security engineer in Nepal; the{" "}
          <Link href="/about">about page</Link> has the longer record and the{" "}
          <Link href="/press">press page</Link> has the short bio and headshot. The other papers
          are on the <Link href="/publications">publications index</Link>.
        </p>

        <p className="footnote">
          Claims about his own work that the ledger covers are re-checked weekly against their
          public source by{" "}
          <a href="https://github.com/sushant-me/reputation">sushant-me/reputation</a> — 28 claims
          today, 20 checked live. Coverage is stated rather than implied: it does not yet extend to
          every manuscript listed here. The reproducibility note above is part of that record: where
          no artifact exists, the page says so instead of implying one.
        </p>

        <CrossNav current="/publications" />
      </div>
    </main>
  );
}
