import {useMemo} from "react";                                                                                                                                                                                                                                                                                  import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import { useAuth } from "@/context/AuthContext";
import { Retailer, UserRole, Staff } from "@/types";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { apiUrl } from "@/url";
import Sidebar from "@/components/Sidebar";

interface OptionType {
  value: string;
  label: string;
}
import {ChevronLeft,ChevronRight,Download,ArrowUpDown,Clock,AlertTriangle,} from "lucide-react";
// console.log(user.user.id)
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow,} from "@/components/ui/table";
import {Dialog,DialogContent,DialogFooter,DialogHeader,DialogTitle,
} from "@/components/ui/dialog";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
// Sample retailers data (would be fetched from API in production)
interface RetailerFormData {username: string;name: string;contact_person: string;store_name:string; email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  dealer_id: string;
  role:string;
  assigned: string;
}
  const emptyFormData: RetailerFormData = {username: "", name: "", contact_person: "",store_name:"",email: "",phone: "",address: "",password: "",confirmPassword: "",dealer_id:"",
    role:"",
    assigned: ""
  };

  const ManageRetailers = () => {
    const [retailers, setRetailers] = useState<Retailer[]>([]);
    const [filteredRetailers, setFilteredRetailers] = useState<Retailer[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentRetailer, setCurrentRetailer] = useState<Retailer | null>(null);
    const [formData, setFormData] = useState<RetailerFormData>(emptyFormData);
    const [isEditing, setIsEditing] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
    const navigate = useNavigate();
    const [localOrders, setLocalOrders] = useState<Staff[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [entriesPerPage, setEntriesPerPage] = useState("10");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => {
      if (!isAuthenticated) {
        navigate("/");
      } else if (user?.role !== "dealer") {
        navigate("/home");
      }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
      const fetchRetailers = async () => {
          try {
            const token = localStorage.getItem("token");
            if (!token) {
              console.error("Unauthorized: Token not found");
              return;
            }

            const response = await fetch(`${apiUrl}/retailers?dealerid=${user?.id}`, {
              headers: {
                "Authorization": `Bearer ${token}`, // ✅ Secure JWT header
                "Content-Type": "application/json",
              },
            });

            if (!response.ok) throw new Error("Failed to fetch retailers");

            const data = await response.json();
            setRetailers(data);
            setFilteredRetailers(data);
          } catch (error) {
            console.error("Failed to fetch retailers:", error);
          }
      };

      if (user?.id) fetchRetailers();
    }, [user?.id, apiUrl]);

    
  const handleRetailerSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredRetailers(retailers);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = retailers.filter(
      (retailer) =>
        retailer.username.toLowerCase().includes(lowerQuery) ||
        retailer.name.toLowerCase().includes(lowerQuery) ||
        retailer.contact_person.toLowerCase().includes(lowerQuery) ||
        retailer.email.toLowerCase().includes(lowerQuery) ||
        retailer.phone.toLowerCase().includes(lowerQuery) ||
        retailer.store_name.toLowerCase().includes(lowerQuery)
    );

    setFilteredRetailers(filtered);
  };

    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleAddRetailer = () => {
      setIsEditing(false);
      setFormData(emptyFormData);
      setIsDialogOpen(true);
    };

    const handleEditRetailer = (retailer: Retailer) => {
      setIsEditing(true);
      setCurrentRetailer(retailer);
      setFormData({
        username: retailer.username,
        name: retailer.name,
        contact_person: retailer.contact_person,
        store_name:retailer.store_name,
        email: retailer.email,
        phone: retailer.phone,
        address: retailer.address,
        password: "", // Don't display password in form
        confirmPassword: "", // Don't display password in form
        dealer_id: user.id,
        role:"",
        assigned:retailer.assigned,
      });
      setIsDialogOpen(true);
    };

    const handleDeleteRetailer = (retailer: Retailer) => {
      setCurrentRetailer(retailer);
      setIsDeleteDialogOpen(true);
    };

  const confirmDeleteRetailer = async () => {
    if (!currentRetailer) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized: Token not found");
        return;
      }

      // 🔹 Delete retailer securely
      const deleteResponse = await fetch(`${apiUrl}/retailers/${currentRetailer.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!deleteResponse.ok) throw new Error("Failed to delete retailer");

      toast.success("Retailer deleted successfully");

      // 🔹 Refresh the list securely
      const listResponse = await fetch(`${apiUrl}/retailers?dealerid=${user.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!listResponse.ok) throw new Error("Failed to fetch updated retailer list");

      const updatedList = await listResponse.json();
      setRetailers(updatedList);
      setFilteredRetailers(updatedList);
    } catch (error) {
      console.error("Failed to delete retailer:", error);
      toast.error("Failed to delete retailer");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

      
  const validateForm = (): boolean => {
    const { username, name, email, phone } = formData;
    
    if (!username || !name || !email || !phone) {
      toast.error("Please fill all required fields");
      return false;
    }
    
    // Check if username already exists
    const existingRetailer = retailers.find(
      (r) => r.username.toLowerCase() === username.toLowerCase() && 
      (!isEditing || r.id !== currentRetailer?.id)
    );
    
    if (existingRetailer) {
      toast.error("Username already exists");
      return false;
    }
    
    return true;
  };

 const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized: Token not found");
        return;
      }

      const headers = {
        "Authorization": `Bearer ${token}`, // ✅ Secure JWT
        "Content-Type": "application/json",
      };

      if (isEditing && currentRetailer) {
        // ✅ PUT → Update retailer
        const updateResponse = await fetch(`${apiUrl}/retailers/${currentRetailer.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(formData),
        });

        if (!updateResponse.ok) throw new Error("Failed to update retailer");

        toast.success("Retailer updated successfully");
      } else {
        // ✅ POST → Create new retailer
        formData.dealer_id = user.id;
        formData.role = "retailer";

        const createResponse = await fetch(`${apiUrl}/retailers`, {
          method: "POST",
          headers,
          body: JSON.stringify(formData),
        });

        if (!createResponse.ok) throw new Error("Failed to create retailer");

        const newRetailer = await createResponse.json();
        toast.success("Retailer added successfully");
      }

      // ✅ Refresh retailers list securely
      const listResponse = await fetch(`${apiUrl}/retailers?dealerid=${user.id}`, {
        headers,
      });

      if (!listResponse.ok) throw new Error("Failed to fetch updated retailer list");

      const updatedList = await listResponse.json();
      setRetailers(updatedList);
      setFilteredRetailers(updatedList);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving retailer:", error);
      toast.error("Failed to save retailer");
    }
  };

    
    
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Unauthorized: Token not found");
          return;
        }

        const response = await fetch(`${apiUrl}/staff/sales_executive?dealerid=${user?.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`, // ✅ Secure JWT header
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch staff");

        const data = await response.json();
        setStaff(data);
        setFilteredStaff(data);
      } catch (error) {
        console.error("Failed to fetch staff:", error);
      }
    };

    if (user?.id) fetchStaff();
  }, [user?.id]);


  const handleExport = (type: "xlsx" | "csv") => {
    const data = retailers.map((c) => ({
      "Username": c.username,
      "Name": c.name,
      "Store Name": c.store_name,
      "Email": c.email,
      "Phone": c.phone,
      "Address": c.address,
      "Assigned To": c.assigned || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `customers.${type}`);
  };


  const totalPages = Math.ceil(localOrders.length / limit);
    
  const paginatedOrders = useMemo(() => {
    const sorted = [...localOrders].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    if (entriesPerPage === "all") return sorted;

    const start = (page - 1) * limit;
    return sorted.slice(start, start + limit);
  }, [localOrders, page, limit, entriesPerPage, sortOrder]);

  return (

    <div className="flex h-screen overflow-hidden">
        <div className="w-64 fixed top-0 left-0 h-full">
          <Sidebar />
        </div>

        <div className="flex-1 ml-64 flex flex-col">
          <Navbar />
        <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 mt-4">
            <div className="">

              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-lg text-gray-800">Add, edit, or delete Customer accounts</p>
                </div>
                <Button onClick={handleAddRetailer} className="bg-royal hover:bg-royal-dark">
                  <Plus size={18} className="mr-2" />
                  Add Customer
                </Button>
              </div>

              {/* Search Bar */}
              <SearchBar onSearch={handleRetailerSearch} />
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
                    if (value === "all") setLimit(localOrders.length);
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
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
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
                        <TableHead>Username</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Store Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Registration</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRetailers.length > 0 ? (
                        filteredRetailers.map((retailer) => (
                          <TableRow key={retailer.id}>
                            <TableCell>{retailer.username}</TableCell>
                            <TableCell>{retailer.name}</TableCell>
                            <TableCell>{retailer.store_name}</TableCell>
                            <TableCell>{retailer.email}</TableCell>
                            <TableCell>{retailer.phone}</TableCell>
                            <TableCell>{retailer.registration_date}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRetailer(retailer)}
                                >
                                  <Pencil size={16} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteRetailer(retailer)}
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
                          <TableCell colSpan={7} className="text-center py-4">
                            No Customers found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
            <div className="flex justify-between items-center mt-3 text-sm text-gray-600 flex-wrap gap-2">
              <div>
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, retailers.length)} of {retailers.length} entries
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
            </div>

            {/* Add/Edit Retailer Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>{isEditing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFormSubmit}>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    {/* Username */}
                    <div className="grid items-center gap-2">
                      <Label htmlFor="username">Username*</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Name */}
                    <div className="grid items-center gap-2">
                      <Label htmlFor="name">Name*</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Store Name */}
                    <div className="grid items-center gap-2">
                      <Label htmlFor="store_name">Store Name*</Label>
                      <Input
                        id="store_name"
                        name="store_name"
                        value={formData.store_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="grid items-center gap-2">
                      <Label htmlFor="email">Email*</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div className="grid items-center gap-2">
                      <Label htmlFor="phone">Phone*</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Address */}
                    <div className="grid items-center gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* Password */}
                    <div className="grid items-center gap-2">
                      <Label htmlFor="password">
                        Password{isEditing ? "" : "*"}
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!isEditing}
                        placeholder={isEditing ? "Leave blank to keep unchanged" : ""}
                      />
                    </div>

                    {/* Confirm Password (only for add) */}
                    {!isEditing && (
                      <div className="grid items-center gap-2">
                        <Label htmlFor="confirmPassword">Confirm Password*</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    )}

                    {/* Assigned Sales Executive */}
                    <div className="grid items-center gap-2 col-span-2">
                      <Label htmlFor="assigned">Assign Sales Executive</Label>
                      <Select
                        value={formData.assigned}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            assigned: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Sales Executive" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredStaff.map((executive) => (
                            <SelectItem key={executive.id} value={executive.id.toString()}>
                              {executive.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="bg-royal hover:bg-royal-dark">
                      {isEditing ? "Update Customer" : "Add Customer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>


            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete Customer</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p>Are you sure you want to delete {currentRetailer?.name}?</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This action cannot be undone.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDeleteRetailer}
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

export default ManageRetailers;