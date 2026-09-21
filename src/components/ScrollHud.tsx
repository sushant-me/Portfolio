"use client";

import React, { useEffect, useRef } from "react";
import { useScroll } from "./ScrollProvider";

type HudSection = { id: string; label: string; color: string };

/**
 * Scroll chrome: a reading-progress bar across the top and a section rail on the
 * right. Both are written imperatively from the scroll subscription — the bar
 * never re-renders React, and the rail only re-renders when the active section
 * actually changes.
 */
export default function ScrollHud({ sections }: { sections: HudSection[] }) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const { subscribe, active, scrollTo } = useScroll();

  useEffect(() => {
    return subscribe((snap) => {
      const bar = barRef.current;
      if (bar) bar.style.transform = `scaleX(${snap.progress.toFixed(4)})`;
      const glow = glowRef.current;
      if (glow) {
        // velocity-reactive bloom behind the bar: fast scroll leaves a trail
        const v = Math.min(Math.abs(snap.velocity) * 0.09, 1);
        glow.style.opacity = (0.25 + v * 0.75).toFixed(3);
        glow.style.transform = `scaleX(${Math.max(snap.progress, 0.02).toFixed(4)})`;
      }
    });
  }, [subscribe]);

  const activeColor =
    sections.find((s) => s.id === active)?.color || "#3b82f6";

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <div
          className="scroll-progress-glow"
          ref={glowRef}
          style={{ background: activeColor }}
        />
        <div
          className="scroll-progress-bar"
          ref={barRef}
          style={{
            background: `linear-gradient(90deg, ${activeColor}, #ffffff88)`,
          }}
        />
      </div>

      <nav className="section-rail" aria-label="Section navigation">
        {sections.map((s, i) => {
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              className={`rail-item ${isActive ? "active" : ""}`}
              onClick={() => scrollTo(s.id)}
              style={isActive ? { color: s.color } : undefined}
              aria-current={isActive ? "true" : undefined}
            >
              <span className="rail-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="rail-label">{s.label}</span>
              <span
                className="rail-dot"
                style={isActive ? { background: s.color, boxShadow: `0 0 12px ${s.color}` } : undefined}
              />
            </button>
          );
        })}
      </nav>
    </>
  );
}
