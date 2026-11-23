import React, { useState } from "react";
import FarochetLogo from "../brand/FarochetLogo";
import HeartIcon from "../ui/HeartIcon";

const DEFAULT_LINKS = [
  { label: "Catalogue", href: "/catalogue" },
  { label: "My Inquiries", href: "/inquiries" },
  { label: "My Orders", href: "/orders" },
  { label: "Availability", href: "/availability" },
];

export default function CustomerHeader({
  links = DEFAULT_LINKS,
  currentPath = "",
  accountHref = "/customer",
  wishlistHref,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="faro-customer-header">
      <FarochetLogo />
      <button
        type="button"
        className="faro-menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="farochet-main-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? "Close menu" : "Menu"}
      </button>
      <nav
        id="farochet-main-navigation"
        className={`faro-customer-nav ${menuOpen ? "is-open" : ""}`.trim()}
        aria-label="Main navigation"
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            aria-current={currentPath === link.href ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div className="faro-customer-actions">
        <a href={accountHref}>Account</a>
        {wishlistHref && (
          <a className="wishlist-nav-link" href={wishlistHref}>
            <HeartIcon className="wishlist-nav-icon" />
            <span>Wishlist</span>
          </a>
        )}
      </div>
    </header>
  );
}