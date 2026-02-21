
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
// import { Product } from "@/types";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, FileUp, Upload } from "lucide-react";
import * as XLSX from 'xlsx';
import { apiUrl } from "@/url";
import Sidebar from "@/components/Sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpDown,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Sample products data (would be fetched from API in production)
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "iPhone 13",
    brand: "Apple",
    model: "iPhone 13",
    price: 799,
    stock: 15,
    description: "A15 Bionic chip, Super Retina XDR display",
    dealerid: 4
  }
];

interface Product {
  id: number;
  name: string;
  brand: string;
  model: string;
  price: number;
  stock: number;
  description: string;
  dealerid: number;
  created_at?: string;

  image?: string | null;  // ✅ Image URL returned from backend
}

type ProductFormData = {
  name: string;
  brand: string;
  model: string;
  price: string;
  stock: string;
  description: string;
  image: File | null;           // ✅ actual file to upload
  imagePreview: string | null;  // ✅ preview URL (string)
};

const emptyFormData: ProductFormData = {
  name: "",
  brand: "",
  model: "",
  price: "",
  stock: "",
  description: "",
  image: null,
  imagePreview: null,   // ✅ FIXED
};


const ManageProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [sortOrder, setSortProduct] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    } else if (user?.role !== "dealer") {
      navigate("/home");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${apiUrl}/products?dealerid=${user?.id}`, 
          {
            headers: {
              "Authorization": `Bearer ${token}`,   // ✅ required for JWT
              "Content-Type": "application/json",
            },
          }
        );
  
        const data = await response.json();
  
        const normalizedData: Product[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          model: item.model,
          price: parseFloat(item.price),
          stock: Number(item.stock),
          description: item.description || "",
          dealerid: Number(item.dealerid),
          created_at: item.created_at,
        }));
  
        setProducts(normalizedData);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts(SAMPLE_PRODUCTS);
      }
    };
  
    fetchProducts();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProduct = () => {
    setIsEditing(false);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setIsEditing(true);
    setCurrentProduct(product);

    setFormData({
      name: product.name,
      brand: product.brand,
      model: product.model,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description || "",
      image: null, // no file selected yet
      imagePreview: product.image 
    ? `${apiUrl}/backend/public/${product.image}`
    : null, // <-- ✅ Use DB image URL
        });

    setIsDialogOpen(true);
  };



  const handleDeleteProduct = (product: Product) => {
    setCurrentProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (currentProduct) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${apiUrl}/products/${currentProduct.id}`,
          {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,   // ✅ required for JWT
              "Content-Type": "application/json",
            },
          }
        );
  
        const result = await response.json();
        console.log("RESPONSE FROM SERVER:", result); // 👈 Add This

        if (!response.ok || (!result.success && !result.id)) {
          console.log("Server error:", result); // 👈 Add This
          throw new Error(result.error || result.message || "Something went wrong");
        }
  
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to delete product");
        }
  
        const updatedProducts = products.filter((p) => p.id !== currentProduct.id);
        setProducts(updatedProducts);
        toast.success("Product deleted successfully");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("An error occurred while deleting the product.");
      } finally {
        setIsDeleteDialogOpen(false);
      }
    }
  };
  

