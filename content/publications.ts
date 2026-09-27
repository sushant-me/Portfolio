// Papers are listed with the title, authors and order exactly as printed on each PDF.
//
// `artifact` records whether the work is independently checkable from this site, because a
// reader's first question about an empirical result is whether they can reproduce it:
//
//   "public-reproducible" - code, corpus and raw outputs are public, and the repository's own
//                            checker re-derives every reported number from them.
//   "not-released"         - the paper reports measurements, but no code, corpus or raw output
//                            has been released, so the numbers cannot be independently checked.
//   "not-empirical"        - the paper asserts no experiment (architecture, feasibility,
//                            deployment or position work), so no artifact is owed.
//
// Stating that on the page is the point: an unreproducible result and a reproducible one should
// not be presented identically.
//
// Provenance. Two earlier drafts are withdrawn and are no longer served:
//   * This site used to host a pre-correction draft of the agentic-verification paper that
//     claimed an adherence figure of one hundred percent and a null-confidence defence. The
//     repository's own checker measured both false and the authors withdrew them ("removed.
//     Measured accuracy is 66.3%"; "zero null scores in 599 parseable outputs"). The published
//     PDF is now the corrected camera-ready and the abstract is the paper's real one.
//   * A second manuscript described a benchmark corpus that was never built and repeated the
//     retracted containment figure. It is withdrawn outright and replaced by nothing.
// Both superseded drafts are kept under content/withdrawn/ for provenance, not published. The
// withdrawn strings are themselves forbidden by reputation/check_surfaces.py, which is why this
// note describes them instead of quoting them.

export type Paper = {
  slug: string;
  title: string;
  authors: string[];
  venue: string;
  status: "accepted" | "presented" | "manuscript";
  abstract: string;
  pdf: string;
  repo: string;
  artifact: "public-reproducible" | "not-released" | "not-empirical";
  // Printed affiliation for this paper. Omitted means the CSE department, which is what the
  // roster says for most of them. hcg's byline names Computer Engineering instead, and
  // embodiedos's report names no institution at all - asserting one for it was inventing a fact.
  affiliation?: string;
};

