import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import InquiryManagementPage from "./InquiryManagementPage";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ signOut: vi.fn() }),
}));

vi.mock("../../services/api", () => ({
  getAdminInquiry: vi.fn(),
  listAdminInquiries: vi.fn(),
}));

import { getAdminInquiry, listAdminInquiries } from "../../services/api";

const inquiry = {
  id: "inquiry-a",
  customerId: "customer-a",
  customerName: "Amina Example",
  customerEmail: "amina@example.test",
  message: "Could you make this in lavender?",
  productName: null,
  createdAt: "2026-11-23T10:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  listAdminInquiries.mockResolvedValue([inquiry]);
  getAdminInquiry.mockResolvedValue(inquiry);
});

afterEach(() => cleanup());

function renderPage() {
  return render(
    <MemoryRouter>
      <InquiryManagementPage />
    </MemoryRouter>,
  );
}

describe("InquiryManagementPage", () => {
  it("shows customer name, email and secondary ID in the list and details", async () => {
    renderPage();

    expect(await screen.findByText("Amina Example")).toBeInTheDocument();
    expect(screen.getByText("amina@example.test")).toBeInTheDocument();
    expect(screen.getByText("Customer ID: customer-a")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View details" }));
    await waitFor(() => expect(screen.getAllByText("Amina Example")).toHaveLength(2));
    expect(screen.getAllByText("amina@example.test")).toHaveLength(2);
    expect(screen.getAllByText("Customer ID: customer-a")).toHaveLength(2);
  });

  it("shows clear fallbacks when customer profile fields are unavailable", async () => {
    listAdminInquiries.mockResolvedValue([{
      ...inquiry,
      customerName: null,
      customerEmail: null,
    }]);

    renderPage();

    expect(await screen.findByText("Name unavailable")).toBeInTheDocument();
    expect(screen.getByText("Email unavailable")).toBeInTheDocument();
    expect(screen.getByText("Customer ID: customer-a")).toBeInTheDocument();
  });
});
