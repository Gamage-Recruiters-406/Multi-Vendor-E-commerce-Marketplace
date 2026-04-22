import { Star, MapPin, Phone, Mail, Trophy, Shield, CheckCircle, Users, Clock, TrendingUp, ChevronRight, PhoneCall, MailCheck, ReceiptPoundSterling, Activity, ListStartIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Header from '../../components/Layouts/Header';
import Footer from '../../components/Layouts/Footer';
import { getVendorProfile, getToken } from '../../services/profileServices';
import { showToast } from '../../utils/toast';

export default function VendorProfile() {
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const token = getToken();
        if (!token) {
          throw new Error('You must be logged in as a vendor to view this profile');
        }
        
        console.log('📝 Token found, fetching vendor profile...');
        
        const response = await getVendorProfile();
        
        // Log response for debugging
        console.log('Vendor Profile Response:', response);
        
        // Extract vendor/user data from response
        const vendorDataFetched = response.user || response.vendor || response;
        
        if (!vendorDataFetched) {
          throw new Error('No vendor data received from server. Please ensure you are logged in as a vendor.');
        }
        
        // Check if user has vendor role
        if (vendorDataFetched.role && vendorDataFetched.role !== 'Vendor') {
          throw new Error(`This profile is only accessible to vendors. Your role: ${vendorDataFetched.role}`);
        }
        
        setVendorData(vendorDataFetched);
        setError(null);
      } catch (err) {
        console.error('Error fetching vendor profile:', err);
        setError(err.message);
        showToast('error', err.message || 'Failed to load vendor profile');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header userRole="Vendor" />
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

  if (error && !vendorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header userRole="Vendor" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <p className="text-red-700 font-semibold mb-2">⚠️ Unable to Load Profile</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <div className="bg-red-100 rounded p-3 text-sm text-red-700 mb-4 font-mono break-words">
                {error}
              </div>
              <p className="text-gray-600 text-xs mb-4">
                Check your browser console for more details (press F12)
              </p>
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

  if (!vendorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header userRole="Vendor" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">No vendor data available</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const performanceMetrics = [
    {
      label: 'Followers',
      value: vendorData.followers ?? 0,
      icon: Users,
      color: 'bg-blue-50'
    },
    {
      label: 'Rating',
      value: vendorData.rating ?? 0,
      unit: '/ 5',
      icon: Star,
      color: 'bg-yellow-50'
    },
    {
      label: 'Products',
      value: (vendorData.products ?? 0).toLocaleString(),
      icon: TrendingUp,
      color: 'bg-green-50'
    },
    {
      label: 'Satisfaction Rate',
      value: (vendorData.satisfactionRate ?? 0) + '%',
      icon: CheckCircle,
      color: 'bg-emerald-50'
    }
  ];

  const verificationBadges = (vendorData.badges && Array.isArray(vendorData.badges)) 
    ? vendorData.badges.map(badge => ({
        title: typeof badge === 'string' ? badge : badge.title || 'Badge',
        date: badge.date || 'Verified'
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header userRole="Vendor" />
      
      {/* Header with Vendor Info Card */}
      <div className=" bg-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
          <div className="flex items-start justify-between gap-8 ">
            {/* Left Side - Vendor Info */}
            <div className="flex items-start space-x-4 flex-1  mt-9">
              {/* Vendor Logo */}
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shrink-0 mt-6">
                <span className="text-3xl font-bold text-teal-600">🛒</span>
              </div>
              
              {/* Vendor Info */}
              <div className="flex-1 pt-2">
                <div className="flex items-center space-x-3 mb-1">
                  <h1 className="text-3xl font-bold">{vendorData.name}</h1>
                </div>
                
                <div className="flex items-center space-x-2 text-sm mb-3">
                  <span>@{vendorData.name?.toLowerCase().replace(/\s+/g, '')} • {vendorData.location?.split(',')[0]} •</span>
                  {vendorData.isVerified && (
                    <span className="inline-flex items-center space-x-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      <span>✓ Verified Vendor</span>
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2 mt-6 mb-4">
                  <div className="flex space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" className="text-yellow-300" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">{vendorData.rating ?? 0} out of 5 • {(vendorData.reviews ?? 0).toLocaleString()} reviews</span>
                </div>

                {/* Quick Stats Badges */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-white/20 px-3 py-1 rounded-full">🏪 {(vendorData.products ?? 0).toLocaleString()} Products</span>
                  {vendorData.memberSince && (
                    <span className="bg-white/20 px-3 py-1 rounded-full">📅 Member since {new Date(vendorData.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  )}
                  {vendorData.badges && vendorData.badges.length > 0 && (
                    <span className="bg-white/20 px-3 py-1 rounded-full">⭐ {vendorData.badges[0]}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Stats Card & Buttons */}
            <div className="w-64 h-56 shrink-0">
              {/* Stats Card */}
              <div className="bg-teal-600 rounded-3xl p-4 mb-1">
                <div className="space-y-4">
                  {/* Total Products */}
                  <div>
                    <p className="text-[30px] font-bold text-yellow-300">{(vendorData.products ?? 0).toLocaleString()}</p>
                    <p className="text-xs font-semibold text-white uppercase tracking-wider">Total Products</p>
                  </div>
                  
                  {/* Satisfaction Rate */}
                  {vendorData.satisfactionRate !== undefined && (
                    <div>
                      <p className="text-[30px] font-bold text-yellow-300">{vendorData.satisfactionRate}%</p>
                      <p className="text-xs font-semibold text-white uppercase tracking-wider">Satisfaction Rate</p>
                    </div>
                  )}
                  
                  {/* Response Time */}
                  {vendorData.responseTime && (
                    <div>
                      <p className="text-[30px] font-bold text-yellow-300">{vendorData.responseTime}</p>
                      <p className="text-xs font-semibold text-white uppercase tracking-wider">Avg. Response Time</p>
                    </div>
                  )}
                </div>
              </div>

              
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 p-5 ml-269 ">
        <button className="flex px-3 py-2.5 border-2 border-gray-500 text-gray-800 rounded-full hover:bg-teal-500 transition font-semibold text-sm">
          Get Report
        </button>
        <button className="flex px-3 py-2.5 border-2 border-gray-500 text-gray-800 rounded-full hover:bg-teal-500 transition font-semibold text-sm">
          Follow
        </button>
        <button className="flex px-3 py-2.5 bg-teal-600 text-white rounded-full hover:bg-teal-500 transition font-semibold text-sm">
          Visit Store
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Contact & Performance */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6 ">
              
              
              <div className="bg-white rounded-lg shadow-sm p-6  ">
                <h2 className="text-lg font-bold mb-6 flex items-center space-x-2">
                  <Activity size={20} className="text-teal-600" />
                  <span className='text-black'>Performance</span>
                </h2>
                <hr className='text-gray-300 mb-6' />
                <div className='grid grid-cols-2 grid-rows-2 gap-4'>
                {performanceMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <div key={index} className={`${metric.color} rounded-lg p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">{metric.label}</p>
                        <Icon size={20} className="text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {metric.value}
                        {metric.unit && <span className="text-lg text-gray-600">{metric.unit}</span>}
                      </p>
                    </div>
                  );
                })}
                </div>
              </div>
            
            {/* Contact Information Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-5">
              <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Mail size={20} className="text-teal-600" />
                <span className='text-black'>Contact Information</span>
              </h2>
              <hr className='text-gray-300 mb-6' />
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1 gap-1">
                    <Clock size={16} />
                    <span>Member Since</span>
                    </p>
                  <p className="font-medium text-green-600">{vendorData.memberSince}</p>
                </div>
                <hr className='text-gray-300' />
                
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1 gap-1">
                    <Mail size={16} />
                    <span>Email</span>
                    </p>
                  <a href={`mailto:${vendorData.email}`} className="text-green-600 font-medium hover:underline">
                    {vendorData.email}
                  </a>
                </div>
                <hr className='text-gray-300' />
                
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1 gap-1">
                    <MailCheck size={16} />
                    <span>Business Email</span>
                    </p>
                  <a href={`mailto:${vendorData.businessEmail}`} className="text-green-600 font-medium hover:underline">
                    {vendorData.businessEmail}
                  </a>
                </div>
                <hr className='text-gray-300' />
                
                <div>
                  
                  <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1 gap-1">
                    <PhoneCall size={16}/>
                    <span>Phone</span>
                    </p>
                  <a href={`tel:${vendorData.phone}`} className="text-green-600 font-medium hover:underline">
                    {vendorData.phone}
                  </a>
                </div>
                <hr className='text-gray-300' />
                
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center space-x-1 gap-1">
                    <MapPin size={16} />
                    <span>Location</span>
                  </p>
                  <p className="font-medium text-green-600">{vendorData.location}</p>
                </div>
              </div>
            </div>

            

              {/* Rating Breakdown */}
              <div className="bg-white rounded-lg shadow-sm p-6 mt-5">
                <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                  <ListStartIcon size={20} className="text-teal-600" />
                  <span className='text-black'>Rating Breakdown</span>
                </h2>
                <hr className='text-gray-300 mb-6' />

                <div className="space-y-2">
                  {vendorData.rating_breakdown && Array.isArray(vendorData.rating_breakdown) && vendorData.rating_breakdown.length > 0 ? (
                    vendorData.rating_breakdown.map((item, index) => {
                      const totalReviews = vendorData.reviews || 1;
                      const percentage = (item.count / totalReviews) * 100;
                      return (
                        <div key={index} className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-700 w-8">{item.stars}★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">{item.count}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">No rating data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - About & Verification */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            {vendorData.aboutUs && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">About {vendorData.name}</h2>
                <div className="text-gray-700 space-y-3 leading-relaxed">
                  {typeof vendorData.aboutUs === 'string'
                    ? vendorData.aboutUs.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))
                    : <p>{vendorData.aboutUs}</p>
                  }
                </div>
              </div>
            )}

            {/* Trust & Verification Section */}
            {verificationBadges.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Trust & Verification</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {verificationBadges.map((badge, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{badge.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{badge.date}</p>
                        </div>
                        <CheckCircle size={20} className="text-green-600 shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vendor Journey Section */}
            {vendorData.journey && Array.isArray(vendorData.journey) && vendorData.journey.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Vendor Journey</h2>
                
                <div className="space-y-6">
                  {vendorData.journey.map((milestone, index) => (
                    <div key={index} className="flex space-x-4">
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center">
                        <div className="text-3xl">{milestone.icon || '📍'}</div>
                        {index !== vendorData.journey.length - 1 && (
                          <div className="w-1 h-12 bg-gray-200 mt-2" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="pb-6">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          {milestone.date}
                        </p>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">{milestone.title}</h3>
                        <p className="text-gray-600 text-sm mt-2">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Browse Products CTA */}
            <div className="flex bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 text-center border border-green-200">
              <div className='flex-col items-start'>
                <h3 className="text-2xl font-semibold text-teal-600 mb-2">Ready to explore {vendorData.name}?</h3>
                <p className="text-green-600">{(vendorData.products ?? 0).toLocaleString()} products available</p>
              </div>
              <div className='ml-auto'>
                <button className="bg-teal-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-teal-700 transition inline-flex items-center space-x-2">
                  <span>Browse Products</span>
                  <ChevronRight size={20} />
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
