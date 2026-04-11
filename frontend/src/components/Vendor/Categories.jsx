import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setCategories([
        "Electronics",
        "Fashion",
        "Home & Garden",
        "Sports",
        "Books",
        "Beauty",
      ]);
      setLoading(false);
    }, 1200);
  }, []);

  const handleAdd = () => {
  const trimmed = input.trim();
  if (!trimmed) return;

  setCategories(prev => {
    const exists = prev.some(
      c => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      alert("Category already exists!");
      return prev;
    }
    return [...prev, trimmed];
  });

  setInput("");
};

  const handleDelete = (name) => {
    if (!window.confirm(`Delete \"${name}\"?`)) return;
    setCategories(categories.filter((c) => c !== name));
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
          <label>Category Name</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Accessories"
            className="w-full border rounded-xl px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#1A9F73]"
          />
          <button
            onClick={handleAdd}
            className="w-full bg-[#1A9F73] hover:bg-green-600 text-white py-2 rounded-xl transition"
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
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full shadow-sm"
                >
                  <span className="text-sm">{cat}</span>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Categories;
