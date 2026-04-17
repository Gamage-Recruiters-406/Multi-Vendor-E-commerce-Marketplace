// ============================================================
// src/pages/vendor/VendorDashboard.jsx
// ============================================================
// Vendor Dashboard — built with Tailwind CSS
// Primary color: #1A9F73
//
// API imports from: src/api/vendorDashboard.js
// Env config from:  .env → VITE_API_BASE_URL
//
// SECTION TAGS IN THIS FILE:
//   ✅ CONNECTED  — real API call, wire up with useEffect
//   🟡 DUMMY      — mock data, replace when backend ready
// ============================================================

import { useState, useEffect } from "react";
import {
  getVendorProfile, // ✅ CONNECTED
  getVendorOrders, // ✅ CONNECTED
  getAnnouncementsFeed, // ✅ CONNECTED
  getVendorDashboardStats, // 🟡 DUMMY
  getVendorSalesAnalytics, // 🟡 DUMMY
  getVendorProducts, // 🟡 DUMMY
} from "../../api/vendorDashboard";

const STATUS_STYLES = {
  Completed: "bg-green-100 text-green-800",
  Processing: "bg-yellow-100 text-yellow-800",
  Shipped: "bg-blue-100 text-blue-800",
  Cancelled: "bg-red-100 text-red-800",
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "products", label: "Products", icon: "📦" },
  { id: "orders", label: "Orders", icon: "🛒" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "store", label: "My Store", icon: "🏪" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
];

