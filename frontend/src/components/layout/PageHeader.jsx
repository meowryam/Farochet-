import React from "react";

export default function PageHeader({ title, description, action, eyebrow }) {
  return (
    <header className="faro-page-header">
      <div>
        {eyebrow && <p style={{ margin: "0 0 5px", color: "var(--color-plum)", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
