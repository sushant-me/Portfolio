---
title: AI safety — positions held, and the evidence for each
date: 2026-10-10
summary: The three things LASR Labs screens for in Round 1 are: something concrete I built that showed engineering skill; evidence of doing research and thinking carefully about what came out; and enough…
source: https://github.com/sushant-me/writeups/blob/main/2026-10-10-ai-safety-positions-and-the-evidence-for-each.md
---

## Why this page exists

The three things LASR Labs screens for in Round 1 are: something concrete I built that
showed engineering skill; evidence of doing research and thinking carefully about what
came out; and enough familiarity with technical AI safety to hold specific, reasoned
views rather than a general interest.

The first two are already on this site. The third is what this page is for. A position
below counts as held only if it is attached to a result I obtained, including the cases
where the result argues against something I wanted.

---

## 1. The output format is part of the safety property, not a presentation choice

**Claim.** Constraining a model's output format without requiring a reasoning step can
make an enforcement model *less* safe, not more — and the direction is not predictable
from the constraint being "stricter".

**Evidence.** I built a policy evaluator for autonomous agents: a small model that reads a
proposed action and decides whether a written policy allows it. Adding JSON mode without a
reasoning step produced the least safe of four conditions I tested. Of 600 proposals, the
JSON-mode arm approved **46.2%** (277) of actions the policy blocks or escalates, against
**17.2%** for unconstrained free-form text. On irreversible hard-denial commands it approved
**71**, where free-form approved **11** and a structured arm that did require reasoning
approved **6**.

**Named limits.** One 3.8B 4-bit quantized model (Phi-3-mini), a corpus I wrote myself, 600
scenarios per condition, temperature 0, 4.2 GiB VRAM ceiling, all local inference. I cannot
say how far it generalises; I can say the mechanism is worth looking for in any setup that
has bolted JSON mode onto a model and assumed constraint bought reliability.

**What this changes for me.** "Make the output parseable" and "make the model safe" are
different requirements that can point in opposite directions. A safety property that is
enforced only in the output format is not enforced.

*Source: `structured-output-made-it-less-safe` (2026-09-20); the accompanying paper,
Edge-Native Semantic Firewall for Autonomous LLM Agents.*

---

## 2. A green check is not evidence until it has been shown to fail

**Claim.** In agent and model evaluation, the dominant failure I keep finding is not a
check that fails — it is a check that passes while never having looked at the thing it
claims to cover. This is a safety problem, not a quality problem: it produces confidence
in proportion to the absence of evidence.

**Evidence. The first item is the strongest, because it is the one I filed against my own
project rather than found in someone else's:**

- **My own map's error notice had never been observed to fire.** The handler was wired, it
  distinguished "out of range" from a real error, and the styling supported it — and it had
  never once run. Blackholing every external host did not trigger it, because nothing
  actually failed: the national view drew from bundled tiles and was correctly offline. So
  the path was both *correct* and *untested*, and the only way to reach it was to make a
  deliberately broken tile source. I have recorded this as an open issue describing the
  negative control and the fix, rather than quietly patching it.
- A link checker classified unreachable links as `unverified` (deliberately, so a transient
  outage would not cry wolf) and floored nothing. A total network failure therefore
  produced `PASS 0 of 62 external links resolve` and exit 0 — byte-identical to a clean
  estate. Demonstrated by stubbing the fetcher.
- A secret scanner applied its fetch cap globally; the account needed 1208 files and the cap
  was 600. It printed `truncated: N repo(s)` and never let that touch the exit code, so it
  reported "no credential-shaped values found in public repositories" while 40 repositories,
  including the ones most likely to matter, were never opened.
- An OSS-Fuzz harness for `google/libphonenumber` sat at **0.00% (0/532)** line coverage
  because it never generated a valid input. The corrected harness reaches **93.05%**.
- An MCP tool-name guard returned an error on a reserved name, which failed the whole
  listing, the step, and every invocation of the agent — including agents that configured
  nothing that collided.

**The position.** An evaluation result is a *measurement*, and a measurement without a
stated coverage floor is not one. I now require three things before I trust a check: the
coverage it actually achieved, a control that shows it failing, and an exit code that
changes when it cannot look.

