import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const StepProgress = ({ currentStep }) => {
  const steps = ["Content", "Settings", "Schedule", "Review"];

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                index + 1 === currentStep
                  ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                  : index + 1 < currentStep
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {index + 1 < currentStep ? <CheckIcon /> : index + 1}
            </div>
            <span className={`text-xs mt-1 hidden md:block ${index + 1 === currentStep ? "text-emerald-600 font-semibold" : "text-gray-500"}`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 md:w-16 h-0.5 mx-1 md:mx-2 ${index + 1 < currentStep ? "bg-emerald-600" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
};

const TypeCard = ({ icon, title, description, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
      selected
        ? "border-emerald-600 bg-emerald-50"
        : "border-gray-200 hover:border-gray-300 bg-white"
    }`}
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? "bg-emerald-100" : "bg-gray-100"}`}>
      <span className="text-lg">{icon}</span>
    </div>
    <div className="flex-1">
      <p className={`font-semibold text-sm ${selected ? "text-emerald-700" : "text-gray-800"}`}>{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  </button>
);

const AudienceChip = ({ label, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
      selected
        ? "bg-emerald-600 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
  >
    {label}
  </button>
);

const ToggleSwitch = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? "bg-emerald-600" : "bg-gray-300"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const ANNOUNCEMENT_TYPES = [
  { id: "offer", icon: "🏷️", title: "Offer / Promotion", description: "Discounts, sales, special deals" },
  { id: "update", icon: "✨", title: "Feature Update", description: "New features and improvements" },
  { id: "maintenance", icon: "🔧", title: "Maintenance", description: "Scheduled downtime or issues" },
  { id: "general", icon: "📢", title: "General Info", description: "General announcements" },
];

const AUDIENCES = [
  { id: "all", label: "All Users" },
  { id: "vendors", label: "Vendors Only" },
  { id: "buyers", label: "Buyers Only" },
  { id: "premium", label: "Premium Members" },
  { id: "new", label: "New Members" },
];

const writingTips = [
  "Keep titles under 60 characters",
  "Include details and links",
  "Avoid sensitive info",
  "Use 'Important' tag wisely",
  "Start with key info first",
];

const guidelines = [
  "No personal/private info",
  "Use platform dates/times",
  "Plain language (no jargon)",
  "Promo codes must be pre-approved",
  "Verify before publishing",
];

export default function CreateAnnouncement() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Offer / Promotion",
    targetAudience: "All Users",
    publishDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    isPinned: false,
    sendEmailNotification: false,
    showHomepageBanner: false,
    isSpecialOffer: false,
    couponCode: "",
    saveAsDraft: false,
    publishNow: false,
  });

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        targetAudience: [formData.targetAudience],
        publishDate: formData.publishDate ? `${formData.publishDate}T12:00:00` : undefined,
        expiryDate: formData.expiryDate ? `${formData.expiryDate}T12:00:00` : undefined,
        priorityVisibility: {
          isPinned: formData.isPinned,
          sendEmailNotification: formData.sendEmailNotification,
          showHomepageBanner: formData.showHomepageBanner,
        },
        isSpecialOffer: formData.isSpecialOffer,
        couponCode: formData.couponCode || undefined,
        saveAsDraft: formData.saveAsDraft,
        publishNow: formData.publishNow,
      };

      const res = await axios.post(`${API_URL}/announcements/admin`, payload, getAuthHeader());

      if (res.data.success) {
        navigate("/admin/announcements");
      }
    } catch (err) {
      console.error("Error creating announcement:", err);
      setError(err.response?.data?.message || "Failed to create announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link to="/admin/announcements" className="hover:text-emerald-600 transition-colors">Platform</Link>
                <ChevronRightIcon />
                <Link to="/admin/announcements" className="hover:text-emerald-600 transition-colors">Announcements</Link>
                <ChevronRightIcon />
                <span className="text-gray-700">Create New</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Create Announcement</h1>
              <p className="text-gray-500 mt-1">
                Compose and publish an announcement to all platform users or a specific audience.
              </p>
            </div>
            <Link
              to="/admin/announcements"
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-100 transition-all self-start"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to List
            </Link>
          </div>
        </div>

        <StepProgress currentStep={step} />

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Announcement Content</h2>
                    <p className="text-sm text-gray-500 mt-1">Write a clear, informative message for your users</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Step 1 of 4</span>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Scheduled Maintenance — December 5, 2024"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      maxLength={80}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{formData.title.length}/80</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={5}
                      placeholder="Provide detailed information about your announcement, including important dates, features, or instructions..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      maxLength={500}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{formData.description.length}/500</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Publish Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.publishDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => handleInputChange("publishDate", e.target.value)}
                          className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <CalendarIcon />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.expiryDate}
                          min={formData.publishDate || new Date().toISOString().split("T")[0]}
                          onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                          className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <CalendarIcon />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Leave blank if no expiry</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Type & Audience</h2>
                    <p className="text-sm text-gray-500 mt-1">Select announcement type and target audience</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Step 2 of 4</span>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Announcement Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ANNOUNCEMENT_TYPES.map((type) => (
                        <TypeCard
                          key={type.id}
                          icon={type.icon}
                          title={type.title}
                          description={type.description}
                          selected={formData.type === type.title}
                          onClick={() => handleInputChange("type", type.title)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Target Audience</h3>
                    <div className="flex flex-wrap gap-2">
                      {AUDIENCES.map((aud) => (
                        <AudienceChip
                          key={aud.id}
                          label={aud.label}
                          selected={formData.targetAudience === aud.label}
                          onClick={() => handleInputChange("targetAudience", aud.label)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isSpecialOffer}
                        onChange={(e) => handleInputChange("isSpecialOffer", e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎟️</span>
                          <p className="font-semibold text-gray-800">Special Offer / Promo Code</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Enable this if your announcement includes a discount code</p>
                      </div>
                    </label>
                    {formData.isSpecialOffer && (
                      <div className="mt-4 pl-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Coupon Code</label>
                        <input
                          type="text"
                          placeholder="e.g. BLACKFRIDAY50"
                          value={formData.couponCode}
                          onChange={(e) => handleInputChange("couponCode", e.target.value.toUpperCase())}
                          className="w-full md:w-64 px-4 py-3 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-mono uppercase"
                        />
                        <p className="text-xs text-gray-400 mt-1">Code will be displayed to users</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Priority & Visibility</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure how and when the announcement appears</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Step 3 of 4</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📌</span>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">Pin as Important</p>
                        <p className="text-xs text-gray-500">Keep this announcement at the top of the list</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={formData.isPinned}
                      onToggle={() => handleInputChange("isPinned", !formData.isPinned)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔔</span>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">Send Email Notification</p>
                        <p className="text-xs text-gray-500">Notify users via email when published</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={formData.sendEmailNotification}
                      onToggle={() => handleInputChange("sendEmailNotification", !formData.sendEmailNotification)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🏠</span>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">Show on Homepage Banner</p>
                        <p className="text-xs text-gray-500">Display as a prominent banner on the homepage</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={formData.showHomepageBanner}
                      onToggle={() => handleInputChange("showHomepageBanner", !formData.showHomepageBanner)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Review & Publish</h2>
                    <p className="text-sm text-gray-500 mt-1">Review your announcement before publishing</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Step 4 of 4</span>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Title</h3>
                    <p className="font-semibold text-gray-800">{formData.title || "No title entered"}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h3>
                    <p className="text-gray-700 text-sm">{formData.description || "No description entered"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</h3>
                      <p className="font-semibold text-gray-800">{formData.type}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Audience</h3>
                      <p className="font-semibold text-gray-800">{formData.targetAudience}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Publish Date</h3>
                      <p className="font-semibold text-gray-800">{formData.publishDate ? formatDate(formData.publishDate) : "Not set"}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Expiry Date</h3>
                      <p className="font-semibold text-gray-800">{formData.expiryDate ? formatDate(formData.expiryDate) : "No expiry"}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Options</h3>
                    <div className="flex flex-wrap gap-3">
                      {formData.isPinned && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">📌 Pinned</span>}
                      {formData.sendEmailNotification && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">🔔 Email</span>}
                      {formData.showHomepageBanner && <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">🏠 Banner</span>}
                    </div>
                  </div>

                  {formData.isSpecialOffer && formData.couponCode && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">🎟️ Special Offer</h3>
                      <p className="text-sm text-gray-600 mb-2">Coupon Code:</p>
                      <span className="inline-block px-4 py-2 bg-amber-100 text-amber-800 font-mono font-bold text-lg rounded-lg">
                        {formData.couponCode}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.publishNow}
                        onChange={(e) => handleInputChange("publishNow", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Publish immediately</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  step === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "border-2 border-red-400 text-red-500 hover:bg-red-50"
                }`}
              >
                Previous
              </button>

              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && (!formData.title || !formData.description)}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {loading ? "Publishing..." : "Publish Now"}
                </button>
              )}
            </div>
          </div>

          <div className="lg:w-80 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckIcon />
                Writing Tips
              </h3>
              <ul className="space-y-3">
                {writingTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckIcon />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <WarningIcon />
                Content Guidelines
              </h3>
              <ul className="space-y-3">
                {guidelines.map((guideline, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <WarningIcon />
                    <span>{guideline}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}