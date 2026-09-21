"use client";

import { useEffect } from "react";
import { useScroll } from "./ScrollProvider";

/**
 * Depth on the section mastheads: each one drifts a few px against the scroll,
 * so the headings read as sitting slightly in front of the body copy. Writes are
 * imperative (transform only) and there are only seven of them.
 */
export default function SectionParallax() {
  const { subscribe } = useScroll();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let heads: HTMLElement[] = Array.from(
      document.querySelectorAll<HTMLElement>(".section-head")
    );
    const refresh = window.setTimeout(() => {
      heads = Array.from(document.querySelectorAll<HTMLElement>(".section-head"));
    }, 500);

    const unsubscribe = subscribe(() => {
      const vh = window.innerHeight || 1;
      for (const el of heads) {
        const rect = el.getBoundingClientRect();
        const centre = rect.top + rect.height / 2;
        const distance = (centre - vh / 2) / vh; // -0.5 … +0.5 across the view
        el.style.transform = `translate3d(0, ${(distance * -22).toFixed(2)}px, 0)`;
      }
    });

    return () => {
      clearTimeout(refresh);
      unsubscribe();
    };
  }, [subscribe]);

  return null;
}
