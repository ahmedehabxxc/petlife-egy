import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import VetPendingApproval from "@/pages/VetPendingApproval";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/Auth/login", { email, password });
      const data = response.data;

      const resolvedId = data.userId || data.authId || data.id || data.email;
      const resolvedEmail = data.email || email;
      const resolvedName = data.name || resolvedEmail.split("@")[0];
      const resolvedRole = data.role || "pet_owner";
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
      toast.success("Welcome back!");
      navigate("/");
    } catch (error: any) {
      const status = error.response?.data?.status;
      if (error.response?.status === 403 && status === "pending_approval") {
        setPendingApproval(true);
        return;
      }
      const message = error.response?.data?.message || "Invalid credentials";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (pendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <VetPendingApproval
          email={email}
          onBackToLogin={() => setPendingApproval(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT PANEL — Pet image & tagline (logo removed) */}
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
      </div>

      {/* RIGHT PANEL — Login Form with Logo */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <img
                src="/logo.png"
                alt="PetLife Egypt"
                className="w-24 h-24 mx-auto mb-4 rounded-full object-cover shadow-sm border-4 border-background"
              />
              <CardTitle className="font-heading text-2xl">Welcome Back</CardTitle>
              <CardDescription className="text-base">Sign in to your PetLife Egypt account</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
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
                    className="h-11"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold" 
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Sign Up
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
      `}</style>
    </div>
  );
};

export default Login;