const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const { name, brand, model, price, stock, description, image } = formData;

  // ✅ Validation (same as you had before)
  if (!name || !brand || !model || !price || !stock) {
    toast.error("Please fill all required fields");
    return;
  }

  const priceNum = parseFloat(price);
  const stockNum = parseInt(stock, 10);

  if (isNaN(priceNum) || priceNum <= 0) {
    toast.error("Price must be a positive number");
    return;
  }

  if (isNaN(stockNum) || stockNum < 0) {
    toast.error("Stock must be a non-negative integer");
    return;
  }

  // ✅ Use FormData instead of JSON
  const form = new FormData();
  form.append("name", name);
  form.append("brand", brand);
  form.append("model", model);
  form.append("price", price); // keep string, backend will convert
  form.append("stock", stock);
  form.append("description", description);
  form.append("dealerid", String(user.id));  // ✅ include dealerid

  // ✅ Attach image if selected
  if (image) {
    form.append("image", image);
  }

  try {
    const token = localStorage.getItem("token");

    let response;

    if (isEditing && currentProduct) {
      response = await fetch(`${apiUrl}/products/update/${currentProduct.id}`, {
        method: "POST",  // ✅ KEEP AS POST
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
    } else {
      response = await fetch(`${apiUrl}/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
    }

    const result = await response.json();

    if (!response.ok || (!result.success && !result.id)) {
      throw new Error(result.error || "Failed to save product");
    }

    toast.success(isEditing ? "Product updated successfully" : "Product added successfully");

    setIsDialogOpen(false);

    // ✅ Refresh product list
    window.location.reload();

  } catch (error) {
    toast.error("An error occurred while saving the product.");
  }
};

 const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] || null;
  if (file) {
    setFormData({
      ...formData,
      image: file,
      imagePreview: URL.createObjectURL(file), // preview
    });
  }
};

  const handleImportClick = () => {
    setIsImportDialogOpen(true);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        if (!user?.id) {
          toast.error("Missing dealer ID. Please log in again.");
          return;
        }

        const importedProducts: Product[] = json.map((row: any, index: number) => {
          if (!row.name || !row.brand || !row.model || !row.price || row.stock === undefined) {
            throw new Error(`Row ${index + 1} is missing required fields`);
          }

          return {
            id: row.id ? Number(row.id) : undefined,
            name: row.name,
            brand: row.brand,
            model: row.model,
            price: Number(row.price),
            stock: Number(row.stock),
            description: row.description || '',
            dealerid: Number(user.id), // ✅ use dealer ID from auth context
          };
        });

        const response = await fetch(`${apiUrl}/products/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: importedProducts }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to import products");
        }

        setProducts(prev => [...prev, ...result.insertedProducts]);
        toast.success(`Successfully imported ${result.insertedProducts.length} products`);
        setIsImportDialogOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error: any) {
        toast.error(`Import failed: ${error.message}`);
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read the file');
    };

    reader.readAsBinaryString(file);
  };

  const totalPages = Math.ceil(products.length / limit);
  const handleExport = (type: "xlsx" | "csv") => {
    const data = products.map((p) => ({
      "Product ID": p.id,
      "Name": p.name,
      "Brand": p.brand,
      "Model": p.model,
      "Price (₹)": p.price.toFixed(2),
      "Stock": p.stock,
      "Description": p.description || "-",
      "Created At": p.created_at
        ? new Date(p.created_at).toLocaleDateString()
        : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `products.${type}`);
  };


  const downloadSampleTemplate = () => {
    // Create a sample template with column headers
    const worksheet = XLSX.utils.json_to_sheet([{
      name: 'Sample Phone',
      brand: 'Sample Brand',
      model: 'Sample Model',
      price: '999',
      stock: '10',
      description: 'Sample description',
    }]);
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    // Create and download the file
    XLSX.writeFile(workbook, 'product_import_template.xlsx');
  };

  // Search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredProducts = products.filter(product => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchTerm) ||
      product.brand.toLowerCase().includes(searchTerm) ||
      product.model.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 fixed top-0 left-0 h-full">
        <Sidebar />
      </div>

      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />
      <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8">
          <div>
            <p className="text-gray-800 text-lg ">Add, edit, or delete products</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={handleImportClick}
                variant="outline"
                className="border-royal text-royal hover:bg-royal/10 w-full sm:w-auto"
              >
                <FileUp size={18} className="mr-2" />
                Import Excel
              </Button>
              <Button
                onClick={handleAddProduct}
                className="bg-royal hover:bg-royal-dark w-full sm:w-auto"
              >
                <Plus size={18} className="mr-2" />
                Add Product
              </Button>
            </div>
          </div>


          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full md:w-1/3"
            />
          </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
        {/* Top Controls */}
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <Select
              value={entriesPerPage}
              onValueChange={(value) => {
                setEntriesPerPage(value);
                setPage(1);
                if (value === "all") setLimit(products.length);
                else setLimit(Number(value));
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select entries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">entries</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortProduct(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              Sort by Date {sortOrder === "asc" ? "↑" : "↓"}
            </Button>

            {user?.role === "dealer" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")}>
                  <Download className="w-4 h-4 mr-1" /> Excel
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.model}</TableCell>
                    <TableCell>{product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No products found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-between items-center mt-3 text-sm text-gray-600 flex-wrap gap-2">
          <div>
            Showing {(page - 1) * limit + 1} to{" "}
            {Math.min(page * limit, products.length)} of {products.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <span className="font-semibold">{page} / {totalPages || 1}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

        {/* Hidden file input for Excel import */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />

        {/* Add/Edit Product Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleFormSubmit}>
              <div className="grid gap-4 py-4">

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name*</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="brand" className="text-right">Brand*</Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="model" className="text-right">Model*</Label>
                  <Input
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Price*</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">Stock*</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>

                {/* ✅ Image Upload Field */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image" className="text-right">Image</Label>
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="col-span-3"
                  />
                </div>

                {/* ✅ Show Image Preview if selected */}
                {formData.imagePreview && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div></div>
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="col-span-3 h-24 w-24 object-cover rounded-md border"
                    />
                  </div>
                )}

              </div>

              <DialogFooter>
                <Button type="submit" className="bg-royal hover:bg-royal-dark">
                  {isEditing ? "Update Product" : "Add Product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>


        {/* Import Excel Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Import Products from Excel</DialogTitle>
            </DialogHeader>
            <div className="py-6 flex flex-col items-center justify-center gap-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center w-full cursor-pointer" onClick={handleFileSelect}>
                <Upload size={36} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Click to select an Excel file</p>
                <p className="text-xs text-gray-400">Supports .xlsx and .xls formats</p>
              </div>
              <Button variant="outline" onClick={downloadSampleTemplate} className="mt-2">
                <FileUp size={18} className="mr-2" />
                Download Sample Template
              </Button>
              <div className="mt-2 w-full">
                <p className="text-sm text-gray-500">
                  <strong>Note:</strong> The Excel file should contain columns: name, brand, model, price, stock (required), and description (optional).
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to delete {currentProduct?.name}?</p>
              <p className="text-sm text-muted-foreground mt-2">
                This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteProduct}
                className="bg-red-500 hover:bg-red-700 text-white"
              >
                Delete
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
export default ManageProducts;