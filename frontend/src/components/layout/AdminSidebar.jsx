import React from "react";
import FarochetLogo from "../brand/FarochetLogo";

export const ADMIN_NAV_ITEMS = [
  { label: "Product Management", href: "/admin/products", key: "products" },
  { label: "Availability Management", href: "/admin/availability", key: "availability" },
  { label: "Customer Inquiries", href: "/admin/inquiries", key: "inquiries" },
  { label: "Customization Requests", href: "/admin/customization-requests", key: "requests" },
  { label: "Confirmed Orders", href: "/admin/orders", key: "orders" },
  { label: "Sales Summary", href: "/admin/sales-summary", key: "sales-summary" },
];

export default function AdminSidebar({
  activeKey,
  logoutHref = null,
  open = false,
  onNavigate,
  onClose,
  sidebarRef,
  ...props
}) {
  return (
    <aside
      {...props}
      ref={sidebarRef}
      id="admin-navigation"
      className={`faro-admin__sidebar ${open ? "is-open" : ""}`.trim()}
      role={open ? "dialog" : undefined}
      aria-modal={open ? "true" : undefined}
      aria-label="Admin navigation"
      aria-hidden={open ? undefined : "true"}
      inert={!open}
    >
      <div className="faro-admin__sidebar-header">
        <FarochetLogo href="/admin" />
        <button
          type="button"
          className="faro-admin__close"
          aria-label="Close admin navigation"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <nav className="faro-admin__nav" aria-label="Admin navigation">
        {ADMIN_NAV_ITEMS.map((item) => (
          <a
            key={item.key}
            href={item.href}
            aria-current={activeKey === item.key ? "page" : undefined}
            onClick={onNavigate}
          >
            {item.label}
          </a>
        ))}
      </nav>
      {logoutHref && (
        <a href={logoutHref} onClick={onNavigate} style={{ color: "inherit", marginTop: "auto", fontSize: 14 }}>
          Log out
        </a>
      )}
    </aside>
  );
}
