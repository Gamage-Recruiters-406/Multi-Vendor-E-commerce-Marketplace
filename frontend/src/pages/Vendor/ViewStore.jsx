import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ShoppingBag, PlusCircle, Mail, Phone, Globe, Store, Star } from 'lucide-react';
import Header from "../../components/Layouts/Header";
import Footer from "../../components/Layouts/Footer";

const ViewStore = () => {
    const { id } = useParams();
    const [store, setStore] = useState(null);
    const [isOwner, setIsOwner] = useState(false);

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const apiVersion = import.meta.env.VITE_API_VERSION || '/api/v1';
    const API_URL = `${baseUrl.replace(/\/+$/, '')}/${apiVersion.replace(/^\/+/, '')}`;

    useEffect(() => {
        const fetchStore = async () => {
            try {
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
                        setIsOwner(true);
                    }
                }
            } catch (err) {
                console.error("Error:", err);
            }
        };
        
        if (id) fetchStore();
    }, [id, API_URL]);

    if (!store) return <div className="p-20 text-center font-bold text-emerald-600 animate-pulse uppercase tracking-widest">LOADING NEXIO STORE...</div>;

    return (
        <>
            <Header /> {/* ADDED HEADER */}
            
            <div className="bg-gray-50 min-h-screen pb-20">
                <div className="bg-white border-b py-12 px-6 shadow-sm">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="w-32 h-32 rounded-full border-4 border-emerald-50 overflow-hidden shadow-md bg-white">
                                {store.logo ? (
                                    <img src={store.logo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-200">
                                        <Store size={48} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-emerald-900 tracking-tight uppercase">{store.name}</h1>
                                <p className="text-gray-500 mt-2 italic max-w-lg">{store.description}</p>
                                <div className="flex gap-3 mt-4 justify-center md:justify-start items-center">
                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Vendor Store</span>
                                    <span className="flex items-center gap-1 text-gray-400 text-xs font-bold uppercase"><MapPin size={14}/> COLOMBO, LK</span>
                                </div>
                            </div>
                        </div>

                        {/* VENDOR BUTTON */}
                        {isOwner && (
                            <Link 
                                to={`/vendor/product_create?storeId=${store._id}`} 
                                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 shadow-xl transition active:scale-95 uppercase tracking-widest"
                            >
                                <PlusCircle size={22} /> ADD NEW PRODUCT
                            </Link>
                        )}
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <div className="lg:col-span-3">
                        <h2 className="text-2xl font-black text-emerald-900 mb-8 flex items-center gap-2 uppercase tracking-tighter">
                            <ShoppingBag className="text-emerald-500" /> Featured Collection
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="col-span-3 py-24 text-center border-2 border-dashed rounded-3xl text-gray-300 font-bold uppercase tracking-widest">
                                No Products Listed Yet
                            </div>
                        </div>
                    </div>

                    <aside className="bg-white p-8 rounded-3xl border shadow-sm h-fit">
                        <h4 className="font-black text-gray-800 text-lg mb-6 border-b pb-4 uppercase">Contact Vendor</h4>
                        <ul className="space-y-6 text-sm text-gray-600 font-bold">
                            <li className="flex items-center gap-4 group"><Mail size={18} className="text-emerald-500"/> support@nexio.lk</li>
                            <li className="flex items-center gap-4 group"><Phone size={18} className="text-emerald-500"/> +94 77 123 4567</li>
                            <li className="flex items-center gap-4 group"><Globe size={18} className="text-emerald-500"/> www.nexio.market</li>
                        </ul>
                    </aside>
                </div>
            </div>

            <Footer /> {/* ADDED FOOTER */}
        </>
    );
};

export default ViewStore;
