import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, ArrowLeft, Package, Minus, Plus, Store } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import type { Product } from "@/types";
import api from "@/services/api";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await api.get(`/Product/catalog/${id}`);
        const p = response.data || {};
        setProduct({
          id: String(p.id ?? p.Id ?? id),
          shopId: String(p.shopOwnerId ?? p.ShopOwnerId ?? ""),
          shopName: p.shopName ?? p.ShopName ?? "Shop",
          name: p.name ?? p.Name ?? "Product",
          description: p.description ?? p.Description ?? "No description available.",
          price: Number(p.price ?? p.Price ?? 0),
          category: p.category ?? p.Category ?? "General",
          image: p.imageUrl ?? p.ImageUrl ?? "",
          stock: Number(p.stockQuantity ?? p.StockQuantity ?? 0),
          createdAt: p.createdAt ?? p.CreatedAt ?? new Date().toISOString(),
        });
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load product");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addItem(product);
    toast.success(`${quantity}× ${product.name} added to cart`);
  };

  if (loading) {
    return <div className="text-center py-16 text-muted-foreground">Loading product…</div>;
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Button variant="outline" onClick={() => navigate("/shop")}>Back to Shop</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/shop")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
      </Button>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-square bg-muted">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          <CardContent className="p-6 flex flex-col">
            <Badge variant="outline" className="w-fit text-xs mb-2">{product.category}</Badge>
            <h1 className="font-heading text-2xl font-bold mb-2">{product.name}</h1>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Store className="h-4 w-4" />
              <span>Sold by {product.shopName}</span>
            </div>

            <p className="text-foreground/80 text-sm leading-relaxed mb-6">{product.description}</p>

            <Separator className="my-4" />

            <div className="mt-auto space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-heading text-3xl font-extrabold text-primary">
                    {product.price.toFixed(2)} <span className="text-base">EGP</span>
                  </p>
                </div>
                <div>
                  {product.stock > 0 ? (
                    <Badge className="bg-success/10 text-success border-success/20" variant="outline">
                      In Stock ({product.stock})
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
              </div>

              {product.stock > 0 && (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Qty:</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-medium w-8 text-center">{quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button className="w-full" size="lg" onClick={handleAddToCart}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart — {(product.price * quantity).toFixed(2)} EGP
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default ProductDetails;
