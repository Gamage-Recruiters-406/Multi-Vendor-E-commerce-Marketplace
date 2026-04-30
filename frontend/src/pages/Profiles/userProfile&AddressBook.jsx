import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Edit2, Trash2, Plus, Check, X, Upload, Camera, Trash } from 'lucide-react';
import Header from '../../components/Layouts/Header';
import Footer from '../../components/Layouts/Footer';
import {
  getProfile,
  changePassword,
  updatePhone,
  uploadProfilePicture,
  getProfilePicture,
  removeProfilePicture,
  getAllAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../services/addressbookServices';

export default function UserProfileAndAddressBook() {
  // ============ PROFILE STATE ============
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'United States',
    profilePicture: null,
  });
  const [editingProfile, setEditingProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const fileInputRef = useRef(null);

  // ============ PASSWORD STATE ============
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    special: false,
    nophrase: false,
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // ============ ADDRESS STATE ============
  const [addresses, setAddresses] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  });
  const [editingAddressData, setEditingAddressData] = useState(null);

  // ============ GENERAL STATE ============
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // ============ LIFECYCLE ============

  useEffect(() => {
    loadProfileData();
    loadAddresses();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (profilePictureUrl) {
        URL.revokeObjectURL(profilePictureUrl);
      }
    };
  }, [profilePictureUrl]);

  // ============ HELPER FUNCTIONS ============

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const validatePhoneNumber = (phone) => {
    return /^[0-9]{10}$/.test(phone);
  };

  // ============ PROFILE FUNCTIONS ============

  const loadProfileData = async () => {
    try {
      setIsLoadingProfile(true);
      setError(null);
      const response = await getProfile();

      if (response.success && response.data) {
        setProfile(response.data);
        setEditingProfile(response.data);
        
        // Load profile picture separately
        await loadProfilePicture();
      } else {
        showError(response.message || 'Failed to load profile');
      }
    } catch (err) {
      showError('Error loading profile. Please refresh and try again.');
      console.error('Profile loading error:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadProfilePicture = async () => {
    try {
      const response = await getProfilePicture();
      if (response.success && response.imageUrl) {
        setProfilePictureUrl(response.imageUrl);
      }
    } catch (err) {
      console.error('Error loading profile picture:', err);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showError('Please upload a valid image file (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size should be less than 5MB');
      return;
    }

    try {
      setIsUploadingPicture(true);
      const response = await uploadProfilePicture(file);

      if (response.success) {
        showSuccess('Profile picture updated successfully!');
        // Reload profile picture
        await loadProfilePicture();
        // Also reload profile data to get updated user info
        await loadProfileData();
      } else {
        showError(response.message || 'Failed to upload profile picture');
      }
    } catch (err) {
      showError('Error uploading profile picture');
      console.error('Upload error:', err);
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    try {
      const response = await removeProfilePicture();

      if (response.success) {
        showSuccess('Profile picture removed successfully!');
        setProfilePictureUrl(null);
        // Reload profile data
        await loadProfileData();
      } else {
        showError(response.message || 'Failed to remove profile picture');
      }
    } catch (err) {
      showError('Error removing profile picture');
      console.error('Remove error:', err);
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditingProfile({ ...profile });
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);

      // Validate phone if changed and not empty
      if (editingProfile.phone && !validatePhoneNumber(editingProfile.phone)) {
        showError('Phone number must be exactly 10 digits');
        return;
      }

      // Update phone if changed
      if (editingProfile.phone !== profile.phone && editingProfile.phone) {
        setIsUpdatingPhone(true);
        const phoneResponse = await updatePhone(editingProfile.phone);
        setIsUpdatingPhone(false);

        if (!phoneResponse.success) {
          showError(phoneResponse.message || 'Failed to update phone');
          return;
        }
      }

      // Update local profile state
      setProfile(editingProfile);
      setIsEditingProfile(false);
      showSuccess('Profile updated successfully!');
    } catch (err) {
      showError(err.message || 'Failed to save profile');
      console.error('Save profile error:', err);
    }
  };

  const handleCancelProfile = () => {
    setIsEditingProfile(false);
    setEditingProfile(profile);
  };

  // ============ PASSWORD FUNCTIONS ============

  const handlePasswordChange = (field, value) => {
    setPasswords({ ...passwords, [field]: value });

    if (field === 'new') {
      setPasswordStrength({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        special: /[!@#$%^&*]/.test(value),
        nophrase: !['password', 'qwerty', '12345'].some(phrase =>
          value.toLowerCase().includes(phrase)
        ),
      });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      // Validate passwords match
      if (passwords.new !== passwords.confirm) {
        showError('New passwords do not match');
        return;
      }

      // Validate password strength
      if (!passwordStrength.length || !passwordStrength.uppercase || !passwordStrength.special) {
        showError('Password does not meet security requirements');
        return;
      }

      setIsUpdatingPassword(true);
      const response = await changePassword(
        passwords.current,
        passwords.new,
        passwords.confirm
      );

      if (response.success) {
        setPasswords({ current: '', new: '', confirm: '' });
        setPasswordStrength({ length: false, uppercase: false, special: false, nophrase: false });
        showSuccess('Password changed successfully!');
      } else {
        showError(response.message || 'Failed to change password');
      }
    } catch (err) {
      showError(err.message || 'Failed to change password');
      console.error('Update password error:', err);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ============ ADDRESS FUNCTIONS (MOCK DATA) ============

  const loadAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      setError(null);
      const response = await getAllAddresses();

      if (response.success && Array.isArray(response.data)) {
        setAddresses(response.data);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error('Address loading error:', err);
      setAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.label || !newAddress.street || !newAddress.city) {
      showError('Please fill in all required fields (label, street, city)');
      return;
    }

    try {
      setError(null);
      const response = await addAddress(newAddress);

      if (response.success) {
        setAddresses([...addresses, response.data]);
        setNewAddress({
          label: '',
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'United States',
        });
        setIsAddingAddress(false);
        showSuccess('Address added successfully!');
      } else {
        showError(response.message || 'Failed to add address');
      }
    } catch (err) {
      showError(err.message || 'Failed to add address');
      console.error('Add address error:', err);
    }
  };

  const handleOpenEditAddress = (address) => {
    setIsEditingAddress(address._id);
    setEditingAddressData({ ...address });
  };

  const handleSaveEditAddress = async () => {
    if (!editingAddressData.label || !editingAddressData.street || !editingAddressData.city) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      const response = await updateAddress(isEditingAddress, editingAddressData);

      if (response.success) {
        setAddresses(
          addresses.map(addr => (addr._id === isEditingAddress ? response.data : addr))
        );
        setIsEditingAddress(null);
        setEditingAddressData(null);
        showSuccess('Address updated successfully!');
      } else {
        showError(response.message || 'Failed to update address');
      }
    } catch (err) {
      showError(err.message || 'Failed to update address');
      console.error('Update address error:', err);
    }
  };

  const handleCancelEditAddress = () => {
    setIsEditingAddress(null);
    setEditingAddressData(null);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      setError(null);
      const response = await deleteAddress(addressId);

      if (response.success) {
        setAddresses(addresses.filter(a => a._id !== addressId));
        showSuccess('Address deleted successfully!');
      } else {
        showError(response.message || 'Failed to delete address');
      }
    } catch (err) {
      showError(err.message || 'Failed to delete address');
      console.error('Delete address error:', err);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      setError(null);
      const response = await setDefaultAddress(addressId);

      if (response.success) {
        setAddresses(
          addresses.map(a => ({
            ...a,
            isDefault: a._id === addressId,
          }))
        );
        showSuccess('Default address updated!');
      } else {
        showError(response.message || 'Failed to set default address');
      }
    } catch (err) {
      showError(err.message || 'Failed to set default address');
      console.error('Set default error:', err);
    }
  };

  // ============ RENDER LOADING STATE ============

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ============ RENDER MAIN UI ============

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafb 0%, #eef2f5 100%)' }}>
      {/* Header */}
      <Header />
      <div className="border-b border-gray-200 bg-teal-600">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-gray-300 mt-2">Manage your personal information, security settings, and delivery addresses.</p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 py-4 mt-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="max-w-6xl mx-auto px-6 py-4 mt-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
              <p className="text-gray-600 text-sm mt-1">View and edit your personal details</p>
            </div>
            {!isEditingProfile && (
              <button
                onClick={handleEditProfile}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Picture Section */}
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-200">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center overflow-hidden">
                {profilePictureUrl ? (
                  <img 
                    src={profilePictureUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-white font-bold">
                    {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={isUploadingPicture}
                className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 rounded-full text-white hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50"
                title="Upload profile picture"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Profile Picture</h3>
              <p className="text-sm text-gray-600 mt-1">JPG, PNG or GIF (Max 5MB)</p>
              {profilePictureUrl && (
                <button
                  onClick={handleRemoveProfilePicture}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash size={14} />
                  Remove Picture
                </button>
              )}
              {isUploadingPicture && (
                <p className="text-sm text-emerald-600 mt-2">Uploading...</p>
              )}
            </div>
          </div>

          {!isEditingProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-gray-900 font-medium">
                  {profile.fullName || 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-gray-900 font-medium">
                  {profile.email || 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-gray-900 font-medium">
                  {profile.phone ? `${profile.phone.slice(0, 3)}-${profile.phone.slice(3, 6)}-${profile.phone.slice(6)}` : 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-gray-900 font-medium">
                  {profile.country || 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editingProfile.fullName}
                    onChange={(e) => setEditingProfile({ ...editingProfile, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={editingProfile.email}
                    onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={editingProfile.phone}
                    onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                    placeholder="1234567890"
                    maxLength="10"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                      editingProfile.phone && !validatePhoneNumber(editingProfile.phone)
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-emerald-500'
                    }`}
                  />
                  {editingProfile.phone && !validatePhoneNumber(editingProfile.phone) && (
                    <p className="text-red-600 text-sm mt-1">Phone must be exactly 10 digits</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <select
                    value={editingProfile.country}
                    onChange={(e) => setEditingProfile({ ...editingProfile, country: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>Australia</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelProfile}
                  disabled={isUpdatingPhone}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isUpdatingPhone || (editingProfile.phone && !validatePhoneNumber(editingProfile.phone))}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingPhone ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <span className="text-emerald-600 font-bold">🔒</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={passwordVisibility.current ? 'text' : 'password'}
                      value={passwords.current}
                      onChange={(e) => handlePasswordChange('current', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisibility({ ...passwordVisibility, current: !passwordVisibility.current })}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      {passwordVisibility.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={passwordVisibility.new ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => handlePasswordChange('new', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisibility({ ...passwordVisibility, new: !passwordVisibility.new })}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {passwordVisibility.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={passwordVisibility.confirm ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisibility({ ...passwordVisibility, confirm: !passwordVisibility.confirm })}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {passwordVisibility.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-6 py-2 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 h-fit">
                <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                  <Check size={16} className="text-emerald-600" />
                  REQUIREMENTS
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    {passwordStrength.length ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <X size={16} className="text-gray-300" />
                    )}
                    <span className={passwordStrength.length ? 'text-emerald-900' : 'text-gray-500'}>8+ characters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {passwordStrength.uppercase ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <X size={16} className="text-gray-300" />
                    )}
                    <span className={passwordStrength.uppercase ? 'text-emerald-900' : 'text-gray-500'}>Uppercase letter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {passwordStrength.special ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <X size={16} className="text-gray-300" />
                    )}
                    <span className={passwordStrength.special ? 'text-emerald-900' : 'text-gray-500'}>Special character</span>
                  </li>
                </ul>
              </div>
            </div>
          </form>
        </div>

        {/* Address Book Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Address Book</h3>
              <p className="text-sm text-gray-600 mt-1">Manage your delivery addresses</p>
            </div>
            {!isAddingAddress && !isEditingAddress && (
              <button
                onClick={() => setIsAddingAddress(true)}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors duration-200 flex items-center gap-2"
              >
                <Plus size={18} />
                Add Address
              </button>
            )}
          </div>

          {/* Add Address Form */}
          {isAddingAddress && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 mb-8">
              <h4 className="font-bold text-gray-900 mb-4">Add New Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Label (e.g., Home, Office)"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={newAddress.zip}
                    onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setIsAddingAddress(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAddress}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200"
                >
                  Add Address
                </button>
              </div>
            </div>
          )}

          {/* Edit Address Form */}
          {isEditingAddress && editingAddressData && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-8">
              <h4 className="font-bold text-gray-900 mb-4">Edit Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Label"
                  value={editingAddressData.label}
                  onChange={(e) => setEditingAddressData({ ...editingAddressData, label: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Street"
                  value={editingAddressData.street}
                  onChange={(e) => setEditingAddressData({ ...editingAddressData, street: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={editingAddressData.city}
                  onChange={(e) => setEditingAddressData({ ...editingAddressData, city: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="State"
                    value={editingAddressData.state}
                    onChange={(e) => setEditingAddressData({ ...editingAddressData, state: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={editingAddressData.zip}
                    onChange={(e) => setEditingAddressData({ ...editingAddressData, zip: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCancelEditAddress}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditAddress}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Addresses Grid */}
          {isLoadingAddresses ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading addresses...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.length > 0 ? (
                addresses.map((address) => (
                  <div
                    key={address._id}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      address.isDefault
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-bold text-gray-900">{address.label}</h4>
                      {address.isDefault && (
                        <span className="px-2 py-1 bg-emerald-700 text-white text-xs font-bold rounded">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-700 mb-4">
                      <p>{address.street}</p>
                      <p>{address.city}, {address.state} {address.zip}</p>
                      <p>{address.country}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleOpenEditAddress(address)}
                        className="px-4 py-2 text-emerald-700 font-semibold hover:bg-white rounded-lg transition-colors duration-200 text-sm"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address._id)}
                        className="px-4 py-2 text-red-600 font-semibold hover:bg-white rounded-lg transition-colors duration-200 text-sm"
                      >
                        DELETE
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address._id)}
                          className="px-4 py-2 text-emerald-700 font-semibold hover:bg-white rounded-lg transition-colors duration-200 text-sm ml-auto"
                        >
                          SET DEFAULT
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No addresses yet. Add one to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}