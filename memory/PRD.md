# Car Wash POS System - PRD

## Original Problem Statement
Membangun sistem Point of Sale (POS) khusus untuk bisnis car wash dengan fitur:
- Automasi transaksi dan manajemen pelanggan
- Inventory tracking dengan HPP (Harga Pokok Penjualan)
- Membership system "All You Can Wash"
- Multi-kasir management dengan outlet assignment
- Laporan dan export Excel

## Core Requirements

### Phase 1 - Core Features ✅ COMPLETED
1. **Multi-Kasir Management**
   - Login/logout per user dengan role (Owner, Manager, Kasir, Teknisi)
   - Shift management dengan opening/closing balance
   - Transaction attribution per kasir
   - **NEW: Outlet assignment - kasir tahu lokasi tugasnya**

2. **Membership System - "All You Can Wash"**
   - Membership types: Monthly, Quarterly, Biannual, Annual
   - Usage tracking (1 cuci gratis per hari)
   - Flow: Kasir cek nomor HP → Sistem deteksi membership → Biaya = Rp 0
   - **NEW: Payment method "subscription" untuk transaksi member Rp 0**

3. **Inventory Management**
   - Basic inventory tracking dengan HPP per item
   - Low stock alerts
   - BOM (Bill of Materials) untuk layanan

4. **Transaction Management**
   - POS dengan keranjang belanja
   - Multiple payment methods (Cash, Card, QR, **Subscription**)
   - Transaction notes

5. **Excel Export**
   - Export untuk Inventory, Customers, Memberships
   - **NEW: Export riwayat transaksi per customer**

### Phase 2 - Full CRUD Management ✅ COMPLETED
1. **Inventory Page** - Add, Edit, Delete items
2. **Services Page** - Add, Edit, Delete dengan optional BOM
3. **Customers Page** - Add, Edit, Delete + View transaction history + **Export**
4. **Memberships Page** - Create, View Detail, Extend, Delete
5. **User Management** - Add users, Edit info, Reset password, **Assign outlet**
6. **Outlet Management** - **NEW: Add, Edit, Delete outlets/cabang**
7. **Products Page** - **NEW: Kelola produk yang dijual di outlet**

### Phase 3 - Enhanced POS ✅ COMPLETED
1. **Jual Produk Fisik** - Tab Produk di POS
2. **Member Subscription Flow** - Cek member → Gratis cuci → Payment method = "subscription"

## Technical Architecture

### Backend (FastAPI + MongoDB)
- `/app/backend/server.py` - Main API server
- JWT authentication with role-based access
- MongoDB collections: users, customers, memberships, inventory, services, products, transactions, shifts, **outlets**

### Frontend (React)
- `/app/frontend/src/pages/` - All page components
- Theme: Black & Gold
- UI Components: Shadcn UI
- Language: Indonesian

### Key API Endpoints
- `POST /api/outlets` - Create outlet
- `GET /api/outlets` - List outlets
- `PUT /api/outlets/{id}` - Update outlet
- `DELETE /api/outlets/{id}` - Delete outlet
- `GET /api/products` - List products with stock info
- `POST /api/products` - Create product
- `DELETE /api/products/{id}` - Delete product
- `GET /api/customers/{id}/transactions` - Customer transaction history

## User Personas
1. **Owner** - Full access, manage users & outlets, view all reports
2. **Manager** - Manage operations, cannot delete users/outlets
3. **Kasir** - POS operations, shift management, limited view
4. **Teknisi** - View only for services and inventory

## Credentials
- Admin: `admin` / `admin123`
- Kasir 1: `kasir1` / `kasir123`
- Kasir 2: `kasir2` / `kasir123`
- Test Member: `081234567890`

## What's Implemented ✅
- [x] User authentication with JWT
- [x] Role-based access control
- [x] Dashboard with stats
- [x] POS with services and products
- [x] Member subscription check flow with payment_method="subscription"
- [x] Shift management
- [x] Full CRUD for all entities
- [x] Membership usage tracking
- [x] Excel export for reports
- [x] Public landing page with membership check
- [x] Transaction history (role-aware)
- [x] User management (add, edit, reset password, outlet assignment)
- [x] **Outlet/Cabang management (add, edit, delete)**
- [x] **Products page with full CRUD**
- [x] **Export customer transaction history**

## Future/Backlog Tasks (P1/P2)
- [ ] Email notifications for expiring memberships (requires SendGrid/Resend)
- [ ] Advanced reporting with P&L analysis
- [ ] Cash variance tracking for shifts
- [ ] Employee performance dashboards
- [ ] Receipt printing integration
- [ ] WhatsApp notification for membership reminders

---
Last Updated: January 21, 2026
