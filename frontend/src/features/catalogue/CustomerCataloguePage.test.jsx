import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CustomerCataloguePage from "./CustomerCataloguePage";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ session: null, user: null, loading: false }),
}));

vi.mock("../../services/api", () => ({
  listProducts: vi.fn().mockResolvedValue([]),
}));

vi.mock("../wishlist/useCustomerWishlist", () => ({
  useCustomerWishlist: () => ({ items: [], error: "", notice: "" }),
}));

afterEach(cleanup);

describe("CustomerCataloguePage", () => {
  it("links inquiry history to the customer inquiry page", async () => {
    render(
      <MemoryRouter>
        <CustomerCataloguePage />
      </MemoryRouter>,
    );

    await screen.findByText("No products listed");
    expect(screen.getByRole("link", { name: "My Inquiries" })).toHaveAttribute("href", "/inquiries");
  });
});
