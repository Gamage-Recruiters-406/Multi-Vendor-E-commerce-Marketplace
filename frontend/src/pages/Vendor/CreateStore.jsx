import React, { useState } from 'react';
import axios from 'axios';
import { CloudUpload, Save, Store } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

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
        <div className="bg-gray-50 min-h-screen p-6 font-sans">
            <Toaster position="top-right" />
            <div className="max-w-4xl mx-auto bg-white rounded-xl border shadow-sm p-10">
                <header className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Create Store</h1>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Store Name *</label>
                        <input 
                            type="text" 
                            className="w-full border-2 p-3 rounded-xl focus:border-emerald-500 outline-none transition" 
                            value={formData.name}
                            required
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Description</label>
                        <textarea 
                            className="w-full border-2 p-3 rounded-xl h-32 focus:border-emerald-500 outline-none transition" 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})} 
                        />
                    </div>

                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50 relative">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoChange} />
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg" />
                        ) : (
                            <div className="text-gray-400">
                                <CloudUpload className="mx-auto mb-2" size={40} />
                                <p className="font-bold text-sm">UPLOAD STORE LOGO</p>
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 disabled:bg-gray-300 transition"
                    >
                        {loading ? "CREATING..." : "CREATE STORE"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateStore;
