import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import CrossNav from "@/components/CrossNav";
import {
  SITE,
  EMAIL,
  PERSON_ID,
  breadcrumbList,
  metaDescription,
  pageNode,
} from "@/lib/site";
import "../site-pages.css";

const BASE = SITE;
const TITLE = "About Sushant Poudel — AI security engineer in Nepal";
const DESCRIPTION = metaDescription(
  "Sushant Poudel is an AI security engineer in Bhaktapur, Nepal: computer-engineering student, two years building production AI systems, and published work on agent security.",
);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/about` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/about`,
    type: "profile",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Sushant Poudel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

/**
 * The awards this page can support.
 *
 * Two of them (Hult Prize, Aspire Leaders) rest on organiser documents rather than
 * public URLs, and the site says so instead of linking something that would not prove
 * it. Null Origin's Grand Finale certificate verifies as "Finalist · rank #2" but has
 * no public scoreboard URL to link; HackingHub is the only one with a live public page
 * behind it, which is why it is the only one with a link. The placement language is
 * "finalist, 2nd of 8", not "won" — the official standings put team roamers second.
 */
const AWARDS: { name: string; detail: string; href?: string }[] = [
  {
    name: "Null Origin CTF 2026 — Grand Finale finalist, 2nd of 8 teams",
    detail:
      "With team roamers: 16,850 points and 40 of 42 challenges in the final, behind Jokers on 17,600. Certificate NO-2026-GF-229CF4 verifies as rank #2; the qualifier write-up is on this site.",
    href: "/writing/null-origin-ctf-qualifier",
  },
  {
    name: "HackingHub — rank 7 on the all-time global leaderboard",
    detail:
      "210 flags, 21,785 XP, 1 gold / 4 silver / 3 bronze (November 2026). The leaderboard is public and the profile links back to this site.",
    href: "https://app.hackinghub.io/p/nofear976",
  },
  {
    name: "Aspire Leaders Program — Global Finalist (2025)",
    detail:
      "Selected as one of roughly 10,000 finalists from more than 54,000 applicants, completing leadership training co-created by Harvard Business School faculty. The placement rests on the programme's notification.",
  },
  {
    name: "Hult Prize — 1st Runner-Up (2024 and 2025)",
    detail:
      "Recognised in consecutive years for social-entrepreneurship business models addressing global challenges. Organiser documents rather than a public record.",
  },
  {
    name: "Bagmati Province Hackathon 2026 — Runner-Up",
    detail: "Recorded on the certificate in the gallery on the homepage.",
  },
  {
    name: "NEC IT Club — Joint Secretary (2024–2025)",
    detail:
      "Logistics, executive administration and student engagement for department-level technical events and hackathons at Nepal Engineering College.",
  },
];

/** Certificates whose PDF is hosted on this site, so the claim is one click from its evidence. */
const CERTIFICATES: { name: string; issuer: string; file: string }[] = [
  { name: "IBM AI Engineering Professional Certificate", issuer: "IBM", file: "/images/IBM.pdf" },
  {
    name: "Google Cybersecurity Professional Certificate",
    issuer: "Google",
    file: "/images/ethical hacking.pdf",
  },
  {
    name: "Google UX Design Professional Certificate",
    issuer: "Google",
    file: "/images/UIUX.pdf",
  },
  { name: "Deep Learning Specialization", issuer: "DeepLearning.AI", file: "/images/Deep learning.pdf" },
  {
    name: "Machine Learning Specialization",
    issuer: "Stanford & DeepLearning.AI",
    file: "/images/machine learning.pdf",
  },
  { name: "Cloud Computing Professional Certificate", issuer: "IBM", file: "/images/cloud computing.pdf" },
  { name: "Flutter & Dart — Complete App Development", issuer: "Packt", file: "/images/Flutter.pdf" },
];

