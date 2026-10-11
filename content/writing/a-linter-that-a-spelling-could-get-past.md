---
title: A linter that a spelling could get past
date: 2026-10-12
summary: sisakulint is a static analyser for GitHub Actions workflows. Other repositories run it in CI to gate their own workflow changes, which makes it a check that other checks depend on. If it can be got…
source: https://github.com/sushant-me/writeups/blob/main/2026-10-12-a-linter-that-a-spelling-could-get-past.md
---

## Why this page exists

`sisakulint` is a static analyser for GitHub Actions workflows. Other repositories run it in
CI to gate their own workflow changes, which makes it a check that other checks depend on. If
it can be got past, the gate it provides reports success on the thing it exists to catch.

I found a way past it. It took one bracket.

This page is the finding, the root cause, the fix, and — because the interesting part of this
kind of work is rarely the bug — the three things I got wrong while working it out.

---

## 1. The finding

Two workflows. Identical except for how one property is spelled.

```yaml
on: pull_request
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "${{ github.event.pull_request.title }}"
```

```
.github/workflows/dot.yml:6:20: code injection (medium): "github.event.pull_request.title"
is potentially untrusted. Avoid using it directly in inline scripts. Instead, pass it through
an environment variable. [code-injection-medium]
```

```yaml
on: pull_request
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "${{ github['event']['pull_request']['title'] }}"
```

```
.github/workflows/bracket.yml:1:1: workflow does not have explicit 'permissions' block. ...
```

That is the entire output. The injection finding is absent.

**The two forms are the same expression.** GitHub Actions resolves `github.event.pull_request.title`
and `github['event']['pull_request']['title']` to the same string. The sink is the same `echo`
inside the same `run:`, and the workflow is otherwise byte-identical. Both are exactly as
exploitable as each other, and one of them is invisible to the linter.

## 2. Narrowing it made it worse

My first report said the all-bracket form evades detection. Testing each position separately
showed that was too kind to the bug. One bracket is enough, anywhere:

| expression | injection findings |
| --- | ---: |
| `github.event.pull_request.title` | **1** |
| `github['event'].pull_request.title` | 0 |
| `github.event['pull_request'].title` | 0 |
| `github.event.pull_request['title']` | 0 |
| `github['event']['pull_request']['title']` | 0 |

**The fourth row is the one that matters.** `github.event.pull_request['title']` has three
ordinary dot segments and a bracket only on the final property, and detection still fails.

So the trigger is not "the root was indexed". It is the presence of an index expression
anywhere in the chain.

**And that makes it reachable by accident, not only by evasion.** `github.event.pull_request['title']`
is a natural thing to write when the property name is being computed or copied from a list. The
person writing it is not attacking anything. They get a silent pass, and the linter reports
nothing, and the workflow they wrote interpolates attacker-controlled text into a shell command.

## 3. The root cause, which is a comment that lies

The checker walks the expression and, on leaving an index node, looks up the property it indexes:

```go
case *IndexAccessNode:
    if lit, ok := n.Index.(*StringNode); ok {
        // 特別なケース、例えばgithub['event']['issue']['title']
        u.onPropAccess(lit.Value)
        break
    }
    u.onIndexAccess()
```

The comment says *"special case, e.g. `github['event']['issue']['title']`"* — so the author
expected this path to work. It does not, and the reason is one field away.

The walk visits the node's children before the node itself. For an index node the child is the
string literal, so a `leave` callback fires for it first. That literal is not one of the node
types the checker handles, so it falls to the default branch:

```go
default:
    if u.funcArgDepth > 0 {
        u.endInFuncArg()
    } else {
        u.end()
    }
```

and `end()` is what finalises a match **and clears the accumulated path**.

Instrumenting the checker to print its own state made this visible in one run:

```
onVar(github) cur=1
onPropAccess(event) cur_before=1
onPropAccess(pull_request) cur_before=1
onPropAccess('title') cur_before=1          <-- note the quotes
```

**`'title'`, not `title`.** By the time `onPropAccess` runs, it is being asked for a property
named `'title'` — with the delimiters — which does not exist, so the match dies at the last step.

The source of the quotes is the parser:

```go
return &StringNode{t.Value, t}      // pkg/expressions/parser.go:176
```

`t.Value` is the raw token. And the type's own documentation says the opposite:

> *Value is the value of the string literal. Escapes are resolved and the surrounding quotes are
> removed.*

**The comment describes an intention that the code does not implement.** Every previous step in
the chain is correct; only the leaf is wrong. A doc comment asserting a contract that the
constructor does not honour cost me two wrong hypotheses before I stopped reading and printed
the state.

## 4. The fix, and where I chose to put it

```go
u.onPropAccess(unquote(lit.Value))
```

I fixed it **at the use site**, not in the parser, and that was a deliberate trade.

