import React, { useEffect, useMemo, useState } from "react";
import {
  Store,
  CheckCircle2,
  Clock3,
  DollarSign,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import Layout from "../../components/Layouts/Layout";



const statusOptions = ["All Status", "active", "inactive"];
const sortOptions = ["Sort by Date", "Newest First", "Oldest First"];


function StatCard({ icon: Icon, value, label, iconBg, iconColor }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="text-2xl font-semibold text-slate-900 sm:text-3xl">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}


const defaultIcon = {
  icon: Store,
  bg: "bg-gray-500",
};

export default function StoresPage() {
  const[storesData, setStoresData] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("Sort by Date");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const pageSize = 5;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const API_VERSION = import.meta.env.VITE_API_VERSION || '/api/v1';

  const filteredStores = useMemo(() => {
    let items = [...storesData];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter(
        (store) =>
          store.name.toLowerCase().includes(q) //||
        //   store.category.toLowerCase().includes(q) ||
        //   store.location.toLowerCase().includes(q) ||
        //   store.slug.toLowerCase().includes(q)
      );
    }

    if (status !== "All Status") {
      items = items.filter((store) => store.status?.toLowerCase() === status.toLowerCase());
    }


    switch (sortBy) {
      case "Newest First":
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "Oldest First":
        items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        break;
    }

    return items;
  }, [debouncedSearch, status, sortBy, storesData]);

  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchStoresData = async () => {
    try {
        const res = await axios.get(
            `${API_BASE_URL}${API_VERSION}/store/my-stores`,
            {withCredentials: true}
        )

        console.log("Response :", res.data.data);
        setStoresData(res.data.data)

    } catch (error) {
        console.error("Error fetching store data",error);
    }
    
  }

  useEffect(()=> {
    fetchStoresData();
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  },[]);

  const totalPages = Math.max(1, Math.ceil(filteredStores.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedStores = filteredStores.slice((safePage - 1) * pageSize, safePage * pageSize);

  const totalStores = storesData.length;
  const activeStores = storesData.filter((s) => s.status === "active").length;
  const inactiveStores = storesData.filter((s) => s.status === "inactive").length;
  const navigate = useNavigate();

  const resetToFirstPage = (setter, value) => {
    setter(value);
    setPage(1);
  };

  return (
    <Layout>
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Stores</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage all your vendor stores in one place.
            </p>
          </div>

          <button 
            onClick={() => navigate("/vendor/create-store")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A9F73] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
            >
            <Plus className="h-4 w-4" />
            Create New Store
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={Store}
            value={totalStores}
            label="Total Stores"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={CheckCircle2}
            value={activeStores}
            label="Active Stores"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={Clock3}
            value={inactiveStores}
            label="Inactive Stores"
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search stores..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1A9F73] focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="relative">
              <select
                value={status}
                onChange={(e) => resetToFirstPage(setStatus, e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none transition focus:border-[#1A9F73] focus:ring-2 focus:ring-emerald-100"
              >
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>


            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => resetToFirstPage(setSortBy, e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none transition focus:border-[#1A9F73] focus:ring-2 focus:ring-emerald-100"
              >
                {sortOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-245 w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-4">Store</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Products</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {paginatedStores.length ? (
                  paginatedStores.map((store) => {
                    const isActive = store.status?.toLowerCase() === "active";
                    return (
                      <tr key={store._id}
                          onClick={() => navigate(`/vendor/store/${store._id}`)}
                          className="group hover:bg-slate-50/70 cursor-pointer focus-within:bg-slate-100">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 overflow-hidden transition-transform duration-200 group-hover:scale-110`}>
                              {store.logo ? (
                                    <img
                                    src={store.logo}
                                    alt={store.name}
                                    className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <Store className="h-5 w-5 text-slate-400" />
                                )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{store.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            {store.status?.toUpperCase() || "UNKNOWN"}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-700">{store.productCount ?? 0}</td>
                        <td className="px-4 py-4 text-slate-600">{store.createdAt ? new Date(store.createdAt).toLocaleDateString() : "-"}</td>
                        <td className="px-4 py-4 relative">
                          <button 
                            onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();

                                    if (openMenuId === store._id) {
                                      setOpenMenuId(null);
                                      setMenuPosition(null);
                                    } else {
                                      setOpenMenuId(store._id);
                                      setMenuPosition({
                                        top: rect.bottom + 6,
                                        left: Math.min(rect.right - 150, window.innerWidth - 160)
                                      });
                                    }
                                }}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      No stores match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {filteredStores.length ? (safePage - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(safePage * pageSize, filteredStores.length)} of {filteredStores.length} stores
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const current = index + 1;
                return (
                  <button
                    key={current}
                    onClick={() => setPage(current)}
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${
                      safePage === current
                        ? "bg-[#1A9F73] text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {current}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {openMenuId && menuPosition &&
      createPortal(
        <div
          style={{
            position: "fixed",
            top: menuPosition.top,
            left: menuPosition.left,
          }}
          className="z-50 w-36 rounded-xl border border-slate-200 bg-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
            onClick={() => {
              navigate(`/vendor/edit-store/${openMenuId}`);
              setOpenMenuId(null);
            }}
          >
            Edit
          </button>

          <button
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              const store = storesData.find(s => s._id === openMenuId);
              setDeleteTarget(store);
              setOpenMenuId(null);
            }}
          >
            Delete
          </button>
        </div>,
        document.body
      )}
      
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Delete Store
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget.name}</span>? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  try {
                    setIsDeleting(true);

                    await axios.delete(`${API_BASE_URL}${API_VERSION}/store/${deleteTarget._id}`,
                      {withCredentials: true }
                    );

                    toast.success("Store deleted successfully");

                    // remove from UI
                    setStoresData((prev) =>
                      prev.filter((s) => s._id !== deleteTarget._id)
                    );

                    setDeleteTarget(null);
                  } catch (err) {
                    console.error(err);
                    toast.error(
                      err?.response?.data?.message || "Failed to delete store"
                    );
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
}