---
title: Two defects my tests could not see, found by a bot
date: 2026-10-29
summary: A review bot read two small pull requests against sisakulint, a static analyser for GitHub Actions workflows, and raised five findings between them. Two were real. One was a data race I had just…
source: https://github.com/sushant-me/writeups/blob/main/2026-10-29-two-defects-my-tests-could-not-see.md
---

A review bot read two small pull requests against
[sisakulint](https://github.com/sisaku-security/sisakulint), a static analyser for GitHub
Actions workflows, and raised five findings between them. Two were real. One was a data
race I had just introduced; the other was a detection bypass in a rule I had just
"fixed". Both had passed the tests I wrote in the same commit.

That is the part worth writing down. Not that a bot found them, but that the tests were
structurally unable to.

## The race

`sisakulint` validates files in parallel: `LintFiles` hands each workflow to an `errgroup`
goroutine (`pkg/core/linter.go:439`). Rules are cheap and mostly stateless — except for one
shared table.

The permissions rule knows that most `GITHUB_TOKEN` scopes accept `read`, `write` or
`none`, and that a few do not. That subset lives in a package-level map, so every rule
instance and every goroutine sees the same slices:

```go
var restrictedPermissionValues = map[string][]string{
	"vulnerability-alerts": {"read", "none"},
}
```

When a workflow asks for a value the scope does not accept, the rule renders the allowed
set for the message:

```go
func SortedQuotes(ss []string) string {
	sort.Strings(ss)
	return quotes(ss)
}
```

That is `sort.Strings` **on the slice it is handed**. I handed it the map's own slice. Two
goroutines linting two files could therefore sort the same backing array while the other
read it: a data race, and a way to print the wrong value set. `go test -race` did not
complain, because my tests ran the rule sequentially; the suite never exercised that path
under concurrency.

The fix is one line — pass a copy — but the test is the part worth keeping. It asserts the
property rather than the message: after the rule rejects a value, the stored values must
still read `read, none`, in that order. Revert the copy and it fails with

```text
checking a value reordered the shared restriction: before [read none], after [none read]
```

## The bypass

The other pull request was about a flag. `anthropics/claude-code-action` accepts
`claude_args`, a string of CLI arguments passed through to Claude Code. One of them,
`--dangerously-skip-permissions`, disables the permission checks, so the rule reports it.

My first version matched `--dangerouslySkipPermissions`, the camel-case spelling — which
the CLI rejects as an unknown option. So it was loud on a string that does nothing, and
silent on the flag that works.

Then the bot's second point: even with the right spelling, a substring search is not
enough, because the action **parses** `claude_args` before the CLI ever sees it. Its own
source does exactly that (`base-action/src/parse-sdk-options.ts`) with `shell-quote`:

```ts
import { parse as parseShellArgs } from "shell-quote";
```

shell-quote removes quotes and escapes. So all three of these arrive at the CLI as the
same flag:

```yaml
claude_args: --dangerously-skip-permis''sions
claude_args: "--dangerously-skip-permis"sions
claude_args: --dangerously-skip-permis\sions
```

A literal search finds none of them. The rule was silent on three bypasses that work —
the worse half of the original bug, and the half a "check that the finding appears" test
cannot notice.

The fix splits the value into the words a parser produces and compares whole tokens. The
repository already depends on `mvdan.cc/sh/v3` for its shell taint analysis, so the
tokenizer was there. Two details mattered more than expected:

- The shell parser **keeps backslashes in literals**: `permis\sions` stays a single `Lit`
  with the backslash in its value, so the escape removal had to be implemented — all
  escapes outside quotes, the narrower `$`, backtick, `"`, `\` set inside double quotes,
  and nothing inside single quotes.
- When a value cannot be read statically (an unterminated quote, an expansion), the
  literal search stays as a fallback. A form the checker cannot read is reported, not
  assumed safe.

Nine cases, including the three obfuscations, `--flag=value`, the camel spelling and the
fallback. Deleting the tokenizer and going back to `strings.Contains` fails exactly the
three obfuscated ones.

## The advice was wrong too

The third finding was not in the code but in the message. The rule told the reader:

> Remove this flag and grant only the tools the workflow needs instead (for example
> `--allowedTools "Read,Glob,Grep"`).

`--allowedTools` only auto-approves the tools it lists; it does not make the step
read-only. A linter that gives wrong remediation advice is worse than one that gives none,
because the author applies it and believes the bypass is gone. The message and the
documentation now say what the flag does and does not do.

## What I changed about the tests

Both defects have the same shape: my tests asserted that the finding I expected appeared,
and never that nothing else moved. A rule can pass the first and still be wrong in the
second.

Three habits came out of this, and they are cheap:

1. **Assert the negative.** For every "this is reported" there is a "this is not" and a
   "nothing else changed". The race test is only that.
2. **Match what the consumer parses, not the text.** If a rule inspects a string that
   another program will parse, the rule should parse it the same way. The substring search
   was a model of the text, not of the tool.
3. **Delete the code and watch the test fail.** Both fixes were checked by reverting the
   change and confirming the new test fails: the copy, and the tokenizer. A test that
   cannot fail for the right reason is what
   [the earlier post about a spelling](2026-10-12-a-linter-that-a-spelling-could-get-past.md)
   was about, one bracket instead of one flag.

The two pull requests are [open](https://github.com/sisaku-security/sisakulint/pull/668)
and [open](https://github.com/sisaku-security/sisakulint/pull/672) — nothing here is
merged yet, and that is the honest state of it.
