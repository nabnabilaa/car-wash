import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Sparkles, CheckCircle, Clock, Award, Shield, Droplets,
  ArrowRight, Phone, Search, Star, Calendar, MapPin,
  Car, ChevronRight, Menu, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const LandingPage = () => {
  const [services, setServices] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCheckMembership, setShowCheckMembership] = useState(false);
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  const [config, setConfig] = useState({
    hero_title_1: "Experience the",
    hero_title_2: "Ultimate Shine",
    hero_subtitle: "Premium car wash & auto detailing service di Semarang. Teknologi Nano Ceramic Coating terbaru untuk perlindungan maksimal kendaraan Anda.",
    open_hours: "08:00 - 18:00",
    contact_phone: "0822-2702-5335",
    contact_address: "Jl. Sukun Raya No.47C, Banyumanik, Semarang",
    contact_maps_url: "https://maps.google.com/?q=OTOPIA+Semarang+Jl.+Sukun+Raya+No.47C",
    contact_instagram: "@otopia.semarang"
  });

  useEffect(() => {
    fetchServices();
    fetchConfig();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Check Open Status
    const checkOpenStatus = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Sunday, 1 = Monday
      const hour = now.getHours();

      // Closed on Monday (1)
      if (day === 1) {
        setIsOpen(false);
        return;
      }

      // Parse open hours simple check (assuming 08:00 - 18:00 format always for now dev simplification)
      // Ideally parse config.open_hours
      if (hour >= 8 && hour < 18) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000); // Check every minute

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API}/public/landing-config`);
      // Merge with defaults in case of new fields
      setConfig(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Error fetching landing config:', error);
    }
  };


  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/public/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleCheckMembership = async () => {
    if (!phoneNumber) {
      toast.error('Masukkan nomor telepon');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/public/check-membership?phone=${phoneNumber}`);
      setMembershipData(response.data);
      toast.success('Data membership ditemukan!');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Nomor telepon tidak terdaftar');
      } else {
        toast.error('Gagal mengecek membership');
      }
      setMembershipData(null);
    } finally {
      setLoading(false);
    }
  };

  const membershipTypes = [
    { name: 'Bulanan', duration: '30 hari', price: 'Rp 500.000', saves: 'Hemat 40%', recommended: false },
    { name: '3 Bulanan', duration: '90 hari', price: 'Rp 1.300.000', saves: 'Hemat 50%', recommended: true },
    { name: '6 Bulanan', duration: '180 hari', price: 'Rp 2.400.000', saves: 'Hemat 55%', recommended: false },
    { name: 'Tahunan', duration: '365 hari', price: 'Rp 4.500.000', saves: 'Hemat 60%', recommended: false }
  ];

  const testimonials = [
    { name: "Budi Santoso", role: "Car Enthusiast", text: "Pelayanan sangat detail, coatingnya awet banget. Staff ramah dan profesional.", rating: 5 },
    { name: "Siti Rahma", role: "Business Owner", text: "Membership sangat worth it! Mobil selalu bersih tiap hari tanpa mikir biaya lagi.", rating: 5 },
    { name: "Andi Wijaya", role: "Driver Online", text: "Cepat dan bersih. Ruang tunggunya nyaman, ada wi-fi kencang.", rating: 4 },
  ];

  const processes = [
    { icon: Calendar, title: "Booking / Datang", desc: "Reservasi via WA atau datang langsung ke outlet kami." },
    { icon: Car, title: "Proses Detailing", desc: "Pengerjaan detail oleh teknisi profesional bersertifikat." },
    { icon: CheckCircle, title: "Quality Control", desc: "Pengecekan akhir untuk memastikan hasil sempurna." },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-white font-sans selection:bg-[#D4AF37] selection:text-black">

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#09090B]/90 backdrop-blur-md border-b border-zinc-800 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#8a7020] rounded-lg flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">OTOPIA</h1>
              <p className="text-[10px] text-[#D4AF37] tracking-widest uppercase">Premium Auto Care</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {['Layanan', 'Membership', 'Testimoni', 'Lokasi'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-zinc-300 hover:text-[#D4AF37] transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button
              onClick={() => setShowCheckMembership(true)}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              Cek Status
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="bg-[#D4AF37] text-black hover:bg-[#b5952f] font-semibold"
            >
              Staff Login
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-zinc-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#121214] border-b border-zinc-800 p-6 flex flex-col gap-4 animate-in slide-in-from-top-5">
            {['Layanan', 'Membership', 'Testimoni', 'Lokasi'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-lg font-medium text-white" onClick={() => setMobileMenuOpen(false)}>
                {item}
              </a>
            ))}
            <Button onClick={() => { setShowCheckMembership(true); setMobileMenuOpen(false); }} className="w-full justify-start" variant="outline">
              Cek Status Membership
            </Button>
            <Button onClick={() => navigate('/login')} className="w-full bg-[#D4AF37] text-black">
              Staff Login
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#09090B]/80 via-[#09090B]/90 to-[#09090B] z-10" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/10 blur-[120px] rounded-full opacity-50" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full opacity-30" />
          {/* Placeholder for car image background if available */}
          {/* <img src="/hero-bg.jpg" className="w-full h-full object-cover opacity-30" alt="Hero" /> */}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center mt-20">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700`}>
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-medium text-zinc-300">
              {isOpen ? `Open Today: ${config.open_hours}` : `Closed Now (Open ${config.open_hours})`}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {config.hero_title_1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] bg-[200%_auto] animate-shine">
              {config.hero_title_2}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            {config.hero_subtitle}
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <Button
              onClick={() => document.getElementById('membership').scrollIntoView({ behavior: 'smooth' })}
              className="h-14 px-8 bg-[#D4AF37] text-black hover:bg-[#b5952f] text-lg font-bold rounded-full shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all"
            >
              Lihat Membership
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              onClick={() => document.getElementById('layanan').scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              className="h-14 px-8 border-zinc-700 text-white hover:bg-zinc-800 rounded-full text-lg"
            >
              Daftar Layanan
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 border-t border-zinc-800/50 pt-8 animate-in fade-in duration-1000 delay-500">
            {[
              { label: "Tahun Pengalaman", value: "5+" },
              { label: "Mobil Tertangani", value: "10k+" },
              { label: "Member Aktif", value: "500+" },
              { label: "Rating Google", value: "4.9" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#09090B] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-zinc-400">Proses mudah untuk mendapatkan layanan terbaik</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-zinc-800 via-[#D4AF37]/50 to-zinc-800 z-0" />

            {processes.map((proc, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-[#121214] border border-zinc-800 rounded-full flex items-center justify-center mb-6 group-hover:border-[#D4AF37] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-500">
                  <proc.icon className="w-10 h-10 text-zinc-400 group-hover:text-[#D4AF37] transition-colors duration-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{proc.title}</h3>
                <p className="text-zinc-400 text-sm max-w-xs">{proc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="layanan" className="py-24 bg-[#121214]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <p className="text-[#D4AF37] font-medium mb-2 tracking-wider uppercase text-sm">Layanan Kami</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Premium Services</h2>
            </div>
            <p className="text-zinc-400 max-w-md text-sm md:text-right">
              Dari cuci mobil standar hingga detailing kompleks, kami memberikan sentuhan perfeksionis untuk kendaraan Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.slice(0, 6).map((service, i) => (
              <div key={service.id} className="group bg-[#09090B] border border-zinc-800 hover:border-[#D4AF37]/50 p-1 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="bg-[#18181b]/50 p-6 rounded-xl h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors duration-300">
                      <Sparkles className="w-6 h-6 text-[#D4AF37] group-hover:text-black" />
                    </div>
                    <span className="px-3 py-1 bg-zinc-900 rounded-full text-xs font-medium text-zinc-400 border border-zinc-800">
                      {service.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors">{service.name}</h3>
                  <p className="text-zinc-400 text-sm mb-6 flex-grow">{service.description || 'Layanan perawatan terbaik untuk hasil maksimal.'}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Mulai dari</p>
                      <p className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">Rp {service.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center text-xs text-zinc-500 bg-zinc-900 px-3 py-2 rounded-lg">
                      <Clock className="w-3 h-3 mr-2" />
                      {service.duration_minutes} mnt
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" className="border-zinc-700 text-white hover:bg-[#D4AF37] hover:text-black px-8">
              Lihat Semua Layanan
            </Button>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section id="membership" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-[#D4AF37] font-bold tracking-wider text-sm uppercase">Membership Plan</span>
            <h2 className="text-4xl font-bold text-white mt-2 mb-6">Unlimited Wash</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Hemat biaya perawatan mobil Anda dengan paket membership eksklusif. Cuci sepuasnya, prioritas antrian, dan diskon produk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {membershipTypes.map((type, index) => (
              <div
                key={index}
                className={`relative bg-[#121214] border ${type.recommended ? 'border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'border-zinc-800'} rounded-2xl p-6 transition-all hover:transform hover:scale-105 duration-300`}
              >
                {type.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">{type.name}</h3>
                  <p className="text-zinc-500 text-sm mt-1">{type.duration}</p>
                </div>

                <div className="mb-6 pb-6 border-b border-zinc-800/50">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">{type.price}</span>
                  </div>
                  <p className="text-xs text-green-500 font-medium mt-2 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {type.saves}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {['Unlimited Wash', 'Prioritas Antrian', 'Diskon Produk 10%', 'Wi-Fi Lounge Access'].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                      <CheckCircle className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${type.recommended ? 'bg-[#D4AF37] text-black hover:bg-[#b5952f]' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                >
                  Pilih Paket
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-24 bg-[#121214]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Kata Mereka</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testi, i) => (
              <div key={i} className="bg-[#09090B] p-8 rounded-2xl border border-zinc-800 relative">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, starI) => (
                    <Star key={starI} className={`w-4 h-4 ${starI < testi.rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-zinc-700'}`} />
                  ))}
                </div>
                <p className="text-zinc-300 italic mb-6">"{testi.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-[#D4AF37]">
                    {testi.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{testi.name}</p>
                    <p className="text-zinc-500 text-xs">{testi.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="lokasi" className="bg-[#09090B] border-t border-zinc-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#D4AF37] rounded flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                </div>
                <span className="text-xl font-bold text-white">OTOPIA</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Pusat perawatan kendaraan premium di Semarang. Kami mengutamakan kualitas, detail, dan kepuasan pelanggan.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Layanan</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                {services.slice(0, 4).map((service) => (
                  <li key={service.id}>
                    <a href="#layanan" className="hover:text-[#D4AF37]">{service.name}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Kontak</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  <a href={`https://wa.me/${config.contact_phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37]">
                    {config.contact_phone}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#D4AF37] mt-1" />
                  <a href={config.contact_maps_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37]">
                    {config.contact_address}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Operasional</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex justify-between">
                  <span>Selasa - Minggu</span>
                  <span className="text-white">{config.open_hours}</span>
                </li>
                <li className="flex justify-between">
                  <span>Senin</span>
                  <span className="text-red-400">Tutup</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-zinc-500">© 2025 OTOPIA by PPM Autoworks. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-zinc-500 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-xs text-zinc-500 hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Check Membership Modal */}
      {showCheckMembership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCheckMembership(false)} />
          <div className="relative bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCheckMembership(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-white">Cek Membership</h3>
              <p className="text-sm text-zinc-400 mt-1">Masukkan nomor telepon Anda</p>
            </div>

            <div className="space-y-4">
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="bg-black/50 border-zinc-800 text-white h-12 text-center text-lg"
              />
              <Button
                onClick={handleCheckMembership}
                disabled={loading}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f] h-12 font-bold"
              >
                {loading ? 'Mencari...' : 'Cek Status Sekarang'}
              </Button>
            </div>

            {membershipData && (
              <div className="mt-6 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 animate-in slide-in-from-bottom-2">
                <p className="text-center text-white font-medium mb-3">Halo, {membershipData.customer.name} 👋</p>

                {membershipData.memberships.length > 0 ? (
                  <div className="space-y-3">
                    {membershipData.memberships.map((m) => (
                      <div key={m.id} className="bg-black/40 p-3 rounded-lg border border-zinc-800/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[#D4AF37] font-bold text-sm">{m.membership_type.toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                            }`}>
                            {m.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-400">
                          <span>Sisa Hari: <span className="text-white">{m.days_remaining}</span></span>
                          <span>Usage: <span className="text-white">{m.usage_count}x</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-zinc-500 text-sm py-2">
                    Tidak ada membership aktif.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};