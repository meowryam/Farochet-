import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminShell from "./AdminShell";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

function renderAdminShell() {
  return render(
    <MemoryRouter initialEntries={["/admin/products"]}>
      <AdminShell activeKey="products">
        <h1>Product Management</h1>
      </AdminShell>
    </MemoryRouter>,
  );
}

describe("AdminShell navigation drawer", () => {
  it("opens the shared Admin navigation and marks the active route", () => {
    renderAdminShell();
    const toggle = screen.getByRole("button", { name: "Open admin navigation" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);

    const dialog = screen.getByRole("dialog", { name: "Admin navigation" });
    const navigation = within(dialog).getByRole("navigation", { name: "Admin navigation" });
    expect(within(navigation).getByRole("link", { name: "Product Management" }))
      .toHaveAttribute("aria-current", "page");
    expect(within(navigation).getByRole("link", { name: "Customer Inquiries" }))
      .toHaveAttribute("href", "/admin/inquiries");
    expect(within(navigation).getAllByRole("link")).toHaveLength(5);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("traps focus, closes with Escape, restores focus, and unlocks page scrolling", () => {
    renderAdminShell();
    const toggle = screen.getByRole("button", { name: "Open admin navigation" });
    fireEvent.click(toggle);

    const dialog = screen.getByRole("dialog", { name: "Admin navigation" });
    const brandLink = within(dialog).getByRole("link", { name: "Farochet home" });
    brandLink.focus();
    fireEvent.keyDown(brandLink, { key: "Tab", shiftKey: true });

    expect(within(dialog).getByRole("link", { name: "Confirmed Orders" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Admin navigation" })).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes when the backdrop or drawer close control is activated", () => {
    renderAdminShell();
    fireEvent.click(screen.getByRole("button", { name: "Open admin navigation" }));
    fireEvent.click(document.querySelector(".faro-admin__backdrop"));
    expect(screen.queryByRole("dialog", { name: "Admin navigation" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open admin navigation" }));
    const dialog = screen.getByRole("dialog", { name: "Admin navigation" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close admin navigation" }));
    expect(screen.queryByRole("dialog", { name: "Admin navigation" })).not.toBeInTheDocument();
  });
});
