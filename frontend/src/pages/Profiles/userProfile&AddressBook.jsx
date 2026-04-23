import React, { useState } from 'react';
import { Eye, EyeOff, Edit2, Trash2, Plus, Check, X } from 'lucide-react';
import Header from '../../components/Layouts/Header';
import Footer from '../../components/Layouts/Footer';

export default function UserProfileAndAddressBook() {
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    special: false,
    nophrase: false,
  });

  const [profile, setProfile] = useState({
    fullName: 'Alex Rivers',
    email: 'alex.rivers@example.com',
    phone: '+1 (555) 012-3456',
    country: 'United States',
    avatar: '👤',
  });

  const [addresses, setAddresses] = useState([
    {
      id: 1,
      label: 'Home Office',
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
      country: 'United States',
      isDefault: true,
    },
    {
      id: 2,
      label: 'Central Warehouse',
      street: '1200 Industrial Way, Suite B',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      country: 'United States',
      isDefault: false,
    },
  ]);

  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  });

  const [editingProfile, setEditingProfileData] = useState(profile);

  const handlePasswordChange = (field, value) => {
    setPasswords({ ...passwords, [field]: value });

    if (field === 'new') {
      setPasswordStrength({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        special: /[!@#$%^&*]/.test(value),
        nophrase: !['password', 'qwerty', '12345'].some(phrase => value.toLowerCase().includes(phrase)),
      });
    }
  };

  const handleAddAddress = () => {
    if (newAddress.label && newAddress.street && newAddress.city) {
      const addressToAdd = {
        id: Math.max(...addresses.map(a => a.id), 0) + 1,
        ...newAddress,
        isDefault: addresses.length === 0,
      };
      setAddresses([...addresses, addressToAdd]);
      setNewAddress({
        label: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States',
      });
      setIsAddingAddress(false);
    }
  };

  const handleDeleteAddress = (id) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const handleSetDefault = (id) => {
    setAddresses(addresses.map(a => ({
      ...a,
      isDefault: a.id === id,
    })));
  };

  const handleSaveProfile = () => {
    setProfile(editingProfile);
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafb 0%, #eef2f5 100%)' }}>
        <Header />
      {/* Header */}
      <div className="border-b border-gray-200 bg-teal-600">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-white">My Account</h1>
          <p className="text-gray-300 mt-2">Manage your personal information, security settings, and addresses.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                {profile.avatar}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile.fullName}</h2>
                <p className="text-gray-500 text-sm">{profile.email}</p>
                <div className="mt-2 w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsEditingProfile(true);
                setEditingProfileData(profile);
              }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          </div>

          {!isEditingProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-gray-700 font-medium">
                  {profile.fullName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-gray-700 font-medium">
                  {profile.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-gray-700 font-medium">
                  {profile.phone}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-gray-700 font-medium">
                  {profile.country}
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
                    onChange={(e) => setEditingProfileData({ ...editingProfile, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={editingProfile.email}
                    onChange={(e) => setEditingProfileData({ ...editingProfile, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={editingProfile.phone}
                    onChange={(e) => setEditingProfileData({ ...editingProfile, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <select
                    value={editingProfile.country}
                    onChange={(e) => setEditingProfileData({ ...editingProfile, country: e.target.value })}
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
                  onClick={() => setIsEditingProfile(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200"
                >
                  Save Changes
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
              <p className="text-sm text-gray-600">Ensure your account is using a long, random password to stay secure.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Password Fields */}
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
                  />
                  <button
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
                    />
                    <button
                      onClick={() => setPasswordVisibility({ ...passwordVisibility, new: !passwordVisibility.new })}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      {passwordVisibility.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={passwordVisibility.confirm ? 'text' : 'password'}
                      value={passwords.confirm}
                      onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      onClick={() => setPasswordVisibility({ ...passwordVisibility, confirm: !passwordVisibility.confirm })}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      {passwordVisibility.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <button className="px-6 py-2 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 transition-colors duration-200">
                Update Password
              </button>
            </div>

            {/* Right Column - Security Requirements */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 h-fit">
              <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                <Check size={16} className="text-emerald-600" />
                SECURITY REQUIREMENTS
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
                  <span className={passwordStrength.uppercase ? 'text-emerald-900' : 'text-gray-500'}>One uppercase letter</span>
                </li>
                <li className="flex items-center gap-2">
                  {passwordStrength.special ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <X size={16} className="text-gray-300" />
                  )}
                  <span className={passwordStrength.special ? 'text-emerald-900' : 'text-gray-500'}>One special character</span>
                </li>
                <li className="flex items-center gap-2">
                  {passwordStrength.nophrase ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <X size={16} className="text-gray-300" />
                  )}
                  <span className={passwordStrength.nophrase ? 'text-emerald-900' : 'text-gray-500'}>No common phrases</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Address Book Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Address Book</h3>
              <p className="text-sm text-gray-600 mt-1">Manage your shipping and billing addresses.</p>
            </div>
            {!isAddingAddress && (
              <button
                onClick={() => setIsAddingAddress(true)}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors duration-200 flex items-center gap-2"
              >
                <Plus size={18} />
                Add New Address
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
                  placeholder="Address Label (e.g., Home Office)"
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
                    placeholder="ZIP Code"
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

          {/* Addresses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  address.isDefault
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
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
                  <button className="px-4 py-2 text-emerald-700 font-semibold hover:bg-white rounded-lg transition-colors duration-200 text-sm">
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="px-4 py-2 text-red-600 font-semibold hover:bg-white rounded-lg transition-colors duration-200 text-sm"
                  >
                    REMOVE
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="px-4 py-2 text-emerald-700 font-semibold hover:bg-white rounded-lg transition-colors duration-200 text-sm ml-auto"
                    >
                      SET AS DEFAULT
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}