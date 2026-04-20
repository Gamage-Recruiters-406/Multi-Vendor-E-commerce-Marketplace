import React, { useState } from 'react';
import axios from 'axios';
import { CloudUpload, Save, Store } from 'lucide-react';

const CreateStore = () => {
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [logo, setLogo] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Use FormData for multipart/form-data support (required for images)
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        if (logo) data.append('logo', logo);

        try {
            // Retrieve token from localStorage for protected route
            const token = localStorage.getItem('token'); 
            
            // API call using environment variable for the base URL
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/store`, data, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });

            if (res.data.success) {
                alert("Store Created Successfully!");
                // Optional: Redirect to the dashboard or store view
            }
        } catch (err) {
            console.error("Submission error:", err);
            alert(err.response?.data?.message || "An error occurred while creating the store.");
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen p-6 font-sans">
            <div className="max-w-4xl mx-auto bg-white rounded-xl border shadow-sm p-10">
                <header className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">Create Your Store</h1>
                    <p className="text-gray-500 mt-2">Set up your vendor store and start selling to millions of customers</p>
                </header>

                {/* Progress Stepper - Visual representation of onboarding */}
                <div className="flex items-center justify-center space-x-4 mb-12">
                    <div className="flex flex-col items-center">
                        <span className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">1</span>
                        <span className="text-xs mt-2 text-emerald-600 font-semibold">Store Info</span>
                    </div>
                    <div className="h-px w-16 bg-gray-200 mb-6"></div>
                    <div className="flex flex-col items-center">
                        <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">2</span>
                        <span className="text-xs mt-2 text-gray-400">Branding</span>
                    </div>
                    <div className="h-px w-16 bg-gray-200 mb-6"></div>
                    <div className="flex flex-col items-center">
                        <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">3</span>
                        <span className="text-xs mt-2 text-gray-400">Products</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Store Information</h2>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Store Name *</label>
                            <input 
                                type="text" 
                                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" 
                                placeholder="Enter your store name" 
                                required
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Store Description</label>
                            <textarea 
                                className="w-full border p-3 rounded-lg h-32 outline-none focus:ring-2 focus:ring-emerald-500 transition" 
                                placeholder="Tell buyers what your store is about..."
                                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                            />
                        </div>
                    </section>

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
                                    <p className="text-xs text-gray-400 mt-1">Square format (PNG, JPG) recommended</p>
                                </>
                            )}
                        </div>
                    </section>

                    <div className="flex gap-4 pt-6">
                        <button 
                            type="button" 
                            className="flex-1 flex items-center justify-center gap-2 border border-emerald-500 text-emerald-600 font-bold py-3 rounded-lg hover:bg-emerald-50 transition"
                        >
                            <Save size={18} /> Save as Draft
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition"
                        >
                            <Store size={18} /> Create Store
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateStore;