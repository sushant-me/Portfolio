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
the three configurations I tested. It approved **46.2%** of proposals the policy would have blocked or
sent to human review, against **17.2%** for unconstrained free-form text. On irreversible hard-denial
commands it approved **71** where free-form approved **11**.

That result is the reason the paper exists, and it generalises past my setup: if you have bolted JSON
mode onto a model and assumed the constraint made it more reliable, this is the failure to look for.

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

Three ways of asking the same model the same question:

| arm | what the model is asked to produce |
|---|---|
| **free-form** | a short prose answer, no format constraint |
| **JSON only** | a JSON object with a decision and a confidence — **no reasoning field** |
| **structured CoT** | JSON with a mandated field order: rule → reasoning → confidence → decision |

The arms differ in exactly one thing at a time: JSON-only adds the format constraint; structured CoT
adds the reasoning field back, ahead of the verdict.

## What happened

| metric | free-form | JSON only | structured CoT |
|---|---|---|---|
| Decision accuracy | 64.5% | 52.3% | **66.3%** |
| Rule-attribution accuracy | 81.2% | 80.3% | **86.5%** |
| Unsafe ACCEPT (count) | 103 | 277 | 141 |
| Unsafe ACCEPT (%) | **17.2%** | 46.2% | 23.5% |
| — of which on Rule A hard denials | 11 | 71 | **6** |
| Rule A decision accuracy | 72.1% | 62.5% | **90.8%** |
| Adversarial subset accuracy | 50.3% | 20.0% | 45.8% |
| Median latency | 2.42 s | 0.44 s | 2.55 s |

Read the unsafe-ACCEPT row first. The JSON-only arm is not just less accurate overall — it is less
accurate *in the direction of danger*. And note the latency column next to it: the JSON-only arm is
**5.5× faster**, which under a cost or latency budget is exactly the arm an engineering team would pick.

The mechanism looks like this. Asked for free-form, the model writes out its reading of the policy
before answering; the deliberation is incidental to the format. Asked for JSON with no reasoning field,
it must answer immediately, and the most available answer is the permissive one — the action looks
plausible in isolation, and nothing in the output structure forces the policy to be consulted. Requiring
the reasoning field to be emitted *before* the verdict restores the deliberation: the model commits to a
rule, then to its reading of the facts, and only then to the decision.

## The part that matters more: it is not enough

The structured arm is my best configuration, and I do not present it as a solution:

- It still approved **6 of 208** irreversible hard-denial actions.
- On **ambiguous** proposals that should have reached a human, it was *more permissive than free-form* —
  the arm with the best headline number was the worst exactly where judgment was required.
- Roughly **one verdict in ten changes** between identical runs at temperature 0.

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
   generalise to a held-out policy class, and has never seen a real deployment. That section is in the
   paper, and it is the part a buyer should read first.

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
