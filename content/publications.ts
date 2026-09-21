// Generated from the paper PDFs in public/images by scripts/… — see the note at the top of
// the file for how abstracts were extracted. Authors and titles are as printed on each
// paper, in the order printed. Do not reorder or add authors by hand.

export type Paper = {
  slug: string;
  title: string;
  authors: string[];
  venue: string;
  status: "accepted" | "presented" | "manuscript";
  abstract: string;
  pdf: string;
  repo: string;
};

export const PAPERS: Paper[] = [
  {
    slug: "prebas",
    title: "PREBAS: Preemptive Bandwidth Scaling for WebRTC in LEO Satellite Networks Using Lightweight Neural Prediction",
    authors: ["Sushant Poudel"],
    venue: "2026 IEEE RTC — Chicago, USA",
    status: "accepted",
    abstract: "Low Earth Orbit (LEO) mega-constellations promise universal broadband, but their orbital mechanics — terminals moving at 7.6 km/s, with handoffs recurring every few minutes — produce abrupt capacity crashes that violate the stationary-channel assumptions behind modern real-time protocols. Google Congestion Control (GCC), the standard for Web Real-Time Communication (WebRTC), only detects congestion after a queue has already built, so during a LEO handoff the encoder keeps pushing a high bitrate into a channel that has already collapsed, producing severe bufferbloat and, in a typical five-minute session, more than 1,000 frame freezes. This paper introduces PREBAS (PREemptive BAndwidth Scaling), an edge-native predictive framework built around an ultra-lightweight one-dimensional convolutional neural network (1D-CNN). Reading a 320 ms sliding window of capacity, round-trip time (RTT), and loss-burst telemetry, the model isolates the causal “RTT creep” signature that appears 200–500 ms before a handoff, then preemptively scales bitrate down by a factor of Sf = 0.40 to drain the transmission queue before the crash, with a 300 ms cooldown preventing GCC from immediately reversing the cut. Across 30 independent stochastic trials — covering handoffs, ITU-R P.618-14 rain fade, and channel noise — PREBAS reduces frame freezes by 79% relative to GCC at a cost of only 8.9% of average bitrate, lifting the ITU-T P.910 QoE score by 8.36 points (43% relative) to within 2.9% of the Oracle ceiling. An ablation confirms the result depends on reading capacity, RTT, and loss jointly, filtering 92% of rain-fade false positives a single-signal heuristic misses. At 1,537 parameters and 0.091 ms inference latency on commodity ARM hardware, the model is deployable on existing edge infrastructure without GPU acceleration.",
    pdf: "/papers/prebas.pdf",
    repo: "",
  },
  {
    slug: "firewall",
    title: "LLM Agent Firewall: Real-Time Detection and Neutralization of Prompt Injection in Multi-Agent Systems",
    authors: ["Sushant Poudel"],
    venue: "Manuscript",
    status: "manuscript",
    abstract: "The deployment of Large Language Models (LLMs) is rapidly shifting from single-turn chatbots to autonomous, multi-agent pipelines. Frameworks such as AutoGen and LangGraph enable specialized agents to collaborate on complex workflows; however, this open inter-agent connectivity introduces a critical vulnerability: cascading prompt injection. An attack compromising a single edge agent can silently propagate malicious instructions downstream, compromising the entire network. Current defenses rely on LLM-as-a-Judge architectures, which we empirically demonstrate introduce structurally prohibitive latencies averaging 5.4 seconds per pipeline hop. In this paper, we introduce the LLM Agent Firewall, a high-speed, inline inspection layer designed to secure inter-agent trust boundaries. We present MAPI-6K, a novel dataset of 6,000 inter-agent communications spanning benign workflows, overt attacks, and subtle adversarial evasions. We evaluate a lightweight TF-IDF and Logistic Regression classifier, demonstrating 100% containment of overt attacks with zero false positives at a mean overhead of 0.96 ms. Against adversarially paraphrased evasions, this fast classifier fails entirely, motivating a Confidence-Calibrated Hybrid Architecture that fast-tracks high-confidence traffic and escalates only the uncertain 4.8% to a semantic LLM judge, reducing perhop latency by 20.8×—from 5,411 ms to an operationally viable 261 ms—while achieving total threat coverage across all attack strata.",
    pdf: "/papers/firewall.pdf",
    repo: "",
  },
  {
    slug: "agentic-verification",
    title: "Designing Real-Time Verification Frameworks for Autonomous Agentic Decisions",
    authors: ["Sushant Poudel"],
    venue: "Manuscript",
    status: "manuscript",
    abstract: "Autonomous AI agents that plan, reason, and execute actions across live infrastructure represent something qualitatively new in enterprise computing—and something that existing security architectures were not designed to handle. Role-Based Access Control, the default access management paradigm in most production environments, was built for deterministic software operating within predictable behavioral boundaries. It evaluates credentials, not intent. When the actor is a Large Language Model capable of generating confident, fluent, and occasionally catastrophic commands against databases, codebases, and system infrastructure, credential-based access control leaves a dangerous interpretive gap—one that grows wider with every new capability granted to autonomous agents. The natural institutional response has been to route proposed agent actions through large, cloud-hosted frontier models capable of the kind of semantic reasoning that access control cannot provide. This works, in controlled settings. It fails when regulatory constraints prohibit sensitive infrastructure data from leaving organizational boundaries—conditions that describe a substantial fraction of the environments where agentic AI is being deployed most aggressively. This paper proposes and empirically validates a localized Real-Time Verification Framework built on a 4-bit quantized Phi-3-mini instance (3.8 billion parameters), deployed as a zero-latency semantic firewall within a multi-agent Generator-Evaluator pipeline running entirely on consumer-grade edge hardware. The central technical contribution is a structured Chain-ofThought JSON prompting methodology that compels the edge model to explicitly articulate the governing policy rule before emitting any routing decision, effectively externalizing deductive reasoning into an auditable trace and neutralizing the alignment failures typical of unconstrained sub-5B parameter models. Evaluated across three high-risk operational scenarios, the framework achieves 100% deterministic policy adherence, establishing that edge-native semantic verification is not a hardware compromise but a strategically sound architectural choice for securing autonomous agentic workflows.",
    pdf: "/papers/agentic-verification.pdf",
    repo: "",
  },
  {
    slug: "hcg",
    title: "A Hybrid Causal-Generative Multi-Agent Framework for Secure Autonomous Mechatronics: Mitigating Real-Time Prompt Injections in Edge-Deployed Disaster Recovery Networks",
    authors: ["Aashika Pandey", "Sushant Poudel"],
    venue: "Manuscript",
    status: "manuscript",
    abstract: "As large language models increasingly assume command of autonomous mechatronic swarms in disaster recovery operations, a structurally underexplored vulnerability emerges: realtime prompt injection delivered through legitimate sensory channels. Unlike conventional cyber intrusions, these attacks subvert the semantic reasoning layer itself, translating adversarial natural language inputs into irreversible kinetic consequences through motor controllers and actuators. Existing defenses rely on cloud-based API guardrails or secondary monitoring models that are architecturally incompatible with edge-deployed, communication-denied environments. This paper presents the Hybrid Causal-Generative Multi-Agent Framework (HCG-MAF), which interposes a lightweight Causal Safety Enforcer (CSE) between the LLM output stage and the microcontroller interface. The CSE maintains a dynamically calibrated Structural Causal Model (SCM) of each agent's physical environment and applies Pearl's do-calculus to evaluate the counterfactual kinetic consequences of every generated directive before actuation. Across a 772-sample Sim-to-Real evaluation cohort covering three adversarial injection vectors, HCG-MAF achieves a 98.5% Intervention Success Rate (ISR) with a 42 ms safety decision latency and 1.2% false positive rate, all without cloud connectivity. A Byzantineresilient gossip-based consensus protocol secured through cryptographic causal attestation maintains swarm coherence under simultaneous compromise of up to one-third of deployed agents, provided the n ≥ 3f + 1 bound is satisfied.",
    pdf: "/papers/hcg.pdf",
    repo: "",
  },
  {
    slug: "okf-dfir",
    title: "Evaluating Google's Open Knowledge Format (OKF v0.1) for Multi-Agent Threat Intelligence: A Proof-of-Concept in Digital Forensics",
    authors: ["Sushant Poudel", "Rakhee Pandey"],
    venue: "Manuscript",
    status: "manuscript",
    abstract: "Large Language Models (LLMs) are reshaping Digital Forensics and Incident Response (DFIR), but the unstructured JSON telemetry these systems still rely on has become a critical bottleneck for autonomous multiagent threat intelligence pipelines. In highnoise forensic environments, ingesting monolithic data dumps drives context exhaustion, inflates latency, and triggers hallucination rates severe enough to undermine operational integrity. This paper evaluates Google’s Open Knowledge Format (OKF v0.1) as a selectively traversable, graphnative alternative to flat serialization. Through a controlled benchmark of 7,680 inference cycles spanning five open-source model architectures and escalating decoy densities, we show that OKF Selective sustains noiseinvariant recall (0.94–0.99), cuts token overhead by 33.6%, and suppresses hallucination by more than 80% relative to a JSON baseline. These results establish that semantic knowledge representation is not simply an engineering optimization — it is an architectural prerequisite for trustworthy autonomous cyber defense. II. LITERATURE REVIEW A. Large Language Models in Digital Forensics and Incident Response Early evaluations of LLMs in DFIR tested whether general-purpose models could support forensic reasoning at all. Scanlon et al. found GPT-4 useful for artefact interpretation and incident response, but only with an examiner able to catch its errors [9]. Wickramasekara et al.’s 176-article survey identified the same open problem: a lack of validation frameworks and standardized evaluation protocols for LLM-assisted forensics [10]. More specialized systems followed: ForensicLLM, a finetuned LLaMA-3.1-8B model, outperformed both its base model and standard RAG on forensic question answering [11]; a dedicated RAG pipeline improved cyber-attack attribution accuracy [12]; and the DFIR-Metric benchmark formalized cross-model evaluation on timeline reconstruction and malware analysis [13]. None of this work isolates representational format as an independent variable — the gap this paper targets.",
    pdf: "/papers/okf-dfir.pdf",
    repo: "",
  },
  {
    slug: "wifi-sensing",
    title: "Evaluating Wi-Fi Sensing Attack Vectors: AI-Driven Covert Threat Detection and Deterministic Mitigation in Mobile and Edge Ecosystems",
    authors: ["Sushant Poudel"],
    venue: "Manuscript",
    status: "manuscript",
    abstract: "Wi-Fi was designed to move data. Paired with modern deep learning, it has quietly become something else: a sensing fabric that detects motion, infers behavior, and reconstructs physical activity from signal reflections alone, using hardware cheaper than a home router. Enterprise and IoT security was never built for this pairing, creating a significant, largely invisible attack surface. This paper presents a rigorous empirical evaluation of covert Wi-Fi sensing attacks in realistic, interference-prone IoT environments, built around a bidirectional LSTM trained to correlate Channel State Information (CSI) sequences with keystroke signatures. A passive adversary with only commodity hardware and this learned model can extract finegrained keystroke intelligence, including PIN entries, without network authentication, physical access, or a single injected packet. The attack reaches an F₁ score of 85.4% in enterprise line-of-sight conditions. It still retains 61.2% accuracy through a standard 15 cm drywall partition, more than six times random chance. To neutralize this threat at its source, we introduce RF-Guard: a deterministic, stateful CSI obfuscation framework at the firmware level that gives the attacking model nothing stable to learn from. RF-Guard collapses adversarial accuracy to 9.8% across three IoT testbeds, resists adaptive and gray-box retraining attacks, and adds under 4.2% throughput overhead on a standard ESP32 microcontroller during a continuous 24-hour stress test. No hardware replacement is required. useful doors: locating survivors in collapsed buildings, monitoring elderly patients without cameras, detecting falls without wearables. But the same physics that enables these applications creates a threat that most enterprise security teams are entirely unprepared for. The problem with Wi-Fi sensing as an attack surface is not just its power — it is its invisibility. Decades of network security investment have been aimed squarely at the upper layers of the OSI stack: suspicious packets, failed logins, unusual traffic volumes. Wi-Fi sensing attacks ignore all of that. An adversary passively reading RF reflections off a human body never sends a malicious packet. There is nothing for a firewall to inspect, no signature to match, no authentication to probe. The attack channel exists in the physics of signal propagation itself, completely beneath the waterline of conventional detection. What makes this particularly pressing is that the research community has not yet caught up to the operational reality. The bulk of existing work demonstrates these attacks under controlled, near-ideal conditions — single-room setups, minimal interference, carefully tuned hardware — results that are difficult for a security engineer deploying defenses across a hospital wing or factory floor to act on directly. Real environments are messy: multipath reflections, competing devices, variable occupancy, heterogeneous hardware. Without empirical results that hold under those conditions, practitioners are left defending against a threat they cannot properly characterize.",
    pdf: "/papers/wifi-sensing.pdf",
    repo: "",
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
  },
  {
    slug: "swayam",
    title: "Project Swayam: The Unbreakable Municipality — Building Nepal's First Fully Offline, Sovereign AI Governance System",
    authors: ["Sushant Poudel", "Aashika Pandey"],
    venue: "Municipal AI Governance Conference 2026, Budhanilkantha Municipality, Nepal",
    status: "presented",
    abstract: "Municipal governance in Nepal depends on cloud-based digital infrastructure that freezes during internet outages, transmits sensitive citizen data to foreign servers, and exposes public systems to novel AI-driven cyber threats. This paper proposes Project Swayam (स्ियं — “Self-Sovereign”), a fully offline, air-gapped municipal AI architecture comprising three cooperative components: a quantized local language model (the Local Brain) for citizen-facing service automation, a deterministic intentvalidation firewall (the Gatekeeper) for zero-trust database security, and a disaster-resilient radio mesh (the Off-Grid Pulse) for post-disaster survivor coordination. Bench-tested on a standard municipal desktop costing approximately NPR 40,500, the Local Brain processes citizen requests in Nepali, Romanized Nepali, and English at 12.4 tokens per second with zero cloud dependency. The Gatekeeper achieves a 100% true-positive rate against catastrophic data-extraction attacks at a mean detection latency of 16.2 ms, outperforming commercial probabilistic filters such as Meta Prompt Guard and Azure Prompt Shield on every measured metric. The Off-Grid Pulse mesh sustains over 88% packet delivery after 40% node failure in simulation. Building on these results, we present the Budhanilkantha Municipal AI Declaration 2026—six articles embedding sovereign edge principles into local governance law—alongside an 18-month implementation roadmap requiring no foreign technical dependency.",
    pdf: "/papers/swayam.pdf",
    repo: "",
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
  },
];
