// import OrderManagement from "../Components/OrderManagement";
// import { useAuthStore } from "../../stores/authStore";

// const ShopOrdersPage = () => {
//   const { user } = useAuthStore();
//   const shopId = parseInt(user?.shopId || "0", 10);

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="font-heading text-3xl font-bold tracking-tight">Orders</h1>
//           <p className="text-muted-foreground mt-1">
//             Track and manage your customer orders and deliveries.
//           </p>
//         </div>
//       </div>
      
//       <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
//         <OrderManagement shopId={shopId} />
//       </div>
//     </div>
//   );
// };

// export default ShopOrdersPage;
