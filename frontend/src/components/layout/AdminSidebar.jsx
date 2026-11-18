import React from "react";
import FarochetLogo from "../brand/FarochetLogo";

export const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", key: "dashboard" },
  { label: "Products", href: "/admin/products", key: "products" },
  { label: "Availability", href: "/admin/availability", key: "availability" },
  { label: "Inquiries", href: "/admin/inquiries", key: "inquiries" },
  { label: "Custom Requests", href: "/admin/custom-requests", key: "custom-requests" },
  { label: "Orders", href: "/admin/orders", key: "orders" },
  { label: "Sales Summary", href: "/admin/sales-summary", key: "sales-summary" },
];

export default function AdminSidebar({ activeKey, navItems = ADMIN_NAV_ITEMS, logoutHref = "/logout", open = false, onNavigate }) {
  return (
    <aside className={`faro-admin__sidebar ${open ? "is-open" : ""}`.trim()}>
      <FarochetLogo href="/admin" />
      <nav className="faro-admin__nav" aria-label="Admin navigation">
        {navItems.map((item) => (
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
