---
title: Four checks that ran on data something else had already rewritten
date: 2026-09-21
summary: I spent a day auditing my own security tools and found four vulnerabilities in them. Not four unrelated bugs — four instances of one shape: in every case the check ran against data that something…
source: https://github.com/sushant-me/writeups/blob/main/2026-09-21-four-checks-that-ran-on-rewritten-data.md
---

I spent a day auditing my own security tools and found four vulnerabilities in them. Not four
unrelated bugs — four instances of **one shape**: in every case the check ran against data that
something earlier in the same function had already transformed, and the transformation was
lossy in a direction nobody had thought about.

That shape is worth naming, because it is invisible to the obvious test. Each tool had tests.
Every test passed. They passed because the tests fed the check the same transformed data the
production path did, so a transformation that silently dropped the thing being looked for
looked exactly like a check that found nothing.

Four advisories came out of it, plus a fifth finding of a different class that mattered more
than any of them: **none of the fixes were reaching users.**

---

## The shape, stated once

```
input ──► [ transform ] ──► [ check ] ──► verdict
                ▲
                └─ drops, truncates or blanks the thing the check looks for
```

A regex without `DOTALL`. A socket read with no bound. A masker that blanks "prose". A list of
Unicode ranges that is 6% complete. Every one is a reasonable-looking line. Every one makes the
check answer confidently about data that no longer contains the evidence.

---

## 1. A deny rule a newline could walk around

`policygate` decides whether an autonomous agent may make a tool call. Rules match with globs,
and the matcher was:

```python
regex = "^" + re.escape(pattern).replace(r"\*", ".*") + "$"
return re.match(regex, value) is not None
```

No `re.DOTALL`, so `.` does not match a newline. With `deny "send_*"` and `allow "*"`:

```
send_email      -> DENY     correct
send_\nemail    -> ALLOW    the deny rule was never consulted
```

The call fell through to the broader allow and proceeded with no human in the loop. This is an
authorization bypass in a gate whose entire purpose is refusing what the policy does not cover,
and the matched value is attacker-influenced: tool names come from the MCP server being gated.

`re.fullmatch(..., re.DOTALL)` fixes it, and `fullmatch` also removes a second, quieter bug —
`$` matches before a trailing newline, so `delete_*` was matching `"delete_file\n"`, a value it
merely resembled. A pattern should match the value it was written for and nothing else.

**`GHSA-qwvv-fcmm-r3j2`, high, v0.1.1.**

## 2. A server that could kill the thing inspecting it

`mcp-nameguard` asks an MCP server for its tool list. Both transports read whatever the server
sent:

```python
response.read()                       # HTTP, no limit
for line in self._stream: ...         # stdio — see below
```

`for line in stream` is the interesting one. Iterating a pipe line-wise **buffers the whole line
before yielding it**, so a server that emits one enormous line has already spent the memory
before any check could run. The bound has to be on the read (`readline(limit)`), not on what
comes back from it.

Why this is worse than a crash: the tool exists to inspect servers it does not trust. Dying on
the reply means it reports **nothing** about a server that may be hostile. It fails open against
the exact adversary it was pointed at.

Replies over 8 MiB are now refused rather than buffered, and the HTTP client also refuses up
front when `Content-Length` announces an oversized body — while keeping the cap on the read
regardless, because that header is advisory and can be absent, wrong, or a lie.

**`GHSA-wcqw-86xv-w95q`, medium, v0.4.8.**

## 3. The masker that deleted the evidence

`agentbound` scans source for tool-boundary bugs. Comments and docstrings cannot execute, so it
blanks them first to avoid reporting documentation. The rule was: blank a string that is a
statement by itself, **or the entire right-hand side of an assignment**.

That second clause is where it went wrong. A one-line constant is how real code carries a
message:

```python
MSG = "duplicate tool name, overwriting"     ->   MSG =
logging.warning(MSG)
```

The word the rule matches on was erased. `tool-dict-last-wins` reported nothing for a duplicate
registration, so a later tool silently shadowing an earlier one went unflagged.

Two independent defects sat behind that one finding. Even with the constant intact, the rule
required the word to appear literally *inside* `.warning(...)`, so an extracted message was
invisible anyway. Both are fixed: only a **multi-line** assigned value is masked (which is what a
documentation block actually looks like), and a warning whose argument is a module-level constant
containing the word is recognised.

The trade is real and goes the stated way: a one-line string quoting an anti-pattern is now
reported where it previously was not. That is a false positive, taken against a rule that had
gone silent on real evidence. I checked: the 23-case corpus still measures the same precision,
so it is not currently costing accuracy. That sentence is in the docstring.

**`GHSA-mffv-hhg5-mm33`, medium, v0.1.12.**

## 4. Sixteen of two hundred and fifty-six

`mcpaudit` finds text a reviewer cannot see. Its range list covered `U+FE00..U+FE0F` and
described it as "variation selectors". That is 16 of 256. The supplement,
`U+E0100..U+E01EF`, is the same invisible channel with enough code points to carry a payload:

```
find_invisible("run\U000E0100now")  ->  []
strip_invisible(...)                ->  leaves it in place
summarise(...)                      ->  leaves it in place
```

