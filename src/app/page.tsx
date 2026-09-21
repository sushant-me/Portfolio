"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Reveal from "../components/Reveal";
import ScrollProvider, { useScroll } from "../components/ScrollProvider";
import Scene3D from "../components/Scene3D";
import ScrollHud from "../components/ScrollHud";
import SectionHeading from "../components/SectionHeading";
import CursorGlow from "../components/CursorGlow";
import SectionParallax from "../components/SectionParallax";
import HorizontalScroller from "../components/HorizontalScroller";
import VelocityFx from "../components/VelocityFx";
import ScrollDock from "../components/ScrollDock";
import HeroLandscape from "../components/HeroLandscape";
import { useTilt } from "../components/useTilt";
import { useInView } from "../components/useInView";
import { useScrollProgress } from "../components/useScrollProgress";

/** The hero name, split for the impact entrance. Kept as words, not letters,
 *  so the rendered text stays a single readable string. */
const NAME_WORDS = ["Sushant", "Poudel"];

const ROLES = ["AI Researcher","Full-Stack Engineer","Cybersecurity Specialist","QA Automation Expert","Crisis Engineer","Flutter Developer"];

/**
 * Display-size derivative of an original asset, produced by
 * scripts/optimize-images.py. The originals are 16-20 MB camera files; the grid
 * never draws them wider than ~600px, so it loads the optimised copy and the
 * lightbox opens the original.
 */
const optimized = (path: string) => path.replace("/images/", "/images/optimized/");

const SECTIONS = [
  { id: "about", label: "Overview", color: "#3b82f6" },
  { id: "experience", label: "Experience", color: "#ef4444" },
  { id: "research", label: "Research", color: "#22c55e" },
  { id: "projects", label: "Projects", color: "#a855f7" },
  { id: "achievements", label: "Achievements", color: "#ec4899" },
  { id: "certificates", label: "Certificates", color: "#06b6d4" },
  { id: "skills", label: "Skills", color: "#f59e0b" },
];

const STATS = [
  { value: 1, suffix: "", label: "Security patch merged into google/go-github" },
  { value: 5, suffix: "", label: "Memory-safety issues filed in google/s2geometry" },
  { value: 116, suffix: "", label: "Flags on the HackingHub Q3 2026 board — rank #1" },
  { value: 2, suffix: "", label: "IEEE papers accepted" },
  { value: 2, suffix: "", label: "Years as a full-time AI engineer" },
  { value: 3, suffix: "", label: "Security tools released and CI-tested" },
];


const EXPERIENCE = [
  {
    role: "AI Engineer",
    company: "Atmos SoftTech Pvt. Ltd.",
    location: "Birgunj, Nepal",
    period: "Mar 2024 – Mar 2026",
    desc: "Two years full-time designing, developing and deploying AI-based systems and machine-learning models in production. Built and maintained full-stack web applications end to end, and engineered autonomous agent pipelines — tool-calling, multi-step task orchestration, retrieval over private local data, and offline-first inference where sending data to a cloud API was not acceptable. Conduct and performance rated highly satisfactory in the company's signed experience letter.",
    tags: ["Production ML", "Autonomous agents", "Full-stack", "Offline inference"],
    color: "#22c55e",
  },
  {
    role: "Autonomous AI Intern — Capstone",
    company: "Next AI",
    location: "Bhaktapur, Nepal",
    period: "2026",
    desc: "Capstone at an AI studio working on agent runtimes and human-in-the-command architectures for emerging Asian markets, building autonomous agent pipelines with RAG and LangChain.",
    tags: ["AI agents", "RAG", "LangChain", "Capstone"],
    color: "#3b82f6",
  },
  {
    role: "Technical Lead & Software Developer",
    company: "Avatar Tech Solutions Pvt. Ltd.",
    location: "Kathmandu, Nepal",
    period: "Dec 2025 – Jun 2026",
    desc: "Core full-stack technical lead architecting corporate web ecosystems and mobile applications. Managed enterprise IT infrastructure for 30+ computer setups. Engineered automated inventory management with hardware-software integration. Spearheaded digital marketing initiatives and brand visibility campaigns.",
    tags: ["Next.js", "Flutter", "IT infrastructure", "Leadership"],
    color: "#ef4444",
  },
  {
    role: "Cybersecurity & AI Intern",
    company: "Eminence Ways Pvt. Ltd.",
    location: "Bhaktapur, Nepal",
    period: "2025 – 2026",
    desc: "Leading cybersecurity company in Nepal since 2013. Conducted penetration testing, vulnerability assessments, and security audits for enterprise clients across Asia, Europe, Australia, and the USA. Discovered critical CVE vulnerabilities and delivered structured remediation reports.",
    tags: ["Pentesting", "SIEM", "Network security", "OWASP"],
    color: "#22c55e",
  },
  {
    role: "AI & Fundamentals Instructor",
    company: "Nobel Academy",
    location: "Nepal",
    period: "2025 – 2026",
    desc: "Delivered foundational AI and computer science education through structured coaching programs. Developed curriculum modules for emerging technology literacy, practical programming skills, and hands-on machine learning workshops for students.",
    tags: ["Teaching", "Curriculum design", "Mentorship"],
    color: "#a855f7",
  },
];

type Research = {
  title: string;
  venue: string;
  venueType: "conference" | "preprint";
  desc: string;
  tags: string[];
  color: string;
  /** Public link rendered as "Read Paper" — optional, because an accepted paper
   *  whose PDF is not public yet has nothing honest to point at. */
  file?: string;
};

const RESEARCH: Research[] = [
  {
    title: "PREBAS: Preemptive Bandwidth Scaling for WebRTC in LEO Satellite Networks",
    venue: "2026 IEEE RTC — Chicago, USA",
    venueType: "conference",
    desc: "Accepted. Predictive bandwidth scaling for real-time WebRTC video over low-Earth-orbit links, where round-trip times and handover gaps break conventional congestion control. A lightweight neural predictor scales the send rate ahead of the link degradation instead of reacting to it, evaluated against reactive baselines over emulated LEO conditions.",
    tags: ["5G NTN", "LEO satellite", "Neural prediction"],
    color: "#a855f7",
  },
  {
    title: "Edge-Native Semantic Firewall for Autonomous LLM Agents",
    venue: "IEEE — accepted, camera-ready in progress, to be presented at NCIT",
    venueType: "conference",
    desc: "Accepted. A structured Chain-of-Thought verification framework that asks whether a small, locally served model can enforce policy for an agent that executes actions rather than proposing them. 600 policy scenarios per condition on Phi-3-mini (3.8B, 4-bit) on one consumer laptop inside a 4.2 GiB VRAM budget, with no cloud inference. The result contradicted our hypothesis: constraining output to JSON without a reasoning field was the least safe of the three arms (46.2% unsafe accepts versus 17.2% unconstrained), while a mandated reasoning field cut false accepts of irreversible hard-denial commands from 71 to 6. The residual failures are reported rather than rounded away.",
    tags: ["AI security", "Agent safety", "Local inference", "Evaluation"],
    color: "#3b82f6",
    file: "https://github.com/sushant-me/Edge-Native_Semantic_Firewall_",
  },
  {
    title: "MCP tool shadowing in Google's agent frameworks",
    venue: "Open pull requests — adk-go, adk-java, adk-python",
    venueType: "conference",
    desc: "Fixes and reports for framework-reserved tool names that a server-supplied MCP tool can occupy, bypassing the duplicate-name guard: an in-model built-in such as google_search, or the terminal tool set_model_response. Reproduced in Go and Java against the real frameworks, with the reserved sets corrected against each port rather than copied between them.",
    tags: ["MCP", "Agent security", "Tool boundaries"],
    color: "#22c55e",
    file: "https://github.com/google/adk-go/pull/1606",
  },
  {
    title: "EmbodiedOS: Offline-First Robotic OS with RAG Memory",
    venue: "Preprint 2026",
    venueType: "preprint",
    desc: "Engineered a fully offline robotic OS eliminating cloud dependency. Utilizes C++ hardware control and local LLMs for manipulation tasks, with RAG-based episodic memory for continuous learning. Everything runs with no network connection at all.",
    tags: ["Robotics", "Embodied AI", "RAG"],
    color: "#ef4444",
    file: "/images/EmbodiedOS_Research_Report.pdf",
  },
  {
    title: "A Hybrid Causal-Generative Multi-Agent Framework",
    venue: "Preprint",
    venueType: "preprint",
    desc: "Proposed the Deep Structural Causal Model (DSCM) architecture to systemically resolve AI hallucinations by mathematically embedding causal graphs into generative networks. Integrates Pearl's do-calculus for robust counterfactual reasoning.",
    tags: ["Causal AI", "VAE", "Hallucination"],
    color: "#22c55e",
    file: "/images/HCG.pdf",
  },
  {
    title: "Direct-to-Device LEO Satellite Communication",
    venue: "Space Con 2026",
    venueType: "conference",
    desc: "Comprehensive architecture for universal 5G Non-Terrestrial Network connectivity connecting smartphones directly to LEO satellites, tailored for Nepal's topography. Targets under 50ms latency for universal connectivity in remote regions.",
    tags: ["5G NTN", "Telecom", "Satellite"],
    color: "#a855f7",
    file: "/images/SpaceCon2026.pdf",
  },
  {
    title: "Nepal as a Green Data Center Hub of South Asia",
    venue: "Preprint 2026",
    venueType: "preprint",
    desc: "Strategic evaluation of Nepal's high-altitude climate and hydropower for sustainable South Asian data infrastructure, analysing the topological, climatic and energy-infrastructure case.",
    tags: ["Sustainability", "Infrastructure", "Hydropower"],
    color: "#f59e0b",
    file: "/images/Article on Feasiblity of Nepal as Data Center Hub.pdf",
  },
  {
    title: "Project Swayam: The Unbreakable Municipality",
    venue: "Conference 2026",
    venueType: "conference",
    desc: "A fully offline, sovereign AI governance stack: a quantized local model for assistance behind a deterministic gatekeeper that blocks data-extraction attempts. Presented at the Municipal AI Governance Conference 2026.",
    tags: ["Edge AI", "Governance", "Sovereignty"],
    color: "#3b82f6",
    file: "/images/Project_Swayam_IEEE_Conference_Paper.pdf",
  },
  {
    title: "Wi-Fi Sensing Attack Vectors: Covert Threat Detection",
    venue: "Preprint 2026",
    venueType: "preprint",
    desc: "Conducted offensive security research on covert surveillance via Wi-Fi Channel State Information (CSI). Proposed deterministic mitigation protocols for enterprise IoT environments against Wi-Fi sensing-based attacks.",
    tags: ["IoT Security", "Offensive Sec", "CSI"],
    color: "#ef4444",
    file: "/images/WiFi_Sensing_Paper_IEEE_Final.pdf",
  },
  {
    title: "Real-Time Verification for Agentic Decisions",
    venue: "Preprint 2026",
    venueType: "preprint",
    desc: "Architected a theoretical framework for bounding and actively verifying LLM-driven autonomous agent decisions in real-time. Effectively mitigates unsafe state transitions in multi-agent collaborative environments.",
    tags: ["AI Safety", "Verification", "Autonomous"],
    color: "#22c55e",
    file: "/images/IEEE_Agentic_Firewall_Paper.pdf",
  },
];

