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
const TITLE = "Hire Sushant Poudel — AI security review and engineering";
const DESCRIPTION = metaDescription(
  "AI security reviews of agentic and LLM systems, MCP tool-boundary audits, security-focused code review and full-stack builds. Nepal-based, working remotely.",
);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}/hire` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/hire`,
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Hire Sushant Poudel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

/**
 * The five things this site can honestly offer.
 *
 * Each one is written as a scope rather than a slogan, because the visitor this
 * page exists for is deciding whether to send an email: they need to recognise
 * their problem in a line and see what they would receive. No prices, because a
 * number printed without a scope is fiction; and no client logos, because the
 * engagements that would justify them are not public.
 */
const SERVICES: { title: string; body: string; deliverable: string }[] = [
  {
    title: "AI security review of agentic and LLM systems",
    body:
      "A review of the boundary where a model's output becomes an action: which tools the agent can reach, what the confirmation gate actually checks, where untrusted content enters the context, and whether the guardrail fails open when its evaluator errors. Findings are written with a reproduction, not as a checklist, and a review that finds nothing says so instead of padding the report.",
    deliverable: "Deliverable: a findings report with severities, reproductions and fixes, plus a walkthrough call.",
  },
  {
    title: "MCP tool-boundary review",
    body:
      "An audit of a Model Context Protocol server and the client that connects to it: reserved-name collisions against the agent framework's own tools, tool shadowing across servers, over-broad scopes, endpoints reachable without authentication, and what the tool descriptions actually tell the model. Pinned tool declarations are part of the deliverable, so the next silent change to a description shows up as a diff.",
    deliverable: "Deliverable: server findings plus a pinned declaration set you can diff on every upgrade.",
  },
  {
    title: "Security-focused code review",
    body:
      "A read of the code for the classes that ship: object-level authorization, injection and deserialization, secrets and credentials handling, CI/CD and dependency configuration, and the defect that is easiest to miss — tests that pass while checking nothing. Python, Go, TypeScript/Node, Dart/Flutter.",
    deliverable: "Deliverable: file-and-line findings ranked by exploitability, with the failing input where one exists.",
  },
  {
    title: "Penetration-testing-style assessment and reporting",
    body:
      "Authorized testing against a target you name, written up the way a triager reads it: severity, reproduction steps, evidence, impact and remediation, with a retest window after the fixes. This is not a compliance certificate, and it is not a substitute for a CREST- or OSCP-certified firm where your programme requires one.",
    deliverable: "Deliverable: a report in that format plus a retest of the fixed findings.",
  },
  {
    title: "Full-stack web builds",
    body:
      "A working product rather than a prototype: Next.js or React on the front, a Node or Python API, Postgres or Supabase behind it, deployed. Security headers, a content security policy and accessibility are checked as part of the build, not bolted on afterwards. Flutter where the product has to be a mobile app.",
    deliverable: "Deliverable: the deployed application, its repository, and a handover note for whoever runs it next.",
  },
];

const STEPS: { title: string; body: string }[] = [
  {
    title: "Email with the shape of the problem",
    body:
      "One paragraph is enough: what the system is, what worries you, and when you need an answer. No form and no discovery call first — if it is not a fit I will say so in the reply.",
  },
  {
    title: "Scope in writing",
    body:
      "Targets, limits, deliverables and dates are agreed in a short document before any work starts. Anything not in that document is out of scope, and testing only ever happens against what it names.",
  },
  {
    title: "Access and authorization",
    body:
      "For a review: the repository, a test deployment or the server. For testing: written authorization from whoever owns the system, and the person to call if something breaks.",
  },
  {
    title: "The work",
    body:
      "Review or build. Each finding is written down as it is reproduced rather than reconstructed from memory at the end, which is why the reports contain inputs instead of adjectives.",
  },
  {
    title: "Handover",
    body:
      "A report or a deployed product, a call to walk through it, and a retest window for the fixes. The fixes stay yours; nothing I write is held back for a second engagement.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does an engagement cost?",
    a: "It is quoted per engagement after scoping, because a small MCP audit and a multi-week build are not the same job and a rate card would hide that. The quote is fixed for the scope we agree; the only thing that changes it is a scope change you approve.",
  },
  {
    q: "How long does a review take?",
    a: "A tool-boundary or MCP review is usually days rather than weeks. A code review depends on the size of the codebase, and a build is scheduled in weeks. The dates are fixed before work starts.",
  },
  {
    q: "Are you available full-time?",
    a: "Yes. I am open to security engineering, AI engineering and software roles, remote or Kathmandu-based, as well as focused freelance work. The same address works for both.",
  },
  {
    q: "Do you hold a penetration-testing certification?",
    a: "No, and I do not claim one. If your programme requires a CREST- or OSCP-certified tester, this is not a substitute for that firm. What is on offer instead is the record linked below: defects found, reported to the maintainers, and left where anyone can check the outcome.",
  },
  {
    q: "Will you test something without written authorization?",
    a: "No. Testing needs written authorization from the system's owner, and the scope document names exactly what may be touched. That is also what makes the report usable — an unauthorized test cannot be handed to anyone.",
  },
  {
    q: "Do you sign NDAs?",
    a: "Yes, before access is shared. What I will not sign is an agreement that requires removing a claim already published about my own work from my own record; the public ledger is the thing that makes the rest of this page checkable.",
  },
];

