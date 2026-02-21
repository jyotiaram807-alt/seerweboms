import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const Sidebar = () => {
  const { user, logout } = useAuth()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation() // <-- get current path

  const handleLogout = () => {
    setLogoutDialogOpen(false)
    logout()
    navigate("/")
  }

  const getLinkClasses = (path: string) => {
    const base = "block px-3 py-2 text-white rounded hover:bg-gray-500 transition-colors"
    return location.pathname === path
      ? `${base} bg-royal-dark text-white font-semibold`
      : `${base} text-gray-800`
  }

  return (
    <aside className="w-64 bg-royal-light border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-4">
        <p className="text-lg text-white text-bold capitalize">Welcome {user?.name}</p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {user?.role === "admin" && (
          <>
            <Link to="/admin" className={getLinkClasses("/admin")}>Home</Link>
            <Link to="/admin/dealers" className={getLinkClasses("/admin/dealers")}>Manage Dealers</Link>
          </>
        )}

        {user?.role === "dealer" && (
          <>
            <Link to="/dealer" className={getLinkClasses("/dealer")}>Dashboard</Link>
            <Link to="/dealer/retailers" className={getLinkClasses("/dealer/retailers")}>Manage Customers</Link>
            <Link to="/dealer/products" className={getLinkClasses("/dealer/products")}>Manage Products</Link>
            <Link to="/dealer/staff" className={getLinkClasses("/dealer/staff")}>Manage Staff</Link>
            <Link to="/dealer/takeorder" className={getLinkClasses("/dealer/takeorder")}>Create Order</Link>
          </>
        )}

        {user?.role === "retailer" && (
          <>
            <Link to="/home" className={getLinkClasses("/home")}>Home</Link>
            <Link to="/orders" className={getLinkClasses("/orders")}>My Orders</Link>
          </>
        )}

        {user?.role === "staff" && (
          <>
            <Link to="/staff" className={getLinkClasses("/staff")}>Create Order</Link>
            <Link to="/staff/sales_report" className={getLinkClasses("/staff/sales_report")}>Sales Report</Link>
          </>
        )}
      </nav>

      <div className="p-2 border-t border-gray-200">
        <button
          onClick={() => setLogoutDialogOpen(true)}
          className="w-full text-left px-3 py-2 hover:bg-gray-400 rounded text-lg text-red-500 font-medium"
        >
          Logout
        </button>
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Yes, Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}

export default Sidebar