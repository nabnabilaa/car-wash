import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import {
  Plus, UserCheck, UserX, Pencil, Trash2, Building, MapPin, Globe, Save,
  Settings as SettingsIcon, Users, DollarSign, Gift, Bell, Shield, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
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
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';

export const SettingsPage = () => {
  // States
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showAddOutletDialog, setShowAddOutletDialog] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deleteOutletTarget, setDeleteOutletTarget] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form data
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: '',
    phone: '',
    outlet_id: '',
  });

  const [outletForm, setOutletForm] = useState({
    name: '',
    address: '',
    phone: '',
    manager_name: '',
  });

  const [businessSettings, setBusinessSettings] = useState({
    tax_rate: '11',
    business_hours_open: '08:00',
    business_hours_close: '20:00',
    min_opening_balance: '500000',
    max_cash_drop: '5000000',
    auto_close_shift: true,
  });

  const [landingConfig, setLandingConfig] = useState({
    hero_title_1: '',
    hero_title_2: '',
    hero_subtitle: '',
    open_hours: '',
    contact_phone: '',
    contact_address: '',
    contact_maps_url: '',
    contact_instagram: '',
  });

  const currentUser = getCurrentUser();
  const isOwner = currentUser?.role === 'owner';

  // Fetch data
  useEffect(() => {
    fetchUsers();
    fetchOutlets();
    fetchLandingConfig();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Gagal memuat data users');
    }
  };

  const fetchOutlets = async () => {
    try {
      const response = await api.get('/outlets');
      setOutlets(response.data);
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  const fetchLandingConfig = async () => {
    try {
      const response = await api.get('/public/landing-config');
      setLandingConfig(response.data);
    } catch (error) {
      console.error('Failed to fetch landing config', error);
    }
  };

  // User Management
  const handleAddUser = async () => {
    if (!userForm.username || !userForm.password || !userForm.full_name || !userForm.role) {
      toast.error('Mohon lengkapi data yang diperlukan');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        ...userForm,
        outlet_id: userForm.outlet_id || null,
      });
      toast.success('User berhasil ditambahkan');
      setShowAddUserDialog(false);
      setUserForm({ username: '', password: '', full_name: '', email: '', role: '', phone: '', outlet_id: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: '',
      full_name: user.full_name,
      email: user.email || '',
      role: user.role,
      phone: user.phone || '',
      outlet_id: user.outlet_id || '',
    });
    setShowEditUserDialog(true);
  };

  const handleSaveEditUser = async () => {
    setLoading(true);
    try {
      await api.put(`/users/${editingUser.id}`, {
        full_name: userForm.full_name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        outlet_id: userForm.outlet_id || null,
      });
      toast.success('User berhasil diupdate');
      setShowEditUserDialog(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Gagal update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setLoading(true);
    try {
      await api.delete(`/users/${deleteUserTarget.id}`);
      toast.success('User berhasil dihapus');
      setDeleteUserTarget(null);
      fetchUsers();
    } catch (error) {
      toast.error('Gagal menghapus user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      await api.put(`/users/${user.id}`, {
        ...user,
        is_active: !user.is_active,
      });
      toast.success(`User ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Gagal mengubah status user');
    }
  };

  // Outlet Management
  const handleAddOutlet = async () => {
    if (!outletForm.name || !outletForm.address) {
      toast.error('Mohon lengkapi data yang diperlukan');
      return;
    }

    setLoading(true);
    try {
      await api.post('/outlets', outletForm);
      toast.success('Outlet berhasil ditambahkan');
      setShowAddOutletDialog(false);
      setOutletForm({ name: '', address: '', phone: '', manager_name: '' });
      fetchOutlets();
    } catch (error) {
      toast.error('Gagal menambahkan outlet');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOutlet = async () => {
    setLoading(true);
    try {
      await api.delete(`/outlets/${deleteOutletTarget.id}`);
      toast.success('Outlet berhasil dihapus');
      setDeleteOutletTarget(null);
      fetchOutlets();
    } catch (error) {
      toast.error('Gagal menghapus outlet');
    } finally {
      setLoading(false);
    }
  };

  // Business Settings
  const handleSaveBusinessSettings = async () => {
    setLoading(true);
    try {
      // Simpan ke localStorage untuk demo (nanti bisa ke backend)
      localStorage.setItem('businessSettings', JSON.stringify(businessSettings));
      toast.success('Pengaturan bisnis berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  // Landing Config
  const handleSaveLandingConfig = async () => {
    setLoading(true);
    try {
      await api.put('/landing-config', landingConfig);
      toast.success('Landing page berhasil diupdate');
    } catch (error) {
      toast.error('Gagal update landing page');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const userStats = useMemo(() => {
    const active = users.filter(u => u.is_active).length;
    const byRole = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});
    return { total: users.length, active, byRole };
  }, [users]);

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-8 bg-[#D4AF37] rounded-full" />
            <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider">KONFIGURASI</span>
          </div>
          <h1 className="text-3xl font-secondary font-bold text-white mb-2">System Settings</h1>
          <p className="text-zinc-500">Kelola users, outlets, dan konfigurasi sistem</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 gap-1">
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="outlets"
              className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
            >
              <Building className="w-4 h-4 mr-2" />
              Outlets
            </TabsTrigger>
            <TabsTrigger
              value="business"
              className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Business
            </TabsTrigger>
            <TabsTrigger
              value="landing"
              className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
            >
              <Globe className="w-4 h-4 mr-2" />
              Landing Page
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <p className="text-zinc-500 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white font-mono">{userStats.total}</p>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <UserCheck className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-zinc-500 text-sm">Active Users</p>
                <p className="text-3xl font-bold text-green-500 font-mono">{userStats.active}</p>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-zinc-500 text-sm">Owners</p>
                <p className="text-3xl font-bold text-blue-500 font-mono">{userStats.byRole.owner || 0}</p>
              </div>
            </div>

            {/* Add User Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowAddUserDialog(true)}
                className="bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah User
              </Button>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-2 gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 hover:border-[#D4AF37]/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center text-black font-bold text-lg">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-white font-bold">{user.full_name}</h3>
                        <p className="text-sm text-zinc-500">@{user.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditUser(user)}
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteUserTarget(user)}
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Role:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${user.role === 'owner' ? 'bg-blue-500/20 text-blue-400' :
                          user.role === 'manager' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-green-500/20 text-green-400'
                        }`}>
                        {user.role}
                      </span>
                    </div>

                    {user.email && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Email:</span>
                        <span className="text-white">{user.email}</span>
                      </div>
                    )}

                    {user.phone && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Phone:</span>
                        <span className="text-white">{user.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                      <span className="text-sm text-zinc-500">Status:</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${user.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => handleToggleUserStatus(user)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {users.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                Belum ada user
              </div>
            )}
          </TabsContent>

          {/* Outlets Tab */}
          <TabsContent value="outlets" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Outlet Management</h2>
                <p className="text-sm text-zinc-500">Kelola cabang dan lokasi usaha</p>
              </div>
              <Button
                onClick={() => setShowAddOutletDialog(true)}
                className="bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Outlet
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {outlets.map((outlet) => (
                <div
                  key={outlet.id}
                  className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 hover:border-[#D4AF37]/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center">
                        <Building className="w-6 h-6 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">{outlet.name}</h3>
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {outlet.address}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteOutletTarget(outlet)}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {outlet.phone && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Phone:</span>
                        <span className="text-white">{outlet.phone}</span>
                      </div>
                    )}
                    {outlet.manager_name && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Manager:</span>
                        <span className="text-white">{outlet.manager_name}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-zinc-800">
                      <span className="text-zinc-500">Status:</span>
                      <span className="text-green-400 text-sm font-medium">Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Business Settings Tab */}
          <TabsContent value="business" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Business Configuration</h2>
              <p className="text-sm text-zinc-500">Konfigurasi tax, jam operasional, dan shift management</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Tax & Pricing */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                  Tax & Pricing
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-400 text-sm mb-2">Tax Rate (PPN %)</Label>
                    <Input
                      type="number"
                      value={businessSettings.tax_rate}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, tax_rate: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white font-mono"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Pajak otomatis diterapkan ke semua transaksi</p>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#D4AF37]" />
                  Business Hours
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-400 text-sm mb-2">Jam Buka</Label>
                    <Input
                      type="time"
                      value={businessSettings.business_hours_open}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, business_hours_open: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-sm mb-2">Jam Tutup</Label>
                    <Input
                      type="time"
                      value={businessSettings.business_hours_close}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, business_hours_close: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Shift Management */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6 col-span-2">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#D4AF37]" />
                  Shift Management
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-400 text-sm mb-2">Minimum Opening Balance</Label>
                    <Input
                      type="number"
                      value={businessSettings.min_opening_balance}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, min_opening_balance: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white font-mono"
                      placeholder="500000"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Modal minimum untuk buka shift</p>
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-sm mb-2">Maximum Cash Drop</Label>
                    <Input
                      type="number"
                      value={businessSettings.max_cash_drop}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, max_cash_drop: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white font-mono"
                      placeholder="5000000"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Maksimum cash drop per shift</p>
                  </div>
                  <div className="flex items-center justify-between col-span-2 pt-2 border-t border-zinc-800">
                    <div>
                      <Label className="text-white text-sm mb-1">Auto Close Shift</Label>
                      <p className="text-xs text-zinc-500">Tutup shift otomatis setelah jam tutup</p>
                    </div>
                    <Switch
                      checked={businessSettings.auto_close_shift}
                      onCheckedChange={(checked) => setBusinessSettings({ ...businessSettings, auto_close_shift: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveBusinessSettings}
                disabled={loading}
                className="bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </div>
          </TabsContent>

          {/* Landing Page Tab */}
          <TabsContent value="landing" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Landing Page Configuration</h2>
              <p className="text-sm text-zinc-500">Konfigurasi konten halaman landing page publik</p>
            </div>

            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6 space-y-4">
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Hero Title 1</Label>
                <Input
                  value={landingConfig.hero_title_1}
                  onChange={(e) => setLandingConfig({ ...landingConfig, hero_title_1: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="Premium Car Wash"
                />
              </div>

              <div>
                <Label className="text-zinc-400 text-sm mb-2">Hero Title 2</Label>
                <Input
                  value={landingConfig.hero_title_2}
                  onChange={(e) => setLandingConfig({ ...landingConfig, hero_title_2: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="Service Excellence"
                />
              </div>

              <div>
                <Label className="text-zinc-400 text-sm mb-2">Hero Subtitle</Label>
                <Textarea
                  value={landingConfig.hero_subtitle}
                  onChange={(e) => setLandingConfig({ ...landingConfig, hero_subtitle: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="Deskripsi singkat bisnis Anda"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-sm mb-2">Jam Operasional</Label>
                  <Input
                    value={landingConfig.open_hours}
                    onChange={(e) => setLandingConfig({ ...landingConfig, open_hours: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                    placeholder="Senin - Minggu, 08:00 - 20:00"
                  />
                </div>

                <div>
                  <Label className="text-zinc-400 text-sm mb-2">Phone</Label>
                  <Input
                    value={landingConfig.contact_phone}
                    onChange={(e) => setLandingConfig({ ...landingConfig, contact_phone: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                    placeholder="021-12345678"
                  />
                </div>

                <div>
                  <Label className="text-zinc-400 text-sm mb-2">Instagram</Label>
                  <Input
                    value={landingConfig.contact_instagram}
                    onChange={(e) => setLandingConfig({ ...landingConfig, contact_instagram: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                    placeholder="@otopia_carwash"
                  />
                </div>

                <div>
                  <Label className="text-zinc-400 text-sm mb-2">Google Maps URL</Label>
                  <Input
                    value={landingConfig.contact_maps_url}
                    onChange={(e) => setLandingConfig({ ...landingConfig, contact_maps_url: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                    placeholder="https://goo.gl/maps/..."
                  />
                </div>
              </div>

              <div>
                <Label className="text-zinc-400 text-sm mb-2">Address</Label>
                <Textarea
                  value={landingConfig.contact_address}
                  onChange={(e) => setLandingConfig({ ...landingConfig, contact_address: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="Jl. Sudirman No. 123, Jakarta"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveLandingConfig}
                disabled={loading}
                className="bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Menyimpan...' : 'Simpan Landing Config'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add User Dialog */}
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Username *</Label>
                <Input
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Password *</Label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Full Name *</Label>
                <Input
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Email</Label>
                <Input
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Phone</Label>
                <Input
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Role *</Label>
                <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="kasir">Kasir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Outlet</Label>
                <Select value={userForm.outlet_id} onValueChange={(value) => setUserForm({ ...userForm, outlet_id: value })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Pilih outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddUser}
                disabled={loading}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
              >
                {loading ? 'Menyimpan...' : 'Tambah User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Full Name</Label>
                <Input
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Email</Label>
                <Input
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Phone</Label>
                <Input
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Role</Label>
                <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="kasir">Kasir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Outlet</Label>
                <Select value={userForm.outlet_id} onValueChange={(value) => setUserForm({ ...userForm, outlet_id: value })}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Pilih outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSaveEditUser}
                disabled={loading}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Outlet Dialog */}
        <Dialog open={showAddOutletDialog} onOpenChange={setShowAddOutletDialog}>
          <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Outlet Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Nama Outlet *</Label>
                <Input
                  value={outletForm.name}
                  onChange={(e) => setOutletForm({ ...outletForm, name: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="OTOPIA Car Wash - Sudirman"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Alamat *</Label>
                <Textarea
                  value={outletForm.address}
                  onChange={(e) => setOutletForm({ ...outletForm, address: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="Jl. Sudirman No. 123, Jakarta"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Phone</Label>
                <Input
                  value={outletForm.phone}
                  onChange={(e) => setOutletForm({ ...outletForm, phone: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="021-12345678"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-sm mb-2">Manager Name</Label>
                <Input
                  value={outletForm.manager_name}
                  onChange={(e) => setOutletForm({ ...outletForm, manager_name: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="Budi Santoso"
                />
              </div>
              <Button
                onClick={handleAddOutlet}
                disabled={loading}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
              >
                {loading ? 'Menyimpan...' : 'Tambah Outlet'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation */}
        <DeleteConfirmDialog
          open={!!deleteUserTarget}
          onOpenChange={() => setDeleteUserTarget(null)}
          onConfirm={handleDeleteUser}
          loading={loading}
          title="Hapus User?"
          description={deleteUserTarget ? `User "${deleteUserTarget.full_name}" akan dihapus dari sistem.` : ''}
        />

        {/* Delete Outlet Confirmation */}
        <DeleteConfirmDialog
          open={!!deleteOutletTarget}
          onOpenChange={() => setDeleteOutletTarget(null)}
          onConfirm={handleDeleteOutlet}
          loading={loading}
          title="Hapus Outlet?"
          description={deleteOutletTarget ? `Outlet "${deleteOutletTarget.name}" akan dihapus dari sistem.` : ''}
        />
      </div>
    </Layout>
  );
};
