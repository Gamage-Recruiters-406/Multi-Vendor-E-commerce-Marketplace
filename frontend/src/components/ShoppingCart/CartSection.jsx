import { Store, ArrowRight } from 'lucide-react';
import CartItem from './CartItem';
export default function CartSection({ storeName, items }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
      {/* Store Header */}
      <div className="bg-gray-50/80 px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200/80 rounded-full flex items-center justify-center text-gray-500">
            <Store className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-[15px]">{storeName}</h3>
        </div>
        <a href="#" className="text-emerald-500 text-xs font-bold flex items-center gap-1 hover:text-emerald-600 transition-colors">
          Visit Store <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
      
      {/* Items */}
      <div className="px-6">
        {items.map((item, index) => (
          <CartItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
}