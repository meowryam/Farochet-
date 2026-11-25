import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CustomerOrdersPage from "./CustomerOrdersPage";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../services/api", () => ({
  listMyOrders: vi.fn(),
  getMyOrder: vi.fn(),
  requestCustomerOrderCancellation: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import {
  getMyOrder,
  listMyOrders,
  requestCustomerOrderCancellation,
} from "../../services/api";

const token = "customer-access-token";
const order = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  productName: "Custom crochet bag",
  approvedPrice: 5000,
  manufacturingStatus: "Incomplete",
  paymentStatus: null,
  deliveryStatus: null,
  deliveryMethod: null,
  deliveryFee: null,
  deliveryTrackingInformation: null,
  estimatedCompletionDate: null,
  confirmedAt: "2026-11-20T10:00:00.000Z",
  originalInquiryId: "550e8400-e29b-41d4-a716-446655440001",
  specificationChangeNotes: null,
  cancellationRequestedAt: null,
  cancellationApproved: null,
  cancellationDecisionNotes: "Raazia internal note",
  priceRevisions: [{
    id: "550e8400-e29b-41d4-a716-446655440003",
    originalPrice: 5000,
    revisedPrice: 5200,
    actingUserId: "raazia-test-user",
    customerAgreed: true,
    reason: "Internal price history",
    createdAt: "2026-11-24T10:00:00.000Z",
  }],
  refundOutcome: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ session: { access_token: token }, loading: false });
  listMyOrders.mockResolvedValue([order]);
  getMyOrder.mockResolvedValue(order);
  requestCustomerOrderCancellation.mockImplementation(async (_id, _reason, _token) => ({
    ...order,
    cancellationRequestedAt: "2026-11-25T10:00:00.000Z",
    cancellationRequestReason: "Changed my mind",
  }));
});

afterEach(() => cleanup());

function renderPage() {
  return render(
    <MemoryRouter>
      <CustomerOrdersPage />
    </MemoryRouter>,
  );
}

describe("Customer order cancellation requests", () => {
  it("submits a reason without cancelling the Order itself", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "View order details" }));
    await screen.findByText("Order details");

    fireEvent.change(await screen.findByLabelText(/Reason for cancellation request/), {
      target: { value: "Changed my mind" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request cancellation" }));

    await waitFor(() => {
      expect(requestCustomerOrderCancellation).toHaveBeenCalledWith(
        order.id,
        "Changed my mind",
        token,
      );
    });
    await screen.findByText(/Submitted/);
    expect(screen.queryByRole("button", { name: "Request cancellation" })).not.toBeInTheDocument();
  });

  it("does not render Raazia-only decision notes or price history", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "View order details" }));
    await screen.findByText("Order details");

    expect(screen.queryByText("Raazia internal note")).not.toBeInTheDocument();
    expect(screen.queryByText("Internal price history")).not.toBeInTheDocument();
    expect(screen.queryByText(/Price revision history/)).not.toBeInTheDocument();
  });
});
