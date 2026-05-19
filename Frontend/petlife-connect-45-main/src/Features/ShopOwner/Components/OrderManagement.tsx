// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import './OrderManagement.css';
// import api from '../../services/api';

// interface Order {
//     orderId: number;
//     shopId: number;
//     status: 'Pending' | 'Assigned' | 'Shipped' | 'Delivered' | 'Cancelled';
//     totalPrice: number;
//     createdAt: string;
//     customer?: {
//         customerName: string;
//         email?: string;
//     };
//     orderItems: OrderItem[];
// }

// interface OrderItem {
//     orderItemId: number;
//     shopProductId: number;
//     quantity: number;
//     priceAtTime: number;
// }

// interface DeliveryPersonnel {
//     deliveryPersonnelId: number;
//     name: string;
//     vehicle: string;
//     isAvailable: boolean;
// }

// interface ChatMessage {
//     chatMessageId: number;
//     orderId: number;
//     senderId: number;
//     content: string;
//     createdAt: string;
// }

// const OrderManagement = ({ shopId }: { shopId: number }) => {
//     const [orders, setOrders] = useState<Order[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
//     const [statusFilter, setStatusFilter] = useState<string>('');
//     const [searchTerm, setSearchTerm] = useState('');
//     const [dateFilter, setDateFilter] = useState('');
//     const [showChat, setShowChat] = useState(false);
//     const [chatMessage, setChatMessage] = useState('');
//     const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
//     const [deliveryPersonnel, setDeliveryPersonnel] = useState<DeliveryPersonnel[]>([]);
//     const [sendingMessage, setSendingMessage] = useState(false);
//     const [assigningDelivery, setAssigningDelivery] = useState<number | null>(null);
//     const [updatingStatus, setUpdatingStatus] = useState<number | null>(null); 
//     const [notice, setNotice] = useState<string | null>(null);

//     const orderStats = useMemo(() => {
//         return {
//             total: orders.length,
//             pending: orders.filter(o => o.status === 'Pending').length,
//             assigned: orders.filter(o => o.status === 'Assigned').length,
//             shipped: orders.filter(o => o.status === 'Shipped').length,
//             delivered: orders.filter(o => o.status === 'Delivered').length,
//             cancelled: orders.filter(o => o.status === 'Cancelled').length,
//             totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0)
//         };
//     }, [orders]);

//     const fetchOrders = useCallback(async () => {
//         setLoading(true);
//         setError(null);
//         try {
//             const response = await api.get('/ShopOwner/orders', {
//                 params: {
//                     shopId,
//                     status: statusFilter || undefined,
//                     customerName: searchTerm || undefined,
//                     date: dateFilter || undefined
//                 }
//             });
            
//             const data = response.data;
//             const normalizedData: Order[] = Array.isArray(data) ? data : [];

//             // Frontend fallback filter by date in case backend ignores date query param.
//             const filteredByDate = dateFilter
//                 ? normalizedData.filter((order) => {
//                     const orderDate = new Date(order.createdAt).toISOString().slice(0, 10);
//                     return orderDate === dateFilter;
//                 })
//                 : normalizedData;

//             setOrders(filteredByDate);
//         } catch (err: any) {
//             setError(err.response?.data?.message || err.message);
//         } finally {
//             setLoading(false);
//         }
//     }, [shopId, statusFilter, searchTerm, dateFilter]);

//     const fetchDeliveryPersonnel = useCallback(async () => {
//         try {
//             const response = await api.get(`/ShopOwner/delivery-personnel?shopId=${shopId}`);
//             setDeliveryPersonnel(response.data);
//         } catch (error) {
//             console.error("Error fetching delivery personnel:", error);
//         }
//     }, [shopId]);

//     useEffect(() => {
//         if (shopId > 0) {
//             fetchOrders();
//             fetchDeliveryPersonnel();
//         }
//     }, [fetchOrders, fetchDeliveryPersonnel, shopId]);

//     const updateStatus = async (orderId: number, newStatus: string) => {
//         setUpdatingStatus(orderId);
//         try {
//             await api.patch(`/ShopOwner/orders/${orderId}/status`, newStatus);
//             await fetchOrders();
//             setNotice(`Order #${orderId} updated to ${newStatus}.`);
//         } catch (error) {
//             console.error("Status update error:", error);
//             alert("❌ Error updating status");
//         } finally {
//             setUpdatingStatus(null);
//         }
//     };

//     const assignDelivery = async (orderId: number, personnelId: number) => {
//         if (!personnelId) return;
        
//         setAssigningDelivery(orderId);
//         try {
//             await api.patch(`/ShopOwner/orders/${orderId}/assign-delivery`, personnelId);
//             await fetchOrders();
//             setNotice(`Driver assigned successfully for order #${orderId}.`);
//         } catch (error) {
//             console.error("Assign error:", error);
//             alert("❌ Error assigning driver");
//         } finally {
//             setAssigningDelivery(null);
//         }
//     };

