import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, PawPrint, ShoppingBag, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import api from "@/services/api";

const COLORS = ["hsl(33, 96%, 41%)", "hsl(172, 66%, 40%)", "hsl(45, 93%, 58%)"];

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { label: "Total Users", value: "0", icon: Users, color: "text-primary", change: "" },
    { label: "Verified Vets", value: "0", icon: ShieldCheck, color: "text-secondary", change: "" },
    { label: "Pets Registered", value: "0", icon: PawPrint, color: "text-accent", change: "" },
    { label: "Orders This Month", value: "0", icon: ShoppingBag, color: "text-info", change: "" },
  ]);
  const [monthlyUsers, setMonthlyUsers] = useState<{ month: string; users: number }[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/Admin/dashboard");
        const data = response.data || {};

        setStats([
          { label: "Total Users", value: String(data.totalUsers ?? 0), icon: Users, color: "text-primary", change: "" },
          { label: "Verified Vets", value: String(data.verifiedVets ?? 0), icon: ShieldCheck, color: "text-secondary", change: "" },
          { label: "Pets Registered", value: String(data.petsRegistered ?? 0), icon: PawPrint, color: "text-accent", change: "" },
          { label: "Orders This Month", value: String(data.ordersThisMonth ?? 0), icon: ShoppingBag, color: "text-info", change: "" },
        ]);

        setMonthlyUsers(data.monthlyUsers ?? []);
        setRevenueData(data.revenueData ?? []);
        setRoleDistribution(data.roleDistribution ?? []);
      } catch {
        // Keep fallback values
      }
    };

    void loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>

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
              {s.change && <span className="ml-auto text-xs font-medium text-success">{s.change}</span>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> User Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyUsers}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="users" fill="hsl(33, 96%, 41%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-secondary" /> Revenue Trend (EGP)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(172, 66%, 40%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>User Role Distribution</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
