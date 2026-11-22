import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequireAuth from "../../components/layout/RequireAuth";
import CustomerCataloguePage from "../catalogue/CustomerCataloguePage";
import ProductCard from "../catalogue/ProductCard";
import CustomerWishlistPage from "./CustomerWishlistPage";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../services/api", () => ({
  listMyWishlist: vi.fn(),
  addMyWishlistItem: vi.fn(),
  removeMyWishlistItem: vi.fn(),
  listProducts: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import {
  addMyWishlistItem,
  listMyWishlist,
  listProducts,
  removeMyWishlistItem,
} from "../../services/api";

function customerAuth(id = "customer-a") {
  return {
    session: { access_token: `token-${id}`, user: { id } },
    user: { id, role: "CUSTOMER" },
    loading: false,
  };
}

function wishlistItem(id, name = "Crochet flower") {
  return {
    product: {
      id,
      name,
      description: "Handmade crochet flower.",
      category: "Decor",
      images: [],
      basePrice: 1250,
    },
    createdAt: "2026-11-22T10:00:00.000Z",
  };
}

function renderWishlist() {
  return render(
    <MemoryRouter>
      <CustomerWishlistPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue(customerAuth());
  listMyWishlist.mockResolvedValue([]);
  listProducts.mockResolvedValue([]);
  addMyWishlistItem.mockImplementation(async (productId) => ({
    item: wishlistItem(productId),
    alreadySaved: false,
  }));
  removeMyWishlistItem.mockResolvedValue({ removed: true });
});

afterEach(() => cleanup());