export const PAPERS: Paper[] = [
  {
    slug: "agentic-verification",
    title: "Edge-Native Semantic Firewall for Autonomous LLM Agents: A Structured Chain-of-Thought Verification Framework",
    authors: ["Sushant Poudel", "Rakhee Pandey", "Aashika Pandey"],
    venue: "Accepted; camera-ready in progress",
    status: "accepted",
    abstract: "An autonomous agent that executes actions rather than proposing them sits outside the reach of role-based access control, which authenticates an identity but has nothing to say about whether a given action should happen. Routing every proposal to a cloud-hosted frontier model closes that gap semantically, but adds round-trip latency and, in regulated settings, is frequently prohibited outright. We describe an edge-native semantic firewall: a 3.8B-parameter Phi-3-mini model, 4-bit quantized and held under a 4.2 GiB VRAM ceiling, occupying the evaluator stage of a Generator–Evaluator pipeline on a single consumer laptop. The mechanism is a structured Chain-of-Thought JSON schema that requires the evaluator to name the governing policy rule and justify the match before it may emit a decision, converting an opaque verdict into a trace an operator can audit. We evaluate the framework on a 600-scenario corpus stratified across three policy rules, comprising 155 adversarial scenarios spanning eight prompt-injection techniques, 60 compound multi-step scenarios, and 30 boundary cases. All 1,800 generations of a three-condition comparison were executed on the model itself at temperature 0, with no cloud calls at any stage. The results invert a natural assumption. Constraining the output format without requiring the reasoning step produced the least safe evaluator of the three: the JSON-only arm approved 46.2% of the proposals the policy would have blocked or sent to human review, which is worse than the unconstrained free-form arm at 17.2%. The full schema cut that to 23.5% and raised decision accuracy from 52.3% to 66.3%. On the irreversible class, where a wrong answer cannot be recalled, accuracy runs 62.5% under JSON-only, 72.1% under free-form, and 90.8% under the proposed schema, and approvals of hard-denial actions fall from 71 to 6. The gain is real, and it is not sufficient. The best configuration still approved 6 of 208 hard-denial actions, and it was more permissive than free-form on ambiguous proposals that should have reached a human. Peak VRAM was 3.95 GiB and median evaluation latency was 2.55 s, both consistent with edge operation. We conclude that an edge model of this size can serve as one layer of a defence-in-depth stack, and that the evidence does not support treating it as a sole control.",
    pdf: "/papers/agentic-verification.pdf",
    repo: "https://github.com/sushant-me/Edge-Native_Semantic_Firewall_",
    artifact: "public-reproducible",
  },
{
    slug: "prebas",
    title: "PREBAS: Preemptive Bandwidth Scaling for WebRTC in LEO Satellite Networks Using Lightweight Neural Prediction",
    authors: ["Sushant Poudel"],
    venue: "2026 IEEE RTC — Chicago, USA",
    status: "accepted",
    abstract: "Low Earth Orbit (LEO) mega-constellations promise universal broadband, but their orbital mechanics — terminals moving at 7.6 km/s, with handoffs recurring every few minutes — produce abrupt capacity crashes that violate the stationary-channel assumptions behind modern real-time protocols. Google Congestion Control (GCC), the standard for Web Real-Time Communication (WebRTC), only detects congestion after a queue has already built, so during a LEO handoff the encoder keeps pushing a high bitrate into a channel that has already collapsed, producing severe bufferbloat and, in a typical five-minute session, more than 1,000 frame freezes. This paper introduces PREBAS (PREemptive BAndwidth Scaling), an edge-native predictive framework built around an ultra-lightweight one-dimensional convolutional neural network (1D-CNN). Reading a 320 ms sliding window of capacity, round-trip time (RTT), and loss-burst telemetry, the model isolates the causal “RTT creep” signature that appears 200–500 ms before a handoff, then preemptively scales bitrate down by a factor of Sf = 0.40 to drain the transmission queue before the crash, with a 300 ms cooldown preventing GCC from immediately reversing the cut. Across 30 independent stochastic trials — covering handoffs, ITU-R P.618-14 rain fade, and channel noise — PREBAS reduces frame freezes by 79% relative to GCC at a cost of only 8.9% of average bitrate, lifting the ITU-T P.910 QoE score by 8.36 points (43% relative) to within 2.9% of the Oracle ceiling. An ablation confirms the result depends on reading capacity, RTT, and loss jointly, filtering 92% of rain-fade false positives a single-signal heuristic misses. At 1,537 parameters and 0.091 ms inference latency on commodity ARM hardware, the model is deployable on existing edge infrastructure without GPU acceleration.",
    pdf: "/papers/prebas.pdf",
    repo: "",
    artifact: "not-released",
  },
{
    slug: "hcg",
    title: "A Hybrid Causal-Generative Multi-Agent Framework for Secure Autonomous Mechatronics: Mitigating Real-Time Prompt Injections in Edge-Deployed Disaster Recovery Networks",
    authors: ["Aashika Pandey", "Sushant Poudel"],
    venue: "Manuscript",
    status: "manuscript",
    abstract: "As large language models increasingly assume command of autonomous mechatronic swarms in disaster recovery operations, a structurally underexplored vulnerability emerges: realtime prompt injection delivered through legitimate sensory channels. Unlike conventional cyber intrusions, these attacks subvert the semantic reasoning layer itself, translating adversarial natural language inputs into irreversible kinetic consequences through motor controllers and actuators. Existing defenses rely on cloud-based API guardrails or secondary monitoring models that are architecturally incompatible with edge-deployed, communication-denied environments. This paper presents the Hybrid Causal-Generative Multi-Agent Framework (HCG-MAF), which interposes a lightweight Causal Safety Enforcer (CSE) between the LLM output stage and the microcontroller interface. The CSE maintains a dynamically calibrated Structural Causal Model (SCM) of each agent's physical environment and applies Pearl's do-calculus to evaluate the counterfactual kinetic consequences of every generated directive before actuation. Across 400 adversarial trials spanning three injection vectors, drawn from a wider 772-sample Sim-to-Real cohort, HCG-MAF achieves a 98.5% Intervention Success Rate (ISR, 394/400) at a 42 ms mean safety-decision latency with a 1.2% false-positive rate, all without cloud connectivity; on transient cases inside the first 45 ms the ISR falls to 96.8%. A Byzantineresilient gossip-based consensus protocol secured through cryptographic causal attestation maintains swarm coherence under simultaneous compromise of up to one-third of deployed agents, provided the n ≥ 3f + 1 bound is satisfied.",
    pdf: "/papers/hcg.pdf",
    repo: "",
    artifact: "not-released",
    affiliation: "Department of Computer Engineering, Nepal Engineering College, Bhaktapur, Nepal",
  },
{
    slug: "okf-dfir",
    title: "Evaluating Google's Open Knowledge Format (OKF v0.1) for Multi-Agent Threat Intelligence: A Proof-of-Concept in Digital Forensics",
    authors: ["Sushant Poudel", "Rakhee Pandey"],
    venue: "Manuscript",
    status: "manuscript",
    abstract: "Large Language Models (LLMs) are reshaping Digital Forensics and Incident Response (DFIR), but the unstructured JSON telemetry these systems still rely on has become a critical bottleneck for autonomous multiagent threat intelligence pipelines. In highnoise forensic environments, ingesting monolithic data dumps drives context exhaustion, inflates latency, and triggers hallucination rates severe enough to undermine operational integrity. This paper evaluates Google’s Open Knowledge Format (OKF v0.1) as a selectively traversable, graphnative alternative to flat serialization. Through a controlled benchmark of 7,680 inference cycles spanning five open-source model architectures and escalating decoy densities, we show that OKF Selective sustains noiseinvariant recall (0.94–0.99), cuts token overhead by 33.6%, and suppresses hallucination by 81.1% at the hardest of four difficulty tiers relative to a JSON baseline, which itself degrades from 33% to 92% error across those tiers. These results establish that semantic knowledge representation is not simply an engineering optimization — it is an architectural prerequisite for trustworthy autonomous cyber defense.",
    pdf: "/papers/okf-dfir.pdf",
    repo: "",
    artifact: "not-released",
  },
{
    slug: "wifi-sensing",
    title: "Evaluating Wi-Fi Sensing Attack Vectors: AI-Driven Covert Threat Detection and Deterministic Mitigation in Mobile and Edge Ecosystems",
    authors: ["Sushant Poudel"],
    venue: "Manuscript",
    status: "manuscript",
    abstract: "Wi-Fi was designed to move data. Paired with modern deep learning, it has quietly become something else: a sensing fabric that detects motion, infers behavior, and reconstructs physical activity from signal reflections alone, using hardware cheaper than a home router. Enterprise and IoT security was never built for this pairing, creating a significant, largely invisible attack surface. This paper presents a rigorous empirical evaluation of covert Wi-Fi sensing attacks in realistic, interference-prone IoT environments, built around a bidirectional LSTM trained to correlate Channel State Information (CSI) sequences with keystroke signatures. A passive adversary with only commodity hardware and this learned model can extract finegrained keystroke intelligence, including PIN entries, without network authentication, physical access, or a single injected packet. The attack reaches an F₁ score of 85.4% in enterprise line-of-sight conditions. It still reaches an F₁ of 61.2% through a standard 15 cm drywall partition — over six times the 10% floor of a ten-class random guess. To neutralize this threat at its source, we introduce RF-Guard: a deterministic, stateful CSI obfuscation framework at the firmware level that gives the attacking model nothing stable to learn from. RF-Guard collapses adversarial accuracy to 9.8% across three IoT testbeds, with gray-box retraining recovering only to 14.3% F₁; a fully adaptive neural adversary remains untested and is named as future work. It adds under 4.2% throughput overhead on a standard ESP32 microcontroller during a continuous 24-hour stress test. No hardware replacement is required.",
    pdf: "/papers/wifi-sensing.pdf",
    repo: "",
    artifact: "not-released",
  },
{
    slug: "leo-d2d",
    title: "Direct-to-Device LEO Satellite Communication: A System Architecture for Universal 5G NTN Connectivity with Focus on Nepal",
    authors: ["Sushant Poudel", "Aashika Pandey"],
    venue: "Space Con 2026",
    status: "presented",
    abstract: "Over 2.6 billion people still have no dependable internet access. The hardest cases to solve are not cities but the remote valleys, highland plateaus, and scattered rural communities where running fiber or building cell towers makes no economic sense. Nepal, with more than 40 percent of its land above 3,000 meters, sits right at the center of this problem. This paper describes a four-layer satellite communication architecture that lets an ordinary smartphone connect directly to a Low Earth Orbit satellite without any hardware change beyond swapping in a 5G Non-Terrestrial Network modem chip. The first layer is a reconfigurable metamaterial phased-array antenna built into the phone bezel: four circularly polarized elements with onebit phase shifters that steer an electronic beam across a sixtydegree elevation arc, reaching 3 to 6 dBi of gain without moving parts. The second layer is the NTN modem itself, duty-cycle gated so the satellite transmitter only wakes when the terrestrial signal drops below a usable level, keeping average power below five watts. The third layer is a predictive handover engine that reads the satellite orbit data and pre-negotiates the next connection before the current one starts to fade, cutting handover gaps to under fifty milliseconds. The fourth layer is the ground segment, where standard 5G core interfaces accept the satellite node as just another base station. A worked link budget shows 12.3 dB of margin at the worst elevation angle, supporting one to ten megabits per second with better than 99 percent availability and 20 to 50 milliseconds of end-to-end latency. The paper closes with a discussion of three remaining engineering challenges and what this architecture could mean specifically for Nepal’s digital future and emerging space sector.",
    pdf: "/papers/leo-d2d.pdf",
    repo: "",
    artifact: "not-empirical",
  },
{
    slug: "swayam",
    title: "Project Swayam: The Unbreakable Municipality — Building Nepal's First Fully Offline, Sovereign AI Governance System",
    authors: ["Sushant Poudel", "Aashika Pandey"],
    venue: "Municipal AI Governance Conference 2026, Budhanilkantha Municipality, Nepal",
    status: "presented",
    abstract: "Municipal governance in Nepal depends on cloud-based digital infrastructure that freezes during internet outages, transmits sensitive citizen data to foreign servers, and exposes public systems to novel AI-driven cyber threats. This paper proposes Project Swayam (स्ियं — “Self-Sovereign”), a fully offline, air-gapped municipal AI architecture comprising three cooperative components: a quantized local language model (the Local Brain) for citizen-facing service automation, a deterministic intentvalidation firewall (the Gatekeeper) for zero-trust database security, and a disaster-resilient radio mesh (the Off-Grid Pulse) for post-disaster survivor coordination. Bench-tested on a standard municipal desktop costing approximately NPR 40,500, the Local Brain processes citizen requests in Nepali, Romanized Nepali, and English at 12.4 tokens per second with zero cloud dependency. The Gatekeeper achieves a 100% true-positive rate against catastrophic data-extraction attacks (n=1,700; 95% CI 98.4-100%), with a false-positive rate of 1.38% (n=800), at a mean detection latency of 16.2 ms, scoring above commercial probabilistic filters such as Meta Prompt Guard and Azure Prompt Shield on the metrics measured. The Off-Grid Pulse mesh sustains over 88% packet delivery after 40% node failure in simulation. Building on these results, we present the Budhanilkantha Municipal AI Declaration 2026—six articles embedding sovereign edge principles into local governance law—alongside an 18-month implementation roadmap requiring no foreign technical dependency.",
    pdf: "/papers/swayam.pdf",
    repo: "",
    artifact: "not-released",
  },
{
    slug: "embodiedos",
    title: "EmbodiedOS: Embodied Intelligence — A Practical Software Architecture for Real-Time Robotic Decision Making",
    authors: ["Sushant Poudel"],
    venue: "Technical report, v0.1.0",
    status: "manuscript",
    abstract: "",
    pdf: "/papers/embodiedos.pdf",
    repo: "",
    artifact: "not-released",
    affiliation: "",
  },
{
    slug: "data-center",
    title: "Feasibility Study for Establishing Nepal as a Data Center Hub of South Asia",
    authors: ["Sulav Timalsina", "Sushant Poudel"],
    venue: "Manuscript",
    status: "manuscript",
    abstract: "Increased use of the internet and use of digital technologies in South Asia in recent times have created an increased demand for reliable and sustainable data infrastructure. Through this research, this work examines whether Nepal can become a central hub for data centers in South Asia through analysis of its strategic advantages, which include rich sources of renewable energy, favorable climate, and its location in between China and India. The research design adopted in this research is based upon a case study framework, including site visits and interviews carried with the stakeholders and data centers within Nepal, to assess important factors such as energy efficiency, infrastructure readiness, availability of human capacity, regulatory environments, climaterelated hazards, and economic viability. The outcomes of this analysis show that in terms of energy costs, sustainability, and operational efficiency, Nepal holds an advantage, but concurrently highlight seismic hazard issues, relatively small market size, and data accessibility issues. The study concludes that with targeted investment, policy reforms, and regional cooperation, Nepal has the potential to emerge as a data center hub for South Asia.",
    pdf: "/papers/data-center.pdf",
    repo: "",
    artifact: "not-released",
  },
];
