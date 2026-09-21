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

/**
 * The river.
 *
 * A ribbon, not a stroke: the centreline is offset by a half-width that grows
 * as the water descends, so it starts as a trickle at the notch in the range
 * and reaches the lake as a broad channel.
 *
 * The course is generated once and then cut into two segments which are drawn
 * into two different depth planes — the upper behind the near range, the lower
 * in front of it. That is what lets the water run the entire height of the
 * scene without the near hills cutting it off. The two segments overlap
 * generously around the crest line so the parallax difference between the
 * planes can never open a visible gap at the join.
 */
function riverCourse(
  seed: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  steps = 52
) {
  const pts: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // two frequencies of meander, so the course snakes the way water does
    // instead of running like a stripe down the mountain
    const x =
      x0 +
      (x1 - x0) * t +
      Math.sin(t * Math.PI * 2.6 + seed) * 46 * t +
      Math.sin(t * Math.PI * 5.1 + seed * 1.7) * 22 * t;
    const y = y0 + (y1 - y0) * Math.pow(t, 1.14);
    pts.push({ x, y, t });
  }
  return pts;
}

function ribbonFrom(
  pts: { x: number; y: number; t: number }[],
  wTop: number,
  wBottom: number
) {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const a = pts[Math.max(i - 1, 0)];
    const b = pts[Math.min(i + 1, pts.length - 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const h = wTop + (wBottom - wTop) * p.t;
    left.push(`${(p.x + nx * h).toFixed(1)} ${(p.y + ny * h).toFixed(1)}`);
    right.push(`${(p.x - nx * h).toFixed(1)} ${(p.y - ny * h).toFixed(1)}`);
  }
  return {
    d: `M ${left.join(" L ")} L ${right.reverse().join(" L ")} Z`,
    centre:
      "M " + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L "),
  };
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

/** The river rises from the deepest notch in the far range — the natural
 *  watercourse — and winds down into the lake below. */
const RIVER_SOURCE = FAR_PTS.filter((p) => p.x > 500 && p.x < 800).reduce(
  (best, p) => (p.y > best.y ? p : best),
  { x: 640, y: -1e9 }
);
const RIVER_PTS = riverCourse(
  7,
  RIVER_SOURCE.x,
  RIVER_SOURCE.y - 4,
  RIVER_SOURCE.x + 124,
  892
);

/** Height of the near range where the river crosses it. The two segments
 *  overlap by 180 viewBox units around this line, which is far more than the
 *  54px the planes drift apart at full scroll, so the join never separates. */
const RIVER_CROSS_Y = ridgeYAt(NEAR_PTS, RIVER_PTS[RIVER_PTS.length - 1].x);
const UPPER_CUT = Math.max(
  RIVER_PTS.findIndex((p) => p.y > RIVER_CROSS_Y + 90),
  8
);
const LOWER_CUT = Math.max(
  RIVER_PTS.findIndex((p) => p.y > RIVER_CROSS_Y - 90),
  1
);
const RIVER_UPPER = ribbonFrom(RIVER_PTS.slice(0, UPPER_CUT + 1), 3, 13);
const RIVER_LOWER = ribbonFrom(RIVER_PTS.slice(LOWER_CUT), 12, 27);

/** Birds riding the valley air. Negative delays put the flock mid-flight the
 *  moment the page opens rather than queued off-screen, and each has its own
 *  altitude, size, speed, bob and flap rate. */
const FLOCK = [
  { top: "16%", left: "0%", scale: 1, dur: 34, delay: -6, bob: 2.6, flap: 0.44 },
  { top: "23%", left: "0%", scale: 0.76, dur: 46, delay: -24, bob: 3.4, flap: 0.52 },
  { top: "11%", left: "0%", scale: 0.6, dur: 54, delay: -41, bob: 2.0, flap: 0.4 },
  { top: "29%", left: "0%", scale: 0.7, dur: 40, delay: -15, bob: 3.0, flap: 0.48 },
];

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

      {/* Birds sit in the sky plane, so a ridge passing in front of them hides
          them the way real terrain would. */}
      <div className="birds">
        {FLOCK.map((b, i) => (
          <span
            key={i}
            className="bird"
            style={
              {
                top: b.top,
                left: b.left,
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.delay}s`,
                "--bob": `${b.bob}vh`,
              } as React.CSSProperties
            }
          >
            <svg
              width={Math.round(46 * b.scale)}
              height={Math.round(24 * b.scale)}
              viewBox="0 0 46 24"
              focusable="false"
            >
              <g
                className="bird-wings"
                style={{ animationDuration: `${b.flap}s` }}
              >
                <path
                  d="M2 15 Q 12 3 23 14 Q 34 3 44 15"
                  fill="none"
                  stroke="#bcd0ea"
                  strokeOpacity="0.72"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />
              </g>
            </svg>
          </span>
        ))}
      </div>

      <div className="l-water" />
      <Band className="l-far" d={FAR} id="gradFar" from="#4d5590" to="#222850" />
      <Band className="l-mid" d={MID} id="gradMid" from="#2d3468" to="#101430" />

      {/* The upper river, drawn before the near range so the hills occlude it
          where it passes behind them. */}
      <svg
        className="l-svg l-river"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMax slice"
        focusable="false"
      >
        <defs>
          <linearGradient id="gradRiverUpper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a9cbe6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6f9ac4" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path d={RIVER_UPPER.d} fill="url(#gradRiverUpper)" />
        <path
          className="river-flow"
          d={RIVER_UPPER.centre}
          fill="none"
          stroke="rgba(226,242,255,0.6)"
          strokeWidth="1.6"
          strokeDasharray="14 26"
          strokeLinecap="round"
        />
      </svg>

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

      {/* The lower river, drawn in front of the near range so the water keeps
          running down the hillside to the lake. It overlaps the upper segment
          generously around the crest line. */}
      <svg
        className="l-svg l-river-lower"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMax slice"
        focusable="false"
      >
        <defs>
          <linearGradient id="gradRiverLower" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7fa6c9" stopOpacity="0.46" />
            <stop offset="55%" stopColor="#54799e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2d4e70" stopOpacity="0.34" />
          </linearGradient>
        </defs>
        <path d={RIVER_LOWER.d} fill="url(#gradRiverLower)" />
        <path
          className="river-flow"
          d={RIVER_LOWER.centre}
          fill="none"
          stroke="rgba(226,242,255,0.58)"
          strokeWidth="1.9"
          strokeDasharray="18 32"
          strokeLinecap="round"
        />
        <path
          className="river-flow river-flow-glint"
          d={RIVER_LOWER.centre}
          fill="none"
          stroke="rgba(255,255,255,0.36)"
          strokeWidth="1.2"
          strokeDasharray="8 48"
          strokeLinecap="round"
        />
      </svg>

      <Band className="l-grass-a" d={GRASS_A} id="gradGrassA" from="#0a0f20" to="#04060d" />
      <Band className="l-grass-b" d={GRASS_B} id="gradGrassB" from="#04060d" to="#010204" />
      <div className="l-scrim" />
    </div>
  );
}
