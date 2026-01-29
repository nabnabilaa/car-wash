import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
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
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

export const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBOMDialog, setShowBOMDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    category: '',
    image_url: '',
  });

  const [bomItems, setBomItems] = useState([]);
  const [newBomItem, setNewBomItem] = useState({ inventory_id: '', quantity: '' });

  useEffect(() => {
    fetchServices();
    fetchInventory();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Gagal memuat data layanan');
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
      duration_minutes: '',
      category: '',
      image_url: '',
    });
    setBomItems([]);
  };

  const handleAddService = async () => {
    setLoading(true);
    try {
      await api.post('/services', {
        ...formData,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
        bom: bomItems.map(b => ({
          inventory_id: b.inventory_id,
          inventory_name: b.inventory_name,
          quantity: parseFloat(b.quantity),
          unit: b.unit
        }))
      });
      toast.success('Layanan berhasil ditambahkan');
      setShowAddDialog(false);
      resetForm();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan layanan');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      category: service.category,
      image_url: service.image_url || '',
    });
    setBomItems(service.bom || []);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await api.put(`/services/${editingService.id}`, {
        ...formData,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
        bom: bomItems.map(b => ({
          inventory_id: b.inventory_id,
          inventory_name: b.inventory_name,
          quantity: parseFloat(b.quantity),
          unit: b.unit
        }))
      });
      toast.success('Layanan berhasil diupdate');
      setShowEditDialog(false);
      setEditingService(null);
      resetForm();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal update layanan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/services/${deleteTarget.id}`);
      toast.success('Layanan berhasil dinonaktifkan');
      setDeleteTarget(null);
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus layanan');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBomItem = () => {
    if (!newBomItem.inventory_id || !newBomItem.quantity) {
      toast.error('Pilih item dan masukkan jumlah');
      return;
    }

    const inventoryItem = inventory.find(i => i.id === newBomItem.inventory_id);
    if (!inventoryItem) return;

    // Check if already exists
    if (bomItems.find(b => b.inventory_id === newBomItem.inventory_id)) {
      toast.error('Item sudah ada di BOM');
      return;
    }

    setBomItems([...bomItems, {
      inventory_id: inventoryItem.id,
      inventory_name: inventoryItem.name,
      quantity: parseFloat(newBomItem.quantity),
      unit: inventoryItem.unit
    }]);

    setNewBomItem({ inventory_id: '', quantity: '' });
  };

  const handleRemoveBomItem = (inventoryId) => {
    setBomItems(bomItems.filter(b => b.inventory_id !== inventoryId));
  };

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {});

  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-zinc-400 mb-2">Nama Layanan *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          data-testid="service-name-input"
          className="bg-zinc-900/50 border-zinc-800 text-white"
          placeholder="Cuci Eksterior Medium"
        />
      </div>
      <div>
        <Label className="text-zinc-400 mb-2">Deskripsi</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-zinc-900/50 border-zinc-800 text-white"
          placeholder="Deskripsi layanan..."
          rows={3}
        />
      </div>
      <div>
        <Label className="text-zinc-400 mb-2">Kategori *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white" data-testid="service-category-select">
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="exterior">Exterior</SelectItem>
            <SelectItem value="interior">Interior</SelectItem>
            <SelectItem value="detailing">Detailing</SelectItem>
            <SelectItem value="coating">Coating</SelectItem>
            <SelectItem value="polish">Polish</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-zinc-400 mb-2">Harga *</Label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            data-testid="service-price-input"
            className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
            placeholder="0"
          />
        </div>
        <div>
          <Label className="text-zinc-400 mb-2">Durasi (menit) *</Label>
          <Input
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
            data-testid="service-duration-input"
            className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
            placeholder="30"
          />
        </div>
      </div>

      <div>
        <Label className="text-zinc-400 mb-2">Image URL (Opsional)</Label>
        <Input
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          className="bg-zinc-900/50 border-zinc-800 text-white"
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-zinc-500 mt-1">URL gambar untuk layanan ini</p>
      </div>

      {/* BOM Section */}
      <div className="pt-4 border-t border-zinc-800">
        <Label className="text-zinc-400 mb-2 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Bill of Materials (BOM) - Opsional
        </Label>
        <p className="text-xs text-zinc-500 mb-3">
          Item inventory yang akan dikurangi setiap kali layanan ini digunakan
        </p>

        {/* Add BOM Item */}
        <div className="flex gap-2 mb-3">
          <Select
            value={newBomItem.inventory_id}
            onValueChange={(value) => setNewBomItem({ ...newBomItem, inventory_id: value })}
          >
            <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white flex-1" data-testid="bom-inventory-select">
              <SelectValue placeholder="Pilih item inventory" />
            </SelectTrigger>
            <SelectContent>
              {inventory.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} ({item.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={newBomItem.quantity}
            onChange={(e) => setNewBomItem({ ...newBomItem, quantity: e.target.value })}
            className="bg-zinc-900/50 border-zinc-800 text-white w-24"
            placeholder="Qty"
          />
          <Button
            onClick={handleAddBomItem}
            type="button"
            className="bg-zinc-800 text-white hover:bg-zinc-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* BOM List */}
        {bomItems.length > 0 && (
          <div className="space-y-2">
            {bomItems.map((item) => (
              <div key={item.inventory_id} className="flex items-center justify-between bg-zinc-900/50 p-2 rounded">
                <span className="text-sm text-white">
                  {item.inventory_name} - {item.quantity} {item.unit}
                </span>
                <Button
                  onClick={() => handleRemoveBomItem(item.inventory_id)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="animate-fade-in" data-testid="services-page">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-1">Layanan</p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Services</h1>
              <p className="text-zinc-500 text-sm">Kelola paket layanan car wash</p>
            </div>
            <Button
              onClick={() => { resetForm(); setShowAddDialog(true); }}
              data-testid="add-service-button"
              className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Layanan
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Package className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-zinc-500 text-sm">Total Services</p>
            <p className="text-2xl font-bold text-white">{services.length}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Plus className="w-5 h-5 text-[#D4AF37] mb-2" />
            <p className="text-zinc-500 text-sm">Harga Rata-rata</p>
            <p className="text-xl font-bold text-white font-mono">
              Rp {services.length > 0 ? Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length).toLocaleString('id-ID') : 0}
            </p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Package className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-zinc-500 text-sm">dengan BOM</p>
            <p className="text-2xl font-bold text-white">{services.filter(s => s.bom && s.bom.length > 0).length}</p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Plus className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-zinc-500 text-sm">Kategori</p>
            <p className="text-2xl font-bold text-white">{Object.keys(groupedServices).length}</p>
          </div>
        </div>

        {/* Services by Category */}
        {Object.keys(groupedServices).map((category) => (
          <div key={category} className="mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white capitalize">{category}</h2>
              <div className="h-1 w-16 bg-[#D4AF37] mt-2 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedServices[category].map((service) => (
                <div
                  key={service.id}
                  className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-all group h-full flex flex-col"
                >
                  {/* Service Image */}
                  {service.image_url && (
                    <div className="h-48 bg-zinc-900 overflow-hidden">
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x200.png?text=No+Image';
                        }}
                      />
                    </div>
                  )}

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{service.name}</h3>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleEdit(service)}
                          size="sm"
                          variant="ghost"
                          data-testid={`edit-service-${service.id}`}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setDeleteTarget(service)}
                          size="sm"
                          variant="ghost"
                          data-testid={`delete-service-${service.id}`}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-500 mb-3 line-clamp-2">
                      {service.description || 'Tidak ada deskripsi'}
                    </p>

                    {/* BOM Info */}
                    {service.bom && service.bom.length > 0 && (
                      <div className="mb-3 p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          BOM ({service.bom.length} item)
                        </p>
                        <p className="text-xs text-zinc-400">
                          {service.bom.map(b => `${b.inventory_name}`).join(', ')}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800 mt-auto">
                      <div>
                        <p className="text-xs text-zinc-500 mb-0.5">Harga</p>
                        <p className="font-mono text-lg font-bold text-[#D4AF37]">
                          Rp {service.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 mb-0.5">Durasi</p>
                        <p className="font-mono text-sm text-white">{service.duration_minutes} menit</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            Belum ada layanan
          </div>
        )}
      </div>

      {/* Add Service Dialog */}
      < Dialog open={showAddDialog} onOpenChange={setShowAddDialog} >
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Tambah Layanan</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <Button
            onClick={handleAddService}
            disabled={loading || !formData.name || !formData.category || !formData.price || !formData.duration_minutes}
            data-testid="submit-service-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
          >
            {loading ? 'Menyimpan...' : 'Tambah Layanan'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Edit Layanan</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <Button
            onClick={handleSaveEdit}
            disabled={loading}
            data-testid="save-edit-service-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
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
        title="Nonaktifkan Layanan?"
        description={deleteTarget ? `Layanan "${deleteTarget.name}" akan dinonaktifkan dan tidak akan muncul di POS.` : ''}
      />
    </Layout>
  );
};