`StringNode.Value` is read in several places — `semantic.go` uses it for property lookups and
for `format` placeholder matching. Changing what the field means is a broader change than this
defect requires, and one that could move the bug rather than remove it. Stripping the delimiters
where the value is treated as a **property name** is the narrow fix.

It is a local helper rather than `strings.Trim`, so that a quote that is legitimately part of a
key survives.

## 5. One fix, two sinks

The bypass was not limited to inline `run:`. The same expression in the `script:` input of a
third-party action — a different code path — was also silently missing the finding:

```yaml
- uses: actions/github-script@v7
  with:
    script: console.log("${{ github.event.pull_request['title'] }}")
```

```
before:  [commit-sha] [dependabot-github-actions] [deprecated-node-runtime]
after:   [code-injection-medium] [commit-sha] [dependabot-github-actions] [deprecated-node-runtime]
```

`code-injection-medium` is the difference and nothing else changed. Both sinks route through the
same `checkUntrustedInput` helper, which is why one line restores both.

## 6. The shell layer, which held

Having found a bypass in the expression layer, I went looking in the shell taint analysis. Six
barriers a taint tracker might plausibly miss:

| construct | result |
| --- | --- |
| multiline block scalar (`run: \|`) | flagged |
| inside command substitution `$( ... )` | flagged |
| single-quoted | flagged |
| `bash -c "..."` | flagged by **both** `argument-injection-medium` and `code-injection-medium` |
| assigned to a variable, then `eval`'d | flagged |

**Nothing.** That layer is solid, and the honest report of an audit is sometimes that you found
nothing.

## 7. The false alarm I nearly filed

While sweeping for variants of the same class, `github.event.commits[*].message` produced **no**
injection finding. It looked like a second bypass.

Then I read the finding it *did* produce:

```
unexpected token "*", while parsing variable access, function call, null, bool,
int, float or string, expected "IDENT", "(", "INTEGER", "FLOAT", "STRING" [expression]
```

`[*]` is not valid Actions syntax. The parser rejects it, so no injection finding is **correct** —
the expression could never run. A missing finding on invalid input is not a missed detection, and
reporting it as one would have been a false positive dressed as a discovery. I recorded the row in
the pull request rather than dropping it quietly.

## 8. The test I wrote that proved nothing

I shipped the fix without a regression test and said so, which was honest but not good enough.
The second attempt is worth recording because it failed in a way I did not notice.

I wrote a table test using the existing idiom in the file, driving the five expressions through
the checker:

```go
checker := NewExprSemanticsChecker(true, nil)
_, errs := checker.Check(tree)
```

**It failed on all five rows — including the dot form that works at the rule level — and failed
identically with and without the fix.** It was exercising nothing at all.

The cause was a `}}` suffix. The tokenizer requires the closing of the `${{` the value came from;
without it `Parse` fails, and that failure was being swallowed into "no untrusted input found".
Every existing test in that file ends its expressions with `}}` for exactly this reason. I had
read the file and had not asked why.

**A test that fails for the wrong reason is worse than no test**, because it looks like coverage.
I deleted it, said so in the pull request, and only re-added it once I had found the real
requirement. The version that shipped fails on the unpatched source:

```
--- FAIL: .../github.event['pull_request'].title
    semantic_case_test.go:214: github.event['pull_request'].title reaches an
    untrusted input and must be reported
```

and passes with the fix. That is a gate. The first one was decoration.

## What this is an instance of

The defect is not really about brackets, or about quotes. It is a check that reads a reduced form
of its input and reports success when the reduction removed what it was looking for.

Here the reduction was a string comparison: the checker asked whether an untrusted path had a
property named `'title'`, and the answer was no, so it reported nothing and moved on. The
information needed to detect the problem — that `'title'` and `title` differ only by their
delimiters, and that the delimiters were never supposed to be there — was available at the point
of failure. Nothing compared them.

**A check whose failure mode is silence is indistinguishable from a check with nothing to
report.** That is why the fifth row of the table above is not the interesting one. The fourth is:
a spelling that a person writes without thinking, that produces no finding, and that nobody will
investigate because there is nothing to investigate.

---

## Reporting

- [`sisaku-security/sisakulint#658`](https://github.com/sisaku-security/sisakulint/issues/658) — the finding, with the position table
- [`sisaku-security/sisakulint#659`](https://github.com/sisaku-security/sisakulint/pull/659) — the fix, the regression test, and the second sink

Verified with `go test -race ./...` (green) and `gofmt -l` (clean) on `main` at
`17c2d82151a966e6e388a17619b060ae2919712e`, and by building the CLI from source and running the
fixture workflows above. The pull request is open; the maintainer has not reviewed it, so none of
this is merged and I am not claiming it is.