export default function AboutPage() {
  return (
    <main className="pg">
      <JsonLd
        data={pageNode({
          type: "AboutPage",
          url: "/about",
          name: TITLE,
          description: DESCRIPTION,
          mainEntity: { "@id": PERSON_ID },
        })}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <div className="pg-wrap">
        <Link href="/" className="pg-back">
          ← sushantpoudel2028.com.np
        </Link>
        <h1>About Sushant Poudel</h1>
        <p className="lead">
          I am an AI security engineer in Bhaktapur, Nepal. I work on the boundary where a
          language model&rsquo;s output becomes an action, and I build the systems I test: agents,
          tool-calling pipelines, and the checks that are supposed to stop them doing something
          nobody approved.
        </p>
        <p className="meta">Bhaktapur, Nepal · UTC+5:45 · <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>

        <h2>The short version</h2>
        <p>
          Final-year computer engineering student at Nepal Engineering College, with two years of
          full-time production work before that. I spent those two years at Atmos SoftTech building
          machine-learning systems, full-stack products and autonomous agent pipelines — including
          offline-first inference, because sending the data to a cloud API was not an option for
          the work. Then I started testing the systems I had been building.
        </p>
        <p>
          That testing is the work this site documents. My own evaluation of a local policy
          verification scheme produced a result that contradicted its hypothesis — constrained
          output was less safe than free-form, not more — and the repository ships the corpus and
          the raw model outputs so anyone can reach the same conclusion. Security patches I wrote
          are in google/go-github&rsquo;s history; memory-safety issues I filed against
          google/s2geometry are open; and I publish advisories against my own tools rather than
          quietly patching them.
        </p>

        <h2>How I got here</h2>
        <p>
          The move from building to breaking came from a specific frustration: an agent I had
          built could be steered by a tool description it fetched from a server I did not control,
          and nothing in the framework objected. That is not a bug in one product. It is the
          boundary between a model&rsquo;s text and a tool&rsquo;s side effect, and it is where
          most of my work now sits: reserved tool names, cross-server tool shadowing, fail-open
          confirmation gates, and whether a smaller local model can reliably check a proposed
          action against a written policy.
        </p>
        <p>
          The same instinct runs through the rest of the record. A fuzzing harness that was
          testing nothing, a benchmark that reported 1.000 where real code said 0.14, a scanner
          that a hostile server could kill before it reported — in each case the interesting part
          was not the failure but the check that should have caught it. The writing on this site is
          mostly about those checks.
        </p>

        <h2>What I am doing now</h2>
        <p>
          I am finishing my degree and working remotely, part-time, as a software developer at
          Arvion, on its mobile and web products. Alongside that I am open to full-time security
          and AI-engineering roles — remote or Kathmandu-based — and to focused freelance reviews of
          agentic systems. I wrote a paper on local policy verification for agents
          (ICICSET 2026), a paper on predictive bandwidth scaling for WebRTC over LEO satellite
          links (IEEE RTC 2026), and several others on agent and network security; the{" "}
          <Link href="/publications">publications index</Link> says what is checkable about each.
        </p>

        <h2>Work</h2>
        <ul className="pg-proof">
          <li>
            <strong>Software Developer — Arvion (remote, part-time)</strong>
            <span>June 2026 – present · application and web development across the company&rsquo;s products, end to end.</span>
          </li>
          <li>
            <strong>Technical Lead &amp; Software Developer — Avatar Tech Solutions</strong>
            <span>
              December 2025 – June 2026 · architecture and delivery for a corporate web ecosystem
              and a mobile application, plus IT operations across 30+ workstations.
            </span>
          </li>
          <li>
            <strong>AI Engineer — Atmos SoftTech Pvt. Ltd.</strong>
            <span>
              March 2024 – March 2026 · production machine-learning systems, full-stack products and
              offline-first autonomous agent pipelines.
            </span>
          </li>
          <li>
            <strong>Autonomous AI Intern — Next AI (capstone)</strong>
            <span>2026 · agent runtimes and human-in-the-command architectures.</span>
          </li>
        </ul>
        <p className="pg-note">
          The homepage carries the full timeline, including the internships and the certificates
          behind each skill estimate.
        </p>

        <h2>Education</h2>
        <h3>Bachelor in Computer Engineering — Nepal Engineering College</h3>
        <p>
          Bhaktapur, Nepal · final year (8th semester) · undergraduate researcher, Department of
          Computer Science and Engineering. Coursework in machine learning, computer architecture,
          operating systems, networks, cryptography and network security, and algorithms. The degree
          has not been conferred yet — &ldquo;final year&rdquo; is the accurate description, not
          &ldquo;graduate&rdquo;.
        </p>
        <h3>High School — Science (Physics, Mathematics) — St. Xavier&rsquo;s School, Jawalakhel</h3>
        <p>Kathmandu, Nepal · 2020 – 2022.</p>

        <h2>Awards and honours</h2>
        <ul className="pg-proof">
          {AWARDS.map((award) => (
            <li key={award.name}>
              {award.href ? <a href={award.href}>{award.name}</a> : <strong>{award.name}</strong>}
              <span>{award.detail}</span>
            </li>
          ))}
        </ul>

        <h2>Selected credentials</h2>
        <p>
          Seven of the certificates whose PDFs are hosted here; the homepage lists the rest. These
          are completion certificates, not licences, and this page does not turn them into
          something they are not.
        </p>
        <ul className="pg-proof">
          {CERTIFICATES.map((cert) => (
            <li key={cert.name}>
              <a href={cert.file}>{cert.name}</a>
              <span>{cert.issuer}</span>
            </li>
          ))}
        </ul>

        <h2>How I would like to be checked</h2>
        <p>
          The claims about my own technical work that the ledger covers are re-checked weekly
          against their public source by{" "}
          <a href="https://github.com/sushant-me/reputation">sushant-me/reputation</a>, a script
          that goes red when a source stops saying what the claim says. Coverage is stated rather
          than implied: 28 claims, 20 checked live, and it does not yet extend to every page on
          this site. Where a result went against me, the writing says so — the evaluation that
          contradicted its own hypothesis is the clearest example, and it is the one I would show
          first.
        </p>

        <div className="pg-cta">
          <h2>Working together</h2>
          <p>
            If you are hiring, or you have an agent or MCP server that needs a review,{" "}
            <Link href="/hire">the hire page</Link> covers what I do and how an engagement runs. If
            you just want to talk about the work, email{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a> — the same address is on every commit.
          </p>
          <a className="pg-btn" href={`mailto:${EMAIL}`}>Email me</a>
        </div>

        <CrossNav current="/about" />
      </div>
    </main>
  );
}
