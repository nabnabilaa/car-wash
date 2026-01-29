import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os
from datetime import datetime, timezone, timedelta
import uuid
import random

from dotenv import load_dotenv
from pathlib import Path

# Load .env file
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'carwash_db')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_data():
    print("🌱 Starting comprehensive data seeding...")
    print("=" * 60)
    
    # ========================================
    # 1. OUTLETS
    # ========================================
    print("\n📍 Seeding Outlets...")
    outlets = [
        {
            "id": str(uuid.uuid4()),
            "name": "OTOPIA Car Wash - Sudirman",
            "address": "Jl. Sudirman No. 123, Jakarta Pusat",
            "phone": "021-12345678",
            "manager_name": "Budi Santoso",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "OTOPIA Car Wash - Kuningan",
            "address": "Jl. HR Rasuna Said Kav. 1, Jakarta Selatan",
            "phone": "021-87654321",
            "manager_name": "Siti Rahayu",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    existing_outlets = await db.outlets.count_documents({})
    if existing_outlets == 0:
        await db.outlets.insert_many(outlets)
        print(f"✅ {len(outlets)} outlets created")
        outlet_sudirman_id = outlets[0]["id"]
        outlet_kuningan_id = outlets[1]["id"]
    else:
        print("ℹ️  Outlets already exist")
        outlet_sudirman_id = (await db.outlets.find_one({"name": {"$regex": "Sudirman"}}))["id"]
        outlet_kuningan_id = (await db.outlets.find_one({"name": {"$regex": "Kuningan"}}))["id"]
    
    # ========================================
    # 2. USERS
    # ========================================
    print("\n👥 Seeding Users...")
    
    # Admin user
    existing_admin = await db.users.find_one({"username": "admin"})
    if not existing_admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password_hash": hash_password("admin123"),
            "full_name": "Admin Owner",
            "email": "admin@otopia.com",
            "role": "owner",
            "phone": "081234567890",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        print("✅ Admin user created (admin / admin123)")
        admin_id = admin_user["id"]
    else:
        print("ℹ️  Admin user already exists")
        admin_id = existing_admin["id"]
    
    # Sample users
    kasir_users = [
        {
            "id": str(uuid.uuid4()),
            "username": "kasir1",
            "password_hash": hash_password("kasir123"),
            "full_name": "Budi Santoso",
            "role": "kasir",
            "phone": "081234567891",
            "email": "budi@otopia.com",
            "outlet_id": outlet_sudirman_id,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "username": "kasir2",
            "password_hash": hash_password("kasir123"),
            "full_name": "Siti Rahayu",
            "role": "kasir",
            "phone": "081234567892",
            "email": "siti@otopia.com",
            "outlet_id": outlet_kuningan_id,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "username": "manager1",
            "password_hash": hash_password("manager123"),
            "full_name": "Andi Wijaya",
            "role": "manager",
            "phone": "081234567893",
            "email": "andi@otopia.com",
            "outlet_id": outlet_sudirman_id,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    kasir1_id = None
    for kasir in kasir_users:
        existing = await db.users.find_one({"username": kasir["username"]})
        if not existing:
            await db.users.insert_one(kasir)
            if kasir["username"] == "kasir1":
                kasir1_id = kasir["id"]
            print(f"✅ User created: {kasir['username']} ({kasir['role']})")
        else:
            if kasir["username"] == "kasir1":
                kasir1_id = existing["id"]
    
    if not kasir1_id:
        kasir1_id = (await db.users.find_one({"username": "kasir1"}))["id"]
    
    # ========================================
    # 3. INVENTORY
    # ========================================
    print("\n📦 Seeding Inventory...")
    inventory_items = [
        {
            "id": str(uuid.uuid4()),
            "sku": "CHEM-001",
            "name": "Car Shampoo Premium",
            "category": "chemicals",
            "unit": "liter",
            "current_stock": 50,
            "min_stock": 10,
            "max_stock": 100,
            "unit_cost": 25000,
            "supplier": "PT Kimia Otomotif",
            "description": "Shampoo mobil dengan formula pH balanced"
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "CHEM-002",
            "name": "Wax Premium",
            "category": "chemicals",
            "unit": "liter",
            "current_stock": 30,
            "min_stock": 5,
            "max_stock": 50,
            "unit_cost": 75000,
            "supplier": "PT Kimia Otomotif",
            "description": "Wax untuk hasil kilap maksimal"
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "CHEM-003",
            "name": "Tire Black",
            "category": "chemicals",
            "unit": "liter",
            "current_stock": 8,  # LOW STOCK!
            "min_stock": 10,
            "max_stock": 30,
            "unit_cost": 35000,
            "supplier": "PT Kimia Otomotif",
            "description": "Semir ban untuk tampilan ban hitam pekat"
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "CHEM-004",
            "name": "Interior Cleaner",
            "category": "chemicals",
            "unit": "liter",
            "current_stock": 25,
            "min_stock": 8,
            "max_stock": 40,
            "unit_cost": 45000,
            "supplier": "PT Kimia Otomotif",
            "description": "Pembersih interior jok dan dashboard"
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "SUPP-001",
            "name": "Microfiber Towel",
            "category": "supplies",
            "unit": "pcs",
            "current_stock": 100,
            "min_stock": 20,
            "max_stock": 200,
            "unit_cost": 15000,
            "supplier": "CV Tekstil Jaya",
            "description": "Lap microfiber kualitas premium"
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "SUPP-002",
            "name": "Sponge Wash",
            "category": "supplies",
            "unit": "pcs",
            "current_stock": 50,
            "min_stock": 10,
            "max_stock": 100,
            "unit_cost": 8000,
            "supplier": "CV Tekstil Jaya",
            "description": "Spons cuci mobil premium"
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "SUPP-003",
            "name": "Brush Detailing",
            "category": "supplies",
            "unit": "pcs",
            "current_stock": 15,
            "min_stock": 5,
            "max_stock": 30,
            "unit_cost": 25000,
            "supplier": "CV Tekstil Jaya",
            "description": "Sikat detail untuk sela-sela mobil"
        }
    ]
    
    # Check and insert inventory items one by one
    shampoo_id = None
    wax_id = None
    tire_black_id = None
    interior_cleaner_id = None
    microfiber_id = None
    
    for item in inventory_items:
        existing = await db.inventory.find_one({"sku": item["sku"]})
        if not existing:
            await db.inventory.insert_one(item)
            print(f"✅ Inventory item created: {item['name']}")
            # Save IDs
            if item["sku"] == "CHEM-001":
                shampoo_id = item["id"]
            elif item["sku"] == "CHEM-002":
                wax_id = item["id"]
            elif item["sku"] == "CHEM-003":
                tire_black_id = item["id"]
            elif item["sku"] == "CHEM-004":
                interior_cleaner_id = item["id"]
            elif item["sku"] == "SUPP-001":
                microfiber_id = item["id"]
        else:
            # Use existing IDs
            if item["sku"] == "CHEM-001":
                shampoo_id = existing["id"]
            elif item["sku"] == "CHEM-002":
                wax_id = existing["id"]
            elif item["sku"] == "CHEM-003":
                tire_black_id = existing["id"]
            elif item["sku"] == "CHEM-004":
                interior_cleaner_id = existing["id"]
            elif item["sku"] == "SUPP-001":
                microfiber_id = existing["id"]
    
    print(f"✅ Inventory ready ({len(inventory_items)} items total)")
    
    # ========================================
    # 4. SERVICES
    # ========================================
    print("\n🧼 Seeding Services...")
    services = [
        {
            "id": str(uuid.uuid4()),
            "name": "Cuci Eksterior Small",
            "description": "Cuci body eksterior untuk mobil small (sedan, hatchback)",
            "price": 35000,
            "duration_minutes": 20,
            "category": "exterior",
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400",
            "bom": [
                {"inventory_id": shampoo_id, "inventory_name": "Car Shampoo Premium", "quantity": 0.3, "unit": "liter"},
                {"inventory_id": microfiber_id, "inventory_name": "Microfiber Towel", "quantity": 2, "unit": "pcs"}
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Cuci Eksterior Medium",
            "description": "Cuci body eksterior untuk mobil medium (SUV, MPV)",
            "price": 50000,
            "duration_minutes": 30,
            "category": "exterior",
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400",
            "bom": [
                {"inventory_id": shampoo_id, "inventory_name": "Car Shampoo Premium", "quantity": 0.5, "unit": "liter"},
                {"inventory_id": microfiber_id, "inventory_name": "Microfiber Towel", "quantity": 3, "unit": "pcs"}
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Cuci Eksterior Large",
            "description": "Cuci body eksterior untuk mobil large (minibus, pickup)",
            "price": 75000,
            "duration_minutes": 40,
            "category": "exterior",
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400",
            "bom": [
                {"inventory_id": shampoo_id, "inventory_name": "Car Shampoo Premium", "quantity": 0.7, "unit": "liter"},
                {"inventory_id": microfiber_id, "inventory_name": "Microfiber Towel", "quantity": 4, "unit": "pcs"}
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Cuci Interior Basic",
            "description": "Vacuum dan lap interior basic",
            "price": 40000,
            "duration_minutes": 30,
            "category": "interior",
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400",
            "bom": [
                {"inventory_id": interior_cleaner_id, "inventory_name": "Interior Cleaner", "quantity": 0.2, "unit": "liter"},
                {"inventory_id": microfiber_id, "inventory_name": "Microfiber Towel", "quantity": 2, "unit": "pcs"}
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Cuci Interior Premium",
            "description": "Deep cleaning interior dengan shampooing jok",
            "price": 100000,
            "duration_minutes": 60,
            "category": "interior",
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400",
            "bom": [
                {"inventory_id": interior_cleaner_id, "inventory_name": "Interior Cleaner", "quantity": 0.5, "unit": "liter"},
                {"inventory_id": microfiber_id, "inventory_name": "Microfiber Towel", "quantity": 5, "unit": "pcs"}
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Waxing",
            "description": "Waxing untuk kilap maksimal dan proteksi cat",
            "price": 75000,
            "duration_minutes": 45,
            "category": "detailing",
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400",
            "bom": [
                {"inventory_id": wax_id, "inventory_name": "Wax Premium", "quantity": 0.2, "unit": "liter"},
                {"inventory_id": microfiber_id, "inventory_name": "Microfiber Towel", "quantity": 3, "unit": "pcs"}
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Polish Body",
            "description": "Polish body untuk menghilangkan goresan ringan",
            "price": 150000,
            "duration_minutes": 90,
            "category": "polish",
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Nano Coating",
            "description": "Coating nano ceramic untuk proteksi maksimal 6 bulan",
            "price": 500000,
            "duration_minutes": 180,
            "category": "coating",
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Semir Ban",
            "description": "Semir ban untuk tampilan hitam pekat",
            "price": 25000,
            "duration_minutes": 15,
            "category": "detailing",
            "is_active": True,
            "bom": [
                {"inventory_id": tire_black_id, "inventory_name": "Tire Black", "quantity": 0.1, "unit": "liter"}
            ]
        }
    ]
    
    # Insert services one by one
    service_eksterior_medium_id = None
    for service in services:
        existing = await db.services.find_one({"name": service["name"]})
        if not existing:
            await db.services.insert_one(service)
            print(f"✅ Service created: {service['name']}")
            if service["name"] == "Cuci Eksterior Medium":
                service_eksterior_medium_id = service["id"]
        else:
            if service["name"] == "Cuci Eksterior Medium":
                service_eksterior_medium_id = existing["id"]
    print(f"✅ Services ready ({len(services)} services total)")
    
    # ========================================
    # 5. PRODUCTS
    # ========================================
    print("\n🛍️ Seeding Products...")
    products = [
        {
            "id": str(uuid.uuid4()),
            "name": "Pengharum Mobil Lavender",
            "description": "Pengharum mobil aroma lavender tahan hingga 30 hari",
            "price": 25000,
            "category": "accessories",
            "current_stock": 25,
            "min_stock": 10,
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1585155770950-24c3f3440a9f?w=400"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Pengharum Mobil Coffee",
            "description": "Pengharum mobil aroma coffee",
            "price": 25000,
            "category": "accessories",
            "current_stock": 5,  # LOW STOCK
            "min_stock": 10,
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Dashboard Mat Anti-Slip",
            "description": "Mat dashboard anti-slip untuk HP dan aksesoris",
            "price": 35000,
            "category": "accessories",
            "current_stock": 15,
            "min_stock": 5,
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=400"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Chamois Leather Premium",
            "description": "Chamois kulit premium untuk lap kering",
            "price": 75000,
            "category": "supplies",
            "current_stock": 20,
            "min_stock": 5,
            "is_active": True,
            "inventory_id": microfiber_id,
            "image_url": "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=400"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Quick Detailer Spray",
            "description": "Spray detailer untuk kilap instant",
            "price": 50000,
            "category": "chemicals",
            "current_stock": 12,
            "min_stock": 8,
            "is_active": True,
            "image_url": "https://images.unsplash.com/photo-1585155770950-24c3f3440a9f?w=400"
        }
    ]
    
    # Insert products one by one
    product_pengharum_id = None
    for product in products:
        existing = await db.products.find_one({"name": product["name"]})
        if not existing:
            await db.products.insert_one(product)
            print(f"✅ Product created: {product['name']}")
            if "Pengharum" in product["name"] and "Lavender" in product["name"]:
                product_pengharum_id = product["id"]
        else:
            if "Pengharum" in product["name"] and "Lavender" in product["name"]:
                product_pengharum_id = existing["id"]
    print(f"✅ Products ready ({len(products)} products total)")
    
    # ========================================
    # 6. CUSTOMERS
    # ========================================
    print("\n👥 Seeding Customers...")
    customers = [
        {
            "id": str(uuid.uuid4()),
            "name": "Andi Wijaya",
            "phone": "081234567001",
            "email": "andi.wijaya@email.com",
            "vehicle_type": "sedan",
            "license_plate": "B 1234 ABC",
            "total_visits": 15,
            "total_spending": 750000,
            "notes": "Pelanggan setia, prefer cuci eksterior + waxing",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Budi Santoso",
            "phone": "081234567002",
            "email": "budi.santoso@email.com",
            "vehicle_type": "suv",
            "license_plate": "B 5678 DEF",
            "total_visits": 8,
            "total_spending": 400000,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=60)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Citra Dewi",
            "phone": "081234567003",
            "email": "citra.dewi@email.com",
            "vehicle_type": "sedan",
            "license_plate": "B 9012 GHI",
            "total_visits": 20,
            "total_spending": 1200000,
            "notes": "VIP member, sering polish + coating",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=120)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Dewi Lestari",
            "phone": "081234567004",
            "email": "dewi.lestari@email.com",
            "vehicle_type": "mpv",
            "license_plate": "B 3456 JKL",
            "total_visits": 5,
            "total_spending": 275000,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Eko Prasetyo",
            "phone": "081234567005",
            "email": "eko.prasetyo@email.com",
            "vehicle_type": "pickup",
            "license_plate": "B 7890 MNO",
            "total_visits": 3,
            "total_spending": 225000,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat()
        }
    ]
    
    # Insert customers one by one
    customer_andi_id = None
    customer_citra_id = None
    for customer in customers:
        existing = await db.customers.find_one({"phone": customer["phone"]})
        if not existing:
            await db.customers.insert_one(customer)
            print(f"✅ Customer created: {customer['name']}")
            if customer["phone"] == "081234567001":
                customer_andi_id = customer["id"]
            elif customer["phone"] == "081234567003":
                customer_citra_id = customer["id"]
        else:
            if customer["phone"] == "081234567001":
                customer_andi_id = existing["id"]
            elif customer["phone"] == "081234567003":
                customer_citra_id = existing["id"]
    print(f"✅ Customers ready ({len(customers)} customers total)")
    
    # ========================================
    # 7. MEMBERSHIPS
    # ========================================
    print("\n👑 Seeding Memberships...")
    memberships = [
        {
            "id": str(uuid.uuid4()),
            "customer_id": customer_andi_id,
            "customer_name": "Andi Wijaya",
            "customer_phone": "081234567001",
            "membership_type": "premium",
            "price": 500000,
            "start_date": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat(),
            "end_date": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(),
            "status": "active",
            "payment_method": "card",
            "notes": "Member premium sejak 2 minggu lalu",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "customer_id": customer_citra_id,
            "customer_name": "Citra Dewi",
            "customer_phone": "081234567003",
            "membership_type": "vip",
            "price": 750000,
            "start_date": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
            "end_date": (datetime.now(timezone.utc) + timedelta(days=25)).isoformat(),
            "status": "active",
            "payment_method": "card",
            "notes": "VIP member, priority service",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        }
    ]
    
    existing_memberships = await db.memberships.count_documents({})
    if existing_memberships == 0:
        await db.memberships.insert_many(memberships)
        print(f"✅ {len(memberships)} active memberships created")
    else:
        print("ℹ️  Memberships already exist")
    
    # ========================================
    # 8. PROMOTIONS
    # ========================================
    print("\n🎁 Seeding Promotions...")
    promotions = [
        {
            "id": str(uuid.uuid4()),
            "name": "Weekend Special - 15% OFF",
            "description": "Diskon 15% untuk semua layanan setiap weekend",
            "type": "percentage",
            "discount_value": 15,
            "min_transaction": 100000,
            "start_date": datetime.now(timezone.utc).isoformat(),
            "end_date": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat(),
            "is_active": True,
            "terms": "Berlaku Sabtu-Minggu, min transaksi Rp 100.000"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Flash Sale - Rp 25K OFF",
            "description": "Potongan Rp 25.000 untuk transaksi di atas Rp 150.000",
            "type": "fixed",
            "discount_value": 25000,
            "min_transaction": 150000,
            "start_date": datetime.now(timezone.utc).isoformat(),
            "end_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "is_active": True,
            "terms": "Berlaku hari ini, min transaksi Rp 150.000"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Paket Hemat - Buy 2 Get 1",
            "description": "Beli 2 Cuci Eksterior gratis 1",
            "type": "bxgy",
            "buy_quantity": 2,
            "get_quantity": 1,
            "applicable_items": ["Cuci Eksterior Small", "Cuci Eksterior Medium", "Cuci Eksterior Large"],
            "start_date": datetime.now(timezone.utc).isoformat(),
            "end_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "is_active": True,
            "terms": "Berlaku untuk semua tipe Cuci Eksterior"
        }
    ]
    
    existing_promotions = await db.promotions.count_documents({})
    if existing_promotions == 0:
        await db.promotions.insert_many(promotions)
        print(f"✅ {len(promotions)} active promotions created")
    else:
        print("ℹ️  Promotions already exist")
    
    # ========================================
    # 9. SHIFTS & TRANSACTIONS & EXPENSES
    # ========================================
    print("\n💰 Seeding Shifts, Transactions & Expenses...")
    
    # Create sample shift from yesterday (closed)
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    shift_yesterday = {
        "id": str(uuid.uuid4()),
        "kasir_id": kasir1_id,
        "kasir_name": "Budi Santoso",
        "outlet_id": outlet_sudirman_id,
        "opening_balance": 500000,
        "closing_balance": 785000,
        "expected_balance": 790000,
        "variance": -5000,
        "total_cash_sales": 350000,
        "petty_cash": 60000,
        "cash_drop": 0,
        "start_time": yesterday.replace(hour=8, minute=0).isoformat(),
        "end_time": yesterday.replace(hour=17, minute=0).isoformat(),
        "status": "closed",
        "notes": "Shift kemarin, variance minus Rp 5.000"
    }
    
    existing_shift = await db.shifts.find_one({"kasir_id": kasir1_id, "status": "closed"})
    if not existing_shift:
        await db.shifts.insert_one(shift_yesterday)
        print("✅ Sample closed shift created (yesterday)")
        
        # Create sample transactions for yesterday
        transactions_yesterday = [
            {
                "id": str(uuid.uuid4()),
                "invoice_number": f"INV-{yesterday.strftime('%Y%m%d')}-001",
                "kasir_id": kasir1_id,
                "kasir_name": "Budi Santoso",
                "shift_id": shift_yesterday["id"],
                "customer_name": "Walk-in Customer",
                "customer_phone": None,
                "items": [
                    {
                        "type": "service",
                        "service_id": service_eksterior_medium_id,
                        "service_name": "Cuci Eksterior Medium",
                        "quantity": 1,
                        "price": 50000,
                        "subtotal": 50000
                    }
                ],
                "subtotal": 50000,
                "discount": 0,
                "tax": 5500,
                "total": 55500,
                "payment_method": "cash",
                "amount_paid": 60000,
                "change": 4500,
                "created_at": yesterday.replace(hour=9, minute=30).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "invoice_number": f"INV-{yesterday.strftime('%Y%m%d')}-002",
                "kasir_id": kasir1_id,
                "kasir_name": "Budi Santoso",
                "shift_id": shift_yesterday["id"],
                "customer_id": customer_andi_id,
                "customer_name": "Andi Wijaya",
                "customer_phone": "081234567001",
                "items": [
                    {
                        "type": "service",
                        "service_name": "Cuci Eksterior Medium",
                        "quantity": 1,
                        "price": 0,
                        "subtotal": 0
                    }
                ],
                "subtotal": 0,
                "discount": 0,
                "tax": 0,
                "total": 0,
                "payment_method": "subscription",
                "amount_paid": 0,
                "change": 0,
                "notes": "Member Premium - Unlimited wash",
                "created_at": yesterday.replace(hour=11, minute=15).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "invoice_number": f"INV-{yesterday.strftime('%Y%m%d')}-003",
                "kasir_id": kasir1_id,
                "kasir_name": "Budi Santoso",
                "shift_id": shift_yesterday["id"],
                "customer_name": "Farhan Abdullah",
                "customer_phone": "081298765432",
                "items": [
                    {
                        "type": "service",
                        "service_name": "Cuci Eksterior Medium",
                        "quantity": 1,
                        "price": 50000,
                        "subtotal": 50000
                    },
                    {
                        "type": "product",
                        "product_id": product_pengharum_id,
                        "product_name": "Pengharum Mobil Lavender",
                        "quantity": 1,
                        "price": 25000,
                        "subtotal": 25000
                    }
                ],
                "subtotal": 75000,
                "discount": 11250,  # 15% weekend promo
                "tax": 7013,
                "total": 70763,
                "payment_method": "qr",
                "amount_paid": 70763,
                "change": 0,
                "promo_applied": "Weekend Special - 15% OFF",
                "created_at": yesterday.replace(hour=14, minute=45).isoformat()
            }
        ]
        
        await db.transactions.insert_many(transactions_yesterday)
        print(f"✅ {len(transactions_yesterday)} sample transactions created (yesterday)")
        
        # Create expense from petty cash
        expense_yesterday = {
            "id": str(uuid.uuid4()),
            "date": yesterday.replace(hour=12, minute=0).isoformat(),
            "amount": 60000,
            "category": "operational",
            "description": "Petty Cash - Beli tissue, air galon, dll",
            "payment_method": "cash",
            "recorded_by": kasir1_id,
            "shift_id": shift_yesterday["id"],
            "created_at": yesterday.replace(hour=12, minute=5).isoformat()
        }
        await db.expenses.insert_one(expense_yesterday)
        print("✅ Sample expense created (from petty cash)")
    
    # ========================================
    # ADDITIONAL EXPENSES
    # ========================================
    print("\n💸 Seeding Additional Expenses...")
    expenses = [
        {
            "id": str(uuid.uuid4()),
            "date": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
            "amount": 2500000,
            "category": "gaji",
            "description": "Gaji Bulanan - Kasir & Teknisi",
            "payment_method": "transfer",
            "recorded_by": admin_id,
            "notes": "Gaji bulan lalu"
        },
        {
            "id": str(uuid.uuid4()),
            "date": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
            "amount": 500000,
            "category": "utilities",
            "description": "Tagihan Listrik Bulan Lalu",
            "payment_method": "transfer",
            "recorded_by": admin_id
        },
        {
            "id": str(uuid.uuid4()),
            "date": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
            "amount": 1500000,
            "category": "supplies",
            "description": "Pembelian Wax Premium - 20L",
            "payment_method": "cash",
            "recorded_by": kasir1_id,
            "notes": "Restocking inventory"
        },
        {
            "id": str(uuid.uuid4()),
            "date": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "amount": 350000,
            "category": "maintenance",
            "description": "Service Mesin Cuci Tekanan Tinggi",
            "payment_method": "cash",
            "recorded_by": kasir1_id
        }
    ]
    
    existing_expenses = await db.expenses.count_documents({"category": "gaji"})
    if existing_expenses == 0:
        await db.expenses.insert_many(expenses)
        print(f"✅ {len(expenses)} additional expenses created")
    else:
        print("ℹ️  Additional expenses already exist")
    
    print("\n" + "=" * 60)
    print("🎉 COMPREHENSIVE DATA SEEDING COMPLETED!")
    print("=" * 60)
    print("\n📋 Summary:")
    print(f"  ✅ Outlets: {len(outlets)}")
    print(f"  ✅ Users: 1 admin + {len(kasir_users)} staff")
    print(f"  ✅ Inventory: {len(inventory_items)} items")
    print(f"  ✅ Services: {len(services)} services (with BOM)")
    print(f"  ✅ Products: {len(products)} products")
    print(f"  ✅ Customers: {len(customers)} customers")
    print(f"  ✅ Memberships: {len(memberships)} active members")
    print(f"  ✅ Promotions: {len(promotions)} active promos")
    print(f"  ✅ Shifts: 1 closed shift (yesterday)")
    print(f"  ✅ Transactions: 3 sample transactions")
    print(f"  ✅ Expenses: {len(expenses) + 1} recorded expenses")
    print("\n🔑 Login Credentials:")
    print("  👤 Admin: admin / admin123 (owner)")
    print("  👤 Kasir1: kasir1 / kasir123 (kasir - Sudirman)")
    print("  👤 Kasir2: kasir2 / kasir123 (kasir - Kuningan)")
    print("  👤 Manager: manager1 / manager123 (manager - Sudirman)")
    print("\n📱 Test Memberships:")
    print("  👑 Andi Wijaya (081234567001) - Premium Member")
    print("  👑 Citra Dewi (081234567003) - VIP Member")
    print("\n⚠️  Stock Alerts:")
    print("  🔴 Tire Black: 8L (min 10L)")
    print("  🟠 Pengharum Coffee: 5 pcs (min 10 pcs)")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(seed_data())
