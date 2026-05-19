import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header userRole={currentUser.role} userName={currentUser.fullname} />
      
      <main className="p-8 max-w-[1400px] mx-auto">
        
        {/* 1. Stats Cards - UI Design Update */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {data?.stats?.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wide">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-1 text-gray-800">{stat.value}</h3>
                <p className="text-xs text-emerald-500 font-semibold mt-2 flex items-center gap-1">
                   {stat.change}
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 text-xl">{stat.icon}</div>
            </div>
          ))}
        </div>

        {/* 2. Transactions Table - UI Design Update */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 font-bold text-gray-800 border-b border-gray-50">Recent Transactions</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-5">ID</th>
                <th className="p-5">Vendor/User</th>
                <th className="p-5">Role</th>
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
                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold ${
                      tx.amount === 'Vendor' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {tx.amount}
                    </span>
                  </td>
                  <td className="p-5 text-gray-600 font-medium">{tx.status}</td>
                  <td className="p-5 text-gray-400 text-xs">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Category Pie Chart - UI Design Update */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 w-full md:w-1/3">
           <h4 className="font-bold text-gray-800 mb-6">Category Distribution</h4>
           <div className="h-[220px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                    data={data?.categorySales} 
                    dataKey="value" 
                    nameKey="name" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5}
                 >
                   {data?.categorySales?.map((entry, i) => (
                     <Cell key={i} fill={entry.color} stroke="none" />
                   ))}
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}