**Why the first item matters most.** It is easy to hold this position about other people's
code and awkward to hold it about your own — the map worked, the handler was correct, and
the honest entry in the tracker is that its *path has never been exercised*. Filing that
against myself is the part of this position I would actually stand behind in an interview.

**Why this is an AI-safety position.** The same defect appears in agent tool boundaries and
in model evaluation: a guard that cannot be shown to fire, or that fires only on inputs it
was not designed for, is indistinguishable from a guard that works — right up to the point
it matters. Alignment claims inherit whatever is wrong with their measurement.

*Sources: `sushant-me/work#7` (*"The map's error notice has never been seen to fire"* — open,
with the negative control and the unreached path described in the issue);
`check_links.py`, `check_secrets.py`, `verify_evidence.py` in `sushant-me/reputation`;
the PR body for `google/libphonenumber#4079`; `google/adk-go#1606`.*

---

## 3. The boundary belongs at the capability set, not at the string

**Claim.** In agent tool-use security, a prefix or pattern restriction is not a boundary if
the agent can reach the code that enforces it. The bound has to rest on what the agent can
*do*, not on how the command is spelled.

**Evidence.** I audited agentic GitHub Actions workflows and filed the pattern class where a
tool grant names a verb but not a target (`Bash(gh issue edit:*)`). The instructive part was
my own fix: my first "bounded" example granted `Read,Write,Bash(./scripts/triage-label.sh:*)`
while calling the result bounded. The `Write` let the agent replace the very wrapper that
was supposed to bound it — the prefix bounded the verb, not the reach. A maintainer caught
it; the corrected example provisions the wrapper outside the model's writable tree and drops
`Write` from the grant entirely.

**The same claim, ported.** In `google/adk-go`, a reserved tool name caused the whole tool
listing to fail, which failed every invocation of the agent. The right behaviour is that a
reserved name costs the server *that one tool*. I added the test that pins it — the existing
table asserted the reserved name was absent, but its server listed *only* that tool, so the
empty result passed vacuously and the ordinary tools' survival was never checked.

**The position.** Prompt injection and tool abuse are not, at bottom, input-sanitisation
problems. They are capability problems. The productive question is not "can this string get
through" but "what is this agent able to do once anything gets through".

*Sources: `trailofbits/skills#311` (detection rule, corrected); `google/adk-go#1606`.*

---

## 4. Evidence about my own work has to be re-checkable, or it is marketing

**Claim.** A claim about my own capability that cannot be re-derived from a public source is
worth less than one that can, and the difference is the whole value of the claim.

**Evidence.** `sushant-me/reputation` holds every claim I make about my own work, each with
the source that can re-check it, and a script that hits those sources live on every push and
weekly on a schedule — 27 claims, 19 checked live, 8 documented as available on request,
0 failing. When it reported a failure I investigated rather than relaxed it, and found the
check was wrong: a Google contribution had been merged through Copybara, which closes the
pull request without setting `merged`, so a merged contribution read as a rejected one. The
fix checks that the commit a bot names is actually on the default branch — because a sha in
a comment proves nothing, and accepting it unchecked would have turned the exemption into a
way to launder a closed PR into a pass.

**Where I will not use it.** I hold a vendor-validated vulnerability report (Elastic,
`filebeat`, arbitrary file read as root) that is not publicly disclosed. It is deliberately
*absent* from that repository, because its verifier requires a live public source and the
report page returns 404. I published it only where self-asserted claims belong, with the
limit stated. Putting it where it would look machine-checked, and not be, would have
destroyed the only thing that makes the rest of the list worth reading.

**The position.** For AI systems that report on themselves, the credibility of a self-report
is bounded by how hard it is to falsify. A system whose claims cannot be independently
re-derived is not auditable, however accurate it happens to be.

*Sources: `sushant-me/reputation` (27 claims, 0 failing); `SECRETS-TO-ROTATE.md`.*

---

## What I want to do next

The through-line is measurement honesty in agentic systems: the places where a system's
account of itself, its guardrails, or its coverage diverges from what it actually did. The
work above is all one question asked in four places. I would like to work on it where the
answer can be checked by someone other than me — which is why every claim on this page names
its source and its limit.
