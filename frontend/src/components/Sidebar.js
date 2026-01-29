import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/auth';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  CreditCard,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Clock,
  Receipt,
  ShoppingBag,
  MapPin,
  Tag,
  Wallet
} from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const user = getCurrentUser();
  const navRef = useRef(null);
  const isRestoringRef = useRef(false);

  // Restore scroll position ONCE after route change
  useEffect(() => {
    if (isRestoringRef.current) return;

    const navElement = navRef.current;
    if (navElement) {
      const savedPosition = sessionStorage.getItem('sidebarScrollPosition');
      if (savedPosition) {
        isRestoringRef.current = true;
        requestAnimationFrame(() => {
          if (navRef.current) {
            navRef.current.scrollTop = parseInt(savedPosition, 10);
          }
          isRestoringRef.current = false;
        });
      }
    }
  }, [location.pathname]);

  const handleLinkClick = () => {
    // Save scroll position on click
    if (navRef.current) {
      sessionStorage.setItem('sidebarScrollPosition', navRef.current.scrollTop.toString());
    }
  };

  const isActive = (path) => location.pathname === path;

  // Role-based menu configuration
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['owner', 'manager', 'kasir'] },
    { path: '/pos', icon: ShoppingCart, label: 'POS', roles: ['kasir', 'owner'] },
    { path: '/shift', icon: Clock, label: 'Shift Management', roles: ['kasir', 'owner'] },
    { path: '/transactions', icon: Receipt, label: user?.role === 'kasir' ? 'Transaksi Saya' : 'Transaksi', roles: ['owner', 'manager', 'kasir'] },
    { path: '/customers', icon: Users, label: 'Customers', roles: ['owner', 'manager', 'kasir'] },
    { path: '/memberships', icon: CreditCard, label: 'Memberships', roles: ['owner', 'manager', 'kasir'] },
    { path: '/inventory', icon: Package, label: 'Inventory', roles: ['owner', 'manager'] },
    { path: '/services', icon: ClipboardList, label: 'Services', roles: ['owner', 'manager'] },
    { path: '/products', icon: ShoppingBag, label: 'Produk', roles: ['owner', 'manager'] },
    { path: '/promotions', icon: Tag, label: 'Promo & Diskon', roles: ['owner', 'manager'] },
    { path: '/expenses', icon: Wallet, label: 'Expenses', roles: ['owner', 'manager'] },
    { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['owner', 'manager'] },
    { path: '/settings', icon: Settings, label: 'Settings', roles: ['owner'] },
  ];

  // Filter menu items based on user role
  const accessibleMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role || 'kasir')
  );

  return (
    <div className="w-64 bg-[#121214] border-r border-zinc-800 h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="OTOPIA Logo" className="w-10 h-10 rounded-sm object-contain" />
          <div>
            <h1 className="font-secondary font-bold text-xl text-[#D4AF37]">OTOPIA</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">by PPM Autoworks</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {accessibleMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              data-testid={`sidebar-${item.label.toLowerCase().replace(' ', '-')}`}
              preventScrollReset={true}
              className={`
                flex items-center gap-3 px-6 py-3 mx-3 rounded-sm mb-1
                font-primary transition-all duration-200
                ${active
                  ? 'bg-[#D4AF37] text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <span className="text-[#D4AF37] font-bold">{user?.full_name?.charAt(0) || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white text-sm truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-zinc-500 uppercase">{user?.role || 'kasir'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          data-testid="logout-button"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};