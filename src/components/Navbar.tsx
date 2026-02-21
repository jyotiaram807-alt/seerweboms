import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false); // controlled dialog
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    // close dialog first (optional) then logout & navigate
    setLogoutDialogOpen(false);
    logout();
    navigate("/");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <nav className="bg-royal-light shadow-sm border-b border-gray-200">
      <nav className="fixed top-0 left-0 w-full bg-royal-light shadow-sm border-b border-gray-200 z-50" />
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-royal-dark truncate">
              Seerweb OMS
            </span>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
              {user?.role !== "dealer" && user?.role !== "admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9"
                  onClick={() => {
                    if (user?.role === "staff") {
                      const el = document.getElementById("executive-cart");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    } else {
                      navigate("/cart");
                    }
                  }}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cart.items.length > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {cart.items.length}
                    </span>
                  )}
                </Button>
              )}


            <button
              type="button"
              className="text-gray-500 hover:text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {user?.role !== "admin" && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => {
                  if (user?.role === "staff") {
                    const el = document.getElementById("executive-cart");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } else {
                    navigate("/cart");
                  }
                }}
              >
                <ShoppingCart className="h-6 w-6" />
                {cart.items.length > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {cart.items.length}
                  </span>
                )}
              </Button>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarFallback>{user.name ? getInitials(user.name) : "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>

                  <DropdownMenuSeparator />

                  {user.role === "admin" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="w-full">Home</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dealers" className="w-full">Manage Dealers</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {user.role === "dealer" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/dealer" className="w-full">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dealer/retailers" className="w-full">Manage Customers</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dealer/products" className="w-full">Manage Products</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dealer/staff" className="w-full">Manage Staff</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {user.role === "retailer" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/home" className="w-full">Home</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="w-full">My Orders</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* <--- IMPORTANT: just open dialog via state, don't use AlertDialogTrigger here ---> */}
                  <DropdownMenuItem
                    onClick={() => setLogoutDialogOpen(true)}
                    className="cursor-pointer"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {user?.role === "retailer" && (
              <>
                <Link to="/home" className="block px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                <Link to="/cart" className="block px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  Cart {cart.items.length > 0 && `(${cart.items.length})`}
                </Link>
                <Link to="/orders" className="block px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
              </>
            )}

            {user?.role === "dealer" && (
              <>
                <Link to="/dealer" className="block px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link to="/dealer/retailers" className="block px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>Manage Customers</Link>
                <Link to="/dealer/products" className="block px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>Manage Products</Link>
              </>
            )}

            {/* mobile logout: close menu then open confirm dialog */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setLogoutDialogOpen(true);
              }}
              className="w-full text-left px-3 py-2 text-base font-medium hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Controlled AlertDialog (single instance for both desktop & mobile) */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="w-[90%] sm:w-[80%] md:w-[70%] lg:w-[40%] max-w-2xl rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to log out from your account?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLogoutDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleLogout();
              }}
            >
              Yes, Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
};

export default Navbar;
