import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthHashHandler from "@/components/AuthHashHandler";
<<<<<<< HEAD
import ChatbotWidget from "@/components/ChatbotWidget";
=======
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AccountSettings from "./pages/AccountSettings";
<<<<<<< HEAD
import MyPets from "./pages/MyPets";
import RegisterPet from "./pages/RegisterPet";
import PetProfile from "./pages/PetProfile";
import PetMatching from "./pages/PetMatching";
import BrowsePets from "./pages/BrowsePets";
import VetSearch from "./pages/VetSearch";
import VetProfilePage from "./pages/VetProfile";
import ConsultationHistory from "./pages/ConsultationHistory";
import ClinicFinder from "./pages/ClinicFinder";
import ProductCatalog from "./pages/ProductCatalog";
import ProductDetails from "./pages/ProductDetails";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import OrderHistory from "./pages/OrderHistory";
import VetDashboard from "./pages/vet/VetDashboard";
import VetConsultations from "./pages/vet/VetConsultations";
import VetMedicalRecords from "./pages/vet/VetMedicalRecords";
import VetCredentials from "./pages/vet/VetCredentials";
import ShopOwnerDashboard from "./pages/shop-owner/ShopOwnerDashboard";
import ShopOwnerInventory from "./pages/shop-owner/ShopOwnerInventory";
import ShopOwnerOrders from "./pages/shop-owner/ShopOwnerOrders";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminAdoptions from "./pages/admin/AdminAdoptions";
import AdminReports from "./pages/admin/AdminReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthHashHandler />
        <ChatbotWidget />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<BrowsePets />} />
            <Route path="/vets" element={<VetSearch />} />
            <Route path="/vets/:id" element={<VetProfilePage />} />
            <Route path="/clinics" element={<ClinicFinder />} />
            <Route path="/shop" element={<ProductCatalog />} />
            <Route path="/shop/:id" element={<ProductDetails />} />

            <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />

            <Route path="/pets" element={<ProtectedRoute allowedRoles={["pet_owner"]}><MyPets /></ProtectedRoute>} />
            <Route path="/pets/register" element={<ProtectedRoute allowedRoles={["pet_owner"]}><RegisterPet /></ProtectedRoute>} />
            <Route path="/pets/:id" element={<ProtectedRoute allowedRoles={["pet_owner"]}><PetProfile /></ProtectedRoute>} />
            <Route path="/consultations" element={<ProtectedRoute allowedRoles={["pet_owner"]}><ConsultationHistory /></ProtectedRoute>} />
            <Route path="/matching" element={<ProtectedRoute allowedRoles={["pet_owner"]}><PetMatching /></ProtectedRoute>} />

            <Route path="/vet/dashboard" element={<ProtectedRoute allowedRoles={["veterinarian"]}><VetDashboard /></ProtectedRoute>} />
            <Route path="/vet/consultations" element={<ProtectedRoute allowedRoles={["veterinarian"]}><VetConsultations /></ProtectedRoute>} />
            <Route path="/vet/records" element={<ProtectedRoute allowedRoles={["veterinarian"]}><VetMedicalRecords /></ProtectedRoute>} />
            <Route path="/vet/credentials" element={<ProtectedRoute allowedRoles={["veterinarian"]}><VetCredentials /></ProtectedRoute>} />

            <Route path="/shop-owner/dashboard" element={<ProtectedRoute allowedRoles={["shop_owner"]}><ShopOwnerDashboard /></ProtectedRoute>} />
            <Route path="/shop-owner/inventory" element={<ProtectedRoute allowedRoles={["shop_owner"]}><ShopOwnerInventory /></ProtectedRoute>} />
            <Route path="/shop-owner/orders" element={<ProtectedRoute allowedRoles={["shop_owner"]}><ShopOwnerOrders /></ProtectedRoute>} />

            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/verify" element={<ProtectedRoute allowedRoles={["admin"]}><AdminVerifications /></ProtectedRoute>} />
            <Route path="/admin/adoptions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAdoptions /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
