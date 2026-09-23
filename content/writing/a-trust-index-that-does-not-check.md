---
title: A trust index graded my repos as MCP servers. None of them is one.
date: 2026-09-23
summary: I got a cold email: an MCP "trust index" had listed one of my repositories, where developers check servers before connecting them. Three free things I could do — claim it, add a badge, connect a…
source: https://github.com/sushant-me/writeups/blob/main/2026-09-23-a-trust-index-that-does-not-check.md
---

I got a cold email: an MCP "trust index" had listed one of my repositories, where
developers check servers before connecting them. Three free things I could do —
claim it, add a badge, connect a GitHub App.

I went and looked, and the interesting part was not the email.

## Three repositories, none of them a server

The repository they listed first is `mcp-audit-sample`. Its own description says it
is **deliberately vulnerable** and that I built it as a **synthetic test fixture** to
demonstrate what my scanner reports. It is published to no package registry — I
checked, it is not on npm or PyPI. It is not something anyone could connect, and it
is certainly not something anyone should.

While I was there I found two more of my repositories in the same index, graded the
same way:

| repository | what it is | how it was filed |
|---|---|---|
| `mcp-audit-sample` | deliberately vulnerable test fixture | a server (D, 58/100) |
| `tool-boundary-corpus` | a labelled benchmark corpus and harness | a server (C, 74/100) |
| `mcpaudit` | a command-line scanner | a server (C, 74/100) |

The listing states its source: **GitHub repository search**. The crawler reads the
phrase "MCP server" out of a description and files a repository as a server you might
connect.

## They had the answer on the page

This is the part that makes it more than a grumble. Each listing **quotes the
repository description**, and in every case the quoted text says the repository is
not a server:

- `tool-boundary-corpus` — *"A labelled corpus of agent tool-boundary cases, and a
  detector-agnostic harness that scores precision and recall against them"*
- `mcpaudit` — *"Audit an MCP server's tool declarations before you connect…"*
- `mcp-nameguard` — *"Check an MCP server's tool names against the names agent
  frameworks reserve for their own tools"*

One is a corpus. Two are tools that *inspect* servers. The description is rendered on
the same page as the grade. The classifier ignored the sentence it was displaying.

## Two specific defects you can check yourself

**A grade below their own published rule.** The page says *"New projects cap at C
until adoption is earned."* The fixture is graded **D**. A cap is an upper bound, so a
new project cannot score below it for being new. Either the cap is not enforced, or
the grade is wrong, and nothing on the page says which.

**"No tools extracted — insufficient content."** That is what the fixture's listing
reports. The repository contains `server/tools_list.json` (4,061 bytes, a literal
`tools/list` payload) and `audit/tools.lock.json` (3,304 bytes of per-field
declaration hashes). Their extractor read the two Python files and missed both
declaration files. One `git clone` disproves it.

## The hypothesis I had to throw away

My three repositories all scored exactly **C 74/100**. Three unrelated artifacts — a
corpus, a CLI and a validator — landing on byte-identical scores looked like a default
tier applied when nothing could be assessed. That was going to be the strongest
sentence in this post.

So I checked it against servers I had nothing to do with:

| server | grade |
|---|---|
| `modelcontextprotocol/python-sdk` | A 98/100 |
| `github/github-mcp-server` | B 85/100 |
| `modelcontextprotocol/servers` | B 82/100 |
| `cloudflare/mcp-server-cloudflare` | B 75/100 |

Their scoring varies. It discriminates. My hypothesis was wrong, and three identical
scores are far better explained by the rule they state — new projects cap at C — than
by a broken scorer.

That one `curl` is the difference between a criticism and a claim, and I would have
published the claim. I am leaving the discarded version in this post because the
correction is the only part of this that is worth trusting.

It sharpens the finding rather than weakening it: if new projects cap at **C**, the
**D** on the fixture is below the cap, and the page never explains what took it there.

## A connection that does not do what it says

I connected the app, which is described as re-checking on every push *"so your listing
reflects the code you actually shipped rather than a snapshot from whenever we last
crawled."*

I then pushed a README change and a description change. The listing still reports the
commit from **before** those changes. The one thing that connection exists to deliver
— currency — is not being delivered, on the single repository it was connected for.

## The badge

Two variants, both live SVGs served from their domain:

- default: `M8ven ⚡ Live: C · Emerging` — puts a **C** on three of my repositories
- `?variant=verified`: `M8ven ⚡ Live: continuously verified` — hides the grade

The page says the second one *"shows verification status without the grade."* So the
badge offered to a publisher who just scored badly displays the positive word and
withholds the number. It is also awarded **for adding the badge** — it is the proof
that upgrades your listing, which makes it advertising rather than an audit finding.

I did not add it, and I am not going to.

## Why I bothered writing this

MCP trust indices are a new layer in the agent supply chain, sitting one step above
the layer my own tools cover. Tool poisoning and name shadowing are about what a
*server* does once you connect it. This is a step earlier: **what a directory tells
you about a server before you connect it**, generated by crawlers, from prose, with
undisclosed scoring.

The failure here is not malice. It is classification without verification, published
with the visual authority of a letter grade. If a developer trusts the index instead
of reading the source, the index is the attack surface.

## What I fixed on my own side

The misclassification was partly my fault. The description led with "MCP server" and
the README described the fixture as *"the kind of vendor integration that ends up
connected to an agent"* — accurate about what it demonstrates, and exactly the wrong
sentence to hand a crawler.

Both now say plainly that it is a fixture which must not be installed or connected. I
also asked for the listing to be relabelled or removed, because a specimen is not a
server.

## Limits

- **One vendor.** Everything here is about `m8ven.ai`, from its public pages. It says
  nothing about MCP trust indices generally except by analogy, and the analogy should
  be labelled as one.
- **I could not read their scoring internals.** The "view raw JSON" link returned the
  site's HTML shell, so the deductions behind the D are unknown to me. I am saying the
  deductions are undisclosed, not that they are wrong.
- **I wrote all three repositories.** This is a report about how my own work was
  classified. No third party was affected, because none of the three is installable.
