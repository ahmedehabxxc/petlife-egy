import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";

interface InventoryItem {
  id: string;
  productId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

const ShopOwnerInventory = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const loadInventory = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/ShopOwner/inventory", {
        params: Number.isFinite(user.userId) ? { userId: user.userId } : undefined,
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      const mapped = rows.map((p: any) => ({
        id: String(p.id ?? p.Id ?? ""),
        productId: String(p.productId ?? p.ProductId ?? ""),
        name: p.name ?? p.Name ?? "Product",
        description: p.description ?? p.Description ?? "",
        category: p.category ?? p.Category ?? "General",
        price: Number(p.price ?? p.Price ?? 0),
        stock: Number(p.stockQuantity ?? p.StockQuantity ?? 0),
        image: p.imageUrl ?? p.ImageUrl ?? "",
      }));
      setProducts(mapped);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to load inventory";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, [user?.id, user?.userId]);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const openNew = () => {
    setEditProduct(null);
    setName("");
    setPrice("");
    setStock("");
    setCategory("");
    setDescription("");
    setImageUrl("");
    setDialogOpen(true);
  };

  const openEdit = (p: InventoryItem) => {
    setEditProduct(p);
    setName(p.name);
    setPrice(String(p.price));
    setStock(String(p.stock));
    setCategory(p.category);
    setDescription(p.description || "");
    setImageUrl(p.image || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !price || !stock || !category) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      if (editProduct) {
        await api.put(`/ShopOwner/inventory/${editProduct.id}`, {
          name,
          description,
          category,
          imageUrl,
          price: Number(price),
          stockQuantity: Number(stock),
        });
        toast.success("Product updated");
      } else {
        await api.post("/ShopOwner/inventory", {
          name,
          description,
          category,
          imageUrl,
          price: Number(price),
          stockQuantity: Number(stock),
        });
        toast.success("Product added");
      }
      setDialogOpen(false);
      await loadInventory();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to save product";
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/ShopOwner/inventory/${id}`);
      toast.success("Product removed");
      await loadInventory();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete product";
      toast.error(message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Inventory</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground py-6">
                    Loading inventory...
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground py-6">
                    No products yet.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-8 w-8 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                  <TableCell className="text-right">{p.price.toFixed(2)} EGP</TableCell>
                  <TableCell className="text-right">
                    <span className={p.stock === 0 ? "text-destructive font-medium" : p.stock <= 5 ? "text-warning font-medium" : ""}>
                      {p.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Price (EGP)</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editProduct ? "Update" : "Add"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopOwnerInventory;
