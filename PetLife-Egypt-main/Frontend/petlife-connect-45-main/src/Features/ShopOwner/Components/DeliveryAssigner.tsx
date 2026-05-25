import React from 'react';

const DeliveryAssigner = ({ orderId, onAssigned }: { orderId: number, onAssigned: () => void }) => {
  const assignDriver = async (driverId: number) => {
    if (!driverId) return;
    
    try {
      const res = await fetch(`http://localhost:5262/api/ShopOwner/${orderId}/assign-delivery`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverId)
      });
      
      if (res.ok) {
        alert("Driver assigned successfully");
        onAssigned();
      } else {
        alert("Failed to assign driver");
      }
    } catch (error) {
      console.error("Assign error:", error);
      alert("Error assigning driver");
    }
  };

  return (
    <select 
      className="text-sm border rounded p-1"
      onChange={(e) => assignDriver(Number(e.target.value))}
      defaultValue=""
    >
      <option value="" disabled>Assign Driver</option>
      <option value="1">Ahmad (Express)</option>
      <option value="2">Sara (Fast Delivery)</option>
      <option value="3">Mohamed (Standard)</option>
    </select>
  );
};

export default DeliveryAssigner;