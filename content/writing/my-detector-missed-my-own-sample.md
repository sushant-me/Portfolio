---
title: My detector missed the bug in my own sample
date: 2026-10-29
summary: agent-review-sample is a deliberately vulnerable 180-line agent, written so that "I review agent security" is something a reader can run rather than something I assert. It has four planted findings,…
source: https://github.com/sushant-me/writeups/blob/main/2026-10-29-my-detector-missed-my-own-sample.md
---

[agent-review-sample](https://github.com/sushant-me/agent-review-sample) is a
deliberately vulnerable 180-line agent, written so that "I review agent security" is
something a reader can run rather than something I assert. It has four planted findings,
each with a reproduction, a fix, and a section on what was *not* tested.

Then I ran [agentbound](https://github.com/sushant-me/agentbound) — my own tool, the one
that exists to find that class of bug — over it. It returned nothing.

## What the sample does

Its first finding is a registry that accepts a plugin under a name it already holds:

```python
def register(self, tool: Tool, *, plugin: bool = False) -> None:
    if tool.name in self._tools:
        # A warning is not a guard: execution continues and the assignment
        # below overwrites whatever was there.
        print(f"warning: duplicate tool name {tool.name!r} ignored", file=sys.stderr)
    self._tools[tool.name] = tool
```

The comment is the finding: the warning is emitted, the execution continues, and the
assignment overwrites. A plugin can take a built-in tool's name and become the
implementation the model calls.

That is the exact shape of agentbound's `tool-dict-last-wins` rule, which was written
after the same bug in a real framework. So the detector should have fired, and it did
not.

## Why it was silent

The rule fires when a file reports a duplicate *and* then assigns unconditionally. The
"reports a duplicate" half is a helper, and the helper had a receiver model:

```python
def _warns_about_duplicates(text: str) -> bool:
    """Whether the file reports a duplicate through a logger.

    Receiver names are classified, not enumerated: `logging`, a name bound to
    `logging.getLogger(...)`, or any name ending in `logger` in any case.
    """
```

Logger receivers. The sample does not use a logger; it prints to stderr, because a
warning belongs on stderr and stdout in that file is the tool-protocol channel. So the
rule's precondition never held, and a file that warns about a duplicate and then silently
overwrites it was invisible.

The rule was not wrong about the bug. It was wrong about the spelling of the warning.

## Before believing a zero

A detector reporting nothing has two possible meanings, and I had just been given the one
that means "I am fine". The corpus is how you tell them apart: it has a positive case for
this rule, so I pointed the detector at that case first, outside the sample.

```
$ agentbound scan <fixture> --json
[
  {
    "rule": "tool-dict-last-wins",
    "severity": "medium",
    "message": "tool dict 'tools_dict' assigned unconditionally on a name key; ..."
  }
]
```

One finding on the case the rule was written for, nothing on the sample. That made the
zero in the sample a real result rather than an installation problem — the detector
worked, and the sample was the blind spot.

## The fix, and where it stops

The helper now accepts a report that is not a logger call, with one constraint:

```python
    # `print(..., file=sys.stderr)` — a diagnostic that is still only a report.
    for line in text.splitlines():
        if "print(" not in line or "sys.stderr" not in line:
            continue
        if "duplicate" in line.lower():
            return True
```

A print to **stderr** naming the duplicate counts. A print to **stdout** does not: that is
ordinary program output, not a diagnostic about the duplicate, and treating it as one
would make the rule fire on anything that echoes its registry. The rule's message no
longer claims logging is the only way a duplicate gets reported, which it did.

Two tests came with it — the sample's shape is detected, and the same code with the print
going to stdout is clean. Deleting the stderr loop makes the first one fail, which is the
check that it tests the thing it says it tests.

## A benchmark measures releases, so this became a release

[The corpus](https://github.com/sushant-me/tool-boundary-corpus) scores *released*
detector builds — deliberately, because a number measured against an unreleased branch
describes something nobody can install. So the fix needed a version:

- [agentbound v0.1.16](https://github.com/sushant-me/agentbound/releases/tag/v0.1.16)
  carries it, and the moving `v1` tag points at the same commit
- the corpus gained
  [a 24th case](https://github.com/sushant-me/tool-boundary-corpus/blob/main/cases/code-duplicate-warned-to-stderr.json),
  a positive whose duplicate is reported to stderr and then assigned anyway
- re-measured at that release: **precision 1.000, recall 1.000** across the six code
  cases, and the corpus's own suite is 58 tests
- agentbound's suite collects **142 tests**, two of them the pair above

Every one of those numbers is in a file that a weekly check re-derives, which is the only
reason I trust quoting them.

## What I changed about the process

The sample had a `demo.py` that reproduces all four findings and a `pytest` suite that
runs them. It was well tested, in the sense that it tested the sample. What it never did
was point the *detector* at the sample, and that is the gap: a fixture you never scan is
documentation of what you believe, not evidence about what your tool finds.

Two habits came out of the day, and neither is expensive:

1. **Run the detector against the thing you wrote to be caught.** Not just the corpus
   cases that encode it — the full sample, as a user would. The corpus can only find what
   somebody thought to add to it; an adversarial sample is a second, independent
   instrument.
2. **A zero is a claim, so verify it against a known positive first.** One scan of a
   fixture the tool must flag separates "my tool is fine" from "my tool is not running".
   That distinction cost one command and would have saved the entire detour.

The false negative was in the detector, the fix was in the detector, and the release that
carries it was measured by the corpus that found it — which is the loop working, just not
in the direction I expected when I started the day.
