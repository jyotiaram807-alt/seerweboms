import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import OrdersList from "@/components/OrdersList";
import { useAuth } from "@/context/AuthContext";
import { Order, OrderStatus } from "@/types";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { apiUrl } from "@/url";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [dealerCount, setDealerCount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    } else if (user?.role !== "admin") {
      navigate("/dealer");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const fetchDealerCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiUrl}/dealers/count`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,   // ✅ attach JWT
              "Content-Type": "application/json"
            }
          }
        );
        const data = await response.json();
        setDealerCount(data.total); // 'total' returned by DealerCountController
      } catch (error) {
        console.error("Failed to fetch dealer count:", error);
        toast.error("Failed to fetch dealer count");
      }
    };
  
    fetchDealerCount();
  }, []);
  

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 py-6">
        <div className="container mx-auto px-1 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Link to="/admin/dealers" className="w-full cursor-pointer">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dealers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealerCount}</div>
          </CardContent>
        </Card>
      </Link>
        
        {/* Add more summary cards here */}
      </div>

      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">No recent activity to display.</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

