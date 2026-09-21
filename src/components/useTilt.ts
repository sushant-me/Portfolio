"use client";

import { useCallback, useRef } from "react";
import type React from "react";

/**
 * Pointer-driven 3D tilt for an existing element — no wrapper node, so grid and
 * flex layouts keep their structure.
 *
 * Spread the returned props onto the element and give it the `tilt` class:
 *
 *   const tilt = useTilt();
 *   <div className="stat-card tilt" {...tilt}>
 *
 * Values are written straight to CSS custom properties and coalesced into one
 * rAF, so a fast pointer cannot queue up layout work. Reduced-motion users get
 * the element untouched.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(
  max = 7,
  lift = 10
) {
  const ref = useRef<T | null>(null);
  const raf = useRef(0);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el) return;
      if (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${((0.5 - py) * max * 2).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
        el.style.setProperty("--tz", `${lift}px`);
        el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
        el.style.setProperty("--glare", "1");
        el.classList.add("is-tilting");
      });
    },
    [max, lift]
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.classList.remove("is-tilting");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--tz", "0px");
    el.style.setProperty("--glare", "0");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

export default useTilt;
