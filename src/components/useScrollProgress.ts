"use client";

import { useEffect, useRef } from "react";
import { useScroll } from "./ScrollProvider";

export type ProgressMode =
  /** 0 when the element's top meets the viewport bottom, 1 when its bottom leaves the top. */
  | "view"
  /** 0 → 1 across a tall wrapper whose child is `position: sticky` (pinning / horizontal scroll). */
  | "pin"
  /**
   * Like "pin", but the travel includes the natural exit after the pin releases:
   * 1 only once the whole wrapper has left the top of the viewport. Use this
   * when the pinned element is itself a full viewport tall, otherwise the
   * animation finishes while the element is still sliding away and leaves a
   * stretch of empty screen.
   */
  | "pinExit"
  /** 0 → 1 as the element's top rises from the viewport bottom to 10% down. */
  | "enter";

/**
 * Publishes an element's scroll progress as a unitless `--p` custom property,
 * written imperatively from the provider's single frame loop.
 *
 * This is the whole scroll-trigger vocabulary: CSS does the animating from the
 * variable, so a scrubbed effect costs one style write per frame and never a
 * React render.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  mode: ProgressMode = "view",
  varName = "--p"
) {
  const ref = useRef<T | null>(null);
  const { subscribePhased } = useScroll();
  const value = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      let p: number;
      if (mode === "pin") {
        const travel = rect.height - vh;
        p = travel > 0 ? -rect.top / travel : 0;
      } else if (mode === "pinExit") {
        p = rect.height > 0 ? -rect.top / rect.height : 0;
      } else if (mode === "enter") {
        p = (vh - rect.top) / (vh * 0.9);
      } else {
        const span = rect.height + vh;
        p = (vh - rect.top) / span;
      }
      value.current = Math.min(Math.max(p, 0), 1);
    };
    const apply = () => {
      el.style.setProperty(varName, value.current.toFixed(4));
    };
    return subscribePhased(measure, apply);
  }, [mode, subscribePhased, varName]);

  return ref;
}

export default useScrollProgress;
