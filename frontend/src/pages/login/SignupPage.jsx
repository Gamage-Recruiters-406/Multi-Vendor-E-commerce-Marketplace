import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerUser } from '../../services/authService';

const brandColor = '#0d9488';

export default function SignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: '',  // ✅ FIXED: Changed from 'name' to 'fullname'
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Buyer',  // ✅ FIXED: Changed from 'buyer' to 'Buyer' (capitalized)
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.fullname || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    const normalizedPhone = formData.phone.replace(/\D/g, '');
    if (normalizedPhone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to Terms of Services and Privacy Policies');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('📝 Sending registration data:', {
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ''),
        password: '***',
        confirmPassword: '***',
        role: formData.role
      });

      const response = await registerUser({
        fullname: formData.fullname,  // ✅ FIXED: Using 'fullname' not 'name'
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ''),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,  // ✅ This now sends 'Buyer' or 'Vendor' (capitalized)
      });

      console.log('✅ Registration successful:', response);

      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify({
          id: response.user._id,
          fullname: response.user.fullname,
          email: response.user.email,
          role: response.user.role,
          phone: response.user.phone,
        }));
      }

      toast.success(response.message || 'Account created successfully!');

      // Navigate based on role (now properly capitalized)
      const userRole = String(response.user.role || '').toLowerCase();
      if (userRole === 'vendor') {
        navigate('/vendor/dashboard');
      } else if (userRole === 'buyer') {
        navigate('/buyer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      console.error('❌ Registration error:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Side - Image and Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="/signup-image.jpg"
          alt="Smart Marketplace"
          className="w-full h-full object-cover"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-opacity-30 flex flex-col items-center justify-center p-8">
          {/* Glass Morphism Card */}
          <div className="backdrop-blur-sm rounded-4xl p-12 max-w-137.5 min-h-150 border border-white border-opacity-20 shadow-2xl flex flex-col justify-center">
            {/* Logo Section */}
            <div className="rounded-3xl p-1 mb-10 mx-auto w-fit">
              <img
                src="/logo.png"
                alt="NEXIO Logo"
                className="rounded-3xl w-45 h-20 object-contain"
              />
            </div>

            {/* Content Section */}
            <div className="flex flex-col text-center">
              <h1 className="text-5xl font-semibold mb-5 leading-tight text-white">
                Join Our Marketplace
              </h1>
              <p className="text-[16px] font-sans text-black leading-relaxed">
                Start your journey with us today. Whether you're a buyer looking for 
                quality products or a vendor ready to sell, we make it easy and secure.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-teal-600 mb-1">
              <span className='text-teal-600'>Welcome to NE</span>
              <span className='text-yellow-400'>XIO</span>
            </h2>
            <p className="text-gray-500">
              Fill in the details to get started
            </p>
          </div>

          {/* General Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <span className="text-red-600 text-xl mt-1 shrink-0">⚠️</span>
              <div>
                <p className="text-red-600 font-medium text-sm">Sign Up Failed</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name Input Field */}
            <div>
              <label
                htmlFor="fullname"
                className="block text-gray-800 font-medium mb-2"
              >
                Full Name
              </label>
              <input
                id="fullname"
                type="text"
                placeholder="John Doe"
                value={formData.fullname}
                onChange={handleInputChange}
                name="fullname"  // ✅ FIXED: Changed from 'name' to 'fullname'
                aria-label="Full name"
                disabled={isLoading}
                className={`w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  error
                    ? 'border-red-500 focus:border-red-600 bg-red-50'
                    : 'border-teal-500 focus:border-teal-600'
                }`}
              />
            </div>

            {/* Email Input Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-gray-800 font-medium mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                name="email"
                aria-label="Email address"
                disabled={isLoading}
                className={`w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  error
                    ? 'border-red-500 focus:border-red-600 bg-red-50'
                    : 'border-teal-500 focus:border-teal-600'
                }`}
              />
            </div>

            {/* Phone Input Field */}
            <div>
              <label
                htmlFor="phone"
                className="block text-gray-800 font-medium mb-2"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. 5551234567"
                value={formData.phone}
                onChange={handleInputChange}
                name="phone"
                aria-label="Phone number"
                disabled={isLoading}
                className={`w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  error
                    ? 'border-red-500 focus:border-red-600 bg-red-50'
                    : 'border-teal-500 focus:border-teal-600'
                }`}
              />
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-gray-800 font-medium mb-2">
                Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={handleInputChange}
                name="role"
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed border-teal-500 focus:border-teal-600"
              >
                <option value="Buyer">Buyer</option>  {/* ✅ FIXED: Capitalized */}
                <option value="Vendor">Vendor</option>  {/* ✅ FIXED: Capitalized */}
              </select>
            </div>

            {/* Password Input Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-gray-800 font-medium mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  name="password"
                  aria-label="Password"
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    error
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-teal-500 focus:border-teal-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition disabled:cursor-not-allowed"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-gray-800 font-medium mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  name="confirmPassword"
                  aria-label="Confirm password"
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    error
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-teal-500 focus:border-teal-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition disabled:cursor-not-allowed"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3 mt-4">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                name="agreeToTerms"
                disabled={isLoading}
                className="w-5 h-5 accent-teal-500 cursor-pointer mt-1 rounded disabled:cursor-not-allowed"
                aria-label="Agree to terms"
              />
              <div>
                <label htmlFor="agreeToTerms" className="text-sm text-gray-600 cursor-pointer">
                  I agree to the{' '}
                  <Link to="/terms" className="text-teal-600 hover:underline">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-teal-600 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-[18px] font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link Section */}
          <p className="text-center text-[14px] text-gray-600 mt-4">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-teal-600 hover:text-teal-700 font-semibold transition"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Mobile Logo - Visible only on small screens */}
      <div className="lg:hidden absolute top-8 left-8 z-10">
        <img
          src="/logo.png"
          alt="NEXIO Logo"
          className="w-12 h-12 rounded-lg"
        />
      </div>
    </div>
  );
}