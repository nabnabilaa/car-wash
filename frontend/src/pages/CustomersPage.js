import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import {
  Plus, Search, Download, Pencil, Trash2, Eye, X, Users,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Phone, Mail, Car, Calendar, TrendingUp, CreditCard, Printer, FileText
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
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle_number: '',
    vehicle_type: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Gagal memuat data customer');
    }
  };

  // Filtered and sorted customers
  const processedCustomers = useMemo(() => {
    let result = [...customers];

    // Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.vehicle_number && c.vehicle_number.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term))
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [customers, searchTerm, sortBy, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(processedCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = processedCustomers.slice(startIndex, endIndex);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: customers.length,
      totalSpending: customers.reduce((sum, c) => sum + (c.total_spending || 0), 0),
      totalVisits: customers.reduce((sum, c) => sum + (c.total_visits || 0), 0),
      avgSpending: customers.length > 0
        ? customers.reduce((sum, c) => sum + (c.total_spending || 0), 0) / customers.length
        : 0
    };
  }, [customers]);

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      vehicle_number: '',
      vehicle_type: '',
    });
  };

  const handleAddCustomer = async () => {
    setLoading(true);
    try {
      await api.post('/customers', formData);
      toast.success('Customer berhasil ditambahkan');
      setShowAddDialog(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      vehicle_number: customer.vehicle_number || '',
      vehicle_type: customer.vehicle_type || '',
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await api.put(`/customers/${editingCustomer.id}`, formData);
      toast.success('Customer berhasil diupdate');
      setShowEditDialog(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (customer) => {
    setSelectedCustomer(customer);
    setShowDetailDialog(true);

    try {
      const response = await api.get(`/customers/${customer.id}/transactions`);
      setCustomerTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setCustomerTransactions([]);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/customers/${deleteTarget.id}`);
      toast.success('Customer berhasil dihapus');
      setDeleteTarget(null);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus customer');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = processedCustomers.map(c => ({
      'Nama': c.name,
      'Telepon': c.phone,
      'Email': c.email || '-',
      'Nomor Kendaraan': c.vehicle_number || '-',
      'Tipe Kendaraan': c.vehicle_type || '-',
      'Total Kunjungan': c.total_visits,
      'Total Belanja': c.total_spending,
      'Tanggal Bergabung': new Date(c.join_date).toLocaleDateString('id-ID'),
    }));

    const success = exportToExcel(exportData, `customers-${new Date().toISOString().split('T')[0]}`, 'Customers');
    if (success) {
      toast.success('Data berhasil di-export');
    } else {
      toast.error('Gagal export data');
    }
  };

  const handleExportCustomerTransactions = () => {
    if (!selectedCustomer || customerTransactions.length === 0) {
      toast.error('Tidak ada transaksi untuk di-export');
      return;
    }

    const exportData = customerTransactions.map(tx => ({
      'Invoice': tx.invoice_number,
      'Tanggal': new Date(tx.created_at).toLocaleDateString('id-ID'),
      'Waktu': new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      'Layanan/Produk': tx.items.map(i => i.service_name).join(', '),
      'Total': tx.total,
      'Metode Bayar': tx.payment_method === 'subscription' ? 'Member' : tx.payment_method.toUpperCase(),
      'Kasir': tx.kasir_name,
      'Catatan': tx.notes || '-',
    }));

    const success = exportToExcel(
      exportData,
      `transaksi-${selectedCustomer.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`,
      'Riwayat Transaksi'
    );
    if (success) {
      toast.success('Riwayat transaksi berhasil di-export');
    } else {
      toast.error('Gagal export data');
    }
  };

  const handlePrintReceipt = () => {
    if (!selectedReceipt) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error('Popup di-blokir. Izinkan popup untuk mencetak struk.');
      return;
    }

    const htmlContent = `
      <html>
      <head>
        <title>Struk - ${selectedReceipt.invoice_number}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .total { font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin:0; font-size: 16px;">OTOPIA Car Wash</h2>
          <p style="margin:5px 0 0;">Jl. Sukun Raya No.47C, Semarang</p>
        </div>
        <div style="margin-bottom: 15px;">
           <p style="margin:0">No: ${selectedReceipt.invoice_number}</p>
           <p style="margin:0">Tgl: ${new Date(selectedReceipt.created_at).toLocaleString('id-ID')}</p>
           <p style="margin:0">Plat: ${selectedCustomer?.vehicle_number || '-'}</p>
        </div>
        <div class="divider"></div>
        <div class="items">
          ${selectedReceipt.items.map(item => `
            <div class="item">
              <span>${item.service_name || item.name} x${item.quantity}</span>
              <span>${parseInt(item.price * item.quantity).toLocaleString('id-ID')}</span>
            </div>
          `).join('')}
        </div>
        <div class="divider"></div>
        <div class="item">
           <span>Subtotal</span>
           <span>Rp ${parseInt(selectedReceipt.subtotal).toLocaleString('id-ID')}</span>
        </div>
        ${selectedReceipt.discount_amount > 0 ? `
        <div class="item">
           <span>Diskon</span>
           <span>-Rp ${parseInt(selectedReceipt.discount_amount).toLocaleString('id-ID')}</span>
        </div>
        ` : ''}
        <div class="item total">
           <span>Total</span>
           <span>Rp ${parseInt(selectedReceipt.total).toLocaleString('id-ID')}</span>
        </div>
        <div class="item" style="margin-top:5px;">
           <span>Bayar (${selectedReceipt.payment_method})</span>
           <span>Rp ${parseInt(selectedReceipt.payment_received || selectedReceipt.total).toLocaleString('id-ID')}</span>
        </div>
        ${selectedReceipt.change_amount > 0 ? `
        <div class="item">
           <span>Kembalian</span>
           <span>Rp ${parseInt(selectedReceipt.change_amount).toLocaleString('id-ID')}</span>
        </div>
        ` : ''}
        <div class="footer">
           <p>Terima Kasih atas Kunjungan Anda!</p>
        </div>
        <script>
            window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const renderFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-zinc-400 text-sm mb-2">Nama *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            data-testid="customer-name-input"
            className="bg-zinc-900 border-zinc-800 text-white"
            placeholder="Nama lengkap"
          />
        </div>
        <div>
          <Label className="text-zinc-400 text-sm mb-2">Telepon *</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            data-testid="customer-phone-input"
            className="bg-zinc-900 border-zinc-800 text-white"
            placeholder="08xxxxxxxxxx"
          />
        </div>
      </div>
      <div>
        <Label className="text-zinc-400 text-sm mb-2">Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="bg-zinc-900 border-zinc-800 text-white"
          placeholder="email@example.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-zinc-400 text-sm mb-2">Nomor Kendaraan</Label>
          <Input
            value={formData.vehicle_number}
            onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-white"
            placeholder="B 1234 ABC"
          />
        </div>
        <div>
          <Label className="text-zinc-400 text-sm mb-2">Tipe Kendaraan</Label>
          <Input
            value={formData.vehicle_type}
            onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-white"
            placeholder="Toyota Avanza"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="animate-fade-in" data-testid="customers-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-1">Pelanggan</p>
            <h1 className="text-3xl font-bold text-white">Customer Database</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              data-testid="export-customers-button"
              className="bg-zinc-800 text-white hover:bg-zinc-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => { resetForm(); setShowAddDialog(true); }}
              data-testid="add-customer-button"
              className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Customer
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Users className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-zinc-500 text-sm">Total Customer</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-zinc-500 text-sm">Total Kunjungan</p>
            <p className="text-2xl font-bold text-white">{stats.totalVisits}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <CreditCard className="w-5 h-5 text-[#D4AF37] mb-2" />
            <p className="text-zinc-500 text-sm">Total Belanja</p>
            <p className="text-xl font-bold text-[#D4AF37]">Rp {stats.totalSpending.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <TrendingUp className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-zinc-500 text-sm">Rata-rata Belanja</p>
            <p className="text-xl font-bold text-white">Rp {Math.round(stats.avgSpending).toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-customers-input"
              className="pl-10 bg-[#18181b] border-zinc-800 text-white"
              placeholder="Cari nama, telepon, email, atau nomor kendaraan..."
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-[#18181b] border-zinc-800 text-white">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nama</SelectItem>
              <SelectItem value="total_spending">Total Belanja</SelectItem>
              <SelectItem value="total_visits">Kunjungan</SelectItem>
              <SelectItem value="join_date">Tgl Bergabung</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            variant="outline"
            className="border-zinc-800 text-white"
          >
            {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
          </Button>
        </div>

        {/* Table */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Kontak</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Kendaraan</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Kunjungan</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Belanja</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#D4AF37]/20 rounded-full flex items-center justify-center text-[#D4AF37] font-semibold text-sm">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{customer.name}</p>
                          <p className="text-xs text-zinc-500">
                            Sejak {new Date(customer.join_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span className="text-white font-mono text-xs">{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-zinc-500" />
                            <span className="text-zinc-400 text-xs">{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {customer.vehicle_number ? (
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-zinc-500" />
                          <div>
                            <p className="font-mono text-white text-sm">{customer.vehicle_number}</p>
                            <p className="text-xs text-zinc-500">{customer.vehicle_type}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-white">{customer.total_visits}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-semibold text-[#D4AF37]">
                        Rp {customer.total_spending.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <Button
                          onClick={() => handleViewDetail(customer)}
                          size="sm"
                          variant="ghost"
                          data-testid={`view-${customer.id}`}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-[#D4AF37]"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleEdit(customer)}
                          size="sm"
                          variant="ghost"
                          data-testid={`edit-${customer.id}`}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setDeleteTarget(customer)}
                          size="sm"
                          variant="ghost"
                          data-testid={`delete-${customer.id}`}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">
                  {searchTerm ? 'Tidak ada customer yang ditemukan' : 'Belum ada customer'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {processedCustomers.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span>
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, processedCustomers.length)} dari {processedCustomers.length}
                </span>
                <div className="flex items-center gap-2">
                  <span>Per halaman:</span>
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

                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        variant={currentPage === pageNum ? 'default' : 'ghost'}
                        size="sm"
                        className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-[#D4AF37] text-black' : 'text-zinc-400'}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
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

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Tambah Customer Baru</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <Button
            onClick={handleAddCustomer}
            disabled={loading || !formData.name || !formData.phone}
            data-testid="submit-customer-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold h-11"
          >
            {loading ? 'Menyimpan...' : 'Tambah Customer'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Customer</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <Button
            onClick={handleSaveEdit}
            disabled={loading || !formData.name || !formData.phone}
            data-testid="save-edit-customer-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold h-11"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#D4AF37]" />
              Detail Customer
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Card */}
              <div className="flex items-center gap-4 bg-zinc-900 rounded-lg p-4">
                <div className="w-14 h-14 bg-[#D4AF37] rounded-full flex items-center justify-center text-black font-bold text-xl">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedCustomer.phone}
                    </span>
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {selectedCustomer.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedCustomer.total_visits}</p>
                  <p className="text-xs text-zinc-500">Kunjungan</p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-4 text-center">
                  <p className="text-xl font-bold text-[#D4AF37]">
                    Rp {selectedCustomer.total_spending.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-zinc-500">Total Belanja</p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-4 text-center">
                  <p className="text-lg font-medium text-white">
                    {new Date(selectedCustomer.join_date).toLocaleDateString('id-ID')}
                  </p>
                  <p className="text-xs text-zinc-500">Bergabung</p>
                </div>
              </div>

              {/* Vehicle Info */}
              {selectedCustomer.vehicle_number && (
                <div className="bg-zinc-900 rounded-lg p-4 flex items-center gap-3">
                  <Car className="w-8 h-8 text-zinc-500" />
                  <div>
                    <p className="font-mono font-semibold text-white">{selectedCustomer.vehicle_number}</p>
                    <p className="text-sm text-zinc-400">{selectedCustomer.vehicle_type}</p>
                  </div>
                </div>
              )}

              {/* Transaction History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">Riwayat Transaksi</h3>
                  {customerTransactions.length > 0 && (
                    <Button
                      onClick={handleExportCustomerTransactions}
                      size="sm"
                      data-testid="export-customer-transactions-button"
                      className="bg-zinc-800 text-white hover:bg-zinc-700 h-8"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                  )}
                </div>
                {customerTransactions.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {customerTransactions.map((tx) => (
                      <div key={tx.id} className="bg-zinc-900 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-[#D4AF37]">{tx.invoice_number}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-zinc-500 hover:text-white"
                              title="Lihat Struk"
                              onClick={() => { setSelectedReceipt(tx); setShowReceiptDialog(true); }}
                            >
                              <FileText className="w-3 h-3" />
                            </Button>
                            {tx.payment_method === 'subscription' && (
                              <span className="px-1.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] text-xs rounded">Member</span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400">
                            {tx.items.map(i => i.service_name).join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold text-white">
                            Rp {tx.total.toLocaleString('id-ID')}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {new Date(tx.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-zinc-500 py-6">Belum ada transaksi</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt View Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-[#D4AF37]" />
              Cetak Struk
            </DialogTitle>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4">
              <div className="bg-white text-black p-6 font-mono text-xs rounded shadow-lg overflow-y-auto max-h-[60vh]">
                <div className="text-center border-b border-black pb-2 mb-2 border-dashed">
                  <p className="font-bold text-sm">OTOPIA Car Wash</p>
                  <p className="text-[10px]">Jl. Sukun Raya No.47C, Semarang</p>
                  <p className="text-[10px] mt-1">{new Date(selectedReceipt.created_at).toLocaleString('id-ID')}</p>
                  <p className="text-[10px]">{selectedReceipt.invoice_number}</p>
                </div>

                <div className="space-y-1 mb-2">
                  {selectedReceipt.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.service_name || item.name} x{item.quantity}</span>
                      <span>{(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-black border-dashed pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>Rp {selectedReceipt.total.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] mt-1">
                    <span>Bayar ({selectedReceipt.payment_method})</span>
                    <span>Rp {(selectedReceipt.payment_received || selectedReceipt.total).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowReceiptDialog(false)}
                  variant="outline"
                  className="flex-1 border-zinc-700 hover:bg-zinc-800"
                >
                  Tutup
                </Button>
                <Button
                  onClick={handlePrintReceipt}
                  className="flex-1 bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Cetak / PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
        title="Hapus Customer?"
        description={deleteTarget ? `Customer "${deleteTarget.name}" akan dihapus.` : ''}
      />
    </Layout>
  );
};
