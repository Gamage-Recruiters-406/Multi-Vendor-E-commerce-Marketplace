import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layouts/Layout';
import {
  Download,
  DollarSign,
  Tag,
  ShoppingBag,
  TrendingDown,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  getVendorOrders,
  getMyStores,
  getProductsByStore,
} from '../../services/salesAnalyticsService';

const getLastNMonths = (n = 7) => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('default', { month: 'short' }));
  }
  return months;
};

const CATEGORY_COLORS = ['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6'];

const getCurrentUserRole = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.role || null;
  } catch {
    return null;
  }
};

const SalesAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState({
    revenue: 0,
    orders: 0,
    products: 0,
    avgValue: 0
  });

  const monthLabels = getLastNMonths(7);
  const [revenueData, setRevenueData] = useState(
    monthLabels.map(name => ({ name, value: 0 }))
  );

  const [ordersOverviewData, setOrdersOverviewData] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [lowSellingProducts, setLowSellingProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const ordersData = await getVendorOrders({ limit: 100, sort: 'oldest' });
        const storesData = await getMyStores();

        const orders = ordersData?.success && Array.isArray(ordersData.orders) ? ordersData.orders : [];
        const stores = storesData?.success && Array.isArray(storesData.data) ? storesData.data : [];

        const productCategoryMap = {};
        if (stores.length > 0) {
          for (const store of stores) {
            try {
              const productsData = await getProductsByStore(store._id);
              if (productsData?.success && Array.isArray(productsData.data)) {
                productsData.data.forEach(product => {
                  const catName = product.category?.name || 'Uncategorized';
                  productCategoryMap[String(product._id)] = catName;
                });
              }
            } catch (err) {
              console.error(`Failed to fetch products for store ${store._id}:`, err);
            }
          }
        }

        processOrderData(orders, productCategoryMap);
      } catch (err) {
        console.error('Error fetching sales analytics data:', err);
        setError(err.message || 'Failed to load sales analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const processOrderData = (orders, productCategoryMap = {}) => {
    let totalRev = 0;
    let totalOrd = orders.length;
    let totalProd = 0;
    let nonCancelledOrders = 0;

    const statusCount = { Confirmed: 0, Delivered: 0, Pending: 0, Cancelled: 0 };
    const productsMap = {};
    const recent = [];
    const categoryRevMap = {};

    const months = getLastNMonths(7);
    const monthlyRev = {};
    months.forEach(m => { monthlyRev[m] = 0; });

    orders.forEach(order => {
      const vo = order.vendorOrder;
      if (!vo) return;

      const date = new Date(order.createdAt);
      const month = date.toLocaleString('default', { month: 'short' });

      if (vo.status !== 'Cancelled') {
        const orderTotal = vo.totalAmount || 0;
        totalRev += orderTotal;
        nonCancelledOrders++;
        if (monthlyRev[month] !== undefined) {
          monthlyRev[month] += orderTotal;
        }
      }

      if (vo.status === 'Placed') statusCount.Pending++;
      else if (vo.status === 'Shipped' || vo.status === 'Confirmed') statusCount.Confirmed++;
      else if (vo.status === 'Delivered') statusCount.Delivered++;
      else if (vo.status === 'Cancelled') statusCount.Cancelled++;

      if (vo.items && vo.items.length > 0) {
        vo.items.forEach(item => {
          const itemRevenue = (item.quantity || 0) * (item.unitPrice || 0);

          if (vo.status !== 'Cancelled') {
            totalProd += item.quantity || 0;

            const productId = String(item.productId || '');
            if (!productsMap[productId]) {
              productsMap[productId] = {
                name: item.productName || 'Unknown',
                units: 0,
                revenue: 0,
              };
            }
            productsMap[productId].units += item.quantity || 0;
            productsMap[productId].revenue += itemRevenue;

            const catName = productCategoryMap[productId] || 'Uncategorized';
            if (!categoryRevMap[catName]) categoryRevMap[catName] = 0;
            categoryRevMap[catName] += itemRevenue;
          }

          recent.push({
            date: date.toLocaleDateString(),
            product: item.productName || 'Unknown',
            quantity: item.quantity || 0,
            revenue: `$${itemRevenue.toFixed(2)}`,
            timestamp: date.getTime()
          });
        });
      }
    });

    const avgValue = nonCancelledOrders > 0 ? totalRev / nonCancelledOrders : 0;

    setSummary({
      revenue: totalRev,
      orders: totalOrd,
      products: totalProd,
      avgValue
    });

    const topProds = Object.values(productsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map((p, idx) => ({ ...p, revenue: `$${p.revenue.toLocaleString()}`, isGreen: idx === 0 }));
    setTopSellingProducts(topProds);

    const lowProds = Object.values(productsMap)
      .sort((a, b) => a.units - b.units)
      .slice(0, 3);
    setLowSellingProducts(lowProds);

    recent.sort((a, b) => b.timestamp - a.timestamp);
    setRecentSales(recent.slice(0, 5));

    const totalMapped =
      statusCount.Confirmed + statusCount.Delivered + statusCount.Pending + statusCount.Cancelled;
    if (totalMapped > 0) {
      setOrdersOverviewData([
        { name: 'Confirmed', value: Math.round((statusCount.Confirmed / totalMapped) * 100), color: '#FF8A8A' },
        { name: 'Delivered', value: Math.round((statusCount.Delivered / totalMapped) * 100), color: '#42C2FF' },
        { name: 'Pending', value: Math.round((statusCount.Pending / totalMapped) * 100), color: '#8B5CF6' },
        { name: 'Cancelled', value: Math.round((statusCount.Cancelled / totalMapped) * 100), color: '#FDBA74' },
      ]);
    } else {
      setOrdersOverviewData([]);
    }

    const trend = months.map(name => ({ name, value: Math.round(monthlyRev[name] || 0) }));
    setRevenueData(trend);

    const totalCatRev = Object.values(categoryRevMap).reduce((s, v) => s + v, 0);
    if (totalCatRev > 0) {
      const catEntries = Object.entries(categoryRevMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([name, rev], idx) => ({
          name,
          value: Math.round((rev / totalCatRev) * 100),
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
        }));
      setCategoryData(catEntries);
    } else {
      setCategoryData([]);
    }
  };

  const userRole = useMemo(() => getCurrentUserRole(), []);
  if (userRole !== 'Vendor') {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-emerald-500 mb-1">Sales Analytics</h1>
              <p className="text-gray-400 text-sm">Track your sales journey and performance insights</p>
            </div>
          </div>
          <div className="text-center py-12 text-red-500 font-medium">
            Access denied: Vendors only
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-emerald-500 mb-1">Sales Analytics</h1>
            <p className="text-gray-400 text-sm">Track your sales journey and performance insights</p>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors">
            <Download size={18} />
            Export PDF
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 font-medium text-lg">{error}</p>
            <p className="text-gray-400 text-sm mt-2">Check console for details</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-emerald-400 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-500 text-sm font-medium">Total Revenue</span>
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <DollarSign size={20} className="text-emerald-500" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mb-2">
                  $ {summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-purple-400 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-500 text-sm font-medium">Total Orders</span>
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Tag size={20} className="text-purple-500" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-700 mb-2">{summary.orders}</div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-yellow-400 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-500 text-sm font-medium">Products Sold</span>
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <ShoppingBag size={20} className="text-yellow-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mb-2">{summary.products}</div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-red-400 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-500 text-sm font-medium">Average Order Value</span>
                  <div className="bg-red-100 p-2 rounded-lg">
                    <TrendingDown size={20} className="text-red-500" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-2">$ {summary.avgValue.toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-600 mb-6">Revenue Trend</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip formatter={(val) => [`$${val.toFixed(2)}`, 'Revenue']} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'white', stroke: '#10B981', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center mt-4">
                  <span className="text-2xl font-bold text-emerald-500 mr-4">
                    $ {summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-600 mb-4">Orders Overview</h2>
                {ordersOverviewData.length > 0 ? (
                  <>
                    <div className="relative h-48 flex justify-center items-center">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <PieChart>
                          <Pie
                            data={ordersOverviewData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                          >
                            {ordersOverviewData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => [`${val}%`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-emerald-600">{summary.orders}</span>
                        <span className="text-xs text-gray-500">Orders</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {ordersOverviewData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-gray-600 ml-1">{item.name}</span>
                          </div>
                          <span className="font-medium" style={{ color: item.color }}>{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400">
                    No order data available
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-600 mb-4">Top Selling Products</h2>
                {topSellingProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 font-medium">Product</th>
                          <th className="px-4 py-3 font-medium text-center">Units</th>
                          <th className="px-4 py-3 font-medium text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topSellingProducts.map((product, idx) => (
                          <tr key={idx} className="border-b border-gray-50 last:border-0">
                            <td className={`px-4 py-4 ${product.isGreen ? 'text-emerald-500' : 'text-gray-700 font-medium'}`}>
                              {product.name}
                            </td>
                            <td className={`px-4 py-4 text-center ${product.isGreen ? 'text-emerald-500' : 'text-gray-700 font-medium'}`}>
                              {product.units}
                            </td>
                            <td className={`px-4 py-4 text-right ${product.isGreen ? 'text-emerald-500' : 'text-gray-700 font-medium'}`}>
                              {product.revenue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    No top selling products available
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-600 mb-4">Low Selling Products</h2>
                {lowSellingProducts.length > 0 ? (
                  <>
                    <div className="text-xs text-gray-400 uppercase border-b border-gray-100 pb-2 mb-4 text-center">
                      Product
                    </div>
                    <div className="space-y-4">
                      {lowSellingProducts.map((product, idx) => (
                        <div key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <span className="text-gray-700 font-medium text-sm">{product.name}</span>
                          <span className="text-gray-500 text-sm">{product.units} units</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    No low selling products available
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-600 mb-4">Sales By Category</h2>
                {categoryData.length > 0 ? (
                  <div className="flex items-center">
                    <div className="w-1/2 h-48">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => [`${val}%`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-3 pl-4">
                      {categoryData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-gray-600 text-xs">{item.name}</span>
                          </div>
                          <span className="font-medium text-xs" style={{ color: item.color }}>{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400">
                    No category data available
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-600 mb-4">Recent Sales</h2>
                {recentSales.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Product</th>
                          <th className="px-4 py-3 font-medium text-center">Quantity</th>
                          <th className="px-4 py-3 font-medium text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map((sale, idx) => (
                          <tr key={idx} className="border-b border-gray-50 last:border-0">
                            <td className="px-4 py-3 text-gray-700">{sale.date}</td>
                            <td className="px-4 py-3 text-gray-700 font-medium">{sale.product}</td>
                            <td className="px-4 py-3 text-center text-gray-700">{sale.quantity}</td>
                            <td className="px-4 py-3 text-right text-gray-700">{sale.revenue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    No recent sales available
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default SalesAnalytics;
