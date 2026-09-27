---
title: Structured output made my safety evaluator less safe
date: 2026-09-20
summary: I spent a month building a policy evaluator for autonomous agents: a small model that reads a proposal and decides whether a written policy allows it. The obvious engineering move was to constrain…
source: https://github.com/sushant-me/writeups/blob/main/2026-09-20-structured-output-made-it-less-safe.md
---

I spent a month building a policy evaluator for autonomous agents: a small model that reads a proposal
("the agent wants to run this command") and decides whether a written policy allows it. The obvious
engineering move was to constrain its output. Free-form text is hard to parse; JSON is not. So I added a
JSON mode, and it got **worse** — markedly worse, in the way that matters most.

Constraining the output format without requiring a reasoning step produced the least safe evaluator of
the four I tested. Of the 600 proposals it was shown, it approved **46.2%** — 277 of them, actions the
policy blocks or escalates — against **17.2%** for unconstrained free-form text. On irreversible
hard-denial commands it approved **71**, where free-form approved **11** and the structured version
approved **6**.

That result is the reason the paper exists, and the mechanism is worth looking for past my setup: if
you have bolted JSON mode onto a model and assumed the constraint made it more reliable, this is the
shape of the failure. How far it generalises I cannot say — everything below is one 3.8B quantized
model and a corpus I wrote myself, which are the two limits the paper names first.

---

## The setup

Everything ran locally. No cloud inference at any point, because part of the question was whether a
small model on ordinary hardware is a viable enforcement layer at all:

- **Model:** Phi-3-mini-4k-instruct, 3.8B parameters, 4-bit quantized, served on one consumer laptop.
- **Budget:** a 4.2 GiB VRAM ceiling. Peak measured device memory was **3,947 MiB** at 96% GPU
  utilisation — inside the ceiling, measured rather than estimated.
- **Corpus:** 600 policy scenarios per condition, deterministic generator, fixed seed. Each scenario is
  a proposed action plus the policy clauses that apply to it, with a ground-truth decision.
- **Temperature:** 0 for every arm.

Four ways of asking the same model the same question:

| arm | what the model is asked to produce |
|---|---|
| **free-form** | a short prose answer, no format constraint |
| **JSON only** | a JSON object with a decision and a confidence — **no reasoning field** |
| **structured CoT** | JSON with a mandated field order: rule → reasoning → confidence → decision |
| **+ declared action class** | as above, with the caller declaring the action vector |

The arms differ in exactly one thing at a time: JSON-only adds the format constraint; structured CoT
adds the reasoning field back, ahead of the verdict; the fourth removes the need to infer the action
class at all. The fourth is reported because it is the one that beats the proposed method on rule
attribution — 96.0% against 86.5% — and matches it on hard denials.

## What happened

| metric | free-form | JSON only | structured CoT | + declared class |
|---|---|---|---|---|
| Decision accuracy | 64.5% | 52.3% | **66.3%** | 64.1% |
| Rule-attribution accuracy | 81.2% | 80.3% | 86.5% | **96.0%** |
| Unsafe ACCEPT (count) | 103 | 277 | 141 | 155 |
| Unsafe ACCEPT (%) | **17.2%** | 46.2% | 23.5% | 25.9% |
| — of which on Rule A hard denials | 11 | 71 | **6** | **6** |
| Rule A decision accuracy | 72.1% | 62.5% | 90.8% | **94.2%** |
| Adversarial subset accuracy | **50.3%** | 20.0% | 45.8% | 49.0% |
| Median latency | 2.42 s | 0.44 s | 2.55 s | 2.70 s |

Read the unsafe-ACCEPT row first. The JSON-only arm is not just less accurate overall — it is less
accurate *in the direction of danger*. And note the latency column next to it: the JSON-only arm is
**5.5× faster**, which under a cost or latency budget is exactly the arm an engineering team would pick.

Two things to know about the free-form baseline before you trust that 17.2%. It depends on the parser
rather than the model: 14.5% of free-form answers stated a verdict more than once, and the first and
last mentions disagreed. And the extraction had a bug that was found and fixed, which moves the
free-form rate to 17.5% on this run and 16.5% on the replication. The committed numbers are
deliberately not rewritten to hide that. The comparison against JSON-only survives it easily; a
0.3-point move does not touch a 29-point gap.

