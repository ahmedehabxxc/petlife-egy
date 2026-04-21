import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";
import { User, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }

      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

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
  const [university, setUniversity] = useState("");
  const [bio, setBio] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);
  const [credentialFiles, setCredentialFiles] = useState<File[]>([]);

  const { login } = useAuthStore();
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
        const primaryCredential = credentialFiles[0] ?? null;
        const credentialFileBase64 = primaryCredential
          ? await fileToBase64(primaryCredential)
          : null;

        const response = await api.post("/Auth/register", {
          email,
          password,
          firstName: name,
          role,
          licenseNumber,
          specialization: specialty,
          clinicName,
          university,
          yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
          bio,
          credentialFileBase64,
          credentialFileName: primaryCredential?.name ?? null,
          credentialContentType: primaryCredential?.type ?? null,
        });

        const data = response.data;
        const token = data?.token as string | undefined;

        if (primaryCredential && token) {
          const formData = new FormData();
          formData.append("file", primaryCredential);

          await api.post("/Veterinarians/credentials", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
        }

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
            status: data.status || "active",
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

  // Reusable left panel
  const leftPanel = (
    <div
      className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsla(33, 96%, 41%, 1.00) 0%, hsla(38, 91%, 44%, 1.00) 100%)",
      }}
    >
      {/* Floating paw decorations */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-20 text-white">
        <span className="absolute text-5xl top-[8%] left-[10%] animate-bounce" style={{ animationDelay: "0s", animationDuration: "3.5s" }}>🐾</span>
        <span className="absolute text-4xl top-[20%] right-[15%] animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "4s" }}>🐾</span>
        <span className="absolute text-6xl bottom-[25%] left-[18%] animate-bounce" style={{ animationDelay: "1s", animationDuration: "3s" }}>🐾</span>
        <span className="absolute text-3xl bottom-[12%] right-[22%] animate-bounce" style={{ animationDelay: "1.5s", animationDuration: "4.5s" }}>🐾</span>
        <span className="absolute text-5xl top-[50%] left-[5%] animate-bounce" style={{ animationDelay: "2s", animationDuration: "3.8s" }}>🐾</span>
      </div>

      {/* Pet mascot image */}
      <div className="relative z-10 flex items-center justify-center">
        {/* Warm beige radial glow */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: "440px",
            height: "440px",
            background: "radial-gradient(circle, rgba(245,235,215,0.45) 0%, rgba(210,175,130,0.22) 55%, transparent 78%)",
            filter: "blur(22px)",
          }}
        />
        <img
          src="/loginPet.png"
          alt="PetLife Mascot"
          className="relative w-[600px] max-w-[90%]"
          style={{
            animation: "float 3s ease-in-out infinite",

          }}
        />
      </div>

      {/* Tagline */}
      <p className="relative z-10 mt-8 text-white/90 text-xl font-semibold tracking-wide text-center px-6">
        Your pet's life, all in one place
      </p>

      {/* Float animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
      `}</style>
    </div>
  );

  // Show pending approval screen for vet after submission
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        {leftPanel}

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center bg-background p-6 sm:p-10">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <img
                src="/logo.png"
                alt="PetLife Egypt"
                className="w-28 mb-1 drop-shadow-md transition-transform duration-300 hover:scale-105"
              />
            </div>

            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
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
                  {university && <p className="text-xs"><span className="font-medium">University:</span> {university}</p>}
                  {bio && <p className="text-xs"><span className="font-medium">Bio:</span> {bio}</p>}
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {leftPanel}

      {/* ── RIGHT PANEL — Registration Form ── */}
      <div className="flex-1 flex items-start justify-center bg-background p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md py-6">


          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <img
                src="/logo.png"
                alt="PetLife Egypt"
                className="w-24 h-24 mx-auto mb-4 rounded-full object-cover shadow-sm border-4 border-background"
              />
              <CardTitle className="font-heading text-2xl">Create Account</CardTitle>
              <CardDescription className="text-base">Join PetLife Egypt today</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11" />
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
                      <Input id="license" placeholder="e.g. VET-EG-2024-1234" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required={isVet} className="h-11" />
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
                      <Input id="clinic" placeholder="Your clinic name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required={isVet} className="h-11" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience *</Label>
                      <Input id="experience" type="number" min="0" max="50" placeholder="e.g. 5" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} required={isVet} className="h-11" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Input id="university" placeholder="e.g. Cairo University" value={university} onChange={(e) => setUniversity(e.target.value)} className="h-11" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell the admin about your experience and area of care"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Credentials Documents *</Label>
                      <div
                        className="relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
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
                        <input
                          type="file"
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setCredentialFiles(files);
                            setDocuments(files.map((f) => f.name));
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold" 
                  disabled={loading}
                >
                  {loading ? "Creating…" : isVet ? "Submit for Review" : "Create Account"}
                </Button>

                {isVet && (
                  <p className="text-xs text-center text-muted-foreground">
                    Your account will be on hold until admin approval.
                  </p>
                )}
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
