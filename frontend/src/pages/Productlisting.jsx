import { useState, useEffect, useRef, useCallback } from 'react';
import productListingService from '../services/ProductListingService';
import FilterPanel from '../components/ProductListing/FilterPanel';
import Layout from '../components/Layouts/Layout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_VERSION || '/api/v1'}`
  : 'http://localhost:5000/api/v1';

const GREEN = '#1A9F73';
const GREEN_DARK = '#158860';

function Badge({ text }) {
  if (!text) return null;
  const isNew = text === 'New';
  return (
    <span
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: isNew ? '#3b82f6' : GREEN,
        color: 'white',
        fontSize: 11,
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: 999,
        zIndex: 10,
      }}
    >
      {text}
    </span>
  );
}

function ProductCard({ product, onViewDetails }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)')
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div
        style={{
          position: 'relative',
          background: '#f9fafb',
          height: 192,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Badge text={product.badge} />
        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            e.target.src =
              'https://placehold.co/300x220/f3f4f6/9ca3af?text=Product';
          }}
        />
      </div>
      <div
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px' }}>
          {product.vendor}
        </p>
        <h3
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: '#1f2937',
            lineHeight: 1.4,
            margin: '0 0 8px',
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </h3>
        <p
          style={{
            color: GREEN,
            fontWeight: 700,
            fontSize: 18,
            margin: '12px 0 12px',
          }}
        >
          ${product.price.toFixed(2)}
        </p>
        <button
          onClick={() => onViewDetails(product.id)}
          style={{
            width: '100%',
            background: GREEN,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            padding: '10px 0',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = GREEN_DARK)}
          onMouseLeave={(e) => (e.currentTarget.style.background = GREEN)}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

