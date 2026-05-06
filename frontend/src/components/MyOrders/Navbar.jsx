import React from 'react'
import { Search, Bell, User } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 flex items-center justify-center">
            <span className="text-emerald-500 font-bold text-xs">NX</span>
          </div>
          <span className="text-emerald-500 font-bold text-xl tracking-tight">
            NEXIO
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a
            href="#"
            className="text-emerald-600 border-b-2 border-emerald-500 pb-1"
          >
            Home
          </a>
          <a href="#" className="hover:text-emerald-600 transition-colors">
            Categories
          </a>
          <a href="#" className="hover:text-emerald-600 transition-colors">
            Cart
          </a>
          <a href="#" className="hover:text-emerald-600 transition-colors">
            Orders
          </a>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-8 hidden lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search for unique artisan products..."
            className="w-full bg-gray-50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-gray-700 hidden sm:block">
            ACCOUNT
          </span>
        </button>
      </div>
    </nav>
  )
}