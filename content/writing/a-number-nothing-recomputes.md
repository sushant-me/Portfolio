---
title: A number nothing recomputes
date: 2026-09-21
summary: Over a few days of work I found ten wrong numbers in things I had already published. Not ten typos — ten distinct facts, each of which had been true when written, on a CV, a profile, a hire page, a…
source: https://github.com/sushant-me/writeups/blob/main/2026-09-21-a-number-nothing-recomputes.md
---

Over a few days of work I found **ten wrong numbers in things I had already published**. Not
ten typos — ten distinct facts, each of which had been *true when written*, on a CV, a profile,
a hire page, a paper's README, and in one case inside a released software product.

I kept finding them by hand, one at a time, which is the actual problem. This is what the
class looks like, why the verifier I already had could not see any of them, and the three
hundred lines that now make each one unrepeatable.

---

## Why a claim verifier missed all ten

I already had `verify_evidence.py`: 23 claims, each with a public source, re-checked live on
every push and weekly on a schedule. It reported zero failures throughout.

It was right, and that was the problem. Look at what it checks:

```
claim:  Pull request merged into google/go-github      → PASS (merged 2026-09-17)
```

True. The pull request was merged. What had rotted was the **detail underneath it**: the page
described the per-method host check that PR added — and the maintainer reverted that check the
next day in favour of a broader rule. Every claim was true; the sentence describing it was
about code that no longer existed in the library.

That is the shape of all ten. A claim-level verifier checks the claim. The number inside the
sentence is a *quotation of the source*, and nothing was comparing it.

## The ten

| what the page said | what the source says |
|---|---|
| the agentbound suite went from 114 tests to 117 | it went from 111 to 114 |
| the corpus suite is 17 tests | it is 27 |
| disabling either safety invariant fails six tests | each fails **three**; six is both at once |
| a 16 GiB allocation comes from a **five**-byte header | the issue says the input is **117 bytes** |
| the paper's 90.8% is accuracy "on decisive rules" | the paper's label is "Rule A decision accuracy" |
| eighteen claims, fourteen checked live | nineteen and fifteen — in six sentences, which also disagreed with each other |
| the checker runs over 12 declared surfaces | it ran over 19 |
| pull request #675 is described as still awaiting review | it is closed, and was closed with written evidence |
| the go-github patch is merged | merged, then reverted and superseded the next day |
| the 0.1.10 release reports itself as 0.1.10 | `agentbound --version` printed **0.1.9** — the package metadata and the CLI disagreed for a whole release, and nothing compared them |

One of these was caught by a check I had written for a different purpose. The other nine were
caught by reading, which does not scale and does not repeat — and that ratio is the argument
for the rest of this post.

## The fix is smaller than it sounds

`check_surfaces.py` — about 370 lines of stdlib Python — does four things.

**1. Forbidden strings.** Every error becomes a rule, with the reason it is wrong, so the
failure message is an explanation:

```python
FORBIDDEN = {
    # the exact wrong string, and why it is wrong
    "<the size that was wrong>": (
        "the issue (#677) says the malformed input is 117 bytes; nothing in "
        "s2geometry mentions five bytes. Use '117-byte input'."
    ),
}
```

That key is a placeholder, and not for brevity: this post is itself a scanned surface, so it
is not allowed to contain the phrase it is describing. I found that out when the checker
rejected the first draft of this paragraph. Which is the point of the next section.

**2. Required strings.** Assert the *corrected* wording is present. Without this, the easiest
way to pass is to delete the sentence, and a page that says nothing is not a page that is
right.

**3. Derived counts.** The claim counts were the worst offender: six sentences, in four files,
that not only disagreed with the file but with each other. They are now computed from
`evidence.json` and the verifier's dispatch table, and any sentence that differs fails:

```
prose counts checked:    11 (truth: 23 claims, 19 live, 4 on request)
```

**4. Live version links.** Every `releases/tag/vX.Y.Z` must equal that repository's actual
latest release.

Across 40 files: 11 forbidden rules, 10 required assertions, 11 derived counts, 4 release
links.

## Two lessons I did not expect

**Every rule has to be mutation-tested, including the ones that pass.** I broke each
deliberately: re-introducing the size error, deleting a corrected phrase, pointing a release
link one version back, changing a count to `14`. All four fail as they should. The first
version of the count check was wrong — it treated an empty line as a Markdown table delimiter
(`set('') <= set(' :')` is true) and reported the last row of every table as malformed. A
checker nobody has watched fail is a checker nobody should trust.

