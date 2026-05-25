import { useEffect, useMemo, useState } from "react";
<<<<<<< HEAD
import ProductCard from "@/components/ProductCard";
=======
import ProductCard from "@/Features/ShopOwner/Components/ProductCard";
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";
import type { Product } from "@/types";

const ProductCatalog = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get("/Product/catalog");
        const rows = Array.isArray(response.data) ? response.data : [];
        const mapped = rows.map((p: any) => ({
          id: String(p.id ?? p.Id ?? ""),
          shopId: String(p.shopOwnerId ?? p.ShopOwnerId ?? ""),
          shopName: p.shopName ?? p.ShopName ?? "Shop",
          name: p.name ?? p.Name ?? "Product",
          description: p.description ?? p.Description ?? "",
          price: Number(p.price ?? p.Price ?? 0),
          category: p.category ?? p.Category ?? "General",
          image: p.imageUrl ?? p.ImageUrl ?? "",
          stock: Number(p.stockQuantity ?? p.StockQuantity ?? 0),
          createdAt: p.createdAt ?? p.CreatedAt ?? new Date().toISOString(),
        }));
        setProducts(mapped);
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to load products";
        toast.error(message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  let filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || p.category === category;
    return matchesSearch && matchesCat;
  });

  if (sort === "price_asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === "name") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Pet Shop</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="price_asc">Price: Low → High</SelectItem>
            <SelectItem value="price_desc">Price: High → Low</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading products...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No products found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
