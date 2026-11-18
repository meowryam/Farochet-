import React from "react";
import FarochetLogo from "../brand/FarochetLogo";
import CrochetFlower from "../brand/CrochetFlower";

export default function CustomerFooter({ catalogueHref = "/catalogue", customRequestHref = "/custom-request", inquiryHref = "/inquiries", wishlistHref = "/wishlist" }) {
  return (
    <footer className="faro-footer">
      <div className="farochet-container faro-footer__grid">
        <div className="faro-footer__brand">
          <FarochetLogo />
          <p>Little things, made with love.</p>
          <CrochetFlower size={52} />
        </div>
        <nav className="faro-footer__links" aria-label="Explore Farochet">
          <strong>Explore</strong>
          <a href={catalogueHref}>Catalogue</a>
          <a href={customRequestHref}>Custom Request</a>
        </nav>
        <nav className="faro-footer__links" aria-label="Your account">
          <strong>Your Farochet</strong>
          <a href={inquiryHref}>My Inquiries</a>
          <a href={wishlistHref}>My Wishlist</a>
        </nav>
      </div>
      <div className="farochet-container faro-footer__bottom">
        © {new Date().getFullYear()} Farochet. Handcrafted with care.
      </div>
    </footer>
  );
}
