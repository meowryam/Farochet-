import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import TextArea from "../../components/ui/TextArea";
import ContentContainer from "../../components/layout/ContentContainer";
import CustomerShell from "../../components/layout/CustomerShell";
import { useAuth } from "../../contexts/AuthContext";
import {
  addWishlistProduct,
  getPublicProduct,
  getWishlistProductStatus,
  submitCustomerInquiry,
} from "../../services/api";
import { productImageSource } from "./productImageSource";

function formatPrice(amount) {
  return `PKR ${new Intl.NumberFormat("en-PK").format(amount)}`;
}

function ProductImage({ source, alt, index }) {
  const [failed, setFailed] = useState(!source);
  if (failed) {
    return (
      <div
        className="product-details__image product-details__image--empty"
        role="img"
        aria-label={`${alt} image ${index + 1} unavailable`}
      >
        Image unavailable
      </div>
    );
  }
  return (
    <img
      className="product-details__image"
      src={source}
      alt={`${alt}${index > 0 ? `, image ${index + 1}` : ""}`}
      onError={() => setFailed(true)}
    />
  );
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { session, user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [wishlistSaved, setWishlistSaved] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistSaving, setWishlistSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    setProduct(null);
    getPublicProduct(id)
      .then((loadedProduct) => {
        if (active) setProduct(loadedProduct);
      })
      .catch((error) => {
        if (active) setLoadError(error);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    if (!product || authLoading || user?.role !== "CUSTOMER") {
      setWishlistSaved(false);
      setWishlistLoading(false);
      return () => {
        active = false;
      };
    }

    setWishlistLoading(true);
    getWishlistProductStatus(product.id)
      .then((status) => {
        if (active) setWishlistSaved(status.saved);
      })
      .catch((error) => {
        if (active) setActionError(error.message);
      })
      .finally(() => {
        if (active) setWishlistLoading(false);
      });

    return () => {
      active = false;
    };
  }, [product, user?.id, user?.role, authLoading]);

  function requireCustomer() {
    if (user?.role === "CUSTOMER" && session) return true;
    navigate("/sign-in", {
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
        },
      },
    });
    return false;
  }

  async function submitInquiry(event) {
    event.preventDefault();
    if (!product || !requireCustomer()) return;

    setActionError("");
    setInquirySubmitted(false);
    setInquirySubmitting(true);
    try {
      await submitCustomerInquiry({
        productId: product.id,
        message: inquiryMessage,
      });
      setInquiryMessage("");
      setInquiryOpen(false);
      setInquirySubmitted(true);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setInquirySubmitting(false);
    }
  }

  async function addToWishlist() {
    if (!product || wishlistSaving || wishlistSaved || !requireCustomer()) return;

    setActionError("");
    setWishlistSaving(true);
    try {
      const result = await addWishlistProduct(product.id);
      setWishlistSaved(result.saved);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setWishlistSaving(false);
    }
  }

  function startCustomRequest() {
    if (!product) return;
    navigate(`/customization/request?productId=${encodeURIComponent(product.id)}`);
  }

  const mayUseCustomerActions = !user || user.role === "CUSTOMER";
  const imageSources = product?.images?.map(productImageSource) ?? [];

  return (
    <CustomerShell
      headerProps={{
        links: [
          { label: "Catalogue", href: "/catalogue" },
          { label: "My Orders", href: "/orders" },
        ],
        currentPath: "/catalogue",
        accountHref: "/customer",
        wishlistHref: "/wishlist",
      }}
      footerProps={{
        catalogueHref: "/catalogue",
        customRequestHref: "/availability",
        inquiryHref: "/availability",
        wishlistHref: "/wishlist",
      }}
    >
      <ContentContainer className="product-details-page">
        <nav className="product-details__breadcrumb" aria-label="Breadcrumb">
          <Link to="/catalogue">Our Collection</Link>
          <span aria-hidden="true">/</span>
          <span>{product?.name ?? "Product details"}</span>
        </nav>

        {isLoading ? (
          <p className="catalogue-public-state" role="status">Loading product details…</p>
        ) : loadError ? (
          <section className="product-details__state">
            <h1>{loadError.status === 404 || loadError.status === 400 ? "Product not found" : "Product details unavailable"}</h1>
            <p>
              {loadError.status === 404 || loadError.status === 400
                ? "This product may no longer be listed."
                : loadError.message}
            </p>
            <Button variant="outline" onClick={() => navigate("/catalogue")}>Back to collection</Button>
          </section>
        ) : product && (
          <>
            <section className="product-details">
              <div className="product-details__gallery" aria-label={`${product.name} images`}>
                {imageSources.length > 0
                  ? imageSources.map((source, index) => (
                    <ProductImage
                      key={`${product.id}-image-${index}`}
                      source={source}
                      alt={product.name}
                      index={index}
                    />
                  ))
                  : <ProductImage alt={product.name} index={0} />}
              </div>

              <div className="product-details__information">
                {product.category && <p className="product-details__category">{product.category}</p>}
                <h1>{product.name}</h1>
                {product.description
                  ? <p className="product-details__description">{product.description}</p>
                  : <p className="product-details__description">No description has been provided for this product.</p>}

                <div className="product-details__prices">
                  <div>
                    <span>Standard Catalogue Price</span>
                    <strong>{formatPrice(product.standardCataloguePrice)}</strong>
                  </div>
                  {product.fixedDiscountAmount != null && (
                    <div className="product-details__public-sale">
                      <span className="product-details__sale-badge">Public sale</span>
                      <span>Effective Public Price</span>
                      <strong>{formatPrice(product.effectivePublicPrice)}</strong>
                    </div>
                  )}
                </div>

                {mayUseCustomerActions && (
                  <div className="product-details__actions">
                    {actionError && <Alert tone="error" title="Action could not be completed">{actionError}</Alert>}
                    {inquirySubmitted && (
                      <Alert tone="success" title="Inquiry submitted">
                        Your product inquiry has been sent to Farochet.
                      </Alert>
                    )}
                    <Button onClick={() => {
                      if (requireCustomer()) {
                        setActionError("");
                        setInquirySubmitted(false);
                        setInquiryOpen((open) => !open);
                      }
                    }} disabled={inquirySubmitting}>
                      {inquiryOpen ? "Close inquiry" : "Submit Inquiry"}
                    </Button>
                    <Button variant="outline" onClick={startCustomRequest}>
                      Request a Custom Change
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={addToWishlist}
                      loading={wishlistSaving || wishlistLoading}
                      disabled={wishlistSaved}
                      aria-pressed={wishlistSaved}
                    >
                      {wishlistSaved ? "Saved to Wishlist" : "Add to Wishlist"}
                    </Button>
                    {inquiryOpen && (
                      <form className="product-details__inquiry-form" onSubmit={submitInquiry}>
                        <TextArea
                          id="product-inquiry-message"
                          name="message"
                          label="Your inquiry"
                          value={inquiryMessage}
                          onChange={(event) => setInquiryMessage(event.target.value)}
                          required
                          helpText="Your inquiry will be associated with this product."
                        />
                        <Button type="submit" loading={inquirySubmitting}>Send Inquiry</Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </ContentContainer>
    </CustomerShell>
  );
}
