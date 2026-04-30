import { Lock, RefreshCcw, HeadphonesIcon } from 'lucide-react';
export default function OrderSummary() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>
      
      <div className="space-y-4 text-sm mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium">Subtotal</span>
          <span className="font-bold text-gray-900">$299.96</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium">Shipping</span>
          <span className="text-gray-400 text-xs">Calculated at checkout</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-red-500 font-medium">Discount</span>
          <span className="font-bold text-red-500">-$30.00</span>
        </div>
      </div>
      
      <div className="border-t border-gray-100 pt-5 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-900 text-base">Total</span>
          <span className="font-black text-gray-900 text-2xl">$269.96</span>
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-[11px] font-semibold text-gray-500 mb-2">Discount Code</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Enter code" 
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
            Apply
          </button>
        </div>
      </div>
      <button className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3.5 rounded-lg font-bold text-sm transition-colors mb-6 shadow-sm">
        Proceed to Checkout
      </button>
      <div className="flex justify-between border-t border-gray-100 pt-6 px-2">
        <div className="flex flex-col items-center gap-2 text-center">
          <Lock className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] text-gray-400 font-medium">Secure Checkout</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <RefreshCcw className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] text-gray-400 font-medium">Free Returns</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <HeadphonesIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] text-gray-400 font-medium">24/7 Support</span>
        </div>
      </div>
    </div>
  );
}