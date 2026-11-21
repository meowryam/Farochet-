import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AvailabilityPage from "./AvailabilityPage";

vi.mock("../../services/api", () => ({
  getPublicAvailability: vi.fn(),
}));

import { getPublicAvailability } from "../../services/api";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AvailabilityPage", () => {
  it("shows loading, then the latest availability", async () => {
    let resolveAvailability;
    getPublicAvailability.mockReturnValue(
      new Promise((resolve) => {
        resolveAvailability = resolve;
      }),
    );

    render(<AvailabilityPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading availability");

    resolveAvailability({
      id: "current",
      information: "Accepting new custom inquiries.",
      updatedAt: "2026-11-21T18:49:33.118Z",
    });

    await waitFor(() => {
      expect(screen.getByText("Accepting new custom inquiries.")).toBeInTheDocument();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the not-yet-provided state when no availability exists", async () => {
    getPublicAvailability.mockResolvedValue(null);

    render(<AvailabilityPage />);

    expect(await screen.findByText("Availability has not yet been provided.")).toBeInTheDocument();
  });

  it("shows an error when availability cannot be loaded", async () => {
    getPublicAvailability.mockRejectedValue(new Error("Could not load availability."));

    render(<AvailabilityPage />);

    expect(await screen.findByText("Could not load availability.")).toBeInTheDocument();
  });
});
