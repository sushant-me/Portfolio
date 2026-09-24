---
title: Six numbers I nearly published, and the control that stopped each one
date: 2026-09-24
summary: I spent a weekend building a selective state-space model — Mamba's S6 recurrence — from scratch, to answer a question I actually wanted answered: is the non-attention architecture better, or does it…
source: https://github.com/sushant-me/writeups/blob/main/2026-09-24-six-numbers-and-the-control.md
---

I spent a weekend building a selective state-space model — Mamba's S6 recurrence —
from scratch, to answer a question I actually wanted answered: is the
non-attention architecture better, or does it only look better when you are
careful to choose a baseline it happens to beat?

The repository's main results table says the state-space model wins clearly. That
table is in the repository, and so is the control that makes reading it as an
architectural result wrong.

This is a post about the controls rather than the model. Six things I measured,
believed, and was about to write down — and what falsified each one. The pattern
is not that I made six unrelated mistakes. It is that **every one of them was
caught by a control and none of them was caught by reading the code**, including
the two where I read the code twice looking for the bug and it was correct.

## The headline the table supports

The task is multi-query associative recall: a sequence of key/value pairs, then a
query key, and the model must emit the paired value. Keys and values are drawn
from disjoint halves of the vocabulary, so a model cannot score by predicting a
likely token — it has to have stored the association. Accuracy is exact match,
and the task is position-invariant, so a Transformer with no positional encoding
is a fair baseline rather than a crippled one.

Both architectures get the same data, optimiser, learning-rate schedule, batch
size and seed, at matched parameter counts — 67,584 for the state-space model
against 67,968 for attention, printed by the run and asserted in the tests.

At a matched 3,000-step budget the state-space model reaches **1.000** accuracy up
to 8 pairs in context. The Transformer degrades from 1.000 at 2 pairs to **0.203**
at 16. The obvious headline writes itself: *a selective state-space model recalls
associations better than a Transformer.*

## The control that killed it

Same architecture. Same size. Same data, same seed, same optimiser. One thing
changed: the step budget, from 3,000 to 20,000.

The Transformer reaches **1.000** at 8 pairs.

Nothing about the architecture changed, so nothing about the architecture was
being measured. Associative recall in a Transformer is implemented by an
*induction head* — a two-layer circuit that takes many steps to form, and one of
the last things to appear during training. The 3,000-step sweep therefore measured
**how quickly each architecture learns this task**, not what either is capable of.
Those are different questions that produce a table which looks identical.

The honest summary is narrower and less interesting than the headline, which is
why the headline is the one that would have spread:

* **Learning speed on this task, at this scale: the state-space model is faster.**
  It fits the task in a fraction of the steps.
* **Capability on this task, at this scale: both architectures get there.** At 8
  pairs, given enough steps, either can do it.
* **Neither solves 16 pairs** at this model size, on any budget I tried.

## The crossover that was a misspelled flag

Early on I reported that the state-space model crosses over on memory and time
past roughly 16k–32k tokens. Against attention written with an explicit causal
mask, it does: at 32,768 tokens, 55.9 s against 57.6 s, and 4,652 MB against
9,122 MB, about 2× lighter. That number was real.

It was also measuring the wrong baseline. `run.py` did not pass `--causal-mode`
down to the measurement subprocess, so a run labelled `sdpa` silently measured
`mask`. The baseline I was calling "the fused kernel" was the slower,
matrix-materialising one — the crossover I reported was a comparison against it,
mislabelled as the faster one.

Against attention actually written with the fused kernel
(`F.scaled_dot_product_attention` with `is_causal=True`), there is no crossover up
to 32,768 tokens. Attention is ~2.6× faster (23.5 s against 61.7 s) and ~2.8×
lighter (1,653 MB against 4,650 MB), with flat per-token memory.

What found this was not reading the code — I had, and the code was fine. It was
asking why one number moved by 2.8× when the only thing that had changed was a
label.

## A constant prints as a table

To show the streaming rewrite was worth it, I measured peak memory. The probe
subtracted `ru_maxrss` high-water marks, which looks reasonable and is not.

That value is reported out of `signal_struct`, which a forked child **inherits**.
A child spawned by a large parent starts with the parent's peak already recorded,
so the child's own allocations are invisible and the growth reads as zero. Writing
`5` to `/proc/self/clear_refs` does not fix it: that lowers `mm->hiwater_rss`,
while `getrusage` reports the larger of it and the inherited `signal->maxrss`.
Sampling *current* RSS during the call does fix it.

