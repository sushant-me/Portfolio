"use client";

import { useEffect } from "react";
import { useScroll } from "./ScrollProvider";

/**
 * Depth on the section mastheads: each one drifts a few px against the scroll,
 * so the headings read as sitting slightly in front of the body copy. Writes are
 * imperative (transform only) and there are only seven of them.
 */
export default function SectionParallax() {
  const { subscribePhased } = useScroll();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let heads: HTMLElement[] = Array.from(
      document.querySelectorAll<HTMLElement>(".section-head")
    );
    const refresh = window.setTimeout(() => {
      heads = Array.from(document.querySelectorAll<HTMLElement>(".section-head"));
    }, 500);
    const offsets: number[] = [];

    const measure = () => {
      const vh = window.innerHeight || 1;
      for (let i = 0; i < heads.length; i++) {
        const rect = heads[i].getBoundingClientRect();
        const distance = (rect.top + rect.height / 2 - vh / 2) / vh;
        offsets[i] = distance * -22;
      }
    };

    const apply = () => {
      for (let i = 0; i < heads.length; i++) {
        heads[i].style.transform = `translate3d(0, ${(offsets[i] ?? 0).toFixed(2)}px, 0)`;
      }
    };

    const unsubscribe = subscribePhased(measure, apply);
    return () => {
      clearTimeout(refresh);
      unsubscribe();
    };
  }, [subscribePhased]);

  return null;
}
