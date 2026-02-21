                                                                                                                                                                                                                                                                                  import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import { useAuth } from "@/context/AuthContext";
import { Staff, UserRole } from "@/types";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { apiUrl } from "@/url";
import * as XLSX from "xlsx";
import Sidebar from "@/components/Sidebar";
// console.log(user.user.id)
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Sample retailers data (would be fetched from API in production)


interface StaffFormData {
  username: string;
  name: string;
  contact_person: string;
  sub_role: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  dealer_id: string;
  role: string;
}

const emptyFormData: StaffFormData = {
  username: "",
  name: "",
  contact_person: "",
  sub_role: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  confirmPassword: "",
  dealer_id: "",
  role: "",
};

const DealerStaff = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(emptyFormData);
  const [isEditing, setIsEditing] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [sortOrder, setSortStaff] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    } else if (user?.role !== "dealer") {
      navigate("/home");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Unauthorized: Token not found");
        return;
      }

      const response = await fetch(`${apiUrl}/staff?dealerid=${user?.id}`, {
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

  const handleStaffSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredStaff(staff);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = staff.filter(
      (s) =>
        s.username.toLowerCase().includes(lowerQuery) ||
        s.name.toLowerCase().includes(lowerQuery) ||
        s.contact_person?.toLowerCase().includes(lowerQuery) ||
        s.email.toLowerCase().includes(lowerQuery) ||
        s.phone.toLowerCase().includes(lowerQuery) ||
        s.sub_role.toLowerCase().includes(lowerQuery)
    );

    setFilteredStaff(filtered);
    setPage(1); // ✅ Reset pagination to first page
  };


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleAddStaff = () => {
    setIsEditing(false);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleEditStaff = (staff: Staff) => {
    setIsEditing(true);
    setCurrentStaff(staff);
    setFormData({
      username: staff.username,
      name: staff.name,
      contact_person: staff.contact_person,
      sub_role: staff.sub_role,
      email: staff.email,
      phone: staff.phone,
      address: staff.address,
      password: "",
      confirmPassword: "",
      dealer_id: user.id,
      role: staff.role || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteStaff = (staff: Staff) => {
    setCurrentStaff(staff);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteStaff = async () => {
  if (!currentStaff) return;

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized: Token not found");
      return;
    }

  const headers = {
    "Authorization": `Bearer ${token}`, // ✅ Secure JWT header
    "Content-Type": "application/json",
  };

    // 🔹 Delete staff securely
  const deleteResponse = await fetch(`${apiUrl}/staff/${currentStaff.id}`, {
    method: "DELETE",
    headers,
  });

    if (!deleteResponse.ok) throw new Error("Failed to delete staff");

    toast.success("Staff deleted successfully");

    // 🔹 Refresh staff list securely
    const listResponse = await fetch(`${apiUrl}/staff?dealerid=${user.id}`, { headers });
    if (!listResponse.ok) throw new Error("Failed to fetch updated staff list");

    const updatedList = await listResponse.json();
    setStaff(updatedList);
    setFilteredStaff(updatedList);
  } catch (error) {
    console.error("Failed to delete staff:", error);
    toast.error("Failed to delete staff");
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
    const existingStaff = staff.find(
      (r) => r.username.toLowerCase() === username.toLowerCase() && 
      (!isEditing || r.id !== currentStaff?.id)
    );
    
    if (existingStaff) {
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
        "Authorization": `Bearer ${token}`, // ✅ Secure JWT header
        "Content-Type": "application/json",
      };

      const payload = { ...formData };
      payload.dealer_id = user.id; // Ensure dealer_id is always sent
      payload.role = "staff";

      // Remove empty password if editing
      if (isEditing && !payload.password) {
        delete payload.password;
        delete payload.confirmPassword;
      }

      let res;
      if (isEditing && currentStaff) {
        // ✅ PUT → Update staff
        res = await fetch(`${apiUrl}/staff/${currentStaff.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to update staff");

        toast.success("Staff updated successfully");
      } else {
        // ✅ POST → Create new staff
        res = await fetch(`${apiUrl}/staff`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to create staff");

        toast.success("Staff added successfully");
      }

      // ✅ Refresh staff list securely
      const listResponse = await fetch(`${apiUrl}/staff?dealerid=${user.id}`, { headers });
      if (!listResponse.ok) throw new Error("Failed to fetch updated staff list");

      const updatedList = await listResponse.json();
      setStaff(updatedList);
      setFilteredStaff(updatedList);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving staff:", error);
      toast.error("Failed to save staff");
    }
  };


  const roleLabels: Record<string, string> = {
    executive: "Sales Executive",
  };


  const totalPages = Math.ceil(staff.length / limit);handleStaffSearch
  const paginatedStaff = filteredStaff.slice((page - 1) * limit, page * limit);

  const handleExport = (type: "xlsx" | "csv") => {
    // Map staff data to a format suitable for Excel/CSV
    const data = staff.map((staff) => ({
      "Username": staff.username,
      "Name": staff.name,
      "Contact Person": staff.contact_person,
      "Sub Role": staff.sub_role.charAt(0).toUpperCase() + staff.sub_role.slice(1),
      "Email": staff.email,
      "Phone": staff.phone,
      "Address": staff.address,
      "Dealer ID": staff.dealer_id,
      "Role": staff.role,
    }));

    // Create a worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create a workbook and append the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff");

    // Write file
    XLSX.writeFile(wb, `staff.${type}`);
  };


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
                    <p className="text-gray-800 text-lg">Add, edit, or delete Staff</p>
                  </div>
                  <Button onClick={handleAddStaff} className="bg-royal hover:bg-royal-dark">
                    <Plus size={18} className="" />
                    Add Staff
                  </Button>
                </div>

                {/* Search Bar */}
                <SearchBar onSearch={handleStaffSearch} />
                <div className="bg-white rounded-lg shadow-sm p-4 border">
                  <div className="flex justify-between items-center mb-3 flex-wrap gap-2 ">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Show</span>
                      <Select
                        value={entriesPerPage}
                        onValueChange={(value) => {
                          setEntriesPerPage(value);
                          setPage(1);
                          if (value === "all") setLimit(staff.length);
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
                        onClick={() => setSortStaff(sortOrder === "asc" ? "desc" : "asc")}
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
                          <TableHead>Staff Role</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Registration</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedStaff.length > 0 ? (
                          paginatedStaff.map((staffItem) => (
                            <TableRow key={staffItem.id}>
                              <TableCell>{staffItem.username}</TableCell>
                              <TableCell>{staffItem.name}</TableCell>
                              <TableCell>
                                {staffItem.sub_role.charAt(0).toUpperCase() + staffItem.sub_role.slice(1)}
                              </TableCell>
                              <TableCell>{staffItem.email}</TableCell>
                              <TableCell>{staffItem.phone}</TableCell>
                              <TableCell>{staffItem.registration_date}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEditStaff(staffItem)}>
                                    <Pencil size={16} />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteStaff(staffItem)}
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
                              No staff found matching your search.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-between items-center mt-3 text-sm text-gray-600 flex-wrap gap-2">
                    <div>
                      Showing {(page - 1) * limit + 1} to{" "}
                      {Math.min(page * limit, staff.length)} of {staff.length} entries
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

              {/* Add/Edit Staff Dialog */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Staff" : "Add New Staff"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFormSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                          Username*
                        </Label>
                        <Input
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name*
                        </Label>
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
                        <Label htmlFor="sub_role" className="text-right">
                          Staff Role
                        </Label>
                          <select
                            id="sub_role"
                            name="sub_role"
                            value={formData.sub_role}
                            onChange={handleInputChange}
                            className="col-span-3 border rounded-md p-2"
                            required
                          >
                            <option value="">Select Role</option>
                            {Object.entries(roleLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>

                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email*
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                          Phone*
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">
                          Address
                        </Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="col-span-3"
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Password{isEditing ? "" : "*"}
                        </Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="col-span-3"
                          required={!isEditing}
                          placeholder={isEditing ? "Leave blank to keep unchanged" : ""}
                        />
                      </div>

                      {!isEditing && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="confirmPassword" className="text-right">
                          Confirm Password*
                        </Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                    )}

                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-royal hover:bg-royal-dark">
                        {isEditing ? "Update Staff" : "Add Staff"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Delete Staff</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Are you sure you want to delete {currentStaff?.name}?</p>
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
                      onClick={confirmDeleteStaff}
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

export default DealerStaff;