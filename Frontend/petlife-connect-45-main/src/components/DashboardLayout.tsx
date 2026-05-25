import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Outlet } from "react-router-dom";
<<<<<<< HEAD

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
=======
import { useAuthStore } from "@/stores/authStore";

const DashboardLayout = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar hidden on mobile, only show if authenticated */}
        {isAuthenticated && (
          <div className="hidden md:block">
            <AppSidebar />
          </div>
        )}
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
<<<<<<< HEAD
      {/* Bottom nav visible only on mobile */}
      <BottomNav />
=======
      {/* Bottom nav visible only on mobile, only show if authenticated */}
      {isAuthenticated && <BottomNav />}
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
    </SidebarProvider>
  );
};

export default DashboardLayout;
