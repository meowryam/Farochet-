import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CustomerInquiryPage from "./CustomerInquiryPage";
import CustomerInquiryDetailsPage from "./CustomerInquiryDetailsPage";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../services/api", () => ({
  getMyInquiry: vi.fn(),
  listMyInquiries: vi.fn(),
  listProducts: vi.fn(),
  submitCustomerInquiry: vi.fn(),
}));

import { useAuth } from "../../contexts/AuthContext";
import {
  getMyInquiry,
  listMyInquiries,
  listProducts,
  submitCustomerInquiry,
} from "../../services/api";

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({
    session: { access_token: "customer-token", user: { id: "customer-a" } },
    user: { id: "customer-a", role: "CUSTOMER" },
    loading: false,
  });
  listProducts.mockResolvedValue([]);
  listMyInquiries.mockResolvedValue([]);
});

afterEach(() => cleanup());

function renderPage(initialEntry = "/inquiries") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/inquiries" element={<CustomerInquiryPage />} />
        <Route path="/inquiries/:id" element={<CustomerInquiryDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CustomerInquiryPage", () => {
  it("renders the empty history state and submits a general inquiry", async () => {
    submitCustomerInquiry.mockResolvedValue({
      id: "inquiry-a",
      customerId: "customer-a",
      message: "Do you make custom bouquets?",
      productName: null,
      createdAt: "2026-11-22T10:00:00.000Z",
    });

    renderPage();

    expect(await screen.findByRole("heading", { name: "No inquiries yet" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Inquiry details"), {
      target: { value: "Do you make custom bouquets?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit inquiry" }));

    await waitFor(() => {
      expect(submitCustomerInquiry).toHaveBeenCalledWith({
        productId: null,
        message: "Do you make custom bouquets?",
      }, "customer-token");
    });
    expect(await screen.findByText("Inquiry submitted")).toBeInTheDocument();
    expect(screen.getAllByText("Do you make custom bouquets?")).toHaveLength(1);
  });

  it("shows validation for an empty message", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "No inquiries yet" });
    fireEvent.click(screen.getByRole("button", { name: "Submit inquiry" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please enter your inquiry.");
  });

  it("includes a valid catalogue product reference selected from the catalogue", async () => {
    listProducts.mockResolvedValue([{
      id: "product-a",
      name: "Crochet rose",
      basePrice: 1250,
    }]);
    submitCustomerInquiry.mockResolvedValue({
      id: "inquiry-b",
      customerId: "customer-a",
      message: "Is this available in pink?",
      productName: "Crochet rose",
      createdAt: "2026-11-22T10:00:00.000Z",
    });

    renderPage("/inquiries?productId=product-a");

    expect(await screen.findByText("Crochet rose")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Inquiry details"), {
      target: { value: "Is this available in pink?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit inquiry" }));

    await waitFor(() => {
      expect(submitCustomerInquiry).toHaveBeenCalledWith({
        productId: "product-a",
        message: "Is this available in pink?",
      }, "customer-token");
    });
  });

  it("shows a backend submission failure", async () => {
    submitCustomerInquiry.mockRejectedValue(new Error("Inquiry service unavailable."));
    renderPage();
    await screen.findByRole("heading", { name: "No inquiries yet" });
    fireEvent.change(screen.getByLabelText("Inquiry details"), {
      target: { value: "Please advise." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit inquiry" }));
    expect(await screen.findByText("Inquiry service unavailable.")).toBeInTheDocument();
  });

  it("rejects an overlong inquiry before sending it and preserves the message", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "No inquiries yet" });
    const message = "x".repeat(5001);
    const field = screen.getByLabelText("Inquiry details");
    fireEvent.change(field, { target: { value: message } });
    fireEvent.click(screen.getByRole("button", { name: "Submit inquiry" }));

    expect(await screen.findByText("Please keep your inquiry to 5,000 characters or fewer."))
      .toBeInTheDocument();
    expect(field).toHaveValue(message);
    expect(submitCustomerInquiry).not.toHaveBeenCalled();
  });

  it("prevents repeated submission while the first request is pending", async () => {
    let resolveSubmission;
    submitCustomerInquiry.mockReturnValue(new Promise((resolve) => {
      resolveSubmission = resolve;
    }));
    renderPage();
    await screen.findByRole("heading", { name: "No inquiries yet" });
    fireEvent.change(screen.getByLabelText("Inquiry details"), {
      target: { value: "Please confirm customization availability." },
    });
    const submitButton = screen.getByRole("button", { name: "Submit inquiry" });

    fireEvent.click(submitButton);
    expect(submitButton).toBeDisabled();
    fireEvent.click(submitButton);
    expect(submitCustomerInquiry).toHaveBeenCalledTimes(1);

    await act(async () => resolveSubmission({
      id: "inquiry-a",
      message: "Please confirm customization availability.",
      productName: null,
      createdAt: "2026-11-22T10:00:00.000Z",
    }));
    expect(await screen.findByText("Inquiry submitted")).toBeInTheDocument();
  });

  it("navigates to inquiry details and back through the owned-detail API", async () => {
    listMyInquiries.mockResolvedValue([{
      id: "inquiry-a",
      message: "Is this available in lavender?",
      productName: null,
      createdAt: "2026-11-22T10:00:00.000Z",
    }]);
    getMyInquiry.mockResolvedValue({
      id: "inquiry-a",
      customerId: "customer-a",
      message: "Is this available in lavender?",
      productName: null,
      createdAt: "2026-11-22T10:00:00.000Z",
    });

    renderPage();
    await screen.findByText("Is this available in lavender?");
    expect(screen.getByText("Reference inquiry-a")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "View Details" }));

    expect(await screen.findByRole("heading", { name: "Inquiry details" })).toBeInTheDocument();
    expect(getMyInquiry).toHaveBeenCalledWith("inquiry-a", "customer-token");
    expect(screen.getByText("Reference inquiry-a")).toBeInTheDocument();
    expect(screen.getByText("No linked product")).toBeInTheDocument();
    expect(screen.getByText("Is this available in lavender?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Back to my inquiries" }));
    expect(await screen.findByRole("heading", { name: "My inquiries", level: 1 })).toBeInTheDocument();
    expect(await screen.findByText("Is this available in lavender?")).toBeInTheDocument();
  });

  it("shows a linked product in inquiry details", async () => {
    getMyInquiry.mockResolvedValue({
      id: "inquiry-linked",
      message: "Is this available in lavender?",
      productName: "Crochet rose",
      createdAt: "2026-11-22T10:00:00.000Z",
    });

    renderPage("/inquiries/inquiry-linked");

    expect(await screen.findByText("Crochet rose")).toBeInTheDocument();
    expect(screen.getByText("Is this available in lavender?")).toBeInTheDocument();
  });

  it("shows history loading and does not show a false empty state", async () => {
    let resolveHistory;
    listMyInquiries.mockReturnValue(new Promise((resolve) => {
      resolveHistory = resolve;
    }));

    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Loading your inquiries");
    expect(screen.queryByRole("heading", { name: "No inquiries yet" })).not.toBeInTheDocument();

    await act(async () => resolveHistory([]));
    expect(await screen.findByRole("heading", { name: "No inquiries yet" })).toBeInTheDocument();
  });

  it("shows history failure and allows retry without presenting it as empty", async () => {
    listMyInquiries
      .mockRejectedValueOnce(new Error("Inquiry service unavailable."))
      .mockResolvedValueOnce([{
        id: "inquiry-retry",
        message: "Please advise.",
        productName: null,
        createdAt: "2026-11-22T10:00:00.000Z",
      }]);

    renderPage();

    expect(await screen.findByText("Your inquiry history could not be loaded. Inquiry service unavailable."))
      .toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "No inquiries yet" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Please advise.")).toBeInTheDocument();
  });

  it("keeps inquiry history available when catalogue loading fails", async () => {
    listProducts.mockRejectedValue(new Error("Catalogue service unavailable."));
    listMyInquiries.mockResolvedValue([{
      id: "inquiry-history",
      message: "Please advise.",
      productName: null,
      createdAt: "2026-11-22T10:00:00.000Z",
    }]);

    renderPage();

    expect(await screen.findByText("Please advise.")).toBeInTheDocument();
    expect(screen.getByText("Catalogue service unavailable.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "No inquiries yet" })).not.toBeInTheDocument();
  });

  it("shows inquiry detail loading and retries a failed detail request", async () => {
    getMyInquiry
      .mockRejectedValueOnce(new Error("Inquiry service unavailable."))
      .mockResolvedValueOnce({
        id: "inquiry-retry",
        message: "Please advise.",
        productName: null,
        createdAt: "2026-11-22T10:00:00.000Z",
      });

    renderPage("/inquiries/inquiry-retry");

    expect(screen.getByRole("status")).toHaveTextContent("Loading inquiry details");
    expect(await screen.findByText("Inquiry service unavailable.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Please advise.")).toBeInTheDocument();
  });
});
