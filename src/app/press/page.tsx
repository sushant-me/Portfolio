import type { Metadata } from "next";
import Link from "next/link";
import "./press.css";

const BASE = "https://sushantpoudel2028.com.np";

/**
 * Editors ask the same four things before they commission anything: who is this, what can they
 * actually speak to, what have they done that I can check, and where do I get a headshot. This
 * page answers all four in one URL so a pitch can link to it instead of attaching four files.
 *
 * Every claim here is deliberately one that resolves from a public source. The two paper
 * acceptances on /publications are NOT repeated here, because their acceptance letters are not
 * public and an editor who asks for proof should get an answer rather than a page.
 */
export const metadata: Metadata = {
  title: "Press & Author — Sushant Poudel",
  description:
    "Author and expert-comment details for Sushant Poudel: AI agent security, LLM evaluation and verification, MCP tool shadowing, and memory safety. Bio, headshot and checkable work.",
  alternates: { canonical: `${BASE}/press` },
  openGraph: {
    title: "Press & Author — Sushant Poudel",
    description:
      "Bio, headshot and checkable work for commissioning or quoting on AI agent security and LLM verification.",
    url: `${BASE}/press`,
    type: "profile",
  },
};

const TOPICS: { title: string; detail: string }[] = [
  {
    title: "AI agent security and tool boundaries",
    detail:
      "How agents get steered through the tools they are given: reserved-name collisions and cross-server tool shadowing, tool poisoning through descriptions, and fail-open confirmation gates.",
  },
  {
    title: "LLM evaluation and policy verification",
    detail:
      "Whether a small local model can act as a safety check on an agent's actions, and the counter-intuitive result that constraining output format without requiring reasoning makes such a check less safe.",
  },
  {
    title: "MCP server auditing",
    detail:
      "What to inspect in a Model Context Protocol server before connecting it, and why pinning tool declarations turns a silent behaviour change into a visible diff.",
  },
  {
    title: "Memory safety and fuzzing",
    detail:
      "Finding and reporting memory-safety defects in widely used libraries, including unchecked-count allocations reachable from very small inputs.",
  },
  {
    title: "Verification that can actually fail",
    detail:
      "Why checks pass while checking nothing, and how to build tests that go red for the reason you built them.",
  },
  {
    title: "Connectivity and resilience for Nepal",
    detail:
      "Satellite direct-to-device architecture for high-terrain countries, and why offline-first design is a resilience requirement rather than a preference.",
  },
];

const WORK: { name: string; url: string; what: string }[] = [
  {
    name: "Edge-Native Semantic Firewall",
    url: "https://github.com/sushant-me/Edge-Native_Semantic_Firewall_",
    what:
      "A 600-scenario evaluation of structured Chain-of-Thought policy verification on a 3.8B model running locally. Code, corpus and all 3,000 raw model generations are public, and a checker re-derives every reported number from them in under a second with no GPU.",
  },
  {
    name: "mcp-nameguard",
    url: "https://github.com/sushant-me/mcp-nameguard",
    what:
      "Checks an MCP server's advertised tool names against the names agent frameworks register themselves, separating names a framework refuses from names it never defends.",
  },
  {
    name: "tool-boundary-corpus",
    url: "https://github.com/sushant-me/tool-boundary-corpus",
    what:
      "A labelled corpus of agent tool-boundary cases and a detector-agnostic harness that scores any detector against it. The corpus is self-authored, so it is a regression gate rather than an independent benchmark, and it says so.",
  },
  {
    name: "reputation",
    url: "https://github.com/sushant-me/reputation",
    what:
      "Every claim about his own work, each with the public source it came from, re-checked by a script that fails when a claim stops being true.",
  },
];

export default function PressPage() {
  return (
    <main className="pr">
      <div className="pr-wrap">
        <Link href="/" className="pr-back">
          ← sushantpoudel2028.com.np
        </Link>

        <div className="pr-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/press/sushant-poudel-headshot.jpg"
            alt="Sushant Poudel"
            width={160}
            height={160}
            className="pr-photo"
          />
          <div>
            <h1>Sushant Poudel</h1>
            <p className="pr-role">
              Computer engineering student, Nepal Engineering College · AI agent security
            </p>
            <p className="pr-contact">
              <a href="mailto:sushant.poudel2028@gmail.com">sushant.poudel2028@gmail.com</a>
              {" · "}
              <a href="https://github.com/sushant-me">github.com/sushant-me</a>
            </p>
          </div>
        </div>

        <h2>Short bio</h2>
        <p>
          Sushant Poudel is a computer engineering student at Nepal Engineering College,
          Bhaktapur, and works on security for autonomous AI systems. He builds and tests
          tooling that checks what an AI agent is about to do, and writes about the results
          that went against what he expected.
        </p>

        <h2>Longer bio</h2>
        <p>
          Sushant Poudel builds security tooling for autonomous AI agents and tests it in the
          open. His work covers the boundary where a language model&rsquo;s output becomes an
          action: whether a small local model can reliably verify a proposed action against a
          written policy, how agent frameworks fail to defend their own tool names, and what a
          team should inspect in an MCP server before connecting it.
        </p>
        <p>
          He reports negative results as readily as positive ones. His evaluation &mdash; accepted,
          camera-ready in progress &mdash; found that constraining a model&rsquo;s output to JSON,
          without requiring it to state its reasoning first, made the safety check less safe: the
          constrained version approved 46.2% of the 600 proposals it was shown, against 17.2% for
          plain text. Requiring the reasoning made it the most accurate configuration and much the
          best on actions that cannot be undone, and it still scored worse than plain text on that
          broad measure. The repository ships its corpus, the raw model outputs and a checker that
          re-derives the reported figures from them &mdash; every one except a single declared
          recorded constant, which the checker names &mdash; so a reader can reach the same
          conclusion independently.
        </p>
        <p>
          He has reported memory-safety defects in widely used libraries and defects in agent
          toolkits, and he maintains a public repository in which each claim it covers carries the
          public source it came from and is re-checked automatically. Coverage is stated rather than
          implied: the ledger currently holds 25 claims and does not yet extend to every manuscript
          on this site.
        </p>

        <h2>Topics he can write about or comment on</h2>
        <ul className="pr-topics">
          {TOPICS.map((t) => (
            <li key={t.title}>
              <strong>{t.title}</strong>
              <span>{t.detail}</span>
            </li>
          ))}
        </ul>

        <h2>Selected work, with the code</h2>
        <ul className="pr-work">
          {WORK.map((w) => (
            <li key={w.name}>
              <a href={w.url}>{w.name}</a>
              <span>{w.what}</span>
            </li>
          ))}
        </ul>

        <h2>Assets</h2>
        <p>
          Headshot:{" "}
          <a href="/press/sushant-poudel-headshot.jpg" download>
            full size (800×800)
          </a>{" "}
          ·{" "}
          <a href="/press/sushant-poudel-headshot-200.jpg" download>
            small (200×200)
          </a>
          . Both are square and free to use with any piece. The bios above may be used verbatim or
          cut to length.
        </p>

        <p className="pr-foot">
          For commissioning or a quote, email{" "}
          <a href="mailto:sushant.poudel2028@gmail.com">sushant.poudel2028@gmail.com</a>. See also{" "}
          <Link href="/writing">writing</Link> and <Link href="/publications">publications</Link>.
        </p>
      </div>
    </main>
  );
}
