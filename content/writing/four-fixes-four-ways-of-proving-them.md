---
title: Four fixes, four ways of proving them
date: 2026-10-29
summary: Four pull requests went up today, in four different projects, and each needed a different kind of proof that the change did what it claimed. None of them is merged yet. What follows is what I ran…
source: https://github.com/sushant-me/writeups/blob/main/2026-10-29-four-fixes-four-ways-of-proving-them.md
---

Four pull requests went up today, in four different projects, and each needed a
different kind of proof that the change did what it claimed. None of them is merged yet.
What follows is what I ran before asking anyone to review the code — including the three
checks that failed and were worth failing.

## 1. A regression test that reproduced the report, then vetoed the fix

[`otlptracehttp` retried a `url.Error` only when `Temporary()` was true]
(https://github.com/open-telemetry/opentelemetry-go/pull/9313). Go returns false there
for `EOF`, for connection reset and for connection refused, so a batch was returned as
permanently failed after one attempt — including in the keep-alive race where a receiver
closes a pooled connection just as the next export reuses it.

The issue shipped a reproduction, and the first thing I did was make it fail on `main`:

```
--- FAIL: TestTransientDisconnectRetries/EOF
    wanted retry followed by success; attempts=1 err=Post "...": EOF
--- FAIL: TestTransientDisconnectRetries/Reset
    ... read: connection reset by peer
```

Then the same test against the fix passed. The step that matters is the third one: I put
the old classifier back and re-ran it, to check the test was not passing for a reason of
its own. It failed with the issue's exact strings. A test that cannot fail is not
evidence, and the only way to know is to make it fail.

## 2. Asserting on bytes when the language would hide the bug

[`adkrest` stringified every span attribute]
(https://github.com/google/adk-go/pull/2015): `gen_ai.usage.input_tokens` arrived as
`"1"`, `gen_ai.response.finish_reasons` as `"[\"stop\"]"`. The ADK web UI validates
types and discards the whole span array on one mismatch — a successful model response
left the Request and Traces panels empty.

The obvious test decodes the response and compares Go values, which hides exactly the
difference being fixed: `"1"` and `1` both print differently but a struct comparison can
be written either way. So the assertion is on the serialized JSON:

```go
if got := decoded["gen_ai.usage.input_tokens"]; got != float64(1) { ... }
reasons, ok := decoded["gen_ai.response.finish_reasons"].([]any)
```

Mutation-checked the same way: with the old conversion restored, it fails with
`input_tokens = "1" (string)` and `finish_reasons = "[\"stop\"]" (string)` — the values
from the issue, not invented ones.

## 3. A test first, and a tool that found a leak the tests did not

[`go-github`'s redirect helpers ignored `http.Client.Timeout`]
(https://github.com/google/go-github/pull/4688). The helper calls the transport directly
— deliberately, so a 301 can be inspected — and that skips `http.Client.Do`, where the
timeout is applied. Setting a 20 ms timeout on a client whose transport waits for
`req.Context().Done()` produced a request that waited for the caller's context instead:

```
Request took 2.001932033s; the 20ms client timeout was not applied
```

The fix attaches the deadline once around the helper, so redirect hops share it, and
hands the cancel func to a body wrapper so the caller's reads stay bounded. My first
version called `cancel()` only on the error path, and **`go vet` caught a real leak**:
a transport returning a nil body would leak the timer. `lostcancel` is a linter, but this
was not a style complaint — it was the code being wrong, and no test would have found it
because the leaking path returns early in normal operation.

The second test asserts every hop in a redirect chain sees the *same* deadline, which is
what "spans the whole request" means. A per-hop timeout would pass a naive test.

## 4. Thirty-one tests for a bug that was mostly about what a field means

[`skills#500`](https://github.com/trailofbits/skills/pull/506) is the one that was not a
crash. A supply-chain auditor read deprecation, install-script status and provenance from
`dist-tags.latest` while reporting them beside a pinned version. There is no stack trace
for that; the report is simply about the wrong release, and the tests have to encode the
meaning:

- a pinned release's deprecation is the pin's, not the current release's;
- a property introduced later is not attributed to an older release;
- an unpublished pin is *unassessable*, never substituted;
- a missing `latest` keeps maintainers and repository readable and provenance unknown,
  rather than turning "unknown" into a negative;
- install scripts come from the format present (`scripts` in full metadata,
  `hasInstallScript` in the abbreviated one) and only the hooks npm actually runs on
  install count — `prepare`, `test` and `build` do not.

The last one was the bug behind the bug: reading the *absent* field of the other format
converted "unknown" into "no install script", which is how esbuild and core-js were
reported as script-free.

## Three checks that caught me

The verification I planned is only half of it. The other half is what the repository
already enforces, and three gates fired:

1. **Complexity.** My added branches took `enrich_npm` to a mccabe complexity of 9
   against a limit of 8. The pre-commit hook runs a stricter configuration than the
   committed `ruff.toml`, so my local lint was clean and CI was not. The release-signal
   and provenance branches moved into helpers of their own, and the complexity rule is
   quiet again.
2. **Release versioning.** The plugin metadata validator refuses a changed plugin whose
   version did not increase, because clients only pull updates when the number does.
   `2.0.4 → 2.0.5`, in both manifests.
3. **A link checker reading my test file.** A fixture contained
   `http://127.0.0.1:1` as the URL of a wrapped `url.Error`. `lychee` scans Go test files
   and tried to fetch it. The placeholder is now `https://example.com`; the classifier
   decides on the wrapped error, so the URL was never the subject.

Each of those is the kind of thing that reads as noise until the day it is not.

## What this is not

None of these four is merged. One is waiting for a maintainer to approve its workflow
runs — a first-time-contributor gate that holds the CI itself — and the other three are
waiting for review, with every check that can run already green. I would rather say that plainly than imply a review outcome I cannot see. The
part that is fully mine is whether each claim in the PR body is true, and that is what the
four checks above are for.
