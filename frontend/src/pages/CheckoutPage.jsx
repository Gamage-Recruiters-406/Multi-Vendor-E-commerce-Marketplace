import { useState } from "react";
import { ArrowLeft, MapPin, CreditCard, Shield, Lock } from "lucide-react";
import Layout from "../components/Layouts/Layout";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [couponCode, setCouponCode] = useState("");

  const sampleProducts = [
    {
      id: 1,
      store: "TechZone Electronics",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop",
      name: "Wireless Bluetooth Headphones",
      quantity: 1,
      price: 79.99,
    },
    {
      id: 2,
      store: "Fashion Hub",
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop",
      name: "Classic White Sneakers",
      quantity: 2,
      price: 49.99,
    },
    {
      id: 3,
      store: "Home & Living",
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=80&h=80&fit=crop",
      name: "Modern Table Lamp",
      quantity: 1,
      price: 34.99,
    },
  ];

  const subtotal = sampleProducts.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = 8.99;
  const discount = 0;
  const total = subtotal + shipping - discount;

  return (
    <Layout>
      <div className="font-sans" style={{ backgroundColor: "#F5F7F6" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-8">
            <button className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
              <p className="text-gray-500 text-sm">
                Complete your purchase securely
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#1A9F73]" />
                  Delivery Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9F73] focus:border-transparent transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9F73] focus:border-transparent transition-all"
                      placeholder="Doe"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9F73] focus:border-transparent transition-all"
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9F73] focus:border-transparent transition-all"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9F73] focus:border-transparent transition-all"
                      placeholder="10001"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9F73] focus:border-transparent transition-all bg-white">
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="LK">Sri Lanka</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#1A9F73]" />
                  Payment Details
                </h2>

                <div className="flex gap-3 mb-6">
                  {["credit", "debit", "paypal"].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                        paymentMethod === method
                          ? "bg-[#1A9F73] text-white shadow-md"
                          : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#1A9F73]"
                      }`}
                    >
                      {method === "credit" && "Credit Card"}
                      {method === "debit" && "Debit Card"}
                      {method === "paypal" && "PayPal"}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9F73] focus:border-transparent transition-all"
                        placeholder="1234 5678 9012 3456"
                      />
                      <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9F73] focus:border-transparent transition-all"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9F73] focus:border-transparent transition-all"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9F73] focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4 text-[#1A9F73]" />
                  <span>Your payment info is encrypted and secure</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Coupon Code
                </h2>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9F73] focus:border-transparent transition-all"
                    placeholder="Enter coupon code"
                  />
                  <button className="px-6 py-2.5 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
                <h2 className="text-lg font-bold text-gray-800 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {sampleProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border-b border-gray-100 pb-4 last:border-0"
                    >
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        {product.store}
                      </p>
                      <div className="flex gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Qty: {product.quantity}
                          </p>
                          <p className="text-sm font-semibold text-gray-800 mt-1">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-green-600">
                        -${discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100">
                    <span className="text-gray-800">Total</span>
                    <span className="text-[#1A9F73]">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button className="w-full mt-6 py-4 bg-[#1A9F73] text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-[#168a62] transition-all flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" />
                  Place Order — ${total.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
