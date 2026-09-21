"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useScrollProgress } from "./useScrollProgress";

/**
 * Turns vertical scroll into horizontal travel: the track is pinned for the
 * length of its own overflow, and `--p` (0 → 1 across that pin) scrubs it
 * sideways.
 *
 * The wrapper's height is set to `viewport + overflow`, so one pixel of scroll
 * moves the track exactly one pixel — the mapping is direct rather than tuned,
 * which is what keeps it feeling attached to the wheel.
 *
 * Below 900px, or under reduced-motion, it degrades to a normal wrapped grid:
 * sideways-scrubbed layouts are miserable on a phone.
 */
export default function HorizontalScroller({
  children,
  className = "",
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  const wrapRef = useScrollProgress<HTMLDivElement>("pin");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [distance, setDistance] = useState(0);
  const [pinned, setPinned] = useState(false);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced || window.innerWidth < 900) {
      wrap.style.height = "";
      setDistance(0);
      setPinned(false);
      return;
    }
    const gap = 28;
    const overflow = Math.max(
      track.scrollWidth - window.innerWidth + gap * 2,
      0
    );
    wrap.style.height = `${Math.round(window.innerHeight + overflow)}px`;
    setDistance(overflow);
    setPinned(true);
  }, [wrapRef]);

  useEffect(() => {
    measure();
    const settle = window.setTimeout(measure, 500);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <div className={`hscroll ${pinned ? "is-pinned" : ""} ${className}`} ref={wrapRef}>
      <div className="hscroll-sticky">
        {label ? <div className="hscroll-hint">{label}</div> : null}
        <div
          className="hscroll-track"
          ref={trackRef}
          style={
            distance
              ? { transform: `translate3d(calc(var(--p, 0) * -${distance}px), 0, 0)` }
              : undefined
          }
        >
          {children}
        </div>
        {pinned ? (
          <div className="hscroll-bar" aria-hidden="true">
            <span className="hscroll-bar-fill" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
