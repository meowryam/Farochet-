import React from "react";

/** Intentionally contains no fake search/notification controls. Pass approved actions as children. */
export default function AdminTopbar({ accountLabel = "Raazia", children }) {
  return (
    <header className="faro-admin__topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {children}
        <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>{accountLabel}</span>
      </div>
    </header>
  );
}
