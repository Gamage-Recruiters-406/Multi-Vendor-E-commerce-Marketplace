import { useState } from 'react'
import { ArrowLeft, Search, ChevronDown, ClipboardList } from 'lucide-react'
import { Navbar } from '../../components/MyOrders/Navbar.jsx'
import { Footer } from '../../components/MyOrders/Footer.jsx'
import { OrderCard } from '../../components/MyOrders/OrderCard.jsx'

const SAMPLE_ORDERS = [
  {
    id: 'ORD-20240912',
    status: 'DELIVERED',
    brand: 'Velvet Studio',
    date: 'Sep 12, 2024',
    tags: [
      {
        icon: '👜',
        text: 'Leather Tote',
      },
      {
        icon: '🧣',
        text: 'Silk Scarf',
      },
    ],
    price: 450.0,
    initials: 'VS',
  },
  {
    id: 'ORD-20240914',
    status: 'SHIPPED',
    brand: 'Aura Living',
    date: 'Sep 14, 2024',
    tags: [
      {
        icon: '🕯️',
        text: 'Scented Candle Set',
      },
    ],
    price: 89.0,
    initials: 'AL',
  },
  {
    id: 'ORD-20240915',
    status: 'PLACED',
    brand: 'Nordic Crafts',
    date: 'Sep 15, 2024',
    tags: [
      {
        icon: '🎧',
        text: 'Wireless Headphones',
      },
      {
        icon: '🖱️',
        text: 'Minimal Mouse',
      },
    ],
    price: 320.5,
    initials: 'NC',
  },
  {
    id: 'ORD-20240916',
    status: 'CONFIRMED',
    brand: 'Organic Botanics',
    date: 'Today',
    tags: [
      {
        icon: '🌿',
        text: 'Face Serum',
      },
    ],
    price: 55.0,
    initials: 'OB',
  },
]

const FILTER_TABS = ['All', 'Placed', 'Confirmed', 'Shipped', 'Delivered']

export function MyOrders() {
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredOrders = SAMPLE_ORDERS.filter((order) => {
    if (activeFilter === 'All') return true
    return order.status.toLowerCase() === activeFilter.toLowerCase()
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-start gap-4">
            <button className="mt-2 text-emerald-700 hover:text-emerald-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#0A8754] mb-1">
                My Orders
              </h1>
              <p className="text-emerald-600/80 text-sm">
                Track and manage your purchases
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium">
              12 Orders
            </div>
            <button className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors">
              <ClipboardList className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Sort Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Order ID or product..."
              className="w-full bg-white rounded-full py-3 pl-11 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none border-none"
            />
          </div>
          <button className="bg-white px-6 py-3 rounded-full text-sm font-medium shadow-sm flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors min-w-[160px]">
            <span>Date : Newest</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${activeFilter === tab ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Order List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} {...order} />
          ))}
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl shadow-sm">
              No orders found for this filter.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}