import React from "react";

/** Small decorative crochet-style flower. It is intentionally non-interactive. */
export default function CrochetFlower({ size = 104, className = "" }) {
  const petalColors = [
    "var(--color-lavender)",
    "var(--color-petal-rose)",
    "var(--color-lilac-mist)",
    "var(--color-buttercream)",
  ];

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(80 80)">
        {Array.from({ length: 8 }, (_, index) => (
          <g key={index} transform={`rotate(${index * 45})`}>
            <ellipse cx="0" cy="-39" rx="17" ry="29" fill={petalColors[index % petalColors.length]} stroke="var(--color-plum)" strokeWidth="1.5" />
            <path d="M0 -58 C-5 -48 -5 -33 0 -20" fill="none" stroke="rgba(255,255,255,.78)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
          </g>
        ))}
        <circle r="19" fill="var(--color-buttercream)" stroke="var(--color-plum)" strokeWidth="1.5" />
        <circle r="11" fill="none" stroke="var(--color-plum)" strokeWidth="1.3" strokeDasharray="2 3" />
        {Array.from({ length: 8 }, (_, index) => (
          <circle key={`stitch-${index}`} cx={Math.cos(index * Math.PI / 4) * 7} cy={Math.sin(index * Math.PI / 4) * 7} r="1.5" fill="var(--color-plum)" />
        ))}
      </g>
    </svg>
  );
}