//     const fetchChatHistory = async (orderId: number) => {
//         try {
//             const response = await api.get(`/ShopOwner/orders/${orderId}/messages`);
//             const data = response.data;
//             const normalized: ChatMessage[] = (Array.isArray(data) ? data : []).map((msg: any, idx: number) => ({
//                 chatMessageId: Number(msg.chatMessageId ?? msg.id ?? idx + 1),
//                 orderId: Number(msg.orderId ?? orderId),
//                 senderId: Number(msg.senderId ?? msg.senderID ?? msg.sender_id ?? 0),
//                 content: String(msg.content ?? msg.message ?? ''),
//                 createdAt: String(msg.createdAt ?? msg.created_at ?? new Date().toISOString()),
//             }));
//             setChatHistory(normalized);
//         } catch (error) {
//             console.error("Error fetching chat:", error);
//         }
//     };

//     const sendMessage = async (e?: React.MouseEvent) => {
//         if (e) e.preventDefault();

//         if (!selectedOrder || !chatMessage.trim() || sendingMessage) return;
//         const messageText = chatMessage.trim();
        
//         setSendingMessage(true);
//         try {
//             const optimisticMessage: ChatMessage = {
//                 chatMessageId: Date.now(),
//                 orderId: selectedOrder.orderId,
//                 senderId: Number(shopId),
//                 content: messageText,
//                 createdAt: new Date().toISOString(),
//             };
//             setChatHistory((prev) => [...prev, optimisticMessage]);
//             setChatMessage('');

//             await api.post(`/ShopOwner/orders/${selectedOrder.orderId}/message`, {
//                 senderId: Number(shopId),
//                 message: messageText,
//                 senderName: "Shop Owner"
//             });

//             await fetchChatHistory(selectedOrder.orderId);
//         } catch (error) {
//             console.error("Network error sending message:", error);
//             await fetchChatHistory(selectedOrder.orderId);
//         } finally {
//             setSendingMessage(false);
//         }
//     };

//     const handleSendMessage = () => {
//         void sendMessage();
//     };

//     const openChat = async (order: Order) => {
//         setSelectedOrder(order);
//         setShowChat(true);
//         await fetchChatHistory(order.orderId);
//     };

//     const handleKeyPress = (e: React.KeyboardEvent) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             handleSendMessage();
//         }
//     };

//     return (
//         <div className="order-management">
//             <header className="management-header">
//                 <h2>
//                     <span>📋 Order Management</span>
//                     <span className="order-count">({orderStats.total} orders)</span>
//                 </h2>
//                 <div className="filters-section">
//                     <input 
//                         placeholder="🔍 Search customer..." 
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)} 
//                         className="filter-input"
//                     />
//                     <input
//                         type="date"
//                         value={dateFilter}
//                         onChange={(e) => setDateFilter(e.target.value)}
//                         className="filter-input"
//                         title="Filter by order date"
//                     />
//                     <select 
//                         value={statusFilter}
//                         onChange={(e) => setStatusFilter(e.target.value)}
//                         className="filter-select"
//                     >
//                         <option value="">All Statuses</option>
//                         <option value="Pending">⏳ Pending</option>
//                         <option value="Assigned">📦 Assigned</option>
//                         <option value="Shipped">🚚 Shipped</option>
//                         <option value="Delivered">✅ Delivered</option>
//                         <option value="Cancelled">❌ Cancelled</option>
//                     </select>
//                 </div>
//             </header>

//             {/* Statistics Cards */}
//             {notice && (
//                 <div className="success-banner">
//                     <span>✅ {notice}</span>
//                     <button onClick={() => setNotice(null)}>Dismiss</button>
//                 </div>
//             )}

//             <div className="stats-cards">
//                 <div className="stat-card">
//                     <h4>Total Orders</h4>
//                     <span className="stat-number">{orderStats.total}</span>
//                 </div>
//                 <div className="stat-card">
//                     <h4>Pending</h4>
//                     <span className="stat-number" style={{ color: '#f8961e' }}>{orderStats.pending}</span>
//                 </div>
//                 <div className="stat-card">
//                     <h4>Revenue</h4>
//                     <span className="stat-number">{orderStats.totalRevenue.toFixed(2)} EGP</span> {/* 👈 EGP */}
//                 </div>
//                 <div className="stat-card">
//                     <h4>Delivered</h4>
//                     <span className="stat-number" style={{ color: '#4cc9f0' }}>{orderStats.delivered}</span>
//                 </div>
//             </div>

//             {error && (
//                 <div className="error-banner">
//                     <span>⚠️ {error}</span>
//                     <button onClick={fetchOrders}>Retry</button>
//                 </div>
//             )}

