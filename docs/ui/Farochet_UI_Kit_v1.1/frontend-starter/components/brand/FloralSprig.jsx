import React from "react";

/** Lightweight decorative sprig for section edges and footer corners. */
export default function FloralSprig({ width = 120, className = "" }) {
  return (
    <svg
      className={className}
      width={width}
      viewBox="0 0 150 170"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18 154 C50 120 76 82 128 18" fill="none" stroke="var(--color-sage)" strokeWidth="3" strokeLinecap="round" />
      <path d="M47 119 C24 113 16 94 23 81 C42 87 53 101 47 119Z" fill="var(--color-sage)" stroke="var(--color-plum)" strokeWidth="1" />
      <path d="M71 88 C66 65 77 50 93 47 C98 67 88 82 71 88Z" fill="var(--color-sage)" stroke="var(--color-plum)" strokeWidth="1" />
      <path d="M94 55 C112 57 126 47 126 32 C108 28 96 38 94 55Z" fill="var(--color-sage)" stroke="var(--color-plum)" strokeWidth="1" />
      <g transform="translate(30 54)">
        <circle cx="0" cy="0" r="9" fill="var(--color-buttercream)" stroke="var(--color-plum)" strokeWidth="1.2" />
        <ellipse cx="0" cy="-15" rx="7" ry="12" fill="var(--color-lavender)" stroke="var(--color-plum)" strokeWidth="1" />
        <ellipse cx="15" cy="0" rx="7" ry="12" transform="rotate(90 15 0)" fill="var(--color-petal-rose)" stroke="var(--color-plum)" strokeWidth="1" />
        <ellipse cx="0" cy="15" rx="7" ry="12" fill="var(--color-lilac-mist)" stroke="var(--color-plum)" strokeWidth="1" />
        <ellipse cx="-15" cy="0" rx="7" ry="12" transform="rotate(90 -15 0)" fill="var(--color-petal-rose)" stroke="var(--color-plum)" strokeWidth="1" />
      </g>
    </svg>
  );
}
