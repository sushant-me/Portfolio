---
title: Nineteen findings, four of them wrong, four different ways
date: 2026-09-28
summary: I took the static detector I have been building for agent tool-boundary bugs and pointed it at 14 real agent frameworks — codebases written by other people, for other reasons, with no idea a detector
source: https://github.com/sushant-me/writeups/blob/main/2026-09-28-nineteen-findings-four-wrong-four-ways.md
---

I took the static detector I have been building for agent tool-boundary bugs and
pointed it at **14 real agent frameworks** — codebases written by other people, for
other reasons, with no idea a detector would read them.

It reported 19 findings. **Four were wrong, and no two were wrong the same way.**

That is the useful part. A single false positive tells you a rule is too loose. Four
of them, in four mechanisms, tells you something about how the rules were built.

| rule | findings | true | false |
|---|---|---|---|
| `tool-inmodel-name-unoccupied` | 10 | 10 | 0 |
| `tool-reserved-name-shadowing` | 1 | 1 | 0 |
| `tool-dict-last-wins` | 1 | 1 | 0 |
| `confirmation-gate-fails-open` | 3 | 1 | **2** |
| `ci-agent-missing-author-association` | 1 | 0 | **1** |
| `guard-name-normalization-asymmetry` | 3 | 2 | **1** |

Every one of the 19 was opened in the source before it was graded. **A finding I
have not read is not a finding**, and the reason is in the fourth row below: one of
the false positives was `CRITICAL`, and it would have gone out under my name about
someone else's CI security.

---

## The four mechanisms

### 1. Correlating three patterns across a whole file

`confirmation-gate-fails-open` looks for a signature being introspected and the
call arguments then filtered by it:

```python
signature = inspect.signature(target)        # the introspection
valid_params = set(signature.parameters.keys())   # the parameter set
args_to_call = {k: v for k, v in kw.items() if k in valid_params}   # the filter
```

The real defect is one function, three lines apart. But the rule matched each of the
three **anywhere in the file** and then asked whether a shared variable name linked
them. In `microsoft/agent-framework` it linked a **JSON schema generator** —

```python
def generate_schema_from_serialization_mixin(cls):
    sig = inspect.signature(cls)          # reading a dataclass's annotations
```

— to an unrelated dict comprehension elsewhere in the same file that happened to
filter a set called `valid_params`. Together they looked exactly like a
confirmation gate. Two `HIGH` findings, both about schema generation.

**Fix:** the three matches must fall within 1200 characters of each other. The
reference true positive spans about 110. A module spans tens of thousands.

### 2. A regex that anchored on a string literal

The second one survived that fix, which was informative. This pattern:

```python
r"\{[^{}]*?\bfor\b[^{}]*?\bif\s+([A-Za-z_]\w*)\s+in\s+(?P<valid>[A-Za-z_]\w*)"
```

begins at any `{`. In `agent-framework` it found one inside a **string literal** —
`input_str.strip().startswith("{")` — and then spanned **thirteen lines** to a
completely unrelated loop:

```python
if input_str.strip().startswith("{"):        # <- the { it anchored on
    ...
common_fields = ["text", "message", "content"]
sig = inspect.signature(target_type)
params = list(sig.parameters.keys())
for field in common_fields:
    if field in params:                      # <- where it ended
```

A `for` loop with a membership test inside it is not a dict comprehension. The
`{` must now open a real one (`{ NAME :`), so the key expression has to follow
immediately — which `{")` does not.

### 3. A gate on the enclosing group, not the arm

This is the one that matters, because the rule reported `CRITICAL`.

`ci-agent-missing-author-association` splits an `if:` on `||` and asks whether *the
arm* carries the `author_association` check. That is the right question for a
dispatcher, which writes:

```yaml
if: |
  (github.event_name == 'issue_comment' && ... && contains(..., github.event.comment.author_association)) ||
  (github.event_name == 'issues' && ...)      # ungated -> real finding
```

`pydantic/pydantic-ai` writes the other valid shape, which puts the gate on the
whole group:

```yaml
    if: |
      (
        (github.event_name == 'issue_comment' && ...) ||
        (github.event_name == 'issues' && ...)
      ) && contains(fromJSON('["OWNER","MEMBER","COLLABORATOR"]'),
             github.event.comment.author_association || ...)
```

`(A || B) && gate` gates A and B alike. But no arm *segment* contains `gate` — it
sits after the closing paren — so the rule saw an ungated `issues` arm and said any
GitHub user could reach an agent.

**I got this wrong twice before it worked, and both mistakes are the same mistake:**

