# Withdrawn drafts

These are kept so the correction has a record. They are **not published** — nothing links to
them, and they are outside `public/`, so the site will not serve them.

## `agentic-verification-PRE-CORRECTION.pdf`

An earlier draft of the paper now published as *Edge-Native Semantic Firewall for Autonomous LLM
Agents*. It claimed two things the work's own measurements later contradicted, and which the
authors withdrew in the repository README:

- **"100% policy adherence."** Removed. Measured decision accuracy is **66.3%**, and the best
  configuration still approved **6 of 208** irreversible hard-denial actions.
- **The null-confidence defence.** The design claimed Rule A yields a null confidence score,
  removing the score as an attack surface. **It never happens:** zero null scores across 599
  parseable outputs.

This draft was the PDF hosted on the publications page, so the site was publishing the
falsified version of a paper whose corrected version was public next to it. The published PDF
is now the corrected camera-ready (`paper/main.pdf` from
`sushant-me/Edge-Native_Semantic_Firewall_`).

## `firewall-SUPERSEDED.pdf`

*LLM Agent Firewall: Real-Time Detection and Neutralization of Prompt Injection in Multi-Agent
Systems*. Withdrawn outright, for a stronger reason than the draft above:

- It named **MAPI-6K**, "a novel dataset of 6,000 inter-agent communications". No such dataset
  was built. The string appears in exactly one place in the entire workspace — the abstract on
  the publications page — with no corpus, generator, results file or repository behind it.
- Its headline result, **"100% containment of overt attacks with zero false positives"**, is the
  same figure the firewall repository had already measured false and retracted.

Unlike the corrected draft, there is no underlying study to republish here, so the entry was
removed rather than replaced. It is in neither `reputation/evidence.json` nor
`reputation/OPEN-LOOPS.md`, although the other publication claims are — the author's own
claim-verification system never carried it.

## Why this file exists

Both drafts were live on a public, indexed page next to a genuinely reproducible paper, with the
same visual authority. The failure was not that the work was unfinished; it is that a withdrawn
number and a measured one were presented identically, and that nothing in the existing checks
looked for it. The `artifact` field on every paper now states what a reader can verify.
