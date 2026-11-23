import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminShell({ activeKey, children, topbarProps, logoutHref }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef(null);
  const sidebarRef = useRef(null);
  const wasMenuOpen = useRef(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      if (wasMenuOpen.current) {
        menuToggleRef.current?.focus();
        wasMenuOpen.current = false;
      }
      return undefined;
    }

    wasMenuOpen.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableElements = () => [
      ...sidebarRef.current.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ];

    focusableElements()[0]?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const elements = focusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const focusIsOutside = !sidebarRef.current?.contains(document.activeElement);

      if (event.shiftKey && (document.activeElement === first || focusIsOutside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || focusIsOutside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="faro-admin">
      {menuOpen && (
        <button
          type="button"
          className="faro-admin__backdrop"
          aria-label="Close admin navigation"
          onClick={closeMenu}
        />
      )}
      <AdminSidebar
        sidebarRef={sidebarRef}
        activeKey={activeKey}
        logoutHref={logoutHref}
        open={menuOpen}
        onNavigate={closeMenu}
        onClose={closeMenu}
      />
      <div className="faro-admin__main" aria-hidden={menuOpen || undefined} inert={menuOpen}>
        <AdminTopbar {...topbarProps}>
          <button
            ref={menuToggleRef}
            type="button"
            className="faro-admin-menu-toggle"
            aria-controls="admin-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close admin navigation" : "Open admin navigation"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="faro-admin-menu-toggle__icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>{menuOpen ? "Close menu" : "Menu"}</span>
          </button>
        </AdminTopbar>
        <main className="faro-admin__content">{children}</main>
      </div>
    </div>
  );
}
