import React from "react";

const TONES = new Set(["success", "info", "warning", "error"]);

export default function Alert({ tone = "info", title, children, role }) {
  const safeTone = TONES.has(tone) ? tone : "info";
  return (
    <div className={`faro-alert faro-alert--${safeTone}`} role={role || (safeTone === "error" ? "alert" : "status")}>
      <div>
        {title && <strong>{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}
