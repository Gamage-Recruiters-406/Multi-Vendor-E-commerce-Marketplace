import React, { useEffect, useState } from 'react';
import { WelcomeBanner } from '../../components/Admin/WelcomeBanner';
import { StatsCards } from '../../components/Admin/StatsCards';
import { SalesPerformance } from '../../components/Admin/SalesPerformance';
import { OrderStatistics } from '../../components/Admin/OrderStatistics';
import { OrderMonitoring } from '../../components/Admin/OrderMonitoring';
import { NewVendors } from '../../components/Admin/NewVendors';
import Header from '../../components/Layouts/Header';
import Footer from '../../components/Layouts/Footer';
import * as adminService from '../../services/adminService';
import { getCurrentUser } from '../../services/authService';

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    orderStats: [],
    recentOrders: [],
    newVendors: [],
    salesData: []
  });

  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [usersData, ordersData, productsData] = await Promise.all([
          adminService.getAllUsers(),
          adminService.getAllOrders(),
          adminService.getAllProducts()
        ]);

        // Process Users
        const users = usersData.users || [];
        const vendors = users.filter(u => u.role === 'Vendor');
        
        // Process Orders
        const orders = ordersData.orders || [];
        const totalRevenue = orders.reduce((sum, order) => sum + (order.priceSummary?.totalAmount || 0), 0);
        
        const orderStatusCounts = orders.reduce((acc, order) => {
          const status = order.overallStatus || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        // Prepare Stats Cards Data
        const statsCards = [
          {
            label: 'Total Revenue',
            value: `$${totalRevenue.toLocaleString()}`,
            change: '+12.5%',
            type: 'revenue'
          },
          {
            label: 'Total Orders',
            value: orders.length.toLocaleString(),
            change: '+8.2%',
            type: 'orders'
          },
          {
            label: 'Total Users',
            value: users.length.toLocaleString(),
            change: '+15.3%',
            type: 'users'
          },
          {
            label: 'Total Vendors',
            value: vendors.length.toLocaleString(),
            change: '+6.8%',
            type: 'vendors'
          }
        ];

        // Prepare Order Statistics (Pie Chart)
        const orderStats = [
          { name: 'Completed', value: orderStatusCounts['Delivered'] || 0, color: '#1A9F73' },
          { name: 'Ongoing', value: (orderStatusCounts['Placed'] || 0) + (orderStatusCounts['Confirmed'] || 0) + (orderStatusCounts['Shipped'] || 0), color: '#3b82f6' },
          { name: 'Cancelled', value: orderStatusCounts['Cancelled'] || 0, color: '#ef4444' }
        ];

        setDashboardData({
          stats: statsCards,
          orderStats,
          recentOrders: orders.slice(0, 5),
          newVendors: vendors.slice(0, 5),
          salesData: []
        });

        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1A9F73]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center">
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#1A9F73] text-white rounded-xl font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans">
      <Header userRole={currentUser?.role} userName={currentUser?.fullname} />
      
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <WelcomeBanner adminName={currentUser?.fullname} />
          <StatsCards stats={dashboardData.stats} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <SalesPerformance 
                totalRevenue={dashboardData.stats.find(s => s.type === 'revenue')?.value.replace(/[^0-9.]/g, '') || 0} 
                totalCommission={parseFloat(dashboardData.stats.find(s => s.type === 'revenue')?.value.replace(/[^0-9.]/g, '') || 0) * 0.15}
              />
            </div>
            <div className="lg:col-span-4">
              <OrderStatistics data={dashboardData.orderStats} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <OrderMonitoring orders={dashboardData.recentOrders} />
            </div>
            <div className="lg:col-span-4">
              <NewVendors vendors={dashboardData.newVendors} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