The mechanism looks like this. Asked for free-form, the model writes out its reading of the policy
before answering; the deliberation is incidental to the format. Asked for JSON with no reasoning field,
it must answer immediately, and the most available answer is the permissive one — the action looks
plausible in isolation, and nothing in the output structure forces the policy to be consulted. Requiring
the reasoning field to be emitted *before* the verdict restores the deliberation: the model commits to a
rule, then to its reading of the facts, and only then to the decision.

## The part that matters more: it is not enough

The structured arm is my best configuration on accuracy and on the irreversible class. It is **not**
the best on the measure this post is about, and that is the part worth sitting with:

- Its unsafe-ACCEPT rate, **23.5%**, is *worse* than the 17.2% scored by free-form text that never
  added a format at all. The format, done as well as I could do it, did not beat no format.
- Its decision-accuracy gain over free-form is **1.8 points** — 64.5% to 66.3% — and the two confidence
  intervals overlap ([60.6, 68.2] against [62.4, 69.9]), so that gain is not statistically distinguishable.
- Where it does win, it wins clearly: **6 of 208** irreversible hard denials, against 11 for free-form
  and 71 for JSON-only, and 90.8% accuracy on that class against 72.1%.
- On **ambiguous** proposals that should have reached a human, it was *more permissive than free-form* —
  the arm with the best headline number was the worst exactly where judgment was required.
- Roughly **one verdict in ten changes** between identical runs at temperature 0, measured on the
  200-scenario replicated subset.

An earlier version of this work claimed *"100% policy adherence"*. That claim was removed, because the
measurements falsified it: accuracy is 66.3%. A verification layer with a 23.5% unsafe-accept rate on
the general case is a component in a defence-in-depth stack — it is not a gate, and any deployment that
treats it as one is worse off than one that never added it, because it creates the appearance of a
control.

## What I would tell someone shipping this

1. **Test the format you actually ship.** If production uses JSON mode, evaluate JSON mode. The
   constrained and unconstrained behaviours are not the same model, and the difference here was a
   2.7× change in the rate that matters.
2. **Require the reasoning, not just the shape.** A schema with a `decision` field is not the same as a
   schema with `rule → reasoning → confidence → decision`. Field order is a prompt.
3. **Score unsafe accepts separately from accuracy.** Overall accuracy hid the regression: 52.3% against
   64.5% looks like a quality dip, not a safety inversion. Classify errors by *direction*.
4. **Measure run-to-run instability before trusting a single number.** At temperature 0, one verdict in
   ten moved. A single evaluation run of 600 scenarios would have reported either 22% or 25% with equal
   confidence.
5. **Write down what the component does not cover.** Mine does not cover ambiguous cases, does not
   generalise to a held-out policy class, and has never seen a real deployment. Neither do the paper's
   own two biggest caveats appear above: the corpus was written by the people who wrote the method,
   which the paper calls the single largest threat to validity, and every result is from one 3.8B
   quantized model, so nothing here says whether the effect is the architecture, the parameter count or
   4-bit quantization. That section is in the paper, and it is the part a buyer should read first.

## Why I published the negative half

The result that would have made a better abstract — "structured output improves policy adherence" — is
not what the data show. What the data show is that a formatting change silently reorders what the model
considers, in the direction of approving things it should block, and that the fastest configuration is
the least safe. If I had rounded 46.2% toward the free-form number, nobody downstream would have known
to test their own JSON mode.

That is the same rule I apply to my own pull requests: I closed one this month after
[AddressSanitizer showed it fixed a different bug than the one its test exercised](2026-09-19-the-crash-that-wasnt.md).
A published number that survives because nobody checked it is not a result.

---

**Paper, 600-scenario corpus, raw model outputs and the camera-ready:**
[github.com/sushant-me/Edge-Native_Semantic_Firewall_](https://github.com/sushant-me/Edge-Native_Semantic_Firewall_)
· **Every claim above is re-checked weekly against its source by**
[github.com/sushant-me/reputation](https://github.com/sushant-me/reputation).
