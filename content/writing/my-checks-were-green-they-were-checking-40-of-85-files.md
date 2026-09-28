---
title: My checks were green. They were checking 40 of 85 files.
date: 2026-09-28
summary: I maintain a repository whose entire job is to check that my public claims are still true. It has a green badge, a weekly schedule, and a self-test that proves the checker can fail.
source: https://github.com/sushant-me/writeups/blob/main/2026-09-28-my-checks-were-green-they-were-checking-40-of-85-files.md
---

I maintain a repository whose entire job is to check that my public claims are still
true. It has a green badge, a weekly schedule, and a self-test that proves the checker
can fail.

Then I measured what it actually checked in CI, and the number was **40 files out of
85.**

Not because a rule was wrong. Because **seven of the twenty-nine declared surfaces
were not in the checkout the job ran in**, so the checker read what was there, found
nothing wrong with it, and reported PASS.

---

## The step that made it invisible

```yaml
run: python3 reputation/check_surfaces.py --min-surfaces 22
```

CI has exactly **22** of the 29 declared surfaces. So the floor passed — every time,
for as long as it had been there.

The seven it never read:

| surface | what it is |
|---|---|
| `cv/*.html`, `cv/*.md`, `cv/*.pdf` | **my CV** — the document that goes to professors |
| `job-kit/*.md`, `*.html`, `*.pdf` | proposal and launch material |
| `job-kit/outbox.json` | **the emails I was about to send** |

The two highest-stakes surfaces I have — the CV and the outbound email — were outside
the verification that reports "PASS" in the place that runs without me.

**A note on the numbers, because it makes the point better than the prose does.** Those
figures were measured while I was working: 85 files, 63 numeric claims on the
workstation, 46 in CI. Writing this post added a surface, so the same command now
reads **86 files** and **64 claims**. The ratio is the story and the absolute number
is only meaningful with the file count next to it — which is exactly why the output
prints `22/29 matched (40 files)` and not just `PASS`.

## A floor cannot fix this

`--min-surfaces 22` is a *floor*, and a floor tolerates a known loss forever. Worse, it
**cannot tell a loss I know about from the loss of a surface nobody noticed.** If a
ninth surface had gone missing, the count would have dropped to 21 and failed — but the
seven already gone were invisible, and stayed invisible.

The flag that does the right thing, `--require-all`, already existed. It was unusable,
because under it *every* absent surface is a failure.

So the two genuine impossibilities are now **named with their reasons**:

```python
NOT_IN_CI = {
    "job-kit": "not a git repository, so it cannot be checked out; verified locally only",
    "cv": "private repository; the workflow's GITHUB_TOKEN cannot read another repo, "
          "so it needs a PAT secret before it can join the CI run",
}
```

Both the missing-surface check and the required-string check honour that list. The run
now prints what it did not read:

```
not in this checkout, and named as impossible: cv/*.html (private repository; ...),
  job-kit/*.pdf (not a git repository, ...), ...
surface declarations:    22/29 matched  (40 files)
```

**The gap is visible instead of silent, and any new absence fails the build.**

---

## The same bug, three more times

I thought that was the end of it. It was the first of four.

### A missing interpreter, reported as a missing repository

The checker re-derived **63** numeric claims on my workstation and **34** in CI. The
difference was the six test-count claims, and the reason CI gave was:

```
evidence.json tool-agentbound (suite not in this checkout)
```

**That is wrong twice.** The suite was in the checkout — it was cloned as a sibling
repository. What was missing was an *interpreter*: the count function required
`<repo>/.venv/bin/python`, and `.venv` is gitignored, so a CI checkout never has one.

The message sent the reader looking for a missing repository. That's the failure mode
of a diagnostic: it doesn't hide the problem, it **mislabels** it, and a mislabelled
problem costs more time than a silent one.

### Chasing the wrong variable

With the interpreter falling back to the job's Python, the counts became comparable —
and two of them disagreed, in CI *and* locally:

```
mcpaudit             own venv 89    fallback 59
tool-boundary-corpus own venv 58    fallback 36
```

No collection error either way. My first hypothesis was the Python version — 3.13.15 in
the repo venv, 3.14.7 in the fallback — which is plausible, because mcpaudit is a
Unicode scanner and its parametrisation follows `unicodedata`, which moves between
CPython releases.

Then I noticed something I should have looked at first: **both claims already said
`"CI on 3.11-3.13"`.** The information needed to read the difference correctly was in
the claim the whole time. So I taught the checker to parse it, and made the comparison
*authoritative* inside the stated range — outside it the two numbers are not
comparable, inside it a disagreement is real.

I moved CI to Python 3.13, inside the range, to settle it.

**CI failed, and told me I was wrong:**

```
FAIL  evidence.json: tool-boundary-corpus states 58 tests, but pytest collects 36
      on Python 3.13, which is inside the range the claim names (3.11-3.13)
```

Same version. Different count. **It was never the version.**

It was the **dependencies**. Both counts were measured in each repository's venv, which
has its requirements installed. The CI job had pytest and nothing else.

One added step — install the six tool repositories — and:

```
prose counts checked:    46
```

With **no "not re-derived" line at all**, meaning every count was re-derived. The two
claims were correct the whole time. The environment measuring them wasn't.

### Fourteen checkouts and a rate limit

Halfway through, two runs died at the *third* step with:

```
##[error]API rate limit exceeded for installation
```

Fourteen sequential `actions/checkout` steps, each making REST calls for one
repository, exhausted the GitHub API limit **before any check ran** — and the number of
sibling repositories only grows as I add surfaces. Replaced with one step that clones
all fourteen over git transport. The log now shows fourteen clean clones where three
had been failing.

---

## Coverage in CI, measured

| | counts re-derived in CI |
|---|---|
| start of this work | **34** |
| after the interpreter fallback | 40 |
| after reading the claimed Python range and installing the repos | **46** |

**And I did not reach parity.** Local checks 63. The difference is now the seven
surfaces above — the CV and the emails — which contribute counts that CI cannot read
at all. That's not a bug I fixed; it's a gap I have **named**, with the reason and the
remedy, in the output of every run.

---

## What I take from it

**The checks were always there.** In four rounds I never found a rule that was wrong.
I found four different reasons a correct rule quietly did less in CI than on my
workstation:

1. the file was not in the checkout
2. the interpreter was not in the checkout
3. the dependencies were not in the checkout
4. the checkouts themselves exceeded a rate limit

Every one produced a **PASS**. And I would not have found any of them by reading the
code — the code was right. I found them by asking a different question:

> Not "does the check pass?" but **"how many files did it read, and is that all of
> them?"**

That question is now answered in the output of every run, with the number and the
names. `22/29 matched (40 files)` is a much more useful line than `PASS`.

**A guard's failure mode is silence, and the most dangerous silence is a
well-formatted success.**

---

**The verifier:** [github.com/sushant-me/reputation](https://github.com/sushant-me/reputation)
· **The workflow that had the floor:**
[verify.yml](https://github.com/sushant-me/reputation/blob/main/.github/workflows/verify.yml)
· **Companion posts:** [A number nothing recomputes](https://sushantpoudel2028.com.np/writing/a-number-nothing-recomputes)
and [The check that could not see what it was checking](https://sushantpoudel2028.com.np/writing/the-check-that-could-not-see-what-it-was-checking)
