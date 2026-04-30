import React from 'react';
const orders = [
{
  id: '#ORD-2841',
  customer: 'Elena Rossi',
  vendor: 'Urban Crafts',
  status: 'DELIVERED',
  amount: '$249.00',
  statusColor: 'bg-[#d1f0e2] text-[#1A9F73]'
},
{
  id: '#ORD-2840',
  customer: 'Mark Thompson',
  vendor: 'Studio Bloom',
  status: 'PENDING',
  amount: '$1,120.00',
  statusColor: 'bg-orange-100 text-orange-700'
},
{
  id: '#ORD-2839',
  customer: 'Sarah Jenkins',
  vendor: 'TechGear Pro',
  status: 'SHIPPED',
  amount: '$45.50',
  statusColor: 'bg-blue-100 text-blue-700'
},
{
  id: '#ORD-2838',
  customer: 'Kenji Wu',
  vendor: 'EcoHome',
  status: 'CANCELLED',
  amount: '$189.99',
  statusColor: 'bg-red-100 text-red-700'
}];

export function OrderMonitoring({ orders }) {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-[#d1f0e2] text-[#1A9F73]';
      case 'Placed':
      case 'Confirmed':
        return 'bg-orange-100 text-orange-700';
      case 'Shipped':
        return 'bg-blue-100 text-blue-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const displayOrders = orders || [];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">Order Monitoring</h2>
        <button className="text-sm font-semibold text-[#1A9F73] hover:text-[#158a63]">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 border-b border-gray-100 tracking-wider">
              <th className="pb-4 uppercase">Order ID</th>
              <th className="pb-4 uppercase">Customer</th>
              <th className="pb-4 uppercase">Status</th>
              <th className="pb-4 uppercase text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayOrders.map((order, index) => (
              <tr key={index} className="border-b border-gray-50 last:border-0">
                <td className="py-4 font-bold text-gray-900">#{order.orderNumber?.slice(-6)}</td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-[10px] text-gray-500 uppercase">
                      {order.buyer?.fullname?.slice(0, 2)}
                    </div>
                    <span className="font-medium text-gray-700">
                      {order.buyer?.fullname || 'Guest'}
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${getStatusStyle(order.overallStatus)}`}>
                    {order.overallStatus?.toUpperCase()}
                  </span>
                </td>
                <td className="py-4 font-bold text-gray-900 text-right">
                  ${(order.priceSummary?.totalAmount || 0).toLocaleString()}
                </td>
              </tr>
            ))}
            {displayOrders.length === 0 && (
              <tr>
                <td colSpan="4" className="py-8 text-center text-gray-400 italic">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
