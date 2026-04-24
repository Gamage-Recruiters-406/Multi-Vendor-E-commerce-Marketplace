import { useState, useEffect } from "react";
import {
  getVendorProfile,
  getVendorOrders,
  getAnnouncementsFeed,
  getVendorDashboardStats,
  getVendorSalesAnalytics,
  getVendorProducts,
} from "../api/vendorDashboard";
import Header from "../components/Layouts/Header";
import Footer from "../components/Layouts/Footer";

const STATUS_STYLES = {
  Placed: "bg-slate-100 text-slate-700",
  Confirmed: "bg-yellow-100 text-yellow-800",
  Shipped: "bg-blue-100 text-blue-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

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
  const [chartPeriod, setChartPeriod] = useState("daily");
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const profileRes = await getVendorProfile();
        const profileData = profileRes?.user || profileRes;
        setProfile(profileData);

        const storeId = profileData?.store?._id || profileData?.storeId;

        const [ordersRes, announcementsRes, statsRes, chartRes, productsRes] =
          await Promise.allSettled([
            getVendorOrders(),
            getAnnouncementsFeed(),
            getVendorDashboardStats(),
            getVendorSalesAnalytics(chartPeriod),
            storeId ? getVendorProducts(storeId) : Promise.resolve([]),
          ]);

        if (ordersRes.status === "fulfilled") {
          setOrders(ordersRes.value?.orders || ordersRes.value || []);
        }

        if (announcementsRes.status === "fulfilled") {
          setNotifications(
            announcementsRes.value?.announcements ||
              announcementsRes.value ||
              [],
          );
        }

        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value);
        }

        if (chartRes.status === "fulfilled") {
          setChartData(chartRes.value);
        }

        if (productsRes.status === "fulfilled") {
          setProducts(productsRes.value?.products || productsRes.value || []);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    getVendorSalesAnalytics(chartPeriod).then(setChartData);
  }, [chartPeriod]);

  const totalOrders = orders.length;

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
          value: totalOrders,
          change: `${totalOrders} orders`,
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

  //  shape from /api/orders/vendor/list
  // { _id, orderItems[0].product.title, buyer.name, status, totalAmount }
  const displayOrders =
    orders.length > 0
      ? orders.slice(0, 5).map((o) => ({
          id: o.orderNumber || `#${o.orderId?.slice(-6).toUpperCase()}`,
          product:
            o.vendorOrder?.items?.length > 1
              ? `${o.vendorOrder.items[0].productName} +${o.vendorOrder.items.length - 1} more`
              : o.vendorOrder?.items?.[0]?.productName || "—",
          customer: o.buyer?.fullname || o.shippingAddress?.fullName || "—",
          status: o.vendorOrder?.status || "—",
          amount: `Rs. ${Number(o.vendorOrder?.totalAmount || 0).toLocaleString()}`,
        }))
      : [];

  //  shape from /api/announcements/feed
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
    <>
      <Header />
      <div className="w-full max-w-[1900px] mx-auto px-4 md:px-6 lg:px-8 py-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Good morning, {profile?.fullname?.split(" ")[0] || "prime"} 👋
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Here's what's happening with your store today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/*  POST /api/products/ */}
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              style={{ background: "#1A9F73" }}
            >
              + Add New Product
            </button>
            {/* : bell for /api/announcements/feed */}
            <div className="relative w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:border-[#1A9F73] transition">
              <span className="text-base">🔔</span>
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </div>
          </div>
        </div>

        {/* STAT CARDS —  */}
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
            },
            {
              icon: "🛒",
              label: "Order Management",
              sub: "Track orders",
            },
            {
              icon: "📊",
              label: "Sales Analytics",
              sub: "View reports",
            },
            {
              icon: "🏪",
              label: "My Store",
              sub: "Manage store",
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
              </div>
            </div>
          ))}
        </div>

        {/* CHART + NOTIFICATIONS */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Chart —  */}
          <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  Sales Overview
                </h2>
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

          {/* Notifications —  */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-gray-800">Notifications</h2>
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
          {/* Orders —  */}
          <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  Recent Orders
                </h2>
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
            {/* Top Products — */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 flex-1">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-gray-800">
                  Top Selling Products
                </h2>
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
              {/* : POST /api/products/ */}
              <button
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold mb-2 hover:opacity-90 transition"
                style={{ background: "#1A9F73" }}
              >
                + Add New Product
              </button>
              {/*  GET /api/orders/vendor/list */}
              <button className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium border border-gray-100 hover:border-[#1A9F73] transition">
                👁 View All Orders
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
