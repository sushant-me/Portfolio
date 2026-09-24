---
title: It learned where to put the value, and not how hard to hold it
date: 2026-09-24
summary: My own README carried a criticism I could not answer. The agent loop's working memory is a selective state-space recurrence, and the part that decides what to write was hand-set:
source: https://github.com/sushant-me/writeups/blob/main/2026-09-24-it-learned-where-not-how-hard.md
---

My own README carried a criticism I could not answer. The agent loop's working
memory is a selective state-space recurrence, and the part that decides *what to
write* was hand-set:

> The gate is hand-set, in `embed`: it is not learned, it is not produced by a
> projection, and a Python dict in `evaluate_plan` computes the same answers with
> no model at all.

That is a fair hit, and the last clause is the one that stings — it says the
memory is not load-bearing. So I replaced the gate with a single `nn.Linear` over
one-hot features followed by a sigmoid, trained it by gradient descent on the
state, and measured it with the agent's own reader so that a difference between
two rows is a difference in the gate and nothing else.

The result is partial, and the partial part is the part worth writing down.

## The thing it learned, and the thing it did not

| condition | solve rate |
|---|---|
| hand-set gate, as shipped | **1.000** |
| learned gate, trained, used raw | **0.420** |
| learned gate, trained, sharpened | **1.000** |
| learned gate, trained with temperature annealed | 0.928 |
| learned gate, untrained | 0.000 |
| fixed / constant gate (the existing control) | 0.160 |

So a projection *can* produce this gate. But only after a temperature is applied
at evaluation time, and that is the whole story: gradient descent learned one
half of the function and not the other.

The gate has two jobs. It has to decide **which slot** a value belongs in, and it
has to decide **how hard** to write — a write of exactly 1 replaces the slot, a
hold of exactly 0 leaves it bit-for-bit unchanged, and anything in between
corrupts both.

**It learned the addressing perfectly.** The trained gate's 0.5-threshold is
*exactly* the hand-set gate on every evaluation event — the rounded one-hot
fraction is 1.000, meaning that if you only ever ask "is this weight above a
half", the learned gate and the hand-written one are the same function. That is
not a near miss. It is the right answer.

**It did not learn the hardness at all.** The mean deviation of the gate from
0/1 is 0.1114, with a maximum of 0.3721. The number that makes it concrete: on
slots that must *hold*, the learned gate carries a mean weight of **0.1301**,
where the hand-set gate carries 0.0000.

## Why a soft gate is not a slightly worse gate

That 0.13 sounds small. It is not, and the reason is the recurrence. `A` is
stored negated so that a hold multiplies the slot by `exp(-800·w)`. At `w = 0`
that is a factor of 1 — the slot is untouched. At `w = 0.05` it is `exp(-40)`,
about `4e-18`, which is not "mostly a hold", it is an erase.

The measured consequence: the raw trained gate has a mean hold multiplier of
**0.4676**, and **64.7% of slots that should have held lost more than 1% per
event**. The hand-set gate: multiplier 1.0000, 0.0% destroyed. A gate that is
soft in the wrong place does not degrade gracefully; it leaks the memory it was
supposed to preserve, and the leak compounds across every event in the stream.

This is the detail I would have missed if I had only reported accuracy. The raw
gate scores 0.420, which reads like "half-right". What actually happens is that
it addresses correctly and then smears the contents.

## A temperature is not a gradient

Sharpening the sigmoid at evaluation — dividing the logits by 0.05 — takes the
same trained weights to **1.000**, exactly matching the hand-set gate. The sweep
is monotone and leaves no ambiguity about the cause:

| sigmoid temperature | trained gate | untrained control |
|---|---|---|
| 1.0 (raw) | 0.420 | 0.000 |
| 0.5 | 0.420 | 0.000 |
| 0.2 | 0.500 | 0.000 |
| 0.1 | 0.800 | 0.000 |
| 0.05 | **1.000** | 0.000 |

The untrained control sits at 0.000 at every temperature, which is what says
training is doing the work rather than the sharpening.

But I should be precise about what this buys, because it would be easy to slide
past. **The hardness was not learned. It was chosen.** I picked 0.05 because I
knew the answer was a hard one-hot, and a person who did not already know the
right gate would have no reason to pick it. Annealing the temperature *during*
training is the honest version of "learn it" — that reaches 0.928, closer and
still not exact.

## The feature map failed, not the mechanism

The sharper negative is on held-out keys. Train on keys 0–15, evaluate on 16–31
of a vocabulary of 32:

| feature map | training keys | held-out keys |
|---|---|---|
| one-hot **per key** (the obvious choice) | 1.000 | **0.000** |
| one-hot per slot (`key % state_width`) | 1.000 | **1.000** |

The per-key map does not generalise at all — zero. The diagnosis is in the
artifact rather than inferred: on a held-out key the gate's weight on the
addressed slots is 0.073 instead of 0.995, because that key's row in the weight
matrix is still sitting at its initialisation. The model was never told anything
about keys 16–31, so it writes nothing.

Sharing weights between keys that address the same slot generalises completely.
That is a real result and it is also a narrower one than it looks: the map that
works has *already* encoded the addressing function I was trying to learn, so it
succeeds partly by being given the answer in modular form. And the hand-set gate
scores 1.000 on both, which is a reminder that in this comparison the thing I was
competing with had no such problem to begin with.

## What still stands

Only the gate is trained. `A` is still the same constant, and the reader is
unchanged — so a Python dict in `evaluate_plan` still computes every answer in
this family, and the *"no model is needed"* half of the objection survives intact.
The gate is now produced by a projection; the loop is not learned end to end, and
nothing here shows that it should be.

Two other things I did not establish. There is no test at any other shape — other
store counts, other key counts, other widths — so this is one configuration
measured carefully. And the sharpened result depends on a temperature I chose
with knowledge of the answer, which is exactly the kind of choice that should be
declared rather than buried.

## What I take from it

The useful move was not the training. It was splitting one number into two.

Accuracy alone said 0.420 against 1.000, which is compatible with a dozen
stories: the architecture cannot represent the gate, the optimiser got stuck, the
features are wrong, the gate is nearly right and noise is costing the rest. Every
one of those would have pointed at a different fix, and I had no way to choose
between them.

The measurement that settled it was **which half of the gate's job was learned** —
the thresholded gate agreeing with the hand-set one on every event, next to the
weights that same gate puts on slots it must hold. Once addressing is separated
from hardness, the raw 0.420 stops being ambiguous: the addressing is exactly
right, and the hardness is absent. Two mechanisms, two fixes, and only one of them
is a gradient.

The rule I am taking away is narrower than the one I expected. I assumed a
projection trained on the state would learn the whole gate, because the whole gate
is what the loss rewards. It learned the discrete decision perfectly and left the
continuous part at its initialisation — and the reason is legible in hindsight: the
loss was satisfied by getting the addressing right, and nothing in it punished a
gate that holds at 0.87 instead of 0.99, right up until the recurrence multiplied
that error across a few hundred events.

Everything here is in
[sushant-me/beyond-attention](https://github.com/sushant-me/beyond-attention),
in the "Is the gate learnable, or is it still hand-set?" section. The tables are
rendered from a committed results file by a script, so re-running the experiment
and the renderer reproduces them — and the results file has a `--verify` mode that
re-runs and diffs every number against what is committed, because it went stale
once and nothing noticed.
