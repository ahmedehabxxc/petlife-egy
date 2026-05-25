import { useState, useEffect, useRef } from 'react';
import styles from './OrderChat.module.css';
 
// Types for Order and Message data
interface Order {
  orderId: number;
  customerId: number;
  status: string;
  totalPrice: number;
  createdAt: string;
}
interface Message {
  messageId: number;
  orderId: number;
  senderType: string;
  senderName: string;
  message: string;
  sentAt: string;
}
interface Props {
  shopOwnerName: string;  // passed from App.tsx (logged-in user name)
  shopId?: number;        // defaults to 12
}
 
export const OrderChat = ({ shopOwnerName, shopId = 12 }: Props) => {
  const [orders, setOrders]                   = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder]     = useState<Order | null>(null);
  const [messages, setMessages]               = useState<Message[]>([]);
  const [newMessage, setNewMessage]           = useState('');
  const [loadingOrders, setLoadingOrders]     = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending]                 = useState(false);
  const [error, setError]                     = useState('');
  const messagesEndRef                        = useRef<HTMLDivElement>(null);
 
  // Load orders when component mounts
  useEffect(() => { fetchOrders(); }, []);
 
  // Scroll to bottom of chat when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 
  // Auto-refresh messages every 5 seconds when a chat is open
  useEffect(() => {
    if (!selectedOrder) return;
    const interval = setInterval(() => fetchMessages(selectedOrder.orderId), 5000);
    return () => clearInterval(interval);
  }, [selectedOrder]);
 
  const fetchOrders = async () => {
    setLoadingOrders(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5262/api/OrderChat/orders/${shopId}`);
      const data = await res.json();
      if (res.ok) setOrders(data);
      else setError(data.message || 'Failed to load orders.');
    } catch {
      setError('Cannot reach the server. Make sure the backend is running.');
    } finally {
      setLoadingOrders(false);
    }
  };
 
  const fetchMessages = async (orderId: number) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`http://localhost:5262/api/OrderChat/${orderId}`);
      const data = await res.json();
      if (res.ok) setMessages(data);
    } catch {
      // silent fail on auto-refresh
    } finally {
      setLoadingMessages(false);
    }
  };
 
  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order);
    setMessages([]);
    setNewMessage('');
    setError('');
    await fetchMessages(order.orderId);
  };
 
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedOrder) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5262/api/OrderChat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId:    selectedOrder.orderId,
          senderName: shopOwnerName,
          message:    newMessage.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewMessage('');
        await fetchMessages(selectedOrder.orderId);
      } else {
        setError(data.message || 'Failed to send message.');
      }
    } catch {
      setError('Cannot reach the server.');
    } finally {
      setSending(false);
    }
  };
 
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };
 
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':   return styles.statusPending;
      case 'confirmed': return styles.statusConfirmed;
      case 'delivered': return styles.statusDelivered;
      case 'cancelled': return styles.statusCancelled;
      default:          return styles.statusPending;
    }
  };
 
  return (
    <div className={styles.container}>
 
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>💬</div>
        <div>
          <h1 className={styles.title}>Order Chat</h1>
          <p className={styles.subtitle}>Contact customers about their orders</p>
        </div>
      </div>
 
      <div className={styles.layout}>
 
        {/* LEFT: Orders list panel */}
        <div className={styles.ordersList}>
          <div className={styles.ordersHeader}>
            <span>Orders</span>
            <button className={styles.refreshBtn} onClick={fetchOrders}>↻</button>
          </div>
          {loadingOrders ? (
            <div className={styles.loadingText}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyOrders}>No orders found.</div>
          ) : (
            orders.map(order => (
              <div
                key={order.orderId}
                className={`${styles.orderItem} ${selectedOrder?.orderId === order.orderId ? styles.orderItemActive : ''}`}
                onClick={() => handleSelectOrder(order)}
              >
                <div className={styles.orderItemTop}>
                  <span className={styles.orderId}>Order #{order.orderId}</span>
                  <span className={`${styles.statusBadge} ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className={styles.orderItemBottom}>
                  <span className={styles.orderPrice}>{order.totalPrice} EGP</span>
                  <span className={styles.orderDate}>{formatTime(order.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
 
        {/* RIGHT: Chat panel */}
        <div className={styles.chatPanel}>
          {!selectedOrder ? (
            <div className={styles.noChatSelected}>
              <div className={styles.noChatIcon}>💬</div>
              <p>Select an order to start chatting with the customer</p>
            </div>
          ) : (
            <>
              {/* Chat header showing order info */}
              <div className={styles.chatHeader}>
                <div>
                  <div className={styles.chatTitle}>Order #{selectedOrder.orderId}</div>
                  <div className={styles.chatSubtitle}>
                    Customer #{selectedOrder.customerId}
                    <span className={`${styles.statusBadge} ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
                <div className={styles.chatTotal}>{selectedOrder.totalPrice} EGP</div>
              </div>
 
              {/* Messages area */}
              <div className={styles.messagesArea}>
                {loadingMessages && messages.length === 0 ? (
                  <div className={styles.loadingText}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className={styles.noMessages}>No messages yet. Start the conversation!</div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.messageId}
                      className={`${styles.messageBubble} ${msg.senderType === 'ShopOwner' ? styles.messageSent : styles.messageReceived}`}
                    >
                      <div className={styles.messageSender}>{msg.senderName}</div>
                      <div className={styles.messageText}>{msg.message}</div>
                      <div className={styles.messageTime}>{formatTime(msg.sentAt)}</div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
 
              {error && <div className={styles.errorBox}>{error}</div>}
 
              {/* Message input */}
              <div className={styles.inputArea}>
                <input
                  className={styles.messageInput}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                />
                <button className={styles.sendBtn} onClick={handleSend} disabled={sending || !newMessage.trim()}>
                  {sending ? '...' : '➤'}
                </button>
              </div>
            </>
          )}
        </div>
 
      </div>
    </div>
  );
};