//             {loading ? (
//                 <div className="loader">Loading orders...</div>
//             ) : (
//                 <div className="orders-grid">
//                     {orders.length === 0 ? (
//                         <div className="empty-state">
//                             <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
//                             <h3>No orders found</h3>
//                             <p>Try adjusting your filters or check back later</p>
//                         </div>
//                     ) : (
//                         orders.map(order => (
//                             <div key={order.orderId} className={`order-card ${order.status.toLowerCase()}`}>
//                                 <div className="card-top">
//                                     <span className="order-number">#{order.orderId}</span>
//                                     <span className={`status-pill ${order.status.toLowerCase()}`}>
//                                         {order.status}
//                                     </span>
//                                 </div>

//                                 <div className="card-body">
//                                   <p className="customer-name">
//                                     👤 {order.customer?.customerName || 'Customer'}
//                                   </p>
//                                   <p className="order-date">
//                                     📅 {new Date(order.createdAt).toLocaleDateString('en-US', {
//                                       year: 'numeric',
//                                       month: 'short',
//                                       day: 'numeric',
//                                       hour: '2-digit',
//                                       minute: '2-digit'
//                                     })}
//                                   </p>
//                                   <p className="order-price">
//                                     💰 Total: {order.totalPrice.toFixed(2)} EGP
//                                   </p>
//                                 </div>

//                                 <div className="status-actions">
//                                   {order.status === 'Pending' && (
//                                     <>
//                                       <button
//                                         className="accept-button"
//                                         disabled={updatingStatus === order.orderId}
//                                         onClick={() => updateStatus(order.orderId, 'Assigned')}
//                                       >
//                                         ✅ Accept
//                                       </button>
//                                       <button
//                                         className="reject-button"
//                                         disabled={updatingStatus === order.orderId}
//                                         onClick={() => updateStatus(order.orderId, 'Cancelled')}
//                                       >
//                                         ❌ Reject
//                                       </button>
//                                     </>
//                                     )}
//                                     {order.status === 'Assigned' && (
//                                         <button
//                                             className="delivery-button"
//                                             disabled={updatingStatus === order.orderId}
//                                             onClick={() => updateStatus(order.orderId, 'Shipped')}
//                                         >
//                                             🚚 Out for Delivery
//                                         </button>
//                                     )}
//                                     {order.status === 'Shipped' && (
//                                         <button
//                                             className="complete-button"
//                                             disabled={updatingStatus === order.orderId}
//                                             onClick={() => updateStatus(order.orderId, 'Delivered')}
//                                         >
//                                             🎉 Mark as Completed
//                                         </button>
//                                     )}
//                                 </div>

//                                 <div className="card-footer">
//                                     {order.status === 'Pending' && (
//                                         <select 
//                                             onChange={(e) => assignDelivery(order.orderId, Number(e.target.value))}
//                                             value=""
//                                             className="assign-select"
//                                             disabled={assigningDelivery === order.orderId}
//                                         >
//                                             <option value="" disabled>
//                                                 {assigningDelivery === order.orderId ? 'Assigning...' : 'Assign Driver'}
//                                             </option>
//                                             {deliveryPersonnel.map(d => (
//                                                 <option key={d.deliveryPersonnelId} value={d.deliveryPersonnelId}>
//                                                     {d.name} {d.vehicle && `(${d.vehicle})`}
//                                                     {!d.isAvailable && ' (Busy)'}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                     )}
//                                     <button 
//                                         onClick={() => openChat(order)} 
//                                         className="chat-button"
//                                     >
//                                         💬 Chat
//                                     </button>
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                 </div>
//             )}

//             {showChat && selectedOrder && (
//                 <div className="chat-overlay" onClick={() => setShowChat(false)}>
//                     <div className="chat-window" onClick={e => e.stopPropagation()}>
//                         <div className="chat-header">
//                             <h3>Chat - Order #{selectedOrder.orderId}</h3>
//                             <button onClick={() => setShowChat(false)}>✕</button>
//                         </div>
//                         <div className="chat-body">
//                             {chatHistory.length === 0 ? (
//                                 <div className="empty-state" style={{ padding: '2rem' }}>
//                                     No messages yet. Start the conversation!
//                                 </div>
//                             ) : (
//                                 chatHistory.map((msg, i) => (
//                                     <div key={i} className={`msg ${Number(msg.senderId) === Number(shopId) ? 'mine' : 'theirs'}`}>
//                                         <div className="msg-bubble">{msg.content}</div>
//                                         <div style={{ fontSize: '0.7rem', marginTop: '0.2rem', color: '#999' }}>
//                                             {new Date(msg.createdAt).toLocaleTimeString()}
//                                         </div>
//                                     </div>
//                                 ))
//                             )}
//                         </div>
//                         <div className="chat-footer">
//                             <input 
//                                 value={chatMessage} 
//                                 onChange={(e) => setChatMessage(e.target.value)}
//                                 placeholder="Type your message..."
//                                 onKeyDown={handleKeyPress}
//                                 disabled={sendingMessage}
//                             />
//                             <button 
//                                 onClick={handleSendMessage} 
//                                 disabled={!chatMessage.trim() || sendingMessage}
//                             >
//                                 {sendingMessage ? 'Sending...' : 'Send'}
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default OrderManagement;