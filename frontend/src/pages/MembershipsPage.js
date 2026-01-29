import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import {
  Plus, Download, AlertCircle, CheckCircle, XCircle, Eye, Trash2, Calendar,
  Search, Crown, Users, TrendingUp, Clock, Bell, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw, CreditCard, Wallet, QrCode
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
import { printReceipt } from '../utils/receiptPrinter';

const MEMBERSHIP_TYPES = [
  { value: 'regular', label: 'Regular (Point-Based)', price: 0, days: 0 },
  { value: 'monthly', label: 'All You Can Wash - Bulanan', price: 500000, days: 30 },
  { value: 'quarterly', label: 'All You Can Wash - 3 Bulanan', price: 1300000, days: 90 },
  { value: 'biannual', label: 'All You Can Wash - 6 Bulanan', price: 2400000, days: 180 },
  { value: 'annual', label: 'All You Can Wash - Tahunan', price: 4500000, days: 365 },
];

const ITEMS_PER_PAGE = 9;

export const MembershipsPage = () => {
  const [memberships, setMemberships] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showAlertsDialog, setShowAlertsDialog] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [membershipDetail, setMembershipDetail] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [price, setPrice] = useState('');
  const [membershipNotes, setMembershipNotes] = useState('');
  const [extendDays, setExtendDays] = useState('30');
  const [filter, setFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  // New states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState('');

  // Payment states for renewal
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState('cash');
  const [renewalAmountPaid, setRenewalAmountPaid] = useState('');
  const [renewalPrice, setRenewalPrice] = useState(0);

  useEffect(() => {
    fetchMemberships();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedType) {
      const typeData = MEMBERSHIP_TYPES.find(t => t.value === selectedType);
      if (typeData) {
        setPrice(typeData.price.toString());
      }
    }
  }, [selectedType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  const fetchMemberships = async () => {
    try {
      const response = await api.get('/memberships');
      setMemberships(response.data);
    } catch (error) {
      toast.error('Gagal memuat data membership');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Gagal memuat data customer');
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const active = memberships.filter(m => m.status === 'active');
    const expiringSoon = memberships.filter(m => m.status === 'expiring_soon');
    const expired = memberships.filter(m => m.status === 'expired');
    const totalRevenue = memberships.reduce((sum, m) => sum + (m.price || 0), 0);
    const totalUsage = memberships.reduce((sum, m) => sum + (m.usage_count || 0), 0);

    return {
      total: memberships.length,
      active: active.length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      totalRevenue,
      totalUsage
    };
  }, [memberships]);

  // Filtered memberships
  const filteredMemberships = useMemo(() => {
    let result = [...memberships];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m =>
        m.customer_name.toLowerCase().includes(term) ||
        m.membership_type.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filter !== 'all') {
      result = result.filter(m => m.status === filter);
    }

    return result;
  }, [memberships, searchTerm, filter]);

  // Pagination
  const totalPages = Math.ceil(filteredMemberships.length / ITEMS_PER_PAGE);
  const paginatedMemberships = filteredMemberships.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Expiring soon alerts
  const expiringAlerts = memberships.filter(m =>
    m.status === 'active' && m.days_remaining <= 7 && m.days_remaining > 0
  );

  // Filtered customers for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const handleAddMembership = async () => {
    setLoading(true);
    try {
      const response = await api.post('/memberships', {
        customer_id: selectedCustomerId,
        membership_type: selectedType,
        price: parseFloat(price),
        notes: membershipNotes || null,
      });

      const newMembership = response.data;
      toast.success('Membership berhasil dibuat');

      // Print receipt
      const customer = customers.find(c => c.id === selectedCustomerId);
      const typeData = MEMBERSHIP_TYPES.find(t => t.value === selectedType);

      printReceipt({
        type: 'membership',
        data: {
          customer_name: customer?.name || 'Unknown',
          customer_phone: customer?.phone || '-',
          membership_type_label: typeData?.label || selectedType,
          period_days: typeData?.days || 30,
          end_date: newMembership.end_date,
          price: parseFloat(price),
          payment_method: 'cash', // Default, bisa dinamis nanti
          created_at: newMembership.created_at,
          outlet_address: 'Jl. Sudirman No. 123, Jakarta',
          outlet_phone: '021-12345678'
        }
      });

      setShowAddDialog(false);
      setSelectedCustomerId('');
      setSelectedType('');
      setPrice('');
      setMembershipNotes('');
      setCustomerSearch('');
      fetchMemberships();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membuat membership');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (membership) => {
    setSelectedMembership(membership);
    try {
      const response = await api.get(`/memberships/${membership.id}`);
      setMembershipDetail(response.data);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('Gagal memuat detail membership');
    }
  };

  const handleExtend = (membership) => {
    setSelectedMembership(membership);
    setExtendDays('30');
    // Calculate renewal price based on membership type
    const typeData = MEMBERSHIP_TYPES.find(t => t.value === membership.membership_type);
    if (typeData) {
      setRenewalPrice(typeData.price);
      setRenewalAmountPaid(typeData.price.toString());
    }
    setRenewalPaymentMethod('cash');
    setShowExtendDialog(true);
  };

  const handleConfirmExtend = async () => {
    // Validation
    if (renewalPaymentMethod === 'cash') {
      const paid = parseFloat(renewalAmountPaid);
      if (!paid || paid < renewalPrice) {
        toast.error('Jumlah bayar tidak mencukupi!');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await api.put(`/memberships/${selectedMembership.id}?days=${parseInt(extendDays)}`);
      const updatedMembership = response.data;

      toast.success(`Membership diperpanjang ${extendDays} hari`);

      // Print receipt
      const typeData = MEMBERSHIP_TYPES.find(t => t.value === selectedMembership.membership_type);
      printReceipt({
        type: 'membership_renewal',
        data: {
          customer_name: selectedMembership.customer_name,
          customer_phone: selectedMembership.customer_phone,
          membership_type_label: typeData?.label || selectedMembership.membership_type,
          extend_days: parseInt(extendDays),
          new_end_date: updatedMembership.end_date,
          renewal_price: renewalPrice,
          payment_method: renewalPaymentMethod,
          amount_paid: renewalPaymentMethod === 'cash' ? parseFloat(renewalAmountPaid) : renewalPrice,
          outlet_address: 'Jl. Sudirman No. 123, Jakarta',
          outlet_phone: '021-12345678'
        }
      });

      setShowExtendDialog(false);
      fetchMemberships();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal memperpanjang membership');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/memberships/${deleteTarget.id}`);
      toast.success('Membership berhasil dihapus');
      setDeleteTarget(null);
      fetchMemberships();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus membership');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = filteredMemberships.map(m => ({
      'Customer': m.customer_name,
      'Tipe Membership': MEMBERSHIP_TYPES.find(t => t.value === m.membership_type)?.label || m.membership_type,
      'Tanggal Mulai': new Date(m.start_date).toLocaleDateString('id-ID'),
      'Tanggal Berakhir': new Date(m.end_date).toLocaleDateString('id-ID'),
      'Sisa Hari': m.days_remaining,
      'Status': m.status === 'active' ? 'Aktif' : m.status === 'expiring_soon' ? 'Akan Expire' : 'Expired',
      'Usage Count': m.usage_count,
      'Harga': m.price,
    }));

    const success = exportToExcel(exportData, `memberships-${new Date().toISOString().split('T')[0]}`, 'Memberships');
    if (success) {
      toast.success('Data berhasil di-export');
    } else {
      toast.error('Gagal export data');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expiring_soon': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'expired': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status, daysRemaining) => {
    const badges = {
      active: 'bg-green-500/20 text-green-500',
      expiring_soon: 'bg-orange-500/20 text-orange-500',
      expired: 'bg-red-500/20 text-red-500',
    };
    const labels = {
      active: 'Aktif',
      expiring_soon: `${daysRemaining} hari lagi`,
      expired: 'Expired',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <Layout>
      <div className="animate-fade-in" data-testid="memberships-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-1">Member</p>
            <h1 className="text-3xl font-bold text-white">Membership Management</h1>
          </div>
          <div className="flex gap-2">
            {expiringAlerts.length > 0 && (
              <Button
                onClick={() => setShowAlertsDialog(true)}
                className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/50"
              >
                <Bell className="w-4 h-4 mr-2" />
                {expiringAlerts.length} Akan Expire
              </Button>
            )}
            <Button
              onClick={handleExport}
              data-testid="export-memberships-button"
              className="bg-zinc-800 text-white hover:bg-zinc-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              data-testid="add-membership-button"
              className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Membership
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Crown className="w-5 h-5 text-[#D4AF37] mb-2" />
            <p className="text-zinc-500 text-sm">Total Member</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-zinc-500 text-sm">Aktif</p>
            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-orange-400 mb-2" />
            <p className="text-zinc-500 text-sm">Akan Expire</p>
            <p className="text-2xl font-bold text-orange-400">{stats.expiringSoon}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <TrendingUp className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-zinc-500 text-sm">Total Usage</p>
            <p className="text-2xl font-bold text-white">{stats.totalUsage}x</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <TrendingUp className="w-5 h-5 text-[#D4AF37] mb-2" />
            <p className="text-zinc-500 text-sm">Revenue</p>
            <p className="text-lg font-bold text-[#D4AF37]">Rp {(stats.totalRevenue / 1000000).toFixed(1)}jt</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-memberships-input"
              className="pl-10 bg-[#18181b] border-zinc-800 text-white"
              placeholder="Cari nama customer atau tipe membership..."
            />
          </div>
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'Semua', count: stats.total },
              { id: 'active', label: 'Aktif', count: stats.active },
              { id: 'expiring_soon', label: 'Expire', count: stats.expiringSoon },
              { id: 'expired', label: 'Expired', count: stats.expired },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                data-testid={`filter-${id}`}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === id
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
          <Button onClick={fetchMemberships} variant="outline" className="border-zinc-800">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Membership Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {paginatedMemberships.map((membership) => {
            const daysRemaining = membership.days_remaining ||
              Math.ceil((new Date(membership.end_date) - new Date()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={membership.id}
                className={`bg-[#18181b] border rounded-xl p-5 hover:border-[#D4AF37]/50 transition-all ${membership.status === 'expiring_soon' ? 'border-orange-500/50' :
                  membership.status === 'expired' ? 'border-red-500/30' : 'border-zinc-800'
                  }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center text-black font-bold">
                      {membership.customer_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{membership.customer_name}</h3>
                      <p className="text-xs text-[#D4AF37]">
                        {MEMBERSHIP_TYPES.find(t => t.value === membership.membership_type)?.label.split(' - ')[1] || membership.membership_type}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(membership.status, daysRemaining)}
                </div>

                {/* Progress Bar for days remaining */}
                {membership.status !== 'expired' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Sisa waktu</span>
                      <span className={`font-mono ${daysRemaining <= 7 ? 'text-orange-400' : 'text-green-400'}`}>
                        {daysRemaining} hari
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${daysRemaining <= 7 ? 'bg-orange-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-zinc-900 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-white font-mono">{membership.usage_count}</p>
                    <p className="text-xs text-zinc-500">Pemakaian</p>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-[#D4AF37] font-mono">
                      {(membership.price / 1000)}K
                    </p>
                    <p className="text-xs text-zinc-500">Harga</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewDetail(membership)}
                    size="sm"
                    variant="outline"
                    data-testid={`view-membership-${membership.id}`}
                    className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 h-9"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Detail
                  </Button>
                  <Button
                    onClick={() => handleExtend(membership)}
                    size="sm"
                    data-testid={`extend-membership-${membership.id}`}
                    className="flex-1 bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 h-9"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Perpanjang
                  </Button>
                  <Button
                    onClick={() => setDeleteTarget(membership)}
                    size="sm"
                    variant="ghost"
                    data-testid={`delete-membership-${membership.id}`}
                    className="text-zinc-400 hover:text-red-500 h-9 w-9 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMemberships.length === 0 && (
          <div className="text-center py-12 bg-[#18181b] border border-zinc-800 rounded-xl">
            <Crown className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">
              {searchTerm ? 'Tidak ada membership yang ditemukan' : 'Belum ada membership'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-zinc-500">
              Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredMemberships.length)} dari {filteredMemberships.length}
            </p>
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
              <span className="px-3 text-sm text-zinc-400">{currentPage} / {totalPages}</span>
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

      {/* Expiring Alerts Dialog */}
      <Dialog open={showAlertsDialog} onOpenChange={setShowAlertsDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-400" />
              Membership Akan Expire
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {expiringAlerts.map((m) => (
              <div key={m.id} className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white">{m.customer_name}</h4>
                  <span className="text-orange-400 font-mono text-sm">{m.days_remaining} hari lagi</span>
                </div>
                <p className="text-sm text-zinc-400 mb-3">
                  {MEMBERSHIP_TYPES.find(t => t.value === m.membership_type)?.label}
                </p>
                <Button
                  onClick={() => { setShowAlertsDialog(false); handleExtend(m); }}
                  size="sm"
                  className="w-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  Perpanjang Sekarang
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Membership Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Buat Membership Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 text-sm mb-2">Cari Customer</Label>
              <Input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white mb-2"
                placeholder="Ketik nama atau nomor telepon..."
              />
              {customerSearch && filteredCustomers.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-h-32 overflow-y-auto">
                  {filteredCustomers.slice(0, 5).map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        setCustomerSearch(customer.name);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-zinc-800 text-sm ${selectedCustomerId === customer.id ? 'bg-[#D4AF37]/20' : ''}`}
                    >
                      <p className="text-white">{customer.name}</p>
                      <p className="text-zinc-500 text-xs">{customer.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-zinc-400 text-sm mb-2">Tipe Membership *</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white" data-testid="select-membership-type">
                  <SelectValue placeholder="Pilih tipe membership" />
                </SelectTrigger>
                <SelectContent>
                  {MEMBERSHIP_TYPES.filter(t => t.value !== 'regular').map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{type.label}</span>
                        <span className="text-[#D4AF37] ml-2">Rp {type.price.toLocaleString('id-ID')}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-zinc-400 text-sm mb-2">Harga</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                data-testid="membership-price-input"
                className="bg-zinc-900 border-zinc-800 text-white font-mono"
                placeholder="0"
              />
            </div>

            <div>
              <Label className="text-zinc-400 text-sm mb-2">Catatan (Opsional)</Label>
              <Input
                value={membershipNotes}
                onChange={(e) => setMembershipNotes(e.target.value)}
                data-testid="membership-notes-input"
                className="bg-zinc-900 border-zinc-800 text-white"
                placeholder="Catatan membership..."
              />
            </div>

            <Button
              onClick={handleAddMembership}
              disabled={loading || !selectedCustomerId || !selectedType || !price}
              data-testid="submit-membership-button"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold h-11"
            >
              {loading ? 'Membuat...' : 'Buat Membership'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Membership Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#D4AF37]" />
              Detail Membership
            </DialogTitle>
          </DialogHeader>

          {membershipDetail && (
            <div className="space-y-4">
              {/* Member Card */}
              <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#F59E0B]/10 border border-[#D4AF37]/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-black font-bold text-lg">
                    {membershipDetail.customer_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{membershipDetail.customer_name}</h3>
                    <p className="text-sm text-[#D4AF37]">
                      {MEMBERSHIP_TYPES.find(t => t.value === membershipDetail.membership_type)?.label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 rounded-lg p-4 text-center">
                  <p className={`text-2xl font-bold font-mono ${membershipDetail.days_remaining <= 0 ? 'text-red-500' :
                    membershipDetail.days_remaining <= 7 ? 'text-orange-500' : 'text-green-500'
                    }`}>
                    {membershipDetail.days_remaining}
                  </p>
                  <p className="text-xs text-zinc-500">Hari Tersisa</p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white font-mono">{membershipDetail.usage_count}</p>
                  <p className="text-xs text-zinc-500">Total Pemakaian</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Mulai</p>
                  <p className="text-white text-sm">{new Date(membershipDetail.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Berakhir</p>
                  <p className="text-white text-sm">{new Date(membershipDetail.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Usage History */}
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                  Riwayat Pemakaian
                </h4>
                {membershipDetail.usage_history && membershipDetail.usage_history.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {membershipDetail.usage_history.map((usage) => (
                      <div key={usage.id} className="bg-zinc-900 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">{usage.service_name}</p>
                          <p className="text-xs text-zinc-500">Kasir: {usage.kasir_name}</p>
                        </div>
                        <p className="text-xs text-zinc-400">
                          {new Date(usage.used_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-zinc-500 py-4 bg-zinc-900 rounded-lg">Belum ada riwayat</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Extend Membership Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Perpanjang Membership</DialogTitle>
          </DialogHeader>

          {selectedMembership && (
            <div className="space-y-4">
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-sm text-zinc-400">Member</p>
                <p className="font-semibold text-white">{selectedMembership.customer_name}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Berakhir: {new Date(selectedMembership.end_date).toLocaleDateString('id-ID')}
                </p>
              </div>

              <div>
                <Label className="text-zinc-400 text-sm mb-2">Perpanjang</Label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['7', '14', '30', '90'].map((days) => (
                    <Button
                      key={days}
                      onClick={() => setExtendDays(days)}
                      variant={extendDays === days ? 'default' : 'outline'}
                      className={extendDays === days
                        ? 'bg-[#D4AF37] text-black'
                        : 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'}
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white font-mono"
                  placeholder="Jumlah hari"
                />
              </div>

              {/* Payment Section */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                  Pembayaran
                </h3>

                <div className="bg-zinc-900 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Biaya Perpanjangan:</span>
                    <span className="text-white font-mono font-bold">
                      Rp {renewalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    untuk {extendDays} hari
                  </p>
                </div>

                <div>
                  <Label className="text-zinc-400 text-sm mb-2">Metode Pembayaran</Label>
                  <Select value={renewalPaymentMethod} onValueChange={setRenewalPaymentMethod}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Tunai</SelectItem>
                      <SelectItem value="card">💳 Debit/Credit Card</SelectItem>
                      <SelectItem value="qr">📱 QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renewalPaymentMethod === 'cash' && (
                  <div>
                    <Label className="text-zinc-400 text-sm mb-2">Jumlah Bayar</Label>
                    <Input
                      type="number"
                      value={renewalAmountPaid}
                      onChange={(e) => setRenewalAmountPaid(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white font-mono"
                      placeholder="Masukkan jumlah bayar"
                    />
                    {renewalAmountPaid && parseFloat(renewalAmountPaid) >= renewalPrice && (
                      <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded px-3 py-2 text-sm">
                        <span className="text-zinc-400">Kembalian: </span>
                        <span className="text-green-400 font-mono font-bold">
                          Rp {(parseFloat(renewalAmountPaid) - renewalPrice).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={handleConfirmExtend}
                disabled={loading || !extendDays}
                data-testid="confirm-extend-button"
                className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold h-11"
              >
                {loading ? 'Memproses...' : `Bayar & Perpanjang ${extendDays} Hari`}
              </Button>
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
        title="Hapus Membership?"
        description={deleteTarget ? `Membership untuk "${deleteTarget.customer_name}" akan dihapus.` : ''}
      />
    </Layout>
  );
};
