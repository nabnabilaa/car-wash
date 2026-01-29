import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { Plus, Trash2, Calendar, DollarSign, PieChart } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';

export const ExpensesPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [formData, setFormData] = useState({
        category: 'Jasa & Sewa',
        amount: '',
        description: '',
        payment_method: 'transfer'
    });

    const categories = [
        "Sewa Tempat",
        "Listrik & Air",
        "Internet & WiFi",
        "Gaji Pokok",
        "Maintenance Alat",
        "Pemasaran/Iklan",
        "Konsumsi Staff",
        "Lainnya"
    ];

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const response = await api.get('/expenses');
            setExpenses(response.data);
        } catch (error) {
            toast.error('Gagal memuat data pengeluaran');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return expenses.reduce((sum, item) => sum + item.amount, 0);
    };

    const handleSubmit = async () => {
        if (!formData.amount || !formData.description) {
            toast.error('Mohon lengkapi data');
            return;
        }

        try {
            await api.post('/expenses', {
                ...formData,
                amount: parseFloat(formData.amount)
            });
            toast.success('Pengeluaran berhasil dicatat');
            setShowAddDialog(false);
            setFormData({
                category: 'Lainnya',
                amount: '',
                description: '',
                payment_method: 'transfer'
            });
            fetchExpenses();
        } catch (error) {
            toast.error('Gagal menyimpan pengeluaran');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus data ini?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            toast.success('Pengeluaran dihapus');
            fetchExpenses();
        } catch (error) {
            toast.error('Gagal menghapus data');
        }
    };

    return (
        <Layout>
            <div className="animate-fade-in" data-testid="expenses-page">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-secondary font-bold text-4xl text-white mb-2">Operational Expenses</h1>
                        <p className="text-zinc-400">Catat biaya operasional (Listrik, Sewa, Gaji, dll)</p>
                    </div>
                    <Button
                        onClick={() => setShowAddDialog(true)}
                        className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Catat Pengeluaran
                    </Button>
                </div>

                {/* Stats Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#18181b] border border-zinc-800 p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-red-500/10 rounded-lg">
                                <DollarSign className="w-6 h-6 text-red-500" />
                            </div>
                            <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2 py-1 rounded">Total Bulan Ini</span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">Rp {calculateTotal().toLocaleString('id-ID')}</p>
                        <p className="text-sm text-zinc-500">Total Pengeluaran Operasional</p>
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-800">
                        <h2 className="font-semibold text-white">Riwayat Pengeluaran</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50">
                                <tr>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                    <th className="px-6 py-4">Metode Bayar</th>
                                    <th className="px-6 py-4">Admin</th>
                                    <th className="px-6 py-4 text-right">Jumlah</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-zinc-500">
                                            Belum ada data pengeluaran
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-zinc-300">
                                                {new Date(expense.date).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs border border-zinc-700">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-300">{expense.description}</td>
                                            <td className="px-6 py-4 text-zinc-400 capitalize">{expense.payment_method}</td>
                                            <td className="px-6 py-4 text-zinc-400 text-xs">{expense.created_by}</td>
                                            <td className="px-6 py-4 text-right font-mono font-medium text-red-400">
                                                Rp {expense.amount.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="text-zinc-500 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="bg-[#18181b] border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <Label className="mb-2 block text-zinc-400">Kategori Biaya</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="mb-2 block text-zinc-400">Nominal (Rp)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 font-mono"
                            />
                        </div>

                        <div>
                            <Label className="mb-2 block text-zinc-400">Keterangan Detail</Label>
                            <Textarea
                                placeholder="Ex: Bayar tagihan listrik bulan Januari"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>

                        <div>
                            <Label className="mb-2 block text-zinc-400">Metode Pembayaran</Label>
                            <Select
                                value={formData.payment_method}
                                onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
                            >
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="cash">Cash (Brankas)</SelectItem>
                                    <SelectItem value="credit_card">Kartu Kredit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleSubmit} className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] mt-4">
                            Simpan Pengeluaran
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Layout>
    );
};
