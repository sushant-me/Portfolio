"use client";

import React, { useEffect, useRef } from "react";
import { useScroll } from "./ScrollProvider";

/**
 * Velocity-reactive drama: anime speed lines across the viewport and a shockwave
 * ring behind the hero, both scaled by how fast the page is actually moving.
 *
 * Two elements, opacity and transform only, written directly from the frame
 * loop — no React renders, no layout reads. Below ~0.25 px/ms both sit at zero,
 * so a normal reading scroll is completely calm and only a real flick lights
 * them up.
 */
export default function VelocityFx() {
  const streaksRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const { subscribe, reducedMotion } = useScroll();

  useEffect(() => {
    if (reducedMotion) return;
    return subscribe((snap) => {
      const v = Math.min(Math.abs(snap.velocity) / 2.4, 1);
      // Below the threshold both layers are taken out of the paint entirely.
      // A blended full-viewport layer is not free just because its opacity is
      // near zero, so at reading speed nothing here costs anything.
      const active = v > 0.035;

      const streaks = streaksRef.current;
      if (streaks) {
        streaks.style.visibility = active ? "visible" : "hidden";
        streaks.style.opacity = active ? (v * 0.45).toFixed(3) : "0";
        // Drift the pattern with travel so the lines feel attached to the
        // motion rather than pasted over it.
        if (active) {
          streaks.style.transform = `translate3d(0, ${((snap.y * 0.6) % 240).toFixed(1)}px, 0)`;
        }
      }

      const ring = ringRef.current;
      if (ring) {
        ring.style.visibility = active ? "visible" : "hidden";
        ring.style.opacity = active ? (0.1 + v * 0.55).toFixed(3) : "0";
        if (active) {
          ring.style.transform = `translate(-50%, -50%) scale(${(0.92 + v * 0.5).toFixed(3)})`;
        }
      }
    });
  }, [subscribe, reducedMotion]);

  return (
    <>
      <div className="speed-streaks" ref={streaksRef} aria-hidden="true" />
      <div className="impact-ring" ref={ringRef} aria-hidden="true" />
    </>
  );
}
