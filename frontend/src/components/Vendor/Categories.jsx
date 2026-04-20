import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { showToast } from "../../utils/toast";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [parentCategory, setParentCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedName, setSelectedName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const API_VERSION = import.meta.env.VITE_API_VERSION || '/api/v1';


  const renderCategoryOptions = (categories, level = 0) => {
    return categories.map((cat) => (
      <React.Fragment key={cat._id}>
        <option value={cat._id}>
          {`${"↳ ".repeat(level)}${cat.name}`}
        </option>

        {cat.children && cat.children.length > 0 &&
          renderCategoryOptions(cat.children, level + 1)}
      </React.Fragment>
    ));
  };

  const renderCategoryTree = (nodes, level = 0) => {
    return nodes.map((cat) => (
      <div key={cat._id}>
        <div
          className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-xl mb-2"
          style={{ marginLeft: `${level * 20}px` }}
        >
          <span className="text-sm">
            {level > 0 && "↳ "}
            {cat.name}
          </span>

          <button
            onClick={() => openDeleteModal(cat._id, cat.name)}
            className="text-gray-400 hover:text-red-500 transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Render children recursively */}
        {cat.children && cat.children.length > 0 &&
          renderCategoryTree(cat.children, level + 1)}
      </div>
    ));
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_VERSION}/category`,
        {withCredentials: true}
      );

      console.log("Response : ", res.data);
      // const flat = flattenCategories(res.data.data);
      setCategories(res.data.data);
      
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    try {
      await axios.post(
        `${API_BASE_URL}${API_VERSION}/category`,
        {
          name: trimmed,
          parentCategory: parentCategory || null,
        },
        { withCredentials: true }
      );

      setInput("");
      setParentCategory(""); // reset dropdown
      await fetchCategories(); // keep data consistent

      showToast("success", "Category created");

    } catch (err) {
      console.error("Error adding category:", err);

      if (err.response?.status === 409) {
        showToast("error", "This category already exists");
    
      } else {
        showToast("error", "Something went wrong. Please try again");
  
      }
    }
  };

  const openDeleteModal = (id, name) => {
    setSelectedId(id);
    setSelectedName(name);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(
        `${API_BASE_URL}${API_VERSION}/category/${selectedId}`, 
        { withCredentials: true }
      );
      setDeleting(false);
      await fetchCategories();

      showToast("success", "Category has been deleted.");


    } catch (err) {
      if (err.response?.status === 400) {
        showToast("error", "Cannot delete category with subcategories");
        
      } else {
        console.error(err);
        showToast("error", "Failed to delete category.");
        
      }
    } finally {
      setShowModal(false);
      setSelectedId(null);
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold">Category Management</h1>
      <p className="text-gray-500 mt-1 mb-6">
        Organize your products into categories to help customers find them easily.
      </p>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-medium mb-4">Create Category</h2>
          <label className="block mb-1">Parent Category</label>
          <select
            value={parentCategory}
            onChange={(e) => setParentCategory(e.target.value)}
            className="w-full border rounded-xl px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#1A9F73]"
          >
            <option value="">No Parent (Top Level)</option>

            {renderCategoryOptions(categories)}
          </select>
          <label>Category Name</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Accessories"
            className="w-full border rounded-xl px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#1A9F73]"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="w-full bg-[#1A9F73] hover:bg-green-800 text-white py-2 rounded-xl transition"
          >
            + Add Category
          </button>
        </div>

        {/* List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-medium mb-4">Existing Categories</h2>

          {categories.length === 0 && !loading && (
            <p className="text-gray-400 text-sm">No categories yet</p>
          )}

          {loading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {renderCategoryTree(categories)}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-lg">
            
            <h2 className="text-lg font-semibold mb-2">Delete Category</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete "{selectedName}"?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}
export default Categories;
