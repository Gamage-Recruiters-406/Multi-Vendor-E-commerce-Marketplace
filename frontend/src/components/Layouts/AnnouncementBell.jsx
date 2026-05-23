import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, X, Megaphone, Wrench, Sparkles, Tag, ChevronRight, Clock } from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_VERSION  = (import.meta.env.VITE_API_VERSION  || '/api/v1').replace(/^([^/])/, '/$1');
const API_URL      = `${API_BASE_URL}${API_VERSION}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function typeIcon(type) {
  const cls = 'h-4 w-4';
  switch (type) {
    case 'Offer / Promotion': return <Tag      className={cls} />;
    case 'Feature Update':   return <Sparkles  className={cls} />;
    case 'Maintenance':      return <Wrench    className={cls} />;
    default:                 return <Megaphone className={cls} />;
  }
}

function typeColors(type) {
  switch (type) {
    case 'Offer / Promotion': return { dot: 'bg-amber-400',  badge: 'bg-amber-50  text-amber-700  border-amber-200',  icon: 'bg-amber-100  text-amber-600'  };
    case 'Feature Update':   return { dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: 'bg-violet-100 text-violet-600' };
    case 'Maintenance':      return { dot: 'bg-rose-500',   badge: 'bg-rose-50   text-rose-700   border-rose-200',   icon: 'bg-rose-100   text-rose-600'   };
    default:                 return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'bg-emerald-100 text-emerald-600' };
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── Announcement Detail Modal ────────────────────────────────────────────────
function AnnouncementModal({ announcement, onClose }) {
  const colors = typeColors(announcement.type);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{ animation: 'modalIn 0.22s cubic-bezier(.22,1,.36,1)' }}
      >
        {/* Top accent bar */}
        <div className={`h-1.5 w-full ${colors.dot}`} />

        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-5 pb-4">
          <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${colors.icon}`}>
            {typeIcon(announcement.type)}
          </div>

          <div className="flex-1 min-w-0">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${colors.badge}`}>
              {announcement.type || 'General Info'}
            </span>
            <h2 className="mt-1.5 text-base font-bold text-slate-900 leading-snug">
              {announcement.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-slate-100" />

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
            {announcement.content || announcement.description || 'No additional details available.'}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(announcement.createdAt || announcement.publishDate)}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Got it
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnnouncementBell({ notificationClassName = '' }) {
  const [open, setOpen]                   = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [selected, setSelected]           = useState(null);
  const dropdownRef                       = useRef(null);

  // Track read IDs in localStorage
  const getReadIds = () => {
    try { return new Set(JSON.parse(localStorage.getItem('readAnnouncements') || '[]')); }
    catch { return new Set(); }
  };
  const markRead = (id) => {
    const ids = getReadIds();
    ids.add(id);
    localStorage.setItem('readAnnouncements', JSON.stringify([...ids]));
  };

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/announcements/public?limit=20`, {
        headers: getAuthHeaders(), credentials: 'include',
      });
      const data = await res.json();
      const list = (data?.announcements ?? []).map((a) => ({
        _id:       a._id,
        title:     a.title,
        content:   a.description,
        type:      a.type,
        createdAt: a.publishDate || a.createdAt,
      }));
      setAnnouncements(list);
      const readIds = getReadIds();
      setUnreadCount(list.filter((a) => !readIds.has(a._id)).length);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  // Refetch every 5 minutes silently
  useEffect(() => {
    const id = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchAnnouncements]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) {
      // Mark all as read when panel opens
      announcements.forEach((a) => markRead(a._id));
      setUnreadCount(0);
    }
  };

  const handleSelect = (a) => {
    setSelected(a);
    setOpen(false);
    markRead(a._id);
  };

  return (
    <>
      {/* Bell Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          aria-label="Notifications"
          onClick={handleOpen}
          className={`relative grid h-9 w-9 place-items-center rounded-full border border-transparent transition ${notificationClassName}`}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            style={{ animation: 'dropIn 0.18s cubic-bezier(.22,1,.36,1)' }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                {announcements.length > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    {announcements.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col gap-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="h-9 w-9 flex-shrink-0 rounded-xl bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded bg-slate-100" />
                        <div className="h-2.5 w-1/2 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Bell className="h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">No announcements yet</p>
                  <p className="text-xs text-slate-400">We'll notify you when something new arrives</p>
                </div>
              ) : (
                <ul>
                  {announcements.map((a) => {
                    const colors   = typeColors(a.type);
                    const readIds  = getReadIds();
                    const isUnread = !readIds.has(a._id);
                    return (
                      <li key={a._id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(a)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus:outline-none"
                        >
                          {/* Unread dot */}
                          <div className="relative flex-shrink-0 mt-0.5">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors.icon}`}>
                              {typeIcon(a.type)}
                            </div>
                            {isUnread && (
                              <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${colors.dot}`} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-xs font-semibold ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>
                              {a.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400 leading-relaxed">
                              {a.content}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">{timeAgo(a.createdAt)}</p>
                          </div>

                          <ChevronRight className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
                        </button>
                        <div className="mx-4 border-t border-slate-50 last:border-none" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {announcements.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-2.5 text-center">
                <span className="text-[11px] text-slate-400">Click any announcement to read in full</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <AnnouncementModal
          announcement={selected}
          onClose={() => setSelected(null)}
        />
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </>
  );
}
