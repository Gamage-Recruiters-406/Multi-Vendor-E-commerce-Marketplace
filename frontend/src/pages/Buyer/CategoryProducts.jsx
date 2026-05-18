import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  BadgeCheck,
  Package,
  AudioLines,
  Watch,
  Flame,
  Sparkles,
  ShieldAlert,
  ShoppingCart,
  Minus,
  CirclePlus,
  Heart,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layouts/Layout";



const sortOptions = ["Latest", "Price: Low to High", "Price: High to Low"];

function badgeClass(type) {
  switch (type) {
    case "hot":
      return "bg-amber-100 text-amber-700";
    case "new":
      return "bg-emerald-100 text-emerald-700";
    case "sale":
      return "bg-teal-100 text-teal-700";
    case "low":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function stockClass(text) {
  if (text.toLowerCase().includes("units left")) return "text-amber-600";
  return "text-emerald-600";
}

function getBadge(item) {
  if (item.stock <= 10) {
    return {
      text: "LOW STOCK",
      type: "low",
    };
  }

  const createdDate = new Date(item.createdAt);
  const now = new Date();

  const diffDays =
    (now - createdDate) / (1000 * 60 * 60 * 24);

  if (diffDays <= 7) {
    return {
      text: "NEW",
      type: "new",
    };
  }

  return {
    text: "POPULAR",
    type: "hot",
  };
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Image Skeleton */}
      <div className="aspect-4/3 animate-pulse bg-slate-200" />

      <div className="p-4">
        {/* Product Title */}
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />

        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />

        {/* Store */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded-full bg-slate-200" />

          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        </div>

        {/* Price + Button */}
        <div className="mt-5 flex items-center justify-between">
          <div>
            <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />

            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-200" />
          </div>

          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function Card({ item, addToWishlist, wishlistLoading, wishlistItems, removeFromWishlist }) {
  const badge = getBadge(item);
  const navigate = useNavigate();
  const isWishlisted = wishlistItems.includes(item._id);

  return (
    <div 
    onClick={() => navigate(`/buyer/productdetails/${item._id}`)} 
    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-4/3 bg-slate-100">
        <img
          src={item.images?.[0]}
          alt={item.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass(
            badge.type
          )}`}
        >
          {badge.text}
        </span>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-800">
          {item.name}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <img
            src={item.store?.logo}
            alt={item.store?.name}
            className="h-5 w-5 rounded-full object-cover"
          />

          <span className="text-xs text-slate-500">
            {item.store?.name}
          </span>
        </div>

        {/* <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-medium text-slate-700">{item.rating}</span>
          <span>({item.reviews})</span>
        </div> */}

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-slate-900">
              ${item.price.toFixed(2)}
            </div>
            <div
              className={`mt-0.5 text-xs font-medium ${
                item.stock <= 10
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {item.stock > 0
                ? `${item.stock} units available`
                : "Out of stock"}
            </div>
          </div>

          <button
            title={
              isWishlisted
                ? "Remove from Wishlist"
                : "Add to Wishlist"
            }
            onClick={(e) => {
              e.stopPropagation();

              if (isWishlisted) {
                removeFromWishlist(item._id);
              } else {
                addToWishlist(item._id);
              }
            }}
            disabled={wishlistLoading === item._id}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
              wishlistLoading === item._id
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : isWishlisted
                ? "border-[#1A9F73] bg-[#1A9F73]/10 text-[#1A9F73] hover:bg-[#1A9F73]/20"
                : "border-slate-200 text-slate-500 hover:border-[#1A9F73] hover:bg-[#1A9F73] hover:text-white"
            }`}
          >
            <Heart
              className={`h-4 w-4 transition ${
                wishlistLoading === item._id
                  ? "animate-pulse"
                  : isWishlisted
                  ? "fill-[#1A9F73]"
                  : ""
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceProductsPage() {
  const [productsData, setProductData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("Latest");
  const [activeTab, setActiveTab] = useState("All Products");
  const [page, setPage] = useState(1);
  const [wishlistLoading, setWishlistLoading] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);

  const categories = [
    "All Categories",
    ...new Set(productsData.map((p) => p.category?.name))
  ];

  const tabs = [
  "All Products",
  ...new Set(productsData.map((p) => p.category?.name))
];

  const pageSize = 8;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const API_VERSION = import.meta.env.VITE_API_VERSION || '/api/v1';

  const fetchProducts = async()=> {
    setLoading(true)

    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_VERSION}/product`,
        {withCredentials: true}
      )

      console.log("Response: ", res.data.data);
      setProductData(res.data.data)

    } catch (error) {
      console.error("Error fetching Products data",error);
    } finally {
      setLoading(false)
    }

  }

  const addToWishlist = async (productId) => {
    try {
      setWishlistLoading(productId);

      const res = await axios.post(
        `${API_BASE_URL}${API_VERSION}/wishlist/add`,
        {
          product_id: productId,
        },
        {
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setWishlistItems((prev) => [...prev, productId]);
        toast.success(res.data.message || "Added to wishlist");
      }
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to add to wishlist"
      );
    } finally {
      setWishlistLoading(null);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_VERSION}/wishlist`,
        {
          withCredentials: true,
        }
      );

      console.log("Wishists: ",res.data.data);

      if (res.data.success) {
        const ids = res.data.data.items.map(
          (item) => item.product_id._id
        );

        setWishlistItems(ids);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await axios.delete(
        `${API_BASE_URL}${API_VERSION}/wishlist/${productId}`,
        {
          withCredentials: true,
        }
      );

      setWishlistItems((prev) =>
        prev.filter((id) => id !== productId)
      );

      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove");
    }
  };

  useEffect(()=> {
    fetchProducts();
    fetchWishlist();
  }, []);

  const filteredProducts = useMemo(() => {
    let items = [...productsData];
    items = items.filter((p) => p.status === "active");

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
      );
    }

    if (category !== "All Categories") {
      items = items.filter((p) => p.category?.name === category);
    }

    if (activeTab !== "All Products") {
      items = items.filter((p) => p.category?.name === activeTab);
    }

    switch (sortBy) {
      case "Price: Low to High":
        items.sort((a, b) => a.price - b.price);
        break;
      case "Price: High to Low":
        items.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    return items;
  }, [productsData, search, category, sortBy, activeTab, wishlistItems]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const currentProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);
  const totalproducts = productsData.length
  

  const resetPage = (setter, value) => {
    setter(value);
    setPage(1);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[#1A9F73] via-[#168863] to-[#117a59] p-6 text-white shadow-xl sm:p-8">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-size:40px_40px" />
            </div>

            {/* Bottom Gradient */}
            <div className="absolute bottom-0 left-0 h-24 w-full bg-linear-to-t from-black/10 to-transparent" />

            {/* Floating Icons */}
            <div className="absolute right-8 top-8 hidden lg:flex flex-col gap-4 opacity-20">
              <AudioLines className="h-10 w-10" />
              <Watch className="h-10 w-10" />
              <ShoppingCart className="h-10 w-10" />
            </div>

            <div className="relative z-10">
              {/* Marketplace Label */}
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                Multi Vendor Marketplace
              </p>

              {/* Heading */}
              <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
                Find Products Across Multiple Categories
              </h1>

              {/* Description */}
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                Browse products from verified vendors across fashion,
                electronics, accessories, wearables, and more — all in one
                marketplace.
              </p>

              {/* Live Activity */}
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                300+ new products added this week
              </div>

              {/* Marketplace Stats */}
              <div className="mt-6 flex flex-wrap items-center gap-8">
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{totalproducts}+</p>
                  <p className="text-sm text-white/75">Products</p>
                </div>

                <div>
                  <p className="text-2xl font-bold text-yellow-500">80+</p>
                  <p className="text-sm text-white/75">Vendors</p>
                </div>

                <div>
                  <p className="text-2xl font-bold text-yellow-500">24</p>
                  <p className="text-sm text-white/75">Categories</p>
                </div>
              </div>

              {/* Category Pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {["Audio", "Wearables", "Gaming", "Fashion", "Accessories"].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search products by Name or Category..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1A9F73] focus:bg-white focus:ring-2 focus:ring-[#1A9F73]/15"
                />
              </div>

              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => resetPage(setCategory, e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none transition focus:border-[#1A9F73] focus:ring-2 focus:ring-[#1A9F73]/15"
                >
                  {categories.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => resetPage(setSortBy, e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none transition focus:border-[#1A9F73] focus:ring-2 focus:ring-[#1A9F73]/15"
                >
                  {sortOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => resetPage(setActiveTab, tab)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === tab
                      ? "border-[#1A9F73] bg-[#1A9F73]/10 text-[#1A9F73]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {tab === "All Products" && <Sparkles className="h-3.5 w-3.5" />}
                  {tab === "Audio" && <AudioLines className="h-3.5 w-3.5" />}
                  {tab === "Wearables" && <Watch className="h-3.5 w-3.5" />}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading
            ? Array.from({ length: 8 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
              ))
            : currentProducts.map((item) => (
                <Card 
                key={item._id} 
                item={item}
                addToWishlist={addToWishlist}
                wishlistLoading={wishlistLoading}
                wishlistItems={wishlistItems}
                removeFromWishlist={removeFromWishlist}
                />
              ))}
          </div>
          {!loading && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {/* Previous */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#1A9F73] hover:text-[#1A9F73] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {(() => {
                const pages = [];

                // Always show first page
                pages.push(1);

                // Show left dots
                if (safePage > 3) {
                  pages.push("...");
                }

                // Show current surrounding pages
                for (
                  let i = Math.max(2, safePage - 1);
                  i <= Math.min(totalPages - 1, safePage + 1);
                  i++
                ) {
                  pages.push(i);
                }

                // Show right dots
                if (safePage < totalPages - 2) {
                  pages.push("...");
                }

                // Always show last page
                if (totalPages > 1) {
                  pages.push(totalPages);
                }

                return pages.map((item, index) => {
                  if (item === "...") {
                    return (
                      <span
                        key={`dots-${index}`}
                        className="px-2 text-slate-400"
                      >
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition ${
                        safePage === item
                          ? "border-[#1A9F73] bg-[#1A9F73] text-white shadow-md shadow-[#1A9F73]/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#1A9F73] hover:text-[#1A9F73]"
                      }`}
                    >
                      {item}
                    </button>
                  );
                });
              })()}

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#1A9F73] hover:text-[#1A9F73] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}