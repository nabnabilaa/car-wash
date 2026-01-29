# Management Features Implementation Summary

## ✅ Backend APIs Complete

### Customer Management
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer (checks active memberships)

### Membership Management  
- `PUT /api/memberships/{id}?days=X` - Extend membership by X days
- `DELETE /api/memberships/{id}` - Delete membership + usage history

### Services Management
- `PUT /api/services/{id}` - Update service + BOM
- `DELETE /api/services/{id}` - Soft delete (set is_active=false)

### Inventory Management
- `PUT /api/inventory/{id}` - Update inventory item
- `DELETE /api/inventory/{id}` - Delete inventory item

### User Management
- `PUT /api/users/{id}` - Update user (role, active status, info)
- `DELETE /api/users/{id}` - Deactivate user (owner only)

## 🎨 Frontend Components Created

### Reusable Components
1. **DeleteConfirmDialog** - `/app/frontend/src/components/DeleteConfirmDialog.js`
   - Reusable confirmation dialog
   - Loading state support
   - Customizable title & description

2. **EditButton** - `/app/frontend/src/components/EditButton.js`
   - Consistent edit button dengan icon

3. **DeleteButton** - `/app/frontend/src/components/DeleteButton.js`
   - Consistent delete button dengan red styling

## 📋 Implementation Checklist

### Priority 1: Customer Management ✅ NEXT
**File:** `/app/frontend/src/pages/CustomersPage.js`

**Add:**
```javascript
import { EditButton } from '../components/EditButton';
import { DeleteButton } from '../components/DeleteButton';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

// State
const [showEditDialog, setShowEditDialog] = useState(false);
const [editingCustomer, setEditingCustomer] = useState(null);
const [deleteTarget, setDeleteTarget] = useState(null);

// Handlers
const handleEdit = (customer) => {
  setEditingCustomer(customer);
  setFormData({...customer});
  setShowEditDialog(true);
};

const handleSaveEdit = async () => {
  await api.put(`/customers/${editingCustomer.id}`, formData);
  toast.success('Customer updated');
  fetchCustomers();
  setShowEditDialog(false);
};

const handleDelete = async () => {
  await api.delete(`/customers/${deleteTarget.id}`);
  toast.success('Customer deleted');
  fetchCustomers();
  setDeleteTarget(null);
};

// In table row
<EditButton onClick={() => handleEdit(customer)} />
<DeleteButton onClick={() => setDeleteTarget(customer)} />

// Add dialogs
<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
  {/* Edit form - same as add form but with update handler */}
</Dialog>

<DeleteConfirmDialog
  open={!!deleteTarget}
  onOpenChange={() => setDeleteTarget(null)}
  onConfirm={handleDelete}
  description="Customer dan riwayat transaksi akan dihapus."
/>
```

### Priority 2: Inventory Management
**File:** `/app/frontend/src/pages/InventoryPage.js`

**Add:**
- Edit button per row
- Edit dialog dengan semua fields
- Toggle is_active switch
- Delete confirmation
- Status badge calculation

**Status Badge Logic:**
```javascript
const getStatusBadge = (item) => {
  if (!item.is_active) {
    return <Badge className="bg-zinc-700 text-zinc-400">Non-aktif</Badge>;
  }
  if (item.current_stock <= item.min_stock) {
    return <Badge className="bg-orange-500/20 text-orange-500">Low Stock</Badge>;
  }
  return <Badge className="bg-green-500/20 text-green-500">OK</Badge>;
};
```

### Priority 3: Services Management
**File:** `/app/frontend/src/pages/ServicesPage.js`

**Add:**
- Edit button per service card
- BOM configuration section in edit dialog
- Multi-select inventory items for BOM
- Quantity input per BOM item
- Delete confirmation (soft delete)

**BOM Structure:**
```javascript
// Edit dialog includes
<div>
  <Label>Bill of Materials (Optional)</Label>
  <Button onClick={addBOMItem}>+ Add Item</Button>
  {bom.map((item, index) => (
    <div key={index}>
      <Select value={item.inventory_id} onChange={...}>
        {/* Inventory items */}
      </Select>
      <Input 
        type="number" 
        value={item.quantity}
        onChange={...}
        placeholder="Quantity"
      />
      <Button onClick={() => removeBOMItem(index)}>Remove</Button>
    </div>
  ))}
</div>
```

### Priority 4: Membership Management  
**File:** `/app/frontend/src/pages/MembershipsPage.js`

**Add:**
- Extend membership button → dialog input days
- Delete membership button
- Confirmation dialogs

**Extend Dialog:**
```javascript
<Dialog open={showExtendDialog}>
  <DialogContent>
    <Label>Extend by (days)</Label>
    <Input type="number" value={extendDays} onChange={...} />
    <Button onClick={handleExtend}>Extend Membership</Button>
  </DialogContent>
</Dialog>

const handleExtend = async () => {
  await api.put(`/memberships/${selectedMembership.id}?days=${extendDays}`);
  toast.success(`Extended by ${extendDays} days`);
  fetchMemberships();
};
```

### Priority 5: User Management (Settings)
**File:** `/app/frontend/src/pages/SettingsPage.js`

**Add:**
- Edit user button
- Edit dialog: role, active status, info
- Delete/deactivate user button (owner only)
- Show current user badge (cannot edit self)

