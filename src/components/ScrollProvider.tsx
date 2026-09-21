"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type ScrollSnapshot = {
  /** Current vertical scroll offset in px. */
  y: number;
  /** 0 → 1 across the whole document. */
  progress: number;
  /** Signed px/ms of the last frame; used for velocity-reactive effects. */
  velocity: number;
  /** Id of the section currently occupying the reading line. */
  active: string;
};

type Listener = (snapshot: ScrollSnapshot) => void;

type ScrollApi = {
  active: string;
  reducedMotion: boolean;
  setActive: (id: string) => void;
  scrollTo: (id: string) => void;
  registerSection: (id: string, el: HTMLElement | null) => void;
  /** Per-frame subscription. Never triggers a React render. */
  subscribe: (fn: Listener) => () => void;
};

const ScrollContext = createContext<ScrollApi | null>(null);

export function useScroll(): ScrollApi {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error("useScroll must be used inside <ScrollProvider>");
  return ctx;
}

/**
 * Owns smooth scrolling, the section scroll-spy, and the single rAF loop the
 * whole page shares.
 *
 * Two rules keep this cheap:
 *   1. Scroll values live in a ref and are pushed to subscribers imperatively —
 *      nothing here re-renders React on a scroll frame.
 *   2. The only React state is the *active section id*, which changes a handful
 *      of times per page, plus the reduced-motion flag.
 */
export default function ScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActiveState] = useState("about");
  const [reducedMotion, setReducedMotion] = useState(false);

  const sections = useRef(new Map<string, HTMLElement>());
  const listeners = useRef(new Set<Listener>());
  const snapshot = useRef<ScrollSnapshot>({
    y: 0,
    progress: 0,
    velocity: 0,
    active: "about",
  });
  const activeRef = useRef("about");
  const lenisRef = useRef<unknown>(null);

  const registerSection = useCallback((id: string, el: HTMLElement | null) => {
    if (el) sections.current.set(id, el);
    else sections.current.delete(id);
  }, []);

  const subscribe = useCallback((fn: Listener) => {
    listeners.current.add(fn);
    fn(snapshot.current);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  const setActive = useCallback((id: string) => {
    activeRef.current = id;
    setActiveState(id);
  }, []);

  const scrollTo = useCallback(
    (id: string) => {
      const el = sections.current.get(id);
      const lenis = lenisRef.current as
        | { scrollTo: (t: HTMLElement, o?: Record<string, unknown>) => void }
        | null;
      setActive(id);
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { offset: -76, duration: 1.15 });
      else el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [setActive]
  );

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    setReducedMotion(prefersReduced);

    let disposed = false;
    let raf = 0;
    let lenis: {
      raf: (t: number) => void;
      destroy?: () => void;
    } | null = null;

    const computeActive = () => {
      const line = window.innerHeight * 0.42;
      let current = activeRef.current;
      let best = -Infinity;
      sections.current.forEach((el, id) => {
        const top = el.getBoundingClientRect().top;
        if (top <= line && top > best) {
          best = top;
          current = id;
        }
      });
      return current;
    };

    let lastT = 0;
    let prevY = window.scrollY || 0;

    const tick = (now: number) => {
      const dt = Math.max(now - lastT, 1);
      lastT = now;

      if (lenis) lenis.raf(now);

      const doc = document.documentElement;
      const y = window.scrollY || doc.scrollTop || 0;
      const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const isVisible = document.visibilityState !== "hidden";

      const nextActive = computeActive();
      if (nextActive !== activeRef.current) {
        activeRef.current = nextActive;
        setActiveState(nextActive);
      }

      const snap = snapshot.current;
      snap.y = y;
      snap.progress = Math.min(Math.max(y / max, 0), 1);
      snap.velocity = isVisible ? (y - prevY) / dt : 0;
      snap.active = nextActive;
      prevY = y;

      if (isVisible) listeners.current.forEach((fn) => fn(snap));

      raf = requestAnimationFrame(tick);
    };

    (async () => {
      if (prefersReduced) return; // native scrolling for reduced-motion users
      try {
        const mod = (await import("lenis")) as unknown as {
          default?: new (o?: Record<string, unknown>) => {
            raf: (t: number) => void;
            destroy?: () => void;
          };
          Lenis?: new (o?: Record<string, unknown>) => {
            raf: (t: number) => void;
            destroy?: () => void;
          };
        };
        if (disposed) return;
        const Lenis = mod.default ?? mod.Lenis;
        if (!Lenis) return;
        lenis = new Lenis({
          lerp: 0.09,
          wheelMultiplier: 1,
          touchMultiplier: 1.5,
          autoRaf: false,
          anchors: false,
        });
        lenisRef.current = lenis;
        (window as unknown as { __lenis?: unknown }).__lenis = lenis;
      } catch {
        /* smooth scrolling is an enhancement; native scroll stays as fallback */
      }
    })();

    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      lenis?.destroy?.();
      lenisRef.current = null;
    };
  }, []);

  const api: ScrollApi = {
    active,
    reducedMotion,
    setActive,
    scrollTo,
    registerSection,
    subscribe,
  };

  return (
    <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>
  );
}
