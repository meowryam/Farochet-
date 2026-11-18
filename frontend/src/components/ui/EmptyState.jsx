import React from "react";

export default function EmptyState({ title, description, action, illustration }) {
  return (
    <section className="faro-empty">
      {illustration}
      <h2 className="faro-empty__title">{title}</h2>
      <p className="faro-empty__description">{description}</p>
      {action}
    </section>
  );
}
