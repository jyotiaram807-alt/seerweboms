import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import OrdersList from "@/components/OrdersList";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { apiUrl } from "@/url";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/Sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import {OrderStatus,Order, Retailer, Staff } from "@/types";
const DealerDashboard = () => {
const [orders, setOrders] = useState<Order[]>([]);
const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
const [activeTab, setActiveTab] = useState<string>("all");
const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
const { user, isAuthenticated } = useAuth();
const navigate = useNavigate();
const [retailers, setRetailers] = useState<Retailer[]>([]);
const [filteredRetailers, setFilteredRetailers] = useState<Retailer[]>([]);
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    } else if (user?.role !== "dealer") {
      navigate("/home");
    }
  }, [isAuthenticated, user, navigate]);
  // Load orders and check for new ones
  useEffect(() => {
  if (!user?.id) return;

  let isMounted = true;
  const token = localStorage.getItem("jwt");

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/orders/fordealer?dealerId=${user.id}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data: Order[] = await response.json();
      if (isMounted) setOrders(data); // update parent state
    } catch (error) {
      console.error("Order fetch error:", error);
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
    let isMounted = true;
    const token = localStorage.getItem("jwt");
    const fetchStaff = async () => {
      try {
        const response = await fetch(`${apiUrl}/staff?dealerid=${user?.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
       if(isMounted) setFilteredStaff(data);
      } catch (error) {
        console.error("Failed to fetch staff:", error);
      }
    };
    
      fetchStaff();
  }, []);
  
  useEffect(() => {
    const fetchRetailers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return;
        }

        const response = await fetch(`${apiUrl}/retailers?dealerid=${user?.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`, // ✅ Secure token
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401 || response.status === 403) {
          // Optional: you can trigger logout or redirect here
          return;
        }

        if (!response.ok) throw new Error("Failed to fetch retailers");

        const data = await response.json();
        setRetailers(data);
        setFilteredRetailers(data);
      } catch (error) {
        console.error("Failed to fetch retailers:", error);
      }
    };

    if (user?.id) {
      fetchRetailers();
    }
  }, [user?.id]);


  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredOrders(getFilteredOrders());
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = getFilteredOrders().filter(
      (order) =>
        order.id.toLowerCase().includes(lowerQuery) ||
        order.notes.toLowerCase().includes(lowerQuery) ||
        order.storeName.toLowerCase().includes(lowerQuery) ||
        order.total.toString().toLowerCase().includes(lowerQuery) ||
        order.retailerName.toLowerCase().includes(lowerQuery)
    );
    
    setFilteredOrders(filtered);
  };
          // or react-hot-toast

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: "PUT", // or "PATCH" depending on backend
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }), // send new status
      });
  
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
  
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );
  
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error("Status update failed:", error);
      toast.error("Failed to update order status");
    }
  };
          
  const getFilteredOrders = () => {
    if (activeTab === "all") {
      return orders;
    }
    return orders.filter((order) => order.status === activeTab);
  };

  const getStatusCount = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status).length;
  };

  // When tab changes, update filtered orders
  useEffect(() => {
    setFilteredOrders(getFilteredOrders());
  }, [activeTab]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 fixed top-0 left-0 h-full">
        <Sidebar />
      </div>

      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 mt-4">
            <div className="mb-8">
                <p className=" text-lg text-gray-800">Manage orders and track status</p>

                {newOrdersCount > 0 && (
                  <div className="mt-2 flex items-center text-amber-600">
                    <AlertTriangle size={16} className="mr-1" />
                    <span>You have {newOrdersCount} new order{newOrdersCount > 1 ? 's' : ''} pending for review</span>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className={newOrdersCount > 0 ? "border-yellow-400 shadow-md" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-500">
                    Pending Orders
                    {newOrdersCount > 0 && (
                      <Badge className="ml-2 bg-yellow-500">{getStatusCount("pending")}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getStatusCount("pending")}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-500">
                    Approved Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getStatusCount("approved")}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-500">
                    Dispatched Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getStatusCount("dispatched")}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-500">
                    Delivered Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getStatusCount("delivered")}</div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Order Management</h2>
                
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                  {/* Tabs and Search Bar Wrapper */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    {/* Scrollable TabsList on mobile */}
                    <div className="overflow-x-auto">
                      <TabsList className="flex gap-2 sm:gap-4 min-w-max">
                        <TabsTrigger value="all">
                          All Orders 
                          <span className="ml-1 text-xs">({orders.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="pending">
                          Pending
                          {newOrdersCount > 0 && (
                            <Badge variant="destructive" className="ml-1">{getStatusCount("pending")}</Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
                        <TabsTrigger value="delivered">Delivered</TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Search Bar positioned below tabs on small screens, side-by-side on larger */}
                    <div className="w-full sm:w-auto">
                      <SearchBar onSearch={handleSearch} />
                    </div>
                  </div>

                  <TabsContent value={activeTab}>
                    <OrdersList 
                      orders={filteredOrders} 
                      isAdmin 
                      onStatusChange={handleStatusChange} 
                      highlightNew={activeTab === "pending" || activeTab === "all"}
                      retailers={retailers}
                      staff={filteredStaff}
                    />

                    {filteredOrders.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No orders found matching your search.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerDashboard;