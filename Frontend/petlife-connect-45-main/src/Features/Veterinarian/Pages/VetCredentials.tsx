import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Upload, FileText, Camera } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

const VetCredentials = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"pending" | "verified" | "rejected" | "not_submitted">("not_submitted");

  const [licenseNumber, setLicenseNumber] = useState("");
  const [university, setUniversity] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [availableHours, setAvailableHours] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credentialFile, setCredentialFile] = useState<File | null>(null);
  const [credentialsFileName, setCredentialsFileName] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/Veterinarians/me");
        const data = response.data || {};
        setLicenseNumber(data.licenseNumber ?? data.LicenseNumber ?? "");
        setUniversity(data.university ?? data.University ?? "");
        setYearsExperience(String(data.yearsOfExperience ?? data.YearsOfExperience ?? ""));
        setClinicName(data.clinicName ?? data.ClinicName ?? "");
        setClinicAddress(data.clinicAddress ?? data.ClinicAddress ?? "");
        setSpecialization(data.specialty ?? data.Specialty ?? "");
        setBio(data.bio ?? data.Bio ?? "");
        setPhone(data.phone ?? data.Phone ?? "");
        setConsultationFee(String(data.consultationFee ?? data.ConsultationFee ?? ""));
        setAvailableHours(data.availableHours ?? data.AvailableHours ?? "");
        setAvatarUrl(data.avatar ?? data.Avatar ?? null);
        setCredentialsFileName(data.credentialsFileName ?? data.CredentialsFileName ?? null);
        setStatus((data.isVerified ?? data.IsVerified) ? "verified" : "pending");
      } catch {
        setStatus("not_submitted");
      }
    };

    void loadProfile();
  }, []);

  const statusBadge: Record<string, { label: string; className: string }> = {
    verified: { label: "Verified", className: "bg-success/10 text-success border-success/20" },
    pending: { label: "Pending Review", className: "bg-warning/10 text-warning border-warning/20" },
    rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
    not_submitted: { label: "Not Submitted", className: "bg-muted text-muted-foreground" },
  };

  const handleAvatarChange = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post("/Veterinarians/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.avatarUrl ?? res.data?.AvatarUrl;
      if (url) {
        setAvatarUrl(url);
        toast.success("Profile photo updated");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload photo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/Veterinarians/me", {
        licenseNumber,
        specialization,
        clinicName,
        clinicAddress,
        university,
        yearsOfExperience: yearsExperience ? Number(yearsExperience) : null,
        bio,
        phone,
        consultationFee: consultationFee ? Number(consultationFee) : null,
        availableHours,
      });
      if (credentialFile) {
        const form = new FormData();
        form.append("file", credentialFile);
        const uploadRes = await api.post("/Veterinarians/credentials", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setCredentialsFileName(uploadRes.data?.fileName ?? credentialFile.name);
      }
      toast.success("Profile saved to database");
      const refresh = await api.get("/Veterinarians/me");
      const data = refresh.data || {};
      setYearsExperience(String(data.yearsOfExperience ?? data.YearsOfExperience ?? ""));
      setConsultationFee(String(data.consultationFee ?? data.ConsultationFee ?? ""));
      setPhone(data.phone ?? data.Phone ?? "");
    } catch (error: any) {
      const details = error.response?.data?.details;
      const message = error.response?.data?.message || "Submission failed";
      toast.error(details ? `${message}: ${details}` : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">My Profile</h1>
        <Badge variant="outline" className={statusBadge[status].className}>
          <ShieldCheck className="h-3 w-3 mr-1" /> {statusBadge[status].label}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
          <CardDescription>Photo, consultation fee, availability, and contact details shown to pet owners</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 ring-2 ring-border">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Profile photo</p>
                <p className="text-xs text-muted-foreground mb-2">Saved to your vet profile (AvatarUrl)</p>
                <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>
                  Upload profile photo
                </Button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleAvatarChange(file);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mobile Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 1XX XXX XXXX" required />
              </div>
              <div className="space-y-2">
                <Label>Consultation Fee (EGP)</Label>
                <Input type="number" min="0" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} placeholder="e.g. 200" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Available Hours</Label>
              <Input
                value={availableHours}
                onChange={(e) => setAvailableHours(e.target.value)}
                placeholder="e.g. Sat–Thu: 9:00 AM – 8:00 PM"
                required
              />
            </div>

            <Separator />

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
              <Label>Clinic Name</Label>
              <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Clinic Address</Label>
              <Input value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} placeholder="Street, city" />
            </div>
            <div className="space-y-2">
              <Label>Professional Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Credential document (license / certificate)</Label>
              <p className="text-xs text-muted-foreground">Saved as a file in the database for admin review</p>
              <div className="relative border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop or click to upload PDF or image</p>
                <input
                  type="file"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCredentialFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {credentialFile?.name || credentialsFileName || "No file uploaded"}
                </span>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VetCredentials;
