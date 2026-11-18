import React from "react";

export default function Card({ title, description, action, children, className = "" }) {
  return (
    <section className={`faro-card ${className}`.trim()}>
      {(title || description || action) && (
        <header className="faro-card__header">
          <div>
            {title && <h2 className="faro-card__title">{title}</h2>}
            {description && <p className="faro-card__description">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
