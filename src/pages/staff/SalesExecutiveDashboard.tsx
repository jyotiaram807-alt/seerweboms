import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { Product,Order, OrderStatus, Retailer , Staff} from "@/types";
import { apiUrl } from "@/url";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Minus, Trash2, Phone, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Sidebar from "@/components/Sidebar";


const SalesExecutiveDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { cart, clearCart, updateQuantity, removeFromCart, } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [filteredRetailers, setFilteredRetailers] = useState<Retailer[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string>("retailers");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [isOrderConfirmOpen, setIsOrderConfirmOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTabForOrder, setActiveTabForOrder] = useState<string>("all");

  const handleQuantityChange = (productId: string, change: number, currentQty: number) => {
    const newQty = currentQty + change;
    if (newQty >= 1) {
      updateQuantity(productId, newQty);
    }
  };

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


  const handleRetailerSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredRetailers(retailers);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = retailers.filter(
      r =>
        r.name?.toLowerCase().includes(lowerQuery) ||
        r.address?.toLowerCase().includes(lowerQuery) ||
        r.phone?.toLowerCase().includes(lowerQuery) ||
        r.store_name?.toLowerCase().includes(lowerQuery)
    );
    setFilteredRetailers(filtered);
  };

  // 🛒 Fetch product catalog
  useEffect(() => {
  if (!user?.dealer_id) return;

  const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Unauthorized: Token not found");
          return;
        }

        const response = await fetch(`${apiUrl}/products?dealerid=${user.dealer_id}`, {
          headers: {
            "Authorization": `Bearer ${token}`, // ✅ Secure JWT
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();
        const formatted = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          model: p.model,
          price: Number(p.price),
          stock: p.stock,
          description: p.description,
          dealerid: p.dealerid,
          created_at: p.created_at,
        }));

        setProducts(formatted);
        setFilteredProducts(formatted);
      } catch (err) {
        console.error("Products fetch error:", err);
      }
    };

    fetchProducts();
  }, [user?.dealer_id]);


  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }
    const q = query.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q)
    );
    setFilteredProducts(filtered);
  };

  const handlePlaceOrder = async () => {
    if (!selectedRetailer) return alert("Select a Cutomer first!");
    if (cart.items.length === 0) return alert("Cart is empty!");

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          retailerId: selectedRetailer.id,
          retailerName: selectedRetailer.name,
          dealerId: user?.dealer_id,
          order_by: user?.role,
          order_by_id: user?.id,
          total: cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
          notes: notes || "",
          items: cart.items.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
            price: i.product.price,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit order");
      const response = await res.json();
      console.log("Order created:", response);
      clearCart();
      setIsOrderConfirmOpen(false);
      setNotes("");
      toast.success("Order submitted successfully!");
      navigate("/staff/sales_report");
    } catch (err) {
      console.error("Order submission error:", err);
      toast.error("Failed to submit order.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <div className="flex-1 ml-64 flex flex-col">
          <Navbar />
        <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {isMobile ? (
                  <ScrollArea className="w-full pb-2">
                    <TabsList className="flex w-max">
                      <TabsTrigger value="retailers">Customers</TabsTrigger>
                      <TabsTrigger value="order">Create Order</TabsTrigger>
                    </TabsList>
                  </ScrollArea>
                ) : (
                  <TabsList className="mb-4">
                    <TabsTrigger value="retailers">Customers</TabsTrigger>
                    <TabsTrigger value="order">Create Order</TabsTrigger>
                  </TabsList>
                )}

                {/* 2️⃣ RETAILERS LIST */}

                <TabsContent value="retailers">
                  <h2 className="text-2xl font-bold mb-4">Customers</h2>

                  {/* 🔍 Search bar */}
                  <SearchBar onSearch={handleRetailerSearch} />

                  {/* 🧱 Retailer cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredRetailers.map((r) => (
                      <Card
                        key={r.id}
                        onClick={() => setSelectedRetailer(r)}
                        className={`relative p-4 cursor-pointer transition ${
                          selectedRetailer?.id === r.id
                            ? "border-blue-500 shadow-lg"
                            : "hover:shadow"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          {/* Retailer details */}
                          <div>
                            <p className="font-semibold">{r.store_name}</p>
                            <p className="text-sm text-gray-500">
                              {r.name} ({r.phone})
                            </p>
                            <p className="text-sm text-gray-500">{r.address}</p>
                          </div>

                          {/* Icons section */}
                          <div className="flex items-center space-x-2">
                            {/* 📞 Call icon — visible only on mobile */}
                            <a
                              href={`tel:${r.phone}`}
                              onClick={(e) => e.stopPropagation()} // prevent selecting retailer
                              className="sm:hidden flex items-center justify-center bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition"
                            >
                              <Phone size={18} />
                            </a>

                            {/* 📍 Directions icon — open Google Maps */}
                            <a
                              href={`https://www.google.com/maps?q=${encodeURIComponent(r.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()} // prevent selecting retailer
                              className="flex items-center justify-center bg-green-500 text-white rounded-full p-2 hover:bg-green-600 transition"
                            >
                              <MapPin size={18} />
                            </a>
                          </div>
                        </div>
                      </Card>

                    ))}
                  </div>
                </TabsContent>

                {/* 3️⃣ ORDER CREATION (PRODUCT LIST + CART) */}
                <TabsContent value="order">
                  <h2 className="text-2xl font-bold mb-4">Create Order</h2>

                  {!selectedRetailer ? (
                    <p className="text-red-500 mb-6">
                      Please select a customer from the "Customers" tab first.
                    </p>
                  ) : (
                    <div className="mb-6 bg-white p-4 rounded-md shadow-sm">
                      <h3 className="font-semibold text-lg">Customer: {selectedRetailer.store_name}</h3>
                      <p className="text-gray-500 text-sm">{selectedRetailer.city}</p>
                    </div>
                  )}

                  <SearchBar onSearch={handleSearch} />

                  {/* Product List */}
                  <div className="flex flex-col space-y-2 mt-4">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))
                    ) : (
                      <p className="text-center py-8 text-gray-500">
                        No products found.
                      </p>
                    )}
                  </div>

                  {/* Cart Summary */}
                  {cart.items.length > 0 && (
                  
                  <Card
                    id="executive-cart"
                    className="mt-6 p-4 shadow-md bg-white w-full md:w-1/2"
                  >
                    <h3 className="text-xl font-bold mb-3">Cart Summary</h3>
                    <ul className="divide-y divide-gray-200 mb-4">
                      {cart.items.map((item) => (
                        <li key={item.product.id} className="py-2 flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <span>{item.product.name}</span>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleQuantityChange(item.product.id, -1, item.quantity)}
                                className="p-1 border rounded hover:bg-gray-100"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-2">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(item.product.id, 1, item.quantity)}
                                className="p-1 border rounded hover:bg-gray-100"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <span>
                              ₹
                              {(item.product.price * item.quantity).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total</span>
                      <span>
                        ₹
                        {cart.items
                          .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
                          .toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </span>
                    </div>

                    <Button
                      onClick={() => setIsOrderConfirmOpen(true)}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Place Order
                    </Button>
                  </Card>

                  )}
                </TabsContent>
                
              </Tabs>
              <Dialog open={isOrderConfirmOpen} onOpenChange={setIsOrderConfirmOpen}>
              <DialogContent className="w-[90%] sm:w-[80%] md:w-[70%] lg:w-[50%] max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Confirm Order</DialogTitle>
                  <DialogDescription>
                    Review your order details before submitting.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <h3 className="font-medium">Order Items</h3>
                    <div className="text-sm space-y-1">
                      {cart.items.map((item) => (
                        <div key={item.product.id} className="flex justify-between">
                          <span>{item.product.name} x {item.quantity}</span>
                          <span>₹{(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Order Notes (Optional)
                    </label>
                    <Textarea
                      id="notes"
                      placeholder="Add any special instructions or notes here..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="h-24"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOrderConfirmOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Order"}
                  </Button>
                </DialogFooter>
              </DialogContent>
              </Dialog>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SalesExecutiveDashboard;