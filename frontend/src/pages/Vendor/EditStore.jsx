import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

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



  // 🔥 Fetch store
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
        navigate("/vendor/store");
        return;
    }

    fetchStore();
  }, [id, navigate]);

  // 🔥 Handle change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 Handle logo
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogo(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  // 🔥 Submit
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

      navigate("/vendor/store");

    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Update failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 font-sans">
        <div className="max-w-4xl mx-auto bg-white rounded-xl border shadow-sm p-10">
        
        {/* Header */}
        <header className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">
            Edit Store
            </h1>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Name */}
            <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                Store Name *
            </label>
            <input
                type="text"
                className="w-full border-2 p-3 rounded-xl focus:border-emerald-500 outline-none transition"
                value={form.name}
                required
                onChange={(e) =>
                setForm({ ...form, name: e.target.value })
                }
            />
            </div>

            {/* Description */}
            <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                Description
            </label>
            <textarea
                className="w-full border-2 p-3 rounded-xl h-32 focus:border-emerald-500 outline-none transition"
                value={form.description}
                onChange={(e) =>
                setForm({ ...form, description: e.target.value })
                }
            />
            </div>

            {/* Status (only in edit) */}
            <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                Status
            </label>
            <select
                className="w-full border-2 p-3 rounded-xl focus:border-emerald-500 outline-none transition"
                value={form.status}
                onChange={(e) =>
                setForm({ ...form, status: e.target.value })
                }
            >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
            </div>

            {/* Logo Upload */}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50 relative">
            <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="image/*"
                onChange={handleLogoChange}
            />

            {preview ? (
                <img
                src={preview}
                alt="Preview"
                className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                />
            ) : (
                <div className="text-gray-400">
                <p className="font-bold text-sm">UPLOAD STORE LOGO</p>
                </div>
            )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4">

            {/* Cancel */}
            <button
                type="button"
                onClick={() => navigate("/vendor/store")}
                className="w-full border-2 border-gray-300 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-100 transition"
            >
                CANCEL
            </button>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 disabled:bg-gray-300 transition"
            >
                {loading ? "UPDATING..." : "UPDATE STORE"}
            </button>

            </div>
        </form>
        </div>
    </div>
    );
}