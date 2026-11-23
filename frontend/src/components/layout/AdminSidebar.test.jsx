import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AdminSidebar, { ADMIN_NAV_ITEMS } from "./AdminSidebar";

afterEach(() => cleanup());

describe("AdminSidebar", () => {
  it("renders descriptive navigation labels without changing their routes", () => {
    render(<AdminSidebar activeKey="inquiries" logoutHref={null} open />);
    const navigation = within(screen.getByRole("navigation", { name: "Admin navigation" }));

    expect(navigation.getByRole("link", { name: "Product Management" }))
      .toHaveAttribute("href", "/admin/products");
    expect(navigation.getByRole("link", { name: "Availability Management" }))
      .toHaveAttribute("href", "/admin/availability");
    expect(navigation.getByRole("link", { name: "Customer Inquiries" }))
      .toHaveAttribute("href", "/admin/inquiries");
    expect(navigation.getByRole("link", { name: "Customization Requests" }))
      .toHaveAttribute("href", "/admin/customization-requests");
    expect(navigation.getByRole("link", { name: "Confirmed Orders" }))
      .toHaveAttribute("href", "/admin/orders");
    expect(navigation.getByRole("link", { name: "Customer Inquiries" }))
      .toHaveAttribute("aria-current", "page");
    expect(navigation.getAllByRole("link")).toHaveLength(ADMIN_NAV_ITEMS.length);
  });
});