function SalesChart({ data, labels }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const W = 500,
    H = 130,
    PAD = 10;
  const pts = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - (v / max) * (H - PAD * 2);
    return [x, y];
  });
  const pointStr = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPath = `M ${pointStr} L ${W - PAD},${H - PAD} L ${PAD},${H - PAD} Z`;
  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 150 }}
        preserveAspectRatio="none"
      >
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={PAD}
            y1={PAD + i * 28}
            x2={W - PAD}
            y2={PAD + i * 28}
            stroke="#F3F4F6"
            strokeWidth="1"
          />
        ))}
        <path d={areaPath} fill="#1A9F7318" />
        <polyline
          points={pointStr}
          fill="none"
          stroke="#1A9F73"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill="white"
            stroke="#1A9F73"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        {labels.map((l) => (
          <span key={l} className="text-[10px] text-gray-400">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [chartPeriod, setChartPeriod] = useState("daily");
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState(null); // ✅ CONNECTED
  const [orders, setOrders] = useState([]); // ✅ CONNECTED
  const [notifications, setNotifications] = useState([]); // ✅ CONNECTED
  const [stats, setStats] = useState(null); // 🟡 DUMMY
  const [chartData, setChartData] = useState(null); // 🟡 DUMMY
  const [products, setProducts] = useState([]); // 🟡 DUMMY
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getVendorProfile(),
      getVendorOrders(),
      getAnnouncementsFeed(),
      getVendorDashboardStats(),
      getVendorSalesAnalytics(chartPeriod),
      getVendorProducts(),
    ]).then(([p, o, n, s, c, pr]) => {
      if (p.status === "fulfilled") setProfile(p.value?.user || p.value);
      if (o.status === "fulfilled") setOrders(o.value?.orders || o.value || []);
      if (n.status === "fulfilled")
        setNotifications(n.value?.announcements || n.value || []);
      if (s.status === "fulfilled") setStats(s.value);
      if (c.status === "fulfilled") setChartData(c.value);
      if (pr.status === "fulfilled")
        setProducts(pr.value?.products || pr.value || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    getVendorSalesAnalytics(chartPeriod).then(setChartData); // 🟡 DUMMY
  }, [chartPeriod]);

  const STAT_CARDS = stats
    ? [
        {
          label: "Total Sales",
          value: stats.totalSales,
          change: "+12.5%",
          up: true,
          icon: "💰",
          alert: false,
        },
        {
          label: "Total Orders",
          value: stats.totalOrders,
          change: "+8.2%",
          up: true,
          icon: "🛒",
          alert: false,
        },
        {
          label: "Monthly Revenue",
          value: stats.monthlyRevenue,
          change: "-2.1%",
          up: false,
          icon: "📈",
          alert: false,
        },
        {
          label: "Low Stock Alerts",
          value: stats.lowStockAlerts,
          change: "Needs attention",
          up: false,
          icon: "⚠️",
          alert: true,
        },
      ]
    : [];

  // ✅ CONNECTED shape from /api/orders/vendor/list
  // { _id, orderItems[0].product.title, buyer.name, status, totalAmount }
  const displayOrders =
    orders.length > 0
      ? orders.slice(0, 5).map((o) => ({
          id: `#${o._id?.slice(-6).toUpperCase()}`,
          product: o.orderItems?.[0]?.product?.title || "—",
          customer: o.buyer?.name || "—",
          status: o.status,
          amount: `$${o.totalAmount?.toFixed(2)}`,
        }))
      : [
          // 🟡 DUMMY fallback
          {
            id: "#ORD-001",
            product: "Wireless Headphones",
            customer: "Sarah Johnson",
            status: "Completed",
            amount: "$89.99",
          },
          {
            id: "#ORD-002",
            product: "Smart Watch",
            customer: "Mike Chen",
            status: "Processing",
            amount: "$199.99",
          },
          {
            id: "#ORD-003",
            product: "USB Cable",
            customer: "Emma Davis",
            status: "Shipped",
            amount: "$12.99",
          },
        ];

  // ✅ CONNECTED shape from /api/announcements/feed
  // { _id, title, message, type, createdAt }
  const displayNotifs =
    notifications.length > 0
      ? notifications.slice(0, 3).map((n) => ({
          id: n._id,
          title: n.title,
          desc: n.message,
          time: new Date(n.createdAt).toLocaleTimeString(),
          type: n.type,
        }))
      : [
          // 🟡 DUMMY fallback
          {
            id: 1,
            type: "order",
            title: "New Order Received",
            desc: "Order #ORD-004 from John Smith",
            time: "2 min ago",
          },
          {
            id: 2,
            type: "stock",
            title: "Low Stock Alert",
            desc: "Wireless Mouse — Only 3 left",
            time: "1 hr ago",
          },
          {
            id: 3,
            type: "review",
            title: "New Review",
            desc: "5-star review on Phone Case",
            time: "3 hrs ago",
          },
        ];

  const notifIcon = (t) => (t === "order" ? "🛒" : t === "stock" ? "⚠️" : "⭐");

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#1A9F73", borderTopColor: "transparent" }}
          />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`${collapsed ? "w-16" : "w-56"} bg-white border-r border-gray-100 flex flex-col py-5 px-3 transition-all duration-200 flex-shrink-0`}
      >
        <div className="flex items-center gap-3 px-1 mb-7">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: "#1A9F73" }}
          >
            V
          </div>
          {!collapsed && (
            <span className="font-bold text-gray-800 text-sm tracking-tight">
              VendorHub
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all
                ${activeNav === item.id ? "text-white" : "text-gray-500 hover:bg-green-50 hover:text-[#1A9F73]"}`}
              style={activeNav === item.id ? { background: "#1A9F73" } : {}}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* ✅ CONNECTED: profile from GET /api/users/profile */}
        {!collapsed && (
          <div className="border-t border-gray-100 pt-4 flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
              style={{ background: "#1A9F73" }}
            >
              {profile?.name?.slice(0, 2).toUpperCase() || "KM"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {profile?.name || "Kevin Madusanka"}
              </p>
              <p className="text-[10px] text-gray-400">Vendor</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-3 p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:bg-gray-50 text-xs transition"
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Good morning, {profile?.name?.split(" ")[0] || "Kevin"} 👋
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Here's what's happening with your store today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* ✅ CONNECTED: POST /api/products/ */}
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              style={{ background: "#1A9F73" }}
            >
              + Add New Product
            </button>
            {/* ✅ CONNECTED: bell for /api/announcements/feed */}
            <div className="relative w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:border-[#1A9F73] transition">
              <span className="text-base">🔔</span>
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </div>
          </div>
        </div>

        {/* STAT CARDS — 🟡 DUMMY */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {STAT_CARDS.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-gray-400 font-medium">
                  {s.label}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${s.alert ? "bg-amber-50" : "bg-green-50"}`}
                >
                  {s.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{s.value}</p>
              <p
                className={`text-xs font-medium ${s.up ? "text-[#1A9F73]" : s.alert ? "text-amber-500" : "text-red-400"}`}
              >
                {s.up ? "↑ " : s.alert ? "⚠ " : "↓ "}
                {s.change}
              </p>
              {/* 🟡 Remove tag when /api/vendor/dashboard/stats is ready */}
              <span className="mt-2 inline-block text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                DUMMY
              </span>
            </div>
          ))}
        </div>

        {/* QUICK ACCESS */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            {
              icon: "📦",
              label: "Product Management",
              sub: "Add, edit products",
              tag: "dummy",
              note: "🟡 /api/vendor/products/list",
            },
            {
              icon: "🛒",
              label: "Order Management",
              sub: "Track orders",
              tag: "connected",
              note: "✅ /api/orders/vendor/list",
            },
            {
              icon: "📊",
              label: "Sales Analytics",
              sub: "View reports",
              tag: "dummy",
              note: "🟡 /api/vendor/analytics",
            },
            {
              icon: "🏪",
              label: "My Store",
              sub: "Manage store",
              tag: "connected",
              note: "✅ /api/stores/:id",
            },
          ].map((q, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3 cursor-pointer hover:border-[#1A9F73] hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {q.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800">{q.label}</p>
                <p className="text-[10px] text-gray-400">{q.sub}</p>
                <span
                  className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded font-bold ${q.tag === "connected" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                >
                  {q.tag === "connected" ? "CONNECTED" : "DUMMY"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CHART + NOTIFICATIONS */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Chart — 🟡 DUMMY */}
          <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  Sales Overview
                </h2>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                  DUMMY — connect /api/vendor/analytics/sales
                </span>
              </div>
              <div className="flex gap-1">
                {["daily", "weekly", "monthly"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${chartPeriod === p ? "text-white" : "text-gray-400 hover:bg-gray-50"}`}
                    style={chartPeriod === p ? { background: "#1A9F73" } : {}}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {chartData && (
              <SalesChart data={chartData.data} labels={chartData.labels} />
            )}
          </div>

          {/* Notifications — ✅ CONNECTED */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-gray-800">Notifications</h2>
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                CONNECTED — /api/announcements/feed
              </span>
            </div>
            {displayNotifs.map((n) => (
              <div
                key={n.id}
                className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-sm flex-shrink-0">
                  {notifIcon(n.type)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">
                    {n.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{n.desc}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ORDERS + TOP PRODUCTS + QUICK ACTIONS */}
        <div className="grid grid-cols-3 gap-4">
          {/* Orders — ✅ CONNECTED */}
          <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  Recent Orders
                </h2>
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                  CONNECTED — GET /api/orders/vendor/list
                </span>
              </div>
              <button
                className="text-xs font-semibold hover:underline"
                style={{ color: "#1A9F73" }}
              >
                View all →
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2 pb-2 border-b border-gray-100">
              {["Order ID", "Product", "Customer", "Status", "Amount"].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>
            {displayOrders.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-5 gap-2 py-2.5 border-b border-gray-50 items-center last:border-0"
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: "#1A9F73" }}
                >
                  {o.id}
                </span>
                <span className="text-xs text-gray-700 truncate">
                  {o.product}
                </span>
                <span className="text-xs text-gray-400 truncate">
                  {o.customer}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md w-fit ${STATUS_STYLES[o.status] || "bg-gray-100 text-gray-600"}`}
                >
                  {o.status}
                </span>
                <span className="text-xs font-bold text-gray-800">
                  {o.amount}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {/* Top Products — 🟡 DUMMY */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 flex-1">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-gray-800">
                  Top Selling Products
                </h2>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                  DUMMY — connect /api/vendor/top-products
                </span>
              </div>
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                    {p.img}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {p.sold} sold this month
                    </p>
                  </div>
                  <span
                    className="text-xs font-bold flex-shrink-0"
                    style={{ color: "#1A9F73" }}
                  >
                    ${p.price}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="text-sm font-bold text-gray-800 mb-3">
                Quick Actions
              </h2>
              {/* ✅ CONNECTED: POST /api/products/ */}
              <button
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold mb-2 hover:opacity-90 transition"
                style={{ background: "#1A9F73" }}
              >
                + Add New Product
              </button>
              {/* ✅ CONNECTED: GET /api/orders/vendor/list */}
              <button className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium border border-gray-100 hover:border-[#1A9F73] transition">
                👁 View All Orders
              </button>
            </div>
          </div>
        </div>

        {/* DEV LEGEND — remove in production */}
        <div className="mt-5 flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-100 px-4 py-3">
          <span className="text-xs font-bold text-gray-400">Dev Legend:</span>
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">
            ✅ CONNECTED — backend route exists, wire up with useEffect
          </span>
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">
            🟡 DUMMY — mock data, replace when backend ready
          </span>
        </div>
      </main>
    </div>
  );
}
