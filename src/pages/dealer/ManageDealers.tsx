import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Plus } from "lucide-react";
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow,
} from "@/components/ui/table";
import {Dialog,DialogContent,DialogFooter,DialogHeader,DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { apiUrl } from "@/url";

interface Dealer {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contact_person: string;
  store_name: string;
  company_name: string;
  registration_date: string;
}

type DealerFormData = {
    username: string;
    name: string;
    email: string;
    address:string;
    company_name: string;
    password: string;
    phone: string;
    confirmPassword?: string; // Optional if used in form
    dealer_id?: string;       // Optional if added dynamically
    role?: string;            // Optional if fixed as "dealer"
  };

const emptyFormData: DealerFormData = {
    username: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    address:"",
    company_name:""
};
  

const ManageDealers = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState(emptyFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [dealers, setDealers] = useState([]);
    const [filteredDealers, setFilteredDealers] = useState([]);
    const { user,isAuthenticated } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentDealer, setCurrentDealer] = useState(null);
    const navigate = useNavigate();
    
      useEffect(() => {
        if (!isAuthenticated) {
          navigate("/");
        } else if (user?.role !== "admin") {
          navigate("/admin");
        }
      }, [isAuthenticated, user, navigate]);

      useEffect(() => {
        const fetchDealers = async () => {
          if (!user?.id) return;
      
          try {
            const token = localStorage.getItem("token"); // get saved JWT
      
            const response = await fetch(`${apiUrl}/dealers`, {
              headers: {
                "Authorization": `Bearer ${token}`, // ✅ send token
                "Content-Type": "application/json",
              },
            });
      
            if (!response.ok) {
              throw new Error("Failed to fetch Dealers");
            }
      
            const data = await response.json();
            setDealers(data);
            setFilteredDealers(data);
          } catch (error) {
            console.error("Failed to fetch Dealers:", error);
          }
        };
      
        fetchDealers();
      }, [user]);
      
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };
  
    const handleAddDealer = () => {
      setIsEditing(false);
      setFormData(emptyFormData);
      setIsDialogOpen(true);
    };
  
    const handleEditDealer = (dealer: Dealer) => {
      setIsEditing(true);
      setCurrentDealer(dealer);
      setFormData({
        username: dealer.username,
        name: dealer.name,
        email: dealer.email,
        phone: dealer.phone,
        password: "",
        confirmPassword: "",
        dealer_id: user.id,
        role: "dealer",
        address:dealer.address,
        company_name:dealer.company_name
      });
      setIsDialogOpen(true);
    };
  
  
    const validateDealerForm = () => {
      const { username, name, email, phone } = formData;
      if (!username || !name || !email || !phone) {
        toast.error("Please fill all required fields");
        return false;
      }
      const existingDealer = dealers.find(
        (d) => d.username.toLowerCase() === username.toLowerCase() && (!isEditing || d.id !== currentDealer?.id)
      );
      if (existingDealer) {
        toast.error("Username already exists");
        return false;
      }
      return true;
    };
    
    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateDealerForm()) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Unauthorized: Token not found");
          return;
        }

        const baseUrl = `${apiUrl}/dealers`;

        if (isEditing && currentDealer) {
          // ✅ Update existing dealer
          await fetch(`${baseUrl}/${currentDealer.id}`, {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${token}`, // ✅ Secure JWT header
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          });
          toast.success("Dealer updated successfully");
        } else {
          // ✅ Create new dealer
          formData.dealer_id = user.id; // Optional, if backend expects it
          formData.role = "dealer";

          await fetch(baseUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`, // ✅ Secure JWT header
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          });
          toast.success("Dealer added successfully");
        }

        // ✅ Refresh dealer list securely
        const response = await fetch(`${baseUrl}?dealerid=${user.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`, // ✅ JWT for fetching list too
          },
        });

        if (!response.ok) throw new Error("Failed to fetch updated dealer list");

        const updated = await response.json();
        setDealers(updated);
        setFilteredDealers(updated);
        setIsDialogOpen(false);

      } catch (error) {
        console.error("Error saving dealer:", error);
        toast.error("Failed to save dealer");
      }
    };

    
  
    const handleDeleteDealer = (dealer: Dealer) => {
        setCurrentDealer(dealer);
        setIsDeleteDialogOpen(true);
      };
  
      const confirmDeleteDealer = async () => {
        if (!currentDealer) return;
      
        try {
          const token = localStorage.getItem("token");
          const baseUrl = `${apiUrl}/dealers`;
      
          // ✅ DELETE dealer
          await fetch(`${baseUrl}/${currentDealer.id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
      
          toast.success("Dealer deleted successfully");
      
          // ✅ Refresh list (filtered by dealer ID)
          const response = await fetch(`${baseUrl}?dealerid=${user.id}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const updated = await response.json();
      
          setDealers(updated);
          setFilteredDealers(updated);
        } catch (error) {
          console.error("Failed to delete dealer:", error);
          toast.error("Failed to delete dealer");
        }
      
        setIsDeleteDialogOpen(false);
      };
      

  return (
    <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-8">
            <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Dealers</h1>
            <p className="text-gray-600">Add and manage dealer accounts</p>
            </div>
            <Button onClick={handleAddDealer} className="bg-royal hover:bg-royal-dark">
            <Plus size={18} className="mr-2" />
            Add Dealer
            </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>UserID</TableHead>
                <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {dealers.length > 0 ? (
                dealers.map((dealer) => (
                    <TableRow key={dealer.id}>
                    <TableCell>{dealer.id}</TableCell>
                    <TableCell>{dealer.username}</TableCell>
                    <TableCell>{dealer.name}</TableCell>
                    <TableCell>{dealer.email}</TableCell>
                    <TableCell>{dealer.phone}</TableCell>
                    <TableCell>{dealer.company_name}</TableCell>
                    <TableCell>{formatDate(dealer.registration_date)}</TableCell>
                    <TableCell>
                    <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDealer(dealer)}
                    >
                        <Pencil size={16} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteDealer(dealer)}
                    >
                        <Trash2 size={16} />
                    </Button>
                            </div>
                            </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                    No dealers found. Click "Add Dealer" to create one.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>

        {/* Add Dealer Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Dealer" : "Add New Dealer"}</DialogTitle>
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
                    type="text"
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
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company_name" className="text-right">
                    Company
                    </Label>
                    <Input
                    id="company_name"
                    name="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                    Password
                    </Label>
                    <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder={!isEditing?"Leave empty to auto-generate":"Leave blank to keep unchanged"}
                    />
                </div>
                </div>
                <DialogFooter>
                <Button 
                      type="submit" 
                      className="bg-royal hover:bg-royal-dark"
                      disabled={isLoading}
                  >
                      {isLoading 
                          ? (isEditing ? "Updating..." : "Adding...") 
                          : (isEditing ? "Update Dealer" : "Add Dealer")
                      }
                  </Button>

                </DialogFooter>
            </form>
            </DialogContent>
        </Dialog>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>Delete Dealer</DialogTitle>
            </DialogHeader>
            <div className="py-4">
            <p>Are you sure you want to delete {currentDealer?.name}?</p>
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
                onClick={confirmDeleteDealer}
                className="bg-red-500 hover:bg-red-700 text-white"
            >
                Delete
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>

        </div>
    </div>
  );
};

export default ManageDealers;
