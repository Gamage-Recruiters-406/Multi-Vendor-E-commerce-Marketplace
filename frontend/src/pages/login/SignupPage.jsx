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

const validateName = (name) => {
  if (!name || name.trim() === '') {
    return 'Full name is required';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  return null;
};

const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

export default function SignupPage() {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validatePasswordMatch(password, confirmPassword);

    if (nameError || emailError || passwordError || confirmPasswordError) {
      console.log('❌ Validation errors');
      setErrors({
        ...(nameError && { name: nameError }),
        ...(emailError && { email: emailError }),
        ...(passwordError && { password: passwordError }),
        ...(confirmPasswordError && { confirmPassword: confirmPasswordError }),
      });
      return;
    }

    if (!agreeToTerms) {
      console.log('❌ Must agree to terms');
      setErrors({ agreeToTerms: 'You must agree to the terms and conditions' });
      return;
    }

    setLoading(true);

    try {
      console.log('👤 Attempting sign up...');

      // Call auth service
      const response = await authService.signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      console.log('✅ Sign up successful');
      console.log('📦 Response:', response);

      // Redirect to sign in page
      console.log('📍 Redirecting to sign in page');
      navigate('/login', { state: { message: 'Signup successful! Please sign in.' } });
    } catch (err) {
      console.error('❌ Sign up failed:', err.message);

      const errorMessage = err.message || 'Failed to create account';
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /** Handle name input change */
  const handleNameChange = (e) => {
    setName(e.target.value);
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  /** Handle email input change */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  /** Handle password input change */
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  /** Handle confirm password input change */
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-teal-600 mb-1">
              Create Account
            </h2>
            <p className="text-gray-500">
              Fill in the details to get started
            </p>
          </div>

          {/* General Error Message */}
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <span className="text-red-600 text-xl mt-1 flex-shrink-0">⚠️</span>
              <div>
                <p className="text-red-600 font-medium text-sm">Sign Up Failed</p>
                <p className="text-red-600 text-sm">{generalError}</p>
              </div>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name Input Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-gray-800 font-medium mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={handleNameChange}
                aria-label="Full name"
                aria-describedby={errors.name ? "name-error" : undefined}
                aria-invalid={!!errors.name}
                disabled={loading}
                className={`w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.name
                    ? 'border-red-500 focus:border-red-600 bg-red-50'
                    : 'border-teal-500 focus:border-teal-600'
                }`}
              />
              {errors.name && (
                <p id="name-error" className="text-red-600 text-sm mt-2">
                  {errors.name}
                </p>
              )}
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
                value={email}
                onChange={handleEmailChange}
                aria-label="Email address"
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={!!errors.email}
                disabled={loading}
                className={`w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.email
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

            {/* Role Selection */}
            <div>
              <label className="block text-gray-800 font-medium mb-2">
                I want to:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="buyer"
                    checked={role === 'buyer'}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={loading}
                    className="cursor-pointer accent-teal-500 disabled:cursor-not-allowed"
                  />
                  <span className="ml-2 text-gray-700">Buy Products</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="vendor"
                    checked={role === 'vendor'}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={loading}
                    className="cursor-pointer accent-teal-500 disabled:cursor-not-allowed"
                  />
                  <span className="ml-2 text-gray-700">Sell Products</span>
                </label>
              </div>
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
                  className={`w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.password
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-teal-500 focus:border-teal-600'
                  }`}
                />
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
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  aria-label="Confirm password"
                  aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                  aria-invalid={!!errors.confirmPassword}
                  disabled={loading}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none pr-12 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-600 bg-red-50'
                      : 'border-teal-500 focus:border-teal-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
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
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-red-600 text-sm mt-2">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3 mt-4">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (errors.agreeToTerms) {
                    setErrors(prev => ({ ...prev, agreeToTerms: '' }));
                  }
                }}
                disabled={loading}
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
                {errors.agreeToTerms && (
                  <p className="text-red-600 text-sm mt-1">{errors.agreeToTerms}</p>
                )}
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-[18px] font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
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
