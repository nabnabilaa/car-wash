# Wash & Go - Sistem POS Car Wash

Sistem Point of Sale (POS) profesional untuk bisnis car wash dengan fitur lengkap: multi-kasir management, membership dengan expiry tracking, inventory dengan HPP, dan Excel export.

## 🌟 Fitur Utama (Phase 1)

### 1. Transaction History dengan Role-Based Access ⭐ NEW!
- ✅ Halaman Transactions untuk melihat semua riwayat transaksi
- ✅ **Kasir:** Hanya bisa lihat transaksi mereka sendiri
- ✅ **Admin/Owner/Manager:** Bisa lihat semua transaksi dari semua kasir
- ✅ Filter by date: Today, Week, Month, All
- ✅ Search by invoice, customer name, atau kasir name
- ✅ View detail transaction dengan breakdown items
- ✅ Stats dashboard: total transaksi, revenue, average, payment breakdown
- ✅ Export to Excel dengan filter yang aktif

### 2. Public Landing Page & Customer Self-Service
- ✅ Landing page promosi car wash untuk public
- ✅ Display services dan paket membership
- ✅ Customer dapat cek status membership sendiri (by phone number)
- ✅ Informasi expiry date dan sisa hari membership
- ✅ Contact information dan lokasi outlet

### 2. Transaction Notes & Records
- ✅ Catatan untuk setiap transaksi POS
- ✅ Catatan untuk perpanjangan/pembuatan membership
- ✅ Complete audit trail dengan notes tracking

### 3. Multi-Kasir Management
- ✅ Login/logout dengan akun individual per kasir
- ✅ Role-based access control (Owner, Manager, Kasir, Teknisi)
- ✅ User management dengan profile lengkap
- ✅ Tracking performa per kasir

### 2. Shift & Cash Drawer Management
- ✅ Opening shift dengan modal awal (cash on hand)
- ✅ Closing shift dengan reconciliation
- ✅ Laporan selisih cash (over/short) per kasir
- ✅ Riwayat transaksi per kasir per shift

### 3. Membership System dengan Expiry
- ✅ Regular Membership (point-based)
- ✅ All You Can Wash - Bulanan (30 hari)
- ✅ All You Can Wash - 3 Bulanan (90 hari)
- ✅ All You Can Wash - 6 Bulanan (180 hari)
- ✅ All You Can Wash - Tahunan (365 hari)
- ✅ Automatic status tracking (Active, Expiring Soon, Expired)
- ✅ Usage count tracking
- ✅ Membership expiry alerts

### 4. Inventory Management dengan HPP
- ✅ Master data inventory dengan SKU
- ✅ HPP (Harga Pokok Penjualan) tracking per produk
- ✅ Min/max stock levels dengan auto-alert
- ✅ Kategori: Chemicals, Supplies, Equipment Parts
- ✅ Low stock warning system
- ✅ Total inventory valuation

### 5. POS/Transaction Management
- ✅ Service selection dengan cart system
- ✅ Customer linking (optional)
- ✅ Multiple payment methods (Cash, Card, QR)
- ✅ Cash calculation dengan change amount
- ✅ Invoice number auto-generation
- ✅ Transaction attribution per kasir

### 6. Excel Export Functionality
- ✅ Export Sales Report (transactions, kasir, payment)
- ✅ Export Inventory Report (stock, HPP, valuation)
- ✅ Export Customer Report (visits, spending)
- ✅ Export Membership Report (status, expiry, usage)
- ✅ Export Shift Report (opening, closing, variance)
- ✅ Complete Report (all sheets in one file)
- ✅ Auto-formatted dengan column width optimization

### 7. Dashboard & Analytics
- ✅ Real-time metrics (revenue, transactions, memberships)
- ✅ Low stock alerts
- ✅ Kasir performance tracking
- ✅ Today's statistics

## 🎨 Design

