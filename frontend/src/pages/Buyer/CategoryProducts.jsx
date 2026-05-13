import React, { useMemo, useState } from "react";
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
} from "lucide-react";

const productsData = [
  {
    id: 1,
    name: "Wireless Noise Cancelling Headphones",
    category: "Audio",
    badge: "HOT",
    badgeType: "hot",
    price: 89.99,
    rating: 4.8,
    reviews: 234,
    stockText: "In Stock · 45 units",
    image:
      "https://images.unsplash.com/photo-1518441902117-f0a1b0d1c3a9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Smart Watch Fitness Tracker Pro",
    category: "Wearables",
    badge: "NEW",
    badgeType: "new",
    price: 129.99,
    rating: 4.7,
    reviews: 189,
    stockText: "In Stock",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "USB Condenser Microphone Studio Kit",
    category: "Audio",
    badge: "SALE",
    badgeType: "sale",
    price: 59.99,
    rating: 4.9,
    reviews: 88,
    stockText: "In Stock",
    image:
      "https://images.unsplash.com/photo-1590602847861-8c6f9f8b7d0c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "True Wireless Earbuds ANC Pro",
    category: "Audio",
    badge: "LOW STOCK",
    badgeType: "low",
    price: 74.99,
    rating: 4.6,
    reviews: 156,
    stockText: "6 units left",
    image:
      "https://images.unsplash.com/photo-1606220945770-6f9d5e0b0fd2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    name: "Wireless Noise Cancelling Headphones",
    category: "Audio",
    badge: "HOT",
    badgeType: "hot",
    price: 89.99,
    rating: 4.8,
    reviews: 234,
    stockText: "In Stock · 45 units",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    name: "Smart Watch Fitness Tracker Pro",
    category: "Wearables",
    badge: "NEW",
    badgeType: "new",
    price: 129.99,
    rating: 4.7,
    reviews: 189,
    stockText: "In Stock",
    image:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 7,
    name: "USB Condenser Microphone Studio Kit",
    category: "Audio",
    badge: "SALE",
    badgeType: "sale",
    price: 59.99,
    rating: 4.9,
    reviews: 88,
    stockText: "In Stock",
    image:
      "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 8,
    name: "True Wireless Earbuds ANC Pro",
    category: "Audio",
    badge: "LOW STOCK",
    badgeType: "low",
    price: 74.99,
    rating: 4.6,
    reviews: 156,
    stockText: "6 units left",
    image:
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=900&q=80",
  },
];

const categories = ["All Categories", "Audio", "Wearables"];
const sortOptions = ["Latest", "Price: Low to High", "Price: High to Low", "Top Rated"];

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

function Card({ item }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-slate-100">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass(
            item.badgeType
          )}`}
        >
          {item.badge}
        </span>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold text-slate-800">
          {item.name}
        </h3>

        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-medium text-slate-700">{item.rating}</span>
          <span>({item.reviews})</span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-slate-900">
              ${item.price.toFixed(2)}
            </div>
            <div className={`mt-0.5 text-xs font-medium ${stockClass(item.stockText)}`}>
              {item.stockText}
            </div>
          </div>

          <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#1A9F73] hover:text-[#1A9F73]">
            <CirclePlus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("Latest");
  const [activeTab, setActiveTab] = useState("All Products");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const filteredProducts = useMemo(() => {
    let items = [...productsData];

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.badge.toLowerCase().includes(q)
      );
    }

    if (category !== "All Categories") {
      items = items.filter((p) => p.category === category);
    }

    if (activeTab !== "All Products") {
      items = items.filter((p) => p.category === activeTab);
    }

    switch (sortBy) {
      case "Price: Low to High":
        items.sort((a, b) => a.price - b.price);
        break;
      case "Price: High to Low":
        items.sort((a, b) => b.price - a.price);
        break;
      case "Top Rated":
        items.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return items;
  }, [search, category, sortBy, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const currentProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const resetPage = (setter, value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[24px] bg-[#1A9F73] px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-[#1A9F73] shadow-sm">
                  <ShoppingCart className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">TechGadgets Pro</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/80">
                    <span>@techgadgetspro</span>
                    <span className="inline-flex items-center gap-1">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified Vendor
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
                Premium electronics and smart accessories. Every product is quality-checked before listing.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
                  <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                  4.5 Rating
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
                  <Package className="h-3.5 w-3.5" />
                  156 Products
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-white/10 lg:min-w-[260px] lg:border-l lg:pl-8">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-3xl font-bold text-yellow-300">2,345</div>
                <div className="mt-1 text-[11px] font-medium tracking-[0.18em] text-white/80">
                  ORDERS FULFILLED
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-3xl font-bold text-yellow-300">98%</div>
                <div className="mt-1 text-[11px] font-medium tracking-[0.18em] text-white/80">
                  SATISFACTION
                </div>
              </div>
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
                placeholder="Search products in TechGadgets Pro..."
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
            {["All Products", "Audio", "Wearables"].map((tab) => (
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
          {currentProducts.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1A9F73]/30 bg-white text-[#1A9F73] transition hover:bg-[#1A9F73]/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[#1A9F73]/30 bg-white px-3 text-sm font-medium text-[#1A9F73]">
            {safePage}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1A9F73]/30 bg-white text-[#1A9F73] transition hover:bg-[#1A9F73]/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}