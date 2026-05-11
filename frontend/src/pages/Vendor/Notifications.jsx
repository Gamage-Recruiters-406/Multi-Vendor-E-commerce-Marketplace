import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package,
  DollarSign,
  AlertTriangle,
  Star,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  Bell,
  Check,
  ShoppingBag,
  CreditCard,
  XCircle,
  Clock,
  Megaphone,
  Tag,
  Loader2,
  Inbox,
  X,
  Eye,
} from "lucide-react";
import Layout from "../../components/Layouts/Layout";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead as markAllAsReadApi,
  markAsRead as markAsReadApi,
} from "../../api/notifications";

const typeConfig = {
  order_placed:        { icon: Package,      bg: "bg-emerald-50",      color: "text-[#1A9F73]" },
  order_confirmed:     { icon: CheckCircle,   bg: "bg-emerald-50",      color: "text-[#1A9F73]" },
  order_shipped:       { icon: Package,       bg: "bg-sky-50",          color: "text-sky-500" },
  order_delivered:     { icon: ShoppingBag,   bg: "bg-emerald-50",      color: "text-[#1A9F73]" },
  order_cancelled:     { icon: XCircle,       bg: "bg-red-50",          color: "text-red-500" },
  payment_initiated:   { icon: CreditCard,    bg: "bg-amber-50",        color: "text-amber-500" },
  payment_succeeded:   { icon: DollarSign,    bg: "bg-emerald-50",      color: "text-[#1A9F73]" },
  payment_received:    { icon: DollarSign,    bg: "bg-emerald-50",      color: "text-[#1A9F73]" },
  payment_failed:      { icon: XCircle,       bg: "bg-red-50",          color: "text-red-500" },
  payment_refunded:    { icon: DollarSign,    bg: "bg-purple-50",       color: "text-purple-500" },
  payment_updated:     { icon: CreditCard,    bg: "bg-sky-50",          color: "text-sky-500" },
  announcement:        { icon: Megaphone,     bg: "bg-gray-100",        color: "text-gray-500" },
  promotion:           { icon: Tag,           bg: "bg-rose-50",         color: "text-rose-500" },
  low_stock:           { icon: AlertTriangle, bg: "bg-red-50",          color: "text-red-500" },
  new_review:          { icon: Star,          bg: "bg-amber-50",        color: "text-amber-500" },
  product_approved:    { icon: CheckCircle,   bg: "bg-emerald-50",      color: "text-[#1A9F73]" },
  new_question:        { icon: MessageSquare, bg: "bg-sky-50",          color: "text-sky-500" },
  sales_milestone:     { icon: TrendingUp,    bg: "bg-emerald-50",      color: "text-[#1A9F73]" },
};

const defaultConfig = { icon: Bell, bg: "bg-gray-100", color: "text-gray-500" };

const filterCategories = [
  { label: "All", types: null },
  { label: "Orders", types: ["order_placed", "order_confirmed", "order_shipped", "order_delivered", "order_cancelled"] },
  { label: "Payments", types: ["payment_initiated", "payment_succeeded", "payment_received", "payment_failed", "payment_refunded", "payment_updated"] },
  { label: "Alerts", types: ["low_stock", "new_question"] },
  { label: "Reviews", types: ["new_review"] },
  { label: "Updates", types: ["announcement", "promotion", "product_approved", "sales_milestone"] },
];

