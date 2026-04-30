import { Search, Bell, User } from 'lucide-react';
export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-100 py-4 px-8 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="border border-emerald-100 bg-emerald-50/50 rounded px-3 py-1 flex items-center justify-center">
           <span className="text-emerald-500 font-black text-sm tracking-widest">NEXIO</span>
        </div>
      </div>
      
      {/* Nav */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600 ml-8">
        <a href="#" className="hover:text-emerald-600 transition-colors">Home</a>
        <a href="#" className="hover:text-emerald-600 transition-colors">Categories</a>
        <a href="#" className="text-emerald-600 border-b-2 border-emerald-600 pb-1">Cart</a>
        <a href="#" className="hover:text-emerald-600 transition-colors">Orders</a>
      </nav>
      {/* Search */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search for unique artisan products..." 
            className="w-full bg-gray-50 border border-transparent rounded-lg py-2.5 pl-11 pr-4 text-sm focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-6">
        <button className="relative text-gray-500 hover:text-gray-900 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:text-emerald-600 transition-colors">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          ACCOUNT
        </button>
      </div>
    </header>
  );
}