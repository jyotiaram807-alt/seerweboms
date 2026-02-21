import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { Product, Retailer , Staff} from "@/types";
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
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string>("retailers");
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTabForOrder, setActiveTabForOrder] = useState<string>("all");
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);


  // 🔐 Auth protection
  useEffect(() => {
      if (!isAuthenticated) {
        navigate("/");
        return;
      }
      if (user?.role !== "staff") {
        navigate("/dealer");
        return;
      }
  }, [isAuthenticated, user, navigate]);

  // 📦 Fetch retailers for this executive
 useEffect(() => {
    if (!user?.id) return;

    const fetchRetailers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Unauthorized: Token not found");
          return;
        }

        const response = await fetch(
          `${apiUrl}/staff/get_retailers_by_executive?executive_id=${user.id}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`, // ✅ Secure JWT
              "Content-Type": "application/json",
            },
          }
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



  // ✅ Fetch orders for this executive
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true; // prevent state update if component unmounted
    const token = localStorage.getItem("jwt");

    const fetchOrders = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/orders/byexecutive?executiveid=${user.id}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch orders");

        const data = await res.json();
        if (isMounted) {
          setOrders(data);
          setFilteredOrders(data);
        }
      } catch (err) {
        console.error("Orders fetch error:", err);
      }
    };

    fetchOrders(); // initial fetch

    // Poll every 10 seconds
    const interval = setInterval(fetchOrders, 10000);

    return () => {
      isMounted = false;
            clearInterval(interval);
            };
        }, [user?.id]);

        useEffect(() => {
            const filtered = activeTabForOrder === "all"
            ? orders
            : orders.filter(o => o.status === activeTabForOrder);
            setFilteredOrders(filtered);
    }, [orders, activeTabForOrder]);

  return (
    <div className="flex h-screen overflow-hidden">
        <div className="w-64 fixed top-0 left-0 h-full">
          <Sidebar />
        </div>

        <div className="flex-1 ml-64 flex flex-col mb-4">
          <Navbar />
            <div className="flex-1 overflow-y-auto ">
                <div className="container mx-auto px-4 mt-4">
                  <p className="text-gray-500 mb-6">
                    Reports and analytics will be displayed here.
                  </p>

                    <div className="bg-white rounded-lg shadow">
                        <div className="p-3 md:p-6">
                            <OrdersList 
                                orders={filteredOrders}  
                                highlightNew={activeTab === "pending" || activeTab === "all"}
                                retailers={retailers}
                                staff={filteredStaff}
                            />

                            {filteredOrders.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                No orders found matching your search.
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