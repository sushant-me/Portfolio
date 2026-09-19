"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Reveal from "../components/Reveal";

const ROLES = ["AI Researcher","Full-Stack Engineer","Cybersecurity Specialist","QA Automation Expert","Crisis Engineer","Flutter Developer"];

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
  { value: 1, suffix: "", label: "Patch merged into google/go-github" },
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
    location: "Kathmandu, Nepal",
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
    location: "Kathmandu, Nepal",
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
    if (!start) return;
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
  const formatted = value >= 1000 ? `${(count / 1000).toFixed(0)}K` : count.toString();

  return (
    <div className="stat-card">
      <div className="stat-value">{formatted}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function SkillBar({ name, level, color, start }: { name: string; level: number; color: string; start: boolean }) {
  return (
    <div className="skill-row">
      <div className="skill-header">
        <span className="skill-name">{name}</span>
        <span className="skill-percent">{level}%</span>
      </div>
      <div className="skill-track">
        <div className="skill-fill" style={{ width: start ? `${level}%` : "0%", background: color }} />
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: (typeof PROJECTS)[0] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="project-card" onClick={() => setOpen(!open)} style={{ borderColor: open ? project.color : undefined }}>
      <div className="project-header">
        <span className="project-name">{project.name}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <p className="project-tagline">{project.tagline}</p>
      <div className="project-detail" style={{ maxHeight: open ? "400px" : "0", opacity: open ? 1 : 0, overflow: "hidden", transition: "max-height 0.5s ease, opacity 0.3s ease" }}>
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
//  MAIN PAGE
// ================================================================

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("about");
  const [loaded, setLoaded] = useState(false);
  const [animateSkills, setAnimateSkills] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  const [lightbox, setLightbox] = useState<{src: string; caption: string} | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const roleText = useTyping(ROLES, 65, 1800);
  const ambientColor = SECTIONS.find((s) => s.id === activeSection)?.color || "#3b82f6";

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    const t2 = setTimeout(() => setAnimateStats(true), 700);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (activeSection === "skills") {
      const t = setTimeout(() => setAnimateSkills(true), 300);
      return () => clearTimeout(t);
    } else {
      setAnimateSkills(false);
    }
  }, [activeSection]);

  const scrollToSection = useCallback((id: string) => {
    setActiveSection(id);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>

      <div className="portfolio-root">
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

          {/* HERO */}
          <header className="hero">
            <div className="hero-badge" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(12px)" }}>
              <span className="pulse-dot" />
              Open to opportunities
            </div>

            {/* Profile Image */}
            <div className="hero-avatar" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "scale(1)" : "scale(0.8)" }}>
              <div className="avatar-ring" style={{ borderColor: ambientColor }}>
                <img src="/images/profile pciture.jpg" alt="Sushant Poudel" />
              </div>
            </div>

            <h1 className="hero-name" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(16px)" }}>
              Sushant Poudel
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
              <a href="tel:+9779863635324" className="meta-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Phone
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
          </header>

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
          <main ref={sectionRef} className="sections">

            {/* ABOUT */}
            <section id="about" className="section" style={{ display: activeSection === "about" ? "block" : "none", opacity: activeSection === "about" ? 1 : 0 }}>
              <Reveal delay={0}>
                <div className="stats-grid">
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

              <div className="honors-grid">
                {[
                  { title: "Rank #1 — HackingHub Q3 2026 global leaderboard", desc: "116 flags and 11,860 XP, with 2 silver and 1 bronze award; the next-ranked account holds 97 flags. Public leaderboard API." },
                  { title: "Patch merged into google/go-github", desc: "PR #4556: release-asset uploads are rejected when the upload URL's host differs from the configured upload host. Approved by the maintainer with the full CI matrix green." },
                  { title: "Five memory-safety issues in google/s2geometry", desc: "A NULL dereference on the library's documented traversal path, an out-of-bounds read, a 16 GiB allocation from a 5-byte header, and a 2.4 GiB allocation reachable from a 28-byte input. Two hardening pull requests are under review by the maintainer." },
                  { title: "An OSS-Fuzz harness that was testing nothing", desc: "google/libphonenumber's as-you-type formatter asserted 0.00% line coverage of the code it targeted because it never generated valid input; the corrected harness reaches 93%." },
                  { title: "Two-time Hult Prize 1st Runner-Up", desc: "Recognized consecutive years (2024 & 2025) for social entrepreneurship and business models addressing global challenges." },
                  { title: "Aspire Leaders Program — Global Finalist (2025)", desc: "Selected as one of roughly 10,000 finalists from 54,000+ applicants worldwide, completing leadership training co-created by Harvard Business School faculty." },
                  { title: "NEC IT Club — Joint Secretary (2024–2025)", desc: "Logistics, executive administration and student engagement for department-level technical events and hackathons at Nepal Engineering College." },
                  { title: "Direct-to-device LEO satellite communication — Space Con 2026", desc: "Poster on 5G non-terrestrial-network connectivity from ordinary smartphones to LEO satellites, sized for Nepal's terrain." },
                ].map((h) => (
                  <div key={h.title} className="honor-card">
                    <div className="honor-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>{h.title}</span>
                    </div>
                    <p>{h.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* EXPERIENCE */}
            <section id="experience" className="section" style={{ display: activeSection === "experience" ? "block" : "none", opacity: activeSection === "experience" ? 1 : 0 }}>
              <div className="experience-list">
                {EXPERIENCE.map((exp, i) => (
                  <div key={i} className="exp-card" style={{ "--accent": exp.color } as React.CSSProperties}>
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
                ))}
              </div>
            </section>

            {/* RESEARCH */}
            <section id="research" className="section" style={{ display: activeSection === "research" ? "block" : "none", opacity: activeSection === "research" ? 1 : 0 }}>
              <div className="research-grid">
                {RESEARCH.map((r, i) => (
                  <div key={i} className="research-card" style={{ "--accent": r.color } as React.CSSProperties}>
                    <div className="research-venue">
                      <span className="venue-badge" style={{
                        color: r.venueType === "conference" ? "#ef4444" : "#6b7280",
                        background: r.venueType === "conference" ? "rgba(239,68,68,0.12)" : "rgba(107,114,128,0.12)",
                      }}>{r.venue}</span>
                    </div>
                    <div className="research-title">{r.title}</div>
                    <p className="research-desc">{r.desc}</p>
                    <div className="tag-row">
                      {r.tags.map((t) => (
                        <span key={t} className="tag" style={{ color: r.color, background: `${r.color}18` }}>{t}</span>
                      ))}
                    </div>
                    {r.file && (
                      <a href={r.file} target="_blank" rel="noopener noreferrer" className="btn-link" style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                        Read Paper
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* PROJECTS */}
            <section id="projects" className="section" style={{ display: activeSection === "projects" ? "block" : "none", opacity: activeSection === "projects" ? 1 : 0 }}>
              <div className="projects-grid">
                {PROJECTS.map((p) => (
                  <ProjectCard key={p.name} project={p} />
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <a href="https://github.com/sushant-me" target="_blank" rel="noopener noreferrer" className="btn-link" style={{ padding: "10px 20px", fontSize: "14px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "8px", verticalAlign: "middle" }}>
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  </svg>
                  View All 15+ Repositories on GitHub
                </a>
              </div>
            </section>

            {/* ACHIEVEMENTS / GALLERY */}
            <section id="achievements" className="section" style={{ display: activeSection === "achievements" ? "block" : "none", opacity: activeSection === "achievements" ? 1 : 0 }}>
              <div className="gallery-grid">
                {GALLERY.map((img, idx) => (
                  <div key={idx} className="gallery-item" onClick={() => setLightbox(img)}>
                    <img src={img.src} alt={img.caption} loading="lazy" />
                    <div className="gallery-caption">{img.caption}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* CERTIFICATES */}
            <section id="certificates" className="section" style={{ display: activeSection === "certificates" ? "block" : "none", opacity: activeSection === "certificates" ? 1 : 0 }}>
              <div className="certs-section">
                <div className="card-label">// Professional certifications (19+)</div>
                <div className="certs-grid-large">
                  {CERTIFICATES.map((c, i) => (
                    <div key={i} className="cert-card-large">
                      <div className="cert-org">{c.org}</div>
                      <div className="cert-name">{c.name}</div>
                      <a href={c.file} target="_blank" rel="noopener noreferrer" className="btn-link" style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        View Certificate
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SKILLS */}
            <section id="skills" className="section" style={{ display: activeSection === "skills" ? "block" : "none", opacity: activeSection === "skills" ? 1 : 0 }}>
              <div className="skills-grid">
                {SKILL_GROUPS.map((g) => (
                  <div key={g.category} className="skill-group">
                    <div className="skill-category">// {g.category}</div>
                    <div className="skill-list">
                      {g.skills.map((s) => (
                        <SkillBar key={s.name} {...s} color={g.color} start={animateSkills} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="certs-section" style={{ marginTop: "32px" }}>
                <div className="skill-category">// Certification providers</div>
                <div className="provider-grid">
                  {["Google", "IBM", "Meta", "Stanford", "DeepLearning.AI", "Packt", "Great Learning Academy"].map((p) => (
                    <div key={p} className="provider-badge">{p}</div>
                  ))}
                </div>
              </div>
            </section>
          </main>

          {/* FOOTER */}
          <footer className="portfolio-footer">
            <p>Built with <span style={{ color: ambientColor }}>Next.js</span> &mdash; Sushant Poudel &mdash; Kathmandu, Nepal &mdash; 2026</p>
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
          overflow-x: hidden;
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
          z-index: 10;
          padding: 10px;
          border-radius: 16px;
          background: rgba(10, 10, 15, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border);
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

        /* ── SECTIONS ── */
        .sections { position: relative; min-height: 400px; }
        .section { transition: opacity 0.5s ease; }

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
