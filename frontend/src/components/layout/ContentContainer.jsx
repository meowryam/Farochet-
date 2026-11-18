import React from "react";

export default function ContentContainer({ children, className = "" }) {
  return <div className={`farochet-container ${className}`.trim()}>{children}</div>;
}
