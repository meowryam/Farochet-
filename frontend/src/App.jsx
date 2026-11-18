import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProductManagementPage from "./features/catalogue/ProductManagementPage";
import InquiryManagementPage from "./features/inquiries/InquiryManagementPage";
import BootstrapStatusPage from "./pages/BootstrapStatusPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
        <Route path="/admin/products" element={<ProductManagementPage />} />
        <Route path="/admin/inquiries" element={<InquiryManagementPage />} />
        <Route path="*" element={<BootstrapStatusPage />} />
      </Routes>
    </BrowserRouter>
  );
}
