import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { Package, ShoppingBag } from "lucide-react";
import type { OrderStatus } from "@/types";
import api from "@/services/api";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface OrderSummary {
  id: string;
  date: string;
  total: number;
  itemCount: number;
  status: OrderStatus;
}

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-info/10 text-info border-info/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const OrderHistory = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const rawUserId = (user as any)?.userId ?? (user as any)?.id;
        const parsedUserId = Number(rawUserId);
        const resolvedUserId = Number.isFinite(parsedUserId) ? parsedUserId : undefined;
        const response = await api.get("/Orders", {
          params: Number.isFinite(resolvedUserId) ? { userId: resolvedUserId } : undefined,
        });
        const rows = Array.isArray(response.data) ? response.data : [];
        const mapped = rows.map((o: any) => ({
          id: String(o.id ?? o.Id ?? ""),
          date: o.createdAt ?? o.CreatedAt ?? new Date().toISOString(),
          total: Number(o.total ?? o.Total ?? 0),
          itemCount: Number(o.itemCount ?? o.ItemCount ?? 0),
          status: (o.status ?? o.Status ?? "pending") as OrderStatus,
        }));
        setOrders(mapped);
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to load orders";
        toast.error(message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading orders...</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Start shopping to see your orders here."
          icon={<ShoppingBag className="h-8 w-8 text-muted-foreground" />}
          action={<Button onClick={() => navigate("/shop")}>Browse Shop</Button>}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.date).toLocaleDateString()} · {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={statusColors[order.status]}>{order.status}</Badge>
                  <span className="font-heading font-bold text-sm">{order.total.toFixed(2)} EGP</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
