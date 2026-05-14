import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle2, ShieldAlert, Image as ImageIcon, 
  Send, Star, Upload, X, Check, Store
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Layouts/Header';
import Footer from '../../components/Layouts/Footer';
import toast from 'react-hot-toast';

const ProductCreate = () => {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    store: storeId || '',
    category: '',
    images: [],
    attributes: {
      isPremium: false,
      sendEmail: false,
      showOnBanner: false
    }
  });

  const [storeName, setStoreName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const [createdProductId, setCreatedProductId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);

  const [myStores, setMyStores] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(storeId || '');


  useEffect(() => {
    const fetchStoreDetails = async () => {
      if (!storeId) return;
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/v1/store/${storeId}`);
        const result = await response.json();
        if (result.success) {
          setStoreName(result.data.name);
        }
      } catch (error) {
        console.error("Failed to fetch store details", error);
      }
    };

    fetchStoreDetails();

    const fetchMyStores = async () => {
      if (storeId) return;
      setIsLoadingStores(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const response = await fetch(`${baseUrl}/api/v1/store/my-stores`, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        const result = await response.json();
        if (result.success) {
          setMyStores(result.data);
          // If only one store, select it automatically
          if (result.data.length === 1) {
            const onlyStore = result.data[0];
            setSelectedStoreId(onlyStore._id);
            setStoreName(onlyStore.name);
            setFormData(prev => ({ ...prev, store: onlyStore._id }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch stores", error);
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchMyStores();

    const fetchCategories = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/v1/category`);
        // console.log("Category response:", response);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        try {
           const result = JSON.parse(text);
           if (result.success) setCategories(result.data);
        } catch(e) { console.error("Not a valid JSON response."); }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        setIsLoadingCats(false);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (key) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: !prev.attributes[key]
      }
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.title || !formData.price || !formData.category || !formData.store) {
      toast.error("Name, Price, Category, and Store are required.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('stock', formData.stock);
      data.append('store', formData.store);
      
      formData.images.forEach(file => data.append('images', file));

      // Typically auth tokens are placed in localStorage
      const token = localStorage.getItem('token'); 

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/product`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: data // let the browser automatically set the correct boundary for multipart/form-data
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Listing published successfully!");
        console.log("Success result:", result.data);
        // Navigate back to the store view
        if (formData.store) {
          navigate(`/vendor/products?storeId=${formData.store}`);
        }
      } else {
        toast.error(`Failed to publish: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
       console.error("Submission error:", error);
       toast.error("An error occurred while publishing the listing.");
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!formData.title || !formData.price || !formData.category || !formData.store) {
      toast.error("Name, Price, Category, and Store are required.");
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const data = new FormData();
      data.append('name', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('stock', formData.stock);
      data.append('store', formData.store);
      formData.images.forEach(file => data.append('images', file));

      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

      const productResponse = await fetch(`${baseUrl}/api/v1/product`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: data
      });

      const productResult = await productResponse.json();

      if (!productResponse.ok || !productResult.success) {
        toast.error(`Failed to create product: ${productResult.message || 'Unknown error'}`);
        return;
      }

      const newProductId = productResult.data._id;
      setCreatedProductId(newProductId);
      toast.success("Product created! Generating product questions...");

      const faqResponse = await fetch(`${baseUrl}/api/v1/chatbot/faq/generate-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ productId: newProductId })
      });

      const faqResult = await faqResponse.json();

      if (faqResult.success) {
        setGeneratedQuestions(faqResult.questions);
        setQuestionsGenerated(true);
        toast.success("Questions generated successfully! You can now publish.");
      } else {
        toast.error(`Failed to generate questions: ${faqResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("An error occurred while generating questions.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 160;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      <Header userRole="Vendor" />
      
      {/* Header Area */}
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center text-sm text-slate-500 font-medium mb-4">
              <span className="hover:text-slate-800 cursor-pointer transition-colors">Products</span>
              <span className="mx-2">›</span>
              <span className="text-slate-800">Add New Product</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Add New Product</h1>
            <p className="text-slate-500 mt-2 text-sm">Fill in the details below to publish your product to the marketplace.</p>
          </div>
          <button 
            onClick={() => navigate('/vendor/products')}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 transition-colors shadow-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to List</span>
          </button>
        </div>
      </header>

      {/* Sticky Stepper Navigation */}
      <div className="sticky top-0 z-40 bg-[#f8fafc]/95 backdrop-blur-md pt-4 pb-6 mb-8 border-b border-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center space-x-4 z-10 w-full justify-between">
            <div 
              onClick={() => scrollToSection('section-basic-details')}
              className="flex items-center space-x-3 w-1/4 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">1</div>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Basic Details</p>
                <p className="text-xs text-slate-500">Title & description</p>
              </div>
            </div>
            <div className="w-12 h-px bg-slate-200 mx-2 hidden md:block flex-grow"></div>
            
            <div 
              onClick={() => scrollToSection('section-media-pricing')}
              className="flex items-center space-x-3 w-1/4 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold group-hover:bg-slate-200 transition-colors">2</div>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Media & Pricing</p>
                <p className="text-xs text-slate-500">Images & cost</p>
              </div>
            </div>
            <div className="w-12 h-px bg-slate-200 mx-2 hidden md:block flex-grow"></div>

            <div 
              onClick={() => scrollToSection('section-organization')}
              className="flex items-center space-x-3 w-1/4 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold group-hover:bg-slate-200 transition-colors">3</div>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Organization</p>
                <p className="text-xs text-slate-500">Category & tags</p>
              </div>
            </div>
            <div className="w-12 h-px bg-slate-200 mx-2 hidden md:block flex-grow"></div>

            <div 
              onClick={() => scrollToSection('section-priority')}
              className="flex items-center space-x-3 w-1/4 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold group-hover:bg-slate-200 transition-colors">4</div>
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Priority & Visibility</p>
                <p className="text-xs text-slate-500">Placement settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section: Product Details */}
          <div id="section-basic-details" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Product Details</h2>
                  <p className="text-sm text-slate-500 mt-1">Write a clear, informative description for your product</p>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">Step 1 of 4</span>
              </div>

              {/* Store Display / Selection Section */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">
                        {storeId ? 'Adding Product To' : 'Select Destination Store'}
                      </p>
                      <p className="text-base font-bold text-slate-900">{storeName || (storeId ? 'Loading Store...' : 'Please choose a store')}</p>
                    </div>
                  </div>
                  {storeId && (
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Verified Store</span>
                    </div>
                  )}
                </div>

                {!storeId && (
                  <div className="pt-2 border-t border-emerald-100/50">
                    {isLoadingStores ? (
                      <p className="text-xs text-slate-400 animate-pulse">Fetching your stores...</p>
                    ) : myStores.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {myStores.map(store => (
                          <button
                            key={store._id}
                            type="button"
                            onClick={() => {
                              setSelectedStoreId(store._id);
                              setStoreName(store.name);
                              setFormData(prev => ({ ...prev, store: store._id }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              selectedStoreId === store._id
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            {store.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-600 flex items-center space-x-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        <ShieldAlert className="w-3 h-3" />
                        <span>No stores found. Please <a href="/vendor/create-store" className="underline font-bold">create a store</a> first.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Title <span className="text-rose-500">*</span></label>
                <input 
                  type="text"
                  name="title"
                  maxLength={80}
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm placeholder:text-slate-300"
                  placeholder="e.g. Wireless Noise-Canceling Headphones"
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center text-xs text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-400" /> Keep titles under 80 characters for best display results
                  </div>
                  <span className="text-xs font-medium text-slate-400">{formData.title.length} / 80</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Description <span className="text-rose-500">*</span></label>
                <textarea 
                  name="description"
                  maxLength={500}
                  rows={5}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm placeholder:text-slate-300 resize-none"
                  placeholder="Write a detailed, clear description. Include all relevant information buyers need - features, dimensions, materials, etc."
                ></textarea>
                <div className="flex justify-end mt-2">
                  <span className="text-xs font-medium text-slate-400">{formData.description.length} / 500</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Media & Pricing */}
          <div id="section-media-pricing" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">Media & Pricing</h2>
                <p className="text-sm text-slate-500 mt-1">Add images and set your price and inventory</p>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Product Images (Replacing URL with slick File Upload area) */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Product Images</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center relative cursor-pointer group">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                </div>

                {formData.images.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    {formData.images.map((file, i) => (
                      <div key={i} className="relative group w-24 h-24 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Base Price <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-medium">$</span>
                    </div>
                    <input 
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm placeholder:text-slate-300"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Stock Quantity <span className="text-rose-500">*</span></label>
                  <input 
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm placeholder:text-slate-300"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Organization */}
          <div id="section-organization" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">Organization</h2>
                <p className="text-sm text-slate-500 mt-1">Categorize your product for better discoverability</p>
            </div>
            
            <div className="p-8 space-y-8">


               {/* Category Selection */}
               <div>
                 <label className="block text-sm font-semibold text-slate-900 mb-4">Category <span className="text-rose-500">*</span></label>
               {isLoadingCats ? (
                 <div className="text-sm text-slate-500 py-4">Loading categories...</div>
               ) : (
                 <div className="space-y-6">
                    {categories.map((mainCat) => (
                      <div key={mainCat._id} className="space-y-3">
                        <div className="font-bold text-slate-800 border-b border-slate-100 pb-2">{mainCat.name}</div>
                        {mainCat.children && mainCat.children.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-4 border-l-2 border-emerald-100">
                            {mainCat.children.map((subCat) => (
                              <label 
                                key={subCat._id} 
                                onClick={() => setFormData(prev => ({ ...prev, category: subCat._id }))}
                                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                  formData.category === subCat._id 
                                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-md' 
                                    : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  formData.category === subCat._id ? 'border-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {formData.category === subCat._id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <span className="font-medium text-sm">{subCat.name}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <label 
                            onClick={() => setFormData(prev => ({ ...prev, category: mainCat._id }))}
                            className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all w-full md:w-1/2 lg:w-1/3 ${
                                formData.category === mainCat._id 
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-md' 
                                : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                formData.category === mainCat._id ? 'border-white' : 'border-slate-300 bg-white'
                            }`}>
                                {formData.category === mainCat._id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <span className="font-medium text-sm">{mainCat.name}</span>
                          </label>
                        )}
                      </div>
                    ))}
                 </div>
               )}
               </div>
            </div>
          </div>

          {/* Section: Priority & Visibility */}
          <div id="section-priority" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Priority & Visibility</h2>
              <p className="text-sm text-slate-500 mt-1">Control how prominently this product is displayed</p>
            </div>

            <div className="p-8 space-y-6">
              
              {/* Premium Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex space-x-4 items-start">
                  <div className="bg-amber-100 text-amber-600 p-2.5 rounded-full flex-shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Feature as Premium</p>
                    <p className="text-xs text-slate-500 mt-0.5">Displayed at the top with a highlighted border - use sparingly</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); handleToggle('isPremium'); }}
                  className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center shadow-inner ${
                    formData.attributes.isPremium ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    formData.attributes.isPremium ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              {/* Email Notif Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex space-x-4 items-start">
                  <div className="bg-blue-100 text-blue-600 p-2.5 rounded-full flex-shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Send Email Notification</p>
                    <p className="text-xs text-slate-500 mt-0.5">Push to users' registered email addresses</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); handleToggle('sendEmail'); }}
                  className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center shadow-inner ${
                    formData.attributes.sendEmail ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    formData.attributes.sendEmail ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              {/* Homepage Banner Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex space-x-4 items-start">
                  <div className="bg-purple-100 text-purple-600 p-2.5 rounded-full flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Show on Homepage Banner</p>
                    <p className="text-xs text-slate-500 mt-0.5">Display in the platform homepage featured banner</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); handleToggle('showOnBanner'); }}
                  className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center shadow-inner ${
                    formData.attributes.showOnBanner ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    formData.attributes.showOnBanner ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

            </div>
          </div>

          {/* Section: Generated Questions */}
          {generatedQuestions.length > 0 && (
            <div id="section-questions" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">Generated Product Questions</h2>
                <p className="text-sm text-slate-500 mt-1">AI-generated FAQs to help customers learn about your product</p>
              </div>
              <div className="p-8 space-y-4">
                {generatedQuestions.map((q, index) => (
                  <div key={q._id || index} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{q.question}</p>
                        <p className="text-sm text-slate-600 mt-1">{q.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          
          {/* Writing Tips Widget */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3 className="font-bold text-slate-900">Writing Tips</h3>
            </div>
            
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm text-slate-600 leading-relaxed">Keep titles under 60 characters for best display on mobile devices</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm text-slate-600 leading-relaxed">Include specific dimensions and materials for physical products</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm text-slate-600 leading-relaxed">Always add high-quality images with clean backgrounds</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm text-slate-600 leading-relaxed">Use the "Feature as Premium" flag sparingly - overuse reduces its effectiveness</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm text-slate-600 leading-relaxed">Start the description with the most critical information first</span>
              </li>
            </ul>
          </div>

          {/* Content Guidelines Widget */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-amber-50 text-amber-500 p-2 rounded-xl">
                 <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900">Content Guidelines</h3>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-slate-600">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3"></span>
                 No personal data or private info
              </li>
              <li className="flex items-center text-sm text-slate-600">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3"></span>
                 Accurate pricing and stock levels
              </li>
              <li className="flex items-center text-sm text-slate-600">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3"></span>
                 Plain language, no jargon
              </li>
              <li className="flex items-center text-sm text-slate-600">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3"></span>
                 Images must be pre-approved
              </li>
              <li className="flex items-center text-sm text-slate-600">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3"></span>
                 Verified before publishing to all users
              </li>
            </ul>
          </div>

        </div>
      </main>

      {/* Bottom Action Bar (Non-overlay) */}
      <div className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col-reverse sm:flex-row-reverse justify-between items-center sm:justify-start gap-4 mb-safe pb-safe">
            <button 
              onClick={() => {
                if (questionsGenerated && createdProductId) {
                  navigate('/vendor/products');
                }
              }}
              disabled={!questionsGenerated}
              className={`flex items-center justify-center space-x-2 px-10 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 w-full sm:w-auto ${
                questionsGenerated
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{questionsGenerated ? 'Publish Now' : 'Generate Questions First'}</span>
            </button>

            <button 
              onClick={handleGenerateQuestions}
              disabled={isGeneratingQuestions || questionsGenerated}
              className={`flex items-center justify-center space-x-2 px-10 py-4 rounded-xl font-bold transition-all w-full sm:w-auto ${
                isGeneratingQuestions
                  ? 'bg-blue-200 text-blue-400 cursor-not-allowed'
                  : questionsGenerated
                    ? 'bg-emerald-100 text-emerald-600 cursor-not-allowed border border-emerald-200'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {isGeneratingQuestions ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Generating...</span>
                </>
              ) : questionsGenerated ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Generated</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4" />
                  <span>Generate Questions</span>
                </>
              )}
            </button>

            <button 
              onClick={() => navigate('/vendor/products')}
              className="flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-slate-600 px-10 py-4 rounded-xl font-bold transition-all border border-slate-200 hover:border-slate-300 w-full sm:w-auto"
            >
              <X className="w-4 h-4" />
              <span>Discard</span>
            </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductCreate;