describe("CustomerWishlistPage", () => {
  it("shows loading before the customer wishlist response arrives", async () => {
    let resolveWishlist;
    listMyWishlist.mockReturnValue(new Promise((resolve) => {
      resolveWishlist = resolve;
    }));

    renderWishlist();

    expect(screen.getByRole("status")).toHaveTextContent("Loading your wishlist");
    await act(async () => resolveWishlist([]));
    expect(await screen.findByRole("heading", { name: "Your wishlist is empty" }))
      .toBeInTheDocument();
  });

  it("shows the empty state and a catalogue link", async () => {
    renderWishlist();

    expect(await screen.findByRole("heading", { name: "Your wishlist is empty" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore Catalogue" }))
      .toHaveAttribute("href", "/catalogue");
  });

  it("renders saved products and removes an item after backend confirmation", async () => {
    const saved = wishlistItem("product-a");
    listMyWishlist.mockResolvedValue([saved]);
    renderWishlist();

    expect(await screen.findByRole("heading", { name: saved.product.name }))
      .toBeInTheDocument();
    expect(screen.getByText("PKR 1,250")).toBeInTheDocument();

    const removeButton = screen.getByRole("button", { name: "Remove from Wishlist" });
    expect(removeButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(removeMyWishlistItem).toHaveBeenCalledWith("product-a", "token-customer-a");
    });
    expect(await screen.findByRole("heading", { name: "Your wishlist is empty" }))
      .toBeInTheDocument();
    expect(screen.getByText("Removed from your wishlist.")).toBeInTheDocument();
  });

  it("shows an error and retries the failed request", async () => {
    listMyWishlist
      .mockRejectedValueOnce(new Error("Wishlist service unavailable."))
      .mockResolvedValueOnce([wishlistItem("product-a")]);
    renderWishlist();

    expect(await screen.findByText("Wishlist service unavailable.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "Crochet flower" }))
      .toBeInTheDocument();
  });

  it("redirects unauthenticated customers before making a wishlist request", async () => {
    useAuth.mockReturnValue({
      session: null,
      user: null,
      loading: false,
      error: "",
    });

    render(
      <MemoryRouter initialEntries={["/wishlist"]}>
        <Routes>
          <Route
            path="/wishlist"
            element={(
              <RequireAuth roles={["CUSTOMER"]}>
                <CustomerWishlistPage />
              </RequireAuth>
            )}
          />
          <Route path="/sign-in" element={<p>Sign-in page</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Sign-in page")).toBeInTheDocument();
    expect(listMyWishlist).not.toHaveBeenCalled();
  });

  it("does not display stale products when the signed-in customer changes", async () => {
    let resolveCustomerA;
    let resolveCustomerB;
    listMyWishlist
      .mockReturnValueOnce(new Promise((resolve) => { resolveCustomerA = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { resolveCustomerB = resolve; }));

    const view = renderWishlist();
    expect(listMyWishlist).toHaveBeenCalledWith("token-customer-a");

    useAuth.mockReturnValue(customerAuth("customer-b"));
    view.rerender(
      <MemoryRouter>
        <CustomerWishlistPage />
      </MemoryRouter>,
    );

    expect(listMyWishlist).toHaveBeenLastCalledWith("token-customer-b");
    await act(async () => resolveCustomerB([wishlistItem("product-b", "Customer B flower")]));
    expect(await screen.findByRole("heading", { name: "Customer B flower" }))
      .toBeInTheDocument();

    await act(async () => resolveCustomerA([wishlistItem("product-a", "Customer A flower")]));
    expect(screen.queryByRole("heading", { name: "Customer A flower" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Customer B flower" }))
      .toBeInTheDocument();
  });
});

describe("CustomerCataloguePage wishlist integration", () => {
  it("adds a catalogue product using the current customer's token", async () => {
    const product = wishlistItem("product-a").product;
    listProducts.mockResolvedValue([product]);
    listMyWishlist.mockResolvedValue([]);
    addMyWishlistItem.mockResolvedValue({
      item: wishlistItem(product.id),
      alreadySaved: false,
    });

    render(
      <MemoryRouter>
        <CustomerCataloguePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: product.name }))
      .toBeInTheDocument();
    const addButton = screen.getByRole("button", { name: "Add to Wishlist" });
    expect(addButton).toHaveAttribute("aria-pressed", "false");
    expect(addButton.querySelector("svg")).toHaveAttribute("fill", "none");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(addMyWishlistItem).toHaveBeenCalledWith(product.id, "token-customer-a");
    });
    const removeButton = await screen.findByRole("button", { name: "Remove from Wishlist" });
    expect(removeButton).toHaveAttribute("aria-pressed", "true");
    expect(removeButton.querySelector("svg")).toHaveAttribute("fill", "currentColor");
    expect(screen.getByText("Added to your wishlist.")).toBeInTheDocument();

    fireEvent.click(removeButton);
    await waitFor(() => {
      expect(removeMyWishlistItem).toHaveBeenCalledWith(product.id, "token-customer-a");
    });
    const restoredAddButton = await screen.findByRole("button", { name: "Add to Wishlist" });
    expect(restoredAddButton).toHaveAttribute("aria-pressed", "false");
    expect(restoredAddButton.querySelector("svg")).toHaveAttribute("fill", "none");
    expect(screen.getByText("Removed from your wishlist.")).toBeInTheDocument();
  });

  it("keeps the Wishlist heart click from triggering an enclosing product action", () => {
    const onProductAction = vi.fn();
    render(
      <div onClick={onProductAction}>
        <ProductCard
          product={wishlistItem("product-a").product}
          wishlistAction={{
            label: "Add to Wishlist",
            saved: false,
            loading: false,
            onClick: vi.fn(),
          }}
        />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to Wishlist" }));
    expect(onProductAction).not.toHaveBeenCalled();
  });

  it("keeps catalogue browsing public without exposing wishlist actions to signed-out visitors", async () => {
    useAuth.mockReturnValue({
      session: null,
      user: null,
      loading: false,
      error: "",
    });
    const product = wishlistItem("product-a").product;
    listProducts.mockResolvedValue([product]);

    render(
      <MemoryRouter>
        <CustomerCataloguePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: product.name }))
      .toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Wishlist/ })).not.toBeInTheDocument();
    expect(listMyWishlist).not.toHaveBeenCalled();
  });
});
