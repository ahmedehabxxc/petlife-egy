import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Upload, FileText } from "lucide-react";
import { toast } from "sonner";

const VetCredentials = () => {
  const [loading, setLoading] = useState(false);
  const [status] = useState<"pending" | "verified" | "rejected" | "not_submitted">("pending");

  const [licenseNumber, setLicenseNumber] = useState("VET-EG-2024-1234");
  const [university, setUniversity] = useState("Cairo University — Faculty of Veterinary Medicine");
  const [yearsExperience, setYearsExperience] = useState("8");
  const [specialization, setSpecialization] = useState("General Practice, Dermatology");
  const [bio, setBio] = useState("Experienced veterinarian with 8 years of practice specializing in small animal care and dermatology.");

  const statusBadge: Record<string, { label: string; className: string }> = {
    verified: { label: "Verified", className: "bg-success/10 text-success border-success/20" },
    pending: { label: "Pending Review", className: "bg-warning/10 text-warning border-warning/20" },
    rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
    not_submitted: { label: "Not Submitted", className: "bg-muted text-muted-foreground" },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("Credentials submitted for review");
    } catch {
      toast.error("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">My Credentials</h1>
        <Badge variant="outline" className={statusBadge[status].className}>
          <ShieldCheck className="h-3 w-3 mr-1" /> {statusBadge[status].label}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
          <CardDescription>Submit your credentials for admin verification</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Input type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>University / Institution</Label>
              <Input value={university} onChange={(e) => setUniversity(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Professional Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Upload Documents</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">License, certificates, ID (PDF, JPG, PNG)</p>
                <Input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" multiple />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">vet_license_2024.pdf (uploaded)</span>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit Credentials"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VetCredentials;