The second and third lines are the sharper half. `strip_invisible` and `summarise` are the
helpers whose job is showing a reviewer **what the text actually contains**, and they share the
range list. A payload hidden in the supplement survived the "human view", so the rendering a
person trusts still carried it.

The same gap existed for characters the list appeared to cover *by class*: `U+3164` and
`U+FFA0` were listed, but those are the compatibility forms of the Hangul fillers — the
canonical `U+115F` and `U+1160` were not covered at all.

The fix is not a longer list. It is a classification that **cannot be merely incomplete**: every
code point in Unicode category `Cf` is either listed as invisible, or listed with a reason as one
that renders (like the Arabic and Kaithi number signs, which must not be stripped out of a
reader's text). A test fails if a new one is neither. That test is the actual fix; the ranges are
what it found.

**`GHSA-62f4-h552-54wc`, medium, v0.1.2.**

---

## And the same bug was in the checker I was writing all of this down with

While writing this post I audited the script that verifies every claim in it. It had the same
defect, in a place I had been trusting more than any of the four above.

`check_surfaces.py` refuses to let a PDF drift from the HTML it was rendered from, because
`PROPOSAL.pdf` once kept carrying a superseded corpus count for several rounds after the number
had been fixed in the Markdown and the HTML. The comparison is a set difference:

```python
stale = sorted(numbers(read(pdf)) - numbers(html_text(source)))
```

`read()` shells out to `pdftotext` and returns an empty string if that fails. An empty string has
no numbers in it, so the difference is empty, so **the check reports nothing**. It could not tell
"the PDF agrees with its HTML" from "the PDF was never read". Reproduced on a PDF made genuinely
stale by removing a number from its HTML:

```
with pdftotext present : FAIL   (caught, as intended)
with pdftotext absent  : PASS   (the stale PDF slips through)
```

The workflow had never installed poppler-utils. It worked because the runner image happens to
ship it, which is *why* nobody noticed: the dependency went unstated precisely because stating it
was never necessary.

The fix is to assert the read, not just the comparison, and the CI now mutation-tests the guard —
`pdftotext` is hidden behind a command that fails and the checker is *required* to go red. A guard
whose failure mode is silence has to be checked by making it fail on purpose.

---

## Why the existing tests could not see any of this

Every one of these packages had tests, and every test passed.

The tests were written through the same path as production. A test asserting that
`tool-dict-last-wins` fires on a duplicate registration wrote the message inline, because that is
the natural way to write the fixture — so it never exercised the extracted-constant form, which
is the form that gets masked. A test for the invisible-character layer tried `U+FE00`, the first
variation selector, because that is the character you think of. The scan for `send_\nemail` needs
a newline *inside* a value, which no fixture had a reason to contain.

**A test that shares a transformation with the code under test cannot see what the
transformation removes.** The reproduction has to come from outside — from the shape of the input
space, not from the shape of the existing fixtures.

So each fix here landed with a test written the other way round: assert the bypass, then assert
the fix closes it. `strip_invisible(smuggled) == "ignore previous instructions"` fails on the old
code and passes on the new one. A test that only exercises the fixed path proves nothing about
whether there was a bug.

---

## The finding that mattered more: the fixes were not reaching anyone

`agentbound`'s README documents:

```yaml
- uses: sushant-me/agentbound@v1        # moving major tag
```

`v1` was sitting on a commit from four releases earlier. It did not contain v0.1.12 — the
masking fix. **Every user who followed the documentation was running the vulnerable build.**

The root cause was that there was no release automation at all: one `ci.yml` and nothing that
moves the tag. A "moving major tag" that does not move is worse than a pinned one, because the
pin is a promise and the moving tag is a promise nobody is keeping.

Then the same class turned up in the consumers:

- `mcpaudit`'s CI pinned `policygate` at a commit from before the glob fix — so its integration
  tests were validating a policy gate whose deny rules were bypassable, and reporting success.
- The `tool-boundary-corpus` harness pinned **both** detectors before their fixes, so the
  benchmark was re-measuring precision against the unfixed builds.

Fixing a vulnerability and shipping it are different acts. A merged fix that no consumer installs
is a fix on paper. That is why the tag now moves on every release, a weekly job fails if it falls
behind, and the consumer pins were advanced and re-measured — 54 tests, same scores, so the
fixes cost no accuracy.

---

## What I would tell someone about to do this

1. **Ask what shape the check receives, not what it looks for.** The bug is upstream of the
   check, in the transform.
2. **A bounded-completeness claim needs a test, not a longer list.** "16 of 256" is what an
   enumeration looks like when nobody counted.
3. **Fail-open is the failure mode to hunt in security tooling.** A scanner that dies, or returns
   empty, against a hostile input reports the same thing as a clean scan.
4. **Write the regression before the fix**, from the bypass, not from the fixture. If it passes
   on the unfixed code, it is not testing the bug.
5. **Assert that the input was read, not only that it compared equal.** An empty input makes
   almost every check pass, and a check that passes when it read nothing is indistinguishable
   from a check that found nothing wrong.
6. **Check that the fix ships.** Tags, pins and locks are where a security fix goes to die.

Four advisories are published with reproductions and regression tests, CVE identifiers have been
requested, and the claims are re-checked weekly by
[sushant-me/reputation](https://github.com/sushant-me/reputation) — which goes red if an advisory
is withdrawn or stops saying what is claimed about it.
