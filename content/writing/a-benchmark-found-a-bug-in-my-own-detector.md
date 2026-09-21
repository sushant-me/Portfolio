---
title: A benchmark found a bug in my own detector — 0.750 to 1.000
date: 2026-09-21
summary: I built a labelled corpus of agent tool-boundary bugs to stop myself making claims about detectors that I had not measured. The first thing it did was find a false positive in my own published…
source: https://github.com/sushant-me/writeups/blob/main/2026-09-21-a-benchmark-found-a-bug-in-my-own-detector.md
---

I built a labelled corpus of agent tool-boundary bugs to stop myself making claims about
detectors that I had not measured. The first thing it did was find a false positive in my
own published scanner, and the fix took an evening.

The numbers, because they are the point:

| detector | before | after |
|---|---|---|
| `mcpaudit` (declaration scanner) — 14 cases | P=1.000 R=1.000 | P=1.000 R=1.000 |
| `agentbound` (code scanner) — 5 cases | **P=0.750** R=1.000 | **P=1.000** R=1.000 |

Precision is where the story is. Recall was never the problem: `agentbound` found all three
planted bugs. It also reported a fourth finding that does not exist, and a scanner that cries
wolf is a scanner people turn off — which is the same outcome as one that misses everything.

---

## What the corpus is

Eighteen cases, each a small fixture with a label, the rule that should fire, and the source
of the pattern: the Google ADK pull requests, MCP annotation semantics, the Unicode tag block
used for ASCII smuggling, homoglyph tool names, and one case taken from a bug in
`agentbound` itself.

A detector is **a command that prints JSON**, so nothing in the harness knows about either of
my tools:

```bash
python3 -m corpus.cli run --kind code --detector 'agentbound scan {input} --json'
python3 -m corpus.cli run --kind tool-list \
  --detector 'python3 -m mcpaudit.cli audit {input} --json --no-colour'
```

`--kind` is not a convenience. Scoring a declaration scanner on framework source reports
recall 0 for a tool doing its job; a number is only meaningful for the inputs a detector
claims to handle.

## The false positive

Case `code-pattern-only-in-comments` is this file — line 6 is the one that got reported:

```python
# Never do this: self.tools_dict[tool.name] = tool after a warning.
# Also never ship _RESERVED_TOOL_NAMES = frozenset() missing set_model_response.
DOCSTRING = """
    if tool.name in self.tools_dict:
        logger.warning("duplicate")
    self.tools_dict[tool.name] = tool        # <- line 6, and it does not execute
"""
```

The whole file is documentation. `agentbound` reported `tool-dict-last-wins` at line 6, inside
the string.

Its masking module already knew this class of mistake: it blanked every comment and every
*bare* string statement (a docstring), because the project's own CI had gone red for three
commits when a rule matched the comment block that documents the idiom it detects — the two
comment lines above are themselves the regression fixture for that. And it deliberately left
string **arguments** visible, because `tool-dict-last-wins` reads the logging call's message
text as evidence — masking all strings was the first version of that fix, and it silently
disabled the rule.

A string *assigned to a name* fell between the two categories: not a docstring, not an
argument, so it was scanned as code. The fix extends the prose classifier to a string that is
the entire right-hand side of an assignment. Everything else stays visible, which three tests
pin from both sides:

```python
# still a finding: the strings are a literal the reserved-set rule reads
_RESERVED_TOOL_NAMES = {"finish", "transfer_to_agent"}

# still a finding: the message is an argument, not prose
logger.warning("duplicate tool name")
tools_dict[tool.name] = tool

# no longer a finding: a string bound to a name is documentation
DOC = """... tools_dict[tool.name] = tool ..."""
```

## Why nothing was deleted, and why the CI went red on purpose

The tempting move with a failing case is to delete it. The second-most-tempting is to make
the build green and move on. Both destroy the value of a benchmark.

So the case stayed **failing**, and the CI step that ran it carried:

```
--known-failure code-pattern-only-in-comments
```

That flag does three things. The named case is reported as an expected failure rather than
counted. **Any other failure still fails the build.** And — the part that matters — a known
failure that starts *passing* is itself an error:

```
corpus: code-pattern-only-in-comments now passes — remove it from --known-failure
```

