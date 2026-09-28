---
title: My own benchmark said 1.000. Real code said 0.14.
date: 2026-09-28
summary: A week ago I wrote about a labelled corpus that found a false positive in my own scanner and took its precision from 0.750 to 1.000. That number was true, and it was also misleading, because I wrote…
source: https://github.com/sushant-me/writeups/blob/main/2026-09-28-my-benchmark-said-1000-real-code-said-014.md
---

A week ago I wrote about a labelled corpus that found a false positive in my own scanner
and took its precision from 0.750 to 1.000. That number was true, and it was also
misleading, because **I wrote the corpus.** It contained the mistakes I had already
thought of. So I did the obvious thing and pointed the scanner at code nobody had written
for it.

On `google/adk-python` it reported **21 production findings. Nineteen of them were wrong.**

| repo | production findings before | after | what remains |
|---|---|---|---|
| `google/adk-python` | 21 | **3** | the real `_RESERVED_TOOL_NAMES` omission, `tool-dict-last-wins`, `confirmation-gate-fails-open` |
| `google/adk-go` | 2 | 2 | `tool-inmodel-name-unoccupied` |
| `google/adk-java` | 8 | 8 | `tool-inmodel-name-unoccupied` |
| `openai/openai-agents-python` | 0 | 0 | clean |

Precision on `adk-python` production code: **0.14 → 1.00**, with no true positive lost.

The reason this is worth writing down is not that I found a bug. It is that **the corpus
was not capable of finding it**, and I would have published the 21 findings if I had
trusted the corpus number.

---

## What the false positives were

Every one was a single rule, `tool-reserved-name-shadowing`, and every one was a constant
that contains the words "tool" and "name" without reserving anything:

| constant | what it actually is |
|---|---|
| `DEFAULT_GCS_TOOL_NAME_PREFIX = "gcs"` | a **prefix** — same shape in 4 files |
| `DEFAULT_SPANNER_TOOL_NAME_PREFIX`, `DEFAULT_BIGTABLE_TOOL_NAME_PREFIX`, `DEFAULT_MONGODB_TOOL_NAME_PREFIX` | same |
| `FINISH_TASK_TOOL_NAME = "finish_task"` | the name of **one** tool the module provides |
| `_LIST_SKILLS_TOOL_NAME = "list_skills"` — six of them in `skill_toolset.py` | a toolset's **own** tool names |
| `RESERVED_TOOL_CALL_ERROR_TYPE = "RESERVED_TOOL_CALL"` | an **error tag** |

The rule read each as a reserved-name *set*, and then reported that
`set_model_response` was "missing" from it. The message it generated was, verbatim:

> framework-owned tool 'set_model_response' is registered (def set_model_response) but
> missing from reserved set 'DEFAULT_GCS_TOOL_NAME_PREFIX'

`DEFAULT_GCS_TOOL_NAME_PREFIX` is a prefix. Nothing is missing from it, because it is not
a set and never claimed to be. Nineteen findings shaped like that would have gone out
under my name, about Google's code.

## Two fixes that did not work, and why

**First attempt: exclude the obviously-non-set suffixes.** `PREFIX`, `SUFFIX`, `ERROR`,
`TYPE`. This removed **14 of the 19** — the four `*_TOOL_NAME_PREFIX` constants and
`RESERVED_TOOL_CALL_ERROR_TYPE`, each reported twice. Five remained, and the rule still
fired on real code.

**Second attempt: require a vocabulary of two or more constants.** The reasoning was that a
*lone* `FINISH_TASK_TOOL_NAME = "finish_task"` is one tool's name, whereas
microsoft/agent-framework genuinely declares a reserved vocabulary two constants at a
time, with `LIST_TOOLS_TOOL_NAME` and `SET_MODEL_RESPONSE_TOOL_NAME` side by side. That
removed 3 more.

It left `skill_toolset.py`, which declares **six**:

```
_LIST_SKILLS_TOOL_NAME = "list_skills"
_SEARCH_SKILLS_TOOL_NAME = "search_skills"
_LOAD_SKILL_TOOL_NAME = "load_skill"
_UNLOAD_SKILL_TOOL_NAME = "unload_skill"
_LOAD_SKILL_RESOURCE_TOOL_NAME = "load_skill_resource"
_RUN_SKILL_SCRIPT_TOOL_NAME = "run_skill_script"
```

