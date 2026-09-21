"use client";

import React, { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /** Slide distance in px (positive = rises into place). */
  y?: number;
  /** Entry rotation on the X axis, for a 3D card-deal feel. */
  rotateX?: number;
  /** Entry depth in px (negative = starts further away). */
  z?: number;
  /** Entry scale, e.g. 0.94 for a subtle push-in. */
  scale?: number;
  /** Animate only the first time instead of replaying on every re-entry. */
  once?: boolean;
};

/**
 * Scroll-triggered reveal wrapper.
 *
 * IntersectionObserver drives it, the actual motion is pure CSS so it stays on
 * the compositor, and it is SSR-safe: the element ships in its final layout
 * position and only ever animates opacity/transform. Under
 * `prefers-reduced-motion` it renders immediately with no transition.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  y = 24,
  rotateX = 0,
  z = 0,
  scale = 1,
  once = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setShown(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal-shown" : ""} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        ["--reveal-y" as string]: `${y}px`,
        ["--reveal-rx" as string]: `${rotateX}deg`,
        ["--reveal-z" as string]: `${z}px`,
        ["--reveal-s" as string]: String(scale),
      }}
    >
      {children}
    </div>
  );
}
