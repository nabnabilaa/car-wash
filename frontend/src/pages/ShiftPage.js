import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { DoorOpen, DoorClosed, AlertCircle, Banknote, ArrowDownCircle, ArrowUpCircle, FileText, Search, CreditCard, Wallet, QrCode } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const CashDenominationInput = ({ value, onChange, label = "Hitung Uang Fisik" }) => {
  const denominations = [
    { key: 'd100k', label: '100.000', val: 100000 },
    { key: 'd50k', label: '50.000', val: 50000 },
    { key: 'd20k', label: '20.000', val: 20000 },
    { key: 'd10k', label: '10.000', val: 10000 },
    { key: 'd5k', label: '5.000', val: 5000 },
    { key: 'd2k', label: '2.000', val: 2000 },
    { key: 'd1k', label: '1.000', val: 1000 },
  ];

  const handleQtyChange = (key, qty) => {
    const newVal = { ...value, [key]: parseInt(qty) || 0 };
    // Recalculate total
    let total = 0;
    denominations.forEach(d => {
      total += (newVal[d.key] || 0) * d.val;
    });
    total += parseFloat(newVal.coins || 0);
    newVal.total = total;
    onChange(newVal);
  };

  const handleCoinsChange = (amount) => {
    const newVal = { ...value, coins: parseFloat(amount) || 0 };
    let total = 0;
    denominations.forEach(d => {
      total += (newVal[d.key] || 0) * d.val;
    });
    total += newVal.coins;
    newVal.total = total;
    onChange(newVal);
  };

  return (
    <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
      <Label className="text-zinc-400 mb-4 block font-semibold">{label}</Label>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {denominations.map((d) => (
          <div key={d.key} className="flex items-center justify-between">
            <span className="text-sm text-zinc-300 w-20">Rp {d.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-xs">x</span>
              <Input
                type="number"
                min="0"
                value={value[d.key] || ''}
                onChange={(e) => handleQtyChange(d.key, e.target.value)}
                className="w-20 h-8 bg-zinc-800 border-zinc-700 text-right font-mono"
                placeholder="0"
              />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between col-span-2 mt-2 pt-2 border-t border-zinc-800">
          <span className="text-sm text-zinc-300">Uang Koin (Total)</span>
          <Input
            type="number"
            min="0"
            value={value.coins || ''}
            onChange={(e) => handleCoinsChange(e.target.value)}
            className="w-32 h-8 bg-zinc-800 border-zinc-700 text-right font-mono"
            placeholder="0"
          />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
        <span className="font-bold text-white">Total Fisik</span>
        <span className="font-mono text-xl text-[#D4AF37] font-bold">
          Rp {(value.total || 0).toLocaleString('id-ID')}
        </span>
      </div>
    </div>
  );
};

export const ShiftPage = () => {
  const [currentShift, setCurrentShift] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showPettyCashDialog, setShowPettyCashDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [shiftDetails, setShiftDetails] = useState(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [shiftSummary, setShiftSummary] = useState(null);

  const [denominations, setDenominations] = useState({ total: 0 });
  const [pettyCashForm, setPettyCashForm] = useState({ amount: '', category: 'Operational', description: '' });
  const [closeNotes, setCloseNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    fetchCurrentShift();
    fetchShifts();
  }, []);

  const fetchCurrentShift = async () => {
    try {
      const response = await api.get(`/shifts/current/${user.id}`);
      setCurrentShift(response.data);
    } catch (error) {
      console.error('Error fetching current shift:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await api.get('/shifts');
      setShifts(response.data);
    } catch (error) {
      toast.error('Gagal memuat riwayat shift');
    }
  };

  const handleViewDetails = async (shiftId) => {
    try {
      const response = await api.get(`/shifts/${shiftId}/details`);
      setShiftDetails(response.data);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('Gagal mengambil detail shift');
      console.error(error);
    }
  };

  const handleOpenShift = async () => {
    try {
      const response = await api.post('/shifts/open', {
        kasir_id: user.id,
        opening_balance: denominations.total,
        denominations: denominations,
      });
      setCurrentShift(response.data);
      setShowOpenDialog(false);
      setDenominations({ total: 0 });
      toast.success('Shift berhasil dibuka');
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membuka shift');
    }
  };

  const handlePrepareClose = async () => {
    try {
      // Fetch shift summary before close
      const response = await api.get(`/shifts/${currentShift.id}/summary`);
      setShiftSummary(response.data);
      setShowSummaryDialog(true);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      // Even if summary fails, allow close
      setShowSummaryDialog(true);
      setShiftSummary({ transactions: [], total_revenue: 0 });
    }
  };

  const proceedToClose = () => {
    setShowSummaryDialog(false);
    setDenominations({ total: 0 });
    setShowCloseDialog(true);
  };

  const handleCloseShift = async () => {
    try {
      const response = await api.post('/shifts/close', {
        shift_id: currentShift.id,
        closing_balance: denominations.total,
        denominations: denominations,
        notes: closeNotes,
      });

      const variance = response.data.variance;
      if (variance !== 0) {
        toast.warning(`Shift ditutup. Selisih: Rp ${Math.abs(variance).toLocaleString('id-ID')} (${variance > 0 ? 'Lebih' : 'Kurang'})`);
      } else {
        toast.success('Shift ditutup. Saldo pas!');
      }

      setCurrentShift(null);
      setShowCloseDialog(false);
      setDenominations({ total: 0 });
      setCloseNotes('');
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menutup shift');
    }
  };

  const handlePettyCash = async () => {
    try {
      await api.post('/shifts/petty-cash', {
        shift_id: currentShift.id,
        amount: parseFloat(pettyCashForm.amount),
        category: pettyCashForm.category,
        description: pettyCashForm.description
      });
      toast.success('Pengeluaran kas berhasil dicatat');
      setShowPettyCashDialog(false);
      setPettyCashForm({ amount: '', category: 'Operational', description: '' });
      fetchCurrentShift(); // Update stats
    } catch (error) {
      toast.error('Gagal mencatat pengeluaran');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in" data-testid="shift-page">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[#D4AF37] text-sm font-medium tracking-widest uppercase mb-1">Operasional</p>
          <h1 className="text-3xl font-bold text-white">Shift Management</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <DoorOpen className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-zinc-500 text-sm">Status Shift</p>
            <p className="text-2xl font-bold text-white">{currentShift ? 'Aktif' : 'Tutup'}</p>
            {currentShift && (
              <p className="text-xs text-zinc-500 mt-1">{currentShift.kasir_name}</p>
            )}
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <Banknote className="w-5 h-5 text-[#D4AF37] mb-2" />
            <p className="text-zinc-500 text-sm">Modal Awal</p>
            <p className="text-xl font-bold text-white font-mono">
              Rp {(currentShift?.opening_balance || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <ArrowDownCircle className="w-5 h-5 text-red-400 mb-2" />
            <p className="text-zinc-500 text-sm">Kas Keluar</p>
            <p className="text-xl font-bold text-red-400 font-mono">
              Rp {(currentShift?.petty_cash_total || 0).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
            <ArrowUpCircle className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-zinc-500 text-sm">Cash Drop</p>
            <p className="text-xl font-bold text-blue-400 font-mono">
              Rp {(currentShift?.cash_drop_total || 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Current Shift Status */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6 mb-6">
          {currentShift ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Shift Aktif</h2>
                  <p className="text-zinc-400 text-sm">
                    Dibuka: {new Date(currentShift.opened_at).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowPettyCashDialog(true)}
                    className="bg-zinc-800 text-white hover:bg-zinc-700"
                  >
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    Kas Keluar / Drop
                  </Button>
                  <Button
                    onClick={handlePrepareClose}
                    data-testid="close-shift-button"
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    <DoorClosed className="w-4 h-4 mr-2" />
                    Tutup Shift
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <DoorClosed className="w-8 h-8 text-zinc-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Tidak Ada Shift Aktif</h2>
              <p className="text-zinc-500 mb-6">Silakan buka shift untuk memulai transaksi</p>
              <Button
                onClick={() => { setDenominations({ total: 0 }); setShowOpenDialog(true); }}
                data-testid="open-shift-button"
                className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
              >
                <DoorOpen className="w-4 h-4 mr-2" />
                Buka Shift
              </Button>
            </div>
          )}
        </div>

        {/* Shift History */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">Riwayat Shift</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900/50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Waktu</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Kasir</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Modal Awal</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Saldo Tutup</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Variance</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white text-sm font-mono">
                        {new Date(shift.opened_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {shift.closed_at && (
                        <p className="text-zinc-500 text-xs font-mono">
                          - {new Date(shift.closed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white text-sm">{shift.kasir_name}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-white">Rp {(shift.opening_balance || 0).toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-white">
                        {shift.closing_balance ? `Rp ${shift.closing_balance.toLocaleString('id-ID')}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-mono font-semibold ${!shift.variance ? 'text-zinc-500' :
                        shift.variance === 0 ? 'text-green-500' :
                          shift.variance > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                        {shift.variance !== undefined && shift.variance !== null ?
                          `${shift.variance > 0 ? '+' : ''}Rp ${shift.variance.toLocaleString('id-ID')}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${shift.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'
                          }`}>
                          {shift.status === 'open' ? 'Aktif' : 'Closed'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(shift.id)}
                          className="h-6 w-6 p-0 text-zinc-400 hover:text-[#D4AF37]"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shifts.length === 0 && (
              <div className="text-center py-12">
                <DoorClosed className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Belum ada riwayat shift</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shift Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">📊 Ringkasan Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {shiftSummary ? (
              <>
                {/* Transaction Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                    <p className="text-zinc-400 text-sm mb-1">Total Transaksi</p>
                    <p className="font-mono text-3xl font-bold text-[#D4AF37]">
                      {shiftSummary.transaction_count || 0}
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                    <p className="text-zinc-400 text-sm mb-1">Total Revenue</p>
                    <p className="font-mono text-2xl font-bold text-white">
                      Rp {(shiftSummary.total_revenue || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                  <h3 className="font-semibold text-white mb-3">Breakdown Pembayaran</h3>
                  <div className="space-y-2">
                    {shiftSummary.payment_breakdown && Object.entries(shiftSummary.payment_breakdown).map(([method, amount]) => (
                      <div key={method} className="flex justify-between items-center">
                        <span className="text-zinc-300 capitalize">{method === 'cash' ? 'Tunai' : method === 'card' ? 'Kartu' : method === 'qr' ? 'QRIS' : method}</span>
                        <span className="font-mono text-white">Rp {amount.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expected vs Physical */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-300">Saldo Sistem (Expected)</span>
                    <span className="font-mono font-bold text-white">
                      Rp {((shiftSummary.expected_balance || 0)).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Modal Awal: Rp {(currentShift?.opening_balance || 0).toLocaleString('id-ID')} +
                    Revenue Tunai: Rp {(shiftSummary.payment_breakdown?.cash || 0).toLocaleString('id-ID')} -
                    Kas Keluar: Rp {(currentShift?.petty_cash_total || 0).toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                  <Button
                    onClick={() => setShowSummaryDialog(false)}
                    className="flex-1 bg-zinc-800 text-white hover:bg-zinc-700"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={proceedToClose}
                    className="flex-1 bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
                  >
                    Lanjut Tutup Shift
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-zinc-400">Loading summary...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Open Shift Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Buka Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 mb-2">Kasir</Label>
              <Input value={user.full_name} disabled className="bg-zinc-900/50 border-zinc-800 text-white" />
            </div>

            <CashDenominationInput
              value={denominations}
              onChange={setDenominations}
              label="Hitung Modal Awal"
            />

            <Button
              onClick={handleOpenShift}
              disabled={denominations.total <= 0}
              data-testid="confirm-open-shift"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase mt-4"
            >
              Buka Shift (Rp {(denominations.total || 0).toLocaleString('id-ID')})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Tutup Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded mb-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                <p className="text-sm text-yellow-200">
                  Lakukan "Blind Count". Hitung semua uang fisik di laci kasir (termasuk modal awal) tanpa terpengaruh saldo sistem.
                </p>
              </div>
            </div>

            <CashDenominationInput
              value={denominations}
              onChange={setDenominations}
              label="Hitung Fisik Akhir"
            />

            <div>
              <Label className="text-zinc-400 mb-2">Catatan</Label>
              <Textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="Catatan penutupan..."
                rows={2}
              />
            </div>

            <Button
              onClick={handleCloseShift}
              disabled={denominations.total <= 0}
              data-testid="confirm-close-shift"
              className="w-full bg-red-500 text-white hover:bg-red-600 font-bold uppercase mt-4"
            >
              Tutup Shift (Rp {(denominations.total || 0).toLocaleString('id-ID')})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Petty Cash Dialog */}
      <Dialog open={showPettyCashDialog} onOpenChange={setShowPettyCashDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Catat Kas Keluar / Drop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 mb-2">Kategori</Label>
              <Select
                value={pettyCashForm.category}
                onValueChange={(val) => setPettyCashForm({ ...pettyCashForm, category: val })}
              >
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operational">Operasional (Beli Barang/Jasa)</SelectItem>
                  <SelectItem value="Cash Drop">Cash Drop (Setor ke Owner)</SelectItem>
                  <SelectItem value="Refund">Refund Customer</SelectItem>
                  <SelectItem value="Other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-zinc-400 mb-2">Nominal</Label>
              <Input
                type="number"
                value={pettyCashForm.amount}
                onChange={(e) => setPettyCashForm({ ...pettyCashForm, amount: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white font-mono text-lg"
                placeholder="0"
              />
            </div>

            <div>
              <Label className="text-zinc-400 mb-2">Keterangan</Label>
              <Input
                value={pettyCashForm.description}
                onChange={(e) => setPettyCashForm({ ...pettyCashForm, description: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="Contoh: Beli Es Batu / Setor ke Pak Budi"
              />
            </div>

            <Button
              onClick={handlePettyCash}
              disabled={!pettyCashForm.amount || !pettyCashForm.description}
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
            >
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shift Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#D4AF37]" />
              Detail Transaksi Shift
            </DialogTitle>
          </DialogHeader>

          {shiftDetails ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Total Revenue</p>
                  <p className="text-xl font-bold text-[#D4AF37] font-mono">
                    Rp {(shiftDetails.summary.total_revenue || 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Jumlah Transaksi</p>
                  <p className="text-xl font-bold text-white font-mono">
                    {shiftDetails.summary.transaction_count || 0}
                  </p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Cash Accepted</p>
                  <p className="text-xl font-bold text-green-400 font-mono">
                    Rp {(shiftDetails.summary.payment_methods.cash || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Transaction Table */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Daftar Transaksi</h3>
                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-900">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-zinc-400">Waktu / Invoice</th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-400">Metode</th>
                        <th className="px-4 py-3 text-right font-medium text-zinc-400">Subtotal</th>
                        <th className="px-4 py-3 text-right font-medium text-zinc-400">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {shiftDetails.transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-zinc-800/30">
                          <td className="px-4 py-3">
                            <div className="font-mono text-white">{t.invoice_number}</div>
                            <div className="text-xs text-zinc-500">
                              {new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {t.payment_method === 'cash' && <Wallet className="w-3 h-3 text-green-400" />}
                              {t.payment_method === 'card' && <CreditCard className="w-3 h-3 text-blue-400" />}
                              {t.payment_method === 'qr' && <QrCode className="w-3 h-3 text-yellow-400" />}
                              <span className="capitalize text-zinc-300">{t.payment_method}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-400">
                            Rp {(t.subtotal || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-white font-bold">
                            Rp {(t.total || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                      {shiftDetails.transactions.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-zinc-500">
                            Tidak ada transaksi pada shift ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </Layout>
  );
};