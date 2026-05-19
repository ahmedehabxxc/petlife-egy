import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Coins, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";

interface DashboardOrder {
  id: string;
  customer: string;
  total: number;
  items: number;
  status: string;
  createdAt?: string;
}

interface DashboardData {
  shopName?: string | null;
  newOrders: number;
  incomeMonth: number;
  profitMonth: number;
  refunds: number;
  orders: DashboardOrder[];
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  new: "bg-warning/10 text-warning border-warning/20",
  processing: "bg-info/10 text-info border-info/20",
  confirmed: "bg-info/10 text-info border-info/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  delivered: "bg-success/10 text-success border-success/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  refunded: "bg-destructive/10 text-destructive border-destructive/20",
};

const ShopOwnerDashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData>({
    shopName: null,
    newOrders: 0,
    incomeMonth: 0,
    profitMonth: 0,
    refunds: 0,
    orders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const response = await api.get("/ShopOwner/dashboard", {
          params: Number.isFinite(user.userId) ? { userId: user.userId } : undefined,
        });
        const payload = response.data || {};
        const nextData = {
          shopName: payload.shopName ?? payload.ShopName ?? null,
          newOrders: Number(payload.newOrders ?? payload.NewOrders ?? 0),
          incomeMonth: Number(payload.incomeMonth ?? payload.IncomeMonth ?? 0),
          profitMonth: Number(payload.profitMonth ?? payload.ProfitMonth ?? 0),
          refunds: Number(payload.refunds ?? payload.Refunds ?? 0),
          orders: Array.isArray(payload.orders ?? payload.Orders) ? (payload.orders ?? payload.Orders).map((o: any) => ({
            id: String(o.id ?? o.Id ?? ""),
            customer: o.customer ?? o.Customer ?? "Customer",
            total: Number(o.total ?? o.Total ?? 0),
            items: Number(o.items ?? o.Items ?? 0),
            status: String(o.status ?? o.Status ?? "pending").toLowerCase(),
            createdAt: o.createdAt ?? o.CreatedAt ?? undefined,
          })) : [],
        };
        setData(nextData);

        if (!nextData.shopName) {
          try {
            const profileRes = await api.get("/ShopOwner/profile", {
              params: Number.isFinite(user.userId) ? { userId: user.userId } : undefined,
            });
            const profile = profileRes.data || {};
            const profileName = profile.shopName ?? profile.ShopName ?? null;
            if (profileName) {
              setData((prev) => ({ ...prev, shopName: profileName }));
            }
          } catch {
            // ignore profile fallback errors
          }
        }
      } catch {
        // keep empty state
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user?.id, user?.userId]);

  const stats = useMemo(() => ([
    { label: "New Orders", value: String(data.newOrders), icon: ShoppingBag, color: "text-primary" },
    { label: "Income (This Month)", value: `${data.incomeMonth.toFixed(2)} EGP`, icon: Coins, color: "text-success" },
    { label: "Profit (This Month)", value: `${data.profitMonth.toFixed(2)} EGP`, icon: TrendingUp, color: "text-success" },
    { label: "Refunds", value: String(data.refunds), icon: TrendingDown, color: "text-destructive" },
  ]), [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {data.shopName ?? ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.shopName ? "Track new orders, income, and profit at a glance." : "Set your shop name in Settings."}
          </p>
        </div>
        <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
          <ArrowUpRight className="mr-1 h-3 w-3" /> Live overview
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading && (
              <div className="text-sm text-muted-foreground">Loading ordersâ€¦</div>
            )}
            {!loading && data.orders.length === 0 && (
              <div className="text-sm text-muted-foreground">No orders yet.</div>
            )}
            {data.orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{order.customer}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.items} item{order.items > 1 ? "s" : ""} · {order.total.toFixed(2)} EGP
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                  </span>
                  <Badge variant="outline" className={statusColors[order.status] ?? "bg-muted text-muted-foreground"}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Income</span>
            <span className="font-medium">{data.incomeMonth.toFixed(2)} EGP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Profit</span>
            <span className="font-medium">{data.profitMonth.toFixed(2)} EGP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Refunds</span>
            <span className="font-medium">{data.refunds}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopOwnerDashboard;
