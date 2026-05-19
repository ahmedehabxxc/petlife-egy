import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Search, CheckCircle2, XCircle, FileText, Clock, Stethoscope, Download } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

type CredentialPreview = {
  url: string;
  contentType: string;
  fileName: string;
};

const AdminVerifications = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [preview, setPreview] = useState<CredentialPreview | null>(null);

  useEffect(() => {
    const loadVerifications = async () => {
      try {
        const response = await api.get("/Admin/verifications");
        setRegistrations(response.data || []);
      } catch {
        toast.error("Failed to load verifications");
      }
    };

    void loadVerifications();
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.url) {
        window.URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  const filtered = registrations.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = registrations.filter((r) => r.status === "pending").length;

  const viewCredentials = async (vetId: string, fileNameHint?: string) => {
    try {
      const response = await api.get(`/Admin/verifications/${vetId}/credentials`, {
        responseType: "blob",
      });

      const blob = response.data as Blob;

      if (blob.type?.includes("json") || blob.size < 64) {
        const text = await blob.text();
        try {
          const err = JSON.parse(text);
          toast.error(err.message || "Could not load credential file");
        } catch {
          toast.error("Could not load credential file");
        }
        return;
      }

      const contentType =
        response.headers["content-type"]?.split(";")[0]?.trim() ||
        blob.type ||
        "application/octet-stream";
      const fileName =
        fileNameHint ||
        response.headers["content-disposition"]?.match(/filename="?([^"]+)"?/)?.[1] ||
        "credential";

      const objectUrl = window.URL.createObjectURL(new Blob([blob], { type: contentType }));

      if (contentType.startsWith("image/")) {
        setPreview({ url: objectUrl, contentType, fileName });
        return;
      }

      if (contentType === "application/pdf") {
        setPreview({ url: objectUrl, contentType, fileName });
        return;
      }

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error: any) {
      const message = error.response?.data?.message || "Could not open credential document";
      toast.error(message);
    }
  };

  const closePreview = () => {
    if (preview?.url) {
      window.URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
  };

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    try {
      if (action === "approved") {
        await api.post(`/Admin/verifications/${id}/approve`);
      } else {
        await api.post(`/Admin/verifications/${id}/reject`);
      }
      setRegistrations(registrations.map((r) => (r.id === id ? { ...r, status: action } : r)));
      toast.success(`Registration ${action}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update status";
      toast.error(message);
    }
  };

  return (
    <>
      <Dialog open={!!preview} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{preview?.fileName ?? "Credential document"}</DialogTitle>
          </DialogHeader>
          {preview?.contentType.startsWith("image/") && (
            <img
              src={preview.url}
              alt={preview.fileName}
              className="w-full max-h-[70vh] object-contain rounded-lg border bg-muted"
            />
          )}
          {preview?.contentType === "application/pdf" && (
            <iframe
              src={preview.url}
              title={preview.fileName}
              className="w-full h-[70vh] rounded-lg border"
            />
          )}
          {preview && (
            <Button variant="outline" className="gap-2" asChild>
              <a href={preview.url} download={preview.fileName}>
                <Download className="h-4 w-4" /> Download
              </a>
            </Button>
          )}
        </DialogContent>
      </Dialog>

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
                        <span className="font-medium">{req.yearsOfExperience ?? req.YearsOfExperience ?? 0} years</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {(req.documents || []).map((doc: string) => (
                        <Button
                          key={doc}
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => void viewCredentials(req.id, doc)}
                        >
                          <FileText className="h-3 w-3" /> View {doc}
                        </Button>
                      ))}
                      {(req.hasCredentials ?? req.HasCredentials) &&
                        (!req.documents || req.documents.length === 0) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => void viewCredentials(req.id)}
                        >
                          <FileText className="h-3 w-3" /> View credentials
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Submitted: {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : "—"}
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
    </>
  );
};

export default AdminVerifications;
