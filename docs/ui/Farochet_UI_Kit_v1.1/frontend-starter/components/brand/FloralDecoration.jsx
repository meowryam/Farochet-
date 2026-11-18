import React from "react";
import CrochetFlower from "./CrochetFlower";

/** Decorative-only floral detail. Place inside a positioned section wrapper. */
export default function FloralDecoration({ size = 88, className = "", style = {} }) {
  return (
    <span className={`faro-floral ${className}`.trim()} style={style} aria-hidden="true">
      <CrochetFlower size={size} />
    </span>
  );
}
