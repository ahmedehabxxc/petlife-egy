import {
  PawPrint,
  Heart,
  Search,
  Stethoscope,
  ShoppingBag,
  LayoutDashboard,
  Home,
  Package,
  ClipboardList,
  Users,
  ShieldCheck,
  BarChart3,
  Settings,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const petOwnerLinks = [
  { title: "Home", url: "/", icon: Home },
  { title: "My Pets", url: "/pets", icon: PawPrint },
  { title: "Browse Pets", url: "/browse", icon: Search },
  { title: "Adoption", url: "/browse?adoption=true", icon: Heart },
  { title: "Matching", url: "/matching", icon: MessageCircle },
  { title: "Find a Vet", url: "/vets", icon: Stethoscope },
  { title: "Consultations", url: "/consultations", icon: ClipboardList },
  { title: "Find Clinic", url: "/clinics", icon: MapPin },
  { title: "Shop", url: "/shop", icon: ShoppingBag },
  { title: "My Orders", url: "/orders", icon: Package },
];

const vetLinks = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/vet/dashboard", icon: LayoutDashboard },
  { title: "Consultations", url: "/vet/consultations", icon: ClipboardList },
  { title: "Medical Records", url: "/vet/records", icon: Stethoscope },
  { title: "Credentials", url: "/vet/credentials", icon: ShieldCheck },
];

const shopOwnerLinks = [
  { title: "Dashboard", url: "/shop-owner/dashboard", icon: LayoutDashboard },
  { title: "Inventory", url: "/shop-owner/inventory", icon: Package },
  { title: "Orders", url: "/shop-owner/orders", icon: ClipboardList },
];

const adminLinks = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Verifications", url: "/admin/verify", icon: ShieldCheck },
  { title: "Adoptions", url: "/admin/adoptions", icon: Heart },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuthStore();

  const role = user?.role;

  const sections: { label: string; links: typeof petOwnerLinks }[] = [];

  if (role === "pet_owner" || !role) {
    sections.push({ label: "Pet Owner", links: petOwnerLinks });
  }
  if (role === "veterinarian") {
    sections.push({ label: "Veterinarian", links: vetLinks });
  }
  if (role === "shop_owner") {
    sections.push({ label: "Shop", links: shopOwnerLinks });
  }
  if (role === "admin") {
    sections.push({ label: "Admin", links: adminLinks });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.links.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-muted/50"
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    end
                    className="hover:bg-muted/50"
                    activeClassName="bg-primary/10 text-primary font-medium"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
