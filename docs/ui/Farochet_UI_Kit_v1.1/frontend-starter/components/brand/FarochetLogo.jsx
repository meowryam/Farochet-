import React from "react";
import CrochetFlower from "./CrochetFlower";

export default function FarochetLogo({ href = "/", className = "" }) {
  return (
    <a className={`faro-logo ${className}`.trim()} href={href} aria-label="Farochet home">
      <span>Farochet</span>
      <CrochetFlower size={30} />
    </a>
  );
}