const ADVISORIES = [
  {
    id: "GHSA-qwvv-fcmm-r3j2", severity: "high", color: "#ef4444",
    title: "an authorization bypass in my own policy gate",
    tool: "policygate", fixed: "v0.1.1",
    desc: "A glob deny rule could be stepped around with a newline in the matched value, so the call fell through to a broader allow and proceeded with no human in the loop. The matched value is attacker-influenced: tool names come from the MCP server being gated.",
    url: "https://github.com/sushant-me/policygate/security/advisories/GHSA-qwvv-fcmm-r3j2",
  },
  {
    id: "GHSA-wcqw-86xv-w95q", severity: "medium", color: "#f59e0b",
    title: "a scanner a hostile server could kill before it reported",
    tool: "mcp-nameguard", fixed: "v0.4.8",
    desc: "Replies were read without a bound, so a server returning one enormous body or line could exhaust memory and kill the scan. The tool exists to inspect servers it does not trust, so dying on the reply fails open against the exact adversary it was pointed at.",
    url: "https://github.com/sushant-me/mcp-nameguard/security/advisories/GHSA-wcqw-86xv-w95q",
  },
  {
    id: "GHSA-mffv-hhg5-mm33", severity: "medium", color: "#f59e0b",
    title: "a masker that deleted the word a rule matched on",
    tool: "agentbound", fixed: "v0.1.12",
    desc: "The masker blanked any string that was the whole right-hand side of an assignment, so a one-line message constant became empty and a duplicate-registration rule reported nothing. A false negative in a detector, which its own documentation calls worse than the false positive being fixed.",
    url: "https://github.com/sushant-me/agentbound/security/advisories/GHSA-mffv-hhg5-mm33",
  },
  {
    id: "GHSA-62f4-h552-54wc", severity: "medium", color: "#f59e0b",
    title: "16 of 256 variation selectors covered",
    tool: "mcpaudit", fixed: "v0.1.2",
    desc: "The invisible-character ranges covered U+FE00..U+FE0F and called it \"variation selectors\". The supplement is the same channel, and a payload hidden in it survived both the scan and the helper meant to show a reviewer what the text really contains.",
    url: "https://github.com/sushant-me/mcpaudit/security/advisories/GHSA-62f4-h552-54wc",
  },
];

const PROJECTS = [
  {
    name: "Annapurna Guide",
    tagline: "Final Capstone — Tourism App",
    desc: "A comprehensive digital guide built for navigating and exploring the Annapurna region. Features offline maps, trekking routes, weather integration, and local cultural information. Built as the final capstone submission demonstrating full-stack mobile development expertise.",
    tags: ["Flutter", "Tourism", "Maps"],
    color: "#3b82f6",
    github: "https://github.com/sushant-me/Final-Capstone-Submission---Annapurna-Guide",
  },
  {
    name: "Smart NEPSE",
    tagline: "AI Sentiment & Trust Engine",
    desc: "LSTM-based stock prediction analyzing news sentiment to forecast Nepal Stock Exchange trends. Dynamic Source Credibility Score auto-ranks news sources based on historical prediction accuracy. Features real-time news scraping and sentiment visualization dashboard.",
    tags: ["Python", "LSTM", "NLP", "Finance"],
    color: "#ef4444",
    github: "https://github.com/sushant-me/News_classifier_Nepse",
  },
  {
    name: "Dhukuti Pay",
    tagline: "Offline Payment Wallet — Hackathon",
    desc: "Innovative mobile wallet facilitating secure peer-to-peer financial transactions using local protocols without requiring active internet connectivity. Built for the SRSA Innovator Code Sprint with Flutter and local cryptography. Winner-level prototype.",
    tags: ["Flutter", "Cryptography", "Offline"],
    color: "#22c55e",
    github: "https://github.com/sushant-me/SRSA_Innovator_code_sprint_hackathon(offline pay)",
  },
  {
    name: "NEC Campus App",
    tagline: "Nepal Engineering College Utility",
    desc: "A dedicated campus application developed for Nepal Engineering College students to manage schedules, notices, and academic resources. Features role-based access control for students, teachers, and HODs with Firebase backend integration.",
    tags: ["Flutter", "Firebase", "Education"],
    color: "#a855f7",
    github: "https://github.com/sushant-me/nec-campus-app",
  },
  {
    name: "Patho Uber & Live Delivery",
    tagline: "Logistics & Ride-Hailing Engines",
    desc: "Built scalable ride-hailing and real-time delivery tracking applications with dynamic pricing determination for cars and bikes. Features live GPS tracking, route optimization, and driver-passenger matching algorithms.",
    tags: ["Logistics", "Real-time", "GPS"],
    color: "#f59e0b",
    github: "https://github.com/sushant-me/patho_uber",
  },
  {
    name: "Mobile Inventory App",
    tagline: "Hardware-Software Integration",
    desc: "Engineered automated inventory management application with robust hardware-software integration for streamlined tracking. Features barcode scanning, automated Excel export, and real-time stock level monitoring for enterprise use.",
    tags: ["Flutter", "Inventory", "Excel"],
    color: "#3b82f6",
    github: "https://github.com/sushant-me/mobile_inventory_app",
  },
  {
    name: "Sentiment Analysis Engine",
    tagline: "NLP-Powered Opinion Mining",
    desc: "Advanced sentiment analysis system capable of processing Nepali and English text. Uses transformer-based models for accurate emotion detection, opinion classification, and trend analysis across social media and news sources.",
    tags: ["Python", "NLP", "Transformers"],
    color: "#ef4444",
    github: "https://github.com/sushant-me/sentiment-analysis",
  },
  {
    name: "Photo Sender App",
    tagline: "Cross-Platform Media Bridge",
    desc: "High-speed cross-platform photo and media transfer application. Enables seamless sharing between mobile and desktop devices using local network protocols without internet dependency.",
    tags: ["Flutter", "Networking", "Media"],
    color: "#22c55e",
    github: "https://github.com/sushant-me/photo_sender_app_to_mobile",
  },
  {
    name: "Pricing Determination System",
    tagline: "Dynamic Car & Bike Pricing",
    desc: "Machine learning-based pricing engine that determines fair market values for cars and bikes based on multiple features including age, mileage, brand, and market conditions. Uses regression models for accurate predictions.",
    tags: ["Python", "ML", "Regression"],
    color: "#a855f7",
    github: "https://github.com/sushant-me/Pricing_determination_car-bike-online",
  },
  {
    name: "Live Delivery Pickup",
    tagline: "Real-Time Order Tracking",
    desc: "Real-time delivery and pickup tracking system with live location updates, estimated time of arrival calculations, and automated notification systems for customers and delivery agents.",
    tags: ["Real-time", "Tracking", "Maps"],
    color: "#f59e0b",
    github: "https://github.com/sushant-me/live_delivery_pickup",
  },
  {
    name: "Cryptography Toolkit",
    tagline: "Encryption & Security Utilities",
    desc: "Comprehensive cryptography toolkit implementing AES, RSA, and custom encryption algorithms. Features password strength checker, brute-force attack simulator, and secure message encryption/decryption utilities.",
    tags: ["Python", "Cryptography", "Security"],
    color: "#06b6d4",
    github: "https://github.com/sushant-me/Cryptography",
  },
  {
    name: "Pokhara University App",
    tagline: "Syllabus & Academic Navigator",
    desc: "Centralized mobile database application for Pokhara University's engineering syllabus. Organizes complex curriculum data, course materials, and academic schedules in an intuitive mobile interface.",
    tags: ["Flutter", "Education", "Database"],
    color: "#ec4899",
    github: "https://github.com/sushant-me/Pokhara-University-computer-app",
  },
];

const GALLERY = [
  { src: "/images/MTK06847.JPG", caption: "1st Runner Up — Bagmati Province Tourism Hackathon 2026" },
  { src: "/images/MTK06805.JPG", caption: "Presenting research at Nepal Engineering College" },
  { src: "/images/MTK06918.JPG", caption: "Hackathon team and fellow medalists" },
  { src: "/images/MTK06861.JPG", caption: "Receiving the Hackathon Award on stage" },
  { src: "/images/MTK06849.JPG", caption: "Event participation and networking" },
  { src: "/images/hult prize 2024 1.jpg", caption: "Hult Prize 2024 — 1st Runner Up" },
  { src: "/images/Hult prize 2024.jpg", caption: "Hult Prize 2024 Ceremony" },
  { src: "/images/Hultprize 2025.jpg", caption: "Hult Prize 2025 — 1st Runner Up" },
  { src: "/images/nec itclub joint secetary.jpg", caption: "NEC IT Club — Joint Secretary" },
  { src: "/images/nec itclub joint secetary award.jpg", caption: "IT Club Recognition Award" },
  { src: "/images/bagmati province 2026 certificate.jpg", caption: "Bagmati Province Hackathon Certificate" },
  { src: "/images/picture with friend.jpg", caption: "Team collaboration moments" },
];

