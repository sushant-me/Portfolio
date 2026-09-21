"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Small in-view hook used by the sections that animate on arrival (stat
 * counters, skill bars). `repeat` re-arms the animation once the element has
 * fully left the viewport, so scrolling back up replays it instead of showing a
 * frozen final state.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  repeat?: boolean;
}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const threshold = options?.threshold ?? 0.25;
  const rootMargin = options?.rootMargin ?? "0px 0px -12% 0px";
  const repeat = options?.repeat ?? true;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setInView(true);
          else if (repeat) setInView(false);
        });
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, repeat]);

  return [ref, inView] as const;
}

export default useInView;
