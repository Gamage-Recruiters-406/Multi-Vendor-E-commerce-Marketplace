// src/services/ProductListingService.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_VERSION || '/api/v1'}`
  : 'http://localhost:5000/api/v1';

class ProductListingService {
  constructor() {
    this.token = null;
  }

  // Set auth token for requests
  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Get auth token from localStorage
  getAuthToken() {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }
    return this.token;
  }

  // Get headers with authentication
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Add filter parameters
      if (filters.keyword && filters.keyword.trim()) {
        queryParams.append('keyword', filters.keyword);
      }
      if (filters.category) {
        queryParams.append('category', filters.category);
      }
      if (filters.store) {
        queryParams.append('store', filters.store);
      }
      if (filters.minPrice !== undefined && filters.minPrice !== null) {
        queryParams.append('minPrice', filters.minPrice);
      }
      if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
        queryParams.append('maxPrice', filters.maxPrice);
      }
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        queryParams.append('sortOrder', filters.sortOrder);
      }
      if (filters.page) {
        queryParams.append('page', filters.page);
      }
      if (filters.limit) {
        queryParams.append('limit', filters.limit);
      }

      const url = `${API_BASE_URL}/product${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      console.log('Fetching products from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch products');
      }

      const result = await response.json();

      // Transform backend response to frontend format
      return this.transformProductsResponse(result);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async getProductById(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/product/${productId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch product');
      }

      const result = await response.json();

      return this.transformSingleProduct(result.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  transformProductsResponse(response) {
    if (!response.success) {
      return { products: [], count: 0 };
    }

    return {
      success: response.success,
      count: response.count || (response.data ? response.data.length : 0),
      products: response.data
        ? response.data.map((p) => this.transformSingleProduct(p))
        : [],
    };
  }

  transformSingleProduct(product) {
    if (!product) return null;

    return {
      id: product._id,
      name: product.name,
      description: product.description || '',
      vendor: product.store?.name || 'Unknown Store',
      vendorId: product.store?._id || product.store,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      rating: product.rating || 0,
      reviews: product.reviewsCount || 0,
      category: product.category?.name || 'Uncategorized',
      categoryId: product.category?._id || product.category,
      badge: this.getProductBadge(product),
      image:
        product.images && product.images.length > 0
          ? product.images[0]
          : 'https://placehold.co/300x220/f3f4f6/9ca3af?text=Product',
      images: product.images || [],
      stock: product.stock || 0,
      inStock: (product.stock || 0) > 0 && product.status === 'active',
      status: product.status,
      attributes: product.attributes || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  getProductBadge(product) {
    // Check if product is new (created within last 7 days)
    if (product.createdAt) {
      const createdDate = new Date(product.createdAt);
      const now = new Date();
      const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);

      if (daysDiff <= 7) {
        return 'New';
      }
    }

    // Check if product is on sale (original price greater than current price)
    if (product.originalPrice && product.price < product.originalPrice) {
      return 'Sale';
    }

    return null;
  }
}

// Create and export a singleton instance
const productListingService = new ProductListingService();

export default productListingService;
export { ProductListingService };