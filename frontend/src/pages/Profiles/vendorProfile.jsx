import { Star, MapPin, Phone, Mail, Shield, CheckCircle, Users, Clock, ChevronRight, PhoneCall, Flag, ShoppingBag, Store, Calendar, Package, Trophy, Award, ExternalLink, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Layouts/Header';
import Footer from '../../components/Layouts/Footer';
import { 
  getMyVendorProfile,
  getVendorProfileById,
  getVendorProducts,
  getVendorRating,
  followVendor,
  unfollowVendor,
  checkFollowStatus,
  reportVendor,
  isAuthenticated,
  getCurrentUser,
} from '../../services/profileServices';

export default function VendorProfile() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  
  const [vendorData, setVendorData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [ratingData, setRatingData] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  // MOCK DATA for journey timeline only (no backend route for this currently)
  const mockData = {
    journey: [
      {
        date: "JANUARY 2022",
        title: "Store Launch",
        description: "Joined the platform and launched first product catalogue with 12 carefully selected items across the audio and accessories categories."
      },
      {
        date: "MARCH 2022",
        title: "First 100 Orders Milestone",
        description: "Reached 100 completed orders with a 97% customer satisfaction rating within just 60 days of launch."
      },
      {
        date: "DECEMBER 2022",
        title: "Premium Vendor Status Awarded",
        description: "Earned the Premium Vendor badge after exceeding all platform performance benchmarks including delivery speed, satisfaction, and return rates."
      },
      {
        date: "JUNE 2023",
        title: "1,000 Orders Completed",
        description: "Crossed 1,000 fulfilled orders with a consistently low return rate of under 0.5%, well below the platform average."
      },
      {
        date: "OCTOBER 2024",
        title: "Top Rated Vendor of the Quarter",
        description: "Named top-rated vendor for Q3 2024 with 156 active products, 2,345 total orders, and a 98% satisfaction rate."
      }
    ],
    verificationBadges: [
      { title: "Identity Verified", description: "Business registered & verified" },
      { title: "Top Rated", description: "Consistently above 4.5★" }
    ],
  };

  // Fetch vendor rating data
  const fetchVendorRating = async (actualVendorId) => {
    try {
      setRatingLoading(true);
      const ratingResponse = await getVendorRating(actualVendorId);
      
      if (ratingResponse.success) {
        setRatingData(ratingResponse);
      } else {
        console.warn('Failed to load rating data:', ratingResponse.message);
        // Set default rating data if fetch fails
        setRatingData({
          success: true,
          averageRating: 0,
          totalReviews: 0,
          ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
      }
    } catch (err) {
      console.error('Error fetching vendor rating:', err);
      setRatingData({
        success: true,
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    } finally {
      setRatingLoading(false);
    }
  };

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let vendorResponse;
        let currentUserId = null;
        
        // Get current logged-in user
        const currentUser = getCurrentUser();
        if (currentUser) {
          currentUserId = currentUser._id || currentUser.id;
        }
        
        // Determine if viewing own profile or another vendor's profile
        if (!vendorId) {
          // No vendorId in URL - show own profile
          console.log('Fetching own vendor profile...');
          vendorResponse = await getMyVendorProfile();
          setIsOwnProfile(true);
        } else {
          // VendorId in URL - check if it's the logged-in vendor's ID
          if (currentUserId && currentUserId === vendorId) {
            setIsOwnProfile(true);
            vendorResponse = await getMyVendorProfile();
          } else {
            setIsOwnProfile(false);
            vendorResponse = await getVendorProfileById(vendorId);
          }
        }
        
        if (!vendorResponse.success || !vendorResponse.data) {
          throw new Error(vendorResponse.message || 'Vendor not found');
        }
        
        const vendor = vendorResponse.data;
        const actualVendorId = vendor._id || vendor.id || vendorId;
        
        if (!actualVendorId) {
          throw new Error('Vendor ID not found in response');
        }
        
        // Fetch products - handle gracefully even if it fails
        try {
          const productsResponse = await getVendorProducts(actualVendorId);
          const productsList = productsResponse.success ? (productsResponse.data || []) : [];
          setProducts(productsList);
        } catch (productsErr) {
          console.warn('Failed to load products, continuing without them:', productsErr);
          setProducts([]);
        }
        
        setVendorData(vendor);
        
        // Fetch vendor rating data
        try {
          await fetchVendorRating(actualVendorId);
        } catch (ratingErr) {
          console.warn('Failed to load ratings, continuing without them:', ratingErr);
          setRatingData({
            success: true,
            averageRating: 0,
            totalReviews: 0,
            ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          });
        }
        
        // Check follow status if user is authenticated and not viewing own profile
        if (isAuthenticated() && !isOwnProfile) {
          try {
            const followStatus = await checkFollowStatus(actualVendorId);
            setIsFollowing(followStatus.isFollowing || false);
          } catch (err) {
            console.warn('Error checking follow status:', err);
          }
        }
        
      } catch (err) {
        console.error('Error fetching vendor data:', err);
        setError(err.message || 'Failed to load vendor profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendorData();
  }, [vendorId]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { returnUrl: `/vendor/${vendorData?._id || vendorId}` } });
      return;
    }
    
    const targetVendorId = vendorData?._id || vendorData?.id || vendorId;
    
    try {
      setIsFollowLoading(true);
      if (isFollowing) {
        const response = await unfollowVendor(targetVendorId);
        if (response.success) {
          setIsFollowing(false);
        } else {
          alert(response.message || 'Failed to unfollow');
        }
      } else {
        const response = await followVendor(targetVendorId);
        if (response.success) {
          setIsFollowing(true);
        } else {
          alert(response.message || 'Failed to follow');
        }
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      alert(err.message || 'Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('Please provide a reason for reporting');
      return;
    }
    
    const targetVendorId = vendorData?._id || vendorData?.id || vendorId;
    
    try {
      setIsReporting(true);
      const response = await reportVendor(targetVendorId, { 
        reason: reportReason,
        description: reportDescription 
      });
      
      if (response.success) {
        alert('Thank you for your report. We will review it shortly.');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
      } else {
        alert(response.message || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Error reporting vendor:', err);
      alert(err.message || 'Failed to submit report');
    } finally {
      setIsReporting(false);
    }
  };

  const handleVisitStore = () => {
    const targetVendorId = vendorData?._id || vendorData?.id || vendorId;
    navigate(`/vendor/${targetVendorId}/products`);
  };

  const handleBrowseProducts = () => {
    const targetVendorId = vendorData?._id || vendorData?.id || vendorId;
    navigate(`/vendor/${targetVendorId}/products`);
  };

  const handleEditProfile = () => {
    navigate('/vendor/edit-profile');
  };

  const handleWebsiteClick = () => {
    const website = vendorData?.website;
    if (website) {
      const url = website.startsWith('http') ? website : `https://${website}`;
      window.open(url, '_blank');
    }
  };

  // Get percentage for rating breakdown
  const getPercentage = (count) => {
    if (!ratingData?.totalReviews) return 0;
    return (count / ratingData.totalReviews) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vendor profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !vendorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <p className="text-red-700 font-semibold mb-2">Unable to Load Profile</p>
              <p className="text-red-600 text-sm mb-4">{error || 'Vendor not found'}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Get vendor name
  const vendorName = vendorData.name || vendorData.fullName || vendorData.username || vendorData.storeName || 'Vendor';
  
  // Get badges
  const badges = vendorData.badges || [];
  const hasTopRatedBadge = badges.includes('Top Rated') || badges.includes('top-rated');
  const hasFastShipperBadge = badges.includes('Fast Shipper') || badges.includes('fast-shipper');

  // Format date
  const joinedDate = vendorData.createdAt || vendorData.joinedDate || vendorData.memberSince;
  const formattedJoinDate = joinedDate ? new Date(joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'January 2022';

  // Get rating data safely
  const averageRating = ratingData?.averageRating || 0;
  const totalReviews = ratingData?.totalReviews || 0;
  const ratingBreakdown = ratingData?.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Report Vendor</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select 
                  value={reportReason} 
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam or Misleading</option>
                  <option value="fraud">Fraudulent Activity</option>
                  <option value="counterfeit">Counterfeit Products</option>
                  <option value="harassment">Harassment or Abuse</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea 
                  value={reportDescription} 
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Please provide additional details..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={isReporting || !reportReason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Vendor Header Section */}
      <div className="bg-teal-500 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Left Section - Vendor Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                {/* Vendor Cart Icon */}
                <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="text-5xl">🛒</span>
                </div>
                
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h1 className="text-3xl font-bold text-white">
                      {vendorName}
                    </h1>
                    {vendorData.isVerified && (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                        <CheckCircle size={12} />
                        Verified Vendor
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-200 mb-3">
                    <span>@{vendorData.username || vendorName.toLowerCase().replace(/\s+/g, '')}</span>
                    <span>•</span>
                    <span>{vendorData.location || vendorData.address || 'Not specified'}</span>
                  </div>
                  
                  {/* Rating - From backend */}
                  <div className="flex items-center gap-2">
                    {ratingLoading ? (
                      <span className="text-gray-300">Loading rating...</span>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <Star size={16} className="fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{totalReviews.toLocaleString()} reviews</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Stats Badges */}
              <div className="flex flex-wrap gap-2 mt-6">
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                  <Package size={14} />
                  {products.length.toLocaleString()} Products
                </span>
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                  <Calendar size={14} />
                  Member since {formattedJoinDate}
                </span>
                {hasTopRatedBadge && (
                  <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-sm">
                    <Trophy size={14} />
                    Top Rated
                  </span>
                )}
                {hasFastShipperBadge && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                    <Shield size={14} />
                    Fast Shipper
                  </span>
                )}
              </div>
            </div>
          </div>
          
        </div>
        
      </div>

      {/* Action Buttons - Aligned to Right */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 ml-250">
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
          >
            <Flag size={16} />
            Report
          </button>
          
          <button
            onClick={handleFollowToggle}
            disabled={isFollowLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition font-medium text-sm ${
              isFollowing
                ? 'border border-teal-500 text-teal-700 bg-teal-50 hover:bg-teal-100'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Users size={16} />
            {isFollowLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
          </button>
          
          <button
            onClick={handleVisitStore}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium text-sm"
          >
            <ShoppingBag size={16} />
            Visit Store
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Performance Card - Real data from backend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Performance</h2>
              <div className=" space-y-3 grid-cols-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Products</span>
                  <span className="font-semibold text-gray-900">{products.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Avg Rating</span>
                  <span className="font-semibold text-gray-900">
                    {ratingLoading ? '...' : averageRating.toFixed(1)} / 5
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Reviews</span>
                  <span className="font-semibold text-gray-900">{totalReviews.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Satisfaction Rate</span>
                  <span className="font-semibold text-green-600">
                    {ratingLoading ? '...' : totalReviews > 0 ? '98%' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information Card - Real data from backend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Member Since</p>
                  <p className="text-gray-900 font-medium">{formattedJoinDate}</p>
                </div>
                <hr className="border-gray-100" />
                
                {vendorData.website && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Website</p>
                      <button 
                        onClick={handleWebsiteClick}
                        className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1"
                      >
                        {vendorData.website}
                        <ExternalLink size={12} />
                      </button>
                    </div>
                    <hr className="border-gray-100" />
                  </>
                )}
                
                {vendorData.email && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                      <a href={`mailto:${vendorData.email}`} className="text-teal-600 hover:text-teal-700 font-medium text-sm">
                        {vendorData.email}
                      </a>
                    </div>
                    <hr className="border-gray-100" />
                  </>
                )}
                
                {vendorData.phone && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                      <a href={`tel:${vendorData.phone}`} className="text-teal-600 hover:text-teal-700 font-medium text-sm">
                        {vendorData.phone}
                      </a>
                    </div>
                    <hr className="border-gray-100" />
                  </>
                )}
                
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-gray-700 text-sm">{vendorData.location || vendorData.address || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Rating Breakdown Card - From backend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Rating Breakdown</h2>
              
              {ratingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading ratings...</p>
                </div>
              ) : totalReviews > 0 ? (
                <>
                  {/* Overall Rating */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={18} className={i < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{totalReviews.toLocaleString()} total reviews</p>
                  </div>
                  
                  {/* Rating Bars */}
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingBreakdown[star] || 0;
                      const percentage = getPercentage(count);
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700 w-8">{star}★</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-yellow-400 h-full rounded-full transition-all" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No reviews yet</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* About Section - Real data from backend */}
            {(vendorData.about || vendorData.description || vendorData.bio) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About {vendorName}</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {vendorData.about || vendorData.description || vendorData.bio}
                </div>
              </div>
            )}

            {/* Trust & Verification Section - Mock data */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Trust & Verification</h2>
              <p className="text-sm text-gray-500 mb-6">Platform verified credentials</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mockData.verificationBadges.map((badge, index) => (
                  <div key={index} className={`border-l-4 ${index === 0 ? 'border-green-500' : 'border-yellow-500'} pl-4 py-2`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{badge.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
                      </div>
                      {index === 0 ? (
                        <CheckCircle size={20} className="text-green-500 shrink-0" />
                      ) : (
                        <Trophy size={20} className="text-yellow-500 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor Journey Section - Mock data (no backend route currently) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Vendor Journey</h2>
              <p className="text-sm text-gray-500 mb-6">Key milestones since joining</p>
              
              <div className="space-y-8">
                {mockData.journey.map((milestone, index) => (
                  <div key={index} className="relative pl-8 pb-8 last:pb-0">
                    {/* Timeline line */}
                    {index !== mockData.journey.length - 1 && (
                      <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200" />
                    )}
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-teal-600 rounded-full" />
                    </div>
                    {/* Content */}
                    <div>
                      <p className="text-sm font-semibold text-teal-600 tracking-wide">
                        {milestone.date}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">{milestone.title}</h3>
                      <p className="text-gray-600 text-sm mt-2 leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Browse Products CTA */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-8 border border-teal-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-teal-800 mb-1">Ready to explore {vendorName}?</h3>
                  <p className="text-teal-600">{products.length.toLocaleString()} products available with fast shipping</p>
                </div>
                <button
                  onClick={handleBrowseProducts}
                  className="bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition inline-flex items-center gap-2 self-start sm:self-auto"
                >
                  <span>Browse Products</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}