**Edit User Dialog:**
```javascript
<Dialog open={showEditUserDialog}>
  <DialogContent>
    <Input value={editUserData.full_name} onChange={...} />
    <Input type="email" value={editUserData.email} onChange={...} />
    <Select value={editUserData.role} onChange={...}>
      <SelectItem value="owner">Owner</SelectItem>
      <SelectItem value="manager">Manager</SelectItem>
      <SelectItem value="kasir">Kasir</SelectItem>
      <SelectItem value="teknisi">Teknisi</SelectItem>
    </Select>
    <Switch 
      checked={editUserData.is_active} 
      onCheckedChange={...}
      label="Active"
    />
    <Button onClick={handleSaveUser}>Save Changes</Button>
  </DialogContent>
</Dialog>
```

## 🔒 Authorization Rules

### Delete Operations
- **Customer:** Owner/Manager only + no active memberships
- **Membership:** Owner/Manager only
- **Service:** Owner/Manager only (soft delete)
- **Inventory:** Owner/Manager only
- **User:** Owner only + cannot delete self + user must not have open shift

### Edit Operations
- **All:** Any authenticated user can view
- **Customer/Service/Inventory:** Owner/Manager can edit
- **Membership:** Owner/Manager can extend
- **User:** Owner/Manager can edit others

## 🎯 Quick Implementation Guide

### Step 1: Import Components
```javascript
import { EditButton } from '../components/EditButton';
import { DeleteButton } from '../components/DeleteButton';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
```

### Step 2: Add State
```javascript
const [showEditDialog, setShowEditDialog] = useState(false);
const [editingItem, setEditingItem] = useState(null);
const [deleteTarget, setDeleteTarget] = useState(null);
const [formData, setFormData] = useState({});
```

### Step 3: Add Handlers
```javascript
const handleEdit = (item) => {
  setEditingItem(item);
  setFormData({...item});
  setShowEditDialog(true);
};

const handleSaveEdit = async () => {
  await api.put(`/endpoint/${editingItem.id}`, formData);
  toast.success('Updated successfully');
  fetchData();
  setShowEditDialog(false);
};

const handleDelete = async () => {
  try {
    await api.delete(`/endpoint/${deleteTarget.id}`);
    toast.success('Deleted successfully');
    fetchData();
    setDeleteTarget(null);
  } catch (error) {
    toast.error(error.response?.data?.detail || 'Failed to delete');
  }
};
```

### Step 4: Add Buttons to Table/Card
```javascript
<div className="flex gap-2">
  <EditButton onClick={() => handleEdit(item)} />
  <DeleteButton onClick={() => setDeleteTarget(item)} />
</div>
```

### Step 5: Add Dialogs
```javascript
{/* Edit Dialog */}
<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
  <DialogContent className="bg-[#121214] border-zinc-800 text-white">
    <DialogHeader>
      <DialogTitle>Edit {/* Item Type */}</DialogTitle>
    </DialogHeader>
    {/* Form fields - same as add form */}
    <Button onClick={handleSaveEdit}>Save Changes</Button>
  </DialogContent>
</Dialog>

{/* Delete Confirmation */}
<DeleteConfirmDialog
  open={!!deleteTarget}
  onOpenChange={() => setDeleteTarget(null)}
  onConfirm={handleDelete}
  title="Hapus {/* Item Type */}?"
  description="Data akan dihapus permanen."
/>
```

## 🧪 Testing Commands

```bash
# Get token
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Test customer update
curl -X PUT "$API_URL/api/customers/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# Test customer delete
curl -X DELETE "$API_URL/api/customers/{id}" \
  -H "Authorization: Bearer $TOKEN"

# Test inventory update
curl -X PUT "$API_URL/api/inventory/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_stock":100,"is_active":true}'

# Test service update with BOM
curl -X PUT "$API_URL/api/services/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Service","bom":[{"inventory_id":"xxx","inventory_name":"Shampoo","quantity":50,"unit":"ml"}]}'

# Test membership extend
curl -X PUT "$API_URL/api/memberships/{id}?days=30" \
  -H "Authorization: Bearer $TOKEN"

# Test user update
curl -X PUT "$API_URL/api/users/{id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"manager","is_active":true}'
```

## 📝 Error Handling

### Common Errors
- **400:** Validation failed (e.g., customer has active memberships)
- **403:** Not authorized (insufficient permissions)
- **404:** Item not found
- **409:** Conflict (e.g., cannot delete self)

### Frontend Error Display
```javascript
try {
  await api.delete(`/endpoint/${id}`);
  toast.success('Deleted successfully');
} catch (error) {
  if (error.response?.status === 400) {
    toast.error(error.response.data.detail); // Show specific reason
  } else if (error.response?.status === 403) {
    toast.error('Anda tidak memiliki akses untuk operasi ini');
  } else {
    toast.error('Gagal menghapus data');
  }
}
```

## 🎨 UI/UX Guidelines

### Edit Button Placement
- Table rows: Last column dengan action buttons
- Cards: Top-right corner atau bottom action bar

### Delete Confirmation
- Always show confirmation dialog
- Include item name/identifier in dialog
- Show consequences (e.g., "akan menghapus X related items")

### Loading States
- Disable buttons during API calls
- Show loading text in buttons
- Prevent dialog close during operation

### Success Feedback
- Toast notification dengan action description
- Refresh data immediately
- Close dialogs after success

## 🚀 Next Steps

1. Implement Customer Management (Priority 1)
2. Implement Inventory Management (Priority 2)
3. Implement Services Management (Priority 3)
4. Implement Membership Management (Priority 4)
5. Implement User Management (Priority 5)

Each implementation should take 30-60 minutes following the templates provided.
