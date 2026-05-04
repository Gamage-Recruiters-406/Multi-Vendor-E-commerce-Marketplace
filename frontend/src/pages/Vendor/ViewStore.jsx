import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ShoppingBag, Mail, Phone, Globe, Store, ArrowRight } from 'lucide-react';

// Shared Components
import Header from "../../components/Layouts/Header";
import Footer from "../../components/Layouts/Footer";

const ViewStore = () => {
    const { id } = useParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const apiVersion = import.meta.env.VITE_API_VERSION || '/api/v1';
    const API_URL = `${baseUrl.replace(/\/+$/, '')}/${apiVersion.replace(/^\/+/, '')}`;

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true 
                };

                // 1. Fetch Store Details
                const storeRes = await axios.get(`${API_URL}/store/${id}`, config);
                if (storeRes.data.success) {
                    setStore(storeRes.data.data);
                }

                // 2. Fetch Products directly for this store
                const prodRes = await axios.get(`${API_URL}/product/store/${id}`, config);
                
                if (prodRes.data.success) {
                    setProducts(prodRes.data.data || []);
                }
            } catch (err) {
                console.error("Error fetching store data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchAllData();
    }, [id, API_URL]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center font-black text-emerald-600 animate-pulse uppercase tracking-[0.2em]">
            Loading Tech Space...
        </div>
    );

    return (
        <>
            <Header />
            <div className="bg-gray-50 min-h-screen pb-20">
                {/* Branding Header */}
                <div className="bg-white border-b py-12 px-6 shadow-sm">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="w-32 h-32 rounded-full border-4 border-emerald-50 overflow-hidden shadow-md bg-white">
                                {store?.logo ? (
                                    <img src={store.logo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-200">
                                        <Store size={48} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-emerald-900 tracking-tight uppercase">{store?.name || "Clothing X"}</h1>
                                <p className="text-gray-500 mt-2 italic max-w-lg leading-relaxed">{store?.description || "New potent clothing"}</p>
                                <div className="flex gap-3 mt-4 justify-center md:justify-start items-center">
                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Vendor Store</span>
                                    <span className="flex items-center gap-1 text-gray-400 text-xs font-bold uppercase tracking-wider"><MapPin size={14}/> COLOMBO, LK</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Collection Display */}
                <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <div className="lg:col-span-3">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-emerald-900 flex items-center gap-2 uppercase tracking-tighter">
                                <ShoppingBag className="text-emerald-500" /> Featured Collection ({products.length})
                            </h2>
                            <Link to="/vendor/products" className="text-emerald-600 font-black flex items-center gap-1 hover:underline text-xs uppercase tracking-widest">
                                View All Product <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {products.length > 0 ? (
                                products.slice(0, 4).map((product) => (
                                    <div key={product._id} className="bg-white p-4 rounded-3xl border shadow-sm hover:shadow-md transition-all group">
                                        <div className="w-full h-40 bg-gray-50 rounded-2xl overflow-hidden mb-4">
                                            <img 
                                                src={product.images?.[0] || 'https://via.placeholder.com/400'} 
                                                alt={product.name} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                            />
                                        </div>
                                        <h3 className="font-black text-gray-800 text-base uppercase tracking-tight truncate">{product.name}</h3>
                                        <p className="text-emerald-600 font-black mt-1 text-lg">
                                            LKR {product.price?.toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 py-32 text-center border-4 border-dashed border-gray-100 rounded-[3rem] text-gray-300 font-black uppercase tracking-[0.2em]">
                                    No Products Found For This Store
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Sidebar */}
                    <aside className="bg-white p-8 rounded-[2.5rem] border shadow-sm h-fit">
                        <h4 className="font-black text-gray-800 text-lg mb-6 border-b border-gray-100 pb-4 uppercase tracking-tighter">Contact Vendor</h4>
                        <ul className="space-y-6 text-sm text-slate-600 font-bold">
                            <li className="flex items-center gap-4 group cursor-default"><Mail size={18} className="text-emerald-500"/> support@nexio.lk</li>
                            <li className="flex items-center gap-4 group cursor-default"><Phone size={18} className="text-emerald-500"/> +94 77 123 4567</li>
                            <li className="flex items-center gap-4 group cursor-default"><Globe size={18} className="text-emerald-500"/> www.nexio.market</li>
                        </ul>
                    </aside>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ViewStore;
