import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { Plus, Download, Pencil, Trash2, Package, Link, AlertCircle } from 'lucide-react';
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
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { exportToExcel } from '../utils/excelExport';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

const PRODUCT_CATEGORIES = [
  { value: 'accessories', label: 'Aksesoris Mobil' },
  { value: 'parfum', label: 'Parfum & Pewangi' },
  { value: 'cleaning', label: 'Alat Pembersih' },
  { value: 'care', label: 'Perawatan Mobil' },
  { value: 'other', label: 'Lainnya' },
];

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    inventory_id: '',
    image_url: '',
    min_stock_level: '5',
    reorder_point: '10',
    reorder_quantity: '50',
  });

  useEffect(() => {
    fetchProducts();
    fetchInventory();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.error('Gagal memuat data produk');
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      inventory_id: '',
    });
  };

  const handleAddProduct = async () => {
    setLoading(true);
    try {
      await api.post('/products', {
        ...formData,
        price: parseFloat(formData.price),
        inventory_id: formData.inventory_id || null,
        min_stock_level: parseInt(formData.min_stock_level) || 5,
      });
      toast.success('Produk berhasil ditambahkan');
      setShowAddDialog(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan produk');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      inventory_id: product.inventory_id || '',
      image_url: product.image_url || '',
      min_stock_level: (product.min_stock_level || 5).toString(),
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await api.put(`/products/${editingProduct.id}`, {
        ...formData,
        price: parseFloat(formData.price),
        inventory_id: formData.inventory_id || null,
        min_stock_level: parseInt(formData.min_stock_level) || 5,
      });
      toast.success('Produk berhasil diupdate');
      setShowEditDialog(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal update produk');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      toast.success('Produk berhasil dihapus');
      setDeleteTarget(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus produk');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = products.map(p => ({
      'Nama Produk': p.name,
      'Deskripsi': p.description || '-',
      'Kategori': PRODUCT_CATEGORIES.find(c => c.value === p.category)?.label || p.category,
      'Harga': p.price,
      'Stok': p.stock ?? 'N/A',
      'Unit': p.unit || '-',
    }));

    const success = exportToExcel(exportData, `products-${new Date().toISOString().split('T')[0]}`, 'Products');
    if (success) {
      toast.success('Data berhasil di-export');
    } else {
      toast.error('Gagal export data');
    }
  };

  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-zinc-400 mb-2">Nama Produk *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          data-testid="product-name-input"
          className="bg-zinc-900/50 border-zinc-800 text-white"
          placeholder="Parfum Mobil"
        />
      </div>
      <div>
        <Label className="text-zinc-400 mb-2">Deskripsi</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-zinc-900/50 border-zinc-800 text-white"
          placeholder="Deskripsi produk..."
          rows={3}
        />
      </div>
      <div>
        <Label className="text-zinc-400 mb-2">Kategori *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white" data-testid="product-category-select">
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-zinc-400 mb-2">Harga Jual *</Label>
        <Input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          data-testid="product-price-input"
          className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
          placeholder="0"
        />
      </div>
      <div>
        <Label className="text-zinc-400 mb-2 flex items-center gap-2">
          <Link className="w-4 h-4" />
          Link ke Inventory (Opsional)
        </Label>
        <p className="text-xs text-zinc-500 mb-2">
          Jika produk terhubung ke inventory, stok akan dikelola otomatis
        </p>
        <Select
          value={formData.inventory_id || 'none'}
          onValueChange={(value) => setFormData({ ...formData, inventory_id: value === 'none' ? '' : value })}
        >
          <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white" data-testid="product-inventory-select">
            <SelectValue placeholder="Pilih item inventory (opsional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Tidak terhubung</SelectItem>
            {inventory.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} ({item.current_stock} {item.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-zinc-400 mb-2">Image URL (Opsional)</Label>
        <Input
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          className="bg-zinc-900/50 border-zinc-800 text-white"
          placeholder="https://example.com/product.jpg"
        />
        <p className="text-xs text-zinc-500 mt-1">URL gambar produk</p>
      </div>

      <div>
        <Label className="text-zinc-400 mb-2">Min Stock Alert Level</Label>
        <Input
          type="number"
          value={formData.min_stock_level}
          onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
          className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
          placeholder="5"
        />
        <p className="text-xs text-zinc-500 mt-1">Alert akan muncul jika stok di bawah angka ini</p>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="animate-fade-in" data-testid="products-page">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-1">Produk</p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Produk</h1>
              <p className="text-zinc-500 text-sm">Kelola produk yang dijual di outlet</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                data-testid="export-products-button"
                className="bg-zinc-800 text-white hover:bg-zinc-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button
                onClick={() => { resetForm(); setShowAddDialog(true); }}
                data-testid="add-product-button"
                className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Package className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-zinc-500 text-sm">Total Produk</p>
            <p className="text-2xl font-bold text-white">{products.length}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Link className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-zinc-500 text-sm">Terhubung Inventory</p>
            <p className="text-2xl font-bold text-green-400">{products.filter(p => p.inventory_id).length}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-400 mb-2" />
            <p className="text-zinc-500 text-sm">Stok Rendah</p>
            <p className="text-2xl font-bold text-red-400">
              {products.filter(p => p.inventory_id && p.stock !== null && p.stock <= (p.min_stock_level || 5)).length}
            </p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Package className="w-5 h-5 text-[#D4AF37] mb-2" />
            <p className="text-zinc-500 text-sm">Kategori</p>
            <p className="text-2xl font-bold text-white">{Object.keys(groupedProducts).length}</p>
          </div>
        </div>

        {/* Products by Category */}
        {Object.keys(groupedProducts).map((category) => (
          <div key={category} className="mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">
                {PRODUCT_CATEGORIES.find(c => c.value === category)?.label || category}
              </h2>
              <div className="h-1 w-16 bg-[#D4AF37] mt-2 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedProducts[category].map((product) => {
                const stockLevel = product.stock || 0;
                const minLevel = product.min_stock_level || 5;
                const stockClass = stockLevel === 0 ? 'text-red-500' :
                  stockLevel <= minLevel ? 'text-orange-500' :
                    stockLevel <= minLevel * 2 ? 'text-yellow-500' : 'text-green-500';

                return (
                  <div
                    key={product.id}
                    className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-all group"
                  >
                    {/* Product Image */}
                    {product.image_url && (
                      <div className="h-48 bg-zinc-900 overflow-hidden relative">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300x200.png?text=No+Image';
                          }}
                        />
                        {/* Stock Badge on Image */}
                        {product.inventory_id && stockLevel <= minLevel && (
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${stockLevel === 0 ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                              }`}>
                              {stockLevel === 0 ? 'Habis' : 'Stok Rendah'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-white flex-1">{product.name}</h3>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleEdit(product)}
                            size="sm"
                            variant="ghost"
                            data-testid={`edit-product-${product.id}`}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => setDeleteTarget(product)}
                            size="sm"
                            variant="ghost"
                            data-testid={`delete-product-${product.id}`}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-zinc-500 mb-3 line-clamp-2">
                        {product.description || 'Tidak ada deskripsi'}
                      </p>

                      {/* Stock Info */}
                      {product.inventory_id && (
                        <div className="mb-3 p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                              <Link className="w-3 h-3" />
                              Stok Tersedia
                            </span>
                            <span className={`text-sm font-mono font-bold ${stockClass}`}>
                              {product.stock !== null ? `${product.stock} ${product.unit || 'pcs'}` : 'N/A'}
                            </span>
                          </div>
                          {/* Stock Progress Bar */}
                          {product.stock !== null && (
                            <div className="mt-2">
                              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${stockLevel === 0 ? 'bg-red-500' :
                                    stockLevel <= minLevel ? 'bg-orange-500' :
                                      stockLevel <= minLevel * 2 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${Math.min((stockLevel / (minLevel * 3)) * 100, 100)}%` }}
                                />
                              </div>
                              <p className="text-xs text-zinc-600 mt-1">Min: {minLevel} {product.unit || 'pcs'}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-3 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">Harga Jual</span>
                          <span className="font-mono text-lg font-bold text-[#D4AF37]">
                            Rp {product.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {
          products.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada produk</p>
              <p className="text-sm mt-2">Tambahkan produk untuk mulai menjual</p>
            </div>
          )
        }
      </div >

      {/* Add Product Dialog */}
      < Dialog open={showAddDialog} onOpenChange={setShowAddDialog} >
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Tambah Produk</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <Button
            onClick={handleAddProduct}
            disabled={loading || !formData.name || !formData.category || !formData.price}
            data-testid="submit-product-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
          >
            {loading ? 'Menyimpan...' : 'Tambah Produk'}
          </Button>
        </DialogContent>
      </Dialog >

      {/* Edit Product Dialog */}
      < Dialog open={showEditDialog} onOpenChange={setShowEditDialog} >
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Edit Produk</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <Button
            onClick={handleSaveEdit}
            disabled={loading}
            data-testid="save-edit-product-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogContent>
      </Dialog >

      {/* Delete Confirmation */}
      < DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
        title="Hapus Produk?"
        description={deleteTarget ? `Produk "${deleteTarget.name}" akan dihapus dan tidak akan muncul di POS.` : ''}
      />
    </Layout >
  );
};
