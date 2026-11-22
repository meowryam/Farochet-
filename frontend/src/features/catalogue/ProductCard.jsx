import { useState } from "react";

function imageSource(reference) {
  if (typeof reference !== "string") return null;
  if (reference.startsWith("/") && !reference.startsWith("//")) return reference;
  try {
    const url = new URL(reference);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function formatPrice(amount) {
  return `PKR ${new Intl.NumberFormat("en-PK").format(amount)}`;
}

export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const source = product.images?.map(imageSource).find(Boolean);

  return (
    <article className="catalogue-public-card">
      {source && !imageFailed ? (
        <img
          className="catalogue-public-card__image"
          src={source}
          alt={product.name}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="catalogue-public-card__image catalogue-public-card__image--empty" aria-label="Image unavailable">
          Image unavailable
        </div>
      )}
      <div className="catalogue-public-card__body">
        {product.category && <p className="catalogue-public-card__category">{product.category}</p>}
        <h2>{product.name}</h2>
        {product.description && <p className="catalogue-public-card__description">{product.description}</p>}
        <div className="catalogue-public-card__price">
          <span>Standard Catalogue Price</span>
          <strong>{formatPrice(product.basePrice)}</strong>
        </div>
      </div>
    </article>
  );
}
