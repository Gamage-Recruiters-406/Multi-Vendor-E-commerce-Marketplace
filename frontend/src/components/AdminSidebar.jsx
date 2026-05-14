import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  Settings,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Reports & Analytics", path: "/admin/reports", icon: BarChart3 },
  { name: "User Management", path: "/admin/users", icon: Users },
  { name: "Product Management", path: "/admin/products", icon: Package },
  { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  return (
    <div className="h-screen w-full bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 pt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-sm transition-all ${
                  isActive
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-600"
                }`
              }
            >
              <Icon size={18} />
              {item.name}
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t text-xs text-gray-400">Admin Panel</div>
    </div>
  );
}
