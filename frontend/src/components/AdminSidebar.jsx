// AdminSidebar.jsx

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  UserCircle2,
  X,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Reports & Analytics", path: "/admin/reports", icon: BarChart3 },
  { name: "User Management", path: "/admin/users", icon: Users },
  { name: "Product Management", path: "/admin/products", icon: Package },
  { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({ closeSidebar }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="h-screen w-full bg-[#EAF7F1] flex flex-col">
      {/* MOBILE CLOSE BUTTON */}
      <div className="flex items-center justify-between px-5 pt-4 lg:hidden">
        <h2 className="text-lg font-bold text-green-700">Admin</h2>

        <button onClick={closeSidebar}>
          <X size={22} />
        </button>
      </div>

      {/* USER */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <UserCircle2 className="text-green-600" size={30} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-800">
              {user?.fullname || user?.name || "Admin User"}
            </h3>

            <p className="truncate text-xs text-gray-500 capitalize">
              {user?.role || "Administrator"}
            </p>
          </div>
        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 mb-2 text-sm transition-all ${
                  isActive
                    ? "bg-white text-green-700 font-semibold shadow-sm"
                    : "text-gray-700 hover:bg-white/70 hover:text-green-700"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* LOGOUT */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100"
        >
          <LogOut size={18} />
          Logout
        </button>

        <p className="mt-3 text-center text-xs text-gray-400">Admin Panel</p>
      </div>
    </div>
  );
}
