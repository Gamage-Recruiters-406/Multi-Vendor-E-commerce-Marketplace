import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
} from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layouts/Layout";


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


export default function VendorOrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [status, setStatus] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_VERSION = import.meta.env.VITE_API_VERSION;


  // Fetch Order Details
  const fetchOrder = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_VERSION}/orders/vendor/list`,
        { withCredentials: true }
      );

      const found = res.data.orders.find(
        (o) => o.orderId === orderId
      );
      console.log("Response: ",res.data.orders);
      setOrder(found);
      setStatus(found?.overallStatus);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Tracking
  const fetchTracking = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}${API_VERSION}/orders/${orderId}/tracking`
      );
      setTracking(res.data.tracking || []);
      console.log("Tracking: ",res.data.tracking);
    } catch (err) {
      console.error(err);
    }
  };

  // Update Status
  const updateStatus = async () => {
    try {
      await axios.patch(
        `${API_BASE_URL}${API_VERSION}/orders/vendor/${orderId}/status`,
        { status },
        { withCredentials: true }
      );
      toast.success("Status updated");
      fetchOrder();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchTracking();
  }, []);

  if (!order) return <div className="p-6">Loading...</div>;

  const steps = ["Placed", "Confirmed", "Shipped", "Delivered"];

  return (
    <Layout>
        <div className="p-6 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-[#1A9F73]">
            Order Details
            </h1>

            <div className="flex gap-5">
            <button className="flex items-center gap-2 border px-4 py-2 rounded-lg text-[#1A9F73] border-emerald-500 transition hover:bg-[#1A9F73] hover:text-white hover:shadow-md">
                <Download className="w-4 h-4" />
                Download Receipt
            </button>

            <button
                onClick={() => navigate("/vendor/orders")}
                className="border px-4 py-2 rounded-lg text-[#1A9F73] border-emerald-500 transition hover:bg-[#1A9F73] hover:text-white hover:shadow-md"
            >
                Back
            </button>
            </div>
        </div>

        {/* Status Progress */}
        <div className="flex justify-center mb-10">
            <div className="flex items-center w-full max-w-3xl">
                {steps.map((step, i) => {
                const active = steps.indexOf(order.overallStatus) >= i;
                const isCurrent = order.overallStatus === step;

                return (
                    <div key={step} className="flex items-center w-full">
                    <div
                        className={`px-4 py-2 rounded-lg text-sm transition ${
                        active
                            ? "bg-[#1A9F73] text-white"
                            : "text-slate-400 border border-slate-300"
                        } ${
                        isCurrent ? "animate-pulse scale-105" : ""
                        }`}
                    >
                        {step}
                    </div>

                    {i < steps.length - 1 && (
                        <div
                        className={`flex-1 h-0.5 mx-2 ${
                            active ? "bg-[#1A9F73]" : "bg-slate-300"
                        }`}
                        />
                    )}
                    </div>
                );
                })}
            </div>
        </div>

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-15">

            {/* Order Info */}
            <div className="bg-white rounded-xl p-5 shadow">
                <h2 className="bg-[#1A9F73] text-white px-4 py-2 rounded-md mb-4">
                    Order Info
                </h2>

                <div className="space-y-3 text-sm">
                    <p>
                    <span className="text-slate-500">Order ID :</span>{" "}
                    {order.orderNumber}
                    </p>

                    <p className="flex items-center gap-2">
                    <span className="text-slate-500">Status :</span>
                    <Pill variant={order.overallStatus.toLowerCase()}>
                        {order.overallStatus}
                    </Pill>
                    </p>

                    <p>
                    <span className="text-slate-500">Order Date :</span>{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                    </p>

                    <p className="flex items-center gap-2">
                    <span className="text-slate-500">Payment Status :</span>
                    <Pill variant={order.paymentStatus.toLowerCase()}>
                        {order.paymentStatus}
                    </Pill>
                    </p>
                </div>
            </div>

            {/* Change Status */}
            <div className="bg-white rounded-xl p-5 shadow">
                <h2 className="bg-[#1A9F73] text-white px-4 py-2 rounded-md mb-4">
                    Change Order Status
                </h2>

                <div className="flex flex-col gap-4">
                    <label className="text-sm text-slate-500">
                        Select New Status
                    </label>
                    <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border border-slate-300 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-[#1A9F73]"
                    >
                    {steps.map((s) => (
                        <option key={s}>{s}</option>
                    ))}
                    </select>

                    <button
                    disabled={status === order.overallStatus}
                    onClick={updateStatus}
                    className={` px-4 py-2 rounded-lg transition  ${
                                status === order.overallStatus
                                ? "bg-slate-300 cursor-not-allowed"
                                : "text-[#1A9F73] bg-white border border-[#1A9F73] hover:bg-[#1A9F73] hover:text-white"
                            }`}
                    >
                    Update Status
                    </button>
                </div>
            </div>

            {/* Buyer Info */}
            <div className="bg-white rounded-xl p-5 shadow">
            <h2 className="bg-[#1A9F73] text-white px-4 py-2 rounded-md mb-4">
                Buyer Information
            </h2>

            <p>Name: {order.buyer?.fullname}</p>
            <p>Email: {order.buyer?.email}</p>
            <p>Phone: {order.buyer?.phone}</p>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-xl p-5 shadow">
            <h2 className="bg-[#1A9F73] text-white px-4 py-2 rounded-md mb-4">
                Shipping Details
            </h2>

            <p>
                Address: {[
                    order.shippingAddress?.line1,
                    order.shippingAddress?.line2,
                    order.shippingAddress?.city,
                    order.shippingAddress?.state,
                    order.shippingAddress?.postalCode,
                    order.shippingAddress?.country
                ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
            <p>PostalCode: {order.shippingAddress?.postalCode || "-"} </p>
            <p>Shipping Method: Standard</p>
            </div>
        </div>

        {/* Items */}
        <div className="mt-6 bg-white rounded-xl p-5 shadow">
            <h2 className="bg-[#1A9F73] text-white px-4 py-2 rounded-md mb-4">
            Order Items
            </h2>

            <table className="w-full text-sm">
            <thead className="bg-[#1A9F73] text-white">
                <tr>
                <th className="p-3">Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                </tr>
            </thead>

            <tbody>
                {order.vendorOrder?.items.map((item, i) => (
                <tr key={i} className="border-b">
                    <td className="p-3 flex items-center gap-3">
                    <img
                        src={item.imageUrl || null}
                        className="w-10 h-10 rounded"
                    />
                    {item.productName}
                    </td>
                    <td>{item.quantity}</td>
                    <td>{item.unitPrice}</td>
                    <td>{item.totalPrice}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* Payment Summary */}
        <div className="mt-6 bg-white rounded-xl p-5 shadow w-full md:w-1/2">
            <h2 className="bg-[#1A9F73] text-white px-4 py-2 rounded-md mb-4">
            Payment Summary
            </h2>

            <p>Subtotal: {order.vendorOrder?.subtotal}</p>
            <p>Discount applied: {order.vendorOrder?.discountAmount}</p>
            <p>Shipping fee: {order.vendorOrder?.shippingFee}</p>
            <p>Total amount: {order.vendorOrder?.totalAmount}</p>
        </div>
        </div>
    </Layout>
  );
}