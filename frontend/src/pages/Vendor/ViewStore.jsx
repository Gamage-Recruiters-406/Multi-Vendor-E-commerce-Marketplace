import React, { useEffect, useState } from 'react';
import axios from 'axios';
<<<<<<< Updated upstream
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MapPin, ShoppingBag, Mail, Phone, Globe, 
    MessageSquare, Store, Star, PlusCircle, LayoutDashboard 
} from 'lucide-react';
=======
import { useParams, Link } from 'react-router-dom';
import { MapPin, ShoppingBag, PlusCircle, Mail, Phone, Globe, Store, Star } from 'lucide-react';
>>>>>>> Stashed changes

const ViewStore = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [store, setStore] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
<<<<<<< Updated upstream
    const [error, setError] = useState(false);
=======

    // Manual URL build to match team standards
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const apiVersion = import.meta.env.VITE_API_VERSION || '/api/v1';
    const API_URL = `${baseUrl.replace(/\/+$/, '')}/${apiVersion.replace(/^\/+/, '')}`;
>>>>>>> Stashed changes

    useEffect(() => {
        const fetchStoreAndCheckOwnership = async () => {
            try {
<<<<<<< Updated upstream
                // 1. Fetch the store data from your MongoDB collection
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/store/${id}`);
                
                if (res.data.success) {
                    const storeData = res.data.data;
                    setStore(storeData);

                    // 2. Security Check: Compare Logged-in User ID with Store Vendor ID
                    const currentUser = JSON.parse(localStorage.getItem('user'));
                    
                    // Check if current user is logged in AND is the owner of this specific store
                    if (currentUser && storeData.vendor === currentUser._id) {
=======
                const res = await axios.get(`${API_URL}/store/${id}`);
                
                if (res.data.success) {
                    const fetchedStore = res.data.data;
                    setStore(fetchedStore);

                    // Ownership Check
                    const currentUser = JSON.parse(localStorage.getItem('user'));
                    const storeVendorId = fetchedStore.vendor._id || fetchedStore.vendor;
                    
                    if (currentUser && 
                        currentUser._id === storeVendorId && 
                        currentUser.role === 'Vendor') {
>>>>>>> Stashed changes
                        setIsOwner(true);
                    }
                }
            } catch (err) {
<<<<<<< Updated upstream
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
=======
                console.error("Error:", err);
            }
        };
        
        if (id) fetchStore();
    }, [id, API_URL]);

    if (!store) return <div className="p-20 text-center font-bold text-emerald-600 animate-pulse">LOADING NEXIO STORE...</div>;

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <div className="bg-white border-b py-12 px-6 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="w-28 h-28 rounded-full border-4 border-emerald-50 overflow-hidden shadow-md">
                            {store.logo ? <img src={store.logo} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-full h-full p-6 text-emerald-200" />}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-emerald-900 tracking-tight uppercase">{store.name}</h1>
                            <p className="text-gray-500 mt-2 italic">{store.description}</p>
                            <div className="flex gap-3 mt-4 justify-center md:justify-start">
                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Vendor Store</span>
                                <span className="flex items-center gap-1 text-gray-400 text-xs font-bold"><MapPin size={14}/> COLOMBO, LK</span>
                            </div>
                        </div>
                    </div>

                    {/* VENDOR BUTTON */}
                    {isOwner && (
                        <Link 
                            to={`/vendor/add-product?storeId=${store._id}`} 
                            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 shadow-xl transition active:scale-95"
                        >
                            <PlusCircle size={22} /> ADD NEW PRODUCT
                        </Link>
>>>>>>> Stashed changes
                    )}
                </div>
            </div>

<<<<<<< Updated upstream
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
=======
            <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3">
                    <h2 className="text-2xl font-black text-emerald-900 mb-8 flex items-center gap-2 uppercase">
                        <ShoppingBag className="text-emerald-500" /> Featured Collection
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-3 py-24 text-center border-2 border-dashed rounded-3xl text-gray-300 font-bold uppercase tracking-widest">
                            No Products Listed Yet
>>>>>>> Stashed changes
                        </div>
                    </div>
                </div>

<<<<<<< Updated upstream
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
=======
                <aside className="bg-white p-8 rounded-3xl border shadow-sm h-fit">
                    <h4 className="font-black text-gray-800 text-lg mb-6 border-b pb-4 uppercase">Contact Vendor</h4>
                    <ul className="space-y-6 text-sm text-gray-600 font-bold">
                        <li className="flex items-center gap-4"><Mail size={18} className="text-emerald-500"/> support@nexio.lk</li>
                        <li className="flex items-center gap-4"><Phone size={18} className="text-emerald-500"/> +94 77 123 4567</li>
                        <li className="flex items-center gap-4"><Globe size={18} className="text-emerald-500"/> www.nexio.market</li>
                    </ul>
>>>>>>> Stashed changes
                </aside>
            </div>
        </div>
    );
};

export default ViewStore;