import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/Layouts/AdminLayout';

import { FiTrash2 } from 'react-icons/fi';
import { BiSearch } from 'react-icons/bi';

const normalizeUrlPart = (value = '') => value.replace(/\/+$/g, '');
const ensureLeadingSlash = (value = '') => (value.startsWith('/') ? value : `/${value}`);
const API_BASE_URL = normalizeUrlPart(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const API_VERSION = ensureLeadingSlash(import.meta.env.VITE_API_VERSION || '/api/v1');
const API_URL = `${API_BASE_URL}${API_VERSION}`;

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState('Products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [productCount, setProductCount] = useState(0);

    const flattenedCategories = useMemo(() => {
        const flatten = (nodes, result = []) => {
            nodes.forEach((node) => {
                result.push(node);
                if (node.children && node.children.length > 0) {
                    flatten(node.children, result);
                }
            });
            return result;
        };

        return flatten(categories, []);
    }, [categories]);

    const filteredProducts = useMemo(() => {
        if (selectedStatus === 'All') return products;
        return products.filter((product) =>
            (product.status || 'active').toLowerCase() === selectedStatus.toLowerCase()
        );
    }, [products, selectedStatus]);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const res = await axios.get(`${API_URL}/category`);
            setCategories(res.data?.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const params = {};
            const keyword = searchTerm.trim();
            if (keyword) params.keyword = keyword;
            if (selectedCategoryId) params.category = selectedCategoryId;

            const res = await axios.get(`${API_URL}/product`, { params });
            const data = res.data?.data || [];
            setProducts(data);
            setProductCount(res.data?.count ?? data.length);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!productId) return;

        const confirmed = window.confirm('Delete this product?');
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.delete(`${API_URL}/product/${productId}`, {
                headers,
                withCredentials: true,
            });

            toast.success('Product deleted');
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error(error.response?.data?.message || 'Failed to delete product');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchTerm, selectedCategoryId]);

  return (
    <AdminLayout>
      <div className="font-sans text-gray-800 bg-gray-50 min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-teal-600 mb-1">Product & Category Management</h1>
              <p className="text-sm text-gray-500">Admin • Platform oversight</p>
            </div>
                        <div className="flex space-x-4 md:space-x-6 text-sm text-gray-500 text-center w-full sm:w-auto overflow-x-auto scrollbar-hide">
                            <div className="flex-shrink-0">
                                <div className="uppercase text-[10px] md:text-xs tracking-wide">Total Products</div>
                                <div className="text-xl md:text-2xl font-bold text-teal-600">
                                    {loadingProducts ? '...' : productCount}
                                </div>
                            </div>
                            <div className="border-l pl-4 md:pl-6 flex-shrink-0">
                                <div className="uppercase text-[10px] md:text-xs tracking-wide">Categories</div>
                                <div className="text-xl md:text-2xl font-bold text-teal-600">
                                    {loadingCategories ? '...' : flattenedCategories.length}
                                </div>
                            </div>
                        </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0 gap-4">
          <div className="flex bg-white rounded-full p-1 border border-gray-200 w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('Products')}
              className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'Products' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('Categories')}
              className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'Categories' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Categories
            </button>
          </div>

                    <div className="relative w-full lg:max-w-md text-gray-400">
                        <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search product name, ID or vendor..." 
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-teal-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                        />
                    </div>

                    {activeTab === 'Products' && (
                        <div className="flex items-center space-x-2 text-[10px] md:text-sm text-gray-500 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
                            <span className="font-semibold uppercase text-[10px] whitespace-nowrap">Categories:</span>
                            <span
                                onClick={() => setSelectedCategoryId('')}
                                className={`px-3 py-1 rounded-full cursor-pointer whitespace-nowrap border transition-colors ${
                                    selectedCategoryId === ''
                                        ? 'border-teal-500 text-teal-600 bg-teal-50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                All
                            </span>
                            {loadingCategories && (
                                <span className="px-3 py-1 border border-gray-200 rounded-full text-gray-400 whitespace-nowrap">
                                    Loading...
                                </span>
                            )}
                            {!loadingCategories && flattenedCategories.length === 0 && (
                                <span className="px-3 py-1 border border-gray-200 rounded-full text-gray-400 whitespace-nowrap">
                                    No Categories
                                </span>
                            )}
                            {flattenedCategories.map((category) => (
                                <span
                                    key={category._id}
                                    onClick={() => setSelectedCategoryId(category._id)}
                                    className={`px-3 py-1 rounded-full cursor-pointer whitespace-nowrap border transition-colors ${
                                        selectedCategoryId === category._id
                                            ? 'border-teal-500 text-teal-600 bg-teal-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {category.name}
                                </span>
                            ))}
                        </div>
                    )}
        </div>

                {activeTab === 'Products' && (
                    <div className="flex items-center space-x-2 text-[10px] md:text-sm text-gray-500 mb-6 overflow-x-auto w-full pb-2 scrollbar-hide uppercase">
                        <span className="font-semibold text-[10px] whitespace-nowrap">Status:</span>
                        {['All', 'Active', 'Inactive'].map((status) => (
                            <span
                                key={status}
                                onClick={() => setSelectedStatus(status)}
                                className={`px-4 py-1 rounded-full cursor-pointer whitespace-nowrap border transition-colors ${
                                    selectedStatus === status
                                        ? 'bg-teal-600 text-white border-teal-600'
                                        : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {status}
                            </span>
                        ))}
                    </div>
                )}

        <div className="w-full pb-4">
            <div className="w-full">
                {/* Desktop Header */}
                <div className="hidden lg:grid grid-cols-[2.5fr_1.5fr_1fr_1fr_0.8fr_0.8fr_0.8fr_0.5fr] gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 py-3 mb-4 px-4">
                    <div>Product / ID</div>
                    <div>Vendor</div>
                    <div>Category</div>
                    <div>Price</div>
                    <div className="text-center">Stock</div>
                    <div className="text-center">Variants</div>
                    <div className="text-center">Status</div>
                    <div className="text-right">Actions</div>
                </div>

                                <div className="space-y-4">
                                        {loadingProducts && (
                                            <div className="text-sm text-gray-400 px-4">Loading products...</div>
                                        )}
                                        {!loadingProducts && filteredProducts.length === 0 && (
                                            <div className="text-sm text-gray-400 px-4">No products found.</div>
                                        )}
                                        {!loadingProducts && filteredProducts.map((product) => {
                                            const statusValue = (product.status || 'active').toLowerCase();
                                            const isActive = statusValue === 'active';
                                            const isOutOfStock = Number(product.stock) <= 0;
                                            const productId = product._id || '';
                                            const productIdShort = productId ? productId.slice(-8).toUpperCase() : 'N/A';
                                            const productImage = product.images && product.images.length > 0 ? product.images[0] : null;

                                            return (
                                                <div
                                                    key={product._id}
                                                    className={`flex flex-col lg:grid lg:grid-cols-[2.5fr_1.5fr_1fr_1fr_0.8fr_0.8fr_0.8fr_0.5fr] gap-3 lg:gap-4 items-start lg:items-center rounded-lg p-4 bg-white shadow-sm transition-all relative ${
                                                        isActive
                                                            ? 'border border-teal-500 hover:border-teal-600'
                                                            : 'border border-gray-100 hover:border-teal-600 opacity-80'
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-3 w-full lg:w-auto">
                                                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                {productImage ? (
                                                                    <img
                                                                        src={productImage}
                                                                        alt={product.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 bg-gray-300 rounded-sm"></div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                    <div className="font-bold text-[#20a082] text-sm hover:underline cursor-pointer truncate">
                                                                        {product.name || 'Untitled Product'}
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-400 font-medium">ID: #{productIdShort}</div>
                                                            </div>
                                                            <div className="lg:hidden absolute top-4 right-4">
                                                                 <button
                                                                     onClick={() => handleDeleteProduct(product._id)}
                                                                     className="text-red-400 hover:text-red-600 transition-colors p-1"
                                                                 >
                                                                        <FiTrash2 className="w-4 h-4" />
                                                                 </button>
                                                            </div>
                                                    </div>
                          
                                                    <div className="flex justify-between w-full lg:w-auto items-center mt-2 lg:mt-0">
                                                         <span className="lg:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vendor</span>
                                                         <div className="text-sm text-gray-700 font-medium truncate">
                                                             {product.store?.name || 'Unknown Vendor'}
                                                         </div>
                                                    </div>
                          
                                                    <div className="flex justify-between w-full lg:w-auto items-center">
                                                         <span className="lg:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">Category</span>
                                                         <div>
                                                                 <span className="text-[9px] border border-gray-400 rounded-full px-3 py-1 uppercase tracking-wider text-gray-600 font-bold whitespace-nowrap">
                                                                     {product.category?.name || 'Uncategorized'}
                                                                 </span>
                                                         </div>
                                                    </div>
                          
                                                    <div className="flex justify-between w-full lg:w-auto items-center">
                                                         <span className="lg:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">Price</span>
                                                         <div className="font-bold text-[#20a082] text-sm lg:text-base">
                                                             ${Number(product.price || 0).toFixed(2)}
                                                         </div>
                                                    </div>
                          
                                                    <div className="grid grid-cols-3 gap-2 w-full lg:w-auto lg:contents mt-3 lg:mt-0 pt-3 lg:pt-0 border-t border-gray-100 lg:border-t-0">
                                                         <div className="flex flex-col lg:block items-center justify-center">
                                                                 <span className="lg:hidden text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Stock</span>
                                                                 <div
                                                                     className={`text-center font-bold text-sm ${
                                                                         isOutOfStock ? 'text-rose-500 uppercase italic tracking-tighter' : 'text-gray-700'
                                                                     }`}
                                                                 >
                                                                     {isOutOfStock ? 'Out' : product.stock ?? 0}
                                                                 </div>
                                                         </div>
                                                         <div className="flex flex-col lg:block items-center justify-center">
                                                                 <span className="lg:hidden text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Variants</span>
                                                                 <div className="text-center text-gray-400 font-bold text-sm">
                                                                     {product.attributes?.length || 0}
                                                                 </div>
                                                         </div>
                                                         <div className="flex flex-col lg:block items-center justify-center">
                                                                 <span className="lg:hidden text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Status</span>
                                                                 <div className="text-center">
                                                                         <span
                                                                             className={`text-[10px] font-black uppercase tracking-tighter ${
                                                                                 isActive
                                                                                     ? 'text-[#20a082]'
                                                                                     : 'text-rose-300 bg-rose-50 px-2 py-0.5 rounded'
                                                                             }`}
                                                                         >
                                                                             {statusValue}
                                                                         </span>
                                                                 </div>
                                                         </div>
                                                    </div>
                          
                                                    <div className="hidden lg:flex text-right justify-end">
                                                         <button
                                                             onClick={() => handleDeleteProduct(product._id)}
                                                             className="text-red-400 hover:text-red-600 transition-colors p-1"
                                                         >
                                                                <FiTrash2 className="w-4 h-4" />
                                                         </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>

                <div className="mt-8 md:mt-12 flex justify-between lg:justify-end items-center space-x-4 md:space-x-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4 border-t border-gray-200 lg:border-t-0 pt-4 lg:pt-0 bg-white lg:bg-transparent rounded-lg lg:rounded-none py-2 lg:py-0 w-full">
                    <span className="cursor-pointer hover:text-teal-600 transition-colors">Previous</span>
                    <span className="w-7 h-7 flex items-center justify-center bg-[#20a082] text-white rounded-md shadow-lg shadow-teal-100">1</span>
                    <span className="cursor-pointer hover:text-teal-600 transition-colors">Next</span>
                </div>
            </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductManagement;
