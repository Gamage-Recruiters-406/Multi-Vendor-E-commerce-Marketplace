import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';
const data = [
{
  name: 'Completed',
  value: 10245,
  color: '#1A9F73',
  percentage: '65%'
},
{
  name: 'Ongoing/Pending',
  value: 3169,
  color: '#3b82f6',
  percentage: '20%'
},
{
  name: 'Refunded',
  value: 1584,
  color: '#f59e0b',
  percentage: '10%'
},
{
  name: 'Disputed',
  value: 792,
  color: '#ef4444',
  percentage: '5%'
}];

export function OrderStatistics({ data }) {
  const chartData = data && data.length > 0 ? data : [
    { name: 'Completed', value: 0, color: '#1A9F73' },
    { name: 'Ongoing', value: 0, color: '#3b82f6' },
    { name: 'Cancelled', value: 0, color: '#ef4444' }
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const formattedData = chartData.map(item => ({
    ...item,
    percentage: total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'
  }));

  const formatTotal = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Order Statistics</h2>
          <p className="text-sm text-gray-500">Breakdown by status</p>
        </div>
        <button className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100 tracking-wider">
          ALL TIME <ChevronDown size={14} />
        </button>
      </div>

      <div className="relative h-[220px] w-full my-4 flex justify-center items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={0}
              dataKey="value"
              stroke="none">
              {formattedData.map((entry, index) =>
                <Cell key={`cell-${index}`} fill={entry.color} />
              )}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-900">{formatTotal(total)}</span>
          <span className="text-[10px] font-bold text-gray-500 tracking-wider">
            TOTAL
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-6 flex-grow">
        {formattedData.map((item, index) =>
          <div
            key={index}
            className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}>
              </div>
              <span className="text-gray-600 font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-900">
                {item.value.toLocaleString()}
              </span>
              <span className="text-gray-400 text-xs w-8 text-right font-medium">
                {item.percentage}
              </span>
            </div>
          </div>
        )}
      </div>

      <button className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#1A9F73] font-semibold text-sm rounded-xl transition-colors">
        View Detailed Distribution
      </button>
    </div>
  );
}
