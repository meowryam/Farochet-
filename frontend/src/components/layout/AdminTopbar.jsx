import React from "react";

/** Intentionally contains no fake search/notification controls. Pass approved actions as children. */
export default function AdminTopbar({ accountLabel = "Raazia", children }) {
  return (
    <header className="faro-admin__topbar">
      <div className="faro-admin__topbar-leading">{children}</div>
      <span className="faro-admin__account-label">{accountLabel}</span>
    </header>
  );
}