function resolveConfig(type) {
  return typeConfig[type] || defaultConfig;
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} Minute${diffMin > 1 ? "s" : ""} Ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} Hour${diffHr > 1 ? "s" : ""} Ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} Days Ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NotificationDetailModal({ notification, onClose, onMarkRead }) {
  const cfg = resolveConfig(notification.type);
  const Icon = cfg.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-[#111827]">Notification Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6B7280] transition-colors hover:bg-gray-100 hover:text-[#111827]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mb-5 flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${cfg.bg}`}>
              <Icon className={`h-7 w-7 ${cfg.color}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[#111827]">{notification.title}</h3>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  notification.isRead
                    ? "bg-gray-100 text-[#6B7280]"
                    : "bg-emerald-50 text-[#1A9F73]"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${notification.isRead ? "bg-gray-400" : "bg-[#1A9F73]"}`} />
                  {notification.isRead ? "Read" : "Unread"}
                </span>
                <span className="text-xs text-[#6B7280]/70">{timeAgo(notification.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-xl bg-gray-50 p-4">
            <p className="text-sm leading-relaxed text-[#6B7280]">{notification.message}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-[#6B7280]">
            <div className="rounded-lg bg-gray-100 px-3 py-1.5 capitalize">
              Type: <span className="font-medium text-[#111827]">{notification.type.replace(/_/g, " ")}</span>
            </div>
            <div className="rounded-lg bg-gray-100 px-3 py-1.5">
              <span className="font-medium text-[#111827]">{new Date(notification.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {!notification.isRead && (
            <button
              onClick={() => {
                onMarkRead(notification._id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A9F73] px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[#178a63]"
            >
              <Check className="h-4 w-4" />
              Mark as read
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-[#6B7280] transition-all duration-200 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationCard({ notification, onSelect }) {
  const cfg = resolveConfig(notification.type);
  const Icon = cfg.icon;

  return (
    <div
      className={`group flex cursor-pointer items-center gap-4 rounded-[16px] bg-white p-5 transition-all duration-200 hover:shadow-md ${
        !notification.isRead ? "border-l-2 border-[#1A9F73]" : ""
      }`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
      onClick={() => onSelect(notification)}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
        <Icon className={`h-5 w-5 ${cfg.color}`} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-[#111827]">{notification.title}</h3>
        <p className="truncate text-sm text-[#6B7280]">{notification.message}</p>
        <span className="text-xs text-[#6B7280]/70">{timeAgo(notification.createdAt)}</span>
      </div>
      {!notification.isRead && (
        <div className="ml-2 shrink-0">
          <span className="block h-2.5 w-2.5 rounded-full bg-[#1A9F73]" />
        </div>
      )}
    </div>
  );
}

export default function Notifications() {
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [readFilter, setReadFilter] = useState("All");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const limit = 10;

  const filteredList = useMemo(() => {
    let result = list;
    const cat = filterCategories.find((f) => f.label === activeFilter);
    if (cat && cat.types) result = result.filter((n) => cat.types.includes(n.type));
    if (readFilter === "Read") result = result.filter((n) => n.isRead);
    if (readFilter === "Unread") result = result.filter((n) => !n.isRead);
    return result;
  }, [list, activeFilter, readFilter]);

  const fetchPage = useCallback(async (pageNum) => {
    const res = await getNotifications(pageNum, limit);
    return res;
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, unreadRes] = await Promise.all([
        fetchPage(1),
        getUnreadCount(),
      ]);
      setList(notifRes.notifications || []);
      setPage(notifRes.pagination?.page || 1);
      setTotalPages(notifRes.pagination?.pages || 1);
      if (unreadRes.success) setUnreadCount(unreadRes.unreadCount);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsReadApi();
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    setList((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markAsReadApi(id);
    } catch {
      // revert on failure
      setList((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

  const handleLoadMore = async () => {
    if (page >= totalPages) return;
    try {
      const res = await fetchPage(page + 1);
      const newItems = res.notifications || [];
      setList((prev) => [...prev, ...newItems]);
      setPage(res.pagination?.page || page + 1);
      setTotalPages(res.pagination?.pages || totalPages);
    } catch (err) {
      console.error("Failed to load more notifications:", err);
    }
  };

  const hasMore = page < totalPages;

  return (
    <Layout>
      <div className="min-h-screen" style={{ backgroundColor: "#F5F6F7" }}>
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8" style={{ maxWidth: "1100px" }}>
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-[#6B7280]">
                Activity Center &bull; Stay updated with your marketplace interactions
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#6B7280] transition-all duration-200 hover:border-[#1A9F73]/30 hover:text-[#1A9F73] hover:shadow-sm disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#1A9F73" }} />
                ) : (
                  <Check className="h-4 w-4" style={{ color: "#1A9F73" }} />
                )}
                Mark all as read
              </button>
            )}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {["All", "Unread", "Read", "Orders", "Payments", "Alerts", "Reviews", "Updates"].map((label) => {
              const isReadTab = label === "Unread" || label === "Read";
              const isAll = label === "All";
              const isActive = isAll
                ? readFilter === "All" && activeFilter === "All"
                : isReadTab
                ? readFilter === label
                : activeFilter === label;
              return (
                <button
                  key={label}
                  onClick={() => {
                    if (isAll) { setReadFilter("All"); setActiveFilter("All"); }
                    else if (isReadTab) { setReadFilter(label); setActiveFilter("All"); }
                    else { setActiveFilter(label); setReadFilter("All"); }
                  }}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#1A9F73] text-white shadow-sm"
                      : "bg-white text-[#6B7280] border border-gray-200 hover:border-[#1A9F73]/30 hover:text-[#1A9F73]"
                  }`}
                >
                  {label}
                  {label === "Unread" && unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#1A9F73" }} />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-[#111827]">No notifications yet</h3>
              <p className="mt-1 text-sm text-[#6B7280]">
                When you get notifications, they'll appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-[14px]">
                {filteredList.map((n) => (
                  <NotificationCard
                    key={n._id}
                    notification={n}
                    onSelect={setSelectedNotification}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    className="rounded-xl border border-gray-200 bg-white px-8 py-3 text-sm font-medium text-[#6B7280] transition-all duration-200 hover:border-gray-300 hover:shadow-md hover:shadow-gray-200/50"
                  >
                    Show more
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkRead={handleMarkAsRead}
        />
      )}
    </Layout>
  );
}
