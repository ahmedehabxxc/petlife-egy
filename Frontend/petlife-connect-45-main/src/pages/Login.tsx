import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useVetRegistrationStore } from "@/stores/vetRegistrationStore";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PawPrint, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { getByEmail } = useVetRegistrationStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if this is a vet email with pending registration
      const vetReg = getByEmail(email);

      if (vetReg && vetReg.status === "pending") {
        toast.error("Your account is pending admin approval. Please wait for approval before logging in.", {
          duration: 5000,
          icon: <Clock className="h-4 w-4" />,
        });
        setLoading(false);
        return;
      }

      if (vetReg && vetReg.status === "rejected") {
        toast.error("Your veterinarian registration was rejected. Please contact support.", {
          duration: 5000,
          icon: <XCircle className="h-4 w-4" />,
        });
        setLoading(false);
        return;
      }

      // Call real backend API
      const response = await api.post("/Auth/login", { email, password });
      const data = response.data;

      const resolvedId = data.userId || data.authId || data.id || data.email;
      const resolvedEmail = data.email || email;
      const resolvedName = data.name || resolvedEmail.split("@")[0];
      const resolvedRole = data.role || "pet_owner";
      const resolvedUserId = Number(data.userId);

      const realUser = {
        id: String(resolvedId),
        authId: data.authId || undefined,
        userId: Number.isFinite(resolvedUserId) && resolvedUserId > 0 ? resolvedUserId : undefined,
        email: resolvedEmail,
        name: resolvedName,
        role: resolvedRole,
        status: "active" as const,
        createdAt: new Date().toISOString(),
      };

      login(realUser, data.token);
      toast.success("Welcome back!");
      navigate("/");
    } catch (error: any) {
      const message = error.response?.data?.message || "Invalid credentials";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <PawPrint className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-heading text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your PetLife Egypt account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
