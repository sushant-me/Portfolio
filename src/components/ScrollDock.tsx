"use client";

import React, { useEffect, useState } from "react";
import { useScroll } from "./ScrollProvider";

/**
 * Bottom-right dock: a back-to-top control that appears once you are past the
 * hero, and a motion switch.
 *
 * The motion switch matters: this page leans hard on movement, and a visitor who
 * does not want it should not have to change an OS setting to read a portfolio.
 * The choice is remembered across visits, and the system preference is the
 * default when they have not chosen.
 */
export default function ScrollDock() {
  const { subscribe, reducedMotion, setReducedMotion, scrollToTop } = useScroll();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    return subscribe((snap) => {
      const next = snap.progress > 0.05;
      // A no-op state update when nothing changed, so this costs no renders.
      setShowTop((prev) => (prev === next ? prev : next));
    });
  }, [subscribe]);

  return (
    <div className="scroll-dock">
      <button
        type="button"
        className="dock-btn"
        onClick={() => setReducedMotion(!reducedMotion)}
        aria-pressed={reducedMotion}
        title={
          reducedMotion
            ? "Turn animation back on"
            : "Reduce animation (remembered on this device)"
        }
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          {reducedMotion ? (
            <>
              <circle cx="12" cy="12" r="9" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </>
          ) : (
            <>
              <path d="M12 3v18" />
              <path d="M5 8l7-5 7 5" />
              <path d="M5 16l7 5 7-5" />
            </>
          )}
        </svg>
        <span>Motion {reducedMotion ? "off" : "on"}</span>
      </button>

      <button
        type="button"
        className={`dock-btn dock-top ${showTop ? "is-visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Back to top"
        aria-hidden={!showTop}
        tabIndex={showTop ? 0 : -1}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="12" y1="19" x2="12" y2="6" />
          <polyline points="6 12 12 6 18 12" />
        </svg>
        <span>Top</span>
      </button>
    </div>
  );
}
