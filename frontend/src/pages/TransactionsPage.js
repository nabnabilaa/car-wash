import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import {
  Download, Search, Eye, Calendar, Receipt, TrendingUp, CreditCard, Wallet, QrCode,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { exportToExcel } from '../utils/excelExport';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, paymentFilter, startDate, endDate]);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.invoice_number.toLowerCase().includes(term) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(term)) ||
        t.kasir_name.toLowerCase().includes(term)
      );
    }

    // Payment method filter
    if (paymentFilter !== 'all') {
      result = result.filter(t => t.payment_method === paymentFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter(t => new Date(t.created_at) >= today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(t => new Date(t.created_at) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(t => new Date(t.created_at) >= monthAgo);
    } else if (dateFilter === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => {
        const txDate = new Date(t.created_at);
        return txDate >= start && txDate <= end;
      });
    }

    return result;
  }, [transactions, searchTerm, dateFilter, paymentFilter, startDate, endDate]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Statistics
  const stats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalCount = filteredTransactions.length;
    const avgTransaction = totalCount > 0 ? totalRevenue / totalCount : 0;

    const paymentBreakdown = { cash: 0, card: 0, qr: 0, subscription: 0 };
    filteredTransactions.forEach(t => {
      paymentBreakdown[t.payment_method] = (paymentBreakdown[t.payment_method] || 0) + t.total;
    });

    return { totalRevenue, totalCount, avgTransaction, paymentBreakdown };
  }, [filteredTransactions]);

  const handleViewDetail = async (transaction) => {
    try {
      const response = await api.get(`/transactions/${transaction.id}`);
      setSelectedTransaction(response.data);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('Gagal memuat detail transaksi');
    }
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map(t => ({
      'Invoice': t.invoice_number,
      'Tanggal': new Date(t.created_at).toLocaleDateString('id-ID'),
      'Waktu': new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      'Kasir': t.kasir_name,
      'Customer': t.customer_name || 'Walk-in',
      'Items': t.items.map(i => i.service_name).join(', '),
      'Subtotal': t.subtotal,
      'Total': t.total,
      'Metode': t.payment_method,
      'Diterima': t.payment_received,
      'Kembalian': t.change_amount,
      'Catatan': t.notes || '-',
    }));

    const success = exportToExcel(
      exportData,
      `transactions-${new Date().toISOString().split('T')[0]}`,
      'Transactions'
    );

    if (success) {
      toast.success(`${filteredTransactions.length} transaksi berhasil di-export`);
    } else {
      toast.error('Gagal export data');
    }
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash': return <Wallet className="w-3 h-3" />;
      case 'card': return <CreditCard className="w-3 h-3" />;
      case 'qr': return <QrCode className="w-3 h-3" />;
      case 'subscription': return <Crown className="w-3 h-3" />;
      default: return null;
    }
  };

  const getPaymentColor = (method) => {
    switch (method) {
      case 'cash': return 'bg-green-500/20 text-green-400';
      case 'card': return 'bg-blue-500/20 text-blue-400';
      case 'qr': return 'bg-purple-500/20 text-purple-400';
      case 'subscription': return 'bg-[#D4AF37]/20 text-[#D4AF37]';
      default: return 'bg-zinc-800 text-white';
    }
  };

  return (
    <Layout>
      <div className="animate-fade-in" data-testid="transactions-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-1">Transaksi</p>
            <h1 className="text-3xl font-bold text-white">
              {currentUser.role === 'kasir' ? 'Transaksi Saya' : 'Riwayat Transaksi'}
            </h1>
          </div>
          <Button
            onClick={handleExport}
            data-testid="export-transactions-button"
            className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export ({filteredTransactions.length})
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Receipt className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-zinc-500 text-sm">Total Transaksi</p>
            <p className="text-2xl font-bold text-white">{stats.totalCount}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <TrendingUp className="w-5 h-5 text-[#D4AF37] mb-2" />
            <p className="text-zinc-500 text-sm">Total Revenue</p>
            <p className="text-xl font-bold text-[#D4AF37]">Rp {stats.totalRevenue.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-zinc-500 text-sm">Rata-rata</p>
            <p className="text-xl font-bold text-white">Rp {Math.round(stats.avgTransaction).toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-green-400" />
              <CreditCard className="w-4 h-4 text-blue-400" />
              <QrCode className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-zinc-500 text-sm">Payment Split</p>
            <div className="flex gap-2 mt-1">
              {stats.paymentBreakdown.cash > 0 && (
                <span className="text-xs text-green-400">Cash: {Math.round(stats.paymentBreakdown.cash / 1000)}K</span>
              )}
              {stats.paymentBreakdown.card > 0 && (
                <span className="text-xs text-blue-400">Card: {Math.round(stats.paymentBreakdown.card / 1000)}K</span>
              )}
              {stats.paymentBreakdown.qr > 0 && (
                <span className="text-xs text-purple-400">QR: {Math.round(stats.paymentBreakdown.qr / 1000)}K</span>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-transactions-input"
                className="pl-10 bg-zinc-900 border-zinc-800 text-white"
                placeholder="Cari invoice, customer, kasir..."
              />
            </div>

            {/* Date Filter Buttons */}
            <div className="flex gap-1">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'today', label: 'Hari Ini' },
                { id: 'week', label: '7 Hari' },
                { id: 'month', label: '30 Hari' },
                { id: 'custom', label: 'Custom' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setDateFilter(id)}
                  data-testid={`filter-${id}`}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dateFilter === id
                      ? 'bg-[#D4AF37] text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-36 bg-zinc-900 border-zinc-800 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="qr">QRIS</SelectItem>
                <SelectItem value="subscription">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-zinc-800">
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
        </div>

        {/* Transactions Table */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Invoice</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Waktu</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Kasir</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Items</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Payment</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-[#D4AF37]">{tx.invoice_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{new Date(tx.created_at).toLocaleDateString('id-ID')}</p>
                      <p className="text-zinc-500 text-xs">{new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-4 py-3 text-white text-sm">{tx.kasir_name}</td>
                    <td className="px-4 py-3">
                      {tx.customer_name ? (
                        <span className="text-white text-sm">{tx.customer_name}</span>
                      ) : (
                        <span className="text-zinc-500 text-sm">Walk-in</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-white font-mono">{tx.items?.length || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-bold text-white">Rp {tx.total.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentColor(tx.payment_method)}`}>
                        {getPaymentIcon(tx.payment_method)}
                        {tx.payment_method === 'subscription' ? 'Member' : tx.payment_method.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        onClick={() => handleViewDetail(tx)}
                        data-testid={`view-transaction-${tx.id}`}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-[#D4AF37]"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedTransactions.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">
                  {searchTerm || dateFilter !== 'all' || paymentFilter !== 'all'
                    ? 'Tidak ada transaksi yang ditemukan'
                    : 'Belum ada transaksi'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span>
                  {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} dari {filteredTransactions.length}
                </span>
                <div className="flex items-center gap-2">
                  <span>Show:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-16 h-8 bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="px-3 text-sm text-zinc-400">
                  {currentPage} / {totalPages || 1}
                </span>

                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#D4AF37]" />
              Detail Transaksi
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              {/* Invoice Header */}
              <div className="bg-zinc-900 rounded-lg p-4 text-center">
                <p className="text-zinc-400 text-xs mb-1">Invoice Number</p>
                <p className="font-mono text-xl font-bold text-[#D4AF37]">{selectedTransaction.invoice_number}</p>
                <p className="text-zinc-500 text-sm mt-1">
                  {new Date(selectedTransaction.created_at).toLocaleString('id-ID')}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs mb-1">Kasir</p>
                  <p className="text-white font-medium">{selectedTransaction.kasir_name}</p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs mb-1">Customer</p>
                  <p className="text-white font-medium">{selectedTransaction.customer_name || 'Walk-in'}</p>
                </div>
              </div>

              {/* Items */}
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-500 text-xs mb-3">Items</p>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                      <div>
                        <p className="text-white text-sm">{item.service_name || item.product_name}</p>
                        <p className="text-zinc-500 text-xs">x{item.quantity}</p>
                      </div>
                      <p className="font-mono text-white">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-zinc-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="font-mono text-white">Rp {selectedTransaction.subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-zinc-800">
                  <span className="text-white">Total</span>
                  <span className="font-mono text-[#D4AF37]">Rp {selectedTransaction.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-zinc-400">Method</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentColor(selectedTransaction.payment_method)}`}>
                    {getPaymentIcon(selectedTransaction.payment_method)}
                    {selectedTransaction.payment_method === 'subscription' ? 'Member' : selectedTransaction.payment_method.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Diterima</span>
                  <span className="font-mono text-white">Rp {selectedTransaction.payment_received.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Kembalian</span>
                  <span className="font-mono text-green-400">Rp {selectedTransaction.change_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedTransaction.notes && (
                <div className="bg-zinc-900 rounded-lg p-4">
                  <p className="text-zinc-500 text-xs mb-2">Catatan</p>
                  <p className="text-white text-sm">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
