import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Vendor/sidebar";
import Categories from "../../components/Vendor/Categories";

export default function VendorProductManagemnt() {
  const [active, setActive] = useState("products");

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar active={active} onChange={setActive} />

      {/* Right Content */}
      {active === "categories" ? (
        <Categories />
      ) : (
        <div className="flex-1 p-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold capitalize">{active.replace("-", " ")}</h2>
            <p className="text-gray-500 mt-2">Content coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
}