"use client";

import React, { useEffect, useRef } from "react";
import { useScroll } from "./ScrollProvider";

/**
 * The hero world: a layered Himalayan night.
 *
 * Depth comes from speed, not size — every plane answers the same --p value
 * (the hero pin's progress) with a different multiplier, so the near grass
 * travels furthest while the far ridge barely moves. That is what makes the
 * scene read as a space rather than a picture.
 *
 * Only the shapes are SVG. The sky, moon glow, water and legibility scrim are
 * CSS gradients, because a gradient costs nothing to composite while an SVG
 * layer costs a full-viewport texture. Each band is sized to its own content
 * instead of the whole viewport for the same reason.
 *
 * Geometry is generated from fixed seeds, so the pre-rendered markup and the
 * hydrated client agree exactly.
 */

const W = 1440;
const H = 900;

/** Deterministic PRNG — identical on the server and in the browser. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A ridgeline across the full width, sealed down to the bottom edge.
 *
 *  Sharp peaks come from stacking two absolute-value sines (which produce
 *  cusps, unlike a plain sine) under a slow amplitude envelope, so the range
 *  has both big massifs and small foothills instead of rolling hills. */
function ridgePoints(seed: number, baseY: number, amp: number, steps = 58) {
  const rnd = lcg(seed);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = W * t;
    const envelope = 0.5 + 0.5 * Math.sin(t * Math.PI * 1.7 + seed * 0.5);
    const jag =
      Math.abs(Math.sin(t * Math.PI * 9.1 + seed * 1.7)) * 0.6 +
      Math.abs(Math.sin(t * Math.PI * 21.3 + seed * 2.9)) * 0.26 +
      rnd() * 0.14;
    pts.push({ x, y: baseY - amp * envelope * jag });
  }
  return pts;
}

function pathFrom(pts: { x: number; y: number }[], baseY: number) {
  return (
    `M 0 ${H} L 0 ${baseY.toFixed(1)} L ` +
    pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") +
    ` L ${W} ${H} Z`
  );
}

/** The ridgeline height at an arbitrary x, interpolated from its samples — so
 *  anything placed on the ridge stands exactly on it instead of floating. */
function ridgeYAt(pts: { x: number; y: number }[], x: number) {
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].x >= x) {
      const a = pts[i - 1];
      const b = pts[i];
      const t = (x - a.x) / (b.x - a.x || 1);
      return a.y + (b.y - a.y) * t;
    }
  }
  return pts[pts.length - 1].y;
}

/** Foreground grass: tapered blades leaning along the bottom edge. */
function grassPath(seed: number, count = 90) {
  const rnd = lcg(seed);
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = (W / count) * i + rnd() * 10;
    const h = 72 + rnd() * 128;
    const lean = (rnd() - 0.5) * 34;
    const w = 4 + rnd() * 6;
    d +=
      `M ${x.toFixed(1)} ${H} Q ${(x + lean * 0.5).toFixed(1)} ${(H - h * 0.6).toFixed(1)} ` +
      `${(x + lean).toFixed(1)} ${(H - h).toFixed(1)} L ${(x + w).toFixed(1)} ${H} Z `;
  }
  return d;
}

// Pure functions of their seeds, so they are computed once at module scope.
const FAR_PTS = ridgePoints(11, 520, 212);
const MID_PTS = ridgePoints(29, 604, 158);
const NEAR_PTS = ridgePoints(47, 692, 108);
const FAR = pathFrom(FAR_PTS, 520);
const MID = pathFrom(MID_PTS, 604);
const NEAR = pathFrom(NEAR_PTS, 692);
const GRASS_A = grassPath(101);
const GRASS_B = grassPath(211, 62);

/** Where the lone figure stands: the highest point of the near ridge in a
 *  chosen span, so it silhouettes against the sky rather than against rock. */
const FIGURE_X = NEAR_PTS.filter((p) => p.x > 880 && p.x < 1210).reduce(
  (best, p) => (p.y < best.y ? p : best),
  { x: 1044, y: 1e9 }
).x;
const FIGURE_Y = ridgeYAt(NEAR_PTS, FIGURE_X);

function Band({
  className,
  d,
  id,
  from,
  to,
  children,
}: {
  className: string;
  d: string;
  id: string;
  from: string;
  to: string;
  children?: React.ReactNode;
}) {
  return (
    <svg
      className={`l-svg ${className}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      focusable="false"
    >
      <defs>
        {/* Atmospheric perspective: each ridge is lit at its peaks and sinks
            into darkness at its base, which is what separates the planes by
            value instead of only by hue. */}
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      {children}
    </svg>
  );
}

export default function HeroLandscape() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { reducedMotion } = useScroll();

  // Pointer parallax on the whole scene: one element, one transform per frame,
  // so a world of depth costs a single style write.
  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const loop = () => {
      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;
      el.style.transform = `translate3d(${(cx * -14).toFixed(2)}px, ${(cy * -9).toFixed(2)}px, 0)`;
      raf =
        Math.abs(tx - cx) > 0.0015 || Math.abs(ty - cy) > 0.0015
          ? requestAnimationFrame(loop)
          : 0;
    };

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return (
    <div className="landscape" ref={ref} aria-hidden="true">
      <div className="l-sky" />
      <div className="l-glow" />
      <div className="l-moon" />
      <div className="l-water" />
      <Band className="l-far" d={FAR} id="gradFar" from="#4d5590" to="#222850" />
      <Band className="l-mid" d={MID} id="gradMid" from="#2d3468" to="#101430" />
      <Band className="l-near" d={NEAR} id="gradNear" from="#192046" to="#070a16">
        {/* A lone figure on the ridgeline, standing on the line the ridge
            actually draws — the one still point in a scene that never stops
            moving. Drawn after the ridge so it silhouettes against the sky. */}
        <g transform={`translate(${FIGURE_X} ${FIGURE_Y})`} className="l-figure">
          <ellipse cx="0" cy="1" rx="22" ry="3.4" fill="#05070f" opacity="0.45" />
          {/* head */}
          <circle cx="0" cy="-50" r="5.6" fill="#05070f" />
          {/* torso, tapering to the waist */}
          <path d="M -6.6 -43 L 6.6 -43 L 5 -21 L -5 -21 Z" fill="#05070f" />
          {/* legs */}
          <path d="M -4.8 -22 L -1.3 -22 L -1.7 0 L -4.3 0 Z" fill="#05070f" />
          <path d="M 1.3 -22 L 4.8 -22 L 4.3 0 L 1.7 0 Z" fill="#05070f" />
          {/* arm and the pack on their back */}
          <path d="M -7 -42 L -9.2 -24 L -6.9 -23.2 L -5.2 -40 Z" fill="#05070f" />
          <path d="M 6 -41 L 9.6 -38 L 9 -22 L 5.8 -21 Z" fill="#05070f" />
          {/* the last of the sunset catching their outline */}
          <path
            d="M -6.6 -43 L 6.6 -43 L 5 -21 L -5 -21 Z"
            fill="none"
            stroke="rgba(255,196,140,0.34)"
            strokeWidth="0.7"
          />
        </g>
      </Band>
      <Band className="l-grass-a" d={GRASS_A} id="gradGrassA" from="#0a0f20" to="#04060d" />
      <Band className="l-grass-b" d={GRASS_B} id="gradGrassB" from="#04060d" to="#010204" />
      <div className="l-scrim" />
    </div>
  );
}
