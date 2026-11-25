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
  recordAdminSpecificationChange: vi.fn(),
  recordAdminOrderPriceRevision: vi.fn(),
  recordAdminCancellationDecision: vi.fn(),
  recordAdminRefundOutcome: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminOrder,
  listAdminOrders,
  updateAdminDelivery,
  updateAdminPaymentStatus,
  recordAdminSpecificationChange,
  recordAdminOrderPriceRevision,
  recordAdminCancellationDecision,
  recordAdminRefundOutcome,
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
  recordAdminSpecificationChange.mockImplementation(async (_id, notes) => ({
    ...order,
    manufacturingStatus: "On Hold",
    specificationChangeNotes: notes,
  }));
  recordAdminOrderPriceRevision.mockImplementation(async (_id, revision) => ({
    ...order,
    approvedPrice: revision.revisedApprovedPrice,
  }));
  recordAdminCancellationDecision.mockImplementation(async (_id, decision) => ({
    ...order,
    manufacturingStatus: decision.approved ? "Cancelled" : order.manufacturingStatus,
    cancellationApproved: decision.approved,
    cancellationDecisionNotes: decision.notes ?? null,
  }));
  recordAdminRefundOutcome.mockImplementation(async (_id, refundOutcome) => ({
    ...order,
    refundOutcome: refundOutcome ?? null,
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

  it("records a specification change and an agreed order price revision", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "View details" }));
    await screen.findByText("Order details");

    fireEvent.change(await screen.findByLabelText(/Specification change note/), {
      target: { value: "Larger size changes cost." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Place On Hold for renegotiation" }));

    await waitFor(() => {
      expect(recordAdminSpecificationChange).toHaveBeenCalledWith(
        order.id,
        "Larger size changes cost.",
      );
    });

    fireEvent.change(screen.getByLabelText("Revised Order Approved Price (PKR) *"), {
      target: { value: "5400" },
    });
    fireEvent.change(screen.getByLabelText(/Reason for revision/), {
      target: { value: "Agreed revised specification" },
    });
    fireEvent.click(screen.getByLabelText("Customer has agreed to the revised price"));
    fireEvent.click(screen.getByRole("button", { name: "Record price revision" }));

    await waitFor(() => {
      expect(recordAdminOrderPriceRevision).toHaveBeenCalledWith(order.id, {
        revisedApprovedPrice: 5400,
        customerAgreed: true,
        reason: "Agreed revised specification",
      });
    });
  });

  it("records only Raazia's cancellation decision", async () => {
    getAdminOrder.mockResolvedValue({
      ...order,
      cancellationRequestedAt: "2026-11-25T10:00:00.000Z",
      cancellationRequestReason: "Customer requested cancellation",
    });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "View details" }));
    await screen.findByText("Order details");

    fireEvent.change(await screen.findByLabelText("Cancellation decision *"), {
      target: { value: "approved" },
    });
    fireEvent.change(screen.getByLabelText("Cancellation decision note"), {
      target: { value: "Raazia approved." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record cancellation decision" }));

    await waitFor(() => {
      expect(recordAdminCancellationDecision).toHaveBeenCalledWith(order.id, {
        approved: true,
        notes: "Raazia approved.",
      });
    });
    expect(recordAdminRefundOutcome).not.toHaveBeenCalled();
  });

  it("lets Raazia decide cancellation without a Customer request", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "View details" }));
    await screen.findByText("Order details");

    const decision = await screen.findByLabelText("Cancellation decision *");
    expect(decision).toBeEnabled();
    fireEvent.change(decision, { target: { value: "approved" } });
    fireEvent.change(screen.getByLabelText("Cancellation decision note"), {
      target: { value: "Renegotiation failed." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record cancellation decision" }));

    await waitFor(() => {
      expect(recordAdminCancellationDecision).toHaveBeenCalledWith(order.id, {
        approved: true,
        notes: "Renegotiation failed.",
      });
    });
  });

  it("records a refund outcome independently of cancellation and payment status", async () => {
    getAdminOrder.mockResolvedValue({ ...order, paymentStatus: "Partial Payment" });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "View details" }));
    await screen.findByText("Order details");

    fireEvent.change(screen.getByLabelText(/Manually recorded refund outcome/), {
      target: { value: "Full refund recorded manually." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record refund outcome" }));

    await waitFor(() => {
      expect(recordAdminRefundOutcome).toHaveBeenCalledWith(
        order.id,
        "Full refund recorded manually.",
      );
    });
    expect(recordAdminCancellationDecision).not.toHaveBeenCalled();
    expect(updateAdminPaymentStatus).not.toHaveBeenCalled();
  });
});
