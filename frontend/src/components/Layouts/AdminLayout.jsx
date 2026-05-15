// AdminLayout.jsx

import { useState } from "react";
import { Menu, X } from "lucide-react";
import AdminSidebar from "../AdminSidebar";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64
          transform bg-white border-r border-gray-200 transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <AdminSidebar closeSidebar={() => setSidebarOpen(false)} />
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 lg:pl-64 min-h-screen">
        {/* MOBILE TOPBAR */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>

          <h1 className="text-lg font-semibold text-green-700">Admin Panel</h1>

          <div className="w-6" />
        </div>

        <main className="w-full min-h-screen bg-gray-50 p-3 sm:p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
