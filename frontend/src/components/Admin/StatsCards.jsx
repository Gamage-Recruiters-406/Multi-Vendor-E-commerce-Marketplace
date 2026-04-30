import React from 'react';
import { Banknote, Package, Users, Store, ArrowUp } from 'lucide-react';
export function StatsCards({ stats }) {
  const getIcon = (type) => {
    switch (type) {
      case 'revenue': return Banknote;
      case 'orders': return Package;
      case 'users': return Users;
      case 'vendors': return Store;
      default: return Package;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'revenue': return 'bg-[#1A9F73]';
      case 'orders': return 'bg-blue-500';
      case 'users': return 'bg-purple-500';
      case 'vendors': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (!stats || stats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = getIcon(stat.type);
        const iconBg = getIconBg(stat.type);
        
        return (
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
              <div className={`${iconBg} p-3 rounded-xl text-white`}>
                <Icon size={24} />
              </div>
            </div>
            <div className="flex items-center text-[#1A9F73] text-xs font-semibold mt-auto">
              <ArrowUp size={14} className="mr-1" />
              <span>{stat.change} vs last month</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