The old probe reported the same constant for every configuration. A constant
prints as a table, and a table looks like a result.

Once the probe sampled correctly, the streaming path measured a **20× reduction**
in peak RSS at `L = 4096` — 131 MB for the whole-sequence version against 6.6 MB
for one chunk at a time — and the test asserting it was mutation-checked, so
pointing the streaming path back at the materialising implementation makes it
fail.

## An exponent fitted to two noisy small numbers

The README's limitations section reported that step cost grew "roughly as
`L^1.9`". That was fitted by least squares over four points between 6 and 34
tokens.

At those lengths per-step overhead dominates, and the ratio of two noisy small
numbers is not an exponent. Re-measured over 1,024 to 8,192 tokens the scan grows
at **0.61**, and it is nowhere near quadratic. The old figure was not slightly
off. It was a fit to overhead.

## The test that could not see the bug it existed for

The scan has three implementations that share no code: an explicit loop (the
definition), a chunked kernel-style path, and an associative Hillis-Steele scan.
The tests assert all three agree to float64 tolerance.

There is also a causality test: change an input at position `t` and require every
output before `t` to be bit-for-bit unchanged. It listed **two** of the three
implementations. The chunked path — the one that can leak across a chunk boundary,
which is the exact failure mode the test exists to catch — was never checked by
it. I proved this by deliberately reversing the chunk scan and watching the test
pass.

The arithmetic was right. The parametrisation was the bug. A test that states a
property and then checks it over an incomplete list is a test that has already
decided its own answer.

The same shape appeared in the inner-scan comparison: the first version drew fresh
random tensors *inside* the measurement, so the column it printed showing the
difference between the two paths was comparing different inputs. It could not have
failed. Inputs now come from a fixed seed and each process reports a checksum the
driver compares. Every row agrees to 1.4e-07, and only then do the speed numbers
mean anything.

And one about environment rather than code: my first conclusion was that the
vectorised scan was slower outright. Those timings were taken while a
`torch.compile` job was competing for CPU. The same configuration measured 27.9 s
under contention and 3.89 s on an idle machine — a 7× error. The memory result
survived; the time result reversed. Timings from a loaded machine are not
measurements.

## What actually holds

The claim I am willing to defend is narrow, and it is narrower than the one I set
out to make:

> A from-scratch selective state-space model, in pure PyTorch on CPU, beats a
> Transformer whose attention is written with an explicit causal mask beyond
> roughly 16k–32k tokens on memory and marginally on time — and loses to the same
> Transformer when attention uses the fused kernel, at every length measured.

The interesting part is not the state-space model. It is that **the same
architecture wins or loses depending on how the baseline is written**, and that
both numbers are needed to say anything true. Against the masked baseline the
asymptotic argument is visible; against the fused one it buys nothing at these
lengths, because a fused kernel never materialises the quadratic score matrix.

I have left the withdrawn numbers in the README rather than deleting them, in the
sections that explain what replaced them. A repository that shows its own
revisions is more useful than one that appears to have been right first time, and
the correction is the only part of it worth trusting.

## What I take from it

Every failure above was a *measurement* failure, not an implementation failure.
The scan itself was correct in all six cases. Three independent implementations
agreeing to float64 tolerance, and five mutations each failing a different
specific test, is what correctness looks like — and it is exactly what made the
wrong numbers believable, because correct arithmetic does not stop you measuring
the wrong baseline, inheriting your parent's memory high-water mark, fitting an
exponent to overhead, or comparing two different inputs.

The rule I have taken away is the one that caught all six:

**A number is a result only once something was built that could have disagreed
with it.** Not a second implementation of the same thing — a control that changes
one variable you did not think mattered. The 20,000-step Transformer, the
`--causal-mode` flag propagating to the child process, a probe that samples
instead of subtracting, four lengths instead of one, the third implementation in
the parametrisation, a fixed seed and a compared checksum.

Everything here is in [sushant-me/beyond-attention](https://github.com/sushant-me/beyond-attention).
Every number in the README is rendered from a committed JSON results file by a
script, so re-running the experiment and the renderer reproduces the tables — and
if one of them stops reproducing, that is a bug I want to hear about.
