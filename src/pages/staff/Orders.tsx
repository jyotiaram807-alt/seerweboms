import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Product, Retailer, Staff } from "@/types";
import { apiUrl } from "@/url";
import { useIsMobile } from "@/hooks/use-mobile";
import OrdersList from "@/components/OrdersList";
import Sidebar from "@/components/Sidebar";

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [filteredRetailers, setFilteredRetailers] = useState<Retailer[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTabForOrder, setActiveTabForOrder] = useState<string>("all");
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/"); return; }
    if (user?.role !== "staff") { navigate("/dealer"); return; }
  }, [isAuthenticated, user, navigate]);

  // ✅ Fixed: executiveid (not executive_id)
  useEffect(() => {
    if (!user?.id) return;
    const fetchRetailers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch(
          `${apiUrl}/staff/get_retailers_by_executive?executiveid=${user.id}`,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
        if (!response.ok) throw new Error("Failed to fetch retailers");
        const data = await response.json();
        setRetailers(data);
        setFilteredRetailers(data);
      } catch (err) {
        console.error("Retailers fetch error:", err);
      }
    };
    fetchRetailers();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${apiUrl}/orders/byexecutive?executiveid=${user.id}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        if (isMounted) { setOrders(data); setFilteredOrders(data); }
      } catch (err) {
        console.error("Orders fetch error:", err);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [user?.id]);

  useEffect(() => {
    const filtered = activeTabForOrder === "all"
      ? orders
      : orders.filter(o => o.status === activeTabForOrder);
    setFilteredOrders(filtered);
  }, [orders, activeTabForOrder]);

  return (
    // ✅ Consistent layout with bg-gray-50
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="w-64 fixed top-0 left-0 h-full z-10">
        <Sidebar />
      </div>

      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />

        {/* ✅ pt-16 so content doesn't hide behind fixed Navbar */}
        <div className="flex-1 overflow-y-auto pt-16">
          <div className="container mx-auto px-4 py-6">

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
              <p className="text-gray-500 text-sm mt-1">Your orders and performance summary</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 md:p-6">
                <OrdersList
                  orders={filteredOrders}
                  highlightNew={activeTabForOrder === "pending" || activeTabForOrder === "all"}
                  retailers={retailers}
                  staff={filteredStaff}
                />
                {filteredOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No orders found.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
