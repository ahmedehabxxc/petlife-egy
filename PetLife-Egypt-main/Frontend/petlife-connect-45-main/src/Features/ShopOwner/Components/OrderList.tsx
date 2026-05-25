// import React, { useState } from 'react';
// import useShopOrders from '../hooks/useShopOrders';
// import DeliveryAssigner from './DeliveryAssigner';
// import { OrderChat } from './OrderChat';
// const OrderList = ({ shopId }: { shopId: number }) => {
//   const [status, setStatus] = useState('');
//   const [name, setName] = useState('');
//   const { orders, loading, refresh } = useShopOrders(shopId, status, name);
//   return (
//     <div className="order-list-container">
//       <div className="flex gap-4 mb-6 bg-white p-4 rounded-md shadow">
//         <input
//           type="text"
//           placeholder="Filter by Customer Name..."
//           className="border p-2 rounded w-full"
//           onChange={(e) => setName(e.target.value)}
//         />
//         <select className="border p-2 rounded" onChange={(e) => setStatus(e.target.value)}>
//           <option value="">All Statuses</option>
//           <option value="Pending">Pending</option>
//           {/* <option value="Assigned">Assigned</option> */}
//           <option value="Shipped">Shipped</option>
//         </select>
//       </div>

//       {loading ? <p>Loading orders...</p> : (
//         <div className="space-y-4">
//           {orders.map(order => (
//             <div key={order.orderId} className="p-4 bg-white rounded shadow border-l-4 border-green-500">
//               <div className="flex justify-between">
//                 <div>
//                   <h4 className="font-bold">Order #{order.orderId}</h4>
//                   <p>Customer: {order.customerName}</p>
//                   <p className="text-sm text-gray-500">Status: {order.status}</p>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <OrderChat orderId={order.orderId} />
//                   <DeliveryAssigner orderId={order.orderId} onAssigned={refresh} />
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default OrderList;