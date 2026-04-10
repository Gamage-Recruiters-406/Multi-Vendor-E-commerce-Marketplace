import { Package, PlusCircle, Tag, X } from "lucide-react";

// ================= SIDEBAR =================
function Sidebar({ active, onChange }) {
  const items = [
    { key: "products", label: "Products", icon: <Package size={18} /> },
    { key: "add-product", label: "Add Product", icon: <PlusCircle size={18} /> },
    { key: "categories", label: "Categories", icon: <Tag size={18} /> },
  ];

  return (
    <div className="w-64 min-h-screen bg-gray-50 p-4">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-[#1A9F73] rounded-lg" />
        <span className="font-semibold text-lg">VendorHub</span>
      </div>

      {/* Menu */}
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? "bg-green-100 text-[#1A9F73]"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-1 bg-[#1A9F73] rounded-r" />
              )}
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default Sidebar;