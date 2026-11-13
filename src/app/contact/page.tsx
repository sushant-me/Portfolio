import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import CrossNav from "@/components/CrossNav";
import {
  SITE,
  EMAIL,
  breadcrumbList,
  metaDescription,
  pageNode,
} from "@/lib/site";
import "../site-pages.css";

const BASE = SITE;
const TITLE = "Contact Sushant Poudel — AI security engineer";
const DESCRIPTION = metaDescription(
  "Email Sushant Poudel about AI security reviews, MCP audits, hiring or research. Bhaktapur, Nepal (UTC+5:45). The same address is on every commit.",
);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/contact` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/contact`,
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Contact Sushant Poudel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

/**
 * Labels and destinations for the profile links.
 *
 * These are the same URLs as the site's `sameAs` list, but each is presented with
 * what the visitor would use it for — "where the code is" rather than "GitHub" —
 * because the person arriving at this page is usually deciding which channel
 * carries their question.
 */
const ELSEWHERE: { label: string; href: string; note: string }[] = [
  {
    label: "GitHub — sushant-me",
    href: "https://github.com/sushant-me",
    note: "The work itself: merged upstream patches, open reports, tool releases and their security advisories.",
  },
  {
    label: "LinkedIn — sushant-poudel2028",
    href: "https://www.linkedin.com/in/sushant-poudel2028/",
    note: "The conventional channel for recruiters; the work record there is shorter than the one on this site.",
  },
  {
    label: "ORCID — 0009-0008-7732-3269",
    href: "https://orcid.org/0009-0008-7732-3269",
    note: "The publication record, independent of this site; the ICICSET paper is listed there.",
  },
  {
    label: "Semantic Scholar — author 2507334053",
    href: "https://www.semanticscholar.org/author/2507334053",
    note: "Where the publications cluster as an author profile.",
  },
  {
    label: "X — nofear976",
    href: "https://x.com/nofear976",
    note: "Short notes; the long version of anything here is on the writing page.",
  },
  {
    label: "HackingHub — nofear976",
    href: "https://app.hackinghub.io/p/nofear976",
    note: "The leaderboard account behind the rank on the about page.",
  },
  {
    label: "reputation — the claim ledger",
    href: "https://github.com/sushant-me/reputation",
    note: "Where each checkable claim about my own work lives, with the source it is re-checked against.",
  },
];

export default function ContactPage() {
  return (
    <main className="pg">
      <JsonLd
        data={pageNode({
          type: "ContactPage",
          url: "/contact",
          name: TITLE,
          description: DESCRIPTION,
        })}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <div className="pg-wrap">
        <Link href="/" className="pg-back">
          ← sushantpoudel2028.com.np
        </Link>
        <h1>Contact</h1>
        <p className="lead">
          Email reaches me. It is the only inbox I check, it is the same address on every commit,
          and it is the fastest way to start anything on this site.
        </p>
        <p className="meta">Bhaktapur, Nepal · UTC+5:45 · one inbox, no ticket number</p>

        <div className="pg-cta">
          <h2>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </h2>
          <p>
            For work, put the system and the deadline in the first paragraph. For a security
            report, say whether you are the maintainer and whether there is a disclosure deadline.
            For anything else — a paper, a correction, a question about something I wrote — no
            structure needed.
          </p>
          <a className="pg-btn" href={`mailto:${EMAIL}`}>Write an email</a>
        </div>

        <h2>What to include</h2>
        <ul>
          <li>
            <strong>Hiring</strong> — the role, the team, and whether it is remote. A link to the
            posting is more useful than a description of it.
          </li>
          <li>
            <strong>A review or an audit</strong> — what the system is built with, what it can do
            on its own, and what you are worried about. The <Link href="/hire">hire page</Link>{" "}
            lists the service lines and how an engagement runs.
          </li>
          <li>
            <strong>A security report</strong> — the target, the version or commit, the
            reproduction, and the impact you believe it has. If it is going to a public tracker,
            send the tracker link instead of a copy.
          </li>
          <li>
            <strong>A correction</strong> — the page and the sentence. Anything on this site that
            is wrong should be fixed loudly rather than edited quietly; that is the whole point of
            the claim ledger.
          </li>
        </ul>

        <h2>Elsewhere</h2>
        <ul className="pg-proof">
          {ELSEWHERE.map((entry) => (
            <li key={entry.href}>
              <a href={entry.href}>{entry.label}</a>
              <span>{entry.note}</span>
            </li>
          ))}
        </ul>

        <h2>Press and speaking</h2>
        <p>
          Editors and organisers: the <Link href="/press">press page</Link> has a short bio, a
          longer one, the topics I can speak to, and a headshot in two sizes, all usable without
          asking. If you need something that is not there, email and say what it is for.
        </p>

        <h2>Why there is no contact form</h2>
        <p className="pg-note">
          A form needs a backend, a spam story and a database of other people&rsquo;s messages, and
          it would still end in the same inbox. This site is a static export on Cloudflare Pages:
          the address above is the whole contact system, and it has the useful property that it
          works when the site does not. GitHub, LinkedIn and the reputation ledger are the links
          this site also declares as <code>sameAs</code> in the person entity&rsquo;s metadata, so a
          search engine and a reader are being told the same thing; the rest are places the work
          can be checked, not identities to merge.
        </p>

        <CrossNav current="/contact" />
      </div>
    </main>
  );
}
