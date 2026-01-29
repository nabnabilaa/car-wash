# Implementation Guide - Enhanced Features

Dokumen ini menjelaskan fitur-fitur baru yang sudah diimplementasikan di backend dan yang perlu diselesaikan di frontend.

## ✅ Backend Implementation (COMPLETE)

### 1. Inventory Management
**Endpoints:**
- `PUT /api/inventory/{item_id}` - Update inventory item
- `DELETE /api/inventory/{item_id}` - Delete inventory item
- Added `is_active` field untuk status

### 2. Services dengan BOM (Bill of Materials)
**Endpoints:**
- `GET /api/services/{service_id}` - Get single service
- `PUT /api/services/{service_id}` - Update service + BOM
- Added `bom` field (array of {inventory_id, inventory_name, quantity, unit})

**Auto-deduction logic:**
- Saat transaksi atau All You Can Wash usage
- Jika service punya BOM, inventory otomatis berkurang
- Jika tidak ada BOM, inventory tidak terpengaruh

### 3. Physical Products
**Endpoints:**
- `POST /api/products` - Create product
- `GET /api/products` - Get all products
- `PUT /api/products/{product_id}` - Update product

**Model:**
```javascript
{
  id, name, description, price, category,
  inventory_id (optional - link to inventory),
  is_active
}
```

### 4. Customer Management
**Endpoints:**
- `PUT /api/customers/{customer_id}` - Update customer
- `GET /api/customers/{customer_id}/transactions` - Get customer transaction history

### 5. Membership Detail & Usage
**Endpoints:**
- `GET /api/memberships/{membership_id}` - Get detail + usage history
- `POST /api/memberships/use` - Record All You Can Wash usage

**Usage Recording:**
```json
{
  "phone": "08199999999",
  "service_id": "service-id"
}
```

**Validations:**
- Customer harus ada
- Harus punya active membership (non-regular)
- Max 1x per hari
- Auto-deduct inventory jika service punya BOM

## 🚧 Frontend Implementation (TODO)

### Priority 1: Critical Features

#### 1. All You Can Wash Recording di POS
**File:** `/app/frontend/src/pages/POSPage.js`

**Changes needed:**
```javascript
// Add button "All You Can Wash" di POS
// Onclick: Show dialog untuk input phone number
// Call API: POST /api/memberships/use
// Show success message dengan usage count dan remaining days
```

**Dialog fields:**
- Phone number input
- Service selection (dropdown)
- Submit button

#### 2. Products Management Page
**File:** `/app/frontend/src/pages/ProductsPage.js` (NEW)

**Features:**
- List all products (grid/table)
- Add product button → dialog
- Edit product button per item
- Link product to inventory (optional)
- Toggle active/inactive
- Category filter

**Similar to ServicesPage.js structure**

#### 3. POS Enhancement - Services + Products
**File:** `/app/frontend/src/pages/POSPage.js`

**Changes:**
- Add tabs: "Services" | "Products"
- Services tab: current implementation
- Products tab: display products untuk dijual
- Items di cart harus include `product_id` atau `service_id`

### Priority 2: Management Features

#### 4. Inventory Edit Functionality
**File:** `/app/frontend/src/pages/InventoryPage.js`

**Add:**
- Edit button per row
- Edit dialog with all fields
- PUT /api/inventory/{id} on save
- Toggle is_active
- Show status badge based on:
  - `is_active === false` → "Non-aktif"
  - `current_stock <= min_stock` → "Low Stock"
  - else → "OK"

#### 5. Services BOM Configuration
**File:** `/app/frontend/src/pages/ServicesPage.js`

**Add:**
- Edit service button
- Edit dialog with BOM section
- Multi-select inventory items
- Input quantity per item
- Save as array: `[{inventory_id, inventory_name, quantity, unit}]`

#### 6. Customer Edit + Detail
**File:** `/app/frontend/src/pages/CustomersPage.js`

**Changes:**
- Add edit button per row
- Make row clickable → navigate to `/customers/{id}`

