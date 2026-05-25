import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Truck, CheckCircle2, Clock, MapPin, ArrowLeft } from "lucide-react";
import type { OrderStatus } from "@/types";
import api from "@/services/api";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface OrderItem {
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
}

interface OrderDetail {
  id: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  deliveryNotes?: string;
  items: OrderItem[];
}

interface OrderStep {
  label: string;
  icon: React.ElementType;
  status: OrderStatus;
  date?: string;
}

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const rawUserId = (user as any)?.userId ?? (user as any)?.id;
        const parsedUserId = Number(rawUserId);
        const resolvedUserId = Number.isFinite(parsedUserId) ? parsedUserId : undefined;
        const response = await api.get(`/Orders/${id}`, {
          params: Number.isFinite(resolvedUserId) ? { userId: resolvedUserId } : undefined,
        });
        const data = response.data || {};
        const mapped: OrderDetail = {
          id: String(data.id ?? data.Id ?? id),
          createdAt: data.createdAt ?? data.CreatedAt ?? new Date().toISOString(),
          status: (data.status ?? data.Status ?? "pending") as OrderStatus,
          total: Number(data.total ?? data.Total ?? 0),
          deliveryNotes: data.deliveryNotes ?? data.DeliveryNotes ?? "",
          items: Array.isArray(data.items ?? data.Items)
            ? (data.items ?? data.Items).map((item: any) => ({
                name: item.name ?? item.Name ?? "Product",
                imageUrl: item.imageUrl ?? item.ImageUrl ?? "",
                quantity: Number(item.quantity ?? item.Quantity ?? 0),
                unitPrice: Number(item.unitPrice ?? item.UnitPrice ?? 0),
              }))
            : [],
        };
        setOrder(mapped);
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to load order";
        toast.error(message);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const steps: OrderStep[] = useMemo(() => ([
    { label: "Order Placed", icon: Clock, status: "pending", date: order?.createdAt },
    { label: "Confirmed", icon: CheckCircle2, status: "confirmed" },
    { label: "Shipped", icon: Truck, status: "shipped" },
    { label: "Delivered", icon: MapPin, status: "delivered" },
  ]), [order?.createdAt]);

  const statusIndex = steps.findIndex((s) => s.status === (order?.status ?? "pending"));

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-muted-foreground mb-4">Order not found.</p>
        <Button onClick={() => navigate("/orders")}>Back to Orders</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/orders")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
      </Button>

      <h1 className="font-heading text-2xl font-bold mb-6">Order #{order.id.slice(0, 8)}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order Status</span>
            <Badge className="bg-info/10 text-info border-info/20" variant="outline">
              {order.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {steps.map((step, i) => {
              const completed = i <= statusIndex;
              const isActive = i === statusIndex;
              return (
                <div key={step.label} className="flex gap-4 pb-8 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      } ${isActive ? "ring-2 ring-primary/30 ring-offset-2" : ""}`}
                    >
                      <step.icon className="h-4 w-4" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-1 ${i < statusIndex ? "bg-primary" : "bg-muted"}`} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className={`text-sm font-medium ${completed ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(step.date).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{item.name} x{item.quantity}</span>
              <span>{(item.unitPrice * item.quantity).toFixed(2)} EGP</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>Free</span>
          </div>
          <div className="flex justify-between font-heading font-bold">
            <span>Total</span>
            <span className="text-primary">{order.total.toFixed(2)} EGP</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTracking;
