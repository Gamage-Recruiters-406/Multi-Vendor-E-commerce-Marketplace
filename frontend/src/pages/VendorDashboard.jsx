import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getVendorProfile,
  getVendorOrders,
  getAnnouncementsFeed,
  getMyStores,
  getVendorProductsByStore,
  getPaidPaymentsByStore,
} from "../api/vendorDashboard";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Layout from "../components/Layouts/Layout";

const STATUS_STYLES = {
  Placed: "bg-slate-100 text-slate-700",
  Confirmed: "bg-yellow-100 text-yellow-800",
  Shipped: "bg-blue-100 text-blue-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

function SalesChart({ data, labels }) {
  if (!data || !labels || data.length === 0) return null;

  const chartRows = labels.map((label, index) => ({
    label,
    sales: data[index] || 0,
  }));

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartRows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#1A9F73"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function VendorDashboard() {
  const navigate = useNavigate();

  const [chartPeriod, setChartPeriod] = useState("daily");
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [stores, setStores] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getPaymentNetAmount = (payment) => {
    if (Array.isArray(payment.myShare) && payment.myShare.length > 0) {
      return payment.myShare.reduce(
        (sum, share) => sum + Number(share.netAmount || 0),
        0,
      );
    }

    if (
      Array.isArray(payment.storePayments) &&
      payment.storePayments.length > 0
    ) {
      return payment.storePayments.reduce(
        (sum, share) => sum + Number(share.netAmount || 0),
        0,
      );
    }

    return Number(payment.amount?.netAmount || payment.amount?.amount || 0);
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [profileRes, ordersRes, announcementsRes, storesRes] =
          await Promise.allSettled([
            getVendorProfile(),
            getVendorOrders(),
            getAnnouncementsFeed(),
            getMyStores(),
          ]);

        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value?.user || profileRes.value);
        }

        if (ordersRes.status === "fulfilled") {
          setOrders(
            Array.isArray(ordersRes.value)
              ? ordersRes.value
              : ordersRes.value?.orders || [],
          );
        }

        if (announcementsRes.status === "fulfilled") {
          setNotifications(
            announcementsRes.value?.announcements ||
              announcementsRes.value?.data ||
              announcementsRes.value ||
              [],
          );
        }

        if (storesRes.status === "fulfilled") {
          const myStores =
            storesRes.value?.stores ||
            storesRes.value?.data ||
            storesRes.value ||
            [];

          const safeStores = Array.isArray(myStores) ? myStores : [];
          setStores(safeStores);

          const productResults = await Promise.allSettled(
            safeStores.map((store) => getVendorProductsByStore(store._id)),
          );

          const mergedProducts = productResults.flatMap((result) => {
            if (result.status !== "fulfilled") return [];
            return (
              result.value?.data || result.value?.products || result.value || []
            );
          });

          setAllProducts(mergedProducts);

          const paymentResults = await Promise.allSettled(
            safeStores.map((store) => getPaidPaymentsByStore(store._id)),
          );

          const mergedPayments = paymentResults.flatMap((result) => {
            if (result.status !== "fulfilled") return [];

            return (
              result.value?.payments || result.value?.data || result.value || []
            );
          });

          const uniquePayments = Array.from(
            new Map(
              mergedPayments.map((payment) => [payment._id, payment]),
            ).values(),
          );

          setPayments(uniquePayments);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const paidPayments = payments.filter((payment) => payment.status === "paid");

  const generatePaymentChartData = (paidPayments, period) => {
    if (!paidPayments || paidPayments.length === 0) {
      return { labels: [], data: [] };
    }

    const grouped = {};

    paidPayments.forEach((payment) => {
      const date = new Date(payment.paymentDate || payment.createdAt);

      let key;

      if (period === "daily") {
        key = date.toLocaleDateString("en-US", { weekday: "short" });
      } else if (period === "weekly") {
        key = `Week ${Math.ceil(date.getDate() / 7)}`;
      } else {
        key = date.toLocaleDateString("en-US", { month: "short" });
      }

      const amount = getPaymentNetAmount(payment);
      grouped[key] = (grouped[key] || 0) + amount;
    });

    return {
      labels: Object.keys(grouped),
      data: Object.values(grouped),
    };
  };

  useEffect(() => {
    const chart = generatePaymentChartData(paidPayments, chartPeriod);
    setChartData(chart);
  }, [payments, chartPeriod]);

  const totalOrders = orders.length;

  const totalSales = paidPayments.reduce(
    (sum, payment) => sum + getPaymentNetAmount(payment),
    0,
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyRevenue = paidPayments
    .filter((payment) => {
      const date = new Date(payment.paymentDate || payment.createdAt);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    })
    .reduce((sum, payment) => sum + getPaymentNetAmount(payment), 0);

  const lowStockAlerts = allProducts.filter(
    (product) => Number(product.stock || 0) <= 10,
  ).length;

  const storeCount = stores.length;

  const STAT_CARDS = [
    {
      label: "Total Sales",
      value: `Rs. ${totalSales.toLocaleString()}`,
      change: "Paid payments",
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
      value: `Rs. ${monthlyRevenue.toLocaleString()}`,
      change: "Paid this month",
      up: true,
      icon: "📈",
      alert: false,
    },
    {
      label: "Low Stock Alerts",
      value: lowStockAlerts,
      change: lowStockAlerts > 0 ? "Needs attention" : "All good",
      up: false,
      icon: "⚠️",
      alert: true,
    },
  ];

  const QUICK_ACCESS = [
    {
      icon: "📦",
      label: "Product Management",
      sub: `${allProducts.length} products`,
      path: "/vendor/products",
    },
    {
      icon: "🛒",
      label: "Order Management",
      sub: `${totalOrders} orders`,
      path: "/vendor/orders",
    },
    {
      icon: "📊",
      label: "Sales Analytics",
      sub: "View reports",
      path: "/vendor/analytics",
    },
    {
      icon: "🏪",
      label: "My Store",
      sub: `${storeCount} stores`,
      path: "/vendor/stores",
    },
  ];

  const displayOrders =
    orders.length > 0
      ? orders.slice(0, 5).map((order) => ({
          id: order.orderNumber || `#${order.orderId?.slice(-6).toUpperCase()}`,
          product:
            order.vendorOrder?.items?.length > 1
              ? `${order.vendorOrder.items[0].productName} +${
                  order.vendorOrder.items.length - 1
                } more`
              : order.vendorOrder?.items?.[0]?.productName || "—",
          customer:
            order.buyer?.fullname || order.shippingAddress?.fullName || "—",
          status: order.vendorOrder?.status || "—",
          amount: `Rs. ${Number(order.vendorOrder?.totalAmount || 0).toLocaleString()}`,
        }))
      : [];

  const displayNotifs =
    notifications.length > 0
      ? notifications.slice(0, 3).map((n) => ({
          id: n._id || n.id,
          title: n.title,
          desc: n.message,
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : "",
          type: n.type,
        }))
      : [];

  const notifIcon = (type) =>
    type === "order" || type === "order_placed"
      ? "🛒"
      : type === "stock"
        ? "⚠️"
        : "⭐";

  const storeIdSet = new Set(stores.map((store) => String(store._id)));

  const topProducts = Object.values(
    paidPayments.reduce((acc, payment) => {
      const items = payment.cartId?.items || [];

      items.forEach((item) => {
        const itemStoreId =
          item.store_id?._id?.toString() || item.store_id?.toString();

        if (!storeIdSet.has(itemStoreId)) return;

        const product = item.product_id;
        const productId = product?._id?.toString() || product?.toString();

        if (!productId) return;

        if (!acc[productId]) {
          acc[productId] = {
            productId,
            productName: product?.name || item.name || "Product",
            imageUrl: product?.images?.[0] || "",
            unitPrice: Number(product?.price || item.price || 0),
            sold: 0,
            revenue: 0,
          };
        }

        acc[productId].sold += Number(item.quantity || 0);
        acc[productId].revenue +=
          Number(item.price || product?.price || 0) *
          Number(item.quantity || 0);
      });

      return acc;
    }, {}),
  )
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  if (loading) {
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
  }

  return (
    <Layout>
      <div className="w-full max-w-[1900px] mx-auto px-4 md:px-6 lg:px-8 py-4">
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
            <button
              onClick={() => navigate("/vendor/products/create")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              style={{ background: "#1A9F73" }}
            >
              + Add New Product
            </button>

            <div className="relative w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:border-[#1A9F73] transition">
              <span className="text-base">🔔</span>
              {displayNotifs.length > 0 && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-5">
          {STAT_CARDS.map((card, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-gray-400 font-medium">
                  {card.label}
                </span>

                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                    card.alert ? "bg-amber-50" : "bg-green-50"
                  }`}
                >
                  {card.icon}
                </div>
              </div>

              <p className="text-2xl font-bold text-gray-900 mb-1">
                {card.value}
              </p>

              <p
                className={`text-xs font-medium ${
                  card.up
                    ? "text-[#1A9F73]"
                    : card.alert
                      ? "text-amber-500"
                      : "text-red-400"
                }`}
              >
                {card.up ? "↑ " : card.alert ? "⚠ " : "↓ "}
                {card.change}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {QUICK_ACCESS.map((q, i) => (
            <div
              key={i}
              onClick={() => navigate(q.path)}
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

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-800">
                Sales Overview
              </h2>

              <div className="flex gap-1">
                {["daily", "weekly", "monthly"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                      chartPeriod === period
                        ? "text-white"
                        : "text-gray-400 hover:bg-gray-50"
                    }`}
                    style={
                      chartPeriod === period ? { background: "#1A9F73" } : {}
                    }
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {chartData && chartData.data.length > 0 ? (
              <SalesChart data={chartData.data} labels={chartData.labels} />
            ) : (
              <p className="text-xs text-gray-400 py-10 text-center">
                No paid payment data for chart.
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-gray-800">Notifications</h2>
            </div>

            {displayNotifs.length > 0 ? (
              displayNotifs.map((n) => (
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
              ))
            ) : (
              <p className="text-xs text-gray-400">No notifications yet.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-800">Recent Orders</h2>

              <button
                onClick={() => navigate("/vendor/orders")}
                className="text-xs font-semibold hover:underline"
                style={{ color: "#1A9F73" }}
              >
                View all →
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 pb-2 border-b border-gray-100">
              {["Order ID", "Product", "Customer", "Status", "Amount"].map(
                (heading) => (
                  <span
                    key={heading}
                    className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                  >
                    {heading}
                  </span>
                ),
              )}
            </div>

            {displayOrders.length > 0 ? (
              displayOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-5 gap-2 py-2.5 border-b border-gray-50 items-center last:border-0"
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#1A9F73" }}
                  >
                    {order.id}
                  </span>

                  <span className="text-xs text-gray-700 truncate">
                    {order.product}
                  </span>

                  <span className="text-xs text-gray-400 truncate">
                    {order.customer}
                  </span>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md w-fit ${
                      STATUS_STYLES[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.status}
                  </span>

                  <span className="text-xs font-bold text-gray-800">
                    {order.amount}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-4">
                No recent orders found.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 flex-1">
              <h2 className="text-sm font-bold text-gray-800 mb-3">
                Top Selling Products
              </h2>

              {topProducts.length > 0 ? (
                topProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="w-9 h-9 rounded-lg object-cover bg-green-50"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                        N/A
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {product.productName}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Sold: {product.sold}
                      </p>
                    </div>

                    <span
                      className="text-xs font-bold flex-shrink-0"
                      style={{ color: "#1A9F73" }}
                    >
                      Rs. {Number(product.unitPrice || 0).toLocaleString()}
                      <p className="text-[10px] text-gray-400">
                        Sold: {product.sold} • Revenue: Rs.{" "}
                        {product.revenue.toLocaleString()}
                      </p>
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No products found.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="text-sm font-bold text-gray-800 mb-3">
                Quick Actions
              </h2>

              <button
                onClick={() => navigate("/vendor/products/create")}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold mb-2 hover:opacity-90 transition"
                style={{ background: "#1A9F73" }}
              >
                + Add New Product
              </button>

              <button
                onClick={() => navigate("/vendor/orders")}
                className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium border border-gray-100 hover:border-[#1A9F73] transition"
              >
                👁 View All Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
