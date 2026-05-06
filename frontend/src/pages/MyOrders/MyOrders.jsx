import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, ChevronDown, ClipboardList } from 'lucide-react'
import Header from '../../components/Layouts/Header'
import Footer from '../../components/Layouts/Footer'
import { OrderCard } from '../../components/MyOrders/OrderCard.jsx'
import { getBuyerOrders } from '../../api/buyerOrders.js'
import toast from 'react-hot-toast'

const FILTER_TABS = ['All', 'Placed', 'Confirmed', 'Shipped', 'Delivered']

export function MyOrders() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All')
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getBuyerOrders()
        setOrders(data)
      } catch (err) {
        console.error('Failed to fetch orders:', err)
        
        // Check if error is due to unauthorized access
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          toast.error('Please login to view your orders')
          navigate('/login')
          return
        }
        
        setError(err.message || 'Failed to load orders')
        toast.error('Failed to load orders')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [navigate])

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'All') return true
    return order.status.toLowerCase() === activeFilter.toLowerCase()
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-start gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="mt-2 text-emerald-700 hover:text-emerald-900 transition-colors"
            >
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
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </div>
            <button className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors">
              <ClipboardList className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500"></div>
              <p className="text-gray-500">Loading your orders...</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && (
          <>
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
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <OrderCard key={order.id} {...order} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white rounded-2xl shadow-sm">
                  {orders.length === 0 ? 'You have no orders yet' : 'No orders found for this filter.'}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}