import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useVetRegistrationStore } from "@/stores/vetRegistrationStore";
import api from "@/services/api";
import { User, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PawPrint, ShieldCheck, Upload, FileText, Clock } from "lucide-react";
import { toast } from "sonner";
const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: "pet_owner", label: "Pet Owner", desc: "Manage pets, find matches & shop" },
  { value: "veterinarian", label: "Veterinarian", desc: "Offer consultations & care" },
  { value: "shop_owner", label: "Shop Owner", desc: "Sell pet products & manage orders" },
];

const specialties = [
  "General Practice", "Surgery", "Dermatology", "Dentistry",
  "Internal Medicine", "Ophthalmology", "Orthopedics", "Cardiology",
];

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("pet_owner");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Vet-specific fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);

  const { login } = useAuthStore();
  const { addRegistration } = useVetRegistrationStore();
  const navigate = useNavigate();

  const isVet = role === "veterinarian";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isVet) {
      if (!licenseNumber || !specialty || !clinicName || !yearsOfExperience) {
        toast.error("Please fill in all veterinarian credentials");
        return;
      }
      if (documents.length === 0) {
        toast.error("Please upload your credentials documents");
        return;
      }
    }

    setLoading(true);

    try {
      if (isVet) {
        // Vet registration goes to pending approval
        const regId = `vr-${Date.now()}`;
        const userId = `vet-pending-${Date.now()}`;

        addRegistration({
          id: regId,
          userId,
          name,
          email,
          licenseNumber,
          specialty,
          clinicName,
          yearsOfExperience: parseInt(yearsOfExperience),
          documents,
          status: "pending",
          submittedAt: new Date().toISOString(),
        });

        setSubmitted(true);
        toast.success("Registration submitted for review!");
      } else {
        // Non-vet roles: register through the backend API
        const response = await api.post("/Auth/register", {
          email,
          password,
          firstName: name,
          role,
        });

        const data = response.data;

        if (data.token) {
          const resolvedId = data.userId || data.authId || data.id || data.email;
          const resolvedEmail = data.email || email;
          const resolvedName = data.name || name;
          const resolvedRole = (data.role || role) as UserRole;
          const resolvedUserId = Number(data.userId);

          const realUser: User = {
            id: String(resolvedId),
            authId: data.authId || undefined,
            userId: Number.isFinite(resolvedUserId) && resolvedUserId > 0 ? resolvedUserId : undefined,
            email: resolvedEmail,
            name: resolvedName,
            role: resolvedRole,
            status: "active",
            createdAt: new Date().toISOString(),
          };

          login(realUser, data.token);
          toast.success("Account created!");
          navigate("/");
        } else {
          toast.success("Check your email to confirm your account.");
          navigate("/login");
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Show pending approval screen for vet after submission
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center">
              <Clock className="h-8 w-8 text-warning" />
            </div>
            <h2 className="font-heading text-xl font-bold">Registration Under Review</h2>
            <p className="text-sm text-muted-foreground">
              Thank you, <span className="font-medium text-foreground">{name}</span>! Your veterinarian registration has been submitted successfully.
            </p>
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-left space-y-2">
              <p className="text-sm font-medium text-warning">What happens next?</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Our admin team will review your credentials</li>
                <li>You'll receive a notification once approved</li>
                <li>After approval, you can log in and start consultations</li>
              </ul>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-left">
              <p className="text-xs text-muted-foreground mb-1">Submitted credentials:</p>
              <p className="text-xs"><span className="font-medium">License:</span> {licenseNumber}</p>
              <p className="text-xs"><span className="font-medium">Specialty:</span> {specialty}</p>
              <p className="text-xs"><span className="font-medium">Clinic:</span> {clinicName}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {documents.map((doc) => (
                  <span key={doc} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded border">
                    <FileText className="h-3 w-3" /> {doc}
                  </span>
                ))}
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <PawPrint className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-heading text-2xl">Create Account</CardTitle>
          <CardDescription>Join PetLife Egypt today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>

            <div className="space-y-3">
              <Label>I am a…</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  {roles.map((r) => (
                    <Label
                      key={r.value}
                      htmlFor={`role-${r.value}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${role === r.value ? "border-primary bg-primary/5" : "border-border"
                        }`}
                    >
                      <RadioGroupItem value={r.value} id={`role-${r.value}`} />
                      <div>
                        <span className="cursor-pointer font-medium">{r.label}</span>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
            </div>

            {/* Vet credential fields */}
            {isVet && (
              <>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <Label className="font-heading font-bold text-sm">Veterinarian Credentials</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your account will be reviewed by our admin team before activation.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license">License Number *</Label>
                  <Input id="license" placeholder="e.g. VET-EG-2024-1234" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required={isVet} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty *</Label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger><SelectValue placeholder="Select specialty…" /></SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic">Clinic Name *</Label>
                  <Input id="clinic" placeholder="Your clinic name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required={isVet} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input id="experience" type="number" min="0" max="50" placeholder="e.g. 5" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} required={isVet} />
                </div>

                <div className="space-y-2">
                  <Label>Credentials Documents *</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    {documents.length > 0 ? (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <span key={doc} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded mr-1">
                            <FileText className="h-3 w-3" /> {doc}
                          </span>
                        ))}
                        <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                        <p className="text-xs text-muted-foreground">Upload license, degree, or certificates</p>
                        <p className="text-[10px] text-muted-foreground">PDF, JPG, PNG (max 10MB each)</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : isVet ? "Submit for Review" : "Create Account"}
            </Button>

            {isVet && (
              <p className="text-xs text-center text-muted-foreground">
                Your account will be on hold until admin approval.
              </p>
            )}
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
