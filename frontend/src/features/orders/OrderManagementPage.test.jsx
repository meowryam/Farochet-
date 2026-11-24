import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import OrderManagementPage from "./OrderManagementPage";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../services/api", () => ({
  listAdminOrders: vi.fn(),
  getAdminOrder: vi.fn(),
  updateAdminManufacturingProgress: vi.fn(),
  updateAdminPaymentStatus: vi.fn(),
  updateAdminDelivery: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminOrder,
  listAdminOrders,
  updateAdminDelivery,
} from "../../services/api";

const order = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  originalInquiryId: "550e8400-e29b-41d4-a716-446655440001",
  customerId: "550e8400-e29b-41d4-a716-446655440002",
  approvedPrice: 5000,
  manufacturingStatus: "Incomplete",
  paymentStatus: null,
  deliveryStatus: null,
  deliveryMethod: null,
  deliveryFee: null,
  deliveryTrackingInformation: null,
  estimatedCompletionDate: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({
    signOut: vi.fn(),
  });
  listAdminOrders.mockResolvedValue([order]);
  getAdminOrder.mockResolvedValue(order);
  updateAdminDelivery.mockImplementation(async (_id, delivery) => ({
    ...order,
    ...delivery,
  }));
});

afterEach(() => cleanup());

function renderPage() {
  return render(
    <MemoryRouter>
      <OrderManagementPage />
    </MemoryRouter>,
  );
}

describe("Order delivery management", () => {
  it("does not require agreement for a PKR 199 courier increase", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "View details" }));
    await screen.findByText("Order details");

    fireEvent.change(await screen.findByLabelText(/Delivery method/), {
      target: { value: "Courier/service delivery" },
    });
    fireEvent.change(screen.getByLabelText("Applicable delivery fee (PKR)"), {
      target: { value: "499" },
    });
    fireEvent.change(screen.getByLabelText("Pre-dispatch courier fee increase (PKR)"), {
      target: { value: "199" },
    });

    expect(screen.queryByLabelText("Customer agreed to the revised price")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save delivery information" }));

    await waitFor(() => {
      expect(updateAdminDelivery).toHaveBeenCalledWith(order.id, expect.objectContaining({
        deliveryMethod: "Courier/service delivery",
        deliveryFee: 499,
        courierFeeIncrease: 199,
      }));
    });
  });

  it("requires agreement and revised Approved Price for a PKR 200 increase", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "View details" }));
    await screen.findByText("Order details");

    fireEvent.change(await screen.findByLabelText(/Delivery method/), {
      target: { value: "Courier/service delivery" },
    });
    fireEvent.change(screen.getByLabelText("Applicable delivery fee (PKR)"), {
      target: { value: "500" },
    });
    fireEvent.change(screen.getByLabelText("Pre-dispatch courier fee increase (PKR)"), {
      target: { value: "200" },
    });

    const agreement = screen.getByLabelText("Customer agreed to the revised price");
    expect(agreement).toBeInTheDocument();
    fireEvent.click(agreement);
    expect(agreement).toBeChecked();
    fireEvent.change(screen.getByLabelText("Pre-dispatch courier fee increase (PKR)"), {
      target: { value: "201" },
    });
    expect(agreement).not.toBeChecked();
    fireEvent.change(screen.getByLabelText("Pre-dispatch courier fee increase (PKR)"), {
      target: { value: "200" },
    });
    expect(screen.getByLabelText("Revised Approved Price (PKR)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save delivery information" }));
    await waitFor(() => {
      expect(updateAdminDelivery).toHaveBeenCalledWith(order.id, expect.objectContaining({
        courierFeeIncrease: 200,
        customerAgreed: false,
      }));
    });
  });

  it("shows local handover as zero fee", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "View details" }));
    await screen.findByText("Order details");

    fireEvent.change(await screen.findByLabelText(/Delivery method/), {
      target: { value: "Local handover" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save delivery information" }));

    await waitFor(() => {
      expect(updateAdminDelivery).toHaveBeenCalledWith(order.id, expect.objectContaining({
        deliveryMethod: "Local handover",
        deliveryFee: 0,
      }));
    });
  });
});
