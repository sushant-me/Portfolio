---
title: The zero that wasn't: how my own adapter made a working tool look broken
date: 2026-09-23
summary: I spent three passes convinced I had found that an independent MCP scanner detected none of the defects in my corpus. The scanner was working the whole time. The fault was in the twelve lines of glue
source: https://github.com/sushant-me/writeups/blob/main/2026-09-23-the-zero-that-wasnt.md
---

I spent three passes convinced I had found that an independent MCP scanner detected
none of the defects in my corpus. The scanner was working the whole time. The fault
was in the twelve lines of glue I wrote to score it, and it took three rounds of
being wrong to find that out.

I'm writing it down because the failure was not exotic. It was the ordinary kind: a
measurement pipeline that produced a number, and a number that looked like a result.

## What I was trying to do

`tool-boundary-corpus` is a labelled corpus of agent tool-boundary cases with a
harness that scores any detector against them. A detector is just a command that
reads an input path and prints findings. That design is why the corpus can score
tools it has never seen.

So when `mcpvuln` — an independent MCP vulnerability scanner, published on PyPI by
someone else — appeared in my field of view, the obvious thing was to point the
harness at it. Two implementations of MCP scanning exist and nobody has compared
them on common inputs. Even a bad comparison is more useful than no comparison.

`mcpvuln` doesn't print findings to stdout the way the harness expects. It writes a
*scan contract* JSON to a path. Fine — that's what an adapter is for. Forty lines
that run the tool and normalise its output into the shape the harness scores.

## The first number, and why it was wrong

Across the fourteen declaration cases:

```
tp=0  fp=1  fn=10  tn=5
precision=0.000  recall=0.000
```

Zero true positives. One false positive, landing on a case whose label is a correct
implementation — a scanner flagging the right way to do something, which is a worse
look than missing a defect.

That number was not real, and I got there by two separate mistakes.

**The first: I tested the wrong input.** Trying to reproduce the false positive, I
fed my adapter the *case file* — the JSON that carries `id`, `kind`, `label`,
`source` and `fixture` — instead of the **staged fixture**. The harness writes
`case.fixture`, the bare `tools/list` payload, to disk and passes that. My direct run
and the harness were never reading the same bytes. I reported a negative result that
my own test design had manufactured.

**The second, and the real one:** the harness scores **rule strings**. `mcpvuln`
reported

```
mcp.line_jumping.instructions_in_tool_description
```

where the case expects `instruction-in-declaration`. Same defect, different
identifier. So the harness counted it as a false positive *and* a false negative
simultaneously, and the tool that had actually found the bug was scored as though it
had found nothing and invented something.

## The fix was a dictionary

```python
RULE_MAP = {
    "mcp.line_jumping.instructions_in_tool_description": "instruction-in-declaration",
    ...
}
```

Unmapped rules pass through unchanged, so a genuine difference between two detectors
still shows up instead of being swallowed by the translation.

Same cases, same tool, same day:

```
tp=1  fp=0  fn=9  tn=5
precision=1.000  recall=0.100
```

Perfect precision, low recall. When it flags a declaration it is right, and it finds
one of ten expected rule instances. **Nothing about the tool changed between those
two runs — only my dictionary.**

## Why this is worth more than the number

Two things I'd generalise.

**A zero from an outside tool should be treated as a suspected integration bug until
proven otherwise.** My first instinct was to report a finding about `mcpvuln`. The
correct first instinct is to suspect the adapter, because an adapter is new code and
the tool is not. Every hour I spent on the wrong hypothesis was an hour available to
have just read `harness.py`'s `score()` function, which settles it in fifteen lines.

**Cross-tool scoring needs a vocabulary, not just a shape.** Any harness that scores
raw string identifiers measures naming conventions as much as it measures detection.
`mcpaudit` scores `1.000 / 1.000` on this corpus — and it is scored in *its own*
vocabulary, because its rule identifiers are the corpus's. An outside detector is
scored through a mapping I wrote, and a mapping I write can flatter or penalise
either one. That belongs in the corpus's README as a limitation, and it is now in
this post instead of being discovered by someone less friendly.

## The bit I'm least comfortable with

I made three confident claims across three passes, and each correction required
going one layer deeper: the counters "don't reconcile" (they do — `tp`/`fp`/`fn` are
counted in rules and `tn` in cases, so `16` against `14` cases is expected); the
false positive "doesn't reproduce" (it never was a false positive, and my test was
wrong); and `mcpvuln` "detects none of the tool-boundary classes" (it detects
`instruction-in-description` and was simply not credited).

Each one was written down as a conclusion before anyone tried to reproduce it,
including me. The first was already appended to a document as `precision=0.000`.

I have left the withdrawn versions in the comparison document rather than deleting
them, because the correction is the only part of it worth trusting, and a document
that shows its own revisions is more useful than one that appears to have been right
first time.

## Two things I have not done

I have **not** run `mcpvuln` against a real repository per case, which is the only
comparison that would be fair — a bare declaration in an empty directory is an input
shape it was not built for. And I have **not** contacted its author. A public
comparison should be run past them first: it is a small community, the numbers
depend on a mapping I chose, and "my tool beat theirs" ages badly when the input
sets differ.

The honest summary of the exercise is that I learned more about my own harness than
about their scanner. Which is, on reflection, the more useful direction.
