import React, { useState } from 'react';
import axios from 'axios';
import { CloudUpload, Save, Store } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
<<<<<<< Updated upstream
import { API_URL } from '../../services/authService'; // Adjust path based on your folder structure
=======
>>>>>>> Stashed changes

const CreateStore = () => {
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [logo, setLogo] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
<<<<<<< Updated upstream
=======

    // Build the URL manually since authService isn't exporting it
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const apiVersion = import.meta.env.VITE_API_VERSION || '/api/v1';
    const API_URL = `${baseUrl.replace(/\/+$/, '')}/${apiVersion.replace(/^\/+/, '')}`;
>>>>>>> Stashed changes

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
<<<<<<< Updated upstream
        // Use FormData for multipart/form-data support (required for Cloudinary uploads)
=======
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser || currentUser.role !== 'Vendor') {
            toast.error("Only Vendors can create stores.");
            return;
        }

        setLoading(true);
>>>>>>> Stashed changes
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        if (logo) data.append('logo', logo);

        try {
            const token = localStorage.getItem('token'); 
<<<<<<< Updated upstream
            
            // API call using the shared API_URL to prevent /api/v1 duplication
            const res = await axios.post(`${API_URL}/store`, data, {
                headers: {
=======
            const res = await axios.post(`${API_URL}/store`, data, {
                headers: { 
>>>>>>> Stashed changes
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (res.data.success) {
                toast.success("Store Created Successfully!");
<<<<<<< Updated upstream
                // Clear form after success
=======
>>>>>>> Stashed changes
                setFormData({ name: '', description: '' });
                setLogo(null);
                setPreview(null);
            }
        } catch (err) {
<<<<<<< Updated upstream
            console.error("Submission error:", err);
            const errorMsg = err.response?.data?.message || "Verify your Vendor status and login.";
            toast.error(errorMsg);
=======
            toast.error(err.response?.data?.message || "Error creating store.");
>>>>>>> Stashed changes
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen p-6 font-sans">
            <Toaster position="top-right" />
            <div className="max-w-4xl mx-auto bg-white rounded-xl border shadow-sm p-10">
                <header className="text-center mb-10">
<<<<<<< Updated upstream
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Start Your Business</h1>
                    <p className="text-gray-500 mt-2">Setup your official vendor storefront on Nexio Marketplace</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Store Info Section */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Basic Details</h2>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Store Name *</label>
                            <input 
                                type="text" 
                                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" 
                                placeholder="e.g., Dulshan's Gem Gallery" 
                                value={formData.name}
                                required
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">About the Store</label>
                            <textarea 
                                className="w-full border p-3 rounded-lg h-32 outline-none focus:ring-2 focus:ring-emerald-500 transition" 
                                placeholder="Describe your products and brand values..."
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                            />
                        </div>
                    </section>

                    {/* Branding Section */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Branding</h2>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                accept="image/*"
                                onChange={handleLogoChange} 
                            />
                            {preview ? (
                                <div className="flex flex-col items-center">
                                    <img src={preview} alt="Preview" className="w-32 h-32 rounded-full object-cover shadow-md border-4 border-white" />
                                    <p className="text-xs text-gray-400 mt-2">Click to change logo</p>
                                </div>
                            ) : (
                                <>
                                    <CloudUpload className="text-gray-400 w-12 h-12 mb-2" />
                                    <p className="text-sm font-semibold text-gray-600">Upload Store Logo</p>
                                    <p className="text-xs text-gray-400 mt-1">High-quality PNG/JPG recommended</p>
                                </>
                            )}
                        </div>
                    </section>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                        <button 
                            type="button" 
                            className="flex-1 flex items-center justify-center gap-2 border border-emerald-500 text-emerald-600 font-bold py-3 rounded-lg hover:bg-emerald-50 transition"
                        >
                            <Save size={18} /> Save as Draft
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition disabled:bg-emerald-300"
                        >
                            <Store size={18} /> {loading ? "Creating Store..." : "Create Store"}
                        </button>
=======
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
>>>>>>> Stashed changes
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