function ProductListingContent() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeFilters, setActiveFilters] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Filter states
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 5000,
    selectedCategories: [],
    selectedCategoryIds: [],
    searchKeyword: '',
    priceRange: { min: 0, max: 5000 },
  });

  const [inputValue, setInputValue] = useState('');
  const [categoryMap, setCategoryMap] = useState({});
  const [categoriesList, setCategoriesList] = useState([]);

  const debounceTimerRef = useRef(null);
  const isInitialMount = useRef(true);
  const isFetchingRef = useRef(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setShowSidebar(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchProducts = useCallback(
    async (customFilters = null) => {
      // Prevent multiple simultaneous fetches
      if (isFetchingRef.current) {
        console.log('⏳ Fetch already in progress, skipping...');
        return;
      }

      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const currentFilters = customFilters || filters;

      try {
        const apiFilters = {};

        // Only add search keyword if it has value
        if (
          currentFilters.searchKeyword &&
          currentFilters.searchKeyword.trim()
        ) {
          apiFilters.keyword = currentFilters.searchKeyword.trim();
        }

        // Add price filters
        if (
          currentFilters.priceMin !== undefined &&
          currentFilters.priceMin !== null
        ) {
          apiFilters.minPrice = Number(currentFilters.priceMin);
        }
        if (
          currentFilters.priceMax !== undefined &&
          currentFilters.priceMax !== null
        ) {
          apiFilters.maxPrice = Number(currentFilters.priceMax);
        }

        // Add category filter
        if (
          currentFilters.selectedCategoryIds &&
          currentFilters.selectedCategoryIds.length > 0
        ) {
          apiFilters.category = currentFilters.selectedCategoryIds[0];
        }

        console.log('📤 Sending API request with filters:', apiFilters);

        const response = await productListingService.getProducts(apiFilters);

        setProducts(response.products || []);
        setTotalProducts(response.count || 0);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
        setProducts([]);
        setTotalProducts(0);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [filters],
  );

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/category`);
        const result = await response.json();

        if (result.success) {
          let flatCategories = [];

          if (Array.isArray(result.data)) {
            const flattenCategories = (categories, arr = []) => {
              categories.forEach((cat) => {
                arr.push(cat);
                if (cat.children && cat.children.length) {
                  flattenCategories(cat.children, arr);
                }
              });
              return arr;
            };
            flatCategories = flattenCategories(result.data);
          }

          const nameToId = {};
          const categoryNames = [];

          flatCategories.forEach((cat) => {
            nameToId[cat.name] = cat._id;
            categoryNames.push(cat.name);
          });

          setCategoryMap(nameToId);
          setCategoriesList(categoryNames);

          // Initial fetch after categories are loaded
          if (isInitialMount.current) {
            isInitialMount.current = false;
            fetchProducts();
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [fetchProducts]);

  // Debounced search effect
  useEffect(() => {
    if (isInitialMount.current) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [filters.searchKeyword, fetchProducts]);

  const handleViewDetails = (productId) => {
    window.location.href = `/buyer/productdetails/${productId}`;
  };

  const removeFilter = (filter) => {
    if (filter.startsWith('$')) {
      setFilters((prev) => ({
        ...prev,
        priceMin: prev.priceRange.min,
        priceMax: prev.priceRange.max,
      }));
      // Fetch products after resetting price filters
      setTimeout(() => {
        fetchProducts({
          ...filters,
          priceMin: filters.priceRange.min,
          priceMax: filters.priceRange.max,
        });
      }, 0);
    } else if (filters.selectedCategories.includes(filter)) {
      setFilters((prev) => ({
        ...prev,
        selectedCategories: prev.selectedCategories.filter((c) => c !== filter),
      }));
    }
  };

  const updateActiveFilters = useCallback(() => {
    const newFilters = [];

    if (
      filters.priceMin > filters.priceRange.min ||
      filters.priceMax < filters.priceRange.max
    ) {
      newFilters.push(`$${filters.priceMin} - $${filters.priceMax}`);
    }

    newFilters.push(...filters.selectedCategories);

    setActiveFilters(newFilters);
  }, [
    filters.priceMin,
    filters.priceMax,
    filters.priceRange.min,
    filters.priceRange.max,
    filters.selectedCategories,
  ]);

  const handleApplyFilters = (appliedFilters) => {
    // Use appliedFilters if available, otherwise fallback to current state
    const filtersToUse = appliedFilters || filters;

    // Convert category names to IDs using the latest filters
    const categoryIds = filtersToUse.selectedCategories
      .map((catName) => categoryMap[catName])
      .filter((id) => id);

    const updatedFilters = {
      ...filtersToUse,
      selectedCategoryIds: categoryIds,
    };

    // Update state for consistency
    setFilters(updatedFilters);

    // Fetch products with the fully updated filters object
    fetchProducts(updatedFilters);

    // Also update active filter tags
    const newActiveFilters = [];
    if (
      updatedFilters.priceMin > updatedFilters.priceRange.min ||
      updatedFilters.priceMax < updatedFilters.priceRange.max
    ) {
      newActiveFilters.push(
        `$${updatedFilters.priceMin} - $${updatedFilters.priceMax}`,
      );
    }
    newActiveFilters.push(...updatedFilters.selectedCategories);
    setActiveFilters(newActiveFilters);

    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleResetFilters = () => {
    const resetFilters = {
      ...filters,
      priceMin: filters.priceRange.min,
      priceMax: filters.priceRange.max,
      selectedCategories: [],
      selectedCategoryIds: [],
    };

    setFilters(resetFilters);
    setActiveFilters([]);

    // Fetch all products after reset
    fetchProducts(resetFilters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  useEffect(() => {
    updateActiveFilters();
  }, [updateActiveFilters]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFilters((prev) => ({ ...prev, searchKeyword: value }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      fetchProducts();
    }
  };

  const handleSearchClick = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    fetchProducts();
  };

  if (loading && products.length === 0) {
    return (
      <div
        style={{
          minHeight: '60vh',
          background: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '60vh',
          background: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ color: 'red' }}>Error: {error}</div>
        <button
          onClick={() => fetchProducts()}
          style={{
            padding: '8px 16px',
            background: GREEN,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#f9fafb',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Mobile Filter Overlay */}
      {isMobile && showSidebar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setShowSidebar(false)}
        >
          <div
            style={{
              width: '80%',
              maxWidth: 320,
              height: '100%',
              background: 'white',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <FilterPanel
              onClose={() => setShowSidebar(false)}
              filters={filters}
              onFilterChange={handleFilterChange}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
              categories={categoriesList}
            />
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '20px 20px 0 20px',
          position: 'sticky',
          top: 0,
          background: '#f9fafb',
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 200, display: 'flex', gap: 12 }}>
            <input
              type="text"
              placeholder="Search products..."
              value={inputValue}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = GREEN)}
              onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
            />
            <button
              onClick={handleSearchClick}
              style={{
                padding: '12px 24px',
                background: GREEN,
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = GREEN_DARK)
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = GREEN)}
            >
              Search
            </button>
          </div>

          {/* Mobile Filter Button */}
          {isMobile && !showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              style={{
                padding: '12px 20px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
              {activeFilters.length > 0 && (
                <span
                  style={{
                    background: GREEN,
                    color: 'white',
                    borderRadius: 10,
                    padding: '2px 6px',
                    fontSize: 11,
                  }}
                >
                  {activeFilters.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 20px 20px 20px',
          display: 'flex',
          gap: 20,
          alignItems: 'flex-start',
        }}
      >
        {/* Desktop Sidebar */}
        {!isMobile && showSidebar && (
          <FilterPanel
            onClose={() => setShowSidebar(false)}
            filters={filters}
            onFilterChange={handleFilterChange}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            categories={categoriesList}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Results Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? 18 : 20,
                  fontWeight: 700,
                  color: '#111827',
                }}
              >
                Search Results{' '}
                <span
                  style={{
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: 400,
                    color: '#9ca3af',
                  }}
                >
                  ({totalProducts} products found)
                </span>
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {['grid', 'list'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border: `1px solid ${viewMode === mode ? GREEN : '#e5e7eb'}`,
                    background:
                      viewMode === mode ? `rgba(26,159,115,0.06)` : 'white',
                    color: viewMode === mode ? GREEN : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {mode === 'grid' ? (
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                Active filters:
              </span>
              {activeFilters.map((f) => (
                <span
                  key={f}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: GREEN,
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '5px 12px',
                    borderRadius: 20,
                  }}
                >
                  {f}
                  <button
                    onClick={() => removeFilter(f)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 14,
                      lineHeight: 1,
                      opacity: 0.8,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Product Grid/List */}
          {products.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 60,
                background: 'white',
                borderRadius: 14,
              }}
            >
              <p style={{ color: '#6b7280', fontSize: 16 }}>
                No products found. Try adjusting your filters.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? 'repeat(auto-fill, minmax(160px, 1fr))'
                  : 'repeat(3, 1fr)',
                gap: isMobile ? 12 : 20,
              }}
            >
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {products.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 14,
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? 12 : 20,
                    padding: 16,
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      '0 4px 16px rgba(0,0,0,0.08)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = 'none')
                  }
                >
                  <div
                    style={{
                      position: 'relative',
                      width: isMobile ? '100%' : 120,
                      height: isMobile ? 160 : 120,
                      flexShrink: 0,
                      background: '#f9fafb',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <Badge text={p.badge} />
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.target.src =
                          'https://placehold.co/120x120/f3f4f6/9ca3af?text=Product';
                      }}
                    />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 12,
                          color: '#9ca3af',
                          margin: '0 0 4px',
                        }}
                      >
                        {p.vendor}
                      </p>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#1f2937',
                          margin: '0 0 8px',
                        }}
                      >
                        {p.name}
                      </h3>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 12,
                      }}
                    >
                      <p
                        style={{
                          color: GREEN,
                          fontWeight: 700,
                          fontSize: 20,
                          margin: 0,
                        }}
                      >
                        ${p.price.toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleViewDetails(p.id)}
                        style={{
                          background: GREEN,
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: 13,
                          padding: '8px 20px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = GREEN_DARK)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = GREEN)
                        }
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-filter-btn {
            display: block !important;
          }
        }
        input[type='range'] {
          -webkit-appearance: none;
          height: 100%;
          cursor: pointer;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${GREEN};
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          margin-top: -6px;
        }
        input[type='range']::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}

// Main export with Layout wrapper
export default function ProductListing() {
  return (
    <Layout>
      <ProductListingContent />
    </Layout>
  );
}