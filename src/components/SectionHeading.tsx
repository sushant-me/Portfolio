"use client";

import React from "react";
import Reveal from "./Reveal";

/**
 * Section masthead: index, title, accent rule. Adds the scroll landmarks the
 * page previously had none of — before this, sections were swapped in and out
 * with `display:none` and the only heading was the card labels.
 */
export default function SectionHeading({
  index,
  label,
  color,
  kicker,
}: {
  index: number;
  label: string;
  color: string;
  kicker?: string;
}) {
  return (
    <Reveal rotateX={12} y={26} z={-40} className="section-head-reveal">
      <div className="section-head">
        <div className="section-head-index" style={{ color }}>
          {String(index).padStart(2, "0")}
        </div>
        <div className="section-head-body">
          <h2 className="section-head-title">{label}</h2>
          {kicker ? <p className="section-head-kicker">{kicker}</p> : null}
        </div>
        <div
          className="section-head-rule"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}00)`,
          }}
        />
      </div>
    </Reveal>
  );
}
