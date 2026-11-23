import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProductManagementPage from "./ProductManagementPage";

const api = vi.hoisted(() => ({
  archiveAdminProduct: vi.fn(),
  createAdminProduct: vi.fn(),
  getPublicPricing: vi.fn(),
  listAdminProducts: vi.fn(),
  removeAdminPublicDiscount: vi.fn(),
  setAdminPublicDiscount: vi.fn(),
  updateAdminProduct: vi.fn(),
}));

vi.mock("../../services/api", () => api);
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ signOut: vi.fn() }),
}));

const listedProduct = {
  id: "product-1",
  name: "Crochet Daisy",
  description: "Handmade flower",
  category: "Flowers",
  images: [],
  basePrice: 2400,
  isArchived: false,
};

const inactivePricing = {
  active: false,
  fixedDiscountAmount: null,
  products: [],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/products"]}>
      <ProductManagementPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  api.listAdminProducts.mockResolvedValue([listedProduct]);
  api.getPublicPricing.mockResolvedValue(inactivePricing);
  api.archiveAdminProduct.mockResolvedValue({});
  api.createAdminProduct.mockResolvedValue({});
  api.removeAdminPublicDiscount.mockResolvedValue(inactivePricing);
  api.setAdminPublicDiscount.mockResolvedValue(inactivePricing);
  api.updateAdminProduct.mockResolvedValue({});
});

describe("ProductManagementPage loading states", () => {
  it("does not show an empty catalogue after product loading fails and can retry", async () => {
    api.listAdminProducts
      .mockRejectedValueOnce(new Error("Admin product request failed."))
      .mockResolvedValueOnce([listedProduct]);
    renderPage();

    expect(await screen.findByText("Products could not be loaded. Refresh to try again."))
      .toBeInTheDocument();
    expect(screen.queryByText("No products yet")).not.toBeInTheDocument();
    expect(screen.queryByText("0 saved products")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByText("1 saved product")).toBeInTheDocument();
    expect(screen.getByText("Crochet Daisy")).toBeInTheDocument();
  });

  it("shows product records when public pricing fails without claiming a sale is inactive", async () => {
    api.getPublicPricing.mockRejectedValue(new Error("Public pricing request failed."));
    renderPage();

    expect(await screen.findByText("1 saved product")).toBeInTheDocument();
    expect(screen.getByText("Crochet Daisy")).toBeInTheDocument();
    expect(screen.getByText("Public pricing is unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Inactive")).not.toBeInTheDocument();

    const productRow = screen.getByRole("row", { name: /Crochet Daisy/ });
    expect(within(productRow).getByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByLabelText("Fixed discount amount (PKR)")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Activate sale" })).toBeDisabled();
  });

  it("shows the empty state only after a successful empty product response", async () => {
    api.listAdminProducts.mockResolvedValue([]);
    api.getPublicPricing.mockResolvedValue(inactivePricing);
    renderPage();

    expect(await screen.findByText("No products yet")).toBeInTheDocument();
    expect(screen.getByText("0 saved products")).toBeInTheDocument();
  });
});
