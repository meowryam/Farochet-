import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/layout/RequireAuth";
import ProductManagementPage from "./features/catalogue/ProductManagementPage";
import InquiryManagementPage from "./features/inquiries/InquiryManagementPage";
import OrderManagementPage from "./features/orders/OrderManagementPage";
import CustomerOrdersPage from "./features/orders/CustomerOrdersPage";
import AvailabilityManagementPage from "./features/availability/AvailabilityManagementPage";
import AvailabilityPage from "./features/availability/AvailabilityPage";
import BootstrapStatusPage from "./pages/BootstrapStatusPage";
import CustomerAccountPage from "./pages/CustomerAccountPage";
import CustomerRegistrationPage from "./pages/CustomerRegistrationPage";
import SignInPage from "./pages/SignInPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
        <Route path="/admin/products" element={<ProductManagementPage />} />
        <Route path="/admin/inquiries" element={<InquiryManagementPage />} />
        <Route path="/admin/orders" element={<OrderManagementPage />} />
        <Route path="/orders" element={<CustomerOrdersPage />} />
        <Route path="*" element={<BootstrapStatusPage />} />
      </Routes>
    </BrowserRouter>
  );
}