const CERTIFICATES = [
  { name: "IBM AI Engineering Professional Certificate", org: "IBM", file: "/images/IBM.pdf" },
  { name: "Deep Learning Specialization", org: "DeepLearning.AI & Stanford", file: "/images/Deep learning.pdf" },
  { name: "Machine Learning Specialization", org: "Stanford & DeepLearning.AI", file: "/images/machine learning.pdf" },
  { name: "Machine Learning with Python", org: "IBM", file: "/images/machine learning with python.pdf" },
  { name: "Google Cybersecurity Professional Certificate", org: "Google", file: "/images/ethical hacking.pdf" },
  { name: "Google UX Design Professional Certificate", org: "Google", file: "/images/UIUX.pdf" },
  { name: "Meta Full Stack Developer Certificate", org: "Meta", file: "/images/FULL stack.pdf" },
  { name: "Flutter & Dart — Complete App Development", org: "Packt", file: "/images/Flutter.pdf" },
  { name: "Backend Development", org: "Meta", file: "/images/backend.pdf" },
  { name: "Cloud Computing Professional Certificate", org: "IBM", file: "/images/cloud computing.pdf" },
  { name: "Cloud Foundations", org: "Great Learning", file: "/images/Cloud Foundations.pdf" },
  { name: "Python for Everybody", org: "University of Michigan", file: "/images/Python.pdf" },
  { name: "Linux Tutorial", org: "Great Learning", file: "/images/Linux Tutorial.pdf" },
  { name: "Data Analytics with Excel", org: "Great Learning", file: "/images/Data Analytics with Excel.pdf" },
  { name: "Data Science Foundations", org: "Great Learning", file: "/images/Data Science Foundations.pdf" },
  { name: "Content Marketing Basics", org: "Great Learning", file: "/images/Content Marketing Basics.pdf" },
  { name: "Artificial Intelligence Fundamentals", org: "Great Learning", file: "/images/Artificial Intelligence Fundamentals.pdf" },
  { name: "Quantum Computing", org: "Great Learning", file: "/images/Qutam Computer.pdf" },
  { name: "Mobile Development", org: "Meta", file: "/images/Mobile developement.pdf" },
];

const SKILL_GROUPS = [
  {
    category: "Artificial intelligence",
    color: "#3b82f6",
    skills: [
      { name: "PyTorch / TensorFlow", level: 95 },
      { name: "LLMs & RAG (LangChain)", level: 92 },
      { name: "Causal inference & Do-calculus", level: 88 },
      { name: "Deep learning (CNN / RNN / LSTM)", level: 94 },
      { name: "Generative AI & Transformers", level: 90 },
    ],
  },
  {
    category: "Cybersecurity",
    color: "#ef4444",
    skills: [
      { name: "Penetration testing (OWASP)", level: 93 },
      { name: "Network security (Wireshark, Nmap)", level: 90 },
      { name: "Cryptography (AES / RSA)", level: 87 },
      { name: "SIEM & Threat detection (Splunk)", level: 85 },
      { name: "LLM Agent Firewalls", level: 91 },
    ],
  },
  {
    category: "Full-stack development",
    color: "#22c55e",
    skills: [
      { name: "React / Next.js / Node.js", level: 96 },
      { name: "Flutter / Dart (Cross-platform)", level: 94 },
      { name: "Python (Django, Flask, FastAPI)", level: 95 },
      { name: "Firebase / SQLite / PostgreSQL", level: 91 },
      { name: "Redux / Context API / State Mgmt", level: 89 },
    ],
  },
  {
    category: "QA & automation",
    color: "#a855f7",
    skills: [
      { name: "Cypress / Selenium (E2E)", level: 89 },
      { name: "Jest / PyTest (Unit Testing)", level: 90 },
      { name: "CI/CD Pipelines (GitHub Actions)", level: 88 },
      { name: "Postman / API testing", level: 92 },
      { name: "TDD / BDD Methodologies", level: 86 },
    ],
  },
];

// ================================================================
//  HOOKS
// ================================================================

function useTyping(texts: string[], speed = 70, pause = 2000) {
  const [display, setDisplay] = useState("");
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
    const current = texts[index];
    let timer: NodeJS.Timeout;

    if (phase === "typing") {
      if (display.length < current.length) {
        timer = setTimeout(() => setDisplay(current.slice(0, display.length + 1)), speed);
      } else {
        timer = setTimeout(() => setPhase("pausing"), pause);
      }
    } else if (phase === "pausing") {
      timer = setTimeout(() => setPhase("deleting"), pause);
    } else if (phase === "deleting") {
      if (display.length > 0) {
        timer = setTimeout(() => setDisplay(display.slice(0, -1)), speed / 2);
      } else {
        setIndex((i) => (i + 1) % texts.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timer);
  }, [display, index, phase, texts, speed, pause]);

  return display;
}

function useCountUp(target: number, duration = 1500, start = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!start) {
      // Re-arm: leaving the viewport resets the counter so the next pass replays
      // the count-up instead of showing a frozen final number.
      setValue(0);
      return;
    }
    startRef.current = performance.now();

    const step = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, start]);

  return value;
}

// ================================================================
//  SUB-COMPONENTS
// ================================================================

