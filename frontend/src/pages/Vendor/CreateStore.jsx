import React, { useState } from 'react';
import axios from 'axios';
import { CloudUpload, Store, Info, Type } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// IMPORT SHARED COMPONENTS
import Header from "../../components/Layouts/Header";
import Footer from "../../components/Layouts/Footer";

const CreateStore = () => {
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [logo, setLogo] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const apiVersion = import.meta.env.VITE_API_VERSION || '/api/v1';
    const API_URL = `${baseUrl.replace(/\/+$/, '')}/${apiVersion.replace(/^\/+/, '')}`;

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser || currentUser.role !== 'Vendor') {
            toast.error("Only Vendors can create stores.");
            return;
        }
        setLoading(true);
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        if (logo) data.append('logo', logo);
        try {
            const token = localStorage.getItem('token'); 
            const res = await axios.post(`${API_URL}/store`, data, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}` 
                }
            });
            if (res.data.success) {
                toast.success("Store Created Successfully!");
                setFormData({ name: '', description: '' });
                setLogo(null);
                setPreview(null);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Error creating store.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header /> {/* ADDED HEADER */}
            <div 
                className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-cover bg-center bg-no-repeat relative"
                style={{ 
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070')` 
                }}
            >
                <Toaster position="top-right" />
                <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 my-10">
                    <div className="p-8 sm:p-12">
                        <header className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
                                <Store className="text-emerald-600 w-8 h-8" />
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3 uppercase">Create Your Store</h1>
                            <p className="text-gray-500 text-lg font-medium max-w-md mx-auto leading-relaxed">
                                Set up your vendor store and start selling to millions of customers
                            </p>
                        </header>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="flex items-center text-xs font-black text-emerald-800 mb-2 uppercase tracking-widest">
                                    <Type className="w-4 h-4 mr-2" /> Store Name *
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Enter your store name"
                                    className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm" 
                                    value={formData.name} required
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="flex items-center text-xs font-black text-emerald-800 mb-2 uppercase tracking-widest">
                                    <Info className="w-4 h-4 mr-2" /> Store Description
                                </label>
                                <textarea 
                                    placeholder="Describe your store..."
                                    className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl h-32 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm resize-none" 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="flex items-center text-xs font-black text-emerald-800 mb-2 uppercase tracking-widest">
                                    <CloudUpload className="w-4 h-4 mr-2" /> Branding & Logo
                                </label>
                                <div className="group relative border-2 border-dashed border-gray-200 rounded-[2rem] p-8 text-center bg-gray-50 hover:bg-emerald-50/50 hover:border-emerald-400 transition-all cursor-pointer">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={handleLogoChange} />
                                    {preview ? (
                                        <div className="relative inline-block">
                                            <img src={preview} alt="Preview" className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-2xl" />
                                            <div className="mt-4 text-emerald-600 font-black text-xs uppercase tracking-tighter">Click to change logo</div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center py-4">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
                                                <CloudUpload className="text-emerald-500" size={32} />
                                            </div>
                                            <p className="font-black text-gray-400 text-xs uppercase tracking-widest">Upload Store Logo</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white font-black text-lg py-5 rounded-[1.5rem] hover:bg-emerald-700 active:scale-[0.98] shadow-2xl shadow-emerald-200 disabled:bg-gray-300 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">
                                {loading ? <span>CREATING STORE...</span> : <><Store size={22} /><span>Launch My Store</span></>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <Footer /> {/* ADDED FOOTER */}
        </>
    );
};

export default CreateStore;