import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Clock, CalendarCheck } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";

interface SessionItem {
  id: string;
  pet: string;
  owner: string;
  time: string;
  status: string;
}

const VetDashboard = () => {
  const { user } = useAuthStore();
  const resolvedUserId = user?.userId ?? (Number.isFinite(Number(user?.id)) ? Number(user?.id) : null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    patients: 0,
    pending: 0,
    completedToday: 0,
  });

  useEffect(() => {
    const load = async () => {
      if (!resolvedUserId) return;
      try {
        const response = await api.get("/Consultations/for-vet", {
          params: { userId: resolvedUserId },
        });
        const rows = Array.isArray(response.data) ? response.data : [];
        const now = new Date();
        const today = now.toDateString();

        const active = rows.filter((r: any) => (r.status ?? r.Status) === "accepted").length;
        const pending = rows.filter((r: any) => (r.status ?? r.Status) === "pending").length;
        const completedToday = rows.filter((r: any) => {
          if ((r.status ?? r.Status) !== "completed") return false;
          const date = new Date(r.createdAt ?? r.CreatedAt ?? "");
          return date.toDateString() === today;
        }).length;
        const patients = new Set(rows.map((r: any) => String(r.petOwnerId ?? r.PetOwnerId ?? ""))).size;

        const recent = [...rows]
          .filter((r: any) => ["accepted", "completed"].includes(r.status ?? r.Status))
          .sort((a: any, b: any) => new Date(b.createdAt ?? b.CreatedAt).getTime() - new Date(a.createdAt ?? a.CreatedAt).getTime())
          .slice(0, 4)
          .map((r: any) => ({
            id: String(r.id ?? r.Id ?? ""),
            pet: `${r.petName ?? r.PetName ?? "Pet"} (${r.petSpecies ?? r.PetSpecies ?? "Unknown"})`,
            owner: r.petOwnerName ?? r.PetOwnerName ?? "Owner",
            time: new Date(r.createdAt ?? r.CreatedAt ?? new Date()).toLocaleString(),
            status: (r.status ?? r.Status ?? "accepted") as string,
          }));

        setStats({ active, patients, pending, completedToday });
        setSessions(recent);
      } catch {
        // ignore
      }
    };

    void load();
  }, [resolvedUserId]);

  const statsCards = useMemo(() => ([
    { label: "Active Consultations", value: stats.active, icon: MessageCircle, color: "text-primary" },
    { label: "Total Patients", value: stats.patients, icon: Users, color: "text-secondary" },
    { label: "Pending Requests", value: stats.pending, icon: Clock, color: "text-warning" },
    { label: "Completed Today", value: stats.completedToday, icon: CalendarCheck, color: "text-success" },
  ]), [stats]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Vet Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s) => (
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
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent sessions.</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{session.pet}</p>
                    <p className="text-xs text-muted-foreground">Owner: {session.owner}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{session.time}</span>
                    <Badge
                      variant="outline"
                      className={session.status === "accepted" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}
                    >
                      {session.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VetDashboard;
