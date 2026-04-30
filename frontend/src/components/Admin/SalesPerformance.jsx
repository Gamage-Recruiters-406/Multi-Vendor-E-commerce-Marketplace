import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
const data = [
{
  name: 'WEEK 1',
  revenue: 20000,
  commission: 5000
},
{
  name: 'WEEK 2',
  revenue: 65000,
  commission: 12000
},
{
  name: 'WEEK 3',
  revenue: 125000,
  commission: 20000
},
{
  name: 'WEEK 4',
  revenue: 135000,
  commission: 25000
}];

export function SalesPerformance({ totalRevenue = 128450, totalCommission = 19267.50 }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Sales Performance</h2>
          <p className="text-sm text-gray-500">
            Revenue vs. Commission Comparison
          </p>
        </div>
        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
          {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((tab) =>
            <button
              key={tab}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === 'Weekly' ? 'bg-white text-[#1A9F73] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#1A9F73]"></div>
          <span className="text-gray-600 font-medium">Total Revenue</span>
          <span className="font-bold text-gray-900">${totalRevenue.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#8dd4b6]"></div>
          <span className="text-gray-600 font-medium">Commission (15%)</span>
          <span className="font-bold text-gray-900">${totalCommission.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex-grow min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 0,
              left: -20,
              bottom: 0
            }}>
            
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1A9F73" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#1A9F73" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8dd4b6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8dd4b6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f3f4f6" />
            
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 10,
                fill: '#9ca3af',
                fontWeight: 600
              }}
              dy={10} />
            
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 10,
                fill: '#9ca3af',
                fontWeight: 600
              }}
              tickFormatter={(value) => `$${value / 1000}K`} />
            
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} />
            
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#1A9F73"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorRevenue)" />
            
            <Area
              type="monotone"
              dataKey="commission"
              stroke="#8dd4b6"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorCommission)" />
            
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>);

}
