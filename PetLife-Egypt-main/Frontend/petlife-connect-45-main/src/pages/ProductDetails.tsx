import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, ArrowLeft, Package, Minus, Plus, Store } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import type { Product } from "@/types";

const mockProduct: Product = {
  id: "p1", shopId: "s1", shopName: "PetZone Egypt",
  name: "Royal Canin Indoor Cat Food 2kg",
  description: "Complete and balanced nutrition specifically formulated for indoor cats. Helps maintain a healthy weight, supports healthy digestion, and reduces stool odor. Enriched with vitamins and minerals for optimal health. Suitable for adult cats aged 1-7 years.",
  price: 850, category: "Food",
  image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&h=600&fit=crop",
  stock: 25, createdAt: new Date().toISOString(),
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [product] = useState<Product>(mockProduct);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addItem(product);
    toast.success(`${quantity}× ${product.name} added to cart`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/shop")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
      </Button>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="aspect-square bg-muted">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Details */}
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
                  <p className="font-heading text-3xl font-extrabold text-primary">{product.price.toFixed(2)} <span className="text-base">EGP</span></p>
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