function AnimatedCounter({ value, suffix, label, start }: { value: number; suffix: string; label: string; start: boolean }) {
  const count = useCountUp(value, 1800, start);
  const tilt = useTilt<HTMLDivElement>(6, 12);
  const formatted = value >= 1000 ? `${(count / 1000).toFixed(0)}K` : count.toString();

  return (
    <div className="stat-card tilt" {...tilt}>
      <div className="stat-value">{formatted}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function SkillBar({ name, level, color }: { name: string; level: number; color: string }) {
  return (
    <div className="skill-row">
      <div className="skill-header">
        <span className="skill-name">{name}</span>
        <span className="skill-percent">{level}%</span>
      </div>
      <div className="skill-track">
        {/* Width is scrubbed by the section's --p: the bars fill as you scroll
            through the grid rather than firing once and freezing. */}
        <div
          className="skill-fill"
          style={{ "--level": `${level}%`, background: color } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  variant = "grid",
}: {
  project: (typeof PROJECTS)[0];
  variant?: "grid" | "wall";
}) {
  const [open, setOpen] = useState(false);
  const tilt = useTilt<HTMLDivElement>(4, 8);
  // In the horizontal wall the detail is always visible: a row of collapsed
  // stubs sliding past reads as emptiness, not as a wall.
  const expanded = variant === "wall" || open;

  return (
    <div
      className={`project-card tilt ${variant === "wall" ? "project-card-wall" : ""}`}
      {...tilt}
      onClick={() => setOpen(!open)}
      style={{ borderColor: expanded ? project.color : undefined }}
    >
      <div className="project-header">
        <span className="project-name">{project.name}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <p className="project-tagline">{project.tagline}</p>
      <div className="project-detail" style={{ maxHeight: expanded ? "560px" : "0", opacity: expanded ? 1 : 0, overflow: "hidden", transition: "max-height 0.5s ease, opacity 0.3s ease" }}>
        <p className="project-desc">{project.desc}</p>
        <div className="tag-row">
          {project.tags.map((t) => (
            <span key={t} className="tag" style={{ color: project.color, background: `${project.color}18` }}>{t}</span>
          ))}
        </div>
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer" className="btn-link" style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            View on GitHub
          </a>
        )}
      </div>
    </div>
  );
}

function Lightbox({ src, caption, onClose }: { src: string; caption: string; onClose: () => void }) {
  return (
    <div className="lightbox" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={caption} />
        <p>{caption}</p>
        <button className="lightbox-close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

// ================================================================
//  CARD COMPONENTS
// ================================================================
// Each card owns its own pointer tilt. They are separate components (rather
// than inline JSX in a .map) purely so the hook can live somewhere legal.

function ExpCard({ exp }: { exp: (typeof EXPERIENCE)[number] }) {
  const tilt = useTilt<HTMLDivElement>(3, 6);
  return (
    <div className="exp-card tilt" {...tilt} style={{ "--accent": exp.color } as React.CSSProperties}>
      <div className="exp-accent" />
      <div className="exp-header">
        <div>
          <div className="exp-role">{exp.role}</div>
          <div className="exp-company">{exp.company} — {exp.location}</div>
        </div>
        <span className="exp-period">{exp.period}</span>
      </div>
      <p className="exp-desc">{exp.desc}</p>
      <div className="tag-row">
        {exp.tags.map((t) => (
          <span key={t} className="tag" style={{ color: exp.color, background: `${exp.color}18` }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function ResearchCard({ item }: { item: (typeof RESEARCH)[number] }) {
  const tilt = useTilt<HTMLDivElement>(3, 8);
  return (
    <div className="research-card tilt" {...tilt} style={{ "--accent": item.color } as React.CSSProperties}>
      <div className="research-venue">
        <span className="venue-badge" style={{
          color: item.venueType === "conference" ? "#ef4444" : "#6b7280",
          background: item.venueType === "conference" ? "rgba(239,68,68,0.12)" : "rgba(107,114,128,0.12)",
        }}>{item.venue}</span>
      </div>
      <div className="research-title">{item.title}</div>
      <p className="research-desc">{item.desc}</p>
      <div className="tag-row">
        {item.tags.map((t) => (
          <span key={t} className="tag" style={{ color: item.color, background: `${item.color}18` }}>{t}</span>
        ))}
      </div>
      {item.file && (
        <a href={item.file} target="_blank" rel="noopener noreferrer" className="btn-link" style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          Read Paper
        </a>
      )}
    </div>
  );
}

function HonorCard({ honor }: { honor: { title: string; desc: string } }) {
  const tilt = useTilt<HTMLDivElement>(2.5, 6);
  return (
    <div className="honor-card tilt" {...tilt}>
      <div className="honor-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>
        <span>{honor.title}</span>
      </div>
      <p>{honor.desc}</p>
    </div>
  );
}

function CertCard({ cert }: { cert: (typeof CERTIFICATES)[number] }) {
  const tilt = useTilt<HTMLDivElement>(2.5, 5);
  return (
    <div className="cert-card-large tilt" {...tilt}>
      <div className="cert-org">{cert.org}</div>
      <div className="cert-name">{cert.name}</div>
      <a href={cert.file} target="_blank" rel="noopener noreferrer" className="btn-link" style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        View Certificate
      </a>
    </div>
  );
}

function GalleryItem({ img, onOpen }: { img: (typeof GALLERY)[number]; onOpen: () => void }) {
  const tilt = useTilt<HTMLDivElement>(4, 10);
  return (
    <div className="gallery-item tilt" {...tilt} onClick={onOpen}>
      <img
        src={optimized(img.src)}
        data-full={img.src}
        alt={img.caption}
        loading="lazy"
        decoding="async"
      />
      <div className="gallery-caption">{img.caption}</div>
    </div>
  );
}

function AdvisoryCard({ advisory }: { advisory: (typeof ADVISORIES)[number] }) {
  const tilt = useTilt<HTMLDivElement>(3, 6);
  return (
    <div className="exp-card tilt" {...tilt} style={{ "--accent": advisory.color } as React.CSSProperties}>
      <div className="exp-accent" />
      <div className="exp-header">
        <div>
          <div className="exp-role">{advisory.id} — {advisory.title}</div>
          <div className="exp-company">{advisory.tool} · fixed in {advisory.fixed}</div>
        </div>
        <span className="exp-period">{advisory.severity}</span>
      </div>
      <p className="exp-desc">{advisory.desc}</p>
      <div className="tag-row">
        <a className="tag" href={advisory.url} target="_blank" rel="noopener noreferrer" style={{ color: advisory.color, background: `${advisory.color}18` }}>read the advisory</a>
        <span className="tag" style={{ color: advisory.color, background: `${advisory.color}18` }}>reproduction + regression test</span>
      </div>
    </div>
  );
}

// ================================================================
//  SECTION SHELL
// ================================================================

/**
 * One scrolling section: registers itself with the scroll provider (for the
 * rail and the anchor scrolling) and renders its own masthead. Previously these
 * were `display:none` panels swapped by tab state, which is why the page had no
 * scroll narrative; they are now real, stacked, addressable landmarks.
 */
function Section({
  id,
  kicker,
  children,
}: {
  id: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  const { registerSection } = useScroll();
  const index = SECTIONS.findIndex((s) => s.id === id) + 1;
  const meta =
    SECTIONS.find((s) => s.id === id) ?? { id, label: id, color: "#3b82f6" };
  const [inViewRef, inView] = useInView<HTMLElement>({
    threshold: 0.08,
    rootMargin: "0px 0px -18% 0px",
    repeat: false,
  });

  const register = useCallback(
    (el: HTMLElement | null) => {
      registerSection(id, el);
      inViewRef.current = el;
    },
    [id, registerSection, inViewRef]
  );

  return (
    <section
      id={id}
      className={`section ${inView ? "in-view" : ""}`}
      ref={register}
    >
      <SectionHeading
        index={index}
        label={meta.label}
        color={meta.color}
        kicker={kicker}
      />
      {children}
    </section>
  );
}

// ================================================================
//  MAIN PAGE
// ================================================================

export default function Portfolio() {
  return (
    <ScrollProvider>
      <PortfolioBody />
    </ScrollProvider>
  );
}

function PortfolioBody() {
  const { active: activeSection, scrollTo } = useScroll();
  const [loaded, setLoaded] = useState(false);
  const [lightbox, setLightbox] = useState<{src: string; caption: string} | null>(null);
  const [statsRef, statsInView] = useInView<HTMLDivElement>({ threshold: 0.25 });
  const heroRef = useScrollProgress<HTMLDivElement>("pinExit");
  const skillsRef = useScrollProgress<HTMLDivElement>("enter");
  const experienceRef = useScrollProgress<HTMLDivElement>("enter");
  const galleryRef = useScrollProgress<HTMLDivElement>("view");

  const roleText = useTyping(ROLES, 65, 1800);
  const ambientColor = SECTIONS.find((s) => s.id === activeSection)?.color || "#3b82f6";

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  const animateStats = statsInView;

  const scrollToSection = useCallback((id: string) => scrollTo(id), [scrollTo]);

  return (
    <>

      <div className="portfolio-root" style={{ "--accent": ambientColor } as React.CSSProperties}>
        <a className="skip-link" href="#about">
          Skip to content
        </a>

        {/* 3D backdrop — the WebGL scene, driven by the page's scroll */}
        <Scene3D accent={ambientColor} />

        {/* Pointer light, between the scene and the content */}
        <CursorGlow />

        {/* Velocity drama: speed lines + shockwave ring, only when moving fast */}
        <VelocityFx />

        {/* Depth on the section mastheads */}
        <SectionParallax />

        {/* Scroll chrome: reading-progress bar + section rail */}
        <ScrollHud sections={SECTIONS} />

        {/* Back-to-top and the motion switch */}
        <ScrollDock />

        {/* Ambient grid background */}
        <div className="ambient-bg" style={{ opacity: loaded ? 0.5 : 0 }}>
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating particles */}
        <div className="particles" style={{ opacity: loaded ? 0.4 : 0 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 6}s`,
            }} />
          ))}
        </div>

        {/* Glow orb */}
        <div className="glow-orb" style={{ background: ambientColor, opacity: loaded ? 0.1 : 0 }} />

        {/* Content */}
        <div className="content-wrapper">

          {/* HERO — pinned and scrubbed: the whole block drifts, shrinks and
              fades across the first viewport while the 3D core swells toward
              the camera. */}
          <div className="hero-pin" ref={heroRef}>
          <header className="hero">
            <HeroLandscape />
            <div className="hero-scrub">
            <div className="hero-badge" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(12px)" }}>
              <span className="pulse-dot" />
              Open to opportunities
            </div>

            {/* Profile Image */}
            <div className="hero-avatar" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "scale(1)" : "scale(0.8)" }}>
              <div
                className="avatar-ring"
                style={{ borderColor: ambientColor, cursor: "zoom-in" }}
                role="button"
                tabIndex={0}
                title="View full-size photo"
                onClick={() => setLightbox({ src: "/images/profile pciture.jpg", caption: "Sushant Poudel" })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLightbox({ src: "/images/profile pciture.jpg", caption: "Sushant Poudel" });
                  }
                }}
              >
                <img
                  src="/images/optimized/avatar-400.jpg"
                  data-full="/images/profile pciture.jpg"
                  alt="Sushant Poudel"
                />
              </div>
            </div>

            <h1 className="hero-name">
              {NAME_WORDS.map((word, i) => (
                <React.Fragment key={word}>
                  <span className="name-word">
                    <span
                      className="name-word-inner"
                      style={{ animationDelay: `${0.3 + i * 0.13}s` }}
                    >
                      {word}
                    </span>
                  </span>
                  {i < NAME_WORDS.length - 1 ? " " : null}
                </React.Fragment>
              ))}
            </h1>

            <div className="hero-role" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(12px)" }}>
              <span className="role-cursor">{roleText}</span>
              <span className="cursor-blink">|</span>
            </div>

            <p className="hero-summary" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(12px)" }}>
              Computer Engineering student at Nepal Engineering College. Bridging AI, cybersecurity, and full-stack systems 
              with published research, crisis-engineering prototypes, and 20+ professional certifications from Google, IBM, Meta, and Stanford.
            </p>

            <div className="hero-meta" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(12px)" }}>
              <a href="mailto:sushant.poudel2028@gmail.com" className="meta-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Email
              </a>
              <a href="https://linkedin.com/in/sushant-poudel2028" target="_blank" rel="noopener noreferrer" className="meta-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                LinkedIn
              </a>
              <a href="https://github.com/sushant-me" target="_blank" rel="noopener noreferrer" className="meta-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                GitHub
              </a>
            </div>

            <div className="hero-scroll-cue" style={{ opacity: loaded ? 1 : 0 }}>
              <span className="hero-scroll-text">Scroll to explore</span>
              <span className="hero-scroll-track">
                <span className="hero-scroll-thumb" style={{ background: ambientColor }} />
              </span>
            </div>
            </div>
          </header>
          </div>

          {/* NAVIGATION */}
          <nav className="section-nav">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`nav-pill ${activeSection === s.id ? "active" : ""}`}
                onClick={() => scrollToSection(s.id)}
                style={activeSection === s.id ? { borderColor: s.color, color: s.color, boxShadow: `0 0 20px ${s.color}22` } : undefined}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* SECTIONS */}
          <main className="sections">

            {/* ABOUT */}
            <Section id="about" kicker="Who I am, and the record behind every line on this page">
              <Reveal delay={0} rotateX={10} z={-40} y={30}>
                <div className="stats-grid stagger" ref={statsRef}>
                  {STATS.map((s) => (
                    <AnimatedCounter key={s.label} {...s} start={animateStats} />
                  ))}
                </div>
              </Reveal>

              <div className="summary-card">
                <div className="card-label">// Professional summary</div>
                <p className="summary-text">
                  AI security engineer working on the failure mode where an autonomous agent does something a human would have blocked.
                  A patch of mine is merged into google/go-github; five memory-safety issues I filed against google/s2geometry are open, including a 2.4 GiB allocation reachable from a 28-byte input, with standalone reproducers for each.
                  Two IEEE papers accepted — one on local policy verification for agents, one on predictive bandwidth scaling for WebRTC over LEO satellite links.
                  Ranked #1 on the HackingHub Q3 2026 global leaderboard (116 flags, 11,860 XP).
                  Two years as a full-time AI engineer at Atmos SoftTech, building production ML systems, full-stack products and offline-first agent pipelines.
                </p>
                <p className="summary-text" style={{ marginTop: 12 }}>
                  I would rather be checked than believed: every claim on this page is re-checked weekly against its public source by a script anyone can run —{" "}
                  <a href="https://github.com/sushant-me/reputation" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6" }}>
                    github.com/sushant-me/reputation
                  </a>.
                </p>
              </div>

              <div className="honors-grid stagger">
                {[
                  { title: "A maintainer independently reproduced a finding of mine before accepting it", desc: "Auditing six AI-action rules in sisaku-security/sisakulint surfaced defects in five. Instead of taking the premise on trust, maintainer on-keyday built both revisions of the rule and ran them over the same inputs, then wrote \"the gap is real and the direction you took to it is a reasonable one\" and filed three tracked issues from the audit. The pull request was closed for review capacity, not for being wrong. The quotation is machine-checked in my reputation repository — edit that comment and the claim goes red." },
                  { title: "Rank #1 — HackingHub Q3 2026 global leaderboard", desc: "116 flags and 11,860 XP, with 2 silver and 1 bronze award; the next-ranked account holds 97 flags. Public leaderboard API." },
                  { title: "Security patch authored, merged, then generalised into google/go-github", desc: "My PR #4556 stopped a release-asset upload being sent to an off-host URL. The maintainer merged it, then replaced it the next day with the broader PR #4564 — \"credentials are sent only to configured origins\" — which is what master implements today and which carries the commit \"Address feedback from sushant-me\". My name is in the project's AUTHORS file on master." },
                  { title: "Five memory-safety issues in google/s2geometry", desc: "A NULL dereference on the library's documented traversal path, an out-of-bounds read, a 16 GiB allocation from a 117-byte input, and a 2.4 GiB allocation reachable from a 28-byte input. Two hardening pull requests are under review by the maintainer. The maintainer's reply to these, quoted rather than paraphrased: \"It's not really a DoS since these are assumed to only operate on trusted data. We should document the assumptions better.\" — a disagreement about severity and threat model, not about whether the reads are out of bounds." },
                  { title: "An OSS-Fuzz harness that was testing nothing", desc: "google/libphonenumber's as-you-type formatter asserted 0.00% line coverage of the code it targeted because it never generated valid input; the corrected harness reaches 93%." },
                  { title: "Two-time Hult Prize 1st Runner-Up", desc: "Recognized consecutive years (2024 & 2025) for social entrepreneurship and business models addressing global challenges." },
                  { title: "Aspire Leaders Program — Global Finalist (2025)", desc: "Selected as one of roughly 10,000 finalists from 54,000+ applicants worldwide, completing leadership training co-created by Harvard Business School faculty." },
                  { title: "NEC IT Club — Joint Secretary (2024–2025)", desc: "Logistics, executive administration and student engagement for department-level technical events and hackathons at Nepal Engineering College." },
                  { title: "Direct-to-device LEO satellite communication — Space Con 2026", desc: "Poster on 5G non-terrestrial-network connectivity from ordinary smartphones to LEO satellites, sized for Nepal's terrain." },
                ].map((h) => (
                  <HonorCard key={h.title} honor={h} />
                ))}
              </div>
            </Section>

            {/* EXPERIENCE */}
            <Section id="experience" kicker="Two years full-time, and the roles around it">
              <div className="experience-list timeline stagger" ref={experienceRef}>
                {EXPERIENCE.map((exp, i) => (
                  <ExpCard key={i} exp={exp} />
                ))}
              </div>
            </Section>

            {/* RESEARCH */}
            <Section id="research" kicker="Peer-reviewed work, accepted and in review">
              <div className="research-grid stagger">
                {RESEARCH.map((r, i) => (
                  <ResearchCard key={i} item={r} />
                ))}
              </div>
            </Section>

            {/* PROJECTS */}
            <Section id="projects" kicker="Shipped tools, upstream patches, and published advisories">
              <HorizontalScroller label="Keep scrolling — the wall moves sideways">
                {PROJECTS.map((p, i) => (
                  <div
                    className="wall-item"
                    key={p.name}
                    style={
                      {
                        "--i": i / Math.max(PROJECTS.length - 1, 1),
                      } as React.CSSProperties
                    }
                  >
                    <ProjectCard project={p} variant="wall" />
                  </div>
                ))}
              </HorizontalScroller>
              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <a href="https://github.com/sushant-me" target="_blank" rel="noopener noreferrer" className="btn-link" style={{ padding: "10px 20px", fontSize: "14px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "8px", verticalAlign: "middle" }}>
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  </svg>
                  View All 15+ Repositories on GitHub
                </a>
              </div>
              <div className="card-label" style={{ marginTop: "40px" }}>// Published security advisories — CVE IDs requested</div>
              <div className="experience-list stagger">
                {ADVISORIES.map((a) => (
                  <AdvisoryCard key={a.id} advisory={a} />
                ))}
              </div>
            </Section>

            {/* ACHIEVEMENTS / GALLERY */}
            <Section id="achievements" kicker="Awards, honours, and the moments behind them">
              <div className="gallery-grid stagger" ref={galleryRef}>
                {GALLERY.map((img, idx) => (
                  <GalleryItem key={idx} img={img} onOpen={() => setLightbox(img)} />
                ))}
              </div>
            </Section>

            {/* CERTIFICATES */}
            <Section id="certificates" kicker="Every certificate below opens its own PDF">
              <div className="certs-section">
                <div className="card-label">// Professional certifications (19+)</div>
                <div className="certs-grid-large stagger">
                  {CERTIFICATES.map((c, i) => (
                    <CertCard key={i} cert={c} />
                  ))}
                </div>
              </div>
            </Section>

            {/* SKILLS */}
            <Section id="skills" kicker="What I actually work with, day to day">
              <div className="skills-grid stagger" ref={skillsRef}>
                {SKILL_GROUPS.map((g) => (
                  <div key={g.category} className="skill-group">
                    <div className="skill-category">// {g.category}</div>
                    <div className="skill-list">
                      {g.skills.map((s) => (
                        <SkillBar key={s.name} {...s} color={g.color} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="certs-section" style={{ marginTop: "32px" }}>
                <div className="skill-category">// Certification providers</div>
                <div className="provider-grid stagger">
                  {["Google", "IBM", "Meta", "Stanford", "DeepLearning.AI", "Packt", "Great Learning Academy"].map((p) => (
                    <div key={p} className="provider-badge">{p}</div>
                  ))}
                </div>
              </div>
            </Section>
          </main>

          {/* FOOTER */}
          <footer className="portfolio-footer">
            <p>Built with <span style={{ color: ambientColor }}>Next.js</span> &mdash; Sushant Poudel &mdash; Bhaktapur, Nepal &mdash; 2026</p>
            <div className="footer-links">
              <a href="https://github.com/sushant-me" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://linkedin.com/in/sushant-poudel2028" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="mailto:sushant.poudel2028@gmail.com">Email</a>
            </div>
          </footer>
        </div>

        {/* Lightbox */}
        {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}
      </div>

      {/* ─── STYLES ─────────────────────────────────────────────── */}
      <style jsx global>{`
        :root {
          --bg: #0a0a0f;
          --surface: #111118;
          --surface-raised: #16161f;
          --surface-strong: #1e1e2a;
          --border: #27273a;
          --text-primary: #f0f0f5;
          --text-secondary: #a0a0b0;
          --text-tertiary: #6b6b80;
          --accent: #3b82f6;
          --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --font-mono: "JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace;
          --t-fast: 150ms;
        }

        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: var(--bg);
          color: var(--text-primary);
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
        }

        .portfolio-root {
          position: relative;
          min-height: 100vh;
          /* See globals.css: clip clips overflow without creating a scroll
             container, which is what keeps sticky positioning alive inside. */
          overflow-x: hidden;
          overflow-x: clip;
          background: var(--bg);
        }

        /* Ambient */
        .ambient-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          color: var(--border);
          transition: opacity 1.2s ease;
          z-index: 0;
        }

        .glow-orb {
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(160px);
          pointer-events: none;
          transform: translate(-50%, -50%);
          top: 25%;
          left: 25%;
          transition: background 1.5s ease, opacity 1.5s ease;
          z-index: 0;
          animation: orbFloat 14s ease-in-out infinite;
        }

        @keyframes orbFloat {
          0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
          25% { transform: translate(-50%, -50%) translate(100px, -50px); }
          50% { transform: translate(-50%, -50%) translate(-40px, 80px); }
          75% { transform: translate(-50%, -50%) translate(60px, 40px); }
        }

        /* Particles */
        .particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          transition: opacity 2s ease;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: var(--text-tertiary);
          border-radius: 50%;
          opacity: 0.3;
          animation: particleFloat linear infinite;
        }

        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }

        .content-wrapper {
          position: relative;
          z-index: 2;
          max-width: 1040px;
          margin: 0 auto;
          padding: 40px 20px 80px;
        }

        /* ── HERO ── */
        .hero {
          text-align: center;
          margin-bottom: 36px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          border: 1px solid var(--border);
          font-size: 12px;
          color: var(--text-tertiary);
          font-family: var(--font-mono);
          margin-bottom: 20px;
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          display: inline-block;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        .hero-avatar {
          margin-bottom: 20px;
          transition: opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s;
        }

        .avatar-ring {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          padding: 3px;
          margin: 0 auto;
          border: 2px solid;
          transition: border-color 1s ease;
          position: relative;
        }

        .avatar-ring::before {
          content: "";
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid transparent;
          border-top-color: var(--accent);
          border-right-color: var(--accent);
          animation: avatarSpin 8s linear infinite;
        }

        @keyframes avatarSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .avatar-ring img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .hero-name {
          font-size: clamp(38px, 6vw, 58px);
          font-weight: 500;
          line-height: 1.05;
          margin: 0 0 10px;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .hero-role {
          font-size: 16px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          min-height: 28px;
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .role-cursor { color: var(--accent); }

        .cursor-blink {
          animation: blink 1s step-end infinite;
          color: var(--accent);
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .hero-summary {
          max-width: 640px;
          margin: 16px auto 0;
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-tertiary);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .hero-meta {
          margin-top: 20px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .meta-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 13px;
          transition: all var(--t-fast) ease;
          background: transparent;
        }

        .meta-link:hover {
          border-color: var(--text-primary);
          color: var(--text-primary);
          background: var(--surface-raised);
          transform: translateY(-1px);
        }

        /* ── NAV ── */
        .section-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 32px;
          flex-wrap: wrap;
          position: sticky;
          top: 12px;
          z-index: 30;
          padding: 10px;
          border-radius: 16px;
          background: rgba(10, 10, 15, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border);
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
        }

        .nav-pill {
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          font-family: var(--font-sans);
          font-weight: 500;
          transition: all var(--t-fast) ease;
        }

        .nav-pill:hover {
          border-color: var(--text-tertiary);
          color: var(--text-primary);
        }

        .nav-pill.active {
          font-weight: 500;
        }

        /* ── SECTIONS ──
           Real scroll landmarks now: stacked, spaced and addressable. The
           sticky nav can cover a heading, so scroll-margin-top reserves room
           when an anchor lands on one. */
        .sections { position: relative; }
        .section {
          position: relative;
          padding: 76px 0 44px;
          scroll-margin-top: 104px;
        }
        .section + .section {
          border-top: 1px solid rgba(255, 255, 255, 0.045);
        }
        .section:first-of-type { padding-top: 40px; }
        .section:last-of-type { padding-bottom: 56px; }

        /* ── STATS ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .stat-card {
          padding: 18px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          transition: all var(--t-fast) ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          border-color: var(--accent);
          box-shadow: 0 4px 24px rgba(59, 130, 246, 0.08);
        }

        .stat-value {
          font-size: 28px;
          font-weight: 500;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          line-height: 1.1;
        }

        .stat-label {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 6px;
          line-height: 1.4;
        }

        /* ── CARDS ── */
        .summary-card {
          padding: 22px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          margin-bottom: 16px;
        }

        .card-label {
          font-size: 12px;
          font-family: var(--font-mono);
          color: var(--text-tertiary);
          margin-bottom: 12px;
        }

        .summary-text {
          margin: 0;
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-secondary);
        }

        .honors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }

        .honor-card {
          padding: 18px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          transition: all var(--t-fast) ease;
        }

        .honor-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }

        .honor-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .honor-card p {
          margin: 0;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* ── EXPERIENCE ── */
        .experience-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .exp-card {
          padding: 22px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          position: relative;
          overflow: hidden;
          transition: all var(--t-fast) ease;
        }

        .exp-card:hover {
          transform: translateX(4px);
          border-color: var(--accent);
        }

        .exp-accent {
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: var(--accent);
          opacity: 0.6;
        }

        .exp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }

        .exp-role {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .exp-company {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .exp-period {
          font-size: 12px;
          color: var(--text-tertiary);
          font-family: var(--font-mono);
          white-space: nowrap;
        }

        .exp-desc {
          margin: 0;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        /* ── RESEARCH ── */
        .research-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 12px;
        }

        .research-card {
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          transition: all var(--t-fast) ease;
        }

        .research-card:hover {
          transform: translateY(-3px) scale(1.01);
          border-color: var(--accent);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .research-venue { margin-bottom: 10px; }

        .venue-badge {
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-family: var(--font-mono);
        }

        .research-title {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .research-desc {
          margin: 0;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 12px;
        }

        /* ── PROJECTS ── */
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }

        .project-card {
          padding: 18px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          cursor: pointer;
          transition: all var(--t-fast) ease;
        }

        .project-card:hover {
          border-color: var(--accent);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .project-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .project-tagline {
          margin: 0 0 8px;
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .project-desc {
          margin: 0 0 10px;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .btn-link {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-raised);
          color: var(--text-primary);
          font-size: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .btn-link:hover {
          border-color: var(--text-primary);
          background: var(--surface-strong);
        }

        /* ── GALLERY ── */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }

        .gallery-item {
          border-radius: 12px;
          overflow: hidden;
          background: var(--surface);
          border: 1px solid var(--border);
          transition: all var(--t-fast) ease;
          cursor: pointer;
        }

        .gallery-item:hover {
          transform: scale(1.02);
          border-color: var(--accent);
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }

        .gallery-item img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .gallery-item:hover img {
          transform: scale(1.05);
        }

        .gallery-caption {
          padding: 12px;
          font-size: 12px;
          color: var(--text-secondary);
          text-align: center;
          font-weight: 500;
        }

        /* Lightbox */
        .lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .lightbox-content {
          max-width: 900px;
          width: 100%;
          text-align: center;
          position: relative;
        }

        .lightbox-content img {
          max-width: 100%;
          max-height: 80vh;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .lightbox-content p {
          margin-top: 12px;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .lightbox-close {
          position: absolute;
          top: -40px;
          right: 0;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 24px;
          cursor: pointer;
          padding: 8px;
        }

        /* ── CERTIFICATES ── */
        .certs-grid-large {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }

        .cert-card-large {
          padding: 18px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          transition: all var(--t-fast) ease;
        }

        .cert-card-large:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }

        .cert-org {
          font-size: 11px;
          color: var(--text-tertiary);
          font-family: var(--font-mono);
          margin-bottom: 4px;
        }

        .cert-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 8px;
          line-height: 1.4;
        }

        /* ── SKILLS ── */
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .skill-group {
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
        }

        .skill-category {
          font-size: 12px;
          font-family: var(--font-mono);
          color: var(--text-tertiary);
          margin-bottom: 14px;
          text-transform: lowercase;
        }

        .skill-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skill-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .skill-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .skill-name { color: var(--text-secondary); }

        .skill-percent {
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }

        .skill-track {
          height: 4px;
          border-radius: 2px;
          background: var(--surface-strong);
          overflow: hidden;
        }

        .skill-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .provider-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .provider-badge {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface-raised);
          color: var(--text-secondary);
          font-size: 12px;
          transition: all var(--t-fast) ease;
        }

        .provider-badge:hover {
          border-color: var(--accent);
          color: var(--text-primary);
          transform: translateY(-1px);
        }

        /* ── TAGS ── */
        .tag-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .tag {
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
        }

        /* ── FOOTER ── */
        .portfolio-footer {
          margin-top: 60px;
          text-align: center;
          padding-top: 32px;
          border-top: 1px solid var(--border);
        }

        .portfolio-footer p {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: 0 0 12px;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .footer-links a {
          color: var(--text-tertiary);
          text-decoration: none;
          font-size: 12px;
          transition: color var(--t-fast) ease;
        }

        .footer-links a:hover {
          color: var(--text-primary);
        }

        /* ══════════════════════════════════════════════════════════════
           3D SCROLL LAYER
           ══════════════════════════════════════════════════════════════ */

        /* The WebGL backdrop. Fixed, behind the grid and the content. */
        .scene-canvas {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        /* ── reading progress ── */
        .scroll-progress {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          z-index: 60;
          pointer-events: none;
          background: rgba(255, 255, 255, 0.05);
        }

        .scroll-progress-bar {
          position: absolute;
          inset: 0;
          transform-origin: 0 50%;
          transform: scaleX(0);
        }

        .scroll-progress-glow {
          position: absolute;
          inset: 0;
          transform-origin: 0 50%;
          transform: scaleX(0);
          filter: blur(10px);
          opacity: 0.3;
          transition: opacity 0.25s ease;
        }

        /* ── section rail ── */
        .section-rail {
          position: fixed;
          right: 18px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 55;
          display: flex;
          flex-direction: column;
          gap: 7px;
          align-items: flex-end;
        }

        .rail-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: 0;
          padding: 3px 0;
          cursor: pointer;
          color: var(--text-tertiary);
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.45;
          transition: opacity 0.3s ease, color 0.3s ease, transform 0.3s ease;
        }

        .rail-item:hover { opacity: 1; transform: translateX(-3px); }
        .rail-item.active { opacity: 1; }
        .rail-index { font-size: 9px; opacity: 0.65; }
        .rail-label { white-space: nowrap; }

        .rail-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.22);
          transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }

        .rail-item.active .rail-dot { transform: scale(1.6); }

        /* ── section masthead ── */
        .section-head {
          display: flex;
          align-items: baseline;
          gap: 14px;
          margin-bottom: 26px;
          flex-wrap: wrap;
        }

        .section-head-index {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.12em;
        }

        .section-head-body { display: flex; flex-direction: column; }

        .section-head-title {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--text-primary);
        }

        .section-head-kicker {
          margin: 3px 0 0;
          font-size: 12.5px;
          color: var(--text-tertiary);
        }

        .section-head-rule {
          flex: 1;
          min-width: 60px;
          height: 1px;
          opacity: 0.5;
        }

        /* ── hero scroll cue ── */
        .hero-scroll-cue {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-top: 36px;
          transition: opacity 1s ease 0.5s;
        }

        .hero-scroll-text {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--text-tertiary);
        }

        .hero-scroll-track {
          position: relative;
          width: 1px;
          height: 46px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent);
          overflow: hidden;
        }

        .hero-scroll-thumb {
          position: absolute;
          left: -1.5px;
          width: 4px;
          height: 12px;
          border-radius: 4px;
          animation: cueDrop 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }

        @keyframes cueDrop {
          0% { top: -14px; opacity: 0; }
          30% { opacity: 1; }
          100% { top: 46px; opacity: 0; }
        }

        /* ── 3D tilt cards ──
           The element itself tilts — no wrapper — so grid and flex parents keep
           their structure. Values come from useTilt as custom properties. */
        .tilt {
          position: relative;
          transform-style: preserve-3d;
          transform: perspective(1000px) rotateX(var(--rx, 0deg))
            rotateY(var(--ry, 0deg)) translateZ(var(--tz, 0px));
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.35s ease, box-shadow 0.35s ease;
        }

        /* will-change is only claimed while a card is actually tilting: on ~70
           cards at once it costs a compositor layer each for no benefit. */
        .tilt.is-tilting {
          will-change: transform;
          transition: transform 0.09s linear, border-color 0.35s ease,
            box-shadow 0.35s ease;
        }

        .tilt::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            420px circle at var(--mx, 50%) var(--my, 50%),
            rgba(255, 255, 255, 0.09),
            transparent 62%
          );
          opacity: var(--glare, 0);
          transition: opacity 0.35s ease;
          pointer-events: none;
        }

        /* ── staged 3D entry for grid children ──
           The .stagger class is on each grid; the animation only runs once its
           section reports in-view, so nothing animates off-screen. The
           "backwards" fill (not "forwards") matters: the final keyframe equals
           the natural state, so once it finishes the element drops back to its
           own styles and the tilt transform takes over again. */
        @keyframes deal3d {
          from {
            opacity: 0;
            transform: perspective(900px) translateY(30px) translateZ(-70px)
              rotateX(14deg);
          }
          to {
            opacity: 1;
            transform: perspective(900px) translateY(0) translateZ(0) rotateX(0deg);
          }
        }

        .section.in-view .stagger > * {
          animation: deal3d 0.8s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }

        .section.in-view .stagger > *:nth-child(1) { animation-delay: 0s; }
        .section.in-view .stagger > *:nth-child(2) { animation-delay: 0.05s; }
        .section.in-view .stagger > *:nth-child(3) { animation-delay: 0.1s; }
        .section.in-view .stagger > *:nth-child(4) { animation-delay: 0.15s; }
        .section.in-view .stagger > *:nth-child(5) { animation-delay: 0.2s; }
        .section.in-view .stagger > *:nth-child(6) { animation-delay: 0.25s; }
        .section.in-view .stagger > *:nth-child(7) { animation-delay: 0.3s; }
        .section.in-view .stagger > *:nth-child(8) { animation-delay: 0.34s; }
        .section.in-view .stagger > *:nth-child(9) { animation-delay: 0.38s; }
        .section.in-view .stagger > *:nth-child(10) { animation-delay: 0.42s; }
        .section.in-view .stagger > *:nth-child(n + 11) { animation-delay: 0.46s; }

        /* ── pointer light ── */
        .cursor-glow {
          position: fixed;
          top: 0;
          left: 0;
          width: 560px;
          height: 560px;
          margin: -280px 0 0 -280px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
          opacity: 0;
          background: radial-gradient(circle, var(--accent, #3b82f6), transparent 62%);
          filter: blur(38px);
          mix-blend-mode: screen;
          transition: opacity 0.8s ease;
        }

        /* ── hero polish ──
           The background shorthand resets background-clip to border-box, so the
           text clipping has to be re-declared here or the name renders as a
           solid filled bar. */
        .hero-name {
          background: linear-gradient(
            120deg,
            #ffffff 0%,
            #c9d4e6 28%,
            #ffffff 50%,
            #b6c2d8 72%,
            #ffffff 100%
          );
          background-size: 220% 220%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: nameShimmer 11s ease-in-out infinite;
        }

        @keyframes nameShimmer {
          0%,
          100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .hero-avatar { position: relative; }
        /* The aura and halo are sized from this box with inset percentages, so
           it has to be the avatar's own size. As a full-width block it made them
           1400px wide and the conic aura read as a beam across the page. */
        .hero-avatar {
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-avatar::after {
          content: "";
          position: absolute;
          inset: -14%;
          border-radius: 50%;
          background: radial-gradient(circle, var(--accent, #3b82f6), transparent 68%);
          filter: blur(26px);
          z-index: -1;
          animation: haloPulse 7s ease-in-out infinite;
        }

        @keyframes haloPulse {
          0%,
          100% { transform: scale(0.96); opacity: 0.18; }
          50% { transform: scale(1.06); opacity: 0.3; }
        }

        .nav-pill:hover { transform: translateY(-1px); }

        /* ══════════════════════════════════════════════════════════════
           SCRUBBED SCROLL SEQUENCES
           Everything below is driven by a single unitless --p custom
           property that useScrollProgress writes each frame. No React
           renders, no layout reads inside CSS — just compositor work.
           ══════════════════════════════════════════════════════════════ */

        /* ── 1. pinned hero ──
           The header sticks for one viewport while --p runs 0 → 1; the block
           drifts up, shrinks, blurs and fades out so the page below is what
           arrives as the pin releases. */
        .hero-pin { position: relative; height: 160vh; }

        .hero-pin .hero {
          position: sticky;
          top: 0;
          min-height: 100vh;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-bottom: 0;
        }

        /* Fades to zero at the same moment the pin releases (p = 1), so there is
           no stretch of empty viewport between the hero and the first section. */
        .hero-scrub {
          position: relative;
          z-index: 2;
          transform: translate3d(0, calc(var(--p, 0) * -140px), 0)
            scale(calc(1 - var(--p, 0) * 0.2));
          opacity: calc(1 - var(--p, 0) * 1.02);
          will-change: transform, opacity;
        }

        /* ── 2. horizontal project wall ──
           Wrapper height is set by the component to viewport + overflow, so one
           pixel of scroll equals one pixel of sideways travel. */
        .hscroll { position: relative; }

        .hscroll-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          height: 100svh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
          padding-top: 84px;
        }

        .hscroll-track {
          display: flex;
          gap: 26px;
          align-items: flex-start;
          padding: 0 24px;
          will-change: transform;
        }

        .hscroll-track .project-card {
          flex: 0 0 340px;
          width: 340px;
        }

        /* Wall cards are always expanded, so give them a floor height and let
           the row read as a strip of panels rather than a row of stubs. */
        .hscroll-track .project-card-wall {
          min-height: 292px;
        }

        .hscroll-track .project-card-wall .project-detail {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 14px;
        }

        .hscroll-hint {
          position: absolute;
          top: 96px;
          left: 24px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          opacity: calc(1 - var(--p, 0) * 1.6);
        }

        .hscroll-bar {
          position: absolute;
          left: 24px;
          right: 24px;
          bottom: 46px;
          height: 2px;
          background: rgba(255, 255, 255, 0.07);
          border-radius: 2px;
          overflow: hidden;
        }

        .hscroll-bar-fill {
          display: block;
          height: 100%;
          width: 100%;
          transform-origin: 0 50%;
          transform: scaleX(var(--p, 0));
          background: var(--accent, #3b82f6);
        }

        /* ── 3. scrubbed skill bars ──
           Each bar's own --level is multiplied by the section's --p, so the
           bars fill as the grid rises rather than firing once. scaleX keeps it
           on the compositor — animating width would relayout the row. */
        .skill-fill {
          width: var(--level, 0%);
          transform-origin: 0 50%;
          transform: scaleX(min(var(--p, 0) * 1.35, 1));
          transition: transform 0.16s linear;
        }

        /* ── 4. experience timeline ──
           The rail under the cards fills with the section's own progress. scaleY
           rather than height, so the fill never triggers layout. Scoped to
           .timeline: the advisories list shares .experience-list but has no
           progress of its own and should not grow a rail. */
        .timeline {
          position: relative;
          padding-left: 22px;
        }

        .timeline::before,
        .timeline::after {
          content: "";
          position: absolute;
          left: 3px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          border-radius: 2px;
        }

        .timeline::before {
          background: rgba(255, 255, 255, 0.06);
        }

        .timeline::after {
          transform-origin: 50% 0;
          transform: scaleY(var(--p, 0));
          background: linear-gradient(
            180deg,
            var(--accent, #3b82f6),
            transparent
          );
        }

        /* ── 5. gallery parallax ──
           Depth varies per column so the grid breathes as it passes. The images
           are scaled slightly past their frames so no edge shows. */
        .gallery-grid > *:nth-child(3n + 1) { --depth: 1; }
        .gallery-grid > *:nth-child(3n + 2) { --depth: -0.75; }
        .gallery-grid > *:nth-child(3n) { --depth: 0.5; }

        .gallery-grid > * img {
          transform: translate3d(
              0,
              calc((var(--p, 0.5) - 0.5) * var(--depth, 1) * -52px),
              0
            )
            scale(1.14);
          will-change: transform;
        }

        /* ── 6. masked heading reveal ── */
        @keyframes headMask {
          from {
            clip-path: inset(0 0 100% 0);
            transform: translate3d(0, 18px, 0);
            opacity: 0;
          }
          to {
            clip-path: inset(0 0 0 0);
            transform: none;
            opacity: 1;
          }
        }

        .section.in-view .section-head-title {
          animation: headMask 0.95s cubic-bezier(0.22, 1, 0.36, 1) backwards;
          animation-delay: 0.08s;
        }

        /* ── 7. scroll-reactive ambient orb ──
           Driven by the translate property from ScrollHud; see the note there
           on why it cannot be a transform. */

        @media (max-width: 900px) {
          .hero-pin { height: 150vh; }

          .hscroll { height: auto !important; }

          .hscroll-sticky {
            position: static;
            height: auto;
            overflow: visible;
            padding-top: 0;
          }

          .hscroll-track {
            transform: none !important;
            flex-wrap: wrap;
            padding: 0;
            gap: 12px;
          }

          .hscroll-track .wall-item {
            flex: 1 1 100%;
            width: auto;
            transform: none;
          }

          .hscroll-bar,
          .hscroll-hint { display: none; }

          .experience-list { padding-left: 0; }
          .timeline { padding-left: 16px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-pin { height: auto; }
          .hero-pin .hero { position: static; min-height: 0; }
          .hero-scrub { transform: none; opacity: 1; filter: none; }
          .hscroll { height: auto !important; }
          .hscroll-sticky { position: static; height: auto; overflow: visible; }
          .hscroll-track { transform: none !important; flex-wrap: wrap; }
          .hscroll-track .wall-item { flex: 1 1 320px; width: auto; transform: none; }
          .hscroll-bar, .hscroll-hint { display: none; }
          .gallery-grid > * img { transform: none; }
          .section.in-view .section-head-title { animation: none; }
          .experience-list::after { height: 100%; }
        }

        /* ══════════════════════════════════════════════════════════════
           KINETIC LAYER
           ══════════════════════════════════════════════════════════════ */

        /* ── hero name impact entrance ──
           Words, not letters: the rendered text stays one readable string while
           each word slams in from below with blur and a scale overshoot. */
        .name-word { display: inline-block; }

        .name-word-inner {
          display: inline-block;
          animation: wordSlam 1.15s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }

        @keyframes wordSlam {
          0% {
            transform: translate3d(0, 66px, 0) scale(1.28) rotate(3.5deg);
            opacity: 0;
            filter: blur(13px);
          }
          60% {
            transform: translate3d(0, -9px, 0) scale(0.982) rotate(-1.2deg);
            opacity: 1;
            filter: blur(0);
          }
          100% { transform: none; opacity: 1; filter: blur(0); }
        }

        /* ── avatar energy aura ──
           A masked arc rather than a blurred conic: the blur had to be
           re-rastered on every frame of an infinite rotation, which cost frames
           across the whole page. A mask is rastered once and the rotation then
           stays on the compositor. */
        .hero-avatar::before {
          content: "";
          position: absolute;
          inset: -18%;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            rgba(255, 255, 255, 0) 0deg 168deg,
            var(--accent, #3b82f6) 250deg,
            #ffffff 292deg,
            rgba(255, 255, 255, 0) 336deg 360deg
          );
          -webkit-mask: radial-gradient(
            closest-side,
            transparent 62%,
            #000 80%,
            transparent 100%
          );
          mask: radial-gradient(
            closest-side,
            transparent 62%,
            #000 80%,
            transparent 100%
          );
          opacity: 0.75;
          z-index: -2;
          animation: auraSpin 7.5s linear infinite;
        }

        @keyframes auraSpin {
          to { transform: rotate(360deg); }
        }

        /* ── speed lines, driven by scroll velocity ──
           No mix-blend-mode: blending a full-viewport fixed layer forces the
           backdrop into its own buffer every frame. Plain low-opacity lines read
           the same at these opacities. */
        .speed-streaks {
          position: fixed;
          left: 0;
          right: 0;
          top: -12%;
          height: 124%;
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          background-image: repeating-linear-gradient(
            180deg,
            rgba(255, 255, 255, 0) 0px,
            rgba(255, 255, 255, 0) 10px,
            rgba(190, 216, 255, 0.42) 10px,
            rgba(255, 255, 255, 0) 11.5px
          );
          will-change: transform, opacity;
        }

        /* ── shockwave ring, driven by scroll velocity ──
           Border only: an inset box-shadow this size has to be re-rastered when
           the ring scales, which is every frame while the visitor is moving. */
        .impact-ring {
          position: fixed;
          left: 50%;
          top: 40%;
          width: 460px;
          height: 460px;
          border-radius: 50%;
          border: 1.5px solid rgba(150, 190, 255, 0.5);
          transform: translate(-50%, -50%);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          z-index: 1;
        }

        /* ── curved wall ──
           Each card turns away from the centre of the viewport as the track
           moves, so the wall reads as a curved surface rather than a flat strip. */
        .hscroll-track .wall-item {
          flex: 0 0 340px;
          width: 340px;
          transform: perspective(1100px)
            rotateY(calc((var(--p, 0) - var(--i, 0)) * 24deg))
            translateZ(calc((var(--p, 0) - var(--i, 0)) * -130px));
          transform-origin: 50% 50%;
        }

        .hscroll-track .wall-item .project-card {
          width: 100%;
          min-height: 292px;
        }

        /* ── bottom-right dock ── */
        .scroll-dock {
          position: fixed;
          right: 18px;
          bottom: 20px;
          z-index: 58;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .dock-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 13px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(12, 12, 18, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          color: var(--text-tertiary);
          font-family: var(--font-mono);
          font-size: 10.5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 0.25s ease, border-color 0.25s ease,
            transform 0.25s ease, opacity 0.3s ease;
        }

        .dock-btn:hover {
          color: var(--text-primary);
          border-color: var(--accent, #3b82f6);
          transform: translateY(-2px);
        }

        .dock-top {
          opacity: 0;
          pointer-events: none;
          transform: translateY(10px) scale(0.96);
        }

        .dock-top.is-visible {
          opacity: 1;
          pointer-events: auto;
          transform: none;
        }

        /* ── keyboard focus, site-wide ── */
        a:focus-visible,
        button:focus-visible,
        [role="button"]:focus-visible {
          outline: 2px solid var(--accent, #3b82f6);
          outline-offset: 3px;
          border-radius: 6px;
        }

        .skip-link {
          position: fixed;
          left: 12px;
          top: -70px;
          z-index: 90;
          padding: 10px 16px;
          border-radius: 10px;
          background: #14141c;
          border: 1px solid var(--accent, #3b82f6);
          color: var(--text-primary);
          font-size: 13px;
          text-decoration: none;
          transition: top 0.2s ease;
        }

        .skip-link:focus { top: 12px; }

        /* ── motion off: the dock switch, or the OS preference ──
           Everything decorative stops and every scrubbed value resolves to its
           final state, so nothing is left half-revealed or invisible. */
        html[data-motion="off"] .name-word-inner,
        html[data-motion="off"] .hero-scroll-thumb,
        html[data-motion="off"] .hero-avatar::before,
        html[data-motion="off"] .hero-avatar::after,
        html[data-motion="off"] .particle,
        html[data-motion="off"] .river-flow,
        html[data-motion="off"] .bird,
        html[data-motion="off"] .bird-wings,
        html[data-motion="off"] .glow-orb {
          animation: none;
        }

        html[data-motion="off"] .speed-streaks,
        html[data-motion="off"] .impact-ring,
        html[data-motion="off"] .cursor-glow,
        html[data-motion="off"] .scroll-progress-glow,
        html[data-motion="off"] .particles {
          display: none;
        }

        html[data-motion="off"] .hero-pin { height: auto; }
        html[data-motion="off"] .hero-pin .hero { position: static; min-height: 0; }
        html[data-motion="off"] .hero-scrub { transform: none; opacity: 1; }
        html[data-motion="off"] .landscape > * { transform: none !important; }
        html[data-motion="off"] .hscroll { height: auto !important; }
        html[data-motion="off"] .hscroll-sticky {
          position: static;
          height: auto;
          overflow: visible;
          padding-top: 0;
        }
        html[data-motion="off"] .hscroll-track {
          transform: none !important;
          flex-wrap: wrap;
          padding: 0;
        }
        html[data-motion="off"] .hscroll-track .wall-item {
          flex: 1 1 320px;
          width: auto;
          transform: none;
        }
        html[data-motion="off"] .hscroll-bar,
        html[data-motion="off"] .hscroll-hint { display: none; }
        html[data-motion="off"] .section.in-view .stagger > * { animation: none; }
        html[data-motion="off"] .section.in-view .section-head-title { animation: none; }
        html[data-motion="off"] .reveal { opacity: 1; transform: none; transition: none; }
        html[data-motion="off"] .tilt { transform: none !important; }
        html[data-motion="off"] .tilt::after { display: none; }
        html[data-motion="off"] .gallery-grid > * img { transform: none; }
        html[data-motion="off"] .timeline { padding-left: 0; }
        html[data-motion="off"] .timeline::after { transform: scaleY(1); }
        html[data-motion="off"] .skill-fill { transform: scaleX(1); }

        /* ══════════════════════════════════════════════════════════════
           HERO WORLD — a layered Himalayan night
           Only the shapes are SVG; sky, moon, water and scrim are CSS
           gradients, which cost nothing to composite where an SVG layer costs
           a full-viewport texture. Each band is sized to its own content.
           ══════════════════════════════════════════════════════════════ */
        .landscape {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          will-change: transform;
        }

        /* Full-bleed: the scene spans the viewport while the hero copy stays in
           the readable content column. Inside the 1040px wrapper, an absolute
           inset:0 box would be a panel with edges, which is what this avoids. */
        .landscape {
          left: 50%;
          right: auto;
          margin-left: -50vw;
          width: 100vw;
        }

        .landscape > * {
          position: absolute;
          left: 0;
          width: 100%;
          pointer-events: none;
        }

        /* The sky keeps alpha on purpose: the WebGL scene behind it stays
           faintly readable as a starfield with the wireframe core hanging above
           the ridgeline like a digital moon. */
        .l-sky {
          top: 0;
          bottom: 0;
          background: linear-gradient(
            180deg,
            rgba(5, 7, 15, 0.52) 0%,
            rgba(11, 18, 48, 0.64) 26%,
            rgba(29, 35, 82, 0.82) 46%,
            rgba(74, 44, 94, 0.9) 60%,
            rgba(147, 70, 90, 0.92) 70%,
            rgba(201, 113, 63, 0.9) 78%,
            rgba(120, 54, 60, 0.74) 88%,
            rgba(20, 16, 30, 0.86) 100%
          );
        }

        /* A focused warm glow where the sun would sit behind the range. A radial
           gradient rather than a blurred shape: a filter here would be
           re-rastered every time the layer moves. */
        .l-glow {
          bottom: 22vh;
          height: 44vh;
          background: radial-gradient(
            120% 100% at 30% 100%,
            rgba(255, 176, 98, 0.42) 0%,
            rgba(255, 122, 82, 0.18) 42%,
            rgba(255, 122, 82, 0) 72%
          );
        }

        .l-moon {
          top: 2%;
          left: 54%;
          height: 54vh;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 236, 205, 0.9) 0%,
            rgba(255, 217, 168, 0.34) 15%,
            rgba(232, 160, 106, 0.1) 42%,
            rgba(232, 160, 106, 0) 70%
          );
          will-change: transform;
        }

        .l-water {
          bottom: 0;
          height: 34vh;
          background: linear-gradient(
            180deg,
            rgba(64, 38, 77, 0.92) 0%,
            rgba(27, 31, 69, 0.96) 26%,
            rgba(10, 15, 36, 0.98) 68%,
            #060912 100%
          );
        }

        .l-svg { bottom: 0; }
        .l-far { height: 74vh; }
        .l-mid { height: 66vh; }
        .l-river { height: 74vh; }
        .l-river-lower { height: 56vh; }
        .l-near { height: 54vh; }
        .l-grass-a { height: 30vh; }
        .l-grass-b { height: 23vh; }

        /* ── the river runs ──
           Dashes travelling along the centreline read as current. Two rhythms
           at different speeds give the surface some texture instead of one
           conveyor belt. Animating stroke-dashoffset keeps it off the layout
           and off the transform channel, so it never fights the parallax. */
        .river-flow { animation: riverFlow 3.4s linear infinite; }
        .river-flow-glint { animation-duration: 2.2s; }

        @keyframes riverFlow {
          to { stroke-dashoffset: -460; }
        }

        /* ── the flock ──
           Birds live in the sky plane, so a ridge in front of them occludes
           them exactly as terrain would. Each has its own altitude, size,
           duration, offset and flap rate. */
        .birds {
          top: 0;
          bottom: 0;
          pointer-events: none;
          will-change: transform;
        }

        .bird {
          position: absolute;
          display: block;
          animation-name: birdCross;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        @keyframes birdCross {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(122vw, calc(var(--bob, 2vh) * -1), 0); }
        }

        .bird-wings {
          animation: birdFlap 0.46s ease-in-out infinite alternate;
          transform-origin: 50% 64%;
        }

        @keyframes birdFlap {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }

        /* Legibility scrim over the whole scene. */
        .l-scrim {
          top: 0;
          bottom: 0;
          background: linear-gradient(
            180deg,
            rgba(5, 7, 15, 0.74) 0%,
            rgba(5, 7, 15, 0.12) 32%,
            rgba(5, 7, 15, 0.08) 58%,
            rgba(5, 7, 15, 0.44) 100%
          );
        }

        /* ── the parallax separation ──
           Every plane reads the same --p with its own multiplier: the far ridge
           barely moves, the near grass travels furthest. Translating downward
           can never open a gap at the bottom of a bottom-anchored band, which
           is why the near layers go down and only the moon rises. */
        .l-moon { transform: translate3d(0, calc(var(--p, 0) * -74px), 0); }
        .l-far { transform: translate3d(0, calc(var(--p, 0) * 16px), 0); }
        .birds { transform: translate3d(0, calc(var(--p, 0) * -34px), 0); }
        .l-water { transform: translate3d(0, calc(var(--p, 0) * 66px), 0); }
        .l-mid { transform: translate3d(0, calc(var(--p, 0) * 46px), 0); }
        .l-river { transform: translate3d(0, calc(var(--p, 0) * 80px), 0); }
        .l-river-lower { transform: translate3d(0, calc(var(--p, 0) * 92px), 0); }
        .l-near { transform: translate3d(0, calc(var(--p, 0) * 100px), 0); }
        .l-grass-a { transform: translate3d(0, calc(var(--p, 0) * 156px), 0); }
        .l-grass-b { transform: translate3d(0, calc(var(--p, 0) * 220px), 0); }

        @media (max-width: 1100px) {
          .section-rail { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .section.in-view .stagger > * { animation: none; }
          .tilt { transform: none !important; }
          .tilt::after { display: none; }
          .hero-scroll-thumb { animation: none; }
          .scroll-progress-glow { display: none; }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .content-wrapper { padding: 28px 16px 60px; }
          .hero-name { font-size: 36px; }
          .avatar-ring { width: 96px; height: 96px; }
          .section-nav { gap: 6px; padding: 6px; }
          .nav-pill { padding: 6px 12px; font-size: 12px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stat-value { font-size: 22px; }
          .research-grid { grid-template-columns: 1fr; }
          .gallery-grid { grid-template-columns: repeat(2, 1fr); }
          .gallery-item img { height: 140px; }
          .certs-grid-large { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
