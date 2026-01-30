import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import {
  Download, Calendar, TrendingUp, TrendingDown, Users, Receipt, Package, Crown,
  BarChart3, PieChart, Wallet, CreditCard, QrCode, Clock, ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { exportToExcel, exportMultipleSheets } from '../utils/excelExport';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';

export const ReportsPage = () => {
  // State declarations
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expenses, setExpenses] = useState([]);


  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [transRes, custRes, memRes, invRes, shiftRes, expRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/customers'),
        api.get('/memberships'),
        api.get('/inventory'),
        api.get('/shifts'),
        api.get('/expenses'), // Fetch Expenses
      ]);

      setTransactions(transRes.data);
      setCustomers(custRes.data);
      setMemberships(memRes.data);
      setInventory(invRes.data);
      setShifts(shiftRes.data);
      setShifts(shiftRes.data);
      setExpenses(expRes.data);



    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Gagal memuat data reports');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions AND expenses by date range
  const { filteredTransactions, filteredExpenses } = useMemo(() => {
    const now = new Date();
    let start, end = now;
    // ... (date logic same as before) ...
    if (dateRange === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === 'week') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === 'month') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === 'year') {
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else if (dateRange === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // For 'all', just return everything
      return {
        filteredTransactions: transactions,
        filteredExpenses: expenses
      };
    }

    const ft = transactions.filter(t => {
      const d = new Date(t.created_at);
      return d >= start && d <= end;
    });

    const fe = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    return { filteredTransactions: ft, filteredExpenses: fe };
  }, [transactions, expenses, dateRange, startDate, endDate]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalCount = filteredTransactions.length;
    const avgTransaction = totalCount > 0 ? totalRevenue / totalCount : 0;

    // Financials
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // ... (rest of analytics) ...
    const paymentBreakdown = { cash: 0, card: 0, qr: 0, subscription: 0 };
    filteredTransactions.forEach(t => {
      paymentBreakdown[t.payment_method] = (paymentBreakdown[t.payment_method] || 0) + t.total;
    });

    // ... (dailyRevenue logic) ...
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayRevenue = transactions
        .filter(t => new Date(t.created_at) >= dayStart && new Date(t.created_at) < dayEnd)
        .reduce((sum, t) => sum + t.total, 0);

      // Also get daily expenses for comparison (optional, but good)
      // For simplified chart, sticking to revenue

      dailyRevenue.push({
        day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        revenue: dayRevenue,
      });
    }

    // Top Services, Hourly, Customers... (same as before)
    const serviceCount = {};
    filteredTransactions.forEach(t => {
      t.items?.forEach(item => {
        const name = item.service_name || item.product_name || 'Unknown';
        serviceCount[name] = (serviceCount[name] || 0) + item.quantity;
      });
    });
    const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const hourlyDistribution = Array(24).fill(0);
    filteredTransactions.forEach(t => {
      const hour = new Date(t.created_at).getHours();
      hourlyDistribution[hour]++;
    });
    const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));

    const customerSpending = {};
    filteredTransactions.forEach(t => {
      if (t.customer_name) customerSpending[t.customer_name] = (customerSpending[t.customer_name] || 0) + t.total;
    });
    const topCustomers = Object.entries(customerSpending).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      totalCount,
      avgTransaction,
      paymentBreakdown,
      dailyRevenue,
      topServices,
      hourlyDistribution,
      peakHour,
      topCustomers,
    };
  }, [filteredTransactions, filteredExpenses, transactions]); // Added filteredExpenses dependency

  // ... (Commission, UsersMap, Inventory, Membership, Export handlers same as before) ...









  // Inventory analytics
  const inventoryAnalytics = useMemo(() => {
    const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0);
    const lowStock = inventory.filter(item => item.current_stock <= item.min_stock);
    const totalItems = inventory.reduce((sum, item) => sum + item.current_stock, 0);

    return { totalValue, lowStock, totalItems };
  }, [inventory]);

  // Membership analytics
  const membershipAnalytics = useMemo(() => {
    const active = memberships.filter(m => m.status === 'active');
    const expiringSoon = active.filter(m => m.days_remaining <= 7);
    const totalRevenue = memberships.reduce((sum, m) => sum + (m.price || 0), 0);

    return { active: active.length, expiringSoon: expiringSoon.length, totalRevenue };
  }, [memberships]);

  // Export handlers
  const handleExportSales = () => {
    const salesData = filteredTransactions.map(t => ({
      'Invoice': t.invoice_number,
      'Tanggal': new Date(t.created_at).toLocaleDateString('id-ID'),
      'Waktu': new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      'Kasir': t.kasir_name,
      'Customer': t.customer_name || 'Walk-in',
      'Items': t.items?.map(i => i.service_name).join(', ') || '-',
      'Total': t.total,
      'Payment Method': t.payment_method,
    }));

    const success = exportToExcel(salesData, `sales-report-${new Date().toISOString().split('T')[0]}`, 'Sales Report');
    if (success) toast.success('Sales report berhasil di-export');
    else toast.error('Gagal export report');
  };

  const handleExportInventory = () => {
    const inventoryData = inventory.map(item => ({
      'SKU': item.sku,
      'Nama Produk': item.name,
      'Kategori': item.category,
      'Stok': item.current_stock,
      'Unit': item.unit,
      'Min Stock': item.min_stock,
      'Max Stock': item.max_stock,
      'HPP per Unit': item.unit_cost,
      'Total Nilai': item.current_stock * item.unit_cost,
      'Supplier': item.supplier || '-',
    }));

    const success = exportToExcel(inventoryData, `inventory-report-${new Date().toISOString().split('T')[0]}`, 'Inventory Report');
    if (success) toast.success('Inventory report berhasil di-export');
    else toast.error('Gagal export report');
  };

  const handleExportAll = () => {
    const sheets = [
      {
        data: transactions.map(t => ({
          'Invoice': t.invoice_number,
          'Tanggal': new Date(t.created_at).toLocaleString('id-ID'),
          'Kasir': t.kasir_name,
          'Customer': t.customer_name || 'Walk-in',
          'Total': t.total,
          'Payment': t.payment_method,
        })),
        sheetName: 'Sales',
      },
      {
        data: inventory.map(item => ({
          'SKU': item.sku,
          'Produk': item.name,
          'Stok': item.current_stock,
          'HPP': item.unit_cost,
          'Total Nilai': item.current_stock * item.unit_cost,
        })),
        sheetName: 'Inventory',
      },
      {
        data: customers.map(c => ({
          'Nama': c.name,
          'Telepon': c.phone,
          'Total Kunjungan': c.total_visits,
          'Total Belanja': c.total_spending,
        })),
        sheetName: 'Customers',
      },
      {
        data: memberships.map(m => ({
          'Customer': m.customer_name,
          'Tipe': m.membership_type,
          'Status': m.status,
          'Harga': m.price,
        })),
        sheetName: 'Memberships',
      },
    ];

    const success = exportMultipleSheets(sheets, `complete-report-${new Date().toISOString().split('T')[0]}`);
    if (success) toast.success('Complete report berhasil di-export');
    else toast.error('Gagal export report');
  };

  // Simple bar chart component
  const BarChart = ({ data, maxValue }) => {
    const max = maxValue || Math.max(...data.map(d => d.revenue), 1);
    return (
      <div className="flex items-end gap-1 h-32">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-gradient-to-t from-[#D4AF37] to-[#F59E0B] rounded-t"
              style={{ height: `${(item.revenue / max) * 100}%`, minHeight: item.revenue > 0 ? '4px' : '0' }}
            />
            <p className="text-xs text-zinc-500 mt-1">{item.day}</p>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading reports...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in" data-testid="reports-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-1">Analytics</p>
            <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36 bg-[#18181b] border-zinc-800 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">7 Hari</SelectItem>
                <SelectItem value="month">30 Hari</SelectItem>
                <SelectItem value="year">1 Tahun</SelectItem>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExportAll} className="bg-[#D4AF37] text-black hover:bg-[#B5952F]">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>


        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <div className="flex gap-4 mb-6 bg-[#18181b] border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Label className="text-zinc-400 text-sm">Dari:</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-zinc-400 text-sm">Sampai:</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white w-40"
                  />
                </div>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                  <span className="text-xs text-zinc-500">{dateRange === 'all' ? 'All Time' : dateRange}</span>
                </div>
                <p className="text-zinc-500 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-[#D4AF37]">Rp {analytics.totalRevenue.toLocaleString('id-ID')}</p>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Receipt className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-zinc-500 text-sm">Transaksi</p>
                <p className="text-2xl font-bold text-white">{analytics.totalCount}</p>
                <p className="text-xs text-zinc-500 mt-1">Avg: Rp {Math.round(analytics.avgTransaction).toLocaleString('id-ID')}</p>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-zinc-500 text-sm">Total Customers</p>
                <p className="text-2xl font-bold text-white">{customers.length}</p>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Crown className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-zinc-500 text-sm">Active Members</p>
                <p className="text-2xl font-bold text-white">{membershipAnalytics.active}</p>
                {membershipAnalytics.expiringSoon > 0 && (
                  <p className="text-xs text-amber-400 mt-1">⚠️ {membershipAnalytics.expiringSoon} expiring soon</p>
                )}
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Daily Revenue Chart */}
              <div className="col-span-2 bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
                    Revenue 7 Hari Terakhir
                  </h3>
                </div>
                <BarChart data={analytics.dailyRevenue} />
                <div className="flex justify-between mt-2 text-xs text-zinc-500">
                  <span>Total: Rp {analytics.dailyRevenue.reduce((sum, d) => sum + d.revenue, 0).toLocaleString('id-ID')}</span>
                  <span>Avg: Rp {Math.round(analytics.dailyRevenue.reduce((sum, d) => sum + d.revenue, 0) / 7).toLocaleString('id-ID')}/hari</span>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                  <PieChart className="w-4 h-4 text-[#D4AF37]" />
                  Payment Methods
                </h3>
                <div className="space-y-3">
                  {[
                    { method: 'cash', icon: Wallet, color: 'bg-green-500', label: 'Cash' },
                    { method: 'card', icon: CreditCard, color: 'bg-blue-500', label: 'Card' },
                    { method: 'qr', icon: QrCode, color: 'bg-purple-500', label: 'QRIS' },
                    { method: 'subscription', icon: Crown, color: 'bg-[#D4AF37]', label: 'Member' },
                  ].map(({ method, icon: Icon, color, label }) => {
                    const value = analytics.paymentBreakdown[method] || 0;
                    const percentage = analytics.totalRevenue > 0 ? (value / analytics.totalRevenue) * 100 : 0;
                    return (
                      <div key={method}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-2 text-zinc-400">
                            <Icon className="w-3 h-3" />
                            {label}
                          </span>
                          <span className="text-white font-mono">Rp {value.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Top Services */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                  Layanan Terpopuler
                </h3>
                {analytics.topServices.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topServices.map(([name, count], i) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold rounded flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-white text-sm truncate">{name}</span>
                        </div>
                        <span className="text-zinc-400 text-sm font-mono">{count}x</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm text-center py-4">Belum ada data</p>
                )}
              </div>

              {/* Top Customers */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-[#D4AF37]" />
                  Top Customers
                </h3>
                {analytics.topCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topCustomers.map(([name, spending], i) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold rounded flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-white text-sm truncate">{name}</span>
                        </div>
                        <span className="text-[#D4AF37] text-sm font-mono">Rp {spending.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm text-center py-4">Belum ada data</p>
                )}
              </div>

              {/* Business Insights */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                  Business Insights
                </h3>
                <div className="space-y-4">
                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-zinc-500 text-xs mb-1">Peak Hour</p>
                    <p className="text-white font-semibold">{String(analytics.peakHour).padStart(2, '0')}:00 - {String(analytics.peakHour + 1).padStart(2, '0')}:00</p>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-zinc-500 text-xs mb-1">Inventory Value</p>
                    <p className="text-white font-semibold">Rp {inventoryAnalytics.totalValue.toLocaleString('id-ID')}</p>
                  </div>
                  {inventoryAnalytics.lowStock.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 text-xs mb-1">⚠️ Low Stock Alert</p>
                      <p className="text-white text-sm">{inventoryAnalytics.lowStock.length} items need restock</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Export Section */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Export Reports</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={handleExportSales}
                  data-testid="export-sales-report"
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-left hover:border-[#D4AF37]/50 transition-all group"
                >
                  <Download className="w-5 h-5 text-[#D4AF37] mb-2" />
                  <h3 className="font-medium text-white text-sm group-hover:text-[#D4AF37]">Sales Report</h3>
                  <p className="text-xs text-zinc-500">{filteredTransactions.length} transaksi</p>
                </button>

                <button
                  onClick={handleExportInventory}
                  data-testid="export-inventory-report"
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-left hover:border-[#D4AF37]/50 transition-all group"
                >
                  <Package className="w-5 h-5 text-[#D4AF37] mb-2" />
                  <h3 className="font-medium text-white text-sm group-hover:text-[#D4AF37]">Inventory</h3>
                  <p className="text-xs text-zinc-500">{inventory.length} items</p>
                </button>

                <button
                  onClick={() => {
                    const customerData = customers.map(c => ({
                      'Nama': c.name,
                      'Telepon': c.phone,
                      'Email': c.email || '-',
                      'Total Kunjungan': c.total_visits,
                      'Total Belanja': c.total_spending,
                    }));
                    if (exportToExcel(customerData, `customers-${new Date().toISOString().split('T')[0]}`, 'Customers')) {
                      toast.success('Customer report exported');
                    }
                  }}
                  data-testid="export-customers-report"
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-left hover:border-[#D4AF37]/50 transition-all group"
                >
                  <Users className="w-5 h-5 text-[#D4AF37] mb-2" />
                  <h3 className="font-medium text-white text-sm group-hover:text-[#D4AF37]">Customers</h3>
                  <p className="text-xs text-zinc-500">{customers.length} customers</p>
                </button>

                <button
                  onClick={() => {
                    const membershipData = memberships.map(m => ({
                      'Customer': m.customer_name,
                      'Tipe': m.membership_type,
                      'Status': m.status,
                      'Sisa Hari': m.days_remaining,
                      'Harga': m.price,
                    }));
                    if (exportToExcel(membershipData, `memberships-${new Date().toISOString().split('T')[0]}`, 'Memberships')) {
                      toast.success('Membership report exported');
                    }
                  }}
                  data-testid="export-memberships-report"
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-left hover:border-[#D4AF37]/50 transition-all group"
                >
                  <Crown className="w-5 h-5 text-[#D4AF37] mb-2" />
                  <h3 className="font-medium text-white text-sm group-hover:text-[#D4AF37]">Memberships</h3>
                  <p className="text-xs text-zinc-500">{memberships.length} members</p>
                </button>
              </div>
            </div>

          </TabsContent>
        </Tabs>
      </div>
    </Layout >
  );
};