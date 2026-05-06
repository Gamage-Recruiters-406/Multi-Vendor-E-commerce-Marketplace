import React from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'

const getStatusStyles = (status) => {
  switch (status) {
    case 'DELIVERED':
      return 'bg-emerald-500 text-white'
    case 'SHIPPED':
      return 'bg-teal-100 text-teal-800'
    case 'PLACED':
      return 'bg-red-400 text-white'
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPriceColor = (status) => {
  return status === 'DELIVERED' ? 'text-amber-500' : 'text-emerald-600'
}

export function OrderCard({
  id,
  status,
  brand,
  date,
  tags,
  price,
  initials,
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6 items-start sm:items-center">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
        {initials}
      </div>

      {/* Details */}
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-bold text-gray-900">{id}</h3>
          <span
            className={`px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${getStatusStyles(status)}`}
          >
            {status}
          </span>
        </div>

        <div className="text-sm text-gray-500">
          {brand} &bull; {date}
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-xs text-gray-600 border border-gray-100"
            >
              <span>{tag.icon}</span>
              <span>{tag.text}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Price & Actions */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 sm:gap-2 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
        <div className="text-right">
          <div className={`text-2xl font-bold ${getPriceColor(status)}`}>
            ${price.toFixed(2)}
          </div>
          <div className="flex items-center justify-end gap-1 text-emerald-600 text-xs font-bold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PAID
          </div>
        </div>

        <button className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 group transition-colors">
          View details
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  )
}