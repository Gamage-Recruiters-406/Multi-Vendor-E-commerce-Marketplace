import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Heart,
  ShoppingCart,
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Clock3,
  Minus,
  Plus,
  CheckCircle2,
} from "lucide-react";
import {
  getProductDetails,
  getProductReviews,
  getProductAverageRating,
} from "../../api/buyerProductDetails";
//import Footer from "../../components/Layouts/Footer";
//import Header from "../../components/Layouts/Header";
import Layout from "../../components/Layouts/Layout";

import { addToCartApi, addToWishlistApi } from "../../api/buyerCartWishlist";

import {
  getFAQQuestionsApi,
  askAIQuestionApi,
  contactVendorApi,
  sendVendorMessageApi,
} from "../../api/buyerChatbot";
function Stars({ value, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300"
          }
        />
      ))}
    </div>
  );
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

export default function BuyerProductDetailsPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingData, setRatingData] = useState({
    avgRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const handleAddToCart = async () => {
    try {
      setActionLoading(true);
      await addToCartApi({
        product_id: product._id,
        quantity,
      });
      alert("Added to cart successfully");
    } catch (error) {
      alert(error.message || "Failed to add to cart");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      setActionLoading(true);
      await addToWishlistApi(product._id);
      alert("Added to wishlist successfully");
    } catch (error) {
      alert(error.message || "Failed to add to wishlist");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput("");

    setChatMessages((prev) => [...prev, { sender: "user", message: userMsg }]);

    try {
      setChatLoading(true);

      const res = await askAIQuestionApi({
        productId: product._id,
        message: userMsg,
        sessionId: chatSessionId,
      });

      setChatSessionId(res.sessionId);

      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", message: res.answer },
      ]);
    } catch (error) {
      alert(error.message || "Chat failed");
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const loadProductPage = async () => {
      try {
        const [productRes, reviewsRes, ratingRes] = await Promise.all([
          getProductDetails(id),
          getProductReviews(id),
          getProductAverageRating(id),
        ]);

        const loadedProduct = productRes?.data || null;

        setProduct(loadedProduct);
        setReviews(
          Array.isArray(reviewsRes)
            ? reviewsRes
            : reviewsRes?.reviews || reviewsRes?.data || [],
        );
        setRatingData(
          ratingRes || {
            avgRating: 0,
            totalReviews: 0,
          },
        );
        setSelectedImage(loadedProduct?.images?.[0] || "");
      } catch (error) {
        console.error("Product details load error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProductPage();
    }
  }, [id]);

  const specList = useMemo(() => {
    if (!product?.attributes || !Array.isArray(product.attributes)) return [];
    return product.attributes;
  }, [product]);

  const reviewCount = ratingData?.totalReviews || 0;
  const avgRating = Number(ratingData?.avgRating || 0);

  if (loading) {
    return <div className="p-6">Loading product...</div>;
  }

  if (!product) {
    return <div className="p-6">Product not found.</div>;
  }

  return (
    <>
      <Layout>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{product.store?.name || "Store"}</span>
              <ChevronRight size={12} />
              <span>{product.category?.name || "Category"}</span>
              <ChevronRight size={12} />
              <span className="text-slate-700">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              <div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {product.stock > 0 ? "● IN STOCK" : "OUT OF STOCK"}
                    </Badge>
                    {/*<button className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                      <Heart size={18} />
                    </button>*/}
                  </div>

                  <div className="overflow-hidden rounded-2xl bg-slate-100">
                    <img
                      src={selectedImage || product.images?.[0] || ""}
                      alt={product.name}
                      className="h-[420px] w-full object-cover md:h-[520px]"
                    />
                  </div>

                  <div className="mt-4 flex gap-3 overflow-x-auto">
                    {product.images?.map((image, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(image)}
                        className={`overflow-hidden rounded-2xl border-2 bg-slate-50 transition ${
                          selectedImage === image
                            ? "border-emerald-500"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Preview ${i + 1}`}
                          className="h-20 w-20 object-cover md:h-24 md:w-24"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {product.store?.name || "Store"}
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-600">
                      Verified
                    </Badge>
                  </div>

                  <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                    {product.name}
                  </h1>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <Stars value={avgRating} />
                    <span className="font-semibold text-slate-700">
                      {avgRating.toFixed(1)}
                    </span>
                    <span>({reviewCount} reviews)</span>
                    <span className="text-emerald-600">
                      {product.stock > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-4xl font-bold text-emerald-600">
                        Rs. {Number(product.price || 0).toLocaleString()}
                      </span>

                      <div className="ml-auto text-right text-sm text-emerald-600">
                        <p className="font-semibold">
                          {product.stock > 0 ? "In Stock" : "Unavailable"}
                        </p>
                        <p>{product.stock} units available</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="mb-3 text-sm font-semibold text-slate-700">
                      Quantity
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <button
                          className="px-3 py-2 text-slate-600 hover:bg-slate-50"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="min-w-12 text-center text-sm font-semibold">
                          {quantity}
                        </span>
                        <button
                          className="px-3 py-2 text-slate-600 hover:bg-slate-50"
                          onClick={() =>
                            setQuantity((q) =>
                              Math.min(product.stock || 1, q + 1),
                            )
                          }
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <span className="text-sm text-slate-400">
                        {product.stock} units available
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={actionLoading || product.stock <= 0}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ShoppingCart size={16} />
                      {actionLoading ? "Adding..." : "Add to Cart"}
                    </button>

                    <button
                      onClick={handleAddToWishlist}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Heart size={16} />
                      Save to Wishlist
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {[
                      { icon: Truck, text: "Free Express Shipping" },
                      { icon: ShieldCheck, text: "2 Year Warranty" },
                      { icon: RotateCcw, text: "30 Day Easy Returns" },
                      { icon: Clock3, text: "Secure Checkout" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600"
                      >
                        <item.icon size={15} className="text-emerald-600" />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {product.store?.name || "Store"}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <Stars value={avgRating} size={12} />
                          <span>Verified Vendor</span>
                        </div>
                      </div>

                      {/*<button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                        View Store
                      </button>*/}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center gap-6 border-b border-slate-200 pb-4">
                {[
                  { key: "description", label: "Description" },
                  { key: "specifications", label: "Specifications" },
                  { key: "reviews", label: `Reviews (${reviewCount})` },
                  { key: "chat", label: "Chat" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-2 text-sm font-medium transition ${
                      activeTab === tab.key
                        ? "border-b-2 border-emerald-600 text-emerald-600"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "description" && (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {product.name}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {product.description || "No description available."}
                    </p>

                    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/*<div className="rounded-2xl bg-slate-50 p-5">
                      {/*<h3 className="font-semibold text-slate-800">
                        Fast Delivery
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Reliable shipping and smooth order handling for a better
                        buying experience.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <h3 className="font-semibold text-slate-800">
                        Quality Product
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Carefully listed with real specifications, stock count,
                        and store information.
                      </p>
                    </div>*/}
                    </div>
                  </div>

                  <div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="font-semibold text-slate-800">
                        {product.store?.name || "Store"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Category: {product.category?.name || "Category"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Availability: {product.stock} units
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "specifications" && (
                <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
                  {specList.length > 0 ? (
                    specList.map((attr, i) => (
                      <div key={i} className="border-b border-slate-200 pb-3">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          {attr.name}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {Array.isArray(attr.values)
                            ? attr.values.join(", ")
                            : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No specifications available.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-2">
                      <p className="text-5xl font-bold text-slate-900">
                        {avgRating.toFixed(1)}
                      </p>
                      <div className="mt-2">
                        <Stars value={avgRating} size={16} />
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {reviewCount} reviews
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {reviews.length > 0 ? (
                      reviews.map((review, i) => (
                        <div
                          key={review._id || i}
                          className="rounded-2xl border border-slate-200 bg-white p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                                {(
                                  review.user_id?.name ||
                                  review.user_id?.fullname ||
                                  "U"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-800">
                                  {review.user_id?.name ||
                                    review.user_id?.fullname ||
                                    "User"}
                                </p>

                                <p className="text-xs text-slate-400">
                                  {review.createdAt
                                    ? new Date(
                                        review.createdAt,
                                      ).toLocaleDateString()
                                    : ""}
                                </p>
                              </div>
                            </div>

                            <Stars value={review.rating || 0} size={14} />
                          </div>

                          <p className="mt-4 text-sm leading-7 text-slate-600">
                            {review.comment || "No comment provided."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No reviews yet.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "chat" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-xl font-bold text-slate-900">
                    Chat about this product
                  </h2>

                  <div className="mt-5 h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        Ask anything about this product.
                      </p>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                            msg.sender === "user"
                              ? "ml-auto bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {msg.message}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
                      placeholder="Type your question..."
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                    />

                    <button
                      onClick={handleAskAI}
                      disabled={chatLoading}
                      className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {chatLoading ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
