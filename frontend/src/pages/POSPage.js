import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import {
  Trash2, CreditCard, Wallet, QrCode, User, Search, ShoppingBag, Wrench, Crown, X,
  Plus, Minus, Receipt, Printer, Clock, Filter, CheckCircle, MessageSquare, Tag
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

export const POSPage = () => {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReceived, setPaymentReceived] = useState('');
  const [currentShift, setCurrentShift] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMemberCheck, setShowMemberCheck] = useState(false);
  const [notes, setNotes] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [membershipInfo, setMembershipInfo] = useState(null);
  const [isMemberTransaction, setIsMemberTransaction] = useState(false);
  const [selectedServiceForMember, setSelectedServiceForMember] = useState(null);
  const [activeTab, setActiveTab] = useState('services');
  const [technicians, setTechnicians] = useState([]);

  // NEW: Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percent'); // 'percent' or 'fixed'
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const user = getCurrentUser();

  useEffect(() => {
    fetchServices();
    fetchProducts();
    fetchCustomers();
    checkCurrentShift();
    fetchTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/users/staff');
      setTechnicians(response.data);
    } catch (error) {
      console.log('Failed to fetch technicians');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Gagal memuat layanan');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
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

  const checkCurrentShift = async () => {
    try {
      if (user && user.id) {
        const response = await api.get('/shifts/current');
        if (response.data) {
          setCurrentShift(response.data);
        }
      }
    } catch (error) {
      console.error('Error checking shift:', error);
    }
  };

  // Get unique categories
  const serviceCategories = useMemo(() => {
    const categories = [...new Set(services.map(s => s.category))];
    return ['all', ...categories];
  }, [services]);

  const productCategories = useMemo(() => {
    const categories = [...new Set(products.map(p => p.category))];
    return ['all', ...categories];
  }, [products]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Filtered customers for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const addToCart = (item, type = 'service') => {
    const itemId = `${type}-${item.id}`;
    const existingItem = cart.find(i => i.itemId === itemId);
    if (existingItem) {
      setCart(cart.map(i =>
        i.itemId === itemId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setCart([...cart, {
        ...item,
        itemId,
        type,
        quantity: 1,
        originalPrice: item.price,
        technician_id: '' // Add field for technician
      }]);
    }
    toast.success(`${item.name} ditambahkan`);
  };

  const updateTechnician = (itemId, techId) => {
    setCart(cart.map(item =>
      item.itemId === itemId ? { ...item, technician_id: techId } : item
    ));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.itemId !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(item =>
      item.itemId === itemId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    if (appliedPromo) {
      return appliedPromo.discountAmount;
    }
    const subtotal = calculateSubtotal();
    if (discountType === 'percent') {
      return Math.round(subtotal * (discount / 100));
    }
    return discount;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  // Quick amount buttons
  const quickAmounts = [50000, 100000, 150000, 200000, 500000];

  // Check membership by phone
  const handleCheckMembership = async () => {
    if (!memberPhone) {
      toast.error('Masukkan nomor telepon');
      return;
    }

    try {
      const response = await api.post(`/public/check-membership?phone=${memberPhone}`);
      const data = response.data;

      if (data.memberships && data.memberships.length > 0) {
        const activeMembership = data.memberships.find(m =>
          m.status === 'active' && m.membership_type !== 'regular'
        );

        if (activeMembership) {
          setMembershipInfo({
            customer: data.customer,
            membership: activeMembership
          });
          setSelectedCustomer(data.customer);
          toast.success(`Member ditemukan: ${data.customer.name}`);
        } else {
          toast.error('Tidak ada membership aktif');
          setMembershipInfo(null);
        }
      } else {
        toast.error('Customer tidak memiliki membership');
        setMembershipInfo(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Nomor tidak terdaftar');
      setMembershipInfo(null);
    }
  };

  // Use membership for free wash
  const handleUseMembership = async () => {
    if (!membershipInfo || !selectedServiceForMember) {
      toast.error('Pilih layanan');
      return;
    }

    try {
      const response = await api.post('/memberships/use', {
        phone: memberPhone,
        service_id: selectedServiceForMember.id
      });

      toast.success(response.data.message);

      const itemId = `service-member-${selectedServiceForMember.id}`;
      setCart([...cart, {
        ...selectedServiceForMember,
        itemId,
        type: 'member_usage',
        quantity: 1,
        price: 0,
        originalPrice: selectedServiceForMember.price,
        notes: `Member (${membershipInfo.membership.membership_type}) - ${membershipInfo.customer.name}`
      }]);

      setIsMemberTransaction(true);
      setShowMemberCheck(false);
      setMemberPhone('');
      setMembershipInfo(null);
      setSelectedServiceForMember(null);

    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menggunakan membership');
    }
  };

  const handleCheckout = async () => {
    if (!currentShift) {
      toast.error('Silakan buka shift terlebih dahulu');
      return;
    }

    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    const total = calculateTotal();
    const received = parseFloat(paymentReceived) || 0;

    if (total > 0 && received < total) {
      toast.error('Pembayaran kurang');
      return;
    }

    try {
      const transactionData = {
        customer_id: selectedCustomer?.id || null,
        items: cart.map(item => ({
          service_id: item.type === 'service' || item.type === 'member_usage' ? item.id : null,
          product_id: item.type === 'product' ? item.id : null,
          service_name: item.name,
          price: item.price,
          quantity: item.quantity,
          is_member_usage: item.type === 'member_usage',
          notes: item.notes || null,
          technician_id: item.technician_id || null // Pass to backend
        })),
        payment_method: total === 0 && isMemberTransaction ? 'subscription' : paymentMethod,
        payment_received: total === 0 ? 0 : received,
        notes: notes || null,
      };

      const response = await api.post('/transactions', transactionData);

      setLastTransaction({
        ...response.data,
        items: cart,
        payment_method: transactionData.payment_method,
        payment_received: transactionData.payment_received,
        change: transactionData.payment_received - total,
        customer_phone: selectedCustomer?.phone // Store phone for WhatsApp
      });
      setShowSuccessDialog(true);

      // Auto-send WhatsApp if customer has phone
      if (selectedCustomer && selectedCustomer.phone) {
        try {
          await api.post('/notifications/send-receipt', {
            transaction_id: response.data.id,
            phone: selectedCustomer.phone
          });
          console.log('✅ WhatsApp receipt sent automatically');
          toast.success('✅ Receipt sent via WhatsApp!', { duration: 2000 });
        } catch (error) {
          console.error('WhatsApp auto-send failed:', error);
          // Don't show error to user, just log it
        }
      }

      // Reset
      setCart([]);
      setSelectedCustomer(null);
      setPaymentReceived('');
      setNotes('');
      setDiscount(0);
      setShowCheckout(false);
      setIsMemberTransaction(false);
      setAppliedPromo(null);
      setPromoCode('');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Transaksi gagal');
    }
  };

  const handleSendWhatsApp = async () => {
    if (!lastTransaction) return;

    // Auto send if customer selected and has phone
    const phone = selectedCustomer?.phone || lastTransaction.customer_phone;

    if (!phone) {
      console.log('No customer phone available, skipping WhatsApp');
      return;
    }

    try {
      await api.post('/notifications/send-receipt', {
        transaction_id: lastTransaction.id,
        phone: phone
      });
      toast.success(`✅ Resi terkirim ke WhatsApp ${phone}`);
    } catch (error) {
      console.error('WhatsApp send failed:', error);
      toast.error("WhatsApp tidak terkirim (service mungkin belum siap)");
    }
  };

  const handlePrintReceipt = () => {
    if (!lastTransaction) return;

    const receiptContent = `
      <html>
        <head>
          <title>Receipt ${lastTransaction.invoice_number}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; width: 300px; margin: 0 auto; color: #000; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h2 { margin: 0 0 5px 0; font-size: 24px; }
            .header p { margin: 2px 0; font-size: 12px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
            .total { display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            @media print {
              @page { margin: 0; size: auto; }
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>OTOPIA</h2>
            <p>by PPM Autoworks</p>
            <p>Jl. Sudirman No. 123, Jakarta</p>
            <br/>
            <p>${new Date().toLocaleString('id-ID')}</p>
            <p>Inv: ${lastTransaction.invoice_number}</p>
            <p>Kasir: ${user?.full_name || 'Staff'}</p>
          </div>
          <div class="divider"></div>
          ${lastTransaction.items.map(item => `
            <div class="item">
              <span>${item.name} x${item.quantity}</span>
              <span>${((item.price || 0) * item.quantity).toLocaleString('id-ID')}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="total">
            <span>Total</span>
            <span>Rp ${lastTransaction.total.toLocaleString('id-ID')}</span>
          </div>
          <div class="item">
            <span>Bayar (${lastTransaction.payment_method})</span>
            <span>Rp ${lastTransaction.payment_received.toLocaleString('id-ID')}</span>
          </div>
          <div class="item">
             <span>Kembali</span>
             <span>Rp ${(lastTransaction.change || 0).toLocaleString('id-ID')}</span>
          </div>
          <div class="footer">
            <p>Terima Kasih</p>
            <p>Simpan struk ini sebagai bukti pembayaran yang sah.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    }
  };

  const clearMemberMode = () => {
    setIsMemberTransaction(false);
    setMembershipInfo(null);
    setCart(cart.filter(item => item.type !== 'member_usage'));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setIsMemberTransaction(false);
    setMembershipInfo(null);
    setAppliedPromo(null);
    setPromoCode('');
  };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    try {
      const subtotal = calculateSubtotal();
      const response = await api.post('/promotions/validate', {
        code: promoCode,
        subtotal: subtotal
      });

      setAppliedPromo({
        ...response.data.promo,
        discountAmount: response.data.discount_amount
      });
      toast.success('Promo berhasil digunakan!');
      setDiscount(0); // Reset manual discount
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Promo tidak valid');
      setAppliedPromo(null);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  if (!currentShift) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]" data-testid="pos-no-shift">
          <div className="text-center bg-[#18181b] border border-zinc-800 rounded-xl p-12">
            <Clock className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Shift Belum Dibuka</h2>
            <p className="text-zinc-500 mb-6">Buka shift terlebih dahulu untuk memulai transaksi</p>
            <Button onClick={() => window.location.href = '/shift'} className="bg-[#D4AF37] text-black hover:bg-[#B5952F]">
              Buka Shift Sekarang
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscount();
  const total = calculateTotal();
  const received = parseFloat(paymentReceived) || 0;
  const change = received - total;

  return (
    <Layout>
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-7rem)]" data-testid="pos-page">
        {/* Left: Services & Products */}
        <div className="col-span-7 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Point of Sale</h1>
              <p className="text-sm text-zinc-500">Kasir: {user?.full_name || user?.username}</p>
            </div>
            <Button
              onClick={() => setShowMemberCheck(true)}
              data-testid="check-member-button"
              className="bg-gradient-to-r from-[#D4AF37] to-[#B8972E] text-black hover:opacity-90"
            >
              <Crown className="w-4 h-4 mr-2" />
              Cek Member
            </Button>
          </div>

          {/* Member Mode Banner */}
          {isMemberTransaction && (
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-[#D4AF37] font-medium">Mode Member: {selectedCustomer?.name}</span>
              </div>
              <Button onClick={clearMemberMode} variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-7">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Search & Filter */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-[#D4AF37] transition-colors" />
              </div>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari layanan atau produk..."
                className="pl-10 bg-[#18181b]/50 border-zinc-800 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 text-white transition-all"
                data-testid="search-input"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-[#18181b]/50 border-zinc-800 text-white focus:ring-[#D4AF37]/20">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-zinc-400" />
                  <SelectValue placeholder="Kategori" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#18181b] border-zinc-800">
                {(activeTab === 'services' ? serviceCategories : productCategories).map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-zinc-300 focus:bg-[#D4AF37]/20 focus:text-[#D4AF37]">
                    {cat === 'all' ? 'Semua Kategori' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedCategory('all'); }} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-72 grid-cols-2 bg-[#18181b] p-1 mb-6 rounded-lg self-start">
              <TabsTrigger
                value="services"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-zinc-400 transition-all font-medium"
                data-testid="tab-services"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Layanan
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-zinc-400 transition-all font-medium"
                data-testid="tab-products"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Produk
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="flex-1 overflow-y-auto custom-scrollbar m-0 pr-2">
              <div className="grid grid-cols-2 gap-4 pb-20">
                {filteredServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => addToCart(service, 'service')}
                    data-testid={`service-${service.id}`}
                    className="relative bg-gradient-to-br from-[#18181b] to-zinc-900 border border-zinc-800/50 rounded-xl p-5 text-left hover:border-[#D4AF37]/50 hover:shadow-[0_0_15px_-3px_rgba(212,175,55,0.1)] transition-all group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-zinc-800/50 rounded-lg group-hover:bg-[#D4AF37]/10 transition-colors">
                          <Wrench className="w-5 h-5 text-zinc-400 group-hover:text-[#D4AF37] transition-colors" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">{service.category}</span>
                      </div>
                      <h3 className="font-bold text-white text-lg mb-1 group-hover:text-[#D4AF37] transition-colors line-clamp-1">{service.name}</h3>
                      <p className="text-xs text-zinc-500 mb-4 line-clamp-2 h-8">{service.description}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-mono font-bold text-[#D4AF37] text-lg">Rp {service.price.toLocaleString('id-ID')}</span>
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {filteredServices.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-500">Tidak ada layanan ditemukan</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" className="flex-1 overflow-y-auto custom-scrollbar m-0 pr-2">
              <div className="grid grid-cols-2 gap-4 pb-20">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product, 'product')}
                    data-testid={`product-${product.id}`}
                    className="relative bg-gradient-to-br from-[#18181b] to-zinc-900 border border-zinc-800/50 rounded-xl p-5 text-left hover:border-blue-500/50 hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)] transition-all group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-zinc-800/50 rounded-lg group-hover:bg-blue-500/10 transition-colors">
                          <ShoppingBag className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">{product.category}</span>
                      </div>
                      <h3 className="font-bold text-white text-lg mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-zinc-500 mb-4 line-clamp-2 h-8">{product.description || 'Stok tersedia'}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-mono font-bold text-blue-400 text-lg">Rp {product.price.toLocaleString('id-ID')}</span>
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-500">Tidak ada produk ditemukan</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Cart */}
        <div className="col-span-5 bg-[#18181b]/95 backdrop-blur-sm border border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-2xl">
          {/* Cart Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/50">
            <h2 className="font-semibold text-white flex items-center gap-2 text-lg">
              <Receipt className="w-5 h-5 text-[#D4AF37]" />
              Keranjang ({cart.length})
            </h2>
            {cart.length > 0 && (
              <Button onClick={clearCart} variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs font-medium">
                Hapus Semua
              </Button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="p-4 border-b border-zinc-800 shrink-0 bg-zinc-900/20">
            <Label className="text-zinc-500 text-xs mb-2 block uppercase tracking-wider font-semibold">Customer</Label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#D4AF37] transition-colors" />
              <Input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Cari customer..."
                className="pl-9 bg-[#121214] border-zinc-800 text-white text-sm h-10 focus:border-[#D4AF37]/50"
              />
            </div>
            {customerSearch && filteredCustomers.length > 0 && (
              <div className="mt-2 bg-[#121214] border border-zinc-800 rounded-lg max-h-32 overflow-y-auto shadow-lg z-20 absolute w-[90%]">
                {filteredCustomers.slice(0, 5).map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerSearch('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#D4AF37]/10 text-sm border-b border-zinc-800/50 last:border-0"
                  >
                    <p className="text-white font-medium">{customer.name}</p>
                    <p className="text-zinc-500 text-xs">{customer.phone}</p>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-3 group hover:border-[#D4AF37]/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{selectedCustomer.name}</p>
                    <p className="text-zinc-500 text-xs">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <Button onClick={() => setSelectedCustomer(null)} variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-white rounded-full">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#121214]/50">
            {cart.length === 0 ? (
              <div className="text-center text-zinc-600 py-16 flex flex-col items-center">
                <div className="w-20 h-20 bg-zinc-800/30 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 opacity-40" />
                </div>
                <p className="font-medium">Keranjang kosong</p>
                <p className="text-xs mt-1 text-zinc-500">Belum ada item yang dipilih</p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.itemId} className={`p-3 rounded-xl border-2 transition-all shadow-lg ${item.type === 'member_usage'
                    ? 'bg-gradient-to-r from-[#D4AF37]/20 to-zinc-900 border-[#D4AF37]'
                    : 'bg-zinc-900 border-zinc-700 hover:border-[#D4AF37]/70'
                    }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-bold text-white text-base truncate leading-tight">{item.name}</h4>
                        {item.type === 'member_usage' && (
                          <div className="flex items-center gap-1 mt-1">
                            <Crown className="w-3 h-3 text-[#D4AF37]" />
                            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wide">Member Benefit</p>
                          </div>
                        )}
                        {/* Technician Selector */}
                        {(item.type === 'service' || item.type === 'member_usage') && (
                          <div className="mt-2">
                            <select
                              className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-md p-1.5 w-full focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none"
                              value={item.technician_id || ''}
                              onChange={(e) => updateTechnician(item.itemId, e.target.value)}
                            >
                              <option value="">Pilih Teknisi...</option>
                              {technicians.map(t => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(item.itemId)} className="text-zinc-600 hover:text-red-500 transition-colors p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white disabled:opacity-50"
                          disabled={item.type === 'member_usage'}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono text-white text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white disabled:opacity-50"
                          disabled={item.type === 'member_usage'}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        {item.type === 'member_usage' ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-xs text-zinc-500 line-through">
                              Rp {item.originalPrice.toLocaleString('id-ID')}
                            </span>
                            <span className="font-semibold text-[#D4AF37] text-sm">FREE</span>
                          </div>
                        ) : (
                          <span className="font-mono text-white font-bold text-sm">
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>



          <div className="p-5 border-t border-zinc-800 bg-zinc-900 shrink-0">
            {/* Manual Discount Toggle/Input could go here but skipping to save space visually */}

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-zinc-400 text-sm">
                <span>Subtotal</span>
                <span className="font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {(discountAmount > 0 || appliedPromo) && (
                <div className="flex justify-between text-green-400 text-sm">
                  <span>Diskon</span>
                  <span className="font-mono">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="pt-3 border-t border-zinc-800 flex justify-between items-end">
                <span className="text-white font-bold text-lg">Total</span>
                <span className="font-mono text-3xl font-bold text-[#D4AF37] tracking-tight">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
              data-testid="checkout-button"
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8972E] text-black hover:opacity-90 font-bold h-14 text-lg rounded-xl shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-[0.98]"
            >
              Bayar Sekarang
            </Button>
          </div>
        </div>
      </div>

      {/* Member Check Dialog */}
      <Dialog open={showMemberCheck} onOpenChange={setShowMemberCheck}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="w-6 h-6 text-[#D4AF37]" />
              Cek Membership
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div>
              <Label className="text-zinc-400 text-sm mb-2 font-medium">Nomor Telepon</Label>
              <div className="flex gap-2">
                <Input
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  data-testid="member-phone-input"
                  className="bg-zinc-900 border-zinc-800 text-white focus:border-[#D4AF37]/50"
                  placeholder="08xxxxxxxxxx"
                />
                <Button onClick={handleCheckMembership} data-testid="search-member-button" className="bg-[#D4AF37] text-black hover:bg-[#B5952F] font-semibold">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {membershipInfo && (
              <div className="bg-gradient-to-br from-[#D4AF37]/10 to-zinc-900 border border-[#D4AF37]/30 rounded-xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Crown className="w-24 h-24 text-[#D4AF37]" />
                </div>

                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8972E] rounded-full flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{membershipInfo.customer.name}</h3>
                    <p className="text-sm text-zinc-400">{membershipInfo.customer.phone}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm mb-5 relative z-10 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tipe Membership</span>
                    <span className="text-[#D4AF37] font-bold capitalize tracking-wide">{membershipInfo.membership.membership_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Masa Berlaku</span>
                    <span className="text-green-400 font-semibold">{membershipInfo.membership.days_remaining} hari lagi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Penggunaan</span>
                    <span className="text-white font-mono">{membershipInfo.membership.usage_count}x</span>
                  </div>
                </div>

                <div className="pt-2 relative z-10">
                  <Label className="text-zinc-400 text-xs mb-2 block uppercase tracking-wider">Pilih Layanan Gratis</Label>
                  <Select
                    value={selectedServiceForMember?.id || ''}
                    onValueChange={(value) => {
                      const service = services.find(s => s.id === value);
                      setSelectedServiceForMember(service);
                    }}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white focus:ring-[#D4AF37]/30" data-testid="select-service-member">
                      <SelectValue placeholder="Pilih layanan..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] border-zinc-800">
                      {services.filter(s => s.category === 'exterior' || s.category === 'interior').map((service) => (
                        <SelectItem key={service.id} value={service.id} className="text-zinc-300 focus:text-[#D4AF37]">
                          {service.name} - Rp {service.price.toLocaleString('id-ID')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleUseMembership}
                    disabled={!selectedServiceForMember}
                    data-testid="use-membership-button"
                    className="w-full mt-4 bg-gradient-to-r from-[#D4AF37] to-[#B8972E] text-black hover:opacity-90 font-bold h-10 shadow-lg shadow-[#D4AF37]/10"
                  >
                    Gunakan Benefit Member
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              Pembayaran
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Promo Code Input - Compact */}
            {!isMemberTransaction && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                  <Input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Kode Promo"
                    className="pl-8 bg-zinc-900 border-zinc-800 text-white h-9 text-xs font-mono focus:border-[#D4AF37]/50"
                    disabled={!!appliedPromo}
                  />
                </div>
                {appliedPromo ? (
                  <Button onClick={removePromo} variant="destructive" size="sm" className="h-9 w-9 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={handleApplyPromo} className="bg-zinc-800 hover:bg-zinc-700 h-9 px-3 text-[10px] font-bold uppercase tracking-wider">
                    Apply
                  </Button>
                )}
              </div>
            )}
            {/* Total Display */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-5 border border-zinc-700/50 flex flex-col items-center">
              <p className="text-zinc-400 text-sm mb-1 uppercase tracking-widest font-medium">Total Tagihan</p>
              <p className="font-mono text-4xl font-bold text-[#D4AF37] tracking-tight">
                Rp {total.toLocaleString('id-ID')}
              </p>
              {(discountAmount > 0 || appliedPromo) && (
                <div className="mt-2 flex flex-col items-center">
                  <div className="text-zinc-500 text-xs line-through">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </div>
                  <div className="text-green-500 text-xs font-bold">
                    Hemat Rp {discountAmount.toLocaleString('id-ID')}
                  </div>
                </div>
              )}
              {isMemberTransaction && total === 0 && (
                <div className="mt-2 bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
                  <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wide">✨ Transaksi Member Gratis</p>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-wider mb-3 block font-semibold">Metode Pembayaran</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'cash', icon: Wallet, label: 'Tunai' },
                  { id: 'card', icon: CreditCard, label: 'Kartu' },
                  { id: 'qr', icon: QrCode, label: 'QRIS' }
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    data-testid={`payment-${id}`}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 ${paymentMethod === id
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 transform scale-[1.02]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white hover:bg-zinc-800'
                      }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Amount */}
            {total > 0 && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block font-semibold">Uang Diterima</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-lg">Rp</span>
                  <Input
                    type="number"
                    value={paymentReceived}
                    onChange={(e) => setPaymentReceived(e.target.value)}
                    data-testid="payment-received-input"
                    className="bg-zinc-900 border-zinc-800 text-white text-2xl font-mono h-14 pl-12 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]"
                    placeholder="0"
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setPaymentReceived(amount.toString())}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 hover:text-white font-mono border border-zinc-700 transition-colors"
                    >
                      {(amount / 1000)}K
                    </button>
                  ))}
                  <button
                    onClick={() => setPaymentReceived(total.toString())}
                    className="px-3 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-lg text-xs text-[#D4AF37] font-mono font-bold transition-colors"
                  >
                    Uang Pas
                  </button>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block font-semibold">Catatan Transaksi</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="transaction-notes-input"
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                placeholder="Tambahkan catatan jika ada..."
              />
            </div>

            {/* Change */}
            {total > 0 && received >= total && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center">
                  <span className="text-green-500 font-medium">Kembalian</span>
                  <span className="font-mono text-2xl font-bold text-green-400">
                    Rp {change.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleCheckout}
              disabled={total > 0 && received < total}
              data-testid="confirm-payment-button"
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8972E] text-black hover:opacity-90 font-bold h-14 text-lg rounded-xl shadow-lg shadow-[#D4AF37]/20 mt-2"
            >
              {total === 0 ? 'Konfirmasi Gratis' : 'Selesaikan Pembayaran'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white max-w-sm text-center shadow-2xl p-8">
          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 relative z-10 animate-in zoom-in duration-300">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          <DialogTitle className="text-2xl font-bold text-white mb-2">Transaksi Berhasil</DialogTitle>
          <p className="text-zinc-400 mb-8 font-mono bg-zinc-900 py-2 rounded border border-zinc-800 select-all">
            {lastTransaction?.invoice_number}
          </p>

          <div className="flex flex-col gap-3">
            <Button onClick={handlePrintReceipt} className="bg-zinc-800 hover:bg-zinc-700 w-full h-12 text-zinc-200 border border-zinc-700">
              <Printer className="w-5 h-5 mr-3" />
              Cetak Struk
            </Button>
            <Button onClick={handleSendWhatsApp} className="bg-[#25D366] hover:bg-[#128C7E] w-full h-12 text-white font-bold shadow-lg shadow-[#25D366]/20">
              <MessageSquare className="w-5 h-5 mr-3" />
              Kirim WhatsApp
            </Button>
            <div className="h-4"></div>
            <Button onClick={() => setShowSuccessDialog(false)} variant="outline" className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 w-full h-12 font-bold">
              Transaksi Baru
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout >
  );
};