=======
import MyPets from "./Features/PetOwner/Pages/MyPets";
import RegisterPet from "./Features/PetOwner/Pages/RegisterPet";
import PetProfile from "./Features/PetOwner/Pages/PetProfile";
import PetMatching from "./Features/PetOwner/Pages/PetMatching";
import BrowsePets from "./Features/PetOwner/Pages/BrowsePets";
import VetSearch from "./Features/PetOwner/Pages/VetSearch";
import VetProfilePage from "./pages/VetProfile";
import ConsultationHistory from "./Features/PetOwner/Pages/ConsultationHistory";
import ClinicFinder from "./Features/PetOwner/Pages/ClinicFinder";
import ProductCatalog from "./pages/ProductCatalog";
import ProductDetails from "./pages/ProductDetails";
import Checkout from "./pages/Checkout";
import OrderTracking from "./Features/PetOwner/Pages/OrderTracking";
import OrderHistory from "./Features/PetOwner/Pages/OrderHistory";
import VetDashboard from "./Features/Veterinarian/Pages/VetDashboard";
import VetConsultations from "./Features/Veterinarian/Pages/VetConsultations";
import VetMedicalRecords from "./Features/Veterinarian/Pages/VetMedicalRecords";
import VetCredentials from "./Features/Veterinarian/Pages/VetCredentials";
import ShopOwnerDashboard from "./Features/ShopOwner/Pages/ShopOwnerDashboard";
import ShopOwnerInventory from "./Features/ShopOwner/Pages/ShopOwnerInventory";
import ShopOwnerOrders from "./Features/ShopOwner/Pages/ShopOwnerOrders";
import AdminDashboard from "./Features/Admin/Pages/AdminDashboard";
import AdminUsers from "./Features/Admin/Pages/AdminUsers";
import AdminVerifications from "./Features/Admin/Pages/AdminVerifications";
import AdminAdoptions from "./Features/Admin/Pages/AdminAdoptions";
import AdminReports from "./Features/Admin/Pages/AdminReports";
import NotFound from "./pages/NotFound";
import ChatBot from './ChatBot';
import { useAuthStore } from "@/stores/authStore";

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthHashHandler />

          {/* ChatBot only available when logged in */}
          {isAuthenticated && <ChatBot />}

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/browse" element={<BrowsePets />} />
              <Route path="/vets" element={<VetSearch />} />
              <Route path="/vets/:id" element={<VetProfilePage />} />
              <Route path="/clinics" element={<ClinicFinder />} />
              <Route path="/shop" element={<ProductCatalog />} />
              <Route path="/shop/:id" element={<ProductDetails />} />

              <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />

              <Route path="/pets" element={<ProtectedRoute allowedRoles={["pet_owner"]}><MyPets /></ProtectedRoute>} />
              <Route path="/pets/register" element={<ProtectedRoute allowedRoles={["pet_owner"]}><RegisterPet /></ProtectedRoute>} />
              <Route path="/pets/:id" element={<ProtectedRoute allowedRoles={["pet_owner"]}><PetProfile /></ProtectedRoute>} />
              <Route path="/consultations" element={<ProtectedRoute allowedRoles={["pet_owner"]}><ConsultationHistory /></ProtectedRoute>} />
              <Route path="/matching" element={<ProtectedRoute allowedRoles={["pet_owner"]}><PetMatching /></ProtectedRoute>} />

              <Route path="/vet/dashboard" element={<ProtectedRoute allowedRoles={["veterinarian"]}><VetDashboard /></ProtectedRoute>} />
              <Route path="/vet/consultations" element={<ProtectedRoute allowedRoles={["veterinarian"]}><VetConsultations /></ProtectedRoute>} />
              <Route path="/vet/records" element={<ProtectedRoute allowedRoles={["veterinarian"]}><VetMedicalRecords /></ProtectedRoute>} />
              <Route path="/vet/credentials" element={<ProtectedRoute allowedRoles={["veterinarian"]}><VetCredentials /></ProtectedRoute>} />

              <Route path="/shop-owner/dashboard" element={<ProtectedRoute allowedRoles={["shop_owner"]}><ShopOwnerDashboard /></ProtectedRoute>} />
              <Route path="/shop-owner/inventory" element={<ProtectedRoute allowedRoles={["shop_owner"]}><ShopOwnerInventory /></ProtectedRoute>} />
              <Route path="/shop-owner/orders" element={<ProtectedRoute allowedRoles={["shop_owner"]}><ShopOwnerOrders /></ProtectedRoute>} />

              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/verify" element={<ProtectedRoute allowedRoles={["admin"]}><AdminVerifications /></ProtectedRoute>} />
              <Route path="/admin/adoptions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAdoptions /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>} />

            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
