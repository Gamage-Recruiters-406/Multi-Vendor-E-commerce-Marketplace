import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

const StatCard = ({ icon, value, label, bgColor }) => (
  <div className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center text-xl`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
      active
        ? "bg-gray-800 text-white"
        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
    }`}
  >
    {label}
  </button>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const AnnouncementCard = ({ 
  type, 
  title, 
  description, 
  publishDate, 
  expiryDate, 
  pinned = false, 
  isSpecialOffer = false, 
  couponCode = "", 
  onEdit, 
  onDelete 
}) => {
  const typeStyles = {
    "Offer / Promotion": { bg: "bg-amber-100", text: "text-amber-700", label: "OFFER", icon: "🏷️" },
    "Feature Update": { bg: "bg-blue-100", text: "text-blue-700", label: "UPDATE", icon: "✨" },
    "Maintenance": { bg: "bg-red-100", text: "text-red-700", label: "MAINTENANCE", icon: "🔧" },
    "General Info": { bg: "bg-gray-100", text: "text-gray-700", label: "GENERAL", icon: "📢" },
  };

  const style = typeStyles[type] || typeStyles["General Info"];

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  };

  if (pinned) {
    return (
      <div className="bg-slate-800 rounded-2xl p-6 text-white hover:shadow-xl transition-shadow cursor-pointer">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🎉</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 bg-yellow-400 text-slate-900 text-xs font-bold rounded-full">PINNED</span>
              {isSpecialOffer && <span className="px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-bold rounded-full border border-amber-400/30">SPECIAL OFFER</span>}
              <span className={`px-3 py-1 ${style.bg} ${style.text} text-xs font-bold rounded-full`}>{style.label}</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-2">{title}</h3>
            <p className="text-gray-300 text-sm mb-3 line-clamp-2">{description}</p>
            {isSpecialOffer && couponCode && (
              <p className="text-amber-400 font-bold text-sm mb-3">Use code: <span className="bg-slate-700 px-2 py-1 rounded font-mono">{couponCode}</span></p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span>{formatDate(publishDate)}</span>
              {expiryDate && <span>Expires: {formatDate(expiryDate)}</span>}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <button
              onClick={onEdit}
              className="w-10 h-10 rounded-full border-2 border-emerald-500 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"
            >
              <EditIcon />
            </button>
            <button
              onClick={onDelete}
              className="w-10 h-10 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
            >
              <DeleteIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
          <span className="text-xl">{style.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="font-bold text-gray-800">{title}</h4>
            <span className={`px-2 py-0.5 ${style.bg} ${style.text} text-xs font-semibold rounded-full`}>
              {style.label}
            </span>
          </div>
          <p className="text-gray-500 text-sm line-clamp-2 mb-2">{description}</p>
          {isSpecialOffer && couponCode && (
            <p className="text-amber-600 font-semibold text-sm mb-2">
              🎟️ Code: <span className="bg-amber-100 px-2 py-0.5 rounded font-mono">{couponCode}</span>
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{formatDate(publishDate)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="w-10 h-10 rounded-full border-2 border-emerald-500 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"
          >
            <EditIcon />
          </button>
          <button
            onClick={onDelete}
            className="w-10 h-10 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function Announcements() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, scheduled: 0, draft: 0, expired: 0, archived: 0 });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: "" });

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, [activeFilter, searchQuery]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `${API_URL}/announcements/admin/list?`;
      
      if (activeFilter === "Offers") url += `type=Offer / Promotion&`;
      if (activeFilter === "Updates") url += `type=Feature Update&`;
      if (activeFilter === "Maintenance") url += `type=Maintenance&`;
      if (activeFilter === "Important") url += `isPinned=true&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      
      const res = await axios.get(url, getAuthHeader());
      
      if (res.data.success) {
        setAnnouncements(res.data.announcements || []);
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError(err.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/announcements/admin/stats`, getAuthHeader());
      if (res.data.success) {
        setStats(res.data.stats || { total: 0, published: 0, scheduled: 0, draft: 0, expired: 0, archived: 0 });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleDeleteClick = (id, title) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_URL}/announcements/admin/${deleteModal.id}`, getAuthHeader());
      setAnnouncements((prev) => prev.filter((a) => a._id !== deleteModal.id));
      setDeleteModal({ isOpen: false, id: null, title: "" });
      fetchStats();
    } catch (err) {
      console.error("Error deleting announcement:", err);
      alert(err.response?.data?.message || "Failed to delete announcement");
    }
  };

  const handleEditClick = (id) => {
    navigate(`/admin/announcements/edit/${id}`);
  };

  const filters = ["All", "Offers", "Updates", "Maintenance", "Important"];

  const statsData = [
    { icon: "📋", value: stats.total, label: "Total Announcements", bgColor: "bg-gray-100" },
    { icon: "🏷️", value: stats.published, label: "Published", bgColor: "bg-emerald-100" },
    { icon: "✨", value: stats.scheduled, label: "Scheduled", bgColor: "bg-blue-100" },
    { icon: "📝", value: stats.draft, label: "Drafts", bgColor: "bg-amber-100" },
  ];

  const typeMap = {
    "Offer / Promotion": "OFFER",
    "Feature Update": "UPDATE",
    "Maintenance": "MAINTENANCE",
    "General Info": "GENERAL",
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Announcements</h1>
              <p className="text-gray-500 mt-1">
                Stay updated with the latest platform news, offers and maintenance notices.
              </p>
            </div>
            <Link to="/admin/announcements/create" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors shadow-sm">
              <span className="text-lg">+</span>
              <span>New Announcement</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsData.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <FilterPill
                key={filter}
                label={filter}
                active={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              />
            ))}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-72 pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading announcements...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No announcements found</div>
            ) : (
              announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement._id}
                  id={announcement._id}
                  type={announcement.type}
                  title={announcement.title}
                  description={announcement.description}
                  publishDate={announcement.publishDate}
                  expiryDate={announcement.expiryDate}
                  pinned={announcement.priorityVisibility?.isPinned || false}
                  isSpecialOffer={announcement.isSpecialOffer || false}
                  couponCode={announcement.couponCode || ""}
                  onEdit={() => handleEditClick(announcement._id)}
                  onDelete={() => handleDeleteClick(announcement._id, announcement.title)}
                />
              ))
            )}
          </div>
        )}

        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Delete Announcement"
          message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModal({ isOpen: false, id: null, title: "" })}
        />
      </div>
    </div>
  );
}