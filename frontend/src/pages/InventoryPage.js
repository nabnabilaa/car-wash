import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import {
  Plus, Download, AlertTriangle, Package, Pencil, Trash2, Search,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, TrendingUp,
  TrendingDown, RefreshCw, ArrowUpDown, Filter, ArrowUp, ArrowDown
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

const ITEMS_PER_PAGE = 15;
const CATEGORIES = [
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment_parts', label: 'Equipment Parts' },
  { value: 'accessories', label: 'Accessories' },
];

export const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Adjustment state
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    unit: '',
    current_stock: '',
    min_stock: '',
    max_stock: '',
    unit_cost: '',
    supplier: '',
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, stockFilter]);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setItems(response.data);
    } catch (error) {
      toast.error('Gagal memuat data inventory');
    }
  };

  // Stats
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0);
    const lowStock = items.filter(item => item.current_stock <= item.min_stock);
    const totalUnits = items.reduce((sum, item) => sum + item.current_stock, 0);
    const categoryBreakdown = {};
    items.forEach(item => {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    });

    return { totalItems, totalValue, lowStock: lowStock.length, totalUnits, categoryBreakdown };
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term) ||
        (item.supplier && item.supplier.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(item => item.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter === 'low') {
      result = result.filter(item => item.current_stock <= item.min_stock);
    } else if (stockFilter === 'ok') {
      result = result.filter(item => item.current_stock > item.min_stock);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'total_value') {
        aVal = a.current_stock * a.unit_cost;
        bVal = b.current_stock * b.unit_cost;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [items, searchTerm, categoryFilter, stockFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      category: '',
      unit: '',
      current_stock: '',
      min_stock: '',
      max_stock: '',
      unit_cost: '',
      supplier: '',
    });
  };

  const handleAddItem = async () => {
    setLoading(true);
    try {
      await api.post('/inventory', {
        ...formData,
        current_stock: parseFloat(formData.current_stock),
        min_stock: parseFloat(formData.min_stock),
        max_stock: parseFloat(formData.max_stock),
        unit_cost: parseFloat(formData.unit_cost),
      });
      toast.success('Item berhasil ditambahkan');
      setShowAddDialog(false);
      resetForm();
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      current_stock: item.current_stock.toString(),
      min_stock: item.min_stock.toString(),
      max_stock: item.max_stock.toString(),
      unit_cost: item.unit_cost.toString(),
      supplier: item.supplier || '',
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await api.put(`/inventory/${editingItem.id}`, {
        ...formData,
        current_stock: parseFloat(formData.current_stock),
        min_stock: parseFloat(formData.min_stock),
        max_stock: parseFloat(formData.max_stock),
        unit_cost: parseFloat(formData.unit_cost),
      });
      toast.success('Item berhasil diupdate');
      setShowEditDialog(false);
      setEditingItem(null);
      resetForm();
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal update item');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = (item) => {
    setAdjustingItem(item);
    setAdjustmentType('add');
    setAdjustmentAmount('');
    setAdjustmentReason('');
    setShowAdjustDialog(true);
  };

  const handleConfirmAdjust = async () => {
    setLoading(true);

    // Validate inputs
    if (!adjustmentAmount || parseInt(adjustmentAmount) <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      setLoading(false);
      return;
    }

    try {
      await api.post(`/inventory/${adjustingItem.id}/adjust`, {
        amount: parseFloat(adjustmentAmount),
        type: adjustmentType,
        reason: adjustmentReason || '-'
      });

      toast.success(`Stok ${adjustingItem.name} berhasil di${adjustmentType === 'add' ? 'tambah' : 'kurangi'}`);
      setShowAdjustDialog(false);
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyesuaikan stok');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/inventory/${deleteTarget.id}`);
      toast.success('Item berhasil dihapus');
      setDeleteTarget(null);
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus item');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = filteredItems.map(item => ({
      'SKU': item.sku,
      'Nama Produk': item.name,
      'Kategori': item.category,
      'Stok Saat Ini': item.current_stock,
      'Unit': item.unit,
      'Min Stok': item.min_stock,
      'Max Stok': item.max_stock,
      'HPP per Unit': item.unit_cost,
      'Total Nilai': item.current_stock * item.unit_cost,
      'Supplier': item.supplier || '-',
      'Status': item.current_stock <= item.min_stock ? 'Low Stock' : 'OK',
    }));

    const success = exportToExcel(exportData, `inventory-${new Date().toISOString().split('T')[0]}`, 'Inventory');
    if (success) {
      toast.success(`${filteredItems.length} items exported`);
    } else {
      toast.error('Gagal export data');
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const renderFormFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label className="text-zinc-400 text-sm mb-2">SKU *</Label>
        <Input
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          data-testid="sku-input"
          className="bg-zinc-900 border-zinc-800 text-white font-mono"
          placeholder="CHEM-001"
          disabled={!!editingItem}
        />
      </div>
      <div>
        <Label className="text-zinc-400 text-sm mb-2">Nama Produk *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          data-testid="name-input"
          className="bg-zinc-900 border-zinc-800 text-white"
          placeholder="Car Shampoo"
        />
      </div>
      <div>
        <Label className="text-zinc-400 text-sm mb-2">Kategori *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white" data-testid="category-select">
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-zinc-400 text-sm mb-2">Unit *</Label>
        <Select
          value={formData.unit}
          onValueChange={(value) => setFormData({ ...formData, unit: value })}
        >
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white" data-testid="unit-select">
            <SelectValue placeholder="Pilih unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="liter">Liter</SelectItem>
            <SelectItem value="kg">Kg</SelectItem>
            <SelectItem value="pcs">Pcs</SelectItem>
            <SelectItem value="ml">ML</SelectItem>
            <SelectItem value="gram">Gram</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-zinc-400 text-sm mb-2">Stok *</Label>
        <Input
          type="number"
          value={formData.current_stock}
          onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
          data-testid="stock-input"
          className="bg-zinc-900 border-zinc-800 text-white font-mono"
          placeholder="0"
        />
      </div>
      <div>
        <Label className="text-zinc-400 text-sm mb-2">HPP/Unit *</Label>
        <Input
          type="number"
          value={formData.unit_cost}
          onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
          data-testid="hpp-input"
          className="bg-zinc-900 border-zinc-800 text-white font-mono"
          placeholder="0"
        />
      </div>
      <div>
        <Label className="text-zinc-400 text-sm mb-2">Min Stock *</Label>
        <Input
          type="number"
          value={formData.min_stock}
          onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
          data-testid="min-stock-input"
          className="bg-zinc-900 border-zinc-800 text-white font-mono"
          placeholder="0"
        />
      </div>
      <div>
        <Label className="text-zinc-400 text-sm mb-2">Max Stock *</Label>
        <Input
          type="number"
          value={formData.max_stock}
          onChange={(e) => setFormData({ ...formData, max_stock: e.target.value })}
          data-testid="max-stock-input"
          className="bg-zinc-900 border-zinc-800 text-white font-mono"
          placeholder="0"
        />
      </div>
      <div className="col-span-2">
        <Label className="text-zinc-400 text-sm mb-2">Supplier</Label>
        <Input
          value={formData.supplier}
          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          data-testid="supplier-input"
          className="bg-zinc-900 border-zinc-800 text-white"
          placeholder="Nama supplier"
        />
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="animate-fade-in" data-testid="inventory-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-1">Stok</p>
            <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              data-testid="export-inventory-button"
              className="bg-zinc-800 text-white hover:bg-zinc-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => { resetForm(); setShowAddDialog(true); }}
              data-testid="add-inventory-button"
              className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Item
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Package className="w-5 h-5 text-[#D4AF37] mb-2" />
            <p className="text-zinc-500 text-sm">Total Items</p>
            <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
            <p className="text-xs text-zinc-500 mt-1">{stats.totalUnits} total units</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-orange-400 mb-2" />
            <p className="text-zinc-500 text-sm">Low Stock</p>
            <p className="text-2xl font-bold text-orange-400">{stats.lowStock}</p>
            <p className="text-xs text-zinc-500 mt-1">perlu restock</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <TrendingUp className="w-5 h-5 text-[#D4AF37] mb-2" />
            <p className="text-zinc-500 text-sm">Total Value</p>
            <p className="text-xl font-bold text-[#D4AF37]">Rp {(stats.totalValue / 1000000).toFixed(1)}jt</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Filter className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-zinc-500 text-sm">Categories</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(stats.categoryBreakdown).slice(0, 3).map(([cat, count]) => (
                <span key={cat} className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                  {cat}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {stats.lowStock > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div className="flex-1">
                <p className="text-orange-400 font-medium">
                  {stats.lowStock} item perlu segera di-restock
                </p>
              </div>
              <Button
                onClick={() => setStockFilter('low')}
                size="sm"
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                Lihat Semua
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4 mb-4">
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-inventory-input"
                className="pl-10 bg-zinc-900 border-zinc-800 text-white"
                placeholder="Cari SKU, nama produk, atau supplier..."
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36 bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock Status Filter */}
            <div className="flex gap-1">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'low', label: 'Low Stock' },
                { id: 'ok', label: 'OK' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setStockFilter(id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${stockFilter === id
                    ? id === 'low' ? 'bg-orange-500 text-white' : 'bg-[#D4AF37] text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <Button onClick={fetchInventory} variant="outline" className="border-zinc-800">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('sku')} className="flex items-center gap-1 hover:text-white">
                      SKU {sortBy === 'sku' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-white">
                      Produk {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Kategori</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('current_stock')} className="flex items-center gap-1 hover:text-white">
                      Stok {sortBy === 'current_stock' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Min/Max</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('unit_cost')} className="flex items-center gap-1 hover:text-white ml-auto">
                      HPP {sortBy === 'unit_cost' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    <button onClick={() => toggleSort('total_value')} className="flex items-center gap-1 hover:text-white ml-auto">
                      Total {sortBy === 'total_value' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {paginatedItems.map((item) => {
                  const isLowStock = item.current_stock <= item.min_stock;
                  const totalValue = item.current_stock * item.unit_cost;
                  const stockPercentage = (item.current_stock / item.max_stock) * 100;

                  return (
                    <tr key={item.id} className={`hover:bg-zinc-800/30 transition-colors ${isLowStock ? 'bg-orange-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-[#D4AF37]">{item.sku}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{item.name}</p>
                        {item.supplier && <p className="text-xs text-zinc-500">{item.supplier}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-mono font-bold ${isLowStock ? 'text-orange-500' : 'text-white'}`}>
                            {item.current_stock}
                          </span>
                          <span className="text-xs text-zinc-500">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="w-24 mx-auto">
                          <div className="flex justify-between text-xs text-zinc-500 mb-1">
                            <span>{item.min_stock}</span>
                            <span>{item.max_stock}</span>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isLowStock ? 'bg-orange-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, stockPercentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-white">Rp {item.unit_cost.toLocaleString('id-ID')}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-semibold text-[#D4AF37]">
                          Rp {totalValue.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLowStock ? (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs font-semibold">
                            Low
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-semibold">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            onClick={() => handleAdjustStock(item)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-[#D4AF37]"
                            title="Adjust Stock"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleEdit(item)}
                            size="sm"
                            variant="ghost"
                            data-testid={`edit-${item.id}`}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => setDeleteTarget(item)}
                            size="sm"
                            variant="ghost"
                            data-testid={`delete-${item.id}`}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {paginatedItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">
                  {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all'
                    ? 'Tidak ada item yang ditemukan'
                    : 'Belum ada item di inventory'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <p className="text-sm text-zinc-500">
                {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} dari {filteredItems.length} items
              </p>
              <div className="flex items-center gap-1">
                <Button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400">
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 text-sm text-zinc-400">{currentPage} / {totalPages}</span>
                <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400">
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-[#D4AF37]" />
              Sesuaikan Stok
            </DialogTitle>
          </DialogHeader>

          {adjustingItem && (
            <div className="space-y-4">
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-sm text-zinc-400">Item</p>
                <p className="font-semibold text-white">{adjustingItem.name}</p>
                <p className="text-sm text-zinc-500">Stok saat ini: <span className="font-mono text-white">{adjustingItem.current_stock} {adjustingItem.unit}</span></p>
              </div>

              <div>
                <Label className="text-zinc-400 text-sm mb-2">Tipe Adjustment</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAdjustmentType('add')}
                    className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${adjustmentType === 'add'
                      ? 'bg-green-500/20 border-green-500 text-green-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Tambah Stok
                  </button>
                  <button
                    onClick={() => setAdjustmentType('subtract')}
                    className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${adjustmentType === 'subtract'
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    Kurangi Stok
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-zinc-400 text-sm mb-2">Jumlah</Label>
                <Input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white font-mono"
                  placeholder="0"
                  min="1"
                />
                {adjustmentAmount && (
                  <p className="text-sm text-zinc-500 mt-2">
                    Stok akan menjadi: <span className={`font-mono font-bold ${adjustmentType === 'add' ? 'text-green-400' : 'text-red-400'
                      }`}>
                      {adjustmentType === 'add'
                        ? adjustingItem.current_stock + parseInt(adjustmentAmount || 0)
                        : adjustingItem.current_stock - parseInt(adjustmentAmount || 0)
                      } {adjustingItem.unit}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <Label className="text-zinc-400 text-sm mb-2">Alasan (Opsional)</Label>
                <Input
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="e.g. Restock, Rusak, Koreksi..."
                />
              </div>

              <Button
                onClick={handleConfirmAdjust}
                disabled={loading || !adjustmentAmount || parseInt(adjustmentAmount) <= 0}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold h-11"
              >
                {loading ? 'Menyimpan...' : 'Konfirmasi Adjustment'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Tambah Item Inventory</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <Button
            onClick={handleAddItem}
            disabled={loading || !formData.sku || !formData.name || !formData.category || !formData.unit || !formData.current_stock || !formData.min_stock || !formData.max_stock || !formData.unit_cost}
            data-testid="submit-inventory-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold h-11 mt-4"
          >
            {loading ? 'Menyimpan...' : 'Tambah Item'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Item Inventory</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <Button
            onClick={handleSaveEdit}
            disabled={loading}
            data-testid="save-edit-inventory-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold h-11 mt-4"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
        title="Hapus Item?"
        description={deleteTarget ? `Item "${deleteTarget.name}" akan dihapus.` : ''}
      />
    </Layout>
  );
};
