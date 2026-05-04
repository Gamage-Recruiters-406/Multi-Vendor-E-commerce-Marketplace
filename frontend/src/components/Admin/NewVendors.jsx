import React from 'react';
import { Filter } from 'lucide-react';
const vendors = [
{
  name: 'Urban Crafts Co.',
  category: 'Handmade Decor',
  time: '2m ago',
  status: 'NEW',
  statusColor: 'bg-[#e8f7f0] text-[#1A9F73]'
},
{
  name: 'Studio Bloom',
  category: 'Organic Skincare',
  time: '45m ago',
  status: 'NEW',
  statusColor: 'bg-[#e8f7f0] text-[#1A9F73]'
},
{
  name: 'TechGear Pro',
  category: 'Electronics',
  time: '2h ago',
  status: 'PENDING',
  statusColor: 'bg-gray-100 text-gray-500'
}];

export function NewVendors({ vendors }) {
  const displayVendors = vendors || [];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-gray-900">New Vendors</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <Filter size={18} />
        </button>
      </div>

      <div className="space-y-6 flex-grow">
        {displayVendors.map((vendor, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0 overflow-hidden">
                <img
                  src={vendor.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${vendor.fullname}`}
                  alt={vendor.fullname}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">
                  {vendor.fullname}
                </h4>
                <p className="text-xs text-gray-500 font-medium">
                  {vendor.email}
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-[#e8f7f0] text-[#1A9F73]`}>
              NEW
            </span>
          </div>
        ))}
        {displayVendors.length === 0 && (
          <div className="py-8 text-center text-gray-400 italic">
            No new vendors found
          </div>
        )}
      </div>

      <button className="w-full mt-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-500 font-semibold text-sm rounded-xl transition-colors border-dashed">
        Review All Applications
      </button>
    </div>
  );
}
