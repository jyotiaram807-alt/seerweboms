import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

import Layout from "@/components/Layout"; // 🔥 Import Layout here

import Index from "./pages/Index";
import RetailerHome from "./pages/customer/RetailerHome";
import DealerDashboard from "./pages/dealer/DealerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Cart from "./pages/Cart";
import RetailerOrders from "./pages/customer/RetailerOrders";
import ManageProducts from "./pages/dealer/ManageProducts";
import ManageRetailers from "./pages/dealer/ManageRetailers";
import ManageDealers from "./pages/dealer/ManageDealers";
import NotFound from "./pages/NotFound";
import DealerStaff from "./pages/dealer/ManageStaff";
import SalesExecutiveDashboard from "./pages/staff/SalesExecutiveDashboard";
import TakeOrder from "./pages/dealer/TakeOrder";
import Orders from "./pages/staff/Orders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <Routes>
              {/* ❌ No layout for login */}
              <Route path="/" element={<Index />} />

              {/* ✅ Layout applied to all below pages */}
              <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
              <Route path="/home" element={<Layout><RetailerHome /></Layout>} />
              <Route path="/cart" element={<Layout><Cart/></Layout>} />
              <Route path="/dealer/takeorder" element={<Layout><TakeOrder/></Layout>} />
              <Route path="/orders" element={<Layout><RetailerOrders /></Layout>} />
              <Route path="/dealer" element={<Layout><DealerDashboard /></Layout>} />
              <Route path="/dealer/products" element={<Layout><ManageProducts /></Layout>} />
              <Route path="/admin/dealers" element={<Layout><ManageDealers /></Layout>} />
              <Route path="/dealer/retailers" element={<Layout><ManageRetailers /></Layout>} />
              <Route path="/dealer/staff" element={<Layout><DealerStaff /></Layout>} />
              <Route path="/staff" element={<Layout><SalesExecutiveDashboard /></Layout>} />
              <Route path="/staff/sales_report" element={<Layout><Orders /></Layout>} />

              {/* Not Found fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </TooltipProvider>
      </CartProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
