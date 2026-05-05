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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  getPaidPaymentsForStore,
  getMyStores,
  getProductsByStore,
} from '../../services/salesAnalyticsService';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getLastNMonths = (n = 7) => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('default', { month: 'short' }));
  }
  return months;
};

const CATEGORY_COLORS = [
  '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6',
];

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

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const SalesAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [summary, setSummary] = useState({
    revenue: 0,
    orders: 0,
    products: 0,
    avgValue: 0,
  });

  const monthLabels = getLastNMonths(7);
  const [revenueData, setRevenueData] = useState(
    monthLabels.map(name => ({ name, value: 0 }))
  );

  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [lowSellingProducts, setLowSellingProducts] = useState([]);
  const [recentSales, setRecentSales]               = useState([]);
  const [categoryData, setCategoryData]             = useState([]);
  const [ordersOverviewData, setOrdersOverviewData] = useState([]);

  // ── fetch everything on mount ──────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Get all stores for this vendor
        const storesData = await getMyStores();
        const stores =
          storesData?.success && Array.isArray(storesData.data)
            ? storesData.data
            : [];

        if (stores.length === 0) {
          // No stores → nothing to show; leave everything at defaults
          setLoading(false);
          return;
        }

        // 2. Build product → category map AND vendor product ID set across all stores
        const productCategoryMap = {};
        const vendorProductIds   = new Set();
        for (const store of stores) {
          try {
            const productsData = await getProductsByStore(store._id);
            if (productsData?.success && Array.isArray(productsData.data)) {
              productsData.data.forEach(product => {
                const pid = String(product._id);
                vendorProductIds.add(pid);
                productCategoryMap[pid] = product.category?.name || 'Uncategorized';
              });
            }
          } catch (err) {
            console.error(`Failed to fetch products for store ${store._id}:`, err);
          }
        }

        // 3. Fetch paid payments for every store (with a generous limit so we
        //    get a full picture; the backend paginates but analytics wants all)
        const allPayments = [];
        for (const store of stores) {
          try {
            const result = await getPaidPaymentsForStore(store._id, { limit: 500 });
            if (result?.success && Array.isArray(result.payments)) {
              allPayments.push(...result.payments);
            }
          } catch (err) {
            console.error(`Failed to fetch payments for store ${store._id}:`, err);
          }
        }

        processPaymentData(allPayments, productCategoryMap, stores, vendorProductIds);
      } catch (err) {
        console.error('Error fetching sales analytics data:', err);
        setError(err.message || 'Failed to load sales analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ── process raw payment records ────────────────────────────────────────────
  const processPaymentData = (payments, productCategoryMap = {}, stores = [], vendorProductIds = new Set()) => {
    // Build a set of store IDs belonging to this vendor so we can filter
    // storePayments correctly when a payment spans multiple stores.
    const myStoreIds = new Set(stores.map(s => String(s._id)));

    let totalRev  = 0;
    let totalProd = 0;

    const productsMap    = {};
    const categoryRevMap = {};
    const recent         = [];

    const months     = getLastNMonths(7);
    const monthlyRev = {};
    months.forEach(m => { monthlyRev[m] = 0; });

    payments.forEach(payment => {
      const paymentDate = new Date(payment.paymentDate || payment.createdAt);
      const month       = paymentDate.toLocaleString('default', { month: 'short' });

      // Find the storePayment entry that belongs to one of this vendor's stores
      const myStorePayment = (payment.storePayments || []).find(sp =>
        myStoreIds.has(String(sp.storeId?._id || sp.storeId))
      );

      // Revenue = netAmount credited to this vendor's store for this payment
      const storeRevenue = myStorePayment?.netAmount ?? 0;
      totalRev += storeRevenue;

      if (monthlyRev[month] !== undefined) {
        monthlyRev[month] += storeRevenue;
      }

      // Cart items — only count products that belong to THIS vendor's stores.
      // A cart can hold items from multiple vendors; we must not count others.
      const cartItems = payment.cartId?.items || [];

      cartItems.forEach(cartItem => {
        const product = cartItem.product_id;
        if (!product) return;

        const productId = String(product._id || '');

        // Skip products that don't belong to this vendor (when the set is populated)
        if (vendorProductIds.size > 0 && !vendorProductIds.has(productId)) return;

        const productName = product.name || 'Unknown';
        const qty         = cartItem.quantity || 0;
        // Use cartItem.price (purchase-time price) for accuracy;
        // fall back to current product.price if not available.
        const unitPrice   = cartItem.price || product.price || 0;
        const itemRevenue = qty * unitPrice;

        totalProd += qty;

        if (!productsMap[productId]) {
          productsMap[productId] = { name: productName, units: 0, revenue: 0 };
        }
        productsMap[productId].units   += qty;
        productsMap[productId].revenue += itemRevenue;

        // Category mapping
        const catName = productCategoryMap[productId] || 'Uncategorized';
        if (!categoryRevMap[catName]) categoryRevMap[catName] = 0;
        categoryRevMap[catName] += itemRevenue;

        // Recent sales list
        recent.push({
          date:      paymentDate.toLocaleDateString(),
          product:   productName,
          quantity:  qty,
          revenue:   `$${itemRevenue.toFixed(2)}`,
          timestamp: paymentDate.getTime(),
        });
      });
    });

    const totalOrders = payments.length;
    const avgValue    = totalOrders > 0 ? totalRev / totalOrders : 0;

    setSummary({ revenue: totalRev, orders: totalOrders, products: totalProd, avgValue });

    // Top selling products
    const topProds = Object.values(productsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map((p, idx) => ({
        ...p,
        revenue: `$${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        isGreen: idx === 0,
      }));
    setTopSellingProducts(topProds);

    // Low selling products
    const lowProds = Object.values(productsMap)
      .sort((a, b) => a.units - b.units)
      .slice(0, 3);
    setLowSellingProducts(lowProds);

    // Recent sales (newest first, top 5)
    recent.sort((a, b) => b.timestamp - a.timestamp);
    setRecentSales(recent.slice(0, 5));

    // Revenue trend over last 7 months
    const trend = months.map(name => ({ name, value: Math.round(monthlyRev[name] || 0) }));
    setRevenueData(trend);

    // Orders Overview — payment count per last 4 months (meaningful donut slices)
    const overviewColors = ['#FF8A8A', '#42C2FF', '#8B5CF6', '#FDBA74'];
    const last4 = getLastNMonths(4);
    const monthlyCounts = {};
    last4.forEach(m => { monthlyCounts[m] = 0; });
    payments.forEach(pmt => {
      const m = new Date(pmt.paymentDate || pmt.createdAt)
        .toLocaleString('default', { month: 'short' });
      if (monthlyCounts[m] !== undefined) monthlyCounts[m]++;
    });
    const totalCounts = Object.values(monthlyCounts).reduce((s, v) => s + v, 0);
    if (totalCounts > 0) {
      setOrdersOverviewData(
        last4.map((name, idx) => ({
          name,
          value: Math.round((monthlyCounts[name] / totalCounts) * 100),
          color: overviewColors[idx % overviewColors.length],
        })).filter(e => e.value > 0)
      );
    } else {
      setOrdersOverviewData([]);
    }

    // Category breakdown
    const totalCatRev = Object.values(categoryRevMap).reduce((s, v) => s + v, 0);
    if (totalCatRev > 0) {
      const catEntries = Object.entries(categoryRevMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([name, rev], idx) => ({
          name,
          value: Math.round((rev / totalCatRev) * 100),
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        }));
      setCategoryData(catEntries);
    } else {
      setCategoryData([]);
    }
  };

  // ── PDF export ─────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const now   = new Date();

      // ── Header bar ──────────────────────────────────────────────────────────
      doc.setFillColor(16, 185, 129);          // emerald-500
      doc.rect(0, 0, pageW, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales Analytics Report', 14, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${now.toLocaleString()}`, pageW - 14, 14, { align: 'right' });

      // ── Summary cards ───────────────────────────────────────────────────────
      doc.setTextColor(55, 65, 81);            // gray-700
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, 34);

      const cards = [
        { label: 'Total Revenue',       value: `$${summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'Total Payments',      value: String(summary.orders) },
        { label: 'Products Sold',       value: String(summary.products) },
        { label: 'Avg. Payment Value',  value: `$${summary.avgValue.toFixed(2)}` },
      ];

      autoTable(doc, {
        startY: 38,
        head: [cards.map(c => c.label)],
        body: [cards.map(c => c.value)],
        headStyles:  { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles:  { fontSize: 11, fontStyle: 'bold', halign: 'center' },
        columnStyles: { 0: { textColor: [5, 150, 105] }, 1: { textColor: [109, 40, 217] }, 2: { textColor: [161, 98, 7] }, 3: { textColor: [220, 38, 38] } },
        margin: { left: 14, right: 14 },
      });

      // ── Revenue Trend ────────────────────────────────────────────────────────
      let y = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('Revenue Trend (Last 7 Months)', 14, y);

      autoTable(doc, {
        startY: y + 4,
        head: [['Month', 'Revenue ($)']],
        body: revenueData.map(r => [r.name, `$${r.value.toLocaleString()}`]),
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: { 1: { halign: 'right' } },
      });

      // ── Top Selling Products ─────────────────────────────────────────────────
      y = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('Top Selling Products', 14, y);

      if (topSellingProducts.length > 0) {
        autoTable(doc, {
          startY: y + 4,
          head: [['Product', 'Units Sold', 'Revenue']],
          body: topSellingProducts.map(p => [p.name, p.units, p.revenue]),
          headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
          columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
        });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text('No data available', 14, y + 8);
        doc.lastAutoTable = { finalY: y + 12 };
      }

      // ── Low Selling Products ─────────────────────────────────────────────────
      y = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('Low Selling Products', 14, y);

      if (lowSellingProducts.length > 0) {
        autoTable(doc, {
          startY: y + 4,
          head: [['Product', 'Units Sold']],
          body: lowSellingProducts.map(p => [p.name, p.units]),
          headStyles: { fillColor: [251, 146, 60], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
          columnStyles: { 1: { halign: 'center' } },
        });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text('No data available', 14, y + 8);
        doc.lastAutoTable = { finalY: y + 12 };
      }

      // ── Recent Sales ─────────────────────────────────────────────────────────
      y = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('Recent Sales', 14, y);

      if (recentSales.length > 0) {
        autoTable(doc, {
          startY: y + 4,
          head: [['Date', 'Product', 'Quantity', 'Revenue']],
          body: recentSales.map(s => [s.date, s.product, s.quantity, s.revenue]),
          headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
          columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' } },
        });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text('No data available', 14, y + 8);
      }

      // ── Footer on every page ─────────────────────────────────────────────────
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `Page ${i} of ${totalPages}  |  Sales Analytics — Confidential`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }

      doc.save(`sales-analytics-${now.toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  // ── role guard ─────────────────────────────────────────────────────────────
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

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-emerald-500 mb-1">Sales Analytics</h1>
            <p className="text-gray-400 text-sm">Track your sales journey and performance insights</p>
          </div>
          <button
            onClick={exportPDF}
            disabled={exporting || loading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            {exporting ? 'Generating…' : 'Export PDF'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 font-medium text-lg">{error}</p>
            <p className="text-gray-400 text-sm mt-2">Check console for details</p>
          </div>
        ) : (
          <>
            {/* ── Summary cards ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Revenue */}
              <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-emerald-400 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-500 text-sm font-medium">Total Revenue</span>
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <DollarSign size={20} className="text-emerald-500" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mb-2">
                  ${summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Total Payments */}
              <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-purple-400 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-500 text-sm font-medium">Total Payments</span>
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Tag size={20} className="text-purple-500" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-700 mb-2">{summary.orders}</div>
              </div>

              {/* Products Sold */}
              <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-yellow-400 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-500 text-sm font-medium">Products Sold</span>
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <ShoppingBag size={20} className="text-yellow-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mb-2">{summary.products}</div>
              </div>

              {/* Average Payment Value */}
              <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-red-400 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-500 text-sm font-medium">Avg. Payment Value</span>
                  <div className="bg-red-100 p-2 rounded-lg">
                    <TrendingDown size={20} className="text-red-500" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-2">
                  ${summary.avgValue.toFixed(2)}
                </div>
              </div>
            </div>

            {/* ── Revenue trend + placeholder overview ────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Revenue Trend chart */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-600 mb-6">Revenue Trend</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis
                        dataKey="name"
                        axisLine={true}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={value => `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
                      />
                      <Tooltip formatter={val => [`$${val.toFixed(2)}`, 'Revenue']} />
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
                    ${summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Orders Overview panel */}
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
                          <Tooltip formatter={val => [`${val}%`, '']} />
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
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
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

            {/* ── Top / Low selling products ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Top Selling Products */}
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
                  <div className="py-8 text-center text-gray-400">No top selling products available</div>
                )}
              </div>

              {/* Low Selling Products */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-600 mb-4">Low Selling Products</h2>
                {lowSellingProducts.length > 0 ? (
                  <>
                    <div className="text-xs text-gray-400 uppercase border-b border-gray-100 pb-2 mb-4 text-center">
                      Product
                    </div>
                    <div className="space-y-4">
                      {lowSellingProducts.map((product, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <span className="text-gray-700 font-medium text-sm">{product.name}</span>
                          <span className="text-gray-500 text-sm">{product.units} units</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-400">No low selling products available</div>
                )}
              </div>
            </div>

            {/* ── Category breakdown + Recent sales ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales By Category */}
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
                          <Tooltip formatter={val => [`${val}%`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-3 pl-4">
                      {categoryData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-gray-600 text-xs">{item.name}</span>
                          </div>
                          <span className="font-medium text-xs" style={{ color: item.color }}>
                            {item.value}%
                          </span>
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

              {/* Recent Sales */}
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
                  <div className="py-8 text-center text-gray-400">No recent sales available</div>
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
