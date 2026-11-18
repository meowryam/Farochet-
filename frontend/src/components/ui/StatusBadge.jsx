import React from "react";

const ALLOWED_TONES = new Set(["pending", "active", "success", "danger", "hold", "info"]);

/** Presentation only: caller supplies the exact approved business status label. */
export default function StatusBadge({ label, tone = "info" }) {
  if (!label || typeof label !== "string") {
    throw new Error("StatusBadge requires the visible status label supplied by the caller.");
  }
  const safeTone = ALLOWED_TONES.has(tone) ? tone : "info";
  return <span className={`faro-badge faro-badge--${safeTone}`}>{label}</span>;
}