export default function HirePage() {
  return (
    <main className="pg">
      <JsonLd
        data={pageNode({
          type: "WebPage",
          url: "/hire",
          name: TITLE,
          description: DESCRIPTION,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: SERVICES.map((service, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "Service",
                name: service.title,
                description: service.body,
                serviceType: service.title,
                provider: { "@id": PERSON_ID },
              },
            })),
          },
        })}
      />
      {/* FAQPage is claimed only for questions this page actually answers in
          visible text; a Q&A block that exists only in the markup is exactly the
          kind of markup search engines discount, and it would also be invisible to
          the person deciding whether to write. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${BASE}/hire#faq`,
          mainEntity: FAQ.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
      <JsonLd
        data={breadcrumbList([
          { name: "Home", path: "/" },
          { name: "Hire", path: "/hire" },
        ])}
      />
      <div className="pg-wrap">
        <Link href="/" className="pg-back">
          ← sushantpoudel2028.com.np
        </Link>
        <h1>Work with me</h1>
        <p className="lead">
          I am Sushant Poudel, an AI security engineer in Nepal. I test what an autonomous
          agent is about to do, and I build the systems I test. Open to full-time security and
          AI-engineering roles — remote or Kathmandu-based — and to focused freelance work.
        </p>
        <p className="meta">
          Bhaktapur, Nepal · UTC+5:45 ·{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>

        <h2>What I do</h2>
        <ul className="pg-svc">
          {SERVICES.map((service) => (
            <li key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.body}</p>
              <span className="deliverable">{service.deliverable}</span>
            </li>
          ))}
        </ul>

        <h2>How an engagement runs</h2>
        <ol className="pg-steps">
          {STEPS.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              {step.body}
            </li>
          ))}
        </ol>

        <h2>The record, so you can check before writing</h2>
        <ul className="pg-proof">
          <li>
            <a href="https://github.com/google/go-github/pulls/4556">google/go-github</a>
            <span>
              Two merged security patches: #4556 stopped a release-asset upload being sent to an
              off-host URL, and the maintainer replaced it the next day with the broader #4564,
              &ldquo;send credentials only to configured origins&rdquo;. Credited in the project&rsquo;s
              AUTHORS file (#4579) and named in the v93.0.0 release notes.
            </span>
          </li>
          <li>
            <a href="https://github.com/google/s2geometry/issues?q=is%3Aissue+author%3Asushant-me">
              google/s2geometry — five memory-safety issues
            </a>
            <span>
              Open issues including a NULL dereference on the library&rsquo;s documented traversal
              path (#674) and a 2.4 GiB allocation reachable from a 28-byte input, each with a
              standalone reproducer.
            </span>
          </li>
          <li>
            <a href="https://github.com/glennrp/libpng/issues/935">libpng #935</a>
            <span>
              An owned palette buffer sized for 256 entries but copied with the image&rsquo;s
              num_palette entries — a write past the allocation, found by reading the call path.
            </span>
          </li>
          <li>
            <a href="https://github.com/google/osv-scanner/issues/3120">google/osv-scanner #3120</a>
            <span>
              A scanner correctness bug: PackageOverrides regexes are anchored per branch, so a
              top-level alternation silently drops packages from the scan — a false negative in a
              vulnerability scanner.
            </span>
          </li>
          <li>
            <a href="https://github.com/google/adk-go/pull/1606">google/adk-go #1606</a>
            <span>
              Open pull request: framework-reserved MCP tool names that the toolset cannot observe.
              It is labelled open here because it is open; nothing has been merged.
            </span>
          </li>
          <li>
            <a href="https://github.com/sushant-me/policygate/security/advisories/GHSA-qwvv-fcmm-r3j2">
              Four published security advisories
            </a>
            <span>
              In my own tools — a fail-open policy gate, a scanner a hostile server could kill, a
              masker that deleted the word it matched on — found, fixed and published rather than
              quietly patched.
            </span>
          </li>
          <li>
            <a href="https://github.com/sushant-me/reputation">sushant-me/reputation</a>
            <span>
              Every claim about my own technical work, each with the public source it came from,
              re-checked by a script that goes red when a source stops saying it.
            </span>
          </li>
          <li>
            <Link href="/writing/null-origin-ctf-qualifier">Null Origin CTF 2026 — write-up</Link>
            <span>
              In the Grand Finale, finished 2nd of 8 with team roamers: 16,850 points and 40 of 42
              challenges, behind Jokers on 17,600. The qualifier write-up is on this site; the final
              has a certificate (NO-2026-GF-229CF4, &ldquo;Finalist &middot; rank #2&rdquo;), not a
              public scoreboard.
            </span>
          </li>
        </ul>

        <h2>What this is not</h2>
        <p className="pg-note">
          I am early-career by years, not by evidence — the links above are the evidence, and they
          are why this page does not need a testimonial. I do not offer compliance certification
          (SOC 2, PCI DSS, ISO 27001): I can prepare the technical evidence, but I cannot certify
          you and neither can any other tester. I do not test systems without written authorization.
        </p>

        <h2>Questions people ask before emailing</h2>
        <div className="pg-faq">
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <div className="pg-cta">
          <h2>Start with an email</h2>
          <p>
            Send the system, the worry and the deadline to{" "}
            <a href={`mailto:${EMAIL}?subject=Project%20enquiry`}>{EMAIL}</a>. A useful first
            message is four lines: what the system does, what it runs on, what you are worried
            about, and when you need it.
          </p>
          <a className="pg-btn" href={`mailto:${EMAIL}?subject=Project%20enquiry`}>
            Email me
          </a>
          <p className="pg-note" style={{ marginBottom: 0 }}>
            Prefer to read first? The <Link href="/about">about page</Link> has the longer record,
            the <Link href="/publications">papers</Link> show how the evaluation work is done, and
            the <Link href="/press">press page</Link> has the short bio and a headshot if you need
            one.
          </p>
        </div>

        <CrossNav current="/hire" />
      </div>
    </main>
  );
}
