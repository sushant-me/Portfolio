import type { Metadata } from "next";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { CV_PDFS } from "@/lib/cv";
import JsonLd from "@/components/JsonLd";
import CrossNav from "@/components/CrossNav";
import {
  SITE,
  EMAIL,
  PERSON_ID,
  WEBSITE_ID,
  CV_UPDATED,
  breadcrumbList,
  metaDescription,
} from "@/lib/site";
import "../site-pages.css";

const BASE = SITE;
// Both spellings of the document name: "cv" and "resume" are searched with similar
// frequency, and the page is genuinely a CV and a résumé of the same record. The
// plain "resume" is in the title because that is the ASCII form people type;
// "résumé" appears in the description and the page, where the accents are correct.
const TITLE = "Sushant Poudel — CV and resume (PDF downloads)";
// One formatted date for the page and its cards; the ISO value is what goes into
// datetime/schema attributes, this is what a reader sees.
const CV_DATE = new Date(`${CV_UPDATED}T00:00:00Z`).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const DESCRIPTION = metaDescription(
  "Downloadable CVs and résumés for Sushant Poudel: general software/AI/security, AI-security focused, academic research. Three PDFs, updated 13 November 2026.",
);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/cv` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/cv`,
    type: "profile",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Sushant Poudel — CV" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

/**
 * A content-addressed URL for a file in `public/cv/`.
 *
 * The PDFs are replaced at the same path when the CV is re-rendered, and
 * `_headers` caches `/cv/*` for a week — which is correct for a file whose URL
 * includes its content but wrong for one whose URL does not. That is not theory: the
 * first replacement deploy left the old PDFs on the edge cache (`cf-cache-status:
 * HIT`, `age: 449`) while the repo had the corrected bytes.
 *
 * Hashing the file at build time and appending the digest gives every version its own
 * URL, so the page (and its structured data) can never point at a stale cached copy,
 * and a replacement needs no manual cache-buster bump.
 */
function versionedPdf(publicPath: string): string {
  const absolute = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  const digest = crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex");
  return `${publicPath}?v=${digest.slice(0, 12)}`;
}

/**
 * The three documents, with the reason each one exists.
 *
 * They are the same record rendered for three readers, not three different claims:
 * every one is generated from the CV sources and says the same facts about the
 * ICICSET paper, the go-github pull requests, the s2geometry issues and the
 * competition results. The difference is which parts are in front.
 */
const RAW_DOCUMENTS: {
  id: string;
  name: string;
  file: string;
  pages: number;
  reader: string;
  body: string;
}[] = [
  {
    id: "document-general",
    name: "Curriculum Vitae — general",
    file: CV_PDFS.general,
    pages: 4,
    reader: "Send for software, AI and security roles.",
    body:
      "The whole record in the order a general reader wants it: profile, core competencies, experience, projects, publications, security work and certifications. This is the one to attach to a normal engineering application.",
  },
  {
    id: "document-ai-security",
    name: "Curriculum Vitae — AI security",
    file: CV_PDFS.aiSecurity,
    pages: 3,
    reader: "Send for AI-security, agent-security and vulnerability-research roles.",
    body:
      "The security work is in front: the agent tool-boundary findings, prompt-injection and memory-safety work, the merged go-github patch, the four advisories on his own tools and the competition record. Shorter, because the reader already knows what the role is.",
  },
  {
    id: "document-research",
    name: "University / research CV",
    file: CV_PDFS.university,
    pages: 4,
    reader: "Send for academic programmes, research groups and scholarships.",
    body:
      "Research interests, publications with their publication status and DOIs, education, awards and the technical skills a research group asks about. Written for a committee rather than a hiring manager.",
  },
];

const DOCUMENTS = RAW_DOCUMENTS.map((doc) => ({ ...doc, href: versionedPdf(doc.file) }));

