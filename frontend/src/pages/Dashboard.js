import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Clock,
  ShoppingCart,
  ArrowRight,
  Zap,
  Calendar,
  Sun,
  Moon,
  Sunset,
  ChevronRight,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftActive, setShiftActive] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchShiftStatus();
    fetchRecentTransactions();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftStatus = async () => {
    try {
      const response = await api.get('/shifts/current');
      setShiftActive(response.data?.status === 'active');
    } catch (error) {
      setShiftActive(false);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await api.get('/transactions?limit=5');
      setRecentTransactions(response.data?.slice(0, 5) || []);
    } catch (error) {
      setRecentTransactions([]);
    }
  };

  const formatCurrency = (value) => {
    return `Rp ${(value || 0).toLocaleString('id-ID')}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: 'Selamat Pagi', icon: Sun, color: 'text-amber-400' };
    if (hour < 15) return { text: 'Selamat Siang', icon: Sun, color: 'text-yellow-400' };
    if (hour < 18) return { text: 'Selamat Sore', icon: Sunset, color: 'text-orange-400' };
    return { text: 'Selamat Malam', icon: Moon, color: 'text-blue-400' };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Quick Actions
  const quickActions = [
    { label: 'Transaksi Baru', icon: ShoppingCart, path: '/pos', color: 'bg-[#D4AF37]', textColor: 'text-black' },
    { label: 'Cek Member', icon: CreditCard, path: '/customers', color: 'bg-blue-600', textColor: 'text-white' },
    { label: 'Lihat Stok', icon: AlertTriangle, path: '/inventory', color: 'bg-zinc-700', textColor: 'text-white' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in" data-testid="dashboard-page">
        {/* Header with Clock */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GreetingIcon className={`w-5 h-5 ${greeting.color}`} />
              <span className={`text-sm font-medium ${greeting.color}`}>{greeting.text}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Dashboard OTOPIA</h1>
            <p className="text-zinc-500">{formatDate(currentTime)}</p>
          </div>

          {/* Live Clock Card */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl px-6 py-4 flex items-center gap-4">
            <Clock className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <p className="text-3xl font-mono font-bold text-white tracking-wider">
                {formatTime(currentTime)}
              </p>
              <p className="text-zinc-500 text-xs">Waktu Server (WIB)</p>
            </div>
            {/* Shift Status Indicator */}
            <div className={`ml-4 px-3 py-1 rounded-full flex items-center gap-2 ${shiftActive ? 'bg-emerald-500/20' : 'bg-zinc-700/50'}`}>
              {shiftActive ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-zinc-400" />}
              <span className={`text-xs font-medium ${shiftActive ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {shiftActive ? 'Shift Aktif' : 'Shift Belum Dimulai'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`${action.color} ${action.textColor} rounded-xl p-4 flex items-center justify-between group hover:opacity-90 transition-all`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{action.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            );
          })}
        </div>

        {/* Main Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Revenue Card - Featured */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#D4AF37] to-[#B8972E] rounded-xl p-6" data-testid="today-revenue">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-black/60 text-sm font-medium mb-2">Revenue Hari Ini</p>
                <p className="text-4xl lg:text-5xl font-bold text-black tracking-tight mb-3">
                  {formatCurrency(stats?.today_revenue)}
                </p>
                <div className="flex items-center gap-4 text-black/70 text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {stats?.today_transactions || 0} transaksi
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Avg: {formatCurrency(stats?.today_transactions ? Math.round(stats?.today_revenue / stats?.today_transactions) : 0)}
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-black/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-black" />
              </div>
            </div>
          </div>

          {/* Transactions Count */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6" data-testid="today-transactions">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-full">Hari Ini</span>
            </div>
            <p className="text-zinc-500 text-sm mb-1">Total Transaksi</p>
            <p className="text-3xl font-bold text-white">{stats?.today_transactions || 0}</p>
          </div>
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5" data-testid="active-memberships">
            <CreditCard className="w-5 h-5 text-blue-400 mb-3" />
            <p className="text-zinc-500 text-sm mb-1">Member Aktif</p>
            <p className="text-2xl font-bold text-white">{stats?.active_memberships || 0}</p>
          </div>

          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5" data-testid="expiring-memberships">
            <Calendar className="w-5 h-5 text-orange-400 mb-3" />
            <p className="text-zinc-500 text-sm mb-1">Akan Expired</p>
            <p className="text-2xl font-bold text-white">{stats?.expiring_memberships || 0}</p>
          </div>

          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5" data-testid="low-stock-items">
            <AlertTriangle className="w-5 h-5 text-red-400 mb-3" />
            <p className="text-zinc-500 text-sm mb-1">Stok Menipis</p>
            <p className="text-2xl font-bold text-white">{stats?.low_stock_items || 0}</p>
          </div>

          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
            <Users className="w-5 h-5 text-purple-400 mb-3" />
            <p className="text-zinc-500 text-sm mb-1">Kasir Aktif</p>
            <p className="text-2xl font-bold text-white">
              {stats?.kasir_performance ? Object.keys(stats.kasir_performance).length : 0}
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div>
                <h2 className="font-semibold text-white">Transaksi Terakhir</h2>
                <p className="text-zinc-500 text-sm">5 transaksi terbaru</p>
              </div>
              <button
                onClick={() => navigate('/transactions')}
                className="text-[#D4AF37] text-sm font-medium flex items-center gap-1 hover:underline"
              >
                Lihat Semua <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {recentTransactions.length > 0 ? (
              <div className="divide-y divide-zinc-800">
                {recentTransactions.map((tx, index) => (
                  <div key={tx.id || index} className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs text-zinc-400">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{tx.customer_name || 'Guest'}</p>
                        <p className="text-zinc-500 text-xs">{tx.items_count || 1} layanan</p>
                      </div>
                    </div>
                    <p className="text-[#D4AF37] font-medium">{formatCurrency(tx.total)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <ShoppingCart className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Belum ada transaksi hari ini</p>
                <button
                  onClick={() => navigate('/pos')}
                  className="mt-3 text-[#D4AF37] text-sm font-medium hover:underline"
                >
                  Buat Transaksi Baru
                </button>
              </div>
            )}
          </div>

          {/* Kasir Performance */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div>
                <h2 className="font-semibold text-white">Performa Kasir</h2>
                <p className="text-zinc-500 text-sm">Statistik hari ini</p>
              </div>
              <button
                onClick={fetchStats}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {stats?.kasir_performance && Object.keys(stats.kasir_performance).length > 0 ? (
              <div className="divide-y divide-zinc-800">
                {Object.entries(stats.kasir_performance).map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#D4AF37]/20 rounded-full flex items-center justify-center text-[#D4AF37] font-semibold text-sm">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{name}</p>
                        <p className="text-zinc-500 text-xs">{data.count} transaksi</p>
                      </div>
                    </div>
                    <p className="text-[#D4AF37] font-medium">{formatCurrency(data.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Belum ada aktivitas kasir</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-sm">
            OTOPIA by PPM Autoworks • Dashboard diperbarui otomatis
          </p>
        </div>
      </div>
    </Layout>
  );
};