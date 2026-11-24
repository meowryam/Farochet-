import { useState } from "react";
<<<<<<< HEAD
import IconButton from "../../components/ui/IconButton";
import HeartIcon from "../../components/ui/HeartIcon";

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
=======
import { Link } from "react-router-dom";
import { productImageSource } from "./productImageSource";
>>>>>>> 9a9ecf1 (c4m1)

function formatPrice(amount) {
  return `PKR ${new Intl.NumberFormat("en-PK").format(amount)}`;
}

export default function ProductCard({ product, wishlistAction, inquiryAction }) {
  const [imageFailed, setImageFailed] = useState(false);
  const source = product.images?.map(productImageSource).find(Boolean);

  return (
    <article className="catalogue-public-card">
      {wishlistAction && (
        <div className="catalogue-public-card__wishlist-action">
          <IconButton
            label={wishlistAction.label}
            pressed={wishlistAction.saved}
            disabled={wishlistAction.loading}
            className="wishlist-heart-button"
            onClick={(event) => {
              event.stopPropagation();
              wishlistAction.onClick();
            }}
          >
            <HeartIcon filled={wishlistAction.saved} />
          </IconButton>
        </div>
      )}
      {source && !imageFailed ? (
        <Link to={`/products/${encodeURIComponent(product.id)}`} aria-label={`View ${product.name} details`}>
          <img
            className="catalogue-public-card__image"
            src={source}
            alt={product.name}
            onError={() => setImageFailed(true)}
          />
        </Link>
      ) : (
        <Link
          to={`/products/${encodeURIComponent(product.id)}`}
          className="catalogue-public-card__image catalogue-public-card__image--empty"
          aria-label={`View ${product.name} details`}
        >Image unavailable</Link>
      )}
      <div className="catalogue-public-card__body">
        {product.category && <p className="catalogue-public-card__category">{product.category}</p>}
        <h2><Link to={`/products/${encodeURIComponent(product.id)}`}>{product.name}</Link></h2>
        {product.description && <p className="catalogue-public-card__description">{product.description}</p>}
        <div className="catalogue-public-card__price">
          <span>Standard Catalogue Price</span>
          <strong>{formatPrice(product.standardCataloguePrice)}</strong>
          {product.fixedDiscountAmount != null && (
            <>
              <span className="catalogue-public-card__sale">Public sale</span>
              <span>Effective Public Price</span>
              <strong>{formatPrice(product.effectivePublicPrice)}</strong>
            </>
          )}
        </div>
        {inquiryAction && (
          <a className="faro-button faro-button--outline faro-button--sm" href={inquiryAction.href}>
            {inquiryAction.label}
          </a>
        )}
      </div>
    </article>
  );
}
