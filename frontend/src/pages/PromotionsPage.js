import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import {
    Plus, Search, Edit, Trash2, Tag, Calendar, Percent, DollarSign,
    CheckCircle, XCircle, AlertCircle
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
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

export const PromotionsPage = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        promotion_type: 'percentage',
        value: '',
        min_purchase: '0',
        max_discount: '',
        start_date: '',
        end_date: '',
        usage_limit: '',
    });

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/promotions');
            setPromotions(response.data);
        } catch (error) {
            toast.error('Gagal memuat data promosi');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        // Default dates: today and 30 days from now
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        setFormData({
            code: '',
            name: '',
            description: '',
            promotion_type: 'percentage',
            value: '',
            min_purchase: '0',
            max_discount: '',
            start_date: today,
            end_date: nextMonth,
            usage_limit: '',
        });
    };

    const handleAdd = async () => {
        try {
            setLoading(true);
            await api.post('/promotions', {
                ...formData,
                value: parseFloat(formData.value),
                min_purchase: parseFloat(formData.min_purchase || 0),
                max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                start_date: new Date(formData.start_date).toISOString(), // Backend expects ISO
                end_date: new Date(formData.end_date).toISOString(),
            });
            toast.success('Promo berhasil dibuat');
            setShowAddDialog(false);
            fetchPromotions();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal membuat promo');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (promo) => {
        setEditingPromo(promo);
        setFormData({
            code: promo.code,
            name: promo.name,
            description: promo.description || '',
            promotion_type: promo.promotion_type,
            value: promo.value.toString(),
            min_purchase: promo.min_purchase.toString(),
            max_discount: promo.max_discount ? promo.max_discount.toString() : '',
            start_date: new Date(promo.start_date).toISOString().split('T')[0],
            end_date: new Date(promo.end_date).toISOString().split('T')[0],
            usage_limit: promo.usage_limit ? promo.usage_limit.toString() : '',
        });
        setShowEditDialog(true);
    };

    const handleUpdate = async () => {
        try {
            setLoading(true);
            await api.put(`/promotions/${editingPromo.id}`, {
                ...formData,
                value: parseFloat(formData.value),
                min_purchase: parseFloat(formData.min_purchase || 0),
                max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString(),
            });
            toast.success('Promo berhasil diupdate');
            setShowEditDialog(false);
            setEditingPromo(null);
            fetchPromotions();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal update promo');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            await api.delete(`/promotions/${deleteTarget.id}`);
            toast.success('Promo berhasil dihapus');
            setDeleteTarget(null);
            fetchPromotions();
        } catch (error) {
            toast.error('Gagal menghapus promo');
        } finally {
            setLoading(false);
        }
    };

    const filteredPromotions = promotions.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatus = (promo) => {
        const now = new Date();
        const start = new Date(promo.start_date);
        const end = new Date(promo.end_date);

        if (end < now) return 'expired';
        if (start > now) return 'upcoming';
        if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return 'limit_reached';
        return 'active';
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs font-semibold">Aktif</span>;
            case 'expired': return <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-xs font-semibold">Expired</span>;
            case 'upcoming': return <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs font-semibold">Upcoming</span>;
            case 'limit_reached': return <span className="px-2 py-1 bg-orange-500/20 text-orange-500 rounded text-xs font-semibold">Habis</span>;
            default: return null;
        }
    };

    const renderForm = () => (
        <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <Label className="text-zinc-400 mb-2">Kode Promo *</Label>
                <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="bg-zinc-900 border-zinc-800 text-white font-mono uppercase"
                    placeholder="SUMMER2024"
                    disabled={!!editingPromo}
                />
                <p className="text-xs text-zinc-500 mt-1">Kode unik untuk redeem promo.</p>
            </div>

            <div className="col-span-2">
                <Label className="text-zinc-400 mb-2">Nama Promo *</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                    placeholder="Diskon Awal Tahun"
                />
            </div>

            <div>
                <Label className="text-zinc-400 mb-2">Tipe *</Label>
                <Select
                    value={formData.promotion_type}
                    onValueChange={(val) => setFormData({ ...formData, promotion_type: val })}
                >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="percentage">Persentase (%)</SelectItem>
                        <SelectItem value="fixed_amount">Nominal Tetap (Rp)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label className="text-zinc-400 mb-2">Nilai *</Label>
                <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white font-mono"
                    placeholder={formData.promotion_type === 'percentage' ? '10' : '10000'}
                />
            </div>

            <div>
                <Label className="text-zinc-400 mb-2">Min. Pembelian</Label>
                <Input
                    type="number"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white font-mono"
                    placeholder="0"
                />
            </div>

            {formData.promotion_type === 'percentage' && (
                <div>
                    <Label className="text-zinc-400 mb-2">Maks. Diskon (Rp)</Label>
                    <Input
                        type="number"
                        value={formData.max_discount}
                        onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                        className="bg-zinc-900 border-zinc-800 text-white font-mono"
                        placeholder="Opsional"
                    />
                </div>
            )}

            <div>
                <Label className="text-zinc-400 mb-2">Tanggal Mulai *</Label>
                <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                />
            </div>

            <div>
                <Label className="text-zinc-400 mb-2">Tanggal Berakhir *</Label>
                <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                />
            </div>

            <div className="col-span-2">
                <Label className="text-zinc-400 mb-2">Batas Penggunaan Global (Opsional)</Label>
                <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white font-mono"
                    placeholder="Kosongkan jika tidak terbatas"
                />
            </div>

            <div className="col-span-2">
                <Label className="text-zinc-400 mb-2">Validasi</Label>
                <div className="bg-zinc-900/50 p-3 rounded text-sm text-zinc-400">
                    <p>Potongan: {formData.promotion_type === 'percentage' ? `${formData.value}%` : `Rp ${parseInt(formData.value || 0).toLocaleString('id-ID')}`}</p>
                    <p>Periode: {formData.start_date} s.d {formData.end_date}</p>
                </div>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="animate-fade-in" data-testid="promotions-page">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-1">Marketing</p>
                        <h1 className="text-3xl font-bold text-white">Promo & Diskon</h1>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setShowAddDialog(true); }}
                        className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Promo Baru
                    </Button>
                </div>

                {/* Filter */}
                <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-zinc-900 border-zinc-800 text-white w-full md:w-80"
                            placeholder="Cari kode atau nama promo..."
                        />
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPromotions.map((promo) => {
                        const status = getStatus(promo);

                        return (
                            <div key={promo.id} className={`bg-[#18181b] border rounded-xl p-5 hover:border-[#D4AF37]/50 transition-all ${status === 'expired' ? 'opacity-60' : ''
                                } ${status === 'active' ? 'border-zinc-800' : 'border-zinc-800'}`}>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#D4AF37]/10 p-2.5 rounded-lg border border-[#D4AF37]/20">
                                            <Tag className="w-5 h-5 text-[#D4AF37]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white tracking-wide">{promo.code}</h3>
                                            <p className="text-xs text-zinc-400">{promo.name}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(status)}
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                        <span className="text-zinc-500 text-xs">Nilai Promo</span>
                                        <span className="font-mono font-bold text-[#D4AF37]">
                                            {promo.promotion_type === 'percentage'
                                                ? `${promo.value}%`
                                                : `Rp ${promo.value.toLocaleString('id-ID')}`
                                            }
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Start
                                        </span>
                                        <span className="text-zinc-300">
                                            {new Date(promo.start_date).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> End
                                        </span>
                                        <span className="text-zinc-300">
                                            {new Date(promo.end_date).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>

                                    {promo.usage_limit && (
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-zinc-500">Usage</span>
                                            <span className="font-mono text-zinc-300">
                                                {promo.usage_count} / {promo.usage_limit}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleEdit(promo)}
                                        variant="outline"
                                        className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => setDeleteTarget(promo)}
                                        variant="ghost"
                                        className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredPromotions.length === 0 && (
                        <div className="col-span-full text-center py-12 text-zinc-500">
                            {searchTerm ? 'Tidak ada promo yang cocok' : 'Belum ada promo dibuat'}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Buat Promo Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {renderForm()}
                        <Button
                            onClick={handleAdd}
                            disabled={loading || !formData.code || !formData.name || !formData.value}
                            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Promo'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Promo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {renderForm()}
                        <Button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
                        >
                            {loading ? 'Menyimpan...' : 'Update Promo'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <DeleteConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Hapus Promo?"
                description={`Promo "${deleteTarget?.code}" akan dihapus permanen.`}
            />
        </Layout>
    );
};
