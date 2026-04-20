import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";
import { toast } from "sonner";
import { User } from "@/types";

const AuthHashHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    if (!location.hash) return;

    const hash = location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (!accessToken && !error) return;

    const clearHash = () => {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      );
    };

    if (error) {
      toast.error(errorDescription || "Verification failed. Please try again.");
      clearHash();
      navigate("/login");
      return;
    }

    if (!accessToken) return;

    localStorage.setItem("token", accessToken);

    const hydrateSession = async () => {
      try {
        const response = await api.get("/Auth/me");
        const data = response.data || {};
        const resolvedId = data.userId || data.authId || data.id || data.email;
        const resolvedUserId = Number(data.userId);

        const realUser: User = {
          id: String(resolvedId),
          authId: data.authId || undefined,
          userId: Number.isFinite(resolvedUserId) && resolvedUserId > 0 ? resolvedUserId : undefined,
          email: data.email || "",
          name: data.name || data.email || "User",
          role: data.role || "pet_owner",
          status: data.status || "active",
          createdAt: new Date().toISOString(),
        };

        if (realUser.status === "pending_approval") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          toast.error("Your veterinarian account is pending admin approval.");
          clearHash();
          navigate("/login");
          return;
        }

        login(realUser, accessToken);
        toast.success("Email verified. You're signed in.");
        clearHash();
        navigate("/");
      } catch (err: any) {
        localStorage.removeItem("token");
        const message =
          err?.response?.data?.message ||
          "Email verified, but we couldn't load your profile yet.";
        toast.error(message);
        clearHash();
        navigate("/login");
      }
    };

    void hydrateSession();
  }, [location.hash, login, navigate]);

  return null;
};

export default AuthHashHandler;
