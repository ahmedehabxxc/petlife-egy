import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Banknote, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const [payment, setPayment] = useState("cod");
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  const subtotal = total();
  const shipping = subtotal > 500 ? 0 : 50;
  const grandTotal = subtotal + shipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        address,
        city,
        phone,
        paymentMethod: payment,
        items: items.map((item) => ({
          shopProductId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
      };

      const response = await api.post("/Orders", payload);
      const orderId = response.data?.id;
      clearCart();
      toast.success("Order placed successfully!");
      if (orderId) {
        navigate(`/orders/${orderId}`);
      } else {
        navigate("/orders");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to place order";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/shop")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
      </Button>

      <h1 className="font-heading text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="123 Main St, Apt 4" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Cairo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+20 xxx xxx xxxx" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={payment} onValueChange={setPayment} className="space-y-3">
                {[
                  { value: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay when you receive your order" },
                  { value: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard accepted" },
                ].map((m) => (
                  <div
                    key={m.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      payment === m.value ? "border-primary bg-primary/5" : "border-border"
                    }`}
                    onClick={() => setPayment(m.value)}
                  >
                    <RadioGroupItem value={m.value} id={m.value} />
                    <m.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor={m.value} className="cursor-pointer font-medium">{m.label}</Label>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="truncate mr-2">{item.product.name} x{item.quantity}</span>
                  <span className="flex-shrink-0">{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{subtotal.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? "Free" : `${shipping.toFixed(2)} EGP`}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-heading font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{grandTotal.toFixed(2)} EGP</span>
              </div>
              <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
                {loading ? "Placing Order..." : "Place Order"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">Free shipping on orders over 500 EGP</p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
