from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum
from whatsapp_helper import whatsapp

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'carwash-pos-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION = 24  # hours

security = HTTPBearer()

app = FastAPI()

# CORS Middleware - MUST be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    OWNER = "owner"
    MANAGER = "manager"
    KASIR = "kasir"
    TEKNISI = "teknisi"

class MembershipType(str, Enum):
    REGULAR = "regular"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    BIANNUAL = "biannual"
    ANNUAL = "annual"

class MembershipStatus(str, Enum):
    ACTIVE = "active"
    EXPIRING_SOON = "expiring_soon"
    EXPIRED = "expired"

class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    QR = "qr"
    SUBSCRIPTION = "subscription"  # For member usage with Rp 0

class PromotionType(str, Enum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"

# Models
class Outlet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    phone: Optional[str] = None
    manager_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OutletCreate(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    manager_name: Optional[str] = None

class OutletUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    manager_name: Optional[str] = None
    is_active: Optional[bool] = None

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    full_name: str
    email: Optional[EmailStr] = None
    role: UserRole
    phone: Optional[str] = None
    outlet_id: Optional[str] = None  # Assigned outlet/branch
    outlet_name: Optional[str] = None  # For display
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[EmailStr] = None
    role: UserRole
    phone: Optional[str] = None
    outlet_id: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    outlet_id: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordReset(BaseModel):
    new_password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: User

class ShiftOpen(BaseModel):
    kasir_id: str
    opening_balance: float

class ShiftClose(BaseModel):
    shift_id: str
    closing_balance: float
    notes: Optional[str] = None

class CashDenomination(BaseModel):
    d100k: int = 0
    d50k: int = 0
    d20k: int = 0
    d10k: int = 0
    d5k: int = 0
    d2k: int = 0
    d1k: int = 0
    coins: float = 0
    total: float = 0

class PettyCashLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shift_id: str
    amount: float
    category: str  # e.g., "Operational", "Refund", "Cash Drop"
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by_id: str
    created_by_name: str

class Shift(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    kasir_id: str
    kasir_name: str
    opening_balance: float
    opening_denominations: Optional[CashDenomination] = None
    
    closing_balance: Optional[float] = None
    closing_denominations: Optional[CashDenomination] = None
    
    petty_cash_total: float = 0
    cash_drop_total: float = 0
    
    expected_balance: Optional[float] = None
    variance: Optional[float] = None
    
    opened_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None
    status: str = "open"  # open, closed
    notes: Optional[str] = None

class ShiftOpen(BaseModel):
    kasir_id: str
    opening_balance: float
    denominations: Optional[CashDenomination] = None

class ShiftClose(BaseModel):
    shift_id: str
    closing_balance: float
    denominations: Optional[CashDenomination] = None
    notes: Optional[str] = None

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    category: str
    amount: float
    description: Optional[str] = None
    payment_method: str = "transfer" # transfer, cash, etc
    created_by: str

class PettyCashCreate(BaseModel):
    shift_id: str
    amount: float
    category: str
    description: str

class CommissionPayout(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = None
    created_by: str

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[EmailStr] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    join_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_visits: int = 0
    total_spending: float = 0.0

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None

class Membership(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    membership_type: MembershipType
    start_date: datetime
    end_date: datetime
    status: MembershipStatus
    usage_count: int = 0
    last_used: Optional[datetime] = None
    price: float
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MembershipCreate(BaseModel):
    customer_id: str
    membership_type: MembershipType
    price: float
    notes: Optional[str] = None

class MembershipUsage(BaseModel):
    phone: str
    service_id: str

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: str  # exterior, interior, detailing, etc
    commission_rate: float = 0.0  # Percentage of commission for technician
    is_active: bool = True

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: str
    commission_rate: float = 0.0

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sku: str
    name: str
    category: str  # chemicals, supplies, equipment_parts
    unit: str  # liter, kg, pcs
    current_stock: float
    min_stock: float
    max_stock: float
    unit_cost: float  # HPP
    supplier: Optional[str] = None
    last_purchase_date: Optional[datetime] = None
    is_active: bool = True

class InventoryItemCreate(BaseModel):
    sku: str
    name: str
    category: str
    unit: str
    current_stock: float
    min_stock: float
    max_stock: float
    unit_cost: float
    supplier: Optional[str] = None

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    current_stock: Optional[float] = None
    min_stock: Optional[float] = None
    max_stock: Optional[float] = None
    unit_cost: Optional[float] = None
    supplier: Optional[str] = None
    is_active: Optional[bool] = None

class InventoryLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    inventory_id: str
    inventory_name: str
    change_amount: float
    previous_stock: float
    new_stock: float
    reason: str
    user_id: str
    user_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StockAdjustmentRequest(BaseModel):
    amount: float
    type: str # 'add' or 'subtract'
    reason: str

# BOM (Bill of Materials) for services
class BOMItem(BaseModel):
    inventory_id: str
    inventory_name: str
    quantity: float
    unit: str

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: str  # exterior, interior, detailing, etc
    commission_rate: float = 0.0
    is_active: bool = True
    bom: Optional[List[dict]] = []  # Bill of Materials
    image_url: Optional[str] = None  # Service image URL

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    category: str
    commission_rate: float = 0.0
    bom: Optional[List[dict]] = []
    image_url: Optional[str] = None

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    category: Optional[str] = None
    commission_rate: Optional[float] = None
    is_active: Optional[bool] = None
    bom: Optional[List[dict]] = None
    image_url: Optional[str] = None

# Physical Products (for sale)
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: float
    category: str
    inventory_id: Optional[str] = None  # Link to inventory
    image_url: Optional[str] = None  # Product image
    min_stock_level: int = 5  # Alert threshold for low stock
    is_active: bool = True

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    inventory_id: Optional[str] = None
    image_url: Optional[str] = None
    min_stock_level: int = 5

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    inventory_id: Optional[str] = None
    is_active: Optional[bool] = None
    image_url: Optional[str] = None
    min_stock_level: Optional[int] = None

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    kasir_id: str
    kasir_name: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    shift_id: str
    items: List[dict]
    subtotal: float
    total: float
    payment_method: PaymentMethod
    payment_received: float
    change_amount: float
    cogs: float = 0.0
    gross_margin: float = 0.0
    total_commission: float = 0.0  # Total commission for this transaction
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    customer_id: Optional[str] = None
    items: List[dict]
    payment_method: PaymentMethod
    payment_received: float
    notes: Optional[str] = None

class Promotion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    description: Optional[str] = None
    promotion_type: PromotionType
    value: float
    min_purchase: float = 0
    max_discount: Optional[float] = None
    start_date: datetime
    end_date: datetime
    usage_limit: Optional[int] = None
    usage_count: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PromotionCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    promotion_type: PromotionType
    value: float
    min_purchase: float = 0
    max_discount: Optional[float] = None
    start_date: datetime
    end_date: datetime
    usage_limit: Optional[int] = None

class PromotionUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    promotion_type: Optional[PromotionType] = None
    value: Optional[float] = None
    min_purchase: Optional[float] = None
    max_discount: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    usage_limit: Optional[int] = None
    is_active: Optional[bool] = None

class ValidatePromoRequest(BaseModel):
    code: str
    subtotal: float

class NotificationService:
    @staticmethod
    async def send_whatsapp(phone: str, message: str):
        # In production this would call an API like Twilio or WA Gateway
        print(f"==========================================")
        print(f"SIMULATED WA SEND to {phone}:")
        print(f"{message}")
        print(f"==========================================")
        return True

class SendReceiptRequest(BaseModel):
    transaction_id: str
    phone: str


# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes - Authentication
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_dict = user_data.model_dump(exclude={'password'})
    
    # If outlet_id is provided, get outlet_name
    if user_dict.get('outlet_id'):
        outlet = await db.outlets.find_one({"id": user_dict['outlet_id']}, {"_id": 0})
        if outlet:
            user_dict['outlet_name'] = outlet['name']
    
    user = User(**user_dict)
    
    doc = user.model_dump()
    doc['password_hash'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    user_doc = await db.users.find_one({"username": login_data.username}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get('is_active', True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    user_doc.pop('password_hash', None)
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    token = create_token(user.id, user.role.value)
    
    return LoginResponse(token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Routes - Users
@api_router.get("/users/staff", response_model=List[dict])
async def get_staff_list(current_user: User = Depends(get_current_user)):
    # Allow all authenticated users to see staff list (for POS selection)
    users = await db.users.find(
        {"role": {"$in": [UserRole.TEKNISI, UserRole.MANAGER, UserRole.OWNER]}, "is_active": True}, 
        {"id": 1, "full_name": 1, "role": 1, "_id": 0}
    ).to_list(1000)
    return users

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: UserUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    filtered_data = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # If outlet_id is being updated, also update outlet_name
    if 'outlet_id' in filtered_data and filtered_data['outlet_id']:
        outlet = await db.outlets.find_one({"id": filtered_data['outlet_id']}, {"_id": 0})
        if outlet:
            filtered_data['outlet_name'] = outlet['name']
        else:
            filtered_data['outlet_name'] = None
    elif 'outlet_id' in filtered_data and filtered_data['outlet_id'] is None:
        filtered_data['outlet_name'] = None
    
    if filtered_data:
        await db.users.update_one({"id": user_id}, {"$set": filtered_data})
        user.update(filtered_data)
    
    user.pop('password_hash', None)
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return user

@api_router.post("/users/{user_id}/reset-password")
async def reset_user_password(user_id: str, password_data: PasswordReset, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash new password
    new_password_hash = hash_password(password_data.new_password)
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    return {"message": "Password reset successfully"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Only owner can delete users")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Check if user has open shifts
    open_shift = await db.shifts.find_one({"kasir_id": user_id, "status": "open"})
    if open_shift:
        raise HTTPException(status_code=400, detail="User has open shift. Please close shift first.")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deactivated successfully"}

# Routes - Outlets
@api_router.post("/outlets", response_model=Outlet)
async def create_outlet(outlet_data: OutletCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Only owner or manager can create outlets")
    outlet = Outlet(**outlet_data.model_dump())
    await db.outlets.insert_one(outlet.model_dump())
    return outlet

@api_router.get("/outlets", response_model=List[Outlet])
async def get_outlets(current_user: User = Depends(get_current_user)):
    outlets = await db.outlets.find({"is_active": True}, {"_id": 0}).to_list(100)
    return outlets

@api_router.get("/outlets/{outlet_id}", response_model=Outlet)
async def get_outlet(outlet_id: str, current_user: User = Depends(get_current_user)):
    outlet = await db.outlets.find_one({"id": outlet_id}, {"_id": 0})
    if not outlet:
        raise HTTPException(status_code=404, detail="Outlet not found")
    return outlet

@api_router.put("/outlets/{outlet_id}", response_model=Outlet)
async def update_outlet(outlet_id: str, outlet_data: OutletUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Only owner or manager can update outlets")
    
    update_data = {k: v for k, v in outlet_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.outlets.update_one({"id": outlet_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Outlet not found")
    
    outlet = await db.outlets.find_one({"id": outlet_id}, {"_id": 0})
    return outlet

@api_router.delete("/outlets/{outlet_id}")
async def delete_outlet(outlet_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Only owner can delete outlets")
    
    # Check if outlet has assigned users
    assigned_users = await db.users.count_documents({"outlet_id": outlet_id, "is_active": True})
    if assigned_users > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete outlet with {assigned_users} assigned users")
    
    result = await db.outlets.update_one({"id": outlet_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Outlet not found")
    
    return {"message": "Outlet deleted successfully"}

# Routes - Shifts
@api_router.post("/shifts/open", response_model=Shift)
async def open_shift(shift_data: ShiftOpen, current_user: User = Depends(get_current_user)):
    # Check if there's an open shift for this kasir
    existing = await db.shifts.find_one({"kasir_id": shift_data.kasir_id, "status": "open"}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Shift already open for this kasir")
    
    shift = Shift(
        kasir_id=shift_data.kasir_id,
        kasir_name=current_user.full_name,
        opening_balance=shift_data.opening_balance,
        opening_denominations=shift_data.denominations
    )
    
    doc = shift.model_dump()
    doc['opened_at'] = doc['opened_at'].isoformat()
    # Handle denominations nested model
    if doc.get('opening_denominations'):
        doc['opening_denominations'] = shift_data.denominations.model_dump()
    
    await db.shifts.insert_one(doc)
    return shift

@api_router.post("/shifts/petty-cash", response_model=PettyCashLog)
async def add_petty_cash(data: PettyCashCreate, current_user: User = Depends(get_current_user)):
    shift = await db.shifts.find_one({"id": data.shift_id}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    if shift['status'] != 'open':
        raise HTTPException(status_code=400, detail="Shift is closed")

    log = PettyCashLog(
        shift_id=data.shift_id,
        amount=data.amount,
        category=data.category,
        description=data.description,
        created_by_id=current_user.id,
        created_by_name=current_user.full_name
    )
    
    log_doc = log.model_dump()
    log_doc['created_at'] = log_doc['created_at'].isoformat()
    
    await db.petty_cash_logs.insert_one(log_doc)
    
    # Update shift totals
    field_to_update = "cash_drop_total" if data.category == "Cash Drop" else "petty_cash_total"
    await db.shifts.update_one(
        {"id": data.shift_id},
        {"$inc": {field_to_update: data.amount}}
    )
    
    return log

@api_router.post("/shifts/close", response_model=Shift)
async def close_shift(shift_data: ShiftClose, current_user: User = Depends(get_current_user)):
    shift_doc = await db.shifts.find_one({"id": shift_data.shift_id}, {"_id": 0})
    if not shift_doc:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    if shift_doc['status'] == 'closed':
        raise HTTPException(status_code=400, detail="Shift already closed")
    
    # Calculate expected balance
    transactions = await db.transactions.find({"shift_id": shift_data.shift_id}).to_list(1000)
    cash_transactions = [t for t in transactions if t.get('payment_method') == 'cash']
    total_cash_sales = sum(t.get('total', 0) for t in cash_transactions)
    
    # Get current petty cash and drop totals from DB (in case of race conditions, though simple increment was used)
    # We can trust shift_doc if we re-fetch or just use the values.
    # Actually, we should use the values from doc since we updated them incrementally.
    petty_cash = shift_doc.get('petty_cash_total', 0)
    cash_drop = shift_doc.get('cash_drop_total', 0)
    
    expected_balance = shift_doc['opening_balance'] + total_cash_sales - petty_cash - cash_drop
    variance = shift_data.closing_balance - expected_balance
    
    shift_doc['closing_balance'] = shift_data.closing_balance
    shift_doc['closing_denominations'] = shift_data.denominations.model_dump() if shift_data.denominations else None
    shift_doc['expected_balance'] = expected_balance
    shift_doc['variance'] = variance
    shift_doc['closed_at'] = datetime.now(timezone.utc).isoformat()
    shift_doc['status'] = 'closed'
    shift_doc['notes'] = shift_data.notes
    
    await db.shifts.update_one({"id": shift_data.shift_id}, {"$set": shift_doc})
    
    if isinstance(shift_doc.get('opened_at'), str):
        shift_doc['opened_at'] = datetime.fromisoformat(shift_doc['opened_at'])
    if isinstance(shift_doc.get('closed_at'), str):
        shift_doc['closed_at'] = datetime.fromisoformat(shift_doc['closed_at'])
    
    return Shift(**shift_doc)

@api_router.get("/shifts/{shift_id}/summary")
async def get_shift_summary(shift_id: str, current_user: User = Depends(get_current_user)):
    """Get shift summary before closing - shows transactions, revenue, and expected balance"""
    shift = await db.shifts.find_one({"id": shift_id}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    # Get all transactions for this shift
    transactions = await db.transactions.find({"shift_id": shift_id}).to_list(1000)
    
    # Calculate payment breakdown
    payment_breakdown = {
        "cash": 0,
        "card": 0,
        "qr": 0,
        "subscription": 0
    }
    
    total_revenue = 0
    for txn in transactions:
        payment_method = txn.get('payment_method', 'cash')
        amount = txn.get('total', 0)
        total_revenue += amount
        
        if payment_method in payment_breakdown:
            payment_breakdown[payment_method] += amount
    
    # Calculate expected balance (what should be in the drawer)
    # Expected = Opening + Cash Sales - Petty Cash - Cash Drop
    cash_sales = payment_breakdown.get('cash', 0)
    petty_cash = shift.get('petty_cash_total', 0)
    cash_drop = shift.get('cash_drop_total', 0)
    expected_balance = shift.get('opening_balance', 0) + cash_sales - petty_cash - cash_drop
    
    return {
        "transaction_count": len(transactions),
        "total_revenue": total_revenue,
        "payment_breakdown": payment_breakdown,
        "expected_balance": expected_balance,
        "cash_sales": cash_sales,
        "petty_cash_total": petty_cash,
        "cash_drop_total": cash_drop
    }

@api_router.get("/shifts/current/{kasir_id}")
async def get_current_shift(kasir_id: str, current_user: User = Depends(get_current_user)):
    shift = await db.shifts.find_one({"kasir_id": kasir_id, "status": "open"}, {"_id": 0})
    if not shift:
        return None
    
    if isinstance(shift.get('opened_at'), str):
        shift['opened_at'] = datetime.fromisoformat(shift['opened_at'])
    
    return shift

@api_router.get("/shifts", response_model=List[Shift])
async def get_shifts(current_user: User = Depends(get_current_user)):
    shifts = await db.shifts.find({}, {"_id": 0}).sort("opened_at", -1).to_list(100)
    for shift in shifts:
        if isinstance(shift.get('opened_at'), str):
            shift['opened_at'] = datetime.fromisoformat(shift['opened_at'])
        if isinstance(shift.get('closed_at'), str):
            shift['closed_at'] = datetime.fromisoformat(shift['closed_at'])
    return shifts

# Routes - Customers
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    customer = Customer(**customer_data.model_dump())
    doc = customer.model_dump()
    doc['join_date'] = doc['join_date'].isoformat()
    await db.customers.insert_one(doc)
    return customer

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: User = Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for customer in customers:
        if isinstance(customer.get('join_date'), str):
            customer['join_date'] = datetime.fromisoformat(customer['join_date'])
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if isinstance(customer.get('join_date'), str):
        customer['join_date'] = datetime.fromisoformat(customer['join_date'])
    return customer

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: CustomerUpdate, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = {k: v for k, v in customer_data.model_dump().items() if v is not None}
    if update_data:
        await db.customers.update_one({"id": customer_id}, {"$set": update_data})
        customer.update(update_data)
    
    if isinstance(customer.get('join_date'), str):
        customer['join_date'] = datetime.fromisoformat(customer['join_date'])
    
    return Customer(**customer)

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if customer has active memberships
    memberships = await db.memberships.find({"customer_id": customer_id}).to_list(10)
    active_memberships = [m for m in memberships if datetime.fromisoformat(m['end_date'] if isinstance(m['end_date'], str) else m['end_date'].isoformat()) >= datetime.now(timezone.utc)]
    
    if active_memberships:
        raise HTTPException(status_code=400, detail="Cannot delete customer with active memberships")
    
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {"message": "Customer deleted successfully"}

@api_router.get("/customers/{customer_id}/transactions")
async def get_customer_transactions(customer_id: str, current_user: User = Depends(get_current_user)):
    transactions = await db.transactions.find(
        {"customer_id": customer_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for t in transactions:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    
    return transactions

# Routes - Memberships
@api_router.post("/memberships", response_model=Membership)
async def create_membership(membership_data: MembershipCreate, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": membership_data.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Calculate end date based on membership type
    start_date = datetime.now(timezone.utc)
    days_map = {
        MembershipType.MONTHLY: 30,
        MembershipType.QUARTERLY: 90,
        MembershipType.BIANNUAL: 180,
        MembershipType.ANNUAL: 365,
        MembershipType.REGULAR: 0
    }
    
    days = days_map[membership_data.membership_type]
    end_date = start_date + timedelta(days=days) if days > 0 else start_date + timedelta(days=3650)  # 10 years for regular
    
    membership = Membership(
        customer_id=membership_data.customer_id,
        customer_name=customer['name'],
        membership_type=membership_data.membership_type,
        start_date=start_date,
        end_date=end_date,
        status=MembershipStatus.ACTIVE,
        price=membership_data.price
    )
    
    doc = membership.model_dump()
    doc['start_date'] = doc['start_date'].isoformat()
    doc['end_date'] = doc['end_date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.memberships.insert_one(doc)
    return membership

@api_router.get("/memberships", response_model=List[Membership])
async def get_memberships(current_user: User = Depends(get_current_user)):
    memberships = await db.memberships.find({}, {"_id": 0}).to_list(1000)
    now = datetime.now(timezone.utc)
    
    for membership in memberships:
        if isinstance(membership.get('start_date'), str):
            membership['start_date'] = datetime.fromisoformat(membership['start_date'])
        if isinstance(membership.get('end_date'), str):
            membership['end_date'] = datetime.fromisoformat(membership['end_date'])
        if isinstance(membership.get('created_at'), str):
            membership['created_at'] = datetime.fromisoformat(membership['created_at'])
        if isinstance(membership.get('last_used'), str):
            membership['last_used'] = datetime.fromisoformat(membership['last_used'])
        
        # Update status based on expiry
        if membership['end_date'] < now:
            membership['status'] = MembershipStatus.EXPIRED
        elif (membership['end_date'] - now).days <= 7:
            membership['status'] = MembershipStatus.EXPIRING_SOON
        else:
            membership['status'] = MembershipStatus.ACTIVE
    
    return memberships

@api_router.get("/memberships/{membership_id}")
async def get_membership_detail(membership_id: str, current_user: User = Depends(get_current_user)):
    membership = await db.memberships.find_one({"id": membership_id}, {"_id": 0})
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    # Get usage history
    usage_history = await db.membership_usage.find(
        {"membership_id": membership_id},
        {"_id": 0}
    ).sort("used_at", -1).to_list(1000)
    
    for usage in usage_history:
        if isinstance(usage.get('used_at'), str):
            usage['used_at'] = datetime.fromisoformat(usage['used_at'])
    
    # Convert dates
    if isinstance(membership.get('start_date'), str):
        membership['start_date'] = datetime.fromisoformat(membership['start_date'])
    if isinstance(membership.get('end_date'), str):
        membership['end_date'] = datetime.fromisoformat(membership['end_date'])
    if isinstance(membership.get('created_at'), str):
        membership['created_at'] = datetime.fromisoformat(membership['created_at'])
    if isinstance(membership.get('last_used'), str):
        membership['last_used'] = datetime.fromisoformat(membership['last_used'])
    
    # Update status
    now = datetime.now(timezone.utc)
    if membership['end_date'] < now:
        membership['status'] = MembershipStatus.EXPIRED
    elif (membership['end_date'] - now).days <= 7:
        membership['status'] = MembershipStatus.EXPIRING_SOON
    else:
        membership['status'] = MembershipStatus.ACTIVE
    
    membership['usage_history'] = usage_history
    membership['days_remaining'] = (membership['end_date'] - now).days if membership['end_date'] >= now else 0
    
    return membership

@api_router.put("/memberships/{membership_id}")
async def extend_membership(membership_id: str, days: int, current_user: User = Depends(get_current_user)):
    """Extend membership by X days"""
    membership = await db.memberships.find_one({"id": membership_id}, {"_id": 0})
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    end_date = datetime.fromisoformat(membership['end_date']) if isinstance(membership['end_date'], str) else membership['end_date']
    new_end_date = end_date + timedelta(days=days)
    
    await db.memberships.update_one(
        {"id": membership_id},
        {"$set": {"end_date": new_end_date.isoformat()}}
    )
    
    return {"message": f"Membership extended by {days} days", "new_end_date": new_end_date.isoformat()}

@api_router.delete("/memberships/{membership_id}")
async def delete_membership(membership_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.memberships.delete_one({"id": membership_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    # Also delete usage history
    await db.membership_usage.delete_many({"membership_id": membership_id})
    
    return {"message": "Membership deleted successfully"}

@api_router.post("/memberships/use")
async def record_membership_usage(usage_data: MembershipUsage, current_user: User = Depends(get_current_user)):
    # Find customer by phone
    customer = await db.customers.find_one({"phone": usage_data.phone}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Nomor telepon tidak terdaftar")
    
    # Find active membership
    now = datetime.now(timezone.utc)
    memberships = await db.memberships.find(
        {"customer_id": customer['id']},
        {"_id": 0}
    ).to_list(100)
    
    active_membership = None
    for m in memberships:
        end_date = datetime.fromisoformat(m['end_date']) if isinstance(m['end_date'], str) else m['end_date']
        if end_date >= now and m['membership_type'] != 'regular':
            active_membership = m
            break
    
    if not active_membership:
        raise HTTPException(status_code=400, detail="Tidak ada membership All You Can Wash yang aktif")
    
    # Check if already used today
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_usage = await db.membership_usage.find_one({
        "membership_id": active_membership['id'],
        "used_at": {"$gte": today_start.isoformat()}
    })
    
    if today_usage:
        raise HTTPException(status_code=400, detail="Membership sudah digunakan hari ini. Limit 1x per hari.")
    
    # Get service info
    service = await db.services.find_one({"id": usage_data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Record usage
    usage_record = {
        "id": str(uuid.uuid4()),
        "membership_id": active_membership['id'],
        "customer_id": customer['id'],
        "customer_name": customer['name'],
        "service_id": service['id'],
        "service_name": service['name'],
        "kasir_id": current_user.id,
        "kasir_name": current_user.full_name,
        "used_at": now.isoformat()
    }
    
    await db.membership_usage.insert_one(usage_record)
    
    # Update membership usage count and last_used
    await db.memberships.update_one(
        {"id": active_membership['id']},
        {
            "$inc": {"usage_count": 1},
            "$set": {"last_used": now.isoformat()}
        }
    )
    
    # Deduct inventory if service has BOM
    if service.get('bom') and len(service['bom']) > 0:
        for bom_item in service['bom']:
            await db.inventory.update_one(
                {"id": bom_item['inventory_id']},
                {"$inc": {"current_stock": -bom_item['quantity']}}
            )
    
    end_date_obj = datetime.fromisoformat(active_membership['end_date']) if isinstance(active_membership['end_date'], str) else active_membership['end_date']
    
    return {
        "message": "Pencatatan berhasil!",
        "customer_name": customer['name'],
        "service_name": service['name'],
        "membership_type": active_membership['membership_type'],
        "remaining_days": (end_date_obj - now).days,
        "usage_count": active_membership['usage_count'] + 1
    }

# Routes - Services
@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: User = Depends(get_current_user)):
    service = Service(**service_data.model_dump())
    doc = service.model_dump()
    await db.services.insert_one(doc)
    return service

@api_router.get("/services", response_model=List[Service])
async def get_services(current_user: User = Depends(get_current_user)):
    services = await db.services.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return services

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str, current_user: User = Depends(get_current_user)):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service_data: ServiceUpdate, current_user: User = Depends(get_current_user)):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    update_data = {k: v for k, v in service_data.model_dump().items() if v is not None}
    if update_data:
        await db.services.update_one({"id": service_id}, {"$set": update_data})
        service.update(update_data)
    
    return Service(**service)

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Soft delete by setting is_active to False
    await db.services.update_one({"id": service_id}, {"$set": {"is_active": False}})
    
    return {"message": "Service deactivated successfully"}

# Routes - Products
@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    await db.products.insert_one(doc)
    return product

@api_router.get("/products")
async def get_products(current_user: User = Depends(get_current_user)):
    products = await db.products.find({"is_active": True}, {"_id": 0}).to_list(1000)
    # Add stock info from inventory
    for product in products:
        if product.get('inventory_id'):
            inventory_item = await db.inventory.find_one({"id": product['inventory_id']}, {"_id": 0})
            if inventory_item:
                product['stock'] = inventory_item.get('current_stock', 0)
                product['unit'] = inventory_item.get('unit', 'pcs')
            else:
                product['stock'] = None
                product['unit'] = None
        else:
            product['stock'] = None
            product['unit'] = None
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
        product.update(update_data)
    
    return Product(**product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Only owner or manager can delete products")
    
    result = await db.products.update_one({"id": product_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}

# Routes - Inventory
@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(item_data: InventoryItemCreate, current_user: User = Depends(get_current_user)):
    item = InventoryItem(**item_data.model_dump())
    doc = item.model_dump()
    await db.inventory.insert_one(doc)
    return item

@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory(current_user: User = Depends(get_current_user)):
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item.get('last_purchase_date'), str):
            item['last_purchase_date'] = datetime.fromisoformat(item['last_purchase_date'])
    return items

@api_router.get("/inventory/low-stock")
async def get_low_stock(current_user: User = Depends(get_current_user)):
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    low_stock = [item for item in items if item['current_stock'] <= item['min_stock']]
    return low_stock

@api_router.get("/inventory/{item_id}", response_model=InventoryItem)
async def get_inventory_item(item_id: str, current_user: User = Depends(get_current_user)):
    item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if isinstance(item.get('last_purchase_date'), str):
        item['last_purchase_date'] = datetime.fromisoformat(item['last_purchase_date'])
    return item

@api_router.put("/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory_item(item_id: str, item_data: InventoryItemUpdate, current_user: User = Depends(get_current_user)):
    item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = {k: v for k, v in item_data.model_dump().items() if v is not None}
    if update_data:
        await db.inventory.update_one({"id": item_id}, {"$set": update_data})
        item.update(update_data)
    
    if isinstance(item.get('last_purchase_date'), str):
        item['last_purchase_date'] = datetime.fromisoformat(item['last_purchase_date'])
    
    return InventoryItem(**item)

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, current_user: User = Depends(get_current_user)):
    result = await db.inventory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

@api_router.post("/inventory/{item_id}/adjust")
async def adjust_stock(
    item_id: str, 
    adjustment: StockAdjustmentRequest, 
    current_user: User = Depends(get_current_user)
):
    item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    previous_stock = item['current_stock']
    change = adjustment.amount if adjustment.type == 'add' else -adjustment.amount
    new_stock = previous_stock + change
    
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")
        
    # Update item
    await db.inventory.update_one(
        {"id": item_id},
        {"$set": {"current_stock": new_stock}}
    )
    
    # Create Log
    log = InventoryLog(
        inventory_id=item_id,
        inventory_name=item['name'],
        change_amount=change,
        previous_stock=previous_stock,
        new_stock=new_stock,
        reason=adjustment.reason,
        user_id=current_user.id,
        user_name=current_user.full_name
    )
    
    doc = log.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.inventory_logs.insert_one(doc)
    
    return {"message": "Stock adjusted successfully", "new_stock": new_stock}


# Routes - Transactions
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate, current_user: User = Depends(get_current_user)):
    # Get current shift
    shift = await db.shifts.find_one({"kasir_id": current_user.id, "status": "open"}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=400, detail="No open shift. Please open a shift first.")
    
    # Calculate totals
    subtotal = sum(item['price'] * item['quantity'] for item in transaction_data.items)
    total = subtotal
    change_amount = transaction_data.payment_received - total
    
    if change_amount < 0:
        raise HTTPException(status_code=400, detail="Payment received is less than total")
    
    # Get customer name if customer_id provided
    customer_name = None
    if transaction_data.customer_id:
        customer = await db.customers.find_one({"id": transaction_data.customer_id}, {"_id": 0})
        if customer:
            customer_name = customer['name']
    
    # Calculate Commission
    total_commission = 0.0
    items_with_commission = []
    
    for item in transaction_data.items:
        commission_amount = 0.0
        
        # If item has a service_id and a technician_id is provided in the item (needs updatting frontend/transactioncreate model)
        # Assuming frontend sends: {..., "technician_id": "uuid", "technician_name": "Name"} for services
        
        # Check if service
        if item.get('service_id'):
            # Fetch service to get commission rate
            service_item = await db.services.find_one({"id": item['service_id']}, {"_id": 0})
            if service_item and service_item.get('commission_rate', 0) > 0:
                # Calculate commission: Price * Rate / 100 * Quantity
                # Note: Commission should probably be based on Price AFTER discount? 
                # For now let's base on Item Price * Quantity. 
                # If transaction has global discount, this might be standardized. 
                # Let's effectively use item price.
                
                commission_amount = (item['price'] * item['quantity']) * (service_item['commission_rate'] / 100)
        
        # Add commission data to the item dict if valid
        item['commission_amount'] = commission_amount
        if commission_amount > 0:
            total_commission += commission_amount
            
        items_with_commission.append(item)
    
    # Generate invoice number
    today = datetime.now(timezone.utc)
    invoice_prefix = today.strftime("%Y%m%d")
    last_invoice = await db.transactions.find_one(
        {"invoice_number": {"$regex": f"^INV-{invoice_prefix}"}},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    if last_invoice:
        last_num = int(last_invoice['invoice_number'].split('-')[-1])
        invoice_number = f"INV-{invoice_prefix}-{str(last_num + 1).zfill(4)}"
    else:
        invoice_number = f"INV-{invoice_prefix}-0001"
    
    transaction = Transaction(
        invoice_number=invoice_number,
        kasir_id=current_user.id,
        kasir_name=current_user.full_name,
        customer_id=transaction_data.customer_id,
        customer_name=customer_name,
        shift_id=shift['id'],
        items=items_with_commission,
        subtotal=subtotal,
        total=total,
        payment_method=transaction_data.payment_method,
        payment_received=transaction_data.payment_received,
        change_amount=change_amount,
        total_commission=total_commission,
        notes=transaction_data.notes
    )
    
    doc = transaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.transactions.insert_one(doc)
    
    # Update customer stats if customer_id provided
    if transaction_data.customer_id:
        await db.customers.update_one(
            {"id": transaction_data.customer_id},
            {"$inc": {"total_visits": 1, "total_spending": total}}
        )
    
    # Deduct inventory based on items
    for item in transaction_data.items:
        # Check if it's a service with BOM
        if item.get('service_id'):
            service = await db.services.find_one({"id": item['service_id']}, {"_id": 0})
            if service and service.get('bom') and len(service['bom']) > 0:
                for bom_item in service['bom']:
                    quantity_to_deduct = bom_item['quantity'] * item['quantity']
                    await db.inventory.update_one(
                        {"id": bom_item['inventory_id']},
                        {"$inc": {"current_stock": -quantity_to_deduct}}
                    )
        
        # Check if it's a product linked to inventory
        elif item.get('product_id'):
            product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
            if product and product.get('inventory_id'):
                await db.inventory.update_one(
                    {"id": product['inventory_id']},
                    {"$inc": {"current_stock": -item['quantity']}}
                )
    
    return transaction

@api_router.get("/transactions")
async def get_transactions(current_user: User = Depends(get_current_user)):
    # Kasir only see their own transactions
    if current_user.role == UserRole.KASIR:
        query = {"kasir_id": current_user.id}
    else:
        # Owner, Manager, Teknisi can see all
        query = {}
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for transaction in transactions:
        if isinstance(transaction.get('created_at'), str):
            transaction['created_at'] = datetime.fromisoformat(transaction['created_at'])
    return transactions

@api_router.get("/transactions/today")
async def get_today_transactions(current_user: User = Depends(get_current_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Kasir only see their own transactions
    if current_user.role == UserRole.KASIR:
        query = {"created_at": {"$gte": today_start.isoformat()}, "kasir_id": current_user.id}
    else:
        query = {"created_at": {"$gte": today_start.isoformat()}}
    
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(1000)
    
    for transaction in transactions:
        if isinstance(transaction.get('created_at'), str):
            transaction['created_at'] = datetime.fromisoformat(transaction['created_at'])
    
    return transactions

@api_router.get("/transactions/{transaction_id}")
async def get_transaction_detail(transaction_id: str, current_user: User = Depends(get_current_user)):
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Kasir can only see their own transaction
    if current_user.role == UserRole.KASIR and transaction['kasir_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this transaction")
    
    if isinstance(transaction.get('created_at'), str):
        transaction['created_at'] = datetime.fromisoformat(transaction['created_at'])
    
    return transaction

# Routes - Dashboard
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Today's transactions
    today_transactions = await db.transactions.find(
        {"created_at": {"$gte": today_start.isoformat()}}
    ).to_list(1000)
    
    today_revenue = sum(t.get('total', 0) for t in today_transactions)
    today_count = len(today_transactions)
    
    # Active memberships
    now = datetime.now(timezone.utc)
    all_memberships = await db.memberships.find({}, {"_id": 0}).to_list(1000)
    active_count = 0
    expiring_count = 0
    
    for m in all_memberships:
        end_date = datetime.fromisoformat(m['end_date']) if isinstance(m['end_date'], str) else m['end_date']
        if end_date >= now:
            active_count += 1
            if (end_date - now).days <= 7:
                expiring_count += 1
    
    # Low stock items
    low_stock_items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    low_stock_count = sum(1 for item in low_stock_items if item['current_stock'] <= item['min_stock'])
    
    # Kasir performance today
    kasir_performance = {}
    for t in today_transactions:
        kasir_name = t.get('kasir_name', 'Unknown')
        if kasir_name not in kasir_performance:
            kasir_performance[kasir_name] = {'count': 0, 'revenue': 0}
        kasir_performance[kasir_name]['count'] += 1
        kasir_performance[kasir_name]['revenue'] += t.get('total', 0)
    
    return {
        "today_revenue": today_revenue,
        "today_transactions": today_count,
        "active_memberships": active_count,
        "expiring_memberships": expiring_count,
        "low_stock_items": low_stock_count,
        "kasir_performance": kasir_performance
    }

# Public Routes (No Authentication Required)
@api_router.post("/public/check-membership")
async def check_membership_public(phone: str):
    """Public endpoint untuk customer cek membership mereka"""
    customer = await db.customers.find_one({"phone": phone}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Nomor telepon tidak ditemukan")
    
    # Get memberships for this customer
    memberships = await db.memberships.find({"customer_id": customer['id']}, {"_id": 0}).to_list(100)
    
    now = datetime.now(timezone.utc)
    result_memberships = []
    
    for m in memberships:
        if isinstance(m.get('start_date'), str):
            m['start_date'] = datetime.fromisoformat(m['start_date'])
        if isinstance(m.get('end_date'), str):
            m['end_date'] = datetime.fromisoformat(m['end_date'])
        if isinstance(m.get('created_at'), str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
        if isinstance(m.get('last_used'), str):
            m['last_used'] = datetime.fromisoformat(m['last_used'])
        
        # Update status
        if m['end_date'] < now:
            m['status'] = MembershipStatus.EXPIRED
        elif (m['end_date'] - now).days <= 7:
            m['status'] = MembershipStatus.EXPIRING_SOON
        else:
            m['status'] = MembershipStatus.ACTIVE
        
        # Calculate days remaining
        days_remaining = (m['end_date'] - now).days
        m['days_remaining'] = days_remaining if days_remaining > 0 else 0
        
        result_memberships.append(m)
    
    return {
        "customer": customer,
        "memberships": result_memberships
    }

@api_router.get("/public/services")
async def get_public_services():
    """Public endpoint untuk menampilkan services di landing page"""
    services = await db.services.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return services

# Routes - Promotions
@api_router.get("/promotions", response_model=List[Promotion])
async def get_promotions(current_user: User = Depends(get_current_user)):
    promotions = await db.promotions.find({}, {"_id": 0}).to_list(1000)
    # Convert dates
    for p in promotions:
        if isinstance(p.get('start_date'), str):
            p['start_date'] = datetime.fromisoformat(p['start_date'])
        if isinstance(p.get('end_date'), str):
            p['end_date'] = datetime.fromisoformat(p['end_date'])
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return promotions

@api_router.post("/promotions", response_model=Promotion)
async def create_promotion(promo_data: PromotionCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check duplicate code
    existing = await db.promotions.find_one({"code": promo_data.code, "is_active": True}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Promotion code already exists")
    
    promo = Promotion(**promo_data.model_dump())
    
    doc = promo.model_dump()
    doc['start_date'] = doc['start_date'].isoformat()
    doc['end_date'] = doc['end_date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.promotions.insert_one(doc)
    return promo

@api_router.put("/promotions/{promo_id}")
async def update_promotion(promo_id: str, update_data: PromotionUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    promo = await db.promotions.find_one({"id": promo_id}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
        
    filtered_data = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if 'code' in filtered_data:
        existing = await db.promotions.find_one({"code": filtered_data['code'], "id": {"$ne": promo_id}, "is_active": True})
        if existing:
            raise HTTPException(status_code=400, detail="Promotion code already in use")
            
    if 'start_date' in filtered_data:
        filtered_data['start_date'] = filtered_data['start_date'].isoformat()
    if 'end_date' in filtered_data:
        filtered_data['end_date'] = filtered_data['end_date'].isoformat()
        
    await db.promotions.update_one({"id": promo_id}, {"$set": filtered_data})
    
    return {"message": "Promotion updated successfully"}

@api_router.delete("/promotions/{promo_id}")
async def delete_promotion(promo_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.promotions.delete_one({"id": promo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promotion not found")
        
    return {"message": "Promotion deleted successfully"}

@api_router.post("/promotions/validate")
async def validate_promotion(request: ValidatePromoRequest, current_user: User = Depends(get_current_user)):
    code = request.code
    subtotal = request.subtotal
    
    promo = await db.promotions.find_one({"code": code, "is_active": True}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=404, detail="Invalid promotion code")
        
    # Check expiry
    start_date = datetime.fromisoformat(promo['start_date']) if isinstance(promo['start_date'], str) else promo['start_date']
    end_date = datetime.fromisoformat(promo['end_date']) if isinstance(promo['end_date'], str) else promo['end_date']
    
    # Fix: Ensure comparison works. 
    # Use timezone.utc if dates are aware, or naive if naive. 
    # Since we store as isoformat from datetime.now(timezone.utc), they are offset-aware if parsed correct.
    # fromisoformat handles offsets.
    
    now_utc = datetime.now(timezone.utc)
    
    # Ensure start_date/end_date are aware
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)
    
    if now_utc < start_date:
        raise HTTPException(status_code=400, detail="Promotion has not started yet")
    if now_utc > end_date:
        raise HTTPException(status_code=400, detail="Promotion expired")
        
    # Check limit
    if promo.get('usage_limit') is not None and promo['usage_count'] >= promo['usage_limit']:
        raise HTTPException(status_code=400, detail="Promotion usage limit reached")
        
    # Check min purchase
    if subtotal < promo['min_purchase']:
        raise HTTPException(status_code=400, detail=f"Minimum purchase Rp {promo['min_purchase']} required")
        
    # Calculate discount
    discount_amount = 0
    if promo['promotion_type'] == PromotionType.FIXED_AMOUNT:
        discount_amount = promo['value']
    else:
        discount_amount = (promo['value'] / 100) * subtotal
        if promo.get('max_discount'):
             discount_amount = min(discount_amount, promo['max_discount'])
             
    # Cap at subtotal
    discount_amount = min(discount_amount, subtotal)
    
    return {
        "valid": True,
        "promo": promo,
        "discount_amount": discount_amount
    }

# Include router
# Routes - Notifications (WhatsApp)
@api_router.post("/notifications/send-receipt")
async def send_receipt_notification(request: SendReceiptRequest, current_user: User = Depends(get_current_user)):
    transaction = await db.transactions.find_one({"id": request.transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Format message
    items_str = "\n".join([f"- {item.get('name', 'Item')} x{item['quantity']}" for item in transaction['items']])
    message = f"""*OTOPIA Car Wash*
Invoice: {transaction['invoice_number']}
Tanggal: {transaction['created_at'].strftime('%d/%m/%Y %H:%M') if isinstance(transaction['created_at'], datetime) else transaction['created_at']}

Detail:
{items_str}

Total: Rp {transaction['total']:,}
Metode: {transaction['payment_method']}

Terima kasih atas kunjungan Anda!"""

    await NotificationService.send_whatsapp(request.phone, message)
    return {"message": "Receipt sent to WhatsApp"}

@api_router.post("/notifications/check-expiring")
async def check_expiring_memberships_notification(current_user: User = Depends(get_current_user)):
    # Find memberships expiring in exactly 3 days
    now = datetime.now(timezone.utc)
    target_date = now + timedelta(days=3)
    start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999)
    
    # This query is simplified; in reality stored dates might be strings or objects
    # Assuming ISO format strings for simplicity based on previous code
    
    memberships = await db.memberships.find({
        "status": "active",
        "end_date": {"$gte": start_of_day.isoformat(), "$lte": end_of_day.isoformat()}
    }).to_list(100)
    
    count = 0
    for m in memberships:
        customer = await db.customers.find_one({"id": m['customer_id']}, {"_id": 0})
        if customer and customer.get('phone'):
            msg = f"Halo {customer['name']}, Membership {m['membership_type']} Anda di OTOPIA akan berakhir pada {m['end_date']}. Segera perpanjang!"
            await NotificationService.send_whatsapp(customer['phone'], msg)
            count += 1
            
    return {"message": f"Sent {count} reminders"}

# Expenses Endpoints
@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    expenses = await db.expenses.find().sort("date", -1).to_list(1000)
    for expense in expenses:
        if isinstance(expense.get('date'), str):
            expense['date'] = datetime.fromisoformat(expense['date'])
    return expenses

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense: Expense, current_user: User = Depends(get_current_user)):
    doc = expense.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_by'] = current_user.full_name
    await db.expenses.insert_one(doc)
    return expense

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: User = Depends(get_current_user)):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"status": "success"}

# Routes - Commission Payouts
@api_router.get("/payouts", response_model=List[CommissionPayout])
async def get_payouts():
    payouts = await db.payouts.find().sort("date", -1).to_list(1000)
    for p in payouts:
        if isinstance(p.get('date'), str):
            p['date'] = datetime.fromisoformat(p['date'])
    return payouts

@api_router.post("/payouts", response_model=CommissionPayout)
async def create_payout(payout: CommissionPayout, current_user: User = Depends(get_current_user)):
    doc = payout.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_by'] = current_user.full_name
    
    # Store as payout record
    await db.payouts.insert_one(doc)
    
    # Also log as an Operational Expense automatically? 
    # Decision: Optional. For now let's keep them separate to avoid double counting if P&L aggregates both.
    # But usually Payout IS an expense (`Gaji/Komisi`). 
    # Let's auto-create an Expense entry for P&L visibility.
    
    expense = Expense(
        category="Gaji & Komisi",
        amount=payout.amount,
        description=f"Commission Payout for {payout.user_id} - {payout.notes or ''}",
        created_by=current_user.full_name,
        date=payout.date
    )
    exp_doc = expense.model_dump()
    exp_doc['date'] = exp_doc['date'].isoformat()
    await db.expenses.insert_one(exp_doc)
    
    return payout

# Routes - Landing Page CMS
class LandingPageConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "default"  # Singleton
    hero_title_1: str = "Experience the"
    hero_title_2: str = "Ultimate Shine"
    hero_subtitle: str = "Premium car wash & auto detailing service di Semarang. Teknologi Nano Ceramic Coating terbaru untuk perlindungan maksimal kendaraan Anda."
    open_hours: str = "08:00 - 18:00"
    contact_phone: str = "0822-2702-5335"
    contact_address: str = "Jl. Sukun Raya No.47C, Banyumanik, Semarang"
    contact_maps_url: str = "https://maps.google.com/?q=OTOPIA+Semarang+Jl.+Sukun+Raya+No.47C"
    contact_instagram: str = "@otopia.semarang"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.get("/public/landing-config", response_model=LandingPageConfig)
async def get_landing_config():
    config = await db.landing_config.find_one({"id": "default"}, {"_id": 0})
    if not config:
        # Return default defaults if not found
        return LandingPageConfig()
    return config

@api_router.put("/landing-config", response_model=LandingPageConfig)
async def update_landing_config(config_data: LandingPageConfig, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    config_dict = config_data.model_dump()
    config_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.landing_config.update_one(
        {"id": "default"},
        {"$set": config_dict},
        upsert=True
    )
    
    return config_data

# ============================================
# WhatsApp Endpoints
# ============================================

@api_router.get("/whatsapp/status")
async def get_whatsapp_status(current_user: User = Depends(get_current_user)):
    """Get WhatsApp service connection status"""
    try:
        status = whatsapp.get_status()
        return status
    except Exception as e:
        return {
            "status": "error",
            "whatsapp_ready": False,
            "error": str(e)
        }

@api_router.post("/whatsapp/send-test")
async def send_test_whatsapp(
    phone: str,
    message: str = "Test message from OTOPIA Car Wash POS",
    current_user: User = Depends(get_current_user)
):
    """Send test WhatsApp message"""
    if current_user.role not in ['owner', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        result = whatsapp.send_message(phone, message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Duplicate return statement issue (line 1877), keeping only the latest config_data return
# Removed: return {"message": f"Sent reminders to {count} customers"}

# ============================================
# Notifications Endpoints
# ============================================

class SendReceiptRequest(BaseModel):
    transaction_id: str
    phone: str

@api_router.post("/notifications/send-receipt")
async def send_receipt_notification(
    request: SendReceiptRequest,
    current_user: User = Depends(get_current_user)
):
    """Send WhatsApp receipt for a transaction"""
    try:
        # Get transaction details
        transaction = await db.transactions.find_one({"id": request.transaction_id}, {"_id": 0})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Prepare items for receipt
        receipt_items = []
        for item in transaction.get('items', []):
            receipt_items.append({
                'name': item.get('service_name', 'Unknown'),
                'quantity': item.get('quantity', 1),
                'price': item.get('price', 0)
            })
        
        # Send via WhatsApp
        result = whatsapp.send_receipt(
            phone=request.phone,
            transaction=transaction,
            items=receipt_items
        )
        
        if result.get('success'):
            return {"success": True, "message": f"Receipt sent to {request.phone}"}
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Failed to send WhatsApp'))
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to send receipt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/shifts/{shift_id}/details")
async def get_shift_details(shift_id: str, current_user: User = Depends(get_current_user)):
    shift = await db.shifts.find_one({"id": shift_id}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    # Get time range
    start_time = shift['opened_at']
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time)
        
    end_time = shift.get('closed_at')
    if end_time:
        if isinstance(end_time, str):
            end_time = datetime.fromisoformat(end_time)
    else:
        end_time = datetime.now(timezone.utc)
        
    # Query transactions
    transactions = await db.transactions.find({
        "created_at": {
            "$gte": start_time.isoformat() if isinstance(start_time, datetime) else start_time,
            "$lte": end_time.isoformat() if isinstance(end_time, datetime) else end_time
        }
    }, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Calculate summary from actual transactions
    total_revenue = 0
    payment_methods = {}
    
    for t in transactions:
        # Convert date for response
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
            
        total_revenue += t.get('total', 0)
        method = t.get('payment_method', 'unknown')
        payment_methods[method] = payment_methods.get(method, 0) + t.get('total', 0)
        
    return {
        "shift": shift,
        "transactions": transactions,
        "summary": {
            "total_revenue": total_revenue,
            "transaction_count": len(transactions),
            "payment_methods": payment_methods
        }
    }

app.include_router(api_router)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == '__main__':
    import uvicorn
    print(' Starting OTOPIA Car Wash Backend...')
    uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')