/**
 * One ProfilePage for this route, and a DigitalDocument per file.
 *
 * The Person is a reference to the site-wide node rather than a copy, for the same
 * reason as on every other page: one entity, many pages. Each PDF is a
 * DigitalDocument with its own `@id`, the file's URL, its format and the date it was
 * rendered, so a consumer can attach the claims in the document to the person who
 * published them.
 */
const PAGE_ID = `${BASE}/cv#webpage`;

const CV_SCHEMA: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": PAGE_ID,
      url: `${BASE}/cv`,
      name: TITLE,
      description: DESCRIPTION,
      dateModified: CV_UPDATED,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PERSON_ID },
      mainEntity: { "@id": PERSON_ID },
      hasPart: DOCUMENTS.map((doc) => ({ "@id": `${BASE}/cv#${doc.id}` })),
      inLanguage: "en",
    },
    ...DOCUMENTS.map((doc) => ({
      "@type": "DigitalDocument",
      "@id": `${BASE}/cv#${doc.id}`,
      name: doc.name,
      description: doc.reader,
      encodingFormat: "application/pdf",
      url: `${BASE}${doc.href}`,
      dateModified: CV_UPDATED,
      about: { "@id": PERSON_ID },
      isPartOf: { "@id": PAGE_ID },
      inLanguage: "en",
    })),
  ],
};

export default function CvPage() {
  return (
    <main className="pg">
      <JsonLd data={CV_SCHEMA} />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "CV", path: "/cv" },
        ])}
      />
      <div className="pg-wrap">
        <Link href="/" className="pg-back">
          ← sushantpoudel2028.com.np
        </Link>
        <h1>Curriculum vitae</h1>
        <p className="lead">
          The same record as a CV and as a résumé, in three documents. They differ in which part
          is in front, not in what they claim: a general CV for engineering roles, a shorter
          AI-security version, and a research CV for academic applications. All three are PDFs,
          updated <time dateTime={CV_UPDATED}>{CV_DATE}</time>.
        </p>
        <p className="meta">
          Updated {CV_DATE} · three PDFs · {EMAIL}
        </p>

        <ul className="cv-grid">
          {DOCUMENTS.map((doc) => (
            <li key={doc.id} className="cv-card">
              <h2>{doc.name}</h2>
              <div className="cv-sub">
                {doc.pages} pages · PDF · updated {CV_DATE}
              </div>
              <p className="cv-reader">{doc.reader}</p>
              <p>{doc.body}</p>
              <div className="cv-actions">
                <a className="pg-btn" href={doc.href} download>
                  Download PDF
                </a>
                <a className="cv-view" href={doc.href}>
                  View in the browser
                </a>
              </div>
            </li>
          ))}
        </ul>

        <h2>Why three versions</h2>
        <p>
          A single document forces every reader through the parts that are not for them. A
          recruiter for a backend role does not need the publication list first; a research
          committee does not need the full project history. The facts are identical and each
          document names its public sources where a claim has one — the merged go-github pull
          requests, the DOI for the ICICSET paper, the s2geometry issues and the competition
          standings.
        </p>
        <p className="pg-note">
          The public PDFs carry an email address and profile links, not a phone number. Email
          is the contact route: it is the same address on every commit and it is the one on the
          <Link href="/contact"> contact page</Link>. If you need a reference or a document
          that is not here, ask.
        </p>

        <h2>Before you download</h2>
        <p>
          Every claim that is checkable is linked from the <Link href="/about">about page</Link>{" "}
          and re-checked by the <a href="https://github.com/sushant-me/reputation">claim
          ledger</a>. If a document and this site ever disagree, the site is newer: the CVs are
          a snapshot, and the PDFs carry the date they were rendered.
        </p>

        <div className="pg-cta">
          <h2>Not what you need?</h2>
          <p>
            The <Link href="/hire">hire page</Link> explains what a security review or build
            engagement looks like, and <Link href="/contact">email</Link> reaches the same
            address as always.
          </p>
          <a className="pg-btn" href={`mailto:${EMAIL}?subject=CV`}>
            Email me
          </a>
        </div>

        <CrossNav current="/cv" />
      </div>
    </main>
  );
}
