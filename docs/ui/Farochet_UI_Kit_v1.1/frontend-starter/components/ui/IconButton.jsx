import React from "react";

/** Icon-only buttons must always receive a meaningful accessible label. */
export default function IconButton({ label, children, disabled = false, onClick, className = "" }) {
  if (!label?.trim()) {
    throw new Error("IconButton requires a non-empty accessible label.");
  }

  return (
    <button
      type="button"
      className={`faro-icon-button ${className}`.trim()}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
