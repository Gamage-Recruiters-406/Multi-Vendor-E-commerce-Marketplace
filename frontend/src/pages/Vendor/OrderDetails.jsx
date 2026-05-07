import React, { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Download,
  User,
  Mail,
  Phone,
} from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/Layouts/Layout";
import jsPDF from "jspdf";


function Pill({ children, variant = "neutral" }) {
  const styles = {
    neutral: "bg-[#f1f5f9] text-[#334155]",
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_VERSION = import.meta.env.VITE_API_VERSION;

  const receiptRef = useRef();

  const downloadReceipt = () => {
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();

    let y = 15; // vertical cursor

    // ================= HEADER =================
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("INVOICE", pageWidth / 2, y, { align: "center" });

    y += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Order No: ${order.orderNumber}`, 14, y);
    pdf.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, y);

    y += 10;
    pdf.line(14, y, 196, y); // separator line

    y += 10;

    // ================= CUSTOMER INFO =================
    pdf.setFont("helvetica", "bold");
    pdf.text("BILL TO:", 14, y);

    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.text(order.buyer?.fullname || "-", 14, y);
    y += 5;
    pdf.text(order.buyer?.email || "-", 14, y);
    y += 5;
    pdf.text(order.buyer?.phone || "-", 14, y);

    y += 10;

    // ================= SHIPPING =================
    pdf.setFont("bold");
    pdf.text("SHIPPING ADDRESS:", 14, y);

    y += 6;
    pdf.setFont("normal");

    const address = [
        order.shippingAddress?.line1,
        order.shippingAddress?.line2,
        order.shippingAddress?.city,
        order.shippingAddress?.state,
        order.shippingAddress?.postalCode,
        order.shippingAddress?.country,
    ]
        .filter(Boolean)
        .join(", ");

    pdf.text(address || "-", 14, y);

    y += 12;

    // ================= ITEMS TABLE =================
    pdf.setFont("bold");
    pdf.text("ORDER ITEMS", 14, y);

    y += 8;

    pdf.setFontSize(9);

    // Table Header
    pdf.text("Product", 14, y);
    pdf.text("Qty", 110, y);
    pdf.text("Price", 130, y);
    pdf.text("Total", 160, y);

    y += 4;
    pdf.line(14, y, 196, y);

    y += 6;

    pdf.setFont("normal");

    order.vendorOrder?.items.forEach((item) => {
        pdf.text(item.productName?.substring(0, 25) || "-", 14, y);
        pdf.text(String(item.quantity), 110, y);
        pdf.text(`Rs. ${item.unitPrice}`, 130, y);
        pdf.text(`Rs. ${item.totalPrice}`, 160, y);

        y += 6;
    });

    y += 5;
    pdf.line(14, y, 196, y);

    y += 10;

    // ================= SUMMARY =================
    pdf.setFont("bold");
    pdf.text("PAYMENT SUMMARY", 14, y);

    y += 8;
    pdf.setFont("normal");

    pdf.text("Subtotal:", 14, y);
    pdf.text(`Rs. ${order.vendorOrder?.subtotal}`, 160, y);

    y += 6;

    pdf.text("Discount:", 14, y);
    pdf.text(`- Rs. ${order.vendorOrder?.discountAmount}`, 160, y);

    y += 6;

    pdf.text("Shipping:", 14, y);
    pdf.text(`Rs. ${order.vendorOrder?.shippingFee}`, 160, y);

    y += 8;

    pdf.setFont("bold");
    pdf.text("TOTAL:", 14, y);
    pdf.text(`Rs. ${order.vendorOrder?.totalAmount}`, 160, y);

    y += 15;

    // ================= FOOTER =================
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text("Thank you for your purchase!", pageWidth / 2, y, {
        align: "center",
    });

    pdf.save(`Invoice-${order.orderNumber}.pdf`);
};


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

  if (!order) {
    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 animate-pulse">
        
        {/* Top Buttons */}
        <div className="flex gap-5 mb-8">
            <div className="h-10 w-44 bg-[#e2e8f0] rounded-lg"></div>
            <div className="h-10 w-24 bg-[#e2e8f0] rounded-lg"></div>
        </div>

        {/* Status Tracker */}
        <div className="flex justify-center mb-10">
            <div className="flex items-center gap-4 w-full max-w-4xl">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center flex-1">
                <div className="h-10 w-24 bg-[#e2e8f0] rounded-lg"></div>

                {i !== 5 && (
                    <div className="flex-1 h-1 bg-[#e2e8f0] mx-2 rounded"></div>
                )}
                </div>
            ))}
            </div>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {[1, 2, 3, 4].map((card) => (
            <div
                key={card}
                className="bg-white rounded-xl p-5 shadow"
            >
                <div className="h-10 w-40 bg-[#e2e8f0] rounded-md mb-6"></div>

                <div className="space-y-4">
                <div className="h-4 bg-[#e2e8f0] rounded w-full"></div>
                <div className="h-4 bg-[#e2e8f0] rounded w-5/6"></div>
                <div className="h-4 bg-[#e2e8f0] rounded w-4/6"></div>
                </div>
            </div>
            ))}

        </div>

        {/* Table Skeleton */}
        <div className="mt-6 bg-white rounded-xl p-5 shadow">
            <div className="h-10 w-40 bg-[#e2e8f0] rounded-md mb-6"></div>

            <div className="space-y-4">
            {[1, 2, 3].map((row) => (
                <div
                key={row}
                className="grid grid-cols-5 gap-4"
                >
                <div className="h-12 bg-[#e2e8f0] rounded"></div>
                <div className="h-12 bg-[#e2e8f0] rounded"></div>
                <div className="h-12 bg-[#e2e8f0] rounded"></div>
                <div className="h-12 bg-[#e2e8f0] rounded"></div>
                <div className="h-12 bg-[#e2e8f0] rounded"></div>
                </div>
            ))}
            </div>
        </div>
        </div>
    );
}

  const steps = ["Placed", "Confirmed", "Shipped", "Delivered"];
  const statusOptions = ["Placed", "Confirmed", "Shipped", "Delivered", "Cancelled"];

  return (
    <Layout>
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold text-[#1A9F73]">
                Order Details
                </h1>

                <div className="flex gap-5">
                <button 
                    onClick={downloadReceipt}
                    className="flex items-center gap-2 border px-4 py-2 rounded-lg text-[#1A9F73] border-emerald-500 transition hover:bg-[#1A9F73] hover:text-white hover:shadow-md">
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
            <div ref={receiptRef} 
                style={{
                backgroundColor: "#ffffff",
                color: "#000000",
            }}>
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
                                    : "text-[#94a3b8] border border-[#cbd5e1]"
                                } ${
                                isCurrent ? "animate-pulse scale-105" : ""
                                }`}
                            >
                                {step}
                            </div>

                            {i < steps.length - 1 && (
                                <div
                                className={`flex-1 h-0.5 mx-2 ${
                                    active ? "bg-[#1A9F73]" : "bg-[#cbd5e1]"
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
                            <span className="text-[#f8fafc]0">Order ID :</span>{" "}
                            {order.orderNumber}
                            </p>

                            <p className="flex items-center gap-2">
                            <span className="text-[#f8fafc]0">Status :</span>
                            <Pill variant={order.overallStatus.toLowerCase()}>
                                {order.overallStatus}
                            </Pill>
                            </p>

                            <p>
                            <span className="text-[#f8fafc]0">Order Date :</span>{" "}
                            {new Date(order.createdAt).toLocaleDateString()}
                            </p>

                            <p className="flex items-center gap-2">
                            <span className="text-[#f8fafc]0">Payment Status :</span>
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
                            <label className="text-sm text-[#f8fafc]0">
                                Select New Status
                            </label>
                            <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="border border-[#cbd5e1] px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-[#1A9F73]"
                            >
                            {statusOptions.map((s) => (
                                <option key={s} disabled={order.overallStatus === "Cancelled"}>
                                    {s}
                                </option>
                            ))}
                            </select>

                            <button
                            disabled={status === order.overallStatus}
                            onClick={() => {
                                if (status === "Cancelled") {
                                    setShowCancelConfirm(true);
                                } else {
                                    updateStatus();
                                }
                            }}
                            className={` px-4 py-2 rounded-lg transition  ${
                                        status === order.overallStatus
                                        ? "bg-[#cbd5e1] cursor-not-allowed"
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

                        <div className="space-y-4 text-sm">
                            
                            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
                            <div className="flex items-center gap-2 text-[#f8fafc]0">
                                <User className="w-4 h-4" />
                                <span className="text-[#f8fafc]0 font-medium">Name</span>
                            </div>
                            <span className="text-[#1e293b] font-medium">
                                {order.buyer?.fullname}
                            </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
                            <div className="flex items-center gap-2 text-[#f8fafc]0">
                                <Mail className="w-4 h-4" />
                                <span className="text-[#f8fafc]0 font-medium">Email</span>
                            </div>
                            <span className="text-[#1e293b]">
                                {order.buyer?.email}
                            </span>
                            </div>

                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[#f8fafc]0">
                                <Phone className="w-4 h-4" />
                                <span className="text-[#f8fafc]0 font-medium">Phone</span>
                            </div>
                            <span className="text-[#1e293b]">
                                {order.buyer?.phone}
                            </span>
                            </div>

                        </div>
                    </div>

                    {/* Shipping */}
                    <div className="bg-white rounded-xl p-5 shadow">
                        <h2 className="bg-[#1A9F73] text-white px-4 py-2 rounded-md mb-4">
                            Shipping Details
                        </h2>

                        <div className="space-y-4 text-sm">

                            <div className="border-b border-[#f1f5f9] pb-3">
                            <p className="text-[#f8fafc]0 font-medium mb-1">
                                Delivery Address
                            </p>

                            <p className="text-[#1e293b] leading-6">
                                {[
                                order.shippingAddress?.line1,
                                order.shippingAddress?.line2,
                                order.shippingAddress?.city,
                                order.shippingAddress?.state,
                                order.shippingAddress?.postalCode,
                                order.shippingAddress?.country,
                                ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                            </div>

                            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
                            <span className="text-[#f8fafc]0 font-medium">
                                Postal Code
                            </span>

                            <span className="text-[#1e293b]">
                                {order.shippingAddress?.postalCode || "-"}
                            </span>
                            </div>

                            <div className="flex items-center justify-between">
                            <span className="text-[#f8fafc]0 font-medium">
                                Shipping Method
                            </span>

                            <span className="text-[#1e293b]">
                                Standard
                            </span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="mt-6 bg-white rounded-xl p-5 shadow overflow-x-auto">
                    <h2 className="bg-[#1A9F73] text-white px-4 py-2 rounded-md mb-4">
                        Order Items
                    </h2>

                    <table className="w-full min-w-175 text-sm text-left">
                        
                        <thead className="bg-[#1A9F73] text-white">
                        <tr>
                            <th className="px-4 py-3 font-medium">Product</th>
                            <th className="px-4 py-3 font-medium">Product ID</th>
                            <th className="px-4 py-3 font-medium text-center">Qty</th>
                            <th className="px-4 py-3 font-medium text-center">Price</th>
                            <th className="px-4 py-3 font-medium text-center">Total</th>
                        </tr>
                        </thead>

                        <tbody>
                        {order.vendorOrder?.items.map((item, i) => (
                            <tr
                            key={i}
                            className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition"
                            >
                            
                            {/* Product */}
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                
                                <img
                                    src={item.imageUrl || "/placeholder.png"}
                                    alt={item.productName}
                                    className="w-12 h-12 rounded-lg object-cover border"
                                />

                                <span className="font-medium text-[#1e293b]">
                                    {item.productName}
                                </span>
                                </div>
                            </td>

                            {/* Product ID */}
                            <td className="text-xs text-[#475569] px-2 py-1 rounded">
                                {item.productId || "-"}
                            </td>

                            {/* Quantity */}
                            <td className="px-4 py-4 text-center text-[#334155]">
                                {item.quantity}
                            </td>

                            {/* Price */}
                            <td className="px-4 py-4 text-center text-[#334155]">
                                Rs. {item.unitPrice}
                            </td>

                            {/* Total */}
                            <td className="px-4 py-4 text-center font-medium text-[#1e293b]">
                                Rs. {item.totalPrice}
                            </td>

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

                    <div className="space-y-4 text-sm">

                        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
                        <span className="text-[#f8fafc]0 font-medium">
                            Subtotal
                        </span>

                        <span className="text-[#1e293b]">
                            Rs. {order.vendorOrder?.subtotal}
                        </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
                        <span className="text-[#f8fafc]0 font-medium">
                            Discount Applied
                        </span>

                        <span className="text-rose-600">
                            - Rs. {order.vendorOrder?.discountAmount}
                        </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
                        <span className="text-[#f8fafc]0 font-medium">
                            Shipping Fee
                        </span>

                        <span className="text-[#1e293b]">
                            Rs. {order.vendorOrder?.shippingFee}
                        </span>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                        <span className="text-base font-semibold text-[#1e293b]">
                            Total Amount
                        </span>

                        <span className="text-lg font-bold text-[#1A9F73]">
                            Rs. {order.vendorOrder?.totalAmount}
                        </span>
                        </div>

                    </div>
                </div>
            </div>
            
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-lg">
                    <h2 className="text-lg font-semibold text-red-600 mb-3">
                        Confirm Cancellation
                    </h2>

                    <p className="text-sm text-gray-600 mb-5">
                        Are you sure you want to cancel this order? This action cannot be undone.
                    </p>

                    <div className="flex justify-end gap-3">
                        <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-4 py-2 border rounded-lg"
                        >
                        No
                        </button>

                        <button
                        onClick={async () => {
                            setShowCancelConfirm(false);
                            await updateStatus();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                        Yes, Cancel
                        </button>
                    </div>
                    </div>
                </div>
            )}
        </div>
    </Layout>
  );
}