**New File:** `/app/frontend/src/pages/CustomerDetailPage.js`

**Features:**
- Customer info card dengan edit button
- Edit dialog (PUT /api/customers/{id})
- Transaction history table
- Stats: total visits, total spending, avg per visit

#### 7. Membership Detail Page
**File:** `/app/frontend/src/pages/MembershipsPage.js`

**Changes:**
- Make card clickable → navigate to `/memberships/{id}`

**New File:** `/app/frontend/src/pages/MembershipDetailPage.js`

**Features:**
- Membership info card
- Usage history table (dari membership_usage collection)
- Stats: usage count, remaining days, avg per week
- Usage chart (optional)

### UI Components Patterns

**Edit Dialog Template:**
```javascript
const [showEditDialog, setShowEditDialog] = useState(false);
const [editData, setEditData] = useState(null);

const handleEdit = (item) => {
  setEditData(item);
  setShowEditDialog(true);
};

const handleSaveEdit = async () => {
  await api.put(`/endpoint/${editData.id}`, updateData);
  toast.success('Updated successfully');
  fetchData();
  setShowEditDialog(false);
};
```

**Status Badge Component:**
```javascript
const getStatusBadge = (item) => {
  if (!item.is_active) return <Badge variant="destructive">Non-aktif</Badge>;
  if (item.current_stock <= item.min_stock) return <Badge variant="warning">Low Stock</Badge>;
  return <Badge variant="success">OK</Badge>;
};
```

## Testing Checklist

### Backend Tests:
```bash
# Inventory update
curl -X PUT "$API_URL/api/inventory/{id}" -H "Authorization: Bearer $TOKEN" -d '{"name":"Updated Name"}'

# Service with BOM
curl -X PUT "$API_URL/api/services/{id}" -H "Authorization: Bearer $TOKEN" -d '{"bom":[{"inventory_id":"xxx","quantity":10}]}'

# Product CRUD
curl -X POST "$API_URL/api/products" -H "Authorization: Bearer $TOKEN" -d '{"name":"Wax Sachet","price":5000}'

# All You Can Wash usage
curl -X POST "$API_URL/api/memberships/use" -H "Authorization: Bearer $TOKEN" -d '{"phone":"08199999999","service_id":"xxx"}'

# Customer transactions
curl -X GET "$API_URL/api/customers/{id}/transactions" -H "Authorization: Bearer $TOKEN"
```

### Frontend Tests:
- [ ] All You Can Wash flow dari input phone sampai success
- [ ] Products bisa dijual di POS
- [ ] Inventory auto-deduct setelah transaksi (check inventory page)
- [ ] Edit inventory, service, customer working
- [ ] Membership detail page accessible dan showing usage history
- [ ] Customer detail page showing transactions

## Database Collections Updated

**membership_usage** (NEW):
```javascript
{
  id, membership_id, customer_id, customer_name,
  service_id, service_name,
  kasir_id, kasir_name,
  used_at
}
```

**products** (NEW):
```javascript
{
  id, name, description, price, category,
  inventory_id (optional), is_active
}
```

**services** (UPDATED):
```javascript
{
  ...existing fields,
  bom: [{inventory_id, inventory_name, quantity, unit}]
}
```

**inventory** (UPDATED):
```javascript
{
  ...existing fields,
  is_active: boolean
}
```

## Notes

1. **BOM is Optional:** Jika service tidak punya BOM, inventory tidak akan berkurang
2. **Product-Inventory Link is Optional:** Product bisa dijual tanpa link ke inventory
3. **Auto-deduction:** Terjadi di 3 tempat:
   - Regular transaction (POS)
   - All You Can Wash usage
   - Product sales
4. **Membership Usage Limit:** 1x per hari per membership
5. **Multiple Active Memberships:** Customer bisa punya multiple memberships, sistem ambil yang paling baru yang masih aktif

## Quick Start Commands

```bash
# Restart backend
cd /app/backend && sudo supervisorctl restart backend

# Restart frontend
cd /app/frontend && sudo supervisorctl restart frontend

# Check logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.err.log
```
