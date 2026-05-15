import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Trash2,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Layout from "../../components/Layouts/Layout";
import { getWishlist, removeFromWishlist } from "../../services/wishlist";
import { addToCart } from "../../services/cartService";

const FILTER_BUTTONS = ["All", "Category", "Date", "Stock Status"];
const PAGE_SIZE = 6;

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);

const getProductTag = (product) => {
  if (product.stock <= 0) {
    return {
      text: "OUT OF STOCK",
      classes: "bg-rose-50 text-rose-700 border border-rose-200",
    };
  }

  const createdAt = product.createdAt ? new Date(product.createdAt) : null;
  const ageInDays = createdAt
    ? Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (product.stock <= 5) {
    return {
      text: "LOW STOCK",
      classes: "bg-rose-50 text-rose-700 border border-rose-200",
    };
  }

  if (ageInDays !== null && ageInDays <= 30) {
    return {
      text: "NEW",
      classes: "bg-slate-100 text-slate-700 border border-slate-200",
    };
  }

  if (Number(product.price) > 0 && Number(product.price) < 80) {
    return {
      text: "SALE",
      classes: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    };
  }

  return {
    text: "HOT",
    classes: "bg-amber-100 text-amber-700 border border-amber-200",
  };
};

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWishlist();
      const items = Array.isArray(response?.data?.items)
        ? response.data.items
            .map((item) => item.product_id || item)
            .filter(Boolean)
        : [];
      setWishlistItems(items);
    } catch (err) {
      setError(err.message || "Unable to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleAddToCart = async (product) => {
    if (!product?._id || product.stock <= 0) return;

    try {
      setActionLoading(true);
      console.log('Adding to cart:', product._id);
      await addToCart(product._id, 1);
      console.log('Successfully added to cart');
      window.alert("Added to cart successfully");
    } catch (err) {
      console.error('Failed to add to cart:', err);
      window.alert(err.message || "Failed to add to cart");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      setActionLoading(true);
      await removeFromWishlist(productId);
      setWishlistItems((prev) => prev.filter((product) => product._id !== productId));
    } catch (err) {
      window.alert(err.message || "Failed to remove item");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    let items = wishlistItems;

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      items = items.filter((product) => {
        const title = product.name || "";
        const category = product.category?.name || product.category || "";
        return (
          title.toLowerCase().includes(term) ||
          category.toLowerCase().includes(term)
        );
      });
    }

    if (activeFilter === "Category") {
      items = [...items].sort((a, b) => {
        const aCat = (a.category?.name || a.category || "").toLowerCase();
        const bCat = (b.category?.name || b.category || "").toLowerCase();
        return aCat.localeCompare(bCat);
      });
    }

    if (activeFilter === "Date") {
      items = [...items].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    if (activeFilter === "Stock Status") {
      items = [...items].sort((a, b) => {
        if (a.stock <= 0 && b.stock > 0) return 1;
        if (a.stock > 0 && b.stock <= 0) return -1;
        if (a.stock !== b.stock) return a.stock - b.stock;
        return 0;
      });
    }

    return items;
  }, [wishlistItems, searchTerm, activeFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const startItemIndex = currentPage * PAGE_SIZE;
  const currentPageItems = filteredItems.slice(startItemIndex, startItemIndex + PAGE_SIZE);

  useEffect(() => {
    if (currentPage >= pageCount) {
      setCurrentPage(Math.max(0, pageCount - 1));
    }
  }, [currentPage, pageCount]);

  const renderStatusLabel = (stock) => {
    if (stock <= 0) {
      return "Out of stock";
    }
    if (stock <= 5) {
      return `Only ${stock} left`;
    }
    return "In stock";
  };

  return (
    <Layout>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <main className="flex flex-col max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
          <section className="flex-col rounded-xl bg-teal-600 px-6 py-10 shadow-sm sm:px-10 sm:py-14">
            <p className="text-center text-4xl font-bold text-white">
              My Wishlist
            </p>
            <h1 className="text-center mt-2 text-lg text-white">
              Your saved items for later
            </h1>
          </section>

          <section className="mt-8 rounded-xl bg-white p-5 shadow-sm sm:p-6 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <label htmlFor="wishlist-search" className="sr-only">
                  Search wishlist
                </label>
                <input
                  id="wishlist-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setCurrentPage(0);
                  }}
                  placeholder="Search"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {FILTER_BUTTONS.map((button) => (
                  <button
                    key={button}
                    type="button"
                    onClick={() => {
                      setActiveFilter(button);
                      setCurrentPage(0);
                    }}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      activeFilter === button
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {button}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="mt-8 flex min-h-[340px] items-center justify-center rounded-xl bg-white shadow-sm">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-xl border-b-2 border-emerald-600"></div>
                  <p className="mt-4 text-sm text-slate-500">Loading wishlist...</p>
                </div>
              </div>
            ) : currentPageItems.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-900">Your wishlist is empty</p>
                <p className="mt-2 text-sm text-slate-500">
                  Save items you love and revisit them later.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/categories")}
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Browse products
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {currentPageItems.map((product) => {
                    const badge = getProductTag(product);
                    const productRating = product.rating ?? 4.8;
                    const productImage =
                      Array.isArray(product.images) && product.images.length > 0
                        ? product.images[0]
                        : "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80";

                    return (
                      <article
                        key={product._id}
                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        onClick={() => navigate(`/buyer/productdetails/${product._id}`)}
                      >
                        <div className="relative overflow-hidden bg-slate-100">
                          <img
                            src={productImage}
                            alt={product.name}
                            className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                          <div className={`absolute left-4 top-4 rounded-xl px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${badge.classes}`}>
                            {badge.text}
                          </div>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveFromWishlist(product._id);
                            }}
                            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-slate-900 shadow-sm transition hover:bg-white"
                            aria-label="Remove from wishlist"
                          >
                            <Trash2 size={18} className="text-rose-500" />
                          </button>
                        </div>

                        <div className="space-y-4 p-5">
                          <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                              {product.name}
                            </h2>
                            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                              {product.category?.name || product.category || "Uncategorized"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xl font-bold text-slate-900">
                                {formatCurrency(product.price)}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {renderStatusLabel(product.stock)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <Star size={14} className="text-amber-400" />
                              <span className="text-sm font-semibold">
                                {productRating.toFixed(1)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleAddToCart(product);
                            }}
                            disabled={actionLoading || product.stock <= 0}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            <ShoppingCart size={16} />
                            Add to Cart
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Showing {startItemIndex + 1}–{startItemIndex + currentPageItems.length} of {filteredItems.length} results
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {Array.from({ length: pageCount }, (_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentPage(index)}
                        className={`inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
                          index === currentPage
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1))}
                      disabled={currentPage === pageCount - 1}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </Layout>
  );
}
