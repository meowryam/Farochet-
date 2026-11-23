import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/layout/PageHeader";
import CustomerShell from "../../components/layout/CustomerShell";
import ContentContainer from "../../components/layout/ContentContainer";
import CrochetFlower from "../../components/brand/CrochetFlower";
import { useAuth } from "../../contexts/AuthContext";
import { useCustomerWishlist } from "./useCustomerWishlist";
import ProductCard from "../catalogue/ProductCard";

export default function CustomerWishlistPage() {
  const { session, user, loading: authLoading } = useAuth();
  const isCustomerSession = !authLoading
    && user?.role === "CUSTOMER"
    && user.id === session?.user?.id;
  const wishlist = useCustomerWishlist(isCustomerSession ? session : null);

  return (
    <CustomerShell
      headerProps={{
        links: [
          { label: "Catalogue", href: "/catalogue" },
          { label: "My Orders", href: "/orders" },
        ],
        currentPath: "/wishlist",
        accountHref: "/account",
        wishlistHref: "/wishlist",
      }}
      footerProps={{
        catalogueHref: "/catalogue",
        customRequestHref: "/availability",
        inquiryHref: "/inquiries",
        wishlistHref: "/wishlist",
      }}
    >
      <ContentContainer className="customer-wishlist-page">
        <PageHeader
          title="My Wishlist"
          description="Products you have saved from the Farochet catalogue."
        />

        {wishlist.error && (
          <Alert tone="error" title="Wishlist could not be updated">
            <div className="catalogue-public-error">
              <span>{wishlist.error}</span>
              <Button
                variant="outline"
                onClick={() => void wishlist.reload()}
                loading={wishlist.isLoading}
              >
                Try again
              </Button>
            </div>
          </Alert>
        )}

        {wishlist.notice && <Alert tone="success">{wishlist.notice}</Alert>}

        {authLoading || wishlist.isLoading ? (
          <p className="catalogue-public-state" role="status">
            Loading your wishlist…
          </p>
        ) : wishlist.error ? null : wishlist.items.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            description="Save products from the catalogue to find them here."
            illustration={<CrochetFlower size={64} />}
            action={(
              <Link to="/catalogue">
                <Button variant="outline">Explore Catalogue</Button>
              </Link>
            )}
          />
        ) : (
          <div className="catalogue-public-grid">
            {wishlist.items.map((item) => (
              <ProductCard
                key={item.product.id}
                product={item.product}
                wishlistAction={{
                  label: "Remove from Wishlist",
                  saved: true,
                  variant: "danger",
                  loading: wishlist.isActionPending(item.product.id),
                  onClick: () => void wishlist.removeProduct(item.product.id),
                }}
              />
            ))}
          </div>
        )}
      </ContentContainer>
    </CustomerShell>
  );
}
