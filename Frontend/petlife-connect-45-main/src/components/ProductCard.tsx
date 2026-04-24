import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => navigate(`/shop/${product.id}`)}
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <Badge variant="outline" className="absolute top-2 left-2 bg-warning/10 text-warning border-warning/20 text-xs">
            Only {product.stock} left
          </Badge>
        )}
        {product.stock === 0 && (
          <Badge variant="outline" className="absolute top-2 left-2 bg-destructive/10 text-destructive border-destructive/20 text-xs">
            Out of Stock
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
        <p className="text-xs text-muted-foreground mb-1">Shop: {product.shopName}</p>
        <h3 className="font-heading font-bold text-sm line-clamp-2 mb-1">{product.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="font-heading font-extrabold text-lg text-primary">
            {product.price.toFixed(2)} EGP
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
