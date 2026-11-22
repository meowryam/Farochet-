import { useCallback, useEffect, useState } from "react";
import Alert from "../../components/ui/Alert";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import CustomerShell from "../../components/layout/CustomerShell";
import ContentContainer from "../../components/layout/ContentContainer";
import CrochetFlower from "../../components/brand/CrochetFlower";
import { listProducts } from "../../services/api";
import ProductCard from "./ProductCard";

export default function CustomerCataloguePage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setProducts(await listProducts());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the catalogue.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return (
    <CustomerShell
      headerProps={{ links: [
        { label: "Catalogue", href: "/catalogue" },
        { label: "My Orders", href: "/orders" },
      ], currentPath: "/catalogue", accountHref: "/customer", wishlistHref: "/wishlist" }}
      footerProps={{ catalogueHref: "/catalogue", customRequestHref: "/availability", inquiryHref: "/availability", wishlistHref: "/wishlist" }}
    >
      <ContentContainer className="catalogue-public-page">
        <header className="catalogue-public-heading">
          <div>
            <p className="catalogue-public-eyebrow">Farochet</p>
            <h1>Our Collection</h1>
            <p>Explore crochet pieces and their listed Standard Catalogue Prices.</p>
          </div>
          <CrochetFlower size={88} />
        </header>

        {error && (
          <Alert tone="error" title="The catalogue could not be loaded">
            <div className="catalogue-public-error">
              <span>{error}</span>
              <Button variant="outline" onClick={loadProducts} loading={isLoading}>Try again</Button>
            </div>
          </Alert>
        )}

        {isLoading ? (
          <p className="catalogue-public-state" role="status">Loading products…</p>
        ) : !error && products.length === 0 ? (
          <EmptyState
            title="No products listed"
            description="The collection is currently empty. Please check again later."
            illustration={<CrochetFlower size={64} />}
          />
        ) : (
          !error && (
            <div className="catalogue-public-grid">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )
        )}
      </ContentContainer>
    </CustomerShell>
  );
}
