import React, { useState } from "react";
import FarochetLogo from "../brand/FarochetLogo";

const DEFAULT_LINKS = [
  { label: "Catalogue", href: "/catalogue" },
  { label: "Custom Request", href: "/custom-request" },
  { label: "My Orders", href: "/orders" },
];

export default function CustomerHeader({ links = DEFAULT_LINKS, currentPath = "", accountHref = "/login", wishlistHref = "/wishlist" }) {
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
        <a href={wishlistHref}>Wishlist</a>
      </div>
    </header>
  );
}