Which is exactly what happened when [agentbound
v0.1.10](https://github.com/sushant-me/agentbound/releases/tag/v0.1.10) shipped the fix. The
entry could not rot into a benchmark that quietly guards one case less: the build went red
until I removed it and tightened the gate from a recall floor to **precision and recall**.

## What the fix cost, and what it bought

```
agentbound's own tests                 111 -> 114   (three added: the assigned string,
                                                     the control beside it, and the
                                                     set-literal guard)
agentbound scan agentbound (contract)  exit 0 -> exit 0
repository-root scan                   25 -> 16     (the nine removed are fixture
                                                     strings inside test constants)
corpus precision                       0.750 -> 1.000
```

I first published that test count as **114 → 117**, and it was wrong at both ends. The number
came from counting the file I had just edited rather than the suite, and it survived a
commit, a README table and the first draft of this post before a `--collect-only` disagreed
with it. The fix is in the same commit that made me look.

## Two of my fixtures were wrong, and I published that too

Before finding the real false positive, the corpus reported two misses. The tempting
conclusion — "my detector has a recall gap" — was wrong both times.

`tool-reserved-name-shadowing` fires when a framework **defines** a tool (`def
set_model_response(`) *and* omits it from its reserved set. My fixture had the incomplete set
but never defined the tool, so it was never an instance of the documented pattern.

`confirmation-gate-fails-open` needs the whole relation: a signature assignment, the
parameters extracted from it, and a dict comprehension filtering arguments by them. My
fixture had the first link only.

The corpus was wrong. The fixtures now encode the documented preconditions, and the
investigation is written into the corpus README, because "the benchmark was wrong" is a
result too.

## The guard that found a third defect before it did its job

The corpus asserts a score against a *release*, so the test has to know which build it is
scoring. I added that check — and writing it meant running `agentbound --version` for the
first time, which printed:

```
0.1.9
```

on the **v0.1.10** release. `pyproject.toml` carried the bump; `agentbound/__init__.py` did
not; nothing compared them. The CLI, the tag, the release name and `pip show` had disagreed
for a release, and any consumer pinning the project by version had no way to tell which build
it got. That consumer was the benchmark, whose entire method is naming the build a number came
from.

The v0.1.10 artifact is immutable, so
[v0.1.11](https://github.com/sushant-me/agentbound/releases/tag/v0.1.11) carries the fix. What
carries the *guard* is a test that compares `agentbound.__version__` to `pyproject.toml`: a
second version string no test reads is a second version string that drifts again. Verified by
mutation — setting `__version__` back to `0.1.9` fails the test, and restoring it passes.

There was a false alarm on the way in, and it is the reason the check exists. Before the
version check, the corpus test measured whatever `agentbound` was on `PATH`. Mine was **0.1.8**,
a stale local install three releases behind, and it reported:

```
cases:    5   passed: 4   errors: 0
precision=0.750  recall=1.000  f1=1.000
```

That is the exact number this repository exists to prove was fixed. The bug, not the fix —
and the test could not tell the difference, because it never asked which detector it was
measuring. Both detector rows now identify the build first: `agentbound` by its reported
version, `mcpaudit` by the commit `pip` installed from, since it is pinned to a commit and its
version string is not bumped per commit. A mismatch skips with a message naming both builds,
and CI sets `CORPUS_REQUIRE_DETECTORS=1` so the skip becomes a failure there — because a
detector that fails to install would otherwise take the benchmark down to the harness's own
tests and still show green.

## Two tests that were green in CI and red on a clean checkout

The same round turned up a quieter one. Two tests loaded `scripts/recall_audit.py` with
`import_module("scripts.recall_audit")`, which resolves only when the repository root is on
`sys.path`:

```bash
python -m pytest tests/    # working directory on sys.path  -> 114 passed, green
pytest tests/              # not on sys.path                -> 2 failed
```

CI ran the first form, so the suite was green there and red for anyone who ran it the other
way. The tests load the file by path now, one test pins that mechanism, and CI runs **both**
invocations — the stricter one included — so the two cannot diverge again unnoticed.

Three defects, one shape: a number that nothing checked. The test count was wrong, the version
was wrong, and the score was being measured from a build nobody had identified. Each fix is an
assertion, not a correction.

## The mistake that made the harness worth trusting

My harness's contract said a detector prints `{"findings": [...]}`. The first real detector I
pointed it at prints a **bare list** — because I had written the contract by imagining my own
tool. A benchmark that only understands its author's output format is not a benchmark; it is
a very elaborate assertion.

The harness now accepts both shapes, and it is tested against fake detectors whose scores are
known in advance: a perfect one, a silent one, a trigger-happy one, a crashing one, and one
that prints prose instead of JSON. A harness that flatters every input fails its own suite —
otherwise "precision 1.000" means nothing.

## The caveat, stated where the numbers are

**I wrote both the corpus and the detectors it scores.** A self-authored benchmark overstates
performance, and every report the tool prints says so. What partly mitigates it: the positives
cite where each pattern came from in the real world, the negatives are the *correct*
implementation of the same job — which is where precision is actually decided — and the fake
detectors keep the harness honest. Treat these as a regression gate, not an independent
benchmark.

---

**The corpus:** [github.com/sushant-me/tool-boundary-corpus](https://github.com/sushant-me/tool-boundary-corpus)
· **The fix:** [agentbound v0.1.10](https://github.com/sushant-me/agentbound/releases/tag/v0.1.10)
· **The version fix it turned up:** [v0.1.11](https://github.com/sushant-me/agentbound/releases/tag/v0.1.11)
· **Every claim above is re-checked weekly against its public source by**
[github.com/sushant-me/reputation](https://github.com/sushant-me/reputation).