Six constants is a vocabulary by any shape test. It is also **the wrong direction**: those
are the tools the toolset *provides*, not names it *protects*. And the same file tests one
of them — `if _LIST_SKILLS_TOOL_NAME in selected_core_tools:` — so a membership test
cannot separate the two cases either.

That was the part worth learning. **A constant list has a direction, and the shape does
not tell you which way it points.** `_RESERVED_TOOL_NAMES` is consulted to refuse an
incoming name. `_LIST_SKILLS_TOOL_NAME` is consulted to decide what to offer. They are
textually similar and semantically opposite.

## The fix

The bar for the single-constant shape is now the word `RESERVED`. It is a narrower rule
than the one I wanted to write, and it is the one the evidence supports.

The shape with unambiguous evidence is untouched: `_RESERVED_TOOL_NAMES =
frozenset({...})` is a set literal whose members are framework-owned tool references —
`transfer_to_agent.__name__` and friends — not strings that could be anything. That is the
shape the rule was built for, and it is the one that found the original bug.

Four regression tests now carry the real constant names above, so the mode cannot come
back silently: `test_reserved_name_shadowing_ignores_lone_tool_name_constant`,
`..._ignores_tool_name_prefixes`, `..._ignores_reserved_error_type`, and
`..._ignores_a_tools_own_name_vocabulary`.

There is one honest cost. The previous release added single-constant detection on purpose,
for the microsoft/agent-framework shape, and one test pinned it. That test now uses the
two-constant shape that framework actually has, and a new test asserts the single-constant
case is **not** reported. I changed a pinned test, which is the move that hides a
regression when it is done quietly — so it is stated here, and the reason is measured rather
than aesthetic.

**Tests went 129 → 137.** Shipped as [v0.1.13](https://github.com/sushant-me/agentbound/releases/tag/v0.1.13).

## The rule I took away

**A benchmark the author wrote to prove their own detector works will not contain the
shapes that break it.**

The corpus has 23 labelled cases, every one citing the real-world pattern it came from. It
is genuinely useful — it found a different bug, and it keeps the regression honest. What it
cannot do is contain the false-positive modes I had not imagined. Its 1.000 was a statement
about the corpus, and I had been reading it as a statement about the detector.

The second rule is narrower and I have not seen it stated: **when a rule keys on an
identifier, the identifier's direction matters as much as its shape.** "Contains the word
set" is not "is a set of things we refuse". Both of my failed fixes were attempts to
sharpen the shape test. Neither could have worked, because shape was never the missing
information.

## What I did not do

- I did **not** publish the 21 findings. That is the whole point of the exercise, and it is
  worth saying plainly: the headline "21 agent tool-boundary bugs in Google's ADK" was
  available, wrong, and would have been cited.
- I did **not** fix the two `adk-go` / `adk-java` `tool-inmodel-name-unoccupied` findings or
  the eight in `adk-java`. Those are real and already reported upstream.
- I have **not** run this at scale across the wider ecosystem yet. Four frameworks is a
  sample, not a survey, and the numbers above say nothing about projects I did not scan.
- The `agentbound` **v0.1.12 → 0.1.13 bump was itself caught by a test** — the same
  version-drift regression written when v0.1.10 shipped with `__version__ = "0.1.9"`. I
  bumped `pyproject.toml` and not `__init__.py`, and the suite failed on the next run. It is
  a small thing that argues for the same conclusion at a different layer: the check you
  wrote for a past mistake is the one that keeps working.

---

**The fix:** [agentbound v0.1.13](https://github.com/sushant-me/agentbound/releases/tag/v0.1.13)
· **The corpus:** [github.com/sushant-me/tool-boundary-corpus](https://github.com/sushant-me/tool-boundary-corpus)
· **The measurement:** [the Precision section of the README](https://github.com/sushant-me/agentbound#precision-on-real-code--21-findings-3-real-and-the-rule-that-changed)
· **Every claim above is re-checked weekly against its public source by**
[github.com/sushant-me/reputation](https://github.com/sushant-me/reputation).
