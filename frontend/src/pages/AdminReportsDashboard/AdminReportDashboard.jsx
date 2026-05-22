import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ComposedChart, Bar, Line, Legend 
} from 'recharts';
import Header from '../../components/Layouts/Header';
import Footer from '../../components/Layouts/Footer';

export function AdminReportDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('auth'))?.user || { fullname: "Admin", role: "Admin" };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user/dashboard-stats`, { withCredentials: true });
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      setError("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // දත්ත නොමැති විට අක්ෂ පෙන්වීමට අවශ්‍ය Default දත්ත
  const emptyChartData = [{ name: 'No Data', revenue: 0, orders: 0 }];

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header userRole={currentUser.role} userName={currentUser.fullname} />
      
      <main className="p-8 max-w-[1400px] mx-auto">
        
        {/* 1. Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {data?.stats?.map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="w-16 h-16 flex items-center justify-center bg-emerald-50 rounded-2xl text-emerald-600 text-3xl">
                {stat.icon}
              </div>
              <div>
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-2 text-gray-800">{stat.value}</h3>
                <p className="text-xs text-emerald-500 font-semibold mt-2">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-6">Revenue Trends</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueTrends?.length > 0 ? data.revenueTrends : emptyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={true} tickLine={true} stroke="#E5E7EB" tick={{fontSize: 12, fill: '#9CA3AF'}} />
                  <YAxis axisLine={true} tickLine={true} stroke="#E5E7EB" tick={{fontSize: 12, fill: '#9CA3AF'}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-6">Orders vs Revenue</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data?.ordersVsRevenue?.length > 0 ? data.ordersVsRevenue : emptyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={true} tickLine={true} stroke="#E5E7EB" tick={{fontSize: 12, fill: '#9CA3AF'}} />
                  <YAxis yAxisId="left" axisLine={true} tickLine={true} stroke="#E5E7EB" tick={{fontSize: 12, fill: '#9CA3AF'}} />
                  <YAxis yAxisId="right" orientation="right" axisLine={true} tickLine={true} stroke="#E5E7EB" tick={{fontSize: 12, fill: '#9CA3AF'}} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#EF4444" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 3. Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
           <div className="lg:col-span-2 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 font-bold text-gray-800 border-b border-gray-50">Recent Transactions</div>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-5">ID</th>
                    <th className="p-5">Vendor</th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.transactions?.map((tx, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-5 font-mono text-xs text-gray-500">{tx.id}</td>
                      <td className="p-5 font-semibold text-gray-700">{tx.vendor}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-bold ${tx.amount === 'vendor' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {tx.amount}
                        </span>
                      </td>
                      <td className="p-5 text-gray-400 text-xs">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>

           <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
              <h4 className="font-bold text-gray-800 mb-6">Category Distribution</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.categorySales?.length > 0 ? data.categorySales : [{name: 'Empty', value: 1}]} dataKey="value" innerRadius={60} outerRadius={80}>
                      {data?.categorySales?.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}