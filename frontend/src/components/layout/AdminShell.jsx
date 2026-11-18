import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminShell({ activeKey, children, topbarProps, navItems, logoutHref }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="faro-admin">
      {menuOpen && (
        <button
          type="button"
          className="faro-admin__backdrop"
          aria-label="Close admin navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <AdminSidebar
        activeKey={activeKey}
        navItems={navItems}
        logoutHref={logoutHref}
        open={menuOpen}
        onNavigate={() => setMenuOpen(false)}
      />
      <div className="faro-admin__main">
        <AdminTopbar {...topbarProps}>
          <button
            type="button"
            className="faro-admin-menu-toggle"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close admin navigation" : "Open admin navigation"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </AdminTopbar>
        <main className="faro-admin__content">{children}</main>
      </div>
    </div>
  );
}
