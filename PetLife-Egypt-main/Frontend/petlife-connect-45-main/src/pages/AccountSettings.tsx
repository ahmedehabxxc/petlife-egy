import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/services/api";

const AccountSettings = () => {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);
  const isShopOwner = user?.role === "shop_owner";

  useEffect(() => {
    const loadShop = async () => {
      if (!isShopOwner) return;
      try {
        const response = await api.get("/ShopOwner/profile", {
          params: Number.isFinite(user?.userId) ? { userId: user?.userId } : undefined,
        });
        const payload = response.data || {};
        setShopName(payload.shopName ?? payload.ShopName ?? "");
      } catch {
        setShopName("");
      }
    };

    void loadShop();
  }, [isShopOwner, user?.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      updateUser({ name, email, phone });
      if (isShopOwner) {
        await api.put("/ShopOwner/profile", { shopName });
      }
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-6">Account Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 xxx xxx xxxx" />
            </div>
            {isShopOwner && (
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
              </div>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettings;
