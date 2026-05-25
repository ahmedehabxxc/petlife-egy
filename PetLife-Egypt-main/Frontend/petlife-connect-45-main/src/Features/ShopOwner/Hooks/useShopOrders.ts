import { useState, useEffect } from 'react';

// Define the shape of your Order data based on your .NET models
interface Order {
    orderId: number;
    customerName: string;
    status: string;
    totalPrice: number;
    orderItems: any[];
}

const useShopOrders = (shopId: number, status?: string, name?: string) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Construct the URL with query parameters for FR-SO-07 (Filtering)
            let url = `http://localhost:5262/api/ShopOwner/orders?shopId=${shopId}`;
            
            if (status && status !== '') url += `&status=${status}`;
            if (name && name !== '') url += `&customerName=${encodeURIComponent(name)}`;

            console.log("Fetching orders from:", url);
            
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Failed to fetch orders');
            
            const data = await response.json();
            setOrders(data);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching orders:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Re-run whenever shopId, status, or search name changes
    useEffect(() => {
        if (shopId) {
            fetchOrders();
        }
    }, [shopId, status, name]);

    // Return everything the component needs
    return { orders, loading, error, refresh: fetchOrders };
};

export default useShopOrders;