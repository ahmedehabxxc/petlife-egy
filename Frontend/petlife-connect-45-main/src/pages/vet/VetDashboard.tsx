import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Clock, CalendarCheck } from "lucide-react";

const stats = [
  { label: "Active Consultations", value: "3", icon: MessageCircle, color: "text-primary" },
  { label: "Total Patients", value: "87", icon: Users, color: "text-secondary" },
  { label: "Pending Requests", value: "5", icon: Clock, color: "text-warning" },
  { label: "Completed Today", value: "8", icon: CalendarCheck, color: "text-success" },
];

const recentSessions = [
  { id: "1", pet: "Luna (Persian Cat)", owner: "Mariam K.", time: "10 min ago", status: "active" },
  { id: "2", pet: "Max (Golden Retriever)", owner: "Youssef S.", time: "1 hour ago", status: "active" },
  { id: "3", pet: "Rocky (German Shepherd)", owner: "Ahmed M.", time: "2 hours ago", status: "completed" },
  { id: "4", pet: "Tweety (Canary)", owner: "Sara E.", time: "3 hours ago", status: "completed" },
];

const VetDashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Vet Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center`}>
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
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{session.pet}</p>
                  <p className="text-xs text-muted-foreground">Owner: {session.owner}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{session.time}</span>
                  <Badge
                    variant="outline"
                    className={session.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}
                  >
                    {session.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VetDashboard;
