import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Search, CheckCircle2, XCircle, FileText, Clock, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { useVetRegistrationStore, type VetRegistration } from "@/stores/vetRegistrationStore";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminVerifications = () => {
  const { registrations, updateStatus } = useVetRegistrationStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = registrations.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = registrations.filter((r) => r.status === "pending").length;

  const handleAction = (id: string, action: "approved" | "rejected") => {
    updateStatus(id, action);
    toast.success(`Registration ${action}!`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Vet Verifications</h1>
        {pendingCount > 0 && (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize text-xs">
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No verification requests found.</div>
        ) : (
          filtered.map((req) => (
            <Card key={req.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-heading font-bold text-sm">{req.name}</span>
                      <Badge variant="outline" className={statusColors[req.status]}>{req.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{req.email}</p>

                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">License: </span>
                        <span className="font-medium">{req.licenseNumber}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Specialty: </span>
                        <span className="font-medium">{req.specialty}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clinic: </span>
                        <span className="font-medium">{req.clinicName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Experience: </span>
                        <span className="font-medium">{req.yearsOfExperience} years</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {req.documents.map((doc) => (
                        <span key={doc} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          <FileText className="h-3 w-3" /> {doc}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                    </p>

                    {req.reviewedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reviewed: {new Date(req.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {req.status === "pending" && (
                    <div className="flex sm:flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(req.id, "approved")}
                        className="bg-success hover:bg-success/90 text-success-foreground"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleAction(req.id, "rejected")}
                      >
                        <XCircle className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminVerifications;