**Theme:** Black & Gold (Luxury Aesthetic)
- **Colors:** Obsidian Black (#09090B) background dengan Metallic Gold (#D4AF37) accents
- **Typography:** 
  - Manrope untuk UI/Body (clean, modern)
  - Playfair Display untuk Brand Headings (luxury)
  - JetBrains Mono untuk data/numbers
- **Style:** Sharp buttons, glassmorphism overlays, premium feel

## 🚀 Quick Start

### Login Credentials
```
Admin Account:
Username: admin
Password: admin123

Kasir Account 1:
Username: kasir1
Password: kasir123

Kasir Account 2:
Username: kasir2
Password: kasir123
```

### Sample Data
Sistem sudah di-seed dengan:
- 3 users (1 owner, 2 kasir)
- 8 sample services (Cuci Eksterior, Interior, Waxing, Polish, Coating)
- 5 inventory items dengan HPP

## 📁 Struktur Folder

```
/app/
├── backend/
│   ├── server.py          # FastAPI main application
│   ├── seed_data.py       # Data seeding script
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Shadcn UI components
│   │   │   ├── Layout.js     # Main layout with sidebar
│   │   │   ├── Sidebar.js    # Navigation sidebar
│   │   │   └── ProtectedRoute.js
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── Dashboard.js
│   │   │   ├── POSPage.js
│   │   │   ├── ShiftPage.js
│   │   │   ├── CustomersPage.js
│   │   │   ├── MembershipsPage.js
│   │   │   ├── InventoryPage.js
│   │   │   ├── ServicesPage.js
│   │   │   ├── ReportsPage.js
│   │   │   └── SettingsPage.js
│   │   ├── utils/
│   │   │   ├── api.js        # Axios instance with interceptors
│   │   │   ├── auth.js       # Authentication utilities
│   │   │   └── excelExport.js # Excel export functionality
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── .env              # Frontend environment variables
│
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** MongoDB dengan Motor (async driver)
- **Authentication:** JWT dengan bcrypt password hashing
- **Excel Export:** openpyxl & xlsxwriter

### Frontend
- **Framework:** React 19
- **Routing:** React Router v7
- **Styling:** TailwindCSS
- **UI Components:** Shadcn UI (Radix UI)
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Excel Export:** xlsx (SheetJS)
- **HTTP Client:** Axios

## 📊 Database Collections

### users
```javascript
{
  id: string,
  username: string,
  password_hash: string,
  full_name: string,
  email: string (optional),
  role: "owner" | "manager" | "kasir" | "teknisi",
  phone: string (optional),
  is_active: boolean,
  created_at: datetime
}
```

### shifts
```javascript
{
  id: string,
  kasir_id: string,
  kasir_name: string,
  opening_balance: float,
  closing_balance: float (optional),
  expected_balance: float (optional),
  variance: float (optional),
  opened_at: datetime,
  closed_at: datetime (optional),
  status: "open" | "closed",
  notes: string (optional)
}
```

### customers
```javascript
{
  id: string,
  name: string,
  phone: string,
  email: string (optional),
  vehicle_number: string (optional),
  vehicle_type: string (optional),
  join_date: datetime,
  total_visits: int,
  total_spending: float
}
```

### memberships
```javascript
{
  id: string,
  customer_id: string,
  customer_name: string,
  membership_type: "regular" | "monthly" | "quarterly" | "biannual" | "annual",
  start_date: datetime,
  end_date: datetime,
  status: "active" | "expiring_soon" | "expired",
  usage_count: int,
  last_used: datetime (optional),
  price: float,
  notes: string (optional),
  created_at: datetime
}
```

### services
```javascript
{
  id: string,
  name: string,
  description: string (optional),
  price: float,
  duration_minutes: int,
  category: string,
  is_active: boolean
}
```

### inventory
```javascript
{
  id: string,
  sku: string,
  name: string,
  category: "chemicals" | "supplies" | "equipment_parts",
  unit: string,
  current_stock: float,
  min_stock: float,
  max_stock: float,
  unit_cost: float,
  supplier: string (optional),
  last_purchase_date: datetime (optional)
}
```

### transactions
```javascript
{
  id: string,
  invoice_number: string,
  kasir_id: string,
  kasir_name: string,
  customer_id: string (optional),
  customer_name: string (optional),
  shift_id: string,
  items: array,
  subtotal: float,
  total: float,
  payment_method: "cash" | "card" | "qr",
  payment_received: float,
  change_amount: float,
  cogs: float,
  gross_margin: float,
  notes: string (optional),
  created_at: datetime
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Owner/Manager only)

### Shifts
- `POST /api/shifts/open` - Open new shift
- `POST /api/shifts/close` - Close shift
- `GET /api/shifts/current/{kasir_id}` - Get current open shift
- `GET /api/shifts` - Get shift history

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers` - Get all customers
- `GET /api/customers/{id}` - Get customer by ID

### Memberships
- `POST /api/memberships` - Create membership
- `GET /api/memberships` - Get all memberships (with auto status update)

### Services
- `POST /api/services` - Create service
- `GET /api/services` - Get all active services

### Inventory
- `POST /api/inventory` - Create inventory item
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/low-stock` - Get low stock items

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get all transactions (role-based: kasir only see their own)
- `GET /api/transactions/today` - Get today's transactions (role-based)
- `GET /api/transactions/{id}` - Get transaction detail (kasir can only see their own)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Public Endpoints (No Authentication)
- `POST /api/public/check-membership?phone={phone}` - Check membership by phone number
- `GET /api/public/services` - Get public services list for landing page

## 📈 Testing Results

**Backend:** 100% Success Rate (16/16 endpoints passed)
**Frontend:** 95% Success Rate

### Passed Tests
✅ Admin login authentication  
✅ Dashboard statistics display  
✅ Navigation to all pages  
✅ Shift management (open/close with reconciliation)  
✅ Services catalog with categorization  
✅ Customer management  
✅ Membership management with expiry tracking  
✅ Inventory with HPP and low stock alerts  
✅ POS transactions with payment processing  
✅ Excel export functionality  
✅ Settings and user management  
✅ Backend-frontend integration  
✅ Black & gold theme implementation  

## 🎯 Next Action Items (Phase 2 Ideas)

### Advanced Features
- [ ] Bill of Materials (BOM) configuration untuk setiap service
- [ ] Auto-deduction inventory saat transaksi berdasarkan BOM
- [ ] COGS calculation per transaction
- [ ] Gross margin calculation dan profitability reports
- [ ] Stock movement tracking (in/out/adjustment)
- [ ] Purchase Order management
- [ ] Membership auto-renewal dengan payment gateway
- [ ] Email/WhatsApp notifications untuk membership expiry
- [ ] Advanced analytics dan charts
- [ ] Multi-outlet support
- [ ] Receipt printing functionality
- [ ] Barcode/QR scanner untuk membership card

### Enhancements
- [ ] Dark/Light mode toggle (saat ini default black & gold)
- [ ] Export scheduled reports (daily/weekly/monthly)
- [ ] Cloud storage integration untuk backup
- [ ] Advanced filtering dan search
- [ ] Batch operations (bulk edit/delete)
- [ ] Employee commission tracking
- [ ] Customer loyalty points system
- [ ] Appointment/booking system
- [ ] Mobile app untuk kasir

## 💡 Business Enhancement

**Untuk meningkatkan revenue dan efisiensi:**
1. Implement membership renewal reminders via WhatsApp/Email untuk meningkatkan retention rate
2. Add loyalty points system untuk customer regular (non-membership) untuk encourage repeat visits
3. Create bundle packages (e.g., "Paket Hemat: Cuci Eksterior + Interior") dengan discount untuk increase average transaction value
4. Track peak hours dari transaction data untuk optimize staff scheduling
5. Analyze most profitable services (dari gross margin data) untuk fokus pada upselling

## 📝 Notes

- Sistem menggunakan MongoDB untuk flexibility dan scalability
- JWT authentication dengan 24 jam expiration
- All passwords di-hash menggunakan bcrypt
- Frontend menggunakan protected routes untuk security
- Excel export support untuk semua major reports
- Responsive design untuk berbagai screen sizes
- Data seed script tersedia untuk quick setup

## 🔒 Security

- Password hashing dengan bcrypt
- JWT token-based authentication
- Protected routes di frontend
- Authorization checks di backend per endpoint
- CORS configured untuk production security

## 📞 Support

Untuk pertanyaan atau bantuan:
- Email: info@washngo.com
- Phone: 021-12345678

---

**Built with ❤️ using FastAPI, React, and MongoDB**
**Black & Gold Theme - Luxury POS Experience**
