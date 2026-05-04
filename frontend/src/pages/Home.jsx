import { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ShoppingBag,
  Store,
  ShieldCheck,
  MessageSquare,
  Eye,
} from 'lucide-react';
import Hero from '../components/home/Hero';
import Announcements from '../components/home/Announcements';
import HomeService from '../services/HomeService';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layouts/Layout';

const GREEN = '#1A9F73';
const GREEN_DARK = '#158a62';

// Fallback images (in case API fails)
const FALLBACK_STORE_IMG =
  'https://placehold.co/400x240/3d2b1f/ffffff?text=Store+Image';
const FALLBACK_PRODUCT_IMG =
  'https://placehold.co/300x220/f0f0f0/333?text=Product+Image';

const features = [
  {
    icon: <ShoppingBag size={18} className="text-yellow-400" />,
    title: 'Multi-Vendor Shopping',
    desc: 'Explore products from multiple trusted sellers—all in one place.',
  },
  {
    icon: <Store size={18} className="text-yellow-400" />,
    title: 'Build Your Own Store',
    desc: 'Create your store, showcase your products, and grow your business effortlessly.',
  },
  {
    icon: <ShieldCheck size={18} className="text-yellow-400" />,
    title: 'Secure Checkout',
    desc: 'Enjoy a smooth checkout experience with secure payments for sellers.',
  },
  {
    icon: <MessageSquare size={18} className="text-yellow-400" />,
    title: 'Reviews & Feedback',
    desc: 'Make informed decisions with real customer feedback and ratings.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [viewedIdx, setViewedIdx] = useState(null);
  const [allStores, setAllStores] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [currentStorePage, setCurrentStorePage] = useState(0);
  const [currentProductPage, setCurrentProductPage] = useState(0);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [storesError, setStoresError] = useState(null);
  const [productsError, setProductsError] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  const STORES_PER_PAGE = 3;
  const PRODUCTS_PER_PAGE = 3;
  const AUTO_SLIDE_INTERVAL = 7000; // 7 seconds

  // Calculate current stores to display
  const storeStartIndex = currentStorePage * STORES_PER_PAGE;
  const storeEndIndex = storeStartIndex + STORES_PER_PAGE;
  const currentStores = allStores.slice(storeStartIndex, storeEndIndex);
  const totalStorePages = Math.ceil(allStores.length / STORES_PER_PAGE);

  // Calculate current products to display
  const productStartIndex = currentProductPage * PRODUCTS_PER_PAGE;
  const productEndIndex = productStartIndex + PRODUCTS_PER_PAGE;
  const currentProducts = recentProducts.slice(
    productStartIndex,
    productEndIndex,
  );
  const totalProductPages = Math.ceil(
    recentProducts.length / PRODUCTS_PER_PAGE,
  );

  // Fetch home data when component mounts
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoadingStores(true);
        setLoadingProducts(true);
        setLoadingAnnouncements(true);

        // Fetch recent stores
        const storesData = await HomeService.getRecentStores(12);
        if (storesData.success) {
          setAllStores(storesData.data);
        } else {
          setStoresError('Failed to load stores');
        }

        // Fetch recent products for "New Arrivals"
        const productsData = await HomeService.getRecentProducts(9);
        if (productsData.success) {
          setRecentProducts(productsData.data);
        } else {
          setProductsError('Failed to load products');
        }

        // Fetch announcements
        try {
          const announcementsData =
            await HomeService.getLatestAnnouncements(10);
          if (announcementsData.success && announcementsData.data.length > 0) {
            setAnnouncements(announcementsData.data);
          }
        } catch (err) {
          console.log('No announcements available', err);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
        setStoresError(error.message || 'Error loading stores');
        setProductsError(error.message || 'Error loading products');
      } finally {
        setLoadingStores(false);
        setLoadingProducts(false);
        setLoadingAnnouncements(false);
      }
    };

    fetchHomeData();
  }, []);

  // Auto-slide functionality for announcements
  useEffect(() => {
    if (announcements.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentAnnouncementIndex(
        (prevIndex) => (prevIndex + 1) % announcements.length,
      );
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [announcements.length]);

  // Auto-slide functionality for stores
  useEffect(() => {
    if (totalStorePages <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentStorePage((prevPage) => (prevPage + 1) % totalStorePages);
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [totalStorePages]);

  // Auto-slide functionality for products
  useEffect(() => {
    if (totalProductPages <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentProductPage((prevPage) => (prevPage + 1) % totalProductPages);
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [totalProductPages]);

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentStorePage(0);
  }, [allStores.length]);

  useEffect(() => {
    setCurrentProductPage(0);
  }, [recentProducts.length]);

  useEffect(() => {
    setCurrentAnnouncementIndex(0);
  }, [announcements.length]);

  const handleViewProduct = (productId) => {
    setViewedIdx(productId);
    setTimeout(() => setViewedIdx(null), 1400);
    navigate(`/buyer/productdetails/${productId}`);
  };

  const handleVisitStore = (storeId) => {
    navigate(`/store/${storeId}`);
  };

  // Announcement navigation handlers
  const handleNextAnnouncement = () => {
    setCurrentAnnouncementIndex(
      (prevIndex) => (prevIndex + 1) % announcements.length,
    );
  };

  const handlePrevAnnouncement = () => {
    setCurrentAnnouncementIndex(
      (prevIndex) =>
        (prevIndex - 1 + announcements.length) % announcements.length,
    );
  };

  const handleAnnouncementIndicatorClick = (index) => {
    setCurrentAnnouncementIndex(index);
  };

  // Store navigation handlers
  const handleNextStorePage = () => {
    setCurrentStorePage((prevPage) => (prevPage + 1) % totalStorePages);
  };

  const handlePrevStorePage = () => {
    setCurrentStorePage(
      (prevPage) => (prevPage - 1 + totalStorePages) % totalStorePages,
    );
  };

  const handleStorePageIndicatorClick = (pageIndex) => {
    setCurrentStorePage(pageIndex);
  };

  // Product navigation handlers
  const handleNextProductPage = () => {
    setCurrentProductPage((prevPage) => (prevPage + 1) % totalProductPages);
  };

  const handlePrevProductPage = () => {
    setCurrentProductPage(
      (prevPage) => (prevPage - 1 + totalProductPages) % totalProductPages,
    );
  };

  const handleProductPageIndicatorClick = (pageIndex) => {
    setCurrentProductPage(pageIndex);
  };

  // Format price to display currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Get category name or fallback
  const getCategoryName = (product) => {
    if (product.category && typeof product.category === 'object') {
      return product.category.name;
    }
    return 'PRODUCT';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white font-sans antialiased">
        <Hero features={features} />

        <Announcements
          loadingAnnouncements={loadingAnnouncements}
          announcements={announcements}
          currentAnnouncementIndex={currentAnnouncementIndex}
          handlePrevAnnouncement={handlePrevAnnouncement}
          handleNextAnnouncement={handleNextAnnouncement}
          handleAnnouncementIndicatorClick={handleAnnouncementIndicatorClick}
          GREEN={GREEN}
        />

        {/* ── RECENT STORES WITH PAGINATION ────────────────────── */}
        <section className="px-4 py-8 sm:px-6 sm:py-14 md:px-16 lg:px-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 sm:mb-8 flex items-center justify-between">
              <h2
                style={{ color: GREEN }}
                className="text-xl sm:text-2xl font-bold italic"
              >
                Recent Stores
              </h2>
            </div>

            {/* Loading State */}
            {loadingStores && (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <div
                  className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2"
                  style={{ borderColor: GREEN }}
                ></div>
              </div>
            )}

            {/* Error State */}
            {storesError && !loadingStores && (
              <div className="text-center py-8 sm:py-12">
                <p className="text-red-500 mb-4 text-sm sm:text-base">
                  {storesError}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white text-sm sm:text-base"
                  style={{ backgroundColor: GREEN }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Stores Grid with Navigation */}
            {!loadingStores && !storesError && (
              <>
                <div className="flex items-center gap-2 sm:gap-4">
                  {totalStorePages > 1 && (
                    <button
                      onClick={handlePrevStorePage}
                      className="flex-shrink-0 p-2 sm:p-3 rounded-full transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: GREEN + '20',
                        color: GREEN,
                        border: `1px solid ${GREEN}40`,
                      }}
                      aria-label="Previous stores"
                      disabled={currentStorePage === 0}
                    >
                      <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                    </button>
                  )}

                  <div className="flex-1 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
                    {currentStores.length > 0 ? (
                      currentStores.map((store) => (
                        <div
                          key={store._id}
                          className="group overflow-hidden rounded-xl sm:rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5 flex flex-col h-full"
                        >
                          <div className="h-40 sm:h-52 overflow-hidden bg-gray-100 flex-shrink-0">
                            {store.logo ? (
                              <img
                                src={store.logo}
                                alt={store.name}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                onError={(e) => {
                                  e.target.src = FALLBACK_STORE_IMG;
                                }}
                              />
                            ) : (
                              <div
                                className="h-full w-full flex items-center justify-center"
                                style={{ backgroundColor: GREEN + '20' }}
                              >
                                <Store
                                  size={32}
                                  className="sm:w-12 sm:h-12"
                                  style={{ color: GREEN }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-1 flex-1 flex flex-col">
                            <div>
                              <p className="font-bold text-gray-800 text-sm sm:text-base">
                                {store.name}
                              </p>
                              <p className="text-[8px] sm:text-[10px] font-semibold tracking-widest text-gray-400 mt-0.5">
                                {store.vendor?.name || 'Verified Vendor'}
                              </p>
                            </div>
                            <div className="mt-1 sm:mt-2 min-h-[2.5rem] sm:min-h-[3rem]">
                              {store.description && (
                                <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2">
                                  {store.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 sm:pt-2 mt-auto">
                            <button
                              onClick={() => handleVisitStore(store._id)}
                              style={{ backgroundColor: GREEN }}
                              className="w-full rounded-lg py-1.5 sm:py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white transition hover:brightness-110 active:scale-95"
                            >
                              Visit Store
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 sm:py-12">
                        <p className="text-gray-500 text-sm sm:text-base">
                          No stores available yet.
                        </p>
                      </div>
                    )}
                  </div>

                  {totalStorePages > 1 && (
                    <button
                      onClick={handleNextStorePage}
                      className="flex-shrink-0 p-2 sm:p-3 rounded-full transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: GREEN + '20',
                        color: GREEN,
                        border: `1px solid ${GREEN}40`,
                      }}
                      aria-label="Next stores"
                      disabled={currentStorePage === totalStorePages - 1}
                    >
                      <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                    </button>
                  )}
                </div>

                {totalStorePages > 1 && (
                  <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-8">
                    {Array.from({ length: totalStorePages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleStorePageIndicatorClick(idx)}
                        className={`transition-all duration-300 rounded-full ${
                          currentStorePage === idx
                            ? 'w-6 h-1.5 sm:w-8 sm:h-2'
                            : 'w-1.5 h-1.5 sm:w-2 sm:h-2'
                        }`}
                        style={{
                          backgroundColor:
                            currentStorePage === idx ? GREEN : GREEN + '40',
                        }}
                        aria-label={`Go to page ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {totalStorePages > 1 && (
                  <div className="text-center mt-2 sm:mt-4">
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      Page {currentStorePage + 1} of {totalStorePages}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── NEW ARRIVALS WITH PAGINATION ──────────────────────── */}
        <section className="px-4 pb-12 sm:px-6 sm:pb-20 md:px-16 lg:px-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 sm:mb-8 flex items-center justify-between">
              <h2
                style={{ color: GREEN }}
                className="text-xl sm:text-2xl font-bold italic"
              >
                New Arrivals
              </h2>
            </div>

            {/* Loading State */}
            {loadingProducts && (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <div
                  className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2"
                  style={{ borderColor: GREEN }}
                ></div>
              </div>
            )}

            {/* Error State */}
            {productsError && !loadingProducts && (
              <div className="text-center py-8 sm:py-12">
                <p className="text-red-500 mb-4 text-sm sm:text-base">
                  {productsError}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white text-sm sm:text-base"
                  style={{ backgroundColor: GREEN }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Products Grid with Navigation */}
            {!loadingProducts && !productsError && (
              <>
                <div className="flex items-center gap-2 sm:gap-4">
                  {totalProductPages > 1 && (
                    <button
                      onClick={handlePrevProductPage}
                      className="flex-shrink-0 p-2 sm:p-3 rounded-full transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: GREEN + '20',
                        color: GREEN,
                        border: `1px solid ${GREEN}40`,
                      }}
                      aria-label="Previous products"
                      disabled={currentProductPage === 0}
                    >
                      <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                    </button>
                  )}

                  <div className="flex-1 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
                    {currentProducts.length > 0 ? (
                      currentProducts.map((product, idx) => (
                        <div
                          key={product._id}
                          className="group overflow-hidden rounded-xl sm:rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col h-full"
                          onClick={() => handleViewProduct(product._id)}
                        >
                          <div className="h-40 sm:h-52 overflow-hidden bg-gray-50 relative flex-shrink-0">
                            {product.images && product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                onError={(e) => {
                                  e.target.src = FALLBACK_PRODUCT_IMG;
                                }}
                              />
                            ) : (
                              <div
                                className="h-full w-full flex items-center justify-center"
                                style={{ backgroundColor: GREEN + '10' }}
                              >
                                <ShoppingBag
                                  size={32}
                                  className="sm:w-12 sm:h-12"
                                  style={{ color: GREEN }}
                                />
                              </div>
                            )}
                            {/* Stock badge */}
                            {product.stock > 0 ? (
                              product.stock < 10 && (
                                <span className="absolute top-2 right-2 bg-yellow-400 text-black text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                  Only {product.stock} left
                                </span>
                              )
                            ) : (
                              <span className="absolute top-2 right-2 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                Out of Stock
                              </span>
                            )}
                          </div>
                          <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-1 flex-1 flex flex-col">
                            <div>
                              <p className="font-bold text-gray-800 text-sm sm:text-base line-clamp-1">
                                {product.name}
                              </p>
                              <p className="text-[8px] sm:text-[10px] font-semibold tracking-widest text-gray-400 mt-0.5 uppercase">
                                {getCategoryName(product)}
                              </p>
                            </div>
                            <div className="mt-1 sm:mt-2 min-h-[2.5rem] sm:min-h-[3rem]">
                              {product.description && (
                                <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2">
                                  {product.description}
                                </p>
                              )}
                            </div>
                            <div className="mt-2">
                              <span
                                style={{ color: GREEN }}
                                className="text-base sm:text-lg font-bold"
                              >
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          </div>
                          <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 sm:pt-2 mt-auto">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProduct(product._id);
                              }}
                              style={{
                                backgroundColor: GREEN,
                              }}
                              className="w-full rounded-lg py-1.5 sm:py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white transition hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
                            >
                              <Eye size={14} />
                              {viewedIdx === product._id ? '✓ Viewed!' : 'View Product'}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 sm:py-12">
                        <p className="text-gray-500 text-sm sm:text-base">
                          No products available yet.
                        </p>
                      </div>
                    )}
                  </div>

                  {totalProductPages > 1 && (
                    <button
                      onClick={handleNextProductPage}
                      className="flex-shrink-0 p-2 sm:p-3 rounded-full transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: GREEN + '20',
                        color: GREEN,
                        border: `1px solid ${GREEN}40`,
                      }}
                      aria-label="Next products"
                      disabled={currentProductPage === totalProductPages - 1}
                    >
                      <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                    </button>
                  )}
                </div>

                {/* Page Indicators for Products */}
                {totalProductPages > 1 && (
                  <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-8">
                    {Array.from({ length: totalProductPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleProductPageIndicatorClick(idx)}
                        className={`transition-all duration-300 rounded-full ${
                          currentProductPage === idx
                            ? 'w-6 h-1.5 sm:w-8 sm:h-2'
                            : 'w-1.5 h-1.5 sm:w-2 sm:h-2'
                        }`}
                        style={{
                          backgroundColor:
                            currentProductPage === idx ? GREEN : GREEN + '40',
                        }}
                        aria-label={`Go to page ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Page Info for Products */}
                {totalProductPages > 1 && (
                  <div className="text-center mt-2 sm:mt-4">
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      Page {currentProductPage + 1} of {totalProductPages}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── CTA FOOTER ────────────────────────────────────────── */}
        <section
          style={{ backgroundColor: GREEN_DARK }}
          className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-16 md:px-16 lg:px-24"
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 sm:h-64 sm:w-64 rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10 mx-auto max-w-6xl flex flex-col gap-6 sm:gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-sm text-center md:text-left">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-2 sm:mb-3">
                Ready to open your own store?
              </h2>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Join our curated community of elite sellers and reach thousands of
                discerning customers worldwide.
              </p>
            </div>

            <Link
              to="/register"
              className="self-center md:self-auto shrink-0 inline-flex items-center gap-2 rounded-full px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold text-white transition hover:gap-3 active:scale-95"
              style={{
                border: '2px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              Start Selling Today{' '}
              <ArrowRight size={14} className="sm:w-4 sm:h-4" />
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}