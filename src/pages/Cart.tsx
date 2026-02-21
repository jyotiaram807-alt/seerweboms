
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiUrl } from "@/url";
import Sidebar from "@/components/Sidebar";

const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState("");
  const [isOrderConfirmOpen, setIsOrderConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();


  const handleQuantityChange = (
    productId: string,
    change: number,
    currentQty: number
  ) => {
    const newQty = currentQty + change;
    if (newQty >= 1) {
      updateQuantity(productId, newQty);
    }
  };

  const handleCheckout = () => {
    setIsOrderConfirmOpen(true);
  };

  const handleSubmitOrder = async () => {
    if (!user || !cart.items.length) return;
  
    setIsSubmitting(true);

    console.log("User object before order submit:", user);
  
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/orders`, {
        method: "POST", 
        headers: {
          "Authorization": `Bearer ${token}`,   // ✅ attach JWT
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          retailerId: user.id,
          retailerName: user.name,
          dealerId: user.dealer_id, // assuming all cart items are from same dealer
          total: cart.total,
          notes: notes || "",
          order_by: user?.role,
          order_by_id: user?.id,
          items: cart.items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
        }),
      });
  
      if (!res.ok) throw new Error("Failed to submit order");
  
      // Optional: You could show a confirmation from the backend
      const response = await res.json();
      console.log("Order created:", response);
  
      clearCart(); // clear the cart after successful order
      setIsOrderConfirmOpen(false);
      toast.success("Order submitted successfully!");
      if (user?.role === "staff") {
      navigate("/staff");
    } else if (user?.role === "retailer") {
      navigate("/orders");
    } else {
      navigate("/"); // fallback if role is missing
    }
    } catch (error) {
      toast.error("Failed to submit order.");
      console.error("Order submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
  <div className="flex h-screen overflow-hidden">
    {/* Sidebar */}
    <div className="w-64 fixed top-0 left-0 h-full">
      <Sidebar />
    </div>

    {/* Main Content Area */}
    <div className="flex-1 ml-64 flex flex-col">
      <Navbar />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 mt-4 mb-6">
          {/* Page Header */}
          <p className="text-gray-600 text-lg mb-6">Review your items before checkout</p>

          {/* Cart Items or Empty Message */}
          {cart.items.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items Section */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 sm:p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Cart Items ({cart.items.length})
                    </h2>

                    <div className="space-y-4">
                      {cart.items.map((item) => (
                        <div key={item.product.id} className="py-4 border-b last:border-b-0">
                          {isMobile ? (
                            // ✅ Mobile layout
                            <div className="flex flex-col space-y-3">
                              <div>
                                <h3 className="font-medium">{item.product.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {item.product.brand} | {item.product.price.toFixed(2)}
                                </p>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(item.product.id, -1, item.quantity)
                                    }
                                    className="quantity-btn"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(item.product.id, 1, item.quantity)
                                    }
                                    className="quantity-btn"
                                    disabled={item.quantity >= item.product.stock}
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>

                                <div className="flex items-center space-x-3">
                                  <span className="font-semibold">
                                    {(item.product.price * item.quantity).toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => removeFromCart(item.product.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // ✅ Desktop layout
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <h3 className="font-medium">{item.product.name}</h3>
                                  <p className="text-sm text-gray-500">
                                    {item.product.brand} | {item.product.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(item.product.id, -1, item.quantity)
                                    }
                                    className="quantity-btn"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(item.product.id, 1, item.quantity)
                                    }
                                    className="quantity-btn"
                                    disabled={item.quantity >= item.product.stock}
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                                <div className="text-lg font-semibold w-20 text-right">
                                  {(item.product.price * item.quantity).toFixed(2)}
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary Section */}
              <div>
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 sm:p-6">
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>
                          Items (
                          {cart.items.reduce((total, item) => total + item.quantity, 0)}):
                        </span>
                        <span>{cart.total.toFixed(2)}</span>
                      </div>

                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total:</span>
                          <span>{cart.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      className="w-full mt-6 bg-royal hover:bg-royal-dark"
                    >
                      Checkout
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // ✅ Empty Cart Message
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">
                Add products to your cart to place an order.
              </p>
              <Button
                onClick={() => {
                  if (user?.role === "staff") {
                    navigate("/staff");
                  } else if (user?.role === "retailer") {
                    navigate("/home");
                  } else {
                    navigate("/"); // fallback
                  }
                }}
                className="bg-royal hover:bg-royal-dark"
              >
                Continue Shopping
              </Button>
            </div>
          )}
        </div>

        {/* ✅ Order Confirmation Dialog */}
        <Dialog open={isOrderConfirmOpen} onOpenChange={setIsOrderConfirmOpen}>
          <DialogContent className="sm:max-w-md">
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
                      <span>
                        {item.product.name} x {item.quantity}
                      </span>
                      <span>{(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{cart.total.toFixed(2)}</span>
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
                onClick={handleSubmitOrder}
                className="bg-royal hover:bg-royal-dark"
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
);

};

export default Cart;