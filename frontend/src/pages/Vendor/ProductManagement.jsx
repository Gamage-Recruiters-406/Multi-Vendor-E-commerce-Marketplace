import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Vendor/sidebar";
import Categories from "../../components/Vendor/Categories";
import Header from "../../components/Layouts/Header";
import Footer from "../../components/Layouts/Footer";
import { Menu, PanelLeftClose } from "lucide-react";

export default function VendorProductManagemnt() {
  const [active, setActive] = useState("products");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-360 flex-col gap-5 px-4 py-4 md:px-6 lg:px-8">
              <Header/>
              
      
            <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSidebarOpen(prev => !prev)}
                  className={`p-2 rounded-lg hover:bg-gray-100 transition ${isSidebarOpen ? "bg-gray-200" : ""}`}
                  
                >
                  {isSidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
                </button>
              </div>
              <div className="flex gap-6 overflow-hidden">
      
                <div
                  className={`transition-all duration-300 ${
                    isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
                  }`}
                >
                  <Sidebar active={active} onChange={setActive} />
                </div>

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
            </main>
            <Footer/>
            </div>
    
    </div>
  );
}