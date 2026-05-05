import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  CheckCircle2,
  Clock3,
  XCircle,
  Search,
  ChevronDown,
  SlidersHorizontal,
  Eye,
  CalendarDays,
  CreditCard,
  ArrowUpDown,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";



const statusTabs = ["All Orders", "Placed", "Confirmed", "Shipped", "Delivered", "Cancelled"];
const paymentOptions = ["All", "Paid", "Pending", "Failed"];
const dateOptions = ["All Dates", "Today", "This Week", "This Month", "Last 30 Days"];
const sortOptions = ["Newest", "Oldest", "Amount: High to Low", "Amount: Low to High"];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-CA");
}

function formatAmount(value) {
  return value.toFixed(2);
}

function StatCard({ icon: Icon, label, value, iconClass, bordercolor }) {
  return (
    <div className={`rounded-2xl ${bordercolor} border border-slate-200 bg-white p-4 shadow-sm sm:p-5`}>
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Pill({ children, variant = "neutral" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    paid: "bg-emerald-50 text-[#1A9F73] ring-1 ring-emerald-100",
    pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    placed: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    failed: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    delivered: "bg-emerald-50 text-[#1A9F73] ring-1 ring-emerald-100",
    shipped: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
    confirmed: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
    cancelled: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles[variant] || styles.neutral}`}>
      {children}
    </span>
  );
}

export default function VendorOrderManagementPage() {
  const [ordersData, setOrdersData] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Orders");
  const [payment, setPayment] = useState("All");
  const [date, setDate] = useState("All Dates");
  const [sortBy, setSortBy] = useState("Newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const pageSize = 8;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const API_VERSION = import.meta.env.VITE_API_VERSION || '/api/v1';

   const fetchOrdersData = async () => {
        setLoading(true);
      try {
          const res = await axios.get(
              `${API_BASE_URL}${API_VERSION}/orders/vendor/list`,
              {withCredentials: true}
          )
  
          console.log("Response :", res.data.orders);
          setOrdersData(res.data.orders)
  
      } catch (error) {
          console.error("Error fetching Orders data",error);
      } finally {
        setLoading(false);
      }
      
    }

    useEffect(()=>{
        fetchOrdersData()
    },[]);

  const filteredOrders = useMemo(() => {
    let items = Array.isArray(ordersData) ? [...ordersData] : [];


    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.buyer?.fullname?.toLowerCase().includes(q)
      );
    }

    if (status !== "All Orders") {
      items = items.filter((o) => o.overallStatus?.toLowerCase() === status.toLowerCase());
    }

    if (payment !== "All") {
      items = items.filter((o) => o.paymentStatus === payment);
    }

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    if (date !== "All Dates") {
      items = items.filter((o) => {
        if (!o.createdAt) return true;

        const d = new Date(o.createdAt);
        if (isNaN(d)) return true;

        if (date === "Today") return d.toDateString() === now.toDateString();
        if (date === "This Week") return now - d <= 7 * dayMs;
        if (date === "This Month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (date === "Last 30 Days") return now - d <= 30 * dayMs;
        return true;
      });
    }

    switch (sortBy) {
      case "Oldest":
        items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "Amount: High to Low":
        items.sort((a, b) => b.vendorOrder?.totalAmount - a.vendorOrder?.totalAmount);
        break;
      case "Amount: Low to High":
        items.sort((a, b) => a.vendorOrder?.totalAmount - b.vendorOrder?.totalAmount);
        break;
      default:
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return items;
  }, [ordersData, search, status, payment, date, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const currentOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  const totalOrders = ordersData.length;
  const completedOrders = ordersData.filter((o) => o.overallStatus === "Delivered").length;
  const pendingOrders = ordersData.filter((o) => o.overallStatus === "Placed").length;
  const cancelledOrders = ordersData.filter((o) => o.overallStatus === "Cancelled").length;

  const resetPage = (setter, value) => {
    setter(value);
    setPage(1);
  };


  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A9F73] sm:text-3xl">
            Order Management
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={totalOrders}
            iconClass="bg-violet-50 text-violet-700"
            bordercolor="border-b-4 border-b-violet-700"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed Orders"
            value={completedOrders}
            iconClass="bg-emerald-50 text-[#1A9F73]"
            bordercolor="border-b-4 border-b-[#1A9F73]"
          />
          <StatCard
            icon={Clock3}
            label="Pending Orders"
            value={pendingOrders}
            iconClass="bg-orange-50 text-orange-700"
            bordercolor="border-b-4 border-b-orange-700"
          />
          <StatCard
            icon={XCircle}
            label="Cancelled Orders"
            value={cancelledOrders}
            iconClass="bg-rose-50 text-rose-700"
            bordercolor="border-b-4 border-b-rose-700"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by Order ID or Buyer"
                  className="h-12 w-full max-w-md rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1A9F73] focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <select
                    value={date}
                    onChange={(e) => resetPage(setDate, e.target.value)}
                    className="h-11 appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm outline-none transition focus:border-[#1A9F73] focus:ring-2 focus:ring-emerald-100"
                  >
                    {dateOptions.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 " />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="relative">
                  <select
                    value={payment}
                    onChange={(e) => resetPage(setPayment, e.target.value)}
                    className="h-11 appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm outline-none transition focus:border-[#1A9F73] focus:ring-2 focus:ring-emerald-100"
                  >
                    {paymentOptions.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                  <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => resetPage(setSortBy, e.target.value)}
                    className="h-11 appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm outline-none transition focus:border-[#1A9F73] focus:ring-2 focus:ring-emerald-100"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                  <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="w-full min-w-143 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  <SlidersHorizontal className="h-4 w-4" />
                  Status
                </div>
                <div className="flex flex-wrap gap-0 p-2">
                  {statusTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => resetPage(setStatus, tab)}
                      className={`border-r border-slate-200 px-4 py-2 text-sm font-medium last:border-r-0 ${
                        status === tab ? "text-[#1A9F73]" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-245 w-full text-left text-sm">
              <thead className="bg-emerald-600 text-white">
                <tr>
                  <th className="px-4 py-4 font-medium">Order ID</th>
                  <th className="px-4 py-4 font-medium">Buyer</th>
                  <th className="px-4 py-4 font-medium">Order Date</th>
                  <th className="px-4 py-4 font-medium">Total amount ($)</th>
                  <th className="px-4 py-4 font-medium">Payment</th>
                  <th className="px-4 py-4 font-medium">Status</th>
                  <th className="px-4 py-4 font-medium">Items</th>
                  <th className="px-4 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {currentOrders.length ? (
                  currentOrders.map((order) => (
                    <tr key={order.orderId || order.orderNumber} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-slate-700">{order.orderNumber}</td>
                      <td className="px-4 py-4 text-slate-600">{order.buyer?.fullname}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-4 text-slate-600">{formatAmount(order.vendorOrder?.totalAmount || 0)}</td>
                      <td className="px-4 py-4">
                        <Pill variant={order.paymentStatus.toLowerCase()}>{order.paymentStatus}</Pill>
                      </td>
                      <td className="px-4 py-4">
                        <Pill variant={order.overallStatus.toLowerCase()}>{order.overallStatus}</Pill>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{order.vendorOrder?.itemCount}</td>
                      <td className="px-4 py-4">
                        <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1A9F73]">
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      No orders found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {filteredOrders.length ? (safePage - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(safePage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </button>

              <span className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
                {safePage}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}