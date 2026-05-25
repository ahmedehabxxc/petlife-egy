import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
<<<<<<< HEAD
import CartDrawer from "@/components/CartDrawer";
=======
import CartDrawer from "@/Features/ShopOwner/Components/CartDrawer";
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
import NotificationDropdown from "@/components/NotificationDropdown";
import {
  PawPrint,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 h-14 border-b bg-card/80 backdrop-blur-md flex items-center px-4 gap-3">
      <SidebarTrigger className="mr-1 hidden md:flex" />

      <Link to="/" className="flex items-center gap-2 mr-auto">
        <PawPrint className="h-6 w-6 text-primary" />
        <span className="font-heading text-lg font-bold text-foreground hidden sm:inline">
          PetLife <span className="text-primary">Egypt</span>
        </span>
      </Link>

      <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {isAuthenticated ? (
        <div className="flex items-center gap-2">
          {user?.role === "pet_owner" && <CartDrawer />}

          <NotificationDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {user?.name}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/login")}>
            Log In
          </Button>
          <Button onClick={() => navigate("/register")}>Sign Up</Button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
