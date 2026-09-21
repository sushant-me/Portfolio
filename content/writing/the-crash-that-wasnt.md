---
title: The crash that wasn't: how AddressSanitizer showed my fix was for the wrong bug
date: 2026-09-19
summary: I opened a pull request against google/s2geometry claiming a null-pointer dereference caused a crash. I had a test. The test passed on my machine. It segfaulted in CI on every platform.
source: https://github.com/sushant-me/writeups/blob/main/2026-09-19-the-crash-that-wasnt.md
---

I opened a pull request against `google/s2geometry` claiming a null-pointer dereference caused a
crash. I had a test. The test passed on my machine. It segfaulted in CI on every platform.

The reason is the most useful thing I learned from the whole exercise, so this is the writeup I wish I
had read first: **a passing memory-safety test proves almost nothing unless it runs under a sanitizer**,
and the crash I was fixing was not the crash I had found.

---

## The setup

`s2geometry` is Google's C++ library for geometry on a sphere — spatial indexing, shape intersection,
the kind of code that ends up underneath mapping and routing services. I was fuzzing its encoded
formats, the paths where bytes arrive from untrusted input and get decoded into in-memory structures.

`EncodedS2ShapeIndex` stores its cells in a compressed form. `Init()` reads the bytes; `GetCell(i)`
decodes a cell on demand. The decode can fail on malformed input, and in the version I was looking at:

```cpp
const S2ShapeIndexCell* EncodedS2ShapeIndex::GetCell(int i) const {
  ...
  if (!cell->Decode(num_shape_ids(), &decoder)) {
    return nullptr;                     // decode failed
  }
  ...
}

inline const S2ShapeIndexCell& EncodedS2ShapeIndex::Iterator::cell() const {
  ABSL_DCHECK(!done());
  return *index_->GetCell(cell_pos_);   // ...and this dereferences it
}
```

The documented traversal pattern — iterate from `BEGIN`, call `it.cell()` — therefore dereferences a
null pointer when an index contains a corrupt cell. That is a crash on malformed input, and it is a
real bug. I reproduced it as a standalone 20-line binary, got a `SIGSEGV` at address `0x0`, and filed
it, then opened a PR that returned a static empty cell instead of `nullptr`.

Reviewer feedback on that approach was immediate and, in hindsight, correct: *"This seems like it's
going to cover up problems. Shouldn't callers be checking for null?"*

I thought I could still make the case with a test. I wrote one that fed two malformed base64 blobs
through the documented traversal and asserted the traversal completed. **It passed locally.**

Then CI ran it on every platform and got `SEGFAULT`.

## Why the same test passed locally and crashed in CI

This is the part worth internalising: **an out-of-bounds read only faults when it lands on a page that
is not mapped.** A 24-byte read past the end of a heap allocation usually lands in the same arena,
inside memory the allocator has already mapped, and returns garbage that nothing checks. Whether that
same read hits the guard page depends on the allocation size, alignment and the allocator's state —
which differ between a `RelWithDebInfo` build on my laptop and a `Release` build on a GitHub runner.

So "it passed locally" meant "the bug did not happen to be fatal on this machine". It did not mean the
code was correct, and it certainly did not mean my fix was correct. A green run of a memory-safety test
without a sanitizer is a coin flip that landed heads.

## What the sanitizer showed

I rebuilt the test with `-fsanitize=address` and ran it again. Immediately:

```
ERROR: AddressSanitizer: heap-buffer-overflow on address 0x... at pc 0x...
READ of size 24
    #1 s2coding::EncodedS2PointVector::operator[](int) const   encoded_s2point_vector.h:191
    #2 EncodedS2LaxPolygonShape::chain_edge(int, int) const    s2lax_polygon_shape.h:306
    #3 EncodedS2LaxPolygonShape::edge(int) const               s2lax_polygon_shape.cc:360
    #4 ...the test I had just written...
```

An unvalidated `loop_starts` array in the *encoded lax polygon shape* — a completely different bug from
the null cell I was patching. The index had decoded "successfully" but left a loop-offset table that
pointed past the end of the vertex array, and my traversal walked off it.

My patch was not wrong about the null dereference existing. It was wrong about which bug its own test
was exercising, and the fix it shipped changed the symptom on one path while leaving an
out-of-bounds read in place. That is exactly what the maintainer had suspected, and I could not have
demonstrated it without the sanitizer.

## What I did about it

1. **Closed my own pull request**, with the ASan trace in the comment and a plain statement that it did
   not fix the crash its test exercised. Being the person who withdraws a weak patch is cheaper than
   being the person whose weak patch got merged.
2. **Opened the correct fix separately** — validate `loop_starts` when decoding, so `chain_edge()`
   cannot index past the vertex array.
3. **Split the remaining changes** into independent pull requests when the maintainer asked, so the
   parts that were agreed on could land without waiting for the contentious one.
4. **Rewrote the test so it could run everywhere.** The original constructed an `EncodedS2ShapeIndex`
   and iterated it, which routes through `EncodedS2PointVector` — a format that is little-endian only,
   and which aborts the big-endian CI job with a deliberate fatal. The replacement calls
   `S2ShapeIndexCell::Decode()` directly on crafted bytes. It tests the function under test, and it is
   valid on every architecture.

## The rules I took from it

- **Run new memory-safety tests under a sanitizer before you believe them.** Not after CI disagrees
  with you — before.
- **A test that passes without a sanitizer is evidence about this machine, not about the code.** Treat
  a green local run of a crash test as unverified.
- **"It exercises the code" is a claim that needs checking.** The same week I found an OSS-Fuzz harness
  in another Google library that asserted **0.00% line coverage** of the function it targeted, because
  it never generated a valid input at all. It ran, it passed, it tested nothing. Coverage is how you
  tell the difference between a test and decoration.
- **When a reviewer says a fix "covers up" a problem, they are usually pointing at the symptom/fix
  mismatch.** Go and measure which problem you actually fixed; that is a five-minute experiment and it
  is decisive either way.
- **A crash is not a bug report until you can explain it.** I had a reproducible segfault for a week
  before I had a correct explanation of it, and the gap between the two was exactly the gap between a
  patch that looked right and a patch that was right.

The pull requests, issues and the AddressSanitizer output from this work are public:
[s2geometry #681](https://github.com/google/s2geometry/pull/681),
[#682](https://github.com/google/s2geometry/pull/682) and the
[issues it came from](https://github.com/google/s2geometry/issues/674).
My other claims are re-checked weekly by
[sushant-me/reputation](https://github.com/sushant-me/reputation), which goes red when one stops
holding — including this one.
