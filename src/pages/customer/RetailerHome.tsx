import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types";
import { apiUrl } from "@/url";
import Sidebar from "@/components/Sidebar";

const RetailerHome = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 🔹 Redirect logic first
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (user?.role !== "retailer") {
      navigate("/dealer");
      return;
    }

    if (!user?.dealer_id) return;

    // 🔹 Fetch products logic
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Please log in again.");
          return;
        }

        const res = await fetch(`${apiUrl}/products?dealerid=${user.dealer_id}`, {
          headers: {
            "Authorization": `Bearer ${token}`, // ✅ Secure token
            "Content-Type": "application/json",
          },
        });

        if (res.status === 401 || res.status === 403) {
          console.error("Unauthorized access. Token may be invalid or expired.");
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();

        const formattedProducts: Product[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          model: item.model,
          price: Number(item.price),
          stock: item.stock,
          description: item.description,
          dealerid: item.dealerid,
          created_at: item.created_at,
          image: item.image || null,
        }));

        setProducts(formattedProducts);
        setFilteredProducts(formattedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, [isAuthenticated, user?.dealer_id, user?.role, navigate]);

  // 🔹 Search filter
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.brand.toLowerCase().includes(lowerQuery) ||
        product.model.toLowerCase().includes(lowerQuery)
    );
    setFilteredProducts(filtered);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 fixed top-0 left-0 h-full">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 mt-4 mb-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-gray-600 text-lg">
                  Add phones to your cart for bulk ordering
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <SearchBar onSearch={handleSearch} />
            </div>

            {/* Product List */}
            <div className="flex flex-col space-y-2">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No products found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetailerHome;
