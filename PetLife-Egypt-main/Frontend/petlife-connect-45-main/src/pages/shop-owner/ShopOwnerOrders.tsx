import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Phone, Search } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";

interface ShopOrderItem {
  name: string;
  qty: number;
}

interface ShopOrder {
  id: string;
  customer: string;
  phone: string;
  items: ShopOrderItem[];
  total: number;
  status: OrderStatus;
  address: string;
  date?: string;
}

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-info/10 text-info border-info/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusFlow: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

const ShopOwnerOrders = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await api.get("/ShopOwner/orders", {
        params: Number.isFinite(user.userId) ? { userId: user.userId } : undefined,
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      const mapped = rows.map((o: any) => ({
        id: String(o.id ?? o.Id ?? ""),
        customer: o.customer ?? o.Customer ?? "Customer",
        phone: o.phone ?? o.Phone ?? "",
        items: Array.isArray(o.items ?? o.Items)
          ? (o.items ?? o.Items).map((i: any) => ({
            name: i.name ?? i.Name ?? "Item",
            qty: Number(i.qty ?? i.Qty ?? 0),
          }))
          : [],
        total: Number(o.total ?? o.Total ?? 0),
        status: String(o.status ?? o.Status ?? "pending").toLowerCase() as OrderStatus,
        address: o.address ?? o.Address ?? "",
        date: o.createdAt ?? o.CreatedAt ?? undefined,
      }));
      setOrders(mapped);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to load orders";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [user?.id, user?.userId]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || o.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, filterStatus]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.put(`/ShopOwner/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order ${orderId.slice(0, 8)} → ${newStatus}`);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update order";
      toast.error(message);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Manage Orders</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by customer or order ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
        )}
        {!loading && filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No orders found.</div>
        ) : (
          filtered.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-heading font-bold text-sm">#{order.id.slice(0, 8)}</span>
                      <Badge variant="outline" className={statusColors[order.status]}>{order.status}</Badge>
                    </div>
                    <p className="text-sm font-medium">{order.customer}</p>
                    {order.address && <p className="text-xs text-muted-foreground">{order.address}</p>}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {order.items.map((item, i) => (
                        <span key={i}>{item.name} ×{item.qty}{i < order.items.length - 1 ? ", " : ""}</span>
                      ))}
                    </div>
                    <p className="font-heading font-bold text-sm mt-2">{order.total.toFixed(2)} EGP</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <span className="text-xs text-muted-foreground">
                      {order.date ? new Date(order.date).toLocaleString() : ""}
                    </span>
                    <div className="flex gap-2">
                      {order.phone && (
                        <Button variant="outline" size="sm" onClick={() => window.open(`tel:${order.phone}`)}>
                          <Phone className="mr-1 h-3 w-3" /> Call
                        </Button>
                      )}
                      {order.status !== "delivered" && order.status !== "cancelled" && (
                        <Select
                          value={order.status}
                          onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}
                        >
                          <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusFlow.map((s) => (
                              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ShopOwnerOrders;
