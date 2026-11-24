import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/layout/RequireAuth";
import ProductManagementPage from "./features/catalogue/ProductManagementPage";
import InquiryManagementPage from "./features/inquiries/InquiryManagementPage";
import OrderManagementPage from "./features/orders/OrderManagementPage";
import CustomerOrdersPage from "./features/orders/CustomerOrdersPage";
import CustomizationRequestPage from "./features/customization/CustomizationRequestPage";
import CustomizationReviewPage from "./features/customization/CustomizationReviewPage";
import CustomerNegotiationPage from "./features/customization/CustomerNegotiationPage";
import AvailabilityManagementPage from "./features/availability/AvailabilityManagementPage";
import AvailabilityPage from "./features/availability/AvailabilityPage";
import BootstrapStatusPage from "./pages/BootstrapStatusPage";
import CustomerAccountPage from "./pages/CustomerAccountPage";
import CustomerRegistrationPage from "./pages/CustomerRegistrationPage";
import SignInPage from "./pages/SignInPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import CustomerCataloguePage from "./features/catalogue/CustomerCataloguePage";
import CustomerWishlistPage from "./features/wishlist/CustomerWishlistPage";
import CustomerInquiryPage from "./features/inquiries/CustomerInquiryPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/register" element={<CustomerRegistrationPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/admin/sign-in" element={<SignInPage adminOnly />} />
          <Route
            path="/admin"
            element={<RequireAuth roles={["RAAZIA"]}><Navigate to="/admin/products" replace /></RequireAuth>}
          />
          <Route
            path="/admin/products"
            element={<RequireAuth roles={["RAAZIA"]}><ProductManagementPage /></RequireAuth>}
          />
          <Route
            path="/admin/availability"
            element={<RequireAuth roles={["RAAZIA"]}><AvailabilityManagementPage /></RequireAuth>}
          />
          <Route
            path="/admin/inquiries"
            element={<RequireAuth roles={["RAAZIA"]}><InquiryManagementPage /></RequireAuth>}
          />
          <Route
            path="/admin/customization-requests"
            element={<RequireAuth roles={["RAAZIA"]}><CustomizationReviewPage /></RequireAuth>}
          />
          <Route
            path="/admin/orders"
            element={<RequireAuth roles={["RAAZIA"]}><OrderManagementPage /></RequireAuth>}
          />
          <Route
            path="/customization/request"
            element={<RequireAuth roles={["CUSTOMER"]}><CustomizationRequestPage /></RequireAuth>}
          />
          <Route
            path="/customization/requests/:id/negotiation"
            element={<RequireAuth roles={["CUSTOMER"]}><CustomerNegotiationPage /></RequireAuth>}
          />
          <Route path="/orders" element={<CustomerOrdersPage />} />
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/" element={<CustomerCataloguePage />} />
          <Route path="/catalogue" element={<CustomerCataloguePage />} />
          <Route
            path="/customer"
            element={<Navigate to="/account" replace />}
          />
          <Route
            path="/account"
            element={<RequireAuth roles={["CUSTOMER"]}><CustomerAccountPage /></RequireAuth>}
          />
          <Route
            path="/wishlist"
            element={<RequireAuth roles={["CUSTOMER"]}><CustomerWishlistPage /></RequireAuth>}
          />
          <Route
            path="/inquiries"
            element={<RequireAuth roles={["CUSTOMER"]}><CustomerInquiryPage /></RequireAuth>}
          />
          <Route path="*" element={<BootstrapStatusPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
