import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MapPin, ShoppingBag, Mail, Phone, Globe, 
    MessageSquare, Store, Star, PlusCircle, LayoutDashboard 
} from 'lucide-react';

const ViewStore = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [store, setStore] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStoreAndCheckOwnership = async () => {
            try {
                // 1. Fetch the store data from your MongoDB collection
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/store/${id}`);
                
                if (res.data.success) {
                    const storeData = res.data.data;
                    setStore(storeData);

                    // 2. Security Check: Compare Logged-in User ID with Store Vendor ID
                    const currentUser = JSON.parse(localStorage.getItem('user'));
                    
                    // Check if current user is logged in AND is the owner of this specific store
                    if (currentUser && storeData.vendor === currentUser._id) {
                        setIsOwner(true);
                    }
                }
            } catch (err) {
                console.error("Error fetching store data:", err);
                setError(true);
            }
        };
        
        if (id) fetchStoreAndCheckOwnership();
    }, [id]);

    if (error) return <div className="p-10 text-center font-bold text-red-500">Store Not Found</div>;
    if (!store) return <div className="p-10 text-center animate-pulse">Loading {store?.name || "Nexio Store"}...</div>;

    return (
        <div className="bg-gray-50 min-h-screen pb-20 font-sans">
            {/* Header Section */}
            <div className="bg-white border-b py-10 px-6 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 items-center justify-between">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center border shadow-inner overflow-hidden">
                            {store.logo ? (
                                <img src={store.logo} alt="Logo" className="w-full h-full object-cover"/>
                            ) : (
                                <Store className="text-emerald-500" size={40} />
                            )}
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-black text-emerald-900 uppercase tracking-tight">{store.name}</h1>
                            <p className="text-gray-500 mt-2 max-w-md">{store.description}</p>
                        </div>
                    </div>

                    {/* VENDOR-ONLY ACTIONS: Only visible to the store owner */}
                    {isOwner && (
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => navigate('/vendor/add-product')}
                                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                            >
                                <PlusCircle size={20} /> Add New Product
                            </button>
                            <button 
                                onClick={() => navigate('/vendor/dashboard')}
                                className="bg-white border-2 border-emerald-600 text-emerald-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-50 transition"
                            >
                                <LayoutDashboard size={20} /> Store Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3">
                    <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                        <ShoppingBag className="text-emerald-500" /> Products in {store.name}
                    </h2>
                    
                    {/* Product grid will be populated by your teammate's Product component */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 opacity-60">
                        <div className="border-2 border-dashed rounded-3xl p-10 text-center text-gray-400">
                            No products listed yet. {isOwner && "Click 'Add Product' to start selling!"}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <aside className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-4">Contact Info</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center gap-3"><Mail size={16} className="text-emerald-500"/> {store.businessEmail || "No email"}</li>
                            <li className="flex items-center gap-3"><Phone size={16} className="text-emerald-500"/> {store.phoneNumber || "No phone"}</li>
                            <li className="flex items-center gap-3"><MapPin size={16} className="text-emerald-500"/> {store.location || "Colombo, LK"}</li>
                        </ul>
                    </div>
                    
                    <button className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition">
                        <MessageSquare size={18}/> Contact Support
                    </button>
                </aside>
            </div>
        </div>
    );
};

export default ViewStore;