- My first fix depended on the helper that locates an `if:` block by indentation.
  That helper returns `None` for this file. The fix never ran.
- My second stopped at the **first** `)` that closed a group opened before the arm.
  That is the arm's *own* wrapper — the file wraps it twice — not the gated group.

It needed to walk the raw text and keep walking *outwards* through nested groups.

### 4. A set that was nearby, not a set that was doing the work

`guard-name-normalization-asymmetry` exists because langchain builds a protected
set **normalized** and tests the incoming name **raw**:

```python
(self.config tools...).strip()                    # line 188: normalized when built
if request.tool_call["name"] not in self._tool_names:   # line 223: raw when tested
    return handler(request)                       # skips the classifier entirely
```

That is real. The rule found it, and it is the one true positive I am happiest about.

But it found it in `agent-framework` too, where the pairing was:

```python
seen_names: set[str] = set()          # a dedup accumulator
...
if skill.frontmatter.name in seen_names:   # "have I seen this already?"
    logger.warning("Duplicate archive skill name '%s'...")
```

The rule scanned back 600 characters from **any** `.strip()` and accepted a
`set(...)` constructor it found in that window. A dedup accumulator declared a dozen
lines earlier got paired with a stray `.strip()`, and a duplicate check became a
security guard.

**Fix:** the normalization must fall *inside* the constructor's own parentheses.
That is what separates `frozenset(x.strip() for x in ...)` from a `set()` that
merely happens to be nearby.

---

## What the four have in common

**Every one was a rule reading locally and judging something whose meaning came from
the structure around it.**

- Three patterns anywhere in a file are not a function.
- A `{` inside a string literal does not open a comprehension.
- An arm's gate may be on the group that contains it.
- A set 600 characters away is not the set being tested.

If you had asked me before this what my detector's weakness was, I would have said
"the patterns are regexes, so they will be fooled by obfuscation." That is not what
happened once. **All four failures were structural, not lexical.** The regexes
matched exactly what they were written to match; what was missing was any notion of
scope.

That is also why fixing them was not tuning. Narrowing a pattern would have made the
rule miss the real bug. Every fix had to add a structural constraint — proximity,
containment, enclosing scope — and every one had to keep the true positive firing.

## The measurement

| | findings | true | false | precision | tests |
|---|---|---|---|---|---|
| first run | 19 | 15 | 4 | 0.79 | 129 |
| after the first two fixes | 17 | 15 | 2 | 0.88 | 139 |
| after all four | **15** | **15** | **0** | **1.00** | **140** |

**The number that matters is in the second column, and it never moved.** The detector
still finds the real confirmation gate in `google/adk-python`, still finds the
normalization asymmetry in `langchain`, and still reports the same 10
`tool-inmodel-name-unoccupied` findings across `adk-go` and `adk-java`. A fix that
had made a rule quieter would have shown up here as a dropping true-positive count.
It is the check that the fixes narrowed the rules rather than silencing them.

Two of these fixes were tempting to do the wrong way. Making the confirmation-gate
rule skip anything involving `inspect.signature` would have removed both false
positives instantly — and also the real bug, since that is exactly what the real bug
does.

## What I am not claiming

- **14 frameworks is a sample, not a survey.** All of these are popular
  Python/TypeScript agent frameworks. Nothing here says anything about a Java or Go
  codebase, or about a framework I did not clone.
- **The corpus is still mine.** It has 23 cases and this exercise changed my view of
  it: it is a regression gate, not an independent benchmark, and it cannot contain
  the mistakes I have not made yet. That is now written into `SURVEY.md`.
- **Zero false positives on 14 repositories is not zero.** It is the first sample
  where I have none.
- The `adk-go` and `adk-java` rows are **corroborated rather than line-checked** —
  they cover the same names as the open upstream fixes `adk-go#1606` and
  `adk-java#1515`. Ten findings I have not read line by line, marked as such.

---

**The tool:** [github.com/sushant-me/agentbound](https://github.com/sushant-me/agentbound)
· **The survey, with every false positive quoted:**
[SURVEY.md](https://github.com/sushant-me/agentbound/blob/master/SURVEY.md)
· **The releases this came in:** [v0.1.13](https://github.com/sushant-me/agentbound/releases/tag/v0.1.13),
[v0.1.14](https://github.com/sushant-me/agentbound/releases/tag/v0.1.14),
[v0.1.15](https://github.com/sushant-me/agentbound/releases/tag/v0.1.15)
· **Every claim above is re-checked weekly against its public source by**
[github.com/sushant-me/reputation](https://github.com/sushant-me/reputation).
