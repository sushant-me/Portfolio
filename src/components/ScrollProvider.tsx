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
  /** True when motion is off — either the OS preference or the visitor's own toggle. */
  reducedMotion: boolean;
  setReducedMotion: (off: boolean) => void;
  setActive: (id: string) => void;
  scrollTo: (id: string) => void;
  scrollToTop: () => void;
  registerSection: (id: string, el: HTMLElement | null) => void;
  /** Per-frame subscription. Never triggers a React render. */
  subscribe: (fn: Listener) => () => void;
  /**
   * Two-phase per-frame subscription for anything that has to *read* layout.
   *
   * Every `measure` callback on the page runs before any `apply` callback, so
   * the browser performs one forced layout per frame instead of one per
   * read-then-write pair. With six progress-driven elements that was the
   * difference between 27fps and 80fps.
   */
  subscribePhased: (
    measure: (s: ScrollSnapshot) => void,
    apply: (s: ScrollSnapshot) => void
  ) => () => void;
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
  // Motion is off when the OS asks for it, and the visitor can turn it off
  // themselves. The choice is remembered.
  const [reducedMotion, setReducedMotionState] = useState(false);

  const sections = useRef(new Map<string, HTMLElement>());
  const listeners = useRef(new Set<Listener>());
  const measures = useRef(new Set<(s: ScrollSnapshot) => void>());
  const applies = useRef(new Set<(s: ScrollSnapshot) => void>());
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

  const subscribePhased = useCallback(
    (
      measure: (s: ScrollSnapshot) => void,
      apply: (s: ScrollSnapshot) => void
    ) => {
      measures.current.add(measure);
      applies.current.add(apply);
      measure(snapshot.current);
      apply(snapshot.current);
      return () => {
        measures.current.delete(measure);
        applies.current.delete(apply);
      };
    },
    []
  );

  const setActive = useCallback((id: string) => {
    activeRef.current = id;
    setActiveState(id);
  }, []);

  const setReducedMotion = useCallback((off: boolean) => {
    setReducedMotionState(off);
    try {
      window.localStorage.setItem("portfolio-motion", off ? "off" : "on");
    } catch {
      /* private mode: the preference just does not persist */
    }
    if (typeof document !== "undefined") {
      document.documentElement.dataset.motion = off ? "off" : "on";
    }
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

  // Resolve the motion preference once: the OS setting, unless the visitor has
  // made an explicit choice of their own.
  const scrollToTop = useCallback(() => {
    const lenis = lenisRef.current as
      | { scrollTo: (t: number, o?: Record<string, unknown>) => void }
      | null;
    // The first section registered is the top of the document.
    const first = sections.current.keys().next().value as string | undefined;
    if (first) setActive(first);
    if (lenis) lenis.scrollTo(0, { duration: 1.25 });
    else
      window.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth",
      });
  }, [setActive, reducedMotion]);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem("portfolio-motion");
    } catch {
      stored = null;
    }
    const off = stored ? stored === "off" : prefersReduced;
    setReducedMotionState(off);
    document.documentElement.dataset.motion = off ? "off" : "on";
  }, []);

  // One rAF loop for the whole page. The smooth-scroll engine is created and
  // torn down as the motion flag changes.
  useEffect(() => {
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

      if (isVisible) {
        // Read everything, then write everything: one layout per frame.
        measures.current.forEach((fn) => fn(snap));
        applies.current.forEach((fn) => fn(snap));
        listeners.current.forEach((fn) => fn(snap));
      }

      raf = requestAnimationFrame(tick);
    };

    (async () => {
      if (reducedMotion) return; // native scrolling when motion is off
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
      if ((window as unknown as { __lenis?: unknown }).__lenis) {
        (window as unknown as { __lenis?: unknown }).__lenis = null;
      }
    };
  }, [reducedMotion]);

  const api: ScrollApi = {
    active,
    reducedMotion,
    setReducedMotion,
    setActive,
    scrollTo,
    scrollToTop,
    registerSection,
    subscribe,
    subscribePhased,
  };

  return (
    <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>
  );
}
