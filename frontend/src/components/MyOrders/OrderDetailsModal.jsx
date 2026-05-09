import React, { useState } from 'react'
import { X, Package, Truck, CreditCard, MapPin, Clock3, CircleCheckBig } from 'lucide-react'

const formatCurrency = (value) => `\$${Number(value || 0).toFixed(2)}`

const formatDateTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const badgeStyles = {
  PLACED: 'bg-rose-100 text-rose-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
}

const getBadgeClass = (value) => badgeStyles[String(value || '').toUpperCase()] || 'bg-slate-100 text-slate-700'

export function OrderDetailsModal({ isOpen, order, tracking, loading, error, onClose, onRetry }) {
  if (!isOpen) return null

  const [showDebug, setShowDebug] = useState(false)

  const decodeJwt = (token) => {
    try {
      const payload = token?.split('.')?.[1]
      if (!payload) return null
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      return JSON.parse(decodeURIComponent(escape(decoded)))
    } catch (e) {
      return null
    }
  }

  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const decoded = storedToken ? decodeJwt(storedToken) : null
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null

  const trackingEvents =
    tracking?.vendorTracking?.flatMap((segment) => segment.trackingHistory || []) ||
    order?.trackingHistory || []

  const sortedTrackingEvents = [...trackingEvents].sort(
    (left, right) => new Date(left.changedAt || 0) - new Date(right.changedAt || 0)
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Order Details</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
              {order?.orderNumber || tracking?.orderNumber || order?.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
                <p>Loading order details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-red-700">
                <p className="font-semibold">Failed to load order details</p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
                <p className="mt-2 text-xs text-red-600">This usually means your account cannot access this order.</p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full bg-transparent px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-500">If this continues, make sure you are logged in with the buyer account that placed the order or contact support.</p>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setShowDebug((s) => !s)}
                    className="text-xs underline text-slate-600"
                  >
                    {showDebug ? 'Hide debug info' : 'Show debug info'}
                  </button>
                </div>

                {showDebug && (
                  <div className="mt-3 text-left text-xs text-slate-700">
                    <div className="mb-2 font-semibold">Stored token (localStorage.token):</div>
                    <pre className="max-h-24 overflow-auto rounded bg-white p-2 text-[11px] text-slate-700">{storedToken || 'None'}</pre>

                    <div className="mt-2 mb-1 font-semibold">Decoded token payload:</div>
                    <pre className="max-h-40 overflow-auto rounded bg-white p-2 text-[11px] text-slate-700">{decoded ? JSON.stringify(decoded, null, 2) : 'Unable to decode'}</pre>

                    <div className="mt-2 mb-1 font-semibold">Stored local user object (localStorage.user):</div>
                    <pre className="max-h-40 overflow-auto rounded bg-white p-2 text-[11px] text-slate-700">{storedUser || 'None'}</pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClass(order?.status)}`}>
                  {order?.status || 'PLACED'}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClass(order?.paymentStatus)}`}>
                  {String(order?.paymentStatus || 'PENDING').toUpperCase()}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {formatDateTime(tracking?.createdAt || order?.createdAt)}
                </span>
              </div>

              <div className="rounded-3xl bg-emerald-50 p-5">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-600 text-lg font-bold text-white">
                    {order?.initials || 'VN'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold text-slate-900">
                      {order?.vendorName || order?.brand || 'Vendor'}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                      Certified Vendor
                    </p>
                  </div>
                  <Truck className="h-6 w-6 text-emerald-700" />
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-slate-700" />
                  <h3 className="text-lg font-bold text-slate-900">Order Tracking</h3>
                </div>

                <div className="rounded-3xl bg-slate-50 p-5">
                  {sortedTrackingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {sortedTrackingEvents.map((event, index) => {
                        const isActive = index === 0 || event.status === order?.status
                        return (
                          <div key={`${event.status}-${event.changedAt}-${index}`} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div
                                className={`grid h-6 w-6 place-items-center rounded-full ${isActive ? 'bg-emerald-600 text-white' : 'bg-white text-slate-300 ring-1 ring-slate-200'}`}
                              >
                                {isActive ? <CircleCheckBig className="h-4 w-4" /> : null}
                              </div>
                              {index !== sortedTrackingEvents.length - 1 && (
                                <div className="h-full min-h-8 w-px bg-slate-200" />
                              )}
                            </div>
                            <div className="pb-2">
                              <p className="font-semibold text-slate-900">{event.status}</p>
                              <p className="text-sm text-slate-500">
                                {event.note || event.vendorName || 'Status updated'}
                              </p>
                              <p className="text-xs text-slate-400">{formatDateTime(event.changedAt)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <Package className="h-4 w-4" />
                      No tracking events available yet.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-slate-700" />
                  <h3 className="text-lg font-bold text-slate-900">Products</h3>
                </div>

                <div className="space-y-3">
                  {(order?.items || []).map((item) => (
                    <div key={`${item.productId}-${item.productName}`} className="flex items-center gap-4 rounded-2xl border border-slate-100 px-3 py-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-800 text-white">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold">{item.productName?.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{item.productName}</p>
                        <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                      </div>

                      <div className="text-right font-semibold text-emerald-600">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 rounded-3xl bg-slate-50 p-5 sm:grid-cols-2">
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2 text-slate-900">
                    <MapPin className="h-4 w-4" />
                    <span className="font-semibold">Shipping Address</span>
                  </div>
                  <p>{order?.shippingAddress?.fullName || 'N/A'}</p>
                  <p>{order?.shippingAddress?.line1 || 'N/A'}</p>
                  <p>
                    {order?.shippingAddress?.city || ''}
                    {order?.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}
                    {order?.shippingAddress?.country ? `, ${order.shippingAddress.country}` : ''}
                  </p>
                  <p>{order?.shippingAddress?.phone || 'N/A'}</p>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2 text-slate-900">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-semibold">Payment</span>
                  </div>
                  <p>Method: {order?.paymentMethod || 'Card'}</p>
                  <p>Status: {order?.paymentStatus || 'Pending'}</p>
                  <p>Subtotal: {formatCurrency(order?.subtotal)}</p>
                  <p>Discount: {formatCurrency(order?.discountAmount)}</p>
                  <p>Shipping: {formatCurrency(order?.shippingFee)}</p>
                  <p className="text-base font-bold text-emerald-700">Total: {formatCurrency(order?.totalAmount || order?.price)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}