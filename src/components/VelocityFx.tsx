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
  const smoothed = useRef(0);
  const { subscribe, reducedMotion } = useScroll();

  useEffect(() => {
    if (reducedMotion) return;
    smoothed.current = 0;
    return subscribe((snap) => {
      // Measured on this page: a gentle scroll peaks around 7 px/ms and settles
      // near 1, a hard yank peaks near 97 and settles near 12. Smoothing first
      // means the effect tracks how fast the page is genuinely travelling
      // rather than spiking on single frames, and it decays on its own when the
      // scrolling stops.
      smoothed.current += (Math.abs(snap.velocity) - smoothed.current) * 0.16;
      const v = Math.min(smoothed.current / 22, 1);
      // A normal reading scroll therefore never lights these up at all, and
      // below the threshold both layers leave the paint entirely.
      const active = v > 0.16;

      const streaks = streaksRef.current;
      if (streaks) {
        streaks.style.visibility = active ? "visible" : "hidden";
        streaks.style.opacity = active ? (v * 0.26).toFixed(3) : "0";
        // Drift the pattern with travel so the lines feel attached to the
        // motion rather than pasted over it.
        if (active) {
          streaks.style.transform = `translate3d(0, ${((snap.y * 0.6) % 240).toFixed(1)}px, 0)`;
        }
      }

      const ring = ringRef.current;
      if (ring) {
        ring.style.visibility = active ? "visible" : "hidden";
        ring.style.opacity = active ? (v * 0.45).toFixed(3) : "0";
        if (active) {
          ring.style.transform = `translate(-50%, -50%) scale(${(0.94 + v * 0.42).toFixed(3)})`;
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
