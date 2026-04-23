import React from 'react';
import { Banknote, Package, Users, Store, ArrowUp } from 'lucide-react';
const stats = [
{
  label: 'Total Revenue',
  value: '$847,562',
  change: '12.5%',
  icon: Banknote,
  iconBg: 'bg-[#1A9F73]'
},
{
  label: 'Total Orders',
  value: '15,847',
  change: '8.2%',
  icon: Package,
  iconBg: 'bg-blue-500'
},
{
  label: 'Total Users',
  value: '42,389',
  change: '15.3%',
  icon: Users,
  iconBg: 'bg-purple-500'
},
{
  label: 'Total Vendors',
  value: '1,247',
  change: '6.8%',
  icon: Store,
  iconBg: 'bg-orange-500'
}];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) =>
      <div
        key={index}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col relative">
        
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                {stat.label}
              </p>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            </div>
            <div className={`${stat.iconBg} p-3 rounded-xl text-white`}>
              <stat.icon size={24} />
            </div>
          </div>
          <div className="flex items-center text-[#1A9F73] text-xs font-semibold mt-auto">
            <ArrowUp size={14} className="mr-1" />
            <span>{stat.change} vs last month</span>
          </div>
        </div>
      )}
    </div>);

}
