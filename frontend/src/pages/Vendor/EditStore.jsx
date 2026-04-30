import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { CloudUpload, Store, Info, Type, CheckCircle2 } from 'lucide-react';

export default function EditStore() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
  });

  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const API_VERSION = import.meta.env.VITE_API_VERSION || '/api/v1';



  // Fetch store
  const fetchStore = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_VERSION}/store/${id}`,
        { withCredentials: true }
      );

      const data = res.data.data;

      setForm({
        name: data.name || "",
        description: data.description || "",
        status: data.status || "active",
      });

      setPreview(data.logo);

    } catch (err) {
      toast.error("Failed to load store");
    }
  };

  useEffect(() => {
    if (!id) {
        navigate("/vendor/stores");
        return;
    }

    fetchStore();
  }, [id, navigate]);

  // Handle change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle logo
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogo(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("status", form.status);

      if (logo) {
        formData.append("logo", logo);
      }

      await axios.put(
        `${API_BASE_URL}${API_VERSION}/store/${id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Store updated successfully");

      navigate("/vendor/stores");

    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Update failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070')` 
      }}
    >

      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 my-10">
        <div className="p-8 sm:p-12">

          {/* HEADER */}
          <header className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
              <Store className="text-emerald-600 w-8 h-8" />
            </div>

            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3 uppercase">
              Edit Store
            </h1>

            <p className="text-gray-500 text-lg font-medium max-w-md mx-auto leading-relaxed">
              Update your store details and branding
            </p>
          </header>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* NAME */}
            <div>
              <label className="flex items-center text-xs font-black text-emerald-800 mb-2 uppercase tracking-widest">
                <Type className="w-4 h-4 mr-2" />Store Name
              </label>
              <input 
                type="text"
                placeholder="Enter your store name"
                className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                value={form.name}
                required
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="flex items-center text-xs font-black text-emerald-800 mb-2 uppercase tracking-widest">
                <Info className="w-4 h-4 mr-2" />Store Description
              </label>
              <textarea
                placeholder="Describe your store..."
                className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl h-32 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm resize-none"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            {/* STATUS (EDIT ONLY) */}
            <div>
              <label className="flex items-center text-xs font-black text-emerald-800 mb-2 uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4 mr-2" />Store Status
              </label>
              <select
                className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* LOGO */}
            <div>
              <label className="flex items-center text-xs font-black text-emerald-800 mb-2 uppercase tracking-widest">
                <CloudUpload className="w-4 h-4 mr-2" />Branding & Logo
              </label>

              <div className="group relative border-2 border-dashed border-gray-200 rounded-4xl p-8 text-center bg-gray-50 hover:bg-emerald-50/50 hover:border-emerald-400 transition-all cursor-pointer">
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  accept="image/*"
                  onChange={handleLogoChange}
                />

                {preview ? (
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-2xl"
                    />
                    <div className="mt-4 text-emerald-600 font-black text-xs uppercase tracking-tighter">
                      Click to change logo
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
                      <Store className="text-emerald-500" size={32} />
                    </div>
                    <p className="font-black text-gray-400 text-xs uppercase tracking-widest">
                      Upload Store Logo
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-2">

              {/* CANCEL */}
              <button
                type="button"
                onClick={() => navigate("/vendor/stores")}
                className="w-1/2 border-2 border-gray-200 text-gray-600 font-black py-4 rounded-3xl hover:bg-gray-100 transition-all uppercase tracking-widest"
              >
                Cancel
              </button>

              {/* UPDATE */}
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 bg-emerald-600 text-white font-black text-lg py-4 rounded-3xl hover:bg-emerald-700 active:scale-[0.98] shadow-2xl shadow-emerald-200 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                {loading ? "UPDATING..." : "Update Store"}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
);
}