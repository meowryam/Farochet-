import { BrowserRouter, Route, Routes } from "react-router-dom";
import BootstrapStatusPage from "./pages/BootstrapStatusPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<BootstrapStatusPage />} />
      </Routes>
    </BrowserRouter>
  );
}
