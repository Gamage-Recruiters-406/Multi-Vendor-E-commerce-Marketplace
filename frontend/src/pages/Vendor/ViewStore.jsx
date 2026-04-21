import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { MapPin, ShoppingBag, Mail, Phone, Globe, MessageSquare, Store } from 'lucide-react';

const ViewStore = () => {
    const { id } = useParams();
    const [store, setStore] = useState(null);

    useEffect(() => {
        const fetchStore = async () => {
            try {
                // CHANGED: Use axios.get to match the backend router.get('/:id', getSingleStore)
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/store/${id}`);
                
                if (res.data.success) {
                    setStore(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching store data:", err);
            }
        };
        
        if (id) {
            fetchStore();
        }
    }, [id]);

    if (!store) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-emerald-600 font-bold text-xl">Loading Nexio Store...</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-20 font-sans">
            {/* Header matches Screenshot 2026-04-19 080722.png */}
            <div className="bg-white border-b py-10 px-6 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 items-center">
                    <div className="w-full md:w-1/3 text-center md:text-left">
                        <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mb-6 mx-auto md:mx-0 border border-emerald-100 shadow-inner">
                            {store.logo ? (
                                <img src={store.logo} alt="Store Logo" className="rounded-full w-full h-full object-cover shadow-sm"/>
                            ) : (
                                <Store className="text-emerald-500" size={40} />
                            )}
                        </div>
                        <h1 className="text-4xl font-black text-emerald-900 tracking-tight">{store.name}</h1>
                        <p className="text-gray-500 mt-4 leading-relaxed text-lg italic">
                            {store.description || "Welcome to our official Nexio storefront."}
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                            <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-200">
                                Electronics
                            </span>
                            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-bold border border-gray-200">
                                <MapPin size={14}/> Colombo, LK
                            </span>
                        </div>
                    </div>
                    
                    {/* Visual Banner placeholder as requested in the mockup */}
                    <div className="flex-1 w-full h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                        <img 
                            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070" 
                            className="w-full h-full object-cover transform hover:scale-105 transition duration-700" 
                            alt="Store Banner" 
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards Dashboard Section */}
            <div className="max-w-6xl mx-auto -mt-12 px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 relative z-10">
                {[
                    { label: "Total Products", val: "24" },
                    { label: "Orders Completed", val: "150+" },
                    { label: "Vendor Rating", val: "4.8 ★" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-50/50 text-center transform hover:-translate-y-2 transition duration-300 group">
                        <span className="text-4xl font-black text-emerald-600 block group-hover:scale-110 transition">{stat.val}</span>
                        <span className="text-gray-400 text-xs font-bold uppercase mt-3 tracking-widest block">{stat.label}</span>
                    </div>
                ))}
            </div>

            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3">
                    <h2 className="text-3xl font-black text-emerald-900 mb-10 flex items-center gap-3">
                        <ShoppingBag className="text-emerald-500" size={32}/> 
                        Featured Collection
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(item => (
                            <div key={item} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group">
                                <div className="h-64 bg-gray-50 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-900/0 group-hover:bg-emerald-900/5 transition duration-300"></div>
                                    {/* Placeholder for actual product images later */}
                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                        <ShoppingBag size={64} />
                                    </div>
                                </div>
                                <div className="p-8">
                                    <h3 className="font-bold text-gray-800 text-xl group-hover:text-emerald-600 transition">Premium Nexio Gadget {item}</h3>
                                    <div className="flex justify-between items-center mt-4">
                                        <p className="text-emerald-600 text-2xl font-black">$299.00</p>
                                        <div className="flex text-yellow-400"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/></div>
                                    </div>
                                    <button className="w-full mt-8 bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar matches Screenshot 2026-04-19 080722.png */}
                <aside className="space-y-8">
                    <button className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-700 transition shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/50 transform hover:scale-[1.02] active:scale-95">
                        <MessageSquare size={20}/> Message Vendor
                    </button>
                    
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-md">
                        <h4 className="font-black text-gray-800 text-lg mb-6 border-b pb-4 border-gray-50">Store Details</h4>
                        <ul className="space-y-6 text-sm">
                            <li className="flex items-center gap-4 group">
                                <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition"><Mail size={18}/></div>
                                <span className="text-gray-600 font-medium">support@nexio.lk</span>
                            </li>
                            <li className="flex items-center gap-4 group">
                                <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition"><Phone size={18}/></div>
                                <span className="text-gray-600 font-medium">+94 77 123 4567</span>
                            </li>
                            <li className="flex items-center gap-4 group">
                                <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition"><Globe size={18}/></div>
                                <span className="text-gray-600 font-medium underline">www.nexio.market/store</span>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ViewStore;