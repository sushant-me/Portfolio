"use client";

import React, { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
};

/**
 * Scroll-triggered reveal wrapper.
 * Uses IntersectionObserver so sections fade/slide in as they enter the viewport.
 * Pure CSS-driven (no flicker), respects reduced-motion, and is SSR-safe.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  y = 24,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect users who prefer reduced motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal-shown" : ""} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        // translate handled by CSS using --reveal-y custom property
        ["--reveal-y" as string]: `${y}px`,
      }}
    >
      {children}
    </div>
  );
}
