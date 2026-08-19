import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import PCBuilder from "./pages/PCBuilder";
import Compare from "./pages/Compare";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import RepairCenter from "./pages/RepairCenter";
import Advisor from "./pages/Advisor";
import VendorDashboard from "./pages/VendorDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuthStore } from "./lib/authStore";

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/marketplace" element={<Marketplace group="tech" />} />
        <Route path="/local" element={<Marketplace group="grocery" />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/pc-builder" element={<PCBuilder />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/advisor" element={<Advisor />} />
        <Route path="/repair" element={<RepairCenter />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}