**Coverage has to be asserted, or it silently becomes zero.** The surfaces were listed by
hand, so the ones not on the list were never checked — including three published posts, a work
sample, and a paper's README. It now prints declarations matched out of declared and refuses
to run below a floor:

```
surface declarations:    15/19 matched  (21 files)
  not in this checkout:  cv/*.html, cv/*.md, job-kit/*.md, job-kit/*.html
```

That line is not decoration. The first time this ran in CI it failed — because the checkout
layout put the repository one level higher than the script expected, so it found a single
surface. A checker that finds no files passes trivially, which is the same bug wearing a green
tick.

## The escape hatch, and refusing to add one

Here is where it got uncomfortable. Documenting an error requires quoting it. Two of my own
documents quote the errors they describe — and both started failing their own check.

Then I wrote this post, and it failed the checker **three times**. Once for a forbidden phrase:
the table above wants to say that a page claimed pull request #675 was still awaiting review,
and that literal is one of the rules. Twice for numbers: the same table has to state the old
claim counts, and the count rule cannot tell *asserting* a number from *documenting* one — it
saw the historical figure written in digits and reported it as a false claim about the current
file.

The obvious fix is an exemption — a marker letting the documentation quote forbidden strings or
state historical numbers. I didn't add one, and the reason is that **an escape hatch is how the
error got in the first time**. A rule that can be waived is a rule that will be waived on the
day it is inconvenient, and the day it is inconvenient is the day it catches something real.

So the documents are written to *describe* rather than reproduce: the counts as words, the
phrases paraphrased. It reads slightly worse and it is checkable, which is the trade I wanted.
The residual limitation is worth naming — a rule matching on digits cannot distinguish a claim
from a citation, so the citation has to change shape. That is a constraint the tooling imposes
on the prose, and I would rather have the constraint than the exemption.

## What this generalises to

Any project where the same fact lives in prose and in code has this bug. The README says "58
tests"; the suite says 61. The docs say "supports Python 3.9+"; `pyproject.toml` says 3.10.
The changelog names a version the release never had. Nobody is lying, and every one of them
will eventually be wrong.

The fix is not discipline. It is making the number *derivable* and asserting the prose matches
— the same move as turning a flaky test into an invariant. Three hundred lines, no
dependencies, and it runs in two seconds on every push.

## Honest limits

- It checks the strings I thought to forbid. An error nobody has found yet is not covered;
  this only stops **recurrence**, and every rule in it is a specific mistake I already made.
- A green run means the surfaces contain none of *these* errors and all of *these*
  corrections. It is a regression gate, not a proof of accuracy.
- Two facts in the record are still not machine-checkable — a signed employment letter and a
  conference acceptance email. They are reported as `on-request` rather than passed silently,
  because "documentation available" and "verified" are different statements.
- Deriving a count means the prose stops being readable on its own. `23 claims, 19 live` is
  clear; `{truth['claims']} claims` would not be. The number is written once and asserted,
  which is a compromise, not a solution.

The uncomfortable part is that I only built this after being wrong ten times, and each time I
fixed the instance and moved on. The rules are worth more than the fixes, and the rules are
the thing I should have written first.

---

## Epilogue: the eleventh, found the day after this was written

The checker read the repository. It never read what a visitor sees, and that gap had been
sitting in the loop list for several rounds as an instruction to myself: *"rebuild and redeploy
the portfolio — the live site still shows the old wording."*

It did not. The reasoning was that because the site is not served from the repository by GitHub
Pages, correcting the source could not have changed the live page. That inference was
plausible, repeated, and never tested. Fetching the page settled it in one request: the
corrections have been live since the commit that made them, because the host rebuilds on every
push to the default branch.

So the eleventh instance is not a wrong number. It is a **wrong instruction**, carried for
several rounds, in the document whose first line says it exists to stop exactly this — and
written by me after I had built the thing to prevent it. The check is now a fetch rather than a
correction: two deployed pages, required and forbidden strings, retried because a CDN can serve
the previous build for a few seconds.

Every rule in this post is a mistake I had already made. This one was made again while
describing them, which is the most honest evidence I can offer that the class is not a phase —
it is what happens to any fact that nothing recomputes.

---

**The checker:** [github.com/sushant-me/reputation](https://github.com/sushant-me/reputation)
— `check_surfaces.py`, `verify_evidence.py`, and the CI that runs both on every push and
weekly. **The errors** are recorded in `OPEN-LOOPS.md` with what each one taught.
