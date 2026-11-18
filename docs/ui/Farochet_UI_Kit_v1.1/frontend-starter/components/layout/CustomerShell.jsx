import React from "react";
import CustomerHeader from "./CustomerHeader";
import CustomerFooter from "./CustomerFooter";

export default function CustomerShell({ children, headerProps, footerProps }) {
  return (
    <div className="faro-customer-shell">
      <CustomerHeader {...headerProps} />
      <main>{children}</main>
      <CustomerFooter {...footerProps} />
    </div>
  );
}
