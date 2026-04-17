import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader } from 'lucide-react';
import * as authService from '../../services/authService';


// Form validation functions
const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export default function SigninPage() {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  // Navigation
  const navigate = useNavigate();

  /** Handle form submission */
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📝 Form submitted');

    // Clear previous errors
    setErrors({});
    setGeneralError('');

    // Client-side validation
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      console.log('❌ Validation errors');
      setErrors({
        ...(emailError && { email: emailError }),
        ...(passwordError && { password: passwordError }),
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Attempting sign in...');

      // Call auth service
      const response = await authService.signIn(email, password);

      console.log('✅ Sign in successful');
      console.log('📦 Response:', response);

      // Store remember me preference
      if (rememberMe) {
        authService.rememberEmail(email);
      } else {
        authService.rememberEmail(null);
      }

      // Get user role from response
      const userRole = response.user?.role || 'buyer';
      console.log('👤 User role:', userRole);

      // Redirect based on user role
      if (userRole === 'vendor') {
        console.log('📍 Redirecting to vendor dashboard');
        navigate('/vendor/dashboard');
      } else if (userRole === 'admin') {
        console.log('📍 Redirecting to admin dashboard');
        navigate('/admin/dashboard');
      } else {
        console.log('📍 Redirecting to buyer dashboard');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('❌ Sign in failed:', err.message);

      const errorMessage = err.message || 'Invalid email or password';
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle email input change
   * Clear error as user types
   */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  /**
   * Handle password input change
   * Clear error as user types
   */
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Side - Image and Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="/signin-image.jpg"
          alt="Smart Marketplace"
          className="w-full h-full object-cover"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0  bg-opacity-30 flex flex-col items-center justify-center p-8">
          {/* Glass Morphism Card */}
          <div className="backdrop-blur-sm rounded-4xl p-12 max-w-[550px] min-h-[600px] border border-white border-opacity-20 shadow-2xl flex flex-col justify-center">
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
              <h1 className="text-5xl  font-semibold mb-5 leading-tight text-white">
                Smart Marketplace Experience
              </h1>
              <p className="text-[16px] font-sans text-black leading-relaxed">
                Discover a world of products from trusted vendors, all in one place.
                Whether you're buying or selling, our platform makes every transaction
                simple, secure, and seamless.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="mb-15">
            <h2 className="text-4xl font-bold text-teal-600 mb-1">
              Welcome Back
            </h2>
            <p className="text-gray-500">
              Please enter your details to sign in to your account
            </p>
          </div>

          {/* General Error Message */}
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <span className="text-red-600 text-xl mt-1 flex-shrink-0">⚠️</span>
              <div>
                <p className="text-red-600 font-medium text-sm">Login Failed</p>
                <p className="text-red-600 text-sm">{generalError}</p>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                value={email}
                onChange={handleEmailChange}
                aria-label="Email address"
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={!!errors.email}
                disabled={loading}
                className={`w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.email
                  ? 'border-red-500 focus:border-red-600 bg-red-50'
                  : 'border-teal-500 focus:border-teal-600'
                  }`}
              />
              {errors.email && (
                <p id="email-error" className="text-red-600 text-sm mt-2">
                  {errors.email}
                </p>
              )}
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
                  value={password}
                  onChange={handlePasswordChange}
                  aria-label="Password"
                  aria-describedby={errors.password ? "password-error" : undefined}
                  aria-invalid={!!errors.password}
                  disabled={loading}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.password
                    ? 'border-red-500 focus:border-red-600 bg-red-50'
                    : 'border-teal-500 focus:border-teal-600'
                    }`}
                />
                {/* Password Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
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
              {errors.password && (
                <p id="password-error" className="text-red-600 text-sm mt-2">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password Section */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer mt-0">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-5 h-5 accent-teal-500 cursor-pointer rounded disabled:cursor-not-allowed"
                  aria-label="Remember me"
                />
                <span className="ml-3 text-gray-600 text-sm">Remember Me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-teal-600 hover:text-teal-700 font-medium text-[13px] transition "
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-[18px] font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          {/*<div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>*/}

          {/* Google Sign In Button */}
          {/*<button
            type="button"
            disabled={loading}
            className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <img
              src="/google-icon.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </button> /*}

          {/* Sign Up Link Section */}
          <p className="text-center text-[14px] text-gray-600 mt-4">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-teal-600 hover:text-teal-700 font-semibold transition"
            >
              Sign up here
            </Link>
          </p>

          {/* Additional Links */}
          <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
            <p>
              <Link to="/terms" className="hover:text-gray-700 hover:underline">
                Terms of Service
              </Link>
              {' '} · {' '}
              <Link to="/privacy" className="hover:text-gray-700 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
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