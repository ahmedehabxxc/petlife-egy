import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  Home,
  PawPrint,
  Search,
  ShoppingBag,
  Stethoscope,
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  url: string;
  icon: React.ElementType;
}

const petOwnerNav: NavItem[] = [
  { label: "Home", url: "/", icon: Home },
  { label: "Pets", url: "/pets", icon: PawPrint },
  { label: "Browse", url: "/browse", icon: Search },
  { label: "Shop", url: "/shop", icon: ShoppingBag },
  { label: "Settings", url: "/settings", icon: Settings },
];

const vetNav: NavItem[] = [
  { label: "Dashboard", url: "/vet/dashboard", icon: LayoutDashboard },
  { label: "Consults", url: "/vet/consultations", icon: ClipboardList },
  { label: "Records", url: "/vet/records", icon: Stethoscope },
  { label: "Settings", url: "/settings", icon: Settings },
];

const shopOwnerNav: NavItem[] = [
  { label: "Dashboard", url: "/shop-owner/dashboard", icon: LayoutDashboard },
  { label: "Inventory", url: "/shop-owner/inventory", icon: Package },
  { label: "Orders", url: "/shop-owner/orders", icon: ClipboardList },
  { label: "Settings", url: "/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", url: "/admin/users", icon: Users },
  { label: "Verify", url: "/admin/verify", icon: Stethoscope },
  { label: "Settings", url: "/settings", icon: Settings },
];

const guestNav: NavItem[] = [
  { label: "Home", url: "/", icon: Home },
  { label: "Browse", url: "/browse", icon: Search },
  { label: "Vets", url: "/vets", icon: Stethoscope },
  { label: "Shop", url: "/shop", icon: ShoppingBag },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const role = user?.role;
  let items: NavItem[];

  switch (role) {
    case "veterinarian":
      items = vetNav;
      break;
    case "shop_owner":
      items = shopOwnerNav;
      break;
    case "admin":
      items = adminNav;
      break;
    case "pet_owner":
      items = petOwnerNav;
      break;
    default:
      items = guestNav;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-card/95 backdrop-blur-md">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const active = location.pathname === item.url;
          return (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
